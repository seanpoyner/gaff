#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
config();

/**
 * GAFF Gateway - Unified Entry Point to All GAFF MCP Servers
 * 
 * Provides a single MCP server that aggregates tools from all GAFF components:
 * - memory
 * - agent-orchestration  
 * - intent-graph-generator
 * - safety-protocols
 * - tools
 * - quality-check
 * - router
 * 
 * Benefits:
 * - Single connection for agents (vs 7 separate connections)
 * - Unified namespace for all GAFF tools
 * - High-level workflow composition
 * - Simplified configuration
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ServerRouter } from "./server-router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * GAFF Gateway Server
 */
class GaffGateway {
  private server: Server;
  private tools: Tool[] = [];
  private router: ServerRouter;
  
  constructor() {
    this.router = new ServerRouter();
    this.server = new Server(
      {
        name: "gaff-gateway",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupHandlers();
    this.loadTools();
  }
  
  /**
   * Load gaff.json configuration
   */
  private loadGaffConfig() {
    try {
      const configPath = process.env.GAFF_CONFIG_PATH || resolve(__dirname, "../../../gaff.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      return config;
    } catch (error) {
      console.error("⚠️  Could not load gaff.json:", error);
      return null;
    }
  }
  
  /**
   * Load and aggregate tools from all GAFF servers
   */
  private loadTools() {
    const config = this.loadGaffConfig();
    
    // Define all GAFF tools with server prefixes
    this.tools = [
      // ========================================
      // HIGH-LEVEL WORKFLOW TOOLS (Gateway-specific)
      // ========================================
      {
        name: "gaff_create_and_execute_workflow",
        description: "🚀 END-TO-END: Natural language → Orchestration card → Intent graph → Execution → Quality check. " +
                     "This is the main GAFF workflow that composes all servers.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Natural language description of the workflow to create and execute"
            },
            options: {
              type: "object",
              properties: {
                validate_safety: { type: "boolean", description: "Run safety validation (default: true)" },
                optimize_graph: { type: "boolean", description: "Optimize the intent graph (default: true)" },
                quality_check: { type: "boolean", description: "Run quality validation after execution (default: true)" },
                store_in_memory: { type: "boolean", description: "Store results in memory (default: true)" },
                execution_mode: { type: "string", enum: ["sync", "async"], description: "Execution mode (default: sync)" }
              }
            }
          },
          required: ["query"]
        }
      },
      
      // ========================================
      // MEMORY SERVER TOOLS
      // ========================================
      {
        name: "memory_create_entities",
        description: "[MEMORY] Create entities in the knowledge graph (orchestration cards, graphs, results, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  entityType: { type: "string" },
                  observations: { type: "array", items: { type: "string" } }
                },
                required: ["name", "entityType", "observations"]
              }
            }
          },
          required: ["entities"]
        }
      },
      
      {
        name: "memory_search_nodes",
        description: "[MEMORY] Search the knowledge graph for entities matching a query",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" }
          },
          required: ["query"]
        }
      },
      
      {
        name: "memory_read_graph",
        description: "[MEMORY] Read the entire knowledge graph",
        inputSchema: { type: "object", properties: {} }
      },
      
      // ========================================
      // AGENT-ORCHESTRATION TOOLS
      // ========================================
      {
        name: "orchestration_generate_card",
        description: "[ORCHESTRATION] Convert natural language query to orchestration card using gaff.json agents",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Natural language workflow description" },
            gaff_config: { type: "object", description: "Optional: gaff.json config (auto-loaded if not provided)" },
            store_in_memory: { type: "boolean", description: "Store card in memory (default: true)" }
          },
          required: ["query"]
        }
      },
      
      {
        name: "orchestration_list_agents",
        description: "[ORCHESTRATION] List all available agents from gaff.json",
        inputSchema: {
          type: "object",
          properties: {
            filter_by_capability: { type: "string", description: "Optional: filter agents by capability" }
          }
        }
      },
      
      // ========================================
      // INTENT-GRAPH-GENERATOR TOOLS
      // ========================================
      {
        name: "graph_generate",
        description: "[GRAPH] Generate intent graph from orchestration card using AI",
        inputSchema: {
          type: "object",
          properties: {
            orchestration_card: { type: "object", description: "Orchestration card to convert" },
            options: {
              type: "object",
              properties: {
                validate: { type: "boolean" },
                optimize: { type: "boolean" },
                store_in_memory: { type: "boolean" }
              }
            }
          },
          required: ["orchestration_card"]
        }
      },
      
      {
        name: "graph_visualize",
        description: "[GRAPH] Generate Mermaid diagram visualization of an intent graph",
        inputSchema: {
          type: "object",
          properties: {
            graph: { type: "object", description: "Intent graph to visualize" },
            options: {
              type: "object",
              properties: {
                style: { type: "string", enum: ["basic", "detailed", "complete"] },
                direction: { type: "string", enum: ["TB", "LR"] }
              }
            }
          },
          required: ["graph"]
        }
      },
      
      // ========================================
      // ROUTER TOOLS
      // ========================================
      {
        name: "router_execute_graph",
        description: "[ROUTER] Execute an intent graph by routing to appropriate agents",
        inputSchema: {
          type: "object",
          properties: {
            graph: { type: "object", description: "Intent graph to execute" },
            execution_mode: { type: "string", enum: ["sync", "async"], description: "Execution mode" },
            context: { type: "object", description: "Additional execution context" }
          },
          required: ["graph"]
        }
      },
      
      {
        name: "router_get_execution_status",
        description: "[ROUTER] Get status of async execution",
        inputSchema: {
          type: "object",
          properties: {
            execution_id: { type: "string", description: "Execution ID to check" }
          },
          required: ["execution_id"]
        }
      },
      
      // ========================================
      // QUALITY-CHECK TOOLS
      // ========================================
      {
        name: "quality_validate_result",
        description: "[QUALITY] Validate execution result against quality criteria and determine if rerun needed",
        inputSchema: {
          type: "object",
          properties: {
            execution_result: { type: "object", description: "Result to validate" },
            quality_criteria: { type: "object", description: "Quality thresholds and requirements" },
            intent_graph: { type: "object", description: "Original intent graph for context" },
            original_request: { type: "object", description: "Original user request" }
          },
          required: ["execution_result", "quality_criteria"]
        }
      },
      
      {
        name: "quality_score_quality",
        description: "[QUALITY] Calculate quality score for execution results with weighted component scores",
        inputSchema: {
          type: "object",
          properties: {
            execution_result: { type: "object", description: "Execution result to score" },
            scoring_criteria: { 
              type: "object", 
              properties: {
                completeness_weight: { type: "number" },
                accuracy_weight: { type: "number" },
                performance_weight: { type: "number" }
              },
              description: "Weights for scoring components" 
            }
          },
          required: ["execution_result"]
        }
      },
      
      {
        name: "quality_check_completeness",
        description: "[QUALITY] Verify all required outputs are present and properly formatted",
        inputSchema: {
          type: "object",
          properties: {
            execution_result: { type: "object", description: "Result to check" },
            required_outputs: { 
              type: "object",
              properties: {
                required_fields: { type: "array", items: { type: "string" } },
                required_types: { type: "object" },
                required_formats: { type: "object" }
              },
              description: "Output requirements" 
            }
          },
          required: ["execution_result", "required_outputs"]
        }
      },
      
      {
        name: "quality_check_accuracy",
        description: "[QUALITY] Validate accuracy and correctness of results against rules",
        inputSchema: {
          type: "object",
          properties: {
            execution_result: { type: "object", description: "Result to validate" },
            accuracy_criteria: { 
              type: "object",
              properties: {
                validation_rules: { type: "array" },
                business_rules: { type: "array" },
                expected_ranges: { type: "object" }
              },
              description: "Accuracy validation criteria" 
            },
            reference_data: { type: "object", description: "Optional reference for comparison" }
          },
          required: ["execution_result", "accuracy_criteria"]
        }
      },
      
      {
        name: "quality_determine_rerun_strategy",
        description: "[QUALITY] Intelligently decide the best rerun strategy based on failure analysis",
        inputSchema: {
          type: "object",
          properties: {
            execution_result: { type: "object", description: "Execution result" },
            validation_result: { type: "object", description: "Result from validate_execution_result" },
            intent_graph: { type: "object", description: "Original intent graph" },
            failure_history: { type: "array", description: "Previous failures in this execution" }
          },
          required: ["execution_result", "validation_result", "intent_graph"]
        }
      },
      
      {
        name: "quality_analyze_failure_patterns",
        description: "[QUALITY] Identify patterns in failures to help improve workflows",
        inputSchema: {
          type: "object",
          properties: {
            execution_history: { type: "array", description: "History of executions" },
            intent_graph: { type: "object", description: "Intent graph to analyze" },
            time_range: { 
              type: "object",
              properties: {
                start: { type: "string" },
                end: { type: "string" }
              },
              description: "Time range for analysis" 
            }
          },
          required: ["execution_history", "intent_graph"]
        }
      },
      
      // ========================================
      // SAFETY-PROTOCOLS TOOLS
      // ========================================
      {
        name: "safety_validate_compliance",
        description: "[SAFETY] Validate compliance with GDPR, CCPA, SOC2, etc.",
        inputSchema: {
          type: "object",
          properties: {
            orchestration_card: { type: "object", description: "Card to validate" },
            compliance_requirements: { type: "array", items: { type: "string" }, description: "Required compliance standards" }
          },
          required: ["orchestration_card"]
        }
      },
      
      {
        name: "safety_check_guardrails",
        description: "[SAFETY] Check for PII, unsafe content, rate limits, etc.",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Content to check for safety violations" },
            guardrail_types: { 
              type: "array", 
              items: { 
                type: "string",
                enum: ["pii_detection", "content_filtering", "risk_assessment"]
              }, 
              description: "Types of guardrails to enforce" 
            }
          },
          required: ["content", "guardrail_types"]
        }
      },
      
      {
        name: "safety_validate_input",
        description: "[SAFETY] Pre-execution input validation for size, format, and schema compliance",
        inputSchema: {
          type: "object",
          properties: {
            input_data: { type: "object", description: "Input data to validate" },
            validation_rules: { type: "object", description: "Validation rules including max size, allowed formats, schema" }
          },
          required: ["input_data", "validation_rules"]
        }
      },
      
      {
        name: "safety_validate_output",
        description: "[SAFETY] Post-execution output validation for safety, compliance, and schema adherence",
        inputSchema: {
          type: "object",
          properties: {
            output_data: { type: "object", description: "Output data to validate" },
            validation_rules: { type: "object", description: "Validation rules for output" }
          },
          required: ["output_data", "validation_rules"]
        }
      },
      
      {
        name: "safety_enforce_rate_limits",
        description: "[SAFETY] Checks and enforces rate limits per user, IP, and endpoint",
        inputSchema: {
          type: "object",
          properties: {
            user_id: { type: "string", description: "User identifier" },
            ip_address: { type: "string", description: "IP address of the request" },
            endpoint: { type: "string", description: "Endpoint being accessed" }
          },
          required: ["user_id", "ip_address", "endpoint"]
        }
      },
      
      {
        name: "safety_audit_log",
        description: "[SAFETY] Creates security audit log entries for compliance and monitoring",
        inputSchema: {
          type: "object",
          properties: {
            event_type: { type: "string", description: "Type of event (e.g., 'access', 'violation', 'error')" },
            user_id: { type: "string", description: "User identifier" },
            action: { type: "string", description: "Action taken" },
            metadata: { type: "object", description: "Additional context and metadata" }
          },
          required: ["event_type", "user_id", "action"]
        }
      },
      
      // ========================================
      // TOOLS (UTILITIES + HITL)
      // ========================================
      {
        name: "tools_human_in_the_loop",
        description: "[TOOLS] 🚨 Pause execution and request human approval for critical actions",
        inputSchema: {
          type: "object",
          properties: {
            action_description: { type: "string", description: "Clear description of the action requiring approval" },
            action_type: { type: "string", enum: ["approval", "confirmation", "review", "input"] },
            context: { type: "object", description: "Full context about the action" },
            approval_options: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["yes_no", "multi_choice", "text_input"] },
                choices: { type: "array", items: { type: "string" } },
                timeout_seconds: { type: "number" }
              }
            }
          },
          required: ["action_description", "action_type"]
        }
      },
      
      {
        name: "tools_format_data",
        description: "[TOOLS] Convert data between JSON, XML, YAML, CSV formats",
        inputSchema: {
          type: "object",
          properties: {
            data: { type: "string", description: "Data to convert" },
            source_format: { type: "string", enum: ["json", "xml", "yaml", "csv"] },
            target_format: { type: "string", enum: ["json", "xml", "yaml", "csv"] }
          },
          required: ["data", "source_format", "target_format"]
        }
      },
      
      // ========================================
      // SANDBOX TOOLS (Code Execution)
      // ========================================
      {
        name: "sandbox_execute_code",
        description: "[SANDBOX] 🔒 Execute code safely in isolated environment (Python, JavaScript, Shell)",
        inputSchema: {
          type: "object",
          properties: {
            language: {
              type: "string",
              enum: ["python", "javascript", "shell"],
              description: "Programming language to execute"
            },
            code: {
              type: "string",
              description: "Code to execute in sandboxed environment"
            },
            timeout: {
              type: "number",
              description: "Execution timeout in seconds (default: 30)"
            }
          },
          required: ["language", "code"]
        }
      },
      
      // ========================================
      // SEQUENTIAL THINKING TOOLS (Reasoning)
      // ========================================
      {
        name: "thinking_sequential",
        description: "[THINKING] 🧠 Break down complex problems into sequential thought steps for transparent reasoning",
        inputSchema: {
          type: "object",
          properties: {
            thought: {
              type: "string",
              description: "Current thinking step"
            },
            nextThoughtNeeded: {
              type: "boolean",
              description: "Whether another thought step is needed"
            },
            thoughtNumber: {
              type: "integer",
              description: "Current thought number in sequence",
              minimum: 1
            },
            totalThoughts: {
              type: "integer",
              description: "Estimated total thoughts needed (adjustable)",
              minimum: 1
            },
            isRevision: {
              type: "boolean",
              description: "Whether this thought revises previous thinking"
            },
            revisesThought: {
              type: "integer",
              description: "Which thought number is being reconsidered",
              minimum: 1
            },
            branchFromThought: {
              type: "integer",
              description: "Branching point thought number",
              minimum: 1
            },
            branchId: {
              type: "string",
              description: "Branch identifier"
            },
            needsMoreThoughts: {
              type: "boolean",
              description: "If more thoughts are needed than originally estimated"
            }
          },
          required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
        }
      },
    ];
    
    console.error(`✅ Loaded ${this.tools.length} tools from GAFF servers`);
    console.error(`📦 Servers: memory, orchestration, graph-gen, router, quality, safety, tools, sandbox, thinking`);
  }
  
  /**
   * Setup request handlers
   */
  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      console.error(`🔧 Gateway received tool call: ${name}`);
      
      // Route to appropriate handler
      if (name === "gaff_create_and_execute_workflow") {
        return await this.handleEndToEndWorkflow(args as any);
      }
      
      // Route all other tools to their respective servers
      return await this.router.routeToolCall(name, args);
    });
  }
  
  /**
   * Handle the main end-to-end workflow
   */
  private async handleEndToEndWorkflow(args: any) {
    const { query, options = {} } = args;
    
    return {
      content: [{
        type: "text",
        text: `🚀 GAFF End-to-End Workflow\n\n` +
              `Query: "${query}"\n\n` +
              `This would execute:\n` +
              `1. ✅ agent-orchestration.generate_orchestration_card()\n` +
              `2. ✅ safety-protocols.validate_compliance() ${options.validate_safety !== false ? "" : "(skipped)"}\n` +
              `3. ✅ intent-graph-generator.generate_intent_graph()\n` +
              `4. ✅ router.execute_graph()\n` +
              `5. ✅ quality-check.validate_execution_result() ${options.quality_check !== false ? "" : "(skipped)"}\n` +
              `6. ✅ memory.create_entities() (store results) ${options.store_in_memory !== false ? "" : "(skipped)"}\n\n` +
              `Full server-to-server routing coming in next phase!\n\n` +
              `This demonstrates the gateway concept: single tool call orchestrates entire workflow.`
      }]
    };
  }
  
  /**
   * Start the gateway server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("✅ GAFF Gateway running on stdio");
    console.error(`🌐 Unified access to ${this.tools.length} tools from all GAFF servers`);
  }
}

// Start the gateway
const gateway = new GaffGateway();
gateway.start().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});


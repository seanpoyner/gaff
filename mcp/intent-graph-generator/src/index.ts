#!/usr/bin/env node

/**
 * IntentGraph MCP Server
 * Main entry point for the Model Context Protocol server
 * 
 * Provides composable tools for building and managing intent graphs incrementally
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';


// Initialize MCP Server
const server = new Server(
  {
    name: 'intent-graph-mcp-server',
    version: '2.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// ============================================================================
// Tool Definitions
// ============================================================================

const TOOL_DEFINITIONS = [
  // V2: Generation
  {
    name: 'generate_intent_graph',
    description: 'Generate a complete intent graph from an orchestration card using Palmyra',
    inputSchema: {
      type: 'object',
      properties: {
        orchestration_card: {
          type: 'object',
          description: 'Complete context for generating an intent graph',
          properties: {
            user_request: {
              type: 'object',
              description: 'What the user wants to accomplish',
              properties: {
                description: { type: 'string', description: 'Natural language description of the goal' },
                domain: { type: 'string', description: 'Domain context (e.g., e-commerce, healthcare)' },
                success_criteria: { type: 'array', items: { type: 'string' }, description: 'Success criteria' }
              },
              required: ['description']
            },
            available_agents: {
              type: 'array',
              description: 'Agents available for the workflow',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Unique agent identifier' },
                  type: { type: 'string', enum: ['llm', 'api', 'tool', 'validator', 'transformer', 'aggregator', 'router', 'custom'], description: 'Agent type' },
                  capabilities: { type: 'array', items: { type: 'string' }, description: 'What this agent can do' },
                  input_schema: { type: 'object', description: 'Expected input format' },
                  output_schema: { type: 'object', description: 'Expected output format' },
                  description: { type: 'string', description: 'Human-readable description' }
                },
                required: ['name', 'type', 'capabilities', 'input_schema', 'output_schema']
              }
            },
            constraints: {
              type: 'object',
              description: 'Execution constraints',
              properties: {
                max_iterations: { type: 'integer', description: 'Max agent executions' },
                timeout_ms: { type: 'integer', description: 'Overall timeout' },
                budget_limit: { type: 'number', description: 'Max cost in USD' }
              }
            },
            preferences: {
              type: 'object',
              description: 'Optimization preferences',
              properties: {
                optimize_for: { type: 'string', enum: ['speed', 'cost', 'reliability', 'balanced'], description: 'Primary goal' },
                parallelization: { type: 'string', enum: ['none', 'conservative', 'balanced', 'aggressive'], description: 'How aggressively to parallelize' }
              }
            },
            available_mcp_servers: {
              type: 'array',
              description: 'MCP servers and their tools available to agents',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Server identifier (e.g., database-mcp)' },
                  url: { type: 'string', description: 'Server URL if applicable' },
                  authentication: { type: 'string', enum: ['none', 'api_key', 'oauth', 'custom'], description: 'Authentication method' },
                  tools: {
                    type: 'array',
                    description: 'Tools provided by this MCP server',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Tool name' },
                        description: { type: 'string', description: 'What this tool does' },
                        input_schema: { type: 'object', description: 'Expected input format' },
                        output_schema: { type: 'object', description: 'Expected output format' }
                      },
                      required: ['name']
                    }
                  }
                },
                required: ['name', 'tools']
              }
            },
            available_tools: {
              type: 'array',
              description: 'External tools available to agents (non-MCP)',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Tool identifier' },
                  type: { type: 'string', enum: ['notification', 'database', 'api', 'file', 'calculation', 'custom'], description: 'Tool type' },
                  description: { type: 'string', description: 'What this tool does' },
                  input_schema: { type: 'object', description: 'Expected input format' },
                  output_schema: { type: 'object', description: 'Expected output format' },
                  estimated_latency_ms: { type: 'integer', description: 'Estimated latency' },
                  cost_per_call: { type: 'number', description: 'Cost per invocation in USD' }
                },
                required: ['name', 'type', 'input_schema', 'output_schema']
              }
            },
            system_configuration: {
              type: 'object',
              description: 'System-specific configuration for customizing intent graph generation',
              properties: {
                system_name: { type: 'string', description: 'Name of the system' },
                system_description: { type: 'string', description: 'Description of the system' },
                system_purpose: { type: 'string', description: 'Purpose/goal of the system' },
                output_format: { type: 'string', enum: ['json', 'markdown', 'mermaid', 'custom'], description: 'Preferred output format' },
                output_schema: { type: 'object', description: 'JSON Schema for structured output' },
                custom_prompt_template: { type: 'string', description: 'Custom prompt template for the system' },
                example_outputs: {
                  type: 'array',
                  description: 'Example outputs that work in the system',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      output: { type: ['object', 'string'] }
                    }
                  }
                },
                agent_descriptions: {
                  type: 'array',
                  description: 'Detailed agent descriptions for the system',
                  items: {
                    type: 'object',
                    properties: {
                      agent_name: { type: 'string' },
                      description: { type: 'string' },
                      capabilities: { type: 'array', items: { type: 'string' } },
                      example_usage: { type: 'string' }
                    }
                  }
                },
                execution_model: { type: 'string', enum: ['sequential', 'parallel', 'dag', 'custom'], description: 'Execution model' },
                validation_rules: { type: 'array', items: { type: 'string' }, description: 'Validation rules for output' }
              }
            }
          },
          required: ['user_request', 'available_agents']
        },
        options: {
          type: 'object',
          properties: {
            generation_mode: { 
              type: 'string', 
              enum: ['delegate_to_caller', 'use_configured_api'], 
              default: 'use_configured_api',
              description: 'How to generate the graph: delegate_to_caller returns prompts for the calling agent to use its own LLM, use_configured_api calls the configured LLM directly'
            },
            include_artifacts: { type: 'boolean', description: 'Include reasoning and alternatives' },
            artifact_types: { type: 'array', items: { type: 'string', enum: ['reasoning', 'alternatives', 'optimizations'] }, description: 'Types of artifacts to include' },
            format: { type: 'string', enum: ['json', 'yaml'], description: 'Output format' },
            validate: { type: 'boolean', description: 'Validate the generated graph' },
            optimize: { type: 'boolean', description: 'Optimize the generated graph' },
            store_in_memory: { type: 'boolean', description: '⚡ Enable memory caching: Returns instructions to store the graph in memory MCP server for faster subsequent tool calls' },
            memory_key: { type: 'string', description: 'Optional custom key for memory storage (auto-generated if not provided)' }
          }
        }
      },
      required: ['orchestration_card']
    }
  },

  // V2: Validation
  {
    name: 'validate_graph',
    description: 'Validate a generated intent graph structure and return detailed report',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to validate' }
      },
      required: ['graph']
    }
  },

  // V2: Analysis
  {
    name: 'analyze_graph',
    description: '⚡ Analyze graph complexity, metrics, and identify optimization opportunities. Supports memory graph lookup for faster performance.',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to analyze (provide either this OR graph_id)' },
        graph_id: { type: 'string', description: '⚡ Memory key from a previously stored graph (faster than passing full graph)' },
        analysis_types: {
          type: 'array',
          items: { type: 'string', enum: ['complexity', 'parallel_opportunities', 'critical_path', 'bottlenecks'] },
          description: 'Types of analysis to perform (default: all)'
        }
      }
    }
  },

  // V2: Optimization
  {
    name: 'optimize_graph',
    description: '⚡ Optimize an intent graph by applying improvements and restructuring. Supports memory graph lookup for faster performance.',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to optimize (provide either this OR graph_id)' },
        graph_id: { type: 'string', description: '⚡ Memory key from a previously stored graph (faster than passing full graph)' },
        optimization_strategies: {
          type: 'array',
          items: { type: 'string', enum: ['parallelize', 'reduce_latency', 'minimize_cost', 'improve_reliability'] },
          description: 'Optimization strategies to apply (default: all applicable)'
        }
      }
    }
  },

  // V2: Export & Visualization
  {
    name: 'export_graph',
    description: '⚡ Export an intent graph in various formats (json, yaml, dot, mermaid). Supports memory graph lookup for faster performance.',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to export (provide either this OR graph_id)' },
        graph_id: { type: 'string', description: '⚡ Memory key from a previously stored graph (faster than passing full graph)' },
        format: { type: 'string', enum: ['json', 'yaml', 'dot', 'mermaid'], default: 'json' }
      }
    }
  },
  {
    name: 'visualize_graph',
    description: '⚡ Generate rich Mermaid diagram with colors, shapes, tools, instructions, and execution dependencies. Supports memory graph lookup for faster performance.',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The intent graph to visualize (provide either this OR graph_id)' },
        graph_id: { type: 'string', description: '⚡ Memory key from a previously stored graph (faster than passing full graph)' },
        options: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['TB', 'LR'], default: 'TB', description: 'Diagram direction (Top-Bottom or Left-Right)' },
            style: { 
              type: 'string', 
              enum: ['basic', 'detailed', 'complete'], 
              default: 'detailed', 
              description: 'Visualization style preset: basic (minimal), detailed (includes tools and short instructions), complete (everything including conditions)' 
            },
            include_metadata: { type: 'boolean', default: false, description: 'Include graph metrics in comments' },
            include_instructions: { type: 'boolean', description: 'Show abbreviated instructions in nodes (overrides style preset)' },
            include_tools: { type: 'boolean', description: 'Show MCP tools and external tools in nodes (overrides style preset)' },
            include_conditions: { type: 'boolean', description: 'Show edge conditions and triggers (overrides style preset)' }
          }
        }
      },
      required: ['graph']
    }
  },

  // V2: Artifacts
  {
    name: 'generate_artifacts',
    description: 'Generate debugging and logging artifacts for a graph generation session',
    inputSchema: {
      type: 'object',
      properties: {
        graph: { type: 'object', description: 'The generated intent graph' },
        orchestration_card: { type: 'object', description: 'The orchestration card used for generation' },
        artifact_types: {
          type: 'array',
          items: { type: 'string', enum: ['reasoning', 'alternatives', 'optimizations', 'execution_trace', 'debug_info'] },
          description: 'Types of artifacts to generate (default: all)'
        }
      },
      required: ['graph', 'orchestration_card']
    }
  }
];

// ============================================================================
// Request Handlers
// ============================================================================

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[MCP Server] Received list_tools request');
  return {
    tools: TOOL_DEFINITIONS
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`[MCP Server] Received call_tool request: ${request.params.name}`);

  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
  }

  try {
    let response;

    switch (name) {
      // V2: Generation
      case 'generate_intent_graph':
        response = await (await import('./tools/generate.js')).generateIntentGraphTool({
          orchestration_card: args.orchestration_card as any,
          options: args.options as any
        });
        break;

      // V2: Validation
      case 'validate_graph':
        response = await (await import('./tools/helpers.js')).validateGraphTool({
          graph: args.graph as any
        });
        break;

      // V2: Analysis
      case 'analyze_graph':
        response = await (await import('./tools/helpers.js')).analyzeGraphTool({
          graph: args.graph as any,
          graph_id: args.graph_id as any,
          analysis_types: args.analysis_types as any
        });
        break;

      // V2: Optimization
      case 'optimize_graph':
        response = await (await import('./tools/helpers.js')).optimizeGraphTool({
          graph: args.graph as any,
          graph_id: args.graph_id as any,
          optimization_strategies: args.optimization_strategies as any
        });
        break;

      // V2: Export
      case 'export_graph':
        response = await (await import('./tools/helpers.js')).exportGraphTool({
          graph: args.graph as any,
          graph_id: args.graph_id as any,
          format: args.format as any
        });
        break;

      // V2: Visualization
      case 'visualize_graph':
        response = await (await import('./tools/helpers.js')).visualizeGraphTool({
          graph: args.graph as any,
          graph_id: args.graph_id as any,
          options: args.options as any
        });
        break;

      // V2: Artifacts
      case 'generate_artifacts':
        response = await (await import('./tools/helpers.js')).generateArtifactsTool({
          graph: args.graph as any,
          orchestration_card: args.orchestration_card as any,
          artifact_types: args.artifact_types as any
        });
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    // Convert tool response to MCP response format
    if (response.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.result, null, 2)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.error, null, 2)
          }
        ],
        isError: true
      };
    }
  } catch (error) {
    console.error(`[MCP Server] Error handling tool call: ${error}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            details: { error: String(error) }
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// ============================================================================
// Server Lifecycle
// ============================================================================

async function main(): Promise<void> {
  console.error('[MCP Server] Starting IntentGraph MCP Server v2.1.0');
  console.error('[MCP Server] Available tools: 7');
  console.error('[MCP Server] Transport: stdio');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[MCP Server] Server connected and ready');
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('[MCP Server] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[MCP Server] Unhandled rejection:', reason);
  process.exit(1);
});

// Start server
main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});


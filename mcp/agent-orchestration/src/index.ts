#!/usr/bin/env node

/**
 * agent-orchestration MCP Server
 * 
 * Part of GAFF (Graphical Agentic Flow Framework)
 * Purpose: Convert natural language queries to orchestration cards
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

import { LLMClient } from "./llm/client.js";
import {
  loadGaffConfig,
  listAgents,
  getAgent,
  getAllCapabilities,
  GaffConfig,
} from "./utils/gaff-config.js";
import {
  validateOrchestrationCard,
  sanitizeOrchestrationCard,
} from "./utils/validation.js";
import { generateMemoryKey } from "./utils/memory.js";
import { storeCardInMemory } from "./utils/memory-client.js";

/**
 * MCP Tools Definition
 */
const tools: Tool[] = [
  {
    name: "generate_orchestration_card",
    description:
      "Convert a natural language query into a structured orchestration card for intent graph generation. " +
      "Analyzes the query against available agents in gaff.json and creates a comprehensive orchestration card.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language query describing the workflow to create",
        },
        gaff_config: {
          type: "object",
          description: "Optional: gaff.json configuration object. If not provided, reads from GAFF_CONFIG_PATH env var",
        },
        primary_agent_context: {
          type: "string",
          description: "Optional: Additional context from the primary agent's conversation history",
        },
        generation_mode: {
          type: "string",
          enum: ["use_configured_api", "delegate_to_caller"],
          description: "Optional: 'delegate_to_caller' returns prompts for the calling agent to use its own LLM (no API key needed), 'use_configured_api' calls the configured LLM directly (requires API key). Default: 'delegate_to_caller'",
        },
        store_in_memory: {
          type: "boolean",
          description: "Optional: Store the generated card in memory MCP server (default: false)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "validate_orchestration_card",
    description:
      "Validate an orchestration card structure and verify that all referenced agents are available in gaff.json.",
    inputSchema: {
      type: "object",
      properties: {
        orchestration_card: {
          type: "object",
          description: "The orchestration card to validate",
        },
      },
      required: ["orchestration_card"],
    },
  },
  {
    name: "list_agents",
    description:
      "List all available agents from gaff.json configuration, optionally filtered by capability or type.",
    inputSchema: {
      type: "object",
      properties: {
        capability_filter: {
          type: "array",
          items: { type: "string" },
          description: "Optional: Filter agents by specific capabilities",
        },
        type_filter: {
          type: "string",
          description: "Optional: Filter agents by type (e.g., 'validator', 'api', 'llm')",
        },
      },
    },
  },
  {
    name: "get_agent_capabilities",
    description:
      "Get detailed information about a specific agent including input/output schemas, endpoints, and configuration.",
    inputSchema: {
      type: "object",
      properties: {
        agent_name: {
          type: "string",
          description: "Name of the agent to retrieve details for",
        },
      },
      required: ["agent_name"],
    },
  },
  {
    name: "store_card",
    description:
      "Store an orchestration card in the memory MCP server for later retrieval and reference.",
    inputSchema: {
      type: "object",
      properties: {
        orchestration_card: {
          type: "object",
          description: "The orchestration card to store",
        },
        session_id: {
          type: "string",
          description: "Optional: Session ID to associate with the stored card",
        },
        memory_key: {
          type: "string",
          description: "Optional: Custom key for storage (auto-generated if not provided)",
        },
      },
      required: ["orchestration_card"],
    },
  },
];

/**
 * Main MCP Server
 */
class AgentOrchestrationServer {
  private server: Server;
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient();
    this.server = new Server(
      {
        name: "agent-orchestration",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "generate_orchestration_card":
            return await this.handleGenerateOrchestrationCard(args);

          case "validate_orchestration_card":
            return await this.handleValidateOrchestrationCard(args);

          case "list_agents":
            return await this.handleListAgents(args);

          case "get_agent_capabilities":
            return await this.handleGetAgentCapabilities(args);

          case "store_card":
            return await this.handleStoreCard(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: errorMessage,
              }),
            },
          ],
        };
      }
    });
  }

  private async handleGenerateOrchestrationCard(args: any) {
    try {
      const { 
        query, 
        gaff_config, 
        primary_agent_context, 
        generation_mode = 'delegate_to_caller',
        store_in_memory 
      } = args;
      
      if (!query || typeof query !== 'string') {
        throw new Error('query parameter is required and must be a string');
      }
      
      console.error(`📝 Generating orchestration card for query: "${query.substring(0, 100)}..."`);
      console.error(`🎯 Generation mode: ${generation_mode}`);
      
      // Load GAFF configuration
      const config = loadGaffConfig(gaff_config);
      console.error(`✅ Loaded ${Object.keys(config.agents).length} agents from gaff.json`);
      
      // MODE: delegate_to_caller
      // Return prompts for the calling agent (Claude/Cursor) to use its own LLM
      if (generation_mode === 'delegate_to_caller') {
        console.error('🔄 Delegating to caller - returning prompts');
        
        const prompts = this.llmClient.buildPromptsForDelegation(
          query,
          config.agents,
          primary_agent_context
        );
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                mode: 'delegate_to_caller',
                system_prompt: prompts.systemPrompt,
                user_prompt: prompts.userPrompt,
                response_schema: prompts.responseSchema,
                instructions: 'Use your own LLM to generate the orchestration card using the provided prompts. Parse the JSON response and pass it back to validate_orchestration_card if needed.',
                metadata: {
                  generation_timestamp: new Date().toISOString(),
                  generation_mode: 'delegate_to_caller',
                  available_agents_count: Object.keys(config.agents).length
                }
              }, null, 2),
            },
          ],
        };
      }
      
      // MODE: use_configured_api
      // Use the configured LLM to generate the card
      console.error('🤖 Using configured API to call LLM...');
      
      if (!this.llmClient) {
        throw new Error('LLM client not configured. Either set API keys or use generation_mode: "delegate_to_caller"');
      }
      
      const orchestrationCard = await this.llmClient.generateOrchestrationCard(
        query,
        config.agents,
        primary_agent_context
      );
      
      // Sanitize and validate
      const sanitized = sanitizeOrchestrationCard(orchestrationCard);
      const validation = validateOrchestrationCard(sanitized, config);
      
      if (!validation.valid) {
        console.error('⚠️  Validation errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.error('⚠️  Validation warnings:', validation.warnings);
      }
      
      // Optionally store in memory if requested
      let memoryKey: string | undefined;
      if (store_in_memory) {
        console.error('💾 Storing orchestration card in memory...');
        memoryKey = generateMemoryKey(sanitized);
        const storeResult = await storeCardInMemory(sanitized, memoryKey);
        
        if (storeResult.success) {
          console.error(`✅ Stored in memory with key: ${memoryKey}`);
        } else {
          console.error(`⚠️  Failed to store in memory: ${storeResult.error}`);
          memoryKey = undefined;
        }
      }
      
      console.error('✅ Orchestration card generated successfully');
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              mode: 'use_configured_api',
              orchestration_card: sanitized,
              memory_key: memoryKey,
              validation: {
                valid: validation.valid,
                errors: validation.errors,
                warnings: validation.warnings,
              },
              metadata: {
                generation_timestamp: new Date().toISOString(),
                generation_mode: 'use_configured_api'
              }
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error generating orchestration card:', error);
      throw error;
    }
  }

  private async handleValidateOrchestrationCard(args: any) {
    try {
      const { orchestration_card } = args;
      
      if (!orchestration_card) {
        throw new Error('orchestration_card parameter is required');
      }
      
      console.error('🔍 Validating orchestration card...');
      
      // Try to load gaff.json for validation
      let config: GaffConfig | undefined;
      try {
        config = loadGaffConfig();
      } catch (error) {
        console.error('⚠️  Could not load gaff.json for validation');
      }
      
      // Validate
      const validation = validateOrchestrationCard(orchestration_card, config);
      
      console.error(validation.valid ? '✅ Validation passed' : '❌ Validation failed');
      if (validation.errors.length > 0) {
        console.error('Errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.error('Warnings:', validation.warnings);
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              valid: validation.valid,
              errors: validation.errors,
              warnings: validation.warnings,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error validating orchestration card:', error);
      throw error;
    }
  }

  private async handleListAgents(args: any) {
    try {
      const { capability_filter, type_filter } = args;
      
      console.error('📋 Listing agents...');
      
      // Load configuration
      const config = loadGaffConfig();
      
      // Apply filters
      const filters: any = {};
      if (capability_filter && Array.isArray(capability_filter)) {
        filters.capabilities = capability_filter;
      }
      if (type_filter) {
        filters.type = type_filter;
      }
      
      const agents = listAgents(config, filters);
      
      console.error(`✅ Found ${agents.length} agents`);
      
      // Format for response
      const agentList = agents.map(({ name, agent }) => ({
        name,
        type: agent.type,
        description: agent.description,
        capabilities: agent.capabilities,
        has_endpoint: !!agent.endpoint,
        authentication_required: agent.authentication !== 'none',
      }));
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              count: agentList.length,
              agents: agentList,
              all_capabilities: getAllCapabilities(config),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error listing agents:', error);
      throw error;
    }
  }

  private async handleGetAgentCapabilities(args: any) {
    try {
      const { agent_name } = args;
      
      if (!agent_name) {
        throw new Error('agent_name parameter is required');
      }
      
      console.error(`🔍 Getting capabilities for agent: ${agent_name}`);
      
      // Load configuration
      const config = loadGaffConfig();
      
      // Find agent
      const agent = getAgent(config, agent_name);
      
      if (!agent) {
        throw new Error(`Agent not found: ${agent_name}`);
      }
      
      console.error('✅ Agent found');
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              agent: {
                name: agent_name,
                ...agent,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting agent capabilities:', error);
      throw error;
    }
  }

  private async handleStoreCard(args: any) {
    try {
      const { orchestration_card, session_id, memory_key } = args;
      
      if (!orchestration_card) {
        throw new Error('orchestration_card parameter is required');
      }
      
      console.error('💾 Storing orchestration card...');
      
      // Generate memory key if not provided
      const key = memory_key || generateMemoryKey(orchestration_card);
      
      // Store in memory MCP server
      const storeResult = await storeCardInMemory(orchestration_card, key);
      
      if (storeResult.success) {
        console.error(`✅ Successfully stored with key: ${key}`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                memory_key: key,
                session_id: session_id || null,
                message: "Orchestration card stored successfully",
                note: "You can now pass this memory_key to intent-graph-generator",
              }, null, 2),
            },
          ],
        };
      } else {
        throw new Error(storeResult.error || 'Failed to store in memory');
      }
    } catch (error) {
      console.error('❌ Error storing card:', error);
      throw error;
    }
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error: Error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("agent-orchestration MCP Server running on stdio");
  }
}

/**
 * Start the server
 */
const server = new AgentOrchestrationServer();
server.run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


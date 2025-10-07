#!/usr/bin/env node
/**
 * Router MCP Server - The Execution Engine
 * 
 * Executes intent graphs by orchestrating agents, managing state via memory,
 * and coordinating HITL (Human-in-the-Loop) interactions.
 * 
 * Part of GAFF (Graphical Agentic Flow Framework)
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import type { IntentGraph, ExecutionConfig, NodeResult, ExecutionResult } from './types.js';
import { getMemoryClient, type ExecutionState } from './utils/memory-client.js';
import {
  validateDAG,
  topologicalSort,
  groupNodesForParallelExecution,
  resolveNodeInput,
  isHITLNode,
} from './utils/graph-executor.js';
import { routeToAgent } from './utils/agent-router.js';

/**
 * MCP Tools Definition
 */
const tools: Tool[] = [
  {
    name: 'execute_graph',
    description: 'Execute an intent graph by routing to agents in correct order with memory-based state management',
    inputSchema: {
      type: 'object',
      properties: {
        graph: {
          type: 'object',
          description: 'Intent graph to execute',
        },
        graph_memory_key: {
          type: 'string',
          description: 'Memory key to retrieve intent graph from memory MCP server',
        },
        execution_mode: {
          type: 'string',
          enum: ['sync', 'async'],
          description: 'Execution mode (default: sync)',
        },
        context: {
          type: 'object',
          description: 'Initial context/variables for execution',
        },
        config: {
          type: 'object',
          properties: {
            max_parallel: { type: 'number', description: 'Max parallel nodes (default: 5)' },
            timeout_ms: { type: 'number', description: 'Overall timeout (default: 300000)' },
            enable_quality_check: { type: 'boolean', description: 'Enable quality checking (default: false)' },
            enable_hitl: { type: 'boolean', description: 'Enable HITL pausing (default: true)' },
            max_retries: { type: 'number', description: 'Max node retries (default: 3)' },
            store_state_in_memory: { type: 'boolean', description: 'Store execution state in memory (default: true)' },
          },
        },
      },
    },
  },
  {
    name: 'route_to_agent',
    description: 'Route a single request to a specific agent',
    inputSchema: {
      type: 'object',
      properties: {
        agent_name: { type: 'string' },
        tool_name: { type: 'string' },
        input: { type: 'object' },
        timeout_ms: { type: 'number' },
        retry_config: {
          type: 'object',
          properties: {
            max_attempts: { type: 'number' },
            backoff_strategy: { type: 'string', enum: ['linear', 'exponential'] },
          },
        },
      },
      required: ['agent_name', 'tool_name', 'input'],
    },
  },
  {
    name: 'get_execution_status',
    description: 'Get current status of execution from memory',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: { type: 'string' },
      },
      required: ['execution_id'],
    },
  },
  {
    name: 'pause_execution',
    description: 'Pause running execution',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['execution_id', 'reason'],
    },
  },
  {
    name: 'resume_execution',
    description: 'Resume paused execution',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: { type: 'string' },
        approval_decision: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            modified_context: { type: 'object' },
          },
        },
      },
      required: ['execution_id'],
    },
  },
  {
    name: 'cancel_execution',
    description: 'Cancel running or paused execution',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['execution_id', 'reason'],
    },
  },
];

/**
 * Generate unique execution ID
 */
function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main Router Server Class
 */
class RouterServer {
  private server: Server;
  private memoryClient = getMemoryClient();

  constructor() {
    this.server = new Server(
  {
    name: 'router-mcp-server',
    version: '1.0.0',
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

      try {
  switch (name) {
          case 'execute_graph':
            return await this.handleExecuteGraph(args);
          case 'route_to_agent':
            return await this.handleRouteToAgent(args);
          case 'get_execution_status':
            return await this.handleGetExecutionStatus(args);
          case 'pause_execution':
            return await this.handlePauseExecution(args);
          case 'resume_execution':
            return await this.handleResumeExecution(args);
          case 'cancel_execution':
            return await this.handleCancelExecution(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Router] Error in ${name}:`, errorMessage);
        
        // For execute_graph, return proper execution result format even on error
        if (name === 'execute_graph') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  execution_id: generateExecutionId(),
                  status: 'failed',
                  results: {},
                  execution_time_ms: 0,
                  nodes_executed: 0,
                  nodes_failed: [],
                  context: {},
                  error: errorMessage,
                }, null, 2),
              },
            ],
          };
        }
        
        // For other tools, return error format
        return {
          content: [
            {
              type: 'text',
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

  /**
   * Execute Intent Graph
   */
  private async handleExecuteGraph(args: any) {
    const {
      graph,
      graph_memory_key,
      execution_mode = 'sync',
      context = {},
      config = {},
    } = args;

    // TODO: If graph_memory_key provided, retrieve graph from memory
    const intentGraph: IntentGraph = graph || {};

    const executionConfig: ExecutionConfig = {
      max_parallel: config.max_parallel || 5,
      timeout_ms: config.timeout_ms || 300000,
      enable_quality_check: config.enable_quality_check || false,
      enable_hitl: config.enable_hitl !== undefined ? config.enable_hitl : true,
      max_retries: config.max_retries || 3,
      store_state_in_memory: config.store_state_in_memory !== undefined ? config.store_state_in_memory : true,
    };

    console.error('[Router] Starting graph execution');
    console.error(`[Router] Nodes: ${intentGraph.nodes?.length || 0}`);
    console.error(`[Router] Config:`, JSON.stringify(executionConfig));

    // Validate DAG
    const validation = validateDAG(intentGraph);
    if (!validation.valid) {
      throw new Error(`Invalid graph: ${validation.error}`);
    }

    const execution_id = generateExecutionId();
    const startTime = Date.now();

      // Initialize execution state
    const executionState: ExecutionState = {
        execution_id,
        status: 'running',
      graph: intentGraph,
        current_node: null,
        completed_nodes: [],
        failed_nodes: [],
        results: {},
      context,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // Store initial state in memory
    if (executionConfig.store_state_in_memory) {
      await this.memoryClient.storeExecutionState(executionState);
    }

    // Perform topological sort
    const sortedNodes = topologicalSort(intentGraph);
    console.error('[Router] Topological order:', sortedNodes);

    // Group nodes for parallel execution if enabled
    const executionGroups = executionConfig.max_parallel! > 1
      ? groupNodesForParallelExecution(intentGraph, sortedNodes)
      : sortedNodes.map(nodeId => [nodeId]);

    console.error(`[Router] Execution groups: ${executionGroups.length}`);

    const results: Record<string, NodeResult> = {};
    const failedNodes: string[] = [];

    // Execute node groups
    for (let groupIdx = 0; groupIdx < executionGroups.length; groupIdx++) {
      const group = executionGroups[groupIdx];
      console.error(`[Router] Executing group ${groupIdx + 1}/${executionGroups.length} with ${group.length} node(s)`);

      // Execute nodes in parallel within group
      const groupPromises = group.map(async (nodeId) => {
        const node = intentGraph.nodes.find(n => (n.id || n.node_id) === nodeId);
        if (!node) {
          throw new Error(`Node not found: ${nodeId}`);
        }

        // Update current node
        executionState.current_node = nodeId;
        if (executionConfig.store_state_in_memory) {
          await this.memoryClient.storeExecutionState(executionState);
        }

        // Check for HITL
        if (executionConfig.enable_hitl && isHITLNode(node)) {
          console.error(`[Router] HITL node detected: ${nodeId} - PAUSING`);

          executionState.status = 'paused_for_approval';
          executionState.paused_at_node = nodeId;
          executionState.paused_at = new Date().toISOString();

          if (executionConfig.store_state_in_memory) {
            await this.memoryClient.storeExecutionState(executionState);
          }

          throw new Error('HITL_PAUSE'); // Special error to break execution
        }

        // Resolve input variables
        const resolvedInput = resolveNodeInput(node, results, executionState.context);

        // Apply global timeout if node doesn't have one
        if (!node.timeout_ms && executionConfig.timeout_ms) {
          node.timeout_ms = executionConfig.timeout_ms;
        }

        // Execute node
        const nodeResult = await routeToAgent(node, resolvedInput);

        // Store result
        results[nodeId] = nodeResult;
        executionState.results[nodeId] = nodeResult;

        if (nodeResult.success) {
          executionState.completed_nodes.push(nodeId);

          // Store node result in memory
          if (executionConfig.store_state_in_memory) {
            await this.memoryClient.storeNodeResult(execution_id, nodeId, nodeResult.result);
          }
        } else {
          executionState.failed_nodes.push(nodeId);
          failedNodes.push(nodeId);
        }

        // Update state
        if (executionConfig.store_state_in_memory) {
          await this.memoryClient.storeExecutionState(executionState);
        }

        return nodeResult;
      });

      try {
        await Promise.all(groupPromises);
      } catch (error: any) {
        if (error.message === 'HITL_PAUSE') {
          // HITL pause - return paused state
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                    execution_id,
                    status: 'paused_for_approval',
                  paused_at_node: executionState.paused_at_node,
                    waiting_for_approval: true,
                  message: 'Execution paused for human approval',
                    resume_instructions: `Call resume_execution with execution_id="${execution_id}"`,
                  partial_results: results,
                }, null, 2),
              },
            ],
          };
        }
        throw error;
      }
    }

    const executionTime = Date.now() - startTime;
    const status = failedNodes.length > 0 ? 'failed' : 'completed';

    executionState.status = status;
    executionState.updated_at = new Date().toISOString();

    if (executionConfig.store_state_in_memory) {
      await this.memoryClient.storeExecutionState(executionState);
    }

      return {
        content: [
          {
            type: 'text',
          text: JSON.stringify({
                execution_id,
                status,
                results,
            execution_time_ms: executionTime,
            nodes_executed: Object.keys(results).length,
            nodes_failed: failedNodes,
            context: executionState.context,
          }, null, 2),
          },
        ],
      };
    }

  /**
   * Route to single agent
   */
  private async handleRouteToAgent(args: any) {
    const { agent_name, tool_name, input, timeout_ms, retry_config } = args;

    console.error(`[Router] Single agent call: ${agent_name}.${tool_name}`);

    const node = {
      id: 'single_call',
      agent: agent_name,
      tool: tool_name,
      input,
      dependencies: [],
      timeout_ms,
      retry_policy: retry_config,
    };

    const result = await routeToAgent(node, input);

          return {
            content: [
              {
                type: 'text',
          text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

  /**
   * Get execution status from memory
   */
  private async handleGetExecutionStatus(args: any) {
    const { execution_id } = args;

    console.error(`[Router] Getting status for: ${execution_id}`);

    const state = await this.memoryClient.retrieveExecutionState(execution_id);

      if (!state) {
      throw new Error(`Execution not found: ${execution_id}`);
      }

      const total_nodes = state.graph?.nodes?.length || 0;
    const progress_percentage = total_nodes > 0
      ? (state.completed_nodes.length / total_nodes) * 100
      : 0;

      return {
        content: [
          {
            type: 'text',
          text: JSON.stringify({
                execution_id,
                status: state.status,
                progress_percentage,
            nodes_completed: state.completed_nodes.length,
                nodes_total: total_nodes,
            nodes_failed: state.failed_nodes.length,
                current_node: state.current_node,
                created_at: state.created_at,
                updated_at: state.updated_at,
                waiting_for_approval: state.status === 'paused_for_approval' ? {
                  node_id: state.paused_at_node,
                  paused_at: state.paused_at,
                } : undefined,
          }, null, 2),
          },
        ],
      };
    }

  /**
   * Pause execution
   */
  private async handlePauseExecution(args: any) {
    const { execution_id, reason } = args;

    const state = await this.memoryClient.retrieveExecutionState(execution_id);

      if (!state) {
      throw new Error(`Execution not found: ${execution_id}`);
      }

      if (state.status !== 'running') {
        throw new Error(`Cannot pause execution in status: ${state.status}`);
      }

      state.status = 'paused_for_approval';
      state.paused_at = new Date().toISOString();
      state.paused_reason = reason;

    await this.memoryClient.storeExecutionState(state);

      return {
        content: [
          {
            type: 'text',
          text: JSON.stringify({
                execution_id,
                paused: true,
                paused_at_node: state.current_node,
          }, null, 2),
          },
        ],
      };
    }

  /**
   * Resume execution
   */
  private async handleResumeExecution(args: any) {
    const { execution_id, approval_decision } = args;

    const state = await this.memoryClient.retrieveExecutionState(execution_id);

      if (!state) {
      throw new Error(`Execution not found: ${execution_id}`);
      }

      if (state.status !== 'paused_for_approval') {
        throw new Error(`Cannot resume execution in status: ${state.status}`);
      }

    // TODO: Continue execution from paused node
      state.status = 'running';
      state.updated_at = new Date().toISOString();

    await this.memoryClient.storeExecutionState(state);

      return {
        content: [
          {
            type: 'text',
          text: JSON.stringify({
                execution_id,
                resumed: true,
            message: 'Full resume logic needs implementation - this marks as resumed',
          }, null, 2),
          },
        ],
      };
    }

  /**
   * Cancel execution
   */
  private async handleCancelExecution(args: any) {
    const { execution_id, reason } = args;

    const state = await this.memoryClient.retrieveExecutionState(execution_id);

      if (!state) {
      throw new Error(`Execution not found: ${execution_id}`);
      }

      state.status = 'cancelled';
      state.cancelled_at = new Date().toISOString();
      state.cancelled_reason = reason;

    await this.memoryClient.storeExecutionState(state);

      return {
        content: [
          {
            type: 'text',
          text: JSON.stringify({
                execution_id,
                cancelled: true,
          }, null, 2),
          },
        ],
      };
    }

  private setupErrorHandling(): void {
    this.server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.memoryClient.disconnect();
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Router MCP Server running on stdio');
    console.error('✅ Memory-backed state management enabled');
    console.error('✅ DAG validation and topological execution');
    console.error('✅ Parallel execution support');
    console.error('✅ HITL integration ready');
  }
}

// Start the server
const server = new RouterServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

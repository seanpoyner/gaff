/**
 * Memory MCP Server Client for Router
 * 
 * Manages execution state, intermediate results, and workflow context
 * in the memory MCP server for stateful workflow execution.
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ExecutionState {
  execution_id: string;
  status: 'running' | 'paused_for_approval' | 'completed' | 'failed' | 'cancelled';
  graph: any;
  current_node: string | null;
  completed_nodes: string[];
  failed_nodes: string[];
  results: Record<string, any>;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
  paused_at?: string;
  paused_at_node?: string;
  paused_reason?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
}

export class MemoryClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected = false;

  /**
   * Connect to the memory MCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const memoryCommand = process.env.MEMORY_MCP_COMMAND || 'npx';
      const memoryArgs = process.env.MEMORY_MCP_ARGS 
        ? process.env.MEMORY_MCP_ARGS.split(',')
        : ['-y', '@modelcontextprotocol/server-memory'];

      console.error('[MemoryClient] Connecting to memory server...');

      this.transport = new StdioClientTransport({
        command: memoryCommand,
        args: memoryArgs,
      });

      this.client = new Client(
        {
          name: 'router-memory-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
      this.isConnected = true;
      console.error('[MemoryClient] Successfully connected to memory server');
    } catch (error) {
      console.error('[MemoryClient] Failed to connect to memory server:', error);
      throw new Error(`Failed to connect to memory server: ${error}`);
    }
  }

  /**
   * Store execution state
   */
  async storeExecutionState(state: ExecutionState): Promise<void> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      const stateData = JSON.stringify(state);
      const metadata = JSON.stringify({
        status: state.status,
        nodes_completed: state.completed_nodes.length,
        nodes_failed: state.failed_nodes.length,
        updated_at: state.updated_at,
      });

      console.error('[MemoryClient] Storing execution state:', state.execution_id);

      await this.client!.callTool({
        name: 'create_entities',
        arguments: {
          entities: [
            {
              name: state.execution_id,
              entityType: 'execution_state',
              observations: [
                `state_data: ${stateData}`,
                `metadata: ${metadata}`,
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error('[MemoryClient] Failed to store execution state:', error);
      throw error;
    }
  }

  /**
   * Store node result
   */
  async storeNodeResult(executionId: string, nodeId: string, result: any): Promise<void> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      const resultData = JSON.stringify(result);
      const key = `${executionId}_node_${nodeId}`;

      console.error('[MemoryClient] Storing node result:', key);

      await this.client!.callTool({
        name: 'create_entities',
        arguments: {
          entities: [
            {
              name: key,
              entityType: 'node_result',
              observations: [
                `execution_id: ${executionId}`,
                `node_id: ${nodeId}`,
                `result_data: ${resultData}`,
                `stored_at: ${new Date().toISOString()}`,
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error('[MemoryClient] Failed to store node result:', error);
      // Don't throw - node results are best-effort
    }
  }

  /**
   * Store workflow context/variables
   */
  async storeContext(executionId: string, key: string, value: any): Promise<void> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      const valueData = JSON.stringify(value);
      const contextKey = `${executionId}_context_${key}`;

      console.error('[MemoryClient] Storing context:', contextKey);

      await this.client!.callTool({
        name: 'create_entities',
        arguments: {
          entities: [
            {
              name: contextKey,
              entityType: 'workflow_context',
              observations: [
                `execution_id: ${executionId}`,
                `key: ${key}`,
                `value: ${valueData}`,
                `stored_at: ${new Date().toISOString()}`,
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error('[MemoryClient] Failed to store context:', error);
      // Don't throw - context storage is best-effort
    }
  }

  /**
   * Retrieve execution state
   */
  async retrieveExecutionState(executionId: string): Promise<ExecutionState | null> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      console.error('[MemoryClient] Retrieving execution state:', executionId);

      const result = await this.client!.callTool({
        name: 'open_nodes',
        arguments: {
          names: [executionId],
        },
      });

      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const content = result.content[0];
        if (content.type === 'text' && typeof content.text === 'string') {
          const parsed = JSON.parse(content.text);
          if (parsed.entities && Array.isArray(parsed.entities) && parsed.entities.length > 0) {
            const entity = parsed.entities[0];
            if (entity.observations && Array.isArray(entity.observations)) {
              const stateDataObs = entity.observations.find((obs: string) => obs.startsWith('state_data:'));
              if (stateDataObs) {
                const stateDataJson = stateDataObs.substring('state_data:'.length).trim();
                return JSON.parse(stateDataJson) as ExecutionState;
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[MemoryClient] Failed to retrieve execution state:', error);
      return null;
    }
  }

  /**
   * Retrieve node result
   */
  async retrieveNodeResult(executionId: string, nodeId: string): Promise<any | null> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      const key = `${executionId}_node_${nodeId}`;
      console.error('[MemoryClient] Retrieving node result:', key);

      const result = await this.client!.callTool({
        name: 'open_nodes',
        arguments: {
          names: [key],
        },
      });

      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const content = result.content[0];
        if (content.type === 'text' && typeof content.text === 'string') {
          const parsed = JSON.parse(content.text);
          if (parsed.entities && Array.isArray(parsed.entities) && parsed.entities.length > 0) {
            const entity = parsed.entities[0];
            if (entity.observations && Array.isArray(entity.observations)) {
              const resultDataObs = entity.observations.find((obs: string) => obs.startsWith('result_data:'));
              if (resultDataObs) {
                const resultDataJson = resultDataObs.substring('result_data:'.length).trim();
                return JSON.parse(resultDataJson);
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[MemoryClient] Failed to retrieve node result:', error);
      return null;
    }
  }

  /**
   * Disconnect from the memory server
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.transport = null;
        console.error('[MemoryClient] Disconnected from memory server');
      } catch (error) {
        console.error('[MemoryClient] Error during disconnect:', error);
      }
    }
  }
}

// Singleton instance
let memoryClient: MemoryClient | null = null;

/**
 * Get or create the memory client singleton
 */
export function getMemoryClient(): MemoryClient {
  if (!memoryClient) {
    memoryClient = new MemoryClient();
  }
  return memoryClient;
}


/**
 * Memory MCP Server Client
 * 
 * Connects to the memory MCP server to store and retrieve intent graphs.
 * This enables the intent-graph server to directly manage state persistence
 * without requiring the calling agent to manually execute storage commands.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { IntentGraph } from '../types.js';

export interface MemoryStoreResult {
  success: boolean;
  memory_key: string;
  error?: string;
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
      // Determine the memory server command based on environment
      // This should match the memory server configuration in claude_desktop_config.json
      const memoryCommand = process.env.MEMORY_MCP_COMMAND || 'npx';
      const memoryArgs = process.env.MEMORY_MCP_ARGS 
        ? process.env.MEMORY_MCP_ARGS.split(',')
        : ['-y', '@modelcontextprotocol/server-memory'];

      console.error('[MemoryClient] Connecting to memory server...');
      console.error('[MemoryClient] Command:', memoryCommand);
      console.error('[MemoryClient] Args:', memoryArgs);

      this.transport = new StdioClientTransport({
        command: memoryCommand,
        args: memoryArgs,
      });

      this.client = new Client(
        {
          name: 'intent-graph-memory-client',
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
   * Store an intent graph in memory
   */
  async storeGraph(graph: IntentGraph, key: string): Promise<MemoryStoreResult> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      // Serialize the graph data
      const graphData = JSON.stringify(graph);
      const metadata = JSON.stringify({
        node_count: graph.nodes?.length || 0,
        edge_count: graph.edges?.length || 0,
        execution_model: graph.execution_plan?.execution_strategy || 'unknown',
        created_at: new Date().toISOString(),
        memory_key: key,
      });

      console.error('[MemoryClient] Storing graph with key:', key);
      console.error('[MemoryClient] Graph size:', graphData.length, 'chars');

      // Call memory:create_entities
      const result = await this.client!.callTool({
        name: 'create_entities',
        arguments: {
          entities: [
            {
              name: key,
              entityType: 'intent_graph',
              observations: [
                `graph_data: ${graphData}`,
                `metadata: ${metadata}`,
              ],
            },
          ],
        },
      });

      console.error('[MemoryClient] Storage result:', JSON.stringify(result).substring(0, 200));

      return {
        success: true,
        memory_key: key,
      };
    } catch (error) {
      console.error('[MemoryClient] Failed to store graph:', error);
      return {
        success: false,
        memory_key: key,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Retrieve an intent graph from memory
   */
  async retrieveGraph(key: string): Promise<IntentGraph | null> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      console.error('[MemoryClient] Retrieving graph with key:', key);

      // Call memory:open_nodes
      const result = await this.client!.callTool({
        name: 'open_nodes',
        arguments: {
          names: [key],
        },
      });

      console.error('[MemoryClient] Retrieval result:', JSON.stringify(result).substring(0, 200));

      // Parse the result to extract the graph data
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const content = result.content[0];
        if (content.type === 'text' && typeof content.text === 'string') {
          const parsed = JSON.parse(content.text);
          if (parsed.entities && Array.isArray(parsed.entities) && parsed.entities.length > 0) {
            const entity = parsed.entities[0];
            if (entity.observations && Array.isArray(entity.observations)) {
              // Find the graph_data observation
              const graphDataObs = entity.observations.find((obs: string) => obs.startsWith('graph_data:'));
              if (graphDataObs) {
                const graphDataJson = graphDataObs.substring('graph_data:'.length).trim();
                return JSON.parse(graphDataJson) as IntentGraph;
              }
            }
          }
        }
      }

      console.error('[MemoryClient] No graph data found for key:', key);
      return null;
    } catch (error) {
      console.error('[MemoryClient] Failed to retrieve graph:', error);
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

/**
 * Store a graph in memory (convenience function)
 */
export async function storeGraphInMemory(
  graph: IntentGraph,
  key: string
): Promise<MemoryStoreResult> {
  const client = getMemoryClient();
  return client.storeGraph(graph, key);
}

/**
 * Retrieve a graph from memory (convenience function)
 */
export async function retrieveGraphFromMemory(key: string): Promise<IntentGraph | null> {
  const client = getMemoryClient();
  return client.retrieveGraph(key);
}


/**
 * Memory MCP Server Client
 * 
 * Connects to the memory MCP server to store and retrieve orchestration cards.
 * This enables the agent-orchestration server to persist state that can be
 * passed to intent-graph-generator via memory key.
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

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
          name: 'agent-orchestration-memory-client',
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
   * Store an orchestration card in memory
   */
  async storeCard(card: any, key: string): Promise<MemoryStoreResult> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      // Serialize the card data
      const cardData = JSON.stringify(card);
      const metadata = JSON.stringify({
        agent_count: card.available_agents?.length || 0,
        domain: card.user_request?.domain || 'unknown',
        created_at: new Date().toISOString(),
        memory_key: key,
      });

      console.error('[MemoryClient] Storing orchestration card with key:', key);
      console.error('[MemoryClient] Card size:', cardData.length, 'chars');

      // Call memory:create_entities
      const result = await this.client!.callTool({
        name: 'create_entities',
        arguments: {
          entities: [
            {
              name: key,
              entityType: 'orchestration_card',
              observations: [
                `card_data: ${cardData}`,
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
      console.error('[MemoryClient] Failed to store card:', error);
      return {
        success: false,
        memory_key: key,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Retrieve an orchestration card from memory
   */
  async retrieveCard(key: string): Promise<any | null> {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      console.error('[MemoryClient] Retrieving card with key:', key);

      // Call memory:open_nodes
      const result = await this.client!.callTool({
        name: 'open_nodes',
        arguments: {
          names: [key],
        },
      });

      console.error('[MemoryClient] Retrieval result:', JSON.stringify(result).substring(0, 200));

      // Parse the result to extract the card data
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const content = result.content[0];
        if (content.type === 'text' && typeof content.text === 'string') {
          const parsed = JSON.parse(content.text);
          if (parsed.entities && Array.isArray(parsed.entities) && parsed.entities.length > 0) {
            const entity = parsed.entities[0];
            if (entity.observations && Array.isArray(entity.observations)) {
              // Find the card_data observation
              const cardDataObs = entity.observations.find((obs: string) => obs.startsWith('card_data:'));
              if (cardDataObs) {
                const cardDataJson = cardDataObs.substring('card_data:'.length).trim();
                return JSON.parse(cardDataJson);
              }
            }
          }
        }
      }

      console.error('[MemoryClient] No card data found for key:', key);
      return null;
    } catch (error) {
      console.error('[MemoryClient] Failed to retrieve card:', error);
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
 * Store a card in memory (convenience function)
 */
export async function storeCardInMemory(
  card: any,
  key: string
): Promise<MemoryStoreResult> {
  const client = getMemoryClient();
  return client.storeCard(card, key);
}

/**
 * Retrieve a card from memory (convenience function)
 */
export async function retrieveCardFromMemory(key: string): Promise<any | null> {
  const client = getMemoryClient();
  return client.retrieveCard(key);
}


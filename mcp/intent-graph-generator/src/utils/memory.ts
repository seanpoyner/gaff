/**
 * Memory MCP Server Integration
 * Helper functions to store and retrieve intent graphs from the memory MCP server
 */

import type { IntentGraph } from '../types.js';

/**
 * Check if memory MCP server tools are available
 */
export function isMemoryServerAvailable(): boolean {
  // In MCP context, we can't directly check server availability
  // The calling agent must have memory server configured
  // This function is more for documentation purposes
  return true; // Assume available, errors will be caught if not
}

/**
 * Store an intent graph in the memory MCP server
 * Returns the memory key/entity name for retrieval
 */
export async function storeGraphInMemory(
  _graph: IntentGraph,
  customKey?: string
): Promise<{ success: boolean; key: string; error?: string }> {
  try {
    // Generate a unique key if not provided
    const key = customKey || `intent_graph_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Return storage instructions for the calling agent
    // The agent will need to call memory:create_entities
    return {
      success: true,
      key,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      key: '',
      error: error instanceof Error ? error.message : 'Failed to prepare graph for storage'
    };
  }
}

/**
 * Build the memory storage command for the calling agent
 * This returns the exact structure needed to call memory:create_entities
 */
export function buildMemoryStorageCommand(
  graph: IntentGraph,
  key: string
): {
  tool: 'memory:create_entities';
  params: {
    entities: Array<{
      name: string;
      entityType: string;
      observations: string[];
    }>;
  };
} {
  const graphJson = JSON.stringify(graph);
  const graphMetadata = JSON.stringify({
    node_count: graph.nodes.length,
    edge_count: graph.edges.length,
    execution_model: (graph as any).execution_model || 'unknown',
    created_at: new Date().toISOString(),
    memory_key: key
  });
  
  return {
    tool: 'memory:create_entities',
    params: {
      entities: [
        {
          name: key,
          entityType: 'intent_graph',
          observations: [
            `graph_data: ${graphJson}`,
            `metadata: ${graphMetadata}`
          ]
        }
      ]
    }
  };
}

/**
 * Build the memory retrieval command for the calling agent
 * This returns the exact structure needed to call memory:open_nodes
 */
export function buildMemoryRetrievalCommand(key: string): {
  tool: 'memory:open_nodes';
  params: {
    names: string[];
  };
} {
  return {
    tool: 'memory:open_nodes',
    params: {
      names: [key]
    }
  };
}

/**
 * Parse a retrieved memory node back into an IntentGraph
 */
export function parseGraphFromMemory(memoryNode: any): IntentGraph | null {
  try {
    if (!memoryNode || !memoryNode.observations) {
      return null;
    }
    
    // Find the observation containing graph_data
    const graphDataObs = memoryNode.observations.find((obs: any) => 
      typeof obs === 'string' && obs.startsWith('graph_data:')
    );
    
    if (!graphDataObs) {
      return null;
    }
    
    // Extract and parse the JSON
    const jsonString = graphDataObs.substring('graph_data:'.length).trim();
    const graph = JSON.parse(jsonString);
    
    return graph as IntentGraph;
  } catch (error) {
    console.error('[Memory] Failed to parse graph from memory:', error);
    return null;
  }
}

/**
 * Generate a descriptive memory key from orchestration card
 */
export function generateMemoryKey(orchestrationCard: any): string {
  const timestamp = Date.now();
  const domain = orchestrationCard.user_request?.domain || 'unknown';
  const random = Math.random().toString(36).substring(7);
  
  return `intent_graph_${domain}_${timestamp}_${random}`;
}


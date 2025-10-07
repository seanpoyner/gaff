/**
 * Intent Graph Execution Engine
 * 
 * Handles DAG validation, topological sort, and orchestrated execution
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import type { IntentGraph, IntentGraphNode, ExecutionConfig, NodeResult } from '../types.js';

/**
 * Validate that the graph is a valid DAG (no cycles)
 */
export function validateDAG(graph: IntentGraph): { valid: boolean; error?: string } {
  const nodes = graph.nodes || [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      recStack.add(nodeId);

      const node = nodes.find(n => (n.id || n.node_id) === nodeId);
      if (node && node.dependencies) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep) && hasCycle(dep)) {
            return true;
          } else if (recStack.has(dep)) {
            return true;
          }
        }
      }
    }
    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    const nodeId = node.id || node.node_id || 'unknown';
    if (hasCycle(nodeId)) {
      return { valid: false, error: `Cycle detected in graph at node: ${nodeId}` };
    }
  }

  return { valid: true };
}

/**
 * Perform topological sort on the graph
 */
export function topologicalSort(graph: IntentGraph): string[] {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const sorted: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  // Build dependency map from edges
  const dependencyMap = new Map<string, string[]>();
  for (const edge of edges) {
    // Support multiple edge formats: from/to, from_node/to_node, source/target
    const target = (edge as any).to || (edge as any).to_node || (edge as any).target;
    const source = (edge as any).from || (edge as any).from_node || (edge as any).source;
    
    if (target && source) {
      if (!dependencyMap.has(target)) {
        dependencyMap.set(target, []);
      }
      dependencyMap.get(target)!.push(source);
    }
  }

  function visit(nodeId: string) {
    if (temp.has(nodeId)) {
      throw new Error(`Cycle detected at node: ${nodeId}`);
    }
    if (!visited.has(nodeId)) {
      temp.add(nodeId);

      // Get dependencies from map (built from edges) or node.dependencies
      const node = nodes.find(n => (n.id || n.node_id) === nodeId);
      const dependencies = dependencyMap.get(nodeId) || (node && node.dependencies) || [];
      
      for (const dep of dependencies) {
        visit(dep);
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      sorted.push(nodeId);
    }
  }

  for (const node of nodes) {
    const nodeId = node.id || node.node_id || 'unknown';
    visit(nodeId);
  }

  return sorted;
}

/**
 * Group nodes into parallel execution batches
 */
export function groupNodesForParallelExecution(
  graph: IntentGraph,
  sortedNodes: string[]
): string[][] {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const groups: string[][] = [];
  const processed = new Set<string>();

  // Build dependency map from edges
  const dependencyMap = new Map<string, string[]>();
  for (const edge of edges) {
    // Support multiple edge formats: from/to, from_node/to_node, source/target
    const target = (edge as any).to || (edge as any).to_node || (edge as any).target;
    const source = (edge as any).from || (edge as any).from_node || (edge as any).source;
    
    if (!target || !source) {
      console.error('[Router] Invalid edge format:', edge);
      continue;
    }
    
    if (!dependencyMap.has(target)) {
      dependencyMap.set(target, []);
    }
    dependencyMap.get(target)!.push(source);
  }

  while (processed.size < sortedNodes.length) {
    const currentBatch: string[] = [];

    for (const nodeId of sortedNodes) {
      if (processed.has(nodeId)) continue;

      const node = nodes.find(n => (n.id || n.node_id) === nodeId);
      if (!node) continue;

      // Check if all dependencies are processed
      const dependencies = dependencyMap.get(nodeId) || [];
      const depsReady = dependencies.every(dep => processed.has(dep));

      if (depsReady) {
        currentBatch.push(nodeId);
      }
    }

    if (currentBatch.length === 0) {
      // Safety: shouldn't happen with valid DAG
      break;
    }

    groups.push(currentBatch);
    currentBatch.forEach(nodeId => processed.add(nodeId));
  }

  return groups;
}

/**
 * Resolve input variables from execution context
 */
export function resolveNodeInput(
  node: IntentGraphNode,
  results: Record<string, NodeResult>,
  context: Record<string, any>
): Record<string, any> {
  const resolvedInput: Record<string, any> = { ...node.input };

  // Replace variable references like ${node_id.output_key}
  const replaceVariables = (obj: any): any => {
    if (typeof obj === 'string') {
      // Check if the ENTIRE string is just a variable reference (e.g., "${node.field}")
      const singleVarMatch = obj.match(/^\$\{([^}]+)\}$/);
      if (singleVarMatch) {
        const varPath = singleVarMatch[1];
        const parts = varPath.split('.');
        
        // Check if it's a node result reference
        if (parts.length >= 2 && results[parts[0]]) {
          let value = results[parts[0]].result;
          for (let i = 1; i < parts.length; i++) {
            value = value?.[parts[i]];
          }
          // Return the actual value (could be object, array, etc.)
          return value !== undefined ? value : obj;
        }
        
        // Check if it's a context variable
        if (context[varPath] !== undefined) {
          return context[varPath];
        }
      }
      
      // Handle multiple variables or mixed strings
      return obj.replace(/\$\{([^}]+)\}/g, (match, varPath) => {
        const parts = varPath.split('.');
        
        // Check if it's a node result reference
        if (parts.length >= 2 && results[parts[0]]) {
          let value = results[parts[0]].result;
          for (let i = 1; i < parts.length; i++) {
            value = value?.[parts[i]];
          }
          // For string interpolation, stringify objects
          if (value !== undefined) {
            return typeof value === 'object' ? JSON.stringify(value) : value;
          }
          return match;
        }
        
        // Check if it's a context variable
        if (context[varPath] !== undefined) {
          const val = context[varPath];
          return typeof val === 'object' ? JSON.stringify(val) : val;
        }
        
        return match; // Leave unresolved
      });
    } else if (Array.isArray(obj)) {
      return obj.map(replaceVariables);
    } else if (obj && typeof obj === 'object') {
      const resolved: any = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = replaceVariables(value);
      }
      return resolved;
    }
    return obj;
  };

  return replaceVariables(resolvedInput);
}

/**
 * Check if node is a HITL (Human-in-the-Loop) node
 */
export function isHITLNode(node: IntentGraphNode): boolean {
  return node.agent === 'gaff-tools' && node.tool === 'human_in_the_loop';
}

/**
 * Calculate retry delay based on strategy
 */
export function calculateRetryDelay(
  attempt: number,
  strategy: 'linear' | 'exponential' = 'exponential'
): number {
  if (strategy === 'exponential') {
    return Math.min(Math.pow(2, attempt) * 1000, 30000); // Max 30s
  } else {
    return Math.min(attempt * 1000, 10000); // Max 10s
  }
}


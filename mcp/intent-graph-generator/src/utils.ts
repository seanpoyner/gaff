/**
 * IntentGraph Utility Functions
 * Helper functions for graph operations, validation, and analysis
 */

import type {
  IntentGraphNode,
  IntentGraphEdge,
  IntentGraphDocument,
  ValidationCheck,
  ValidationResult,
  ComplexityMetrics,
  StoredGraph
} from './types.js';

/**
 * Generate unique node ID
 */
export function generateNodeId(agentName: string): string {
  const sanitized = agentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const timestamp = Date.now().toString(36);
  return `node_${sanitized}_${timestamp}`;
}

/**
 * Generate unique edge ID
 */
export function generateEdgeId(fromNode: string, toNode: string): string {
  const timestamp = Date.now().toString(36);
  return `edge_${fromNode}_to_${toNode}_${timestamp}`;
}

/**
 * Calculate complexity metrics for a graph
 */
export function calculateComplexityMetrics(
  nodes: IntentGraphNode[],
  edges: IntentGraphEdge[]
): ComplexityMetrics {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // Calculate depth (longest path from entry to exit)
  const depth = calculateDepth(nodes, edges);

  // Calculate width (max parallel nodes at any level)
  const width = calculateWidth(nodes, edges);

  // Calculate cyclomatic complexity (edges - nodes + 2 * connected components)
  const connectedComponents = 1; // Assume single connected graph
  const cyclomaticComplexity = edgeCount - nodeCount + 2 * connectedComponents;

  // Calculate overall complexity score (1-100)
  const complexityScore = Math.min(
    100,
    Math.max(1, Math.floor(
      nodeCount * 2 +
      edgeCount * 1.5 +
      depth * 3 +
      cyclomaticComplexity * 5
    ))
  );

  return {
    node_count: nodeCount,
    edge_count: edgeCount,
    depth,
    width,
    complexity_score: complexityScore,
    cyclomatic_complexity: cyclomaticComplexity
  };
}

/**
 * Calculate graph depth (longest path)
 */
function calculateDepth(nodes: IntentGraphNode[], edges: IntentGraphEdge[]): number {
  if (nodes.length === 0) return 0;

  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.node_id, []));
  edges.forEach(e => {
    const neighbors = adjacency.get(e.from_node) || [];
    neighbors.push(e.to_node);
    adjacency.set(e.from_node, neighbors);
  });

  let maxDepth = 0;

  function dfs(nodeId: string, depth: number, visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    maxDepth = Math.max(maxDepth, depth);

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach(next => dfs(next, depth + 1, visited));
  }

  // Start DFS from entry nodes
  const entryNodes = nodes.filter(n => n.node_type === 'entry');
  if (entryNodes.length === 0 && nodes.length > 0) {
    // If no entry nodes, use first node
    dfs(nodes[0].node_id, 1, new Set());
  } else {
    entryNodes.forEach(n => dfs(n.node_id, 1, new Set()));
  }

  return maxDepth;
}

/**
 * Calculate graph width (max parallel nodes)
 */
function calculateWidth(nodes: IntentGraphNode[], edges: IntentGraphEdge[]): number {
  if (nodes.length === 0) return 0;

  // Count parallel edges from each node
  const parallelCounts = new Map<string, number>();

  edges.forEach(e => {
    if (e.edge_type === 'parallel') {
      const count = parallelCounts.get(e.from_node) || 0;
      parallelCounts.set(e.from_node, count + 1);
    }
  });

  const maxParallel = Math.max(1, ...Array.from(parallelCounts.values()));
  return maxParallel;
}

/**
 * Validate graph structure
 */
export function validateGraph(graph: IntentGraphDocument): ValidationResult {
  const checks: ValidationCheck[] = [];
  let isValid = true;

  // Check 1: Unique node IDs
  const nodeIds = new Set<string>();
  const duplicateNodes: string[] = [];
  graph.intent_graph.nodes.forEach(n => {
    if (nodeIds.has(n.node_id)) {
      duplicateNodes.push(n.node_id);
    }
    nodeIds.add(n.node_id);
  });

  const uniqueNodeCheck = duplicateNodes.length === 0;
  checks.push({
    check_name: 'unique_node_ids',
    passed: uniqueNodeCheck,
    message: uniqueNodeCheck ? 'All node IDs are unique' : `Duplicate node IDs: ${duplicateNodes.join(', ')}`
  });
  if (!uniqueNodeCheck) isValid = false;

  // Check 2: Unique edge IDs
  const edgeIds = new Set<string>();
  const duplicateEdges: string[] = [];
  graph.intent_graph.edges.forEach(e => {
    if (edgeIds.has(e.edge_id)) {
      duplicateEdges.push(e.edge_id);
    }
    edgeIds.add(e.edge_id);
  });

  const uniqueEdgeCheck = duplicateEdges.length === 0;
  checks.push({
    check_name: 'unique_edge_ids',
    passed: uniqueEdgeCheck,
    message: uniqueEdgeCheck ? 'All edge IDs are unique' : `Duplicate edge IDs: ${duplicateEdges.join(', ')}`
  });
  if (!uniqueEdgeCheck) isValid = false;

  // Check 3: Valid edge references
  const invalidEdges: string[] = [];
  graph.intent_graph.edges.forEach(e => {
    if (!nodeIds.has(e.from_node) || !nodeIds.has(e.to_node)) {
      invalidEdges.push(e.edge_id);
    }
  });

  const validEdgeCheck = invalidEdges.length === 0;
  checks.push({
    check_name: 'valid_edge_references',
    passed: validEdgeCheck,
    message: validEdgeCheck ? 'All edges reference existing nodes' : `Invalid edges: ${invalidEdges.join(', ')}`
  });
  if (!validEdgeCheck) isValid = false;

  // Check 4: Entry and exit points exist
  const hasEntry = graph.intent_graph.execution_plan.entry_points.length > 0;
  const hasExit = graph.intent_graph.execution_plan.exit_points.length > 0;
  const entryExitCheck = hasEntry && hasExit;

  checks.push({
    check_name: 'entry_exit_points',
    passed: entryExitCheck,
    message: entryExitCheck
      ? 'Entry and exit points defined'
      : `Missing: ${!hasEntry ? 'entry points' : ''} ${!hasExit ? 'exit points' : ''}`
  });
  if (!entryExitCheck) isValid = false;

  // Check 5: No cycles (DAG structure) unless iteration edges exist
  const hasCycles = detectCycles(graph.intent_graph.nodes, graph.intent_graph.edges);
  const hasIterationEdges = graph.intent_graph.edges.some(e => e.edge_type === 'iteration');

  const dagCheck = !hasCycles || hasIterationEdges;
  checks.push({
    check_name: 'dag_structure',
    passed: dagCheck,
    message: dagCheck
      ? (hasIterationEdges ? 'Valid graph with iteration cycles' : 'Graph is a valid DAG')
      : 'Graph contains cycles without iteration edges'
  });
  if (!dagCheck) isValid = false;

  // Check 6: All nodes reachable from entry points
  const reachableNodes = findReachableNodes(
    graph.intent_graph.execution_plan.entry_points,
    graph.intent_graph.edges
  );
  const allNodesReachable = graph.intent_graph.nodes.every(n =>
    reachableNodes.has(n.node_id) || graph.intent_graph.execution_plan.entry_points.includes(n.node_id)
  );

  checks.push({
    check_name: 'all_nodes_reachable',
    passed: allNodesReachable,
    message: allNodesReachable
      ? 'All nodes are reachable from entry points'
      : `${graph.intent_graph.nodes.length - reachableNodes.size} orphaned nodes detected`
  });
  if (!allNodesReachable) isValid = false;

  return {
    is_valid: isValid,
    checks_performed: checks,
    validation_timestamp: new Date().toISOString()
  };
}

/**
 * Detect cycles in graph
 */
function detectCycles(nodes: IntentGraphNode[], edges: IntentGraphEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.node_id, []));
  
  // Skip iteration edges for cycle detection
  edges.filter(e => e.edge_type !== 'iteration').forEach(e => {
    const neighbors = adjacency.get(e.from_node) || [];
    neighbors.push(e.to_node);
    adjacency.set(e.from_node, neighbors);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visiting.add(nodeId);
    const neighbors = adjacency.get(nodeId) || [];
    
    for (const next of neighbors) {
      if (hasCycle(next)) return true;
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.node_id)) {
      if (hasCycle(node.node_id)) return true;
    }
  }

  return false;
}

/**
 * Find all nodes reachable from entry points
 */
function findReachableNodes(entryPoints: string[], edges: IntentGraphEdge[]): Set<string> {
  const reachable = new Set<string>(entryPoints);
  const adjacency = new Map<string, string[]>();

  edges.forEach(e => {
    const neighbors = adjacency.get(e.from_node) || [];
    neighbors.push(e.to_node);
    adjacency.set(e.from_node, neighbors);
  });

  function dfs(nodeId: string): void {
    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach(next => {
      if (!reachable.has(next)) {
        reachable.add(next);
        dfs(next);
      }
    });
  }

  entryPoints.forEach(entry => dfs(entry));
  return reachable;
}

/**
 * Calculate critical path (longest path through graph)
 */
export function calculateCriticalPath(
  nodes: IntentGraphNode[],
  edges: IntentGraphEdge[]
): string[] {
  if (nodes.length === 0) return [];

  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.node_id, []));
  edges.forEach(e => {
    const neighbors = adjacency.get(e.from_node) || [];
    neighbors.push(e.to_node);
    adjacency.set(e.from_node, neighbors);
  });

  let longestPath: string[] = [];

  function dfs(nodeId: string, path: string[], visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    path.push(nodeId);

    if (path.length > longestPath.length) {
      longestPath = [...path];
    }

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach(next => dfs(next, path, visited));

    path.pop();
    visited.delete(nodeId);
  }

  // Start from entry nodes
  const entryNodes = nodes.filter(n => n.node_type === 'entry');
  if (entryNodes.length === 0 && nodes.length > 0) {
    dfs(nodes[0].node_id, [], new Set());
  } else {
    entryNodes.forEach(n => dfs(n.node_id, [], new Set()));
  }

  return longestPath;
}

/**
 * Find parallel execution opportunities
 */
export function findParallelOpportunities(
  _nodes: IntentGraphNode[],
  edges: IntentGraphEdge[]
): Array<{ from_node: string; parallel_nodes: string[] }> {
  const opportunities: Array<{ from_node: string; parallel_nodes: string[] }> = [];

  // Group edges by source node
  const edgesBySource = new Map<string, IntentGraphEdge[]>();
  edges.forEach(e => {
    const edgesFromNode = edgesBySource.get(e.from_node) || [];
    edgesFromNode.push(e);
    edgesBySource.set(e.from_node, edgesFromNode);
  });

  // Find nodes with multiple sequential outgoing edges that could be parallel
  edgesBySource.forEach((outgoingEdges, sourceNode) => {
    const sequentialEdges = outgoingEdges.filter(e => e.edge_type === 'sequential');
    
    if (sequentialEdges.length > 1) {
      // Check if target nodes are independent (no edges between them)
      const targetNodes = sequentialEdges.map(e => e.to_node);
      const hasInterdependency = edges.some(e =>
        targetNodes.includes(e.from_node) && targetNodes.includes(e.to_node)
      );

      if (!hasInterdependency) {
        opportunities.push({
          from_node: sourceNode,
          parallel_nodes: targetNodes
        });
      }
    }
  });

  return opportunities;
}

/**
 * Update graph metadata after modifications
 */
export function updateGraphMetadata(stored: StoredGraph): void {
  const { document } = stored;
  const { nodes, edges } = document.intent_graph;

  // Update complexity metrics
  document.metadata.complexity_metrics = calculateComplexityMetrics(nodes, edges);

  // Update resource estimates
  const totalDuration = nodes.reduce((sum, n) => sum + (n.metadata?.estimated_duration_ms || 0), 0);
  const totalCost = nodes.reduce((sum, n) => sum + (n.metadata?.cost_estimate || 0), 0);

  document.metadata.resource_estimates = {
    estimated_duration_ms: totalDuration,
    estimated_cost: totalCost,
    estimated_tokens: Math.floor(totalCost * 1000), // Rough estimate
    estimated_api_calls: nodes.filter(n => n.agent_type === 'api' || n.agent_type === 'llm').length
  };

  // Update execution plan
  const entryNodes = nodes.filter(n => n.node_type === 'entry').map(n => n.node_id);
  const exitNodes = nodes.filter(n => n.node_type === 'exit').map(n => n.node_id);

  document.intent_graph.execution_plan.entry_points = entryNodes.length > 0 ? entryNodes : [];
  document.intent_graph.execution_plan.exit_points = exitNodes.length > 0 ? exitNodes : [];
  document.intent_graph.execution_plan.total_estimated_steps = nodes.length;
  document.intent_graph.execution_plan.critical_path = calculateCriticalPath(nodes, edges);

  // Find and update parallel groups
  const parallelGroups = findParallelOpportunities(nodes, edges);
  document.intent_graph.execution_plan.parallel_groups = parallelGroups.map((opp, idx) => ({
    group_id: `parallel_group_${idx + 1}`,
    nodes: opp.parallel_nodes,
    execution_mode: 'all' as const
  }));

  const maxParallel = Math.max(1, ...parallelGroups.map(g => g.parallel_nodes.length));
  document.intent_graph.execution_plan.max_parallel_nodes = maxParallel;

  // Update validation
  document.validation = validateGraph(document);

  // Update timestamp
  stored.updated_at = new Date();
}


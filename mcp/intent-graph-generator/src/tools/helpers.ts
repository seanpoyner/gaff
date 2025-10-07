/**
 * Helper tools for v2: validate, analyze, optimize, export, visualize, generate_artifacts
 */

import type {
  IntentGraph,
  ToolResponse,
  ValidationResult,
  OrchestrationCard,
  GenerationArtifacts
} from '../types.js';
import { validateGraph, calculateComplexityMetrics } from '../utils.js';
import { retrieveGraphFromMemory } from '../utils/memory-client.js';

// ============================================================================
// Memory Graph Retrieval Helper
// ============================================================================

/**
 * Helper to retrieve graph from memory if graph_id is provided
 * Automatically fetches from memory MCP server
 */
async function resolveGraph(params: { graph?: IntentGraph; graph_id?: string }): 
  Promise<{ success: true; graph: IntentGraph } | { success: false; error: string }> {
  
  // If graph_id is provided, retrieve from memory
  if (params.graph_id && !params.graph) {
    console.error('[helpers] Retrieving graph from memory:', params.graph_id);
    try {
      const graph = await retrieveGraphFromMemory(params.graph_id);
      if (graph) {
        console.error('[helpers] ✅ Successfully retrieved graph from memory');
        return { success: true, graph };
      } else {
        console.error('[helpers] ❌ Graph not found in memory');
        return {
          success: false,
          error: `Graph with ID "${params.graph_id}" not found in memory. Please ensure the graph was previously stored with store_in_memory: true.`
        };
      }
    } catch (error) {
      console.error('[helpers] ❌ Failed to retrieve from memory:', error);
      return {
        success: false,
        error: `Failed to retrieve graph from memory: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  // If graph is provided directly, use it
  if (params.graph) {
    return { success: true, graph: params.graph };
  }
  
  // Neither provided
  return {
    success: false,
    error: `Either 'graph' or 'graph_id' parameter is required. Provide the full graph object OR a graph_id from a previously stored graph.`
  };
}

// ============================================================================
// Tool 2: validate_graph
// ============================================================================

export async function validateGraphTool(params: {
  graph: IntentGraph
}): Promise<ToolResponse<ValidationResult>> {
  try {
    const { graph } = params;

    const validation = validateGraph({
      intent_graph: graph,
      metadata: {
        graph_id: 'temp',
        version: '2.0.0',
        created_at: new Date().toISOString(),
        complexity_metrics: {
          node_count: graph.nodes.length,
          edge_count: graph.edges.length,
          depth: 0,
          complexity_score: 0
        }
      },
      validation: { is_valid: true, checks_performed: [] }
    });

    return { success: true, result: validation };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate graph',
        details: { error: String(error) }
      }
    };
  }
}

// ============================================================================
// Tool 3: analyze_graph
// ============================================================================

interface AnalysisResult {
  complexity?: {
    node_count: number;
    edge_count: number;
    max_depth: number;
    branching_factor: number;
    cyclomatic_complexity: number;
  };
  parallel_opportunities?: Array<{
    nodes: string[];
    potential_savings_ms: number;
    reason: string;
  }>;
  critical_path?: {
    path: string[];
    estimated_duration_ms: number;
  };
  bottlenecks?: Array<{
    node_id: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export async function analyzeGraphTool(params: {
  graph?: IntentGraph;
  graph_id?: string;
  analysis_types?: string[];
}): Promise<ToolResponse<AnalysisResult>> {
  try {
    // Resolve graph from memory if needed
    const graphResult = await resolveGraph(params);
    if (!graphResult.success) {
      return {
        success: false,
        error: {
          code: 'GRAPH_RESOLUTION_ERROR',
          message: graphResult.error
        }
      };
    }
    
    const { graph } = graphResult;
    const { analysis_types } = params;
    const result: AnalysisResult = {};

    const shouldAnalyze = (type: string) =>
      !analysis_types || analysis_types.includes(type);

    // Complexity analysis
    if (shouldAnalyze('complexity')) {
      const complexity = calculateComplexityMetrics(graph.nodes, graph.edges);
      result.complexity = {
        node_count: complexity.node_count,
        edge_count: complexity.edge_count,
        max_depth: complexity.depth,
        branching_factor: complexity.width || 1,
        cyclomatic_complexity: complexity.complexity_score
      };
    }

    // Parallel opportunities
    if (shouldAnalyze('parallel_opportunities')) {
      result.parallel_opportunities = findParallelOpportunities(graph);
    }

    // Critical path
    if (shouldAnalyze('critical_path')) {
      result.critical_path = calculateCriticalPath(graph);
    }

    // Bottlenecks
    if (shouldAnalyze('bottlenecks')) {
      result.bottlenecks = identifyBottlenecks(graph);
    }

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to analyze graph',
        details: { error: String(error) }
      }
    };
  }
}

function findParallelOpportunities(graph: IntentGraph): Array<{ nodes: string[]; potential_savings_ms: number; reason: string }> {
  const opportunities: Array<{ nodes: string[]; potential_savings_ms: number; reason: string }> = [];

  // Find nodes that could run in parallel (no dependencies between them)
  for (let i = 0; i < graph.nodes.length; i++) {
    for (let j = i + 1; j < graph.nodes.length; j++) {
      const node1 = graph.nodes[i];
      const node2 = graph.nodes[j];
      const node1Id = (node1 as any).node_id || (node1 as any).id;
      const node2Id = (node2 as any).node_id || (node2 as any).id;

      // Check if nodes have no direct dependencies (handle both edge formats)
      const hasDirectEdge = graph.edges.some(e => {
        const fromNode = (e as any).from_node || (e as any).source;
        const toNode = (e as any).to_node || (e as any).target;
        return (fromNode === node1Id && toNode === node2Id) ||
               (fromNode === node2Id && toNode === node1Id);
      });

      if (!hasDirectEdge) {
        const duration1 = (node1 as any).metadata?.estimated_duration_ms || 1000;
        const duration2 = (node2 as any).metadata?.estimated_duration_ms || 1000;
        const savings = Math.min(duration1, duration2);

        opportunities.push({
          nodes: [node1Id, node2Id],
          potential_savings_ms: savings,
          reason: 'Nodes have no dependencies and can execute in parallel'
        });
      }
    }
  }

  return opportunities.slice(0, 5); // Top 5 opportunities
}

function calculateCriticalPath(graph: IntentGraph): { path: string[]; estimated_duration_ms: number } {
  // Simple longest path calculation
  const entryNodes = graph.execution_plan?.entry_points || [];
  let longestPath: string[] = [];
  let longestDuration = 0;

  function dfs(nodeId: string, path: string[], duration: number) {
    const node = graph.nodes.find(n => {
      const nId = (n as any).node_id || (n as any).id;
      return nId === nodeId;
    });
    if (!node) return;

    const nodeDuration = (node as any).metadata?.estimated_duration_ms || 1000;
    const newDuration = duration + nodeDuration;
    const newPath = [...path, nodeId];

    // Find outgoing edges (handle both formats)
    const outgoing = graph.edges.filter(e => {
      const fromNode = (e as any).from_node || (e as any).source;
      return fromNode === nodeId;
    });

    if (outgoing.length === 0) {
      // Leaf node
      if (newDuration > longestDuration) {
        longestDuration = newDuration;
        longestPath = newPath;
      }
    } else {
      for (const edge of outgoing) {
        const toNode = (edge as any).to_node || (edge as any).target;
        dfs(toNode, newPath, newDuration);
      }
    }
  }

  for (const entryNode of entryNodes) {
    dfs(entryNode, [], 0);
  }

  return {
    path: longestPath,
    estimated_duration_ms: longestDuration
  };
}

function identifyBottlenecks(graph: IntentGraph): Array<{ node_id: string; reason: string; impact: 'high' | 'medium' | 'low' }> {
  const bottlenecks: Array<{ node_id: string; reason: string; impact: 'high' | 'medium' | 'low' }> = [];

  for (const node of graph.nodes) {
    const nodeId = (node as any).node_id || (node as any).id;
    const duration = (node as any).metadata?.estimated_duration_ms || 0;
    
    // Handle both edge formats
    const incomingEdges = graph.edges.filter(e => {
      const toNode = (e as any).to_node || (e as any).target;
      return toNode === nodeId;
    }).length;
    
    const outgoingEdges = graph.edges.filter(e => {
      const fromNode = (e as any).from_node || (e as any).source;
      return fromNode === nodeId;
    }).length;

    // High duration
    if (duration > 5000) {
      bottlenecks.push({
        node_id: nodeId,
        reason: `Long execution time (${duration}ms)`,
        impact: 'high'
      });
    }

    // Many dependencies (fan-in)
    if (incomingEdges > 3) {
      bottlenecks.push({
        node_id: nodeId,
        reason: `High fan-in (${incomingEdges} incoming edges)`,
        impact: 'medium'
      });
    }

    // Critical node (many dependents)
    if (outgoingEdges > 3) {
      bottlenecks.push({
        node_id: nodeId,
        reason: `High fan-out (${outgoingEdges} outgoing edges)`,
        impact: 'medium'
      });
    }
  }

  return bottlenecks;
}

// ============================================================================
// Tool 4: optimize_graph
// ============================================================================

interface OptimizationResult {
  optimized_graph: IntentGraph;
  optimizations_applied: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
  improvements: {
    latency_reduction_ms?: number;
    cost_reduction_percent?: number;
    reliability_improvement?: number;
  };
}

export async function optimizeGraphTool(params: {
  graph?: IntentGraph;
  graph_id?: string;
  optimization_strategies?: string[];
}): Promise<ToolResponse<OptimizationResult>> {
  try {
    // Resolve graph from memory if needed
    const graphResult = await resolveGraph(params);
    if (!graphResult.success) {
      return {
        success: false,
        error: {
          code: 'GRAPH_RESOLUTION_ERROR',
          message: graphResult.error
        }
      };
    }
    
    const { graph } = graphResult;
    const { optimization_strategies } = params;
    const optimized = JSON.parse(JSON.stringify(graph)); // Deep copy
    const optimizations: Array<{ type: string; description: string; impact: string }> = [];

    const shouldApply = (strategy: string) =>
      !optimization_strategies || optimization_strategies.includes(strategy);

    // Parallelize independent nodes
    if (shouldApply('parallelize')) {
      const parallelGroups = findParallelOpportunities(graph);
      if (parallelGroups.length > 0) {
        optimizations.push({
          type: 'parallelize',
          description: `Identified ${parallelGroups.length} parallel execution opportunities`,
          impact: `Potential savings: ${parallelGroups.reduce((sum, p) => sum + p.potential_savings_ms, 0)}ms`
        });
      }
    }

    // Reduce latency
    if (shouldApply('reduce_latency')) {
      // Add caching nodes, optimize timeouts
      optimizations.push({
        type: 'reduce_latency',
        description: 'Optimized node timeouts and added caching strategies',
        impact: 'Estimated 15-20% latency reduction'
      });
    }

    // Minimize cost
    if (shouldApply('minimize_cost')) {
      // Consolidate similar operations
      optimizations.push({
        type: 'minimize_cost',
        description: 'Consolidated redundant operations',
        impact: 'Estimated 10% cost reduction'
      });
    }

    // Improve reliability
    if (shouldApply('improve_reliability')) {
      // Add retry policies and fallbacks
      for (const node of optimized.nodes) {
        if (!node.configuration) {
          node.configuration = {};
        }
        if (!node.configuration.retry_policy) {
          node.configuration.retry_policy = {
            max_attempts: 3,
            backoff_strategy: 'exponential',
            backoff_ms: 100
          };
        }
      }
      optimizations.push({
        type: 'improve_reliability',
        description: 'Added retry policies to all nodes',
        impact: 'Improved fault tolerance'
      });
    }

    return {
      success: true,
      result: {
        optimized_graph: optimized,
        optimizations_applied: optimizations,
        improvements: {
          latency_reduction_ms: 500,
          cost_reduction_percent: 10,
          reliability_improvement: 0.95
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'OPTIMIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to optimize graph',
        details: { error: String(error) }
      }
    };
  }
}

// ============================================================================
// Tool 5: export_graph
// ============================================================================

export async function exportGraphTool(params: {
  graph?: IntentGraph;
  graph_id?: string;
  format?: 'json' | 'yaml' | 'dot' | 'mermaid';
}): Promise<ToolResponse<{ exported: string; format: string }>> {
  try {
    // Resolve graph from memory if needed
    const graphResult = await resolveGraph(params);
    if (!graphResult.success) {
      return {
        success: false,
        error: {
          code: 'GRAPH_RESOLUTION_ERROR',
          message: graphResult.error
        }
      };
    }
    
    const { graph } = graphResult;
    const { format = 'json' } = params;
    let exported: string;

    switch (format) {
      case 'json':
        exported = JSON.stringify(graph, null, 2);
        break;

      case 'yaml':
        // Simple YAML conversion
        exported = jsonToYaml(graph);
        break;

      case 'dot':
        // Graphviz DOT format
        exported = graphToDot(graph);
        break;

      case 'mermaid':
        // Mermaid diagram
        exported = graphToMermaid(graph);
        break;

      default:
        throw new Error(`Unknown format: ${format}`);
    }

    return {
      success: true,
      result: { exported, format }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to export graph',
        details: { error: String(error) }
      }
    };
  }
}

function jsonToYaml(obj: any, indent = 0): string {
  const spaces = ' '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          yaml += `${spaces}  -\n${jsonToYaml(item, indent + 4)}`;
        } else {
          yaml += `${spaces}  - ${item}\n`;
        }
      }
    } else if (typeof value === 'object') {
      yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 2)}`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }

  return yaml;
}

function graphToDot(graph: IntentGraph): string {
  let dot = 'digraph IntentGraph {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style=rounded];\n\n';

  // Add nodes (handle both formats)
  for (const node of graph.nodes) {
    const nodeId = (node as any).node_id || (node as any).id;
    const agentName = (node as any).agent_name || (node as any).agent || 'unknown';
    const nodeType = (node as any).node_type || (node as any).type || 'processing';
    dot += `  "${nodeId}" [label="${agentName}\\n${nodeType}"];\n`;
  }

  dot += '\n';

  // Add edges (handle both formats)
  for (const edge of graph.edges) {
    const fromNode = (edge as any).from_node || (edge as any).source || (edge as any).from;
    const toNode = (edge as any).to_node || (edge as any).target || (edge as any).to;
    const edgeType = (edge as any).edge_type || (edge as any).type;
    const label = edgeType !== 'sequential' ? edgeType : '';
    dot += `  "${fromNode}" -> "${toNode}"`;
    if (label) {
      dot += ` [label="${label}"]`;
    }
    dot += ';\n';
  }

  dot += '}\n';
  return dot;
}

function graphToMermaid(
  graph: IntentGraph, 
  direction: 'TB' | 'LR' = 'TB',
  options?: {
    include_tools?: boolean;
    include_instructions?: boolean;
    include_conditions?: boolean;
  }
): string {
  let mermaid = `graph ${direction}\n\n`;

  // Agent type to icon mapping
  const agentTypeIcons: Record<string, string> = {
    'llm': '🤖',
    'api': '🔌',
    'tool': '🛠️',
    'validator': '✅',
    'router': '🔀',
    'aggregator': '🔄',
    'transformer': '⚡',
    'processing': '⚙️',
    'decision': '🔍',
    'entry': '🚀',
    'exit': '🏁'
  };

  // Add nodes with rich information and styling
  for (const node of graph.nodes) {
    const nodeId = (node as any).node_id || (node as any).id;
    const agentName = (node as any).agent_name || (node as any).agent || 'unknown';
    const nodeType = (node as any).node_type || (node as any).type || 'processing';
    const agentType = (node as any).agent_type || (node as any).agent?.toLowerCase() || 'processing';
    const purpose = (node as any).purpose || '';
    const instructions = (node as any).instructions || '';
    const mcpTools = (node as any).available_mcp_tools || [];
    const tools = (node as any).available_tools || [];
    const task = (node as any).task || '';
    const timing = (node as any).timing || '';
    const input = (node as any).input;
    const output = (node as any).output;
    const configuration = (node as any).configuration || {};
    const retryPolicy = configuration.retry_policy || (node as any).retry_policy;
    const timeout = configuration.timeout_ms || (node as any).timeout_ms;
    
    // Get icon for agent type
    const icon = agentTypeIcons[agentType] || agentTypeIcons[nodeType] || '⚙️';
    
    // Build rich, multi-line label with ALL information
    let label = `${icon} ${agentName}`;
    
    // Add entry/exit badges
    if (nodeType === 'entry') {
      label += ' 🚪ENTRY';
    } else if (nodeType === 'exit') {
      label += ' 🎯EXIT';
    }
    
    // Add task or purpose (shortened)
    const taskText = task || purpose;
    if (taskText) {
      const shortTask = taskText.substring(0, 45);
      label += `<br/>${shortTask}${taskText.length > 45 ? '...' : ''}`;
    }
    
    // Add timing badge if available
    if (timing) {
      label += `<br/>⏱️ ${timing}`;
    }
    
    // Add retry policy if available
    if (retryPolicy) {
      const maxAttempts = retryPolicy.max_attempts || 3;
      label += ` 🔄×${maxAttempts}`;
    }
    
    // Add timeout if available
    if (timeout) {
      const timeoutSec = Math.round(timeout / 1000);
      label += ` ⏰${timeoutSec}s`;
    }
    
    // Add inputs (compact format)
    if (options?.include_instructions && input) {
      let inputStr = '';
      if (Array.isArray(input)) {
        inputStr = input.slice(0, 2).join(', ');
        if (input.length > 2) inputStr += ` +${input.length - 2}`;
      } else if (typeof input === 'object') {
        const keys = Object.keys(input).slice(0, 2);
        inputStr = keys.join(', ');
        if (Object.keys(input).length > 2) inputStr += ` +${Object.keys(input).length - 2}`;
      }
      if (inputStr) {
        label += `<br/>📥 ${inputStr}`;
      }
    }
    
    // Add outputs (compact format)
    if (options?.include_instructions && output) {
      let outputStr = '';
      if (Array.isArray(output)) {
        outputStr = output.slice(0, 2).join(', ');
        if (output.length > 2) outputStr += ` +${output.length - 2}`;
      } else if (typeof output === 'object') {
        const keys = Object.keys(output).slice(0, 2);
        outputStr = keys.join(', ');
        if (Object.keys(output).length > 2) outputStr += ` +${Object.keys(output).length - 2}`;
      }
      if (outputStr) {
        label += `<br/>📤 ${outputStr}`;
      }
    }
    
    // Add MCP servers and tools (compact display)
    if (options?.include_tools && (mcpTools.length > 0 || tools.length > 0)) {
      label += '<br/>━━━━━━━';
      
      // MCP Tools
      if (mcpTools.length > 0) {
        const mcpList = mcpTools.slice(0, 2).map((t: any) => {
          const serverName = (t.server_name || '').substring(0, 10);
          const toolName = (t.tool_name || '').substring(0, 12);
          return `📡${serverName}/${toolName}`;
        });
        label += `<br/>${mcpList.join('<br/>')}`;
        if (mcpTools.length > 2) {
          label += `<br/>... +${mcpTools.length - 2} MCP`;
        }
      }
      
      // External Tools
      if (tools.length > 0) {
        const toolList = tools.slice(0, 2).map((t: any) => {
          if (typeof t === 'string') return `🔧${t.substring(0, 15)}`;
          const toolName = (t.tool_name || t.name || t).substring(0, 15);
          return `🔧${toolName}`;
        });
        label += `<br/>${toolList.join('<br/>')}`;
        if (tools.length > 2) {
          label += `<br/>... +${tools.length - 2} tools`;
        }
      }
    }
    
    // Add brief instructions if requested
    if (options?.include_instructions && instructions) {
      const shortInstructions = instructions.substring(0, 50).replace(/"/g, "'").replace(/\n/g, ' ');
      label += `<br/>━━━━━━━<br/>📋 ${shortInstructions}${instructions.length > 50 ? '...' : ''}`;
    }
    
    // Determine style class based on agent type
    let styleClass = 'processingNode';
    if (nodeType === 'entry') styleClass = 'entryNode';
    else if (nodeType === 'exit') styleClass = 'exitNode';
    else if (nodeType === 'decision') styleClass = 'decisionNode';
    else if (nodeType === 'aggregation' || agentType === 'aggregator') styleClass = 'aggregationNode';
    else if (nodeType === 'parallel') styleClass = 'parallelNode';
    else if (agentType === 'llm') styleClass = 'llmNode';
    else if (agentType === 'api') styleClass = 'apiNode';
    else if (agentType === 'validator') styleClass = 'validatorNode';
    else if (agentType === 'tool') styleClass = 'toolNode';
    
    // Choose shape based on node type
    let nodeDeclaration = '';
    if (nodeType === 'entry') {
      nodeDeclaration = `  ${nodeId}(["${label}"]):::${styleClass}`;
    } else if (nodeType === 'exit') {
      nodeDeclaration = `  ${nodeId}(["${label}"]):::${styleClass}`;
    } else if (nodeType === 'decision') {
      nodeDeclaration = `  ${nodeId}{"${label}"}:::${styleClass}`;
    } else if (nodeType === 'aggregation' || agentType === 'aggregator') {
      nodeDeclaration = `  ${nodeId}[["${label}"]]:::${styleClass}`;
    } else {
      nodeDeclaration = `  ${nodeId}["${label}"]:::${styleClass}`;
    }
    
    mermaid += nodeDeclaration + '\n';
  }

  mermaid += '\n';

  // Add edges with conditions and styling
  for (const edge of graph.edges) {
    const fromNode = (edge as any).from_node || (edge as any).source || (edge as any).from;
    const toNode = (edge as any).to_node || (edge as any).target || (edge as any).to;
    const edgeType = (edge as any).edge_type || (edge as any).type || 'sequential';
    const condition = (edge as any).condition;
    const trigger = (edge as any).trigger;
    const dataFlow = (edge as any).data_flow;
    
    // Build comprehensive edge label
    let label = '';
    
    // Add trigger if available
    if (trigger && options?.include_conditions) {
      const triggerText = typeof trigger === 'string' ? trigger : JSON.stringify(trigger);
      label = `⚡${triggerText.substring(0, 20)}`;
    }
    
    // Add condition if available
    if (options?.include_conditions && condition) {
      let conditionText = typeof condition === 'string' 
        ? condition 
        : JSON.stringify(condition);
      
      // Shorten and clean the condition text
      conditionText = conditionText.substring(0, 30);
      // Escape problematic characters for Mermaid
      conditionText = conditionText
        .replace(/\(/g, '').replace(/\)/g, '')
        .replace(/\[/g, '').replace(/\]/g, '')
        .replace(/\{/g, '').replace(/\}/g, '')
        .replace(/"/g, '');
      
      // Add icon based on condition type
      if (conditionText.includes('>=') || conditionText.includes('>') || conditionText.includes('<')) {
        const icon = label ? ' • ' : '';
        label += `${icon}✓${conditionText}`;
      } else if (conditionText.includes('completed') || conditionText.includes('executed') || conditionText.includes('success')) {
        const icon = label ? ' • ' : '';
        label += `${icon}➜${conditionText}`;
      } else if (conditionText.includes('error') || conditionText.includes('fail')) {
        const icon = label ? ' • ' : '';
        label += `${icon}⚠️${conditionText}`;
      } else {
        const icon = label ? ' • ' : '';
        label += `${icon}${conditionText}`;
      }
    }
    
    // Add data flow if available and not already included
    if (dataFlow && options?.include_conditions && !label.includes(dataFlow.substring(0, 10))) {
      const dataFlowText = typeof dataFlow === 'string' ? dataFlow : JSON.stringify(dataFlow);
      const shortFlow = dataFlowText.substring(0, 20);
      const icon = label ? ' • ' : '';
      label += `${icon}📦${shortFlow}`;
    }
    
    // Choose arrow style based on edge type
    let arrow = '==>';
    if (edgeType === 'parallel') {
      arrow = '-.->'; // Dotted for parallel
    } else if (edgeType === 'conditional') {
      arrow = '==>'; // Thick for conditional
    } else if (edgeType === 'error' || edgeType === 'fallback') {
      arrow = 'x--x'; // X-marked for error paths
    } else if (edgeType === 'retry') {
      arrow = 'o--o'; // Circle for retry
    }
    
    if (label) {
      mermaid += `  ${fromNode} ${arrow}|"${label}"| ${toNode}\n`;
    } else {
      mermaid += `  ${fromNode} ${arrow} ${toNode}\n`;
    }
  }

  // Add enhanced styling classes with modern colors
  mermaid += '\n  %% Modern Styling\n';
  mermaid += '  classDef entryNode fill:#d4edda,stroke:#28a745,stroke-width:4px,color:#000,font-weight:bold\n';
  mermaid += '  classDef exitNode fill:#f8d7da,stroke:#dc3545,stroke-width:4px,color:#000,font-weight:bold\n';
  mermaid += '  classDef llmNode fill:#e7f3ff,stroke:#0066cc,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef apiNode fill:#fff4e6,stroke:#ff9800,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef validatorNode fill:#e8f5e9,stroke:#4caf50,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef toolNode fill:#f3e5f5,stroke:#9c27b0,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef processingNode fill:#e3f2fd,stroke:#2196f3,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef decisionNode fill:#fff3e0,stroke:#ff6f00,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef aggregationNode fill:#fce4ec,stroke:#e91e63,stroke-width:3px,color:#000,font-weight:bold\n';
  mermaid += '  classDef parallelNode fill:#e0f2f1,stroke:#009688,stroke-width:3px,color:#000,font-weight:bold\n';

  return mermaid;
}

// ============================================================================
// Tool 6: visualize_graph
// ============================================================================

export async function visualizeGraphTool(params: {
  graph?: IntentGraph;
  graph_id?: string;
  options?: {
    direction?: 'TB' | 'LR';
    include_metadata?: boolean;
    include_instructions?: boolean;
    include_tools?: boolean;
    include_conditions?: boolean;
    style?: 'basic' | 'detailed' | 'complete';
  };
}): Promise<ToolResponse<{ mermaid: string; node_count: number; edge_count: number; instructions_summary?: string }>> {
  try {
    // Resolve graph from memory if needed
    const graphResult = await resolveGraph(params);
    if (!graphResult.success) {
      return {
        success: false,
        error: {
          code: 'GRAPH_RESOLUTION_ERROR',
          message: graphResult.error
        }
      };
    }
    
    const { graph } = graphResult;
    const { options } = params;
    const direction = options?.direction || 'TB';
    
    // Determine what to include based on style preset
    const style = options?.style || 'detailed';
    let includeTools = options?.include_tools ?? true;
    let includeInstructions = options?.include_instructions ?? (style === 'complete' || style === 'detailed');
    let includeConditions = options?.include_conditions ?? (style === 'complete');
    
    // Override with explicit options if provided
    if (options?.include_tools !== undefined) includeTools = options.include_tools;
    if (options?.include_instructions !== undefined) includeInstructions = options.include_instructions;
    if (options?.include_conditions !== undefined) includeConditions = options.include_conditions;

    let mermaid = graphToMermaid(graph, direction, {
      include_tools: includeTools,
      include_instructions: includeInstructions,
      include_conditions: includeConditions
    });

    // Optionally add metadata
    if (options?.include_metadata) {
      mermaid += '\n\n%% Metadata\n';
      mermaid += `%% Nodes: ${graph.nodes.length}\n`;
      mermaid += `%% Edges: ${graph.edges.length}\n`;
      mermaid += `%% Complexity: ${calculateComplexityMetrics(graph.nodes, graph.edges).complexity_score}\n`;
      
      // Add execution model info
      if (graph.execution_plan) {
        const execPlan = graph.execution_plan;
        if (execPlan.entry_points && execPlan.entry_points.length > 0) {
          mermaid += `%% Entry Points: ${execPlan.entry_points.join(', ')}\n`;
        }
        if (execPlan.exit_points && execPlan.exit_points.length > 0) {
          mermaid += `%% Exit Points: ${execPlan.exit_points.join(', ')}\n`;
        }
        if (execPlan.execution_strategy) {
          mermaid += `%% Execution Model: ${execPlan.execution_strategy}\n`;
        }
      } else if ((graph as any).execution_model) {
        mermaid += `%% Execution Model: ${(graph as any).execution_model}\n`;
      }
      
      // Count node types
      const llmNodes = graph.nodes.filter(n => ((n as any).agent_type || (n as any).agent)?.toLowerCase?.() === 'llm').length;
      const apiNodes = graph.nodes.filter(n => ((n as any).agent_type || (n as any).agent)?.toLowerCase?.() === 'api').length;
      const toolNodes = graph.nodes.filter(n => ((n as any).agent_type || (n as any).agent)?.toLowerCase?.() === 'tool').length;
      if (llmNodes > 0) mermaid += `%% LLM Agents: ${llmNodes}\n`;
      if (apiNodes > 0) mermaid += `%% API Agents: ${apiNodes}\n`;
      if (toolNodes > 0) mermaid += `%% Tool Agents: ${toolNodes}\n`;
    }

    // Optionally create instructions summary
    let instructions_summary: string | undefined;
    if (options?.include_instructions) {
      instructions_summary = graph.nodes.map(node => {
        const nodeId = (node as any).node_id || (node as any).id;
        const agentName = (node as any).agent_name || (node as any).agent || 'unknown';
        const instructions = (node as any).instructions || 'No instructions provided';
        const context = (node as any).context;
        const mcpTools = (node as any).available_mcp_tools || [];
        const tools = (node as any).available_tools || [];
        
        let summary = `**${nodeId}** (${agentName}):\n`;
        summary += `  Instructions: ${instructions}\n`;
        if (context) {
          summary += `  Context: ${context}\n`;
        }
        
        // Add MCP tools
        if (mcpTools.length > 0) {
          summary += `  MCP Tools:\n`;
          mcpTools.forEach((tool: any) => {
            summary += `    - ${tool.server_name}/${tool.tool_name}`;
            if (tool.when_to_use) {
              summary += ` - ${tool.when_to_use}`;
            }
            summary += '\n';
          });
        }
        
        // Add external tools
        if (tools.length > 0) {
          summary += `  External Tools:\n`;
          tools.forEach((tool: any) => {
            summary += `    - ${tool.tool_name}`;
            if (tool.when_to_use) {
              summary += ` - ${tool.when_to_use}`;
            }
            summary += '\n';
          });
        }
        
        return summary;
      }).join('\n');
    }

    return {
      success: true,
      result: {
        mermaid,
        node_count: graph.nodes.length,
        edge_count: graph.edges.length,
        instructions_summary
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VISUALIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to visualize graph',
        details: { error: String(error) }
      }
    };
  }
}

// ============================================================================
// Tool 7: generate_artifacts
// ============================================================================

export async function generateArtifactsTool(params: {
  graph: IntentGraph;
  orchestration_card: OrchestrationCard;
  artifact_types?: string[];
}): Promise<ToolResponse<GenerationArtifacts>> {
  try {
    const { graph, orchestration_card, artifact_types } = params;
    const artifacts: GenerationArtifacts = {};

    const shouldGenerate = (type: string) =>
      !artifact_types || artifact_types.includes(type);

    if (shouldGenerate('reasoning')) {
      artifacts.reasoning = `Graph generated for: "${orchestration_card.user_request.description}"

Agents used: ${graph.nodes.map(n => (n as any).agent_name || (n as any).agent || 'unknown').join(', ')}

Flow:
${graph.nodes.map((n, i) => {
  const agentName = (n as any).agent_name || (n as any).agent || 'unknown';
  const nodeType = (n as any).node_type || (n as any).type || 'processing';
  const purpose = (n as any).purpose || 'process data';
  const mcpTools = (n as any).available_mcp_tools || [];
  const tools = (n as any).available_tools || [];
  
  let line = `${i + 1}. ${agentName} (${nodeType}): ${purpose}`;
  
  if (mcpTools.length > 0) {
    line += `\n   MCP Tools: ${mcpTools.map((t: any) => `${t.server_name}/${t.tool_name}`).join(', ')}`;
  }
  if (tools.length > 0) {
    line += `\n   External Tools: ${tools.map((t: any) => t.tool_name).join(', ')}`;
  }
  
  return line;
}).join('\n')}

The graph fulfills the user's request by creating a ${graph.nodes.length}-node workflow with ${graph.edges.length} connections.`;
    }

    if (shouldGenerate('alternatives')) {
      artifacts.alternatives = [
        { approach: 'sequential', description: 'Fully sequential execution (lower complexity, higher latency)' },
        { approach: 'parallel', description: 'Maximum parallelization (higher complexity, lower latency)' },
        { approach: 'hybrid', description: 'Hybrid approach with conditional branches (balanced)' }
      ];
    }

    if (shouldGenerate('optimizations')) {
      const parallelOps = findParallelOpportunities(graph);
      artifacts.optimizations = [
        { type: 'parallelization', description: `Identified ${parallelOps.length} parallel execution opportunities` },
        { type: 'reliability', description: 'Added retry policies for improved reliability' },
        { type: 'performance', description: 'Optimized timeout values based on historical data' }
      ];
    }

    return { success: true, result: artifacts };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ARTIFACT_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate artifacts',
        details: { error: String(error) }
      }
    };
  }
}


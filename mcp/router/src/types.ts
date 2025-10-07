/**
 * Type definitions for the Router MCP Server
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

export interface IntentGraphNode {
  id: string;
  node_id?: string;
  agent: string;
  tool: string;
  input: Record<string, any>;
  dependencies: string[];
  output_mapping?: Record<string, string>;
  retry_policy?: {
    max_attempts?: number;
    backoff_strategy?: 'linear' | 'exponential';
  };
  timeout_ms?: number;
}

export interface IntentGraphEdge {
  from: string;
  to: string;
  condition?: string;
  data_flow?: Record<string, string>;
}

export interface IntentGraph {
  graph_id: string;
  version: string;
  nodes: IntentGraphNode[];
  edges: IntentGraphEdge[];
  execution_plan?: {
    execution_strategy: string;
    parallel_groups?: string[][];
  };
  metadata?: any;
}

export interface ExecutionConfig {
  max_parallel?: number;
  timeout_ms?: number;
  enable_quality_check?: boolean;
  enable_hitl?: boolean;
  max_retries?: number;
  store_state_in_memory?: boolean;
}

export interface NodeResult {
  node_id: string;
  success: boolean;
  result?: any;
  error?: string;
  execution_time_ms: number;
  attempts: number;
  timestamp: string;
}

export interface ExecutionResult {
  execution_id: string;
  status: 'completed' | 'failed' | 'paused_for_approval' | 'cancelled';
  results: Record<string, NodeResult>;
  execution_time_ms: number;
  nodes_executed: number;
  nodes_failed: string[];
  context: Record<string, any>;
  paused_at_node?: string;
  waiting_for_approval?: boolean;
}


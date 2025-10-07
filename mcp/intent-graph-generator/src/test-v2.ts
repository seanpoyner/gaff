#!/usr/bin/env node

/**
 * Comprehensive Test Suite for IntentGraph MCP Server v2.0
 * Tests all 7 tools with various scenarios
 * 
 * Run with: npm run test
 */

import { generateIntentGraphTool } from './tools/generate.js';
import type { OrchestrationCard } from './types.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m'     // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}${message}${reset}`);
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    log(`\n▶ Running: ${name}`, 'info');
    await testFn();
    testsPassed++;
    log(`  ✓ PASSED: ${name}`, 'success');
  } catch (error) {
    testsFailed++;
    log(`  ✗ FAILED: ${name}`, 'error');
    log(`    Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    if (error instanceof Error && error.stack) {
      log(`    Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`, 'error');
    }
  }
}

function skipTest(name: string, reason: string): void {
  testsSkipped++;
  log(`\n⊘ SKIPPED: ${name}`, 'warn');
  log(`  Reason: ${reason}`, 'warn');
}

// Sample orchestration cards
const sampleOrchestrationCard: OrchestrationCard = {
  user_request: {
    description: "Process customer orders end-to-end with validation, payment, inventory, and notification",
    domain: "e-commerce",
    success_criteria: [
      "Orders processed within 5 seconds",
      "Payment success rate > 99%"
    ]
  },
  available_agents: [
    {
      name: "OrderValidator",
      type: "validator",
      capabilities: ["schema_validation", "business_rules"],
      input_schema: { order: { type: "object" } },
      output_schema: { is_valid: { type: "boolean" }, validated_order: { type: "object" } }
    },
    {
      name: "PaymentProcessor",
      type: "api",
      capabilities: ["stripe_payment", "refund"],
      input_schema: { amount: { type: "number" }, method: { type: "object" } },
      output_schema: { transaction_id: { type: "string" }, status: { type: "string" } }
    },
    {
      name: "InventoryManager",
      type: "tool",
      capabilities: ["update_stock", "reserve_items"],
      input_schema: { items: { type: "array" } },
      output_schema: { updated: { type: "boolean" } }
    },
    {
      name: "NotificationService",
      type: "tool",
      capabilities: ["send_email", "send_sms"],
      input_schema: { recipient: { type: "string" }, message: { type: "string" } },
      output_schema: { sent: { type: "boolean" } }
    }
  ],
  constraints: {
    max_iterations: 5,
    timeout_ms: 5000
  },
  context: {
    environment: "production",
    request_id: "test_request_001"
  },
  preferences: {
    optimize_for: "reliability",
    parallelization: "balanced"
  },
  example_scenarios: [
    {
      scenario: "Happy path - order is valid, payment succeeds, inventory updates, notification sent"
    }
  ]
};

const minimalOrchestrationCard: OrchestrationCard = {
  user_request: {
    description: "Simple data validation workflow that validates input and returns result",
    success_criteria: ["Fast response"]
  },
  available_agents: [
    {
      name: "DataValidator",
      type: "validator",
      capabilities: ["validate"],
      input_schema: { data: { type: "object" } },
      output_schema: { valid: { type: "boolean" } }
    }
  ],
  constraints: {
    max_iterations: 1,
    timeout_ms: 1000
  }
};

// ============================================================================
// Test Suite
// ============================================================================

async function main(): Promise<void> {
  log('\n========================================', 'info');
  log('IntentGraph MCP Server v2.0 Test Suite', 'info');
  log('========================================\n', 'info');

  const hasApiKey = !!(process.env.LLM_API_KEY || process.env.WRITER_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  
  if (!hasApiKey) {
    log('⚠️  LLM API key not found in environment', 'warn');
    log('   LLM-powered tests will be skipped', 'warn');
    log('   Set LLM_API_KEY (or WRITER_API_KEY/OPENAI_API_KEY/ANTHROPIC_API_KEY)', 'warn');
    log('   PowerShell: $env:LLM_API_KEY="your-key"; npm test', 'warn');
    log('   Bash: export LLM_API_KEY="your-key"; npm test\n', 'warn');
  }

  // ========================================================================
  // Tool 1: generate_intent_graph
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 1: generate_intent_graph', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  if (hasApiKey) {
    await runTest('generate_intent_graph: Standard orchestration card', async () => {
      const result = await generateIntentGraphTool({
        orchestration_card: sampleOrchestrationCard,
        options: {
          validate: true,
          optimize: false,
          format: 'json'
        }
      });

      assert(result.success === true, 'Should succeed');
      if (!result.success) return;

      assert(result.result.intent_graph !== undefined, 'Should return intent graph');
      assert(result.result.intent_graph.nodes.length > 0, 'Should have nodes');
      assert(result.result.intent_graph.edges.length > 0, 'Should have edges');
      assert(result.result.metadata !== undefined, 'Should have metadata');
      assert(result.result.metadata.generation_timestamp !== undefined, 'Should have timestamp');
    });

    await runTest('generate_intent_graph: Minimal orchestration card', async () => {
      const result = await generateIntentGraphTool({
        orchestration_card: minimalOrchestrationCard,
        options: {
          validate: false,
          format: 'json'
        }
      });

      assert(result.success === true, 'Should succeed');
      if (!result.success) return;

      assert(result.result.intent_graph !== undefined, 'Should return intent graph');
      assert(result.result.intent_graph.nodes.length >= 1, 'Should have at least one node');
    });

    await runTest('generate_intent_graph: With artifacts', async () => {
      const result = await generateIntentGraphTool({
        orchestration_card: sampleOrchestrationCard,
        options: {
          include_artifacts: true,
          artifact_types: ['reasoning', 'alternatives'],
          format: 'json'
        }
      });

      assert(result.success === true, 'Should succeed');
      if (!result.success) return;

      assert(result.result.artifacts !== undefined, 'Should include artifacts');
      assert(result.result.artifacts!.reasoning !== undefined, 'Should have reasoning artifact');
    });

    await runTest('generate_intent_graph: With validation', async () => {
      const result = await generateIntentGraphTool({
        orchestration_card: sampleOrchestrationCard,
        options: {
          validate: true,
          format: 'json'
        }
      });

      assert(result.success === true, 'Should succeed');
      if (!result.success) return;

      assert(result.result.validation !== undefined, 'Should have validation results');
    });

    await runTest('generate_intent_graph: With optimization', async () => {
      const result = await generateIntentGraphTool({
        orchestration_card: sampleOrchestrationCard,
        options: {
          optimize: true,
          format: 'json'
        }
      });

      assert(result.success === true, 'Should succeed');
      if (!result.success) return;

      // Optimization tracking is in metadata or validation
      assert(result.result.metadata !== undefined, 'Should have metadata');
    });

    await runTest('generate_intent_graph: Complex workflow', async () => {
      const complexCard: OrchestrationCard = {
        user_request: {
          description: "Multi-stage approval workflow with parallel processing including validation, permission checking, data processing, aggregation, and notifications",
          success_criteria: ["Complete within 10 seconds", "100% reliability"]
        },
        available_agents: [
          {
            name: "RequestValidator",
            type: "validator",
            capabilities: ["validate"],
            input_schema: { request: { type: "object" } },
            output_schema: { valid: { type: "boolean" } }
          },
          {
            name: "PermissionChecker",
            type: "validator",
            capabilities: ["check_permissions"],
            input_schema: { user: { type: "string" }, resource: { type: "string" } },
            output_schema: { allowed: { type: "boolean" } }
          },
          {
            name: "DataProcessor",
            type: "transformer",
            capabilities: ["transform"],
            input_schema: { data: { type: "object" } },
            output_schema: { processed: { type: "object" } }
          },
          {
            name: "Aggregator",
            type: "aggregator",
            capabilities: ["combine"],
            input_schema: { results: { type: "array" } },
            output_schema: { combined: { type: "object" } }
          }
        ],
        constraints: {
          max_iterations: 10,
          timeout_ms: 10000
        },
        preferences: {
          optimize_for: "speed",
          parallelization: "aggressive"
        }
      };

      const result = await generateIntentGraphTool({
        orchestration_card: complexCard,
        options: { validate: true, optimize: true }
      });

      assert(result.success === true, 'Should succeed with complex workflow');
      if (!result.success) return;

      assert(result.result.intent_graph.nodes.length >= 4, 'Should create nodes for all agents');
    });

    await runTest('generate_intent_graph: Error handling - missing required field', async () => {
      const invalidCard: any = {
        user_request: {
          description: "Test"
        }
        // Missing available_resources - required field
      };

      const result = await generateIntentGraphTool({
        orchestration_card: invalidCard,
        options: {}
      });

      assert(result.success === false, 'Should fail with invalid input');
      if (result.success) return;

      assert(result.error.code !== undefined, 'Should have error code');
      assert(result.error.message !== undefined, 'Should have error message');
    });

  } else {
    skipTest('generate_intent_graph tests', 'LLM API key not set');
  }

  // ========================================================================
  // Tool 2: validate_graph
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 2: validate_graph', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  await runTest('validate_graph: Valid complete graph', async () => {
    // First generate a graph
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { validateGraphTool } = await import('./tools/helpers.js');
    const result = await validateGraphTool({
      graph: genResult.result.intent_graph
    });

    assert(result.success === true, 'Validation should succeed');
    if (!result.success) return;

    assert(result.result.is_valid !== undefined, 'Should have is_valid field');
    assert(result.result.checks_performed !== undefined, 'Should have checks_performed');
    assert(Array.isArray(result.result.checks_performed), 'checks_performed should be array');
  });

  await runTest('validate_graph: Invalid graph structure', async () => {
    const { validateGraphTool } = await import('./tools/helpers.js');
    const invalidGraph: any = {
      nodes: [],
      edges: [{ edge_id: 'edge1', from_node: 'n1', to_node: 'n2', edge_type: 'sequential' }]
      // Edges reference non-existent nodes
    };

    const result = await validateGraphTool({ graph: invalidGraph });

    // It should still process but may indicate validation issues
    assert(result.success === true, 'Should handle invalid graph gracefully');
  });

  // ========================================================================
  // Tool 3: analyze_graph
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 3: analyze_graph', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  await runTest('analyze_graph: Complexity analysis', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { analyzeGraphTool } = await import('./tools/helpers.js');
    const result = await analyzeGraphTool({
      graph: genResult.result.intent_graph,
      analysis_types: ['complexity']
    });

    assert(result.success === true, 'Analysis should succeed');
    if (!result.success) return;

    assert(result.result.complexity !== undefined, 'Should have complexity metrics');
    if (result.result.complexity) {
      assert(result.result.complexity.node_count > 0, 'Should have node count');
      assert(result.result.complexity.edge_count >= 0, 'Should have edge count');
    }
  });

  await runTest('analyze_graph: Parallel opportunities', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { analyzeGraphTool } = await import('./tools/helpers.js');
    const result = await analyzeGraphTool({
      graph: genResult.result.intent_graph,
      analysis_types: ['parallel_opportunities']
    });

    assert(result.success === true, 'Analysis should succeed');
    if (!result.success) return;

    assert(result.result.parallel_opportunities !== undefined, 'Should have parallel opportunities');
    assert(Array.isArray(result.result.parallel_opportunities), 'Should be array');
  });

  await runTest('analyze_graph: Critical path', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { analyzeGraphTool } = await import('./tools/helpers.js');
    const result = await analyzeGraphTool({
      graph: genResult.result.intent_graph,
      analysis_types: ['critical_path']
    });

    assert(result.success === true, 'Analysis should succeed');
    if (!result.success) return;

    assert(result.result.critical_path !== undefined, 'Should have critical path');
    if (result.result.critical_path) {
      assert(result.result.critical_path.path !== undefined, 'Should have path array');
      assert(result.result.critical_path.estimated_duration_ms !== undefined, 'Should have duration');
    }
  });

  await runTest('analyze_graph: All analysis types', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { analyzeGraphTool } = await import('./tools/helpers.js');
    const result = await analyzeGraphTool({
      graph: genResult.result.intent_graph,
      analysis_types: ['complexity', 'parallel_opportunities', 'critical_path', 'bottlenecks']
    });

    assert(result.success === true, 'Analysis should succeed');
    if (!result.success) return;

    assert(result.result.complexity !== undefined, 'Should have complexity');
    assert(result.result.parallel_opportunities !== undefined, 'Should have parallel opportunities');
    assert(result.result.critical_path !== undefined, 'Should have critical path');
    assert(result.result.bottlenecks !== undefined, 'Should have bottlenecks');
  });

  // ========================================================================
  // Tool 4: optimize_graph
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 4: optimize_graph', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  await runTest('optimize_graph: Parallelization strategy', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { optimizeGraphTool } = await import('./tools/helpers.js');
    const result = await optimizeGraphTool({
      graph: genResult.result.intent_graph,
      optimization_strategies: ['parallelize']
    });

    assert(result.success === true, 'Optimization should succeed');
    if (!result.success) return;

    assert(result.result.optimized_graph !== undefined, 'Should have optimized graph');
    assert(result.result.optimizations_applied !== undefined, 'Should have optimizations list');
    assert(Array.isArray(result.result.optimizations_applied), 'optimizations_applied should be array');
  });

  await runTest('optimize_graph: Reliability improvements', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { optimizeGraphTool } = await import('./tools/helpers.js');
    const result = await optimizeGraphTool({
      graph: genResult.result.intent_graph,
      optimization_strategies: ['improve_reliability']
    });

    assert(result.success === true, 'Optimization should succeed');
    if (!result.success) return;

    // Check that retry policies were added
    const optimizedGraph = result.result.optimized_graph;
    const nodesWithRetry = optimizedGraph.nodes.filter(n => n.configuration?.retry_policy);
    assert(nodesWithRetry.length > 0, 'Should have added retry policies');
  });

  await runTest('optimize_graph: Multiple strategies', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { optimizeGraphTool } = await import('./tools/helpers.js');
    const result = await optimizeGraphTool({
      graph: genResult.result.intent_graph,
      optimization_strategies: ['parallelize', 'reduce_latency', 'minimize_cost', 'improve_reliability']
    });

    assert(result.success === true, 'Optimization should succeed');
    if (!result.success) return;

    assert(result.result.optimizations_applied.length >= 3, 'Should have multiple optimizations');
    assert(result.result.improvements !== undefined, 'Should have improvements metrics');
  });

  // ========================================================================
  // Tool 5: export_graph
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 5: export_graph', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  await runTest('export_graph: JSON format', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: minimalOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { exportGraphTool } = await import('./tools/helpers.js');
    const result = await exportGraphTool({
      graph: genResult.result.intent_graph,
      format: 'json'
    });

    assert(result.success === true, 'Export should succeed');
    if (!result.success) return;

    assert(result.result.exported !== undefined, 'Should have exported string');
    assert(result.result.format === 'json', 'Format should be json');
    
    // Verify it's valid JSON
    const parsed = JSON.parse(result.result.exported);
    assert(parsed.nodes !== undefined, 'Exported JSON should have nodes');
  });

  await runTest('export_graph: YAML format', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: minimalOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { exportGraphTool } = await import('./tools/helpers.js');
    const result = await exportGraphTool({
      graph: genResult.result.intent_graph,
      format: 'yaml'
    });

    assert(result.success === true, 'Export should succeed');
    if (!result.success) return;

    assert(result.result.format === 'yaml', 'Format should be yaml');
    assert(result.result.exported.includes('nodes:'), 'YAML should contain nodes');
  });

  await runTest('export_graph: DOT format', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: minimalOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { exportGraphTool } = await import('./tools/helpers.js');
    const result = await exportGraphTool({
      graph: genResult.result.intent_graph,
      format: 'dot'
    });

    assert(result.success === true, 'Export should succeed');
    if (!result.success) return;

    assert(result.result.format === 'dot', 'Format should be dot');
    assert(result.result.exported.includes('digraph'), 'DOT should contain digraph');
  });

  await runTest('export_graph: Mermaid format', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: minimalOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { exportGraphTool } = await import('./tools/helpers.js');
    const result = await exportGraphTool({
      graph: genResult.result.intent_graph,
      format: 'mermaid'
    });

    assert(result.success === true, 'Export should succeed');
    if (!result.success) return;

    assert(result.result.format === 'mermaid', 'Format should be mermaid');
    assert(result.result.exported.includes('graph'), 'Mermaid should contain graph');
  });

  // ========================================================================
  // Tool 6: visualize_graph
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 6: visualize_graph', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  await runTest('visualize_graph: Basic visualization', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: minimalOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { visualizeGraphTool } = await import('./tools/helpers.js');
    const result = await visualizeGraphTool({
      graph: genResult.result.intent_graph
    });

    assert(result.success === true, 'Visualization should succeed');
    if (!result.success) return;

    assert(result.result.mermaid !== undefined, 'Should have mermaid diagram');
    assert(result.result.node_count > 0, 'Should have node count');
    assert(result.result.mermaid.includes('graph'), 'Mermaid should contain graph');
  });

  await runTest('visualize_graph: With metadata', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { visualizeGraphTool } = await import('./tools/helpers.js');
    const result = await visualizeGraphTool({
      graph: genResult.result.intent_graph,
      options: { include_metadata: true }
    });

    assert(result.success === true, 'Visualization should succeed');
    if (!result.success) return;

    assert(result.result.mermaid.includes('%%'), 'Should include metadata comments');
  });

  await runTest('visualize_graph: Different directions', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: minimalOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { visualizeGraphTool } = await import('./tools/helpers.js');
    
    // Test TB direction
    const tbResult = await visualizeGraphTool({
      graph: genResult.result.intent_graph,
      options: { direction: 'TB' }
    });
    assert(tbResult.success === true, 'TB visualization should succeed');
    if (tbResult.success) {
      assert(tbResult.result.mermaid.includes('TB'), 'Should use TB direction');
    }

    // Test LR direction
    const lrResult = await visualizeGraphTool({
      graph: genResult.result.intent_graph,
      options: { direction: 'LR' }
    });
    assert(lrResult.success === true, 'LR visualization should succeed');
    if (lrResult.success) {
      assert(lrResult.result.mermaid.includes('LR'), 'Should use LR direction');
    }
  });

  await runTest('visualize_graph: With instructions summary', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { visualizeGraphTool } = await import('./tools/helpers.js');
    const result = await visualizeGraphTool({
      graph: genResult.result.intent_graph,
      options: { 
        include_instructions: true,
        include_tools: true,
        include_conditions: true 
      }
    });

    assert(result.success === true, 'Visualization should succeed');
    if (!result.success) return;

    assert(result.result.instructions_summary !== undefined, 'Should have instructions summary');
  });

  // ========================================================================
  // Tool 7: generate_artifacts
  // ========================================================================
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  log('Tool 7: generate_artifacts', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  await runTest('generate_artifacts: Reasoning artifact', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { generateArtifactsTool } = await import('./tools/helpers.js');
    const result = await generateArtifactsTool({
      graph: genResult.result.intent_graph,
      orchestration_card: sampleOrchestrationCard,
      artifact_types: ['reasoning']
    });

    assert(result.success === true, 'Artifact generation should succeed');
    if (!result.success) return;

    assert(result.result.reasoning !== undefined, 'Should have reasoning artifact');
    if (result.result.reasoning) {
      assert(typeof result.result.reasoning === 'string', 'Reasoning should be string');
      assert(result.result.reasoning.length > 0, 'Reasoning should not be empty');
    }
  });

  await runTest('generate_artifacts: Alternatives artifact', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { generateArtifactsTool } = await import('./tools/helpers.js');
    const result = await generateArtifactsTool({
      graph: genResult.result.intent_graph,
      orchestration_card: sampleOrchestrationCard,
      artifact_types: ['alternatives']
    });

    assert(result.success === true, 'Artifact generation should succeed');
    if (!result.success) return;

    assert(result.result.alternatives !== undefined, 'Should have alternatives artifact');
    assert(Array.isArray(result.result.alternatives), 'Alternatives should be array');
  });

  await runTest('generate_artifacts: Optimizations artifact', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { generateArtifactsTool } = await import('./tools/helpers.js');
    const result = await generateArtifactsTool({
      graph: genResult.result.intent_graph,
      orchestration_card: sampleOrchestrationCard,
      artifact_types: ['optimizations']
    });

    assert(result.success === true, 'Artifact generation should succeed');
    if (!result.success) return;

    assert(result.result.optimizations !== undefined, 'Should have optimizations artifact');
    assert(Array.isArray(result.result.optimizations), 'Optimizations should be array');
  });

  await runTest('generate_artifacts: All artifact types', async () => {
    if (!hasApiKey) {
      log('  ⊘ Skipping - requires LLM API', 'warn');
      testsSkipped++;
      return;
    }

    const genResult = await generateIntentGraphTool({
      orchestration_card: sampleOrchestrationCard,
      options: { validate: false, format: 'json' }
    });
    
    assert(genResult.success === true, 'Graph generation should succeed');
    if (!genResult.success) return;

    const { generateArtifactsTool } = await import('./tools/helpers.js');
    const result = await generateArtifactsTool({
      graph: genResult.result.intent_graph,
      orchestration_card: sampleOrchestrationCard,
      artifact_types: ['reasoning', 'alternatives', 'optimizations']
    });

    assert(result.success === true, 'Artifact generation should succeed');
    if (!result.success) return;

    assert(result.result.reasoning !== undefined, 'Should have reasoning');
    assert(result.result.alternatives !== undefined, 'Should have alternatives');
    assert(result.result.optimizations !== undefined, 'Should have optimizations');
  });

  // ========================================================================
  // Summary
  // ========================================================================

  log('\n========================================', 'info');
  log('Test Summary', 'info');
  log('========================================', 'info');
  log(`✓ Passed:  ${testsPassed}`, 'success');
  log(`✗ Failed:  ${testsFailed}`, 'error');
  log(`⊘ Skipped: ${testsSkipped}`, 'warn');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'info');

  if (testsFailed > 0) {
    log('❌ Test suite failed', 'error');
    process.exit(1);
  } else if (testsPassed === 0) {
    log('⚠️  No tests were run', 'warn');
    process.exit(1);
  } else {
    log('✅ All tests passed!', 'success');
    process.exit(0);
  }
}

// Run tests
main().catch((error) => {
  log(`\n💥 Fatal error: ${error}`, 'error');
  process.exit(1);
});


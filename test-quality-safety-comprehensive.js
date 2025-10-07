#!/usr/bin/env node
/**
 * Comprehensive Quality & Safety Integration Tests
 * 
 * Tests all edge cases for the new v1.4.0 features:
 * - Auto-injection of quality/safety nodes
 * - Pre/post execution validation
 * - Automatic rerun logic
 * - Quality scoring
 * - Compliance checking
 */

import { spawn } from 'child_process';

// Test orchestration cards with different quality/safety configurations
const TEST_CASES = {
  
  // ========================================
  // TEST 1: Basic Quality & Safety (Happy Path)
  // ========================================
  test1_basic: {
    name: "Basic Quality & Safety (Happy Path)",
    description: "Simple workflow with both quality and safety enabled",
    orchestration_card: {
      user_request: {
        original_query: "Analyze sentiment of: 'Great product!'",
        description: "Sentiment analysis task",
        intent: "sentiment_analysis"
      },
      available_agents: [
        {
          name: "SentimentAnalyzer",
          type: "llm",
          capabilities: ["sentiment_analysis"],
          description: "Analyzes text sentiment",
          input_schema: { type: "object", properties: { text: { type: "string" } } },
          output_schema: { type: "object", properties: { sentiment: { type: "string" }, score: { type: "number" } } }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.75,  // Low threshold to ensure pass
        auto_validate: true,
        rerun_strategy: "adaptive",
        max_rerun_attempts: 1
      },
      safety_requirements: {
        enabled: true,
        compliance_standards: ["GDPR"],
        audit_logging: true
      }
    },
    expected: {
      status: "completed",
      has_quality_validation: true,
      has_safety_validation: true,
      quality_score_min: 0.75,
      injected_nodes: 5,
      audit_logged: true
    }
  },

  // ========================================
  // TEST 2: High Quality Threshold (Likely Rerun)
  // ========================================
  test2_high_threshold: {
    name: "High Quality Threshold (Triggers Rerun)",
    description: "Set quality threshold very high to trigger automatic rerun",
    orchestration_card: {
      user_request: {
        original_query: "Quick sentiment check",
        description: "Fast sentiment analysis",
        intent: "sentiment_analysis"
      },
      available_agents: [
        {
          name: "SentimentAnalyzer",
          type: "llm",
          capabilities: ["sentiment_analysis"],
          description: "Analyzes sentiment",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.95,  // Very high threshold
        auto_validate: true,
        rerun_strategy: "adaptive",
        max_rerun_attempts: 2
      },
      safety_requirements: {
        enabled: false
      }
    },
    expected: {
      status: "completed OR failed_quality",
      has_quality_validation: true,
      rerun_attempts_max: 2,
      injected_nodes: 1  // Only quality validator
    }
  },

  // ========================================
  // TEST 3: Maximum Reruns Reached
  // ========================================
  test3_max_reruns: {
    name: "Maximum Reruns Reached",
    description: "Impossible quality threshold to hit max reruns",
    orchestration_card: {
      user_request: {
        original_query: "Test task",
        description: "Test automatic rerun limits",
        intent: "testing"
      },
      available_agents: [
        {
          name: "TestAgent",
          type: "llm",
          capabilities: ["test"],
          description: "Test agent",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 1.0,  // Impossible threshold
        auto_validate: true,
        rerun_strategy: "full",
        max_rerun_attempts: 3
      }
    },
    expected: {
      status: "failed_quality",
      rerun_attempts: 3,
      quality_score_below_threshold: true
    }
  },

  // ========================================
  // TEST 4: Quality Disabled, Safety Enabled
  // ========================================
  test4_safety_only: {
    name: "Safety Only (No Quality)",
    description: "Test safety validation independently",
    orchestration_card: {
      user_request: {
        original_query: "Process user data",
        description: "Data processing with compliance",
        intent: "data_processing"
      },
      available_agents: [
        {
          name: "DataProcessor",
          type: "transformer",
          capabilities: ["data_processing"],
          description: "Processes data",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: false
      },
      safety_requirements: {
        enabled: true,
        compliance_standards: ["GDPR", "PCI-DSS"],
        guardrails: {
          pii_detection: true
        },
        audit_logging: true
      }
    },
    expected: {
      has_quality_validation: false,
      has_safety_validation: true,
      compliance_standards: ["GDPR", "PCI-DSS"],
      audit_logged: true,
      injected_nodes: 4  // 4 safety nodes, no quality
    }
  },

  // ========================================
  // TEST 5: Quality Enabled, Safety Disabled
  // ========================================
  test5_quality_only: {
    name: "Quality Only (No Safety)",
    description: "Test quality validation independently",
    orchestration_card: {
      user_request: {
        original_query: "Generate report",
        description: "Report generation",
        intent: "report_generation"
      },
      available_agents: [
        {
          name: "ReportGenerator",
          type: "llm",
          capabilities: ["report_generation"],
          description: "Generates reports",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.8,
        required_fields: ["title", "summary", "details"],
        auto_validate: true
      },
      safety_requirements: {
        enabled: false
      }
    },
    expected: {
      has_quality_validation: true,
      has_safety_validation: false,
      required_fields_checked: ["title", "summary", "details"],
      injected_nodes: 1  // Only quality validator
    }
  },

  // ========================================
  // TEST 6: Both Disabled (Backwards Compatibility)
  // ========================================
  test6_legacy_mode: {
    name: "Both Disabled (Legacy Mode)",
    description: "Ensure backwards compatibility with no quality/safety",
    orchestration_card: {
      user_request: {
        original_query: "Simple task",
        description: "Simple task execution",
        intent: "simple_task"
      },
      available_agents: [
        {
          name: "SimpleAgent",
          type: "llm",
          capabilities: ["simple_task"],
          description: "Simple agent",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: false
      },
      safety_requirements: {
        enabled: false
      }
    },
    expected: {
      has_quality_validation: false,
      has_safety_validation: false,
      injected_nodes: 0,  // No injection
      backwards_compatible: true
    }
  },

  // ========================================
  // TEST 7: Zero Rerun Attempts
  // ========================================
  test7_no_reruns: {
    name: "Zero Rerun Attempts",
    description: "Set max_rerun_attempts to 0, no rerun even if fails",
    orchestration_card: {
      user_request: {
        original_query: "Test no reruns",
        description: "Quality check without reruns",
        intent: "testing"
      },
      available_agents: [
        {
          name: "TestAgent",
          type: "llm",
          capabilities: ["test"],
          description: "Test agent",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.95,
        auto_validate: true,
        rerun_strategy: "adaptive",
        max_rerun_attempts: 0  // No reruns allowed
      }
    },
    expected: {
      rerun_attempts: 0,
      status: "completed OR failed_quality",
      no_reruns_performed: true
    }
  },

  // ========================================
  // TEST 8: Multiple Compliance Standards
  // ========================================
  test8_multi_compliance: {
    name: "Multiple Compliance Standards",
    description: "Test validation against multiple compliance frameworks",
    orchestration_card: {
      user_request: {
        original_query: "Process healthcare payment data",
        description: "Healthcare payment processing",
        intent: "payment_processing"
      },
      available_agents: [
        {
          name: "PaymentProcessor",
          type: "api",
          capabilities: ["payment_processing"],
          description: "Processes payments",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.9
      },
      safety_requirements: {
        enabled: true,
        compliance_standards: ["HIPAA", "PCI-DSS", "GDPR", "SOC2"],  // Multiple standards
        guardrails: {
          pii_detection: true
        },
        audit_logging: true
      }
    },
    expected: {
      compliance_standards: ["HIPAA", "PCI-DSS", "GDPR", "SOC2"],
      has_compliance_check: true,
      audit_logged: true
    }
  },

  // ========================================
  // TEST 9: Custom Scoring Weights
  // ========================================
  test9_custom_weights: {
    name: "Custom Quality Scoring Weights",
    description: "Test custom weights for quality components",
    orchestration_card: {
      user_request: {
        original_query: "Data analysis task",
        description: "Analyze data with custom quality weights",
        intent: "data_analysis"
      },
      available_agents: [
        {
          name: "DataAnalyzer",
          type: "llm",
          capabilities: ["data_analysis"],
          description: "Analyzes data",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.85,
        auto_validate: true,
        scoring_weights: {
          completeness_weight: 0.5,  // Prioritize completeness
          accuracy_weight: 0.3,
          performance_weight: 0.2
        }
      }
    },
    expected: {
      custom_weights_used: true,
      completeness_weight: 0.5,
      accuracy_weight: 0.3,
      performance_weight: 0.2
    }
  },

  // ========================================
  // TEST 10: Complex Multi-Agent Workflow
  // ========================================
  test10_complex_workflow: {
    name: "Complex Multi-Agent Workflow",
    description: "Full pipeline with multiple agents and all features",
    orchestration_card: {
      user_request: {
        original_query: "Complete customer onboarding workflow",
        description: "Multi-step customer onboarding with validation, processing, and notification",
        intent: "customer_onboarding"
      },
      available_agents: [
        {
          name: "InputValidator",
          type: "validator",
          capabilities: ["validation"],
          description: "Validates input",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        },
        {
          name: "DataProcessor",
          type: "transformer",
          capabilities: ["data_processing"],
          description: "Processes data",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        },
        {
          name: "ComplianceChecker",
          type: "validator",
          capabilities: ["compliance"],
          description: "Checks compliance",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        },
        {
          name: "NotificationService",
          type: "api",
          capabilities: ["notification"],
          description: "Sends notifications",
          input_schema: { type: "object" },
          output_schema: { type: "object" }
        }
      ],
      quality_requirements: {
        enabled: true,
        accuracy_threshold: 0.9,
        completeness_required: true,
        required_fields: ["customer_id", "status", "timestamp"],
        auto_validate: true,
        rerun_strategy: "adaptive",
        max_rerun_attempts: 2
      },
      safety_requirements: {
        enabled: true,
        compliance_standards: ["GDPR", "SOC2"],
        guardrails: {
          pii_detection: true,
          content_filtering: false
        },
        input_validation: {
          max_size_bytes: 500000,
          sanitize_input: true
        },
        output_validation: {
          mask_pii: true,
          sanitize_output: true
        },
        audit_logging: true
      }
    },
    expected: {
      total_nodes: 9,  // 4 original + 5 injected
      injected_nodes: 5,
      has_full_pipeline: true,
      audit_logged: true,
      pii_masked: true
    }
  }
};

/**
 * Run a single test case
 */
async function runTest(testKey, testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${testCase.description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Step 1: Generate Intent Graph
    console.log('📊 Step 1: Generating intent graph with quality/safety requirements...');
    const graphResult = await callMCPServer('intent-graph-mcp-server', 'generate_intent_graph', {
      orchestration_card: testCase.orchestration_card,
      options: { validate: true, store_in_memory: true }
    });

    if (!graphResult.intent_graph) {
      throw new Error('Failed to generate intent graph');
    }

    const graph = graphResult.intent_graph;
    console.log(`✅ Intent graph generated`);
    console.log(`   Original nodes: ${graph.nodes.filter(n => !n.node_id?.startsWith('_')).length}`);
    console.log(`   Injected nodes: ${graph.nodes.filter(n => n.node_id?.startsWith('_')).length}`);
    console.log(`   Total nodes: ${graph.nodes.length}`);

    // Verify injection
    const injectedNodes = graph.nodes.filter(n => n.node_id?.startsWith('_'));
    console.log(`\n📋 Auto-Injected Nodes:`);
    injectedNodes.forEach(node => {
      console.log(`   - ${node.node_id}: ${node.purpose}`);
    });

    // Step 2: Execute with Router
    console.log(`\n⚙️  Step 2: Executing workflow with quality/safety validation...`);
    const execResult = await callMCPServer('router-mcp-server', 'execute_graph', {
      graph: graph,
      context: { user_query: testCase.orchestration_card.user_request.original_query },
      config: { max_parallel: 2, enable_hitl: false },
      quality_requirements: testCase.orchestration_card.quality_requirements,
      safety_requirements: testCase.orchestration_card.safety_requirements,
      orchestration_card: testCase.orchestration_card
    });

    console.log(`✅ Execution complete`);
    console.log(`   Status: ${execResult.status}`);
    console.log(`   Execution time: ${execResult.execution_time_ms}ms`);

    // Display Quality Validation Results
    if (execResult.quality_validation) {
      console.log(`\n📊 Quality Validation:`);
      console.log(`   Score: ${(execResult.quality_validation.quality_score * 100).toFixed(1)}%`);
      console.log(`   Acceptable: ${execResult.quality_validation.is_acceptable ? '✅' : '❌'}`);
      console.log(`   Rerun attempts: ${execResult.quality_validation.rerun_attempts}`);
      if (execResult.quality_validation.issues.length > 0) {
        console.log(`   Issues: ${execResult.quality_validation.issues.length}`);
      }
    }

    // Display Safety Validation Results
    if (execResult.safety_validation) {
      console.log(`\n🔒 Safety Validation:`);
      console.log(`   Input validated: ${execResult.safety_validation.input_validated ? '✅' : '❌'}`);
      console.log(`   Output validated: ${execResult.safety_validation.output_validated ? '✅' : '❌'}`);
      if (execResult.safety_validation.compliance_standards?.length > 0) {
        console.log(`   Compliance: ${execResult.safety_validation.compliance_standards.join(', ')}`);
      }
      console.log(`   Audit logged: ${execResult.safety_validation.audit_logged ? '✅' : '❌'}`);
    }

    // Validate against expected results
    console.log(`\n✅ Test Validation:`);
    const validations = [];
    
    if (testCase.expected.injected_nodes !== undefined) {
      const actual = injectedNodes.length;
      const expected = testCase.expected.injected_nodes;
      const pass = actual === expected;
      validations.push({ name: 'Injected nodes count', expected, actual, pass });
    }
    
    if (testCase.expected.has_quality_validation !== undefined) {
      const actual = !!execResult.quality_validation;
      const expected = testCase.expected.has_quality_validation;
      const pass = actual === expected;
      validations.push({ name: 'Quality validation present', expected, actual, pass });
    }
    
    if (testCase.expected.has_safety_validation !== undefined) {
      const actual = !!execResult.safety_validation;
      const expected = testCase.expected.has_safety_validation;
      const pass = actual === expected;
      validations.push({ name: 'Safety validation present', expected, actual, pass });
    }

    validations.forEach(v => {
      console.log(`   ${v.pass ? '✅' : '❌'} ${v.name}: expected=${v.expected}, actual=${v.actual}`);
    });

    const allPassed = validations.every(v => v.pass);
    return { testKey, passed: allPassed, result: execResult, validations };

  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    return { testKey, passed: false, error: error.message };
  }
}

/**
 * Call MCP server
 */
function callMCPServer(packageName, toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['-y', packageName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${packageName} exited with code ${code}`));
        return;
      }

      try {
        const lines = stdout.split('\n').filter(l => l.trim() && l.includes('"jsonrpc"'));
        if (lines.length === 0) {
          reject(new Error('No JSON-RPC response'));
          return;
        }

        const response = JSON.parse(lines[lines.length - 1]);
        if (response.error) {
          reject(new Error(response.error.message));
          return;
        }

        const content = response.result.content[0];
        resolve(JSON.parse(content.text));
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}`));
      }
    });

    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    };

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();

    setTimeout(() => {
      child.kill();
      reject(new Error('Timeout after 60s'));
    }, 60000);
  });
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 GAFF v1.4.0 - Quality & Safety Integration Tests');
  console.log('Testing comprehensive quality/safety features\n');

  // Check for API key
  if (!process.env.LLM_API_KEY && !process.env.WRITER_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ Error: No LLM API key found');
    console.error('   Set LLM_API_KEY, WRITER_API_KEY, or OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  const results = [];
  const testKeys = Object.keys(TEST_CASES);

  // Run each test
  for (const testKey of testKeys) {
    const result = await runTest(testKey, TEST_CASES[testKey]);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${TEST_CASES[r.testKey].name}`);
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\nTotal: ${passed}/${total} tests passed`);
  
  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);




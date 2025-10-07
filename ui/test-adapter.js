/**
 * Test script for GAFF OpenAI Adapter
 * 
 * Verifies the complete workflow pipeline:
 * 1. Orchestration card generation
 * 2. Intent graph generation
 * 3. Workflow execution
 * 4. Memory integration
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let adapterProcess = null;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Start the adapter
 */
function startAdapter() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Starting GAFF OpenAI Adapter...\n');
    
    const env = {
      ...process.env,
      GAFF_CONFIG_PATH: resolve(__dirname, '../gaff.json')
    };
    
    adapterProcess = spawn('node', [resolve(__dirname, 'openai-adapter.js')], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    
    adapterProcess.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      
      // Echo output
      process.stdout.write(text);
      
      // Check if server is ready
      if (text.includes('MCP servers will initialize on first request')) {
        setTimeout(() => resolve(), 2000);
      }
    });
    
    adapterProcess.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
    });
    
    adapterProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Adapter exited with code ${code}`));
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!output.includes('MCP servers will initialize')) {
        reject(new Error('Adapter failed to start in 10 seconds'));
      }
    }, 10000);
  });
}

/**
 * Make HTTP request to adapter
 */
async function makeRequest(query) {
  const response = await fetch('http://localhost:3100/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dummy-key-not-used'
    },
    body: JSON.stringify({
      model: 'gaff-gateway',
      messages: [
        { role: 'user', content: query }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

/**
 * Test case
 */
async function test(name, query, expectations) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 TEST: ${name}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📝 Query: "${query}"\n`);
  
  try {
    const result = await makeRequest(query);
    
    console.log('✅ Request successful\n');
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    
    const content = result.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }
    
    // Parse the response
    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.log('\n⚠️  Response is not JSON, treating as text');
      data = { text: content };
    }
    
    // Check expectations
    console.log('\n🔍 Checking expectations:');
    for (const [key, check] of Object.entries(expectations)) {
      const value = key.split('.').reduce((obj, k) => obj?.[k], data);
      const passed = check(value);
      
      if (passed) {
        console.log(`   ✅ ${key}: ${JSON.stringify(value)}`);
      } else {
        console.log(`   ❌ ${key}: ${JSON.stringify(value)}`);
        throw new Error(`Expectation failed: ${key}`);
      }
    }
    
    console.log(`\n✅ TEST PASSED: ${name}`);
    testsPassed++;
    return true;
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 GAFF OpenAI Adapter Test Suite');
  console.log('='.repeat(70));
  
  try {
    // Start adapter
    await startAdapter();
    console.log('\n✅ Adapter started successfully\n');
    
    // Wait for initialization
    console.log('⏳ Waiting 5 seconds for adapter to be ready...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 1: Simple query
    await test(
      'Simple Data Analysis Query',
      'Analyze customer feedback and identify top 3 issues',
      {
        'status': (v) => v === 'completed' || v === 'success',
        'orchestration_card': (v) => v !== undefined && v !== null,
        'intent_graph': (v) => v !== undefined && v !== null
      }
    );
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Complex multi-step query
    await test(
      'Multi-Step Workflow Query',
      'Fetch sales data, analyze trends, and generate a quarterly report with visualizations',
      {
        'status': (v) => v === 'completed' || v === 'success',
        'execution_id': (v) => typeof v === 'string' && v.length > 0
      }
    );
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Check memory integration
    await test(
      'Memory Integration Check',
      'Process customer satisfaction surveys and store insights',
      {
        'memory_key': (v) => v !== undefined && v !== 'undefined',
        'status': (v) => v === 'completed' || v === 'success'
      }
    );
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    testsFailed++;
  } finally {
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${testsPassed}/${testsPassed + testsFailed}`);
    console.log('='.repeat(70) + '\n');
    
    // Cleanup
    console.log('🧹 Cleaning up...');
    if (adapterProcess) {
      adapterProcess.kill();
    }
    
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  if (adapterProcess) {
    adapterProcess.kill();
  }
  process.exit(1);
});



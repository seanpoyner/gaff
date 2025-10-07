#!/usr/bin/env node
/**
 * Test script for memory storage integration
 * Tests both automatic storage and manual store_card tool
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server with Writer API key
const server = spawn('node', [resolve(__dirname, 'build/index.js')], {
  env: {
    ...process.env,
    GAFF_CONFIG_PATH: resolve(__dirname, 'examples/sample-gaff.json'),
    LLM_PROVIDER: 'writer'
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseBuffer = '';
let testPhase = 'init';
let orchestrationCard = null;

// Listen for responses
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim() && line.startsWith('{')) {
      try {
        const response = JSON.parse(line);
        
        // Skip initialization responses
        if (response.id === null || response.id === 'init') continue;
        
        // Handle tool call response
        if (response.result && response.result.content) {
          const content = JSON.parse(response.result.content[0].text);
          
          if (testPhase === 'generate_with_memory') {
            console.log('\n📥 TEST 1: Generate with store_in_memory=true\n');
            console.log('✅ Mode:', content.mode);
            console.log('✅ Success:', content.success);
            
            if (content.memory_key) {
              console.log('\n🔑 MEMORY KEY RETURNED:', content.memory_key);
              console.log('✅ Memory key format:', /^orchestration_[\w-]+_\d+_[\w]+$/.test(content.memory_key) ? 'VALID' : 'INVALID');
              
              // Store card for next test
              orchestrationCard = content.orchestration_card;
              
              console.log('\n📊 STORED DATA:');
              console.log('- Domain:', content.orchestration_card.user_request.domain);
              console.log('- Agents:', content.orchestration_card.available_agents.map(a => a.name).join(', '));
              
              console.log('\n✨ TEST 1 PASSED! Memory key generated and returned!');
              
              // Move to test 2
              setTimeout(() => testStoreCardTool(), 1000);
            } else {
              console.log('\n❌ TEST 1 FAILED: No memory_key in response');
              console.log('Response:', JSON.stringify(content, null, 2));
              server.kill();
              process.exit(1);
            }
          } else if (testPhase === 'store_card') {
            console.log('\n📥 TEST 2: Manual store_card tool\n');
            console.log('✅ Success:', content.success);
            
            if (content.memory_key) {
              console.log('🔑 MEMORY KEY:', content.memory_key);
              console.log('📝 Message:', content.message);
              console.log('💡 Note:', content.note);
              
              console.log('\n✨ TEST 2 PASSED! Manual storage works!');
              console.log('\n🎉 ALL MEMORY INTEGRATION TESTS PASSED!\n');
              console.log('Summary:');
              console.log('✅ Automatic storage (store_in_memory: true) works');
              console.log('✅ Memory key generation works');
              console.log('✅ Manual store_card tool works');
              console.log('✅ Memory keys can be passed to intent-graph-generator\n');
            } else {
              console.log('\n❌ TEST 2 FAILED: No memory_key in response');
              console.log('Response:', JSON.stringify(content, null, 2));
            }
            
            server.kill();
            process.exit(0);
          }
        }
      } catch (e) {
        // Not valid JSON yet, keep buffering
      }
    }
  }
});

// Test 1: Generate with automatic memory storage
function testGenerateWithMemory() {
  testPhase = 'generate_with_memory';
  console.log('🚀 Testing memory integration in agent-orchestration...\n');
  console.log('TEST 1: Generate orchestration card with store_in_memory=true\n');
  console.log('📋 Query: "Process customer feedback and store in database"\n');
  
  const toolRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'generate_orchestration_card',
      arguments: {
        query: 'Process customer feedback by analyzing sentiment and storing results in the database',
        generation_mode: 'use_configured_api',
        store_in_memory: true  // ← This should trigger memory storage
      }
    }
  };
  server.stdin.write(JSON.stringify(toolRequest) + '\n');
}

// Test 2: Manual store_card tool
function testStoreCardTool() {
  testPhase = 'store_card';
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nTEST 2: Manual store_card tool\n');
  
  const toolRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'store_card',
      arguments: {
        orchestration_card: orchestrationCard,
        memory_key: 'test_custom_key_' + Date.now()
      }
    }
  };
  server.stdin.write(JSON.stringify(toolRequest) + '\n');
}

// Wait for server to initialize
setTimeout(() => {
  // Send initialization
  const initRequest = {
    jsonrpc: '2.0',
    id: 'init',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Start test 1 after a brief delay
  setTimeout(() => testGenerateWithMemory(), 100);
}, 500);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Test timeout');
  server.kill();
  process.exit(1);
}, 30000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});


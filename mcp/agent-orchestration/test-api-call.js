#!/usr/bin/env node
/**
 * Test script for use_configured_api mode
 * This will actually call the Writer API to generate an orchestration card
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
    // WRITER_API_KEY should be in env already
    LLM_PROVIDER: 'writer'
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseBuffer = '';

// Listen for responses
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Check if we have a complete JSON-RPC response
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim() && line.startsWith('{')) {
      try {
        const response = JSON.parse(line);
        
        // Skip initialization responses
        if (response.id === null || response.id === 'init') continue;
        
        // Handle tool call response
        if (response.result && response.result.content) {
          console.log('\n📥 RESPONSE FROM MCP SERVER:\n');
          const content = JSON.parse(response.result.content[0].text);
          
          if (content.mode === 'use_configured_api') {
            console.log('✅ Mode:', content.mode);
            console.log('✅ Success:', content.success);
            console.log('\n📋 ORCHESTRATION CARD:\n');
            console.log(JSON.stringify(content.orchestration_card, null, 2));
            
            console.log('\n🔍 VALIDATION:\n');
            console.log('Valid:', content.validation.valid);
            if (content.validation.errors.length > 0) {
              console.log('Errors:', content.validation.errors);
            }
            if (content.validation.warnings.length > 0) {
              console.log('Warnings:', content.validation.warnings);
            }
            
            console.log('\n📊 SUMMARY:');
            const card = content.orchestration_card;
            console.log('- User Request:', card.user_request.description);
            console.log('- Domain:', card.user_request.domain);
            console.log('- Selected Agents:', card.available_agents.map(a => a.name).join(', '));
            console.log('- Success Criteria:', card.user_request.success_criteria.join(', '));
            console.log('- Optimize For:', card.preferences?.optimize_for || 'N/A');
            
            console.log('\n✨ SUCCESS! Writer API was called and returned a valid orchestration card!');
            console.log('   This proves use_configured_api mode works!\n');
          } else {
            console.log(JSON.stringify(content, null, 2));
          }
          
          // Clean exit
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not valid JSON yet, keep buffering
      }
    }
  }
});

// Wait for server to initialize
setTimeout(() => {
  console.log('🚀 Testing agent-orchestration with use_configured_api mode...\n');
  console.log('📋 Test Query: "Process customer orders by validating the data, sending confirmation emails, and storing the order in the database"\n');
  console.log('🔑 Using Writer API Key from environment\n');
  console.log('⏳ Calling Writer API to generate orchestration card...\n');
  
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
  
  // Send tool call after a brief delay
  setTimeout(() => {
    const toolRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'generate_orchestration_card',
        arguments: {
          query: 'Process customer orders by validating the data, sending confirmation emails, and storing the order in the database',
          generation_mode: 'use_configured_api'  // This will call the actual API
        }
      }
    };
    server.stdin.write(JSON.stringify(toolRequest) + '\n');
  }, 100);
}, 500);

// Timeout after 30 seconds (API calls can take longer)
setTimeout(() => {
  console.error('❌ Test timeout - API call took too long');
  server.kill();
  process.exit(1);
}, 30000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});


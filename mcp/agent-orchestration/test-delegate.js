#!/usr/bin/env node
/**
 * Test script for delegate_to_caller mode
 * This simulates what Claude/Cursor does when calling the MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
const server = spawn('node', [resolve(__dirname, 'build/index.js')], {
  env: {
    ...process.env,
    GAFF_CONFIG_PATH: resolve(__dirname, 'examples/sample-gaff.json')
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
          
          if (content.mode === 'delegate_to_caller') {
            console.log('✅ Mode:', content.mode);
            console.log('\n📝 SYSTEM PROMPT (truncated):');
            console.log(content.system_prompt.substring(0, 300) + '...\n');
            console.log('📝 USER PROMPT:');
            console.log(content.user_prompt);
            console.log('\n📋 RESPONSE SCHEMA:');
            console.log(JSON.stringify(content.response_schema, null, 2));
            console.log('\n📌 INSTRUCTIONS:');
            console.log(content.instructions);
            console.log('\n✨ SUCCESS! Server returned prompts for Claude to use.');
            console.log('   No LLM API was called - this is delegate_to_caller mode!\n');
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
  console.log('🚀 Testing agent-orchestration MCP server...\n');
  console.log('📋 Test Query: "Process customer orders by validating the data, sending confirmation emails, and storing the order in the database"\n');
  
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
          generation_mode: 'delegate_to_caller'
        }
      }
    };
    server.stdin.write(JSON.stringify(toolRequest) + '\n');
  }, 100);
}, 500);

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Test timeout');
  server.kill();
  process.exit(1);
}, 10000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});


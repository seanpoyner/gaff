#!/usr/bin/env node
/**
 * Test list_agents tool
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = spawn('node', [resolve(__dirname, 'build/index.js')], {
  env: {
    ...process.env,
    GAFF_CONFIG_PATH: resolve(__dirname, 'examples/sample-gaff.json')
  },
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  const lines = responseBuffer.split('\n');
  for (const line of lines) {
    if (line.trim() && line.startsWith('{')) {
      try {
        const response = JSON.parse(line);
        
        if (response.id === null || response.id === 'init') continue;
        
        if (response.result && response.result.content) {
          console.log('\n📥 LIST AGENTS RESPONSE:\n');
          const content = JSON.parse(response.result.content[0].text);
          
          console.log('✅ Found', content.count, 'agents\n');
          content.agents.forEach((agent, i) => {
            console.log(`${i + 1}. ${agent.name} (${agent.type})`);
            console.log(`   Description: ${agent.description}`);
            console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);
            console.log('');
          });
          
          console.log('🏷️  All Capabilities:', content.all_capabilities.join(', '));
          console.log('\n✨ SUCCESS! list_agents tool works!\n');
          
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Keep buffering
      }
    }
  }
});

setTimeout(() => {
  console.log('🚀 Testing list_agents tool...\n');
  
  const initRequest = {
    jsonrpc: '2.0',
    id: 'init',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  setTimeout(() => {
    const toolRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'list_agents',
        arguments: {}
      }
    };
    server.stdin.write(JSON.stringify(toolRequest) + '\n');
  }, 100);
}, 500);

setTimeout(() => {
  console.error('❌ Test timeout');
  server.kill();
  process.exit(1);
}, 10000);


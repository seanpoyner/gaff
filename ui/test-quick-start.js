#!/usr/bin/env node

/**
 * Quick Start Test for GAFF WebUI + Example Agents
 * Tests basic functionality to identify issues
 */

import { SimpleChatbotAgent } from '../agents/examples/simple-chatbot-agent.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set GAFF_ROOT to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.env.GAFF_ROOT = resolve(__dirname, '..');

async function test() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 GAFF WebUI Quick Start Test');
  console.log('='.repeat(70) + '\n');

  const agent = new SimpleChatbotAgent();

  try {
    console.log('📋 Test 1: Initializing agent...');
    await agent.initialize();
    console.log('✅ Agent initialized successfully\n');

    console.log('📋 Test 2: Sending simple test message...');
    const response = await agent.chat('Hello, this is a test message');
    console.log('✅ Response received:\n');
    console.log(response);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(70));
    console.log('\n💡 Your setup is working correctly!');
    console.log('   You can now start the WebUI with: npm start\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(70));
    console.error('\n🐛 Error Details:');
    console.error(error);
    console.error('\n💡 Troubleshooting Tips:');
    console.error('   1. Check if all MCP servers are built (npm run build in each mcp/ folder)');
    console.error('   2. Verify WRITER_API_KEY environment variable is set');
    console.error('   3. Make sure all dependencies are installed (npm install in ui/ and agents/)');
    console.error('   4. See ui/TROUBLESHOOTING_GUIDE.md for detailed help\n');
    process.exit(1);
  } finally {
    await agent.cleanup();
  }
}

test();

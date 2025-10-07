#!/usr/bin/env node

/**
 * Test script for the complete workflow demo
 * Tests the internal agent using GAFF's MCP servers
 * 
 * This demonstrates the full pipeline:
 * User Query → agent-orchestration → intent-graph-generator → router → Results
 */

import { SimpleChatbotAgent } from '../agents/examples/simple-chatbot-agent.js';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 Testing GAFF Complete Workflow');
  console.log('='.repeat(80) + '\n');

  const agent = new SimpleChatbotAgent();

  try {
    // Initialize the agent
    await agent.initialize();

    // Test queries
    const queries = [
      "Analyze sales data and create a quarterly report",
      "Process customer feedback and identify common issues",
      "Review recent incidents and suggest improvements",
    ];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      console.log('\n' + '='.repeat(80));
      console.log(`📝 Test ${i + 1}: ${query}`);
      console.log('='.repeat(80) + '\n');

      const response = await agent.chat(query);
      
      console.log('🤖 Response:\n');
      console.log(response);
      console.log('\n' + '-'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await agent.cleanup();
  }
}

main();



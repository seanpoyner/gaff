/**
 * Direct test of intent-graph-generator
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

console.log('\n🧪 Testing Intent Graph Generator Directly\n');

// Sample orchestration card with 2 agents
const orchestrationCard = {
  user_request: {
    description: "Analyze customer satisfaction scores",
    domain: "data-analysis",
    success_criteria: [
      "Data is fetched",
      "Analysis is complete"
    ]
  },
  available_agents: [
    {
      name: "DataFetcher",
      type: "api",
      capabilities: ["data_retrieval"],
      description: "Fetches data",
      input_schema: { url: "string" },
      output_schema: { data: "object" }
    },
    {
      name: "DataAnalyzer",
      type: "llm",
      capabilities: ["analysis"],
      description: "Analyzes data",
      input_schema: { data: "object" },
      output_schema: { insights: "array" }
    }
  ],
  constraints: {
    max_execution_time_ms: 60000
  },
  preferences: {
    optimize_for: "speed"
  }
};

console.log('📋 Input Orchestration Card:');
console.log(JSON.stringify(orchestrationCard, null, 2));
console.log('\n🔗 Connecting to intent-graph-generator...\n');

try {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../mcp/intent-graph-generator/build/index.js']
  });

  const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  console.log('✅ Connected!\n');
  console.log('📤 Calling generate_intent_graph...\n');

  const result = await client.callTool({
    name: 'generate_intent_graph',
    arguments: {
      orchestration_card: orchestrationCard,
      options: {
        validate: true,
        optimize: true
      }
    }
  });

  console.log('📥 Result received!\n');
  const parsed = JSON.parse(result.content[0].text);
  
  console.log('✅ Intent Graph Generated:');
  console.log(JSON.stringify(parsed, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`   Nodes: ${parsed.intent_graph?.nodes?.length || 0}`);
  console.log(`   Edges: ${parsed.intent_graph?.edges?.length || 0}`);
  
  if (parsed.intent_graph?.nodes?.length === 0) {
    console.log('\n❌ ERROR: No nodes generated!');
    console.log('   This means the intent-graph-generator is not creating nodes from the orchestration card.');
    process.exit(1);
  }
  
  console.log('\n🎉 Test passed!');
  await client.close();
  process.exit(0);

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}


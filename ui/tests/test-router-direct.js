import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testRouter() {
  console.log('🧪 Testing Router Directly\n');

  const simpleGraph = {
    nodes: [
      {
        id: 'test_node',
        node_id: 'test_node',
        agent: 'TestAgent',
        type: 'entry',
        purpose: 'Test node',
        instructions: 'Do nothing',
        input: [],
        output: [],
      },
    ],
    edges: [],
    execution_plan: {
      entry_points: ['test_node'],
      exit_points: ['test_node'],
      execution_strategy: 'sequential',
    },
  };

  console.log('📋 Input Graph:');
  console.log(JSON.stringify(simpleGraph, null, 2));
  console.log('\n🔗 Connecting to router...\n');

  try {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [resolve(__dirname, '../mcp/router/build/index.js')],
      env: { ...process.env },
    });

    const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    console.log('✅ Connected!\n');
    console.log('📤 Calling execute_graph...\n');
    
    const result = await client.callTool({
      name: 'execute_graph',
      arguments: {
        graph: simpleGraph,
        context: { test: 'data' },
        config: { max_parallel: 1, enable_hitl: false, store_state_in_memory: false },
      },
    });

    console.log('📥 Result received!\n');
    console.log('===== RAW RESULT =====');
    console.log(JSON.stringify(result, null, 2));
    
    const execData = JSON.parse(result.content[0].text);
    console.log('\n===== PARSED DATA =====');
    console.log(JSON.stringify(execData, null, 2));
    
    console.log('\n===== FIELD CHECK =====');
    console.log(`execution_id: ${execData.execution_id || 'MISSING'}`);
    console.log(`status: ${execData.status || 'MISSING'}`);
    console.log(`Available fields: ${Object.keys(execData).join(', ')}`);

    if (execData.execution_id) {
      console.log('\n🎉 Test passed: execution_id found!');
    } else {
      console.log('\n❌ Test failed: execution_id missing!');
      process.exit(1);
    }

    await client.close();
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

testRouter();



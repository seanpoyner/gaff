#!/usr/bin/env node
/**
 * Test script for the router MCP server
 * Tests graph execution with memory-backed state management
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('🧪 Testing router MCP server...\n');

  // Create MCP client
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js'],
  });

  const client = new Client(
    {
      name: 'router-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to router MCP server\n');

    // List available tools
    const toolsResult = await client.listTools();
    console.log('📋 Available tools:');
    toolsResult.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Load example graph
    const graphPath = join(__dirname, 'examples', 'simple-graph.json');
    const graph = JSON.parse(readFileSync(graphPath, 'utf-8'));

    console.log('🚀 Executing simple graph...');
    console.log(`   Graph ID: ${graph.graph_id}`);
    console.log(`   Nodes: ${graph.nodes.length}`);
    console.log('');

    // Execute graph
    const result = await client.callTool({
      name: 'execute_graph',
      arguments: {
        graph,
        context: {
          user_id: '12345',
          timestamp: new Date().toISOString(),
        },
        config: {
          max_parallel: 2,
          enable_hitl: false,
          store_state_in_memory: true,
        },
      },
    });

    if (result.content && Array.isArray(result.content)) {
      const response = JSON.parse(result.content[0].text);
      console.log('✅ Execution completed!');
      console.log(`   Execution ID: ${response.execution_id}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Nodes executed: ${response.nodes_executed}`);
      console.log(`   Execution time: ${response.execution_time_ms}ms`);
      console.log(`   Failed nodes: ${response.nodes_failed.length}`);
      console.log('');

      // Test getting execution status
      console.log('📊 Getting execution status...');
      const statusResult = await client.callTool({
        name: 'get_execution_status',
        arguments: {
          execution_id: response.execution_id,
        },
      });

      if (statusResult.content && Array.isArray(statusResult.content)) {
        const status = JSON.parse(statusResult.content[0].text);
        console.log(`   Status: ${status.status}`);
        console.log(`   Progress: ${status.progress_percentage.toFixed(1)}%`);
        console.log(`   Nodes completed: ${status.nodes_completed}/${status.nodes_total}`);
        console.log('');
      }
    }

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();


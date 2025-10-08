#!/usr/bin/env node

/**
 * OpenAI-Compatible API Adapter for GAFF
 * 
 * Allows any OpenAI-compatible UI (Open WebUI, LibreChat, etc.)
 * to connect to GAFF using the complete workflow pipeline
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set GAFF_ROOT to project root so MCP servers can find gaff.json
process.env.GAFF_ROOT = resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());

// MCP Clients for complete workflow
let orchestrationClient = null;
let graphClient = null;
let routerClient = null;
let memoryClient = null;
let isInitialized = false;

/**
 * Initialize MCP clients
 */
async function initializeClients() {
  if (isInitialized) return;
  
  console.log('🚀 Initializing GAFF MCP servers...');
  
  try {
    // Agent Orchestration
    console.log('📦 Connecting to agent-orchestration...');
    const gaffConfigPath = process.env.GAFF_CONFIG_PATH || resolve(__dirname, '../gaff.json');
    const orchTransport = new StdioClientTransport({
      command: 'node',
      args: [resolve(__dirname, '../mcp/agent-orchestration/build/index.js')],
      env: {
        ...process.env,
        GAFF_CONFIG_PATH: gaffConfigPath,
        WRITER_API_KEY: process.env.WRITER_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      }
    });
    orchestrationClient = new Client({ name: 'ui-adapter', version: '1.0.0' }, { capabilities: {} });
    await orchestrationClient.connect(orchTransport);
    console.log('✅ agent-orchestration connected');

    // Intent Graph Generator
    console.log('📦 Connecting to intent-graph-generator...');
    const graphTransport = new StdioClientTransport({
      command: 'node',
      args: [resolve(__dirname, '../mcp/intent-graph-generator/build/index.js')],
      env: {
        ...process.env
      }
    });
    graphClient = new Client({ name: 'ui-adapter', version: '1.0.0' }, { capabilities: {} });
    await graphClient.connect(graphTransport);
    console.log('✅ intent-graph-generator connected');

    // Router
    console.log('📦 Connecting to router...');
    const routerTransport = new StdioClientTransport({
      command: 'node',
      args: [resolve(__dirname, '../mcp/router/build/index.js')],
      env: {
        ...process.env
      }
    });
    routerClient = new Client({ name: 'ui-adapter', version: '1.0.0' }, { capabilities: {} });
    await routerClient.connect(routerTransport);
    console.log('✅ router connected');

    // Memory
    console.log('📦 Connecting to memory...');
    const memoryTransport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    });
    memoryClient = new Client({ name: 'ui-adapter', version: '1.0.0' }, { capabilities: {} });
    await memoryClient.connect(memoryTransport);
    console.log('✅ memory connected');

    isInitialized = true;
    console.log('🎉 All MCP servers connected!\n');
  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    throw error;
  }
}

/**
 * Execute complete GAFF workflow
 */
async function executeWorkflow(userQuery) {
  if (!isInitialized) {
    await initializeClients();
  }

  // Clean the query - remove system prompts and task instructions
  const cleanQuery = userQuery
    .replace(/^###\s*Task:[\s\S]*?###\s*(Output|Guidelines|Chat History):/gim, '')
    .replace(/^###\s*Guidelines:[\s\S]*?###\s*(Output|Chat History):/gim, '')
    .replace(/JSON format:.*$/gim, '')
    .replace(/<chat_history>[\s\S]*?<\/chat_history>/gim, '')
    .replace(/^Query:\s*/gim, '')
    .replace(/^History:\s*/gim, '')
    .replace(/USER:\s*"""/g, '')
    .replace(/"""/g, '')
    .replace(/ASSISTANT:[\s\S]*$/gim, '')
    .trim();

  console.log(`\n💬 Processing: "${cleanQuery}"`);

  // Step 1: Generate Orchestration Card
  console.log('📋 Step 1: Generating orchestration card...');
  const orchResult = await orchestrationClient.callTool({
    name: 'generate_orchestration_card',
    arguments: {
      query: cleanQuery,
      generation_mode: 'use_configured_api',
      store_in_memory: true,
    }
  }, undefined, {
    timeout: 300000 // 5 minutes for LLM calls
  });
  const orchData = JSON.parse(orchResult.content[0].text);
  console.log(`✅ Orchestration card generated (${orchData.memory_key})`);

  // Step 2: Generate Intent Graph
  console.log('🔗 Step 2: Generating intent graph...');
  console.log('📤 Sending orchestration card to intent-graph-generator...');
  console.log(`   Agents: ${orchData.orchestration_card?.available_agents?.length || orchData.orchestration_card?.agents?.length || 0}`);
  
  const graphResult = await graphClient.callTool({
    name: 'generate_intent_graph',
    arguments: {
      orchestration_card: orchData.orchestration_card,
      options: { validate: true, optimize: true, store_in_memory: true },
    }
  }, undefined, {
    timeout: 300000 // 5 minutes for LLM calls
  });
  
  const graphData = JSON.parse(graphResult.content[0].text);
  console.log(`✅ Intent graph generated (${graphData.intent_graph?.nodes?.length || 0} nodes)`);
  
  if (graphData.intent_graph?.nodes?.length === 0) {
    console.log('⚠️  Warning: Intent graph has 0 nodes!');
    console.log('   Orchestration card agents:', JSON.stringify(orchData.orchestration_card?.available_agents || orchData.orchestration_card?.agents || [], null, 2));
  }

  // Step 3: Execute Workflow
  console.log('⚙️  Step 3: Executing workflow...');
  const execResult = await routerClient.callTool({
    name: 'execute_graph',
    arguments: {
      graph: graphData.intent_graph,
      context: { user_query: userQuery, timestamp: new Date().toISOString() },
      config: { max_parallel: 3, enable_hitl: false, store_state_in_memory: true, timeout_ms: 300000 },
    }
  }, undefined, {
    timeout: 300000 // 5 minute timeout for long-running workflows with LLM calls
  });
  const execData = JSON.parse(execResult.content[0].text);
  console.log(`✅ Workflow executed (${execData.status})`);
  console.log(`   Execution ID: ${execData.execution_id || execData.id || 'NOT FOUND'}\n`);
  
  // Debug: Log what fields execData actually has
  if (!execData.execution_id) {
    console.log('⚠️  Warning: execution_id not found in execData!');
    console.log('   Available fields:', Object.keys(execData));
  }

  // Format response
  return formatResponse({
    orchestration_card: orchData.orchestration_card,
    intent_graph: graphData.intent_graph,
    execution_result: execData,
    memory_keys: {
      orchestration: orchData.memory_key,
      graph: graphData.memory_key || graphData.graph_memory_key || 'N/A',
      execution: execData.execution_id || execData.id || execData.execution_state_key,
    },
    status: execData.status,
  });
}

/**
 * Format workflow result for user
 */
function formatResponse(result) {
  const agentsCount = result.orchestration_card?.available_agents?.length || 
                      result.orchestration_card?.agents?.length || 0;
  const tasks = result.intent_graph?.nodes || [];
  const status = result.status || result.execution_result?.status || 'unknown';
  const executionId = result.execution_result?.execution_id;
  const successCount = Object.values(result.execution_result?.results || {}).filter(r => r.success).length;
  const totalTime = result.execution_result?.execution_time_ms || 0;
  
  // Create clean, structured response
  let response = `# 📊 Workflow Execution Report\n\n`;
  
  // Status box
  response += `## Status\n`;
  response += `- **Result:** ${status === 'completed' ? '✅ Completed Successfully' : status === 'failed' ? '❌ Failed' : status === 'failed_quality' ? '⚠️ Failed Quality Check' : '⏳ ' + status}\n`;
  response += `- **Execution ID:** \`${executionId || 'N/A'}\`\n`;
  response += `- **Tasks:** ${successCount}/${tasks.length} completed\n`;
  response += `- **Total Time:** ${(totalTime / 1000).toFixed(2)}s\n`;
  
  // Quality validation info
  if (result.execution_result?.quality_validation) {
    const qv = result.execution_result.quality_validation;
    response += `- **Quality Score:** ${qv.is_acceptable ? '✅' : '⚠️'} ${(qv.quality_score * 100).toFixed(1)}%`;
    if (qv.rerun_attempts > 0) {
      response += ` (${qv.rerun_attempts} rerun${qv.rerun_attempts > 1 ? 's' : ''})`;
    }
    response += `\n`;
  }
  
  // Safety validation info
  if (result.execution_result?.safety_validation) {
    const sv = result.execution_result.safety_validation;
    response += `- **Safety:** ${sv.input_validated && sv.output_validated ? '✅' : '⚠️'} Validated`;
    if (sv.compliance_standards && sv.compliance_standards.length > 0) {
      response += ` | ${sv.compliance_standards.join(', ')}`;
    }
    if (sv.audit_logged) {
      response += ` | 📝 Audit Logged`;
    }
    response += `\n`;
  }
  
  response += `\n`;
  
  // Only show agents if there are any
  if (agentsCount > 0) {
    response += `## 🤖 Agents Used\n`;
    (result.orchestration_card?.available_agents || []).forEach(agent => {
      response += `**${agent.name}** (${agent.type})\n`;
      response += `> ${agent.capabilities?.slice(0, 3).join(' • ') || 'No capabilities listed'}\n\n`;
    });
  }
  
  // Show detailed results
  response += `## 📋 Execution Details\n\n`;
  tasks.forEach((node, idx) => {
    const nodeResult = result.execution_result?.results?.[node.id];
    const taskStatus = nodeResult?.success ? '✅' : nodeResult ? '❌' : '⏳';
    response += `### ${idx + 1}. ${taskStatus} ${node.id}\n`;
    response += `**Agent:** ${node.agent} | **Time:** ${nodeResult?.execution_time_ms || 0}ms\n\n`;
    
    // Show actual execution result  
    if (nodeResult && nodeResult.success && nodeResult.result) {
      const resultData = nodeResult.result;
      
      // Data retrieval results
      if (resultData.data?.records) {
        response += `📊 **Data:** ${resultData.data.records.length} records retrieved`;
        if (resultData.data.average_score) {
          response += ` (avg: ${resultData.data.average_score}/5.0)`;
        }
        response += `\n\n`;
      }
      
      // Analysis results
      if (resultData.analysis) {
        response += `💡 **Analysis:**\n> ${resultData.analysis.substring(0, 300)}${resultData.analysis.length > 300 ? '...' : ''}\n\n`;
      }
      
      // Key insights
      if (resultData.insights && resultData.insights.length > 0) {
        response += `🔍 **Key Insights:**\n`;
        resultData.insights.slice(0, 3).forEach(insight => {
          response += `- ${insight.substring(0, 150)}${insight.length > 150 ? '...' : ''}\n`;
        });
        if (resultData.insights.length > 3) {
          response += `- *(+${resultData.insights.length - 3} more insights)*\n`;
        }
        response += `\n`;
      }
      
      // Confidence and summary
      if (resultData.confidence) {
        response += `📈 **Confidence:** ${Math.round(resultData.confidence * 100)}%\n\n`;
      }
    } else if (nodeResult && nodeResult.error) {
      response += `❌ **Error:** ${nodeResult.error}\n\n`;
    }
  });
  
  // Memory section (collapsed, for technical users)
  response += `---\n\n`;
  response += `<details>\n<summary>🔧 Technical Details</summary>\n\n`;
  response += `**Memory Keys:**\n`;
  response += `- Orchestration: \`${result.memory_keys?.orchestration || 'N/A'}\`\n`;
  response += `- Graph: \`${result.memory_keys?.graph || 'N/A'}\`\n`;
  response += `- Execution: \`${executionId || 'N/A'}\`\n\n`;
  response += `</details>\n`;
  
  return response;
}

// OpenAI-compatible endpoints

/**
 * GET /v1/models
 * List available models
 */
app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'gaff-gateway',
        object: 'model',
        created: Date.now(),
        owned_by: 'gaff',
        permission: [],
        root: 'gaff-gateway',
        parent: null
      }
    ]
  });
});

/**
 * POST /v1/chat/completions
 * Chat completion (OpenAI format)
 */
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, stream = false, model = 'gaff-gateway' } = req.body;
    
    // Extract user message
    const userMessages = messages.filter(m => m.role === 'user');
    const userMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // Filter out Open WebUI's background system requests
    const systemRequestPatterns = [
      /^- Write all follow-up questions/i,
      /^- The title should clearly represent/i,
      /^- Start with high-level domains/i,
      /### Output:\s*$/,
      /### Chat History:/,
      /Response must be a JSON array/i,
    ];
    
    const isSystemRequest = systemRequestPatterns.some(pattern => pattern.test(userMessage));
    
    if (isSystemRequest) {
      console.error('🚫 Filtered out Open WebUI background request');
      // Return a minimal valid response to satisfy Open WebUI
      return res.json({
        id: 'chatcmpl-filtered',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gaff-gateway',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: '[]' // Empty array for follow-ups
          },
          finish_reason: 'stop'
        }]
      });
    }
    
    // Execute complete GAFF workflow
    const responseText = await executeWorkflow(userMessage);
    
    // Format as OpenAI response
    const response = {
      id: `chatcmpl-gaff-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseText
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: userMessage.length,
        completion_tokens: responseText.length,
        total_tokens: userMessage.length + responseText.length
      }
    };
    
    if (stream) {
      // Streaming mode
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming mode
      res.json(response);
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'gaff_error',
        code: 'internal_error'
      }
    });
  }
});

/**
 * POST /v1/completions
 * Legacy completion endpoint
 */
app.post('/v1/completions', async (req, res) => {
  try {
    const { prompt } = req.body;
    const text = await executeWorkflow(prompt);
    
    res.json({
      id: `cmpl-gaff-${Date.now()}`,
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gaff-gateway',
      choices: [{
        text,
        index: 0,
        finish_reason: 'stop'
      }]
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    initialized: isInitialized
  });
});

/**
 * OpenAPI spec for External Tools
 */
app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'GAFF Workflow API',
      version: '1.0.0',
      description: 'GAFF Graphical Agentic Flow Framework - Complete workflow orchestration'
    },
    servers: [
      {
        url: 'http://localhost:3100/v1'
      }
    ],
    paths: {
      '/chat/completions': {
        post: {
          summary: 'Execute GAFF Workflow',
          description: 'Processes natural language queries through complete GAFF pipeline: orchestration → graph generation → execution',
          operationId: 'gaff_execute_workflow',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          role: { type: 'string', enum: ['user', 'assistant'] },
                          content: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Workflow executed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      choices: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'object',
                              properties: {
                                role: { type: 'string' },
                                content: { type: 'string' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

app.get('/v1/openapi.json', (req, res) => {
  // Redirect to main OpenAPI endpoint
  res.redirect('/openapi.json');
});

// Start
const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔌 GAFF OpenAI-Compatible API Adapter');
  console.log(`${'='.repeat(60)}`);
  console.log(`\n📡 Endpoint: http://localhost:${PORT}/v1`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`\n💡 Configure your UI with:`);
  console.log(`   API Base: http://localhost:${PORT}/v1`);
  console.log(`   API Key: dummy-key-not-used\n`);
  console.log(`${'='.repeat(60)}\n`);
  console.log('⏳ MCP servers will initialize on first request...\n');
});

// Set timeout to 10 minutes for long-running GAFF workflows
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 610000; // Slightly higher than timeout
server.headersTimeout = 615000; // Slightly higher than keepAliveTimeout

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  if (orchestrationClient) await orchestrationClient.close();
  if (graphClient) await graphClient.close();
  if (routerClient) await routerClient.close();
  if (memoryClient) await memoryClient.close();
  process.exit(0);
});


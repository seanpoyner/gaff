/**
 * Agent Router - Routes calls to agents defined in gaff.json
 * 
 * Handles HTTP requests, MCP calls, and retry logic
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import type { IntentGraphNode, NodeResult } from '../types.js';
import { calculateRetryDelay } from './graph-executor.js';
import { readFileSync, existsSync } from 'fs';

interface AgentConfig {
  type: string;
  endpoint?: string;
  authentication?: string;
  timeout_ms?: number;
  retry_policy?: {
    max_attempts?: number;
    backoff_strategy?: 'linear' | 'exponential';
  };
}

/**
 * Load agent configuration from gaff.json
 */
export function loadAgentConfig(agentName: string): AgentConfig | null {
  console.error(`[AgentRouter] Loading config for agent: ${agentName}`);
  
  // Load from gaff.json if available
  try {
    const gaffConfigPath = process.env.GAFF_CONFIG_PATH || 'gaff.json';
    
    if (existsSync(gaffConfigPath)) {
      const gaffConfig = JSON.parse(readFileSync(gaffConfigPath, 'utf-8'));
      
      // Check if agent exists in config
      if (gaffConfig.agents && gaffConfig.agents[agentName]) {
        const agentDef = gaffConfig.agents[agentName];
        console.error(`[AgentRouter] ✅ Found agent ${agentName} in gaff.json, type: ${agentDef.type}`);
        
        return {
          type: agentDef.type,
          endpoint: agentDef.endpoint || `https://api.example.com/${agentName}`,
          authentication: agentDef.authentication,
          timeout_ms: agentDef.timeout_ms || 30000,
          retry_policy: agentDef.retry_policy || {
            max_attempts: 3,
            backoff_strategy: 'exponential',
          },
        };
      }
    }
  } catch (error: any) {
    console.error(`[AgentRouter] ❌ Error loading gaff.json:`, error.message);
  }
  
  // Fallback: Try to infer type from agent name
  const lowerName = agentName.toLowerCase();
  let inferredType = 'api';
  
  if (lowerName.includes('analyzer') || lowerName.includes('llm') || lowerName.includes('ai')) {
    inferredType = 'llm';
    console.error(`[AgentRouter] ⚠️  Inferred type 'llm' for ${agentName} (gaff.json not loaded)`);
  } else if (lowerName.includes('fetch') || lowerName.includes('data') || lowerName.includes('api')) {
    inferredType = 'api';
    console.error(`[AgentRouter] ⚠️  Inferred type 'api' for ${agentName} (gaff.json not loaded)`);
  }
  
  return {
    type: inferredType,
    endpoint: `https://api.example.com/${agentName}`,
    authentication: 'api_key',
    timeout_ms: 30000,
    retry_policy: {
      max_attempts: 3,
      backoff_strategy: 'exponential',
    },
  };
}

/**
 * Route a tool call to an agent
 */
export async function routeToAgent(
  node: IntentGraphNode,
  resolvedInput: Record<string, any>
): Promise<NodeResult> {
  const startTime = Date.now();
  const nodeId = node.id || node.node_id || 'unknown';
  
  console.error(`[AgentRouter] Routing to ${node.agent}.${node.tool}`);
  
  // Load agent configuration
  const agentConfig = loadAgentConfig(node.agent);
  if (!agentConfig) {
    return {
      node_id: nodeId,
      success: false,
      error: `Agent configuration not found: ${node.agent}`,
      execution_time_ms: Date.now() - startTime,
      attempts: 0,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Determine retry configuration
  const maxAttempts = node.retry_policy?.max_attempts 
    || agentConfig.retry_policy?.max_attempts 
    || 1;
  
  const backoffStrategy = node.retry_policy?.backoff_strategy 
    || agentConfig.retry_policy?.backoff_strategy 
    || 'exponential';
  
  const timeout = node.timeout_ms || agentConfig.timeout_ms || 30000;
  
  // Execute with retries
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      console.error(`[AgentRouter] Attempt ${attempts}/${maxAttempts} for ${nodeId}`);
      
      // Call the agent based on type
      let result: any;
      
      switch (agentConfig.type) {
        case 'api':
          result = await callHttpAgent(
            agentConfig.endpoint!,
            node.tool,
            resolvedInput,
            agentConfig.authentication,
            timeout
          );
          break;
          
        case 'mcp':
          result = await callMCPAgent(
            node.agent,
            node.tool,
            resolvedInput,
            timeout
          );
          break;
          
        case 'llm':
          result = await callLLMAgent(
            node.agent,
            node.tool,
            resolvedInput,
            timeout
          );
          break;
          
        default:
          throw new Error(`Unsupported agent type: ${agentConfig.type}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        node_id: nodeId,
        success: true,
        result,
        execution_time_ms: executionTime,
        attempts,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error: any) {
      lastError = error;
      console.error(`[AgentRouter] Attempt ${attempts} failed:`, error.message);
      
      if (attempts < maxAttempts) {
        const delay = calculateRetryDelay(attempts, backoffStrategy);
        console.error(`[AgentRouter] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed
  const executionTime = Date.now() - startTime;
  
  return {
    node_id: nodeId,
    success: false,
    error: lastError?.message || 'Unknown error',
    execution_time_ms: executionTime,
    attempts,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Call an HTTP/REST API agent
 */
async function callHttpAgent(
  endpoint: string,
  tool: string,
  input: Record<string, any>,
  authentication?: string,
  timeout: number = 30000
): Promise<any> {
  console.error(`[AgentRouter] HTTP call to ${endpoint}/${tool}`);
  
  // For demo: Generate realistic mock data instead of calling HTTP
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API latency
  
  // Generate mock data based on agent name/tool
  if (endpoint.includes('DataFetcher') || endpoint.includes('fetch')) {
    return {
      status: 'success',
      data: {
        records: [
          { id: 1, score: 4.2, date: '2024-01-15', category: 'Product Quality', feedback: 'Great product!' },
          { id: 2, score: 3.8, date: '2024-01-20', category: 'Customer Service', feedback: 'Could be better' },
          { id: 3, score: 4.5, date: '2024-02-10', category: 'Delivery Speed', feedback: 'Very fast!' },
          { id: 4, score: 3.9, date: '2024-02-25', category: 'Product Quality', feedback: 'Meets expectations' },
          { id: 5, score: 4.7, date: '2024-03-05', category: 'Customer Service', feedback: 'Excellent support!' },
        ],
        total_records: 5,
        period: 'Q1 2024',
        average_score: 4.22,
      },
      status_code: 200,
      response_time_ms: 145,
    };
  }
  
  return {
    status: 'success',
    data: {
      message: `Processed by ${tool}`,
      input_received: input,
      executed_at: new Date().toISOString(),
    },
  };
}

/**
 * Call an MCP server agent
 */
async function callMCPAgent(
  agent: string,
  tool: string,
  input: Record<string, any>,
  timeout: number = 30000
): Promise<any> {
  console.error(`[AgentRouter] MCP call to ${agent}.${tool}`);
  
  // TODO: Implement actual MCP client call
  // This should connect to the MCP server and call the tool
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    status: 'success',
    data: {
      message: `Placeholder result from ${agent}.${tool}`,
      input_received: input,
      executed_at: new Date().toISOString(),
    },
  };
}

/**
 * Call an LLM-based agent
 */
async function callLLMAgent(
  agent: string,
  tool: string,
  input: Record<string, any>,
  timeout: number = 30000
): Promise<any> {
  console.error(`[AgentRouter] LLM call to ${agent}.${tool}`);
  console.error(`[AgentRouter] Resolved input:`, JSON.stringify(input, null, 2));
  
  // Get API key and determine provider
  const writerKey = process.env.WRITER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  const apiKey = writerKey || openaiKey || anthropicKey;
  const provider = writerKey ? 'writer' : openaiKey ? 'openai' : anthropicKey ? 'anthropic' : null;
  
  if (!apiKey || !provider) {
    console.error('[AgentRouter] No LLM API key found. Using placeholder response.');
    return {
      status: 'success',
      analysis: 'Placeholder analysis (no API key configured)',
      insights: ['Configure WRITER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY for real LLM execution'],
      confidence: 0.5,
      summary: 'This is a placeholder response because no LLM API key is configured.',
    };
  }
  
  // Build LLM prompt based on input
  const prompt = `You are the ${agent} agent analyzing data.

INPUT DATA:
${JSON.stringify(input, null, 2)}

Analyze this data and provide:
1. A detailed analysis of the customer satisfaction scores
2. Key insights and trends identified
3. Actionable recommendations
4. Your confidence level in the analysis

Respond in JSON format with fields: analysis (string), insights (array), recommendations (array), confidence (number 0-1), summary (string).`;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.error(`[AgentRouter] LLM timeout set to ${timeout}ms`);
    
    try {
      // Call appropriate LLM API
      let response;
      if (provider === 'writer') {
        response = await fetch('https://api.writer.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'palmyra-x-004',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500,
          }),
          signal: controller.signal,
        });
      } else if (provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500,
          }),
          signal: controller.signal,
        });
      } else {
        // Anthropic
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1500,
          }),
          signal: controller.signal,
        });
      }
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }
      
      const data: any = await response.json();
      console.error(`[AgentRouter] LLM response received (${provider})`);
      
      // Extract content based on provider
      let content;
      if (provider === 'anthropic') {
        content = data.content[0].text;
      } else {
        content = data.choices[0].message.content;
      }
      
      // Try to parse as JSON
      try {
        // Remove markdown code fences if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        return parsed;
      } catch {
        // Fallback: return as text
        return {
          status: 'success',
          analysis: content,
          insights: ['See analysis field for details'],
          confidence: 0.8,
          summary: content.substring(0, 200) + '...',
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`LLM API call timed out after ${timeout}ms`);
      }
      throw error;
    }
  } catch (error: any) {
    console.error(`[AgentRouter] LLM call failed:`, error.message);
    throw error;
  }
}


/**
 * Universal LLM Client
 * Supports any OpenAI-compatible API (Writer Palmyra, Claude, OpenAI, custom endpoints)
 * Minimal client with retries and structured logging to stderr
 */

import type { OrchestrationCard, GenerateIntentGraphOutput, IntentGraph, ValidationResult } from '../types.js';

interface LLMClientOptions {
  apiKey: string;
  model: string;
  baseUrl?: string; // API endpoint (e.g., https://api.writer.com, https://api.anthropic.com, https://api.openai.com)
  maxRetries?: number;
  timeoutMs?: number;
}

export class LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(opts: LLMClientOptions) {
    this.apiKey = opts.apiKey;
    this.model = opts.model;
    this.baseUrl = opts.baseUrl || 'https://api.writer.com';
    this.maxRetries = opts.maxRetries ?? 2;
    this.timeoutMs = opts.timeoutMs ?? 30000;
  }

  /**
   * Build prompts for intent graph generation
   * Private method used by both direct generation and delegation
   */
  private buildPrompts(orchestrationCard: OrchestrationCard, includeArtifacts: boolean, artifactTypes: string[]): { systemPrompt: string; userPrompt: string } {
    // Check if system has custom configuration
    const sysConfig = orchestrationCard.system_configuration;
    
    // If custom prompt template provided, use it
    if (sysConfig?.custom_prompt_template) {
      return this.buildCustomSystemPrompts(orchestrationCard, sysConfig, includeArtifacts, artifactTypes);
    }
    
    // Default system prompt (generic intent graph generation)
    const systemPrompt = `You are an expert workflow architect that designs intent graphs for agent orchestration.

Your task is to:
1. Analyze the USER'S REQUEST (what they want to accomplish)
2. Review the AVAILABLE AGENTS and their capabilities
3. Design an efficient workflow graph that fulfills the user's request
4. Return a complete IntentGraph JSON structure${includeArtifacts ? ' with artifacts' : ''}

The intent graph must:
- Start with entry nodes that process the user's input
- Use the available agents appropriately based on their capabilities
- Connect nodes with proper edges (sequential, parallel, conditional, etc.)
- End with exit nodes that produce the desired output
- Include error handling and retry strategies where appropriate
- Optimize for the specified preferences (speed, cost, reliability, etc.)
- **CRITICAL**: Each node MUST include detailed "instructions" and "context" fields:
  * "instructions": Clear, actionable plain-language instructions telling the agent exactly what to do
  * "context": Additional background, constraints, or special requirements the agent needs to know
- **IMPORTANT**: Assign appropriate MCP tools and external tools to each node:
  * Review the available MCP servers and their tools
  * Assign specific tools to nodes that need them to accomplish their work
  * Include "when_to_use" guidance for each tool
  * Only assign tools that are actually needed for that specific node's task

CRITICAL: You MUST respond with ONLY valid JSON in this exact format:
{
  "intent_graph": {
    "nodes": [
      {
        "id": "unique_node_id",
        "agent": "agent_name",
        "type": "entry|processing|decision|aggregation|exit",
        "purpose": "Brief one-line purpose",
        "instructions": "Detailed plain-language instructions for the agent. Be specific about what to do, how to do it, and what to look for.",
        "context": "Additional context, constraints, or background information the agent needs to successfully complete the task.",
        "available_mcp_tools": [
          {
            "server_name": "server_name",
            "tool_name": "tool_name",
            "description": "What this tool does",
            "when_to_use": "Use this when you need to..."
          }
        ],
        "available_tools": [
          {
            "tool_name": "tool_name",
            "description": "What this tool does",
            "when_to_use": "Use this when you need to..."
          }
        ],
        "input": {
          "data": "\${fetch_data.data}",
          "config": "\${context.config}",
          "explanation": "Use \${node_id.output_field} to reference outputs from previous nodes. Use \${context.field} for context variables."
        },
        "output": ["result", "status", "insights"]
      }
    ],
    "edges": [...],
    "execution_plan": {
      "entry_points": [...],
      "exit_points": [...],
      "execution_strategy": "sequential|parallel|hybrid"
    }
  }${includeArtifacts ? `,
  "artifacts": {
    ${artifactTypes.includes('reasoning') ? '"reasoning": "Your step-by-step reasoning for the graph design",' : ''}
    ${artifactTypes.includes('alternatives') ? '"alternatives": [{"approach": "Alternative approach 1", "pros": [], "cons": []}, ...],' : ''}
    ${artifactTypes.includes('optimizations') ? '"optimizations": [{"type": "optimization type", "description": "what was optimized", "impact": "expected impact"}]' : ''}
  }` : ''}
}

CRITICAL REQUIREMENTS:
1. The "instructions" field is MANDATORY for EVERY node. Make it detailed and actionable (3-5 sentences minimum).
2. The "context" field is MANDATORY for EVERY node. Provide background, constraints, and special considerations.
3. **TOOL ASSIGNMENT IS MANDATORY**: You MUST assign MCP tools and/or external tools to nodes that need them. A node that could benefit from a tool but has NO tools assigned is INVALID.
4. For EACH assigned tool, provide "when_to_use" guidance explaining when to invoke it.
5. Be selective - only assign tools actually necessary for that node's work, but DO assign them when applicable.
6. **DATA FLOW IS CRITICAL**: Each node's "input" object MUST reference the actual outputs from previous nodes using the syntax: \${node_id.output_field}
   - For entry nodes, input can be empty {} or reference context: \${context.field}
   - For processing nodes, input MUST include: { "data": "\${previous_node.result}" } or similar
   - DO NOT use placeholders like "$.data" or leave inputs undefined
   - The node_id must match the exact "id" of a previous node in the graph

VALIDATION: 
- Before returning, verify that processing nodes have appropriate tool assignments. If a node interacts with databases, payments, notifications, etc., it MUST have the corresponding MCP tools assigned.
- Verify that every non-entry node has proper input references to previous nodes (e.g., "input": {"data": "\${fetch_data.data}"})

Do NOT include any explanatory text before or after the JSON. ONLY return the JSON object.`;

    const userPrompt = `USER'S REQUEST:
"${orchestrationCard.user_request.description}"

${orchestrationCard.user_request.domain ? `DOMAIN: ${orchestrationCard.user_request.domain}` : ''}

${orchestrationCard.user_request.success_criteria?.length ? `SUCCESS CRITERIA:
${orchestrationCard.user_request.success_criteria.map(c => `- ${c}`).join('\n')}` : ''}

AVAILABLE AGENTS:
${orchestrationCard.available_agents.map((agent, i) => `${i + 1}. ${agent.name} (${agent.type})
   Capabilities: ${agent.capabilities.join(', ')}
   Input: ${JSON.stringify(agent.input_schema)}
   Output: ${JSON.stringify(agent.output_schema)}`).join('\n\n')}

${orchestrationCard.available_mcp_servers?.length ? `\nAVAILABLE MCP SERVERS:
${orchestrationCard.available_mcp_servers.map(server => {
  return `- ${server.name}${server.url ? ` (${server.url})` : ''}
  Tools: ${server.tools.map(tool => `
    * ${tool.name}: ${tool.description || 'No description'}
      Input: ${JSON.stringify(tool.input_schema || {})}
      Output: ${JSON.stringify(tool.output_schema || {})}`).join('')}`;
}).join('\n')}

IMPORTANT: When assigning MCP tools to nodes, use the format: { "server_name": "${orchestrationCard.available_mcp_servers[0]?.name || 'server_name'}", "tool_name": "tool_name" }` : ''}

${orchestrationCard.available_tools?.length ? `\nAVAILABLE EXTERNAL TOOLS:
${orchestrationCard.available_tools.map(tool => {
  return `- ${tool.name} (${tool.type}): ${tool.description || 'No description'}
  Input: ${JSON.stringify(tool.input_schema)}
  Output: ${JSON.stringify(tool.output_schema)}
  ${tool.estimated_latency_ms ? `Latency: ${tool.estimated_latency_ms}ms` : ''}
  ${tool.cost_per_call ? `Cost: $${tool.cost_per_call}` : ''}`;
}).join('\n')}` : ''}

${orchestrationCard.constraints ? `\nCONSTRAINTS:
${orchestrationCard.constraints.max_iterations ? `- Max iterations: ${orchestrationCard.constraints.max_iterations}` : ''}
${orchestrationCard.constraints.timeout_ms ? `- Timeout: ${orchestrationCard.constraints.timeout_ms}ms` : ''}
${orchestrationCard.constraints.max_parallel_nodes ? `- Max parallel nodes: ${orchestrationCard.constraints.max_parallel_nodes}` : ''}` : ''}

${orchestrationCard.preferences ? `\nPREFERENCES:
${orchestrationCard.preferences.optimize_for ? `- Optimize for: ${orchestrationCard.preferences.optimize_for}` : ''}
${orchestrationCard.preferences.parallelization ? `- Parallelization: ${orchestrationCard.preferences.parallelization}` : ''}` : ''}

${orchestrationCard.special_requirements?.length ? `\nSPECIAL REQUIREMENTS:
${orchestrationCard.special_requirements.map(r => `- ${r}`).join('\n')}` : ''}

${orchestrationCard.context?.environment ? `\nENVIRONMENT: ${orchestrationCard.context.environment}` : ''}

Design a complete intent graph that fulfills the user's request using the available resources.`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Build custom system-specific prompts using the system configuration
   */
  private buildCustomSystemPrompts(
    orchestrationCard: OrchestrationCard,
    sysConfig: NonNullable<OrchestrationCard['system_configuration']>,
    _includeArtifacts: boolean,
    _artifactTypes: string[]
  ): { systemPrompt: string; userPrompt: string } {
    // Use custom template with variable substitution
    let systemPrompt = sysConfig.custom_prompt_template || '';
    
    // Add system context if provided
    if (sysConfig.system_description || sysConfig.system_purpose) {
      systemPrompt = `# ${sysConfig.system_name || 'Multi-Agent Orchestration System'}

${sysConfig.system_description || ''}

${sysConfig.system_purpose ? `## Purpose\n${sysConfig.system_purpose}` : ''}

${systemPrompt}`;
    }
    
    // Add agent descriptions if provided
    if (sysConfig.agent_descriptions && sysConfig.agent_descriptions.length > 0) {
      systemPrompt += `\n\n## Available Downstream Agents\n`;
      for (const agent of sysConfig.agent_descriptions) {
        systemPrompt += `- **${agent.agent_name}**: ${agent.description}\n`;
        if (agent.capabilities && agent.capabilities.length > 0) {
          systemPrompt += `  Capabilities: ${agent.capabilities.join(', ')}\n`;
        }
        if (agent.example_usage) {
          systemPrompt += `  Example: ${agent.example_usage}\n`;
        }
      }
    }
    
    // Add example outputs if provided
    if (sysConfig.example_outputs && sysConfig.example_outputs.length > 0) {
      systemPrompt += `\n\n## Example Outputs\n`;
      for (const example of sysConfig.example_outputs) {
        systemPrompt += `\n### ${example.description}\n`;
        if (typeof example.output === 'string') {
          systemPrompt += example.output + '\n';
        } else {
          systemPrompt += '```json\n' + JSON.stringify(example.output, null, 2) + '\n```\n';
        }
      }
    }
    
    // Add output schema if provided
    if (sysConfig.output_schema) {
      systemPrompt += `\n\n## Output Schema\n`;
      systemPrompt += 'Your response must conform to this JSON schema:\n```json\n';
      systemPrompt += JSON.stringify(sysConfig.output_schema, null, 2);
      systemPrompt += '\n```\n';
    }
    
    // Add validation rules if provided
    if (sysConfig.validation_rules && sysConfig.validation_rules.length > 0) {
      systemPrompt += `\n\n## Validation Rules\n`;
      for (const rule of sysConfig.validation_rules) {
        systemPrompt += `- ${rule}\n`;
      }
    }
    
    // Build user prompt with query substitution
    const userPrompt = `User Query: ${orchestrationCard.user_request.description}

${orchestrationCard.user_request.domain ? `Domain: ${orchestrationCard.user_request.domain}\n` : ''}
${orchestrationCard.user_request.success_criteria?.length ? `\nSuccess Criteria:\n${orchestrationCard.user_request.success_criteria.map(c => `- ${c}`).join('\n')}` : ''}

${orchestrationCard.available_agents.length > 0 ? `\nAvailable Agents:\n${orchestrationCard.available_agents.map((agent, i) => `${i + 1}. ${agent.name} (${agent.type}): ${agent.description || 'No description'}`).join('\n')}` : ''}

Please generate the intent graph analysis following the format and examples provided above.`;
    
    return { systemPrompt, userPrompt };
  }

  /**
   * Build prompts for delegation to the calling agent's LLM
   * Returns the system and user prompts without making an API call
   */
  buildPromptsForDelegation(orchestrationCard: OrchestrationCard, options?: { include_artifacts?: boolean; artifact_types?: string[] }): { systemPrompt: string; userPrompt: string; responseSchema: any } {
    const includeArtifacts = options?.include_artifacts ?? false;
    const artifactTypes = options?.artifact_types ?? ['reasoning', 'alternatives', 'optimizations'];
    
    const { systemPrompt, userPrompt } = this.buildPrompts(orchestrationCard, includeArtifacts, artifactTypes);
    
    return {
      systemPrompt,
      userPrompt,
      responseSchema: {
        type: 'object',
        properties: {
          intent_graph: {
            type: 'object',
            description: 'The complete intent graph structure'
          },
          ...(includeArtifacts ? {
            artifacts: {
              type: 'object',
              description: 'Reasoning and alternative approaches'
            }
          } : {})
        },
        required: ['intent_graph']
      }
    };
  }

  async generateIntentGraph(orchestrationCard: OrchestrationCard, options?: { include_artifacts?: boolean; artifact_types?: string[] }): Promise<GenerateIntentGraphOutput> {
    const includeArtifacts = options?.include_artifacts ?? false;
    const artifactTypes = options?.artifact_types ?? ['reasoning', 'alternatives', 'optimizations'];
    
    const { systemPrompt, userPrompt } = this.buildPrompts(orchestrationCard, includeArtifacts, artifactTypes);

    // DEBUG: Log prompts being sent
    console.error('[LLMClient] ===== PROMPTS BEING SENT TO LLM =====');
    console.error('[LLMClient] System prompt length:', systemPrompt.length);
    console.error('[LLMClient] System prompt (first 1000 chars):', systemPrompt.substring(0, 1000));
    console.error('[LLMClient] User prompt length:', userPrompt.length);
    console.error('[LLMClient] User prompt:', userPrompt);
    console.error('[LLMClient] ==========================================');

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4096
    };

    const start = Date.now();
    const responseJson = await this.postWithRetry('/v1/chat/completions', body);

    let content = responseJson?.choices?.[0]?.message?.content || '{}';
    
    // DEBUG: Log raw LLM response
    console.error('[LLMClient] Raw LLM response length:', content.length);
    console.error('[LLMClient] First 500 chars:', typeof content === 'string' ? content.substring(0, 500) : JSON.stringify(content).substring(0, 500));
    
    // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
    if (typeof content === 'string') {
      content = content.trim();
      
      // More aggressive markdown removal - handle cases where there's text after the JSON
      // Pattern: ```json\n{...}\n```anything_here
      const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
      if (codeBlockMatch && codeBlockMatch[1]) {
        content = codeBlockMatch[1].trim();
        console.error('[LLMClient] Extracted JSON from markdown code block');
      } else {
        // Fallback to simple replacement if no match
        content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```[\s\S]*$/i, '');
      }
    }
    
    let parsed: any;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
      console.error('[LLMClient] Successfully parsed JSON. Keys:', Object.keys(parsed));
      console.error('[LLMClient] Has intent_graph?', !!parsed.intent_graph);
      if (parsed.intent_graph) {
        console.error('[LLMClient] intent_graph has nodes?', Array.isArray(parsed.intent_graph.nodes));
        console.error('[LLMClient] Number of nodes:', parsed.intent_graph.nodes?.length || 0);
      }
    } catch (e) {
      console.error('[LLMClient] Failed to parse model JSON:', e);
      console.error('[LLMClient] Content (first 1000 chars):', content.substring(0, 1000));
      parsed = {};
    }

    // Coerce into GenerateIntentGraphOutput shape (best effort)
    // Support BOTH formats:
    // 1. Standard: { "intent_graph": { "nodes": [...], "edges": [...], "execution_plan": {...} } }
    // 2. Custom schema: { "nodes": [...], "edges": [...], "execution_plan": {...} } (directly at top level)
    let intentGraph: IntentGraph;
    if (parsed.intent_graph) {
      // Format 1: Standard wrapped format
      intentGraph = parsed.intent_graph as IntentGraph;
      console.error('[LLMClient] Using standard format: intent_graph wrapper present');
    } else if (parsed.nodes && parsed.edges && parsed.execution_plan) {
      // Format 2: Direct format (when following custom output_schema)
      intentGraph = {
        nodes: parsed.nodes,
        edges: parsed.edges,
        execution_plan: parsed.execution_plan
      } as IntentGraph;
      console.error('[LLMClient] Using custom schema format: nodes/edges/execution_plan at top level');
    } else {
      // Fallback: empty graph
      intentGraph = { 
        nodes: [], 
        edges: [], 
        execution_plan: { 
          entry_points: [], 
          exit_points: [], 
          execution_strategy: 'sequential' 
        } 
      };
      console.error('[LLMClient] WARNING: Could not extract graph from parsed JSON, using empty graph');
    }

    const output: GenerateIntentGraphOutput = {
      intent_graph: intentGraph,
      metadata: {
        generation_timestamp: new Date().toISOString(),
        llm_model_used: this.model,
        generation_time_ms: Date.now() - start,
        complexity_score: parsed?.metadata?.complexity_score,
        estimated_execution_time_ms: parsed?.metadata?.estimated_execution_time_ms,
        estimated_cost: parsed?.metadata?.estimated_cost
      },
      artifacts: parsed?.artifacts,
      validation: parsed?.validation as ValidationResult | undefined
    };

    return output;
  }

  private async postWithRetry(path: string, body: unknown): Promise<any> {
    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const res = await fetch(this.baseUrl + path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return await res.json();
      } catch (err) {
        lastErr = err;
        console.error(`[LLMClient] Attempt ${attempt + 1} failed:`, err);
        attempt += 1;
        if (attempt > this.maxRetries) break;
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }

    throw lastErr;
  }
}

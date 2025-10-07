/**
 * LLM Client for Orchestration Card Generation
 * 
 * Supports multiple LLM providers:
 * - Writer AI (Palmyra)
 * - OpenAI
 * - Anthropic
 * - Azure OpenAI
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

interface LLMConfig {
  provider: 'writer' | 'openai' | 'anthropic' | 'azure';
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMClient {
  private config: LLMConfig;
  
  constructor(config?: Partial<LLMConfig>) {
    // Default to Writer AI if available, fallback to env vars
    this.config = {
      provider: (config?.provider || process.env.LLM_PROVIDER || 'writer') as any,
      apiKey: config?.apiKey || this.getApiKey(config?.provider),
      model: config?.model || this.getDefaultModel(config?.provider),
      baseUrl: config?.baseUrl || this.getBaseUrl(config?.provider),
      temperature: config?.temperature ?? 0.3,
      maxTokens: config?.maxTokens ?? 4000,
    };
  }
  
  private getApiKey(provider?: string): string {
    const prov = provider || this.config?.provider || 'writer';
    
    switch (prov) {
      case 'writer':
        return process.env.WRITER_API_KEY || '';
      case 'openai':
        return process.env.OPENAI_API_KEY || '';
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY || '';
      case 'azure':
        return process.env.AZURE_OPENAI_API_KEY || '';
      default:
        return '';
    }
  }
  
  private getDefaultModel(provider?: string): string {
    const prov = provider || this.config?.provider || 'writer';
    
    switch (prov) {
      case 'writer':
        return 'palmyra-x-004';
      case 'openai':
        return 'gpt-4-turbo-preview';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'azure':
        return 'gpt-4';
      default:
        return 'palmyra-x-004';
    }
  }
  
  private getBaseUrl(provider?: string): string {
    const prov = provider || this.config?.provider || 'writer';
    
    switch (prov) {
      case 'writer':
        return 'https://api.writer.com/v1';
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'azure':
        return process.env.AZURE_OPENAI_ENDPOINT || '';
      default:
        return 'https://api.writer.com/v1';
    }
  }
  
  /**
   * Build prompts for delegation (no LLM call)
   */
  buildPromptsForDelegation(
    query: string,
    availableAgents: any,
    systemContext?: string
  ): {
    systemPrompt: string;
    userPrompt: string;
    responseSchema: any;
  } {
    return {
      systemPrompt: this.buildSystemPrompt(availableAgents, systemContext),
      userPrompt: this.buildUserPrompt(query),
      responseSchema: {
        type: "object",
        properties: {
          user_request: {
            type: "object",
            properties: {
              description: { type: "string" },
              domain: { type: "string" },
              success_criteria: { type: "array", items: { type: "string" } }
            },
            required: ["description"]
          },
          available_agents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                capabilities: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                input_schema: { type: "object" },
                output_schema: { type: "object" }
              },
              required: ["name", "type", "capabilities", "input_schema", "output_schema"]
            }
          },
          constraints: {
            type: "object",
            properties: {
              max_execution_time_ms: { type: "number" },
              max_cost_per_execution: { type: "number" },
              max_retries: { type: "number" }
            }
          },
          preferences: {
            type: "object",
            properties: {
              optimize_for: { type: "string", enum: ["speed", "cost", "reliability", "balanced"] },
              parallelization: { type: "string", enum: ["none", "conservative", "balanced", "aggressive"] }
            }
          }
        },
        required: ["user_request", "available_agents"]
      }
    };
  }
  
  /**
   * Generate orchestration card from natural language
   */
  async generateOrchestrationCard(
    query: string,
    availableAgents: any,
    systemContext?: string
  ): Promise<any> {
    const systemPrompt = this.buildSystemPrompt(availableAgents, systemContext);
    const userPrompt = this.buildUserPrompt(query);
    
    const response = await this.complete(systemPrompt, userPrompt);
    
    // Parse JSON response
    try {
      const card = JSON.parse(response.content);
      return card;
    } catch (error) {
      console.error('Failed to parse LLM response as JSON:', error);
      throw new Error('LLM did not return valid JSON orchestration card');
    }
  }
  
  /**
   * Build system prompt
   */
  private buildSystemPrompt(availableAgents: any, context?: string): string {
    const agentList = Object.entries(availableAgents)
      .map(([name, agent]: [string, any]) => {
        return `- ${name} (${agent.type}): ${agent.description}
  Capabilities: ${agent.capabilities.join(', ')}
  Input: ${Object.keys(agent.input_schema).join(', ')}
  Output: ${Object.keys(agent.output_schema).join(', ')}`;
      })
      .join('\n\n');
    
    return `You are an AI orchestration specialist that converts natural language queries into structured orchestration cards for multi-agent workflows.

${context ? `Context: ${context}\n\n` : ''}

AVAILABLE AGENTS:
${agentList}

YOUR TASK:
Convert the user's natural language query into a JSON orchestration card with the following structure:

{
  "user_request": {
    "description": "Clear description of what the user wants",
    "domain": "Domain context (e.g., data-processing, api-orchestration)",
    "success_criteria": ["Criterion 1", "Criterion 2", ...]
  },
  "available_agents": [
    {
      "name": "AgentName",
      "type": "agent_type",
      "capabilities": ["cap1", "cap2"],
      "description": "Agent description",
      "input_schema": {},
      "output_schema": {}
    }
  ],
  "constraints": {
    "max_execution_time_ms": 300000,
    "max_cost_per_execution": 10.0,
    "max_retries": 3
  },
  "preferences": {
    "optimize_for": "speed | cost | reliability | balanced",
    "parallelization": "none | conservative | balanced | aggressive"
  }
}

RULES:
1. Only include agents that are needed for the task
2. Ensure agent capabilities match the requirements
3. Set realistic constraints
4. Choose appropriate optimization preferences
5. Return ONLY valid JSON, no explanations
6. Be thorough but not excessive`;
  }
  
  /**
   * Build user prompt
   */
  private buildUserPrompt(query: string): string {
    return `Convert this request into an orchestration card:

"${query}"

Remember: Return ONLY the JSON orchestration card, no other text.`;
  }
  
  /**
   * Complete a prompt (provider-agnostic)
   */
  private async complete(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error(`API key not configured for provider: ${this.config.provider}`);
    }
    
    switch (this.config.provider) {
      case 'writer':
        return await this.completeWriter(systemPrompt, userPrompt);
      case 'openai':
        return await this.completeOpenAI(systemPrompt, userPrompt);
      case 'anthropic':
        return await this.completeAnthropic(systemPrompt, userPrompt);
      case 'azure':
        return await this.completeAzure(systemPrompt, userPrompt);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }
  
  /**
   * Writer AI completion
   */
  private async completeWriter(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Writer AI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
  
  /**
   * OpenAI completion
   */
  private async completeOpenAI(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
  
  /**
   * Anthropic completion
   */
  private async completeAnthropic(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }
  
  /**
   * Azure OpenAI completion
   */
  private async completeAzure(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
}


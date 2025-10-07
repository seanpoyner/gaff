/**
 * generate_intent_graph - v2 primary tool
 */

import type {
  OrchestrationCard,
  GenerationOptions,
  GenerateIntentGraphOutput,
  ToolResponse
} from '../types.js';
import { LLMClient } from '../llm/client.js';
import { validateGraph } from '../utils.js';
import { generateMemoryKey } from '../utils/memory.js';
import { storeGraphInMemory } from '../utils/memory-client.js';

function getEnv(name: string, fallback?: string): string | undefined {
  try {
    return process.env[name] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateIntentGraphTool(params: {
  orchestration_card: OrchestrationCard,
  options?: GenerationOptions
}): Promise<ToolResponse<GenerateIntentGraphOutput | any>> {
  try {
    const { orchestration_card, options } = params;
    const generationMode = options?.generation_mode || 'use_configured_api';

    // MODE: delegate_to_caller
    // Return prompts for the calling agent to use its own LLM
    if (generationMode === 'delegate_to_caller') {
      // Create a dummy client just to build the prompts (no API key needed)
      const client = new LLMClient({ 
        apiKey: 'dummy', 
        model: 'n/a', 
        baseUrl: 'n/a' 
      });
      
      const prompts = client.buildPromptsForDelegation(orchestration_card, {
        include_artifacts: options?.include_artifacts,
        artifact_types: options?.artifact_types
      });

      return {
        success: true,
        result: {
          mode: 'delegate_to_caller',
          system_prompt: prompts.systemPrompt,
          user_prompt: prompts.userPrompt,
          response_schema: prompts.responseSchema,
          instructions: 'Use your own LLM to generate the intent graph using the provided prompts. Parse the JSON response and validate it if needed.',
          metadata: {
            generation_timestamp: new Date().toISOString(),
            generation_mode: 'delegate_to_caller'
          }
        }
      };
    }

    // MODE: use_configured_api
    // Use the configured LLM to generate the graph
    const apiKey = getEnv('LLM_API_KEY') || getEnv('WRITER_API_KEY') || getEnv('OPENAI_API_KEY') || getEnv('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return { success: false, error: { code: 'CONFIG_ERROR', message: 'Missing LLM_API_KEY (or WRITER_API_KEY/OPENAI_API_KEY/ANTHROPIC_API_KEY)' } };
    }

    const model = getEnv('LLM_MODEL') || getEnv('WRITER_MODEL') || 'palmyra-x5';
    const baseUrl = getEnv('LLM_BASE_URL') || getEnv('WRITER_BASE_URL') || 'https://api.writer.com';

    const client = new LLMClient({ apiKey, model, baseUrl });
    const generated = await client.generateIntentGraph(orchestration_card, {
      include_artifacts: options?.include_artifacts,
      artifact_types: options?.artifact_types
    });

    // Optionally validate
    if (options?.validate) {
      const validation = validateGraph({
        intent_graph: generated.intent_graph,
        metadata: {
          graph_id: 'temp',
          version: '2.0.0',
          created_at: new Date().toISOString(),
          complexity_metrics: { node_count: 0, edge_count: 0, depth: 0, complexity_score: 0 }
        },
        validation: { is_valid: true, checks_performed: [] }
      });
      generated.validation = validation;
    }

    // Optionally store in memory directly
    if (options?.store_in_memory) {
      const memoryKey = options.memory_key || generateMemoryKey(orchestration_card);
      
      console.error('[generate] Attempting to store graph in memory with key:', memoryKey);
      const storeResult = await storeGraphInMemory(generated.intent_graph, memoryKey);
      
      if (storeResult.success) {
        console.error('[generate] ✅ Graph successfully stored in memory');
        return {
          success: true,
          result: {
            ...generated,
            memory_storage: {
              enabled: true,
              memory_key: memoryKey,
              stored: true,
              message: `✅ Graph successfully stored in memory with key: ${memoryKey}`,
              usage_note: `You can now reference this graph in visualize_graph, analyze_graph, and export_graph tools using: { "graph_id": "${memoryKey}" } instead of passing the full graph object.`
            }
          }
        };
      } else {
        console.error('[generate] ❌ Failed to store graph in memory:', storeResult.error);
        return {
          success: true,
          result: {
            ...generated,
            memory_storage: {
              enabled: true,
              memory_key: memoryKey,
              stored: false,
              error: storeResult.error,
              message: `⚠️ Failed to store graph in memory: ${storeResult.error}. You can still use the graph normally, but memory caching is unavailable.`
            }
          }
        };
      }
    }

    return { success: true, result: generated };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate intent graph',
        details: { error: String(error) }
      }
    };
  }
}

# Flexible LLM Generation Modes

## Overview

The Intent-Graph MCP Server supports **two generation strategies** to provide maximum flexibility for cost and performance optimization:

1. **`delegate_to_caller`** - Returns prompts for the calling agent to use its own LLM
2. **`use_configured_api`** (default) - Uses the configured LLM API directly

---

## Mode 1: `delegate_to_caller`

### When to Use
- ✅ **Zero extra API costs** - Reuse the calling agent's existing LLM
- ✅ **Consistency** - Same model throughout the entire conversation
- ✅ **Simplicity** - No extra API keys or configuration needed
- ✅ **Powerful models** - Already using Claude, GPT-4, or Gemini

### How It Works

1. Calling agent invokes `generate_intent_graph` with `generation_mode: 'delegate_to_caller'`
2. MCP server returns:
   - `system_prompt`: Comprehensive instructions for the LLM
   - `user_prompt`: Orchestration card details formatted for generation
   - `response_schema`: JSON schema for validation
   - `instructions`: How to use these prompts
3. Calling agent uses its own LLM to generate the graph
4. Agent parses and validates the JSON response

### Request Example
```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Process customer support tickets"
    },
    "available_agents": [
      {
        "name": "TicketClassifier",
        "type": "llm",
        "capabilities": ["classify_issue"],
        "input_schema": {"ticket": "string"},
        "output_schema": {"category": "string"}
      }
    ]
  },
  "options": {
    "generation_mode": "delegate_to_caller"
  }
}
```

### Response Example
```json
{
  "mode": "delegate_to_caller",
  "system_prompt": "You are an expert workflow architect that designs intent graphs for agent orchestration...",
  "user_prompt": "USER'S REQUEST:\n\"Process customer support tickets\"\n\nAVAILABLE AGENTS:\n1. TicketClassifier (llm)...",
  "response_schema": {
    "type": "object",
    "properties": {
      "intent_graph": {
        "type": "object",
        "description": "The complete intent graph structure"
      }
    },
    "required": ["intent_graph"]
  },
  "instructions": "Use your own LLM to generate the intent graph using the provided prompts. Parse the JSON response and validate it if needed.",
  "metadata": {
    "generation_timestamp": "2025-10-04T17:00:00.000Z",
    "generation_mode": "delegate_to_caller"
  }
}
```

---

## Mode 2: `use_configured_api` (Default)

### When to Use
- ✅ **Cost optimization** - Use cheaper models for graph generation
- ✅ **Performance optimization** - Use faster models
- ✅ **Model specialization** - Best model for graph generation task
- ✅ **Multi-model workflows** - Different models for different tasks

### How It Works

1. Calling agent invokes `generate_intent_graph` with `generation_mode: 'use_configured_api'` (or omits it)
2. MCP server calls its configured LLM API
3. LLM generates the complete intent graph
4. MCP server returns the generated graph to the calling agent

### Configuration

Set environment variables:

```bash
# API Key (any one of these)
LLM_API_KEY=your-key-here
WRITER_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here

# Model
LLM_MODEL=palmyra-x5
WRITER_MODEL=palmyra-x5

# Base URL
LLM_BASE_URL=https://api.writer.com
WRITER_BASE_URL=https://api.writer.com
```

### Request Example
```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Process customer support tickets"
    },
    "available_agents": [
      {
        "name": "TicketClassifier",
        "type": "llm",
        "capabilities": ["classify_issue"],
        "input_schema": {"ticket": "string"},
        "output_schema": {"category": "string"}
      }
    ]
  },
  "options": {
    "generation_mode": "use_configured_api",
    "include_artifacts": true,
    "validate": true
  }
}
```

### Response Example
```json
{
  "intent_graph": {
    "nodes": [
      {
        "id": "entry",
        "agent": "TicketClassifier",
        "type": "entry",
        "purpose": "Receive incoming ticket",
        "instructions": "Accept the customer support ticket and prepare it for classification...",
        "context": "Initial entry point for ticket processing workflow.",
        "available_mcp_tools": [],
        "available_tools": [],
        "input": ["$.ticket"],
        "output": ["$.raw_ticket"]
      },
      {
        "id": "classify_ticket",
        "agent": "TicketClassifier",
        "type": "processing",
        "purpose": "Classify the support ticket",
        "instructions": "Analyze the ticket content and classify it into the appropriate category...",
        "context": "Classification determines routing and priority.",
        "available_mcp_tools": [],
        "available_tools": [],
        "input": ["$.raw_ticket"],
        "output": ["$.category"]
      }
    ],
    "edges": [
      {
        "from": "entry",
        "to": "classify_ticket"
      }
    ],
    "execution_plan": {
      "entry_points": ["entry"],
      "exit_points": ["classify_ticket"],
      "execution_strategy": "sequential"
    }
  },
  "metadata": {
    "generation_timestamp": "2025-10-04T17:00:00.000Z",
    "llm_model_used": "palmyra-x5",
    "generation_time_ms": 8500
  },
  "validation": {
    "is_valid": true,
    "checks_performed": [...]
  }
}
```

---

## Comparison

| Feature | `delegate_to_caller` | `use_configured_api` |
|---------|---------------------|---------------------|
| **API Costs** | None (uses calling agent's LLM) | Additional LLM API call |
| **Configuration** | None needed | Requires API key |
| **Model Consistency** | Same model as conversation | Can use different model |
| **Performance** | Depends on calling agent's model | Can optimize per task |
| **Cost Optimization** | Uses existing costs | Can use cheaper models |
| **Setup Complexity** | Zero (works immediately) | Requires env vars |
| **Use Case** | Simple, cost-effective | Advanced, optimized |

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Request                                │
│              "Generate an intent graph for X"                    │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               Primary Agent (Claude/GPT-4/Gemini)                │
│  Decides which generation mode to use based on context          │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
┌──────────────────────┐      ┌──────────────────────┐
│  delegate_to_caller  │      │  use_configured_api  │
│                      │      │                      │
│  1. Get prompts      │      │  1. Call LLM API     │
│  2. Call own LLM     │      │  2. Get graph        │
│  3. Parse response   │      │  3. Return graph     │
└──────────┬───────────┘      └──────────┬───────────┘
           │                             │
           └─────────────┬───────────────┘
                         ↓
           ┌─────────────────────────────┐
           │   Complete Intent Graph     │
           └─────────────┬───────────────┘
                         ↓
           ┌─────────────────────────────┐
           │   Primary Agent Processes   │
           │   and Returns to User       │
           └─────────────────────────────┘
```

---

## Testing Examples

### Test in Claude Desktop

#### Test 1: delegate_to_caller Mode

```
Please use the intent-graph MCP server to generate an intent graph for:
"Validate user input and send a confirmation email"

Use delegate_to_caller mode so you can generate it with your own LLM (Claude).
```

**What happens:**
1. Claude calls `generate_intent_graph` with `generation_mode: 'delegate_to_caller'`
2. Receives prompts from the MCP server
3. Uses its own Claude Sonnet model to generate the graph
4. Returns the complete graph to you

**Cost:** Standard Claude conversation tokens only

---

#### Test 2: use_configured_api Mode

```
Please use the intent-graph MCP server to generate an intent graph for:
"Validate user input and send a confirmation email"

Use the configured API mode (Writer Palmyra).
```

**What happens:**
1. Claude calls `generate_intent_graph` with `generation_mode: 'use_configured_api'`
2. MCP server calls Writer Palmyra API
3. Returns the complete generated graph
4. Claude displays it to you

**Cost:** Claude conversation tokens + Writer API call

---

## Implementation Notes

### Code Structure

**`src/types.ts`** - Type definitions
```typescript
export type GenerationMode = 'delegate_to_caller' | 'use_configured_api';

export interface GenerationOptions {
  generation_mode?: GenerationMode;
  include_artifacts?: boolean;
  artifact_types?: string[];
  format?: "json" | "yaml";
  validate?: boolean;
  optimize?: boolean;
}
```

**`src/llm/client.ts`** - LLM client with dual modes
```typescript
export class LLMClient {
  // Returns prompts without calling API
  buildPromptsForDelegation(orchestrationCard, options): {
    systemPrompt: string;
    userPrompt: string;
    responseSchema: any;
  }
  
  // Calls API directly (existing behavior)
  async generateIntentGraph(orchestrationCard, options): Promise<GenerateIntentGraphOutput>
}
```

**`src/tools/generate.ts`** - Tool implementation
```typescript
export async function generateIntentGraphTool(params) {
  const mode = params.options?.generation_mode || 'use_configured_api';
  
  if (mode === 'delegate_to_caller') {
    // Return prompts
    return { mode, system_prompt, user_prompt, response_schema };
  }
  
  // Use configured API
  const client = new LLMClient({ apiKey, model, baseUrl });
  return await client.generateIntentGraph(...);
}
```

---

## Best Practices

### When to Use `delegate_to_caller`
1. **Development & Testing** - Quick iteration without API setup
2. **Cost-Sensitive Applications** - Minimize API costs
3. **Simple Workflows** - Standard graph generation
4. **Consistent Experience** - Same model throughout

### When to Use `use_configured_api`
1. **Production Systems** - Optimized model selection
2. **Performance-Critical** - Use fastest models
3. **Cost Optimization** - Use cheaper models for specific tasks
4. **Multi-Model Architecture** - Different models for different stages

---

## Summary

The Intent-Graph MCP Server's **flexible generation modes** enable:

✅ **Cost Optimization** - Choose the most economical approach
✅ **Performance Optimization** - Select the fastest models
✅ **Simplicity** - Works out of the box with no configuration
✅ **Flexibility** - Override per request as needed
✅ **Scalability** - Adapt to different deployment scenarios

This design supports the **orchestration → generation → execution** architecture you described, providing maximum flexibility for building sophisticated multi-agent systems! 🚀


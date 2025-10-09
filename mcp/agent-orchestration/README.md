# Agent Orchestration MCP Server

> 🎭 Convert natural language queries into structured orchestration cards for multi-agent workflows

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0.4-blue.svg)](https://modelcontextprotocol.io)
[![Status](https://img.shields.io/badge/Status-Working-green.svg)](https://github.com/seanpoyner/gaff)

**Part of [GAFF Framework](https://github.com/seanpoyner/gaff)** - Open-source AI agent orchestration  
**Status:** ✅ Production-Ready  
**Version:** 1.0.4  
**Pipeline Position:** Step 1 - Natural Language → Orchestration Card  
**Confluence:** [agent-orchestration Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580103320)

## What is Agent Orchestration?

Agent Orchestration is an MCP server that acts as the **"intent interpreter"** for AI agent workflows. It takes natural language queries and converts them into structured **orchestration cards** that can be used to generate executable intent graphs.

**GAFF Pipeline:**
```
Natural Language → Orchestration Card → Safety Check → Intent Graph → Execution → Quality Check
     (You)           (THIS SERVER)      (safety)       (intent-graph)    (router)    (quality)
```

**⭐ Recommended:** Use [gaff-gateway](../gaff-gateway/) to access this and all other GAFF servers through a single connection.

## Features

- 🧠 **No API Key Required** - Uses delegate_to_caller mode by default (leverages Claude/Cursor's LLM)
- 📋 **5 Powerful Tools** - Generate, validate, list, query, and store orchestration cards
- ✅ **Automatic Validation** - Ensures cards match available agents in `gaff.json`
- 🎯 **Capability Matching** - Intelligently selects agents based on capabilities
- 💾 **Memory Integration** - Optional storage in memory MCP server (future)
- 🔧 **Standalone or Integrated** - Use independently or as part of GAFF
- 🌐 **Gateway Compatible** - Accessible via gaff-gateway with `orchestration_*` prefix

## Installation

### Quick Start (Standalone)

```bash
# Install globally
npm install -g agent-orchestration-mcp-server

# Or use npx (no install needed)
npx agent-orchestration-mcp-server
```

### As Part of GAFF

```bash
cd gaff/mcp/agent-orchestration
npm install
npm run build
```

## Usage

### Claude Desktop / Cursor Configuration

**🎉 No API keys needed by default!** The server uses Claude's own LLM in `delegate_to_caller` mode.

Add to your MCP settings (`claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "agent-orchestration": {
      "command": "npx",
      "args": ["-y", "agent-orchestration-mcp-server"],
      "env": {
        "GAFF_CONFIG_PATH": "/path/to/your/gaff.json"
      }
    }
  }
}
```

**That's it!** No API keys required. See [NO_API_KEY_NEEDED.md](./NO_API_KEY_NEEDED.md) for details.

### LLM Provider Configuration (Optional)

**Default:** No configuration needed! Uses `delegate_to_caller` mode with Claude's LLM.

**Alternative:** To use your own LLM API (requires setting `generation_mode: "use_configured_api"`):

```bash
# Writer AI
export WRITER_API_KEY=your-key
export LLM_PROVIDER=writer

# OpenAI
export OPENAI_API_KEY=your-key
export LLM_PROVIDER=openai

# Anthropic
export ANTHROPIC_API_KEY=your-key
export LLM_PROVIDER=anthropic

# Azure OpenAI
export AZURE_OPENAI_API_KEY=your-key
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
export LLM_PROVIDER=azure
```

See [NO_API_KEY_NEEDED.md](./NO_API_KEY_NEEDED.md) for when to use each mode.

## Available Tools

### 1. `generate_orchestration_card`

Convert a natural language query into a structured orchestration card.

**Input:**
```json
{
  "query": "Process customer orders, validate payment, and send confirmation emails",
  "generation_mode": "delegate_to_caller",  // Default: uses Claude's LLM, no API key needed
  "gaff_config": { /* optional: provide gaff.json object */ },
  "primary_agent_context": "User is setting up an e-commerce workflow",
  "store_in_memory": false
}
```

**Generation Modes:**
- `"delegate_to_caller"` (default) - Returns prompts for Claude/Cursor to use their own LLM. **No API key needed!**
- `"use_configured_api"` - Calls your configured LLM API directly. Requires API key.

**Output (delegate_to_caller mode):**
```json
{
  "success": true,
  "mode": "delegate_to_caller",
  "system_prompt": "You are an AI orchestration specialist...",
  "user_prompt": "Convert this request...",
  "response_schema": { /* JSON schema for the orchestration card */ },
  "instructions": "Use your own LLM to generate the orchestration card..."
}
```

Claude/Cursor will automatically use these prompts and return the orchestration card.

**Output (use_configured_api mode):**
```json
{
  "success": true,
  "mode": "use_configured_api",
  "orchestration_card": {
    "user_request": {
      "description": "Process customer orders with payment validation and email confirmation",
      "domain": "e-commerce",
      "success_criteria": [
        "Order processed successfully",
        "Payment validated",
        "Confirmation email sent"
      ]
    },
    "available_agents": [
      {
        "name": "OrderProcessor",
        "type": "api",
        "capabilities": ["order-processing", "data-validation"],
        "input_schema": { /* ... */ },
        "output_schema": { /* ... */ }
      }
      /* ... more agents ... */
    ],
    "constraints": {
      "max_execution_time_ms": 300000,
      "max_cost_per_execution": 10.0,
      "max_retries": 3
    },
    "preferences": {
      "optimize_for": "reliability",
      "parallelization": "balanced"
    }
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

### 2. `validate_orchestration_card`

Validate an orchestration card's structure and agent references.

**Input:**
```json
{
  "orchestration_card": { /* card to validate */ }
}
```

**Output:**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": ["Agent XYZ not found in gaff.json"]
}
```

### 3. `list_agents`

List all available agents from `gaff.json`, optionally filtered.

**Input:**
```json
{
  "capability_filter": ["data-processing", "api-integration"],
  "type_filter": "api"
}
```

**Output:**
```json
{
  "success": true,
  "count": 5,
  "agents": [
    {
      "name": "DataProcessor",
      "type": "api",
      "description": "Processes and transforms data",
      "capabilities": ["data-processing", "transformation"],
      "has_endpoint": true,
      "authentication_required": true
    }
  ],
  "all_capabilities": [
    "data-processing",
    "api-integration",
    "validation",
    /* ... */
  ]
}
```

### 4. `get_agent_capabilities`

Get detailed information about a specific agent.

**Input:**
```json
{
  "agent_name": "DataProcessor"
}
```

**Output:**
```json
{
  "success": true,
  "agent": {
    "name": "DataProcessor",
    "type": "api",
    "description": "Processes and transforms data",
    "capabilities": ["data-processing", "transformation"],
    "endpoint": "https://api.example.com/process",
    "authentication": "api_key",
    "input_schema": { /* ... */ },
    "output_schema": { /* ... */ },
    "timeout_ms": 30000,
    "retry_policy": {
      "max_attempts": 3,
      "backoff_strategy": "exponential"
    }
  }
}
```

### 5. `store_card`

Store an orchestration card in memory MCP server (coming soon).

**Input:**
```json
{
  "orchestration_card": { /* card to store */ },
  "session_id": "session-123",
  "memory_key": "order-processing-workflow"
}
```

## GAFF Configuration (`gaff.json`)

The orchestration server reads agent definitions from `gaff.json`:

```json
{
  "version": "1.0.0",
  "name": "My GAFF Instance",
  "agents": {
    "DataProcessor": {
      "type": "api",
      "description": "Processes and transforms data",
      "capabilities": ["data-processing", "transformation", "validation"],
      "endpoint": "https://api.example.com/process",
      "authentication": "api_key",
      "input_schema": {
        "data": { "type": "object", "description": "Data to process" }
      },
      "output_schema": {
        "processed_data": { "type": "object", "description": "Processed data" },
        "status": { "type": "string", "enum": ["success", "failure"] }
      },
      "timeout_ms": 30000,
      "retry_policy": {
        "max_attempts": 3,
        "backoff_strategy": "exponential"
      }
    },
    /* ... more agents ... */
  }
}
```

## Example Workflow

```typescript
// 1. List available agents
const agentsResponse = await callTool("list_agents", {
  capability_filter: ["data-processing"]
});

// 2. Generate orchestration card from natural language
const cardResponse = await callTool("generate_orchestration_card", {
  query: "Process customer data, validate it, and store in database"
});

const orchestrationCard = cardResponse.orchestration_card;

// 3. Validate the card
const validation = await callTool("validate_orchestration_card", {
  orchestration_card: orchestrationCard
});

// 4. Pass to intent-graph-generator for execution planning
const intentGraph = await callTool("generate_intent_graph", {
  orchestration_card: orchestrationCard
});

// 5. Execute with router MCP server
const result = await callTool("execute_intent_graph", {
  intent_graph: intentGraph
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Natural Language Query                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              agent-orchestration MCP Server                  │
│                                                              │
│  1. Load gaff.json (available agents)                       │
│  2. Call LLM with query + agent capabilities                │
│  3. Generate structured orchestration card                  │
│  4. Validate card structure                                 │
│  5. Return orchestration card                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Card                        │
│                                                              │
│  - user_request (description, domain, criteria)             │
│  - available_agents (filtered list with schemas)            │
│  - constraints (time, cost, retries)                        │
│  - preferences (optimization, parallelization)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                  (Pass to intent-graph-generator)
```

## Development

```bash
# Clone the repo
git clone https://github.com/seanpoyner/gaff.git
cd gaff/mcp/agent-orchestration

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Watch mode
npm run watch
```

## Testing

```bash
# Test the server locally
npm start

# In another terminal, use MCP Inspector
npx @modelcontextprotocol/inspector npx agent-orchestration-mcp-server
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GAFF_CONFIG_PATH` | Path to gaff.json | `./gaff.json` | **Recommended** |
| `WRITER_API_KEY` | Writer AI API key | - | Only if `use_configured_api` mode |
| `OPENAI_API_KEY` | OpenAI API key | - | Only if `use_configured_api` mode |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | Only if `use_configured_api` mode |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | - | Only if `use_configured_api` mode |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | - | Only if `use_configured_api` mode |
| `LLM_PROVIDER` | LLM provider to use | `writer` | Only if `use_configured_api` mode |

**Note:** Default `delegate_to_caller` mode requires NO API keys! ✅

## Troubleshooting

### "Could not load GAFF configuration"

**Solution:** Set the `GAFF_CONFIG_PATH` environment variable or place `gaff.json` in your working directory.

```bash
export GAFF_CONFIG_PATH=/path/to/gaff.json
```

### "API key not configured"

**Solution 1 (Recommended):** Use default `delegate_to_caller` mode - no API key needed!

```json
{
  "query": "...",
  "generation_mode": "delegate_to_caller"  // or omit, it's the default
}
```

**Solution 2:** If using `use_configured_api` mode, set your API key:

```bash
export WRITER_API_KEY=your-key
# OR
export OPENAI_API_KEY=your-key
# OR
export ANTHROPIC_API_KEY=your-key
```

### "LLM did not return valid JSON"

**Solution:** This usually means the LLM generated text instead of a structured orchestration card. Try:
1. Use a more capable model (e.g., `gpt-4`, `claude-3-5-sonnet`, `palmyra-x-004`)
2. Ensure your query is clear and specific
3. Check LLM provider rate limits

## Related Projects

- **[GAFF](https://github.com/seanpoyner/gaff)** - Complete orchestration framework
- **[intent-graph-generator](https://www.npmjs.com/package/intent-graph-generator-mcp-server)** - Generate executable intent graphs
- **[@modelcontextprotocol/server-memory](https://www.npmjs.com/package/@modelcontextprotocol/server-memory)** - Persistent memory for agents

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT © Sean Poyner

## Author

**Sean Poyner**
- Email: sean.poyner@pm.me
- GitHub: [@seanpoyner](https://github.com/seanpoyner)
- Role: Automation Engineer @ Marriott AI Studio

## Acknowledgments

Built with the [Model Context Protocol SDK](https://modelcontextprotocol.io) by Anthropic.

---

**Need help?** Open an issue on [GitHub](https://github.com/seanpoyner/gaff/issues)

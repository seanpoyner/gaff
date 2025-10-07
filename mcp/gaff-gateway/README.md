# GAFF Gateway

**Single Entry Point to All GAFF MCP Servers**

The GAFF Gateway provides unified access to all GAFF MCP servers through a single connection, aggregating 17+ tools from 9 different servers.

## Why Use the Gateway?

### Benefits
1. **Single Connection**: Connect once, access everything
2. **Simplified Configuration**: One server vs 9 separate configurations
3. **Unified Namespace**: All tools with clear prefixes
4. **High-Level Workflows**: Compose multi-server workflows easily
5. **Out-of-the-Box Functionality**: Includes sandbox, thinking, memory

### What You Get

- ✅ **9 MCP Servers**: All GAFF components in one place
- ✅ **17+ Tools**: Full GAFF workflow + utilities
- ✅ **Smart Routing**: Automatic tool → server mapping
- ✅ **Official Servers**: Memory, sandbox, sequential-thinking via npx
- ✅ **End-to-End Workflow**: Single tool call for complete orchestration

## Quick Start

### Installation

```bash
cd gaff/mcp/gaff-gateway
npm install
npm run build
```

### Configuration

#### Cursor (`C:\Users\YourName\.cursor\mcp.json`):
```json
{
  "mcpServers": {
    "gaff-gateway": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/gaff-gateway/build/index.js"]
    }
  }
}
```

#### Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "gaff-gateway": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/gaff-gateway/build/index.js"]
    }
  }
}
```

### Usage

Once connected, you have access to all 17 tools:

```javascript
// High-level end-to-end workflow
gaff_create_and_execute_workflow({
  query: "Process customer orders and send notifications"
})

// Memory operations
memory_create_entities(...)
memory_search_nodes(...)

// Orchestration
orchestration_generate_card(...)

// Intent graph generation
graph_generate(...)
graph_visualize(...)

// Execution
router_execute_graph(...)

// Quality & Safety
quality_validate_result(...)
safety_validate_compliance(...)

// Utilities
tools_human_in_the_loop(...)
tools_format_data(...)

// Code execution
sandbox_execute_code({
  language: "python",
  code: "print('Hello from GAFF!')"
})

// Reasoning
thinking_sequential({
  thought: "Breaking down this complex problem...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

## Available Tools (17+)

### 🚀 High-Level Workflows
- `gaff_create_and_execute_workflow` - End-to-end: NL → Orchestration → Graph → Execution → Quality Check

### 🧠 Memory (Knowledge Graph)
- `memory_create_entities` - Create entities and relations
- `memory_search_nodes` - Search the knowledge graph
- `memory_read_graph` - Read entire graph

### 🎯 Agent Orchestration
- `orchestration_generate_card` - NL → Orchestration Card
- `orchestration_list_agents` - List available agents

### 📊 Intent Graph Generation
- `graph_generate` - Orchestration Card → Intent Graph
- `graph_visualize` - Generate Mermaid diagrams

### 🔀 Router (Execution Engine)
- `router_execute_graph` - Execute intent graphs
- `router_get_execution_status` - Check async execution

### ✅ Quality Check
- `quality_validate_result` - Validate execution quality

### 🛡️ Safety Protocols
- `safety_validate_compliance` - GDPR, CCPA, SOC2 validation
- `safety_check_guardrails` - PII detection, content safety

### 🛠️ Tools & Utilities
- `tools_human_in_the_loop` - Request human approval
- `tools_format_data` - Data format conversion

### 🔒 Sandbox (Code Execution)
- `sandbox_execute_code` - Execute Python/JavaScript/Shell safely

### 🧠 Sequential Thinking (Reasoning)
- `thinking_sequential` - Step-by-step transparent reasoning

## Architecture

### Server Routing

The gateway uses intelligent routing to forward tool calls to the appropriate server:

```
Tool Name           → Server                      → Command
─────────────────────────────────────────────────────────────────
memory_*           → @modelcontextprotocol/       → npx
                     server-memory

sandbox_*          → @modelcontextprotocol/       → npx
                     server-sandbox

thinking_*         → @modelcontextprotocol/       → npx
                     server-sequential-thinking

graph_*            → intent-graph-mcp-server      → npx (published)

orchestration_*    → agent-orchestration          → node (local)
router_*           → router                       → node (local)
quality_*          → quality-check                → node (local)
safety_*           → safety-protocols             → node (local)
tools_*            → tools                        → node (local)

gaff_*             → gateway itself (composed)    → n/a
```

### Implementation Status

✅ **Phase 1: Tool Aggregation** (COMPLETE)
- All 17 tools from 9 servers exposed
- Clear prefix-based organization
- Comprehensive input schemas

✅ **Phase 2A: Server Routing Logic** (COMPLETE)
- Prefix → server mapping
- Configuration management
- Routing simulation

⏳ **Phase 2B: Server Communication** (NEXT)
- Spawn child MCP processes
- JSON-RPC stdio communication
- Response aggregation

## End-to-End Workflow Example

The gateway's main feature is the ability to compose an entire GAFF workflow in a single tool call:

```javascript
await gaff_create_and_execute_workflow({
  query: "Analyze customer sentiment from support tickets and generate monthly report",
  options: {
    validate_safety: true,    // Run compliance checks
    optimize_graph: true,      // Optimize execution plan
    quality_check: true,       // Validate output quality
    store_in_memory: true,     // Cache results
    execution_mode: "sync"     // Wait for completion
  }
});
```

This single call orchestrates:
1. ✅ `orchestration_generate_card` - Parse NL to structured card
2. ✅ `safety_validate_compliance` - Check compliance
3. ✅ `graph_generate` - Create optimized execution graph
4. ✅ `router_execute_graph` - Execute workflow
5. ✅ `quality_validate_result` - Validate quality
6. ✅ `memory_create_entities` - Store results

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Watch Mode
```bash
npm run watch
```

### Test Tools List
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

### Test Tool Call
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"memory_search_nodes","arguments":{"query":"test"}}}' | node build/index.js
```

## Included Servers

### Official Anthropic Servers (via npx)
1. **@modelcontextprotocol/server-memory** - Knowledge graph storage
2. **@modelcontextprotocol/server-sandbox** - Safe code execution
3. **@modelcontextprotocol/server-sequential-thinking** - Step-by-step reasoning

### Published GAFF Servers (via npx)
4. **intent-graph-mcp-server** - Intent graph generation

### Local GAFF Servers (via node)
5. **agent-orchestration** - Natural language → Orchestration cards
6. **router** - Intent graph execution engine
7. **quality-check** - Quality validation & rerun logic
8. **safety-protocols** - Compliance & guardrails
9. **tools** - Utilities & HITL

## Configuration

### Environment Variables

- `GAFF_CONFIG_PATH` - Path to gaff.json (default: `../../../gaff.json`)

### gaff.json Integration

The gateway automatically loads `gaff.json` for:
- Available agents and their capabilities
- MCP server configurations
- Tool mappings
- Compliance requirements

## Troubleshooting

### Gateway Won't Start

**Error**: Cannot find gaff.json
```bash
# Set custom path
export GAFF_CONFIG_PATH="/path/to/gaff.json"
```

**Error**: Module not found
```bash
# Rebuild
cd gaff/mcp/gaff-gateway
npm install
npm run build
```

### Tools Not Showing

Check that all required servers are properly installed:

```bash
# Official servers (should work via npx)
npx -y @modelcontextprotocol/server-memory
npx -y @modelcontextprotocol/server-sandbox
npx -y @modelcontextprotocol/server-sequential-thinking

# Published GAFF server
npx -y intent-graph-mcp-server@2.2.3

# Local GAFF servers
cd gaff/mcp/agent-orchestration && npm run build
cd gaff/mcp/router && npm run build
cd gaff/mcp/quality-check && npm run build
cd gaff/mcp/safety-protocols && npm run build
cd gaff/mcp/tools && npm run build
```

### Tool Calls Failing

Currently, Phase 2B (actual server communication) returns simulated responses showing the routing logic. Full implementation coming soon.

## Comparison: Gateway vs Individual Servers

### With Gateway (Recommended)
```json
{
  "mcpServers": {
    "gaff-gateway": {
      "command": "node",
      "args": ["C:/path/to/gaff/mcp/gaff-gateway/build/index.js"]
    }
  }
}
```
- ✅ Single connection
- ✅ 17+ tools available
- ✅ Simplified config
- ✅ High-level workflows

### Without Gateway (Manual)
```json
{
  "mcpServers": {
    "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] },
    "sandbox": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sandbox"] },
    "thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] },
    "intent-graph": { "command": "npx", "args": ["-y", "intent-graph-mcp-server@2.2.3"] },
    "orchestration": { "command": "node", "args": ["C:/path/to/gaff/mcp/agent-orchestration/build/index.js"] },
    "router": { "command": "node", "args": ["C:/path/to/gaff/mcp/router/build/index.js"] },
    "quality": { "command": "node", "args": ["C:/path/to/gaff/mcp/quality-check/build/index.js"] },
    "safety": { "command": "node", "args": ["C:/path/to/gaff/mcp/safety-protocols/build/index.js"] },
    "tools": { "command": "node", "args": ["C:/path/to/gaff/mcp/tools/build/index.js"] }
  }
}
```
- ❌ 9 separate connections
- ❌ Complex configuration
- ❌ Manual workflow composition
- ✅ Direct server access

## Roadmap

### v1.0 (Current)
- ✅ Tool aggregation from all servers
- ✅ Prefix-based routing logic
- ✅ Simulated server communication
- ✅ Official Anthropic servers included

### v1.1 (Next)
- ⏳ Full server-to-server communication
- ⏳ Persistent server connections
- ⏳ Connection pooling
- ⏳ Error recovery & retries

### v1.2 (Future)
- ⏳ Caching & optimization
- ⏳ Metrics & monitoring
- ⏳ Load balancing
- ⏳ Hot reload of servers

### v2.0 (Vision)
- ⏳ Visual workflow builder
- ⏳ Distributed execution
- ⏳ Plugin system
- ⏳ Cloud deployment

## License

MIT - See LICENSE file in repository root

## Author

Sean Poyner <sean.poyner@pm.me>

## Repository

https://github.com/seanpoyner/gaff

## Related Documentation

- [Main GAFF README](../../../README.md)
- [Memory Server Setup](../memory/README.md)
- [Sandbox Server](../sandbox/README.md)
- [Sequential Thinking](../sequential-thinking/README.md)
- [Intent Graph Generator](../intent-graph-generator/README.md)
- [Agent Orchestration](../agent-orchestration/README.md)

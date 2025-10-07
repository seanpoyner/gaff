# GAFF Dual-Direction Architecture

## Overview

GAFF supports **bidirectional MCP communication**, enabling both:
1. **External agents connecting TO GAFF**
2. **GAFF internal agents using GAFF's own MCP servers**

This document explains how both work and when to use each.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL CONNECTIONS                         │
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│  │  Claude  │     │  Cursor  │     │  Custom  │              │
│  │ Desktop  │     │   IDE    │     │   App    │              │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘              │
│       │                │                │                      │
│       └────────────────┼────────────────┘                      │
│                        │                                        │
│                        │ MCP Connection (stdio/http)           │
│                        ▼                                        │
└────────────────────────────────────────────────────────────────┘
                         │
                         │
        ┌────────────────▼───────────────────────────┐
        │         GAFF GATEWAY                       │
        │  (Single entry point - 17+ tools)          │
        │                                             │
        │  Routes to appropriate MCP servers:        │
        │  - memory, sandbox, thinking (official)    │
        │  - intent-graph-generator (published)      │
        │  - orchestration, router, quality, etc.    │
        └────────────────┬───────────────────────────┘
                         │
        ┌────────────────┴───────────────────────────┐
        │                                             │
        ▼                                             ▼
┌───────────────┐                          ┌──────────────────┐
│  GAFF MCP     │                          │  GAFF INTERNAL   │
│  SERVERS      │                          │  AGENTS          │
│               │                          │                  │
│ • memory      │◀─────────────────────────│ • DataAnalyzer   │
│ • sandbox     │  MCP Client Connection   │ • Orchestrator   │
│ • thinking    │  (via GaffAgentBase)     │ • Custom agents  │
│ • orchestr... │                          │                  │
│ • router      │                          │  (agents/...)    │
│ • quality     │                          │                  │
│ • safety      │                          └──────────────────┘
│ • tools       │
│ • graph-gen   │
└───────────────┘
```

## Use Case 1: External → GAFF (Primary)

**Scenario:** Claude Desktop, Cursor, or your custom application needs to use GAFF's orchestration capabilities.

### Configuration

**Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):
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

**Cursor** (`C:\Users\seanp\.cursor\mcp.json`):
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

### What You Get

- ✅ 17+ GAFF tools available directly in the app
- ✅ Memory operations
- ✅ Code execution (sandbox)
- ✅ Sequential thinking
- ✅ Complete workflow orchestration
- ✅ Quality checks and safety validation

### Example Usage (From External App)

```typescript
// In Claude Desktop or Cursor, you can now:
await gaff_create_and_execute_workflow({
  query: "Fetch user data, analyze patterns, and generate report"
});

await memory_search_nodes({ query: "past analyses" });

await sandbox_execute_code({
  language: "python",
  code: "print('Hello from GAFF!')"
});
```

## Use Case 2: GAFF Internal → GAFF MCP (This Addition)

**Scenario:** You're building an agent that runs WITHIN GAFF as part of a workflow, and it needs to use GAFF's own MCP servers.

### When to Use

- ✅ Custom agents defined in `gaff.json`
- ✅ Agents that are nodes in intent graphs
- ✅ Agents that need memory, sandbox, thinking tools
- ✅ Agents that orchestrate sub-workflows

### Setup

#### 1. Define Agent in gaff.json

```json
{
  "agents": {
    "MyDataProcessor": {
      "type": "transformer",
      "description": "Processes and analyzes data",
      "capabilities": ["data_analysis", "pattern_recognition"],
      "input_schema": {
        "data": "object",
        "options": "object"
      },
      "output_schema": {
        "result": "object",
        "insights": "array"
      }
    }
  }
}
```

#### 2. Create Agent Class

```typescript
// agents/my-data-processor.ts
import { GaffAgentBase } from './gaff-agent-base.js';

export class MyDataProcessor extends GaffAgentBase {
  constructor() {
    super('MyDataProcessor'); // Must match gaff.json
  }
  
  async execute(input: any): Promise<any> {
    // Agent now has access to ALL GAFF MCP tools!
    
    // Use memory
    await this.memory_search('similar analyses');
    
    // Execute code
    const result = await this.sandbox_execute('python', 'import pandas as pd...');
    
    // Think through complex logic
    await this.think('Analyzing data patterns...', 1, 5, true);
    
    return { result: 'processed', insights: [...] };
  }
}
```

#### 3. Build and Run

```bash
cd gaff/agents
npm install
npm run build
node my-data-processor.js
```

### What You Get

- ✅ Full access to GAFF's MCP servers
- ✅ Automatic connection to gateway
- ✅ All helper methods (memory, sandbox, thinking)
- ✅ Lifecycle management (initialize/shutdown)
- ✅ Config integration from gaff.json

### Example Usage (From Internal Agent)

```typescript
// Inside your agent's execute() method:

// 1. Store context in memory
await this.memory_create([{
  name: 'processing_context',
  entityType: 'context',
  observations: ['Started processing', 'Input size: 1000']
}]);

// 2. Execute analysis code
const analysisResult = await this.sandbox_execute('python', `
import json
data = [1, 2, 3, 5, 8, 13]
result = {"mean": sum(data)/len(data)}
print(json.dumps(result))
`);

// 3. Use thinking for complex decisions
await this.think('Should I proceed with transformation?', 1, 3, true);
await this.think('Yes, data looks valid', 2, 3, true);
await this.think('Proceeding with transformation', 3, 3, false);

// 4. Request approval if needed
await this.requestApproval(
  'Transform 1000 records',
  'confirmation'
);

// 5. Execute sub-workflow
const subResult = await this.createWorkflow(
  'Validate data and send notifications'
);
```

## Comparison

| Feature | External → GAFF | GAFF Internal → GAFF MCP |
|---------|----------------|-------------------------|
| **Connection** | MCP client (app) → Gateway | MCP client (agent) → Gateway |
| **Configuration** | `.cursor/mcp.json` | `gaff.json` + agent code |
| **Access to Tools** | All 17+ tools | All 17+ tools |
| **Use Case** | End-user applications | Workflow nodes, sub-agents |
| **Lifecycle** | App-managed | Agent-managed |
| **Example** | Claude using GAFF | DataAnalyzer agent |

## Key Insight: Both Use the Same Gateway

**This is the beauty of the architecture!**

Both external apps and internal agents connect to the **same GAFF Gateway**, which routes all tool calls to the appropriate MCP servers.

```
External App ────┐
                 ├──→ GAFF Gateway ──→ MCP Servers
Internal Agent ──┘
```

This means:
- ✅ Consistent tool behavior
- ✅ Single point of configuration
- ✅ Shared memory and state
- ✅ Unified monitoring and logging

## Example Workflow: Internal + External

**Scenario:** External app orchestrates a workflow that includes internal agents that themselves use GAFF tools.

```
1. [User in Cursor]
   ↓
2. "Analyze sales data and generate insights"
   ↓
3. [GAFF Gateway] → orchestration_generate_card
   ↓
4. [Orchestration Card] → [Intent Graph Generator]
   ↓
5. [Intent Graph]:
   {
     nodes: [
       { id: "fetch", agent: "DataFetcher" },
       { id: "analyze", agent: "DataAnalyzer" },  ← Internal GAFF agent
       { id: "report", agent: "ReportGenerator" }
     ]
   }
   ↓
6. [Router] executes graph:
   - Runs DataFetcher
   - Runs DataAnalyzer (internal agent)
     ↓
     DataAnalyzer internally calls:
     - memory_search('past analyses')
     - sandbox_execute_code(analysis_script)
     - thinking_sequential(reasoning steps)
     ↓
   - Runs ReportGenerator
   ↓
7. [Results] back to Cursor
```

**Both external (Cursor) and internal (DataAnalyzer) use the same GAFF Gateway!**

## Setup Instructions

### For External Apps (Already Done)

1. ✅ GAFF Gateway built and ready
2. ✅ Configure in `.cursor/mcp.json` or `claude_desktop_config.json`
3. ✅ Restart app
4. ✅ Use GAFF tools

### For Internal Agents (New - Just Added)

1. ✅ Define agent in `gaff.json`
2. ✅ Create agent class extending `GaffAgentBase`
3. ✅ Build agent: `cd agents && npm run build`
4. ✅ Run agent: `node your-agent.js`

## Benefits

### For External Users
- Simple configuration (one MCP server)
- Access to all GAFF capabilities
- No need to understand internal architecture

### For GAFF Developers
- Internal agents can use GAFF tools
- Consistent API for all agents
- Easy to build complex workflows
- Agents can orchestrate sub-workflows

### For The Ecosystem
- Bidirectional flow enables powerful patterns
- External apps can trigger internal agents
- Internal agents can use all MCP tools
- Everything goes through the gateway (monitoring, caching)

## Next Steps

### For External Integration
- Configure your app with GAFF Gateway
- Start using GAFF tools
- Build workflows with `gaff_create_and_execute_workflow`

### For Building Internal Agents
- Read `agents/README.md`
- Study example agents:
  - `agents/examples/data-analyzer-agent.ts`
  - `agents/examples/workflow-orchestrator-agent.ts`
- Create your own agent extending `GaffAgentBase`
- Add to workflows via `gaff.json` and intent graphs

## Summary

**GAFF now fully supports bidirectional MCP communication:**

1. **External → GAFF**: Apps like Claude/Cursor connect to GAFF Gateway
2. **GAFF Internal → GAFF MCP**: Internal agents use GAFF's own MCP servers

Both use the **same gateway**, providing:
- ✅ Consistent behavior
- ✅ Full tool access (17+ tools)
- ✅ Simplified architecture
- ✅ Powerful composition patterns

**This makes GAFF both:**
- A powerful **MCP server** for external apps
- A robust **platform** for building multi-agent systems

---

**Author:** Sean Poyner  
**Date:** October 6, 2025  
**Version:** GAFF 1.0.0


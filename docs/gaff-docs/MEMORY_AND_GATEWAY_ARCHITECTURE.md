# GAFF Memory & Gateway Architecture

**Date:** October 6, 2025  
**Author:** Sean Poyner

---

## Question 1: Should GAFF Include Memory MCP Server?

### **Answer: YES! ✅**

The memory MCP server should be included in GAFF as a **first-class component** for the following reasons:

### Benefits of Including Memory

1. **Out-of-the-Box Functionality**
   - No external dependencies to set up
   - Works immediately after GAFF installation
   - Reduces friction for new users

2. **Session Persistence**
   - Store orchestration cards across sessions
   - Cache intent graphs to avoid regeneration
   - Maintain execution history for auditing
   - Remember user preferences and context

3. **Performance Optimization**
   - Cache expensive LLM responses
   - Reuse previous orchestration cards for similar queries
   - Store validated intent graphs
   - Reduce API costs

4. **Developer Experience**
   - Consistent memory interface across all GAFF components
   - Pre-configured and tested integration
   - Example memory patterns included

5. **Configurable by Design**
   - Can be disabled via gaff.json: `"memory_enabled": false`
   - Supports different backends (in-memory, file-based, database)
   - Environment-specific configuration (dev vs production)

### Implementation Approach

**Use the official memory server via npx** - No need to create a custom one!

```json
// In .cursor/mcp.json or mcp.json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Already configured!** ✅

### Memory Server Configuration in gaff.json

```json
{
  "protocols": {
    "memory_mcp": {
      "enabled": true,
      "type": "embedded",              // embedded | external
      "backend": "in-memory",          // in-memory | file | redis | postgres
      "persistence": {
        "enabled": true,
        "path": "./data/memory"
      },
      "ttl": {
        "orchestration_cards": 86400,  // 24 hours
        "intent_graphs": 3600,         // 1 hour
        "execution_results": 604800    // 7 days
      }
    }
  }
}
```

### Use Cases Within GAFF

1. **agent-orchestration Server**
   - Cache generated orchestration cards
   - Store query → card mappings
   - Remember agent selection patterns

2. **intent-graph-generator Server**
   - Cache generated intent graphs
   - Store optimization insights
   - Remember successful patterns

3. **router Server**
   - Store execution state for async workflows
   - Cache agent responses
   - Maintain execution history

4. **quality-check Server**
   - Remember quality assessment patterns
   - Store rerun strategies that worked
   - Track quality metrics over time

---

## Question 2: Can Agents Connect to GAFF as a Whole?

### **Current Architecture: Multiple Connections**

Currently, each MCP server in GAFF is **separate and independent**:

```
Primary Agent
│
├── Connection to agent-orchestration
├── Connection to intent-graph-generator
├── Connection to router
├── Connection to tools
├── Connection to quality-check
├── Connection to safety-protocols
└── Connection to memory
```

**This means:**
- The agent needs to configure 6-7 separate MCP servers
- Each server exposes its own tools independently
- No unified GAFF interface

### **Proposed Solution: GAFF Gateway MCP Server** 🚀

**YES, we should create a gateway server!** This would provide a **single entry point** to all GAFF functionality.

```
Primary Agent
│
└── Connection to GAFF Gateway
    │
    ├── Tools from agent-orchestration
    ├── Tools from intent-graph-generator
    ├── Tools from router
    ├── Tools from tools
    ├── Tools from quality-check
    ├── Tools from safety-protocols
    └── Tools from memory
```

### GAFF Gateway Architecture

```
gaff/
└── mcp/
    ├── gaff-gateway/                 # ✅ NEW
    │   ├── package.json
    │   ├── README.md
    │   └── src/
    │       ├── index.ts              # Main gateway server
    │       ├── server-registry.ts    # Discovers and registers sub-servers
    │       ├── tool-aggregator.ts    # Aggregates tools from all servers
    │       └── router.ts             # Routes tool calls to appropriate server
    └── ...
```

### Gateway Features

1. **Automatic Server Discovery**
   - Scans mcp/ directory for all MCP servers
   - Reads each server's capabilities
   - Aggregates all tools into single namespace

2. **Tool Routing**
   - Routes tool calls to the appropriate server
   - Handles inter-server communication
   - Manages tool dependencies

3. **Unified Configuration**
   - Single connection configuration for agents
   - Centralized logging and monitoring
   - Unified authentication/authorization

4. **Smart Tool Composition**
   - Composes multi-server workflows
   - Example: `generate_and_execute_workflow` tool that calls:
     1. `agent-orchestration.generate_orchestration_card`
     2. `intent-graph-generator.generate_intent_graph`
     3. `router.execute_graph`
     4. `quality-check.validate_execution_result`

### Example: Gateway Tool

```typescript
// GAFF Gateway exposes high-level tools that compose multiple servers

{
  name: "gaff_create_and_execute_workflow",
  description: "End-to-end workflow: NL → Card → Graph → Execution",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      options: {
        validate: { type: "boolean" },
        optimize: { type: "boolean" },
        quality_check: { type: "boolean" }
      }
    }
  },
  
  // Gateway implementation
  async handler(params) {
    // 1. Generate orchestration card
    const card = await callServer("agent-orchestration", "generate_orchestration_card", {
      query: params.query
    });
    
    // 2. Generate intent graph
    const graph = await callServer("intent-graph-generator", "generate_intent_graph", {
      orchestration_card: card
    });
    
    // 3. Execute graph
    const result = await callServer("router", "execute_graph", {
      graph: graph
    });
    
    // 4. Quality check (if enabled)
    if (params.options?.quality_check) {
      const quality = await callServer("quality-check", "validate_execution_result", {
        result: result
      });
      
      if (!quality.is_acceptable) {
        // Trigger rerun
        return await callServer("router", "rerun_nodes", {
          graph: graph,
          nodes: quality.rerun_nodes
        });
      }
    }
    
    return result;
  }
}
```

### Benefits of Gateway Approach

✅ **Simplified Configuration**
- Agents only need to connect to one MCP server (the gateway)
- One entry in `.cursor/mcp.json` or Copilot Studio config

✅ **Unified API**
- All GAFF tools available through single interface
- Consistent naming conventions
- Reduced cognitive load for users

✅ **Intelligent Orchestration**
- Gateway can create high-level workflows
- Automatically manages dependencies between servers
- Optimizes cross-server communication

✅ **Better Monitoring**
- Single point for logging
- Unified metrics and telemetry
- Easier debugging

✅ **Flexibility**
- Can still connect to individual servers directly if needed
- Gateway is optional but recommended
- Backward compatible with current architecture

### Configuration: With vs Without Gateway

#### **Without Gateway (Current)**
```json
{
  "mcpServers": {
    "agent-orchestration": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/agent-orchestration/build/index.js"]
    },
    "intent-graph-generator": {
      "command": "npx",
      "args": ["-y", "intent-graph-mcp-server"]
    },
    "router": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/router/build/index.js"]
    },
    "tools": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/tools/build/index.js"]
    },
    "quality-check": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/quality-check/build/index.js"]
    },
    "safety-protocols": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/safety-protocols/build/index.js"]
    },
    "memory": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/memory/index.js"]
    }
  }
}
```

#### **With Gateway (Proposed)** ⭐
```json
{
  "mcpServers": {
    "gaff": {
      "command": "node",
      "args": ["C:/Users/seanp/projects/gaff/mcp/gaff-gateway/build/index.js"],
      "env": {
        "GAFF_CONFIG_PATH": "C:/Users/seanp/projects/gaff/gaff.json"
      }
    }
  }
}
```

**Much simpler!** ✨

---

## Recommendation

### Phase 1: Add Memory Server ✅ (Do This Now)
1. Install `@modelcontextprotocol/server-memory` in `mcp/memory/`
2. Configure in gaff.json with `memory_enabled: true` by default
3. Update all MCP servers to use memory for caching
4. Document memory usage patterns

### Phase 2: Create GAFF Gateway 🚀 (Next Priority)
1. Create `mcp/gaff-gateway/` with server discovery
2. Implement tool aggregation and routing
3. Create high-level workflow tools
4. Update documentation with simplified setup
5. Make gateway **optional** but **recommended**

### Phase 3: Enhanced Gateway Features 💎 (Future)
1. Tool composition DSL (define workflows declaratively)
2. Real-time tool execution monitoring
3. Distributed execution across multiple machines
4. WebSocket transport for real-time updates
5. GraphQL interface for tool discovery

---

## Implementation Priority

### Immediate (This Week)
- ✅ Memory server already configured via npx
- 📝 Document memory usage patterns in GAFF components
- 🧪 Test memory integration with agent-orchestration
- 📝 Add memory examples to gaff.json

### Next Sprint (Next Week)
- 🚧 Design gaff-gateway architecture
- 🚧 Implement server discovery
- 🚧 Create tool aggregation
- 🚧 Test with simple workflows

### Following Sprint
- 🚧 Implement high-level workflow tools
- 🚧 Add monitoring and logging
- 🚧 Update all documentation
- 🚧 Publish gaff-gateway as part of GAFF

---

## Conclusion

**Both features are excellent ideas:**

1. **Memory Server**: Absolutely include it. Essential for production use.
2. **Gateway Server**: Strong YES! It transforms GAFF from a collection of servers into a **unified agentic framework**.

The gateway makes GAFF more like a **framework** than a **toolkit**, providing:
- Single connection point
- High-level abstractions
- Built-in best practices
- Simplified developer experience

**This is what will differentiate GAFF in the market.** 🎯

---

## Next Steps

Would you like me to:
1. ✅ Set up the memory server now?
2. 🚧 Create the gaff-gateway scaffold?
3. 📝 Write detailed gateway design doc?
4. 🧪 Build a proof-of-concept gateway?

Let me know and I'll proceed!


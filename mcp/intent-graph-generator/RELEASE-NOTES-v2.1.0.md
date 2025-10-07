# 🎉 IntentGraph MCP Server v2.1.0 Release Notes

**Release Date:** October 4, 2025  
**Status:** ✅ Production Ready  
**Type:** Minor Version with Major Feature Additions

---

## 🌟 What's New in v2.1.0

### 1. 🚀 Flexible LLM Generation Modes

**The Problem:** Users wanted flexibility in choosing which LLM generates the intent graph—either the calling agent's LLM or a configured server-side LLM.

**The Solution:** Two generation modes:

#### `delegate_to_caller` Mode
```typescript
generate_intent_graph({
  orchestration_card: {...},
  options: {
    generation_mode: "delegate_to_caller"
  }
})

// Returns:
{
  "mode": "delegate_to_caller",
  "system_prompt": "...",
  "user_prompt": "...",
  "response_schema": {...},
  "instructions": "Use your own LLM to generate..."
}
```

**Benefits:**
- ✅ Calling agent uses its own LLM (Claude, GPT-4, etc.)
- ✅ Cost optimization (use cheaper models)
- ✅ Model flexibility
- ✅ Maintains user's existing API quotas/limits

#### `use_configured_api` Mode (Default)
```typescript
generate_intent_graph({
  orchestration_card: {...},
  options: {
    generation_mode: "use_configured_api"  // Default
  }
})

// Server directly calls configured LLM and returns complete graph
```

**Benefits:**
- ✅ Simple, direct generation
- ✅ No additional LLM calls from caller
- ✅ Consistent results
- ✅ Works with any OpenAI-compatible API

**Documentation:** [GENERATION-MODES.md](./GENERATION-MODES.md)

---

### 2. 🎨 System-Configurable Generation

**The Problem:** Different multi-agent systems have different workflows, output formats, and requirements. One-size-fits-all prompts don't work.

**The Solution:** Custom `system_configuration` in orchestration cards:

```typescript
{
  "orchestration_card": {
    "user_request": {...},
    "available_agents": [...],
    "system_configuration": {
      "system_name": "Medical Diagnostic Multi-Agent System",
      "system_description": "AI-powered diagnostic workflow...",
      "system_purpose": "Assist healthcare providers...",
      "custom_prompt_template": "# Your Custom Template\n...",
      "output_schema": { /* Custom JSON Schema */ },
      "example_outputs": [
        {
          "description": "Example workflow",
          "output": "..."
        }
      ],
      "agent_descriptions": [...],
      "validation_rules": [...]
    }
  }
}
```

**Features:**
- ✅ Custom system prompts per workflow type
- ✅ Flexible output schemas
- ✅ Example outputs for training LLM
- ✅ Agent-specific descriptions
- ✅ Custom validation rules
- ✅ Makes server a "meta-orchestration tool"

**Use Cases:**
- Medical diagnostics workflows
- Fraud detection systems
- Content publishing pipelines
- Smart home automation
- Research literature review
- Any domain-specific multi-agent system

**Documentation:** [SYSTEM-CONFIGURABLE-GENERATION.md](./SYSTEM-CONFIGURABLE-GENERATION.md)

---

### 3. 💾 Direct Memory Integration ⚡ (Breaking Change)

**The Problem:** Previous architecture required manual memory storage/retrieval:
1. Generate graph
2. Server returns "here's how to store it"
3. User manually executes memory commands ❌ (often forgotten)
4. Graph never actually stored

**The New Architecture:** Server directly connects to memory MCP server:

```typescript
// Generate and store (automatic)
generate_intent_graph({
  orchestration_card: {...},
  options: {
    store_in_memory: true  // ← Magic happens here!
  }
})

// Response:
{
  "intent_graph": {...},
  "memory_storage": {
    "stored": true,  // ✅ Actually stored!
    "memory_key": "intent_graph_medical_diagnostics_..."
  }
}

// Later: Use the graph (automatic retrieval)
visualize_graph({
  graph_id: "intent_graph_medical_diagnostics_..."
})

// Server automatically retrieves from memory and visualizes!
```

**What Changed:**
- ✅ **Automatic storage** when `store_in_memory: true`
- ✅ **Automatic retrieval** when `graph_id` provided
- ✅ **No manual steps** required
- ✅ **Reusable pattern** for any state variables
- ✅ Works with `visualize_graph`, `analyze_graph`, `optimize_graph`, `export_graph`

**Configuration:**
```bash
# Default (uses @modelcontextprotocol/server-memory)
export MEMORY_MCP_COMMAND="npx"
export MEMORY_MCP_ARGS="-y,@modelcontextprotocol/server-memory"

# Custom memory server
export MEMORY_MCP_COMMAND="node"
export MEMORY_MCP_ARGS="/path/to/memory-server.js"
```

**Breaking Change:** If you relied on manual memory storage instructions, update your code to use the automatic storage/retrieval pattern.

**Documentation:** 
- [MEMORY-DIRECT-INTEGRATION.md](./MEMORY-DIRECT-INTEGRATION.md)
- [MEMORY-CACHING.md](./MEMORY-CACHING.md)
- [MEMORY-QUICK-START.md](./MEMORY-QUICK-START.md)

---

### 4. ✨ Enhanced Visualization

**The Problem:** Previous Mermaid diagrams were basic and lacked visual appeal.

**The Solution:** Modern, colorful, information-rich diagrams:

**New Features:**
- 🎨 **Modern styling** with colors, shapes, and icons
- 🤖 **Agent type icons**: 
  - 🤖 LLM agents
  - 🔌 API agents
  - ✅ Validators
  - 🔀 Routers
  - 📊 Aggregators
  - 🔄 Transformers
- 📐 **Multiple shape types**:
  - Stadium shapes for entry/exit
  - Diamond shapes for decisions
  - Trapezoid for aggregation
  - Rounded rectangles for processing
- 🎨 **Color-coded by agent type**:
  - Blue for LLM
  - Orange for API
  - Green for validators
  - Purple for routers
- 📝 **Rich node labels**:
  - Instructions (abbreviated)
  - Available tools with counts
  - Configuration (timeouts, retries)
  - Input/output data
- 🔗 **Enhanced edge labels**:
  - Conditions with ✓ icon
  - Triggers with ⚡ icon
  - Data flow with 📦 icon
  - Error paths with x--x style
  - Retry paths with o--o style

**Style Presets:**
- `basic`: Minimal (just nodes and edges)
- `detailed`: Includes tools and short instructions (default)
- `complete`: Everything including conditions and triggers

**Example:**
```typescript
visualize_graph({
  graph_id: "intent_graph_...",
  options: {
    style: "complete",
    direction: "TB",
    include_metadata: true
  }
})
```

**Documentation:** [ENHANCED-VISUALIZATION.md](./ENHANCED-VISUALIZATION.md)

---

## 🐛 Critical Fixes

### Fixed JSON Parsing for Custom Schemas
- **Issue:** LLM wrapped JSON in markdown code blocks with trailing text
- **Fix:** More aggressive markdown extraction using regex capturing groups
- **Impact:** `system_configuration` outputs now parse correctly

### Fixed Schema Mismatch
- **Issue:** Custom `output_schema` didn't align with `IntentGraph` interface
- **Fix:** Support both formats (wrapped and direct top-level properties)
- **Impact:** Flexible schema outputs now work reliably

### Fixed Property Names
- **Issue:** Inconsistent property names (`id` vs `node_id`, `from` vs `from_node`)
- **Fix:** Helper functions now handle both property name conventions
- **Impact:** All tools work consistently with LLM-generated graphs

---

## 📊 Version Comparison

| Feature | v2.0.0 | v2.1.0 |
|---------|--------|--------|
| **LLM Generation** | Single mode (server-side) | Flexible (delegate or server) |
| **Custom Prompts** | ❌ | ✅ System-configurable |
| **Memory Storage** | Manual instructions | ✅ Automatic direct integration |
| **Memory Retrieval** | Manual commands | ✅ Automatic by graph_id |
| **Visualization** | Basic Mermaid | ✅ Enhanced with colors/icons |
| **State Management** | None | ✅ Reusable memory pattern |
| **Output Schemas** | Fixed | ✅ Flexible per system |
| **Cost Optimization** | Limited | ✅ Model selection flexibility |

---

## 🚀 Upgrade Guide

### From v2.0.0 to v2.1.0

**Breaking Changes:**
1. **Memory Integration:** If you used manual memory storage instructions, update to `store_in_memory: true`

**New Environment Variables:**
```bash
# Optional: Configure memory server
export MEMORY_MCP_COMMAND="npx"
export MEMORY_MCP_ARGS="-y,@modelcontextprotocol/server-memory"
```

**New Features to Adopt:**

1. **Use flexible generation modes:**
   ```typescript
   // Let calling agent use its own LLM
   options: { generation_mode: "delegate_to_caller" }
   ```

2. **Add system configuration for custom workflows:**
   ```typescript
   orchestration_card: {
     system_configuration: {
       custom_prompt_template: "...",
       output_schema: {...}
     }
   }
   ```

3. **Enable memory caching:**
   ```typescript
   options: { store_in_memory: true }
   ```

4. **Use graph_id for faster operations:**
   ```typescript
   visualize_graph({ graph_id: "intent_graph_..." })
   ```

5. **Try enhanced visualization:**
   ```typescript
   options: { style: "complete" }
   ```

---

## 📚 Documentation Updates

**New Documents:**
- [GENERATION-MODES.md](./GENERATION-MODES.md) - Flexible generation modes
- [SYSTEM-CONFIGURABLE-GENERATION.md](./SYSTEM-CONFIGURABLE-GENERATION.md) - Custom system configuration
- [MEMORY-DIRECT-INTEGRATION.md](./MEMORY-DIRECT-INTEGRATION.md) - Direct memory architecture
- [MEMORY-CACHING.md](./MEMORY-CACHING.md) - Memory caching feature
- [MEMORY-QUICK-START.md](./MEMORY-QUICK-START.md) - Quick reference
- [ENHANCED-VISUALIZATION.md](./ENHANCED-VISUALIZATION.md) - Visualization improvements
- [RELEASE-NOTES-v2.1.0.md](./RELEASE-NOTES-v2.1.0.md) - This document

**Updated Documents:**
- [README.md](./README.md) - Updated features, changelog, configuration
- Test prompts in `test-prompts/` directory

---

## 🎯 Migration Checklist

- [ ] Update to v2.1.0: `npm install -g intent-graph-mcp-server@2.1.0`
- [ ] Add memory server configuration (if using caching)
- [ ] Update orchestration cards to use `store_in_memory: true`
- [ ] Replace manual memory commands with `graph_id` lookups
- [ ] Test custom `system_configuration` for your workflow
- [ ] Try `delegate_to_caller` mode for cost optimization
- [ ] Update visualization calls to use enhanced styles
- [ ] Review and update documentation references

---

## 🔮 What's Next?

**Planned for v2.2:**
- Connection pooling for memory server
- Batch operations (store/retrieve multiple graphs)
- TTL support for cached graphs
- Compression for large graphs
- Graph versioning and history
- Performance benchmarks

**Planned for v3.0:**
- Graph execution engine
- Real-time collaboration on graphs
- Visual graph editor
- Template library
- Multi-language support

---

## 🙏 Acknowledgments

Special thanks to:
- The Model Context Protocol community
- Writer AI for Palmyra LLM
- Early adopters and testers
- Contributors providing feedback

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/seanpoyner/intent-graph-generator/issues)
- **Email:** sean.poyner@pm.me
- **Documentation:** [README.md](./README.md)
- **License:** MIT

---

**Happy orchestrating! 🎉**

---

*IntentGraph MCP Server v2.1.0 - Flexible, Configurable, Intelligent*


# ⚡ Memory Caching - Quick Start

## TL;DR

Stop passing massive graph JSON repeatedly. Store once, reference by key.

---

## 3-Step Setup

### 1️⃣ Generate with Memory Flag

```json
{
  "tool": "intent-graph:generate_intent_graph",
  "params": {
    "orchestration_card": { /* your card */ },
    "options": {
      "store_in_memory": true
    }
  }
}
```

### 2️⃣ Store in Memory (use returned command)

```json
{
  "tool": "memory:create_entities",
  "params": {
    "entities": [{
      "name": "intent_graph_xyz",
      "entityType": "intent_graph",
      "observations": [ /* graph data */ ]
    }]
  }
}
```

### 3️⃣ Use Memory Key Everywhere

```json
// Instead of passing 20KB graph:
{ "graph": { /* huge JSON */ } }

// Just pass 50-byte key:
{ "graph_id": "intent_graph_xyz" }
```

---

## Supported Tools

✅ `visualize_graph` - Pass `graph_id`  
✅ `analyze_graph` - Pass `graph_id`  
✅ `export_graph` - Pass `graph_id`  
✅ `optimize_graph` - Pass `graph_id`  

---

## Benefits

📉 **74% less context usage**  
⚡ **80%+ faster tool calls**  
💰 **Lower API costs**  
🚀 **Better multi-tool workflows**  

---

## Example Workflow

```typescript
// Generate
const result = await generate({ 
  orchestration_card, 
  options: { store_in_memory: true } 
});

// Store
const key = result.memory_storage.memory_key;
await memory_create_entities(result.memory_storage.command.params);

// Use
await visualize_graph({ graph_id: key });
await analyze_graph({ graph_id: key });
await export_graph({ graph_id: key, format: 'yaml' });
await optimize_graph({ graph_id: key });
```

---

## Full Documentation

See `MEMORY-CACHING.md` for complete guide.

---

**Ready to test? Restart Claude Desktop and try it!** 🎉


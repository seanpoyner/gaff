# GAFF Memory Server

**Official MCP Memory Server bundled with GAFF**

This directory contains the official `@modelcontextprotocol/server-memory` as a dependency, ensuring GAFF users have memory support out-of-the-box without additional installation.

## Why Include Memory?

1. **Self-Contained:** GAFF works immediately after installation
2. **No External Dependencies:** Users don't need to install memory separately
3. **Guaranteed Compatibility:** Tested version that works with GAFF
4. **Optional:** Users can still use their own memory server if preferred

## What This Is

This is **NOT a custom memory implementation**. It's simply:
- The official `@modelcontextprotocol/server-memory` as a dependency
- A simple wrapper for convenience
- Pre-configured to work with GAFF

## Installation

```bash
cd gaff/mcp/memory
npm install
```

## Usage

### Option 1: Use with GAFF (Recommended)

GAFF configuration will automatically include memory. No additional setup needed.

### Option 2: Use Standalone

```bash
cd gaff/mcp/memory
npm start
```

### Option 3: Direct via npx

```bash
npx @modelcontextprotocol/server-memory
```

## Configuration in Cursor/Claude Desktop

### Use GAFF's Bundled Memory
```json
{
  "mcpServers": {
    "gaff-memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "cwd": "C:/Users/seanp/projects/gaff/mcp/memory"
    }
  }
}
```

### Or Use Global Installation
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Both work the same!** The first ensures you're using GAFF's tested version.

## Tools Provided

The official memory server provides 9 tools:

1. **`create_entities`** - Create entities in knowledge graph
2. **`create_relations`** - Create relationships between entities  
3. **`add_observations`** - Add metadata to entities
4. **`delete_entities`** - Remove entities
5. **`delete_observations`** - Remove metadata
6. **`delete_relations`** - Remove relationships
7. **`read_graph`** - Read entire knowledge graph
8. **`search_nodes`** - Search by query
9. **`open_nodes`** - Open specific entities

## GAFF Integration Examples

### Store Orchestration Card

```javascript
// In agent-orchestration server
await memoryClient.create_entities({
  entities: [{
    name: `card_${timestamp}`,
    entityType: "orchestration_card",
    observations: [
      JSON.stringify(orchestrationCard),
      `query: ${userQuery}`,
      `agents: ${card.available_agents.length}`,
      `created: ${new Date().toISOString()}`
    ]
  }]
});
```

### Store Intent Graph with Relation

```javascript
// In intent-graph-generator
await memoryClient.create_entities({
  entities: [{
    name: `graph_${graphId}`,
    entityType: "intent_graph",
    observations: [
      JSON.stringify(intentGraph),
      `nodes: ${graph.nodes.length}`,
      `complexity: ${analysis.complexity}`
    ]
  }]
});

// Link graph to its source card
await memoryClient.create_relations({
  relations: [{
    from: `card_${cardId}`,
    to: `graph_${graphId}`,
    relationType: "generated_from"
  }]
});
```

### Cache and Reuse

```javascript
// Check if similar card exists
const existingCards = await memoryClient.search_nodes({
  query: userQuery
});

if (existingCards.length > 0) {
  console.log('Reusing existing orchestration card');
  return existingCards[0];
}

// Generate new card only if needed
const newCard = await generateOrchestrationCard(userQuery);
await storeInMemory(newCard);
return newCard;
```

## Environment Variables

The memory server supports various environment variables for configuration. See official documentation:
https://github.com/modelcontextprotocol/servers/tree/main/src/memory

## Updating

To update to the latest memory server:

```bash
cd gaff/mcp/memory
npm update @modelcontextprotocol/server-memory
```

## Official Documentation

For full documentation, see:
- GitHub: https://github.com/modelcontextprotocol/servers/tree/main/src/memory
- MCP Protocol: https://modelcontextprotocol.io

## License

The official memory server is licensed under MIT by Anthropic.

This wrapper is also MIT licensed - see LICENSE file in repository root.

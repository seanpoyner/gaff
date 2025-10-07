# GAFF Internal Agents

**Agents that run WITHIN GAFF and use GAFF's MCP servers**

This directory contains agents that are part of GAFF workflows and need to use GAFF's own MCP servers (memory, sandbox, thinking, etc.).

## Architecture: Dual Direction Support

GAFF works in **both directions**:

### 1. External → GAFF (Primary Use Case)
External agents/applications connect TO GAFF's MCP servers:
```
[Copilot Studio/Writer AI/Claude/Cursor] → [GAFF Gateway] → [All GAFF MCP Servers]
```

### 2. GAFF Internal → GAFF MCP (This Directory)
Agents running WITHIN GAFF use GAFF's MCP servers:
```
[GAFF Internal Agent] → [GAFF Gateway] → [All GAFF MCP Servers]
```

## Base Class: GaffAgentBase

All internal agents inherit from `GaffAgentBase`, which provides:

- ✅ **Automatic MCP Client** - Connects to GAFF Gateway
- ✅ **Tool Access** - All 17+ GAFF tools available via `this.mcp.call()`
- ✅ **Helper Methods** - Shortcuts for common operations
- ✅ **Config Integration** - Reads from `gaff.json` automatically
- ✅ **Lifecycle Management** - `initialize()` and `shutdown()`

## Quick Start

### 1. Install Dependencies
```bash
cd gaff/agents
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Run Examples
```bash
# Data Analyzer Agent
npm run example:analyzer

# Workflow Orchestrator Agent
npm run example:orchestrator
```

## Creating Your Own Agent

### Step 1: Define Agent in gaff.json

```json
{
  "agents": {
    "MyCustomAgent": {
      "type": "custom",
      "description": "My custom agent that does X",
      "capabilities": ["capability1", "capability2"],
      "input_schema": {
        "param1": "string",
        "param2": "object"
      },
      "output_schema": {
        "result": "string",
        "status": "string"
      }
    }
  }
}
```

### Step 2: Create Agent Class

```typescript
// agents/my-custom-agent.ts
import { GaffAgentBase } from './gaff-agent-base.js';

export class MyCustomAgent extends GaffAgentBase {
  constructor() {
    super('MyCustomAgent'); // Must match gaff.json
  }
  
  async execute(input: any): Promise<any> {
    // Use GAFF's MCP tools
    
    // 1. Use memory
    const data = await this.memory_search('my query');
    
    // 2. Execute code in sandbox
    const result = await this.sandbox_execute('python', 'print("Hello")');
    
    // 3. Use sequential thinking
    await this.think('Planning my approach...', 1, 3, true);
    
    // 4. Request human approval
    await this.requestApproval('Execute action X', 'confirmation');
    
    // 5. Create entire workflows
    const workflow = await this.createWorkflow('Process data and notify');
    
    return { status: 'success', result };
  }
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const agent = new MyCustomAgent();
    await agent.initialize();
    
    const result = await agent.execute({ /* input */ });
    console.log(result);
    
    await agent.shutdown();
  })();
}
```

### Step 3: Run Your Agent

```bash
npm run build
node my-custom-agent.js
```

## Available MCP Tools

All internal agents have access to **17+ tools** from GAFF's MCP servers:

### Memory Operations
```typescript
// Create entities
await this.mcp.call('memory_create_entities', {
  entities: [{ name: 'test', entityType: 'data', observations: ['...'] }]
});

// Search memory
await this.memory_search('query string');
```

### Code Execution
```typescript
// Execute code safely
await this.sandbox_execute('python', `
  import json
  data = {"result": 42}
  print(json.dumps(data))
`);
```

### Sequential Thinking
```typescript
// Step-by-step reasoning
await this.think(
  'Analyzing the problem...',
  thoughtNumber: 1,
  totalThoughts: 5,
  nextNeeded: true
);
```

### Human-in-the-Loop
```typescript
// Request approval
await this.requestApproval(
  'Delete 100 records',
  'confirmation',
  { risk: 'high' }
);
```

### High-Level Workflows
```typescript
// Create entire workflows
await this.createWorkflow(
  'Fetch data, validate, transform, and store',
  { validate_safety: true, quality_check: true }
);
```

### All Other Tools
```typescript
// Direct MCP call for any tool
await this.mcp.call('orchestration_generate_card', { query: '...' });
await this.mcp.call('graph_visualize', { graph: {...} });
await this.mcp.call('router_execute_graph', { graph: {...} });
await this.mcp.call('quality_validate_result', { execution_result: {...} });
await this.mcp.call('safety_validate_compliance', { orchestration_card: {...} });
```

## Example Agents

### 1. Data Analyzer Agent
**Location:** `examples/data-analyzer-agent.ts`

Demonstrates:
- Using sequential thinking for planning
- Storing context in memory
- Executing analysis code in sandbox
- Storing results in memory

**Run:**
```bash
npm run example:analyzer
```

### 2. Workflow Orchestrator Agent
**Location:** `examples/workflow-orchestrator-agent.ts`

Demonstrates:
- Understanding requirements with thinking
- Searching memory for past workflows
- Requesting human approval for critical operations
- Using high-level `gaff_create_and_execute_workflow` tool
- Storing execution history

**Run:**
```bash
npm run example:orchestrator
```

## Configuration

### Environment Variables

- `GAFF_CONFIG_PATH` - Path to gaff.json (default: `../gaff.json`)
- `GAFF_GATEWAY_PATH` - Path to gateway (default: `../mcp/gaff-gateway/build/index.js`)

### Custom Gateway Connection

```typescript
// Override gateway path
process.env.GAFF_GATEWAY_PATH = '/custom/path/to/gateway/index.js';

const agent = new MyAgent();
await agent.initialize();
```

## Architecture Details

### MCP Client Connection

Internal agents connect to GAFF Gateway via **stdio**:

```
[Agent Process] ↔ stdin/stdout ↔ [Gateway Process] ↔ [MCP Servers]
```

This provides:
- ✅ **Standard MCP Protocol** - Same as external connections
- ✅ **Process Isolation** - Each agent runs independently
- ✅ **Full Tool Access** - All 17+ GAFF tools available
- ✅ **Automatic Routing** - Gateway handles server routing

### Lifecycle

```typescript
// 1. Create agent
const agent = new MyAgent();

// 2. Initialize (connects to gateway)
await agent.initialize();

// 3. Execute agent logic
const result = await agent.execute(input);

// 4. Shutdown (disconnects)
await agent.shutdown();
```

## Best Practices

### 1. Always Initialize and Shutdown
```typescript
try {
  await agent.initialize();
  const result = await agent.execute(input);
  await agent.shutdown();
} catch (error) {
  console.error('Error:', error);
  await agent.shutdown(); // Clean up
}
```

### 2. Validate Input
```typescript
async execute(input: any): Promise<any> {
  this.validateInput(input); // Uses gaff.json schema
  // ... rest of logic
}
```

### 3. Use Helper Methods
```typescript
// Good - Use helpers
await this.memory_search('query');
await this.sandbox_execute('python', code);

// Also good - Direct MCP call
await this.mcp.call('memory_search_nodes', { query: 'query' });
```

### 4. Store Important State in Memory
```typescript
await this.memory_create([{
  name: `execution_${Date.now()}`,
  entityType: 'execution',
  observations: ['status: success', 'time: 5s']
}]);
```

### 5. Use Sequential Thinking for Complex Logic
```typescript
// Plan
await this.think('Planning approach...', 1, 5, true);

// Execute steps
await this.think('Step 1: Fetch data', 2, 5, true);
await this.think('Step 2: Transform', 3, 5, true);

// Conclude
await this.think('All steps complete', 5, 5, false);
```

## Troubleshooting

### Agent Can't Find Gateway

**Error:** "Failed to connect to GAFF Gateway"

**Solution:**
```bash
# Ensure gateway is built
cd ../mcp/gaff-gateway
npm install
npm run build

# Or set custom path
export GAFF_GATEWAY_PATH="/path/to/gateway/index.js"
```

### Agent Not Found in gaff.json

**Error:** "Agent MyAgent not found in gaff.json"

**Solution:**
1. Add agent definition to `gaff.json`
2. Ensure agent name matches exactly (case-sensitive)
3. Check `GAFF_CONFIG_PATH` points to correct file

### MCP Tool Call Timeout

**Error:** "Tool call timeout: memory_search_nodes"

**Solutions:**
- Check gateway is running and responsive
- Increase timeout (default: 30s)
- Check if underlying MCP server is installed
- Review gateway logs (stderr)

## Integration with GAFF Workflows

Internal agents can be used in GAFF workflows via the router:

```typescript
// In intent graph
{
  nodes: [
    {
      id: "analyze_data",
      agent: "DataAnalyzer",  // References gaff.json
      instructions: "Analyze the input data",
      tools: ["all_gaff_tools"], // Has access to all MCP tools
      input_schema: { ... },
      output_schema: { ... }
    }
  ]
}
```

The router will:
1. Find agent in `gaff.json`
2. Instantiate the agent class
3. Call `execute()` with node input
4. Pass output to next node

## License

MIT - See LICENSE file in repository root

## Author

Sean Poyner <sean.poyner@pm.me>

## Related Documentation

- [GAFF Main README](../README.md)
- [GAFF Gateway](../mcp/gaff-gateway/README.md)
- [gaff.json Schema](../schemas/gaff-config-schema.json)


# Complete Workflow Demo

This example demonstrates the **full GAFF pipeline** with an internal agent that uses all published MCP servers to process user queries end-to-end.

## 🎯 What This Demo Shows

```
User Query
    ↓
SimpleChatbotAgent (internal GAFF agent)
    ↓
agent-orchestration (npx agent-orchestration-mcp-server)
    ↓
Orchestration Card (stored in memory)
    ↓
intent-graph-generator (local MCP server)
    ↓
Intent Graph (stored in memory)
    ↓
router (npx router-mcp-server)
    ↓
Executed Workflow + Results
    ↓
Formatted Response to User
```

## 📦 Components Used

### Internal Agent
- **SimpleChatbotAgent** - User-friendly wrapper
- **WorkflowDemoAgent** - Full pipeline orchestrator

### Published MCP Servers (via npm)
- `agent-orchestration-mcp-server@1.0.0` - Query planning
- `router-mcp-server@1.0.0` - Workflow execution
- `@modelcontextprotocol/server-memory` - State persistence

### Local MCP Servers
- `intent-graph-generator` - Graph generation

## 🚀 Quick Start

### Option 1: Test Directly

```bash
cd gaff
npm install

# Build the example agents
cd agents
npm install
npm run build

# Run the test
cd ..
node examples/test-workflow-ui.js
```

### Option 2: Test with Open WebUI

```bash
# Terminal 1: Start GAFF with Open WebUI
cd gaff/ui
npm install
docker-compose up

# Open browser to http://localhost:3000
# Start chatting!
```

### Option 3: Test Standalone Agent

```bash
cd gaff/agents
npm run build

# Run the workflow demo
node build/examples/workflow-demo-agent.js

# Or run the chatbot
node build/examples/simple-chatbot-agent.js
```

## 📋 Example Interactions

### Query 1: Data Analysis
**User**: "Analyze customer satisfaction scores from last quarter"

**Agent Response**:
```
✅ I've successfully processed your request!

📋 Workflow Plan:
   • Identified 3 agent(s) to complete the task
   • Agents: data-fetcher, analyzer, report-generator

🔗 Execution Graph:
   • 3 task(s) planned
   • 2 dependency relationship(s)

⚙️  Execution Results:
   • Status: completed
   • Tasks executed: 3
   • Execution time: 1523ms

💾 Saved for Reference:
   • Execution ID: `exec_1759770780712_abc123`
   • All workflow data stored in memory
```

### Query 2: Report Generation
**User**: "Create a dashboard showing key performance metrics"

**Response**: Complete workflow execution with planning, graph generation, and results

### Query 3: Status Check
**User**: "Show me the status of execution exec_1759770780712_abc123"

**Response**: Detailed execution status from memory

## 🔧 How It Works

### 1. User Sends Query
User types a natural language request in Open WebUI

### 2. OpenAI Adapter Receives Request
`ui/openai-adapter.js` translates OpenAI API format to GAFF

### 3. Simple Chatbot Agent Processes
`SimpleChatbotAgent` coordinates the workflow:

```typescript
async chat(userMessage: string): Promise<string> {
  // Step 1: Generate orchestration card
  const orchestration = await agent-orchestration(userMessage);
  
  // Step 2: Create intent graph
  const graph = await intent-graph-generator(orchestration);
  
  // Step 3: Execute workflow
  const result = await router(graph);
  
  // Step 4: Store in memory
  await memory.store(result);
  
  // Step 5: Format response
  return formatResponse(result);
}
```

### 4. Memory Tracks Everything
All intermediate results stored:
- Orchestration cards
- Intent graphs
- Execution state
- Node results

### 5. Response Returned
Formatted, user-friendly response sent back through UI

## 📊 Memory Integration

Every step is persisted:

```javascript
Memory Keys:
{
  "orchestration": "orch_card_1759770780712_abc123",
  "graph": "intent_graph_1759770780712_def456",
  "execution": "exec_1759770780712_ghi789"
}
```

Query historical data:
```javascript
// Get workflow history
await memory.open_nodes(['workflow_*']);

// Get execution status
await router.get_execution_status('exec_...');

// Retrieve orchestration card
await memory.open_nodes(['orch_card_...']);
```

## 🎨 Customization

### Add Custom Response Formatting
Edit `SimpleChatbotAgent.formatResponse()`:

```typescript
private formatResponse(result: any): string {
  // Add your custom formatting
  return `Custom response for ${result.execution_result.status}`;
}
```

### Add New Workflow Steps
Edit `WorkflowDemoAgent.executeWorkflow()`:

```typescript
// Add quality check
const qualityResult = await this.qualityCheckClient!.callTool({
  name: 'check_quality',
  arguments: { execution_result: executionData }
});
```

### Customize UI Branding
Edit `ui/docker-compose.yml`:

```yaml
environment:
  - WEBUI_NAME=Your Company AI
  - WEBUI_DESCRIPTION=Your Custom Description
```

## 🐛 Troubleshooting

### Error: "Gateway not connected"
```bash
# Restart the OpenAI adapter
cd ui
npm run start
```

### Error: "MCP server not found"
```bash
# Install published packages
npx -y agent-orchestration-mcp-server
npx -y router-mcp-server
npx -y @modelcontextprotocol/server-memory
```

### Slow Responses
- Workflows can take 10-60 seconds for complex queries
- Check memory server is running
- Verify all MCP servers are connected

### Docker Issues
```bash
# Rebuild containers
cd ui
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 📈 Performance

Typical execution times:
- Simple query: 5-15 seconds
- Medium workflow: 15-30 seconds
- Complex workflow: 30-60 seconds

Components:
- Orchestration: ~3-5s
- Graph generation: ~2-4s
- Execution: ~5-30s (depends on complexity)
- Memory ops: ~1-2s

## 🎯 Next Steps

1. **Try custom queries** - Test with your own use cases
2. **Add more agents** - Define agents in `gaff.json`
3. **Customize responses** - Edit `SimpleChatbotAgent`
4. **Add features** - Integrate quality-check, safety-protocols
5. **Deploy** - Use Docker Compose for production

## 📚 Related Documentation

- [Agent Development](../agents/README.md)
- [Open WebUI Setup](../ui/QUICKSTART_OPEN_WEBUI.md)
- [Agent Orchestration](../mcp/agent-orchestration/README.md)
- [Router](../mcp/router/README.md)
- [Main README](../README.md)

## Author

Sean Poyner <sean.poyner@pm.me>

Part of [GAFF](https://github.com/seanpoyner/gaff) - Graphical Agentic Flow Framework



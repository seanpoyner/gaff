# GAFF + Open WebUI Setup Guide

Complete guide to connect GAFF to Open WebUI with both model chat AND MCP tools.

## 🚀 Quick Start

### 1. Start GAFF + Open WebUI

```powershell
cd ui
.\start-gaff-ui.ps1
```

This will:
- ✅ Start GAFF OpenAI Adapter on `http://localhost:3100`
- ✅ Start Open WebUI on `http://localhost:8080`
- ✅ Configure proper networking between containers

### 2. Configure Open WebUI

#### A. Add GAFF as a Model (for conversational chat)

1. Open http://localhost:8080
2. Go to **Settings** (top right)
3. Click **Connections** → **OpenAI** section
4. Click the **'+'** button
5. Add connection:
   - **API Base URL**: `http://host.docker.internal:3100/v1`
   - **API Key**: `dummy-key-not-used`
6. Click **Save**
7. Refresh the page

You should now see **`gaff-gateway`** in your model dropdown! 🎉

#### B. Enable MCP Tools (optional, for explicit tool usage)

1. In Open WebUI, go to **Settings** → **Tools**
2. Enable **"MCP Servers"** toggle
3. Add GAFF Gateway:
   ```json
   {
     "name": "gaff-gateway",
     "command": "node",
     "args": ["/path/to/gaff/mcp/gaff-gateway/build/index.js"],
     "env": {
       "GAFF_CONFIG_PATH": "/path/to/gaff/gaff.json"
     }
   }
   ```
4. Save and refresh

Now you'll have access to all GAFF MCP tools directly in the UI!

## 🎯 Test Queries

Once configured, select the **`gaff-gateway`** model and try these:

### Data Analysis
```
Analyze customer satisfaction scores from the last quarter and identify trends
```

### Report Generation
```
Create a quarterly sales report with key performance metrics
```

### Feedback Processing
```
Process customer feedback from support tickets and identify top 5 recurring issues
```

### Content Creation
```
Generate a product announcement for our new AI automation platform
```

## 📊 What Happens Behind the Scenes

When you send a message to GAFF:

1. **📋 Orchestration** (`agent-orchestration`)
   - Parses your natural language query
   - Identifies required agents from `gaff.json`
   - Creates structured orchestration card

2. **🔗 Graph Generation** (`intent-graph-generator`)
   - Converts orchestration card to executable DAG
   - Optimizes for parallel execution
   - Validates dependencies

3. **⚙️ Execution** (`router`)
   - Executes nodes in topological order
   - Handles parallel execution
   - Stores state in memory MCP server

4. **💾 Memory Management** (`@modelcontextprotocol/server-memory`)
   - Stores orchestration cards
   - Maintains execution state
   - Enables workflow resumption

## 🔧 Architecture

```
┌─────────────┐
│  Open WebUI │
└──────┬──────┘
       │
       │ HTTP (OpenAI-compatible)
       ▼
┌─────────────────────┐
│ GAFF OpenAI Adapter │ (localhost:3100)
│  ui/openai-adapter  │
└──────┬──────────────┘
       │
       │ MCP Protocol
       ▼
┌────────────────────────────────────┐
│        GAFF MCP Servers            │
├────────────────────────────────────┤
│ • agent-orchestration              │
│ • intent-graph-generator           │
│ • router                           │
│ • memory                           │
│ • tools                            │
│ • safety-protocols                 │
│ • quality-check                    │
└────────────────────────────────────┘
```

## 🛑 Stopping

Press **Ctrl+C** in the PowerShell window where `start-gaff-ui.ps1` is running.

Or manually:
```powershell
# Stop Open WebUI
docker stop open-webui
docker rm open-webui

# Stop adapter
Get-Job | Stop-Job
Get-Job | Remove-Job

# Or kill by port
Get-NetTCPConnection -LocalPort 3100 | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force 
}
```

## 🐛 Troubleshooting

### "Failed to fetch models"
- **Cause**: Open WebUI can't reach the adapter
- **Fix**: Make sure you used `http://host.docker.internal:3100/v1` (not `localhost`)

### "0 nodes generated"
- **Cause**: GAFF config not loaded
- **Fix**: Check that `GAFF_CONFIG_PATH` points to your `gaff.json`

### "Port 3100 already in use"
- **Cause**: Previous adapter still running
- **Fix**: Run the startup script again, it will auto-kill the old process

### Adapter crashes on startup
- **Cause**: Missing dependencies
- **Fix**: 
  ```powershell
  cd ui
  npm install
  ```

### Open WebUI shows "Service Unavailable"
- **Cause**: Container still starting up
- **Fix**: Wait 30-60 seconds on first startup for Open WebUI to initialize

## 🔑 Configuration

### Environment Variables

Set these before running `start-gaff-ui.ps1`:

```powershell
# GAFF Configuration
$env:GAFF_CONFIG_PATH = "/path/to/gaff/gaff.json"

# LLM Provider (optional, for use_configured_api mode)
$env:WRITER_API_KEY = "your-writer-api-key"
$env:OPENAI_API_KEY = "your-openai-api-key"
$env:ANTHROPIC_API_KEY = "your-anthropic-api-key"

# Azure OpenAI (optional)
$env:AZURE_OPENAI_API_KEY = "your-azure-key"
$env:AZURE_OPENAI_ENDPOINT = "https://your-resource.openai.azure.com"
$env:AZURE_OPENAI_DEPLOYMENT = "your-deployment-name"
```

### Customize Agents

Edit `gaff.json` to add/modify agents:

```json
{
  "agents": {
    "my-custom-agent": {
      "name": "My Custom Agent",
      "description": "Does amazing things",
      "capabilities": ["data-analysis", "reporting"],
      "type": "api",
      "config": {
        "endpoint": "https://api.example.com/agent"
      }
    }
  }
}
```

Then restart the adapter for changes to take effect.

## 📚 Learn More

- [GAFF Documentation](../README.md)
- [Agent Orchestration](../mcp/agent-orchestration/README.md)
- [Intent Graph Generator](../mcp/intent-graph-generator/README.md)
- [Router](../mcp/router/README.md)
- [Open WebUI Docs](https://docs.openwebui.com/)

---

**Author**: Sean Poyner <sean.poyner@pm.me>  
**License**: MIT



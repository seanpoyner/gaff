# WebUI + Example Agent Troubleshooting Guide

## Quick Diagnostic Checklist

Run through these checks in order:

### ✅ 1. Environment Check
```powershell
# Check Node.js version (needs 18+)
node --version

# Check if all MCP servers are built
cd C:\Users\seanp\projects\gaff
ls mcp\agent-orchestration\build\index.js
ls mcp\intent-graph-generator\build\index.js
ls mcp\router\build\index.js
ls mcp\gaff-gateway\build\index.js

# Check if agents are built
ls agents\examples\*.js
```

### ✅ 2. Install Dependencies
```powershell
# UI dependencies
cd ui
npm install

# Agent dependencies
cd ..\agents
npm install
npm run build
```

### ✅ 3. API Key Configuration
```powershell
# Check if WRITER_API_KEY is set
$env:WRITER_API_KEY
# Should output your API key (not empty)

# If empty, set it:
$env:WRITER_API_KEY = "your-key-here"
```

### ✅ 4. Test Individual Components

#### Test Intent Graph Generator
```powershell
cd C:\Users\seanp\projects\gaff\mcp\intent-graph-generator
node build\index.js
# Should start without errors (Ctrl+C to exit)
```

#### Test Agent Orchestration
```powershell
cd C:\Users\seanp\projects\gaff\mcp\agent-orchestration
node build\index.js
# Should start without errors (Ctrl+C to exit)
```

#### Test Router
```powershell
cd C:\Users\seanp\projects\gaff\mcp\router
node build\index.js
# Should start without errors (Ctrl+C to exit)
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module" errors

**Symptoms:**
```
Error: Cannot find module '../mcp/agent-orchestration/build/index.js'
```

**Solution:**
```powershell
# Rebuild all MCP servers
cd C:\Users\seanp\projects\gaff

# Agent Orchestration
cd mcp\agent-orchestration
npm install
npm run build

# Intent Graph Generator
cd ..\intent-graph-generator
npm install
npm run build

# Router
cd ..\router
npm install
npm run build

# GAFF Gateway
cd ..\gaff-gateway
npm install
npm run build
```

---

### Issue 2: "LLM_API_KEY Missing" errors

**Symptoms:**
```
Error: Missing LLM_API_KEY
Error: WRITER_API_KEY not found
```

**Solution:**
Set the environment variable in Windows (permanent):
1. Windows Settings → System → About → Advanced system settings
2. Environment Variables → System Variables → New
3. Variable name: `WRITER_API_KEY`
4. Variable value: `your-key-here`
5. Restart terminal/Cursor

Or set temporarily (session only):
```powershell
$env:WRITER_API_KEY = "your-key-here"
```

---

### Issue 3: "Port already in use" errors

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3100
```

**Solution:**
```powershell
# Find process using the port
netstat -ano | findstr :3100

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
$env:PORT = "3200"
node openai-adapter.js
```

---

### Issue 4: Example agent hangs or times out

**Symptoms:**
- Script runs but hangs at "Connecting to..."
- No error message, just waits indefinitely

**Possible Causes:**
1. MCP server not responding
2. Path issues (Windows vs Linux paths)
3. Missing dependencies

**Solution:**
```powershell
# Test MCP servers individually first
cd C:\Users\seanp\projects\gaff

# Test agent-orchestration
npx -y agent-orchestration-mcp-server
# Should see "MCP Server running" (Ctrl+C to exit)

# Test intent-graph-generator (local build)
node mcp\intent-graph-generator\build\index.js
# Should start (Ctrl+C to exit)

# Test router
npx -y router-mcp-server
# Should start (Ctrl+C to exit)
```

---

### Issue 5: "delegate_to_caller" mode not working

**Symptoms:**
```
mode: 'delegate_to_caller'
instructions: 'Use your own LLM to generate...'
```

**Explanation:**
This is NOT an error! `delegate_to_caller` means the orchestration server is asking the CALLING agent (you) to do the LLM generation, not doing it itself.

**Solution:**
The example agents already handle this! They:
1. Receive the prompts from orchestration
2. Call their own LLM (or use fallback logic)
3. Parse and validate the response

---

### Issue 6: Hardcoded paths in workflow-demo-agent

**Symptoms:**
```
Error: ENOENT: no such file or directory
args: ['C:/Users/seanp/projects/gaff/mcp/intent-graph-generator/build/index.js']
```

**Solution:**
The agent has a hardcoded path for intent-graph-generator. Update it:

```typescript
// In agents/examples/workflow-demo-agent.ts line 60
// Change from:
args: ['C:/Users/seanp/projects/gaff/mcp/intent-graph-generator/build/index.js'],

// To (use npx):
command: 'npx',
args: ['-y', 'intent-graph-mcp-server'],
```

Then rebuild:
```powershell
cd agents
npm run build
```

---

## Diagnostic Scripts

### Test Script 1: Check All Dependencies
```powershell
# Save as: ui/test-dependencies.ps1

Write-Host "`n=== GAFF WebUI Dependency Check ===" -ForegroundColor Cyan

# Check Node.js
$nodeVersion = node --version
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm --version
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green

# Check if UI dependencies are installed
if (Test-Path "ui\node_modules") {
    Write-Host "✓ UI dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ UI dependencies NOT installed - run 'cd ui; npm install'" -ForegroundColor Red
}

# Check if agent dependencies are installed
if (Test-Path "agents\node_modules") {
    Write-Host "✓ Agent dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Agent dependencies NOT installed - run 'cd agents; npm install'" -ForegroundColor Red
}

# Check if MCP servers are built
$mcpServers = @(
    "mcp\agent-orchestration\build\index.js",
    "mcp\intent-graph-generator\build\index.js",
    "mcp\router\build\index.js"
)

foreach ($server in $mcpServers) {
    if (Test-Path $server) {
        Write-Host "✓ $server built" -ForegroundColor Green
    } else {
        Write-Host "✗ $server NOT built" -ForegroundColor Red
    }
}

# Check API key
if ($env:WRITER_API_KEY) {
    Write-Host "✓ WRITER_API_KEY is set" -ForegroundColor Green
} else {
    Write-Host "✗ WRITER_API_KEY NOT set" -ForegroundColor Yellow
}

Write-Host "`nDone!`n" -ForegroundColor Cyan
```

### Test Script 2: Quick Start Test
```javascript
// Save as: ui/test-quick-start.js

import { SimpleChatbotAgent } from '../agents/examples/simple-chatbot-agent.js';

async function test() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Quick Start Test - Simple Chatbot Agent');
  console.log('='.repeat(60) + '\n');

  const agent = new SimpleChatbotAgent();

  try {
    console.log('Step 1: Initializing agent...');
    await agent.initialize();
    console.log('✅ Agent initialized\n');

    console.log('Step 2: Sending test message...');
    const response = await agent.chat('Hello, test message');
    console.log('✅ Response received:\n');
    console.log(response);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await agent.cleanup();
  }
}

test();
```

Run it:
```powershell
cd ui
node test-quick-start.js
```

---

## Testing the WebUI

### Option 1: Test OpenAI Adapter Directly
```powershell
cd ui
npm start
# Should see: "🌐 GAFF OpenAI Adapter running on http://localhost:3100"

# In another terminal, test the API:
curl http://localhost:3100/health
# Should return: {"status":"ok","gaff":"connected"}

curl http://localhost:3100/v1/models
# Should list available models
```

### Option 2: Test with Open WebUI (Docker)
```powershell
cd ui
docker-compose up -d

# Check logs
docker-compose logs -f

# Open browser
start http://localhost:3000
```

---

## Getting More Detailed Error Info

Add debug logging to the adapter:
```javascript
// In openai-adapter.js, add at the top:
process.env.DEBUG = 'mcp:*';
```

Or run with debug flag:
```powershell
$env:DEBUG = "mcp:*"
node openai-adapter.js
```

---

## Still Having Issues?

Please provide:
1. **Exact error message** (copy/paste from terminal)
2. **What command you ran** (e.g., `node openai-adapter.js`)
3. **Which agent you're testing** (simple-chatbot-agent, workflow-demo-agent, etc.)
4. **Output of dependency check**:
   ```powershell
   node --version
   npm --version
   ls mcp\agent-orchestration\build\index.js
   $env:WRITER_API_KEY
   ```

---

## Known Working Configuration

This setup is confirmed working:
- **OS:** Windows 10
- **Node.js:** v22.16.0
- **npm:** 10.8.x
- **Environment:** WRITER_API_KEY set in Windows system environment
- **IDE:** Cursor
- **Working from:** `C:\Users\seanp\projects\gaff`

If your setup matches this and it's still not working, there may be a code issue we need to debug together!

# IntentGraph MCP Server - Troubleshooting Guide

## Issue: Claude Desktop Tool Call Fails with Orchestration Card Error

### Symptoms
- The `intent-graph` tools appear in Claude Desktop
- When Claude tries to use `generate_intent_graph`, it encounters an error
- Error message indicates issues with providing/parsing the orchestration card

### Root Cause Analysis

Based on the error pattern, the issue is likely that **Claude Desktop is having difficulty structuring the orchestration card parameter correctly**. This is a common issue with complex nested object parameters in MCP tools.

### Solutions (Try in Order)

---

## Solution 1: Use the Simplified Test Card ✅ RECOMMENDED

Instead of asking Claude to generate an orchestration card, provide it explicitly:

**Step 1:** Copy this minimal orchestration card:

```json
{
  "user_request": {
    "description": "Process a customer support ticket with classification, priority assignment, expert routing, and response generation"
  },
  "available_agents": [
    {
      "name": "TicketClassifier",
      "type": "llm",
      "capabilities": ["classify_ticket", "extract_intent"],
      "input_schema": { "ticket": { "type": "object" } },
      "output_schema": { "category": { "type": "string" }, "priority": { "type": "string" } }
    },
    {
      "name": "PriorityAssigner",
      "type": "validator",
      "capabilities": ["assign_priority"],
      "input_schema": { "category": { "type": "string" } },
      "output_schema": { "priority": { "type": "string" } }
    },
    {
      "name": "ExpertRouter",
      "type": "router",
      "capabilities": ["route_to_expert"],
      "input_schema": { "category": { "type": "string" }, "priority": { "type": "string" } },
      "output_schema": { "assigned_expert": { "type": "string" } }
    },
    {
      "name": "ResponseGenerator",
      "type": "llm",
      "capabilities": ["generate_response"],
      "input_schema": { "ticket": { "type": "object" }, "expert": { "type": "string" } },
      "output_schema": { "response": { "type": "string" } }
    }
  ]
}
```

**Step 2:** In Claude Desktop, say:

```
Use the generate_intent_graph tool with this orchestration card:
[paste the JSON above]
```

---

## Solution 2: Check Writer API Key

The MCP server needs a valid Writer API key to generate intent graphs.

**Step 1:** Verify your API key is correct in `claude_desktop_config.json`:

```
C:\Users\seanp\AppData\Roaming\Claude\claude_desktop_config.json
```

**Step 2:** Test the API key manually:

```powershell
$apiKey = "QgHlXliVl8XxeqnEB9pix66cme6Rmufi"
$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}
$body = @{
    model = "palmyra-x5"
    messages = @(
        @{ role = "user"; content = "Hello" }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.writer.com/v1/chat/completions" -Method Post -Headers $headers -Body $body
```

If this fails, your API key may be invalid or expired.

---

## Solution 3: Simplify the Orchestration Card Further

Claude might be generating orchestration cards that are too complex. Try this ultra-minimal example:

**In Claude Desktop, say:**

```
Use the generate_intent_graph tool with this exact orchestration card:
{
  "user_request": {
    "description": "Classify a support ticket"
  },
  "available_agents": [
    {
      "name": "Classifier",
      "type": "llm",
      "capabilities": ["classify"],
      "input_schema": { "text": { "type": "string" } },
      "output_schema": { "category": { "type": "string" } }
    }
  ]
}
```

---

## Solution 4: Check for Parsing Issues

The error might be in how Claude Desktop serializes the orchestration card.

**Step 1:** Look for the intent-graph log file:

```powershell
Get-ChildItem "$env:APPDATA\Claude\logs" -Filter "*intent-graph*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50
```

**Step 2:** Look for errors like:
- `Missing required field`
- `Invalid JSON`
- `Validation failed`
- `HTTP 401` or `HTTP 403` (API key issues)
- `HTTP 429` (rate limiting)

---

## Solution 5: Use the Test File Directly

**Step 1:** The project includes a pre-made test file: `test-simple.json`

**Step 2:** In Claude Desktop:

```
Read the file C:\Users\seanp\projects\IntentGraphGen\test-simple.json and use its contents as the orchestration_card parameter for the generate_intent_graph tool.
```

---

## Solution 6: Restart Everything

Sometimes MCP servers get into a bad state.

**Step 1:** Completely quit Claude Desktop (check Task Manager - no `claude.exe` processes)

**Step 2:** Restart Claude Desktop

**Step 3:** Wait 10 seconds for MCP servers to initialize

**Step 4:** Try again with Solution 1

---

## Solution 7: Check for Schema Validation Issues

The MCP server expects specific fields in the orchestration card.

**Required fields:**
- `user_request` (object)
  - `description` (string) ✅ REQUIRED
- `available_agents` (array) ✅ REQUIRED
  - Each agent must have:
    - `name` (string)
    - `type` (string)
    - `capabilities` (array of strings)
    - `input_schema` (object)
    - `output_schema` (object)

**Example of a VALID minimal agent:**

```json
{
  "name": "MyAgent",
  "type": "llm",
  "capabilities": ["do_something"],
  "input_schema": { "input": { "type": "string" } },
  "output_schema": { "output": { "type": "string" } }
}
```

---

## Solution 8: Test Locally First

Before using in Claude Desktop, test the MCP server locally to isolate the issue.

**Step 1:** Set environment variables:

```powershell
$env:LLM_API_KEY = "QgHlXliVl8XxeqnEB9pix66cme6Rmufi"
$env:LLM_MODEL = "palmyra-x5"
$env:LLM_BASE_URL = "https://api.writer.com"
```

**Step 2:** Run the test script:

```powershell
npm test
```

This will show if the issue is with the MCP server itself or with Claude Desktop's integration.

---

## Solution 9: Enable Debug Logging

Add more detailed logging to diagnose the issue.

**Step 1:** Edit `src/index.ts` and add this after line 177:

```typescript
console.error('[MCP Server] Arguments received:', JSON.stringify(args, null, 2));
```

**Step 2:** Rebuild:

```powershell
npm run build
```

**Step 3:** Restart Claude Desktop

**Step 4:** Check logs for the full orchestration card that Claude is sending

---

## Solution 10: Try a Different Approach

Instead of having Claude generate the orchestration card dynamically, use one of the examples:

**Step 1:** Use the e-commerce example:

```
Use the generate_intent_graph tool with the orchestration card from: 
C:\Users\seanp\projects\IntentGraphGen\examples\orchestration-cards\ecommerce-order-processing.json
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing LLM_API_KEY" | API key not in config | Update `claude_desktop_config.json` |
| "HTTP 401: Unauthorized" | Invalid API key | Check API key validity |
| "Failed to parse model JSON" | LLM returned invalid JSON | Check model compatibility (use `palmyra-x5`) |
| "Missing required field" | Orchestration card incomplete | Use Solution 1 (full minimal example) |
| "Tool not found" | MCP server not loaded | Restart Claude Desktop |

---

## Diagnostic Commands

Run these to gather information:

```powershell
# Check configuration
.\Diagnose-MCP.ps1

# View recent logs
.\Diagnose-MCP.ps1 -ShowLogs

# Test API connectivity
$headers = @{ 'Authorization' = "Bearer $env:LLM_API_KEY" }
Invoke-RestMethod -Uri "https://api.writer.com/v1/models" -Headers $headers

# Check if MCP server process is running (when Claude Desktop is open)
Get-Process | Where-Object { $_.CommandLine -like "*intent-graph*" }
```

---

## Still Having Issues?

1. **Check the README**: `README.md` has complete setup instructions
2. **Run diagnostics**: `.\Diagnose-MCP.ps1 -ShowLogs`
3. **Check logs**: `$env:APPDATA\Claude\logs\mcp-server-intent-graph.log`
4. **Test locally**: `npm test` to verify the server works outside Claude Desktop
5. **Simplify**: Use the ultra-minimal example in Solution 3

---

## Quick Reference: Working Example

This is a COMPLETE working example you can copy-paste into Claude Desktop:

```
Please use the generate_intent_graph tool with this orchestration card:

{
  "user_request": {
    "description": "Handle a customer support ticket by classifying it and generating a response"
  },
  "available_agents": [
    {
      "name": "TicketClassifier",
      "type": "llm",
      "capabilities": ["classify_ticket"],
      "input_schema": { "ticket_text": { "type": "string" } },
      "output_schema": { "category": { "type": "string" } }
    },
    {
      "name": "ResponseGenerator",
      "type": "llm",
      "capabilities": ["generate_response"],
      "input_schema": { "category": { "type": "string" }, "ticket_text": { "type": "string" } },
      "output_schema": { "response_text": { "type": "string" } }
    }
  ]
}
```

Expected result: Claude should successfully generate an intent graph with nodes and edges showing the workflow.



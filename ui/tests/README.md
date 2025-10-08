# GAFF WebUI Test Scripts

Internal test scripts for development and debugging.

## Test Files

### test-simple.js
Basic HTTP test of the OpenAI adapter endpoint. Sends a single request and displays the response.

**Usage:**
```bash
# Start the adapter first
node openai-adapter.js

# In another terminal
node tests/test-simple.js
```

### test-adapter.js
Comprehensive integration test that:
- Starts the OpenAI adapter automatically
- Runs multiple test queries
- Verifies all workflow steps
- Tests memory integration
- Cleans up after completion

**Usage:**
```bash
node tests/test-adapter.js
```

### test-router-direct.js
Direct test of the Router MCP server. Bypasses orchestration and intent graph generation to test workflow execution in isolation.

**Usage:**
```bash
node tests/test-router-direct.js
```

### test-intent-graph.js
Direct test of the Intent Graph Generator MCP server. Tests graph generation from orchestration cards.

**Usage:**
```bash
node tests/test-intent-graph.js
```

## User-Friendly Tests (In ui/ Root)

### test-quick-start.js
Simple, user-friendly test using the SimpleChatbotAgent. Best for verifying your setup works.

**Usage:**
```bash
cd ui
node test-quick-start.js
```

### test-dependencies.ps1
PowerShell script that checks all dependencies and configuration.

**Usage:**
```powershell
cd ui
.\test-dependencies.ps1
```

## Recommended Testing Sequence

1. **Check Dependencies:**
   ```powershell
   .\test-dependencies.ps1
   ```

2. **Quick Functional Test:**
   ```bash
   node test-quick-start.js
   ```

3. **Full Integration Test:**
   ```bash
   node tests/test-adapter.js
   ```

4. **Manual Testing with Open WebUI:**
   ```bash
   node openai-adapter.js
   # Then use Open WebUI
   ```

## Debugging Individual Components

If you encounter issues, test components individually:

```bash
# Test router only
node tests/test-router-direct.js

# Test intent graph generator only
node tests/test-intent-graph.js

# Test basic HTTP endpoint
node tests/test-simple.js
```

## Environment Variables

All tests respect these environment variables:
- `WRITER_API_KEY` - Required for LLM operations
- `GAFF_ROOT` - Path to GAFF project root (auto-detected)
- `PORT` - HTTP server port (default: 3100)

## Notes

- All tests require MCP servers to be built (`npm run build` in each mcp/ folder)
- Tests create temporary background processes - they clean up automatically
- Some tests may take 60-90 seconds for complex multi-agent workflows
- Tests use mock data when actual APIs aren't available

# Quick Start Guide - Agent Orchestration MCP Server

## 5-Minute Local Test

### Step 1: Setup

```bash
# Navigate to the directory
cd mcp/agent-orchestration

# Install dependencies
npm install

# Build
npm run build
```

### Step 2: Configure Environment

```bash
# Set your LLM API key (choose one)
export WRITER_API_KEY=your-writer-api-key
# OR
export OPENAI_API_KEY=your-openai-key
# OR
export ANTHROPIC_API_KEY=your-anthropic-key

# Set the sample config
export GAFF_CONFIG_PATH=$(pwd)/examples/sample-gaff.json
```

### Step 3: Test with MCP Inspector

```bash
# In one terminal, start the inspector
npx @modelcontextprotocol/inspector node build/index.js
```

The inspector will open at `http://localhost:5173`

### Step 4: Try a Query

In the MCP Inspector web interface, call the `generate_orchestration_card` tool:

```json
{
  "query": "Process customer orders by validating the data, sending confirmation emails, and storing the order in the database"
}
```

**Expected Result:**
You should get an orchestration card with:
- `DataValidator` agent (for validation)
- `NotificationService` agent (for emails)
- `DatabaseWriter` agent (for storage)

### Step 5: Test with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-orchestration-dev": {
      "command": "node",
      "args": ["/absolute/path/to/gaff/mcp/agent-orchestration/build/index.js"],
      "env": {
        "WRITER_API_KEY": "your-key",
        "GAFF_CONFIG_PATH": "/absolute/path/to/gaff/mcp/agent-orchestration/examples/sample-gaff.json"
      }
    }
  }
}
```

Restart Claude Desktop and try asking:
> "Use agent-orchestration to generate an orchestration card for processing customer feedback and storing results"

## Other Test Queries

Try these in the MCP Inspector or Claude:

1. **Simple workflow:**
   ```
   Validate data and send a notification
   ```

2. **Data processing:**
   ```
   Transform raw data, validate it, and store in database
   ```

3. **Sentiment analysis:**
   ```
   Analyze customer feedback sentiment and notify the team with results
   ```

4. **Complex workflow:**
   ```
   Analyze text sentiment, validate the results are confident, process the data, store it, and send email notifications
   ```

## Verify Tools Available

Call `list_agents` to see all available agents:

```json
{
  "capability_filter": ["data-processing"]
}
```

Call `get_agent_capabilities` for details:

```json
{
  "agent_name": "DataValidator"
}
```

## Troubleshooting

### "Could not load GAFF configuration"

```bash
# Make sure GAFF_CONFIG_PATH is set and file exists
echo $GAFF_CONFIG_PATH
ls -la $GAFF_CONFIG_PATH
```

### "API key not configured"

```bash
# Check your API key is set
echo $WRITER_API_KEY
# Or whichever provider you're using
```

### "LLM did not return valid JSON"

- Check your API key is valid
- Try a different/more capable model
- Ensure you have API credits/quota remaining

## Next Steps

Once local testing works:

1. **Publish to npm:**
   ```bash
   npm publish
   ```

2. **Use globally:**
   ```bash
   npm install -g agent-orchestration-mcp-server
   npx agent-orchestration-mcp-server
   ```

3. **Integrate with GAFF:**
   Configure the GAFF Gateway to route to this server

4. **Build workflows:**
   Use the orchestration cards with intent-graph-generator and router


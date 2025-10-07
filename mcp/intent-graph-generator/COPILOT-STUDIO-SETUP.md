# Copilot Studio Integration Guide

## 🎯 **IntentGraph MCP Server for Copilot Studio**

This guide shows you how to integrate the IntentGraph MCP Server with Microsoft Copilot Studio using the **Streamable transport** (HTTP).

---

## **Step 1: Deploy the HTTP Server**

### **Option A: Local Testing (Development)**

```powershell
# Set environment variables
$env:LLM_API_KEY="your-writer-api-key"
$env:LLM_MODEL="palmyra-x5"
$env:LLM_BASE_URL="https://api.writer.com"
$env:PORT=3000

# Start the HTTP server
npm run start:http
```

Server will be available at: `http://localhost:3000`

### **Option B: Deploy to Azure (Production)**

1. **Create Azure Web App**:
   ```bash
   az webapp create --resource-group myResourceGroup \
     --plan myAppServicePlan \
     --name intent-graph-server \
     --runtime "NODE|18-lts"
   ```

2. **Configure Environment Variables** in Azure Portal:
   - `LLM_API_KEY`: Your Writer API key
   - `LLM_MODEL`: `palmyra-x5`
   - `LLM_BASE_URL`: `https://api.writer.com`
   - `PORT`: `8080`

3. **Deploy**:
   ```bash
   cd intent-graph-generator
   zip -r deploy.zip .
   az webapp deployment source config-zip \
     --resource-group myResourceGroup \
     --name intent-graph-server \
     --src deploy.zip
   ```

4. **Your server will be at**: `https://intent-graph-server.azurewebsites.net`

---

## **Step 2: Test the Server**

### **Health Check**:
```bash
curl https://your-server-url.com/health
```

**Response**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "server": "IntentGraph MCP Server",
  "transport": "streamable",
  "tools": 7
}
```

### **Test MCP Endpoint**:
```powershell
$body = @{
  jsonrpc = "2.0"
  id = "1"
  method = "tools/list"
  params = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/mcp" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## **Step 3: Add to Copilot Studio**

### **3.1 Open Copilot Studio**

1. Go to https://copilotstudio.microsoft.com
2. Select your Copilot
3. Navigate to **Tools** → **Add a tool** → **New tool**
4. Select **Model Context Protocol**

### **3.2 Fill in the Form**

| Field | Value |
|-------|-------|
| **Server name** | `intent-graph-generator` |
| **Server description** | `Generates AI-powered intent graphs for orchestrating multi-agent workflows. Takes user requests and available agents, returns complete workflow graphs with nodes, edges, and execution plans.` |
| **Server URL** | `https://your-server-url.com/mcp` (or `http://localhost:3000/mcp` for testing) |
| **Authentication** | Select based on your setup (see below) |

### **3.3 Authentication Options**

#### **Option 1: No Authentication** (for testing)
- Select "No authentication"
- Use for local development only

#### **Option 2: API Key** (recommended for production)
- Select "API key"
- Generate an API key for your server
- Add authentication middleware to your server (see below)

#### **Option 3: OAuth 2.0** (enterprise)
- Select "OAuth 2.0"
- Configure OAuth provider
- Provide credentials

---

## **Step 4: Use in Your Copilot**

### **4.1 Create a Topic**

**Topic Name**: "Generate Workflow"

**Trigger Phrases**:
- "Create a workflow for..."
- "Design a process to..."
- "Orchestrate agents to..."

### **4.2 Build the Dialog Flow**

```yaml
1. Ask Question:
   "What would you like to accomplish?"
   Save to: Topic.UserRequest

2. Call Action: generate_intent_graph
   Input:
     orchestration_card:
       user_request:
         description: ${Topic.UserRequest}
       available_agents:
         - name: "OrderValidator"
           type: "validator"
           capabilities: ["validate_order"]
           input_schema: {"order": {"type": "object"}}
           output_schema: {"valid": {"type": "boolean"}}
         - name: "PaymentProcessor"
           type: "api"
           capabilities: ["process_payment"]
           input_schema: {"amount": {"type": "number"}}
           output_schema: {"transaction_id": {"type": "string"}}
       constraints:
         timeout_ms: 5000
         max_parallel_nodes: 3
       preferences:
         optimize_for: "speed"
         parallelization: "aggressive"
     options:
       validate: true
       optimize: true
       include_artifacts: true
   
   Save to: Topic.GeneratedGraph

3. Show Message:
   "I've created a workflow with ${Topic.GeneratedGraph.intent_graph.nodes.length} steps:
   
   ${Topic.GeneratedGraph.artifacts.reasoning}
   
   Would you like me to execute it?"
```

---

## **Step 5: OpenAPI Schema (Alternative Method)**

If you prefer to use a custom connector in Power Apps:

1. Download: `copilot-studio-schema.yaml`
2. **Update the `host` field** with your server URL
3. In Copilot Studio: **Tools** → **New tool** → **Custom connector**
4. Select **Import OpenAPI file**
5. Upload `copilot-studio-schema.yaml`
6. Complete the setup in Power Apps

---

## **Available Tools**

The server exposes 7 MCP tools:

| Tool | Description |
|------|-------------|
| `generate_intent_graph` | Generate complete intent graph from orchestration card (AI-powered) |
| `validate_graph` | Validate graph structure and return detailed report |
| `analyze_graph` | Analyze complexity, find parallel opportunities, calculate critical path |
| `optimize_graph` | Apply AI-driven optimization strategies |
| `export_graph` | Export in JSON, YAML, DOT, or Mermaid format |
| `visualize_graph` | Generate Mermaid diagram for visualization |
| `generate_artifacts` | Create debugging artifacts (reasoning, alternatives, optimizations) |

---

## **Example: Full Orchestration Card**

```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Process customer order with payment and email confirmation",
      "domain": "ecommerce",
      "success_criteria": [
        "Complete within 5 seconds",
        "Handle payment failures gracefully",
        "Send confirmation email"
      ]
    },
    "available_agents": [
      {
        "name": "OrderValidator",
        "type": "validator",
        "capabilities": ["validate_order", "check_inventory"],
        "input_schema": {
          "order": { "type": "object" },
          "customer_id": { "type": "string" }
        },
        "output_schema": {
          "valid": { "type": "boolean" },
          "errors": { "type": "array" }
        },
        "estimated_latency_ms": 200
      },
      {
        "name": "PaymentProcessor",
        "type": "api",
        "capabilities": ["process_payment", "refund"],
        "input_schema": {
          "amount": { "type": "number" },
          "payment_method": { "type": "string" }
        },
        "output_schema": {
          "transaction_id": { "type": "string" },
          "status": { "type": "string" }
        },
        "estimated_latency_ms": 1500
      },
      {
        "name": "EmailService",
        "type": "notification",
        "capabilities": ["send_email"],
        "input_schema": {
          "to": { "type": "string" },
          "template": { "type": "string" },
          "data": { "type": "object" }
        },
        "output_schema": {
          "sent": { "type": "boolean" },
          "message_id": { "type": "string" }
        },
        "estimated_latency_ms": 300
      }
    ],
    "constraints": {
      "timeout_ms": 5000,
      "max_parallel_nodes": 3,
      "max_iterations": 5,
      "error_handling_strategy": "retry_with_fallback"
    },
    "preferences": {
      "optimize_for": "speed",
      "parallelization": "aggressive",
      "logging_level": "normal"
    }
  },
  "options": {
    "validate": true,
    "optimize": true,
    "include_artifacts": true,
    "format": "json"
  }
}
```

**Response** will include:
- `intent_graph`: Complete workflow with nodes, edges, execution plan
- `metadata`: Generation timestamp, model used, complexity score
- `artifacts`: AI reasoning, alternative approaches, applied optimizations
- `validation`: Validation results if requested

---

## **Troubleshooting**

### **Server won't start**:
- Check environment variables are set
- Verify port 3000 (or PORT env var) is available
- Check LLM_API_KEY is valid

### **Copilot Studio can't connect**:
- Verify Server URL is correct (include /mcp endpoint)
- Check CORS headers are enabled
- Test with curl/Postman first
- For local testing, use ngrok or similar tunnel

### **Empty responses**:
- Check server logs for errors
- Verify orchestration card structure
- Test with simplified orchestration card

---

## **Production Deployment Checklist**

- [ ] Deploy to cloud (Azure, AWS, GCP)
- [ ] Add API key authentication
- [ ] Configure HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set appropriate CORS origins
- [ ] Add health check monitoring
- [ ] Configure auto-scaling
- [ ] Set up backup LLM provider (optional)

---

## **Resources**

- **Full Documentation**: https://github.com/seanpoyner/intent-graph-generator
- **npm Package**: https://www.npmjs.com/package/intent-graph-mcp-server
- **Schema**: `/schemas/orchestration-card-schema.json`
- **Examples**: `/examples/orchestration-cards/`

---

**Need help?** Contact: sean.poyner@pm.me


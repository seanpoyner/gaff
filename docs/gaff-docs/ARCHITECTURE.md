# GAFF Architecture Documentation

**Version:** 1.0.0  
**Author:** Sean Poyner  
**Last Updated:** October 6, 2025

---

## System Overview

The **Graphical Agentic Flow Framework (GAFF)** is a comprehensive orchestration system that enables AI agents to automatically generate and execute complex multi-agent workflows from natural language queries. The framework includes **quality assurance**, **safety protocols**, and **essential utility tools** including **human-in-the-loop** capabilities.

### Core Components

GAFF consists of 6 primary components:

1. **agent-orchestration** - Converts natural language to orchestration cards
2. **safety-protocols** - Enforces guardrails and compliance
3. **intent-graph-generator** - Generates executable intent graphs (Published: v2.2.3)
4. **router** - Executes graphs and routes to agents
5. **QualityChecker** - Validates results and triggers reruns
6. **tools** - Essential utilities including human-in-the-loop (HITL)

### Multi-Tier Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         TIER 1: INPUT LAYER                       │
│                   agent-orchestration MCP Server                  │
│                                                                   │
│  Purpose: Natural Language → Orchestration Card                   │
│                                                                   │
│  Input:  Natural language query + gaff.json context              │
│  Output: Structured orchestration card                            │
│                                                                   │
│  Responsibilities:                                                │
│  • Parse and understand user intent                               │
│  • Extract agents from gaff.json                                  │
│  • Identify constraints and requirements                          │
│  • Generate structured orchestration card                         │
│  • Store card in memory MCP (optional)                            │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ Orchestration Card (JSON)
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      TIER 2: GENERATION LAYER                     │
│                 intent-graph-generator MCP Server                 │
│                                                                   │
│  Purpose: Orchestration Card → Intent Graph                       │
│                                                                   │
│  Input:  Orchestration card                                       │
│  Output: Executable intent graph (DAG)                            │
│                                                                   │
│  Responsibilities:                                                │
│  • Generate complete workflow graph using LLM                     │
│  • Validate graph structure (DAG, connectivity)                   │
│  • Analyze complexity and optimization opportunities              │
│  • Apply optimizations (parallelization, cost reduction)          │
│  • Export in multiple formats (JSON, YAML, Mermaid)               │
│  • Generate execution artifacts                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ Intent Graph (DAG)
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     TIER 3: EXECUTION LAYER                       │
│                      router MCP Server                            │
│                                                                   │
│  Purpose: Intent Graph → Execution Results                        │
│                                                                   │
│  Input:  Intent graph                                             │
│  Output: Execution results, state, logs                           │
│                                                                   │
│  Responsibilities:                                                │
│  • Execute graph nodes in correct order                           │
│  • Route requests to appropriate agents                           │
│  • Manage parallel execution                                      │
│  • Handle conditional branching                                   │
│  • Manage execution state and retries                             │
│  • Aggregate results from multiple agents                         │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Complete Request Flow

```
1. User Query (Natural Language)
   ↓
2. Primary Agent receives query
   ↓
3. agent-orchestration.generate_orchestration_card()
   • Reads gaff.json
   • Understands user intent
   • Identifies required agents
   • Structures as orchestration card
   ↓
4. Orchestration Card (JSON)
   {
     "user_request": "Process guest room service request",
     "available_agents": [...],
     "constraints": {...},
     "context": {...}
   }
   ↓
5. intent-graph-generator.generate_intent_graph()
   • LLM generates complete workflow
   • Creates nodes for each agent
   • Defines edges (sequential, parallel, conditional)
   • Validates structure
   • Optimizes for performance
   ↓
6. Intent Graph (DAG)
   {
     "graph_id": "graph_001",
     "nodes": [...],
     "edges": [...],
     "execution_plan": {...}
   }
   ↓
7. router.execute_graph()
   • Executes nodes in topological order
   • Handles parallel execution
   • Manages conditional branches
   • Routes to actual agents
   • Aggregates results
   ↓
8. Execution Results
   {
     "success": true,
     "results": {...},
     "execution_time_ms": 2500
   }
```

---

## Component Details

### 1. agent-orchestration MCP Server

**Purpose:** Convert natural language queries into structured orchestration cards.

#### Tools

1. **`generate_orchestration_card`**
   ```typescript
   Input: {
     query: string,                    // Natural language query
     gaff_config: GaffConfig,          // gaff.json content
     primary_agent_context?: string,   // Optional conversation context
     store_in_memory?: boolean         // Store in memory MCP
   }
   
   Output: {
     orchestration_card: OrchestrationCard,
     confidence: number,
     identified_agents: string[],
     estimated_complexity: "low" | "medium" | "high"
   }
   ```

2. **`validate_orchestration_card`**
   - Validates card structure against schema
   - Checks agent availability
   - Verifies constraint feasibility

3. **`list_agents`**
   - Returns all agents from gaff.json
   - Filtered by capability if specified

4. **`get_agent_capabilities`**
   - Returns detailed agent information
   - Input/output schemas
   - Constraints and timeouts

5. **`store_card`**
   - Stores orchestration card in memory MCP
   - Associates with session/conversation ID

#### LLM Usage

- Uses primary LLM (Writer Palmyra) for NL understanding
- Extracts: intent, entities, required capabilities
- Maps to available agents
- Generates structured orchestration card

---

### 2. intent-graph-generator MCP Server

**Purpose:** Convert orchestration cards into executable intent graphs.

**Status:** ✅ **Already built and published**

**npm:** `intent-graph-mcp-server@2.2.3`  
**GitHub:** https://github.com/seanpoyner/intent-graph-generator

#### Tools (7 comprehensive tools)

1. **`generate_intent_graph`** - AI-powered graph generation
2. **`validate_graph`** - Comprehensive validation
3. **`analyze_graph`** - Complexity and optimization analysis
4. **`optimize_graph`** - Apply optimizations
5. **`export_graph`** - Export in multiple formats
6. **`visualize_graph`** - Generate Mermaid diagrams
7. **`generate_artifacts`** - Debugging artifacts

#### LLM Usage

- Uses configured LLM to generate graph structure
- Understands agent capabilities
- Designs optimal workflow
- Handles parallelization, conditionals, error handling

---

### 3. router MCP Server

**Purpose:** Execute intent graphs by routing to actual agents.

#### Tools

1. **`execute_graph`**
   ```typescript
   Input: {
     graph: IntentGraph,
     execution_mode: "sync" | "async",
     context?: Record<string, any>
   }
   
   Output: {
     execution_id: string,
     status: "running" | "completed" | "failed",
     results: Record<string, any>,
     execution_time_ms: number,
     nodes_executed: number
   }
   ```

2. **`route_to_agent`**
   - Routes single request to specific agent
   - Handles authentication
   - Manages timeouts and retries

3. **`get_execution_status`**
   - Returns current status of async execution
   - Progress percentage
   - Partial results

4. **`pause_execution`** / **`resume_execution`**
   - Control execution flow
   - Useful for human-in-the-loop scenarios

5. **`cancel_execution`**
   - Cancels running execution
   - Cleans up resources

#### Execution Engine

- **Topological Sort:** Executes nodes in correct order
- **Parallel Execution:** Runs independent nodes concurrently
- **Conditional Branching:** Evaluates conditions, routes accordingly
- **Error Handling:** Retries, fallbacks, error recovery
- **State Management:** Tracks execution state, partial results
- **Result Aggregation:** Combines results from multiple nodes

---

### 4. safety-protocols MCP Server

**Purpose:** Enforce guardrails, compliance, and safety checks.

**Status:** Scaffolded, ready for implementation

#### Tools (6 tools)

1. **`validate_compliance`** - Check GDPR, CCPA, SOC2 compliance
2. **`check_guardrails`** - PII detection, content filtering, risk assessment
3. **`validate_input`** - Pre-execution input validation
4. **`validate_output`** - Post-execution output validation
5. **`enforce_rate_limits`** - Per-user, per-IP, per-endpoint limits
6. **`audit_log`** - Security audit logging

#### Key Features

- **PII Detection:** Automatically detect and mask personally identifiable information
- **Content Filtering:** Filter unsafe or inappropriate content
- **Compliance Validation:** Regulatory compliance checks (GDPR, CCPA, SOC2)
- **Rate Limiting:** Prevent abuse and ensure fair resource usage
- **Audit Trail:** Complete audit logs for compliance requirements

---

### 5. QualityChecker Agent

**Purpose:** Validate execution results and trigger automatic reruns.

**Status:** Integrated with router

#### Capabilities

- Result validation against quality criteria
- Quality scoring (0-1 scale, configurable threshold)
- Completeness and accuracy verification
- Automatic rerun triggering via router
- Adaptive rerun strategies (partial/full/adaptive)

#### How It Works

1. Router executes intent graph
2. QualityChecker validates the final result
3. If quality score < threshold (default 0.85), triggers rerun
4. Router re-executes failed nodes based on rerun strategy
5. Process repeats until acceptable quality or max attempts reached

---

### 6. tools MCP Server (GAFF Tools)

**Purpose:** Essential utility tools for the primary agent and all GAFF components.

**Status:** Scaffolded, ready for implementation

**Package:** `gaff-tools-mcp-server`

#### Tools (7 essential tools)

##### 🚨 1. `human_in_the_loop` (CRITICAL)

**Purpose:** Pause intent graph execution and request user confirmation/approval.

This is THE most important tool for production agentic systems. It enables:
- User approval for critical actions (deletions, transactions, policy changes)
- Confirmation before external API calls with side effects
- Review before data modifications
- Compliance with human oversight requirements

**Input:**
```typescript
{
  action_description: string,        // Clear description of what will happen
  action_type: "approval" | "confirmation" | "review" | "input",
  context: object,                   // Full context about the action
  approval_options: {
    type: "yes_no" | "multi_choice" | "text_input",
    choices?: string[],
    default?: string,
    timeout_seconds?: number,
    required_approvers?: string[]
  },
  node_id: string,                   // Intent graph node requesting approval
  execution_id: string               // Execution session ID
}
```

**Output:**
```typescript
{
  approved: boolean,
  user_response: string | object,
  approver_id: string,
  timestamp: string,
  execution_should_continue: boolean,
  modified_context?: object          // User can modify context
}
```

**Integration with Intent Graphs:**

To add human approval to any workflow step, insert a HITL node:

```json
{
  "nodes": [
    {
      "id": "node_2_hitl",
      "agent": "gaff-tools",
      "tool": "human_in_the_loop",
      "description": "Request user approval for data deletion",
      "input": {
        "action_description": "Deleting 150 customer records",
        "action_type": "approval",
        "approval_options": { "type": "yes_no", "timeout_seconds": 300 }
      },
      "dependencies": ["node_1"]
    }
  ],
  "edges": [
    { "from": "node_2_hitl", "to": "node_3", "condition": "approved" },
    { "from": "node_2_hitl", "to": "node_error", "condition": "!approved" }
  ]
}
```

**Router Implementation Requirements:**

The router must:
1. Detect `human_in_the_loop` tool calls
2. **Pause execution** and set status to `paused_for_approval`
3. **Notify user** via webhook, email, UI, or notification service
4. **Wait for user response** (polling, webhook, or event-driven)
5. **Resume execution** based on approval decision:
   - If approved → continue to `next_on_approve` node
   - If rejected → continue to `next_on_reject` node (usually error handler)

##### 2. `format_data`
Convert data between JSON, XML, YAML, CSV, text with formatting options.

##### 3. `translate_schema`
Translate data structures between different schemas using mapping rules.

##### 4. `lint_data`
Validate data against schemas (supports JSON, YAML, orchestration cards, intent graphs).

##### 5. `sanitize_data`
Clean and sanitize data (PII removal, HTML escaping, whitespace normalization).

##### 6. `convert_timestamp`
Convert timestamps between formats (ISO8601, Unix, human-readable) and timezones.

##### 7. `count_tokens`
Estimate token count for LLM processing and cost estimation.

#### Use Cases for Tools

| Tool | When to Use | Example |
|------|-------------|---------|
| `human_in_the_loop` | Any critical action requiring approval | Delete data, financial transaction, policy change |
| `format_data` | Converting between API formats | JSON → XML for legacy system |
| `translate_schema` | Mapping data structures | Transform CRM format → ERP format |
| `lint_data` | Validating before processing | Validate orchestration card before graph generation |
| `sanitize_data` | Cleaning untrusted input | Remove PII from logs, escape HTML in user content |
| `convert_timestamp` | Time format standardization | Unix → ISO8601 for API |
| `count_tokens` | LLM cost estimation | Estimate cost before expensive LLM call |

---

## gaff.json Schema

The central configuration file for the entire GAFF framework.

### Structure

```json
{
  "version": "1.0.0",
  "name": "string",
  "description": "string",
  
  "primary_agent": {
    "name": "string",
    "type": "copilot_studio | custom",
    "mcp_servers": ["agent-orchestration", "intent-graph-generator", "router"],
    "memory_enabled": boolean
  },
  
  "agents": {
    "AgentName": {
      "type": "validator | api | llm | transformer | router | aggregator",
      "description": "string",
      "capabilities": ["string[]"],
      "endpoint": "string (optional)",
      "model": "string (for LLM agents)",
      "authentication": "azure_ad | api_key | none",
      "timeout_ms": number,
      "retry_policy": {...},
      "input_schema": {...},
      "output_schema": {...}
    }
  },
  
  "models": {
    "primary_llm": {...},
    "fallback_llm": {...}
  },
  
  "protocols": {...},
  "schemas": {...},
  "context": {...},
  "constraints": {...},
  "instructions": {...}
}
```

### Agent Types

1. **validator** - Validates data, checks authorization
2. **api** - Calls external REST APIs
3. **llm** - Uses LLM for analysis, generation, classification
4. **transformer** - Transforms data between formats
5. **router** - Routes requests based on conditions
6. **aggregator** - Combines results from multiple sources

---

## Communication Protocols

### MCP (Model Context Protocol)

All three servers use MCP for tool exposure:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "generate_orchestration_card",
    "arguments": {...}
  }
}
```

### Transports

1. **stdio** - For local development (Cursor, Claude Desktop)
2. **HTTP** - For remote access (Copilot Studio, web apps)

### Memory Integration

Optional integration with MCP memory server:
- Stores orchestration cards
- Caches intent graphs
- Maintains conversation context
- Session management

---

## Security Architecture

### Authentication & Authorization

1. **Azure AD Integration**
   - Service principal authentication
   - Managed identities for Azure resources
   - Token-based API access

2. **API Key Management**
   - Keys stored in Azure Key Vault
   - Rotation policies
   - Environment-based keys

3. **RBAC**
   - Role-based access control for agents
   - Least privilege principle
   - Audit logging

### Data Protection

1. **Encryption**
   - TLS 1.2+ for all communication
   - Encrypted at rest in Azure Storage
   - Key management via Azure Key Vault

2. **PII Handling**
   - Mask PII in logs
   - Comply with GDPR, CCPA
   - Data residency requirements

3. **Rate Limiting**
   - Per-user rate limits
   - Per-endpoint rate limits
   - DDoS protection

---

## Scalability & Performance

### Horizontal Scaling

- **Stateless Design:** All servers are stateless
- **Load Balancing:** Azure Load Balancer for HTTP endpoints
- **Auto-scaling:** Azure Container Instances or AKS
- **Caching:** Redis for frequently accessed data

### Performance Optimization

1. **Parallel Execution**
   - Independent graph nodes run concurrently
   - Thread pool management
   - Async/await patterns

2. **Caching**
   - Cache orchestration cards (memory MCP)
   - Cache intent graphs
   - Cache agent responses (when appropriate)

3. **Connection Pooling**
   - Reuse HTTP connections
   - Database connection pooling
   - LLM API connection reuse

### Monitoring

1. **Azure Application Insights**
   - Request/response logging
   - Performance metrics
   - Error tracking
   - Custom events

2. **Metrics**
   - Execution time per graph
   - Agent response times
   - Success/failure rates
   - Cost per execution

---

## Deployment Architecture

### Development

```
Local Machine
├── agent-orchestration (stdio)
├── intent-graph-generator (stdio)
└── router (stdio)
```

### Production (Azure)

```
Azure Container Instances / AKS
├── agent-orchestration-service (HTTP)
│   ├── Load Balancer
│   └── Auto-scaling (2-10 instances)
├── intent-graph-generator-service (HTTP)
│   ├── Load Balancer
│   └── Auto-scaling (2-10 instances)
└── router-service (HTTP)
    ├── Load Balancer
    └── Auto-scaling (5-20 instances)

Supporting Services:
├── Azure Key Vault (secrets)
├── Azure Application Insights (monitoring)
├── Azure Redis Cache (caching)
├── Azure PostgreSQL (optional persistence)
└── Azure API Management (API gateway)
```

---

## Error Handling Strategy

### Error Types

1. **User Errors** - Invalid input, missing data
2. **System Errors** - Service unavailable, timeout
3. **Agent Errors** - Agent returned error response
4. **Graph Errors** - Invalid graph structure

### Error Handling

1. **Retries**
   - Exponential backoff
   - Max 3 attempts
   - Only for transient errors

2. **Fallbacks**
   - Fallback LLM if primary fails
   - Fallback agents if primary unavailable
   - Degraded functionality mode

3. **Error Reporting**
   - Log all errors with context
   - Alert on-call for critical errors
   - User-friendly error messages

---

## Cost Management

### Cost Tracking

- Track LLM API costs per execution
- Monitor agent API costs
- Azure resource costs
- Alert on budget thresholds

### Cost Optimization

- Cache frequently requested graphs
- Use cheaper LLM for simple tasks
- Batch requests when possible
- Auto-scale based on demand

---

## Future Enhancements

### Phase 2
- Visual graph editor (web UI)
- Agent marketplace
- Template library for common workflows
- Enhanced analytics dashboard

### Phase 3
- Multi-tenant support
- Workflow versioning
- A/B testing for graphs
- Machine learning for graph optimization

### Phase 4
- Real-time collaboration
- Graph diff and merge
- Workflow debugging tools
- Performance profiling

---

## References

- MCP Protocol: https://modelcontextprotocol.io/
- intent-graph-generator: https://github.com/seanpoyner/intent-graph-generator
- Azure Documentation: https://docs.microsoft.com/azure


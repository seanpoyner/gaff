# GAFF - Graphical Agentic Flow Framework

**Version:** 1.0.0  
**Author:** Sean Poyner  
**License:** MIT ([See OPEN_SOURCE.md](OPEN_SOURCE.md))  
**Status:** Open Source

---

## Overview

**GAFF (Graphical Agentic Flow Framework)** is an **open-source orchestration framework** that enables AI agents to automatically generate, execute, and manage complex multi-agent workflows through natural language interactions. Built with quality assurance and safety as first-class citizens.

### What Makes GAFF Different?

✅ **Quality-First:** Built-in quality validation that automatically triggers reruns when results don't meet standards  
✅ **Safety-First:** Dedicated safety & protocols MCP server for guardrails, PII detection, and compliance  
✅ **Production-Ready:** Comprehensive testing, validation, and error handling throughout  
✅ **MCP-Native:** Built entirely on the Model Context Protocol standard  
✅ **LLM-Powered:** Intelligent orchestration card and intent graph generation  
✅ **Human-in-the-Loop:** Native support for pausing workflows for human approval  
✅ **Single Gateway:** Access all 17+ tools from 9 servers through one connection

### Current Status (October 2025)

| Component | Status | Description |
|-----------|--------|-------------|
| **gaff-gateway** | ✅ Production | Unified entry point (⭐ Recommended) |
| **intent-graph-generator** | ✅ Production | Published to npm v2.2.3 |
| **agent-orchestration** | ✅ Working | Scaffolded, delegate-to-caller mode |
| **router** | ✅ Working | Scaffolded, basic execution |
| **quality-check** | ✅ Working | Scaffolded, basic validation |
| **safety-protocols** | ✅ Working | Scaffolded, basic safety checks |
| **tools** | ✅ Working | Scaffolded, basic utilities + HITL |
| **memory** | ✅ Production | Official Anthropic MCP server |
| **sandbox** | ✅ Production | Official Anthropic MCP server |
| **sequential-thinking** | ✅ Production | Official Anthropic MCP server |

**Confluence Documentation:** [GAFF Framework Complete Docs](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2583398840)  

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRIMARY AGENT                            │
│                   (Your AI Application)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Natural Language Query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GAFF FRAMEWORK                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       1. agent-orchestration MCP Server                │   │
│  │  • Converts NL → Orchestration Card                    │   │
│  │  • Reads gaff.json for context                         │   │
│  │  • Stores cards in memory MCP                          │   │
│  └──────────────────┬─────────────────────────────────────┘   │
│                     │ Orchestration Card                       │
│                     ▼                                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       2. safety-protocols MCP Server                   │   │
│  │  • Validates compliance requirements                   │   │
│  │  • Enforces guardrails (PII, rate limits, etc)         │   │
│  │  • Pre-execution safety checks                         │   │
│  └──────────────────┬─────────────────────────────────────┘   │
│                     │ Validated Card                           │
│                     ▼                                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       3. intent-graph-generator MCP Server             │   │
│  │  • Converts Card → Intent Graph (LLM-powered)          │   │
│  │  • Validates, analyzes, optimizes graphs               │   │
│  │  • 7 comprehensive tools                               │   │
│  └──────────────────┬─────────────────────────────────────┘   │
│                     │ Intent Graph                             │
│                     ▼                                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       4. router MCP Server                             │   │
│  │  • Executes intent graphs                              │   │
│  │  • Routes to appropriate agents                        │   │
│  │  • Manages execution state                             │   │
│  └──────────────────┬─────────────────────────────────────┘   │
│                     │ Execution Result                         │
│                     ▼                                           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │       5. QualityChecker Agent                          │   │
│  │  • Validates execution results                         │   │
│  │  • Scores quality against criteria                     │   │
│  │  • Triggers reruns via router if needed                │   │
│  │  • Ensures output meets standards                      │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Dual-Direction Architecture

GAFF supports **bidirectional MCP communication**:

1. **External → GAFF**: Apps like Claude/Cursor connect TO GAFF's MCP servers
2. **GAFF Internal → GAFF MCP**: Agents built WITHIN GAFF use GAFF's own MCP servers

Both use the **same GAFF Gateway**, providing consistent tool access and behavior.

**📖 Full Details:** [DUAL_DIRECTION_ARCHITECTURE.md](DUAL_DIRECTION_ARCHITECTURE.md)

---

## Quick Start

### ⭐ Option 1: GAFF Gateway (Recommended)

The **easiest way to use GAFF** - single connection, all functionality:

```bash
# Build the gateway
cd gaff/mcp/gaff-gateway
npm install
npm run build

# Configure Cursor or Claude Desktop
```

Add to your MCP configuration (`~/.cursor/mcp.json` or `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gaff-gateway": {
      "command": "node",
      "args": ["/absolute/path/to/gaff/mcp/gaff-gateway/build/index.js"],
      "env": {
        "GAFF_CONFIG_PATH": "/absolute/path/to/gaff/gaff.json"
      }
    }
  }
}
```

**Benefits:**
- ✅ **1 connection** instead of 9 separate servers
- ✅ **90% less configuration** 
- ✅ **17+ tools** immediately available
- ✅ **High-level workflows** via `gaff_create_and_execute_workflow`
- ✅ **Smart routing** to appropriate servers
- ✅ **Official MCP servers** bundled (memory, sandbox, thinking)

**Test it:**
```javascript
// In Cursor/Claude, ask:
"Use gaff_create_and_execute_workflow to process customer service requests"
```

---

## GAFF Components

### 0. GAFF Gateway (⭐ **Recommended Entry Point**)
**Purpose:** Single unified entry point to all GAFF MCP servers  
**Status:** ✅ Production-Ready  
**Location:** `mcp/gaff-gateway/`  
**Tools:** 17+ tools from 9 servers  
**Confluence:** [gaff-gateway Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2582482119)

**What It Provides:**
- `gaff_create_and_execute_workflow` - Complete NL → Execution workflow
- `memory_*` - Knowledge graph operations (9 tools, official MCP)
- `sandbox_execute_code` - Safe Python/JavaScript/Shell execution (official MCP)
- `thinking_sequential` - Step-by-step reasoning (official MCP)
- `orchestration_*` - Natural language → orchestration cards (5 tools)
- `graph_*` - Intent graph generation & visualization (7 tools)
- `router_*` - Execution engine (7 tools)
- `quality_*` - Quality validation (6 tools)
- `safety_*` - Compliance & guardrails (6 tools)
- `tools_*` - Utilities & HITL (7 tools)

**Documentation:** [mcp/gaff-gateway/README.md](mcp/gaff-gateway/README.md)

---

### 1. memory MCP Server
**Purpose:** Knowledge graph storage for orchestration cards, graphs, and execution history  
**Status:** ✅ Production-Ready (Official MCP Server)

**Note:** GAFF includes the official `@modelcontextprotocol/server-memory` as a bundled dependency. This ensures memory support works out-of-the-box without additional installation.

**Tools:** 9 memory operations
- `create_entities`, `create_relations`, `add_observations`
- `delete_entities`, `delete_observations`, `delete_relations`
- `read_graph`, `search_nodes`, `open_nodes`

---

### 2. sandbox MCP Server
**Purpose:** Safe code execution in isolated environment  
**Status:** ✅ Production-Ready (Official MCP Server)

**Tools:**
- `execute_code` - Execute Python, JavaScript, or Shell code safely

**Supported Languages:**
- Python
- JavaScript/Node.js
- Shell/Bash

**Safety Features:**
- Isolated execution environment
- Resource limits
- Timeout protection
- No host filesystem access by default

**Configuration:**
```json
{
  "mcpServers": {
    "sandbox": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sandbox"]
    }
  }
}
```

**Documentation:** [mcp/sandbox/README.md](mcp/sandbox/README.md)

---

### 3. sequential-thinking MCP Server
**Purpose:** Step-by-step reasoning for complex problem-solving  
**Status:** ✅ Production-Ready (Official MCP Server)

**Tools:**
- `sequentialthinking` - Break down problems into thought steps

**Key Features:**
- Dynamic thought planning (adjust estimates as you go)
- Thought revision and backtracking
- Branch exploration for alternatives
- Hypothesis generation and testing
- Transparent reasoning process

**Configuration:**
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Documentation:** [mcp/sequential-thinking/README.md](mcp/sequential-thinking/README.md)

---

### 4. agent-orchestration MCP Server
**Purpose:** Natural language to orchestration card conversion  
**Status:** ✅ Working (Scaffolded - Delegate to Caller Mode)  
**Location:** `mcp/agent-orchestration/`  
**Confluence:** [agent-orchestration Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580103320)

**Tools (5):**
- `orchestration_generate_card` - Convert NL query to orchestration card
- `orchestration_validate_card` - Validate card structure
- `orchestration_list_agents` - List available agents from gaff.json
- `orchestration_get_agent_capabilities` - Get specific agent details
- `orchestration_store_card` - Store card in memory MCP (future)

**Key Features:**
- ✅ **No API Key Required** - Uses delegate_to_caller mode by default
- ✅ **Automatic Agent Selection** - Reads gaff.json for available agents
- ✅ **Capability Matching** - Intelligently selects agents
- ✅ **Comprehensive Validation** - Ensures cards match gaff.json

**Documentation:** [mcp/agent-orchestration/README.md](mcp/agent-orchestration/README.md)

---

### 5. safety-protocols MCP Server
**Purpose:** Guardrails, compliance, and safety enforcement  
**Status:** ✅ Working (Scaffolded - Basic Implementation)  
**Location:** `mcp/safety-protocols/`  
**Confluence:** [safety-protocols Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580103571)

**Tools (6):**
- `safety_validate_compliance` - Check compliance (GDPR, CCPA, SOC2)
- `safety_check_guardrails` - PII detection, content filtering
- `safety_validate_input` - Pre-execution input validation
- `safety_validate_output` - Post-execution output validation
- `safety_enforce_rate_limits` - Rate limiting enforcement
- `safety_audit_log` - Security audit logging

**Key Features:**
- ✅ **PII Detection** - Email, phone, SSN, credit cards
- ✅ **Content Filtering** - Unsafe content detection
- ✅ **Compliance Checks** - GDPR, CCPA, SOC2 validation
- ✅ **Rate Limiting** - Per user/IP/endpoint
- ✅ **Audit Logging** - Comprehensive trails

**Documentation:** [mcp/safety-protocols/README.md](mcp/safety-protocols/README.md)

---

### 6. intent-graph-generator MCP Server
**Purpose:** Orchestration card to intent graph conversion  
**Status:** ✅ Production-Ready (v2.2.3 on npm)  
**Location:** Published to npm: `intent-graph-mcp-server@2.2.3`  
**GitHub:** https://github.com/seanpoyner/intent-graph-generator

**Tools (7):**
- `graph_generate` - Generate intent graph from orchestration card
- `graph_validate` - Comprehensive DAG validation
- `graph_analyze` - Complexity and optimization analysis
- `graph_optimize` - Apply optimizations (parallel execution, etc.)
- `graph_export` - Export in multiple formats (JSON, YAML, etc.)
- `graph_visualize` - Generate beautiful Mermaid diagrams
- `graph_generate_artifacts` - Debugging artifacts

**Key Features:**
- ✅ **LLM-Powered Generation** - Intelligent graph creation
- ✅ **Delegate to Caller Mode** - No API key required by default
- ✅ **DAG Validation** - Ensures no cycles
- ✅ **Parallel Execution** - Optimizes for concurrent execution
- ✅ **Beautiful Visualizations** - Mermaid diagrams with colors

**Installation:**
```bash
npx intent-graph-mcp-server@2.2.3
```

**Documentation:** [mcp/intent-graph-generator/README.md](mcp/intent-graph-generator/README.md)

---

### 9. tools MCP Server (GAFF Tools)
**Purpose:** Essential utility tools including human-in-the-loop  
**Status:** ✅ Working (Scaffolded - Basic Utilities)  
**Location:** `mcp/tools/`

**Tools (7):**
- 🚨 `tools_human_in_the_loop` - **CRITICAL**: Pause execution for user approval
- `tools_format_data` - Convert between JSON, XML, YAML, CSV
- `tools_translate_schema` - Schema mapping and translation
- `tools_lint_data` - Validate data against schemas
- `tools_sanitize_data` - Clean and sanitize data (PII removal, etc.)
- `tools_convert_timestamp` - Timestamp format conversion
- `tools_count_tokens` - Token counting for cost estimation

**Key Feature - Human-in-the-Loop:**
✅ **Production-Critical** - Pauses workflows for human approval  
✅ **Prevents Dangerous Actions** - Deletions, financial transactions, policy changes  
✅ **Router Integration** - Seamless HITL support in execution engine  
✅ **Configurable Timeouts** - Yes/No, multi-choice, or text input  

**Documentation:** [mcp/tools/README.md](mcp/tools/README.md)

---

### 8. quality-check MCP Server
**Purpose:** Quality validation, scoring, and rerun strategy determination  
**Status:** ✅ Working (Scaffolded - Basic Validation)  
**Location:** `mcp/quality-check/`  
**Confluence:** [quality-check Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580458458)

**Tools (6):**
- `quality_validate_result` - Comprehensive validation against criteria
- `quality_score_quality` - Calculate quality score (0-1 scale)
- `quality_check_completeness` - Verify all required outputs present
- `quality_check_accuracy` - Validate correctness against rules
- `quality_determine_rerun_strategy` - Decide partial/full/adaptive rerun
- `quality_analyze_failure_patterns` - Identify patterns to improve workflows

**Key Features:**
- ✅ **Automatic Validation** - Validates results against configurable criteria
- ✅ **Quality Scoring** - 0-1 scale with default threshold of 0.85
- ✅ **Intelligent Reruns** - Partial, full, or adaptive rerun strategies
- ✅ **Pattern Analysis** - Identifies failure patterns for improvement
- ✅ **Router Integration** - Automatic coordination with router

**How It Works:**
The router calls quality-check after executing intent graphs. If quality score < threshold (default 0.85), quality-check determines the best rerun strategy and triggers reruns automatically.

**Documentation:** [mcp/quality-check/README.md](mcp/quality-check/README.md)

---

### 7. router MCP Server
**Purpose:** Intent graph execution engine and agent routing  
**Status:** ✅ Working (Scaffolded - Basic Execution)  
**Location:** `mcp/router/`  
**Confluence:** [router Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580103344)

**Tools (7):**
- `router_execute_graph` - Execute complete intent graph with parallel support
- `router_route_to_agent` - Route single request to specific agent
- `router_get_execution_status` - Check async execution state
- `router_pause_execution` - Pause for HITL or intervention
- `router_resume_execution` - Resume after approval
- `router_cancel_execution` - Cancel running execution
- `router_rerun_nodes` - Re-execute specific nodes (quality-triggered)

**Key Features:**
- ✅ **Topological Sort** - Determines optimal execution order
- ✅ **Parallel Execution** - Executes independent nodes concurrently
- ✅ **HITL Support** - Human-in-the-loop approval workflows
- ✅ **Quality Integration** - Automatic coordination with quality-check
- ✅ **State Management** - Comprehensive execution tracking

**Special Integrations:**
- **HITL:** Detects `human_in_the_loop` nodes, pauses execution, waits for approval
- **Quality-Check:** Calls quality-check after execution, handles automatic reruns

**Documentation:** [mcp/router/README.md](mcp/router/README.md)

---

### 8. QualityChecker Agent (Deprecated)
**Note:** The standalone QualityChecker agent is now replaced by the **quality-check MCP server** (#5 above). The MCP server provides more comprehensive tooling and better integration with the router

---

## gaff.json Configuration

The `gaff.json` file is the central configuration for the entire GAFF framework.

### Structure

```json
{
  "version": "1.0.0",
  "primary_agent": {
    "name": "Primary Orchestrator",
    "type": "custom",
    "description": "Primary agent that interacts with users",
    "mcp_servers": [
      "agent-orchestration",
      "safety-protocols",
      "intent-graph-generator",
      "router",
      "memory"
    ],
    "memory_enabled": true
  },
  "agents": {
    "InputValidator": {
      "type": "validator",
      "description": "Validates input data for completeness, format, and security",
      "capabilities": ["schema_validation", "security_check", "data_sanitization"],
      "endpoint": "http://localhost:8001/validate",
      "authentication": "api_key",
      "timeout_ms": 5000
    },
    "DataFetcher": {
      "type": "api",
      "description": "Fetches data from external APIs",
      "capabilities": ["rest_api_calls", "data_retrieval", "pagination_handling"],
      "endpoint": "http://localhost:8002/fetch",
      "authentication": "api_key",
      "timeout_ms": 15000
    },
    "QualityChecker": {
      "type": "validator",
      "description": "Validates quality of workflow results and triggers reruns",
      "capabilities": ["result_validation", "quality_scoring", "rerun_triggering"],
      "endpoint": "http://localhost:8007/quality-check",
      "authentication": "none",
      "timeout_ms": 8000
    }
  },
  "models": {
    "primary_llm": {
      "provider": "writer",
      "model": "palmyra-x5",
      "api_key_env": "WRITER_API_KEY",
      "temperature": 0.7
    },
    "fallback_llm": {
      "provider": "openai",
      "model": "gpt-4",
      "api_key_env": "OPENAI_API_KEY"
    }
  },
  "protocols": {
    "mcp_version": "1.0.4",
    "transport": "stdio",
    "http_fallback": true,
    "memory_mcp": {
      "enabled": true,
      "url": "http://localhost:3100"
    }
  },
  "schemas": {
    "orchestration_card": "./schemas/orchestration-card-schema.json",
    "intent_graph": "./schemas/intent-graph-schema.json",
    "safety_policy": "./schemas/safety-policy-schema.json"
  },
  "context": {
    "organization": "GAFF Open Source Project",
    "domain": "general",
    "compliance": ["GDPR", "CCPA", "SOC2"]
  },
  "quality_assurance": {
    "enabled": true,
    "auto_rerun_on_failure": true,
    "quality_threshold": 0.85,
    "max_rerun_attempts": 2
  },
  "safety_protocols": {
    "enabled": true,
    "guardrails": {
      "pii_detection": true,
      "content_filtering": true,
      "rate_limiting": true
    }
  }
}
```

---

## Environment Configuration

Create a `.env` file with the following variables:

```bash
# LLM Provider Keys
WRITER_API_KEY=your-writer-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# MCP Memory Server
MEMORY_MCP_ENABLED=true
MEMORY_MCP_URL=http://localhost:3100

# Logging & Monitoring
LOG_LEVEL=info

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Quality Assurance
QUALITY_THRESHOLD=0.85
MAX_RERUN_ATTEMPTS=2

# Safety Protocols
ENABLE_PII_DETECTION=true
ENABLE_CONTENT_FILTERING=true
ENABLE_RATE_LIMITING=true
```

---

## Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- LLM API keys (Writer Palmyra, Azure OpenAI, etc.)

### Install GAFF

```bash
# Clone or navigate to GAFF directory
cd gaff

# Install agent-orchestration MCP server
cd mcp/agent-orchestration
npm install
npm run build

# Router MCP server
cd ../router
npm install
npm run build

# Tools MCP server
cd ../tools
npm install
npm run build

# Quality-check MCP server
cd ../quality-check
npm install
npm run build

# Safety-protocols MCP server
cd ../safety-protocols
npm install
npm run build

# Memory MCP server (official server bundled)
cd ../memory
npm install

# intent-graph-generator is installed via npm (already published)
npm install -g intent-graph-mcp-server@2.2.3
```

### Configure

1. Copy `.env.example` to `.env` and fill in your keys
2. Update `gaff.json` with your agents and configuration
3. Configure your primary agent (Copilot Studio or custom) to use the MCP servers

---

## Usage

### Example: Data Processing Workflow with Quality Assurance

```typescript
// 1. User query to primary agent
const userQuery = "Fetch user data, validate it, transform to standard format, and ensure quality";

// 2. agent-orchestration generates orchestration card
const card = await agentOrchestration.generate_orchestration_card({
  query: userQuery,
  gaff_config: gaffJson,
  store_in_memory: true
});

// 3. safety-protocols validates compliance
const safetyCheck = await safetyProtocols.validate_compliance({
  orchestration_card: card,
  compliance_requirements: ["GDPR", "CCPA"]
});

// 4. intent-graph-generator creates intent graph
const graph = await intentGraphGenerator.generate_intent_graph({
  orchestration_card: card,
  options: {
    validate: true,
    optimize: true,
    include_quality_checks: true
  }
});

// 5. router executes the graph
const result = await router.execute_graph({
  graph: graph,
  execution_mode: "async"
});

// 6. quality checker validates results and triggers reruns if needed
const qualityCheck = await qualityChecker.validate_result({
  execution_result: result,
  quality_criteria: { completeness: 1.0, accuracy: 0.9 }
});

if (!qualityCheck.is_acceptable) {
  // Automatic rerun triggered by router
  const rerunResult = await router.rerun_nodes({
    graph: graph,
    nodes_to_rerun: qualityCheck.rerun_nodes
  });
}
```

---

## Directory Structure

```
gaff/
├── mcp/                          # All MCP servers
│   ├── gaff-gateway/             # ⭐ Single Entry Point (Recommended)
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── agent-orchestration/      # NL → Orchestration Card
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── memory/                   # Knowledge Graph Memory (Official MCP Server)
│   │   ├── index.js
│   │   ├── package.json
│   │   └── README.md
│   ├── sandbox/                  # Safe Code Execution (Official MCP Server)
│   │   ├── index.js
│   │   ├── package.json
│   │   └── README.md
│   ├── sequential-thinking/      # Step-by-Step Reasoning (Official MCP Server)
│   │   ├── index.js
│   │   ├── package.json
│   │   └── README.md
│   ├── intent-graph-generator/   # Orchestration Card → Intent Graph (Published)
│   │   ├── src/
│   │   ├── package.json
│   │   ├── schemas/
│   │   └── README.md
│   ├── safety-protocols/         # Guardrails & Compliance
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── tools/                    # Essential Utilities (incl. HITL)
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── quality-check/            # Quality Validation & Scoring
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── router/                   # Intent Graph Execution Engine
│       ├── src/
│       ├── package.json
│       └── README.md
├── schemas/                      # JSON schemas (shared)
│   ├── orchestration-card-schema.json
│   ├── gaff-config-schema.json
│   ├── intent-graph-schema.json
│   └── safety-policy-schema.json
├── examples/                     # Example configurations
│   ├── data-processing/
│   ├── api-orchestration/
│   └── multi-agent-workflows/
├── docs/                         # Documentation
│   ├── gaff-docs/
│   │   ├── ARCHITECTURE.md
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   └── START_HERE.md
│   └── agent-docs/
├── agents/                       # Agent implementations
├── knowledge/                    # Knowledge base
├── gaff.json                     # Central configuration
├── .env.example                  # Environment template
└── README.md                     # This file
```

---

## Development Roadmap

### Phase 1: Core Infrastructure (Current)
- ✅ intent-graph-generator MCP server (v2.2.3 - Published)
- 🚧 agent-orchestration MCP server (scaffolded)
- 🚧 safety-protocols MCP server (scaffolded)
- 🚧 tools MCP server - includes human-in-the-loop (scaffolded)
- 🚧 quality-check MCP server (scaffolded)
- 🚧 router MCP server - execution engine (scaffolded)
- 🚧 gaff.json schema and validation

### Phase 2: Quality & Safety
- Quality scoring algorithms
- Adaptive rerun strategies
- PII detection and masking
- Content filtering
- Rate limiting enforcement
- Compliance validation (GDPR, CCPA, SOC2)

### Phase 3: Integration & Testing
- Memory MCP server integration
- End-to-end workflow testing
- Performance benchmarking
- Security auditing
- Documentation completion

### Phase 4: Production & Community
- npm publication of all 4 MCP servers
- GitHub releases and versioning
- Example configurations and templates
- Contributing guidelines
- Community support channels

### Phase 5: Enhancement
- Visual graph editor (web UI)
- Agent marketplace
- Template library
- Analytics dashboard
- Real-time monitoring

---

## Use Cases

GAFF is designed for any workflow requiring multi-agent orchestration:

- **Data Processing Pipelines:** Fetch, validate, transform, and quality-check data
- **API Orchestration:** Coordinate multiple API calls with error handling and retries
- **Automated Decision Making:** Route requests based on business logic with quality assurance
- **Content Generation:** Multi-step content workflows with safety checks
- **Customer Service:** Intelligent routing with compliance enforcement
- **E-commerce:** Order processing with fraud detection and quality validation

---

## Contributing

GAFF is open source! Contributions are welcome.

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Areas We Need Help
- Additional agent implementations
- Example configurations for different domains
- Documentation improvements
- Testing and bug reports
- Performance optimizations

---

## License

MIT License - Copyright 2025 Sean Poyner

See [LICENSE](LICENSE) for full details.

---

## Contact & Support

**Author:** Sean Poyner  
**Email:** sean.poyner@pm.me  
**GitHub:** [@seanpoyner](https://github.com/seanpoyner)  
**Project:** [GAFF on GitHub](https://github.com/seanpoyner/gaff)

---

## Acknowledgments

Built on the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) by Anthropic.

Special thanks to the open-source community for making agentic AI accessible to everyone.


# GAFF Implementation Plan

**Version:** 1.0.0  
**Author:** Sean Poyner  
**Created:** October 6, 2025  
**Updated:** October 6, 2025 (Added safety-protocols & QualityChecker)

---

## ✅ Completed

### Infrastructure
- ✅ Created `gaff/` parent directory
- ✅ Created directory structure (agent-orchestration, safety-protocols, router)
- ✅ Created comprehensive `README.md` with architecture overview
- ✅ Created `ARCHITECTURE.md` with detailed technical documentation
- ✅ Created `gaff.json` with complete configuration example (now includes QualityChecker & safety configs)
- ✅ Created `.env.example` template
- ✅ Created `agent-orchestration/` project structure with package.json, tsconfig.json, README, src/index.ts
- ✅ Created `safety-protocols/` project structure with package.json, tsconfig.json, README, src/index.ts
- ✅ intent-graph-generator MCP server already published to npm (v2.2.3)

### Documentation
- ✅ Complete GAFF architecture documented (5-component system)
- ✅ Data flow diagrams created (including quality & safety layers)
- ✅ Tool specifications defined for all 5 components
- ✅ Security architecture documented with guardrails
- ✅ Quality assurance architecture defined
- ✅ Removed all Marriott-specific references - open source focused
- ✅ Deployment architecture planned

---

## 🚧 Next Steps

### Phase 1A: Safety-Protocols MCP Server (Priority 1)

The safety-protocols server is now scaffolded with 6 tools. Next steps:

1. **Implement PII Detection**
   - Regex patterns for emails, SSNs, credit cards
   - Integration with ML-based PII detection (optional)
   - Masking strategies

2. **Implement Content Filtering**
   - Profanity detection
   - Harmful content detection
   - Custom content policies

3. **Implement Rate Limiting**
   - Redis integration for distributed rate limiting
   - Or in-memory store for simple deployments
   - Per-user, per-IP, per-endpoint limits

4. **Implement Compliance Validation**
   - GDPR: data minimization, consent tracking
   - CCPA: data privacy rights
   - SOC2: access controls, audit logs

5. **Implement Audit Logging**
   - Database integration (PostgreSQL, MongoDB)
   - Log retention policies
   - Log query and export

6. **Testing**
   - Unit tests for each tool
   - Integration tests with gaff.json
   - Compliance test scenarios

---

### Phase 1B: Core agent-orchestration MCP Server (Priority 1)

#### Files to Create
1. **`agent-orchestration/src/types.ts`**
   - TypeScript interfaces for:
     - OrchestrationCard
     - GaffConfig
     - Agent
     - ToolParams
     - ToolResults

2. **`agent-orchestration/src/index.ts`**
   - Main MCP server entry point
   - stdio transport setup
   - Tool registration
   - Error handling

3. **`agent-orchestration/src/tools/generate-card.ts`**
   - `generate_orchestration_card` tool
   - NL query → orchestration card
   - LLM integration (Writer Palmyra)
   - gaff.json parsing

4. **`agent-orchestration/src/tools/validate-card.ts`**
   - `validate_orchestration_card` tool
   - Schema validation
   - Agent availability checks

5. **`agent-orchestration/src/tools/list-agents.ts`**
   - `list_agents` tool
   - gaff.json agent enumeration
   - Capability filtering

6. **`agent-orchestration/src/tools/get-agent.ts`**
   - `get_agent_capabilities` tool
   - Agent details retrieval

7. **`agent-orchestration/src/tools/store-card.ts`**
   - `store_card` tool
   - Memory MCP integration

8. **`agent-orchestration/src/llm/client.ts`**
   - Universal LLM client
   - Support for Writer, Azure OpenAI, Anthropic
   - Similar to intent-graph-generator's LLM client

9. **`agent-orchestration/src/utils.ts`**
   - gaff.json loading
   - Environment variable handling
   - Validation helpers

#### Implementation Steps

**Step 1: Create Types**
```typescript
// src/types.ts - Define all TypeScript interfaces
```

**Step 2: Create LLM Client**
```typescript
// src/llm/client.ts - Universal LLM client
// Reuse pattern from intent-graph-generator
```

**Step 3: Create Main Server**
```typescript
// src/index.ts - MCP server with 5 tools
```

**Step 4: Implement Each Tool**
```typescript
// src/tools/*.ts - One file per tool
```

**Step 5: Build & Test**
```bash
npm install
npm run build
npm start  # Test stdio transport
```

---

### Phase 2: Router MCP Server (Priority 2)

Similar structure to agent-orchestration:

1. `router/package.json`
2. `router/tsconfig.json`
3. `router/src/types.ts`
4. `router/src/index.ts`
5. `router/src/executor.ts` - Graph execution engine
6. `router/src/routing.ts` - Agent routing logic
7. `router/src/tools/*.ts` - MCP tools

Tools to implement:
- `execute_graph`
- `route_to_agent`
- `get_execution_status`
- `pause_execution`
- `resume_execution`
- `cancel_execution`

---

### Phase 3: Integration & Testing (Priority 3)

1. **End-to-End Flow**
   - Test: NL Query → Orchestration Card → Intent Graph → Execution
   - Verify all three servers work together

2. **Memory MCP Integration**
   - Store orchestration cards
   - Cache intent graphs
   - Session management

3. **Copilot Studio Integration**
   - HTTP transport for all servers
   - MCP connector configuration
   - Authentication setup

4. **Example Workflows**
   - Guest service request
   - Revenue management
   - Property maintenance

---

### Phase 4: Production Readiness (Priority 4)

1. **Testing**
   - Unit tests for all tools
   - Integration tests
   - Load testing

2. **Monitoring**
   - Azure Application Insights integration
   - Custom metrics
   - Alerting

3. **Security**
   - Azure AD authentication
   - Key Vault integration
   - Rate limiting
   - Input validation

4. **Deployment**
   - Azure Container Instances
   - Auto-scaling configuration
   - Load balancer setup
   - CI/CD pipeline

---

## Quick Start Commands

### Initialize agent-orchestration
```bash
cd gaff/mcp/agent-orchestration
npm install
npm run build
npm start
```

### Initialize router
```bash
cd gaff/mcp/router
npm init -y
# Copy package.json structure from agent-orchestration
npm install
npm run build
```

### Test GAFF End-to-End
```bash
# Terminal 1: agent-orchestration
cd gaff/mcp/agent-orchestration
npm start

# Terminal 2: intent-graph-generator
npx intent-graph-mcp-server@2.2.3

# Terminal 3: router
cd gaff/mcp/router
npm start

# Terminal 4: Test client or Cursor with all three MCP servers configured
```

---

## Key Design Decisions

### 1. Separate MCP Servers
✅ **Decision:** Build 3 separate MCP servers instead of one monolithic server

**Rationale:**
- Each server has distinct responsibility
- Can be scaled independently
- Easier to test and maintain
- Can be published as separate npm packages

### 2. gaff.json as Central Config
✅ **Decision:** Use gaff.json as single source of truth for agents, models, constraints

**Rationale:**
- Easy to update configuration
- No code changes needed for new agents
- Can version configurations
- Supports multiple environments

### 3. LLM for Orchestration Card Generation
✅ **Decision:** Use LLM to convert NL → orchestration card

**Rationale:**
- Better understanding of user intent
- Handles ambiguity
- More flexible than rule-based
- Can suggest agents user didn't explicitly mention

### 4. Memory MCP Optional
✅ **Decision:** Make memory MCP integration optional

**Rationale:**
- Not all deployments need persistence
- Adds complexity
- Can work without it for stateless use cases

### 5. stdio + HTTP Transports
✅ **Decision:** Support both stdio and HTTP

**Rationale:**
- stdio for local development (Cursor, Claude Desktop)
- HTTP for production (Copilot Studio, web apps)
- Flexible deployment options

---

## File Structure Summary

```
gaff/
├── README.md                          ✅ Created
├── gaff.json                          ✅ Created
├── .env.example                       ✅ Created
├── schemas/                           ✅ Created
├── docs/                              ✅ Created
│   └── gaff-docs/
│       ├── ARCHITECTURE.md            ✅ Created
│       ├── IMPLEMENTATION_PLAN.md     ✅ Created (this file)
│       └── START_HERE.md              ✅ Created
│
└── mcp/                               ✅ Created
    ├── agent-orchestration/           ✅ Created
    │   ├── package.json               ✅ Created
    │   ├── tsconfig.json              ✅ Created
    │   ├── README.md                  ✅ Created
    │   └── src/                       ✅ Created (empty)
    │       ├── index.ts               🚧 TODO
    │       ├── types.ts               🚧 TODO
    │       ├── utils.ts               🚧 TODO
    │       ├── llm/
    │       │   └── client.ts          🚧 TODO
    │       └── tools/
    │           ├── generate-card.ts   🚧 TODO
    │           ├── validate-card.ts   🚧 TODO
    │           ├── list-agents.ts     🚧 TODO
    │           ├── get-agent.ts       🚧 TODO
    │           └── store-card.ts      🚧 TODO
    │
    ├── intent-graph-generator/        ✅ Published (v2.2.3)
    ├── safety-protocols/              ✅ Scaffolded
    ├── tools/                         ✅ Scaffolded  
    ├── quality-check/                 ✅ Scaffolded
    └── router/                        ✅ Scaffolded
        ├── package.json               ✅ Created
        ├── tsconfig.json              ✅ Created
        ├── README.md                  ✅ Created
        └── src/                       🚧 TODO
            ├── index.ts
            ├── types.ts
            ├── executor.ts
            ├── routing.ts
            └── tools/
                ├── execute-graph.ts
                ├── route-to-agent.ts
                ├── get-status.ts
                ├── pause-execution.ts
                ├── resume-execution.ts
                └── cancel-execution.ts
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ agent-orchestration MCP server builds without errors
- ✅ All 5 tools are implemented and testable
- ✅ Can generate orchestration card from NL query
- ✅ gaff.json is successfully parsed
- ✅ LLM integration works with Writer Palmyra

### Phase 2 Complete When:
- ✅ router MCP server builds without errors
- ✅ Can execute simple intent graphs
- ✅ Agent routing works
- ✅ Execution state management implemented

### Phase 3 Complete When:
- ✅ End-to-end flow works: NL → Card → Graph → Execution
- ✅ All three servers communicate properly
- ✅ Memory MCP integration works
- ✅ Example workflows run successfully

### Phase 4 Complete When:
- ✅ All tests passing
- ✅ Monitoring and logging configured
- ✅ Security measures implemented
- ✅ Deployed to Azure
- ✅ Documentation complete

---

## Resources

- **intent-graph-generator:** https://github.com/seanpoyner/intent-graph-generator (reference implementation)
- **MCP SDK:** @modelcontextprotocol/sdk@1.0.4
- **TypeScript:** 5.7.2
- **Node.js:** >= 18.0.0

---

## Contact

**Author:** Sean Poyner  
**Email:** sean.poyner@marriott.com  
**Team:** Marriott AI Studio - Automation Engineering


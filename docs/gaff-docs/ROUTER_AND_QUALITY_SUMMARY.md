# Router & Quality-Check MCP Servers - Creation Summary

**Date:** October 6, 2025  
**Created:** Two critical MCP servers for GAFF execution and quality assurance

---

## 🎯 What Was Created

### 1. **quality-check MCP Server** (Component #5)
A dedicated MCP server for quality validation, scoring, and automatic rerun strategy determination.

### 2. **router MCP Server** (Component #6)
The execution engine that runs intent graphs, routes to agents, and integrates with HITL and quality-check.

---

## 📦 Files Created

### quality-check MCP Server

```
gaff/mcp/quality-check/
├── package.json                 # npm package configuration
├── tsconfig.json                # TypeScript configuration
├── README.md                    # 400+ lines of documentation
└── src/
    └── index.ts                 # Full MCP server with 6 tools
```

**Tools (6 total):**
1. `validate_execution_result` - Comprehensive validation against quality criteria
2. `score_quality` - Calculate quality score with weighted components
3. `check_completeness` - Verify all required outputs are present
4. `check_accuracy` - Validate correctness against rules
5. `determine_rerun_strategy` - Intelligently decide partial/full/adaptive rerun
6. `analyze_failure_patterns` - Identify patterns to improve workflows

---

### router MCP Server

```
gaff/mcp/router/
├── package.json                 # npm package configuration
├── tsconfig.json                # TypeScript configuration
├── README.md                    # 600+ lines of documentation
└── src/
    └── index.ts                 # Full MCP server with 7 tools
```

**Tools (7 total):**
1. `execute_graph` - Execute complete intent graph with parallel execution
2. `route_to_agent` - Route single request to specific agent
3. `get_execution_status` - Check async execution state
4. `pause_execution` - Pause for HITL or manual intervention
5. `resume_execution` - Resume after approval or intervention
6. `cancel_execution` - Cancel running or paused execution
7. `rerun_nodes` - Re-execute specific nodes (quality-triggered)

---

## 🏗️ Complete GAFF Architecture

GAFF now has **7 components** (6 MCP servers + 1 deprecated agent):

```
1. agent-orchestration     → Converts NL to orchestration cards
2. safety-protocols        → Enforces guardrails and compliance
3. intent-graph-generator  → Generates intent graphs ✅ (v2.2.3)
4. tools                   → Essential utilities + HITL
5. quality-check          → Quality validation & scoring ← NEW!
6. router                 → Execution engine ← NEW!
7. QualityChecker agent   → Deprecated (replaced by quality-check MCP)
```

---

## 🔄 Complete Execution Flow

```
User Query
    ↓
1. agent-orchestration
   └─ Converts NL → Orchestration Card
    ↓
2. safety-protocols
   └─ Validates compliance & guardrails
    ↓
3. intent-graph-generator
   └─ Generates Intent Graph (DAG)
    ↓
4. router.execute_graph()
   ├─ For each node:
   │  ├─ Is it HITL node?
   │  │  ├─ YES → Call gaff-tools.human_in_the_loop
   │  │  │        Pause execution
   │  │  │        Notify user
   │  │  │        Wait for approval
   │  │  │        Resume based on decision
   │  │  └─ NO → Execute normally
   │  └─ Route to agent
   │     Execute tool
   │     Store result
   └─ All nodes complete
    ↓
5. quality-check.validate_execution_result()
   ├─ Calculate quality score
   ├─ Is score >= threshold (0.85)?
   │  ├─ YES → Return results ✅
   │  └─ NO → quality-check.determine_rerun_strategy()
   │           ├─ Strategy: partial
   │           │  └─ router.rerun_nodes(failed_nodes)
   │           ├─ Strategy: full
   │           │  └─ router.execute_graph(graph)
   │           └─ Strategy: adaptive
   │              └─ Intelligently decide
   └─ Repeat until:
      - Quality acceptable OR
      - Max attempts reached
```

---

## 🚨 Critical Integration Points

### HITL (Human-in-the-Loop) Integration

**How It Works:**

1. **Intent Graph Generation** - `intent-graph-generator` creates graph with HITL nodes:
   ```json
   {
     "id": "node_2_hitl",
     "agent": "gaff-tools",
     "tool": "human_in_the_loop",
     "input": {
       "action_description": "Delete 150 customer records",
       "action_type": "approval"
     }
   }
   ```

2. **Router Detects HITL Node** - During execution:
   ```typescript
   if (node.agent === 'gaff-tools' && node.tool === 'human_in_the_loop') {
     // Pause execution
     execution.status = 'paused_for_approval';
     
     // Call HITL tool
     await callTool('gaff-tools', 'human_in_the_loop', node.input);
     
     // Notify user
     await sendNotification({
       execution_id,
       action: node.input.action_description,
       approval_url: `https://app.example.com/approve/${execution_id}`
     });
     
     // Save state and return
     return { status: 'paused_for_approval', execution_id };
   }
   ```

3. **User Approves/Rejects** - Via UI, webhook, or email

4. **Router Resumes** - Based on decision:
   ```typescript
   if (approval.approved) {
     continueToNode('next_on_approve');
   } else {
     continueToNode('next_on_reject'); // Error handler
   }
   ```

---

### Quality-Check Integration

**How It Works:**

1. **Router Completes Execution**
   ```typescript
   const executionResult = await executeAllNodes(graph);
   ```

2. **Router Calls Quality-Check**
   ```typescript
   const qualityResult = await callTool('quality-check', 'validate_execution_result', {
     execution_result: executionResult,
     quality_criteria: gaffConfig.quality_assurance,
     intent_graph: graph
   });
   ```

3. **Quality-Check Validates & Scores**
   ```typescript
   // Returns:
   {
     quality_score: 0.78,
     is_acceptable: false,  // threshold is 0.85
     rerun_required: true,
     rerun_nodes: ["node_5", "node_6"]
   }
   ```

4. **If Rerun Needed, Determine Strategy**
   ```typescript
   const strategy = await callTool('quality-check', 'determine_rerun_strategy', {
     execution_result: executionResult,
     validation_result: qualityResult,
     intent_graph: graph
   });
   
   // Returns:
   {
     strategy: "partial",  // or "full" or "adaptive"
     rerun_nodes: ["node_5", "node_6"],
     estimated_success_probability: 0.80
   }
   ```

5. **Router Executes Rerun**
   ```typescript
   if (strategy.strategy === 'partial') {
     await router.rerun_nodes({
       graph: graph,
       nodes_to_rerun: strategy.rerun_nodes
     });
   }
   ```

---

## 📊 Component Status Update

| Component | Status | Tools | Package Name | Description |
|-----------|--------|-------|-------------|-------------|
| intent-graph-generator | ✅ Production | 7 | `intent-graph-mcp-server` | Published v2.2.3 |
| agent-orchestration | 🚧 Scaffolded | 5 | `agent-orchestration-mcp-server` | NL → Card |
| safety-protocols | 🚧 Scaffolded | 6 | `safety-protocols-mcp-server` | Guardrails |
| tools | 🚧 Scaffolded | 7 | `gaff-tools-mcp-server` | Utilities + HITL |
| **quality-check** | **🚧 Scaffolded** | **6** | **`quality-check-mcp-server`** | **Quality validation** |
| **router** | **🚧 Scaffolded** | **7** | **`router-mcp-server`** | **Execution engine** |

---

## 🎯 Implementation Priority

### Phase 1: Router Core (HIGHEST PRIORITY)

The router is the heart of GAFF. Without it, nothing executes.

**Must Implement:**
1. **Graph Validation** - Validate DAG, no cycles
2. **Topological Sort** - Determine execution order
3. **Agent Routing** - Call agents via HTTP/MCP
4. **Basic Execution** - Execute nodes sequentially
5. **Error Handling** - Retries, timeouts
6. **State Management** - Track execution state

---

### Phase 2: HITL Integration (CRITICAL)

HITL is what makes GAFF production-ready.

**Must Implement:**
1. **HITL Node Detection** - Check if node uses `human_in_the_loop`
2. **Execution Pause** - Save state, pause execution
3. **Notification System** - Webhook, email, or UI notification
4. **Approval Storage** - Database or queue for approval requests
5. **Resume Logic** - Continue from saved state after approval
6. **Conditional Routing** - Route based on approval decision

---

### Phase 3: Quality-Check Integration

Quality assurance ensures reliable outputs.

**Must Implement:**
1. **Post-Execution Validation** - Call quality-check after execution
2. **Quality Scoring** - Implement scoring algorithms
3. **Rerun Strategy** - Implement partial/full/adaptive logic
4. **Rerun Execution** - Execute rerun strategies
5. **Max Attempts** - Prevent infinite rerun loops

---

### Phase 4: Advanced Features

1. **Parallel Execution** - Run independent nodes concurrently
2. **Conditional Branching** - Route based on conditions
3. **Result Caching** - Cache idempotent operations
4. **Performance Monitoring** - Track metrics, optimize
5. **Failure Pattern Analysis** - Learn from failures

---

## 💡 Key Design Decisions

### Why Quality-Check is Separate from Router

**Separation of Concerns:**
- **Router:** Execution engine, agent routing, state management
- **Quality-Check:** Validation logic, scoring algorithms, rerun strategies

This allows:
- Quality-check to be reused by other systems
- Independent development and testing
- Different scaling characteristics
- Clear responsibility boundaries

### Why Router Integrates with HITL Tool (Not Separate Server)

**HITL is a Tool, Not a Server:**
- HITL is provided by `gaff-tools` MCP server
- Router calls HITL like any other tool
- Router handles the pause/resume logic
- Simpler architecture, fewer moving parts

### Execution State Storage

**Current:** In-memory Map  
**Production:** Should use Redis or Database

**Reasons:**
- Persistence across restarts
- Support for distributed execution
- Scalability
- Audit trail

---

## 🚀 Next Steps

### Immediate Actions

1. **Review the Architecture**
   - Read `gaff/mcp/router/README.md`
   - Read `gaff/mcp/quality-check/README.md`
   - Understand execution flow

2. **Choose Infrastructure**
   - **State Storage:** Redis? PostgreSQL? MongoDB?
   - **Notifications:** Webhooks? Email (SendGrid)? Slack?
   - **Agent Communication:** HTTP REST? MCP stdio? gRPC?

3. **Implement Router Core**
   - Start with basic execution (no parallel, no HITL)
   - Implement agent routing (HTTP calls)
   - Add error handling
   - Test with simple graphs

4. **Implement HITL**
   - Add HITL node detection
   - Implement pause/resume
   - Add notification system
   - Test approval workflows

5. **Implement Quality-Check**
   - Implement scoring algorithms
   - Add rerun strategy logic
   - Integrate with router
   - Test quality workflows

---

## 📖 Documentation References

### Router Documentation
- **README:** `gaff/mcp/router/README.md` (600+ lines)
- **Source:** `gaff/mcp/router/src/index.ts` (400+ lines)
- **Package:** `gaff/mcp/router/package.json`

### Quality-Check Documentation
- **README:** `gaff/mcp/quality-check/README.md` (400+ lines)
- **Source:** `gaff/mcp/quality-check/src/index.ts` (400+ lines)
- **Package:** `gaff/mcp/quality-check/package.json`

### Updated Documentation
- **GAFF README:** `gaff/README.md` (updated with new components)
- **GAFF Config:** `gaff.json` (added quality-check & router to MCP servers)
- **Architecture:** `gaff/ARCHITECTURE.md` (needs update for router & quality-check)

---

## ✅ Summary

**Created Two Critical MCP Servers:**

1. **quality-check** - Validates execution quality, scores results, determines rerun strategies
2. **router** - Executes intent graphs, routes to agents, integrates with HITL and quality-check

**GAFF is Now Complete (Scaffolded):**
- ✅ All 6 MCP servers scaffolded with placeholder implementations
- ✅ All tools defined with input/output schemas
- ✅ Comprehensive documentation (2000+ lines total)
- ✅ Clear integration points defined
- ✅ Implementation priorities established

**What's Next:**
- Implement router core (execution engine)
- Implement HITL integration (user approval)
- Implement quality-check algorithms (scoring & rerun strategies)
- Test end-to-end workflows
- Deploy to production

**The Framework is Ready for Implementation! 🚀**

---

## 📧 Contact

**Author:** Sean Poyner  
**Email:** sean.poyner@pm.me  
**GitHub:** [@seanpoyner](https://github.com/seanpoyner)  
**Project:** [GAFF on GitHub](https://github.com/seanpoyner/gaff)


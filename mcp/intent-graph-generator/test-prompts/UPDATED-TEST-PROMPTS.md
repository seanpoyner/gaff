# ✅ Updated Test Prompts - IntentGraph Schema

All test prompts have been updated to use the correct IntentGraph schema format (`nodes`, `edges`, `execution_plan`) instead of custom schemas.

## Key Changes

### ❌ OLD (Custom Schema - Doesn't Work)
```json
{
  "output_schema": {
    "properties": {
      "workflow_nodes": { ... },
      "safety_checkpoints": { ... },
      "expected_outcomes": { ... }
    }
  }
}
```

### ✅ NEW (IntentGraph Schema - Works!)
```json
{
  "output_schema": {
    "properties": {
      "nodes": { ... },
      "edges": { ... },
      "execution_plan": { ... }
    },
    "required": ["nodes", "edges", "execution_plan"]
  }
}
```

## What Changed

1. **`output_schema`** - Now matches IntentGraph TypeScript interface
2. **`custom_prompt_template`** - Updated to instruct LLM to generate IntentGraph format
3. **`example_outputs`** - Now show actual IntentGraph JSON structure
4. **`generation_mode`** - Changed from `delegate_to_caller` to `use_configured_api`
5. **`options`** - Added `store_in_memory: true` and `validate: true`

## Node Structure

Each node must have:
```json
{
  "node_id": "unique_id",
  "agent_name": "AgentName",
  "agent_type": "llm|api|tool|validator",
  "node_type": "entry|processing|decision|exit",
  "purpose": "What this does",
  "instructions": "Detailed instructions for agent",
  "context": "Additional context agent needs",
  "input": ["input_data1", "input_data2"],
  "output": ["output_data1", "output_data2"],
  "configuration": {
    "timeout_ms": 30000,
    "retry_policy": {
      "max_attempts": 2,
      "backoff_strategy": "exponential",
      "backoff_ms": 1000
    }
  }
}
```

## Edge Structure

Each edge must have:
```json
{
  "from": "source_node_id",
  "to": "target_node_id",
  "edge_type": "sequential|conditional|parallel",
  "condition": "when_to_execute"
}
```

## Execution Plan Structure

```json
{
  "execution_plan": {
    "entry_points": ["entry_node_id"],
    "exit_points": ["exit_node_id"],
    "execution_strategy": "sequential|parallel|hybrid"
  }
}
```

## Testing Instructions

1. **Use the updated test prompts from the individual files**
2. **Generation mode is `use_configured_api`** - tool will generate automatically
3. **Memory storage enabled** - you'll get a memory key for fast reuse
4. **Validation enabled** - graph will be validated after generation

## All Updated Files

- ✅ `1-medical-diagnosis-system.md` - Medical diagnostic workflow
- ⏳ `2-fraud-detection-system.md` - Fraud detection investigation (updating next)
- ⏳ `3-content-publishing-system.md` - Content publishing workflow (updating next)
- ⏳ `4-smart-home-automation.md` - Smart home automation (updating next)
- ⏳ `5-research-literature-review.md` - Research workflow (updating next)

---

## Quick Test Command

Copy this to test the medical diagnosis workflow:

```json
{
  "tool": "intent-graph:generate_intent_graph",
  "params": {
    "orchestration_card": {
      /* Copy from 1-medical-diagnosis-system.md */
    },
    "options": {
      "generation_mode": "use_configured_api",
      "store_in_memory": true,
      "validate": true
    }
  }
}
```

Then visualize with memory key:

```json
{
  "tool": "intent-graph:visualize_graph",
  "params": {
    "graph_id": "intent_graph_medical_diagnostics_xyz",
    "options": {"style": "complete"}
  }
}
```

---

**Status:** Medical diagnosis prompt updated ✅ 

Working on the remaining 4 prompts now...


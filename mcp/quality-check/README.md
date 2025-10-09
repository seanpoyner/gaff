# quality-check MCP Server

> Quality validation, scoring, and automatic rerun strategy determination for GAFF workflows

**Part of [GAFF Framework](https://github.com/seanpoyner/gaff)** - Open-source AI agent orchestration  
**Status:** ✅ Production-Ready  
**Version:** 1.0.1  
**Pipeline Position:** Step 5 - Quality Validation & Rerun Strategy  
**Confluence:** [quality-check Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580458458)

**⭐ Recommended:** Use [gaff-gateway](../gaff-gateway/) to access this and all other GAFF servers through a single connection.

---

## Overview

The `quality-check` MCP server validates execution results from the router, calculates quality scores, determines if results meet acceptance criteria, and decides whether reruns are needed. This is the **quality assurance layer** that ensures GAFF workflows produce acceptable outputs.

## Features

✅ **Result Validation:** Comprehensive validation against quality criteria  
✅ **Quality Scoring:** 0-1 scale scoring with configurable thresholds (default 0.85)  
✅ **Completeness Checks:** Verify all required outputs are present  
✅ **Accuracy Verification:** Validate correctness of results  
✅ **Rerun Strategy:** Intelligent decisions on partial/full/adaptive reruns  
✅ **Failure Analysis:** Identify patterns and root causes  
🌐 **Gateway Compatible:** Accessible via gaff-gateway with `quality_*` prefix  

---

## Tools

### 1. `validate_execution_result`

**Purpose:** Validate the final result of an intent graph execution.

**Input:**
```typescript
{
  execution_result: object,           // Result from router.execute_graph
  quality_criteria: {
    completeness_required: boolean,
    accuracy_threshold: number,       // 0-1 scale
    required_fields: string[],
    custom_validators?: object[]
  },
  intent_graph: object,              // Original intent graph
  original_request: object           // Original user request
}
```

**Output:**
```typescript
{
  is_valid: boolean,
  quality_score: number,             // 0-1 scale
  is_acceptable: boolean,            // Based on threshold (default 0.85)
  issues: Array<{
    type: "missing_field" | "accuracy" | "format" | "custom",
    field: string,
    message: string,
    severity: "error" | "warning"
  }>,
  completeness_score: number,
  accuracy_score: number,
  rerun_required: boolean,
  rerun_nodes: string[],
  recommendations: string[]
}
```

---

### 2. `score_quality`

**Purpose:** Calculate quality score for execution results.

**Input:**
```typescript
{
  execution_result: object,
  scoring_criteria: {
    completeness_weight: number,     // Default 0.4
    accuracy_weight: number,         // Default 0.4
    performance_weight: number,      // Default 0.2
    custom_metrics?: object[]
  }
}
```

**Output:**
```typescript
{
  overall_score: number,             // 0-1 scale
  component_scores: {
    completeness: number,
    accuracy: number,
    performance: number,
    custom: number[]
  },
  grade: "excellent" | "good" | "acceptable" | "poor" | "failed",
  passing: boolean
}
```

---

### 3. `check_completeness`

**Purpose:** Verify all required outputs are present and properly formatted.

**Input:**
```typescript
{
  execution_result: object,
  required_outputs: {
    required_fields: string[],
    required_types: object,          // field -> expected type
    required_formats: object         // field -> format pattern
  }
}
```

**Output:**
```typescript
{
  is_complete: boolean,
  completeness_score: number,
  missing_fields: string[],
  type_mismatches: Array<{
    field: string,
    expected: string,
    actual: string
  }>,
  format_violations: Array<{
    field: string,
    expected_format: string,
    actual_value: string
  }>
}
```

---

### 4. `check_accuracy`

**Purpose:** Validate accuracy and correctness of results.

**Input:**
```typescript
{
  execution_result: object,
  accuracy_criteria: {
    validation_rules: object[],
    business_rules: object[],
    expected_ranges: object,
    cross_field_validations: object[]
  },
  reference_data?: object            // Optional reference for comparison
}
```

**Output:**
```typescript
{
  is_accurate: boolean,
  accuracy_score: number,
  rule_violations: Array<{
    rule: string,
    field: string,
    message: string,
    severity: "error" | "warning"
  }>,
  confidence: number
}
```

---

### 5. `determine_rerun_strategy`

**Purpose:** Intelligently decide the best rerun strategy based on failure analysis.

**Input:**
```typescript
{
  execution_result: object,
  validation_result: object,         // From validate_execution_result
  intent_graph: object,
  failure_history?: object[]         // Previous failures in this execution
}
```

**Output:**
```typescript
{
  rerun_required: boolean,
  strategy: "none" | "partial" | "full" | "adaptive",
  rerun_nodes: string[],             // Nodes to re-execute
  estimated_success_probability: number,
  reasoning: string,
  max_attempts_recommendation: number,
  alternative_approaches: string[]
}
```

**Strategies:**
- **none:** Result is acceptable, no rerun needed
- **partial:** Rerun only failed nodes and dependencies
- **full:** Rerun entire workflow (major issues detected)
- **adaptive:** Intelligently decide based on failure type and history

---

### 6. `analyze_failure_patterns`

**Purpose:** Identify patterns in failures to help improve workflows.

**Input:**
```typescript
{
  execution_history: object[],       // History of executions
  intent_graph: object,
  time_range?: {
    start: string,
    end: string
  }
}
```

**Output:**
```typescript
{
  patterns: Array<{
    pattern_type: "node_failure" | "timeout" | "quality_issue" | "dependency",
    frequency: number,
    affected_nodes: string[],
    root_cause_hypothesis: string,
    recommendation: string
  }>,
  most_common_failures: object[],
  success_rate: number,
  average_quality_score: number,
  improvement_suggestions: string[]
}
```

---

## Installation

```bash
cd gaff/mcp/quality-check
npm install
npm run build
```

## Usage

### Standalone
```bash
npm start
```

### In GAFF

The router calls quality-check after executing an intent graph:

```typescript
// Router execution flow
const executionResult = await router.execute_graph(intentGraph);

// Quality check
const qualityResult = await qualityCheck.validate_execution_result({
  execution_result: executionResult,
  quality_criteria: gaffConfig.quality_assurance,
  intent_graph: intentGraph,
  original_request: userRequest
});

// Rerun if needed
if (qualityResult.rerun_required) {
  const rerunStrategy = await qualityCheck.determine_rerun_strategy({
    execution_result: executionResult,
    validation_result: qualityResult,
    intent_graph: intentGraph
  });
  
  if (rerunStrategy.strategy === 'partial') {
    await router.rerun_nodes({
      graph: intentGraph,
      nodes_to_rerun: rerunStrategy.rerun_nodes
    });
  } else if (rerunStrategy.strategy === 'full') {
    await router.execute_graph(intentGraph);
  }
}
```

---

## Configuration

Set in `gaff.json`:

```json
{
  "quality_assurance": {
    "enabled": true,
    "auto_rerun_on_failure": true,
    "quality_threshold": 0.85,
    "max_rerun_attempts": 2,
    "validation_rules": [
      "completeness_check",
      "accuracy_verification",
      "consistency_check",
      "format_validation"
    ],
    "scoring_weights": {
      "completeness": 0.4,
      "accuracy": 0.4,
      "performance": 0.2
    },
    "rerun_strategies": {
      "partial": "Rerun only failed nodes",
      "full": "Rerun entire workflow",
      "adaptive": "Intelligently decide based on failure type"
    },
    "default_strategy": "adaptive"
  }
}
```

---

## Quality Scoring Algorithm

### Overall Quality Score Calculation

```
overall_score = (completeness_score * 0.4) + 
                (accuracy_score * 0.4) + 
                (performance_score * 0.2)
```

### Completeness Score
- All required fields present: 1.0
- Missing fields: -0.2 per missing field
- Type mismatches: -0.1 per mismatch

### Accuracy Score
- All validation rules pass: 1.0
- Rule violations: -0.15 per error, -0.05 per warning
- Business rule violations: -0.25 per violation

### Performance Score
- Execution time within budget: 1.0
- Over budget: score = budget / actual_time
- Token usage efficiency factor

### Grading Scale
- **0.95-1.0:** Excellent ⭐⭐⭐⭐⭐
- **0.85-0.94:** Good ⭐⭐⭐⭐
- **0.75-0.84:** Acceptable ⭐⭐⭐
- **0.60-0.74:** Poor ⭐⭐
- **<0.60:** Failed ⭐

---

## Rerun Strategy Decision Tree

```
Is quality_score >= threshold (0.85)?
  ├─ YES → No rerun needed
  └─ NO → Analyze failures
           ├─ Single node failed, others OK?
           │    └─ YES → Strategy: PARTIAL (rerun failed node + dependencies)
           ├─ Multiple independent nodes failed?
           │    └─ YES → Strategy: PARTIAL (rerun all failed nodes)
           ├─ Systemic issue (e.g., data source unavailable)?
           │    └─ YES → Strategy: FULL (rerun entire workflow)
           └─ Complex failure pattern?
                └─ YES → Strategy: ADAPTIVE (analyze and decide)
```

---

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

### Test
```bash
npm test
```

---

## Integration with Router

The router must:

1. **Execute the intent graph**
2. **Call quality-check** with results
3. **Check if rerun is needed**
4. **Execute rerun strategy** if quality is below threshold
5. **Repeat until:**
   - Quality threshold is met, OR
   - Max rerun attempts reached

**Pseudo-code:**
```typescript
let attempt = 0;
let result = null;
let qualityResult = null;

while (attempt < maxAttempts) {
  // Execute
  result = await router.execute_graph(graph);
  
  // Validate quality
  qualityResult = await qualityCheck.validate_execution_result({
    execution_result: result,
    quality_criteria: config.quality_assurance,
    intent_graph: graph
  });
  
  // Check if acceptable
  if (qualityResult.is_acceptable) {
    break; // Success!
  }
  
  // Determine rerun strategy
  const strategy = await qualityCheck.determine_rerun_strategy({
    execution_result: result,
    validation_result: qualityResult,
    intent_graph: graph
  });
  
  // Execute rerun
  if (strategy.strategy === 'partial') {
    await router.rerun_nodes(graph, strategy.rerun_nodes);
  } else if (strategy.strategy === 'full') {
    // Full rerun on next iteration
  } else {
    break; // No viable rerun strategy
  }
  
  attempt++;
}

return { result, qualityResult, attempts: attempt };
```

---

## License

MIT License - Copyright 2025 Sean Poyner

---

**Part of the [GAFF Framework](https://github.com/seanpoyner/gaff)**


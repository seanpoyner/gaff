# GAFF Quality & Safety Integration Architecture

## Overview

This document outlines how quality checks and safety protocols should be integrated into GAFF workflows at multiple levels.

## Current State (v1.3.8)

**Status**: Quality and safety are **standalone tools** that must be called manually.

**Limitations**:
- No automatic safety validation before execution
- No automatic quality checks after execution
- No built-in compliance enforcement
- Special requirements are free-text, not actionable
- Manual integration required for every workflow

---

## Proposed Architecture: 3-Tier Integration

### **Tier 1: Orchestration Card Level** (Pre-Planning)

Add structured quality/safety configuration to orchestration cards:

```json
{
  "user_request": { "description": "..." },
  "available_agents": [...],
  
  // NEW: Structured quality configuration
  "quality_requirements": {
    "enabled": true,
    "required_fields": ["transaction_id", "status", "amount"],
    "accuracy_threshold": 0.85,
    "completeness_required": true,
    "performance_sla_ms": 5000,
    "auto_validate": true,
    "rerun_strategy": "adaptive"
  },
  
  // NEW: Structured safety configuration
  "safety_requirements": {
    "enabled": true,
    "compliance_standards": ["GDPR", "PCI-DSS", "SOC2"],
    "guardrails": {
      "pii_detection": true,
      "content_filtering": true,
      "rate_limiting": true
    },
    "input_validation": {
      "max_size_bytes": 1000000,
      "allowed_formats": ["json", "xml"],
      "sanitize_input": true
    },
    "output_validation": {
      "mask_pii": true,
      "sanitize_output": true
    },
    "audit_logging": true
  },
  
  // ENHANCED: Make special_requirements actionable
  "special_requirements": {
    "compliance": ["PCI-DSS", "GDPR"],
    "security_level": "high",
    "data_classification": "sensitive",
    "encryption_required": true,
    "audit_trail_required": true
  }
}
```

### **Tier 2: Intent Graph Level** (Workflow Design)

Automatically inject quality/safety nodes into the intent graph:

#### **Example: Enhanced Intent Graph with Quality/Safety Nodes**

```json
{
  "nodes": [
    // Auto-injected safety node at entry
    {
      "node_id": "safety_input_validation",
      "agent_name": "InputValidator",
      "node_type": "processing",
      "purpose": "Validate and sanitize input data",
      "auto_generated": true,
      "safety_config": {
        "pii_detection": true,
        "max_size_bytes": 1000000
      }
    },
    
    // Auto-injected compliance check
    {
      "node_id": "compliance_check",
      "agent_name": "ComplianceValidator",
      "node_type": "processing",
      "purpose": "Verify GDPR/PCI-DSS compliance",
      "auto_generated": true,
      "compliance_standards": ["GDPR", "PCI-DSS"]
    },
    
    // User's actual workflow nodes
    {
      "node_id": "data_fetcher",
      "agent_name": "DataFetcher",
      "node_type": "processing",
      "purpose": "Fetch customer data"
    },
    {
      "node_id": "data_analyzer",
      "agent_name": "DataAnalyzer",
      "node_type": "processing",
      "purpose": "Analyze the data"
    },
    
    // Auto-injected quality check at exit
    {
      "node_id": "quality_validator",
      "agent_name": "QualityChecker",
      "node_type": "processing",
      "purpose": "Validate execution quality",
      "auto_generated": true,
      "quality_config": {
        "accuracy_threshold": 0.85,
        "required_fields": ["transaction_id", "status"]
      }
    },
    
    // Auto-injected safety output validation
    {
      "node_id": "safety_output_validation",
      "agent_name": "OutputValidator",
      "node_type": "exit",
      "purpose": "Sanitize and validate output",
      "auto_generated": true,
      "safety_config": {
        "mask_pii": true,
        "sanitize_output": true
      }
    },
    
    // Auto-injected audit logging
    {
      "node_id": "audit_logger",
      "agent_name": "AuditLogger",
      "node_type": "exit",
      "purpose": "Log execution for compliance",
      "auto_generated": true
    }
  ],
  "edges": [
    { "from_node": "safety_input_validation", "to_node": "compliance_check" },
    { "from_node": "compliance_check", "to_node": "data_fetcher" },
    { "from_node": "data_fetcher", "to_node": "data_analyzer" },
    { "from_node": "data_analyzer", "to_node": "quality_validator" },
    { "from_node": "quality_validator", "to_node": "safety_output_validation" },
    { "from_node": "safety_output_validation", "to_node": "audit_logger" }
  ]
}
```

### **Tier 3: Router/Execution Level** (Runtime)

Add hooks for automatic quality/safety enforcement during execution:

#### **Enhanced Router Execution Flow**

```javascript
async function executeGraph(intentGraph, config) {
  const executionId = generateId();
  
  // 1. PRE-EXECUTION SAFETY CHECKS
  if (config.safety_requirements?.enabled) {
    const inputValidation = await callSafetyServer('validate_input', {
      input_data: config.input,
      validation_rules: config.safety_requirements.input_validation
    });
    
    if (!inputValidation.is_valid) {
      return { status: 'failed', reason: 'input_validation_failed', errors: inputValidation.errors };
    }
    
    const complianceCheck = await callSafetyServer('validate_compliance', {
      orchestration_card: config.orchestration_card,
      compliance_requirements: config.safety_requirements.compliance_standards
    });
    
    if (!complianceCheck.is_compliant) {
      return { status: 'failed', reason: 'compliance_violation', violations: complianceCheck.violations };
    }
  }
  
  // 2. EXECUTE WORKFLOW
  const result = await executeNodes(intentGraph);
  
  // 3. POST-EXECUTION QUALITY CHECKS
  if (config.quality_requirements?.enabled && config.quality_requirements.auto_validate) {
    const qualityValidation = await callQualityServer('validate_execution_result', {
      execution_result: result,
      quality_criteria: config.quality_requirements
    });
    
    // 4. AUTOMATIC RERUN IF QUALITY FAILS
    if (qualityValidation.rerun_required && config.quality_requirements.rerun_strategy !== 'none') {
      const rerunStrategy = await callQualityServer('determine_rerun_strategy', {
        execution_result: result,
        validation_result: qualityValidation,
        intent_graph: intentGraph
      });
      
      if (rerunStrategy.strategy === 'partial') {
        result = await rerunNodes(intentGraph, rerunStrategy.rerun_nodes);
      } else if (rerunStrategy.strategy === 'full') {
        result = await executeGraph(intentGraph, config); // Full rerun
      }
    }
  }
  
  // 5. POST-EXECUTION SAFETY CHECKS
  if (config.safety_requirements?.enabled) {
    const outputValidation = await callSafetyServer('validate_output', {
      output_data: result,
      validation_rules: config.safety_requirements.output_validation
    });
    
    if (outputValidation.sanitized_output) {
      result = outputValidation.sanitized_output; // Use sanitized version
    }
    
    // Automatic audit logging
    if (config.safety_requirements.audit_logging) {
      await callSafetyServer('audit_log', {
        event_type: 'workflow_execution',
        user_id: config.context.user_id,
        action: 'execute_graph',
        metadata: {
          execution_id: executionId,
          quality_score: qualityValidation?.quality_score,
          compliance_standards: config.safety_requirements.compliance_standards
        }
      });
    }
  }
  
  return result;
}
```

---

## Implementation Plan

### **Phase 1: Schema Enhancement** (1-2 days)

1. Update `orchestration-card-schema.json` with `quality_requirements` and `safety_requirements`
2. Update TypeScript types in `types.ts`
3. Update `agent-orchestration` to accept new fields

### **Phase 2: Graph Auto-Injection** (2-3 days)

1. Modify `intent-graph-generator` to inject quality/safety nodes
2. Add `auto_generated: true` flag to injected nodes
3. Update graph validation to recognize safety/quality nodes
4. Add configuration to enable/disable auto-injection

### **Phase 3: Router Integration** (2-3 days)

1. Add pre-execution safety hooks to router
2. Add post-execution quality hooks
3. Implement automatic rerun logic
4. Add audit logging integration

### **Phase 4: UI/UX Updates** (1-2 days)

1. Update `openai-adapter.js` to show quality/safety status
2. Add quality score to response
3. Show compliance status
4. Display rerun information if applicable

---

## Configuration Examples

### **Example 1: High-Security Payment Processing**

```json
{
  "quality_requirements": {
    "enabled": true,
    "accuracy_threshold": 0.95,
    "completeness_required": true,
    "required_fields": ["transaction_id", "status", "amount", "timestamp"],
    "auto_validate": true,
    "rerun_strategy": "adaptive",
    "max_rerun_attempts": 2
  },
  "safety_requirements": {
    "enabled": true,
    "compliance_standards": ["PCI-DSS", "SOC2"],
    "guardrails": {
      "pii_detection": true,
      "content_filtering": false,
      "rate_limiting": true
    },
    "input_validation": {
      "max_size_bytes": 100000,
      "required_fields": ["customer_id", "amount", "payment_method"]
    },
    "output_validation": {
      "mask_pii": true,
      "required_fields": ["transaction_id", "status"]
    },
    "audit_logging": true
  }
}
```

### **Example 2: Data Analysis Workflow**

```json
{
  "quality_requirements": {
    "enabled": true,
    "accuracy_threshold": 0.80,
    "auto_validate": true,
    "performance_sla_ms": 10000,
    "scoring_weights": {
      "completeness": 0.3,
      "accuracy": 0.5,
      "performance": 0.2
    }
  },
  "safety_requirements": {
    "enabled": true,
    "compliance_standards": ["GDPR"],
    "guardrails": {
      "pii_detection": true
    },
    "audit_logging": false
  }
}
```

---

## Benefits

### **For Developers:**
✅ No manual quality/safety calls
✅ Consistent governance across all workflows
✅ Automatic compliance enforcement
✅ Built-in error recovery

### **For Operations:**
✅ Audit trails by default
✅ Quality metrics collection
✅ Compliance validation
✅ Automatic issue detection

### **For End Users:**
✅ Higher quality results
✅ Safer data handling
✅ Compliance guarantees
✅ Better error messages

---

## Migration Path

### **Backward Compatibility:**

```json
{
  // OLD: Still supported
  "special_requirements": [
    "Must comply with PCI-DSS",
    "GDPR compliance required"
  ],
  "constraints": {
    "required_validation": true
  },
  
  // NEW: Structured configuration (takes precedence)
  "quality_requirements": { "enabled": true },
  "safety_requirements": { 
    "enabled": true,
    "compliance_standards": ["PCI-DSS", "GDPR"]
  }
}
```

**Migration Strategy:**
1. Parse `special_requirements` for known patterns
2. Auto-convert to structured format
3. Deprecate old fields after 6 months
4. Provide migration tool

---

## Open Questions

1. **Should quality/safety nodes be visible in visualizations?**
   - Pro: Transparency, debugging
   - Con: Cluttered graphs
   - Proposal: Make them collapsible/hideable

2. **How to handle quality failures?**
   - Fail fast vs. automatic rerun
   - Proposal: Configurable via `quality_requirements.rerun_strategy`

3. **Performance impact?**
   - Additional nodes = more latency
   - Proposal: Make all checks optional, profile performance

4. **Cost impact?**
   - More LLM calls for quality checks
   - Proposal: Add cost estimates, allow budget limits

---

## References

- [Orchestration Card Schema](../../mcp/intent-graph-generator/schemas/orchestration-card-schema.json)
- [Quality Check MCP Server](../../mcp/quality-check/README.md)
- [Safety Protocols MCP Server](../../mcp/safety-protocols/README.md)
- [Router Implementation](../../mcp/router/README.md)

---

**Status**: Proposed Architecture (Not Yet Implemented)
**Version**: 1.0
**Last Updated**: 2025-10-07
**Author**: Claude (with Sean Poyner)



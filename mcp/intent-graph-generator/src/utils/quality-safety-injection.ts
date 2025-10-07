/**
 * Quality & Safety Node Injection Utility
 * 
 * Automatically injects quality validation and safety protocol nodes
 * into intent graphs based on orchestration card requirements.
 */

import {
  IntentGraph,
  IntentGraphNode,
  OrchestrationCard,
  NodeType,
  EdgeType
} from '../types.js';

/**
 * Inject quality and safety nodes into an intent graph
 */
export function injectQualityAndSafetyNodes(
  graph: IntentGraph,
  orchestrationCard: OrchestrationCard
): IntentGraph {
  const qualityReqs = orchestrationCard.quality_requirements;
  const safetyReqs = orchestrationCard.safety_requirements;
  
  // Skip injection if both are disabled
  if (!qualityReqs?.enabled && !safetyReqs?.enabled) {
    return graph;
  }

  const injectedGraph: IntentGraph = {
    nodes: [...graph.nodes],
    edges: [...graph.edges],
    execution_plan: { ...graph.execution_plan }
  };

  const originalEntryPoints = [...graph.execution_plan.entry_points];
  const originalExitPoints = [...graph.execution_plan.exit_points];

  // Track new entry and exit points
  let newEntryPoint: string | null = null;
  let newExitPoint: string | null = null;

  // ========================================
  // INJECT SAFETY NODES (Entry)
  // ========================================
  if (safetyReqs?.enabled) {
    // 1. Input Validation Node
    if (safetyReqs.input_validation) {
      const inputValidationNode: IntentGraphNode = {
        node_id: '_safety_input_validation',
        agent_name: 'SafetyInputValidator',
        agent_type: 'validator',
        node_type: 'entry' as NodeType,
        purpose: 'Validate and sanitize input data for safety compliance',
        instructions: `Validate input data against safety requirements:
- Maximum size: ${safetyReqs.input_validation.max_size_bytes || 1000000} bytes
- Required fields: ${safetyReqs.input_validation.required_fields?.join(', ') || 'none'}
- Sanitize input: ${safetyReqs.input_validation.sanitize_input !== false}`,
        inputs: {
          input_data: {
            source: 'request',
            source_type: 'request',
            required: true
          },
          validation_rules: {
            source: JSON.stringify(safetyReqs.input_validation),
            source_type: 'constant',
            required: true
          }
        },
        outputs: [
          { name: 'is_valid', type: 'boolean', description: 'Whether input is valid' },
          { name: 'errors', type: 'array', description: 'Validation errors if any' },
          { name: 'sanitized_input', type: 'object', description: 'Sanitized input data' }
        ],
        metadata: {
          tags: ['auto-injected', 'safety', 'input-validation'],
          priority: 'critical'
        }
      };

      injectedGraph.nodes.unshift(inputValidationNode);
      newEntryPoint = '_safety_input_validation';
    }

    // 2. Compliance Check Node
    if (safetyReqs.compliance_standards && safetyReqs.compliance_standards.length > 0) {
      const complianceNode: IntentGraphNode = {
        node_id: '_safety_compliance_check',
        agent_name: 'ComplianceValidator',
        agent_type: 'validator',
        node_type: 'processing' as NodeType,
        purpose: `Verify compliance with ${safetyReqs.compliance_standards.join(', ')}`,
        instructions: `Check workflow compliance against: ${safetyReqs.compliance_standards.join(', ')}`,
        inputs: {
          orchestration_card: {
            source: JSON.stringify(orchestrationCard),
            source_type: 'constant',
            required: true
          },
          compliance_requirements: {
            source: JSON.stringify(safetyReqs.compliance_standards),
            source_type: 'constant',
            required: true
          }
        },
        outputs: [
          { name: 'is_compliant', type: 'boolean', description: 'Whether workflow is compliant' },
          { name: 'violations', type: 'array', description: 'Compliance violations if any' },
          { name: 'compliance_score', type: 'number', description: 'Compliance score 0-1' }
        ],
        metadata: {
          tags: ['auto-injected', 'safety', 'compliance'],
          priority: 'critical'
        }
      };

      const previousEntryNode = newEntryPoint || originalEntryPoints[0];
      injectedGraph.nodes.splice(
        injectedGraph.nodes.findIndex(n => n.node_id === previousEntryNode) + 1,
        0,
        complianceNode
      );

      // Connect compliance check
      if (newEntryPoint) {
        injectedGraph.edges.push({
          edge_id: `_edge_${newEntryPoint}_to_compliance`,
          from_node: newEntryPoint,
          to_node: '_safety_compliance_check',
          edge_type: 'sequential' as EdgeType
        });
      }

      // Update to make compliance check the new entry connector
      const complianceCheckIndex = injectedGraph.nodes.findIndex(n => n.node_id === '_safety_compliance_check');
      if (complianceCheckIndex > 0) {
        newEntryPoint = '_safety_compliance_check';
      }
    }

    // Connect safety nodes to original entry points
    if (newEntryPoint) {
      for (const originalEntry of originalEntryPoints) {
        injectedGraph.edges.push({
          edge_id: `_edge_safety_to_${originalEntry}`,
          from_node: newEntryPoint,
          to_node: originalEntry,
          edge_type: 'sequential' as EdgeType
        });
      }
    }
  }

  // ========================================
  // INJECT QUALITY NODES (Exit)
  // ========================================
  if (qualityReqs?.enabled && qualityReqs.auto_validate) {
    // 1. Quality Validation Node
    const qualityNode: IntentGraphNode = {
      node_id: '_quality_validator',
      agent_name: 'QualityValidator',
      agent_type: 'validator',
      node_type: 'processing' as NodeType,
      purpose: 'Validate execution quality and determine if rerun is needed',
      instructions: `Validate execution results against quality requirements:
- Accuracy threshold: ${qualityReqs.accuracy_threshold || 0.85}
- Completeness required: ${qualityReqs.completeness_required !== false}
- Required fields: ${qualityReqs.required_fields?.join(', ') || 'none'}
- Rerun strategy: ${qualityReqs.rerun_strategy || 'adaptive'}`,
      inputs: {
        execution_result: {
          source: '${workflow_result}',
          source_type: 'context',
          required: true
        },
        quality_criteria: {
          source: JSON.stringify({
            accuracy_threshold: qualityReqs.accuracy_threshold || 0.85,
            completeness_required: qualityReqs.completeness_required !== false,
            required_fields: qualityReqs.required_fields || []
          }),
          source_type: 'constant',
          required: true
        }
      },
      outputs: [
        { name: 'is_acceptable', type: 'boolean', description: 'Whether quality is acceptable' },
        { name: 'quality_score', type: 'number', description: 'Overall quality score 0-1' },
        { name: 'rerun_required', type: 'boolean', description: 'Whether rerun is needed' },
        { name: 'issues', type: 'array', description: 'Quality issues found' }
      ],
      metadata: {
        tags: ['auto-injected', 'quality', 'validation'],
        priority: 'high'
      }
    };

    // Connect original exit points to quality validator
    for (const originalExit of originalExitPoints) {
      injectedGraph.edges.push({
        edge_id: `_edge_${originalExit}_to_quality`,
        from_node: originalExit,
        to_node: '_quality_validator',
        edge_type: 'sequential' as EdgeType
      });
    }

    injectedGraph.nodes.push(qualityNode);
    newExitPoint = '_quality_validator';
  }

  // ========================================
  // INJECT SAFETY NODES (Exit)
  // ========================================
  if (safetyReqs?.enabled) {
    // 1. Output Validation Node
    if (safetyReqs.output_validation) {
      const outputValidationNode: IntentGraphNode = {
        node_id: '_safety_output_validation',
        agent_name: 'SafetyOutputValidator',
        agent_type: 'validator',
        node_type: 'processing' as NodeType,
        purpose: 'Sanitize and validate output data for safety compliance',
        instructions: `Validate output data against safety requirements:
- Mask PII: ${safetyReqs.output_validation.mask_pii !== false}
- Sanitize output: ${safetyReqs.output_validation.sanitize_output !== false}
- Required fields: ${safetyReqs.output_validation.required_fields?.join(', ') || 'none'}`,
        inputs: {
          output_data: {
            source: newExitPoint ? `\${${newExitPoint}.result}` : '${workflow_result}',
            source_type: 'node_output',
            source_node: newExitPoint || originalExitPoints[0],
            required: true
          },
          validation_rules: {
            source: JSON.stringify(safetyReqs.output_validation),
            source_type: 'constant',
            required: true
          }
        },
        outputs: [
          { name: 'is_valid', type: 'boolean', description: 'Whether output is valid' },
          { name: 'sanitized_output', type: 'object', description: 'Sanitized output data' },
          { name: 'errors', type: 'array', description: 'Validation errors if any' }
        ],
        metadata: {
          tags: ['auto-injected', 'safety', 'output-validation'],
          priority: 'high'
        }
      };

      if (newExitPoint) {
        injectedGraph.edges.push({
          edge_id: `_edge_${newExitPoint}_to_output_validation`,
          from_node: newExitPoint,
          to_node: '_safety_output_validation',
          edge_type: 'sequential' as EdgeType
        });
      }

      injectedGraph.nodes.push(outputValidationNode);
      newExitPoint = '_safety_output_validation';
    }

    // 2. Audit Logging Node
    if (safetyReqs.audit_logging) {
      const auditNode: IntentGraphNode = {
        node_id: '_safety_audit_logger',
        agent_name: 'AuditLogger',
        agent_type: 'tool',
        node_type: 'exit' as NodeType,
        purpose: 'Log execution for compliance audit trail',
        instructions: 'Create audit log entry for workflow execution',
        inputs: {
          event_type: {
            source: 'workflow_execution',
            source_type: 'constant',
            required: true
          },
          user_id: {
            source: orchestrationCard.context?.user_id || 'unknown',
            source_type: 'constant',
            required: true
          },
          action: {
            source: 'execute_intent_graph',
            source_type: 'constant',
            required: true
          },
          metadata: {
            source: newExitPoint ? `\${${newExitPoint}}` : '${workflow_result}',
            source_type: 'node_output',
            source_node: newExitPoint || originalExitPoints[0],
            required: true
          }
        },
        outputs: [
          { name: 'log_id', type: 'string', description: 'Audit log identifier' },
          { name: 'timestamp', type: 'string', description: 'Log timestamp' },
          { name: 'status', type: 'string', description: 'Log status' }
        ],
        metadata: {
          tags: ['auto-injected', 'safety', 'audit'],
          priority: 'normal'
        }
      };

      if (newExitPoint) {
        injectedGraph.edges.push({
          edge_id: `_edge_${newExitPoint}_to_audit`,
          from_node: newExitPoint,
          to_node: '_safety_audit_logger',
          edge_type: 'sequential' as EdgeType
        });
      }

      injectedGraph.nodes.push(auditNode);
      newExitPoint = '_safety_audit_logger';
    }
  }

  // ========================================
  // UPDATE EXECUTION PLAN
  // ========================================
  if (newEntryPoint) {
    injectedGraph.execution_plan.entry_points = [newEntryPoint];
  }
  
  if (newExitPoint) {
    injectedGraph.execution_plan.exit_points = [newExitPoint];
  }

  console.error(`[Quality/Safety Injection] Injected ${injectedGraph.nodes.length - graph.nodes.length} nodes`);
  console.error(`[Quality/Safety Injection] New entry: ${newEntryPoint || 'unchanged'}`);
  console.error(`[Quality/Safety Injection] New exit: ${newExitPoint || 'unchanged'}`);

  return injectedGraph;
}

/**
 * Check if a node is auto-injected
 */
export function isAutoInjectedNode(node: IntentGraphNode): boolean {
  return node.metadata?.tags?.includes('auto-injected') || node.node_id.startsWith('_');
}

/**
 * Get all auto-injected nodes from a graph
 */
export function getAutoInjectedNodes(graph: IntentGraph): IntentGraphNode[] {
  return graph.nodes.filter(isAutoInjectedNode);
}

/**
 * Remove all auto-injected nodes from a graph
 */
export function removeAutoInjectedNodes(graph: IntentGraph): IntentGraph {
  const autoInjectedIds = new Set(
    graph.nodes.filter(isAutoInjectedNode).map(n => n.node_id)
  );

  return {
    nodes: graph.nodes.filter(n => !autoInjectedIds.has(n.node_id)),
    edges: graph.edges.filter(
      e => !autoInjectedIds.has(e.from_node) && !autoInjectedIds.has(e.to_node)
    ),
    execution_plan: graph.execution_plan
  };
}


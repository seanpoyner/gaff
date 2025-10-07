/**
 * Quality & Safety Hooks for Router
 * 
 * Provides pre-execution safety validation and post-execution quality checks
 * with automatic rerun capabilities.
 */

import { spawn } from 'child_process';

export interface QualityRequirements {
  enabled?: boolean;
  required_fields?: string[];
  accuracy_threshold?: number;
  completeness_required?: boolean;
  auto_validate?: boolean;
  rerun_strategy?: 'none' | 'partial' | 'full' | 'adaptive';
  max_rerun_attempts?: number;
}

export interface SafetyRequirements {
  enabled?: boolean;
  compliance_standards?: string[];
  input_validation?: {
    max_size_bytes?: number;
    required_fields?: string[];
    sanitize_input?: boolean;
  };
  output_validation?: {
    mask_pii?: boolean;
    sanitize_output?: boolean;
    required_fields?: string[];
  };
  audit_logging?: boolean;
}

interface SafetyValidationResult {
  passed: boolean;
  errors: string[];
  sanitized_data?: any;
}

interface QualityValidationResult {
  is_acceptable: boolean;
  quality_score: number;
  rerun_required: boolean;
  rerun_nodes?: string[];
  issues: any[];
}

/**
 * Pre-execution safety validation
 */
export async function validateSafetyPre(
  inputData: any,
  safetyReqs: SafetyRequirements,
  orchestrationCard?: any
): Promise<SafetyValidationResult> {
  const errors: string[] = [];
  
  if (!safetyReqs.enabled) {
    return { passed: true, errors: [] };
  }

  // Input validation
  if (safetyReqs.input_validation) {
    const dataSize = JSON.stringify(inputData).length;
    const maxSize = safetyReqs.input_validation.max_size_bytes || 1000000;
    
    if (dataSize > maxSize) {
      errors.push(`Input size ${dataSize} bytes exceeds maximum ${maxSize} bytes`);
    }

    // Check required fields
    if (safetyReqs.input_validation.required_fields) {
      for (const field of safetyReqs.input_validation.required_fields) {
        if (!inputData[field]) {
          errors.push(`Required input field missing: ${field}`);
        }
      }
    }
  }

  // Compliance validation
  if (safetyReqs.compliance_standards && safetyReqs.compliance_standards.length > 0) {
    try {
      const complianceResult = await callSafetyMCP('validate_compliance', {
        orchestration_card: orchestrationCard || {},
        compliance_requirements: safetyReqs.compliance_standards
      });

      if (!complianceResult.is_compliant) {
        errors.push(...complianceResult.violations.map((v: any) => `Compliance violation: ${v}`));
      }
    } catch (error) {
      console.error('[Safety] Compliance check failed:', error);
      errors.push(`Compliance check error: ${error}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    sanitized_data: safetyReqs.input_validation?.sanitize_input ? inputData : undefined
  };
}

/**
 * Post-execution quality validation
 */
export async function validateQualityPost(
  executionResult: any,
  qualityReqs: QualityRequirements,
  intentGraph?: any
): Promise<QualityValidationResult> {
  if (!qualityReqs.enabled || !qualityReqs.auto_validate) {
    return {
      is_acceptable: true,
      quality_score: 1.0,
      rerun_required: false,
      issues: []
    };
  }

  try {
    const validationResult = await callQualityMCP('validate_execution_result', {
      execution_result: executionResult,
      quality_criteria: {
        accuracy_threshold: qualityReqs.accuracy_threshold || 0.85,
        completeness_required: qualityReqs.completeness_required !== false,
        required_fields: qualityReqs.required_fields || []
      },
      intent_graph: intentGraph
    });

    return {
      is_acceptable: validationResult.is_acceptable || false,
      quality_score: validationResult.quality_score || 0,
      rerun_required: validationResult.rerun_required || false,
      rerun_nodes: validationResult.rerun_nodes || [],
      issues: validationResult.issues || []
    };
  } catch (error) {
    console.error('[Quality] Validation failed:', error);
    return {
      is_acceptable: false,
      quality_score: 0,
      rerun_required: false,
      issues: [{ type: 'validation_error', message: String(error) }]
    };
  }
}

/**
 * Post-execution safety validation (output)
 */
export async function validateSafetyPost(
  outputData: any,
  safetyReqs: SafetyRequirements
): Promise<SafetyValidationResult> {
  const errors: string[] = [];
  
  if (!safetyReqs.enabled || !safetyReqs.output_validation) {
    return { passed: true, errors: [] };
  }

  try {
    const validationResult = await callSafetyMCP('validate_output', {
      output_data: outputData,
      validation_rules: safetyReqs.output_validation
    });

    if (!validationResult.is_valid) {
      errors.push(...validationResult.errors.map((e: any) => `Output validation: ${e}`));
    }

    return {
      passed: errors.length === 0,
      errors,
      sanitized_data: validationResult.sanitized_output
    };
  } catch (error) {
    console.error('[Safety] Output validation failed:', error);
    return {
      passed: false,
      errors: [`Output validation error: ${error}`]
    };
  }
}

/**
 * Create audit log entry
 */
export async function logAuditEntry(
  executionId: string,
  userId: string,
  qualityScore?: number,
  complianceStandards?: string[]
): Promise<void> {
  try {
    await callSafetyMCP('audit_log', {
      event_type: 'workflow_execution',
      user_id: userId,
      action: 'execute_intent_graph',
      metadata: {
        execution_id: executionId,
        quality_score: qualityScore,
        compliance_standards: complianceStandards,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Safety] Audit logging failed:', error);
  }
}

/**
 * Helper: Call quality-check MCP server
 */
async function callQualityMCP(toolName: string, args: any): Promise<any> {
  return callMCPServer('quality-check-mcp-server', toolName, args);
}

/**
 * Helper: Call safety-protocols MCP server
 */
async function callSafetyMCP(toolName: string, args: any): Promise<any> {
  return callMCPServer('safety-protocols-mcp-server', toolName, args);
}

/**
 * Generic MCP server call via npx
 */
async function callMCPServer(packageName: string, toolName: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['-y', packageName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn ${packageName}: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${packageName} exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse JSON-RPC responses from stdout
        const lines = stdout.split('\n').filter(l => l.trim() && l.includes('"jsonrpc"'));
        if (lines.length === 0) {
          reject(new Error(`No JSON-RPC response from ${packageName}`));
          return;
        }

        const lastLine = lines[lines.length - 1];
        const response = JSON.parse(lastLine);

        if (response.error) {
          reject(new Error(response.error.message || 'MCP server error'));
          return;
        }

        if (response.result && response.result.content) {
          const content = response.result.content[0];
          if (content.type === 'text') {
            resolve(JSON.parse(content.text));
            return;
          }
        }

        resolve(response.result);
      } catch (error) {
        reject(new Error(`Failed to parse ${packageName} response: ${error}`));
      }
    });

    // Send JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      reject(new Error(`${packageName} timed out after 30s`));
    }, 30000);
  });
}



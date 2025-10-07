/**
 * Orchestration Card Validation
 * 
 * Validate orchestration card structure and content
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { GaffConfig, validateAgentsExist } from './gaff-config.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate orchestration card structure
 */
export function validateOrchestrationCard(
  card: any,
  gaffConfig?: GaffConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required top-level fields
  if (!card.user_request) {
    errors.push('Missing required field: user_request');
  } else {
    if (!card.user_request.description) {
      errors.push('Missing user_request.description');
    }
  }
  
  if (!card.available_agents || !Array.isArray(card.available_agents)) {
    errors.push('Missing or invalid field: available_agents (must be array)');
  } else if (card.available_agents.length === 0) {
    warnings.push('No agents specified in available_agents');
  }
  
  // Validate agents
  if (card.available_agents && Array.isArray(card.available_agents)) {
    card.available_agents.forEach((agent: any, index: number) => {
      if (!agent.name) {
        errors.push(`Agent at index ${index} missing required field: name`);
      }
      if (!agent.type) {
        errors.push(`Agent at index ${index} missing required field: type`);
      }
      if (!agent.capabilities || !Array.isArray(agent.capabilities)) {
        errors.push(`Agent ${agent.name || index} missing required field: capabilities`);
      }
      if (!agent.input_schema) {
        warnings.push(`Agent ${agent.name || index} missing input_schema`);
      }
      if (!agent.output_schema) {
        warnings.push(`Agent ${agent.name || index} missing output_schema`);
      }
    });
  }
  
  // Validate against gaff.json if provided
  if (gaffConfig && card.available_agents) {
    const agentNames = card.available_agents
      .filter((a: any) => a.name)
      .map((a: any) => a.name);
    
    const validation = validateAgentsExist(gaffConfig, agentNames);
    if (!validation.valid) {
      warnings.push(`Agents not found in gaff.json: ${validation.missing.join(', ')}`);
    }
  }
  
  // Validate constraints if present
  if (card.constraints) {
    if (card.constraints.max_execution_time_ms && 
        typeof card.constraints.max_execution_time_ms !== 'number') {
      errors.push('constraints.max_execution_time_ms must be a number');
    }
    if (card.constraints.max_cost_per_execution && 
        typeof card.constraints.max_cost_per_execution !== 'number') {
      errors.push('constraints.max_cost_per_execution must be a number');
    }
  }
  
  // Validate preferences if present
  if (card.preferences) {
    const validOptimizations = ['speed', 'cost', 'reliability', 'balanced'];
    if (card.preferences.optimize_for && 
        !validOptimizations.includes(card.preferences.optimize_for)) {
      errors.push(`Invalid preferences.optimize_for: must be one of ${validOptimizations.join(', ')}`);
    }
    
    const validParallelization = ['none', 'conservative', 'balanced', 'aggressive'];
    if (card.preferences.parallelization && 
        !validParallelization.includes(card.preferences.parallelization)) {
      errors.push(`Invalid preferences.parallelization: must be one of ${validParallelization.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize orchestration card (remove invalid fields, apply defaults)
 */
export function sanitizeOrchestrationCard(card: any): any {
  const sanitized = { ...card };
  
  // Apply default constraints if missing
  if (!sanitized.constraints) {
    sanitized.constraints = {};
  }
  sanitized.constraints = {
    max_execution_time_ms: 300000,
    max_cost_per_execution: 10.0,
    max_retries: 3,
    ...sanitized.constraints,
  };
  
  // Apply default preferences if missing
  if (!sanitized.preferences) {
    sanitized.preferences = {};
  }
  sanitized.preferences = {
    optimize_for: 'balanced',
    parallelization: 'balanced',
    ...sanitized.preferences,
  };
  
  // Ensure user_request has required fields
  if (sanitized.user_request && !sanitized.user_request.success_criteria) {
    sanitized.user_request.success_criteria = [];
  }
  
  return sanitized;
}


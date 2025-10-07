/**
 * GAFF Configuration Utilities
 * 
 * Load and manage gaff.json configuration
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface GaffAgent {
  type: string;
  description: string;
  capabilities: string[];
  endpoint?: string;
  authentication?: string;
  timeout_ms?: number;
  retry_policy?: {
    max_attempts?: number;
    backoff_strategy?: string;
  };
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  model?: string;
  temperature?: number;
}

export interface GaffConfig {
  version: string;
  name: string;
  description?: string;
  primary_agent?: any;
  agents: Record<string, GaffAgent>;
  models?: Record<string, any>;
  protocols?: any;
  schemas?: Record<string, string>;
  context?: any;
  constraints?: any;
  quality_assurance?: any;
  safety_protocols?: any;
  instructions?: any;
  metadata?: any;
}

/**
 * Load gaff.json from file or provided object
 */
export function loadGaffConfig(configOrPath?: any): GaffConfig {
  // If config object provided, return it
  if (configOrPath && typeof configOrPath === 'object' && configOrPath.agents) {
    return configOrPath as GaffConfig;
  }
  
  // Otherwise load from file
  const configPath = typeof configOrPath === 'string' 
    ? configOrPath 
    : process.env.GAFF_CONFIG_PATH || resolve(process.cwd(), 'gaff.json');
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as GaffConfig;
  } catch (error) {
    console.error(`Failed to load gaff.json from ${configPath}:`, error);
    throw new Error(`Could not load GAFF configuration from ${configPath}`);
  }
}

/**
 * Get list of agents with optional filters
 */
export function listAgents(
  config: GaffConfig,
  filters?: {
    capabilities?: string[];
    type?: string;
  }
): Array<{ name: string; agent: GaffAgent }> {
  const agents = Object.entries(config.agents);
  
  if (!filters) {
    return agents.map(([name, agent]) => ({ name, agent }));
  }
  
  return agents
    .filter(([_name, agent]) => {
      // Filter by type
      if (filters.type && agent.type !== filters.type) {
        return false;
      }
      
      // Filter by capabilities
      if (filters.capabilities && filters.capabilities.length > 0) {
        const hasAllCapabilities = filters.capabilities.every(cap =>
          agent.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }
      
      return true;
    })
    .map(([name, agent]) => ({ name, agent }));
}

/**
 * Get specific agent by name
 */
export function getAgent(config: GaffConfig, agentName: string): GaffAgent | null {
  return config.agents[agentName] || null;
}

/**
 * Find agents by capability
 */
export function findAgentsByCapability(
  config: GaffConfig,
  capability: string
): Array<{ name: string; agent: GaffAgent }> {
  return Object.entries(config.agents)
    .filter(([_name, agent]) => agent.capabilities.includes(capability))
    .map(([name, agent]) => ({ name, agent }));
}

/**
 * Validate that required agents exist
 */
export function validateAgentsExist(
  config: GaffConfig,
  requiredAgents: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredAgents.filter(name => !config.agents[name]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get agent types distribution
 */
export function getAgentTypeDistribution(config: GaffConfig): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  Object.values(config.agents).forEach(agent => {
    distribution[agent.type] = (distribution[agent.type] || 0) + 1;
  });
  
  return distribution;
}

/**
 * Get all unique capabilities across all agents
 */
export function getAllCapabilities(config: GaffConfig): string[] {
  const capabilities = new Set<string>();
  
  Object.values(config.agents).forEach(agent => {
    agent.capabilities.forEach(cap => capabilities.add(cap));
  });
  
  return Array.from(capabilities).sort();
}


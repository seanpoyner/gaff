#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Tool definitions
const tools: Tool[] = [
  {
    name: 'human_in_the_loop',
    description: '🚨 CRITICAL: Pause intent graph execution and request user confirmation/approval before proceeding. Essential for production agentic systems.',
    inputSchema: {
      type: 'object',
      properties: {
        action_description: {
          type: 'string',
          description: 'Clear description of what will happen if approved',
        },
        action_type: {
          type: 'string',
          enum: ['approval', 'confirmation', 'review', 'input'],
          description: 'Type of user interaction required',
        },
        context: {
          type: 'object',
          description: 'Full context about the action for user review',
        },
        approval_options: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['yes_no', 'multi_choice', 'text_input'],
            },
            choices: {
              type: 'array',
              items: { type: 'string' },
            },
            default: { type: 'string' },
            timeout_seconds: { type: 'number' },
            required_approvers: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        node_id: {
          type: 'string',
          description: 'Intent graph node requesting approval',
        },
        execution_id: {
          type: 'string',
          description: 'Execution session ID',
        },
      },
      required: ['action_description', 'action_type', 'node_id', 'execution_id'],
    },
  },
  {
    name: 'format_data',
    description: 'Convert data between different formats (JSON, XML, YAML, CSV, text)',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          description: 'Data to format',
        },
        source_format: {
          type: 'string',
          enum: ['json', 'xml', 'yaml', 'csv', 'text'],
        },
        target_format: {
          type: 'string',
          enum: ['json', 'xml', 'yaml', 'csv', 'text'],
        },
        options: {
          type: 'object',
          properties: {
            pretty: { type: 'boolean' },
            indent: { type: 'number' },
            include_header: { type: 'boolean' },
          },
        },
      },
      required: ['data', 'source_format', 'target_format'],
    },
  },
  {
    name: 'translate_schema',
    description: 'Translate data structures between different schemas with mapping rules',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Data to translate',
        },
        source_schema: {
          type: 'object',
          description: 'Source schema definition',
        },
        target_schema: {
          type: 'object',
          description: 'Target schema definition',
        },
        mapping_rules: {
          type: 'object',
          description: 'Field mapping rules',
        },
      },
      required: ['data', 'target_schema'],
    },
  },
  {
    name: 'lint_data',
    description: 'Validate data against schemas and rules (supports JSON, YAML, orchestration cards, intent graphs)',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Data to validate',
        },
        lint_type: {
          type: 'string',
          enum: ['json', 'yaml', 'orchestration_card', 'intent_graph', 'custom'],
        },
        schema: {
          type: 'object',
          description: 'Schema to validate against',
        },
        strict_mode: {
          type: 'boolean',
          description: 'Enable strict validation',
        },
      },
      required: ['data', 'lint_type'],
    },
  },
  {
    name: 'sanitize_data',
    description: 'Clean and sanitize data for safe processing (PII removal, HTML escaping, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          description: 'Data to sanitize',
        },
        sanitization_rules: {
          type: 'object',
          properties: {
            remove_pii: { type: 'boolean' },
            escape_html: { type: 'boolean' },
            normalize_whitespace: { type: 'boolean' },
            max_string_length: { type: 'number' },
            allowed_fields: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
      required: ['data'],
    },
  },
  {
    name: 'convert_timestamp',
    description: 'Convert timestamps between formats and timezones',
    inputSchema: {
      type: 'object',
      properties: {
        timestamp: {
          description: 'Timestamp to convert (string or number)',
        },
        source_format: {
          type: 'string',
          enum: ['iso8601', 'unix', 'unix_ms', 'custom'],
        },
        target_format: {
          type: 'string',
          enum: ['iso8601', 'unix', 'unix_ms', 'human_readable'],
        },
        timezone: {
          type: 'string',
          description: 'Target timezone (e.g., "America/New_York")',
        },
      },
      required: ['timestamp', 'source_format', 'target_format'],
    },
  },
  {
    name: 'count_tokens',
    description: 'Estimate token count for LLM processing and cost estimation',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to count tokens for',
        },
        model: {
          type: 'string',
          enum: ['gpt-4', 'claude', 'palmyra', 'generic'],
          description: 'LLM model for token counting',
        },
      },
      required: ['text'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'gaff-tools-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'human_in_the_loop': {
      const {
        action_description,
        action_type,
        context,
        approval_options,
        node_id,
        execution_id,
      } = args as {
        action_description: string;
        action_type: string;
        context: any;
        approval_options?: any;
        node_id: string;
        execution_id: string;
      };

      // TODO: Implement actual HITL mechanism
      // This should:
      // 1. Store the approval request in a database/queue
      // 2. Send notification to user (webhook, email, UI)
      // 3. Wait for user response (polling or webhook)
      // 4. Return approval decision
      //
      // For now, this is a PLACEHOLDER that simulates approval
      // In production, integrate with:
      // - Web UI for approval interface
      // - Notification system (email, Slack, Teams)
      // - Database for persistence
      // - Webhook for real-time updates

      console.error(`[HITL] Approval required for execution ${execution_id}, node ${node_id}`);
      console.error(`[HITL] Action: ${action_description}`);
      console.error(`[HITL] Context:`, JSON.stringify(context, null, 2));

      // PLACEHOLDER: Auto-approve for development
      // PRODUCTION: Replace with actual user interaction
      const approved = true; // This should come from user input
      const user_response = 'Auto-approved (DEVELOPMENT MODE)';
      const approver_id = 'system'; // Should be actual user ID

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                approved,
                user_response,
                approver_id,
                timestamp: new Date().toISOString(),
                execution_should_continue: approved,
                action_description,
                context,
                node_id,
                execution_id,
                warning: '⚠️ PLACEHOLDER IMPLEMENTATION - Replace with actual user approval mechanism',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'format_data': {
      const { data, source_format, target_format, options } = args as {
        data: any;
        source_format: string;
        target_format: string;
        options?: any;
      };

      // TODO: Implement actual format conversion
      // Libraries to consider:
      // - xml2js for XML
      // - js-yaml for YAML
      // - papaparse for CSV

      let formatted_data: any = data;
      let size_bytes = 0;

      try {
        if (target_format === 'json') {
          formatted_data = JSON.stringify(
            data,
            null,
            options?.pretty ? options?.indent || 2 : 0
          );
          size_bytes = new TextEncoder().encode(formatted_data).length;
        } else if (target_format === 'yaml') {
          // Placeholder - would use js-yaml in production
          formatted_data = `# YAML output (placeholder)\n${JSON.stringify(data, null, 2)}`;
          size_bytes = new TextEncoder().encode(formatted_data).length;
        } else {
          formatted_data = JSON.stringify(data);
          size_bytes = new TextEncoder().encode(formatted_data).length;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  formatted_data,
                  format: target_format,
                  size_bytes,
                  source_format,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Format conversion failed: ${error.message}`);
      }
    }

    case 'translate_schema': {
      const { data, source_schema, target_schema, mapping_rules } = args as {
        data: any;
        source_schema?: any;
        target_schema: any;
        mapping_rules?: any;
      };

      // TODO: Implement schema translation
      // This should map fields according to mapping_rules
      const translated_data: any = {};
      const unmapped_fields: string[] = [];
      const warnings: string[] = [];

      // Placeholder implementation
      if (mapping_rules) {
        for (const [sourceField, targetField] of Object.entries(mapping_rules)) {
          if (data[sourceField] !== undefined) {
            translated_data[targetField as string] = data[sourceField];
          } else {
            unmapped_fields.push(sourceField);
          }
        }
      } else {
        // No mapping rules, direct copy
        Object.assign(translated_data, data);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                translated_data,
                unmapped_fields,
                warnings,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'lint_data': {
      const { data, lint_type, schema, strict_mode } = args as {
        data: any;
        lint_type: string;
        schema?: any;
        strict_mode?: boolean;
      };

      // TODO: Implement comprehensive linting
      // Use libraries like ajv for JSON Schema validation
      const errors: Array<{ field: string; message: string; severity: string }> = [];
      const warnings: string[] = [];

      // Placeholder validation
      if (lint_type === 'orchestration_card') {
        if (!data.user_request) {
          errors.push({
            field: 'user_request',
            message: 'Missing required field: user_request',
            severity: 'error',
          });
        }
        if (!data.available_agents || data.available_agents.length === 0) {
          errors.push({
            field: 'available_agents',
            message: 'At least one agent must be specified',
            severity: 'error',
          });
        }
      } else if (lint_type === 'intent_graph') {
        if (!data.nodes || data.nodes.length === 0) {
          errors.push({
            field: 'nodes',
            message: 'Intent graph must have at least one node',
            severity: 'error',
          });
        }
      }

      const is_valid = errors.filter((e) => e.severity === 'error').length === 0;
      const lint_score = is_valid ? 1.0 : 0.5;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                is_valid,
                errors,
                warnings,
                lint_score,
                lint_type,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'sanitize_data': {
      const { data, sanitization_rules } = args as {
        data: any;
        sanitization_rules?: any;
      };

      // TODO: Implement comprehensive sanitization
      let sanitized_data = JSON.parse(JSON.stringify(data)); // Deep clone
      const removed_fields: string[] = [];
      const modifications_made: string[] = [];

      const rules = sanitization_rules || {};

      // PII removal (placeholder - basic email detection)
      if (rules.remove_pii) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const jsonString = JSON.stringify(sanitized_data);
        if (emailRegex.test(jsonString)) {
          sanitized_data = JSON.parse(jsonString.replace(emailRegex, '[EMAIL_REDACTED]'));
          modifications_made.push('Removed email addresses');
        }
      }

      // Whitespace normalization
      if (rules.normalize_whitespace) {
        const normalizeWhitespace = (obj: any): any => {
          if (typeof obj === 'string') {
            return obj.replace(/\s+/g, ' ').trim();
          } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
              obj[key] = normalizeWhitespace(obj[key]);
            }
          }
          return obj;
        };
        sanitized_data = normalizeWhitespace(sanitized_data);
        modifications_made.push('Normalized whitespace');
      }

      // Field filtering
      if (rules.allowed_fields && Array.isArray(rules.allowed_fields)) {
        const filtered: any = {};
        for (const field of rules.allowed_fields) {
          if (sanitized_data[field] !== undefined) {
            filtered[field] = sanitized_data[field];
          }
        }
        removed_fields.push(
          ...Object.keys(sanitized_data).filter((k) => !rules.allowed_fields.includes(k))
        );
        sanitized_data = filtered;
        modifications_made.push('Filtered to allowed fields');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                sanitized_data,
                removed_fields,
                modifications_made,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'convert_timestamp': {
      const { timestamp, source_format, target_format, timezone } = args as {
        timestamp: string | number;
        source_format: string;
        target_format: string;
        timezone?: string;
      };

      // TODO: Implement comprehensive timestamp conversion
      // Use libraries like date-fns or luxon for robust handling
      let date: Date;

      // Parse source
      if (source_format === 'unix') {
        date = new Date(Number(timestamp) * 1000);
      } else if (source_format === 'unix_ms') {
        date = new Date(Number(timestamp));
      } else if (source_format === 'iso8601') {
        date = new Date(String(timestamp));
      } else {
        date = new Date(String(timestamp));
      }

      // Convert to target
      let converted_timestamp: string | number;
      if (target_format === 'iso8601') {
        converted_timestamp = date.toISOString();
      } else if (target_format === 'unix') {
        converted_timestamp = Math.floor(date.getTime() / 1000);
      } else if (target_format === 'unix_ms') {
        converted_timestamp = date.getTime();
      } else if (target_format === 'human_readable') {
        converted_timestamp = date.toLocaleString('en-US', {
          timeZone: timezone || 'UTC',
        });
      } else {
        converted_timestamp = date.toISOString();
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                converted_timestamp,
                format: target_format,
                timezone: timezone || 'UTC',
                source_format,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'count_tokens': {
      const { text, model } = args as {
        text: string;
        model?: string;
      };

      // TODO: Implement accurate token counting
      // Use tiktoken for OpenAI models, or model-specific tokenizers
      
      // Placeholder: rough estimation (4 chars per token)
      const character_count = text.length;
      const token_count = Math.ceil(character_count / 4);

      // Cost estimation (placeholder rates)
      const cost_per_1k_tokens = model === 'gpt-4' ? 0.03 : 0.01;
      const estimated_cost = (token_count / 1000) * cost_per_1k_tokens;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                token_count,
                estimated_cost,
                character_count,
                model: model || 'generic',
                warning: 'Placeholder estimation - use tiktoken or model-specific tokenizer for accuracy',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GAFF Tools MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


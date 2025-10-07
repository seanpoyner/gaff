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
    name: 'validate_compliance',
    description: 'Validates orchestration cards against compliance requirements (GDPR, CCPA, SOC2, etc)',
    inputSchema: {
      type: 'object',
      properties: {
        orchestration_card: {
          type: 'object',
          description: 'The orchestration card to validate',
        },
        compliance_requirements: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of compliance standards to check (e.g., ["GDPR", "CCPA"])',
        },
      },
      required: ['orchestration_card', 'compliance_requirements'],
    },
  },
  {
    name: 'check_guardrails',
    description: 'Enforces safety guardrails including PII detection, content filtering, and risk assessment',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content to check for safety violations',
        },
        guardrail_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['pii_detection', 'content_filtering', 'risk_assessment'],
          },
          description: 'Types of guardrails to enforce',
        },
      },
      required: ['content', 'guardrail_types'],
    },
  },
  {
    name: 'validate_input',
    description: 'Pre-execution input validation for size, format, and schema compliance',
    inputSchema: {
      type: 'object',
      properties: {
        input_data: {
          type: 'object',
          description: 'Input data to validate',
        },
        validation_rules: {
          type: 'object',
          description: 'Validation rules including max size, allowed formats, schema',
        },
      },
      required: ['input_data', 'validation_rules'],
    },
  },
  {
    name: 'validate_output',
    description: 'Post-execution output validation for safety, compliance, and schema adherence',
    inputSchema: {
      type: 'object',
      properties: {
        output_data: {
          type: 'object',
          description: 'Output data to validate',
        },
        validation_rules: {
          type: 'object',
          description: 'Validation rules for output',
        },
      },
      required: ['output_data', 'validation_rules'],
    },
  },
  {
    name: 'enforce_rate_limits',
    description: 'Checks and enforces rate limits per user, IP, and endpoint',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'User identifier',
        },
        ip_address: {
          type: 'string',
          description: 'IP address of the request',
        },
        endpoint: {
          type: 'string',
          description: 'Endpoint being accessed',
        },
      },
      required: ['user_id', 'ip_address', 'endpoint'],
    },
  },
  {
    name: 'audit_log',
    description: 'Creates security audit log entries for compliance and monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          description: 'Type of event (e.g., "access", "violation", "error")',
        },
        user_id: {
          type: 'string',
          description: 'User identifier',
        },
        action: {
          type: 'string',
          description: 'Action taken',
        },
        metadata: {
          type: 'object',
          description: 'Additional context and metadata',
        },
      },
      required: ['event_type', 'user_id', 'action'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'safety-protocols-mcp-server',
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
    case 'validate_compliance': {
      const { orchestration_card, compliance_requirements } = args as {
        orchestration_card: any;
        compliance_requirements: string[];
      };

      // TODO: Implement actual compliance validation logic
      // This would check against GDPR, CCPA, SOC2, etc.
      const violations: string[] = [];
      const warnings: string[] = [];

      // Placeholder validation
      if (!orchestration_card.user_request) {
        violations.push('Missing user_request field');
      }

      const is_compliant = violations.length === 0;
      const compliance_score = is_compliant ? 1.0 : 0.5;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                is_compliant,
                violations,
                warnings,
                compliance_score,
                checked_requirements: compliance_requirements,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'check_guardrails': {
      const { content, guardrail_types } = args as {
        content: string;
        guardrail_types: string[];
      };

      // TODO: Implement actual guardrail checks
      // - PII detection using regex or ML models
      // - Content filtering for unsafe content
      // - Risk assessment

      const guardrail_violations: any[] = [];
      let masked_content = content;
      let risk_score = 0.0;

      // Placeholder PII detection (very basic)
      if (guardrail_types.includes('pii_detection')) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = content.match(emailRegex);
        if (emails) {
          guardrail_violations.push({
            type: 'pii_detected',
            details: `Found ${emails.length} email address(es)`,
          });
          masked_content = masked_content.replace(emailRegex, '[EMAIL_REDACTED]');
          risk_score += 0.3;
        }
      }

      const is_safe = guardrail_violations.length === 0;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                is_safe,
                guardrail_violations,
                masked_content,
                risk_score,
                guardrails_checked: guardrail_types,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'validate_input': {
      const { input_data, validation_rules } = args as {
        input_data: any;
        validation_rules: any;
      };

      // TODO: Implement input validation logic
      const errors: string[] = [];
      let sanitized_input = { ...input_data };

      // Placeholder validation
      const dataSize = JSON.stringify(input_data).length;
      if (validation_rules.max_size_bytes && dataSize > validation_rules.max_size_bytes) {
        errors.push(`Input exceeds max size: ${dataSize} > ${validation_rules.max_size_bytes}`);
      }

      const is_valid = errors.length === 0;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                is_valid,
                errors,
                sanitized_input,
                input_size_bytes: dataSize,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'validate_output': {
      const { output_data, validation_rules } = args as {
        output_data: any;
        validation_rules: any;
      };

      // TODO: Implement output validation logic
      const errors: string[] = [];
      let sanitized_output = { ...output_data };

      const is_valid = errors.length === 0;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                is_valid,
                errors,
                sanitized_output,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'enforce_rate_limits': {
      const { user_id, ip_address, endpoint } = args as {
        user_id: string;
        ip_address: string;
        endpoint: string;
      };

      // TODO: Implement actual rate limiting with Redis or in-memory store
      // This is a placeholder implementation

      const rate_limit = 100; // requests per minute
      const remaining_requests = Math.floor(Math.random() * rate_limit); // Placeholder
      const is_allowed = remaining_requests > 0;
      const reset_time = new Date(Date.now() + 60000).toISOString();
      const retry_after_seconds = is_allowed ? 0 : 60;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                is_allowed,
                remaining_requests,
                reset_time,
                retry_after_seconds,
                user_id,
                ip_address,
                endpoint,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'audit_log': {
      const { event_type, user_id, action, metadata } = args as {
        event_type: string;
        user_id: string;
        action: string;
        metadata?: any;
      };

      // TODO: Implement actual audit logging to database or logging service
      const log_id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      console.log(`[AUDIT LOG] ${timestamp} | ${event_type} | ${user_id} | ${action}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                log_id,
                timestamp,
                status: 'logged',
                event_type,
                user_id,
                action,
                metadata,
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
  console.error('Safety Protocols MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


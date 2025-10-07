# GAFF Tools MCP Server

**Essential utility tools for the GAFF framework**

## Overview

The GAFF Tools MCP server provides critical utility functions that enable the primary agent and other GAFF components to operate effectively. These tools handle data formatting, translation, validation, and most importantly, **human-in-the-loop (HITL)** functionality for user approval workflows.

## Features

✅ **Human-in-the-Loop:** Pause execution for user confirmation/approval  
✅ **Data Formatters:** Convert between JSON, XML, YAML, CSV  
✅ **Translators:** Protocol translation, schema mapping  
✅ **Linters:** Validate JSON, YAML, orchestration cards, intent graphs  
✅ **Utilities:** Timestamp conversion, data sanitization, token counting  

---

## Tools

### 🚨 1. `human_in_the_loop` (CRITICAL)

**Purpose:** Pause intent graph execution and request user confirmation before proceeding.

This is THE most important tool for production agentic systems. It enables:
- User approval for critical actions
- Confirmation before external API calls
- Review before data modifications
- Compliance with human oversight requirements

**Input:**
```typescript
{
  action_description: string,        // Clear description of what will happen
  action_type: string,              // "approval", "confirmation", "review", "input"
  context: object,                  // Full context about the action
  approval_options: {
    type: "yes_no" | "multi_choice" | "text_input",
    choices?: string[],             // For multi_choice
    default?: string,               // Default selection
    timeout_seconds?: number,       // Optional timeout
    required_approvers?: string[]   // Optional list of required approvers
  },
  node_id: string,                  // Intent graph node requesting approval
  execution_id: string              // Execution session ID
}
```

**Output:**
```typescript
{
  approved: boolean,
  user_response: string | object,
  approver_id: string,
  timestamp: string,
  execution_should_continue: boolean,
  modified_context?: object         // User can modify context before continuing
}
```

**Example Usage in Intent Graph:**
```json
{
  "node_id": "node_3",
  "agent": "gaff-tools",
  "tool": "human_in_the_loop",
  "input": {
    "action_description": "About to delete 150 customer records from database",
    "action_type": "approval",
    "context": {
      "table": "customers",
      "record_count": 150,
      "filter": "inactive > 365 days"
    },
    "approval_options": {
      "type": "yes_no",
      "timeout_seconds": 300
    },
    "node_id": "node_3",
    "execution_id": "exec_123"
  },
  "next_on_approve": "node_4",
  "next_on_reject": "node_error"
}
```

---

### 2. `format_data`

**Purpose:** Convert data between different formats.

**Input:**
```typescript
{
  data: any,
  source_format: "json" | "xml" | "yaml" | "csv" | "text",
  target_format: "json" | "xml" | "yaml" | "csv" | "text",
  options?: {
    pretty?: boolean,
    indent?: number,
    include_header?: boolean  // For CSV
  }
}
```

**Output:**
```typescript
{
  formatted_data: string | object,
  format: string,
  size_bytes: number
}
```

---

### 3. `translate_schema`

**Purpose:** Translate data structures between different schemas.

**Input:**
```typescript
{
  data: object,
  source_schema: object,
  target_schema: object,
  mapping_rules: object
}
```

**Output:**
```typescript
{
  translated_data: object,
  unmapped_fields: string[],
  warnings: string[]
}
```

---

### 4. `lint_data`

**Purpose:** Validate data against schemas and rules.

**Input:**
```typescript
{
  data: object,
  lint_type: "json" | "yaml" | "orchestration_card" | "intent_graph" | "custom",
  schema?: object,
  strict_mode?: boolean
}
```

**Output:**
```typescript
{
  is_valid: boolean,
  errors: Array<{
    field: string,
    message: string,
    severity: "error" | "warning"
  }>,
  warnings: string[],
  lint_score: number
}
```

---

### 5. `sanitize_data`

**Purpose:** Clean and sanitize data for safe processing.

**Input:**
```typescript
{
  data: any,
  sanitization_rules: {
    remove_pii?: boolean,
    escape_html?: boolean,
    normalize_whitespace?: boolean,
    max_string_length?: number,
    allowed_fields?: string[]
  }
}
```

**Output:**
```typescript
{
  sanitized_data: any,
  removed_fields: string[],
  modifications_made: string[]
}
```

---

### 6. `convert_timestamp`

**Purpose:** Convert timestamps between formats and timezones.

**Input:**
```typescript
{
  timestamp: string | number,
  source_format: "iso8601" | "unix" | "unix_ms" | "custom",
  target_format: "iso8601" | "unix" | "unix_ms" | "human_readable",
  timezone?: string
}
```

**Output:**
```typescript
{
  converted_timestamp: string | number,
  format: string,
  timezone: string
}
```

---

### 7. `count_tokens`

**Purpose:** Estimate token count for LLM processing.

**Input:**
```typescript
{
  text: string,
  model: "gpt-4" | "claude" | "palmyra" | "generic"
}
```

**Output:**
```typescript
{
  token_count: number,
  estimated_cost: number,
  character_count: number
}
```

---

## Installation

```bash
cd gaff/mcp/tools
npm install
npm run build
```

## Usage

### Standalone
```bash
npm start
```

### In GAFF
Configure in `gaff.json`:
```json
{
  "primary_agent": {
    "mcp_servers": [
      "gaff-tools",
      "..."
    ]
  }
}
```

---

## Human-in-the-Loop Integration

### Intent Graph Pattern

To add user approval to any node in an intent graph:

```json
{
  "nodes": [
    {
      "id": "node_1",
      "agent": "DataFetcher",
      "tool": "fetch_data",
      "description": "Fetch customer data"
    },
    {
      "id": "node_2_hitl",
      "agent": "gaff-tools",
      "tool": "human_in_the_loop",
      "description": "Request user approval for data deletion",
      "input": {
        "action_description": "Deleting {{node_1.output.record_count}} customer records",
        "action_type": "approval",
        "context": "{{node_1.output}}",
        "approval_options": {
          "type": "yes_no",
          "timeout_seconds": 300
        }
      },
      "dependencies": ["node_1"]
    },
    {
      "id": "node_3",
      "agent": "DataDeleter",
      "tool": "delete_records",
      "description": "Delete approved records",
      "dependencies": ["node_2_hitl"],
      "condition": "{{node_2_hitl.output.approved === true}}"
    }
  ],
  "edges": [
    { "from": "node_1", "to": "node_2_hitl" },
    { "from": "node_2_hitl", "to": "node_3", "condition": "approved" },
    { "from": "node_2_hitl", "to": "node_error", "condition": "!approved" }
  ]
}
```

### Router Integration

The router MCP server must:
1. Detect `human_in_the_loop` tool calls
2. Pause execution
3. Send notification to user interface
4. Wait for user response
5. Resume execution based on approval

**Router Pseudo-code:**
```typescript
if (node.tool === 'human_in_the_loop') {
  // Pause execution
  execution.status = 'paused_for_approval';
  
  // Notify user (webhook, UI, email, etc.)
  await notifyUser({
    execution_id: execution.id,
    action: node.input.action_description,
    approval_url: `https://app.example.com/approve/${execution.id}`
  });
  
  // Wait for approval (polling or webhook)
  const approval = await waitForApproval(execution.id, timeout);
  
  // Resume execution
  if (approval.approved) {
    continueToNextNode(node.next_on_approve);
  } else {
    continueToNextNode(node.next_on_reject);
  }
}
```

---

## Configuration

Set environment variables in `.env`:
```bash
# HITL Settings
HITL_ENABLED=true
HITL_DEFAULT_TIMEOUT_SECONDS=300
HITL_NOTIFICATION_WEBHOOK_URL=https://your-app.com/api/approval-webhook

# Data Limits
MAX_DATA_SIZE_MB=10
MAX_STRING_LENGTH=10000
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

## Security Considerations

### Human-in-the-Loop
- Always use HITL for:
  - Data deletion or modification
  - External API calls with side effects
  - Financial transactions
  - Policy changes
  - Access control modifications
- Implement timeout mechanisms
- Log all approval decisions for audit
- Support multi-approver workflows for critical actions

### Data Sanitization
- Always sanitize user input before processing
- Remove PII when not needed
- Enforce size limits to prevent DoS
- Validate against schemas

---

## License

MIT License - Copyright 2025 Sean Poyner

---

**Part of the [GAFF Framework](https://github.com/seanpoyner/gaff)**


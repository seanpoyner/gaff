# safety-protocols MCP Server

> Guardrails, compliance enforcement, and safety checks for GAFF workflows

**Part of [GAFF Framework](https://github.com/seanpoyner/gaff)** - Open-source AI agent orchestration  
**Status:** ✅ Working (Scaffolded - Basic Implementation)  
**Version:** 1.0.0  
**Pipeline Position:** Step 2 - Safety & Compliance Validation  
**Confluence:** [safety-protocols Documentation](https://marriottcloud.atlassian.net/wiki/spaces/AAD/pages/2580103571)

**⭐ Recommended:** Use [gaff-gateway](../gaff-gateway/) to access this and all other GAFF servers through a single connection.

---

## Overview

The `safety-protocols` MCP server provides comprehensive safety and compliance enforcement for the GAFF framework. It validates inputs, enforces guardrails, checks regulatory compliance, and ensures safe execution of multi-agent workflows.

## Features

✅ **PII Detection & Masking:** Automatically detect and mask personally identifiable information  
✅ **Content Filtering:** Filter unsafe or inappropriate content  
✅ **Compliance Validation:** GDPR, CCPA, SOC2, and custom regulatory checks  
✅ **Rate Limiting:** Per-user, per-IP, and per-endpoint rate limiting  
✅ **Input/Output Validation:** Size limits, format checks, and schema enforcement  
✅ **Audit Logging:** Comprehensive audit trails for compliance requirements  
🌐 **Gateway Compatible:** Accessible via gaff-gateway with `safety_*` prefix  

## Tools

### 1. `validate_compliance`
Validates orchestration cards against compliance requirements.

**Input:**
```typescript
{
  orchestration_card: object,
  compliance_requirements: string[] // e.g., ["GDPR", "CCPA"]
}
```

**Output:**
```typescript
{
  is_compliant: boolean,
  violations: string[],
  warnings: string[],
  compliance_score: number
}
```

---

### 2. `check_guardrails`
Enforces safety guardrails on content.

**Input:**
```typescript
{
  content: string,
  guardrail_types: string[] // e.g., ["pii_detection", "content_filtering"]
}
```

**Output:**
```typescript
{
  is_safe: boolean,
  guardrail_violations: object[],
  masked_content: string,
  risk_score: number
}
```

---

### 3. `validate_input`
Pre-execution input validation.

**Input:**
```typescript
{
  input_data: object,
  validation_rules: object
}
```

**Output:**
```typescript
{
  is_valid: boolean,
  errors: string[],
  sanitized_input: object
}
```

---

### 4. `validate_output`
Post-execution output validation.

**Input:**
```typescript
{
  output_data: object,
  validation_rules: object
}
```

**Output:**
```typescript
{
  is_valid: boolean,
  errors: string[],
  sanitized_output: object
}
```

---

### 5. `enforce_rate_limits`
Checks and enforces rate limits.

**Input:**
```typescript
{
  user_id: string,
  ip_address: string,
  endpoint: string
}
```

**Output:**
```typescript
{
  is_allowed: boolean,
  remaining_requests: number,
  reset_time: string,
  retry_after_seconds: number
}
```

---

### 6. `audit_log`
Creates security audit log entries.

**Input:**
```typescript
{
  event_type: string,
  user_id: string,
  action: string,
  metadata: object
}
```

**Output:**
```typescript
{
  log_id: string,
  timestamp: string,
  status: string
}
```

---

## Installation

```bash
cd gaff/mcp/safety-protocols
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
      "safety-protocols",
      "..."
    ]
  }
}
```

## Configuration

Set environment variables in `.env`:
```bash
ENABLE_PII_DETECTION=true
ENABLE_CONTENT_FILTERING=true
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

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

## License

MIT License - Copyright 2025 Sean Poyner

---

**Part of the [GAFF Framework](https://github.com/seanpoyner/gaff)**


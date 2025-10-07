# GAFF Sandbox Server

**Official MCP Sandbox Server bundled with GAFF**

Provides safe code execution capabilities for Python, JavaScript, and shell commands in an isolated environment.

## Why Include Sandbox?

1. **Code Execution**: Run generated code safely
2. **Testing & Validation**: Test agent-generated code before deployment
3. **Prototyping**: Quick experimentation with code snippets
4. **Self-Contained**: No external dependencies needed

## What This Is

This is **NOT a custom sandbox implementation**. It's simply:
- The official `@modelcontextprotocol/server-sandbox` as a dependency
- A simple wrapper for convenience
- Pre-configured to work with GAFF

## Installation

```bash
cd gaff/mcp/sandbox
npm install
```

## Usage

### Option 1: Use with GAFF Gateway (Recommended)

The gateway automatically includes sandbox tools.

### Option 2: Use Standalone

```bash
cd gaff/mcp/sandbox
npm start
```

### Option 3: Direct via npx

```bash
npx @modelcontextprotocol/server-sandbox
```

## Configuration in Cursor/Claude Desktop

```json
{
  "mcpServers": {
    "sandbox": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sandbox"]
    }
  }
}
```

## Tools Provided

### `execute_code`
Execute code in a sandboxed environment

**Supported Languages:**
- Python
- JavaScript/Node.js  
- Shell/Bash

**Safety Features:**
- Isolated execution environment
- Resource limits
- Timeout protection
- No access to host filesystem (by default)

## GAFF Integration Examples

### Execute Python Code

```javascript
const result = await sandbox.execute_code({
  language: "python",
  code: `
def calculate_total(items):
    return sum(item['price'] for item in items)

items = [{'price': 10}, {'price': 20}, {'price': 30}]
print(calculate_total(items))
  `
});
```

### Execute JavaScript Code

```javascript
const result = await sandbox.execute_code({
  language: "javascript",
  code: `
const data = {users: 100, active: 75};
const percentage = (data.active / data.users) * 100;
console.log(\`Active: \${percentage}%\`);
  `
});
```

### Test Generated Code

```javascript
// Agent generates code
const generatedCode = await llm.generate_code(prompt);

// Test it safely in sandbox
const testResult = await sandbox.execute_code({
  language: "python",
  code: generatedCode + "\n\n# Test\nprint(test_function(5))"
});

if (testResult.success) {
  console.log("Code works! Deploying...");
} else {
  console.log("Code failed. Regenerating...");
}
```

## Use Cases in GAFF

### 1. **Code Generation Workflows**
- Generate code with LLM
- Test in sandbox
- Validate output
- Deploy if successful

### 2. **Data Processing**
- Execute transformation scripts
- Validate data transformations
- Safe experimentation

### 3. **Agent Testing**
- Test agent-generated solutions
- Validate before production
- Quick iteration

### 4. **Prototyping**
- Rapid prototyping of solutions
- Test algorithms
- Validate approaches

## Safety Considerations

The sandbox provides isolation but has limits:
- **Do not** execute untrusted code without review
- **Monitor** resource usage for long-running code
- **Validate** inputs before execution
- **Review** outputs before using them

## Environment Variables

See official documentation for configuration options:
https://github.com/modelcontextprotocol/servers/tree/main/src/sandbox

## Official Documentation

- GitHub: https://github.com/modelcontextprotocol/servers/tree/main/src/sandbox
- MCP Protocol: https://modelcontextprotocol.io

## License

The official sandbox server is licensed under MIT by Anthropic.

This wrapper is also MIT licensed - see LICENSE file in repository root.


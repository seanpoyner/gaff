# GAFF Sequential Thinking Server

**Step-by-Step Reasoning MCP Server bundled with GAFF**

Enables agents to break down complex problems into sequential thought steps for better reasoning and transparency.

## Why Include Sequential Thinking?

1. **Better Reasoning**: Break down complex problems systematically
2. **Transparency**: See each step of the reasoning process
3. **Debugging**: Identify where reasoning went wrong
4. **Quality**: Improve output quality through structured thinking
5. **Complex Problems**: Handle multi-step reasoning tasks

## What This Is

This is **NOT a custom implementation**. It's simply:
- The official `@modelcontextprotocol/server-sequential-thinking` as a dependency
- A simple wrapper for convenience
- Pre-configured to work with GAFF

## Installation

```bash
cd gaff/mcp/sequential-thinking
npm install
```

## Usage

### Option 1: Use with GAFF Gateway (Recommended)

The gateway automatically includes sequential thinking tools.

### Option 2: Use Standalone

```bash
cd gaff/mcp/sequential-thinking
npm start
```

### Option 3: Direct via npx

```bash
npx @modelcontextprotocol/server-sequential-thinking
```

## Configuration in Cursor/Claude Desktop

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

## Tools Provided

### `sequentialthinking`
Break down complex problems into sequential thought steps

**Features:**
- Dynamic thought planning (adjust as you go)
- Thought revision and backtracking
- Branch exploration
- Hypothesis generation and testing
- Progress tracking

**Parameters:**
- `thought`: Current thinking step
- `nextThoughtNeeded`: Whether more thinking is needed
- `thoughtNumber`: Current step number
- `totalThoughts`: Estimated total steps (adjustable)
- `isRevision`: Whether revising previous thought
- `revisesThought`: Which thought is being reconsidered
- `branchFromThought`: Branching point if exploring alternatives
- `needsMoreThoughts`: If more steps needed than estimated

## GAFF Integration Examples

### Complex Problem Solving

```javascript
// Agent uses sequential thinking for complex task
const workflow = {
  nodes: [
    {
      id: "analysis",
      agent: "analyzer",
      instructions: "Use sequential thinking to break down this problem",
      tools: ["sequentialthinking"],
      output_schema: {
        analysis: "string",
        reasoning_steps: "array"
      }
    }
  ]
};
```

### Research and Analysis

```javascript
// Multi-step research with transparent reasoning
const research = await agent.think({
  problem: "Analyze market trends for Q4",
  use_sequential_thinking: true,
  min_thoughts: 5,
  max_thoughts: 15
});

// See each reasoning step
research.thoughts.forEach((thought, i) => {
  console.log(`Step ${i + 1}: ${thought.content}`);
  if (thought.isRevision) {
    console.log(`  (Revised thought ${thought.revisesThought})`);
  }
});
```

### Decision Making

```javascript
// Complex decision with branch exploration
const decision = {
  thought: "Should we implement feature A or B?",
  explore_branches: true,
  consider_alternatives: true
};

// Agent explores multiple reasoning paths
// Can revise and backtrack as needed
```

## Use Cases in GAFF

### 1. **Complex Orchestration**
- Plan multi-step workflows
- Reason about agent selection
- Optimize execution paths

### 2. **Data Analysis**
- Break down analytical tasks
- Show reasoning steps
- Transparent conclusions

### 3. **Strategic Planning**
- Long-term planning tasks
- Consider multiple approaches
- Document decision rationale

### 4. **Problem Diagnosis**
- Systematic troubleshooting
- Hypothesis testing
- Root cause analysis

### 5. **Quality Assurance**
- Review generated content
- Verify reasoning steps
- Catch logical errors

## Key Features

### Dynamic Planning
Start with estimate, adjust as you go:
```javascript
{
  thoughtNumber: 3,
  totalThoughts: 5,  // Initial estimate
  needsMoreThoughts: true  // Realized more steps needed
}
```

### Thought Revision
Go back and reconsider:
```javascript
{
  thought: "Actually, approach A won't work because...",
  isRevision: true,
  revisesThought: 2  // Revising thought #2
}
```

### Branch Exploration
Explore alternatives:
```javascript
{
  thought: "Let's try approach B instead",
  branchFromThought: 3,
  branchId: "approach-b"
}
```

### Hypothesis Testing
Generate and verify:
```javascript
// Generate hypothesis
{ thought: "Hypothesis: The bottleneck is in the database" }

// Test it
{ thought: "Testing: Query times are indeed 2s+" }

// Conclude
{ thought: "Confirmed: Database is the bottleneck" }
```

## Best Practices

### 1. **Set Realistic Estimates**
Start with a reasonable `totalThoughts` estimate but be ready to adjust.

### 2. **Be Explicit About Revisions**
When reconsidering, clearly mark `isRevision: true` and reference the thought being revised.

### 3. **Document Branches**
Use clear `branchId` values when exploring alternatives.

### 4. **Keep Thoughts Focused**
Each thought should advance understanding, not just restate.

### 5. **Know When to Stop**
Set `nextThoughtNeeded: false` when you have a solid conclusion.

## Integration with Other GAFF Components

### With Intent Graph Generator
```javascript
// Use thinking to plan complex orchestrations
const card = await orchestration.generate({
  user_request: "Build ML pipeline",
  use_sequential_thinking: true  // Plan before generating
});
```

### With Quality Check
```javascript
// Verify reasoning quality
const quality = await quality_check.verify({
  content: reasoning_steps,
  check_type: "reasoning_coherence"
});
```

### With Safety Protocols
```javascript
// Ensure reasoning doesn't violate policies
const safety = await safety.check({
  reasoning_steps: thoughts,
  policy: "reasoning_guidelines"
});
```

## Environment Variables

None required - works out of the box!

## Official Documentation

- GitHub: https://github.com/modelcontextprotocol/servers
- MCP Protocol: https://modelcontextprotocol.io

## License

The official sequential-thinking server is licensed under MIT by Anthropic.

This wrapper is also MIT licensed - see LICENSE file in repository root.


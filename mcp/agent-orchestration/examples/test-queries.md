# Test Queries for Agent Orchestration

## Example 1: E-commerce Order Processing

**Query:**
```
Process customer orders by validating the data, sending confirmation emails, and storing the order in the database
```

**Expected Orchestration Card:**
- Agents: DataValidator, NotificationService, DatabaseWriter
- Domain: e-commerce
- Workflow: validate → notify → store
- Optimization: reliability

## Example 2: Customer Feedback Analysis

**Query:**
```
Analyze customer feedback for sentiment, enrich with additional data, and store results
```

**Expected Orchestration Card:**
- Agents: SentimentAnalyzer, DataProcessor, DatabaseWriter
- Domain: data-analysis
- Workflow: analyze → process → store
- Optimization: balanced

## Example 3: Data Processing Pipeline

**Query:**
```
Transform raw data, validate it against business rules, and notify the team when complete
```

**Expected Orchestration Card:**
- Agents: DataProcessor, DataValidator, NotificationService
- Domain: data-processing
- Workflow: transform → validate → notify
- Optimization: speed

## Example 4: Complex Multi-step Workflow

**Query:**
```
Analyze text sentiment, validate the results are confident enough, process and enrich the data, store it in the database, and send email notifications to stakeholders
```

**Expected Orchestration Card:**
- Agents: SentimentAnalyzer, DataValidator, DataProcessor, DatabaseWriter, NotificationService
- Domain: ml-pipeline
- Workflow: analyze → validate → process → store → notify
- Optimization: reliability
- Parallelization: aggressive

## Testing Instructions

1. Set your LLM API key:
```bash
export WRITER_API_KEY=your-key
```

2. Set the GAFF config path:
```bash
export GAFF_CONFIG_PATH=/path/to/examples/sample-gaff.json
```

3. Run the server:
```bash
npm run dev
```

4. In Claude Desktop or Cursor, call the tool:
```typescript
await callTool("generate_orchestration_card", {
  query: "Process customer orders by validating the data, sending confirmation emails, and storing the order in the database"
});
```

5. Verify the output contains:
   - Valid orchestration card structure
   - Correct agents selected based on capabilities
   - Appropriate constraints and preferences
   - No validation errors


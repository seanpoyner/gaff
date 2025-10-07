# Test Prompts for System-Configurable Intent Graph Generation

## Overview

This directory contains **5 creative, detailed test prompts** for testing the intent-graph MCP server's **system-configurable generation** feature with different types of agentic workflows across diverse domains.

Each prompt demonstrates how to customize the MCP server for specific multi-agent systems by providing:
- Custom prompt templates
- System-specific output formats
- Agent descriptions with capabilities
- Example outputs
- Output schemas for validation
- Domain-specific validation rules

---

## 🎯 Test Prompts

### 1. Medical Diagnosis Multi-Agent System
**File:** `1-medical-diagnosis-system.md`

**Domain:** Healthcare / Clinical Decision Support

**Scenario:** Patient with respiratory symptoms requiring diagnostic workup

**Agents:**
- SymptomAnalyzer (LLM)
- TestOrderer (API)
- ResultAnalyzer (LLM)
- TreatmentPlanner (LLM)
- SafetyValidator (Validator)

**Output Format:** Markdown with clinical workflow table and Mermaid diagram

**Key Features:**
- Multi-stage diagnostic reasoning
- Evidence-based treatment planning
- Drug interaction safety checks
- HIPAA/medical compliance
- Clinical guideline integration

**Use Case:** Assist healthcare providers with systematic diagnostic reasoning and safe treatment planning

---

### 2. Financial Fraud Detection Multi-Agent System
**File:** `2-fraud-detection-system.md`

**Domain:** Financial Security / Risk Management

**Scenario:** Suspicious $47,500 wire transfer with multiple risk indicators

**Agents:**
- BehaviorAnalyzer (LLM)
- ThreatIntelligence (API)
- GeolocationValidator (API)
- RiskScorer (LLM)
- ActionExecutor (API)
- AuditLogger (Tool)

**Output Format:** Markdown with risk analysis table and investigation flow

**Key Features:**
- Real-time fraud detection
- Multi-signal risk aggregation
- Automatic transaction blocking
- Compliance audit trails (SOX, PCI-DSS)
- Threat intelligence integration

**Use Case:** Protect customers and financial institutions from fraud with automated detection and response

---

### 3. Content Creation & Publishing Multi-Agent System
**File:** `3-content-publishing-system.md`

**Domain:** Content Marketing / Digital Publishing

**Scenario:** Create comprehensive blog post with SEO, fact-checking, and multi-channel distribution

**Agents:**
- ContentWriter (LLM)
- SEOOptimizer (LLM)
- FactChecker (API)
- ComplianceReviewer (Validator)
- ImageGenerator (API)
- SocialMediaAdapter (LLM)
- PublishingOrchestrator (API)

**Output Format:** Markdown with content pipeline table and quality gates

**Key Features:**
- Long-form content generation
- SEO optimization
- Fact verification with citations
- Legal/brand compliance
- Multi-channel distribution (blog, social, email)
- Analytics tracking

**Use Case:** Enable marketers to produce professional, SEO-optimized content at scale with automated distribution

---

### 4. Smart Home Automation Multi-Agent System
**File:** `4-smart-home-automation.md`

**Domain:** IoT / Home Automation

**Scenario:** Late-night security incident with multiple anomalies detected

**Agents:**
- SecurityAnalyzer (LLM)
- DeviceController (API)
- OccupancyTracker (API)
- ComfortOptimizer (LLM)
- AlertDispatcher (API)
- RoutineExecutor (Tool)

**Output Format:** Markdown with automation actions table and priority flow

**Key Features:**
- Real-time threat detection
- Multi-device coordination (locks, lights, cameras, HVAC)
- Occupancy-based automation
- Emergency response protocols
- Energy optimization
- Mobile alerts and notifications

**Use Case:** Provide security, comfort, and energy efficiency through intelligent home automation

---

### 5. Scientific Research Literature Review Multi-Agent System
**File:** `5-research-literature-review.md`

**Domain:** Academic Research / Scientific Analysis

**Scenario:** Comprehensive literature review on CRISPR gene editing for sickle cell disease

**Agents:**
- LiteratureSearcher (API)
- RelevanceRanker (LLM)
- MethodologyAnalyzer (LLM)
- FindingsSynthesizer (LLM)
- GapAnalyzer (LLM)
- CitationNetworkBuilder (API)
- BibliographyGenerator (Tool)

**Output Format:** Markdown with systematic review table and research flow

**Key Features:**
- Multi-database search (PubMed, arXiv, clinical trials)
- Relevance ranking and quality assessment
- Methodology extraction and analysis
- Findings synthesis and meta-analysis
- Research gap identification
- Citation network analysis
- Annotated bibliography generation

**Use Case:** Accelerate scientific research by automating comprehensive literature reviews and gap analysis

---

## 🚀 How to Use These Test Prompts

### Step 1: Restart Claude Desktop

Ensure you have the latest build of the intent-graph MCP server loaded:

```bash
cd IntentGraphGen
npm run build
# Restart Claude Desktop
```

### Step 2: Copy a Test Prompt

Open one of the 5 test prompt files and copy the entire contents.

### Step 3: Paste into Claude Desktop

Paste the prompt into Claude Desktop. The prompt will:
1. Call the `generate_intent_graph` tool with the system configuration
2. Receive custom prompts tailored to that specific system
3. Use Claude's own LLM to generate the intent graph
4. Return a complete workflow in the system's custom format

### Step 4: Observe the Output

You should receive:
- A detailed intent graph analysis
- Tables showing workflow nodes
- Mermaid diagrams showing execution flow
- System-specific formatting (clinical workflow, risk analysis, content pipeline, etc.)
- Domain-specific validation and quality checks

---

## 🎨 What Makes These Prompts Special

### 1. **Domain Diversity**
- Healthcare (diagnostic reasoning)
- Finance (fraud detection)
- Marketing (content creation)
- IoT (home automation)
- Academia (literature review)

### 2. **Agent Variety**
- LLM agents (reasoning, analysis, synthesis)
- API agents (database queries, device control)
- Validator agents (compliance, safety)
- Tool agents (automation, formatting)

### 3. **Output Formats**
- Clinical workflows with safety checkpoints
- Risk analysis with threat signals
- Content pipelines with quality gates
- Automation sequences with priorities
- Research protocols with deliverables

### 4. **Real-World Complexity**
- Multi-stage workflows
- Parallel execution requirements
- Conditional logic and branching
- Error handling and fallbacks
- Compliance and audit requirements

### 5. **Custom Prompt Templates**
Each system provides its own prompt template that defines:
- Domain-specific terminology
- Expected output structure
- Quality criteria
- Success metrics

---

## 📊 Comparison Matrix

| System | Agents | Execution Model | Priority | Key Challenge |
|--------|--------|----------------|----------|---------------|
| Medical Diagnosis | 5 | Sequential | Clinical accuracy | Safety validation |
| Fraud Detection | 6 | Parallel | Real-time speed | Multi-signal aggregation |
| Content Publishing | 7 | DAG | Quality gates | Multi-channel coordination |
| Smart Home | 6 | Parallel | Emergency response | Device synchronization |
| Research Review | 7 | DAG | Comprehensiveness | Citation network analysis |

---

## 🎯 Testing Goals

Use these prompts to verify:

1. **System Configuration Works**
   - Custom prompts are applied correctly
   - Output matches system-specific format
   - Agent descriptions are incorporated

2. **Format Flexibility**
   - Markdown with tables ✓
   - Mermaid diagrams ✓
   - JSON schemas ✓
   - Domain-specific structures ✓

3. **Agent Coordination**
   - Sequential workflows
   - Parallel execution
   - DAG (directed acyclic graph)
   - Conditional branching

4. **Validation Rules**
   - System-specific requirements enforced
   - Quality gates validated
   - Compliance checks passed

5. **Delegate Mode**
   - Prompts returned correctly
   - Claude generates appropriate graphs
   - Output matches expected format

---

## 💡 Tips for Testing

### Modify the Scenarios
- Change the medical symptoms
- Adjust the fraud indicators
- Pick different content topics
- Create different home automation scenarios
- Select different research questions

### Adjust the Configuration
- Add/remove agents
- Change output formats
- Modify validation rules
- Update agent capabilities

### Test Different Modes
```json
"options": {
  "generation_mode": "delegate_to_caller"  // or "use_configured_api"
}
```

### Experiment with Complexity
- Start simple (3 agents, sequential)
- Add complexity (7 agents, parallel, conditional)
- Test error handling
- Validate edge cases

---

## 📚 Documentation References

- **Feature Documentation:** `../SYSTEM-CONFIGURABLE-GENERATION.md`
- **Example Configuration:** `../example-data-analysis-system.json`
- **Implementation Details:** `../FLEXIBLE-GENERATION-SUMMARY.md`

---

## ✅ Success Criteria

You've successfully tested the system if:

1. ✓ MCP server returns custom prompts based on configuration
2. ✓ Claude generates intent graphs in system-specific format
3. ✓ Output includes tables, Mermaid diagrams, and domain terminology
4. ✓ Workflows are logical and domain-appropriate
5. ✓ Quality gates and validation rules are respected

---

## 🎉 Get Creative!

These prompts are starting points. Create your own:
- **Legal Document Review** (Contract analysis, risk assessment)
- **Supply Chain Optimization** (Inventory, logistics, forecasting)
- **Customer Support Automation** (Ticket routing, response generation)
- **DevOps Pipeline** (CI/CD, testing, deployment)
- **Educational Assessment** (Grading, feedback, adaptation)

The system-configurable architecture supports **any multi-agent workflow** - customize it for your specific domain!

---

**Happy Testing!** 🚀

If you have questions or create interesting new configurations, share them with the team!


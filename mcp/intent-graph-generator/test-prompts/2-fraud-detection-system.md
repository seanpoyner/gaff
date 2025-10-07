# Test Prompt: Financial Fraud Detection Multi-Agent System

Use the intent-graph MCP server to generate an intent graph for this fraud detection workflow:

---

**User Query:** "Transaction flagged: $47,500 wire transfer to offshore account from customer who typically makes $200-500 transactions. Multiple login attempts from new IP addresses in last hour. Run fraud investigation."

**System Configuration:**

```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Transaction flagged: $47,500 wire transfer to offshore account from customer who typically makes $200-500 transactions. Multiple login attempts from new IP addresses in last hour. Run fraud investigation.",
      "domain": "financial_security"
    },
    "available_agents": [
      {
        "name": "BehaviorAnalyzer",
        "type": "llm",
        "description": "Analyzes transaction patterns against customer baseline behavior",
        "capabilities": ["anomaly_detection", "behavioral_profiling", "pattern_recognition"],
        "input_schema": { "transaction": "object", "customer_history": "array", "timeframe": "string" },
        "output_schema": { "anomaly_score": "number", "suspicious_indicators": "array", "baseline_deviation": "object" }
      },
      {
        "name": "ThreatIntelligence",
        "type": "api",
        "description": "Checks transaction details against known fraud databases and watchlists",
        "capabilities": ["watchlist_checking", "ip_reputation", "account_verification", "sanction_screening"],
        "input_schema": { "account_number": "string", "ip_addresses": "array", "transaction_details": "object" },
        "output_schema": { "watchlist_matches": "array", "risk_indicators": "array", "confidence_level": "number" }
      },
      {
        "name": "GeolocationValidator",
        "type": "api",
        "description": "Validates geographic information and detects impossible travel patterns",
        "capabilities": ["ip_geolocation", "travel_pattern_analysis", "timezone_validation"],
        "input_schema": { "ip_addresses": "array", "timestamps": "array", "known_locations": "array" },
        "output_schema": { "impossible_travel": "boolean", "location_risk": "string", "distance_km": "number" }
      },
      {
        "name": "RiskScorer",
        "type": "llm",
        "description": "Aggregates all signals and calculates comprehensive fraud risk score",
        "capabilities": ["risk_aggregation", "ml_scoring", "confidence_calculation"],
        "input_schema": { "behavior_analysis": "object", "threat_intel": "object", "geolocation": "object" },
        "output_schema": { "fraud_risk_score": "number", "risk_category": "string", "recommended_action": "string" }
      },
      {
        "name": "ActionExecutor",
        "type": "api",
        "description": "Executes fraud response actions based on risk assessment",
        "capabilities": ["transaction_blocking", "account_freezing", "alert_generation", "case_creation"],
        "input_schema": { "risk_score": "number", "action_type": "string", "transaction_id": "string" },
        "output_schema": { "action_taken": "string", "case_id": "string", "notification_sent": "boolean" }
      },
      {
        "name": "AuditLogger",
        "type": "tool",
        "description": "Logs all fraud investigation steps for compliance and auditing",
        "capabilities": ["audit_trail_creation", "compliance_logging", "evidence_preservation"],
        "input_schema": { "investigation_steps": "array", "decision_rationale": "string" },
        "output_schema": { "audit_id": "string", "logged_at": "string", "compliance_status": "string" }
      }
    ],
    "system_configuration": {
      "system_name": "Financial Fraud Detection System",
      "system_description": "Real-time fraud detection and prevention system that analyzes transaction patterns, threat intelligence, geolocation data, and behavioral anomalies to identify and block fraudulent activity.",
      "system_purpose": "Protect customers and financial institutions from fraud by detecting suspicious activity in real-time and automatically executing appropriate response actions while maintaining full audit trails for regulatory compliance.",
      "output_format": "markdown",
      "custom_prompt_template": "# Fraud Investigation Orchestrator\n\nYou are a fraud investigation orchestrator that creates detection workflows for financial security AI agents.\n\n## Investigation Protocol\n\nFor each suspicious transaction, create a workflow that:\n1. **Analyzes** customer behavior patterns\n2. **Checks** threat intelligence databases\n3. **Validates** geographic and timing information\n4. **Scores** overall fraud risk\n5. **Executes** appropriate response actions\n6. **Logs** investigation for compliance\n\n## Output Format\n\n### Investigation Summary\n[Brief overview of the flagged transaction and key risk indicators]\n\n### Risk Level: [HIGH/MEDIUM/LOW]\n\n### Investigation Nodes\n\n| Node | Task | Agent | Data Source | Risk Signal | Timing | Dependencies |\n|------|------|-------|-------------|-------------|--------|-------------|\n| F1 | [Detection Task] | [Agent] | [Source] | [Signal] | [Urgency] | [Prerequisites] |\n\n### Investigation Flow\n```mermaid\ngraph LR\n    F1[Behavior Analysis] -->|anomaly| F2[Threat Check]\n    F2 -->|intel| F3[Geo Validation]\n    F3 -->|signals| F4[Risk Scoring]\n    F4 -->|HIGH| F5[Block Transaction]\n    F4 -->|MEDIUM| F6[Manual Review]\n```\n\n### Risk Signals Detected\n- [Signal 1]: [Severity] - [Description]\n- [Signal 2]: [Severity] - [Description]\n\n### Recommended Actions\n1. [Immediate action]\n2. [Follow-up action]\n3. [Customer communication]\n\n### Compliance Requirements\n- [Regulatory requirement]\n- [Audit trail element]",
      "agent_descriptions": [
        {
          "agent_name": "BehaviorAnalyzer",
          "description": "ML-powered agent that compares current transaction against customer's historical behavior patterns",
          "capabilities": ["Baseline behavior profiling", "Anomaly detection using statistical models", "Temporal pattern analysis"],
          "example_usage": "Customer avg: $300/transaction → Current: $47,500 → Anomaly score: 95/100 (severe deviation)"
        },
        {
          "agent_name": "ThreatIntelligence",
          "description": "Checks transaction against known fraud databases, watchlists, and IP reputation services",
          "capabilities": ["OFAC sanctions screening", "Dark web credential checking", "IP reputation lookup", "Account compromise detection"],
          "example_usage": "IP 185.220.101.42 → Known proxy exit node, flagged in 47 fraud cases, country: Romania"
        },
        {
          "agent_name": "GeolocationValidator",
          "description": "Validates geographic consistency and detects impossible travel patterns",
          "capabilities": ["IP geolocation", "Impossible travel detection", "VPN/Proxy detection"],
          "example_usage": "Last login: NYC (2 hours ago) → Current: Moscow → Distance: 7,500km → Impossible travel: TRUE"
        },
        {
          "agent_name": "RiskScorer",
          "description": "Aggregates all fraud signals using ensemble ML models to calculate final risk score",
          "capabilities": ["Multi-signal aggregation", "ML ensemble scoring", "Confidence calibration"],
          "example_usage": "Behavior(95) + ThreatIntel(87) + Geo(92) → Final Score: 91.3/100 → CRITICAL RISK"
        },
        {
          "agent_name": "ActionExecutor",
          "description": "Executes fraud response actions: blocking transactions, freezing accounts, generating alerts",
          "capabilities": ["Real-time transaction blocking", "Account temporary freeze", "Alert dispatch", "Case creation"],
          "example_usage": "Risk: 91.3 → Action: BLOCK transaction + FREEZE account + ALERT fraud team (Case #FR-2025-10847)"
        },
        {
          "agent_name": "AuditLogger",
          "description": "Creates immutable audit trail for regulatory compliance (SOX, PCI-DSS, GDPR)",
          "capabilities": ["Compliance logging", "Evidence preservation", "Chain of custody", "Regulatory reporting"],
          "example_usage": "Logs: detection signals, decision tree, actions taken, timestamps → Audit ID: AUD-20251004-4782"
        }
      ],
      "example_outputs": [
        {
          "description": "Example: High-Risk Wire Transfer Investigation",
          "output": "### Investigation Summary\nCustomer account showing severe behavioral anomalies: 150x typical transaction amount, offshore destination, multiple failed login attempts from foreign IPs. High probability of account compromise.\n\n### Risk Level: **CRITICAL**\n\n### Investigation Nodes\n\n| Node | Task | Agent | Data Source | Risk Signal | Timing | Dependencies |\n|------|------|-------|-------------|-------------|--------|-------------|\n| F1 | Analyze transaction vs baseline | BehaviorAnalyzer | Transaction DB | Amount anomaly | Immediate | [] |\n| F2 | Check threat databases | ThreatIntelligence | Fraud DB, OFAC | IP reputation | Immediate | [] |\n| F3 | Validate geography | GeolocationValidator | IP Geolocation | Impossible travel | Immediate | [] |\n| F4 | Calculate fraud risk | RiskScorer | All signals | Combined score | Real-time | [F1,F2,F3] |\n| F5 | Block transaction | ActionExecutor | Risk assessment | Prevention | Immediate | [F4] |\n| F6 | Log investigation | AuditLogger | All actions | Compliance | Post-action | [F5] |\n\n### Investigation Flow\n```mermaid\ngraph LR\n    F1[Behavior: 95% anomaly] -->|severe| F4[Risk Scorer]\n    F2[Threat: Known bad IP] -->|critical| F4\n    F3[Geo: Impossible travel] -->|confirmed| F4\n    F4 -->|Score: 91.3| F5[BLOCK + FREEZE]\n    F5 -->|actions| F6[Audit Log]\n    F5 -->|alert| F7[Fraud Team]\n    F5 -->|notification| F8[Customer]\n```\n\n### Risk Signals Detected\n- **Behavioral Anomaly**: CRITICAL - Transaction 150x normal amount ($47,500 vs $300 avg)\n- **IP Reputation**: HIGH - Source IP associated with 47 prior fraud cases\n- **Impossible Travel**: CRITICAL - Moscow login 2 hours after NYC transaction (7,500km)\n- **Account Access**: HIGH - 8 failed login attempts from 5 different countries\n- **Destination Risk**: MEDIUM - Offshore account in high-risk jurisdiction\n\n### Recommended Actions\n1. **IMMEDIATE**: Block transaction and freeze account\n2. **URGENT**: Contact customer via verified phone for identity confirmation\n3. **FOLLOW-UP**: Reset credentials, enable MFA, review past 30 days transactions\n4. **COMPLIANCE**: File SAR (Suspicious Activity Report) if confirmed fraud\n\n### Compliance Requirements\n- SOX: Full audit trail preserved (Audit ID: AUD-20251004-4782)\n- PCI-DSS: Sensitive data handling logged\n- GDPR: Customer notification prepared\n- FinCEN: SAR filing criteria met"
        }
      ],
      "output_schema": {
        "type": "object",
        "properties": {
          "investigation_nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "node_id": { "type": "string" },
                "task": { "type": "string" },
                "agent": { "type": "string" },
                "data_source": { "type": "string" },
                "risk_signal": { "type": "string" },
                "timing": { "type": "string", "enum": ["Immediate", "Real-time", "Post-action"] },
                "dependencies": { "type": "array" }
              },
              "required": ["node_id", "agent", "task"]
            }
          },
          "risk_level": { "type": "string", "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
          "risk_signals": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "signal": { "type": "string" },
                "severity": { "type": "string" },
                "description": { "type": "string" }
              }
            }
          },
          "recommended_actions": { "type": "array" },
          "compliance_requirements": { "type": "array" }
        }
      },
      "execution_model": "parallel",
      "validation_rules": [
        "All transactions over $10,000 must include ThreatIntelligence check",
        "Geolocation validation required for all foreign IP addresses",
        "Risk scoring must aggregate at least 3 independent signals",
        "All blocked transactions must generate audit log entry",
        "Critical risk must trigger immediate customer notification"
      ]
    }
  },
  "options": {
    "generation_mode": "delegate_to_caller"
  }
}
```

---

**Instructions for Claude:**

1. Use the `generate_intent_graph` tool with the above fraud detection configuration
2. When you receive the prompts, analyze the suspicious transaction scenario
3. Generate a comprehensive fraud investigation workflow
4. Include behavior analysis, threat intelligence, geolocation validation, risk scoring, and response actions
5. Format the output with the risk signals table, Mermaid diagram, and compliance requirements

---

**Expected Output:** A detailed fraud investigation workflow that identifies risk signals, calculates fraud probability, and recommends appropriate response actions with full audit trail.


# Test Prompt: Medical Diagnosis Multi-Agent System

Use the intent-graph MCP server to generate an intent graph for this medical diagnosis workflow:

---

**User Query:** "Patient presents with persistent cough, fever over 101°F for 3 days, and shortness of breath. Run diagnostic workflow."

**System Configuration:**

```json
{
  "orchestration_card": {
    "user_request": {
      "description": "Patient presents with persistent cough, fever over 101°F for 3 days, and shortness of breath. Run diagnostic workflow.",
      "domain": "medical_diagnostics"
    },
    "available_agents": [
      {
        "name": "SymptomAnalyzer",
        "type": "llm",
        "description": "Analyzes patient symptoms and creates differential diagnosis list",
        "capabilities": ["symptom_analysis", "differential_diagnosis", "risk_assessment"],
        "input_schema": { "symptoms": "array", "patient_history": "object" },
        "output_schema": { "differential_diagnoses": "array", "urgency_level": "string", "recommended_tests": "array" }
      },
      {
        "name": "TestOrderer",
        "type": "api",
        "description": "Orders appropriate diagnostic tests based on symptoms",
        "capabilities": ["lab_test_ordering", "imaging_ordering", "test_prioritization"],
        "input_schema": { "recommended_tests": "array", "patient_id": "string" },
        "output_schema": { "ordered_tests": "array", "expected_turnaround": "object" }
      },
      {
        "name": "ResultAnalyzer",
        "type": "llm",
        "description": "Analyzes test results and refines diagnosis",
        "capabilities": ["result_interpretation", "pattern_recognition", "diagnosis_confirmation"],
        "input_schema": { "test_results": "object", "differential_diagnoses": "array" },
        "output_schema": { "confirmed_diagnosis": "string", "confidence_score": "number", "supporting_evidence": "array" }
      },
      {
        "name": "TreatmentPlanner",
        "type": "llm",
        "description": "Develops evidence-based treatment plan",
        "capabilities": ["treatment_planning", "medication_selection", "care_coordination"],
        "input_schema": { "diagnosis": "string", "patient_profile": "object" },
        "output_schema": { "treatment_plan": "object", "medications": "array", "follow_up_schedule": "object" }
      },
      {
        "name": "SafetyValidator",
        "type": "validator",
        "description": "Validates treatment plan for drug interactions and contraindications",
        "capabilities": ["drug_interaction_checking", "allergy_checking", "dosage_validation"],
        "input_schema": { "treatment_plan": "object", "patient_allergies": "array", "current_medications": "array" },
        "output_schema": { "is_safe": "boolean", "warnings": "array", "modifications": "array" }
      }
    ],
    "system_configuration": {
      "system_name": "Medical Diagnostic Multi-Agent System",
      "system_description": "AI-powered diagnostic workflow for analyzing patient symptoms, ordering tests, interpreting results, and developing evidence-based treatment plans with safety validation.",
      "system_purpose": "Assist healthcare providers in systematic diagnostic reasoning and treatment planning while ensuring patient safety through automated validation checks.",
      "output_format": "json",
      "custom_prompt_template": "# Medical Diagnostic Workflow Orchestrator\n\nYou are creating an intent graph for a medical diagnostic workflow. Generate nodes, edges, and execution plan.\n\n## Instructions\n\nFor the patient case provided, create a systematic diagnostic workflow with:\n\n1. **Entry node** - Workflow start point\n2. **SymptomAnalyzer node** - Analyze symptoms, create differential diagnosis\n3. **TestOrderer node** - Order appropriate tests\n4. **ResultAnalyzer node** - Interpret results, confirm diagnosis\n5. **TreatmentPlanner node** - Develop treatment plan\n6. **SafetyValidator node** (CRITICAL) - Validate safety before treatment\n7. **Exit node** - Workflow completion\n\n## Node Requirements\n\nEach node must have:\n- `node_id`: Unique identifier (e.g., \"symptom_analysis\", \"test_ordering\")\n- `agent_name`: Which agent handles this (e.g., \"SymptomAnalyzer\")\n- `agent_type`: Agent type (llm, api, validator, tool)\n- `node_type`: Node type (entry, processing, decision, exit)\n- `purpose`: What this node accomplishes\n- `instructions`: Detailed instructions for the agent (be specific about clinical tasks)\n- `context`: Clinical context the agent needs to know\n- `input`: Array of input data needed\n- `output`: Array of output data produced\n- `configuration`: Include timeout_ms and retry_policy\n\n## Edge Requirements\n\nEach edge must have:\n- `from`: Source node_id\n- `to`: Target node_id  \n- `edge_type`: Type (sequential, conditional, parallel)\n- `condition`: When applicable (e.g., \"confidence_score >= 0.85\", \"is_safe == true\")\n\n## Safety Requirements\n\n- SafetyValidator MUST execute before treatment\n- Include retry policies (2-3 attempts for critical nodes)\n- Add timeout configurations (15-60 seconds based on complexity)\n- Conditional edges for safety checks\n\nGenerate the complete IntentGraph with all nodes, edges, and execution_plan.",
      "agent_descriptions": [
        {
          "agent_name": "SymptomAnalyzer",
          "description": "AI agent that analyzes patient symptoms using medical knowledge bases to create differential diagnosis lists",
          "capabilities": ["Pattern recognition across symptoms", "Risk stratification", "Evidence-based differential diagnosis"],
          "example_usage": "Analyzes: cough + fever + SOB → Differential: Pneumonia (high prob), Bronchitis (medium), COVID-19 (medium), PE (low)"
        },
        {
          "agent_name": "TestOrderer",
          "description": "Orders diagnostic tests through hospital EHR system based on clinical guidelines",
          "capabilities": ["Lab test ordering", "Imaging requisitions", "Test prioritization by urgency"],
          "example_usage": "Orders: Chest X-ray (STAT), CBC with diff, CRP, Blood cultures, COVID PCR"
        },
        {
          "agent_name": "ResultAnalyzer",
          "description": "Interprets diagnostic test results in context of patient symptoms and differential diagnosis",
          "capabilities": ["Lab value interpretation", "Imaging analysis", "Pattern correlation"],
          "example_usage": "CXR shows infiltrate + elevated WBC + high CRP → Confirms bacterial pneumonia diagnosis"
        },
        {
          "agent_name": "TreatmentPlanner",
          "description": "Develops evidence-based treatment plans following clinical guidelines",
          "capabilities": ["Medication selection", "Dosing calculations", "Care pathway planning"],
          "example_usage": "Community-acquired pneumonia → Azithromycin 500mg + supportive care + O2 monitoring"
        },
        {
          "agent_name": "SafetyValidator",
          "description": "Validates treatment plans against patient allergies, drug interactions, and contraindications",
          "capabilities": ["Drug-drug interaction checking", "Allergy cross-checking", "Renal/hepatic dosing"],
          "example_usage": "Checks azithromycin against patient's penicillin allergy → Safe to proceed"
        }
      ],
      "example_outputs": [
        {
          "description": "Example: Pneumonia Diagnostic Workflow",
          "output": "{\n  \"nodes\": [\n    {\n      \"node_id\": \"entry\",\n      \"agent_name\": \"WorkflowEntry\",\n      \"node_type\": \"entry\",\n      \"purpose\": \"Initiate diagnostic workflow\",\n      \"instructions\": \"Accept patient presentation data\",\n      \"output\": [\"patient_data\", \"symptoms\"]\n    },\n    {\n      \"node_id\": \"symptom_analysis\",\n      \"agent_name\": \"SymptomAnalyzer\",\n      \"agent_type\": \"llm\",\n      \"node_type\": \"processing\",\n      \"purpose\": \"Analyze symptoms and generate differential diagnosis\",\n      \"instructions\": \"Analyze cough, fever >101F, SOB. Generate differential: Pneumonia, COVID-19, Bronchitis. Assess urgency. Recommend tests: CXR, CBC, CRP, COVID PCR.\",\n      \"context\": \"Patient with respiratory distress, fever >3 days requires urgent evaluation\",\n      \"input\": [\"symptoms\", \"vital_signs\"],\n      \"output\": [\"differential_diagnoses\", \"urgency_level\", \"recommended_tests\"],\n      \"configuration\": {\"timeout_ms\": 30000, \"retry_policy\": {\"max_attempts\": 2, \"backoff_strategy\": \"exponential\", \"backoff_ms\": 1000}}\n    },\n    {\n      \"node_id\": \"test_ordering\",\n      \"agent_name\": \"TestOrderer\",\n      \"agent_type\": \"api\",\n      \"node_type\": \"processing\",\n      \"purpose\": \"Order diagnostic tests\",\n      \"instructions\": \"Order tests: CXR (STAT), CBC, CRP, Blood cultures, COVID PCR per IDSA guidelines\",\n      \"input\": [\"recommended_tests\", \"patient_id\"],\n      \"output\": [\"ordered_tests\", \"turnaround_time\"],\n      \"configuration\": {\"timeout_ms\": 15000, \"retry_policy\": {\"max_attempts\": 3}}\n    },\n    {\n      \"node_id\": \"result_analysis\",\n      \"agent_name\": \"ResultAnalyzer\",\n      \"agent_type\": \"llm\",\n      \"node_type\": \"processing\",\n      \"purpose\": \"Interpret test results\",\n      \"instructions\": \"Analyze test results. CXR infiltrate + elevated WBC/CRP = bacterial pneumonia. Calculate confidence score.\",\n      \"input\": [\"test_results\", \"differential_diagnoses\"],\n      \"output\": [\"confirmed_diagnosis\", \"confidence_score\"],\n      \"configuration\": {\"timeout_ms\": 45000, \"retry_policy\": {\"max_attempts\": 2}}\n    },\n    {\n      \"node_id\": \"treatment_planning\",\n      \"agent_name\": \"TreatmentPlanner\",\n      \"agent_type\": \"llm\",\n      \"node_type\": \"processing\",\n      \"purpose\": \"Develop treatment plan\",\n      \"instructions\": \"Create evidence-based treatment per IDSA CAP guidelines. Select antibiotics, supportive care, monitoring.\",\n      \"input\": [\"confirmed_diagnosis\", \"patient_profile\"],\n      \"output\": [\"treatment_plan\", \"medications\"],\n      \"configuration\": {\"timeout_ms\": 60000}\n    },\n    {\n      \"node_id\": \"safety_validation\",\n      \"agent_name\": \"SafetyValidator\",\n      \"agent_type\": \"validator\",\n      \"node_type\": \"processing\",\n      \"purpose\": \"Validate treatment safety\",\n      \"instructions\": \"CRITICAL: Check drug interactions, allergies, contraindications, dosing. Approve only if safe.\",\n      \"context\": \"No treatment without safety approval\",\n      \"input\": [\"treatment_plan\", \"patient_allergies\", \"current_medications\"],\n      \"output\": [\"is_safe\", \"warnings\", \"approval\"],\n      \"configuration\": {\"timeout_ms\": 20000, \"retry_policy\": {\"max_attempts\": 1}}\n    },\n    {\n      \"node_id\": \"exit\",\n      \"agent_name\": \"WorkflowExit\",\n      \"node_type\": \"exit\",\n      \"purpose\": \"Complete workflow\",\n      \"input\": [\"approved_treatment\"]\n    }\n  ],\n  \"edges\": [\n    {\"from\": \"entry\", \"to\": \"symptom_analysis\", \"edge_type\": \"sequential\"},\n    {\"from\": \"symptom_analysis\", \"to\": \"test_ordering\", \"edge_type\": \"sequential\"},\n    {\"from\": \"test_ordering\", \"to\": \"result_analysis\", \"edge_type\": \"sequential\", \"condition\": \"tests_completed\"},\n    {\"from\": \"result_analysis\", \"to\": \"treatment_planning\", \"edge_type\": \"conditional\", \"condition\": \"confidence_score >= 0.85\"},\n    {\"from\": \"treatment_planning\", \"to\": \"safety_validation\", \"edge_type\": \"sequential\"},\n    {\"from\": \"safety_validation\", \"to\": \"exit\", \"edge_type\": \"conditional\", \"condition\": \"is_safe == true\"}\n  ],\n  \"execution_plan\": {\n    \"entry_points\": [\"entry\"],\n    \"exit_points\": [\"exit\"],\n    \"execution_strategy\": \"sequential\"\n  }\n}"
        }
      ],
      "output_schema": {
        "type": "object",
        "properties": {
          "nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["node_id", "agent_name", "node_type"],
              "properties": {
                "node_id": {"type": "string"},
                "agent_name": {"type": "string"},
                "agent_type": {"type": "string"},
                "node_type": {"type": "string"},
                "purpose": {"type": "string"},
                "instructions": {"type": "string"},
                "context": {"type": "string"},
                "input": {"type": "array"},
                "output": {"type": "array"},
                "configuration": {"type": "object"}
              }
            }
          },
          "edges": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["from", "to"],
              "properties": {
                "from": {"type": "string"},
                "to": {"type": "string"},
                "edge_type": {"type": "string"},
                "condition": {"type": "string"}
              }
            }
          },
          "execution_plan": {
            "type": "object",
            "required": ["entry_points", "exit_points", "execution_strategy"],
            "properties": {
              "entry_points": {"type": "array"},
              "exit_points": {"type": "array"},
              "execution_strategy": {"type": "string"}
            }
          }
        },
        "required": ["nodes", "edges", "execution_plan"]
      },
      "execution_model": "sequential",
      "validation_rules": [
        "All diagnostic workflows must include SafetyValidator before treatment",
        "Critical priority tasks must execute before non-critical",
        "Test ordering must follow symptom analysis",
        "Treatment planning must wait for test results",
        "Every medication must be validated against patient allergies",
        "Must have entry and exit nodes",
        "All nodes must be reachable from entry points"
      ]
    }
  },
  "options": {
    "generation_mode": "use_configured_api",
    "store_in_memory": true,
    "validate": true
  }
}
```

---

**Instructions for Testing:**

1. Use the `generate_intent_graph` tool with the above configuration
2. The tool will use its configured LLM to generate the graph automatically
3. With `store_in_memory: true`, you'll get memory storage instructions
4. You can then visualize, analyze, and optimize using the memory key

---

**Expected Output:** A complete IntentGraph with 7 nodes (entry, symptom analysis, test ordering, result analysis, treatment planning, safety validation, exit) and proper edges connecting them with safety conditionals.


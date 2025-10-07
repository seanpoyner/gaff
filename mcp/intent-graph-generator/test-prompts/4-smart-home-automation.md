# Test Prompt: Smart Home Automation Multi-Agent System

Use the intent-graph MCP server to generate an intent graph for this smart home scenario:

---

**User Query:** "It's 11 PM, everyone is in bed, but motion detected in living room, front door unlocked, garage door open, and thermostat set to 85°F. Security cameras offline. Execute smart home security and comfort protocol."

**System Configuration:**

```json
{
  "orchestration_card": {
    "user_request": {
      "description": "It's 11 PM, everyone is in bed, but motion detected in living room, front door unlocked, garage door open, and thermostat set to 85°F. Security cameras offline. Execute smart home security and comfort protocol.",
      "domain": "smart_home_automation"
    },
    "available_agents": [
      {
        "name": "SecurityAnalyzer",
        "type": "llm",
        "description": "Analyzes security events and threat patterns across all home sensors",
        "capabilities": ["threat_detection", "anomaly_identification", "context_analysis", "risk_assessment"],
        "input_schema": { "sensors": "array", "occupancy": "object", "time": "string", "patterns": "object" },
        "output_schema": { "threat_level": "string", "anomalies": "array", "recommendations": "array" }
      },
      {
        "name": "DeviceController",
        "type": "api",
        "description": "Controls smart home devices (locks, lights, cameras, thermostats, garage)",
        "capabilities": ["device_control", "status_checking", "firmware_updates", "automation_execution"],
        "input_schema": { "device_ids": "array", "actions": "array" },
        "output_schema": { "executed_actions": "array", "device_statuses": "object", "failed_devices": "array" }
      },
      {
        "name": "OccupancyTracker",
        "type": "api",
        "description": "Tracks home occupancy using motion sensors, door sensors, and sleep tracking",
        "capabilities": ["presence_detection", "room_occupancy", "sleep_status", "pattern_learning"],
        "input_schema": { "sensor_data": "array", "timestamp": "string" },
        "output_schema": { "occupants": "array", "room_status": "object", "expected_patterns": "object" }
      },
      {
        "name": "ComfortOptimizer",
        "type": "llm",
        "description": "Optimizes HVAC, lighting, and comfort settings based on preferences and occupancy",
        "capabilities": ["climate_control", "lighting_adjustment", "energy_optimization", "preference_learning"],
        "input_schema": { "occupancy": "object", "weather": "object", "preferences": "object" },
        "output_schema": { "thermostat_settings": "object", "lighting_scenes": "array", "energy_mode": "string" }
      },
      {
        "name": "AlertDispatcher",
        "type": "api",
        "description": "Sends alerts via push notifications, SMS, email, and smart speaker announcements",
        "capabilities": ["notification_sending", "priority_routing", "escalation_management", "confirmation_tracking"],
        "input_schema": { "alert_type": "string", "message": "string", "recipients": "array", "urgency": "string" },
        "output_schema": { "sent_alerts": "array", "delivery_status": "object", "responses": "array" }
      },
      {
        "name": "RoutineExecutor",
        "type": "tool",
        "description": "Executes pre-programmed home automation routines (goodnight, away, emergency)",
        "capabilities": ["routine_execution", "scene_activation", "schedule_management", "conditional_logic"],
        "input_schema": { "routine_name": "string", "overrides": "object" },
        "output_schema": { "routine_status": "string", "actions_completed": "array", "duration_ms": "number" }
      }
    ],
    "system_configuration": {
      "system_name": "Smart Home Automation System",
      "system_description": "Intelligent home automation system that monitors security, comfort, energy, and safety using AI agents to detect anomalies, control devices, optimize comfort, and respond to emergencies.",
      "system_purpose": "Provide peace of mind, energy efficiency, and automated responses to security events while maintaining comfort and convenience for homeowners.",
      "output_format": "markdown",
      "custom_prompt_template": "# Smart Home Orchestrator\n\nYou are a smart home orchestrator that creates automation workflows for home AI agents.\n\n## Automation Protocol\n\nFor each home scenario, create a workflow that:\n1. **Assesses** security and safety situation\n2. **Tracks** home occupancy and expected patterns\n3. **Controls** devices to address issues\n4. **Optimizes** comfort settings appropriately\n5. **Alerts** homeowners of important events\n6. **Executes** appropriate automation routines\n\n## Output Format\n\n### Scenario Analysis\n[Brief analysis of the home situation and detected anomalies]\n\n### Automation Priority: [EMERGENCY/HIGH/MEDIUM/LOW]\n\n### Automation Nodes\n\n| Action | Purpose | Agent | Devices | Trigger | Timing | Dependencies |\n|--------|---------|-------|---------|---------|--------|-------------|\n| A1 | [Task] | [Agent] | [Devices] | [Condition] | [When] | [Prerequisites] |\n\n### Automation Flow\n```mermaid\ngraph TD\n    A1[Security Check] -->|threat| A2[Lock Doors]\n    A2 -->|secured| A3[Alert Owners]\n    A3 -->|notified| A4[Activate Cameras]\n```\n\n### Detected Anomalies\n- [Anomaly 1]: [Severity] - [Action taken]\n- [Anomaly 2]: [Severity] - [Action taken]\n\n### Device Actions\n1. [Device]: [Action] - [Reason]\n2. [Device]: [Action] - [Reason]\n\n### Safety Measures\n- [Safety action 1]\n- [Safety action 2]",
      "agent_descriptions": [
        {
          "agent_name": "SecurityAnalyzer",
          "description": "AI security agent that analyzes patterns across all home sensors to detect threats and anomalies",
          "capabilities": ["Multi-sensor correlation", "Behavioral pattern analysis", "Threat level assessment", "False alarm filtering"],
          "example_usage": "11 PM + motion + unlocked door + offline cameras + everyone in bed → THREAT DETECTED: Possible intrusion"
        },
        {
          "agent_name": "DeviceController",
          "description": "Central controller for all IoT devices supporting Z-Wave, Zigbee, WiFi protocols",
          "capabilities": ["Smart lock control", "Light/HVAC control", "Camera management", "Garage door operation"],
          "example_usage": "Commands: LOCK all doors, CLOSE garage, SET thermostat 72°F, REBOOT cameras, TURN ON exterior lights"
        },
        {
          "agent_name": "OccupancyTracker",
          "description": "Tracks who's home, which rooms are occupied, and sleep/wake patterns",
          "capabilities": ["Presence detection via BLE/WiFi", "Sleep tracking integration", "Room-level occupancy", "Pattern learning"],
          "example_usage": "11 PM: Master bedroom (2 occupants, sleep mode), Kids' rooms (sleep), Living room (unexpected motion detected)"
        },
        {
          "agent_name": "ComfortOptimizer",
          "description": "Optimizes climate, lighting, and comfort based on occupancy, preferences, and weather",
          "capabilities": ["Adaptive HVAC control", "Circadian lighting", "Energy cost optimization", "Preference learning"],
          "example_usage": "Night mode: Thermostat 72°F (from 85°F anomaly), lights off except night lights, quiet mode activated"
        },
        {
          "agent_name": "AlertDispatcher",
          "description": "Sends priority-based alerts through multiple channels with escalation",
          "capabilities": ["Push notifications", "SMS alerts", "Email", "Smart speaker announcements", "Emergency contacts"],
          "example_usage": "CRITICAL alert → Push to phones (both owners), SMS backup, announce on bedroom speaker: 'Security alert: motion detected'"
        },
        {
          "agent_name": "RoutineExecutor",
          "description": "Executes pre-programmed automation routines with conditional logic",
          "capabilities": ["Goodnight routine", "Away mode", "Emergency protocol", "Custom scenes", "Schedule management"],
          "example_usage": "Execute: EMERGENCY_SECURE routine → Lock all, close garage, lights on, cameras active, alert sent"
        }
      ],
      "example_outputs": [
        {
          "description": "Example: Late Night Security Incident",
          "output": "### Scenario Analysis\nAnomalous situation detected at 11 PM: unexpected motion in living room while all occupants are in bed (sleep mode), front door unlocked, garage door open, thermostat set abnormally high (85°F vs. normal 72°F), and security cameras offline. High probability of security breach or system malfunction requiring immediate automated response.\n\n### Automation Priority: **EMERGENCY**\n\n### Automation Nodes\n\n| Action | Purpose | Agent | Devices | Trigger | Timing | Dependencies |\n|--------|---------|-------|---------|---------|--------|-------------|\n| A1 | Assess security threat | SecurityAnalyzer | All sensors | Immediate | 0s | [] |\n| A2 | Verify occupancy status | OccupancyTracker | Motion, BLE | Immediate | 0s | [] |\n| A3 | Secure entry points | DeviceController | Locks, garage | Emergency | 2s | [A1] |\n| A4 | Restore cameras | DeviceController | Cameras | High | 5s | [A1] |\n| A5 | Send critical alert | AlertDispatcher | Phones, speakers | Critical | 3s | [A1, A2] |\n| A6 | Normalize climate | ComfortOptimizer | Thermostat | Medium | 10s | [A3] |\n| A7 | Execute emergency routine | RoutineExecutor | All devices | Emergency | 1s | [A3, A4] |\n\n### Automation Flow\n```mermaid\ngraph TD\n    A1[Security Analysis] -->|THREAT| A3[Lock All Doors]\n    A2[Check Occupancy] -->|All in bed| A5[Alert Owners]\n    A3 -->|Secured| A4[Reboot Cameras]\n    A3 -->|Secured| A7[Emergency Routine]\n    A4 -->|Online| A7\n    A1 -->|Anomaly| A5\n    A5 -->|Alerted| A6[Fix Thermostat]\n    A7 -->|Complete| A8[Monitor Mode]\n```\n\n### Detected Anomalies\n- **Motion Sensor**: CRITICAL - Living room motion at 11 PM while occupants sleeping\n- **Front Door**: HIGH - Unlocked during sleep hours (should be locked by 10 PM routine)\n- **Garage Door**: HIGH - Open at night (security risk, energy waste)\n- **Thermostat**: MEDIUM - Set to 85°F (possible tampering or malfunction, discomfort)\n- **Security Cameras**: HIGH - Offline (blind spot, system compromise suspected)\n- **Expected Pattern**: VIOLATED - All entry points should be secured during sleep hours\n\n### Device Actions\n1. **Smart Locks (Front, Back, Side)**: LOCK - Secure all entry points immediately\n2. **Garage Door**: CLOSE - Eliminate security vulnerability\n3. **Exterior Lights**: TURN ON - Deter potential intruders, aid cameras\n4. **Security Cameras (4)**: REBOOT - Restore monitoring capability\n5. **Thermostat**: SET to 72°F - Restore normal sleep temperature\n6. **Bedroom Smart Speaker**: ANNOUNCE - Notify occupants of security event\n7. **Motion Sensors**: SENSITIVITY HIGH - Enhanced detection mode\n8. **Interior Lights (Path)**: DIM ON - Safe navigation if needed\n\n### Safety Measures\n- Emergency services auto-dial prepared (requires owner confirmation within 60 seconds)\n- Exterior sirens armed (will activate if cameras detect person)\n- All door/window sensors monitoring continuously\n- Interior motion tracking active with alerts\n- Backup power (UPS) engaged for critical systems\n- Owner phones set to maximum volume for alert override"
        }
      ],
      "output_schema": {
        "type": "object",
        "properties": {
          "automation_nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "action_id": { "type": "string" },
                "purpose": { "type": "string" },
                "agent": { "type": "string" },
                "devices": { "type": "array" },
                "trigger": { "type": "string" },
                "timing": { "type": "string" },
                "dependencies": { "type": "array" }
              },
              "required": ["action_id", "agent", "purpose"]
            }
          },
          "priority": { "type": "string", "enum": ["EMERGENCY", "HIGH", "MEDIUM", "LOW"] },
          "detected_anomalies": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "anomaly": { "type": "string" },
                "severity": { "type": "string" },
                "action_taken": { "type": "string" }
              }
            }
          },
          "device_actions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "device": { "type": "string" },
                "action": { "type": "string" },
                "reason": { "type": "string" }
              }
            }
          },
          "safety_measures": { "type": "array" }
        }
      },
      "execution_model": "parallel",
      "validation_rules": [
        "Security actions must execute within 5 seconds of threat detection",
        "All entry points must be secured before sending all-clear",
        "Critical alerts must have delivery confirmation",
        "Camera reboot must complete before lowering alert status",
        "Emergency routines override all scheduled automations"
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

1. Use the `generate_intent_graph` tool with the smart home automation configuration
2. Analyze the security and anomaly situation
3. Generate a comprehensive automation workflow that secures the home, alerts owners, and optimizes comfort
4. Include parallel execution for time-critical security actions
5. Format with the automation table, Mermaid flow diagram, detected anomalies, and safety measures

---

**Expected Output:** A detailed smart home automation workflow that responds to security threats, controls devices, sends alerts, and executes emergency routines with proper priority and timing.


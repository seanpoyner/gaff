/**
 * Complete Workflow Demo Agent
 *
 * Demonstrates the full GAFF pipeline:
 * 1. User query → agent-orchestration → Orchestration Card
 * 2. Orchestration Card → intent-graph-generator → Intent Graph
 * 3. Intent Graph → router → Executed Workflow
 *
 * All powered by GAFF MCP servers and memory for state management
 *
 * Author: Sean Poyner <sean.poyner@pm.me>
 */
interface WorkflowResult {
    success: boolean;
    orchestration_card?: any;
    intent_graph?: any;
    execution_result?: any;
    memory_keys?: {
        orchestration?: string;
        graph?: string;
        execution?: string;
    };
    error?: string;
    steps_completed?: string[];
}
export declare class WorkflowDemoAgent {
    private agentOrchestrationClient;
    private intentGraphClient;
    private routerClient;
    private memoryClient;
    /**
     * Initialize all MCP server connections
     */
    initialize(): Promise<void>;
    /**
     * Execute a complete workflow from natural language query
     */
    executeWorkflow(userQuery: string): Promise<WorkflowResult>;
    /**
     * Get workflow status from memory
     */
    getWorkflowStatus(executionId: string): Promise<any>;
    /**
     * Clean up connections
     */
    cleanup(): Promise<void>;
}
export {};
//# sourceMappingURL=workflow-demo-agent.d.ts.map
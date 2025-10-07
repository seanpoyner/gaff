/**
 * Example: Workflow Orchestrator Agent
 *
 * Demonstrates a GAFF agent that creates and manages workflows
 * using the gaff_create_and_execute_workflow tool.
 *
 * Author: Sean Poyner <sean.poyner@pm.me>
 */
import { GaffAgentBase } from '../gaff-agent-base.js';
interface WorkflowRequest {
    description: string;
    validate_safety?: boolean;
    quality_check?: boolean;
}
/**
 * Workflow Orchestrator - Uses GAFF's high-level workflow tool
 */
export declare class WorkflowOrchestratorAgent extends GaffAgentBase {
    constructor();
    /**
     * Execute workflow orchestration
     */
    execute(input: WorkflowRequest): Promise<any>;
}
export {};
//# sourceMappingURL=workflow-orchestrator-agent.d.ts.map
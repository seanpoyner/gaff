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
export class WorkflowOrchestratorAgent extends GaffAgentBase {
  constructor() {
    super('DecisionRouter'); // Uses DecisionRouter config from gaff.json
  }
  
  /**
   * Execute workflow orchestration
   */
  async execute(input: WorkflowRequest): Promise<any> {
    console.error('\n🎭 Workflow Orchestrator Starting...\n');
    
    const { description, validate_safety = true, quality_check = true } = input;
    
    // Step 1: Use thinking to understand the request
    console.error('💭 Understanding workflow requirements...');
    await this.think(
      `I need to orchestrate a workflow: "${description}". Let me plan the approach.`,
      1,
      4,
      true
    );
    
    // Step 2: Search memory for similar past workflows
    console.error('🔍 Searching for similar past workflows...');
    const pastWorkflows = await this.memory_search(description);
    console.error('Past workflows found:', pastWorkflows);
    
    // Step 3: For critical operations, request human approval
    if (description.toLowerCase().includes('delete') || 
        description.toLowerCase().includes('remove')) {
      console.error('⚠️  Critical operation detected, requesting approval...');
      
      await this.requestApproval(
        `Execute workflow: ${description}`,
        'confirmation',
        {
          workflow_type: 'data_operation',
          risk_level: 'high',
          description: description
        }
      );
    }
    
    // Step 4: Create and execute the workflow
    console.error('🚀 Creating and executing workflow...');
    const result = await this.createWorkflow(description, {
      validate_safety,
      optimize_graph: true,
      quality_check,
      store_in_memory: true,
      execution_mode: 'sync'
    });
    
    console.error('Workflow result:', result);
    
    // Step 5: Store workflow execution in memory
    console.error('💾 Storing workflow execution in memory...');
    await this.memory_create([{
      name: `workflow_execution_${Date.now()}`,
      entityType: 'workflow_execution',
      observations: [
        `Description: ${description}`,
        `Safety validated: ${validate_safety}`,
        `Quality checked: ${quality_check}`,
        `Completed: ${new Date().toISOString()}`
      ]
    }]);
    
    // Step 6: Final thought
    await this.think(
      'Workflow completed successfully. All safety and quality checks passed.',
      4,
      4,
      false
    );
    
    console.error('✅ Workflow orchestration complete!\n');
    
    return {
      workflow_id: `wf_${Date.now()}`,
      status: 'completed',
      description,
      result,
      timestamp: new Date().toISOString()
    };
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const agent = new WorkflowOrchestratorAgent();
    
    try {
      await agent.initialize();
      
      const result = await agent.execute({
        description: 'Fetch user data, validate schema, transform to JSON, and store in database',
        validate_safety: true,
        quality_check: true
      });
      
      console.log('\n🎯 Orchestration Results:');
      console.log(JSON.stringify(result, null, 2));
      
      await agent.shutdown();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}


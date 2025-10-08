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
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
export class WorkflowDemoAgent {
    agentOrchestrationClient = null;
    intentGraphClient = null;
    routerClient = null;
    memoryClient = null;
    /**
     * Initialize all MCP server connections
     */
    async initialize() {
        console.log('🚀 Initializing Workflow Demo Agent...');
        // Ensure GAFF_ROOT is set if not already
        if (!process.env.GAFF_ROOT) {
            // Default to parent directory of this script
            const scriptDir = new URL('.', import.meta.url).pathname;
            process.env.GAFF_ROOT = scriptDir.replace(/^\/([A-Z]:)/, '$1').replace(/\/agents\/examples\/$/, '');
        }
        // Connect to agent-orchestration (local build)
        console.log('📦 Connecting to agent-orchestration...');
        const agentOrchTransport = new StdioClientTransport({
            command: 'node',
            args: ['C:/Users/seanp/projects/gaff/mcp/agent-orchestration/build/index.js'],
            env: {
                ...process.env,
                GAFF_ROOT: process.env.GAFF_ROOT
            }
        });
        this.agentOrchestrationClient = new Client({ name: 'workflow-demo-agent', version: '1.0.0' }, { capabilities: {} });
        await this.agentOrchestrationClient.connect(agentOrchTransport);
        console.log('✅ agent-orchestration connected');
        // Connect to intent-graph-generator
        console.log('📦 Connecting to intent-graph-generator...');
        const intentGraphTransport = new StdioClientTransport({
            command: 'node',
            args: ['C:/Users/seanp/projects/gaff/mcp/intent-graph-generator/build/index.js'],
            env: {
                ...process.env,
                GAFF_ROOT: process.env.GAFF_ROOT
            }
        });
        this.intentGraphClient = new Client({ name: 'workflow-demo-agent', version: '1.0.0' }, { capabilities: {} });
        await this.intentGraphClient.connect(intentGraphTransport);
        console.log('✅ intent-graph-generator connected');
        // Connect to router (published package)
        console.log('📦 Connecting to router...');
        const routerTransport = new StdioClientTransport({
            command: 'npx',
            args: ['-y', 'router-mcp-server'],
            env: {
                ...process.env,
                GAFF_ROOT: process.env.GAFF_ROOT
            }
        });
        this.routerClient = new Client({ name: 'workflow-demo-agent', version: '1.0.0' }, { capabilities: {} });
        await this.routerClient.connect(routerTransport);
        console.log('✅ router connected');
        // Connect to memory
        console.log('📦 Connecting to memory...');
        const memoryTransport = new StdioClientTransport({
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-memory'],
            env: process.env
        });
        this.memoryClient = new Client({ name: 'workflow-demo-agent', version: '1.0.0' }, { capabilities: {} });
        await this.memoryClient.connect(memoryTransport);
        console.log('✅ memory connected');
        console.log('🎉 All MCP servers connected!\n');
    }
    /**
     * Execute a complete workflow from natural language query
     */
    async executeWorkflow(userQuery) {
        const result = {
            success: false,
            steps_completed: [],
        };
        try {
            console.log('\n' + '='.repeat(60));
            console.log('🎯 Starting Workflow Execution');
            console.log('='.repeat(60));
            console.log(`📝 User Query: "${userQuery}"\n`);
            // Step 1: Generate Orchestration Card
            console.log('📋 Step 1: Generating Orchestration Card...');
            const orchestrationResult = await this.agentOrchestrationClient.callTool({
                name: 'generate_orchestration_card',
                arguments: {
                    query: userQuery,
                    generation_mode: 'delegate_to_caller',
                    store_in_memory: true,
                },
            });
            const orchestrationContent = orchestrationResult.content;
            if (!orchestrationContent || orchestrationContent.length === 0) {
                throw new Error('No orchestration card generated');
            }
            const orchestrationData = JSON.parse(orchestrationContent[0].text);
            result.orchestration_card = orchestrationData.orchestration_card;
            result.memory_keys = { orchestration: orchestrationData.memory_key };
            result.steps_completed.push('orchestration_card');
            console.log('✅ Orchestration Card generated!');
            console.log(`   Memory Key: ${orchestrationData.memory_key}`);
            console.log(`   Agents: ${orchestrationData.orchestration_card?.agents?.map((a) => a.name).join(', ') || 'N/A'}\n`);
            // Step 2: Generate Intent Graph
            console.log('🔗 Step 2: Generating Intent Graph...');
            const graphResult = await this.intentGraphClient.callTool({
                name: 'generate_intent_graph',
                arguments: {
                    orchestration_card: result.orchestration_card,
                    options: {
                        validate: true,
                        optimize: true,
                        store_in_memory: true,
                    },
                },
            });
            const graphContent = graphResult.content;
            const graphData = JSON.parse(graphContent[0].text);
            result.intent_graph = graphData.intent_graph;
            result.memory_keys.graph = graphData.memory_key;
            result.steps_completed.push('intent_graph');
            console.log('✅ Intent Graph generated!');
            console.log(`   Memory Key: ${graphData.memory_key}`);
            console.log(`   Nodes: ${graphData.intent_graph?.nodes?.length || 0}`);
            console.log(`   Edges: ${graphData.intent_graph?.edges?.length || 0}\n`);
            // Step 3: Execute Workflow
            console.log('⚙️  Step 3: Executing Workflow...');
            const executionResult = await this.routerClient.callTool({
                name: 'execute_graph',
                arguments: {
                    graph: result.intent_graph,
                    context: {
                        user_query: userQuery,
                        timestamp: new Date().toISOString(),
                    },
                    config: {
                        max_parallel: 3,
                        enable_hitl: false,
                        store_state_in_memory: true,
                    },
                },
            });
            const executionContent = executionResult.content;
            const executionData = JSON.parse(executionContent[0].text);
            result.execution_result = executionData;
            result.memory_keys.execution = executionData.execution_id;
            result.steps_completed.push('execution');
            console.log('✅ Workflow executed!');
            console.log(`   Execution ID: ${executionData.execution_id}`);
            console.log(`   Status: ${executionData.status}`);
            console.log(`   Nodes executed: ${executionData.nodes_executed}`);
            console.log(`   Time: ${executionData.execution_time_ms}ms\n`);
            // Step 4: Store final result in memory
            console.log('💾 Step 4: Storing final result in memory...');
            await this.memoryClient.callTool({
                name: 'create_entities',
                arguments: {
                    entities: [
                        {
                            name: `workflow_${Date.now()}`,
                            entityType: 'completed_workflow',
                            observations: [
                                `user_query: ${userQuery}`,
                                `orchestration_key: ${result.memory_keys.orchestration}`,
                                `graph_key: ${result.memory_keys.graph}`,
                                `execution_id: ${result.memory_keys.execution}`,
                                `status: ${executionData.status}`,
                                `completed_at: ${new Date().toISOString()}`,
                            ],
                        },
                    ],
                },
            });
            result.steps_completed.push('memory_storage');
            console.log('✅ Final result stored in memory!\n');
            result.success = true;
            console.log('='.repeat(60));
            console.log('🎉 Workflow Completed Successfully!');
            console.log('='.repeat(60) + '\n');
        }
        catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : String(error);
            console.error('❌ Workflow failed:', result.error);
        }
        return result;
    }
    /**
     * Get workflow status from memory
     */
    async getWorkflowStatus(executionId) {
        try {
            const statusResult = await this.routerClient.callTool({
                name: 'get_execution_status',
                arguments: { execution_id: executionId },
            });
            const statusContent = statusResult.content;
            return JSON.parse(statusContent[0].text);
        }
        catch (error) {
            throw new Error(`Failed to get status: ${error}`);
        }
    }
    /**
     * Clean up connections
     */
    async cleanup() {
        console.log('🧹 Cleaning up connections...');
        if (this.agentOrchestrationClient)
            await this.agentOrchestrationClient.close();
        if (this.intentGraphClient)
            await this.intentGraphClient.close();
        if (this.routerClient)
            await this.routerClient.close();
        if (this.memoryClient)
            await this.memoryClient.close();
        console.log('✅ Cleanup complete');
    }
}
/**
 * Example Usage
 */
async function main() {
    const agent = new WorkflowDemoAgent();
    try {
        await agent.initialize();
        const queries = [
            "Process customer feedback data and generate a sentiment analysis report",
            "Fetch sales data, analyze trends, and create a forecast for next quarter",
            "Review user feedback, identify top issues, and prioritize feature requests",
        ];
        for (const query of queries) {
            const result = await agent.executeWorkflow(query);
            if (result.success) {
                console.log('\n📊 Workflow Summary:');
                console.log(`   Query: ${query}`);
                console.log(`   Steps: ${result.steps_completed?.join(' → ')}`);
                console.log(`   Memory Keys: ${JSON.stringify(result.memory_keys, null, 2)}`);
            }
            console.log('\n' + '-'.repeat(60) + '\n');
        }
    }
    catch (error) {
        console.error('Fatal error:', error);
    }
    finally {
        await agent.cleanup();
    }
}
// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
//# sourceMappingURL=workflow-demo-agent.js.map
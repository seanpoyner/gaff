/**
 * Simple Chatbot Agent
 * 
 * A streamlined agent for web UI integration that uses GAFF's full pipeline
 * to process user queries and return responses.
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

import { WorkflowDemoAgent } from './workflow-demo-agent.js';

export class SimpleChatbotAgent {
  private workflowAgent: WorkflowDemoAgent;
  private initialized = false;

  constructor() {
    this.workflowAgent = new WorkflowDemoAgent();
  }

  /**
   * Initialize the agent (call once at startup)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🤖 Initializing Simple Chatbot Agent...');
    await this.workflowAgent.initialize();
    this.initialized = true;
    console.log('✅ Chatbot Agent ready!\n');
  }

  /**
   * Process a user message and return a response
   */
  async chat(userMessage: string): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`\n💬 Processing: "${userMessage}"`);
      
      const result = await this.workflowAgent.executeWorkflow(userMessage);

      if (!result.success) {
        return `I encountered an error processing your request: ${result.error}`;
      }

      // Format a nice response
      const response = this.formatResponse(result);
      return response;

    } catch (error) {
      console.error('Chat error:', error);
      return `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Format the workflow result into a user-friendly response
   */
  private formatResponse(result: any): string {
    const lines: string[] = [];

    lines.push('✅ I\'ve successfully processed your request!\n');

    // Orchestration summary
    if (result.orchestration_card) {
      const agents = result.orchestration_card.agents || [];
      lines.push(`📋 **Workflow Plan:**`);
      lines.push(`   • Identified ${agents.length} agent(s) to complete the task`);
      if (agents.length > 0) {
        lines.push(`   • Agents: ${agents.map((a: any) => a.name).join(', ')}`);
      }
      lines.push('');
    }

    // Graph summary
    if (result.intent_graph) {
      const nodes = result.intent_graph.nodes || [];
      const edges = result.intent_graph.edges || [];
      lines.push(`🔗 **Execution Graph:**`);
      lines.push(`   • ${nodes.length} task(s) planned`);
      lines.push(`   • ${edges.length} dependency relationship(s)`);
      lines.push('');
    }

    // Execution summary
    if (result.execution_result) {
      const exec = result.execution_result;
      lines.push(`⚙️  **Execution Results:**`);
      lines.push(`   • Status: ${exec.status}`);
      lines.push(`   • Tasks executed: ${exec.nodes_executed}`);
      lines.push(`   • Execution time: ${exec.execution_time_ms}ms`);
      
      if (exec.nodes_failed && exec.nodes_failed.length > 0) {
        lines.push(`   • Failed tasks: ${exec.nodes_failed.length}`);
      }
      lines.push('');
    }

    // Memory references
    if (result.memory_keys) {
      lines.push(`💾 **Saved for Reference:**`);
      lines.push(`   • Execution ID: \`${result.memory_keys.execution}\``);
      lines.push(`   • All workflow data stored in memory`);
      lines.push('');
    }

    lines.push(`🎯 **Next Steps:**`);
    lines.push(`You can ask me to:`);
    lines.push(`• Explain the workflow in detail`);
    lines.push(`• Show the execution status`);
    lines.push(`• Process another request`);

    return lines.join('\n');
  }

  /**
   * Get workflow status
   */
  async getStatus(executionId: string): Promise<string> {
    try {
      const status = await this.workflowAgent.getWorkflowStatus(executionId);
      
      const lines: string[] = [];
      lines.push(`📊 **Workflow Status:**\n`);
      lines.push(`• Status: ${status.status}`);
      lines.push(`• Progress: ${status.progress_percentage.toFixed(1)}%`);
      lines.push(`• Completed: ${status.nodes_completed}/${status.nodes_total} tasks`);
      
      if (status.waiting_for_approval) {
        lines.push(`\n⏸️  Waiting for approval at: ${status.waiting_for_approval.node_id}`);
      }
      
      return lines.join('\n');
    } catch (error) {
      return `Failed to get status: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.workflowAgent.cleanup();
  }
}

/**
 * Example standalone usage
 */
async function main() {
  const chatbot = new SimpleChatbotAgent();

  try {
    await chatbot.initialize();

    // Example conversation
    const messages = [
      "Analyze customer satisfaction scores from the last quarter",
      "Create a dashboard showing key performance metrics",
      "Summarize recent bug reports and prioritize fixes",
    ];

    for (const message of messages) {
      console.log('\n' + '='.repeat(80));
      console.log(`User: ${message}`);
      console.log('='.repeat(80));
      
      const response = await chatbot.chat(message);
      
      console.log('\nAssistant:');
      console.log(response);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await chatbot.cleanup();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}



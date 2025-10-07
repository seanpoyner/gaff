/**
 * Simple Chatbot Agent
 *
 * A streamlined agent for web UI integration that uses GAFF's full pipeline
 * to process user queries and return responses.
 *
 * Author: Sean Poyner <sean.poyner@pm.me>
 */
export declare class SimpleChatbotAgent {
    private workflowAgent;
    private initialized;
    constructor();
    /**
     * Initialize the agent (call once at startup)
     */
    initialize(): Promise<void>;
    /**
     * Process a user message and return a response
     */
    chat(userMessage: string): Promise<string>;
    /**
     * Format the workflow result into a user-friendly response
     */
    private formatResponse;
    /**
     * Get workflow status
     */
    getStatus(executionId: string): Promise<string>;
    /**
     * Cleanup
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=simple-chatbot-agent.d.ts.map
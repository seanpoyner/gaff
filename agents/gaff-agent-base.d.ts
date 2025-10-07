/**
 * GAFF Agent Base Class
 *
 * Base class for agents running WITHIN GAFF that need to use GAFF's MCP servers.
 * Provides MCP client functionality to connect to GAFF's internal MCP servers.
 *
 * Usage:
 *   class MyAgent extends GaffAgentBase {
 *     async execute(input: any) {
 *       // Use this.mcp to call any GAFF MCP tool
 *       const result = await this.mcp.call('memory_search_nodes', { query: 'test' });
 *       return result;
 *     }
 *   }
 *
 * Author: Sean Poyner <sean.poyner@pm.me>
 */
import { EventEmitter } from 'events';
interface GaffConfig {
    agents: Record<string, any>;
    models: Record<string, any>;
    protocols: any;
    [key: string]: any;
}
interface MCPToolCall {
    name: string;
    arguments: Record<string, any>;
}
interface MCPResponse {
    content: Array<{
        type: string;
        text?: string;
        data?: string;
    }>;
    isError?: boolean;
}
/**
 * MCP Client for internal GAFF agents
 */
declare class GaffMCPClient extends EventEmitter {
    private gatewayPath;
    private gatewayProcess;
    private requestId;
    private pendingRequests;
    private responseBuffer;
    constructor(gatewayPath: string);
    /**
     * Connect to GAFF Gateway
     */
    connect(): Promise<void>;
    /**
     * Handle response from gateway
     */
    private handleResponse;
    /**
     * Call an MCP tool
     */
    call(toolName: string, args: Record<string, any>): Promise<MCPResponse>;
    /**
     * List available tools
     */
    listTools(): Promise<any[]>;
    /**
     * Disconnect from gateway
     */
    disconnect(): Promise<void>;
}
/**
 * Base class for GAFF agents
 */
export declare abstract class GaffAgentBase {
    protected agentName: string;
    protected config: GaffConfig;
    protected mcp: GaffMCPClient;
    protected agentConfig: any;
    constructor(agentName: string);
    /**
     * Initialize agent (connect to MCP servers)
     */
    initialize(): Promise<void>;
    /**
     * Shutdown agent (disconnect from MCP servers)
     */
    shutdown(): Promise<void>;
    /**
     * Execute agent logic (must be implemented by subclass)
     */
    abstract execute(input: any): Promise<any>;
    /**
     * Validate input against agent's input schema
     */
    protected validateInput(input: any): boolean;
    /**
     * Helper: Call memory operations
     */
    protected memory_search(query: string): Promise<any>;
    protected memory_create(entities: any[]): Promise<any>;
    /**
     * Helper: Execute code in sandbox
     */
    protected sandbox_execute(language: string, code: string): Promise<any>;
    /**
     * Helper: Use sequential thinking
     */
    protected think(thought: string, thoughtNumber: number, totalThoughts: number, nextNeeded: boolean): Promise<any>;
    /**
     * Helper: Request human approval
     */
    protected requestApproval(description: string, actionType: string, context?: any): Promise<any>;
    /**
     * Helper: Generate and execute workflow
     */
    protected createWorkflow(query: string, options?: any): Promise<any>;
}
export { GaffMCPClient, MCPResponse, MCPToolCall, GaffConfig };
//# sourceMappingURL=gaff-agent-base.d.ts.map
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
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import { resolve } from 'path';
/**
 * MCP Client for internal GAFF agents
 */
class GaffMCPClient extends EventEmitter {
    gatewayPath;
    gatewayProcess = null;
    requestId = 1;
    pendingRequests = new Map();
    responseBuffer = '';
    constructor(gatewayPath) {
        super();
        this.gatewayPath = gatewayPath;
    }
    /**
     * Connect to GAFF Gateway
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.error('🔌 Connecting to GAFF Gateway...');
                this.gatewayProcess = spawn('node', [this.gatewayPath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                if (!this.gatewayProcess.stdout || !this.gatewayProcess.stdin) {
                    throw new Error('Failed to create gateway process pipes');
                }
                // Handle responses
                this.gatewayProcess.stdout.on('data', (chunk) => {
                    this.handleResponse(chunk);
                });
                // Handle errors
                this.gatewayProcess.stderr?.on('data', (chunk) => {
                    const stderr = chunk.toString();
                    // Don't log normal status messages
                    if (!stderr.includes('✅') && !stderr.includes('📦')) {
                        console.error('Gateway stderr:', stderr);
                    }
                });
                this.gatewayProcess.on('error', (error) => {
                    console.error('❌ Gateway process error:', error);
                    reject(error);
                });
                this.gatewayProcess.on('exit', (code) => {
                    console.error(`Gateway process exited with code ${code}`);
                    this.gatewayProcess = null;
                });
                // Wait for gateway to be ready
                setTimeout(() => {
                    console.error('✅ Connected to GAFF Gateway');
                    resolve();
                }, 500);
            }
            catch (error) {
                console.error('❌ Failed to connect to GAFF Gateway:', error);
                reject(error);
            }
        });
    }
    /**
     * Handle response from gateway
     */
    handleResponse(chunk) {
        this.responseBuffer += chunk.toString();
        // Try to parse complete JSON responses
        const lines = this.responseBuffer.split('\n');
        this.responseBuffer = lines.pop() || ''; // Keep incomplete line
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const response = JSON.parse(line);
                if (response.id && this.pendingRequests.has(response.id)) {
                    const { resolve, reject } = this.pendingRequests.get(response.id);
                    this.pendingRequests.delete(response.id);
                    if (response.error) {
                        reject(new Error(response.error.message || 'MCP error'));
                    }
                    else {
                        resolve(response.result);
                    }
                }
            }
            catch (e) {
                // Not valid JSON, might be partial response
            }
        }
    }
    /**
     * Call an MCP tool
     */
    async call(toolName, args) {
        if (!this.gatewayProcess || !this.gatewayProcess.stdin) {
            throw new Error('Not connected to gateway. Call connect() first.');
        }
        return new Promise((resolve, reject) => {
            const id = this.requestId++;
            const request = {
                jsonrpc: '2.0',
                id,
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                }
            };
            this.pendingRequests.set(id, { resolve, reject });
            // Send request
            this.gatewayProcess.stdin.write(JSON.stringify(request) + '\n');
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Tool call timeout: ${toolName}`));
                }
            }, 30000);
        });
    }
    /**
     * List available tools
     */
    async listTools() {
        if (!this.gatewayProcess || !this.gatewayProcess.stdin) {
            throw new Error('Not connected to gateway. Call connect() first.');
        }
        return new Promise((resolve, reject) => {
            const id = this.requestId++;
            const request = {
                jsonrpc: '2.0',
                id,
                method: 'tools/list'
            };
            this.pendingRequests.set(id, { resolve, reject });
            this.gatewayProcess.stdin.write(JSON.stringify(request) + '\n');
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('List tools timeout'));
                }
            }, 5000);
        });
    }
    /**
     * Disconnect from gateway
     */
    async disconnect() {
        if (this.gatewayProcess) {
            this.gatewayProcess.kill();
            this.gatewayProcess = null;
        }
        this.pendingRequests.clear();
        console.error('🔌 Disconnected from GAFF Gateway');
    }
}
/**
 * Base class for GAFF agents
 */
export class GaffAgentBase {
    agentName;
    config;
    mcp;
    agentConfig;
    constructor(agentName) {
        this.agentName = agentName;
        // Load gaff.json
        const configPath = process.env.GAFF_CONFIG_PATH || resolve(__dirname, '../gaff.json');
        this.config = JSON.parse(readFileSync(configPath, 'utf-8'));
        // Get this agent's config
        this.agentConfig = this.config.agents[agentName];
        if (!this.agentConfig) {
            throw new Error(`Agent ${agentName} not found in gaff.json`);
        }
        // Create MCP client pointing to gateway
        const gatewayPath = process.env.GAFF_GATEWAY_PATH ||
            resolve(__dirname, '../mcp/gaff-gateway/build/index.js');
        this.mcp = new GaffMCPClient(gatewayPath);
        console.error(`🤖 Initialized agent: ${agentName}`);
        console.error(`📋 Type: ${this.agentConfig.type}`);
        console.error(`🎯 Capabilities: ${this.agentConfig.capabilities.join(', ')}`);
    }
    /**
     * Initialize agent (connect to MCP servers)
     */
    async initialize() {
        await this.mcp.connect();
        // List available tools
        const toolsResult = await this.mcp.listTools();
        const tools = toolsResult.tools || [];
        console.error(`✅ Agent ${this.agentName} initialized with ${tools.length} MCP tools available`);
    }
    /**
     * Shutdown agent (disconnect from MCP servers)
     */
    async shutdown() {
        await this.mcp.disconnect();
        console.error(`👋 Agent ${this.agentName} shutdown`);
    }
    /**
     * Validate input against agent's input schema
     */
    validateInput(input) {
        // Basic validation - can be enhanced
        const schema = this.agentConfig.input_schema;
        for (const [key, type] of Object.entries(schema)) {
            if (!(key in input)) {
                throw new Error(`Missing required field: ${key}`);
            }
            const actualType = typeof input[key];
            if (actualType !== type) {
                throw new Error(`Invalid type for ${key}: expected ${type}, got ${actualType}`);
            }
        }
        return true;
    }
    /**
     * Helper: Call memory operations
     */
    async memory_search(query) {
        const response = await this.mcp.call('memory_search_nodes', { query });
        return response;
    }
    async memory_create(entities) {
        const response = await this.mcp.call('memory_create_entities', { entities });
        return response;
    }
    /**
     * Helper: Execute code in sandbox
     */
    async sandbox_execute(language, code) {
        const response = await this.mcp.call('sandbox_execute_code', { language, code });
        return response;
    }
    /**
     * Helper: Use sequential thinking
     */
    async think(thought, thoughtNumber, totalThoughts, nextNeeded) {
        const response = await this.mcp.call('thinking_sequential', {
            thought,
            thoughtNumber,
            totalThoughts,
            nextThoughtNeeded: nextNeeded
        });
        return response;
    }
    /**
     * Helper: Request human approval
     */
    async requestApproval(description, actionType, context) {
        const response = await this.mcp.call('tools_human_in_the_loop', {
            action_description: description,
            action_type: actionType,
            context: context || {}
        });
        return response;
    }
    /**
     * Helper: Generate and execute workflow
     */
    async createWorkflow(query, options) {
        const response = await this.mcp.call('gaff_create_and_execute_workflow', {
            query,
            options: options || {}
        });
        return response;
    }
}
export { GaffMCPClient };
//# sourceMappingURL=gaff-agent-base.js.map
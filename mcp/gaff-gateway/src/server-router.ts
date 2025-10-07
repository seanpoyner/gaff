/**
 * Server Router - Routes tool calls to appropriate GAFF MCP servers
 * 
 * Manages communication with child MCP servers and forwards tool calls.
 */

import { spawn, ChildProcess } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ServerConfig {
  name: string;
  command: string;
  args: string[];
  toolPrefix: string; // e.g., "memory_", "orchestration_"
}

/**
 * Routes tool calls to appropriate GAFF servers
 */
export class ServerRouter {
  private servers: Map<string, ChildProcess> = new Map();
  private serverConfigs: ServerConfig[] = [];
  
  constructor() {
    this.initializeServerConfigs();
  }
  
  /**
   * Initialize configurations for all GAFF servers
   */
  private initializeServerConfigs() {
    const gaffRoot = resolve(__dirname, '../../..');
    
    this.serverConfigs = [
      // Memory (official Anthropic server via npx)
      {
        name: 'memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        toolPrefix: 'memory_'
      },
      
      // Sandbox (official Anthropic server via npx)
      {
        name: 'sandbox',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sandbox'],
        toolPrefix: 'sandbox_'
      },
      
      // Sequential Thinking (official Anthropic server via npx)
      {
        name: 'sequential-thinking',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        toolPrefix: 'thinking_'
      },
      
      // Intent Graph Generator (published GAFF server)
      {
        name: 'intent-graph-generator',
        command: 'npx',
        args: ['-y', 'intent-graph-mcp-server@2.2.3'],
        toolPrefix: 'graph_'
      },
      
      // Agent Orchestration (local GAFF server)
      {
        name: 'agent-orchestration',
        command: 'node',
        args: [resolve(gaffRoot, 'agent-orchestration/build/index.js')],
        toolPrefix: 'orchestration_'
      },
      
      // Router (local GAFF server)
      {
        name: 'router',
        command: 'node',
        args: [resolve(gaffRoot, 'router/build/index.js')],
        toolPrefix: 'router_'
      },
      
      // Quality Check (local GAFF server)
      {
        name: 'quality-check',
        command: 'node',
        args: [resolve(gaffRoot, 'quality-check/build/index.js')],
        toolPrefix: 'quality_'
      },
      
      // Safety Protocols (local GAFF server)
      {
        name: 'safety-protocols',
        command: 'node',
        args: [resolve(gaffRoot, 'safety-protocols/build/index.js')],
        toolPrefix: 'safety_'
      },
      
      // Tools (local GAFF server)
      {
        name: 'tools',
        command: 'node',
        args: [resolve(gaffRoot, 'tools/build/index.js')],
        toolPrefix: 'tools_'
      },
    ];
  }
  
  /**
   * Route a tool call to the appropriate server
   */
  async routeToolCall(toolName: string, args: any): Promise<CallToolResult> {
    // Determine which server handles this tool
    const serverConfig = this.findServerForTool(toolName);
    
    if (!serverConfig) {
      return {
        content: [{
          type: "text",
          text: `❌ No server found for tool: ${toolName}\n\n` +
                `Available prefixes: ${this.serverConfigs.map(s => s.toolPrefix).join(', ')}`
        }]
      };
    }
    
    // For now, return a simulation of the call
    // Full implementation would spawn the server and communicate via stdio
    return this.simulateServerCall(serverConfig, toolName, args);
  }
  
  /**
   * Find which server config handles a given tool name
   */
  private findServerForTool(toolName: string): ServerConfig | null {
    for (const config of this.serverConfigs) {
      if (toolName.startsWith(config.toolPrefix)) {
        return config;
      }
    }
    
    // Special case: gaff_* tools are handled by the gateway itself
    if (toolName.startsWith('gaff_')) {
      return null;
    }
    
    return null;
  }
  
  /**
   * Simulate calling a server (Phase 2A - Simulation)
   * 
   * This demonstrates the routing logic. Full implementation would:
   * 1. Spawn the child process
   * 2. Send JSON-RPC request via stdin
   * 3. Read JSON-RPC response from stdout
   * 4. Return parsed result
   */
  private async simulateServerCall(
    serverConfig: ServerConfig,
    toolName: string,
    args: any
  ): Promise<CallToolResult> {
    const toolBaseName = toolName.replace(serverConfig.toolPrefix, '');
    
    return {
      content: [{
        type: "text",
        text: `✅ [SIMULATED] Routed to: ${serverConfig.name}\n\n` +
              `Server: ${serverConfig.name}\n` +
              `Command: ${serverConfig.command} ${serverConfig.args.join(' ')}\n` +
              `Tool: ${toolBaseName}\n` +
              `Arguments: ${JSON.stringify(args, null, 2)}\n\n` +
              `📋 Implementation Status:\n` +
              `✅ Phase 1: Tool aggregation (COMPLETE)\n` +
              `✅ Phase 2A: Server routing logic (COMPLETE - you are here!)\n` +
              `⏳ Phase 2B: Server communication (NEXT)\n\n` +
              `Phase 2B will:\n` +
              `1. Spawn child MCP server process\n` +
              `2. Send JSON-RPC request via stdin\n` +
              `3. Parse JSON-RPC response from stdout\n` +
              `4. Return actual result from server\n\n` +
              `This ensures full isolation and standard MCP protocol compliance.`
      }]
    };
  }
  
  /**
   * Start all GAFF servers (for persistent connections)
   * Optional optimization - can also spawn on-demand
   */
  async startAllServers() {
    console.error('📡 Starting all GAFF MCP servers...');
    
    for (const config of this.serverConfigs) {
      await this.startServer(config);
    }
    
    console.error(`✅ ${this.servers.size} servers started`);
  }
  
  /**
   * Start a single server
   */
  private async startServer(config: ServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const process = spawn(config.command, config.args, {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        process.on('error', (error) => {
          console.error(`❌ Failed to start ${config.name}:`, error.message);
          reject(error);
        });
        
        // Wait a moment for process to start
        setTimeout(() => {
          if (process.exitCode === null) {
            this.servers.set(config.name, process);
            console.error(`  ✅ ${config.name} started`);
            resolve();
          } else {
            reject(new Error(`${config.name} exited immediately`));
          }
        }, 100);
        
      } catch (error) {
        console.error(`❌ Failed to start ${config.name}:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * Stop all servers
   */
  async stopAllServers() {
    console.error('🛑 Stopping all GAFF MCP servers...');
    
    for (const [name, process] of this.servers.entries()) {
      process.kill();
      console.error(`  ✅ ${name} stopped`);
    }
    
    this.servers.clear();
  }
  
  /**
   * Send JSON-RPC request to a server (Phase 2B implementation)
   * 
   * This is the actual communication implementation for when we move beyond simulation
   */
  private async sendJsonRpcRequest(
    process: ChildProcess,
    method: string,
    params: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      };
      
      let responseData = '';
      
      // Set up response handler
      const onData = (chunk: Buffer) => {
        responseData += chunk.toString();
        
        try {
          const response = JSON.parse(responseData);
          process.stdout?.off('data', onData);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } catch (e) {
          // Not complete JSON yet, keep accumulating
        }
      };
      
      process.stdout?.on('data', onData);
      
      // Send request
      process.stdin?.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        process.stdout?.off('data', onData);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }
}


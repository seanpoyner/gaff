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
      
      // Agent Orchestration (published GAFF server)
      {
        name: 'agent-orchestration',
        command: 'npx',
        args: ['-y', 'agent-orchestration-mcp-server'],
        toolPrefix: 'orchestration_'
      },
      
      // Router (published GAFF server)
      {
        name: 'router',
        command: 'npx',
        args: ['-y', 'router-mcp-server'],
        toolPrefix: 'router_'
      },
      
      // Quality Check (published GAFF server)
      {
        name: 'quality-check',
        command: 'npx',
        args: ['-y', 'quality-check-mcp-server'],
        toolPrefix: 'quality_'
      },
      
      // Safety Protocols (published GAFF server)
      {
        name: 'safety-protocols',
        command: 'npx',
        args: ['-y', 'safety-protocols-mcp-server'],
        toolPrefix: 'safety_'
      },
      
      // Tools (published GAFF server)
      {
        name: 'tools',
        command: 'npx',
        args: ['-y', 'gaff-tools-mcp-server'],
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
    
    // Actually call the server
    return this.callServer(serverConfig, toolName, args);
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
   * Actually call a server (Phase 2B - Real Implementation)
   * 
   * Spawns the child MCP server and communicates via JSON-RPC over stdio
   */
  private async callServer(
    serverConfig: ServerConfig,
    toolName: string,
    args: any
  ): Promise<CallToolResult> {
    let toolBaseName = toolName.replace(serverConfig.toolPrefix, '');
    
    // Special mapping for tools where gateway name doesn't match server name
    const toolMappings: Record<string, string> = {
      'visualize': 'visualize_graph',
      'generate': 'generate_intent_graph',
      'generate_card': 'generate_orchestration_card',
      // Safety tools - these match the server names
      'validate_input': 'validate_input',
      'validate_output': 'validate_output',
      'enforce_rate_limits': 'enforce_rate_limits',
      'audit_log': 'audit_log'
    };
    
    if (toolMappings[toolBaseName]) {
      toolBaseName = toolMappings[toolBaseName];
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Server ${serverConfig.name} timed out after 30s`));
      }, 30000);
      
      try {
        // Spawn the child MCP server
        // On Windows, we need shell: true to properly resolve .cmd files like npx.cmd
        const child = spawn(serverConfig.command, serverConfig.args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: process.env,
          shell: true, // Required for Windows to find npx.cmd
        });
        
        let stdoutData = '';
        let stderrData = '';
        let responseParsed = false;
        
        // Collect stdout
        child.stdout.on('data', (data) => {
          stdoutData += data.toString();
          
          // Try to parse JSON-RPC response
          const lines = stdoutData.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const response = JSON.parse(line);
              if (response.result && !responseParsed) {
                responseParsed = true;
                clearTimeout(timeout);
                child.kill();
                
                // Return the tool call result
                resolve(response.result);
              }
            } catch (e) {
              // Not valid JSON yet, keep accumulating
            }
          }
        });
        
        // Collect stderr for logging
        child.stderr.on('data', (data) => {
          stderrData += data.toString();
          // Log server errors but don't fail
          console.error(`[${serverConfig.name}] ${data.toString().trim()}`);
        });
        
        // Handle process errors
        child.on('error', (err) => {
          clearTimeout(timeout);
          resolve({
            content: [{
              type: "text",
              text: `❌ Failed to start server ${serverConfig.name}: ${err.message}`
            }]
          });
        });
        
        // Handle process exit
        child.on('exit', (code) => {
          if (!responseParsed) {
            clearTimeout(timeout);
            resolve({
              content: [{
                type: "text",
                text: `❌ Server ${serverConfig.name} exited with code ${code}\n\nStderr: ${stderrData}`
              }]
            });
          }
        });
        
        // Send JSON-RPC request for tool call
        const request = {
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: toolBaseName,
            arguments: args
          }
        };
        
        child.stdin.write(JSON.stringify(request) + '\n');
        child.stdin.end();
        
      } catch (error: any) {
        clearTimeout(timeout);
        resolve({
          content: [{
            type: "text",
            text: `❌ Error calling server ${serverConfig.name}: ${error.message}`
          }]
        });
      }
    });
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


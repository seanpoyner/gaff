#!/usr/bin/env node

/**
 * GAFF CLI - Command-line interface for managing GAFF MCP servers
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = {
  start: startGateway,
  list: listServers,
  test: testWorkflow,
  version: showVersion,
  help: showHelp,
};

// Main entry point
const args = process.argv.slice(2);
const command = args[0] || 'start';

if (command in commands) {
  commands[command](args.slice(1));
} else {
  console.error(`Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}

/**
 * Start the GAFF Gateway (default MCP server mode)
 */
function startGateway(args) {
  console.error('Starting GAFF Gateway...');
  
  try {
    // Try to find gaff-gateway in node_modules
    const gatewayPath = resolve(__dirname, 'node_modules', 'gaff-gateway', 'build', 'index.js');
    
    const gateway = spawn('node', [gatewayPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    gateway.on('error', (err) => {
      console.error('Failed to start gateway:', err.message);
      console.error('Try: npm install -g @seanpoyner/gaff');
      process.exit(1);
    });

    gateway.on('exit', (code) => {
      process.exit(code || 0);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      gateway.kill('SIGINT');
    });
    process.on('SIGTERM', () => {
      gateway.kill('SIGTERM');
    });
  } catch (error) {
    console.error('Error starting gateway:', error.message);
    process.exit(1);
  }
}

/**
 * List all available GAFF MCP servers
 */
function listServers() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  GAFF MCP Servers                                             ║
╚════════════════════════════════════════════════════════════════╝

📦 Available Servers:

  1. gaff-gateway
     Unified entry point to all GAFF servers
     Usage: npx gaff-gateway

  2. agent-orchestration-mcp-server
     Convert natural language → orchestration cards
     Usage: npx agent-orchestration-mcp-server

  3. intent-graph-mcp-server
     Generate executable workflow graphs
     Usage: npx intent-graph-mcp-server

  4. router-mcp-server
     Execute workflows with memory & HITL
     Usage: npx router-mcp-server

  5. quality-check-mcp-server
     Quality validation & rerun strategies
     Usage: npx quality-check-mcp-server

  6. safety-protocols-mcp-server
     Guardrails & compliance enforcement
     Usage: npx safety-protocols-mcp-server

💡 Start the gateway (recommended):
   gaff start
   or
   npx @seanpoyner/gaff

📚 Documentation: https://github.com/seanpoyner/gaff
  `);
}

/**
 * Test a workflow with a sample query
 */
function testWorkflow(args) {
  const query = args.join(' ') || 'Analyze customer satisfaction scores';
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  GAFF Workflow Test                                           ║
╚════════════════════════════════════════════════════════════════╝

Query: "${query}"

❌ Direct testing not yet implemented.

To test GAFF:
  1. Start the gateway: gaff start
  2. Configure it in Claude/Cursor MCP settings
  3. Send queries through the UI

Or use the OpenAI adapter:
  cd ui
  node openai-adapter.js
  `);
}

/**
 * Show version information
 */
function showVersion() {
  console.log(`
GAFF v1.0.0
Graphical Agentic Flow Framework

Components:
  • gaff-gateway: 1.0.0
  • agent-orchestration: 1.0.1
  • intent-graph-generator: 2.2.4
  • router: 1.0.1
  • quality-check: 1.0.0
  • safety-protocols: 1.0.0

Repository: https://github.com/seanpoyner/gaff
License: MIT
  `);
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  GAFF CLI - Graphical Agentic Flow Framework                 ║
╚════════════════════════════════════════════════════════════════╝

Usage: gaff [command] [options]

Commands:
  start         Start the GAFF Gateway (default, MCP server mode)
  list          List all available GAFF MCP servers
  test [query]  Test a workflow with a sample query
  version       Show version information
  help          Show this help message

Examples:
  gaff                              # Start gateway (MCP mode)
  gaff start                        # Same as above
  gaff list                         # List all servers
  gaff test "analyze sales data"    # Test workflow
  gaff version                      # Show version

MCP Configuration (Claude/Cursor):
  Add to your mcp.json or claude_desktop_config.json:

  {
    "mcpServers": {
      "gaff": {
        "command": "npx",
        "args": ["-y", "@seanpoyner/gaff"]
      }
    }
  }

Documentation: https://github.com/seanpoyner/gaff
Issues: https://github.com/seanpoyner/gaff/issues
  `);
}


#!/usr/bin/env node

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎉 GAFF Installed Successfully!                             ║
║                                                                ║
║   Graphical Agentic Flow Framework                            ║
║   Complete MCP Server Suite for AI Agent Orchestration        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📦 Installed MCP Servers:
   ✓ gaff-gateway
   ✓ agent-orchestration-mcp-server
   ✓ intent-graph-mcp-server
   ✓ router-mcp-server
   ✓ quality-check-mcp-server
   ✓ safety-protocols-mcp-server

🚀 Quick Start:
   1. Start the GAFF Gateway:
      gaff start
      (or just: gaff)
      
   2. Use as MCP server in Claude/Cursor:
      Add to mcp.json:
      {
        "gaff": {
          "command": "npx",
          "args": ["-y", "@seanpoyner/gaff"]
        }
      }

   3. CLI Commands:
      gaff list     - List all servers
      gaff version  - Show version
      gaff help     - Show help

📚 Documentation: https://github.com/seanpoyner/gaff#readme
🐛 Issues: https://github.com/seanpoyner/gaff/issues
💬 Discussions: https://github.com/seanpoyner/gaff/discussions

Happy orchestrating! 🤖
`);


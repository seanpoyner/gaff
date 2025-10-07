#!/usr/bin/env node

/**
 * GAFF Sandbox Server
 * 
 * Wrapper around the official @modelcontextprotocol/server-sandbox
 * Provides safe code execution capabilities for GAFF
 * 
 * Bundled with GAFF to provide out-of-the-box code execution support
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

// Simply re-export and run the official sandbox server
import('@modelcontextprotocol/server-sandbox').then(module => {
  // The official server has its own CLI entry point
  // This wrapper just makes it available via GAFF
}).catch(error => {
  console.error('Failed to start sandbox server:', error);
  console.error('Make sure @modelcontextprotocol/server-sandbox is installed');
  process.exit(1);
});


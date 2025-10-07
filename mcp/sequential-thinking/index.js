#!/usr/bin/env node

/**
 * GAFF Sequential Thinking Server
 * 
 * Wrapper around the official @modelcontextprotocol/server-sequential-thinking
 * Provides step-by-step reasoning capabilities for complex problem-solving
 * 
 * Bundled with GAFF to provide out-of-the-box reasoning support
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

// Simply re-export and run the official sequential-thinking server
import('@modelcontextprotocol/server-sequential-thinking').then(module => {
  // The official server has its own CLI entry point
  // This wrapper just makes it available via GAFF
}).catch(error => {
  console.error('Failed to start sequential-thinking server:', error);
  console.error('Make sure @modelcontextprotocol/server-sequential-thinking is installed');
  process.exit(1);
});


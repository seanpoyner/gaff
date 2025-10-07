#!/usr/bin/env node

/**
 * GAFF Memory Server
 * 
 * Simple wrapper around the official @modelcontextprotocol/server-memory
 * Bundled with GAFF to provide out-of-the-box memory support
 * 
 * This ensures users don't need to install memory separately - 
 * GAFF includes it by default.
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

// Simply re-export and run the official memory server
import('@modelcontextprotocol/server-memory').then(module => {
  // The official server has its own CLI entry point
  // This wrapper just makes it available via GAFF
}).catch(error => {
  console.error('Failed to start memory server:', error);
  console.error('Make sure @modelcontextprotocol/server-memory is installed');
  process.exit(1);
});

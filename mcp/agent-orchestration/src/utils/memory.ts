/**
 * Memory utilities for orchestration cards
 * 
 * Author: Sean Poyner <sean.poyner@pm.me>
 */

/**
 * Generate a memory key for an orchestration card
 */
export function generateMemoryKey(card: any): string {
  const domain = card.user_request?.domain || 'workflow';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `orchestration_${domain}_${timestamp}_${random}`;
}

/**
 * Validate memory key format
 */
export function isValidMemoryKey(key: string): boolean {
  return /^orchestration_[\w-]+_\d+_[\w]+$/.test(key);
}


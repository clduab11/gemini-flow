/**
 * AP2 (Agent Payments Protocol)
 *
 * Extension of A2A protocol for payment capabilities.
 * Enables secure, verifiable transactions between agents and users.
 */

// Export types
export * from './types.js';

// Export managers
export * from './mandate-manager.js';
export * from './transaction-manager.js';

// Re-export main classes
import { MandateManager } from './mandate-manager.js';
import { TransactionManager } from './transaction-manager.js';

export {
  MandateManager,
  TransactionManager
};

/**
 * AP2 Protocol Manager
 * Main entry point for payment operations
 */
export class AP2Protocol {
  public mandateManager: MandateManager;
  public transactionManager: TransactionManager;

  constructor() {
    this.mandateManager = new MandateManager();
    this.transactionManager = new TransactionManager(this.mandateManager);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.mandateManager.clear();
    this.transactionManager.clear();
    console.log('[AP2] Protocol cleaned up');
  }
}

/**
 * Global instance
 */
let ap2Instance: AP2Protocol | null = null;

/**
 * Get AP2 protocol instance
 */
export function getAP2Protocol(): AP2Protocol {
  if (!ap2Instance) {
    ap2Instance = new AP2Protocol();
  }
  return ap2Instance;
}

/**
 * Reset AP2 instance (for testing)
 */
export function resetAP2Protocol(): void {
  if (ap2Instance) {
    ap2Instance.cleanup();
    ap2Instance = null;
  }
}

// Export default instance getter
export default getAP2Protocol;

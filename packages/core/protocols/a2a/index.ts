/**
 * A2A (Agent-to-Agent) Protocol
 *
 * Implementation of Google's A2A protocol for agent discovery,
 * capability negotiation, and task collaboration.
 *
 * @see https://github.com/a2aproject/A2A
 */

// Export types
export * from './types.js';

// Export agent card management
export * from './agent-card.js';

// Export communication
export * from './communication.js';

// Export protocol manager
export * from './protocol-manager.js';

// Re-export main classes for convenience
import { A2AProtocolManager, getA2AProtocol } from './protocol-manager.js';
import { AgentCardManager } from './agent-card.js';
import { A2ACommunicator, TaskExecutor } from './communication.js';

export {
  A2AProtocolManager,
  getA2AProtocol,
  AgentCardManager,
  A2ACommunicator,
  TaskExecutor
};

// Export default instance getter
export default getA2AProtocol;

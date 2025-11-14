/**
 * Agent Card Management
 * Handles agent discovery and capability advertisement
 */

import { AgentCard, Capability, AgentEndpoint } from './types.js';

export class AgentCardManager {
  private agentCards: Map<string, AgentCard> = new Map();

  /**
   * Register an agent
   */
  registerAgent(card: AgentCard): void {
    this.agentCards.set(card.id, card);
    console.log(`[A2A] Registered agent: ${card.name} (${card.id})`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): boolean {
    const removed = this.agentCards.delete(agentId);
    if (removed) {
      console.log(`[A2A] Unregistered agent: ${agentId}`);
    }
    return removed;
  }

  /**
   * Get agent card by ID
   */
  getAgent(agentId: string): AgentCard | undefined {
    return this.agentCards.get(agentId);
  }

  /**
   * Discover agents by capability
   */
  discoverAgents(capability?: string): AgentCard[] {
    const agents = Array.from(this.agentCards.values());

    if (!capability) {
      return agents;
    }

    return agents.filter(agent =>
      agent.capabilities.some(cap => cap.name === capability || cap.id === capability)
    );
  }

  /**
   * Find agents matching criteria
   */
  findAgents(filters: {
    capabilities?: string[];
    protocols?: string[];
    name?: string;
  }): AgentCard[] {
    let agents = Array.from(this.agentCards.values());

    // Filter by capabilities
    if (filters.capabilities && filters.capabilities.length > 0) {
      agents = agents.filter(agent =>
        filters.capabilities!.every(reqCap =>
          agent.capabilities.some(cap => cap.name === reqCap || cap.id === reqCap)
        )
      );
    }

    // Filter by protocols
    if (filters.protocols && filters.protocols.length > 0) {
      agents = agents.filter(agent =>
        agent.capabilities.some(cap =>
          filters.protocols!.some(proto => cap.protocols.includes(proto))
        )
      );
    }

    // Filter by name
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      agents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.description.toLowerCase().includes(searchTerm)
      );
    }

    return agents;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentCard[] {
    return Array.from(this.agentCards.values());
  }

  /**
   * Check if agent has capability
   */
  hasCapability(agentId: string, capabilityId: string): boolean {
    const agent = this.agentCards.get(agentId);
    if (!agent) {
      return false;
    }

    return agent.capabilities.some(cap => cap.id === capabilityId || cap.name === capabilityId);
  }

  /**
   * Get capability details
   */
  getCapability(agentId: string, capabilityId: string): Capability | undefined {
    const agent = this.agentCards.get(agentId);
    if (!agent) {
      return undefined;
    }

    return agent.capabilities.find(cap => cap.id === capabilityId || cap.name === capabilityId);
  }

  /**
   * Update agent card
   */
  updateAgent(agentId: string, updates: Partial<AgentCard>): boolean {
    const agent = this.agentCards.get(agentId);
    if (!agent) {
      return false;
    }

    const updated = { ...agent, ...updates, id: agent.id }; // Preserve ID
    this.agentCards.set(agentId, updated);
    console.log(`[A2A] Updated agent: ${agentId}`);
    return true;
  }

  /**
   * Export agent cards (for persistence)
   */
  exportCards(): AgentCard[] {
    return Array.from(this.agentCards.values());
  }

  /**
   * Import agent cards (from persistence)
   */
  importCards(cards: AgentCard[]): void {
    for (const card of cards) {
      this.agentCards.set(card.id, card);
    }
    console.log(`[A2A] Imported ${cards.length} agent cards`);
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agentCards.clear();
    console.log('[A2A] Cleared all agent cards');
  }

  /**
   * Get agent count
   */
  count(): number {
    return this.agentCards.size;
  }
}

/**
 * Create Gemini-Flow's own agent card
 */
export function createGeminiFlowAgentCard(): AgentCard {
  return {
    id: 'gemini-flow-orchestrator',
    name: 'Gemini-Flow Orchestrator',
    description: 'Quantum-ready AI orchestration platform for Google services',
    version: '1.0.0',
    capabilities: [
      {
        id: 'orchestrate',
        name: 'AI Orchestration',
        description: 'Orchestrate multiple AI services and agents',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string' },
            services: { type: 'array' },
            options: { type: 'object' }
          },
          required: ['task']
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'any' },
            metrics: { type: 'object' }
          }
        },
        protocols: ['A2A/1.0', 'AP2/1.0', 'MCP/1.0']
      },
      {
        id: 'quantum-optimize',
        name: 'Quantum Optimization',
        description: 'Optimize problems using quantum computing',
        inputSchema: {
          type: 'object',
          properties: {
            problem: { type: 'string' },
            algorithm: { type: 'string' },
            parameters: { type: 'object' }
          },
          required: ['problem']
        },
        outputSchema: {
          type: 'object',
          properties: {
            solution: { type: 'any' },
            circuit: { type: 'object' }
          }
        },
        protocols: ['A2A/1.0']
      },
      {
        id: 'browser-automate',
        name: 'Browser Automation',
        description: 'Automate Google services via Playwright',
        inputSchema: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            action: { type: 'string' },
            params: { type: 'object' }
          },
          required: ['service', 'action']
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'any' },
            screenshot: { type: 'string' }
          }
        },
        protocols: ['A2A/1.0']
      }
    ],
    endpoints: [
      {
        url: 'http://localhost:3000/a2a',
        protocol: 'http',
        transport: 'json-rpc'
      }
    ],
    authentication: {
      type: 'bearer',
      bearerFormat: 'JWT'
    },
    metadata: {
      author: 'clduab11',
      repository: 'https://github.com/clduab11/gemini-flow',
      protocols: ['A2A/1.0', 'AP2/1.0', 'MCP/1.0'],
      quantumReady: true,
      ultraSupport: true
    }
  };
}

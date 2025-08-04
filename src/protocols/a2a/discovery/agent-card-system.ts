/**
 * Agent Card System
 * 
 * Comprehensive agent discovery and registration system for A2A communication.
 * Provides agent registration, capability-based discovery, filtering, and metrics tracking.
 */

import { EventEmitter } from 'events';
import {
  AgentCard,
  AgentId,
  AgentType,
  AgentCapability,
  DiscoveryRequest,
  DiscoveryResponse,
  DiscoveryFilter,
  RegistrationRequest,
  RegistrationResponse
} from '../../../types/a2a.js';
import { Logger } from '../../../utils/logger.js';

/**
 * Agent registry entry with TTL support
 */
interface AgentRegistryEntry {
  agentCard: AgentCard;
  registrationTime: number;
  expiresAt?: number;
  lastHeartbeat: number;
}

/**
 * Discovery metrics
 */
export interface DiscoveryMetrics {
  totalDiscoveryRequests: number;
  avgDiscoveryTime: number;
  popularCapabilities: { [capability: string]: number };
  discoverySuccessRate: number;
  filterUsageStats: { [filter: string]: number };
}

/**
 * System metrics
 */
export interface SystemMetrics {
  totalRegisteredAgents: number;
  agentsByType: { [type in AgentType]?: number };
  agentsByStatus: { [status: string]: number };
  averageLoad: number;
  capabilityDistribution: { [capability: string]: number };
  trustLevelDistribution: { [level: string]: number };
  uptimeDistribution: { [range: string]: number };
}

/**
 * Agent Card System implementation
 */
export class AgentCardSystem extends EventEmitter {
  private logger: Logger;
  private agentRegistry: Map<AgentId, AgentRegistryEntry> = new Map();
  private capabilityIndex: Map<string, Set<AgentId>> = new Map();
  private serviceIndex: Map<string, Set<AgentId>> = new Map();
  private typeIndex: Map<AgentType, Set<AgentId>> = new Map();
  private isInitialized: boolean = false;

  // Metrics tracking
  private metrics: {
    totalDiscoveryRequests: number;
    discoveryTimes: number[];
    capabilityRequests: Map<string, number>;
    filterUsage: Map<string, number>;
    discoverySuccesses: number;
    discoveryFailures: number;
    startTime: number;
  } = {
    totalDiscoveryRequests: 0,
    discoveryTimes: [],
    capabilityRequests: new Map(),
    filterUsage: new Map(),
    discoverySuccesses: 0,
    discoveryFailures: 0,
    startTime: Date.now()
  };

  // Configuration
  private defaultTTL: number = 3600; // 1 hour default TTL
  private heartbeatInterval: number = 300000; // 5 minutes
  private cleanupInterval: number = 60000; // 1 minute

  constructor() {
    super();
    this.logger = new Logger('AgentCardSystem');

    // Set up periodic cleanup
    setInterval(() => this.cleanupExpiredAgents(), this.cleanupInterval);
  }

  /**
   * Initialize the agent card system
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Agent Card System');

      this.isInitialized = true;
      this.metrics.startTime = Date.now();

      this.logger.info('Agent Card System initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize Agent Card System:', error);
      throw error;
    }
  }

  /**
   * Shutdown the agent card system
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Agent Card System');

    this.isInitialized = false;
    this.agentRegistry.clear();
    this.capabilityIndex.clear();
    this.serviceIndex.clear();
    this.typeIndex.clear();

    this.logger.info('Agent Card System shutdown complete');
    this.emit('shutdown');
  }

  /**
   * Register an agent with optional TTL
   */
  async registerAgent(agentCard: AgentCard, ttl?: number): Promise<RegistrationResponse> {
    if (!this.isInitialized) {
      throw new Error('Agent Card System not initialized');
    }

    try {
      // Validate agent card
      this.validateAgentCard(agentCard);

      // Check for duplicate registration
      if (this.agentRegistry.has(agentCard.id)) {
        throw new Error(`Agent already registered: ${agentCard.id}`);
      }

      const now = Date.now();
      const effectiveTTL = ttl || this.defaultTTL;
      const expiresAt = now + (effectiveTTL * 1000);

      // Create registry entry
      const entry: AgentRegistryEntry = {
        agentCard: { ...agentCard },
        registrationTime: now,
        expiresAt,
        lastHeartbeat: now
      };

      // Register agent
      this.agentRegistry.set(agentCard.id, entry);

      // Update indexes
      this.updateIndexes(agentCard, 'add');

      this.logger.info('Agent registered successfully', {
        agentId: agentCard.id,
        agentType: agentCard.metadata.type,
        capabilities: agentCard.capabilities.length,
        ttl: effectiveTTL
      });

      this.emit('agentRegistered', agentCard);

      return {
        jsonrpc: '2.0',
        result: {
          registered: true,
          agentId: agentCard.id,
          expiresAt
        },
        id: null,
        from: 'agent-registry',
        to: agentCard.id,
        timestamp: now,
        messageType: 'response'
      };

    } catch (error) {
      this.logger.error('Failed to register agent:', error);
      throw error;
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: AgentId): Promise<boolean> {
    const entry = this.agentRegistry.get(agentId);
    if (!entry) {
      return false;
    }

    // Remove from indexes
    this.updateIndexes(entry.agentCard, 'remove');

    // Remove from registry
    this.agentRegistry.delete(agentId);

    this.logger.info('Agent unregistered', { agentId });
    this.emit('agentUnregistered', agentId);

    return true;
  }

  /**
   * Update existing agent card
   */
  async updateAgentCard(agentCard: AgentCard): Promise<boolean> {
    const entry = this.agentRegistry.get(agentCard.id);
    if (!entry) {
      return false;
    }

    try {
      // Validate updated card
      this.validateAgentCard(agentCard);

      // Update indexes (remove old, add new)
      this.updateIndexes(entry.agentCard, 'remove');
      this.updateIndexes(agentCard, 'add');

      // Update entry
      entry.agentCard = { ...agentCard };
      entry.lastHeartbeat = Date.now();

      this.logger.debug('Agent card updated', {
        agentId: agentCard.id,
        version: agentCard.version
      });

      this.emit('agentUpdated', agentCard);
      return true;

    } catch (error) {
      this.logger.error('Failed to update agent card:', error);
      return false;
    }
  }

  /**
   * Get agent card by ID
   */
  async getAgentCard(agentId: AgentId): Promise<AgentCard | null> {
    const entry = this.agentRegistry.get(agentId);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.unregisterAgent(agentId);
      return null;
    }

    return { ...entry.agentCard };
  }

  /**
   * Discover agents based on criteria
   */
  async discoverAgents(request: DiscoveryRequest): Promise<DiscoveryResponse> {
    if (!this.isInitialized) {
      throw new Error('Agent Card System not initialized');
    }

    const startTime = Date.now();
    this.metrics.totalDiscoveryRequests++;

    try {
      let candidateAgents = Array.from(this.agentRegistry.values());

      // Filter by capabilities
      if (request.params.capabilities && request.params.capabilities.length > 0) {
        candidateAgents = this.filterByCapabilities(candidateAgents, request.params.capabilities);
        
        // Track capability requests
        request.params.capabilities.forEach(cap => {
          const count = this.metrics.capabilityRequests.get(cap) || 0;
          this.metrics.capabilityRequests.set(cap, count + 1);
        });
      }

      // Filter by agent type
      if (request.params.agentType) {
        candidateAgents = candidateAgents.filter(entry => 
          entry.agentCard.metadata.type === request.params.agentType
        );
      }

      // Apply custom filters
      if (request.params.filters && request.params.filters.length > 0) {
        candidateAgents = this.applyFilters(candidateAgents, request.params.filters);
      }

      // Apply distance filtering
      if (request.params.maxDistance !== undefined) {
        candidateAgents = this.filterByDistance(candidateAgents, request.params.maxDistance);
      }

      // Remove expired agents
      candidateAgents = candidateAgents.filter(entry => 
        !entry.expiresAt || Date.now() < entry.expiresAt
      );

      // Extract agent cards
      const foundAgents = candidateAgents.map(entry => entry.agentCard);
      const searchTime = Date.now() - startTime;

      // Track metrics
      this.metrics.discoveryTimes.push(searchTime);
      if (this.metrics.discoveryTimes.length > 1000) {
        this.metrics.discoveryTimes.splice(0, 100);
      }

      if (foundAgents.length > 0) {
        this.metrics.discoverySuccesses++;
      } else {
        this.metrics.discoveryFailures++;
      }

      this.logger.debug('Agent discovery completed', {
        requestId: request.id,
        foundAgents: foundAgents.length,
        searchTime,
        criteria: {
          capabilities: request.params.capabilities?.length || 0,
          agentType: request.params.agentType,
          filters: request.params.filters?.length || 0
        }
      });

      return {
        jsonrpc: '2.0',
        result: {
          agents: foundAgents,
          totalFound: foundAgents.length,
          searchTime
        },
        id: request.id,
        from: 'agent-registry',
        to: request.from,
        timestamp: Date.now(),
        messageType: 'response'
      };

    } catch (error) {
      this.metrics.discoveryFailures++;
      this.logger.error('Agent discovery failed:', error);
      throw error;
    }
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capabilityName: string, version?: string): Promise<AgentCard[]> {
    const agentIds = this.capabilityIndex.get(capabilityName) || new Set();
    const matchingAgents: AgentCard[] = [];

    for (const agentId of agentIds) {
      const entry = this.agentRegistry.get(agentId);
      if (!entry || (entry.expiresAt && Date.now() > entry.expiresAt)) {
        continue;
      }

      const agentCard = entry.agentCard;
      const capability = agentCard.capabilities.find(cap => cap.name === capabilityName);
      
      if (capability) {
        // Check version compatibility if specified
        if (!version || this.isVersionCompatible(capability.version, version)) {
          matchingAgents.push(agentCard);
        }
      }
    }

    return matchingAgents;
  }

  /**
   * Find agents by type
   */
  async findAgentsByType(agentType: AgentType): Promise<AgentCard[]> {
    const agentIds = this.typeIndex.get(agentType) || new Set();
    const matchingAgents: AgentCard[] = [];

    for (const agentId of agentIds) {
      const entry = this.agentRegistry.get(agentId);
      if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
        matchingAgents.push(entry.agentCard);
      }
    }

    return matchingAgents;
  }

  /**
   * Find agents by service
   */
  async findAgentsByService(serviceName: string): Promise<AgentCard[]> {
    const agentIds = this.serviceIndex.get(serviceName) || new Set();
    const matchingAgents: AgentCard[] = [];

    for (const agentId of agentIds) {
      const entry = this.agentRegistry.get(agentId);
      if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
        matchingAgents.push(entry.agentCard);
      }
    }

    return matchingAgents;
  }

  /**
   * Refresh agent status (heartbeat)
   */
  async refreshAgentStatus(agentId: AgentId): Promise<boolean> {
    const entry = this.agentRegistry.get(agentId);
    if (!entry) {
      return false;
    }

    entry.lastHeartbeat = Date.now();
    entry.agentCard.metadata.lastSeen = Date.now();

    this.logger.debug('Agent status refreshed', { agentId });
    return true;
  }

  /**
   * Get registered agents map
   */
  getRegisteredAgents(): Map<AgentId, AgentCard> {
    const result = new Map<AgentId, AgentCard>();
    
    this.agentRegistry.forEach((entry, agentId) => {
      if (!entry.expiresAt || Date.now() < entry.expiresAt) {
        result.set(agentId, entry.agentCard);
      }
    });

    return result;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const activeAgents = Array.from(this.agentRegistry.values())
      .filter(entry => !entry.expiresAt || Date.now() < entry.expiresAt);

    // Count by type
    const agentsByType: { [type in AgentType]?: number } = {};
    const agentsByStatus: { [status: string]: number } = {};
    const capabilityDistribution: { [capability: string]: number } = {};
    const trustLevelDistribution: { [level: string]: number } = {};
    const uptimeRanges = { '<90%': 0, '90-95%': 0, '95-99%': 0, '99%+': 0 };

    let totalLoad = 0;

    activeAgents.forEach(entry => {
      const agent = entry.agentCard;

      // Type distribution
      agentsByType[agent.metadata.type] = (agentsByType[agent.metadata.type] || 0) + 1;

      // Status distribution
      agentsByStatus[agent.metadata.status] = (agentsByStatus[agent.metadata.status] || 0) + 1;

      // Load accumulation
      totalLoad += agent.metadata.load;

      // Capability distribution
      agent.capabilities.forEach(cap => {
        capabilityDistribution[cap.name] = (capabilityDistribution[cap.name] || 0) + 1;
      });

      // Trust level distribution
      if (agent.metadata.trustLevel) {
        trustLevelDistribution[agent.metadata.trustLevel] = 
          (trustLevelDistribution[agent.metadata.trustLevel] || 0) + 1;
      }

      // Uptime distribution
      if (agent.metadata.metrics?.uptime !== undefined) {
        const uptime = agent.metadata.metrics.uptime;
        if (uptime < 90) uptimeRanges['<90%']++;
        else if (uptime < 95) uptimeRanges['90-95%']++;
        else if (uptime < 99) uptimeRanges['95-99%']++;
        else uptimeRanges['99%+']++;
      }
    });

    return {
      totalRegisteredAgents: activeAgents.length,
      agentsByType,
      agentsByStatus,
      averageLoad: activeAgents.length > 0 ? totalLoad / activeAgents.length : 0,
      capabilityDistribution,
      trustLevelDistribution,
      uptimeDistribution: uptimeRanges
    };
  }

  /**
   * Get discovery metrics
   */
  getDiscoveryMetrics(): DiscoveryMetrics {
    const popularCapabilities: { [capability: string]: number } = {};
    this.metrics.capabilityRequests.forEach((count, capability) => {
      popularCapabilities[capability] = count;
    });

    const filterUsageStats: { [filter: string]: number } = {};
    this.metrics.filterUsage.forEach((count, filter) => {
      filterUsageStats[filter] = count;
    });

    return {
      totalDiscoveryRequests: this.metrics.totalDiscoveryRequests,
      avgDiscoveryTime: this.metrics.discoveryTimes.length > 0
        ? this.metrics.discoveryTimes.reduce((a, b) => a + b, 0) / this.metrics.discoveryTimes.length
        : 0,
      popularCapabilities,
      discoverySuccessRate: this.metrics.totalDiscoveryRequests > 0
        ? this.metrics.discoverySuccesses / this.metrics.totalDiscoveryRequests
        : 0,
      filterUsageStats
    };
  }

  /**
   * Validate agent card
   */
  private validateAgentCard(agentCard: AgentCard): void {
    if (!agentCard.id || agentCard.id.trim() === '') {
      throw new Error('Invalid agent card: missing required fields');
    }

    if (!agentCard.name || !agentCard.version) {
      throw new Error('Invalid agent card: missing required fields');
    }

    if (!agentCard.metadata || !agentCard.metadata.type) {
      throw new Error('Invalid agent card: missing required fields');
    }

    if (!Array.isArray(agentCard.capabilities)) {
      throw new Error('Invalid agent card: capabilities must be an array');
    }

    if (!Array.isArray(agentCard.services)) {
      throw new Error('Invalid agent card: services must be an array');
    }

    if (!Array.isArray(agentCard.endpoints)) {
      throw new Error('Invalid agent card: endpoints must be an array');
    }
  }

  /**
   * Update search indexes
   */
  private updateIndexes(agentCard: AgentCard, operation: 'add' | 'remove'): void {
    const agentId = agentCard.id;

    if (operation === 'add') {
      // Capability index
      agentCard.capabilities.forEach(capability => {
        if (!this.capabilityIndex.has(capability.name)) {
          this.capabilityIndex.set(capability.name, new Set());
        }
        this.capabilityIndex.get(capability.name)!.add(agentId);
      });

      // Service index
      agentCard.services.forEach(service => {
        if (!this.serviceIndex.has(service.name)) {
          this.serviceIndex.set(service.name, new Set());
        }
        this.serviceIndex.get(service.name)!.add(agentId);

        if (!this.serviceIndex.has(service.method)) {
          this.serviceIndex.set(service.method, new Set());
        }
        this.serviceIndex.get(service.method)!.add(agentId);
      });

      // Type index
      if (!this.typeIndex.has(agentCard.metadata.type)) {
        this.typeIndex.set(agentCard.metadata.type, new Set());
      }
      this.typeIndex.get(agentCard.metadata.type)!.add(agentId);

    } else {
      // Remove from capability index
      agentCard.capabilities.forEach(capability => {
        const capabilitySet = this.capabilityIndex.get(capability.name);
        if (capabilitySet) {
          capabilitySet.delete(agentId);
          if (capabilitySet.size === 0) {
            this.capabilityIndex.delete(capability.name);
          }
        }
      });

      // Remove from service index
      agentCard.services.forEach(service => {
        const nameSet = this.serviceIndex.get(service.name);
        if (nameSet) {
          nameSet.delete(agentId);
          if (nameSet.size === 0) {
            this.serviceIndex.delete(service.name);
          }
        }

        const methodSet = this.serviceIndex.get(service.method);
        if (methodSet) {
          methodSet.delete(agentId);
          if (methodSet.size === 0) {
            this.serviceIndex.delete(service.method);
          }
        }
      });

      // Remove from type index
      const typeSet = this.typeIndex.get(agentCard.metadata.type);
      if (typeSet) {
        typeSet.delete(agentId);
        if (typeSet.size === 0) {
          this.typeIndex.delete(agentCard.metadata.type);
        }
      }
    }
  }

  /**
   * Filter agents by capabilities
   */
  private filterByCapabilities(
    candidates: AgentRegistryEntry[],
    requiredCapabilities: string[]
  ): AgentRegistryEntry[] {
    return candidates.filter(entry => {
      const agentCapabilities = entry.agentCard.capabilities.map(cap => cap.name);
      return requiredCapabilities.every(required => agentCapabilities.includes(required));
    });
  }

  /**
   * Apply discovery filters
   */
  private applyFilters(
    candidates: AgentRegistryEntry[],
    filters: DiscoveryFilter[]
  ): AgentRegistryEntry[] {
    return candidates.filter(entry => {
      return filters.every(filter => this.evaluateFilter(entry.agentCard, filter));
    });
  }

  /**
   * Evaluate a single filter
   */
  private evaluateFilter(agentCard: AgentCard, filter: DiscoveryFilter): boolean {
    try {
      // Track filter usage
      const filterKey = `${filter.field}:${filter.operator}`;
      const count = this.metrics.filterUsage.get(filterKey) || 0;
      this.metrics.filterUsage.set(filterKey, count + 1);

      const fieldValue = this.getNestedValue(agentCard, filter.field);
      
      switch (filter.operator) {
        case 'eq':
          return fieldValue === filter.value;
        case 'ne':
          return fieldValue !== filter.value;
        case 'gt':
          return Number(fieldValue) > Number(filter.value);
        case 'lt':
          return Number(fieldValue) < Number(filter.value);
        case 'gte':
          return Number(fieldValue) >= Number(filter.value);
        case 'lte':
          return Number(fieldValue) <= Number(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'contains':
          if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => this.deepIncludes(item, filter.value));
          }
          if (typeof fieldValue === 'string') {
            return fieldValue.includes(filter.value);
          }
          return this.deepIncludes(fieldValue, filter.value);
        default:
          throw new Error(`Invalid filter operator: ${filter.operator}`);
      }
    } catch (error) {
      this.logger.warn('Filter evaluation failed', {
        field: filter.field,
        operator: filter.operator,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Filter agents by distance
   */
  private filterByDistance(
    candidates: AgentRegistryEntry[],
    maxDistance: number
  ): AgentRegistryEntry[] {
    // Simplified distance calculation - in practice this would use network topology
    return candidates.filter(entry => {
      const distance = this.calculateDistance(entry.agentCard);
      return distance <= maxDistance;
    });
  }

  /**
   * Calculate distance to agent (simplified)
   */
  private calculateDistance(agentCard: AgentCard): number {
    // Simple heuristic based on agent type and load
    let distance = 1;
    
    if (agentCard.metadata.type === 'coordinator') distance = 1;
    else if (agentCard.metadata.type === 'specialist') distance = 2;
    else distance = 3;
    
    // Add load penalty
    distance += Math.floor(agentCard.metadata.load * 2);
    
    return distance;
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(agentVersion: string, requiredVersion: string): boolean {
    try {
      const agentVer = this.parseVersion(agentVersion);
      const requiredVer = this.parseVersion(requiredVersion);

      // Major version must match
      if (agentVer.major !== requiredVer.major) return false;

      // Agent version must be >= required version
      if (agentVer.minor < requiredVer.minor) return false;
      if (agentVer.minor === requiredVer.minor && agentVer.patch < requiredVer.patch) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse version string
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Deep includes check for complex objects
   */
  private deepIncludes(haystack: any, needle: any): boolean {
    if (haystack === needle) return true;
    
    if (typeof haystack === 'object' && typeof needle === 'object') {
      if (Array.isArray(needle)) {
        return needle.every(item => this.deepIncludes(haystack, item));
      }
      
      for (const [key, value] of Object.entries(needle)) {
        if (!this.deepIncludes(haystack[key], value)) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }

  /**
   * Clean up expired agents
   */
  private cleanupExpiredAgents(): void {
    const now = Date.now();
    const expiredAgents: AgentId[] = [];

    this.agentRegistry.forEach((entry, agentId) => {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredAgents.push(agentId);
      }
    });

    expiredAgents.forEach(agentId => {
      this.unregisterAgent(agentId);
    });

    if (expiredAgents.length > 0) {
      this.logger.info(`Cleaned up ${expiredAgents.length} expired agents`);
    }
  }
}
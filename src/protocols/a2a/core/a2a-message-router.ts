/**
 * A2A Message Router
 *
 * Intelligent message routing system for Agent-to-Agent communication.
 * Supports multiple routing strategies including load balancing, capability-aware routing,
 * cost optimization, and shortest path routing.
 */

import { EventEmitter } from "node:events";
import {
  A2AMessage,
  AgentCard,
  AgentId,
  MessageRoute,
  RoutingStrategy,
  A2AError,
  A2AErrorType,
  MessagePriority,
  AgentCapability,
} from "../../../types/a2a.js";
import { Logger } from "../../../utils/logger.js";

/**
 * Routing table entry
 */
interface RoutingEntry {
  agentCard: AgentCard;
  lastUpdated: number;
  connectionQuality: number; // 0-1 score based on latency, reliability, etc.
  distance: number; // Network distance/hops
}

/**
 * Route scoring criteria
 */
interface RouteScore {
  agent: AgentCard;
  score: number;
  factors: {
    load: number;
    capability: number;
    cost: number;
    latency: number;
    reliability: number;
    distance: number;
  };
}

/**
 * Routing metrics
 */
export interface RoutingMetrics {
  totalRoutedMessages: number;
  routingSuccesses: number;
  routingFailures: number;
  avgRoutingTime: number;
  routingSuccessRate: number;
  routingErrorRate: number;
  strategiesUsed: { [key in RoutingStrategy]?: number };
  hopDistribution: { [hops: number]: number };
  agentLoadDistribution: { [agentId: string]: number };
  routingFailuresByType: { [key in A2AErrorType]?: number };
}

/**
 * Graph edge for shortest path calculation
 */
interface GraphEdge {
  to: AgentId;
  weight: number;
  quality: number;
}

/**
 * A2A Message Router with intelligent routing algorithms
 */
export class A2AMessageRouter extends EventEmitter {
  private logger: Logger;
  private routingTable: Map<AgentId, RoutingEntry> = new Map();
  private networkGraph: Map<AgentId, GraphEdge[]> = new Map();
  private isInitialized: boolean = false;

  // Routing metrics
  private metrics: {
    totalRoutedMessages: number;
    routingSuccesses: number;
    routingFailures: number;
    routingTimes: number[];
    strategiesUsed: Map<RoutingStrategy, number>;
    hopDistribution: Map<number, number>;
    agentLoadDistribution: Map<AgentId, number>;
    failuresByType: Map<A2AErrorType, number>;
    startTime: number;
  } = {
    totalRoutedMessages: 0,
    routingSuccesses: 0,
    routingFailures: 0,
    routingTimes: [],
    strategiesUsed: new Map(),
    hopDistribution: new Map(),
    agentLoadDistribution: new Map(),
    failuresByType: new Map(),
    startTime: Date.now(),
  };

  // Configuration
  private maxRoutingTime: number = 5000; // 5 seconds max routing time
  private routingTableTTL: number = 300000; // 5 minutes TTL
  private maxHops: number = 10;
  private loadBalanceThreshold: number = 0.8; // Load threshold for load balancing

  constructor() {
    super();
    this.logger = new Logger("A2AMessageRouter");

    // Set up periodic cleanup
    setInterval(() => this.cleanupRoutingTable(), 60000); // Every minute
  }

  /**
   * Initialize the message router
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing A2A Message Router");

      // Initialize network graph
      this.networkGraph.clear();
      this.routingTable.clear();

      this.isInitialized = true;
      this.metrics.startTime = Date.now();

      this.logger.info("A2A Message Router initialized successfully");
      this.emit("initialized");
    } catch (error) {
      this.logger.error("Failed to initialize A2A Message Router:", error);
      throw error;
    }
  }

  /**
   * Shutdown the message router
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down A2A Message Router");

    this.isInitialized = false;
    this.routingTable.clear();
    this.networkGraph.clear();

    this.logger.info("A2A Message Router shutdown complete");
    this.emit("shutdown");
  }

  /**
   * Route a message to appropriate agent(s)
   */
  async routeMessage(message: A2AMessage): Promise<MessageRoute> {
    if (!this.isInitialized) {
      throw this.createRoutingError("routing_error", "Router not initialized");
    }

    const startTime = Date.now();
    this.metrics.totalRoutedMessages++;

    try {
      // Validate routing table
      if (this.routingTable.size === 0) {
        throw this.createRoutingError(
          "routing_error",
          "Routing table is empty or corrupted",
        );
      }

      // Determine routing strategy
      const strategy =
        message.route?.strategy || this.determineOptimalStrategy(message);

      // Route based on strategy
      let route: MessageRoute;
      switch (strategy) {
        case "direct":
          route = await this.routeDirect(message);
          break;
        case "load_balanced":
          route = await this.routeLoadBalanced(message);
          break;
        case "capability_aware":
          route = await this.routeCapabilityAware(message);
          break;
        case "cost_optimized":
          route = await this.routeCostOptimized(message);
          break;
        case "shortest_path":
          route = await this.routeShortestPath(message);
          break;
        default:
          throw this.createRoutingError(
            "routing_error",
            `Unknown routing strategy: ${strategy}`,
          );
      }

      // Track success metrics
      const routingTime = Date.now() - startTime;
      this.trackRoutingSuccess(strategy, route, routingTime);

      this.logger.debug("Message routed successfully", {
        strategy,
        from: message.from,
        to: message.to,
        hops: route.hops,
        routingTime,
      });

      return route;
    } catch (error: any) {
      this.trackRoutingFailure(error);

      // Try fallback routing if primary strategy fails
      if (error.type !== "agent_unavailable") {
        try {
          const fallbackRoute = await this.routeDirect(message);
          fallbackRoute.strategy = "direct"; // Mark as fallback

          this.logger.warn("Used fallback routing after primary failure", {
            originalError: error.message,
            fallbackStrategy: "direct",
          });

          return fallbackRoute;
        } catch (fallbackError) {
          this.logger.error("Fallback routing also failed:", fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Register an agent in the routing table
   */
  async registerAgent(agentCard: AgentCard): Promise<void> {
    if (this.routingTable.has(agentCard.id)) {
      throw new Error(`Agent already registered: ${agentCard.id}`);
    }

    const routingEntry: RoutingEntry = {
      agentCard,
      lastUpdated: Date.now(),
      connectionQuality: this.calculateConnectionQuality(agentCard),
      distance: this.calculateNetworkDistance(agentCard),
    };

    this.routingTable.set(agentCard.id, routingEntry);
    this.updateNetworkGraph(agentCard);

    this.logger.debug("Agent registered in routing table", {
      agentId: agentCard.id,
      agentType: agentCard.metadata.type,
      capabilities: agentCard.capabilities.length,
    });
  }

  /**
   * Unregister an agent from the routing table
   */
  async unregisterAgent(agentId: AgentId): Promise<void> {
    if (!this.routingTable.has(agentId)) {
      return; // Already unregistered
    }

    this.routingTable.delete(agentId);
    this.networkGraph.delete(agentId);

    // Remove references from other agents' edges
    this.networkGraph.forEach((edges, nodeId) => {
      const filteredEdges = edges.filter((edge) => edge.to !== agentId);
      this.networkGraph.set(nodeId, filteredEdges);
    });

    this.logger.debug("Agent unregistered from routing table", { agentId });
  }

  /**
   * Update agent metrics for routing decisions
   */
  async updateAgentMetrics(agentId: AgentId, metrics: any): Promise<void> {
    const routingEntry = this.routingTable.get(agentId);
    if (!routingEntry) {
      return; // Agent not registered
    }

    // Update agent card metrics
    if (metrics.load !== undefined) {
      routingEntry.agentCard.metadata.load = metrics.load;
    }
    if (metrics.status !== undefined) {
      routingEntry.agentCard.metadata.status = metrics.status;
    }
    if (
      metrics.responseTime !== undefined &&
      routingEntry.agentCard.metadata.metrics
    ) {
      routingEntry.agentCard.metadata.metrics.responseTime =
        metrics.responseTime;
    }

    // Recalculate connection quality
    routingEntry.connectionQuality = this.calculateConnectionQuality(
      routingEntry.agentCard,
    );
    routingEntry.lastUpdated = Date.now();

    // Update network graph weights
    this.updateNetworkGraph(routingEntry.agentCard);
  }

  /**
   * Find route between agents
   */
  async findRoute(
    from: AgentId,
    to: AgentId | AgentId[],
    strategy?: RoutingStrategy,
  ): Promise<MessageRoute> {
    const message: A2AMessage = {
      jsonrpc: "2.0",
      method: "route.find",
      id: `route_${Date.now()}`,
      from,
      to,
      timestamp: Date.now(),
      messageType: "request",
      route: strategy ? { path: [], hops: 0, strategy } : undefined,
    };

    return await this.routeMessage(message);
  }

  /**
   * Get current routing table
   */
  getRoutingTable(): Map<AgentId, AgentCard> {
    const result = new Map<AgentId, AgentCard>();
    this.routingTable.forEach((entry, agentId) => {
      result.set(agentId, entry.agentCard);
    });
    return result;
  }

  /**
   * Get routing metrics
   */
  getRoutingMetrics(): RoutingMetrics {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;

    // Convert maps to objects
    const strategiesUsed: { [key in RoutingStrategy]?: number } = {};
    this.metrics.strategiesUsed.forEach((count, strategy) => {
      strategiesUsed[strategy] = count;
    });

    const hopDistribution: { [hops: number]: number } = {};
    this.metrics.hopDistribution.forEach((count, hops) => {
      hopDistribution[hops] = count;
    });

    const agentLoadDistribution: { [agentId: string]: number } = {};
    this.metrics.agentLoadDistribution.forEach((load, agentId) => {
      agentLoadDistribution[agentId] = load;
    });

    const routingFailuresByType: { [key in A2AErrorType]?: number } = {};
    this.metrics.failuresByType.forEach((count, type) => {
      routingFailuresByType[type] = count;
    });

    return {
      totalRoutedMessages: this.metrics.totalRoutedMessages,
      routingSuccesses: this.metrics.routingSuccesses,
      routingFailures: this.metrics.routingFailures,
      avgRoutingTime:
        this.metrics.routingTimes.length > 0
          ? this.metrics.routingTimes.reduce((a, b) => a + b, 0) /
            this.metrics.routingTimes.length
          : 0,
      routingSuccessRate:
        this.metrics.totalRoutedMessages > 0
          ? this.metrics.routingSuccesses / this.metrics.totalRoutedMessages
          : 0,
      routingErrorRate:
        this.metrics.totalRoutedMessages > 0
          ? this.metrics.routingFailures / this.metrics.totalRoutedMessages
          : 0,
      strategiesUsed,
      hopDistribution,
      agentLoadDistribution,
      routingFailuresByType,
    };
  }

  /**
   * Direct routing - route directly to target agent
   */
  private async routeDirect(message: A2AMessage): Promise<MessageRoute> {
    if (typeof message.to !== "string") {
      throw this.createRoutingError(
        "routing_error",
        "Direct routing requires single target agent",
      );
    }

    const targetEntry = this.routingTable.get(message.to);
    if (!targetEntry) {
      throw this.createRoutingError(
        "agent_unavailable",
        `Target agent not found: ${message.to}`,
      );
    }

    // Check agent status
    if (targetEntry.agentCard.metadata.status === "offline") {
      throw this.createRoutingError(
        "agent_unavailable",
        `Target agent is offline: ${message.to}`,
      );
    }

    return {
      path: [message.from, message.to],
      hops: 1,
      strategy: "direct",
    };
  }

  /**
   * Load-balanced routing - select least loaded agent from targets
   */
  private async routeLoadBalanced(message: A2AMessage): Promise<MessageRoute> {
    const candidateAgents = this.getCandidateAgents(message.to);
    if (candidateAgents.length === 0) {
      throw this.createRoutingError(
        "agent_unavailable",
        "No candidate agents available",
      );
    }

    // Filter by load threshold
    const availableAgents = candidateAgents.filter(
      (agent) =>
        agent.metadata.load < this.loadBalanceThreshold &&
        agent.metadata.status !== "offline" &&
        agent.metadata.status !== "overloaded",
    );

    if (availableAgents.length === 0) {
      // All agents are overloaded, pick the least loaded one
      const leastLoadedAgent = candidateAgents.reduce((prev, current) =>
        prev.metadata.load < current.metadata.load ? prev : current,
      );

      return {
        path: [message.from, leastLoadedAgent.id],
        hops: 1,
        strategy: "load_balanced",
      };
    }

    // Select least loaded available agent
    const selectedAgent = availableAgents.reduce((prev, current) =>
      prev.metadata.load < current.metadata.load ? prev : current,
    );

    return {
      path: [message.from, selectedAgent.id],
      hops: 1,
      strategy: "load_balanced",
    };
  }

  /**
   * Capability-aware routing - route to agent with best capability match
   */
  private async routeCapabilityAware(
    message: A2AMessage,
  ): Promise<MessageRoute> {
    const requiredCapabilities = message.capabilities || [];
    if (requiredCapabilities.length === 0) {
      // No specific capabilities required, fall back to load balanced
      return await this.routeLoadBalanced(message);
    }

    const candidateAgents = this.getCandidateAgents(message.to);
    const scores: RouteScore[] = [];

    for (const agent of candidateAgents) {
      const score = this.calculateCapabilityScore(agent, requiredCapabilities);
      if (score.factors.capability > 0) {
        // Has at least some required capabilities
        scores.push(score);
      }
    }

    if (scores.length === 0) {
      throw this.createRoutingError(
        "capability_not_found",
        `No agents found with required capability: ${requiredCapabilities[0].name}`,
      );
    }

    // Sort by capability score (descending) and load (ascending)
    scores.sort((a, b) => {
      if (Math.abs(a.factors.capability - b.factors.capability) > 0.1) {
        return b.factors.capability - a.factors.capability; // Higher capability first
      }
      return a.factors.load - b.factors.load; // Lower load first
    });

    const bestAgent = scores[0].agent;
    return {
      path: [message.from, bestAgent.id],
      hops: 1,
      strategy: "capability_aware",
    };
  }

  /**
   * Cost-optimized routing - select lowest cost agent
   */
  private async routeCostOptimized(message: A2AMessage): Promise<MessageRoute> {
    const candidateAgents = this.getCandidateAgents(message.to);
    if (candidateAgents.length === 0) {
      throw this.createRoutingError(
        "agent_unavailable",
        "No candidate agents available",
      );
    }

    const maxCost = message.context?.maxCost;
    const availableAgents = candidateAgents.filter((agent) => {
      if (agent.metadata.status === "offline") return false;

      // Find matching service cost
      const serviceCost = this.getServiceCost(agent, message.method);
      return maxCost ? serviceCost <= maxCost : true;
    });

    if (availableAgents.length === 0) {
      if (maxCost) {
        throw this.createRoutingError(
          "resource_exhausted",
          `Service cost exceeds maximum allowed cost (${maxCost})`,
        );
      } else {
        throw this.createRoutingError(
          "agent_unavailable",
          "No available agents",
        );
      }
    }

    // Select agent with lowest cost
    const selectedAgent = availableAgents.reduce((prev, current) => {
      const prevCost = this.getServiceCost(prev, message.method);
      const currentCost = this.getServiceCost(current, message.method);
      return prevCost < currentCost ? prev : current;
    });

    return {
      path: [message.from, selectedAgent.id],
      hops: 1,
      strategy: "cost_optimized",
    };
  }

  /**
   * Shortest path routing using Dijkstra's algorithm
   */
  private async routeShortestPath(message: A2AMessage): Promise<MessageRoute> {
    if (typeof message.to !== "string") {
      throw this.createRoutingError(
        "routing_error",
        "Shortest path routing requires single target",
      );
    }

    const path = this.findShortestPath(message.from, message.to);
    if (!path || path.length === 0) {
      throw this.createRoutingError(
        "routing_error",
        `No path found to agent: ${message.to}`,
      );
    }

    const maxHops = message.route?.maxHops || this.maxHops;
    if (path.length - 1 > maxHops) {
      throw this.createRoutingError(
        "routing_error",
        `Path exceeds maximum hops: ${path.length - 1} > ${maxHops}`,
      );
    }

    return {
      path,
      hops: path.length - 1,
      strategy: "shortest_path",
    };
  }

  /**
   * Determine optimal routing strategy based on message characteristics
   */
  private determineOptimalStrategy(message: A2AMessage): RoutingStrategy {
    // Priority messages use direct routing
    if (message.priority === "critical" || message.priority === "high") {
      return "direct";
    }

    // Messages with capability requirements use capability-aware routing
    if (message.capabilities && message.capabilities.length > 0) {
      return "capability_aware";
    }

    // Messages with cost constraints use cost-optimized routing
    if (message.context?.maxCost) {
      return "cost_optimized";
    }

    // Broadcast messages don't need routing
    if (message.to === "broadcast" || Array.isArray(message.to)) {
      return "direct";
    }

    // Default to load balanced for better performance
    return "load_balanced";
  }

  /**
   * Get candidate agents for routing
   */
  private getCandidateAgents(
    to: AgentId | AgentId[] | "broadcast",
  ): AgentCard[] {
    if (to === "broadcast") {
      // Return all registered agents
      return Array.from(this.routingTable.values()).map(
        (entry) => entry.agentCard,
      );
    }

    if (Array.isArray(to)) {
      // Return specified agents that are registered
      const agents: AgentCard[] = [];
      for (const agentId of to) {
        const entry = this.routingTable.get(agentId);
        if (entry) {
          agents.push(entry.agentCard);
        }
      }
      return agents;
    }

    // Single agent
    const entry = this.routingTable.get(to);
    return entry ? [entry.agentCard] : [];
  }

  /**
   * Calculate capability matching score
   */
  private calculateCapabilityScore(
    agent: AgentCard,
    requiredCapabilities: AgentCapability[],
  ): RouteScore {
    let capabilityScore = 0;
    let matchedCapabilities = 0;

    for (const required of requiredCapabilities) {
      const agentCapability = agent.capabilities.find(
        (cap) => cap.name === required.name,
      );
      if (agentCapability) {
        matchedCapabilities++;

        // Version compatibility scoring
        const versionScore = this.calculateVersionCompatibility(
          agentCapability.version,
          required.version,
        );
        capabilityScore += versionScore;
      }
    }

    const capabilityFactor = matchedCapabilities / requiredCapabilities.length;
    const normalizedCapabilityScore =
      capabilityScore / requiredCapabilities.length;

    return {
      agent,
      score: normalizedCapabilityScore * capabilityFactor,
      factors: {
        load: 1 - agent.metadata.load, // Invert load (lower load = higher score)
        capability: normalizedCapabilityScore,
        cost: 1 / (this.getServiceCost(agent, "") || 1), // Invert cost
        latency: agent.metadata.metrics
          ? 1 / (agent.metadata.metrics.responseTime.avg || 1)
          : 0.5,
        reliability: agent.metadata.metrics?.successRate || 0.5,
        distance: 1 / (this.routingTable.get(agent.id)?.distance || 1),
      },
    };
  }

  /**
   * Calculate version compatibility score
   */
  private calculateVersionCompatibility(
    agentVersion: string,
    requiredVersion: string,
  ): number {
    try {
      const agentVer = this.parseVersion(agentVersion);
      const requiredVer = this.parseVersion(requiredVersion);

      // Exact match gets full score
      if (agentVersion === requiredVersion) return 1.0;

      // Major version must match
      if (agentVer.major !== requiredVer.major) return 0.0;

      // Minor version compatibility (backward compatible)
      if (agentVer.minor >= requiredVer.minor) {
        const versionDiff = agentVer.minor - requiredVer.minor;
        return Math.max(0.7, 1.0 - versionDiff * 0.1); // Slight penalty for newer versions
      }

      return 0.0; // Older minor version not compatible
    } catch (error) {
      return 0.5; // Default score for unparseable versions
    }
  }

  /**
   * Parse semantic version string
   */
  private parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
  } {
    const parts = version.split(".").map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  /**
   * Get service cost for an agent
   */
  private getServiceCost(agent: AgentCard, method: string): number {
    if (!method) return 1; // Default cost

    const service = agent.services.find(
      (s) => s.method === method || s.name === method,
    );
    return service?.cost || 1;
  }

  /**
   * Calculate connection quality score
   */
  private calculateConnectionQuality(agentCard: AgentCard): number {
    const metrics = agentCard.metadata.metrics;
    if (!metrics) return 0.5; // Default quality

    // Factors: reliability, response time, uptime
    const reliabilityScore = metrics.successRate;
    const responseTimeScore = Math.max(0, 1 - metrics.responseTime.avg / 5000); // 5s max
    const uptimeScore = metrics.uptime / 100;

    return (reliabilityScore + responseTimeScore + uptimeScore) / 3;
  }

  /**
   * Calculate network distance (simplified)
   */
  private calculateNetworkDistance(agentCard: AgentCard): number {
    // In a real implementation, this would calculate actual network distance
    // For now, return a simple heuristic based on agent type and load
    const baseDistance = agentCard.metadata.type === "coordinator" ? 1 : 2;
    const loadPenalty = Math.floor(agentCard.metadata.load * 2);
    return baseDistance + loadPenalty;
  }

  /**
   * Update network graph with agent connections
   */
  private updateNetworkGraph(agentCard: AgentCard): void {
    const edges: GraphEdge[] = [];

    // Create edges to other agents (simplified topology)
    this.routingTable.forEach((entry, agentId) => {
      if (agentId !== agentCard.id) {
        const weight = this.calculateEdgeWeight(agentCard, entry.agentCard);
        edges.push({
          to: agentId,
          weight,
          quality: entry.connectionQuality,
        });
      }
    });

    this.networkGraph.set(agentCard.id, edges);
  }

  /**
   * Calculate edge weight between two agents
   */
  private calculateEdgeWeight(from: AgentCard, to: AgentCard): number {
    // Weight based on latency, load, and reliability
    const toMetrics = to.metadata.metrics;
    if (!toMetrics) return 10; // Default weight

    const latencyWeight = Math.min(toMetrics.responseTime.avg / 100, 10); // Max 10
    const loadWeight = to.metadata.load * 5; // Max 5
    const reliabilityWeight = (1 - toMetrics.successRate) * 5; // Max 5

    return Math.max(1, latencyWeight + loadWeight + reliabilityWeight);
  }

  /**
   * Find shortest path using Dijkstra's algorithm
   */
  private findShortestPath(from: AgentId, to: AgentId): AgentId[] {
    const distances = new Map<AgentId, number>();
    const previous = new Map<AgentId, AgentId | null>();
    const unvisited = new Set<AgentId>();

    // Initialize distances
    this.routingTable.forEach((_, agentId) => {
      distances.set(agentId, agentId === from ? 0 : Infinity);
      previous.set(agentId, null);
      unvisited.add(agentId);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current: AgentId | null = null;
      let minDistance = Infinity;

      for (const agentId of unvisited) {
        const distance = distances.get(agentId) || Infinity;
        if (distance < minDistance) {
          minDistance = distance;
          current = agentId;
        }
      }

      if (!current || minDistance === Infinity) break;

      unvisited.delete(current);

      // If we reached the target, we can stop
      if (current === to) break;

      // Update distances to neighbors
      const edges = this.networkGraph.get(current) || [];
      for (const edge of edges) {
        if (!unvisited.has(edge.to)) continue;

        const newDistance = (distances.get(current) || 0) + edge.weight;
        if (newDistance < (distances.get(edge.to) || Infinity)) {
          distances.set(edge.to, newDistance);
          previous.set(edge.to, current);
        }
      }
    }

    // Reconstruct path
    const path: AgentId[] = [];
    let current: AgentId | null = to;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    // Return empty array if no path found
    return path.length > 0 && path[0] === from ? path : [];
  }

  /**
   * Track routing success metrics
   */
  private trackRoutingSuccess(
    strategy: RoutingStrategy,
    route: MessageRoute,
    routingTime: number,
  ): void {
    this.metrics.routingSuccesses++;
    this.metrics.routingTimes.push(routingTime);

    // Keep only last 1000 routing times
    if (this.metrics.routingTimes.length > 1000) {
      this.metrics.routingTimes.splice(0, 100);
    }

    // Track strategy usage
    const currentCount = this.metrics.strategiesUsed.get(strategy) || 0;
    this.metrics.strategiesUsed.set(strategy, currentCount + 1);

    // Track hop distribution
    const hopCount = this.metrics.hopDistribution.get(route.hops) || 0;
    this.metrics.hopDistribution.set(route.hops, hopCount + 1);

    // Track agent load distribution
    for (const agentId of route.path) {
      const entry = this.routingTable.get(agentId);
      if (entry) {
        this.metrics.agentLoadDistribution.set(
          agentId,
          entry.agentCard.metadata.load,
        );
      }
    }
  }

  /**
   * Track routing failure metrics
   */
  private trackRoutingFailure(error: any): void {
    this.metrics.routingFailures++;

    const errorType = this.getErrorType(error);
    const currentCount = this.metrics.failuresByType.get(errorType) || 0;
    this.metrics.failuresByType.set(errorType, currentCount + 1);
  }

  /**
   * Get error type from error object
   */
  private getErrorType(error: any): A2AErrorType {
    if (error && typeof error === "object" && "type" in error) {
      return error.type as A2AErrorType;
    }
    return "routing_error";
  }

  /**
   * Create routing error
   */
  private createRoutingError(type: A2AErrorType, message: string): A2AError {
    return {
      code: this.getErrorCodeForType(type),
      message,
      type,
      source: "A2AMessageRouter",
      retryable: this.isRetryableError(type),
    } as A2AError;
  }

  /**
   * Get error code for error type
   */
  private getErrorCodeForType(type: A2AErrorType): number {
    const errorCodes: { [key in A2AErrorType]: number } = {
      protocol_error: -32600,
      authentication_error: -32002,
      authorization_error: -32003,
      capability_not_found: -32601,
      agent_unavailable: -32001,
      resource_exhausted: -32004,
      timeout_error: -32000,
      routing_error: -32005,
      serialization_error: -32700,
      validation_error: -32602,
      internal_error: -32603,
    };

    return errorCodes[type] || -32603;
  }

  /**
   * Check if error type is retryable
   */
  private isRetryableError(type: A2AErrorType): boolean {
    const retryableTypes: A2AErrorType[] = [
      "timeout_error",
      "agent_unavailable",
      "resource_exhausted",
      "routing_error",
    ];

    return retryableTypes.includes(type);
  }

  /**
   * Clean up stale entries from routing table
   */
  private cleanupRoutingTable(): void {
    const now = Date.now();
    const staleEntries: AgentId[] = [];

    this.routingTable.forEach((entry, agentId) => {
      const age = now - entry.lastUpdated;
      const agentLastSeen = now - entry.agentCard.metadata.lastSeen;

      // Remove entries that haven't been updated or seen recently
      if (age > this.routingTableTTL || agentLastSeen > this.routingTableTTL) {
        staleEntries.push(agentId);
      }
    });

    for (const agentId of staleEntries) {
      this.unregisterAgent(agentId);
      this.logger.debug("Removed stale routing entry", { agentId });
    }

    if (staleEntries.length > 0) {
      this.logger.info(
        `Cleaned up ${staleEntries.length} stale routing entries`,
      );
    }
  }
}

/**
 * Agent Card System
 *
 * Comprehensive agent discovery and registration system for A2A communication.
 * Provides agent registration, capability-based discovery, filtering, and metrics tracking.
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
/**
 * Agent Card System implementation
 */
export class AgentCardSystem extends EventEmitter {
    logger;
    agentRegistry = new Map();
    capabilityIndex = new Map();
    serviceIndex = new Map();
    typeIndex = new Map();
    isInitialized = false;
    // Metrics tracking
    metrics = {
        totalDiscoveryRequests: 0,
        discoveryTimes: [],
        capabilityRequests: new Map(),
        filterUsage: new Map(),
        discoverySuccesses: 0,
        discoveryFailures: 0,
        startTime: Date.now(),
    };
    // Configuration
    defaultTTL = 3600; // 1 hour default TTL
    heartbeatInterval = 300000; // 5 minutes
    cleanupInterval = 60000; // 1 minute
    constructor() {
        super();
        this.logger = new Logger("AgentCardSystem");
        // Set up periodic cleanup
        setInterval(() => this.cleanupExpiredAgents(), this.cleanupInterval);
    }
    /**
     * Initialize the agent card system
     */
    async initialize() {
        try {
            this.logger.info("Initializing Agent Card System");
            this.isInitialized = true;
            this.metrics.startTime = Date.now();
            this.logger.info("Agent Card System initialized successfully");
            this.emit("initialized");
        }
        catch (error) {
            this.logger.error("Failed to initialize Agent Card System:", error);
            throw error;
        }
    }
    /**
     * Shutdown the agent card system
     */
    async shutdown() {
        this.logger.info("Shutting down Agent Card System");
        this.isInitialized = false;
        this.agentRegistry.clear();
        this.capabilityIndex.clear();
        this.serviceIndex.clear();
        this.typeIndex.clear();
        this.logger.info("Agent Card System shutdown complete");
        this.emit("shutdown");
    }
    /**
     * Register an agent with optional TTL
     */
    async registerAgent(agentCard, ttl) {
        if (!this.isInitialized) {
            throw new Error("Agent Card System not initialized");
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
            const expiresAt = now + effectiveTTL * 1000;
            // Create registry entry
            const entry = {
                agentCard: { ...agentCard },
                registrationTime: now,
                expiresAt,
                lastHeartbeat: now,
            };
            // Register agent
            this.agentRegistry.set(agentCard.id, entry);
            // Update indexes
            this.updateIndexes(agentCard, "add");
            this.logger.info("Agent registered successfully", {
                agentId: agentCard.id,
                agentType: agentCard.metadata.type,
                capabilities: agentCard.capabilities.length,
                ttl: effectiveTTL,
            });
            this.emit("agentRegistered", agentCard);
            return {
                jsonrpc: "2.0",
                result: {
                    registered: true,
                    agentId: agentCard.id,
                    expiresAt,
                },
                id: null,
                from: "agent-registry",
                to: agentCard.id,
                timestamp: now,
                messageType: "response",
            };
        }
        catch (error) {
            this.logger.error("Failed to register agent:", error);
            throw error;
        }
    }
    /**
     * Unregister an agent
     */
    async unregisterAgent(agentId) {
        const entry = this.agentRegistry.get(agentId);
        if (!entry) {
            return false;
        }
        // Remove from indexes
        this.updateIndexes(entry.agentCard, "remove");
        // Remove from registry
        this.agentRegistry.delete(agentId);
        this.logger.info("Agent unregistered", { agentId });
        this.emit("agentUnregistered", agentId);
        return true;
    }
    /**
     * Update existing agent card
     */
    async updateAgentCard(agentCard) {
        const entry = this.agentRegistry.get(agentCard.id);
        if (!entry) {
            return false;
        }
        try {
            // Validate updated card
            this.validateAgentCard(agentCard);
            // Update indexes (remove old, add new)
            this.updateIndexes(entry.agentCard, "remove");
            this.updateIndexes(agentCard, "add");
            // Update entry
            entry.agentCard = { ...agentCard };
            entry.lastHeartbeat = Date.now();
            this.logger.debug("Agent card updated", {
                agentId: agentCard.id,
                version: agentCard.version,
            });
            this.emit("agentUpdated", agentCard);
            return true;
        }
        catch (error) {
            this.logger.error("Failed to update agent card:", error);
            return false;
        }
    }
    /**
     * Get agent card by ID
     */
    async getAgentCard(agentId) {
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
    async discoverAgents(request) {
        if (!this.isInitialized) {
            throw new Error("Agent Card System not initialized");
        }
        const startTime = Date.now();
        this.metrics.totalDiscoveryRequests++;
        try {
            let candidateAgents = Array.from(this.agentRegistry.values());
            // Filter by capabilities
            if (request.params.capabilities &&
                request.params.capabilities.length > 0) {
                candidateAgents = this.filterByCapabilities(candidateAgents, request.params.capabilities);
                // Track capability requests
                request.params.capabilities.forEach((cap) => {
                    const count = this.metrics.capabilityRequests.get(cap) || 0;
                    this.metrics.capabilityRequests.set(cap, count + 1);
                });
            }
            // Filter by agent type
            if (request.params.agentType) {
                candidateAgents = candidateAgents.filter((entry) => entry.agentCard.metadata.type === request.params.agentType);
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
            candidateAgents = candidateAgents.filter((entry) => !entry.expiresAt || Date.now() < entry.expiresAt);
            // Extract agent cards
            const foundAgents = candidateAgents.map((entry) => entry.agentCard);
            const searchTime = Date.now() - startTime;
            // Track metrics
            this.metrics.discoveryTimes.push(searchTime);
            if (this.metrics.discoveryTimes.length > 1000) {
                this.metrics.discoveryTimes.splice(0, 100);
            }
            if (foundAgents.length > 0) {
                this.metrics.discoverySuccesses++;
            }
            else {
                this.metrics.discoveryFailures++;
            }
            this.logger.debug("Agent discovery completed", {
                requestId: request.id,
                foundAgents: foundAgents.length,
                searchTime,
                criteria: {
                    capabilities: request.params.capabilities?.length || 0,
                    agentType: request.params.agentType,
                    filters: request.params.filters?.length || 0,
                },
            });
            return {
                jsonrpc: "2.0",
                result: {
                    agents: foundAgents,
                    totalFound: foundAgents.length,
                    searchTime,
                },
                id: request.id,
                from: "agent-registry",
                to: request.from,
                timestamp: Date.now(),
                messageType: "response",
            };
        }
        catch (error) {
            this.metrics.discoveryFailures++;
            this.logger.error("Agent discovery failed:", error);
            throw error;
        }
    }
    /**
     * Find agents by capability
     */
    async findAgentsByCapability(capabilityName, version) {
        const agentIds = this.capabilityIndex.get(capabilityName) || new Set();
        const matchingAgents = [];
        for (const agentId of agentIds) {
            const entry = this.agentRegistry.get(agentId);
            if (!entry || (entry.expiresAt && Date.now() > entry.expiresAt)) {
                continue;
            }
            const agentCard = entry.agentCard;
            const capability = agentCard.capabilities.find((cap) => cap.name === capabilityName);
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
    async findAgentsByType(agentType) {
        const agentIds = this.typeIndex.get(agentType) || new Set();
        const matchingAgents = [];
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
    async findAgentsByService(serviceName) {
        const agentIds = this.serviceIndex.get(serviceName) || new Set();
        const matchingAgents = [];
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
    async refreshAgentStatus(agentId) {
        const entry = this.agentRegistry.get(agentId);
        if (!entry) {
            return false;
        }
        entry.lastHeartbeat = Date.now();
        entry.agentCard.metadata.lastSeen = Date.now();
        this.logger.debug("Agent status refreshed", { agentId });
        return true;
    }
    /**
     * Get registered agents map
     */
    getRegisteredAgents() {
        const result = new Map();
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
    async getSystemMetrics() {
        const activeAgents = Array.from(this.agentRegistry.values()).filter((entry) => !entry.expiresAt || Date.now() < entry.expiresAt);
        // Count by type
        const agentsByType = {};
        const agentsByStatus = {};
        const capabilityDistribution = {};
        const trustLevelDistribution = {};
        const uptimeRanges = { "<90%": 0, "90-95%": 0, "95-99%": 0, "99%+": 0 };
        let totalLoad = 0;
        activeAgents.forEach((entry) => {
            const agent = entry.agentCard;
            // Type distribution
            agentsByType[agent.metadata.type] =
                (agentsByType[agent.metadata.type] || 0) + 1;
            // Status distribution
            agentsByStatus[agent.metadata.status] =
                (agentsByStatus[agent.metadata.status] || 0) + 1;
            // Load accumulation
            totalLoad += agent.metadata.load;
            // Capability distribution
            agent.capabilities.forEach((cap) => {
                capabilityDistribution[cap.name] =
                    (capabilityDistribution[cap.name] || 0) + 1;
            });
            // Trust level distribution
            if (agent.metadata.trustLevel) {
                trustLevelDistribution[agent.metadata.trustLevel] =
                    (trustLevelDistribution[agent.metadata.trustLevel] || 0) + 1;
            }
            // Uptime distribution
            if (agent.metadata.metrics?.uptime !== undefined) {
                const uptime = agent.metadata.metrics.uptime;
                if (uptime < 90)
                    uptimeRanges["<90%"]++;
                else if (uptime < 95)
                    uptimeRanges["90-95%"]++;
                else if (uptime < 99)
                    uptimeRanges["95-99%"]++;
                else
                    uptimeRanges["99%+"]++;
            }
        });
        return {
            totalRegisteredAgents: activeAgents.length,
            agentsByType,
            agentsByStatus,
            averageLoad: activeAgents.length > 0 ? totalLoad / activeAgents.length : 0,
            capabilityDistribution,
            trustLevelDistribution,
            uptimeDistribution: uptimeRanges,
        };
    }
    /**
     * Get discovery metrics
     */
    getDiscoveryMetrics() {
        const popularCapabilities = {};
        this.metrics.capabilityRequests.forEach((count, capability) => {
            popularCapabilities[capability] = count;
        });
        const filterUsageStats = {};
        this.metrics.filterUsage.forEach((count, filter) => {
            filterUsageStats[filter] = count;
        });
        return {
            totalDiscoveryRequests: this.metrics.totalDiscoveryRequests,
            avgDiscoveryTime: this.metrics.discoveryTimes.length > 0
                ? this.metrics.discoveryTimes.reduce((a, b) => a + b, 0) /
                    this.metrics.discoveryTimes.length
                : 0,
            popularCapabilities,
            discoverySuccessRate: this.metrics.totalDiscoveryRequests > 0
                ? this.metrics.discoverySuccesses /
                    this.metrics.totalDiscoveryRequests
                : 0,
            filterUsageStats,
        };
    }
    /**
     * Validate agent card
     */
    validateAgentCard(agentCard) {
        if (!agentCard.id || agentCard.id.trim() === "") {
            throw new Error("Invalid agent card: missing required fields");
        }
        if (!agentCard.name || !agentCard.version) {
            throw new Error("Invalid agent card: missing required fields");
        }
        if (!agentCard.metadata || !agentCard.metadata.type) {
            throw new Error("Invalid agent card: missing required fields");
        }
        if (!Array.isArray(agentCard.capabilities)) {
            throw new Error("Invalid agent card: capabilities must be an array");
        }
        if (!Array.isArray(agentCard.services)) {
            throw new Error("Invalid agent card: services must be an array");
        }
        if (!Array.isArray(agentCard.endpoints)) {
            throw new Error("Invalid agent card: endpoints must be an array");
        }
    }
    /**
     * Update search indexes
     */
    updateIndexes(agentCard, operation) {
        const agentId = agentCard.id;
        if (operation === "add") {
            // Capability index
            agentCard.capabilities.forEach((capability) => {
                if (!this.capabilityIndex.has(capability.name)) {
                    this.capabilityIndex.set(capability.name, new Set());
                }
                this.capabilityIndex.get(capability.name).add(agentId);
            });
            // Service index
            agentCard.services.forEach((service) => {
                if (!this.serviceIndex.has(service.name)) {
                    this.serviceIndex.set(service.name, new Set());
                }
                this.serviceIndex.get(service.name).add(agentId);
                if (!this.serviceIndex.has(service.method)) {
                    this.serviceIndex.set(service.method, new Set());
                }
                this.serviceIndex.get(service.method).add(agentId);
            });
            // Type index
            if (!this.typeIndex.has(agentCard.metadata.type)) {
                this.typeIndex.set(agentCard.metadata.type, new Set());
            }
            this.typeIndex.get(agentCard.metadata.type).add(agentId);
        }
        else {
            // Remove from capability index
            agentCard.capabilities.forEach((capability) => {
                const capabilitySet = this.capabilityIndex.get(capability.name);
                if (capabilitySet) {
                    capabilitySet.delete(agentId);
                    if (capabilitySet.size === 0) {
                        this.capabilityIndex.delete(capability.name);
                    }
                }
            });
            // Remove from service index
            agentCard.services.forEach((service) => {
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
    filterByCapabilities(candidates, requiredCapabilities) {
        return candidates.filter((entry) => {
            const agentCapabilities = entry.agentCard.capabilities.map((cap) => cap.name);
            return requiredCapabilities.every((required) => agentCapabilities.includes(required));
        });
    }
    /**
     * Apply discovery filters
     */
    applyFilters(candidates, filters) {
        return candidates.filter((entry) => {
            return filters.every((filter) => this.evaluateFilter(entry.agentCard, filter));
        });
    }
    /**
     * Evaluate a single filter
     */
    evaluateFilter(agentCard, filter) {
        try {
            // Track filter usage
            const filterKey = `${filter.field}:${filter.operator}`;
            const count = this.metrics.filterUsage.get(filterKey) || 0;
            this.metrics.filterUsage.set(filterKey, count + 1);
            const fieldValue = this.getNestedValue(agentCard, filter.field);
            switch (filter.operator) {
                case "eq":
                    return fieldValue === filter.value;
                case "ne":
                    return fieldValue !== filter.value;
                case "gt":
                    return Number(fieldValue) > Number(filter.value);
                case "lt":
                    return Number(fieldValue) < Number(filter.value);
                case "gte":
                    return Number(fieldValue) >= Number(filter.value);
                case "lte":
                    return Number(fieldValue) <= Number(filter.value);
                case "in":
                    return (Array.isArray(filter.value) && filter.value.includes(fieldValue));
                case "contains":
                    if (Array.isArray(fieldValue)) {
                        return fieldValue.some((item) => this.deepIncludes(item, filter.value));
                    }
                    if (typeof fieldValue === "string") {
                        return fieldValue.includes(filter.value);
                    }
                    return this.deepIncludes(fieldValue, filter.value);
                default:
                    throw new Error(`Invalid filter operator: ${filter.operator}`);
            }
        }
        catch (error) {
            this.logger.warn("Filter evaluation failed", {
                field: filter.field,
                operator: filter.operator,
                error: error.message,
            });
            return false;
        }
    }
    /**
     * Filter agents by distance
     */
    filterByDistance(candidates, maxDistance) {
        // Simplified distance calculation - in practice this would use network topology
        return candidates.filter((entry) => {
            const distance = this.calculateDistance(entry.agentCard);
            return distance <= maxDistance;
        });
    }
    /**
     * Calculate distance to agent (simplified)
     */
    calculateDistance(agentCard) {
        // Simple heuristic based on agent type and load
        let distance = 1;
        if (agentCard.metadata.type === "coordinator")
            distance = 1;
        else if (agentCard.metadata.type === "specialist")
            distance = 2;
        else
            distance = 3;
        // Add load penalty
        distance += Math.floor(agentCard.metadata.load * 2);
        return distance;
    }
    /**
     * Check version compatibility
     */
    isVersionCompatible(agentVersion, requiredVersion) {
        try {
            const agentVer = this.parseVersion(agentVersion);
            const requiredVer = this.parseVersion(requiredVersion);
            // Major version must match
            if (agentVer.major !== requiredVer.major)
                return false;
            // Agent version must be >= required version
            if (agentVer.minor < requiredVer.minor)
                return false;
            if (agentVer.minor === requiredVer.minor &&
                agentVer.patch < requiredVer.patch)
                return false;
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Parse version string
     */
    parseVersion(version) {
        const parts = version.split(".").map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0,
        };
    }
    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }
    /**
     * Deep includes check for complex objects
     */
    deepIncludes(haystack, needle) {
        if (haystack === needle)
            return true;
        if (typeof haystack === "object" && typeof needle === "object") {
            if (Array.isArray(needle)) {
                return needle.every((item) => this.deepIncludes(haystack, item));
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
    cleanupExpiredAgents() {
        const now = Date.now();
        const expiredAgents = [];
        this.agentRegistry.forEach((entry, agentId) => {
            if (entry.expiresAt && now > entry.expiresAt) {
                expiredAgents.push(agentId);
            }
        });
        expiredAgents.forEach((agentId) => {
            this.unregisterAgent(agentId);
        });
        if (expiredAgents.length > 0) {
            this.logger.info(`Cleaned up ${expiredAgents.length} expired agents`);
        }
    }
}

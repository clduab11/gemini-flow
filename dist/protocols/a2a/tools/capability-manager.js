/**
 * A2A Capability Manager
 *
 * Manages the exposure, registration, and discovery of A2A capabilities.
 * Provides patterns for dynamic capability composition, aggregation, and versioning.
 * Handles capability matching, dependency resolution, and security policy enforcement.
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
/**
 * Main capability manager for A2A system
 */
export class CapabilityManager extends EventEmitter {
    logger;
    cache;
    registrations = new Map();
    compositions = new Map();
    aggregations = new Map();
    categoryIndex = new Map();
    dependencyGraph = new Map();
    constructor() {
        super();
        this.logger = new Logger("A2ACapabilityManager");
        this.cache = new CacheManager();
        this.logger.info("A2A Capability Manager initialized");
    }
    /**
     * Register a new capability
     */
    async registerCapability(id, capability, wrapper, metadata = {}) {
        try {
            // Validate capability definition
            const validation = this.validateCapability(capability);
            if (!validation.valid) {
                throw new Error(`Invalid capability: ${validation.errors.join(", ")}`);
            }
            // Check for existing registration
            if (this.registrations.has(id)) {
                const existing = this.registrations.get(id);
                this.logger.warn("Overwriting existing capability registration", {
                    id,
                    existingVersion: existing.capability.version,
                    newVersion: capability.version,
                });
            }
            // Create registration
            const registration = {
                id,
                capability,
                wrapper,
                registeredAt: new Date(),
                usage: {
                    invocations: 0,
                    successRate: 0,
                    avgLatency: 0,
                },
                status: "active",
                metadata,
            };
            this.registrations.set(id, registration);
            // Update category index
            const category = this.extractCategory(capability);
            if (!this.categoryIndex.has(category)) {
                this.categoryIndex.set(category, new Set());
            }
            this.categoryIndex.get(category).add(id);
            // Update dependency graph
            this.updateDependencyGraph(id, capability);
            // Cache capability for quick lookup
            await this.cache.set(`capability:${id}`, capability, 3600000); // 1 hour
            this.logger.info("Capability registered successfully", {
                id,
                name: capability.name,
                version: capability.version,
                category,
            });
            this.emit("capability_registered", { id, capability, registration });
        }
        catch (error) {
            this.logger.error("Failed to register capability", {
                id,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Unregister a capability
     */
    async unregisterCapability(id) {
        const registration = this.registrations.get(id);
        if (!registration) {
            throw new Error(`Capability not found: ${id}`);
        }
        // Remove from indices
        const category = this.extractCategory(registration.capability);
        this.categoryIndex.get(category)?.delete(id);
        this.dependencyGraph.delete(id);
        // Remove from cache
        await this.cache.delete(`capability:${id}`);
        // Remove registration
        this.registrations.delete(id);
        this.logger.info("Capability unregistered", { id });
        this.emit("capability_unregistered", { id, registration });
    }
    /**
     * Query capabilities based on criteria
     */
    async queryCapabilities(query) {
        const results = [];
        for (const [id, registration] of this.registrations) {
            if (registration.status !== "active")
                continue;
            const capability = registration.capability;
            let matches = true;
            // Name matching
            if (query.name &&
                !capability.name.toLowerCase().includes(query.name.toLowerCase())) {
                matches = false;
            }
            // Version matching
            if (query.version && capability.version !== query.version) {
                matches = false;
            }
            // Category matching
            if (query.category) {
                const category = this.extractCategory(capability);
                if (category !== query.category) {
                    matches = false;
                }
            }
            // Trust level matching
            if (query.minTrustLevel) {
                const trustLevels = [
                    "untrusted",
                    "basic",
                    "verified",
                    "trusted",
                    "privileged",
                ];
                const requiredIndex = trustLevels.indexOf(query.minTrustLevel);
                const capabilityIndex = trustLevels.indexOf(capability.security.minTrustLevel);
                if (capabilityIndex > requiredIndex) {
                    matches = false;
                }
            }
            // Required capabilities matching
            if (query.requiredCapabilities) {
                const hasAllCapabilities = query.requiredCapabilities.every((cap) => capability.security.requiredCapabilities.includes(cap));
                if (!hasAllCapabilities) {
                    matches = false;
                }
            }
            // Resource constraints matching
            if (query.resourceConstraints) {
                if (query.resourceConstraints.maxLatency &&
                    capability.performance.avgLatency >
                        query.resourceConstraints.maxLatency) {
                    matches = false;
                }
                if (query.resourceConstraints.maxResourceUsage) {
                    const resourceLevels = ["low", "medium", "high"];
                    const maxIndex = resourceLevels.indexOf(query.resourceConstraints.maxResourceUsage);
                    const capabilityIndex = resourceLevels.indexOf(capability.performance.resourceUsage);
                    if (capabilityIndex > maxIndex) {
                        matches = false;
                    }
                }
            }
            // Tags matching (from metadata)
            if (query.tags && registration.metadata.tags) {
                const hasAllTags = query.tags.every((tag) => registration.metadata.tags.includes(tag));
                if (!hasAllTags) {
                    matches = false;
                }
            }
            if (matches) {
                results.push(registration);
            }
        }
        // Sort by usage and performance
        results.sort((a, b) => {
            const aScore = a.usage.successRate * (1 / Math.max(a.usage.avgLatency, 1));
            const bScore = b.usage.successRate * (1 / Math.max(b.usage.avgLatency, 1));
            return bScore - aScore;
        });
        this.logger.debug("Capability query completed", {
            query,
            resultCount: results.length,
        });
        return results;
    }
    /**
     * Get capability by ID
     */
    getCapability(id) {
        return this.registrations.get(id);
    }
    /**
     * List all registered capabilities
     */
    listCapabilities(status) {
        const capabilities = Array.from(this.registrations.values());
        if (status) {
            return capabilities.filter((reg) => reg.status === status);
        }
        return capabilities;
    }
    /**
     * Create a capability composition
     */
    async createComposition(composition) {
        // Validate that all referenced capabilities exist
        for (const capabilityId of composition.capabilities) {
            if (!this.registrations.has(capabilityId)) {
                throw new Error(`Referenced capability not found: ${capabilityId}`);
            }
        }
        // Validate dependencies
        for (const [capId, deps] of Object.entries(composition.dependencies)) {
            if (!composition.capabilities.includes(capId)) {
                throw new Error(`Dependency source not in composition: ${capId}`);
            }
            for (const dep of deps) {
                if (!composition.capabilities.includes(dep)) {
                    throw new Error(`Dependency target not in composition: ${dep}`);
                }
            }
        }
        // Check for circular dependencies
        if (this.hasCircularDependencies(composition.dependencies)) {
            throw new Error("Circular dependencies detected in composition");
        }
        this.compositions.set(composition.id, composition);
        this.logger.info("Capability composition created", {
            id: composition.id,
            name: composition.name,
            capabilityCount: composition.capabilities.length,
        });
        this.emit("composition_created", composition);
    }
    /**
     * Execute a capability composition
     */
    async executeComposition(compositionId, parameters, context) {
        const composition = this.compositions.get(compositionId);
        if (!composition) {
            throw new Error(`Composition not found: ${compositionId}`);
        }
        // Validate security context against composition policy
        await this.validateCompositionSecurity(composition, context);
        const startTime = Date.now();
        const results = new Map();
        const errors = new Map();
        try {
            switch (composition.executionStrategy) {
                case "sequential":
                    await this.executeSequential(composition, parameters, context, results, errors);
                    break;
                case "parallel":
                    await this.executeParallel(composition, parameters, context, results, errors);
                    break;
                case "conditional":
                    await this.executeConditional(composition, parameters, context, results, errors);
                    break;
                case "pipeline":
                    await this.executePipeline(composition, parameters, context, results, errors);
                    break;
                default:
                    throw new Error(`Unknown execution strategy: ${composition.executionStrategy}`);
            }
            // Handle errors based on error handling strategy
            if (errors.size > 0) {
                await this.handleCompositionErrors(composition, errors);
            }
            const executionTime = Date.now() - startTime;
            this.logger.info("Composition executed successfully", {
                compositionId,
                executionTime,
                resultCount: results.size,
                errorCount: errors.size,
            });
            return this.aggregateResults(results);
        }
        catch (error) {
            this.logger.error("Composition execution failed", {
                compositionId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Create capability aggregation
     */
    async createAggregation(capabilityIds, name, aggregationStrategy = "merge") {
        const capabilities = [];
        // Collect all capabilities
        for (const id of capabilityIds) {
            const registration = this.registrations.get(id);
            if (!registration) {
                throw new Error(`Capability not found: ${id}`);
            }
            capabilities.push(registration.capability);
        }
        // Create aggregated capability
        const aggregation = {
            id: `aggregation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name,
            aggregatedCapabilities: capabilities,
            compositeParameters: this.aggregateParameters(capabilities, aggregationStrategy),
            outputSchema: this.aggregateOutputSchema(capabilities, aggregationStrategy),
            performance: this.aggregatePerformance(capabilities),
            security: this.aggregateSecurity(capabilities),
        };
        this.aggregations.set(aggregation.id, aggregation);
        this.logger.info("Capability aggregation created", {
            id: aggregation.id,
            name,
            capabilityCount: capabilities.length,
            strategy: aggregationStrategy,
        });
        this.emit("aggregation_created", aggregation);
        return aggregation;
    }
    /**
     * Get capability discovery information
     */
    async getDiscoveryInfo() {
        const categories = Array.from(this.categoryIndex.keys());
        const versions = {};
        const dependencies = {};
        // Collect version and dependency information
        for (const [id, registration] of this.registrations) {
            const capability = registration.capability;
            if (!versions[capability.name]) {
                versions[capability.name] = [];
            }
            if (!versions[capability.name].includes(capability.version)) {
                versions[capability.name].push(capability.version);
            }
            dependencies[id] = Array.from(this.dependencyGraph.get(id) || []);
        }
        // Generate recommendations
        const recommendations = await this.generateRecommendations();
        return {
            categories,
            versions,
            dependencies,
            recommendations,
            metadata: {
                totalCapabilities: this.registrations.size,
                lastUpdated: new Date(),
                compatibility: await this.generateCompatibilityMatrix(),
            },
        };
    }
    /**
     * Update capability usage statistics
     */
    updateUsageStats(capabilityId, success, latency) {
        const registration = this.registrations.get(capabilityId);
        if (!registration)
            return;
        registration.usage.invocations++;
        registration.lastUsed = new Date();
        // Update success rate
        const totalSuccess = Math.floor(registration.usage.successRate * (registration.usage.invocations - 1));
        registration.usage.successRate =
            (totalSuccess + (success ? 1 : 0)) / registration.usage.invocations;
        // Update average latency
        registration.usage.avgLatency =
            (registration.usage.avgLatency * (registration.usage.invocations - 1) +
                latency) /
                registration.usage.invocations;
        this.emit("usage_updated", { capabilityId, registration });
    }
    /**
     * Private helper methods
     */
    validateCapability(capability) {
        const errors = [];
        if (!capability.name)
            errors.push("Name is required");
        if (!capability.version)
            errors.push("Version is required");
        if (!capability.description)
            errors.push("Description is required");
        if (!capability.parameters)
            errors.push("Parameters schema is required");
        if (!capability.security)
            errors.push("Security configuration is required");
        if (!capability.performance)
            errors.push("Performance configuration is required");
        return { valid: errors.length === 0, errors };
    }
    extractCategory(capability) {
        // Extract category from capability name or metadata
        const nameParts = capability.name.split(".");
        return nameParts.length > 1 ? nameParts[0] : "general";
    }
    updateDependencyGraph(id, capability) {
        // Extract dependencies from capability metadata
        const deps = capability.security.requiredCapabilities || [];
        this.dependencyGraph.set(id, new Set(deps));
    }
    hasCircularDependencies(dependencies) {
        const visited = new Set();
        const visiting = new Set();
        const visit = (node) => {
            if (visiting.has(node))
                return true; // Circular dependency found
            if (visited.has(node))
                return false;
            visiting.add(node);
            const deps = dependencies[node] || [];
            for (const dep of deps) {
                if (visit(dep))
                    return true;
            }
            visiting.delete(node);
            visited.add(node);
            return false;
        };
        for (const node of Object.keys(dependencies)) {
            if (visit(node))
                return true;
        }
        return false;
    }
    async validateCompositionSecurity(composition, context) {
        const policy = composition.securityPolicy;
        // Check trust level
        const trustLevels = [
            "untrusted",
            "basic",
            "verified",
            "trusted",
            "privileged",
        ];
        const requiredIndex = trustLevels.indexOf(policy.minTrustLevel);
        const actualIndex = trustLevels.indexOf(context.trustLevel);
        if (actualIndex < requiredIndex) {
            throw new Error(`Insufficient trust level for composition: required ${policy.minTrustLevel}, got ${context.trustLevel}`);
        }
        // Check aggregated capabilities
        const missingCapabilities = policy.aggregatedCapabilities.filter((cap) => !context.capabilities.includes(cap));
        if (missingCapabilities.length > 0) {
            throw new Error(`Missing required capabilities for composition: ${missingCapabilities.join(", ")}`);
        }
    }
    async executeSequential(composition, parameters, context, results, errors) {
        for (const capabilityId of composition.capabilities) {
            try {
                const registration = this.registrations.get(capabilityId);
                const result = await this.executeSingleCapability(registration, parameters, context);
                results.set(capabilityId, result);
            }
            catch (error) {
                errors.set(capabilityId, error);
                if (composition.errorHandling === "fail-fast") {
                    throw error;
                }
            }
        }
    }
    async executeParallel(composition, parameters, context, results, errors) {
        const promises = composition.capabilities.map(async (capabilityId) => {
            try {
                const registration = this.registrations.get(capabilityId);
                const result = await this.executeSingleCapability(registration, parameters, context);
                results.set(capabilityId, result);
            }
            catch (error) {
                errors.set(capabilityId, error);
            }
        });
        await Promise.all(promises);
    }
    async executeConditional(composition, parameters, context, results, errors) {
        // Conditional execution logic would be implemented based on composition metadata
        // For now, default to sequential execution
        await this.executeSequential(composition, parameters, context, results, errors);
    }
    async executePipeline(composition, parameters, context, results, errors) {
        let currentParameters = parameters;
        for (const capabilityId of composition.capabilities) {
            try {
                const registration = this.registrations.get(capabilityId);
                const result = await this.executeSingleCapability(registration, currentParameters, context);
                results.set(capabilityId, result);
                // Use result as input for next capability
                currentParameters = { ...currentParameters, ...result };
            }
            catch (error) {
                errors.set(capabilityId, error);
                if (composition.errorHandling === "fail-fast") {
                    throw error;
                }
            }
        }
    }
    async executeSingleCapability(registration, parameters, context) {
        // This would invoke the actual capability wrapper
        // For now, return a placeholder
        return { success: true, data: parameters };
    }
    async handleCompositionErrors(composition, errors) {
        switch (composition.errorHandling) {
            case "fail-fast":
                throw Array.from(errors.values())[0];
            case "continue":
                // Log errors but continue
                for (const [capabilityId, error] of errors) {
                    this.logger.warn("Capability execution failed in composition", {
                        compositionId: composition.id,
                        capabilityId,
                        error: error.message,
                    });
                }
                break;
            case "retry":
                // Implement retry logic
                break;
        }
    }
    aggregateResults(results) {
        const aggregated = {};
        for (const [capabilityId, result] of results) {
            if (result && typeof result === "object" && result.data) {
                aggregated[capabilityId] = result.data;
            }
            else {
                aggregated[capabilityId] = result;
            }
        }
        return aggregated;
    }
    aggregateParameters(capabilities, strategy) {
        // Implement parameter aggregation logic based on strategy
        const aggregated = {
            type: "object",
            properties: {},
            required: [],
        };
        // Simple merge strategy for now
        for (const capability of capabilities) {
            Object.assign(aggregated.properties, capability.parameters.properties);
            aggregated.required.push(...capability.parameters.required);
        }
        return aggregated;
    }
    aggregateOutputSchema(capabilities, strategy) {
        // Implement output schema aggregation
        return {
            type: "object",
            properties: {
                results: {
                    type: "object",
                    description: "Aggregated results from all capabilities",
                },
            },
        };
    }
    aggregatePerformance(capabilities) {
        const avgLatency = capabilities.reduce((sum, cap) => sum + cap.performance.avgLatency, 0) /
            capabilities.length;
        const maxResourceUsage = capabilities.reduce((max, cap) => {
            const levels = ["low", "medium", "high"];
            const currentIndex = levels.indexOf(cap.performance.resourceUsage);
            const maxIndex = levels.indexOf(max);
            return currentIndex > maxIndex ? cap.performance.resourceUsage : max;
        }, "low");
        return {
            estimatedLatency: avgLatency,
            resourceUsage: maxResourceUsage,
            cacheable: capabilities.every((cap) => cap.performance.cacheable),
        };
    }
    aggregateSecurity(capabilities) {
        const trustLevels = [
            "untrusted",
            "basic",
            "verified",
            "trusted",
            "privileged",
        ];
        const maxTrustLevel = capabilities.reduce((max, cap) => {
            const currentIndex = trustLevels.indexOf(cap.security.minTrustLevel);
            const maxIndex = trustLevels.indexOf(max);
            return currentIndex > maxIndex ? cap.security.minTrustLevel : max;
        }, "untrusted");
        const combinedCapabilities = new Set();
        capabilities.forEach((cap) => {
            cap.security.requiredCapabilities.forEach((c) => combinedCapabilities.add(c));
        });
        return {
            effectiveTrustLevel: maxTrustLevel,
            combinedCapabilities: Array.from(combinedCapabilities),
        };
    }
    async generateRecommendations() {
        // Generate capability recommendations based on usage patterns
        const usageStats = Array.from(this.registrations.entries())
            .map(([id, reg]) => ({ id, usage: reg.usage.invocations }))
            .sort((a, b) => b.usage - a.usage);
        return {
            popular: usageStats.slice(0, 10).map((s) => s.id),
            trending: usageStats.slice(0, 5).map((s) => s.id), // Simplified
            related: {}, // Would implement based on co-usage patterns
        };
    }
    async generateCompatibilityMatrix() {
        // Generate compatibility information between capabilities
        const matrix = {};
        for (const [id, registration] of this.registrations) {
            matrix[id] = Array.from(this.dependencyGraph.get(id) || []);
        }
        return matrix;
    }
}

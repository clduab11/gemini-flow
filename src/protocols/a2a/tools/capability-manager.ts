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
import {
  A2ACapability,
  A2AToolContext,
  A2AToolWrapper,
} from "./a2a-tool-wrapper.js";

export interface CapabilityRegistration {
  id: string;
  capability: A2ACapability;
  wrapper: A2AToolWrapper;
  registeredAt: Date;
  lastUsed?: Date;
  usage: {
    invocations: number;
    successRate: number;
    avgLatency: number;
  };
  status: "active" | "deprecated" | "disabled" | "maintenance";
  metadata: Record<string, any>;
}

export interface CapabilityQuery {
  name?: string;
  version?: string;
  category?: string;
  minTrustLevel?: string;
  requiredCapabilities?: string[];
  resourceConstraints?: {
    maxLatency?: number;
    maxResourceUsage?: "low" | "medium" | "high";
  };
  tags?: string[];
}

export interface CapabilityComposition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  dependencies: Record<string, string[]>;
  executionStrategy: "sequential" | "parallel" | "conditional" | "pipeline";
  errorHandling: "fail-fast" | "continue" | "retry";
  timeout: number;
  securityPolicy: {
    minTrustLevel: string;
    aggregatedCapabilities: string[];
    elevatedPrivileges: boolean;
  };
}

export interface CapabilityAggregation {
  id: string;
  name: string;
  aggregatedCapabilities: A2ACapability[];
  compositeParameters: any;
  outputSchema: any;
  performance: {
    estimatedLatency: number;
    resourceUsage: "low" | "medium" | "high";
    cacheable: boolean;
  };
  security: {
    effectiveTrustLevel: string;
    combinedCapabilities: string[];
  };
}

export interface CapabilityDiscovery {
  categories: string[];
  versions: Record<string, string[]>;
  dependencies: Record<string, string[]>;
  recommendations: {
    popular: string[];
    trending: string[];
    related: Record<string, string[]>;
  };
  metadata: {
    totalCapabilities: number;
    lastUpdated: Date;
    compatibility: Record<string, string[]>;
  };
}

/**
 * Main capability manager for A2A system
 */
export class CapabilityManager extends EventEmitter {
  private logger: Logger;
  private cache: CacheManager;
  private registrations = new Map<string, CapabilityRegistration>();
  private compositions = new Map<string, CapabilityComposition>();
  private aggregations = new Map<string, CapabilityAggregation>();
  private categoryIndex = new Map<string, Set<string>>();
  private dependencyGraph = new Map<string, Set<string>>();

  constructor() {
    super();
    this.logger = new Logger("A2ACapabilityManager");
    this.cache = new CacheManager();

    this.logger.info("A2A Capability Manager initialized");
  }

  /**
   * Register a new capability
   */
  async registerCapability(
    id: string,
    capability: A2ACapability,
    wrapper: A2AToolWrapper,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      // Validate capability definition
      const validation = this.validateCapability(capability);
      if (!validation.valid) {
        throw new Error(`Invalid capability: ${validation.errors.join(", ")}`);
      }

      // Check for existing registration
      if (this.registrations.has(id)) {
        const existing = this.registrations.get(id)!;
        this.logger.warn("Overwriting existing capability registration", {
          id,
          existingVersion: existing.capability.version,
          newVersion: capability.version,
        });
      }

      // Create registration
      const registration: CapabilityRegistration = {
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
      this.categoryIndex.get(category)!.add(id);

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
    } catch (error: any) {
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
  async unregisterCapability(id: string): Promise<void> {
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
  async queryCapabilities(
    query: CapabilityQuery,
  ): Promise<CapabilityRegistration[]> {
    const results: CapabilityRegistration[] = [];

    for (const [id, registration] of this.registrations) {
      if (registration.status !== "active") continue;

      const capability = registration.capability;
      let matches = true;

      // Name matching
      if (
        query.name &&
        !capability.name.toLowerCase().includes(query.name.toLowerCase())
      ) {
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
        const capabilityIndex = trustLevels.indexOf(
          capability.security.minTrustLevel,
        );
        if (capabilityIndex > requiredIndex) {
          matches = false;
        }
      }

      // Required capabilities matching
      if (query.requiredCapabilities) {
        const hasAllCapabilities = query.requiredCapabilities.every((cap) =>
          capability.security.requiredCapabilities.includes(cap),
        );
        if (!hasAllCapabilities) {
          matches = false;
        }
      }

      // Resource constraints matching
      if (query.resourceConstraints) {
        if (
          query.resourceConstraints.maxLatency &&
          capability.performance.avgLatency >
            query.resourceConstraints.maxLatency
        ) {
          matches = false;
        }

        if (query.resourceConstraints.maxResourceUsage) {
          const resourceLevels = ["low", "medium", "high"];
          const maxIndex = resourceLevels.indexOf(
            query.resourceConstraints.maxResourceUsage,
          );
          const capabilityIndex = resourceLevels.indexOf(
            capability.performance.resourceUsage,
          );
          if (capabilityIndex > maxIndex) {
            matches = false;
          }
        }
      }

      // Tags matching (from metadata)
      if (query.tags && registration.metadata.tags) {
        const hasAllTags = query.tags.every((tag) =>
          registration.metadata.tags.includes(tag),
        );
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
      const aScore =
        a.usage.successRate * (1 / Math.max(a.usage.avgLatency, 1));
      const bScore =
        b.usage.successRate * (1 / Math.max(b.usage.avgLatency, 1));
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
  getCapability(id: string): CapabilityRegistration | undefined {
    return this.registrations.get(id);
  }

  /**
   * List all registered capabilities
   */
  listCapabilities(
    status?: CapabilityRegistration["status"],
  ): CapabilityRegistration[] {
    const capabilities = Array.from(this.registrations.values());

    if (status) {
      return capabilities.filter((reg) => reg.status === status);
    }

    return capabilities;
  }

  /**
   * Create a capability composition
   */
  async createComposition(composition: CapabilityComposition): Promise<void> {
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
  async executeComposition(
    compositionId: string,
    parameters: Record<string, any>,
    context: A2AToolContext,
  ): Promise<any> {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    // Validate security context against composition policy
    await this.validateCompositionSecurity(composition, context);

    const startTime = Date.now();
    const results = new Map<string, any>();
    const errors = new Map<string, Error>();

    try {
      switch (composition.executionStrategy) {
        case "sequential":
          await this.executeSequential(
            composition,
            parameters,
            context,
            results,
            errors,
          );
          break;

        case "parallel":
          await this.executeParallel(
            composition,
            parameters,
            context,
            results,
            errors,
          );
          break;

        case "conditional":
          await this.executeConditional(
            composition,
            parameters,
            context,
            results,
            errors,
          );
          break;

        case "pipeline":
          await this.executePipeline(
            composition,
            parameters,
            context,
            results,
            errors,
          );
          break;

        default:
          throw new Error(
            `Unknown execution strategy: ${composition.executionStrategy}`,
          );
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
    } catch (error: any) {
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
  async createAggregation(
    capabilityIds: string[],
    name: string,
    aggregationStrategy: "merge" | "compose" | "overlay" = "merge",
  ): Promise<CapabilityAggregation> {
    const capabilities: A2ACapability[] = [];

    // Collect all capabilities
    for (const id of capabilityIds) {
      const registration = this.registrations.get(id);
      if (!registration) {
        throw new Error(`Capability not found: ${id}`);
      }
      capabilities.push(registration.capability);
    }

    // Create aggregated capability
    const aggregation: CapabilityAggregation = {
      id: `aggregation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      aggregatedCapabilities: capabilities,
      compositeParameters: this.aggregateParameters(
        capabilities,
        aggregationStrategy,
      ),
      outputSchema: this.aggregateOutputSchema(
        capabilities,
        aggregationStrategy,
      ),
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
  async getDiscoveryInfo(): Promise<CapabilityDiscovery> {
    const categories = Array.from(this.categoryIndex.keys());
    const versions: Record<string, string[]> = {};
    const dependencies: Record<string, string[]> = {};

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
  updateUsageStats(
    capabilityId: string,
    success: boolean,
    latency: number,
  ): void {
    const registration = this.registrations.get(capabilityId);
    if (!registration) return;

    registration.usage.invocations++;
    registration.lastUsed = new Date();

    // Update success rate
    const totalSuccess = Math.floor(
      registration.usage.successRate * (registration.usage.invocations - 1),
    );
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

  private validateCapability(capability: A2ACapability): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!capability.name) errors.push("Name is required");
    if (!capability.version) errors.push("Version is required");
    if (!capability.description) errors.push("Description is required");
    if (!capability.parameters) errors.push("Parameters schema is required");
    if (!capability.security) errors.push("Security configuration is required");
    if (!capability.performance)
      errors.push("Performance configuration is required");

    return { valid: errors.length === 0, errors };
  }

  private extractCategory(capability: A2ACapability): string {
    // Extract category from capability name or metadata
    const nameParts = capability.name.split(".");
    return nameParts.length > 1 ? nameParts[0] : "general";
  }

  private updateDependencyGraph(id: string, capability: A2ACapability): void {
    // Extract dependencies from capability metadata
    const deps = capability.security.requiredCapabilities || [];
    this.dependencyGraph.set(id, new Set(deps));
  }

  private hasCircularDependencies(
    dependencies: Record<string, string[]>,
  ): boolean {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (node: string): boolean => {
      if (visiting.has(node)) return true; // Circular dependency found
      if (visited.has(node)) return false;

      visiting.add(node);

      const deps = dependencies[node] || [];
      for (const dep of deps) {
        if (visit(dep)) return true;
      }

      visiting.delete(node);
      visited.add(node);
      return false;
    };

    for (const node of Object.keys(dependencies)) {
      if (visit(node)) return true;
    }

    return false;
  }

  private async validateCompositionSecurity(
    composition: CapabilityComposition,
    context: A2AToolContext,
  ): Promise<void> {
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
      throw new Error(
        `Insufficient trust level for composition: required ${policy.minTrustLevel}, got ${context.trustLevel}`,
      );
    }

    // Check aggregated capabilities
    const missingCapabilities = policy.aggregatedCapabilities.filter(
      (cap) => !context.capabilities.includes(cap),
    );

    if (missingCapabilities.length > 0) {
      throw new Error(
        `Missing required capabilities for composition: ${missingCapabilities.join(", ")}`,
      );
    }
  }

  private async executeSequential(
    composition: CapabilityComposition,
    parameters: Record<string, any>,
    context: A2AToolContext,
    results: Map<string, any>,
    errors: Map<string, Error>,
  ): Promise<void> {
    for (const capabilityId of composition.capabilities) {
      try {
        const registration = this.registrations.get(capabilityId)!;
        const result = await this.executeSingleCapability(
          registration,
          parameters,
          context,
        );
        results.set(capabilityId, result);
      } catch (error: any) {
        errors.set(capabilityId, error);
        if (composition.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }
  }

  private async executeParallel(
    composition: CapabilityComposition,
    parameters: Record<string, any>,
    context: A2AToolContext,
    results: Map<string, any>,
    errors: Map<string, Error>,
  ): Promise<void> {
    const promises = composition.capabilities.map(async (capabilityId) => {
      try {
        const registration = this.registrations.get(capabilityId)!;
        const result = await this.executeSingleCapability(
          registration,
          parameters,
          context,
        );
        results.set(capabilityId, result);
      } catch (error: any) {
        errors.set(capabilityId, error);
      }
    });

    await Promise.all(promises);
  }

  private async executeConditional(
    composition: CapabilityComposition,
    parameters: Record<string, any>,
    context: A2AToolContext,
    results: Map<string, any>,
    errors: Map<string, Error>,
  ): Promise<void> {
    // Conditional execution logic would be implemented based on composition metadata
    // For now, default to sequential execution
    await this.executeSequential(
      composition,
      parameters,
      context,
      results,
      errors,
    );
  }

  private async executePipeline(
    composition: CapabilityComposition,
    parameters: Record<string, any>,
    context: A2AToolContext,
    results: Map<string, any>,
    errors: Map<string, Error>,
  ): Promise<void> {
    let currentParameters = parameters;

    for (const capabilityId of composition.capabilities) {
      try {
        const registration = this.registrations.get(capabilityId)!;
        const result = await this.executeSingleCapability(
          registration,
          currentParameters,
          context,
        );
        results.set(capabilityId, result);

        // Use result as input for next capability
        currentParameters = { ...currentParameters, ...result };
      } catch (error: any) {
        errors.set(capabilityId, error);
        if (composition.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }
  }

  private async executeSingleCapability(
    registration: CapabilityRegistration,
    parameters: Record<string, any>,
    context: A2AToolContext,
  ): Promise<any> {
    // This would invoke the actual capability wrapper
    // For now, return a placeholder
    return { success: true, data: parameters };
  }

  private async handleCompositionErrors(
    composition: CapabilityComposition,
    errors: Map<string, Error>,
  ): Promise<void> {
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

  private aggregateResults(results: Map<string, any>): any {
    const aggregated: Record<string, any> = {};

    for (const [capabilityId, result] of results) {
      if (result && typeof result === "object" && result.data) {
        aggregated[capabilityId] = result.data;
      } else {
        aggregated[capabilityId] = result;
      }
    }

    return aggregated;
  }

  private aggregateParameters(
    capabilities: A2ACapability[],
    strategy: "merge" | "compose" | "overlay",
  ): any {
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

  private aggregateOutputSchema(
    capabilities: A2ACapability[],
    strategy: "merge" | "compose" | "overlay",
  ): any {
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

  private aggregatePerformance(
    capabilities: A2ACapability[],
  ): CapabilityAggregation["performance"] {
    const avgLatency =
      capabilities.reduce((sum, cap) => sum + cap.performance.avgLatency, 0) /
      capabilities.length;
    const maxResourceUsage = capabilities.reduce(
      (max, cap) => {
        const levels = ["low", "medium", "high"];
        const currentIndex = levels.indexOf(cap.performance.resourceUsage);
        const maxIndex = levels.indexOf(max);
        return currentIndex > maxIndex ? cap.performance.resourceUsage : max;
      },
      "low" as "low" | "medium" | "high",
    );

    return {
      estimatedLatency: avgLatency,
      resourceUsage: maxResourceUsage,
      cacheable: capabilities.every((cap) => cap.performance.cacheable),
    };
  }

  private aggregateSecurity(
    capabilities: A2ACapability[],
  ): CapabilityAggregation["security"] {
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

    const combinedCapabilities = new Set<string>();
    capabilities.forEach((cap) => {
      cap.security.requiredCapabilities.forEach((c) =>
        combinedCapabilities.add(c),
      );
    });

    return {
      effectiveTrustLevel: maxTrustLevel,
      combinedCapabilities: Array.from(combinedCapabilities),
    };
  }

  private async generateRecommendations(): Promise<
    CapabilityDiscovery["recommendations"]
  > {
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

  private async generateCompatibilityMatrix(): Promise<
    Record<string, string[]>
  > {
    // Generate compatibility information between capabilities
    const matrix: Record<string, string[]> = {};

    for (const [id, registration] of this.registrations) {
      matrix[id] = Array.from(this.dependencyGraph.get(id) || []);
    }

    return matrix;
  }
}

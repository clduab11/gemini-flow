/**
 * Conflict Resolution for A2A Memory Coordination
 *
 * Implements sophisticated conflict resolution strategies:
 * - Last-Writer-Wins (LWW) with vector clocks
 * - Semantic Conflict Resolution
 * - Multi-Value Resolution with user-defined merge functions
 * - Priority-based Resolution
 * - Operational Transform for collaborative editing
 * - Custom Application-Specific Resolvers
 * - Conflict Prevention through Locking
 */

import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { VectorClock } from "./vector-clocks.js";

export type ConflictResolutionStrategy =
  | "lww" // Last Writer Wins
  | "mvr" // Multi-Value Register
  | "semantic" // Semantic merge
  | "priority" // Priority-based
  | "operational" // Operational Transform
  | "custom" // Custom resolver
  | "manual" // Manual resolution required
  | "union" // Union of values (for sets)
  | "intersection"; // Intersection of values

export interface ConflictContext {
  key: string;
  namespace: string;
  conflictType: "concurrent_write" | "read_write" | "structural" | "semantic";
  localValue: ConflictValue;
  remoteValue: ConflictValue;
  commonAncestor?: ConflictValue;
  metadata: {
    agents: string[];
    timestamp: Date;
    priority: number;
    contentType?: string;
    schema?: any;
  };
}

export interface ConflictValue {
  data: any;
  vectorClock: VectorClock;
  agentId: string;
  timestamp: Date;
  version: number;
  checksum?: string;
  metadata?: {
    priority?: number;
    contentType?: string;
    sourceOperation?: string;
    dependencies?: string[];
  };
}

export interface ConflictResolution {
  resolutionId: string;
  strategy: ConflictResolutionStrategy;
  resolvedValue: any;
  confidence: number; // 0-1 confidence in resolution
  reasoning: string;
  appliedTransforms?: OperationalTransform[];
  alternativeValues?: any[];
  requiresManualReview: boolean;
  timestamp: Date;
  resolverAgent: string;
}

export interface OperationalTransform {
  type: "insert" | "delete" | "retain" | "replace" | "move";
  position: number;
  content?: any;
  length?: number;
  priority: number;
  agentId: string;
  timestamp: Date;
}

export interface ConflictRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  strategy: ConflictResolutionStrategy;
  priority: number;
  conditions: ConflictCondition[];
  customResolver?: (context: ConflictContext) => Promise<ConflictResolution>;
  transformers?: OperationalTransform[];
}

export interface ConflictCondition {
  field: string;
  operator: "equals" | "contains" | "matches" | "greater" | "less";
  value: any;
  negate?: boolean;
}

export interface ConflictStats {
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  manualReviewRequired: number;
  resolutionsByStrategy: Map<ConflictResolutionStrategy, number>;
  averageResolutionTime: number;
  conflictRate: number;
  accuracyScore: number;
}

/**
 * Main Conflict Resolver
 */
export class ConflictResolver extends EventEmitter {
  private logger: Logger;
  private vectorClock: VectorClock;
  private rules: Map<string, ConflictRule> = new Map();
  private pendingConflicts: Map<string, ConflictContext> = new Map();
  private resolutionHistory: Map<string, ConflictResolution> = new Map();
  private customResolvers: Map<string, Function> = new Map();

  // Statistics
  private stats: ConflictStats = {
    totalConflicts: 0,
    resolvedConflicts: 0,
    pendingConflicts: 0,
    manualReviewRequired: 0,
    resolutionsByStrategy: new Map(),
    averageResolutionTime: 0,
    conflictRate: 0,
    accuracyScore: 0,
  };

  constructor(
    vectorClock: VectorClock,
    defaultStrategy: ConflictResolutionStrategy = "lww",
  ) {
    super();
    this.logger = new Logger("ConflictResolver");
    this.vectorClock = vectorClock;

    this.initializeDefaultRules(defaultStrategy);
    this.initializeBuiltinResolvers();

    this.logger.info("Conflict resolver initialized", {
      defaultStrategy,
      rulesCount: this.rules.size,
    });
  }

  /**
   * Resolve a conflict between two values
   */
  async resolve(
    localValue: ConflictValue,
    remoteValue: ConflictValue,
    key: string = "unknown",
    namespace: string = "default",
  ): Promise<ConflictResolution> {
    const startTime = Date.now();

    try {
      // Create conflict context
      const context: ConflictContext = {
        key,
        namespace,
        conflictType: this.determineConflictType(localValue, remoteValue),
        localValue,
        remoteValue,
        commonAncestor: await this.findCommonAncestor(localValue, remoteValue),
        metadata: {
          agents: [localValue.agentId, remoteValue.agentId],
          timestamp: new Date(),
          priority: Math.max(
            localValue.metadata?.priority || 5,
            remoteValue.metadata?.priority || 5,
          ),
        },
      };

      this.stats.totalConflicts++;
      this.pendingConflicts.set(this.generateConflictId(context), context);

      // Find applicable rule
      const rule = this.findApplicableRule(context);

      // Execute resolution strategy
      const resolution = await this.executeResolutionStrategy(context, rule);

      // Record resolution
      this.recordResolution(context, resolution);

      const resolutionTime = Date.now() - startTime;
      this.updateStats(resolution, resolutionTime);

      this.logger.debug("Conflict resolved", {
        key,
        strategy: resolution.strategy,
        confidence: resolution.confidence,
        resolutionTime,
      });

      this.emit("conflict_resolved", { context, resolution });

      return resolution;
    } catch (error) {
      this.logger.error("Conflict resolution failed", {
        key,
        namespace,
        error: error.message,
      });

      // Return fallback resolution
      return this.createFallbackResolution(localValue, remoteValue);
    }
  }

  /**
   * Add a custom conflict resolution rule
   */
  addRule(rule: ConflictRule): void {
    this.rules.set(rule.id, rule);

    this.logger.info("Conflict rule added", {
      ruleId: rule.id,
      strategy: rule.strategy,
      priority: rule.priority,
    });
  }

  /**
   * Remove a conflict resolution rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);

    if (removed) {
      this.logger.info("Conflict rule removed", { ruleId });
    }

    return removed;
  }

  /**
   * Register a custom resolver function
   */
  registerCustomResolver(
    name: string,
    resolver: (context: ConflictContext) => Promise<ConflictResolution>,
  ): void {
    this.customResolvers.set(name, resolver);

    this.logger.info("Custom resolver registered", { name });
  }

  /**
   * Perform semantic merge for structured data
   */
  async semanticMerge(
    localValue: any,
    remoteValue: any,
    schema?: any,
  ): Promise<any> {
    try {
      // Handle different data types
      if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        return this.mergeArrays(localValue, remoteValue);
      }

      if (this.isObject(localValue) && this.isObject(remoteValue)) {
        return this.mergeObjects(localValue, remoteValue, schema);
      }

      if (typeof localValue === "string" && typeof remoteValue === "string") {
        return this.mergeStrings(localValue, remoteValue);
      }

      if (typeof localValue === "number" && typeof remoteValue === "number") {
        return this.mergeNumbers(localValue, remoteValue);
      }

      // Fallback to LWW for other types
      return this.vectorClock.compare(
        new VectorClock("local"),
        new VectorClock("remote"),
      ) === "after"
        ? localValue
        : remoteValue;
    } catch (error) {
      this.logger.error("Semantic merge failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Apply operational transforms to resolve text conflicts
   */
  async applyOperationalTransforms(
    baseText: string,
    transforms: OperationalTransform[],
  ): Promise<string> {
    // Sort transforms by priority and timestamp
    const sortedTransforms = transforms.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    let result = baseText;
    let offset = 0;

    for (const transform of sortedTransforms) {
      try {
        result = this.applyTransform(result, transform, offset);
        offset = this.calculateOffset(transform, offset);
      } catch (error) {
        this.logger.warn("Failed to apply transform", {
          transform: transform.type,
          error: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Get conflict resolution statistics
   */
  getStats(): ConflictStats {
    this.updateConflictRate();
    return { ...this.stats };
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): ConflictContext[] {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(limit: number = 100): ConflictResolution[] {
    return Array.from(this.resolutionHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old resolution history
   */
  cleanupHistory(olderThan: Date): number {
    let cleaned = 0;

    for (const [id, resolution] of this.resolutionHistory) {
      if (resolution.timestamp < olderThan) {
        this.resolutionHistory.delete(id);
        cleaned++;
      }
    }

    this.logger.debug("Resolution history cleaned", { cleaned });
    return cleaned;
  }

  /**
   * Private methods
   */

  private initializeDefaultRules(
    defaultStrategy: ConflictResolutionStrategy,
  ): void {
    // Default rule for all conflicts
    this.addRule({
      id: "default",
      name: "Default Resolution Strategy",
      pattern: ".*",
      strategy: defaultStrategy,
      priority: 0,
      conditions: [],
    });

    // High-priority rule for critical system keys
    this.addRule({
      id: "system_critical",
      name: "System Critical Keys",
      pattern: /^system:|^config:|^security:/,
      strategy: "priority",
      priority: 10,
      conditions: [{ field: "priority", operator: "greater", value: 8 }],
    });

    // Rule for collaborative documents
    this.addRule({
      id: "collaborative_text",
      name: "Collaborative Text Documents",
      pattern: /^doc:|^text:|^content:/,
      strategy: "operational",
      priority: 8,
      conditions: [
        { field: "contentType", operator: "equals", value: "text/plain" },
      ],
    });

    // Rule for configuration merging
    this.addRule({
      id: "config_merge",
      name: "Configuration Objects",
      pattern: /^config\./,
      strategy: "semantic",
      priority: 7,
      conditions: [],
    });

    // Rule for sets and arrays
    this.addRule({
      id: "set_union",
      name: "Set Union Resolution",
      pattern: /^set:|^list:|^array:/,
      strategy: "union",
      priority: 6,
      conditions: [],
    });
  }

  private initializeBuiltinResolvers(): void {
    // Last-Writer-Wins resolver
    this.customResolvers.set("lww", async (context) => {
      const comparison = context.localValue.vectorClock.compare(
        context.remoteValue.vectorClock,
      );

      let resolvedValue: any;
      let confidence = 0.9;

      if (comparison === "after") {
        resolvedValue = context.localValue.data;
      } else if (comparison === "before") {
        resolvedValue = context.remoteValue.data;
      } else {
        // Concurrent - use timestamp as tiebreaker
        resolvedValue =
          context.localValue.timestamp > context.remoteValue.timestamp
            ? context.localValue.data
            : context.remoteValue.data;
        confidence = 0.7; // Lower confidence for concurrent updates
      }

      return {
        resolutionId: this.generateResolutionId(),
        strategy: "lww",
        resolvedValue,
        confidence,
        reasoning: `LWW resolution based on vector clock comparison: ${comparison}`,
        requiresManualReview: false,
        timestamp: new Date(),
        resolverAgent: this.vectorClock.getAgents()[0] || "system",
      };
    });

    // Multi-value resolver
    this.customResolvers.set("mvr", async (context) => {
      const values = [context.localValue.data, context.remoteValue.data];

      return {
        resolutionId: this.generateResolutionId(),
        strategy: "mvr",
        resolvedValue: values,
        confidence: 1.0,
        reasoning: "Multi-value resolution - preserving all concurrent values",
        alternativeValues: values,
        requiresManualReview: true,
        timestamp: new Date(),
        resolverAgent: this.vectorClock.getAgents()[0] || "system",
      };
    });

    // Priority-based resolver
    this.customResolvers.set("priority", async (context) => {
      const localPriority = context.localValue.metadata?.priority || 5;
      const remotePriority = context.remoteValue.metadata?.priority || 5;

      const resolvedValue =
        localPriority >= remotePriority
          ? context.localValue.data
          : context.remoteValue.data;

      return {
        resolutionId: this.generateResolutionId(),
        strategy: "priority",
        resolvedValue,
        confidence: 0.95,
        reasoning: `Priority-based resolution: local=${localPriority}, remote=${remotePriority}`,
        requiresManualReview: localPriority === remotePriority,
        timestamp: new Date(),
        resolverAgent: this.vectorClock.getAgents()[0] || "system",
      };
    });

    // Union resolver for sets/arrays
    this.customResolvers.set("union", async (context) => {
      let resolvedValue: any;

      if (
        Array.isArray(context.localValue.data) &&
        Array.isArray(context.remoteValue.data)
      ) {
        resolvedValue = [
          ...new Set([...context.localValue.data, ...context.remoteValue.data]),
        ];
      } else if (
        this.isSet(context.localValue.data) &&
        this.isSet(context.remoteValue.data)
      ) {
        resolvedValue = new Set([
          ...context.localValue.data,
          ...context.remoteValue.data,
        ]);
      } else {
        // Fallback to array union
        const local = Array.isArray(context.localValue.data)
          ? context.localValue.data
          : [context.localValue.data];
        const remote = Array.isArray(context.remoteValue.data)
          ? context.remoteValue.data
          : [context.remoteValue.data];

        resolvedValue = [...new Set([...local, ...remote])];
      }

      return {
        resolutionId: this.generateResolutionId(),
        strategy: "union",
        resolvedValue,
        confidence: 0.95,
        reasoning: "Union of all values from conflicting updates",
        requiresManualReview: false,
        timestamp: new Date(),
        resolverAgent: this.vectorClock.getAgents()[0] || "system",
      };
    });
  }

  private determineConflictType(
    localValue: ConflictValue,
    remoteValue: ConflictValue,
  ): ConflictContext["conflictType"] {
    const comparison = localValue.vectorClock.compare(remoteValue.vectorClock);

    if (comparison === "concurrent") {
      return "concurrent_write";
    }

    // Check for structural conflicts
    if (this.hasStructuralDifferences(localValue.data, remoteValue.data)) {
      return "structural";
    }

    // Check for semantic conflicts
    if (this.hasSemanticConflicts(localValue.data, remoteValue.data)) {
      return "semantic";
    }

    return "read_write";
  }

  private async findCommonAncestor(
    localValue: ConflictValue,
    remoteValue: ConflictValue,
  ): Promise<ConflictValue | undefined> {
    // In a real implementation, this would traverse the version history
    // to find the last common version before divergence

    // For now, return undefined indicating no common ancestor found
    return undefined;
  }

  private findApplicableRule(context: ConflictContext): ConflictRule {
    const applicableRules = Array.from(this.rules.values())
      .filter((rule) => this.ruleMatches(rule, context))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length === 0) {
      // Return default rule
      return this.rules.get("default")!;
    }

    return applicableRules[0];
  }

  private ruleMatches(rule: ConflictRule, context: ConflictContext): boolean {
    // Check pattern match
    const pattern =
      typeof rule.pattern === "string"
        ? new RegExp(rule.pattern)
        : rule.pattern;

    if (!pattern.test(context.key)) {
      return false;
    }

    // Check conditions
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(
    condition: ConflictCondition,
    context: ConflictContext,
  ): boolean {
    let value: any;

    // Extract field value from context
    if (condition.field.startsWith("local.")) {
      value = this.getNestedValue(
        context.localValue,
        condition.field.substring(6),
      );
    } else if (condition.field.startsWith("remote.")) {
      value = this.getNestedValue(
        context.remoteValue,
        condition.field.substring(7),
      );
    } else {
      value = this.getNestedValue(context.metadata, condition.field);
    }

    let result = false;

    switch (condition.operator) {
      case "equals":
        result = value === condition.value;
        break;
      case "contains":
        result = Array.isArray(value)
          ? value.includes(condition.value)
          : String(value).includes(String(condition.value));
        break;
      case "matches":
        result = new RegExp(condition.value).test(String(value));
        break;
      case "greater":
        result = Number(value) > Number(condition.value);
        break;
      case "less":
        result = Number(value) < Number(condition.value);
        break;
    }

    return condition.negate ? !result : result;
  }

  private async executeResolutionStrategy(
    context: ConflictContext,
    rule: ConflictRule,
  ): Promise<ConflictResolution> {
    if (rule.customResolver) {
      return await rule.customResolver(context);
    }

    const resolver = this.customResolvers.get(rule.strategy);
    if (resolver) {
      return await resolver(context);
    }

    // Built-in strategy implementations
    switch (rule.strategy) {
      case "semantic":
        return await this.executeSemanticResolution(context);
      case "operational":
        return await this.executeOperationalResolution(context);
      case "intersection":
        return await this.executeIntersectionResolution(context);
      default:
        throw new Error(`Unknown resolution strategy: ${rule.strategy}`);
    }
  }

  private async executeSemanticResolution(
    context: ConflictContext,
  ): Promise<ConflictResolution> {
    try {
      const mergedValue = await this.semanticMerge(
        context.localValue.data,
        context.remoteValue.data,
      );

      return {
        resolutionId: this.generateResolutionId(),
        strategy: "semantic",
        resolvedValue: mergedValue,
        confidence: 0.85,
        reasoning: "Semantic merge of structured data",
        requiresManualReview: false,
        timestamp: new Date(),
        resolverAgent: this.vectorClock.getAgents()[0] || "system",
      };
    } catch (error) {
      // Fallback to LWW on semantic merge failure
      return await this.customResolvers.get("lww")!(context);
    }
  }

  private async executeOperationalResolution(
    context: ConflictContext,
  ): Promise<ConflictResolution> {
    if (
      typeof context.localValue.data !== "string" ||
      typeof context.remoteValue.data !== "string"
    ) {
      // OT only works with strings, fallback to semantic merge
      return await this.executeSemanticResolution(context);
    }

    // Generate operational transforms
    const transforms = this.generateOperationalTransforms(
      context.commonAncestor?.data || "",
      context.localValue.data,
      context.remoteValue.data,
    );

    // Apply transforms to base text
    const baseText = context.commonAncestor?.data || context.localValue.data;
    const resolvedText = await this.applyOperationalTransforms(
      baseText,
      transforms,
    );

    return {
      resolutionId: this.generateResolutionId(),
      strategy: "operational",
      resolvedValue: resolvedText,
      confidence: 0.8,
      reasoning: "Operational transform resolution for collaborative text",
      appliedTransforms: transforms,
      requiresManualReview: transforms.length > 10, // Complex merges need review
      timestamp: new Date(),
      resolverAgent: this.vectorClock.getAgents()[0] || "system",
    };
  }

  private async executeIntersectionResolution(
    context: ConflictContext,
  ): Promise<ConflictResolution> {
    let resolvedValue: any;

    if (
      Array.isArray(context.localValue.data) &&
      Array.isArray(context.remoteValue.data)
    ) {
      resolvedValue = context.localValue.data.filter((item) =>
        context.remoteValue.data.includes(item),
      );
    } else if (
      this.isSet(context.localValue.data) &&
      this.isSet(context.remoteValue.data)
    ) {
      resolvedValue = new Set(
        [...context.localValue.data].filter((item) =>
          context.remoteValue.data.has(item),
        ),
      );
    } else {
      // For non-collection types, use LWW as fallback
      return await this.customResolvers.get("lww")!(context);
    }

    return {
      resolutionId: this.generateResolutionId(),
      strategy: "intersection",
      resolvedValue,
      confidence: 0.9,
      reasoning: "Intersection of values from conflicting updates",
      requiresManualReview:
        Array.isArray(resolvedValue) && resolvedValue.length === 0,
      timestamp: new Date(),
      resolverAgent: this.vectorClock.getAgents()[0] || "system",
    };
  }

  private generateOperationalTransforms(
    baseText: string,
    localText: string,
    remoteText: string,
  ): OperationalTransform[] {
    const transforms: OperationalTransform[] = [];

    // Simple diff-based transform generation
    // In a real implementation, use a proper diff algorithm like Myers or patience diff

    const localDiff = this.simpleDiff(baseText, localText);
    const remoteDiff = this.simpleDiff(baseText, remoteText);

    // Convert diffs to operational transforms
    for (const diff of localDiff) {
      transforms.push({
        type: diff.type as any,
        position: diff.position,
        content: diff.content,
        length: diff.length,
        priority: 5,
        agentId: "local",
        timestamp: new Date(),
      });
    }

    for (const diff of remoteDiff) {
      transforms.push({
        type: diff.type as any,
        position: diff.position,
        content: diff.content,
        length: diff.length,
        priority: 5,
        agentId: "remote",
        timestamp: new Date(),
      });
    }

    return transforms;
  }

  private simpleDiff(
    oldText: string,
    newText: string,
  ): Array<{
    type: string;
    position: number;
    content?: string;
    length?: number;
  }> {
    // Very simple diff implementation - replace with proper algorithm
    if (oldText === newText) return [];

    if (oldText.length === 0) {
      return [
        {
          type: "insert",
          position: 0,
          content: newText,
        },
      ];
    }

    if (newText.length === 0) {
      return [
        {
          type: "delete",
          position: 0,
          length: oldText.length,
        },
      ];
    }

    // For now, just replace the entire text
    return [
      {
        type: "replace",
        position: 0,
        content: newText,
        length: oldText.length,
      },
    ];
  }

  private applyTransform(
    text: string,
    transform: OperationalTransform,
    offset: number,
  ): string {
    const position = transform.position + offset;

    switch (transform.type) {
      case "insert":
        return (
          text.slice(0, position) +
          (transform.content || "") +
          text.slice(position)
        );

      case "delete":
        return (
          text.slice(0, position) +
          text.slice(position + (transform.length || 0))
        );

      case "replace":
        return (
          text.slice(0, position) +
          (transform.content || "") +
          text.slice(position + (transform.length || 0))
        );

      case "retain":
        return text; // No change

      default:
        return text;
    }
  }

  private calculateOffset(
    transform: OperationalTransform,
    currentOffset: number,
  ): number {
    switch (transform.type) {
      case "insert":
        return currentOffset + (transform.content?.length || 0);
      case "delete":
        return currentOffset - (transform.length || 0);
      case "replace":
        const oldLength = transform.length || 0;
        const newLength = transform.content?.length || 0;
        return currentOffset + (newLength - oldLength);
      default:
        return currentOffset;
    }
  }

  private mergeArrays(local: any[], remote: any[]): any[] {
    // Union of arrays with deduplication
    const merged = [...local];

    for (const item of remote) {
      if (!merged.some((existing) => this.deepEquals(existing, item))) {
        merged.push(item);
      }
    }

    return merged;
  }

  private mergeObjects(local: any, remote: any, schema?: any): any {
    const merged = { ...local };

    for (const [key, value] of Object.entries(remote)) {
      if (!(key in merged)) {
        // New key in remote
        merged[key] = value;
      } else if (this.isObject(merged[key]) && this.isObject(value)) {
        // Recursively merge nested objects
        merged[key] = this.mergeObjects(merged[key], value, schema?.[key]);
      } else if (Array.isArray(merged[key]) && Array.isArray(value)) {
        // Merge arrays
        merged[key] = this.mergeArrays(merged[key], value);
      } else if (merged[key] !== value) {
        // Conflict - use schema or fallback to remote value
        merged[key] = this.resolveObjectConflict(
          key,
          merged[key],
          value,
          schema,
        );
      }
    }

    return merged;
  }

  private mergeStrings(local: string, remote: string): string {
    // Simple string merge - in practice, use proper text merging algorithms
    if (local === remote) return local;

    // Try to find common prefix and suffix
    let commonPrefix = "";
    let commonSuffix = "";

    const minLength = Math.min(local.length, remote.length);

    // Find common prefix
    for (let i = 0; i < minLength; i++) {
      if (local[i] === remote[i]) {
        commonPrefix += local[i];
      } else {
        break;
      }
    }

    // Find common suffix
    for (let i = 1; i <= minLength - commonPrefix.length; i++) {
      if (local[local.length - i] === remote[remote.length - i]) {
        commonSuffix = local[local.length - i] + commonSuffix;
      } else {
        break;
      }
    }

    const localMiddle = local.slice(
      commonPrefix.length,
      local.length - commonSuffix.length,
    );
    const remoteMiddle = remote.slice(
      commonPrefix.length,
      remote.length - commonSuffix.length,
    );

    // Combine different parts
    return commonPrefix + localMiddle + remoteMiddle + commonSuffix;
  }

  private mergeNumbers(local: number, remote: number): number {
    // Average of numbers (simple strategy)
    return (local + remote) / 2;
  }

  private resolveObjectConflict(
    key: string,
    localValue: any,
    remoteValue: any,
    schema?: any,
  ): any {
    // Use schema hints if available
    if (schema?.mergeStrategy) {
      switch (schema.mergeStrategy) {
        case "prefer_local":
          return localValue;
        case "prefer_remote":
          return remoteValue;
        case "sum":
          return Number(localValue) + Number(remoteValue);
        case "max":
          return Math.max(Number(localValue), Number(remoteValue));
        case "min":
          return Math.min(Number(localValue), Number(remoteValue));
      }
    }

    // Default to remote value
    return remoteValue;
  }

  private createFallbackResolution(
    localValue: ConflictValue,
    remoteValue: ConflictValue,
  ): ConflictResolution {
    return {
      resolutionId: this.generateResolutionId(),
      strategy: "lww",
      resolvedValue: localValue.data, // Default to local
      confidence: 0.5,
      reasoning: "Fallback resolution due to resolution error",
      requiresManualReview: true,
      timestamp: new Date(),
      resolverAgent: this.vectorClock.getAgents()[0] || "system",
    };
  }

  private recordResolution(
    context: ConflictContext,
    resolution: ConflictResolution,
  ): void {
    const conflictId = this.generateConflictId(context);

    this.resolutionHistory.set(resolution.resolutionId, resolution);
    this.pendingConflicts.delete(conflictId);

    this.stats.resolvedConflicts++;
    this.stats.pendingConflicts = this.pendingConflicts.size;

    if (resolution.requiresManualReview) {
      this.stats.manualReviewRequired++;
    }
  }

  private updateStats(
    resolution: ConflictResolution,
    resolutionTime: number,
  ): void {
    // Update strategy statistics
    const strategyCount =
      this.stats.resolutionsByStrategy.get(resolution.strategy) || 0;
    this.stats.resolutionsByStrategy.set(
      resolution.strategy,
      strategyCount + 1,
    );

    // Update average resolution time
    this.stats.averageResolutionTime =
      (this.stats.averageResolutionTime + resolutionTime) / 2;

    // Update accuracy score based on confidence
    this.stats.accuracyScore =
      (this.stats.accuracyScore + resolution.confidence) / 2;
  }

  private updateConflictRate(): void {
    // Calculate conflicts per time unit (simplified)
    const timeWindow = 60000; // 1 minute
    this.stats.conflictRate = this.stats.totalConflicts / (timeWindow / 1000);
  }

  // Utility methods
  private generateConflictId(context: ConflictContext): string {
    return `conflict_${context.key}_${context.metadata.timestamp.getTime()}`;
  }

  private generateResolutionId(): string {
    return `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  private isSet(value: any): boolean {
    return value instanceof Set;
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;

    if (a == null || b == null) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEquals(a[i], b[i])) return false;
      }
      return true;
    }

    if (this.isObject(a) && this.isObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEquals(a[key], b[key])) return false;
      }

      return true;
    }

    return false;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private hasStructuralDifferences(local: any, remote: any): boolean {
    // Check if the structure (keys, types) differs significantly
    if (typeof local !== typeof remote) return true;

    if (this.isObject(local) && this.isObject(remote)) {
      const localKeys = Object.keys(local);
      const remoteKeys = Object.keys(remote);

      // More than 50% different keys indicates structural difference
      const commonKeys = localKeys.filter((key) => remoteKeys.includes(key));
      const totalKeys = new Set([...localKeys, ...remoteKeys]).size;

      return commonKeys.length / totalKeys < 0.5;
    }

    return false;
  }

  private hasSemanticConflicts(local: any, remote: any): boolean {
    // Detect semantic conflicts (values that shouldn't be automatically merged)
    if (this.isObject(local) && this.isObject(remote)) {
      // Check for conflicting business logic fields
      const criticalFields = ["id", "version", "status", "state"];

      for (const field of criticalFields) {
        if (local[field] && remote[field] && local[field] !== remote[field]) {
          return true;
        }
      }
    }

    return false;
  }
}

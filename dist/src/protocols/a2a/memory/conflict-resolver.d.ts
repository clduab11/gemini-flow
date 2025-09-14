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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VectorClock } from "./vector-clocks.js";
export type ConflictResolutionStrategy = "lww" | "mvr" | "semantic" | "priority" | "operational" | "custom" | "manual" | "union" | "intersection";
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
    confidence: number;
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
export declare class ConflictResolver extends EventEmitter {
    private logger;
    private vectorClock;
    private rules;
    private pendingConflicts;
    private resolutionHistory;
    private customResolvers;
    private stats;
    constructor(vectorClock: VectorClock, defaultStrategy?: ConflictResolutionStrategy);
    /**
     * Resolve a conflict between two values
     */
    resolve(localValue: ConflictValue, remoteValue: ConflictValue, key?: string, namespace?: string): Promise<ConflictResolution>;
    /**
     * Add a custom conflict resolution rule
     */
    addRule(rule: ConflictRule): void;
    /**
     * Remove a conflict resolution rule
     */
    removeRule(ruleId: string): boolean;
    /**
     * Register a custom resolver function
     */
    registerCustomResolver(name: string, resolver: (context: ConflictContext) => Promise<ConflictResolution>): void;
    /**
     * Perform semantic merge for structured data
     */
    semanticMerge(localValue: any, remoteValue: any, schema?: any): Promise<any>;
    /**
     * Apply operational transforms to resolve text conflicts
     */
    applyOperationalTransforms(baseText: string, transforms: OperationalTransform[]): Promise<string>;
    /**
     * Get conflict resolution statistics
     */
    getStats(): ConflictStats;
    /**
     * Get pending conflicts
     */
    getPendingConflicts(): ConflictContext[];
    /**
     * Get resolution history
     */
    getResolutionHistory(limit?: number): ConflictResolution[];
    /**
     * Clear old resolution history
     */
    cleanupHistory(olderThan: Date): number;
    /**
     * Private methods
     */
    private initializeDefaultRules;
    private initializeBuiltinResolvers;
    private determineConflictType;
    private findCommonAncestor;
    private findApplicableRule;
    private ruleMatches;
    private evaluateCondition;
    private executeResolutionStrategy;
    private executeSemanticResolution;
    private executeOperationalResolution;
    private executeIntersectionResolution;
    private generateOperationalTransforms;
    private simpleDiff;
    private applyTransform;
    private calculateOffset;
    private mergeArrays;
    private mergeObjects;
    private mergeStrings;
    private mergeNumbers;
    private resolveObjectConflict;
    private createFallbackResolution;
    private recordResolution;
    private updateStats;
    private updateConflictRate;
    private generateConflictId;
    private generateResolutionId;
    private isObject;
    private isSet;
    private deepEquals;
    private getNestedValue;
    private hasStructuralDifferences;
    private hasSemanticConflicts;
}
//# sourceMappingURL=conflict-resolver.d.ts.map
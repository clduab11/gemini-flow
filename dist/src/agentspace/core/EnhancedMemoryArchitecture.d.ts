/**
 * Enhanced Memory Architecture for AgentSpace
 *
 * Integrates with existing distributed memory system and extends it with:
 * - Spatial memory nodes with location-aware storage
 * - Mem0 MCP integration for knowledge graphs
 * - Enhanced CRDT synchronization
 * - Spatial context-aware memory retrieval
 * - Memory analytics and optimization
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { DistributedMemoryManager } from "../../protocols/a2a/memory/distributed-memory-manager.js";
import { SpatialMemoryNode, Vector3D } from "../types/AgentSpaceTypes.js";
export interface EnhancedMemoryConfig {
    spatialIndexingEnabled: boolean;
    knowledgeGraphEnabled: boolean;
    mem0Integration: boolean;
    compressionEnabled: boolean;
    spatialRadius: number;
    maxMemoryNodes: number;
    persistenceLevel: "volatile" | "session" | "persistent" | "archival";
    analyticsEnabled: boolean;
}
export interface MemoryQuery {
    type: "spatial" | "semantic" | "temporal" | "knowledge_graph" | "full_text";
    parameters: MemoryQueryParameters;
    filters?: MemoryFilter[];
    limit?: number;
    offset?: number;
}
export interface MemoryQueryParameters {
    location?: Vector3D;
    radius?: number;
    semantic?: string;
    timeRange?: {
        start: Date;
        end: Date;
    };
    agentId?: string;
    memoryTypes?: string[];
    keywords?: string[];
    knowledgePattern?: string;
}
export interface MemoryFilter {
    field: string;
    operator: "equals" | "contains" | "greater_than" | "less_than" | "in_range";
    value: any;
}
export interface MemoryInsight {
    type: "pattern" | "anomaly" | "correlation" | "prediction";
    description: string;
    confidence: number;
    data: any;
    timestamp: Date;
    relevantNodes: string[];
}
export interface MemoryAnalytics {
    totalNodes: number;
    spatialDistribution: SpatialDistribution;
    memoryTypes: {
        [type: string]: number;
    };
    knowledgeConnectivity: ConnectivityMetrics;
    temporalPatterns: TemporalPattern[];
    insights: MemoryInsight[];
}
export interface SpatialDistribution {
    hotspots: {
        location: Vector3D;
        density: number;
    }[];
    coverage: number;
    clustering: number;
}
export interface ConnectivityMetrics {
    averageConnections: number;
    networkDensity: number;
    stronglyConnectedComponents: number;
    isolatedNodes: number;
}
export interface TemporalPattern {
    pattern: string;
    frequency: number;
    timeOfDay?: string;
    confidence: number;
}
export interface Mem0Integration {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
    namespace?: string;
}
export declare class EnhancedMemoryArchitecture extends EventEmitter {
    private logger;
    private config;
    private baseMemoryManager;
    private spatialMemoryNodes;
    private spatialIndex;
    private knowledgeGraph;
    private proximityIndex;
    private temporalIndex;
    private analyticsCache;
    private metrics;
    constructor(config: EnhancedMemoryConfig, baseMemoryManager: DistributedMemoryManager);
    /**
     * Store a spatial memory node
     */
    storeMemoryNode(node: Omit<SpatialMemoryNode, "id" | "vectorClock">): Promise<string>;
    /**
     * Retrieve memory nodes by spatial query
     */
    queryMemoryBySpatialProximity(location: Vector3D, radius: number, memoryTypes?: string[], limit?: number): Promise<SpatialMemoryNode[]>;
    /**
     * Query memory using knowledge graph traversal
     */
    queryMemoryByKnowledgeGraph(startNodeId: string, traversalDepth?: number, linkTypes?: string[], limit?: number): Promise<{
        nodes: SpatialMemoryNode[];
        paths: string[][];
    }>;
    /**
     * Query memory with complex filters
     */
    queryMemory(query: MemoryQuery): Promise<SpatialMemoryNode[]>;
    /**
     * Update memory node with spatial context
     */
    updateMemoryNode(nodeId: string, updates: Partial<SpatialMemoryNode>): Promise<void>;
    /**
     * Delete memory node
     */
    deleteMemoryNode(nodeId: string): Promise<void>;
    /**
     * Synchronize with nearby agents
     */
    synchronizeWithNearbyAgents(agentLocation: Vector3D, syncRadius: number): Promise<void>;
    /**
     * Get memory analytics
     */
    getMemoryAnalytics(forceRefresh?: boolean): Promise<MemoryAnalytics>;
    /**
     * Get performance metrics
     */
    getMetrics(): {
        timestamp: Date;
        totalMemoryNodes: number;
        spatialIndexSize: number;
        knowledgeGraphSize: number;
        proximityIndexSize: number;
        memoryOperations: number;
        spatialQueries: number;
        knowledgeTraversals: number;
        compressionSavings: number;
        averageQueryTime: number;
        cacheHitRate: number;
        indexUpdates: number;
    };
    /**
     * Private helper methods
     */
    private initializeEnhancedFeatures;
    private setupBaseManagerIntegration;
    private updateSpatialIndex;
    private removeSpatialIndex;
    private getSpatialGridKey;
    private getSpatialCandidates;
    private calculateDistance;
    private updateKnowledgeGraph;
    private removeKnowledgeGraphNode;
    private updateProximityIndex;
    private updateTemporalIndex;
    private removeTemporalIndex;
    private getTimeBucket;
    private traverseKnowledgeGraph;
    private queryByTemporalRange;
    private queryBySemantic;
    private queryByFullText;
    private applyFilters;
    private getFilterValue;
    private evaluateFilterCondition;
    private propagateToDistributedMemory;
    private integrateWithMem0;
    private handleDistributedMemoryDelta;
    private handleConflictResolution;
    private updateQueryMetrics;
    private generateAnalytics;
    private analyzeSpatialDistribution;
    private analyzeKnowledgeConnectivity;
    private analyzeTemporalPatterns;
    private generateInsights;
    private performMaintenance;
    private determineRelationshipType;
    private calculateRelationshipWeight;
    private calculateInteractionStrength;
    private snapToGrid;
    private calculateClustering;
    private getTimeOfDay;
    private optimizeSpatialIndex;
    /**
     * Shutdown and cleanup
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=EnhancedMemoryArchitecture.d.ts.map
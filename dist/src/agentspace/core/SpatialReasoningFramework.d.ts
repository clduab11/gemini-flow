/**
 * Spatial Reasoning Framework
 *
 * Provides 3D workspace representation with:
 * - Agent proximity calculations
 * - Collaborative zones definition
 * - Spatial collision detection
 * - Movement prediction and path planning
 * - Spatial relationships management
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { Vector3D, BoundingBox, SpatialProperties, SpatialRelationship, SpatialZone, HotspotAnalysis } from "../types/AgentSpaceTypes.js";
export interface SpatialConfig {
    dimensions: Vector3D;
    spatialResolution: number;
    maxTrackingDistance: number;
    collisionDetectionEnabled: boolean;
    pathPlanningEnabled: boolean;
    spatialIndexingEnabled: boolean;
}
export interface SpatialEntity {
    id: string;
    type: "agent" | "zone" | "resource" | "obstacle";
    properties: SpatialProperties;
    metadata: any;
    lastUpdated: Date;
}
export interface CollisionInfo {
    entity1: string;
    entity2: string;
    intersectionVolume: number;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: Date;
    resolution?: CollisionResolution;
}
export interface CollisionResolution {
    strategy: "avoid" | "merge" | "prioritize" | "relocate";
    actions: ResolutionAction[];
    estimatedTime: number;
}
interface ResolutionAction {
    entityId: string;
    action: "move" | "resize" | "pause" | "terminate";
    parameters: any;
}
export interface PathPlanningRequest {
    entityId: string;
    startPosition: Vector3D;
    targetPosition: Vector3D;
    constraints?: PathConstraint[];
    priority: "low" | "normal" | "high" | "urgent";
}
export interface PathConstraint {
    type: "avoid_zone" | "avoid_entity" | "speed_limit" | "waypoint" | "time_window";
    parameters: any;
}
export interface PlannedPath {
    waypoints: Vector3D[];
    estimatedTime: number;
    energyCost: number;
    riskLevel: number;
    alternativePaths?: PlannedPath[];
}
export interface SpatialQuery {
    type: "nearby_entities" | "zone_occupancy" | "path_clear" | "collision_prediction";
    center?: Vector3D;
    radius?: number;
    zone?: string;
    entityTypes?: string[];
    timeWindow?: number;
}
export interface SpatialIndex {
    grid: Map<string, SpatialEntity[]>;
    octree?: OctreeNode;
    spatialHashes: Map<string, string>;
    lastRebuild: Date;
}
export interface OctreeNode {
    bounds: BoundingBox;
    entities: SpatialEntity[];
    children?: OctreeNode[];
    depth: number;
}
export declare class SpatialReasoningFramework extends EventEmitter {
    private logger;
    private config;
    private entities;
    private zones;
    private spatialIndex;
    private collisionHistory;
    private movementHistory;
    private updateTimer;
    private metrics;
    constructor(config: SpatialConfig);
    /**
     * Register a spatial entity (agent, resource, etc.)
     */
    registerEntity(id: string, type: "agent" | "zone" | "resource" | "obstacle", initialProperties: SpatialProperties, metadata?: any): void;
    /**
     * Update entity position and properties
     */
    updateEntity(id: string, newProperties: Partial<SpatialProperties>): void;
    /**
     * Remove entity from spatial tracking
     */
    unregisterEntity(id: string): void;
    /**
     * Create or update a spatial zone
     */
    createZone(zone: SpatialZone): void;
    /**
     * Query nearby entities
     */
    queryNearbyEntities(center: Vector3D, radius: number, entityTypes?: string[], includeProperties?: boolean): SpatialEntity[];
    /**
     * Calculate spatial relationships between entities
     */
    calculateSpatialRelationships(entityId: string): SpatialRelationship[];
    /**
     * Plan path between two points
     */
    planPath(request: PathPlanningRequest): Promise<PlannedPath>;
    /**
     * Predict potential collisions
     */
    predictCollisions(timeWindow?: number): CollisionInfo[];
    /**
     * Check zone access permissions
     */
    checkZoneAccess(agentId: string, zoneId: string): boolean;
    /**
     * Get zone occupancy information
     */
    getZoneOccupancy(zoneId: string): {
        zone: SpatialZone;
        occupants: SpatialEntity[];
        utilizationRate: number;
    };
    /**
     * Analyze spatial hotspots
     */
    analyzeHotspots(timeWindow?: number): HotspotAnalysis[];
    /**
     * Get comprehensive spatial metrics
     */
    getSpatialMetrics(): {
        timestamp: Date;
        spatialUtilization: number;
        averageEntityDensity: number;
        zoneUtilization: number;
        movementEfficiency: number;
        entitiesTracked: number;
        zonesManaged: number;
        collisionsDetected: number;
        pathsPlanned: number;
        spatialQueries: number;
        averageQueryTime: number;
        indexRebuildCount: number;
    };
    /**
     * Private helper methods
     */
    private initializeSpatialIndex;
    private startPeriodicUpdates;
    private performPeriodicMaintenance;
    private updateSpatialIndex;
    private removeSpatialIndex;
    private getGridKey;
    private getGridCellsInRadius;
    private calculateDistance;
    private trackMovement;
    private checkCollisions;
    private checkBoundingBoxIntersection;
    private createCollisionInfo;
    private calculateIntersectionVolume;
    private determineSeverity;
    private handleCollision;
    private updateSpatialRelationships;
    private determineRelationshipType;
    private calculateRelationshipStrength;
    private aStarPathfinding;
    private estimatePathTime;
    private calculatePathEnergyCost;
    private assessPathRisk;
    private generateAlternativePaths;
    private predictEntityCollision;
    private predictFuturePosition;
    private evaluateAccessRule;
    private getEntitiesInBounds;
    private snapToGrid;
    private calculateSpatialUtilization;
    private calculateAverageEntityDensity;
    private calculateZoneUtilization;
    private calculateMovementEfficiency;
    private needsSpatialIndexRebuild;
    private rebuildSpatialIndex;
    private rebuildOctree;
    private cleanupCollisionHistory;
    private updateMovementPatterns;
    /**
     * Cleanup on shutdown
     */
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=SpatialReasoningFramework.d.ts.map
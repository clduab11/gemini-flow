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

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
import {
  Vector3D,
  BoundingBox,
  SpatialProperties,
  SpatialRelationship,
  SpatialZone,
  AccessRule,
  SpatialRule,
  AgentSpaceEvent,
  HotspotAnalysis,
  MovementPattern,
} from "../types/AgentSpaceTypes.js";

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

export interface ResolutionAction {
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
  type:
    | "avoid_zone"
    | "avoid_entity"
    | "speed_limit"
    | "waypoint"
    | "time_window";
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
  type:
    | "nearby_entities"
    | "zone_occupancy"
    | "path_clear"
    | "collision_prediction";
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

export class SpatialReasoningFramework extends EventEmitter {
  private logger: Logger;
  private config: SpatialConfig;
  private entities: Map<string, SpatialEntity> = new Map();
  private zones: Map<string, SpatialZone> = new Map();
  private spatialIndex!: SpatialIndex;
  private collisionHistory: CollisionInfo[] = [];
  private movementHistory: MovementPattern[] = [];
  private updateTimer: NodeJS.Timeout | null = null;

  // Performance metrics
  private metrics = {
    entitiesTracked: 0,
    zonesManaged: 0,
    collisionsDetected: 0,
    pathsPlanned: 0,
    spatialQueries: 0,
    averageQueryTime: 0,
    indexRebuildCount: 0,
  };

  constructor(config: SpatialConfig) {
    super();
    this.logger = new Logger("SpatialReasoningFramework");
    this.config = config;
    this.initializeSpatialIndex();
    this.startPeriodicUpdates();

    this.logger.info("Spatial Reasoning Framework initialized", {
      dimensions: config.dimensions,
      spatialResolution: config.spatialResolution,
    });
  }

  /**
   * Register a spatial entity (agent, resource, etc.)
   */
  registerEntity(
    id: string,
    type: "agent" | "zone" | "resource" | "obstacle",
    initialProperties: SpatialProperties,
    metadata: any = {},
  ): void {
    const entity: SpatialEntity = {
      id,
      type,
      properties: initialProperties,
      metadata,
      lastUpdated: new Date(),
    };

    this.entities.set(id, entity);
    this.updateSpatialIndex(entity);
    this.metrics.entitiesTracked++;

    this.logger.debug("Entity registered", {
      id,
      type,
      position: initialProperties.coordinates,
    });

    this.emit("entity_registered", entity);
  }

  /**
   * Update entity position and properties
   */
  updateEntity(id: string, newProperties: Partial<SpatialProperties>): void {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity not found: ${id}`);
    }

    const oldPosition = { ...entity.properties.coordinates };
    entity.properties = { ...entity.properties, ...newProperties };
    entity.lastUpdated = new Date();

    // Update spatial index
    this.updateSpatialIndex(entity);

    // Track movement
    if (newProperties.coordinates) {
      this.trackMovement(entity, oldPosition, newProperties.coordinates);
    }

    // Check for collisions
    if (this.config.collisionDetectionEnabled) {
      this.checkCollisions(entity);
    }

    // Update spatial relationships
    this.updateSpatialRelationships(entity);

    this.emit("entity_updated", { entity, oldPosition });
  }

  /**
   * Remove entity from spatial tracking
   */
  unregisterEntity(id: string): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    this.entities.delete(id);
    this.removeSpatialIndex(entity);
    this.metrics.entitiesTracked--;

    this.logger.debug("Entity unregistered", { id });
    this.emit("entity_unregistered", { id, entity });
  }

  /**
   * Create or update a spatial zone
   */
  createZone(zone: SpatialZone): void {
    this.zones.set(zone.id, zone);
    this.metrics.zonesManaged++;

    this.logger.debug("Zone created", {
      id: zone.id,
      type: zone.type,
      boundaries: zone.boundaries,
    });

    this.emit("zone_created", zone);
  }

  /**
   * Query nearby entities
   */
  queryNearbyEntities(
    center: Vector3D,
    radius: number,
    entityTypes?: string[],
    includeProperties = false,
  ): SpatialEntity[] {
    const startTime = Date.now();
    const results: SpatialEntity[] = [];

    // Use spatial index for efficient querying
    const gridCells = this.getGridCellsInRadius(center, radius);
    const candidateEntities = new Set<SpatialEntity>();

    for (const gridCell of gridCells) {
      const entities = this.spatialIndex.grid.get(gridCell) || [];
      entities.forEach((entity) => candidateEntities.add(entity));
    }

    // Filter by distance and type
    for (const entity of candidateEntities) {
      const distance = this.calculateDistance(
        center,
        entity.properties.coordinates,
      );
      if (distance <= radius) {
        if (!entityTypes || entityTypes.includes(entity.type)) {
          results.push(entity);
        }
      }
    }

    // Update metrics
    const queryTime = Date.now() - startTime;
    this.metrics.spatialQueries++;
    this.metrics.averageQueryTime =
      (this.metrics.averageQueryTime + queryTime) / 2;

    return results;
  }

  /**
   * Calculate spatial relationships between entities
   */
  calculateSpatialRelationships(entityId: string): SpatialRelationship[] {
    const entity = this.entities.get(entityId);
    if (!entity) return [];

    const relationships: SpatialRelationship[] = [];
    const nearbyEntities = this.queryNearbyEntities(
      entity.properties.coordinates,
      this.config.maxTrackingDistance,
      ["agent", "resource"],
    );

    for (const nearby of nearbyEntities) {
      if (nearby.id === entityId) continue;

      const distance = this.calculateDistance(
        entity.properties.coordinates,
        nearby.properties.coordinates,
      );

      const relationship: SpatialRelationship = {
        targetId: nearby.id,
        type: this.determineRelationshipType(entity, nearby, distance),
        distance,
        strength: this.calculateRelationshipStrength(entity, nearby, distance),
        lastUpdated: new Date(),
      };

      relationships.push(relationship);
    }

    return relationships;
  }

  /**
   * Plan path between two points
   */
  async planPath(request: PathPlanningRequest): Promise<PlannedPath> {
    if (!this.config.pathPlanningEnabled) {
      throw new Error("Path planning is disabled");
    }

    const startTime = Date.now();

    try {
      // A* pathfinding algorithm
      const path = await this.aStarPathfinding(
        request.startPosition,
        request.targetPosition,
        request.constraints ?? [],
      );

      const plannedPath: PlannedPath = {
        waypoints: path,
        estimatedTime: this.estimatePathTime(path),
        energyCost: this.calculatePathEnergyCost(path),
        riskLevel: this.assessPathRisk(path, request.constraints ?? []),
        alternativePaths: await this.generateAlternativePaths(request, 2),
      };

      this.metrics.pathsPlanned++;

      this.logger.debug("Path planned", {
        entityId: request.entityId,
        waypoints: plannedPath.waypoints.length,
        estimatedTime: plannedPath.estimatedTime,
        energyCost: plannedPath.energyCost,
      });

      return plannedPath;
    } catch (error) {
      this.logger.error("Path planning failed", {
        entityId: request.entityId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Predict potential collisions
   */
  predictCollisions(timeWindow: number = 5000): CollisionInfo[] {
    const predictions: CollisionInfo[] = [];
    const entities = Array.from(this.entities.values()).filter(
      (e) => e.type === "agent",
    );

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const collision = this.predictEntityCollision(
          entities[i],
          entities[j],
          timeWindow,
        );
        if (collision) {
          predictions.push(collision);
        }
      }
    }

    return predictions.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  /**
   * Check zone access permissions
   */
  checkZoneAccess(agentId: string, zoneId: string): boolean {
    const zone = this.zones.get(zoneId);
    if (!zone) return false;

    const agent = this.entities.get(agentId);
    if (!agent || agent.type !== "agent") return false;

    // Check access rules
    for (const rule of zone.accessRules) {
      if (this.evaluateAccessRule(rule, agent)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get zone occupancy information
   */
  getZoneOccupancy(zoneId: string): {
    zone: SpatialZone;
    occupants: SpatialEntity[];
    utilizationRate: number;
  } {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    const occupants = this.getEntitiesInBounds(zone.boundaries);
    const utilizationRate = occupants.length / zone.capacity;

    return {
      zone,
      occupants,
      utilizationRate,
    };
  }

  /**
   * Analyze spatial hotspots
   */
  analyzeHotspots(timeWindow: number = 3600000): HotspotAnalysis[] {
    const gridSize = this.config.spatialResolution;
    const hotspots = new Map<
      string,
      {
        location: Vector3D;
        activity: number;
        agents: Set<string>;
        duration: number;
      }
    >();

    // Analyze movement history within time window
    const now = Date.now();
    const relevantMovements = this.movementHistory.filter(
      (pattern) => now - pattern.efficiency < timeWindow, // Using efficiency as timestamp for simplicity
    );

    // Grid-based activity analysis
    for (const movement of relevantMovements) {
      for (const point of movement.path) {
        const gridKey = this.getGridKey(point, gridSize);

        if (!hotspots.has(gridKey)) {
          hotspots.set(gridKey, {
            location: this.snapToGrid(point, gridSize),
            activity: 0,
            agents: new Set(),
            duration: 0,
          });
        }

        const hotspot = hotspots.get(gridKey)!;
        hotspot.activity += movement.frequency;
        hotspot.agents.add(movement.agentId);
        hotspot.duration += 1000; // Simplified duration calculation
      }
    }

    // Convert to analysis format
    return Array.from(hotspots.values())
      .filter((hotspot) => hotspot.activity > 5) // Threshold for significance
      .map((hotspot) => ({
        location: hotspot.location,
        activity: hotspot.activity,
        agents: Array.from(hotspot.agents),
        duration: hotspot.duration,
      }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 20); // Top 20 hotspots
  }

  /**
   * Get comprehensive spatial metrics
   */
  getSpatialMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date(),
      spatialUtilization: this.calculateSpatialUtilization(),
      averageEntityDensity: this.calculateAverageEntityDensity(),
      zoneUtilization: this.calculateZoneUtilization(),
      movementEfficiency: this.calculateMovementEfficiency(),
    };
  }

  /**
   * Private helper methods
   */

  private initializeSpatialIndex(): void {
    this.spatialIndex = {
      grid: new Map(),
      spatialHashes: new Map(),
      lastRebuild: new Date(),
    };

    // Build octree if enabled
    if (this.config.spatialIndexingEnabled) {
      this.rebuildOctree();
    }
  }

  private startPeriodicUpdates(): void {
    this.updateTimer = setInterval(() => {
      this.performPeriodicMaintenance();
    }, 5000); // Every 5 seconds
  }

  private performPeriodicMaintenance(): void {
    // Rebuild spatial index if needed
    if (this.needsSpatialIndexRebuild()) {
      this.rebuildSpatialIndex();
    }

    // Clean old collision history
    this.cleanupCollisionHistory();

    // Update movement patterns
    this.updateMovementPatterns();
  }

  private updateSpatialIndex(entity: SpatialEntity): void {
    const gridKey = this.getGridKey(
      entity.properties.coordinates,
      this.config.spatialResolution,
    );

    // Remove from old grid cell
    const oldGridKey = this.spatialIndex.spatialHashes.get(entity.id);
    if (oldGridKey && oldGridKey !== gridKey) {
      const oldEntities = this.spatialIndex.grid.get(oldGridKey) || [];
      const index = oldEntities.indexOf(entity);
      if (index > -1) {
        oldEntities.splice(index, 1);
      }
    }

    // Add to new grid cell
    if (!this.spatialIndex.grid.has(gridKey)) {
      this.spatialIndex.grid.set(gridKey, []);
    }

    const entities = this.spatialIndex.grid.get(gridKey)!;
    if (!entities.includes(entity)) {
      entities.push(entity);
    }

    this.spatialIndex.spatialHashes.set(entity.id, gridKey);
  }

  private removeSpatialIndex(entity: SpatialEntity): void {
    const gridKey = this.spatialIndex.spatialHashes.get(entity.id);
    if (gridKey) {
      const entities = this.spatialIndex.grid.get(gridKey) || [];
      const index = entities.indexOf(entity);
      if (index > -1) {
        entities.splice(index, 1);
      }
      this.spatialIndex.spatialHashes.delete(entity.id);
    }
  }

  private getGridKey(position: Vector3D, gridSize: number): string {
    const x = Math.floor(position.x / gridSize);
    const y = Math.floor(position.y / gridSize);
    const z = Math.floor(position.z / gridSize);
    return `${x},${y},${z}`;
  }

  private getGridCellsInRadius(center: Vector3D, radius: number): string[] {
    const gridSize = this.config.spatialResolution;
    const cells: string[] = [];
    const gridRadius = Math.ceil(radius / gridSize);

    const centerX = Math.floor(center.x / gridSize);
    const centerY = Math.floor(center.y / gridSize);
    const centerZ = Math.floor(center.z / gridSize);

    for (let x = centerX - gridRadius; x <= centerX + gridRadius; x++) {
      for (let y = centerY - gridRadius; y <= centerY + gridRadius; y++) {
        for (let z = centerZ - gridRadius; z <= centerZ + gridRadius; z++) {
          cells.push(`${x},${y},${z}`);
        }
      }
    }

    return cells;
  }

  private calculateDistance(pos1: Vector3D, pos2: Vector3D): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private trackMovement(
    entity: SpatialEntity,
    oldPosition: Vector3D,
    newPosition: Vector3D,
  ): void {
    const distance = this.calculateDistance(oldPosition, newPosition);

    if (distance > 0.1) {
      // Minimum movement threshold
      const existingPattern = this.movementHistory.find(
        (p) => p.agentId === entity.id,
      );

      if (existingPattern) {
        existingPattern.path.push(newPosition);
        existingPattern.frequency++;
        existingPattern.efficiency = this.calculateMovementEfficiency();

        // Keep path history manageable
        if (existingPattern.path.length > 100) {
          existingPattern.path.splice(0, 50);
        }
      } else {
        this.movementHistory.push({
          agentId: entity.id,
          path: [oldPosition, newPosition],
          frequency: 1,
          efficiency: 1.0,
        });
      }
    }
  }

  private checkCollisions(entity: SpatialEntity): void {
    const nearby = this.queryNearbyEntities(
      entity.properties.coordinates,
      entity.properties.boundingBox.volume,
      undefined,
      true,
    );

    for (const other of nearby) {
      if (other.id === entity.id) continue;

      if (
        this.checkBoundingBoxIntersection(
          entity.properties.boundingBox,
          other.properties.boundingBox,
        )
      ) {
        const collision = this.createCollisionInfo(entity, other);
        this.handleCollision(collision);
      }
    }
  }

  private checkBoundingBoxIntersection(
    box1: BoundingBox,
    box2: BoundingBox,
  ): boolean {
    return (
      box1.min.x <= box2.max.x &&
      box1.max.x >= box2.min.x &&
      box1.min.y <= box2.max.y &&
      box1.max.y >= box2.min.y &&
      box1.min.z <= box2.max.z &&
      box1.max.z >= box2.min.z
    );
  }

  private createCollisionInfo(
    entity1: SpatialEntity,
    entity2: SpatialEntity,
  ): CollisionInfo {
    const intersectionVolume = this.calculateIntersectionVolume(
      entity1.properties.boundingBox,
      entity2.properties.boundingBox,
    );

    return {
      entity1: entity1.id,
      entity2: entity2.id,
      intersectionVolume,
      severity: this.determineSeverity(intersectionVolume),
      timestamp: new Date(),
    };
  }

  private calculateIntersectionVolume(
    box1: BoundingBox,
    box2: BoundingBox,
  ): number {
    const overlapX = Math.max(
      0,
      Math.min(box1.max.x, box2.max.x) - Math.max(box1.min.x, box2.min.x),
    );
    const overlapY = Math.max(
      0,
      Math.min(box1.max.y, box2.max.y) - Math.max(box1.min.y, box2.min.y),
    );
    const overlapZ = Math.max(
      0,
      Math.min(box1.max.z, box2.max.z) - Math.max(box1.min.z, box2.min.z),
    );

    return overlapX * overlapY * overlapZ;
  }

  private determineSeverity(
    volume: number,
  ): "low" | "medium" | "high" | "critical" {
    if (volume < 10) return "low";
    if (volume < 100) return "medium";
    if (volume < 1000) return "high";
    return "critical";
  }

  private handleCollision(collision: CollisionInfo): void {
    this.collisionHistory.push(collision);
    this.metrics.collisionsDetected++;

    this.logger.warn("Collision detected", {
      entity1: collision.entity1,
      entity2: collision.entity2,
      severity: collision.severity,
      volume: collision.intersectionVolume,
    });

    this.emit("spatial_collision", {
      id: `evt_${Date.now()}`,
      type: "spatial_collision",
      source: "spatial_framework",
      timestamp: new Date(),
      data: collision,
      severity: collision.severity === "critical" ? "critical" : "warning",
    } as AgentSpaceEvent);
  }

  // Additional helper methods would continue here...
  // For brevity, showing the structure and key methods

  private updateSpatialRelationships(entity: SpatialEntity): void {
    entity.properties.spatialRelationships = this.calculateSpatialRelationships(
      entity.id,
    );
  }

  private determineRelationshipType(
    entity1: SpatialEntity,
    entity2: SpatialEntity,
    distance: number,
  ): "adjacent" | "contained" | "overlapping" | "distant" | "collaborative" {
    if (distance < 5) return "adjacent";
    if (distance < 20) return "collaborative";
    return "distant";
  }

  private calculateRelationshipStrength(
    entity1: SpatialEntity,
    entity2: SpatialEntity,
    distance: number,
  ): number {
    return Math.max(0, 1 - distance / this.config.maxTrackingDistance);
  }

  private async aStarPathfinding(
    start: Vector3D,
    goal: Vector3D,
    constraints: PathConstraint[],
  ): Promise<Vector3D[]> {
    // Simplified A* implementation
    // In production, this would be a full pathfinding algorithm
    return [start, goal];
  }

  private estimatePathTime(path: Vector3D[]): number {
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      totalDistance += this.calculateDistance(path[i - 1], path[i]);
    }
    return totalDistance / 5; // Assuming speed of 5 units per second
  }

  private calculatePathEnergyCost(path: Vector3D[]): number {
    return this.estimatePathTime(path) * 0.1; // Simplified energy calculation
  }

  private assessPathRisk(
    path: Vector3D[],
    constraints: PathConstraint[],
  ): number {
    // Analyze path through obstacles, dangerous zones, etc.
    return Math.random(); // Simplified risk assessment
  }

  private async generateAlternativePaths(
    request: PathPlanningRequest,
    count: number,
  ): Promise<PlannedPath[]> {
    // Generate alternative routes
    return [];
  }

  private predictEntityCollision(
    entity1: SpatialEntity,
    entity2: SpatialEntity,
    timeWindow: number,
  ): CollisionInfo | null {
    // Predict future collision based on current velocities
    const futurePos1 = this.predictFuturePosition(entity1, timeWindow);
    const futurePos2 = this.predictFuturePosition(entity2, timeWindow);

    const distance = this.calculateDistance(futurePos1, futurePos2);
    if (distance < 10) {
      // Collision threshold
      return {
        entity1: entity1.id,
        entity2: entity2.id,
        intersectionVolume: 100 - distance * 10,
        severity: "medium",
        timestamp: new Date(Date.now() + timeWindow),
      };
    }

    return null;
  }

  private predictFuturePosition(
    entity: SpatialEntity,
    timeMs: number,
  ): Vector3D {
    const timeSeconds = timeMs / 1000;
    return {
      x:
        entity.properties.coordinates.x +
        entity.properties.velocity.x * timeSeconds,
      y:
        entity.properties.coordinates.y +
        entity.properties.velocity.y * timeSeconds,
      z:
        entity.properties.coordinates.z +
        entity.properties.velocity.z * timeSeconds,
    };
  }

  private evaluateAccessRule(rule: AccessRule, agent: SpatialEntity): boolean {
    if (rule.agentId && !rule.agentId.includes(agent.id)) return false;
    if (rule.agentType && !rule.agentType.includes(agent.type)) return false;
    // Additional rule evaluations...
    return true;
  }

  private getEntitiesInBounds(bounds: BoundingBox): SpatialEntity[] {
    return Array.from(this.entities.values()).filter((entity) => {
      const pos = entity.properties.coordinates;
      return (
        pos.x >= bounds.min.x &&
        pos.x <= bounds.max.x &&
        pos.y >= bounds.min.y &&
        pos.y <= bounds.max.y &&
        pos.z >= bounds.min.z &&
        pos.z <= bounds.max.z
      );
    });
  }

  private snapToGrid(point: Vector3D, gridSize: number): Vector3D {
    return {
      x: Math.floor(point.x / gridSize) * gridSize + gridSize / 2,
      y: Math.floor(point.y / gridSize) * gridSize + gridSize / 2,
      z: Math.floor(point.z / gridSize) * gridSize + gridSize / 2,
    };
  }

  private calculateSpatialUtilization(): number {
    const totalVolume =
      this.config.dimensions.x *
      this.config.dimensions.y *
      this.config.dimensions.z;
    const occupiedVolume = Array.from(this.entities.values()).reduce(
      (sum, entity) => sum + entity.properties.boundingBox.volume,
      0,
    );

    return occupiedVolume / totalVolume;
  }

  private calculateAverageEntityDensity(): number {
    if (this.entities.size === 0) return 0;

    const totalVolume =
      this.config.dimensions.x *
      this.config.dimensions.y *
      this.config.dimensions.z;
    return this.entities.size / totalVolume;
  }

  private calculateZoneUtilization(): number {
    if (this.zones.size === 0) return 0;

    let totalUtilization = 0;
    for (const zone of this.zones.values()) {
      const occupants = this.getEntitiesInBounds(zone.boundaries);
      totalUtilization += occupants.length / zone.capacity;
    }

    return totalUtilization / this.zones.size;
  }

  private calculateMovementEfficiency(): number {
    if (this.movementHistory.length === 0) return 1.0;

    const totalEfficiency = this.movementHistory.reduce(
      (sum, pattern) => sum + pattern.efficiency,
      0,
    );
    return totalEfficiency / this.movementHistory.length;
  }

  private needsSpatialIndexRebuild(): boolean {
    return Date.now() - this.spatialIndex.lastRebuild.getTime() > 60000; // Every minute
  }

  private rebuildSpatialIndex(): void {
    this.spatialIndex.grid.clear();
    this.spatialIndex.spatialHashes.clear();

    for (const entity of this.entities.values()) {
      this.updateSpatialIndex(entity);
    }

    this.spatialIndex.lastRebuild = new Date();
    this.metrics.indexRebuildCount++;
  }

  private rebuildOctree(): void {
    // Build octree for efficient spatial queries
    // Implementation would create hierarchical spatial subdivision
  }

  private cleanupCollisionHistory(): void {
    const cutoffTime = Date.now() - 3600000; // Keep 1 hour of history
    this.collisionHistory = this.collisionHistory.filter(
      (collision) => collision.timestamp.getTime() > cutoffTime,
    );
  }

  private updateMovementPatterns(): void {
    const cutoffTime = Date.now() - 1800000; // Keep 30 minutes of patterns
    this.movementHistory = this.movementHistory.filter(
      (pattern) => pattern.efficiency > cutoffTime, // Using efficiency field for timestamp
    );
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.entities.clear();
    this.zones.clear();
    this.collisionHistory.length = 0;
    this.movementHistory.length = 0;

    this.logger.info("Spatial Reasoning Framework shutdown complete");
  }
}

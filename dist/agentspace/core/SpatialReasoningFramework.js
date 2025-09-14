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
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
export class SpatialReasoningFramework extends EventEmitter {
    logger;
    config;
    entities = new Map();
    zones = new Map();
    spatialIndex;
    collisionHistory = [];
    movementHistory = [];
    updateTimer = null;
    // Performance metrics
    metrics = {
        entitiesTracked: 0,
        zonesManaged: 0,
        collisionsDetected: 0,
        pathsPlanned: 0,
        spatialQueries: 0,
        averageQueryTime: 0,
        indexRebuildCount: 0,
    };
    constructor(config) {
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
    registerEntity(id, type, initialProperties, metadata = {}) {
        const entity = {
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
    updateEntity(id, newProperties) {
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
    unregisterEntity(id) {
        const entity = this.entities.get(id);
        if (!entity)
            return;
        this.entities.delete(id);
        this.removeSpatialIndex(entity);
        this.metrics.entitiesTracked--;
        this.logger.debug("Entity unregistered", { id });
        this.emit("entity_unregistered", { id, entity });
    }
    /**
     * Create or update a spatial zone
     */
    createZone(zone) {
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
    queryNearbyEntities(center, radius, entityTypes, includeProperties = false) {
        const startTime = Date.now();
        const results = [];
        // Use spatial index for efficient querying
        const gridCells = this.getGridCellsInRadius(center, radius);
        const candidateEntities = new Set();
        for (const gridCell of gridCells) {
            const entities = this.spatialIndex.grid.get(gridCell) || [];
            entities.forEach((entity) => candidateEntities.add(entity));
        }
        // Filter by distance and type
        for (const entity of candidateEntities) {
            const distance = this.calculateDistance(center, entity.properties.coordinates);
            if (distance <= radius) {
                if (!entityTypes || entityTypes.includes(entity.type)) {
                    results.push(includeProperties ? entity : { ...entity, properties: null });
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
    calculateSpatialRelationships(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity)
            return [];
        const relationships = [];
        const nearbyEntities = this.queryNearbyEntities(entity.properties.coordinates, this.config.maxTrackingDistance, ["agent", "resource"]);
        for (const nearby of nearbyEntities) {
            if (nearby.id === entityId)
                continue;
            const distance = this.calculateDistance(entity.properties.coordinates, nearby.properties.coordinates);
            const relationship = {
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
    async planPath(request) {
        if (!this.config.pathPlanningEnabled) {
            throw new Error("Path planning is disabled");
        }
        const startTime = Date.now();
        try {
            // A* pathfinding algorithm
            const path = await this.aStarPathfinding(request.startPosition, request.targetPosition, request.constraints || []);
            const plannedPath = {
                waypoints: path,
                estimatedTime: this.estimatePathTime(path),
                energyCost: this.calculatePathEnergyCost(path),
                riskLevel: this.assessPathRisk(path, request.constraints),
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
        }
        catch (error) {
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
    predictCollisions(timeWindow = 5000) {
        const predictions = [];
        const entities = Array.from(this.entities.values()).filter((e) => e.type === "agent");
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const collision = this.predictEntityCollision(entities[i], entities[j], timeWindow);
                if (collision) {
                    predictions.push(collision);
                }
            }
        }
        return predictions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Check zone access permissions
     */
    checkZoneAccess(agentId, zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone)
            return false;
        const agent = this.entities.get(agentId);
        if (!agent || agent.type !== "agent")
            return false;
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
    getZoneOccupancy(zoneId) {
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
    analyzeHotspots(timeWindow = 3600000) {
        const gridSize = this.config.spatialResolution;
        const hotspots = new Map();
        // Analyze movement history within time window
        const now = Date.now();
        const relevantMovements = this.movementHistory.filter((pattern) => now - pattern.efficiency < timeWindow);
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
                const hotspot = hotspots.get(gridKey);
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
    initializeSpatialIndex() {
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
    startPeriodicUpdates() {
        this.updateTimer = setInterval(() => {
            this.performPeriodicMaintenance();
        }, 5000); // Every 5 seconds
    }
    performPeriodicMaintenance() {
        // Rebuild spatial index if needed
        if (this.needsSpatialIndexRebuild()) {
            this.rebuildSpatialIndex();
        }
        // Clean old collision history
        this.cleanupCollisionHistory();
        // Update movement patterns
        this.updateMovementPatterns();
    }
    updateSpatialIndex(entity) {
        const gridKey = this.getGridKey(entity.properties.coordinates, this.config.spatialResolution);
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
        const entities = this.spatialIndex.grid.get(gridKey);
        if (!entities.includes(entity)) {
            entities.push(entity);
        }
        this.spatialIndex.spatialHashes.set(entity.id, gridKey);
    }
    removeSpatialIndex(entity) {
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
    getGridKey(position, gridSize) {
        const x = Math.floor(position.x / gridSize);
        const y = Math.floor(position.y / gridSize);
        const z = Math.floor(position.z / gridSize);
        return `${x},${y},${z}`;
    }
    getGridCellsInRadius(center, radius) {
        const gridSize = this.config.spatialResolution;
        const cells = [];
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
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    trackMovement(entity, oldPosition, newPosition) {
        const distance = this.calculateDistance(oldPosition, newPosition);
        if (distance > 0.1) {
            // Minimum movement threshold
            const existingPattern = this.movementHistory.find((p) => p.agentId === entity.id);
            if (existingPattern) {
                existingPattern.path.push(newPosition);
                existingPattern.frequency++;
                existingPattern.efficiency = this.calculateMovementEfficiency();
                // Keep path history manageable
                if (existingPattern.path.length > 100) {
                    existingPattern.path.splice(0, 50);
                }
            }
            else {
                this.movementHistory.push({
                    agentId: entity.id,
                    path: [oldPosition, newPosition],
                    frequency: 1,
                    efficiency: 1.0,
                });
            }
        }
    }
    checkCollisions(entity) {
        const nearby = this.queryNearbyEntities(entity.properties.coordinates, entity.properties.boundingBox.volume, undefined, true);
        for (const other of nearby) {
            if (other.id === entity.id)
                continue;
            if (this.checkBoundingBoxIntersection(entity.properties.boundingBox, other.properties.boundingBox)) {
                const collision = this.createCollisionInfo(entity, other);
                this.handleCollision(collision);
            }
        }
    }
    checkBoundingBoxIntersection(box1, box2) {
        return (box1.min.x <= box2.max.x &&
            box1.max.x >= box2.min.x &&
            box1.min.y <= box2.max.y &&
            box1.max.y >= box2.min.y &&
            box1.min.z <= box2.max.z &&
            box1.max.z >= box2.min.z);
    }
    createCollisionInfo(entity1, entity2) {
        const intersectionVolume = this.calculateIntersectionVolume(entity1.properties.boundingBox, entity2.properties.boundingBox);
        return {
            entity1: entity1.id,
            entity2: entity2.id,
            intersectionVolume,
            severity: this.determineSeverity(intersectionVolume),
            timestamp: new Date(),
        };
    }
    calculateIntersectionVolume(box1, box2) {
        const overlapX = Math.max(0, Math.min(box1.max.x, box2.max.x) - Math.max(box1.min.x, box2.min.x));
        const overlapY = Math.max(0, Math.min(box1.max.y, box2.max.y) - Math.max(box1.min.y, box2.min.y));
        const overlapZ = Math.max(0, Math.min(box1.max.z, box2.max.z) - Math.max(box1.min.z, box2.min.z));
        return overlapX * overlapY * overlapZ;
    }
    determineSeverity(volume) {
        if (volume < 10)
            return "low";
        if (volume < 100)
            return "medium";
        if (volume < 1000)
            return "high";
        return "critical";
    }
    handleCollision(collision) {
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
        });
    }
    // Additional helper methods would continue here...
    // For brevity, showing the structure and key methods
    updateSpatialRelationships(entity) {
        entity.properties.spatialRelationships = this.calculateSpatialRelationships(entity.id);
    }
    determineRelationshipType(entity1, entity2, distance) {
        if (distance < 5)
            return "adjacent";
        if (distance < 20)
            return "collaborative";
        return "distant";
    }
    calculateRelationshipStrength(entity1, entity2, distance) {
        return Math.max(0, 1 - distance / this.config.maxTrackingDistance);
    }
    async aStarPathfinding(start, goal, constraints) {
        // Simplified A* implementation
        // In production, this would be a full pathfinding algorithm
        return [start, goal];
    }
    estimatePathTime(path) {
        let totalDistance = 0;
        for (let i = 1; i < path.length; i++) {
            totalDistance += this.calculateDistance(path[i - 1], path[i]);
        }
        return totalDistance / 5; // Assuming speed of 5 units per second
    }
    calculatePathEnergyCost(path) {
        return this.estimatePathTime(path) * 0.1; // Simplified energy calculation
    }
    assessPathRisk(path, constraints) {
        // Analyze path through obstacles, dangerous zones, etc.
        return Math.random(); // Simplified risk assessment
    }
    async generateAlternativePaths(request, count) {
        // Generate alternative routes
        return [];
    }
    predictEntityCollision(entity1, entity2, timeWindow) {
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
    predictFuturePosition(entity, timeMs) {
        const timeSeconds = timeMs / 1000;
        return {
            x: entity.properties.coordinates.x +
                entity.properties.velocity.x * timeSeconds,
            y: entity.properties.coordinates.y +
                entity.properties.velocity.y * timeSeconds,
            z: entity.properties.coordinates.z +
                entity.properties.velocity.z * timeSeconds,
        };
    }
    evaluateAccessRule(rule, agent) {
        if (rule.agentId && !rule.agentId.includes(agent.id))
            return false;
        if (rule.agentType && !rule.agentType.includes(agent.type))
            return false;
        // Additional rule evaluations...
        return true;
    }
    getEntitiesInBounds(bounds) {
        return Array.from(this.entities.values()).filter((entity) => {
            const pos = entity.properties.coordinates;
            return (pos.x >= bounds.min.x &&
                pos.x <= bounds.max.x &&
                pos.y >= bounds.min.y &&
                pos.y <= bounds.max.y &&
                pos.z >= bounds.min.z &&
                pos.z <= bounds.max.z);
        });
    }
    snapToGrid(point, gridSize) {
        return {
            x: Math.floor(point.x / gridSize) * gridSize + gridSize / 2,
            y: Math.floor(point.y / gridSize) * gridSize + gridSize / 2,
            z: Math.floor(point.z / gridSize) * gridSize + gridSize / 2,
        };
    }
    calculateSpatialUtilization() {
        const totalVolume = this.config.dimensions.x *
            this.config.dimensions.y *
            this.config.dimensions.z;
        const occupiedVolume = Array.from(this.entities.values()).reduce((sum, entity) => sum + entity.properties.boundingBox.volume, 0);
        return occupiedVolume / totalVolume;
    }
    calculateAverageEntityDensity() {
        if (this.entities.size === 0)
            return 0;
        const totalVolume = this.config.dimensions.x *
            this.config.dimensions.y *
            this.config.dimensions.z;
        return this.entities.size / totalVolume;
    }
    calculateZoneUtilization() {
        if (this.zones.size === 0)
            return 0;
        let totalUtilization = 0;
        for (const zone of this.zones.values()) {
            const occupants = this.getEntitiesInBounds(zone.boundaries);
            totalUtilization += occupants.length / zone.capacity;
        }
        return totalUtilization / this.zones.size;
    }
    calculateMovementEfficiency() {
        if (this.movementHistory.length === 0)
            return 1.0;
        const totalEfficiency = this.movementHistory.reduce((sum, pattern) => sum + pattern.efficiency, 0);
        return totalEfficiency / this.movementHistory.length;
    }
    needsSpatialIndexRebuild() {
        return Date.now() - this.spatialIndex.lastRebuild.getTime() > 60000; // Every minute
    }
    rebuildSpatialIndex() {
        this.spatialIndex.grid.clear();
        this.spatialIndex.spatialHashes.clear();
        for (const entity of this.entities.values()) {
            this.updateSpatialIndex(entity);
        }
        this.spatialIndex.lastRebuild = new Date();
        this.metrics.indexRebuildCount++;
    }
    rebuildOctree() {
        // Build octree for efficient spatial queries
        // Implementation would create hierarchical spatial subdivision
    }
    cleanupCollisionHistory() {
        const cutoffTime = Date.now() - 3600000; // Keep 1 hour of history
        this.collisionHistory = this.collisionHistory.filter((collision) => collision.timestamp.getTime() > cutoffTime);
    }
    updateMovementPatterns() {
        const cutoffTime = Date.now() - 1800000; // Keep 30 minutes of patterns
        this.movementHistory = this.movementHistory.filter((pattern) => pattern.efficiency > cutoffTime);
    }
    /**
     * Cleanup on shutdown
     */
    async shutdown() {
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

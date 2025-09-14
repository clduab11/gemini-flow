/**
 * CRDT-Based State Synchronization for A2A Memory Coordination
 *
 * Implements Conflict-free Replicated Data Types for eventual consistency:
 * - G-Counter (Grow-only Counter)
 * - PN-Counter (Positive-Negative Counter)
 * - G-Set (Grow-only Set)
 * - OR-Set (Observed-Remove Set)
 * - LWW-Register (Last-Writer-Wins Register)
 * - Multi-Value Register with vector clocks
 * - CRDT-based Maps and Arrays
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { VectorClock } from "./vector-clocks.js";
/**
 * G-Counter: Grow-only Counter CRDT
 */
class GCounter {
    type = "g-counter";
    id;
    value = new Map();
    vectorClock;
    metadata;
    constructor(id, agentId) {
        this.id = id;
        this.vectorClock = new VectorClock(agentId);
        this.metadata = {
            agentId,
            timestamp: new Date(),
            version: 1,
        };
    }
    increment(agentId, amount = 1) {
        const current = this.value.get(agentId) || 0;
        this.value.set(agentId, current + amount);
        this.vectorClock.increment();
        this.metadata.timestamp = new Date();
        this.metadata.version++;
    }
    getValue() {
        return Array.from(this.value.values()).reduce((sum, val) => sum + val, 0);
    }
    merge(other) {
        const merged = new GCounter(this.id, this.metadata.agentId);
        merged.vectorClock = this.vectorClock.merge(other.vectorClock);
        // Merge by taking maximum for each agent
        const allAgents = new Set([...this.value.keys(), ...other.value.keys()]);
        for (const agentId of allAgents) {
            const thisValue = this.value.get(agentId) || 0;
            const otherValue = other.value.get(agentId) || 0;
            merged.value.set(agentId, Math.max(thisValue, otherValue));
        }
        merged.metadata.timestamp = new Date();
        merged.metadata.version =
            Math.max(this.metadata.version, other.metadata.version) + 1;
        return merged;
    }
}
/**
 * PN-Counter: Positive-Negative Counter CRDT
 */
class PNCounter {
    type = "pn-counter";
    id;
    value;
    vectorClock;
    metadata;
    constructor(id, agentId) {
        this.id = id;
        this.value = {
            positive: new GCounter(`${id}_pos`, agentId),
            negative: new GCounter(`${id}_neg`, agentId),
        };
        this.vectorClock = new VectorClock(agentId);
        this.metadata = {
            agentId,
            timestamp: new Date(),
            version: 1,
        };
    }
    increment(agentId, amount = 1) {
        this.value.positive.increment(agentId, amount);
        this.vectorClock.increment();
        this.updateMetadata();
    }
    decrement(agentId, amount = 1) {
        this.value.negative.increment(agentId, amount);
        this.vectorClock.increment();
        this.updateMetadata();
    }
    getValue() {
        return this.value.positive.getValue() - this.value.negative.getValue();
    }
    merge(other) {
        const merged = new PNCounter(this.id, this.metadata.agentId);
        merged.value.positive = this.value.positive.merge(other.value.positive);
        merged.value.negative = this.value.negative.merge(other.value.negative);
        merged.vectorClock = this.vectorClock.merge(other.vectorClock);
        merged.metadata.timestamp = new Date();
        merged.metadata.version =
            Math.max(this.metadata.version, other.metadata.version) + 1;
        return merged;
    }
    updateMetadata() {
        this.metadata.timestamp = new Date();
        this.metadata.version++;
    }
}
/**
 * OR-Set: Observed-Remove Set CRDT
 */
class ORSet {
    type = "or-set";
    id;
    value;
    vectorClock;
    metadata;
    constructor(id, agentId) {
        this.id = id;
        this.value = {
            elements: new Map(),
            removed: new Set(),
        };
        this.vectorClock = new VectorClock(agentId);
        this.metadata = {
            agentId,
            timestamp: new Date(),
            version: 1,
        };
    }
    add(element, agentId) {
        const tag = `${agentId}_${Date.now()}_${Math.random()}`;
        if (!this.value.elements.has(element)) {
            this.value.elements.set(element, new Set());
        }
        this.value.elements.get(element).add(tag);
        this.vectorClock.increment();
        this.updateMetadata();
        return tag;
    }
    remove(element) {
        const tags = this.value.elements.get(element);
        if (tags) {
            // Mark all tags as removed
            for (const tag of tags) {
                this.value.removed.add(tag);
            }
        }
        this.vectorClock.increment();
        this.updateMetadata();
    }
    contains(element) {
        const tags = this.value.elements.get(element);
        if (!tags || tags.size === 0)
            return false;
        // Element exists if any tag is not removed
        for (const tag of tags) {
            if (!this.value.removed.has(tag)) {
                return true;
            }
        }
        return false;
    }
    getElements() {
        const result = new Set();
        for (const [element, tags] of this.value.elements) {
            if (this.contains(element)) {
                result.add(element);
            }
        }
        return result;
    }
    merge(other) {
        const merged = new ORSet(this.id, this.metadata.agentId);
        merged.vectorClock = this.vectorClock.merge(other.vectorClock);
        // Merge elements (union of all tags)
        const allElements = new Set([
            ...this.value.elements.keys(),
            ...other.value.elements.keys(),
        ]);
        for (const element of allElements) {
            const thisTags = this.value.elements.get(element) || new Set();
            const otherTags = other.value.elements.get(element) || new Set();
            const mergedTags = new Set([...thisTags, ...otherTags]);
            merged.value.elements.set(element, mergedTags);
        }
        // Merge removed tags (union)
        merged.value.removed = new Set([
            ...this.value.removed,
            ...other.value.removed,
        ]);
        merged.updateMetadata();
        return merged;
    }
    updateMetadata() {
        this.metadata.timestamp = new Date();
        this.metadata.version++;
    }
}
/**
 * LWW-Register: Last-Writer-Wins Register CRDT
 */
class LWWRegister {
    type = "lww-register";
    id;
    value;
    vectorClock;
    metadata;
    constructor(id, agentId, initialValue) {
        this.id = id;
        this.value = {
            data: initialValue,
            timestamp: Date.now(),
            agentId,
        };
        this.vectorClock = new VectorClock(agentId);
        this.metadata = {
            agentId,
            timestamp: new Date(),
            version: 1,
        };
    }
    set(value, agentId) {
        this.value = {
            data: value,
            timestamp: Date.now(),
            agentId,
        };
        this.vectorClock.increment();
        this.updateMetadata();
    }
    get() {
        return this.value.data;
    }
    merge(other) {
        const merged = new LWWRegister(this.id, this.metadata.agentId);
        merged.vectorClock = this.vectorClock.merge(other.vectorClock);
        // Choose value with latest timestamp (LWW semantics)
        if (this.value.timestamp > other.value.timestamp) {
            merged.value = { ...this.value };
        }
        else if (this.value.timestamp < other.value.timestamp) {
            merged.value = { ...other.value };
        }
        else {
            // Tie-breaking by agent ID (deterministic)
            merged.value =
                this.value.agentId > other.value.agentId
                    ? { ...this.value }
                    : { ...other.value };
        }
        merged.updateMetadata();
        return merged;
    }
    updateMetadata() {
        this.metadata.timestamp = new Date();
        this.metadata.version++;
    }
}
/**
 * Multi-Value Register with Vector Clocks
 */
class MVRegister {
    type = "mv-register";
    id;
    value;
    vectorClock;
    metadata;
    constructor(id, agentId) {
        this.id = id;
        this.value = new Map();
        this.vectorClock = new VectorClock(agentId);
        this.metadata = {
            agentId,
            timestamp: new Date(),
            version: 1,
        };
    }
    set(value, agentId) {
        const agentClock = new VectorClock(agentId);
        agentClock.increment();
        this.value.set(agentId, {
            data: value,
            vectorClock: agentClock,
        });
        this.vectorClock.increment();
        this.updateMetadata();
    }
    get() {
        return Array.from(this.value.values()).map((v) => v.data);
    }
    getConcurrentValues() {
        const concurrent = [];
        const values = Array.from(this.value.values());
        for (const value of values) {
            let isConcurrent = true;
            for (const other of values) {
                if (value !== other) {
                    const comparison = value.vectorClock.compare(other.vectorClock);
                    if (comparison === "before") {
                        isConcurrent = false;
                        break;
                    }
                }
            }
            if (isConcurrent) {
                concurrent.push(value.data);
            }
        }
        return concurrent;
    }
    merge(other) {
        const merged = new MVRegister(this.id, this.metadata.agentId);
        merged.vectorClock = this.vectorClock.merge(other.vectorClock);
        // Merge all values, keeping only concurrent ones
        const allAgents = new Set([...this.value.keys(), ...other.value.keys()]);
        for (const agentId of allAgents) {
            const thisValue = this.value.get(agentId);
            const otherValue = other.value.get(agentId);
            if (thisValue && otherValue) {
                // Take the one with higher vector clock
                const comparison = thisValue.vectorClock.compare(otherValue.vectorClock);
                if (comparison === "after" || comparison === "concurrent") {
                    merged.value.set(agentId, thisValue);
                }
                else {
                    merged.value.set(agentId, otherValue);
                }
            }
            else if (thisValue) {
                merged.value.set(agentId, thisValue);
            }
            else if (otherValue) {
                merged.value.set(agentId, otherValue);
            }
        }
        merged.updateMetadata();
        return merged;
    }
    updateMetadata() {
        this.metadata.timestamp = new Date();
        this.metadata.version++;
    }
}
/**
 * CRDT-based Map
 */
class CRDTMap {
    type = "crdt-map";
    id;
    value;
    vectorClock;
    metadata;
    constructor(id, agentId) {
        this.id = id;
        this.value = new Map();
        this.vectorClock = new VectorClock(agentId);
        this.metadata = {
            agentId,
            timestamp: new Date(),
            version: 1,
        };
    }
    set(key, crdt) {
        this.value.set(key, crdt);
        this.vectorClock.increment();
        this.updateMetadata();
    }
    get(key) {
        return this.value.get(key);
    }
    delete(key) {
        this.value.delete(key);
        this.vectorClock.increment();
        this.updateMetadata();
    }
    keys() {
        return this.value.keys();
    }
    merge(other) {
        const merged = new CRDTMap(this.id, this.metadata.agentId);
        merged.vectorClock = this.vectorClock.merge(other.vectorClock);
        const allKeys = new Set([...this.value.keys(), ...other.value.keys()]);
        for (const key of allKeys) {
            const thisCrdt = this.value.get(key);
            const otherCrdt = other.value.get(key);
            if (thisCrdt && otherCrdt && thisCrdt.type === otherCrdt.type) {
                // Merge CRDTs of the same type
                merged.value.set(key, this.mergeCRDTs(thisCrdt, otherCrdt));
            }
            else if (thisCrdt) {
                merged.value.set(key, thisCrdt);
            }
            else if (otherCrdt) {
                merged.value.set(key, otherCrdt);
            }
        }
        merged.updateMetadata();
        return merged;
    }
    mergeCRDTs(a, b) {
        // Type-specific merging
        switch (a.type) {
            case "g-counter":
                return a.merge(b);
            case "pn-counter":
                return a.merge(b);
            case "or-set":
                return a.merge(b);
            case "lww-register":
                return a.merge(b);
            case "mv-register":
                return a.merge(b);
            default:
                return a; // Fallback
        }
    }
    updateMetadata() {
        this.metadata.timestamp = new Date();
        this.metadata.version++;
    }
}
/**
 * Main CRDT Synchronizer
 * Note: CRDTs use eventual consistency and do not require quorum-based consensus.
 * All operations are commutative and convergent, allowing for asynchronous merging.
 */
export class CRDTSynchronizer extends EventEmitter {
    logger;
    agentId;
    vectorClock;
    crdts = new Map();
    syncStates = new Map();
    operationLog = [];
    constructor(agentId, vectorClock) {
        super();
        this.logger = new Logger(`CRDTSynchronizer:${agentId}`);
        this.agentId = agentId;
        this.vectorClock = vectorClock;
        this.logger.info("CRDT Synchronizer initialized", { agentId });
    }
    /**
     * Create a new CRDT
     */
    createCRDT(id, type, initialValue) {
        let crdt;
        switch (type) {
            case "g-counter":
                crdt = new GCounter(id, this.agentId);
                break;
            case "pn-counter":
                crdt = new PNCounter(id, this.agentId);
                break;
            case "or-set":
                crdt = new ORSet(id, this.agentId);
                break;
            case "lww-register":
                crdt = new LWWRegister(id, this.agentId, initialValue);
                break;
            case "mv-register":
                crdt = new MVRegister(id, this.agentId);
                break;
            case "crdt-map":
                crdt = new CRDTMap(id, this.agentId);
                break;
            default:
                throw new Error(`Unsupported CRDT type: ${type}`);
        }
        this.crdts.set(id, crdt);
        this.logger.debug("CRDT created", { id, type });
        this.emit("crdt_created", { id, type, crdt });
        return crdt;
    }
    /**
     * Get existing CRDT
     */
    getCRDT(id) {
        return this.crdts.get(id);
    }
    /**
     * Apply operation to CRDT
     */
    async applyOperation(operation) {
        try {
            const crdt = this.crdts.get(operation.crdtId);
            if (!crdt) {
                this.logger.warn("CRDT not found for operation", {
                    crdtId: operation.crdtId,
                    operation: operation.type,
                });
                return false;
            }
            // Check if we should apply this operation
            if (!this.shouldApplyOperation(operation, crdt)) {
                return false;
            }
            // Apply operation based on type
            const success = await this.executeOperation(operation, crdt);
            if (success) {
                // Log operation
                this.operationLog.push(operation);
                // Update vector clock
                this.vectorClock.merge(operation.vectorClock);
                this.emit("operation_applied", operation);
            }
            return success;
        }
        catch (error) {
            this.logger.error("Failed to apply operation", {
                operation,
                error: error.message,
            });
            return false;
        }
    }
    /**
     * Merge two CRDTs of the same type
     */
    async merge(localValue, remoteValue) {
        try {
            // Determine CRDT types and merge accordingly
            if (this.isGCounter(localValue) && this.isGCounter(remoteValue)) {
                return localValue.merge(remoteValue);
            }
            if (this.isPNCounter(localValue) && this.isPNCounter(remoteValue)) {
                return localValue.merge(remoteValue);
            }
            if (this.isORSet(localValue) && this.isORSet(remoteValue)) {
                return localValue.merge(remoteValue);
            }
            if (this.isLWWRegister(localValue) && this.isLWWRegister(remoteValue)) {
                return localValue.merge(remoteValue);
            }
            if (this.isMVRegister(localValue) && this.isMVRegister(remoteValue)) {
                return localValue.merge(remoteValue);
            }
            if (this.isCRDTMap(localValue) && this.isCRDTMap(remoteValue)) {
                return localValue.merge(remoteValue);
            }
            // Fallback: use LWW semantics for non-CRDT values
            return this.lastWriterWinsMerge(localValue, remoteValue);
        }
        catch (error) {
            this.logger.error("CRDT merge failed", { error: error.message });
            throw error;
        }
    }
    /**
     * Generate state vector for synchronization
     */
    generateStateVector() {
        return this.vectorClock.copy();
    }
    /**
     * Get operations since a given state vector
     */
    getOperationsSince(stateVector) {
        return this.operationLog.filter((op) => {
            const comparison = op.vectorClock.compare(stateVector);
            return comparison === "after" || comparison === "concurrent";
        });
    }
    /**
     * Synchronize with remote agent
     */
    async synchronizeWith(remoteAgentId, remoteOperations, remoteStateVector) {
        const startTime = Date.now();
        let appliedOperations = 0;
        let conflicts = 0;
        try {
            // Get our operations to send
            const ourOperations = this.getOperationsSince(remoteStateVector);
            // Apply remote operations
            for (const operation of remoteOperations) {
                const applied = await this.applyOperation(operation);
                if (applied) {
                    appliedOperations++;
                }
                else {
                    conflicts++;
                    this.emit("conflict_detected", {
                        operation,
                        remoteAgent: remoteAgentId,
                        reason: "operation_rejected",
                    });
                }
            }
            // Update sync state
            const syncState = {
                lastSyncVector: remoteStateVector.copy(),
                pendingOperations: [],
                conflictCount: conflicts,
                mergeCount: appliedOperations,
                lastSyncTime: new Date(),
            };
            this.syncStates.set(remoteAgentId, syncState);
            const syncTime = Date.now() - startTime;
            this.logger.info("Synchronization completed", {
                remoteAgent: remoteAgentId,
                applied: appliedOperations,
                conflicts,
                ourOperations: ourOperations.length,
                syncTime,
            });
            this.emit("sync_completed", {
                remoteAgent: remoteAgentId,
                appliedOperations,
                conflicts,
                syncTime,
            });
            return {
                success: true,
                appliedOperations,
                conflicts,
                newOperations: ourOperations,
            };
        }
        catch (error) {
            this.logger.error("Synchronization failed", {
                remoteAgent: remoteAgentId,
                error: error.message,
            });
            return {
                success: false,
                appliedOperations,
                conflicts: conflicts + 1,
                newOperations: [],
            };
        }
    }
    /**
     * Get all CRDTs
     */
    getAllCRDTs() {
        return new Map(this.crdts);
    }
    /**
     * Get synchronization statistics
     */
    getSyncStats() {
        // Note: CRDTs don't require quorum as they achieve eventual consistency
        // through commutative operations and deterministic conflict resolution
        const totalConflicts = Array.from(this.syncStates.values()).reduce((sum, state) => sum + state.conflictCount, 0);
        const totalMerges = Array.from(this.syncStates.values()).reduce((sum, state) => sum + state.mergeCount, 0);
        const averageConflictRate = totalMerges > 0 ? totalConflicts / totalMerges : 0;
        return {
            totalCRDTs: this.crdts.size,
            totalOperations: this.operationLog.length,
            syncStates: new Map(this.syncStates),
            averageConflictRate,
        };
    }
    /**
     * CRDTs achieve eventual consistency without quorum requirements
     * This method exists for API consistency but always returns true
     */
    hasQuorum() {
        // CRDTs don't require quorum - eventual consistency through convergent operations
        return true;
    }
    /**
     * Get quorum size - not applicable for CRDTs but provided for API consistency
     */
    getMinQuorum() {
        // CRDTs don't use quorum-based consensus
        return 1;
    }
    /**
     * Clean up old operations (garbage collection)
     */
    garbageCollect(olderThan) {
        const initialCount = this.operationLog.length;
        this.operationLog = this.operationLog.filter((op) => op.timestamp > olderThan);
        const cleaned = initialCount - this.operationLog.length;
        if (cleaned > 0) {
            this.logger.info("Operation log cleaned up", {
                cleaned,
                remaining: this.operationLog.length,
            });
        }
    }
    /**
     * Private helper methods
     */
    shouldApplyOperation(operation, crdt) {
        // Check if operation is newer than what we have
        const comparison = operation.vectorClock.compare(crdt.vectorClock);
        return comparison === "after" || comparison === "concurrent";
    }
    async executeOperation(operation, crdt) {
        try {
            switch (operation.type) {
                case "increment":
                    if (crdt.type === "g-counter") {
                        crdt.increment(operation.agentId, operation.value);
                        return true;
                    }
                    else if (crdt.type === "pn-counter") {
                        crdt.increment(operation.agentId, operation.value);
                        return true;
                    }
                    break;
                case "decrement":
                    if (crdt.type === "pn-counter") {
                        crdt.decrement(operation.agentId, operation.value);
                        return true;
                    }
                    break;
                case "add":
                    if (crdt.type === "or-set") {
                        crdt.add(operation.value, operation.agentId);
                        return true;
                    }
                    break;
                case "remove":
                    if (crdt.type === "or-set") {
                        crdt.remove(operation.value);
                        return true;
                    }
                    break;
                case "set":
                    if (crdt.type === "lww-register") {
                        crdt.set(operation.value, operation.agentId);
                        return true;
                    }
                    else if (crdt.type === "mv-register") {
                        crdt.set(operation.value, operation.agentId);
                        return true;
                    }
                    break;
                default:
                    this.logger.warn("Unknown operation type", { type: operation.type });
                    return false;
            }
            return false;
        }
        catch (error) {
            this.logger.error("Operation execution failed", {
                operation: operation.type,
                crdtType: crdt.type,
                error: error.message,
            });
            return false;
        }
    }
    lastWriterWinsMerge(local, remote) {
        // Simple LWW merge for non-CRDT values
        // In practice, you'd want more sophisticated conflict resolution
        const localTime = local?.timestamp || 0;
        const remoteTime = remote?.timestamp || 0;
        return localTime >= remoteTime ? local : remote;
    }
    // Type guards
    isGCounter(obj) {
        return obj && obj.type === "g-counter";
    }
    isPNCounter(obj) {
        return obj && obj.type === "pn-counter";
    }
    isORSet(obj) {
        return obj && obj.type === "or-set";
    }
    isLWWRegister(obj) {
        return obj && obj.type === "lww-register";
    }
    isMVRegister(obj) {
        return obj && obj.type === "mv-register";
    }
    isCRDTMap(obj) {
        return obj && obj.type === "crdt-map";
    }
}
// Export CRDT classes for direct use
export { GCounter, PNCounter, ORSet, LWWRegister, MVRegister, CRDTMap };

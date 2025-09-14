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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VectorClock } from "./vector-clocks.js";
export type CRDTType = "g-counter" | "pn-counter" | "g-set" | "or-set" | "lww-register" | "mv-register" | "crdt-map" | "crdt-array";
export interface CRDT {
    type: CRDTType;
    id: string;
    value: any;
    vectorClock: VectorClock;
    metadata: {
        agentId: string;
        timestamp: Date;
        version: number;
    };
}
export interface CRDTOperation {
    type: "increment" | "decrement" | "add" | "remove" | "set" | "merge";
    crdtId: string;
    crdtType: CRDTType;
    key?: string;
    value?: any;
    vectorClock: VectorClock;
    agentId: string;
    timestamp: Date;
}
export interface SyncState {
    lastSyncVector: VectorClock;
    pendingOperations: CRDTOperation[];
    conflictCount: number;
    mergeCount: number;
    lastSyncTime: Date;
}
/**
 * G-Counter: Grow-only Counter CRDT
 */
declare class GCounter implements CRDT {
    type: CRDTType;
    id: string;
    value: Map<string, number>;
    vectorClock: VectorClock;
    metadata: any;
    constructor(id: string, agentId: string);
    increment(agentId: string, amount?: number): void;
    getValue(): number;
    merge(other: GCounter): GCounter;
}
/**
 * PN-Counter: Positive-Negative Counter CRDT
 */
declare class PNCounter implements CRDT {
    type: CRDTType;
    id: string;
    value: {
        positive: GCounter;
        negative: GCounter;
    };
    vectorClock: VectorClock;
    metadata: any;
    constructor(id: string, agentId: string);
    increment(agentId: string, amount?: number): void;
    decrement(agentId: string, amount?: number): void;
    getValue(): number;
    merge(other: PNCounter): PNCounter;
    private updateMetadata;
}
/**
 * OR-Set: Observed-Remove Set CRDT
 */
declare class ORSet implements CRDT {
    type: CRDTType;
    id: string;
    value: {
        elements: Map<string, Set<string>>;
        removed: Set<string>;
    };
    vectorClock: VectorClock;
    metadata: any;
    constructor(id: string, agentId: string);
    add(element: string, agentId: string): string;
    remove(element: string): void;
    contains(element: string): boolean;
    getElements(): Set<string>;
    merge(other: ORSet): ORSet;
    private updateMetadata;
}
/**
 * LWW-Register: Last-Writer-Wins Register CRDT
 */
declare class LWWRegister implements CRDT {
    type: CRDTType;
    id: string;
    value: {
        data: any;
        timestamp: number;
        agentId: string;
    };
    vectorClock: VectorClock;
    metadata: any;
    constructor(id: string, agentId: string, initialValue?: any);
    set(value: any, agentId: string): void;
    get(): any;
    merge(other: LWWRegister): LWWRegister;
    private updateMetadata;
}
/**
 * Multi-Value Register with Vector Clocks
 */
declare class MVRegister implements CRDT {
    type: CRDTType;
    id: string;
    value: Map<string, {
        data: any;
        vectorClock: VectorClock;
    }>;
    vectorClock: VectorClock;
    metadata: any;
    constructor(id: string, agentId: string);
    set(value: any, agentId: string): void;
    get(): any[];
    getConcurrentValues(): any[];
    merge(other: MVRegister): MVRegister;
    private updateMetadata;
}
/**
 * CRDT-based Map
 */
declare class CRDTMap implements CRDT {
    type: CRDTType;
    id: string;
    value: Map<string, CRDT>;
    vectorClock: VectorClock;
    metadata: any;
    constructor(id: string, agentId: string);
    set(key: string, crdt: CRDT): void;
    get(key: string): CRDT | undefined;
    delete(key: string): void;
    keys(): IterableIterator<string>;
    merge(other: CRDTMap): CRDTMap;
    private mergeCRDTs;
    private updateMetadata;
}
/**
 * Main CRDT Synchronizer
 * Note: CRDTs use eventual consistency and do not require quorum-based consensus.
 * All operations are commutative and convergent, allowing for asynchronous merging.
 */
export declare class CRDTSynchronizer extends EventEmitter {
    private logger;
    private agentId;
    private vectorClock;
    private crdts;
    private syncStates;
    private operationLog;
    constructor(agentId: string, vectorClock: VectorClock);
    /**
     * Create a new CRDT
     */
    createCRDT<T extends CRDT>(id: string, type: CRDTType, initialValue?: any): T;
    /**
     * Get existing CRDT
     */
    getCRDT<T extends CRDT>(id: string): T | undefined;
    /**
     * Apply operation to CRDT
     */
    applyOperation(operation: CRDTOperation): Promise<boolean>;
    /**
     * Merge two CRDTs of the same type
     */
    merge(localValue: any, remoteValue: any): Promise<any>;
    /**
     * Generate state vector for synchronization
     */
    generateStateVector(): VectorClock;
    /**
     * Get operations since a given state vector
     */
    getOperationsSince(stateVector: VectorClock): CRDTOperation[];
    /**
     * Synchronize with remote agent
     */
    synchronizeWith(remoteAgentId: string, remoteOperations: CRDTOperation[], remoteStateVector: VectorClock): Promise<{
        success: boolean;
        appliedOperations: number;
        conflicts: number;
        newOperations: CRDTOperation[];
    }>;
    /**
     * Get all CRDTs
     */
    getAllCRDTs(): Map<string, CRDT>;
    /**
     * Get synchronization statistics
     */
    getSyncStats(): {
        totalCRDTs: number;
        totalOperations: number;
        syncStates: Map<string, SyncState>;
        averageConflictRate: number;
    };
    /**
     * CRDTs achieve eventual consistency without quorum requirements
     * This method exists for API consistency but always returns true
     */
    hasQuorum(): boolean;
    /**
     * Get quorum size - not applicable for CRDTs but provided for API consistency
     */
    getMinQuorum(): number;
    /**
     * Clean up old operations (garbage collection)
     */
    garbageCollect(olderThan: Date): void;
    /**
     * Private helper methods
     */
    private shouldApplyOperation;
    private executeOperation;
    private lastWriterWinsMerge;
    private isGCounter;
    private isPNCounter;
    private isORSet;
    private isLWWRegister;
    private isMVRegister;
    private isCRDTMap;
}
export { GCounter, PNCounter, ORSet, LWWRegister, MVRegister, CRDTMap };
//# sourceMappingURL=crdt-sync.d.ts.map
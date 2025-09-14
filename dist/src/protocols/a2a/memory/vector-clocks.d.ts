/**
 * Vector Clock Implementation for A2A Memory Coordination
 *
 * Provides logical timestamp management for distributed systems:
 * - Causal ordering of events
 * - Conflict detection in concurrent updates
 * - Happens-before relationship tracking
 * - Support for dynamic agent membership
 * - Efficient serialization and deserialization
 * - Clock pruning and garbage collection
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
export type ClockComparison = "before" | "after" | "concurrent" | "equal";
export interface VectorClockState {
    clocks: Map<string, number>;
    agentId: string;
    version: number;
    lastUpdated: Date;
}
export interface ClockDelta {
    agentId: string;
    fromClock: number;
    toClock: number;
    timestamp: Date;
}
export interface ClockPruningConfig {
    maxAge: number;
    maxSize: number;
    pruneInterval: number;
    keepRecentAgents: number;
}
/**
 * Vector Clock implementation for distributed logical timestamps
 */
export declare class VectorClock {
    private clocks;
    private agentId;
    private version;
    private lastUpdated;
    private logger;
    private pruningConfig;
    private agentLastSeen;
    private pruningTimer?;
    constructor(agentId: string, initialClocks?: Map<string, number>);
    /**
     * Increment the local clock
     */
    increment(): VectorClock;
    /**
     * Update clock for a specific agent
     */
    update(agentId: string, clockValue: number): VectorClock;
    /**
     * Merge with another vector clock
     */
    merge(other: VectorClock): VectorClock;
    /**
     * Compare this vector clock with another
     */
    compare(other: VectorClock): ClockComparison;
    /**
     * Check if this clock is newer than another
     */
    isNewer(other: VectorClock): boolean;
    /**
     * Check if this clock is older than another
     */
    isOlder(other: VectorClock): boolean;
    /**
     * Check if clocks are concurrent (incomparable)
     */
    isConcurrent(other: VectorClock): boolean;
    /**
     * Check if clocks are equal
     */
    equals(other: VectorClock): boolean;
    /**
     * Get clock value for specific agent
     */
    getClock(agentId: string): number;
    /**
     * Set clock value for specific agent
     */
    setClock(agentId: string, clockValue: number): VectorClock;
    /**
     * Get all agent IDs in this clock
     */
    getAgents(): string[];
    /**
     * Get clock size (number of agents)
     */
    size(): number;
    /**
     * Create a copy of this vector clock
     */
    copy(): VectorClock;
    /**
     * Calculate the delta between this clock and another
     */
    delta(other: VectorClock): ClockDelta[];
    /**
     * Apply deltas to this clock
     */
    applyDeltas(deltas: ClockDelta[]): VectorClock;
    /**
     * Serialize to string representation
     */
    toString(): string;
    /**
     * Deserialize from string representation
     */
    static fromString(clockString: string): VectorClock;
    /**
     * Serialize to compact binary format
     */
    toBinary(): Buffer;
    /**
     * Deserialize from binary format
     */
    static fromBinary(buffer: Buffer): VectorClock;
    /**
     * Get state snapshot
     */
    getState(): VectorClockState;
    /**
     * Restore from state snapshot
     */
    restoreState(state: VectorClockState): VectorClock;
    /**
     * Configure pruning settings
     */
    configurePruning(config: Partial<ClockPruningConfig>): void;
    /**
     * Manual pruning of old entries
     */
    prune(): number;
    /**
     * Get pruning statistics
     */
    getPruningStats(): {
        totalAgents: number;
        oldestAgent: Date | null;
        newestAgent: Date | null;
        nextPruning: Date | null;
        config: ClockPruningConfig;
    };
    /**
     * Destroy and cleanup resources
     */
    destroy(): void;
    /**
     * Private methods
     */
    private startPruning;
    private hashString;
}
/**
 * Vector Clock Manager for handling multiple clocks
 */
export declare class VectorClockManager {
    private clocks;
    private logger;
    constructor();
    /**
     * Create or get a vector clock for an agent
     */
    getOrCreateClock(agentId: string): VectorClock;
    /**
     * Remove clock for an agent
     */
    removeClock(agentId: string): boolean;
    /**
     * Synchronize clocks between agents
     */
    synchronizeClocks(agentId1: string, agentId2: string): {
        clock1: VectorClock;
        clock2: VectorClock;
        synchronized: boolean;
    };
    /**
     * Get all managed clocks
     */
    getAllClocks(): Map<string, VectorClock>;
    /**
     * Cleanup all clocks
     */
    cleanup(): void;
}
//# sourceMappingURL=vector-clocks.d.ts.map
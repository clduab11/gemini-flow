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

import { Logger } from "../../../utils/logger.js";

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
  maxAge: number; // Maximum age in milliseconds
  maxSize: number; // Maximum number of agent entries
  pruneInterval: number; // Pruning interval in milliseconds
  keepRecentAgents: number; // Always keep N most recent agents
}

/**
 * Vector Clock implementation for distributed logical timestamps
 */
export class VectorClock {
  private clocks: Map<string, number>;
  private agentId: string;
  private version: number;
  private lastUpdated: Date;
  private logger: Logger;

  // Pruning configuration
  private pruningConfig: ClockPruningConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 1000,
    pruneInterval: 60 * 60 * 1000, // 1 hour
    keepRecentAgents: 50,
  };

  private agentLastSeen: Map<string, Date> = new Map();
  private pruningTimer?: ReturnType<typeof setTimeout>;

  constructor(agentId: string, initialClocks?: Map<string, number>) {
    this.agentId = agentId;
    this.clocks = new Map(initialClocks || [[agentId, 0]]);
    this.version = 1;
    this.lastUpdated = new Date();
    this.logger = new Logger(`VectorClock:${agentId}`);

    // Initialize agent last seen
    this.agentLastSeen.set(agentId, new Date());

    // Start pruning timer
    this.startPruning();

    this.logger.debug("Vector clock initialized", {
      agentId,
      initialSize: this.clocks.size,
    });
  }

  /**
   * Increment the local clock
   */
  increment(): VectorClock {
    const currentClock = this.clocks.get(this.agentId) || 0;
    this.clocks.set(this.agentId, currentClock + 1);
    this.version++;
    this.lastUpdated = new Date();
    this.agentLastSeen.set(this.agentId, new Date());

    this.logger.trace("Clock incremented", {
      agentId: this.agentId,
      newClock: currentClock + 1,
      version: this.version,
    });

    return this;
  }

  /**
   * Update clock for a specific agent
   */
  update(agentId: string, clockValue: number): VectorClock {
    const currentClock = this.clocks.get(agentId) || 0;

    if (clockValue > currentClock) {
      this.clocks.set(agentId, clockValue);
      this.version++;
      this.lastUpdated = new Date();
      this.agentLastSeen.set(agentId, new Date());

      this.logger.trace("Clock updated", {
        agentId,
        fromClock: currentClock,
        toClock: clockValue,
        version: this.version,
      });
    }

    return this;
  }

  /**
   * Merge with another vector clock
   */
  merge(other: VectorClock): VectorClock {
    const merged = this.copy();
    let hasChanges = false;

    // Merge all clocks from other
    for (const [agentId, clockValue] of other.clocks) {
      const currentClock = merged.clocks.get(agentId) || 0;

      if (clockValue > currentClock) {
        merged.clocks.set(agentId, clockValue);
        merged.agentLastSeen.set(agentId, new Date());
        hasChanges = true;
      }
    }

    // Increment our own clock
    merged.increment();

    if (hasChanges) {
      merged.version++;
      merged.lastUpdated = new Date();

      this.logger.debug("Vector clocks merged", {
        ourSize: this.clocks.size,
        otherSize: other.clocks.size,
        mergedSize: merged.clocks.size,
        hasChanges,
      });
    }

    return merged;
  }

  /**
   * Compare this vector clock with another
   */
  compare(other: VectorClock): ClockComparison {
    if (this.equals(other)) {
      return "equal";
    }

    let thisSmaller = false;
    let thisLarger = false;

    // Get all unique agent IDs
    const allAgents = new Set([...this.clocks.keys(), ...other.clocks.keys()]);

    for (const agentId of allAgents) {
      const thisClock = this.clocks.get(agentId) || 0;
      const otherClock = other.clocks.get(agentId) || 0;

      if (thisClock < otherClock) {
        thisSmaller = true;
      } else if (thisClock > otherClock) {
        thisLarger = true;
      }

      // If both conditions are true, clocks are concurrent
      if (thisSmaller && thisLarger) {
        return "concurrent";
      }
    }

    if (thisSmaller) {
      return "before";
    } else if (thisLarger) {
      return "after";
    } else {
      return "equal";
    }
  }

  /**
   * Check if this clock is newer than another
   */
  isNewer(other: VectorClock): boolean {
    const comparison = this.compare(other);
    return comparison === "after";
  }

  /**
   * Check if this clock is older than another
   */
  isOlder(other: VectorClock): boolean {
    const comparison = this.compare(other);
    return comparison === "before";
  }

  /**
   * Check if clocks are concurrent (incomparable)
   */
  isConcurrent(other: VectorClock): boolean {
    return this.compare(other) === "concurrent";
  }

  /**
   * Check if clocks are equal
   */
  equals(other: VectorClock): boolean {
    if (this.clocks.size !== other.clocks.size) {
      return false;
    }

    for (const [agentId, clockValue] of this.clocks) {
      const otherClock = other.clocks.get(agentId) || 0;
      if (clockValue !== otherClock) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get clock value for specific agent
   */
  getClock(agentId: string): number {
    return this.clocks.get(agentId) || 0;
  }

  /**
   * Set clock value for specific agent
   */
  setClock(agentId: string, clockValue: number): VectorClock {
    this.clocks.set(agentId, clockValue);
    this.agentLastSeen.set(agentId, new Date());
    this.version++;
    this.lastUpdated = new Date();

    return this;
  }

  /**
   * Get all agent IDs in this clock
   */
  getAgents(): string[] {
    return Array.from(this.clocks.keys());
  }

  /**
   * Get clock size (number of agents)
   */
  size(): number {
    return this.clocks.size;
  }

  /**
   * Create a copy of this vector clock
   */
  copy(): VectorClock {
    const copy = new VectorClock(this.agentId, new Map(this.clocks));
    copy.version = this.version;
    copy.lastUpdated = new Date(this.lastUpdated);
    copy.agentLastSeen = new Map(this.agentLastSeen);
    copy.pruningConfig = { ...this.pruningConfig };

    return copy;
  }

  /**
   * Calculate the delta between this clock and another
   */
  delta(other: VectorClock): ClockDelta[] {
    const deltas: ClockDelta[] = [];

    // Check our clocks vs other's
    for (const [agentId, clockValue] of this.clocks) {
      const otherClock = other.clocks.get(agentId) || 0;

      if (clockValue > otherClock) {
        deltas.push({
          agentId,
          fromClock: otherClock,
          toClock: clockValue,
          timestamp: new Date(),
        });
      }
    }

    return deltas;
  }

  /**
   * Apply deltas to this clock
   */
  applyDeltas(deltas: ClockDelta[]): VectorClock {
    let hasChanges = false;

    for (const delta of deltas) {
      const currentClock = this.clocks.get(delta.agentId) || 0;

      if (delta.toClock > currentClock) {
        this.clocks.set(delta.agentId, delta.toClock);
        this.agentLastSeen.set(delta.agentId, delta.timestamp);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.version++;
      this.lastUpdated = new Date();

      this.logger.debug("Deltas applied", {
        deltaCount: deltas.length,
        clockSize: this.clocks.size,
      });
    }

    return this;
  }

  /**
   * Serialize to string representation
   */
  toString(): string {
    const clockArray = Array.from(this.clocks.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return JSON.stringify({
      clocks: clockArray,
      agentId: this.agentId,
      version: this.version,
      lastUpdated: this.lastUpdated.toISOString(),
    });
  }

  /**
   * Deserialize from string representation
   */
  static fromString(clockString: string): VectorClock {
    try {
      const data = JSON.parse(clockString);
      const clocks = new Map(data.clocks);
      const vectorClock = new VectorClock(data.agentId, clocks);

      vectorClock.version = data.version || 1;
      vectorClock.lastUpdated = new Date(data.lastUpdated);

      return vectorClock;
    } catch (error) {
      throw new Error(`Failed to deserialize vector clock: ${error.message}`);
    }
  }

  /**
   * Serialize to compact binary format
   */
  toBinary(): Buffer {
    const clockEntries = Array.from(this.clocks.entries());
    const buffer = Buffer.alloc(
      4 + clockEntries.length * 12 + this.agentId.length,
    );

    let offset = 0;

    // Write number of entries
    buffer.writeUInt32BE(clockEntries.length, offset);
    offset += 4;

    // Write clock entries (agentId hash + clock value)
    for (const [agentId, clockValue] of clockEntries) {
      const agentHash = this.hashString(agentId);
      buffer.writeUInt32BE(agentHash, offset);
      buffer.writeUInt32BE(clockValue, offset + 4);
      offset += 8;
    }

    return buffer;
  }

  /**
   * Deserialize from binary format
   */
  static fromBinary(buffer: Buffer): VectorClock {
    let offset = 0;

    // Read number of entries
    const entryCount = buffer.readUInt32BE(offset);
    offset += 4;

    const clocks = new Map<string, number>();

    // Read clock entries
    for (let i = 0; i < entryCount; i++) {
      const agentHash = buffer.readUInt32BE(offset);
      const clockValue = buffer.readUInt32BE(offset + 4);
      offset += 8;

      // Note: We lose the original agent ID in binary format
      // This is a trade-off for compactness
      clocks.set(agentHash.toString(), clockValue);
    }

    // Use first entry as agent ID (approximation)
    const agentId = clocks.keys().next().value || "unknown";

    return new VectorClock(agentId, clocks);
  }

  /**
   * Get state snapshot
   */
  getState(): VectorClockState {
    return {
      clocks: new Map(this.clocks),
      agentId: this.agentId,
      version: this.version,
      lastUpdated: new Date(this.lastUpdated),
    };
  }

  /**
   * Restore from state snapshot
   */
  restoreState(state: VectorClockState): VectorClock {
    this.clocks = new Map(state.clocks);
    this.version = state.version;
    this.lastUpdated = new Date(state.lastUpdated);

    // Update agent last seen
    for (const agentId of this.clocks.keys()) {
      if (!this.agentLastSeen.has(agentId)) {
        this.agentLastSeen.set(agentId, new Date());
      }
    }

    this.logger.debug("State restored", {
      clockSize: this.clocks.size,
      version: this.version,
    });

    return this;
  }

  /**
   * Configure pruning settings
   */
  configurePruning(config: Partial<ClockPruningConfig>): void {
    this.pruningConfig = { ...this.pruningConfig, ...config };

    // Restart pruning with new config
    if (this.pruningTimer) {
      clearInterval(this.pruningTimer);
    }
    this.startPruning();

    this.logger.info("Pruning configuration updated", this.pruningConfig);
  }

  /**
   * Manual pruning of old entries
   */
  prune(): number {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.pruningConfig.maxAge);

    let prunedCount = 0;
    const agentsToRemove: string[] = [];

    // Find agents to remove based on age
    for (const [agentId, lastSeen] of this.agentLastSeen) {
      if (agentId !== this.agentId && lastSeen < cutoffTime) {
        agentsToRemove.push(agentId);
      }
    }

    // If still too many, remove oldest agents (except recent ones)
    if (this.clocks.size > this.pruningConfig.maxSize) {
      const sortedAgents = Array.from(this.agentLastSeen.entries())
        .filter(([agentId]) => agentId !== this.agentId)
        .sort(([, a], [, b]) => b.getTime() - a.getTime())
        .slice(this.pruningConfig.keepRecentAgents)
        .map(([agentId]) => agentId);

      agentsToRemove.push(...sortedAgents);
    }

    // Remove agents
    for (const agentId of agentsToRemove) {
      if (this.clocks.delete(agentId)) {
        this.agentLastSeen.delete(agentId);
        prunedCount++;
      }
    }

    if (prunedCount > 0) {
      this.version++;
      this.lastUpdated = new Date();

      this.logger.info("Clock pruned", {
        prunedCount,
        remainingSize: this.clocks.size,
      });
    }

    return prunedCount;
  }

  /**
   * Get pruning statistics
   */
  getPruningStats(): {
    totalAgents: number;
    oldestAgent: Date | null;
    newestAgent: Date | null;
    nextPruning: Date | null;
    config: ClockPruningConfig;
  } {
    const lastSeenTimes = Array.from(this.agentLastSeen.values());

    return {
      totalAgents: this.clocks.size,
      oldestAgent:
        lastSeenTimes.length > 0
          ? new Date(Math.min(...lastSeenTimes.map((d) => d.getTime())))
          : null,
      newestAgent:
        lastSeenTimes.length > 0
          ? new Date(Math.max(...lastSeenTimes.map((d) => d.getTime())))
          : null,
      nextPruning: this.pruningTimer
        ? new Date(Date.now() + this.pruningConfig.pruneInterval)
        : null,
      config: { ...this.pruningConfig },
    };
  }

  /**
   * Destroy and cleanup resources
   */
  destroy(): void {
    if (this.pruningTimer) {
      clearInterval(this.pruningTimer);
      this.pruningTimer = undefined;
    }

    this.clocks.clear();
    this.agentLastSeen.clear();

    this.logger.debug("Vector clock destroyed");
  }

  /**
   * Private methods
   */

  private startPruning(): void {
    if (this.pruningConfig.pruneInterval > 0) {
      this.pruningTimer = setInterval(() => {
        this.prune();
      }, this.pruningConfig.pruneInterval);
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Vector Clock Manager for handling multiple clocks
 */
export class VectorClockManager {
  private clocks: Map<string, VectorClock> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger("VectorClockManager");
  }

  /**
   * Create or get a vector clock for an agent
   */
  getOrCreateClock(agentId: string): VectorClock {
    let clock = this.clocks.get(agentId);

    if (!clock) {
      clock = new VectorClock(agentId);
      this.clocks.set(agentId, clock);

      this.logger.debug("New vector clock created", { agentId });
    }

    return clock;
  }

  /**
   * Remove clock for an agent
   */
  removeClock(agentId: string): boolean {
    const clock = this.clocks.get(agentId);

    if (clock) {
      clock.destroy();
      this.clocks.delete(agentId);

      this.logger.debug("Vector clock removed", { agentId });
      return true;
    }

    return false;
  }

  /**
   * Synchronize clocks between agents
   */
  synchronizeClocks(
    agentId1: string,
    agentId2: string,
  ): {
    clock1: VectorClock;
    clock2: VectorClock;
    synchronized: boolean;
  } {
    const clock1 = this.getOrCreateClock(agentId1);
    const clock2 = this.getOrCreateClock(agentId2);

    const mergedClock1 = clock1.merge(clock2);
    const mergedClock2 = clock2.merge(clock1);

    // Update stored clocks
    this.clocks.set(agentId1, mergedClock1);
    this.clocks.set(agentId2, mergedClock2);

    this.logger.debug("Clocks synchronized", { agentId1, agentId2 });

    return {
      clock1: mergedClock1,
      clock2: mergedClock2,
      synchronized: true,
    };
  }

  /**
   * Get all managed clocks
   */
  getAllClocks(): Map<string, VectorClock> {
    return new Map(this.clocks);
  }

  /**
   * Cleanup all clocks
   */
  cleanup(): void {
    for (const clock of this.clocks.values()) {
      clock.destroy();
    }

    this.clocks.clear();
    this.logger.info("All vector clocks cleaned up");
  }
}

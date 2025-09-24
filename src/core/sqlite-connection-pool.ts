/**
 * SQLite Connection Pool Manager
 *
 * Provides connection pooling, auto-reconnect, and graceful degradation
 * for SQLite database connections with tier-based limits
 */

import { Logger } from "../utils/logger.js";
import { EventEmitter } from "node:events";
import {
  SQLiteDatabase,
  SQLiteImplementation,
  createSQLiteDatabase,
  detectSQLiteImplementations,
} from "../memory/sqlite-adapter.js";

export interface ConnectionPoolConfig {
  minConnections?: number;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
  evictionInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  preferredImplementation?: SQLiteImplementation;
  enableWAL?: boolean;
  userTier?: "free" | "pro" | "enterprise";
}

export interface PooledConnection {
  id: string;
  database: SQLiteDatabase;
  inUse: boolean;
  lastUsed: number;
  createdAt: number;
  errorCount: number;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  implementation: SQLiteImplementation;
  avgWaitTime: number;
  connectionErrors: number;
}

// Tier-based connection limits
const TIER_LIMITS = {
  free: { min: 1, max: 2 },
  pro: { min: 2, max: 10 },
  enterprise: { min: 5, max: 50 },
};

export class SQLiteConnectionPool extends EventEmitter {
  private logger: Logger;
  private config: Required<ConnectionPoolConfig>;
  private connections: Map<string, PooledConnection> = new Map();
  private waitQueue: Array<(conn: SQLiteDatabase) => void> = [];
  private implementation?: SQLiteImplementation;
  private dbPath: string;
  private isShuttingDown: boolean = false;
  private evictionTimer?: ReturnType<typeof setTimeout>;
  private waitTimes: number[] = [];
  private connectionErrors: number = 0;

  constructor(dbPath: string, config: ConnectionPoolConfig = {}) {
    super();
    this.logger = new Logger("SQLiteConnectionPool");
    this.dbPath = dbPath;

    // Get tier limits
    const tier = config.userTier || "free";
    const tierLimits = TIER_LIMITS[tier];

    this.config = {
      minConnections: config.minConnections || tierLimits.min,
      maxConnections: config.maxConnections || tierLimits.max,
      connectionTimeout: config.connectionTimeout || 30000,
      idleTimeout: config.idleTimeout || 60000,
      acquireTimeout: config.acquireTimeout || 5000,
      evictionInterval: config.evictionInterval || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      preferredImplementation: config.preferredImplementation,
      enableWAL: config.enableWAL ?? true,
      userTier: tier,
    };

    this.logger.info("Connection pool initialized", {
      tier,
      minConnections: this.config.minConnections,
      maxConnections: this.config.maxConnections,
    });

    this.startEvictionTimer();
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    try {
      // Detect available implementations
      const detection = await detectSQLiteImplementations();
      this.implementation =
        this.config.preferredImplementation || detection.recommended;

      this.logger.info("Using SQLite implementation:", this.implementation);

      // Create initial connections
      const promises: Promise<void>[] = [];
      for (let i = 0; i < this.config.minConnections; i++) {
        promises.push(this.createConnection());
      }

      await Promise.all(promises);

      this.emit("pool_ready", {
        implementation: this.implementation,
        connections: this.connections.size,
      });
    } catch (error) {
      this.logger.error("Failed to initialize connection pool:", error);
      throw error;
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<SQLiteDatabase> {
    const startTime = Date.now();

    if (this.isShuttingDown) {
      throw new Error("Connection pool is shutting down");
    }

    // Try to get an idle connection
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      idleConnection.inUse = true;
      idleConnection.lastUsed = Date.now();

      this.recordWaitTime(Date.now() - startTime);
      this.emit("connection_acquired", { id: idleConnection.id });

      return idleConnection.database;
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      try {
        await this.createConnection();
        return this.acquire(); // Recursive call to get the new connection
      } catch (error) {
        this.logger.warn("Failed to create new connection:", error);
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(resolve);
        if (index > -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error("Connection acquire timeout"));
      }, this.config.acquireTimeout);

      const wrappedResolve = (conn: SQLiteDatabase) => {
        clearTimeout(timeout);
        this.recordWaitTime(Date.now() - startTime);
        resolve(conn);
      };

      this.waitQueue.push(wrappedResolve);
      this.emit("connection_waiting", { queueLength: this.waitQueue.length });
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(database: SQLiteDatabase): void {
    const connection = this.findConnectionByDatabase(database);
    if (!connection) {
      this.logger.warn("Attempted to release unknown connection");
      return;
    }

    connection.inUse = false;
    connection.lastUsed = Date.now();

    // Check if there are waiting requests
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      if (resolve) {
        connection.inUse = true;
        resolve(database);
      }
    }

    this.emit("connection_released", { id: connection.id });
  }

  /**
   * Create a new connection with retry logic
   */
  private async createConnection(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const database = await createSQLiteDatabase(
          this.dbPath,
          this.implementation,
        );

        // Apply optimizations
        if (this.config.enableWAL) {
          try {
            database.pragma("journal_mode = WAL");
            database.pragma("synchronous = NORMAL");
            database.pragma("cache_size = 10000");
            database.pragma("temp_store = MEMORY");
          } catch (error) {
            this.logger.warn("Some pragmas not supported:", error);
          }
        }

        // Test the connection
        const testStmt = database.prepare("SELECT 1 as test");
        const result = await testStmt.get();
        if (!result || (result as any).test !== 1) {
          throw new Error("Connection test failed");
        }

        // Add to pool
        const connection: PooledConnection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          database,
          inUse: false,
          lastUsed: Date.now(),
          createdAt: Date.now(),
          errorCount: 0,
        };

        this.connections.set(connection.id, connection);
        this.emit("connection_created", { id: connection.id });

        return;
      } catch (error) {
        lastError = error as Error;
        this.connectionErrors++;

        if (attempt < this.config.retryAttempts) {
          this.logger.warn(
            `Connection attempt ${attempt} failed, retrying...`,
            error,
          );
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(
      `Failed to create connection after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Get an idle connection from the pool
   */
  private getIdleConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.inUse && !this.isConnectionStale(connection)) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Check if a connection is stale
   */
  private isConnectionStale(connection: PooledConnection): boolean {
    const idleTime = Date.now() - connection.lastUsed;
    return idleTime > this.config.idleTimeout;
  }

  /**
   * Find connection by database instance
   */
  private findConnectionByDatabase(
    database: SQLiteDatabase,
  ): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.database === database) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Evict stale connections
   */
  private async evictStaleConnections(): Promise<void> {
    if (this.isShuttingDown) return;

    const now = Date.now();
    const toEvict: string[] = [];

    for (const [id, connection] of this.connections) {
      // Keep minimum connections
      if (this.connections.size <= this.config.minConnections) {
        break;
      }

      // Evict stale connections
      if (!connection.inUse && this.isConnectionStale(connection)) {
        toEvict.push(id);
      }

      // Evict connections with high error count
      if (connection.errorCount > 5) {
        toEvict.push(id);
      }
    }

    for (const id of toEvict) {
      const connection = this.connections.get(id);
      if (connection && !connection.inUse) {
        try {
          connection.database.close();
          this.connections.delete(id);
          this.emit("connection_evicted", { id });
        } catch (error) {
          this.logger.error("Error evicting connection:", error);
        }
      }
    }

    // Ensure minimum connections
    if (this.connections.size < this.config.minConnections) {
      const toCreate = this.config.minConnections - this.connections.size;
      for (let i = 0; i < toCreate; i++) {
        try {
          await this.createConnection();
        } catch (error) {
          this.logger.warn("Failed to maintain minimum connections:", error);
        }
      }
    }
  }

  /**
   * Start eviction timer
   */
  private startEvictionTimer(): void {
    this.evictionTimer = setInterval(() => {
      this.evictStaleConnections().catch((error) => {
        this.logger.error("Eviction error:", error);
      });
    }, this.config.evictionInterval);
  }

  /**
   * Record wait time for statistics
   */
  private recordWaitTime(time: number): void {
    this.waitTimes.push(time);
    if (this.waitTimes.length > 100) {
      this.waitTimes.shift();
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    let activeCount = 0;
    for (const connection of this.connections.values()) {
      if (connection.inUse) activeCount++;
    }

    const avgWaitTime =
      this.waitTimes.length > 0
        ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
        : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections: activeCount,
      idleConnections: this.connections.size - activeCount,
      waitingRequests: this.waitQueue.length,
      implementation:
        this.implementation || ("unknown" as SQLiteImplementation),
      avgWaitTime,
      connectionErrors: this.connectionErrors,
    };
  }

  /**
   * Execute a function with auto-reconnect
   */
  async execute<T>(fn: (db: SQLiteDatabase) => T | Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      const db = await this.acquire();

      try {
        const result = await fn(db);
        this.release(db);
        return result;
      } catch (error) {
        lastError = error as Error;

        // Mark connection as having errors
        const connection = this.findConnectionByDatabase(db);
        if (connection) {
          connection.errorCount++;
        }

        this.release(db);

        // Check if it's a connection error
        if (this.isConnectionError(error)) {
          this.logger.warn(
            `Execution attempt ${attempt} failed, retrying...`,
            error,
          );

          // Remove the faulty connection
          if (connection) {
            try {
              connection.database.close();
              this.connections.delete(connection.id);
            } catch (closeError) {
              this.logger.error("Error closing faulty connection:", closeError);
            }
          }

          if (attempt < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay * attempt);
          }
        } else {
          // Not a connection error, don't retry
          throw error;
        }
      }
    }

    throw new Error(
      `Execution failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Check if an error is a connection error
   */
  private isConnectionError(error: any): boolean {
    const message = error?.message?.toLowerCase() || "";
    return (
      message.includes("database") ||
      message.includes("connection") ||
      message.includes("sqlite") ||
      message.includes("prepare") ||
      message.includes("locked")
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
    }

    // Reject all waiting requests
    for (const resolve of this.waitQueue) {
      resolve(null as any);
    }
    this.waitQueue = [];

    // Close all connections
    const closePromises: Promise<void>[] = [];
    for (const [id, connection] of this.connections) {
      closePromises.push(
        new Promise<void>((resolve) => {
          try {
            connection.database.close();
            this.emit("connection_closed", { id });
          } catch (error) {
            this.logger.error("Error closing connection:", error);
          }
          resolve();
        }),
      );
    }

    await Promise.all(closePromises);
    this.connections.clear();

    this.logger.info("Connection pool shutdown complete");
    this.emit("pool_shutdown");
  }
}

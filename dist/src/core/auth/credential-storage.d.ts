/**
 * Credential Storage Implementation
 *
 * Secure storage interface for authentication credentials with encryption,
 * multiple backend support, and comprehensive error handling
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { CredentialStorage, AuthCredentials, StorageConfig } from "../../types/auth.js";
/**
 * In-memory credential storage implementation
 */
export declare class MemoryCredentialStorage extends EventEmitter implements CredentialStorage {
    private storage;
    private logger;
    private config;
    private cleanupInterval?;
    constructor(config?: Partial<StorageConfig>);
    store(key: string, credentials: AuthCredentials): Promise<void>;
    retrieve(key: string): Promise<AuthCredentials | null>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): Promise<void>;
    exists(key: string): Promise<boolean>;
    /**
     * Get storage statistics
     */
    getStats(): {
        totalEntries: number;
        expiredEntries: number;
        totalAccesses: number;
        avgAccessCount: number;
        oldestEntry: number | null;
        newestEntry: number | null;
    };
    /**
     * Cleanup expired entries
     */
    private cleanupExpiredEntries;
    /**
     * Evict oldest entry to make room
     */
    private evictOldestEntry;
    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanupInterval;
    /**
     * Stop cleanup interval
     */
    destroy(): void;
    private validateKey;
    private validateCredentials;
    private maskKey;
    private createStorageError;
}
/**
 * File-based credential storage implementation
 */
export declare class FileCredentialStorage extends EventEmitter implements CredentialStorage {
    private basePath;
    private logger;
    private config;
    constructor(config?: Partial<StorageConfig>);
    store(key: string, credentials: AuthCredentials): Promise<void>;
    retrieve(key: string): Promise<AuthCredentials | null>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): Promise<void>;
    exists(key: string): Promise<boolean>;
    private ensureStorageDirectory;
    private getFilePath;
    private fileExists;
    private validateKey;
    private validateCredentials;
    private maskKey;
    private createStorageError;
}
/**
 * Factory function to create credential storage instances
 */
export declare function createCredentialStorage(config: StorageConfig): CredentialStorage;
//# sourceMappingURL=credential-storage.d.ts.map
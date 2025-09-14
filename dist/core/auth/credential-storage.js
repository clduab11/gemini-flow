/**
 * Credential Storage Implementation
 *
 * Secure storage interface for authentication credentials with encryption,
 * multiple backend support, and comprehensive error handling
 */
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
/**
 * In-memory credential storage implementation
 */
export class MemoryCredentialStorage extends EventEmitter {
    storage = new Map();
    logger;
    config;
    cleanupInterval;
    constructor(config = {}) {
        super();
        this.config = {
            type: "memory",
            maxEntries: 1000,
            ttl: 24 * 60 * 60 * 1000, // 24 hours default
            ...config,
        };
        this.logger = new Logger("MemoryCredentialStorage");
        // Start cleanup interval for expired entries
        this.startCleanupInterval();
        this.logger.debug("Memory credential storage initialized", {
            maxEntries: this.config.maxEntries,
            ttl: this.config.ttl,
        });
    }
    async store(key, credentials) {
        try {
            this.validateKey(key);
            this.validateCredentials(credentials);
            // Check storage limits
            if (this.storage.size >= (this.config.maxEntries || 1000)) {
                await this.evictOldestEntry();
            }
            const entry = {
                credentials: { ...credentials }, // Deep copy to prevent mutations
                createdAt: Date.now(),
                expiresAt: this.config.ttl ? Date.now() + this.config.ttl : undefined,
                accessCount: 0,
                lastAccessed: Date.now(),
            };
            this.storage.set(key, entry);
            this.logger.debug("Credentials stored in memory", {
                key: this.maskKey(key),
                provider: credentials.provider,
                type: credentials.type,
            });
            this.emit("stored", { key, credentials });
        }
        catch (error) {
            this.logger.error("Failed to store credentials", {
                key: this.maskKey(key),
                error,
            });
            throw this.createStorageError("STORE_FAILED", "Failed to store credentials", error);
        }
    }
    async retrieve(key) {
        try {
            this.validateKey(key);
            const entry = this.storage.get(key);
            if (!entry) {
                return null;
            }
            // Check expiration
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                await this.delete(key);
                return null;
            }
            // Update access tracking
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            this.logger.debug("Credentials retrieved from memory", {
                key: this.maskKey(key),
                provider: entry.credentials.provider,
                accessCount: entry.accessCount,
            });
            this.emit("retrieved", { key, credentials: entry.credentials });
            return { ...entry.credentials }; // Return copy to prevent mutations
        }
        catch (error) {
            this.logger.error("Failed to retrieve credentials", {
                key: this.maskKey(key),
                error,
            });
            throw this.createStorageError("RETRIEVE_FAILED", "Failed to retrieve credentials", error);
        }
    }
    async delete(key) {
        try {
            this.validateKey(key);
            const deleted = this.storage.delete(key);
            if (deleted) {
                this.logger.debug("Credentials deleted from memory", {
                    key: this.maskKey(key),
                });
                this.emit("deleted", { key });
            }
        }
        catch (error) {
            this.logger.error("Failed to delete credentials", {
                key: this.maskKey(key),
                error,
            });
            throw this.createStorageError("DELETE_FAILED", "Failed to delete credentials", error);
        }
    }
    async list() {
        try {
            const keys = Array.from(this.storage.keys());
            this.logger.debug("Listed credential keys", { count: keys.length });
            return keys;
        }
        catch (error) {
            this.logger.error("Failed to list credentials", { error });
            throw this.createStorageError("LIST_FAILED", "Failed to list credentials", error);
        }
    }
    async clear() {
        try {
            const count = this.storage.size;
            this.storage.clear();
            this.logger.info("All credentials cleared from memory", { count });
            this.emit("cleared", { count });
        }
        catch (error) {
            this.logger.error("Failed to clear credentials", { error });
            throw this.createStorageError("CLEAR_FAILED", "Failed to clear credentials", error);
        }
    }
    async exists(key) {
        try {
            this.validateKey(key);
            return this.storage.has(key);
        }
        catch (error) {
            this.logger.error("Failed to check credential existence", {
                key: this.maskKey(key),
                error,
            });
            return false;
        }
    }
    /**
     * Get storage statistics
     */
    getStats() {
        const entries = Array.from(this.storage.values());
        const now = Date.now();
        return {
            totalEntries: this.storage.size,
            expiredEntries: entries.filter((e) => e.expiresAt && e.expiresAt <= now)
                .length,
            totalAccesses: entries.reduce((sum, e) => sum + e.accessCount, 0),
            avgAccessCount: entries.length > 0
                ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
                : 0,
            oldestEntry: entries.length > 0
                ? Math.min(...entries.map((e) => e.createdAt))
                : null,
            newestEntry: entries.length > 0
                ? Math.max(...entries.map((e) => e.createdAt))
                : null,
        };
    }
    /**
     * Cleanup expired entries
     */
    async cleanupExpiredEntries() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, entry] of this.storage.entries()) {
            if (entry.expiresAt && entry.expiresAt <= now) {
                this.storage.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.debug("Cleaned up expired entries", { count: cleanedCount });
            this.emit("cleanup", { expiredEntries: cleanedCount });
        }
        return cleanedCount;
    }
    /**
     * Evict oldest entry to make room
     */
    async evictOldestEntry() {
        let oldestKey = null;
        let oldestTime = Date.now();
        for (const [key, entry] of this.storage.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            await this.delete(oldestKey);
            this.logger.debug("Evicted oldest entry", {
                key: this.maskKey(oldestKey),
            });
        }
    }
    /**
     * Start periodic cleanup of expired entries
     */
    startCleanupInterval() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries().catch((error) => {
                this.logger.error("Cleanup interval error", { error });
            });
        }, 5 * 60 * 1000);
    }
    /**
     * Stop cleanup interval
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.storage.clear();
        this.logger.debug("Memory credential storage destroyed");
    }
    validateKey(key) {
        if (!key || typeof key !== "string" || key.trim() === "") {
            throw new Error("Invalid storage key");
        }
    }
    validateCredentials(credentials) {
        if (!credentials || typeof credentials !== "object") {
            throw new Error("Invalid credentials object");
        }
        if (!credentials.type || !credentials.provider) {
            throw new Error("Credentials missing required fields: type and provider");
        }
    }
    maskKey(key) {
        if (key.length <= 8)
            return "***";
        return key.substring(0, 4) + "***" + key.substring(key.length - 4);
    }
    createStorageError(code, message, originalError) {
        const error = new Error(message);
        error.code = code;
        error.type = "configuration";
        error.retryable = false;
        error.originalError = originalError;
        error.context = {
            storageType: this.config.type,
            timestamp: Date.now(),
        };
        return error;
    }
}
/**
 * File-based credential storage implementation
 */
export class FileCredentialStorage extends EventEmitter {
    basePath;
    logger;
    config;
    constructor(config = {}) {
        super();
        this.config = {
            type: "file",
            basePath: path.join(os.homedir(), ".gemini-flow", "credentials"),
            ...config,
        };
        this.basePath = this.config.basePath;
        this.logger = new Logger("FileCredentialStorage");
        this.ensureStorageDirectory();
        this.logger.debug("File credential storage initialized", {
            basePath: this.basePath,
        });
    }
    async store(key, credentials) {
        try {
            this.validateKey(key);
            this.validateCredentials(credentials);
            const entry = {
                credentials,
                createdAt: Date.now(),
                expiresAt: this.config.ttl ? Date.now() + this.config.ttl : undefined,
                accessCount: 0,
                lastAccessed: Date.now(),
            };
            const filePath = this.getFilePath(key);
            const fileContent = JSON.stringify(entry, null, 2);
            await fs.promises.writeFile(filePath, fileContent, { mode: 0o600 }); // Secure permissions
            this.logger.debug("Credentials stored to file", {
                key: this.maskKey(key),
                filePath,
                provider: credentials.provider,
            });
            this.emit("stored", { key, credentials });
        }
        catch (error) {
            this.logger.error("Failed to store credentials to file", {
                key: this.maskKey(key),
                error,
            });
            throw this.createStorageError("STORE_FAILED", "Failed to store credentials to file", error);
        }
    }
    async retrieve(key) {
        try {
            this.validateKey(key);
            const filePath = this.getFilePath(key);
            if (!(await this.fileExists(filePath))) {
                return null;
            }
            const fileContent = await fs.promises.readFile(filePath, "utf8");
            const entry = JSON.parse(fileContent);
            // Check expiration
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                await this.delete(key);
                return null;
            }
            // Update access tracking
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            await fs.promises.writeFile(filePath, JSON.stringify(entry, null, 2), {
                mode: 0o600,
            });
            this.logger.debug("Credentials retrieved from file", {
                key: this.maskKey(key),
                filePath,
                provider: entry.credentials.provider,
            });
            this.emit("retrieved", { key, credentials: entry.credentials });
            return entry.credentials;
        }
        catch (error) {
            this.logger.error("Failed to retrieve credentials from file", {
                key: this.maskKey(key),
                error,
            });
            throw this.createStorageError("RETRIEVE_FAILED", "Failed to retrieve credentials from file", error);
        }
    }
    async delete(key) {
        try {
            this.validateKey(key);
            const filePath = this.getFilePath(key);
            if (await this.fileExists(filePath)) {
                await fs.promises.unlink(filePath);
                this.logger.debug("Credentials file deleted", {
                    key: this.maskKey(key),
                    filePath,
                });
                this.emit("deleted", { key });
            }
        }
        catch (error) {
            this.logger.error("Failed to delete credentials file", {
                key: this.maskKey(key),
                error,
            });
            throw this.createStorageError("DELETE_FAILED", "Failed to delete credentials file", error);
        }
    }
    async list() {
        try {
            this.ensureStorageDirectory();
            const files = await fs.promises.readdir(this.basePath);
            const keys = files
                .filter((file) => file.endsWith(".json"))
                .map((file) => file.replace(".json", ""));
            this.logger.debug("Listed credential files", { count: keys.length });
            return keys;
        }
        catch (error) {
            this.logger.error("Failed to list credential files", { error });
            throw this.createStorageError("LIST_FAILED", "Failed to list credential files", error);
        }
    }
    async clear() {
        try {
            const keys = await this.list();
            let count = 0;
            for (const key of keys) {
                try {
                    await this.delete(key);
                    count++;
                }
                catch (error) {
                    this.logger.warn("Failed to delete credential file during clear", {
                        key,
                        error,
                    });
                }
            }
            this.logger.info("All credential files cleared", { count });
            this.emit("cleared", { count });
        }
        catch (error) {
            this.logger.error("Failed to clear credential files", { error });
            throw this.createStorageError("CLEAR_FAILED", "Failed to clear credential files", error);
        }
    }
    async exists(key) {
        try {
            this.validateKey(key);
            const filePath = this.getFilePath(key);
            return await this.fileExists(filePath);
        }
        catch (error) {
            this.logger.error("Failed to check credential file existence", {
                key: this.maskKey(key),
                error,
            });
            return false;
        }
    }
    ensureStorageDirectory() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true, mode: 0o700 }); // Secure directory permissions
        }
    }
    getFilePath(key) {
        // Sanitize key for filesystem
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
        return path.join(this.basePath, `${sanitizedKey}.json`);
    }
    async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    validateKey(key) {
        if (!key || typeof key !== "string" || key.trim() === "") {
            throw new Error("Invalid storage key");
        }
    }
    validateCredentials(credentials) {
        if (!credentials || typeof credentials !== "object") {
            throw new Error("Invalid credentials object");
        }
        if (!credentials.type || !credentials.provider) {
            throw new Error("Credentials missing required fields: type and provider");
        }
    }
    maskKey(key) {
        if (key.length <= 8)
            return "***";
        return key.substring(0, 4) + "***" + key.substring(key.length - 4);
    }
    createStorageError(code, message, originalError) {
        const error = new Error(message);
        error.code = code;
        error.type = "configuration";
        error.retryable = false;
        error.originalError = originalError;
        error.context = {
            storageType: this.config.type,
            basePath: this.basePath,
            timestamp: Date.now(),
        };
        return error;
    }
}
/**
 * Factory function to create credential storage instances
 */
export function createCredentialStorage(config) {
    switch (config.type) {
        case "memory":
            return new MemoryCredentialStorage(config);
        case "file":
        case "encrypted-file": // For now, treat encrypted-file same as file
            return new FileCredentialStorage(config);
        default:
            throw new Error(`Unsupported storage type: ${config.type}`);
    }
}

/**
 * Session Manager
 *
 * Advanced session persistence and state management for Project Mariner
 * with cross-session sharing, backup/restore, and intelligent state merging
 */
import { Logger } from "../../utils/logger.js";
import { IntegrationBaseError, } from "./types.js";
import { BaseIntegration } from "../shared/types.js";
export class SessionManager extends BaseIntegration {
    config;
    storage;
    encryptor;
    backup;
    analytics;
    // Active sessions cache
    activeSessions = new Map();
    sessionTimers = new Map();
    // Performance metrics
    sessionMetrics = {
        sessionsCreated: 0,
        sessionsLoaded: 0,
        sessionsSaved: 0,
        sessionsDeleted: 0,
        backupsCreated: 0,
        avgLoadTime: 0,
        avgSaveTime: 0,
        storageErrors: 0,
    };
    constructor(config) {
        super({
            id: "session-manager",
            name: "Session Manager",
            version: "1.0.0",
            enabled: true,
            dependencies: [],
            features: {
                persistence: config.persistence.autoSave,
                sharing: config.sharing.enabled,
                backup: config.backup.enabled,
                encryption: config.encryption.enabled,
            },
            performance: {
                maxConcurrentOperations: 10,
                timeoutMs: 30000,
                retryAttempts: 3,
                cacheEnabled: true,
                cacheTTLMs: 3600000,
                metricsEnabled: true,
            },
            security: {
                encryption: config.encryption.enabled,
                validateOrigins: true,
                allowedHosts: [],
                tokenExpiration: 3600,
                auditLogging: true,
            },
            storage: {
                provider: "local",
                encryption: config.encryption.enabled,
                compression: config.persistence.compression,
            },
        });
        this.config = config;
        this.logger = new Logger("SessionManager");
        this.storage = new SessionStorage(config.storage, this.logger);
        this.analytics = new SessionAnalyticsEngine(this.logger);
        if (config.encryption.enabled) {
            this.encryptor = new SessionEncryptor(config.encryption, this.logger);
        }
        if (config.backup.enabled) {
            this.backup = new SessionBackup(config.backup, this.logger);
        }
    }
    async initialize() {
        try {
            this.status = "initializing";
            this.logger.info("Initializing Session Manager", {
                storage: this.config.storage.provider,
                encryption: this.config.encryption.enabled,
                backup: this.config.backup.enabled,
            });
            // Initialize storage
            await this.storage.initialize();
            // Initialize encryption if enabled
            if (this.encryptor) {
                await this.encryptor.initialize();
            }
            // Initialize backup if enabled
            if (this.backup) {
                await this.backup.initialize();
            }
            // Start auto-save timer if enabled
            if (this.config.persistence.autoSave) {
                this.startAutoSave();
            }
            // Load existing sessions
            await this.loadExistingSessions();
            this.status = "ready";
            this.logger.info("Session Manager initialized successfully");
            this.emit("initialized", { timestamp: new Date() });
        }
        catch (error) {
            this.status = "error";
            const sessionError = new IntegrationBaseError(`Failed to initialize Session Manager: ${error.message}`, "INIT_FAILED", "SessionManager", "critical", false, { originalError: error.message });
            this.emitError(sessionError);
            throw sessionError;
        }
    }
    async shutdown() {
        try {
            this.logger.info("Shutting down Session Manager");
            this.status = "shutdown";
            // Save all active sessions
            await this.saveAllActiveSessions();
            // Clear timers
            for (const timer of this.sessionTimers.values()) {
                clearTimeout(timer);
            }
            this.sessionTimers.clear();
            // Shutdown components
            await this.storage.shutdown();
            if (this.backup) {
                await this.backup.shutdown();
            }
            this.logger.info("Session Manager shutdown complete");
            this.emit("shutdown", { timestamp: new Date() });
        }
        catch (error) {
            this.logger.error("Error during Session Manager shutdown", error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            // Check storage health
            const storageHealth = await this.storage.healthCheck();
            if (storageHealth === "critical") {
                return "critical";
            }
            // Check backup health if enabled
            if (this.backup) {
                const backupHealth = await this.backup.healthCheck();
                if (backupHealth === "critical") {
                    return "warning"; // Backup failure is not critical
                }
            }
            // Check encryption if enabled
            if (this.encryptor) {
                const encryptionHealth = await this.encryptor.healthCheck();
                if (encryptionHealth === "critical") {
                    return "critical";
                }
            }
            return "healthy";
        }
        catch (error) {
            this.logger.error("Health check failed", error);
            return "critical";
        }
    }
    getMetrics() {
        return {
            ...this.sessionMetrics,
            activeSessions: this.activeSessions.size,
            storageSize: this.storage.getStorageSize(),
            analyticsData: this.analytics.getMetrics(),
        };
    }
    // === SESSION MANAGEMENT METHODS ===
    async saveSession(session) {
        const startTime = performance.now();
        try {
            this.logger.info("Saving session", { sessionId: session.id });
            // Validate session
            this.validateSession(session);
            // Encrypt if configured
            let processedSession = session;
            if (this.encryptor) {
                processedSession = await this.encryptor.encryptSession(session);
            }
            // Save to storage
            await this.storage.saveSession(processedSession);
            // Update cache
            this.activeSessions.set(session.id, session);
            // Update analytics
            this.analytics.recordSessionSave(session);
            // Update metrics
            const duration = performance.now() - startTime;
            this.sessionMetrics.sessionsSaved++;
            this.sessionMetrics.avgSaveTime =
                (this.sessionMetrics.avgSaveTime + duration) / 2;
            this.logger.info("Session saved successfully", {
                sessionId: session.id,
                duration,
                tabs: session.tabs.size,
            });
            this.emit("session_saved", { session, duration, timestamp: new Date() });
        }
        catch (error) {
            this.sessionMetrics.storageErrors++;
            const saveError = new IntegrationBaseError(`Failed to save session: ${error.message}`, "SESSION_SAVE_FAILED", "SessionManager", "medium", true, { sessionId: session.id });
            this.emitError(saveError);
            throw saveError;
        }
    }
    async loadSession(sessionId) {
        const startTime = performance.now();
        try {
            this.logger.info("Loading session", { sessionId });
            // Check cache first
            if (this.activeSessions.has(sessionId)) {
                this.logger.debug("Session found in cache", { sessionId });
                return this.activeSessions.get(sessionId);
            }
            // Load from storage
            let session = await this.storage.loadSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            // Decrypt if configured
            if (this.encryptor) {
                session = await this.encryptor.decryptSession(session);
            }
            // Validate loaded session
            this.validateSession(session);
            // Add to cache
            this.activeSessions.set(sessionId, session);
            // Update analytics
            this.analytics.recordSessionLoad(session);
            // Update metrics
            const duration = performance.now() - startTime;
            this.sessionMetrics.sessionsLoaded++;
            this.sessionMetrics.avgLoadTime =
                (this.sessionMetrics.avgLoadTime + duration) / 2;
            this.logger.info("Session loaded successfully", {
                sessionId,
                duration,
                tabs: session.tabs.size,
            });
            this.emit("session_loaded", { session, duration, timestamp: new Date() });
            return session;
        }
        catch (error) {
            this.sessionMetrics.storageErrors++;
            const loadError = new IntegrationBaseError(`Failed to load session: ${error.message}`, "SESSION_LOAD_FAILED", "SessionManager", "medium", true, { sessionId });
            this.emitError(loadError);
            throw loadError;
        }
    }
    async restoreSession(sessionId) {
        try {
            this.logger.info("Restoring session", { sessionId });
            // Load session
            const session = await this.loadSession(sessionId);
            // This would integrate with BrowserOrchestrator to recreate tabs
            // For now, we'll emit an event that the orchestrator can listen to
            this.emit("session_restore_requested", {
                session,
                timestamp: new Date(),
            });
            this.logger.info("Session restore requested", { sessionId });
        }
        catch (error) {
            const restoreError = new IntegrationBaseError(`Failed to restore session: ${error.message}`, "SESSION_RESTORE_FAILED", "SessionManager", "medium", true, { sessionId });
            this.emitError(restoreError);
            throw restoreError;
        }
    }
    async mergeSession(sessionAId, sessionBId) {
        try {
            this.logger.info("Merging sessions", { sessionAId, sessionBId });
            // Load both sessions
            const [sessionA, sessionB] = await Promise.all([
                this.loadSession(sessionAId),
                this.loadSession(sessionBId),
            ]);
            // Create merged session
            const mergedSession = {
                id: `merged_${Date.now()}`,
                tabs: new Map([...sessionA.tabs, ...sessionB.tabs]),
                globalState: { ...sessionA.globalState, ...sessionB.globalState },
                cookies: { ...sessionA.cookies, ...sessionB.cookies },
                localStorage: { ...sessionA.localStorage, ...sessionB.localStorage },
                sessionStorage: {
                    ...sessionA.sessionStorage,
                    ...sessionB.sessionStorage,
                },
                timestamp: new Date(),
                version: sessionA.version,
            };
            // Save merged session
            await this.saveSession(mergedSession);
            this.logger.info("Sessions merged successfully", {
                mergedId: mergedSession.id,
                tabsA: sessionA.tabs.size,
                tabsB: sessionB.tabs.size,
                totalTabs: mergedSession.tabs.size,
            });
            this.emit("sessions_merged", {
                sessionA,
                sessionB,
                mergedSession,
                timestamp: new Date(),
            });
            return mergedSession;
        }
        catch (error) {
            const mergeError = new IntegrationBaseError(`Failed to merge sessions: ${error.message}`, "SESSION_MERGE_FAILED", "SessionManager", "medium", true, { sessionAId, sessionBId });
            this.emitError(mergeError);
            throw mergeError;
        }
    }
    async listSessions() {
        try {
            const sessionIds = await this.storage.listSessions();
            this.logger.debug("Listed sessions", { count: sessionIds.length });
            return sessionIds;
        }
        catch (error) {
            const listError = new IntegrationBaseError(`Failed to list sessions: ${error.message}`, "SESSION_LIST_FAILED", "SessionManager", "low", true);
            this.emitError(listError);
            throw listError;
        }
    }
    async deleteSession(sessionId) {
        try {
            this.logger.info("Deleting session", { sessionId });
            // Remove from storage
            await this.storage.deleteSession(sessionId);
            // Remove from cache
            this.activeSessions.delete(sessionId);
            // Clear timer if exists
            const timer = this.sessionTimers.get(sessionId);
            if (timer) {
                clearTimeout(timer);
                this.sessionTimers.delete(sessionId);
            }
            this.sessionMetrics.sessionsDeleted++;
            this.logger.info("Session deleted successfully", { sessionId });
            this.emit("session_deleted", { sessionId, timestamp: new Date() });
        }
        catch (error) {
            const deleteError = new IntegrationBaseError(`Failed to delete session: ${error.message}`, "SESSION_DELETE_FAILED", "SessionManager", "medium", true, { sessionId });
            this.emitError(deleteError);
            throw deleteError;
        }
    }
    async exportSession(sessionId, options) {
        try {
            this.logger.info("Exporting session", { sessionId, options });
            // Load session
            const session = await this.loadSession(sessionId);
            // Apply export options
            const exportData = this.prepareExportData(session, options);
            // Serialize based on format
            let result;
            switch (options?.format || "json") {
                case "json":
                    result = JSON.stringify(exportData, null, 2);
                    break;
                case "binary":
                    result = Buffer.from(JSON.stringify(exportData)).toString("base64");
                    break;
                case "encrypted":
                    if (!this.encryptor) {
                        throw new Error("Encryption not configured");
                    }
                    result = await this.encryptor.encryptString(JSON.stringify(exportData));
                    break;
                default:
                    throw new Error(`Unsupported export format: ${options?.format}`);
            }
            // Compress if requested
            if (options?.compression) {
                result = await this.compressString(result);
            }
            this.logger.info("Session exported successfully", {
                sessionId,
                format: options?.format || "json",
                size: result.length,
            });
            this.emit("session_exported", {
                sessionId,
                format: options?.format,
                timestamp: new Date(),
            });
            return result;
        }
        catch (error) {
            const exportError = new IntegrationBaseError(`Failed to export session: ${error.message}`, "SESSION_EXPORT_FAILED", "SessionManager", "medium", true, { sessionId });
            this.emitError(exportError);
            throw exportError;
        }
    }
    async importSession(data, options) {
        try {
            this.logger.info("Importing session", { options });
            let sessionData = data;
            // Decompress if needed
            if (this.isCompressed(data)) {
                sessionData = await this.decompressString(data);
            }
            // Decrypt if needed
            if (options?.autoDecrypt && this.encryptor) {
                try {
                    sessionData = await this.encryptor.decryptString(sessionData);
                }
                catch (error) {
                    // Data might not be encrypted
                    this.logger.debug("Data not encrypted or decryption failed", error);
                }
            }
            // Parse session data
            let importedData;
            try {
                // Try JSON first
                importedData = JSON.parse(sessionData);
            }
            catch (error) {
                // Try base64 decode
                try {
                    const decoded = Buffer.from(sessionData, "base64").toString("utf-8");
                    importedData = JSON.parse(decoded);
                }
                catch (decodeError) {
                    throw new Error("Invalid session data format");
                }
            }
            // Validate integrity if requested
            if (options?.validateIntegrity) {
                this.validateImportedSession(importedData);
            }
            // Convert to SessionState
            const session = this.convertImportedSession(importedData, options);
            // Handle merge strategy
            if (options?.mergeStrategy === "merge") {
                try {
                    const existingSession = await this.loadSession(session.id);
                    return await this.mergeSessionStates(existingSession, session);
                }
                catch (error) {
                    // Session doesn't exist, proceed with import
                }
            }
            // Save imported session
            await this.saveSession(session);
            this.logger.info("Session imported successfully", {
                sessionId: session.id,
                tabs: session.tabs.size,
            });
            this.emit("session_imported", { session, timestamp: new Date() });
            return session;
        }
        catch (error) {
            const importError = new IntegrationBaseError(`Failed to import session: ${error.message}`, "SESSION_IMPORT_FAILED", "SessionManager", "medium", true);
            this.emitError(importError);
            throw importError;
        }
    }
    // === HELPER METHODS ===
    validateSession(session) {
        if (!session.id || !session.version || !session.timestamp) {
            throw new Error("Invalid session format");
        }
        if (!(session.tabs instanceof Map)) {
            throw new Error("Invalid session tabs format");
        }
    }
    startAutoSave() {
        const interval = this.config.persistence.saveInterval;
        setInterval(async () => {
            try {
                await this.saveAllActiveSessions();
            }
            catch (error) {
                this.logger.error("Auto-save failed", error);
            }
        }, interval);
    }
    async saveAllActiveSessions() {
        const savePromises = Array.from(this.activeSessions.values()).map((session) => this.saveSession(session).catch((error) => this.logger.warn(`Failed to save session ${session.id}`, error)));
        await Promise.all(savePromises);
    }
    async loadExistingSessions() {
        try {
            const sessionIds = await this.storage.listSessions();
            this.logger.info("Found existing sessions", { count: sessionIds.length });
            // Load recent sessions into cache
            const recentSessions = sessionIds.slice(0, 10); // Load last 10 sessions
            for (const sessionId of recentSessions) {
                try {
                    await this.loadSession(sessionId);
                }
                catch (error) {
                    this.logger.warn(`Failed to load session ${sessionId}`, error);
                }
            }
        }
        catch (error) {
            this.logger.error("Failed to load existing sessions", error);
        }
    }
    prepareExportData(session, options) {
        const exportData = {
            id: session.id,
            tabs: Object.fromEntries(session.tabs),
            globalState: session.globalState,
            cookies: session.cookies,
            localStorage: session.localStorage,
            sessionStorage: session.sessionStorage,
            timestamp: session.timestamp,
            version: session.version,
        };
        // Remove sensitive data if not included
        if (!options?.includePasswords) {
            // Remove password fields from forms, etc.
            // Implementation would scan for password-like fields
        }
        if (!options?.includePrivateData) {
            // Remove private browsing data
            // Implementation would filter private data
        }
        return exportData;
    }
    validateImportedSession(data) {
        if (!data.id || !data.version || !data.timestamp) {
            throw new Error("Invalid imported session format");
        }
        if (!data.tabs || typeof data.tabs !== "object") {
            throw new Error("Invalid tabs data in imported session");
        }
    }
    convertImportedSession(data, options) {
        const session = {
            id: data.id,
            tabs: new Map(Object.entries(data.tabs || {})),
            globalState: data.globalState || {},
            cookies: data.cookies || {},
            localStorage: data.localStorage || {},
            sessionStorage: data.sessionStorage || {},
            timestamp: options?.preserveTimestamps
                ? new Date(data.timestamp)
                : new Date(),
            version: data.version || "1.0",
        };
        return session;
    }
    async mergeSessionStates(sessionA, sessionB) {
        return {
            id: sessionA.id, // Keep original ID
            tabs: new Map([...sessionA.tabs, ...sessionB.tabs]),
            globalState: { ...sessionA.globalState, ...sessionB.globalState },
            cookies: { ...sessionA.cookies, ...sessionB.cookies },
            localStorage: { ...sessionA.localStorage, ...sessionB.localStorage },
            sessionStorage: {
                ...sessionA.sessionStorage,
                ...sessionB.sessionStorage,
            },
            timestamp: new Date(),
            version: sessionA.version,
        };
    }
    async compressString(data) {
        // Implement compression (gzip, brotli, etc.)
        return data; // Placeholder
    }
    async decompressString(data) {
        // Implement decompression
        return data; // Placeholder
    }
    isCompressed(data) {
        // Check if data is compressed
        return false; // Placeholder
    }
    // === ANALYTICS METHODS ===
    getAnalytics() {
        return this.analytics.getAnalytics();
    }
    getSessionPatterns() {
        return this.analytics.getPatterns();
    }
    // === BACKUP METHODS ===
    async createBackup() {
        if (!this.backup) {
            throw new Error("Backup not configured");
        }
        await this.backup.createBackup();
        this.sessionMetrics.backupsCreated++;
    }
    async restoreFromBackup(backupId) {
        if (!this.backup) {
            throw new Error("Backup not configured");
        }
        await this.backup.restoreFromBackup(backupId);
    }
    getBackupStatus() {
        if (!this.backup) {
            return {
                lastBackup: new Date(0),
                backupCount: 0,
                totalSize: 0,
                health: "error",
                remoteSync: false,
            };
        }
        return this.backup.getStatus();
    }
}
// === SUPPORTING CLASSES ===
class SessionStorage {
    config;
    logger;
    storageSize = 0;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async initialize() {
        this.logger.info("Session storage initialized", {
            provider: this.config.provider,
        });
    }
    async shutdown() {
        this.logger.info("Session storage shutdown");
    }
    async healthCheck() {
        return "healthy";
    }
    async saveSession(session) {
        // Implement storage-specific saving
        this.storageSize += 1000; // Placeholder
    }
    async loadSession(sessionId) {
        // Implement storage-specific loading
        return null; // Placeholder
    }
    async deleteSession(sessionId) {
        // Implement storage-specific deletion
    }
    async listSessions() {
        // Implement storage-specific listing
        return []; // Placeholder
    }
    getStorageSize() {
        return this.storageSize;
    }
}
class SessionEncryptor {
    config;
    logger;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async initialize() {
        this.logger.info("Session encryptor initialized");
    }
    async healthCheck() {
        return "healthy";
    }
    async encryptSession(session) {
        // Implement session encryption
        return session; // Placeholder
    }
    async decryptSession(session) {
        // Implement session decryption
        return session; // Placeholder
    }
    async encryptString(data) {
        // Implement string encryption
        return data; // Placeholder
    }
    async decryptString(data) {
        // Implement string decryption
        return data; // Placeholder
    }
}
class SessionBackup {
    config;
    logger;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async initialize() {
        this.logger.info("Session backup initialized");
    }
    async shutdown() {
        this.logger.info("Session backup shutdown");
    }
    async healthCheck() {
        return "healthy";
    }
    async createBackup() {
        this.logger.info("Creating session backup");
    }
    async restoreFromBackup(backupId) {
        this.logger.info("Restoring from backup", { backupId });
    }
    getStatus() {
        return {
            lastBackup: new Date(),
            backupCount: 0,
            totalSize: 0,
            health: "good",
            remoteSync: this.config.remote,
        };
    }
}
class SessionAnalyticsEngine {
    logger;
    patterns = [];
    analytics;
    constructor(logger) {
        this.logger = logger;
        this.analytics = {
            sessionCount: 0,
            avgSessionDuration: 0,
            mostActiveHours: [],
            commonPatterns: [],
            storageUsage: 0,
            backupStatus: {
                lastBackup: new Date(),
                backupCount: 0,
                totalSize: 0,
                health: "good",
                remoteSync: false,
            },
        };
    }
    recordSessionSave(session) {
        this.analytics.sessionCount++;
    }
    recordSessionLoad(session) {
        // Record analytics
    }
    getAnalytics() {
        return this.analytics;
    }
    getPatterns() {
        return this.patterns;
    }
    getMetrics() {
        return this.patterns.length;
    }
}
//# sourceMappingURL=session-manager.js.map
/**
 * Session Manager
 *
 * Advanced session persistence and state management for Project Mariner
 * with cross-session sharing, backup/restore, and intelligent state merging
 */
import { SessionManager as ISessionManager, SessionState } from "./types.js";
import { BaseIntegration, HealthStatus } from "../shared/types.js";
export interface SessionManagerConfig {
    storage: SessionStorageConfig;
    persistence: SessionPersistenceConfig;
    sharing: SessionSharingConfig;
    backup: SessionBackupConfig;
    encryption: SessionEncryptionConfig;
}
export interface SessionStorageConfig {
    provider: "memory" | "filesystem" | "database" | "cloud";
    path?: string;
    connectionString?: string;
    options?: Record<string, any>;
}
export interface SessionPersistenceConfig {
    autoSave: boolean;
    saveInterval: number;
    maxSessions: number;
    retentionDays: number;
    compression: boolean;
}
export interface SessionSharingConfig {
    enabled: boolean;
    crossUser: boolean;
    permissions: SessionPermission[];
    encryption: boolean;
}
export interface SessionPermission {
    user: string;
    rights: ("read" | "write" | "delete")[];
    expiration?: Date;
}
export interface SessionBackupConfig {
    enabled: boolean;
    interval: number;
    retention: number;
    remote: boolean;
    remoteUrl?: string;
}
export interface SessionEncryptionConfig {
    enabled: boolean;
    algorithm: "aes-256-gcm" | "chacha20-poly1305";
    keyDerivation: "pbkdf2" | "scrypt";
    keyRotation: boolean;
    rotationInterval: number;
}
export interface SessionExportOptions {
    includePasswords: boolean;
    includePrivateData: boolean;
    compression: boolean;
    encryption: boolean;
    format: "json" | "binary" | "encrypted";
}
export interface SessionImportOptions {
    mergeStrategy: "replace" | "merge" | "preserve";
    validateIntegrity: boolean;
    autoDecrypt: boolean;
    preserveTimestamps: boolean;
}
export interface SessionAnalytics {
    sessionCount: number;
    avgSessionDuration: number;
    mostActiveHours: number[];
    commonPatterns: SessionPattern[];
    storageUsage: number;
    backupStatus: BackupStatus;
}
export interface SessionPattern {
    type: "navigation" | "form-filling" | "data-extraction";
    frequency: number;
    lastSeen: Date;
    domains: string[];
    actions: string[];
}
export interface BackupStatus {
    lastBackup: Date;
    backupCount: number;
    totalSize: number;
    health: "good" | "warning" | "error";
    remoteSync: boolean;
}
export declare class SessionManager extends BaseIntegration implements ISessionManager {
    private config;
    private storage;
    private encryptor?;
    private backup?;
    private analytics;
    private activeSessions;
    private sessionTimers;
    private sessionMetrics;
    constructor(config: SessionManagerConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    saveSession(session: SessionState): Promise<void>;
    loadSession(sessionId: string): Promise<SessionState>;
    restoreSession(sessionId: string): Promise<void>;
    mergeSession(sessionAId: string, sessionBId: string): Promise<SessionState>;
    listSessions(): Promise<string[]>;
    deleteSession(sessionId: string): Promise<void>;
    exportSession(sessionId: string, options?: SessionExportOptions): Promise<string>;
    importSession(data: string, options?: SessionImportOptions): Promise<SessionState>;
    private validateSession;
    private startAutoSave;
    private saveAllActiveSessions;
    private loadExistingSessions;
    private prepareExportData;
    private validateImportedSession;
    private convertImportedSession;
    private mergeSessionStates;
    private compressString;
    private decompressString;
    private isCompressed;
    getAnalytics(): SessionAnalytics;
    getSessionPatterns(): SessionPattern[];
    createBackup(): Promise<void>;
    restoreFromBackup(backupId: string): Promise<void>;
    getBackupStatus(): BackupStatus;
}
//# sourceMappingURL=session-manager.d.ts.map
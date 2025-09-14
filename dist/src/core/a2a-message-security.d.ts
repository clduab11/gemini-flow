/**
 * A2A Message Security System
 *
 * Implements comprehensive message-level security for agent-to-agent communication:
 * - Digital signatures with ECDSA, RSA, and post-quantum algorithms
 * - Message encryption with AES-256-GCM and ChaCha20-Poly1305
 * - Replay attack prevention with nonce tracking and timestamps
 * - Message integrity verification with HMAC and Merkle trees
 * - Forward secrecy with ephemeral keys
 * - Message authentication codes (MAC) for integrity
 * - Anti-tampering with cryptographic checksums
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface SecureMessage {
    messageId: string;
    version: "1.0";
    header: {
        from: string;
        to: string | string[];
        timestamp: number;
        messageType: "request" | "response" | "broadcast" | "gossip" | "heartbeat";
        priority: "low" | "medium" | "high" | "critical";
        ttl?: number;
        replyTo?: string;
        correlationId?: string;
        sessionId?: string;
    };
    security: {
        nonce: string;
        sequence: number;
        algorithm: "ECDSA" | "RSA" | "Ed25519" | "Dilithium";
        encryption: "AES-256-GCM" | "ChaCha20-Poly1305" | "none";
        compression?: "gzip" | "brotli" | "none";
        signature: string;
        mac: string;
        keyId: string;
    };
    payload: {
        encrypted: boolean;
        data: string;
        checksum: string;
        size: number;
    };
    routing: {
        path?: string[];
        hops?: number;
        maxHops?: number;
        forwardingRules?: any;
    };
}
export interface MessageSecurityConfig {
    defaultEncryption: "AES-256-GCM" | "ChaCha20-Poly1305" | "none";
    defaultSigningAlgorithm: "ECDSA" | "RSA" | "Ed25519";
    requireEncryption: boolean;
    requireSignature: boolean;
    maxMessageSize: number;
    maxTTL: number;
    enableCompression: boolean;
    enableForwardSecrecy: boolean;
    replayProtection: {
        enabled: boolean;
        windowSize: number;
        maxNonceAge: number;
        nonceStoreSize: number;
    };
    integrityChecks: {
        enableHMAC: boolean;
        enableChecksum: boolean;
        enableMerkleProof: boolean;
    };
}
export interface NonceRecord {
    nonce: string;
    agentId: string;
    timestamp: number;
    messageId: string;
    used: boolean;
}
export interface MessageSecurityMetrics {
    messagesProcessed: number;
    messagesEncrypted: number;
    messagesDecrypted: number;
    messagesSigned: number;
    messagesVerified: number;
    replayAttemptsBlocked: number;
    integrityFailures: number;
    encryptionFailures: number;
    signatureFailures: number;
    performanceStats: {
        avgEncryptionTime: number;
        avgDecryptionTime: number;
        avgSigningTime: number;
        avgVerificationTime: number;
    };
}
export declare class A2AMessageSecurity extends EventEmitter {
    private logger;
    private cache;
    private config;
    private nonceStore;
    private sequenceNumbers;
    private keyCache;
    private sessionKeys;
    private metrics;
    private ephemeralKeys;
    constructor(config?: Partial<MessageSecurityConfig>);
    /**
     * Initialize security configuration
     */
    private initializeConfig;
    /**
     * Sign and encrypt a message for secure transmission
     */
    secureMessage(message: any, fromAgentId: string, toAgentId: string | string[], options?: {
        messageType?: "request" | "response" | "broadcast" | "gossip" | "heartbeat";
        priority?: "low" | "medium" | "high" | "critical";
        ttl?: number;
        replyTo?: string;
        correlationId?: string;
        sessionId?: string;
        encryption?: "AES-256-GCM" | "ChaCha20-Poly1305" | "none";
        compression?: "gzip" | "brotli" | "none";
        enableForwardSecrecy?: boolean;
    }): Promise<SecureMessage>;
    /**
     * Verify and decrypt a received secure message
     */
    verifyMessage(secureMessage: SecureMessage, receivingAgentId: string): Promise<{
        valid: boolean;
        payload?: any;
        metadata?: {
            fromAgent: string;
            timestamp: number;
            messageType: string;
            verified: boolean;
            decrypted: boolean;
            integrity: boolean;
        };
        errors?: string[];
    }>;
    /**
     * Encrypt message payload
     */
    private encryptPayload;
    /**
     * Decrypt message payload
     */
    private decryptPayload;
    /**
     * Sign message with digital signature
     */
    private signMessage;
    /**
     * Verify message signature
     */
    private verifySignature;
    /**
     * Generate HMAC for message integrity
     */
    private generateHMAC;
    /**
     * Verify HMAC integrity
     */
    private verifyHMAC;
    /**
     * Check for replay attacks
     */
    private checkReplayAttack;
    /**
     * Store nonce for replay protection
     */
    private storeNonce;
    /**
     * Get or create ephemeral key for forward secrecy
     */
    private getOrCreateEphemeralKey;
    /**
     * Get sequence number for message ordering
     */
    private getNextSequenceNumber;
    /**
     * Compression and decompression helpers
     */
    private compressData;
    private decompressData;
    /**
     * Key management helpers
     */
    private getEncryptionKey;
    private getSigningKey;
    private getPublicKey;
    private getMACKey;
    /**
     * Maintenance and monitoring
     */
    private startMaintenanceTasks;
    private cleanupOldNonces;
    private cleanupEphemeralKeys;
    private persistSequenceNumbers;
    private startPerformanceMonitoring;
    private updatePerformanceMetrics;
    private emitPerformanceMetrics;
    /**
     * Public API methods
     */
    getMetrics(): MessageSecurityMetrics;
    getConfig(): MessageSecurityConfig;
    updateConfig(updates: Partial<MessageSecurityConfig>): Promise<void>;
    getNonceStoreStatus(): {
        size: number;
        maxSize: number;
        oldestNonce?: {
            nonce: string;
            age: number;
        };
    };
    clearNonceStore(): Promise<void>;
    rotateEphemeralKeys(): Promise<void>;
}
//# sourceMappingURL=a2a-message-security.d.ts.map
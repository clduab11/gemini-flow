/**
 * A2A Secure Key Exchange System
 *
 * Implements advanced cryptographic protocols for secure key exchange:
 * - Elliptic Curve Diffie-Hellman (ECDH) with P-384
 * - Post-quantum cryptography preparation (Kyber, Dilithium)
 * - Distributed key generation and management
 * - Automated key rotation with forward secrecy
 * - Key derivation functions (HKDF, PBKDF2)
 * - Hardware Security Module (HSM) integration ready
 * - Certificate-based authentication with PKI
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface KeyPairInfo {
    keyId: string;
    algorithm: "ECDH" | "RSA" | "Kyber" | "Dilithium";
    curve?: "secp256r1" | "secp384r1" | "secp521r1";
    keySize?: number;
    publicKey: string;
    privateKey?: string;
    createdAt: Date;
    expiresAt: Date;
    status: "active" | "rotating" | "revoked" | "expired";
    usageCount: number;
    maxUsage: number;
}
export interface KeyExchangeRequest {
    requestId: string;
    fromAgentId: string;
    toAgentId: string;
    publicKey: string;
    algorithm: string;
    curve?: string;
    nonce: string;
    timestamp: number;
    signature: string;
    capabilities: string[];
}
export interface KeyExchangeResponse {
    requestId: string;
    responseId: string;
    fromAgentId: string;
    toAgentId: string;
    publicKey: string;
    algorithm: string;
    curve?: string;
    nonce: string;
    timestamp: number;
    signature: string;
    agreed: boolean;
    sharedSecretHash?: string;
}
export interface SharedSecret {
    secretId: string;
    agentPair: [string, string];
    sharedSecret: Buffer;
    derivedKeys: {
        encryptionKey: Buffer;
        macKey: Buffer;
        signingKey: Buffer;
    };
    createdAt: Date;
    expiresAt: Date;
    rotationScheduled: Date;
    usageCount: number;
    maxUsage: number;
}
export interface KeyRotationPolicy {
    automaticRotation: boolean;
    rotationInterval: number;
    maxKeyUsage: number;
    keyLifetime: number;
    preRotationWarning: number;
    emergencyRotation: boolean;
    quantumSafeTransition: boolean;
}
export interface DistributedKeyShare {
    shareId: string;
    threshold: number;
    totalShares: number;
    shareIndex: number;
    encryptedShare: string;
    publicCommitment: string;
    verificationProof: string;
    createdAt: Date;
}
export interface HSMConfig {
    enabled: boolean;
    provider: "PKCS11" | "CloudHSM" | "Azure" | "Google";
    endpoint?: string;
    credentials?: any;
    keyGeneration: boolean;
    keyStorage: boolean;
    signing: boolean;
}
export declare class A2AKeyExchange extends EventEmitter {
    private logger;
    private cache;
    private keyPairs;
    private sharedSecrets;
    private distributedShares;
    private pendingExchanges;
    private completedExchanges;
    private rotationPolicy;
    private hsmConfig;
    private masterKeyPair;
    private certificateChain;
    private trustedCAs;
    private metrics;
    constructor(options?: {
        rotationPolicy?: Partial<KeyRotationPolicy>;
        hsmConfig?: Partial<HSMConfig>;
        trustedCAs?: string[];
    });
    /**
     * Initialize key rotation policy
     */
    private initializeRotationPolicy;
    /**
     * Initialize HSM configuration
     */
    private initializeHSMConfig;
    /**
     * Initialize trusted Certificate Authorities
     */
    private initializeTrustedCAs;
    /**
     * Initialize master key pairs
     */
    private initializeMasterKeys;
    /**
     * Generate agent-specific key pair
     */
    generateAgentKeyPair(agentId: string, algorithm?: "ECDH" | "RSA" | "Kyber", curve?: "secp256r1" | "secp384r1" | "secp521r1"): Promise<KeyPairInfo>;
    /**
     * Initiate key exchange between two agents
     */
    initiateKeyExchange(fromAgentId: string, toAgentId: string, capabilities?: string[]): Promise<KeyExchangeRequest>;
    /**
     * Respond to key exchange request
     */
    respondToKeyExchange(request: KeyExchangeRequest, accept?: boolean): Promise<KeyExchangeResponse>;
    /**
     * Get shared secret for agent pair
     */
    getSharedSecret(agentId1: string, agentId2: string): Promise<SharedSecret | null>;
    /**
     * Rotate keys for an agent
     */
    rotateAgentKeys(agentId: string, emergencyRotation?: boolean): Promise<KeyPairInfo>;
    /**
     * Generate distributed key shares using Shamir's Secret Sharing
     */
    generateDistributedKeyShares(secretData: Buffer, threshold: number, totalShares: number): Promise<DistributedKeyShare[]>;
    /**
     * Reconstruct secret from distributed shares
     */
    reconstructSecretFromShares(shares: DistributedKeyShare[]): Promise<Buffer>;
    /**
     * Cryptographic helper methods
     */
    private generateSoftwareKeyPair;
    private generateHSMKeyPair;
    private performECDH;
    private deriveSessionKeys;
    private signKeyExchangeRequest;
    private signKeyExchangeResponse;
    private verifyKeyExchangeRequest;
    private getAgentKeyPair;
    private getPrivateKey;
    private getHSMPrivateKey;
    private updateSharedSecretsForAgent;
    /**
     * Shamir's Secret Sharing implementation
     */
    private generateShamirPolynomial;
    private evaluatePolynomial;
    private lagrangeInterpolation;
    private encryptShare;
    private decryptShare;
    private generateCommitment;
    private generateVerificationProof;
    private verifyShare;
    /**
     * System management methods
     */
    private loadSystemCAs;
    private startKeyRotationScheduler;
    private checkAndRotateKeys;
    private rotateSharedSecret;
    private startPerformanceMonitoring;
    private updatePerformanceMetrics;
    /**
     * Public API methods
     */
    getKeyPairs(): KeyPairInfo[];
    getSharedSecrets(): Omit<SharedSecret, "sharedSecret" | "derivedKeys">[];
    getMetrics(): {
        keyGenerations: number;
        keyExchanges: number;
        keyRotations: number;
        failedExchanges: number;
        hsmOperations: number;
    };
    getRotationPolicy(): KeyRotationPolicy;
    updateRotationPolicy(updates: Partial<KeyRotationPolicy>): Promise<void>;
    emergencyKeyRotation(agentId?: string): Promise<void>;
}
//# sourceMappingURL=a2a-key-exchange.d.ts.map
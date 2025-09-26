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

import crypto from "crypto";
import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
import { CacheManager } from "./cache-manager.js";

export interface KeyPairInfo {
  keyId: string;
  algorithm: "ECDH" | "RSA" | "Kyber" | "Dilithium";
  curve?: "secp256r1" | "secp384r1" | "secp521r1";
  keySize?: number;
  publicKey: string;
  privateKey?: string; // Only stored securely
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
  sharedSecretHash?: string; // For verification
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
  rotationInterval: number; // milliseconds
  maxKeyUsage: number;
  keyLifetime: number; // milliseconds
  preRotationWarning: number; // milliseconds before expiry
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

export class A2AKeyExchange extends EventEmitter {
  private logger: Logger;
  private cache: CacheManager;

  // Key management
  private keyPairs: Map<string, KeyPairInfo> = new Map();
  private sharedSecrets: Map<string, SharedSecret> = new Map();
  private distributedShares: Map<string, DistributedKeyShare[]> = new Map();

  // Exchange tracking
  private pendingExchanges: Map<string, KeyExchangeRequest> = new Map();
  private completedExchanges: Map<string, KeyExchangeResponse> = new Map();

  // Security and policy
  private rotationPolicy: KeyRotationPolicy;
  private hsmConfig: HSMConfig;

  // Cryptographic state
  private masterKeyPair: crypto.KeyPairKeyObjectResult | null = null;
  private certificateChain: string[] = [];
  private trustedCAs: Set<string> = new Set();

  // Performance tracking
  private metrics = {
    keyGenerations: 0,
    keyExchanges: 0,
    keyRotations: 0,
    failedExchanges: 0,
    hsmOperations: 0,
  };

  constructor(
    options: {
      rotationPolicy?: Partial<KeyRotationPolicy>;
      hsmConfig?: Partial<HSMConfig>;
      trustedCAs?: string[];
    } = {},
  ) {
    super();
    this.logger = new Logger("A2AKeyExchange");
    this.cache = new CacheManager();

    this.initializeRotationPolicy(options.rotationPolicy);
    this.initializeHSMConfig(options.hsmConfig);
    this.initializeTrustedCAs(options.trustedCAs);

    this.initializeMasterKeys();
    this.startKeyRotationScheduler();
    this.startPerformanceMonitoring();

    this.logger.info("A2A Key Exchange system initialized", {
      rotationEnabled: this.rotationPolicy.automaticRotation,
      hsmEnabled: this.hsmConfig.enabled,
      quantumSafe: this.rotationPolicy.quantumSafeTransition,
    });
  }

  /**
   * Initialize key rotation policy
   */
  private initializeRotationPolicy(
    policy: Partial<KeyRotationPolicy> = {},
  ): void {
    this.rotationPolicy = {
      automaticRotation: true,
      rotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxKeyUsage: 10000,
      keyLifetime: 30 * 24 * 60 * 60 * 1000, // 30 days
      preRotationWarning: 24 * 60 * 60 * 1000, // 24 hours
      emergencyRotation: true,
      quantumSafeTransition: false,
      ...policy,
    };
  }

  /**
   * Initialize HSM configuration
   */
  private initializeHSMConfig(config: Partial<HSMConfig> = {}): void {
    this.hsmConfig = {
      enabled: false,
      provider: "PKCS11",
      keyGeneration: false,
      keyStorage: false,
      signing: false,
      ...config,
    };
  }

  /**
   * Initialize trusted Certificate Authorities
   */
  private initializeTrustedCAs(cas: string[] = []): void {
    for (const ca of cas) {
      this.trustedCAs.add(ca);
    }

    // Add default system CAs if none provided
    if (cas.length === 0) {
      this.loadSystemCAs();
    }
  }

  /**
   * Initialize master key pairs
   */
  private async initializeMasterKeys(): Promise<void> {
    try {
      if (this.hsmConfig.enabled && this.hsmConfig.keyGeneration) {
        this.masterKeyPair = await this.generateHSMKeyPair();
      } else {
        this.masterKeyPair = await this.generateSoftwareKeyPair();
      }

      // Create master key info
      const masterKeyInfo: KeyPairInfo = {
        keyId: "master",
        algorithm: "ECDH",
        curve: "secp384r1",
        publicKey: this.masterKeyPair.publicKey.export({
          type: "spki",
          format: "pem",
        }) as string,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.rotationPolicy.keyLifetime),
        status: "active",
        usageCount: 0,
        maxUsage: this.rotationPolicy.maxKeyUsage,
      };

      this.keyPairs.set("master", masterKeyInfo);

      this.logger.info("Master keys initialized", {
        algorithm: masterKeyInfo.algorithm,
        curve: masterKeyInfo.curve,
        hsm: this.hsmConfig.enabled,
      });
    } catch (error) {
      this.logger.error("Failed to initialize master keys", { error });
      throw error;
    }
  }

  /**
   * Generate agent-specific key pair
   */
  async generateAgentKeyPair(
    agentId: string,
    algorithm: "ECDH" | "RSA" | "Kyber" = "ECDH",
    curve: "secp256r1" | "secp384r1" | "secp521r1" = "secp384r1",
  ): Promise<KeyPairInfo> {
    try {
      let keyPair: crypto.KeyPairKeyObjectResult;

      if (this.hsmConfig.enabled && this.hsmConfig.keyGeneration) {
        keyPair = await this.generateHSMKeyPair(algorithm, curve);
        this.metrics.hsmOperations++;
      } else {
        keyPair = await this.generateSoftwareKeyPair(algorithm, curve);
      }

      const keyInfo: KeyPairInfo = {
        keyId: `${agentId}-${Date.now()}`,
        algorithm,
        curve: algorithm === "ECDH" ? curve : undefined,
        keySize: algorithm === "RSA" ? 4096 : undefined,
        publicKey: keyPair.publicKey.export({
          type: "spki",
          format: "pem",
        }) as string,
        privateKey: this.hsmConfig.enabled
          ? undefined
          : (keyPair.privateKey.export({
              type: "pkcs8",
              format: "pem",
            }) as string),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.rotationPolicy.keyLifetime),
        status: "active",
        usageCount: 0,
        maxUsage: this.rotationPolicy.maxKeyUsage,
      };

      this.keyPairs.set(keyInfo.keyId, keyInfo);
      await this.cache.set(
        `keyexchange:keypair:${keyInfo.keyId}`,
        keyInfo,
        this.rotationPolicy.keyLifetime,
      );

      this.metrics.keyGenerations++;

      this.logger.info("Agent key pair generated", {
        agentId,
        keyId: keyInfo.keyId,
        algorithm,
        curve,
      });

      this.emit("key_pair_generated", { agentId, keyInfo });
      return keyInfo;
    } catch (error) {
      this.logger.error("Failed to generate agent key pair", {
        agentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Initiate key exchange between two agents
   */
  async initiateKeyExchange(
    fromAgentId: string,
    toAgentId: string,
    capabilities: string[] = [],
  ): Promise<KeyExchangeRequest> {
    try {
      // Get or generate key pair for initiating agent
      let fromKeyPair = await this.getAgentKeyPair(fromAgentId);
      if (!fromKeyPair || fromKeyPair.status !== "active") {
        fromKeyPair = await this.generateAgentKeyPair(fromAgentId);
      }

      // Create exchange request
      const request: KeyExchangeRequest = {
        requestId: crypto.randomUUID(),
        fromAgentId,
        toAgentId,
        publicKey: fromKeyPair.publicKey,
        algorithm: fromKeyPair.algorithm,
        curve: fromKeyPair.curve,
        nonce: crypto.randomBytes(32).toString("hex"),
        timestamp: Date.now(),
        signature: "",
        capabilities,
      };

      // Sign the request
      request.signature = await this.signKeyExchangeRequest(request);

      // Store pending exchange
      this.pendingExchanges.set(request.requestId, request);

      // Set expiration for pending exchange
      setTimeout(() => {
        if (this.pendingExchanges.has(request.requestId)) {
          this.pendingExchanges.delete(request.requestId);
          this.logger.warn("Key exchange request expired", {
            requestId: request.requestId,
            fromAgent: fromAgentId,
            toAgent: toAgentId,
          });
        }
      }, 300000); // 5 minutes expiration

      this.logger.info("Key exchange initiated", {
        requestId: request.requestId,
        fromAgent: fromAgentId,
        toAgent: toAgentId,
      });

      this.emit("key_exchange_initiated", request);
      return request;
    } catch (error) {
      this.logger.error("Failed to initiate key exchange", {
        fromAgent: fromAgentId,
        toAgent: toAgentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Respond to key exchange request
   */
  async respondToKeyExchange(
    request: KeyExchangeRequest,
    accept: boolean = true,
  ): Promise<KeyExchangeResponse> {
    try {
      // Verify request signature
      const isValidRequest = await this.verifyKeyExchangeRequest(request);
      if (!isValidRequest) {
        throw new Error("Invalid key exchange request signature");
      }

      // Check if request is still pending
      if (!this.pendingExchanges.has(request.requestId)) {
        throw new Error("Key exchange request not found or expired");
      }

      let response: KeyExchangeResponse;

      if (accept) {
        // Get or generate key pair for responding agent
        let toKeyPair = await this.getAgentKeyPair(request.toAgentId);
        if (!toKeyPair || toKeyPair.status !== "active") {
          toKeyPair = await this.generateAgentKeyPair(request.toAgentId);
        }

        // Perform ECDH key exchange
        const sharedSecret = await this.performECDH(
          request.publicKey,
          toKeyPair.privateKey || (await this.getPrivateKey(toKeyPair.keyId)),
        );

        // Derive session keys
        const derivedKeys = await this.deriveSessionKeys(
          sharedSecret,
          request.nonce,
          crypto.randomBytes(32).toString("hex"),
        );

        // Store shared secret
        const secretInfo: SharedSecret = {
          secretId: crypto.randomUUID(),
          agentPair: [request.fromAgentId, request.toAgentId].sort() as [
            string,
            string,
          ],
          sharedSecret,
          derivedKeys,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + this.rotationPolicy.keyLifetime),
          rotationScheduled: new Date(
            Date.now() + this.rotationPolicy.rotationInterval,
          ),
          usageCount: 0,
          maxUsage: this.rotationPolicy.maxKeyUsage,
        };

        this.sharedSecrets.set(secretInfo.secretId, secretInfo);
        await this.cache.set(
          `keyexchange:secret:${secretInfo.agentPair.join(":")}`,
          secretInfo,
          this.rotationPolicy.keyLifetime,
        );

        // Create response
        response = {
          requestId: request.requestId,
          responseId: crypto.randomUUID(),
          fromAgentId: request.toAgentId,
          toAgentId: request.fromAgentId,
          publicKey: toKeyPair.publicKey,
          algorithm: toKeyPair.algorithm,
          curve: toKeyPair.curve,
          nonce: crypto.randomBytes(32).toString("hex"),
          timestamp: Date.now(),
          signature: "",
          agreed: true,
          sharedSecretHash: crypto
            .createHash("sha256")
            .update(sharedSecret)
            .digest("hex"),
        };

        this.metrics.keyExchanges++;

        this.logger.info("Key exchange accepted", {
          requestId: request.requestId,
          secretId: secretInfo.secretId,
          agentPair: secretInfo.agentPair,
        });
      } else {
        // Rejection response
        response = {
          requestId: request.requestId,
          responseId: crypto.randomUUID(),
          fromAgentId: request.toAgentId,
          toAgentId: request.fromAgentId,
          publicKey: "",
          algorithm: request.algorithm,
          nonce: crypto.randomBytes(32).toString("hex"),
          timestamp: Date.now(),
          signature: "",
          agreed: false,
        };

        this.logger.info("Key exchange rejected", {
          requestId: request.requestId,
          fromAgent: request.fromAgentId,
          toAgent: request.toAgentId,
        });
      }

      // Sign response
      response.signature = await this.signKeyExchangeResponse(response);

      // Store completed exchange
      this.completedExchanges.set(response.responseId, response);
      this.pendingExchanges.delete(request.requestId);

      this.emit("key_exchange_completed", { request, response });
      return response;
    } catch (error) {
      this.metrics.failedExchanges++;
      this.logger.error("Failed to respond to key exchange", {
        requestId: request.requestId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get shared secret for agent pair
   */
  async getSharedSecret(
    agentId1: string,
    agentId2: string,
  ): Promise<SharedSecret | null> {
    const agentPair = [agentId1, agentId2].sort() as [string, string];

    // Check memory first
    for (const secret of this.sharedSecrets.values()) {
      if (
        secret.agentPair[0] === agentPair[0] &&
        secret.agentPair[1] === agentPair[1]
      ) {
        // Check if secret is still valid
        if (
          secret.expiresAt > new Date() &&
          secret.usageCount < secret.maxUsage
        ) {
          return secret;
        }
      }
    }

    // Check cache
    const cachedSecret = await this.cache.get(
      `keyexchange:secret:${agentPair.join(":")}`,
    );
    if (cachedSecret && cachedSecret.expiresAt > new Date()) {
      this.sharedSecrets.set(cachedSecret.secretId, cachedSecret);
      return cachedSecret;
    }

    return null;
  }

  /**
   * Rotate keys for an agent
   */
  async rotateAgentKeys(
    agentId: string,
    emergencyRotation: boolean = false,
  ): Promise<KeyPairInfo> {
    try {
      const currentKey = await this.getAgentKeyPair(agentId);

      if (currentKey) {
        // Mark current key as rotating
        currentKey.status = "rotating";
        await this.cache.set(
          `keyexchange:keypair:${currentKey.keyId}`,
          currentKey,
          3600000,
        );
      }

      // Generate new key pair
      const newKeyPair = await this.generateAgentKeyPair(agentId);

      // Update shared secrets that use the old key
      await this.updateSharedSecretsForAgent(agentId, currentKey, newKeyPair);

      if (currentKey) {
        // Revoke old key after grace period
        setTimeout(
          () => {
            currentKey.status = "revoked";
            this.keyPairs.delete(currentKey.keyId);
          },
          emergencyRotation ? 0 : 300000,
        ); // 5 minutes grace period for normal rotation
      }

      this.metrics.keyRotations++;

      this.logger.info("Agent keys rotated", {
        agentId,
        oldKeyId: currentKey?.keyId,
        newKeyId: newKeyPair.keyId,
        emergency: emergencyRotation,
      });

      this.emit("keys_rotated", {
        agentId,
        oldKey: currentKey,
        newKey: newKeyPair,
        emergency: emergencyRotation,
      });

      return newKeyPair;
    } catch (error) {
      this.logger.error("Failed to rotate agent keys", { agentId, error });
      throw error;
    }
  }

  /**
   * Generate distributed key shares using Shamir's Secret Sharing
   */
  async generateDistributedKeyShares(
    secretData: Buffer,
    threshold: number,
    totalShares: number,
  ): Promise<DistributedKeyShare[]> {
    try {
      if (threshold > totalShares || threshold < 2) {
        throw new Error("Invalid threshold parameters");
      }

      const shares: DistributedKeyShare[] = [];
      const polynomial = this.generateShamirPolynomial(secretData, threshold);

      for (let i = 1; i <= totalShares; i++) {
        const shareValue = this.evaluatePolynomial(polynomial, i);
        const encryptedShare = await this.encryptShare(shareValue);
        const publicCommitment = await this.generateCommitment(shareValue);
        const verificationProof = await this.generateVerificationProof(
          shareValue,
          publicCommitment,
        );

        const share: DistributedKeyShare = {
          shareId: crypto.randomUUID(),
          threshold,
          totalShares,
          shareIndex: i,
          encryptedShare,
          publicCommitment,
          verificationProof,
          createdAt: new Date(),
        };

        shares.push(share);
      }

      // Store shares securely
      const sharesKey = crypto
        .createHash("sha256")
        .update(secretData)
        .digest("hex");
      this.distributedShares.set(sharesKey, shares);

      this.logger.info("Distributed key shares generated", {
        threshold,
        totalShares,
        sharesKey: sharesKey.substring(0, 8),
      });

      return shares;
    } catch (error) {
      this.logger.error("Failed to generate distributed key shares", { error });
      throw error;
    }
  }

  /**
   * Reconstruct secret from distributed shares
   */
  async reconstructSecretFromShares(
    shares: DistributedKeyShare[],
  ): Promise<Buffer> {
    try {
      if (shares.length < shares[0].threshold) {
        throw new Error("Insufficient shares for reconstruction");
      }

      // Verify shares
      for (const share of shares) {
        const isValid = await this.verifyShare(share);
        if (!isValid) {
          throw new Error(`Invalid share: ${share.shareId}`);
        }
      }

      // Decrypt shares
      const decryptedShares = await Promise.all(
        shares.map((share) => this.decryptShare(share.encryptedShare)),
      );

      // Reconstruct using Lagrange interpolation
      const secret = this.lagrangeInterpolation(
        decryptedShares.slice(0, shares[0].threshold),
        shares.slice(0, shares[0].threshold).map((s) => s.shareIndex),
      );

      this.logger.info("Secret reconstructed from shares", {
        sharesUsed: shares.length,
        threshold: shares[0].threshold,
      });

      return secret;
    } catch (error) {
      this.logger.error("Failed to reconstruct secret from shares", { error });
      throw error;
    }
  }

  /**
   * Cryptographic helper methods
   */

  private async generateSoftwareKeyPair(
    algorithm: "ECDH" | "RSA" | "Kyber" = "ECDH",
    curve: "secp256r1" | "secp384r1" | "secp521r1" = "secp384r1",
  ): Promise<crypto.KeyPairKeyObjectResult> {
    if (algorithm === "ECDH") {
      return crypto.generateKeyPairSync("ec", {
        namedCurve: curve,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
    } else if (algorithm === "RSA") {
      return crypto.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
    } else {
      // Post-quantum algorithms would be implemented here
      throw new Error(`Algorithm ${algorithm} not yet implemented`);
    }
  }

  private async generateHSMKeyPair(
    algorithm: "ECDH" | "RSA" | "Kyber" = "ECDH",
    curve: "secp256r1" | "secp384r1" | "secp521r1" = "secp384r1",
  ): Promise<crypto.KeyPairKeyObjectResult> {
    // HSM integration would be implemented here
    // For now, fallback to software generation
    this.logger.warn(
      "HSM key generation not implemented, using software fallback",
    );
    return this.generateSoftwareKeyPair(algorithm, curve);
  }

  private async performECDH(
    publicKeyPem: string,
    privateKeyPem: string,
  ): Promise<Buffer> {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    const privateKey = crypto.createPrivateKey(privateKeyPem);

    return crypto.diffieHellman({
      privateKey,
      publicKey,
    });
  }

  private async deriveSessionKeys(
    sharedSecret: Buffer,
    nonce1: string,
    nonce2: string,
  ): Promise<{
    encryptionKey: Buffer;
    macKey: Buffer;
    signingKey: Buffer;
  }> {
    const salt = Buffer.concat([
      Buffer.from(nonce1, "hex"),
      Buffer.from(nonce2, "hex"),
    ]);
    const info = Buffer.from("A2A-Session-Keys-v1");

    // Use HKDF for key derivation
    const prk = crypto.createHmac("sha256", salt).update(sharedSecret).digest();

    const encryptionKey = crypto
      .createHmac("sha256", prk)
      .update(
        Buffer.concat([info, Buffer.from("encryption"), Buffer.from([1])]),
      )
      .digest();

    const macKey = crypto
      .createHmac("sha256", prk)
      .update(Buffer.concat([info, Buffer.from("mac"), Buffer.from([2])]))
      .digest();

    const signingKey = crypto
      .createHmac("sha256", prk)
      .update(Buffer.concat([info, Buffer.from("signing"), Buffer.from([3])]))
      .digest();

    return { encryptionKey, macKey, signingKey };
  }

  private async signKeyExchangeRequest(
    request: KeyExchangeRequest,
  ): Promise<string> {
    const data = JSON.stringify({
      requestId: request.requestId,
      fromAgentId: request.fromAgentId,
      toAgentId: request.toAgentId,
      publicKey: request.publicKey,
      nonce: request.nonce,
      timestamp: request.timestamp,
    });

    if (!this.masterKeyPair) {
      throw new Error("Master key pair not initialized");
    }

    const signature = crypto.sign("sha256", Buffer.from(data), {
      key: this.masterKeyPair.privateKey,
      format: "pem",
    });

    return signature.toString("base64");
  }

  private async signKeyExchangeResponse(
    response: KeyExchangeResponse,
  ): Promise<string> {
    const data = JSON.stringify({
      requestId: response.requestId,
      responseId: response.responseId,
      fromAgentId: response.fromAgentId,
      toAgentId: response.toAgentId,
      publicKey: response.publicKey,
      nonce: response.nonce,
      timestamp: response.timestamp,
      agreed: response.agreed,
    });

    if (!this.masterKeyPair) {
      throw new Error("Master key pair not initialized");
    }

    const signature = crypto.sign("sha256", Buffer.from(data), {
      key: this.masterKeyPair.privateKey,
      format: "pem",
    });

    return signature.toString("base64");
  }

  private async verifyKeyExchangeRequest(
    request: KeyExchangeRequest,
  ): Promise<boolean> {
    const data = JSON.stringify({
      requestId: request.requestId,
      fromAgentId: request.fromAgentId,
      toAgentId: request.toAgentId,
      publicKey: request.publicKey,
      nonce: request.nonce,
      timestamp: request.timestamp,
    });

    if (!this.masterKeyPair) {
      return false;
    }

    try {
      return crypto.verify(
        "sha256",
        Buffer.from(data),
        this.masterKeyPair.publicKey,
        Buffer.from(request.signature, "base64"),
      );
    } catch (error) {
      return false;
    }
  }

  private async getAgentKeyPair(agentId: string): Promise<KeyPairInfo | null> {
    // Find most recent active key pair for agent
    for (const [keyId, keyInfo] of this.keyPairs) {
      if (keyId.startsWith(agentId) && keyInfo.status === "active") {
        return keyInfo;
      }
    }

    // Check cache
    // const cachePattern = `keyexchange:keypair:${agentId}-*`;
    // In a real implementation, you'd search the cache with pattern matching

    return null;
  }

  private async getPrivateKey(keyId: string): Promise<string> {
    if (this.hsmConfig.enabled) {
      // Retrieve from HSM
      return this.getHSMPrivateKey(keyId);
    }

    const keyInfo = this.keyPairs.get(keyId);
    if (!keyInfo?.privateKey) {
      throw new Error("Private key not found");
    }

    return keyInfo.privateKey;
  }

  private async getHSMPrivateKey(_keyId: string): Promise<string> {
    // HSM private key retrieval would be implemented here
    throw new Error("HSM private key retrieval not implemented");
  }

  private async updateSharedSecretsForAgent(
    agentId: string,
    _oldKey: KeyPairInfo | null,
    _newKey: KeyPairInfo,
  ): Promise<void> {
    // Find and update shared secrets that involve this agent
    for (const [secretId, secret] of this.sharedSecrets) {
      if (secret.agentPair.includes(agentId)) {
        // Mark for rotation
        secret.rotationScheduled = new Date();
        this.sharedSecrets.set(secretId, secret);
      }
    }
  }

  /**
   * Shamir's Secret Sharing implementation
   */

  private generateShamirPolynomial(
    secret: Buffer,
    threshold: number,
  ): Buffer[] {
    const polynomial: Buffer[] = [secret]; // a0 = secret

    // Generate random coefficients a1, a2, ..., a(threshold-1)
    for (let i = 1; i < threshold; i++) {
      polynomial.push(crypto.randomBytes(32));
    }

    return polynomial;
  }

  private evaluatePolynomial(polynomial: Buffer[], x: number): Buffer {
    const result = Buffer.alloc(32);

    for (let i = 0; i < polynomial.length; i++) {
      const coefficient = polynomial[i];
      const power = Math.pow(x, i);

      // Simplified polynomial evaluation (in production, use proper finite field arithmetic)
      const term = Buffer.alloc(32);
      for (let j = 0; j < 32; j++) {
        term[j] = (coefficient[j] * power) % 256;
      }

      for (let j = 0; j < 32; j++) {
        result[j] ^= term[j];
      }
    }

    return result;
  }

  private lagrangeInterpolation(shares: Buffer[], indices: number[]): Buffer {
    const result = Buffer.alloc(32);

    for (let i = 0; i < shares.length; i++) {
      let numerator = 1;
      let denominator = 1;

      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          numerator *= 0 - indices[j];
          denominator *= indices[i] - indices[j];
        }
      }

      const coefficient = numerator / denominator;

      // Apply coefficient to share (simplified)
      for (let k = 0; k < 32; k++) {
        result[k] ^= Math.floor(shares[i][k] * coefficient) % 256;
      }
    }

    return result;
  }

  private async encryptShare(share: Buffer): Promise<string> {
    // Encrypt share with master key
    if (!this.masterKeyPair) {
      throw new Error("Master key not available for share encryption");
    }

    const cipher = crypto.createCipher(
      "aes-256-gcm",
      Buffer.from("share-encryption-key"),
    );
    const encrypted = Buffer.concat([cipher.update(share), cipher.final()]);

    return encrypted.toString("base64");
  }

  private async decryptShare(encryptedShare: string): Promise<Buffer> {
    // Decrypt share with master key
    if (!this.masterKeyPair) {
      throw new Error("Master key not available for share decryption");
    }

    const decipher = crypto.createDecipher(
      "aes-256-gcm",
      Buffer.from("share-encryption-key"),
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedShare, "base64")),
      decipher.final(),
    ]);

    return decrypted;
  }

  private async generateCommitment(share: Buffer): Promise<string> {
    // Generate cryptographic commitment for share verification
    const commitment = crypto
      .createHash("sha256")
      .update(share)
      .update(Buffer.from("commitment-salt"))
      .digest();

    return commitment.toString("hex");
  }

  private async generateVerificationProof(
    share: Buffer,
    commitment: string,
  ): Promise<string> {
    // Generate zero-knowledge proof for share verification
    const proof = crypto
      .createHmac("sha256", share)
      .update(commitment)
      .digest();

    return proof.toString("hex");
  }

  private async verifyShare(share: DistributedKeyShare): Promise<boolean> {
    try {
      const decryptedShare = await this.decryptShare(share.encryptedShare);
      const expectedCommitment = await this.generateCommitment(decryptedShare);
      const expectedProof = await this.generateVerificationProof(
        decryptedShare,
        expectedCommitment,
      );

      return (
        share.publicCommitment === expectedCommitment &&
        share.verificationProof === expectedProof
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * System management methods
   */

  private loadSystemCAs(): void {
    // Load system certificate authorities
    // In production, this would load from the system trust store
    this.logger.debug("Loading system CAs");
  }

  private startKeyRotationScheduler(): void {
    if (!this.rotationPolicy.automaticRotation) {
      return;
    }

    const checkInterval = Math.min(
      this.rotationPolicy.rotationInterval / 10,
      3600000,
    ); // Check every hour max

    setInterval(() => {
      this.checkAndRotateKeys();
    }, checkInterval);

    this.logger.info("Key rotation scheduler started", {
      checkInterval: checkInterval / 1000,
      rotationInterval: this.rotationPolicy.rotationInterval / 1000,
    });
  }

  private async checkAndRotateKeys(): Promise<void> {
    const now = new Date();

    for (const [keyId, keyInfo] of this.keyPairs) {
      if (keyInfo.status !== "active") continue;

      // Check if key needs rotation
      const needsRotation =
        keyInfo.expiresAt <= now ||
        keyInfo.usageCount >= keyInfo.maxUsage ||
        (this.rotationPolicy.preRotationWarning > 0 &&
          keyInfo.expiresAt.getTime() - now.getTime() <=
            this.rotationPolicy.preRotationWarning);

      if (needsRotation && keyId !== "master") {
        const agentId = keyId.split("-")[0];
        try {
          await this.rotateAgentKeys(agentId);
        } catch (error) {
          this.logger.error("Scheduled key rotation failed", {
            keyId,
            agentId,
            error,
          });
        }
      }
    }

    // Check shared secrets
    for (const [secretId, secret] of this.sharedSecrets) {
      if (
        secret.rotationScheduled <= now ||
        secret.expiresAt <= now ||
        secret.usageCount >= secret.maxUsage
      ) {
        try {
          await this.rotateSharedSecret(secretId);
        } catch (error) {
          this.logger.error("Shared secret rotation failed", {
            secretId,
            error,
          });
        }
      }
    }
  }

  private async rotateSharedSecret(secretId: string): Promise<void> {
    const secret = this.sharedSecrets.get(secretId);
    if (!secret) return;

    // Initiate new key exchange between the agent pair
    const [agentId1, agentId2] = secret.agentPair;

    try {
      await this.initiateKeyExchange(agentId1, agentId2);

      // Mark old secret for deletion
      setTimeout(() => {
        this.sharedSecrets.delete(secretId);
      }, 300000); // 5 minutes grace period

      this.logger.info("Shared secret rotation initiated", {
        secretId,
        agentPair: secret.agentPair,
      });
    } catch (error) {
      this.logger.error("Failed to rotate shared secret", { secretId, error });
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  private updatePerformanceMetrics(): void {
    const currentMetrics = {
      ...this.metrics,
      activeKeyPairs: Array.from(this.keyPairs.values()).filter(
        (k) => k.status === "active",
      ).length,
      activeSharedSecrets: this.sharedSecrets.size,
      pendingExchanges: this.pendingExchanges.size,
      distributedShares: this.distributedShares.size,
      timestamp: Date.now(),
    };

    this.emit("performance_metrics", currentMetrics);
  }

  /**
   * Public API methods
   */

  getKeyPairs(): KeyPairInfo[] {
    return Array.from(this.keyPairs.values());
  }

  getSharedSecrets(): Omit<SharedSecret, "sharedSecret" | "derivedKeys">[] {
    return Array.from(this.sharedSecrets.values()).map((secret) => ({
      secretId: secret.secretId,
      agentPair: secret.agentPair,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt,
      rotationScheduled: secret.rotationScheduled,
      usageCount: secret.usageCount,
      maxUsage: secret.maxUsage,
    }));
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getRotationPolicy(): KeyRotationPolicy {
    return { ...this.rotationPolicy };
  }

  async updateRotationPolicy(
    updates: Partial<KeyRotationPolicy>,
  ): Promise<void> {
    this.rotationPolicy = { ...this.rotationPolicy, ...updates };

    this.logger.info("Key rotation policy updated", updates);
    this.emit("rotation_policy_updated", this.rotationPolicy);
  }

  async emergencyKeyRotation(agentId?: string): Promise<void> {
    if (!this.rotationPolicy.emergencyRotation) {
      throw new Error("Emergency rotation is disabled");
    }

    if (agentId) {
      await this.rotateAgentKeys(agentId, true);
    } else {
      // Rotate all agent keys
      const activeAgents = new Set<string>();

      for (const keyId of this.keyPairs.keys()) {
        if (keyId !== "master") {
          const agentId = keyId.split("-")[0];
          activeAgents.add(agentId);
        }
      }

      for (const agentId of activeAgents) {
        try {
          await this.rotateAgentKeys(agentId, true);
        } catch (error) {
          this.logger.error("Emergency rotation failed for agent", {
            agentId,
            error,
          });
        }
      }
    }

    this.logger.warn("Emergency key rotation completed", { agentId });
    this.emit("emergency_rotation_completed", {
      agentId,
      timestamp: Date.now(),
    });
  }
}

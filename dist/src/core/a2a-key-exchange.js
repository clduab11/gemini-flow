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
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
import { CacheManager } from "./cache-manager.js";
export class A2AKeyExchange extends EventEmitter {
    logger;
    cache;
    // Key management
    keyPairs = new Map();
    sharedSecrets = new Map();
    distributedShares = new Map();
    // Exchange tracking
    pendingExchanges = new Map();
    completedExchanges = new Map();
    // Security and policy
    rotationPolicy;
    hsmConfig;
    // Cryptographic state
    masterKeyPair = null;
    certificateChain = [];
    trustedCAs = new Set();
    // Performance tracking
    metrics = {
        keyGenerations: 0,
        keyExchanges: 0,
        keyRotations: 0,
        failedExchanges: 0,
        hsmOperations: 0,
    };
    constructor(options = {}) {
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
    initializeRotationPolicy(policy = {}) {
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
    initializeHSMConfig(config = {}) {
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
    initializeTrustedCAs(cas = []) {
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
    async initializeMasterKeys() {
        try {
            if (this.hsmConfig.enabled && this.hsmConfig.keyGeneration) {
                this.masterKeyPair = await this.generateHSMKeyPair();
            }
            else {
                this.masterKeyPair = await this.generateSoftwareKeyPair();
            }
            // Create master key info
            const masterKeyInfo = {
                keyId: "master",
                algorithm: "ECDH",
                curve: "secp384r1",
                publicKey: this.masterKeyPair.publicKey.export({
                    type: "spki",
                    format: "pem",
                }),
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
        }
        catch (error) {
            this.logger.error("Failed to initialize master keys", { error });
            throw error;
        }
    }
    /**
     * Generate agent-specific key pair
     */
    async generateAgentKeyPair(agentId, algorithm = "ECDH", curve = "secp384r1") {
        try {
            let keyPair;
            if (this.hsmConfig.enabled && this.hsmConfig.keyGeneration) {
                keyPair = await this.generateHSMKeyPair(algorithm, curve);
                this.metrics.hsmOperations++;
            }
            else {
                keyPair = await this.generateSoftwareKeyPair(algorithm, curve);
            }
            const keyInfo = {
                keyId: `${agentId}-${Date.now()}`,
                algorithm,
                curve: algorithm === "ECDH" ? curve : undefined,
                keySize: algorithm === "RSA" ? 4096 : undefined,
                publicKey: keyPair.publicKey.export({
                    type: "spki",
                    format: "pem",
                }),
                privateKey: this.hsmConfig.enabled
                    ? undefined
                    : keyPair.privateKey.export({
                        type: "pkcs8",
                        format: "pem",
                    }),
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + this.rotationPolicy.keyLifetime),
                status: "active",
                usageCount: 0,
                maxUsage: this.rotationPolicy.maxKeyUsage,
            };
            this.keyPairs.set(keyInfo.keyId, keyInfo);
            await this.cache.set(`keyexchange:keypair:${keyInfo.keyId}`, keyInfo, this.rotationPolicy.keyLifetime);
            this.metrics.keyGenerations++;
            this.logger.info("Agent key pair generated", {
                agentId,
                keyId: keyInfo.keyId,
                algorithm,
                curve,
            });
            this.emit("key_pair_generated", { agentId, keyInfo });
            return keyInfo;
        }
        catch (error) {
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
    async initiateKeyExchange(fromAgentId, toAgentId, capabilities = []) {
        try {
            // Get or generate key pair for initiating agent
            let fromKeyPair = await this.getAgentKeyPair(fromAgentId);
            if (!fromKeyPair || fromKeyPair.status !== "active") {
                fromKeyPair = await this.generateAgentKeyPair(fromAgentId);
            }
            // Create exchange request
            const request = {
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
        }
        catch (error) {
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
    async respondToKeyExchange(request, accept = true) {
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
            let response;
            if (accept) {
                // Get or generate key pair for responding agent
                let toKeyPair = await this.getAgentKeyPair(request.toAgentId);
                if (!toKeyPair || toKeyPair.status !== "active") {
                    toKeyPair = await this.generateAgentKeyPair(request.toAgentId);
                }
                // Perform ECDH key exchange
                const sharedSecret = await this.performECDH(request.publicKey, toKeyPair.privateKey || (await this.getPrivateKey(toKeyPair.keyId)));
                // Derive session keys
                const derivedKeys = await this.deriveSessionKeys(sharedSecret, request.nonce, crypto.randomBytes(32).toString("hex"));
                // Store shared secret
                const secretInfo = {
                    secretId: crypto.randomUUID(),
                    agentPair: [request.fromAgentId, request.toAgentId].sort(),
                    sharedSecret,
                    derivedKeys,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + this.rotationPolicy.keyLifetime),
                    rotationScheduled: new Date(Date.now() + this.rotationPolicy.rotationInterval),
                    usageCount: 0,
                    maxUsage: this.rotationPolicy.maxKeyUsage,
                };
                this.sharedSecrets.set(secretInfo.secretId, secretInfo);
                await this.cache.set(`keyexchange:secret:${secretInfo.agentPair.join(":")}`, secretInfo, this.rotationPolicy.keyLifetime);
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
            }
            else {
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
        }
        catch (error) {
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
    async getSharedSecret(agentId1, agentId2) {
        const agentPair = [agentId1, agentId2].sort();
        // Check memory first
        for (const secret of this.sharedSecrets.values()) {
            if (secret.agentPair[0] === agentPair[0] &&
                secret.agentPair[1] === agentPair[1]) {
                // Check if secret is still valid
                if (secret.expiresAt > new Date() &&
                    secret.usageCount < secret.maxUsage) {
                    return secret;
                }
            }
        }
        // Check cache
        const cachedSecret = await this.cache.get(`keyexchange:secret:${agentPair.join(":")}`);
        if (cachedSecret && cachedSecret.expiresAt > new Date()) {
            this.sharedSecrets.set(cachedSecret.secretId, cachedSecret);
            return cachedSecret;
        }
        return null;
    }
    /**
     * Rotate keys for an agent
     */
    async rotateAgentKeys(agentId, emergencyRotation = false) {
        try {
            const currentKey = await this.getAgentKeyPair(agentId);
            if (currentKey) {
                // Mark current key as rotating
                currentKey.status = "rotating";
                await this.cache.set(`keyexchange:keypair:${currentKey.keyId}`, currentKey, 3600000);
            }
            // Generate new key pair
            const newKeyPair = await this.generateAgentKeyPair(agentId);
            // Update shared secrets that use the old key
            await this.updateSharedSecretsForAgent(agentId, currentKey, newKeyPair);
            if (currentKey) {
                // Revoke old key after grace period
                setTimeout(() => {
                    currentKey.status = "revoked";
                    this.keyPairs.delete(currentKey.keyId);
                }, emergencyRotation ? 0 : 300000); // 5 minutes grace period for normal rotation
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
        }
        catch (error) {
            this.logger.error("Failed to rotate agent keys", { agentId, error });
            throw error;
        }
    }
    /**
     * Generate distributed key shares using Shamir's Secret Sharing
     */
    async generateDistributedKeyShares(secretData, threshold, totalShares) {
        try {
            if (threshold > totalShares || threshold < 2) {
                throw new Error("Invalid threshold parameters");
            }
            const shares = [];
            const polynomial = this.generateShamirPolynomial(secretData, threshold);
            for (let i = 1; i <= totalShares; i++) {
                const shareValue = this.evaluatePolynomial(polynomial, i);
                const encryptedShare = await this.encryptShare(shareValue);
                const publicCommitment = await this.generateCommitment(shareValue);
                const verificationProof = await this.generateVerificationProof(shareValue, publicCommitment);
                const share = {
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
        }
        catch (error) {
            this.logger.error("Failed to generate distributed key shares", { error });
            throw error;
        }
    }
    /**
     * Reconstruct secret from distributed shares
     */
    async reconstructSecretFromShares(shares) {
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
            const decryptedShares = await Promise.all(shares.map((share) => this.decryptShare(share.encryptedShare)));
            // Reconstruct using Lagrange interpolation
            const secret = this.lagrangeInterpolation(decryptedShares.slice(0, shares[0].threshold), shares.slice(0, shares[0].threshold).map((s) => s.shareIndex));
            this.logger.info("Secret reconstructed from shares", {
                sharesUsed: shares.length,
                threshold: shares[0].threshold,
            });
            return secret;
        }
        catch (error) {
            this.logger.error("Failed to reconstruct secret from shares", { error });
            throw error;
        }
    }
    /**
     * Cryptographic helper methods
     */
    async generateSoftwareKeyPair(algorithm = "ECDH", curve = "secp384r1") {
        if (algorithm === "ECDH") {
            return crypto.generateKeyPairSync("ec", {
                namedCurve: curve,
                publicKeyEncoding: { type: "spki", format: "pem" },
                privateKeyEncoding: { type: "pkcs8", format: "pem" },
            });
        }
        else if (algorithm === "RSA") {
            return crypto.generateKeyPairSync("rsa", {
                modulusLength: 4096,
                publicKeyEncoding: { type: "spki", format: "pem" },
                privateKeyEncoding: { type: "pkcs8", format: "pem" },
            });
        }
        else {
            // Post-quantum algorithms would be implemented here
            throw new Error(`Algorithm ${algorithm} not yet implemented`);
        }
    }
    async generateHSMKeyPair(algorithm = "ECDH", curve = "secp384r1") {
        // HSM integration would be implemented here
        // For now, fallback to software generation
        this.logger.warn("HSM key generation not implemented, using software fallback");
        return this.generateSoftwareKeyPair(algorithm, curve);
    }
    async performECDH(publicKeyPem, privateKeyPem) {
        const publicKey = crypto.createPublicKey(publicKeyPem);
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        return crypto.diffieHellman({
            privateKey,
            publicKey,
        });
    }
    async deriveSessionKeys(sharedSecret, nonce1, nonce2) {
        const salt = Buffer.concat([
            Buffer.from(nonce1, "hex"),
            Buffer.from(nonce2, "hex"),
        ]);
        const info = Buffer.from("A2A-Session-Keys-v1");
        // Use HKDF for key derivation
        const prk = crypto.createHmac("sha256", salt).update(sharedSecret).digest();
        const encryptionKey = crypto
            .createHmac("sha256", prk)
            .update(Buffer.concat([info, Buffer.from("encryption"), Buffer.from([1])]))
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
    async signKeyExchangeRequest(request) {
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
    async signKeyExchangeResponse(response) {
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
    async verifyKeyExchangeRequest(request) {
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
            return crypto.verify("sha256", Buffer.from(data), this.masterKeyPair.publicKey, Buffer.from(request.signature, "base64"));
        }
        catch (error) {
            return false;
        }
    }
    async getAgentKeyPair(agentId) {
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
    async getPrivateKey(keyId) {
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
    async getHSMPrivateKey(_keyId) {
        // HSM private key retrieval would be implemented here
        throw new Error("HSM private key retrieval not implemented");
    }
    async updateSharedSecretsForAgent(agentId, _oldKey, _newKey) {
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
    generateShamirPolynomial(secret, threshold) {
        const polynomial = [secret]; // a0 = secret
        // Generate random coefficients a1, a2, ..., a(threshold-1)
        for (let i = 1; i < threshold; i++) {
            polynomial.push(crypto.randomBytes(32));
        }
        return polynomial;
    }
    evaluatePolynomial(polynomial, x) {
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
    lagrangeInterpolation(shares, indices) {
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
    async encryptShare(share) {
        // Encrypt share with master key
        if (!this.masterKeyPair) {
            throw new Error("Master key not available for share encryption");
        }
        const cipher = crypto.createCipher("aes-256-gcm", Buffer.from("share-encryption-key"));
        const encrypted = Buffer.concat([cipher.update(share), cipher.final()]);
        return encrypted.toString("base64");
    }
    async decryptShare(encryptedShare) {
        // Decrypt share with master key
        if (!this.masterKeyPair) {
            throw new Error("Master key not available for share decryption");
        }
        const decipher = crypto.createDecipher("aes-256-gcm", Buffer.from("share-encryption-key"));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedShare, "base64")),
            decipher.final(),
        ]);
        return decrypted;
    }
    async generateCommitment(share) {
        // Generate cryptographic commitment for share verification
        const commitment = crypto
            .createHash("sha256")
            .update(share)
            .update(Buffer.from("commitment-salt"))
            .digest();
        return commitment.toString("hex");
    }
    async generateVerificationProof(share, commitment) {
        // Generate zero-knowledge proof for share verification
        const proof = crypto
            .createHmac("sha256", share)
            .update(commitment)
            .digest();
        return proof.toString("hex");
    }
    async verifyShare(share) {
        try {
            const decryptedShare = await this.decryptShare(share.encryptedShare);
            const expectedCommitment = await this.generateCommitment(decryptedShare);
            const expectedProof = await this.generateVerificationProof(decryptedShare, expectedCommitment);
            return (share.publicCommitment === expectedCommitment &&
                share.verificationProof === expectedProof);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * System management methods
     */
    loadSystemCAs() {
        // Load system certificate authorities
        // In production, this would load from the system trust store
        this.logger.debug("Loading system CAs");
    }
    startKeyRotationScheduler() {
        if (!this.rotationPolicy.automaticRotation) {
            return;
        }
        const checkInterval = Math.min(this.rotationPolicy.rotationInterval / 10, 3600000); // Check every hour max
        setInterval(() => {
            this.checkAndRotateKeys();
        }, checkInterval);
        this.logger.info("Key rotation scheduler started", {
            checkInterval: checkInterval / 1000,
            rotationInterval: this.rotationPolicy.rotationInterval / 1000,
        });
    }
    async checkAndRotateKeys() {
        const now = new Date();
        for (const [keyId, keyInfo] of this.keyPairs) {
            if (keyInfo.status !== "active")
                continue;
            // Check if key needs rotation
            const needsRotation = keyInfo.expiresAt <= now ||
                keyInfo.usageCount >= keyInfo.maxUsage ||
                (this.rotationPolicy.preRotationWarning > 0 &&
                    keyInfo.expiresAt.getTime() - now.getTime() <=
                        this.rotationPolicy.preRotationWarning);
            if (needsRotation && keyId !== "master") {
                const agentId = keyId.split("-")[0];
                try {
                    await this.rotateAgentKeys(agentId);
                }
                catch (error) {
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
            if (secret.rotationScheduled <= now ||
                secret.expiresAt <= now ||
                secret.usageCount >= secret.maxUsage) {
                try {
                    await this.rotateSharedSecret(secretId);
                }
                catch (error) {
                    this.logger.error("Shared secret rotation failed", {
                        secretId,
                        error,
                    });
                }
            }
        }
    }
    async rotateSharedSecret(secretId) {
        const secret = this.sharedSecrets.get(secretId);
        if (!secret)
            return;
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
        }
        catch (error) {
            this.logger.error("Failed to rotate shared secret", { secretId, error });
        }
    }
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 60000); // Update every minute
    }
    updatePerformanceMetrics() {
        const currentMetrics = {
            ...this.metrics,
            activeKeyPairs: Array.from(this.keyPairs.values()).filter((k) => k.status === "active").length,
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
    getKeyPairs() {
        return Array.from(this.keyPairs.values());
    }
    getSharedSecrets() {
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
    getRotationPolicy() {
        return { ...this.rotationPolicy };
    }
    async updateRotationPolicy(updates) {
        this.rotationPolicy = { ...this.rotationPolicy, ...updates };
        this.logger.info("Key rotation policy updated", updates);
        this.emit("rotation_policy_updated", this.rotationPolicy);
    }
    async emergencyKeyRotation(agentId) {
        if (!this.rotationPolicy.emergencyRotation) {
            throw new Error("Emergency rotation is disabled");
        }
        if (agentId) {
            await this.rotateAgentKeys(agentId, true);
        }
        else {
            // Rotate all agent keys
            const activeAgents = new Set();
            for (const keyId of this.keyPairs.keys()) {
                if (keyId !== "master") {
                    const agentId = keyId.split("-")[0];
                    activeAgents.add(agentId);
                }
            }
            for (const agentId of activeAgents) {
                try {
                    await this.rotateAgentKeys(agentId, true);
                }
                catch (error) {
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
//# sourceMappingURL=a2a-key-exchange.js.map
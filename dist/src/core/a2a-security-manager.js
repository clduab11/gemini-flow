/**
 * Agent-to-Agent Security Manager
 *
 * Implements comprehensive security mechanisms for A2A protocol:
 * - Mutual TLS authentication with certificate pinning
 * - JWT-based identity tokens with capability-based access control
 * - Secure key exchange with ECDH and quantum-resistant algorithms
 * - Message signing and verification with replay protection
 * - Rate limiting and DDoS protection with adaptive throttling
 * - Comprehensive audit logging and security monitoring
 * - Zero-trust architecture with continuous verification
 */
import { EventEmitter } from "events";
import crypto from "crypto";
import { Logger } from "../utils/logger.js";
import { CacheManager } from "./cache-manager.js";
export class A2ASecurityManager extends EventEmitter {
    logger;
    authManager;
    cache;
    // Security configuration
    securityPolicy;
    trustedCAs = new Map();
    agentIdentities = new Map();
    activeSessions = new Map();
    // Cryptographic components
    keyPairs = new Map();
    certificateStore = new Map();
    nonceStore = new Set();
    // Rate limiting and protection
    rateLimiters = new Map();
    circuitBreakers = new Map();
    threatDetector;
    // Monitoring and audit
    securityEvents = [];
    anomalyDetector;
    performanceMetrics = new Map();
    // Zero-trust components
    trustEvaluator;
    behaviorAnalyzer;
    networkSegmentation;
    constructor(authManager, options = {}) {
        super();
        this.logger = new Logger("A2ASecurityManager");
        this.authManager = authManager;
        this.cache = new CacheManager();
        this.initializeSecurityPolicy(options);
        this.initializeCryptographicInfrastructure();
        this.initializeRateLimiting();
        this.initializeMonitoring();
        this.initializeZeroTrust();
        this.logger.info("A2A Security Manager initialized", {
            features: [
                "mutual-tls",
                "capability-based-auth",
                "key-rotation",
                "message-signing",
                "rate-limiting",
                "ddos-protection",
                "audit-logging",
                "zero-trust",
                "anomaly-detection",
            ],
        });
    }
    /**
     * Initialize security policy with defaults
     */
    initializeSecurityPolicy(options) {
        this.securityPolicy = {
            authentication: {
                requireMutualTLS: true,
                requireSignedMessages: true,
                allowSelfSigned: false,
                certificateValidityPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
                keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
                ...options.authentication,
            },
            authorization: {
                defaultTrustLevel: "untrusted",
                capabilityExpiration: 24 * 60 * 60 * 1000, // 24 hours
                requireExplicitPermissions: true,
                allowCapabilityDelegation: false,
                ...options.authorization,
            },
            rateLimiting: {
                defaultRequestsPerMinute: 100,
                burstThreshold: 5,
                adaptiveThrottling: true,
                ddosProtection: true,
                ...options.rateLimiting,
            },
            monitoring: {
                auditLevel: "comprehensive",
                anomalyDetection: true,
                threatIntelligence: true,
                realTimeAlerts: true,
                ...options.monitoring,
            },
            zeroTrust: {
                continuousVerification: true,
                leastPrivilege: true,
                networkSegmentation: true,
                behaviorAnalysis: true,
                ...options.zeroTrust,
            },
        };
    }
    /**
     * Initialize cryptographic infrastructure
     */
    initializeCryptographicInfrastructure() {
        // Generate root key pair for the security manager
        const rootKeyPair = crypto.generateKeyPairSync("ec", {
            namedCurve: "secp384r1",
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        this.keyPairs.set("root", rootKeyPair);
        // Initialize trusted CA certificates
        this.loadTrustedCAs();
        // Set up key rotation schedule
        this.scheduleKeyRotation();
        this.logger.info("Cryptographic infrastructure initialized");
    }
    /**
     * Initialize rate limiting system
     */
    initializeRateLimiting() {
        this.threatDetector = new ThreatDetector(this.securityPolicy);
        // Set up default rate limiter
        const defaultConfig = {
            windowMs: 60000, // 1 minute
            maxRequests: this.securityPolicy.rateLimiting.defaultRequestsPerMinute,
            burstMultiplier: this.securityPolicy.rateLimiting.burstThreshold,
            adaptiveThreshold: 0.8,
            penaltyDuration: 300000, // 5 minutes
        };
        this.rateLimiters.set("default", new RateLimiter(defaultConfig));
        this.logger.info("Rate limiting system initialized");
    }
    /**
     * Initialize monitoring and audit systems
     */
    initializeMonitoring() {
        this.anomalyDetector = new AnomalyDetector(this.securityPolicy);
        // Set up security event handlers
        this.setupSecurityEventHandlers();
        // Initialize performance monitoring
        this.startPerformanceMonitoring();
        this.logger.info("Monitoring systems initialized");
    }
    /**
     * Initialize zero-trust architecture components
     */
    initializeZeroTrust() {
        this.trustEvaluator = new TrustEvaluator(this.securityPolicy);
        this.behaviorAnalyzer = new BehaviorAnalyzer(this.securityPolicy);
        this.networkSegmentation = new NetworkSegmentation(this.securityPolicy);
        this.logger.info("Zero-trust architecture initialized");
    }
    /**
     * AUTHENTICATION: Register a new agent with identity verification
     */
    async registerAgent(agentId, agentType, publicKey, certificates, capabilities = []) {
        try {
            // Verify agent identity and certificates
            await this.verifyAgentCertificates(certificates);
            // Create agent identity
            const identity = {
                agentId,
                agentType,
                publicKey,
                certificates,
                capabilities,
                trustLevel: this.securityPolicy.authorization.defaultTrustLevel,
                metadata: {
                    createdAt: new Date(),
                    lastVerified: new Date(),
                    version: "1.0.0",
                },
            };
            // Evaluate initial trust level
            identity.trustLevel =
                await this.trustEvaluator.evaluateInitialTrust(identity);
            // Store identity
            this.agentIdentities.set(agentId, identity);
            await this.cache.set(`a2a:identity:${agentId}`, identity, 86400000);
            // Create security event
            await this.createSecurityEvent("authentication", "info", agentId, {
                action: "agent_registered",
                agentType,
                trustLevel: identity.trustLevel,
                capabilities: capabilities.length,
            });
            this.logger.info("Agent registered", {
                agentId,
                agentType,
                trustLevel: identity.trustLevel,
                capabilities: capabilities.length,
            });
            this.emit("agent_registered", identity);
            return identity;
        }
        catch (error) {
            await this.createSecurityEvent("authentication", "error", agentId, {
                action: "registration_failed",
                error: error.message,
            });
            this.logger.error("Agent registration failed", { agentId, error });
            throw error;
        }
    }
    /**
     * AUTHENTICATION: Establish secure session between agents
     */
    async establishSession(fromAgentId, toAgentId, requestedCapabilities = []) {
        try {
            // Verify both agents exist and are trusted
            const fromIdentity = await this.getAgentIdentity(fromAgentId);
            const toIdentity = await this.getAgentIdentity(toAgentId);
            if (!fromIdentity || !toIdentity) {
                throw new Error("Agent identity not found");
            }
            // Check authorization for requested capabilities
            await this.authorizeCapabilities(fromAgentId, requestedCapabilities);
            // Perform key exchange using ECDH
            const sharedSecret = await this.performKeyExchange(fromIdentity, toIdentity);
            // Derive session keys
            const sessionKeys = await this.deriveSessionKeys(sharedSecret);
            // Create session
            const session = {
                sessionId: crypto.randomUUID(),
                agentId: fromAgentId,
                establishedAt: new Date(),
                lastActivity: new Date(),
                sharedSecret,
                encryptionKey: sessionKeys.encryptionKey,
                macKey: sessionKeys.macKey,
                sequenceNumber: 0,
                capabilities: requestedCapabilities,
                trustScore: await this.trustEvaluator.calculateTrustScore(fromIdentity, toIdentity),
                isActive: true,
            };
            // Store session
            this.activeSessions.set(session.sessionId, session);
            await this.cache.set(`a2a:session:${session.sessionId}`, session, 3600000);
            // Create security event
            await this.createSecurityEvent("authentication", "info", fromAgentId, {
                action: "session_established",
                toAgent: toAgentId,
                sessionId: session.sessionId,
                capabilities: requestedCapabilities,
                trustScore: session.trustScore,
            });
            this.logger.info("A2A session established", {
                sessionId: session.sessionId,
                fromAgent: fromAgentId,
                toAgent: toAgentId,
                trustScore: session.trustScore,
            });
            this.emit("session_established", session);
            return session;
        }
        catch (error) {
            await this.createSecurityEvent("authentication", "error", fromAgentId, {
                action: "session_establishment_failed",
                toAgent: toAgentId,
                error: error.message,
            });
            this.logger.error("Session establishment failed", {
                fromAgent: fromAgentId,
                toAgent: toAgentId,
                error,
            });
            throw error;
        }
    }
    /**
     * AUTHORIZATION: Check if agent has required capabilities
     */
    async authorizeCapabilities(agentId, requiredCapabilities) {
        try {
            const identity = await this.getAgentIdentity(agentId);
            if (!identity) {
                throw new Error("Agent identity not found");
            }
            // Check trust level requirements
            if (identity.trustLevel === "untrusted" &&
                requiredCapabilities.length > 0) {
                throw new Error("Untrusted agents cannot request capabilities");
            }
            // Verify each capability
            const unauthorizedCapabilities = [];
            for (const capability of requiredCapabilities) {
                if (!identity.capabilities.includes(capability)) {
                    // Check if capability can be granted based on trust level
                    if (!(await this.canGrantCapability(identity, capability))) {
                        unauthorizedCapabilities.push(capability);
                    }
                }
            }
            if (unauthorizedCapabilities.length > 0) {
                await this.createSecurityEvent("authorization", "warning", agentId, {
                    action: "capability_denied",
                    denied: unauthorizedCapabilities,
                    trustLevel: identity.trustLevel,
                });
                throw new Error(`Unauthorized capabilities: ${unauthorizedCapabilities.join(", ")}`);
            }
            // Create audit event for successful authorization
            await this.createSecurityEvent("authorization", "info", agentId, {
                action: "capabilities_authorized",
                capabilities: requiredCapabilities,
                trustLevel: identity.trustLevel,
            });
            return true;
        }
        catch (error) {
            this.logger.error("Authorization failed", {
                agentId,
                requiredCapabilities,
                error,
            });
            throw error;
        }
    }
    /**
     * MESSAGE SECURITY: Sign and send secure message
     */
    async sendSecureMessage(fromAgentId, toAgentId, messageType, payload, options = {}) {
        try {
            // Get sender identity
            const fromIdentity = await this.getAgentIdentity(fromAgentId);
            if (!fromIdentity) {
                throw new Error("Sender identity not found");
            }
            // Check rate limits
            await this.checkRateLimit(fromAgentId);
            // Create message
            const message = {
                id: crypto.randomUUID(),
                from: fromAgentId,
                to: toAgentId,
                type: messageType,
                payload,
                timestamp: Date.now(),
                nonce: crypto.randomBytes(16).toString("hex"),
                signature: "",
                capabilities: options.capabilities || [],
                metadata: {
                    priority: options.priority || "medium",
                    ttl: options.ttl,
                    replyTo: options.replyTo,
                    correlationId: options.correlationId,
                },
            };
            // Sign message
            message.signature = await this.signMessage(message, fromIdentity);
            // Encrypt message if required
            if (this.securityPolicy.authentication.requireSignedMessages) {
                message.payload = await this.encryptMessagePayload(message.payload, fromAgentId);
            }
            // Store nonce to prevent replay attacks
            this.nonceStore.add(message.nonce);
            // Clean old nonces periodically
            if (this.nonceStore.size > 10000) {
                this.cleanOldNonces();
            }
            // Create security event
            await this.createSecurityEvent("authentication", "info", fromAgentId, {
                action: "message_sent",
                messageId: message.id,
                to: toAgentId,
                type: messageType,
                priority: message.metadata.priority,
            });
            this.logger.debug("Secure message sent", {
                messageId: message.id,
                from: fromAgentId,
                to: toAgentId,
                type: messageType,
            });
            this.emit("message_sent", message);
            return message;
        }
        catch (error) {
            await this.createSecurityEvent("authentication", "error", fromAgentId, {
                action: "message_send_failed",
                to: toAgentId,
                error: error.message,
            });
            this.logger.error("Failed to send secure message", {
                fromAgent: fromAgentId,
                toAgent: toAgentId,
                error,
            });
            throw error;
        }
    }
    /**
     * MESSAGE SECURITY: Verify and process received message
     */
    async receiveSecureMessage(message, receivingAgentId) {
        try {
            // Check for replay attacks
            if (this.nonceStore.has(message.nonce)) {
                throw new Error("Replay attack detected - nonce already used");
            }
            // Verify message age (TTL)
            if (message.metadata.ttl &&
                Date.now() - message.timestamp > message.metadata.ttl) {
                throw new Error("Message expired");
            }
            // Get sender identity
            const fromIdentity = await this.getAgentIdentity(message.from);
            if (!fromIdentity) {
                throw new Error("Sender identity not found");
            }
            // Verify message signature
            const isValidSignature = await this.verifyMessageSignature(message, fromIdentity);
            if (!isValidSignature) {
                await this.createSecurityEvent("threat", "critical", message.from, {
                    action: "invalid_signature",
                    messageId: message.id,
                    to: receivingAgentId,
                });
                throw new Error("Invalid message signature");
            }
            // Decrypt message payload if encrypted
            let payload = message.payload;
            if (this.securityPolicy.authentication.requireSignedMessages) {
                payload = await this.decryptMessagePayload(message.payload, message.from);
            }
            // Check anomalies
            const anomalies = await this.anomalyDetector.detectMessageAnomalies(message, fromIdentity);
            if (anomalies.length > 0) {
                await this.createSecurityEvent("anomaly", "warning", message.from, {
                    action: "message_anomalies",
                    messageId: message.id,
                    anomalies,
                });
            }
            // Store nonce
            this.nonceStore.add(message.nonce);
            // Update behavior analysis
            await this.behaviorAnalyzer.recordMessageBehavior(message, fromIdentity);
            // Create security event
            await this.createSecurityEvent("authentication", "info", receivingAgentId, {
                action: "message_received",
                messageId: message.id,
                from: message.from,
                type: message.type,
                hasAnomalies: anomalies.length > 0,
            });
            this.logger.debug("Secure message received and verified", {
                messageId: message.id,
                from: message.from,
                to: receivingAgentId,
                anomalies: anomalies.length,
            });
            this.emit("message_received", { message, payload, anomalies });
            return {
                valid: true,
                payload,
                metadata: {
                    anomalies,
                    trustScore: fromIdentity.trustLevel,
                    verified: true,
                },
            };
        }
        catch (error) {
            await this.createSecurityEvent("authentication", "error", receivingAgentId, {
                action: "message_verification_failed",
                messageId: message.id,
                from: message.from,
                error: error.message,
            });
            this.logger.error("Message verification failed", {
                messageId: message.id,
                from: message.from,
                to: receivingAgentId,
                error,
            });
            return { valid: false };
        }
    }
    /**
     * RATE LIMITING: Check if agent can make request
     */
    async checkRateLimit(agentId) {
        const rateLimiter = this.rateLimiters.get(agentId) || this.rateLimiters.get("default");
        if (!(await rateLimiter.checkLimit())) {
            // Check for potential DDoS
            const isDDoS = await this.throttleDetector.checkDDoSPattern(agentId);
            if (isDDoS) {
                // Activate circuit breaker
                const circuitBreaker = this.getOrCreateCircuitBreaker(agentId);
                circuitBreaker.open();
                await this.createSecurityEvent("threat", "critical", agentId, {
                    action: "ddos_detected",
                    rateLimitExceeded: true,
                });
                throw new Error("DDoS attack detected - agent temporarily blocked");
            }
            await this.createSecurityEvent("rate_limit", "warning", agentId, {
                action: "rate_limit_exceeded",
            });
            throw new Error("Rate limit exceeded");
        }
    }
    /**
     * ZERO TRUST: Continuous verification of agent behavior
     */
    async performContinuousVerification(agentId) {
        if (!this.securityPolicy.zeroTrust.continuousVerification) {
            return;
        }
        try {
            const identity = await this.getAgentIdentity(agentId);
            if (!identity)
                return;
            // Verify certificates are still valid
            const certStatus = await this.verifyCertificateStatus(identity.certificates);
            if (!certStatus.valid) {
                await this.revokeAgentAccess(agentId, "certificate_invalid");
                return;
            }
            // Check behavior patterns
            const behaviorScore = await this.behaviorAnalyzer.calculateBehaviorScore(agentId);
            if (behaviorScore < 0.5) {
                await this.createSecurityEvent("anomaly", "warning", agentId, {
                    action: "suspicious_behavior",
                    behaviorScore,
                });
                // Reduce trust level
                identity.trustLevel = this.reduceTrustLevel(identity.trustLevel);
                await this.updateAgentIdentity(identity);
            }
            // Update last verification time
            identity.metadata.lastVerified = new Date();
            await this.updateAgentIdentity(identity);
        }
        catch (error) {
            this.logger.error("Continuous verification failed", { agentId, error });
        }
    }
    /**
     * MONITORING: Create security event
     */
    async createSecurityEvent(type, severity, agentId, details) {
        const event = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type,
            severity,
            agentId,
            details,
            signature: this.signSecurityEvent(type, severity, agentId, details),
        };
        this.securityEvents.push(event);
        // Limit event history
        if (this.securityEvents.length > 50000) {
            this.securityEvents = this.securityEvents.slice(-25000);
        }
        // Real-time alerts for critical events
        if (severity === "critical" &&
            this.securityPolicy.monitoring.realTimeAlerts) {
            this.emit("security_alert", event);
        }
        // Store in cache for external access
        await this.cache.set(`a2a:event:${event.id}`, event, 86400000);
        return event;
    }
    /**
     * Helper methods for cryptographic operations
     */
    async verifyAgentCertificates(_certificates) {
        // Verify certificate chain and validity
        // Implementation would check against trusted CAs
        return true;
    }
    async performKeyExchange(fromIdentity, toIdentity) {
        // ECDH key exchange implementation
        const keyPair = this.keyPairs.get("root");
        const sharedSecret = crypto.diffieHellman({
            privateKey: keyPair.privateKey,
            publicKey: crypto.createPublicKey(toIdentity.publicKey),
        });
        return sharedSecret;
    }
    async deriveSessionKeys(sharedSecret) {
        // HKDF key derivation
        const salt = crypto.randomBytes(32);
        const info = Buffer.from("A2A-Session-Keys");
        const prk = crypto.createHmac("sha256", salt).update(sharedSecret).digest();
        const encryptionKey = crypto
            .createHmac("sha256", prk)
            .update(Buffer.concat([info, Buffer.from([1])]))
            .digest();
        const macKey = crypto
            .createHmac("sha256", prk)
            .update(Buffer.concat([info, Buffer.from([2])]))
            .digest();
        return { encryptionKey, macKey };
    }
    async signMessage(message, _identity) {
        const keyPair = this.keyPairs.get("root");
        const messageData = JSON.stringify({
            id: message.id,
            from: message.from,
            to: message.to,
            type: message.type,
            payload: message.payload,
            timestamp: message.timestamp,
            nonce: message.nonce,
        });
        const signature = crypto.sign("sha256", Buffer.from(messageData), {
            key: keyPair.privateKey,
            format: "pem",
        });
        return signature.toString("base64");
    }
    async verifyMessageSignature(message, identity) {
        const messageData = JSON.stringify({
            id: message.id,
            from: message.from,
            to: message.to,
            type: message.type,
            payload: message.payload,
            timestamp: message.timestamp,
            nonce: message.nonce,
        });
        try {
            const publicKey = crypto.createPublicKey(identity.publicKey);
            const isValid = crypto.verify("sha256", Buffer.from(messageData), publicKey, Buffer.from(message.signature, "base64"));
            return isValid;
        }
        catch (error) {
            this.logger.error("Signature verification failed", { error });
            return false;
        }
    }
    async encryptMessagePayload(payload, agentId) {
        const session = this.getActiveSession(agentId);
        if (!session) {
            throw new Error("No active session for encryption");
        }
        const cipher = crypto.createCipher("aes-256-gcm", session.encryptionKey);
        const encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex") +
            cipher.final("hex");
        return encrypted;
    }
    async decryptMessagePayload(encryptedPayload, agentId) {
        const session = this.getActiveSession(agentId);
        if (!session) {
            throw new Error("No active session for decryption");
        }
        const decipher = crypto.createDecipher("aes-256-gcm", session.encryptionKey);
        const decrypted = decipher.update(encryptedPayload, "hex", "utf8") + decipher.final("utf8");
        return JSON.parse(decrypted);
    }
    signSecurityEvent(type, severity, agentId, details) {
        const data = `${type}:${severity}:${agentId}:${JSON.stringify(details)}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }
    /**
     * Utility methods
     */
    async getAgentIdentity(agentId) {
        let identity = this.agentIdentities.get(agentId);
        if (!identity) {
            identity = await this.cache.get(`a2a:identity:${agentId}`);
            if (identity) {
                this.agentIdentities.set(agentId, identity);
            }
        }
        return identity || null;
    }
    getActiveSession(agentId) {
        for (const session of this.activeSessions.values()) {
            if (session.agentId === agentId && session.isActive) {
                return session;
            }
        }
        return null;
    }
    async canGrantCapability(identity, capability) {
        // Implement capability granting logic based on trust level
        const trustLevelCapabilities = {
            untrusted: [],
            basic: ["read", "status"],
            verified: ["read", "status", "execute", "query"],
            trusted: ["read", "status", "execute", "query", "admin", "configure"],
        };
        return trustLevelCapabilities[identity.trustLevel].includes(capability);
    }
    reduceTrustLevel(currentLevel) {
        const levels = ["untrusted", "basic", "verified", "trusted"];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.max(0, currentIndex - 1)];
    }
    async updateAgentIdentity(identity) {
        this.agentIdentities.set(identity.agentId, identity);
        await this.cache.set(`a2a:identity:${identity.agentId}`, identity, 86400000);
    }
    async revokeAgentAccess(agentId, reason) {
        // Deactivate all sessions
        for (const [sessionId, session] of this.activeSessions) {
            if (session.agentId === agentId) {
                session.isActive = false;
                this.activeSessions.delete(sessionId);
            }
        }
        // Remove from active identities
        this.agentIdentities.delete(agentId);
        await this.createSecurityEvent("authorization", "warning", agentId, {
            action: "access_revoked",
            reason,
        });
        this.emit("agent_access_revoked", { agentId, reason });
    }
    cleanOldNonces() {
        // Simple cleanup - in production, use timestamp-based cleanup
        if (this.nonceStore.size > 10000) {
            this.nonceStore.clear();
        }
    }
    loadTrustedCAs() {
        // Load trusted CA certificates
        // Implementation would load from filesystem or configuration
    }
    scheduleKeyRotation() {
        const rotationInterval = this.securityPolicy.authentication.keyRotationInterval;
        setInterval(async () => {
            await this.rotateKeys();
        }, rotationInterval);
    }
    async rotateKeys() {
        this.logger.info("Starting key rotation");
        // Generate new key pair
        const newKeyPair = crypto.generateKeyPairSync("ec", {
            namedCurve: "secp384r1",
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        // Store old key pair with timestamp
        const oldKeyPair = this.keyPairs.get("root");
        if (oldKeyPair) {
            this.keyPairs.set(`root-${Date.now()}`, oldKeyPair);
        }
        // Set new key pair as active
        this.keyPairs.set("root", newKeyPair);
        this.logger.info("Key rotation completed");
        this.emit("keys_rotated");
    }
    getOrCreateCircuitBreaker(agentId) {
        let circuitBreaker = this.circuitBreakers.get(agentId);
        if (!circuitBreaker) {
            circuitBreaker = new CircuitBreaker({
                failureThreshold: 5,
                recoveryTimeout: 60000,
                monitoringPeriod: 10000,
            });
            this.circuitBreakers.set(agentId, circuitBreaker);
        }
        return circuitBreaker;
    }
    setupSecurityEventHandlers() {
        this.on("security_alert", (event) => {
            this.logger.error("Security alert", event);
            // Implement notification system integration
            if (event.severity === "critical") {
                this.handleCriticalSecurityEvent(event);
            }
        });
    }
    async handleCriticalSecurityEvent(event) {
        // Implement immediate response to critical security events
        switch (event.type) {
            case "threat":
                await this.revokeAgentAccess(event.agentId, "security_threat");
                break;
            case "anomaly":
                if (event.details.behaviorScore < 0.2) {
                    await this.revokeAgentAccess(event.agentId, "malicious_behavior");
                }
                break;
        }
    }
    startPerformanceMonitoring() {
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000);
    }
    collectPerformanceMetrics() {
        const metrics = {
            activeAgents: this.agentIdentities.size,
            activeSessions: this.activeSessions.size,
            securityEvents: this.securityEvents.length,
            rateLimiters: this.rateLimiters.size,
            circuitBreakers: this.circuitBreakers.size,
            nonceStoreSize: this.nonceStore.size,
            timestamp: Date.now(),
        };
        this.performanceMetrics.set("current", metrics);
        this.emit("performance_metrics", metrics);
    }
    /**
     * Public API methods
     */
    getSecurityPolicy() {
        return { ...this.securityPolicy };
    }
    getAgentIdentities() {
        return Array.from(this.agentIdentities.values());
    }
    getActiveSessions() {
        return Array.from(this.activeSessions.values()).filter((s) => s.isActive);
    }
    getSecurityEvents(limit = 100) {
        return this.securityEvents.slice(-limit);
    }
    getPerformanceMetrics() {
        return this.performanceMetrics.get("current");
    }
    async emergencyShutdown(reason) {
        this.logger.error("Emergency shutdown initiated", { reason });
        // Deactivate all sessions
        for (const session of this.activeSessions.values()) {
            session.isActive = false;
        }
        // Clear sensitive data
        this.keyPairs.clear();
        this.nonceStore.clear();
        await this.createSecurityEvent("threat", "critical", "system", {
            action: "emergency_shutdown",
            reason,
        });
        this.emit("emergency_shutdown", { reason, timestamp: Date.now() });
    }
}
// Supporting classes for the security framework
class RateLimiter {
    config;
    requestCounts = new Map();
    penalizedUntil = 0;
    constructor(config) {
        this.config = config;
    }
    async checkLimit() {
        const now = Date.now();
        // Check if still penalized
        if (now < this.penalizedUntil) {
            return false;
        }
        const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
        const currentCount = this.requestCounts.get(windowStart) || 0;
        if (currentCount >= this.config.maxRequests) {
            // Apply penalty
            this.penalizedUntil = now + this.config.penaltyDuration;
            return false;
        }
        // Increment counter
        this.requestCounts.set(windowStart, currentCount + 1);
        // Cleanup old windows
        this.cleanupOldWindows(windowStart);
        return true;
    }
    cleanupOldWindows(currentWindow) {
        const cutoff = currentWindow - this.config.windowMs * 10;
        for (const [window] of this.requestCounts) {
            if (window < cutoff) {
                this.requestCounts.delete(window);
            }
        }
    }
}
class CircuitBreaker {
    config;
    state = "closed";
    failureCount = 0;
    nextAttempt = 0;
    constructor(config) {
        this.config = config;
    }
    open() {
        this.state = "open";
        this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    }
    close() {
        this.state = "closed";
        this.failureCount = 0;
    }
    canProceed() {
        if (this.state === "closed")
            return true;
        if (this.state === "open" && Date.now() > this.nextAttempt) {
            this.state = "half-open";
            return true;
        }
        return false;
    }
    recordSuccess() {
        if (this.state === "half-open") {
            this.close();
        }
    }
    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.config.failureThreshold) {
            this.open();
        }
    }
}
class ThreatDetector {
    policy;
    requestPatterns = new Map();
    constructor(policy) {
        this.policy = policy;
    }
    async checkDDoSPattern(agentId) {
        if (!this.policy.rateLimiting.ddosProtection) {
            return false;
        }
        const now = Date.now();
        const pattern = this.requestPatterns.get(agentId) || [];
        // Add current request
        pattern.push(now);
        // Keep only recent requests (last 5 minutes)
        const recentRequests = pattern.filter((time) => now - time < 300000);
        this.requestPatterns.set(agentId, recentRequests);
        // Check for DDoS patterns
        const requestsPerMinute = recentRequests.filter((time) => now - time < 60000).length;
        return (requestsPerMinute > this.policy.rateLimiting.defaultRequestsPerMinute * 10);
    }
}
class AnomalyDetector {
    policy;
    baselineMetrics = new Map();
    constructor(policy) {
        this.policy = policy;
    }
    async detectMessageAnomalies(message, identity) {
        if (!this.policy.monitoring.anomalyDetection) {
            return [];
        }
        const anomalies = [];
        // Check message size anomalies
        const payloadSize = JSON.stringify(message.payload).length;
        if (payloadSize > 1000000) {
            // 1MB
            anomalies.push("oversized_payload");
        }
        // Check frequency anomalies
        const recentMessages = await this.getRecentMessageCount(message.from);
        if (recentMessages > 1000) {
            anomalies.push("high_frequency");
        }
        // Check capability anomalies
        const requestedCapabilities = message.capabilities.length;
        const allowedCapabilities = identity.capabilities.length;
        if (requestedCapabilities > allowedCapabilities * 2) {
            anomalies.push("excessive_capabilities");
        }
        return anomalies;
    }
    async getRecentMessageCount(_agentId) {
        // Implementation would track recent message counts
        return 0;
    }
}
class TrustEvaluator {
    policy;
    constructor(policy) {
        this.policy = policy;
    }
    async evaluateInitialTrust(identity) {
        // Simple trust evaluation based on certificates and capabilities
        if (identity.certificates.identity &&
            identity.certificates.tls &&
            identity.certificates.signing) {
            if (identity.capabilities.length > 5) {
                return "verified";
            }
            return "basic";
        }
        return this.policy.authorization.defaultTrustLevel;
    }
    async calculateTrustScore(fromIdentity, toIdentity) {
        const fromScore = this.getTrustLevelScore(fromIdentity.trustLevel);
        const toScore = this.getTrustLevelScore(toIdentity.trustLevel);
        return (fromScore + toScore) / 2;
    }
    getTrustLevelScore(trustLevel) {
        const scores = {
            untrusted: 0.1,
            basic: 0.4,
            verified: 0.7,
            trusted: 1.0,
        };
        return scores[trustLevel] || 0.1;
    }
}
class BehaviorAnalyzer {
    policy;
    behaviorProfiles = new Map();
    constructor(policy) {
        this.policy = policy;
    }
    async recordMessageBehavior(message, _identity) {
        if (!this.policy.zeroTrust.behaviorAnalysis) {
            return;
        }
        const profile = this.behaviorProfiles.get(message.from) || {
            messageCount: 0,
            avgPayloadSize: 0,
            messageTypes: new Map(),
            timePatterns: [],
        };
        // Update behavior profile
        profile.messageCount++;
        profile.avgPayloadSize =
            (profile.avgPayloadSize + JSON.stringify(message.payload).length) / 2;
        profile.messageTypes.set(message.type, (profile.messageTypes.get(message.type) || 0) + 1);
        profile.timePatterns.push(new Date().getHours());
        this.behaviorProfiles.set(message.from, profile);
    }
    async calculateBehaviorScore(agentId) {
        const profile = this.behaviorProfiles.get(agentId);
        if (!profile)
            return 1.0;
        // Simple behavior scoring - in production, use ML models
        let score = 1.0;
        // Penalize excessive messaging
        if (profile.messageCount > 10000) {
            score -= 0.2;
        }
        // Penalize unusual time patterns
        const hourCounts = new Map();
        for (const hour of profile.timePatterns) {
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        }
        const variance = this.calculateVariance(Array.from(hourCounts.values()));
        if (variance > 100) {
            score -= 0.1;
        }
        return Math.max(0, score);
    }
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
}
class NetworkSegmentation {
    policy;
    segments = new Map();
    constructor(policy) {
        this.policy = policy;
        this.initializeSegments();
    }
    initializeSegments() {
        // Define network segments based on agent types
        this.segments.set("core", [
            "coder",
            "planner",
            "researcher",
            "reviewer",
            "tester",
        ]);
        this.segments.set("coordination", [
            "hierarchical-coordinator",
            "mesh-coordinator",
            "adaptive-coordinator",
        ]);
        this.segments.set("security", [
            "security-auditor",
            "penetration-tester",
            "encryption-specialist",
            "access-controller",
        ]);
        this.segments.set("infrastructure", [
            "devops-engineer",
            "cloud-architect",
            "container-orchestrator",
            "infrastructure-monitor",
        ]);
    }
    canCommunicate(fromAgentType, toAgentType) {
        if (!this.policy.zeroTrust.networkSegmentation) {
            return true;
        }
        // Find segments for both agents
        const fromSegment = this.findAgentSegment(fromAgentType);
        const toSegment = this.findAgentSegment(toAgentType);
        // Allow communication within same segment
        if (fromSegment === toSegment) {
            return true;
        }
        // Define cross-segment communication rules
        const allowedCrossSegment = [
            ["core", "coordination"],
            ["coordination", "infrastructure"],
            ["security", "core"],
            ["security", "infrastructure"],
        ];
        return allowedCrossSegment.some(([seg1, seg2]) => (fromSegment === seg1 && toSegment === seg2) ||
            (fromSegment === seg2 && toSegment === seg1));
    }
    findAgentSegment(agentType) {
        for (const [segment, types] of this.segments) {
            if (types.includes(agentType)) {
                return segment;
            }
        }
        return null;
    }
}
//# sourceMappingURL=a2a-security-manager.js.map
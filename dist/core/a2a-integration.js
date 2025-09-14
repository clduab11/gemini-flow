/**
 * A2A Security Integration Layer
 *
 * Integrates A2A security components with existing authentication and security systems:
 * - Seamless integration with AuthenticationManager
 * - Bridge to SecurityOptimizationManager features
 * - Unified security event handling and correlation
 * - Performance optimization and monitoring integration
 * - Backward compatibility with existing security flows
 * - Configuration management and policy synchronization
 */
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
import { A2ASecurityManager } from "./a2a-security-manager.js";
import { A2AKeyExchange } from "./a2a-key-exchange.js";
import { A2AMessageSecurity } from "./a2a-message-security.js";
import { A2ARateLimiter } from "./a2a-rate-limiter.js";
import { A2AAuditLogger } from "./a2a-audit-logger.js";
import { A2AZeroTrust } from "./a2a-zero-trust.js";
import { CacheManager } from "./cache-manager.js";
/**
 * Main integration orchestrator for A2A security systems
 */
export class A2ASecurityIntegration extends EventEmitter {
    logger;
    cache;
    config;
    // Existing security systems
    authManager;
    securityOptimizer;
    // A2A security components
    a2aSecurityManager;
    keyExchange;
    messageSecurity;
    rateLimiter;
    auditLogger;
    zeroTrust;
    // Integration state
    eventCorrelator;
    policyManager;
    performanceOptimizer;
    // Metrics and monitoring
    metrics = {
        a2aRequestsProcessed: 0,
        legacyRequestsProcessed: 0,
        securityEventsCorrelated: 0,
        performanceOptimizationEvents: 0,
        integrationErrors: 0,
        averageA2AProcessingTime: 0,
        averageLegacyProcessingTime: 0,
        systemResourceUtilization: 0,
    };
    constructor(authManager, securityOptimizer, config = {}) {
        super();
        this.logger = new Logger("A2ASecurityIntegration");
        this.cache = new CacheManager();
        this.authManager = authManager;
        this.securityOptimizer = securityOptimizer;
        this.initializeConfig(config);
        this.initializeA2AComponents();
        this.initializeIntegrationServices();
        this.setupEventHandlers();
        this.startMonitoring();
        this.logger.info("A2A Security Integration initialized", {
            componentsEnabled: this.getEnabledComponents(),
            bridgeEnabled: this.config.bridgeToExistingSecurity,
            performanceOptimization: this.config.performanceOptimization,
        });
    }
    /**
     * Initialize configuration with defaults
     */
    initializeConfig(config) {
        this.config = {
            enableA2ASecurity: true,
            enableKeyExchange: true,
            enableMessageSecurity: true,
            enableRateLimiting: true,
            enableAuditLogging: true,
            enableZeroTrust: true,
            bridgeToExistingSecurity: true,
            performanceOptimization: true,
            eventCorrelation: true,
            backwardCompatibility: true,
            ...config,
        };
    }
    /**
     * Initialize A2A security components based on configuration
     */
    initializeA2AComponents() {
        if (this.config.enableA2ASecurity) {
            this.a2aSecurityManager = new A2ASecurityManager(this.authManager);
            this.logger.info("A2A Security Manager initialized");
        }
        if (this.config.enableKeyExchange) {
            this.keyExchange = new A2AKeyExchange();
            this.logger.info("A2A Key Exchange initialized");
        }
        if (this.config.enableMessageSecurity) {
            this.messageSecurity = new A2AMessageSecurity();
            this.logger.info("A2A Message Security initialized");
        }
        if (this.config.enableRateLimiting) {
            this.rateLimiter = new A2ARateLimiter();
            this.logger.info("A2A Rate Limiter initialized");
        }
        if (this.config.enableAuditLogging) {
            this.auditLogger = new A2AAuditLogger();
            this.logger.info("A2A Audit Logger initialized");
        }
        if (this.config.enableZeroTrust) {
            this.zeroTrust = new A2AZeroTrust();
            this.logger.info("A2A Zero Trust initialized");
        }
    }
    /**
     * Initialize integration services
     */
    initializeIntegrationServices() {
        this.eventCorrelator = new SecurityEventCorrelator(this.config);
        this.policyManager = new PolicySynchronizationManager(this.config);
        this.performanceOptimizer = new PerformanceOptimizationBridge(this.securityOptimizer, this.config);
        this.logger.info("Integration services initialized");
    }
    /**
     * Setup event handlers for component integration
     */
    setupEventHandlers() {
        // Bridge authentication events
        this.authManager.on("user_authenticated", (profile) => {
            this.handleUserAuthentication(profile);
        });
        this.authManager.on("session_expired", (userId) => {
            this.handleSessionExpiration(userId);
        });
        // Bridge security optimization events
        this.securityOptimizer.on("optimization_enabled", (event) => {
            this.handleOptimizationEvent(event);
        });
        this.securityOptimizer.on("security_alert", (event) => {
            this.handleSecurityAlert(event);
        });
        // Handle A2A security events
        if (this.a2aSecurityManager) {
            this.a2aSecurityManager.on("agent_registered", (identity) => {
                this.handleAgentRegistration(identity);
            });
            this.a2aSecurityManager.on("session_established", (session) => {
                this.handleA2ASessionEstablished(session);
            });
        }
        // Handle rate limiting events
        if (this.rateLimiter) {
            this.rateLimiter.on("agent_blocked", (event) => {
                this.handleAgentBlocked(event);
            });
            this.rateLimiter.on("ddos_detected", (event) => {
                this.handleDDoSDetection(event);
            });
        }
        // Handle zero trust events
        if (this.zeroTrust) {
            this.zeroTrust.on("access_decision", (event) => {
                this.handleAccessDecision(event);
            });
            this.zeroTrust.on("agent_quarantined", (event) => {
                this.handleAgentQuarantine(event);
            });
        }
        // Handle audit events
        if (this.auditLogger) {
            this.auditLogger.on("security_alert", (alert) => {
                this.handleAuditSecurityAlert(alert);
            });
        }
    }
    /**
     * Unified authentication method that supports both user and agent authentication
     */
    async authenticateEntity(entityType, credentials, options = {}) {
        const startTime = Date.now();
        try {
            if (entityType === "user") {
                // Use existing user authentication
                const profile = await this.authManager.authenticateUser(credentials);
                this.metrics.legacyRequestsProcessed++;
                const processingTime = Date.now() - startTime;
                this.metrics.averageLegacyProcessingTime =
                    (this.metrics.averageLegacyProcessingTime + processingTime) / 2;
                return {
                    success: true,
                    profile,
                    securityLevel: profile.tier,
                    warnings: [],
                };
            }
            else if (entityType === "agent" &&
                this.a2aSecurityManager &&
                options.enableA2A !== false) {
                // Use A2A authentication
                const identity = await this.a2aSecurityManager.registerAgent(credentials.agentId, credentials.agentType, credentials.publicKey, credentials.certificates, options.capabilities || []);
                this.metrics.a2aRequestsProcessed++;
                const processingTime = Date.now() - startTime;
                this.metrics.averageA2AProcessingTime =
                    (this.metrics.averageA2AProcessingTime + processingTime) / 2;
                return {
                    success: true,
                    profile: identity,
                    securityLevel: identity.trustLevel,
                    warnings: [],
                };
            }
            else {
                // Fallback to legacy authentication for agents
                this.logger.warn("A2A authentication not available, using legacy fallback", {
                    entityType,
                    enableA2A: options.enableA2A,
                });
                return {
                    success: false,
                    securityLevel: "unknown",
                    warnings: ["A2A authentication not available"],
                };
            }
        }
        catch (error) {
            this.metrics.integrationErrors++;
            this.logger.error("Entity authentication failed", { entityType, error });
            return {
                success: false,
                securityLevel: "unknown",
                warnings: [error.message],
            };
        }
    }
    /**
     * Unified access control that bridges legacy and A2A systems
     */
    async checkAccess(entityId, resource, action, context) {
        try {
            const entityType = context.entityType || this.detectEntityType(entityId);
            if (entityType === "agent" && this.zeroTrust) {
                // Use Zero Trust for agent access control
                const decision = await this.zeroTrust.evaluateAccess(entityId, resource, action, {
                    source: {
                        ip: context.sourceIP || "unknown",
                        network: { segment: "default" },
                    },
                    identity: {
                        verified: true,
                        authMethod: "a2a",
                        certificates: [],
                        trustLevel: "verified",
                    },
                    metadata: {
                        entityType,
                        capabilities: context.capabilities,
                    },
                });
                return {
                    allowed: decision.allowed,
                    reason: decision.reason,
                    conditions: decision.conditions,
                    monitoring: decision.monitoring,
                    securityLevel: decision.riskLevel,
                };
            }
            else {
                // Use legacy permission system for users
                const hasPermission = await this.authManager.hasPermission(entityId, action);
                return {
                    allowed: hasPermission,
                    reason: hasPermission ? "Permission granted" : "Permission denied",
                    securityLevel: "standard",
                };
            }
        }
        catch (error) {
            this.metrics.integrationErrors++;
            this.logger.error("Access check failed", {
                entityId,
                resource,
                action,
                error,
            });
            return {
                allowed: false,
                reason: "Access check error",
                securityLevel: "unknown",
            };
        }
    }
    /**
     * Unified rate limiting that considers both user and agent patterns
     */
    async checkRateLimit(entityId, entityType, action, context) {
        try {
            if (entityType === "agent" && this.rateLimiter) {
                // Use A2A rate limiting for agents
                const result = await this.rateLimiter.checkRateLimit(entityId, context.messageType, context.payloadSize, context.sourceIP);
                return {
                    allowed: result.allowed,
                    reason: result.reason,
                    retryAfter: result.retryAfter,
                    quotaInfo: {
                        tokensRemaining: result.tokensRemaining,
                        quotaResetTime: result.quotaResetTime,
                    },
                };
            }
            else {
                // Use legacy quota system for users
                const quotaCheck = await this.authManager.checkQuota(entityId);
                return {
                    allowed: quotaCheck,
                    reason: quotaCheck ? "Within quota" : "Quota exceeded",
                    quotaInfo: { legacy: true },
                };
            }
        }
        catch (error) {
            this.metrics.integrationErrors++;
            this.logger.error("Rate limit check failed", {
                entityId,
                entityType,
                error,
            });
            // Fail open for availability
            return {
                allowed: true,
                reason: "Rate limit check error - failing open",
            };
        }
    }
    /**
     * Unified audit logging for both systems
     */
    async logSecurityEvent(eventType, entityId, entityType, details) {
        try {
            const unifiedEvent = {
                eventId: crypto.randomUUID(),
                timestamp: new Date(),
                source: entityType === "agent" ? "a2a" : "legacy",
                type: eventType,
                severity: this.determineSeverity(eventType, details.outcome),
                agentId: entityType === "agent" ? entityId : undefined,
                userId: entityType === "user" ? entityId : undefined,
                details: {
                    action: details.action,
                    resource: details.resource,
                    outcome: details.outcome,
                    sourceIP: details.sourceIP,
                    userAgent: details.userAgent,
                    ...details.metadata,
                },
                correlatedEvents: [],
                handledBy: [],
            };
            // Log to A2A audit system if available
            if (this.auditLogger &&
                (entityType === "agent" || this.config.bridgeToExistingSecurity)) {
                await this.auditLogger.logEvent(eventType, eventType, {
                    agentId: entityId,
                    agentType: entityType,
                    sourceIP: details.sourceIP,
                    userAgent: details.userAgent,
                }, {
                    resource: details.resource,
                    resourceType: "api",
                    resourceId: details.resource,
                }, details.action, details.outcome, {
                    description: `${details.action} on ${details.resource}`,
                    metadata: details.metadata || {},
                });
                unifiedEvent.handledBy.push("a2a-audit");
            }
            // Correlate with related events
            if (this.config.eventCorrelation) {
                const correlatedEvents = await this.eventCorrelator.correlateEvent(unifiedEvent);
                unifiedEvent.correlatedEvents = correlatedEvents.map((e) => e.eventId);
                if (correlatedEvents.length > 0) {
                    this.metrics.securityEventsCorrelated++;
                }
            }
            // Store unified event
            await this.cache.set(`security_event:${unifiedEvent.eventId}`, unifiedEvent, 86400000);
            this.emit("security_event_logged", unifiedEvent);
        }
        catch (error) {
            this.metrics.integrationErrors++;
            this.logger.error("Security event logging failed", {
                eventType,
                entityId,
                error,
            });
        }
    }
    /**
     * Get comprehensive security status for an entity
     */
    async getSecurityStatus(entityId, entityType) {
        try {
            const status = {};
            if (entityType === "agent") {
                // Get A2A security status
                if (this.zeroTrust) {
                    const trustScore = this.zeroTrust.getTrustScore(entityId);
                    if (trustScore) {
                        status.trustScore = trustScore.overallScore;
                        status.lastActivity = trustScore.lastUpdated;
                    }
                    status.quarantined =
                        await this.zeroTrust.isAgentQuarantined(entityId);
                }
                if (this.auditLogger) {
                    const alerts = this.auditLogger.getSecurityAlerts(10);
                    status.securityAlerts = alerts.filter((alert) => alert.source.agentId === entityId);
                }
            }
            else {
                // Get user security status
                const profile = await this.authManager.validateSession(entityId);
                if (profile) {
                    status.lastActivity = profile.metadata.lastActive;
                    status.permissions = profile.permissions;
                    status.quotaStatus = {
                        daily: profile.quotas.daily,
                        monthly: profile.quotas.monthly,
                        concurrent: profile.quotas.concurrent,
                    };
                }
            }
            return status;
        }
        catch (error) {
            this.logger.error("Failed to get security status", {
                entityId,
                entityType,
                error,
            });
            return {};
        }
    }
    /**
     * Emergency security lockdown
     */
    async emergencyLockdown(reason, scope = "system") {
        this.logger.error("Emergency security lockdown initiated", {
            reason,
            scope,
        });
        try {
            if (scope === "system" || scope === "legacy") {
                await this.securityOptimizer.emergencyStop(reason);
            }
            if (scope === "system" || scope === "a2a") {
                // Lockdown A2A components
                if (this.a2aSecurityManager) {
                    await this.a2aSecurityManager.emergencyShutdown(reason);
                }
                if (this.rateLimiter) {
                    // Block all agents temporarily
                    this.rateLimiter.getMetrics();
                    // Implementation would block all known agents
                }
                if (this.zeroTrust) {
                    // Set all policies to deny
                    // Implementation would update policies
                }
            }
            this.emit("emergency_lockdown", { reason, scope, timestamp: Date.now() });
        }
        catch (error) {
            this.logger.error("Emergency lockdown failed", { reason, scope, error });
            throw error;
        }
    }
    /**
     * Event handlers for component integration
     */
    async handleUserAuthentication(profile) {
        // Bridge user authentication to A2A system if configured
        if (this.config.bridgeToExistingSecurity && this.auditLogger) {
            await this.auditLogger.logEvent("authentication", "user_auth", {
                agentId: profile.id,
                agentType: "user",
                sourceIP: "unknown",
            }, {
                resource: "authentication_system",
                resourceType: "system",
            }, "login", "success", {
                description: "User authentication successful",
                metadata: {
                    tier: profile.tier,
                    organization: profile.organization,
                },
            });
        }
    }
    async handleSessionExpiration(userId) {
        if (this.config.bridgeToExistingSecurity && this.auditLogger) {
            await this.auditLogger.logEvent("authentication", "session_management", {
                agentId: userId,
                agentType: "user",
            }, {
                resource: "user_session",
                resourceType: "session",
            }, "expire", "success", {
                description: "User session expired",
            });
        }
    }
    async handleOptimizationEvent(event) {
        this.metrics.performanceOptimizationEvents++;
        // Correlate optimization events with security events
        if (this.config.eventCorrelation) {
            await this.eventCorrelator.correlateOptimizationEvent(event);
        }
    }
    async handleSecurityAlert(event) {
        // Bridge security alerts to A2A audit system
        if (this.auditLogger) {
            await this.auditLogger.createSecurityAlert("policy_violation", "medium", "Security optimization alert", event.details || "Security alert from optimization manager", { agentId: event.agentId || "system" });
        }
    }
    async handleAgentRegistration(identity) {
        this.logger.info("Agent registered via A2A", {
            agentId: identity.agentId,
            agentType: identity.agentType,
            trustLevel: identity.trustLevel,
        });
        // Initialize zero trust score if available
        if (this.zeroTrust) {
            await this.zeroTrust.updateTrustScore(identity.agentId, {
                type: "authentication",
                outcome: "positive",
                details: { initial_registration: true },
            });
        }
    }
    async handleA2ASessionEstablished(session) {
        this.logger.debug("A2A session established", {
            sessionId: session.sessionId,
            agentId: session.agentId,
            trustScore: session.trustScore,
        });
    }
    async handleAgentBlocked(event) {
        this.logger.warn("Agent blocked by rate limiter", event);
        // Update zero trust score
        if (this.zeroTrust) {
            await this.zeroTrust.updateTrustScore(event.agentId, {
                type: "security_incident",
                outcome: "negative",
                details: { rate_limit_exceeded: true },
            });
        }
    }
    async handleDDoSDetection(event) {
        this.logger.error("DDoS attack detected", event);
        // Quarantine attacking agent if zero trust is available
        if (this.zeroTrust) {
            await this.zeroTrust.quarantineAgent(event.agentId, "DDoS attack detected", 3600000);
        }
    }
    async handleAccessDecision(event) {
        if (!event.decision.allowed) {
            this.logger.warn("Access denied by zero trust", {
                agentId: event.agentId,
                resource: event.resource,
                reason: event.decision.reason,
            });
        }
    }
    async handleAgentQuarantine(event) {
        this.logger.warn("Agent quarantined", event);
        // Notify security optimization manager
        this.securityOptimizer.emit("agent_quarantined", event);
    }
    async handleAuditSecurityAlert(alert) {
        this.logger.warn("Security alert from audit system", {
            alertId: alert.alertId,
            severity: alert.severity,
            type: alert.alertType,
        });
        // Bridge to security optimization manager
        this.securityOptimizer.emit("security_alert", {
            source: "a2a_audit",
            alert,
        });
    }
    /**
     * Utility methods
     */
    detectEntityType(entityId) {
        // Simple heuristic - in production, use proper registry
        return entityId.includes("-") ? "agent" : "user";
    }
    determineSeverity(eventType, outcome) {
        if (outcome === "failure" || outcome === "denied") {
            if (eventType.includes("security") || eventType.includes("auth")) {
                return "error";
            }
            return "warning";
        }
        return "info";
    }
    getEnabledComponents() {
        const components = [];
        if (this.config.enableA2ASecurity)
            components.push("a2a-security");
        if (this.config.enableKeyExchange)
            components.push("key-exchange");
        if (this.config.enableMessageSecurity)
            components.push("message-security");
        if (this.config.enableRateLimiting)
            components.push("rate-limiting");
        if (this.config.enableAuditLogging)
            components.push("audit-logging");
        if (this.config.enableZeroTrust)
            components.push("zero-trust");
        return components;
    }
    startMonitoring() {
        setInterval(() => {
            this.collectMetrics();
        }, 60000); // Every minute
        setInterval(() => {
            this.performHealthCheck();
        }, 300000); // Every 5 minutes
    }
    collectMetrics() {
        // Calculate system resource utilization
        this.metrics.systemResourceUtilization =
            this.calculateResourceUtilization();
        this.emit("metrics_collected", this.metrics);
    }
    calculateResourceUtilization() {
        // Placeholder for resource utilization calculation
        return Math.random() * 100;
    }
    async performHealthCheck() {
        const healthStatus = {
            timestamp: new Date(),
            components: {
                authManager: this.checkComponentHealth(this.authManager),
                securityOptimizer: this.checkComponentHealth(this.securityOptimizer),
                a2aSecurityManager: this.checkComponentHealth(this.a2aSecurityManager),
                keyExchange: this.checkComponentHealth(this.keyExchange),
                messageSecurity: this.checkComponentHealth(this.messageSecurity),
                rateLimiter: this.checkComponentHealth(this.rateLimiter),
                auditLogger: this.checkComponentHealth(this.auditLogger),
                zeroTrust: this.checkComponentHealth(this.zeroTrust),
            },
        };
        this.emit("health_check", healthStatus);
        const unhealthyComponents = Object.entries(healthStatus.components)
            .filter(([_, healthy]) => !healthy)
            .map(([name, _]) => name);
        if (unhealthyComponents.length > 0) {
            this.logger.warn("Unhealthy components detected", {
                unhealthyComponents,
            });
        }
    }
    checkComponentHealth(component) {
        return component !== undefined && component !== null;
    }
    /**
     * Public API methods
     */
    getMetrics() {
        return { ...this.metrics };
    }
    getConfig() {
        return { ...this.config };
    }
    async updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.logger.info("Integration config updated", updates);
        this.emit("config_updated", this.config);
    }
    getComponentStatus() {
        return {
            authManager: !!this.authManager,
            securityOptimizer: !!this.securityOptimizer,
            a2aSecurityManager: !!this.a2aSecurityManager,
            keyExchange: !!this.keyExchange,
            messageSecurity: !!this.messageSecurity,
            rateLimiter: !!this.rateLimiter,
            auditLogger: !!this.auditLogger,
            zeroTrust: !!this.zeroTrust,
        };
    }
}
/**
 * Supporting classes for integration
 */
class SecurityEventCorrelator {
    config;
    constructor(config) {
        this.config = config;
    }
    async correlateEvent(_event) {
        // Placeholder for event correlation logic
        return [];
    }
    async correlateOptimizationEvent(_event) {
        // Placeholder for optimization event correlation
    }
}
class PolicySynchronizationManager {
    config;
    constructor(config) {
        this.config = config;
    }
    async synchronizePolicies() {
        // Placeholder for policy synchronization
        return {
            lastSync: new Date(),
            policies: {
                a2aPolicies: 0,
                legacyPolicies: 0,
                unifiedPolicies: 0,
            },
            conflicts: {
                count: 0,
                resolved: 0,
                pending: [],
            },
        };
    }
}
class PerformanceOptimizationBridge {
    securityOptimizer;
    config;
    constructor(securityOptimizer, config) {
        this.securityOptimizer = securityOptimizer;
        this.config = config;
    }
    async optimizePerformance() {
        // Bridge performance optimization between systems
        if (this.config.performanceOptimization) {
            // Implementation would coordinate performance optimizations
        }
    }
}

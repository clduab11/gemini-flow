/**
 * Enhanced A2A Security Manager with Malicious Agent Detection
 *
 * Integrates the comprehensive malicious agent detection system with the
 * existing A2A security manager, providing unified security orchestration
 * with real-time threat detection, behavioral analysis, and automated
 * response capabilities.
 *
 * Features:
 * - Integrated malicious behavior detection and response
 * - Real-time reputation-based access control
 * - Automated quarantine and recovery workflows
 * - Consensus-based malicious agent identification
 * - Multi-layer security with ML-based anomaly detection
 * - Comprehensive attack simulation and testing
 */
import { EventEmitter } from "events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
import { A2ASecurityManager, } from "../../../core/a2a-security-manager.js";
import { MaliciousAgentDetector, } from "./malicious-detection.js";
import { ReputationSystem, } from "./reputation-system.js";
import { QuarantineRecoveryManager, } from "./quarantine-recovery.js";
import { ProofOfWorkManager } from "./proof-of-work.js";
import { DistributedTrustVerifier, } from "./trust-verification.js";
import { MLAnomalyDetector } from "./ml-anomaly-detector.js";
import { AttackSimulationFramework, } from "./attack-simulation.js";
export class EnhancedA2ASecurityManager extends EventEmitter {
    logger;
    baseSecurityManager;
    // Enhanced security components
    maliciousDetector;
    reputationSystem;
    quarantineManager;
    proofOfWorkManager;
    trustVerifier;
    anomalyDetector;
    attackSimulator;
    // Configuration and state
    config;
    activeAlerts = new Map();
    securityMetrics = new Map();
    consensusVotes = new Map();
    // Monitoring and automation
    detectionTimer;
    metricsTimer;
    simulationTimer;
    constructor(authManager, config = {}) {
        super();
        this.logger = new Logger("EnhancedA2ASecurityManager");
        // Initialize configuration
        this.initializeConfig(config);
        // Initialize base security manager
        this.baseSecurityManager = new A2ASecurityManager(authManager, this.config);
        // Initialize enhanced security components
        this.initializeSecurityComponents();
        // Setup integrations
        this.setupComponentIntegrations();
        // Start monitoring and automation
        this.startSecurityAutomation();
        this.logger.info("Enhanced A2A Security Manager initialized", {
            features: [
                "malicious-detection",
                "reputation-system",
                "quarantine-recovery",
                "proof-of-work",
                "trust-verification",
                "ml-anomaly-detection",
                "attack-simulation",
                "consensus-based-detection",
            ],
            config: {
                maliciousDetection: this.config.maliciousDetection.enabled,
                reputation: this.config.reputation.enabled,
                quarantine: this.config.quarantine.enabled,
                trustVerification: this.config.trustVerification.enabled,
                simulation: this.config.simulation.enabled,
            },
        });
    }
    /**
     * Initialize enhanced security configuration
     */
    initializeConfig(config) {
        this.config = {
            // Base security policy settings
            authentication: {
                requireMutualTLS: true,
                requireSignedMessages: true,
                allowSelfSigned: false,
                certificateValidityPeriod: 365 * 24 * 60 * 60 * 1000,
                keyRotationInterval: 30 * 24 * 60 * 60 * 1000,
                ...config.authentication,
            },
            authorization: {
                defaultTrustLevel: "untrusted",
                capabilityExpiration: 24 * 60 * 60 * 1000,
                requireExplicitPermissions: true,
                allowCapabilityDelegation: false,
                ...config.authorization,
            },
            rateLimiting: {
                defaultRequestsPerMinute: 100,
                burstThreshold: 5,
                adaptiveThrottling: true,
                ddosProtection: true,
                ...config.rateLimiting,
            },
            monitoring: {
                auditLevel: "comprehensive",
                anomalyDetection: true,
                threatIntelligence: true,
                realTimeAlerts: true,
                ...config.monitoring,
            },
            zeroTrust: {
                continuousVerification: true,
                leastPrivilege: true,
                networkSegmentation: true,
                behaviorAnalysis: true,
                ...config.zeroTrust,
            },
            // Enhanced security settings
            maliciousDetection: {
                enabled: true,
                detectionInterval: 30000, // 30 seconds
                consensusRounds: 3,
                confidenceThreshold: 0.75,
                autoQuarantine: true,
                mlDetection: true,
                ...config.maliciousDetection,
            },
            reputation: {
                enabled: true,
                initialScore: 500,
                decayRate: 0.001,
                endorsementWeight: 0.15,
                challengeRewards: true,
                ...config.reputation,
            },
            quarantine: {
                enabled: true,
                defaultLevel: "soft",
                maxQuarantineTime: 2592000000, // 30 days
                recoveryEnabled: true,
                proofOfWorkRequired: true,
                ...config.quarantine,
            },
            trustVerification: {
                enabled: true,
                requiredVerifiers: 3,
                trustDecayRate: 0.001,
                zkProofsEnabled: true,
                ...config.trustVerification,
            },
            simulation: {
                enabled: true,
                periodicTesting: true,
                testingInterval: 604800000, // 7 days
                alertOnFailure: true,
                ...config.simulation,
            },
        };
    }
    /**
     * Initialize enhanced security components
     */
    initializeSecurityComponents() {
        // Initialize malicious agent detector
        if (this.config.maliciousDetection.enabled) {
            this.maliciousDetector = new MaliciousAgentDetector();
        }
        // Initialize reputation system
        if (this.config.reputation.enabled) {
            this.reputationSystem = new ReputationSystem({
                weights: {
                    behavior: 0.3,
                    performance: 0.25,
                    consensus: 0.2,
                    peer: this.config.reputation.endorsementWeight,
                    stability: 0.1,
                },
                decayFactors: {
                    dailyDecay: 1 - this.config.reputation.decayRate,
                    inactivityPenalty: 0.02,
                    recoveryBonus: 0.01,
                },
            });
        }
        // Initialize quarantine manager
        if (this.config.quarantine.enabled) {
            this.quarantineManager = new QuarantineRecoveryManager();
        }
        // Initialize proof-of-work manager
        this.proofOfWorkManager = new ProofOfWorkManager();
        // Initialize trust verifier
        if (this.config.trustVerification.enabled) {
            this.trustVerifier = new DistributedTrustVerifier();
        }
        // Initialize ML anomaly detector
        if (this.config.maliciousDetection.mlDetection) {
            this.anomalyDetector = new MLAnomalyDetector();
        }
        // Initialize attack simulator
        if (this.config.simulation.enabled) {
            this.attackSimulator = new AttackSimulationFramework(this.maliciousDetector, this.reputationSystem, this.quarantineManager);
        }
    }
    /**
     * Setup integrations between components
     */
    setupComponentIntegrations() {
        // Base security manager events
        this.baseSecurityManager.on("agent_registered", async (identity) => {
            await this.handleAgentRegistration(identity);
        });
        this.baseSecurityManager.on("message_received", async (event) => {
            await this.handleMessageReceived(event.message, event.payload, event.anomalies);
        });
        this.baseSecurityManager.on("security_alert", async (event) => {
            await this.handleSecurityAlert(event);
        });
        // Malicious detector events
        if (this.maliciousDetector) {
            this.maliciousDetector.on("consensus_detection_request", async (event) => {
                await this.handleConsensusDetectionRequest(event);
            });
            this.maliciousDetector.on("agent_quarantined", async (event) => {
                await this.handleMaliciousAgentDetected(event);
            });
        }
        // Reputation system events
        if (this.reputationSystem) {
            this.reputationSystem.on("trust_level_changed", async (event) => {
                await this.handleTrustLevelChange(event);
            });
        }
        // Quarantine manager events
        if (this.quarantineManager) {
            this.quarantineManager.on("agent_quarantined", async (event) => {
                await this.handleAgentQuarantined(event);
            });
            this.quarantineManager.on("agent_recovered", async (event) => {
                await this.handleAgentRecovered(event);
            });
        }
        // Trust verifier events
        if (this.trustVerifier) {
            this.trustVerifier.on("trust_assertion_verified", async (event) => {
                await this.handleTrustAssertionVerified(event);
            });
        }
        // Attack simulator events
        if (this.attackSimulator) {
            this.attackSimulator.on("simulation_completed", async (result) => {
                await this.handleSimulationCompleted(result);
            });
        }
    }
    /**
     * Start security automation processes
     */
    startSecurityAutomation() {
        // Start malicious detection monitoring
        if (this.config.maliciousDetection.enabled) {
            this.detectionTimer = setInterval(async () => {
                await this.performMaliciousDetectionRound();
            }, this.config.maliciousDetection.detectionInterval);
        }
        // Start security metrics collection
        this.metricsTimer = setInterval(async () => {
            await this.collectSecurityMetrics();
        }, 60000); // Every minute
        // Start periodic security testing
        if (this.config.simulation.enabled &&
            this.config.simulation.periodicTesting) {
            this.simulationTimer = setInterval(async () => {
                await this.runPeriodicSecurityTest();
            }, this.config.simulation.testingInterval);
        }
    }
    /**
     * Enhanced agent registration with security checks
     */
    async registerAgent(agentId, agentType, publicKey, certificates, capabilities = []) {
        // Register with base security manager
        const identity = await this.baseSecurityManager.registerAgent(agentId, agentType, publicKey, certificates, capabilities);
        // Enhanced security processing
        await this.handleAgentRegistration(identity);
        return identity;
    }
    /**
     * Enhanced message processing with behavioral analysis
     */
    async sendSecureMessage(fromAgentId, toAgentId, messageType, payload, options = {}) {
        // Check agent reputation and quarantine status
        await this.validateAgentForMessaging(fromAgentId);
        // Send message through base security manager
        const message = await this.baseSecurityManager.sendSecureMessage(fromAgentId, toAgentId, messageType, payload, options);
        // Record behavior for analysis
        if (this.maliciousDetector) {
            const identity = this.baseSecurityManager
                .getAgentIdentities()
                .find((id) => id.agentId === fromAgentId);
            if (identity) {
                await this.maliciousDetector.recordAgentBehavior(fromAgentId, message, identity);
            }
        }
        return message;
    }
    /**
     * Enhanced message verification with anomaly detection
     */
    async receiveSecureMessage(message, receivingAgentId) {
        // Process with base security manager
        const result = await this.baseSecurityManager.receiveSecureMessage(message, receivingAgentId);
        if (result.valid) {
            // Perform enhanced security analysis
            await this.handleMessageReceived(message, result.payload, result.metadata?.anomalies || []);
        }
        return result;
    }
    /**
     * Submit consensus vote for malicious agent detection
     */
    async submitMaliciousDetectionVote(targetAgentId, voterAgentId, isMalicious, confidence, evidence, round = 1) {
        if (!this.maliciousDetector) {
            throw new Error("Malicious detection is not enabled");
        }
        const vote = {
            voterId: voterAgentId,
            targetAgentId,
            isMalicious,
            confidence,
            evidence,
            timestamp: new Date(),
            round,
        };
        await this.maliciousDetector.submitConsensusVote(vote);
        // Track votes for analysis
        const votes = this.consensusVotes.get(targetAgentId) || [];
        votes.push(vote);
        this.consensusVotes.set(targetAgentId, votes);
        this.logger.info("Malicious detection vote submitted", {
            voter: voterAgentId,
            target: targetAgentId,
            isMalicious,
            confidence,
            round,
        });
    }
    /**
     * Submit peer reputation feedback
     */
    async submitPeerFeedback(fromAgentId, toAgentId, rating, category, comment, evidence) {
        if (!this.reputationSystem) {
            throw new Error("Reputation system is not enabled");
        }
        return await this.reputationSystem.submitPeerFeedback(fromAgentId, toAgentId, rating, category, comment, evidence);
    }
    /**
     * Create proof-of-work challenge for agent verification
     */
    async createVerificationChallenge(agentId, purpose = "verification", difficulty) {
        return await this.proofOfWorkManager.createChallenge(agentId, purpose, "sha256", difficulty);
    }
    /**
     * Submit trust assertion for distributed verification
     */
    async submitTrustAssertion(fromAgentId, toAgentId, trustLevel, domains, evidence, context) {
        if (!this.trustVerifier) {
            throw new Error("Trust verification is not enabled");
        }
        return await this.trustVerifier.submitTrustAssertion(fromAgentId, toAgentId, trustLevel, domains, evidence, undefined, context);
    }
    /**
     * Run security simulation test
     */
    async runSecurityTest(scenarioId) {
        if (!this.attackSimulator) {
            throw new Error("Attack simulation is not enabled");
        }
        return await this.attackSimulator.runSimulation(scenarioId);
    }
    /**
     * Get comprehensive security dashboard
     */
    async getSecurityDashboard() {
        const agentIdentities = this.baseSecurityManager.getAgentIdentities();
        const recentEvents = this.baseSecurityManager.getSecurityEvents(50);
        // Calculate security metrics
        const quarantinedCount = this.quarantineManager
            ? this.quarantineManager.getQuarantinedAgents().length
            : 0;
        const suspiciousCount = this.maliciousDetector
            ? (await this.maliciousDetector.getSystemStats()).totalQuarantined || 0
            : 0;
        const avgReputationScore = this.reputationSystem
            ? (await this.reputationSystem.getSystemStats()).averageScore || 500
            : 500;
        // Determine overall security level
        let securityLevel = "excellent";
        if (quarantinedCount > agentIdentities.length * 0.1) {
            securityLevel = "critical";
        }
        else if (suspiciousCount > agentIdentities.length * 0.05) {
            securityLevel = "warning";
        }
        else if (avgReputationScore < 400) {
            securityLevel = "good";
        }
        const dashboard = {
            timestamp: new Date(),
            securityLevel,
            threatsDetected: suspiciousCount,
            activeQuarantines: quarantinedCount,
            systemHealth: this.calculateSystemHealth(),
            totalAgents: agentIdentities.length,
            trustedAgents: agentIdentities.filter((a) => a.trustLevel === "trusted")
                .length,
            suspiciousAgents: suspiciousCount,
            quarantinedAgents: quarantinedCount,
            detection: {
                totalDetections: this.maliciousDetector
                    ? (await this.maliciousDetector.getSystemStats()).totalQuarantined ||
                        0
                    : 0,
                avgDetectionTime: this.calculateAverageDetectionTime(),
                detectionAccuracy: this.calculateDetectionAccuracy(),
                falsePositiveRate: this.calculateFalsePositiveRate(),
            },
            reputation: {
                averageScore: avgReputationScore,
                trustLevelDistribution: this.calculateTrustLevelDistribution(agentIdentities),
                endorsementsToday: this.calculateTodayEndorsements(),
                challengesCompleted: this.calculateCompletedChallenges(),
            },
            network: {
                consensusHealth: this.calculateConsensusHealth(),
                messageThroughput: this.calculateMessageThroughput(),
                networkLatency: this.calculateNetworkLatency(),
                fragmentationLevel: this.calculateFragmentationLevel(),
            },
            recentEvents: recentEvents.slice(0, 20),
            activeAlerts: Array.from(this.activeAlerts.values())
                .filter((alert) => !alert.autoResolved)
                .slice(0, 10),
        };
        return dashboard;
    }
    /**
     * Event handlers
     */
    async handleAgentRegistration(identity) {
        // Initialize reputation score
        if (this.reputationSystem) {
            await this.reputationSystem.initializeAgentReputation(identity.agentId, identity);
        }
        // Create initial behavior profile
        if (this.maliciousDetector) {
            // Initial behavior recording will happen with first message
        }
        // Submit initial trust assertion if trust verification is enabled
        if (this.trustVerifier && identity.trustLevel !== "untrusted") {
            await this.trustVerifier.submitTrustAssertion("system", identity.agentId, this.mapTrustLevelToScore(identity.trustLevel), ["general"], [
                {
                    type: "registration",
                    description: "Agent registration verification",
                    verifiable: true,
                },
            ], undefined, "agent_registration");
        }
        this.logger.info("Agent registered with enhanced security", {
            agentId: identity.agentId,
            trustLevel: identity.trustLevel,
            capabilities: identity.capabilities.length,
        });
    }
    async handleMessageReceived(message, payload, anomalies) {
        // Update reputation based on message behavior
        if (this.reputationSystem) {
            const isGoodBehavior = anomalies.length === 0;
            const reputationImpact = isGoodBehavior ? 5 : -10;
            await this.reputationSystem.recordReputationEvent({
                agentId: message.from,
                type: isGoodBehavior ? "positive" : "negative",
                category: "message_behavior",
                impact: reputationImpact,
                description: isGoodBehavior
                    ? "Clean message sent"
                    : `Message with ${anomalies.length} anomalies`,
                evidence: { messageId: message.id, anomalies },
            });
        }
        // Check for malicious patterns if anomalies detected
        if (anomalies.length > 0 && this.maliciousDetector) {
            const identity = this.baseSecurityManager
                .getAgentIdentities()
                .find((id) => id.agentId === message.from);
            if (identity) {
                // Record suspicious behavior
                await this.maliciousDetector.recordAgentBehavior(message.from, message, identity);
            }
        }
    }
    async handleSecurityAlert(event) {
        // Create enhanced security alert
        const alert = {
            alertId: crypto.randomUUID(),
            severity: this.mapEventSeverityToAlertSeverity(event.severity),
            type: event.type,
            title: `Security Event: ${event.type}`,
            description: JSON.stringify(event.details),
            timestamp: event.timestamp,
            agentId: event.agentId,
            autoResolved: false,
            actions: this.determineAlertActions(event),
        };
        this.activeAlerts.set(alert.alertId, alert);
        // Auto-resolve low severity alerts after 1 hour
        if (alert.severity === "low") {
            setTimeout(() => {
                alert.autoResolved = true;
            }, 3600000);
        }
        this.emit("security_alert", alert);
    }
    async handleConsensusDetectionRequest(event) {
        const { targetAgentId, detectionResult, round } = event;
        // Broadcast consensus detection request to other agents
        this.emit("consensus_detection_request", {
            targetAgentId,
            detectionResult,
            round,
            deadline: new Date(Date.now() + 300000), // 5 minutes
        });
        this.logger.info("Consensus detection request initiated", {
            targetAgent: targetAgentId,
            round,
            confidence: detectionResult.confidence,
        });
    }
    async handleMaliciousAgentDetected(event) {
        const { agentId, detection } = event;
        // Auto-quarantine if enabled
        if (this.config.maliciousDetection.autoQuarantine &&
            this.quarantineManager) {
            await this.quarantineManager.quarantineAgent(agentId, this.config.quarantine.defaultLevel, "Malicious behavior detected", detection.evidence, detection, "enhanced_security_manager");
        }
        // Update reputation
        if (this.reputationSystem) {
            await this.reputationSystem.recordReputationEvent({
                agentId,
                type: "negative",
                category: "malicious_behavior",
                impact: -100,
                description: "Malicious agent detected by consensus",
                evidence: detection,
            });
        }
        // Create critical alert
        const alert = {
            alertId: crypto.randomUUID(),
            severity: "critical",
            type: "malicious_agent_detected",
            title: "Malicious Agent Detected",
            description: `Agent ${agentId} detected as malicious with confidence ${detection.confidence}`,
            timestamp: new Date(),
            agentId,
            autoResolved: false,
            actions: ["quarantine", "investigate", "monitor"],
        };
        this.activeAlerts.set(alert.alertId, alert);
        this.emit("malicious_agent_detected", { agentId, detection, alert });
    }
    async handleTrustLevelChange(event) {
        const { agentId, oldLevel, newLevel, score } = event;
        this.logger.info("Agent trust level changed", {
            agentId,
            oldLevel,
            newLevel,
            score,
        });
        // Update base security manager trust level if needed
        const identities = this.baseSecurityManager.getAgentIdentities();
        const identity = identities.find((id) => id.agentId === agentId);
        if (identity) {
            identity.trustLevel = this.mapScoreToTrustLevel(score);
        }
        this.emit("trust_level_changed", event);
    }
    async handleAgentQuarantined(event) {
        const { agentId, record } = event;
        this.logger.warn("Agent quarantined", {
            agentId,
            level: record.level,
            reason: record.reason,
        });
        // Create alert
        const alert = {
            alertId: crypto.randomUUID(),
            severity: "high",
            type: "agent_quarantined",
            title: "Agent Quarantined",
            description: `Agent ${agentId} quarantined at ${record.level} level: ${record.reason}`,
            timestamp: new Date(),
            agentId,
            autoResolved: false,
            actions: ["monitor_recovery", "review_evidence"],
        };
        this.activeAlerts.set(alert.alertId, alert);
        this.emit("agent_quarantined", event);
    }
    async handleAgentRecovered(event) {
        const { agentId } = event;
        this.logger.info("Agent recovered from quarantine", { agentId });
        // Update reputation with recovery bonus
        if (this.reputationSystem) {
            await this.reputationSystem.recordReputationEvent({
                agentId,
                type: "positive",
                category: "recovery",
                impact: 25,
                description: "Agent successfully recovered from quarantine",
                evidence: event,
            });
        }
        this.emit("agent_recovered", event);
    }
    async handleTrustAssertionVerified(assertion) {
        this.logger.info("Trust assertion verified", {
            fromAgent: assertion.fromAgentId,
            toAgent: assertion.toAgentId,
            trustLevel: assertion.trustLevel,
        });
        this.emit("trust_assertion_verified", assertion);
    }
    async handleSimulationCompleted(result) {
        this.logger.info("Security simulation completed", {
            simulationId: result.simulationId,
            scenarioId: result.scenarioId,
            success: result.success.meetsCriteria,
            detectionTime: result.detection.detectionTime,
        });
        // Create alert if simulation failed
        if (!result.success.meetsCriteria &&
            this.config.simulation.alertOnFailure) {
            const alert = {
                alertId: crypto.randomUUID(),
                severity: "warning",
                type: "simulation_failed",
                title: "Security Simulation Failed",
                description: `Simulation ${result.scenarioId} failed to meet success criteria`,
                timestamp: new Date(),
                autoResolved: false,
                actions: ["review_results", "improve_security", "retest"],
            };
            this.activeAlerts.set(alert.alertId, alert);
        }
        this.emit("simulation_completed", result);
    }
    /**
     * Automated security processes
     */
    async performMaliciousDetectionRound() {
        if (!this.maliciousDetector)
            return;
        try {
            // Get all agent identities
            const identities = this.baseSecurityManager.getAgentIdentities();
            for (const identity of identities) {
                // Skip quarantined agents
                if (this.quarantineManager?.isQuarantined(identity.agentId)) {
                    continue;
                }
                // Get behavior profile
                const behaviorProfile = this.maliciousDetector.getBehaviorProfile(identity.agentId);
                if (behaviorProfile) {
                    // Run anomaly detection
                    if (this.anomalyDetector) {
                        const anomalies = await this.anomalyDetector.detectAnomalies(behaviorProfile);
                        if (anomalies.length > 0) {
                            const highSeverityAnomalies = anomalies.filter((a) => a.severity === "high" || a.severity === "critical");
                            if (highSeverityAnomalies.length > 0) {
                                this.logger.warn("High severity anomalies detected", {
                                    agentId: identity.agentId,
                                    anomalies: highSeverityAnomalies.length,
                                });
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error("Malicious detection round failed", { error });
        }
    }
    async collectSecurityMetrics() {
        try {
            const metrics = {
                timestamp: new Date(),
                totalAgents: this.baseSecurityManager.getAgentIdentities().length,
                quarantinedAgents: this.quarantineManager
                    ? this.quarantineManager.getQuarantinedAgents().length
                    : 0,
                activeAlerts: this.activeAlerts.size,
                systemHealth: this.calculateSystemHealth(),
            };
            this.securityMetrics.set("current", metrics);
            this.emit("security_metrics", metrics);
        }
        catch (error) {
            this.logger.error("Failed to collect security metrics", { error });
        }
    }
    async runPeriodicSecurityTest() {
        if (!this.attackSimulator)
            return;
        try {
            // Run a random attack scenario
            const scenarios = this.attackSimulator.getAttackScenarios();
            const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            this.logger.info("Starting periodic security test", {
                scenario: randomScenario.name,
            });
            const result = await this.attackSimulator.runSimulation(randomScenario.scenarioId);
            this.logger.info("Periodic security test completed", {
                scenario: randomScenario.name,
                success: result.success.meetsCriteria,
            });
        }
        catch (error) {
            this.logger.error("Periodic security test failed", { error });
        }
    }
    /**
     * Validation and utility methods
     */
    async validateAgentForMessaging(agentId) {
        // Check quarantine status
        if (this.quarantineManager?.isQuarantined(agentId)) {
            throw new Error("Agent is quarantined and cannot send messages");
        }
        // Check reputation score
        if (this.reputationSystem) {
            const reputation = this.reputationSystem.getReputationScore(agentId);
            if (reputation && reputation.overallScore < 200) {
                throw new Error("Agent reputation too low for messaging");
            }
        }
    }
    mapTrustLevelToScore(trustLevel) {
        const mapping = {
            untrusted: 0.1,
            basic: 0.4,
            verified: 0.7,
            trusted: 0.9,
        };
        return mapping[trustLevel] || 0.1;
    }
    mapScoreToTrustLevel(score) {
        if (score >= 750)
            return "trusted";
        if (score >= 500)
            return "verified";
        if (score >= 250)
            return "basic";
        return "untrusted";
    }
    mapEventSeverityToAlertSeverity(severity) {
        const mapping = {
            info: "low",
            warning: "medium",
            error: "high",
            critical: "critical",
        };
        return mapping[severity] || "medium";
    }
    determineAlertActions(event) {
        const actions = [];
        switch (event.type) {
            case "authentication":
                actions.push("verify_identity", "check_certificates");
                break;
            case "authorization":
                actions.push("review_permissions", "audit_access");
                break;
            case "rate_limit":
                actions.push("monitor_traffic", "adjust_limits");
                break;
            case "anomaly":
                actions.push("investigate", "monitor");
                break;
            case "threat":
                actions.push("quarantine", "investigate", "alert_admins");
                break;
        }
        return actions;
    }
    calculateSystemHealth() {
        const identities = this.baseSecurityManager.getAgentIdentities();
        const totalAgents = identities.length;
        if (totalAgents === 0)
            return 1.0;
        const quarantinedCount = this.quarantineManager
            ? this.quarantineManager.getQuarantinedAgents().length
            : 0;
        const criticalAlerts = Array.from(this.activeAlerts.values()).filter((alert) => alert.severity === "critical" && !alert.autoResolved).length;
        const quarantineImpact = (quarantinedCount / totalAgents) * 0.5;
        const alertImpact = Math.min(0.3, criticalAlerts * 0.1);
        return Math.max(0, 1.0 - quarantineImpact - alertImpact);
    }
    calculateAverageDetectionTime() {
        // Implementation would track detection times
        return 30000; // 30 seconds placeholder
    }
    calculateDetectionAccuracy() {
        // Implementation would track detection accuracy
        return 0.85; // 85% placeholder
    }
    calculateFalsePositiveRate() {
        // Implementation would track false positives
        return 0.05; // 5% placeholder
    }
    calculateTrustLevelDistribution(identities) {
        const distribution = { untrusted: 0, basic: 0, verified: 0, trusted: 0 };
        identities.forEach((identity) => {
            distribution[identity.trustLevel]++;
        });
        return distribution;
    }
    calculateTodayEndorsements() {
        // Implementation would track daily endorsements
        return 0; // Placeholder
    }
    calculateCompletedChallenges() {
        // Implementation would track completed challenges
        return 0; // Placeholder
    }
    calculateConsensusHealth() {
        // Implementation would assess consensus protocol health
        return 0.9; // 90% placeholder
    }
    calculateMessageThroughput() {
        // Implementation would track message throughput
        return 100; // 100 messages/second placeholder
    }
    calculateNetworkLatency() {
        // Implementation would track network latency
        return 50; // 50ms placeholder
    }
    calculateFragmentationLevel() {
        // Implementation would assess network fragmentation
        return 0.1; // 10% placeholder
    }
    /**
     * Public API methods - delegate to base security manager or enhanced components
     */
    getSecurityPolicy() {
        return this.baseSecurityManager.getSecurityPolicy();
    }
    getAgentIdentities() {
        return this.baseSecurityManager.getAgentIdentities();
    }
    getActiveSessions() {
        return this.baseSecurityManager.getActiveSessions();
    }
    getSecurityEvents(limit) {
        return this.baseSecurityManager.getSecurityEvents(limit);
    }
    getPerformanceMetrics() {
        return this.baseSecurityManager.getPerformanceMetrics();
    }
    getReputationScore(agentId) {
        return this.reputationSystem?.getReputationScore(agentId) || null;
    }
    getQuarantineRecord(agentId) {
        return this.quarantineManager?.getQuarantineRecord(agentId) || null;
    }
    isQuarantined(agentId) {
        return this.quarantineManager?.isQuarantined(agentId) || false;
    }
    async emergencyShutdown(reason) {
        this.logger.error("Emergency shutdown initiated", { reason });
        // Stop all timers
        if (this.detectionTimer)
            clearInterval(this.detectionTimer);
        if (this.metricsTimer)
            clearInterval(this.metricsTimer);
        if (this.simulationTimer)
            clearInterval(this.simulationTimer);
        // Shutdown base security manager
        await this.baseSecurityManager.emergencyShutdown(reason);
        this.emit("emergency_shutdown", { reason, timestamp: Date.now() });
    }
}

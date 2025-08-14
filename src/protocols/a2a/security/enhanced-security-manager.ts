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

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Logger } from '../../../utils/logger.js';
import { AuthenticationManager } from '../../../core/auth-manager.js';
import { CacheManager } from '../../../core/cache-manager.js';
import { 
  A2ASecurityManager, 
  A2AIdentity, 
  A2AMessage, 
  SecurityPolicy,
  SecurityEvent 
} from '../../../core/a2a-security-manager.js';
import { 
  MaliciousAgentDetector, 
  MaliciousDetectionResult,
  ConsensusVote,
  BehaviorProfile 
} from './malicious-detection.js';
import { 
  ReputationSystem, 
  ReputationScore,
  PeerFeedback,
  ReputationEvent 
} from './reputation-system.js';
import { 
  QuarantineRecoveryManager,
  QuarantineRecord,
  RecoveryChallenge 
} from './quarantine-recovery.js';
import { 
  ProofOfWorkManager,
  ProofOfWorkChallenge 
} from './proof-of-work.js';
import { 
  DistributedTrustVerifier,
  TrustAssertion 
} from './trust-verification.js';
import { 
  MLAnomalyDetector,
  AnomalyResult 
} from './ml-anomaly-detector.js';
import { 
  AttackSimulationFramework,
  AttackSimulationResult 
} from './attack-simulation.js';

export interface EnhancedSecurityConfig extends SecurityPolicy {
  // Malicious detection settings
  maliciousDetection: {
    enabled: boolean;
    detectionInterval: number;        // Detection check interval (ms)
    consensusRounds: number;         // Rounds for consensus detection
    confidenceThreshold: number;     // Detection confidence threshold
    autoQuarantine: boolean;         // Auto-quarantine detected agents
    mlDetection: boolean;           // Enable ML-based detection
  };
  
  // Reputation system settings
  reputation: {
    enabled: boolean;
    initialScore: number;            // Initial reputation score
    decayRate: number;              // Daily reputation decay
    endorsementWeight: number;       // Weight of peer endorsements
    challengeRewards: boolean;       // Enable challenge rewards
  };
  
  // Quarantine and recovery settings
  quarantine: {
    enabled: boolean;
    defaultLevel: 'observation' | 'soft' | 'hard' | 'complete';
    maxQuarantineTime: number;      // Maximum quarantine duration
    recoveryEnabled: boolean;        // Enable recovery mechanisms
    proofOfWorkRequired: boolean;    // Require PoW for recovery
  };
  
  // Trust verification settings
  trustVerification: {
    enabled: boolean;
    requiredVerifiers: number;       // Required verifiers for trust
    trustDecayRate: number;         // Trust decay over time
    zkProofsEnabled: boolean;       // Enable zero-knowledge proofs
  };
  
  // Attack simulation settings
  simulation: {
    enabled: boolean;
    periodicTesting: boolean;        // Enable periodic security testing
    testingInterval: number;         // Testing interval (ms)
    alertOnFailure: boolean;         // Alert on simulation failures
  };
}

export interface SecurityDashboard {
  timestamp: Date;
  
  // Overall security status
  securityLevel: 'excellent' | 'good' | 'warning' | 'critical';
  threatsDetected: number;
  activeQuarantines: number;
  systemHealth: number;           // 0-1 scale
  
  // Agent statistics
  totalAgents: number;
  trustedAgents: number;
  suspiciousAgents: number;
  quarantinedAgents: number;
  
  // Detection metrics
  detection: {
    totalDetections: number;
    avgDetectionTime: number;
    detectionAccuracy: number;
    falsePositiveRate: number;
  };
  
  // Reputation metrics
  reputation: {
    averageScore: number;
    trustLevelDistribution: Record<string, number>;
    endorsementsToday: number;
    challengesCompleted: number;
  };
  
  // Network health
  network: {
    consensusHealth: number;        // 0-1 scale
    messageThroughput: number;
    networkLatency: number;
    fragmentationLevel: number;
  };
  
  // Recent events
  recentEvents: SecurityEvent[];
  activeAlerts: SecurityAlert[];
}

export interface SecurityAlert {
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  agentId?: string;
  autoResolved: boolean;
  actions: string[];
}

export class EnhancedA2ASecurityManager extends EventEmitter {
  private logger: Logger;
  private baseSecurityManager: A2ASecurityManager;
  
  // Enhanced security components
  private maliciousDetector: MaliciousAgentDetector;
  private reputationSystem: ReputationSystem;
  private quarantineManager: QuarantineRecoveryManager;
  private proofOfWorkManager: ProofOfWorkManager;
  private trustVerifier: DistributedTrustVerifier;
  private anomalyDetector: MLAnomalyDetector;
  private attackSimulator: AttackSimulationFramework;
  
  // Configuration and state
  private config: EnhancedSecurityConfig;
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private securityMetrics: Map<string, any> = new Map();
  private consensusVotes: Map<string, ConsensusVote[]> = new Map();
  
  // Monitoring and automation
  private detectionTimer?: ReturnType<typeof setTimeout>;
  private metricsTimer?: ReturnType<typeof setTimeout>;
  private simulationTimer?: ReturnType<typeof setTimeout>;

  constructor(
    authManager: AuthenticationManager,
    config: Partial<EnhancedSecurityConfig> = {}
  ) {
    super();
    this.logger = new Logger('EnhancedA2ASecurityManager');
    
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
    
    this.logger.info('Enhanced A2A Security Manager initialized', {
      features: [
        'malicious-detection', 'reputation-system', 'quarantine-recovery',
        'proof-of-work', 'trust-verification', 'ml-anomaly-detection',
        'attack-simulation', 'consensus-based-detection'
      ],
      config: {
        maliciousDetection: this.config.maliciousDetection.enabled,
        reputation: this.config.reputation.enabled,
        quarantine: this.config.quarantine.enabled,
        trustVerification: this.config.trustVerification.enabled,
        simulation: this.config.simulation.enabled
      }
    });
  }

  /**
   * Initialize enhanced security configuration
   */
  private initializeConfig(config: Partial<EnhancedSecurityConfig>): void {
    this.config = {
      // Base security policy settings
      authentication: {
        requireMutualTLS: true,
        requireSignedMessages: true,
        allowSelfSigned: false,
        certificateValidityPeriod: 365 * 24 * 60 * 60 * 1000,
        keyRotationInterval: 30 * 24 * 60 * 60 * 1000,
        ...config.authentication
      },
      authorization: {
        defaultTrustLevel: 'untrusted',
        capabilityExpiration: 24 * 60 * 60 * 1000,
        requireExplicitPermissions: true,
        allowCapabilityDelegation: false,
        ...config.authorization
      },
      rateLimiting: {
        defaultRequestsPerMinute: 100,
        burstThreshold: 5,
        adaptiveThrottling: true,
        ddosProtection: true,
        ...config.rateLimiting
      },
      monitoring: {
        auditLevel: 'comprehensive',
        anomalyDetection: true,
        threatIntelligence: true,
        realTimeAlerts: true,
        ...config.monitoring
      },
      zeroTrust: {
        continuousVerification: true,
        leastPrivilege: true,
        networkSegmentation: true,
        behaviorAnalysis: true,
        ...config.zeroTrust
      },
      
      // Enhanced security settings
      maliciousDetection: {
        enabled: true,
        detectionInterval: 30000,     // 30 seconds
        consensusRounds: 3,
        confidenceThreshold: 0.75,
        autoQuarantine: true,
        mlDetection: true,
        ...config.maliciousDetection
      },
      reputation: {
        enabled: true,
        initialScore: 500,
        decayRate: 0.001,
        endorsementWeight: 0.15,
        challengeRewards: true,
        ...config.reputation
      },
      quarantine: {
        enabled: true,
        defaultLevel: 'soft',
        maxQuarantineTime: 2592000000, // 30 days
        recoveryEnabled: true,
        proofOfWorkRequired: true,
        ...config.quarantine
      },
      trustVerification: {
        enabled: true,
        requiredVerifiers: 3,
        trustDecayRate: 0.001,
        zkProofsEnabled: true,
        ...config.trustVerification
      },
      simulation: {
        enabled: true,
        periodicTesting: true,
        testingInterval: 604800000,   // 7 days
        alertOnFailure: true,
        ...config.simulation
      }
    };
  }

  /**
   * Initialize enhanced security components
   */
  private initializeSecurityComponents(): void {
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
          stability: 0.1
        },
        decayFactors: {
          dailyDecay: 1 - this.config.reputation.decayRate,
          inactivityPenalty: 0.02,
          recoveryBonus: 0.01
        }
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
      this.attackSimulator = new AttackSimulationFramework(
        this.maliciousDetector,
        this.reputationSystem,
        this.quarantineManager
      );
    }
  }

  /**
   * Setup integrations between components
   */
  private setupComponentIntegrations(): void {
    // Base security manager events
    this.baseSecurityManager.on('agent_registered', async (identity: A2AIdentity) => {
      await this.handleAgentRegistration(identity);
    });
    
    this.baseSecurityManager.on('message_received', async (event: any) => {
      await this.handleMessageReceived(event.message, event.payload, event.anomalies);
    });
    
    this.baseSecurityManager.on('security_alert', async (event: SecurityEvent) => {
      await this.handleSecurityAlert(event);
    });

    // Malicious detector events
    if (this.maliciousDetector) {
      this.maliciousDetector.on('consensus_detection_request', async (event: any) => {
        await this.handleConsensusDetectionRequest(event);
      });
      
      this.maliciousDetector.on('agent_quarantined', async (event: any) => {
        await this.handleMaliciousAgentDetected(event);
      });
    }

    // Reputation system events
    if (this.reputationSystem) {
      this.reputationSystem.on('trust_level_changed', async (event: any) => {
        await this.handleTrustLevelChange(event);
      });
    }

    // Quarantine manager events
    if (this.quarantineManager) {
      this.quarantineManager.on('agent_quarantined', async (event: any) => {
        await this.handleAgentQuarantined(event);
      });
      
      this.quarantineManager.on('agent_recovered', async (event: any) => {
        await this.handleAgentRecovered(event);
      });
    }

    // Trust verifier events
    if (this.trustVerifier) {
      this.trustVerifier.on('trust_assertion_verified', async (event: TrustAssertion) => {
        await this.handleTrustAssertionVerified(event);
      });
    }

    // Attack simulator events
    if (this.attackSimulator) {
      this.attackSimulator.on('simulation_completed', async (result: AttackSimulationResult) => {
        await this.handleSimulationCompleted(result);
      });
    }
  }

  /**
   * Start security automation processes
   */
  private startSecurityAutomation(): void {
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
    if (this.config.simulation.enabled && this.config.simulation.periodicTesting) {
      this.simulationTimer = setInterval(async () => {
        await this.runPeriodicSecurityTest();
      }, this.config.simulation.testingInterval);
    }
  }

  /**
   * Enhanced agent registration with security checks
   */
  async registerAgent(
    agentId: string,
    agentType: string,
    publicKey: string,
    certificates: {
      identity: string;
      tls: string;
      signing: string;
    },
    capabilities: string[] = []
  ): Promise<A2AIdentity> {
    // Register with base security manager
    const identity = await this.baseSecurityManager.registerAgent(
      agentId, agentType, publicKey, certificates, capabilities
    );

    // Enhanced security processing
    await this.handleAgentRegistration(identity);

    return identity;
  }

  /**
   * Enhanced message processing with behavioral analysis
   */
  async sendSecureMessage(
    fromAgentId: string,
    toAgentId: string | string[],
    messageType: 'request' | 'response' | 'broadcast' | 'gossip',
    payload: any,
    options: any = {}
  ): Promise<A2AMessage> {
    // Check agent reputation and quarantine status
    await this.validateAgentForMessaging(fromAgentId);

    // Send message through base security manager
    const message = await this.baseSecurityManager.sendSecureMessage(
      fromAgentId, toAgentId, messageType, payload, options
    );

    // Record behavior for analysis
    if (this.maliciousDetector) {
      const identity = this.baseSecurityManager.getAgentIdentities()
        .find(id => id.agentId === fromAgentId);
      
      if (identity) {
        await this.maliciousDetector.recordAgentBehavior(fromAgentId, message, identity);
      }
    }

    return message;
  }

  /**
   * Enhanced message verification with anomaly detection
   */
  async receiveSecureMessage(
    message: A2AMessage,
    receivingAgentId: string
  ): Promise<{ valid: boolean; payload?: any; metadata?: any }> {
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
  async submitMaliciousDetectionVote(
    targetAgentId: string,
    voterAgentId: string,
    isMalicious: boolean,
    confidence: number,
    evidence: any,
    round: number = 1
  ): Promise<void> {
    if (!this.maliciousDetector) {
      throw new Error('Malicious detection is not enabled');
    }

    const vote: ConsensusVote = {
      voterId: voterAgentId,
      targetAgentId,
      isMalicious,
      confidence,
      evidence,
      timestamp: new Date(),
      round
    };

    await this.maliciousDetector.submitConsensusVote(vote);

    // Track votes for analysis
    const votes = this.consensusVotes.get(targetAgentId) || [];
    votes.push(vote);
    this.consensusVotes.set(targetAgentId, votes);

    this.logger.info('Malicious detection vote submitted', {
      voter: voterAgentId,
      target: targetAgentId,
      isMalicious,
      confidence,
      round
    });
  }

  /**
   * Submit peer reputation feedback
   */
  async submitPeerFeedback(
    fromAgentId: string,
    toAgentId: string,
    rating: number,
    category: 'behavior' | 'performance' | 'reliability' | 'security' | 'cooperation',
    comment?: string,
    evidence?: any
  ): Promise<boolean> {
    if (!this.reputationSystem) {
      throw new Error('Reputation system is not enabled');
    }

    return await this.reputationSystem.submitPeerFeedback(
      fromAgentId, toAgentId, rating, category, comment, evidence
    );
  }

  /**
   * Create proof-of-work challenge for agent verification
   */
  async createVerificationChallenge(
    agentId: string,
    purpose: 'verification' | 'recovery' | 'trust_building' = 'verification',
    difficulty?: number
  ): Promise<ProofOfWorkChallenge> {
    return await this.proofOfWorkManager.createChallenge(
      agentId, purpose, 'sha256', difficulty
    );
  }

  /**
   * Submit trust assertion for distributed verification
   */
  async submitTrustAssertion(
    fromAgentId: string,
    toAgentId: string,
    trustLevel: number,
    domains: string[],
    evidence: any[],
    context?: string
  ): Promise<TrustAssertion> {
    if (!this.trustVerifier) {
      throw new Error('Trust verification is not enabled');
    }

    return await this.trustVerifier.submitTrustAssertion(
      fromAgentId, toAgentId, trustLevel, domains, evidence, undefined, context
    );
  }

  /**
   * Run security simulation test
   */
  async runSecurityTest(scenarioId: string): Promise<AttackSimulationResult> {
    if (!this.attackSimulator) {
      throw new Error('Attack simulation is not enabled');
    }

    return await this.attackSimulator.runSimulation(scenarioId);
  }

  /**
   * Get comprehensive security dashboard
   */
  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const agentIdentities = this.baseSecurityManager.getAgentIdentities();
    const recentEvents = this.baseSecurityManager.getSecurityEvents(50);
    
    // Calculate security metrics
    const quarantinedCount = this.quarantineManager ? 
      this.quarantineManager.getQuarantinedAgents().length : 0;
    
    const suspiciousCount = this.maliciousDetector ?
      (await this.maliciousDetector.getSystemStats()).totalQuarantined || 0 : 0;
    
    const avgReputationScore = this.reputationSystem ?
      (await this.reputationSystem.getSystemStats()).averageScore || 500 : 500;

    // Determine overall security level
    let securityLevel: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    
    if (quarantinedCount > agentIdentities.length * 0.1) {
      securityLevel = 'critical';
    } else if (suspiciousCount > agentIdentities.length * 0.05) {
      securityLevel = 'warning';
    } else if (avgReputationScore < 400) {
      securityLevel = 'good';
    }

    const dashboard: SecurityDashboard = {
      timestamp: new Date(),
      securityLevel,
      threatsDetected: suspiciousCount,
      activeQuarantines: quarantinedCount,
      systemHealth: this.calculateSystemHealth(),
      
      totalAgents: agentIdentities.length,
      trustedAgents: agentIdentities.filter(a => a.trustLevel === 'trusted').length,
      suspiciousAgents: suspiciousCount,
      quarantinedAgents: quarantinedCount,
      
      detection: {
        totalDetections: this.maliciousDetector ? 
          (await this.maliciousDetector.getSystemStats()).totalQuarantined || 0 : 0,
        avgDetectionTime: this.calculateAverageDetectionTime(),
        detectionAccuracy: this.calculateDetectionAccuracy(),
        falsePositiveRate: this.calculateFalsePositiveRate()
      },
      
      reputation: {
        averageScore: avgReputationScore,
        trustLevelDistribution: this.calculateTrustLevelDistribution(agentIdentities),
        endorsementsToday: this.calculateTodayEndorsements(),
        challengesCompleted: this.calculateCompletedChallenges()
      },
      
      network: {
        consensusHealth: this.calculateConsensusHealth(),
        messageThroughput: this.calculateMessageThroughput(),
        networkLatency: this.calculateNetworkLatency(),
        fragmentationLevel: this.calculateFragmentationLevel()
      },
      
      recentEvents: recentEvents.slice(0, 20),
      activeAlerts: Array.from(this.activeAlerts.values())
        .filter(alert => !alert.autoResolved)
        .slice(0, 10)
    };

    return dashboard;
  }

  /**
   * Event handlers
   */

  private async handleAgentRegistration(identity: A2AIdentity): Promise<void> {
    // Initialize reputation score
    if (this.reputationSystem) {
      await this.reputationSystem.initializeAgentReputation(identity.agentId, identity);
    }

    // Create initial behavior profile
    if (this.maliciousDetector) {
      // Initial behavior recording will happen with first message
    }

    // Submit initial trust assertion if trust verification is enabled
    if (this.trustVerifier && identity.trustLevel !== 'untrusted') {
      await this.trustVerifier.submitTrustAssertion(
        'system',
        identity.agentId,
        this.mapTrustLevelToScore(identity.trustLevel),
        ['general'],
        [{ type: 'registration', description: 'Agent registration verification', verifiable: true }],
        undefined,
        'agent_registration'
      );
    }

    this.logger.info('Agent registered with enhanced security', {
      agentId: identity.agentId,
      trustLevel: identity.trustLevel,
      capabilities: identity.capabilities.length
    });
  }

  private async handleMessageReceived(message: A2AMessage, payload: any, anomalies: any[]): Promise<void> {
    // Update reputation based on message behavior
    if (this.reputationSystem) {
      const isGoodBehavior = anomalies.length === 0;
      const reputationImpact = isGoodBehavior ? 5 : -10;
      
      await this.reputationSystem.recordReputationEvent({
        agentId: message.from,
        type: isGoodBehavior ? 'positive' : 'negative',
        category: 'message_behavior',
        impact: reputationImpact,
        description: isGoodBehavior ? 'Clean message sent' : `Message with ${anomalies.length} anomalies`,
        evidence: { messageId: message.id, anomalies }
      });
    }

    // Check for malicious patterns if anomalies detected
    if (anomalies.length > 0 && this.maliciousDetector) {
      const identity = this.baseSecurityManager.getAgentIdentities()
        .find(id => id.agentId === message.from);
      
      if (identity) {
        // Record suspicious behavior
        await this.maliciousDetector.recordAgentBehavior(message.from, message, identity);
      }
    }
  }

  private async handleSecurityAlert(event: SecurityEvent): Promise<void> {
    // Create enhanced security alert
    const alert: SecurityAlert = {
      alertId: crypto.randomUUID(),
      severity: this.mapEventSeverityToAlertSeverity(event.severity),
      type: event.type,
      title: `Security Event: ${event.type}`,
      description: JSON.stringify(event.details),
      timestamp: event.timestamp,
      agentId: event.agentId,
      autoResolved: false,
      actions: this.determineAlertActions(event)
    };

    this.activeAlerts.set(alert.alertId, alert);

    // Auto-resolve low severity alerts after 1 hour
    if (alert.severity === 'low') {
      setTimeout(() => {
        alert.autoResolved = true;
      }, 3600000);
    }

    this.emit('security_alert', alert);
  }

  private async handleConsensusDetectionRequest(event: any): Promise<void> {
    const { targetAgentId, detectionResult, round } = event;
    
    // Broadcast consensus detection request to other agents
    this.emit('consensus_detection_request', {
      targetAgentId,
      detectionResult,
      round,
      deadline: new Date(Date.now() + 300000) // 5 minutes
    });

    this.logger.info('Consensus detection request initiated', {
      targetAgent: targetAgentId,
      round,
      confidence: detectionResult.confidence
    });
  }

  private async handleMaliciousAgentDetected(event: any): Promise<void> {
    const { agentId, detection } = event;
    
    // Auto-quarantine if enabled
    if (this.config.maliciousDetection.autoQuarantine && this.quarantineManager) {
      await this.quarantineManager.quarantineAgent(
        agentId,
        this.config.quarantine.defaultLevel,
        'Malicious behavior detected',
        detection.evidence,
        detection,
        'enhanced_security_manager'
      );
    }

    // Update reputation
    if (this.reputationSystem) {
      await this.reputationSystem.recordReputationEvent({
        agentId,
        type: 'negative',
        category: 'malicious_behavior',
        impact: -100,
        description: 'Malicious agent detected by consensus',
        evidence: detection
      });
    }

    // Create critical alert
    const alert: SecurityAlert = {
      alertId: crypto.randomUUID(),
      severity: 'critical',
      type: 'malicious_agent_detected',
      title: 'Malicious Agent Detected',
      description: `Agent ${agentId} detected as malicious with confidence ${detection.confidence}`,
      timestamp: new Date(),
      agentId,
      autoResolved: false,
      actions: ['quarantine', 'investigate', 'monitor']
    };

    this.activeAlerts.set(alert.alertId, alert);
    this.emit('malicious_agent_detected', { agentId, detection, alert });
  }

  private async handleTrustLevelChange(event: any): Promise<void> {
    const { agentId, oldLevel, newLevel, score } = event;
    
    this.logger.info('Agent trust level changed', {
      agentId,
      oldLevel,
      newLevel,
      score
    });

    // Update base security manager trust level if needed
    const identities = this.baseSecurityManager.getAgentIdentities();
    const identity = identities.find(id => id.agentId === agentId);
    
    if (identity) {
      identity.trustLevel = this.mapScoreToTrustLevel(score);
    }

    this.emit('trust_level_changed', event);
  }

  private async handleAgentQuarantined(event: any): Promise<void> {
    const { agentId, record } = event;
    
    this.logger.warn('Agent quarantined', {
      agentId,
      level: record.level,
      reason: record.reason
    });

    // Create alert
    const alert: SecurityAlert = {
      alertId: crypto.randomUUID(),
      severity: 'high',
      type: 'agent_quarantined',
      title: 'Agent Quarantined',
      description: `Agent ${agentId} quarantined at ${record.level} level: ${record.reason}`,
      timestamp: new Date(),
      agentId,
      autoResolved: false,
      actions: ['monitor_recovery', 'review_evidence']
    };

    this.activeAlerts.set(alert.alertId, alert);
    this.emit('agent_quarantined', event);
  }

  private async handleAgentRecovered(event: any): Promise<void> {
    const { agentId } = event;
    
    this.logger.info('Agent recovered from quarantine', { agentId });

    // Update reputation with recovery bonus
    if (this.reputationSystem) {
      await this.reputationSystem.recordReputationEvent({
        agentId,
        type: 'positive',
        category: 'recovery',
        impact: 25,
        description: 'Agent successfully recovered from quarantine',
        evidence: event
      });
    }

    this.emit('agent_recovered', event);
  }

  private async handleTrustAssertionVerified(assertion: TrustAssertion): Promise<void> {
    this.logger.info('Trust assertion verified', {
      fromAgent: assertion.fromAgentId,
      toAgent: assertion.toAgentId,
      trustLevel: assertion.trustLevel
    });

    this.emit('trust_assertion_verified', assertion);
  }

  private async handleSimulationCompleted(result: AttackSimulationResult): Promise<void> {
    this.logger.info('Security simulation completed', {
      simulationId: result.simulationId,
      scenarioId: result.scenarioId,
      success: result.success.meetsCriteria,
      detectionTime: result.detection.detectionTime
    });

    // Create alert if simulation failed
    if (!result.success.meetsCriteria && this.config.simulation.alertOnFailure) {
      const alert: SecurityAlert = {
        alertId: crypto.randomUUID(),
        severity: 'warning',
        type: 'simulation_failed',
        title: 'Security Simulation Failed',
        description: `Simulation ${result.scenarioId} failed to meet success criteria`,
        timestamp: new Date(),
        autoResolved: false,
        actions: ['review_results', 'improve_security', 'retest']
      };

      this.activeAlerts.set(alert.alertId, alert);
    }

    this.emit('simulation_completed', result);
  }

  /**
   * Automated security processes
   */

  private async performMaliciousDetectionRound(): Promise<void> {
    if (!this.maliciousDetector) return;

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
              const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high' || a.severity === 'critical');
              
              if (highSeverityAnomalies.length > 0) {
                this.logger.warn('High severity anomalies detected', {
                  agentId: identity.agentId,
                  anomalies: highSeverityAnomalies.length
                });
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Malicious detection round failed', { error });
    }
  }

  private async collectSecurityMetrics(): Promise<void> {
    try {
      const metrics = {
        timestamp: new Date(),
        totalAgents: this.baseSecurityManager.getAgentIdentities().length,
        quarantinedAgents: this.quarantineManager ? this.quarantineManager.getQuarantinedAgents().length : 0,
        activeAlerts: this.activeAlerts.size,
        systemHealth: this.calculateSystemHealth()
      };

      this.securityMetrics.set('current', metrics);
      this.emit('security_metrics', metrics);
    } catch (error) {
      this.logger.error('Failed to collect security metrics', { error });
    }
  }

  private async runPeriodicSecurityTest(): Promise<void> {
    if (!this.attackSimulator) return;

    try {
      // Run a random attack scenario
      const scenarios = this.attackSimulator.getAttackScenarios();
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      this.logger.info('Starting periodic security test', {
        scenario: randomScenario.name
      });

      const result = await this.attackSimulator.runSimulation(randomScenario.scenarioId);
      
      this.logger.info('Periodic security test completed', {
        scenario: randomScenario.name,
        success: result.success.meetsCriteria
      });

    } catch (error) {
      this.logger.error('Periodic security test failed', { error });
    }
  }

  /**
   * Validation and utility methods
   */

  private async validateAgentForMessaging(agentId: string): Promise<void> {
    // Check quarantine status
    if (this.quarantineManager?.isQuarantined(agentId)) {
      throw new Error('Agent is quarantined and cannot send messages');
    }

    // Check reputation score
    if (this.reputationSystem) {
      const reputation = this.reputationSystem.getReputationScore(agentId);
      if (reputation && reputation.overallScore < 200) {
        throw new Error('Agent reputation too low for messaging');
      }
    }
  }

  private mapTrustLevelToScore(trustLevel: string): number {
    const mapping = {
      untrusted: 0.1,
      basic: 0.4,
      verified: 0.7,
      trusted: 0.9
    };
    return mapping[trustLevel as keyof typeof mapping] || 0.1;
  }

  private mapScoreToTrustLevel(score: number): 'untrusted' | 'basic' | 'verified' | 'trusted' {
    if (score >= 750) return 'trusted';
    if (score >= 500) return 'verified';
    if (score >= 250) return 'basic';
    return 'untrusted';
  }

  private mapEventSeverityToAlertSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const mapping = {
      info: 'low',
      warning: 'medium',
      error: 'high',
      critical: 'critical'
    };
    return mapping[severity as keyof typeof mapping] || 'medium';
  }

  private determineAlertActions(event: SecurityEvent): string[] {
    const actions: string[] = [];
    
    switch (event.type) {
      case 'authentication':
        actions.push('verify_identity', 'check_certificates');
        break;
      case 'authorization':
        actions.push('review_permissions', 'audit_access');
        break;
      case 'rate_limit':
        actions.push('monitor_traffic', 'adjust_limits');
        break;
      case 'anomaly':
        actions.push('investigate', 'monitor');
        break;
      case 'threat':
        actions.push('quarantine', 'investigate', 'alert_admins');
        break;
    }
    
    return actions;
  }

  private calculateSystemHealth(): number {
    const identities = this.baseSecurityManager.getAgentIdentities();
    const totalAgents = identities.length;
    
    if (totalAgents === 0) return 1.0;
    
    const quarantinedCount = this.quarantineManager ? 
      this.quarantineManager.getQuarantinedAgents().length : 0;
    const criticalAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.severity === 'critical' && !alert.autoResolved).length;
    
    const quarantineImpact = quarantinedCount / totalAgents * 0.5;
    const alertImpact = Math.min(0.3, criticalAlerts * 0.1);
    
    return Math.max(0, 1.0 - quarantineImpact - alertImpact);
  }

  private calculateAverageDetectionTime(): number {
    // Implementation would track detection times
    return 30000; // 30 seconds placeholder
  }

  private calculateDetectionAccuracy(): number {
    // Implementation would track detection accuracy
    return 0.85; // 85% placeholder
  }

  private calculateFalsePositiveRate(): number {
    // Implementation would track false positives
    return 0.05; // 5% placeholder
  }

  private calculateTrustLevelDistribution(identities: A2AIdentity[]): Record<string, number> {
    const distribution = { untrusted: 0, basic: 0, verified: 0, trusted: 0 };
    
    identities.forEach(identity => {
      distribution[identity.trustLevel]++;
    });
    
    return distribution;
  }

  private calculateTodayEndorsements(): number {
    // Implementation would track daily endorsements
    return 0; // Placeholder
  }

  private calculateCompletedChallenges(): number {
    // Implementation would track completed challenges
    return 0; // Placeholder
  }

  private calculateConsensusHealth(): number {
    // Implementation would assess consensus protocol health
    return 0.9; // 90% placeholder
  }

  private calculateMessageThroughput(): number {
    // Implementation would track message throughput
    return 100; // 100 messages/second placeholder
  }

  private calculateNetworkLatency(): number {
    // Implementation would track network latency
    return 50; // 50ms placeholder
  }

  private calculateFragmentationLevel(): number {
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

  getSecurityEvents(limit?: number) {
    return this.baseSecurityManager.getSecurityEvents(limit);
  }

  getPerformanceMetrics() {
    return this.baseSecurityManager.getPerformanceMetrics();
  }

  getReputationScore(agentId: string) {
    return this.reputationSystem?.getReputationScore(agentId) || null;
  }

  getQuarantineRecord(agentId: string) {
    return this.quarantineManager?.getQuarantineRecord(agentId) || null;
  }

  isQuarantined(agentId: string): boolean {
    return this.quarantineManager?.isQuarantined(agentId) || false;
  }

  async emergencyShutdown(reason: string): Promise<void> {
    this.logger.error('Emergency shutdown initiated', { reason });
    
    // Stop all timers
    if (this.detectionTimer) clearInterval(this.detectionTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    
    // Shutdown base security manager
    await this.baseSecurityManager.emergencyShutdown(reason);
    
    this.emit('emergency_shutdown', { reason, timestamp: Date.now() });
  }
}

export {
  EnhancedA2ASecurityManager,
  EnhancedSecurityConfig,
  SecurityDashboard,
  SecurityAlert
};
/**
 * Byzantine Fault-Tolerant Consensus System for Agent-to-Agent Communication
 * 
 * This module provides a comprehensive Byzantine consensus system that can handle
 * up to 33% malicious agents while maintaining correctness and security.
 * 
 * Features:
 * - PBFT (Practical Byzantine Fault Tolerance) consensus algorithm
 * - Advanced voting mechanisms (weighted, quadratic, liquid democracy)
 * - Sophisticated malicious agent detection and isolation
 * - State machine replication with conflict resolution
 * - Leader election with view change protocols
 * - Performance optimizations (batching, pipelining, speculation)
 * - Integration with A2A security framework
 * - Comprehensive fault injection testing
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

// Core consensus components
export {
  ByzantineConsensus,
  Agent,
  ConsensusMessage,
  ConsensusProposal,
  ConsensusState,
  default as ByzantineConsensusDefault
} from './byzantine-consensus';

export {
  VotingMechanisms,
  Vote,
  VotingProposal,
  VotingResult,
  Voter,
  VotingType,
  default as VotingMechanismsDefault
} from './voting-mechanisms';

export {
  MaliciousDetection,
  MaliciousBehavior,
  ReputationScore,
  DetectionRule,
  DetectionContext,
  SecurityAlert,
  default as MaliciousDetectionDefault
} from './malicious-detection';

export {
  StateMachineReplication,
  StateOperation,
  StateSnapshot,
  ReplicationNode,
  StateMachineConfig,
  ConflictResolution,
  default as StateMachineReplicationDefault
} from './state-machine-replication';

export {
  ViewChangeLeaderElection,
  ViewChangeMessage,
  NewViewMessage,
  CheckpointMessage,
  PreparedSet,
  LeaderCandidate,
  ElectionConfiguration,
  ViewState,
  default as ViewChangeLeaderElectionDefault
} from './view-change-leader-election';

export {
  PerformanceOptimizer,
  OptimizationConfig,
  PerformanceMetrics,
  BatchedProposal,
  PipelineStage,
  SpeculativeExecution,
  AdaptiveThreshold,
  OptimizedResult,
  default as PerformanceOptimizerDefault
} from './performance-optimizer';

// Security integration
export {
  ConsensusSecurityIntegration,
  SecureConsensusConfig,
  SecureConsensusSession,
  SecuredConsensusProposal,
  default as ConsensusSecurityIntegrationDefault
} from './consensus-security-integration';

// Utility types and constants
export const BYZANTINE_FAULT_TOLERANCE = {
  /**
   * Calculate the maximum number of faulty agents that can be tolerated
   * @param totalAgents Total number of agents in the system
   * @returns Maximum number of faulty agents (f = ⌊(n-1)/3⌋)
   */
  calculateFaultThreshold: (totalAgents: number): number => {
    return Math.floor((totalAgents - 1) / 3);
  },

  /**
   * Calculate the minimum number of agents required for Byzantine consensus
   * @param faultyAgents Number of potentially faulty agents
   * @returns Minimum number of agents (n = 3f + 1)
   */
  calculateMinimumAgents: (faultyAgents: number): number => {
    return 3 * faultyAgents + 1;
  },

  /**
   * Check if the system can reach consensus with the given parameters
   * @param totalAgents Total number of agents
   * @param faultyAgents Number of potentially faulty agents
   * @returns Whether consensus is possible
   */
  canReachConsensus: (totalAgents: number, faultyAgents: number): boolean => {
    const faultThreshold = Math.floor((totalAgents - 1) / 3);
    return faultyAgents <= faultThreshold && totalAgents >= 3 * faultyAgents + 1;
  }
};

export const CONSENSUS_TIMEOUTS = {
  DEFAULT_CONSENSUS_TIMEOUT: 30000, // 30 seconds
  DEFAULT_VIEW_CHANGE_TIMEOUT: 15000, // 15 seconds
  DEFAULT_HEARTBEAT_INTERVAL: 5000, // 5 seconds
  DEFAULT_BATCH_TIMEOUT: 100, // 100ms
  DEFAULT_PERFORMANCE_MONITOR_INTERVAL: 5000 // 5 seconds
};

export const SECURITY_LEVELS = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const
};

export const MALICIOUS_BEHAVIOR_TYPES = {
  DOUBLE_VOTING: 'double-voting' as const,
  CONFLICTING_MESSAGES: 'conflicting-messages' as const,
  TIMING_MANIPULATION: 'timing-manipulation' as const,
  FAKE_SIGNATURES: 'fake-signatures' as const,
  SPAM_FLOODING: 'spam-flooding' as const,
  COLLUSION: 'collusion' as const,
  VIEW_CHANGE_ABUSE: 'view-change-abuse' as const,
  CONSENSUS_DISRUPTION: 'consensus-disruption' as const,
  SYBIL_ATTACK: 'sybil-attack' as const,
  ECLIPSE_ATTACK: 'eclipse-attack' as const
};

export const VOTING_TYPES = {
  SIMPLE_MAJORITY: 'simple-majority' as const,
  WEIGHTED: 'weighted' as const,
  QUADRATIC: 'quadratic' as const,
  APPROVAL: 'approval' as const,
  LIQUID_DEMOCRACY: 'liquid-democracy' as const,
  STAKE_WEIGHTED: 'stake-weighted' as const
};

/**
 * Factory function to create a complete Byzantine consensus system
 * with all components properly integrated
 */
export function createByzantineConsensusSystem(
  nodeId: string,
  totalAgents: number = 7,
  securityManager?: any,
  options: {
    enableSecurity?: boolean;
    enableOptimization?: boolean;
    enableMaliciousDetection?: boolean;
    securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  } = {}
): {
  consensus: ByzantineConsensus;
  voting: VotingMechanisms;
  maliciousDetection: MaliciousDetection;
  stateMachine: StateMachineReplication;
  leaderElection: ViewChangeLeaderElection;
  optimizer: PerformanceOptimizer;
  securityIntegration?: ConsensusSecurityIntegration;
  faultThreshold: number;
  canTolerateFailures: boolean;
} {
  const {
    enableSecurity = true,
    enableOptimization = true,
    enableMaliciousDetection = true,
    securityLevel = 'medium'
  } = options;

  const faultThreshold = BYZANTINE_FAULT_TOLERANCE.calculateFaultThreshold(totalAgents);
  const canTolerateFailures = BYZANTINE_FAULT_TOLERANCE.canReachConsensus(totalAgents, faultThreshold);

  // Create core consensus components
  const consensus = new ByzantineConsensus(nodeId, totalAgents);
  const voting = new VotingMechanisms(`consensus-${nodeId}`);
  const maliciousDetection = enableMaliciousDetection ? new MaliciousDetection() : null;
  const stateMachine = new StateMachineReplication(nodeId);
  const leaderElection = new ViewChangeLeaderElection(nodeId, totalAgents);
  const optimizer = enableOptimization ? new PerformanceOptimizer() : null;

  // Create security integration if enabled and security manager is provided
  let securityIntegration: ConsensusSecurityIntegration | undefined;
  if (enableSecurity && securityManager) {
    securityIntegration = new ConsensusSecurityIntegration(nodeId, securityManager, {
      totalAgents,
      faultThreshold,
      requireAuthentication: true,
      requireEncryption: securityLevel !== 'low',
      enableMaliciousDetection,
      enablePerformanceOptimization: enableOptimization,
      securityPolicies: {
        minTrustLevel: securityLevel === 'critical' ? 'trusted' : 
                      securityLevel === 'high' ? 'verified' : 'basic',
        requiredCapabilities: ['consensus', 'voting'],
        enableAuditLogging: true,
        enableBehaviorAnalysis: true
      }
    });
  }

  return {
    consensus,
    voting,
    maliciousDetection: maliciousDetection!,
    stateMachine,
    leaderElection,
    optimizer: optimizer!,
    securityIntegration,
    faultThreshold,
    canTolerateFailures
  };
}

/**
 * Utility function to validate consensus system configuration
 */
export function validateConsensusConfig(
  totalAgents: number,
  expectedFaultyAgents: number
): {
  isValid: boolean;
  faultThreshold: number;
  minimumRequiredAgents: number;
  recommendations: string[];
} {
  const faultThreshold = BYZANTINE_FAULT_TOLERANCE.calculateFaultThreshold(totalAgents);
  const minimumRequiredAgents = BYZANTINE_FAULT_TOLERANCE.calculateMinimumAgents(expectedFaultyAgents);
  const canReachConsensus = BYZANTINE_FAULT_TOLERANCE.canReachConsensus(totalAgents, expectedFaultyAgents);

  const recommendations: string[] = [];

  if (!canReachConsensus) {
    recommendations.push(`Cannot tolerate ${expectedFaultyAgents} faulty agents with ${totalAgents} total agents`);
    recommendations.push(`Need at least ${minimumRequiredAgents} agents to tolerate ${expectedFaultyAgents} faulty agents`);
  }

  if (totalAgents < 4) {
    recommendations.push('Minimum of 4 agents recommended for meaningful Byzantine consensus');
  }

  if (totalAgents > 100) {
    recommendations.push('Large number of agents may impact performance - consider optimization strategies');
  }

  if (expectedFaultyAgents > faultThreshold) {
    recommendations.push(`Can only tolerate up to ${faultThreshold} faulty agents with ${totalAgents} total agents`);
  }

  return {
    isValid: canReachConsensus,
    faultThreshold,
    minimumRequiredAgents,
    recommendations
  };
}

/**
 * Performance benchmarking utilities
 */
export const PERFORMANCE_BENCHMARKS = {
  /**
   * Measure consensus latency
   */
  measureConsensusLatency: async (
    consensus: ByzantineConsensus,
    proposal: ConsensusProposal
  ): Promise<{ latency: number; success: boolean }> => {
    const startTime = Date.now();
    try {
      const success = await consensus.startConsensus(proposal);
      const latency = Date.now() - startTime;
      return { latency, success };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { latency, success: false };
    }
  },

  /**
   * Measure voting throughput
   */
  measureVotingThroughput: async (
    voting: VotingMechanisms,
    votes: Array<{ voterId: string; proposalId: string; decision: 'approve' | 'reject' | 'abstain' }>
  ): Promise<{ throughput: number; successRate: number }> => {
    const startTime = Date.now();
    let successful = 0;

    for (const vote of votes) {
      try {
        const result = await voting.castVote({
          ...vote,
          weight: 1,
          timestamp: new Date()
        });
        if (result) successful++;
      } catch (error) {
        // Vote failed
      }
    }

    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const throughput = votes.length / duration;
    const successRate = successful / votes.length;

    return { throughput, successRate };
  }
};

// Export default as the factory function
export default createByzantineConsensusSystem;
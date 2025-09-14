/**
 * Byzantine Spatial Consensus System
 *
 * Extends existing Byzantine consensus for spatial coordination with:
 * - Location agreement protocols
 * - Resource allocation consensus
 * - Zone access management
 * - Spatial conflict resolution
 * - Movement coordination
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import {
  ByzantineConsensus,
  Agent,
  ConsensusMessage,
  ConsensusProposal,
} from "../../protocols/a2a/consensus/byzantine-consensus.js";
import {
  SpatialConsensusProposal,
  SpatialRequirement,
  ResourceRequirement,
  SpatialConsensusVote,
  ConditionalRequirement,
  SpatialConsensusResult,
  ImplementationStep,
  Vector3D,
  BoundingBox,
  SpatialZone,
  AgentSpaceEvent,
} from "../types/AgentSpaceTypes.js";

export interface SpatialConsensusConfig {
  spatialTolerance: number;
  resourceContention: boolean;
  movementCoordination: boolean;
  zoneManagement: boolean;
  consensusTimeout: number;
  quorumThreshold: number;
  byzantineTolerance: number;
}

export interface SpatialAgent extends Agent {
  location: Vector3D;
  boundingBox: BoundingBox;
  movementVector: Vector3D;
  spatialCapabilities: string[];
  resourceRequirements: ResourceRequirement[];
  trustLevel: number;
  spatialPriority: number;
}

export interface LocationProposal extends SpatialConsensusProposal {
  type: "location_change";
  currentLocation: Vector3D;
  targetLocation: Vector3D;
  movementPath: Vector3D[];
  estimatedTime: number;
  resourceImpact: ResourceRequirement[];
}

export interface ResourceAllocationProposal extends SpatialConsensusProposal {
  type: "resource_allocation";
  resourceType: string;
  requiredAmount: number;
  duration: number;
  exclusiveAccess: boolean;
  fallbackOptions: ResourceRequirement[];
}

export interface ZoneAccessProposal extends SpatialConsensusProposal {
  type: "zone_access";
  zoneId: string;
  accessType: "enter" | "exit" | "modify" | "create";
  duration?: number;
  modifications?: any;
}

export interface CollaborationProposal extends SpatialConsensusProposal {
  type: "collaboration_request";
  collaborationType:
    | "shared_workspace"
    | "resource_sharing"
    | "joint_task"
    | "knowledge_exchange";
  requiredParticipants: string[];
  spatialArrangement: SpatialArrangement;
  duration: number;
}

export interface SpatialArrangement {
  centerPoint: Vector3D;
  participantPositions: { [agentId: string]: Vector3D };
  workspaceSize: Vector3D;
  accessRules: string[];
}

export interface SpatialConflict {
  id: string;
  type:
    | "location_overlap"
    | "resource_contention"
    | "movement_collision"
    | "zone_violation";
  involvedAgents: string[];
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: Date;
  spatialData: any;
  autoResolvable: boolean;
}

export interface ConflictResolution {
  conflictId: string;
  strategy:
    | "avoidance"
    | "negotiation"
    | "priority_based"
    | "resource_sharing"
    | "temporal_separation";
  actions: ByzantineResolutionAction[];
  expectedOutcome: any;
  implementationOrder: number[];
}

export interface ByzantineResolutionAction {
  agentId: string;
  actionType: "move" | "wait" | "resize" | "share_resource" | "change_priority";
  parameters: any;
  timing: { start: Date; duration: number };
  conditions: string[];
}

export interface SpatialConsensusMetrics {
  totalProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  averageConsensusTime: number;
  conflictsDetected: number;
  conflictsResolved: number;
  spatialEfficiency: number;
  resourceUtilization: number;
}

export class ByzantineSpatialConsensus extends EventEmitter {
  private logger: Logger;
  private config: SpatialConsensusConfig;
  private baseConsensus: ByzantineConsensus;
  private spatialAgents: Map<string, SpatialAgent> = new Map();
  private activeProposals: Map<string, SpatialConsensusProposal> = new Map();
  private votingRecords: Map<string, SpatialConsensusVote[]> = new Map();
  private spatialConflicts: Map<string, SpatialConflict> = new Map();
  private consensusResults: Map<string, SpatialConsensusResult> = new Map();
  private resourceAllocations: Map<string, ResourceAllocation> = new Map();
  private zoneStates: Map<string, SpatialZone> = new Map();

  // Performance metrics
  private metrics: SpatialConsensusMetrics = {
    totalProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    averageConsensusTime: 0,
    conflictsDetected: 0,
    conflictsResolved: 0,
    spatialEfficiency: 0.8,
    resourceUtilization: 0.6,
  };

  constructor(
    agentId: string,
    config: SpatialConsensusConfig,
    totalAgents: number = 7,
  ) {
    super();
    this.logger = new Logger("ByzantineSpatialConsensus");
    this.config = config;

    // Initialize base Byzantine consensus
    this.baseConsensus = new ByzantineConsensus(agentId, totalAgents);
    this.setupBaseConsensusHandlers();

    this.logger.info("Byzantine Spatial Consensus initialized", {
      agentId,
      spatialTolerance: config.spatialTolerance,
      quorumThreshold: config.quorumThreshold,
    });
  }

  /**
   * Register a spatial agent
   */
  registerSpatialAgent(agent: SpatialAgent): void {
    this.spatialAgents.set(agent.id, agent);

    // Register with base consensus system
    this.baseConsensus.registerAgent({
      id: agent.id,
      publicKey: agent.publicKey,
      isLeader: agent.isLeader,
      isMalicious: agent.isMalicious,
      reputation: agent.reputation,
      lastActiveTime: agent.lastActiveTime,
    });

    this.logger.debug("Spatial agent registered", {
      agentId: agent.id,
      location: agent.location,
      capabilities: agent.spatialCapabilities,
    });

    this.emit("spatial_agent_registered", agent);
  }

  /**
   * Propose a location change with consensus
   */
  async proposeLocationChange(
    agentId: string,
    targetLocation: Vector3D,
    movementPath: Vector3D[] = [],
    priority: "low" | "normal" | "high" | "critical" = "normal",
  ): Promise<string> {
    const agent = this.spatialAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Check for potential conflicts
    const conflicts = await this.detectLocationConflicts(
      agentId,
      targetLocation,
    );

    const proposal: LocationProposal = {
      proposalId: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "location_change",
      proposer: agentId,
      targetAgents: this.getAffectedAgents(targetLocation, agent.boundingBox),
      spatialRequirements: [
        {
          type: "location",
          constraint: { targetLocation, conflicts },
          mandatory: true,
          weight: 1.0,
        },
      ],
      resourceRequirements: agent.resourceRequirements,
      consensusDeadline: new Date(Date.now() + this.config.consensusTimeout),
      priority,
      currentLocation: agent.location,
      targetLocation,
      movementPath:
        movementPath.length > 0
          ? movementPath
          : [agent.location, targetLocation],
      estimatedTime: this.calculateMovementTime(agent.location, targetLocation),
      resourceImpact: this.analyzeResourceImpact(agent, targetLocation),
    };

    return await this.initiateConsensus(proposal);
  }

  /**
   * Propose resource allocation
   */
  async proposeResourceAllocation(
    agentId: string,
    resourceType: string,
    amount: number,
    duration: number,
    exclusiveAccess: boolean = false,
  ): Promise<string> {
    const agent = this.spatialAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const proposal: ResourceAllocationProposal = {
      proposalId: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "resource_allocation",
      proposer: agentId,
      targetAgents: this.getResourceContenders(resourceType, amount),
      spatialRequirements: [],
      resourceRequirements: [
        {
          resourceType,
          amount,
          duration,
          sharable: !exclusiveAccess,
          fallback: this.generateResourceFallbacks(resourceType, amount),
        },
      ],
      consensusDeadline: new Date(Date.now() + this.config.consensusTimeout),
      priority: this.determineResourcePriority(resourceType, amount),
      resourceType,
      requiredAmount: amount,
      duration,
      exclusiveAccess,
      fallbackOptions: this.generateResourceFallbacks(resourceType, amount),
    };

    return await this.initiateConsensus(proposal);
  }

  /**
   * Propose zone access
   */
  async proposeZoneAccess(
    agentId: string,
    zoneId: string,
    accessType: "enter" | "exit" | "modify" | "create",
    duration?: number,
    modifications?: any,
  ): Promise<string> {
    const zone = this.zoneStates.get(zoneId);
    const agent = this.spatialAgents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const proposal: ZoneAccessProposal = {
      proposalId: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "zone_access",
      proposer: agentId,
      targetAgents: zone ? this.getZoneStakeholders(zone) : [],
      spatialRequirements: [
        {
          type: "location",
          constraint: { zoneId, accessType, agent: agent.location },
          mandatory: true,
          weight: 1.0,
        },
      ],
      resourceRequirements: [],
      consensusDeadline: new Date(Date.now() + this.config.consensusTimeout),
      priority: this.determineZoneAccessPriority(accessType),
      zoneId,
      accessType,
      duration,
      modifications,
    };

    return await this.initiateConsensus(proposal);
  }

  /**
   * Propose collaboration between agents
   */
  async proposeCollaboration(
    initiatorId: string,
    participantIds: string[],
    collaborationType:
      | "shared_workspace"
      | "resource_sharing"
      | "joint_task"
      | "knowledge_exchange",
    spatialArrangement: SpatialArrangement,
    duration: number,
  ): Promise<string> {
    const proposal: CollaborationProposal = {
      proposalId: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "collaboration_request",
      proposer: initiatorId,
      targetAgents: participantIds,
      spatialRequirements: [
        {
          type: "proximity",
          constraint: { arrangement: spatialArrangement },
          mandatory: true,
          weight: 1.0,
        },
      ],
      resourceRequirements: this.calculateCollaborationResources(
        participantIds,
        collaborationType,
      ),
      consensusDeadline: new Date(Date.now() + this.config.consensusTimeout),
      priority: "normal",
      collaborationType,
      requiredParticipants: participantIds,
      spatialArrangement,
      duration,
    };

    return await this.initiateConsensus(proposal);
  }

  /**
   * Vote on a spatial consensus proposal
   */
  async voteOnProposal(
    proposalId: string,
    voterId: string,
    vote: "accept" | "reject" | "abstain" | "conditional",
    reasoning: string,
    conditions?: ConditionalRequirement[],
  ): Promise<void> {
    const proposal = this.activeProposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const voter = this.spatialAgents.get(voterId);
    if (!voter) {
      throw new Error(`Voter not found: ${voterId}`);
    }

    const spatialVote: SpatialConsensusVote = {
      proposalId,
      voter: voterId,
      vote,
      reasoning,
      conditions: conditions || [],
      timestamp: new Date(),
      signature: this.signVote(proposalId, voterId, vote),
    };

    // Store vote
    if (!this.votingRecords.has(proposalId)) {
      this.votingRecords.set(proposalId, []);
    }
    this.votingRecords.get(proposalId)!.push(spatialVote);

    // Check if consensus is reached
    await this.checkConsensusCompletion(proposalId);

    this.logger.debug("Vote recorded", {
      proposalId,
      voter: voterId,
      vote,
      reasoning,
    });

    this.emit("vote_cast", spatialVote);
  }

  /**
   * Detect spatial conflicts
   */
  async detectSpatialConflicts(): Promise<SpatialConflict[]> {
    const conflicts: SpatialConflict[] = [];
    const agents = Array.from(this.spatialAgents.values());

    // Check for location overlaps
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const conflict = this.checkAgentConflict(agents[i], agents[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    // Check for resource contentions
    const resourceConflicts = this.checkResourceConflicts();
    conflicts.push(...resourceConflicts);

    // Store detected conflicts
    for (const conflict of conflicts) {
      this.spatialConflicts.set(conflict.id, conflict);
    }

    this.metrics.conflictsDetected += conflicts.length;

    if (conflicts.length > 0) {
      this.logger.warn("Spatial conflicts detected", {
        count: conflicts.length,
        types: conflicts.map((c) => c.type),
      });
    }

    return conflicts;
  }

  /**
   * Resolve spatial conflicts automatically
   */
  async resolveConflicts(conflictIds: string[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflictId of conflictIds) {
      const conflict = this.spatialConflicts.get(conflictId);
      if (!conflict) continue;

      try {
        const resolution = await this.generateConflictResolution(conflict);
        if (resolution) {
          await this.implementResolution(resolution);
          resolutions.push(resolution);

          // Mark conflict as resolved
          this.spatialConflicts.delete(conflictId);
          this.metrics.conflictsResolved++;
        }
      } catch (error) {
        this.logger.error("Failed to resolve conflict", {
          conflictId,
          error: error.message,
        });
      }
    }

    return resolutions;
  }

  /**
   * Get consensus metrics
   */
  getMetrics(): SpatialConsensusMetrics {
    // Calculate current spatial efficiency
    this.metrics.spatialEfficiency = this.calculateSpatialEfficiency();
    this.metrics.resourceUtilization = this.calculateResourceUtilization();

    return { ...this.metrics };
  }

  /**
   * Get current spatial state
   */
  getSpatialState() {
    return {
      agents: Array.from(this.spatialAgents.values()),
      activeProposals: Array.from(this.activeProposals.values()),
      conflicts: Array.from(this.spatialConflicts.values()),
      zones: Array.from(this.zoneStates.values()),
      resourceAllocations: Array.from(this.resourceAllocations.values()),
    };
  }

  /**
   * Private helper methods
   */

  private setupBaseConsensusHandlers(): void {
    this.baseConsensus.on("consensus-reached", (proposal) => {
      this.handleBaseConsensusResult(proposal, true);
    });

    this.baseConsensus.on("consensus-error", (error) => {
      this.logger.error("Base consensus error", error);
    });

    this.baseConsensus.on("view-change-initiated", (view) => {
      this.logger.info("Consensus view change initiated", { view });
    });
  }

  private async initiateConsensus(
    proposal: SpatialConsensusProposal,
  ): Promise<string> {
    this.activeProposals.set(proposal.proposalId, proposal);
    this.metrics.totalProposals++;

    // Create base consensus proposal
    const baseProposal: ConsensusProposal = {
      id: proposal.proposalId,
      content: proposal,
      proposerId: proposal.proposer,
      timestamp: new Date(),
      hash: this.hashProposal(proposal),
    };

    try {
      // Start base consensus process
      const success = await this.baseConsensus.startConsensus(baseProposal);

      if (!success) {
        this.activeProposals.delete(proposal.proposalId);
        throw new Error("Failed to initiate consensus");
      }

      this.logger.info("Spatial consensus initiated", {
        proposalId: proposal.proposalId,
        type: proposal.type,
        proposer: proposal.proposer,
      });

      this.emit("consensus_started", {
        id: `evt_${Date.now()}`,
        type: "consensus_started",
        source: "spatial_consensus",
        timestamp: new Date(),
        data: proposal,
        severity: "info",
      } as AgentSpaceEvent);

      return proposal.proposalId;
    } catch (error) {
      this.activeProposals.delete(proposal.proposalId);
      throw error;
    }
  }

  private async checkConsensusCompletion(proposalId: string): Promise<void> {
    const proposal = this.activeProposals.get(proposalId);
    const votes = this.votingRecords.get(proposalId);

    if (!proposal || !votes) return;

    const totalAgents = this.spatialAgents.size;
    const requiredVotes = Math.ceil(totalAgents * this.config.quorumThreshold);

    if (votes.length >= requiredVotes) {
      const result = this.calculateConsensusResult(proposal, votes);
      await this.finalizeConsensus(proposal, result);
    }
  }

  private calculateConsensusResult(
    proposal: SpatialConsensusProposal,
    votes: SpatialConsensusVote[],
  ): SpatialConsensusResult {
    const acceptVotes = votes.filter((v) => v.vote === "accept").length;
    const rejectVotes = votes.filter((v) => v.vote === "reject").length;
    const conditionalVotes = votes.filter((v) => v.vote === "conditional");

    let decision: "approved" | "rejected" | "timeout" | "cancelled";

    if (acceptVotes > votes.length / 2) {
      decision = "approved";
    } else if (rejectVotes > votes.length / 2) {
      decision = "rejected";
    } else {
      // Handle conditional votes
      decision = conditionalVotes.length > 0 ? "approved" : "rejected";
    }

    const result: SpatialConsensusResult = {
      proposalId: proposal.proposalId,
      decision,
      votes,
      finalConfiguration: this.buildFinalConfiguration(
        proposal,
        conditionalVotes,
      ),
      implementationPlan: this.buildImplementationPlan(proposal, decision),
      validUntil: new Date(Date.now() + 3600000), // Valid for 1 hour
    };

    return result;
  }

  private async finalizeConsensus(
    proposal: SpatialConsensusProposal,
    result: SpatialConsensusResult,
  ): Promise<void> {
    this.consensusResults.set(proposal.proposalId, result);
    this.activeProposals.delete(proposal.proposalId);

    if (result.decision === "approved") {
      this.metrics.approvedProposals++;
      await this.implementConsensusResult(result);
    } else {
      this.metrics.rejectedProposals++;
    }

    this.logger.info("Spatial consensus finalized", {
      proposalId: proposal.proposalId,
      decision: result.decision,
      votes: result.votes.length,
    });

    this.emit("consensus_completed", {
      id: `evt_${Date.now()}`,
      type: "consensus_completed",
      source: "spatial_consensus",
      timestamp: new Date(),
      data: { proposal, result },
      severity: "info",
    } as AgentSpaceEvent);
  }

  private async implementConsensusResult(
    result: SpatialConsensusResult,
  ): Promise<void> {
    const proposal = this.consensusResults.get(result.proposalId);
    if (!proposal) return;

    try {
      for (const step of result.implementationPlan) {
        await this.executeImplementationStep(step);
      }

      this.logger.info("Consensus result implemented", {
        proposalId: result.proposalId,
        steps: result.implementationPlan.length,
      });
    } catch (error) {
      this.logger.error("Failed to implement consensus result", {
        proposalId: result.proposalId,
        error: error.message,
      });
    }
  }

  private async executeImplementationStep(
    step: ImplementationStep,
  ): Promise<void> {
    this.logger.debug("Executing implementation step", {
      step: step.step,
      action: step.action,
      agents: step.targetAgents,
    });

    // Implementation would execute the specific action
    // For location changes, resource allocations, etc.
  }

  private async detectLocationConflicts(
    agentId: string,
    targetLocation: Vector3D,
  ): Promise<SpatialConflict[]> {
    const conflicts: SpatialConflict[] = [];
    const agent = this.spatialAgents.get(agentId);
    if (!agent) return conflicts;

    // Check against other agents
    for (const [otherId, otherAgent] of this.spatialAgents) {
      if (otherId === agentId) continue;

      const distance = this.calculateDistance(
        targetLocation,
        otherAgent.location,
      );
      const minDistance = this.config.spatialTolerance;

      if (distance < minDistance) {
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "location_overlap",
          involvedAgents: [agentId, otherId],
          severity: distance < minDistance / 2 ? "high" : "medium",
          detectedAt: new Date(),
          spatialData: { distance, minDistance, targetLocation },
          autoResolvable: true,
        });
      }
    }

    return conflicts;
  }

  private getAffectedAgents(
    location: Vector3D,
    boundingBox: BoundingBox,
  ): string[] {
    const affected: string[] = [];
    const influenceRadius =
      Math.max(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z) * 2;

    for (const [agentId, agent] of this.spatialAgents) {
      const distance = this.calculateDistance(location, agent.location);
      if (distance <= influenceRadius) {
        affected.push(agentId);
      }
    }

    return affected;
  }

  private calculateMovementTime(from: Vector3D, to: Vector3D): number {
    const distance = this.calculateDistance(from, to);
    const speed = 5; // units per second
    return (distance / speed) * 1000; // milliseconds
  }

  private analyzeResourceImpact(
    agent: SpatialAgent,
    targetLocation: Vector3D,
  ): ResourceRequirement[] {
    // Analyze how movement affects resource requirements
    const distance = this.calculateDistance(agent.location, targetLocation);
    const movementCost = distance * 0.1; // Energy cost per unit distance

    return [
      {
        resourceType: "energy",
        amount: movementCost,
        duration: this.calculateMovementTime(agent.location, targetLocation),
        sharable: false,
      },
    ];
  }

  private getResourceContenders(
    resourceType: string,
    amount: number,
  ): string[] {
    const contenders: string[] = [];

    for (const [agentId, agent] of this.spatialAgents) {
      for (const requirement of agent.resourceRequirements) {
        if (
          requirement.resourceType === resourceType &&
          requirement.amount > 0
        ) {
          contenders.push(agentId);
          break;
        }
      }
    }

    return contenders;
  }

  private determineResourcePriority(
    resourceType: string,
    amount: number,
  ): "low" | "normal" | "high" | "critical" {
    // Critical resources get high priority
    if (resourceType === "energy" || resourceType === "memory") {
      return amount > 1000 ? "critical" : "high";
    }
    return "normal";
  }

  private generateResourceFallbacks(
    resourceType: string,
    amount: number,
  ): ResourceRequirement[] {
    return [
      {
        resourceType,
        amount: amount * 0.8, // 20% reduction as fallback
        duration: 0,
        sharable: true,
      },
    ];
  }

  private getZoneStakeholders(zone: SpatialZone): string[] {
    const stakeholders: string[] = [];

    // Find agents currently in the zone
    for (const [agentId, agent] of this.spatialAgents) {
      if (this.isLocationInZone(agent.location, zone)) {
        stakeholders.push(agentId);
      }
    }

    return stakeholders;
  }

  private determineZoneAccessPriority(
    accessType: "enter" | "exit" | "modify" | "create",
  ): "low" | "normal" | "high" | "critical" {
    switch (accessType) {
      case "exit":
        return "high"; // Exiting should be easy
      case "enter":
        return "normal";
      case "modify":
        return "high";
      case "create":
        return "critical";
      default:
        return "normal";
    }
  }

  private calculateCollaborationResources(
    participantIds: string[],
    collaborationType: string,
  ): ResourceRequirement[] {
    const baseResourceCost = participantIds.length * 10;

    return [
      {
        resourceType: "computational",
        amount: baseResourceCost,
        duration: 3600000, // 1 hour
        sharable: true,
      },
    ];
  }

  private checkAgentConflict(
    agent1: SpatialAgent,
    agent2: SpatialAgent,
  ): SpatialConflict | null {
    const distance = this.calculateDistance(agent1.location, agent2.location);

    if (distance < this.config.spatialTolerance) {
      return {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "location_overlap",
        involvedAgents: [agent1.id, agent2.id],
        severity:
          distance < this.config.spatialTolerance / 2 ? "high" : "medium",
        detectedAt: new Date(),
        spatialData: { distance, agents: [agent1, agent2] },
        autoResolvable: true,
      };
    }

    return null;
  }

  private checkResourceConflicts(): SpatialConflict[] {
    const conflicts: SpatialConflict[] = [];
    const resourceMap = new Map<string, string[]>(); // Resource -> Agent IDs

    // Group agents by resource requirements
    for (const [agentId, agent] of this.spatialAgents) {
      for (const requirement of agent.resourceRequirements) {
        if (!requirement.sharable) {
          if (!resourceMap.has(requirement.resourceType)) {
            resourceMap.set(requirement.resourceType, []);
          }
          resourceMap.get(requirement.resourceType)!.push(agentId);
        }
      }
    }

    // Find conflicts
    for (const [resourceType, agentIds] of resourceMap) {
      if (agentIds.length > 1) {
        conflicts.push({
          id: `res_conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "resource_contention",
          involvedAgents: agentIds,
          severity: agentIds.length > 3 ? "high" : "medium",
          detectedAt: new Date(),
          spatialData: { resourceType, demandingAgents: agentIds },
          autoResolvable: false,
        });
      }
    }

    return conflicts;
  }

  private async generateConflictResolution(
    conflict: SpatialConflict,
  ): Promise<ConflictResolution | null> {
    switch (conflict.type) {
      case "location_overlap":
        return this.resolveLocationOverlap(conflict);
      case "resource_contention":
        return this.resolveResourceContention(conflict);
      default:
        return null;
    }
  }

  private resolveLocationOverlap(
    conflict: SpatialConflict,
  ): ConflictResolution {
    const [agent1Id, agent2Id] = conflict.involvedAgents;
    const agent1 = this.spatialAgents.get(agent1Id)!;
    const agent2 = this.spatialAgents.get(agent2Id)!;

    // Lower priority agent moves
    const movingAgent =
      agent1.spatialPriority >= agent2.spatialPriority ? agent2 : agent1;
    const newLocation = this.findNearbyFreeLocation(movingAgent.location);

    return {
      conflictId: conflict.id,
      strategy: "avoidance",
      actions: [
        {
          agentId: movingAgent.id,
          actionType: "move",
          parameters: { targetLocation: newLocation },
          timing: { start: new Date(), duration: 5000 },
          conditions: [],
        },
      ],
      expectedOutcome: { conflictResolved: true },
      implementationOrder: [0],
    };
  }

  private resolveResourceContention(
    conflict: SpatialConflict,
  ): ConflictResolution {
    const agentIds = conflict.involvedAgents;
    const actions: ByzantineResolutionAction[] = [];

    // Implement temporal separation
    agentIds.forEach((agentId, index) => {
      actions.push({
        agentId,
        actionType: "wait",
        parameters: { delay: index * 10000 }, // Stagger by 10 seconds
        timing: {
          start: new Date(Date.now() + index * 10000),
          duration: 10000,
        },
        conditions: [
          `other_agents_finished:${agentIds.filter((_, i) => i < index).join(",")}`,
        ],
      });
    });

    return {
      conflictId: conflict.id,
      strategy: "temporal_separation",
      actions,
      expectedOutcome: { resourceSharing: true },
      implementationOrder: Array.from({ length: actions.length }, (_, i) => i),
    };
  }

  private async implementResolution(
    resolution: ConflictResolution,
  ): Promise<void> {
    this.logger.info("Implementing conflict resolution", {
      conflictId: resolution.conflictId,
      strategy: resolution.strategy,
      actions: resolution.actions.length,
    });

    // Implementation would execute the resolution actions
    for (const action of resolution.actions) {
      await this.executeResolutionAction(action);
    }
  }

  private async executeResolutionAction(
    action: ByzantineResolutionAction,
  ): Promise<void> {
    this.logger.debug("Executing resolution action", {
      agentId: action.agentId,
      actionType: action.actionType,
      parameters: action.parameters,
    });

    // Implementation would execute the specific action
  }

  private calculateDistance(pos1: Vector3D, pos2: Vector3D): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private isLocationInZone(location: Vector3D, zone: SpatialZone): boolean {
    const bounds = zone.boundaries;
    return (
      location.x >= bounds.min.x &&
      location.x <= bounds.max.x &&
      location.y >= bounds.min.y &&
      location.y <= bounds.max.y &&
      location.z >= bounds.min.z &&
      location.z <= bounds.max.z
    );
  }

  private findNearbyFreeLocation(currentLocation: Vector3D): Vector3D {
    // Simple algorithm to find a nearby free location
    const offset = this.config.spatialTolerance * 2;
    const attempts = [
      {
        x: currentLocation.x + offset,
        y: currentLocation.y,
        z: currentLocation.z,
      },
      {
        x: currentLocation.x - offset,
        y: currentLocation.y,
        z: currentLocation.z,
      },
      {
        x: currentLocation.x,
        y: currentLocation.y + offset,
        z: currentLocation.z,
      },
      {
        x: currentLocation.x,
        y: currentLocation.y - offset,
        z: currentLocation.z,
      },
    ];

    for (const attempt of attempts) {
      if (this.isLocationFree(attempt)) {
        return attempt;
      }
    }

    // Fallback: return location with random offset
    return {
      x: currentLocation.x + (Math.random() - 0.5) * offset * 4,
      y: currentLocation.y + (Math.random() - 0.5) * offset * 4,
      z: currentLocation.z + (Math.random() - 0.5) * offset * 4,
    };
  }

  private isLocationFree(location: Vector3D): boolean {
    for (const agent of this.spatialAgents.values()) {
      const distance = this.calculateDistance(location, agent.location);
      if (distance < this.config.spatialTolerance) {
        return false;
      }
    }
    return true;
  }

  private calculateSpatialEfficiency(): number {
    if (this.spatialAgents.size === 0) return 1.0;

    let totalConflicts = this.spatialConflicts.size;
    let possibleConflicts =
      (this.spatialAgents.size * (this.spatialAgents.size - 1)) / 2;

    return Math.max(0, 1 - totalConflicts / possibleConflicts);
  }

  private calculateResourceUtilization(): number {
    // Simplified resource utilization calculation
    let totalAllocated = this.resourceAllocations.size;
    let totalCapacity = this.spatialAgents.size * 10; // Assume each agent has 10 resource units

    return Math.min(1.0, totalAllocated / totalCapacity);
  }

  private signVote(proposalId: string, voterId: string, vote: string): string {
    // Simplified signature - would use proper cryptographic signing
    return `${proposalId}_${voterId}_${vote}_${Date.now()}`;
  }

  private hashProposal(proposal: SpatialConsensusProposal): string {
    // Simplified hash - would use proper cryptographic hashing
    return `hash_${proposal.proposalId}_${proposal.type}`;
  }

  private handleBaseConsensusResult(proposal: any, success: boolean): void {
    this.logger.debug("Base consensus result received", {
      proposalId: proposal.id,
      success,
    });
  }

  private buildFinalConfiguration(
    proposal: SpatialConsensusProposal,
    conditionalVotes: SpatialConsensusVote[],
  ): any {
    // Build final configuration incorporating conditional requirements
    let config = { ...proposal };

    for (const vote of conditionalVotes) {
      if (vote.conditions) {
        for (const condition of vote.conditions) {
          // Apply conditional modifications
          config = { ...config, [condition.condition]: condition.requirement };
        }
      }
    }

    return config;
  }

  private buildImplementationPlan(
    proposal: SpatialConsensusProposal,
    decision: string,
  ): ImplementationStep[] {
    if (decision !== "approved") return [];

    const steps: ImplementationStep[] = [];

    switch (proposal.type) {
      case "location_change":
        steps.push({
          step: 1,
          action: "move_agent",
          targetAgents: [proposal.proposer],
          dependencies: [],
          estimatedDuration: 5000,
          rollbackPlan: "return_to_original_location",
        });
        break;

      case "resource_allocation":
        steps.push({
          step: 1,
          action: "allocate_resource",
          targetAgents: proposal.targetAgents,
          dependencies: [],
          estimatedDuration: 1000,
          rollbackPlan: "deallocate_resource",
        });
        break;
    }

    return steps;
  }

  /**
   * Shutdown consensus system
   */
  async shutdown(): Promise<void> {
    this.spatialAgents.clear();
    this.activeProposals.clear();
    this.votingRecords.clear();
    this.spatialConflicts.clear();
    this.consensusResults.clear();
    this.resourceAllocations.clear();
    this.zoneStates.clear();

    this.logger.info("Byzantine Spatial Consensus shutdown complete");
  }
}

interface ResourceAllocation {
  id: string;
  resourceType: string;
  amount: number;
  allocatedTo: string;
  startTime: Date;
  duration: number;
  exclusive: boolean;
}

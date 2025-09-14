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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { Agent } from "../../protocols/a2a/consensus/byzantine-consensus.js";
import { SpatialConsensusProposal, ResourceRequirement, ConditionalRequirement, Vector3D, BoundingBox, SpatialZone } from "../types/AgentSpaceTypes.js";
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
    collaborationType: "shared_workspace" | "resource_sharing" | "joint_task" | "knowledge_exchange";
    requiredParticipants: string[];
    spatialArrangement: SpatialArrangement;
    duration: number;
}
export interface SpatialArrangement {
    centerPoint: Vector3D;
    participantPositions: {
        [agentId: string]: Vector3D;
    };
    workspaceSize: Vector3D;
    accessRules: string[];
}
export interface SpatialConflict {
    id: string;
    type: "location_overlap" | "resource_contention" | "movement_collision" | "zone_violation";
    involvedAgents: string[];
    severity: "low" | "medium" | "high" | "critical";
    detectedAt: Date;
    spatialData: any;
    autoResolvable: boolean;
}
export interface ConflictResolution {
    conflictId: string;
    strategy: "avoidance" | "negotiation" | "priority_based" | "resource_sharing" | "temporal_separation";
    actions: ResolutionAction[];
    expectedOutcome: any;
    implementationOrder: number[];
}
interface ResolutionAction {
    agentId: string;
    actionType: "move" | "wait" | "resize" | "share_resource" | "change_priority";
    parameters: any;
    timing: {
        start: Date;
        duration: number;
    };
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
export declare class ByzantineSpatialConsensus extends EventEmitter {
    private logger;
    private config;
    private baseConsensus;
    private spatialAgents;
    private activeProposals;
    private votingRecords;
    private spatialConflicts;
    private consensusResults;
    private resourceAllocations;
    private zoneStates;
    private metrics;
    constructor(agentId: string, config: SpatialConsensusConfig, totalAgents?: number);
    /**
     * Register a spatial agent
     */
    registerSpatialAgent(agent: SpatialAgent): void;
    /**
     * Propose a location change with consensus
     */
    proposeLocationChange(agentId: string, targetLocation: Vector3D, movementPath?: Vector3D[], priority?: "low" | "normal" | "high" | "critical"): Promise<string>;
    /**
     * Propose resource allocation
     */
    proposeResourceAllocation(agentId: string, resourceType: string, amount: number, duration: number, exclusiveAccess?: boolean): Promise<string>;
    /**
     * Propose zone access
     */
    proposeZoneAccess(agentId: string, zoneId: string, accessType: "enter" | "exit" | "modify" | "create", duration?: number, modifications?: any): Promise<string>;
    /**
     * Propose collaboration between agents
     */
    proposeCollaboration(initiatorId: string, participantIds: string[], collaborationType: "shared_workspace" | "resource_sharing" | "joint_task" | "knowledge_exchange", spatialArrangement: SpatialArrangement, duration: number): Promise<string>;
    /**
     * Vote on a spatial consensus proposal
     */
    voteOnProposal(proposalId: string, voterId: string, vote: "accept" | "reject" | "abstain" | "conditional", reasoning: string, conditions?: ConditionalRequirement[]): Promise<void>;
    /**
     * Detect spatial conflicts
     */
    detectSpatialConflicts(): Promise<SpatialConflict[]>;
    /**
     * Resolve spatial conflicts automatically
     */
    resolveConflicts(conflictIds: string[]): Promise<ConflictResolution[]>;
    /**
     * Get consensus metrics
     */
    getMetrics(): SpatialConsensusMetrics;
    /**
     * Get current spatial state
     */
    getSpatialState(): {
        agents: SpatialAgent[];
        activeProposals: SpatialConsensusProposal[];
        conflicts: SpatialConflict[];
        zones: SpatialZone[];
        resourceAllocations: ResourceAllocation[];
    };
    /**
     * Private helper methods
     */
    private setupBaseConsensusHandlers;
    private initiateConsensus;
    private checkConsensusCompletion;
    private calculateConsensusResult;
    private finalizeConsensus;
    private implementConsensusResult;
    private executeImplementationStep;
    private detectLocationConflicts;
    private getAffectedAgents;
    private calculateMovementTime;
    private analyzeResourceImpact;
    private getResourceContenders;
    private determineResourcePriority;
    private generateResourceFallbacks;
    private getZoneStakeholders;
    private determineZoneAccessPriority;
    private calculateCollaborationResources;
    private checkAgentConflict;
    private checkResourceConflicts;
    private generateConflictResolution;
    private resolveLocationOverlap;
    private resolveResourceContention;
    private implementResolution;
    private executeResolutionAction;
    private calculateDistance;
    private isLocationInZone;
    private findNearbyFreeLocation;
    private isLocationFree;
    private calculateSpatialEfficiency;
    private calculateResourceUtilization;
    private signVote;
    private hashProposal;
    private handleBaseConsensusResult;
    private buildFinalConfiguration;
    private buildImplementationPlan;
    /**
     * Shutdown consensus system
     */
    shutdown(): Promise<void>;
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
export {};
//# sourceMappingURL=ByzantineSpatialConsensus.d.ts.map
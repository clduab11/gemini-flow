/**
 * Voting Mechanisms for Byzantine Consensus
 * Implements various voting algorithms including weighted, quadratic, and liquid democracy
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface Vote {
    id: string;
    voterId: string;
    proposalId: string;
    decision: "approve" | "reject" | "abstain";
    weight: number;
    strength?: number;
    timestamp: Date;
    signature: string;
    metadata?: Record<string, any>;
}
export interface VotingProposal {
    id: string;
    title: string;
    description: string;
    content: any;
    proposerId: string;
    timestamp: Date;
    deadline: Date;
    votingType: VotingType;
    minimumParticipation: number;
    passingThreshold: number;
    status: "active" | "passed" | "rejected" | "expired";
}
export type VotingType = "simple-majority" | "weighted" | "quadratic" | "approval" | "liquid-democracy" | "stake-weighted";
export interface Voter {
    id: string;
    publicKey: string;
    weight: number;
    reputation: number;
    expertise: string[];
    voiceCredits: number;
    delegates: Set<string>;
    delegatedTo?: string;
    stakes: Map<string, number>;
}
export interface VotingResult {
    proposalId: string;
    totalVotes: number;
    approveVotes: number;
    rejectVotes: number;
    abstainVotes: number;
    totalWeight: number;
    approveWeight: number;
    rejectWeight: number;
    participationRate: number;
    passed: boolean;
    finalizedAt: Date;
}
export declare class VotingMechanisms extends EventEmitter {
    private consensusSystemId;
    private voters;
    private proposals;
    private votes;
    private results;
    private delegationGraph;
    constructor(consensusSystemId: string);
    /**
     * Register a voter in the system
     */
    registerVoter(voter: Voter): void;
    /**
     * Create a new voting proposal
     */
    createProposal(proposal: Omit<VotingProposal, "id" | "status">): Promise<string>;
    /**
     * Cast a vote on a proposal
     */
    castVote(vote: Omit<Vote, "id" | "signature">): Promise<boolean>;
    /**
     * Validate a vote based on the voting mechanism
     */
    private validateVote;
    /**
     * Validate quadratic voting constraints
     */
    private validateQuadraticVote;
    /**
     * Validate stake-weighted voting
     */
    private validateStakeWeightedVote;
    /**
     * Validate liquid democracy vote
     */
    private validateLiquidDemocracyVote;
    /**
     * Process delegated votes in liquid democracy
     */
    private processDelegatedVotes;
    /**
     * Delegate voting power to another voter
     */
    delegateVote(delegatorId: string, delegateId: string): boolean;
    /**
     * Check for circular delegation
     */
    private wouldCreateCircularDelegation;
    /**
     * Calculate voting results
     */
    calculateResults(proposalId: string): VotingResult;
    /**
     * Calculate weight of a vote based on voting mechanism
     */
    private calculateVoteWeight;
    /**
     * Determine if proposal passes based on voting mechanism
     */
    private determineOutcome;
    /**
     * Finalize a proposal and calculate final results
     */
    finalizeProposal(proposalId: string): Promise<VotingResult>;
    /**
     * Update voice credits after quadratic voting
     */
    private updateQuadraticVotingCredits;
    /**
     * Get voting statistics
     */
    getVotingStatistics(): {
        totalProposals: number;
        activeProposals: number;
        passedProposals: number;
        rejectedProposals: number;
        averageParticipation: number;
        votingDistribution: Record<string, number>;
    };
    /**
     * Detect voting anomalies
     */
    detectVotingAnomalies(proposalId: string): {
        suspiciousVotes: Vote[];
        coordinatedVoting: boolean;
        unusualPatterns: string[];
    };
    private generateProposalId;
    private generateVoteId;
    private signVote;
    /**
     * Get proposal details
     */
    getProposal(proposalId: string): VotingProposal | undefined;
    /**
     * Get voting result
     */
    getResult(proposalId: string): VotingResult | undefined;
    /**
     * Get all votes for a proposal
     */
    getVotes(proposalId: string): Vote[];
}
export default VotingMechanisms;
//# sourceMappingURL=voting-mechanisms.d.ts.map
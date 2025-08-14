/**
 * Voting Mechanisms for Byzantine Consensus
 * Implements various voting algorithms including weighted, quadratic, and liquid democracy
 */

import { EventEmitter } from "events";
import { createHash } from "crypto";

export interface Vote {
  id: string;
  voterId: string;
  proposalId: string;
  decision: "approve" | "reject" | "abstain";
  weight: number;
  strength?: number; // For quadratic voting
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

export type VotingType =
  | "simple-majority"
  | "weighted"
  | "quadratic"
  | "approval"
  | "liquid-democracy"
  | "stake-weighted";

export interface Voter {
  id: string;
  publicKey: string;
  weight: number;
  reputation: number;
  expertise: string[];
  voiceCredits: number; // For quadratic voting
  delegates: Set<string>; // For liquid democracy
  delegatedTo?: string;
  stakes: Map<string, number>; // For stake-weighted voting
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

export class VotingMechanisms extends EventEmitter {
  private voters: Map<string, Voter> = new Map();
  private proposals: Map<string, VotingProposal> = new Map();
  private votes: Map<string, Vote[]> = new Map(); // proposalId -> votes
  private results: Map<string, VotingResult> = new Map();
  private delegationGraph: Map<string, Set<string>> = new Map(); // For liquid democracy

  constructor(private consensusSystemId: string) {
    super();
  }

  /**
   * Register a voter in the system
   */
  public registerVoter(voter: Voter): void {
    this.voters.set(voter.id, voter);
    this.delegationGraph.set(voter.id, new Set());
    this.emit("voter-registered", voter);
  }

  /**
   * Create a new voting proposal
   */
  public async createProposal(
    proposal: Omit<VotingProposal, "id" | "status">,
  ): Promise<string> {
    const proposalId = this.generateProposalId(proposal);
    const fullProposal: VotingProposal = {
      ...proposal,
      id: proposalId,
      status: "active",
    };

    this.proposals.set(proposalId, fullProposal);
    this.votes.set(proposalId, []);

    // Set up automatic finalization
    setTimeout(() => {
      this.finalizeProposal(proposalId);
    }, proposal.deadline.getTime() - Date.now());

    this.emit("proposal-created", fullProposal);
    return proposalId;
  }

  /**
   * Cast a vote on a proposal
   */
  public async castVote(
    vote: Omit<Vote, "id" | "signature">,
  ): Promise<boolean> {
    const proposal = this.proposals.get(vote.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "active") {
      throw new Error("Proposal is not active");
    }

    if (new Date() > proposal.deadline) {
      throw new Error("Voting deadline has passed");
    }

    const voter = this.voters.get(vote.voterId);
    if (!voter) {
      throw new Error("Voter not registered");
    }

    // Check for duplicate votes
    const existingVotes = this.votes.get(vote.proposalId) || [];
    if (existingVotes.some((v) => v.voterId === vote.voterId)) {
      throw new Error("Voter has already voted on this proposal");
    }

    // Validate vote based on voting type
    const isValid = await this.validateVote(vote, proposal, voter);
    if (!isValid) {
      return false;
    }

    const fullVote: Vote = {
      ...vote,
      id: this.generateVoteId(vote),
      signature: this.signVote(vote),
    };

    this.votes.get(vote.proposalId)!.push(fullVote);

    // Handle liquid democracy delegation
    if (proposal.votingType === "liquid-democracy") {
      await this.processDelegatedVotes(fullVote, proposal);
    }

    this.emit("vote-cast", fullVote);
    return true;
  }

  /**
   * Validate a vote based on the voting mechanism
   */
  private async validateVote(
    vote: Omit<Vote, "id" | "signature">,
    proposal: VotingProposal,
    voter: Voter,
  ): Promise<boolean> {
    switch (proposal.votingType) {
      case "quadratic":
        return this.validateQuadraticVote(vote, voter);
      case "stake-weighted":
        return this.validateStakeWeightedVote(vote, voter, proposal);
      case "weighted":
        return vote.weight <= voter.weight;
      case "liquid-democracy":
        return this.validateLiquidDemocracyVote(vote, voter);
      default:
        return true;
    }
  }

  /**
   * Validate quadratic voting constraints
   */
  private validateQuadraticVote(
    vote: Omit<Vote, "id" | "signature">,
    voter: Voter,
  ): boolean {
    if (!vote.strength) {
      return false;
    }

    const cost = vote.strength ** 2;
    return cost <= voter.voiceCredits;
  }

  /**
   * Validate stake-weighted voting
   */
  private validateStakeWeightedVote(
    vote: Omit<Vote, "id" | "signature">,
    voter: Voter,
    proposal: VotingProposal,
  ): boolean {
    const stakes = voter.stakes.get(proposal.id) || 0;
    return vote.weight <= stakes;
  }

  /**
   * Validate liquid democracy vote
   */
  private validateLiquidDemocracyVote(
    vote: Omit<Vote, "id" | "signature">,
    voter: Voter,
  ): boolean {
    // Can't vote if delegated to someone else
    return !voter.delegatedTo;
  }

  /**
   * Process delegated votes in liquid democracy
   */
  private async processDelegatedVotes(
    vote: Vote,
    proposal: VotingProposal,
  ): Promise<void> {
    const voter = this.voters.get(vote.voterId)!;
    const delegates = voter.delegates;

    for (const delegateId of delegates) {
      const delegate = this.voters.get(delegateId);
      if (!delegate || delegate.delegatedTo !== vote.voterId) {
        continue;
      }

      // Create delegated vote
      const delegatedVote: Vote = {
        id: this.generateVoteId({ ...vote, voterId: delegateId }),
        voterId: delegateId,
        proposalId: vote.proposalId,
        decision: vote.decision,
        weight: delegate.weight,
        timestamp: new Date(),
        signature: this.signVote({ ...vote, voterId: delegateId }),
        metadata: { delegatedFrom: vote.voterId },
      };

      this.votes.get(vote.proposalId)!.push(delegatedVote);
      this.emit("delegated-vote-cast", delegatedVote);
    }
  }

  /**
   * Delegate voting power to another voter
   */
  public delegateVote(delegatorId: string, delegateId: string): boolean {
    const delegator = this.voters.get(delegatorId);
    const delegate = this.voters.get(delegateId);

    if (!delegator || !delegate) {
      return false;
    }

    // Prevent circular delegation
    if (this.wouldCreateCircularDelegation(delegatorId, delegateId)) {
      return false;
    }

    delegator.delegatedTo = delegateId;
    delegate.delegates.add(delegatorId);

    this.emit("vote-delegated", { delegatorId, delegateId });
    return true;
  }

  /**
   * Check for circular delegation
   */
  private wouldCreateCircularDelegation(
    delegatorId: string,
    delegateId: string,
  ): boolean {
    const visited = new Set<string>();
    let current = delegateId;

    while (current && !visited.has(current)) {
      visited.add(current);
      const voter = this.voters.get(current);
      if (!voter) break;

      if (voter.delegatedTo === delegatorId) {
        return true;
      }
      current = voter.delegatedTo || "";
    }

    return false;
  }

  /**
   * Calculate voting results
   */
  public calculateResults(proposalId: string): VotingResult {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const votes = this.votes.get(proposalId) || [];

    let totalVotes = 0;
    let approveVotes = 0;
    let rejectVotes = 0;
    let abstainVotes = 0;
    let totalWeight = 0;
    let approveWeight = 0;
    let rejectWeight = 0;

    for (const vote of votes) {
      totalVotes++;
      totalWeight += vote.weight;

      switch (vote.decision) {
        case "approve":
          approveVotes++;
          approveWeight += this.calculateVoteWeight(vote, proposal);
          break;
        case "reject":
          rejectVotes++;
          rejectWeight += this.calculateVoteWeight(vote, proposal);
          break;
        case "abstain":
          abstainVotes++;
          break;
      }
    }

    const totalRegisteredVoters = this.voters.size;
    const participationRate = totalVotes / totalRegisteredVoters;

    const passed = this.determineOutcome(
      proposal,
      approveWeight,
      rejectWeight,
      totalWeight,
      participationRate,
    );

    const result: VotingResult = {
      proposalId,
      totalVotes,
      approveVotes,
      rejectVotes,
      abstainVotes,
      totalWeight,
      approveWeight,
      rejectWeight,
      participationRate,
      passed,
      finalizedAt: new Date(),
    };

    this.results.set(proposalId, result);
    return result;
  }

  /**
   * Calculate weight of a vote based on voting mechanism
   */
  private calculateVoteWeight(vote: Vote, proposal: VotingProposal): number {
    switch (proposal.votingType) {
      case "quadratic":
        return vote.strength || 1;
      case "weighted":
      case "stake-weighted":
        return vote.weight;
      case "liquid-democracy":
        // Weight includes delegated votes
        const voter = this.voters.get(vote.voterId)!;
        return vote.weight + (vote.metadata?.delegatedWeight || 0);
      default:
        return 1; // Simple majority
    }
  }

  /**
   * Determine if proposal passes based on voting mechanism
   */
  private determineOutcome(
    proposal: VotingProposal,
    approveWeight: number,
    rejectWeight: number,
    totalWeight: number,
    participationRate: number,
  ): boolean {
    // Check minimum participation
    if (participationRate < proposal.minimumParticipation) {
      return false;
    }

    const approvalRatio = approveWeight / (approveWeight + rejectWeight);
    return approvalRatio >= proposal.passingThreshold;
  }

  /**
   * Finalize a proposal and calculate final results
   */
  public async finalizeProposal(proposalId: string): Promise<VotingResult> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "active") {
      throw new Error("Proposal is not active");
    }

    const result = this.calculateResults(proposalId);

    proposal.status = result.passed ? "passed" : "rejected";

    // Update voter credits for quadratic voting
    if (proposal.votingType === "quadratic") {
      await this.updateQuadraticVotingCredits(proposalId);
    }

    this.emit("proposal-finalized", { proposal, result });
    return result;
  }

  /**
   * Update voice credits after quadratic voting
   */
  private async updateQuadraticVotingCredits(
    proposalId: string,
  ): Promise<void> {
    const votes = this.votes.get(proposalId) || [];

    for (const vote of votes) {
      if (vote.strength) {
        const voter = this.voters.get(vote.voterId);
        if (voter) {
          const cost = vote.strength ** 2;
          voter.voiceCredits = Math.max(0, voter.voiceCredits - cost);
        }
      }
    }
  }

  /**
   * Get voting statistics
   */
  public getVotingStatistics(): {
    totalProposals: number;
    activeProposals: number;
    passedProposals: number;
    rejectedProposals: number;
    averageParticipation: number;
    votingDistribution: Record<string, number>;
  } {
    const proposals = Array.from(this.proposals.values());
    const results = Array.from(this.results.values());

    const activeProposals = proposals.filter(
      (p) => p.status === "active",
    ).length;
    const passedProposals = proposals.filter(
      (p) => p.status === "passed",
    ).length;
    const rejectedProposals = proposals.filter(
      (p) => p.status === "rejected",
    ).length;

    const averageParticipation =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.participationRate, 0) /
          results.length
        : 0;

    const votingDistribution: Record<string, number> = {};
    proposals.forEach((p) => {
      votingDistribution[p.votingType] =
        (votingDistribution[p.votingType] || 0) + 1;
    });

    return {
      totalProposals: proposals.length,
      activeProposals,
      passedProposals,
      rejectedProposals,
      averageParticipation,
      votingDistribution,
    };
  }

  /**
   * Detect voting anomalies
   */
  public detectVotingAnomalies(proposalId: string): {
    suspiciousVotes: Vote[];
    coordinatedVoting: boolean;
    unusualPatterns: string[];
  } {
    const votes = this.votes.get(proposalId) || [];
    const suspiciousVotes: Vote[] = [];
    const unusualPatterns: string[] = [];

    // Check for votes cast very close together (potential coordination)
    const voteTimestamps = votes.map((v) => v.timestamp.getTime()).sort();
    let coordinated = false;

    for (let i = 1; i < voteTimestamps.length; i++) {
      if (voteTimestamps[i] - voteTimestamps[i - 1] < 1000) {
        // Less than 1 second apart
        coordinated = true;
        break;
      }
    }

    // Check for unusual voting patterns
    const votesByDecision = votes.reduce(
      (acc, vote) => {
        acc[vote.decision] = (acc[vote.decision] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    if (votesByDecision.approve && votesByDecision.reject) {
      const ratio = votesByDecision.approve / votesByDecision.reject;
      if (ratio > 10 || ratio < 0.1) {
        unusualPatterns.push("Extreme voting ratio detected");
      }
    }

    // Check for voters with suspiciously high activity
    const voterActivity = new Map<string, number>();
    votes.forEach((vote) => {
      voterActivity.set(
        vote.voterId,
        (voterActivity.get(vote.voterId) || 0) + 1,
      );
    });

    voterActivity.forEach((count, voterId) => {
      if (count > votes.length * 0.1) {
        // More than 10% of all votes
        const suspiciousVotesByVoter = votes.filter(
          (v) => v.voterId === voterId,
        );
        suspiciousVotes.push(...suspiciousVotesByVoter);
      }
    });

    return {
      suspiciousVotes,
      coordinatedVoting: coordinated,
      unusualPatterns,
    };
  }

  private generateProposalId(
    proposal: Omit<VotingProposal, "id" | "status">,
  ): string {
    return createHash("sha256")
      .update(JSON.stringify(proposal) + Date.now())
      .digest("hex");
  }

  private generateVoteId(vote: Omit<Vote, "id" | "signature">): string {
    return createHash("sha256")
      .update(JSON.stringify(vote) + Date.now())
      .digest("hex");
  }

  private signVote(vote: Omit<Vote, "id" | "signature">): string {
    return createHash("sha256")
      .update(JSON.stringify(vote) + this.consensusSystemId)
      .digest("hex");
  }

  /**
   * Get proposal details
   */
  public getProposal(proposalId: string): VotingProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get voting result
   */
  public getResult(proposalId: string): VotingResult | undefined {
    return this.results.get(proposalId);
  }

  /**
   * Get all votes for a proposal
   */
  public getVotes(proposalId: string): Vote[] {
    return this.votes.get(proposalId) || [];
  }
}

export default VotingMechanisms;

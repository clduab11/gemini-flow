/**
 * Voting Mechanisms for Byzantine Consensus
 * Implements various voting algorithms including weighted, quadratic, and liquid democracy
 */
import { EventEmitter } from "events";
import { createHash } from "crypto";
export class VotingMechanisms extends EventEmitter {
    consensusSystemId;
    voters = new Map();
    proposals = new Map();
    votes = new Map(); // proposalId -> votes
    results = new Map();
    delegationGraph = new Map(); // For liquid democracy
    constructor(consensusSystemId) {
        super();
        this.consensusSystemId = consensusSystemId;
    }
    /**
     * Register a voter in the system
     */
    registerVoter(voter) {
        this.voters.set(voter.id, voter);
        this.delegationGraph.set(voter.id, new Set());
        this.emit("voter-registered", voter);
    }
    /**
     * Create a new voting proposal
     */
    async createProposal(proposal) {
        const proposalId = this.generateProposalId(proposal);
        const fullProposal = {
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
    async castVote(vote) {
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
        const fullVote = {
            ...vote,
            id: this.generateVoteId(vote),
            signature: this.signVote(vote),
        };
        this.votes.get(vote.proposalId).push(fullVote);
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
    async validateVote(vote, proposal, voter) {
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
    validateQuadraticVote(vote, voter) {
        if (!vote.strength) {
            return false;
        }
        const cost = vote.strength ** 2;
        return cost <= voter.voiceCredits;
    }
    /**
     * Validate stake-weighted voting
     */
    validateStakeWeightedVote(vote, voter, proposal) {
        const stakes = voter.stakes.get(proposal.id) || 0;
        return vote.weight <= stakes;
    }
    /**
     * Validate liquid democracy vote
     */
    validateLiquidDemocracyVote(vote, voter) {
        // Can't vote if delegated to someone else
        return !voter.delegatedTo;
    }
    /**
     * Process delegated votes in liquid democracy
     */
    async processDelegatedVotes(vote, proposal) {
        const voter = this.voters.get(vote.voterId);
        const delegates = voter.delegates;
        for (const delegateId of delegates) {
            const delegate = this.voters.get(delegateId);
            if (!delegate || delegate.delegatedTo !== vote.voterId) {
                continue;
            }
            // Create delegated vote
            const delegatedVote = {
                id: this.generateVoteId({ ...vote, voterId: delegateId }),
                voterId: delegateId,
                proposalId: vote.proposalId,
                decision: vote.decision,
                weight: delegate.weight,
                timestamp: new Date(),
                signature: this.signVote({ ...vote, voterId: delegateId }),
                metadata: { delegatedFrom: vote.voterId },
            };
            this.votes.get(vote.proposalId).push(delegatedVote);
            this.emit("delegated-vote-cast", delegatedVote);
        }
    }
    /**
     * Delegate voting power to another voter
     */
    delegateVote(delegatorId, delegateId) {
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
    wouldCreateCircularDelegation(delegatorId, delegateId) {
        const visited = new Set();
        let current = delegateId;
        while (current && !visited.has(current)) {
            visited.add(current);
            const voter = this.voters.get(current);
            if (!voter)
                break;
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
    calculateResults(proposalId) {
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
        const passed = this.determineOutcome(proposal, approveWeight, rejectWeight, totalWeight, participationRate);
        const result = {
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
    calculateVoteWeight(vote, proposal) {
        switch (proposal.votingType) {
            case "quadratic":
                return vote.strength || 1;
            case "weighted":
            case "stake-weighted":
                return vote.weight;
            case "liquid-democracy":
                // Weight includes delegated votes
                const voter = this.voters.get(vote.voterId);
                return vote.weight + (vote.metadata?.delegatedWeight || 0);
            default:
                return 1; // Simple majority
        }
    }
    /**
     * Determine if proposal passes based on voting mechanism
     */
    determineOutcome(proposal, approveWeight, rejectWeight, totalWeight, participationRate) {
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
    async finalizeProposal(proposalId) {
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
    async updateQuadraticVotingCredits(proposalId) {
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
    getVotingStatistics() {
        const proposals = Array.from(this.proposals.values());
        const results = Array.from(this.results.values());
        const activeProposals = proposals.filter((p) => p.status === "active").length;
        const passedProposals = proposals.filter((p) => p.status === "passed").length;
        const rejectedProposals = proposals.filter((p) => p.status === "rejected").length;
        const averageParticipation = results.length > 0
            ? results.reduce((sum, r) => sum + r.participationRate, 0) /
                results.length
            : 0;
        const votingDistribution = {};
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
    detectVotingAnomalies(proposalId) {
        const votes = this.votes.get(proposalId) || [];
        const suspiciousVotes = [];
        const unusualPatterns = [];
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
        const votesByDecision = votes.reduce((acc, vote) => {
            acc[vote.decision] = (acc[vote.decision] || 0) + 1;
            return acc;
        }, {});
        if (votesByDecision.approve && votesByDecision.reject) {
            const ratio = votesByDecision.approve / votesByDecision.reject;
            if (ratio > 10 || ratio < 0.1) {
                unusualPatterns.push("Extreme voting ratio detected");
            }
        }
        // Check for voters with suspiciously high activity
        const voterActivity = new Map();
        votes.forEach((vote) => {
            voterActivity.set(vote.voterId, (voterActivity.get(vote.voterId) || 0) + 1);
        });
        voterActivity.forEach((count, voterId) => {
            if (count > votes.length * 0.1) {
                // More than 10% of all votes
                const suspiciousVotesByVoter = votes.filter((v) => v.voterId === voterId);
                suspiciousVotes.push(...suspiciousVotesByVoter);
            }
        });
        return {
            suspiciousVotes,
            coordinatedVoting: coordinated,
            unusualPatterns,
        };
    }
    generateProposalId(proposal) {
        return createHash("sha256")
            .update(JSON.stringify(proposal) + Date.now())
            .digest("hex");
    }
    generateVoteId(vote) {
        return createHash("sha256")
            .update(JSON.stringify(vote) + Date.now())
            .digest("hex");
    }
    signVote(vote) {
        return createHash("sha256")
            .update(JSON.stringify(vote) + this.consensusSystemId)
            .digest("hex");
    }
    /**
     * Get proposal details
     */
    getProposal(proposalId) {
        return this.proposals.get(proposalId);
    }
    /**
     * Get voting result
     */
    getResult(proposalId) {
        return this.results.get(proposalId);
    }
    /**
     * Get all votes for a proposal
     */
    getVotes(proposalId) {
        return this.votes.get(proposalId) || [];
    }
}
export default VotingMechanisms;
//# sourceMappingURL=voting-mechanisms.js.map
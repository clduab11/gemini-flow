import { SQLiteMemoryCore } from '../sqlite-memory-core';
/**
 * @interface ConsensusProposal
 * @description Represents a proposal to be voted on by the consensus mechanism.
 */
export interface ConsensusProposal {
    id: string;
    proposerId: string;
    value: any;
    timestamp: number;
}
/**
 * @interface ConsensusResult
 * @description Represents the outcome of a consensus round.
 */
export interface ConsensusResult {
    proposalId: string;
    agreedValue: any | null;
    status: 'agreed' | 'disagreed' | 'failed' | 'in_progress';
    votes: {
        [participantId: string]: boolean;
    };
    participantsCount: number;
    agreementCount: number;
    disagreementCount: number;
    faultyParticipants?: string[];
}
/**
 * @interface ConsensusConfig
 * @description Configuration for the Byzantine Consensus mechanism.
 */
export interface ConsensusConfig {
    minParticipants: number;
    faultTolerancePercentage: number;
    timeoutMs: number;
}
/**
 * @class ByzantineConsensus
 * @description Implements a fault-tolerant decision-making mechanism with Byzantine fault tolerance.
 */
export declare class ByzantineConsensus {
    private config;
    private logger;
    private dbCore;
    constructor(config: ConsensusConfig, dbCore: SQLiteMemoryCore);
    /**
     * Initiates a consensus round for a given proposal.
     * @param {ConsensusProposal} proposal The proposal to achieve consensus on.
     * @param {string[]} participantIds IDs of the participants in this consensus round.
     * @returns {Promise<ConsensusResult>}
     */
    propose(proposal: ConsensusProposal, participantIds: string[]): Promise<ConsensusResult>;
    /**
     * Handles automatic leader election and failover mechanisms (conceptual).
     * @param {string[]} availableParticipants IDs of currently available participants.
     * @returns {Promise<string>} The ID of the elected leader.
     */
    electLeader(availableParticipants: string[]): Promise<string>;
    /**
     * Ensures consistency across distributed Google Cloud infrastructure (conceptual).
     * @returns {Promise<void>}
     */
    ensureConsistency(): Promise<void>;
    /**
     * Resolves conflicts using Vertex AI decision models (conceptual).
     * @param {any} conflictData Data representing the conflict.
     * @returns {Promise<any>} The resolved state.
     */
    resolveConflict(conflictData: any): Promise<any>;
}
//# sourceMappingURL=consensus.d.ts.map
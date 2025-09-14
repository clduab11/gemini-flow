/**
 * Co-Scientist Research Coordinator
 *
 * Advanced research integration system with hypothesis testing, academic database access,
 * scientific method validation, and knowledge graph construction
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { SecurityOptimizationManager } from "../core/security-optimization-manager.js";
export interface ResearchHypothesis {
    id: string;
    title: string;
    description: string;
    type: "observational" | "experimental" | "theoretical" | "computational";
    variables: {
        independent: string[];
        dependent: string[];
        controlled: string[];
    };
    methodology: string;
    expectedOutcomes: string[];
    successCriteria: string[];
    confidence: number;
    createdAt: Date;
    status: "draft" | "testing" | "validated" | "rejected" | "inconclusive";
}
export interface AcademicDatabase {
    name: string;
    apiEndpoint: string;
    apiKey?: string;
    rateLimit: number;
    capabilities: string[];
    searchFields: string[];
    resultFormat: string;
}
export interface ResearchPaper {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    keywords: string[];
    publicationDate: Date;
    journal?: string;
    doi?: string;
    citations: number;
    source: string;
    relevanceScore: number;
    methodology: string;
    findings: string[];
    limitations: string[];
}
export interface PeerReview {
    id: string;
    reviewerId: string;
    paperId: string;
    criteria: {
        methodology: number;
        significance: number;
        clarity: number;
        originality: number;
        rigor: number;
    };
    comments: string[];
    recommendation: "accept" | "minor_revision" | "major_revision" | "reject";
    confidence: number;
    reviewDate: Date;
}
export interface KnowledgeGraph {
    nodes: {
        id: string;
        type: "concept" | "entity" | "relation" | "hypothesis" | "finding";
        label: string;
        properties: Record<string, any>;
        confidence: number;
        sources: string[];
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        relation: string;
        weight: number;
        evidence: string[];
        confidence: number;
    }[];
    metadata: {
        created: Date;
        updated: Date;
        version: string;
        domain: string;
        contributors: string[];
    };
}
export interface CitationManager {
    style: "APA" | "MLA" | "Chicago" | "IEEE" | "Nature" | "Science";
    references: Map<string, ResearchPaper>;
    citationGraph: {
        forward: Map<string, string[]>;
        backward: Map<string, string[]>;
    };
    impactMetrics: {
        hIndex: number;
        citationCount: number;
        selfCitations: number;
        journalImpactFactor: Map<string, number>;
    };
}
export interface ResearchValidation {
    hypothesisId: string;
    methodology: {
        design: string;
        sampleSize?: number;
        controls: string[];
        variables: string[];
        statistical_tests: string[];
    };
    results: {
        raw_data: any;
        statistical_analysis: any;
        effect_size?: number;
        p_value?: number;
        confidence_intervals?: any;
        power_analysis?: any;
    };
    interpretation: {
        conclusions: string[];
        limitations: string[];
        implications: string[];
        future_research: string[];
    };
    validation_status: "pending" | "validated" | "invalidated" | "inconclusive";
    replication_attempts: number;
    meta_analysis_included: boolean;
}
export declare class ResearchCoordinator extends EventEmitter {
    private logger;
    private securityManager;
    private hypotheses;
    private validations;
    private papers;
    private peerReviews;
    private knowledgeGraphs;
    private citationManager;
    private academicDatabases;
    private apiLimits;
    private activePipelines;
    private researchQueue;
    private memoryStore;
    private metrics;
    constructor(securityManager: SecurityOptimizationManager);
    /**
     * 🧪 Hypothesis Testing Framework
     */
    generateHypothesis(params: {
        domain: string;
        background: string;
        observations: string[];
        variables: {
            independent: string[];
            dependent: string[];
            controlled: string[];
        };
        methodology?: string;
    }): Promise<ResearchHypothesis>;
    validateHypothesis(hypothesisId: string, validationParams?: {
        methodology?: string;
        dataSource?: string;
        sampleSize?: number;
        statisticalTests?: string[];
        controls?: string[];
    }): Promise<ResearchValidation>;
    /**
     * 📚 Academic Database Integration
     */
    searchAcademicDatabases(query: {
        keywords: string[];
        authors?: string[];
        timeRange?: {
            start: Date;
            end: Date;
        };
        journals?: string[];
        databases?: string[];
        maxResults?: number;
    }): Promise<ResearchPaper[]>;
    /**
     * 👥 Peer Review Simulation
     */
    simulatePeerReview(paperId: string, reviewerProfiles?: Array<{
        expertise: string[];
        experience: number;
        bias?: string;
        strictness: number;
    }>): Promise<PeerReview[]>;
    /**
     * 📄 Research Paper Generation Pipeline
     */
    generateResearchPaper(params: {
        hypothesisId: string;
        template?: string;
        sections?: string[];
        citationStyle?: "APA" | "MLA" | "Chicago" | "IEEE" | "Nature" | "Science";
        targetJournal?: string;
        coAuthors?: string[];
    }): Promise<{
        paper: ResearchPaper;
        document: {
            title: string;
            abstract: string;
            sections: Record<string, string>;
            references: string[];
            figures?: any[];
            tables?: any[];
        };
    }>;
    /**
     * 🧠 Knowledge Graph Construction with Mem0
     */
    buildKnowledgeGraph(domain: string, sources: {
        papers?: string[];
        hypotheses?: string[];
        validations?: string[];
        external?: any[];
    }): Promise<KnowledgeGraph>;
    /**
     * 📖 Citation Management System
     */
    manageCitations(operation: {
        type: "add" | "update" | "remove" | "format" | "analyze";
        paperId?: string;
        citationStyle?: "APA" | "MLA" | "Chicago" | "IEEE" | "Nature" | "Science";
        references?: string[];
        analysisType?: "impact" | "network" | "trends";
    }): Promise<any>;
    /**
     * 🔍 Scientific Method Validation Engine
     */
    validateScientificMethod(params: {
        hypothesisId: string;
        checkReproducibility?: boolean;
        validateEthics?: boolean;
        checkBias?: boolean;
        assessRigor?: boolean;
    }): Promise<{
        score: number;
        issues: string[];
        recommendations: string[];
        compliance: {
            reproducibility: boolean;
            ethics: boolean;
            bias: boolean;
            rigor: boolean;
        };
    }>;
    /**
     * Private helper methods
     */
    private initializeAcademicDatabases;
    private initializeCitationManager;
    private setupSecurityIntegration;
    private startResearchPipeline;
    private generateHypothesisTitle;
    private generateHypothesisDescription;
    private determineHypothesisType;
    private suggestMethodology;
    private predictOutcomes;
    private defineSucessCriteria;
    private assessHypothesisConfidence;
    private addToKnowledgeGraph;
    private initializeValidationFramework;
    private selectResearchDesign;
    private calculateSampleSize;
    private identifyControls;
    private selectStatisticalTests;
    private executeValidationMethodology;
    private performStatisticalAnalysis;
    private interpretResults;
    private determineValidationStatus;
    private checkRateLimit;
    private searchSingleDatabase;
    private deduplicateResults;
    private rankResultsByRelevance;
    private generateReviewerProfiles;
    private simulateSingleReview;
    private calculateReviewConsensus;
    private generatePaperTitle;
    private generateKeywords;
    private generatePaperSection;
    private generateAbstract;
    private generateReferences;
    private extractKnowledgeFromPaper;
    private extractKnowledgeFromHypothesis;
    private extractKnowledgeFromValidation;
    private buildKnowledgeRelationships;
    private calculateKnowledgeConfidence;
    private storeKnowledgeGraphInMemory;
    private addCitation;
    private formatCitations;
    private analyzeCitations;
    private checkReproducibility;
    private validateEthics;
    private checkBias;
    private assessRigor;
    private processResearchQueue;
    private processQueueItem;
    private updateKnowledgeGraphs;
    /**
     * Public API methods
     */
    getMetrics(): {
        hypothesesGenerated: number;
        hypothesesValidated: number;
        papersAnalyzed: number;
        peerReviewsCompleted: number;
        knowledgeGraphsBuilt: number;
        citationsManaged: number;
        databaseQueries: number;
        securityIncidents: number;
    };
    getHypotheses(): ResearchHypothesis[];
    getValidations(): ResearchValidation[];
    getPapers(): ResearchPaper[];
    getKnowledgeGraphs(): KnowledgeGraph[];
    exportResearchData(format?: "json" | "csv" | "bibtex"): Promise<string>;
}
//# sourceMappingURL=research-coordinator.d.ts.map
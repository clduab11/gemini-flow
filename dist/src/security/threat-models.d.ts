/**
 * Comprehensive Threat Models and Risk Assessment
 *
 * STRIDE-based threat modeling with automated risk assessment,
 * attack surface analysis, and mitigation strategies
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface ThreatModel {
    id: string;
    name: string;
    description: string;
    scope: string[];
    assets: Asset[];
    threats: Threat[];
    vulnerabilities: Vulnerability[];
    mitigations: Mitigation[];
    risk_assessment: RiskAssessment;
    created_date: Date;
    last_updated: Date;
    version: string;
}
export interface Asset {
    id: string;
    name: string;
    type: "data" | "system" | "process" | "person" | "facility";
    classification: "public" | "internal" | "confidential" | "restricted";
    value: number;
    availability_requirement: "low" | "medium" | "high" | "critical";
    integrity_requirement: "low" | "medium" | "high" | "critical";
    confidentiality_requirement: "low" | "medium" | "high" | "critical";
    dependencies: string[];
    controls: string[];
    threat_exposure: number;
}
export interface Threat {
    id: string;
    name: string;
    description: string;
    category: "spoofing" | "tampering" | "repudiation" | "information_disclosure" | "denial_of_service" | "elevation_of_privilege";
    likelihood: "very_low" | "low" | "medium" | "high" | "very_high";
    impact: "very_low" | "low" | "medium" | "high" | "very_high";
    risk_score: number;
    affected_assets: string[];
    attack_vectors: string[];
    threat_actors: string[];
    mitigations: string[];
}
export interface Vulnerability {
    id: string;
    name: string;
    description: string;
    type: "technical" | "physical" | "administrative" | "operational";
    severity: "low" | "medium" | "high" | "critical";
    cvss_score?: number;
    affected_assets: string[];
    exploitability: "low" | "medium" | "high";
    discovery_date: Date;
    remediation_complexity: "low" | "medium" | "high";
    status: "open" | "in_progress" | "mitigated" | "accepted" | "closed";
}
export interface Mitigation {
    id: string;
    name: string;
    description: string;
    type: "preventive" | "detective" | "corrective" | "deterrent";
    effectiveness: "low" | "medium" | "high";
    implementation_cost: "low" | "medium" | "high" | "very_high";
    operational_impact: "low" | "medium" | "high";
    threats_addressed: string[];
    vulnerabilities_addressed: string[];
    implementation_status: "planned" | "in_progress" | "implemented" | "verified";
    implementation_date?: Date;
    responsible_party: string;
}
export interface RiskAssessment {
    overall_risk: "low" | "medium" | "high" | "critical";
    risk_score: number;
    high_risk_threats: string[];
    critical_vulnerabilities: string[];
    recommended_mitigations: string[];
    residual_risk: "low" | "medium" | "high" | "critical";
    risk_appetite: "conservative" | "moderate" | "aggressive";
    assessment_date: Date;
    next_review_date: Date;
}
export interface AttackPath {
    id: string;
    name: string;
    description: string;
    steps: AttackStep[];
    likelihood: "very_low" | "low" | "medium" | "high" | "very_high";
    impact: "very_low" | "low" | "medium" | "high" | "very_high";
    risk_score: number;
    mitigations: string[];
}
export interface AttackStep {
    step_number: number;
    technique: string;
    description: string;
    prerequisites: string[];
    tools_required: string[];
    skill_level: "low" | "medium" | "high" | "expert";
    detection_difficulty: "easy" | "medium" | "hard" | "very_hard";
    mitigations: string[];
}
export interface ThreatIntelligence {
    id: string;
    source: string;
    threat_type: string;
    indicators: Indicator[];
    attribution: string;
    confidence: "low" | "medium" | "high";
    relevance: "low" | "medium" | "high";
    last_updated: Date;
    expiry_date?: Date;
}
export interface Indicator {
    type: "ip" | "domain" | "url" | "hash" | "email" | "signature";
    value: string;
    confidence: "low" | "medium" | "high";
    last_seen: Date;
    context: string;
}
/**
 * Threat Modeling Manager
 */
export declare class ThreatModelingManager extends EventEmitter {
    private logger;
    private threatModels;
    private threatIntelligence;
    private attackPaths;
    private threatMetrics;
    constructor();
    /**
     * Create a new threat model
     */
    createThreatModel(params: {
        name: string;
        description: string;
        scope: string[];
        assets: Omit<Asset, "id">[];
    }): Promise<ThreatModel>;
    /**
     * Analyze attack paths
     */
    analyzeAttackPaths(modelId: string): Promise<AttackPath[]>;
    /**
     * Update threat intelligence
     */
    updateThreatIntelligence(intelligence: Omit<ThreatIntelligence, "id">): Promise<void>;
    /**
     * Get threat model
     */
    getThreatModel(modelId: string): ThreatModel | undefined;
    /**
     * Get all threat models
     */
    getThreatModels(): ThreatModel[];
    /**
     * Get threat metrics
     */
    getThreatMetrics(): {
        models_created: number;
        threats_identified: number;
        vulnerabilities_found: number;
        mitigations_implemented: number;
        risk_assessments_completed: number;
        attack_paths_analyzed: number;
    };
    private initializeThreatDatabase;
    private startThreatMonitoring;
    private identifyThreats;
    private identifyVulnerabilities;
    private generateMitigations;
    private performRiskAssessment;
    private generateAttackPath;
    private correlateWithThreatModels;
    private performThreatAnalysis;
}
//# sourceMappingURL=threat-models.d.ts.map
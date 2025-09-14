/**
 * Co-Scientist Research and Security Framework Integration
 *
 * Seamless integration between research capabilities and comprehensive security,
 * enabling secure scientific collaboration with enterprise-grade protection
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface SecureResearchSession {
    id: string;
    research_coordinator_id: string;
    security_context: any;
    compliance_requirements: string[];
    threat_model_id: string;
    session_start: Date;
    session_end?: Date;
    participants: SessionParticipant[];
    research_artifacts: SecureArtifact[];
    security_events: SecurityEvent[];
    status: "active" | "completed" | "suspended";
}
export interface SessionParticipant {
    id: string;
    identity: string;
    role: string;
    clearance_level: string;
    session_token: string;
    last_activity: Date;
    access_violations: number;
}
export interface SecureArtifact {
    id: string;
    type: "hypothesis" | "research_paper" | "data" | "analysis";
    classification: string;
    encryption_context: any;
    access_log: any[];
    integrity_hash: string;
    retention_policy: any;
    compliance_tags: string[];
}
export interface SecurityEvent {
    id: string;
    type: string;
    severity: string;
    description: string;
    timestamp: Date;
    resource: string;
    outcome: string;
    details: any;
    response_actions: string[];
}
export interface ResearchThreatModel {
    id: string;
    research_domain: string;
    data_types: string[];
    participants: string[];
    external_connections: string[];
    threats: any;
    mitigations: any[];
    residual_risks: any[];
}
/**
 * Co-Scientist Security Integration
 * Provides secure research collaboration with enterprise-grade protection
 */
export declare class CoScientistSecurityIntegration extends EventEmitter {
    private logger;
    private secureResearchSessions;
    private researchThreatModels;
    private securityPolicies;
    private integrationMetrics;
    constructor();
    /**
     * Create Secure Research Session
     */
    createSecureResearchSession(params: {
        research_domain: string;
        data_classification: "public" | "internal" | "confidential" | "restricted";
        participants: Omit<SessionParticipant, "id" | "session_token" | "last_activity" | "access_violations">[];
        compliance_requirements?: string[];
        external_collaborations?: string[];
        research_objectives: string[];
    }): Promise<SecureResearchSession>;
    /**
     * Get active research sessions
     */
    getActiveResearchSessions(): SecureResearchSession[];
    /**
     * Get integration metrics
     */
    getIntegrationMetrics(): {
        secure_sessions_created: number;
        research_artifacts_encrypted: number;
        compliance_checks_performed: number;
        security_incidents_handled: number;
    };
    /**
     * Terminate research session
     */
    terminateResearchSession(sessionId: string, reason?: string): Promise<void>;
    private initializeIntegration;
    private setupEventHandlers;
    private startSecurityMonitoring;
    private monitorActiveSessions;
}
//# sourceMappingURL=co-scientist-security-integration.d.ts.map
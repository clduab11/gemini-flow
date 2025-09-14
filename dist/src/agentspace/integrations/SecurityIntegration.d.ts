/**
 * AgentSpace Security Integration
 *
 * Integrates the Co-Scientist security framework with AgentSpace,
 * providing comprehensive security for spatial agent environments,
 * research coordination, and multi-agent collaboration
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AgentSpaceManager } from "../core/AgentSpaceManager.js";
import { CoScientistSecurityIntegration } from "../../integrations/co-scientist-security-integration.js";
import { WorkspaceId, Vector3D, SecurityClearance } from "../types/AgentSpaceTypes.js";
export interface SpatialSecurityContext {
    id: string;
    workspaceId: WorkspaceId;
    agentId: string;
    securityLevel: "public" | "internal" | "confidential" | "restricted" | "top_secret";
    spatialBoundaries: {
        position: Vector3D;
        secureRadius: number;
        noFlyZones: Vector3D[];
        restrictedAreas: Vector3D[];
    };
    accessControls: {
        allowedAgents: string[];
        deniedAgents: string[];
        temporaryAccess: Map<string, Date>;
        emergencyOverride: boolean;
    };
    encryptionLevel: "none" | "standard" | "enhanced" | "quantum";
    auditLevel: "minimal" | "standard" | "comprehensive" | "forensic";
    complianceRequirements: string[];
    threatAssessment: SpatialThreatAssessment;
}
export interface SpatialThreatAssessment {
    id: string;
    workspaceId: WorkspaceId;
    threatLevel: "low" | "medium" | "high" | "critical";
    identifiedThreats: {
        unauthorized_access: {
            risk: string;
            mitigations: string[];
        };
        data_exfiltration: {
            risk: string;
            mitigations: string[];
        };
        agent_impersonation: {
            risk: string;
            mitigations: string[];
        };
        spatial_boundary_violation: {
            risk: string;
            mitigations: string[];
        };
        collaboration_hijacking: {
            risk: string;
            mitigations: string[];
        };
        memory_tampering: {
            risk: string;
            mitigations: string[];
        };
    };
    spatialVulnerabilities: {
        position: Vector3D;
        vulnerability: string;
        severity: string;
        recommendations: string[];
    }[];
    assessmentDate: Date;
    nextReview: Date;
}
export interface SecureCollaborationZone {
    id: string;
    name: string;
    centerPosition: Vector3D;
    radius: number;
    securityLevel: string;
    participants: SecureAgentParticipant[];
    dataClassification: "public" | "internal" | "confidential" | "restricted";
    encryptionEnabled: boolean;
    auditingEnabled: boolean;
    accessLog: CollaborationAccessEvent[];
    complianceStatus: ComplianceAssessment;
}
export interface SecureAgentParticipant {
    agentId: string;
    securityClearance: SecurityClearance;
    spatialPermissions: {
        allowedMovement: boolean;
        boundaryConstraints: Vector3D[];
        interactionRadius: number;
    };
    dataAccessLevel: string;
    joinTime: Date;
    lastActivity: Date;
    trustScore: number;
    violationCount: number;
}
export interface CollaborationAccessEvent {
    id: string;
    agentId: string;
    action: "join" | "leave" | "data_access" | "boundary_violation" | "unauthorized_attempt";
    timestamp: Date;
    position: Vector3D;
    outcome: "allowed" | "denied" | "flagged";
    riskScore: number;
    details: any;
}
export interface ComplianceAssessment {
    status: "compliant" | "non_compliant" | "under_review";
    frameworks: string[];
    lastAssessment: Date;
    nextAssessment: Date;
    findings: ComplianceFinding[];
    recommendations: string[];
}
export interface ComplianceFinding {
    id: string;
    framework: string;
    requirement: string;
    status: "compliant" | "non_compliant" | "partial";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    evidence: any;
    remediation: string[];
}
export declare class SecurityIntegration extends EventEmitter {
    private logger;
    private agentSpaceManager;
    private coScientistSecurity;
    private securityFramework;
    private spatialSecurityContexts;
    private threatAssessments;
    private secureCollaborationZones;
    private securityPolicies;
    private securityMetrics;
    constructor(agentSpaceManager: AgentSpaceManager, coScientistSecurity: CoScientistSecurityIntegration);
    /**
     * 🔒 Create Spatial Security Context for Workspace
     */
    createSpatialSecurityContext(params: {
        workspaceId: WorkspaceId;
        agentId: string;
        securityLevel: "public" | "internal" | "confidential" | "restricted" | "top_secret";
        spatialBoundaries: {
            position: Vector3D;
            secureRadius: number;
            noFlyZones?: Vector3D[];
            restrictedAreas?: Vector3D[];
        };
        complianceRequirements?: string[];
        customPolicies?: any[];
    }): Promise<{
        securityContext: SpatialSecurityContext;
        threatAssessment: SpatialThreatAssessment;
        securityConfiguration: any;
    }>;
    /**
     * 🛡️ Establish Secure Collaboration Zone
     */
    establishSecureCollaborationZone(params: {
        name: string;
        centerPosition: Vector3D;
        radius: number;
        securityLevel: "public" | "internal" | "confidential" | "restricted";
        initialParticipants: {
            agentId: string;
            securityClearance: SecurityClearance;
            dataAccessLevel: string;
        }[];
        dataClassification: "public" | "internal" | "confidential" | "restricted";
        complianceFrameworks: string[];
        customSecurityPolicies?: any[];
    }): Promise<{
        collaborationZone: SecureCollaborationZone;
        participantValidation: any;
        securityMeasures: any;
    }>;
    /**
     * 🔍 Validate Agent Access to Spatial Resource
     */
    validateSpatialAccess(agentId: string, targetResource: {
        type: "workspace" | "collaboration_zone" | "memory_node" | "data_artifact";
        id: string;
        position: Vector3D;
    }, requestedAction: "read" | "write" | "execute" | "delete" | "move"): Promise<{
        accessGranted: boolean;
        securityDecision: any;
        auditEvent: CollaborationAccessEvent;
        requiredMitigations?: string[];
    }>;
    /**
     * 📋 Generate Comprehensive Security Report
     */
    generateSecurityReport(scope: "workspace" | "collaboration_zone" | "system_wide", targetId?: string, reportType?: "summary" | "detailed" | "compliance" | "threat_analysis"): Promise<{
        report: any;
        recommendations: string[];
        criticalFindings: any[];
        complianceStatus: any;
    }>;
    /**
     * Private helper methods
     */
    private initializeSecurityPolicies;
    private setupEventHandlers;
    private startSecurityMonitoring;
    private performSpatialThreatAssessment;
    private determineEncryptionLevel;
    private determineAuditLevel;
    private applySecurityConfiguration;
    private enableSecurityMonitoring;
    private validateParticipantClearances;
    private calculateSpatialConstraints;
    private performComplianceAssessment;
    private applyCollaborationSecurityMeasures;
    private initializeCollaborationMonitoring;
    private handleAgentMovement;
    private handleWorkspaceAccess;
    private handleSecurityViolation;
    private performSecurityScan;
    private updateThreatAssessments;
    private findRelevantSecurityContext;
    private checkSpatialBoundaries;
    private evaluateAccessControls;
    private assessAccessRisk;
    private recordAccessEvent;
    private generateAccessMitigations;
    private analyzeSecurityContext;
    private analyzeCollaborationZone;
    private analyzeThreatAssessment;
    private analyzeOverallCompliance;
    /**
     * Public API methods
     */
    getSecurityMetrics(): {
        security_contexts_created: number;
        threat_assessments_performed: number;
        security_violations_detected: number;
        compliance_checks_completed: number;
        secure_collaborations_established: number;
        encryption_operations: number;
        access_controls_enforced: number;
        audit_events_recorded: number;
        emergency_responses: number;
    };
    getActiveSpatialSecurityContexts(): SpatialSecurityContext[];
    getSecureCollaborationZones(): SecureCollaborationZone[];
    shutdown(): Promise<void>;
}
//# sourceMappingURL=SecurityIntegration.d.ts.map
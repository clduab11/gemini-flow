/**
 * Production Security Hardening Framework
 *
 * Enterprise-grade security implementation for production Google Services deployment with:
 * 1. Application Security:
 *    - Input validation and sanitization for all endpoints
 *    - SQL injection prevention (parameterized queries)
 *    - XSS protection (CSP headers, output encoding)
 *    - CSRF tokens for state-changing operations
 *    - Rate limiting and DDoS protection
 *
 * 2. Infrastructure Security:
 *    - Network segmentation and firewall rules
 *    - WAF configuration for API protection
 *    - TLS 1.3 enforcement with HSTS
 *    - Certificate pinning for mobile/desktop clients
 *    - Secrets rotation policies (90-day max)
 *
 * 3. Compliance and Auditing:
 *    - SIEM integration (Splunk/ELK)
 *    - Audit log aggregation and retention (7 years)
 *    - PII detection and masking
 *    - GDPR data subject request automation
 *    - SOC2 Type II compliance checklist
 *
 * 4. Incident Response:
 *    - Security runbooks for common scenarios
 *    - Automated threat detection rules
 *    - Incident response team escalation
 *    - Forensics data collection scripts
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { DatabaseConnection } from "../core/sqlite-connection-pool.js";
export interface ProductionSecurityConfig {
    version: string;
    environment: "development" | "staging" | "production";
    enforcementLevel: "audit" | "warn" | "block" | "strict";
    applicationSecurity: {
        inputValidation: {
            enabled: boolean;
            strictMode: boolean;
            allowedTags: string[];
            maxInputLength: number;
            sqlInjectionPrevention: boolean;
        };
        xssProtection: {
            enabled: boolean;
            contentSecurityPolicy: string;
            xssFilter: boolean;
            frameOptions: string;
        };
        csrfProtection: {
            enabled: boolean;
            tokenExpiry: number;
            cookieSettings: {
                httpOnly: boolean;
                secure: boolean;
                sameSite: "strict" | "lax" | "none";
            };
        };
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
            skipSuccessfulRequests: boolean;
            skipFailedRequests: boolean;
        };
        ddosProtection: {
            enabled: boolean;
            thresholds: {
                requests_per_second: number;
                concurrent_connections: number;
                bandwidth_mbps: number;
            };
        };
    };
    infrastructureSecurity: {
        networkSecurity: {
            segmentationEnabled: boolean;
            firewallRules: FirewallRule[];
            allowedCidrs: string[];
            blockedCountries: string[];
        };
        tlsSecurity: {
            version: "1.2" | "1.3";
            hstsEnabled: boolean;
            hstsMaxAge: number;
            certificatePinning: {
                enabled: boolean;
                pins: string[];
                backupPins: string[];
            };
        };
        wafConfiguration: {
            enabled: boolean;
            ruleSets: string[];
            customRules: WafRule[];
            geoBlocking: string[];
        };
        secretsManagement: {
            rotationInterval: number;
            vaultIntegration: boolean;
            encryptionAtRest: boolean;
            accessLogging: boolean;
        };
    };
    compliance: {
        siemIntegration: {
            enabled: boolean;
            provider: "splunk" | "elk" | "sentinel" | "custom";
            endpoint: string;
            indexPattern: string;
        };
        auditLogging: {
            enabled: boolean;
            retentionYears: number;
            encryptLogs: boolean;
            realTimeAnalysis: boolean;
        };
        piiDetection: {
            enabled: boolean;
            patterns: string[];
            maskingStrategy: "full" | "partial" | "hash";
            alertOnDetection: boolean;
        };
        gdprCompliance: {
            enabled: boolean;
            automatedResponseTime: number;
            dataSubjectPortal: string;
            consentManagement: boolean;
        };
        soc2Compliance: {
            enabled: boolean;
            controls: string[];
            evidenceCollection: boolean;
            continuousMonitoring: boolean;
        };
    };
    incidentResponse: {
        automated: boolean;
        escalationMatrix: EscalationLevel[];
        runbookPaths: string[];
        forensicsEnabled: boolean;
        threatIntelIntegration: boolean;
    };
}
export interface FirewallRule {
    id: string;
    name: string;
    action: "allow" | "deny" | "log";
    protocol: "tcp" | "udp" | "icmp" | "all";
    sourceIp?: string;
    destinationIp?: string;
    sourcePort?: number | string;
    destinationPort?: number | string;
    priority: number;
    enabled: boolean;
}
export interface WafRule {
    id: string;
    name: string;
    condition: string;
    action: "block" | "challenge" | "log" | "allow";
    severity: "low" | "medium" | "high" | "critical";
    enabled: boolean;
}
export interface EscalationLevel {
    level: number;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    timeToEscalate: number;
    contacts: string[];
    actions: string[];
}
export interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "contained" | "resolved" | "closed";
    category: "malware" | "data_breach" | "unauthorized_access" | "ddos" | "insider_threat" | "other";
    detectedAt: Date;
    reportedBy: string;
    assignedTo?: string;
    affectedSystems: string[];
    affectedUsers: string[];
    timeline: IncidentEvent[];
    evidence: Evidence[];
    mitigationSteps: string[];
    rootCause?: string;
    lessonsLearned?: string[];
    resolvedAt?: Date;
    cost?: number;
}
export interface IncidentEvent {
    timestamp: Date;
    type: "detection" | "escalation" | "mitigation" | "communication" | "resolution";
    description: string;
    actor: string;
    automated: boolean;
}
export interface Evidence {
    id: string;
    type: "log" | "screenshot" | "network_capture" | "memory_dump" | "file" | "other";
    description: string;
    filePath?: string;
    hash: string;
    collectedAt: Date;
    collectedBy: string;
    chainOfCustody: CustodyEvent[];
}
export interface CustodyEvent {
    timestamp: Date;
    action: "collected" | "transferred" | "analyzed" | "stored" | "disposed";
    actor: string;
    details: string;
}
export interface ThreatDetectionRule {
    id: string;
    name: string;
    description: string;
    category: "authentication" | "authorization" | "data_access" | "network" | "behavioral";
    severity: "low" | "medium" | "high" | "critical";
    query: string;
    threshold: number;
    timeWindow: number;
    enabled: boolean;
    actions: string[];
    falsePositiveRate?: number;
    lastTriggered?: Date;
}
export interface VulnerabilityAssessment {
    id: string;
    target: string;
    type: "automated" | "manual" | "penetration_test";
    startedAt: Date;
    completedAt?: Date;
    findings: VulnerabilityFinding[];
    riskScore: number;
    remediationPlan?: string[];
    nextAssessmentDate?: Date;
}
export interface VulnerabilityFinding {
    id: string;
    title: string;
    description: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    cvss3Score?: number;
    cve?: string;
    category: string;
    location: string;
    impact: string;
    recommendation: string;
    status: "open" | "acknowledged" | "mitigated" | "resolved" | "accepted";
    dueDate?: Date;
}
export declare class ProductionSecurityHardening extends EventEmitter {
    private logger;
    private config;
    private db;
    private inputValidator;
    private xssProtector;
    private csrfProtector;
    private rateLimiter;
    private ddosProtector;
    private firewallManager;
    private tlsManager;
    private wafManager;
    private secretsManager;
    private siemIntegrator;
    private auditLogger;
    private piiDetector;
    private gdprManager;
    private soc2Manager;
    private incidentManager;
    private threatDetector;
    private forensicsCollector;
    private activeIncidents;
    private threatRules;
    private vulnerabilities;
    private securityMetrics;
    constructor(config: ProductionSecurityConfig, db: DatabaseConnection);
    /**
     * 🔒 Application Security Implementation
     */
    /**
     * Input Validation and Sanitization
     */
    validateAndSanitizeInput(input: any, schema: {
        type: "string" | "number" | "email" | "url" | "json" | "html";
        maxLength?: number;
        allowedChars?: string;
        required?: boolean;
        customValidation?: (value: any) => boolean;
    }): Promise<{
        isValid: boolean;
        sanitized: any;
        errors: string[];
    }>;
    /**
     * SQL Injection Prevention with Parameterized Queries
     */
    executeParameterizedQuery(query: string, parameters: any[], options?: {
        readOnly?: boolean;
        timeout?: number;
        maxRows?: number;
    }): Promise<any>;
    /**
     * XSS Protection with CSP Headers and Output Encoding
     */
    getXssProtectionHeaders(): Record<string, string>;
    /**
     * CSRF Token Management
     */
    generateCsrfToken(sessionId: string): Promise<string>;
    validateCsrfToken(sessionId: string, token: string): Promise<boolean>;
    /**
     * Rate Limiting and DDoS Protection
     */
    createRateLimitMiddleware(): any;
    checkForDdosPattern(clientIp: string): Promise<void>;
    /**
     * 🏗️ Infrastructure Security Implementation
     */
    /**
     * Network Segmentation and Firewall Rules
     */
    configureNetworkSecurity(): Promise<void>;
    /**
     * TLS 1.3 Enforcement with HSTS
     */
    getTlsSecurityHeaders(): Record<string, string>;
    /**
     * Certificate Pinning Configuration
     */
    getCertificatePinningConfig(): any;
    /**
     * WAF Configuration for API Protection
     */
    configureWaf(): Promise<void>;
    /**
     * Secrets Rotation Policies
     */
    rotateSecrets(): Promise<void>;
    /**
     * 📊 Compliance and Auditing Implementation
     */
    /**
     * SIEM Integration
     */
    forwardToSiem(event: any): Promise<void>;
    /**
     * Audit Log Aggregation and Retention
     */
    aggregateAuditLogs(): Promise<void>;
    /**
     * PII Detection and Masking
     */
    detectAndMaskPii(data: any): Promise<{
        masked: any;
        piiDetected: boolean;
        patterns: string[];
    }>;
    /**
     * GDPR Data Subject Request Automation
     */
    handleGdprRequest(request: {
        type: "access" | "rectification" | "erasure" | "portability" | "restriction";
        subjectId: string;
        requesterEmail: string;
        verificationData: any;
        scope?: string[];
    }): Promise<{
        requestId: string;
        status: "pending" | "approved" | "completed" | "rejected";
        responseData?: any;
        estimatedCompletion?: Date;
    }>;
    /**
     * SOC2 Type II Compliance Checklist
     */
    generateSoc2ComplianceReport(): Promise<{
        overallStatus: "compliant" | "non_compliant" | "partial";
        controls: Array<{
            id: string;
            name: string;
            status: "pass" | "fail" | "not_applicable";
            evidence: string[];
            findings: string[];
            recommendations: string[];
        }>;
        lastAssessment: Date;
        nextAssessment: Date;
    }>;
    /**
     * 🚨 Incident Response Implementation
     */
    /**
     * Security Incident Creation and Management
     */
    createSecurityIncident(incident: Omit<SecurityIncident, "id" | "detectedAt" | "status" | "timeline">): Promise<string>;
    /**
     * Automated Threat Detection
     */
    runThreatDetection(): Promise<void>;
    executeDetectionQuery(rule: ThreatDetectionRule): Promise<any[]>;
    handleThreatDetection(rule: ThreatDetectionRule, matches: any[]): Promise<void>;
    /**
     * Incident Response Team Escalation
     */
    escalateIncident(incidentId: string, severity: "low" | "medium" | "high" | "critical"): Promise<void>;
    /**
     * Forensics Data Collection
     */
    collectForensicsData(incidentId: string, targets: {
        systems: string[];
        timeRange: {
            start: Date;
            end: Date;
        };
        dataTypes: ("logs" | "network" | "memory" | "disk" | "registry")[];
    }): Promise<Evidence[]>;
    /**
     * 🔍 Monitoring and Metrics
     */
    getSecurityMetrics(): typeof this.securityMetrics & {
        activeIncidents: number;
        threatRules: number;
        averageResponseTime: number;
    };
    generateSecurityDashboard(): Promise<{
        summary: {
            status: "healthy" | "warning" | "critical";
            activeIncidents: number;
            recentThreats: number;
            complianceScore: number;
        };
        incidents: SecurityIncident[];
        threats: ThreatDetectionRule[];
        vulnerabilities: VulnerabilityFinding[];
        recommendations: string[];
    }>;
    /**
     * Private Implementation Methods
     */
    private initializeSecurityComponents;
    private setupSecurityMiddleware;
    private startMonitoring;
    private getEnabledFeatures;
    private containsSqlInjection;
    private containsDangerousSqlPatterns;
    private applyPiiMasking;
    private mapRuleCategoryToIncidentCategory;
    private extractAffectedSystems;
    private extractAffectedUsers;
    private executeAutomatedAction;
    private shouldEscalateToLevel;
    private notifyEscalationLevel;
    private autoEscalateIncident;
    private calculateAverageResponseTime;
    private calculateComplianceScore;
    private generateSecurityRecommendations;
    private loadThreatDetectionRules;
    private disableUserAccount;
    private notifySecurityTeam;
    private sendIncidentNotification;
}
export { ProductionSecurityHardening };
export type { ProductionSecurityConfig, SecurityIncident, ThreatDetectionRule, VulnerabilityAssessment, };
//# sourceMappingURL=production-security-hardening.d.ts.map
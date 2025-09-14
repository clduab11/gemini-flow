/**
 * A2A Comprehensive Audit Logging and Security Monitoring System
 *
 * Implements enterprise-grade audit logging and security monitoring:
 * - Structured audit logs with tamper-proof signatures
 * - Real-time security event monitoring and alerting
 * - Compliance logging (SOX, GDPR, HIPAA, PCI-DSS)
 * - Log aggregation and correlation across distributed nodes
 * - Threat intelligence integration and anomaly detection
 * - Log retention policies and automated archival
 * - Security incident response automation
 * - Performance monitoring and SLA tracking
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface AuditLogEntry {
    logId: string;
    timestamp: Date;
    eventType: "authentication" | "authorization" | "data_access" | "system_event" | "security_event" | "compliance";
    severity: "info" | "warning" | "error" | "critical";
    category: string;
    actor: {
        agentId: string;
        agentType: string;
        sourceIP?: string;
        userAgent?: string;
        sessionId?: string;
    };
    target: {
        resource: string;
        resourceType: string;
        resourceId?: string;
    };
    action: string;
    outcome: "success" | "failure" | "denied" | "error";
    details: {
        description: string;
        metadata: Record<string, any>;
        errorCode?: string;
        errorMessage?: string;
        duration?: number;
        bytesSent?: number;
        bytesReceived?: number;
    };
    compliance: {
        regulations: string[];
        dataClassification: "public" | "internal" | "confidential" | "restricted";
        retention: number;
        tags: string[];
    };
    security: {
        riskLevel: "low" | "medium" | "high" | "critical";
        threatIndicators: string[];
        correlationId?: string;
        signature: string;
        checksum: string;
    };
    context: {
        requestId?: string;
        traceId?: string;
        spanId?: string;
        environment: string;
        version: string;
        nodeId: string;
    };
}
export interface SecurityAlert {
    alertId: string;
    timestamp: Date;
    alertType: "intrusion_attempt" | "data_breach" | "privilege_escalation" | "anomaly_detected" | "policy_violation";
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    source: {
        agentId: string;
        sourceIP?: string;
        evidence: AuditLogEntry[];
    };
    impact: {
        scope: "single_agent" | "multiple_agents" | "system_wide";
        affectedResources: string[];
        businessImpact: string;
    };
    response: {
        automated: boolean;
        actions: string[];
        assignedTo?: string;
        status: "open" | "investigating" | "mitigated" | "resolved" | "false_positive";
    };
    metrics: {
        detectionTime: number;
        responseTime?: number;
        resolutionTime?: number;
    };
}
export interface ComplianceReport {
    reportId: string;
    period: {
        start: Date;
        end: Date;
    };
    regulation: string;
    summary: {
        totalEvents: number;
        complianceScore: number;
        violations: number;
        criticalIssues: number;
    };
    sections: {
        section: string;
        requirement: string;
        status: "compliant" | "non_compliant" | "partial";
        evidence: string[];
        gaps: string[];
    }[];
    recommendations: string[];
    generatedAt: Date;
    validatedBy?: string;
}
export interface AuditConfig {
    retention: {
        defaultDays: number;
        byCategory: Map<string, number>;
        archivalEnabled: boolean;
        compressionEnabled: boolean;
    };
    monitoring: {
        realTimeAlerts: boolean;
        anomalyDetection: boolean;
        threatIntelligence: boolean;
        correlationWindow: number;
        alertThresholds: Map<string, number>;
    };
    compliance: {
        enabledRegulations: string[];
        autoReporting: boolean;
        reportingSchedule: string;
        dataClassificationRequired: boolean;
    };
    security: {
        logIntegrity: boolean;
        encryptionEnabled: boolean;
        digitalSignatures: boolean;
        tamperDetection: boolean;
    };
    performance: {
        bufferSize: number;
        flushInterval: number;
        compressionRatio: number;
        indexingEnabled: boolean;
    };
    distribution: {
        enabled: boolean;
        syncInterval: number;
        nodeIds: string[];
        consensusRequired: boolean;
    };
}
export interface ThreatIntelligence {
    indicators: {
        ips: Set<string>;
        domains: Set<string>;
        hashes: Set<string>;
        patterns: Map<string, RegExp>;
    };
    feeds: {
        name: string;
        url: string;
        lastUpdated: Date;
        credibility: number;
    }[];
    rules: {
        ruleId: string;
        description: string;
        pattern: string;
        severity: string;
        enabled: boolean;
    }[];
}
export declare class A2AAuditLogger extends EventEmitter {
    private logger;
    private cache;
    private config;
    private auditBuffer;
    private securityAlerts;
    private complianceReports;
    private threatIntelligence;
    private anomalyDetector;
    private correlationEngine;
    private integrityChecker;
    private metrics;
    private signingKeyPair;
    private encryptionKey;
    private logSequence;
    private nodeId;
    private peerNodes;
    private syncQueue;
    constructor(config?: Partial<AuditConfig>);
    /**
     * Initialize configuration with defaults
     */
    private initializeConfig;
    /**
     * Initialize cryptographic components
     */
    private initializeCryptography;
    /**
     * Initialize security monitoring components
     */
    private initializeSecurityMonitoring;
    /**
     * Log an audit event
     */
    logEvent(eventType: AuditLogEntry["eventType"], category: string, actor: AuditLogEntry["actor"], target: AuditLogEntry["target"], action: string, outcome: AuditLogEntry["outcome"], details?: Partial<AuditLogEntry["details"]>, options?: {
        severity?: AuditLogEntry["severity"];
        compliance?: Partial<AuditLogEntry["compliance"]>;
        context?: Partial<AuditLogEntry["context"]>;
    }): Promise<AuditLogEntry>;
    /**
     * Create security alert
     */
    createSecurityAlert(alertType: SecurityAlert["alertType"], severity: SecurityAlert["severity"], title: string, description: string, source: SecurityAlert["source"], evidence?: AuditLogEntry[]): Promise<SecurityAlert>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(regulation: string, startDate: Date, endDate: Date): Promise<ComplianceReport>;
    /**
     * Query audit logs with filters
     */
    queryAuditLogs(filters: {
        startDate?: Date;
        endDate?: Date;
        eventTypes?: string[];
        severities?: string[];
        actors?: string[];
        targets?: string[];
        outcomes?: string[];
        regulations?: string[];
        limit?: number;
        offset?: number;
    }): Promise<AuditLogEntry[]>;
    /**
     * Verify log integrity
     */
    verifyLogIntegrity(logEntry: AuditLogEntry): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Private helper methods
     */
    private determineSeverity;
    private determineRegulations;
    private determineRetention;
    private assessRiskLevel;
    private checkThreatIndicators;
    private shouldFlushImmediately;
    private processSecurityMonitoring;
    private processComplianceMonitoring;
    private signLogEntry;
    private verifyLogSignature;
    private calculateChecksum;
    private flushBuffer;
    private persistLogs;
    private loadThreatIntelligence;
    private startBackgroundTasks;
    private cleanupExpiredLogs;
    private updateThreatIntelligence;
    private syncWithPeers;
    private collectPerformanceMetrics;
    /**
     * Placeholder methods for full implementation
     */
    private assessAlertScope;
    private identifyAffectedResources;
    private assessBusinessImpact;
    private shouldAutoRespond;
    private determineResponseActions;
    private executeAutoResponse;
    private executeAction;
    private sendAlertToExternalSystems;
    private analyzeCompliance;
    private checkComplianceViolations;
    /**
     * Public API methods
     */
    getMetrics(): {
        logsProcessed: number;
        alertsGenerated: number;
        complianceViolations: number;
        integrityFailures: number;
        averageLogProcessingTime: number;
        bufferUtilization: number;
        storageUtilization: number;
        indexingPerformance: number;
    };
    getConfig(): AuditConfig;
    updateConfig(updates: Partial<AuditConfig>): Promise<void>;
    getSecurityAlerts(limit?: number): SecurityAlert[];
    getComplianceReports(): ComplianceReport[];
    forceFlush(): Promise<void>;
    getBufferStatus(): {
        size: number;
        utilization: number;
    };
}
//# sourceMappingURL=a2a-audit-logger.d.ts.map
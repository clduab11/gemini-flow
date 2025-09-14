export class SecurityOptimizationManager extends EventEmitter<[never]> {
    constructor(orchestrator: any, performance: any, auth: any, router: any);
    logger: Logger;
    orchestrator: any;
    performance: any;
    auth: any;
    router: any;
    securityPolicy: any;
    optimizationFlags: any;
    canaryDeployments: Map<any, any>;
    costOptimizations: Map<any, any>;
    auditLog: any[];
    notificationConfig: any;
    costTracker: Map<any, any>;
    securityAlerts: Set<any>;
    analysisHistory: any[];
    optimizationLearning: Map<any, any>;
    emergencyProtocols: Map<any, any>;
    metrics: {
        totalOptimizations: number;
        securityBlocks: number;
        costSavings: number;
        emergencyOverrides: number;
        canarySuccessRate: number;
        metaImprovements: number;
    };
    /**
     * Initialize default security policy
     */
    initializeSecurityPolicy(): void;
    /**
     * Initialize optimization flags
     */
    initializeOptimizationFlags(): void;
    /**
     * 🚀 IMPLEMENT --auto-route FLAG
     * Intelligent model routing with performance-based selection and security validation
     */
    enableAutoRoute(options?: {}): Promise<boolean>;
    /**
     * 💰 IMPLEMENT --cost-optimize FLAG
     * Model selection optimization with token usage minimization and budget controls
     */
    enableCostOptimization(options?: {}): Promise<boolean>;
    /**
     * 🚢 IMPLEMENT --canary-deploy FLAG
     * Safe deployment patterns with gradual rollout and automatic rollback
     */
    enableCanaryDeployment(options: any): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    /**
     * 📢 IMPLEMENT --slack-updates FLAG
     * Real-time notification system with security filtering
     */
    enableSlackUpdates(config: any): Promise<boolean>;
    /**
     * 🔍 IMPLEMENT --analyze-self FLAG
     * Meta-analysis capabilities with security boundaries
     */
    enableSelfAnalysis(options?: {}): Promise<{
        performanceMetrics: any;
        securityMetrics: {
            auditEvents: number;
            securityAlerts: number;
            lastSecurityCheck: number;
        };
        optimizationSuggestions: string[];
        riskAssessment: string;
        confidenceScore: number;
        selfImprovementActions: never[];
    }>;
    /**
     * 🔄 IMPLEMENT --meta-optimization FLAG
     * Recursive optimization with learning from patterns and safety limits
     */
    enableMetaOptimization(options?: {}): Promise<boolean>;
    /**
     * Security validation for access control
     */
    validateAccess(permission: any, resource: any): Promise<boolean>;
    /**
     * Create comprehensive audit event
     */
    createAuditEvent(action: any, resource: any, details: any, result?: string): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        timestamp: Date;
        action: any;
        userId: any;
        resource: any;
        result: string;
        details: any;
        risk: string;
        signature: string;
    }>;
    /**
     * Record audit event with security measures
     */
    recordAuditEvent(event: any): void;
    /**
     * Setup emergency protocols
     */
    setupEmergencyProtocols(): void;
    /**
     * Start security monitoring
     */
    startSecurityMonitoring(): void;
    /**
     * Helper methods for specific optimizations
     */
    getSecurityValidatedModels(securityLevel?: string): Promise<any>;
    setupCostAwareRouting(): void;
    getCostOptimizedModels(optimization: any): Promise<string[]>;
    setupCostMonitoring(optimization: any): void;
    setupBudgetEnforcement(optimization: any): void;
    startCanaryHealthMonitoring(deployment: any): void;
    startCanarySecurityMonitoring(deployment: any): void;
    setupCanaryRollbackConditions(deployment: any): void;
    scheduleTrafficIncrease(deployment: any): void;
    trackRoutingDecision(decision: any, config: any): void;
    trackRoutingCost(decision: any): void;
    trackRequestCost(data: any, optimization: any): void;
    getCurrentSpend(): any;
    checkCanaryHealth(deployment: any): Promise<number>;
    rollbackCanaryDeployment(deploymentId: any, reason: any): Promise<void>;
    setupSecurityCheck(deployment: any, check: any): void;
    setupRollbackCondition(deployment: any, condition: any): void;
    updateCanaryTraffic(deploymentId: any, percent: any): Promise<void>;
    sanitizeAuditDetails(details: any): any;
    assessAuditRisk(action: any, resource: any, result: any): "low" | "medium" | "high" | "critical";
    signAuditEvent(action: any, resource: any, details: any): string;
    archiveAuditEvents(events: any): void;
    triggerSecurityAlert(event: any): void;
    monitorSuspiciousActivities(): void;
    monitorCostThresholds(): void;
    performHealthChecks(): void;
    setupNotificationListeners(): void;
    validateWebhookSecurity(webhookUrl: any): Promise<void>;
    sendSlackNotification(notification: any): Promise<void>;
    applySecurityFilters(notification: any): any;
    checkRateLimit(): boolean;
    analyzePerformanceMetrics(): Promise<any>;
    analyzeSecurityMetrics(): Promise<{
        auditEvents: number;
        securityAlerts: number;
        lastSecurityCheck: number;
    }>;
    generateOptimizationSuggestions(): Promise<string[]>;
    assessSystemRisks(): Promise<"low" | "medium" | "high">;
    sanitizeMetrics(metrics: any): any;
    sanitizeSecurityMetrics(metrics: any): any;
    generateSelfImprovements(analysis: any): Promise<string[]>;
    startMetaOptimizationCycle(config: any): void;
    setupOptimizationLearning(): void;
    setupMetaOptimizationSafety(config: any): void;
    /**
     * Public API methods
     */
    getOptimizationFlags(): any;
    getSecurityPolicy(): any;
    getMetrics(): {
        totalOptimizations: number;
        securityBlocks: number;
        costSavings: number;
        emergencyOverrides: number;
        canarySuccessRate: number;
        metaImprovements: number;
    };
    getCanaryDeployments(): any[];
    getAuditLog(limit?: number): any[];
    emergencyStop(reason: any): Promise<void>;
    securityLockdown(reason: any): Promise<void>;
}
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=security-optimization-manager.d.ts.map
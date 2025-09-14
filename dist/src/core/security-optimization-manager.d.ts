/**
 * Security-Focused Optimization Manager
 *
 * Implements advanced optimization flags with comprehensive security mechanisms:
 * - --auto-route: Intelligent model routing with security validation
 * - --cost-optimize: Cost optimization with audit trails
 * - --canary-deploy: Safe deployment patterns with rollback
 * - --slack-updates: Real-time notifications with security filtering
 * - --analyze-self: Meta-analysis with security boundaries
 * - --meta-optimization: Recursive optimization with safety limits
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { ModelOrchestrator } from "./model-orchestrator.js";
import { PerformanceMonitor } from "./performance-monitor.js";
import { AuthenticationManager } from "./auth-manager.js";
import { ModelRouter } from "./model-router.js";
export interface SecurityPolicy {
    maxCostPerRequest: number;
    allowedModelTiers: string[];
    requiresApproval: boolean;
    auditLevel: "minimal" | "standard" | "comprehensive";
    emergencyOverrides: boolean;
    accessControl: {
        roles: string[];
        permissions: string[];
    };
}
export interface OptimizationFlags {
    autoRoute: boolean;
    costOptimize: boolean;
    canaryDeploy: boolean;
    slackUpdates: boolean;
    analyzeSelf: boolean;
    metaOptimization: boolean;
    securityOverride: boolean;
}
export interface CanaryDeployment {
    id: string;
    name: string;
    version: string;
    trafficPercent: number;
    healthThreshold: number;
    rollbackConditions: string[];
    securityChecks: string[];
    autoRollback: boolean;
    maxDuration: number;
    startTime: Date;
}
export interface CostOptimization {
    targetReduction: number;
    maxLatencyIncrease: number;
    preserveQuality: boolean;
    budgetLimit: number;
    alertThresholds: number[];
    fallbackStrategy: string;
}
export interface NotificationConfig {
    webhookUrl?: string;
    channel?: string;
    securityFilters: string[];
    rateLimits: {
        maxPerHour: number;
        maxPerDay: number;
    };
    urgencyLevels: string[];
}
export interface MetaAnalysis {
    performanceMetrics: any;
    securityMetrics: any;
    optimizationSuggestions: string[];
    riskAssessment: string;
    confidenceScore: number;
    selfImprovementActions: string[];
}
export interface AuditEvent {
    id: string;
    timestamp: Date;
    action: string;
    userId?: string;
    resource: string;
    result: "success" | "failure" | "blocked";
    details: any;
    risk: "low" | "medium" | "high" | "critical";
    signature: string;
}
export declare class SecurityOptimizationManager extends EventEmitter {
    private logger;
    private orchestrator;
    private performance;
    private auth;
    private router;
    private securityPolicy;
    private optimizationFlags;
    private canaryDeployments;
    private costOptimizations;
    private auditLog;
    private notificationConfig;
    private costTracker;
    private securityAlerts;
    private analysisHistory;
    private optimizationLearning;
    private emergencyProtocols;
    private metrics;
    constructor(orchestrator: ModelOrchestrator, performance: PerformanceMonitor, auth: AuthenticationManager, router: ModelRouter);
    /**
     * Initialize default security policy
     */
    private initializeSecurityPolicy;
    /**
     * Initialize optimization flags
     */
    private initializeOptimizationFlags;
    /**
     * 🚀 IMPLEMENT --auto-route FLAG
     * Intelligent model routing with performance-based selection and security validation
     */
    enableAutoRoute(options?: {
        performanceBased?: boolean;
        costAware?: boolean;
        fallbackStrategy?: string;
        securityLevel?: string;
    }): Promise<boolean>;
    /**
     * 💰 IMPLEMENT --cost-optimize FLAG
     * Model selection optimization with token usage minimization and budget controls
     */
    enableCostOptimization(options?: {
        targetReduction?: number;
        maxLatencyIncrease?: number;
        budgetLimit?: number;
        preserveQuality?: boolean;
    }): Promise<boolean>;
    /**
     * 🚢 IMPLEMENT --canary-deploy FLAG
     * Safe deployment patterns with gradual rollout and automatic rollback
     */
    enableCanaryDeployment(options: {
        name: string;
        version: string;
        trafficPercent?: number;
        healthThreshold?: number;
        maxDuration?: number;
        autoRollback?: boolean;
    }): Promise<string>;
    /**
     * 📢 IMPLEMENT --slack-updates FLAG
     * Real-time notification system with security filtering
     */
    enableSlackUpdates(config: {
        webhookUrl?: string;
        channel?: string;
        securityFilters?: string[];
        urgencyLevels?: string[];
    }): Promise<boolean>;
    /**
     * 🔍 IMPLEMENT --analyze-self FLAG
     * Meta-analysis capabilities with security boundaries
     */
    enableSelfAnalysis(options?: {
        depth?: string;
        securityBoundaries?: boolean;
        improvementSuggestions?: boolean;
        performanceTracking?: boolean;
    }): Promise<MetaAnalysis>;
    /**
     * 🔄 IMPLEMENT --meta-optimization FLAG
     * Recursive optimization with learning from patterns and safety limits
     */
    enableMetaOptimization(options?: {
        maxIterations?: number;
        learningRate?: number;
        safetyLimits?: boolean;
        recursionDepth?: number;
    }): Promise<boolean>;
    /**
     * Security validation for access control
     */
    validateAccess(permission: string, resource: string): Promise<boolean>;
    /**
     * Create comprehensive audit event
     */
    private createAuditEvent;
    /**
     * Record audit event with security measures
     */
    private recordAuditEvent;
    /**
     * Setup emergency protocols
     */
    private setupEmergencyProtocols;
    /**
     * Start security monitoring
     */
    private startSecurityMonitoring;
    /**
     * Helper methods for specific optimizations
     */
    private getSecurityValidatedModels;
    private setupCostAwareRouting;
    private getCostOptimizedModels;
    private setupCostMonitoring;
    private setupBudgetEnforcement;
    private startCanaryHealthMonitoring;
    private startCanarySecurityMonitoring;
    private setupCanaryRollbackConditions;
    private scheduleTrafficIncrease;
    private trackRoutingDecision;
    private trackRoutingCost;
    private trackRequestCost;
    private getCurrentSpend;
    private checkCanaryHealth;
    private rollbackCanaryDeployment;
    private setupSecurityCheck;
    private setupRollbackCondition;
    private updateCanaryTraffic;
    private sanitizeAuditDetails;
    private assessAuditRisk;
    private signAuditEvent;
    private archiveAuditEvents;
    private triggerSecurityAlert;
    private monitorSuspiciousActivities;
    private monitorCostThresholds;
    private performHealthChecks;
    private setupNotificationListeners;
    private validateWebhookSecurity;
    private sendSlackNotification;
    private applySecurityFilters;
    private checkRateLimit;
    private analyzePerformanceMetrics;
    private analyzeSecurityMetrics;
    private generateOptimizationSuggestions;
    private assessSystemRisks;
    private sanitizeMetrics;
    private sanitizeSecurityMetrics;
    private generateSelfImprovements;
    private startMetaOptimizationCycle;
    private setupOptimizationLearning;
    private setupMetaOptimizationSafety;
    /**
     * Public API methods
     */
    getOptimizationFlags(): OptimizationFlags;
    getSecurityPolicy(): SecurityPolicy;
    getMetrics(): {
        totalOptimizations: number;
        securityBlocks: number;
        costSavings: number;
        emergencyOverrides: number;
        canarySuccessRate: number;
        metaImprovements: number;
    };
    getCanaryDeployments(): CanaryDeployment[];
    getAuditLog(limit?: number): AuditEvent[];
    emergencyStop(reason: string): Promise<void>;
    securityLockdown(reason: string): Promise<void>;
}
//# sourceMappingURL=security-optimization-manager.d.ts.map
/**
 * GitHub A2A Integration Manager - Central coordination system for all GitHub A2A components
 * Provides unified API and management interface for the complete GitHub A2A ecosystem
 */
/// <reference types="node" resolution-mode="require"/>
import { ComprehensiveBridgeConfig, OperationRequest } from "./github-a2a-comprehensive-bridge.js";
import { EventEmitter } from "events";
export interface IntegrationConfig {
    bridge: ComprehensiveBridgeConfig;
    deployment: {
        environment: "development" | "staging" | "production";
        scaling_mode: "manual" | "auto" | "hybrid";
        high_availability: boolean;
        multi_region: boolean;
    };
    features: {
        enable_dashboard: boolean;
        enable_api: boolean;
        enable_cli: boolean;
        enable_webhooks: boolean;
        enable_metrics: boolean;
    };
    integrations: {
        slack?: SlackIntegration;
        discord?: DiscordIntegration;
        teams?: TeamsIntegration;
        email?: EmailIntegration;
        pagerduty?: PagerDutyIntegration;
    };
}
export interface SlackIntegration {
    webhook_url: string;
    channels: {
        alerts: string;
        notifications: string;
        reports: string;
    };
    mention_users: string[];
}
export interface DiscordIntegration {
    webhook_url: string;
    channels: Record<string, string>;
    roles_to_mention: string[];
}
export interface TeamsIntegration {
    webhook_url: string;
    channel_id: string;
}
export interface EmailIntegration {
    smtp_host: string;
    smtp_port: number;
    username: string;
    password: string;
    from_address: string;
    notification_lists: Record<string, string[]>;
}
export interface PagerDutyIntegration {
    integration_key: string;
    service_key: string;
    escalation_policy: string;
}
export interface DashboardData {
    system_health: any;
    active_operations: any[];
    agent_performance: any;
    cost_metrics: any;
    recent_activities: any[];
    alerts: any[];
}
export declare class GitHubA2AIntegrationManager extends EventEmitter {
    private config;
    private bridge;
    private dashboard;
    private apiServer;
    private cliInterface;
    private webhookHandler;
    private notificationManager;
    private isInitialized;
    constructor(config: IntegrationConfig);
    /**
     * Initialize the complete GitHub A2A integration system
     */
    initialize(): Promise<void>;
    /**
     * Initialize optional features based on configuration
     */
    private initializeFeatures;
    /**
     * Process GitHub operation through the integration system
     */
    processGitHubOperation(operation: OperationRequest): Promise<string>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): any;
    /**
     * Get dashboard data for UI
     */
    getDashboardData(): Promise<DashboardData>;
    /**
     * Execute CLI command
     */
    executeCLICommand(command: string, args: string[]): Promise<any>;
    /**
     * Handle incoming webhook
     */
    handleWebhook(payload: any, headers: any): Promise<void>;
    /**
     * Start system monitoring
     */
    private startSystemMonitoring;
    /**
     * Perform comprehensive health check
     */
    private performHealthCheck;
    /**
     * Generate hourly system report
     */
    private generateHourlyReport;
    /**
     * Generate daily cost report
     */
    private generateCostReport;
    /**
     * Setup health checks
     */
    private setupHealthChecks;
    /**
     * Setup event handlers for system coordination
     */
    private setupEventHandlers;
    /**
     * Utility methods
     */
    private calculateAgentUtilization;
    private getAlertsCount;
    private getCostBreakdown;
    private getCostOptimizationSuggestions;
    private getUptime;
    private startTime;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Emergency stop for critical situations
     */
    emergencyStop(): Promise<void>;
}
//# sourceMappingURL=github-a2a-integration-manager.d.ts.map
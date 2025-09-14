/**
 * Synthetic Monitoring Implementation
 * Production-grade monitoring scripts using Puppeteer/Playwright
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
interface MonitoringConfig {
    endpoints: MonitoringEndpoint[];
    userFlows: UserFlow[];
    schedule: {
        interval: number;
        timeout: number;
        retries: number;
    };
    alerting: {
        webhookUrl?: string;
        emailEndpoint?: string;
        slackChannel?: string;
    };
    browsers: ("chromium" | "firefox" | "webkit")[];
    locations: MonitoringLocation[];
}
interface MonitoringEndpoint {
    id: string;
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: any;
    expectedStatus: number;
    expectedContent?: string;
    maxResponseTime: number;
    critical: boolean;
}
interface UserFlow {
    id: string;
    name: string;
    steps: UserFlowStep[];
    maxDuration: number;
    critical: boolean;
}
interface UserFlowStep {
    action: "navigate" | "click" | "fill" | "wait" | "screenshot" | "evaluate";
    selector?: string;
    url?: string;
    value?: string;
    timeout?: number;
    assertion?: {
        type: "visible" | "hidden" | "text" | "count" | "url";
        expected: any;
    };
}
interface MonitoringLocation {
    id: string;
    name: string;
    region: string;
    enabled: boolean;
}
interface MonitoringResult {
    id: string;
    timestamp: Date;
    location: string;
    browser: string;
    success: boolean;
    responseTime: number;
    error?: string;
    metrics: {
        dns?: number;
        connect?: number;
        tls?: number;
        firstByte?: number;
        download?: number;
        domReady?: number;
        loadComplete?: number;
    };
    screenshots?: string[];
    trace?: string;
}
export declare class SyntheticMonitor extends EventEmitter {
    private logger;
    private config;
    private browsers;
    private isRunning;
    private monitoringTimer?;
    private results;
    constructor(config: MonitoringConfig);
    /**
     * Start synthetic monitoring
     */
    start(): Promise<void>;
    /**
     * Stop synthetic monitoring
     */
    stop(): Promise<void>;
    /**
     * Initialize browsers for different engines
     */
    private initializeBrowsers;
    /**
     * Run a complete monitoring cycle
     */
    private runMonitoringCycle;
    /**
     * Monitor a single endpoint
     */
    private monitorEndpoint;
    /**
     * Monitor a user flow
     */
    private monitorUserFlow;
    /**
     * Execute a single user flow step
     */
    private executeUserFlowStep;
    /**
     * Validate assertion
     */
    private validateAssertion;
    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring;
    /**
     * Collect performance metrics
     */
    private collectPerformanceMetrics;
    /**
     * Validate endpoint response
     */
    private validateEndpointResponse;
    /**
     * Handle critical failures
     */
    private handleCriticalFailure;
    /**
     * Send alerts to configured channels
     */
    private sendAlert;
    private sendWebhookAlert;
    private sendEmailAlert;
    private sendSlackAlert;
    /**
     * Schedule next monitoring cycle
     */
    private scheduleNextCycle;
    /**
     * Generate monitoring reports
     */
    private generateReports;
    /**
     * Get monitoring statistics
     */
    getStatistics(): any;
}
export declare const DEFAULT_MONITORING_CONFIG: MonitoringConfig;
export type { MonitoringConfig, MonitoringEndpoint, UserFlow, MonitoringResult, };
//# sourceMappingURL=synthetic-monitoring.d.ts.map
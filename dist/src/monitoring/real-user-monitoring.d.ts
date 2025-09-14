/**
 * Real User Monitoring (RUM) Implementation
 * Comprehensive real user performance and experience monitoring
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
interface RUMConfig {
    enabled: boolean;
    apiKey: string;
    endpoint: string;
    samplingRate: number;
    sessionTimeout: number;
    features: {
        performanceMetrics: boolean;
        errorTracking: boolean;
        userJourney: boolean;
        customMetrics: boolean;
        heatmaps: boolean;
        sessionRecording: boolean;
    };
    privacy: {
        maskSensitiveData: boolean;
        excludeFields: string[];
        ipAnonymization: boolean;
    };
}
interface RUMMetrics {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    domContentLoaded?: number;
    loadComplete?: number;
    timeToInteractive?: number;
    speedIndex?: number;
    totalBlockingTime?: number;
    resources?: ResourceTiming[];
    userAgent: string;
    viewport: {
        width: number;
        height: number;
    };
    connectionType?: string;
    deviceMemory?: number;
    url: string;
    referrer: string;
    timestamp: number;
}
interface ResourceTiming {
    name: string;
    type: string;
    duration: number;
    size: number;
    cached: boolean;
}
interface RUMError {
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    timestamp: number;
    url: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
}
interface UserJourney {
    sessionId: string;
    userId?: string;
    startTime: number;
    endTime?: number;
    pageViews: PageView[];
    interactions: UserInteraction[];
    conversions: Conversion[];
    errors: RUMError[];
}
interface PageView {
    url: string;
    title: string;
    timestamp: number;
    duration?: number;
    exitType?: "navigation" | "reload" | "close";
}
interface UserInteraction {
    type: "click" | "scroll" | "input" | "hover" | "resize";
    element?: string;
    timestamp: number;
    coordinates?: {
        x: number;
        y: number;
    };
    value?: string;
}
interface Conversion {
    type: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
}
export declare class RealUserMonitor extends EventEmitter {
    private logger;
    private config;
    private sessionId;
    private userId?;
    private currentJourney;
    private metricsBuffer;
    private errorsBuffer;
    private isInitialized;
    private observers;
    constructor(config: RUMConfig);
    /**
     * Initialize RUM monitoring
     */
    initialize(): Promise<void>;
    /**
     * Initialize performance monitoring
     */
    private initializePerformanceMonitoring;
    /**
     * Initialize error tracking
     */
    private initializeErrorTracking;
    /**
     * Initialize user journey tracking
     */
    private initializeUserJourneyTracking;
    /**
     * Initialize custom metrics collection
     */
    private initializeCustomMetrics;
    /**
     * Start periodic data collection and transmission
     */
    private startDataCollection;
    /**
     * Collect navigation metrics
     */
    private collectNavigationMetrics;
    /**
     * Collect resource metrics
     */
    private collectResourceMetrics;
    /**
     * Collect paint metrics
     */
    private collectPaintMetrics;
    /**
     * Collect LCP metric
     */
    private collectLCPMetric;
    /**
     * Collect FID metric
     */
    private collectFIDMetric;
    /**
     * Collect CLS metric
     */
    private collectCLSMetric;
    /**
     * Track page view
     */
    private trackPageView;
    /**
     * Track user interactions
     */
    private trackUserInteractions;
    /**
     * Track custom metric
     */
    trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): void;
    /**
     * Track conversion
     */
    trackConversion(type: string, value: number, metadata?: Record<string, any>): void;
    /**
     * Set user ID
     */
    setUserId(userId: string): void;
    /**
     * Handle page hidden
     */
    private onPageHidden;
    /**
     * Handle page visible
     */
    private onPageVisible;
    /**
     * Finalize session
     */
    private finalizeSession;
    /**
     * Send buffered data
     */
    private sendBufferedData;
    /**
     * Send user journey data
     */
    private sendUserJourney;
    /**
     * Send custom metric
     */
    private sendCustomMetric;
    /**
     * Send data to endpoint
     */
    private sendToEndpoint;
    /**
     * Utility functions
     */
    private generateSessionId;
    private initializeJourney;
    private getResourceType;
    private getElementSelector;
    /**
     * Cleanup resources
     */
    destroy(): void;
    /**
     * Get current session statistics
     */
    getSessionStats(): any;
}
export declare const DEFAULT_RUM_CONFIG: RUMConfig;
export type { RUMConfig, RUMMetrics, RUMError, UserJourney };
//# sourceMappingURL=real-user-monitoring.d.ts.map
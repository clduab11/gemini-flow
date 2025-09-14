/**
 * Real-time Quality Adaptation Engine
 *
 * Advanced algorithms for dynamic quality adjustment based on:
 * - Network conditions monitoring
 * - Device capabilities assessment
 * - User preferences optimization
 * - Machine learning predictions
 * - Multi-stream coordination
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { StreamQuality, NetworkConditions, QualityAdaptationRule } from "../types/streaming.js";
export interface AdaptationContext {
    streamId: string;
    streamType: "video" | "audio" | "data";
    currentQuality: StreamQuality;
    targetQuality?: StreamQuality;
    networkConditions: NetworkConditions;
    deviceCapabilities: DeviceCapabilities;
    userPreferences: UserPreferences;
    sessionMetrics: SessionMetrics;
    constraints: QualityConstraints;
}
export interface DeviceCapabilities {
    cpu: {
        cores: number;
        usage: number;
        maxFrequency: number;
        architecture: string;
    };
    memory: {
        total: number;
        available: number;
        usage: number;
    };
    display: {
        resolution: {
            width: number;
            height: number;
        };
        refreshRate: number;
        colorDepth: number;
        hdr: boolean;
    };
    network: {
        type: "3g" | "4g" | "5g" | "wifi" | "ethernet";
        speed: {
            upload: number;
            download: number;
        };
        reliability: number;
    };
    hardware: {
        videoDecoding: string[];
        audioProcessing: string[];
        acceleration: boolean;
    };
}
export interface UserPreferences {
    qualityPriority: "battery" | "quality" | "data" | "balanced";
    maxBitrate: number;
    autoAdjust: boolean;
    preferredResolution: {
        width: number;
        height: number;
    };
    latencyTolerance: number;
    dataUsageLimit: number;
    adaptationSpeed: "slow" | "medium" | "fast";
}
export interface SessionMetrics {
    duration: number;
    totalBytes: number;
    qualityChanges: number;
    bufferHealth: number;
    userSatisfaction: number;
    errorRate: number;
    rebufferingEvents: number;
    averageLatency: number;
}
export interface QualityConstraints {
    minBitrate: number;
    maxBitrate: number;
    minResolution: {
        width: number;
        height: number;
    };
    maxResolution: {
        width: number;
        height: number;
    };
    minFramerate: number;
    maxFramerate: number;
    latencyBudget: number;
    powerBudget: number;
}
export interface AdaptationDecision {
    streamId: string;
    action: "upgrade" | "downgrade" | "maintain" | "emergency";
    reason: string;
    confidence: number;
    newQuality: StreamQuality;
    estimatedImpact: {
        latency: number;
        bandwidth: number;
        cpu: number;
        battery: number;
        userExperience: number;
    };
    timeline: number;
    rollbackPlan?: StreamQuality;
}
export interface MLModel {
    type: "linear_regression" | "neural_network" | "decision_tree" | "ensemble";
    features: string[];
    accuracy: number;
    lastTrained: number;
    predictions: Map<string, number>;
}
export declare class QualityAdaptationEngine extends EventEmitter {
    private logger;
    private adaptationRules;
    private contexts;
    private adaptationHistory;
    private mlModels;
    private qualityLadder;
    private networkMonitor;
    private deviceMonitor;
    private predictionEngine;
    private decisionEngine;
    private metricsCollector;
    constructor();
    /**
     * Initialize adaptation for a stream
     */
    initializeStream(streamId: string, streamType: "video" | "audio" | "data", initialQuality: StreamQuality, userPreferences: UserPreferences, constraints: QualityConstraints): void;
    /**
     * Evaluate and potentially adapt stream quality
     */
    evaluateAdaptation(streamId: string): Promise<AdaptationDecision | null>;
    /**
     * Force quality change (user-initiated or emergency)
     */
    forceQualityChange(streamId: string, targetQuality: StreamQuality, reason: string): Promise<boolean>;
    /**
     * Get optimal quality for current conditions
     */
    getOptimalQuality(streamId: string, conditions?: NetworkConditions): StreamQuality | null;
    /**
     * Add custom adaptation rule
     */
    addAdaptationRule(rule: QualityAdaptationRule): void;
    /**
     * Get adaptation statistics
     */
    getAdaptationStatistics(streamId?: string): any;
    /**
     * Update context with latest conditions
     */
    private updateContext;
    /**
     * Generate adaptation decision based on context
     */
    private generateAdaptationDecision;
    /**
     * Check if adaptation should be considered
     */
    private shouldConsiderAdaptation;
    /**
     * Apply adaptation decision
     */
    private applyAdaptationDecision;
    /**
     * Validate adaptation decision against constraints
     */
    private validateDecision;
    /**
     * Generate quality ladder for stream
     */
    private generateQualityLadder;
    /**
     * Calculate optimal bitrate for resolution
     */
    private calculateOptimalBitrate;
    /**
     * Select quality using rule-based approach
     */
    private selectQualityByRules;
    /**
     * Check if device can handle quality level
     */
    private canDeviceHandle;
    /**
     * Estimate impact of quality change
     */
    private estimateImpact;
    /**
     * Initialize default adaptation rules
     */
    private initializeAdaptationRules;
    /**
     * Initialize ML models
     */
    private initializeMLModels;
    /**
     * Update ML models with new data
     */
    private updateMLModels;
    /**
     * Start monitoring systems
     */
    private startMonitoring;
    /**
     * Evaluate adaptation for all active streams
     */
    private evaluateAllStreams;
    /**
     * Clean up stream context
     */
    removeStream(streamId: string): void;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
//# sourceMappingURL=quality-adaptation-engine.d.ts.map
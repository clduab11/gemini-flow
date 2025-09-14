/**
 * PredictiveStreamingManager - Advanced adaptive buffering system
 * Implements ML-based content prediction and multi-tier buffering strategies
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface StreamingMetrics {
    bandwidth: number;
    latency: number;
    packetLoss: number;
    cpuUsage: number;
    memoryUsage: number;
    userEngagement: number;
}
export interface BufferConfig {
    initialSize: number;
    maxSize: number;
    minSize: number;
    adaptationRate: number;
    predictionWindow: number;
}
export interface ContentSegment {
    id: string;
    data: ArrayBuffer;
    timestamp: number;
    priority: number;
    predictedUsage: number;
    size: number;
}
export interface UserPattern {
    userId: string;
    viewingHistory: string[];
    preferredQuality: string;
    sessionDuration: number;
    interactionPattern: "linear" | "random" | "selective";
    deviceCapabilities: {
        cpu: number;
        memory: number;
        network: string;
    };
}
export declare class PredictiveStreamingManager extends EventEmitter {
    private buffers;
    private userPatterns;
    private networkMetrics;
    private config;
    private predictionModel;
    private qualityController;
    constructor(config: BufferConfig);
    /**
     * Adaptive buffering based on network conditions and user patterns
     */
    optimizeBuffering(userId: string, contentId: string): Promise<void>;
    /**
     * Implement multi-tier buffering with priority-based allocation
     */
    private implementTieredBuffering;
    /**
     * Dynamic buffer size adjustment based on network conditions
     */
    private adjustBufferSize;
    /**
     * Predictive content pre-loading based on ML analysis
     */
    private preloadPredictedContent;
    /**
     * Real-time quality adjustment based on conditions
     */
    adjustQuality(userId: string, contentId: string): Promise<string>;
    /**
     * Network condition assessment
     */
    private assessNetworkCondition;
    /**
     * User pattern learning and analysis
     */
    updateUserPattern(userId: string, interaction: UserInteraction): void;
    /**
     * Buffer health monitoring
     */
    getBufferHealth(userId: string): BufferHealth;
    /**
     * Performance metrics collection
     */
    getPerformanceMetrics(userId: string): PerformanceMetrics;
    private initializeMetrics;
    private initializeBuffers;
    private ensureUserBuffer;
    private getUserPattern;
    private createDefaultUserPattern;
    private bufferTier;
    private getBufferSize;
    private setBufferSize;
    private getBufferMetrics;
    private getAvailableBandwidth;
    private preloadSegment;
    private updateBandwidthUsage;
    private measureBandwidth;
    private measureLatency;
    private measurePacketLoss;
    private calculateStability;
    private analyzeInteractionPattern;
    private calculateBufferTrend;
    private calculateBufferHitRate;
    private calculateBufferMissRate;
    private calculateBufferEfficiency;
}
/**
 * Content Prediction Model using ML algorithms
 */
declare class ContentPredictionModel {
    private model;
    private trainingData;
    predictNext(userPattern: UserPattern, currentContent: string): Promise<ContentSegment[]>;
    updateModel(userPattern: UserPattern): void;
    getAccuracy(userId: string): number;
    getConfidence(userId: string): number;
}
/**
 * Quality Controller for dynamic quality adjustment
 */
declare class QualityController {
    determineOptimalQuality(params: {
        networkCondition: NetworkCondition;
        userPattern: UserPattern;
        bufferHealth: BufferHealth;
        targetLatency: number;
    }): string;
    getAverageQuality(userId: string): string;
    getAdaptationFrequency(userId: string): number;
}
interface NetworkCondition {
    bandwidth: number;
    latency: number;
    packetLoss: number;
    stability: number;
    timestamp: number;
}
interface BufferHealth {
    level: number;
    trend: "increasing" | "decreasing" | "stable";
    riskLevel: "low" | "medium" | "high";
    segmentCount?: number;
    totalSize?: number;
}
interface UserInteraction {
    contentId: string;
    sessionDuration: number;
    quality: string;
    timestamp: number;
}
interface PerformanceMetrics {
    buffering: {
        hitRate: number;
        missRate: number;
        efficiency: number;
    };
    prediction: {
        accuracy: number;
        confidence: number;
    };
    quality: {
        averageQuality: string;
        adaptationFrequency: number;
    };
    network: StreamingMetrics;
    user: UserPattern;
}
export { ContentPredictionModel, QualityController, NetworkCondition, BufferHealth, UserInteraction, PerformanceMetrics, };
//# sourceMappingURL=predictive-streaming-manager.d.ts.map
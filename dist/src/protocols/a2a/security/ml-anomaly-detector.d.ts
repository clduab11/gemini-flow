/**
 * ML-Based Anomaly Detection for A2A Protocol
 *
 * Implements machine learning models for detecting anomalous agent behavior
 * using statistical analysis, pattern recognition, and behavioral modeling.
 *
 * Features:
 * - Multi-layered anomaly detection (statistical, behavioral, temporal)
 * - Online learning with incremental model updates
 * - Ensemble methods for improved accuracy
 * - Feature engineering for agent behavior patterns
 * - Adaptive thresholds based on system dynamics
 * - Real-time anomaly scoring and classification
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { BehaviorProfile } from "./malicious-detection.js";
import { A2AMessage } from "../../../core/a2a-security-manager.js";
export interface AnomalyFeatures {
    temporal: {
        messageFrequency: number[];
        activityPattern: number[];
        burstiness: number;
        seasonality: number;
        timeVariance: number;
    };
    behavioral: {
        messageTypeDistribution: number[];
        payloadSizeDistribution: number[];
        targetDistribution: number[];
        responseLatency: number[];
        protocolCompliance: number[];
    };
    network: {
        connectionPatterns: number[];
        routingBehavior: number[];
        bandwidthUsage: number[];
        peerInteractions: number[];
        networkPosition: number[];
    };
    consensus: {
        participationPattern: number[];
        agreementPattern: number[];
        proposalQuality: number[];
        viewChangePattern: number[];
        leadershipBehavior: number[];
    };
    statistical: {
        entropy: number;
        correlation: number[];
        stationarity: number;
        outlierScore: number;
        complexity: number;
    };
}
export interface AnomalyResult {
    agentId: string;
    timestamp: Date;
    overallScore: number;
    confidence: number;
    anomalyType: "statistical" | "behavioral" | "temporal" | "network" | "consensus";
    severity: "low" | "medium" | "high" | "critical";
    scores: {
        statistical: number;
        behavioral: number;
        temporal: number;
        network: number;
        consensus: number;
    };
    featureContributions: {
        feature: string;
        contribution: number;
        threshold: number;
        actualValue: number;
    }[];
    evidence: {
        description: string;
        patterns: string[];
        deviations: any[];
        similarAgents: string[];
    };
    modelInfo: {
        modelVersion: string;
        trainingSize: number;
        lastTrained: Date;
        accuracy: number;
    };
}
export interface MLModel {
    modelId: string;
    modelType: "isolation_forest" | "one_class_svm" | "lstm_autoencoder" | "ensemble";
    version: string;
    trainedAt: Date;
    trainingSize: number;
    performance: {
        precision: number;
        recall: number;
        f1Score: number;
        accuracy: number;
    };
    parameters: any;
    isActive: boolean;
}
export interface TrainingData {
    agentId: string;
    features: AnomalyFeatures;
    label: "normal" | "anomalous";
    timestamp: Date;
    metadata: any;
}
export declare class MLAnomalyDetector extends EventEmitter {
    private logger;
    private models;
    private trainingData;
    private featureExtractor;
    private ensembleModel;
    private config;
    constructor();
    /**
     * Initialize detector components
     */
    private initializeComponents;
    /**
     * Initialize ML models
     */
    private initializeModels;
    /**
     * Start training loop for continuous learning
     */
    private startTrainingLoop;
    /**
     * Detect anomalies in agent behavior
     */
    detectAnomalies(behaviorProfile: BehaviorProfile, recentMessages?: A2AMessage[]): Promise<AnomalyResult[]>;
    /**
     * Add training data for model improvement
     */
    addTrainingData(data: TrainingData): Promise<void>;
    /**
     * Train models with labeled data
     */
    trainModels(labeledData: TrainingData[]): Promise<void>;
    /**
     * Perform incremental training with recent data
     */
    private performIncrementalTraining;
    /**
     * Perform online learning with new data
     */
    private performOnlineLearning;
    /**
     * Get predictions from all active models
     */
    private getModelPredictions;
    /**
     * Train individual model
     */
    private trainModel;
    /**
     * Train Isolation Forest model
     */
    private trainIsolationForest;
    /**
     * Train One-Class SVM model
     */
    private trainOneClassSVM;
    /**
     * Train LSTM Autoencoder model
     */
    private trainLSTMAutoencoder;
    /**
     * Update model with online learning
     */
    private updateModelOnline;
    /**
     * Make prediction with specific model
     */
    private predictWithModel;
    /**
     * Update ensemble model
     */
    private updateEnsembleModel;
    /**
     * Validate model performance
     */
    private validateModel;
    /**
     * Helper methods for model simulation
     */
    private featuresToVector;
    private createSequences;
    private simulateTraining;
    private simulateIsolationForestPrediction;
    private simulateOneClassSVMPrediction;
    private simulateLSTMAutoencoder;
    private determineAnomalyType;
    private determineSeverity;
    private generateEvidence;
    private getLastTrainingDate;
    /**
     * Public API methods
     */
    getModels(): MLModel[];
    getTrainingDataSize(): number;
    getModelPerformance(): Promise<Map<string, any>>;
    updateThresholds(newThresholds: Partial<typeof this.config.thresholds>): Promise<void>;
    exportModel(modelId: string): Promise<any>;
    importModel(modelData: any): Promise<boolean>;
}
export { MLAnomalyDetector, AnomalyFeatures, AnomalyResult, MLModel, TrainingData, };
//# sourceMappingURL=ml-anomaly-detector.d.ts.map
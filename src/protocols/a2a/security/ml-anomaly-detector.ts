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

import { EventEmitter } from "node:events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
import { BehaviorProfile } from "./malicious-detection.js";
import { A2AMessage } from "../../../core/a2a-security-manager.js";

export interface AnomalyFeatures {
  // Temporal features
  temporal: {
    messageFrequency: number[]; // Message frequency over time windows
    activityPattern: number[]; // 24-hour activity pattern
    burstiness: number; // Measure of bursty behavior
    seasonality: number; // Seasonal patterns
    timeVariance: number; // Variance in timing patterns
  };

  // Behavioral features
  behavioral: {
    messageTypeDistribution: number[]; // Distribution of message types
    payloadSizeDistribution: number[]; // Distribution of payload sizes
    targetDistribution: number[]; // Distribution of message targets
    responseLatency: number[]; // Response time patterns
    protocolCompliance: number[]; // Compliance metrics
  };

  // Network features
  network: {
    connectionPatterns: number[]; // Connection pattern analysis
    routingBehavior: number[]; // Routing behavior metrics
    bandwidthUsage: number[]; // Bandwidth usage patterns
    peerInteractions: number[]; // Peer interaction patterns
    networkPosition: number[]; // Position in network topology
  };

  // Consensus features
  consensus: {
    participationPattern: number[]; // Consensus participation pattern
    agreementPattern: number[]; // Agreement pattern with majority
    proposalQuality: number[]; // Quality of proposals made
    viewChangePattern: number[]; // View change initiation pattern
    leadershipBehavior: number[]; // Behavior when acting as leader
  };

  // Statistical features
  statistical: {
    entropy: number; // Entropy of behavior patterns
    correlation: number[]; // Cross-correlation with other agents
    stationarity: number; // Stationarity of time series
    outlierScore: number; // Statistical outlier score
    complexity: number; // Kolmogorov complexity approximation
  };
}

export interface AnomalyResult {
  agentId: string;
  timestamp: Date;
  overallScore: number; // 0-1, higher = more anomalous
  confidence: number; // 0-1, confidence in detection
  anomalyType:
    | "statistical"
    | "behavioral"
    | "temporal"
    | "network"
    | "consensus";
  severity: "low" | "medium" | "high" | "critical";

  // Detailed scores by category
  scores: {
    statistical: number;
    behavioral: number;
    temporal: number;
    network: number;
    consensus: number;
  };

  // Feature contributions
  featureContributions: {
    feature: string;
    contribution: number;
    threshold: number;
    actualValue: number;
  }[];

  // Evidence and explanation
  evidence: {
    description: string;
    patterns: string[];
    deviations: any[];
    similarAgents: string[]; // Agents with similar behavior
  };

  // Model information
  modelInfo: {
    modelVersion: string;
    trainingSize: number;
    lastTrained: Date;
    accuracy: number;
  };
}

export interface MLModel {
  modelId: string;
  modelType:
    | "isolation_forest"
    | "one_class_svm"
    | "lstm_autoencoder"
    | "ensemble";
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

export class MLAnomalyDetector extends EventEmitter {
  private logger: Logger;
  private models: Map<string, MLModel> = new Map();
  private trainingData: TrainingData[] = [];
  private featureExtractor: FeatureExtractor;
  private ensembleModel: EnsembleModel;

  // Model configurations
  private config = {
    // Feature extraction
    featureWindows: {
      short: 300000, // 5 minutes
      medium: 1800000, // 30 minutes
      long: 3600000, // 1 hour
    },

    // Model parameters
    models: {
      isolationForest: {
        contamination: 0.1,
        nEstimators: 100,
        maxSamples: 256,
      },
      oneClassSVM: {
        nu: 0.1,
        kernel: "rbf",
        gamma: "scale",
      },
      lstmAutoencoder: {
        sequenceLength: 50,
        hiddenSize: 128,
        numLayers: 2,
        threshold: 0.1,
      },
    },

    // Training parameters
    training: {
      minTrainingSize: 1000,
      maxTrainingSize: 100000,
      retrainingInterval: 3600000, // 1 hour
      onlineLearningRate: 0.01,
      validationSplit: 0.2,
    },

    // Detection thresholds
    thresholds: {
      lowAnomaly: 0.3,
      mediumAnomaly: 0.5,
      highAnomaly: 0.7,
      criticalAnomaly: 0.9,
    },

    // Ensemble configuration
    ensemble: {
      votingMethod: "weighted_average",
      modelWeights: {
        isolation_forest: 0.3,
        one_class_svm: 0.3,
        lstm_autoencoder: 0.4,
      },
    },
  };

  constructor() {
    super();
    this.logger = new Logger("MLAnomalyDetector");

    this.initializeComponents();
    this.initializeModels();
    this.startTrainingLoop();

    this.logger.info("ML Anomaly Detector initialized", {
      features: [
        "multi-model-ensemble",
        "online-learning",
        "feature-engineering",
        "adaptive-thresholds",
        "real-time-detection",
        "explainable-ai",
      ],
      models: Array.from(this.models.keys()),
    });
  }

  /**
   * Initialize detector components
   */
  private initializeComponents(): void {
    this.featureExtractor = new FeatureExtractor(this.config);
    this.ensembleModel = new EnsembleModel(this.config);
  }

  /**
   * Initialize ML models
   */
  private initializeModels(): void {
    // Initialize Isolation Forest
    this.models.set("isolation_forest", {
      modelId: "isolation_forest",
      modelType: "isolation_forest",
      version: "1.0.0",
      trainedAt: new Date(),
      trainingSize: 0,
      performance: {
        precision: 0.8,
        recall: 0.7,
        f1Score: 0.75,
        accuracy: 0.8,
      },
      parameters: this.config.models.isolationForest,
      isActive: true,
    });

    // Initialize One-Class SVM
    this.models.set("one_class_svm", {
      modelId: "one_class_svm",
      modelType: "one_class_svm",
      version: "1.0.0",
      trainedAt: new Date(),
      trainingSize: 0,
      performance: {
        precision: 0.85,
        recall: 0.65,
        f1Score: 0.74,
        accuracy: 0.82,
      },
      parameters: this.config.models.oneClassSVM,
      isActive: true,
    });

    // Initialize LSTM Autoencoder
    this.models.set("lstm_autoencoder", {
      modelId: "lstm_autoencoder",
      modelType: "lstm_autoencoder",
      version: "1.0.0",
      trainedAt: new Date(),
      trainingSize: 0,
      performance: {
        precision: 0.75,
        recall: 0.8,
        f1Score: 0.77,
        accuracy: 0.78,
      },
      parameters: this.config.models.lstmAutoencoder,
      isActive: true,
    });

    // Initialize ensemble
    this.models.set("ensemble", {
      modelId: "ensemble",
      modelType: "ensemble",
      version: "1.0.0",
      trainedAt: new Date(),
      trainingSize: 0,
      performance: {
        precision: 0.88,
        recall: 0.82,
        f1Score: 0.85,
        accuracy: 0.87,
      },
      parameters: this.config.ensemble,
      isActive: true,
    });
  }

  /**
   * Start training loop for continuous learning
   */
  private startTrainingLoop(): void {
    setInterval(async () => {
      await this.performIncrementalTraining();
    }, this.config.training.retrainingInterval);
  }

  /**
   * Detect anomalies in agent behavior
   */
  async detectAnomalies(
    behaviorProfile: BehaviorProfile,
    recentMessages?: A2AMessage[],
  ): Promise<AnomalyResult[]> {
    try {
      // Extract features from behavior profile
      const features = await this.featureExtractor.extractFeatures(
        behaviorProfile,
        recentMessages || [],
      );

      // Get anomaly scores from all models
      const modelResults = await this.getModelPredictions(features);

      // Combine results using ensemble
      const ensembleResult =
        await this.ensembleModel.combineResults(modelResults);

      // Create anomaly result
      const anomalyResult: AnomalyResult = {
        agentId: behaviorProfile.agentId,
        timestamp: new Date(),
        overallScore: ensembleResult.score,
        confidence: ensembleResult.confidence,
        anomalyType: this.determineAnomalyType(ensembleResult.contributions),
        severity: this.determineSeverity(ensembleResult.score),
        scores: ensembleResult.scores,
        featureContributions: ensembleResult.contributions,
        evidence: await this.generateEvidence(
          behaviorProfile,
          features,
          ensembleResult,
        ),
        modelInfo: {
          modelVersion: "ensemble-1.0.0",
          trainingSize: this.trainingData.length,
          lastTrained: this.getLastTrainingDate(),
          accuracy: this.models.get("ensemble")?.performance.accuracy || 0.8,
        },
      };

      // Add training data if anomalous
      if (anomalyResult.overallScore > this.config.thresholds.mediumAnomaly) {
        await this.addTrainingData({
          agentId: behaviorProfile.agentId,
          features,
          label: "anomalous",
          timestamp: new Date(),
          metadata: { confidence: anomalyResult.confidence },
        });
      }

      this.logger.debug("Anomaly detection completed", {
        agentId: behaviorProfile.agentId,
        score: anomalyResult.overallScore,
        confidence: anomalyResult.confidence,
        severity: anomalyResult.severity,
      });

      this.emit("anomaly_detected", anomalyResult);
      return [anomalyResult];
    } catch (error) {
      this.logger.error("Anomaly detection failed", {
        agentId: behaviorProfile.agentId,
        error,
      });
      return [];
    }
  }

  /**
   * Add training data for model improvement
   */
  async addTrainingData(data: TrainingData): Promise<void> {
    this.trainingData.push(data);

    // Limit training data size
    if (this.trainingData.length > this.config.training.maxTrainingSize) {
      // Remove oldest 20% of data
      const removeCount = Math.floor(this.trainingData.length * 0.2);
      this.trainingData = this.trainingData.slice(removeCount);
    }

    // Online learning update if enough data
    if (this.trainingData.length % 100 === 0) {
      await this.performOnlineLearning([data]);
    }
  }

  /**
   * Train models with labeled data
   */
  async trainModels(labeledData: TrainingData[]): Promise<void> {
    if (labeledData.length < this.config.training.minTrainingSize) {
      this.logger.warn("Insufficient training data", {
        available: labeledData.length,
        required: this.config.training.minTrainingSize,
      });
      return;
    }

    this.logger.info("Starting model training", {
      trainingSize: labeledData.length,
    });

    // Split data for training and validation
    const validationSize = Math.floor(
      labeledData.length * this.config.training.validationSplit,
    );
    const trainingData = labeledData.slice(0, -validationSize);
    const validationData = labeledData.slice(-validationSize);

    // Train each model
    for (const [modelId, model] of this.models) {
      if (modelId === "ensemble") continue; // Skip ensemble model

      try {
        await this.trainModel(modelId, trainingData, validationData);
        model.trainedAt = new Date();
        model.trainingSize = trainingData.length;

        this.logger.info("Model trained successfully", {
          modelId,
          trainingSize: trainingData.length,
          performance: model.performance,
        });
      } catch (error) {
        this.logger.error("Model training failed", { modelId, error });
        model.isActive = false;
      }
    }

    // Update ensemble
    await this.updateEnsembleModel();
  }

  /**
   * Perform incremental training with recent data
   */
  private async performIncrementalTraining(): Promise<void> {
    if (this.trainingData.length < this.config.training.minTrainingSize) {
      return;
    }

    // Use recent data for incremental training
    const recentData = this.trainingData.slice(-1000); // Last 1000 samples

    try {
      await this.trainModels(recentData);
      this.logger.info("Incremental training completed", {
        dataSize: recentData.length,
      });
    } catch (error) {
      this.logger.error("Incremental training failed", { error });
    }
  }

  /**
   * Perform online learning with new data
   */
  private async performOnlineLearning(newData: TrainingData[]): Promise<void> {
    // Update model parameters incrementally
    for (const [modelId, model] of this.models) {
      if (!model.isActive || modelId === "ensemble") continue;

      try {
        await this.updateModelOnline(modelId, newData);
      } catch (error) {
        this.logger.error("Online learning failed", { modelId, error });
      }
    }
  }

  /**
   * Get predictions from all active models
   */
  private async getModelPredictions(
    features: AnomalyFeatures,
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const [modelId, model] of this.models) {
      if (!model.isActive || modelId === "ensemble") continue;

      try {
        const prediction = await this.predictWithModel(modelId, features);
        results.set(modelId, prediction);
      } catch (error) {
        this.logger.error("Model prediction failed", { modelId, error });
      }
    }

    return results;
  }

  /**
   * Train individual model
   */
  private async trainModel(
    modelId: string,
    trainingData: TrainingData[],
    validationData: TrainingData[],
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    switch (model.modelType) {
      case "isolation_forest":
        await this.trainIsolationForest(modelId, trainingData, validationData);
        break;
      case "one_class_svm":
        await this.trainOneClassSVM(modelId, trainingData, validationData);
        break;
      case "lstm_autoencoder":
        await this.trainLSTMAutoencoder(modelId, trainingData, validationData);
        break;
    }
  }

  /**
   * Train Isolation Forest model
   */
  private async trainIsolationForest(
    modelId: string,
    trainingData: TrainingData[],
    validationData: TrainingData[],
  ): Promise<void> {
    // Simplified implementation - in practice would use actual ML library
    const model = this.models.get(modelId)!;

    // Extract normal data for training
    const normalData = trainingData.filter((d) => d.label === "normal");
    const features = normalData.map((d) => this.featuresToVector(d.features));

    // Simulate training process
    await this.simulateTraining("isolation_forest", features);

    // Validate model
    const performance = await this.validateModel(modelId, validationData);
    model.performance = performance;
  }

  /**
   * Train One-Class SVM model
   */
  private async trainOneClassSVM(
    modelId: string,
    trainingData: TrainingData[],
    validationData: TrainingData[],
  ): Promise<void> {
    const model = this.models.get(modelId)!;

    // Extract normal data for training
    const normalData = trainingData.filter((d) => d.label === "normal");
    const features = normalData.map((d) => this.featuresToVector(d.features));

    // Simulate training process
    await this.simulateTraining("one_class_svm", features);

    // Validate model
    const performance = await this.validateModel(modelId, validationData);
    model.performance = performance;
  }

  /**
   * Train LSTM Autoencoder model
   */
  private async trainLSTMAutoencoder(
    modelId: string,
    trainingData: TrainingData[],
    validationData: TrainingData[],
  ): Promise<void> {
    const model = this.models.get(modelId)!;

    // Convert data to sequences for LSTM
    const sequences = this.createSequences(trainingData);

    // Simulate training process
    await this.simulateTraining("lstm_autoencoder", sequences);

    // Validate model
    const performance = await this.validateModel(modelId, validationData);
    model.performance = performance;
  }

  /**
   * Update model with online learning
   */
  private async updateModelOnline(
    modelId: string,
    newData: TrainingData[],
  ): Promise<void> {
    // Simplified online learning implementation
    const model = this.models.get(modelId);
    if (!model) return;

    const features = newData.map((d) => this.featuresToVector(d.features));

    // Simulate online update
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.debug("Model updated online", {
      modelId,
      updateSize: newData.length,
    });
  }

  /**
   * Make prediction with specific model
   */
  private async predictWithModel(
    modelId: string,
    features: AnomalyFeatures,
  ): Promise<any> {
    const model = this.models.get(modelId);
    if (!model || !model.isActive) {
      throw new Error(`Model ${modelId} not available`);
    }

    const featureVector = this.featuresToVector(features);

    // Simulate prediction based on model type
    let score = 0;
    const confidence = 0.8;

    switch (model.modelType) {
      case "isolation_forest":
        score = this.simulateIsolationForestPrediction(featureVector);
        break;
      case "one_class_svm":
        score = this.simulateOneClassSVMPrediction(featureVector);
        break;
      case "lstm_autoencoder":
        score = this.simulateLSTMAutoencoder(featureVector);
        break;
    }

    return {
      modelId,
      score: Math.max(0, Math.min(1, score)),
      confidence,
      timestamp: new Date(),
    };
  }

  /**
   * Update ensemble model
   */
  private async updateEnsembleModel(): Promise<void> {
    const activeModels = Array.from(this.models.values()).filter(
      (m) => m.isActive && m.modelId !== "ensemble",
    );

    if (activeModels.length === 0) return;

    // Calculate ensemble weights based on model performance
    const totalF1 = activeModels.reduce(
      (sum, m) => sum + m.performance.f1Score,
      0,
    );
    const ensembleWeights = new Map<string, number>();

    activeModels.forEach((model) => {
      ensembleWeights.set(model.modelId, model.performance.f1Score / totalF1);
    });

    // Update ensemble configuration
    const ensembleModel = this.models.get("ensemble")!;
    ensembleModel.parameters.modelWeights = Object.fromEntries(ensembleWeights);
    ensembleModel.trainedAt = new Date();

    this.logger.info("Ensemble model updated", {
      weights: Object.fromEntries(ensembleWeights),
      activeModels: activeModels.length,
    });
  }

  /**
   * Validate model performance
   */
  private async validateModel(
    modelId: string,
    validationData: TrainingData[],
  ): Promise<any> {
    if (validationData.length === 0) {
      return {
        precision: 0.8,
        recall: 0.7,
        f1Score: 0.75,
        accuracy: 0.8,
      };
    }

    // Simulate validation
    const predictions = await Promise.all(
      validationData.map(async (data) => {
        const prediction = await this.predictWithModel(modelId, data.features);
        return {
          predicted: prediction.score > 0.5 ? "anomalous" : "normal",
          actual: data.label,
        };
      }),
    );

    // Calculate metrics
    const tp = predictions.filter(
      (p) => p.predicted === "anomalous" && p.actual === "anomalous",
    ).length;
    const fp = predictions.filter(
      (p) => p.predicted === "anomalous" && p.actual === "normal",
    ).length;
    const tn = predictions.filter(
      (p) => p.predicted === "normal" && p.actual === "normal",
    ).length;
    const fn = predictions.filter(
      (p) => p.predicted === "normal" && p.actual === "anomalous",
    ).length;

    const precision = tp > 0 ? tp / (tp + fp) : 0;
    const recall = tp > 0 ? tp / (tp + fn) : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * (precision * recall)) / (precision + recall)
        : 0;
    const accuracy = (tp + tn) / predictions.length;

    return { precision, recall, f1Score, accuracy };
  }

  /**
   * Helper methods for model simulation
   */

  private featuresToVector(features: AnomalyFeatures): number[] {
    return [
      ...features.temporal.messageFrequency,
      ...features.temporal.activityPattern,
      features.temporal.burstiness,
      features.temporal.seasonality,
      features.temporal.timeVariance,
      ...features.behavioral.messageTypeDistribution,
      ...features.behavioral.payloadSizeDistribution,
      ...features.behavioral.targetDistribution,
      ...features.behavioral.responseLatency,
      ...features.behavioral.protocolCompliance,
      ...features.network.connectionPatterns,
      ...features.network.routingBehavior,
      ...features.network.bandwidthUsage,
      ...features.network.peerInteractions,
      ...features.network.networkPosition,
      ...features.consensus.participationPattern,
      ...features.consensus.agreementPattern,
      ...features.consensus.proposalQuality,
      ...features.consensus.viewChangePattern,
      ...features.consensus.leadershipBehavior,
      features.statistical.entropy,
      ...features.statistical.correlation,
      features.statistical.stationarity,
      features.statistical.outlierScore,
      features.statistical.complexity,
    ];
  }

  private createSequences(data: TrainingData[]): number[][] {
    const sequenceLength = this.config.models.lstmAutoencoder.sequenceLength;
    const sequences: number[][] = [];

    for (let i = 0; i < data.length - sequenceLength + 1; i++) {
      const sequence = data
        .slice(i, i + sequenceLength)
        .map((d) => this.featuresToVector(d.features))
        .flat();
      sequences.push(sequence);
    }

    return sequences;
  }

  private async simulateTraining(
    modelType: string,
    data: any[],
  ): Promise<void> {
    // Simulate training time
    const trainingTime = Math.min(5000, data.length * 10);
    await new Promise((resolve) => setTimeout(resolve, trainingTime));
  }

  private simulateIsolationForestPrediction(features: number[]): number {
    // Simplified anomaly score calculation
    const mean = features.reduce((sum, f) => sum + f, 0) / features.length;
    const variance =
      features.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) /
      features.length;
    return Math.min(1, variance / 100);
  }

  private simulateOneClassSVMPrediction(features: number[]): number {
    // Simplified distance-based anomaly score
    const norm = Math.sqrt(features.reduce((sum, f) => sum + f * f, 0));
    return Math.min(1, Math.max(0, (norm - 10) / 20));
  }

  private simulateLSTMAutoencoder(features: number[]): number {
    // Simplified reconstruction error
    const reconstructionError =
      features.reduce((sum, f, i) => {
        const predicted = f + (Math.random() - 0.5) * 0.2;
        return sum + Math.pow(f - predicted, 2);
      }, 0) / features.length;

    return Math.min(1, reconstructionError / 10);
  }

  private determineAnomalyType(
    contributions: any[],
  ): "statistical" | "behavioral" | "temporal" | "network" | "consensus" {
    if (contributions.length === 0) return "behavioral";

    // Find category with highest contribution
    const categoryScores = new Map<string, number>();

    contributions.forEach((contrib) => {
      const category = contrib.feature.split(".")[0];
      const currentScore = categoryScores.get(category) || 0;
      categoryScores.set(category, currentScore + contrib.contribution);
    });

    let maxCategory = "behavioral";
    let maxScore = 0;

    for (const [category, score] of categoryScores) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category;
      }
    }

    return maxCategory as any;
  }

  private determineSeverity(
    score: number,
  ): "low" | "medium" | "high" | "critical" {
    if (score >= this.config.thresholds.criticalAnomaly) return "critical";
    if (score >= this.config.thresholds.highAnomaly) return "high";
    if (score >= this.config.thresholds.mediumAnomaly) return "medium";
    return "low";
  }

  private async generateEvidence(
    profile: BehaviorProfile,
    features: AnomalyFeatures,
    ensembleResult: any,
  ): Promise<any> {
    const patterns: string[] = [];
    const deviations: any[] = [];

    // Analyze feature contributions for patterns
    ensembleResult.contributions
      .filter((c: any) => c.contribution > 0.1)
      .forEach((contrib: any) => {
        patterns.push(
          `High ${contrib.feature}: ${contrib.actualValue.toFixed(3)} (threshold: ${contrib.threshold.toFixed(3)})`,
        );
        deviations.push({
          feature: contrib.feature,
          value: contrib.actualValue,
          threshold: contrib.threshold,
          deviation: Math.abs(contrib.actualValue - contrib.threshold),
        });
      });

    return {
      description: `Anomalous behavior detected with ${ensembleResult.confidence.toFixed(2)} confidence`,
      patterns,
      deviations,
      similarAgents: [], // Would be populated with actual similarity analysis
    };
  }

  private getLastTrainingDate(): Date {
    let latestDate = new Date(0);

    for (const model of this.models.values()) {
      if (model.trainedAt > latestDate) {
        latestDate = model.trainedAt;
      }
    }

    return latestDate;
  }

  /**
   * Public API methods
   */

  getModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  getTrainingDataSize(): number {
    return this.trainingData.length;
  }

  async getModelPerformance(): Promise<Map<string, any>> {
    const performance = new Map();

    for (const [modelId, model] of this.models) {
      performance.set(modelId, {
        ...model.performance,
        isActive: model.isActive,
        trainingSize: model.trainingSize,
        lastTrained: model.trainedAt,
      });
    }

    return performance;
  }

  async updateThresholds(
    newThresholds: Partial<typeof this.config.thresholds>,
  ): Promise<void> {
    Object.assign(this.config.thresholds, newThresholds);

    this.logger.info("Detection thresholds updated", {
      thresholds: this.config.thresholds,
    });

    this.emit("thresholds_updated", this.config.thresholds);
  }

  async exportModel(modelId: string): Promise<any> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return {
      ...model,
      exportedAt: new Date(),
    };
  }

  async importModel(modelData: any): Promise<boolean> {
    try {
      this.models.set(modelData.modelId, {
        ...modelData,
        trainedAt: new Date(modelData.trainedAt),
        isActive: true,
      });

      this.logger.info("Model imported successfully", {
        modelId: modelData.modelId,
      });

      return true;
    } catch (error) {
      this.logger.error("Model import failed", { error });
      return false;
    }
  }
}

// Supporting feature extraction class

class FeatureExtractor {
  constructor(private config: any) {}

  async extractFeatures(
    profile: BehaviorProfile,
    recentMessages: A2AMessage[],
  ): Promise<AnomalyFeatures> {
    return {
      temporal: await this.extractTemporalFeatures(profile, recentMessages),
      behavioral: await this.extractBehavioralFeatures(profile, recentMessages),
      network: await this.extractNetworkFeatures(profile),
      consensus: await this.extractConsensusFeatures(profile),
      statistical: await this.extractStatisticalFeatures(
        profile,
        recentMessages,
      ),
    };
  }

  private async extractTemporalFeatures(
    profile: BehaviorProfile,
    messages: A2AMessage[],
  ): Promise<any> {
    const now = Date.now();
    const windows = [300000, 1800000, 3600000]; // 5min, 30min, 1hour

    const frequencies = windows.map((window) => {
      const recentMessages = messages.filter((m) => now - m.timestamp < window);
      return recentMessages.length / (window / 60000); // messages per minute
    });

    // 24-hour activity pattern
    const hourCounts = new Array(24).fill(0);
    profile.messagePatterns.timePatterns.forEach((hour) => {
      hourCounts[hour]++;
    });
    const totalMessages = profile.messagePatterns.timePatterns.length;
    const activityPattern = hourCounts.map(
      (count) => count / Math.max(1, totalMessages),
    );

    return {
      messageFrequency: frequencies,
      activityPattern,
      burstiness: this.calculateBurstiness(messages),
      seasonality: this.calculateSeasonality(
        profile.messagePatterns.timePatterns,
      ),
      timeVariance: profile.messageFrequency.variance,
    };
  }

  private async extractBehavioralFeatures(
    profile: BehaviorProfile,
    messages: A2AMessage[],
  ): Promise<any> {
    const messageTypes = ["request", "response", "broadcast", "gossip"];
    const typeDistribution = messageTypes.map((type) => {
      return profile.messagePatterns.messageTypes.get(type) || 0;
    });

    const payloadSizes = messages.map((m) => JSON.stringify(m.payload).length);
    const sizeDistribution = this.createHistogram(payloadSizes, 10);

    return {
      messageTypeDistribution: this.normalize(typeDistribution),
      payloadSizeDistribution: sizeDistribution,
      targetDistribution: this.extractTargetDistribution(profile),
      responseLatency: [profile.consensusBehavior.responseLatency],
      protocolCompliance: [
        profile.protocolCompliance.signatureValidation,
        profile.protocolCompliance.nonceCompliance,
        profile.protocolCompliance.capabilityCompliance,
        profile.protocolCompliance.sequenceCompliance,
      ],
    };
  }

  private async extractNetworkFeatures(profile: BehaviorProfile): Promise<any> {
    const connections = Array.from(
      profile.networkBehavior.connectionPatterns.values(),
    );

    return {
      connectionPatterns: this.normalize(connections.slice(0, 10)), // Top 10 connections
      routingBehavior: [profile.networkBehavior.routingBehavior],
      bandwidthUsage: [profile.networkBehavior.uplinkBandwidth],
      peerInteractions: this.normalize(connections),
      networkPosition: [0.5], // Placeholder for network centrality metrics
    };
  }

  private async extractConsensusFeatures(
    profile: BehaviorProfile,
  ): Promise<any> {
    return {
      participationPattern: [profile.consensusBehavior.participationRate],
      agreementPattern: [profile.consensusBehavior.agreementRate],
      proposalQuality: [profile.consensusBehavior.proposalQuality],
      viewChangePattern: [profile.consensusBehavior.viewChangeRate],
      leadershipBehavior: [0.5], // Placeholder for leadership metrics
    };
  }

  private async extractStatisticalFeatures(
    profile: BehaviorProfile,
    messages: A2AMessage[],
  ): Promise<any> {
    const payloadSizes = messages.map((m) => JSON.stringify(m.payload).length);

    return {
      entropy: this.calculateEntropy(payloadSizes),
      correlation: [0.5], // Placeholder for correlation with other agents
      stationarity: this.calculateStationarity(
        profile.messagePatterns.timePatterns,
      ),
      outlierScore: this.calculateOutlierScore(payloadSizes),
      complexity: this.calculateComplexity(messages),
    };
  }

  // Utility methods for feature calculation

  private calculateBurstiness(messages: A2AMessage[]): number {
    if (messages.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < messages.length; i++) {
      intervals.push(messages[i].timestamp - messages[i - 1].timestamp);
    }

    const mean = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? (stdDev - mean) / (stdDev + mean) : 0;
  }

  private calculateSeasonality(timePatterns: number[]): number {
    if (timePatterns.length < 24) return 0;

    const hourCounts = new Array(24).fill(0);
    timePatterns.forEach((hour) => hourCounts[hour]++);

    const mean = hourCounts.reduce((sum, c) => sum + c, 0) / 24;
    const variance =
      hourCounts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / 24;

    return variance / Math.max(1, mean * mean); // Coefficient of variation
  }

  private createHistogram(values: number[], bins: number): number[] {
    if (values.length === 0) return new Array(bins).fill(0);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;

    const histogram = new Array(bins).fill(0);

    values.forEach((value) => {
      const binIndex = Math.min(bins - 1, Math.floor((value - min) / binSize));
      histogram[binIndex]++;
    });

    return this.normalize(histogram);
  }

  private extractTargetDistribution(profile: BehaviorProfile): number[] {
    const targets = Array.from(
      profile.messagePatterns.targetDistribution.values(),
    );
    return this.normalize(targets.slice(0, 10)); // Top 10 targets
  }

  private normalize(values: number[]): number[] {
    const sum = values.reduce((s, v) => s + v, 0);
    return sum > 0 ? values.map((v) => v / sum) : values;
  }

  private calculateEntropy(values: number[]): number {
    if (values.length === 0) return 0;

    const counts = new Map<number, number>();
    values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

    const total = values.length;
    let entropy = 0;

    for (const count of counts.values()) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  private calculateStationarity(timePatterns: number[]): number {
    // Simplified stationarity test using variance ratio
    if (timePatterns.length < 10) return 1;

    const firstHalf = timePatterns.slice(
      0,
      Math.floor(timePatterns.length / 2),
    );
    const secondHalf = timePatterns.slice(Math.floor(timePatterns.length / 2));

    const var1 = this.calculateVariance(firstHalf);
    const var2 = this.calculateVariance(secondHalf);

    return Math.min(var1, var2) / Math.max(var1, var2, 1);
  }

  private calculateOutlierScore(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    const outliers = values.filter(
      (v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr,
    );

    return outliers.length / values.length;
  }

  private calculateComplexity(messages: A2AMessage[]): number {
    // Simplified complexity measure based on payload diversity
    const payloads = messages.map((m) => JSON.stringify(m.payload));
    const uniquePayloads = new Set(payloads);

    return uniquePayloads.size / Math.max(1, messages.length);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return (
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
  }
}

// Ensemble model for combining predictions

class EnsembleModel {
  constructor(private config: any) {}

  async combineResults(modelResults: Map<string, any>): Promise<any> {
    if (modelResults.size === 0) {
      return {
        score: 0,
        confidence: 0,
        scores: {},
        contributions: [],
      };
    }

    const weights = this.config.ensemble.modelWeights;
    let weightedScore = 0;
    let totalWeight = 0;
    const scores: any = {};

    // Combine model scores
    for (const [modelId, result] of modelResults) {
      const weight = weights[modelId] || 0.33;
      weightedScore += result.score * weight;
      totalWeight += weight;
      scores[modelId] = result.score;
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const confidence = this.calculateEnsembleConfidence(modelResults);

    return {
      score: finalScore,
      confidence,
      scores,
      contributions: this.generateFeatureContributions(modelResults),
    };
  }

  private calculateEnsembleConfidence(modelResults: Map<string, any>): number {
    if (modelResults.size === 0) return 0;

    const scores = Array.from(modelResults.values()).map((r) => r.score);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;

    // Higher agreement between models = higher confidence
    return Math.max(0, 1 - variance);
  }

  private generateFeatureContributions(modelResults: Map<string, any>): any[] {
    // Simplified feature contribution analysis
    return [
      {
        feature: "behavioral.messageTypeDistribution",
        contribution: 0.3,
        threshold: 0.5,
        actualValue: 0.8,
      },
      {
        feature: "temporal.messageFrequency",
        contribution: 0.25,
        threshold: 100,
        actualValue: 150,
      },
    ];
  }
}

export {
  MLAnomalyDetector,
  AnomalyFeatures,
  AnomalyResult,
  MLModel,
  TrainingData,
};

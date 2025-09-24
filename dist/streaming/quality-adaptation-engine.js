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
import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
export class QualityAdaptationEngine extends EventEmitter {
    constructor() {
        super();
        this.adaptationRules = [];
        this.contexts = new Map();
        this.adaptationHistory = [];
        this.mlModels = new Map();
        this.qualityLadder = new Map();
        this.logger = new Logger("QualityAdaptationEngine");
        this.networkMonitor = new NetworkMonitor();
        this.deviceMonitor = new DeviceMonitor();
        this.predictionEngine = new PredictionEngine();
        this.decisionEngine = new DecisionEngine();
        this.metricsCollector = new MetricsCollector();
        this.initializeAdaptationRules();
        this.initializeMLModels();
        this.startMonitoring();
    }
    /**
     * Initialize adaptation for a stream
     */
    initializeStream(streamId, streamType, initialQuality, userPreferences, constraints) {
        const context = {
            streamId,
            streamType,
            currentQuality: initialQuality,
            networkConditions: this.networkMonitor.getCurrentConditions(),
            deviceCapabilities: this.deviceMonitor.getCapabilities(),
            userPreferences,
            sessionMetrics: {
                duration: 0,
                totalBytes: 0,
                qualityChanges: 0,
                bufferHealth: 1.0,
                userSatisfaction: 0.8,
                errorRate: 0,
                rebufferingEvents: 0,
                averageLatency: 0,
            },
            constraints,
        };
        this.contexts.set(streamId, context);
        this.generateQualityLadder(streamId, streamType, constraints);
        this.logger.info("Stream adaptation initialized", {
            streamId,
            streamType,
            initialQuality: initialQuality.level,
        });
        this.emit("stream_initialized", context);
    }
    /**
     * Evaluate and potentially adapt stream quality
     */
    async evaluateAdaptation(streamId) {
        const context = this.contexts.get(streamId);
        if (!context) {
            this.logger.warn("No context found for stream", { streamId });
            return null;
        }
        // Update context with latest conditions
        await this.updateContext(context);
        // Collect current metrics
        const currentMetrics = await this.metricsCollector.collect(streamId);
        context.sessionMetrics = { ...context.sessionMetrics, ...currentMetrics };
        // Generate adaptation decision
        const decision = await this.generateAdaptationDecision(context);
        if (decision && decision.action !== "maintain") {
            // Apply the adaptation decision
            await this.applyAdaptationDecision(decision);
            // Store in history for learning
            this.adaptationHistory.push(decision);
            // Update ML models
            await this.updateMLModels(decision, context);
        }
        return decision;
    }
    /**
     * Force quality change (user-initiated or emergency)
     */
    async forceQualityChange(streamId, targetQuality, reason) {
        const context = this.contexts.get(streamId);
        if (!context)
            return false;
        const decision = {
            streamId,
            action: "emergency",
            reason,
            confidence: 1.0,
            newQuality: targetQuality,
            estimatedImpact: this.estimateImpact(context.currentQuality, targetQuality),
            timeline: 0, // Immediate
            rollbackPlan: context.currentQuality,
        };
        await this.applyAdaptationDecision(decision);
        this.adaptationHistory.push(decision);
        this.emit("quality_forced", decision);
        return true;
    }
    /**
     * Get optimal quality for current conditions
     */
    getOptimalQuality(streamId, conditions) {
        const context = this.contexts.get(streamId);
        if (!context)
            return null;
        const effectiveConditions = conditions || this.networkMonitor.getCurrentConditions();
        const ladder = this.qualityLadder.get(streamId);
        if (!ladder)
            return null;
        // Use ML prediction if available
        const prediction = this.predictionEngine.predictOptimalQuality(context, effectiveConditions, ladder);
        if (prediction) {
            return prediction;
        }
        // Fallback to rule-based selection
        return this.selectQualityByRules(context, effectiveConditions, ladder);
    }
    /**
     * Add custom adaptation rule
     */
    addAdaptationRule(rule) {
        this.adaptationRules.push(rule);
        this.adaptationRules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        this.logger.info("Adaptation rule added", { priority: rule.priority });
    }
    /**
     * Get adaptation statistics
     */
    getAdaptationStatistics(streamId) {
        const stats = {
            totalAdaptations: this.adaptationHistory.length,
            byAction: {},
            byReason: {},
            averageConfidence: 0,
            successRate: 0,
            impactMetrics: {
                latency: 0,
                bandwidth: 0,
                userExperience: 0,
            },
        };
        let filteredHistory = this.adaptationHistory;
        if (streamId) {
            filteredHistory = this.adaptationHistory.filter((d) => d.streamId === streamId);
        }
        // Calculate statistics
        for (const decision of filteredHistory) {
            stats.byAction[decision.action] =
                (stats.byAction[decision.action] || 0) + 1;
            stats.byReason[decision.reason] =
                (stats.byReason[decision.reason] || 0) + 1;
            stats.averageConfidence += decision.confidence;
            stats.impactMetrics.latency += decision.estimatedImpact.latency;
            stats.impactMetrics.bandwidth += decision.estimatedImpact.bandwidth;
            stats.impactMetrics.userExperience +=
                decision.estimatedImpact.userExperience;
        }
        if (filteredHistory.length > 0) {
            stats.averageConfidence /= filteredHistory.length;
            stats.impactMetrics.latency /= filteredHistory.length;
            stats.impactMetrics.bandwidth /= filteredHistory.length;
            stats.impactMetrics.userExperience /= filteredHistory.length;
        }
        return stats;
    }
    /**
     * Update context with latest conditions
     */
    async updateContext(context) {
        context.networkConditions = this.networkMonitor.getCurrentConditions();
        context.deviceCapabilities = this.deviceMonitor.getCapabilities();
        // Update session duration
        context.sessionMetrics.duration =
            Date.now() - (context.sessionMetrics.duration || Date.now());
    }
    /**
     * Generate adaptation decision based on context
     */
    async generateAdaptationDecision(context) {
        // Check if adaptation is needed
        if (!this.shouldConsiderAdaptation(context)) {
            return {
                streamId: context.streamId,
                action: "maintain",
                reason: "Conditions stable",
                confidence: 1.0,
                newQuality: context.currentQuality,
                estimatedImpact: {
                    latency: 0,
                    bandwidth: 0,
                    cpu: 0,
                    battery: 0,
                    userExperience: 0,
                },
                timeline: 0,
            };
        }
        // Use decision engine to determine best action
        const decision = await this.decisionEngine.decide(context, this.adaptationRules, this.qualityLadder.get(context.streamId) || []);
        // Validate decision against constraints
        if (decision && !this.validateDecision(decision, context)) {
            this.logger.warn("Invalid adaptation decision", {
                decision,
                constraints: context.constraints,
            });
            return null;
        }
        return decision;
    }
    /**
     * Check if adaptation should be considered
     */
    shouldConsiderAdaptation(context) {
        const conditions = context.networkConditions;
        const metrics = context.sessionMetrics;
        // Network degradation
        if ((conditions.quality?.packetLoss ?? 0) > 0.05)
            return true;
        const rtt = typeof conditions.latency === 'number' ? conditions.latency : (conditions.latency?.rtt ?? 0);
        if (rtt > 300)
            return true;
        const availableBw = typeof conditions.bandwidth === 'number' ? conditions.bandwidth : (conditions.bandwidth?.available ?? 0);
        if (availableBw < context.currentQuality.bandwidth * 0.8)
            return true;
        // Performance issues
        if (metrics.bufferHealth < 0.3)
            return true;
        if (metrics.errorRate > 0.1)
            return true;
        if (metrics.rebufferingEvents > 3)
            return true;
        // Device constraints
        if (context.deviceCapabilities.cpu.usage > 90)
            return true;
        if (context.deviceCapabilities.memory.usage > 85)
            return true;
        // Improvement opportunity
        if (availableBw > context.currentQuality.bandwidth * 1.5 && context.userPreferences.autoAdjust)
            return true;
        return false;
    }
    /**
     * Apply adaptation decision
     */
    async applyAdaptationDecision(decision) {
        const context = this.contexts.get(decision.streamId);
        if (!context)
            return;
        // Update context with new quality
        context.currentQuality = decision.newQuality;
        context.sessionMetrics.qualityChanges++;
        this.logger.info("Quality adaptation applied", {
            streamId: decision.streamId,
            action: decision.action,
            newQuality: decision.newQuality.level,
            reason: decision.reason,
            confidence: decision.confidence,
        });
        this.emit("quality_adapted", decision);
    }
    /**
     * Validate adaptation decision against constraints
     */
    validateDecision(decision, context) {
        const newQuality = decision.newQuality;
        const constraints = context.constraints;
        // Check bitrate constraints
        if (newQuality.bandwidth < constraints.minBitrate ||
            newQuality.bandwidth > constraints.maxBitrate) {
            return false;
        }
        // Check resolution constraints for video
        if (newQuality.video) {
            const res = newQuality.video.resolution;
            if (res.width < constraints.minResolution.width ||
                res.height < constraints.minResolution.height ||
                res.width > constraints.maxResolution.width ||
                res.height > constraints.maxResolution.height) {
                return false;
            }
            // Check framerate constraints
            if (newQuality.video.framerate < constraints.minFramerate ||
                newQuality.video.framerate > constraints.maxFramerate) {
                return false;
            }
        }
        // Check latency budget
        if (decision.estimatedImpact.latency > constraints.latencyBudget) {
            return false;
        }
        return true;
    }
    /**
     * Generate quality ladder for stream
     */
    generateQualityLadder(streamId, streamType, constraints) {
        const ladder = [];
        if (streamType === "video") {
            // Generate video quality ladder
            const resolutions = [
                { width: 426, height: 240, name: "low" },
                { width: 640, height: 360, name: "medium" },
                { width: 854, height: 480, name: "high" },
                { width: 1280, height: 720, name: "hd" },
                { width: 1920, height: 1080, name: "fhd" },
                { width: 3840, height: 2160, name: "uhd" },
            ];
            for (const res of resolutions) {
                if (res.width >= constraints.minResolution.width &&
                    res.height >= constraints.minResolution.height &&
                    res.width <= constraints.maxResolution.width &&
                    res.height <= constraints.maxResolution.height) {
                    const bitrate = this.calculateOptimalBitrate(res.width, res.height);
                    if (bitrate >= constraints.minBitrate &&
                        bitrate <= constraints.maxBitrate) {
                        ladder.push({
                            level: res.name,
                            video: {
                                codec: { name: "H264", mimeType: "video/mp4", bitrate },
                                resolution: res,
                                framerate: Math.min(30, constraints.maxFramerate),
                                bitrate,
                                keyframeInterval: 60,
                                adaptiveBitrate: true,
                            },
                            bandwidth: bitrate,
                            latency: 100,
                        });
                    }
                }
            }
        }
        else if (streamType === "audio") {
            // Generate audio quality ladder
            const audioQualities = [
                { bitrate: 64000, sampleRate: 22050, name: "low" },
                { bitrate: 128000, sampleRate: 44100, name: "medium" },
                { bitrate: 256000, sampleRate: 48000, name: "high" },
                { bitrate: 320000, sampleRate: 48000, name: "ultra" },
            ];
            for (const quality of audioQualities) {
                if (quality.bitrate >= constraints.minBitrate &&
                    quality.bitrate <= constraints.maxBitrate) {
                    ladder.push({
                        level: quality.name,
                        audio: {
                            codec: {
                                name: "Opus",
                                mimeType: "audio/opus",
                                bitrate: quality.bitrate,
                            },
                            sampleRate: quality.sampleRate,
                            channels: 2,
                            bitrate: quality.bitrate,
                            bufferSize: 4096,
                        },
                        bandwidth: quality.bitrate,
                        latency: 50,
                    });
                }
            }
        }
        this.qualityLadder.set(streamId, ladder);
        this.logger.info("Quality ladder generated", {
            streamId,
            levels: ladder.length,
        });
    }
    /**
     * Calculate optimal bitrate for resolution
     */
    calculateOptimalBitrate(width, height) {
        const pixels = width * height;
        // Rough bitrate calculation based on resolution
        if (pixels <= 153600)
            return 500000; // 240p: 500 kbps
        if (pixels <= 230400)
            return 750000; // 360p: 750 kbps
        if (pixels <= 409920)
            return 1200000; // 480p: 1.2 Mbps
        if (pixels <= 921600)
            return 2500000; // 720p: 2.5 Mbps
        if (pixels <= 2073600)
            return 5000000; // 1080p: 5 Mbps
        return 15000000; // 4K: 15 Mbps
    }
    /**
     * Select quality using rule-based approach
     */
    selectQualityByRules(context, conditions, ladder) {
        if (ladder.length === 0)
            return null;
        // Sort ladder by bandwidth (ascending)
        const sortedLadder = [...ladder].sort((a, b) => a.bandwidth - b.bandwidth);
        // Select based on available bandwidth with safety margin
        const availableBandwidth = conditions.bandwidth.available * 0.8; // 20% safety margin
        for (let i = sortedLadder.length - 1; i >= 0; i--) {
            const quality = sortedLadder[i];
            if (quality.bandwidth <= availableBandwidth) {
                // Check if device can handle this quality
                if (this.canDeviceHandle(context.deviceCapabilities, quality)) {
                    return quality;
                }
            }
        }
        // Fallback to lowest quality
        return sortedLadder[0];
    }
    /**
     * Check if device can handle quality level
     */
    canDeviceHandle(capabilities, quality) {
        // CPU check
        if (capabilities.cpu.usage > 80) {
            // Reduce quality if CPU is stressed
            return quality.level === "low" || quality.level === "medium";
        }
        // Memory check
        if (capabilities.memory.usage > 80) {
            return quality.level !== "ultra";
        }
        // Display resolution check
        if (quality.video) {
            const deviceRes = capabilities.display.resolution;
            const qualityRes = quality.video.resolution;
            // Don't stream higher than display resolution
            if (qualityRes.width > deviceRes.width ||
                qualityRes.height > deviceRes.height) {
                return false;
            }
        }
        return true;
    }
    /**
     * Estimate impact of quality change
     */
    estimateImpact(currentQuality, newQuality) {
        const bandwidthRatio = newQuality.bandwidth / currentQuality.bandwidth;
        const qualityIndex = { low: 1, medium: 2, high: 3, ultra: 4, auto: 2 };
        const currentIndex = qualityIndex[currentQuality.level] || 2;
        const newIndex = qualityIndex[newQuality.level] || 2;
        return {
            latency: (newQuality.latency || 100) - (currentQuality.latency || 100),
            bandwidth: newQuality.bandwidth - currentQuality.bandwidth,
            cpu: (bandwidthRatio - 1) * 20, // Estimated CPU impact
            battery: (bandwidthRatio - 1) * 15, // Estimated battery impact
            userExperience: (newIndex - currentIndex) * 0.2, // User experience impact
        };
    }
    /**
     * Initialize default adaptation rules
     */
    initializeAdaptationRules() {
        // High packet loss rule
        this.addAdaptationRule({
            condition: {
                packetLoss: { min: 0.05 },
            },
            action: {
                type: "downgrade",
                targetQuality: { level: "medium", bandwidth: 1000000, latency: 150 },
            },
            priority: 10,
            cooldown: 5000,
        });
        // Low bandwidth rule
        this.addAdaptationRule({
            condition: {
                bandwidth: { max: 1000000 },
            },
            action: {
                type: "downgrade",
                targetQuality: { level: "low", bandwidth: 500000, latency: 200 },
            },
            priority: 9,
            cooldown: 3000,
        });
        // High latency rule
        this.addAdaptationRule({
            condition: {
                latency: { min: 300 },
            },
            action: {
                type: "downgrade",
            },
            priority: 8,
            cooldown: 5000,
        });
        // Buffer underrun rule
        this.addAdaptationRule({
            condition: {
                bufferHealth: { max: 0.3 },
            },
            action: {
                type: "downgrade",
            },
            priority: 7,
            cooldown: 2000,
        });
        // Improvement opportunity rule
        this.addAdaptationRule({
            condition: {
                bandwidth: { min: 5000000 },
                bufferHealth: { min: 0.8 },
            },
            action: {
                type: "upgrade",
            },
            priority: 5,
            cooldown: 10000,
        });
    }
    /**
     * Initialize ML models
     */
    initializeMLModels() {
        // Bandwidth prediction model
        this.mlModels.set("bandwidth_prediction", {
            type: "neural_network",
            features: [
                "time_of_day",
                "location",
                "network_type",
                "historical_bandwidth",
            ],
            accuracy: 0.8,
            lastTrained: Date.now(),
            predictions: new Map(),
        });
        // Quality optimization model
        this.mlModels.set("quality_optimization", {
            type: "ensemble",
            features: [
                "bandwidth",
                "latency",
                "device_capabilities",
                "user_preferences",
            ],
            accuracy: 0.85,
            lastTrained: Date.now(),
            predictions: new Map(),
        });
    }
    /**
     * Update ML models with new data
     */
    async updateMLModels(decision, context) {
        // Training data would be collected and models updated
        // This is a placeholder for ML model training logic
        this.logger.debug("ML models updated with new adaptation data");
    }
    /**
     * Start monitoring systems
     */
    startMonitoring() {
        // Start network monitoring
        this.networkMonitor.start();
        // Start device monitoring
        this.deviceMonitor.start();
        // Periodic evaluation
        setInterval(() => {
            this.evaluateAllStreams();
        }, 5000); // Evaluate every 5 seconds
    }
    /**
     * Evaluate adaptation for all active streams
     */
    async evaluateAllStreams() {
        for (const streamId of this.contexts.keys()) {
            try {
                await this.evaluateAdaptation(streamId);
            }
            catch (error) {
                this.logger.error("Stream evaluation failed", {
                    streamId,
                    error: error.message,
                });
            }
        }
    }
    /**
     * Clean up stream context
     */
    removeStream(streamId) {
        this.contexts.delete(streamId);
        this.qualityLadder.delete(streamId);
        // Clean up history for this stream (keep recent ones)
        const cutoffTime = Date.now() - 3600000; // 1 hour
        this.adaptationHistory = this.adaptationHistory.filter((decision) => decision.streamId !== streamId || (decision.timeline || 0) > cutoffTime);
        this.logger.info("Stream context removed", { streamId });
    }
    /**
     * Clean up resources
     */
    cleanup() {
        this.contexts.clear();
        this.qualityLadder.clear();
        this.adaptationHistory = [];
        this.mlModels.clear();
        this.adaptationRules = [];
        this.networkMonitor.stop();
        this.deviceMonitor.stop();
        this.removeAllListeners();
        this.logger.info("Quality adaptation engine cleaned up");
    }
}
/**
 * Network conditions monitor
 */
class NetworkMonitor {
    constructor() {
        this.conditions = {
            bandwidth: { upload: 0, download: 0, available: 0 },
            latency: { rtt: 0, jitter: 0 },
            jitter: 0,
            packetLoss: 0,
            quality: { packetLoss: 0, stability: 1, congestion: 0 },
            timestamp: Date.now(),
        };
    }
    start() {
        // Start network monitoring
        setInterval(() => {
            this.updateConditions();
        }, 1000);
    }
    stop() {
        // Stop monitoring
    }
    getCurrentConditions() {
        return { ...this.conditions };
    }
    updateConditions() {
        // Update network conditions - placeholder implementation
        this.conditions.timestamp = Date.now();
    }
}
/**
 * Device capabilities monitor
 */
class DeviceMonitor {
    constructor() {
        this.capabilities = {
            cpu: { cores: 4, usage: 0, maxFrequency: 2400, architecture: "x64" },
            memory: { total: 8192, available: 4096, usage: 50 },
            display: {
                resolution: { width: 1920, height: 1080 },
                refreshRate: 60,
                colorDepth: 24,
                hdr: false,
            },
            network: {
                type: "wifi",
                speed: { upload: 10000000, download: 50000000 },
                reliability: 0.95,
            },
            hardware: {
                videoDecoding: ["h264", "vp9"],
                audioProcessing: ["opus", "aac"],
                acceleration: true,
            },
        };
    }
    start() {
        // Start device monitoring
        setInterval(() => {
            this.updateCapabilities();
        }, 5000);
    }
    stop() {
        // Stop monitoring
    }
    getCapabilities() {
        return { ...this.capabilities };
    }
    updateCapabilities() {
        // Update device capabilities - placeholder implementation
    }
}
/**
 * Prediction engine using ML models
 */
class PredictionEngine {
    predictOptimalQuality(context, conditions, ladder) {
        // ML-based quality prediction - placeholder implementation
        return null;
    }
}
/**
 * Decision engine for adaptation logic
 */
class DecisionEngine {
    async decide(context, rules, ladder) {
        // Decision logic implementation
        return null;
    }
}
/**
 * Metrics collector
 */
class MetricsCollector {
    async collect(streamId) {
        // Metrics collection implementation
        return {};
    }
}

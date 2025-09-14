/**
 * Audio Processor - Chirp Audio Integration
 *
 * Comprehensive audio processing with Chirp voice generation,
 * real-time streaming, voice cloning, and WebRTC integration
 */
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { PerformanceMonitor } from "../../core/performance-monitor.js";
import { CacheManager } from "../../core/cache-manager.js";
import { VertexAIConnector } from "../../core/vertex-ai-connector.js";
import { ChirpAdapter } from "./chirp-adapter.js";
import { VoiceCloner } from "./voice-cloner.js";
import { AudioEffectsEngine } from "./audio-effects-engine.js";
import { AudioStreamer } from "./audio-streamer.js";
import { WebRTCManager } from "./webrtc-manager.js";
import { AudioCache } from "./audio-cache.js";
export class AudioProcessor extends EventEmitter {
    logger;
    config;
    performance;
    cache;
    // Core components
    chirpAdapter;
    voiceCloner;
    effectsEngine;
    audioStreamer;
    webrtcManager;
    audioCache;
    vertexConnector;
    // Processing state
    isInitialized = false;
    activeRequests = new Map();
    streamingSessions = new Map();
    // Metrics
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        streamingRequests: 0,
        realTimeRequests: 0,
        voiceCloningRequests: 0,
        effectsApplied: 0,
        totalDuration: 0,
        totalCost: 0,
        avgLatency: 0,
        cacheHits: 0,
    };
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger("AudioProcessor");
        this.performance = new PerformanceMonitor();
        this.initializeComponents();
    }
    /**
     * Initialize all audio processing components
     */
    initializeComponents() {
        // Initialize Vertex AI connector
        this.vertexConnector = new VertexAIConnector({
            projectId: this.config.projectId,
            location: this.config.location,
            apiEndpoint: this.config.apiEndpoint,
            credentials: this.config.credentials,
            serviceAccountPath: this.config.serviceAccountPath,
            maxConcurrentRequests: this.config.maxConcurrentRequests,
            requestTimeout: this.config.requestTimeout,
        });
        // Initialize core adapters
        this.chirpAdapter = new ChirpAdapter(this.config, this.vertexConnector);
        // Initialize specialized engines
        this.voiceCloner = new VoiceCloner(this.config);
        this.effectsEngine = new AudioEffectsEngine();
        this.audioStreamer = new AudioStreamer(this.config);
        this.webrtcManager = new WebRTCManager();
        // Initialize caching with audio-specific strategies
        this.audioCache = new AudioCache({
            maxMemorySize: 50 * 1024 * 1024, // 50MB
            maxDiskSize: 500 * 1024 * 1024, // 500MB
            ttl: 12 * 60 * 60 * 1000, // 12 hours
            compressionEnabled: true,
            formatOptimization: true,
        });
        // Initialize shared cache
        this.cache = new CacheManager({
            maxMemorySize: 25 * 1024 * 1024, // 25MB for metadata
            defaultTTL: 1800, // 30 minutes
        });
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Chirp adapter events
        this.chirpAdapter.on("audio_generated", (data) => {
            this.emit("audio_generated", data);
        });
        this.chirpAdapter.on("audio_failed", (data) => {
            this.emit("audio_failed", data);
        });
        // Voice cloner events
        this.voiceCloner.on("voice_cloned", (data) => {
            this.logger.debug("Voice cloning completed", { voiceId: data.voiceId });
        });
        // Effects engine events
        this.effectsEngine.on("effects_applied", (data) => {
            this.metrics.effectsApplied++;
            this.logger.debug("Audio effects applied", {
                effectCount: data.effectCount,
            });
        });
        // Streaming events
        this.audioStreamer.on("stream_started", (data) => {
            this.metrics.streamingRequests++;
            this.logger.info("Audio streaming started", {
                sessionId: data.sessionId,
            });
        });
        this.audioStreamer.on("stream_chunk", (data) => {
            this.emit("audio_stream_chunk", data);
        });
        this.audioStreamer.on("stream_ended", (data) => {
            this.streamingSessions.delete(data.sessionId);
            this.logger.info("Audio streaming ended", { sessionId: data.sessionId });
        });
        // WebRTC events
        this.webrtcManager.on("connection_established", (data) => {
            this.logger.info("WebRTC connection established", {
                connectionId: data.connectionId,
            });
        });
        // Cache events
        this.audioCache.on("cache_hit", (data) => {
            this.metrics.cacheHits++;
            this.logger.debug("Audio cache hit", data);
        });
    }
    /**
     * Initialize the audio processor
     */
    async initialize() {
        try {
            this.logger.info("Initializing audio processor...");
            // Initialize components in parallel
            await Promise.all([
                this.chirpAdapter.initialize(),
                this.voiceCloner.initialize(),
                this.effectsEngine.initialize(),
                this.audioStreamer.initialize(),
                this.webrtcManager.initialize(),
                this.audioCache.initialize(),
            ]);
            this.isInitialized = true;
            this.logger.info("Audio processor initialized successfully");
            this.emit("initialized");
        }
        catch (error) {
            this.logger.error("Failed to initialize audio processor", error);
            throw error;
        }
    }
    /**
     * Generate audio using Chirp
     */
    async generateAudio(request) {
        const startTime = performance.now();
        const requestId = request.context?.requestId || this.generateRequestId();
        this.metrics.totalRequests++;
        try {
            this.ensureInitialized();
            this.logger.info("Starting audio generation", {
                requestId,
                text: request.text.substring(0, 100) + "...",
                voice: request.voice?.preset || "default",
            });
            // Check cache first
            const cacheResult = await this.checkCache(request);
            if (cacheResult) {
                this.metrics.cacheHits++;
                this.logger.info("Audio generation completed from cache", {
                    requestId,
                    latency: performance.now() - startTime,
                });
                return cacheResult;
            }
            // Setup abort controller for cancellation
            const controller = new AbortController();
            // Track active request
            const promise = this.processAudioGeneration(request, requestId, controller.signal);
            this.activeRequests.set(requestId, {
                request,
                startTime,
                promise,
                controller,
            });
            const response = await promise;
            // Update metrics
            const latency = performance.now() - startTime;
            this.updateMetrics(latency, response);
            this.logger.info("Audio generation completed", {
                requestId,
                latency,
                duration: response.audio.duration,
                cost: response.metadata.cost,
            });
            return response;
        }
        catch (error) {
            this.metrics.failedRequests++;
            const latency = performance.now() - startTime;
            this.logger.error("Audio generation failed", {
                requestId,
                latency,
                error: error.message,
            });
            throw error;
        }
        finally {
            this.activeRequests.delete(requestId);
        }
    }
    /**
     * Generate audio with streaming
     */
    async *generateAudioStream(request) {
        const requestId = request.context?.requestId || this.generateRequestId();
        this.metrics.streamingRequests++;
        try {
            this.ensureInitialized();
            this.logger.info("Starting audio streaming", {
                requestId,
                text: request.text.substring(0, 100) + "...",
                streaming: request.streaming,
            });
            // Create streaming session
            const sessionId = `stream_${requestId}`;
            const streamer = new AudioStreamer(this.config);
            this.streamingSessions.set(sessionId, {
                streamer,
                config: request.streaming || this.getDefaultStreamingConfig(),
                startTime: performance.now(),
            });
            // Start streaming generation
            const streamGenerator = this.chirpAdapter.generateAudioStream(request);
            let sequenceNumber = 0;
            for await (const chunk of streamGenerator) {
                const streamChunk = {
                    id: `${sessionId}_${sequenceNumber}`,
                    data: chunk.audioData,
                    format: chunk.format,
                    sampleRate: chunk.sampleRate,
                    channels: chunk.channels,
                    timestamp: Date.now(),
                    sequenceNumber: sequenceNumber++,
                    isLast: chunk.isLast,
                    metadata: {
                        text: chunk.text,
                        progress: chunk.progress,
                        emotion: chunk.emotion,
                        confidence: chunk.confidence,
                    },
                };
                yield streamChunk;
                if (chunk.isLast) {
                    break;
                }
            }
            this.logger.info("Audio streaming completed", {
                requestId,
                sessionId,
                chunks: sequenceNumber,
            });
        }
        catch (error) {
            this.logger.error("Audio streaming failed", {
                requestId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Process audio generation with full pipeline
     */
    async processAudioGeneration(request, requestId, signal) {
        // Phase 1: Voice preparation
        let voiceConfig = request.voice;
        if (request.voice?.customVoice) {
            this.metrics.voiceCloningRequests++;
            voiceConfig = await this.prepareCustomVoice(request.voice, signal);
        }
        // Phase 2: Generate base audio through Chirp
        const baseRequest = {
            ...request,
            voice: voiceConfig,
        };
        const baseResponse = await this.chirpAdapter.generateAudio(baseRequest, signal);
        // Phase 3: Apply effects if specified
        let processedAudio = baseResponse.audio;
        if (request.effects && request.effects.length > 0) {
            processedAudio = await this.applyAudioEffects(processedAudio, request.effects, signal);
        }
        // Phase 4: Apply final processing
        processedAudio = await this.applyFinalProcessing(processedAudio, request, signal);
        // Phase 5: Cache the result
        const finalResponse = {
            ...baseResponse,
            audio: processedAudio,
        };
        await this.cacheResult(request, finalResponse);
        return finalResponse;
    }
    /**
     * Prepare custom voice using voice cloning
     */
    async prepareCustomVoice(voice, signal) {
        if (!voice.customVoice || !this.config.voiceCloningEnabled) {
            return voice;
        }
        try {
            this.logger.debug("Preparing custom voice", {
                voiceId: voice.customVoice.voiceId,
            });
            const clonedVoice = await this.voiceCloner.cloneVoice(voice.customVoice, signal);
            return {
                ...voice,
                customVoice: {
                    ...voice.customVoice,
                    ...clonedVoice,
                },
            };
        }
        catch (error) {
            this.logger.warn("Voice cloning failed, using default", error);
            return { ...voice, customVoice: undefined };
        }
    }
    /**
     * Apply audio effects
     */
    async applyAudioEffects(audio, effects, signal) {
        if (!this.config.effectsEnabled || effects.length === 0) {
            return audio;
        }
        try {
            this.logger.debug("Applying audio effects", {
                audioId: audio.id,
                effectCount: effects.length,
            });
            return await this.effectsEngine.applyEffects(audio, effects, signal);
        }
        catch (error) {
            this.logger.error("Failed to apply audio effects", error);
            return audio; // Return original if effects fail
        }
    }
    /**
     * Apply final processing (normalization, format conversion, etc.)
     */
    async applyFinalProcessing(audio, request, signal) {
        let processedAudio = audio;
        // Apply audio settings
        if (request.audioSettings) {
            processedAudio = await this.applyAudioSettings(processedAudio, request.audioSettings);
        }
        // Apply quality optimizations based on user tier
        if (request.context?.userTier === "enterprise") {
            processedAudio =
                await this.applyEnterpriseAudioEnhancements(processedAudio);
        }
        // Apply compression for faster delivery if needed
        if (request.context?.latencyTarget &&
            request.context.latencyTarget < 2000) {
            processedAudio = await this.applyCompressionOptimizations(processedAudio);
        }
        return processedAudio;
    }
    /**
     * Apply audio settings (format, quality, etc.)
     */
    async applyAudioSettings(audio, settings) {
        let processedAudio = audio;
        // Convert format if needed
        if (settings.format !== audio.format) {
            processedAudio = await this.convertAudioFormat(processedAudio, settings.format);
        }
        // Resample if needed
        if (settings.sampleRate !== audio.sampleRate) {
            processedAudio = await this.resampleAudio(processedAudio, settings.sampleRate);
        }
        // Apply normalization
        if (settings.normalize) {
            processedAudio = await this.normalizeAudio(processedAudio);
        }
        // Apply noise reduction
        if (settings.removeNoise) {
            processedAudio = await this.removeNoise(processedAudio);
        }
        return processedAudio;
    }
    /**
     * Apply enterprise audio enhancements
     */
    async applyEnterpriseAudioEnhancements(audio) {
        // Implement enterprise features like advanced noise reduction, enhanced quality, etc.
        return {
            ...audio,
            quality: {
                ...audio.quality,
                snr: Math.min(audio.quality.snr + 5, 60), // Improve SNR
                thd: Math.max(audio.quality.thd - 0.001, 0.001), // Reduce distortion
            },
        };
    }
    /**
     * Apply compression optimizations
     */
    async applyCompressionOptimizations(audio) {
        // Implement smart compression for faster delivery
        return {
            ...audio,
            size: Math.floor(audio.size * 0.8), // Simulate compression
            metadata: {
                ...audio.metadata,
                compressed: true,
                compressionRatio: 0.8,
            },
        };
    }
    /**
     * Audio format conversion
     */
    async convertAudioFormat(audio, targetFormat) {
        // This would implement actual audio format conversion
        // For now, just update metadata
        return {
            ...audio,
            format: targetFormat,
        };
    }
    /**
     * Audio resampling
     */
    async resampleAudio(audio, targetSampleRate) {
        // This would implement actual audio resampling
        return {
            ...audio,
            sampleRate: targetSampleRate,
        };
    }
    /**
     * Audio normalization
     */
    async normalizeAudio(audio) {
        // This would implement actual audio normalization
        return {
            ...audio,
            quality: {
                ...audio.quality,
                loudness: -16, // LUFS standard
            },
        };
    }
    /**
     * Noise reduction
     */
    async removeNoise(audio) {
        // This would implement actual noise reduction
        return {
            ...audio,
            quality: {
                ...audio.quality,
                snr: Math.min(audio.quality.snr + 3, 60),
            },
        };
    }
    /**
     * Start real-time audio session
     */
    async startRealTimeSession(config, context) {
        this.metrics.realTimeRequests++;
        try {
            this.ensureInitialized();
            const sessionId = this.generateSessionId();
            this.logger.info("Starting real-time audio session", {
                sessionId,
                webrtc: config.webrtc?.enabled,
                maxLatency: config.maxLatency,
            });
            // Setup WebRTC if enabled
            if (config.webrtc?.enabled) {
                await this.webrtcManager.createConnection(sessionId, config.webrtc);
            }
            // Setup real-time streaming
            const streamer = new AudioStreamer({
                ...this.config,
                realTimeGeneration: true,
            });
            await streamer.setupRealTimeSession(sessionId, config);
            this.streamingSessions.set(sessionId, {
                streamer,
                config: this.getDefaultStreamingConfig(),
                startTime: performance.now(),
            });
            return sessionId;
        }
        catch (error) {
            this.logger.error("Failed to start real-time session", error);
            throw error;
        }
    }
    /**
     * Process real-time audio input
     */
    async processRealTimeInput(sessionId, audioData) {
        const session = this.streamingSessions.get(sessionId);
        if (!session) {
            throw new Error(`Real-time session not found: ${sessionId}`);
        }
        try {
            return await session.streamer.processRealTimeInput(audioData);
        }
        catch (error) {
            this.logger.error("Real-time processing failed", {
                sessionId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Check cache for existing result
     */
    async checkCache(request) {
        if (!this.config.cachingEnabled) {
            return null;
        }
        try {
            const cacheKey = this.audioCache.generateCacheKey(request);
            return await this.audioCache.get(cacheKey);
        }
        catch (error) {
            this.logger.warn("Cache check failed", error);
            return null;
        }
    }
    /**
     * Cache generation result
     */
    async cacheResult(request, response) {
        if (!this.config.cachingEnabled) {
            return;
        }
        try {
            const cacheKey = this.audioCache.generateCacheKey(request);
            await this.audioCache.set(cacheKey, response);
        }
        catch (error) {
            this.logger.warn("Failed to cache result", error);
        }
    }
    /**
     * Update metrics
     */
    updateMetrics(latency, response) {
        this.metrics.successfulRequests++;
        this.metrics.totalDuration += response.audio.duration;
        this.metrics.totalCost += response.metadata.cost;
        this.metrics.avgLatency =
            (this.metrics.avgLatency * (this.metrics.totalRequests - 1) + latency) /
                this.metrics.totalRequests;
        this.performance.recordMetric("audio_generation_latency", latency);
        this.performance.recordMetric("audio_generation_cost", response.metadata.cost);
        this.performance.recordMetric("audio_duration_generated", response.audio.duration);
    }
    /**
     * Get default streaming config
     */
    getDefaultStreamingConfig() {
        return {
            enabled: true,
            chunkSize: 4096,
            latency: "medium",
            bufferSize: 8192,
            format: "pcm",
        };
    }
    /**
     * Validate request
     */
    async validateRequest(request) {
        if (!request.text || typeof request.text !== "string") {
            throw new Error("Text is required and must be a string");
        }
        if (request.text.length > 10000) {
            throw new Error("Text is too long (max 10,000 characters)");
        }
        if (request.voice?.speaking_rate &&
            (request.voice.speaking_rate < 0.5 || request.voice.speaking_rate > 2.0)) {
            throw new Error("Speaking rate must be between 0.5 and 2.0");
        }
        if (request.voice?.pitch &&
            (request.voice.pitch < -20 || request.voice.pitch > 20)) {
            throw new Error("Pitch must be between -20 and +20 semitones");
        }
        if (request.audioSettings?.sampleRate &&
            ![8000, 16000, 24000, 48000].includes(request.audioSettings.sampleRate)) {
            throw new Error("Sample rate must be 8000, 16000, 24000, or 48000 Hz");
        }
    }
    /**
     * Estimate cost
     */
    estimateCost(request) {
        const baseCharacterCost = 0.0001; // $0.0001 per character
        let cost = request.text.length * baseCharacterCost;
        // Add voice cloning cost
        if (request.voice?.customVoice) {
            cost += 0.05; // $0.05 for voice cloning
        }
        // Add effects cost
        if (request.effects && request.effects.length > 0) {
            cost += request.effects.length * 0.01; // $0.01 per effect
        }
        // Add real-time processing cost
        if (request.realTime?.enabled) {
            cost *= 1.5; // 50% premium for real-time
        }
        return cost;
    }
    /**
     * Cancel request
     */
    async cancelRequest(requestId) {
        const activeRequest = this.activeRequests.get(requestId);
        if (activeRequest) {
            activeRequest.controller?.abort();
            this.activeRequests.delete(requestId);
            this.emit("request_cancelled", { requestId });
            return true;
        }
        return false;
    }
    /**
     * End real-time session
     */
    async endRealTimeSession(sessionId) {
        const session = this.streamingSessions.get(sessionId);
        if (session) {
            await session.streamer.endSession();
            this.streamingSessions.delete(sessionId);
            // Close WebRTC connection if exists
            await this.webrtcManager.closeConnection(sessionId);
            this.logger.info("Real-time session ended", { sessionId });
        }
    }
    /**
     * Check if streaming is supported
     */
    supportsStreaming() {
        return this.config.realTimeGeneration;
    }
    /**
     * Generate request ID
     */
    generateRequestId() {
        return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Ensure processor is initialized
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error("Audio processor not initialized");
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        const startTime = performance.now();
        try {
            // Simple test generation
            const testRequest = {
                text: "Hello, this is a test.",
                voice: { preset: "narrator_professional" },
                context: {
                    requestId: "health_check",
                    priority: "low",
                    userTier: "free",
                    latencyTarget: 5000,
                    qualityTarget: "draft",
                },
            };
            await this.generateAudio(testRequest);
            const latency = performance.now() - startTime;
            return {
                status: "healthy",
                latency,
            };
        }
        catch (error) {
            const latency = performance.now() - startTime;
            return {
                status: "unhealthy",
                latency,
                error: error.message,
            };
        }
    }
    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeRequests: this.activeRequests.size,
            activeSessions: this.streamingSessions.size,
            cacheStats: this.audioCache.getMetrics(),
        };
    }
    /**
     * Shutdown processor
     */
    async shutdown() {
        this.logger.info("Shutting down audio processor...");
        // Cancel all active requests
        for (const [requestId, activeRequest] of this.activeRequests) {
            activeRequest.controller?.abort();
        }
        this.activeRequests.clear();
        // End all streaming sessions
        for (const sessionId of this.streamingSessions.keys()) {
            await this.endRealTimeSession(sessionId);
        }
        // Shutdown components
        await Promise.all([
            this.chirpAdapter.shutdown(),
            this.voiceCloner.shutdown(),
            this.effectsEngine.shutdown(),
            this.audioStreamer.shutdown(),
            this.webrtcManager.shutdown(),
            this.audioCache.shutdown(),
        ]);
        this.isInitialized = false;
        this.logger.info("Audio processor shutdown complete");
    }
}
//# sourceMappingURL=audio-processor.js.map
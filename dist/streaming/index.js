/**
 * Enhanced Streaming API - Main Export
 *
 * Production-ready multi-modal streaming system with:
 * - Real-time video/audio streaming
 * - Advanced codec management
 * - Edge caching and CDN integration
 * - A2A protocol coordination
 * - Performance optimization (<100ms text, <500ms multimedia)
 */
// Core streaming API
export { EnhancedStreamingAPI } from "./enhanced-streaming-api.js";
// WebRTC architecture
export { WebRTCArchitecture } from "./webrtc-architecture.js";
// Codec management
export { CodecManager } from "./codec-manager.js";
// Buffer and synchronization
export { BufferSyncManager } from "./buffer-sync-manager.js";
// A2A multimedia extension
export { A2AMultimediaExtension } from "./a2a-multimedia-extension.js";
// Quality adaptation
export { QualityAdaptationEngine } from "./quality-adaptation-engine.js";
// Edge caching and CDN
export { EdgeCacheCDN } from "./edge-cache-cdn.js";
/**
 * Create a default Enhanced Streaming API configuration
 */
export function createDefaultStreamingConfig() {
    return {
        webrtc: {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
            ],
            enableDataChannels: true,
            enableTranscoding: true,
        },
        caching: {
            enabled: true,
            ttl: 3600000, // 1 hour
            maxSize: 2000000000, // 2GB
            purgeStrategy: "adaptive",
            cdnEndpoints: [],
            cacheKeys: {
                includeQuality: true,
                includeUser: true,
                includeSession: true,
                custom: ["device_type", "region"],
            },
        },
        cdn: {
            provider: "cloudflare",
            endpoints: {
                primary: "https://api.gemini-flow.com",
                fallback: ["https://api2.gemini-flow.com"],
                geographic: {
                    "us-east": "https://us-east.gemini-flow.com",
                    "eu-west": "https://eu-west.gemini-flow.com",
                    "ap-southeast": "https://ap-southeast.gemini-flow.com",
                },
            },
            caching: {
                strategy: "adaptive",
                ttl: 7200000, // 2 hours
                edgeLocations: [
                    "us-east",
                    "us-west",
                    "eu-west",
                    "eu-central",
                    "ap-southeast",
                    "ap-northeast",
                ],
            },
            optimization: {
                compression: true,
                minification: true,
                imageSizing: true,
                formatConversion: true,
            },
        },
        synchronization: {
            enabled: true,
            tolerance: 50, // 50ms
            maxDrift: 200, // 200ms
            resyncThreshold: 500, // 500ms
            method: "rtp",
            masterClock: "audio",
        },
        quality: {
            enableAdaptation: true,
            targetLatency: 100,
            adaptationSpeed: "medium",
            mlPrediction: true,
        },
        a2a: {
            enableCoordination: true,
            consensusThreshold: 0.66, // 2/3 majority
            failoverTimeout: 30000, // 30 seconds
        },
        performance: {
            textLatencyTarget: 100, // <100ms for text processing
            multimediaLatencyTarget: 500, // <500ms for multimedia streaming
            enableOptimizations: true,
            monitoringInterval: 5000, // 5 seconds
        },
        security: {
            enableEncryption: true,
            enableAuthentication: true,
            enableIntegrityChecks: true,
        },
    };
}
/**
 * Create a lightweight streaming configuration for development
 */
export function createLightweightStreamingConfig() {
    const config = createDefaultStreamingConfig();
    // Disable heavy features for development
    config.a2a.enableCoordination = false;
    config.quality.mlPrediction = false;
    config.security.enableEncryption = false;
    config.security.enableAuthentication = false;
    config.security.enableIntegrityChecks = false;
    config.caching.enabled = false;
    config.synchronization.enabled = false;
    // Reduce resource usage
    config.caching.maxSize = 100000000; // 100MB
    config.performance.monitoringInterval = 10000; // 10 seconds
    return config;
}
/**
 * Create a high-performance streaming configuration for production
 */
export function createHighPerformanceStreamingConfig() {
    const config = createDefaultStreamingConfig();
    // Aggressive performance settings
    config.performance.textLatencyTarget = 50; // <50ms for text
    config.performance.multimediaLatencyTarget = 300; // <300ms for multimedia
    config.quality.adaptationSpeed = "fast";
    config.synchronization.tolerance = 25; // Tighter sync tolerance
    // Enhanced caching
    config.caching.maxSize = 5000000000; // 5GB
    config.caching.purgeStrategy = "adaptive";
    // More aggressive CDN optimization
    config.cdn.caching.ttl = 14400000; // 4 hours
    config.cdn.optimization = {
        compression: true,
        minification: true,
        imageSizing: true,
        formatConversion: true,
    };
    return config;
}
/**
 * Validate streaming configuration
 */
export function validateStreamingConfig(config) {
    const errors = [];
    // Validate performance targets
    if (config.performance.textLatencyTarget <= 0) {
        errors.push("Text latency target must be positive");
    }
    if (config.performance.multimediaLatencyTarget <= 0) {
        errors.push("Multimedia latency target must be positive");
    }
    if (config.performance.textLatencyTarget >
        config.performance.multimediaLatencyTarget) {
        errors.push("Text latency target should not exceed multimedia latency target");
    }
    // Validate WebRTC configuration
    if (!config.webrtc.iceServers || config.webrtc.iceServers.length === 0) {
        errors.push("At least one ICE server is required");
    }
    // Validate synchronization settings
    if (config.synchronization.enabled) {
        if (config.synchronization.tolerance <= 0) {
            errors.push("Sync tolerance must be positive");
        }
        if (config.synchronization.maxDrift <= config.synchronization.tolerance) {
            errors.push("Max drift should be greater than sync tolerance");
        }
    }
    // Validate A2A settings
    if (config.a2a.enableCoordination) {
        if (config.a2a.consensusThreshold <= 0 ||
            config.a2a.consensusThreshold > 1) {
            errors.push("Consensus threshold must be between 0 and 1");
        }
        if (config.a2a.failoverTimeout <= 0) {
            errors.push("Failover timeout must be positive");
        }
    }
    // Validate caching settings
    if (config.caching.enabled) {
        if (config.caching.maxSize <= 0) {
            errors.push("Cache max size must be positive");
        }
        if (config.caching.ttl <= 0) {
            errors.push("Cache TTL must be positive");
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Create streaming context with defaults
 */
export function createStreamingContext(sessionId, overrides) {
    const defaultContext = {
        sessionId,
        userPreferences: {
            qualityPriority: "balanced",
            maxBitrate: 5000000, // 5 Mbps
            autoAdjust: true,
            preferredResolution: { width: 1280, height: 720 },
            latencyTolerance: 200,
            dataUsageLimit: 1000000000, // 1GB
            adaptationSpeed: "medium",
        },
        deviceCapabilities: {
            cpu: { cores: 4, usage: 50, maxFrequency: 2400, architecture: "x64" },
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
        },
        networkConditions: {
            bandwidth: { upload: 10000000, download: 50000000, available: 40000000 },
            latency: { rtt: 50, jitter: 10 },
            quality: { packetLoss: 0.01, stability: 0.95, congestion: 0.1 },
            timestamp: Date.now(),
        },
        constraints: {
            minBitrate: 500000, // 500 kbps
            maxBitrate: 20000000, // 20 Mbps
            minResolution: { width: 320, height: 240 },
            maxResolution: { width: 3840, height: 2160 }, // 4K
            minFramerate: 15,
            maxFramerate: 60,
            latencyBudget: 500, // 500ms
            powerBudget: 100, // 100 watts
        },
        metadata: {},
    };
    return { ...defaultContext, ...overrides };
}

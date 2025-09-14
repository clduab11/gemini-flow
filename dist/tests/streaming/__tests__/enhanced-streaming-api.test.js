/**
 * Enhanced Streaming API Tests
 *
 * Comprehensive test suite for the streaming functionality including:
 * - Performance validation (<100ms text, <500ms multimedia)
 * - Error handling and recovery
 * - Multi-modal coordination
 * - Quality adaptation
 * - Edge caching
 */
import { EnhancedStreamingAPI, } from "../enhanced-streaming-api.js";
describe("EnhancedStreamingAPI", () => {
    let streamingAPI;
    let mockConfig;
    let mockContext;
    beforeEach(() => {
        mockConfig = {
            webrtc: {
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                enableDataChannels: true,
                enableTranscoding: true,
            },
            caching: {
                enabled: true,
                ttl: 3600000,
                maxSize: 1000000000,
                purgeStrategy: "lru",
                cdnEndpoints: ["https://test-cdn.com"],
                cacheKeys: {
                    includeQuality: true,
                    includeUser: false,
                    includeSession: true,
                },
            },
            cdn: {
                provider: "cloudflare",
                endpoints: {
                    primary: "https://test-cdn.com",
                    fallback: ["https://test-cdn2.com"],
                    geographic: {},
                },
                caching: {
                    strategy: "adaptive",
                    ttl: 3600000,
                    edgeLocations: ["us-east"],
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
                tolerance: 50,
                maxDrift: 200,
                resyncThreshold: 500,
                method: "rtp",
                masterClock: "audio",
            },
            quality: {
                enableAdaptation: true,
                targetLatency: 100,
                adaptationSpeed: "medium",
                mlPrediction: false, // Disable for tests
            },
            a2a: {
                enableCoordination: false, // Disable for unit tests
                consensusThreshold: 0.6,
                failoverTimeout: 30000,
            },
            performance: {
                textLatencyTarget: 100,
                multimediaLatencyTarget: 500,
                enableOptimizations: true,
                monitoringInterval: 1000,
            },
            security: {
                enableEncryption: false, // Disable for tests
                enableAuthentication: false,
                enableIntegrityChecks: false,
            },
        };
        mockContext = {
            sessionId: "test-session-1",
            userId: "test-user",
            userPreferences: {
                qualityPriority: "balanced",
                maxBitrate: 5000000,
                autoAdjust: true,
                preferredResolution: { width: 1280, height: 720 },
                latencyTolerance: 200,
                dataUsageLimit: 1000000000,
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
                bandwidth: {
                    upload: 10000000,
                    download: 50000000,
                    available: 40000000,
                },
                latency: { rtt: 50, jitter: 10 },
                quality: { packetLoss: 0.01, stability: 0.95, congestion: 0.1 },
                timestamp: Date.now(),
            },
            constraints: {
                minBitrate: 500000,
                maxBitrate: 10000000,
                minResolution: { width: 640, height: 360 },
                maxResolution: { width: 1920, height: 1080 },
                minFramerate: 15,
                maxFramerate: 60,
                latencyBudget: 500,
                powerBudget: 100,
            },
            metadata: {},
        };
        streamingAPI = new EnhancedStreamingAPI(mockConfig);
    });
    afterEach(async () => {
        await streamingAPI.cleanup();
    });
    describe("Session Management", () => {
        it("should create streaming session within latency target", async () => {
            const startTime = performance.now();
            const session = await streamingAPI.createSession("test-session-1", "video", mockContext);
            const creationTime = performance.now() - startTime;
            expect(session).toBeDefined();
            expect(session.id).toBe("test-session-1");
            expect(session.type).toBe("video");
            expect(session.status).toBe("active");
            expect(creationTime).toBeLessThan(mockConfig.performance.multimediaLatencyTarget);
        });
        it("should handle invalid session context", async () => {
            const invalidContext = { ...mockContext, constraints: undefined };
            await expect(streamingAPI.createSession("invalid-session", "video", invalidContext)).rejects.toThrow("Quality constraints are required");
        });
        it("should end session and cleanup resources", async () => {
            const session = await streamingAPI.createSession("cleanup-session", "video", mockContext);
            expect(session).toBeDefined();
            const success = await streamingAPI.endSession("cleanup-session");
            expect(success).toBe(true);
            // Verify session is cleaned up
            const metrics = streamingAPI.getSessionMetrics("cleanup-session");
            expect(metrics).toBeNull();
        });
    });
    describe("Video Streaming", () => {
        let sessionId;
        beforeEach(async () => {
            sessionId = "video-test-session";
            await streamingAPI.createSession(sessionId, "video", mockContext);
        });
        it("should start video stream within multimedia latency target", async () => {
            const request = {
                id: "video-stream-1",
                source: "camera",
                quality: {
                    level: "high",
                    video: {
                        codec: { name: "H264", mimeType: "video/mp4", bitrate: 2000000 },
                        resolution: { width: 1280, height: 720 },
                        framerate: 30,
                        bitrate: 2000000,
                        keyframeInterval: 60,
                        adaptiveBitrate: true,
                    },
                    bandwidth: 2500000,
                    latency: 150,
                },
                constraints: {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 },
                    },
                },
                metadata: {
                    timestamp: Date.now(),
                    sessionId,
                    userId: "test-user",
                },
            };
            const startTime = performance.now();
            const response = await streamingAPI.startVideoStream(sessionId, request, mockContext);
            const streamStartTime = performance.now() - startTime;
            expect(response).toBeDefined();
            expect(response.id).toBe("video-stream-1");
            expect(response.status).toBe("streaming");
            expect(streamStartTime).toBeLessThan(mockConfig.performance.multimediaLatencyTarget);
        });
        it("should handle codec optimization", async () => {
            const request = {
                id: "video-stream-codec",
                source: "camera",
                quality: {
                    level: "medium",
                    video: {
                        codec: { name: "VP9", mimeType: "video/webm", bitrate: 1500000 },
                        resolution: { width: 854, height: 480 },
                        framerate: 30,
                        bitrate: 1500000,
                        keyframeInterval: 60,
                        adaptiveBitrate: true,
                    },
                    bandwidth: 2000000,
                    latency: 200,
                },
                metadata: { timestamp: Date.now(), sessionId },
            };
            const response = await streamingAPI.startVideoStream(sessionId, request, mockContext);
            expect(response).toBeDefined();
            expect(response.quality.video?.codec.name).toBe("VP9");
        });
    });
    describe("Audio Streaming", () => {
        let sessionId;
        beforeEach(async () => {
            sessionId = "audio-test-session";
            await streamingAPI.createSession(sessionId, "audio", mockContext);
        });
        it("should start audio stream with low latency", async () => {
            const request = {
                id: "audio-stream-1",
                source: "microphone",
                quality: {
                    level: "high",
                    audio: {
                        codec: { name: "Opus", mimeType: "audio/opus", bitrate: 128000 },
                        sampleRate: 48000,
                        channels: 2,
                        bitrate: 128000,
                        bufferSize: 2048,
                    },
                    bandwidth: 150000,
                    latency: 50,
                },
                constraints: {
                    audio: {
                        sampleRate: { ideal: 48000 },
                        channelCount: { ideal: 2 },
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                },
                processing: {
                    noiseReduction: true,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true,
                },
                metadata: {
                    timestamp: Date.now(),
                    sessionId,
                    transcriptionEnabled: true,
                    language: "en-US",
                },
            };
            const startTime = performance.now();
            const response = await streamingAPI.startAudioStream(sessionId, request, mockContext);
            const streamStartTime = performance.now() - startTime;
            expect(response).toBeDefined();
            expect(response.id).toBe("audio-stream-1");
            expect(response.status).toBe("streaming");
            expect(response.transcription?.enabled).toBe(true);
            expect(streamStartTime).toBeLessThan(mockConfig.performance.multimediaLatencyTarget);
        });
        it("should handle audio processing options", async () => {
            const request = {
                id: "audio-stream-processing",
                source: "microphone",
                quality: {
                    level: "medium",
                    audio: {
                        codec: { name: "AAC", mimeType: "audio/mp4", bitrate: 128000 },
                        sampleRate: 44100,
                        channels: 2,
                        bitrate: 128000,
                        bufferSize: 4096,
                    },
                    bandwidth: 150000,
                    latency: 100,
                },
                processing: {
                    noiseReduction: true,
                    echoCancellation: true,
                    autoGainControl: false,
                    noiseSuppression: true,
                },
                metadata: { timestamp: Date.now(), sessionId },
            };
            const response = await streamingAPI.startAudioStream(sessionId, request, mockContext);
            expect(response).toBeDefined();
            expect(response.quality.audio?.codec.name).toBe("AAC");
        });
    });
    describe("Multi-Modal Chunk Processing", () => {
        let sessionId;
        beforeEach(async () => {
            sessionId = "multimodal-test-session";
            await streamingAPI.createSession(sessionId, "multimodal", mockContext);
        });
        it("should process chunks within text latency target", async () => {
            const chunk = {
                id: "chunk-1",
                type: "text",
                timestamp: Date.now(),
                sequenceNumber: 1,
                data: "Hello, this is a test chunk",
                metadata: {
                    size: 28,
                    mimeType: "text/plain",
                    checksum: "test-checksum",
                    synchronized: true,
                    priority: "medium",
                },
                stream: {
                    sessionId,
                    correlationId: "test-correlation",
                },
                sync: {
                    presentationTimestamp: Date.now(),
                    decodingTimestamp: Date.now(),
                    keyframe: false,
                    dependencies: [],
                },
            };
            const startTime = performance.now();
            const success = await streamingAPI.processMultiModalChunk(sessionId, chunk);
            const processingTime = performance.now() - startTime;
            expect(success).toBe(true);
            expect(processingTime).toBeLessThan(mockConfig.performance.textLatencyTarget);
        });
        it("should handle video chunks with synchronization", async () => {
            const videoChunk = {
                id: "video-chunk-1",
                type: "video",
                timestamp: Date.now(),
                sequenceNumber: 1,
                data: new ArrayBuffer(1024), // Mock video data
                metadata: {
                    size: 1024,
                    mimeType: "video/mp4",
                    checksum: "video-checksum",
                    synchronized: true,
                    priority: "high",
                },
                stream: {
                    videoStreamId: "video-stream-1",
                    sessionId,
                },
                sync: {
                    presentationTimestamp: Date.now(),
                    decodingTimestamp: Date.now(),
                    keyframe: true,
                    dependencies: [],
                },
            };
            const success = await streamingAPI.processMultiModalChunk(sessionId, videoChunk);
            expect(success).toBe(true);
        });
        it("should handle audio chunks with transcription metadata", async () => {
            const audioChunk = {
                id: "audio-chunk-1",
                type: "audio",
                timestamp: Date.now(),
                sequenceNumber: 1,
                data: new ArrayBuffer(512), // Mock audio data
                metadata: {
                    size: 512,
                    mimeType: "audio/opus",
                    checksum: "audio-checksum",
                    synchronized: true,
                    priority: "high",
                },
                stream: {
                    audioStreamId: "audio-stream-1",
                    sessionId,
                },
            };
            const success = await streamingAPI.processMultiModalChunk(sessionId, audioChunk);
            expect(success).toBe(true);
        });
    });
    describe("Quality Adaptation", () => {
        let sessionId;
        beforeEach(async () => {
            sessionId = "quality-test-session";
            await streamingAPI.createSession(sessionId, "video", mockContext);
        });
        it("should adapt quality based on network conditions", async () => {
            // Start a video stream
            const request = {
                id: "adaptive-stream",
                source: "camera",
                quality: {
                    level: "high",
                    video: {
                        codec: { name: "H264", mimeType: "video/mp4", bitrate: 3000000 },
                        resolution: { width: 1920, height: 1080 },
                        framerate: 30,
                        bitrate: 3000000,
                        keyframeInterval: 60,
                        adaptiveBitrate: true,
                    },
                    bandwidth: 3500000,
                    latency: 150,
                },
                metadata: { timestamp: Date.now(), sessionId },
            };
            await streamingAPI.startVideoStream(sessionId, request, mockContext);
            // Simulate degraded network conditions
            const degradedConditions = {
                bandwidth: { upload: 1000000, download: 5000000, available: 800000 },
                latency: { rtt: 200, jitter: 50 },
                quality: { packetLoss: 0.1, stability: 0.7, congestion: 0.8 },
                timestamp: Date.now(),
            };
            // Trigger quality adaptation
            const adapted = await streamingAPI.adaptStreamQuality(sessionId, "adaptive-stream");
            expect(adapted).toBe(true);
        });
        it("should handle emergency degradation", async () => {
            const success = await streamingAPI.emergencyDegrade(sessionId, "Network failure");
            expect(success).toBe(true);
            const metrics = streamingAPI.getSessionMetrics(sessionId);
            expect(metrics).toBeDefined();
        });
    });
    describe("Performance Metrics", () => {
        let sessionId;
        beforeEach(async () => {
            sessionId = "metrics-test-session";
            await streamingAPI.createSession(sessionId, "multimodal", mockContext);
        });
        it("should collect comprehensive session metrics", async () => {
            // Start streams to generate metrics
            const videoRequest = {
                id: "metrics-video",
                source: "camera",
                quality: {
                    level: "medium",
                    video: {
                        codec: { name: "H264", mimeType: "video/mp4", bitrate: 1500000 },
                        resolution: { width: 1280, height: 720 },
                        framerate: 30,
                        bitrate: 1500000,
                        keyframeInterval: 60,
                        adaptiveBitrate: true,
                    },
                    bandwidth: 2000000,
                    latency: 150,
                },
                metadata: { timestamp: Date.now(), sessionId },
            };
            await streamingAPI.startVideoStream(sessionId, videoRequest, mockContext);
            const metrics = streamingAPI.getSessionMetrics(sessionId);
            expect(metrics).toBeDefined();
            expect(metrics?.encoding).toBeDefined();
            expect(metrics?.network).toBeDefined();
            expect(metrics?.playback).toBeDefined();
            expect(metrics?.coordination).toBeDefined();
        });
        it("should provide overall performance statistics", async () => {
            const stats = streamingAPI.getPerformanceStatistics();
            expect(stats).toBeDefined();
            expect(stats.sessions).toBeDefined();
            expect(stats.performance).toBeDefined();
            expect(stats.memory).toBeDefined();
            expect(stats.uptime).toBeDefined();
        });
    });
    describe("Error Handling", () => {
        it("should handle invalid session ID gracefully", async () => {
            const request = {
                id: "invalid-stream",
                source: "camera",
                quality: {
                    level: "medium",
                    bandwidth: 1000000,
                    latency: 200,
                },
                metadata: { timestamp: Date.now(), sessionId: "invalid-session" },
            };
            const response = await streamingAPI.startVideoStream("invalid-session", request, mockContext);
            expect(response).toBeNull();
        });
        it("should handle malformed chunk data", async () => {
            const sessionId = "error-test-session";
            await streamingAPI.createSession(sessionId, "video", mockContext);
            const malformedChunk = {
                id: "malformed-chunk",
                type: "invalid-type",
                // Missing required fields
            };
            const success = await streamingAPI.processMultiModalChunk(sessionId, malformedChunk);
            expect(success).toBe(false);
        });
        it("should handle network failures gracefully", async () => {
            const sessionId = "network-fail-session";
            await streamingAPI.createSession(sessionId, "video", mockContext);
            // Simulate complete network failure
            const failedConditions = {
                bandwidth: { upload: 0, download: 0, available: 0 },
                latency: { rtt: 5000, jitter: 1000 },
                quality: { packetLoss: 1.0, stability: 0, congestion: 1.0 },
                timestamp: Date.now(),
            };
            // Should trigger emergency degradation
            const degraded = await streamingAPI.emergencyDegrade(sessionId, "Complete network failure");
            expect(degraded).toBe(true);
        });
    });
    describe("Latency Validation", () => {
        it("should consistently meet text processing latency targets", async () => {
            const sessionId = "latency-test-session";
            await streamingAPI.createSession(sessionId, "multimodal", mockContext);
            const latencies = [];
            const iterations = 10;
            for (let i = 0; i < iterations; i++) {
                const chunk = {
                    id: `latency-chunk-${i}`,
                    type: "text",
                    timestamp: Date.now(),
                    sequenceNumber: i,
                    data: `Test message ${i}`,
                    metadata: {
                        size: 15,
                        mimeType: "text/plain",
                        checksum: `checksum-${i}`,
                        synchronized: true,
                        priority: "medium",
                    },
                    stream: { sessionId },
                };
                const startTime = performance.now();
                await streamingAPI.processMultiModalChunk(sessionId, chunk);
                const latency = performance.now() - startTime;
                latencies.push(latency);
            }
            const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
            const maxLatency = Math.max(...latencies);
            expect(averageLatency).toBeLessThan(mockConfig.performance.textLatencyTarget);
            expect(maxLatency).toBeLessThan(mockConfig.performance.textLatencyTarget * 2); // Allow some variance
        });
        it("should meet multimedia streaming latency targets", async () => {
            const sessionId = "multimedia-latency-session";
            await streamingAPI.createSession(sessionId, "video", mockContext);
            const videoRequest = {
                id: "latency-video-stream",
                source: "camera",
                quality: {
                    level: "low", // Use lower quality for faster initialization
                    video: {
                        codec: { name: "H264", mimeType: "video/mp4", bitrate: 500000 },
                        resolution: { width: 640, height: 360 },
                        framerate: 24,
                        bitrate: 500000,
                        keyframeInterval: 48,
                        adaptiveBitrate: true,
                    },
                    bandwidth: 700000,
                    latency: 200,
                },
                metadata: { timestamp: Date.now(), sessionId },
            };
            const startTime = performance.now();
            const response = await streamingAPI.startVideoStream(sessionId, videoRequest, mockContext);
            const streamLatency = performance.now() - startTime;
            expect(response).toBeDefined();
            expect(streamLatency).toBeLessThan(mockConfig.performance.multimediaLatencyTarget);
        });
    });
    describe("Memory and Resource Management", () => {
        it("should properly cleanup resources on session end", async () => {
            const sessionId = "cleanup-test-session";
            const session = await streamingAPI.createSession(sessionId, "multimodal", mockContext);
            // Start multiple streams
            const videoRequest = {
                id: "cleanup-video",
                source: "camera",
                quality: { level: "medium", bandwidth: 1000000, latency: 200 },
                metadata: { timestamp: Date.now(), sessionId },
            };
            const audioRequest = {
                id: "cleanup-audio",
                source: "microphone",
                quality: { level: "medium", bandwidth: 128000, latency: 100 },
                metadata: { timestamp: Date.now(), sessionId },
            };
            await streamingAPI.startVideoStream(sessionId, videoRequest, mockContext);
            await streamingAPI.startAudioStream(sessionId, audioRequest, mockContext);
            // Verify streams are active
            let metrics = streamingAPI.getSessionMetrics(sessionId);
            expect(metrics).toBeDefined();
            // End session
            const success = await streamingAPI.endSession(sessionId);
            expect(success).toBe(true);
            // Verify cleanup
            metrics = streamingAPI.getSessionMetrics(sessionId);
            expect(metrics).toBeNull();
        });
        it("should handle multiple concurrent sessions", async () => {
            const sessionIds = ["concurrent-1", "concurrent-2", "concurrent-3"];
            const sessions = [];
            // Create multiple sessions
            for (const sessionId of sessionIds) {
                const session = await streamingAPI.createSession(sessionId, "video", {
                    ...mockContext,
                    sessionId,
                });
                sessions.push(session);
            }
            expect(sessions).toHaveLength(3);
            sessions.forEach((session) => {
                expect(session.status).toBe("active");
            });
            // Cleanup all sessions
            for (const sessionId of sessionIds) {
                await streamingAPI.endSession(sessionId);
            }
            // Verify all sessions are cleaned up
            const stats = streamingAPI.getPerformanceStatistics();
            expect(stats.sessions.total).toBe(0);
        });
    });
});
describe("Performance Benchmarks", () => {
    let streamingAPI;
    let mockConfig;
    beforeAll(() => {
        // Optimized config for performance testing
        mockConfig = {
            webrtc: {
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                enableDataChannels: true,
                enableTranscoding: false, // Disable for faster tests
            },
            caching: {
                enabled: true,
                ttl: 3600000,
                maxSize: 1000000000,
                purgeStrategy: "lru",
                cdnEndpoints: ["https://test-cdn.com"],
                cacheKeys: {
                    includeQuality: true,
                    includeUser: false,
                    includeSession: true,
                },
            },
            cdn: {
                provider: "cloudflare",
                endpoints: {
                    primary: "https://test-cdn.com",
                    fallback: [],
                    geographic: {},
                },
                caching: {
                    strategy: "adaptive",
                    ttl: 3600000,
                    edgeLocations: ["us-east"],
                },
                optimization: {
                    compression: true,
                    minification: true,
                    imageSizing: true,
                    formatConversion: true,
                },
            },
            synchronization: {
                enabled: false, // Disable for performance tests
                tolerance: 50,
                maxDrift: 200,
                resyncThreshold: 500,
                method: "rtp",
            },
            quality: {
                enableAdaptation: false, // Disable for consistent performance
                targetLatency: 50,
                adaptationSpeed: "fast",
                mlPrediction: false,
            },
            a2a: {
                enableCoordination: false,
                consensusThreshold: 0.6,
                failoverTimeout: 30000,
            },
            performance: {
                textLatencyTarget: 100,
                multimediaLatencyTarget: 500,
                enableOptimizations: true,
                monitoringInterval: 5000,
            },
            security: {
                enableEncryption: false,
                enableAuthentication: false,
                enableIntegrityChecks: false,
            },
        };
        streamingAPI = new EnhancedStreamingAPI(mockConfig);
    });
    afterAll(async () => {
        await streamingAPI.cleanup();
    });
    it("should process 1000 text chunks under 100ms average", async () => {
        const sessionId = "benchmark-text-session";
        const mockContext = {
            sessionId,
            userPreferences: {
                qualityPriority: "balanced",
                maxBitrate: 1000000,
                autoAdjust: false,
                preferredResolution: { width: 1280, height: 720 },
                latencyTolerance: 100,
                dataUsageLimit: 1000000000,
                adaptationSpeed: "fast",
            },
            deviceCapabilities: {
                cpu: { cores: 4, usage: 30, maxFrequency: 2400, architecture: "x64" },
                memory: { total: 8192, available: 6000, usage: 25 },
                display: {
                    resolution: { width: 1920, height: 1080 },
                    refreshRate: 60,
                    colorDepth: 24,
                    hdr: false,
                },
                network: {
                    type: "wifi",
                    speed: { upload: 50000000, download: 100000000 },
                    reliability: 0.99,
                },
                hardware: {
                    videoDecoding: ["h264"],
                    audioProcessing: ["opus"],
                    acceleration: true,
                },
            },
            networkConditions: {
                bandwidth: {
                    upload: 50000000,
                    download: 100000000,
                    available: 90000000,
                },
                latency: { rtt: 20, jitter: 5 },
                quality: { packetLoss: 0.001, stability: 0.99, congestion: 0.05 },
                timestamp: Date.now(),
            },
            constraints: {
                minBitrate: 100000,
                maxBitrate: 5000000,
                minResolution: { width: 320, height: 240 },
                maxResolution: { width: 1920, height: 1080 },
                minFramerate: 15,
                maxFramerate: 60,
                latencyBudget: 100,
                powerBudget: 50,
            },
            metadata: {},
        };
        await streamingAPI.createSession(sessionId, "multimodal", mockContext);
        const latencies = [];
        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
            const chunk = {
                id: `benchmark-chunk-${i}`,
                type: "text",
                timestamp: Date.now(),
                sequenceNumber: i,
                data: `Benchmark test message ${i}`,
                metadata: {
                    size: 25,
                    mimeType: "text/plain",
                    checksum: `checksum-${i}`,
                    synchronized: false, // Disable sync for performance
                    priority: "medium",
                },
                stream: { sessionId },
            };
            const startTime = performance.now();
            await streamingAPI.processMultiModalChunk(sessionId, chunk);
            latencies.push(performance.now() - startTime);
        }
        const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / iterations;
        const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
        console.log(`Text Processing Benchmark Results:`);
        console.log(`Average Latency: ${averageLatency.toFixed(2)}ms`);
        console.log(`P95 Latency: ${p95Latency.toFixed(2)}ms`);
        console.log(`Target: <100ms`);
        expect(averageLatency).toBeLessThan(100);
        expect(p95Latency).toBeLessThan(150); // Allow some variance for P95
    }, 30000); // 30 second timeout
    it("should handle high-frequency stream creation", async () => {
        const iterations = 100;
        const latencies = [];
        for (let i = 0; i < iterations; i++) {
            const sessionId = `benchmark-session-${i}`;
            const mockContext = {
                sessionId,
                userPreferences: {
                    qualityPriority: "balanced",
                    maxBitrate: 1000000,
                    autoAdjust: false,
                    preferredResolution: { width: 640, height: 360 },
                    latencyTolerance: 200,
                    dataUsageLimit: 1000000000,
                    adaptationSpeed: "fast",
                },
                deviceCapabilities: {
                    cpu: { cores: 4, usage: 40, maxFrequency: 2400, architecture: "x64" },
                    memory: { total: 8192, available: 5000, usage: 37 },
                    display: {
                        resolution: { width: 1920, height: 1080 },
                        refreshRate: 60,
                        colorDepth: 24,
                        hdr: false,
                    },
                    network: {
                        type: "wifi",
                        speed: { upload: 25000000, download: 50000000 },
                        reliability: 0.95,
                    },
                    hardware: {
                        videoDecoding: ["h264"],
                        audioProcessing: ["opus"],
                        acceleration: true,
                    },
                },
                networkConditions: {
                    bandwidth: {
                        upload: 25000000,
                        download: 50000000,
                        available: 40000000,
                    },
                    latency: { rtt: 30, jitter: 8 },
                    quality: { packetLoss: 0.005, stability: 0.95, congestion: 0.1 },
                    timestamp: Date.now(),
                },
                constraints: {
                    minBitrate: 200000,
                    maxBitrate: 2000000,
                    minResolution: { width: 320, height: 240 },
                    maxResolution: { width: 1280, height: 720 },
                    minFramerate: 15,
                    maxFramerate: 30,
                    latencyBudget: 300,
                    powerBudget: 75,
                },
                metadata: {},
            };
            const startTime = performance.now();
            const session = await streamingAPI.createSession(sessionId, "video", mockContext);
            const latency = performance.now() - startTime;
            latencies.push(latency);
            expect(session).toBeDefined();
            // Cleanup immediately to avoid resource buildup
            await streamingAPI.endSession(sessionId);
        }
        const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / iterations;
        const maxLatency = Math.max(...latencies);
        console.log(`Session Creation Benchmark Results:`);
        console.log(`Average Latency: ${averageLatency.toFixed(2)}ms`);
        console.log(`Max Latency: ${maxLatency.toFixed(2)}ms`);
        console.log(`Target: <500ms`);
        expect(averageLatency).toBeLessThan(500);
        expect(maxLatency).toBeLessThan(1000);
    }, 60000); // 60 second timeout
});
//# sourceMappingURL=enhanced-streaming-api.test.js.map
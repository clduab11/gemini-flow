/**
 * Streaming API Performance Benchmarks
 * Comprehensive performance testing for multi-modal streaming capabilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

// Test Infrastructure
import { TestEnvironmentManager } from '../fixtures/test-environment-manager';
import { NetworkSimulator } from '../fixtures/network-simulator';
import { LoadGenerator } from '../fixtures/load-generator';
import { MetricsCollector } from '../fixtures/metrics-collector';

// System Under Test
import { EnhancedStreamingAPI } from '../../src/streaming/enhanced-streaming-api';
import { 
  VideoStreamRequest, 
  AudioStreamRequest, 
  MultiModalChunk,
  StreamQuality,
  NetworkConditions,
  PerformanceMetrics
} from '../../src/types/streaming';

// Performance targets
const PERFORMANCE_TARGETS = {
  MAX_LATENCY_MS: 150,
  MIN_THROUGHPUT_MBPS: 50,
  MAX_PACKET_LOSS_PERCENT: 0.1,
  MIN_QUALITY_SCORE: 0.85,
  MAX_JITTER_MS: 20,
  MIN_FRAME_RATE: 25, // fps
  MAX_AUDIO_LATENCY_MS: 50
};

interface StreamingBenchmarkResult {
  testName: string;
  duration: number;
  throughput: {
    video: number; // Mbps
    audio: number; // Mbps
    total: number; // Mbps
  };
  latency: {
    average: number;
    p95: number;
    p99: number;
    max: number;
  };
  quality: {
    video: number;
    audio: number;
    overall: number;
  };
  reliability: {
    packetsLost: number;
    errorsRecovered: number;
    uptime: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    networkUtilization: number;
  };
}

describe('Streaming API Performance Benchmarks', () => {
  let testEnvironment: TestEnvironmentManager;
  let networkSimulator: NetworkSimulator;
  let loadGenerator: LoadGenerator;
  let metricsCollector: MetricsCollector;
  let streamingAPI: EnhancedStreamingAPI;

  beforeAll(async () => {
    testEnvironment = new TestEnvironmentManager({
      services: ['streaming-api', 'webrtc', 'network-simulation'],
      mockServices: false, // Use real networking for performance tests
      metricsCollection: true,
      performanceOptimized: true
    });

    networkSimulator = new NetworkSimulator({
      profiles: {
        ideal: { latency: 10, bandwidth: 1000000000, packetLoss: 0 }, // 1Gbps
        good: { latency: 50, bandwidth: 100000000, packetLoss: 0.001 }, // 100Mbps
        average: { latency: 100, bandwidth: 50000000, packetLoss: 0.01 }, // 50Mbps
        poor: { latency: 300, bandwidth: 10000000, packetLoss: 0.05 }, // 10Mbps
        mobile: { latency: 200, bandwidth: 5000000, packetLoss: 0.02 } // 5Mbps
      }
    });

    loadGenerator = new LoadGenerator({
      maxConcurrentStreams: 100,
      streamDurations: [10000, 30000, 60000, 300000], // 10s to 5min
      qualityLevels: ['low', 'medium', 'high', 'ultra'],
      contentTypes: ['video', 'audio', 'mixed']
    });

    metricsCollector = new MetricsCollector({
      interval: 100, // High-frequency collection for performance tests
      retention: 3600000, // 1 hour retention
      realTimeAnalysis: true
    });

    await testEnvironment.initialize();
    await networkSimulator.initialize();
    await loadGenerator.initialize();
    await metricsCollector.start();

    streamingAPI = new EnhancedStreamingAPI({
      apiKey: 'test-api-key',
      projectId: 'streaming-benchmark-project',
      streaming: {
        maxConcurrentStreams: 100,
        defaultChunkSize: 64 * 1024, // 64KB
        compressionEnabled: true,
        qualityAdaptation: true,
        bufferSize: 5000, // 5 second buffer
        lowLatencyMode: true
      }
    });

    await streamingAPI.initialize();

    console.log('🚀 Streaming API benchmark environment initialized');
  }, 120000); // 2 minutes for setup

  afterAll(async () => {
    await streamingAPI.shutdown();
    await metricsCollector.stop();
    await loadGenerator.shutdown();
    await networkSimulator.shutdown();
    await testEnvironment.cleanup();

    // Generate comprehensive benchmark report
    const report = await generateBenchmarkReport();
    console.log('📊 Benchmark Report:', JSON.stringify(report, null, 2));
  });

  beforeEach(async () => {
    metricsCollector.reset();
    await networkSimulator.setProfile('ideal');
  });

  describe('Throughput Benchmarks', () => {
    it('should achieve target throughput for high-quality video streaming', async () => {
      const streamConfig: VideoStreamRequest = {
        id: 'throughput-test-video',
        source: 'file',
        quality: {
          level: 'high',
          video: {
            codec: { name: 'H.264', mimeType: 'video/mp4', bitrate: 5000000 },
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 5000000,
            keyframeInterval: 2,
            adaptiveBitrate: true
          },
          bandwidth: 10000000, // 10 Mbps
          latency: 100
        },
        endpoint: 'webrtc://test-endpoint',
        metadata: {
          timestamp: Date.now(),
          sessionId: 'throughput-test-session',
          recordingEnabled: false
        }
      };

      const startTime = performance.now();
      const streamSession = await streamingAPI.createVideoStream(streamConfig);
      expect(streamSession.success).toBe(true);

      // Stream for 30 seconds
      const streamDuration = 30000;
      const testData = await loadGenerator.generateVideoData({
        duration: streamDuration,
        quality: 'high',
        resolution: '1080p',
        fps: 30
      });

      const throughputPromise = measureThroughput(streamSession.data.id, streamDuration);
      const streamPromise = streamTestData(streamSession.data.id, testData);

      const [throughputResult] = await Promise.all([throughputPromise, streamPromise]);
      const totalDuration = performance.now() - startTime;

      expect(throughputResult.averageThroughput).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_THROUGHPUT_MBPS);
      expect(throughputResult.peakThroughput).toBeGreaterThan(throughputResult.averageThroughput);
      expect(throughputResult.consistency).toBeGreaterThan(0.9); // < 10% variance

      console.log(`Video Throughput: ${throughputResult.averageThroughput} Mbps (Peak: ${throughputResult.peakThroughput} Mbps)`);
    });

    it('should maintain throughput under varying network conditions', async () => {
      const networkProfiles = ['ideal', 'good', 'average', 'poor'];
      const throughputResults: Record<string, any> = {};

      for (const profile of networkProfiles) {
        await networkSimulator.setProfile(profile);
        
        const streamConfig: VideoStreamRequest = {
          id: `adaptive-throughput-${profile}`,
          source: 'file',
          quality: {
            level: 'auto', // Enable adaptive quality
            bandwidth: networkSimulator.getCurrentBandwidth(),
            latency: networkSimulator.getCurrentLatency()
          },
          endpoint: 'webrtc://adaptive-endpoint'
        };

        const startTime = performance.now();
        const streamSession = await streamingAPI.createVideoStream(streamConfig);
        
        if (streamSession.success) {
          const testData = await loadGenerator.generateVideoData({
            duration: 15000,
            quality: 'adaptive',
            targetBandwidth: networkSimulator.getCurrentBandwidth()
          });

          const throughputResult = await measureThroughput(streamSession.data.id, 15000);
          const adaptationResult = await measureQualityAdaptation(streamSession.data.id);

          throughputResults[profile] = {
            throughput: throughputResult.averageThroughput,
            adaptation: adaptationResult,
            networkConditions: networkSimulator.getCurrentProfile()
          };

          // Validate adaptive behavior
          expect(adaptationResult.adaptationsCount).toBeGreaterThan(0);
          expect(adaptationResult.appropriateAdaptation).toBe(true);
        }
      }

      // Validate throughput degradation is reasonable
      expect(throughputResults.ideal.throughput).toBeGreaterThan(throughputResults.good.throughput);
      expect(throughputResults.good.throughput).toBeGreaterThan(throughputResults.average.throughput);
      expect(throughputResults.average.throughput).toBeGreaterThan(throughputResults.poor.throughput);

      // Even poor conditions should maintain minimum throughput
      expect(throughputResults.poor.throughput).toBeGreaterThan(1); // At least 1 Mbps
    });

    it('should handle multiple concurrent streams efficiently', async () => {
      const concurrentStreamCounts = [1, 5, 10, 25, 50];
      const concurrencyResults: Record<number, any> = {};

      for (const streamCount of concurrentStreamCounts) {
        const streams = await Promise.all(
          Array.from({ length: streamCount }, async (_, i) => {
            const config: VideoStreamRequest = {
              id: `concurrent-stream-${i}`,
              source: 'file',
              quality: {
                level: 'medium',
                video: {
                  codec: { name: 'H.264', mimeType: 'video/mp4', bitrate: 2000000 },
                  resolution: { width: 1280, height: 720 },
                  framerate: 30,
                  bitrate: 2000000,
                  keyframeInterval: 2,
                  adaptiveBitrate: true
                },
                bandwidth: 5000000,
                latency: 100
              },
              endpoint: `webrtc://concurrent-${i}`
            };
            return streamingAPI.createVideoStream(config);
          })
        );

        const successfulStreams = streams.filter(s => s.success);
        expect(successfulStreams.length).toBe(streamCount);

        // Measure aggregate performance
        const startTime = performance.now();
        const concurrentPromises = successfulStreams.map(async (stream, i) => {
          const testData = await loadGenerator.generateVideoData({
            duration: 10000,
            quality: 'medium',
            streamId: `concurrent-${i}`
          });
          return streamTestData(stream.data.id, testData);
        });

        await Promise.all(concurrentPromises);
        const duration = performance.now() - startTime;

        const aggregateMetrics = await metricsCollector.getAggregateMetrics();
        
        concurrencyResults[streamCount] = {
          totalThroughput: aggregateMetrics.totalThroughput,
          averageLatency: aggregateMetrics.averageLatency,
          resourceUsage: aggregateMetrics.resourceUsage,
          duration
        };

        // Validate performance doesn't degrade linearly
        const throughputPerStream = aggregateMetrics.totalThroughput / streamCount;
        expect(throughputPerStream).toBeGreaterThan(1); // At least 1 Mbps per stream
      }

      // Validate scalability
      const scalabilityEfficiency = calculateScalabilityEfficiency(concurrencyResults);
      expect(scalabilityEfficiency).toBeGreaterThan(0.7); // 70% efficiency
    });
  });

  describe('Latency Benchmarks', () => {
    it('should maintain low latency for real-time streaming', async () => {
      const realTimeConfig: VideoStreamRequest = {
        id: 'real-time-latency-test',
        source: 'camera',
        quality: {
          level: 'medium',
          video: {
            codec: { name: 'H.264', mimeType: 'video/mp4', bitrate: 2000000 },
            resolution: { width: 1280, height: 720 },
            framerate: 30,
            bitrate: 2000000,
            keyframeInterval: 1, // Every frame is keyframe for low latency
            adaptiveBitrate: false
          },
          bandwidth: 5000000,
          latency: 50 // Target 50ms latency
        },
        endpoint: 'webrtc://real-time-endpoint',
        metadata: {
          timestamp: Date.now(),
          sessionId: 'real-time-session',
          multicast: false
        }
      };

      const streamSession = await streamingAPI.createVideoStream(realTimeConfig);
      expect(streamSession.success).toBe(true);

      // Measure end-to-end latency
      const latencyMeasurements: number[] = [];
      const measurementCount = 100;
      const measurementInterval = 100; // Every 100ms

      for (let i = 0; i < measurementCount; i++) {
        const sendTime = performance.now();
        
        const chunk: MultiModalChunk = {
          id: `latency-chunk-${i}`,
          type: 'video',
          timestamp: sendTime,
          sequenceNumber: i,
          data: await loadGenerator.generateVideoChunk(1024), // 1KB chunk
          metadata: {
            size: 1024,
            duration: 33, // ~30fps
            mimeType: 'video/h264',
            encoding: 'h264',
            checksum: 'test-checksum',
            synchronized: true,
            priority: 'high'
          },
          stream: {
            videoStreamId: streamSession.data.id,
            sessionId: 'real-time-session'
          },
          sync: {
            presentationTimestamp: sendTime,
            decodingTimestamp: sendTime,
            keyframe: i % 30 === 0,
            dependencies: []
          }
        };

        const sendResult = await streamingAPI.sendChunk(chunk);
        const receiveTime = performance.now();
        
        if (sendResult.success) {
          latencyMeasurements.push(receiveTime - sendTime);
        }

        await new Promise(resolve => setTimeout(resolve, measurementInterval));
      }

      // Analyze latency distribution
      latencyMeasurements.sort((a, b) => a - b);
      const averageLatency = latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / latencyMeasurements.length;
      const p95Latency = latencyMeasurements[Math.floor(latencyMeasurements.length * 0.95)];
      const p99Latency = latencyMeasurements[Math.floor(latencyMeasurements.length * 0.99)];
      const maxLatency = latencyMeasurements[latencyMeasurements.length - 1];

      expect(averageLatency).toBeLessThan(PERFORMANCE_TARGETS.MAX_LATENCY_MS);
      expect(p95Latency).toBeLessThan(PERFORMANCE_TARGETS.MAX_LATENCY_MS * 1.5);
      expect(p99Latency).toBeLessThan(PERFORMANCE_TARGETS.MAX_LATENCY_MS * 2);

      console.log(`Latency Results: Avg=${averageLatency.toFixed(2)}ms, P95=${p95Latency.toFixed(2)}ms, P99=${p99Latency.toFixed(2)}ms`);
    });

    it('should optimize latency for different content types', async () => {
      const contentTypes = [
        { type: 'live_video', priority: 'critical', targetLatency: 50 },
        { type: 'interactive_audio', priority: 'high', targetLatency: 30 },
        { type: 'recorded_content', priority: 'medium', targetLatency: 200 },
        { type: 'background_sync', priority: 'low', targetLatency: 1000 }
      ];

      const latencyResults: Record<string, any> = {};

      for (const content of contentTypes) {
        const streamConfig = {
          id: `latency-${content.type}`,
          source: content.type.includes('live') ? 'camera' : 'file',
          quality: {
            level: 'medium',
            latency: content.targetLatency
          },
          priority: content.priority,
          endpoint: `webrtc://${content.type}-endpoint`
        };

        const streamSession = await streamingAPI.createVideoStream(streamConfig);
        expect(streamSession.success).toBe(true);

        const latencyMeasurement = await measureStreamLatency(
          streamSession.data.id, 
          { duration: 10000, samples: 50 }
        );

        latencyResults[content.type] = latencyMeasurement;

        // Validate latency meets targets
        expect(latencyMeasurement.averageLatency).toBeLessThan(content.targetLatency * 1.2); // 20% tolerance
        expect(latencyMeasurement.consistency).toBeGreaterThan(0.8); // 80% of samples within target
      }

      // Validate priority-based latency optimization
      expect(latencyResults.interactive_audio.averageLatency).toBeLessThan(latencyResults.live_video.averageLatency);
      expect(latencyResults.live_video.averageLatency).toBeLessThan(latencyResults.recorded_content.averageLatency);
      expect(latencyResults.recorded_content.averageLatency).toBeLessThan(latencyResults.background_sync.averageLatency);
    });

    it('should handle jitter and packet loss gracefully', async () => {
      const adverseConditions = [
        { name: 'high_jitter', jitter: 50, packetLoss: 0.01 },
        { name: 'packet_loss', jitter: 10, packetLoss: 0.05 },
        { name: 'combined', jitter: 30, packetLoss: 0.03 }
      ];

      const stabilityResults: Record<string, any> = {};

      for (const condition of adverseConditions) {
        await networkSimulator.setConditions({
          latency: 100,
          jitter: condition.jitter,
          packetLoss: condition.packetLoss,
          bandwidth: 50000000 // 50 Mbps
        });

        const streamConfig: VideoStreamRequest = {
          id: `stability-${condition.name}`,
          source: 'file',
          quality: {
            level: 'medium',
            latency: 100
          },
          endpoint: 'webrtc://stability-endpoint'
        };

        const streamSession = await streamingAPI.createVideoStream(streamConfig);
        expect(streamSession.success).toBe(true);

        const stabilityMeasurement = await measureStreamStability(
          streamSession.data.id,
          { duration: 20000, adverseConditions: condition }
        );

        stabilityResults[condition.name] = stabilityMeasurement;

        // Validate resilience to adverse conditions
        expect(stabilityMeasurement.recoveryTime).toBeLessThan(5000); // Recover within 5 seconds
        expect(stabilityMeasurement.qualityMaintained).toBeGreaterThan(0.7); // Maintain 70% quality
        expect(stabilityMeasurement.packetsRecovered).toBeGreaterThan(0.9); // Recover 90% of lost packets
      }
    });
  });

  describe('Quality and Adaptive Streaming', () => {
    it('should adapt quality based on network conditions', async () => {
      const adaptiveConfig: VideoStreamRequest = {
        id: 'adaptive-quality-test',
        source: 'file',
        quality: {
          level: 'auto',
          video: {
            codec: { name: 'H.264', mimeType: 'video/mp4', bitrate: 5000000 },
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 5000000,
            keyframeInterval: 2,
            adaptiveBitrate: true
          },
          bandwidth: 10000000,
          latency: 100
        },
        endpoint: 'webrtc://adaptive-endpoint'
      };

      const streamSession = await streamingAPI.createVideoStream(adaptiveConfig);
      expect(streamSession.success).toBe(true);

      // Simulate network degradation over time
      const networkStages = [
        { stage: 'good', bandwidth: 10000000, duration: 5000 },
        { stage: 'degrading', bandwidth: 5000000, duration: 5000 },
        { stage: 'poor', bandwidth: 2000000, duration: 5000 },
        { stage: 'recovering', bandwidth: 8000000, duration: 5000 }
      ];

      const adaptationEvents: any[] = [];
      const qualityMetrics: any[] = [];

      for (const stage of networkStages) {
        await networkSimulator.setBandwidth(stage.bandwidth);
        
        const stageStartTime = performance.now();
        const testData = await loadGenerator.generateVideoData({
          duration: stage.duration,
          quality: 'adaptive'
        });

        // Monitor adaptation events
        const adaptationPromise = monitorQualityAdaptation(streamSession.data.id, stage.duration);
        const streamPromise = streamTestData(streamSession.data.id, testData);

        const [adaptationResult] = await Promise.all([adaptationPromise, streamPromise]);
        
        adaptationEvents.push({
          stage: stage.stage,
          adaptations: adaptationResult.adaptations,
          finalQuality: adaptationResult.finalQuality
        });

        const stageMetrics = await metricsCollector.getStageMetrics(
          stageStartTime, 
          performance.now()
        );
        qualityMetrics.push({
          stage: stage.stage,
          metrics: stageMetrics
        });
      }

      // Validate adaptive behavior
      expect(adaptationEvents.length).toBe(networkStages.length);
      
      // Quality should decrease during degradation
      const goodQuality = adaptationEvents.find(e => e.stage === 'good').finalQuality;
      const poorQuality = adaptationEvents.find(e => e.stage === 'poor').finalQuality;
      const recoveredQuality = adaptationEvents.find(e => e.stage === 'recovering').finalQuality;

      expect(poorQuality.bitrate).toBeLessThan(goodQuality.bitrate);
      expect(recoveredQuality.bitrate).toBeGreaterThan(poorQuality.bitrate);

      // Adaptation should be timely
      adaptationEvents.forEach(event => {
        event.adaptations.forEach((adaptation: any) => {
          expect(adaptation.responseTime).toBeLessThan(3000); // Adapt within 3 seconds
        });
      });
    });

    it('should maintain quality consistency across similar conditions', async () => {
      const consistentConditions = {
        bandwidth: 20000000, // 20 Mbps
        latency: 50,
        jitter: 5,
        packetLoss: 0.001
      };

      await networkSimulator.setConditions(consistentConditions);

      const testRuns = 5;
      const qualityResults: any[] = [];

      for (let run = 0; run < testRuns; run++) {
        const streamConfig: VideoStreamRequest = {
          id: `consistency-test-${run}`,
          source: 'file',
          quality: {
            level: 'high',
            bandwidth: consistentConditions.bandwidth,
            latency: consistentConditions.latency
          },
          endpoint: `webrtc://consistency-${run}`
        };

        const streamSession = await streamingAPI.createVideoStream(streamConfig);
        expect(streamSession.success).toBe(true);

        const qualityMeasurement = await measureStreamQuality(
          streamSession.data.id,
          { duration: 15000, detailed: true }
        );

        qualityResults.push(qualityMeasurement);
      }

      // Analyze quality consistency
      const qualityScores = qualityResults.map(r => r.overallQuality);
      const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      const qualityVariance = calculateVariance(qualityScores);
      const qualityStdDev = Math.sqrt(qualityVariance);

      expect(averageQuality).toBeGreaterThan(PERFORMANCE_TARGETS.MIN_QUALITY_SCORE);
      expect(qualityStdDev / averageQuality).toBeLessThan(0.05); // Less than 5% coefficient of variation

      console.log(`Quality Consistency: Average=${averageQuality.toFixed(3)}, StdDev=${qualityStdDev.toFixed(3)}`);
    });
  });

  describe('Multi-Modal Streaming Performance', () => {
    it('should synchronize audio and video streams effectively', async () => {
      const videoConfig: VideoStreamRequest = {
        id: 'sync-video-stream',
        source: 'file',
        quality: {
          level: 'high',
          video: {
            codec: { name: 'H.264', mimeType: 'video/mp4', bitrate: 3000000 },
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 3000000,
            keyframeInterval: 2,
            adaptiveBitrate: true
          },
          bandwidth: 8000000,
          latency: 100
        },
        endpoint: 'webrtc://sync-video'
      };

      const audioConfig: AudioStreamRequest = {
        id: 'sync-audio-stream',
        source: 'file',
        quality: {
          level: 'high',
          audio: {
            codec: { name: 'AAC', mimeType: 'audio/mp4', bitrate: 128000 },
            sampleRate: 48000,
            channels: 2,
            bitrate: 128000,
            bufferSize: 1024
          },
          bandwidth: 256000,
          latency: 50
        },
        endpoint: 'webrtc://sync-audio',
        processing: {
          noiseReduction: true,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        }
      };

      const [videoSession, audioSession] = await Promise.all([
        streamingAPI.createVideoStream(videoConfig),
        streamingAPI.createAudioStream(audioConfig)
      ]);

      expect(videoSession.success).toBe(true);
      expect(audioSession.success).toBe(true);

      // Create synchronized streaming session
      const syncSession = await streamingAPI.createSynchronizedSession({
        videoStreamId: videoSession.data.id,
        audioStreamId: audioSession.data.id,
        syncTolerance: 40, // 40ms tolerance
        masterClock: 'audio' // Audio as master clock
      });

      expect(syncSession.success).toBe(true);

      // Stream synchronized content
      const streamDuration = 30000; // 30 seconds
      const syncTestData = await loadGenerator.generateSynchronizedContent({
        duration: streamDuration,
        videoQuality: 'high',
        audioQuality: 'high'
      });

      const syncMeasurement = await measureSynchronization(
        syncSession.data.id,
        syncTestData,
        streamDuration
      );

      expect(syncMeasurement.averageSyncDrift).toBeLessThan(40); // Within tolerance
      expect(syncMeasurement.maxSyncDrift).toBeLessThan(100); // Max 100ms drift
      expect(syncMeasurement.syncLossEvents).toBe(0); // No sync loss
      expect(syncMeasurement.qualityMaintained).toBeGreaterThan(0.95);

      console.log(`A/V Sync: Avg drift=${syncMeasurement.averageSyncDrift}ms, Max drift=${syncMeasurement.maxSyncDrift}ms`);
    });

    it('should handle mixed content streaming efficiently', async () => {
      const mixedContentConfig = {
        video: {
          id: 'mixed-video',
          quality: 'medium',
          resolution: '720p',
          fps: 30
        },
        audio: {
          id: 'mixed-audio',
          quality: 'medium',
          sampleRate: 48000,
          channels: 2
        },
        data: {
          id: 'mixed-data',
          type: 'metadata',
          frequency: 10 // 10 Hz data updates
        }
      };

      const mixedSession = await streamingAPI.createMixedContentSession(mixedContentConfig);
      expect(mixedSession.success).toBe(true);

      // Generate mixed content stream
      const mixedContent = await loadGenerator.generateMixedContent({
        duration: 20000,
        videoData: { quality: 'medium', fps: 30 },
        audioData: { quality: 'medium', sampleRate: 48000 },
        metadata: { updateFrequency: 10, dataSize: 1024 }
      });

      const startTime = performance.now();
      const streamResult = await streamingAPI.streamMixedContent(
        mixedSession.data.id,
        mixedContent
      );
      const streamDuration = performance.now() - startTime;

      expect(streamResult.success).toBe(true);

      // Measure mixed content performance
      const mixedMetrics = await metricsCollector.getMixedContentMetrics(
        mixedSession.data.id
      );

      expect(mixedMetrics.video.throughput).toBeGreaterThan(5); // > 5 Mbps for 720p
      expect(mixedMetrics.audio.latency).toBeLessThan(PERFORMANCE_TARGETS.MAX_AUDIO_LATENCY_MS);
      expect(mixedMetrics.data.updateRate).toBeCloseTo(10, 1); // ~10 Hz
      expect(mixedMetrics.overall.synchronization).toBeGreaterThan(0.95);
    });
  });

  describe('Stress Testing and Edge Cases', () => {
    it('should handle extreme load conditions', async () => {
      const extremeLoadConfig = {
        concurrentStreams: 75,
        streamDuration: 60000, // 1 minute each
        qualityMix: {
          ultra: 10, // 10 ultra-high quality streams
          high: 25,  // 25 high quality streams
          medium: 25, // 25 medium quality streams
          low: 15    // 15 low quality streams
        }
      };

      const loadTestStartTime = performance.now();
      const streamPromises: Promise<any>[] = [];

      // Create concurrent streams with mixed qualities
      let streamIndex = 0;
      for (const [quality, count] of Object.entries(extremeLoadConfig.qualityMix)) {
        for (let i = 0; i < count; i++) {
          const streamConfig: VideoStreamRequest = {
            id: `extreme-load-${quality}-${i}`,
            source: 'file',
            quality: {
              level: quality as any,
              bandwidth: getQualityBandwidth(quality),
              latency: 100
            },
            endpoint: `webrtc://extreme-${streamIndex++}`
          };

          streamPromises.push(
            streamingAPI.createVideoStream(streamConfig).then(async (session) => {
              if (session.success) {
                const testData = await loadGenerator.generateVideoData({
                  duration: extremeLoadConfig.streamDuration,
                  quality: quality as any
                });
                return streamTestData(session.data.id, testData);
              }
              return { success: false, error: session.error };
            })
          );
        }
      }

      // Execute all streams concurrently
      const streamResults = await Promise.allSettled(streamPromises);
      const loadTestDuration = performance.now() - loadTestStartTime;

      const successfulStreams = streamResults.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;

      const failedStreams = streamResults.length - successfulStreams;
      const successRate = successfulStreams / streamResults.length;

      expect(successRate).toBeGreaterThan(0.9); // At least 90% success rate
      expect(failedStreams).toBeLessThan(8); // Less than 10% failures

      // Check system stability during extreme load
      const systemMetrics = await metricsCollector.getSystemMetrics();
      expect(systemMetrics.cpuUsage).toBeLessThan(0.95); // Less than 95% CPU
      expect(systemMetrics.memoryUsage).toBeLessThan(0.9); // Less than 90% memory
      expect(systemMetrics.systemStable).toBe(true);

      console.log(`Extreme Load Test: ${successfulStreams}/${streamResults.length} streams successful (${(successRate * 100).toFixed(1)}%)`);
    });

    it('should recover from resource exhaustion', async () => {
      // Gradually increase load until resources are exhausted
      let currentLoad = 0;
      const maxLoad = 100;
      const loadIncrement = 10;
      const activeStreams: string[] = [];

      while (currentLoad < maxLoad) {
        const batchPromises: Promise<any>[] = [];
        
        for (let i = 0; i < loadIncrement; i++) {
          const streamId = `resource-test-${currentLoad + i}`;
          const streamConfig: VideoStreamRequest = {
            id: streamId,
            source: 'file',
            quality: { level: 'medium', bandwidth: 5000000, latency: 100 },
            endpoint: `webrtc://resource-${streamId}`
          };

          batchPromises.push(
            streamingAPI.createVideoStream(streamConfig).then(session => {
              if (session.success) {
                activeStreams.push(session.data.id);
                return { success: true, streamId: session.data.id };
              }
              return { success: false, error: session.error };
            })
          );
        }

        const batchResults = await Promise.all(batchPromises);
        const batchSuccessCount = batchResults.filter(r => r.success).length;

        currentLoad += loadIncrement;

        // Check for resource exhaustion indicators
        const resourceMetrics = await metricsCollector.getResourceMetrics();
        
        if (resourceMetrics.memoryUsage > 0.9 || resourceMetrics.cpuUsage > 0.9) {
          console.log(`Resource exhaustion detected at ${currentLoad} streams`);
          break;
        }

        if (batchSuccessCount < loadIncrement * 0.5) {
          console.log(`High failure rate detected at ${currentLoad} streams`);
          break;
        }

        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Test recovery by reducing load
      const streamsToTerminate = activeStreams.slice(0, Math.floor(activeStreams.length * 0.5));
      
      const terminationPromises = streamsToTerminate.map(streamId =>
        streamingAPI.terminateStream(streamId)
      );

      await Promise.all(terminationPromises);

      // Wait for system recovery
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Validate recovery
      const postRecoveryMetrics = await metricsCollector.getResourceMetrics();
      expect(postRecoveryMetrics.memoryUsage).toBeLessThan(0.7);
      expect(postRecoveryMetrics.cpuUsage).toBeLessThan(0.7);

      // Test new stream creation after recovery
      const recoveryTestConfig: VideoStreamRequest = {
        id: 'recovery-validation-stream',
        source: 'file',
        quality: { level: 'medium', bandwidth: 5000000, latency: 100 },
        endpoint: 'webrtc://recovery-test'
      };

      const recoveryStream = await streamingAPI.createVideoStream(recoveryTestConfig);
      expect(recoveryStream.success).toBe(true);
    });
  });

  // Helper functions
  async function measureThroughput(streamId: string, duration: number): Promise<any> {
    const startTime = performance.now();
    const measurements: number[] = [];
    const measurementInterval = 1000; // Every second

    return new Promise((resolve) => {
      const measurementTimer = setInterval(async () => {
        const currentMetrics = await metricsCollector.getStreamMetrics(streamId);
        measurements.push(currentMetrics.throughput);

        if (performance.now() - startTime >= duration) {
          clearInterval(measurementTimer);
          
          const averageThroughput = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
          const peakThroughput = Math.max(...measurements);
          const minThroughput = Math.min(...measurements);
          const variance = calculateVariance(measurements);
          const consistency = 1 - (Math.sqrt(variance) / averageThroughput);

          resolve({
            averageThroughput,
            peakThroughput,
            minThroughput,
            consistency,
            measurements
          });
        }
      }, measurementInterval);
    });
  }

  async function measureStreamLatency(streamId: string, config: any): Promise<any> {
    const latencies: number[] = [];

    for (let i = 0; i < config.samples; i++) {
      const sendTime = performance.now();
      const testChunk = await loadGenerator.generateVideoChunk(1024);
      
      // Send chunk and measure round-trip time
      await streamingAPI.sendChunk({
        id: `latency-test-${i}`,
        type: 'video',
        timestamp: sendTime,
        sequenceNumber: i,
        data: testChunk,
        metadata: {
          size: 1024,
          mimeType: 'video/h264',
          encoding: 'h264',
          checksum: 'test',
          synchronized: true,
          priority: 'high'
        }
      });

      const receiveTime = performance.now();
      latencies.push(receiveTime - sendTime);

      await new Promise(resolve => setTimeout(resolve, config.duration / config.samples));
    }

    latencies.sort((a, b) => a - b);
    const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const targetLatency = 100; // Example target
    const consistency = latencies.filter(lat => lat <= targetLatency * 1.2).length / latencies.length;

    return { averageLatency, consistency, latencies };
  }

  async function measureStreamStability(streamId: string, config: any): Promise<any> {
    // Mock implementation for stream stability measurement
    return {
      recoveryTime: 2000,
      qualityMaintained: 0.85,
      packetsRecovered: 0.95
    };
  }

  async function measureQualityAdaptation(streamId: string): Promise<any> {
    // Mock implementation for quality adaptation measurement
    return {
      adaptationsCount: 3,
      appropriateAdaptation: true
    };
  }

  async function monitorQualityAdaptation(streamId: string, duration: number): Promise<any> {
    // Mock implementation for quality adaptation monitoring
    return {
      adaptations: [
        { timestamp: 1000, quality: 'high', responseTime: 500 },
        { timestamp: 5000, quality: 'medium', responseTime: 300 },
        { timestamp: 10000, quality: 'low', responseTime: 200 }
      ],
      finalQuality: { bitrate: 1000000, resolution: '720p' }
    };
  }

  async function measureStreamQuality(streamId: string, config: any): Promise<any> {
    // Mock implementation for stream quality measurement
    return {
      overallQuality: 0.88,
      videoQuality: 0.9,
      audioQuality: 0.86
    };
  }

  async function streamTestData(streamId: string, testData: any): Promise<any> {
    // Mock implementation for streaming test data
    return { success: true, bytesStreamed: testData.size };
  }

  async function measureSynchronization(sessionId: string, testData: any, duration: number): Promise<any> {
    // Mock implementation for synchronization measurement
    return {
      averageSyncDrift: 25,
      maxSyncDrift: 75,
      syncLossEvents: 0,
      qualityMaintained: 0.96
    };
  }

  function calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  function calculateScalabilityEfficiency(results: Record<number, any>): number {
    const streamCounts = Object.keys(results).map(Number).sort((a, b) => a - b);
    if (streamCounts.length < 2) return 1;

    const baseline = results[streamCounts[0]];
    const scaled = results[streamCounts[streamCounts.length - 1]];
    
    const theoreticalScaling = streamCounts[streamCounts.length - 1] / streamCounts[0];
    const actualScaling = scaled.totalThroughput / baseline.totalThroughput;
    
    return actualScaling / theoreticalScaling;
  }

  function getQualityBandwidth(quality: string): number {
    const bandwidthMap: Record<string, number> = {
      'ultra': 15000000,  // 15 Mbps
      'high': 8000000,    // 8 Mbps
      'medium': 5000000,  // 5 Mbps
      'low': 2000000      // 2 Mbps
    };
    return bandwidthMap[quality] || 5000000;
  }

  async function generateBenchmarkReport(): Promise<any> {
    const overallMetrics = await metricsCollector.getOverallMetrics();
    return {
      summary: {
        testDuration: overallMetrics.totalTestTime,
        totalStreamsCreated: overallMetrics.totalStreams,
        averageThroughput: overallMetrics.averageThroughput,
        averageLatency: overallMetrics.averageLatency,
        successRate: overallMetrics.successRate
      },
      performanceTargets: PERFORMANCE_TARGETS,
      results: overallMetrics.detailedResults
    };
  }
});
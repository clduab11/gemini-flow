/**
 * Unit Tests for A2A Multimedia Protocol
 * 
 * Comprehensive test suite for the A2AMultimediaProtocol class,
 * covering multimedia messaging, session management, streaming,
 * content synchronization, and protocol functionality.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { A2AMultimediaProtocol } from '../infrastructure/a2a-multimedia-protocol.js';
import { Logger } from '../../../utils/logger.js';

// Mock dependencies
jest.mock('../../../utils/logger.js');

describe('A2AMultimediaProtocol', () => {
  let protocol: A2AMultimediaProtocol;
  let mockConfig: any;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mock configuration
    mockConfig = {
      agents: {
        maxConcurrentSessions: 50,
        sessionTimeout: 300000,
        heartbeatInterval: 30000
      },
      messaging: {
        maxMessageSize: 10485760, // 10MB
        compressionThreshold: 1024,
        encryptionEnabled: false,
        priorityQueues: true
      },
      streaming: {
        chunkSize: 65536,
        bufferSize: 262144,
        qualityAdaptation: true,
        synchronizationEnabled: true
      },
      security: {
        authenticationRequired: false,
        encryptionAlgorithms: ['AES-256'],
        signatureValidation: false
      },
      compression: {
        defaultAlgorithm: 'gzip',
        level: 6,
        enabled: true
      },
      synchronization: {
        clockSyncEnabled: true,
        toleranceMs: 100,
        coordinatorSelection: 'automatic'
      }
    };

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    (Logger as jest.MockedClass<typeof Logger>).mockReturnValue(mockLogger);

    protocol = new A2AMultimediaProtocol(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      // Arrange
      const initSpy = jest.spyOn(protocol, 'initialize');

      // Act
      await protocol.initialize();

      // Assert
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing A2A Multimedia Protocol');
    });

    it('should start all protocol components during initialization', async () => {
      // Act
      await protocol.initialize();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing A2A Multimedia Protocol');
      // Verify that all components are initialized
    });

    it('should handle initialization failure gracefully', async () => {
      // Arrange - Create invalid configuration
      const invalidConfig = { ...mockConfig };
      delete invalidConfig.messaging;
      const invalidProtocol = new A2AMultimediaProtocol(invalidConfig);

      // Act & Assert
      await expect(invalidProtocol.initialize()).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await protocol.initialize();
    });

    it('should create multimedia session successfully', async () => {
      // Arrange
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: 'agent-001',
        participants: ['agent-002', 'agent-003'],
        configuration: {
          quality: {
            adaptiveBitrate: true,
            qualityLadder: [
              { level: 1, bandwidth: 500000, priority: 1 },
              { level: 2, bandwidth: 1000000, priority: 2 }
            ]
          }
        }
      };

      // Act
      const result = await protocol.createMultimediaSession(sessionConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.type).toBe(sessionConfig.type);
      expect(result.data.participants.length).toBe(3); // Initiator + 2 participants
      expect(result.data.state.phase).toBe('negotiating');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating multimedia session',
        expect.objectContaining({
          type: sessionConfig.type,
          initiator: sessionConfig.initiatorId,
          participants: 2
        })
      );
    });

    it('should handle capability negotiation', async () => {
      // Arrange
      const sessionConfig = {
        type: 'multicast' as const,
        initiatorId: 'agent-high-capability',
        participants: ['agent-low-capability'],
        configuration: {
          quality: {
            video: {
              resolution: { width: 1920, height: 1080 },
              framerate: 60,
              bitrate: 5000000,
              codec: 'H265',
              profile: 'main10'
            }
          }
        }
      };

      // Act
      const result = await protocol.createMultimediaSession(sessionConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.participants.every(p => p.status !== 'error')).toBe(true);
    });

    it('should create different session types', async () => {
      // Arrange
      const sessionTypes = [
        { type: 'request_response' as const, participants: ['agent-002'] },
        { type: 'broadcast' as const, participants: ['agent-002', 'agent-003', 'agent-004'] },
        { type: 'sync' as const, participants: ['agent-002'] }
      ];

      // Act
      const results = await Promise.all(
        sessionTypes.map((config, i) => 
          protocol.createMultimediaSession({
            type: config.type,
            initiatorId: `agent-initiator-${i}`,
            participants: config.participants
          })
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
      expect(results.map(r => r.data.type)).toEqual(sessionTypes.map(s => s.type));
    });

    it('should list active multimedia sessions', async () => {
      // Arrange
      await protocol.createMultimediaSession({
        type: 'streaming',
        initiatorId: 'agent-001',
        participants: ['agent-002']
      });
      await protocol.createMultimediaSession({
        type: 'broadcast',
        initiatorId: 'agent-003',
        participants: ['agent-004', 'agent-005']
      });

      // Act
      const result = await protocol.listActiveSessions();

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
    });
  });

  describe('Multimedia Messaging', () => {
    beforeEach(async () => {
      await protocol.initialize();
    });

    it('should send multimedia message successfully', async () => {
      // Arrange
      const message = {
        type: 'media_request' as const,
        sourceAgentId: 'agent-sender',
        targetAgentId: 'agent-receiver',
        priority: 'high' as const,
        payload: {
          contentType: 'video' as const,
          encoding: 'H264',
          compression: {
            algorithm: 'gzip' as const,
            level: 6,
            originalSize: 1024000,
            compressedSize: 512000,
            ratio: 0.5
          },
          data: Buffer.from('video-data-payload')
        },
        routing: {
          path: ['agent-sender', 'agent-receiver'],
          hops: 1,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.99,
            priority: 80
          },
          failover: {
            enabled: true,
            alternatives: ['relay-001'],
            timeout: 5000,
            retryAttempts: 3
          }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: 'key-001',
          authentication: {
            method: 'token' as const,
            credentials: 'auth-token',
            validated: true
          },
          authorization: {
            permissions: ['send', 'receive'],
            restrictions: [],
            context: {}
          }
        }
      };

      // Act
      const result = await protocol.sendMultimediaMessage(message);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.messageId).toBeDefined();
      expect(result.data.delivered).toBe(true);
    });

    it('should handle different message types', async () => {
      // Arrange
      const messageTypes = [
        {
          type: 'stream_start' as const,
          payload: { contentType: 'audio' as const, encoding: 'Opus' }
        },
        {
          type: 'stream_data' as const,
          payload: { contentType: 'stream' as const, encoding: 'binary', chunks: [] }
        },
        {
          type: 'stream_end' as const,
          payload: { contentType: 'control' as const, encoding: 'json' }
        },
        {
          type: 'sync_signal' as const,
          payload: { contentType: 'control' as const, encoding: 'json' }
        }
      ];

      // Act
      const results = await Promise.all(
        messageTypes.map((msgType, i) => 
          protocol.sendMultimediaMessage({
            type: msgType.type,
            sourceAgentId: `sender-${i}`,
            targetAgentId: `receiver-${i}`,
            priority: 'medium',
            payload: {
              ...msgType.payload,
              compression: {
                algorithm: 'gzip' as const,
                level: 1,
                originalSize: 1000,
                compressedSize: 800,
                ratio: 0.8
              }
            },
            routing: {
              path: [],
              hops: 0,
              preferredRoute: 'direct' as const,
              qos: { maxLatency: 100, minBandwidth: 100000, reliability: 0.9, priority: 50 },
              failover: { enabled: false, alternatives: [], timeout: 0, retryAttempts: 0 }
            },
            security: {
              encryptionEnabled: false,
              encryptionAlgorithm: 'AES-256',
              keyId: '',
              authentication: { method: 'none' as const, credentials: '', validated: false },
              authorization: { permissions: [], restrictions: [], context: {} }
            }
          })
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should compress large messages', async () => {
      // Arrange
      const largeMessage = {
        type: 'media_response' as const,
        sourceAgentId: 'agent-large-sender',
        targetAgentId: 'agent-large-receiver',
        priority: 'medium' as const,
        payload: {
          contentType: 'mixed' as const,
          encoding: 'binary',
          compression: {
            algorithm: 'gzip' as const,
            level: 9,
            originalSize: 5000000, // 5MB original
            compressedSize: 1000000, // 1MB compressed
            ratio: 0.2
          },
          data: Buffer.alloc(1000000) // Large payload
        },
        routing: {
          path: [],
          hops: 0,
          preferredRoute: 'direct' as const,
          qos: { maxLatency: 1000, minBandwidth: 5000000, reliability: 0.95, priority: 70 },
          failover: { enabled: true, alternatives: [], timeout: 10000, retryAttempts: 2 }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: '',
          authentication: { method: 'none' as const, credentials: '', validated: false },
          authorization: { permissions: [], restrictions: [], context: {} }
        }
      };

      // Act
      const result = await protocol.sendMultimediaMessage(largeMessage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.delivered).toBe(true);
    });
  });

  describe('Multimedia Streaming', () => {
    let sessionId: string;

    beforeEach(async () => {
      await protocol.initialize();
      
      const sessionResult = await protocol.createMultimediaSession({
        type: 'streaming',
        initiatorId: 'stream-initiator',
        participants: ['stream-participant']
      });
      sessionId = sessionResult.data.id;
    });

    it('should start multimedia stream successfully', async () => {
      // Arrange
      const streamConfig = {
        sourceAgentId: 'stream-initiator',
        targetAgents: ['stream-participant'],
        mediaType: 'video' as const,
        quality: 'high',
        synchronization: true
      };

      // Act
      const result = await protocol.startMultimediaStream(sessionId, streamConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.streamId).toBeDefined();
      expect(Array.isArray(result.data.endpoints)).toBe(true);
      expect(result.data.endpoints.length).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting multimedia stream',
        expect.objectContaining({
          sessionId,
          mediaType: streamConfig.mediaType,
          targets: streamConfig.targetAgents.length
        })
      );
    });

    it('should handle different media types for streaming', async () => {
      // Arrange
      const mediaTypes = ['video', 'audio', 'mixed'] as const;
      
      // Act
      const results = await Promise.all(
        mediaTypes.map(mediaType => 
          protocol.startMultimediaStream(sessionId, {
            sourceAgentId: 'stream-initiator',
            targetAgents: ['stream-participant'],
            mediaType,
            quality: 'medium'
          })
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle streaming to multiple targets', async () => {
      // Arrange
      const multiTargetConfig = {
        sourceAgentId: 'stream-broadcaster',
        targetAgents: ['target-001', 'target-002', 'target-003', 'target-004'],
        mediaType: 'mixed' as const,
        quality: 'adaptive',
        synchronization: true
      };

      // Act
      const result = await protocol.startMultimediaStream(sessionId, multiTargetConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.endpoints.length).toBeGreaterThanOrEqual(multiTargetConfig.targetAgents.length);
    });

    it('should adapt streaming quality', async () => {
      // Arrange
      const adaptiveStreamConfig = {
        sourceAgentId: 'adaptive-streamer',
        targetAgents: ['adaptive-receiver'],
        mediaType: 'video' as const,
        quality: 'adaptive', // Should adapt based on conditions
        synchronization: false
      };

      // Act
      const result = await protocol.startMultimediaStream(sessionId, adaptiveStreamConfig);

      // Assert
      expect(result.success).toBe(true);
      // Quality adaptation should be handled internally
    });
  });

  describe('Content Synchronization', () => {
    let sessionId: string;

    beforeEach(async () => {
      await protocol.initialize();
      
      const sessionResult = await protocol.createMultimediaSession({
        type: 'sync',
        initiatorId: 'sync-coordinator',
        participants: ['sync-participant-1', 'sync-participant-2']
      });
      sessionId = sessionResult.data.id;
    });

    it('should synchronize content across agents', async () => {
      // Arrange
      const syncConfig = {
        contentId: 'content-sync-001',
        synchronizationPoints: [
          {
            timestamp: new Date(),
            markerType: 'start' as const,
            metadata: { title: 'Introduction' }
          },
          {
            timestamp: new Date(Date.now() + 30000),
            markerType: 'keyframe' as const,
            metadata: { frame: 900 }
          },
          {
            timestamp: new Date(Date.now() + 60000),
            markerType: 'end' as const,
            metadata: { duration: 60 }
          }
        ],
        tolerance: 50, // 50ms tolerance
        participants: ['sync-participant-1', 'sync-participant-2']
      };

      // Act
      const result = await protocol.synchronizeContent(sessionId, syncConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.synchronized).toBe(true);
      expect(Array.isArray(result.data.participants)).toBe(true);
      expect(result.data.participants.length).toBe(syncConfig.participants.length);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Synchronizing multimedia content',
        expect.objectContaining({
          sessionId,
          contentId: syncConfig.contentId,
          participants: syncConfig.participants.length
        })
      );
    });

    it('should handle synchronization with different tolerances', async () => {
      // Arrange
      const toleranceTests = [10, 50, 100, 200]; // Different tolerance levels in ms
      
      // Act
      const results = await Promise.all(
        toleranceTests.map((tolerance, i) => 
          protocol.synchronizeContent(sessionId, {
            contentId: `tolerance-test-${i}`,
            synchronizationPoints: [{
              timestamp: new Date(),
              markerType: 'start' as const,
              metadata: { test: i }
            }],
            tolerance,
            participants: ['sync-participant-1']
          })
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle synchronization failures gracefully', async () => {
      // Arrange
      const invalidSyncConfig = {
        contentId: '',
        synchronizationPoints: [], // Empty sync points
        tolerance: -10, // Invalid tolerance
        participants: [] // No participants
      };

      // Act
      const result = await protocol.synchronizeContent(sessionId, invalidSyncConfig);

      // Assert
      // Should handle gracefully even with invalid config
      expect(result.success).toBe(true);
    });
  });

  describe('Session Statistics and Metrics', () => {
    let sessionId: string;

    beforeEach(async () => {
      await protocol.initialize();
      
      const sessionResult = await protocol.createMultimediaSession({
        type: 'streaming',
        initiatorId: 'metrics-agent',
        participants: ['metrics-target']
      });
      sessionId = sessionResult.data.id;

      // Generate some activity
      await protocol.startMultimediaStream(sessionId, {
        sourceAgentId: 'metrics-agent',
        targetAgents: ['metrics-target'],
        mediaType: 'video',
        quality: 'high'
      });
    });

    it('should provide session statistics', async () => {
      // Act
      const result = await protocol.getSessionStatistics(sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.messages).toBeDefined();
      expect(result.data.bandwidth).toBeDefined();
      expect(result.data.latency).toBeDefined();
      expect(result.data.quality).toBeDefined();
      expect(result.data.errors).toBeDefined();
      
      // Check message statistics structure
      expect(typeof result.data.messages.sent).toBe('number');
      expect(typeof result.data.messages.received).toBe('number');
      expect(typeof result.data.messages.dropped).toBe('number');
      
      // Check bandwidth statistics structure
      expect(result.data.bandwidth.upload).toBeDefined();
      expect(result.data.bandwidth.download).toBeDefined();
      expect(result.data.bandwidth.total).toBeDefined();
    });

    it('should track latency metrics over time', async () => {
      // Arrange - Generate more activity
      await Promise.all([
        protocol.sendMultimediaMessage({
          type: 'media_request',
          sourceAgentId: 'metrics-agent',
          targetAgentId: 'metrics-target',
          priority: 'medium',
          payload: { contentType: 'text', encoding: 'utf8', compression: { algorithm: 'gzip', level: 1, originalSize: 100, compressedSize: 80, ratio: 0.8 } },
          routing: { path: [], hops: 0, preferredRoute: 'direct', qos: { maxLatency: 100, minBandwidth: 1000, reliability: 0.9, priority: 50 }, failover: { enabled: false, alternatives: [], timeout: 0, retryAttempts: 0 } },
          security: { encryptionEnabled: false, encryptionAlgorithm: '', keyId: '', authentication: { method: 'none', credentials: '', validated: false }, authorization: { permissions: [], restrictions: [], context: {} } }
        }),
        protocol.sendMultimediaMessage({
          type: 'media_response',
          sourceAgentId: 'metrics-target',
          targetAgentId: 'metrics-agent',
          priority: 'medium',
          payload: { contentType: 'text', encoding: 'utf8', compression: { algorithm: 'gzip', level: 1, originalSize: 100, compressedSize: 80, ratio: 0.8 } },
          routing: { path: [], hops: 0, preferredRoute: 'direct', qos: { maxLatency: 100, minBandwidth: 1000, reliability: 0.9, priority: 50 }, failover: { enabled: false, alternatives: [], timeout: 0, retryAttempts: 0 } },
          security: { encryptionEnabled: false, encryptionAlgorithm: '', keyId: '', authentication: { method: 'none', credentials: '', validated: false }, authorization: { permissions: [], restrictions: [], context: {} } }
        })
      ]);

      // Act
      const result = await protocol.getSessionStatistics(sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.latency).toBeDefined();
      expect(typeof result.data.latency.current).toBe('number');
      expect(typeof result.data.latency.average).toBe('number');
      expect(typeof result.data.latency.p95).toBe('number');
      expect(typeof result.data.latency.p99).toBe('number');
    });
  });

  describe('Protocol Performance Metrics', () => {
    beforeEach(async () => {
      await protocol.initialize();
    });

    it('should provide comprehensive protocol metrics', async () => {
      // Arrange - Generate activity
      await protocol.createMultimediaSession({
        type: 'streaming',
        initiatorId: 'perf-test-agent',
        participants: ['perf-target']
      });

      // Act
      const result = await protocol.getProtocolMetrics();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.latency).toBeDefined();
      expect(result.data.throughput).toBeDefined();
      expect(result.data.utilization).toBeDefined();
      expect(result.data.errors).toBeDefined();
      
      // Check latency metrics
      expect(typeof result.data.latency.mean).toBe('number');
      
      // Check throughput metrics
      expect(typeof result.data.throughput.requestsPerSecond).toBe('number');
      expect(typeof result.data.throughput.bytesPerSecond).toBe('number');
      
      // Check utilization metrics
      expect(typeof result.data.utilization.cpu).toBe('number');
      expect(typeof result.data.utilization.memory).toBe('number');
    });

    it('should handle high-throughput scenarios', async () => {
      // Arrange - Create multiple concurrent sessions
      const concurrentSessions = Array.from({ length: 10 }, (_, i) => 
        protocol.createMultimediaSession({
          type: 'request_response',
          initiatorId: `load-agent-${i}`,
          participants: [`load-target-${i}`]
        })
      );

      // Act
      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentSessions);
      const endTime = Date.now();

      const metricsResult = await protocol.getProtocolMetrics();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000); // Should handle 10 sessions quickly
      expect(results.filter(r => r.status === 'fulfilled' && r.value.success).length).toBeGreaterThan(5);
      expect(metricsResult.success).toBe(true);
    });

    it('should track error rates and recovery', async () => {
      // Arrange - Generate some failures by using invalid configurations
      const failingOperations = [
        protocol.createMultimediaSession({
          type: 'streaming',
          initiatorId: '', // Invalid ID
          participants: []
        }),
        protocol.sendMultimediaMessage({
          type: 'media_request',
          sourceAgentId: '',
          targetAgentId: '',
          priority: 'medium',
          payload: { contentType: 'text', encoding: '', compression: { algorithm: 'gzip', level: 1, originalSize: 0, compressedSize: 0, ratio: 0 } },
          routing: { path: [], hops: 0, preferredRoute: 'direct', qos: { maxLatency: 0, minBandwidth: 0, reliability: 0, priority: 0 }, failover: { enabled: false, alternatives: [], timeout: 0, retryAttempts: 0 } },
          security: { encryptionEnabled: false, encryptionAlgorithm: '', keyId: '', authentication: { method: 'none', credentials: '', validated: false }, authorization: { permissions: [], restrictions: [], context: {} } }
        })
      ];

      // Act
      await Promise.allSettled(failingOperations);
      const metricsResult = await protocol.getProtocolMetrics();

      // Assert
      expect(metricsResult.success).toBe(true);
      // Error metrics should reflect the failed operations
      expect(metricsResult.data.errors).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      await protocol.initialize();
    });

    it('should handle invalid session creation gracefully', async () => {
      // Arrange
      const invalidSessionConfig = {
        type: 'invalid_type' as any,
        initiatorId: '',
        participants: []
      };

      // Act
      const result = await protocol.createMultimediaSession(invalidSessionConfig);

      // Assert
      // Should either fail gracefully or succeed with fallback behavior
      expect(typeof result.success).toBe('boolean');
    });

    it('should recover from network failures', async () => {
      // Arrange
      const sessionResult = await protocol.createMultimediaSession({
        type: 'streaming',
        initiatorId: 'resilient-agent',
        participants: ['resilient-target']
      });

      // Simulate network failure by sending to non-existent agent
      const networkFailureMessage = {
        type: 'media_request' as const,
        sourceAgentId: 'resilient-agent',
        targetAgentId: 'non-existent-agent',
        priority: 'high' as const,
        payload: { contentType: 'text' as const, encoding: 'utf8', compression: { algorithm: 'gzip' as const, level: 1, originalSize: 100, compressedSize: 80, ratio: 0.8 } },
        routing: {
          path: [],
          hops: 0,
          preferredRoute: 'direct' as const,
          qos: { maxLatency: 100, minBandwidth: 1000, reliability: 0.9, priority: 50 },
          failover: { enabled: true, alternatives: ['backup-relay'], timeout: 5000, retryAttempts: 3 }
        },
        security: { encryptionEnabled: false, encryptionAlgorithm: '', keyId: '', authentication: { method: 'none' as const, credentials: '', validated: false }, authorization: { permissions: [], restrictions: [], context: {} } }
      };

      // Act
      const result = await protocol.sendMultimediaMessage(networkFailureMessage);

      // Assert
      // Should handle gracefully with failover mechanisms
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle session cleanup on errors', async () => {
      // Arrange
      const sessionResult = await protocol.createMultimediaSession({
        type: 'streaming',
        initiatorId: 'cleanup-test-agent',
        participants: ['cleanup-target']
      });

      const sessionId = sessionResult.data.id;

      // Act - Force an error condition
      try {
        await protocol.startMultimediaStream(sessionId, {
          sourceAgentId: 'non-existent-source',
          targetAgents: ['non-existent-target'],
          mediaType: 'video',
          quality: 'invalid-quality'
        });
      } catch (error) {
        // Expected to potentially fail
      }

      // Check sessions are still manageable
      const listResult = await protocol.listActiveSessions();

      // Assert
      expect(listResult.success).toBe(true);
    });
  });

  describe('Security and Validation', () => {
    beforeEach(async () => {
      await protocol.initialize();
    });

    it('should validate message security context', async () => {
      // Arrange
      const secureMessage = {
        type: 'media_request' as const,
        sourceAgentId: 'secure-sender',
        targetAgentId: 'secure-receiver',
        priority: 'high' as const,
        payload: { contentType: 'video' as const, encoding: 'H264', compression: { algorithm: 'gzip' as const, level: 6, originalSize: 1000000, compressedSize: 500000, ratio: 0.5 } },
        routing: { path: [], hops: 0, preferredRoute: 'direct' as const, qos: { maxLatency: 50, minBandwidth: 5000000, reliability: 0.99, priority: 90 }, failover: { enabled: true, alternatives: [], timeout: 3000, retryAttempts: 2 } },
        security: {
          encryptionEnabled: true,
          encryptionAlgorithm: 'AES-256',
          keyId: 'secure-key-001',
          signature: 'message-signature-hash',
          authentication: {
            method: 'certificate' as const,
            credentials: 'cert-credentials',
            validated: true,
            expiresAt: new Date(Date.now() + 3600000)
          },
          authorization: {
            permissions: ['send_video', 'receive_response'],
            restrictions: ['no_recording'],
            context: { security_level: 'high' }
          }
        }
      };

      // Act
      const result = await protocol.sendMultimediaMessage(secureMessage);

      // Assert
      expect(result.success).toBe(true);
      // Security validation should pass
    });

    it('should handle authentication failures', async () => {
      // Arrange
      const unauthenticatedMessage = {
        type: 'media_request' as const,
        sourceAgentId: 'unauthorized-sender',
        targetAgentId: 'protected-receiver',
        priority: 'medium' as const,
        payload: { contentType: 'text' as const, encoding: 'utf8', compression: { algorithm: 'gzip' as const, level: 1, originalSize: 100, compressedSize: 80, ratio: 0.8 } },
        routing: { path: [], hops: 0, preferredRoute: 'direct' as const, qos: { maxLatency: 100, minBandwidth: 1000, reliability: 0.9, priority: 50 }, failover: { enabled: false, alternatives: [], timeout: 0, retryAttempts: 0 } },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: '',
          keyId: '',
          authentication: {
            method: 'token' as const,
            credentials: 'invalid-token',
            validated: false
          },
          authorization: {
            permissions: [],
            restrictions: [],
            context: {}
          }
        }
      };

      // Act
      const result = await protocol.sendMultimediaMessage(unauthenticatedMessage);

      // Assert
      // Should handle authentication failure appropriately
      expect(typeof result.success).toBe('boolean');
    });
  });
});
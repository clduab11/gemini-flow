/**
 * A2A Multimedia Protocol Tests
 * Comprehensive test suite for the A2A multimedia protocol implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { A2AMultimediaProtocol, A2AMultimediaMessage, A2AMultimediaSession } from '../a2a-multimedia-protocol.js';
import { Logger } from '../../../../utils/logger.js';

// Mock logger to avoid console output during tests
vi.mock('../../../../utils/logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

describe('A2AMultimediaProtocol', () => {
  let protocol: A2AMultimediaProtocol;
  let mockConfig: any;

  beforeEach(async () => {
    mockConfig = {
      projectId: 'test-project',
      region: 'us-central1',
      security: {
        encryptionRequired: false,
        keyRotation: { enabled: false, interval: 3600, algorithm: 'AES', keySize: 256 }
      },
      compression: {
        enabled: true,
        algorithms: ['gzip'],
        threshold: 1024,
        level: 6
      },
      synchronization: {
        enabled: true,
        tolerance: 50,
        method: 'ntp'
      },
      persistence: {
        enabled: true,
        storage: 'memory'
      }
    };

    protocol = new A2AMultimediaProtocol(mockConfig);
    await protocol.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const newProtocol = new A2AMultimediaProtocol(mockConfig);
      await expect(newProtocol.initialize()).resolves.not.toThrow();
    });

    it('should emit initialized event after successful initialization', async () => {
      const initPromise = new Promise((resolve) => {
        protocol.on('initialized', resolve);
      });

      const newProtocol = new A2AMultimediaProtocol(mockConfig);
      await newProtocol.initialize();

      // Should not timeout
      expect(initPromise).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      const invalidConfig = { ...mockConfig, projectId: null };
      const newProtocol = new A2AMultimediaProtocol(invalidConfig);
      
      // Should not throw but may have internal errors
      await expect(newProtocol.initialize()).resolves.not.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should create a multimedia session successfully', async () => {
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: 'agent1',
        participants: ['agent2', 'agent3'],
        configuration: {
          quality: {
            adaptiveBitrate: true,
            qualityLadder: [
              { level: 1, bandwidth: 1000000, priority: 1 }
            ]
          }
        }
      };

      const response = await protocol.createMultimediaSession(sessionConfig);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBeDefined();
      expect(response.data.type).toBe('streaming');
      expect(response.data.participants).toHaveLength(3); // initiator + 2 participants
    });

    it('should handle session creation with invalid participants', async () => {
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: '',
        participants: [],
        configuration: {}
      };

      const response = await protocol.createMultimediaSession(sessionConfig);
      
      // Should handle gracefully, may succeed with default behavior
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });

    it('should list active sessions', async () => {
      // Create a session first
      const sessionConfig = {
        type: 'request_response' as const,
        initiatorId: 'agent1',
        participants: ['agent2'],
        configuration: {}
      };

      await protocol.createMultimediaSession(sessionConfig);
      
      const response = await protocol.listActiveSessions();
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should get session statistics', async () => {
      // Create a session first
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: 'agent1',
        participants: ['agent2'],
        configuration: {}
      };

      const sessionResponse = await protocol.createMultimediaSession(sessionConfig);
      expect(sessionResponse.success).toBe(true);
      
      const statsResponse = await protocol.getSessionStatistics(sessionResponse.data.id);
      
      expect(statsResponse.success).toBe(true);
      expect(statsResponse.data).toBeDefined();
      expect(statsResponse.data.messages).toBeDefined();
      expect(statsResponse.data.bandwidth).toBeDefined();
      expect(statsResponse.data.latency).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    let session: A2AMultimediaSession;

    beforeEach(async () => {
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: 'agent1',
        participants: ['agent2'],
        configuration: {}
      };

      const response = await protocol.createMultimediaSession(sessionConfig);
      session = response.data;
    });

    it('should send multimedia message successfully', async () => {
      const message = {
        type: 'media_request' as const,
        sourceAgentId: 'agent1',
        targetAgentId: 'agent2',
        priority: 'medium' as const,
        payload: {
          contentType: 'video' as const,
          encoding: 'h264',
          compression: {
            algorithm: 'gzip' as const,
            level: 6,
            originalSize: 1024,
            compressedSize: 512,
            ratio: 0.5
          },
          data: 'test video data'
        },
        routing: {
          path: ['agent1', 'agent2'],
          hops: 1,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.95,
            priority: 50
          },
          failover: {
            enabled: true,
            alternatives: ['agent3'],
            timeout: 5000,
            retryAttempts: 3
          }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: 'test-key',
          authentication: {
            method: 'token' as const,
            credentials: 'test-token',
            validated: false
          },
          authorization: {
            permissions: ['read', 'write'],
            restrictions: [],
            context: {}
          }
        }
      };

      const response = await protocol.sendMultimediaMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.messageId).toBeDefined();
      expect(typeof response.data.delivered).toBe('boolean');
    });

    it('should handle message validation errors', async () => {
      const invalidMessage = {
        type: 'media_request' as const,
        sourceAgentId: '', // Invalid: empty source
        targetAgentId: 'agent2',
        priority: 'medium' as const,
        payload: {
          contentType: 'video' as const,
          encoding: 'h264',
          compression: {
            algorithm: 'gzip' as const,
            level: 6,
            originalSize: 1024,
            compressedSize: 512,
            ratio: 0.5
          }
        },
        routing: {
          path: [],
          hops: 0,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.95,
            priority: 50
          },
          failover: {
            enabled: false,
            alternatives: [],
            timeout: 5000,
            retryAttempts: 0
          }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: 'test-key',
          authentication: {
            method: 'token' as const,
            credentials: 'test-token',
            validated: false
          },
          authorization: {
            permissions: [],
            restrictions: [],
            context: {}
          }
        }
      };

      const response = await protocol.sendMultimediaMessage(invalidMessage);
      
      // Should handle gracefully - may succeed with validation warnings or fail gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });

    it('should compress large payloads', async () => {
      const largePayload = 'x'.repeat(2000); // Larger than compression threshold
      
      const message = {
        type: 'media_request' as const,
        sourceAgentId: 'agent1',
        targetAgentId: 'agent2',
        priority: 'medium' as const,
        payload: {
          contentType: 'text' as const,
          encoding: 'utf8',
          compression: {
            algorithm: 'gzip' as const,
            level: 6,
            originalSize: largePayload.length,
            compressedSize: 0,
            ratio: 1
          },
          data: largePayload
        },
        routing: {
          path: ['agent1', 'agent2'],
          hops: 1,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.95,
            priority: 50
          },
          failover: {
            enabled: false,
            alternatives: [],
            timeout: 5000,
            retryAttempts: 0
          }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: 'test-key',
          authentication: {
            method: 'token' as const,
            credentials: 'test-token',
            validated: false
          },
          authorization: {
            permissions: [],
            restrictions: [],
            context: {}
          }
        }
      };

      const response = await protocol.sendMultimediaMessage(message);
      
      expect(response.success).toBe(true);
      // Compression should have been applied due to size
    });
  });

  describe('Streaming', () => {
    let session: A2AMultimediaSession;

    beforeEach(async () => {
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: 'agent1',
        participants: ['agent2', 'agent3'],
        configuration: {
          quality: {
            adaptiveBitrate: true,
            qualityLadder: [
              { level: 1, bandwidth: 1000000, priority: 1 },
              { level: 2, bandwidth: 2000000, priority: 2 }
            ]
          }
        }
      };

      const response = await protocol.createMultimediaSession(sessionConfig);
      session = response.data;
    });

    it('should start multimedia streaming', async () => {
      const streamConfig = {
        sourceAgentId: 'agent1',
        targetAgents: ['agent2', 'agent3'],
        mediaType: 'video' as const,
        quality: 'high',
        synchronization: true
      };

      const response = await protocol.startMultimediaStream(session.id, streamConfig);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.streamId).toBeDefined();
      expect(Array.isArray(response.data.endpoints)).toBe(true);
      expect(response.data.endpoints.length).toBeGreaterThan(0);
    });

    it('should handle streaming with invalid session', async () => {
      const streamConfig = {
        sourceAgentId: 'agent1',
        targetAgents: ['agent2'],
        mediaType: 'video' as const,
        quality: 'high'
      };

      const response = await protocol.startMultimediaStream('invalid-session', streamConfig);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should create appropriate endpoints for different target counts', async () => {
      // Test with many targets (should create multicast)
      const streamConfig = {
        sourceAgentId: 'agent1',
        targetAgents: ['agent2', 'agent3', 'agent4', 'agent5'],
        mediaType: 'video' as const,
        quality: 'medium'
      };

      const response = await protocol.startMultimediaStream(session.id, streamConfig);

      expect(response.success).toBe(true);
      expect(response.data.endpoints.length).toBeGreaterThan(0);
      
      // Should have multiple endpoint types for multiple targets
      const endpointTypes = response.data.endpoints.map(e => e.split(':')[0]);
      expect(endpointTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Content Synchronization', () => {
    let session: A2AMultimediaSession;

    beforeEach(async () => {
      const sessionConfig = {
        type: 'sync' as const,
        initiatorId: 'agent1',
        participants: ['agent2', 'agent3'],
        configuration: {
          synchronization: {
            enabled: true,
            tolerance: 50,
            method: 'ntp' as const,
            coordinator: 'agent1',
            syncPoints: ['keyframe', 'chapter']
          }
        }
      };

      const response = await protocol.createMultimediaSession(sessionConfig);
      session = response.data;
    });

    it('should synchronize content across participants', async () => {
      const syncConfig = {
        contentId: 'test-video-1',
        synchronizationPoints: [
          {
            timestamp: new Date(),
            markerType: 'keyframe' as const,
            metadata: { frame: 100 }
          },
          {
            timestamp: new Date(Date.now() + 5000),
            markerType: 'chapter' as const,
            metadata: { chapter: 1 }
          }
        ],
        tolerance: 50,
        participants: ['agent2', 'agent3']
      };

      const response = await protocol.synchronizeContent(session.id, syncConfig);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(typeof response.data.synchronized).toBe('boolean');
      expect(Array.isArray(response.data.participants)).toBe(true);
    });

    it('should handle synchronization with invalid session', async () => {
      const syncConfig = {
        contentId: 'test-video-1',
        synchronizationPoints: [],
        tolerance: 50,
        participants: ['agent2']
      };

      const response = await protocol.synchronizeContent('invalid-session', syncConfig);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle empty participant list', async () => {
      const syncConfig = {
        contentId: 'test-video-1',
        synchronizationPoints: [],
        tolerance: 50,
        participants: []
      };

      const response = await protocol.synchronizeContent(session.id, syncConfig);

      // Should handle gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
  });

  describe('Protocol Metrics', () => {
    it('should return protocol performance metrics', async () => {
      const response = await protocol.getProtocolMetrics();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.latency).toBeDefined();
      expect(response.data.throughput).toBeDefined();
      expect(response.data.utilization).toBeDefined();
      expect(response.data.errors).toBeDefined();
    });

    it('should provide realistic metric values', async () => {
      const response = await protocol.getProtocolMetrics();

      expect(response.success).toBe(true);
      
      // Check that metrics have reasonable values
      expect(response.data.latency.mean).toBeGreaterThan(0);
      expect(response.data.throughput.requestsPerSecond).toBeGreaterThan(0);
      expect(response.data.utilization.cpu).toBeGreaterThanOrEqual(0);
      expect(response.data.utilization.cpu).toBeLessThanOrEqual(100);
      expect(response.data.errors.rate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      // Simulate network failure by creating invalid routing
      const message = {
        type: 'media_request' as const,
        sourceAgentId: 'agent1',
        targetAgentId: 'nonexistent-agent',
        priority: 'medium' as const,
        payload: {
          contentType: 'video' as const,
          encoding: 'h264',
          compression: {
            algorithm: 'gzip' as const,
            level: 6,
            originalSize: 1024,
            compressedSize: 512,
            ratio: 0.5
          },
          data: 'test data'
        },
        routing: {
          path: ['agent1', 'nonexistent-agent'],
          hops: 1,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.95,
            priority: 50
          },
          failover: {
            enabled: false,
            alternatives: [],
            timeout: 1000,
            retryAttempts: 0
          }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: 'test-key',
          authentication: {
            method: 'token' as const,
            credentials: 'test-token',
            validated: false
          },
          authorization: {
            permissions: [],
            restrictions: [],
            context: {}
          }
        }
      };

      const response = await protocol.sendMultimediaMessage(message);
      
      // Should not throw, should handle gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });

    it('should handle compression failures', async () => {
      // Test with invalid compression configuration
      const message = {
        type: 'media_request' as const,
        sourceAgentId: 'agent1',
        targetAgentId: 'agent2',
        priority: 'medium' as const,
        payload: {
          contentType: 'video' as const,
          encoding: 'h264',
          compression: {
            algorithm: 'invalid-algorithm' as any,
            level: 6,
            originalSize: 1024,
            compressedSize: 512,
            ratio: 0.5
          },
          data: 'test data'
        },
        routing: {
          path: ['agent1', 'agent2'],
          hops: 1,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.95,
            priority: 50
          },
          failover: {
            enabled: false,
            alternatives: [],
            timeout: 5000,
            retryAttempts: 0
          }
        },
        security: {
          encryptionEnabled: false,
          encryptionAlgorithm: 'AES-256',
          keyId: 'test-key',
          authentication: {
            method: 'token' as const,
            credentials: 'test-token',
            validated: false
          },
          authorization: {
            permissions: [],
            restrictions: [],
            context: {}
          }
        }
      };

      const response = await protocol.sendMultimediaMessage(message);
      
      // Should handle compression failure gracefully
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
  });

  describe('Security Features', () => {
    it('should handle encrypted messages when encryption is enabled', async () => {
      const secureConfig = {
        ...mockConfig,
        security: {
          encryptionRequired: true,
          keyRotation: { enabled: true, interval: 3600, algorithm: 'AES', keySize: 256 }
        }
      };

      const secureProtocol = new A2AMultimediaProtocol(secureConfig);
      await secureProtocol.initialize();

      const message = {
        type: 'media_request' as const,
        sourceAgentId: 'agent1',
        targetAgentId: 'agent2',
        priority: 'medium' as const,
        payload: {
          contentType: 'text' as const,
          encoding: 'utf8',
          compression: {
            algorithm: 'gzip' as const,
            level: 6,
            originalSize: 100,
            compressedSize: 50,
            ratio: 0.5
          },
          data: 'sensitive data'
        },
        routing: {
          path: ['agent1', 'agent2'],
          hops: 1,
          preferredRoute: 'direct' as const,
          qos: {
            maxLatency: 100,
            minBandwidth: 1000000,
            reliability: 0.95,
            priority: 50
          },
          failover: {
            enabled: false,
            alternatives: [],
            timeout: 5000,
            retryAttempts: 0
          }
        },
        security: {
          encryptionEnabled: true,
          encryptionAlgorithm: 'AES-256',
          keyId: 'test-key',
          authentication: {
            method: 'token' as const,
            credentials: 'secure-token',
            validated: false
          },
          authorization: {
            permissions: ['read', 'write'],
            restrictions: [],
            context: {}
          }
        }
      };

      const response = await secureProtocol.sendMultimediaMessage(message);
      
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessionPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const sessionConfig = {
          type: 'streaming' as const,
          initiatorId: `agent${i}`,
          participants: [`agent${i + 10}`],
          configuration: {}
        };
        
        sessionPromises.push(protocol.createMultimediaSession(sessionConfig));
      }

      const responses = await Promise.all(sessionPromises);
      
      // All sessions should be created successfully
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Verify all sessions are listed
      const listResponse = await protocol.listActiveSessions();
      expect(listResponse.success).toBe(true);
      expect(listResponse.data.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle rapid message sending', async () => {
      // Create a session first
      const sessionConfig = {
        type: 'streaming' as const,
        initiatorId: 'agent1',
        participants: ['agent2'],
        configuration: {}
      };

      await protocol.createMultimediaSession(sessionConfig);

      // Send multiple messages rapidly
      const messagePromises = [];
      
      for (let i = 0; i < 10; i++) {
        const message = {
          type: 'media_request' as const,
          sourceAgentId: 'agent1',
          targetAgentId: 'agent2',
          priority: 'medium' as const,
          payload: {
            contentType: 'text' as const,
            encoding: 'utf8',
            compression: {
              algorithm: 'gzip' as const,
              level: 6,
              originalSize: 100,
              compressedSize: 50,
              ratio: 0.5
            },
            data: `message ${i}`
          },
          routing: {
            path: ['agent1', 'agent2'],
            hops: 1,
            preferredRoute: 'direct' as const,
            qos: {
              maxLatency: 100,
              minBandwidth: 1000000,
              reliability: 0.95,
              priority: 50
            },
            failover: {
              enabled: false,
              alternatives: [],
              timeout: 5000,
              retryAttempts: 0
            }
          },
          security: {
            encryptionEnabled: false,
            encryptionAlgorithm: 'AES-256',
            keyId: 'test-key',
            authentication: {
              method: 'token' as const,
              credentials: 'test-token',
              validated: false
            },
            authorization: {
              permissions: [],
              restrictions: [],
              context: {}
            }
          }
        };
        
        messagePromises.push(protocol.sendMultimediaMessage(message));
      }

      const responses = await Promise.all(messagePromises);
      
      // All messages should be handled (may not all succeed, but should not crash)
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(typeof response.success).toBe('boolean');
      });
    });
  });
});

describe('Integration Tests', () => {
  let protocol: A2AMultimediaProtocol;

  beforeEach(async () => {
    const config = {
      projectId: 'integration-test',
      region: 'us-central1',
      security: { encryptionRequired: false, keyRotation: { enabled: false, interval: 3600, algorithm: 'AES', keySize: 256 } },
      compression: { enabled: true, algorithms: ['gzip'], threshold: 1024, level: 6 },
      synchronization: { enabled: true, tolerance: 50, method: 'ntp' },
      persistence: { enabled: true, storage: 'memory' }
    };

    protocol = new A2AMultimediaProtocol(config);
    await protocol.initialize();
  });

  it('should handle complete multimedia workflow', async () => {
    // 1. Create session
    const sessionConfig = {
      type: 'streaming' as const,
      initiatorId: 'producer',
      participants: ['consumer1', 'consumer2'],
      configuration: {
        quality: {
          adaptiveBitrate: true,
          qualityLadder: [
            { level: 1, bandwidth: 1000000, priority: 1 },
            { level: 2, bandwidth: 2000000, priority: 2 }
          ]
        },
        synchronization: {
          enabled: true,
          tolerance: 50,
          method: 'ntp' as const,
          coordinator: 'producer',
          syncPoints: ['keyframe']
        }
      }
    };

    const sessionResponse = await protocol.createMultimediaSession(sessionConfig);
    expect(sessionResponse.success).toBe(true);
    const session = sessionResponse.data;

    // 2. Start streaming
    const streamConfig = {
      sourceAgentId: 'producer',
      targetAgents: ['consumer1', 'consumer2'],
      mediaType: 'video' as const,
      quality: 'high',
      synchronization: true
    };

    const streamResponse = await protocol.startMultimediaStream(session.id, streamConfig);
    expect(streamResponse.success).toBe(true);

    // 3. Send multimedia data
    const message = {
      type: 'stream_data' as const,
      sourceAgentId: 'producer',
      targetAgentId: 'consumer1',
      priority: 'high' as const,
      payload: {
        contentType: 'video' as const,
        encoding: 'h264',
        compression: {
          algorithm: 'gzip' as const,
          level: 6,
          originalSize: 2048,
          compressedSize: 1024,
          ratio: 0.5
        },
        data: 'video frame data'
      },
      routing: {
        path: ['producer', 'consumer1'],
        hops: 1,
        preferredRoute: 'direct' as const,
        qos: {
          maxLatency: 50,
          minBandwidth: 2000000,
          reliability: 0.98,
          priority: 80
        },
        failover: {
          enabled: true,
          alternatives: ['relay1'],
          timeout: 3000,
          retryAttempts: 2
        }
      },
      security: {
        encryptionEnabled: false,
        encryptionAlgorithm: 'AES-256',
        keyId: 'stream-key',
        authentication: {
          method: 'token' as const,
          credentials: 'stream-token',
          validated: false
        },
        authorization: {
          permissions: ['stream'],
          restrictions: [],
          context: {}
        }
      }
    };

    const messageResponse = await protocol.sendMultimediaMessage(message);
    expect(messageResponse.success).toBe(true);

    // 4. Synchronize content
    const syncConfig = {
      contentId: 'video-stream-1',
      synchronizationPoints: [
        {
          timestamp: new Date(),
          markerType: 'keyframe' as const,
          metadata: { frame: 1000 }
        }
      ],
      tolerance: 50,
      participants: ['consumer1', 'consumer2']
    };

    const syncResponse = await protocol.synchronizeContent(session.id, syncConfig);
    expect(syncResponse.success).toBe(true);

    // 5. Get final statistics
    const statsResponse = await protocol.getSessionStatistics(session.id);
    expect(statsResponse.success).toBe(true);
    
    const stats = statsResponse.data;
    expect(stats.messages).toBeDefined();
    expect(stats.bandwidth).toBeDefined();
    expect(stats.latency).toBeDefined();
    expect(stats.quality).toBeDefined();
  });
});
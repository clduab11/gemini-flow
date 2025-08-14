/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { jest } from '@jest/globals';

// Extend Jest timeout for integration tests
jest.setTimeout(60000);

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless VERBOSE is set
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console
  if (!process.env.VERBOSE_TESTS) {
    Object.assign(console, originalConsole);
  }
});

// Global test utilities
global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  expectAsync: async (asyncFn: () => Promise<any>) => {
    try {
      await asyncFn();
      return true;
    } catch (error) {
      return false;
    }
  },

  createMockResponse: (success: boolean = true, data: any = {}) => ({
    success,
    data,
    error: success ? null : { message: 'Mock error', code: 'MOCK_ERROR' }
  }),

  generateRandomId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  createMockStream: (config: any = {}) => ({
    id: global.testUtils.generateRandomId(),
    status: 'active',
    quality: config.quality || 'medium',
    ...config
  }),

  waitForCondition: async (
    condition: () => boolean | Promise<boolean>, 
    timeout: number = 5000,
    interval: number = 100
  ): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) return true;
      await global.testUtils.delay(interval);
    }
    
    return false;
  },

  expectToBeBetween: (actual: number, min: number, max: number) => {
    expect(actual).toBeGreaterThanOrEqual(min);
    expect(actual).toBeLessThanOrEqual(max);
  },

  expectArrayToContainObjectWithProperty: (array: any[], property: string, value: any) => {
    const found = array.some(item => item[property] === value);
    expect(found).toBe(true);
  }
};

// Mock implementations for external services
jest.mock('../../src/integrations/veo3/video-generation-pipeline', () => ({
  Veo3Integration: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    generateVideo: jest.fn().mockImplementation((config) => 
      Promise.resolve({
        success: true,
        data: {
          videoUrl: 'mock://video-url',
          duration: config.duration || 5000,
          quality: config.quality || 'medium',
          qualityScore: 0.85,
          qualityMetrics: {
            technicalQuality: 0.88,
            visualCoherence: 0.85,
            motionSmoothness: 0.82,
            colorAccuracy: 0.87,
            sharpness: 0.83,
            overallScore: 0.85
          }
        },
        metadata: {
          processingTime: 15000,
          retryCount: 0
        }
      })
    ),
    generateVideoStream: jest.fn(),
    generateVideoWithPreview: jest.fn(),
    generateMultiSceneVideo: jest.fn()
  }))
}));

jest.mock('../../src/streaming/enhanced-streaming-api', () => ({
  EnhancedStreamingAPI: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn().mockResolvedValue(true),
    createVideoStream: jest.fn().mockImplementation((config) =>
      Promise.resolve({
        success: true,
        data: {
          id: global.testUtils.generateRandomId(),
          status: 'active',
          quality: config.quality?.level || 'medium'
        }
      })
    ),
    createAudioStream: jest.fn(),
    createSynchronizedSession: jest.fn(),
    createMixedContentSession: jest.fn(),
    sendChunk: jest.fn().mockResolvedValue({ success: true }),
    terminateStream: jest.fn().mockResolvedValue({ success: true }),
    streamMixedContent: jest.fn().mockResolvedValue({ success: true })
  }))
}));

jest.mock('../../src/agentspace/core/AgentSpaceManager', () => ({
  AgentSpaceManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn().mockResolvedValue(true),
    reset: jest.fn().mockResolvedValue(true),
    spawnAgent: jest.fn().mockImplementation((config) =>
      Promise.resolve({
        success: true,
        data: {
          id: config.id,
          status: 'active',
          capabilities: config.capabilities
        }
      })
    ),
    terminateAgent: jest.fn().mockResolvedValue({
      success: true,
      data: { gracefulShutdown: true, tasksReassigned: 0 }
    }),
    getAgent: jest.fn().mockResolvedValue(null),
    listAgents: jest.fn().mockResolvedValue([]),
    autoScale: jest.fn(),
    getAgentHealth: jest.fn(),
    recoverAgent: jest.fn(),
    createCheckpoint: jest.fn(),
    rollbackToCheckpoint: jest.fn(),
    getSystemHealth: jest.fn()
  }))
}));

// Add other AgentSpace mocks
jest.mock('../../src/agentspace/coordination/AgentCoordinator', () => ({
  AgentCoordinator: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn().mockResolvedValue(true),
    establishHierarchy: jest.fn(),
    coordinateTask: jest.fn(),
    initiateConsensus: jest.fn(),
    establishDependencies: jest.fn(),
    monitorCascadeFailure: jest.fn()
  }))
}));

jest.mock('../../src/agentspace/resources/ResourceManager', () => ({
  ResourceManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn().mockResolvedValue(true),
    getAgentResources: jest.fn(),
    generateAllocationReport: jest.fn(),
    getPreemptionReport: jest.fn(),
    adjustAgentResources: jest.fn()
  }))
}));

jest.mock('../../src/agentspace/communication/CommunicationHub', () => ({
  CommunicationHub: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn().mockResolvedValue(true),
    getAgentStatus: jest.fn(),
    sendMessage: jest.fn(),
    simulateNetworkPartition: jest.fn(),
    getPartitionStatus: jest.fn(),
    healNetworkPartition: jest.fn()
  }))
}));

jest.mock('../../src/agentspace/orchestration/TaskOrchestrator', () => ({
  TaskOrchestrator: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn().mockResolvedValue(true),
    assignTask: jest.fn(),
    orchestrateTask: jest.fn(),
    executeTask: jest.fn(),
    scheduleTask: jest.fn(),
    getLoadBalancingReport: jest.fn()
  }))
}));

// Performance testing utilities
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {}
};

// Environment detection
const isCI = process.env.CI === 'true';
const isBenchmark = process.env.BENCHMARK === 'true';

if (isCI) {
  console.log('Running in CI environment - using optimized settings');
  jest.setTimeout(120000); // Longer timeout for CI
}

if (isBenchmark) {
  console.log('Running benchmark tests - extended timeouts enabled');
  jest.setTimeout(600000); // 10 minutes for benchmark tests
}

// Export utilities for TypeScript
declare global {
  var testUtils: {
    delay: (ms: number) => Promise<void>;
    expectAsync: (asyncFn: () => Promise<any>) => Promise<boolean>;
    createMockResponse: (success?: boolean, data?: any) => any;
    generateRandomId: () => string;
    createMockStream: (config?: any) => any;
    waitForCondition: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<boolean>;
    expectToBeBetween: (actual: number, min: number, max: number) => void;
    expectArrayToContainObjectWithProperty: (array: any[], property: string, value: any) => void;
  };
}
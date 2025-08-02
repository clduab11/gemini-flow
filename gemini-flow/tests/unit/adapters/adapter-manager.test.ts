import { describe, it, expect, beforeEach } from '@jest/globals';
import { AdapterManager } from '../../../src/adapters/adapter-manager';
import { BaseModelAdapter } from '../../../src/adapters/base-model-adapter';
import type { ModelRequest, ModelResponse } from '../../../src/adapters/base-model-adapter';

// Mock adapter implementation
class MockAdapter extends BaseModelAdapter {
  requestCount = 0;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    this.requestCount++;
    const startTime = performance.now();
    const response = {
      id: this.generateRequestId(),
      content: `Mock response: ${request.prompt}`,
      model: this.config.modelName,
      timestamp: new Date(),
      latency: 100,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      cost: 0.001,
      finishReason: 'STOP'
    };
    response.latency = performance.now() - startTime;
    return response;
  }

  async *generateStream(request: ModelRequest) {
    yield {
      id: '1',
      content: 'Mock stream',
      delta: 'Mock stream',
      finishReason: 'STOP' as const
    };
  }

  async validateRequest(request: ModelRequest): Promise<boolean> {
    if (!request.prompt) {
      throw this.createError('Prompt is required', 'INVALID_PROMPT', 400, false);
    }
    return true;
  }

  protected transformRequest(request: ModelRequest): any {
    return { prompt: request.prompt };
  }

  protected transformResponse(response: any, request: ModelRequest): ModelResponse {
    return response;
  }

  protected handleError(error: any, request: ModelRequest): any {
    return this.createError('Mock error', 'MOCK_ERROR', 500, false);
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy' as const,
      latency: 50,
      lastChecked: new Date(),
      errors: [] as string[],
      metadata: { requestCount: this.requestCount }
    };
  }

  getModelCapabilities() {
    return {
      textGeneration: true,
      codeGeneration: true,
      multimodal: false,
      streaming: true,
      functionCalling: false,
      longContext: false,
      reasoning: false,
      maxTokens: 4096,
      supportedLanguages: ['en'],
      inputTypes: ['text'] as const,
      outputTypes: ['text'] as const
    };
  }
}

describe('AdapterManager', () => {
  let manager: AdapterManager;

  beforeEach(() => {
    manager = new AdapterManager();
  });

  afterEach(() => {
    // Cleanup any event listeners
    manager.removeAllListeners();
  });

  describe('adapter registration', () => {
    it('should register adapter successfully', () => {
      const adapter = new MockAdapter({ modelName: 'mock-adapter' });
      manager.registerAdapter('mock', adapter);
      expect(manager.hasAdapter('mock')).toBe(true);
    });

    it('should throw error when registering duplicate adapter', () => {
      const adapter = new MockAdapter({ modelName: 'mock-adapter' });
      manager.registerAdapter('mock', adapter);
      
      expect(() => manager.registerAdapter('mock', adapter))
        .toThrow('Adapter already registered: mock');
    });

    it('should list all registered adapters', () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const adapter2 = new MockAdapter({ modelName: 'mock-2' });
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('mock2', adapter2);
      
      const adapters = manager.listAdapters();
      expect(adapters).toEqual(['mock1', 'mock2']);
    });
  });

  describe('adapter retrieval', () => {
    it('should get registered adapter', () => {
      const adapter = new MockAdapter({ modelName: 'mock-adapter' });
      manager.registerAdapter('mock', adapter);
      
      const retrieved = manager.getAdapter('mock');
      expect(retrieved).toBe(adapter);
    });

    it('should throw error for non-existent adapter', () => {
      expect(() => manager.getAdapter('non-existent'))
        .toThrow('Adapter not found: non-existent');
    });
  });

  describe('adapter removal', () => {
    it('should remove adapter successfully', () => {
      const adapter = new MockAdapter({ modelName: 'mock-adapter' });
      manager.registerAdapter('mock', adapter);
      
      manager.removeAdapter('mock');
      expect(manager.hasAdapter('mock')).toBe(false);
    });

    it('should not throw when removing non-existent adapter', () => {
      expect(() => manager.removeAdapter('non-existent')).not.toThrow();
    });
  });

  describe('batch operations', () => {
    it('should get multiple adapters', () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const adapter2 = new MockAdapter({ modelName: 'mock-2' });
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('mock2', adapter2);
      
      const adapters = manager.getAdapters(['mock1', 'mock2']);
      expect(adapters).toHaveLength(2);
      expect(adapters[0]).toBe(adapter1);
      expect(adapters[1]).toBe(adapter2);
    });

    it('should handle partial adapter list', () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      manager.registerAdapter('mock1', adapter1);
      
      const adapters = manager.getAdapters(['mock1', 'non-existent']);
      expect(adapters).toHaveLength(1);
      expect(adapters[0]).toBe(adapter1);
    });
  });

  describe('health checks', () => {
    it('should check health of all adapters', async () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const adapter2 = new MockAdapter({ modelName: 'mock-2' });
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('mock2', adapter2);
      
      const health = await manager.healthCheckAll();
      expect(health).toHaveProperty('mock1');
      expect(health).toHaveProperty('mock2');
      expect(health.mock1.status).toBe('unhealthy'); // Not initialized
      expect(health.mock2.status).toBe('unhealthy'); // Not initialized
    });

    it('should report healthy after initialization', async () => {
      const adapter = new MockAdapter({ modelName: 'mock-adapter' });
      await adapter.initialize();
      
      manager.registerAdapter('mock', adapter);
      
      const health = await manager.healthCheckAll();
      expect(health.mock.status).toBe('healthy');
    });
  });

  describe('capability checking', () => {
    it('should find adapters by capability', async () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const adapter2 = new MockAdapter({ modelName: 'mock-2' });
      
      await adapter1.initialize();
      await adapter2.initialize();
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('mock2', adapter2);
      
      const textAdapters = manager.getAdaptersByCapability('textGeneration');
      expect(textAdapters).toHaveLength(2);
      
      const multimodalAdapters = manager.getAdaptersByCapability('multimodal');
      expect(multimodalAdapters).toHaveLength(0);
    });
  });

  describe('metrics', () => {
    it('should collect metrics from all adapters', () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const adapter2 = new MockAdapter({ modelName: 'mock-2' });
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('mock2', adapter2);
      
      const metrics = manager.getMetrics();
      expect(metrics).toHaveProperty('mock1');
      expect(metrics).toHaveProperty('mock2');
      expect(metrics.summary).toBeDefined();
      expect(metrics.summary.totalAdapters).toBe(2);
    });

    it('should return empty metrics for no adapters', () => {
      const metrics = manager.getMetrics();
      expect(metrics.summary.totalAdapters).toBe(0);
      expect(Object.keys(metrics).filter(k => k !== 'summary')).toHaveLength(0);
    });

    it('should include adapter performance metrics', async () => {
      const adapter = new MockAdapter({ modelName: 'perf-test' });
      await adapter.initialize();
      
      manager.registerAdapter('perf', adapter);
      
      // Simulate some usage
      await adapter.generate({ prompt: 'test' });
      
      const metrics = manager.getMetrics();
      expect(metrics.perf).toBeDefined();
      expect(metrics.perf.requestCount).toBeGreaterThan(0);
    });

    it('should calculate aggregated metrics', async () => {
      const adapter1 = new MockAdapter({ modelName: 'agg-1' });
      const adapter2 = new MockAdapter({ modelName: 'agg-2' });
      
      await adapter1.initialize();
      await adapter2.initialize();
      
      manager.registerAdapter('agg1', adapter1);
      manager.registerAdapter('agg2', adapter2);
      
      // Generate some requests
      await adapter1.generate({ prompt: 'test1' });
      await adapter2.generate({ prompt: 'test2' });
      
      const metrics = manager.getMetrics();
      expect(metrics.summary.totalRequests).toBeGreaterThan(0);
      expect(metrics.summary.averageLatency).toBeGreaterThan(0);
    });
  });

  describe('initialization', () => {
    it('should initialize all adapters', async () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const adapter2 = new MockAdapter({ modelName: 'mock-2' });
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('mock2', adapter2);
      
      await manager.initializeAll();
      
      expect(adapter1.isInitialized).toBe(true);
      expect(adapter2.isInitialized).toBe(true);
    });

    it('should handle initialization failures gracefully', async () => {
      const adapter1 = new MockAdapter({ modelName: 'mock-1' });
      const failingAdapter = new MockAdapter({ modelName: 'failing' });
      
      // Mock initialization failure
      failingAdapter.initialize = async () => {
        throw new Error('Init failed');
      };
      
      manager.registerAdapter('mock1', adapter1);
      manager.registerAdapter('failing', failingAdapter);
      
      const results = await manager.initializeAll();
      expect(results.mock1).toBe(true);
      expect(results.failing).toBe(false);
    });

    it('should handle empty adapter list during initialization', async () => {
      const results = await manager.initializeAll();
      expect(results).toEqual({});
    });

    it('should track initialization status', async () => {
      const adapter = new MockAdapter({ modelName: 'test' });
      manager.registerAdapter('test', adapter);
      
      expect(adapter.isInitialized).toBe(false);
      await manager.initializeAll();
      expect(adapter.isInitialized).toBe(true);
    });
  });

  describe('adapter selection', () => {
    it('should select best adapter for request', async () => {
      const fastAdapter = new MockAdapter({ modelName: 'fast-model' });
      const powerfulAdapter = new MockAdapter({ modelName: 'powerful-model' });
      
      // Mock capabilities
      fastAdapter.getModelCapabilities = () => ({
        ...fastAdapter.getModelCapabilities(),
        maxTokens: 2048
      });
      
      powerfulAdapter.getModelCapabilities = () => ({
        ...powerfulAdapter.getModelCapabilities(),
        maxTokens: 100000,
        reasoning: true
      });
      
      await fastAdapter.initialize();
      await powerfulAdapter.initialize();
      
      manager.registerAdapter('fast', fastAdapter);
      manager.registerAdapter('powerful', powerfulAdapter);
      
      // Select for short request
      const shortRequest = { prompt: 'Short prompt', parameters: { maxTokens: 100 } };
      const selectedForShort = manager.selectAdapter(shortRequest);
      expect(selectedForShort).toBe('fast');
      
      // Select for long context
      const longRequest = { prompt: 'a'.repeat(5000), parameters: { maxTokens: 50000 } };
      const selectedForLong = manager.selectAdapter(longRequest);
      expect(selectedForLong).toBe('powerful');
    });

    it('should handle no adapters available', () => {
      const request = { prompt: 'Test prompt' };
      expect(() => manager.selectAdapter(request)).toThrow('No adapters available');
    });

    it('should select first adapter when all are equal', async () => {
      const adapter1 = new MockAdapter({ modelName: 'equal-1' });
      const adapter2 = new MockAdapter({ modelName: 'equal-2' });
      
      await adapter1.initialize();
      await adapter2.initialize();
      
      manager.registerAdapter('equal1', adapter1);
      manager.registerAdapter('equal2', adapter2);
      
      const request = { prompt: 'Equal selection test' };
      const selected = manager.selectAdapter(request);
      expect(['equal1', 'equal2']).toContain(selected);
    });

    it('should consider adapter capabilities in selection', async () => {
      const textOnlyAdapter = new MockAdapter({ modelName: 'text-only' });
      const multimodalAdapter = new MockAdapter({ modelName: 'multimodal' });
      
      textOnlyAdapter.getModelCapabilities = () => ({
        ...textOnlyAdapter.getModelCapabilities(),
        multimodal: false
      });
      
      multimodalAdapter.getModelCapabilities = () => ({
        ...multimodalAdapter.getModelCapabilities(),
        multimodal: true
      });
      
      await textOnlyAdapter.initialize();
      await multimodalAdapter.initialize();
      
      manager.registerAdapter('text', textOnlyAdapter);
      manager.registerAdapter('multi', multimodalAdapter);
      
      const multimodalRequest = { 
        prompt: 'Analyze image', 
        multimodal: { images: ['base64-data'] }
      };
      
      const selected = manager.selectAdapter(multimodalRequest);
      expect(selected).toBe('multi');
    });
  });
});
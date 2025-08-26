import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { UnifiedAPI } from '../../../src/adapters/unified-api';
// Mock all adapter dependencies
jest.mock('../../../src/adapters/gemini-adapter', () => ({
    GeminiAdapter: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        getCapabilities: jest.fn().mockReturnValue({
            textGeneration: true,
            codeGeneration: true,
            multimodal: true,
            streaming: true,
            functionCalling: true,
            longContext: false,
            reasoning: true,
            maxTokens: 1000000,
            supportedLanguages: ['en', 'es', 'fr'],
            inputTypes: ['text', 'image'],
            outputTypes: ['text']
        }),
        generate: jest.fn().mockResolvedValue({
            id: 'test-id',
            content: 'Gemini response',
            model: 'gemini-2.0-flash',
            timestamp: new Date(),
            latency: 100,
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            cost: 0.001,
            finishReason: 'STOP'
        }),
        generateStream: jest.fn().mockImplementation(async function* () {
            yield { id: '1', content: 'Hello', delta: 'Hello' };
            yield { id: '2', content: 'Hello World', delta: ' World', finishReason: 'STOP' };
        }),
        healthCheck: jest.fn().mockResolvedValue({
            status: 'healthy',
            latency: 50,
            lastChecked: new Date(),
            errors: [],
            metadata: {}
        })
    }))
}));
jest.mock('../../../src/adapters/deepmind-adapter', () => ({
    DeepMindAdapter: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        getCapabilities: jest.fn().mockReturnValue({
            textGeneration: true,
            codeGeneration: true,
            multimodal: true,
            streaming: true,
            functionCalling: true,
            longContext: true,
            reasoning: true,
            maxTokens: 2000000,
            supportedLanguages: ['en', 'es', 'fr', 'de'],
            inputTypes: ['text', 'image', 'audio'],
            outputTypes: ['text']
        }),
        generate: jest.fn().mockResolvedValue({
            id: 'test-id',
            content: 'DeepMind response',
            model: 'gemini-2.5-deepmind',
            timestamp: new Date(),
            latency: 150,
            usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
            cost: 0.002,
            finishReason: 'STOP'
        }),
        generateStream: jest.fn().mockImplementation(async function* () {
            yield { id: '1', content: 'DeepMind', delta: 'DeepMind' };
            yield { id: '2', content: 'DeepMind response', delta: ' response', finishReason: 'STOP' };
        }),
        healthCheck: jest.fn().mockResolvedValue({
            status: 'healthy',
            latency: 75,
            lastChecked: new Date(),
            errors: [],
            metadata: {}
        })
    }))
}));
jest.mock('../../../src/adapters/jules-workflow-adapter', () => ({
    JulesWorkflowAdapter: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        getCapabilities: jest.fn().mockReturnValue({
            textGeneration: true,
            codeGeneration: true,
            multimodal: true,
            streaming: true,
            functionCalling: true,
            longContext: true,
            reasoning: true,
            maxTokens: 1000000,
            supportedLanguages: ['en'],
            inputTypes: ['text', 'workflow'],
            outputTypes: ['text', 'workflow']
        }),
        generate: jest.fn().mockResolvedValue({
            id: 'test-id',
            content: 'Jules workflow response',
            model: 'jules-workflow',
            timestamp: new Date(),
            latency: 200,
            usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
            cost: 0.003,
            finishReason: 'STOP'
        }),
        generateStream: jest.fn().mockImplementation(async function* () {
            yield { id: '1', content: 'Jules', delta: 'Jules' };
            yield { id: '2', content: 'Jules workflow', delta: ' workflow', finishReason: 'STOP' };
        }),
        healthCheck: jest.fn().mockResolvedValue({
            status: 'healthy',
            latency: 100,
            lastChecked: new Date(),
            errors: [],
            metadata: {}
        })
    }))
}));
describe('UnifiedAPI', () => {
    let unifiedAPI;
    let config;
    beforeEach(() => {
        config = {
            routing: {
                strategy: 'balanced',
                latencyTarget: 75,
                fallbackEnabled: true,
                circuitBreakerThreshold: 5,
                retryAttempts: 3,
                retryDelay: 1000
            },
            caching: {
                enabled: true,
                ttl: 300000,
                maxSize: 1000,
                keyStrategy: 'prompt'
            },
            monitoring: {
                metricsEnabled: true,
                healthCheckInterval: 30000,
                performanceThreshold: 2000
            },
            models: {
                gemini: [{
                        modelName: 'gemini-2.0-flash',
                        model: 'gemini-2.0-flash',
                        timeout: 30000,
                        retryAttempts: 3,
                        streamingEnabled: true,
                        cachingEnabled: true,
                        apiKey: 'test-key'
                    }],
                deepmind: [{
                        modelName: 'deepmind-adapter',
                        model: 'gemini-2.5-deepmind',
                        projectId: 'test-project',
                        location: 'us-central1',
                        serviceAccountKey: 'test-key',
                        timeout: 30000,
                        retryAttempts: 3,
                        streamingEnabled: true,
                        cachingEnabled: true
                    }],
                jules: [{
                        modelName: 'jules-workflow',
                        julesApiKey: 'test-jules-key',
                        workflowEndpoint: 'https://api.jules.test/v1',
                        timeout: 30000,
                        retryAttempts: 3,
                        streamingEnabled: true,
                        cachingEnabled: true
                    }]
            }
        };
        jest.clearAllMocks();
    });
    afterEach(() => {
        if (unifiedAPI) {
            unifiedAPI.removeAllListeners();
        }
    });
    describe('initialization', () => {
        it('should initialize with all adapters', () => {
            unifiedAPI = new UnifiedAPI(config);
            expect(unifiedAPI).toBeDefined();
        });
        it('should initialize adapters with proper configuration', () => {
            unifiedAPI = new UnifiedAPI(config);
            // Verify adapters were created
            const GeminiAdapter = require('../../../src/adapters/gemini-adapter').GeminiAdapter;
            const DeepMindAdapter = require('../../../src/adapters/deepmind-adapter').DeepMindAdapter;
            const JulesWorkflowAdapter = require('../../../src/adapters/jules-workflow-adapter').JulesWorkflowAdapter;
            expect(GeminiAdapter).toHaveBeenCalledWith(config.models.gemini[0]);
            expect(DeepMindAdapter).toHaveBeenCalledWith(config.models.deepmind[0]);
            expect(JulesWorkflowAdapter).toHaveBeenCalledWith(config.models.jules[0]);
        });
        it('should handle empty model configurations', () => {
            const emptyConfig = {
                ...config,
                models: { gemini: [], deepmind: [], jules: [] }
            };
            expect(() => new UnifiedAPI(emptyConfig)).not.toThrow();
        });
    });
    describe('routing decisions', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should make routing decisions based on capabilities', async () => {
            const request = {
                prompt: 'Generate code for a sorting algorithm',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const decision = await unifiedAPI.getRoutingDecision(request);
            expect(decision).toMatchObject({
                selectedAdapter: expect.any(String),
                confidence: expect.any(Number),
                reasoning: expect.any(String),
                fallbacks: expect.any(Array),
                routingTime: expect.any(Number),
                factors: expect.objectContaining({
                    latency: expect.any(Number),
                    cost: expect.any(Number),
                    availability: expect.any(Number),
                    capability: expect.any(Number)
                })
            });
            expect(decision.routingTime).toBeLessThan(config.routing.latencyTarget);
        });
        it('should route to appropriate adapter for multimodal requests', async () => {
            const request = {
                prompt: 'Analyze these images',
                multimodal: {
                    images: ['base64-image-data']
                },
                context: {
                    requestId: 'test-req',
                    priority: 'high',
                    userTier: 'enterprise',
                    latencyTarget: 500
                }
            };
            const decision = await unifiedAPI.getRoutingDecision(request);
            // Should route to a multimodal-capable adapter
            expect(['gemini-gemini-2.0-flash', 'deepmind-gemini-2.5-deepmind', 'jules-jules-workflow'])
                .toContain(decision.selectedAdapter);
            expect(decision.confidence).toBeGreaterThan(0);
        });
        it('should prefer low-latency adapters for high priority requests', async () => {
            const request = {
                prompt: 'Quick response needed',
                context: {
                    requestId: 'test-req',
                    priority: 'critical',
                    userTier: 'enterprise',
                    latencyTarget: 100
                }
            };
            const decision = await unifiedAPI.getRoutingDecision(request);
            expect(decision.factors.latency).toBeGreaterThan(0.5);
        });
        it('should consider cost for free tier users', async () => {
            const request = {
                prompt: 'Cost-sensitive request',
                context: {
                    requestId: 'test-req',
                    priority: 'low',
                    userTier: 'free',
                    latencyTarget: 5000
                }
            };
            const decision = await unifiedAPI.getRoutingDecision(request);
            expect(decision.factors.cost).toBeGreaterThan(0);
        });
        it('should cache routing decisions', async () => {
            const request = {
                prompt: 'Cacheable request',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const decision1 = await unifiedAPI.getRoutingDecision(request);
            const decision2 = await unifiedAPI.getRoutingDecision(request);
            // Second call should be much faster (cached)
            expect(decision2.routingTime).toBeLessThan(decision1.routingTime);
            expect(decision1.selectedAdapter).toBe(decision2.selectedAdapter);
        });
    });
    describe('request generation', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should generate response successfully', async () => {
            const request = {
                prompt: 'Hello, world!',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const response = await unifiedAPI.generate(request);
            expect(response).toMatchObject({
                id: expect.any(String),
                content: expect.any(String),
                model: expect.any(String),
                timestamp: expect.any(Date),
                latency: expect.any(Number),
                usage: expect.objectContaining({
                    promptTokens: expect.any(Number),
                    completionTokens: expect.any(Number),
                    totalTokens: expect.any(Number)
                }),
                cost: expect.any(Number),
                finishReason: expect.any(String)
            });
            expect(response.content).toBeTruthy();
        });
        it('should emit request_completed event', async () => {
            const request = {
                prompt: 'Test request',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const eventPromise = new Promise((resolve) => {
                unifiedAPI.once('request_completed', resolve);
            });
            await unifiedAPI.generate(request);
            const event = await eventPromise;
            expect(event).toMatchObject({
                adapter: expect.any(String),
                latency: expect.any(Number),
                routingTime: expect.any(Number),
                success: true,
                request: expect.any(Object),
                response: expect.any(Object)
            });
        });
        it('should handle request failures with proper error emission', async () => {
            // Mock adapter to throw error
            const GeminiAdapter = require('../../../src/adapters/gemini-adapter').GeminiAdapter;
            GeminiAdapter.mockImplementationOnce(() => ({
                initialize: jest.fn().mockResolvedValue(undefined),
                getCapabilities: jest.fn().mockReturnValue({
                    textGeneration: true,
                    streaming: true,
                    maxTokens: 1000000
                }),
                generate: jest.fn().mockRejectedValue(new Error('API Error')),
                healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
            }));
            unifiedAPI = new UnifiedAPI(config);
            const request = {
                prompt: 'Failing request',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const eventPromise = new Promise((resolve) => {
                unifiedAPI.once('request_failed', resolve);
            });
            await expect(unifiedAPI.generate(request)).rejects.toThrow();
            const failEvent = await eventPromise;
            expect(failEvent).toMatchObject({
                error: expect.any(String),
                latency: expect.any(Number),
                request: expect.any(Object)
            });
        });
    });
    describe('streaming generation', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should stream responses successfully', async () => {
            const request = {
                prompt: 'Stream this response',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000,
                    streaming: true
                }
            };
            const chunks = [];
            for await (const chunk of unifiedAPI.generateStream(request)) {
                chunks.push(chunk);
            }
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0]).toMatchObject({
                id: expect.any(String),
                content: expect.any(String),
                delta: expect.any(String),
                metadata: expect.objectContaining({
                    adapter: expect.any(String),
                    routingDecision: expect.any(Object)
                })
            });
        });
        it('should emit stream_completed event', async () => {
            const request = {
                prompt: 'Stream test',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000,
                    streaming: true
                }
            };
            const eventPromise = new Promise((resolve) => {
                unifiedAPI.once('stream_completed', resolve);
            });
            const chunks = [];
            for await (const chunk of unifiedAPI.generateStream(request)) {
                chunks.push(chunk);
            }
            const event = await eventPromise;
            expect(event).toMatchObject({
                adapter: expect.any(String),
                latency: expect.any(Number),
                chunks: expect.any(Number),
                success: true
            });
        });
    });
    describe('fallback mechanisms', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should fallback to alternative adapter on failure', async () => {
            // Mock first adapter to fail, second to succeed
            const adapters = [
                jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                    getCapabilities: jest.fn().mockReturnValue({
                        textGeneration: true,
                        streaming: true,
                        maxTokens: 1000000
                    }),
                    generate: jest.fn().mockRejectedValue(new Error('Primary failed')),
                    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
                })),
                jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                    getCapabilities: jest.fn().mockReturnValue({
                        textGeneration: true,
                        streaming: true,
                        maxTokens: 1000000
                    }),
                    generate: jest.fn().mockResolvedValue({
                        id: 'fallback-id',
                        content: 'Fallback response',
                        model: 'fallback-model',
                        timestamp: new Date(),
                        latency: 100,
                        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
                        cost: 0.001,
                        finishReason: 'STOP'
                    }),
                    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
                }))
            ];
            // Replace mocks
            require('../../../src/adapters/gemini-adapter').GeminiAdapter = adapters[0];
            require('../../../src/adapters/deepmind-adapter').DeepMindAdapter = adapters[1];
            unifiedAPI = new UnifiedAPI(config);
            const request = {
                prompt: 'Test fallback',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const response = await unifiedAPI.generate(request);
            expect(response.content).toBe('Fallback response');
        });
        it('should throw error when all adapters fail', async () => {
            // Mock all adapters to fail
            const failingAdapter = jest.fn().mockImplementation(() => ({
                initialize: jest.fn().mockResolvedValue(undefined),
                getCapabilities: jest.fn().mockReturnValue({
                    textGeneration: true,
                    streaming: true,
                    maxTokens: 1000000
                }),
                generate: jest.fn().mockRejectedValue(new Error('All failed')),
                healthCheck: jest.fn().mockResolvedValue({ status: 'unhealthy' })
            }));
            require('../../../src/adapters/gemini-adapter').GeminiAdapter = failingAdapter;
            require('../../../src/adapters/deepmind-adapter').DeepMindAdapter = failingAdapter;
            require('../../../src/adapters/jules-workflow-adapter').JulesWorkflowAdapter = failingAdapter;
            unifiedAPI = new UnifiedAPI(config);
            const request = {
                prompt: 'Test total failure',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            await expect(unifiedAPI.generate(request)).rejects.toThrow();
        });
    });
    describe('circuit breaker', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should open circuit breaker after threshold failures', async () => {
            const failingAdapter = jest.fn().mockImplementation(() => ({
                initialize: jest.fn().mockResolvedValue(undefined),
                getCapabilities: jest.fn().mockReturnValue({
                    textGeneration: true,
                    streaming: true,
                    maxTokens: 1000000
                }),
                generate: jest.fn().mockRejectedValue(new Error('Repeated failure')),
                healthCheck: jest.fn().mockResolvedValue({ status: 'unhealthy' })
            }));
            require('../../../src/adapters/gemini-adapter').GeminiAdapter = failingAdapter;
            unifiedAPI = new UnifiedAPI(config);
            const request = {
                prompt: 'Circuit breaker test',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            // Trigger multiple failures to open circuit breaker
            for (let i = 0; i < config.routing.circuitBreakerThreshold; i++) {
                try {
                    await unifiedAPI.generate(request);
                }
                catch {
                    // Expected to fail
                }
            }
            // Verify circuit breaker affects routing
            const decision = await unifiedAPI.getRoutingDecision(request);
            expect(decision.factors.availability).toBeLessThan(1.0);
        });
    });
    describe('metrics collection', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should collect and return comprehensive metrics', async () => {
            const request = {
                prompt: 'Metrics test',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            await unifiedAPI.generate(request);
            const metrics = unifiedAPI.getMetrics();
            expect(metrics).toMatchObject({
                totalRequests: expect.any(Number),
                successfulRequests: expect.any(Number),
                failedRequests: expect.any(Number),
                averageLatency: expect.any(Number),
                averageRoutingTime: expect.any(Number),
                cacheHitRate: expect.any(Number),
                modelDistribution: expect.any(Object),
                errorDistribution: expect.any(Object),
                costMetrics: expect.objectContaining({
                    totalCost: expect.any(Number),
                    costPerRequest: expect.any(Number),
                    costPerToken: expect.any(Number)
                }),
                performanceMetrics: expect.objectContaining({
                    p50Latency: expect.any(Number),
                    p95Latency: expect.any(Number),
                    p99Latency: expect.any(Number),
                    throughput: expect.any(Number)
                })
            });
            expect(metrics.totalRequests).toBeGreaterThan(0);
            expect(metrics.successfulRequests).toBeGreaterThan(0);
        });
        it('should emit metrics_update events', (done) => {
            let eventCount = 0;
            unifiedAPI.on('metrics_update', (metrics) => {
                eventCount++;
                expect(metrics).toBeDefined();
                if (eventCount === 1)
                    done();
            });
            // Metrics should be emitted automatically
            setTimeout(() => {
                if (eventCount === 0) {
                    done(new Error('No metrics events emitted'));
                }
            }, 15000); // Allow time for first emission
        });
    });
    describe('health monitoring', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should return adapter health status', async () => {
            const health = await unifiedAPI.getAdapterHealth();
            expect(health).toBeDefined();
            expect(Object.keys(health).length).toBeGreaterThan(0);
            Object.values(health).forEach(adapterHealth => {
                expect(adapterHealth).toMatchObject({
                    status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
                    latency: expect.any(Number),
                    lastChecked: expect.any(Date),
                    errors: expect.any(Array),
                    metadata: expect.any(Object)
                });
            });
        });
        it('should emit health_check events', (done) => {
            let eventCount = 0;
            unifiedAPI.on('health_check', (data) => {
                eventCount++;
                expect(data).toMatchObject({
                    adapter: expect.any(String),
                    health: expect.any(Object)
                });
                if (eventCount === 1)
                    done();
            });
            // Health checks should be emitted automatically
            setTimeout(() => {
                if (eventCount === 0) {
                    done(new Error('No health check events emitted'));
                }
            }, 35000); // Allow time for first health check
        });
    });
    describe('routing strategies', () => {
        it('should route differently based on strategy', async () => {
            const strategies = ['latency', 'cost', 'quality', 'balanced'];
            const decisions = {};
            for (const strategy of strategies) {
                const strategyConfig = {
                    ...config,
                    routing: { ...config.routing, strategy: strategy }
                };
                const api = new UnifiedAPI(strategyConfig);
                const request = {
                    prompt: 'Strategy test',
                    context: {
                        requestId: 'test-req',
                        priority: 'medium',
                        userTier: 'pro',
                        latencyTarget: 1000
                    }
                };
                decisions[strategy] = await api.getRoutingDecision(request);
                api.removeAllListeners();
            }
            // Verify different strategies can produce different results
            expect(Object.keys(decisions)).toHaveLength(4);
            // Latency strategy should prioritize latency factor
            expect(decisions.latency.factors.latency).toBeGreaterThan(0);
            // Cost strategy should consider cost factor
            expect(decisions.cost.factors.cost).toBeGreaterThan(0);
        });
    });
    describe('edge cases and error handling', () => {
        beforeEach(() => {
            unifiedAPI = new UnifiedAPI(config);
        });
        it('should handle requests with no capable adapters', async () => {
            const request = {
                prompt: 'Test incompatible request',
                multimodal: {
                    images: ['test']
                },
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            // Mock all adapters as non-multimodal
            const nonMultimodalAdapter = jest.fn().mockImplementation(() => ({
                initialize: jest.fn().mockResolvedValue(undefined),
                getCapabilities: jest.fn().mockReturnValue({
                    textGeneration: true,
                    multimodal: false,
                    streaming: true,
                    maxTokens: 1000000
                }),
                healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
            }));
            require('../../../src/adapters/gemini-adapter').GeminiAdapter = nonMultimodalAdapter;
            require('../../../src/adapters/deepmind-adapter').DeepMindAdapter = nonMultimodalAdapter;
            require('../../../src/adapters/jules-workflow-adapter').JulesWorkflowAdapter = nonMultimodalAdapter;
            const incompatibleAPI = new UnifiedAPI(config);
            await expect(incompatibleAPI.getRoutingDecision(request)).rejects.toThrow('No capable adapters found');
        });
        it('should handle empty prompt requests', async () => {
            const request = {
                prompt: '',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            // Should still route successfully (validation happens at adapter level)
            const decision = await unifiedAPI.getRoutingDecision(request);
            expect(decision.selectedAdapter).toBeDefined();
        });
        it('should handle requests without context', async () => {
            const request = {
                prompt: 'Test without context'
            };
            const decision = await unifiedAPI.getRoutingDecision(request);
            expect(decision.selectedAdapter).toBeDefined();
            expect(decision.confidence).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=unified-api.test.js.map
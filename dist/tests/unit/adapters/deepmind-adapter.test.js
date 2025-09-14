import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DeepMindAdapter } from '../../../src/adapters/deepmind-adapter';
// Mock Google Auth Library
jest.mock('google-auth-library', () => ({
    GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({
            getAccessToken: jest.fn().mockResolvedValue('mock-access-token')
        })
    }))
}));
// Mock fetch for Vertex AI requests
global.fetch = jest.fn();
describe('DeepMindAdapter', () => {
    let adapter;
    const config = {
        modelName: 'deepmind-adapter',
        model: 'gemini-2.5-deepmind',
        projectId: 'test-project',
        location: 'us-central1',
        serviceAccountKey: 'path/to/key.json',
        advancedReasoning: true,
        longContextMode: true,
        timeout: 30000,
        retryAttempts: 3,
        streamingEnabled: true,
        cachingEnabled: true
    };
    beforeEach(() => {
        adapter = new DeepMindAdapter(config);
        jest.clearAllMocks();
    });
    describe('initialization', () => {
        it('should initialize successfully with required config', async () => {
            await adapter.initialize();
            expect(adapter.isInitialized).toBe(true);
        });
        it('should throw error when project ID is missing', () => {
            const invalidConfig = { ...config, projectId: '' };
            expect(() => new DeepMindAdapter(invalidConfig)).toThrow('Project ID is required');
        });
        it('should initialize enterprise features when configured', async () => {
            const enterpriseConfig = {
                ...config,
                enterpriseFeatures: {
                    dataResidency: 'us',
                    auditLogging: true,
                    encryption: 'cmek',
                    accessControls: ['pro', 'enterprise']
                }
            };
            const enterpriseAdapter = new DeepMindAdapter(enterpriseConfig);
            await enterpriseAdapter.initialize();
            expect(enterpriseAdapter.isInitialized).toBe(true);
        });
    });
    describe('capabilities', () => {
        it('should return correct capabilities for gemini-2.5-deepmind', () => {
            const caps = adapter.getModelCapabilities();
            expect(caps).toMatchObject({
                textGeneration: true,
                codeGeneration: true,
                multimodal: true,
                streaming: true,
                functionCalling: true,
                longContext: true,
                reasoning: true,
                maxTokens: 2000000 // 2M tokens
            });
        });
        it('should return enhanced capabilities for gemini-2.5-ultra', () => {
            const ultraAdapter = new DeepMindAdapter({ ...config, model: 'gemini-2.5-ultra' });
            const caps = ultraAdapter.getModelCapabilities();
            expect(caps.maxTokens).toBe(4000000); // 4M tokens
        });
        it('should return different capabilities for gemini-2.5-pro', () => {
            const proAdapter = new DeepMindAdapter({ ...config, model: 'gemini-2.5-pro' });
            const caps = proAdapter.getModelCapabilities();
            expect(caps.maxTokens).toBe(1000000); // 1M tokens
        });
    });
    describe('generate method', () => {
        beforeEach(async () => {
            await adapter.initialize();
            // Mock successful Vertex AI response
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    predictions: [{
                            content: 'DeepMind response with advanced reasoning',
                            finishReason: 'STOP',
                            safetyRatings: [],
                            reasoningSteps: ['Step 1: Analyze', 'Step 2: Reason', 'Step 3: Conclude']
                        }],
                    metadata: {
                        tokenMetadata: {
                            inputTokenCount: 100,
                            outputTokenCount: 50,
                            totalTokenCount: 150
                        }
                    }
                })
            });
        });
        it('should generate response successfully', async () => {
            const request = {
                prompt: 'Test complex reasoning task',
                context: {
                    requestId: 'test-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            const response = await adapter.generate(request);
            expect(response.content).toBe('DeepMind response with advanced reasoning');
            expect(response.model).toBe('gemini-2.5-deepmind');
            expect(response.usage.totalTokens).toBe(150);
            expect(response.metadata?.reasoningSteps).toHaveLength(3);
        });
        it('should cache complex reasoning results', async () => {
            const request = {
                prompt: 'analyze this complex mathematical proof step by step',
                context: {
                    requestId: 'test-cache-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            // First call
            const response1 = await adapter.generate(request);
            // Second call (should be cached)
            const response2 = await adapter.generate(request);
            // Fetch should only be called once
            expect(fetch).toHaveBeenCalledTimes(1);
        });
        it('should optimize long context requests', async () => {
            const longPrompt = 'a'.repeat(100000); // 100k characters
            const request = {
                prompt: longPrompt,
                context: {
                    requestId: 'test-long-123',
                    sessionId: 'test-session',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 10000
                }
            };
            await adapter.generate(request);
            // Should manage context window
            expect(fetch).toHaveBeenCalled();
        });
        it('should apply advanced reasoning for complex queries', async () => {
            const request = {
                prompt: 'Analyze and compare these algorithms step by step',
                parameters: { maxTokens: 5000 },
                context: {
                    requestId: 'test-reasoning-123',
                    priority: 'high',
                    userTier: 'pro',
                    latencyTarget: 8000
                }
            };
            await adapter.generate(request);
            expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                body: expect.stringContaining('chain_of_thought')
            }));
        });
    });
    describe('streaming', () => {
        beforeEach(async () => {
            await adapter.initialize();
            // Mock streaming response
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: {"predictions":[{"text":"Hello ","reasoning_step":"Greeting"}]}\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"predictions":[{"text":"World","reasoning_step":"Completion","finishReason":"STOP"}]}\n'));
                    controller.close();
                }
            });
            global.fetch.mockResolvedValue({
                ok: true,
                body: mockStream
            });
        });
        it('should stream content with reasoning steps', async () => {
            const request = {
                prompt: 'Stream test with reasoning',
                context: {
                    requestId: 'test-stream-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000,
                    streaming: true
                }
            };
            const chunks = [];
            for await (const chunk of adapter.generateStream(request)) {
                chunks.push(chunk);
            }
            expect(chunks).toHaveLength(2);
            expect(chunks[0].content).toBe('Hello ');
            expect(chunks[0].metadata?.reasoningSteps).toContain('Greeting');
            expect(chunks[1].content).toBe('Hello World');
            expect(chunks[1].finishReason).toBe('STOP');
        });
    });
    describe('error handling', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should handle Vertex AI specific errors', async () => {
            global.fetch.mockRejectedValue({
                code: 8, // RESOURCE_EXHAUSTED
                message: 'Quota exceeded'
            });
            const request = {
                prompt: 'Test error handling',
                context: {
                    requestId: 'test-error-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            await expect(adapter.generate(request)).rejects.toMatchObject({
                code: 'QUOTA_EXCEEDED',
                statusCode: 429,
                retryable: true
            });
        });
        it('should handle data residency violations', async () => {
            global.fetch.mockRejectedValue({
                message: 'data residency requirement not met'
            });
            const request = {
                prompt: 'Test data residency',
                context: {
                    requestId: 'test-residency-123',
                    priority: 'medium',
                    userTier: 'enterprise',
                    latencyTarget: 5000
                }
            };
            await expect(adapter.generate(request)).rejects.toMatchObject({
                code: 'DATA_RESIDENCY_VIOLATION',
                statusCode: 403
            });
        });
        it('should handle enterprise access control', async () => {
            const restrictedConfig = {
                ...config,
                enterpriseFeatures: {
                    accessControls: ['pro', 'enterprise']
                }
            };
            const restrictedAdapter = new DeepMindAdapter(restrictedConfig);
            await restrictedAdapter.initialize();
            const request = {
                prompt: 'Test access control',
                context: {
                    requestId: 'test-access-123',
                    priority: 'medium',
                    userTier: 'free',
                    latencyTarget: 5000
                }
            };
            await expect(restrictedAdapter.validateRequest(request)).rejects.toMatchObject({
                code: 'ACCESS_DENIED',
                statusCode: 403
            });
        });
    });
    describe('validation', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should validate prompt requirements', async () => {
            const request = {
                prompt: '',
                context: {
                    requestId: 'test-validate-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            await expect(adapter.validateRequest(request)).rejects.toThrow('Prompt is required');
        });
        it('should validate prompt length limits', async () => {
            const tooLongPrompt = 'a'.repeat(8000001); // > 2M tokens (8M chars / 4 chars per token)
            const request = {
                prompt: tooLongPrompt,
                context: {
                    requestId: 'test-length-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            await expect(adapter.validateRequest(request)).rejects.toThrow('Prompt too long');
        });
    });
    describe('performance and cost', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should calculate cost correctly for different models', async () => {
            const request = {
                prompt: 'Calculate cost',
                context: {
                    requestId: 'test-cost-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    predictions: [{ content: 'Response' }],
                    metadata: {
                        tokenMetadata: {
                            inputTokenCount: 1000,
                            outputTokenCount: 1000,
                            totalTokenCount: 2000
                        }
                    }
                })
            });
            const response = await adapter.generate(request);
            // For gemini-2.5-deepmind at $0.005 per 1K tokens
            expect(response.cost).toBeCloseTo(0.01); // 2000 tokens * 0.000005
        });
        it('should track performance metrics', async () => {
            const request = {
                prompt: 'Performance test',
                context: {
                    requestId: 'test-perf-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            const logSpy = jest.spyOn(adapter.logger, 'info');
            await adapter.generate(request);
            expect(logSpy).toHaveBeenCalledWith('Performance metric', expect.objectContaining({
                operation: 'generate',
                success: true,
                tokenUsage: expect.any(Object)
            }));
        });
    });
    describe('multimodal support', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should handle multimodal requests', async () => {
            const request = {
                prompt: 'Analyze these images',
                multimodal: {
                    images: ['base64-image-1', 'base64-image-2'],
                    audio: ['base64-audio'],
                    video: ['base64-video']
                },
                context: {
                    requestId: 'test-multimodal-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 8000
                }
            };
            await adapter.generate(request);
            expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                body: expect.stringContaining('multimodal_content')
            }));
        });
    });
    describe('safety settings', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should apply default safety settings', async () => {
            const request = {
                prompt: 'Test safety',
                context: {
                    requestId: 'test-safety-123',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 5000
                }
            };
            await adapter.generate(request);
            expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                body: expect.stringContaining('HARM_CATEGORY_')
            }));
        });
    });
});
//# sourceMappingURL=deepmind-adapter.test.js.map
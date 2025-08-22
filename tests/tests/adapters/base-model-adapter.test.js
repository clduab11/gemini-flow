import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BaseModelAdapter } from '../../../src/adapters/base-model-adapter';
// Mock implementation for testing
class TestAdapter extends BaseModelAdapter {
    async initialize() {
        this.isInitialized = true;
    }
    async generate(request) {
        this.ensureInitialized();
        await this.validateRequest(request);
        return {
            id: this.generateRequestId(),
            content: `Test response for: ${request.prompt}`,
            model: 'test-model',
            timestamp: new Date(),
            latency: 100,
            usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30
            },
            cost: 0.001,
            finishReason: 'stop'
        };
    }
    async *generateStream(request) {
        this.ensureInitialized();
        await this.validateRequest(request);
        const chunks = ['Hello', ' ', 'World'];
        for (const [index, chunk] of chunks.entries()) {
            yield {
                id: `${request.context?.requestId}-${index}`,
                content: chunk,
                delta: chunk,
                metadata: { index }
            };
        }
    }
    async validateRequest(request) {
        if (!request.prompt || typeof request.prompt !== 'string') {
            throw this.createError('Prompt is required and must be a string', 'INVALID_PROMPT', 400, false);
        }
        return true;
    }
    transformRequest(request) {
        return {
            prompt: request.prompt,
            parameters: request.parameters || {}
        };
    }
    transformResponse(response, request) {
        return {
            id: request.context?.requestId || this.generateRequestId(),
            content: response.content || 'Default response',
            model: 'test-model',
            timestamp: new Date(),
            latency: 100,
            usage: response.usage || { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            cost: 0.001,
            finishReason: response.finishReason || 'stop'
        };
    }
    handleError(error, request) {
        if (error instanceof Error) {
            return this.createError(error.message, 'ADAPTER_ERROR', 500, true, { originalError: error, requestId: request.context?.requestId });
        }
        return this.createError(`Unknown error: ${String(error)}`, 'UNKNOWN_ERROR', 500, false);
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
            inputTypes: ['text'],
            outputTypes: ['text']
        };
    }
}
describe('BaseModelAdapter', () => {
    let adapter;
    const config = {
        modelName: 'test-adapter',
        timeout: 30000,
        retryAttempts: 3,
        streamingEnabled: true,
        cachingEnabled: false
    };
    beforeEach(() => {
        adapter = new TestAdapter(config);
    });
    describe('initialization', () => {
        it('should start uninitialized', () => {
            expect(adapter.isInitialized).toBe(false);
        });
        it('should initialize successfully', async () => {
            await adapter.initialize();
            expect(adapter.isInitialized).toBe(true);
        });
        it('should throw error when calling generate before initialization', async () => {
            const request = { prompt: 'test' };
            await expect(adapter.generate(request)).rejects.toThrow('Adapter not initialized');
        });
    });
    describe('request ID generation', () => {
        it('should generate unique request IDs', () => {
            const id1 = adapter.generateRequestId();
            const id2 = adapter.generateRequestId();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^test-adapter-\d+-[a-z0-9]+$/);
        });
    });
    describe('context creation', () => {
        it('should create context with defaults when no context provided', () => {
            const context = adapter.ensureRequestId();
            expect(context).toMatchObject({
                priority: 'medium',
                userTier: 'free',
                latencyTarget: 10000
            });
            expect(context.requestId).toBeDefined();
        });
        it('should add requestId when missing from existing context', () => {
            const partial = {
                priority: 'high',
                userTier: 'pro',
                latencyTarget: 3000,
                userId: 'user123'
            };
            const context = adapter.ensureRequestId(partial);
            expect(context.priority).toBe('high');
            expect(context.userId).toBe('user123');
            expect(context.userTier).toBe('pro');
            expect(context.requestId).toBeDefined();
        });
        it('should preserve existing requestId', () => {
            const partial = {
                requestId: 'existing-id',
                priority: 'high',
                userTier: 'pro',
                latencyTarget: 3000
            };
            const context = adapter.ensureRequestId(partial);
            expect(context.requestId).toBe('existing-id');
        });
    });
    describe('error handling', () => {
        it('should create adapter errors with proper structure', () => {
            const error = adapter.createError('Test error', 'TEST_ERROR', 500, true);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.statusCode).toBe(500);
            expect(error.retryable).toBe(true);
            expect(error.model).toBe('test-adapter');
        });
        it('should create errors with default values', () => {
            const error = adapter.createError('Simple error', 'SIMPLE_ERROR');
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Simple error');
            expect(error.code).toBe('SIMPLE_ERROR');
            expect(error.statusCode).toBeUndefined();
            expect(error.retryable).toBe(false);
            expect(error.model).toBe('test-adapter');
        });
        it('should create errors with metadata', () => {
            const metadata = { requestId: 'test-123', extra: 'data' };
            const error = adapter.createError('Test error', 'TEST_ERROR', 500, true, metadata);
            expect(error.metadata).toEqual(metadata);
        });
        it('should handle different error types', () => {
            const errorObj = new Error('Original error');
            const handled = adapter.handleError(errorObj, {});
            expect(handled).toBeInstanceOf(Error);
            expect(handled.message).toBe('Original error');
            expect(handled.code).toBe('ADAPTER_ERROR');
        });
        it('should handle unknown error types', () => {
            const handled = adapter.handleError('string error', {});
            expect(handled).toBeInstanceOf(Error);
            expect(handled.message).toBe('Unknown error: string error');
            expect(handled.code).toBe('UNKNOWN_ERROR');
        });
    });
    describe('generate method', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should generate response successfully', async () => {
            const request = {
                prompt: 'Hello world',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const response = await adapter.generate(request);
            expect(response.content).toBe('Test response for: Hello world');
            expect(response.model).toBe('test-model');
            expect(response.usage.totalTokens).toBe(30);
        });
        it('should include metadata in request if provided', async () => {
            const request = {
                prompt: 'Test',
                metadata: { custom: 'data' }
            };
            const response = await adapter.generate(request);
            expect(response).toBeDefined();
        });
        it('should validate request before generation', async () => {
            const request = {
                prompt: '',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            await expect(adapter.generate(request)).rejects.toThrow('Prompt is required');
        });
        it('should generate response with parameters', async () => {
            const request = {
                prompt: 'Test with parameters',
                parameters: {
                    temperature: 0.8,
                    maxTokens: 100
                },
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const response = await adapter.generate(request);
            expect(response.content).toBe('Test response for: Test with parameters');
        });
        it('should generate response with system message', async () => {
            const request = {
                prompt: 'User message',
                systemMessage: 'You are a helpful assistant',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const response = await adapter.generate(request);
            expect(response.content).toBe('Test response for: User message');
        });
    });
    describe('streaming', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should stream chunks successfully', async () => {
            const request = {
                prompt: 'Stream test',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const chunks = [];
            for await (const chunk of adapter.generateStream(request)) {
                chunks.push(chunk);
            }
            expect(chunks).toHaveLength(3);
            expect(chunks.map(c => c.content).join('')).toBe('Hello World');
        });
        it('should validate request before streaming', async () => {
            const request = {
                prompt: '',
                context: {
                    requestId: 'test-req',
                    priority: 'medium',
                    userTier: 'pro',
                    latencyTarget: 1000
                }
            };
            const streamGenerator = adapter.generateStream(request);
            await expect(streamGenerator.next()).rejects.toThrow('Prompt is required');
        });
    });
    describe('health check', () => {
        it('should report healthy when initialized and working', async () => {
            await adapter.initialize();
            const health = await adapter.healthCheck();
            expect(health.status).toBe('healthy');
            expect(health.latency).toBeGreaterThan(0);
            expect(health.lastChecked).toBeInstanceOf(Date);
            expect(health.errors).toEqual([]);
            expect(health.metadata).toMatchObject({
                responseLength: expect.any(Number),
                tokenUsage: expect.any(Number)
            });
        });
        it('should report unhealthy when generate fails', async () => {
            await adapter.initialize();
            // Mock generate to fail
            const originalGenerate = adapter.generate;
            adapter.generate = jest.fn().mockRejectedValue(new Error('Health check failed'));
            const health = await adapter.healthCheck();
            expect(health.status).toBe('unhealthy');
            expect(health.errors).toHaveLength(1);
            expect(health.errors[0]).toBe('Health check failed');
            // Restore original method
            adapter.generate = originalGenerate;
        });
        it('should emit health_check event', (done) => {
            adapter.once('health_check', (healthData) => {
                expect(healthData).toMatchObject({
                    status: expect.stringMatching(/^(healthy|unhealthy)$/),
                    latency: expect.any(Number),
                    lastChecked: expect.any(Date)
                });
                done();
            });
            adapter.initialize().then(() => {
                adapter.healthCheck();
            });
        });
    });
    describe('performance logging', () => {
        it('should log performance metrics', () => {
            const logSpy = jest.spyOn(adapter.logger, 'info');
            adapter.logPerformance('test-operation', 150, true);
            expect(logSpy).toHaveBeenCalledWith('Performance metric', expect.objectContaining({
                operation: 'test-operation',
                model: 'test-adapter',
                latency: 150,
                success: true
            }));
        });
        it('should log performance metrics with metadata', () => {
            const logSpy = jest.spyOn(adapter.logger, 'info');
            const metadata = { tokenUsage: 100, custom: 'data' };
            adapter.logPerformance('test-operation', 150, true, metadata);
            expect(logSpy).toHaveBeenCalledWith('Performance metric', expect.objectContaining({
                operation: 'test-operation',
                model: 'test-adapter',
                latency: 150,
                success: true,
                tokenUsage: 100,
                custom: 'data'
            }));
        });
        it('should emit performance event', (done) => {
            adapter.once('performance', (perfData) => {
                expect(perfData).toMatchObject({
                    operation: 'test-operation',
                    model: 'test-adapter',
                    latency: 150,
                    success: true,
                    timestamp: expect.any(Date)
                });
                done();
            });
            adapter.logPerformance('test-operation', 150, true);
        });
    });
    describe('configuration management', () => {
        it('should return adapter configuration', () => {
            const configCopy = adapter.getConfig();
            expect(configCopy).toEqual(config);
            expect(configCopy).not.toBe(config); // Should be a copy
        });
        it('should update configuration', () => {
            const updates = {
                timeout: 60000,
                retryAttempts: 5
            };
            adapter.updateConfig(updates);
            const updatedConfig = adapter.getConfig();
            expect(updatedConfig.timeout).toBe(60000);
            expect(updatedConfig.retryAttempts).toBe(5);
            expect(updatedConfig.modelName).toBe('test-adapter'); // Unchanged
        });
    });
    describe('capability checking', () => {
        it('should return capabilities', () => {
            const caps = adapter.getCapabilities();
            expect(caps).toMatchObject({
                textGeneration: true,
                codeGeneration: true,
                multimodal: false,
                streaming: true,
                functionCalling: false,
                longContext: false,
                reasoning: false,
                maxTokens: 4096,
                supportedLanguages: ['en'],
                inputTypes: ['text'],
                outputTypes: ['text']
            });
        });
        it('should check individual capabilities', () => {
            expect(adapter.supportsCapability('textGeneration')).toBe(true);
            expect(adapter.supportsCapability('multimodal')).toBe(false);
            expect(adapter.supportsCapability('streaming')).toBe(true);
            expect(adapter.supportsCapability('functionCalling')).toBe(false);
        });
    });
    describe('cost calculation', () => {
        it('should calculate cost based on token usage', () => {
            const usage = { totalTokens: 1000 };
            const costPerToken = 0.000001;
            const cost = adapter.calculateCost(usage, costPerToken);
            expect(cost).toBe(0.001);
        });
        it('should handle zero tokens', () => {
            const usage = { totalTokens: 0 };
            const costPerToken = 0.000001;
            const cost = adapter.calculateCost(usage, costPerToken);
            expect(cost).toBe(0);
        });
    });
    describe('cleanup', () => {
        it('should cleanup resources', async () => {
            await adapter.initialize();
            expect(adapter.isInitialized).toBe(true);
            const removeListenersSpy = jest.spyOn(adapter, 'removeAllListeners');
            await adapter.cleanup();
            expect(adapter.isInitialized).toBe(false);
            expect(removeListenersSpy).toHaveBeenCalled();
        });
    });
    describe('last health check', () => {
        it('should return undefined when no health check performed', () => {
            const lastHealth = adapter.getLastHealthCheck();
            expect(lastHealth).toBeUndefined();
        });
        it('should return last health check result', async () => {
            await adapter.initialize();
            await adapter.healthCheck();
            const lastHealth = adapter.getLastHealthCheck();
            expect(lastHealth).toMatchObject({
                status: 'healthy',
                latency: expect.any(Number),
                lastChecked: expect.any(Date)
            });
        });
    });
});
//# sourceMappingURL=base-model-adapter.test.js.map
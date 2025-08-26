import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VertexAIConnector } from '../../../src/core/vertex-ai-connector';
// Mock Google Cloud AI Platform
jest.mock('@google-cloud/aiplatform', () => ({
    VertexAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => 'Vertex AI response',
                    usageMetadata: {
                        promptTokenCount: 100,
                        candidatesTokenCount: 50,
                        totalTokenCount: 150
                    }
                }
            })
        })
    }))
}));
// Mock Google Auth Library
jest.mock('google-auth-library', () => ({
    GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({
            getAccessToken: jest.fn().mockResolvedValue('mock-access-token')
        })
    }))
}));
describe('VertexAIConnector', () => {
    let connector;
    const config = {
        projectId: 'test-project',
        location: 'us-central1',
        apiEndpoint: 'https://us-central1-aiplatform.googleapis.com',
        maxConcurrentRequests: 5,
        requestTimeout: 30000
    };
    beforeEach(() => {
        connector = new VertexAIConnector(config);
        jest.clearAllMocks();
    });
    describe('initialization', () => {
        it('should initialize Vertex AI client successfully', (done) => {
            connector.on('initialized', () => {
                expect(connector).toBeDefined();
                done();
            });
        });
        it('should load available models', async () => {
            // Wait for initialization
            await new Promise(resolve => connector.on('initialized', resolve));
            const models = connector.getAvailableModels();
            expect(models.length).toBeGreaterThan(0);
            expect(models.some(m => m.name === 'gemini-1.5-pro')).toBe(true);
            expect(models.some(m => m.name === 'gemini-1.5-flash')).toBe(true);
        });
    });
    describe('model management', () => {
        it('should get model configuration', () => {
            const modelConfig = connector.getModelConfig('gemini-1.5-pro');
            expect(modelConfig).toMatchObject({
                name: 'gemini-1.5-pro',
                publisher: 'google',
                inputTokenLimit: 1000000,
                supportsBatch: true,
                supportsStreaming: true
            });
        });
        it('should check model capabilities', () => {
            expect(connector.supportsCapability('gemini-1.5-pro', 'multimodal')).toBe(true);
            expect(connector.supportsCapability('gemini-1.5-pro', 'long-context')).toBe(true);
            expect(connector.supportsCapability('gemini-1.0-pro', 'fast')).toBe(false);
        });
    });
    describe('prediction', () => {
        it('should execute single prediction successfully', async () => {
            const request = {
                model: 'gemini-1.5-flash',
                instances: ['Test prompt'],
                parameters: {
                    temperature: 0.7,
                    maxOutputTokens: 100
                }
            };
            const response = await connector.predict(request);
            expect(response.predictions).toHaveLength(1);
            expect(response.predictions[0]).toEqual({ content: 'Vertex AI response' });
            expect(response.metadata.tokenUsage).toEqual({
                input: 100,
                output: 50,
                total: 150
            });
            expect(response.metadata.cost).toBeGreaterThan(0);
        });
        it('should handle model not available error', async () => {
            const request = {
                model: 'non-existent-model',
                instances: ['Test']
            };
            await expect(connector.predict(request)).rejects.toThrow('Model not available');
        });
        it('should cache successful responses', async () => {
            const request = {
                model: 'gemini-1.5-flash',
                instances: ['Cached prompt']
            };
            // First call
            const response1 = await connector.predict(request);
            // Second call (should be cached)
            const response2 = await connector.predict(request);
            // Check that responses are identical (indicating cache hit)
            expect(response1.predictions).toEqual(response2.predictions);
        });
        it('should handle concurrent request limits', async () => {
            const requests = Array(10).fill(null).map((_, i) => ({
                model: 'gemini-1.5-flash',
                instances: [`Concurrent test ${i}`]
            }));
            // Should queue requests beyond max concurrent
            const promises = requests.map(req => connector.predict(req));
            const results = await Promise.all(promises);
            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result.predictions).toHaveLength(1);
            });
        });
    });
    describe('batch prediction', () => {
        it('should execute batch prediction with chunking', async () => {
            const instances = Array(25).fill(null).map((_, i) => `Batch prompt ${i}`);
            const response = await connector.batchPredict('gemini-1.5-pro', instances, { temperature: 0.5 }, 10 // chunk size
            );
            expect(response.predictions).toHaveLength(25);
            expect(response.metadata.tokenUsage.total).toBeGreaterThan(0);
        });
        it('should reject batch prediction for unsupported models', async () => {
            // Mock a model that doesn't support batch
            const modelConfig = connector.getModelConfig('gemini-1.0-pro');
            if (modelConfig) {
                modelConfig.supportsBatch = false;
            }
            await expect(connector.batchPredict('gemini-1.0-pro', ['test'])).rejects.toThrow('does not support batch processing');
        });
    });
    describe('streaming prediction', () => {
        it('should stream predictions for supported models', async () => {
            const chunks = [];
            for await (const chunk of connector.streamPredict('gemini-1.5-flash', 'Stream test')) {
                chunks.push(chunk);
            }
            expect(chunks).toHaveLength(1);
            expect(chunks[0]).toEqual({ content: 'Vertex AI response' });
        });
        it('should reject streaming for unsupported models', async () => {
            expect(() => connector.streamPredict('gemini-1.0-pro', 'Stream test')).rejects.toThrow('does not support streaming');
        });
    });
    describe('performance monitoring', () => {
        it('should track request metrics', async () => {
            await connector.predict({
                model: 'gemini-1.5-flash',
                instances: ['Test metrics']
            });
            const metrics = connector.getMetrics();
            expect(metrics.totalRequests).toBe(1);
            expect(metrics.successfulRequests).toBe(1);
            expect(metrics.failedRequests).toBe(0);
            expect(metrics.avgLatency).toBeGreaterThan(0);
            expect(metrics.successRate).toBe(1);
        });
        it('should emit events for request lifecycle', (done) => {
            let eventCount = 0;
            connector.on('request_completed', (data) => {
                expect(data.success).toBe(true);
                expect(data.model).toBe('gemini-1.5-flash');
                eventCount++;
                if (eventCount === 1)
                    done();
            });
            connector.predict({
                model: 'gemini-1.5-flash',
                instances: ['Event test']
            });
        });
        it('should track failed requests', async () => {
            // Mock a failure
            const VertexAI = require('@google-cloud/aiplatform').VertexAI;
            VertexAI.mockImplementationOnce(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
                })
            }));
            const failingConnector = new VertexAIConnector(config);
            try {
                await failingConnector.predict({
                    model: 'gemini-1.5-flash',
                    instances: ['Fail test']
                });
            }
            catch (error) {
                // Expected to fail
            }
            const metrics = failingConnector.getMetrics();
            expect(metrics.failedRequests).toBe(1);
        });
    });
    describe('health check', () => {
        it('should report healthy status', async () => {
            const health = await connector.healthCheck();
            expect(health.status).toBe('healthy');
            expect(health.latency).toBeGreaterThan(0);
            expect(health.error).toBeUndefined();
        });
        it('should report unhealthy status on error', async () => {
            // Mock a failure
            const VertexAI = require('@google-cloud/aiplatform').VertexAI;
            VertexAI.mockImplementationOnce(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn().mockRejectedValue(new Error('Health check failed'))
                })
            }));
            const unhealthyConnector = new VertexAIConnector(config);
            const health = await unhealthyConnector.healthCheck();
            expect(health.status).toBe('unhealthy');
            expect(health.error).toBe('Health check failed');
        });
    });
    describe('cost calculation', () => {
        it('should calculate costs based on model and token usage', async () => {
            const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
            for (const model of models) {
                const response = await connector.predict({
                    model,
                    instances: ['Cost test']
                });
                expect(response.metadata.cost).toBeGreaterThan(0);
                // Flash should be cheaper than Pro
                if (model === 'gemini-1.5-flash') {
                    const proResponse = await connector.predict({
                        model: 'gemini-1.5-pro',
                        instances: ['Cost test']
                    });
                    expect(response.metadata.cost).toBeLessThan(proResponse.metadata.cost);
                }
            }
        });
    });
    describe('request formatting', () => {
        it('should format different instance types correctly', async () => {
            const testCases = [
                'Simple string',
                { prompt: 'Object with prompt' },
                { text: 'Object with text' },
                { complex: 'data', nested: { value: 123 } }
            ];
            for (const testCase of testCases) {
                const response = await connector.predict({
                    model: 'gemini-1.5-flash',
                    instances: [testCase]
                });
                expect(response.predictions).toHaveLength(1);
            }
        });
    });
    describe('cache management', () => {
        it('should include cache statistics in metrics', async () => {
            // Make a cached request
            const request = {
                model: 'gemini-1.5-flash',
                instances: ['Cache stats test']
            };
            await connector.predict(request);
            await connector.predict(request); // Should hit cache
            const metrics = connector.getMetrics();
            expect(metrics.cacheStats).toBeDefined();
            expect(metrics.cacheStats.hits).toBeGreaterThan(0);
        });
    });
    describe('shutdown', () => {
        it('should shutdown cleanly', () => {
            const logSpy = jest.spyOn(connector['logger'], 'info');
            connector.shutdown();
            expect(logSpy).toHaveBeenCalledWith('Vertex AI connector shutdown');
        });
    });
});
//# sourceMappingURL=vertex-ai-connector.test.js.map
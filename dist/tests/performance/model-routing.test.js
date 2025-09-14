/**
 * Model Routing Performance Benchmarks
 * Validates <100ms routing requirement for production readiness
 */
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const { ModelRouter, PerformanceMonitor } = require('../../src/core/model-router');
const { HiveMemory } = require('../../src/utils/hive-memory');
describe('Model Routing Performance Benchmarks', () => {
    let modelRouter;
    let performanceMonitor;
    let hiveMemory;
    beforeAll(async () => {
        modelRouter = new ModelRouter({
            geminiApiKey: process.env.GEMINI_API_KEY,
            vertexProjectId: process.env.VERTEX_PROJECT_ID,
            region: 'us-central1'
        });
        performanceMonitor = new PerformanceMonitor();
        hiveMemory = new HiveMemory();
        await modelRouter.initialize();
    });
    afterAll(async () => {
        await modelRouter.cleanup();
    });
    describe('Single Model Routing Performance', () => {
        test('should route to Gemini Pro within 100ms', async () => {
            const testPrompt = "What is artificial intelligence?";
            const iterations = 50;
            const routingTimes = [];
            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                const route = await modelRouter.selectOptimalModel({
                    prompt: testPrompt,
                    requirements: {
                        maxTokens: 1000,
                        temperature: 0.7,
                        priority: 'speed'
                    }
                });
                const endTime = performance.now();
                const routingTime = endTime - startTime;
                routingTimes.push(routingTime);
                expect(route).toBeDefined();
                expect(route.model).toBeTruthy();
                expect(routingTime).toBeLessThan(100); // Critical requirement
            }
            const stats = calculatePerformanceStats(routingTimes);
            expect(stats.average).toBeLessThan(100);
            expect(stats.p95).toBeLessThan(150);
            expect(stats.p99).toBeLessThan(200);
            await storePerformanceResult('routing/single_model/gemini_pro', {
                iterations,
                stats,
                requirement_met: stats.average < 100,
                model_type: 'gemini-pro'
            });
        });
        test('should route to Vertex AI within 100ms', async () => {
            const testPrompt = "Analyze this complex data structure";
            const iterations = 50;
            const routingTimes = [];
            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                const route = await modelRouter.selectOptimalModel({
                    prompt: testPrompt,
                    requirements: {
                        maxTokens: 2000,
                        temperature: 0.3,
                        priority: 'accuracy'
                    }
                });
                const endTime = performance.now();
                const routingTime = endTime - startTime;
                routingTimes.push(routingTime);
                expect(routingTime).toBeLessThan(100);
            }
            const stats = calculatePerformanceStats(routingTimes);
            await storePerformanceResult('routing/single_model/vertex_ai', {
                iterations,
                stats,
                requirement_met: stats.average < 100,
                model_type: 'vertex-ai'
            });
        });
    });
    describe('Multi-Model Load Balancing Performance', () => {
        test('should handle concurrent routing requests efficiently', async () => {
            const concurrentRequests = 20;
            const promises = [];
            const startTime = performance.now();
            for (let i = 0; i < concurrentRequests; i++) {
                const promise = modelRouter.selectOptimalModel({
                    prompt: `Request ${i}: Explain quantum computing`,
                    requirements: {
                        maxTokens: 1500,
                        temperature: 0.5,
                        priority: 'balanced'
                    }
                });
                promises.push(promise);
            }
            const results = await Promise.all(promises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const averageTimePerRequest = totalTime / concurrentRequests;
            expect(results).toHaveLength(concurrentRequests);
            expect(averageTimePerRequest).toBeLessThan(100);
            // Validate load distribution
            const modelDistribution = {};
            results.forEach(result => {
                const model = result.model;
                modelDistribution[model] = (modelDistribution[model] || 0) + 1;
            });
            await storePerformanceResult('routing/concurrent/load_balancing', {
                concurrentRequests,
                totalTime,
                averageTimePerRequest,
                modelDistribution,
                requirement_met: averageTimePerRequest < 100
            });
        });
        test('should maintain performance under stress conditions', async () => {
            const stressTestRequests = 100;
            const batchSize = 10;
            const batches = Math.ceil(stressTestRequests / batchSize);
            const allResults = [];
            for (let batch = 0; batch < batches; batch++) {
                const batchPromises = [];
                const batchStartTime = performance.now();
                for (let i = 0; i < batchSize; i++) {
                    const requestId = batch * batchSize + i;
                    const promise = modelRouter.selectOptimalModel({
                        prompt: `Stress test ${requestId}: Complex analysis task`,
                        requirements: {
                            maxTokens: 1000,
                            temperature: 0.4,
                            priority: 'speed'
                        }
                    });
                    batchPromises.push(promise);
                }
                const batchResults = await Promise.all(batchPromises);
                const batchEndTime = performance.now();
                const batchTime = batchEndTime - batchStartTime;
                const avgBatchTime = batchTime / batchSize;
                allResults.push(...batchResults.map((result, index) => ({
                    ...result,
                    batchId: batch,
                    requestId: batch * batchSize + index,
                    responseTime: avgBatchTime
                })));
                expect(avgBatchTime).toBeLessThan(100);
            }
            const overallStats = calculatePerformanceStats(allResults.map(r => r.responseTime));
            await storePerformanceResult('routing/stress/high_load', {
                totalRequests: stressTestRequests,
                batchSize,
                batches,
                overallStats,
                requirement_met: overallStats.average < 100
            });
        });
    });
    describe('Adaptive Routing Intelligence', () => {
        test('should learn from routing performance and adapt', async () => {
            const learningIterations = 30;
            const performanceHistory = [];
            for (let i = 0; i < learningIterations; i++) {
                const startTime = performance.now();
                // Simulate different types of requests
                const requestType = i % 3 === 0 ? 'creative' : i % 3 === 1 ? 'analytical' : 'conversational';
                const route = await modelRouter.selectOptimalModel({
                    prompt: `${requestType} task: ${generateTestPrompt(requestType)}`,
                    requirements: {
                        maxTokens: 1200,
                        temperature: requestType === 'creative' ? 0.8 : 0.4,
                        priority: 'adaptive'
                    }
                });
                const endTime = performance.now();
                const routingTime = endTime - startTime;
                performanceHistory.push({
                    iteration: i,
                    requestType,
                    routingTime,
                    selectedModel: route.model,
                    confidence: route.confidence || 0
                });
                // Feed performance back to router for learning
                await modelRouter.recordPerformance({
                    routingDecision: route,
                    actualPerformance: routingTime,
                    requestType
                });
            }
            // Analyze learning progression
            const earlyPerformance = performanceHistory.slice(0, 10);
            const latePerformance = performanceHistory.slice(-10);
            const earlyAvg = earlyPerformance.reduce((sum, p) => sum + p.routingTime, 0) / 10;
            const lateAvg = latePerformance.reduce((sum, p) => sum + p.routingTime, 0) / 10;
            const improvementRatio = earlyAvg / lateAvg;
            expect(improvementRatio).toBeGreaterThan(1); // Should improve over time
            expect(lateAvg).toBeLessThan(100); // Final performance should meet requirement
            await storePerformanceResult('routing/adaptive/learning', {
                learningIterations,
                earlyAverage: earlyAvg,
                lateAverage: lateAvg,
                improvementRatio,
                performanceHistory: performanceHistory.slice(-5), // Last 5 for sample
                requirement_met: lateAvg < 100
            });
        });
    });
    // Helper functions
    function calculatePerformanceStats(times) {
        const sorted = [...times].sort((a, b) => a - b);
        const sum = times.reduce((a, b) => a + b, 0);
        return {
            average: sum / times.length,
            median: sorted[Math.floor(sorted.length / 2)],
            min: Math.min(...times),
            max: Math.max(...times),
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            standardDeviation: Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - (sum / times.length), 2), 0) / times.length)
        };
    }
    function generateTestPrompt(type) {
        const prompts = {
            creative: "Write a creative story about AI in the future",
            analytical: "Analyze the performance metrics of this system",
            conversational: "Explain how machine learning works in simple terms"
        };
        return prompts[type] || "General AI task";
    }
    async function storePerformanceResult(testKey, result) {
        const memoryKey = `hive/validation/performance/${testKey}`;
        const memoryValue = {
            timestamp: new Date().toISOString(),
            agent: 'Integration_Validator',
            performanceResult: result,
            testKey
        };
        await hiveMemory.store(memoryKey, memoryValue);
    }
});
export {};
//# sourceMappingURL=model-routing.test.js.map
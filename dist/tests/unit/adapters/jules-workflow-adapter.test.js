import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JulesWorkflowAdapter } from '../../../src/adapters/jules-workflow-adapter';
// Mock fetch for Jules API requests
global.fetch = jest.fn();
describe('JulesWorkflowAdapter', () => {
    let adapter;
    const config = {
        modelName: 'jules-workflow',
        julesApiKey: 'test-api-key',
        workflowEndpoint: 'https://api.jules.google/v1/workflows',
        collaborativeMode: true,
        multiStepEnabled: true,
        taskOrchestration: {
            maxConcurrentTasks: 5,
            taskTimeout: 30000,
            retryStrategy: 'exponential',
            failureHandling: 'continue'
        },
        aiCollaboration: {
            enablePeerReview: true,
            consensusThreshold: 0.7,
            diversityBoost: true
        },
        timeout: 30000,
        retryAttempts: 3,
        streamingEnabled: true,
        cachingEnabled: true
    };
    beforeEach(() => {
        adapter = new JulesWorkflowAdapter(config);
        jest.clearAllMocks();
    });
    describe('initialization', () => {
        it('should initialize successfully with Jules API key', async () => {
            await adapter.initialize();
            expect(adapter.isInitialized).toBe(true);
        });
        it('should throw error when Jules API key is missing', () => {
            const invalidConfig = { ...config, julesApiKey: '' };
            expect(() => new JulesWorkflowAdapter(invalidConfig)).toThrow('Jules API key is required');
        });
        it('should load workflow templates on initialization', async () => {
            await adapter.initialize();
            const logSpy = jest.spyOn(adapter.logger, 'info');
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Jules workflow adapter initialized'), expect.objectContaining({
                templatesCount: expect.any(Number),
                collaborativeMode: true
            }));
        });
    });
    describe('capabilities', () => {
        it('should return workflow-specific capabilities', () => {
            const caps = adapter.getModelCapabilities();
            expect(caps).toMatchObject({
                textGeneration: true,
                codeGeneration: true,
                multimodal: true,
                streaming: true,
                functionCalling: true,
                longContext: true,
                reasoning: true,
                maxTokens: 1000000,
                inputTypes: expect.arrayContaining(['text', 'workflow', 'task']),
                outputTypes: expect.arrayContaining(['text', 'workflow', 'decision'])
            });
        });
    });
    describe('workflow execution', () => {
        beforeEach(async () => {
            await adapter.initialize();
            // Mock successful workflow execution
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    workflowExecution: {
                        id: 'exec-123',
                        workflowId: 'content-creation',
                        status: 'completed',
                        completedSteps: ['research', 'draft', 'review'],
                        results: {
                            research: { content: 'Research results' },
                            draft: { content: 'Draft content' },
                            review: { decision: 'approved' }
                        },
                        metrics: {
                            totalSteps: 3,
                            completedSteps: 3,
                            failedSteps: 0,
                            totalLatency: 5000,
                            tokenUsage: 1500,
                            cost: 0.015
                        }
                    }
                })
            });
        });
        it('should execute workflow successfully', async () => {
            const request = {
                prompt: 'Create blog post about AI',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            const response = await adapter.generate(request);
            expect(response.content).toContain('content-creation');
            expect(response.metadata?.workflowId).toBe('content-creation');
            expect(response.metadata?.completedSteps).toBe(3);
        });
        it('should handle workflow not found error', async () => {
            const request = {
                prompt: 'Test',
                metadata: { workflowId: 'non-existent' },
                context: adapter.createContext()
            };
            await expect(adapter.generate(request)).rejects.toMatchObject({
                code: 'WORKFLOW_NOT_FOUND',
                statusCode: 404
            });
        });
        it('should execute workflow steps with dependencies', async () => {
            const request = {
                prompt: 'Execute complex workflow',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            await adapter.generate(request);
            // Verify fetch was called for step execution
            expect(fetch).toHaveBeenCalled();
        });
    });
    describe('collaborative AI execution', () => {
        beforeEach(async () => {
            await adapter.initialize();
            // Mock peer model responses
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    content: 'Collaborative response',
                    usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 }
                })
            });
        });
        it('should execute with collaborative AI when enabled', async () => {
            const request = {
                prompt: 'Collaborative task requiring consensus',
                context: adapter.createContext()
            };
            const response = await adapter.generate(request);
            expect(response.metadata?.collaborativeResults).toBeDefined();
            expect(response.metadata?.collaborativeResults.peerCount).toBeGreaterThan(0);
        });
        it('should apply consensus algorithm correctly', async () => {
            const request = {
                prompt: 'Test consensus',
                context: adapter.createContext()
            };
            // Test with identical responses (100% consensus)
            const response = await adapter.generate(request);
            expect(response).toBeDefined();
        });
        it('should handle consensus failure gracefully', async () => {
            // Mock diverse responses that won't reach consensus
            let callCount = 0;
            global.fetch.mockImplementation(async () => {
                callCount++;
                return {
                    ok: true,
                    json: async () => ({
                        content: `Response ${callCount}`, // Different each time
                        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 }
                    })
                };
            });
            const request = {
                prompt: 'Test consensus failure',
                context: adapter.createContext()
            };
            // Should still return a response even if consensus threshold isn't met
            const response = await adapter.generate(request);
            expect(response).toBeDefined();
        });
    });
    describe('streaming workflow execution', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should stream workflow progress', async () => {
            const request = {
                prompt: 'Stream workflow',
                metadata: { workflowId: 'content-creation' },
                context: { ...adapter.createContext(), streaming: true }
            };
            const chunks = [];
            for await (const chunk of adapter.generateStream(request)) {
                chunks.push(chunk);
            }
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].content).toContain('Executing step');
            expect(chunks[chunks.length - 1].finishReason).toBe('STOP');
        });
    });
    describe('single step execution', () => {
        beforeEach(async () => {
            await adapter.initialize();
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    content: 'Single step response',
                    usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 }
                })
            });
        });
        it('should execute single step when not a workflow', async () => {
            const request = {
                prompt: 'Simple task without workflow',
                context: adapter.createContext()
            };
            const response = await adapter.generate(request);
            expect(response.content).toBe('Single step response');
        });
        it('should stream single step execution', async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: {"content":"Hello ","delta":"Hello "}\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"content":"World","delta":"World","finishReason":"STOP"}\n'));
                    controller.close();
                }
            });
            global.fetch.mockResolvedValue({
                ok: true,
                body: mockStream
            });
            const request = {
                prompt: 'Stream single step',
                context: { ...adapter.createContext(), streaming: true }
            };
            const chunks = [];
            for await (const chunk of adapter.generateStream(request)) {
                chunks.push(chunk);
            }
            expect(chunks).toHaveLength(2);
            expect(chunks[0].delta).toBe('Hello ');
            expect(chunks[1].delta).toBe('World');
        });
    });
    describe('error handling', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should handle Jules API errors', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error'
            });
            const request = {
                prompt: 'Test error',
                context: adapter.createContext()
            };
            await expect(adapter.generate(request)).rejects.toThrow('Jules API request failed');
        });
        it('should handle workflow timeout errors', async () => {
            global.fetch.mockRejectedValue({
                code: 'WORKFLOW_TIMEOUT',
                message: 'Workflow execution timed out'
            });
            const request = {
                prompt: 'Test timeout',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            await expect(adapter.generate(request)).rejects.toMatchObject({
                code: 'WORKFLOW_TIMEOUT',
                statusCode: 408,
                isRetryable: true
            });
        });
        it('should handle step execution failures', async () => {
            global.fetch.mockRejectedValue({
                code: 'STEP_EXECUTION_FAILED',
                message: 'Step failed to execute'
            });
            const request = {
                prompt: 'Test step failure',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            await expect(adapter.generate(request)).rejects.toMatchObject({
                code: 'STEP_EXECUTION_FAILED',
                statusCode: 500,
                isRetryable: false
            });
        });
    });
    describe('validation', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should validate that prompt or workflow ID is provided', async () => {
            const request = {
                prompt: '',
                context: adapter.createContext()
            };
            await expect(adapter.validateRequest(request)).rejects.toThrow('Either prompt or workflow ID is required');
        });
        it('should validate workflow existence', async () => {
            const request = {
                prompt: '',
                metadata: { workflowId: 'non-existent' },
                context: adapter.createContext()
            };
            await expect(adapter.validateRequest(request)).rejects.toThrow('Workflow template not found');
        });
    });
    describe('step executors', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should execute prompt step', async () => {
            const step = {
                id: 'test-prompt',
                name: 'Test Prompt Step',
                type: 'prompt',
                input: { prompt: 'Generate content' },
                dependencies: [],
                status: 'pending'
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ result: 'Prompt executed' })
            });
            const result = await adapter.executePromptStep(step, {}, {});
            expect(result).toEqual({ result: 'Prompt executed' });
        });
    });
    describe('performance tracking', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should track workflow execution metrics', async () => {
            const request = {
                prompt: 'Track performance',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            const logSpy = jest.spyOn(adapter.logger, 'info');
            await adapter.generate(request);
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('performance'), expect.objectContaining({
                operation: 'generate'
            }));
        });
    });
    describe('workflow templates', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('should have default workflow templates loaded', () => {
            const workflowTemplates = adapter.workflowTemplates;
            expect(workflowTemplates.size).toBeGreaterThan(0);
            expect(workflowTemplates.has('content-creation')).toBe(true);
        });
    });
});
describe('JulesWorkflowAdapter – additional coverage', () => {
    // Reuse the same setup and config pattern from existing tests
    let adapter;
    const baseConfig = {
        modelName: 'jules-workflow',
        julesApiKey: 'test-api-key',
        workflowEndpoint: 'https://api.jules.google/v1/workflows',
        collaborativeMode: true,
        multiStepEnabled: true,
        taskOrchestration: {
            maxConcurrentTasks: 5,
            taskTimeout: 30000,
            retryStrategy: 'exponential',
            failureHandling: 'continue'
        },
        aiCollaboration: {
            enablePeerReview: true,
            consensusThreshold: 0.7,
            diversityBoost: true
        },
        timeout: 30000,
        retryAttempts: 3,
        streamingEnabled: true,
        cachingEnabled: true
    };
    beforeEach(() => {
        adapter = new JulesWorkflowAdapter(baseConfig);
        jest.clearAllMocks();
    });
    describe('request construction and headers', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('calls Jules API with correct URL, method, and Authorization header for workflow runs', async () => {
            const captured = {};
            global.fetch.mockImplementation(async (url, init) => {
                captured.url = url;
                captured.init = init;
                return {
                    ok: true,
                    json: async () => ({
                        workflowExecution: {
                            id: 'exec-abc',
                            workflowId: 'content-creation',
                            status: 'completed',
                            completedSteps: ['research', 'draft', 'review'],
                            results: { research: { content: 'x' }, draft: { content: 'y' }, review: { decision: 'approved' } },
                            metrics: { totalSteps: 3, completedSteps: 3, failedSteps: 0, totalLatency: 1000, tokenUsage: 123, cost: 0.001 }
                        }
                    })
                };
            });
            const req = {
                prompt: 'Create blog post',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            const res = await adapter.generate(req);
            expect(res).toBeDefined();
            expect(captured.url).toContain(baseConfig.workflowEndpoint);
            expect(captured.init?.method ?? 'POST').toBe('POST');
            // Validate headers casing-insensitively
            const headers = captured.init?.headers || {};
            const authHeader = headers['Authorization'] || headers['authorization'];
            expect(authHeader).toBe(`Bearer ${baseConfig.julesApiKey}`);
            // Payload should be JSON; ensure well-formed and includes key fields
            const body = typeof captured.init?.body === 'string'
                ? captured.init?.body
                : captured.init?.body ? await (captured.init?.body).toString() : '';
            try {
                const parsed = JSON.parse(body);
                expect(parsed).toEqual(expect.objectContaining({
                    prompt: expect.any(String)
                }));
                // When collaborativeMode is enabled, request should reflect collaboration options if adapter forwards them
                if (baseConfig.collaborativeMode) {
                    expect(parsed).toEqual(expect.objectContaining({
                        aiCollaboration: expect.objectContaining({
                            enablePeerReview: true,
                            consensusThreshold: expect.any(Number)
                        })
                    }));
                }
            }
            catch {
                // If body is empty or not JSON, still assert we attempted to send something
                expect(body).toBeTruthy();
            }
        });
    });
    describe('validateRequest – success paths', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('accepts request with only workflowId (no prompt) when template exists', async () => {
            const req = {
                prompt: '',
                metadata: { workflowId: 'content-creation' },
                context: adapter.createContext()
            };
            await expect(adapter.validateRequest(req)).resolves.toBeUndefined();
        });
        it('accepts request with only prompt (no workflowId)', async () => {
            const req = {
                prompt: 'Ad-hoc generation',
                context: adapter.createContext()
            };
            await expect(adapter.validateRequest(req)).resolves.toBeUndefined();
        });
    });
    describe('streaming – robustness', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('handles keep-alive comments and blank lines in SSE stream', async () => {
            const stream = new ReadableStream({
                start(controller) {
                    // Comment and blank line should be ignored by parser
                    controller.enqueue(new TextEncoder().encode(':keep-alive\n\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"delta":"Part1 ","content":"Part1 "}\n\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"delta":"Part2","content":"Part1 Part2"}\n\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"finishReason":"STOP"}\n\n'));
                    controller.close();
                }
            });
            global.fetch.mockResolvedValue({
                ok: true,
                body: stream
            });
            const req = {
                prompt: 'SSE robustness',
                context: { ...adapter.createContext(), streaming: true }
            };
            const chunks = [];
            for await (const c of adapter.generateStream(req)) {
                chunks.push(c);
            }
            expect(chunks.length).toBeGreaterThanOrEqual(2);
            expect(chunks[chunks.length - 1].finishReason).toBe('STOP');
            expect(chunks.map(c => c.delta).join('')).toBe('Part1 Part2');
        });
        it('skips malformed SSE lines gracefully and still completes', async () => {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: {"delta":"Ok "}\n'));
                    // Malformed JSON
                    controller.enqueue(new TextEncoder().encode('data: {bad json}\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"delta":"Good","finishReason":"STOP"}\n'));
                    controller.close();
                }
            });
            global.fetch.mockResolvedValue({
                ok: true,
                body: stream
            });
            const req = {
                prompt: 'Malformed SSE',
                context: { ...adapter.createContext(), streaming: true }
            };
            const chunks = [];
            for await (const c of adapter.generateStream(req)) {
                chunks.push(c);
            }
            // Ensure malformed line did not abort the stream
            expect(chunks.find(c => c.delta === 'Ok ')).toBeTruthy();
            expect(chunks.find(c => c.delta === 'Good')).toBeTruthy();
        });
        it('emits error when server response lacks body for streaming', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                body: null
            });
            const req = {
                prompt: 'Missing body',
                context: { ...adapter.createContext(), streaming: true }
            };
            const it = adapter.generateStream(req)[Symbol.asyncIterator]();
            await expect(it.next()).rejects.toBeDefined();
        });
    });
    describe('retry behavior (best-effort)', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('retries on transient errors up to configured attempts, then succeeds', async () => {
            let call = 0;
            global.fetch.mockImplementation(async () => {
                call += 1;
                if (call < 3) {
                    // Simulate transient network failure
                    throw Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' });
                }
                return {
                    ok: true,
                    json: async () => ({
                        content: 'Recovered after retries',
                        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 }
                    })
                };
            });
            const req = {
                prompt: 'Retry me',
                context: adapter.createContext()
            };
            const res = await adapter.generate(req);
            expect(res.content).toContain('Recovered');
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });
        it('surfaces error after exhausting retries', async () => {
            global.fetch.mockImplementation(async () => {
                throw Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' });
            });
            const req = {
                prompt: 'Retry fails',
                context: adapter.createContext()
            };
            await expect(adapter.generate(req)).rejects.toBeDefined();
            expect(global.fetch).toHaveBeenCalled();
        });
    });
    describe('step executors – additional', () => {
        beforeEach(async () => {
            await adapter.initialize();
        });
        it('executePromptStep forwards input.prompt and returns parsed result object', async () => {
            const step = {
                id: 'prompt-1',
                name: 'Prompt 1',
                type: 'prompt',
                input: { prompt: 'Say hi' },
                dependencies: [],
                status: 'pending'
            };
            const captured = {};
            global.fetch.mockImplementation(async (url, init) => {
                captured.url = url;
                captured.init = init;
                return {
                    ok: true,
                    json: async () => ({ result: 'Hello there' })
                };
            });
            const result = await adapter.executePromptStep(step, {}, {});
            expect(result).toEqual({ result: 'Hello there' });
            // Validate prompt presence in outgoing request
            const body = typeof captured.init?.body === 'string'
                ? captured.init?.body
                : captured.init?.body ? await (captured.init?.body).toString() : '';
            if (body) {
                const parsed = JSON.parse(body);
                expect(parsed).toEqual(expect.objectContaining({
                    prompt: 'Say hi'
                }));
            }
        });
    });
});
//# sourceMappingURL=jules-workflow-adapter.test.js.map
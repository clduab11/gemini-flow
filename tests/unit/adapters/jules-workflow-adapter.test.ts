import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JulesWorkflowAdapter } from '../../../src/adapters/jules-workflow-adapter';
import type { JulesWorkflowConfig, ModelRequest, WorkflowStep } from '../../../src/adapters/jules-workflow-adapter';

// Mock fetch for Jules API requests
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('JulesWorkflowAdapter', () => {
  let adapter: JulesWorkflowAdapter;
  const config: JulesWorkflowConfig = {
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
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Jules workflow adapter initialized'),
        expect.objectContaining({
          templatesCount: expect.any(Number),
          collaborativeMode: true
        })
      );
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
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
      } as Response);
    });

    it('should execute workflow successfully', async () => {
      const request: ModelRequest = {
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
      const request: ModelRequest = {
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
      const request: ModelRequest = {
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Collaborative response',
          usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 }
        })
      } as Response);
    });

    it('should execute with collaborative AI when enabled', async () => {
      const request: ModelRequest = {
        prompt: 'Collaborative task requiring consensus',
        context: adapter.createContext()
      };

      const response = await adapter.generate(request);
      expect(response.metadata?.collaborativeResults).toBeDefined();
      expect(response.metadata?.collaborativeResults.peerCount).toBeGreaterThan(0);
    });

    it('should apply consensus algorithm correctly', async () => {
      const request: ModelRequest = {
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            content: `Response ${callCount}`, // Different each time
            usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 }
          })
        } as Response;
      });

      const request: ModelRequest = {
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
      const request: ModelRequest = {
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
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Single step response',
          usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 }
        })
      } as Response);
    });

    it('should execute single step when not a workflow', async () => {
      const request: ModelRequest = {
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

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        body: mockStream
      } as Response);

      const request: ModelRequest = {
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      } as Response);

      const request: ModelRequest = {
        prompt: 'Test error',
        context: adapter.createContext()
      };

      await expect(adapter.generate(request)).rejects.toThrow('Jules API request failed');
    });

    it('should handle workflow timeout errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue({
        code: 'WORKFLOW_TIMEOUT',
        message: 'Workflow execution timed out'
      });

      const request: ModelRequest = {
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue({
        code: 'STEP_EXECUTION_FAILED',
        message: 'Step failed to execute'
      });

      const request: ModelRequest = {
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
      const request: ModelRequest = {
        prompt: '',
        context: adapter.createContext()
      };

      await expect(adapter.validateRequest(request)).rejects.toThrow('Either prompt or workflow ID is required');
    });

    it('should validate workflow existence', async () => {
      const request: ModelRequest = {
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
      const step: WorkflowStep = {
        id: 'test-prompt',
        name: 'Test Prompt Step',
        type: 'prompt',
        input: { prompt: 'Generate content' },
        dependencies: [],
        status: 'pending'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'Prompt executed' })
      } as Response);

      const result = await (adapter as any).executePromptStep(step, {}, {});
      expect(result).toEqual({ result: 'Prompt executed' });
    });
  });

  describe('performance tracking', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should track workflow execution metrics', async () => {
      const request: ModelRequest = {
        prompt: 'Track performance',
        metadata: { workflowId: 'content-creation' },
        context: adapter.createContext()
      };

      const logSpy = jest.spyOn(adapter.logger, 'info');
      await adapter.generate(request);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('performance'),
        expect.objectContaining({
          operation: 'generate'
        })
      );
    });
  });

  describe('workflow templates', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should have default workflow templates loaded', () => {
      const workflowTemplates = (adapter as any).workflowTemplates;
      expect(workflowTemplates.size).toBeGreaterThan(0);
      expect(workflowTemplates.has('content-creation')).toBe(true);
    });
  });
});
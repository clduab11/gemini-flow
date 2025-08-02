/**
 * Jules.google Workflow Adapter
 * 
 * Specialized adapter for jules.google workflow integration
 * Handles multi-step AI workflows, task orchestration, and collaborative AI
 */

import { 
  BaseModelAdapter, 
  ModelCapabilities, 
  ModelRequest, 
  ModelResponse, 
  StreamChunk,
  AdapterConfig,
  AdapterError 
} from './base-model-adapter.js';

export interface JulesWorkflowConfig extends AdapterConfig {
  julesApiKey: string;
  workflowEndpoint?: string;
  collaborativeMode?: boolean;
  workflowTemplates?: string[];
  multiStepEnabled?: boolean;
  taskOrchestration?: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryStrategy: 'exponential' | 'linear' | 'fixed';
    failureHandling: 'abort' | 'continue' | 'fallback';
  };
  aiCollaboration?: {
    enablePeerReview: boolean;
    consensusThreshold: number;
    diversityBoost: boolean;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'prompt' | 'function' | 'decision' | 'parallel' | 'merge';
  input: any;
  output?: any;
  model?: string;
  dependencies: string[];
  timeout?: number;
  retryCount?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  metadata?: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers: string[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  completedSteps: string[];
  results: Record<string, any>;
  errors: Array<{ step: string; error: string; timestamp: Date }>;
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    totalLatency: number;
    tokenUsage: number;
    cost: number;
  };
}

export class JulesWorkflowAdapter extends BaseModelAdapter {
  private julesApiKey: string;
  private workflowEndpoint: string;
  private activeExecutions = new Map<string, WorkflowExecution>();
  private workflowTemplates = new Map<string, WorkflowDefinition>();
  private stepExecutors = new Map<string, Function>();

  // Collaborative AI features
  private peerModels: string[] = [];
  // private _consensusResults = new Map<string, any[]>(); // Reserved for future use

  constructor(config: JulesWorkflowConfig) {
    super(config);
    this.julesApiKey = config.julesApiKey;
    this.workflowEndpoint = config.workflowEndpoint || 'https://api.jules.google/v1/workflows';

    if (!config.julesApiKey) {
      throw this.createError(
        'Jules API key is required',
        'MISSING_JULES_API_KEY',
        401,
        false
      );
    }

    this.initializeStepExecutors();
    this.initializePeerModels();
  }

  async initialize(): Promise<void> {
    try {
      // Load workflow templates
      await this.loadWorkflowTemplates();
      
      // Initialize peer models for collaboration
      if ((this.config as JulesWorkflowConfig).collaborativeMode) {
        await this.initializeCollaborativeFeatures();
      }

      this.isInitialized = true;
      
      this.logger.info('Jules workflow adapter initialized', { 
        templatesCount: this.workflowTemplates.size,
        collaborativeMode: (this.config as JulesWorkflowConfig).collaborativeMode,
        peerModels: this.peerModels.length
      });

    } catch (error) {
      this.logger.error('Failed to initialize Jules workflow adapter', { error });
      throw this.handleError(error, {} as ModelRequest);
    }
  }

  getModelCapabilities(): ModelCapabilities {
    return {
      textGeneration: true,
      codeGeneration: true,
      multimodal: true,
      streaming: true,
      functionCalling: true,
      longContext: true,
      reasoning: true,
      multiAgent: true,
      complexProblemSolving: true,
      chainOfThought: true,
      maxTokens: 1000000,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      inputTypes: ['text', 'image', 'audio', 'workflow', 'task'],
      outputTypes: ['text', 'structured', 'workflow', 'decision']
    };
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = performance.now();
    
    this.ensureInitialized();
    await this.validateRequest(request);

    try {
      // Check if this is a workflow request
      if (this.isWorkflowRequest(request)) {
        return await this.executeWorkflow(request);
      }

      // Check if collaborative AI is enabled
      if ((this.config as JulesWorkflowConfig).aiCollaboration?.enablePeerReview) {
        return await this.executeWithCollaboration(request);
      }

      // Standard single-step execution
      return await this.executeSingleStep(request);

    } catch (error) {
      const latency = performance.now() - startTime;
      this.logPerformance('generate', latency, false, { error: error instanceof Error ? error.message : String(error) });
      throw this.handleError(error, request);
    }
  }

  async *generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk> {
    this.ensureInitialized();
    await this.validateRequest(request);

    if (this.isWorkflowRequest(request)) {
      // Stream workflow execution progress
      yield* this.streamWorkflowExecution(request);
    } else {
      // Stream single-step execution
      yield* this.streamSingleStep(request);
    }
  }

  async validateRequest(request: ModelRequest): Promise<boolean> {
    if (!request.prompt && !request.metadata?.workflowId) {
      throw this.createError(
        'Either prompt or workflow ID is required',
        'INVALID_REQUEST',
        400,
        false
      );
    }

    // Validate workflow-specific requirements
    if (request.metadata?.workflowId) {
      const workflowId = request.metadata.workflowId;
      if (!this.workflowTemplates.has(workflowId)) {
        throw this.createError(
          `Workflow template not found: ${workflowId}`,
          'WORKFLOW_NOT_FOUND',
          404,
          false
        );
      }
    }

    return true;
  }

  protected transformRequest(request: ModelRequest): any {
    if (this.isWorkflowRequest(request)) {
      return this.transformWorkflowRequest(request);
    }

    return {
      prompt: request.prompt,
      parameters: request.parameters,
      context: request.context,
      systemMessage: request.systemMessage,
      tools: request.tools,
      multimodal: request.multimodal
    };
  }

  protected transformResponse(result: any, request: ModelRequest): ModelResponse {
    const baseResponse = {
      id: request.context?.requestId || this.generateRequestId(),
      model: this.config.modelName,
      timestamp: new Date(),
      latency: 0, // Will be set by caller
      usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      cost: 0, // Will be calculated
      finishReason: result.finishReason || 'STOP',
      metadata: {
        workflowExecution: result.workflowExecution,
        collaborativeResults: result.collaborativeResults,
        stepResults: result.stepResults
      }
    };

    if (result.workflowExecution) {
      return {
        ...baseResponse,
        content: this.formatWorkflowResults(result.workflowExecution),
        metadata: {
          ...baseResponse.metadata,
          workflowId: result.workflowExecution.workflowId,
          totalSteps: result.workflowExecution.metrics.totalSteps,
          completedSteps: result.workflowExecution.metrics.completedSteps
        }
      };
    }

    return {
      ...baseResponse,
      content: result.content || result.text || ''
    };
  }

  protected handleError(error: any, request: ModelRequest): AdapterError {
    let code = 'UNKNOWN_ERROR';
    let statusCode = 500;
    let retryable = false;
    let message = error.message || 'Unknown Jules workflow error occurred';

    // Handle Jules-specific errors
    if (error.code === 'WORKFLOW_TIMEOUT') {
      code = 'WORKFLOW_TIMEOUT';
      statusCode = 408;
      retryable = true;
    } else if (error.code === 'STEP_EXECUTION_FAILED') {
      code = 'STEP_EXECUTION_FAILED';
      statusCode = 500;
      retryable = false;
    } else if (error.code === 'CONSENSUS_FAILED') {
      code = 'CONSENSUS_FAILED';
      statusCode = 409;
      retryable = true;
    } else if (error.code === 'WORKFLOW_NOT_FOUND') {
      code = 'WORKFLOW_NOT_FOUND';
      statusCode = 404;
      retryable = false;
    }

    // Handle API errors
    if (error.status) {
      statusCode = error.status;
      if (statusCode >= 500) {
        retryable = true;
      }
    }

    const adapterError = this.createError(message, code, statusCode, retryable, {
      originalError: error,
      requestId: request.context?.requestId,
      workflowId: request.metadata?.workflowId
    });

    this.logger.error('Jules workflow adapter error', {
      code,
      statusCode,
      message,
      retryable,
      workflowId: request.metadata?.workflowId
    });

    return adapterError;
  }

  /**
   * Execute a complete workflow
   */
  private async executeWorkflow(request: ModelRequest): Promise<ModelResponse> {
    const workflowId = request.metadata?.workflowId;
    const workflow = this.workflowTemplates.get(workflowId);
    
    if (!workflow) {
      throw this.createError(
        `Workflow not found: ${workflowId}`,
        'WORKFLOW_NOT_FOUND',
        404,
        false
      );
    }

    const execution: WorkflowExecution = {
      id: this.generateRequestId(),
      workflowId,
      status: 'running',
      startTime: new Date(),
      currentStep: undefined,
      completedSteps: [],
      results: {},
      errors: [],
      metrics: {
        totalSteps: workflow.steps.length,
        completedSteps: 0,
        failedSteps: 0,
        totalLatency: 0,
        tokenUsage: 0,
        cost: 0
      }
    };

    this.activeExecutions.set(execution.id, execution);

    try {
      // Execute workflow steps
      await this.executeWorkflowSteps(workflow, execution, request);
      
      execution.status = 'completed';
      execution.endTime = new Date();

      return this.transformResponse({ workflowExecution: execution }, request);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors.push({
        step: execution.currentStep || 'unknown',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });

      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Execute workflow steps with orchestration
   */
  private async executeWorkflowSteps(
    workflow: WorkflowDefinition, 
    execution: WorkflowExecution,
    request: ModelRequest
  ): Promise<void> {
    const config = this.config as JulesWorkflowConfig;
    const maxConcurrent = config.taskOrchestration?.maxConcurrentTasks || 3;
    
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(workflow.steps);
    const readySteps = new Set<string>();
    const runningSteps = new Set<string>();
    const completedSteps = new Set<string>();

    // Find initial ready steps (no dependencies)
    for (const step of workflow.steps) {
      if (step.dependencies.length === 0) {
        readySteps.add(step.id);
      }
    }

    while (completedSteps.size < workflow.steps.length && execution.status === 'running') {
      // Start available steps up to concurrency limit
      const stepsToStart = Array.from(readySteps).slice(0, maxConcurrent - runningSteps.size);
      
      for (const stepId of stepsToStart) {
        readySteps.delete(stepId);
        runningSteps.add(stepId);
        
        const step = workflow.steps.find(s => s.id === stepId)!;
        execution.currentStep = stepId;
        
        // Execute step asynchronously
        this.executeStep(step, execution, request)
          .then(result => {
            runningSteps.delete(stepId);
            completedSteps.add(stepId);
            execution.completedSteps.push(stepId);
            execution.results[stepId] = result;
            execution.metrics.completedSteps++;

            // Check for newly ready steps
            this.updateReadySteps(stepId, dependencyGraph, completedSteps, readySteps);
          })
          .catch(error => {
            runningSteps.delete(stepId);
            execution.metrics.failedSteps++;
            execution.errors.push({
              step: stepId,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date()
            });

            // Handle failure based on strategy
            if (config.taskOrchestration?.failureHandling === 'abort') {
              execution.status = 'failed';
            }
          });
      }

      // Wait for at least one step to complete
      if (runningSteps.size >= maxConcurrent) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Wait for all running steps to complete
    while (runningSteps.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Execute with collaborative AI
   */
  private async executeWithCollaboration(request: ModelRequest): Promise<ModelResponse> {
    const config = this.config as JulesWorkflowConfig;
    const collaboration = config.aiCollaboration!;
    
    // Execute request with multiple peer models
    const peerResults: ModelResponse[] = [];
    
    for (const peerModel of this.peerModels.slice(0, 3)) { // Limit to 3 peers
      try {
        const peerResult = await this.executePeerRequest(request, peerModel);
        peerResults.push(peerResult);
      } catch (error) {
        this.logger.warn('Peer model execution failed', { peer: peerModel, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Apply consensus algorithm
    const consensusResult = this.applyConsensus(peerResults, collaboration.consensusThreshold);
    
    return {
      ...consensusResult,
      metadata: {
        ...consensusResult.metadata,
        collaborativeResults: {
          peerCount: peerResults.length,
          consensus: consensusResult.metadata?.consensus,
          diversity: this.calculateDiversity(peerResults)
        }
      }
    };
  }

  /**
   * Stream workflow execution progress
   */
  private async *streamWorkflowExecution(request: ModelRequest): AsyncIterableIterator<StreamChunk> {
    const workflowId = request.metadata?.workflowId;
    const workflow = this.workflowTemplates.get(workflowId);
    
    if (!workflow) {
      throw this.createError('Workflow not found', 'WORKFLOW_NOT_FOUND', 404, false);
    }

    let chunkIndex = 0;
    
    // Stream workflow progress
    for (const step of workflow.steps) {
      yield {
        id: `${request.context?.requestId}-${chunkIndex}`,
        content: `Executing step: ${step.name}`,
        delta: `Step ${step.id} started\n`,
        metadata: {
          chunkIndex,
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          timestamp: Date.now()
        }
      };
      chunkIndex++;

      // Execute step and stream results
      try {
        const stepResult = await this.executeStep(step, {} as WorkflowExecution, request);
        
        yield {
          id: `${request.context?.requestId}-${chunkIndex}`,
          content: JSON.stringify(stepResult, null, 2),
          delta: `Step ${step.id} completed\n`,
          metadata: {
            chunkIndex,
            stepId: step.id,
            stepResult,
            timestamp: Date.now()
          }
        };
        chunkIndex++;
        
      } catch (error) {
        yield {
          id: `${request.context?.requestId}-${chunkIndex}`,
          content: `Error in step ${step.name}: ${error instanceof Error ? error.message : String(error)}`,
          delta: `Step ${step.id} failed\n`,
          metadata: {
            chunkIndex,
            stepId: step.id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now()
          }
        };
        chunkIndex++;
      }
    }

    // Final summary
    yield {
      id: `${request.context?.requestId}-${chunkIndex}`,
      content: 'Workflow execution completed',
      delta: 'Workflow finished\n',
      finishReason: 'STOP',
      metadata: {
        chunkIndex,
        workflowId,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Check if request is workflow-based
   */
  private isWorkflowRequest(request: ModelRequest): boolean {
    return Boolean(request.metadata?.workflowId || 
                   request.metadata?.workflow ||
                   request.prompt?.includes('workflow:'));
  }

  /**
   * Initialize step executors
   */
  private initializeStepExecutors(): void {
    this.stepExecutors.set('prompt', this.executePromptStep.bind(this));
    this.stepExecutors.set('function', this.executeFunctionStep.bind(this));
    this.stepExecutors.set('decision', this.executeDecisionStep.bind(this));
    this.stepExecutors.set('parallel', this.executeParallelStep.bind(this));
    this.stepExecutors.set('merge', this.executeMergeStep.bind(this));
  }

  /**
   * Initialize peer models for collaboration
   */
  private initializePeerModels(): void {
    this.peerModels = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-thinking',
      'gemini-pro'
    ];
  }

  /**
   * Execute individual workflow step
   */
  private async executeStep(
    step: WorkflowStep, 
    execution: WorkflowExecution, 
    request: ModelRequest
  ): Promise<any> {
    const executor = this.stepExecutors.get(step.type);
    if (!executor) {
      throw this.createError(
        `Unknown step type: ${step.type}`,
        'UNKNOWN_STEP_TYPE',
        400,
        false
      );
    }

    const startTime = performance.now();
    
    try {
      step.status = 'running';
      const result = await executor(step, execution, request);
      step.status = 'completed';
      step.output = result;
      
      const latency = performance.now() - startTime;
      execution.metrics.totalLatency += latency;
      
      return result;
      
    } catch (error) {
      step.status = 'failed';
      throw error;
    }
  }

  /**
   * Execute prompt step
   */
  private async executePromptStep(
    step: WorkflowStep, 
    _execution: WorkflowExecution, 
    _request: ModelRequest
  ): Promise<any> {
    // Implementation for prompt execution
    const response = await fetch(`${this.workflowEndpoint}/steps/prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.julesApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: step.input.prompt,
        model: step.model || 'gemini-2.0-flash',
        parameters: step.input.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Prompt step failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute function step
   */
  private async executeFunctionStep(
    step: WorkflowStep, 
    _execution: WorkflowExecution, 
    _request: ModelRequest
  ): Promise<any> {
    // Implementation for function execution
    return { result: 'function executed', step: step.id };
  }

  /**
   * Execute decision step
   */
  private async executeDecisionStep(
    step: WorkflowStep, 
    _execution: WorkflowExecution, 
    _request: ModelRequest
  ): Promise<any> {
    // Implementation for decision logic
    return { decision: 'continue', step: step.id };
  }

  /**
   * Execute parallel step
   */
  private async executeParallelStep(
    step: WorkflowStep, 
    _execution: WorkflowExecution, 
    _request: ModelRequest
  ): Promise<any> {
    // Implementation for parallel execution
    return { parallel: 'completed', step: step.id };
  }

  /**
   * Execute merge step
   */
  private async executeMergeStep(
    step: WorkflowStep, 
    _execution: WorkflowExecution, 
    _request: ModelRequest
  ): Promise<any> {
    // Implementation for result merging
    return { merged: 'results', step: step.id };
  }

  /**
   * Load workflow templates
   */
  private async loadWorkflowTemplates(): Promise<void> {
    // Load predefined workflow templates
    const defaultWorkflows: WorkflowDefinition[] = [
      {
        id: 'content-creation',
        name: 'Content Creation Workflow',
        description: 'Multi-step content creation with review and optimization',
        version: '1.0',
        steps: [
          {
            id: 'research',
            name: 'Research Phase',
            type: 'prompt',
            input: { prompt: 'Research the topic thoroughly' },
            dependencies: [],
            status: 'pending'
          },
          {
            id: 'draft',
            name: 'Draft Creation',
            type: 'prompt',
            input: { prompt: 'Create initial draft based on research' },
            dependencies: ['research'],
            status: 'pending'
          },
          {
            id: 'review',
            name: 'Content Review',
            type: 'decision',
            input: { criteria: 'quality, accuracy, engagement' },
            dependencies: ['draft'],
            status: 'pending'
          }
        ],
        triggers: ['content_request'],
        variables: {},
        metadata: {}
      }
    ];

    for (const workflow of defaultWorkflows) {
      this.workflowTemplates.set(workflow.id, workflow);
    }
  }

  /**
   * Build dependency graph for workflow steps
   */
  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const step of steps) {
      graph.set(step.id, step.dependencies);
    }
    
    return graph;
  }

  /**
   * Update ready steps based on completed step
   */
  private updateReadySteps(
    _completedStepId: string,
    dependencyGraph: Map<string, string[]>,
    completedSteps: Set<string>,
    readySteps: Set<string>
  ): void {
    for (const [stepId, dependencies] of dependencyGraph) {
      if (!completedSteps.has(stepId) && !readySteps.has(stepId)) {
        const allDependenciesMet = dependencies.every(dep => completedSteps.has(dep));
        if (allDependenciesMet) {
          readySteps.add(stepId);
        }
      }
    }
  }

  /**
   * Apply consensus algorithm to peer results
   */
  private applyConsensus(results: ModelResponse[], threshold: number): ModelResponse {
    if (results.length === 0) {
      throw this.createError('No peer results for consensus', 'NO_PEER_RESULTS', 500, false);
    }

    if (results.length === 1) {
      return results[0];
    }

    // Simple majority consensus (can be enhanced with more sophisticated algorithms)
    const contentFreq = new Map<string, number>();
    
    for (const result of results) {
      const content = result.content.trim();
      contentFreq.set(content, (contentFreq.get(content) || 0) + 1);
    }

    const [consensusContent, count] = Array.from(contentFreq.entries())
      .sort(([,a], [,b]) => b - a)[0];

    const consensusRatio = count / results.length;
    
    if (consensusRatio >= threshold) {
      const consensusResult = results.find(r => r.content.trim() === consensusContent)!;
      return {
        ...consensusResult,
        metadata: {
          ...consensusResult.metadata,
          consensus: {
            ratio: consensusRatio,
            agreeing: count,
            total: results.length
          }
        }
      };
    }

    throw this.createError(
      `Consensus threshold not met: ${consensusRatio} < ${threshold}`,
      'CONSENSUS_FAILED',
      409,
      true
    );
  }

  /**
   * Calculate diversity score for peer results
   */
  private calculateDiversity(results: ModelResponse[]): number {
    if (results.length <= 1) return 0;

    const uniqueContents = new Set(results.map(r => r.content.trim()));
    return uniqueContents.size / results.length;
  }

  /**
   * Execute request with peer model
   */
  private async executePeerRequest(_request: ModelRequest, peerModel: string): Promise<ModelResponse> {
    // Simulate peer model execution (would integrate with actual peer models)
    return {
      id: this.generateRequestId(),
      content: `Peer response from ${peerModel}`,
      model: peerModel,
      timestamp: new Date(),
      latency: 100,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      cost: 0.001,
      finishReason: 'STOP'
    };
  }

  /**
   * Format workflow results for response
   */
  private formatWorkflowResults(execution: WorkflowExecution): string {
    return JSON.stringify({
      workflowId: execution.workflowId,
      status: execution.status,
      completedSteps: execution.completedSteps,
      results: execution.results,
      metrics: execution.metrics
    }, null, 2);
  }

  /**
   * Transform workflow request
   */
  private transformWorkflowRequest(request: ModelRequest): any {
    return {
      workflowId: request.metadata?.workflowId,
      variables: request.metadata?.variables || {},
      context: request.context,
      parameters: request.parameters
    };
  }

  /**
   * Execute single step (non-workflow)
   */
  private async executeSingleStep(request: ModelRequest): Promise<ModelResponse> {
    // Implement single-step execution
    const response = await fetch(`${this.workflowEndpoint}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.julesApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.transformRequest(request))
    });

    if (!response.ok) {
      throw new Error(`Jules API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformResponse(result, request);
  }

  /**
   * Stream single step execution
   */
  private async *streamSingleStep(request: ModelRequest): AsyncIterableIterator<StreamChunk> {
    // Implement streaming for single step
    const response = await fetch(`${this.workflowEndpoint}/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.julesApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(this.transformRequest(request))
    });

    if (!response.ok) {
      throw new Error(`Jules streaming request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let chunkIndex = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield {
                id: `${request.context?.requestId || this.generateRequestId()}-${chunkIndex}`,
                content: data.content || '',
                delta: data.delta || '',
                finishReason: data.finishReason,
                metadata: {
                  chunkIndex,
                  timestamp: Date.now(),
                  ...data.metadata
                }
              };
              chunkIndex++;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Initialize collaborative features
   */
  private async initializeCollaborativeFeatures(): Promise<void> {
    this.logger.info('Initializing collaborative AI features');
    
    // Initialize peer model connections
    // Load consensus algorithms
    // Setup collaboration metrics
  }
}
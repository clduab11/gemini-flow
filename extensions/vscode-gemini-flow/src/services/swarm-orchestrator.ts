/**
 * Swarm Orchestrator - Multi-agent task coordination
 */

import * as vscode from 'vscode';
import { SwarmTask } from '../types';
import { Logger } from '../utils/logger';
import { GeminiService } from './gemini-service';
import { A2AService } from './a2a-service';
import { MCPService } from './mcp-service';

export class SwarmOrchestrator implements vscode.Disposable {
  private _activeTasks = new Map<string, SwarmTask>();
  private _isInitialized = false;

  constructor(
    private readonly _geminiService: GeminiService,
    private readonly _a2aService?: A2AService,
    private readonly _mcpService?: MCPService,
    private readonly _logger?: Logger
  ) {}

  /**
   * Initialize swarm orchestrator
   */
  async initialize(): Promise<void> {
    try {
      this._logger?.info('Initializing Swarm Orchestrator...');
      
      // Check available services
      if (!this._geminiService.isReady()) {
        throw new Error('Gemini service is not ready');
      }

      this._isInitialized = true;
      this._logger?.info('Swarm Orchestrator initialized successfully');
    } catch (error) {
      this._logger?.error('Failed to initialize Swarm Orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Orchestrate a complex task across multiple agents
   */
  async orchestrateTask(
    taskDescription: string,
    options: {
      maxAgents?: number;
      timeout?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      strategy?: 'parallel' | 'sequential' | 'adaptive';
      cancellationToken?: vscode.CancellationToken;
    } = {}
  ): Promise<SwarmTask> {
    try {
      if (!this._isInitialized) {
        throw new Error('Swarm Orchestrator not initialized');
      }

      this._logger?.info('Starting task orchestration', { task: taskDescription, options });

      // Create task
      const task: SwarmTask = {
        id: this.generateTaskId(),
        type: this.determineTaskType(taskDescription),
        description: taskDescription,
        context: this.gatherCurrentContext(),
        priority: options.priority || 'medium',
        status: 'pending',
        agents: []
      };

      this._activeTasks.set(task.id, task);

      // Start orchestration
      await this.executeTask(task, options);

      return task;
    } catch (error) {
      this._logger?.error('Failed to orchestrate task', error as Error);
      throw error;
    }
  }

  /**
   * Execute a swarm task
   */
  private async executeTask(
    task: SwarmTask,
    options: {
      maxAgents?: number;
      timeout?: number;
      strategy?: 'parallel' | 'sequential' | 'adaptive';
      cancellationToken?: vscode.CancellationToken;
    }
  ): Promise<void> {
    try {
      task.status = 'running';
      this._logger?.debug(`Executing task: ${task.id}`);

      // Determine execution strategy
      const strategy = options.strategy || this.determineOptimalStrategy(task);
      
      // Get available agents
      const agents = await this.getAvailableAgents(task.type);
      const selectedAgents = agents.slice(0, options.maxAgents || 3);
      
      task.agents = selectedAgents.map(agent => agent.id);

      // Execute based on strategy
      switch (strategy) {
        case 'parallel':
          task.result = await this.executeParallel(task, selectedAgents, options);
          break;
        case 'sequential':
          task.result = await this.executeSequential(task, selectedAgents, options);
          break;
        case 'adaptive':
          task.result = await this.executeAdaptive(task, selectedAgents, options);
          break;
      }

      task.status = 'completed';
      this._logger?.info(`Task completed: ${task.id}`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      this._logger?.error(`Task failed: ${task.id}`, error as Error);
      throw error;
    }
  }

  /**
   * Execute task in parallel across agents
   */
  private async executeParallel(
    task: SwarmTask,
    agents: Agent[],
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    this._logger?.debug('Executing task in parallel mode');

    const promises = agents.map(agent => this.executeOnAgent(agent, task, options));
    const results = await Promise.allSettled(promises);

    // Aggregate results
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const failedResults = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    if (failedResults.length > 0) {
      this._logger?.warn('Some agents failed during parallel execution', failedResults);
    }

    return {
      strategy: 'parallel',
      results: successfulResults,
      failures: failedResults,
      agentCount: agents.length,
      successCount: successfulResults.length
    };
  }

  /**
   * Execute task sequentially across agents
   */
  private async executeSequential(
    task: SwarmTask,
    agents: Agent[],
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    this._logger?.debug('Executing task in sequential mode');

    const results: any[] = [];
    let lastResult: any = null;

    for (const agent of agents) {
      if (options.cancellationToken?.isCancellationRequested) {
        break;
      }

      try {
        // Pass previous result as context for next agent
        const agentTask = lastResult 
          ? { ...task, context: { ...task.context, previousResult: lastResult } }
          : task;

        const result = await this.executeOnAgent(agent, agentTask, options);
        results.push(result);
        lastResult = result;
      } catch (error) {
        this._logger?.error(`Agent ${agent.id} failed in sequential execution`, error as Error);
        // Continue with next agent
      }
    }

    return {
      strategy: 'sequential',
      results,
      finalResult: lastResult,
      agentCount: agents.length,
      processedCount: results.length
    };
  }

  /**
   * Execute task using adaptive strategy
   */
  private async executeAdaptive(
    task: SwarmTask,
    agents: Agent[],
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    this._logger?.debug('Executing task in adaptive mode');

    // Start with one agent
    const firstAgent = agents[0];
    let result = await this.executeOnAgent(firstAgent, task, options);

    // Analyze result quality and decide if more agents are needed
    const resultQuality = this.analyzeResultQuality(result);
    
    if (resultQuality < 0.8 && agents.length > 1) {
      this._logger?.debug('Result quality below threshold, engaging additional agents');
      
      // Use remaining agents to improve the result
      const refinementTasks = agents.slice(1).map(agent => 
        this.executeOnAgent(agent, {
          ...task,
          description: `Improve and refine this result: ${JSON.stringify(result)}`,
          context: { ...task.context, originalResult: result }
        }, options)
      );

      const refinements = await Promise.allSettled(refinementTasks);
      const successfulRefinements = refinements
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      // Combine results
      result = this.combineResults([result, ...successfulRefinements]);
    }

    return {
      strategy: 'adaptive',
      result,
      agentCount: agents.length,
      qualityScore: this.analyzeResultQuality(result)
    };
  }

  /**
   * Execute task on a specific agent
   */
  private async executeOnAgent(
    agent: Agent,
    task: SwarmTask,
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    this._logger?.debug(`Executing task on agent: ${agent.id}`);

    // Route to appropriate service based on agent type
    switch (agent.type) {
      case 'gemini':
        return await this.executeOnGeminiAgent(agent, task, options);
      case 'a2a':
        return await this.executeOnA2AAgent(agent, task, options);
      case 'mcp':
        return await this.executeOnMCPAgent(agent, task, options);
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  /**
   * Execute task on Gemini agent
   */
  private async executeOnGeminiAgent(
    agent: Agent,
    task: SwarmTask,
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    const prompt = this.buildTaskPrompt(task, agent);
    
    switch (task.type) {
      case 'analysis':
        return await this._geminiService.explainCode(task.context, {
          cancellationToken: options.cancellationToken
        });
      case 'generation':
        return await this._geminiService.generateCode(task.description, task.context, {
          cancellationToken: options.cancellationToken
        });
      case 'optimization':
        return await this._geminiService.optimizeCode(task.context, {
          cancellationToken: options.cancellationToken
        });
      case 'testing':
        return await this._geminiService.chatWithAI(
          `Generate comprehensive tests for: ${task.description}`,
          task.context,
          { cancellationToken: options.cancellationToken }
        );
      default:
        return await this._geminiService.chatWithAI(task.description, task.context, {
          cancellationToken: options.cancellationToken
        });
    }
  }

  /**
   * Execute task on A2A agent
   */
  private async executeOnA2AAgent(
    agent: Agent,
    task: SwarmTask,
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    if (!this._a2aService) {
      throw new Error('A2A service not available');
    }

    return await this._a2aService.requestCodeAnalysis(
      task.context.selectedText || task.context.fullText,
      task.context.language,
      task.type
    );
  }

  /**
   * Execute task on MCP agent
   */
  private async executeOnMCPAgent(
    agent: Agent,
    task: SwarmTask,
    options: { cancellationToken?: vscode.CancellationToken }
  ): Promise<any> {
    if (!this._mcpService) {
      throw new Error('MCP service not available');
    }

    // Find appropriate tool for the task
    const tools = await this._mcpService.listTools();
    const relevantTool = this.findRelevantTool(tools, task);
    
    if (relevantTool) {
      return await this._mcpService.executeTool(
        relevantTool.server,
        relevantTool.tool.name,
        {
          task: task.description,
          context: task.context
        }
      );
    }

    throw new Error('No relevant MCP tool found for task');
  }

  /**
   * Get available agents for task type
   */
  private async getAvailableAgents(taskType: string): Promise<Agent[]> {
    const agents: Agent[] = [];

    // Always include Gemini agent if available
    if (this._geminiService.isReady()) {
      agents.push({
        id: 'gemini-primary',
        type: 'gemini',
        capabilities: ['analysis', 'generation', 'optimization', 'testing'],
        priority: 1
      });
    }

    // Include A2A agents if available
    if (this._a2aService?.isConnected()) {
      const capabilities = await this._a2aService.requestAgentCapabilities();
      agents.push({
        id: 'a2a-swarm',
        type: 'a2a',
        capabilities,
        priority: 2
      });
    }

    // Include MCP agents if available
    if (this._mcpService?.hasConnections()) {
      const servers = this._mcpService.getConnectedServers();
      for (const server of servers) {
        agents.push({
          id: `mcp-${server}`,
          type: 'mcp',
          capabilities: ['tool-execution', 'resource-access'],
          priority: 3
        });
      }
    }

    // Filter agents by task type compatibility
    return agents.filter(agent => this.isAgentCompatible(agent, taskType));
  }

  /**
   * Helper methods
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineTaskType(description: string): SwarmTask['type'] {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('test') || lowerDesc.includes('unit test') || lowerDesc.includes('integration test')) {
      return 'testing';
    }
    if (lowerDesc.includes('generate') || lowerDesc.includes('create') || lowerDesc.includes('implement')) {
      return 'generation';
    }
    if (lowerDesc.includes('optimize') || lowerDesc.includes('improve') || lowerDesc.includes('performance')) {
      return 'optimization';
    }
    return 'analysis';
  }

  private gatherCurrentContext(): any {
    const editor = vscode.window.activeTextEditor;
    return {
      fileName: editor?.document.fileName || 'unknown',
      language: editor?.document.languageId || 'unknown',
      fullText: editor?.document.getText() || '',
      selectedText: editor?.selection.isEmpty ? undefined : editor.document.getText(editor.selection),
      relativeFilePath: editor?.document.fileName || 'unknown',
      workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    };
  }

  private determineOptimalStrategy(task: SwarmTask): 'parallel' | 'sequential' | 'adaptive' {
    // Simple strategy determination based on task characteristics
    if (task.priority === 'critical') {
      return 'parallel'; // Use all available resources
    }
    if (task.type === 'generation') {
      return 'sequential'; // Build incrementally
    }
    return 'adaptive'; // Default to adaptive
  }

  private buildTaskPrompt(task: SwarmTask, agent: Agent): string {
    return `As a specialized ${agent.type} agent, please ${task.description}.
    
Task Type: ${task.type}
Priority: ${task.priority}
Context: ${JSON.stringify(task.context, null, 2)}

Please provide a detailed and accurate response focused on this specific task.`;
  }

  private analyzeResultQuality(result: any): number {
    // Simple quality scoring based on result characteristics
    if (!result || !result.content) return 0.1;
    
    const content = result.content;
    let score = 0.5; // Base score
    
    // Length factor
    if (content.length > 100) score += 0.1;
    if (content.length > 500) score += 0.1;
    
    // Code quality factors (if applicable)
    if (content.includes('```')) score += 0.1; // Contains code blocks
    if (content.includes('function') || content.includes('class')) score += 0.1;
    
    // Documentation factors
    if (content.includes('*') || content.includes('-')) score += 0.1; // Has bullet points
    if (content.includes('Example:') || content.includes('example')) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private combineResults(results: any[]): any {
    // Simple result combination - in practice this would be more sophisticated
    return {
      combinedResult: results,
      primaryResult: results[0],
      alternativeResults: results.slice(1),
      confidence: results.length > 1 ? 0.9 : 0.7
    };
  }

  private isAgentCompatible(agent: Agent, taskType: string): boolean {
    return agent.capabilities.includes(taskType) || 
           agent.capabilities.includes('general') ||
           agent.type === 'gemini'; // Gemini is always compatible
  }

  private findRelevantTool(toolsList: any[], task: SwarmTask): { server: string; tool: any } | null {
    for (const toolGroup of toolsList) {
      for (const tool of toolGroup.tools) {
        if (tool.description?.toLowerCase().includes(task.type.toLowerCase())) {
          return { server: toolGroup.server, tool };
        }
      }
    }
    return null;
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): SwarmTask[] {
    return Array.from(this._activeTasks.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): SwarmTask | undefined {
    return this._activeTasks.get(taskId);
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this._activeTasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'failed';
      task.error = 'Cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Clean up completed tasks
   */
  cleanupTasks(): void {
    for (const [taskId, task] of this._activeTasks) {
      if (task.status === 'completed' || task.status === 'failed') {
        this._activeTasks.delete(taskId);
      }
    }
  }

  /**
   * Dispose of swarm orchestrator
   */
  dispose(): void {
    this._logger?.info('Disposing Swarm Orchestrator...');
    this._activeTasks.clear();
    this._isInitialized = false;
  }
}

/**
 * Agent interface
 */
interface Agent {
  id: string;
  type: 'gemini' | 'a2a' | 'mcp';
  capabilities: string[];
  priority: number;
}
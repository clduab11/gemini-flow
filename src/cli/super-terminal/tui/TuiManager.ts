/**
 * TUI Manager - Main orchestration and lifecycle management
 *
 * Manages screen navigation, state, and integration with Sprint 4 infrastructure
 */

import { EventEmitter } from 'events';
import { getLogger } from '../utils/Logger.js';
import { getConfig } from '../utils/Config.js';
import { CommandRouter } from '../command-router.js';

export type TuiScreen = 'dashboard' | 'workflow-builder' | 'execution-monitor' | 'config' | 'help';

export interface TuiState {
  currentScreen: TuiScreen;
  workflows: WorkflowState[];
  selectedWorkflowId: string | null;
  executionLogs: string[];
  systemMetrics: SystemMetrics;
  history: HistoryEntry[];
}

export interface WorkflowState {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  nodeCount: number;
  edgeCount: number;
  currentStep: number;
  totalSteps: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export interface SystemMetrics {
  agentCount: number;
  activeWorkflows: number;
  totalCommands: number;
  errorCount: number;
  logSize: number;
  uptime: number;
  memoryUsage: number;
  lastUpdate: number;
}

export interface HistoryEntry {
  id: string;
  command: string;
  timestamp: number;
  status: 'success' | 'error';
  duration: number;
}

export class TuiManager extends EventEmitter {
  private logger = getLogger();
  private config = getConfig();
  private commandRouter: CommandRouter;
  private state: TuiState;
  private startTime: number;
  private metricsInterval?: NodeJS.Timeout;
  private logTailInterval?: NodeJS.Timeout;

  constructor(commandRouter: CommandRouter) {
    super();
    this.commandRouter = commandRouter;
    this.startTime = Date.now();

    // Initialize state
    this.state = {
      currentScreen: 'dashboard',
      workflows: [],
      selectedWorkflowId: null,
      executionLogs: [],
      systemMetrics: {
        agentCount: 0,
        activeWorkflows: 0,
        totalCommands: 0,
        errorCount: 0,
        logSize: 0,
        uptime: 0,
        memoryUsage: 0,
        lastUpdate: Date.now()
      },
      history: []
    };

    this.logger.info('TuiManager initialized');
  }

  /**
   * Initialize TUI and start background tasks
   */
  async initialize(): Promise<void> {
    try {
      await this.logger.info('Starting TUI Manager');

      // Start metrics collection
      this.startMetricsCollection();

      // Start log tailing
      this.startLogTailing();

      // Load initial data
      await this.refreshSystemMetrics();
      await this.refreshWorkflows();

      this.emit('initialized');
      await this.logger.info('TUI Manager started successfully');
    } catch (error) {
      await this.logger.error('Failed to initialize TUI Manager', error as Error);
      throw error;
    }
  }

  /**
   * Shutdown TUI and cleanup resources
   */
  async shutdown(): Promise<void> {
    try {
      await this.logger.info('Shutting down TUI Manager');

      // Stop intervals
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      if (this.logTailInterval) {
        clearInterval(this.logTailInterval);
      }

      this.emit('shutdown');
      await this.logger.info('TUI Manager shut down successfully');
    } catch (error) {
      await this.logger.error('Error during TUI Manager shutdown', error as Error);
    }
  }

  /**
   * Navigate to a different screen
   */
  async navigateTo(screen: TuiScreen): Promise<void> {
    await this.logger.debug(`Navigating to screen: ${screen}`);

    this.state.currentScreen = screen;
    this.emit('screen-changed', screen);

    // Refresh data for specific screens
    switch (screen) {
      case 'dashboard':
        await this.refreshSystemMetrics();
        await this.refreshWorkflows();
        break;
      case 'workflow-builder':
        await this.refreshWorkflows();
        break;
      case 'execution-monitor':
        await this.refreshExecutionLogs();
        break;
      case 'config':
        // Config is loaded on-demand
        break;
    }
  }

  /**
   * Get current state
   */
  getState(): TuiState {
    return { ...this.state };
  }

  /**
   * Get current screen
   */
  getCurrentScreen(): TuiScreen {
    return this.state.currentScreen;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(name: string): Promise<WorkflowState> {
    try {
      const workflow: WorkflowState = {
        id: `workflow-${Date.now()}`,
        name,
        status: 'idle',
        nodeCount: 0,
        edgeCount: 0,
        currentStep: 0,
        totalSteps: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.state.workflows.push(workflow);
      this.emit('workflow-created', workflow);

      await this.logger.info('Workflow created', { workflowId: workflow.id, name });
      return workflow;
    } catch (error) {
      await this.logger.error('Failed to create workflow', error as Error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const index = this.state.workflows.findIndex(w => w.id === workflowId);
      if (index === -1) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      this.state.workflows.splice(index, 1);
      if (this.state.selectedWorkflowId === workflowId) {
        this.state.selectedWorkflowId = null;
      }

      this.emit('workflow-deleted', workflowId);
      await this.logger.info('Workflow deleted', { workflowId });
    } catch (error) {
      await this.logger.error('Failed to delete workflow', error as Error);
      throw error;
    }
  }

  /**
   * Select a workflow
   */
  async selectWorkflow(workflowId: string | null): Promise<void> {
    this.state.selectedWorkflowId = workflowId;
    this.emit('workflow-selected', workflowId);
    await this.logger.debug('Workflow selected', { workflowId });
  }

  /**
   * Start workflow execution
   */
  async startWorkflowExecution(workflowId: string): Promise<void> {
    try {
      const workflow = this.state.workflows.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      workflow.status = 'running';
      workflow.currentStep = 0;
      workflow.updatedAt = Date.now();

      this.emit('workflow-execution-started', workflowId);
      await this.logger.info('Workflow execution started', { workflowId });

      // Simulate execution progress (in real implementation, this would trigger actual workflow execution)
      this.simulateWorkflowExecution(workflowId);
    } catch (error) {
      await this.logger.error('Failed to start workflow execution', error as Error);
      throw error;
    }
  }

  /**
   * Stop workflow execution
   */
  async stopWorkflowExecution(workflowId: string): Promise<void> {
    try {
      const workflow = this.state.workflows.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      workflow.status = 'paused';
      workflow.updatedAt = Date.now();

      this.emit('workflow-execution-stopped', workflowId);
      await this.logger.info('Workflow execution stopped', { workflowId });
    } catch (error) {
      await this.logger.error('Failed to stop workflow execution', error as Error);
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    return { ...this.state.systemMetrics };
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(limit: number = 100): string[] {
    return this.state.executionLogs.slice(-limit);
  }

  /**
   * Get command history
   */
  getHistory(limit: number = 20): HistoryEntry[] {
    return this.state.history.slice(-limit);
  }

  /**
   * Execute a command through the command router
   */
  async executeCommand(command: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.logger.info('Executing command from TUI', { command });

      const result = await this.commandRouter.route(command);

      const duration = Date.now() - startTime;
      this.state.history.push({
        id: `history-${Date.now()}`,
        command,
        timestamp: Date.now(),
        status: 'success',
        duration
      });

      this.emit('command-executed', { command, result });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.state.history.push({
        id: `history-${Date.now()}`,
        command,
        timestamp: Date.now(),
        status: 'error',
        duration
      });

      await this.logger.error('Command execution failed', error as Error, { command });
      throw error;
    }
  }

  /**
   * Refresh system metrics
   */
  private async refreshSystemMetrics(): Promise<void> {
    try {
      // Get metrics from command router
      const statusResult = await this.commandRouter.route('status');

      const agentCount = statusResult.metrics?.agentCount || 0;
      const activeWorkflows = this.state.workflows.filter(w => w.status === 'running').length;
      const errorCount = this.state.history.filter(h => h.status === 'error').length;
      const uptime = Date.now() - this.startTime;

      // Get log size
      const logStats = await this.logger.getLogStats();

      this.state.systemMetrics = {
        agentCount,
        activeWorkflows,
        totalCommands: this.state.history.length,
        errorCount,
        logSize: logStats.totalSize,
        uptime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        lastUpdate: Date.now()
      };

      this.emit('metrics-updated', this.state.systemMetrics);
    } catch (error) {
      await this.logger.error('Failed to refresh system metrics', error as Error);
    }
  }

  /**
   * Refresh workflows
   */
  private async refreshWorkflows(): Promise<void> {
    // In real implementation, this would fetch from backend
    // For now, just emit the current state
    this.emit('workflows-updated', this.state.workflows);
  }

  /**
   * Refresh execution logs
   */
  private async refreshExecutionLogs(): Promise<void> {
    try {
      const recentLogs = await this.logger.getRecentLogs(100);
      this.state.executionLogs = recentLogs.map(log =>
        `[${log.timestamp}] ${log.level}: ${log.message}`
      );

      this.emit('logs-updated', this.state.executionLogs);
    } catch (error) {
      await this.logger.error('Failed to refresh execution logs', error as Error);
    }
  }

  /**
   * Start metrics collection interval
   */
  private startMetricsCollection(): void {
    const intervalMs = this.config.get('metricsRefreshRateMs') || 1000;

    this.metricsInterval = setInterval(async () => {
      await this.refreshSystemMetrics();
    }, intervalMs);
  }

  /**
   * Start log tailing interval
   */
  private startLogTailing(): void {
    this.logTailInterval = setInterval(async () => {
      if (this.state.currentScreen === 'execution-monitor') {
        await this.refreshExecutionLogs();
      }
    }, 500); // Update logs every 500ms when on monitor screen
  }

  /**
   * Simulate workflow execution (for demo purposes)
   */
  private simulateWorkflowExecution(workflowId: string): void {
    const workflow = this.state.workflows.find(w => w.id === workflowId);
    if (!workflow || workflow.totalSteps === 0) return;

    const interval = setInterval(() => {
      if (!workflow || workflow.status !== 'running') {
        clearInterval(interval);
        return;
      }

      workflow.currentStep++;
      workflow.updatedAt = Date.now();

      if (workflow.currentStep >= workflow.totalSteps) {
        workflow.status = 'completed';
        workflow.currentStep = workflow.totalSteps;
        clearInterval(interval);
        this.emit('workflow-execution-completed', workflowId);
      } else {
        this.emit('workflow-execution-progress', {
          workflowId,
          currentStep: workflow.currentStep,
          totalSteps: workflow.totalSteps
        });
      }
    }, 1000); // Advance one step per second
  }
}

/**
 * Jules CLI Wrapper
 * 
 * Comprehensive wrapper for Jules Tools CLI and API integration.
 * Handles installation, authentication, task management, and error handling.
 */

import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { Logger } from '../../utils/logger.js';
import {
  JulesConfig,
  JulesTaskParams,
  JulesTask,
  JulesTaskStatus,
  JulesTaskFilter,
  JulesError,
  JulesErrorType,
  JulesInstallResult,
  JulesGitHubValidation,
  JulesAPIResponse,
  JulesLogEntry,
} from './types.js';

const execAsync = promisify(exec);

/**
 * Jules CLI Wrapper
 * 
 * Provides comprehensive integration with Jules Tools CLI and API
 */
export class JulesCliWrapper {
  private logger: Logger;
  private config: JulesConfig;
  private initialized: boolean = false;
  private cliPath?: string;
  private apiEndpoint: string;
  private logCallbacks: Map<string, (log: string) => void> = new Map();

  constructor(config: JulesConfig) {
    this.logger = new Logger('JulesCliWrapper');
    this.config = {
      timeout: 120000, // 2 minutes default
      retryAttempts: 3,
      maxConcurrentTasks: 3,
      endpoint: 'https://api.jules.google/v1',
      ...config,
    };
    this.apiEndpoint = this.config.endpoint || 'https://api.jules.google/v1';
  }

  /**
   * Install Jules Tools CLI
   */
  async install(): Promise<JulesInstallResult> {
    try {
      this.logger.info('Installing Jules Tools CLI...');

      // Check if already installed
      try {
        const { stdout } = await execAsync('jules --version');
        const version = stdout.trim();
        this.logger.info(`Jules CLI already installed: ${version}`);
        this.cliPath = 'jules';
        return {
          success: true,
          version,
          cliPath: this.cliPath,
        };
      } catch {
        // Not installed, proceed with installation
      }

      // Install via npm
      this.logger.info('Installing @google/jules-tools via npm...');
      const { stdout, stderr } = await execAsync(
        'npm install -g @google/jules-tools',
        { timeout: 300000 } // 5 minutes for installation
      );

      if (stderr && !stderr.includes('WARN')) {
        throw new Error(`Installation failed: ${stderr}`);
      }

      // Verify installation
      const { stdout: versionOutput } = await execAsync('jules --version');
      const version = versionOutput.trim();
      this.cliPath = 'jules';

      this.logger.info(`Jules CLI installed successfully: ${version}`);
      return {
        success: true,
        version,
        cliPath: this.cliPath,
      };
    } catch (error) {
      this.logger.error('Jules CLI installation failed', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Initialize Jules wrapper with configuration
   */
  async initialize(config?: JulesConfig): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Validate API key
      if (!this.config.apiKey && !process.env.JULES_API_KEY) {
        throw new JulesError(
          'Jules API key is required. Set JULES_API_KEY environment variable or provide apiKey in config.',
          JulesErrorType.INVALID_CONFIGURATION
        );
      }

      this.config.apiKey = this.config.apiKey || process.env.JULES_API_KEY;

      // Verify CLI is available
      if (!this.cliPath) {
        try {
          await execAsync('jules --version');
          this.cliPath = 'jules';
        } catch {
          this.logger.warn('Jules CLI not found. Some features may require installation.');
        }
      }

      // Validate GitHub connection if repository is specified
      if (this.config.githubRepository) {
        const validation = await this.validateGitHubConnection();
        if (!validation.connected) {
          this.logger.warn(`GitHub connection validation failed: ${validation.error}`);
        }
      }

      this.initialized = true;
      this.logger.info('Jules CLI wrapper initialized successfully');
    } catch (error) {
      this.logger.error('Jules initialization failed', error);
      throw error;
    }
  }

  /**
   * Create a new Jules task
   */
  async createTask(params: JulesTaskParams): Promise<JulesTask> {
    this.ensureInitialized();

    try {
      this.logger.info(`Creating Jules task: ${params.title}`);

      const taskData = {
        title: params.title,
        description: params.description,
        type: params.type || 'feature',
        priority: params.priority || 'medium',
        branch: params.branch,
        baseBranch: params.baseBranch || 'main',
        files: params.files,
        context: params.context,
        metadata: params.metadata,
      };

      // Use API to create task
      const response = await this.apiRequest<JulesTask>('POST', '/tasks', taskData);

      if (!response.success || !response.data) {
        throw new JulesError(
          response.error?.message || 'Failed to create task',
          JulesErrorType.TASK_CREATION_FAILED,
          { details: response.error }
        );
      }

      this.logger.info(`Jules task created successfully: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create Jules task', error);
      if (error instanceof JulesError) {
        throw error;
      }
      throw new JulesError(
        `Failed to create Jules task: ${(error as Error).message}`,
        JulesErrorType.TASK_CREATION_FAILED,
        { cause: error as Error }
      );
    }
  }

  /**
   * Get status of a Jules task
   */
  async getTaskStatus(taskId: string): Promise<JulesTaskStatus> {
    this.ensureInitialized();

    try {
      const task = await this.getTask(taskId);
      return task.status;
    } catch (error) {
      this.logger.error(`Failed to get task status for ${taskId}`, error);
      throw error;
    }
  }

  /**
   * Get full task details
   */
  async getTask(taskId: string): Promise<JulesTask> {
    this.ensureInitialized();

    try {
      const response = await this.apiRequest<JulesTask>('GET', `/tasks/${taskId}`);

      if (!response.success || !response.data) {
        throw new JulesError(
          response.error?.message || 'Task not found',
          JulesErrorType.TASK_NOT_FOUND,
          { taskId, details: response.error }
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get task ${taskId}`, error);
      if (error instanceof JulesError) {
        throw error;
      }
      throw new JulesError(
        `Failed to get task: ${(error as Error).message}`,
        JulesErrorType.TASK_NOT_FOUND,
        { taskId, cause: error as Error }
      );
    }
  }

  /**
   * Cancel a running Jules task
   */
  async cancelTask(taskId: string): Promise<void> {
    this.ensureInitialized();

    try {
      this.logger.info(`Cancelling Jules task: ${taskId}`);

      const response = await this.apiRequest<void>('DELETE', `/tasks/${taskId}`);

      if (!response.success) {
        throw new JulesError(
          response.error?.message || 'Failed to cancel task',
          JulesErrorType.API_ERROR,
          { taskId, details: response.error }
        );
      }

      this.logger.info(`Jules task cancelled successfully: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel task ${taskId}`, error);
      if (error instanceof JulesError) {
        throw error;
      }
      throw new JulesError(
        `Failed to cancel task: ${(error as Error).message}`,
        JulesErrorType.API_ERROR,
        { taskId, cause: error as Error }
      );
    }
  }

  /**
   * List Jules tasks with optional filtering
   */
  async listTasks(filter?: JulesTaskFilter): Promise<JulesTask[]> {
    this.ensureInitialized();

    try {
      const queryParams = this.buildQueryParams(filter);
      const endpoint = `/tasks${queryParams ? `?${queryParams}` : ''}`;

      const response = await this.apiRequest<JulesTask[]>('GET', endpoint);

      if (!response.success || !response.data) {
        throw new JulesError(
          response.error?.message || 'Failed to list tasks',
          JulesErrorType.API_ERROR,
          { details: response.error }
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to list Jules tasks', error);
      if (error instanceof JulesError) {
        throw error;
      }
      throw new JulesError(
        `Failed to list tasks: ${(error as Error).message}`,
        JulesErrorType.API_ERROR,
        { cause: error as Error }
      );
    }
  }

  /**
   * Stream task logs in real-time
   */
  async streamTaskLogs(taskId: string, callback: (log: string) => void): Promise<void> {
    this.ensureInitialized();

    try {
      this.logger.info(`Streaming logs for task: ${taskId}`);
      this.logCallbacks.set(taskId, callback);

      // Use CLI for log streaming if available
      if (this.cliPath) {
        return this.streamLogsViaCLI(taskId, callback);
      }

      // Fallback to polling
      return this.pollTaskLogs(taskId, callback);
    } catch (error) {
      this.logger.error(`Failed to stream logs for task ${taskId}`, error);
      this.logCallbacks.delete(taskId);
      throw error;
    }
  }

  /**
   * Validate GitHub connection
   */
  async validateGitHubConnection(): Promise<JulesGitHubValidation> {
    try {
      const githubToken = this.config.githubToken || process.env.GITHUB_TOKEN;

      if (!githubToken) {
        return {
          connected: false,
          error: 'GitHub token not provided',
        };
      }

      // Validate via API
      const response = await this.apiRequest<JulesGitHubValidation>(
        'GET',
        '/github/validate',
        undefined,
        { 'X-GitHub-Token': githubToken }
      );

      if (!response.success || !response.data) {
        return {
          connected: false,
          error: response.error?.message || 'GitHub validation failed',
        };
      }

      return response.data;
    } catch (error) {
      this.logger.error('GitHub connection validation failed', error);
      return {
        connected: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Make API request to Jules
   */
  private async apiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<JulesAPIResponse<T>> {
    const url = `${this.apiEndpoint}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...headers,
    };

    let lastError: Error | undefined;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(this.config.timeout || 120000),
        });

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          this.logger.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        const responseData = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: responseData.error?.code || response.status.toString(),
              message: responseData.error?.message || response.statusText,
              details: responseData.error?.details,
            },
            metadata: {
              requestId: response.headers.get('X-Request-Id') || undefined,
              timestamp: new Date(),
            },
          };
        }

        return {
          success: true,
          data: responseData.data || responseData,
          metadata: {
            requestId: response.headers.get('X-Request-Id') || undefined,
            timestamp: new Date(),
            rateLimit: {
              remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10),
              reset: new Date(parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10) * 1000),
            },
          },
        };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`API request attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < (this.config.retryAttempts || 3)) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          this.logger.info(`Retrying in ${backoffMs}ms...`);
          await this.sleep(backoffMs);
        }
      }
    }

    throw new JulesError(
      `API request failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      JulesErrorType.API_ERROR,
      { cause: lastError }
    );
  }

  /**
   * Stream logs via CLI
   */
  private async streamLogsViaCLI(taskId: string, callback: (log: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.cliPath!, ['logs', taskId, '--follow'], {
        env: {
          ...process.env,
          JULES_API_KEY: this.config.apiKey,
        },
      });

      proc.stdout.on('data', (data) => {
        const logs = data.toString().trim();
        callback(logs);
      });

      proc.stderr.on('data', (data) => {
        this.logger.error(`Jules CLI stderr: ${data.toString()}`);
      });

      proc.on('close', (code) => {
        this.logCallbacks.delete(taskId);
        if (code === 0) {
          resolve();
        } else {
          reject(new JulesError(
            `Jules CLI exited with code ${code}`,
            JulesErrorType.CLI_ERROR,
            { taskId }
          ));
        }
      });

      proc.on('error', (error) => {
        this.logCallbacks.delete(taskId);
        reject(new JulesError(
          `Jules CLI error: ${error.message}`,
          JulesErrorType.CLI_ERROR,
          { taskId, cause: error }
        ));
      });
    });
  }

  /**
   * Poll task logs (fallback when CLI not available)
   */
  private async pollTaskLogs(taskId: string, callback: (log: string) => void): Promise<void> {
    let lastLogIndex = 0;
    const pollInterval = 2000; // 2 seconds

    while (true) {
      try {
        const task = await this.getTask(taskId);

        // Stream new logs
        if (task.logs && task.logs.length > lastLogIndex) {
          const newLogs = task.logs.slice(lastLogIndex);
          newLogs.forEach(log => callback(log));
          lastLogIndex = task.logs.length;
        }

        // Stop polling if task is complete
        if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
          this.logCallbacks.delete(taskId);
          break;
        }

        await this.sleep(pollInterval);
      } catch (error) {
        this.logger.error(`Error polling logs for task ${taskId}`, error);
        this.logCallbacks.delete(taskId);
        throw error;
      }
    }
  }

  /**
   * Build query parameters from filter
   */
  private buildQueryParams(filter?: JulesTaskFilter): string {
    if (!filter) {
      return '';
    }

    const params = new URLSearchParams();

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      statuses.forEach(s => params.append('status', s));
    }

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      types.forEach(t => params.append('type', t));
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      priorities.forEach(p => params.append('priority', p));
    }

    if (filter.branch) {
      params.append('branch', filter.branch);
    }

    if (filter.fromDate) {
      params.append('from', filter.fromDate.toISOString());
    }

    if (filter.toDate) {
      params.append('to', filter.toDate.toISOString());
    }

    if (filter.limit) {
      params.append('limit', filter.limit.toString());
    }

    if (filter.offset) {
      params.append('offset', filter.offset.toString());
    }

    return params.toString();
  }

  /**
   * Ensure wrapper is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new JulesError(
        'Jules wrapper not initialized. Call initialize() first.',
        JulesErrorType.INVALID_CONFIGURATION
      );
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Persistence Manager - File-based workflow storage
 *
 * Features:
 * - Save/load workflows to ~/.gemini-flow/workflows/
 * - Automatic backup creation
 * - File corruption recovery
 * - Directory management
 * - Auto-save with configurable intervals
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../utils/Logger.js';
import { getConfig } from '../utils/Config.js';
import { InputValidator } from '../utils/SecurityUtils.js';
import { RetryStrategy } from '../utils/RetryUtils.js';
import { WorkflowSerializer } from './WorkflowSerializer.js';
import { Workflow } from './types/index.js';

export interface PersistenceOptions {
  workflowsDir?: string;
  backupsEnabled?: boolean;
  maxBackups?: number;
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
}

export class PersistenceManager {
  private logger = getLogger();
  private config = getConfig();
  private serializer = new WorkflowSerializer();
  private workflowsDir: string;
  private backupsEnabled: boolean;
  private maxBackups: number;
  private autoSaveEnabled: boolean;
  private autoSaveIntervalMs: number;
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: PersistenceOptions = {}) {
    this.workflowsDir = options.workflowsDir || path.join(os.homedir(), '.gemini-flow', 'workflows');
    this.backupsEnabled = options.backupsEnabled ?? true;
    this.maxBackups = options.maxBackups ?? 5;
    this.autoSaveEnabled = options.autoSaveEnabled ?? false;
    this.autoSaveIntervalMs = options.autoSaveIntervalMs ?? 30000; // 30 seconds
  }

  /**
   * Initialize persistence (create directories)
   */
  async initialize(): Promise<void> {
    try {
      await this.logger.info('Initializing PersistenceManager', {
        workflowsDir: this.workflowsDir,
      });

      // Create workflows directory
      await fs.mkdir(this.workflowsDir, { recursive: true });

      // Create backups directory if enabled
      if (this.backupsEnabled) {
        const backupsDir = path.join(this.workflowsDir, '.backups');
        await fs.mkdir(backupsDir, { recursive: true });
      }

      await this.logger.info('PersistenceManager initialized');
    } catch (error) {
      await this.logger.error('Failed to initialize PersistenceManager', error as Error);
      throw new Error(`Initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Save workflow to disk
   */
  async saveWorkflow(workflow: Workflow): Promise<string> {
    try {
      // Validate workflow ID
      const validation = InputValidator.validateAgentId(workflow.metadata.id);
      if (!validation.valid) {
        // Use simpler validation - just check for dangerous characters
        if (workflow.metadata.id.includes('..') || workflow.metadata.id.includes('/')) {
          throw new Error('Invalid workflow ID: contains dangerous characters');
        }
      }

      const filePath = this.getWorkflowPath(workflow.metadata.id);

      await this.logger.debug('Saving workflow', {
        workflowId: workflow.metadata.id,
        filePath,
      });

      // Create backup if file exists
      if (this.backupsEnabled && fsSync.existsSync(filePath)) {
        await this.createBackup(workflow.metadata.id);
      }

      // Update timestamp
      workflow.metadata.updatedAt = Date.now();

      // Serialize workflow
      const json = await this.serializer.serializeToJson(workflow, true);

      // Write to file with retry
      await RetryStrategy.execute(
        async () => {
          await fs.writeFile(filePath, json, 'utf-8');
        },
        'saveWorkflow',
        { maxRetries: 3, initialDelayMs: 100 }
      );

      await this.logger.info('Workflow saved', {
        workflowId: workflow.metadata.id,
        size: json.length,
      });

      return filePath;
    } catch (error) {
      await this.logger.error('Failed to save workflow', error as Error, {
        workflowId: workflow.metadata.id,
      });
      throw new Error(`Save failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load workflow from disk
   */
  async loadWorkflow(workflowId: string): Promise<Workflow> {
    try {
      const filePath = this.getWorkflowPath(workflowId);

      await this.logger.debug('Loading workflow', { workflowId, filePath });

      // Check if file exists
      if (!fsSync.existsSync(filePath)) {
        throw new Error(`Workflow file not found: ${workflowId}`);
      }

      // Read file with retry
      const json = await RetryStrategy.execute(
        async () => {
          return await fs.readFile(filePath, 'utf-8');
        },
        'loadWorkflow',
        { maxRetries: 3, initialDelayMs: 100 }
      );

      // Deserialize workflow
      const workflow = await this.serializer.deserializeFromJson(json);

      await this.logger.info('Workflow loaded', {
        workflowId: workflow.metadata.id,
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
      });

      return workflow;
    } catch (error) {
      await this.logger.error('Failed to load workflow', error as Error, { workflowId });

      // Try to recover from backup
      if (this.backupsEnabled) {
        await this.logger.warn('Attempting to recover from backup', { workflowId });
        try {
          return await this.recoverFromBackup(workflowId);
        } catch (recoveryError) {
          await this.logger.error('Backup recovery failed', recoveryError as Error);
        }
      }

      throw new Error(`Load failed: ${(error as Error).message}`);
    }
  }

  /**
   * Delete workflow from disk
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const filePath = this.getWorkflowPath(workflowId);

      await this.logger.debug('Deleting workflow', { workflowId, filePath });

      // Create final backup before deletion
      if (this.backupsEnabled && fsSync.existsSync(filePath)) {
        await this.createBackup(workflowId);
      }

      // Delete file
      await fs.unlink(filePath);

      // Cancel auto-save timer if exists
      if (this.autoSaveTimers.has(workflowId)) {
        clearTimeout(this.autoSaveTimers.get(workflowId)!);
        this.autoSaveTimers.delete(workflowId);
      }

      await this.logger.info('Workflow deleted', { workflowId });
    } catch (error) {
      await this.logger.error('Failed to delete workflow', error as Error, { workflowId });
      throw new Error(`Delete failed: ${(error as Error).message}`);
    }
  }

  /**
   * List all saved workflows
   */
  async listWorkflows(): Promise<Workflow[]> {
    try {
      await this.logger.debug('Listing workflows');

      // Ensure directory exists
      if (!fsSync.existsSync(this.workflowsDir)) {
        return [];
      }

      // Read directory
      const files = await fs.readdir(this.workflowsDir);

      // Filter JSON files
      const workflowFiles = files.filter(file =>
        file.endsWith('.json') && !file.startsWith('.')
      );

      // Load all workflows
      const workflows: Workflow[] = [];
      for (const file of workflowFiles) {
        try {
          const workflowId = path.basename(file, '.json');
          const workflow = await this.loadWorkflow(workflowId);
          workflows.push(workflow);
        } catch (error) {
          await this.logger.warn('Failed to load workflow file', {
            file,
            error: (error as Error).message,
          });
        }
      }

      await this.logger.info('Workflows listed', { count: workflows.length });

      return workflows;
    } catch (error) {
      await this.logger.error('Failed to list workflows', error as Error);
      throw new Error(`List failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if workflow exists
   */
  async workflowExists(workflowId: string): Promise<boolean> {
    const filePath = this.getWorkflowPath(workflowId);
    return fsSync.existsSync(filePath);
  }

  /**
   * Enable auto-save for a workflow
   */
  enableAutoSave(workflowId: string, workflow: Workflow): void {
    if (!this.autoSaveEnabled) {
      return;
    }

    // Clear existing timer
    if (this.autoSaveTimers.has(workflowId)) {
      clearTimeout(this.autoSaveTimers.get(workflowId)!);
    }

    // Set new timer
    const timer = setInterval(async () => {
      try {
        await this.saveWorkflow(workflow);
        await this.logger.debug('Auto-saved workflow', { workflowId });
      } catch (error) {
        await this.logger.error('Auto-save failed', error as Error, { workflowId });
      }
    }, this.autoSaveIntervalMs);

    this.autoSaveTimers.set(workflowId, timer);
  }

  /**
   * Disable auto-save for a workflow
   */
  disableAutoSave(workflowId: string): void {
    if (this.autoSaveTimers.has(workflowId)) {
      clearTimeout(this.autoSaveTimers.get(workflowId)!);
      this.autoSaveTimers.delete(workflowId);
    }
  }

  /**
   * Create backup of workflow
   */
  private async createBackup(workflowId: string): Promise<void> {
    try {
      const filePath = this.getWorkflowPath(workflowId);
      const backupsDir = path.join(this.workflowsDir, '.backups');
      const timestamp = Date.now();
      const backupPath = path.join(backupsDir, `${workflowId}.${timestamp}.json`);

      // Copy file to backup
      await fs.copyFile(filePath, backupPath);

      // Clean old backups
      await this.cleanOldBackups(workflowId);

      await this.logger.debug('Backup created', { workflowId, backupPath });
    } catch (error) {
      await this.logger.warn('Failed to create backup', {
        workflowId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Recover workflow from backup
   */
  private async recoverFromBackup(workflowId: string): Promise<Workflow> {
    const backupsDir = path.join(this.workflowsDir, '.backups');

    // List backup files
    const files = await fs.readdir(backupsDir);
    const backups = files
      .filter(file => file.startsWith(`${workflowId}.`) && file.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first

    if (backups.length === 0) {
      throw new Error('No backups available');
    }

    // Try most recent backup
    const backupPath = path.join(backupsDir, backups[0]);
    const json = await fs.readFile(backupPath, 'utf-8');
    const workflow = await this.serializer.deserializeFromJson(json);

    await this.logger.info('Recovered workflow from backup', {
      workflowId,
      backupFile: backups[0],
    });

    return workflow;
  }

  /**
   * Clean old backups (keep only maxBackups)
   */
  private async cleanOldBackups(workflowId: string): Promise<void> {
    try {
      const backupsDir = path.join(this.workflowsDir, '.backups');

      // List backup files
      const files = await fs.readdir(backupsDir);
      const backups = files
        .filter(file => file.startsWith(`${workflowId}.`) && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      // Delete old backups
      for (let i = this.maxBackups; i < backups.length; i++) {
        const backupPath = path.join(backupsDir, backups[i]);
        await fs.unlink(backupPath);
        await this.logger.debug('Old backup deleted', { file: backups[i] });
      }
    } catch (error) {
      await this.logger.warn('Failed to clean old backups', {
        workflowId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get full path for workflow file
   */
  private getWorkflowPath(workflowId: string): string {
    return path.join(this.workflowsDir, `${workflowId}.json`);
  }

  /**
   * Get workflows directory
   */
  getWorkflowsDirectory(): string {
    return this.workflowsDir;
  }

  /**
   * Shutdown persistence manager
   */
  async shutdown(): Promise<void> {
    // Clear all auto-save timers
    for (const [workflowId, timer] of this.autoSaveTimers.entries()) {
      clearTimeout(timer);
      await this.logger.debug('Auto-save timer cleared', { workflowId });
    }
    this.autoSaveTimers.clear();

    await this.logger.info('PersistenceManager shut down');
  }
}

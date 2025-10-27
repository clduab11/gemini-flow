/**
 * Export/Import Service - Workflow portability and sharing
 *
 * Features:
 * - Export workflows to JSON/YAML files
 * - Import workflows from files
 * - Conflict resolution on import
 * - ID regeneration for imported workflows
 * - Validation and schema migration
 * - Batch export/import operations
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { getLogger } from '../utils/Logger.js';
import { getConfig } from '../utils/Config.js';
import { InputValidator } from '../utils/SecurityUtils.js';
import { WorkflowSerializer } from './WorkflowSerializer.js';
import { PersistenceManager } from './PersistenceManager.js';
import {
  Workflow,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ValidationError,
  ValidationWarning,
} from './types/index.js';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface BatchExportResult {
  successful: string[];
  failed: Array<{ workflowId: string; error: string }>;
  totalCount: number;
}

export interface BatchImportResult {
  successful: Workflow[];
  failed: Array<{ filePath: string; error: string }>;
  totalCount: number;
}

export class ExportImportService {
  private logger = getLogger();
  private config = getConfig();
  private serializer = new WorkflowSerializer();
  private persistenceManager: PersistenceManager;

  constructor(persistenceManager: PersistenceManager) {
    this.persistenceManager = persistenceManager;
  }

  /**
   * Export workflow to file
   */
  async exportWorkflow(
    workflowId: string,
    outputPath: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      await this.logger.info('Exporting workflow', { workflowId, outputPath });

      // Load workflow
      const workflow = await this.persistenceManager.loadWorkflow(workflowId);

      // Validate output path
      const validatedPath = this.validateExportPath(outputPath, options.format || 'json');

      // Serialize workflow
      let content: string;
      const format = options.format || 'json';

      if (format === 'json') {
        content = await this.serializer.serializeToJson(
          workflow,
          options.prettyPrint ?? true
        );
      } else if (format === 'yaml') {
        content = await this.serializer.serializeToYaml(workflow);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      // Write to file
      await fs.writeFile(validatedPath, content, 'utf-8');

      await this.logger.info('Workflow exported successfully', {
        workflowId,
        filePath: validatedPath,
        size: content.length,
      });

      return {
        success: true,
        filePath: validatedPath,
      };
    } catch (error) {
      await this.logger.error('Failed to export workflow', error as Error, {
        workflowId,
        outputPath,
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Import workflow from file
   */
  async importWorkflow(
    inputPath: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      await this.logger.info('Importing workflow', { inputPath });

      // Validate input path
      const validatedPath = this.validateImportPath(inputPath);

      // Read file
      const content = await fs.readFile(validatedPath, 'utf-8');

      // Detect format from extension
      const format = path.extname(validatedPath).toLowerCase() === '.yaml' ||
        path.extname(validatedPath).toLowerCase() === '.yml'
        ? 'yaml'
        : 'json';

      // Deserialize workflow
      let workflow: Workflow;
      if (format === 'json') {
        workflow = await this.serializer.deserializeFromJson(content);
      } else {
        workflow = await this.serializer.deserializeFromYaml(content);
      }

      // Validate workflow
      if (options.validate !== false) {
        const validation = await this.serializer.validateWorkflow(workflow);
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors,
            warnings: validation.warnings,
          };
        }
      }

      // Generate new IDs if requested
      if (options.generateNewIds) {
        workflow = this.regenerateIds(workflow);
      }

      // Check for conflicts
      const exists = await this.persistenceManager.workflowExists(workflow.metadata.id);
      if (exists && !options.overwrite && !options.merge) {
        throw new Error(
          `Workflow with ID ${workflow.metadata.id} already exists. Use overwrite or merge option.`
        );
      }

      // Handle merge
      if (exists && options.merge) {
        const existingWorkflow = await this.persistenceManager.loadWorkflow(
          workflow.metadata.id
        );
        workflow = this.mergeWorkflows(existingWorkflow, workflow);
      }

      // Save workflow
      await this.persistenceManager.saveWorkflow(workflow);

      await this.logger.info('Workflow imported successfully', {
        workflowId: workflow.metadata.id,
        filePath: validatedPath,
      });

      return {
        success: true,
        workflow,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      await this.logger.error('Failed to import workflow', error as Error, { inputPath });

      return {
        success: false,
        errors: [
          {
            field: 'import',
            message: (error as Error).message,
            code: 'IMPORT_FAILED',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Export all workflows
   */
  async exportAll(outputDir: string, options: ExportOptions = {}): Promise<BatchExportResult> {
    try {
      await this.logger.info('Exporting all workflows', { outputDir });

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // List all workflows
      const workflows = await this.persistenceManager.listWorkflows();

      const result: BatchExportResult = {
        successful: [],
        failed: [],
        totalCount: workflows.length,
      };

      // Export each workflow
      for (const workflow of workflows) {
        const fileName = `${workflow.metadata.id}.${options.format || 'json'}`;
        const outputPath = path.join(outputDir, fileName);

        const exportResult = await this.exportWorkflow(
          workflow.metadata.id,
          outputPath,
          options
        );

        if (exportResult.success) {
          result.successful.push(workflow.metadata.id);
        } else {
          result.failed.push({
            workflowId: workflow.metadata.id,
            error: exportResult.error || 'Unknown error',
          });
        }
      }

      await this.logger.info('Batch export completed', {
        successful: result.successful.length,
        failed: result.failed.length,
      });

      return result;
    } catch (error) {
      await this.logger.error('Failed to export all workflows', error as Error);
      throw error;
    }
  }

  /**
   * Import all workflows from directory
   */
  async importAll(
    inputDir: string,
    options: ImportOptions = {}
  ): Promise<BatchImportResult> {
    try {
      await this.logger.info('Importing all workflows', { inputDir });

      // Validate input directory
      if (!fsSync.existsSync(inputDir)) {
        throw new Error(`Input directory does not exist: ${inputDir}`);
      }

      // Read directory
      const files = await fs.readdir(inputDir);
      const workflowFiles = files.filter(
        file =>
          (file.endsWith('.json') ||
            file.endsWith('.yaml') ||
            file.endsWith('.yml')) &&
          !file.startsWith('.')
      );

      const result: BatchImportResult = {
        successful: [],
        failed: [],
        totalCount: workflowFiles.length,
      };

      // Import each workflow
      for (const file of workflowFiles) {
        const inputPath = path.join(inputDir, file);

        const importResult = await this.importWorkflow(inputPath, options);

        if (importResult.success && importResult.workflow) {
          result.successful.push(importResult.workflow);
        } else {
          result.failed.push({
            filePath: file,
            error: importResult.errors[0]?.message || 'Unknown error',
          });
        }
      }

      await this.logger.info('Batch import completed', {
        successful: result.successful.length,
        failed: result.failed.length,
      });

      return result;
    } catch (error) {
      await this.logger.error('Failed to import all workflows', error as Error);
      throw error;
    }
  }

  /**
   * Validate export path
   */
  private validateExportPath(outputPath: string, format: string): string {
    // Ensure proper extension
    const ext = path.extname(outputPath);
    if (!ext) {
      outputPath = `${outputPath}.${format}`;
    }

    // Validate path doesn't contain dangerous patterns
    if (outputPath.includes('..') || outputPath.includes('~')) {
      throw new Error('Invalid output path: contains dangerous characters');
    }

    // Ensure parent directory exists
    const dir = path.dirname(outputPath);
    if (!fsSync.existsSync(dir)) {
      fsSync.mkdirSync(dir, { recursive: true });
    }

    return outputPath;
  }

  /**
   * Validate import path
   */
  private validateImportPath(inputPath: string): string {
    // Check file exists
    if (!fsSync.existsSync(inputPath)) {
      throw new Error(`Input file does not exist: ${inputPath}`);
    }

    // Validate path doesn't contain dangerous patterns
    if (inputPath.includes('..')) {
      throw new Error('Invalid input path: contains dangerous characters');
    }

    // Check file extension
    const ext = path.extname(inputPath).toLowerCase();
    if (!['.json', '.yaml', '.yml'].includes(ext)) {
      throw new Error('Invalid file format: must be .json, .yaml, or .yml');
    }

    return inputPath;
  }

  /**
   * Regenerate all IDs in workflow
   */
  private regenerateIds(workflow: Workflow): Workflow {
    const idMap = new Map<string, string>();

    // Generate new workflow ID
    workflow.metadata.id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate new node IDs
    workflow.nodes = workflow.nodes.map(node => {
      const oldId = node.id;
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(oldId, newId);

      return {
        ...node,
        id: newId,
      };
    });

    // Update edge references with new node IDs
    workflow.edges = workflow.edges.map(edge => {
      const newSource = idMap.get(edge.source) || edge.source;
      const newTarget = idMap.get(edge.target) || edge.target;
      const newEdgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        ...edge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
      };
    });

    // Update timestamps
    workflow.metadata.createdAt = Date.now();
    workflow.metadata.updatedAt = Date.now();

    return workflow;
  }

  /**
   * Merge two workflows
   */
  private mergeWorkflows(existing: Workflow, imported: Workflow): Workflow {
    // Create ID map for imported nodes to avoid conflicts
    const nodeIdMap = new Map<string, string>();

    // Find conflicting node IDs
    const existingNodeIds = new Set(existing.nodes.map(n => n.id));
    const conflictingNodes = imported.nodes.filter(n => existingNodeIds.has(n.id));

    // Generate new IDs for conflicting nodes
    for (const node of conflictingNodes) {
      const newId = `${node.id}-imported-${Date.now()}`;
      nodeIdMap.set(node.id, newId);
    }

    // Merge nodes
    const mergedNodes = [
      ...existing.nodes,
      ...imported.nodes.map(node => ({
        ...node,
        id: nodeIdMap.get(node.id) || node.id,
      })),
    ];

    // Merge edges with updated node references
    const mergedEdges = [
      ...existing.edges,
      ...imported.edges.map(edge => ({
        ...edge,
        id: `${edge.id}-imported-${Date.now()}`,
        source: nodeIdMap.get(edge.source) || edge.source,
        target: nodeIdMap.get(edge.target) || edge.target,
      })),
    ];

    // Return merged workflow
    return {
      metadata: {
        ...existing.metadata,
        updatedAt: Date.now(),
      },
      nodes: mergedNodes,
      edges: mergedEdges,
    };
  }

  /**
   * Get export directory
   */
  getExportDirectory(): string {
    return path.join(this.persistenceManager.getWorkflowsDirectory(), 'exports');
  }

  /**
   * Initialize export directory
   */
  async initializeExportDirectory(): Promise<void> {
    const exportDir = this.getExportDirectory();
    await fs.mkdir(exportDir, { recursive: true });
    await this.logger.info('Export directory initialized', { exportDir });
  }
}

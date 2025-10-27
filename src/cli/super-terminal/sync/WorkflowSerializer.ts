/**
 * Workflow Serializer - JSON/YAML serialization and validation
 *
 * Features:
 * - JSON serialization/deserialization
 * - YAML support (optional)
 * - Schema validation
 * - Version migration
 * - Human-readable output
 */

import { getLogger } from '../utils/Logger.js';
import { InputValidator } from '../utils/SecurityUtils.js';
import {
  Workflow,
  WorkflowSchema,
  WorkflowNode,
  WorkflowEdge,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  WORKFLOW_SCHEMA_VERSION,
  WORKFLOW_SCHEMA_URL,
} from './types/index.js';

export class WorkflowSerializer {
  private logger = getLogger();

  /**
   * Serialize workflow to JSON string
   */
  async serializeToJson(workflow: Workflow, prettyPrint: boolean = true): Promise<string> {
    try {
      await this.logger.debug('Serializing workflow to JSON', {
        workflowId: workflow.metadata.id,
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
      });

      // Create schema wrapper
      const schema: WorkflowSchema = {
        $schema: WORKFLOW_SCHEMA_URL,
        version: WORKFLOW_SCHEMA_VERSION,
        workflow,
      };

      // Serialize
      const json = prettyPrint
        ? JSON.stringify(schema, null, 2)
        : JSON.stringify(schema);

      await this.logger.info('Workflow serialized to JSON', {
        workflowId: workflow.metadata.id,
        size: json.length,
      });

      return json;
    } catch (error) {
      await this.logger.error('Failed to serialize workflow to JSON', error as Error);
      throw new Error(`Serialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Deserialize workflow from JSON string
   */
  async deserializeFromJson(json: string): Promise<Workflow> {
    try {
      await this.logger.debug('Deserializing workflow from JSON');

      // Parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(json);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }

      // Validate structure
      const validation = await this.validateWorkflow(parsed);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      // Extract workflow
      const workflow = parsed.workflow || parsed;

      await this.logger.info('Workflow deserialized from JSON', {
        workflowId: workflow.metadata?.id,
        nodeCount: workflow.nodes?.length || 0,
        edgeCount: workflow.edges?.length || 0,
      });

      return workflow as Workflow;
    } catch (error) {
      await this.logger.error('Failed to deserialize workflow from JSON', error as Error);
      throw new Error(`Deserialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Serialize workflow to YAML string
   * Note: Requires js-yaml library (optional dependency)
   */
  async serializeToYaml(workflow: Workflow): Promise<string> {
    try {
      await this.logger.debug('Serializing workflow to YAML', {
        workflowId: workflow.metadata.id,
      });

      // Create schema wrapper
      const schema: WorkflowSchema = {
        $schema: WORKFLOW_SCHEMA_URL,
        version: WORKFLOW_SCHEMA_VERSION,
        workflow,
      };

      // For now, convert to formatted JSON (can add js-yaml later)
      // This provides a similar human-readable format
      const json = JSON.stringify(schema, null, 2);

      await this.logger.info('Workflow serialized to YAML-like JSON', {
        workflowId: workflow.metadata.id,
        size: json.length,
      });

      return json;
    } catch (error) {
      await this.logger.error('Failed to serialize workflow to YAML', error as Error);
      throw new Error(`YAML serialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Deserialize workflow from YAML string
   * Note: Requires js-yaml library (optional dependency)
   */
  async deserializeFromYaml(yaml: string): Promise<Workflow> {
    try {
      await this.logger.debug('Deserializing workflow from YAML');

      // For now, try to parse as JSON (since YAML is superset of JSON)
      // This allows JSON files to work with YAML parser
      return await this.deserializeFromJson(yaml);
    } catch (error) {
      await this.logger.error('Failed to deserialize workflow from YAML', error as Error);
      throw new Error(`YAML deserialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate workflow structure and data
   */
  async validateWorkflow(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Check for workflow object
      const workflow = data.workflow || data;

      // Validate metadata
      if (!workflow.metadata) {
        errors.push({
          field: 'metadata',
          message: 'Workflow metadata is required',
          code: 'MISSING_METADATA',
        });
      } else {
        if (!workflow.metadata.id) {
          errors.push({
            field: 'metadata.id',
            message: 'Workflow ID is required',
            code: 'MISSING_ID',
          });
        }
        if (!workflow.metadata.name) {
          errors.push({
            field: 'metadata.name',
            message: 'Workflow name is required',
            code: 'MISSING_NAME',
          });
        }
        if (!workflow.metadata.version) {
          warnings.push({
            field: 'metadata.version',
            message: 'Workflow version not specified',
            code: 'MISSING_VERSION',
          });
        }
      }

      // Validate nodes
      if (!Array.isArray(workflow.nodes)) {
        errors.push({
          field: 'nodes',
          message: 'Nodes must be an array',
          code: 'INVALID_NODES',
        });
      } else {
        workflow.nodes.forEach((node: any, index: number) => {
          if (!node.id) {
            errors.push({
              field: `nodes[${index}].id`,
              message: 'Node ID is required',
              code: 'MISSING_NODE_ID',
            });
          }
          if (!node.position) {
            errors.push({
              field: `nodes[${index}].position`,
              message: 'Node position is required',
              code: 'MISSING_NODE_POSITION',
            });
          } else {
            if (typeof node.position.x !== 'number') {
              errors.push({
                field: `nodes[${index}].position.x`,
                message: 'Node position.x must be a number',
                code: 'INVALID_POSITION_X',
              });
            }
            if (typeof node.position.y !== 'number') {
              errors.push({
                field: `nodes[${index}].position.y`,
                message: 'Node position.y must be a number',
                code: 'INVALID_POSITION_Y',
              });
            }
          }
          if (!node.data) {
            errors.push({
              field: `nodes[${index}].data`,
              message: 'Node data is required',
              code: 'MISSING_NODE_DATA',
            });
          }
        });

        // Check for duplicate node IDs
        const nodeIds = workflow.nodes.map((n: any) => n.id).filter(Boolean);
        const duplicateIds = nodeIds.filter((id: string, idx: number) => nodeIds.indexOf(id) !== idx);
        if (duplicateIds.length > 0) {
          errors.push({
            field: 'nodes',
            message: `Duplicate node IDs found: ${duplicateIds.join(', ')}`,
            code: 'DUPLICATE_NODE_IDS',
          });
        }
      }

      // Validate edges
      if (!Array.isArray(workflow.edges)) {
        errors.push({
          field: 'edges',
          message: 'Edges must be an array',
          code: 'INVALID_EDGES',
        });
      } else {
        const nodeIds = workflow.nodes?.map((n: any) => n.id) || [];

        workflow.edges.forEach((edge: any, index: number) => {
          if (!edge.id) {
            errors.push({
              field: `edges[${index}].id`,
              message: 'Edge ID is required',
              code: 'MISSING_EDGE_ID',
            });
          }
          if (!edge.source) {
            errors.push({
              field: `edges[${index}].source`,
              message: 'Edge source is required',
              code: 'MISSING_EDGE_SOURCE',
            });
          } else if (!nodeIds.includes(edge.source)) {
            errors.push({
              field: `edges[${index}].source`,
              message: `Edge source node '${edge.source}' does not exist`,
              code: 'INVALID_EDGE_SOURCE',
            });
          }
          if (!edge.target) {
            errors.push({
              field: `edges[${index}].target`,
              message: 'Edge target is required',
              code: 'MISSING_EDGE_TARGET',
            });
          } else if (!nodeIds.includes(edge.target)) {
            errors.push({
              field: `edges[${index}].target`,
              message: `Edge target node '${edge.target}' does not exist`,
              code: 'INVALID_EDGE_TARGET',
            });
          }
        });

        // Check for duplicate edge IDs
        const edgeIds = workflow.edges.map((e: any) => e.id).filter(Boolean);
        const duplicateEdgeIds = edgeIds.filter((id: string, idx: number) => edgeIds.indexOf(id) !== idx);
        if (duplicateEdgeIds.length > 0) {
          errors.push({
            field: 'edges',
            message: `Duplicate edge IDs found: ${duplicateEdgeIds.join(', ')}`,
            code: 'DUPLICATE_EDGE_IDS',
          });
        }
      }

      // Version compatibility check
      if (data.version && data.version !== WORKFLOW_SCHEMA_VERSION) {
        warnings.push({
          field: 'version',
          message: `Workflow version ${data.version} differs from current version ${WORKFLOW_SCHEMA_VERSION}`,
          code: 'VERSION_MISMATCH',
        });
      }

      await this.logger.debug('Workflow validation complete', {
        valid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length,
      });

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      await this.logger.error('Validation error', error as Error);
      return {
        valid: false,
        errors: [
          {
            field: 'workflow',
            message: `Validation exception: ${(error as Error).message}`,
            code: 'VALIDATION_EXCEPTION',
          },
        ],
        warnings,
      };
    }
  }

  /**
   * Migrate workflow to current version
   */
  async migrateWorkflow(workflow: any, fromVersion: string): Promise<Workflow> {
    await this.logger.info('Migrating workflow', {
      fromVersion,
      toVersion: WORKFLOW_SCHEMA_VERSION,
    });

    // Currently only supporting version 1.0.0
    // Add migration logic here as versions evolve

    if (fromVersion === WORKFLOW_SCHEMA_VERSION) {
      return workflow as Workflow;
    }

    // Future migration logic would go here
    throw new Error(`Migration from version ${fromVersion} not supported`);
  }

  /**
   * Convert React Flow format to internal format
   */
  convertFromReactFlow(nodes: any[], edges: any[]): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: node.selected,
      width: node.width,
      height: node.height,
    }));

    const workflowEdges: WorkflowEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
      label: edge.label,
      selected: edge.selected,
    }));

    return { nodes: workflowNodes, edges: workflowEdges };
  }

  /**
   * Convert internal format to React Flow format
   */
  convertToReactFlow(nodes: WorkflowNode[], edges: WorkflowEdge[]): { nodes: any[]; edges: any[] } {
    // React Flow format is compatible with our internal format
    // Just ensure all required fields are present
    const reactFlowNodes = nodes.map(node => ({
      ...node,
      position: node.position || { x: 0, y: 0 },
      data: node.data || { label: 'Node' },
    }));

    const reactFlowEdges = edges.map(edge => ({
      ...edge,
    }));

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }
}

# Gemini Flow - Workflow Format Specification

**Version:** 1.0.0
**Schema Version:** 1.0.0
**Sprint:** 6
**Date:** October 27, 2025

## Table of Contents

1. [Overview](#overview)
2. [JSON Schema](#json-schema)
3. [YAML Format](#yaml-format)
4. [Field Descriptions](#field-descriptions)
5. [Validation Rules](#validation-rules)
6. [Examples](#examples)
7. [Migration Guide](#migration-guide)

---

## Overview

The Gemini Flow workflow format is a JSON-based (with YAML support) specification for defining AI agent workflows with nodes and edges. It is compatible with React Flow's node and edge types while adding metadata and validation features.

### Design Goals

- **Human-Readable**: JSON/YAML formats with clear structure
- **Version Controlled**: Git-friendly format for tracking changes
- **Portable**: Export/import between systems
- **Validated**: Comprehensive schema validation
- **Compatible**: Works with React Flow frontend

### Schema URL

```
https://gemini-flow.dev/schema/workflow/v1
```

---

## JSON Schema

### Complete Example

```json
{
  "$schema": "https://gemini-flow.dev/schema/workflow/v1",
  "version": "1.0.0",
  "workflow": {
    "metadata": {
      "id": "workflow-1698432000000",
      "name": "Data Processing Pipeline",
      "description": "Processes user data through multiple transformation stages",
      "version": "1.0.0",
      "author": "user@example.com",
      "createdAt": 1698432000000,
      "updatedAt": 1698435600000,
      "tags": ["data", "pipeline", "production"]
    },
    "nodes": [
      {
        "id": "node-1",
        "type": "input",
        "position": { "x": 250, "y": 25 },
        "data": {
          "label": "Input: User Data",
          "config": {
            "source": "api",
            "endpoint": "/users"
          }
        },
        "width": 180,
        "height": 40
      },
      {
        "id": "node-2",
        "type": "default",
        "position": { "x": 100, "y": 125 },
        "data": {
          "label": "Transform: Normalize",
          "config": {
            "operations": ["lowercase", "trim", "validate"]
          }
        }
      },
      {
        "id": "node-3",
        "type": "output",
        "position": { "x": 250, "y": 250 },
        "data": {
          "label": "Output: Database",
          "config": {
            "destination": "postgresql",
            "table": "users"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1-2",
        "source": "node-1",
        "target": "node-2",
        "type": "smoothstep",
        "animated": true,
        "label": "Raw data"
      },
      {
        "id": "edge-2-3",
        "source": "node-2",
        "target": "node-3",
        "type": "smoothstep",
        "label": "Normalized data"
      }
    ]
  }
}
```

---

## YAML Format

### Complete Example

```yaml
$schema: https://gemini-flow.dev/schema/workflow/v1
version: "1.0.0"
workflow:
  metadata:
    id: workflow-1698432000000
    name: Data Processing Pipeline
    description: Processes user data through multiple transformation stages
    version: "1.0.0"
    author: user@example.com
    createdAt: 1698432000000
    updatedAt: 1698435600000
    tags:
      - data
      - pipeline
      - production

  nodes:
    - id: node-1
      type: input
      position:
        x: 250
        y: 25
      data:
        label: "Input: User Data"
        config:
          source: api
          endpoint: /users
      width: 180
      height: 40

    - id: node-2
      type: default
      position:
        x: 100
        y: 125
      data:
        label: "Transform: Normalize"
        config:
          operations:
            - lowercase
            - trim
            - validate

    - id: node-3
      type: output
      position:
        x: 250
        y: 250
      data:
        label: "Output: Database"
        config:
          destination: postgresql
          table: users

  edges:
    - id: edge-1-2
      source: node-1
      target: node-2
      type: smoothstep
      animated: true
      label: Raw data

    - id: edge-2-3
      source: node-2
      target: node-3
      type: smoothstep
      label: Normalized data
```

---

## Field Descriptions

### Schema Root

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | Yes | Schema URL (https://gemini-flow.dev/schema/workflow/v1) |
| `version` | string | Yes | Workflow format version (currently "1.0.0") |
| `workflow` | object | Yes | The workflow definition |

### Workflow Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metadata` | object | Yes | Workflow metadata |
| `nodes` | array | Yes | Array of workflow nodes |
| `edges` | array | Yes | Array of workflow edges |

### Metadata Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique workflow identifier (e.g., "workflow-1698432000000") |
| `name` | string | Yes | Human-readable workflow name |
| `description` | string | No | Detailed workflow description |
| `version` | string | Yes | Workflow semantic version (e.g., "1.0.0") |
| `author` | string | No | Workflow author (email or username) |
| `createdAt` | number | Yes | Creation timestamp (Unix milliseconds) |
| `updatedAt` | number | Yes | Last update timestamp (Unix milliseconds) |
| `tags` | string[] | No | Array of tags for categorization |

### Node Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique node identifier |
| `type` | string | No | Node type ("input", "output", "default", or custom) |
| `position` | object | Yes | Node position on canvas |
| `position.x` | number | Yes | X coordinate |
| `position.y` | number | Yes | Y coordinate |
| `data` | object | Yes | Node data payload |
| `data.label` | string | Yes | Display label for node |
| `selected` | boolean | No | Whether node is selected (default: false) |
| `dragging` | boolean | No | Whether node is being dragged (default: false) |
| `width` | number | No | Node width in pixels |
| `height` | number | No | Node height in pixels |

**Node Data**: The `data` object can contain any additional fields specific to your node type. The only required field is `label`.

### Edge Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique edge identifier |
| `source` | string | Yes | Source node ID (must reference existing node) |
| `target` | string | Yes | Target node ID (must reference existing node) |
| `type` | string | No | Edge type ("default", "smoothstep", "step", "straight", or custom) |
| `animated` | boolean | No | Whether edge is animated (default: false) |
| `label` | string | No | Display label for edge |
| `selected` | boolean | No | Whether edge is selected (default: false) |

---

## Validation Rules

### Metadata Validation

#### Required Fields
```typescript
✓ metadata.id must be present
✓ metadata.name must be present and non-empty
✓ metadata.version must be present
✓ metadata.createdAt must be present and positive number
✓ metadata.updatedAt must be present and positive number
```

#### Optional Fields
```typescript
✓ metadata.description: string (optional)
✓ metadata.author: string (optional)
✓ metadata.tags: string[] (optional, empty array allowed)
```

### Node Validation

#### Structural Requirements
```typescript
✓ nodes must be an array
✓ Each node must have unique id
✓ Each node.id must be string
✓ Each node.position must be object with x and y
✓ position.x and position.y must be numbers
✓ Each node.data must be object
✓ Each node.data.label must be string
```

#### Duplicate Detection
```typescript
✗ Duplicate node IDs are rejected
✗ Empty node ID is rejected
```

#### Type Validation
```typescript
✓ node.type: "input" | "output" | "default" | string (optional)
✓ node.selected: boolean (optional)
✓ node.dragging: boolean (optional)
✓ node.width: number (optional)
✓ node.height: number (optional)
```

### Edge Validation

#### Structural Requirements
```typescript
✓ edges must be an array
✓ Each edge must have unique id
✓ Each edge.id must be string
✓ Each edge.source must be string
✓ Each edge.target must be string
```

#### Reference Integrity
```typescript
✓ edge.source must reference existing node ID
✓ edge.target must reference existing node ID
✗ Self-referencing edges allowed
✗ Multiple edges between same nodes allowed
```

#### Duplicate Detection
```typescript
✗ Duplicate edge IDs are rejected
✗ Empty edge ID is rejected
```

### Version Compatibility

```typescript
if (workflow.metadata.version !== CURRENT_VERSION) {
  // Emit warning, attempt migration
  warnings.push({
    field: 'metadata.version',
    message: `Version ${workflow.metadata.version} differs from current ${CURRENT_VERSION}`,
    code: 'VERSION_MISMATCH'
  });
}
```

---

## Examples

### Minimal Workflow

```json
{
  "$schema": "https://gemini-flow.dev/schema/workflow/v1",
  "version": "1.0.0",
  "workflow": {
    "metadata": {
      "id": "workflow-minimal",
      "name": "Minimal Workflow",
      "version": "1.0.0",
      "createdAt": 1698432000000,
      "updatedAt": 1698432000000
    },
    "nodes": [
      {
        "id": "start",
        "position": { "x": 0, "y": 0 },
        "data": { "label": "Start" }
      }
    ],
    "edges": []
  }
}
```

### Linear Pipeline

```json
{
  "$schema": "https://gemini-flow.dev/schema/workflow/v1",
  "version": "1.0.0",
  "workflow": {
    "metadata": {
      "id": "workflow-linear",
      "name": "Linear Pipeline",
      "version": "1.0.0",
      "createdAt": 1698432000000,
      "updatedAt": 1698432000000
    },
    "nodes": [
      {
        "id": "step1",
        "type": "input",
        "position": { "x": 0, "y": 0 },
        "data": { "label": "Step 1" }
      },
      {
        "id": "step2",
        "position": { "x": 200, "y": 0 },
        "data": { "label": "Step 2" }
      },
      {
        "id": "step3",
        "type": "output",
        "position": { "x": 400, "y": 0 },
        "data": { "label": "Step 3" }
      }
    ],
    "edges": [
      { "id": "e1-2", "source": "step1", "target": "step2" },
      { "id": "e2-3", "source": "step2", "target": "step3" }
    ]
  }
}
```

### Branching Workflow

```json
{
  "$schema": "https://gemini-flow.dev/schema/workflow/v1",
  "version": "1.0.0",
  "workflow": {
    "metadata": {
      "id": "workflow-branch",
      "name": "Branching Workflow",
      "version": "1.0.0",
      "createdAt": 1698432000000,
      "updatedAt": 1698432000000
    },
    "nodes": [
      {
        "id": "input",
        "type": "input",
        "position": { "x": 200, "y": 0 },
        "data": { "label": "Input" }
      },
      {
        "id": "branch-a",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Branch A" }
      },
      {
        "id": "branch-b",
        "position": { "x": 300, "y": 100 },
        "data": { "label": "Branch B" }
      },
      {
        "id": "merge",
        "type": "output",
        "position": { "x": 200, "y": 200 },
        "data": { "label": "Merge" }
      }
    ],
    "edges": [
      { "id": "e-input-a", "source": "input", "target": "branch-a" },
      { "id": "e-input-b", "source": "input", "target": "branch-b" },
      { "id": "e-a-merge", "source": "branch-a", "target": "merge" },
      { "id": "e-b-merge", "source": "branch-b", "target": "merge" }
    ]
  }
}
```

### Custom Node Types

```json
{
  "$schema": "https://gemini-flow.dev/schema/workflow/v1",
  "version": "1.0.0",
  "workflow": {
    "metadata": {
      "id": "workflow-custom",
      "name": "Custom Node Types",
      "version": "1.0.0",
      "createdAt": 1698432000000,
      "updatedAt": 1698432000000
    },
    "nodes": [
      {
        "id": "api-node",
        "type": "apiCall",
        "position": { "x": 0, "y": 0 },
        "data": {
          "label": "API Call",
          "endpoint": "https://api.example.com/data",
          "method": "GET",
          "headers": {
            "Authorization": "Bearer ${API_TOKEN}"
          }
        }
      },
      {
        "id": "transform-node",
        "type": "dataTransform",
        "position": { "x": 200, "y": 0 },
        "data": {
          "label": "Transform",
          "operations": [
            { "type": "filter", "field": "status", "value": "active" },
            { "type": "map", "field": "name", "transform": "uppercase" }
          ]
        }
      },
      {
        "id": "save-node",
        "type": "database",
        "position": { "x": 400, "y": 0 },
        "data": {
          "label": "Save to DB",
          "connection": "postgresql://localhost/mydb",
          "table": "processed_data"
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "api-node", "target": "transform-node" },
      { "id": "e2", "source": "transform-node", "target": "save-node" }
    ]
  }
}
```

---

## Migration Guide

### From Version 0.9.x to 1.0.0

#### Changes

1. **Schema Field**: Added `$schema` field at root level
2. **Metadata Required**: `metadata.version` now required
3. **Timestamps**: `createdAt` and `updatedAt` changed from ISO strings to Unix milliseconds
4. **Node Data**: `data.label` is now required (was optional)

#### Migration Steps

**Automatic Migration** (performed by WorkflowSerializer):

```typescript
const workflow = await serializer.migrateWorkflow(oldWorkflow, '0.9.0');
```

**Manual Migration**:

```javascript
// Step 1: Add $schema field
workflow.$schema = 'https://gemini-flow.dev/schema/workflow/v1';

// Step 2: Add metadata.version if missing
workflow.workflow.metadata.version = '1.0.0';

// Step 3: Convert timestamps
workflow.workflow.metadata.createdAt = new Date(workflow.workflow.metadata.createdAt).getTime();
workflow.workflow.metadata.updatedAt = new Date(workflow.workflow.metadata.updatedAt).getTime();

// Step 4: Add missing node labels
workflow.workflow.nodes.forEach(node => {
  if (!node.data.label) {
    node.data.label = `Node ${node.id}`;
  }
});

// Step 5: Update version
workflow.version = '1.0.0';
```

---

## Best Practices

### Naming Conventions

**Workflow IDs**:
```
✓ workflow-1698432000000
✓ workflow-user-data-pipeline
✗ my workflow (no spaces)
✗ workflow#123 (no special chars except dash/underscore)
```

**Node IDs**:
```
✓ node-1
✓ input-api-users
✓ transform-normalize
✗ node 1 (no spaces)
```

**Edge IDs**:
```
✓ edge-1-2
✓ e-input-transform
✓ connection-api-to-db
✗ edge 1 (no spaces)
```

### Positioning

**Grid Alignment**: Use multiples of 25 for cleaner layouts
```json
{
  "position": { "x": 100, "y": 150 }  // ✓ Good
}
{
  "position": { "x": 103, "y": 147 }  // ✗ Harder to align
}
```

**Spacing**: Minimum 100px between nodes for readability
```json
[
  { "id": "node1", "position": { "x": 0, "y": 0 } },
  { "id": "node2", "position": { "x": 150, "y": 0 } }  // ✓ Good spacing
]
```

### Data Organization

**Keep Node Data Flat** (when possible):
```json
// ✓ Good
{
  "data": {
    "label": "API Call",
    "endpoint": "/users",
    "method": "GET"
  }
}

// ✗ Over-nested
{
  "data": {
    "label": "API Call",
    "config": {
      "api": {
        "endpoint": "/users",
        "method": "GET"
      }
    }
  }
}
```

### Version Control

**Commit Messages**:
```bash
git add workflow-data-pipeline.json
git commit -m "feat(workflow): Add user data normalization step"
```

**Pretty Print**: Always use pretty-printed JSON for Git
```typescript
await serializer.serializeToJson(workflow, true); // prettyPrint: true
```

---

## Validation Errors

### Common Error Messages

#### Duplicate Node ID
```json
{
  "field": "nodes[5].id",
  "message": "Duplicate node ID: node-123",
  "code": "DUPLICATE_ID"
}
```

**Solution**: Ensure all node IDs are unique

#### Invalid Edge Reference
```json
{
  "field": "edges[2].target",
  "message": "Edge target references non-existent node: node-999",
  "code": "INVALID_REFERENCE"
}
```

**Solution**: Ensure edge source/target match existing node IDs

#### Missing Required Field
```json
{
  "field": "metadata.name",
  "message": "Metadata name is required",
  "code": "MISSING_REQUIRED_FIELD"
}
```

**Solution**: Add the required field

#### Invalid Type
```json
{
  "field": "nodes[3].position.x",
  "message": "Position x must be a number, got string",
  "code": "INVALID_TYPE"
}
```

**Solution**: Ensure correct data type

---

## FAQ

**Q: Can I use custom node types?**
A: Yes! The `type` field accepts any string. The React Flow frontend needs corresponding node components.

**Q: Is YAML fully supported?**
A: Yes, YAML is supported for import/export. The serializer currently converts YAML to JSON internally.

**Q: How do I add custom fields to nodes?**
A: Add any fields to `node.data`. Only `label` is required.

**Q: Can edges have custom styling?**
A: Yes, React Flow edge types support styling. Add custom fields to `edge` object.

**Q: Are cyclic workflows allowed?**
A: Yes, validation does not prohibit cycles in the graph.

**Q: What's the maximum workflow size?**
A: No hard limit. Performance tested up to 1000 nodes and 2000 edges.

**Q: Can I nest workflows?**
A: Not directly in the format. Use node `data` fields to reference sub-workflows.

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
**Sprint**: 6

/**
 * Workflow Builder Screen - Interactive workflow creation and editing
 *
 * Features:
 * - Node creation and management
 * - ASCII visualization of workflow graph
 * - Edge connection interface
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TuiManager, WorkflowState } from '../TuiManager.js';
import { Menu, MenuItem } from '../components/Menu.js';
import { FormField } from '../components/FormField.js';
import { StatusBar } from '../components/StatusBar.js';

export interface WorkflowBuilderScreenProps {
  tuiManager: TuiManager;
  onBack: () => void;
}

export const WorkflowBuilderScreen: React.FC<WorkflowBuilderScreenProps> = ({
  tuiManager,
  onBack
}) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'view'>('menu');
  const [workflowName, setWorkflowName] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowState | null>(null);

  const workflows = tuiManager.getState().workflows;

  useInput((input, key) => {
    if (key.escape) {
      if (mode !== 'menu') {
        setMode('menu');
      } else {
        onBack();
      }
    }
  });

  const renderWorkflowGraph = (workflow: WorkflowState): string => {
    // ASCII art visualization of workflow
    const lines = [
      '┌─────────────────────────────────────────┐',
      `│  Workflow: ${workflow.name.padEnd(28)}│`,
      '├─────────────────────────────────────────┤',
      '│                                         │',
      '│     ┌─────────┐                        │',
      '│     │ Start   │                        │',
      '│     └────┬────┘                        │',
      '│          │                             │',
      '│          ▼                             │',
      '│     ┌─────────┐                        │',
      `│     │ Node 1  │  ${workflow.nodeCount} nodes      │`,
      '│     └────┬────┘                        │',
      '│          │                             │',
      '│          ▼                             │',
      '│     ┌─────────┐                        │',
      '│     │  End    │                        │',
      '│     └─────────┘                        │',
      '│                                         │',
      '└─────────────────────────────────────────┘'
    ];
    return lines.join('\n');
  };

  if (mode === 'create') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
          <Text bold color="cyan">Create New Workflow</Text>
        </Box>

        <FormField
          label="Workflow Name"
          value={workflowName}
          onChange={setWorkflowName}
          onSubmit={async (value) => {
            await tuiManager.createWorkflow(value);
            setMode('menu');
            setWorkflowName('');
          }}
          onCancel={() => setMode('menu')}
          placeholder="Enter workflow name..."
          maxLength={50}
        />
      </Box>
    );
  }

  if (mode === 'view' && selectedWorkflow) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
          <Text bold color="cyan">Workflow Visualization</Text>
        </Box>

        <Box borderStyle="single" borderColor="green" padding={1} marginBottom={1}>
          <Text>{renderWorkflowGraph(selectedWorkflow)}</Text>
        </Box>

        <StatusBar
          leftItems={[
            { label: 'Nodes', value: String(selectedWorkflow.nodeCount), color: 'cyan' },
            { label: 'Edges', value: String(selectedWorkflow.edgeCount), color: 'blue' },
            { label: 'Status', value: selectedWorkflow.status, color: 'green' }
          ]}
          keyboardHints={[
            { key: 'Esc', action: 'Back to Menu' },
            { key: 'E', action: 'Edit' },
            { key: 'D', action: 'Delete' },
            { key: 'R', action: 'Run' }
          ]}
        />
      </Box>
    );
  }

  const menuItems: MenuItem[] = [
    { label: 'Create New Workflow', value: 'create', description: 'Start a new workflow' },
    { label: 'View Workflows', value: 'view', description: `View ${workflows.length} workflows` },
    { label: 'Import Workflow', value: 'import', description: 'Import from file', disabled: true },
    { label: 'Export Workflow', value: 'export', description: 'Export to file', disabled: true },
    { label: 'Back to Dashboard', value: 'back', description: 'Return to main screen' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">🔧 Workflow Builder</Text>
      </Box>

      <Menu
        title="Workflow Actions"
        items={menuItems}
        onSelect={(item) => {
          switch (item.value) {
            case 'create':
              setMode('create');
              break;
            case 'view':
              if (workflows.length > 0) {
                setSelectedWorkflow(workflows[0]);
                setMode('view');
              }
              break;
            case 'back':
              onBack();
              break;
          }
        }}
        onCancel={onBack}
      />

      <Box marginTop={1}>
        <StatusBar
          leftItems={[
            { label: 'Total Workflows', value: String(workflows.length), color: 'cyan' }
          ]}
        />
      </Box>
    </Box>
  );
};

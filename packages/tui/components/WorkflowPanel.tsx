/**
 * Workflow Panel
 * Shows active workflows and execution status
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface Workflow {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  startTime?: Date;
  endTime?: Date;
}

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

export const WorkflowPanel: React.FC = () => {
  // Example workflow (in production, would come from state/props)
  const exampleWorkflow: Workflow = {
    id: 'workflow-1',
    name: 'AI-Powered Research Pipeline',
    status: 'running',
    steps: [
      { name: 'Discover agents via A2A', status: 'completed' },
      { name: 'Authorize payment via AP2', status: 'completed' },
      { name: 'Load context from Redis MCP', status: 'running' },
      { name: 'Execute Gemini Flash query', status: 'pending' },
      { name: 'Optimize with quantum circuit', status: 'pending' },
      { name: 'Generate report', status: 'pending' }
    ],
    startTime: new Date(Date.now() - 5000)
  };

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <Text color="green">✓</Text>;
      case 'running':
        return <Text color="yellow"><Spinner type="dots" /></Text>;
      case 'failed':
        return <Text color="red">✗</Text>;
      case 'pending':
        return <Text dimColor>○</Text>;
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'pending':
        return 'gray';
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">Active Workflows</Text>
      </Box>

      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          {/* Workflow Header */}
          <Box marginBottom={1}>
            <Text bold color="cyan">{exampleWorkflow.name}</Text>
          </Box>

          <Box marginBottom={1}>
            <Text dimColor>
              ID: {exampleWorkflow.id} •{' '}
              Status: <Text color={getStatusColor(exampleWorkflow.status)}>
                {exampleWorkflow.status.toUpperCase()}
              </Text>
            </Text>
          </Box>

          {/* Workflow Steps */}
          <Box flexDirection="column">
            {exampleWorkflow.steps.map((step, index) => (
              <Box key={index} marginBottom={1}>
                <Box width={3}>
                  {getStatusIcon(step.status)}
                </Box>
                <Text>
                  {step.name}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Progress Bar */}
          <Box marginTop={1} borderStyle="single" padding={1}>
            <Box flexDirection="column">
              <Text bold>Progress</Text>
              <Box>
                <Text>
                  {exampleWorkflow.steps.filter(s => s.status === 'completed').length} /{' '}
                  {exampleWorkflow.steps.length} steps completed
                </Text>
              </Box>
              {exampleWorkflow.startTime && (
                <Text dimColor>
                  Running for {Math.floor((Date.now() - exampleWorkflow.startTime.getTime()) / 1000)}s
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Instructions */}
      <Box marginTop={1} borderStyle="single" padding={1}>
        <Text dimColor>
          Workflows orchestrate multiple services using A2A, AP2, and MCP protocols.
          Create custom workflows via CLI or API.
        </Text>
      </Box>
    </Box>
  );
};

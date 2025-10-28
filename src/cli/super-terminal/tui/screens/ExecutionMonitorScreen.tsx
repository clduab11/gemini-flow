/**
 * Execution Monitor Screen - Real-time workflow execution monitoring
 *
 * Features:
 * - Live log tailing
 * - Execution progress tracking
 * - Error highlighting
 * - Circuit breaker status
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { TuiManager } from '../TuiManager.js';
import { StatusBar } from '../components/StatusBar.js';

export interface ExecutionMonitorScreenProps {
  tuiManager: TuiManager;
  onBack: () => void;
}

export const ExecutionMonitorScreen: React.FC<ExecutionMonitorScreenProps> = ({
  tuiManager,
  onBack
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState(tuiManager.getState().workflows);

  useEffect(() => {
    // Listen for log updates
    const handleLogsUpdate = (updatedLogs: string[]) => {
      setLogs(updatedLogs);
    };

    const handleWorkflowsUpdate = () => {
      setWorkflows(tuiManager.getState().workflows);
    };

    tuiManager.on('logs-updated', handleLogsUpdate);
    tuiManager.on('workflows-updated', handleWorkflowsUpdate);
    tuiManager.on('workflow-execution-progress', handleWorkflowsUpdate);

    // Initial load
    setLogs(tuiManager.getExecutionLogs());

    return () => {
      tuiManager.off('logs-updated', handleLogsUpdate);
      tuiManager.off('workflows-updated', handleWorkflowsUpdate);
      tuiManager.off('workflow-execution-progress', handleWorkflowsUpdate);
    };
  }, [tuiManager]);

  const runningWorkflows = workflows.filter(w => w.status === 'running');
  const displayLogs = logs.slice(-20); // Show last 20 lines

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">📊 Execution Monitor</Text>
      </Box>

      <StatusBar
        leftItems={[
          { label: 'Running', value: String(runningWorkflows.length), color: 'green' },
          { label: 'Log Lines', value: String(logs.length), color: 'blue' }
        ]}
        keyboardHints={[
          { key: 'Esc', action: 'Back' },
          { key: 'C', action: 'Clear Logs' },
          { key: 'P', action: 'Pause' }
        ]}
      />

      {/* Running Workflows */}
      {runningWorkflows.length > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor="green" padding={1} marginY={1}>
          <Text bold color="green">Active Executions:</Text>
          {runningWorkflows.map(workflow => {
            const progress = workflow.totalSteps > 0
              ? Math.floor((workflow.currentStep / workflow.totalSteps) * 100)
              : 0;
            const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

            return (
              <Box key={workflow.id} flexDirection="column" marginTop={1}>
                <Text>
                  <Text bold>{workflow.name}</Text>
                  <Text dimColor> - Step {workflow.currentStep}/{workflow.totalSteps}</Text>
                </Text>
                <Text>
                  <Text color="cyan">{progressBar}</Text>
                  <Text> {progress}%</Text>
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Live Logs */}
      <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1} flexGrow={1}>
        <Text bold color="blue">📜 Live Execution Logs:</Text>
        <Box flexDirection="column" marginTop={1}>
          {displayLogs.length === 0 ? (
            <Text dimColor>No logs available. Start a workflow to see execution logs.</Text>
          ) : (
            displayLogs.map((log, index) => {
              const isError = log.includes('ERROR');
              const isWarn = log.includes('WARN');
              const color = isError ? 'red' : isWarn ? 'yellow' : 'white';

              return (
                <Text key={index} color={color} dimColor={!isError && !isWarn}>
                  {log}
                </Text>
              );
            })
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          Logs auto-refresh every 500ms • Press Esc to return to dashboard
        </Text>
      </Box>
    </Box>
  );
};

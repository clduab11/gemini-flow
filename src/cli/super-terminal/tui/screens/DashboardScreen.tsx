/**
 * Dashboard Screen - Main TUI screen showing system overview
 *
 * Features:
 * - Active workflows with status
 * - System health metrics
 * - Recent command history
 * - Navigation menu
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { TuiManager, WorkflowState, SystemMetrics, HistoryEntry } from '../TuiManager.js';
import { Table, TableColumn } from '../components/Table.js';
import { StatusBar } from '../components/StatusBar.js';
import { Menu, MenuItem } from '../components/Menu.js';

export interface DashboardScreenProps {
  tuiManager: TuiManager;
  onNavigate: (screen: string) => void;
  onExit: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  tuiManager,
  onNavigate,
  onExit
}) => {
  const [workflows, setWorkflows] = useState<WorkflowState[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>(tuiManager.getSystemMetrics());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showMenu, setShowMenu] = useState(true);

  useEffect(() => {
    // Listen for updates
    const handleWorkflowsUpdate = (updatedWorkflows: WorkflowState[]) => {
      setWorkflows(updatedWorkflows);
    };

    const handleMetricsUpdate = (updatedMetrics: SystemMetrics) => {
      setMetrics(updatedMetrics);
    };

    tuiManager.on('workflows-updated', handleWorkflowsUpdate);
    tuiManager.on('metrics-updated', handleMetricsUpdate);

    // Initial load
    setWorkflows(tuiManager.getState().workflows);
    setMetrics(tuiManager.getSystemMetrics());
    setHistory(tuiManager.getHistory());

    return () => {
      tuiManager.off('workflows-updated', handleWorkflowsUpdate);
      tuiManager.off('metrics-updated', handleMetricsUpdate);
    };
  }, [tuiManager]);

  const workflowColumns: TableColumn[] = [
    { header: 'Name', key: 'name', width: 20 },
    {
      header: 'Status',
      key: 'status',
      width: 12,
      render: (status: string) => {
        const icons = {
          idle: '○',
          running: '●',
          paused: '◐',
          completed: '✓',
          error: '✗'
        };
        return `${icons[status as keyof typeof icons] || '?'} ${status}`;
      }
    },
    { header: 'Nodes', key: 'nodeCount', width: 8, align: 'right' },
    { header: 'Progress', key: 'progress', width: 15, render: (_, row) =>
      `${row.currentStep}/${row.totalSteps}`
    },
    {
      header: 'Updated',
      key: 'updatedAt',
      width: 12,
      render: (timestamp: number) => {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
      }
    }
  ];

  const historyColumns: TableColumn[] = [
    { header: 'Command', key: 'command', width: 30 },
    {
      header: 'Status',
      key: 'status',
      width: 10,
      render: (status: string) => status === 'success' ? '✓' : '✗'
    },
    { header: 'Duration', key: 'duration', width: 10, render: (ms: number) => `${ms}ms` },
    {
      header: 'Time',
      key: 'timestamp',
      width: 12,
      render: (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
      }
    }
  ];

  const menuItems: MenuItem[] = [
    { label: 'Workflow Builder', value: 'workflow-builder', description: 'Create and edit workflows' },
    { label: 'Execution Monitor', value: 'execution-monitor', description: 'Monitor real-time execution' },
    { label: 'Configuration', value: 'config', description: 'Manage system configuration' },
    { label: 'Help', value: 'help', description: 'View keyboard shortcuts and help' },
    { label: 'Exit', value: 'exit', description: 'Exit TUI mode' }
  ];

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">
          ╔═══════════════════════════════════════════════════════════════════╗
          ║  GEMINI FLOW SUPER TERMINAL - DASHBOARD                          ║
          ╚═══════════════════════════════════════════════════════════════════╝
        </Text>
      </Box>

      {/* Status Bar */}
      <Box marginBottom={1}>
        <StatusBar
          leftItems={[
            { label: 'Agents', value: String(metrics.agentCount), color: 'green' },
            { label: 'Workflows', value: String(metrics.activeWorkflows), color: 'cyan' },
            { label: 'Commands', value: String(metrics.totalCommands), color: 'blue' },
            { label: 'Errors', value: String(metrics.errorCount), color: metrics.errorCount > 0 ? 'red' : 'gray' }
          ]}
          rightItems={[
            { label: 'Uptime', value: formatUptime(metrics.uptime), color: 'white' },
            { label: 'Memory', value: `${metrics.memoryUsage.toFixed(0)}MB`, color: 'white' },
            { label: 'Logs', value: formatBytes(metrics.logSize), color: 'white' }
          ]}
          keyboardHints={[
            { key: 'Tab', action: 'Toggle Menu' },
            { key: '↑/↓', action: 'Navigate' },
            { key: 'Enter', action: 'Select' },
            { key: 'Q', action: 'Quit' }
          ]}
        />
      </Box>

      <Box flexDirection="row" flexGrow={1}>
        {/* Main Content */}
        <Box flexDirection="column" flexGrow={1} marginRight={1}>
          {/* Workflows Table */}
          <Box marginBottom={1}>
            <Table
              title="📊 Active Workflows"
              columns={workflowColumns}
              data={workflows}
              maxRows={5}
              emptyMessage="No workflows found. Press [2] to create one."
            />
          </Box>

          {/* Recent History */}
          <Box>
            <Table
              title="📜 Recent Command History"
              columns={historyColumns}
              data={history}
              maxRows={5}
              emptyMessage="No command history yet."
            />
          </Box>
        </Box>

        {/* Navigation Menu (if shown) */}
        {showMenu && (
          <Box width={45}>
            <Menu
              title="🎯 Navigation"
              items={menuItems}
              onSelect={(item) => {
                if (item.value === 'exit') {
                  onExit();
                } else {
                  onNavigate(item.value);
                }
              }}
              onCancel={() => setShowMenu(false)}
            />
          </Box>
        )}
      </Box>

      {/* System Health Indicator */}
      <Box marginTop={1} borderStyle="single" borderColor="green" paddingX={1}>
        <Text color="green">● System Healthy</Text>
        <Text dimColor> | Last updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}</Text>
      </Box>
    </Box>
  );
};

/**
 * Agent Visualizer Component
 *
 * Visual representation of the agent swarm:
 * - Live agent status
 * - Category breakdown
 * - Activity timeline
 * - Network topology view (ASCII art)
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export interface AgentVisualizerProps {
  fullScreen?: boolean;
}

interface AgentStatus {
  id: string;
  type: string;
  category: string;
  status: 'idle' | 'busy' | 'error';
}

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ fullScreen = false }) => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  // Simulate agent updates (TODO: integrate with real AgentSpaceManager)
  useEffect(() => {
    const updateAgents = () => {
      const mockAgents: AgentStatus[] = [
        { id: 'agent-001', type: 'coder', category: 'development', status: 'busy' },
        { id: 'agent-002', type: 'researcher', category: 'development', status: 'idle' },
        { id: 'agent-003', type: 'quantum-circuit-designer', category: 'quantum', status: 'busy' },
        { id: 'agent-004', type: 'performance-monitor', category: 'performance', status: 'idle' },
        { id: 'agent-005', type: 'security-auditor', category: 'security', status: 'busy' },
      ];

      setAgents(mockAgents);

      // Calculate category stats
      const stats: Record<string, number> = {};
      mockAgents.forEach(agent => {
        stats[agent.category] = (stats[agent.category] || 0) + 1;
      });
      setCategoryStats(stats);
    };

    updateAgents();
    const interval = setInterval(updateAgents, 2000);

    return () => clearInterval(interval);
  }, []);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'busy':
        return '⚡';
      case 'idle':
        return '💤';
      case 'error':
        return '❌';
      default:
        return '◯';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'busy':
        return 'yellow';
      case 'idle':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Render ASCII network topology
  const renderTopology = () => {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>Network Topology (Mesh):</Text>
        <Text dimColor>
          {`
    ◯──────◯
    │\\    /│
    │ \\  / │
    │  \\/  │
    │  /\\  │
    │ /  \\ │
    │/    \\│
    ◯──────◯
          `}
        </Text>
      </Box>
    );
  };

  // Render agent list
  const renderAgentList = () => {
    const displayAgents = fullScreen ? agents : agents.slice(0, 5);

    return (
      <Box flexDirection="column">
        {displayAgents.map((agent, index) => (
          <Box key={index} marginBottom={fullScreen ? 1 : 0}>
            <Text color={getStatusColor(agent.status)}>
              {getStatusIcon(agent.status)}
            </Text>
            <Text> </Text>
            <Text dimColor>{agent.id}</Text>
            <Text> </Text>
            <Text color="cyan">[{agent.type}]</Text>
          </Box>
        ))}
        {!fullScreen && agents.length > 5 && (
          <Text dimColor>... and {agents.length - 5} more (Ctrl+A to view all)</Text>
        )}
      </Box>
    );
  };

  // Render category breakdown
  const renderCategoryStats = () => {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">By Category:</Text>
        {Object.entries(categoryStats).map(([category, count], index) => (
          <Box key={index}>
            <Text dimColor>• {category}: </Text>
            <Text color="white">{count}</Text>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={fullScreen ? 1 : 0}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color="white">
          {fullScreen ? '🤖 Agent Swarm Visualization' : 'Agents'}
        </Text>
        <Box flexGrow={1} />
        <Text color="yellow">{agents.length} active</Text>
      </Box>

      {/* Agent list */}
      {renderAgentList()}

      {/* Category stats */}
      {fullScreen && renderCategoryStats()}

      {/* Topology visualization */}
      {fullScreen && renderTopology()}

      {/* Legend */}
      {fullScreen && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="cyan">Legend:</Text>
          <Box>
            <Text color="yellow">⚡ Busy</Text>
            <Text> </Text>
            <Text color="green">💤 Idle</Text>
            <Text> </Text>
            <Text color="red">❌ Error</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

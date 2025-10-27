import React from 'react';
import { Box, Text } from 'ink';

interface MetricsPanelProps {
  metrics: {
    agentCount: number;
    tasksActive: number;
    performance?: any;
  };
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const spawnTime = metrics.performance?.['agent.spawn.time'];
  const avgSpawnTime = spawnTime ? Math.round(spawnTime.average) : 0;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
      <Text bold color="yellow">System Metrics</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>Agents: <Text color="cyan">{metrics.agentCount}</Text></Text>
        <Text>Tasks: <Text color="cyan">{metrics.tasksActive}</Text></Text>
        {avgSpawnTime > 0 && (
          <Text>Spawn: <Text color="cyan">{avgSpawnTime}ms</Text></Text>
        )}
        <Text>Status: <Text color="green">Online</Text></Text>
      </Box>
    </Box>
  );
};

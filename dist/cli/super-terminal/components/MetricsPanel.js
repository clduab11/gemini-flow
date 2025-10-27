import React from 'react';
import { Box, Text } from 'ink';
export const MetricsPanel = ({ metrics }) => {
    return (<Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
      <Text bold color="yellow">System Metrics</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>Agents: {metrics.agentCount}</Text>
        <Text>Tasks: {metrics.tasksActive}</Text>
        <Text>Status: <Text color="green">Online</Text></Text>
      </Box>
    </Box>);
};

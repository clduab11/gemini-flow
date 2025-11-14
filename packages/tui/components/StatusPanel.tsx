/**
 * Status Panel
 * Shows protocol status and statistics
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface StatusPanelProps {
  stats: {
    a2a: { agents: number; tasks: number };
    ap2: { mandates: number; transactions: number };
    mcp: { servers: number; running: number };
  } | null;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ stats }) => {
  if (!stats) {
    return (
      <Box>
        <Text dimColor>Loading protocol statistics...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">Protocol Status</Text>
      </Box>

      {/* A2A Status */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">A2A (Agent-to-Agent)</Text>
          <Text>
            Registered Agents: <Text bold color="green">{stats.a2a.agents}</Text>
          </Text>
          <Text>
            Active Tasks: <Text bold color="yellow">{stats.a2a.tasks}</Text>
          </Text>
          <Text dimColor>
            Protocol for agent discovery and collaboration
          </Text>
        </Box>
      </Box>

      {/* AP2 Status */}
      <Box borderStyle="round" borderColor="yellow" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="yellow">AP2 (Agent Payments)</Text>
          <Text>
            Payment Mandates: <Text bold color="green">{stats.ap2.mandates}</Text>
          </Text>
          <Text>
            Transactions: <Text bold color="cyan">{stats.ap2.transactions}</Text>
          </Text>
          <Text dimColor>
            Secure payment protocol extending A2A
          </Text>
        </Box>
      </Box>

      {/* MCP Status */}
      <Box borderStyle="round" borderColor="magenta" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="magenta">MCP (Model Context Protocol)</Text>
          <Text>
            Running Servers: <Text bold color="green">{stats.mcp.running}</Text> / {stats.mcp.servers}
          </Text>
          <Box marginTop={1}>
            <Text dimColor>Available servers: Redis, GitHub, Memory, Filesystem, Sequential Thinking</Text>
          </Box>
          <Text dimColor>
            Anthropic's protocol for context management
          </Text>
        </Box>
      </Box>

      {/* System Info */}
      <Box borderStyle="single" padding={1}>
        <Box flexDirection="column">
          <Text bold>System Information</Text>
          <Text>Node Version: <Text color="green">{process.version}</Text></Text>
          <Text>Platform: <Text color="cyan">{process.platform}</Text></Text>
          <Text>Architecture: <Text color="cyan">{process.arch}</Text></Text>
          <Text>Uptime: <Text color="yellow">{Math.floor(process.uptime())}s</Text></Text>
        </Box>
      </Box>
    </Box>
  );
};

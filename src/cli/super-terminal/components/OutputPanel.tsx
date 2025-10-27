/**
 * Output Panel Component
 *
 * Displays command output with:
 * - Scrollable output history
 * - Syntax highlighting for different output types
 * - Progress indicators for streaming commands
 */

import React from 'react';
import { Box, Text } from 'ink';
import { CommandStream } from '../types.js';

export interface OutputPanelProps {
  outputHistory: Array<{ type: string; data: any }>;
  currentStream: CommandStream | null;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ outputHistory, currentStream }) => {
  // Render individual output entry
  const renderOutput = (entry: { type: string; data: any }, index: number) => {
    switch (entry.type) {
      case 'command':
        return (
          <Box key={index} marginBottom={1}>
            <Text color="cyan" bold>$ </Text>
            <Text>{entry.data}</Text>
          </Box>
        );

      case 'text':
        return (
          <Box key={index}>
            <Text>{entry.data}</Text>
          </Box>
        );

      case 'log':
        return (
          <Box key={index}>
            <Text dimColor>{entry.data}</Text>
          </Box>
        );

      case 'error':
        return (
          <Box key={index}>
            <Text color="red">✗ Error: {entry.data}</Text>
          </Box>
        );

      case 'json':
        return (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Text color="yellow">
              {JSON.stringify(entry.data, null, 2)}
            </Text>
          </Box>
        );

      case 'metric':
        return (
          <Box key={index}>
            <Text color="magenta">📊 {entry.data}</Text>
          </Box>
        );

      case 'image':
        return (
          <Box key={index}>
            <Text color="blue">🖼️  Image: {entry.data}</Text>
          </Box>
        );

      case 'video':
        return (
          <Box key={index}>
            <Text color="blue">🎥 Video: {entry.data}</Text>
          </Box>
        );

      case 'audio':
        return (
          <Box key={index}>
            <Text color="blue">🎵 Audio: {entry.data}</Text>
          </Box>
        );

      case 'agent-event':
        return (
          <Box key={index}>
            <Text color="green">
              🤖 Agent: {JSON.stringify(entry.data)}
            </Text>
          </Box>
        );

      case 'complete':
        return (
          <Box key={index} marginBottom={1}>
            <Text color="green" bold>✓ Complete</Text>
            {entry.data && (
              <Text color="green"> → {JSON.stringify(entry.data)}</Text>
            )}
          </Box>
        );

      default:
        return (
          <Box key={index}>
            <Text>{String(entry.data)}</Text>
          </Box>
        );
    }
  };

  // Render progress bar if stream is active
  const renderProgress = () => {
    if (!currentStream) return null;

    const progress = currentStream.progress;
    const barWidth = 40;
    const filledWidth = Math.floor((progress / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;

    const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

    return (
      <Box marginTop={1} borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text color="yellow">{bar}</Text>
        <Text> </Text>
        <Text color="yellow">{progress.toFixed(0)}%</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1} height="100%">
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color="white">Output</Text>
        <Box flexGrow={1} />
        {currentStream && (
          <Text color="yellow">⏳ {currentStream.status}</Text>
        )}
      </Box>

      {/* Output history (scrollable) */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {outputHistory.length === 0 ? (
          <Text dimColor>No output yet. Type a command to get started.</Text>
        ) : (
          outputHistory.slice(-20).map((entry, index) => renderOutput(entry, index))
        )}
      </Box>

      {/* Progress bar */}
      {renderProgress()}
    </Box>
  );
};

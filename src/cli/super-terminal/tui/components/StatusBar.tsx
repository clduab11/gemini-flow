/**
 * Reusable TUI Component: StatusBar
 *
 * A status bar component showing system information and keyboard hints
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface StatusBarProps {
  leftItems?: Array<{ label: string; value: string; color?: string }>;
  rightItems?: Array<{ label: string; value: string; color?: string }>;
  keyboardHints?: Array<{ key: string; action: string }>;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  leftItems = [],
  rightItems = [],
  keyboardHints = []
}) => {
  return (
    <Box flexDirection="column">
      {/* Top status line */}
      <Box justifyContent="space-between" borderStyle="single" borderColor="gray" paddingX={1}>
        <Box>
          {leftItems.map((item, index) => (
            <Box key={index} marginRight={2}>
              <Text dimColor>{item.label}: </Text>
              <Text bold color={item.color || 'white'}>{item.value}</Text>
            </Box>
          ))}
        </Box>
        <Box>
          {rightItems.map((item, index) => (
            <Box key={index} marginLeft={2}>
              <Text dimColor>{item.label}: </Text>
              <Text bold color={item.color || 'white'}>{item.value}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Keyboard hints */}
      {keyboardHints.length > 0 && (
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          {keyboardHints.map((hint, index) => (
            <Box key={index} marginRight={2}>
              <Text bold color="cyan">{hint.key}</Text>
              <Text dimColor>: {hint.action}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

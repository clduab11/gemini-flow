/**
 * Reusable TUI Component: Menu
 *
 * A keyboard-navigable menu component with selection support
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MenuItem {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  selectedIndex?: number;
  onSelect: (item: MenuItem) => void;
  onCancel?: () => void;
  title?: string;
  multiColumn?: boolean;
}

export const Menu: React.FC<MenuProps> = ({
  items,
  selectedIndex: initialIndex = 0,
  onSelect,
  onCancel,
  title,
  multiColumn = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
    } else if (key.return) {
      const item = items[selectedIndex];
      if (!item.disabled) {
        onSelect(item);
      }
    } else if (key.escape && onCancel) {
      onCancel();
    } else if (input >= '1' && input <= '9') {
      const index = parseInt(input, 10) - 1;
      if (index >= 0 && index < items.length && !items[index].disabled) {
        onSelect(items[index]);
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">{title}</Text>
        </Box>
      )}

      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? '▶ ' : '  ';
        const color = item.disabled ? 'gray' : isSelected ? 'cyan' : 'white';
        const numPrefix = `[${index + 1}] `;

        return (
          <Box key={item.value} marginBottom={0}>
            <Text color={color} dimColor={item.disabled}>
              {numPrefix}{prefix}{item.label}
              {item.description && ` - ${item.description}`}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          ↑/↓: Navigate  Enter: Select  1-9: Quick select  Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
};

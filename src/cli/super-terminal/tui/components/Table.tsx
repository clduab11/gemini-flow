/**
 * Reusable TUI Component: Table
 *
 * A table component for displaying structured data
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => string;
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
  title?: string;
  maxRows?: number;
  emptyMessage?: string;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  title,
  maxRows = 20,
  emptyMessage = 'No data available'
}) => {
  const displayData = data.slice(0, maxRows);

  const renderCell = (column: TableColumn, row: any): string => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return String(value || '');
  };

  const alignText = (text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string => {
    const padded = text.padEnd(width).substring(0, width);
    if (align === 'center') {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text.substring(0, width - padding);
    } else if (align === 'right') {
      return text.padStart(width).substring(0, width);
    }
    return padded;
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1}>
      {title && (
        <Box marginBottom={1}>
          <Text bold color="blue">{title}</Text>
        </Box>
      )}

      {/* Header Row */}
      <Box>
        {columns.map((column, index) => (
          <Text key={column.key} bold color="cyan">
            {alignText(column.header, column.width || 15, column.align)}
            {index < columns.length - 1 && ' │ '}
          </Text>
        ))}
      </Box>

      {/* Separator */}
      <Box>
        <Text dimColor>
          {columns.map((col, idx) =>
            '─'.repeat(col.width || 15) + (idx < columns.length - 1 ? '─┼─' : '')
          ).join('')}
        </Text>
      </Box>

      {/* Data Rows */}
      {displayData.length === 0 ? (
        <Box paddingY={1}>
          <Text dimColor>{emptyMessage}</Text>
        </Box>
      ) : (
        displayData.map((row, rowIndex) => (
          <Box key={rowIndex}>
            {columns.map((column, colIndex) => (
              <Text key={column.key}>
                {alignText(renderCell(column, row), column.width || 15, column.align)}
                {colIndex < columns.length - 1 && ' │ '}
              </Text>
            ))}
          </Box>
        ))
      )}

      {data.length > maxRows && (
        <Box marginTop={1}>
          <Text dimColor>... and {data.length - maxRows} more rows</Text>
        </Box>
      )}
    </Box>
  );
};

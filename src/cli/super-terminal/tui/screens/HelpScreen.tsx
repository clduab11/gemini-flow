/**
 * Help Screen - Keyboard shortcuts and usage guide
 *
 * Features:
 * - Comprehensive keyboard shortcuts list
 * - Navigation guide
 * - Feature overview
 * - Quick start guide
 */

import React from 'react';
import { Box, Text } from 'ink';
import { TuiManager } from '../TuiManager.js';
import { Table, TableColumn } from '../components/Table.js';
import { StatusBar } from '../components/StatusBar.js';

export interface HelpScreenProps {
  tuiManager: TuiManager;
  onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({
  tuiManager,
  onBack
}) => {
  const globalShortcuts = [
    { key: 'Esc', description: 'Go back / Cancel', context: 'Global' },
    { key: 'Q', description: 'Quit application', context: 'Dashboard' },
    { key: 'Tab', description: 'Toggle menu', context: 'Dashboard' },
    { key: '↑ / ↓', description: 'Navigate menu items', context: 'Menus' },
    { key: 'Enter', description: 'Select / Confirm', context: 'Menus' },
    { key: '1-9', description: 'Quick select menu item', context: 'Menus' },
    { key: 'D', description: 'Toggle debug mode', context: 'Config' },
    { key: 'S', description: 'Toggle safe mode', context: 'Config' },
    { key: 'C', description: 'Clear logs', context: 'Monitor' },
    { key: 'P', description: 'Pause execution', context: 'Monitor' },
    { key: 'E', description: 'Edit workflow', context: 'Builder' },
    { key: 'R', description: 'Run workflow', context: 'Builder' }
  ];

  const shortcutColumns: TableColumn[] = [
    { header: 'Key', key: 'key', width: 15 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Context', key: 'context', width: 15 }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">❓ Help & Keyboard Shortcuts</Text>
      </Box>

      {/* Quick Start */}
      <Box flexDirection="column" borderStyle="single" borderColor="green" padding={1} marginBottom={1}>
        <Text bold color="green">🚀 Quick Start Guide</Text>
        <Text marginTop={1}>
          1. <Text bold>Dashboard</Text> - View system overview and active workflows
        </Text>
        <Text>
          2. <Text bold>Workflow Builder</Text> - Create and manage workflow definitions
        </Text>
        <Text>
          3. <Text bold>Execution Monitor</Text> - Watch real-time workflow execution
        </Text>
        <Text>
          4. <Text bold>Configuration</Text> - Adjust system settings and modes
        </Text>
        <Text marginTop={1} dimColor>
          Use number keys (1-5) for quick navigation from the dashboard menu.
        </Text>
      </Box>

      {/* Keyboard Shortcuts */}
      <Box marginBottom={1}>
        <Table
          title="⌨️  Keyboard Shortcuts"
          columns={shortcutColumns}
          data={globalShortcuts}
          maxRows={15}
        />
      </Box>

      {/* Features Overview */}
      <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
        <Text bold color="blue">✨ Key Features</Text>
        <Text marginTop={1}>
          • <Text bold>Real-time Monitoring</Text> - Live workflow execution tracking
        </Text>
        <Text>
          • <Text bold>Interactive Builder</Text> - Visual workflow creation with ASCII art
        </Text>
        <Text>
          • <Text bold>Production Security</Text> - Built-in error handling and validation
        </Text>
        <Text>
          • <Text bold>Comprehensive Logging</Text> - Structured logs with rotation
        </Text>
        <Text>
          • <Text bold>Flexible Configuration</Text> - Runtime config management
        </Text>
        <Text>
          • <Text bold>Keyboard Navigation</Text> - Full keyboard-driven interface
        </Text>
      </Box>

      {/* Sprint 4 Integration */}
      <Box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1} marginBottom={1}>
        <Text bold color="yellow">🔒 Sprint 4 Integration</Text>
        <Text marginTop={1} dimColor>
          This TUI is built on Sprint 4's production-ready infrastructure:
        </Text>
        <Text dimColor>
          • Logger with file rotation (10MB max, 5 files)
        </Text>
        <Text dimColor>
          • Configuration management with validation
        </Text>
        <Text dimColor>
          • Input sanitization and injection prevention
        </Text>
        <Text dimColor>
          • Rate limiting and timeout protection
        </Text>
        <Text dimColor>
          • Retry logic and circuit breaker patterns
        </Text>
        <Text dimColor>
          • Debug and safe mode support
        </Text>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <StatusBar
          leftItems={[
            { label: 'Version', value: '1.0.0', color: 'cyan' },
            { label: 'Framework', value: 'Ink + React', color: 'blue' }
          ]}
          keyboardHints={[
            { key: 'Esc', action: 'Back to Dashboard' }
          ]}
        />
      </Box>
    </Box>
  );
};

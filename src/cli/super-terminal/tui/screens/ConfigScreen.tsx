/**
 * Configuration Screen - Interactive configuration management
 *
 * Features:
 * - View current configuration
 * - Toggle debug/safe modes
 * - Edit configuration values
 * - Security settings display
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TuiManager } from '../TuiManager.js';
import { getConfig } from '../../utils/Config.js';
import { getLogger } from '../../utils/Logger.js';
import { Menu, MenuItem } from '../components/Menu.js';
import { StatusBar } from '../components/StatusBar.js';

export interface ConfigScreenProps {
  tuiManager: TuiManager;
  onBack: () => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({
  tuiManager,
  onBack
}) => {
  const [view, setView] = useState<'menu' | 'display'>('menu');
  const config = getConfig();
  const logger = getLogger();
  const currentConfig = config.getConfig();

  useInput((input, key) => {
    if (key.escape) {
      if (view === 'display') {
        setView('menu');
      } else {
        onBack();
      }
    } else if (input === 'd' || input === 'D') {
      // Toggle debug mode
      const newDebugMode = !currentConfig.debugMode;
      config.set('debugMode', newDebugMode);
      logger.setDebugMode(newDebugMode);
    } else if (input === 's' || input === 'S') {
      // Toggle safe mode
      const newSafeMode = !currentConfig.security.safeMode;
      config.setNested('security.safeMode', newSafeMode);
    }
  });

  const menuItems: MenuItem[] = [
    { label: 'View Full Configuration', value: 'view', description: 'Display all settings' },
    {
      label: `Toggle Debug Mode (${currentConfig.debugMode ? 'ON' : 'OFF'})`,
      value: 'debug',
      description: 'Press D to toggle'
    },
    {
      label: `Toggle Safe Mode (${currentConfig.security.safeMode ? 'ON' : 'OFF'})`,
      value: 'safe',
      description: 'Press S to toggle'
    },
    { label: 'Reset to Defaults', value: 'reset', description: 'Restore default settings' },
    { label: 'Back to Dashboard', value: 'back', description: 'Return to main screen' }
  ];

  if (view === 'display') {
    const configSummary = config.getSummary();
    const lines = configSummary.split('\n');

    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
          <Text bold color="cyan">⚙️  Configuration Details</Text>
        </Box>

        <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1} flexGrow={1}>
          {lines.map((line, index) => (
            <Text key={index}>{line}</Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <StatusBar
            keyboardHints={[
              { key: 'Esc', action: 'Back to Menu' },
              { key: 'D', action: 'Toggle Debug' },
              { key: 'S', action: 'Toggle Safe' }
            ]}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">⚙️  Configuration Management</Text>
      </Box>

      <Menu
        title="Configuration Options"
        items={menuItems}
        onSelect={async (item) => {
          switch (item.value) {
            case 'view':
              setView('display');
              break;
            case 'debug':
              const newDebugMode = !currentConfig.debugMode;
              await config.set('debugMode', newDebugMode);
              logger.setDebugMode(newDebugMode);
              break;
            case 'safe':
              const newSafeMode = !currentConfig.security.safeMode;
              await config.setNested('security.safeMode', newSafeMode);
              break;
            case 'reset':
              await config.reset();
              break;
            case 'back':
              onBack();
              break;
          }
        }}
        onCancel={onBack}
      />

      <Box marginTop={1} borderStyle="single" borderColor="green" paddingX={1}>
        <Text>
          <Text bold color="green">Current Mode: </Text>
          {currentConfig.debugMode && <Text color="yellow">DEBUG </Text>}
          {currentConfig.security.safeMode && <Text color="cyan">SAFE </Text>}
          {!currentConfig.debugMode && !currentConfig.security.safeMode && (
            <Text dimColor>NORMAL</Text>
          )}
        </Text>
      </Box>

      <Box marginTop={1}>
        <StatusBar
          leftItems={[
            { label: 'Log Level', value: currentConfig.logLevel, color: 'cyan' },
            { label: 'Rate Limit', value: `${currentConfig.security.rateLimitPerMinute}/min`, color: 'blue' },
            { label: 'Timeout', value: `${currentConfig.security.operationTimeoutMs}ms`, color: 'white' }
          ]}
          keyboardHints={[
            { key: 'D', action: 'Toggle Debug' },
            { key: 'S', action: 'Toggle Safe' },
            { key: 'Esc', action: 'Back' }
          ]}
        />
      </Box>
    </Box>
  );
};

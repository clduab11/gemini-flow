/**
 * TUI App - Main TUI application component
 *
 * Manages screen routing and lifecycle
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { TuiManager, TuiScreen } from './TuiManager.js';
import { CommandRouter } from '../command-router.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { WorkflowBuilderScreen } from './screens/WorkflowBuilderScreen.js';
import { ExecutionMonitorScreen } from './screens/ExecutionMonitorScreen.js';
import { ConfigScreen } from './screens/ConfigScreen.js';
import { HelpScreen } from './screens/HelpScreen.js';
import { getLogger } from '../utils/Logger.js';

export interface TuiAppProps {
  commandRouter: CommandRouter;
  onExit: () => void;
}

export const TuiApp: React.FC<TuiAppProps> = ({ commandRouter, onExit }) => {
  const [tuiManager] = useState(() => new TuiManager(commandRouter));
  const [currentScreen, setCurrentScreen] = useState<TuiScreen>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logger = getLogger();

  useEffect(() => {
    // Initialize TUI Manager
    const initTui = async () => {
      try {
        await tuiManager.initialize();
        setIsInitialized(true);
        await logger.info('TUI App initialized successfully');
      } catch (err) {
        setError(`Failed to initialize TUI: ${(err as Error).message}`);
        await logger.error('TUI initialization failed', err as Error);
      }
    };

    initTui();

    // Listen for screen changes
    const handleScreenChange = (screen: TuiScreen) => {
      setCurrentScreen(screen);
    };

    tuiManager.on('screen-changed', handleScreenChange);

    // Cleanup on unmount
    return () => {
      tuiManager.off('screen-changed', handleScreenChange);
      tuiManager.shutdown();
    };
  }, [tuiManager, logger]);

  const handleNavigate = (screen: string) => {
    tuiManager.navigateTo(screen as TuiScreen);
  };

  const handleExit = async () => {
    await logger.info('Exiting TUI mode');
    await tuiManager.shutdown();
    onExit();
  };

  // Show error screen if initialization failed
  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="red" paddingX={1} marginBottom={1}>
          <Text bold color="red">TUI Initialization Error</Text>
        </Box>
        <Box borderStyle="single" borderColor="red" padding={1}>
          <Text color="red">{error}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press Ctrl+C to exit</Text>
        </Box>
      </Box>
    );
  }

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
          <Text bold color="cyan">Loading TUI...</Text>
        </Box>
        <Box padding={1}>
          <Text>Initializing Gemini Flow Super Terminal TUI...</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>• Loading configuration...</Text>
        </Box>
        <Box>
          <Text dimColor>• Starting metrics collection...</Text>
        </Box>
        <Box>
          <Text dimColor>• Initializing screens...</Text>
        </Box>
      </Box>
    );
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            tuiManager={tuiManager}
            onNavigate={handleNavigate}
            onExit={handleExit}
          />
        );
      case 'workflow-builder':
        return (
          <WorkflowBuilderScreen
            tuiManager={tuiManager}
            onBack={() => handleNavigate('dashboard')}
          />
        );
      case 'execution-monitor':
        return (
          <ExecutionMonitorScreen
            tuiManager={tuiManager}
            onBack={() => handleNavigate('dashboard')}
          />
        );
      case 'config':
        return (
          <ConfigScreen
            tuiManager={tuiManager}
            onBack={() => handleNavigate('dashboard')}
          />
        );
      case 'help':
        return (
          <HelpScreen
            tuiManager={tuiManager}
            onBack={() => handleNavigate('dashboard')}
          />
        );
      default:
        return (
          <Box padding={1}>
            <Text color="red">Unknown screen: {currentScreen}</Text>
          </Box>
        );
    }
  };

  return <Box flexDirection="column">{renderScreen()}</Box>;
};

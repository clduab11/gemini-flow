#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { CommandRouter } from './command-router.js';
import { OutputPanel } from './components/OutputPanel.js';
import { MetricsPanel } from './components/MetricsPanel.js';
import { CommandInput } from './components/CommandInput.js';
import { getLogger, LogLevel } from './utils/Logger.js';
import { getConfig } from './utils/Config.js';

interface SuperTerminalProps {
  debugMode: boolean;
  safeMode: boolean;
}

const SuperTerminal: React.FC<SuperTerminalProps> = ({ debugMode, safeMode }) => {
  const [output, setOutput] = useState<string[]>([
    'Welcome to Gemini Flow Super Terminal',
    debugMode ? 'Debug Mode: ENABLED' : '',
    safeMode ? 'Safe Mode: ENABLED' : '',
    'Type "help" for available commands'
  ].filter(Boolean));
  const [metrics, setMetrics] = useState({ agentCount: 0, tasksActive: 0 });
  const [isRunning, setIsRunning] = useState(true);
  const [availableAgentIds, setAvailableAgentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [commandRouter] = useState(() => {
    try {
      return new CommandRouter();
    } catch (error) {
      setError(`Fatal: Failed to initialize command router - ${(error as Error).message}`);
      return null;
    }
  });

  // Available commands for autocomplete
  const availableCommands = [
    'help', 'status', 'exit',
    'config', 'config show', 'config set', 'config reset',
    'swarm', 'swarm list', 'swarm spawn', 'swarm terminate', 'swarm status', 'swarm broadcast', 'swarm topology', 'swarm help',
    'google', 'google status', 'google help', 'google veo3', 'google imagen4', 'google chirp', 'google lyria', 'google research', 'google mariner', 'google streaming',
    'google veo3 generate', 'google imagen4 create', 'google chirp tts', 'google lyria compose', 'google mariner automate', 'google streaming start',
  ];

  // Show fatal error if command router failed to initialize
  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="round" borderColor="red" padding={1}>
          <Text bold color="red">Fatal Error</Text>
        </Box>
        <Box padding={1}>
          <Text color="red">{error}</Text>
        </Box>
        <Box padding={1}>
          <Text>Check logs at ~/.gemini-flow/logs/ for details</Text>
        </Box>
      </Box>
    );
  }

  if (!commandRouter) {
    return null;
  }

  const handleCommand = async (command: string) => {
    setOutput(prev => [...prev, `> ${command}`]);

    if (command.toLowerCase() === 'exit') {
      setIsRunning(false);
      setOutput(prev => [...prev, 'Shutting down...']);
      setTimeout(() => process.exit(0), 500);
      return;
    }

    try {
      const result = await commandRouter.route(command);

      // Handle streaming output (e.g., from Google AI commands)
      if (result.streamingOutput && result.streamingOutput.length > 0) {
        setOutput(prev => [...prev, ...result.streamingOutput, '', result.output]);
      } else {
        setOutput(prev => [...prev, result.output]);
      }

      // Update metrics if available
      if (result.metrics) {
        setMetrics(result.metrics);
      }

      // Update available agent IDs if command was swarm-related
      if (command.startsWith('swarm')) {
        updateAgentIds();
      }
    } catch (error: any) {
      setOutput(prev => [...prev, `Error: ${error.message}`]);
    }
  };

  const updateAgentIds = async () => {
    try {
      const result = await commandRouter.route('swarm list');
      // Extract agent IDs from output
      const idMatches = result.output.match(/- ([a-z]+-\d+)/g);
      if (idMatches) {
        const ids = idMatches.map(match => match.substring(2)); // Remove "- " prefix
        setAvailableAgentIds(ids);
      }
    } catch (error) {
      // Silently fail
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="cyan">Gemini Flow Super Terminal v1.0</Text>
      </Box>

      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1} marginRight={1}>
          <OutputPanel output={output} />
        </Box>
        <Box width={30}>
          <MetricsPanel metrics={metrics} />
        </Box>
      </Box>

      {isRunning && (
        <Box marginTop={1}>
          <CommandInput
            onSubmit={handleCommand}
            availableCommands={availableCommands}
            availableAgentIds={availableAgentIds}
          />
        </Box>
      )}
    </Box>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const logger = getLogger();
    logger.error('React component error', error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" padding={1}>
          <Box borderStyle="round" borderColor="red" padding={1}>
            <Text bold color="red">Application Error</Text>
          </Box>
          <Box padding={1}>
            <Text color="red">{this.state.error?.message || 'An unexpected error occurred'}</Text>
          </Box>
          <Box padding={1}>
            <Text>Check logs at ~/.gemini-flow/logs/ for details</Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);
const debugMode = args.includes('--debug') || process.env.SUPER_TERMINAL_DEBUG === 'true';
const safeMode = args.includes('--safe-mode') || process.env.SUPER_TERMINAL_SAFE_MODE === 'true';

// Initialize logger and config
async function initialize() {
  try {
    const logger = getLogger();
    const config = getConfig();

    // Initialize logger
    await logger.initialize();

    // Set debug mode if enabled
    if (debugMode) {
      logger.setDebugMode(true);
      logger.setConsoleOutput(false); // Keep console clean for Ink UI
    }

    // Initialize config
    await config.initialize();

    // Update security settings based on flags
    if (safeMode) {
      await config.set('security', {
        ...config.get('security'),
        safeMode: true,
      });
    }

    await logger.info('Super Terminal starting', {
      debugMode,
      safeMode,
      args,
    });

    // Launch the terminal with error boundary
    render(
      <ErrorBoundary>
        <SuperTerminal debugMode={debugMode} safeMode={safeMode} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Fatal: Failed to initialize Super Terminal');
    console.error(error);
    console.error('Check logs at ~/.gemini-flow/logs/ for details');
    process.exit(1);
  }
}

// Start the application
initialize();

#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { CommandRouter } from './command-router.js';
import { OutputPanel } from './components/OutputPanel.js';
import { MetricsPanel } from './components/MetricsPanel.js';
import { CommandInput } from './components/CommandInput.js';

interface SuperTerminalProps {}

const SuperTerminal: React.FC<SuperTerminalProps> = () => {
  const [output, setOutput] = useState<string[]>(['Welcome to Gemini Flow Super Terminal', 'Type "help" for available commands']);
  const [metrics, setMetrics] = useState({ agentCount: 0, tasksActive: 0 });
  const [isRunning, setIsRunning] = useState(true);

  const commandRouter = new CommandRouter();

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
    } catch (error: any) {
      setOutput(prev => [...prev, `Error: ${error.message}`]);
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
          <CommandInput onSubmit={handleCommand} />
        </Box>
      )}
    </Box>
  );
};

// Launch the terminal
render(<SuperTerminal />);

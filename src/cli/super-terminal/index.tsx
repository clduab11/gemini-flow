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
  const [availableAgentIds, setAvailableAgentIds] = useState<string[]>([]);

  const commandRouter = new CommandRouter();

  // Available commands for autocomplete
  const availableCommands = [
    'help', 'status', 'exit',
    'swarm', 'swarm list', 'swarm spawn', 'swarm terminate', 'swarm status', 'swarm broadcast', 'swarm topology', 'swarm help',
    'google', 'google status', 'google help', 'google veo3', 'google imagen4', 'google chirp', 'google lyria', 'google research', 'google mariner', 'google streaming',
    'google veo3 generate', 'google imagen4 create', 'google chirp tts', 'google lyria compose', 'google mariner automate', 'google streaming start',
  ];

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

// Launch the terminal
render(<SuperTerminal />);

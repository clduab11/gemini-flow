/**
 * Super-Terminal Main Component (ink-based TUI)
 *
 * Interactive terminal interface for gemini-flow with:
 * - Multi-pane layout (input, output, metrics, agent viz)
 * - Real-time streaming output
 * - Agent swarm visualization
 * - Performance metrics dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { CommandInput as CommandInputType, CommandContext, CommandStream } from '../types.js';
import { DefaultCommandRouter } from '../command-router.js';
import { CommandInput } from './CommandInput.js';
import { OutputPanel } from './OutputPanel.js';
import { MetricsPanel } from './MetricsPanel.js';
import { AgentVisualizer } from './AgentVisualizer.js';
import { HelpPanel } from './HelpPanel.js';

export interface TerminalProps {
  router: DefaultCommandRouter;
  context: CommandContext;
}

type View = 'main' | 'help' | 'metrics' | 'agents';

export const Terminal: React.FC<TerminalProps> = ({ router, context }) => {
  const [view, setView] = useState<View>('main');
  const [currentStream, setCurrentStream] = useState<CommandStream | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [outputHistory, setOutputHistory] = useState<Array<{ type: string; data: any }>>([]);
  const [metrics, setMetrics] = useState<any>({
    agentCount: 0,
    messageRate: 0,
    latency: 0,
  });

  const { exit } = useApp();

  // Handle keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }

    if (key.ctrl && input === 'h') {
      setView(view === 'help' ? 'main' : 'help');
    }

    if (key.ctrl && input === 'm') {
      setView(view === 'metrics' ? 'main' : 'metrics');
    }

    if (key.ctrl && input === 'a') {
      setView(view === 'agents' ? 'main' : 'agents');
    }
  });

  // Handle command execution
  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setOutputHistory(prev => [...prev, { type: 'command', data: command }]);

    // Special commands
    if (command === 'exit' || command === 'quit') {
      exit();
      return;
    }

    if (command === 'clear') {
      setOutputHistory([]);
      return;
    }

    if (command === 'help') {
      setView('help');
      return;
    }

    try {
      // Route command
      const input: CommandInputType = {
        raw: command,
        context,
        timestamp: Date.now(),
      };

      const stream = await router.route(input);
      setCurrentStream(stream);

      // Listen to stream events
      stream.on('chunk', (chunk) => {
        setOutputHistory(prev => [...prev, { type: chunk.type, data: chunk.data }]);
      });

      stream.on('progress', (progress) => {
        // Progress updates handled by OutputPanel
      });

      stream.on('complete', (result) => {
        setOutputHistory(prev => [...prev, { type: 'complete', data: result }]);
        setCurrentStream(null);
      });

      stream.on('error', (error) => {
        setOutputHistory(prev => [...prev, { type: 'error', data: error.message }]);
        setCurrentStream(null);
      });
    } catch (error: any) {
      setOutputHistory(prev => [...prev, { type: 'error', data: error.message }]);
    }
  }, [router, context, exit]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: Fetch real metrics from performance monitor
      setMetrics({
        agentCount: Math.floor(Math.random() * 100),
        messageRate: Math.floor(Math.random() * 10000),
        latency: Math.floor(Math.random() * 100),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Render different views
  const renderView = () => {
    switch (view) {
      case 'help':
        return <HelpPanel onClose={() => setView('main')} />;
      case 'metrics':
        return (
          <Box flexDirection="column" width="100%" height="100%">
            <MetricsPanel metrics={metrics} fullScreen />
          </Box>
        );
      case 'agents':
        return (
          <Box flexDirection="column" width="100%" height="100%">
            <AgentVisualizer fullScreen />
          </Box>
        );
      case 'main':
      default:
        return (
          <Box flexDirection="column" width="100%" height="100%">
            {/* Header */}
            <Box borderStyle="double" borderColor="cyan" paddingX={1}>
              <Text bold color="cyan">
                ✨ GEMINI-FLOW SUPER-TERMINAL v1.3.3
              </Text>
              <Box flexGrow={1} />
              <Text dimColor>
                Ctrl+H: Help | Ctrl+M: Metrics | Ctrl+A: Agents | Ctrl+C: Exit
              </Text>
            </Box>

            {/* Main content area */}
            <Box flexGrow={1} flexDirection="row">
              {/* Left: Output panel (60%) */}
              <Box width="60%" flexDirection="column" borderStyle="single" borderColor="gray">
                <OutputPanel
                  outputHistory={outputHistory}
                  currentStream={currentStream}
                />
              </Box>

              {/* Right: Metrics + Agents (40%) */}
              <Box width="40%" flexDirection="column">
                {/* Metrics panel (50%) */}
                <Box height="50%" borderStyle="single" borderColor="gray">
                  <MetricsPanel metrics={metrics} />
                </Box>

                {/* Agent visualizer (50%) */}
                <Box height="50%" borderStyle="single" borderColor="gray">
                  <AgentVisualizer />
                </Box>
              </Box>
            </Box>

            {/* Footer: Command input */}
            <CommandInput
              onSubmit={handleCommand}
              commandHistory={commandHistory}
              currentStream={currentStream}
            />
          </Box>
        );
    }
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {renderView()}
    </Box>
  );
};

/**
 * Gemini-Flow TUI Application
 * Main terminal user interface
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ServiceGrid } from './components/ServiceGrid.js';
import { StatusPanel } from './components/StatusPanel.js';
import { WorkflowPanel } from './components/WorkflowPanel.js';
import { getProtocolManager } from '../core/protocols/index.js';

export interface AppProps {
  debug?: boolean;
}

export const App: React.FC<AppProps> = ({ debug = false }) => {
  const { exit } = useApp();
  const [view, setView] = useState<'services' | 'workflows' | 'status'>('services');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [protocolStats, setProtocolStats] = useState<any>(null);

  // Initialize protocols
  useEffect(() => {
    const protocols = getProtocolManager();

    // Load protocol stats
    const stats = protocols.getStats();
    setProtocolStats(stats);

    // Cleanup on unmount
    return () => {
      if (!debug) {
        protocols.cleanup();
      }
    };
  }, []);

  // Handle keyboard input
  useInput((input, key) => {
    // Quit
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
      return;
    }

    // Switch views
    if (input === '1') setView('services');
    if (input === '2') setView('workflows');
    if (input === '3') setView('status');

    // Navigate services
    if (key.upArrow || input === 'k') {
      // Handle up navigation
    }
    if (key.downArrow || input === 'j') {
      // Handle down navigation
    }

    // Select service
    if (key.return) {
      // Handle selection
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">
            🚀 Gemini-Flow v1.0.0 - Quantum-Ready AI Orchestration
          </Text>
          <Text dimColor>
            A2A • AP2 • MCP | {protocolStats?.mcp.running || 0}/{protocolStats?.mcp.servers || 0} MCP Servers Running
          </Text>
        </Box>
      </Box>

      {/* Navigation */}
      <Box marginBottom={1}>
        <Text>
          <Text bold={view === 'services'} color={view === 'services' ? 'green' : undefined}>
            [1] Services
          </Text>
          {' • '}
          <Text bold={view === 'workflows'} color={view === 'workflows' ? 'green' : undefined}>
            [2] Workflows
          </Text>
          {' • '}
          <Text bold={view === 'status'} color={view === 'status' ? 'green' : undefined}>
            [3] Status
          </Text>
          {' • '}
          <Text dimColor>[Q] Quit</Text>
        </Text>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1}>
        {view === 'services' && (
          <ServiceGrid
            onSelect={setSelectedService}
            selected={selectedService}
          />
        )}
        {view === 'workflows' && (
          <WorkflowPanel />
        )}
        {view === 'status' && (
          <StatusPanel stats={protocolStats} />
        )}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray" marginTop={1} padding={1}>
        <Text dimColor>
          ↑↓/jk: Navigate • Enter: Select • 1-3: Switch View • Q: Quit
        </Text>
      </Box>
    </Box>
  );
};

export default App;

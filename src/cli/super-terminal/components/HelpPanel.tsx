/**
 * Help Panel Component
 *
 * Displays help documentation for the super-terminal:
 * - Available commands
 * - Keyboard shortcuts
 * - Quick start guide
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface HelpPanelProps {
  onClose?: () => void;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Title */}
      <Box marginBottom={1} borderStyle="double" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          📚 GEMINI-FLOW SUPER-TERMINAL HELP
        </Text>
      </Box>

      {/* Keyboard Shortcuts */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">⌨️  Keyboard Shortcuts:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>• <Text bold>Ctrl+C</Text> - Exit terminal</Text>
          <Text>• <Text bold>Ctrl+H</Text> - Toggle help panel</Text>
          <Text>• <Text bold>Ctrl+M</Text> - Toggle full metrics view</Text>
          <Text>• <Text bold>Ctrl+A</Text> - Toggle agent swarm view</Text>
          <Text>• <Text bold>↑/↓</Text> - Navigate command history</Text>
          <Text>• <Text bold>Ctrl+U</Text> - Clear current line</Text>
          <Text>• <Text bold>Ctrl+A/E</Text> - Jump to line start/end</Text>
        </Box>
      </Box>

      {/* Google AI Commands */}
      <Box marginTop={2} flexDirection="column">
        <Text bold color="green">🤖 Google AI Services:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>• <Text color="cyan">google-ai generate-video "prompt"</Text> - Veo3 video generation</Text>
          <Text>• <Text color="cyan">google-ai generate-image "prompt"</Text> - Imagen4 image synthesis</Text>
          <Text>• <Text color="cyan">google-ai compose-audio "prompt"</Text> - Lyria audio composition</Text>
          <Text>• <Text color="cyan">google-ai speech-to-text file.mp3</Text> - Chirp transcription</Text>
          <Text>• <Text color="cyan">google-ai research "query"</Text> - Co-Scientist research</Text>
        </Box>
      </Box>

      {/* Swarm Commands */}
      <Box marginTop={2} flexDirection="column">
        <Text bold color="magenta">🐝 Swarm Orchestration:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>• <Text color="cyan">swarm spawn &lt;type&gt;</Text> - Spawn new agent</Text>
          <Text>• <Text color="cyan">swarm list</Text> - List all active agents</Text>
          <Text>• <Text color="cyan">swarm status &lt;agent-id&gt;</Text> - Get agent status</Text>
          <Text>• <Text color="cyan">swarm terminate &lt;agent-id&gt;</Text> - Terminate agent</Text>
          <Text>• <Text color="cyan">swarm send &lt;agent-id&gt; "message"</Text> - Send message to agent</Text>
        </Box>
      </Box>

      {/* Quantum Commands */}
      <Box marginTop={2} flexDirection="column">
        <Text bold color="blue">⚛️  Quantum Computing:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>• <Text color="cyan">quantum circuit --qasm "..."</Text> - Execute quantum circuit</Text>
          <Text>• <Text color="cyan">quantum simulate --qubits N</Text> - Simulate quantum system</Text>
          <Text>• <Text color="cyan">quantum ml --model "..."</Text> - Quantum ML operations</Text>
        </Box>
      </Box>

      {/* System Commands */}
      <Box marginTop={2} flexDirection="column">
        <Text bold color="white">⚙️  System Commands:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>• <Text color="cyan">help</Text> - Show this help panel</Text>
          <Text>• <Text color="cyan">clear</Text> - Clear output history</Text>
          <Text>• <Text color="cyan">exit</Text> or <Text color="cyan">quit</Text> - Exit terminal</Text>
        </Box>
      </Box>

      {/* Performance Targets */}
      <Box marginTop={2} flexDirection="column">
        <Text bold color="yellow">🎯 Performance Targets:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text dimColor>• Agent spawn latency: &lt;100ms</Text>
          <Text dimColor>• Message routing: &lt;75ms (targeting &lt;25ms)</Text>
          <Text dimColor>• Concurrent tasks: 10,000</Text>
          <Text dimColor>• Message throughput: 50,000 msgs/sec</Text>
          <Text dimColor>• Production SLA: 99.99% uptime</Text>
        </Box>
      </Box>

      {/* Quick Start */}
      <Box marginTop={2} flexDirection="column">
        <Text bold color="cyan">🚀 Quick Start:</Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>1. List available agents: <Text color="cyan">swarm list</Text></Text>
          <Text>2. Spawn an agent: <Text color="cyan">swarm spawn coder</Text></Text>
          <Text>3. Generate an image: <Text color="cyan">google-ai generate-image "sunset"</Text></Text>
          <Text>4. View metrics: <Text color="cyan">Ctrl+M</Text></Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>Press Ctrl+H to close this help panel</Text>
      </Box>
    </Box>
  );
};

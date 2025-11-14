/**
 * Service Selection Grid
 * Displays available Google AI and quantum services
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface Service {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'playwright' | 'quantum';
  status: 'available' | 'ultra-only' | 'coming-soon';
  icon: string;
}

export interface ServiceGridProps {
  onSelect: (serviceId: string) => void;
  selected: string | null;
}

const SERVICES: Service[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast multimodal AI model',
    type: 'api',
    status: 'available',
    icon: '⚡'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Advanced AI model',
    type: 'api',
    status: 'available',
    icon: '🧠'
  },
  {
    id: 'gemini-ultra',
    name: 'Gemini Ultra',
    description: 'Most capable AI model',
    type: 'api',
    status: 'ultra-only',
    icon: '🌟'
  },
  {
    id: 'ai-studio-ultra',
    name: 'AI Studio Ultra',
    description: 'Advanced AI Studio features',
    type: 'playwright',
    status: 'ultra-only',
    icon: '🎨'
  },
  {
    id: 'labs-flow',
    name: 'Google Labs Flow',
    description: 'Workflow automation',
    type: 'playwright',
    status: 'available',
    icon: '🌊'
  },
  {
    id: 'labs-whisk',
    name: 'Google Labs Whisk',
    description: 'Creative image tool',
    type: 'playwright',
    status: 'available',
    icon: '🎭'
  },
  {
    id: 'quantum-pennylane',
    name: 'PennyLane',
    description: 'Quantum ML optimization',
    type: 'quantum',
    status: 'coming-soon',
    icon: '🔬'
  },
  {
    id: 'quantum-qiskit',
    name: 'Qiskit',
    description: 'Quantum circuit optimization',
    type: 'quantum',
    status: 'coming-soon',
    icon: '⚛️'
  }
];

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onSelect, selected }) => {
  const getStatusColor = (status: Service['status']) => {
    switch (status) {
      case 'available':
        return 'green';
      case 'ultra-only':
        return 'yellow';
      case 'coming-soon':
        return 'gray';
    }
  };

  const getTypeColor = (type: Service['type']) => {
    switch (type) {
      case 'api':
        return 'cyan';
      case 'playwright':
        return 'magenta';
      case 'quantum':
        return 'blue';
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">Available Services</Text>
      </Box>

      <Box flexDirection="row" flexWrap="wrap">
        {SERVICES.map((service) => (
          <Box
            key={service.id}
            borderStyle="round"
            borderColor={selected === service.id ? 'green' : 'gray'}
            padding={1}
            marginRight={1}
            marginBottom={1}
            width={30}
          >
            <Box flexDirection="column">
              <Text bold>
                {service.icon} {service.name}
              </Text>
              <Text dimColor fontSize={10}>
                {service.description}
              </Text>
              <Box marginTop={1}>
                <Text color={getTypeColor(service.type)}>
                  {service.type.toUpperCase()}
                </Text>
                <Text> • </Text>
                <Text color={getStatusColor(service.status)}>
                  {service.status === 'ultra-only' ? 'Ultra' :
                   service.status === 'coming-soon' ? 'Soon' :
                   '✓'}
                </Text>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box marginTop={1} borderStyle="single" padding={1}>
        <Box flexDirection="column">
          <Text bold>Legend:</Text>
          <Text>
            <Text color="cyan">API</Text>
            {' = Direct API access  '}
            <Text color="magenta">PLAYWRIGHT</Text>
            {' = Browser automation  '}
            <Text color="blue">QUANTUM</Text>
            {' = Quantum computing'}
          </Text>
          <Text>
            <Text color="green">✓</Text>
            {' = Available  '}
            <Text color="yellow">Ultra</Text>
            {' = Requires Ultra membership  '}
            <Text color="gray">Soon</Text>
            {' = Coming soon'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

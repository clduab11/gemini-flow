/**
 * Metrics Panel Component
 *
 * Real-time performance metrics dashboard displaying:
 * - Active agent count
 * - Message throughput
 * - Average latency
 * - CPU/memory usage
 * - SLA compliance
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface MetricsPanelProps {
  metrics: {
    agentCount?: number;
    messageRate?: number;
    latency?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    slaCompliance?: number;
  };
  fullScreen?: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, fullScreen = false }) => {
  // Format number with units
  const formatNumber = (value: number, unit: string) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit}`;
    }
    return `${value.toFixed(0)}${unit}`;
  };

  // Get color based on threshold
  const getColor = (value: number, thresholds: { good: number; warn: number }) => {
    if (value <= thresholds.good) return 'green';
    if (value <= thresholds.warn) return 'yellow';
    return 'red';
  };

  // Render metric row
  const renderMetric = (label: string, value: any, color?: string) => (
    <Box marginBottom={fullScreen ? 1 : 0}>
      <Text dimColor>{label}: </Text>
      <Text color={color || 'white'} bold>
        {value}
      </Text>
    </Box>
  );

  // Render horizontal bar chart
  const renderBar = (value: number, max: number, label: string) => {
    const percentage = Math.min(100, (value / max) * 100);
    const barWidth = fullScreen ? 40 : 20;
    const filledWidth = Math.floor((percentage / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;

    const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
    const color = percentage > 80 ? 'red' : percentage > 60 ? 'yellow' : 'green';

    return (
      <Box marginBottom={fullScreen ? 1 : 0}>
        <Text dimColor>{label}: </Text>
        <Text color={color}>{bar}</Text>
        <Text> {percentage.toFixed(0)}%</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={fullScreen ? 1 : 0}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color="white">
          {fullScreen ? '📊 Performance Metrics' : 'Metrics'}
        </Text>
      </Box>

      {/* Core metrics */}
      <Box flexDirection="column">
        {renderMetric(
          'Agents',
          metrics.agentCount ?? 0,
          metrics.agentCount && metrics.agentCount > 50 ? 'green' : 'yellow'
        )}

        {renderMetric(
          'Messages/sec',
          formatNumber(metrics.messageRate ?? 0, ''),
          metrics.messageRate && metrics.messageRate > 10000 ? 'green' : 'yellow'
        )}

        {renderMetric(
          'Latency',
          `${metrics.latency ?? 0}ms`,
          getColor(metrics.latency ?? 0, { good: 25, warn: 75 })
        )}

        {fullScreen && (
          <>
            {/* CPU and Memory bars */}
            {renderBar(metrics.cpuUsage ?? 0, 100, 'CPU Usage')}
            {renderBar(metrics.memoryUsage ?? 0, 100, 'Memory Usage')}

            {/* SLA Compliance */}
            <Box marginTop={1} borderStyle="round" borderColor="cyan" paddingX={1}>
              <Text bold>SLA Compliance: </Text>
              <Text
                color={
                  (metrics.slaCompliance ?? 0) >= 99.99
                    ? 'green'
                    : (metrics.slaCompliance ?? 0) >= 99.9
                    ? 'yellow'
                    : 'red'
                }
              >
                {(metrics.slaCompliance ?? 99.99).toFixed(2)}%
              </Text>
            </Box>

            {/* Performance targets */}
            <Box marginTop={1} flexDirection="column">
              <Text bold color="cyan">Performance Targets:</Text>
              <Text dimColor>• Agent spawn: &lt;100ms</Text>
              <Text dimColor>• Message routing: &lt;75ms</Text>
              <Text dimColor>• Concurrent tasks: 10,000</Text>
              <Text dimColor>• Message throughput: 50K/sec</Text>
              <Text dimColor>• SLA uptime: 99.99%</Text>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

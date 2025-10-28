import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { ASCIICharts } from '../utils/ASCIICharts.js';

interface MetricsPanelProps {
  metrics: {
    agentCount: number;
    tasksActive: number;
    performance?: any;
    a2aMetrics?: {
      messagesProcessed: number;
      avgResponseTime: number;
      throughput: number;
      latencyHistory?: number[];
    };
    agentHealth?: {
      active: number;
      idle: number;
      error: number;
      stale: number;
    };
    memoryUsage?: {
      total: number;
      perAgent: number;
    };
  };
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [throughputHistory, setThroughputHistory] = useState<number[]>([]);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Update latency and throughput history
  useEffect(() => {
    const a2a = metrics.a2aMetrics;
    if (a2a) {
      // Add current latency to history (max 20 points)
      setLatencyHistory(prev => {
        const newHistory = [...prev, a2a.avgResponseTime || 0];
        return newHistory.slice(-20);
      });

      // Add current throughput to history (max 20 points)
      setThroughputHistory(prev => {
        const newHistory = [...prev, a2a.throughput || 0];
        return newHistory.slice(-20);
      });
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [metrics.a2aMetrics?.avgResponseTime, metrics.a2aMetrics?.throughput]);

  const spawnTime = metrics.performance?.['agent.spawn.time'];
  const avgSpawnTime = spawnTime ? Math.round(spawnTime.average) : 0;

  const a2a = metrics.a2aMetrics || {
    messagesProcessed: 0,
    avgResponseTime: 0,
    throughput: 0,
  };

  const health = metrics.agentHealth || {
    active: metrics.agentCount,
    idle: 0,
    error: 0,
    stale: 0,
  };

  const memory = metrics.memoryUsage || {
    total: 0,
    perAgent: 0,
  };

  // Calculate health percentage
  const totalAgents = health.active + health.idle + health.error + health.stale;
  const healthScore = totalAgents > 0 ? (health.active / totalAgents) * 100 : 100;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1} width={35}>
      <Text bold color="yellow">System Metrics</Text>

      {/* Agent Status */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold dimColor>Agents</Text>
        <Text>
          Count: <Text color="cyan">{metrics.agentCount}</Text>
        </Text>
        <Text>
          Tasks: <Text color="cyan">{metrics.tasksActive}</Text>
        </Text>
        {avgSpawnTime > 0 && (
          <Text>
            Spawn: <Text color="cyan">{avgSpawnTime}ms</Text>
          </Text>
        )}
      </Box>

      {/* Agent Health */}
      {totalAgents > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold dimColor>Health</Text>
          <Text>{ASCIICharts.healthBar(healthScore, { width: 12 })}</Text>
          <Text dimColor>
            {ASCIICharts.statusIndicator('active')}: {health.active}
          </Text>
          {health.idle > 0 && (
            <Text dimColor>
              {ASCIICharts.statusIndicator('idle')}: {health.idle}
            </Text>
          )}
          {health.error > 0 && (
            <Text dimColor>
              {ASCIICharts.statusIndicator('error')}: {health.error}
            </Text>
          )}
          {health.stale > 0 && (
            <Text dimColor>
              {ASCIICharts.statusIndicator('stale')}: {health.stale}
            </Text>
          )}
        </Box>
      )}

      {/* A2A Protocol Metrics */}
      {a2a.messagesProcessed > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold dimColor>A2A Protocol</Text>
          <Text dimColor>
            Messages: {a2a.messagesProcessed}
          </Text>
          <Text dimColor>
            Latency: {a2a.avgResponseTime.toFixed(1)}ms
          </Text>
          {latencyHistory.length > 1 && (
            <Text dimColor>
              {ASCIICharts.sparkline(latencyHistory, { width: 25 })}
            </Text>
          )}
          <Text dimColor>
            Throughput: {a2a.throughput.toFixed(1)}/s
          </Text>
          {throughputHistory.length > 1 && (
            <Text dimColor>
              {ASCIICharts.sparkline(throughputHistory, { width: 25 })}
            </Text>
          )}
        </Box>
      )}

      {/* Memory Usage */}
      {memory.total > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold dimColor>Memory</Text>
          <Text dimColor>
            {ASCIICharts.barChart(memory.total, 1024, {
              maxWidth: 12,
              showValue: true,
            })} MB
          </Text>
          {metrics.agentCount > 0 && (
            <Text dimColor>
              Per Agent: {memory.perAgent.toFixed(1)}MB
            </Text>
          )}
        </Box>
      )}

      {/* System Status */}
      <Box marginTop={1}>
        <Text>
          Status: <Text color="green">● Online</Text>
        </Text>
      </Box>
    </Box>
  );
};

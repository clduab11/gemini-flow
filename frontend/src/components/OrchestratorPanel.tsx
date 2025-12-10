/**
 * Control panel for THE_ORCHESTRATOR integration
 * Provides UI for running flows with different orchestration patterns
 */

import React, { useState } from 'react';
import { useFlowStore } from '../lib/store';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface OrchestratorPanelProps {
  className?: string;
}

const ORCHESTRATION_PATTERNS = {
  hierarchical: {
    name: 'Hierarchical',
    icon: '👑',
    description: 'Strict control with quality gates',
    color: '#FFD700'
  },
  evolutionary: {
    name: 'Evolutionary',
    icon: '🧬',
    description: 'Genetic algorithms for agent evolution',
    color: '#FF1493'
  },
  swarm: {
    name: 'Swarm',
    icon: '🐝',
    description: 'Collective intelligence',
    color: '#FFA500'
  },
  temporal: {
    name: 'Temporal',
    icon: '🔮',
    description: 'Predictive analysis',
    color: '#9400D3'
  },
  unified: {
    name: 'Unified',
    icon: '✨',
    description: 'Synthesis of all patterns',
    color: '#FF69B4'
  }
};

export function OrchestratorPanel({ className }: OrchestratorPanelProps) {
  const { nodes, edges } = useFlowStore();
  const [selectedPattern, setSelectedPattern] = useState('hierarchical');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const executeWithOrchestrator = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/orchestrator/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
          config: {
            pattern: selectedPattern,
            includePlan: true
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Orchestration failed');
      }

      const result = await response.json();
      setExecutionResult(result);

    } catch (error: any) {
      setExecutionError(error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const validateFlow = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orchestrator/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });

      const validation = await response.json();
      return validation;
    } catch (error) {
      console.error('Validation failed:', error);
      return { valid: false, error: 'Validation request failed' };
    }
  };

  const hasOrchestratorNodes = nodes.some(node =>
    ['sovereign', 'architect', 'specialist', 'worker', 'synthesizer', 'genesis', 'hivemind', 'oracle'].includes(node.type)
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎭</span>
          THE_ORCHESTRATOR
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="execute">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="execute" className="space-y-4">
            {/* Pattern Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Orchestration Pattern</label>
              <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORCHESTRATION_PATTERNS).map(([key, pattern]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{pattern.icon}</span>
                        <span>{pattern.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {ORCHESTRATION_PATTERNS[selectedPattern as keyof typeof ORCHESTRATION_PATTERNS].description}
              </p>
            </div>

            {/* Execute Button */}
            <Button
              onClick={executeWithOrchestrator}
              disabled={isExecuting || nodes.length === 0}
              className="w-full"
              style={{
                backgroundColor: hasOrchestratorNodes
                  ? ORCHESTRATION_PATTERNS[selectedPattern as keyof typeof ORCHESTRATION_PATTERNS].color
                  : undefined
              }}
            >
              {isExecuting ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Orchestrating...
                </>
              ) : (
                <>
                  {ORCHESTRATION_PATTERNS[selectedPattern as keyof typeof ORCHESTRATION_PATTERNS].icon}
                  <span className="ml-2">Run with {ORCHESTRATION_PATTERNS[selectedPattern as keyof typeof ORCHESTRATION_PATTERNS].name}</span>
                </>
              )}
            </Button>

            {/* Flow Status */}
            {hasOrchestratorNodes ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✅ Flow contains ORCHESTRATOR nodes
                </p>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Add ORCHESTRATOR nodes for full capabilities
                </p>
              </div>
            )}

            {/* Execution Result */}
            {executionResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded space-y-2">
                <h4 className="font-medium text-blue-900">Orchestration Complete</h4>
                {executionResult.metadata && (
                  <div className="space-y-1 text-sm">
                    <p>Pattern: {executionResult.metadata.pattern}</p>
                    <p>Agents Deployed: {executionResult.metadata.agentsDeployed}</p>
                    <p>Tasks Executed: {executionResult.metadata.tasksExecuted}</p>
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-700">View Full Result</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-white rounded">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Execution Error */}
            {executionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h4 className="font-medium text-red-900">Orchestration Failed</h4>
                <p className="text-sm text-red-700 mt-1">{executionError}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-3">
            {Object.entries(ORCHESTRATION_PATTERNS).map(([key, pattern]) => (
              <div
                key={key}
                className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedPattern(key)}
                style={{
                  borderColor: selectedPattern === key ? pattern.color : undefined,
                  borderWidth: selectedPattern === key ? '2px' : '1px'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{pattern.icon}</span>
                  <strong>{pattern.name}</strong>
                  {selectedPattern === key && (
                    <Badge variant="secondary" className="ml-auto">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{pattern.description}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default OrchestratorPanel;
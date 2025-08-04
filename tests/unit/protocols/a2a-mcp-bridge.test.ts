/**
 * A2A MCP Bridge Tests
 * 
 * Comprehensive test suite for A2AMCPBridge with MCP↔A2A translation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  A2AMessage,
  A2AResponse,
  MCPToA2AMapping,
  ParameterMapping,
  ResponseMapping,
  TransformFunction
} from '../../../src/types/a2a.js';
import {
  MCPRequest,
  MCPResponse,
  MCPTool
} from '../../../src/types/mcp.js';

// Mock implementation will be created later
class A2AMCPBridge {
  constructor() {}
  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
  async translateMCPToA2A(mcpRequest: MCPRequest): Promise<A2AMessage> { return {} as A2AMessage; }
  async translateA2AToMCP(a2aMessage: A2AMessage): Promise<MCPRequest> { return {} as MCPRequest; }
  async translateMCPResponseToA2A(mcpResponse: MCPResponse): Promise<A2AResponse> { return {} as A2AResponse; }
  async translateA2AResponseToMCP(a2aResponse: A2AResponse): Promise<MCPResponse> { return {} as MCPResponse; }
  registerMapping(mapping: MCPToA2AMapping): void {}
  unregisterMapping(mcpMethod: string): void {}
  getMappings(): Map<string, MCPToA2AMapping> { return new Map(); }
  getBridgeMetrics(): any { return {}; }
}

describe('A2AMCPBridge', () => {
  let mcpBridge: A2AMCPBridge;
  let mockMCPRequest: MCPRequest;
  let mockA2AMessage: A2AMessage;
  let mockMappings: MCPToA2AMapping[];

  beforeEach(async () => {
    mcpBridge = new A2AMCPBridge();

    // Create mock MCP request
    mockMCPRequest = {
      id: 'mcp-req-001',
      prompt: 'Process this data using advanced analysis capabilities',
      tools: [
        {
          name: 'mcp__claude-flow__neural_status',
          description: 'Get neural network status',
          parameters: {
            type: 'object',
            properties: {
              modelId: { type: 'string' }
            },
            required: ['modelId']
          }
        },
        {
          name: 'mcp__claude-flow__task_orchestrate',
          description: 'Orchestrate complex tasks',
          parameters: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              priority: { type: 'string' },
              strategy: { type: 'string' }
            },
            required: ['task']
          }
        }
      ],
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 4096,
      history: [
        { role: 'user', content: 'Initialize the analysis system' },
        { role: 'assistant', content: 'System initialized successfully' }
      ],
      cacheTTL: 3600
    };

    // Create mock A2A message
    mockA2AMessage = {
      jsonrpc: '2.0',
      method: 'neural.status',
      params: {
        modelId: 'gemini-2.5-flash',
        includeMetrics: true
      },
      id: 'a2a-001',
      from: 'mcp-bridge-agent',
      to: 'neural-agent-001',
      timestamp: Date.now(),
      messageType: 'request',
      priority: 'normal'
    };

    // Create mock mappings
    mockMappings = [
      {
        mcpMethod: 'mcp__claude-flow__neural_status',
        a2aMethod: 'neural.status',
        parameterMapping: [
          {
            mcpParam: 'modelId',
            a2aParam: 'modelId'
          }
        ],
        responseMapping: [
          {
            mcpField: 'status',
            a2aField: 'result.status'
          },
          {
            mcpField: 'metrics',
            a2aField: 'result.metrics'
          }
        ]
      },
      {
        mcpMethod: 'mcp__claude-flow__task_orchestrate',
        a2aMethod: 'task.orchestrate',
        parameterMapping: [
          {
            mcpParam: 'task',
            a2aParam: 'taskDescription'
          },
          {
            mcpParam: 'priority',
            a2aParam: 'priority',
            transform: (value: string) => value.toLowerCase()
          },
          {
            mcpParam: 'strategy',
            a2aParam: 'executionStrategy',
            transform: (value: string) => {
              const strategyMap: { [key: string]: string } = {
                'parallel': 'concurrent',
                'sequential': 'ordered',
                'adaptive': 'dynamic'
              };
              return strategyMap[value] || value;
            }
          }
        ],
        responseMapping: [
          {
            mcpField: 'taskId',
            a2aField: 'result.taskId'
          },
          {
            mcpField: 'status',
            a2aField: 'result.status'
          },
          {
            mcpField: 'agents',
            a2aField: 'result.assignedAgents',
            transform: (agents: any[]) => agents.map(a => a.id)
          }
        ]
      },
      {
        mcpMethod: 'mcp__ruv-swarm__swarm_init',
        a2aMethod: 'swarm.initialize',
        parameterMapping: [
          {
            mcpParam: 'topology',
            a2aParam: 'networkTopology'
          },
          {
            mcpParam: 'maxAgents',
            a2aParam: 'maxAgentCount'
          },
          {
            mcpParam: 'strategy',
            a2aParam: 'distributionStrategy'
          }
        ],
        responseMapping: [
          {
            mcpField: 'swarmId',
            a2aField: 'result.swarmId'
          },
          {
            mcpField: 'agents',
            a2aField: 'result.initialAgents'
          }
        ]
      }
    ];

    await mcpBridge.initialize();

    // Register all mock mappings
    mockMappings.forEach(mapping => {
      mcpBridge.registerMapping(mapping);
    });
  });

  afterEach(async () => {
    await mcpBridge.shutdown();
    jest.clearAllMocks();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize bridge successfully', async () => {
      await expect(mcpBridge.initialize()).resolves.not.toThrow();
    });

    it('should register method mappings', () => {
      const testMapping: MCPToA2AMapping = {
        mcpMethod: 'test.method',
        a2aMethod: 'test.a2a.method',
        parameterMapping: [],
        responseMapping: []
      };

      expect(() => mcpBridge.registerMapping(testMapping)).not.toThrow();
      
      const mappings = mcpBridge.getMappings();
      expect(mappings.has('test.method')).toBe(true);
    });

    it('should unregister method mappings', () => {
      mcpBridge.unregisterMapping('mcp__claude-flow__neural_status');
      
      const mappings = mcpBridge.getMappings();
      expect(mappings.has('mcp__claude-flow__neural_status')).toBe(false);
    });

    it('should handle duplicate mapping registration', () => {
      const duplicateMapping = { ...mockMappings[0] };
      
      expect(() => mcpBridge.registerMapping(duplicateMapping))
        .toThrow('Mapping already exists for method: mcp__claude-flow__neural_status');
    });
  });

  describe('MCP to A2A Translation', () => {
    it('should translate simple MCP request to A2A message', async () => {
      const simpleMcpRequest: MCPRequest = {
        id: 'simple-001',
        prompt: 'Get neural network status',
        tools: [
          {
            name: 'mcp__claude-flow__neural_status',
            description: 'Get neural status',
            parameters: {
              type: 'object',
              properties: {
                modelId: { type: 'string' }
              }
            }
          }
        ]
      };

      const a2aMessage = await mcpBridge.translateMCPToA2A(simpleMcpRequest);
      
      expect(a2aMessage.jsonrpc).toBe('2.0');
      expect(a2aMessage.method).toBe('neural.status');
      expect(a2aMessage.id).toBe('simple-001');
      expect(a2aMessage.messageType).toBe('request');
    });

    it('should translate MCP request with parameter transformation', async () => {
      const mcpWithTransform: MCPRequest = {
        id: 'transform-001',
        prompt: 'Orchestrate a task with custom strategy',
        tools: [
          {
            name: 'mcp__claude-flow__task_orchestrate',
            description: 'Orchestrate tasks',
            parameters: {
              type: 'object',
              properties: {
                task: { type: 'string' },
                strategy: { type: 'string' }
              }
            }
          }
        ]
      };

      // Mock tool parameters
      (mcpWithTransform as any).toolParams = {
        task: 'Process dataset',
        strategy: 'parallel'
      };

      const a2aMessage = await mcpBridge.translateMCPToA2A(mcpWithTransform);
      
      expect(a2aMessage.method).toBe('task.orchestrate');
      expect(a2aMessage.params).toHaveProperty('taskDescription', 'Process dataset');
      expect(a2aMessage.params).toHaveProperty('executionStrategy', 'concurrent'); // Transformed from 'parallel'
    });

    it('should handle MCP request with multiple tools', async () => {
      const multiToolRequest = { ...mockMCPRequest };
      
      const a2aMessage = await mcpBridge.translateMCPToA2A(multiToolRequest);
      
      expect(a2aMessage.jsonrpc).toBe('2.0');
      expect(a2aMessage.id).toBe('mcp-req-001');
      // Should pick the first available mapped tool
      expect(['neural.status', 'task.orchestrate']).toContain(a2aMessage.method);
    });

    it('should preserve MCP context in A2A message', async () => {
      const contextMcpRequest: MCPRequest = {
        ...mockMCPRequest,
        temperature: 0.8,
        maxTokens: 2048,
        cacheTTL: 1800
      };

      const a2aMessage = await mcpBridge.translateMCPToA2A(contextMcpRequest);
      
      expect(a2aMessage.context).toBeDefined();
      expect(a2aMessage.context?.timeout).toBeDefined();
      // MCP cache TTL should be preserved in A2A context
    });

    it('should handle MCP request without mapped tools', async () => {
      const unmappedRequest: MCPRequest = {
        id: 'unmapped-001',
        prompt: 'Use an unmapped tool',
        tools: [
          {
            name: 'unknown__tool__method',
            description: 'Unknown tool'
          }
        ]
      };

      await expect(mcpBridge.translateMCPToA2A(unmappedRequest))
        .rejects.toThrow('No A2A mapping found for MCP method: unknown__tool__method');
    });
  });

  describe('A2A to MCP Translation', () => {
    it('should translate A2A message to MCP request', async () => {
      const a2aMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'neural.status',
        params: { modelId: 'test-model' },
        id: 'a2a-to-mcp-001',
        from: 'test-agent',
        to: 'neural-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const mcpRequest = await mcpBridge.translateA2AToMCP(a2aMessage);
      
      expect(mcpRequest.id).toBe('a2a-to-mcp-001');
      expect(mcpRequest.tools).toBeDefined();
      expect(mcpRequest.tools?.[0].name).toBe('mcp__claude-flow__neural_status');
    });

    it('should handle reverse parameter transformation', async () => {
      const orchestrateMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'task.orchestrate',
        params: {
          taskDescription: 'Analyze data',
          executionStrategy: 'concurrent', // Should transform back to 'parallel'
          priority: 'HIGH' // Should transform to lowercase
        },
        id: 'reverse-001',
        from: 'coordinator',
        to: 'task-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const mcpRequest = await mcpBridge.translateA2AToMCP(orchestrateMessage);
      
      expect(mcpRequest.tools?.[0].name).toBe('mcp__claude-flow__task_orchestrate');
      // Parameters should be reverse-transformed
      const toolParams = (mcpRequest as any).toolParams;
      expect(toolParams.task).toBe('Analyze data');
      expect(toolParams.strategy).toBe('parallel'); // Reverse-transformed from 'concurrent'
      expect(toolParams.priority).toBe('high'); // Lowercased
    });

    it('should handle A2A message without reverse mapping', async () => {
      const unmappedA2AMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'unknown.method',
        params: {},
        id: 'unmapped-a2a-001',
        from: 'test-agent',
        to: 'target-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(mcpBridge.translateA2AToMCP(unmappedA2AMessage))
        .rejects.toThrow('No MCP mapping found for A2A method: unknown.method');
    });
  });

  describe('Response Translation', () => {
    it('should translate MCP response to A2A response', async () => {
      const mcpResponse: MCPResponse = {
        id: 'resp-001',
        model: 'gemini-2.5-flash',
        content: 'Neural network status retrieved successfully',
        functionCalls: [
          {
            name: 'mcp__claude-flow__neural_status',
            arguments: {
              status: 'active',
              metrics: {
                accuracy: 0.95,
                latency: 45
              }
            }
          }
        ],
        usage: {
          promptTokens: 150,
          completionTokens: 75,
          totalTokens: 225
        },
        metadata: {
          finishReason: 'stop',
          cached: false
        }
      };

      const a2aResponse = await mcpBridge.translateMCPResponseToA2A(mcpResponse);
      
      expect(a2aResponse.jsonrpc).toBe('2.0');
      expect(a2aResponse.id).toBe('resp-001');
      expect(a2aResponse.result).toBeDefined();
      expect(a2aResponse.result.status).toBe('active');
      expect(a2aResponse.result.metrics).toEqual({
        accuracy: 0.95,
        latency: 45
      });
    });

    it('should translate A2A response to MCP response', async () => {
      const a2aResponse: A2AResponse = {
        jsonrpc: '2.0',
        result: {
          taskId: 'task-12345',
          status: 'initiated',
          assignedAgents: ['agent-001', 'agent-002']
        },
        id: 'a2a-resp-001',
        from: 'task-coordinator',
        to: 'requester-agent',
        timestamp: Date.now(),
        messageType: 'response'
      };

      const mcpResponse = await mcpBridge.translateA2AResponseToMCP(a2aResponse);
      
      expect(mcpResponse.id).toBe('a2a-resp-001');
      expect(mcpResponse.functionCalls).toBeDefined();
      expect(mcpResponse.functionCalls?.[0].arguments.taskId).toBe('task-12345');
      expect(mcpResponse.functionCalls?.[0].arguments.agents).toEqual([
        { id: 'agent-001' },
        { id: 'agent-002' }
      ]); // Reverse-transformed from agent IDs
    });

    it('should handle response transformation errors', async () => {
      const invalidMcpResponse: MCPResponse = {
        id: 'invalid-001',
        model: 'test-model',
        content: 'Error occurred',
        functionCalls: [
          {
            name: 'unmapped__function',
            arguments: {}
          }
        ],
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        metadata: {
          cached: false
        }
      };

      await expect(mcpBridge.translateMCPResponseToA2A(invalidMcpResponse))
        .rejects.toThrow('No mapping found for function: unmapped__function');
    });
  });

  describe('Advanced Parameter Transformations', () => {
    it('should handle complex nested parameter transformations', async () => {
      const complexMapping: MCPToA2AMapping = {
        mcpMethod: 'mcp__complex__transform',
        a2aMethod: 'complex.transform',
        parameterMapping: [
          {
            mcpParam: 'config.settings.advanced',
            a2aParam: 'advancedConfig',
            transform: (value: any) => {
              return {
                enabled: value.enable,
                options: value.opts,
                version: value.ver || '1.0.0'
              };
            }
          }
        ],
        responseMapping: []
      };

      mcpBridge.registerMapping(complexMapping);

      const complexMcpRequest: MCPRequest = {
        id: 'complex-001',
        prompt: 'Complex transformation test',
        tools: [
          {
            name: 'mcp__complex__transform',
            description: 'Complex transform test'
          }
        ]
      };

      // Mock complex parameters
      (complexMcpRequest as any).toolParams = {
        config: {
          settings: {
            advanced: {
              enable: true,
              opts: ['option1', 'option2'],
              ver: '2.1.0'
            }
          }
        }
      };

      const a2aMessage = await mcpBridge.translateMCPToA2A(complexMcpRequest);
      
      expect(a2aMessage.params.advancedConfig).toEqual({
        enabled: true,
        options: ['option1', 'option2'],
        version: '2.1.0'
      });
    });

    it('should handle array parameter transformations', async () => {
      const arrayMapping: MCPToA2AMapping = {
        mcpMethod: 'mcp__array__transform',
        a2aMethod: 'array.transform',
        parameterMapping: [
          {
            mcpParam: 'items',
            a2aParam: 'processedItems',
            transform: (items: any[]) => {
              return items.map(item => ({
                id: item.identifier,
                name: item.displayName,
                active: item.status === 'enabled'
              }));
            }
          }
        ],
        responseMapping: []
      };

      mcpBridge.registerMapping(arrayMapping);

      const arrayMcpRequest: MCPRequest = {
        id: 'array-001',
        prompt: 'Array transformation test',
        tools: [
          {
            name: 'mcp__array__transform',
            description: 'Array transform test'
          }
        ]
      };

      // Mock array parameters
      (arrayMcpRequest as any).toolParams = {
        items: [
          { identifier: '001', displayName: 'Item One', status: 'enabled' },
          { identifier: '002', displayName: 'Item Two', status: 'disabled' }
        ]
      };

      const a2aMessage = await mcpBridge.translateMCPToA2A(arrayMcpRequest);
      
      expect(a2aMessage.params.processedItems).toHaveLength(2);
      expect(a2aMessage.params.processedItems[0]).toEqual({
        id: '001',
        name: 'Item One',
        active: true
      });
      expect(a2aMessage.params.processedItems[1]).toEqual({
        id: '002',
        name: 'Item Two',
        active: false
      });
    });

    it('should handle conditional transformations', async () => {
      const conditionalTransform: TransformFunction = (value: any, context?: any) => {
        if (context?.type === 'priority') {
          const priorityMap: { [key: string]: number } = {
            'low': 1,
            'normal': 2,
            'high': 3,
            'critical': 4
          };
          return priorityMap[value.toLowerCase()] || 2;
        }
        return value;
      };

      const conditionalMapping: MCPToA2AMapping = {
        mcpMethod: 'mcp__conditional__transform',
        a2aMethod: 'conditional.transform',
        parameterMapping: [
          {
            mcpParam: 'priority',
            a2aParam: 'priorityLevel',
            transform: conditionalTransform
          }
        ],
        responseMapping: []
      };

      mcpBridge.registerMapping(conditionalMapping);

      const conditionalRequest: MCPRequest = {
        id: 'conditional-001',
        prompt: 'Conditional transformation test',
        tools: [
          {
            name: 'mcp__conditional__transform',
            description: 'Conditional test'
          }
        ]
      };

      // Mock conditional parameters
      (conditionalRequest as any).toolParams = {
        priority: 'HIGH'
      };
      (conditionalRequest as any).context = { type: 'priority' };

      const a2aMessage = await mcpBridge.translateMCPToA2A(conditionalRequest);
      
      expect(a2aMessage.params.priorityLevel).toBe(3); // 'HIGH' -> 3
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate parameter types during translation', async () => {
      const invalidParams: MCPRequest = {
        id: 'invalid-params-001',
        prompt: 'Test with invalid parameters',
        tools: [
          {
            name: 'mcp__claude-flow__neural_status',
            description: 'Neural status',
            parameters: {
              type: 'object',
              properties: {
                modelId: { type: 'string' }
              },
              required: ['modelId']
            }
          }
        ]
      };

      // Mock invalid parameters (missing required modelId)
      (invalidParams as any).toolParams = {
        wrongParam: 'value'
      };

      await expect(mcpBridge.translateMCPToA2A(invalidParams))
        .rejects.toThrow('Required parameter missing: modelId');
    });

    it('should handle transformation function errors', async () => {
      const errorMapping: MCPToA2AMapping = {
        mcpMethod: 'mcp__error__transform',
        a2aMethod: 'error.transform',
        parameterMapping: [
          {
            mcpParam: 'data',
            a2aParam: 'processedData',
            transform: (value: any) => {
              throw new Error('Transformation failed');
            }
          }
        ],
        responseMapping: []
      };

      mcpBridge.registerMapping(errorMapping);

      const errorRequest: MCPRequest = {
        id: 'error-001',
        prompt: 'Error transformation test',
        tools: [
          {
            name: 'mcp__error__transform',
            description: 'Error test'
          }
        ]
      };

      (errorRequest as any).toolParams = { data: 'test-data' };

      await expect(mcpBridge.translateMCPToA2A(errorRequest))
        .rejects.toThrow('Parameter transformation failed for data: Transformation failed');
    });

    it('should handle malformed JSON-RPC messages', async () => {
      const malformedA2A = {
        // Missing jsonrpc field
        method: 'test.method',
        id: 'malformed-001'
      } as A2AMessage;

      await expect(mcpBridge.translateA2AToMCP(malformedA2A))
        .rejects.toThrow('Invalid JSON-RPC 2.0 message format');
    });
  });

  describe('Performance and Metrics', () => {
    it('should track bridge performance metrics', async () => {
      // Perform several translations to generate metrics
      for (let i = 0; i < 5; i++) {
        const testRequest: MCPRequest = {
          id: `perf-${i}`,
          prompt: 'Performance test',
          tools: [mockMCPRequest.tools![0]]
        };
        
        await mcpBridge.translateMCPToA2A(testRequest);
      }

      const metrics = mcpBridge.getBridgeMetrics();
      
      expect(metrics.totalTranslations).toBeGreaterThanOrEqual(5);
      expect(metrics.avgTranslationTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });

    it('should track translation errors', async () => {
      // Attempt translation that will fail
      const failingRequest: MCPRequest = {
        id: 'fail-001',
        prompt: 'Failing test',
        tools: [
          {
            name: 'unknown__method',
            description: 'Unknown method'
          }
        ]
      };

      try {
        await mcpBridge.translateMCPToA2A(failingRequest);
      } catch (error) {
        // Expected to fail
      }

      const metrics = mcpBridge.getBridgeMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
      expect(metrics.errorsByType).toHaveProperty('mapping_not_found');
    });

    it('should provide detailed bridge statistics', () => {
      const metrics = mcpBridge.getBridgeMetrics();
      
      expect(metrics).toHaveProperty('totalTranslations');
      expect(metrics).toHaveProperty('mcpToA2ATranslations');
      expect(metrics).toHaveProperty('a2aToMCPTranslations');
      expect(metrics).toHaveProperty('avgTranslationTime');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('mappingsCount');
      expect(metrics).toHaveProperty('transformationCacheHits');
    });
  });

  describe('Bidirectional Translation Consistency', () => {
    it('should maintain consistency in bidirectional translation', async () => {
      // Start with MCP request
      const originalMcp: MCPRequest = {
        id: 'bidirectional-001',
        prompt: 'Bidirectional test',
        tools: [
          {
            name: 'mcp__claude-flow__neural_status',
            description: 'Neural status check'
          }
        ]
      };

      (originalMcp as any).toolParams = { modelId: 'test-model-123' };

      // MCP -> A2A -> MCP
      const a2aMessage = await mcpBridge.translateMCPToA2A(originalMcp);
      const backToMcp = await mcpBridge.translateA2AToMCP(a2aMessage);

      expect(backToMcp.id).toBe(originalMcp.id);
      expect(backToMcp.tools?.[0].name).toBe(originalMcp.tools![0].name);
      expect((backToMcp as any).toolParams.modelId).toBe('test-model-123');
    });

    it('should handle response consistency', async () => {
      // Start with A2A response
      const originalA2A: A2AResponse = {
        jsonrpc: '2.0',
        result: {
          status: 'active',
          metrics: { accuracy: 0.98 }
        },
        id: 'resp-consistency-001',
        from: 'neural-agent',
        to: 'requester',
        timestamp: Date.now(),
        messageType: 'response'
      };

      // A2A -> MCP -> A2A
      const mcpResponse = await mcpBridge.translateA2AResponseToMCP(originalA2A);
      const backToA2A = await mcpBridge.translateMCPResponseToA2A(mcpResponse);

      expect(backToA2A.id).toBe(originalA2A.id);
      expect(backToA2A.result.status).toBe('active');
      expect(backToA2A.result.metrics.accuracy).toBe(0.98);
    });
  });
});
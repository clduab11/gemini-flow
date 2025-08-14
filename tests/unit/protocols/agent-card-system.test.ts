/**
 * Agent Card System Tests
 * 
 * Comprehensive test suite for AgentCardSystem agent discovery and registration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AgentCard,
  AgentId,
  AgentCapability,
  AgentService,
  AgentType,
  AgentStatus,
  TrustLevel,
  DiscoveryRequest,
  DiscoveryResponse,
  DiscoveryFilter,
  RegistrationRequest,
  RegistrationResponse
} from '../../../src/types/a2a';

// Mock implementation will be created later
class AgentCardSystem {
  constructor() {}
  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
  async registerAgent(agentCard: AgentCard, ttl?: number): Promise<RegistrationResponse> { return {} as RegistrationResponse; }
  async unregisterAgent(agentId: AgentId): Promise<boolean> { return true; }
  async updateAgentCard(agentCard: AgentCard): Promise<boolean> { return true; }
  async getAgentCard(agentId: AgentId): Promise<AgentCard | null> { return null; }
  async discoverAgents(request: DiscoveryRequest): Promise<DiscoveryResponse> { return {} as DiscoveryResponse; }
  async findAgentsByCapability(capabilityName: string, version?: string): Promise<AgentCard[]> { return []; }
  async findAgentsByType(agentType: AgentType): Promise<AgentCard[]> { return []; }
  async findAgentsByService(serviceName: string): Promise<AgentCard[]> { return []; }
  async refreshAgentStatus(agentId: AgentId): Promise<boolean> { return true; }
  async getSystemMetrics(): Promise<any> { return {}; }
  getRegisteredAgents(): Map<AgentId, AgentCard> { return new Map(); }
  getDiscoveryMetrics(): any { return {}; }
}

describe('AgentCardSystem', () => {
  let agentCardSystem: AgentCardSystem;
  let mockAgentCards: AgentCard[];

  beforeEach(async () => {
    agentCardSystem = new AgentCardSystem();

    // Create comprehensive mock agent cards
    mockAgentCards = [
      {
        id: 'coordinator-supreme-001',
        name: 'Supreme Task Coordinator',
        description: 'Advanced multi-domain task coordination with ML optimization',
        version: '3.2.1',
        capabilities: [
          {
            name: 'task-coordination',
            version: '3.2.1',
            description: 'Coordinate complex multi-agent workflows',
            parameters: [
              {
                name: 'maxConcurrentTasks',
                type: 'number',
                required: false,
                default: 50,
                description: 'Maximum concurrent tasks to coordinate'
              }
            ],
            resources: {
              cpu: 4,
              memory: 2048,
              network: 100
            }
          },
          {
            name: 'resource-optimization',
            version: '2.1.0',
            description: 'Dynamic resource allocation and optimization',
            dependencies: ['task-coordination'],
            resources: {
              cpu: 2,
              memory: 1024,
              network: 50
            }
          },
          {
            name: 'predictive-scaling',
            version: '1.5.0',
            description: 'Predict resource needs and scale proactively',
            dependencies: ['resource-optimization'],
            resources: {
              cpu: 8,
              memory: 4096,
              network: 200,
              specialized: ['gpu-acceleration']
            }
          }
        ],
        services: [
          {
            name: 'coordinateWorkflow',
            method: 'workflow.coordinate',
            description: 'Coordinate multi-step workflow execution',
            params: [
              {
                name: 'workflowDefinition',
                type: 'object',
                required: true,
                description: 'Complete workflow definition'
              },
              {
                name: 'priority',
                type: 'string',
                required: false,
                description: 'Workflow execution priority'
              }
            ],
            returns: {
              type: 'object',
              description: 'Workflow execution status and tracking info'
            },
            cost: 25,
            latency: 150,
            reliability: 0.99
          },
          {
            name: 'optimizeResources',
            method: 'resources.optimize',
            description: 'Optimize resource allocation across agents',
            params: [
              {
                name: 'constraints',
                type: 'object',
                required: true,
                description: 'Resource constraints and requirements'
              }
            ],
            returns: {
              type: 'object',
              description: 'Optimized resource allocation plan'
            },
            cost: 15,
            latency: 200,
            reliability: 0.97
          }
        ],
        endpoints: [
          {
            protocol: 'websocket',
            address: 'coordinator-supreme.ai',
            port: 8080,
            path: '/a2a',
            secure: true,
            maxConnections: 500,
            capabilities: ['json-rpc-2.0', 'streaming', 'compression']
          },
          {
            protocol: 'grpc',
            address: 'coordinator-supreme.ai',
            port: 9090,
            secure: true,
            maxConnections: 200,
            capabilities: ['streaming', 'metadata']
          }
        ],
        metadata: {
          type: 'coordinator',
          status: 'idle',
          load: 0.25,
          created: Date.now() - 7200000, // 2 hours ago
          lastSeen: Date.now() - 30000, // 30 seconds ago
          metrics: {
            responseTime: {
              avg: 125,
              p50: 100,
              p95: 200,
              p99: 350
            },
            requestsPerSecond: 45.2,
            messagesProcessed: 15420,
            cpuUsage: 0.30,
            memoryUsage: 0.55,
            networkUsage: 8192000, // 8MB/s
            successRate: 0.99,
            errorRate: 0.01,
            uptime: 99.8
          },
          publicKey: 'coordinator-public-key-xyz789',
          trustLevel: 'trusted'
        }
      },
      {
        id: 'researcher-quantum-001',
        name: 'Quantum Research Specialist',
        description: 'Quantum computing research with classical ML integration',
        version: '2.8.4',
        capabilities: [
          {
            name: 'quantum-research',
            version: '2.8.4',
            description: 'Advanced quantum computing research capabilities',
            parameters: [
              {
                name: 'quantumSimulator',
                type: 'string',
                required: false,
                default: 'qiskit',
                description: 'Quantum simulator backend to use'
              }
            ],
            resources: {
              cpu: 16,
              memory: 8192,
              network: 1000,
              specialized: ['quantum-processor', 'high-memory']
            }
          },
          {
            name: 'hybrid-optimization',
            version: '1.3.0',
            description: 'Quantum-classical hybrid optimization algorithms',
            dependencies: ['quantum-research'],
            resources: {
              cpu: 32,
              memory: 16384,
              specialized: ['quantum-processor', 'gpu-acceleration']
            }
          },
          {
            name: 'scientific-analysis',
            version: '3.1.0',
            description: 'Advanced scientific data analysis',
            resources: {
              cpu: 8,
              memory: 4096,
              network: 500
            }
          }
        ],
        services: [
          {
            name: 'quantumOptimization',
            method: 'quantum.optimize',
            description: 'Perform quantum-enhanced optimization',
            params: [
              {
                name: 'problemDefinition',
                type: 'object',
                required: true,
                description: 'Optimization problem definition'
              },
              {
                name: 'quantumParams',
                type: 'object',
                required: false,
                description: 'Quantum-specific parameters'
              }
            ],
            returns: {
              type: 'object',
              description: 'Optimization results with quantum metrics'
            },
            cost: 100,
            latency: 5000,
            reliability: 0.92
          }
        ],
        endpoints: [
          {
            protocol: 'http',
            address: 'quantum-researcher.lab',
            port: 8443,
            path: '/quantum-api',
            secure: true,
            capabilities: ['json-rpc-2.0', 'large-payloads']
          }
        ],
        metadata: {
          type: 'researcher',
          status: 'busy',
          load: 0.85,
          created: Date.now() - 14400000, // 4 hours ago
          lastSeen: Date.now() - 5000, // 5 seconds ago
          metrics: {
            responseTime: {
              avg: 4200,
              p50: 3500,
              p95: 8000,
              p99: 15000
            },
            requestsPerSecond: 0.8,
            messagesProcessed: 156,
            cpuUsage: 0.90,
            memoryUsage: 0.78,
            networkUsage: 20480000, // 20MB/s
            successRate: 0.92,
            errorRate: 0.08,
            uptime: 96.5
          },
          publicKey: 'quantum-researcher-key-abc123',
          trustLevel: 'verified'
        }
      },
      {
        id: 'coder-polyglot-001',
        name: 'Polyglot Code Architect',
        description: 'Multi-language code generation and architecture design',
        version: '4.1.2',
        capabilities: [
          {
            name: 'multi-language-coding',
            version: '4.1.2',
            description: 'Generate code in 20+ programming languages',
            parameters: [
              {
                name: 'targetLanguages',
                type: 'array',
                required: false,
                default: ['typescript', 'python', 'rust'],
                description: 'Target programming languages'
              }
            ]
          },
          {
            name: 'architecture-design',
            version: '2.3.0',
            description: 'Design scalable software architectures',
            dependencies: ['multi-language-coding']
          },
          {
            name: 'code-optimization',
            version: '3.0.1',
            description: 'Optimize code for performance and maintainability'
          }
        ],
        services: [
          {
            name: 'generateApplication',
            method: 'code.generate.application',
            description: 'Generate complete application from specifications',
            params: [
              {
                name: 'specifications',
                type: 'object',
                required: true,
                description: 'Application specifications and requirements'
              },
              {
                name: 'architecture',
                type: 'string',
                required: false,
                description: 'Preferred architecture pattern'
              }
            ],
            returns: {
              type: 'object',
              description: 'Generated application code and documentation'
            },
            cost: 50,
            latency: 3000,
            reliability: 0.96
          }
        ],
        endpoints: [
          {
            protocol: 'websocket',
            address: 'polyglot-coder.dev',
            port: 8081,
            secure: true,
            capabilities: ['json-rpc-2.0', 'code-streaming']
          }
        ],
        metadata: {
          type: 'coder',
          status: 'idle',
          load: 0.15,
          created: Date.now() - 3600000, // 1 hour ago
          lastSeen: Date.now() - 1000, // 1 second ago
          metrics: {
            responseTime: {
              avg: 2800,
              p50: 2400,
              p95: 4500,
              p99: 8000
            },
            requestsPerSecond: 3.2,
            messagesProcessed: 456,
            cpuUsage: 0.20,
            memoryUsage: 0.40,
            networkUsage: 4096000, // 4MB/s
            successRate: 0.96,
            errorRate: 0.04,
            uptime: 98.9
          },
          trustLevel: 'trusted'
        }
      },
      {
        id: 'analyzer-bigdata-001',
        name: 'Big Data Analytics Engine',
        description: 'Large-scale data processing and machine learning analytics',
        version: '5.0.3',
        capabilities: [
          {
            name: 'big-data-processing',
            version: '5.0.3',
            description: 'Process petabyte-scale datasets',
            resources: {
              cpu: 64,
              memory: 32768,
              network: 10000,
              storage: 1000000, // 1TB
              specialized: ['distributed-computing', 'high-storage']
            }
          },
          {
            name: 'ml-pipeline',
            version: '3.2.0',
            description: 'End-to-end machine learning pipelines',
            dependencies: ['big-data-processing']
          }
        ],
        services: [
          {
            name: 'analyzeDataset',
            method: 'data.analyze.large',
            description: 'Analyze large datasets with ML insights',
            cost: 200,
            latency: 10000,
            reliability: 0.94
          }
        ],
        endpoints: [
          {
            protocol: 'grpc',
            address: 'bigdata-analyzer.cloud',
            port: 9091,
            secure: true,
            capabilities: ['streaming', 'compression', 'large-payloads']
          }
        ],
        metadata: {
          type: 'analyst',
          status: 'overloaded',
          load: 0.95,
          created: Date.now() - 21600000, // 6 hours ago
          lastSeen: Date.now() - 10000, // 10 seconds ago
          trustLevel: 'basic'
        }
      }
    ];

    await agentCardSystem.initialize();

    // Register all mock agents
    for (const agentCard of mockAgentCards) {
      await agentCardSystem.registerAgent(agentCard);
    }
  });

  afterEach(async () => {
    await agentCardSystem.shutdown();
    jest.clearAllMocks();
  });

  describe('Agent Registration and Management', () => {
    it('should register new agent successfully', async () => {
      const newAgent: AgentCard = {
        id: 'test-agent-new-001',
        name: 'Test New Agent',
        description: 'A newly created test agent',
        version: '1.0.0',
        capabilities: [
          {
            name: 'basic-testing',
            version: '1.0.0',
            description: 'Basic testing capabilities'
          }
        ],
        services: [
          {
            name: 'testBasic',
            method: 'test.basic',
            description: 'Basic test operation',
            cost: 1,
            latency: 100,
            reliability: 0.99
          }
        ],
        endpoints: [
          {
            protocol: 'http',
            address: 'localhost',
            port: 8090
          }
        ],
        metadata: {
          type: 'specialist',
          status: 'idle',
          load: 0.0,
          created: Date.now(),
          lastSeen: Date.now()
        }
      };

      const registration = await agentCardSystem.registerAgent(newAgent, 3600);
      
      expect(registration.registered).toBe(true);
      expect(registration.agentId).toBe('test-agent-new-001');
      expect(registration.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should prevent duplicate agent registration', async () => {
      const duplicateAgent = { ...mockAgentCards[0] };
      
      await expect(agentCardSystem.registerAgent(duplicateAgent))
        .rejects.toThrow('Agent already registered: coordinator-supreme-001');
    });

    it('should unregister agent successfully', async () => {
      const success = await agentCardSystem.unregisterAgent('coordinator-supreme-001');
      expect(success).toBe(true);
      
      const retrievedCard = await agentCardSystem.getAgentCard('coordinator-supreme-001');
      expect(retrievedCard).toBeNull();
    });

    it('should update existing agent card', async () => {
      const updatedCard = {
        ...mockAgentCards[0],
        version: '3.3.0',
        metadata: {
          ...mockAgentCards[0].metadata,
          status: 'busy' as AgentStatus,
          load: 0.7
        }
      };

      const success = await agentCardSystem.updateAgentCard(updatedCard);
      expect(success).toBe(true);
      
      const retrievedCard = await agentCardSystem.getAgentCard('coordinator-supreme-001');
      expect(retrievedCard?.version).toBe('3.3.0');
      expect(retrievedCard?.metadata.status).toBe('busy');
      expect(retrievedCard?.metadata.load).toBe(0.7);
    });

    it('should retrieve agent card by ID', async () => {
      const agentCard = await agentCardSystem.getAgentCard('researcher-quantum-001');
      
      expect(agentCard).toBeDefined();
      expect(agentCard?.id).toBe('researcher-quantum-001');
      expect(agentCard?.name).toBe('Quantum Research Specialist');
      expect(agentCard?.capabilities).toHaveLength(3);
    });

    it('should handle non-existent agent retrieval', async () => {
      const agentCard = await agentCardSystem.getAgentCard('non-existent-agent');
      expect(agentCard).toBeNull();
    });

    it('should refresh agent status', async () => {
      const success = await agentCardSystem.refreshAgentStatus('coordinator-supreme-001');
      expect(success).toBe(true);
      
      const agentCard = await agentCardSystem.getAgentCard('coordinator-supreme-001');
      expect(agentCard?.metadata.lastSeen).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Agent Discovery', () => {
    it('should discover all agents without filters', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {},
        id: 'discover-all-001',
        from: 'discovery-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      expect(response.result.agents).toHaveLength(4);
      expect(response.result.totalFound).toBe(4);
      expect(response.result.searchTime).toBeGreaterThan(0);
    });

    it('should discover agents by capability', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          capabilities: ['quantum-research']
        },
        id: 'discover-quantum-001',
        from: 'discovery-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      expect(response.result.agents).toHaveLength(1);
      expect(response.result.agents[0].id).toBe('researcher-quantum-001');
    });

    it('should discover agents by type', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          agentType: 'coordinator'
        },
        id: 'discover-coordinators-001',
        from: 'discovery-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      expect(response.result.agents).toHaveLength(1);
      expect(response.result.agents[0].metadata.type).toBe('coordinator');
    });

    it('should discover agents with complex filters', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          filters: [
            {
              field: 'metadata.load',
              operator: 'lt',
              value: 0.5
            },
            {
              field: 'metadata.status',
              operator: 'eq',
              value: 'idle'
            }
          ]
        },
        id: 'discover-filtered-001',
        from: 'discovery-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      // Should find coordinator (load: 0.25, idle) and coder (load: 0.15, idle)
      expect(response.result.agents).toHaveLength(2);
      response.result.agents.forEach(agent => {
        expect(agent.metadata.load).toBeLessThan(0.5);
        expect(agent.metadata.status).toBe('idle');
      });
    });

    it('should limit discovery results by maxDistance', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          maxDistance: 1 // Very restrictive distance
        },
        id: 'discover-distance-001',
        from: 'discovery-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      // Should return limited results based on network distance
      expect(response.result.agents.length).toBeGreaterThan(0);
      expect(response.result.agents.length).toBeLessThanOrEqual(4);
    });

    it('should handle discovery with no matching agents', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          capabilities: ['non-existent-capability']
        },
        id: 'discover-none-001',
        from: 'discovery-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      expect(response.result.agents).toHaveLength(0);
      expect(response.result.totalFound).toBe(0);
    });
  });

  describe('Capability-Based Search', () => {
    it('should find agents by specific capability name', async () => {
      const agents = await agentCardSystem.findAgentsByCapability('task-coordination');
      
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('coordinator-supreme-001');
    });

    it('should find agents by capability name and version', async () => {
      const agents = await agentCardSystem.findAgentsByCapability('task-coordination', '3.2.1');
      
      expect(agents).toHaveLength(1);
      expect(agents[0].capabilities.find(c => c.name === 'task-coordination')?.version).toBe('3.2.1');
    });

    it('should handle version compatibility in capability search', async () => {
      // Search for older version - should find compatible newer versions
      const agents = await agentCardSystem.findAgentsByCapability('task-coordination', '3.0.0');
      
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('coordinator-supreme-001');
    });

    it('should find multiple agents with same capability', async () => {
      // Add another agent with quantum-research capability for this test
      const anotherQuantumAgent: AgentCard = {
        id: 'quantum-specialist-002',
        name: 'Quantum Specialist 2',
        description: 'Another quantum specialist',
        version: '1.0.0',
        capabilities: [
          {
            name: 'quantum-research',
            version: '1.5.0',
            description: 'Basic quantum research'
          }
        ],
        services: [],
        endpoints: [{
          protocol: 'http',
          address: 'quantum2.local',
          port: 8080
        }],
        metadata: {
          type: 'specialist',
          status: 'idle',
          load: 0.1,
          created: Date.now(),
          lastSeen: Date.now()
        }
      };

      await agentCardSystem.registerAgent(anotherQuantumAgent);
      
      const agents = await agentCardSystem.findAgentsByCapability('quantum-research');
      expect(agents).toHaveLength(2);
    });
  });

  describe('Type-Based Search', () => {
    it('should find agents by type', async () => {
      const coordinators = await agentCardSystem.findAgentsByType('coordinator');
      expect(coordinators).toHaveLength(1);
      expect(coordinators[0].metadata.type).toBe('coordinator');

      const researchers = await agentCardSystem.findAgentsByType('researcher');
      expect(researchers).toHaveLength(1);
      expect(researchers[0].metadata.type).toBe('researcher');

      const coders = await agentCardSystem.findAgentsByType('coder');
      expect(coders).toHaveLength(1);
      expect(coders[0].metadata.type).toBe('coder');

      const analysts = await agentCardSystem.findAgentsByType('analyst');
      expect(analysts).toHaveLength(1);
      expect(analysts[0].metadata.type).toBe('analyst');
    });

    it('should handle non-existent agent types', async () => {
      const monitors = await agentCardSystem.findAgentsByType('monitor');
      expect(monitors).toHaveLength(0);
    });
  });

  describe('Service-Based Search', () => {
    it('should find agents by service name', async () => {
      const agents = await agentCardSystem.findAgentsByService('coordinateWorkflow');
      
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('coordinator-supreme-001');
      expect(agents[0].services.find(s => s.name === 'coordinateWorkflow')).toBeDefined();
    });

    it('should find agents by service method', async () => {
      const agents = await agentCardSystem.findAgentsByService('workflow.coordinate');
      
      expect(agents).toHaveLength(1);
      expect(agents[0].services.find(s => s.method === 'workflow.coordinate')).toBeDefined();
    });

    it('should handle non-existent services', async () => {
      const agents = await agentCardSystem.findAgentsByService('non-existent-service');
      expect(agents).toHaveLength(0);
    });
  });

  describe('Advanced Filtering', () => {
    it('should filter by trust level', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          filters: [
            {
              field: 'metadata.trustLevel',
              operator: 'eq',
              value: 'trusted'
            }
          ]
        },
        id: 'filter-trust-001',
        from: 'security-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      response.result.agents.forEach(agent => {
        expect(agent.metadata.trustLevel).toBe('trusted');
      });
    });

    it('should filter by performance metrics', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          filters: [
            {
              field: 'metadata.metrics.successRate',
              operator: 'gte',
              value: 0.95
            },
            {
              field: 'metadata.metrics.responseTime.avg',
              operator: 'lt',
              value: 1000
            }
          ]
        },
        id: 'filter-performance-001',
        from: 'performance-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      response.result.agents.forEach(agent => {
        expect(agent.metadata.metrics?.successRate).toBeGreaterThanOrEqual(0.95);
        expect(agent.metadata.metrics?.responseTime.avg).toBeLessThan(1000);
      });
    });

    it('should filter by resource requirements', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          filters: [
            {
              field: 'capabilities',
              operator: 'contains',
              value: {
                resources: {
                  specialized: 'gpu-acceleration'
                }
              }
            }
          ]
        },
        id: 'filter-resources-001',
        from: 'resource-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      response.result.agents.forEach(agent => {
        const hasGpuCapability = agent.capabilities.some(cap => 
          cap.resources?.specialized?.includes('gpu-acceleration')
        );
        expect(hasGpuCapability).toBe(true);
      });
    });

    it('should combine multiple filter operators', async () => {
      const discoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          filters: [
            {
              field: 'metadata.load',
              operator: 'gte',
              value: 0.2
            },
            {
              field: 'metadata.load',
              operator: 'lte',
              value: 0.8
            },
            {
              field: 'metadata.type',
              operator: 'in',
              value: ['researcher', 'analyst']
            }
          ]
        },
        id: 'filter-combined-001',
        from: 'complex-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      const response = await agentCardSystem.discoverAgents(discoveryRequest);
      
      response.result.agents.forEach(agent => {
        expect(agent.metadata.load).toBeGreaterThanOrEqual(0.2);
        expect(agent.metadata.load).toBeLessThanOrEqual(0.8);
        expect(['researcher', 'analyst']).toContain(agent.metadata.type);
      });
    });
  });

  describe('Agent Registration with TTL', () => {
    it('should register agent with time-to-live', async () => {
      const temporaryAgent: AgentCard = {
        id: 'temp-agent-001',
        name: 'Temporary Agent',
        description: 'Agent with limited lifetime',
        version: '1.0.0',
        capabilities: [],
        services: [],
        endpoints: [{
          protocol: 'http',
          address: 'temp.local',
          port: 8080
        }],
        metadata: {
          type: 'specialist',
          status: 'idle',
          load: 0.0,
          created: Date.now(),
          lastSeen: Date.now()
        }
      };

      const registration = await agentCardSystem.registerAgent(temporaryAgent, 60); // 60 seconds TTL
      
      expect(registration.registered).toBe(true);
      expect(registration.expiresAt).toBeGreaterThan(Date.now());
      expect(registration.expiresAt).toBeLessThanOrEqual(Date.now() + 60000);
    });

    it('should handle agent expiration', async () => {
      // This test would require time mocking or waiting
      // In a real implementation, expired agents would be automatically removed
      const shortLivedAgent: AgentCard = {
        id: 'short-lived-001',
        name: 'Short Lived Agent',
        description: 'Agent that expires quickly',
        version: '1.0.0',
        capabilities: [],
        services: [],
        endpoints: [{
          protocol: 'http',
          address: 'shortlived.local',
          port: 8080
        }],
        metadata: {
          type: 'specialist',
          status: 'idle',
          load: 0.0,
          created: Date.now(),
          lastSeen: Date.now()
        }
      };

      await agentCardSystem.registerAgent(shortLivedAgent, 1); // 1 second TTL
      
      // Immediate check - should exist
      let agentCard = await agentCardSystem.getAgentCard('short-lived-001');
      expect(agentCard).not.toBeNull();

      // After expiration (simulated) - should be removed
      // In practice, this would be handled by a cleanup process
    });
  });

  describe('System Metrics and Monitoring', () => {
    it('should provide system metrics', async () => {
      const metrics = await agentCardSystem.getSystemMetrics();
      
      expect(metrics).toHaveProperty('totalRegisteredAgents');
      expect(metrics).toHaveProperty('agentsByType');
      expect(metrics).toHaveProperty('agentsByStatus');
      expect(metrics).toHaveProperty('averageLoad');
      expect(metrics).toHaveProperty('capabilityDistribution');
      expect(metrics).toHaveProperty('trustLevelDistribution');
      
      expect(metrics.totalRegisteredAgents).toBe(4);
      expect(metrics.agentsByType.coordinator).toBe(1);
      expect(metrics.agentsByType.researcher).toBe(1);
      expect(metrics.agentsByType.coder).toBe(1);
      expect(metrics.agentsByType.analyst).toBe(1);
    });

    it('should track discovery metrics', () => {
      const metrics = agentCardSystem.getDiscoveryMetrics();
      
      expect(metrics).toHaveProperty('totalDiscoveryRequests');
      expect(metrics).toHaveProperty('avgDiscoveryTime');
      expect(metrics).toHaveProperty('popularCapabilities');
      expect(metrics).toHaveProperty('discoverySuccessRate');
      expect(metrics).toHaveProperty('filterUsageStats');
    });

    it('should provide registered agents map', () => {
      const registeredAgents = agentCardSystem.getRegisteredAgents();
      
      expect(registeredAgents.size).toBe(4);
      expect(registeredAgents.has('coordinator-supreme-001')).toBe(true);
      expect(registeredAgents.has('researcher-quantum-001')).toBe(true);
      expect(registeredAgents.has('coder-polyglot-001')).toBe(true);
      expect(registeredAgents.has('analyzer-bigdata-001')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed agent card registration', async () => {
      const malformedAgent = {
        // Missing required fields
        id: 'malformed-001',
        name: 'Malformed Agent'
        // Missing other required fields
      } as AgentCard;

      await expect(agentCardSystem.registerAgent(malformedAgent))
        .rejects.toThrow('Invalid agent card: missing required fields');
    });

    it('should handle invalid discovery filters', async () => {
      const invalidDiscoveryRequest: DiscoveryRequest = {
        jsonrpc: '2.0',
        method: 'agent.discover',
        params: {
          filters: [
            {
              field: 'invalid.field.path',
              operator: 'invalid_operator' as any,
              value: 'test'
            }
          ]
        },
        id: 'invalid-filter-001',
        from: 'invalid-client',
        to: 'agent-registry',
        timestamp: Date.now(),
        messageType: 'discovery'
      };

      await expect(agentCardSystem.discoverAgents(invalidDiscoveryRequest))
        .rejects.toThrow('Invalid filter operator: invalid_operator');
    });

    it('should handle agent card updates for non-existent agents', async () => {
      const nonExistentAgent: AgentCard = {
        id: 'non-existent-999',
        name: 'Non-existent Agent',
        description: 'This agent does not exist',
        version: '1.0.0',
        capabilities: [],
        services: [],
        endpoints: [],
        metadata: {
          type: 'specialist',
          status: 'idle',
          load: 0.0,
          created: Date.now(),
          lastSeen: Date.now()
        }
      };

      const success = await agentCardSystem.updateAgentCard(nonExistentAgent);
      expect(success).toBe(false);
    });

    it('should handle concurrent agent operations', async () => {
      const concurrentOperations = [
        agentCardSystem.refreshAgentStatus('coordinator-supreme-001'),
        agentCardSystem.refreshAgentStatus('researcher-quantum-001'),
        agentCardSystem.refreshAgentStatus('coder-polyglot-001'),
        agentCardSystem.refreshAgentStatus('analyzer-bigdata-001')
      ];

      const results = await Promise.all(concurrentOperations);
      
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });
  });
});
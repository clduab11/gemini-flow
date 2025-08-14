/**
 * AgentSpace Integration Tests
 * Comprehensive testing of AgentSpace core functionality and coordination
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

// Test Infrastructure
import { TestEnvironmentManager } from '../fixtures/test-environment-manager';
import { MockAgentProvider } from '../fixtures/mock-agent-provider';
import { TestDataGenerator } from '../fixtures/test-data-generator';
import { MetricsCollector } from '../fixtures/metrics-collector';

// System Under Test
import { AgentSpaceManager } from '../../src/agentspace/core/AgentSpaceManager';
import { AgentCoordinator } from '../../src/agentspace/coordination/AgentCoordinator';
import { ResourceManager } from '../../src/agentspace/resources/ResourceManager';
import { CommunicationHub } from '../../src/agentspace/communication/CommunicationHub';
import { TaskOrchestrator } from '../../src/agentspace/orchestration/TaskOrchestrator';

interface AgentTestConfig {
  id: string;
  type: string;
  capabilities: string[];
  resources: {
    cpu: number;
    memory: number;
    priority: 'low' | 'medium' | 'high';
  };
  communication: {
    protocols: string[];
    maxConnections: number;
  };
}

interface TaskTestConfig {
  id: string;
  type: string;
  requirements: string[];
  constraints: {
    maxDuration: number;
    resourceLimits: any;
    dependencies: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

describe('AgentSpace Integration Tests', () => {
  let testEnvironment: TestEnvironmentManager;
  let mockAgentProvider: MockAgentProvider;
  let dataGenerator: TestDataGenerator;
  let metricsCollector: MetricsCollector;
  
  let agentSpaceManager: AgentSpaceManager;
  let agentCoordinator: AgentCoordinator;
  let resourceManager: ResourceManager;
  let communicationHub: CommunicationHub;
  let taskOrchestrator: TaskOrchestrator;

  beforeAll(async () => {
    testEnvironment = new TestEnvironmentManager({
      services: ['agentspace', 'resource-manager', 'communication'],
      mockServices: true,
      metricsCollection: true
    });

    mockAgentProvider = new MockAgentProvider({
      maxAgents: 20,
      agentTypes: ['coordinator', 'worker', 'specialist', 'monitor'],
      resourceLimits: {
        totalCpu: 16,
        totalMemory: 32768, // 32GB
        maxAgentsPerType: 5
      }
    });

    dataGenerator = new TestDataGenerator({
      agentConfigs: await generateAgentConfigs(),
      taskTemplates: await generateTaskTemplates()
    });

    metricsCollector = new MetricsCollector({
      interval: 500,
      retention: 300000
    });

    await testEnvironment.initialize();
    await mockAgentProvider.start();
    await metricsCollector.start();

    // Initialize AgentSpace components
    agentSpaceManager = new AgentSpaceManager({
      maxAgents: 20,
      coordination: 'hierarchical',
      memorySharing: true,
      faultTolerance: true
    });

    agentCoordinator = new AgentCoordinator({
      coordinationMode: 'adaptive',
      leaderElection: true,
      consensusThreshold: 0.6
    });

    resourceManager = new ResourceManager({
      totalCpu: 16,
      totalMemory: 32768,
      allocationStrategy: 'fair-share',
      overcommit: false
    });

    communicationHub = new CommunicationHub({
      maxConnections: 1000,
      protocols: ['direct', 'broadcast', 'multicast'],
      compression: true
    });

    taskOrchestrator = new TaskOrchestrator({
      schedulingAlgorithm: 'priority-weighted',
      maxConcurrentTasks: 50,
      loadBalancing: true
    });

    await agentSpaceManager.initialize();
    await agentCoordinator.initialize();
    await resourceManager.initialize();
    await communicationHub.initialize();
    await taskOrchestrator.initialize();

    console.log('🤖 AgentSpace test environment initialized');
  }, 60000);

  afterAll(async () => {
    await agentSpaceManager.shutdown();
    await agentCoordinator.shutdown();
    await resourceManager.shutdown();
    await communicationHub.shutdown();
    await taskOrchestrator.shutdown();
    
    await metricsCollector.stop();
    await mockAgentProvider.stop();
    await testEnvironment.cleanup();
  });

  beforeEach(async () => {
    metricsCollector.reset();
    await agentSpaceManager.reset();
  });

  describe('Agent Lifecycle Management', () => {
    it('should spawn agents with proper configuration', async () => {
      const agentConfig: AgentTestConfig = {
        id: 'test-agent-001',
        type: 'worker',
        capabilities: ['data-processing', 'analysis', 'reporting'],
        resources: {
          cpu: 2,
          memory: 4096,
          priority: 'medium'
        },
        communication: {
          protocols: ['direct', 'broadcast'],
          maxConnections: 10
        }
      };

      const spawnResult = await agentSpaceManager.spawnAgent(agentConfig);

      expect(spawnResult.success).toBe(true);
      expect(spawnResult.data.id).toBe(agentConfig.id);
      expect(spawnResult.data.status).toBe('active');
      expect(spawnResult.data.capabilities).toEqual(agentConfig.capabilities);

      // Validate resource allocation
      const agentResources = await resourceManager.getAgentResources(agentConfig.id);
      expect(agentResources.cpu).toBe(agentConfig.resources.cpu);
      expect(agentResources.memory).toBe(agentConfig.resources.memory);

      // Validate communication setup
      const commStatus = await communicationHub.getAgentStatus(agentConfig.id);
      expect(commStatus.connected).toBe(true);
      expect(commStatus.protocols).toEqual(agentConfig.communication.protocols);
    });

    it('should handle agent termination gracefully', async () => {
      // Spawn agent first
      const agentConfig = {
        id: 'test-agent-002',
        type: 'worker',
        capabilities: ['testing'],
        resources: { cpu: 1, memory: 1024, priority: 'low' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      };

      await agentSpaceManager.spawnAgent(agentConfig);

      // Assign a task to the agent
      const task = {
        id: 'cleanup-test-task',
        type: 'data-processing',
        assignedAgent: agentConfig.id,
        priority: 'medium' as const
      };

      await taskOrchestrator.assignTask(task);

      // Terminate agent
      const terminationResult = await agentSpaceManager.terminateAgent(
        agentConfig.id, 
        'test_completed'
      );

      expect(terminationResult.success).toBe(true);
      expect(terminationResult.data.gracefulShutdown).toBe(true);
      expect(terminationResult.data.tasksReassigned).toBeGreaterThanOrEqual(0);

      // Validate cleanup
      const agentExists = await agentSpaceManager.getAgent(agentConfig.id);
      expect(agentExists).toBeNull();

      const resourcesFreed = await resourceManager.getAgentResources(agentConfig.id);
      expect(resourcesFreed).toBeNull();
    });

    it('should support agent scaling based on load', async () => {
      const baseAgentCount = 3;
      const targetLoad = 80; // 80% CPU utilization

      // Spawn initial agents
      const initialAgents = await Promise.all(
        Array.from({ length: baseAgentCount }, async (_, i) => {
          const config = {
            id: `scale-agent-${i}`,
            type: 'worker',
            capabilities: ['load-testing'],
            resources: { cpu: 2, memory: 2048, priority: 'medium' as const },
            communication: { protocols: ['direct'], maxConnections: 10 }
          };
          return agentSpaceManager.spawnAgent(config);
        })
      );

      expect(initialAgents.every(result => result.success)).toBe(true);

      // Simulate high load
      await mockAgentProvider.simulateLoad(targetLoad);

      // Trigger scaling
      const scalingResult = await agentSpaceManager.autoScale({
        targetLoad: 70, // Scale when load exceeds 70%
        maxAgents: 10,
        minAgents: 2,
        scalingFactor: 1.5
      });

      expect(scalingResult.scalingTriggered).toBe(true);
      expect(scalingResult.newAgentCount).toBeGreaterThan(baseAgentCount);
      expect(scalingResult.targetLoadAchieved).toBe(true);

      // Validate new agents are functional
      const allAgents = await agentSpaceManager.listAgents();
      expect(allAgents.length).toBeGreaterThan(baseAgentCount);

      for (const agent of allAgents) {
        expect(agent.status).toBe('active');
        expect(agent.healthScore).toBeGreaterThan(0.8);
      }
    });

    it('should handle agent health monitoring and recovery', async () => {
      const agentConfig = {
        id: 'health-test-agent',
        type: 'monitor',
        capabilities: ['health-monitoring'],
        resources: { cpu: 1, memory: 1024, priority: 'high' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      };

      await agentSpaceManager.spawnAgent(agentConfig);

      // Simulate agent health degradation
      await mockAgentProvider.simulateHealthIssue(agentConfig.id, {
        type: 'memory_leak',
        severity: 'moderate',
        duration: 5000
      });

      // Wait for health monitoring to detect issue
      await new Promise(resolve => setTimeout(resolve, 2000));

      const healthStatus = await agentSpaceManager.getAgentHealth(agentConfig.id);
      expect(healthStatus.healthScore).toBeLessThan(0.8);
      expect(healthStatus.issues).toContain('memory_leak');

      // Trigger recovery
      const recoveryResult = await agentSpaceManager.recoverAgent(agentConfig.id);
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.recoveryMethod).toBeDefined();

      // Validate recovery
      await new Promise(resolve => setTimeout(resolve, 3000));
      const postRecoveryHealth = await agentSpaceManager.getAgentHealth(agentConfig.id);
      expect(postRecoveryHealth.healthScore).toBeGreaterThan(0.9);
      expect(postRecoveryHealth.issues).toHaveLength(0);
    });
  });

  describe('Agent Coordination and Communication', () => {
    it('should coordinate agents in hierarchical mode', async () => {
      // Spawn coordinator and worker agents
      const coordinatorConfig = {
        id: 'hierarchy-coordinator',
        type: 'coordinator',
        capabilities: ['coordination', 'leadership', 'decision-making'],
        resources: { cpu: 3, memory: 4096, priority: 'high' as const },
        communication: { protocols: ['direct', 'broadcast'], maxConnections: 20 }
      };

      const workerConfigs = Array.from({ length: 4 }, (_, i) => ({
        id: `hierarchy-worker-${i}`,
        type: 'worker',
        capabilities: ['task-execution'],
        resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      }));

      await agentSpaceManager.spawnAgent(coordinatorConfig);
      await Promise.all(workerConfigs.map(config => agentSpaceManager.spawnAgent(config)));

      // Establish hierarchy
      const hierarchyResult = await agentCoordinator.establishHierarchy({
        leader: coordinatorConfig.id,
        subordinates: workerConfigs.map(c => c.id),
        structure: 'tree'
      });

      expect(hierarchyResult.success).toBe(true);
      expect(hierarchyResult.data.leaderAgent).toBe(coordinatorConfig.id);
      expect(hierarchyResult.data.subordinates).toHaveLength(4);

      // Test coordination
      const coordinationTask = {
        id: 'hierarchy-test-task',
        type: 'coordinated-processing',
        instructions: 'Process data in coordinated manner',
        participants: [coordinatorConfig.id, ...workerConfigs.map(c => c.id)]
      };

      const coordinationResult = await agentCoordinator.coordinateTask(coordinationTask);
      expect(coordinationResult.success).toBe(true);
      expect(coordinationResult.data.coordinationEfficiency).toBeGreaterThan(0.8);
    });

    it('should handle agent-to-agent communication protocols', async () => {
      const agents = await Promise.all([
        agentSpaceManager.spawnAgent({
          id: 'comm-sender',
          type: 'worker',
          capabilities: ['communication'],
          resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
          communication: { protocols: ['direct', 'broadcast'], maxConnections: 10 }
        }),
        agentSpaceManager.spawnAgent({
          id: 'comm-receiver',
          type: 'worker',
          capabilities: ['communication'],
          resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
          communication: { protocols: ['direct', 'multicast'], maxConnections: 10 }
        })
      ]);

      expect(agents.every(result => result.success)).toBe(true);

      // Test direct communication
      const directMessage = {
        from: 'comm-sender',
        to: 'comm-receiver',
        type: 'direct',
        content: { action: 'process_data', data: 'test_payload' },
        priority: 'normal'
      };

      const directResult = await communicationHub.sendMessage(directMessage);
      expect(directResult.success).toBe(true);
      expect(directResult.data.delivered).toBe(true);
      expect(directResult.data.latency).toBeLessThan(100); // < 100ms

      // Test broadcast communication
      const broadcastMessage = {
        from: 'comm-sender',
        to: 'all',
        type: 'broadcast',
        content: { announcement: 'system_status_update' },
        priority: 'high'
      };

      const broadcastResult = await communicationHub.sendMessage(broadcastMessage);
      expect(broadcastResult.success).toBe(true);
      expect(broadcastResult.data.recipientCount).toBeGreaterThan(1);
      expect(broadcastResult.data.deliveryRate).toBeGreaterThan(0.9);
    });

    it('should support consensus mechanisms', async () => {
      // Spawn voting agents
      const votingAgents = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const config = {
            id: `voter-${i}`,
            type: 'coordinator',
            capabilities: ['voting', 'consensus'],
            resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
            communication: { protocols: ['direct', 'multicast'], maxConnections: 10 }
          };
          return agentSpaceManager.spawnAgent(config);
        })
      );

      expect(votingAgents.every(result => result.success)).toBe(true);

      // Initiate consensus vote
      const consensusProposal = {
        id: 'test-consensus-001',
        type: 'resource_allocation',
        proposal: {
          action: 'increase_memory_limit',
          parameters: { newLimit: 40960 },
          justification: 'High memory usage detected'
        },
        votingMethod: 'majority',
        timeout: 10000
      };

      const consensusResult = await agentCoordinator.initiateConsensus(consensusProposal);
      expect(consensusResult.success).toBe(true);
      expect(consensusResult.data.consensusReached).toBe(true);
      expect(consensusResult.data.votes.total).toBe(5);
      expect(consensusResult.data.votes.yes).toBeGreaterThan(consensusResult.data.votes.no);

      // Validate proposal execution
      expect(consensusResult.data.proposalExecuted).toBe(true);
      expect(consensusResult.data.executionResult.success).toBe(true);
    });

    it('should handle network partitions and healing', async () => {
      // Create agents in different network segments
      const segment1Agents = ['partition-agent-1', 'partition-agent-2'];
      const segment2Agents = ['partition-agent-3', 'partition-agent-4'];

      await Promise.all([
        ...segment1Agents.map(id => agentSpaceManager.spawnAgent({
          id,
          type: 'worker',
          capabilities: ['partition-testing'],
          resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
          communication: { protocols: ['direct'], maxConnections: 5 }
        })),
        ...segment2Agents.map(id => agentSpaceManager.spawnAgent({
          id,
          type: 'worker',
          capabilities: ['partition-testing'],
          resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
          communication: { protocols: ['direct'], maxConnections: 5 }
        }))
      ]);

      // Simulate network partition
      await communicationHub.simulateNetworkPartition(segment1Agents, segment2Agents);

      // Validate partition detection
      const partitionStatus = await communicationHub.getPartitionStatus();
      expect(partitionStatus.partitioned).toBe(true);
      expect(partitionStatus.segments).toHaveLength(2);

      // Test communication during partition
      const crossSegmentMessage = {
        from: segment1Agents[0],
        to: segment2Agents[0],
        type: 'direct',
        content: { test: 'cross_segment_communication' }
      };

      const partitionedCommResult = await communicationHub.sendMessage(crossSegmentMessage);
      expect(partitionedCommResult.success).toBe(false);
      expect(partitionedCommResult.error.code).toBe('NETWORK_PARTITION');

      // Heal partition
      await communicationHub.healNetworkPartition();

      // Validate healing
      const healedStatus = await communicationHub.getPartitionStatus();
      expect(healedStatus.partitioned).toBe(false);

      // Test communication after healing
      const healedCommResult = await communicationHub.sendMessage(crossSegmentMessage);
      expect(healedCommResult.success).toBe(true);
      expect(healedCommResult.data.delivered).toBe(true);
    });
  });

  describe('Resource Management', () => {
    it('should allocate resources fairly among agents', async () => {
      const resourceDemandingAgents = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const config = {
            id: `resource-agent-${i}`,
            type: 'worker',
            capabilities: ['resource-intensive'],
            resources: { 
              cpu: 2 + i, // Varying resource demands
              memory: 2048 * (i + 1), 
              priority: i % 2 === 0 ? 'high' as const : 'medium' as const 
            },
            communication: { protocols: ['direct'], maxConnections: 5 }
          };
          return agentSpaceManager.spawnAgent(config);
        })
      );

      expect(resourceDemandingAgents.every(result => result.success)).toBe(true);

      // Check resource allocation
      const allocationReport = await resourceManager.generateAllocationReport();
      
      expect(allocationReport.totalAllocatedCpu).toBeLessThanOrEqual(16); // Total CPU limit
      expect(allocationReport.totalAllocatedMemory).toBeLessThanOrEqual(32768); // Total memory limit
      expect(allocationReport.utilizationEfficiency).toBeGreaterThan(0.7);

      // Validate fair share algorithm
      expect(allocationReport.fairnessIndex).toBeGreaterThan(0.8); // Jain's fairness index
      expect(allocationReport.priorityRespected).toBe(true);
    });

    it('should handle resource contention and preemption', async () => {
      // Allocate most resources to low-priority agents
      const lowPriorityAgents = await Promise.all(
        Array.from({ length: 3 }, async (_, i) => {
          const config = {
            id: `low-priority-${i}`,
            type: 'worker',
            capabilities: ['background-processing'],
            resources: { cpu: 4, memory: 8192, priority: 'low' as const },
            communication: { protocols: ['direct'], maxConnections: 5 }
          };
          return agentSpaceManager.spawnAgent(config);
        })
      );

      expect(lowPriorityAgents.every(result => result.success)).toBe(true);

      // Spawn high-priority agent that needs resources
      const highPriorityConfig = {
        id: 'high-priority-urgent',
        type: 'coordinator',
        capabilities: ['urgent-processing'],
        resources: { cpu: 6, memory: 10240, priority: 'high' as const },
        communication: { protocols: ['direct', 'broadcast'], maxConnections: 10 }
      };

      const highPriorityResult = await agentSpaceManager.spawnAgent(highPriorityConfig);
      expect(highPriorityResult.success).toBe(true);

      // Check if preemption occurred
      const preemptionReport = await resourceManager.getPreemptionReport();
      expect(preemptionReport.preemptionOccurred).toBe(true);
      expect(preemptionReport.preemptedAgents.length).toBeGreaterThan(0);
      expect(preemptionReport.highPriorityAgentAllocated).toBe(true);

      // Validate that high-priority agent got resources
      const highPriorityResources = await resourceManager.getAgentResources(highPriorityConfig.id);
      expect(highPriorityResources.cpu).toBe(6);
      expect(highPriorityResources.memory).toBe(10240);
    });

    it('should support dynamic resource adjustment', async () => {
      const adaptiveAgentConfig = {
        id: 'adaptive-resource-agent',
        type: 'worker',
        capabilities: ['adaptive-processing'],
        resources: { cpu: 2, memory: 2048, priority: 'medium' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      };

      await agentSpaceManager.spawnAgent(adaptiveAgentConfig);

      // Simulate varying workload
      const workloadPhases = [
        { phase: 'light', cpuNeed: 1, memoryNeed: 1024, duration: 3000 },
        { phase: 'heavy', cpuNeed: 4, memoryNeed: 6144, duration: 5000 },
        { phase: 'moderate', cpuNeed: 2, memoryNeed: 3072, duration: 3000 }
      ];

      for (const phase of workloadPhases) {
        // Request resource adjustment
        const adjustmentRequest = {
          agentId: adaptiveAgentConfig.id,
          newRequirements: {
            cpu: phase.cpuNeed,
            memory: phase.memoryNeed
          },
          reason: `workload_phase_${phase.phase}`
        };

        const adjustmentResult = await resourceManager.adjustAgentResources(adjustmentRequest);
        expect(adjustmentResult.success).toBe(true);

        // Validate new allocation
        const currentResources = await resourceManager.getAgentResources(adaptiveAgentConfig.id);
        expect(currentResources.cpu).toBe(phase.cpuNeed);
        expect(currentResources.memory).toBe(phase.memoryNeed);

        await new Promise(resolve => setTimeout(resolve, phase.duration));
      }
    });
  });

  describe('Task Orchestration', () => {
    it('should orchestrate complex multi-agent tasks', async () => {
      // Spawn specialized agents
      const specializedAgents = await Promise.all([
        agentSpaceManager.spawnAgent({
          id: 'data-collector',
          type: 'specialist',
          capabilities: ['data-collection', 'web-scraping'],
          resources: { cpu: 2, memory: 4096, priority: 'medium' as const },
          communication: { protocols: ['direct'], maxConnections: 10 }
        }),
        agentSpaceManager.spawnAgent({
          id: 'data-processor',
          type: 'specialist',
          capabilities: ['data-processing', 'analytics'],
          resources: { cpu: 3, memory: 6144, priority: 'medium' as const },
          communication: { protocols: ['direct'], maxConnections: 10 }
        }),
        agentSpaceManager.spawnAgent({
          id: 'report-generator',
          type: 'specialist',
          capabilities: ['report-generation', 'visualization'],
          resources: { cpu: 2, memory: 3072, priority: 'medium' as const },
          communication: { protocols: ['direct'], maxConnections: 10 }
        })
      ]);

      expect(specializedAgents.every(result => result.success)).toBe(true);

      // Define complex task workflow
      const complexTask: TaskTestConfig = {
        id: 'data-analysis-pipeline',
        type: 'multi-stage-workflow',
        requirements: ['data-collection', 'data-processing', 'report-generation'],
        constraints: {
          maxDuration: 60000, // 1 minute
          resourceLimits: { totalCpu: 8, totalMemory: 16384 },
          dependencies: ['data-collection->data-processing', 'data-processing->report-generation']
        },
        priority: 'high'
      };

      const orchestrationResult = await taskOrchestrator.orchestrateTask(complexTask);
      expect(orchestrationResult.success).toBe(true);
      expect(orchestrationResult.data.stages).toHaveLength(3);
      expect(orchestrationResult.data.totalDuration).toBeLessThan(60000);

      // Validate task execution flow
      const executionFlow = orchestrationResult.data.executionFlow;
      expect(executionFlow[0].agentId).toBe('data-collector');
      expect(executionFlow[1].agentId).toBe('data-processor');
      expect(executionFlow[2].agentId).toBe('report-generator');

      // Validate dependencies were respected
      expect(executionFlow[1].startTime).toBeGreaterThan(executionFlow[0].endTime);
      expect(executionFlow[2].startTime).toBeGreaterThan(executionFlow[1].endTime);
    });

    it('should handle task failure and recovery', async () => {
      const reliableAgent = await agentSpaceManager.spawnAgent({
        id: 'reliable-worker',
        type: 'worker',
        capabilities: ['fault-tolerant-processing'],
        resources: { cpu: 2, memory: 2048, priority: 'medium' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      });

      const faultyAgent = await agentSpaceManager.spawnAgent({
        id: 'faulty-worker',
        type: 'worker',
        capabilities: ['fault-tolerant-processing'],
        resources: { cpu: 2, memory: 2048, priority: 'medium' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      });

      expect(reliableAgent.success).toBe(true);
      expect(faultyAgent.success).toBe(true);

      // Create task with fault tolerance
      const faultTolerantTask = {
        id: 'fault-tolerant-task',
        type: 'critical-processing',
        requirements: ['fault-tolerant-processing'],
        constraints: {
          maxDuration: 30000,
          resourceLimits: {},
          dependencies: []
        },
        priority: 'high' as const,
        faultTolerance: {
          maxRetries: 3,
          backupAgents: ['reliable-worker'],
          failoverStrategy: 'immediate'
        }
      };

      // Simulate failure in primary agent
      setTimeout(async () => {
        await mockAgentProvider.simulateAgentFailure('faulty-worker', 'processing_error');
      }, 2000);

      const executionResult = await taskOrchestrator.executeTask(faultTolerantTask, 'faulty-worker');

      expect(executionResult.success).toBe(true);
      expect(executionResult.data.failoverOccurred).toBe(true);
      expect(executionResult.data.completedByAgent).toBe('reliable-worker');
      expect(executionResult.data.retryCount).toBeGreaterThan(0);
    });

    it('should optimize task scheduling and load balancing', async () => {
      // Spawn multiple worker agents
      const workers = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const config = {
            id: `load-balanced-worker-${i}`,
            type: 'worker',
            capabilities: ['parallel-processing'],
            resources: { cpu: 2, memory: 2048, priority: 'medium' as const },
            communication: { protocols: ['direct'], maxConnections: 5 }
          };
          return agentSpaceManager.spawnAgent(config);
        })
      );

      expect(workers.every(result => result.success)).toBe(true);

      // Create multiple parallel tasks
      const parallelTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `parallel-task-${i}`,
        type: 'parallel-processing',
        requirements: ['parallel-processing'],
        constraints: {
          maxDuration: 5000,
          resourceLimits: { cpu: 1, memory: 512 },
          dependencies: []
        },
        priority: 'medium' as const,
        estimatedDuration: 2000 + Math.random() * 3000
      }));

      const schedulingStartTime = performance.now();
      const schedulingResults = await Promise.all(
        parallelTasks.map(task => taskOrchestrator.scheduleTask(task))
      );
      const schedulingDuration = performance.now() - schedulingStartTime;

      expect(schedulingResults.every(result => result.success)).toBe(true);

      // Validate load balancing
      const loadReport = await taskOrchestrator.getLoadBalancingReport();
      expect(loadReport.distributionEfficiency).toBeGreaterThan(0.8);
      expect(loadReport.agentUtilization.variance).toBeLessThan(0.2); // Even distribution
      expect(loadReport.averageWaitTime).toBeLessThan(1000); // < 1 second wait

      // Validate scheduling performance
      expect(schedulingDuration).toBeLessThan(5000); // Schedule 20 tasks in < 5 seconds
    });
  });

  describe('Fault Tolerance and Recovery', () => {
    it('should handle cascading failures gracefully', async () => {
      // Create interdependent agent network
      const networkAgents = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const config = {
            id: `network-agent-${i}`,
            type: 'worker',
            capabilities: ['network-processing'],
            resources: { cpu: 1, memory: 1024, priority: 'medium' as const },
            communication: { protocols: ['direct'], maxConnections: 10 }
          };
          return agentSpaceManager.spawnAgent(config);
        })
      );

      expect(networkAgents.every(result => result.success)).toBe(true);

      // Create dependencies between agents
      const dependencies = [
        { from: 'network-agent-0', to: ['network-agent-1', 'network-agent-2'] },
        { from: 'network-agent-1', to: ['network-agent-3'] },
        { from: 'network-agent-2', to: ['network-agent-4'] },
        { from: 'network-agent-3', to: ['network-agent-5'] },
        { from: 'network-agent-4', to: ['network-agent-5'] }
      ];

      await agentCoordinator.establishDependencies(dependencies);

      // Simulate failure of critical agent
      const cascadeStartTime = performance.now();
      await mockAgentProvider.simulateAgentFailure('network-agent-1', 'critical_error');

      // Monitor cascade containment
      const cascadeReport = await agentCoordinator.monitorCascadeFailure({
        timeout: 10000,
        containmentStrategy: 'isolation'
      });

      const cascadeDuration = performance.now() - cascadeStartTime;

      expect(cascadeReport.cascadeContained).toBe(true);
      expect(cascadeReport.affectedAgents.length).toBeLessThan(6); // Not all agents failed
      expect(cascadeReport.recoveryInitiated).toBe(true);
      expect(cascadeDuration).toBeLessThan(10000); // Contained within 10 seconds

      // Validate system resilience
      const systemHealth = await agentSpaceManager.getSystemHealth();
      expect(systemHealth.overallHealth).toBeGreaterThan(0.6); // System partially functional
      expect(systemHealth.criticalServicesOnline).toBe(true);
    });

    it('should support checkpoint and rollback mechanisms', async () => {
      const checkpointAgent = await agentSpaceManager.spawnAgent({
        id: 'checkpoint-agent',
        type: 'worker',
        capabilities: ['stateful-processing'],
        resources: { cpu: 2, memory: 4096, priority: 'medium' as const },
        communication: { protocols: ['direct'], maxConnections: 5 }
      });

      expect(checkpointAgent.success).toBe(true);

      // Create checkpoint before risky operation
      const checkpointResult = await agentSpaceManager.createCheckpoint({
        agentId: 'checkpoint-agent',
        checkpointType: 'full_state',
        metadata: { operation: 'risky_processing' }
      });

      expect(checkpointResult.success).toBe(true);
      expect(checkpointResult.data.checkpointId).toBeDefined();

      // Perform risky operation
      const riskyTask = {
        id: 'risky-operation',
        type: 'high-risk-processing',
        requirements: ['stateful-processing'],
        constraints: { maxDuration: 10000, resourceLimits: {}, dependencies: [] },
        priority: 'medium' as const
      };

      // Simulate operation failure
      setTimeout(async () => {
        await mockAgentProvider.simulateAgentCorruption('checkpoint-agent');
      }, 3000);

      const operationResult = await taskOrchestrator.executeTask(riskyTask, 'checkpoint-agent');

      if (!operationResult.success) {
        // Rollback to checkpoint
        const rollbackResult = await agentSpaceManager.rollbackToCheckpoint({
          agentId: 'checkpoint-agent',
          checkpointId: checkpointResult.data.checkpointId
        });

        expect(rollbackResult.success).toBe(true);
        expect(rollbackResult.data.stateRestored).toBe(true);

        // Validate agent is functional after rollback
        const postRollbackHealth = await agentSpaceManager.getAgentHealth('checkpoint-agent');
        expect(postRollbackHealth.healthScore).toBeGreaterThan(0.9);
      }
    });
  });

  // Helper functions
  async function generateAgentConfigs(): Promise<AgentTestConfig[]> {
    return [
      {
        id: 'test-coordinator',
        type: 'coordinator',
        capabilities: ['coordination', 'leadership'],
        resources: { cpu: 2, memory: 4096, priority: 'high' },
        communication: { protocols: ['direct', 'broadcast'], maxConnections: 20 }
      },
      {
        id: 'test-worker',
        type: 'worker',
        capabilities: ['processing', 'analysis'],
        resources: { cpu: 1, memory: 2048, priority: 'medium' },
        communication: { protocols: ['direct'], maxConnections: 10 }
      }
    ];
  }

  async function generateTaskTemplates(): Promise<TaskTestConfig[]> {
    return [
      {
        id: 'data-processing-template',
        type: 'data-processing',
        requirements: ['processing'],
        constraints: { maxDuration: 30000, resourceLimits: {}, dependencies: [] },
        priority: 'medium'
      }
    ];
  }
});
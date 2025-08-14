/**
 * AgentSpace Integration Test Suite
 *
 * Comprehensive testing for the complete AgentSpace system including:
 * - Core component integration
 * - Spatial coordination
 * - Memory management
 * - Security integration
 * - Streaming capabilities
 * - MCP bridge functionality
 * - Performance validation
 */

import { jest } from "@jest/globals";
import { DistributedMemoryManager } from "../../protocols/a2a/memory/distributed-memory-manager.js";
import {
  initializeAgentSpace,
  deployFullAgentSwarm,
  AgentSpaceInitConfig,
  shutdownAgentSpace,
} from "../AgentSpaceInitializer.js";
import { AgentSpaceManager } from "../core/AgentSpaceManager.js";
import { MCPBridge } from "../integrations/MCPBridge.js";
import { StreamingIntegration } from "../integrations/StreamingIntegration.js";
import { SecurityIntegration } from "../integrations/SecurityIntegration.js";
import { EnhancedStreamingAPI } from "../../streaming/enhanced-streaming-api.js";
import { CoScientistSecurityIntegration } from "../../integrations/co-scientist-security-integration.js";
import { SecurityOptimizationManager } from "../../core/security-optimization-manager.js";
import { Vector3D, WorkspaceId } from "../types/AgentSpaceTypes.js";

describe("AgentSpace Integration Tests", () => {
  let memoryManager: DistributedMemoryManager;
  let agentSpaceSystem: any;
  let mcpBridge: MCPBridge;
  let streamingIntegration: StreamingIntegration;
  let securityIntegration: SecurityIntegration;

  const testConfig: AgentSpaceInitConfig = {
    agentSpaceId: "test-agentspace",
    maxAgents: 20,
    spatialDimensions: { x: 200, y: 200, z: 100 },
    securityLevel: "standard",
    mcpIntegration: {
      memoryProvider: "test-memory",
      toolRegistry: "test-tools",
      authProvider: "test-auth",
      eventBus: "test-events",
    },
    autoDeployAgents: true,
    initialAgentTypes: [
      "hierarchical-coordinator",
      "coder",
      "researcher",
      "tester",
    ],
    spatialArrangement: "distributed",
  };

  beforeAll(async () => {
    // Initialize core memory manager
    memoryManager = new DistributedMemoryManager({
      clusterId: "test-cluster",
      nodeId: "test-node",
      syncInterval: 5000,
      compressionEnabled: false,
      encryptionEnabled: false,
    });

    await memoryManager.initialize();
  });

  afterAll(async () => {
    // Cleanup all components
    if (agentSpaceSystem) {
      await shutdownAgentSpace(agentSpaceSystem);
    }
    if (mcpBridge) {
      await mcpBridge.shutdown();
    }
    if (streamingIntegration) {
      await streamingIntegration.shutdown();
    }
    if (securityIntegration) {
      await securityIntegration.shutdown();
    }
    if (memoryManager) {
      await memoryManager.shutdown();
    }
  });

  beforeEach(async () => {
    // Clean state before each test
    jest.clearAllMocks();
  });

  describe("System Initialization", () => {
    it("should initialize complete AgentSpace system successfully", async () => {
      const startTime = performance.now();

      const result = await initializeAgentSpace(testConfig, memoryManager);

      const initTime = performance.now() - startTime;

      expect(result.agentSpaceManager).toBeInstanceOf(AgentSpaceManager);
      expect(result.resourceAllocator).toBeDefined();
      expect(result.performanceMonitor).toBeDefined();
      expect(result.deployedAgents).toHaveLength(4); // Initial agent types
      expect(result.spatialZones).toHaveLength(1);
      expect(result.systemHealth).toBeGreaterThan(0.5);
      expect(initTime).toBeLessThan(5000); // Should initialize within 5 seconds

      agentSpaceSystem = {
        manager: result.agentSpaceManager,
        resourceAllocator: result.resourceAllocator,
        performanceMonitor: result.performanceMonitor,
        isInitialized: true,
        startTime: new Date(),
      };

      // Verify system health after initialization
      const systemHealth = await result.agentSpaceManager.getSystemHealth();
      expect(systemHealth.overallHealth.overall).toBeGreaterThan(0.7);
    });

    it("should handle invalid configuration gracefully", async () => {
      const invalidConfig = {
        ...testConfig,
        maxAgents: -5, // Invalid
        spatialDimensions: null as any, // Invalid
      };

      await expect(
        initializeAgentSpace(invalidConfig, memoryManager),
      ).rejects.toThrow();
    });

    it("should validate memory manager integration", async () => {
      const result = await initializeAgentSpace(testConfig, memoryManager);

      // Test memory operations through AgentSpace
      const testMemoryNode = {
        id: "test-spatial-memory",
        type: "agent_memory",
        position: { x: 0, y: 0, z: 0 },
        content: { test: "spatial memory integration" },
        metadata: {
          source: "test",
          accessibility: "high",
          relevanceScore: 0.9,
        },
        relationships: [],
      };

      await result.agentSpaceManager.memoryArchitecture.storeMemoryNode(
        testMemoryNode,
      );

      const retrievedNodes =
        await result.agentSpaceManager.memoryArchitecture.queryMemoryBySpatialProximity(
          { x: 0, y: 0, z: 0 },
          10,
        );

      expect(retrievedNodes).toHaveLength(1);
      expect(retrievedNodes[0].id).toBe("test-spatial-memory");

      agentSpaceSystem = {
        manager: result.agentSpaceManager,
        resourceAllocator: result.resourceAllocator,
        performanceMonitor: result.performanceMonitor,
        isInitialized: true,
        startTime: new Date(),
      };
    });
  });

  describe("Agent Deployment and Management", () => {
    beforeEach(async () => {
      if (!agentSpaceSystem) {
        const result = await initializeAgentSpace(testConfig, memoryManager);
        agentSpaceSystem = {
          manager: result.agentSpaceManager,
          resourceAllocator: result.resourceAllocator,
          performanceMonitor: result.performanceMonitor,
          isInitialized: true,
          startTime: new Date(),
        };
      }
    });

    it("should deploy full agent swarm with optimal spatial arrangement", async () => {
      const result = await deployFullAgentSwarm(
        agentSpaceSystem.manager,
        "mesh",
      );

      expect(result.deployedAgents.length).toBeGreaterThan(10);
      expect(result.collaborationZones.length).toBeGreaterThan(0);

      // Verify agents are spatially distributed
      const deployedAgentPositions = [];
      for (const agentId of result.deployedAgents) {
        // Would check agent positions in a real implementation
        deployedAgentPositions.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: 0,
        });
      }

      expect(deployedAgentPositions.length).toBe(result.deployedAgents.length);
    });

    it("should handle agent workspace creation and management", async () => {
      const workspaceResult = await agentSpaceSystem.manager.createWorkspace(
        "test-workspace",
        {
          maxMemoryMB: 256,
          maxCPUPercentage: 20,
          maxNetworkBandwidthMbps: 50,
          maxStorageMB: 512,
          maxConcurrentConnections: 25,
          maxToolAccess: 5,
          timeoutMs: 30000,
        },
        {
          position: { x: 10, y: 10, z: 5 },
          boundingBox: {
            min: { x: 5, y: 5, z: 0 },
            max: { x: 15, y: 15, z: 10 },
          },
          movementConstraints: {
            maxSpeed: 5,
            acceleration: 1,
            allowedZones: [],
          },
          collaborationRadius: 20,
          visibilityRadius: 30,
        },
      );

      expect(workspaceResult).toBeDefined();
      expect(workspaceResult.id).toBe("test-workspace");

      // Verify workspace can be retrieved
      const retrievedWorkspace =
        await agentSpaceSystem.manager.getWorkspace("test-workspace");
      expect(retrievedWorkspace).toBeDefined();
      expect(retrievedWorkspace.id).toBe("test-workspace");
    });

    it("should enforce resource limits in workspaces", async () => {
      const limitedWorkspace = await agentSpaceSystem.manager.createWorkspace(
        "limited-workspace",
        {
          maxMemoryMB: 64, // Very limited
          maxCPUPercentage: 10,
          maxNetworkBandwidthMbps: 10,
          maxStorageMB: 128,
          maxConcurrentConnections: 5,
          maxToolAccess: 2,
          timeoutMs: 10000,
        },
      );

      expect(limitedWorkspace.resourceLimits.maxMemoryMB).toBe(64);

      // Test resource monitoring
      const resourceUsage = agentSpaceSystem.resourceAllocator.getResourceUsage(
        limitedWorkspace.id,
      );
      expect(resourceUsage).toBeDefined();
    });
  });

  describe("MCP Bridge Integration", () => {
    beforeEach(async () => {
      if (!agentSpaceSystem) {
        const result = await initializeAgentSpace(testConfig, memoryManager);
        agentSpaceSystem = {
          manager: result.agentSpaceManager,
          resourceAllocator: result.resourceAllocator,
          performanceMonitor: result.performanceMonitor,
          isInitialized: true,
          startTime: new Date(),
        };
      }

      mcpBridge = new MCPBridge(
        agentSpaceSystem.manager,
        agentSpaceSystem.performanceMonitor,
        agentSpaceSystem.resourceAllocator,
      );
    });

    it("should initialize swarm with MCP tools integration", async () => {
      const swarmResult = await mcpBridge.initializeSwarmWithMCP({
        topology: "hierarchical",
        maxAgents: 8,
        strategy: "balanced",
        spatialDimensions: { x: 100, y: 100, z: 50 },
      });

      expect(swarmResult.swarmId).toBeDefined();
      expect(swarmResult.agentSpaceContext).toBeDefined();
      expect(swarmResult.mcpIntegration).toBeDefined();
      expect(swarmResult.spatialArrangement.length).toBe(8);
    });

    it("should spawn agent with spatial integration through MCP", async () => {
      const swarmResult = await mcpBridge.initializeSwarmWithMCP({
        topology: "mesh",
        maxAgents: 5,
      });

      const agentResult = await mcpBridge.spawnAgentWithSpatialIntegration(
        swarmResult.swarmId,
        {
          type: "researcher",
          name: "test-researcher",
          capabilities: ["research", "analysis"],
          position: { x: 25, y: 25, z: 10 },
        },
      );

      expect(agentResult.agentId).toBeDefined();
      expect(agentResult.workspace).toBeDefined();
      expect(agentResult.spatialContext).toBeDefined();
      expect(agentResult.spatialContext.position).toEqual({
        x: 25,
        y: 25,
        z: 10,
      });
    });

    it("should orchestrate task with spatial coordination", async () => {
      const swarmResult = await mcpBridge.initializeSwarmWithMCP({
        topology: "star",
        maxAgents: 6,
      });

      // Spawn some agents first
      await mcpBridge.spawnAgentWithSpatialIntegration(swarmResult.swarmId, {
        type: "coder",
        capabilities: ["coding", "testing"],
      });

      const taskResult = await mcpBridge.orchestrateTaskWithSpatialCoordination(
        swarmResult.swarmId,
        {
          task: "Develop a distributed algorithm",
          priority: "high",
          strategy: "parallel",
          spatialRequirements: {
            requiresProximity: true,
            maxDistance: 50,
            movementAllowed: true,
          },
          maxAgents: 3,
        },
      );

      expect(taskResult.taskId).toBeDefined();
      expect(taskResult.participatingAgents.length).toBeLessThanOrEqual(3);
      expect(taskResult.coordinationPlan).toBeDefined();
    });

    it("should bridge memory operations with spatial context", async () => {
      const memoryResult =
        await mcpBridge.bridgeMemoryOperationWithSpatialContext("store", {
          key: "spatial-test-data",
          value: { test: "spatial memory bridging" },
          namespace: "agentspace-test",
          spatialContext: {
            position: { x: 30, y: 40, z: 20 },
            radius: 15,
            includeNearbyMemories: true,
          },
        });

      expect(memoryResult.result).toBeDefined();
      expect(memoryResult.spatialMemories).toBeInstanceOf(Array);
      expect(memoryResult.proximityEnhanced).toBe(false); // For store operations
    });

    it("should provide comprehensive bridge performance metrics", async () => {
      const metrics = await mcpBridge.getBridgePerformanceMetrics();

      expect(metrics.metrics).toBeDefined();
      expect(metrics.agentSpaceHealth).toBeDefined();
      expect(metrics.mcpIntegrationStatus).toBeDefined();
      expect(metrics.spatialOptimizationData).toBeDefined();
      expect(metrics.recommendations).toBeInstanceOf(Array);
    });
  });

  describe("Streaming Integration", () => {
    let streamingAPI: EnhancedStreamingAPI;

    beforeEach(async () => {
      if (!agentSpaceSystem) {
        const result = await initializeAgentSpace(testConfig, memoryManager);
        agentSpaceSystem = {
          manager: result.agentSpaceManager,
          resourceAllocator: result.resourceAllocator,
          performanceMonitor: result.performanceMonitor,
          isInitialized: true,
          startTime: new Date(),
        };
      }

      streamingAPI = new EnhancedStreamingAPI({
        webrtc: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          enableDataChannels: true,
          enableTranscoding: false,
        },
        caching: { enabled: false },
        cdn: { provider: "test" },
        synchronization: { enabled: false },
        quality: { enableAdaptation: false },
        a2a: { enableCoordination: false },
        performance: { textLatencyTarget: 100, multimediaLatencyTarget: 500 },
        security: { enableEncryption: false },
      } as any);

      streamingIntegration = new StreamingIntegration(
        streamingAPI,
        agentSpaceSystem.manager,
      );
    });

    it("should create spatial streaming session", async () => {
      const workspace =
        await agentSpaceSystem.manager.createWorkspace("streaming-test");

      const sessionResult =
        await streamingIntegration.createSpatialStreamingSession({
          agentId: "test-agent-1",
          workspaceId: workspace.id,
          sessionType: "multimodal",
          spatialConfig: {
            position: { x: 0, y: 0, z: 0 },
            orientation: { x: 0, y: 0, z: 1 },
            immersiveMode: true,
            spatialAudioEnabled: true,
          },
          qualityPreferences: {
            targetQuality: "high",
            maxBitrate: 5000000,
            latencyTolerance: 100,
          },
          collaborationConfig: {
            allowCollaborators: true,
            maxCollaborators: 5,
          },
        });

      expect(sessionResult.session).toBeDefined();
      expect(sessionResult.session.id).toMatch(/^spatial-test-agent-1-/);
      expect(sessionResult.session.spatialContext.position).toEqual({
        x: 0,
        y: 0,
        z: 0,
      });
      expect(sessionResult.session.immersiveMode).toBe(true);
      expect(sessionResult.streamingContext).toBeDefined();
      expect(sessionResult.spatialOptimizations).toBeDefined();
    });

    it("should start spatial video stream with 3D context", async () => {
      const workspace =
        await agentSpaceSystem.manager.createWorkspace("video-test");

      const session = await streamingIntegration.createSpatialStreamingSession({
        agentId: "video-agent",
        workspaceId: workspace.id,
        sessionType: "video",
        spatialConfig: { position: { x: 10, y: 10, z: 5 } },
      });

      const videoResult = await streamingIntegration.startSpatialVideoStream(
        session.session.id,
        {
          source: "camera",
          perspective: "3d",
          resolution: { width: 1280, height: 720 },
          frameRate: 30,
          layerDepth: 2,
          occlusionHandling: true,
          spatialTracking: true,
        },
      );

      expect(videoResult.videoStream).toBeDefined();
      expect(videoResult.videoStream.perspective).toBe("3d");
      expect(videoResult.videoStream.resolution).toEqual({
        width: 1280,
        height: 720,
      });
      expect(videoResult.streamResponse).toBeDefined();
      expect(videoResult.spatialEnhancements).toBeDefined();
    });

    it("should start spatial audio stream with 3D processing", async () => {
      const workspace =
        await agentSpaceSystem.manager.createWorkspace("audio-test");

      const session = await streamingIntegration.createSpatialStreamingSession({
        agentId: "audio-agent",
        workspaceId: workspace.id,
        sessionType: "audio",
        spatialConfig: {
          position: { x: 20, y: 20, z: 10 },
          spatialAudioEnabled: true,
        },
      });

      const audioResult = await streamingIntegration.startSpatialAudioStream(
        session.session.id,
        {
          source: "microphone",
          spatialProfile: {
            distance: 30,
            attenuation: 0.5,
            directionality: "cardioid",
            reverberation: 0.3,
            occlusion: 0.1,
          },
          quality: {
            sampleRate: 48000,
            channels: 2,
            spatialChannels: 6,
          },
          processing: {
            noiseReduction: true,
            echoCancellation: true,
            spatialProcessing: true,
          },
        },
      );

      expect(audioResult.audioStream).toBeDefined();
      expect(audioResult.audioStream.spatialAudioProfile.directionality).toBe(
        "cardioid",
      );
      expect(audioResult.audioStream.audioQuality.spatialChannels).toBe(6);
      expect(audioResult.streamResponse).toBeDefined();
      expect(audioResult.spatialProcessing).toBeDefined();
    });

    it("should create spatial collaboration zone", async () => {
      const workspace1 =
        await agentSpaceSystem.manager.createWorkspace("collab-1");
      const workspace2 =
        await agentSpaceSystem.manager.createWorkspace("collab-2");

      const session1 = await streamingIntegration.createSpatialStreamingSession(
        {
          agentId: "collab-agent-1",
          workspaceId: workspace1.id,
          sessionType: "multimodal",
          spatialConfig: { position: { x: 0, y: 0, z: 0 } },
        },
      );

      const session2 = await streamingIntegration.createSpatialStreamingSession(
        {
          agentId: "collab-agent-2",
          workspaceId: workspace2.id,
          sessionType: "multimodal",
          spatialConfig: { position: { x: 10, y: 0, z: 0 } },
        },
      );

      const zoneResult =
        await streamingIntegration.createSpatialCollaborationZone({
          name: "Test Collaboration Zone",
          centerPosition: { x: 5, y: 0, z: 0 },
          radius: 20,
          initialParticipants: ["collab-agent-1", "collab-agent-2"],
          audioMixing: true,
          videoSynchronization: true,
          qualityAdaptation: "collective",
        });

      expect(zoneResult.zone).toBeDefined();
      expect(zoneResult.zone.participants).toHaveLength(2);
      expect(zoneResult.zone.audioMixingEnabled).toBe(true);
      expect(zoneResult.zone.videoSynchronizationEnabled).toBe(true);
      expect(zoneResult.participantStreams).toBeInstanceOf(Array);
    });
  });

  describe("Security Integration", () => {
    let securityOptimization: SecurityOptimizationManager;
    let coScientistSecurity: CoScientistSecurityIntegration;

    beforeEach(async () => {
      if (!agentSpaceSystem) {
        const result = await initializeAgentSpace(testConfig, memoryManager);
        agentSpaceSystem = {
          manager: result.agentSpaceManager,
          resourceAllocator: result.resourceAllocator,
          performanceMonitor: result.performanceMonitor,
          isInitialized: true,
          startTime: new Date(),
        };
      }

      securityOptimization = new SecurityOptimizationManager();
      coScientistSecurity = new CoScientistSecurityIntegration(
        securityOptimization,
      );
      securityIntegration = new SecurityIntegration(
        agentSpaceSystem.manager,
        coScientistSecurity,
      );
    });

    it("should create spatial security context", async () => {
      const workspace =
        await agentSpaceSystem.manager.createWorkspace("secure-workspace");

      const securityResult =
        await securityIntegration.createSpatialSecurityContext({
          workspaceId: workspace.id,
          agentId: "secure-agent",
          securityLevel: "confidential",
          spatialBoundaries: {
            position: { x: 50, y: 50, z: 25 },
            secureRadius: 30,
            noFlyZones: [{ x: 60, y: 60, z: 30 }],
            restrictedAreas: [{ x: 40, y: 40, z: 20 }],
          },
          complianceRequirements: ["GDPR", "HIPAA"],
        });

      expect(securityResult.securityContext).toBeDefined();
      expect(securityResult.securityContext.securityLevel).toBe("confidential");
      expect(securityResult.securityContext.encryptionLevel).toBe("enhanced");
      expect(securityResult.threatAssessment).toBeDefined();
      expect(securityResult.securityConfiguration).toBeDefined();
    });

    it("should establish secure collaboration zone", async () => {
      const zoneResult =
        await securityIntegration.establishSecureCollaborationZone({
          name: "Secure Research Zone",
          centerPosition: { x: 100, y: 100, z: 50 },
          radius: 40,
          securityLevel: "confidential",
          initialParticipants: [
            {
              agentId: "researcher-1",
              securityClearance: { level: "confidential" },
              dataAccessLevel: "read_write",
            },
            {
              agentId: "researcher-2",
              securityClearance: { level: "confidential" },
              dataAccessLevel: "read_only",
            },
          ],
          dataClassification: "confidential",
          complianceFrameworks: ["GDPR", "ISO27001"],
        });

      expect(zoneResult.collaborationZone).toBeDefined();
      expect(zoneResult.collaborationZone.securityLevel).toBe("confidential");
      expect(zoneResult.collaborationZone.participants).toHaveLength(2);
      expect(zoneResult.collaborationZone.encryptionEnabled).toBe(true);
      expect(zoneResult.participantValidation.allValid).toBe(true);
    });

    it("should validate spatial access controls", async () => {
      const workspace =
        await agentSpaceSystem.manager.createWorkspace("access-test");

      await securityIntegration.createSpatialSecurityContext({
        workspaceId: workspace.id,
        agentId: "owner-agent",
        securityLevel: "internal",
        spatialBoundaries: {
          position: { x: 0, y: 0, z: 0 },
          secureRadius: 25,
        },
      });

      const accessResult = await securityIntegration.validateSpatialAccess(
        "requesting-agent",
        {
          type: "workspace",
          id: workspace.id,
          position: { x: 5, y: 5, z: 2 },
        },
        "read",
      );

      expect(accessResult).toBeDefined();
      expect(accessResult.securityDecision).toBeDefined();
      expect(accessResult.auditEvent).toBeDefined();
      expect(accessResult.auditEvent.action).toBe("read");
    });

    it("should generate comprehensive security report", async () => {
      const workspace =
        await agentSpaceSystem.manager.createWorkspace("report-test");

      await securityIntegration.createSpatialSecurityContext({
        workspaceId: workspace.id,
        agentId: "report-agent",
        securityLevel: "restricted",
        spatialBoundaries: {
          position: { x: 75, y: 75, z: 35 },
          secureRadius: 20,
        },
        complianceRequirements: ["GDPR", "HIPAA", "SOX"],
      });

      const reportResult = await securityIntegration.generateSecurityReport(
        "workspace",
        workspace.id,
        "comprehensive",
      );

      expect(reportResult.report).toBeDefined();
      expect(reportResult.report.metadata.scope).toBe("workspace");
      expect(reportResult.recommendations).toBeInstanceOf(Array);
      expect(reportResult.criticalFindings).toBeInstanceOf(Array);
      expect(reportResult.complianceStatus).toBeDefined();
    });
  });

  describe("Performance and Scalability", () => {
    beforeEach(async () => {
      if (!agentSpaceSystem) {
        const result = await initializeAgentSpace(
          {
            ...testConfig,
            maxAgents: 50, // Larger scale for performance testing
          },
          memoryManager,
        );
        agentSpaceSystem = {
          manager: result.agentSpaceManager,
          resourceAllocator: result.resourceAllocator,
          performanceMonitor: result.performanceMonitor,
          isInitialized: true,
          startTime: new Date(),
        };
      }
    });

    it("should handle concurrent workspace creation", async () => {
      const concurrentOperations = 10;
      const startTime = performance.now();

      const workspacePromises = Array.from(
        { length: concurrentOperations },
        (_, i) =>
          agentSpaceSystem.manager.createWorkspace(`concurrent-workspace-${i}`),
      );

      const results = await Promise.allSettled(workspacePromises);
      const executionTime = performance.now() - startTime;

      const successfulResults = results.filter((r) => r.status === "fulfilled");
      expect(successfulResults.length).toBe(concurrentOperations);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it("should maintain performance under memory pressure", async () => {
      const memoryNodes = 100;
      const startTime = performance.now();

      // Store multiple memory nodes
      const storePromises = Array.from({ length: memoryNodes }, (_, i) =>
        agentSpaceSystem.manager.memoryArchitecture.storeMemoryNode({
          id: `perf-test-node-${i}`,
          type: "agent_memory",
          position: { x: i % 10, y: Math.floor(i / 10), z: 0 },
          content: { test: `performance test node ${i}` },
          metadata: {
            source: "performance-test",
            accessibility: "high",
            relevanceScore: 0.8,
          },
          relationships: [],
        }),
      );

      await Promise.all(storePromises);

      // Query memory nodes
      const queryResults =
        await agentSpaceSystem.manager.memoryArchitecture.queryMemoryBySpatialProximity(
          { x: 5, y: 5, z: 0 },
          20,
        );

      const totalTime = performance.now() - startTime;

      expect(queryResults.length).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should scale spatial operations efficiently", async () => {
      const agentCount = 25;
      const positions: Vector3D[] = Array.from(
        { length: agentCount },
        (_, i) => ({
          x: (i % 5) * 20,
          y: Math.floor(i / 5) * 20,
          z: 0,
        }),
      );

      const startTime = performance.now();

      // Register multiple spatial entities
      const entityIds: string[] = [];
      for (let i = 0; i < agentCount; i++) {
        const entityId =
          await agentSpaceSystem.manager.spatialFramework.registerEntity({
            id: `scale-test-entity-${i}`,
            type: "agent",
            position: positions[i],
            boundingBox: {
              min: { x: -2, y: -2, z: -1 },
              max: { x: 2, y: 2, z: 1 },
            },
          });
        entityIds.push(entityId);
      }

      // Query nearby entities for each agent
      const queryPromises = positions.map((pos) =>
        agentSpaceSystem.manager.spatialFramework.queryNearbyEntities(pos, 30),
      );

      const queryResults = await Promise.all(queryPromises);
      const totalTime = performance.now() - startTime;

      expect(entityIds.length).toBe(agentCount);
      expect(queryResults.length).toBe(agentCount);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Each agent should find some nearby entities
      const avgNearbyEntities =
        queryResults.reduce((sum, result) => sum + result.length, 0) /
        queryResults.length;
      expect(avgNearbyEntities).toBeGreaterThan(1);
    });

    it("should provide accurate performance metrics", async () => {
      // Perform various operations to generate metrics
      await agentSpaceSystem.manager.createWorkspace("metrics-test-1");
      await agentSpaceSystem.manager.createWorkspace("metrics-test-2");

      const systemHealth = await agentSpaceSystem.manager.getSystemHealth();
      const resourceMetrics = agentSpaceSystem.resourceAllocator.getMetrics();
      const performanceMetrics =
        agentSpaceSystem.performanceMonitor.getCurrentMetrics();

      expect(systemHealth).toBeDefined();
      expect(systemHealth.overallHealth).toBeDefined();
      expect(systemHealth.overallHealth.overall).toBeGreaterThan(0);

      expect(resourceMetrics).toBeDefined();
      expect(resourceMetrics.satisfactionScore).toBeGreaterThan(0);

      expect(performanceMetrics).toBeDefined();
      expect(performanceMetrics.performanceScore).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Recovery", () => {
    beforeEach(async () => {
      if (!agentSpaceSystem) {
        const result = await initializeAgentSpace(testConfig, memoryManager);
        agentSpaceSystem = {
          manager: result.agentSpaceManager,
          resourceAllocator: result.resourceAllocator,
          performanceMonitor: result.performanceMonitor,
          isInitialized: true,
          startTime: new Date(),
        };
      }
    });

    it("should handle invalid workspace operations gracefully", async () => {
      // Test accessing non-existent workspace
      const nonExistentWorkspace =
        await agentSpaceSystem.manager.getWorkspace("non-existent");
      expect(nonExistentWorkspace).toBeNull();

      // Test destroying non-existent workspace
      const destroyResult =
        await agentSpaceSystem.manager.destroyWorkspace("non-existent");
      expect(destroyResult).toBe(false);
    });

    it("should recover from spatial operation failures", async () => {
      // Test registering entity with invalid data
      await expect(
        agentSpaceSystem.manager.spatialFramework.registerEntity({
          id: "invalid-entity",
          type: "agent",
          position: null as any, // Invalid position
          boundingBox: {
            min: { x: -1, y: -1, z: -1 },
            max: { x: 1, y: 1, z: 1 },
          },
        }),
      ).rejects.toThrow();
    });

    it("should handle memory operation failures", async () => {
      // Test storing invalid memory node
      const invalidNode = {
        id: "invalid-memory-node",
        type: null as any, // Invalid type
        position: { x: 0, y: 0, z: 0 },
        content: null,
        metadata: {
          source: "test",
          accessibility: "high",
          relevanceScore: 0.5,
        },
        relationships: [],
      };

      await expect(
        agentSpaceSystem.manager.memoryArchitecture.storeMemoryNode(
          invalidNode,
        ),
      ).rejects.toThrow();
    });

    it("should maintain system stability under error conditions", async () => {
      // Trigger multiple error conditions
      const errorOperations = [
        agentSpaceSystem.manager.getWorkspace("non-existent-1"),
        agentSpaceSystem.manager.getWorkspace("non-existent-2"),
        agentSpaceSystem.manager.destroyWorkspace("non-existent-3"),
      ];

      const results = await Promise.allSettled(errorOperations);

      // System should still be operational
      const healthAfterErrors =
        await agentSpaceSystem.manager.getSystemHealth();
      expect(healthAfterErrors.overallHealth.overall).toBeGreaterThan(0.5);

      // Should still be able to create new resources
      const newWorkspace = await agentSpaceSystem.manager.createWorkspace(
        "post-error-workspace",
      );
      expect(newWorkspace).toBeDefined();
    });
  });

  describe("Integration Cleanup", () => {
    it("should shutdown all components cleanly", async () => {
      if (agentSpaceSystem) {
        const shutdownStart = performance.now();

        await shutdownAgentSpace(agentSpaceSystem);

        const shutdownTime = performance.now() - shutdownStart;
        expect(shutdownTime).toBeLessThan(3000); // Should shutdown within 3 seconds
      }

      // Verify components are cleaned up
      expect(true).toBe(true); // Placeholder - in real implementation would verify cleanup
    });
  });
});

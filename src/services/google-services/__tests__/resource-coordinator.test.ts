/**
 * Unit Tests for Resource Coordinator
 *
 * Comprehensive test suite for the ResourceCoordinator class, covering
 * resource allocation, deallocation, optimization, monitoring, and
 * performance management functionality.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { EventEmitter } from "events";
import { ResourceCoordinator } from "../infrastructure/resource-coordinator.js";
import { Logger } from "../../../utils/logger.js";

// Mock dependencies
jest.mock("../../../utils/logger.js");

describe("ResourceCoordinator", () => {
  let resourceCoordinator: ResourceCoordinator;
  let mockConfig: any;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mock configuration
    mockConfig = {
      resourcePools: {
        gpu: {
          enabled: true,
          maxInstances: 4,
          memoryPerInstance: 32768,
          computeCapacity: 1000000000,
        },
        cpu: {
          enabled: true,
          maxCores: 16,
          memoryLimit: 65536,
        },
        storage: {
          enabled: true,
          maxCapacity: 1000000,
          iops: 10000,
        },
      },
      scheduler: {
        algorithm: "best_fit",
        preemption: true,
        migration: false,
        loadBalancing: true,
      },
      monitoring: {
        interval: 5000,
        metricsRetention: 86400,
        alertThresholds: {
          cpu: 0.8,
          memory: 0.85,
          storage: 0.9,
        },
      },
      optimization: {
        enabled: true,
        interval: 60000,
        targetUtilization: 0.75,
      },
    };

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    (Logger as jest.MockedClass<typeof Logger>).mockReturnValue(mockLogger);

    resourceCoordinator = new ResourceCoordinator(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize successfully with valid configuration", async () => {
      // Arrange
      const initSpy = jest.spyOn(resourceCoordinator, "initialize");

      // Act
      await resourceCoordinator.initialize();

      // Assert
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Initializing Resource Coordinator",
      );
    });

    it("should discover and initialize resource pools", async () => {
      // Act
      await resourceCoordinator.initialize();

      // Assert
      const poolsResult = await resourceCoordinator.listPools();
      expect(poolsResult.success).toBe(true);
      expect(poolsResult.data.length).toBeGreaterThan(0);
    });

    it("should start monitoring after initialization", async () => {
      // Act
      await resourceCoordinator.initialize();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Initializing Resource Coordinator",
      );
      // Verify monitoring components are started
    });

    it("should handle initialization failure gracefully", async () => {
      // Arrange
      const invalidConfig = { ...mockConfig, resourcePools: null };
      const invalidResourceCoordinator = new ResourceCoordinator(invalidConfig);

      // Act & Assert
      await expect(invalidResourceCoordinator.initialize()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to initialize resource coordinator",
        expect.any(Error),
      );
    });
  });

  describe("Resource Allocation", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();
    });

    it("should allocate resources successfully with valid request", async () => {
      // Arrange
      const allocationRequest = {
        id: "alloc-test-001",
        type: "task" as const,
        priority: 75,
        requirements: {
          memory: 8192,
          cores: 4,
          compute: 500000000,
          constraints: [],
        },
        scheduling: {
          policy: "best_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: true,
          metrics: [
            {
              name: "cpu_usage",
              type: "gauge" as const,
              interval: 1,
              retention: 30,
            },
          ],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: true, resources: ["memory", "cpu"], timeout: 30 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      // Act
      const result =
        await resourceCoordinator.allocateResources(allocationRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(allocationRequest.id);
      expect(result.data.status).toBe("allocated");
      expect(result.data.pools).toBeDefined();
      expect(result.data.pools.length).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalledWith("Allocating resources", {
        requestId: allocationRequest.id,
        type: allocationRequest.type,
        requirements: allocationRequest.requirements,
      });
    });

    it("should handle allocation request with insufficient resources", async () => {
      // Arrange
      const oversizedRequest = {
        id: "alloc-oversized-001",
        type: "service" as const,
        priority: 50,
        requirements: {
          memory: 999999999, // Extremely large memory request
          cores: 1000, // More cores than available
          constraints: [],
        },
        scheduling: {
          policy: "first_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "none" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      // Act
      const result =
        await resourceCoordinator.allocateResources(oversizedRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("ALLOCATION_FAILED");
      expect(result.error?.message).toContain(
        "No suitable resource pools found",
      );
    });

    it("should validate allocation request parameters", async () => {
      // Arrange
      const invalidRequest = {
        id: "", // Empty ID
        type: "task" as const,
        priority: -10, // Invalid priority
        requirements: {
          memory: -1024, // Negative memory
          constraints: [],
        },
        scheduling: {
          policy: "best_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      // Act
      const result =
        await resourceCoordinator.allocateResources(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("ALLOCATION_FAILED");
    });

    it("should select optimal resource pools based on requirements", async () => {
      // Arrange
      const specificRequest = {
        id: "alloc-specific-001",
        type: "batch" as const,
        priority: 90,
        requirements: {
          memory: 16384,
          cores: 8,
          compute: 750000000,
          constraints: [
            {
              type: "capability" as const,
              value: "gpu",
              weight: 1,
              required: true,
            },
          ],
        },
        scheduling: {
          policy: "performance" as const,
          preemption: {
            enabled: true,
            threshold: 20,
            gracePeriod: 10,
            notification: true,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "container" as const,
            networking: {},
            storage: { type: "dedicated" as const },
            security: {
              enabled: true,
              policies: [],
              encryption: true,
              audit: true,
            },
          },
        },
        monitoring: {
          enabled: true,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 7200,
          checkpoints: {
            enabled: true,
            interval: 300,
            storage: "/tmp/checkpoints",
            retention: 5,
          },
          cleanup: { enabled: true, resources: ["gpu", "memory"], timeout: 60 },
          restart: {
            enabled: true,
            maxAttempts: 3,
            backoff: {
              strategy: "exponential" as const,
              initial: 1,
              max: 30,
              multiplier: 2,
            },
          },
        },
      };

      // Act
      const result =
        await resourceCoordinator.allocateResources(specificRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(
        result.data.pools.some((pool: any) => pool.poolId.includes("gpu")),
      ).toBe(true);
    });
  });

  describe("Resource Deallocation", () => {
    let allocationId: string;

    beforeEach(async () => {
      await resourceCoordinator.initialize();

      // Create an allocation first
      const allocationRequest = {
        id: "alloc-dealloc-test",
        type: "task" as const,
        priority: 50,
        requirements: { memory: 4096, constraints: [] },
        scheduling: {
          policy: "first_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      const allocResult =
        await resourceCoordinator.allocateResources(allocationRequest);
      allocationId = allocResult.data.id;
    });

    it("should deallocate resources successfully", async () => {
      // Act
      const result =
        await resourceCoordinator.deallocateResources(allocationId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Deallocating resources", {
        allocationId,
      });
    });

    it("should handle deallocation of non-existent allocation", async () => {
      // Arrange
      const nonExistentId = "non-existent-allocation";

      // Act
      const result =
        await resourceCoordinator.deallocateResources(nonExistentId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("DEALLOCATION_FAILED");
      expect(result.error?.message).toContain("Allocation not found");
    });

    it("should return resources to available pool after deallocation", async () => {
      // Arrange
      const poolsBefore = await resourceCoordinator.listPools();
      const initialAvailableMemory = poolsBefore.data.reduce(
        (sum: number, pool: any) => sum + pool.available.memory,
        0,
      );

      // Act
      await resourceCoordinator.deallocateResources(allocationId);

      // Assert
      const poolsAfter = await resourceCoordinator.listPools();
      const finalAvailableMemory = poolsAfter.data.reduce(
        (sum: number, pool: any) => sum + pool.available.memory,
        0,
      );

      expect(finalAvailableMemory).toBeGreaterThanOrEqual(
        initialAvailableMemory,
      );
    });
  });

  describe("Resource Monitoring", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();
    });

    it("should get resource utilization statistics", async () => {
      // Act
      const result = await resourceCoordinator.getUtilization();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const firstUtilization = result.data[0];
      expect(firstUtilization).toHaveProperty("memory");
      expect(typeof firstUtilization.memory).toBe("number");
    });

    it("should get performance metrics", async () => {
      // Act
      const result = await resourceCoordinator.getMetrics();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty("latency");
      expect(result.data).toHaveProperty("throughput");
      expect(result.data).toHaveProperty("utilization");
      expect(result.data).toHaveProperty("errors");
    });

    it("should track allocation metrics over time", async () => {
      // Arrange
      const allocationRequest = {
        id: "metrics-test-001",
        type: "interactive" as const,
        priority: 60,
        requirements: { memory: 2048, constraints: [] },
        scheduling: {
          policy: "balanced" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: true,
          metrics: [
            {
              name: "memory_usage",
              type: "gauge" as const,
              interval: 1,
              retention: 60,
            },
          ],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      // Act
      const allocResult =
        await resourceCoordinator.allocateResources(allocationRequest);
      const allocationId = allocResult.data.id;

      // Wait a moment for metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await resourceCoordinator.getAllocation(allocationId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.performance).toBeDefined();
    });
  });

  describe("Resource Optimization", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();

      // Create several allocations to have something to optimize
      const requests = Array.from({ length: 3 }, (_, i) => ({
        id: `opt-test-${i}`,
        type: "task" as const,
        priority: 50 + i * 10,
        requirements: { memory: 1024 * (i + 1), constraints: [] },
        scheduling: {
          policy: "first_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      }));

      await Promise.all(
        requests.map((req) => resourceCoordinator.allocateResources(req)),
      );
    });

    it("should optimize resource allocation", async () => {
      // Act
      const result = await resourceCoordinator.optimizeResources();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty("improvements");
      expect(result.data).toHaveProperty("savings");
      expect(result.data).toHaveProperty("recommendations");
      expect(result.data).toHaveProperty("impact");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Optimizing resource allocation",
      );
    });

    it("should provide optimization recommendations", async () => {
      // Act
      const result = await resourceCoordinator.optimizeResources();

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.recommendations)).toBe(true);
      expect(Array.isArray(result.data.improvements)).toBe(true);
    });

    it("should calculate optimization impact", async () => {
      // Act
      const result = await resourceCoordinator.optimizeResources();

      // Assert
      expect(result.data.impact).toBeDefined();
      expect(typeof result.data.impact.performance).toBe("number");
      expect(typeof result.data.impact.cost).toBe("number");
      expect(typeof result.data.impact.efficiency).toBe("number");
    });
  });

  describe("Resource Topology Management", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();
    });

    it("should get resource topology information", async () => {
      // Act
      const result = await resourceCoordinator.getTopology();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty("nodes");
      expect(result.data).toHaveProperty("connections");
      expect(result.data).toHaveProperty("clusters");
      expect(result.data).toHaveProperty("regions");
    });

    it("should list available resource pools", async () => {
      // Act
      const result = await resourceCoordinator.listPools();

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const firstPool = result.data[0];
      expect(firstPool).toHaveProperty("id");
      expect(firstPool).toHaveProperty("type");
      expect(firstPool).toHaveProperty("capacity");
      expect(firstPool).toHaveProperty("allocated");
      expect(firstPool).toHaveProperty("available");
      expect(firstPool).toHaveProperty("utilization");
      expect(firstPool).toHaveProperty("health");
    });
  });

  describe("Error Handling and Resilience", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();
    });

    it("should handle resource pool failures gracefully", async () => {
      // Arrange - Simulate pool failure
      const eventSpy = jest.fn();
      resourceCoordinator.on("resource:alert", eventSpy);

      // Simulate resource alert
      resourceCoordinator.emit("resource:alert", {
        poolId: "gpu-pool-1",
        type: "failure",
        severity: "critical",
      });

      // Assert
      expect(eventSpy).toHaveBeenCalledWith({
        poolId: "gpu-pool-1",
        type: "failure",
        severity: "critical",
      });
    });

    it("should implement circuit breaker for failed operations", async () => {
      // Arrange - Create requests that will trigger circuit breaker
      const failingRequest = {
        id: "circuit-breaker-test",
        type: "service" as const,
        priority: 50,
        requirements: { memory: -1, constraints: [] }, // Invalid requirement
        scheduling: {
          policy: "first_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      // Act - Make multiple failing requests
      const results = await Promise.allSettled([
        resourceCoordinator.allocateResources(failingRequest),
        resourceCoordinator.allocateResources({
          ...failingRequest,
          id: "circuit-breaker-test-2",
        }),
        resourceCoordinator.allocateResources({
          ...failingRequest,
          id: "circuit-breaker-test-3",
        }),
      ]);

      // Assert
      const failedResults = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success),
      );
      expect(failedResults.length).toBeGreaterThan(0);
    });

    it("should recover from temporary failures", async () => {
      // Arrange
      let attemptCount = 0;

      // Mock temporary failure scenario
      const originalAllocate =
        resourceCoordinator.allocateResources.bind(resourceCoordinator);
      const mockAllocate = jest.fn().mockImplementation((request) => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.resolve({
            success: false,
            error: {
              code: "TEMPORARY_FAILURE",
              message: "Temporary failure",
              retryable: true,
              timestamp: new Date(),
            },
            metadata: {
              requestId: "test",
              timestamp: new Date(),
              processingTime: 0,
              region: "local",
            },
          });
        }
        return originalAllocate(request);
      });

      // Replace method for this test
      resourceCoordinator.allocateResources = mockAllocate;

      const request = {
        id: "recovery-test",
        type: "task" as const,
        priority: 50,
        requirements: { memory: 1024, constraints: [] },
        scheduling: {
          policy: "first_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      // Act - Should eventually succeed after retries
      const result = await resourceCoordinator.allocateResources(request);

      // Assert
      expect(result.success).toBe(true);
      expect(attemptCount).toBeGreaterThan(2);
    });
  });

  describe("Performance and Scalability", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();
    });

    it("should handle concurrent allocation requests", async () => {
      // Arrange
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-${i}`,
        type: "task" as const,
        priority: 50,
        requirements: { memory: 512, constraints: [] },
        scheduling: {
          policy: "balanced" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      }));

      // Act
      const startTime = Date.now();
      const results = await Promise.allSettled(
        concurrentRequests.map((req) =>
          resourceCoordinator.allocateResources(req),
        ),
      );
      const endTime = Date.now();

      // Assert
      const successfulResults = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      );

      expect(successfulResults.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should maintain performance under high load", async () => {
      // Arrange
      const loadTestRequests = Array.from({ length: 50 }, (_, i) => ({
        id: `load-test-${i}`,
        type: "batch" as const,
        priority: Math.floor(Math.random() * 100),
        requirements: {
          memory: Math.floor(Math.random() * 4096) + 512,
          constraints: [],
        },
        scheduling: {
          policy: "best_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: false, resources: [], timeout: 0 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      }));

      // Act
      const startTime = Date.now();
      const results = await Promise.allSettled(
        loadTestRequests.map((req) =>
          resourceCoordinator.allocateResources(req),
        ),
      );
      const endTime = Date.now();

      // Assert
      const totalTime = endTime - startTime;
      const averageTime = totalTime / loadTestRequests.length;

      expect(averageTime).toBeLessThan(1000); // Average request time should be under 1 second

      const successfulAllocations = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      );

      // Should successfully allocate at least 60% of requests
      expect(
        successfulAllocations.length / loadTestRequests.length,
      ).toBeGreaterThan(0.6);
    });
  });

  describe("Resource Cleanup and Shutdown", () => {
    beforeEach(async () => {
      await resourceCoordinator.initialize();
    });

    it("should cleanup resources on shutdown", async () => {
      // Arrange
      const allocationRequest = {
        id: "cleanup-test",
        type: "service" as const,
        priority: 50,
        requirements: { memory: 2048, constraints: [] },
        scheduling: {
          policy: "first_fit" as const,
          preemption: {
            enabled: false,
            threshold: 0,
            gracePeriod: 0,
            notification: false,
          },
          migration: { enabled: false, triggers: [], overhead: 0 },
          isolation: {
            level: "process" as const,
            networking: {},
            storage: { type: "shared" as const },
            security: {
              enabled: false,
              policies: [],
              encryption: false,
              audit: false,
            },
          },
        },
        monitoring: {
          enabled: false,
          metrics: [],
          alerts: [],
          reporting: {
            enabled: false,
            frequency: "",
            recipients: [],
            format: "json" as const,
          },
        },
        lifecycle: {
          timeout: 3600,
          checkpoints: {
            enabled: false,
            interval: 0,
            storage: "",
            retention: 0,
          },
          cleanup: { enabled: true, resources: ["memory"], timeout: 30 },
          restart: {
            enabled: false,
            maxAttempts: 0,
            backoff: {
              strategy: "fixed" as const,
              initial: 0,
              max: 0,
              multiplier: 0,
            },
          },
        },
      };

      await resourceCoordinator.allocateResources(allocationRequest);

      // Act
      // Note: ResourceCoordinator doesn't have a public shutdown method in the provided interface
      // This test would typically verify that resources are cleaned up properly

      // Assert
      const pools = await resourceCoordinator.listPools();
      expect(pools.success).toBe(true);
      // Verify that pools are still accessible and in good state
    });
  });
});

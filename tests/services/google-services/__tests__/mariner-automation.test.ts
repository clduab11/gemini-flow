/**
 * Comprehensive TDD Test Suite for Mariner Automation
 *
 * Following London School TDD with emphasis on behavior verification
 * for browser automation, task orchestration, and AI-driven testing.
 *
 * RED-GREEN-REFACTOR CYCLE:
 * Focus on automation workflow coordination, browser session management,
 * and task execution patterns with comprehensive error handling.
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
import { MarinerAutomation } from "../mariner-automation.js";
import {
  MockFactory,
  TestDataGenerator,
  MockBuilder,
  ContractTester,
  PerformanceTester,
  ErrorScenarioTester,
} from "./test-utilities.js";

// Mock external dependencies following London School principles
jest.mock("../../../utils/logger.js");
jest.mock("../../../adapters/browser-adapter.js");
jest.mock("../../../ai/task-optimizer.js");

describe("MarinerAutomation - London School TDD", () => {
  let marinerAutomation: MarinerAutomation;
  let mockConfig: any;
  let mockLogger: jest.Mocked<any>;
  let mockTaskQueue: jest.Mocked<any>;
  let mockTaskScheduler: jest.Mocked<any>;
  let mockAIEngine: jest.Mocked<any>;
  let mockBrowserMonitoring: jest.Mocked<any>;
  let mockPluginManager: jest.Mocked<any>;
  let mockResourceManager: jest.Mocked<any>;
  let mockBuilder: MockBuilder;

  beforeEach(() => {
    // Setup comprehensive mock configuration
    mockConfig = {
      browser: {
        engine: "chromium",
        headless: true,
        devtools: false,
        proxy: undefined,
        userAgent: "Mozilla/5.0 (Test Browser)",
        viewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          isLandscape: true,
        },
        performance: {
          cpuThrottling: 1,
          networkThrottling: undefined,
          cacheDisabled: false,
          javascriptEnabled: true,
          imagesEnabled: true,
        },
      },
      orchestration: {
        maxConcurrentBrowsers: 5,
        taskQueue: {
          maxSize: 100,
          priority: "fifo",
          timeout: 300000,
          retries: 3,
        },
        scheduling: {
          algorithm: "round_robin",
          loadBalancing: true,
          affinity: false,
        },
        resourceManagement: {
          memoryLimit: 8192,
          cpuLimit: 80,
          diskSpace: 10240,
          cleanupInterval: 60,
        },
      },
      ai: {
        enabled: true,
        model: "mariner-optimization-v2",
        capabilities: [
          {
            name: "element_detection",
            type: "vision",
            confidence: 0.9,
            fallback: "xpath_selector",
          },
          {
            name: "task_optimization",
            type: "prediction",
            confidence: 0.85,
            fallback: "rule_based",
          },
        ],
        learning: {
          enabled: true,
          dataCollection: true,
          modelUpdates: false,
          feedbackLoop: true,
        },
      },
      monitoring: {
        performance: true,
        screenshots: true,
        videos: false,
        networkLogs: true,
        consoleLogs: true,
        metrics: {
          loadTime: true,
          networkRequests: true,
          memoryUsage: true,
          cpuUsage: true,
          errors: true,
        },
      },
      plugins: [],
    };

    mockBuilder = new MockBuilder();

    // Setup Logger mock
    mockLogger = mockBuilder
      .mockFunction("info", jest.fn())
      .mockFunction("debug", jest.fn())
      .mockFunction("warn", jest.fn())
      .mockFunction("error", jest.fn())
      .build() as any;

    // Setup TaskQueue mock
    mockTaskQueue = {
      enqueue: jest.fn().mockResolvedValue(undefined),
      dequeue: jest.fn().mockResolvedValue({
        id: "task-123",
        task: MockFactory.createAutomationTask(),
        status: "pending",
      }),
      getExecution: jest.fn().mockResolvedValue({
        id: "task-123",
        status: "running",
        startTime: new Date(),
        progress: 50,
      }),
      cancel: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      size: jest.fn().mockReturnValue(5),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // Setup TaskScheduler mock
    mockTaskScheduler = {
      schedule: jest.fn().mockImplementation((execution) => {
        execution.status = "running";
        execution.startTime = new Date();
      }),
      getNextTask: jest.fn().mockReturnValue({
        id: "scheduled-task-123",
        priority: 1,
      }),
      reschedule: jest.fn(),
      cancel: jest.fn(),
    };

    // Setup AIEngine mock
    mockAIEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      optimizeTask: jest.fn().mockImplementation(async (task) => ({
        ...task,
        optimized: true,
        aiEnhanced: true,
      })),
      predictElementLocation: jest.fn().mockResolvedValue({
        selector: "#predicted-element",
        confidence: 0.92,
        coordinates: { x: 100, y: 200 },
      }),
      analyzePerformance: jest.fn().mockResolvedValue({
        bottlenecks: ["slow_network"],
        recommendations: ["enable_compression"],
        score: 85,
      }),
    };

    // Setup BrowserMonitoring mock
    mockBrowserMonitoring = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getMetrics: jest
        .fn()
        .mockResolvedValue(MockFactory.createPerformanceMetrics()),
      recordPageLoad: jest.fn(),
      recordUserAction: jest.fn(),
      recordError: jest.fn(),
      takeScreenshot: jest.fn().mockReturnValue("screenshot-data"),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // Setup PluginManager mock
    mockPluginManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      loadPlugin: jest.fn().mockResolvedValue(undefined),
      executePlugin: jest.fn().mockResolvedValue({ success: true }),
    };

    // Setup ResourceManager mock
    mockResourceManager = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getResourceUsage: jest.fn().mockReturnValue({
        memory: 4096,
        cpu: 45,
        disk: 2048,
      }),
      checkResourceLimits: jest.fn().mockReturnValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // Mock constructor dependencies
    jest.mocked(require("../../../utils/logger.js")).Logger = jest
      .fn()
      .mockImplementation(() => mockLogger);

    // Create MarinerAutomation instance
    marinerAutomation = new MarinerAutomation(mockConfig);

    // Inject mocks
    (marinerAutomation as any).taskQueue = mockTaskQueue;
    (marinerAutomation as any).scheduler = mockTaskScheduler;
    (marinerAutomation as any).aiEngine = mockAIEngine;
    (marinerAutomation as any).monitoringService = mockBrowserMonitoring;
    (marinerAutomation as any).pluginManager = mockPluginManager;
    (marinerAutomation as any).resourceManager = mockResourceManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockBuilder.clear();
  });

  // ==================== INITIALIZATION BEHAVIOR ====================

  describe("Initialization and Component Orchestration", () => {
    it("should coordinate initialization of all subsystems", async () => {
      // ARRANGE
      const initializeSpy = jest.spyOn(marinerAutomation, "initialize");

      // ACT
      await marinerAutomation.initialize();

      // ASSERT - Verify initialization coordination
      expect(initializeSpy).toHaveBeenCalledTimes(1);
      expect(mockAIEngine.initialize).toHaveBeenCalled();
      expect(mockPluginManager.initialize).toHaveBeenCalled();
      expect(mockBrowserMonitoring.start).toHaveBeenCalled();
      expect(mockResourceManager.start).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Mariner Automation Engine initialized",
      );
    });

    it("should handle initialization failure with proper error propagation", async () => {
      // ARRANGE
      const initError = new Error("AI Engine initialization failed");
      mockAIEngine.initialize.mockRejectedValueOnce(initError);

      // ACT & ASSERT
      await expect(marinerAutomation.initialize()).rejects.toThrow(
        "AI Engine initialization failed",
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to initialize automation engine",
        initError,
      );
    });

    it("should establish event handler contracts during initialization", async () => {
      // ACT
      await marinerAutomation.initialize();

      // ASSERT - Verify event handler coordination
      expect(mockTaskQueue.on).toHaveBeenCalledWith(
        "task:ready",
        expect.any(Function),
      );
      expect(mockResourceManager.on).toHaveBeenCalledWith(
        "resource:low",
        expect.any(Function),
      );
      expect(mockBrowserMonitoring.on).toHaveBeenCalledWith(
        "performance:degraded",
        expect.any(Function),
      );
    });
  });

  // ==================== TASK SUBMISSION AND ORCHESTRATION ====================

  describe("Task Submission and Queue Management", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate task submission with validation and optimization", async () => {
      // ARRANGE
      const automationTask = MockFactory.createAutomationTask();
      const submitSpy = jest.spyOn(marinerAutomation, "submitTask");

      // ACT
      const result = await marinerAutomation.submitTask(automationTask);

      // ASSERT - Verify submission coordination
      expect(result.success).toBe(true);
      expect(result.data).toBe(automationTask.id);
      expect(submitSpy).toHaveBeenCalledWith(automationTask);
      expect(mockAIEngine.optimizeTask).toHaveBeenCalledWith(automationTask);
      expect(mockTaskQueue.enqueue).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Submitting automation task",
        expect.objectContaining({
          taskId: automationTask.id,
          name: automationTask.name,
        }),
      );
    });

    it("should validate task structure before submission", async () => {
      // ARRANGE
      const invalidTask = {
        id: "", // Invalid ID
        name: "",
        steps: [], // No steps
        conditions: null,
        timeout: -1, // Invalid timeout
      };

      // ACT
      const result = await marinerAutomation.submitTask(invalidTask as any);

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TASK_SUBMISSION_FAILED");
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should coordinate task optimization with AI when enabled", async () => {
      // ARRANGE
      const originalTask = MockFactory.createAutomationTask();
      const optimizedTask = {
        ...originalTask,
        optimized: true,
        aiEnhanced: true,
        steps: [
          ...originalTask.steps,
          {
            type: "ai_enhanced_wait",
            value: "smart_wait",
            timeout: 5000,
          },
        ],
      };

      mockAIEngine.optimizeTask.mockResolvedValueOnce(optimizedTask);

      // ACT
      const result = await marinerAutomation.submitTask(originalTask);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockAIEngine.optimizeTask).toHaveBeenCalledWith(originalTask);
      expect(mockTaskQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          task: expect.objectContaining({
            optimized: true,
            aiEnhanced: true,
          }),
        }),
      );
    });
  });

  // ==================== TASK EXECUTION BEHAVIOR ====================

  describe("Task Execution Orchestration", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate browser acquisition and task execution", async () => {
      // ARRANGE
      const automationTask = MockFactory.createAutomationTask();
      const mockBrowser = createMockBrowserSession();

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(automationTask);

      // ASSERT - Verify execution coordination
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(mockBrowser.markBusy).toHaveBeenCalled();
      expect(mockBrowser.markAvailable).toHaveBeenCalled();
      expect(mockBrowserMonitoring.recordUserAction).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Executing automation task",
        expect.objectContaining({
          taskId: automationTask.id,
          name: automationTask.name,
        }),
      );
    });

    it("should handle browser acquisition failure with proper error handling", async () => {
      // ARRANGE
      const automationTask = MockFactory.createAutomationTask();
      const acquisitionError = new Error("No browsers available");

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockRejectedValue(acquisitionError);

      // ACT
      const result = await marinerAutomation.executeTask(automationTask);

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TASK_EXECUTION_FAILED");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Task execution failed",
        expect.objectContaining({
          taskId: automationTask.id,
        }),
      );
    });

    it("should coordinate step execution with condition validation", async () => {
      // ARRANGE
      const taskWithConditions = {
        ...MockFactory.createAutomationTask(),
        conditions: [
          {
            type: "element_present",
            selector: "#success-message",
            value: undefined,
          },
          {
            type: "url_matches",
            selector: undefined,
            value: "/success",
          },
        ],
      };

      const mockBrowser = createMockBrowserSession();
      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // Mock condition evaluation
      jest
        .spyOn(marinerAutomation as any, "evaluateCondition")
        .mockResolvedValue(true);

      // ACT
      const result = await marinerAutomation.executeTask(taskWithConditions);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockBrowser.isElementPresent).toHaveBeenCalledWith(
        "#success-message",
      );
      expect(mockBrowser.getCurrentUrl).toHaveBeenCalled();
    });

    it("should coordinate screenshot capture during monitoring", async () => {
      // ARRANGE
      const automationTask = MockFactory.createAutomationTask();
      const mockBrowser = createMockBrowserSession();

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(automationTask);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockBrowser.enableScreenshots).toHaveBeenCalled();
      expect(mockBrowser.takeScreenshot).toHaveBeenCalled();
      expect(result.data.screenshots).toContain("screenshot-data");
    });
  });

  // ==================== BROWSER SESSION MANAGEMENT ====================

  describe("Browser Session Pool Management", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate browser session creation and management", async () => {
      // ARRANGE
      const sessionCount = 3;
      const sessions: any[] = [];

      // Mock browser creation
      jest
        .spyOn(marinerAutomation as any, "createBrowser")
        .mockImplementation(() => {
          const session = createMockBrowserSession();
          sessions.push(session);
          return Promise.resolve(session);
        });

      // ACT - Create multiple sessions
      const promises = Array.from({ length: sessionCount }, (_, i) =>
        (marinerAutomation as any).acquireBrowser(),
      );

      const acquiredSessions = await Promise.all(promises);

      // ASSERT
      expect(acquiredSessions).toHaveLength(sessionCount);
      expect(sessions.every((s) => s.launch)).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Created new browser session",
        expect.objectContaining({ browserId: expect.any(String) }),
      );
    });

    it("should coordinate browser session cleanup and resource release", async () => {
      // ARRANGE
      const mockBrowser = createMockBrowserSession();
      mockBrowser.needsCleanup.mockResolvedValue(true);

      jest
        .spyOn(marinerAutomation as any, "getAvailableBrowser")
        .mockReturnValue(mockBrowser);

      // ACT
      const browser = await (marinerAutomation as any).acquireBrowser();
      await (marinerAutomation as any).releaseBrowser(browser);

      // ASSERT
      expect(browser.markAvailable).toHaveBeenCalled();
      expect(browser.needsCleanup).toHaveBeenCalled();
      expect(browser.cleanup).toHaveBeenCalled();
    });

    it("should handle browser pool exhaustion with waiting coordination", async () => {
      // ARRANGE
      const maxBrowsers = mockConfig.orchestration.maxConcurrentBrowsers;

      // Mock pool exhaustion
      jest
        .spyOn(marinerAutomation as any, "getAvailableBrowser")
        .mockReturnValue(null);
      jest
        .spyOn(marinerAutomation as any, "browsers", "get")
        .mockReturnValue(
          new Map(
            Array.from({ length: maxBrowsers }, (_, i) => [
              `browser-${i}`,
              { isBusy: () => true },
            ]),
          ),
        );

      // Mock waiting behavior
      jest
        .spyOn(marinerAutomation as any, "waitForAvailableBrowser")
        .mockResolvedValue(createMockBrowserSession());

      // ACT
      const browser = await (marinerAutomation as any).acquireBrowser();

      // ASSERT
      expect(browser).toBeDefined();
      expect(
        (marinerAutomation as any).waitForAvailableBrowser,
      ).toHaveBeenCalled();
    });
  });

  // ==================== AI INTEGRATION BEHAVIOR ====================

  describe("AI Engine Integration and Optimization", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate AI-powered element detection with fallback", async () => {
      // ARRANGE
      const taskWithSmartSelectors = {
        ...MockFactory.createAutomationTask(),
        steps: [
          {
            type: "click",
            selector: "ai:submit_button", // AI-enhanced selector
            timeout: 5000,
          },
        ],
      };

      const mockBrowser = createMockBrowserSession();
      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(
        taskWithSmartSelectors,
      );

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockAIEngine.predictElementLocation).toHaveBeenCalledWith(
        "submit_button",
        expect.any(Object), // Browser context
      );
      expect(mockBrowser.click).toHaveBeenCalledWith(
        "#predicted-element",
        expect.any(Number),
      );
    });

    it("should coordinate performance analysis with AI insights", async () => {
      // ARRANGE
      const performanceTask = MockFactory.createAutomationTask();
      const mockBrowser = createMockBrowserSession();

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(performanceTask);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockAIEngine.analyzePerformance).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "AI performance analysis completed",
        expect.objectContaining({
          score: 85,
          recommendations: ["enable_compression"],
        }),
      );
    });

    it("should handle AI service failures with graceful degradation", async () => {
      // ARRANGE
      const aiFailureTask = MockFactory.createAutomationTask();
      const aiError = new Error("AI service unavailable");

      mockAIEngine.optimizeTask.mockRejectedValueOnce(aiError);

      // ACT
      const result = await marinerAutomation.submitTask(aiFailureTask);

      // ASSERT - Should continue without AI optimization
      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "AI optimization failed, proceeding without optimization",
        aiError,
      );
      expect(mockTaskQueue.enqueue).toHaveBeenCalled();
    });
  });

  // ==================== PERFORMANCE MONITORING ====================

  describe("Performance Monitoring and Resource Management", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate performance metrics collection during execution", async () => {
      // ARRANGE
      const performanceTask = MockFactory.createAutomationTask();
      const mockBrowser = createMockBrowserSession();

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(performanceTask);
      const metrics = await marinerAutomation.getMetrics();

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockBrowserMonitoring.getMetrics).toHaveBeenCalled();
      ContractTester.validatePerformanceMetrics(metrics.data);
      expect(mockBrowserMonitoring.recordUserAction).toHaveBeenCalled();
    });

    it("should handle resource exhaustion with proper throttling", async () => {
      // ARRANGE
      const resourceIntensiveTask = MockFactory.createAutomationTask();

      mockResourceManager.checkResourceLimits.mockReturnValue(false); // Resource limit exceeded
      mockResourceManager.getResourceUsage.mockReturnValue({
        memory: 7500, // Near limit
        cpu: 85, // High usage
        disk: 9000, // Near limit
      });

      // ACT
      const result = await marinerAutomation.executeTask(resourceIntensiveTask);

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("RESOURCE_LIMIT_EXCEEDED");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Resource limits exceeded, throttling execution",
        expect.objectContaining({
          usage: expect.any(Object),
        }),
      );
    });

    it("should coordinate resource cleanup on low resource events", async () => {
      // ARRANGE
      const lowResourceEvent = {
        type: "memory_low",
        threshold: 90,
        current: 95,
        timestamp: new Date(),
      };

      // ACT
      (marinerAutomation as any).handleLowResources(lowResourceEvent);

      // ASSERT
      expect(mockResourceManager.cleanup).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Low resources detected",
        lowResourceEvent,
      );
    });
  });

  // ==================== ERROR HANDLING AND RECOVERY ====================

  describe("Error Handling and Recovery Coordination", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate retry logic with exponential backoff", async () => {
      // ARRANGE
      const flakyTask = MockFactory.createAutomationTask();
      const transientError = new Error("Network timeout");
      let attemptCount = 0;

      const mockBrowser = createMockBrowserSession();
      mockBrowser.navigate.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw transientError;
        }
        return Promise.resolve();
      });

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(flakyTask);

      // ASSERT
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Verified retry behavior
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Step execution failed, retrying",
        expect.objectContaining({
          attempt: expect.any(Number),
          error: transientError,
        }),
      );
    });

    it("should coordinate browser crash recovery", async () => {
      // ARRANGE
      const crashTask = MockFactory.createAutomationTask();
      const crashError = new Error("Browser process crashed");

      const mockBrowser = createMockBrowserSession();
      mockBrowser.navigate.mockRejectedValue(crashError);

      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(crashTask);

      // ASSERT
      expect(result.success).toBe(false);
      expect(mockBrowser.cleanup).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Browser session crashed, cleaning up",
        expect.objectContaining({
          error: crashError,
        }),
      );
    });

    it("should handle task cancellation with resource cleanup", async () => {
      // ARRANGE
      const taskId = "cancellable-task-123";

      mockTaskQueue.getExecution.mockResolvedValue({
        id: taskId,
        status: "running",
        startTime: new Date(),
      });

      // ACT
      const result = await marinerAutomation.cancelTask(taskId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockTaskQueue.cancel).toHaveBeenCalledWith(taskId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Cancelling task",
        expect.objectContaining({ taskId }),
      );
    });
  });

  // ==================== PLUGIN SYSTEM COORDINATION ====================

  describe("Plugin System Integration", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should coordinate plugin execution during task processing", async () => {
      // ARRANGE
      const taskWithPlugins = {
        ...MockFactory.createAutomationTask(),
        plugins: ["screenshot-enhancer", "data-validator"],
      };

      const mockBrowser = createMockBrowserSession();
      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(taskWithPlugins);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockPluginManager.executePlugin).toHaveBeenCalledWith(
        "screenshot-enhancer",
        expect.any(Object),
      );
      expect(mockPluginManager.executePlugin).toHaveBeenCalledWith(
        "data-validator",
        expect.any(Object),
      );
    });

    it("should handle plugin failures without affecting main execution", async () => {
      // ARRANGE
      const taskWithFailingPlugin = MockFactory.createAutomationTask();
      const pluginError = new Error("Plugin execution failed");

      mockPluginManager.executePlugin.mockRejectedValue(pluginError);

      const mockBrowser = createMockBrowserSession();
      jest
        .spyOn(marinerAutomation as any, "acquireBrowser")
        .mockResolvedValue(mockBrowser);

      // ACT
      const result = await marinerAutomation.executeTask(taskWithFailingPlugin);

      // ASSERT
      expect(result.success).toBe(true); // Main execution should continue
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Plugin execution failed, continuing task",
        pluginError,
      );
    });
  });

  // ==================== SHUTDOWN AND CLEANUP ====================

  describe("Graceful Shutdown and Resource Cleanup", () => {
    it("should coordinate graceful shutdown of all subsystems", async () => {
      // ARRANGE
      await marinerAutomation.initialize();

      const mockBrowser1 = createMockBrowserSession();
      const mockBrowser2 = createMockBrowserSession();

      // Mock active browsers
      jest.spyOn(marinerAutomation as any, "browsers", "get").mockReturnValue(
        new Map([
          ["browser-1", mockBrowser1],
          ["browser-2", mockBrowser2],
        ]),
      );

      // ACT
      await marinerAutomation.shutdown();

      // ASSERT - Verify shutdown coordination
      expect(mockTaskQueue.stop).toHaveBeenCalled();
      expect(mockBrowser1.close).toHaveBeenCalled();
      expect(mockBrowser2.close).toHaveBeenCalled();
      expect(mockBrowserMonitoring.stop).toHaveBeenCalled();
      expect(mockResourceManager.stop).toHaveBeenCalled();
      expect(mockPluginManager.shutdown).toHaveBeenCalled();
      expect(mockAIEngine.shutdown).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Mariner Automation Engine shutdown complete",
      );
    });

    it("should handle shutdown errors gracefully", async () => {
      // ARRANGE
      await marinerAutomation.initialize();

      const shutdownError = new Error("Component shutdown failed");
      mockBrowserMonitoring.stop.mockRejectedValue(shutdownError);

      // ACT & ASSERT
      await expect(marinerAutomation.shutdown()).rejects.toThrow(
        "Component shutdown failed",
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error during shutdown",
        shutdownError,
      );
    });
  });

  // ==================== PERFORMANCE CONTRACT TESTING ====================

  describe("Performance Contract Validation", () => {
    beforeEach(async () => {
      await marinerAutomation.initialize();
    });

    it("should meet performance requirements for task submission", async () => {
      // ARRANGE & ACT
      const performanceTest = PerformanceTester.createPerformanceTest(
        "task_submission",
        () => marinerAutomation.submitTask(MockFactory.createAutomationTask()),
        50, // 50ms max
        5, // 5 iterations
      );

      // ASSERT
      await performanceTest();
    });

    it("should maintain service response contracts", async () => {
      // ARRANGE & ACT
      const submitResult = await marinerAutomation.submitTask(
        MockFactory.createAutomationTask(),
      );
      const statusResult = await marinerAutomation.getTaskStatus("task-123");
      const metricsResult = await marinerAutomation.getMetrics();

      // ASSERT
      ContractTester.validateServiceResponse(submitResult);
      ContractTester.validateServiceResponse(statusResult);
      ContractTester.validateServiceResponse(metricsResult);
    });

    it("should validate event emitter contract for task coordination", async () => {
      // ARRANGE
      const expectedEvents = [
        "task:submitted",
        "task:started",
        "task:completed",
        "task:failed",
        "task:cancelled",
        "browser:acquired",
        "browser:released",
        "performance:degraded",
      ];

      // ACT & ASSERT
      ContractTester.validateEventEmitter(marinerAutomation, expectedEvents);
    });
  });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Creates a comprehensive mock browser session for testing
 */
function createMockBrowserSession() {
  return {
    id: "mock-browser-123",
    launch: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    isBusy: jest.fn().mockReturnValue(false),
    markBusy: jest.fn(),
    markAvailable: jest.fn(),
    needsCleanup: jest.fn().mockResolvedValue(false),
    cleanup: jest.fn().mockResolvedValue(undefined),
    enableScreenshots: jest.fn().mockResolvedValue(undefined),
    enableNetworkLogging: jest.fn().mockResolvedValue(undefined),
    takeScreenshot: jest.fn().mockResolvedValue("screenshot-data"),
    navigate: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    type: jest.fn().mockResolvedValue(undefined),
    wait: jest.fn().mockResolvedValue(undefined),
    waitForElement: jest.fn().mockResolvedValue(undefined),
    extractData: jest.fn().mockResolvedValue({}),
    executeScript: jest.fn().mockResolvedValue({}),
    isElementPresent: jest.fn().mockResolvedValue(true),
    isElementVisible: jest.fn().mockResolvedValue(true),
    getText: jest.fn().mockResolvedValue("test text"),
    getCurrentUrl: jest.fn().mockResolvedValue("https://example.com/success"),
    getMemoryUsage: jest.fn().mockResolvedValue(512),
    getNetworkRequestCount: jest.fn().mockResolvedValue(15),
  };
}

/**
 * RED-GREEN-REFACTOR CYCLE DOCUMENTATION FOR MARINER AUTOMATION:
 *
 * This test suite demonstrates comprehensive London School TDD for complex automation:
 *
 * 1. ORCHESTRATION TESTING:
 *    - Tests focus on HOW MarinerAutomation coordinates between subsystems
 *    - Browser session management, task queue coordination, AI integration
 *    - Resource management and performance monitoring coordination
 *
 * 2. BEHAVIOR-DRIVEN MOCKING:
 *    - All dependencies are mocked to isolate MarinerAutomation behavior
 *    - Mocks verify interaction patterns, not implementation details
 *    - Error injection tests verify recovery and cleanup coordination
 *
 * 3. COMPLEX WORKFLOW TESTING:
 *    - Multi-step task execution with condition validation
 *    - Browser pool management with resource constraints
 *    - AI-enhanced automation with fallback strategies
 *
 * 4. LONDON SCHOOL PRINCIPLES:
 *    - RED: Define expected coordination behavior through failing tests
 *    - GREEN: Implement minimal orchestration logic to pass tests
 *    - REFACTOR: Improve coordination patterns while maintaining contracts
 *
 * Key Collaboration Patterns Tested:
 * - TaskQueue ↔ TaskScheduler (task prioritization and execution)
 * - BrowserSession ↔ ResourceManager (resource allocation and limits)
 * - AIEngine ↔ TaskOptimizer (intelligent automation enhancement)
 * - PerformanceMonitor ↔ BrowserMonitoring (metrics collection and analysis)
 * - PluginManager ↔ TaskExecution (extensible automation capabilities)
 */

/**
 * Project Mariner Browser Orchestrator
 *
 * Advanced browser orchestration with multi-tab coordination, intelligent automation,
 * and SPARC architecture integration
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
import { PerformanceMonitor } from "../../core/performance-monitor.js";
import { CacheManager } from "../../core/cache-manager.js";
import { safeImport } from "../../utils/feature-detection.js";

import {
  BrowserConfig,
  BrowserOrchestrator as IBrowserOrchestrator,
  BrowserTab,
  TabConfig,
  CrossTabAction,
  ActionResult,
  BrowserTask,
  TabStatus,
  TabContext,
  TabMetrics,
  TabCoordination,
  SynchronizationConfig,
  CrossTabStep,
  IntegrationBaseError,
} from "./types.js";

import { BaseIntegration, HealthStatus } from "../shared/types.js";

export class BrowserOrchestrator
  extends BaseIntegration
  implements IBrowserOrchestrator
{
  private browser: any; // Puppeteer Browser instance
  private tabs: Map<string, BrowserTab> = new Map();
  private activeTabId: string | null = null;
  private tabPool: BrowserTab[] = [];
  private coordinationQueue: CrossTabAction[] = [];
  private isProcessingQueue = false;

  // Performance tracking
  private tabMetrics: Map<string, TabMetrics> = new Map();
  private orchestratorMetrics = {
    tabsCreated: 0,
    tabsClosed: 0,
    actionsExecuted: 0,
    coordinationEvents: 0,
    avgTabLifetime: 0,
    peakTabCount: 0,
  };

  constructor(config: BrowserConfig) {
    super(config);
    this.logger = new Logger("BrowserOrchestrator");
  }

  async initialize(): Promise<void> {
    try {
      this.status = "initializing";
      this.logger.info("Initializing Browser Orchestrator", {
        maxTabs: this.config.coordination?.maxTabs,
        strategy: this.config.coordination?.coordinationStrategy,
      });

      // Import Puppeteer dynamically
      const puppeteer = await safeImport("puppeteer");
      if (!puppeteer) {
        throw new IntegrationBaseError(
          "Puppeteer not available. Install puppeteer for browser automation.",
          "PUPPETEER_MISSING",
          "BrowserOrchestrator",
          "critical",
          false,
        );
      }

      // Launch browser with configuration
      this.browser = await puppeteer.launch({
        headless: this.config.puppeteer?.headless ?? true,
        devtools: this.config.puppeteer?.devtools ?? false,
        defaultViewport: this.config.puppeteer?.defaultViewport ?? {
          width: 1920,
          height: 1080,
        },
        userAgent: this.config.puppeteer?.userAgent,
        timeout: this.config.puppeteer?.timeout ?? 30000,
        slowMo: this.config.puppeteer?.slowMo,
        args: this.config.puppeteer?.args ?? [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-default-apps",
        ],
        ignoreHTTPSErrors: this.config.puppeteer?.ignoreHTTPSErrors ?? true,
        handleSIGINT: this.config.puppeteer?.handleSIGINT ?? false,
        handleSIGTERM: this.config.puppeteer?.handleSIGTERM ?? false,
        handleSIGHUP: this.config.puppeteer?.handleSIGHUP ?? false,
      });

      // Initialize tab pool if configured
      if (this.config.coordination?.tabPoolSize > 0) {
        await this.initializeTabPool();
      }

      // Start coordination queue processor
      this.startCoordinationProcessor();

      this.status = "ready";
      this.logger.info("Browser Orchestrator initialized successfully");
      this.emit("initialized", { timestamp: new Date() });
    } catch (error) {
      this.status = "error";
      const orchestratorError = new IntegrationBaseError(
        `Failed to initialize Browser Orchestrator: ${error.message}`,
        "INIT_FAILED",
        "BrowserOrchestrator",
        "critical",
        false,
        { originalError: error.message },
      );

      this.emitError(orchestratorError);
      throw orchestratorError;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info("Shutting down Browser Orchestrator");
      this.status = "shutdown";

      // Close all tabs
      const closePromises = Array.from(this.tabs.values()).map((tab) =>
        this.closeTab(tab.id).catch((error) =>
          this.logger.warn(`Failed to close tab ${tab.id}`, error),
        ),
      );
      await Promise.all(closePromises);

      // Close browser
      if (this.browser) {
        await this.browser.close();
      }

      this.logger.info("Browser Orchestrator shutdown complete");
      this.emit("shutdown", { timestamp: new Date() });
    } catch (error) {
      this.logger.error("Error during Browser Orchestrator shutdown", error);
      throw error;
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      if (!this.browser || !this.browser.isConnected()) {
        return "critical";
      }

      // Check if we can create a simple tab
      const testTab = await this.createTab({ url: "about:blank" });
      await this.closeTab(testTab.id);

      const tabCount = this.tabs.size;
      const maxTabs = this.config.coordination?.maxTabs ?? 10;

      if (tabCount > maxTabs * 0.9) {
        return "warning"; // Near capacity
      }

      return "healthy";
    } catch (error) {
      this.logger.error("Health check failed", error);
      return "critical";
    }
  }

  getMetrics(): Record<string, number> {
    return {
      ...this.orchestratorMetrics,
      activeTabs: this.tabs.size,
      tabPoolSize: this.tabPool.length,
      queuedActions: this.coordinationQueue.length,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  // === TAB MANAGEMENT ===

  async createTab(config?: TabConfig): Promise<BrowserTab> {
    try {
      const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if we can reuse a tab from the pool
      let page: any;
      if (this.tabPool.length > 0 && !config?.isolateContext) {
        const pooledTab = this.tabPool.pop()!;
        page = pooledTab.page;
        this.logger.debug("Reusing tab from pool", {
          tabId,
          pooledTabId: pooledTab.id,
        });
      } else {
        page = await this.browser.newPage();
        this.logger.debug("Created new browser page", { tabId });
      }

      // Configure tab
      if (config?.viewport) {
        await page.setViewport(config.viewport);
      }

      if (config?.userAgent) {
        await page.setUserAgent(config.userAgent);
      }

      if (config?.permissions) {
        const context = page.browser().defaultBrowserContext();
        await context.overridePermissions(
          config.url || "about:blank",
          config.permissions,
        );
      }

      // Create tab context
      const context: TabContext = {
        cookies: {},
        localStorage: {},
        sessionStorage: {},
        userAgent:
          config?.userAgent || (await page.evaluate(() => navigator.userAgent)),
        viewport: config?.viewport || { width: 1920, height: 1080 },
        permissions: config?.permissions || [],
      };

      // Create tab coordination
      const coordination: TabCoordination = {
        parentTab: config?.parentTab,
        childTabs: [],
        sharedState: {},
        eventHandlers: new Map(),
        communicationChannels: [],
      };

      // If this is a child tab, update parent
      if (config?.parentTab && this.tabs.has(config.parentTab)) {
        const parentTab = this.tabs.get(config.parentTab)!;
        parentTab.coordination.childTabs.push(tabId);
      }

      // Initialize metrics
      const metrics: TabMetrics = {
        loadTime: 0,
        domContentLoaded: 0,
        networkRequests: 0,
        jsErrors: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      };

      // Set up metrics collection
      this.setupTabMetrics(page, tabId, metrics);

      const tab: BrowserTab = {
        id: tabId,
        url: config?.url || "about:blank",
        title: "",
        status: "loading",
        page,
        context,
        metrics,
        coordination,
      };

      // Navigate if URL provided
      if (config?.url && config.url !== "about:blank") {
        const startTime = performance.now();
        await page.goto(config.url, {
          waitUntil: "domcontentloaded",
          timeout: this.config.puppeteer?.timeout ?? 30000,
        });

        tab.title = await page.title();
        tab.status = "ready";
        metrics.loadTime = performance.now() - startTime;
      } else {
        tab.status = "ready";
      }

      this.tabs.set(tabId, tab);
      this.orchestratorMetrics.tabsCreated++;
      this.orchestratorMetrics.peakTabCount = Math.max(
        this.orchestratorMetrics.peakTabCount,
        this.tabs.size,
      );

      this.logger.info("Tab created successfully", {
        tabId,
        url: tab.url,
        title: tab.title,
        loadTime: metrics.loadTime,
      });

      this.emit("tab_created", { tab, timestamp: new Date() });
      return tab;
    } catch (error) {
      const tabError = new IntegrationBaseError(
        `Failed to create tab: ${error.message}`,
        "TAB_CREATE_FAILED",
        "BrowserOrchestrator",
        "medium",
        true,
        { config },
      );

      this.emitError(tabError);
      throw tabError;
    }
  }

  getTabs(): BrowserTab[] {
    return Array.from(this.tabs.values());
  }

  getActiveTab(): BrowserTab | null {
    if (this.activeTabId && this.tabs.has(this.activeTabId)) {
      return this.tabs.get(this.activeTabId)!;
    }
    return null;
  }

  async closeTab(tabId: string): Promise<void> {
    try {
      const tab = this.tabs.get(tabId);
      if (!tab) {
        throw new Error(`Tab not found: ${tabId}`);
      }

      // Close child tabs first
      const closeChildPromises = tab.coordination.childTabs.map((childId) =>
        this.closeTab(childId).catch((error) =>
          this.logger.warn(`Failed to close child tab ${childId}`, error),
        ),
      );
      await Promise.all(closeChildPromises);

      // Update parent tab if this is a child
      if (tab.coordination.parentTab) {
        const parentTab = this.tabs.get(tab.coordination.parentTab);
        if (parentTab) {
          parentTab.coordination.childTabs =
            parentTab.coordination.childTabs.filter((id) => id !== tabId);
        }
      }

      // Close the page
      if (!tab.page.isClosed()) {
        await tab.page.close();
      }

      // Update active tab if this was active
      if (this.activeTabId === tabId) {
        this.activeTabId = null;
      }

      this.tabs.delete(tabId);
      this.orchestratorMetrics.tabsClosed++;

      this.logger.info("Tab closed successfully", { tabId });
      this.emit("tab_closed", { tabId, timestamp: new Date() });
    } catch (error) {
      const closeError = new IntegrationBaseError(
        `Failed to close tab ${tabId}: ${error.message}`,
        "TAB_CLOSE_FAILED",
        "BrowserOrchestrator",
        "medium",
        true,
        { tabId },
      );

      this.emitError(closeError);
      throw closeError;
    }
  }

  // === COORDINATION METHODS ===

  async coordinateAction(action: CrossTabAction): Promise<ActionResult> {
    try {
      this.logger.info("Coordinating cross-tab action", {
        actionId: action.id,
        type: action.type,
        participants: action.participants.length,
      });

      // Validate participants
      for (const tabId of action.participants) {
        if (!this.tabs.has(tabId)) {
          throw new Error(`Participant tab not found: ${tabId}`);
        }
      }

      // Execute coordination based on synchronization strategy
      let result: ActionResult;

      switch (action.synchronization.strategy) {
        case "barrier":
          result = await this.executeBarrierCoordination(action);
          break;
        case "consensus":
          result = await this.executeConsensusCoordination(action);
          break;
        case "leader":
          result = await this.executeLeaderCoordination(action);
          break;
        case "eventual":
          result = await this.executeEventualCoordination(action);
          break;
        default:
          throw new Error(
            `Unknown synchronization strategy: ${action.synchronization.strategy}`,
          );
      }

      this.orchestratorMetrics.coordinationEvents++;
      this.emit("coordination_completed", {
        action,
        result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const coordinationError = new IntegrationBaseError(
        `Cross-tab coordination failed: ${error.message}`,
        "COORDINATION_FAILED",
        "BrowserOrchestrator",
        "high",
        true,
        { actionId: action.id, actionType: action.type },
      );

      this.emitError(coordinationError);
      throw coordinationError;
    }
  }

  async distributeLoad(
    tasks: BrowserTask[],
  ): Promise<Map<string, ActionResult>> {
    try {
      this.logger.info("Distributing load across tabs", {
        taskCount: tasks.length,
        availableTabs: this.tabs.size,
      });

      const results = new Map<string, ActionResult>();
      const strategy =
        this.config.coordination?.coordinationStrategy ?? "adaptive";

      switch (strategy) {
        case "sequential":
          return await this.distributeSequential(tasks);
        case "parallel":
          return await this.distributeParallel(tasks);
        case "adaptive":
          return await this.distributeAdaptive(tasks);
        default:
          throw new Error(`Unknown distribution strategy: ${strategy}`);
      }
    } catch (error) {
      const distributionError = new IntegrationBaseError(
        `Load distribution failed: ${error.message}`,
        "DISTRIBUTION_FAILED",
        "BrowserOrchestrator",
        "high",
        true,
        { taskCount: tasks.length },
      );

      this.emitError(distributionError);
      throw distributionError;
    }
  }

  async synchronizeState(): Promise<void> {
    try {
      this.logger.info("Synchronizing state across tabs", {
        tabCount: this.tabs.size,
      });

      if (!this.config.coordination?.globalStateManagement) {
        this.logger.debug("Global state management disabled");
        return;
      }

      // Collect state from all tabs
      const statePromises = Array.from(this.tabs.values()).map(async (tab) => {
        try {
          const cookies = await tab.page.cookies();
          const localStorage = await tab.page.evaluate(() => ({
            ...localStorage,
          }));
          const sessionStorage = await tab.page.evaluate(() => ({
            ...sessionStorage,
          }));

          return {
            tabId: tab.id,
            cookies,
            localStorage,
            sessionStorage,
          };
        } catch (error) {
          this.logger.warn(`Failed to collect state from tab ${tab.id}`, error);
          return null;
        }
      });

      const states = (await Promise.all(statePromises)).filter(
        (state) => state !== null,
      );

      // Merge and synchronize state
      const mergedState = this.mergeTabStates(states);

      // Apply merged state to all tabs
      const syncPromises = Array.from(this.tabs.values()).map(async (tab) => {
        try {
          // Set cookies
          await tab.page.setCookie(...mergedState.cookies);

          // Set localStorage
          await tab.page.evaluate((ls: any) => {
            Object.keys(ls).forEach((key) => {
              localStorage.setItem(key, ls[key]);
            });
          }, mergedState.localStorage);

          // Set sessionStorage
          await tab.page.evaluate((ss: any) => {
            Object.keys(ss).forEach((key) => {
              sessionStorage.setItem(key, ss[key]);
            });
          }, mergedState.sessionStorage);
        } catch (error) {
          this.logger.warn(`Failed to sync state to tab ${tab.id}`, error);
        }
      });

      await Promise.all(syncPromises);
      this.logger.info("State synchronization completed");
    } catch (error) {
      const syncError = new IntegrationBaseError(
        `State synchronization failed: ${error.message}`,
        "STATE_SYNC_FAILED",
        "BrowserOrchestrator",
        "medium",
        true,
      );

      this.emitError(syncError);
      throw syncError;
    }
  }

  async optimizePerformance(): Promise<void> {
    try {
      this.logger.info("Optimizing browser performance");

      // Close idle tabs
      await this.closeIdleTabs();

      // Optimize memory usage
      await this.optimizeMemoryUsage();

      // Update tab pool
      await this.optimizeTabPool();

      // Clean up resources
      await this.cleanupResources();

      this.logger.info("Performance optimization completed");
    } catch (error) {
      this.logger.error("Performance optimization failed", error);
      // Don't throw - this is a best-effort operation
    }
  }

  // === PRIVATE HELPER METHODS ===

  private async initializeTabPool(): Promise<void> {
    const poolSize = this.config.coordination?.tabPoolSize ?? 3;
    this.logger.info("Initializing tab pool", { poolSize });

    for (let i = 0; i < poolSize; i++) {
      try {
        const tab = await this.createTab({ url: "about:blank" });
        this.tabPool.push(tab);
      } catch (error) {
        this.logger.warn(`Failed to create pooled tab ${i}`, error);
      }
    }
  }

  private startCoordinationProcessor(): void {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    this.processCoordinationQueue();
  }

  private async processCoordinationQueue(): Promise<void> {
    while (this.isProcessingQueue && this.coordinationQueue.length > 0) {
      const action = this.coordinationQueue.shift();
      if (action) {
        try {
          await this.coordinateAction(action);
        } catch (error) {
          this.logger.error(
            "Failed to process queued coordination action",
            error,
          );
        }
      }

      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  private setupTabMetrics(page: any, tabId: string, metrics: TabMetrics): void {
    // Track network requests
    page.on("request", () => {
      metrics.networkRequests++;
    });

    // Track JavaScript errors
    page.on("pageerror", () => {
      metrics.jsErrors++;
    });

    // Track DOM content loaded
    page.on("domcontentloaded", () => {
      metrics.domContentLoaded = performance.now();
    });

    // Periodically collect memory metrics
    const metricsInterval = setInterval(async () => {
      try {
        const memoryMetrics = await page.metrics();
        metrics.memoryUsage = memoryMetrics.JSHeapUsedSize || 0;
        metrics.cpuUsage = memoryMetrics.TaskDuration || 0;
      } catch (error) {
        // Page might be closed
        clearInterval(metricsInterval);
      }
    }, 5000);

    // Clean up interval when tab is closed
    page.on("close", () => {
      clearInterval(metricsInterval);
    });
  }

  private async executeBarrierCoordination(
    action: CrossTabAction,
  ): Promise<ActionResult> {
    // All participants must reach the barrier before proceeding
    const startTime = performance.now();
    const results: Map<string, any> = new Map();

    // Execute steps in parallel, synchronizing at barrier points
    for (const step of action.sequence) {
      if (step.syncPoint) {
        // Wait for all participants to complete previous steps
        await this.waitForBarrier(action.participants);
      }

      const tab = this.tabs.get(step.tabId);
      if (!tab) {
        throw new Error(`Tab not found for step: ${step.tabId}`);
      }

      const stepResult = await this.executeActionStep(tab, step.action);
      results.set(step.tabId, stepResult);
    }

    return {
      success: true,
      result: Object.fromEntries(results),
      duration: performance.now() - startTime,
      metadata: {
        strategy: "barrier",
        participants: action.participants.length,
      },
      tabId: action.coordinator,
      timestamp: new Date(),
    };
  }

  private async executeConsensusCoordination(
    action: CrossTabAction,
  ): Promise<ActionResult> {
    // Participants must reach consensus on the action
    const startTime = performance.now();
    const votes: Map<string, boolean> = new Map();

    // Collect votes from participants
    for (const participantId of action.participants) {
      const tab = this.tabs.get(participantId);
      if (tab) {
        // Simple consensus: check if tab can execute action
        const canExecute = await this.canTabExecuteAction(tab, action);
        votes.set(participantId, canExecute);
      }
    }

    // Check if consensus reached
    const requiredVotes = Math.ceil(action.participants.length * 0.6); // 60% consensus
    const positiveVotes = Array.from(votes.values()).filter(
      (vote) => vote,
    ).length;

    if (positiveVotes < requiredVotes) {
      throw new Error(
        `Consensus not reached: ${positiveVotes}/${requiredVotes} required`,
      );
    }

    // Execute action on consenting tabs
    const results: Map<string, any> = new Map();
    for (const [participantId, vote] of votes) {
      if (vote) {
        const tab = this.tabs.get(participantId)!;
        const stepResult = await this.executeActionSteps(tab, action.sequence);
        results.set(participantId, stepResult);
      }
    }

    return {
      success: true,
      result: Object.fromEntries(results),
      duration: performance.now() - startTime,
      metadata: {
        strategy: "consensus",
        consensus: `${positiveVotes}/${action.participants.length}`,
      },
      tabId: action.coordinator,
      timestamp: new Date(),
    };
  }

  private async executeLeaderCoordination(
    action: CrossTabAction,
  ): Promise<ActionResult> {
    // Coordinator leads the action
    const startTime = performance.now();
    const coordinatorTab = this.tabs.get(action.coordinator);

    if (!coordinatorTab) {
      throw new Error(`Coordinator tab not found: ${action.coordinator}`);
    }

    // Execute leader action first
    const leaderResult = await this.executeActionSteps(
      coordinatorTab,
      action.sequence,
    );

    // Then coordinate followers
    const followerResults: Map<string, any> = new Map();
    for (const participantId of action.participants) {
      if (participantId !== action.coordinator) {
        const tab = this.tabs.get(participantId);
        if (tab) {
          const followerResult = await this.executeActionSteps(
            tab,
            action.sequence,
          );
          followerResults.set(participantId, followerResult);
        }
      }
    }

    return {
      success: true,
      result: {
        leader: leaderResult,
        followers: Object.fromEntries(followerResults),
      },
      duration: performance.now() - startTime,
      metadata: { strategy: "leader", coordinator: action.coordinator },
      tabId: action.coordinator,
      timestamp: new Date(),
    };
  }

  private async executeEventualCoordination(
    action: CrossTabAction,
  ): Promise<ActionResult> {
    // Eventually consistent - execute without strict synchronization
    const startTime = performance.now();
    const results: Map<string, any> = new Map();

    // Execute on all participants in parallel
    const executionPromises = action.participants.map(async (participantId) => {
      const tab = this.tabs.get(participantId);
      if (tab) {
        try {
          const result = await this.executeActionSteps(tab, action.sequence);
          results.set(participantId, result);
        } catch (error) {
          this.logger.warn(
            `Eventual coordination failed for tab ${participantId}`,
            error,
          );
          results.set(participantId, { error: error.message });
        }
      }
    });

    await Promise.all(executionPromises);

    return {
      success: true,
      result: Object.fromEntries(results),
      duration: performance.now() - startTime,
      metadata: {
        strategy: "eventual",
        participants: action.participants.length,
      },
      tabId: action.coordinator,
      timestamp: new Date(),
    };
  }

  private async distributeSequential(
    tasks: BrowserTask[],
  ): Promise<Map<string, ActionResult>> {
    const results = new Map<string, ActionResult>();

    for (const task of tasks) {
      const tab = await this.getAvailableTab();
      const result = await this.executeBrowserTask(tab, task);
      results.set(task.id, result);
    }

    return results;
  }

  private async distributeParallel(
    tasks: BrowserTask[],
  ): Promise<Map<string, ActionResult>> {
    const results = new Map<string, ActionResult>();

    const executionPromises = tasks.map(async (task) => {
      const tab = await this.getAvailableTab();
      const result = await this.executeBrowserTask(tab, task);
      results.set(task.id, result);
    });

    await Promise.all(executionPromises);
    return results;
  }

  private async distributeAdaptive(
    tasks: BrowserTask[],
  ): Promise<Map<string, ActionResult>> {
    // Adaptive distribution based on task complexity and tab availability
    const results = new Map<string, ActionResult>();
    const simpleTasks: BrowserTask[] = [];
    const complexTasks: BrowserTask[] = [];

    // Categorize tasks
    for (const task of tasks) {
      if (this.isComplexTask(task)) {
        complexTasks.push(task);
      } else {
        simpleTasks.push(task);
      }
    }

    // Execute complex tasks sequentially
    for (const task of complexTasks) {
      const tab = await this.getAvailableTab();
      const result = await this.executeBrowserTask(tab, task);
      results.set(task.id, result);
    }

    // Execute simple tasks in parallel
    const simplePromises = simpleTasks.map(async (task) => {
      const tab = await this.getAvailableTab();
      const result = await this.executeBrowserTask(tab, task);
      results.set(task.id, result);
    });

    await Promise.all(simplePromises);
    return results;
  }

  private async getAvailableTab(): Promise<BrowserTab> {
    // Find an available tab or create a new one
    const availableTab = Array.from(this.tabs.values()).find(
      (tab) =>
        tab.status === "ready" && tab.coordination.childTabs.length === 0,
    );

    if (availableTab) {
      return availableTab;
    }

    // Create new tab if under limit
    const maxTabs = this.config.coordination?.maxTabs ?? 10;
    if (this.tabs.size < maxTabs) {
      return await this.createTab();
    }

    // Wait for a tab to become available
    return new Promise((resolve) => {
      const checkAvailability = () => {
        const tab = Array.from(this.tabs.values()).find(
          (t) => t.status === "ready",
        );
        if (tab) {
          resolve(tab);
        } else {
          setTimeout(checkAvailability, 100);
        }
      };
      checkAvailability();
    });
  }

  private async executeBrowserTask(
    tab: BrowserTab,
    task: BrowserTask,
  ): Promise<ActionResult> {
    const startTime = performance.now();

    try {
      // Execute the browser task
      const result = await this.executeActionSteps(
        tab,
        task.browser.action.sequence,
      );

      this.orchestratorMetrics.actionsExecuted++;

      return {
        success: true,
        result,
        duration: performance.now() - startTime,
        metadata: { taskId: task.id, taskType: task.browser.action.type },
        tabId: tab.id,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: performance.now() - startTime,
        metadata: { taskId: task.id, error: error.message },
        tabId: tab.id,
        timestamp: new Date(),
      };
    }
  }

  private async executeActionSteps(
    tab: BrowserTab,
    steps: any[],
  ): Promise<any> {
    const results = [];

    for (const step of steps) {
      const result = await this.executeActionStep(tab, step);
      results.push(result);
    }

    return results;
  }

  private async executeActionStep(tab: BrowserTab, step: any): Promise<any> {
    const page = tab.page;

    switch (step.action) {
      case "navigate":
        await page.goto(step.value);
        tab.url = step.value;
        tab.title = await page.title();
        return { action: "navigate", url: step.value };

      case "click":
        await page.click(step.selector);
        return { action: "click", selector: step.selector };

      case "type":
        await page.type(step.selector, step.value);
        return { action: "type", selector: step.selector, value: step.value };

      case "wait":
        await page.waitForSelector(step.selector, {
          timeout: step.timeout || 5000,
        });
        return { action: "wait", selector: step.selector };

      case "extract":
        const content = await page.$eval(step.selector, (el) => el.textContent);
        return { action: "extract", selector: step.selector, content };

      case "screenshot":
        const screenshot = await page.screenshot({ encoding: "base64" });
        return { action: "screenshot", data: screenshot };

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  private isComplexTask(task: BrowserTask): boolean {
    // Simple heuristic for task complexity
    const actionCount = task.browser.action.sequence.length;
    const hasCoordination = task.browser.coordination.requiresSync;
    const hasValidation = !!task.browser.validation.expectedResult;

    return actionCount > 5 || hasCoordination || hasValidation;
  }

  private async waitForBarrier(participants: string[]): Promise<void> {
    // Simple barrier implementation - wait for all participants to be ready
    return new Promise((resolve) => {
      const checkBarrier = () => {
        const allReady = participants.every((id) => {
          const tab = this.tabs.get(id);
          return tab && tab.status === "ready";
        });

        if (allReady) {
          resolve();
        } else {
          setTimeout(checkBarrier, 50);
        }
      };
      checkBarrier();
    });
  }

  private async canTabExecuteAction(
    tab: BrowserTab,
    action: CrossTabAction,
  ): boolean {
    // Check if tab can execute the action
    try {
      return tab.status === "ready" && !tab.page.isClosed();
    } catch {
      return false;
    }
  }

  private mergeTabStates(states: any[]): any {
    // Simple state merging - last write wins
    const merged = {
      cookies: [],
      localStorage: {},
      sessionStorage: {},
    };

    for (const state of states) {
      merged.cookies = [...merged.cookies, ...state.cookies];
      Object.assign(merged.localStorage, state.localStorage);
      Object.assign(merged.sessionStorage, state.sessionStorage);
    }

    return merged;
  }

  private async closeIdleTabs(): Promise<void> {
    const idleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    for (const [tabId, tab] of this.tabs) {
      if (
        tab.metrics.lastActivity &&
        now - tab.metrics.lastActivity.getTime() > idleThreshold
      ) {
        await this.closeTab(tabId);
      }
    }
  }

  private async optimizeMemoryUsage(): Promise<void> {
    // Trigger garbage collection on all tabs
    const gcPromises = Array.from(this.tabs.values()).map(async (tab) => {
      try {
        await tab.page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
      } catch (error) {
        // Ignore errors
      }
    });

    await Promise.all(gcPromises);
  }

  private async optimizeTabPool(): Promise<void> {
    const optimalPoolSize = Math.max(1, Math.min(3, this.tabs.size / 2));

    // Adjust pool size
    while (this.tabPool.length > optimalPoolSize) {
      const tab = this.tabPool.pop()!;
      await this.closeTab(tab.id);
    }

    while (this.tabPool.length < optimalPoolSize) {
      const tab = await this.createTab({ url: "about:blank" });
      this.tabPool.push(tab);
    }
  }

  private async cleanupResources(): Promise<void> {
    // Clean up any hanging resources
    this.coordinationQueue = [];

    // Reset metrics that might accumulate
    this.orchestratorMetrics.avgTabLifetime =
      this.calculateAverageTabLifetime();
  }

  private calculateAverageTabLifetime(): number {
    if (this.orchestratorMetrics.tabsClosed === 0) {
      return 0;
    }

    // Simple estimation based on closed tabs
    return (
      this.orchestratorMetrics.totalRequests /
      this.orchestratorMetrics.tabsClosed
    );
  }
}

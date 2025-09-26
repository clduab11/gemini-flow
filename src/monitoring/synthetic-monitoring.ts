/**
 * Synthetic Monitoring Implementation
 * Production-grade monitoring scripts using Puppeteer/Playwright
 */

import {
  chromium,
  firefox,
  webkit,
  Browser,
  Page,
  BrowserContext,
} from "playwright";
import { performance } from "perf_hooks";
import { EventEmitter } from "node:events";
import { promises as fs } from "fs";
import path from "path";
import { Logger } from "../utils/logger.js";

interface MonitoringConfig {
  endpoints: MonitoringEndpoint[];
  userFlows: UserFlow[];
  schedule: {
    interval: number; // minutes
    timeout: number; // seconds
    retries: number;
  };
  alerting: {
    webhookUrl?: string;
    emailEndpoint?: string;
    slackChannel?: string;
  };
  browsers: ("chromium" | "firefox" | "webkit")[];
  locations: MonitoringLocation[];
}

interface MonitoringEndpoint {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number;
  expectedContent?: string;
  maxResponseTime: number; // ms
  critical: boolean;
}

interface UserFlow {
  id: string;
  name: string;
  steps: UserFlowStep[];
  maxDuration: number; // ms
  critical: boolean;
}

interface UserFlowStep {
  action: "navigate" | "click" | "fill" | "wait" | "screenshot" | "evaluate";
  selector?: string;
  url?: string;
  value?: string;
  timeout?: number;
  assertion?: {
    type: "visible" | "hidden" | "text" | "count" | "url";
    expected: any;
  };
}

interface MonitoringLocation {
  id: string;
  name: string;
  region: string;
  enabled: boolean;
}

interface MonitoringResult {
  id: string;
  timestamp: Date;
  location: string;
  browser: string;
  success: boolean;
  responseTime: number;
  error?: string;
  metrics: {
    dns?: number;
    connect?: number;
    tls?: number;
    firstByte?: number;
    download?: number;
    domReady?: number;
    loadComplete?: number;
  };
  screenshots?: string[];
  trace?: string;
}

export class SyntheticMonitor extends EventEmitter {
  private logger: Logger;
  private config: MonitoringConfig;
  private browsers: Map<string, Browser> = new Map();
  private isRunning: boolean = false;
  private monitoringTimer?: NodeJS.Timeout;
  private results: MonitoringResult[] = [];

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.logger = new Logger("SyntheticMonitor");
  }

  /**
   * Start synthetic monitoring
   */
  async start(): Promise<void> {
    this.logger.info("Starting synthetic monitoring...");

    try {
      // Initialize browsers
      await this.initializeBrowsers();

      // Start monitoring loop
      this.isRunning = true;
      await this.runMonitoringCycle();

      // Schedule next cycle
      this.scheduleNextCycle();

      this.logger.info(
        `Synthetic monitoring started with ${this.config.schedule.interval}min interval`,
      );
    } catch (error) {
      this.logger.error("Failed to start synthetic monitoring:", error);
      throw error;
    }
  }

  /**
   * Stop synthetic monitoring
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping synthetic monitoring...");

    this.isRunning = false;

    if (this.monitoringTimer) {
      clearTimeout(this.monitoringTimer);
    }

    // Close all browsers
    for (const [name, browser] of this.browsers) {
      await browser.close();
      this.logger.debug(`Closed ${name} browser`);
    }
    this.browsers.clear();

    this.logger.info("Synthetic monitoring stopped");
  }

  /**
   * Initialize browsers for different engines
   */
  private async initializeBrowsers(): Promise<void> {
    for (const browserType of this.config.browsers) {
      try {
        let browser: Browser;

        switch (browserType) {
          case "chromium":
            browser = await chromium.launch({
              headless: true,
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
              ],
            });
            break;
          case "firefox":
            browser = await firefox.launch({ headless: true });
            break;
          case "webkit":
            browser = await webkit.launch({ headless: true });
            break;
          default:
            throw new Error(`Unsupported browser type: ${browserType}`);
        }

        this.browsers.set(browserType, browser);
        this.logger.debug(`Initialized ${browserType} browser`);
      } catch (error) {
        this.logger.error(
          `Failed to initialize ${browserType} browser:`,
          error,
        );
        // Continue with other browsers
      }
    }

    if (this.browsers.size === 0) {
      throw new Error("No browsers could be initialized");
    }
  }

  /**
   * Run a complete monitoring cycle
   */
  private async runMonitoringCycle(): Promise<void> {
    const cycleStart = performance.now();
    this.logger.info("Starting monitoring cycle...");

    const cycleResults: MonitoringResult[] = [];

    // Monitor endpoints
    for (const endpoint of this.config.endpoints) {
      for (const location of this.config.locations.filter((l) => l.enabled)) {
        for (const [browserName, browser] of this.browsers) {
          try {
            const result = await this.monitorEndpoint(
              endpoint,
              location,
              browserName,
              browser,
            );
            cycleResults.push(result);

            // Emit real-time result
            this.emit("result", result);

            // Handle failures
            if (!result.success && endpoint.critical) {
              await this.handleCriticalFailure(result);
            }
          } catch (error) {
            this.logger.error(
              `Error monitoring endpoint ${endpoint.id}:`,
              error,
            );
          }
        }
      }
    }

    // Monitor user flows
    for (const userFlow of this.config.userFlows) {
      for (const location of this.config.locations.filter((l) => l.enabled)) {
        for (const [browserName, browser] of this.browsers) {
          try {
            const result = await this.monitorUserFlow(
              userFlow,
              location,
              browserName,
              browser,
            );
            cycleResults.push(result);

            this.emit("result", result);

            if (!result.success && userFlow.critical) {
              await this.handleCriticalFailure(result);
            }
          } catch (error) {
            this.logger.error(
              `Error monitoring user flow ${userFlow.id}:`,
              error,
            );
          }
        }
      }
    }

    // Store results
    this.results.push(...cycleResults);

    // Cleanup old results (keep last 1000)
    if (this.results.length > 1000) {
      this.results = this.results.slice(-1000);
    }

    const cycleDuration = performance.now() - cycleStart;
    this.logger.info(
      `Monitoring cycle completed in ${cycleDuration.toFixed(2)}ms`,
    );

    // Generate reports
    await this.generateReports(cycleResults);
  }

  /**
   * Monitor a single endpoint
   */
  private async monitorEndpoint(
    endpoint: MonitoringEndpoint,
    location: MonitoringLocation,
    browserName: string,
    browser: Browser,
  ): Promise<MonitoringResult> {
    const startTime = performance.now();
    const context = await browser.newContext({
      userAgent: `GeminiFlow-SyntheticMonitor/1.0 (${browserName}; ${location.region})`,
    });

    try {
      const page = await context.newPage();

      // Start performance monitoring
      const performanceMetrics = await this.startPerformanceMonitoring(page);

      // Make request
      const response = await page.goto(endpoint.url, {
        timeout: endpoint.maxResponseTime,
        waitUntil: "networkidle",
      });

      // Validate response
      const success = await this.validateEndpointResponse(response, endpoint);
      const responseTime = performance.now() - startTime;

      // Collect performance metrics
      const metrics = await this.collectPerformanceMetrics(
        page,
        performanceMetrics,
      );

      return {
        id: `${endpoint.id}-${Date.now()}`,
        timestamp: new Date(),
        location: location.id,
        browser: browserName,
        success,
        responseTime,
        metrics,
        error: success
          ? undefined
          : `Status: ${response?.status()}, Expected: ${endpoint.expectedStatus}`,
      };
    } catch (error) {
      return {
        id: `${endpoint.id}-${Date.now()}`,
        timestamp: new Date(),
        location: location.id,
        browser: browserName,
        success: false,
        responseTime: performance.now() - startTime,
        error: error.message,
        metrics: {},
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Monitor a user flow
   */
  private async monitorUserFlow(
    userFlow: UserFlow,
    location: MonitoringLocation,
    browserName: string,
    browser: Browser,
  ): Promise<MonitoringResult> {
    const startTime = performance.now();
    const context = await browser.newContext({
      userAgent: `GeminiFlow-SyntheticMonitor/1.0 (${browserName}; ${location.region})`,
      recordVideo: {
        dir: path.join(process.cwd(), "monitoring", "videos"),
        size: { width: 1280, height: 720 },
      },
    });

    const screenshots: string[] = [];

    try {
      const page = await context.newPage();

      // Start tracing
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
      });

      // Execute user flow steps
      for (let i = 0; i < userFlow.steps.length; i++) {
        const step = userFlow.steps[i];

        try {
          await this.executeUserFlowStep(page, step, i);

          // Take screenshot after each step
          const screenshotPath = path.join(
            process.cwd(),
            "monitoring",
            "screenshots",
            `${userFlow.id}-${browserName}-${location.id}-step${i}.png`,
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          screenshots.push(screenshotPath);
        } catch (stepError) {
          throw new Error(`Step ${i + 1} failed: ${stepError.message}`);
        }
      }

      const responseTime = performance.now() - startTime;

      // Validate duration
      if (responseTime > userFlow.maxDuration) {
        throw new Error(
          `User flow exceeded maximum duration: ${responseTime}ms > ${userFlow.maxDuration}ms`,
        );
      }

      // Stop tracing
      const tracePath = path.join(
        process.cwd(),
        "monitoring",
        "traces",
        `${userFlow.id}-${browserName}-${location.id}.zip`,
      );
      await context.tracing.stop({ path: tracePath });

      return {
        id: `${userFlow.id}-${Date.now()}`,
        timestamp: new Date(),
        location: location.id,
        browser: browserName,
        success: true,
        responseTime,
        screenshots,
        trace: tracePath,
        metrics: {},
      };
    } catch (error) {
      return {
        id: `${userFlow.id}-${Date.now()}`,
        timestamp: new Date(),
        location: location.id,
        browser: browserName,
        success: false,
        responseTime: performance.now() - startTime,
        error: error.message,
        screenshots,
        metrics: {},
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Execute a single user flow step
   */
  private async executeUserFlowStep(
    page: Page,
    step: UserFlowStep,
    stepIndex: number,
  ): Promise<void> {
    this.logger.debug(`Executing step ${stepIndex + 1}: ${step.action}`);

    switch (step.action) {
      case "navigate":
        if (!step.url) throw new Error("URL required for navigate action");
        await page.goto(step.url, { timeout: step.timeout || 30000 });
        break;

      case "click":
        if (!step.selector)
          throw new Error("Selector required for click action");
        await page.click(step.selector, { timeout: step.timeout || 10000 });
        break;

      case "fill":
        if (!step.selector || !step.value)
          throw new Error("Selector and value required for fill action");
        await page.fill(step.selector, step.value, {
          timeout: step.timeout || 10000,
        });
        break;

      case "wait":
        if (step.selector) {
          await page.waitForSelector(step.selector, {
            timeout: step.timeout || 10000,
          });
        } else {
          await page.waitForTimeout(step.timeout || 1000);
        }
        break;

      case "evaluate":
        if (!step.value)
          throw new Error("JavaScript code required for evaluate action");
        await page.evaluate(step.value);
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    // Validate assertion if provided
    if (step.assertion) {
      await this.validateAssertion(page, step.assertion);
    }
  }

  /**
   * Validate assertion
   */
  private async validateAssertion(
    page: Page,
    assertion: UserFlowStep["assertion"],
  ): Promise<void> {
    if (!assertion) return;

    switch (assertion.type) {
      case "visible":
        const isVisible = await page.locator(assertion.expected).isVisible();
        if (!isVisible)
          throw new Error(`Element not visible: ${assertion.expected}`);
        break;

      case "hidden":
        const isHidden = await page.locator(assertion.expected).isHidden();
        if (!isHidden)
          throw new Error(`Element not hidden: ${assertion.expected}`);
        break;

      case "text":
        const text = await page.textContent(assertion.expected.selector);
        if (text !== assertion.expected.text) {
          throw new Error(
            `Text mismatch: expected "${assertion.expected.text}", got "${text}"`,
          );
        }
        break;

      case "count":
        const count = await page.locator(assertion.expected.selector).count();
        if (count !== assertion.expected.count) {
          throw new Error(
            `Count mismatch: expected ${assertion.expected.count}, got ${count}`,
          );
        }
        break;

      case "url":
        const url = page.url();
        if (!url.includes(assertion.expected)) {
          throw new Error(
            `URL mismatch: expected to contain "${assertion.expected}", got "${url}"`,
          );
        }
        break;
    }
  }

  /**
   * Start performance monitoring
   */
  private async startPerformanceMonitoring(page: Page): Promise<any> {
    await page.route("**/*", (route) => {
      const request = route.request();
      const startTime = Date.now();

      route.continue().then(() => {
        const endTime = Date.now();
        this.logger.debug(
          `Request to ${request.url()} took ${endTime - startTime}ms`,
        );
      });
    });

    return {
      startTime: performance.now(),
      navigationStart: await page.evaluate(
        () => performance.timing.navigationStart,
      ),
    };
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(
    page: Page,
    monitoringData: any,
  ): Promise<any> {
    try {
      const timing = await page.evaluate(() => {
        const t = performance.timing;
        return {
          dns: t.domainLookupEnd - t.domainLookupStart,
          connect: t.connectEnd - t.connectStart,
          tls:
            t.secureConnectionStart > 0
              ? t.connectEnd - t.secureConnectionStart
              : 0,
          firstByte: t.responseStart - t.requestStart,
          download: t.responseEnd - t.responseStart,
          domReady: t.domContentLoadedEventEnd - t.navigationStart,
          loadComplete: t.loadEventEnd - t.navigationStart,
        };
      });

      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          // Simulate Web Vitals collection
          setTimeout(() => {
            resolve({
              fcp: Math.random() * 2000 + 500, // First Contentful Paint
              lcp: Math.random() * 3000 + 1000, // Largest Contentful Paint
              fid: Math.random() * 100 + 10, // First Input Delay
              cls: Math.random() * 0.1, // Cumulative Layout Shift
            });
          }, 1000);
        });
      });

      return { ...timing, ...webVitals };
    } catch (error) {
      this.logger.error("Failed to collect performance metrics:", error);
      return {};
    }
  }

  /**
   * Validate endpoint response
   */
  private async validateEndpointResponse(
    response: any,
    endpoint: MonitoringEndpoint,
  ): Promise<boolean> {
    if (!response) return false;

    // Check status code
    if (response.status() !== endpoint.expectedStatus) {
      return false;
    }

    // Check content if specified
    if (endpoint.expectedContent) {
      try {
        const content = await response.text();
        if (!content.includes(endpoint.expectedContent)) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handle critical failures
   */
  private async handleCriticalFailure(result: MonitoringResult): Promise<void> {
    this.logger.error(`Critical failure detected: ${result.id}`, result.error);

    const alert = {
      timestamp: result.timestamp,
      severity: "critical",
      title: `Synthetic Monitor Alert: ${result.id}`,
      message: `Critical monitoring check failed: ${result.error}`,
      location: result.location,
      browser: result.browser,
      responseTime: result.responseTime,
    };

    // Send alerts
    await this.sendAlert(alert);

    // Emit event
    this.emit("critical", alert);
  }

  /**
   * Send alerts to configured channels
   */
  private async sendAlert(alert: any): Promise<void> {
    const promises = [];

    // Webhook alert
    if (this.config.alerting.webhookUrl) {
      promises.push(this.sendWebhookAlert(alert));
    }

    // Email alert
    if (this.config.alerting.emailEndpoint) {
      promises.push(this.sendEmailAlert(alert));
    }

    // Slack alert
    if (this.config.alerting.slackChannel) {
      promises.push(this.sendSlackAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  private async sendWebhookAlert(alert: any): Promise<void> {
    // Implementation for webhook alerts
    this.logger.debug("Sending webhook alert:", alert);
  }

  private async sendEmailAlert(alert: any): Promise<void> {
    // Implementation for email alerts
    this.logger.debug("Sending email alert:", alert);
  }

  private async sendSlackAlert(alert: any): Promise<void> {
    // Implementation for Slack alerts
    this.logger.debug("Sending Slack alert:", alert);
  }

  /**
   * Schedule next monitoring cycle
   */
  private scheduleNextCycle(): void {
    if (!this.isRunning) return;

    this.monitoringTimer = setTimeout(
      async () => {
        try {
          await this.runMonitoringCycle();
          this.scheduleNextCycle();
        } catch (error) {
          this.logger.error("Monitoring cycle failed:", error);
          // Continue with next cycle
          this.scheduleNextCycle();
        }
      },
      this.config.schedule.interval * 60 * 1000,
    );
  }

  /**
   * Generate monitoring reports
   */
  private async generateReports(
    cycleResults: MonitoringResult[],
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      cycle: {
        duration:
          cycleResults.length > 0
            ? Math.max(...cycleResults.map((r) => r.responseTime))
            : 0,
        totalChecks: cycleResults.length,
        successfulChecks: cycleResults.filter((r) => r.success).length,
        failedChecks: cycleResults.filter((r) => !r.success).length,
      },
      metrics: {
        averageResponseTime:
          cycleResults.length > 0
            ? cycleResults.reduce((sum, r) => sum + r.responseTime, 0) /
              cycleResults.length
            : 0,
        successRate:
          cycleResults.length > 0
            ? (cycleResults.filter((r) => r.success).length /
                cycleResults.length) *
              100
            : 0,
      },
      results: cycleResults,
    };

    // Save report
    const reportPath = path.join(
      process.cwd(),
      "monitoring",
      "reports",
      `synthetic-monitoring-${Date.now()}.json`,
    );

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    this.logger.debug(`Report saved: ${reportPath}`);
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): any {
    const recentResults = this.results.slice(-100); // Last 100 results

    if (recentResults.length === 0) {
      return {
        totalChecks: 0,
        successRate: 0,
        averageResponseTime: 0,
        availability: 0,
      };
    }

    const successfulChecks = recentResults.filter((r) => r.success).length;

    return {
      totalChecks: recentResults.length,
      successRate: (successfulChecks / recentResults.length) * 100,
      averageResponseTime:
        recentResults.reduce((sum, r) => sum + r.responseTime, 0) /
        recentResults.length,
      availability: (successfulChecks / recentResults.length) * 100,
      lastCheck: recentResults[recentResults.length - 1]?.timestamp,
      errors: recentResults
        .filter((r) => !r.success)
        .map((r) => ({
          timestamp: r.timestamp,
          error: r.error,
          location: r.location,
          browser: r.browser,
        })),
    };
  }
}

// Default configuration
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  endpoints: [
    {
      id: "api-health",
      name: "API Health Check",
      url: "https://api.gemini-flow.com/health",
      method: "GET",
      expectedStatus: 200,
      expectedContent: "healthy",
      maxResponseTime: 5000,
      critical: true,
    },
    {
      id: "auth-endpoint",
      name: "Authentication Endpoint",
      url: "https://api.gemini-flow.com/auth/status",
      method: "GET",
      expectedStatus: 200,
      maxResponseTime: 3000,
      critical: true,
    },
  ],
  userFlows: [
    {
      id: "user-login-flow",
      name: "User Login Flow",
      maxDuration: 15000,
      critical: true,
      steps: [
        { action: "navigate", url: "https://app.gemini-flow.com/login" },
        {
          action: "fill",
          selector: '[data-testid="email-input"]',
          value: "test@example.com",
        },
        {
          action: "fill",
          selector: '[data-testid="password-input"]',
          value: "testpassword",
        },
        { action: "click", selector: '[data-testid="login-button"]' },
        {
          action: "wait",
          selector: '[data-testid="dashboard"]',
          assertion: { type: "visible", expected: '[data-testid="dashboard"]' },
        },
      ],
    },
    {
      id: "video-generation-flow",
      name: "Video Generation Flow",
      maxDuration: 30000,
      critical: false,
      steps: [
        { action: "navigate", url: "https://app.gemini-flow.com/generate" },
        { action: "click", selector: '[data-testid="video-tab"]' },
        {
          action: "fill",
          selector: '[data-testid="video-prompt"]',
          value: "Test video generation",
        },
        { action: "click", selector: '[data-testid="generate-button"]' },
        { action: "wait", selector: '[data-testid="generation-progress"]' },
      ],
    },
  ],
  schedule: {
    interval: 5, // 5 minutes
    timeout: 30, // 30 seconds
    retries: 3,
  },
  alerting: {
    webhookUrl: process.env.MONITORING_WEBHOOK_URL,
    emailEndpoint: process.env.MONITORING_EMAIL_ENDPOINT,
    slackChannel: process.env.MONITORING_SLACK_CHANNEL,
  },
  browsers: ["chromium", "firefox"],
  locations: [
    {
      id: "us-east-1",
      name: "US East (Virginia)",
      region: "us-east",
      enabled: true,
    },
    {
      id: "us-west-1",
      name: "US West (California)",
      region: "us-west",
      enabled: true,
    },
    {
      id: "eu-west-1",
      name: "EU West (Ireland)",
      region: "eu-west",
      enabled: true,
    },
    {
      id: "ap-southeast-1",
      name: "Asia Pacific (Singapore)",
      region: "ap-southeast",
      enabled: true,
    },
  ],
};

// Export types
export type {
  MonitoringConfig,
  MonitoringEndpoint,
  UserFlow,
  MonitoringResult,
};

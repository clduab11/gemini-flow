/**
 * Playwright Service Base Class
 *
 * Base class for all Playwright-based Google service automations
 */

import { Browser, BrowserContext, Page, chromium } from 'playwright';

export interface PlaywrightServiceConfig {
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  userDataDir?: string;
}

export interface AuthenticationState {
  isAuthenticated: boolean;
  cookies?: any[];
  storageState?: any;
}

export abstract class PlaywrightServiceBase {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected config: PlaywrightServiceConfig;
  protected serviceUrl: string;
  protected serviceName: string;

  constructor(serviceUrl: string, serviceName: string, config: PlaywrightServiceConfig = {}) {
    this.serviceUrl = serviceUrl;
    this.serviceName = serviceName;
    this.config = {
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
      viewport: config.viewport ?? { width: 1920, height: 1080 },
      userDataDir: config.userDataDir
    };
  }

  /**
   * Initialize browser and navigate to service
   */
  async initialize(): Promise<void> {
    console.log(`[${this.serviceName}] Initializing Playwright browser...`);

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const contextOptions: any = {
      viewport: this.config.viewport,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (this.config.userDataDir) {
      contextOptions.storageState = this.config.userDataDir;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);

    console.log(`[${this.serviceName}] Navigating to ${this.serviceUrl}...`);
    await this.page.goto(this.serviceUrl, { waitUntil: 'networkidle' });
  }

  /**
   * Check if user is authenticated
   */
  abstract checkAuthentication(): Promise<AuthenticationState>;

  /**
   * Perform authentication flow
   */
  abstract authenticate(): Promise<void>;

  /**
   * Execute service-specific action
   */
  abstract executeAction(action: string, params: any): Promise<any>;

  /**
   * Wait for element with retry
   */
  protected async waitForElement(selector: string, timeout: number = this.config.timeout!): Promise<boolean> {
    try {
      await this.page!.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch (error) {
      console.error(`[${this.serviceName}] Element not found: ${selector}`);
      return false;
    }
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(path: string): Promise<void> {
    if (this.page) {
      await this.page.screenshot({ path, fullPage: true });
      console.log(`[${this.serviceName}] Screenshot saved to ${path}`);
    }
  }

  /**
   * Save authentication state
   */
  async saveAuthState(path: string): Promise<void> {
    if (this.context) {
      await this.context.storageState({ path });
      console.log(`[${this.serviceName}] Auth state saved to ${path}`);
    }
  }

  /**
   * Load authentication state
   */
  async loadAuthState(path: string): Promise<void> {
    if (this.browser) {
      this.context = await this.browser.newContext({
        storageState: path
      });
      this.page = await this.context.newPage();
      console.log(`[${this.serviceName}] Auth state loaded from ${path}`);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log(`[${this.serviceName}] Cleaning up...`);

    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get current page
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current context
   */
  getContext(): BrowserContext | null {
    return this.context;
  }
}

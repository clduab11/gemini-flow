/**
 * Real User Monitoring (RUM) Implementation
 * Comprehensive real user performance and experience monitoring
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

interface RUMConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
  samplingRate: number; // 0-1 (percentage of users to monitor)
  sessionTimeout: number; // minutes
  features: {
    performanceMetrics: boolean;
    errorTracking: boolean;
    userJourney: boolean;
    customMetrics: boolean;
    heatmaps: boolean;
    sessionRecording: boolean;
  };
  privacy: {
    maskSensitiveData: boolean;
    excludeFields: string[];
    ipAnonymization: boolean;
  };
}

interface RUMMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Navigation Timing
  domContentLoaded?: number;
  loadComplete?: number;
  
  // Custom Performance Metrics
  timeToInteractive?: number;
  speedIndex?: number;
  totalBlockingTime?: number;
  
  // Resource Timing
  resources?: ResourceTiming[];
  
  // User Experience
  userAgent: string;
  viewport: { width: number; height: number };
  connectionType?: string;
  deviceMemory?: number;
  
  // Page Information
  url: string;
  referrer: string;
  timestamp: number;
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

interface RUMError {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
}

interface UserJourney {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pageViews: PageView[];
  interactions: UserInteraction[];
  conversions: Conversion[];
  errors: RUMError[];
}

interface PageView {
  url: string;
  title: string;
  timestamp: number;
  duration?: number;
  exitType?: 'navigation' | 'reload' | 'close';
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'hover' | 'resize';
  element?: string;
  timestamp: number;
  coordinates?: { x: number; y: number };
  value?: string;
}

interface Conversion {
  type: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class RealUserMonitor extends EventEmitter {
  private logger: Logger;
  private config: RUMConfig;
  private sessionId: string;
  private userId?: string;
  private currentJourney: UserJourney;
  private metricsBuffer: RUMMetrics[] = [];
  private errorsBuffer: RUMError[] = [];
  private isInitialized: boolean = false;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: RUMConfig) {
    super();
    this.config = config;
    this.logger = new Logger('RealUserMonitor');
    this.sessionId = this.generateSessionId();
    this.currentJourney = this.initializeJourney();
  }

  /**
   * Initialize RUM monitoring
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      // Check if we should monitor this user (sampling)
      if (Math.random() > this.config.samplingRate) {
        this.logger.debug('User excluded from RUM monitoring due to sampling rate');
        return;
      }

      // Initialize performance monitoring
      if (this.config.features.performanceMetrics) {
        await this.initializePerformanceMonitoring();
      }

      // Initialize error tracking
      if (this.config.features.errorTracking) {
        this.initializeErrorTracking();
      }

      // Initialize user journey tracking
      if (this.config.features.userJourney) {
        this.initializeUserJourneyTracking();
      }

      // Initialize custom metrics
      if (this.config.features.customMetrics) {
        this.initializeCustomMetrics();
      }

      // Start data collection
      this.startDataCollection();

      this.isInitialized = true;
      this.logger.info('RUM monitoring initialized');

    } catch (error) {
      this.logger.error('Failed to initialize RUM monitoring:', error);
      throw error;
    }
  }

  /**
   * Initialize performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      this.logger.warn('PerformanceObserver not available');
      return;
    }

    // Observe Navigation Timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.collectNavigationMetrics(entry as PerformanceNavigationTiming);
        }
      });
      navObserver.observe({ type: 'navigation', buffered: true });
      this.observers.set('navigation', navObserver);
    } catch (error) {
      this.logger.warn('Navigation timing observer failed:', error);
    }

    // Observe Resource Timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.collectResourceMetrics(entry as PerformanceResourceTiming);
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      this.logger.warn('Resource timing observer failed:', error);
    }

    // Observe Paint Timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.collectPaintMetrics(entry as PerformancePaintTiming);
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      this.logger.warn('Paint timing observer failed:', error);
    }

    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          this.collectLCPMetric(lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    } catch (error) {
      this.logger.warn('LCP observer failed:', error);
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.collectFIDMetric((entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', fidObserver);
    } catch (error) {
      this.logger.warn('FID observer failed:', error);
    }

    // Collect Layout Shift metrics
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            this.collectCLSMetric((entry as any).value);
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    } catch (error) {
      this.logger.warn('CLS observer failed:', error);
    }
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      const error: RUMError = {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId
      };

      this.errorsBuffer.push(error);
      this.currentJourney.errors.push(error);
      this.emit('error', error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error: RUMError = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId
      };

      this.errorsBuffer.push(error);
      this.currentJourney.errors.push(error);
      this.emit('error', error);
    });
  }

  /**
   * Initialize user journey tracking
   */
  private initializeUserJourneyTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page views
    this.trackPageView();

    // Track navigation changes (SPA)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView();
    };

    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    // Track user interactions
    this.trackUserInteractions();

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.onPageVisible();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.finalizeSession();
    });
  }

  /**
   * Initialize custom metrics collection
   */
  private initializeCustomMetrics(): void {
    // Create global API for custom metrics
    if (typeof window !== 'undefined') {
      (window as any).geminiFlowRUM = {
        track: (name: string, value: number, metadata?: Record<string, any>) => {
          this.trackCustomMetric(name, value, metadata);
        },
        trackConversion: (type: string, value: number, metadata?: Record<string, any>) => {
          this.trackConversion(type, value, metadata);
        },
        setUserId: (userId: string) => {
          this.setUserId(userId);
        }
      };
    }
  }

  /**
   * Start periodic data collection and transmission
   */
  private startDataCollection(): void {
    // Send data every 30 seconds
    setInterval(() => {
      this.sendBufferedData();
    }, 30000);

    // Send data on page visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.sendBufferedData();
        }
      });
    }
  }

  /**
   * Collect navigation metrics
   */
  private collectNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics: RUMMetrics = {
      ttfb: entry.responseStart - entry.requestStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connectionType: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory
    };

    this.metricsBuffer.push(metrics);
    this.emit('metrics', metrics);
  }

  /**
   * Collect resource metrics
   */
  private collectResourceMetrics(entry: PerformanceResourceTiming): void {
    const resource: ResourceTiming = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    // Add to current metrics
    const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
    if (currentMetrics) {
      if (!currentMetrics.resources) {
        currentMetrics.resources = [];
      }
      currentMetrics.resources.push(resource);
    }
  }

  /**
   * Collect paint metrics
   */
  private collectPaintMetrics(entry: PerformancePaintTiming): void {
    const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
    if (currentMetrics) {
      if (entry.name === 'first-contentful-paint') {
        currentMetrics.fcp = entry.startTime;
      }
    }
  }

  /**
   * Collect LCP metric
   */
  private collectLCPMetric(value: number): void {
    const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
    if (currentMetrics) {
      currentMetrics.lcp = value;
    }
  }

  /**
   * Collect FID metric
   */
  private collectFIDMetric(value: number): void {
    const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
    if (currentMetrics) {
      currentMetrics.fid = value;
    }
  }

  /**
   * Collect CLS metric
   */
  private collectCLSMetric(value: number): void {
    const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
    if (currentMetrics) {
      if (!currentMetrics.cls) {
        currentMetrics.cls = 0;
      }
      currentMetrics.cls += value;
    }
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    const pageView: PageView = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    };

    // Set duration for previous page view
    const lastPageView = this.currentJourney.pageViews[this.currentJourney.pageViews.length - 1];
    if (lastPageView && !lastPageView.duration) {
      lastPageView.duration = Date.now() - lastPageView.timestamp;
    }

    this.currentJourney.pageViews.push(pageView);
    this.emit('pageView', pageView);
  }

  /**
   * Track user interactions
   */
  private trackUserInteractions(): void {
    if (typeof document === 'undefined') return;

    // Track clicks
    document.addEventListener('click', (event) => {
      const interaction: UserInteraction = {
        type: 'click',
        element: this.getElementSelector(event.target as Element),
        timestamp: Date.now(),
        coordinates: { x: event.clientX, y: event.clientY }
      };

      this.currentJourney.interactions.push(interaction);
    }, { passive: true });

    // Track scrolling
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const interaction: UserInteraction = {
          type: 'scroll',
          timestamp: Date.now(),
          coordinates: { x: window.scrollX, y: window.scrollY }
        };

        this.currentJourney.interactions.push(interaction);
      }, 100);
    }, { passive: true });

    // Track input changes
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      
      // Mask sensitive data if configured
      let value = target.value;
      if (this.config.privacy.maskSensitiveData) {
        if (target.type === 'password' || target.type === 'email' || 
            this.config.privacy.excludeFields.includes(target.name)) {
          value = '[MASKED]';
        }
      }

      const interaction: UserInteraction = {
        type: 'input',
        element: this.getElementSelector(target),
        timestamp: Date.now(),
        value
      };

      this.currentJourney.interactions.push(interaction);
    }, { passive: true });
  }

  /**
   * Track custom metric
   */
  public trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : ''
    };

    this.emit('customMetric', metric);
    this.sendCustomMetric(metric);
  }

  /**
   * Track conversion
   */
  public trackConversion(type: string, value: number, metadata?: Record<string, any>): void {
    const conversion: Conversion = {
      type,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.currentJourney.conversions.push(conversion);
    this.emit('conversion', conversion);
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    this.currentJourney.userId = userId;
  }

  /**
   * Handle page hidden
   */
  private onPageHidden(): void {
    this.sendBufferedData();
  }

  /**
   * Handle page visible
   */
  private onPageVisible(): void {
    // Resume tracking
  }

  /**
   * Finalize session
   */
  private finalizeSession(): void {
    this.currentJourney.endTime = Date.now();
    
    // Set duration for last page view
    const lastPageView = this.currentJourney.pageViews[this.currentJourney.pageViews.length - 1];
    if (lastPageView && !lastPageView.duration) {
      lastPageView.duration = Date.now() - lastPageView.timestamp;
      lastPageView.exitType = 'close';
    }

    this.sendBufferedData();
    this.sendUserJourney();
  }

  /**
   * Send buffered data
   */
  private async sendBufferedData(): Promise<void> {
    if (this.metricsBuffer.length === 0 && this.errorsBuffer.length === 0) {
      return;
    }

    try {
      const payload = {
        sessionId: this.sessionId,
        userId: this.userId,
        metrics: this.metricsBuffer.splice(0),
        errors: this.errorsBuffer.splice(0),
        timestamp: Date.now()
      };

      await this.sendToEndpoint('metrics', payload);
    } catch (error) {
      this.logger.error('Failed to send RUM data:', error);
    }
  }

  /**
   * Send user journey data
   */
  private async sendUserJourney(): Promise<void> {
    try {
      await this.sendToEndpoint('journey', this.currentJourney);
    } catch (error) {
      this.logger.error('Failed to send user journey:', error);
    }
  }

  /**
   * Send custom metric
   */
  private async sendCustomMetric(metric: any): Promise<void> {
    try {
      await this.sendToEndpoint('custom', metric);
    } catch (error) {
      this.logger.error('Failed to send custom metric:', error);
    }
  }

  /**
   * Send data to endpoint
   */
  private async sendToEndpoint(endpoint: string, data: any): Promise<void> {
    const url = `${this.config.endpoint}/${endpoint}`;
    
    // Use sendBeacon if available for reliability
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback to fetch
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {
        // Ignore fetch errors for RUM data
      });
    }
  }

  /**
   * Utility functions
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeJourney(): UserJourney {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: Date.now(),
      pageViews: [],
      interactions: [],
      conversions: [],
      errors: []
    };
  }

  private getResourceType(name: string): string {
    if (name.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (name.match(/\.(css|scss|sass)$/)) return 'stylesheet';
    if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (name.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (name.match(/\.(mp4|webm|ogg|avi)$/)) return 'video';
    if (name.match(/\.(mp3|wav|ogg|m4a)$/)) return 'audio';
    return 'other';
  }

  private getElementSelector(element: Element): string {
    if (!element) return '';
    
    // Use data-testid if available
    const testId = element.getAttribute('data-testid');
    if (testId) return `[data-testid="${testId}"]`;
    
    // Use ID if available
    if (element.id) return `#${element.id}`;
    
    // Use class names
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Use tag name as fallback
    return element.tagName.toLowerCase();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Stop all observers
    for (const [name, observer] of this.observers) {
      observer.disconnect();
      this.logger.debug(`Stopped ${name} observer`);
    }
    this.observers.clear();

    // Send final data
    this.finalizeSession();

    this.isInitialized = false;
    this.logger.info('RUM monitoring destroyed');
  }

  /**
   * Get current session statistics
   */
  public getSessionStats(): any {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.currentJourney.startTime,
      duration: Date.now() - this.currentJourney.startTime,
      pageViews: this.currentJourney.pageViews.length,
      interactions: this.currentJourney.interactions.length,
      conversions: this.currentJourney.conversions.length,
      errors: this.currentJourney.errors.length,
      metricsCollected: this.metricsBuffer.length
    };
  }
}

// Default configuration
export const DEFAULT_RUM_CONFIG: RUMConfig = {
  enabled: true,
  apiKey: process.env.RUM_API_KEY || '',
  endpoint: process.env.RUM_ENDPOINT || 'https://rum.gemini-flow.com/api',
  samplingRate: 0.1, // Monitor 10% of users
  sessionTimeout: 30, // 30 minutes
  features: {
    performanceMetrics: true,
    errorTracking: true,
    userJourney: true,
    customMetrics: true,
    heatmaps: false,
    sessionRecording: false
  },
  privacy: {
    maskSensitiveData: true,
    excludeFields: ['password', 'email', 'ssn', 'credit_card'],
    ipAnonymization: true
  }
};

// Export types
export type { RUMConfig, RUMMetrics, RUMError, UserJourney };
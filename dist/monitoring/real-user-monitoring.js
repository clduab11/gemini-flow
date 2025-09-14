/**
 * Real User Monitoring (RUM) Implementation
 * Comprehensive real user performance and experience monitoring
 */
import { EventEmitter } from "events";
import { Logger } from "../utils/logger";
export class RealUserMonitor extends EventEmitter {
    logger;
    config;
    sessionId;
    userId;
    currentJourney;
    metricsBuffer = [];
    errorsBuffer = [];
    isInitialized = false;
    observers = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger("RealUserMonitor");
        this.sessionId = this.generateSessionId();
        this.currentJourney = this.initializeJourney();
    }
    /**
     * Initialize RUM monitoring
     */
    async initialize() {
        if (!this.config.enabled || this.isInitialized) {
            return;
        }
        try {
            // Check if we should monitor this user (sampling)
            if (Math.random() > this.config.samplingRate) {
                this.logger.debug("User excluded from RUM monitoring due to sampling rate");
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
            this.logger.info("RUM monitoring initialized");
        }
        catch (error) {
            this.logger.error("Failed to initialize RUM monitoring:", error);
            throw error;
        }
    }
    /**
     * Initialize performance monitoring
     */
    async initializePerformanceMonitoring() {
        if (typeof window === "undefined" || !window.PerformanceObserver) {
            this.logger.warn("PerformanceObserver not available");
            return;
        }
        // Observe Navigation Timing
        try {
            const navObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    this.collectNavigationMetrics(entry);
                }
            });
            navObserver.observe({ type: "navigation", buffered: true });
            this.observers.set("navigation", navObserver);
        }
        catch (error) {
            this.logger.warn("Navigation timing observer failed:", error);
        }
        // Observe Resource Timing
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    this.collectResourceMetrics(entry);
                }
            });
            resourceObserver.observe({ type: "resource", buffered: true });
            this.observers.set("resource", resourceObserver);
        }
        catch (error) {
            this.logger.warn("Resource timing observer failed:", error);
        }
        // Observe Paint Timing
        try {
            const paintObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    this.collectPaintMetrics(entry);
                }
            });
            paintObserver.observe({ type: "paint", buffered: true });
            this.observers.set("paint", paintObserver);
        }
        catch (error) {
            this.logger.warn("Paint timing observer failed:", error);
        }
        // Observe Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    this.collectLCPMetric(lastEntry.startTime);
                }
            });
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
            this.observers.set("lcp", lcpObserver);
        }
        catch (error) {
            this.logger.warn("LCP observer failed:", error);
        }
        // Observe First Input Delay
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    this.collectFIDMetric(entry.processingStart - entry.startTime);
                }
            });
            fidObserver.observe({ type: "first-input", buffered: true });
            this.observers.set("fid", fidObserver);
        }
        catch (error) {
            this.logger.warn("FID observer failed:", error);
        }
        // Collect Layout Shift metrics
        try {
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    if (!entry.hadRecentInput) {
                        this.collectCLSMetric(entry.value);
                    }
                }
            });
            clsObserver.observe({ type: "layout-shift", buffered: true });
            this.observers.set("cls", clsObserver);
        }
        catch (error) {
            this.logger.warn("CLS observer failed:", error);
        }
    }
    /**
     * Initialize error tracking
     */
    initializeErrorTracking() {
        if (typeof window === "undefined")
            return;
        // Global error handler
        window.addEventListener("error", (event) => {
            const error = {
                message: event.message,
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionId: this.sessionId,
                userId: this.userId,
            };
            this.errorsBuffer.push(error);
            this.currentJourney.errors.push(error);
            this.emit("error", error);
        });
        // Unhandled promise rejection handler
        window.addEventListener("unhandledrejection", (event) => {
            const error = {
                message: `Unhandled Promise Rejection: ${event.reason}`,
                stack: event.reason?.stack,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionId: this.sessionId,
                userId: this.userId,
            };
            this.errorsBuffer.push(error);
            this.currentJourney.errors.push(error);
            this.emit("error", error);
        });
    }
    /**
     * Initialize user journey tracking
     */
    initializeUserJourneyTracking() {
        if (typeof window === "undefined")
            return;
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
        window.addEventListener("popstate", () => {
            this.trackPageView();
        });
        // Track user interactions
        this.trackUserInteractions();
        // Track page visibility changes
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.onPageHidden();
            }
            else {
                this.onPageVisible();
            }
        });
        // Track page unload
        window.addEventListener("beforeunload", () => {
            this.finalizeSession();
        });
    }
    /**
     * Initialize custom metrics collection
     */
    initializeCustomMetrics() {
        // Create global API for custom metrics
        if (typeof window !== "undefined") {
            window.geminiFlowRUM = {
                track: (name, value, metadata) => {
                    this.trackCustomMetric(name, value, metadata);
                },
                trackConversion: (type, value, metadata) => {
                    this.trackConversion(type, value, metadata);
                },
                setUserId: (userId) => {
                    this.setUserId(userId);
                },
            };
        }
    }
    /**
     * Start periodic data collection and transmission
     */
    startDataCollection() {
        // Send data every 30 seconds
        setInterval(() => {
            this.sendBufferedData();
        }, 30000);
        // Send data on page visibility change
        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    this.sendBufferedData();
                }
            });
        }
    }
    /**
     * Collect navigation metrics
     */
    collectNavigationMetrics(entry) {
        const metrics = {
            ttfb: entry.responseStart - entry.requestStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            connectionType: navigator.connection?.effectiveType,
            deviceMemory: navigator.deviceMemory,
        };
        this.metricsBuffer.push(metrics);
        this.emit("metrics", metrics);
    }
    /**
     * Collect resource metrics
     */
    collectResourceMetrics(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
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
    collectPaintMetrics(entry) {
        const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
        if (currentMetrics) {
            if (entry.name === "first-contentful-paint") {
                currentMetrics.fcp = entry.startTime;
            }
        }
    }
    /**
     * Collect LCP metric
     */
    collectLCPMetric(value) {
        const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
        if (currentMetrics) {
            currentMetrics.lcp = value;
        }
    }
    /**
     * Collect FID metric
     */
    collectFIDMetric(value) {
        const currentMetrics = this.metricsBuffer[this.metricsBuffer.length - 1];
        if (currentMetrics) {
            currentMetrics.fid = value;
        }
    }
    /**
     * Collect CLS metric
     */
    collectCLSMetric(value) {
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
    trackPageView() {
        const pageView = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
        };
        // Set duration for previous page view
        const lastPageView = this.currentJourney.pageViews[this.currentJourney.pageViews.length - 1];
        if (lastPageView && !lastPageView.duration) {
            lastPageView.duration = Date.now() - lastPageView.timestamp;
        }
        this.currentJourney.pageViews.push(pageView);
        this.emit("pageView", pageView);
    }
    /**
     * Track user interactions
     */
    trackUserInteractions() {
        if (typeof document === "undefined")
            return;
        // Track clicks
        document.addEventListener("click", (event) => {
            const interaction = {
                type: "click",
                element: this.getElementSelector(event.target),
                timestamp: Date.now(),
                coordinates: { x: event.clientX, y: event.clientY },
            };
            this.currentJourney.interactions.push(interaction);
        }, { passive: true });
        // Track scrolling
        let scrollTimeout;
        document.addEventListener("scroll", () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const interaction = {
                    type: "scroll",
                    timestamp: Date.now(),
                    coordinates: { x: window.scrollX, y: window.scrollY },
                };
                this.currentJourney.interactions.push(interaction);
            }, 100);
        }, { passive: true });
        // Track input changes
        document.addEventListener("input", (event) => {
            const target = event.target;
            // Mask sensitive data if configured
            let value = target.value;
            if (this.config.privacy.maskSensitiveData) {
                if (target.type === "password" ||
                    target.type === "email" ||
                    this.config.privacy.excludeFields.includes(target.name)) {
                    value = "[MASKED]";
                }
            }
            const interaction = {
                type: "input",
                element: this.getElementSelector(target),
                timestamp: Date.now(),
                value,
            };
            this.currentJourney.interactions.push(interaction);
        }, { passive: true });
    }
    /**
     * Track custom metric
     */
    trackCustomMetric(name, value, metadata) {
        const metric = {
            name,
            value,
            metadata,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            url: typeof window !== "undefined" ? window.location.href : "",
        };
        this.emit("customMetric", metric);
        this.sendCustomMetric(metric);
    }
    /**
     * Track conversion
     */
    trackConversion(type, value, metadata) {
        const conversion = {
            type,
            value,
            timestamp: Date.now(),
            metadata,
        };
        this.currentJourney.conversions.push(conversion);
        this.emit("conversion", conversion);
    }
    /**
     * Set user ID
     */
    setUserId(userId) {
        this.userId = userId;
        this.currentJourney.userId = userId;
    }
    /**
     * Handle page hidden
     */
    onPageHidden() {
        this.sendBufferedData();
    }
    /**
     * Handle page visible
     */
    onPageVisible() {
        // Resume tracking
    }
    /**
     * Finalize session
     */
    finalizeSession() {
        this.currentJourney.endTime = Date.now();
        // Set duration for last page view
        const lastPageView = this.currentJourney.pageViews[this.currentJourney.pageViews.length - 1];
        if (lastPageView && !lastPageView.duration) {
            lastPageView.duration = Date.now() - lastPageView.timestamp;
            lastPageView.exitType = "close";
        }
        this.sendBufferedData();
        this.sendUserJourney();
    }
    /**
     * Send buffered data
     */
    async sendBufferedData() {
        if (this.metricsBuffer.length === 0 && this.errorsBuffer.length === 0) {
            return;
        }
        try {
            const payload = {
                sessionId: this.sessionId,
                userId: this.userId,
                metrics: this.metricsBuffer.splice(0),
                errors: this.errorsBuffer.splice(0),
                timestamp: Date.now(),
            };
            await this.sendToEndpoint("metrics", payload);
        }
        catch (error) {
            this.logger.error("Failed to send RUM data:", error);
        }
    }
    /**
     * Send user journey data
     */
    async sendUserJourney() {
        try {
            await this.sendToEndpoint("journey", this.currentJourney);
        }
        catch (error) {
            this.logger.error("Failed to send user journey:", error);
        }
    }
    /**
     * Send custom metric
     */
    async sendCustomMetric(metric) {
        try {
            await this.sendToEndpoint("custom", metric);
        }
        catch (error) {
            this.logger.error("Failed to send custom metric:", error);
        }
    }
    /**
     * Send data to endpoint
     */
    async sendToEndpoint(endpoint, data) {
        const url = `${this.config.endpoint}/${endpoint}`;
        // Use sendBeacon if available for reliability
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(data)], {
                type: "application/json",
            });
            navigator.sendBeacon(url, blob);
        }
        else {
            // Fallback to fetch
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify(data),
                keepalive: true,
            }).catch(() => {
                // Ignore fetch errors for RUM data
            });
        }
    }
    /**
     * Utility functions
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    initializeJourney() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: Date.now(),
            pageViews: [],
            interactions: [],
            conversions: [],
            errors: [],
        };
    }
    getResourceType(name) {
        if (name.match(/\.(js|jsx|ts|tsx)$/))
            return "script";
        if (name.match(/\.(css|scss|sass)$/))
            return "stylesheet";
        if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/))
            return "image";
        if (name.match(/\.(woff|woff2|ttf|eot)$/))
            return "font";
        if (name.match(/\.(mp4|webm|ogg|avi)$/))
            return "video";
        if (name.match(/\.(mp3|wav|ogg|m4a)$/))
            return "audio";
        return "other";
    }
    getElementSelector(element) {
        if (!element)
            return "";
        // Use data-testid if available
        const testId = element.getAttribute("data-testid");
        if (testId)
            return `[data-testid="${testId}"]`;
        // Use ID if available
        if (element.id)
            return `#${element.id}`;
        // Use class names
        if (element.className) {
            const classes = element.className.split(" ").filter((c) => c.trim());
            if (classes.length > 0) {
                return `.${classes.join(".")}`;
            }
        }
        // Use tag name as fallback
        return element.tagName.toLowerCase();
    }
    /**
     * Cleanup resources
     */
    destroy() {
        // Stop all observers
        for (const [name, observer] of this.observers) {
            observer.disconnect();
            this.logger.debug(`Stopped ${name} observer`);
        }
        this.observers.clear();
        // Send final data
        this.finalizeSession();
        this.isInitialized = false;
        this.logger.info("RUM monitoring destroyed");
    }
    /**
     * Get current session statistics
     */
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: this.currentJourney.startTime,
            duration: Date.now() - this.currentJourney.startTime,
            pageViews: this.currentJourney.pageViews.length,
            interactions: this.currentJourney.interactions.length,
            conversions: this.currentJourney.conversions.length,
            errors: this.currentJourney.errors.length,
            metricsCollected: this.metricsBuffer.length,
        };
    }
}
// Default configuration
export const DEFAULT_RUM_CONFIG = {
    enabled: true,
    apiKey: process.env.RUM_API_KEY || "",
    endpoint: process.env.RUM_ENDPOINT || "https://rum.gemini-flow.com/api",
    samplingRate: 0.1, // Monitor 10% of users
    sessionTimeout: 30, // 30 minutes
    features: {
        performanceMetrics: true,
        errorTracking: true,
        userJourney: true,
        customMetrics: true,
        heatmaps: false,
        sessionRecording: false,
    },
    privacy: {
        maskSensitiveData: true,
        excludeFields: ["password", "email", "ssn", "credit_card"],
        ipAnonymization: true,
    },
};

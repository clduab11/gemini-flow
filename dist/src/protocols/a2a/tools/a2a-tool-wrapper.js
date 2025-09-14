/**
 * A2A Tool Wrapper Base Class
 *
 * Provides a unified interface for wrapping MCP tools with A2A (Agent-to-Agent) capabilities.
 * This base class handles the transformation of MCP tool calls into A2A-compliant messages,
 * manages security contexts, and provides performance optimization hooks.
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
import { PerformanceMonitor } from "../../../monitoring/performance-monitor.js";
/**
 * Abstract base class for A2A tool wrappers
 */
export class A2AToolWrapper extends EventEmitter {
    toolId;
    capability;
    logger;
    cache;
    performanceMonitor;
    metrics = {
        invocations: 0,
        successRate: 0,
        avgLatency: 0,
        cacheHitRate: 0,
        errorCounts: {},
        resourceUtilization: { cpu: 0, memory: 0, network: 0 },
        securityEvents: 0,
        lastInvocation: 0,
    };
    constructor(toolId, capability) {
        super();
        this.toolId = toolId;
        this.capability = capability;
        this.logger = new Logger(`A2AToolWrapper:${toolId}`);
        this.cache = new CacheManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.logger.info("A2A Tool Wrapper initialized", {
            toolId,
            capability: capability.name,
            version: capability.version,
        });
    }
    /**
     * Main entry point for A2A tool invocation
     */
    async invoke(invocation) {
        const startTime = Date.now();
        this.metrics.invocations++;
        this.metrics.lastInvocation = startTime;
        try {
            // Validate security context
            const securityValidation = await this.validateSecurity(invocation.context);
            if (!securityValidation.valid) {
                return this.createErrorResponse(invocation, "SECURITY_VIOLATION", securityValidation.reason || "Security validation failed", startTime);
            }
            // Check rate limits
            const rateLimitCheck = await this.checkRateLimits(invocation.context);
            if (!rateLimitCheck.allowed) {
                return this.createErrorResponse(invocation, "RATE_LIMIT_EXCEEDED", rateLimitCheck.reason || "Rate limit exceeded", startTime);
            }
            // Check cache first if cacheable
            let cachedResult = null;
            if (this.capability.performance.cacheable) {
                cachedResult = await this.getCachedResult(invocation);
                if (cachedResult) {
                    this.metrics.cacheHitRate =
                        (this.metrics.cacheHitRate + 1) / this.metrics.invocations;
                    cachedResult.metadata.cached = true;
                    return cachedResult;
                }
            }
            // Transform A2A invocation to MCP parameters
            const mcpParams = await this.transformToMCP(invocation);
            // Execute the underlying MCP tool
            const mcpResult = await this.executeMCPTool(mcpParams, invocation.context);
            // Transform MCP result back to A2A response
            const a2aResponse = await this.transformFromMCP(mcpResult, invocation, startTime);
            // Cache the result if cacheable and successful
            if (this.capability.performance.cacheable && a2aResponse.success) {
                await this.cacheResult(invocation, a2aResponse);
            }
            // Update metrics
            this.updateMetrics(a2aResponse, startTime);
            // Emit events for monitoring
            this.emit("tool_invoked", {
                toolId: this.toolId,
                success: a2aResponse.success,
                duration: a2aResponse.metadata.executionTime,
                agentId: invocation.context.agentId,
            });
            return a2aResponse;
        }
        catch (error) {
            this.logger.error("A2A tool invocation failed", {
                toolId: this.toolId,
                requestId: invocation.requestId,
                error: error.message,
            });
            const errorResponse = this.createErrorResponse(invocation, "EXECUTION_ERROR", error.message, startTime, error);
            this.updateErrorMetrics(error);
            this.emit("tool_error", { toolId: this.toolId, error, invocation });
            return errorResponse;
        }
    }
    /**
     * Get the A2A capability definition for this tool
     */
    getCapability() {
        return { ...this.capability };
    }
    /**
     * Get current metrics for this tool
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Reset metrics (useful for testing or monitoring cycles)
     */
    resetMetrics() {
        this.metrics = {
            invocations: 0,
            successRate: 0,
            avgLatency: 0,
            cacheHitRate: 0,
            errorCounts: {},
            resourceUtilization: { cpu: 0, memory: 0, network: 0 },
            securityEvents: 0,
            lastInvocation: 0,
        };
    }
    /**
     * Validate security context for the invocation
     */
    async validateSecurity(context) {
        const securityFlags = [];
        // Check minimum trust level
        const trustLevels = [
            "untrusted",
            "basic",
            "verified",
            "trusted",
            "privileged",
        ];
        const requiredIndex = trustLevels.indexOf(this.capability.security.minTrustLevel);
        const actualIndex = trustLevels.indexOf(context.trustLevel);
        if (actualIndex < requiredIndex) {
            return {
                valid: false,
                reason: `Insufficient trust level: required ${this.capability.security.minTrustLevel}, got ${context.trustLevel}`,
                securityFlags: ["INSUFFICIENT_TRUST_LEVEL"],
            };
        }
        // Check required capabilities
        const missingCapabilities = this.capability.security.requiredCapabilities.filter((cap) => !context.capabilities.includes(cap));
        if (missingCapabilities.length > 0) {
            return {
                valid: false,
                reason: `Missing required capabilities: ${missingCapabilities.join(", ")}`,
                securityFlags: ["MISSING_CAPABILITIES"],
            };
        }
        // Additional security checks can be implemented by subclasses
        const additionalChecks = await this.performAdditionalSecurityChecks(context);
        securityFlags.push(...additionalChecks.securityFlags);
        return {
            valid: additionalChecks.valid,
            reason: additionalChecks.reason,
            securityFlags,
        };
    }
    /**
     * Check rate limits for the agent
     */
    async checkRateLimits(context) {
        if (!this.capability.security.rateLimits) {
            return { allowed: true };
        }
        const limits = this.capability.security.rateLimits;
        const now = Date.now();
        const agentKey = `ratelimit:${this.toolId}:${context.agentId}`;
        // Check per-minute limit
        const minuteKey = `${agentKey}:minute:${Math.floor(now / 60000)}`;
        const minuteCount = (await this.cache.get(minuteKey)) || 0;
        if (minuteCount >= limits.perMinute) {
            return {
                allowed: false,
                reason: "Per-minute rate limit exceeded",
                retryAfter: 60 - (Math.floor(now / 1000) % 60),
            };
        }
        // Check per-hour limit
        const hourKey = `${agentKey}:hour:${Math.floor(now / 3600000)}`;
        const hourCount = (await this.cache.get(hourKey)) || 0;
        if (hourCount >= limits.perHour) {
            return {
                allowed: false,
                reason: "Per-hour rate limit exceeded",
                retryAfter: 3600 - (Math.floor(now / 1000) % 3600),
            };
        }
        // Check per-day limit
        const dayKey = `${agentKey}:day:${Math.floor(now / 86400000)}`;
        const dayCount = (await this.cache.get(dayKey)) || 0;
        if (dayCount >= limits.perDay) {
            return {
                allowed: false,
                reason: "Per-day rate limit exceeded",
                retryAfter: 86400 - (Math.floor(now / 1000) % 86400),
            };
        }
        // Increment counters
        await Promise.all([
            this.cache.set(minuteKey, minuteCount + 1, 60000),
            this.cache.set(hourKey, hourCount + 1, 3600000),
            this.cache.set(dayKey, dayCount + 1, 86400000),
        ]);
        return { allowed: true };
    }
    /**
     * Get cached result if available
     */
    async getCachedResult(invocation) {
        const cacheKey = this.generateCacheKey(invocation);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            this.logger.debug("Cache hit for A2A tool invocation", {
                toolId: this.toolId,
                requestId: invocation.requestId,
                cacheKey,
            });
        }
        return cached;
    }
    /**
     * Cache successful result
     */
    async cacheResult(invocation, response) {
        if (!response.success)
            return;
        const cacheKey = this.generateCacheKey(invocation);
        const strategy = this.capability.performance.cacheStrategy || "conservative";
        let ttl;
        switch (strategy) {
            case "aggressive":
                ttl = 300000; // 5 minutes
                break;
            case "conservative":
                ttl = 60000; // 1 minute
                break;
            default:
                return; // No caching
        }
        await this.cache.set(cacheKey, response, ttl);
    }
    /**
     * Generate cache key for invocation
     */
    generateCacheKey(invocation) {
        const keyData = {
            toolId: this.toolId,
            parameters: invocation.parameters,
            agentId: invocation.context.agentId,
            trustLevel: invocation.context.trustLevel,
        };
        return `a2a_tool:${Buffer.from(JSON.stringify(keyData)).toString("base64")}`;
    }
    /**
     * Create error response
     */
    createErrorResponse(invocation, code, message, startTime, details) {
        return {
            requestId: invocation.requestId,
            toolId: this.toolId,
            success: false,
            error: {
                code,
                message,
                details,
            },
            metadata: {
                executionTime: Date.now() - startTime,
                resourceUsage: { cpu: 0, memory: 0, network: 0 },
                cached: false,
                trustVerified: false,
                securityFlags: [],
            },
            timestamp: Date.now(),
        };
    }
    /**
     * Update metrics after successful invocation
     */
    updateMetrics(response, startTime) {
        const executionTime = Date.now() - startTime;
        // Update average latency
        this.metrics.avgLatency =
            (this.metrics.avgLatency * (this.metrics.invocations - 1) +
                executionTime) /
                this.metrics.invocations;
        // Update success rate
        const successes = Math.floor(this.metrics.successRate * (this.metrics.invocations - 1));
        this.metrics.successRate =
            (successes + (response.success ? 1 : 0)) / this.metrics.invocations;
        // Update resource utilization
        this.metrics.resourceUtilization.cpu =
            (this.metrics.resourceUtilization.cpu +
                response.metadata.resourceUsage.cpu) /
                2;
        this.metrics.resourceUtilization.memory =
            (this.metrics.resourceUtilization.memory +
                response.metadata.resourceUsage.memory) /
                2;
        this.metrics.resourceUtilization.network =
            (this.metrics.resourceUtilization.network +
                (response.metadata.resourceUsage.network || 0)) /
                2;
    }
    /**
     * Update error metrics
     */
    updateErrorMetrics(error) {
        const errorType = error.constructor.name;
        this.metrics.errorCounts[errorType] =
            (this.metrics.errorCounts[errorType] || 0) + 1;
    }
    /**
     * Perform additional security checks (can be overridden by subclasses)
     */
    async performAdditionalSecurityChecks(context) {
        return {
            valid: true,
            securityFlags: [],
        };
    }
}
/**
 * Utility functions for A2A tool management
 */
export class A2AToolUtils {
    /**
     * Validate A2A capability definition
     */
    static validateCapability(capability) {
        const errors = [];
        if (!capability.name || typeof capability.name !== "string") {
            errors.push("Capability name is required and must be a string");
        }
        if (!capability.version || typeof capability.version !== "string") {
            errors.push("Capability version is required and must be a string");
        }
        if (!capability.description || typeof capability.description !== "string") {
            errors.push("Capability description is required and must be a string");
        }
        if (!capability.parameters || typeof capability.parameters !== "object") {
            errors.push("Capability parameters definition is required");
        }
        if (!capability.security || typeof capability.security !== "object") {
            errors.push("Capability security configuration is required");
        }
        if (!capability.performance || typeof capability.performance !== "object") {
            errors.push("Capability performance configuration is required");
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Create A2A context from basic parameters
     */
    static createContext(agentId, agentType, sessionId, trustLevel = "basic", capabilities = [], metadata = {}) {
        return {
            agentId,
            agentType,
            sessionId,
            trustLevel,
            capabilities,
            metadata,
            timestamp: Date.now(),
        };
    }
    /**
     * Generate unique request ID
     */
    static generateRequestId() {
        return `a2a_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=a2a-tool-wrapper.js.map
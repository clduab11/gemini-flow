/**
 * A2A Rate Limiter and DDoS Protection System
 *
 * Implements advanced rate limiting and DDoS protection:
 * - Token bucket algorithm with burst capacity
 * - Sliding window rate limiting
 * - Adaptive throttling based on system load
 * - Circuit breakers for fault isolation
 * - Geofencing and IP reputation scoring
 * - Behavioral analysis for anomaly detection
 * - Distributed rate limiting across nodes
 * - Auto-scaling thresholds and backpressure
 */

import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
import { CacheManager } from "./cache-manager.js";

export interface RateLimitRule {
  ruleId: string;
  name: string;
  agentPattern: string | RegExp;
  limits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstCapacity: number;
    concurrentRequests: number;
  };
  priority: number;
  enabled: boolean;
  exemptions?: string[];
  conditions?: {
    timeWindows?: string[];
    messageTypes?: string[];
    capabilities?: string[];
  };
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxRequests: number;
  monitoringWindow: number;
  autoRecovery: boolean;
}

export interface AdaptiveThrottlingConfig {
  enabled: boolean;
  cpuThreshold: number;
  memoryThreshold: number;
  responseTimeThreshold: number;
  backpressureMultiplier: number;
  recoveryRate: number;
}

export interface DDoSProtectionConfig {
  enabled: boolean;
  detectionWindow: number;
  anomalyThreshold: number;
  behaviorAnalysis: boolean;
  ipReputation: boolean;
  geofencing: {
    enabled: boolean;
    allowedRegions: string[];
    blockedRegions: string[];
  };
  autoMitigation: {
    enabled: boolean;
    blockDuration: number;
    escalationLevels: number[];
  };
}

export interface RateLimitingConfig {
  defaultLimits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstCapacity: number;
    concurrentRequests: number;
  };
  circuitBreaker: CircuitBreakerConfig;
  adaptiveThrottling: AdaptiveThrottlingConfig;
  ddosProtection: DDoSProtectionConfig;
  distributedMode: {
    enabled: boolean;
    syncInterval: number;
    consensusThreshold: number;
  };
  monitoring: {
    metricsWindow: number;
    alertThresholds: {
      highUsage: number;
      rateLimitHit: number;
      ddosDetected: number;
    };
  };
}

export interface RateLimitState {
  agentId: string;
  tokens: number;
  lastRefill: number;
  requestCounts: {
    perSecond: number[];
    perMinute: number[];
    perHour: number[];
    perDay: number[];
  };
  concurrentRequests: number;
  circuitState: "closed" | "open" | "half-open";
  lastCircuitStateChange: number;
  reputationScore: number;
  behaviorProfile: BehaviorProfile;
}

export interface BehaviorProfile {
  requestPatterns: Map<string, number>;
  timeDistribution: number[];
  messageTypeDistribution: Map<string, number>;
  averagePayloadSize: number;
  errorRate: number;
  suspiciousBehaviorCount: number;
  lastAnalysis: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  tokensRemaining?: number;
  quotaResetTime?: number;
  circuitState?: string;
  adaptiveMultiplier?: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  averageResponseTime: number;
  activeConnections: number;
  requestRate: number;
  errorRate: number;
  timestamp: number;
}

export class A2ARateLimiter extends EventEmitter {
  private logger: Logger;
  private cache: CacheManager;
  private config: RateLimitingConfig;

  // Rate limiting state
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private agentStates: Map<string, RateLimitState> = new Map();
  private globalState: RateLimitState;

  // Circuit breakers
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  // System monitoring
  private systemMetrics: SystemMetrics;
  private metricsHistory: SystemMetrics[] = [];

  // DDoS protection
  private suspiciousIPs: Map<string, SuspiciousActivity> = new Map();
  private behaviorAnalyzer: BehaviorAnalyzer;
  private ipReputationService: IPReputationService;

  // Adaptive throttling
  private adaptiveMultiplier: number = 1.0;
  private lastAdaptiveAdjustment: number = 0;

  // Performance metrics
  private processingMetrics = {
    requestsProcessed: 0,
    requestsBlocked: 0,
    ddosAttacksDetected: 0,
    circuitBreakersTripped: 0,
    adaptiveAdjustments: 0,
    averageProcessingTime: 0,
  };

  constructor(config: Partial<RateLimitingConfig> = {}) {
    super();
    this.logger = new Logger("A2ARateLimiter");
    this.cache = new CacheManager();

    this.initializeConfig(config);
    this.initializeGlobalState();
    this.initializeDefaultRules();
    this.initializeSystemMonitoring();
    this.initializeDDoSProtection();
    this.startMaintenanceTasks();

    this.logger.info("A2A Rate Limiter initialized", {
      adaptiveThrottling: this.config.adaptiveThrottling.enabled,
      ddosProtection: this.config.ddosProtection.enabled,
      distributedMode: this.config.distributedMode.enabled,
    });
  }

  /**
   * Initialize configuration with defaults
   */
  private initializeConfig(config: Partial<RateLimitingConfig>): void {
    this.config = {
      defaultLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstCapacity: 20,
        concurrentRequests: 5,
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        halfOpenMaxRequests: 3,
        monitoringWindow: 30000,
        autoRecovery: true,
      },
      adaptiveThrottling: {
        enabled: true,
        cpuThreshold: 80,
        memoryThreshold: 85,
        responseTimeThreshold: 1000,
        backpressureMultiplier: 0.5,
        recoveryRate: 0.1,
      },
      ddosProtection: {
        enabled: true,
        detectionWindow: 60000,
        anomalyThreshold: 3,
        behaviorAnalysis: true,
        ipReputation: true,
        geofencing: {
          enabled: false,
          allowedRegions: [],
          blockedRegions: [],
        },
        autoMitigation: {
          enabled: true,
          blockDuration: 300000,
          escalationLevels: [1, 2, 5, 10],
        },
      },
      distributedMode: {
        enabled: false,
        syncInterval: 10000,
        consensusThreshold: 0.6,
      },
      monitoring: {
        metricsWindow: 300000,
        alertThresholds: {
          highUsage: 0.8,
          rateLimitHit: 0.1,
          ddosDetected: 0.05,
        },
      },
      ...config,
    };
  }

  /**
   * Initialize global rate limiting state
   */
  private initializeGlobalState(): void {
    this.globalState = {
      agentId: "global",
      tokens: this.config.defaultLimits.burstCapacity,
      lastRefill: Date.now(),
      requestCounts: {
        perSecond: new Array(60).fill(0),
        perMinute: new Array(60).fill(0),
        perHour: new Array(24).fill(0),
        perDay: new Array(7).fill(0),
      },
      concurrentRequests: 0,
      circuitState: "closed",
      lastCircuitStateChange: Date.now(),
      reputationScore: 1.0,
      behaviorProfile: {
        requestPatterns: new Map(),
        timeDistribution: new Array(24).fill(0),
        messageTypeDistribution: new Map(),
        averagePayloadSize: 0,
        errorRate: 0,
        suspiciousBehaviorCount: 0,
        lastAnalysis: Date.now(),
      },
    };
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    const defaultRule: RateLimitRule = {
      ruleId: "default",
      name: "Default Rate Limit",
      agentPattern: ".*",
      limits: this.config.defaultLimits,
      priority: 0,
      enabled: true,
    };

    this.rateLimitRules.set("default", defaultRule);

    // High priority agents get higher limits
    const highPriorityRule: RateLimitRule = {
      ruleId: "high-priority",
      name: "High Priority Agents",
      agentPattern: "(coordinator|security|monitor).*",
      limits: {
        requestsPerSecond: 50,
        requestsPerMinute: 500,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstCapacity: 100,
        concurrentRequests: 20,
      },
      priority: 10,
      enabled: true,
    };

    this.rateLimitRules.set("high-priority", highPriorityRule);

    // Strict limits for untrusted agents
    const untrustedRule: RateLimitRule = {
      ruleId: "untrusted",
      name: "Untrusted Agents",
      agentPattern: "untrusted-.*",
      limits: {
        requestsPerSecond: 2,
        requestsPerMinute: 20,
        requestsPerHour: 200,
        requestsPerDay: 1000,
        burstCapacity: 5,
        concurrentRequests: 2,
      },
      priority: 20,
      enabled: true,
    };

    this.rateLimitRules.set("untrusted", untrustedRule);
  }

  /**
   * Initialize system monitoring
   */
  private initializeSystemMonitoring(): void {
    this.systemMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      requestRate: 0,
      errorRate: 0,
      timestamp: Date.now(),
    };

    // Start system metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
  }

  /**
   * Initialize DDoS protection components
   */
  private initializeDDoSProtection(): void {
    this.behaviorAnalyzer = new BehaviorAnalyzer(this.config.ddosProtection);
    this.ipReputationService = new IPReputationService(
      this.config.ddosProtection,
    );
  }

  /**
   * Check if request is allowed under rate limits
   */
  async checkRateLimit(
    agentId: string,
    messageType: string = "request",
    payloadSize: number = 0,
    sourceIP?: string,
  ): Promise<RateLimitResult> {
    const startTime = Date.now();

    try {
      // Get or create agent state
      let agentState = this.agentStates.get(agentId);
      if (!agentState) {
        agentState = this.createAgentState(agentId);
        this.agentStates.set(agentId, agentState);
      }

      // Check circuit breaker state
      if (agentState.circuitState === "open") {
        const timeSinceOpen = Date.now() - agentState.lastCircuitStateChange;
        if (timeSinceOpen < this.config.circuitBreaker.recoveryTimeout) {
          this.processingMetrics.requestsBlocked++;
          return {
            allowed: false,
            reason: "Circuit breaker open",
            retryAfter:
              this.config.circuitBreaker.recoveryTimeout - timeSinceOpen,
            circuitState: "open",
          };
        } else {
          // Transition to half-open
          agentState.circuitState = "half-open";
          agentState.lastCircuitStateChange = Date.now();
        }
      }

      // DDoS protection checks
      if (this.config.ddosProtection.enabled && sourceIP) {
        const ddosResult = await this.checkDDoSProtection(
          agentId,
          sourceIP,
          messageType,
          payloadSize,
        );
        if (!ddosResult.allowed) {
          this.processingMetrics.requestsBlocked++;
          return ddosResult;
        }
      }

      // Find applicable rate limit rule
      let rule = this.findApplicableRule(agentId);
      if (!rule || !rule.enabled) {
        // No rule applies, use default limits
        rule = this.rateLimitRules.get("default")!;
      }

      // Apply adaptive throttling
      const adaptiveLimits = this.applyAdaptiveThrottling(rule.limits);

      // Token bucket algorithm for burst control
      const tokenResult = this.checkTokenBucket(
        agentState,
        rule,
        adaptiveLimits,
      );
      if (!tokenResult.allowed) {
        this.processingMetrics.requestsBlocked++;
        return tokenResult;
      }

      // Sliding window rate limiting
      const windowResult = this.checkSlidingWindows(
        agentState,
        rule,
        adaptiveLimits,
      );
      if (!windowResult.allowed) {
        this.processingMetrics.requestsBlocked++;
        return windowResult;
      }

      // Concurrent request limiting
      const concurrentResult = this.checkConcurrentRequests(
        agentState,
        adaptiveLimits,
      );
      if (!concurrentResult.allowed) {
        this.processingMetrics.requestsBlocked++;
        return concurrentResult;
      }

      // Update behavior profile
      this.updateBehaviorProfile(agentState, messageType, payloadSize);

      // Consume token and update counters
      agentState.tokens--;
      agentState.concurrentRequests++;
      this.updateRequestCounters(agentState);

      this.processingMetrics.requestsProcessed++;

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.processingMetrics.averageProcessingTime =
        (this.processingMetrics.averageProcessingTime + processingTime) / 2;

      this.logger.debug("Rate limit check passed", {
        agentId,
        tokensRemaining: agentState.tokens,
        processingTime,
      });

      return {
        allowed: true,
        tokensRemaining: agentState.tokens,
        quotaResetTime: this.calculateQuotaResetTime(agentState),
        circuitState: agentState.circuitState,
        adaptiveMultiplier: this.adaptiveMultiplier,
      };
    } catch (error) {
      this.logger.error("Rate limit check failed", { agentId, error });

      // Fail open for availability
      return {
        allowed: true,
        reason: "Rate limiter error - failing open",
      };
    }
  }

  /**
   * Release resources when request completes
   */
  async releaseRequest(
    agentId: string,
    success: boolean = true,
  ): Promise<void> {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) return;

    // Decrement concurrent requests
    agentState.concurrentRequests = Math.max(
      0,
      agentState.concurrentRequests - 1,
    );

    // Update circuit breaker based on success/failure
    if (agentState.circuitState === "half-open") {
      if (success) {
        agentState.circuitState = "closed";
        agentState.lastCircuitStateChange = Date.now();
      } else {
        agentState.circuitState = "open";
        agentState.lastCircuitStateChange = Date.now();
        this.processingMetrics.circuitBreakersTripped++;
      }
    } else if (!success) {
      // Track failures for circuit breaker
      this.trackFailure(agentState);
    }

    // Update behavior profile
    if (!success) {
      agentState.behaviorProfile.errorRate =
        agentState.behaviorProfile.errorRate * 0.9 + 1 * 0.1;
    }
  }

  /**
   * Check DDoS protection measures
   */
  private async checkDDoSProtection(
    agentId: string,
    sourceIP: string,
    messageType: string,
    payloadSize: number,
  ): Promise<RateLimitResult> {
    // IP reputation check
    if (this.config.ddosProtection.ipReputation) {
      const reputation = await this.ipReputationService.getReputation(sourceIP);
      if (reputation < 0.5) {
        return {
          allowed: false,
          reason: "Low IP reputation score",
          retryAfter: this.config.ddosProtection.autoMitigation.blockDuration,
        };
      }
    }

    // Behavior analysis
    if (this.config.ddosProtection.behaviorAnalysis) {
      const agentState = this.agentStates.get(agentId);
      if (agentState) {
        const anomalyScore = await this.behaviorAnalyzer.analyzeRequest(
          agentState.behaviorProfile,
          messageType,
          payloadSize,
          Date.now(),
        );

        if (anomalyScore > this.config.ddosProtection.anomalyThreshold) {
          this.processingMetrics.ddosAttacksDetected++;

          this.emit("ddos_detected", {
            agentId,
            sourceIP,
            anomalyScore,
            timestamp: Date.now(),
          });

          return {
            allowed: false,
            reason: "Anomalous behavior detected",
            retryAfter: this.config.ddosProtection.autoMitigation.blockDuration,
          };
        }
      }
    }

    // Geofencing check
    if (this.config.ddosProtection.geofencing.enabled) {
      const region = await this.getIPRegion(sourceIP);

      if (
        this.config.ddosProtection.geofencing.blockedRegions.includes(region)
      ) {
        return {
          allowed: false,
          reason: "Geographic region blocked",
          retryAfter: this.config.ddosProtection.autoMitigation.blockDuration,
        };
      }

      if (
        this.config.ddosProtection.geofencing.allowedRegions.length > 0 &&
        !this.config.ddosProtection.geofencing.allowedRegions.includes(region)
      ) {
        return {
          allowed: false,
          reason: "Geographic region not allowed",
          retryAfter: this.config.ddosProtection.autoMitigation.blockDuration,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Token bucket rate limiting check
   */
  private checkTokenBucket(
    agentState: RateLimitState,
    rule: RateLimitRule,
    limits: typeof rule.limits,
  ): RateLimitResult {
    const now = Date.now();
    const timeSinceLastRefill = now - agentState.lastRefill;

    // Refill tokens based on time elapsed
    const tokensToAdd = Math.floor(
      (timeSinceLastRefill / 1000) * limits.requestsPerSecond,
    );

    if (tokensToAdd > 0) {
      agentState.tokens = Math.min(
        limits.burstCapacity,
        agentState.tokens + tokensToAdd,
      );
      agentState.lastRefill = now;
    }

    // Check if tokens are available
    if (agentState.tokens <= 0) {
      const refillTime = (1 / limits.requestsPerSecond) * 1000;

      return {
        allowed: false,
        reason: "Rate limit exceeded - no tokens available",
        retryAfter: refillTime,
        tokensRemaining: 0,
      };
    }

    return { allowed: true };
  }

  /**
   * Sliding window rate limiting check
   */
  private checkSlidingWindows(
    agentState: RateLimitState,
    rule: RateLimitRule,
    limits: typeof rule.limits,
  ): RateLimitResult {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000) % 60;

    // Check per-second limit
    const recentSecondsCount = agentState.requestCounts.perSecond
      .slice(Math.max(0, currentSecond - 1), currentSecond + 1)
      .reduce((sum, count) => sum + count, 0);

    if (recentSecondsCount >= limits.requestsPerSecond) {
      return {
        allowed: false,
        reason: "Per-second rate limit exceeded",
        retryAfter: 1000,
      };
    }

    // Check per-minute limit
    const recentMinutesCount = agentState.requestCounts.perMinute.reduce(
      (sum, count) => sum + count,
      0,
    );

    if (recentMinutesCount >= limits.requestsPerMinute) {
      return {
        allowed: false,
        reason: "Per-minute rate limit exceeded",
        retryAfter: 60000,
      };
    }

    // Check per-hour limit
    const recentHoursCount = agentState.requestCounts.perHour.reduce(
      (sum, count) => sum + count,
      0,
    );

    if (recentHoursCount >= limits.requestsPerHour) {
      return {
        allowed: false,
        reason: "Per-hour rate limit exceeded",
        retryAfter: 3600000,
      };
    }

    // Check per-day limit
    const recentDaysCount = agentState.requestCounts.perDay.reduce(
      (sum, count) => sum + count,
      0,
    );

    if (recentDaysCount >= limits.requestsPerDay) {
      return {
        allowed: false,
        reason: "Per-day rate limit exceeded",
        retryAfter: 86400000,
      };
    }

    return { allowed: true };
  }

  /**
   * Concurrent request limiting check
   */
  private checkConcurrentRequests(
    agentState: RateLimitState,
    limits: typeof this.config.defaultLimits,
  ): RateLimitResult {
    if (agentState.concurrentRequests >= limits.concurrentRequests) {
      return {
        allowed: false,
        reason: "Concurrent request limit exceeded",
        retryAfter: 1000,
      };
    }

    return { allowed: true };
  }

  /**
   * Apply adaptive throttling based on system metrics
   */
  private applyAdaptiveThrottling(
    baseLimits: typeof this.config.defaultLimits,
  ): typeof this.config.defaultLimits {
    if (!this.config.adaptiveThrottling.enabled) {
      return baseLimits;
    }

    // Check if adaptive adjustment is needed
    const now = Date.now();
    if (now - this.lastAdaptiveAdjustment < 10000) {
      // Use cached multiplier
      return this.multiplyLimits(baseLimits, this.adaptiveMultiplier);
    }

    let shouldThrottle = false;

    // Check CPU usage
    if (
      this.systemMetrics.cpuUsage > this.config.adaptiveThrottling.cpuThreshold
    ) {
      shouldThrottle = true;
    }

    // Check memory usage
    if (
      this.systemMetrics.memoryUsage >
      this.config.adaptiveThrottling.memoryThreshold
    ) {
      shouldThrottle = true;
    }

    // Check response time
    if (
      this.systemMetrics.averageResponseTime >
      this.config.adaptiveThrottling.responseTimeThreshold
    ) {
      shouldThrottle = true;
    }

    // Adjust multiplier
    if (shouldThrottle) {
      this.adaptiveMultiplier = Math.max(
        0.1,
        this.adaptiveMultiplier *
          this.config.adaptiveThrottling.backpressureMultiplier,
      );
      this.processingMetrics.adaptiveAdjustments++;
    } else {
      // Gradually recover
      this.adaptiveMultiplier = Math.min(
        1.0,
        this.adaptiveMultiplier + this.config.adaptiveThrottling.recoveryRate,
      );
    }

    this.lastAdaptiveAdjustment = now;

    return this.multiplyLimits(baseLimits, this.adaptiveMultiplier);
  }

  /**
   * Helper methods
   */

  private createAgentState(agentId: string): RateLimitState {
    return {
      agentId,
      tokens: this.config.defaultLimits.burstCapacity,
      lastRefill: Date.now(),
      requestCounts: {
        perSecond: new Array(60).fill(0),
        perMinute: new Array(60).fill(0),
        perHour: new Array(24).fill(0),
        perDay: new Array(7).fill(0),
      },
      concurrentRequests: 0,
      circuitState: "closed",
      lastCircuitStateChange: Date.now(),
      reputationScore: 1.0,
      behaviorProfile: {
        requestPatterns: new Map(),
        timeDistribution: new Array(24).fill(0),
        messageTypeDistribution: new Map(),
        averagePayloadSize: 0,
        errorRate: 0,
        suspiciousBehaviorCount: 0,
        lastAnalysis: Date.now(),
      },
    };
  }

  private findApplicableRule(agentId: string): RateLimitRule | null {
    let bestRule: RateLimitRule | null = null;
    let highestPriority = -1;

    for (const rule of this.rateLimitRules.values()) {
      if (!rule.enabled) continue;

      const pattern =
        typeof rule.agentPattern === "string"
          ? new RegExp(rule.agentPattern)
          : rule.agentPattern;

      if (pattern.test(agentId) && rule.priority > highestPriority) {
        bestRule = rule;
        highestPriority = rule.priority;
      }
    }

    return bestRule;
  }

  private multiplyLimits(
    limits: typeof this.config.defaultLimits,
    multiplier: number,
  ): typeof this.config.defaultLimits {
    return {
      requestsPerSecond: Math.floor(limits.requestsPerSecond * multiplier),
      requestsPerMinute: Math.floor(limits.requestsPerMinute * multiplier),
      requestsPerHour: Math.floor(limits.requestsPerHour * multiplier),
      requestsPerDay: Math.floor(limits.requestsPerDay * multiplier),
      burstCapacity: Math.floor(limits.burstCapacity * multiplier),
      concurrentRequests: Math.floor(limits.concurrentRequests * multiplier),
    };
  }

  private updateRequestCounters(agentState: RateLimitState): void {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000) % 60;
    const currentMinute = Math.floor(now / 60000) % 60;
    const currentHour = Math.floor(now / 3600000) % 24;
    const currentDay = Math.floor(now / 86400000) % 7;

    agentState.requestCounts.perSecond[currentSecond]++;
    agentState.requestCounts.perMinute[currentMinute]++;
    agentState.requestCounts.perHour[currentHour]++;
    agentState.requestCounts.perDay[currentDay]++;
  }

  private updateBehaviorProfile(
    agentState: RateLimitState,
    messageType: string,
    payloadSize: number,
  ): void {
    const profile = agentState.behaviorProfile;
    const now = Date.now();
    const hour = new Date(now).getHours();

    // Update message type distribution
    const currentCount = profile.messageTypeDistribution.get(messageType) || 0;
    profile.messageTypeDistribution.set(messageType, currentCount + 1);

    // Update time distribution
    profile.timeDistribution[hour]++;

    // Update average payload size
    profile.averagePayloadSize = (profile.averagePayloadSize + payloadSize) / 2;

    // Update last analysis time
    profile.lastAnalysis = now;
  }

  private trackFailure(agentState: RateLimitState): void {
    const circuitBreaker = this.getOrCreateCircuitBreaker(agentState.agentId);
    circuitBreaker.failures++;

    if (
      circuitBreaker.failures >= this.config.circuitBreaker.failureThreshold
    ) {
      agentState.circuitState = "open";
      agentState.lastCircuitStateChange = Date.now();
      circuitBreaker.failures = 0;

      this.processingMetrics.circuitBreakersTripped++;

      this.emit("circuit_breaker_opened", {
        agentId: agentState.agentId,
        timestamp: Date.now(),
      });
    }
  }

  private getOrCreateCircuitBreaker(agentId: string): CircuitBreakerState {
    let circuitBreaker = this.circuitBreakers.get(agentId);

    if (!circuitBreaker) {
      circuitBreaker = {
        failures: 0,
        lastFailure: 0,
        halfOpenRequests: 0,
      };
      this.circuitBreakers.set(agentId, circuitBreaker);
    }

    return circuitBreaker;
  }

  private calculateQuotaResetTime(_agentState: RateLimitState): number {
    // Calculate when the next token will be available
    const refillRate = this.config.defaultLimits.requestsPerSecond;
    const refillInterval = 1000 / refillRate;

    return Date.now() + refillInterval;
  }

  private async getIPRegion(_ip: string): Promise<string> {
    // Placeholder for IP geolocation service
    // In production, integrate with MaxMind, IPinfo, or similar service
    return "unknown";
  }

  private collectSystemMetrics(): void {
    // Collect system metrics
    // In production, integrate with system monitoring tools
    this.systemMetrics = {
      cpuUsage: Math.random() * 100, // Placeholder
      memoryUsage: Math.random() * 100, // Placeholder
      averageResponseTime: Math.random() * 1000, // Placeholder
      activeConnections: this.agentStates.size,
      requestRate: this.processingMetrics.requestsProcessed / 60,
      errorRate:
        this.processingMetrics.requestsBlocked /
        this.processingMetrics.requestsProcessed,
      timestamp: Date.now(),
    };

    // Store metrics history
    this.metricsHistory.push(this.systemMetrics);

    // Limit history size
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-50);
    }

    this.emit("system_metrics", this.systemMetrics);
  }

  private startMaintenanceTasks(): void {
    // Cleanup old agent states
    setInterval(() => {
      this.cleanupOldStates();
    }, 300000); // 5 minutes

    // Reset request counters
    setInterval(() => {
      this.resetCounters();
    }, 60000); // 1 minute

    // Sync with distributed nodes
    if (this.config.distributedMode.enabled) {
      setInterval(() => {
        this.syncWithDistributedNodes();
      }, this.config.distributedMode.syncInterval);
    }
  }

  private cleanupOldStates(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [agentId, state] of this.agentStates) {
      if (now - state.lastRefill > maxAge && state.concurrentRequests === 0) {
        this.agentStates.delete(agentId);
        this.circuitBreakers.delete(agentId);
      }
    }

    this.logger.debug("Cleaned up old agent states", {
      remaining: this.agentStates.size,
    });
  }

  private resetCounters(): void {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000) % 60;
    const currentMinute = Math.floor(now / 60000) % 60;
    const currentHour = Math.floor(now / 3600000) % 24;
    const currentDay = Math.floor(now / 86400000) % 7;

    for (const state of this.agentStates.values()) {
      // Reset old time windows
      if (Math.floor((now - 60000) / 1000) % 60 !== currentSecond) {
        state.requestCounts.perSecond[(currentSecond + 1) % 60] = 0;
      }

      if (Math.floor((now - 60000) / 60000) % 60 !== currentMinute) {
        state.requestCounts.perMinute[(currentMinute + 1) % 60] = 0;
      }

      if (Math.floor((now - 3600000) / 3600000) % 24 !== currentHour) {
        state.requestCounts.perHour[(currentHour + 1) % 24] = 0;
      }

      if (Math.floor((now - 86400000) / 86400000) % 7 !== currentDay) {
        state.requestCounts.perDay[(currentDay + 1) % 7] = 0;
      }
    }
  }

  private async syncWithDistributedNodes(): Promise<void> {
    // Placeholder for distributed synchronization
    // In production, implement consensus mechanism for rate limiting state
    this.logger.debug("Syncing with distributed nodes");
  }

  /**
   * Public API methods
   */

  addRule(rule: RateLimitRule): void {
    this.rateLimitRules.set(rule.ruleId, rule);
    this.logger.info("Rate limit rule added", {
      ruleId: rule.ruleId,
      name: rule.name,
    });
  }

  removeRule(ruleId: string): boolean {
    const removed = this.rateLimitRules.delete(ruleId);
    if (removed) {
      this.logger.info("Rate limit rule removed", { ruleId });
    }
    return removed;
  }

  getRules(): RateLimitRule[] {
    return Array.from(this.rateLimitRules.values());
  }

  getAgentState(agentId: string): RateLimitState | null {
    return this.agentStates.get(agentId) || null;
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  getProcessingMetrics() {
    return { ...this.processingMetrics };
  }

  async blockAgent(agentId: string, duration: number = 300000): Promise<void> {
    const agentState = this.agentStates.get(agentId);
    if (agentState) {
      agentState.circuitState = "open";
      agentState.lastCircuitStateChange = Date.now();

      // Auto-unblock after duration
      setTimeout(() => {
        const state = this.agentStates.get(agentId);
        if (state && state.circuitState === "open") {
          state.circuitState = "closed";
          state.lastCircuitStateChange = Date.now();
        }
      }, duration);

      this.logger.warn("Agent blocked", { agentId, duration });
      this.emit("agent_blocked", { agentId, duration, timestamp: Date.now() });
    }
  }

  async unblockAgent(agentId: string): Promise<void> {
    const agentState = this.agentStates.get(agentId);
    if (agentState) {
      agentState.circuitState = "closed";
      agentState.lastCircuitStateChange = Date.now();

      this.logger.info("Agent unblocked", { agentId });
      this.emit("agent_unblocked", { agentId, timestamp: Date.now() });
    }
  }
}

// Supporting interfaces and classes

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  halfOpenRequests: number;
}

interface SuspiciousActivity {
  ip: string;
  detectedAt: number;
  severity: number;
  patterns: string[];
}

class BehaviorAnalyzer {
  constructor(private config: DDoSProtectionConfig) {}

  async analyzeRequest(
    profile: BehaviorProfile,
    messageType: string,
    payloadSize: number,
    timestamp: number,
  ): Promise<number> {
    let anomalyScore = 0;

    // Check message type patterns
    const messageTypeCount =
      profile.messageTypeDistribution.get(messageType) || 0;
    const totalMessages = Array.from(
      profile.messageTypeDistribution.values(),
    ).reduce((sum, count) => sum + count, 0);

    if (totalMessages > 0) {
      const messageTypeRatio = messageTypeCount / totalMessages;
      if (messageTypeRatio > 0.9) {
        anomalyScore += 1;
      }
    }

    // Check payload size anomalies
    if (payloadSize > profile.averagePayloadSize * 10) {
      anomalyScore += 2;
    }

    // Check time-based patterns
    const hour = new Date(timestamp).getHours();
    const hourlyRequests = profile.timeDistribution[hour];
    const avgHourlyRequests =
      profile.timeDistribution.reduce((sum, count) => sum + count, 0) / 24;

    if (hourlyRequests > avgHourlyRequests * 5) {
      anomalyScore += 1;
    }

    return anomalyScore;
  }
}

class IPReputationService {
  constructor(private config: DDoSProtectionConfig) {}

  async getReputation(_ip: string): Promise<number> {
    // Placeholder for IP reputation service
    // In production, integrate with threat intelligence feeds
    return Math.random();
  }
}

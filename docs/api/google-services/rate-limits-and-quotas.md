# Rate Limits and Quota Management

## Overview

This document provides comprehensive information about rate limits, quotas, and best practices for managing API usage across all Google services integrated with Gemini-Flow.

## Service-Specific Rate Limits

### Google AI & Gemini Models

#### Free Tier Limits
| Model | Requests/Minute | Requests/Day | Tokens/Minute | Notes |
|-------|----------------|--------------|---------------|-------|
| Gemini 1.5 Flash | 15 | 1,500 | 1M | Best for high-frequency requests |
| Gemini 1.5 Pro | 2 | 50 | 32K | Best for complex tasks |
| Gemini 2.0 Flash | 10 | 1,000 | 1M | Experimental access |

#### Paid Tier Limits
| Model | Requests/Minute | Requests/Day | Tokens/Minute | Cost per 1M tokens |
|-------|----------------|--------------|---------------|-------------------|
| Gemini 1.5 Flash | 1,000 | Unlimited | 4M | $0.075 (input) / $0.30 (output) |
| Gemini 1.5 Pro | 360 | Unlimited | 4M | $1.25 (input) / $5.00 (output) |
| Gemini 2.0 Flash | 500 | Unlimited | 4M | $0.075 (input) / $0.30 (output) |

### Google Workspace APIs

#### Drive API
```yaml
Free Tier:
  requests_per_100_seconds: 1000
  requests_per_day: 1000000000  # Effectively unlimited
  
Paid Tier:
  requests_per_100_seconds: 1000
  requests_per_day: 1000000000
  download_quota: 750 GB/day
  upload_quota: 750 GB/day
```

#### Docs API
```yaml
Free Tier:
  requests_per_100_seconds: 300
  requests_per_day: 300000

Paid Tier:
  requests_per_100_seconds: 300
  requests_per_day: 300000
```

#### Sheets API
```yaml
Free Tier:
  requests_per_100_seconds: 300
  requests_per_day: 300000
  read_requests_per_100_seconds: 300
  write_requests_per_100_seconds: 300

Paid Tier:
  requests_per_100_seconds: 300
  requests_per_day: 300000
```

#### Slides API
```yaml
Free Tier:
  requests_per_100_seconds: 300
  requests_per_day: 300000

Paid Tier:
  requests_per_100_seconds: 300
  requests_per_day: 300000
```

### Vertex AI Platform

#### Model Predictions
| Model Type | Requests/Minute | Tokens/Minute | Regional Limits |
|------------|----------------|---------------|-----------------|
| Text Models | 600 | 600K | Per region |
| Chat Models | 600 | 600K | Per region |
| Code Models | 300 | 300K | Per region |
| Embedding Models | 1200 | 3M | Per region |

#### Batch Predictions
| Resource | Limit | Reset Period |
|----------|-------|--------------|
| Concurrent Jobs | 100 | N/A |
| Input File Size | 100 GB | N/A |
| Output File Size | 1 TB | N/A |

### Future Google Services (Estimated Limits)

#### Video Generation (Veo3)
```yaml
Preview Access:
  requests_per_hour: 10
  concurrent_generations: 3
  max_duration: 60_seconds
  max_resolution: "1080p"

Production (Estimated):
  requests_per_hour: 100
  concurrent_generations: 10
  max_duration: 300_seconds
  max_resolution: "4K"
```

#### Audio Generation (Chrip)
```yaml
Preview Access:
  requests_per_hour: 20
  concurrent_generations: 5
  max_duration: 120_seconds

Production (Estimated):
  requests_per_hour: 200
  concurrent_generations: 20
  max_duration: 600_seconds
```

#### Image Generation (Imagen 4)
```yaml
Preview Access:
  requests_per_minute: 30
  images_per_request: 4
  max_resolution: "2048x2048"

Production (Estimated):
  requests_per_minute: 300
  images_per_request: 8
  max_resolution: "4096x4096"
```

## Rate Limiting Implementation

### Client-Side Rate Limiting
```typescript
import { RateLimiter } from '@gemini-flow/utils';

class GoogleServiceClient {
  private rateLimiters = new Map<string, RateLimiter>();

  constructor() {
    // Initialize rate limiters for each service
    this.rateLimiters.set('gemini-flash', new RateLimiter({
      tokensPerInterval: 15,
      interval: 'minute',
      fireImmediately: false
    }));

    this.rateLimiters.set('drive-api', new RateLimiter({
      tokensPerInterval: 1000,
      interval: 100000, // 100 seconds
      fireImmediately: false
    }));
  }

  async makeRequest(service: string, requestFn: () => Promise<any>) {
    const limiter = this.rateLimiters.get(service);
    if (!limiter) {
      throw new Error(`Unknown service: ${service}`);
    }

    // Wait for rate limit clearance
    await limiter.removeTokens(1);
    
    try {
      return await requestFn();
    } catch (error) {
      if (this.isRateLimitError(error)) {
        // Exponential backoff
        const delay = this.calculateBackoffDelay(error);
        await this.sleep(delay);
        return this.makeRequest(service, requestFn);
      }
      throw error;
    }
  }

  private isRateLimitError(error: any): boolean {
    return error.code === 429 || 
           error.message?.includes('quota exceeded') ||
           error.message?.includes('rate limit');
  }

  private calculateBackoffDelay(error: any): number {
    // Extract retry-after header if available
    const retryAfter = error.headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }

    // Default exponential backoff
    return Math.min(1000 * Math.pow(2, this.retryCount), 60000);
  }
}
```

### Server-Side Rate Limiting
```typescript
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export class DistributedRateLimiter {
  private limiters = new Map<string, RateLimiterRedis>();
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.setupLimiters();
  }

  private setupLimiters() {
    // Gemini API rate limiter
    this.limiters.set('gemini-flash', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:gemini:flash',
      points: 15, // requests
      duration: 60, // per 60 seconds
      blockDuration: 60, // block for 60 seconds if exceeded
    }));

    // Drive API rate limiter
    this.limiters.set('drive', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:drive',
      points: 1000,
      duration: 100,
      blockDuration: 100,
    }));

    // Token-based limiter for AI models
    this.limiters.set('gemini-tokens', new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:gemini:tokens',
      points: 1000000, // tokens
      duration: 60,
      blockDuration: 60,
    }));
  }

  async checkLimit(service: string, key: string, cost = 1): Promise<void> {
    const limiter = this.limiters.get(service);
    if (!limiter) {
      throw new Error(`Unknown service: ${service}`);
    }

    try {
      await limiter.consume(key, cost);
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      throw new RateLimitError(`Rate limit exceeded. Retry after ${secs} seconds.`, {
        retryAfter: secs,
        remainingPoints: rejRes.remainingPoints,
        totalHits: rejRes.totalHits
      });
    }
  }

  async getRemainingQuota(service: string, key: string): Promise<QuotaInfo> {
    const limiter = this.limiters.get(service);
    if (!limiter) {
      throw new Error(`Unknown service: ${service}`);
    }

    const resRateLimiter = await limiter.get(key);
    
    return {
      remaining: resRateLimiter ? resRateLimiter.remainingPoints : limiter.points,
      reset: resRateLimiter ? new Date(Date.now() + resRateLimiter.msBeforeNext) : null,
      limit: limiter.points
    };
  }
}

interface QuotaInfo {
  remaining: number;
  reset: Date | null;
  limit: number;
}

class RateLimitError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

### Adaptive Rate Limiting
```typescript
export class AdaptiveRateLimiter {
  private successRate = 1.0;
  private currentLimit: number;
  private baseLimit: number;
  private windowStart = Date.now();
  private requests = 0;
  private errors = 0;

  constructor(baseLimit: number, private windowSize = 60000) {
    this.baseLimit = baseLimit;
    this.currentLimit = baseLimit;
  }

  async acquire(): Promise<void> {
    this.updateWindow();
    this.adjustLimit();

    if (this.requests >= this.currentLimit) {
      const waitTime = this.windowStart + this.windowSize - Date.now();
      if (waitTime > 0) {
        await this.sleep(waitTime);
        this.updateWindow();
      }
    }

    this.requests++;
  }

  recordSuccess(): void {
    this.updateSuccessRate(true);
  }

  recordError(): void {
    this.errors++;
    this.updateSuccessRate(false);
  }

  private updateWindow(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.windowSize) {
      this.windowStart = now;
      this.requests = 0;
      this.errors = 0;
    }
  }

  private updateSuccessRate(success: boolean): void {
    const alpha = 0.1; // Smoothing factor
    this.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * this.successRate;
  }

  private adjustLimit(): void {
    // Increase limit if success rate is high
    if (this.successRate > 0.95) {
      this.currentLimit = Math.min(this.baseLimit * 1.5, this.baseLimit * 2);
    } 
    // Decrease limit if success rate is low
    else if (this.successRate < 0.8) {
      this.currentLimit = Math.max(this.baseLimit * 0.5, this.baseLimit * 0.25);
    } 
    // Gradually return to baseline
    else {
      this.currentLimit = this.baseLimit;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Quota Monitoring

### Real-Time Quota Tracking
```typescript
export class QuotaMonitor {
  private quotaUsage = new Map<string, QuotaUsage>();
  private alerts = new Map<string, AlertConfig>();

  constructor(private eventEmitter: EventEmitter) {
    this.setupDefaultAlerts();
    this.startMonitoring();
  }

  recordUsage(service: string, operation: string, cost: number): void {
    const key = `${service}:${operation}`;
    const usage = this.quotaUsage.get(key) || {
      used: 0,
      limit: this.getServiceLimit(service, operation),
      period: this.getResetPeriod(service, operation),
      resetTime: this.calculateResetTime(service, operation)
    };

    usage.used += cost;
    this.quotaUsage.set(key, usage);

    // Check for alerts
    this.checkAlerts(key, usage);
  }

  async getUsageReport(service?: string): Promise<UsageReport> {
    const report: UsageReport = {
      timestamp: new Date(),
      services: []
    };

    for (const [key, usage] of this.quotaUsage) {
      const [svc, operation] = key.split(':');
      
      if (service && svc !== service) continue;

      const percentage = (usage.used / usage.limit) * 100;
      
      report.services.push({
        service: svc,
        operation,
        used: usage.used,
        limit: usage.limit,
        percentage: Math.round(percentage * 100) / 100,
        resetTime: usage.resetTime,
        status: this.getQuotaStatus(percentage)
      });
    }

    return report;
  }

  private setupDefaultAlerts(): void {
    const services = ['gemini-flash', 'gemini-pro', 'drive', 'sheets', 'docs'];
    
    services.forEach(service => {
      this.alerts.set(service, {
        warningThreshold: 80,
        criticalThreshold: 95,
        enabled: true,
        cooldownPeriod: 300000 // 5 minutes
      });
    });
  }

  private checkAlerts(key: string, usage: QuotaUsage): void {
    const [service] = key.split(':');
    const alert = this.alerts.get(service);
    
    if (!alert?.enabled) return;

    const percentage = (usage.used / usage.limit) * 100;
    const now = Date.now();

    // Check if we're in cooldown period
    if (alert.lastAlertTime && (now - alert.lastAlertTime) < alert.cooldownPeriod) {
      return;
    }

    if (percentage >= alert.criticalThreshold) {
      this.eventEmitter.emit('quota:critical', {
        service,
        operation: key.split(':')[1],
        percentage,
        usage,
        severity: 'critical'
      });
      alert.lastAlertTime = now;
    } else if (percentage >= alert.warningThreshold) {
      this.eventEmitter.emit('quota:warning', {
        service,
        operation: key.split(':')[1],
        percentage,
        usage,
        severity: 'warning'
      });
      alert.lastAlertTime = now;
    }
  }

  private getQuotaStatus(percentage: number): QuotaStatus {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    if (percentage >= 50) return 'moderate';
    return 'healthy';
  }

  private startMonitoring(): void {
    // Reset quota counters periodically
    setInterval(() => {
      this.resetExpiredQuotas();
    }, 60000); // Check every minute
  }

  private resetExpiredQuotas(): void {
    const now = Date.now();
    
    for (const [key, usage] of this.quotaUsage) {
      if (now >= usage.resetTime) {
        usage.used = 0;
        usage.resetTime = this.calculateResetTime(key.split(':')[0], key.split(':')[1]);
        this.quotaUsage.set(key, usage);
      }
    }
  }
}

interface QuotaUsage {
  used: number;
  limit: number;
  period: string;
  resetTime: number;
}

interface AlertConfig {
  warningThreshold: number;
  criticalThreshold: number;
  enabled: boolean;
  cooldownPeriod: number;
  lastAlertTime?: number;
}

interface UsageReport {
  timestamp: Date;
  services: ServiceUsage[];
}

interface ServiceUsage {
  service: string;
  operation: string;
  used: number;
  limit: number;
  percentage: number;
  resetTime: number;
  status: QuotaStatus;
}

type QuotaStatus = 'healthy' | 'moderate' | 'warning' | 'critical';
```

### Cost Tracking
```typescript
export class CostTracker {
  private costs = new Map<string, DailyCost>();
  private pricingConfig = new Map<string, PricingModel>();

  constructor() {
    this.loadPricingConfig();
  }

  recordUsage(service: string, operation: string, tokens: number, model?: string): void {
    const pricing = this.getPricing(service, model);
    const cost = this.calculateCost(pricing, operation, tokens);
    
    const today = new Date().toISOString().split('T')[0];
    const key = `${service}:${today}`;
    
    const dailyCost = this.costs.get(key) || {
      date: today,
      service,
      totalCost: 0,
      operations: new Map()
    };

    dailyCost.totalCost += cost;
    
    const opCost = dailyCost.operations.get(operation) || 0;
    dailyCost.operations.set(operation, opCost + cost);
    
    this.costs.set(key, dailyCost);
  }

  async generateCostReport(days = 30): Promise<CostReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const report: CostReport = {
      period: { start: startDate, end: endDate },
      totalCost: 0,
      services: [],
      dailyBreakdown: []
    };

    const serviceTotals = new Map<string, number>();
    
    for (const [key, dailyCost] of this.costs) {
      const costDate = new Date(dailyCost.date);
      
      if (costDate >= startDate && costDate <= endDate) {
        report.totalCost += dailyCost.totalCost;
        
        // Add to service totals
        const currentTotal = serviceTotals.get(dailyCost.service) || 0;
        serviceTotals.set(dailyCost.service, currentTotal + dailyCost.totalCost);
        
        // Add to daily breakdown
        report.dailyBreakdown.push({
          date: dailyCost.date,
          cost: dailyCost.totalCost,
          service: dailyCost.service
        });
      }
    }

    // Convert service totals to array
    for (const [service, totalCost] of serviceTotals) {
      report.services.push({
        service,
        totalCost,
        percentage: (totalCost / report.totalCost) * 100
      });
    }

    return report;
  }

  private loadPricingConfig(): void {
    // Gemini pricing
    this.pricingConfig.set('gemini-1.5-flash', {
      inputCost: 0.000075, // per 1K tokens
      outputCost: 0.0003,   // per 1K tokens
      unit: 'tokens'
    });

    this.pricingConfig.set('gemini-1.5-pro', {
      inputCost: 0.00125,   // per 1K tokens
      outputCost: 0.005,    // per 1K tokens
      unit: 'tokens'
    });

    // Workspace APIs (typically free with some paid features)
    this.pricingConfig.set('drive-api', {
      inputCost: 0,
      outputCost: 0,
      unit: 'requests'
    });
  }

  private calculateCost(pricing: PricingModel, operation: string, tokens: number): number {
    if (pricing.unit === 'tokens') {
      const costPer1K = operation === 'input' ? pricing.inputCost : pricing.outputCost;
      return (tokens / 1000) * costPer1K;
    }
    
    return pricing.inputCost; // Flat rate per request
  }
}

interface DailyCost {
  date: string;
  service: string;
  totalCost: number;
  operations: Map<string, number>;
}

interface PricingModel {
  inputCost: number;
  outputCost: number;
  unit: 'tokens' | 'requests' | 'minutes';
}

interface CostReport {
  period: { start: Date; end: Date };
  totalCost: number;
  services: ServiceCost[];
  dailyBreakdown: DailyCost[];
}

interface ServiceCost {
  service: string;
  totalCost: number;
  percentage: number;
}
```

## Best Practices

### 1. Request Batching
```typescript
class BatchRequestHandler {
  private batches = new Map<string, BatchRequest[]>();
  private batchSizes = new Map<string, number>();

  constructor() {
    // Configure optimal batch sizes per service
    this.batchSizes.set('sheets-read', 100);
    this.batchSizes.set('drive-metadata', 100);
    this.batchSizes.set('docs-read', 20);
  }

  async addToBatch(service: string, request: BatchRequest): Promise<any> {
    const batch = this.batches.get(service) || [];
    batch.push(request);
    this.batches.set(service, batch);

    const maxSize = this.batchSizes.get(service) || 50;
    
    if (batch.length >= maxSize) {
      return this.executeBatch(service);
    }

    // Auto-execute after timeout
    setTimeout(() => {
      if (this.batches.get(service)?.length > 0) {
        this.executeBatch(service);
      }
    }, 5000);
  }

  private async executeBatch(service: string): Promise<any[]> {
    const batch = this.batches.get(service) || [];
    if (batch.length === 0) return [];

    this.batches.set(service, []);

    try {
      return await this.executeServiceBatch(service, batch);
    } catch (error) {
      // Handle batch failures - retry individual requests
      console.warn(`Batch failed for ${service}, retrying individually`);
      return Promise.allSettled(
        batch.map(req => this.executeIndividualRequest(service, req))
      );
    }
  }

  private async executeServiceBatch(service: string, batch: BatchRequest[]): Promise<any[]> {
    switch (service) {
      case 'sheets-read':
        return this.batchSheetsRead(batch);
      case 'drive-metadata':
        return this.batchDriveMetadata(batch);
      default:
        throw new Error(`Unsupported batch service: ${service}`);
    }
  }
}
```

### 2. Caching Strategy
```typescript
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';

export class GoogleServiceCache {
  private cache = new LRUCache<string, CacheEntry>({
    max: 10000,
    ttl: 1000 * 60 * 15 // 15 minutes default
  });

  private ttlByService = new Map([
    ['drive-file-metadata', 1000 * 60 * 5],     // 5 minutes
    ['sheets-data', 1000 * 60 * 2],             // 2 minutes
    ['gemini-generation', 1000 * 60 * 60 * 24], // 24 hours (for identical prompts)
    ['docs-content', 1000 * 60 * 10],           // 10 minutes
  ]);

  async get<T>(service: string, key: string, fetcher: () => Promise<T>): Promise<T> {
    const cacheKey = this.generateKey(service, key);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached)) {
      return cached.data as T;
    }

    const data = await fetcher();
    const ttl = this.ttlByService.get(service) || 900000; // 15 minutes default

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });

    return data;
  }

  invalidate(service: string, pattern?: string): void {
    const prefix = `${service}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        if (!pattern || key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }

  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRatio: this.calculateHitRatio()
    };
  }

  private generateKey(service: string, key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return `${service}:${hash}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateHitRatio(): number {
    // This would require tracking hits/misses
    return 0.85; // Placeholder
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRatio: number;
}
```

### 3. Circuit Breaker Pattern
```typescript
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: CircuitState = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private service: string
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.service}`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.warn(`Circuit breaker OPENED for ${this.service}`);
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
    console.info(`Circuit breaker CLOSED for ${this.service}`);
  }

  getState(): { state: CircuitState; failures: number } {
    return {
      state: this.state,
      failures: this.failureCount
    };
  }
}

type CircuitState = 'open' | 'closed' | 'half-open';
```

### 4. Intelligent Request Queuing
```typescript
export class PriorityRequestQueue {
  private queues = new Map<Priority, RequestTask[]>();
  private processing = false;
  private activeRequests = 0;

  constructor(private maxConcurrent = 10) {
    this.queues.set('critical', []);
    this.queues.set('high', []);
    this.queues.set('medium', []);
    this.queues.set('low', []);
  }

  async enqueue<T>(
    task: () => Promise<T>,
    priority: Priority = 'medium',
    service: string,
    retries = 3
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestTask: RequestTask = {
        id: Math.random().toString(36),
        execute: task,
        priority,
        service,
        retries,
        resolve,
        reject,
        enqueuedAt: Date.now()
      };

      const queue = this.queues.get(priority)!;
      queue.push(requestTask);
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    try {
      while (this.activeRequests < this.maxConcurrent) {
        const task = this.getNextTask();
        if (!task) break;

        this.activeRequests++;
        this.executeTask(task);
      }
    } finally {
      this.processing = false;
    }
  }

  private getNextTask(): RequestTask | null {
    const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }
    
    return null;
  }

  private async executeTask(task: RequestTask): Promise<void> {
    try {
      const result = await task.execute();
      task.resolve(result);
    } catch (error) {
      if (task.retries > 0) {
        // Retry with exponential backoff
        task.retries--;
        const delay = Math.pow(2, 3 - task.retries) * 1000; // 1s, 2s, 4s
        
        setTimeout(() => {
          const queue = this.queues.get(task.priority)!;
          queue.unshift(task); // Add to front of queue
          this.processQueue();
        }, delay);
      } else {
        task.reject(error);
      }
    } finally {
      this.activeRequests--;
      setImmediate(() => this.processQueue());
    }
  }

  getQueueStatus(): QueueStatus {
    const status: QueueStatus = {
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      queues: {}
    };

    for (const [priority, queue] of this.queues) {
      status.queues[priority] = {
        length: queue.length,
        oldestTask: queue.length > 0 ? Date.now() - queue[0].enqueuedAt : 0
      };
    }

    return status;
  }
}

interface RequestTask {
  id: string;
  execute: () => Promise<any>;
  priority: Priority;
  service: string;
  retries: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  enqueuedAt: number;
}

interface QueueStatus {
  activeRequests: number;
  maxConcurrent: number;
  queues: Record<Priority, { length: number; oldestTask: number }>;
}

type Priority = 'critical' | 'high' | 'medium' | 'low';
```

This comprehensive rate limiting and quota management system ensures optimal performance while preventing service interruptions due to quota exhaustion. The next step will be creating detailed error response catalogs.
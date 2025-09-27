/**
 * Protocol Bridge Performance Monitor
 * 
 * Comprehensive metrics collection for protocol bridge performance
 * Requirements: Must expose Prometheus-compatible metrics endpoint
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";

export interface ProtocolMetrics {
  translationLatency: {
    count: number;
    sum: number;
    min: number;
    max: number;
    buckets: { [key: string]: number };
  };
  protocolRequests: {
    total: number;
    byProtocol: { [protocol: string]: number };
    byStatus: { [status: string]: number };
  };
  paymentVolume: {
    totalUSD: number;
    byCurrency: { [currency: string]: number };
    byStatus: { [status: string]: number };
  };
  consensusLatency: {
    count: number;
    sum: number;
    min: number;
    max: number;
    byAlgorithm: { [algorithm: string]: number };
  };
  cacheMetrics: {
    hitRate: number;
    size: number;
    evictions: number;
  };
  activeConnections: {
    total: number;
    byProtocol: { [protocol: string]: number };
  };
  sqliteMetrics: {
    operationsPerSecond: number;
    lastMeasured: number;
  };
}

export class ProtocolPerformanceMonitor extends EventEmitter {
  private logger: Logger;
  private metrics: ProtocolMetrics;
  private sqliteOpCounts: number[] = [];
  private lastSQLiteCheck: number = Date.now();

  // Histogram buckets for latency measurements (in milliseconds)
  private latencyBuckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

  constructor() {
    super();
    this.logger = new Logger("ProtocolPerformanceMonitor");
    
    this.metrics = {
      translationLatency: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        buckets: {},
      },
      protocolRequests: {
        total: 0,
        byProtocol: {},
        byStatus: {},
      },
      paymentVolume: {
        totalUSD: 0,
        byCurrency: {},
        byStatus: {},
      },
      consensusLatency: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        byAlgorithm: {},
      },
      cacheMetrics: {
        hitRate: 0,
        size: 0,
        evictions: 0,
      },
      activeConnections: {
        total: 0,
        byProtocol: {},
      },
      sqliteMetrics: {
        operationsPerSecond: 0,
        lastMeasured: Date.now(),
      },
    };

    // Initialize histogram buckets
    this.latencyBuckets.forEach(bucket => {
      this.metrics.translationLatency.buckets[`${bucket}`] = 0;
    });

    this.startMetricsCollection();
  }

  /**
   * Record translation latency
   */
  recordTranslationLatency(latencyMs: number, sourceProtocol: string, targetProtocol: string): void {
    this.metrics.translationLatency.count++;
    this.metrics.translationLatency.sum += latencyMs;
    this.metrics.translationLatency.min = Math.min(this.metrics.translationLatency.min, latencyMs);
    this.metrics.translationLatency.max = Math.max(this.metrics.translationLatency.max, latencyMs);

    // Update histogram buckets
    for (const bucket of this.latencyBuckets) {
      if (latencyMs <= bucket) {
        this.metrics.translationLatency.buckets[`${bucket}`]++;
        break;
      }
    }

    // Emit alert if latency exceeds threshold
    if (latencyMs > 100) {
      this.emit('latency-alert', {
        type: 'translation',
        latency: latencyMs,
        sourceProtocol,
        targetProtocol,
        threshold: 100,
      });
    }
  }

  /**
   * Record protocol request
   */
  recordProtocolRequest(protocol: string, status: string): void {
    this.metrics.protocolRequests.total++;
    
    this.metrics.protocolRequests.byProtocol[protocol] = 
      (this.metrics.protocolRequests.byProtocol[protocol] || 0) + 1;
    
    this.metrics.protocolRequests.byStatus[status] = 
      (this.metrics.protocolRequests.byStatus[status] || 0) + 1;
  }

  /**
   * Record payment volume
   */
  recordPaymentVolume(amountUSD: number, currency: string, status: string): void {
    this.metrics.paymentVolume.totalUSD += amountUSD;
    
    this.metrics.paymentVolume.byCurrency[currency] = 
      (this.metrics.paymentVolume.byCurrency[currency] || 0) + amountUSD;
    
    this.metrics.paymentVolume.byStatus[status] = 
      (this.metrics.paymentVolume.byStatus[status] || 0) + amountUSD;
  }

  /**
   * Record consensus latency
   */
  recordConsensusLatency(latencyMs: number, algorithm: string): void {
    this.metrics.consensusLatency.count++;
    this.metrics.consensusLatency.sum += latencyMs;
    this.metrics.consensusLatency.min = Math.min(this.metrics.consensusLatency.min, latencyMs);
    this.metrics.consensusLatency.max = Math.max(this.metrics.consensusLatency.max, latencyMs);
    
    this.metrics.consensusLatency.byAlgorithm[algorithm] = 
      (this.metrics.consensusLatency.byAlgorithm[algorithm] || 0) + latencyMs;

    // Emit alert if consensus is slow
    if (latencyMs > 5000) {
      this.emit('latency-alert', {
        type: 'consensus',
        latency: latencyMs,
        algorithm,
        threshold: 5000,
      });
    }
  }

  /**
   * Update cache metrics
   */
  updateCacheMetrics(hitRate: number, size: number, evictions: number): void {
    this.metrics.cacheMetrics.hitRate = hitRate;
    this.metrics.cacheMetrics.size = size;
    this.metrics.cacheMetrics.evictions = evictions;

    // Emit alert if cache hit rate is low
    if (hitRate < 0.8) {
      this.emit('cache-alert', {
        hitRate,
        size,
        threshold: 0.8,
      });
    }
  }

  /**
   * Update active connections
   */
  updateActiveConnections(total: number, byProtocol: { [protocol: string]: number }): void {
    this.metrics.activeConnections.total = total;
    this.metrics.activeConnections.byProtocol = { ...byProtocol };
  }

  /**
   * Record SQLite operation count
   */
  recordSQLiteOperations(count: number): void {
    this.sqliteOpCounts.push(count);
    
    // Keep only last 10 measurements for rolling average
    if (this.sqliteOpCounts.length > 10) {
      this.sqliteOpCounts.shift();
    }
  }

  /**
   * Calculate SQLite operations per second
   */
  private calculateSQLiteOpsPerSecond(): number {
    if (this.sqliteOpCounts.length === 0) return 0;

    const now = Date.now();
    const timeDiff = (now - this.lastSQLiteCheck) / 1000; // Convert to seconds
    this.lastSQLiteCheck = now;

    if (timeDiff === 0) return 0;

    const totalOps = this.sqliteOpCounts.reduce((sum, count) => sum + count, 0);
    const opsPerSecond = totalOps / timeDiff;

    this.metrics.sqliteMetrics.operationsPerSecond = opsPerSecond;
    this.metrics.sqliteMetrics.lastMeasured = now;

    return opsPerSecond;
  }

  /**
   * Start metrics collection background tasks
   */
  private startMetricsCollection(): void {
    // Update SQLite ops/sec every second
    setInterval(() => {
      const opsPerSecond = this.calculateSQLiteOpsPerSecond();
      
      // Alert if below target performance (396,610 ops/sec is the benchmark)
      if (opsPerSecond > 0 && opsPerSecond < 350000) {
        this.emit('performance-alert', {
          type: 'sqlite-performance',
          current: opsPerSecond,
          target: 396610,
          message: `SQLite performance degraded: ${opsPerSecond} ops/sec`,
        });
      }
    }, 1000);

    // Log comprehensive metrics every 30 seconds
    setInterval(() => {
      this.logMetricsSummary();
    }, 30000);
  }

  /**
   * Log metrics summary
   */
  private logMetricsSummary(): void {
    const avgTranslationLatency = this.metrics.translationLatency.count > 0
      ? this.metrics.translationLatency.sum / this.metrics.translationLatency.count
      : 0;

    const avgConsensusLatency = this.metrics.consensusLatency.count > 0
      ? this.metrics.consensusLatency.sum / this.metrics.consensusLatency.count
      : 0;

    this.logger.info("Protocol Bridge Metrics Summary", {
      translations: {
        total: this.metrics.translationLatency.count,
        avgLatency: Math.round(avgTranslationLatency * 100) / 100,
        minLatency: this.metrics.translationLatency.min === Infinity ? 0 : this.metrics.translationLatency.min,
        maxLatency: this.metrics.translationLatency.max,
      },
      requests: {
        total: this.metrics.protocolRequests.total,
        byProtocol: this.metrics.protocolRequests.byProtocol,
      },
      payments: {
        totalVolumeUSD: Math.round(this.metrics.paymentVolume.totalUSD * 100) / 100,
        currencies: Object.keys(this.metrics.paymentVolume.byCurrency).length,
      },
      consensus: {
        total: this.metrics.consensusLatency.count,
        avgLatency: Math.round(avgConsensusLatency * 100) / 100,
      },
      cache: {
        hitRate: Math.round(this.metrics.cacheMetrics.hitRate * 10000) / 100, // Percentage with 2 decimals
        size: this.metrics.cacheMetrics.size,
      },
      sqlite: {
        opsPerSecond: Math.round(this.metrics.sqliteMetrics.operationsPerSecond),
        target: 396610,
      },
    });
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): ProtocolMetrics {
    // Update real-time calculations
    this.calculateSQLiteOpsPerSecond();
    
    return JSON.parse(JSON.stringify(this.metrics)); // Deep copy
  }

  /**
   * Get Prometheus-compatible metrics string
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Translation latency histogram
    lines.push('# HELP protocol_translation_latency_ms Protocol translation latency in milliseconds');
    lines.push('# TYPE protocol_translation_latency_ms histogram');
    
    Object.entries(metrics.translationLatency.buckets).forEach(([bucket, count]) => {
      lines.push(`protocol_translation_latency_ms_bucket{le="${bucket}"} ${count}`);
    });
    lines.push(`protocol_translation_latency_ms_bucket{le="+Inf"} ${metrics.translationLatency.count}`);
    lines.push(`protocol_translation_latency_ms_sum ${metrics.translationLatency.sum}`);
    lines.push(`protocol_translation_latency_ms_count ${metrics.translationLatency.count}`);

    // Protocol requests counter
    lines.push('# HELP protocol_requests_total Total number of protocol requests');
    lines.push('# TYPE protocol_requests_total counter');
    Object.entries(metrics.protocolRequests.byProtocol).forEach(([protocol, count]) => {
      lines.push(`protocol_requests_total{protocol="${protocol}"} ${count}`);
    });

    // Payment volume
    lines.push('# HELP payment_volume_usd Total payment volume in USD');
    lines.push('# TYPE payment_volume_usd counter');
    lines.push(`payment_volume_usd ${metrics.paymentVolume.totalUSD}`);

    // Cache hit rate
    lines.push('# HELP cache_hit_rate Translation cache hit rate');
    lines.push('# TYPE cache_hit_rate gauge');
    lines.push(`cache_hit_rate ${metrics.cacheMetrics.hitRate}`);

    // SQLite operations per second
    lines.push('# HELP sqlite_operations_per_second SQLite operations per second');
    lines.push('# TYPE sqlite_operations_per_second gauge');
    lines.push(`sqlite_operations_per_second ${metrics.sqliteMetrics.operationsPerSecond}`);

    // Active connections
    lines.push('# HELP active_connections Number of active protocol connections');
    lines.push('# TYPE active_connections gauge');
    Object.entries(metrics.activeConnections.byProtocol).forEach(([protocol, count]) => {
      lines.push(`active_connections{protocol="${protocol}"} ${count}`);
    });

    return lines.join('\n') + '\n';
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      translationLatency: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        buckets: {},
      },
      protocolRequests: {
        total: 0,
        byProtocol: {},
        byStatus: {},
      },
      paymentVolume: {
        totalUSD: 0,
        byCurrency: {},
        byStatus: {},
      },
      consensusLatency: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        byAlgorithm: {},
      },
      cacheMetrics: {
        hitRate: 0,
        size: 0,
        evictions: 0,
      },
      activeConnections: {
        total: 0,
        byProtocol: {},
      },
      sqliteMetrics: {
        operationsPerSecond: 0,
        lastMeasured: Date.now(),
      },
    };

    // Reinitialize histogram buckets
    this.latencyBuckets.forEach(bucket => {
      this.metrics.translationLatency.buckets[`${bucket}`] = 0;
    });

    this.sqliteOpCounts = [];
    this.lastSQLiteCheck = Date.now();

    this.logger.info("Protocol metrics reset");
  }
}
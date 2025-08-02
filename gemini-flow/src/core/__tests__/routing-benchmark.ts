/**
 * Smart Routing Performance Benchmark
 * 
 * Standalone benchmark script to validate <75ms routing overhead
 * Run with: npx ts-node src/core/__tests__/routing-benchmark.ts
 */

import { ModelRouter, RoutingDecision } from '../model-router.js';
import { ModelConfig, RoutingContext } from '../model-orchestrator.js';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  scenario: string;
  averageTime: number;
  medianTime: number;
  p95Time: number;
  maxTime: number;
  minTime: number;
  samples: number;
  targetMet: boolean;
  cacheHitRate?: number;
}

class RoutingBenchmark {
  private router: ModelRouter;
  private mockModels: Map<string, ModelConfig>;
  private readonly TARGET_MS = 75;

  constructor() {
    this.router = new ModelRouter();
    this.setupMockModels();
  }

  private setupMockModels(): void {
    this.mockModels = new Map([
      ['gemini-2.0-flash', {
        name: 'gemini-2.0-flash',
        tier: 'free',
        capabilities: ['text', 'code', 'reasoning'],
        latencyTarget: 800,
        costPerToken: 0.000001,
        maxTokens: 1000000
      }],
      ['gemini-2.0-flash-thinking', {
        name: 'gemini-2.0-flash-thinking',
        tier: 'pro',
        capabilities: ['text', 'code', 'advanced-reasoning'],
        latencyTarget: 1200,
        costPerToken: 0.000002,
        maxTokens: 1000000
      }],
      ['gemini-2.5-deepmind', {
        name: 'gemini-2.5-deepmind',
        tier: 'enterprise',
        capabilities: ['text', 'code', 'advanced-reasoning', 'long-context'],
        latencyTarget: 1500,
        costPerToken: 0.000005,
        maxTokens: 2000000
      }],
      ['gemini-pro-vertex', {
        name: 'gemini-pro-vertex',
        tier: 'enterprise',
        capabilities: ['text', 'code', 'reasoning', 'enterprise-security'],
        latencyTarget: 1000,
        costPerToken: 0.000003,
        maxTokens: 1000000
      }]
    ]);
  }

  private async measureRoutingTime(context: RoutingContext): Promise<number> {
    const startTime = performance.now();
    await this.router.selectOptimalModel(context, this.mockModels);
    return performance.now() - startTime;
  }

  private calculateStats(times: number[]): Omit<BenchmarkResult, 'scenario' | 'samples' | 'targetMet' | 'cacheHitRate'> {
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      averageTime: sum / times.length,
      medianTime: sorted[Math.floor(sorted.length / 2)],
      p95Time: sorted[Math.floor(sorted.length * 0.95)],
      maxTime: Math.max(...times),
      minTime: Math.min(...times)
    };
  }

  async benchmarkColdStart(): Promise<BenchmarkResult> {
    console.log('🚀 Benchmarking cold start performance...');
    
    const samples = 100;
    const times: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      // Create fresh router for true cold start
      const freshRouter = new ModelRouter();
      
      const context: RoutingContext = {
        task: `Cold start test ${i}`,
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000
      };
      
      const startTime = performance.now();
      await freshRouter.selectOptimalModel(context, this.mockModels);
      const routingTime = performance.now() - startTime;
      
      times.push(routingTime);
    }
    
    const stats = this.calculateStats(times);
    
    return {
      scenario: 'Cold Start',
      ...stats,
      samples,
      targetMet: stats.p95Time < this.TARGET_MS
    };
  }

  async benchmarkWarmCache(): Promise<BenchmarkResult> {
    console.log('♨️  Benchmarking warm cache performance...');
    
    const warmupSamples = 50;
    const testSamples = 100;
    
    // Warmup phase
    for (let i = 0; i < warmupSamples; i++) {
      await this.measureRoutingTime({
        task: `Warmup task ${i % 10}`, // Repeat patterns for cache hits
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000
      });
    }
    
    // Test phase
    const times: number[] = [];
    let cacheHits = 0;
    
    for (let i = 0; i < testSamples; i++) {
      const context: RoutingContext = {
        task: `Cache test ${i % 20}`, // High probability of cache hits
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000
      };
      
      const startTime = performance.now();
      const decision = await this.router.selectOptimalModel(context, this.mockModels);
      const routingTime = performance.now() - startTime;
      
      times.push(routingTime);
      if (decision.fromCache) {
        cacheHits++;
      }
    }
    
    const stats = this.calculateStats(times);
    
    return {
      scenario: 'Warm Cache',
      ...stats,
      samples: testSamples,
      targetMet: stats.p95Time < this.TARGET_MS,
      cacheHitRate: cacheHits / testSamples
    };
  }

  async benchmarkComplexityVariations(): Promise<BenchmarkResult> {
    console.log('🧠 Benchmarking complexity analysis performance...');
    
    const complexityContexts: RoutingContext[] = [
      {
        task: 'Simple task',
        userTier: 'free',
        priority: 'low',
        latencyRequirement: 2000
      },
      {
        task: 'Medium complexity task with code implementation requirements',
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000,
        capabilities: ['code']
      },
      {
        task: 'Highly complex enterprise-grade system architecture design with advanced microservices, distributed computing, machine learning integration, security protocols, and performance optimization requirements',
        userTier: 'enterprise',
        priority: 'high',
        latencyRequirement: 500,
        capabilities: ['advanced-reasoning', 'enterprise-security', 'code']
      }
    ];
    
    const samples = 200;
    const times: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      const context = complexityContexts[i % complexityContexts.length];
      const routingTime = await this.measureRoutingTime({
        ...context,
        task: `${context.task} - variation ${i}`
      });
      times.push(routingTime);
    }
    
    const stats = this.calculateStats(times);
    
    return {
      scenario: 'Complexity Variations',
      ...stats,
      samples,
      targetMet: stats.p95Time < this.TARGET_MS
    };
  }

  async benchmarkConcurrentLoad(): Promise<BenchmarkResult> {
    console.log('⚡ Benchmarking concurrent load performance...');
    
    const concurrentRequests = 50;
    const batches = 10;
    const allTimes: number[] = [];
    
    for (let batch = 0; batch < batches; batch++) {
      const promises: Promise<number>[] = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        const context: RoutingContext = {
          task: `Concurrent batch ${batch} request ${i}`,
          userTier: ['free', 'pro', 'enterprise'][i % 3] as any,
          priority: ['low', 'medium', 'high'][i % 3] as any,
          latencyRequirement: 1000 + (i % 500)
        };
        
        promises.push(this.measureRoutingTime(context));
      }
      
      const batchTimes = await Promise.all(promises);
      allTimes.push(...batchTimes);
    }
    
    const stats = this.calculateStats(allTimes);
    
    return {
      scenario: 'Concurrent Load',
      ...stats,
      samples: allTimes.length,
      targetMet: stats.p95Time < this.TARGET_MS
    };
  }

  async benchmarkStressTest(): Promise<BenchmarkResult> {
    console.log('🔥 Benchmarking stress test performance...');
    
    const stressIterations = 1000;
    const times: number[] = [];
    
    for (let i = 0; i < stressIterations; i++) {
      const context: RoutingContext = {
        task: `Stress test iteration ${i} with unique characteristics and requirements`,
        userTier: ['free', 'pro', 'enterprise'][i % 3] as any,
        priority: ['low', 'medium', 'high', 'critical'][i % 4] as any,
        latencyRequirement: 500 + (i % 1500),
        capabilities: i % 2 === 0 ? ['code'] : ['advanced-reasoning']
      };
      
      const routingTime = await this.measureRoutingTime(context);
      times.push(routingTime);
      
      if (i % 100 === 0) {
        console.log(`  Completed ${i + 1}/${stressIterations} iterations...`);
      }
    }
    
    const stats = this.calculateStats(times);
    
    return {
      scenario: 'Stress Test',
      ...stats,
      samples: stressIterations,
      targetMet: stats.p95Time < this.TARGET_MS
    };
  }

  private printResult(result: BenchmarkResult): void {
    const status = result.targetMet ? '✅' : '❌';
    const cacheInfo = result.cacheHitRate ? ` (${(result.cacheHitRate * 100).toFixed(1)}% cache hits)` : '';
    
    console.log(`\n${status} ${result.scenario} Results${cacheInfo}:`);
    console.log(`  Samples: ${result.samples}`);
    console.log(`  Average: ${result.averageTime.toFixed(2)}ms`);
    console.log(`  Median:  ${result.medianTime.toFixed(2)}ms`);
    console.log(`  P95:     ${result.p95Time.toFixed(2)}ms (target: <${this.TARGET_MS}ms)`);
    console.log(`  Max:     ${result.maxTime.toFixed(2)}ms`);
    console.log(`  Min:     ${result.minTime.toFixed(2)}ms`);
    console.log(`  Target Met: ${result.targetMet ? 'YES' : 'NO'}`);
  }

  async runAllBenchmarks(): Promise<void> {
    console.log('🎯 Smart Routing Engine Performance Benchmark');
    console.log(`Target: <${this.TARGET_MS}ms routing overhead (P95)\n`);
    
    const startTime = performance.now();
    
    const results = [
      await this.benchmarkColdStart(),
      await this.benchmarkWarmCache(),
      await this.benchmarkComplexityVariations(),
      await this.benchmarkConcurrentLoad(),
      await this.benchmarkStressTest()
    ];
    
    const totalTime = performance.now() - startTime;
    
    // Print results
    results.forEach(result => this.printResult(result));
    
    // Summary
    const allTargetsMet = results.every(r => r.targetMet);
    const overallP95 = Math.max(...results.map(r => r.p95Time));
    const totalSamples = results.reduce((sum, r) => sum + r.samples, 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${allTargetsMet ? '✅ ALL TARGETS MET' : '❌ SOME TARGETS MISSED'}`);
    console.log(`Worst P95 Time: ${overallP95.toFixed(2)}ms`);
    console.log(`Total Samples: ${totalSamples.toLocaleString()}`);
    console.log(`Benchmark Duration: ${(totalTime / 1000).toFixed(2)}s`);
    
    if (allTargetsMet) {
      console.log('\n🎉 Smart routing engine successfully meets <75ms overhead requirement!');
    } else {
      console.log('\n⚠️  Smart routing engine needs optimization to meet <75ms requirement.');
    }
    
    // Router statistics
    const routerStats = this.router.getRouterStats();
    console.log('\n📈 Router Statistics:');
    console.log(`  Cache Size: ${routerStats.cache.size}/${routerStats.cache.limit}`);
    console.log(`  Cache Hit Rate: ${(routerStats.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`  Available Models: ${routerStats.availability.available}/${routerStats.availability.total}`);
    console.log(`  Performance Target Met: ${routerStats.performance.targetMet ? 'YES' : 'NO'}`);
  }
}

// Run benchmark if executed directly
if (require.main === module) {
  const benchmark = new RoutingBenchmark();
  benchmark.runAllBenchmarks().catch(console.error);
}

export { RoutingBenchmark, BenchmarkResult };
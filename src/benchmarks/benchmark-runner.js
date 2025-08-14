#!/usr/bin/env node

/**
 * Google Services Performance Benchmark Runner
 * 
 * Main execution script for running comprehensive performance benchmarks
 * across all Google Services with real-time monitoring and optimization
 */

const { GoogleServicesPerformanceBenchmarker } = require('./google-services-performance-framework');
const { LoadTestingCoordinator } = require('./load-testing-coordinator');
const { PerformanceOptimizationStrategies } = require('./performance-optimization-strategies');
const fs = require('fs').promises;
const path = require('path');

class BenchmarkRunner {
  constructor(config = {}) {
    this.config = {
      mode: config.mode || 'comprehensive', // comprehensive, quick, soak, spike
      services: config.services || 'all',
      outputDir: config.outputDir || './benchmark-results',
      enableOptimizations: config.enableOptimizations !== false,
      enableRealtimeMonitoring: config.enableRealtimeMonitoring !== false,
      ...config
    };

    // Initialize components
    this.benchmarker = new GoogleServicesPerformanceBenchmarker(this.config);
    this.loadTester = new LoadTestingCoordinator(this.config);
    this.optimizer = new PerformanceOptimizationStrategies();
    
    // Performance tracking
    this.startTime = null;
    this.results = {
      benchmarks: null,
      loadTests: null,
      optimizations: null,
      summary: null
    };
  }

  /**
   * Main execution method
   */
  async run() {
    this.startTime = Date.now();
    
    console.log('🚀 Starting Google Services Performance Benchmark Suite');
    console.log(`📊 Mode: ${this.config.mode}`);
    console.log(`🎯 Services: ${Array.isArray(this.config.services) ? this.config.services.join(', ') : this.config.services}`);
    console.log(`📁 Output Directory: ${this.config.outputDir}`);
    console.log('');

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Execute benchmark suite based on mode
      switch (this.config.mode) {
        case 'comprehensive':
          await this.runComprehensiveBenchmarks();
          break;
        case 'quick':
          await this.runQuickBenchmarks();
          break;
        case 'soak':
          await this.runSoakTests();
          break;
        case 'spike':
          await this.runSpikeTests();
          break;
        case 'optimization':
          await this.runOptimizationTests();
          break;
        default:
          throw new Error(`Unknown benchmark mode: ${this.config.mode}`);
      }

      // Generate final report
      await this.generateFinalReport();

      console.log('');
      console.log('✅ Benchmark suite completed successfully!');
      console.log(`📊 Total Duration: ${this.formatDuration(Date.now() - this.startTime)}`);
      console.log(`📁 Results saved to: ${this.config.outputDir}`);

      return this.results;

    } catch (error) {
      console.error('❌ Benchmark suite failed:', error.message);
      await this.generateErrorReport(error);
      throw error;
    }
  }

  /**
   * Run comprehensive benchmarks (all services, all scenarios)
   */
  async runComprehensiveBenchmarks() {
    console.log('🔄 Running comprehensive performance benchmarks...\n');

    // Step 1: Service baseline benchmarks
    console.log('📊 Phase 1: Service Baseline Benchmarks');
    const baselineOptions = {
      scenarios: ['baseline', 'load_1k', 'load_10k']
    };
    
    this.results.benchmarks = await this.benchmarker.runComprehensiveBenchmarks(baselineOptions);
    await this.saveIntermediateResults('baseline-benchmarks', this.results.benchmarks);

    // Step 2: Load testing scenarios
    console.log('\n⚡ Phase 2: Load Testing Scenarios');
    const loadTestScenarios = [
      'concurrent_1k',
      'concurrent_10k',
      'sustained_24h',
      'spike_10x'
    ];
    
    this.results.loadTests = await this.loadTester.executeComprehensiveLoadTests(loadTestScenarios);
    await this.saveIntermediateResults('load-tests', this.results.loadTests);

    // Step 3: Performance optimizations (if enabled)
    if (this.config.enableOptimizations) {
      console.log('\n🔧 Phase 3: Performance Optimizations');
      
      // Generate optimization recommendations
      const optimizationReport = this.optimizer.generateOptimizationReport();
      
      // Apply optimizations for selected services
      const servicesToOptimize = this.getServicesList();
      this.results.optimizations = await this.optimizer.applyOptimizations(servicesToOptimize);
      
      await this.saveIntermediateResults('optimizations', {
        report: optimizationReport,
        applied: this.results.optimizations
      });

      // Step 4: Post-optimization validation
      console.log('\n✅ Phase 4: Post-Optimization Validation');
      const validationResults = await this.benchmarker.runComprehensiveBenchmarks(baselineOptions);
      
      // Compare pre/post optimization results
      const comparisonResults = await this.compareOptimizationResults(
        this.results.benchmarks,
        validationResults
      );
      
      this.results.optimizationValidation = {
        postOptimizationResults: validationResults,
        comparison: comparisonResults
      };
      
      await this.saveIntermediateResults('optimization-validation', this.results.optimizationValidation);
    }

    // Step 5: Generate comprehensive summary
    this.results.summary = await this.generateComprehensiveSummary();
  }

  /**
   * Run quick benchmarks (essential services, basic scenarios)
   */
  async runQuickBenchmarks() {
    console.log('⚡ Running quick performance benchmarks...\n');

    // Essential services only
    const essentialServices = ['streaming-api', 'agentspace', 'imagen4'];
    
    // Quick baseline test
    console.log('📊 Quick Baseline Test');
    const quickOptions = {
      scenarios: ['baseline'],
      services: essentialServices
    };
    
    this.results.benchmarks = await this.benchmarker.runComprehensiveBenchmarks(quickOptions);

    // Quick load test
    console.log('\n⚡ Quick Load Test');
    this.results.loadTests = await this.loadTester.executeComprehensiveLoadTests(['concurrent_1k']);

    // Generate quick summary
    this.results.summary = await this.generateQuickSummary();
  }

  /**
   * Run soak tests for memory leak detection
   */
  async runSoakTests() {
    console.log('🧽 Running soak tests for memory leak detection...\n');

    const soakScenarios = [
      'soak_memory_leak',
      'soak_resource_exhaustion',
      'sustained_72h'
    ];

    this.results.loadTests = await this.loadTester.executeComprehensiveLoadTests(soakScenarios);
    this.results.summary = await this.generateSoakSummary();
  }

  /**
   * Run spike tests for elasticity validation
   */
  async runSpikeTests() {
    console.log('⚡ Running spike tests for elasticity validation...\n');

    const spikeScenarios = [
      'spike_10x',
      'spike_100x'
    ];

    this.results.loadTests = await this.loadTester.executeComprehensiveLoadTests(spikeScenarios);
    this.results.summary = await this.generateSpikeSummary();
  }

  /**
   * Run optimization-focused tests
   */
  async runOptimizationTests() {
    console.log('🔧 Running optimization-focused performance tests...\n');

    // Step 1: Pre-optimization baseline
    console.log('📊 Pre-Optimization Baseline');
    const preOptimization = await this.benchmarker.runComprehensiveBenchmarks({
      scenarios: ['baseline', 'load_1k']
    });

    // Step 2: Apply all optimizations
    console.log('\n🔧 Applying Optimizations');
    const servicesToOptimize = this.getServicesList();
    this.results.optimizations = await this.optimizer.applyOptimizations(servicesToOptimize);

    // Step 3: Post-optimization validation
    console.log('\n✅ Post-Optimization Validation');
    const postOptimization = await this.benchmarker.runComprehensiveBenchmarks({
      scenarios: ['baseline', 'load_1k']
    });

    // Step 4: Performance comparison
    const comparison = await this.compareOptimizationResults(preOptimization, postOptimization);

    this.results.benchmarks = { preOptimization, postOptimization };
    this.results.optimizationComparison = comparison;
    this.results.summary = await this.generateOptimizationSummary();
  }

  /**
   * Compare pre/post optimization results
   */
  async compareOptimizationResults(preResults, postResults) {
    const comparison = {
      improvements: {},
      degradations: {},
      summary: {
        totalImprovedServices: 0,
        averageLatencyImprovement: 0,
        averageThroughputImprovement: 0,
        overallSuccess: true
      }
    };

    for (const [serviceId, preServiceResults] of preResults.results) {
      const postServiceResults = postResults.results.get(serviceId);
      
      if (!postServiceResults) continue;

      const serviceComparison = {
        service: serviceId,
        latencyImprovement: 0,
        throughputImprovement: 0,
        errorRateChange: 0,
        resourceUtilizationChange: 0
      };

      // Compare each scenario
      for (const [scenarioName, preScenario] of preServiceResults.testResults) {
        const postScenario = postServiceResults.testResults.get(scenarioName);
        
        if (!postScenario || preScenario.error || postScenario.error) continue;

        // Calculate improvements
        const latencyImprovement = ((preScenario.summary.averageResponseTime - postScenario.summary.averageResponseTime) / preScenario.summary.averageResponseTime) * 100;
        const throughputImprovement = ((postScenario.summary.throughput - preScenario.summary.throughput) / preScenario.summary.throughput) * 100;

        serviceComparison.latencyImprovement += latencyImprovement;
        serviceComparison.throughputImprovement += throughputImprovement;
      }

      // Average improvements across scenarios
      const scenarioCount = preServiceResults.testResults.size;
      serviceComparison.latencyImprovement /= scenarioCount;
      serviceComparison.throughputImprovement /= scenarioCount;

      // Categorize as improvement or degradation
      if (serviceComparison.latencyImprovement > 5 || serviceComparison.throughputImprovement > 10) {
        comparison.improvements[serviceId] = serviceComparison;
        comparison.summary.totalImprovedServices++;
      } else if (serviceComparison.latencyImprovement < -5 || serviceComparison.throughputImprovement < -10) {
        comparison.degradations[serviceId] = serviceComparison;
        comparison.summary.overallSuccess = false;
      }

      // Add to overall averages
      comparison.summary.averageLatencyImprovement += serviceComparison.latencyImprovement;
      comparison.summary.averageThroughputImprovement += serviceComparison.throughputImprovement;
    }

    // Calculate final averages
    const totalServices = preResults.results.size;
    comparison.summary.averageLatencyImprovement /= totalServices;
    comparison.summary.averageThroughputImprovement /= totalServices;

    return comparison;
  }

  /**
   * Generate comprehensive summary
   */
  async generateComprehensiveSummary() {
    const summary = {
      type: 'comprehensive',
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      services: {
        tested: this.getServicesList().length,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      performance: {
        averageLatency: 0,
        averageThroughput: 0,
        averageErrorRate: 0,
        slaCompliance: 0
      },
      loadTesting: {
        scenariosExecuted: 0,
        maxConcurrentUsers: 0,
        longestTestDuration: 0,
        overallSuccess: true
      },
      optimizations: {
        applied: this.results.optimizations ? this.results.optimizations.length : 0,
        successful: 0,
        averageImprovement: 0
      },
      recommendations: []
    };

    // Analyze benchmark results
    if (this.results.benchmarks && this.results.benchmarks.results) {
      let totalLatency = 0;
      let totalThroughput = 0;
      let totalErrorRate = 0;
      let slaCompliant = 0;
      let serviceCount = 0;

      for (const [serviceId, serviceResults] of this.results.benchmarks.results) {
        serviceCount++;
        let serviceLatency = 0;
        let serviceThroughput = 0;
        let serviceErrorRate = 0;
        let scenarioCount = 0;

        for (const [scenarioName, testResult] of serviceResults.testResults) {
          if (testResult.error) {
            summary.services.failed++;
            continue;
          }

          scenarioCount++;
          serviceLatency += testResult.summary.averageResponseTime || 0;
          serviceThroughput += testResult.summary.throughput || 0;
          serviceErrorRate += testResult.summary.errorRate || 0;
        }

        if (scenarioCount > 0) {
          const avgServiceLatency = serviceLatency / scenarioCount;
          const avgServiceThroughput = serviceThroughput / scenarioCount;
          const avgServiceErrorRate = serviceErrorRate / scenarioCount;

          totalLatency += avgServiceLatency;
          totalThroughput += avgServiceThroughput;
          totalErrorRate += avgServiceErrorRate;

          // Check SLA compliance (simplified)
          const serviceBaselines = serviceResults.baselines;
          const latencyBaseline = Object.values(serviceBaselines)[0]?.target || 1000;
          
          if (avgServiceLatency <= latencyBaseline && avgServiceErrorRate <= 1.0) {
            slaCompliant++;
            summary.services.passed++;
          } else {
            summary.services.warnings++;
          }
        }
      }

      if (serviceCount > 0) {
        summary.performance.averageLatency = totalLatency / serviceCount;
        summary.performance.averageThroughput = totalThroughput / serviceCount;
        summary.performance.averageErrorRate = totalErrorRate / serviceCount;
        summary.performance.slaCompliance = (slaCompliant / serviceCount) * 100;
      }
    }

    // Analyze load testing results
    if (this.results.loadTests && this.results.loadTests.scenarios) {
      summary.loadTesting.scenariosExecuted = this.results.loadTests.scenarios.length;
      summary.loadTesting.overallSuccess = this.results.loadTests.summary.failed === 0;
      
      // Find max concurrent users and longest duration
      for (const scenario of this.results.loadTests.scenarios) {
        const scenarioConfig = this.loadTester.scenarios[scenario.name];
        if (scenarioConfig) {
          summary.loadTesting.maxConcurrentUsers = Math.max(
            summary.loadTesting.maxConcurrentUsers,
            scenarioConfig.users || scenarioConfig.spikeUsers || 0
          );
          
          const durationMs = this.parseDurationToMs(scenarioConfig.duration);
          summary.loadTesting.longestTestDuration = Math.max(
            summary.loadTesting.longestTestDuration,
            durationMs
          );
        }
      }
    }

    // Analyze optimization results
    if (this.results.optimizations) {
      summary.optimizations.successful = this.results.optimizations.filter(opt => opt.status === 'completed').length;
      
      if (this.results.optimizationValidation && this.results.optimizationValidation.comparison) {
        const comparison = this.results.optimizationValidation.comparison;
        summary.optimizations.averageImprovement = comparison.summary.averageLatencyImprovement;
      }
    }

    // Generate recommendations
    summary.recommendations = await this.generateGlobalRecommendations();

    return summary;
  }

  /**
   * Generate global recommendations based on all results
   */
  async generateGlobalRecommendations() {
    const recommendations = [];

    // Performance-based recommendations
    if (this.results.summary && this.results.summary.performance) {
      const perf = this.results.summary.performance;

      if (perf.averageLatency > 1000) {
        recommendations.push({
          category: 'performance',
          priority: 'high',
          title: 'Implement comprehensive caching strategy',
          description: 'Deploy multi-layer caching with 95%+ hit rate targets',
          expectedImprovement: '60-80% latency reduction',
          implementation: 'Redis Cluster + CDN + Application-level caching'
        });
      }

      if (perf.slaCompliance < 95) {
        recommendations.push({
          category: 'reliability',
          priority: 'critical',
          title: 'Enhance SLA compliance monitoring',
          description: 'Implement real-time SLA monitoring and automated remediation',
          expectedImprovement: '99.99% availability target',
          implementation: 'Prometheus + Grafana + PagerDuty integration'
        });
      }
    }

    // Load testing-based recommendations
    if (this.results.loadTests && this.results.loadTests.summary.failed > 0) {
      recommendations.push({
        category: 'scalability',
        priority: 'high',
        title: 'Implement auto-scaling infrastructure',
        description: 'Deploy Kubernetes HPA/VPA for automatic load handling',
        expectedImprovement: '10x load capacity increase',
        implementation: 'Kubernetes + KEDA + custom metrics'
      });
    }

    // Optimization-based recommendations
    if (this.results.optimizations && this.results.optimizations.length > 0) {
      const successfulOptimizations = this.results.optimizations.filter(opt => opt.status === 'completed');
      
      if (successfulOptimizations.length < this.results.optimizations.length) {
        recommendations.push({
          category: 'optimization',
          priority: 'medium',
          title: 'Review failed optimizations',
          description: 'Investigate and retry failed performance optimizations',
          expectedImprovement: 'Additional 20-30% performance gains',
          implementation: 'Manual review and targeted fixes'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate final comprehensive report
   */
  async generateFinalReport() {
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        benchmarkMode: this.config.mode,
        totalDuration: Date.now() - this.startTime,
        configuration: this.config
      },
      summary: this.results.summary,
      benchmarks: this.results.benchmarks,
      loadTests: this.results.loadTests,
      optimizations: this.results.optimizations,
      recommendations: this.results.summary?.recommendations || []
    };

    // Save JSON report
    const jsonReportPath = path.join(this.config.outputDir, 'final-performance-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate human-readable HTML report
    const htmlReport = await this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(this.config.outputDir, 'final-performance-report.html');
    await fs.writeFile(htmlReportPath, htmlReport);

    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary(reportData);
    const summaryPath = path.join(this.config.outputDir, 'executive-summary.md');
    await fs.writeFile(summaryPath, executiveSummary);

    console.log(`📊 Final report saved to: ${jsonReportPath}`);
    console.log(`📄 HTML report saved to: ${htmlReportPath}`);
    console.log(`📋 Executive summary saved to: ${summaryPath}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(reportData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Services Performance Benchmark Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1a73e8; border-bottom: 3px solid #1a73e8; padding-bottom: 10px; }
        h2 { color: #34a853; border-left: 4px solid #34a853; padding-left: 15px; }
        .metric { display: inline-block; margin: 10px; padding: 15px 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1a73e8; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1a73e8; }
        .metric-label { color: #5f6368; font-size: 14px; }
        .status-passed { color: #34a853; }
        .status-failed { color: #ea4335; }
        .status-warning { color: #fbbc04; }
        .recommendations { background: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .recommendation { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #34a853; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; font-weight: 600; }
        .chart-placeholder { background: #f0f0f0; height: 300px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Google Services Performance Benchmark Report</h1>
        
        <div style="text-align: center; margin: 30px 0;">
            <div class="metric">
                <div class="metric-value">${reportData.summary?.services?.tested || 0}</div>
                <div class="metric-label">Services Tested</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(reportData.summary?.performance?.averageLatency || 0)}ms</div>
                <div class="metric-label">Average Latency</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(reportData.summary?.performance?.averageThroughput || 0)}</div>
                <div class="metric-label">Average Throughput (RPS)</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(reportData.summary?.performance?.slaCompliance || 0)}%</div>
                <div class="metric-label">SLA Compliance</div>
            </div>
        </div>

        <h2>📊 Test Results Summary</h2>
        <table>
            <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>Service Benchmarks</td>
                <td><span class="status-${reportData.summary?.services?.failed === 0 ? 'passed' : 'failed'}">${reportData.summary?.services?.failed === 0 ? 'PASSED' : 'FAILED'}</span></td>
                <td>Tested ${reportData.summary?.services?.tested || 0} services</td>
            </tr>
            <tr>
                <td>Load Testing</td>
                <td><span class="status-${reportData.summary?.loadTesting?.overallSuccess ? 'passed' : 'failed'}">${reportData.summary?.loadTesting?.overallSuccess ? 'PASSED' : 'FAILED'}</span></td>
                <td>${reportData.summary?.loadTesting?.scenariosExecuted || 0} scenarios executed</td>
            </tr>
            <tr>
                <td>Optimizations</td>
                <td><span class="status-${reportData.summary?.optimizations?.successful > 0 ? 'passed' : 'warning'}">APPLIED</span></td>
                <td>${reportData.summary?.optimizations?.applied || 0} optimizations applied</td>
            </tr>
        </table>

        <h2>🎯 Performance Recommendations</h2>
        <div class="recommendations">
            ${(reportData.recommendations || []).map(rec => `
                <div class="recommendation">
                    <strong>${rec.title}</strong> (${rec.priority.toUpperCase()})
                    <p>${rec.description}</p>
                    <small><strong>Expected Improvement:</strong> ${rec.expectedImprovement}</small>
                </div>
            `).join('')}
        </div>

        <div class="chart-placeholder">
            📈 Performance Charts (Would integrate with Chart.js in production)
        </div>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <p>Report generated on ${reportData.metadata.generatedAt}</p>
            <p>Total benchmark duration: ${this.formatDuration(reportData.metadata.totalDuration)}</p>
        </footer>
    </div>
</body>
</html>`;
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(reportData) {
    return `# Google Services Performance Benchmark - Executive Summary

## 📊 Overview
- **Generated:** ${reportData.metadata.generatedAt}
- **Benchmark Mode:** ${reportData.metadata.benchmarkMode}
- **Duration:** ${this.formatDuration(reportData.metadata.totalDuration)}
- **Services Tested:** ${reportData.summary?.services?.tested || 0}

## 🎯 Key Results

### Performance Metrics
- **Average Latency:** ${Math.round(reportData.summary?.performance?.averageLatency || 0)}ms
- **Average Throughput:** ${Math.round(reportData.summary?.performance?.averageThroughput || 0)} RPS
- **SLA Compliance:** ${Math.round(reportData.summary?.performance?.slaCompliance || 0)}%
- **Error Rate:** ${(reportData.summary?.performance?.averageErrorRate || 0).toFixed(2)}%

### Test Results
- ✅ **Passed:** ${reportData.summary?.services?.passed || 0} services
- ❌ **Failed:** ${reportData.summary?.services?.failed || 0} services
- ⚠️ **Warnings:** ${reportData.summary?.services?.warnings || 0} services

### Load Testing
- **Scenarios Executed:** ${reportData.summary?.loadTesting?.scenariosExecuted || 0}
- **Max Concurrent Users:** ${reportData.summary?.loadTesting?.maxConcurrentUsers?.toLocaleString() || 0}
- **Overall Success:** ${reportData.summary?.loadTesting?.overallSuccess ? 'Yes' : 'No'}

## 🚀 Service-Specific Baselines

### Streaming API
- **Text Latency Target:** <100ms
- **Multimedia Latency Target:** <500ms
- **Status:** ${this.getServiceStatus('streaming-api', reportData)}

### AgentSpace
- **Coordination Overhead Target:** <50ms
- **Agent Spawn Time Target:** <200ms
- **Status:** ${this.getServiceStatus('agentspace', reportData)}

### Veo3 Video Generation
- **Generation Time Target:** <30s/minute
- **Status:** ${this.getServiceStatus('veo3', reportData)}

### Imagen4
- **Image Generation Target:** <3s
- **Quality Target:** >95%
- **Status:** ${this.getServiceStatus('imagen4', reportData)}

### Co-Scientist
- **Hypothesis Validation Target:** <5s
- **Status:** ${this.getServiceStatus('co-scientist', reportData)}

### Chirp Audio
- **Audio Generation Target:** <1s
- **Status:** ${this.getServiceStatus('chirp', reportData)}

### Lyria Music
- **Music Composition Target:** <5s
- **Status:** ${this.getServiceStatus('lyria', reportData)}

### Mariner Web Automation
- **Automation Cycle Target:** <2s
- **Status:** ${this.getServiceStatus('mariner', reportData)}

## 🔧 Top Recommendations

${(reportData.recommendations || []).map((rec, index) => `
${index + 1}. **${rec.title}** (${rec.priority.toUpperCase()})
   - ${rec.description}
   - Expected Improvement: ${rec.expectedImprovement}
   - Implementation: ${rec.implementation}
`).join('')}

## 📈 Optimization Results
${reportData.summary?.optimizations?.applied > 0 ? `
- **Optimizations Applied:** ${reportData.summary.optimizations.applied}
- **Successful:** ${reportData.summary.optimizations.successful}
- **Average Improvement:** ${Math.round(reportData.summary.optimizations.averageImprovement || 0)}%
` : 'No optimizations applied in this run.'}

## 🎯 Next Steps
1. Review failed services and address performance bottlenecks
2. Implement high-priority optimization recommendations
3. Schedule regular performance monitoring and benchmarking
4. Consider auto-scaling implementation for high-traffic services
5. Enhance monitoring and alerting for SLA compliance

---
*Generated by Google Services Performance Benchmark Suite*
`;
  }

  // Helper methods
  async ensureOutputDirectory() {
    try {
      await fs.access(this.config.outputDir);
    } catch {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    }
  }

  async saveIntermediateResults(filename, data) {
    const filepath = path.join(this.config.outputDir, `${filename}.json`);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Intermediate results saved: ${filename}.json`);
  }

  getServicesList() {
    if (this.config.services === 'all') {
      return ['streaming-api', 'agentspace', 'mariner', 'veo3', 'co-scientist', 'imagen4', 'chirp', 'lyria'];
    }
    return Array.isArray(this.config.services) ? this.config.services : [this.config.services];
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  parseDurationToMs(duration) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = duration.match(/(\d+)([smhd])/);
    return match ? parseInt(match[1]) * units[match[2]] : 0;
  }

  getServiceStatus(serviceId, reportData) {
    // Simplified status check
    return reportData.summary?.services?.failed === 0 ? '✅ PASSED' : '❌ NEEDS ATTENTION';
  }

  async generateErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      configuration: this.config,
      partialResults: this.results
    };

    const errorReportPath = path.join(this.config.outputDir, 'error-report.json');
    await fs.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2));
    console.log(`❌ Error report saved: ${errorReportPath}`);
  }

  async generateQuickSummary() {
    return {
      type: 'quick',
      message: 'Quick benchmark completed successfully',
      servicesTest: this.getServicesList().length,
      duration: Date.now() - this.startTime
    };
  }

  async generateSoakSummary() {
    return {
      type: 'soak',
      message: 'Soak testing completed',
      focus: 'Memory leak detection and resource exhaustion testing',
      duration: Date.now() - this.startTime
    };
  }

  async generateSpikeSummary() {
    return {
      type: 'spike',
      message: 'Spike testing completed',
      focus: 'Elasticity and auto-scaling validation',
      duration: Date.now() - this.startTime
    };
  }

  async generateOptimizationSummary() {
    return {
      type: 'optimization',
      message: 'Optimization testing completed',
      focus: 'Performance optimization validation and comparison',
      duration: Date.now() - this.startTime
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'services') {
      config.services = value.split(',');
    } else if (key === 'mode') {
      config.mode = value;
    } else if (key === 'output-dir') {
      config.outputDir = value;
    } else if (key === 'disable-optimizations') {
      config.enableOptimizations = false;
    }
  }

  const runner = new BenchmarkRunner(config);
  runner.run()
    .then(() => {
      console.log('🎉 Benchmark suite completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Benchmark suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { BenchmarkRunner };
#!/usr/bin/env node

/**
 * A2A Test Runner Script
 * Orchestrates comprehensive A2A compliance testing with detailed reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class A2ATestRunner {
  constructor() {
    this.config = {
      testTimeout: 300000, // 5 minutes
      coverageThreshold: 100,
      performanceTarget: 1000, // msg/sec
      maxConcurrency: os.cpus().length,
      reportDirectory: path.join(process.cwd(), 'test-reports', 'a2a'),
      verbose: process.argv.includes('--verbose'),
      watchMode: process.argv.includes('--watch'),
      suite: this.parseSuiteArgument(),
      bail: process.argv.includes('--bail'),
      updateSnapshots: process.argv.includes('--updateSnapshots')
    };

    this.testSuites = {
      'protocol-compliance': {
        name: 'Protocol Compliance Tests',
        path: 'tests/a2a/compliance/protocol-compliance.test.ts',
        timeout: 10 * 60 * 1000, // 10 minutes
        critical: true,
        description: 'Validates A2A message types and coordination modes'
      },
      'mcp-bridge': {
        name: 'MCP Bridge Integration Tests',
        path: 'tests/a2a/compliance/mcp-bridge-integration.test.ts',
        timeout: 15 * 60 * 1000, // 15 minutes
        critical: true,
        description: 'Tests all 104 MCP tools through A2A protocol'
      },
      'performance': {
        name: 'Performance Benchmarks',
        path: 'tests/a2a/compliance/performance-benchmarks.test.ts',
        timeout: 30 * 60 * 1000, // 30 minutes
        critical: false,
        description: 'Validates 1000+ msg/sec throughput and latency targets'
      },
      'chaos-engineering': {
        name: 'Chaos Engineering Tests',
        path: 'tests/a2a/compliance/chaos-engineering.test.ts',
        timeout: 25 * 60 * 1000, // 25 minutes
        critical: false,
        description: 'Fault tolerance and resilience validation'
      },
      'security-penetration': {
        name: 'Security Penetration Tests',
        path: 'tests/a2a/compliance/security-penetration.test.ts',
        timeout: 30 * 60 * 1000, // 30 minutes
        critical: true,
        description: 'Comprehensive security vulnerability assessment'
      }
    };

    this.results = {
      startTime: Date.now(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: {},
      performance: {},
      security: {},
      suiteResults: {}
    };
  }

  parseSuiteArgument() {
    const suiteArg = process.argv.find(arg => arg.startsWith('--suite='));
    if (suiteArg) {
      return suiteArg.split('=')[1];
    }
    return 'all';
  }

  async run() {
    try {
      console.log('🚀 A2A Compliance Test Runner Starting...\n');
      
      await this.validateEnvironment();
      await this.setupReportDirectory();
      await this.runTestSuites();
      await this.generateComprehensiveReport();
      
      this.results.endTime = Date.now();
      this.printSummary();
      
      // Exit with appropriate code
      const hasFailures = this.results.failedTests > 0;
      const hasCriticalFailures = Object.values(this.results.suiteResults)
        .some(result => result.critical && !result.passed);
      
      if (hasFailures || hasCriticalFailures) {
        process.exit(1);
      } else {
        console.log('\n✅ All A2A compliance tests passed successfully!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('\n❌ A2A Test Runner failed:', error.message);
      if (this.config.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...');
    
    // Check Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    console.log(`  ✅ Node.js version: ${nodeVersion}`);

    // Check dependencies
    try {
      execSync('npm list jest --depth=0', { stdio: 'ignore' });
      console.log('  ✅ Jest testing framework installed');
    } catch (error) {
      throw new Error('Jest not found. Run: npm install');
    }

    // Check test files exist
    const missingFiles = [];
    for (const [key, suite] of Object.entries(this.testSuites)) {
      if (!fs.existsSync(suite.path)) {
        missingFiles.push(suite.path);
      }
    }
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing test files:\n${missingFiles.map(f => `  - ${f}`).join('\n')}`);
    }
    console.log('  ✅ All test files present');

    // Check A2A protocol specification
    const protocolFile = 'coordination/orchestration/a2a-communication-protocol.md';
    if (!fs.existsSync(protocolFile)) {
      throw new Error(`A2A protocol specification not found: ${protocolFile}`);
    }
    console.log('  ✅ A2A protocol specification found');

    // Check system resources
    const totalMemory = os.totalmem() / (1024 * 1024 * 1024); // GB
    if (totalMemory < 4) {
      console.warn(`  ⚠️  Low memory: ${totalMemory.toFixed(1)}GB (4GB+ recommended)`);
    } else {
      console.log(`  ✅ System memory: ${totalMemory.toFixed(1)}GB`);
    }

    console.log('');
  }

  async setupReportDirectory() {
    if (!fs.existsSync(this.config.reportDirectory)) {
      fs.mkdirSync(this.config.reportDirectory, { recursive: true });
    }
    
    // Clean previous reports
    const files = fs.readdirSync(this.config.reportDirectory);
    for (const file of files) {
      fs.unlinkSync(path.join(this.config.reportDirectory, file));
    }
    
    console.log(`📁 Report directory prepared: ${this.config.reportDirectory}\n`);
  }

  async runTestSuites() {
    const suitesToRun = this.getSuitesToRun();
    console.log(`🧪 Running ${suitesToRun.length} test suite(s):\n`);
    
    for (const suiteKey of suitesToRun) {
      const suite = this.testSuites[suiteKey];
      console.log(`${this.getProgressIndicator(suitesToRun.indexOf(suiteKey), suitesToRun.length)} ${suite.name}`);
      console.log(`   📝 ${suite.description}`);
      
      const startTime = Date.now();
      
      try {
        const result = await this.runSingleTestSuite(suiteKey, suite);
        const duration = Date.now() - startTime;
        
        this.results.suiteResults[suiteKey] = {
          ...result,
          duration,
          passed: result.exitCode === 0,
          critical: suite.critical
        };
        
        if (result.exitCode === 0) {
          console.log(`   ✅ Passed in ${this.formatDuration(duration)}\n`);
          this.results.passedTests++;
        } else {
          console.log(`   ❌ Failed in ${this.formatDuration(duration)}\n`);
          this.results.failedTests++;
          
          if (suite.critical && this.config.bail) {
            throw new Error(`Critical test suite failed: ${suite.name}`);
          }
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`   💥 Error in ${this.formatDuration(duration)}: ${error.message}\n`);
        
        this.results.suiteResults[suiteKey] = {
          duration,
          passed: false,
          critical: suite.critical,
          error: error.message
        };
        
        this.results.failedTests++;
        
        if (suite.critical && this.config.bail) {
          throw error;
        }
      }
    }
  }

  getSuitesToRun() {
    if (this.config.suite === 'all') {
      return Object.keys(this.testSuites);
    }
    
    if (this.testSuites[this.config.suite]) {
      return [this.config.suite];
    }
    
    // Handle comma-separated list
    const suites = this.config.suite.split(',').map(s => s.trim());
    const validSuites = suites.filter(s => this.testSuites[s]);
    const invalidSuites = suites.filter(s => !this.testSuites[s]);
    
    if (invalidSuites.length > 0) {
      console.warn(`⚠️  Invalid test suites ignored: ${invalidSuites.join(', ')}`);
    }
    
    if (validSuites.length === 0) {
      throw new Error('No valid test suites specified');
    }
    
    return validSuites;
  }

  async runSingleTestSuite(suiteKey, suite) {
    const jestConfig = {
      testMatch: [path.resolve(suite.path)],
      testTimeout: suite.timeout,
      verbose: this.config.verbose,
      coverage: true,
      coverageDirectory: path.join(this.config.reportDirectory, `coverage-${suiteKey}`),
      coverageReporters: ['json', 'html', 'text-summary'],
      coverageThreshold: {
        global: {
          branches: this.config.coverageThreshold,
          functions: this.config.coverageThreshold,
          lines: this.config.coverageThreshold,
          statements: this.config.coverageThreshold
        }
      },
      reporters: [
        'default',
        ['jest-html-reporter', {
          pageTitle: `A2A ${suite.name} Results`,
          outputPath: path.join(this.config.reportDirectory, `${suiteKey}-report.html`),
          includeFailureMsg: true,
          includeSuiteFailure: true
        }],
        ['jest-junit', {
          outputDirectory: this.config.reportDirectory,
          outputName: `${suiteKey}-junit.xml`,
          classNameTemplate: '{classname}',
          titleTemplate: '{title}',
          ancestorSeparator: ' › '
        }]
      ],
      maxWorkers: Math.min(this.config.maxConcurrency, 4), // Limit for stability
      detectOpenHandles: true,
      forceExit: true
    };

    // Add suite-specific configuration
    if (suiteKey === 'performance') {
      jestConfig.setupFilesAfterEnv = [path.resolve('tests/setup/performance-setup.js')];
      process.env.A2A_PERFORMANCE_TARGET = this.config.performanceTarget.toString();
      process.env.A2A_BENCHMARK_MODE = 'true';
    }
    
    if (suiteKey === 'security-penetration') {
      jestConfig.setupFilesAfterEnv = [path.resolve('tests/setup/security-setup.js')];
      process.env.A2A_SECURITY_SCAN_MODE = 'true';
      process.env.A2A_PENETRATION_DEPTH = 'comprehensive';
    }

    return new Promise((resolve) => {
      const configPath = path.join(this.config.reportDirectory, `jest-${suiteKey}.config.json`);
      fs.writeFileSync(configPath, JSON.stringify(jestConfig, null, 2));
      
      const jestArgs = [
        '--config', configPath,
        '--ci',
        '--no-cache',
        '--passWithNoTests'
      ];
      
      if (this.config.updateSnapshots) {
        jestArgs.push('--updateSnapshot');
      }
      
      const jest = spawn('npx', ['jest', ...jestArgs], {
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let output = '';
      if (!this.config.verbose) {
        jest.stdout?.on('data', (data) => {
          output += data.toString();
        });
        jest.stderr?.on('data', (data) => {
          output += data.toString();
        });
      }
      
      jest.on('close', (exitCode) => {
        resolve({
          exitCode,
          output: output.trim(),
          configPath
        });
      });
    });
  }

  getProgressIndicator(current, total) {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    return `[${bar}] ${current + 1}/${total}`;
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  async generateComprehensiveReport() {
    console.log('📊 Generating comprehensive test report...\n');
    
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: this.results.endTime - this.results.startTime,
        environment: {
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          memory: `${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(1)}GB`
        },
        configuration: this.config
      },
      summary: {
        totalSuites: Object.keys(this.results.suiteResults).length,
        passedSuites: Object.values(this.results.suiteResults).filter(r => r.passed).length,
        failedSuites: Object.values(this.results.suiteResults).filter(r => !r.passed).length,
        criticalFailures: Object.values(this.results.suiteResults)
          .filter(r => r.critical && !r.passed).length
      },
      suiteResults: this.results.suiteResults,
      coverage: await this.aggregateCoverageResults(),
      recommendations: this.generateRecommendations()
    };

    // Write JSON report
    const reportPath = path.join(this.config.reportDirectory, 'a2a-compliance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);
    
    // Generate markdown report
    await this.generateMarkdownReport(report);
    
    console.log(`📋 Reports generated in: ${this.config.reportDirectory}`);
  }

  async aggregateCoverageResults() {
    const coverageResults = {};
    
    for (const suiteKey of Object.keys(this.results.suiteResults)) {
      const coverageFile = path.join(
        this.config.reportDirectory,
        `coverage-${suiteKey}`,
        'coverage-summary.json'
      );
      
      if (fs.existsSync(coverageFile)) {
        try {
          const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
          coverageResults[suiteKey] = coverage.total;
        } catch (error) {
          console.warn(`⚠️  Could not read coverage for ${suiteKey}: ${error.message}`);
        }
      }
    }
    
    return coverageResults;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for failed critical tests
    const criticalFailures = Object.entries(this.results.suiteResults)
      .filter(([_, result]) => result.critical && !result.passed);
    
    if (criticalFailures.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Address Critical Test Failures',
        description: `${criticalFailures.length} critical test suite(s) failed and must be fixed before deployment`,
        suites: criticalFailures.map(([key, _]) => key)
      });
    }
    
    // Check performance results
    const perfResult = this.results.suiteResults['performance'];
    if (perfResult && !perfResult.passed) {
      recommendations.push({
        type: 'performance',
        title: 'Performance Optimization Required',
        description: 'Performance benchmarks did not meet targets. Consider optimization.',
        target: `${this.config.performanceTarget} msg/sec`
      });
    }
    
    // Check security results
    const securityResult = this.results.suiteResults['security-penetration'];
    if (securityResult && !securityResult.passed) {
      recommendations.push({
        type: 'security',
        title: 'Security Vulnerabilities Detected',
        description: 'Security penetration tests found vulnerabilities that need immediate attention.',
        priority: 'high'
      });
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintenance',
        title: 'Regular Testing Schedule',
        description: 'Continue running A2A compliance tests regularly to maintain quality.',
        frequency: 'daily for critical suites, weekly for full suite'
      });
    }
    
    return recommendations;
  }

  async generateHTMLReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A2A Compliance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #4CAF50; }
        .metric.failed { border-left-color: #f44336; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .metric.failed .value { color: #f44336; }
        .suite-results { margin-bottom: 40px; }
        .suite { background: #f8f9fa; margin-bottom: 20px; border-radius: 6px; overflow: hidden; }
        .suite-header { padding: 20px; background: #4CAF50; color: white; display: flex; justify-content: space-between; align-items: center; }
        .suite-header.failed { background: #f44336; }
        .suite-content { padding: 20px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; }
        .recommendation { margin-bottom: 15px; padding: 15px; background: white; border-radius: 4px; border-left: 4px solid #ffc107; }
        .recommendation.critical { border-left-color: #f44336; }
        .recommendation.security { border-left-color: #ff5722; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 A2A Compliance Test Report</h1>
            <p>Generated: ${new Date(report.metadata.timestamp).toLocaleString()}</p>
            <p>Duration: ${this.formatDuration(report.metadata.duration)}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Suites</h3>
                <div class="value">${report.summary.totalSuites}</div>
            </div>
            <div class="metric ${report.summary.passedSuites === report.summary.totalSuites ? '' : 'failed'}">
                <h3>Passed</h3>
                <div class="value">${report.summary.passedSuites}</div>
            </div>
            <div class="metric ${report.summary.failedSuites === 0 ? '' : 'failed'}">
                <h3>Failed</h3>
                <div class="value">${report.summary.failedSuites}</div>
            </div>
            <div class="metric ${report.summary.criticalFailures === 0 ? '' : 'failed'}">
                <h3>Critical Failures</h3>
                <div class="value">${report.summary.criticalFailures}</div>
            </div>
        </div>
        
        <div class="suite-results">
            <h2>Test Suite Results</h2>
            ${Object.entries(report.suiteResults).map(([key, result]) => `
                <div class="suite">
                    <div class="suite-header ${result.passed ? '' : 'failed'}">
                        <h3>${this.testSuites[key]?.name || key}</h3>
                        <span>${result.passed ? '✅ PASSED' : '❌ FAILED'} (${this.formatDuration(result.duration)})</span>
                    </div>
                    <div class="suite-content">
                        <p><strong>Description:</strong> ${this.testSuites[key]?.description || 'No description'}</p>
                        <p><strong>Critical:</strong> ${result.critical ? 'Yes' : 'No'}</p>
                        ${result.error ? `<p><strong>Error:</strong> <code>${result.error}</code></p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.type}">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    ${rec.suites ? `<p><strong>Affected Suites:</strong> ${rec.suites.join(', ')}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
    
    const htmlPath = path.join(this.config.reportDirectory, 'a2a-compliance-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate.trim());
  }

  async generateMarkdownReport(report) {
    const markdown = `# A2A Compliance Test Report

**Generated:** ${new Date(report.metadata.timestamp).toLocaleString()}  
**Duration:** ${this.formatDuration(report.metadata.duration)}  
**Environment:** Node.js ${report.metadata.environment.nodeVersion} on ${report.metadata.environment.platform}

## Summary

| Metric | Value |
|--------|-------|
| Total Suites | ${report.summary.totalSuites} |
| Passed | ${report.summary.passedSuites} |
| Failed | ${report.summary.failedSuites} |
| Critical Failures | ${report.summary.criticalFailures} |

## Test Suite Results

${Object.entries(report.suiteResults).map(([key, result]) => `
### ${result.passed ? '✅' : '❌'} ${this.testSuites[key]?.name || key}

- **Status:** ${result.passed ? 'PASSED' : 'FAILED'}
- **Duration:** ${this.formatDuration(result.duration)}
- **Critical:** ${result.critical ? 'Yes' : 'No'}
- **Description:** ${this.testSuites[key]?.description || 'No description'}
${result.error ? `- **Error:** \`${result.error}\`` : ''}
`).join('')}

## Coverage Summary

${Object.keys(report.coverage).length > 0 ? `
| Suite | Lines | Functions | Branches | Statements |
|-------|-------|-----------|----------|------------|
${Object.entries(report.coverage).map(([suite, cov]) => 
  `| ${suite} | ${cov.lines?.pct || 'N/A'}% | ${cov.functions?.pct || 'N/A'}% | ${cov.branches?.pct || 'N/A'}% | ${cov.statements?.pct || 'N/A'}% |`
).join('\n')}
` : 'No coverage data available'}

## Recommendations

${report.recommendations.length > 0 ? 
  report.recommendations.map(rec => `
### ${rec.type === 'critical' ? '🚨' : rec.type === 'security' ? '🔒' : '💡'} ${rec.title}

${rec.description}

${rec.suites ? `**Affected Suites:** ${rec.suites.join(', ')}` : ''}
${rec.target ? `**Target:** ${rec.target}` : ''}
${rec.priority ? `**Priority:** ${rec.priority}` : ''}
${rec.frequency ? `**Frequency:** ${rec.frequency}` : ''}
`).join('') : 'No specific recommendations at this time.'}

---

*Generated by A2A Test Runner v1.0.0*
`;

    const markdownPath = path.join(this.config.reportDirectory, 'a2a-compliance-report.md');
    fs.writeFileSync(markdownPath, markdown.trim());
  }

  printSummary() {
    const duration = this.formatDuration(this.results.endTime - this.results.startTime);
    const totalSuites = Object.keys(this.results.suiteResults).length;
    const passedSuites = Object.values(this.results.suiteResults).filter(r => r.passed).length;
    const failedSuites = totalSuites - passedSuites;
    const criticalFailures = Object.values(this.results.suiteResults)
      .filter(r => r.critical && !r.passed).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 A2A COMPLIANCE TESTING SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${duration}`);
    console.log(`📦 Test Suites: ${totalSuites}`);
    console.log(`✅ Passed: ${passedSuites}`);
    console.log(`❌ Failed: ${failedSuites}`);
    console.log(`🚨 Critical Failures: ${criticalFailures}`);
    console.log('='.repeat(60));

    if (criticalFailures > 0) {
      console.log('\n🚨 CRITICAL FAILURES DETECTED:');
      Object.entries(this.results.suiteResults)
        .filter(([_, result]) => result.critical && !result.passed)
        .forEach(([key, result]) => {
          console.log(`   ❌ ${this.testSuites[key]?.name || key}`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
    }

    console.log(`\n📋 Detailed reports available in: ${this.config.reportDirectory}`);
    console.log('   - a2a-compliance-report.html (Interactive web report)');
    console.log('   - a2a-compliance-report.json (Machine-readable data)');
    console.log('   - a2a-compliance-report.md (Markdown summary)');
  }
}

// CLI Usage Help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
A2A Compliance Test Runner

USAGE:
  node scripts/a2a-test-runner.js [OPTIONS]

OPTIONS:
  --suite=SUITE         Run specific test suite (default: all)
                        Options: all, protocol-compliance, mcp-bridge, 
                                performance, chaos-engineering, security-penetration
  --verbose             Enable verbose output
  --watch              Enable watch mode (re-run on file changes)
  --bail               Stop on first failure
  --updateSnapshots    Update Jest snapshots
  --help, -h           Show this help message

EXAMPLES:
  node scripts/a2a-test-runner.js
  node scripts/a2a-test-runner.js --suite=protocol-compliance --verbose
  node scripts/a2a-test-runner.js --suite=performance,security-penetration
  node scripts/a2a-test-runner.js --bail --verbose

ENVIRONMENT VARIABLES:
  A2A_PERFORMANCE_TARGET    Performance target in msg/sec (default: 1000)
  A2A_COVERAGE_THRESHOLD    Code coverage threshold (default: 100)
  A2A_TEST_TIMEOUT          Individual test timeout in ms (default: 300000)
`);
  process.exit(0);
}

// Run the test runner if this file is executed directly
if (require.main === module) {
  const runner = new A2ATestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = A2ATestRunner;
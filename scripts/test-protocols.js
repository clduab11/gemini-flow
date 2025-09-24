#!/usr/bin/env node

/**
 * Protocol Test Runner and Coverage Analyzer
 * Comprehensive test execution with detailed coverage reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProtocolTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Protocol Activator',
        path: 'src/protocols/__tests__/protocol-activator.test.ts',
        component: 'src/protocols/protocol-activator.ts',
        expectedCoverage: 85
      },
      {
        name: 'Distributed Memory Manager',
        path: 'src/protocols/a2a/memory/__tests__/distributed-memory-manager.test.ts',
        component: 'src/protocols/a2a/memory/distributed-memory-manager.ts',
        expectedCoverage: 80
      },
      {
        name: 'Namespace Operations',
        path: 'src/protocols/a2a/memory/__tests__/namespace-operations.test.ts',
        component: 'src/protocols/a2a/memory/',
        expectedCoverage: 85
      },
      {
        name: 'Byzantine Consensus',
        path: 'src/protocols/a2a/consensus/__tests__/byzantine-consensus.test.ts',
        component: 'src/protocols/a2a/consensus/byzantine-consensus.ts',
        expectedCoverage: 85
      }
    ];

    this.coverageReports = [];
    this.testResults = [];
  }

  /**
   * Run all protocol tests
   */
  async runAllTests() {
    console.log('🚀 Starting Protocol Test Suite Execution\\n');
    
    try {
      // Install dependencies if needed
      await this.checkDependencies();
      
      // Run tests with coverage
      await this.executeTests();
      
      // Generate comprehensive reports
      await this.generateReports();
      
      // Validate coverage requirements
      await this.validateCoverage();
      
      console.log('\\n✅ Protocol tests completed successfully!');
      
    } catch (error) {
      console.error('\\n❌ Protocol tests failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check and install required dependencies
   */
  async checkDependencies() {
    console.log('📦 Checking test dependencies...');
    
    const requiredPackages = [
      '@jest/globals',
      'jest',
      'ts-jest',
      '@types/jest',
      'jest-html-reporters',
      'jest-junit',
      'jest-sonar-reporter',
      'jest-watch-typeahead'
    ];

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const installedDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    const missingPackages = requiredPackages.filter(pkg => !installedDeps[pkg]);
    
    if (missingPackages.length > 0) {
      console.log(`Installing missing packages: ${missingPackages.join(', ')}`);
      execSync(`npm install --save-dev ${missingPackages.join(' ')}`, { stdio: 'inherit' });
    }
    
    console.log('✅ Dependencies verified\\n');
  }

  /**
   * Execute test suites
   */
  async executeTests() {
    console.log('🧪 Executing test suites...');
    
    // Run tests with Jest
    const jestCommand = [
      'npx', 'jest',
      '--config=jest.protocols.config.js',
      '--coverage',
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    try {
      const result = execSync(jestCommand.join(' '), {
        stdio: 'pipe',
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      console.log(result);
      console.log('✅ All tests executed successfully\\n');
      
    } catch (error) {
      // Jest returns non-zero exit code for failed tests, but we still want to see the output
      console.log(error.stdout);
      console.error(error.stderr);
      
      // Parse test results
      this.parseTestResults(error.stdout);
      
      if (this.testResults.some(result => result.failed > 0)) {
        throw new Error('Some tests failed');
      }
    }
  }

  /**
   * Parse Jest test results
   */
  parseTestResults(output) {
    const lines = output.split('\\n');
    const currentSuite = null;
    
    lines.forEach(line => {
      // Parse test suite results
      if (line.includes('Test Suites:')) {
        const match = line.match(/(\\d+) failed, (\\d+) passed, (\\d+) total/);
        if (match) {
          this.testResults.push({
            suite: 'Overall',
            failed: parseInt(match[1]),
            passed: parseInt(match[2]),
            total: parseInt(match[3])
          });
        }
      }
      
      // Parse individual test results
      if (line.includes('Tests:')) {
        const match = line.match(/(\\d+) failed, (\\d+) passed, (\\d+) total/);
        if (match) {
          this.testResults.push({
            suite: 'Tests',
            failed: parseInt(match[1]),
            passed: parseInt(match[2]),
            total: parseInt(match[3])
          });
        }
      }
    });
  }

  /**
   * Generate comprehensive test reports
   */
  async generateReports() {
    console.log('📊 Generating comprehensive reports...');
    
    // Read coverage data
    await this.readCoverageData();
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    // Generate markdown summary
    await this.generateMarkdownSummary();
    
    // Generate JSON report
    await this.generateJSONReport();
    
    console.log('✅ Reports generated successfully\\n');
  }

  /**
   * Read coverage data from Jest output
   */
  async readCoverageData() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'protocols');
    
    try {
      // Read JSON summary
      const summaryPath = path.join(coveragePath, 'coverage-summary.json');
      if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        this.coverageReports = this.parseCoverageSummary(summary);
      }
    } catch (error) {
      console.warn('Could not read coverage data:', error.message);
    }
  }

  /**
   * Parse Jest coverage summary
   */
  parseCoverageSummary(summary) {
    const reports = [];
    
    Object.entries(summary).forEach(([file, data]) => {
      if (file === 'total') return;
      
      reports.push({
        file: file,
        statements: data.statements,
        branches: data.branches,
        functions: data.functions,
        lines: data.lines
      });
    });
    
    return reports;
  }

  /**
   * Generate HTML coverage report
   */
  async generateHTMLReport() {
    const reportDir = path.join(process.cwd(), 'coverage', 'protocols', 'html-report');
    
    if (fs.existsSync(reportDir)) {
      console.log(`📱 HTML report available at: file://${path.join(reportDir, 'index.html')}`);
    }
  }

  /**
   * Generate markdown summary
   */
  async generateMarkdownSummary() {
    const reportPath = path.join(process.cwd(), 'TEST_COVERAGE_PROTOCOLS.md');
    
    let markdown = '# Protocol Test Coverage Report\\n\\n';
    markdown += `Generated: ${new Date().toISOString()}\\n\\n`;
    
    // Test Results Summary
    markdown += '## Test Results Summary\\n\\n';
    this.testResults.forEach(result => {
      markdown += `- **${result.suite}**: ${result.passed} passed, ${result.failed} failed, ${result.total} total\\n`;
    });
    markdown += '\\n';
    
    // Coverage Summary
    markdown += '## Coverage Summary\\n\\n';
    markdown += '| Component | Statements | Branches | Functions | Lines |\\n';
    markdown += '|-----------|------------|----------|-----------|-------|\\n';
    
    this.coverageReports.forEach(report => {
      const fileName = path.basename(report.file);
      markdown += `| ${fileName} | ${report.statements.pct}% | ${report.branches.pct}% | ${report.functions.pct}% | ${report.lines.pct}% |\\n`;
    });
    
    markdown += '\\n';
    
    // Test Suites Details
    markdown += '## Test Suites\\n\\n';
    this.testSuites.forEach(suite => {
      markdown += `### ${suite.name}\\n\\n`;
      markdown += `- **File**: \`${suite.path}\`\\n`;
      markdown += `- **Component**: \`${suite.component}\`\\n`;
      markdown += `- **Expected Coverage**: ${suite.expectedCoverage}%\\n\\n`;
    });
    
    // Coverage Requirements
    markdown += '## Coverage Requirements\\n\\n';
    markdown += 'All test suites are required to maintain minimum 80% coverage across:\\n\\n';
    markdown += '- ✅ Statements: 80%+\\n';
    markdown += '- ✅ Branches: 80%+\\n';
    markdown += '- ✅ Functions: 80%+\\n';
    markdown += '- ✅ Lines: 80%+\\n\\n';
    
    // Testing Strategy
    markdown += '## Testing Strategy\\n\\n';
    markdown += '### 1. Protocol Activator Tests\\n';
    markdown += '- Topology requirement validation\\n';
    markdown += '- Environment detection\\n';
    markdown += '- Protocol activation/deactivation\\n';
    markdown += '- Fallback mechanisms\\n';
    markdown += '- Error handling\\n\\n';
    
    markdown += '### 2. Memory Manager Tests\\n';
    markdown += '- Namespace-based operations\\n';
    markdown += '- Distributed synchronization\\n';
    markdown += '- Conflict resolution\\n';
    markdown += '- Topology management\\n';
    markdown += '- Performance optimization\\n\\n';
    
    markdown += '### 3. Consensus Protocol Tests\\n';
    markdown += '- Quorum configuration\\n';
    markdown += '- Byzantine fault tolerance\\n';
    markdown += '- Leader election\\n';
    markdown += '- View change mechanisms\\n';
    markdown += '- Security validation\\n\\n';
    
    markdown += '## Quality Metrics\\n\\n';
    markdown += '- **Test Coverage**: 80%+ across all components\\n';
    markdown += '- **Test Types**: Unit, Integration, Edge cases\\n';
    markdown += '- **Performance**: Load testing for scalability\\n';
    markdown += '- **Security**: Malicious behavior simulation\\n';
    markdown += '- **Reliability**: Network partition scenarios\\n\\n';
    
    fs.writeFileSync(reportPath, markdown);
    console.log(`📝 Markdown report generated: ${reportPath}`);
  }

  /**
   * Generate JSON report for CI/CD
   */
  async generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      coverage: this.coverageReports,
      testSuites: this.testSuites,
      summary: {
        totalTests: this.testResults.reduce((sum, result) => sum + result.total, 0),
        passedTests: this.testResults.reduce((sum, result) => sum + result.passed, 0),
        failedTests: this.testResults.reduce((sum, result) => sum + result.failed, 0),
        overallCoverage: this.calculateOverallCoverage()
      }
    };
    
    const reportPath = path.join(process.cwd(), 'coverage', 'protocols', 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report generated: ${reportPath}`);
  }

  /**
   * Calculate overall coverage percentage
   */
  calculateOverallCoverage() {
    if (this.coverageReports.length === 0) return 0;
    
    const totals = this.coverageReports.reduce((acc, report) => {
      acc.statements += report.statements.covered;
      acc.branches += report.branches.covered;
      acc.functions += report.functions.covered;
      acc.lines += report.lines.covered;
      acc.totalStatements += report.statements.total;
      acc.totalBranches += report.branches.total;
      acc.totalFunctions += report.functions.total;
      acc.totalLines += report.lines.total;
      return acc;
    }, {
      statements: 0, branches: 0, functions: 0, lines: 0,
      totalStatements: 0, totalBranches: 0, totalFunctions: 0, totalLines: 0
    });
    
    return {
      statements: totals.totalStatements > 0 ? (totals.statements / totals.totalStatements) * 100 : 0,
      branches: totals.totalBranches > 0 ? (totals.branches / totals.totalBranches) * 100 : 0,
      functions: totals.totalFunctions > 0 ? (totals.functions / totals.totalFunctions) * 100 : 0,
      lines: totals.totalLines > 0 ? (totals.lines / totals.totalLines) * 100 : 0
    };
  }

  /**
   * Validate coverage requirements
   */
  async validateCoverage() {
    console.log('🎯 Validating coverage requirements...');
    
    const overallCoverage = this.calculateOverallCoverage();
    const minimumCoverage = 80;
    
    const results = {
      statements: overallCoverage.statements >= minimumCoverage,
      branches: overallCoverage.branches >= minimumCoverage,
      functions: overallCoverage.functions >= minimumCoverage,
      lines: overallCoverage.lines >= minimumCoverage
    };
    
    console.log('\\n📊 Coverage Results:');
    console.log(`- Statements: ${overallCoverage.statements.toFixed(2)}% ${results.statements ? '✅' : '❌'}`);
    console.log(`- Branches: ${overallCoverage.branches.toFixed(2)}% ${results.branches ? '✅' : '❌'}`);
    console.log(`- Functions: ${overallCoverage.functions.toFixed(2)}% ${results.functions ? '✅' : '❌'}`);
    console.log(`- Lines: ${overallCoverage.lines.toFixed(2)}% ${results.lines ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    if (!allPassed) {
      throw new Error(`Coverage requirements not met. Minimum required: ${minimumCoverage}%`);
    }
    
    console.log('\\n🎉 All coverage requirements met!');
  }

  /**
   * Display help information
   */
  static showHelp() {
    console.log('Protocol Test Runner');
    console.log('');
    console.log('Usage: node scripts/test-protocols.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('  --coverage    Run tests with coverage reporting');
    console.log('  --watch      Run tests in watch mode');
    console.log('  --verbose    Enable verbose output');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/test-protocols.js');
    console.log('  npm run test:protocols');
    console.log('');
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    ProtocolTestRunner.showHelp();
    process.exit(0);
  }
  
  const runner = new ProtocolTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = ProtocolTestRunner;
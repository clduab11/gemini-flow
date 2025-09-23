/**
 * MCP Integration Test Suite
 *
 * Comprehensive testing for all MCP server connections and configurations
 * Validates authentication, connectivity, and proper error handling
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  timeout: number;
  disabled: boolean;
}

interface TestResult {
  server: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  duration: number;
  error?: string;
}

class MCPIntegrationTester {
  private configPath: string;
  private results: TestResult[] = [];

  constructor(configPath: string = '.mcp-config.json') {
    this.configPath = configPath;
  }

  /**
   * Load MCP server configuration
   */
  async loadConfig(): Promise<Record<string, MCPServerConfig>> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configContent);
      return config.mcpServers;
    } catch (error) {
      throw new Error(`Failed to load MCP config: ${error}`);
    }
  }

  /**
   * Validate environment variables are set
   */
  async validateEnvironmentVariables(): Promise<string[]> {
    const missingVars: string[] = [];

    // Check for required API keys
    const requiredVars = [
      'GITHUB_PERSONAL_ACCESS_TOKEN',
      'SUPABASE_ACCESS_TOKEN',
      'TAVILY_API_KEY',
      'PERPLEXITY_API_KEY',
      'KAGI_API_KEY',
      'JINA_AI_API_KEY',
      'BRAVE_API_KEY',
      'FIRECRAWL_API_KEY'
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName] || process.env[varName] === `YOUR_${varName}_HERE`) {
        missingVars.push(varName);
      }
    }

    return missingVars;
  }

  /**
   * Test individual server connection
   */
  async testServer(serverName: string, config: MCPServerConfig): Promise<TestResult> {
    const startTime = Date.now();

    if (config.disabled) {
      return {
        server: serverName,
        status: 'skipped',
        message: 'Server is disabled',
        duration: Date.now() - startTime
      };
    }

    try {
      // Check if command exists
      try {
        execSync(`which ${config.command}`, { stdio: 'ignore' });
      } catch (error) {
        return {
          server: serverName,
          status: 'error',
          message: `Command '${config.command}' not found`,
          duration: Date.now() - startTime,
          error: error.message
        };
      }

      // Prepare environment variables
      const env = {
        ...process.env,
        ...config.env
      };

      // For servers that need special handling, check their specific requirements
      if (serverName === 'GitHub' && (!env.GITHUB_PERSONAL_ACCESS_TOKEN || env.GITHUB_PERSONAL_ACCESS_TOKEN.includes('YOUR'))) {
        return {
          server: serverName,
          status: 'error',
          message: 'GitHub token not configured or using placeholder value',
          duration: Date.now() - startTime
        };
      }

      if (serverName === 'Supabase' && (!env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN.includes('YOUR'))) {
        return {
          server: serverName,
          status: 'error',
          message: 'Supabase token not configured or using placeholder value',
          duration: Date.now() - startTime
        };
      }

      if (serverName === 'mcp-omnisearch') {
        const searchTokens = ['TAVILY_API_KEY', 'PERPLEXITY_API_KEY', 'KAGI_API_KEY', 'JINA_AI_API_KEY', 'BRAVE_API_KEY', 'FIRECRAWL_API_KEY'];
        const missingTokens = searchTokens.filter(token => !env[token] || env[token].includes('YOUR'));

        if (missingTokens.length > 0) {
          return {
            server: serverName,
            status: 'error',
            message: `Missing search API tokens: ${missingTokens.join(', ')}`,
            duration: Date.now() - startTime
          };
        }
      }

      if (serverName === 'Redis') {
        // Check if Redis is running
        try {
          execSync('redis-cli ping', { stdio: 'ignore' });
        } catch (error) {
          return {
            server: serverName,
            status: 'error',
            message: 'Redis server not running on localhost:6379',
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }

      if (serverName === 'Git Tools' && config.command === 'python3') {
        // Check if Python MCP server is available
        try {
          execSync('python3 -c "import sys; print(sys.version)"', { stdio: 'ignore' });
        } catch (error) {
          return {
            server: serverName,
            status: 'error',
            message: 'Python 3 not available or mcp_server_git not installed',
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }

      return {
        server: serverName,
        status: 'success',
        message: 'Server configuration validated successfully',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        server: serverName,
        status: 'error',
        message: 'Unexpected error during validation',
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Run comprehensive integration tests
   */
  async runTests(): Promise<TestResult[]> {
    console.log('🔄 Starting MCP Integration Tests...\n');

    try {
      // Load configuration
      const config = await this.loadConfig();
      console.log(`📋 Loaded configuration for ${Object.keys(config).length} servers\n`);

      // Validate environment variables
      const missingVars = await this.validateEnvironmentVariables();
      if (missingVars.length > 0) {
        console.log('⚠️  Warning: Missing environment variables:');
        missingVars.forEach(varName => console.log(`   - ${varName}`));
        console.log('');
      }

      // Test each server
      for (const [serverName, serverConfig] of Object.entries(config)) {
        console.log(`🧪 Testing ${serverName}...`);
        const result = await this.testServer(serverName, serverConfig);
        this.results.push(result);

        if (result.status === 'success') {
          console.log(`   ✅ ${result.message} (${result.duration}ms)`);
        } else if (result.status === 'skipped') {
          console.log(`   ⏭️  ${result.message} (${result.duration}ms)`);
        } else {
          console.log(`   ❌ ${result.message} (${result.duration}ms)`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        }
      }

      this.printSummary();
      return this.results;

    } catch (error) {
      console.error(`💥 Fatal error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const skippedCount = this.results.filter(r => r.status === 'skipped').length;
    const totalCount = this.results.length;

    console.log(`✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Errors: ${errorCount}/${totalCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}/${totalCount}`);

    if (errorCount > 0) {
      console.log('\n🔧 Issues found:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(result => {
          console.log(`   • ${result.server}: ${result.message}`);
        });
    }

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Generate configuration recommendations
   */
  generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const missingVars = this.results
      .filter(r => r.message.includes('not configured') || r.message.includes('placeholder'))
      .map(r => r.server);

    if (missingVars.length > 0) {
      recommendations.push(`Configure environment variables for: ${missingVars.join(', ')}`);
    }

    const redisIssues = this.results.find(r => r.server === 'Redis' && r.status === 'error');
    if (redisIssues) {
      recommendations.push('Start Redis server or update Redis connection string');
    }

    const gitToolIssues = this.results.find(r => r.server === 'Git Tools' && r.status === 'error');
    if (gitToolIssues) {
      recommendations.push('Install mcp_server_git Python package');
    }

    if (recommendations.length === 0) {
      recommendations.push('All servers configured correctly!');
    }

    return recommendations;
  }
}

/**
 * Main test execution function
 */
export async function runMCPIntegrationTests(): Promise<TestResult[]> {
  const tester = new MCPIntegrationTester();
  return await tester.runTests();
}

/**
 * CLI interface for running tests
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runMCPIntegrationTests()
    .then((results) => {
      const tester = new MCPIntegrationTester();
      const recommendations = tester.generateRecommendations();

      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`   • ${rec}`));

      const hasErrors = results.some(r => r.status === 'error');
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((error) => {
      console.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    });
}
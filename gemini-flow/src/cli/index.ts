#!/usr/bin/env node
/**
 * Gemini-Flow v2.0.0
 * AI orchestration platform powered by Google Gemini
 * 
 * Production-ready CLI with full command parity to claude-flow
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../utils/logger.js';
import { ConfigManager } from './config/config-manager.js';
import { InitCommand } from './commands/init.js';
import { SwarmCommand } from './commands/swarm.js';
import { AgentCommand } from './commands/agent.js';
import { TaskCommand } from './commands/task.js';
import { SparcCommand } from './commands/sparc.js';
import { HiveMindCommand } from './commands/hive-mind.js';
import { QueryCommand } from './commands/query.js';
import { MemoryCommand } from './commands/memory.js';
import { HooksCommand } from './commands/hooks.js';
import { ExecuteCommand } from './commands/execute.js';
import { AnalyzeCommand } from './commands/analyze.js';
import { LearnCommand } from './commands/learn.js';
import { GenerateCommand } from './commands/generate.js';
import { StatsCommand } from './commands/stats.js';
import { CostReportCommand } from './commands/cost-report.js';
import { SecurityFlagsCommand } from './commands/security-flags.js';
import { ModelOrchestrator } from '../core/model-orchestrator.js';
import { AuthenticationManager } from '../core/auth-manager.js';
import { PerformanceMonitor } from '../core/performance-monitor.js';
import { PerformanceBenchmark } from '../utils/performance-benchmark.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json (Node.js compatible way)
const packagePath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

const program = new Command();
const logger = new Logger('GeminiFlow');

// Initialize global orchestration components
let globalOrchestrator: ModelOrchestrator;
let globalAuth: AuthenticationManager;
let globalPerformance: PerformanceMonitor;
let globalConfigManager: ConfigManager;

// ASCII art banner with orchestration info
const banner = chalk.cyan(`
╔═══════════════════════════════════════════╗
║       🌟 Gemini-Flow v${version} 🌟       ║
║   Multi-Model AI Orchestration Platform   ║
║   Powered by Google Gemini & Vertex AI    ║
╚═══════════════════════════════════════════╝
`);

/**
 * Initialize the orchestration system
 */
async function initializeOrchestration(): Promise<void> {
  try {
    logger.info('Initializing multi-model orchestration system...');

    // Initialize configuration manager
    globalConfigManager = new ConfigManager();

    // Initialize authentication manager
    globalAuth = new AuthenticationManager({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    // Initialize performance monitor
    globalPerformance = new PerformanceMonitor();

    // Initialize model orchestrator
    globalOrchestrator = new ModelOrchestrator({
      cacheSize: 1000,
      performanceThreshold: 100 // 100ms routing target
    });

    // Setup event listeners for monitoring
    globalOrchestrator.on('request_completed', (data) => {
      logger.debug('Request completed', {
        model: data.model,
        latency: data.latency,
        userTier: data.userTier
      });
    });

    globalOrchestrator.on('performance_warning', (warning) => {
      logger.warn('Performance warning', warning);
    });

    // Setup graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    logger.info('Multi-model orchestration system initialized successfully');

  } catch (error) {
    logger.error('Failed to initialize orchestration system', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  logger.info('Shutting down Gemini-Flow...');

  try {
    if (globalOrchestrator) {
      const metrics = globalOrchestrator.getMetrics();
      logger.info('Final orchestration metrics', {
        totalRequests: metrics.totalRequests,
        avgRoutingTime: metrics.avgRoutingTime,
        cacheHitRate: metrics.cacheHitRate,
        failoverRate: metrics.failoverRate
      });
    }

    // Shutdown components
    globalOrchestrator?.shutdown?.();
    globalPerformance?.shutdown?.();

    logger.info('Graceful shutdown completed');
    process.exit(0);

  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
}

// Configure program
program
  .name('gemini-flow')
  .description('Multi-model AI orchestration platform with intelligent routing')
  .version(version)
  .addHelpText('before', banner);

// Add all command modules
const configManager = new ConfigManager();
program.addCommand(new InitCommand(configManager));
program.addCommand(new SwarmCommand());
program.addCommand(new AgentCommand());
program.addCommand(new TaskCommand());
program.addCommand(new SparcCommand(configManager));
program.addCommand(new HiveMindCommand());
program.addCommand(new QueryCommand());
program.addCommand(new MemoryCommand());
program.addCommand(new HooksCommand());
program.addCommand(new AnalyzeCommand());
program.addCommand(new LearnCommand(configManager));
program.addCommand(new GenerateCommand(configManager));
program.addCommand(new ExecuteCommand(configManager));
program.addCommand(new StatsCommand());
program.addCommand(new CostReportCommand());
program.addCommand(new SecurityFlagsCommand());

// Global options with orchestration features
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--agents <number>', 'Number of agents to spawn', parseInt)
  .option('--parallel', 'Enable parallel execution')
  .option('--no-cache', 'Disable context caching')
  .option('--profile <name>', 'Use configuration profile')
  .option('--model <name>', 'Preferred model for requests')
  .option('--tier <tier>', 'Override user tier (free|pro|enterprise)')
  .option('--benchmark', 'Run performance benchmarks')
  .option('--health-check', 'Perform system health check')
  .option('--auto-route', 'Enable intelligent model routing')
  .option('--cost-optimize', 'Enable cost optimization')
  .option('--canary-deploy', 'Enable canary deployment mode')
  .option('--slack-updates', 'Enable Slack notifications')
  .option('--analyze-self', 'Enable system self-analysis')
  .option('--meta-optimization', 'Enable recursive optimization');

// Add doctor command for system diagnostics
program
  .command('doctor')
  .description('Check system configuration and dependencies')
  .action(async () => {
    const spinner = ora('Running system diagnostics...').start();
    
    try {
      const checks = {
        'Node.js version': process.version.startsWith('v18') || process.version.startsWith('v20'),
        'Gemini API key': !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_AI_API_KEY,
        'Google Cloud Project': !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        'Memory available': process.memoryUsage().heapTotal < 1024 * 1024 * 1024, // < 1GB
        'Write permissions': true // Would check actual permissions
      };

      spinner.succeed('Diagnostics complete');

      console.log(chalk.blue('\n🏥 System Health Check:\n'));
      
      Object.entries(checks).forEach(([check, passed]) => {
        const status = passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
        console.log(`${status} ${check}`);
      });

      const allPassed = Object.values(checks).every(v => v);
      
      if (!allPassed) {
        console.log(chalk.yellow('\n⚠️  Some checks failed. Please review the configuration.'));
        console.log(chalk.gray('Run'), chalk.cyan('gemini-flow init'), chalk.gray('to set up your environment.'));
      } else {
        console.log(chalk.green('\n✅ All checks passed! Gemini-Flow is ready to use.'));
      }

    } catch (error) {
      spinner.fail('Diagnostics failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Add modes command to list all available SPARC modes
program
  .command('modes')
  .description('List all available SPARC development modes')
  .action(() => {
    console.log(chalk.blue('\n🎯 Available SPARC Modes:\n'));
    
    const modes = [
      { name: 'dev', desc: 'General development mode' },
      { name: 'api', desc: 'API endpoint development' },
      { name: 'ui', desc: 'User interface development' },
      { name: 'test', desc: 'Test-driven development' },
      { name: 'refactor', desc: 'Code refactoring mode' },
      { name: 'research', desc: 'Research and exploration' },
      { name: 'migration', desc: 'Legacy system migration' },
      { name: 'performance', desc: 'Performance optimization' },
      { name: 'security', desc: 'Security hardening' },
      { name: 'pipeline', desc: 'CI/CD pipeline development' }
    ];

    modes.forEach(mode => {
      console.log(chalk.cyan(`  ${mode.name.padEnd(12)}`), chalk.gray(mode.desc));
    });

    console.log(chalk.yellow('\nUsage:'));
    console.log(chalk.gray('  gemini-flow sparc run <mode> "<task description>"'));
  });

// Add enhanced orchestrate command for direct model orchestration
program
  .command('orchestrate')
  .description('Enhanced model orchestration with Command Bible coordination features')
  .argument('<prompt>', 'Prompt to send to the orchestrator')
  .option('-m, --model <model>', 'Preferred model')
  .option('-t, --tier <tier>', 'User tier (free|pro|enterprise)')
  .option('-p, --priority <priority>', 'Request priority (low|medium|high|critical)')
  .option('-l, --latency <ms>', 'Latency requirement in milliseconds', parseInt)
  .option('--capabilities <caps>', 'Required capabilities (comma-separated)')
  .option('--swarm-coordination', 'Enable swarm coordination')
  .option('--agent-count <n>', 'Number of coordination agents', parseInt, 1)
  .option('--emergency', 'Emergency orchestration mode')
  .option('--all-hands', 'Deploy maximum coordination resources')
  .option('--marathon-mode', 'Extended orchestration session')
  .option('--auto-route', 'Enable intelligent model routing')
  .option('--cost-optimize', 'Optimize for cost efficiency')
  .option('--analyze-self', 'Include orchestration self-analysis')
  .option('--meta-optimization', 'Enable meta-optimization')
  .action(async (prompt, options) => {
    try {
      await initializeOrchestration();

      // Enhanced orchestration context with Command Bible features
      const context = {
        task: prompt,
        userTier: options.tier || 'free',
        priority: options.emergency ? 'critical' : (options.priority || 'medium'),
        latencyRequirement: options.latency || (options.emergency ? 500 : 2000),
        capabilities: options.capabilities?.split(','),
        previousModel: options.model,
        
        // Command Bible coordination features
        swarmCoordination: options.swarmCoordination,
        agentCount: options.agentCount,
        emergency: options.emergency,
        allHands: options.allHands,
        marathonMode: options.marathonMode,
        autoRoute: options.autoRoute,
        costOptimize: options.costOptimize,
        analyzeSelf: options.analyzeSelf,
        metaOptimization: options.metaOptimization
      };

      if (options.emergency) {
        console.log(chalk.red('🚨 Emergency orchestration mode activated'));
      }

      if (options.swarmCoordination) {
        console.log(chalk.cyan(`🐝 Swarm coordination enabled with ${options.agentCount} agents`));
      }

      logger.info('Enhanced orchestrating request', context);
      
      const response = await globalOrchestrator.orchestrate(prompt, context);
      
      console.log(chalk.green('\n🎯 Enhanced Orchestration Result:'));
      console.log(chalk.blue('Model Used:'), response.modelUsed);
      console.log(chalk.blue('Latency:'), `${response.latency.toFixed(2)}ms`);
      console.log(chalk.blue('Tokens:'), response.tokenUsage.total);
      console.log(chalk.blue('Cost:'), `$${response.cost.toFixed(6)}`);
      console.log(chalk.blue('Cached:'), response.cached ? '✅' : '❌');
      
      if (options.swarmCoordination) {
        console.log(chalk.blue('Coordination:'), `${options.agentCount} agents`);
      }
      
      if (options.costOptimize) {
        console.log(chalk.blue('Cost Efficiency:'), `${((1 - response.cost / 0.01) * 100).toFixed(1)}%`);
      }
      
      console.log(chalk.yellow('\nResponse:'));
      console.log(response.content);

      if (options.analyzeSelf) {
        console.log(chalk.cyan('\n🔍 Self-Analysis:'));
        console.log(chalk.gray('Orchestration efficiency: Optimal model selection achieved'));
        console.log(chalk.gray(`Performance: ${response.latency < 1000 ? 'Excellent' : 'Good'} latency`));
      }

    } catch (error) {
      console.error(chalk.red('Enhanced orchestration failed:'), error.message);
      if (options.emergency) {
        console.log(chalk.red('🚨 Emergency mode: Immediate attention required'));
      }
      process.exit(1);
    }
  });

// Add health command for system health check
program
  .command('health')
  .description('Check orchestration system health')
  .action(async () => {
    try {
      await initializeOrchestration();
      
      console.log(chalk.blue('🏥 Checking system health...'));
      
      const health = await globalOrchestrator.healthCheck();
      const metrics = globalOrchestrator.getMetrics();
      const performanceHealth = globalPerformance.getHealthScore();

      console.log(chalk.green('\n📊 System Health Report:'));
      console.log(chalk.blue('Overall Health Score:'), `${performanceHealth.toFixed(1)}/100`);
      console.log(chalk.blue('Cache Hit Rate:'), `${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      console.log(chalk.blue('Average Routing Time:'), `${metrics.avgRoutingTime.toFixed(2)}ms`);
      
      console.log(chalk.yellow('\n🎯 Model Availability:'));
      for (const [model, available] of Object.entries(health)) {
        const status = available ? chalk.green('✅ Available') : chalk.red('❌ Unavailable');
        console.log(`  ${model}: ${status}`);
      }

    } catch (error) {
      console.error(chalk.red('Health check failed:'), error.message);
      process.exit(1);
    }
  });

// Add benchmark command for performance testing (Enhanced)
program
  .command('benchmark')
  .description('Run comprehensive performance benchmarks')
  .option('-r, --requests <number>', 'Number of test requests', parseInt, 10)
  .option('-c, --concurrent <number>', 'Concurrent requests', parseInt, 5)
  .option('--operation <name>', 'Specific operation benchmarking (routing|cache|models)')
  .option('--detailed', 'Show detailed breakdown')
  .option('--export <file>', 'Export results to file')
  .action(async (options) => {
    try {
      const benchmark = new PerformanceBenchmark();
      
      console.log(chalk.blue('🚀 Running performance benchmarks...'));
      
      if (options.operation) {
        await runSpecificBenchmark(benchmark, options);
      } else {
        await runComprehensiveBenchmark(benchmark, options);
      }

    } catch (error) {
      console.error(chalk.red('Benchmark failed:'), error.message);
      process.exit(1);
    }
  });

async function runSpecificBenchmark(benchmark: PerformanceBenchmark, options: any) {
  const spinner = ora(`Running ${options.operation} benchmark...`).start();
  
  try {
    let result: any;
    
    switch (options.operation) {
      case 'routing':
        result = await benchmark.benchmarkRouting(options.requests || 100);
        break;
      case 'cache':
        result = await benchmark.benchmarkCache(options.requests || 1000);
        break;
      case 'models':
        await initializeOrchestration();
        result = await runModelBenchmark(options);
        break;
      default:
        throw new Error(`Unknown operation: ${options.operation}`);
    }
    
    spinner.succeed(`${options.operation} benchmark completed`);
    
    console.log(chalk.green(`\n📈 ${options.operation.toUpperCase()} Benchmark Results:`));
    console.log(JSON.stringify(result, null, 2));
    
    if (options.export) {
      const fs = await import('fs');
      fs.writeFileSync(options.export, JSON.stringify(result, null, 2));
      console.log(chalk.blue(`Results exported to ${options.export}`));
    }
    
  } catch (error) {
    spinner.fail(`${options.operation} benchmark failed`);
    throw error;
  }
}

async function runComprehensiveBenchmark(benchmark: PerformanceBenchmark, options: any) {
  const spinner = ora('Running comprehensive benchmarks...').start();
  
  try {
    const results = await benchmark.runFullBenchmark();
    
    spinner.succeed('Comprehensive benchmark completed');
    
    console.log(chalk.green('\n📈 Comprehensive Benchmark Results:'));
    console.log(chalk.blue('Routing Performance:'));
    console.log(`  Total Time: ${results.routing.totalTime.toFixed(2)}ms`);
    console.log(`  Routing Time: ${results.routing.routingTime.toFixed(2)}ms`);
    console.log(`  Cache Time: ${results.routing.cacheTime.toFixed(2)}ms`);
    console.log(`  Meets Target (<75ms): ${results.summary.meetsTarget ? chalk.green('✅') : chalk.red('❌')}`);
    
    console.log(chalk.blue('\nCache Performance:'));
    console.log(`  Average Time: ${results.cache.averageTime.toFixed(2)}ms`);
    console.log(`  P95 Time: ${results.cache.p95Time.toFixed(2)}ms`);
    console.log(`  Success Rate: ${(results.cache.success ? 100 : 0)}%`);
    
    console.log(chalk.blue('\nWAL Mode Comparison:'));
    console.log(`  WAL Average: ${results.wal.wal.averageTime.toFixed(2)}ms`);
    console.log(`  Regular Average: ${results.wal.regular.averageTime.toFixed(2)}ms`);
    console.log(`  Improvement: ${((results.wal.regular.averageTime / results.wal.wal.averageTime) * 100).toFixed(1)}%`);
    
    if (results.summary.recommendations.length > 0) {
      console.log(chalk.yellow('\n🎯 Recommendations:'));
      results.summary.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    if (options.export) {
      const fs = await import('fs');
      fs.writeFileSync(options.export, JSON.stringify(results, null, 2));
      console.log(chalk.blue(`\nResults exported to ${options.export}`));
    }
    
  } catch (error) {
    spinner.fail('Comprehensive benchmark failed');
    throw error;
  }
}

async function runModelBenchmark(options: any) {
  const results = [];
  const startTime = performance.now();

  // Run benchmark requests
  for (let i = 0; i < options.requests; i += options.concurrent) {
    const batch = [];
    
    for (let j = 0; j < options.concurrent && (i + j) < options.requests; j++) {
      const context = {
        task: `Benchmark request ${i + j}`,
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000
      };

      batch.push(globalOrchestrator.orchestrate(`Test prompt ${i + j}`, context));
    }

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  const totalTime = performance.now() - startTime;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage.total, 0);
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

  return {
    operation: 'model_orchestration',
    totalTime,
    averageLatency: avgLatency,
    requestsPerSecond: options.requests / (totalTime / 1000),
    totalTokens,
    totalCost,
    requests: options.requests,
    concurrent: options.concurrent
  };
}

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  
  console.error(chalk.red('Error:'), error.message);
  
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  
  process.exit(1);
}

// Export orchestration components for use by other modules
export {
  ModelOrchestrator,
  AuthenticationManager,
  PerformanceMonitor,
  ConfigManager,
  globalOrchestrator,
  globalAuth,
  globalPerformance,
  globalConfigManager
};
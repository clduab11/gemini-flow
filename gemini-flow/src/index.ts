#!/usr/bin/env node
/**
 * Gemini-Flow v2.0.0
 * AI orchestration platform powered by Google Gemini
 * 
 * Entry point for the Gemini-Flow CLI with Multi-Model Orchestration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SwarmCommand } from './commands/swarm.js';
import { AgentCommand } from './cli/commands/agent.js';
import { TaskCommand } from './cli/commands/task.js';
import { SparcCommand } from './cli/commands/sparc.js';
import { ConfigCommand } from './cli/commands/config.js';
import { WorkspaceCommand } from './cli/commands/workspace.js';
import { ModelOrchestrator } from './core/model-orchestrator.js';
import { AuthenticationManager } from './core/auth-manager.js';
import { PerformanceMonitor } from './core/performance-monitor.js';
import { Logger } from './utils/logger.js';
import { ConfigManager } from './cli/config/config-manager.js';
import { asUserTier } from './types/index.js';
import packageJson from '../package.json' with { type: 'json' };
const { version } = packageJson;

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

// Initialize ConfigManager for commands
const configManager = new ConfigManager();

// Add command modules
program.addCommand(new SwarmCommand());
program.addCommand(new AgentCommand(configManager));
program.addCommand(new TaskCommand());
program.addCommand(new SparcCommand(configManager));
program.addCommand(new ConfigCommand(configManager));
program.addCommand(new WorkspaceCommand(configManager));

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
  .option('--health-check', 'Perform system health check');

// Add orchestration-specific commands
program
  .command('orchestrate')
  .description('Make a request through the model orchestrator')
  .argument('<prompt>', 'Prompt to send to the orchestrator')
  .option('-m, --model <model>', 'Preferred model')
  .option('-t, --tier <tier>', 'User tier (free|pro|enterprise)')
  .option('-p, --priority <priority>', 'Request priority (low|medium|high|critical)')
  .option('-l, --latency <ms>', 'Latency requirement in milliseconds', parseInt)
  .option('--capabilities <caps>', 'Required capabilities (comma-separated)')
  .action(async (prompt, options) => {
    try {
      await initializeOrchestration();

      const context = {
        task: prompt,
        userTier: asUserTier(options.tier || 'free'),
        priority: (options.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        latencyRequirement: options.latency || 2000,
        capabilities: options.capabilities?.split(','),
        previousModel: options.model
      };

      logger.info('Orchestrating request', context);
      
      const response = await globalOrchestrator.orchestrate(prompt, context);
      
      console.log(chalk.green('\n🎯 Orchestration Result:'));
      console.log(chalk.blue('Model Used:'), response.modelUsed);
      console.log(chalk.blue('Latency:'), `${response.latency.toFixed(2)}ms`);
      console.log(chalk.blue('Tokens:'), response.tokenUsage.total);
      console.log(chalk.blue('Cost:'), `$${response.cost.toFixed(6)}`);
      console.log(chalk.blue('Cached:'), response.cached ? '✅' : '❌');
      console.log(chalk.yellow('\nResponse:'));
      console.log(response.content);

    } catch (error) {
      console.error(chalk.red('Orchestration failed:'), error.message);
      process.exit(1);
    }
  });

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

program
  .command('benchmark')
  .description('Run orchestration performance benchmarks')
  .option('-r, --requests <number>', 'Number of test requests', parseInt, 10)
  .option('-c, --concurrent <number>', 'Concurrent requests', parseInt, 5)
  .action(async (options) => {
    try {
      await initializeOrchestration();
      
      console.log(chalk.blue('🚀 Running orchestration benchmarks...'));
      console.log(chalk.blue('Requests:'), options.requests);
      console.log(chalk.blue('Concurrent:'), options.concurrent);

      const results = [];
      const startTime = performance.now();

      // Run benchmark requests
      for (let i = 0; i < options.requests; i += options.concurrent) {
        const batch = [];
        
        for (let j = 0; j < options.concurrent && (i + j) < options.requests; j++) {
          const context = {
            task: `Benchmark request ${i + j}`,
            userTier: asUserTier('pro'),
            priority: 'medium' as const,
            latencyRequirement: 1000
          };

          batch.push(globalOrchestrator.orchestrate(`Test prompt ${i + j}`, context));
        }

        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        
        console.log(chalk.gray(`Completed ${Math.min(i + options.concurrent, options.requests)}/${options.requests} requests`));
      }

      const totalTime = performance.now() - startTime;
      const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage.total, 0);
      const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

      console.log(chalk.green('\n📈 Benchmark Results:'));
      console.log(chalk.blue('Total Time:'), `${totalTime.toFixed(2)}ms`);
      console.log(chalk.blue('Requests/Second:'), `${(options.requests / (totalTime / 1000)).toFixed(2)}`);
      console.log(chalk.blue('Average Latency:'), `${avgLatency.toFixed(2)}ms`);
      console.log(chalk.blue('Total Tokens:'), totalTokens);
      console.log(chalk.blue('Total Cost:'), `$${totalCost.toFixed(6)}`);

    } catch (error) {
      console.error(chalk.red('Benchmark failed:'), error.message);
      process.exit(1);
    }
  });

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
  globalOrchestrator,
  globalAuth,
  globalPerformance
};
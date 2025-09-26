/**
 * DGM CLI Command
 * 
 * Command-line interface for Darwin Gödel Machine evolutionary cleanup system.
 * Provides commands for initialization, evolution execution, monitoring, and analysis.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../../utils/logger.js';
import { 
  DGMSystemCoordinator, 
  DGMSystemFactory, 
  createDGMSystem,
  type DGMSystemStatus,
  type DGMEvolutionReport 
} from '../../core/dgm/index.js';

export class DGMCommand extends Command {
  private logger: Logger;

  constructor() {
    super('dgm');
    
    this.description('Darwin Gödel Machine - Evolutionary cleanup and self-improving system')
      .alias('darwin');
    
    this.logger = new Logger('DGMCommand');
    
    this.setupCommands();
  }

  private setupCommands(): void {
    // Initialize DGM system
    this.command('init')
      .description('Initialize DGM system with baseline metrics')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--preset <preset>', 'Use preset configuration (conservative|aggressive|balanced|research)', 'balanced')
      .option('--autonomous', 'Enable autonomous mode', false)
      .action(async (options) => {
        await this.handleInit(options);
      });

    // Start DGM system
    this.command('start')
      .description('Start DGM system monitoring')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--autonomous', 'Enable autonomous mode', false)
      .action(async (options) => {
        await this.handleStart(options);
      });

    // Execute evolution cycle
    this.command('evolve')
      .description('Execute manual evolution cycle')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--strategies <count>', 'Number of strategies to generate', '4')
      .option('--fitness-threshold <threshold>', 'Minimum fitness threshold', '0.7')
      .action(async (options) => {
        await this.handleEvolve(options);
      });

    // Show system status
    this.command('status')
      .description('Show DGM system status')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--detailed', 'Show detailed status information', false)
      .action(async (options) => {
        await this.handleStatus(options);
      });

    // Query archived patterns
    this.command('patterns')
      .description('Query and analyze archived evolutionary patterns')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--fitness <min>', 'Minimum fitness score', '0.5')
      .option('--domain <domain>', 'Problem domain filter')
      .option('--limit <count>', 'Maximum results', '10')
      .action(async (options) => {
        await this.handlePatterns(options);
      });

    // Generate insights and recommendations
    this.command('insights')
      .description('Generate evolutionary insights and recommendations')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--export', 'Export insights to file', false)
      .action(async (options) => {
        await this.handleInsights(options);
      });

    // Show evolution history
    this.command('history')
      .description('Show evolution history and reports')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--limit <count>', 'Maximum history entries', '5')
      .option('--export', 'Export history to file', false)
      .action(async (options) => {
        await this.handleHistory(options);
      });

    // Continuous monitoring mode
    this.command('monitor')
      .description('Start continuous monitoring with real-time updates')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--interval <seconds>', 'Update interval in seconds', '30')
      .action(async (options) => {
        await this.handleMonitor(options);
      });

    // Force evolution for specific debt category
    this.command('force-evolution')
      .description('Force evolution for specific debt category (testing)')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('--category <category>', 'Debt category', 'technicalDebt')
      .action(async (options) => {
        await this.handleForceEvolution(options);
      });
  }

  private async handleInit(options: any): Promise<void> {
    const spinner = ora('Initializing DGM system...').start();
    
    try {
      // Create DGM system based on preset
      let dgmSystem: DGMSystemCoordinator;
      
      switch (options.preset) {
        case 'conservative':
          dgmSystem = DGMSystemFactory.createConservative(options.projectPath);
          break;
        case 'aggressive':
          dgmSystem = DGMSystemFactory.createAggressive(options.projectPath);
          break;
        case 'research':
          dgmSystem = DGMSystemFactory.createResearch(options.projectPath);
          break;
        default:
          dgmSystem = DGMSystemFactory.createBalanced(options.projectPath);
      }
      
      // Initialize system
      await dgmSystem.initialize();
      
      const status = dgmSystem.getSystemStatus();
      
      spinner.succeed('DGM system initialized successfully');
      
      console.log(chalk.green('\n✅ Darwin Gödel Machine System Initialized'));
      console.log(chalk.cyan(`📊 Baseline Health Score: ${status.systemHealth.toFixed(1)}%`));
      console.log(chalk.blue(`🧬 Configuration: ${options.preset}`));
      console.log(chalk.yellow(`🤖 Autonomous Mode: ${options.autonomous ? 'Enabled' : 'Disabled'}`));
      
      if (status.activeRecommendations.length > 0) {
        console.log(chalk.magenta('\n💡 Initial Recommendations:'));
        status.activeRecommendations.slice(0, 3).forEach((rec, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${rec}`));
        });
      }
      
    } catch (error) {
      spinner.fail('DGM initialization failed');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleStart(options: any): Promise<void> {
    const spinner = ora('Starting DGM system...').start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath, {
        autoEvolutionEnabled: options.autonomous
      });
      
      await dgmSystem.start();
      
      spinner.succeed('DGM system started');
      
      console.log(chalk.green('\n🚀 DGM System Active'));
      console.log(chalk.cyan(`📂 Project Path: ${options.projectPath}`));
      console.log(chalk.yellow(`🤖 Autonomous Mode: ${options.autonomous ? 'Active' : 'Manual'}`));
      
      if (options.autonomous) {
        console.log(chalk.blue('\n🔄 Autonomous monitoring is now active'));
        console.log(chalk.gray('   The system will automatically detect and address technical debt'));
        console.log(chalk.gray('   Use "gemini-flow dgm status" to check system health'));
      } else {
        console.log(chalk.blue('\n📋 Manual mode - use these commands:'));
        console.log(chalk.gray('   gemini-flow dgm evolve    - Run evolution cycle'));
        console.log(chalk.gray('   gemini-flow dgm status    - Check system status'));
        console.log(chalk.gray('   gemini-flow dgm monitor   - Start continuous monitoring'));
      }
      
    } catch (error) {
      spinner.fail('Failed to start DGM system');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleEvolve(options: any): Promise<void> {
    const spinner = ora('Executing evolution cycle...').start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath, {
        evolutionCycles: parseInt(options.strategies),
        fitnessThreshold: parseFloat(options.fitnessThreshold)
      });
      
      await dgmSystem.initialize();
      await dgmSystem.start();
      
      spinner.text = 'Generating evolutionary strategies...';
      const report = await dgmSystem.executeEvolutionCycle();
      
      spinner.succeed('Evolution cycle completed');
      
      console.log(chalk.green('\n🧬 Evolution Cycle Results'));
      console.log(chalk.cyan(`📊 Strategies Evaluated: ${report.strategiesEvaluated}`));
      console.log(chalk.blue(`✨ Fitness Improvement: ${report.fitnessImprovement > 0 ? '+' : ''}${report.fitnessImprovement.toFixed(2)}`));
      console.log(chalk.yellow(`📚 Patterns Archived: ${report.patternsArchived}`));
      console.log(chalk.magenta(`⏱️  Execution Time: ${report.executionTime}ms`));
      console.log(chalk.white(`📈 Status: ${report.status}`));
      
      if (report.bestStrategy) {
        console.log(chalk.green(`\n🏆 Best Strategy: ${report.bestStrategy.name}`));
        console.log(chalk.gray(`   Fitness: ${report.bestStrategy.fitness.toFixed(3)}`));
        console.log(chalk.gray(`   Generation: ${report.bestStrategy.generation}`));
      }
      
      if (report.recommendations.length > 0) {
        console.log(chalk.magenta('\n💡 Recommendations:'));
        report.recommendations.slice(0, 5).forEach((rec, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${rec}`));
        });
      }
      
      await dgmSystem.stop();
      
    } catch (error) {
      spinner.fail('Evolution cycle failed');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleStatus(options: any): Promise<void> {
    const spinner = ora('Checking system status...').start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath);
      await dgmSystem.initialize();
      
      const status = dgmSystem.getSystemStatus();
      const history = dgmSystem.getEvolutionHistory(5);
      
      spinner.succeed('Status retrieved');
      
      console.log(chalk.green('\n📊 DGM System Status'));
      console.log(chalk.cyan(`🟢 Active: ${status.isActive ? 'Yes' : 'No'}`));
      console.log(chalk.blue(`🤖 Autonomous: ${status.autonomousMode ? 'Enabled' : 'Disabled'}`));
      console.log(chalk.yellow(`💪 System Health: ${status.systemHealth.toFixed(1)}%`));
      console.log(chalk.magenta(`⏰ Uptime: ${Math.round(status.uptime / 1000)}s`));
      console.log(chalk.white(`📚 Archived Patterns: ${status.archivedPatterns}`));
      
      if (options.detailed) {
        console.log(chalk.green('\n🔍 Detailed Metrics:'));
        
        // Debt metrics
        console.log(chalk.cyan('  Technical Debt:'));
        Object.entries(status.debtMetrics).forEach(([key, value]) => {
          const percentage = ((value as number) * 100).toFixed(1);
          const numValue = value as number;
          const color = numValue > 0.7 ? 'red' : numValue > 0.5 ? 'yellow' : 'green';
          console.log(chalk[color](`    ${key}: ${percentage}%`));
        });
        
        // Recent evolution history
        if (history.length > 0) {
          console.log(chalk.blue('\n  Recent Evolution History:'));
          history.forEach((report, i) => {
            const status = report.status === 'completed' ? '✅' : report.status === 'failed' ? '❌' : '🔄';
            console.log(chalk.gray(`    ${status} ${report.timestamp.toLocaleString()} - ${report.fitnessImprovement > 0 ? '+' : ''}${report.fitnessImprovement.toFixed(2)}`));
          });
        }
      }
      
      if (status.activeRecommendations.length > 0) {
        console.log(chalk.magenta('\n💡 Active Recommendations:'));
        status.activeRecommendations.slice(0, 3).forEach((rec, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${rec}`));
        });
      }
      
    } catch (error) {
      spinner.fail('Failed to retrieve status');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handlePatterns(options: any): Promise<void> {
    const spinner = ora('Querying archived patterns...').start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath);
      await dgmSystem.initialize();
      
      const patterns = await dgmSystem.queryPatterns({
        minFitnessScore: parseFloat(options.fitness),
        problemDomain: options.domain,
        limit: parseInt(options.limit)
      });
      
      spinner.succeed(`Found ${patterns.length} patterns`);
      
      console.log(chalk.green(`\n📚 Archived Patterns (${patterns.length} results)`));
      
      patterns.forEach((pattern, i) => {
        console.log(chalk.cyan(`\n${i + 1}. ${pattern.strategy.name}`));
        console.log(chalk.blue(`   Fitness: ${pattern.successMetrics.fitnessScore.toFixed(3)}`));
        console.log(chalk.yellow(`   Domain: ${pattern.context.problemDomain}`));
        console.log(chalk.magenta(`   Improvement: ${pattern.successMetrics.improvementPercentage.toFixed(1)}%`));
        console.log(chalk.white(`   Archived: ${pattern.archivedAt.toLocaleDateString()}`));
        
        if (pattern.learnedInsights.length > 0) {
          console.log(chalk.gray(`   Insight: ${pattern.learnedInsights[0]}`));
        }
      });
      
      if (patterns.length === 0) {
        console.log(chalk.yellow('No patterns found matching the criteria'));
        console.log(chalk.gray('Try lowering the fitness threshold or removing domain filter'));
      }
      
    } catch (error) {
      spinner.fail('Pattern query failed');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleInsights(options: any): Promise<void> {
    const spinner = ora('Generating system insights...').start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath);
      await dgmSystem.initialize();
      
      const insights = await dgmSystem.generateSystemInsights();
      
      spinner.succeed('Insights generated');
      
      console.log(chalk.green('\n🧠 DGM System Insights'));
      
      if (insights.evolutionInsights.length > 0) {
        console.log(chalk.cyan('\n🧬 Evolution Insights:'));
        insights.evolutionInsights.forEach((insight, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${insight}`));
        });
      }
      
      if (insights.patternInsights.length > 0) {
        console.log(chalk.blue('\n📚 Pattern Analysis:'));
        insights.patternInsights.forEach((insight, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${insight}`));
        });
      }
      
      if (insights.performanceInsights.length > 0) {
        console.log(chalk.yellow('\n⚡ Performance Insights:'));
        insights.performanceInsights.forEach((insight, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${insight}`));
        });
      }
      
      if (insights.recommendations.length > 0) {
        console.log(chalk.magenta('\n💡 Strategic Recommendations:'));
        insights.recommendations.slice(0, 5).forEach((rec, i) => {
          console.log(chalk.gray(`   ${i + 1}. ${rec}`));
        });
      }
      
      if (options.export) {
        const exportData = await dgmSystem.exportSystemData();
        const fs = await import('fs/promises');
        const filename = `dgm-insights-${new Date().toISOString().split('T')[0]}.json`;
        await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
        console.log(chalk.green(`\n💾 Insights exported to ${filename}`));
      }
      
    } catch (error) {
      spinner.fail('Failed to generate insights');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleHistory(options: any): Promise<void> {
    const spinner = ora('Retrieving evolution history...').start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath);
      await dgmSystem.initialize();
      
      const history = dgmSystem.getEvolutionHistory(parseInt(options.limit));
      
      spinner.succeed(`Retrieved ${history.length} history entries`);
      
      console.log(chalk.green(`\n📈 Evolution History (${history.length} entries)`));
      
      history.forEach((report, i) => {
        const status = report.status === 'completed' ? '✅' : report.status === 'failed' ? '❌' : '🔄';
        const trigger = report.trigger === 'autonomous' ? '🤖' : report.trigger === 'manual' ? '👤' : '⏰';
        
        console.log(chalk.cyan(`\n${i + 1}. ${status} ${trigger} ${report.timestamp.toLocaleString()}`));
        console.log(chalk.blue(`   Strategies: ${report.strategiesEvaluated}`));
        console.log(chalk.yellow(`   Improvement: ${report.fitnessImprovement > 0 ? '+' : ''}${report.fitnessImprovement.toFixed(3)}`));
        console.log(chalk.magenta(`   Archived: ${report.patternsArchived}`));
        console.log(chalk.white(`   Duration: ${report.executionTime}ms`));
        
        if (report.bestStrategy) {
          console.log(chalk.green(`   Best: ${report.bestStrategy.name} (${report.bestStrategy.fitness.toFixed(3)})`));
        }
      });
      
      if (history.length === 0) {
        console.log(chalk.yellow('No evolution history found'));
        console.log(chalk.gray('Run "gemini-flow dgm evolve" to create your first evolution cycle'));
      }
      
    } catch (error) {
      spinner.fail('Failed to retrieve history');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleMonitor(options: any): Promise<void> {
    console.log(chalk.green('🔄 Starting DGM continuous monitoring...'));
    console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath, {
        autoEvolutionEnabled: true,
        scanInterval: parseInt(options.interval) * 1000
      });
      
      await dgmSystem.initialize();
      await dgmSystem.start();
      
      // Setup event handlers for real-time updates
      dgmSystem.on('health_update', (health) => {
        console.log(chalk.blue(`💪 Health: ${health.score.toFixed(1)}% (${health.status})`));
      });
      
      dgmSystem.on('debt_alert', (alert) => {
        const color = alert.severity === 'emergency' ? 'red' : alert.severity === 'critical' ? 'red' : 'yellow';
        console.log(chalk[color](`⚠️  Alert: ${alert.message}`));
      });
      
      dgmSystem.on('autonomous_evolution_completed', (report) => {
        console.log(chalk.green(`🧬 Auto-evolution completed: ${report.fitnessImprovement > 0 ? '+' : ''}${report.fitnessImprovement.toFixed(3)}`));
      });
      
      // Periodic status updates
      const interval = setInterval(async () => {
        const status = dgmSystem.getSystemStatus();
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(chalk.cyan(`[${timestamp}] Health: ${status.systemHealth.toFixed(1)}% | Patterns: ${status.archivedPatterns} | Recommendations: ${status.activeRecommendations.length}`));
      }, parseInt(options.interval) * 1000);
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Stopping monitoring...'));
        clearInterval(interval);
        await dgmSystem.stop();
        console.log(chalk.green('✅ Monitoring stopped'));
        process.exit(0);
      });
      
      // Keep process alive
      setInterval(() => {}, 1000);
      
    } catch (error) {
      console.error(chalk.red(`❌ Monitoring failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async handleForceEvolution(options: any): Promise<void> {
    const spinner = ora(`Forcing evolution for ${options.category}...`).start();
    
    try {
      const dgmSystem = createDGMSystem(options.projectPath);
      await dgmSystem.initialize();
      await dgmSystem.start();
      
      // Access the autonomous monitor to force evolution
      // This is for testing purposes
      spinner.text = 'Triggering evolution...';
      
      // Simulate forced evolution by executing a manual cycle with specific targets
      const report = await dgmSystem.executeEvolutionCycle();
      
      spinner.succeed('Forced evolution completed');
      
      console.log(chalk.green('\n🧪 Forced Evolution Results'));
      console.log(chalk.yellow(`📂 Category: ${options.category}`));
      console.log(chalk.cyan(`📊 Strategies: ${report.strategiesEvaluated}`));
      console.log(chalk.blue(`✨ Improvement: ${report.fitnessImprovement > 0 ? '+' : ''}${report.fitnessImprovement.toFixed(3)}`));
      console.log(chalk.magenta(`📈 Status: ${report.status}`));
      
      await dgmSystem.stop();
      
    } catch (error) {
      spinner.fail('Forced evolution failed');
      console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }
}
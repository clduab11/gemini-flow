/**
 * Gemini Command Module
 * 
 * Standalone command for Gemini CLI integration and context management
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../../utils/logger.js';
import { GeminiIntegrationService } from '../../services/gemini-integration.js';

export class GeminiCommand extends Command {
  private logger: Logger;
  private integrationService: GeminiIntegrationService;

  constructor() {
    super('gemini');
    this.logger = new Logger('GeminiCommand');
    this.integrationService = GeminiIntegrationService.getInstance();
    
    this
      .description('Gemini CLI integration and context management')
      .addCommand(this.createDetectCommand())
      .addCommand(this.createContextCommand())
      .addCommand(this.createStatusCommand())
      .addCommand(this.createSetupCommand());
  }

  private createDetectCommand(): Command {
    return new Command('detect')
      .description('Detect official Gemini CLI installation')
      .option('--verbose', 'Show detailed detection information')
      .action(async (options) => {
        const spinner = ora('Detecting Gemini CLI...').start();

        try {
          const result = await this.integrationService.detectGeminiCLI();

          if (result.isInstalled) {
            spinner.succeed('Gemini CLI detected');
            
            console.log(chalk.green('\n✅ Gemini CLI Found:'));
            console.log(chalk.blue('  Path:'), result.path);
            
            if (result.version) {
              console.log(chalk.blue('  Version:'), result.version);
            }
            
            if (result.error && options.verbose) {
              console.log(chalk.yellow('  Warning:'), result.error);
            }

          } else {
            spinner.fail('Gemini CLI not detected');
            
            console.log(chalk.red('\n❌ Gemini CLI Not Found'));
            
            if (result.error && options.verbose) {
              console.log(chalk.gray('  Error:'), result.error);
            }
            
            console.log(chalk.yellow('\n💡 Installation Help:'));
            console.log('  Visit: https://ai.google.dev/gemini-api/docs/quickstart');
            console.log('  Or run: npm install -g @google-ai/generativelanguage');
          }

        } catch (error) {
          spinner.fail('Detection failed');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  private createContextCommand(): Command {
    return new Command('context')
      .description('Manage GEMINI.md context loading')
      .option('--reload', 'Force reload context from disk')
      .option('--path <path>', 'Specify custom project root path')
      .option('--show', 'Display loaded context content')
      .action(async (options) => {
        const spinner = ora('Loading GEMINI.md context...').start();

        try {
          if (options.reload) {
            this.integrationService.clearCache();
          }

          const context = await this.integrationService.loadGeminiContext(options.path);

          if (context.loaded) {
            spinner.succeed('Context loaded successfully');
            
            console.log(chalk.green('\n✅ GEMINI.md Context:'));
            console.log(chalk.blue('  Source:'), context.source);
            console.log(chalk.blue('  Size:'), `${context.content.length} characters`);
            console.log(chalk.blue('  Loaded:'), context.timestamp.toISOString());

            if (options.show) {
              console.log(chalk.yellow('\n📄 Context Content:'));
              console.log(chalk.gray('─'.repeat(50)));
              console.log(context.content.substring(0, 1000));
              
              if (context.content.length > 1000) {
                console.log(chalk.gray('\n... (truncated, showing first 1000 characters)'));
              }
              console.log(chalk.gray('─'.repeat(50)));
            }

          } else {
            spinner.warn('Context loaded with warnings');
            
            console.log(chalk.yellow('\n⚠️  Context Loaded (Fallback):'));
            console.log(chalk.blue('  Source:'), context.source);
            console.log(chalk.gray('  GEMINI.md not found, using default context'));
          }

        } catch (error) {
          spinner.fail('Context loading failed');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  private createStatusCommand(): Command {
    return new Command('status')
      .description('Show comprehensive Gemini integration status')
      .option('--json', 'Output status as JSON')
      .action(async (options) => {
        const spinner = ora('Checking integration status...').start();

        try {
          const status = await this.integrationService.getIntegrationStatus();
          
          spinner.succeed('Status check complete');

          if (options.json) {
            console.log(JSON.stringify(status, null, 2));
            return;
          }

          console.log(chalk.blue('\n🔍 Gemini Integration Status:\n'));

          // CLI Detection Status
          const cliStatus = status.cliDetected ? chalk.green('✅ Detected') : chalk.red('❌ Not Found');
          console.log(chalk.blue('CLI Detection:'), cliStatus);
          
          if (status.geminiVersion) {
            console.log(chalk.blue('CLI Version:'), status.geminiVersion);
          }

          // Context Loading Status
          const contextStatus = status.contextLoaded ? chalk.green('✅ Loaded') : chalk.red('❌ Failed');
          console.log(chalk.blue('Context Loading:'), contextStatus);
          
          if (status.contextSource) {
            console.log(chalk.blue('Context Source:'), status.contextSource);
          }

          // Environment Configuration
          const envStatus = status.environmentConfigured ? chalk.green('✅ Configured') : chalk.red('❌ Not Set');
          console.log(chalk.blue('Environment:'), envStatus);

          // Environment Variables
          if (status.environmentConfigured) {
            console.log(chalk.yellow('\n🔧 Environment Variables:'));
            console.log(chalk.gray('  GEMINI_FLOW_CONTEXT_LOADED:'), process.env.GEMINI_FLOW_CONTEXT_LOADED);
            console.log(chalk.gray('  GEMINI_FLOW_MODE:'), process.env.GEMINI_FLOW_MODE);
            console.log(chalk.gray('  GEMINI_MODEL:'), process.env.GEMINI_MODEL);
          }

          // Integration Readiness
          const allReady = status.cliDetected && status.contextLoaded && status.environmentConfigured;
          
          console.log(chalk.blue('\nIntegration Ready:'), allReady ? chalk.green('✅ Yes') : chalk.yellow('⚠️  Partial'));

          if (!allReady) {
            console.log(chalk.yellow('\n💡 Recommendations:'));
            
            if (!status.cliDetected) {
              console.log('  • Install official Gemini CLI for enhanced features');
            }
            
            if (!status.contextLoaded) {
              console.log('  • Create GEMINI.md file in project root for context loading');
            }
            
            if (!status.environmentConfigured) {
              console.log('  • Run with --gemini flag to configure environment');
            }
          }

        } catch (error) {
          spinner.fail('Status check failed');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }

  private createSetupCommand(): Command {
    return new Command('setup')
      .description('Initialize complete Gemini integration')
      .option('--path <path>', 'Specify project root path')
      .option('--force', 'Force setup even if already configured')
      .action(async (options) => {
        const spinner = ora('Setting up Gemini integration...').start();

        try {
          const result = await this.integrationService.initialize(options.path);

          spinner.succeed('Gemini integration setup complete');

          console.log(chalk.green('\n🎯 Setup Results:\n'));

          // CLI Detection
          console.log(chalk.blue('CLI Detection:'));
          if (result.detection.isInstalled) {
            console.log(chalk.green('  ✅ Gemini CLI found'));
            if (result.detection.version) {
              console.log(`  📦 Version: ${result.detection.version}`);
            }
          } else {
            console.log(chalk.yellow('  ⚠️  Gemini CLI not found (optional)'));
          }

          // Context Loading
          console.log(chalk.blue('\nContext Loading:'));
          if (result.context.loaded) {
            console.log(chalk.green('  ✅ GEMINI.md loaded successfully'));
            console.log(`  📄 Source: ${result.context.source}`);
            console.log(`  📏 Size: ${result.context.content.length} characters`);
          } else {
            console.log(chalk.yellow('  ⚠️  Using fallback context'));
          }

          // Environment Configuration
          console.log(chalk.blue('\nEnvironment:'));
          if (result.environmentConfigured) {
            console.log(chalk.green('  ✅ Environment variables configured'));
            console.log(chalk.gray('    GEMINI_FLOW_CONTEXT_LOADED=true'));
            console.log(chalk.gray('    GEMINI_FLOW_MODE=enhanced'));
            console.log(chalk.gray('    GEMINI_MODEL=gemini-1.5-flash'));
          } else {
            console.log(chalk.red('  ❌ Environment configuration failed'));
          }

          console.log(chalk.cyan('\n🚀 Integration Ready!'));
          console.log(chalk.gray('Use --gemini flag with any command for enhanced AI coordination.'));

        } catch (error) {
          spinner.fail('Setup failed');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      });
  }
}

export default GeminiCommand;
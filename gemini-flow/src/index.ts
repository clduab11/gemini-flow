#!/usr/bin/env node
/**
 * Gemini-Flow v2.0.0
 * AI orchestration platform powered by Google Gemini
 * 
 * Entry point for the Gemini-Flow CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SwarmCommand } from './commands/swarm.js';
import { AgentCommand } from './commands/agent.js';
import { TaskCommand } from './commands/task.js';
import { SparcCommand } from './commands/sparc.js';
import { ConfigCommand } from './commands/config.js';
import { WorkspaceCommand } from './commands/workspace.js';
import { version } from '../package.json' assert { type: 'json' };

const program = new Command();

// ASCII art banner
const banner = chalk.cyan(`
╔═══════════════════════════════════════════╗
║       🌟 Gemini-Flow v${version} 🌟       ║
║   AI Orchestration Powered by Google      ║
╚═══════════════════════════════════════════╝
`);

program
  .name('gemini-flow')
  .description('AI orchestration platform with 64 specialized agents')
  .version(version)
  .addHelpText('before', banner);

// Add command modules
program.addCommand(new SwarmCommand());
program.addCommand(new AgentCommand());
program.addCommand(new TaskCommand());
program.addCommand(new SparcCommand());
program.addCommand(new ConfigCommand());
program.addCommand(new WorkspaceCommand());

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--agents <number>', 'Number of agents to spawn', parseInt)
  .option('--parallel', 'Enable parallel execution')
  .option('--no-cache', 'Disable context caching')
  .option('--profile <name>', 'Use configuration profile');

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
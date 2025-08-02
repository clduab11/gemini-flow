/**
 * Workspace Command Module
 * Workspace and project management for Gemini Flow
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Logger } from '../../utils/logger.js';
import { ConfigManager } from '../config/config-manager.js';

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  type: 'project' | 'template' | 'experiment';
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  tags: string[];
  createdAt: Date;
  lastModified: Date;
  settings: Record<string, any>;
}

export class WorkspaceCommand extends Command {
  private logger: Logger;
  private configManager: ConfigManager;

  private readonly workspaceTypes: Record<string, { description: string; template: string }> = {
    'project': { description: 'Standard development project', template: 'standard' },
    'template': { description: 'Reusable project template', template: 'template' },
    'experiment': { description: 'Experimental or research project', template: 'experiment' },
    'api': { description: 'API development project', template: 'api' },
    'frontend': { description: 'Frontend application', template: 'frontend' },
    'fullstack': { description: 'Full-stack application', template: 'fullstack' },
    'microservice': { description: 'Microservice project', template: 'microservice' },
    'ml': { description: 'Machine learning project', template: 'ml' }
  };

  constructor(configManager: ConfigManager) {
    super('workspace');
    this.configManager = configManager;
    this.logger = new Logger('WorkspaceCommand');
    
    this
      .description('Manage workspaces and projects')
      .addCommand(this.createInitCommand())
      .addCommand(this.createListCommand())
      .addCommand(this.createSwitchCommand())
      .addCommand(this.createInfoCommand())
      .addCommand(this.createDeleteCommand())
      .addCommand(this.createArchiveCommand())
      .addCommand(this.createCloneCommand())
      .addCommand(this.createTemplateCommand())
      .addCommand(this.createSettingsCommand());
  }

  private createInitCommand(): Command {
    const init = new Command('init');
    
    init
      .description('Initialize new workspace')
      .argument('[name]', 'Workspace name')
      .option('-t, --type <type>', 'Workspace type (project|template|experiment|api|frontend|fullstack|microservice|ml)')
      .option('-p, --path <path>', 'Workspace path')
      .option('--template <template>', 'Template to use')
      .option('--interactive', 'Interactive workspace creation')
      .option('--git', 'Initialize git repository')
      .option('--no-install', 'Skip dependency installation')
      .action(async (name, options) => {
        const spinner = ora('Initializing workspace...').start();
        
        try {
          let workspaceConfig;
          
          if (options.interactive || !name) {
            spinner.stop();
            workspaceConfig = await this.interactiveWorkspaceCreation(name, options);
            spinner.start('Creating workspace...');
          } else {
            workspaceConfig = await this.buildWorkspaceConfig(name, options);
          }
          
          // Create workspace structure
          const workspace = await this.createWorkspace(workspaceConfig);
          
          // Initialize workspace files
          spinner.text = 'Setting up workspace files...';
          await this.initializeWorkspaceFiles(workspace);
          
          // Install dependencies if requested
          if (!options.noInstall) {
            spinner.text = 'Installing dependencies...';
            await this.installDependencies(workspace);
          }
          
          // Initialize git repository if requested
          if (options.git) {
            spinner.text = 'Initializing git repository...';
            await this.initializeGitRepository(workspace);
          }
          
          spinner.succeed(chalk.green(`Workspace "${workspace.name}" created successfully!`));
          
          // Display workspace information
          this.displayWorkspaceInfo(workspace);
          
        } catch (error: any) {
          spinner.fail(chalk.red('Failed to initialize workspace'));
          this.logger.error('Workspace init failed:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return init;
  }

  private createListCommand(): Command {
    const list = new Command('list');
    
    list
      .description('List all workspaces')
      .option('--type <type>', 'Filter by workspace type')
      .option('--status <status>', 'Filter by status (active|inactive|archived)')
      .option('--format <format>', 'Output format (table|json|yaml)', 'table')
      .option('--sort <field>', 'Sort by field (name|type|modified)', 'name')
      .action(async (options) => {
        try {
          const workspaces = await this.listWorkspaces(options);
          this.displayWorkspaceList(workspaces, options);
        } catch (error: any) {
          this.logger.error('Failed to list workspaces:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return list;
  }

  private createSwitchCommand(): Command {
    const switchCmd = new Command('switch');
    
    switchCmd
      .description('Switch to workspace')
      .argument('<name>', 'Workspace name or ID')
      .option('--create', 'Create workspace if it doesn\'t exist')
      .action(async (name, options) => {
        const spinner = ora('Switching workspace...').start();
        
        try {
          const workspace = await this.switchWorkspace(name, options);
          spinner.succeed(chalk.green(`Switched to workspace "${workspace.name}"`));
          this.displayWorkspaceInfo(workspace);
        } catch (error: any) {
          spinner.fail(chalk.red('Failed to switch workspace'));
          this.logger.error('Workspace switch failed:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return switchCmd;
  }

  private createInfoCommand(): Command {
    const info = new Command('info');
    
    info
      .description('Show workspace information')
      .argument('[name]', 'Workspace name (current if not specified)')
      .option('--detailed', 'Show detailed information')
      .option('--settings', 'Show workspace settings')
      .action(async (name, options) => {
        try {
          const workspace = await this.getWorkspaceInfo(name);
          this.displayDetailedWorkspaceInfo(workspace, options);
        } catch (error: any) {
          this.logger.error('Failed to get workspace info:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return info;
  }

  private createDeleteCommand(): Command {
    const deleteCmd = new Command('delete');
    
    deleteCmd
      .description('Delete workspace')
      .argument('<name>', 'Workspace name or ID')
      .option('--force', 'Force deletion without confirmation')
      .option('--keep-files', 'Keep workspace files')
      .action(async (name, options) => {
        try {
          if (!options.force) {
            const { confirm } = await inquirer.prompt([{
              type: 'confirm',
              name: 'confirm',
              message: `Delete workspace "${name}"?`,
              default: false
            }]);
            
            if (!confirm) {
              console.log(chalk.yellow('Deletion cancelled'));
              return;
            }
          }

          const spinner = ora('Deleting workspace...').start();
          await this.deleteWorkspace(name, options);
          spinner.succeed(chalk.green(`Workspace "${name}" deleted`));
          
        } catch (error: any) {
          this.logger.error('Failed to delete workspace:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return deleteCmd;
  }

  private createArchiveCommand(): Command {
    const archive = new Command('archive');
    
    archive
      .description('Archive/unarchive workspace')
      .argument('<name>', 'Workspace name or ID')
      .option('--unarchive', 'Unarchive workspace')
      .action(async (name, options) => {
        const spinner = ora(options.unarchive ? 'Unarchiving workspace...' : 'Archiving workspace...').start();
        
        try {
          await this.archiveWorkspace(name, !options.unarchive);
          const action = options.unarchive ? 'unarchived' : 'archived';
          spinner.succeed(chalk.green(`Workspace "${name}" ${action}`));
        } catch (error: any) {
          spinner.fail(chalk.red('Archive operation failed'));
          this.logger.error('Archive failed:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return archive;
  }

  private createCloneCommand(): Command {
    const clone = new Command('clone');
    
    clone
      .description('Clone workspace')
      .argument('<source>', 'Source workspace name')
      .argument('<target>', 'Target workspace name')
      .option('--type <type>', 'Override workspace type')
      .option('--no-files', 'Clone metadata only')
      .action(async (source, target, options) => {
        const spinner = ora('Cloning workspace...').start();
        
        try {
          const clonedWorkspace = await this.cloneWorkspace(source, target, options);
          spinner.succeed(chalk.green(`Workspace cloned as "${clonedWorkspace.name}"`));
          this.displayWorkspaceInfo(clonedWorkspace);
        } catch (error: any) {
          spinner.fail(chalk.red('Clone failed'));
          this.logger.error('Clone error:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return clone;
  }

  private createTemplateCommand(): Command {
    const template = new Command('template');
    
    template
      .description('Workspace template management')
      .addCommand(this.createTemplateListCommand())
      .addCommand(this.createTemplateCreateCommand())
      .addCommand(this.createTemplateDeleteCommand());
    
    return template;
  }

  private createTemplateListCommand(): Command {
    const list = new Command('list');
    list
      .description('List available templates')
      .action(async () => {
        this.displayAvailableTemplates();
      });
    return list;
  }

  private createTemplateCreateCommand(): Command {
    const create = new Command('create');
    create
      .description('Create template from workspace')
      .argument('<workspace>', 'Source workspace')
      .argument('<template>', 'Template name')
      .action(async (workspace, template) => {
        const spinner = ora('Creating template...').start();
        try {
          await this.createTemplate(workspace, template);
          spinner.succeed(chalk.green(`Template "${template}" created`));
        } catch (error: any) {
          spinner.fail(chalk.red('Template creation failed'));
          console.error(chalk.red('Error:'), error.message);
        }
      });
    return create;
  }

  private createTemplateDeleteCommand(): Command {
    const deleteCmd = new Command('delete');
    deleteCmd
      .description('Delete template')
      .argument('<template>', 'Template name')
      .action(async (template) => {
        await this.deleteTemplate(template);
        console.log(chalk.green(`Template "${template}" deleted`));
      });
    return deleteCmd;
  }

  private createSettingsCommand(): Command {
    const settings = new Command('settings');
    
    settings
      .description('Manage workspace settings')
      .argument('[workspace]', 'Workspace name (current if not specified)')
      .option('--set <key=value>', 'Set setting value')
      .option('--get <key>', 'Get setting value')
      .option('--list', 'List all settings')
      .action(async (workspace, options) => {
        try {
          if (options.set) {
            await this.setWorkspaceSetting(workspace, options.set);
          } else if (options.get) {
            await this.getWorkspaceSetting(workspace, options.get);
          } else if (options.list) {
            await this.listWorkspaceSettings(workspace);
          } else {
            console.log(chalk.yellow('Specify --set, --get, or --list'));
          }
        } catch (error: any) {
          this.logger.error('Settings operation failed:', error);
          console.error(chalk.red('Error:'), error.message);
          process.exit(1);
        }
      });
    
    return settings;
  }

  // Helper methods
  private async interactiveWorkspaceCreation(name?: string, options?: any): Promise<any> {
    const questions = [];
    
    if (!name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Workspace name:',
        validate: (input: string) => input.length > 0 || 'Name is required'
      });
    }

    questions.push(
      {
        type: 'list',
        name: 'type',
        message: 'Workspace type:',
        choices: Object.entries(this.workspaceTypes).map(([type, info]) => ({
          name: `${type} - ${info.description}`,
          value: type
        })),
        default: 'project'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):'
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Initialize git repository?',
        default: true
      }
    );

    const answers = await inquirer.prompt(questions);
    return { ...options, name: name || answers.name, ...answers };
  }

  private async buildWorkspaceConfig(name: string, options: any): Promise<any> {
    return {
      name,
      type: options.type || 'project',
      path: options.path || `./${name}`,
      template: options.template,
      description: options.description
    };
  }

  private async createWorkspace(config: any): Promise<WorkspaceInfo> {
    // Placeholder implementation
    const workspace: WorkspaceInfo = {
      id: `ws-${Date.now()}`,
      name: config.name,
      path: config.path,
      type: config.type,
      status: 'active',
      description: config.description,
      tags: [],
      createdAt: new Date(),
      lastModified: new Date(),
      settings: {}
    };

    this.logger.info(`Created workspace: ${workspace.name}`);
    return workspace;
  }

  private async initializeWorkspaceFiles(_workspace: WorkspaceInfo): Promise<void> {
    // Placeholder for file initialization
  }

  private async installDependencies(_workspace: WorkspaceInfo): Promise<void> {
    // Placeholder for dependency installation
  }

  private async initializeGitRepository(_workspace: WorkspaceInfo): Promise<void> {
    // Placeholder for git initialization
  }

  private displayWorkspaceInfo(workspace: WorkspaceInfo): void {
    console.log('\n' + chalk.cyan('📁 Workspace Information:'));
    console.log(chalk.white(`   Name: ${workspace.name}`));
    console.log(chalk.gray(`   Type: ${workspace.type}`));
    console.log(chalk.gray(`   Path: ${workspace.path}`));
    console.log(chalk.gray(`   Status: ${workspace.status}`));
    if (workspace.description) {
      console.log(chalk.gray(`   Description: ${workspace.description}`));
    }
    console.log('');
  }

  private displayDetailedWorkspaceInfo(workspace: WorkspaceInfo, _options: any): void {
    this.displayWorkspaceInfo(workspace);
    // Additional detailed information display
  }

  private displayAvailableTemplates(): void {
    console.log(chalk.cyan('\n📋 Available Workspace Templates:\n'));
    
    for (const [type, info] of Object.entries(this.workspaceTypes)) {
      console.log(chalk.white(`  ${type.padEnd(15)} - ${info.description}`));
    }
    console.log('');
  }

  // Placeholder methods
  private async listWorkspaces(_options: any): Promise<WorkspaceInfo[]> {
    return [];
  }

  private displayWorkspaceList(workspaces: WorkspaceInfo[], _options: any): void {
    console.log(chalk.cyan('📁 Workspaces:'));
    if (workspaces.length === 0) {
      console.log(chalk.gray('   No workspaces found'));
    }
  }

  private async switchWorkspace(name: string, _options: any): Promise<WorkspaceInfo> {
    return { id: 'ws-1', name, path: '.', type: 'project', status: 'active', tags: [], createdAt: new Date(), lastModified: new Date(), settings: {} };
  }

  private async getWorkspaceInfo(_name?: string): Promise<WorkspaceInfo> {
    return { id: 'ws-1', name: 'current', path: '.', type: 'project', status: 'active', tags: [], createdAt: new Date(), lastModified: new Date(), settings: {} };
  }

  private async deleteWorkspace(_name: string, _options: any): Promise<void> {
    // Placeholder
  }

  private async archiveWorkspace(_name: string, _archive: boolean): Promise<void> {
    // Placeholder
  }

  private async cloneWorkspace(source: string, target: string, _options: any): Promise<WorkspaceInfo> {
    return { id: 'ws-2', name: target, path: `./${target}`, type: 'project', status: 'active', tags: [], createdAt: new Date(), lastModified: new Date(), settings: {} };
  }

  private async createTemplate(_workspace: string, _template: string): Promise<void> {
    // Placeholder
  }

  private async deleteTemplate(_template: string): Promise<void> {
    // Placeholder
  }

  private async setWorkspaceSetting(_workspace: string, _setting: string): Promise<void> {
    // Placeholder
  }

  private async getWorkspaceSetting(_workspace: string, _key: string): Promise<void> {
    // Placeholder
  }

  private async listWorkspaceSettings(_workspace: string): Promise<void> {
    // Placeholder
  }
}
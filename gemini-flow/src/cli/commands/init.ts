/**
 * Init Command Module
 * Initialize Gemini-Flow in a project directory
 */

import { Command } from 'commander';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Logger } from '../../utils/logger.js';
import { ConfigManager } from '../config/config-manager.js';

export class InitCommand extends Command {
  private logger: Logger;
  private _configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    super('init');
    this._configManager = configManager;
    this.logger = new Logger('InitCommand');
    
    this
      .description('Initialize Gemini-Flow in the current directory')
      .option('-f, --force', 'Force initialization even if directory is not empty')
      .option('-t, --template <name>', 'Use a specific project template')
      .option('--skip-git', 'Skip git repository initialization')
      .option('--skip-install', 'Skip dependency installation')
      .option('--interactive', 'Interactive setup with prompts')
      .action(this.execute.bind(this));
  }

  private async execute(options: any): Promise<void> {
    const spinner = ora('Initializing Gemini-Flow project...').start();
    
    try {
      const currentDir = process.cwd();
      this.logger.info(`Initializing project in: ${currentDir}`);

      // Check if directory is already initialized
      if (!options.force) {
        await this.checkExistingProject(currentDir);
      }

      // Interactive setup if requested
      let projectConfig;
      if (options.interactive) {
        spinner.stop();
        projectConfig = await this.interactiveSetup();
        spinner.start('Creating project structure...');
      } else {
        projectConfig = this.getDefaultProjectConfig();
      }

      // Create project structure
      await this.createProjectStructure(currentDir, projectConfig);
      
      // Create configuration files
      await this.createConfigFiles(currentDir, projectConfig);

      // Initialize git repository
      if (!options.skipGit) {
        spinner.text = 'Initializing git repository...';
        await this.initializeGit(currentDir);
      }

      // Install dependencies
      if (!options.skipInstall) {
        spinner.text = 'Installing dependencies...';
        await this.installDependencies(currentDir);
      }

      spinner.succeed(chalk.green('Gemini-Flow project initialized successfully!'));

      // Display next steps
      this.displayNextSteps(projectConfig);

    } catch (error: any) {
      spinner.fail(chalk.red('Failed to initialize project'));
      this.logger.error('Initialization failed:', error);
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  private async checkExistingProject(directory: string): Promise<void> {
    try {
      await access(join(directory, '.gemini-flow'));
      throw new Error('Directory already contains a Gemini-Flow project. Use --force to reinitialize.');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory is clean, continue
    }
  }

  private async interactiveSetup(): Promise<any> {
    console.log(chalk.cyan('\n🚀 Gemini-Flow Interactive Setup\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-gemini-flow-project'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'AI-powered project using Gemini-Flow'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose a project template:',
        choices: [
          { name: 'Basic - Simple swarm setup', value: 'basic' },
          { name: 'Full-Stack - Complete application template', value: 'fullstack' },
          { name: 'Research - Data analysis and research', value: 'research' },
          { name: 'Custom - Minimal setup', value: 'custom' }
        ],
        default: 'basic'
      },
      {
        type: 'list',
        name: 'topology',
        message: 'Default swarm topology:',
        choices: ['hierarchical', 'mesh', 'ring', 'star'],
        default: 'hierarchical'
      },
      {
        type: 'number',
        name: 'maxAgents',
        message: 'Maximum number of agents:',
        default: 8,
        validate: (input) => input > 0 && input <= 64
      },
      {
        type: 'confirm',
        name: 'enableGoogleAuth',
        message: 'Enable Google Cloud authentication?',
        default: true
      },
      {
        type: 'input',
        name: 'googleProjectId',
        message: 'Google Cloud Project ID:',
        when: (answers) => answers.enableGoogleAuth,
        validate: (input) => input.length > 0 || 'Project ID is required'
      }
    ]);

    return answers;
  }

  private getDefaultProjectConfig(): any {
    return {
      projectName: 'gemini-flow-project',
      description: 'AI-powered project using Gemini-Flow',
      template: 'basic',
      topology: 'hierarchical',
      maxAgents: 8,
      enableGoogleAuth: false
    };
  }

  private async createProjectStructure(directory: string, config: any): Promise<void> {
    const directories = [
      '.gemini-flow',
      '.gemini-flow/agents',
      '.gemini-flow/swarms', 
      '.gemini-flow/cache',
      '.gemini-flow/logs',
      'src',
      'tests',
      'docs',
      'scripts'
    ];

    // Add template-specific directories
    if (config.template === 'fullstack') {
      directories.push('src/api', 'src/web', 'src/shared');
    } else if (config.template === 'research') {
      directories.push('data', 'notebooks', 'reports');
    }

    for (const dir of directories) {
      await mkdir(join(directory, dir), { recursive: true });
    }
  }

  private async createConfigFiles(directory: string, config: any): Promise<void> {
    // Create .gemini-flow/config.json
    const projectConfig = {
      name: config.projectName,
      description: config.description,
      version: '1.0.0',
      template: config.template,
      swarm: {
        defaultTopology: config.topology,
        maxAgents: config.maxAgents
      },
      google: {
        projectId: config.googleProjectId || null,
        enabled: config.enableGoogleAuth || false
      },
      agents: {
        autoSpawn: true,
        types: ['coder', 'researcher', 'tester', 'reviewer', 'planner']
      }
    };

    await writeFile(
      join(directory, '.gemini-flow', 'config.json'),
      JSON.stringify(projectConfig, null, 2)
    );

    // Create package.json if it doesn't exist
    try {
      await access(join(directory, 'package.json'));
    } catch {
      const packageJson = {
        name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: config.description,
        main: 'src/index.js',
        scripts: {
          'dev': 'gemini-flow sparc run dev',
          'build': 'gemini-flow sparc run build',
          'test': 'gemini-flow sparc run test',
          'deploy': 'gemini-flow sparc run deploy',
          'swarm:init': 'gemini-flow swarm init',
          'agents:spawn': 'gemini-flow agent spawn --count 5'
        },
        keywords: ['gemini-flow', 'ai', 'automation'],
        author: '',
        license: 'MIT',
        dependencies: {
          'gemini-flow': '^2.0.0'
        }
      };

      await writeFile(
        join(directory, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }

    // Create .gitignore
    const gitignore = `
# Gemini-Flow
.gemini-flow/cache/
.gemini-flow/logs/
.gemini-flow/temp/
*.log

# Dependencies
node_modules/
.pnpm-debug.log*

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.tsbuildinfo
`;

    await writeFile(join(directory, '.gitignore'), gitignore.trim());

    // Create README.md
    const readme = `# ${config.projectName}

${config.description}

## Getting Started

This project is powered by Gemini-Flow, an AI orchestration platform with intelligent agent swarms.

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Project (for AI features)

### Installation

\`\`\`bash
npm install
\`\`\`

### Configuration

1. Set up Google Cloud credentials:
\`\`\`bash
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
\`\`\`

2. Initialize swarm:
\`\`\`bash
npm run swarm:init
\`\`\`

3. Spawn agents:
\`\`\`bash
npm run agents:spawn
\`\`\`

### Usage

#### Development Mode
\`\`\`bash
npm run dev
\`\`\`

#### Build Project
\`\`\`bash
npm run build
\`\`\`

#### Run Tests
\`\`\`bash
npm run test
\`\`\`

## Gemini-Flow Commands

- \`gemini-flow swarm init\` - Initialize agent swarm
- \`gemini-flow agent spawn\` - Spawn AI agents
- \`gemini-flow sparc run <mode>\` - Run SPARC methodology
- \`gemini-flow hive-mind sync\` - Sync collective intelligence

## Project Structure

\`\`\`
${config.projectName}/
├── .gemini-flow/          # Gemini-Flow configuration
├── src/                   # Source code
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/               # Build scripts
\`\`\`

## License

MIT
`;

    await writeFile(join(directory, 'README.md'), readme);

    // Create example files based on template
    if (config.template === 'basic') {
      await this.createBasicTemplate(directory);
    } else if (config.template === 'fullstack') {
      await this.createFullStackTemplate(directory);
    } else if (config.template === 'research') {
      await this.createResearchTemplate(directory);
    }
  }

  private async createBasicTemplate(directory: string): Promise<void> {
    const indexJs = `/**
 * Gemini-Flow Basic Project
 * Entry point for AI-powered automation
 */

import { GeminiFlow } from 'gemini-flow';

async function main() {
  const flow = new GeminiFlow();
  
  // Initialize swarm
  await flow.swarm.init({
    topology: 'hierarchical',
    agents: 5
  });
  
  // Orchestrate task
  const result = await flow.orchestrate('Build a simple web server');
  
  console.log('Task completed:', result);
}

main().catch(console.error);
`;

    await writeFile(join(directory, 'src', 'index.js'), indexJs);
  }

  private async createFullStackTemplate(directory: string): Promise<void> {
    // API entry point
    const apiIndex = `/**
 * API Server powered by Gemini-Flow
 */

import express from 'express';
import { GeminiFlow } from 'gemini-flow';

const app = express();
const flow = new GeminiFlow();

app.use(express.json());

app.post('/api/orchestrate', async (req, res) => {
  try {
    const { task } = req.body;
    const result = await flow.orchestrate(task);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

    await writeFile(join(directory, 'src', 'api', 'index.js'), apiIndex);

    // Web client
    const webIndex = `<!DOCTYPE html>
<html>
<head>
    <title>Gemini-Flow Web Interface</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <h1>Gemini-Flow Web Interface</h1>
    <div id="app">
        <textarea id="taskInput" placeholder="Enter your task..."></textarea>
        <button onclick="orchestrateTask()">Execute</button>
        <div id="result"></div>
    </div>
    
    <script>
        async function orchestrateTask() {
            const task = document.getElementById('taskInput').value;
            const response = await fetch('/api/orchestrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task })
            });
            
            const result = await response.json();
            document.getElementById('result').innerText = JSON.stringify(result, null, 2);
        }
    </script>
</body>
</html>`;

    await writeFile(join(directory, 'src', 'web', 'index.html'), webIndex);
  }

  private async createResearchTemplate(directory: string): Promise<void> {
    const researchScript = `/**
 * Research Analysis with Gemini-Flow
 */

import { GeminiFlow } from 'gemini-flow';
import { writeFileSync } from 'fs';

async function runResearch() {
  const flow = new GeminiFlow();
  
  // Initialize research swarm
  await flow.swarm.init({
    topology: 'mesh',
    agents: ['researcher', 'analyst', 'reporter']
  });
  
  // Conduct research
  const findings = await flow.orchestrate('Research latest AI trends in 2024');
  
  // Generate report
  const report = await flow.agent.spawn('reporter').generate({
    template: 'research-report',
    data: findings
  });
  
  // Save results
  writeFileSync('./reports/research-findings.md', report);
  console.log('Research completed! Report saved to reports/research-findings.md');
}

runResearch().catch(console.error);
`;

    await writeFile(join(directory, 'scripts', 'research.js'), researchScript);
  }

  private async initializeGit(directory: string): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const git = spawn('git', ['init'], { cwd: directory });
      
      git.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Git init failed with code ${code}`));
        }
      });
      
      git.on('error', reject);
    });
  }

  private async installDependencies(directory: string): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], { cwd: directory });
      
      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      
      npm.on('error', reject);
    });
  }

  private displayNextSteps(config: any): void {
    console.log(chalk.cyan('\n🎉 Project initialized successfully!\n'));
    
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('1. Configure Google Cloud credentials:'));
    console.log(chalk.gray('   export GOOGLE_CLOUD_PROJECT_ID="your-project-id"'));
    console.log(chalk.gray('   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"'));
    
    console.log(chalk.gray('\n2. Initialize your swarm:'));
    console.log(chalk.gray('   gemini-flow swarm init'));
    
    console.log(chalk.gray('\n3. Spawn some agents:'));
    console.log(chalk.gray('   gemini-flow agent spawn --count 5'));
    
    console.log(chalk.gray('\n4. Start development:'));
    if (config.template === 'fullstack') {
      console.log(chalk.gray('   npm run dev'));
    } else if (config.template === 'research') {
      console.log(chalk.gray('   npm run research'));
    } else {
      console.log(chalk.gray('   node src/index.js'));
    }
    
    console.log(chalk.gray('\n5. Learn more:'));
    console.log(chalk.gray('   gemini-flow --help'));
    console.log(chalk.gray('   https://github.com/gemini-flow/gemini-flow'));
    
    console.log(chalk.cyan('\nHappy coding with Gemini-Flow! 🚀'));
  }
}
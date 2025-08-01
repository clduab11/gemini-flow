/**
 * Gemini-Flow VSCode Extension
 * 
 * Provides integrated development experience within VSCode
 */

import * as vscode from 'vscode';
import { SwarmManager } from '../src/core/swarm-manager';
import { GeminiFlowProvider } from './providers/gemini-flow-provider';
import { AgentTreeProvider } from './providers/agent-tree-provider';
import { TaskProvider } from './providers/task-provider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Gemini-Flow extension is now active!');

  // Initialize swarm manager
  const swarmManager = new SwarmManager();
  
  // Register tree data providers
  const agentProvider = new AgentTreeProvider(swarmManager);
  const taskProvider = new TaskProvider(swarmManager);
  
  vscode.window.registerTreeDataProvider('geminiFlowAgents', agentProvider);
  vscode.window.registerTreeDataProvider('geminiFlowTasks', taskProvider);

  // Register commands
  
  // Swarm commands
  context.subscriptions.push(
    vscode.commands.registerCommand('geminiFlow.initSwarm', async () => {
      const topology = await vscode.window.showQuickPick(
        ['hierarchical', 'mesh', 'ring', 'star'],
        { placeHolder: 'Select swarm topology' }
      );
      
      if (topology) {
        const agentCount = await vscode.window.showInputBox({
          prompt: 'Number of agents to spawn',
          value: '8',
          validateInput: (value) => {
            const num = parseInt(value);
            return (num > 0 && num <= 64) ? null : 'Enter a number between 1 and 64';
          }
        });
        
        if (agentCount) {
          try {
            const swarm = await swarmManager.initializeSwarm({
              topology,
              maxAgents: parseInt(agentCount)
            });
            
            vscode.window.showInformationMessage(
              `Swarm initialized: ${swarm.id} (${topology} with ${agentCount} agents)`
            );
            
            agentProvider.refresh();
          } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to initialize swarm: ${error.message}`);
          }
        }
      }
    })
  );

  // Agent spawn command
  context.subscriptions.push(
    vscode.commands.registerCommand('geminiFlow.spawnAgent', async () => {
      const agentTypes = [
        'coder', 'planner', 'researcher', 'reviewer', 'tester',
        'hierarchical-coordinator', 'mesh-coordinator', 'adaptive-coordinator'
      ];
      
      const agentType = await vscode.window.showQuickPick(agentTypes, {
        placeHolder: 'Select agent type'
      });
      
      if (agentType) {
        try {
          const agent = await swarmManager.spawnAgent(agentType);
          vscode.window.showInformationMessage(`Agent spawned: ${agent.name} (${agent.type})`);
          agentProvider.refresh();
        } catch (error: any) {
          vscode.window.showErrorMessage(`Failed to spawn agent: ${error.message}`);
        }
      }
    })
  );

  // Task orchestration command
  context.subscriptions.push(
    vscode.commands.registerCommand('geminiFlow.orchestrateTask', async () => {
      const task = await vscode.window.showInputBox({
        prompt: 'Enter task description',
        placeHolder: 'e.g., Build a REST API with authentication'
      });
      
      if (task) {
        try {
          const taskId = await swarmManager.orchestrateTask({
            description: task,
            strategy: 'adaptive'
          });
          
          vscode.window.showInformationMessage(`Task orchestrated: ${taskId}`);
          taskProvider.refresh();
          
          // Show output channel
          const outputChannel = vscode.window.createOutputChannel('Gemini-Flow Task');
          outputChannel.show();
          
          // Monitor task progress
          swarmManager.on(`task:${taskId}:update`, (update) => {
            outputChannel.appendLine(`[${update.timestamp}] ${update.message}`);
          });
          
        } catch (error: any) {
          vscode.window.showErrorMessage(`Failed to orchestrate task: ${error.message}`);
        }
      }
    })
  );

  // SPARC mode command
  context.subscriptions.push(
    vscode.commands.registerCommand('geminiFlow.runSparcMode', async () => {
      const modes = [
        'spec-pseudocode', 'architect', 'tdd', 'refinement', 'integration',
        'dev', 'api', 'ui', 'test', 'refactor', 'security', 'performance'
      ];
      
      const mode = await vscode.window.showQuickPick(modes, {
        placeHolder: 'Select SPARC mode'
      });
      
      if (mode) {
        const task = await vscode.window.showInputBox({
          prompt: 'Enter task for SPARC mode',
          placeHolder: 'e.g., Implement user authentication system'
        });
        
        if (task) {
          try {
            vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: `Running SPARC ${mode} mode...`,
              cancellable: true
            }, async (progress, token) => {
              const result = await swarmManager.runSparcMode(mode, task, {
                cancellationToken: token,
                onProgress: (update) => {
                  progress.report({ message: update.phase, increment: update.progress });
                }
              });
              
              vscode.window.showInformationMessage(`SPARC ${mode} completed!`);
              
              // Open results in new editor
              const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(result, null, 2),
                language: 'json'
              });
              
              vscode.window.showTextDocument(doc);
            });
          } catch (error: any) {
            vscode.window.showErrorMessage(`SPARC mode failed: ${error.message}`);
          }
        }
      }
    })
  );

  // Google Workspace integration
  context.subscriptions.push(
    vscode.commands.registerCommand('geminiFlow.googleWorkspace', async () => {
      const actions = [
        'Search Drive',
        'Create Document',
        'Analyze Spreadsheet',
        'Create Presentation'
      ];
      
      const action = await vscode.window.showQuickPick(actions, {
        placeHolder: 'Select Google Workspace action'
      });
      
      // Implementation for each action
      switch (action) {
        case 'Search Drive':
          const query = await vscode.window.showInputBox({
            prompt: 'Enter search query'
          });
          
          if (query) {
            // Perform search and show results
            vscode.window.showInformationMessage(`Searching Drive for: ${query}`);
          }
          break;
          
        // Additional cases for other actions
      }
    })
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  
  statusBarItem.text = '$(hubot) Gemini-Flow';
  statusBarItem.tooltip = 'Click to view Gemini-Flow status';
  statusBarItem.command = 'geminiFlow.showStatus';
  statusBarItem.show();
  
  context.subscriptions.push(statusBarItem);

  // Show status command
  context.subscriptions.push(
    vscode.commands.registerCommand('geminiFlow.showStatus', async () => {
      const status = await swarmManager.getStatus();
      
      const panel = vscode.window.createWebviewPanel(
        'geminiFlowStatus',
        'Gemini-Flow Status',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );
      
      panel.webview.html = getStatusWebviewContent(status);
    })
  );

  // Configuration watcher
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('geminiFlow')) {
      const config = vscode.workspace.getConfiguration('geminiFlow');
      swarmManager.updateConfiguration(config);
    }
  });
}

export function deactivate() {
  // Cleanup
  console.log('Gemini-Flow extension deactivated');
}

function getStatusWebviewContent(status: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gemini-Flow Status</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
        }
        .status-card {
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        h2 {
          color: var(--vscode-titleBar-activeForeground);
          margin-top: 0;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
        }
        .metric-value {
          color: var(--vscode-textLink-foreground);
          font-weight: bold;
        }
        .agent-list {
          list-style: none;
          padding: 0;
        }
        .agent-item {
          padding: 5px 0;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        .agent-status {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 10px;
        }
        .status-active { background-color: #4caf50; }
        .status-idle { background-color: #ff9800; }
        .status-busy { background-color: #2196f3; }
      </style>
    </head>
    <body>
      <h1>🌟 Gemini-Flow Status</h1>
      
      <div class="status-card">
        <h2>Swarm Overview</h2>
        <div class="metric">
          <span>Active Swarms:</span>
          <span class="metric-value">${status.swarmCount || 0}</span>
        </div>
        <div class="metric">
          <span>Total Agents:</span>
          <span class="metric-value">${status.totalAgents || 0}</span>
        </div>
        <div class="metric">
          <span>Active Tasks:</span>
          <span class="metric-value">${status.activeTasks || 0}</span>
        </div>
        <div class="metric">
          <span>Completed Tasks:</span>
          <span class="metric-value">${status.completedTasks || 0}</span>
        </div>
      </div>
      
      <div class="status-card">
        <h2>Performance Metrics</h2>
        <div class="metric">
          <span>Avg Spawn Time:</span>
          <span class="metric-value">${status.avgSpawnTime || 0}ms</span>
        </div>
        <div class="metric">
          <span>Task Success Rate:</span>
          <span class="metric-value">${status.successRate || 0}%</span>
        </div>
        <div class="metric">
          <span>Memory Usage:</span>
          <span class="metric-value">${status.memoryUsage || 0}MB</span>
        </div>
      </div>
      
      <div class="status-card">
        <h2>Active Agents</h2>
        <ul class="agent-list">
          ${(status.agents || []).map((agent: any) => `
            <li class="agent-item">
              <span class="agent-status status-${agent.status}"></span>
              ${agent.name} (${agent.type})
            </li>
          `).join('')}
        </ul>
      </div>
    </body>
    </html>
  `;
}
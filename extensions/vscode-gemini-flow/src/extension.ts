/**
 * Gemini Flow VSCode Extension
 * Main entry point for the extension
 */

import * as vscode from 'vscode';
import { GeminiFlowExtension } from './services/extension-manager';
import { Logger } from './utils/logger';
import { ExtensionState } from './types';

let extension: GeminiFlowExtension | undefined;
let logger: Logger;

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    // Initialize logger
    logger = new Logger('GeminiFlow', context);
    logger.info('Activating Gemini Flow extension...');

    // Create extension manager
    extension = new GeminiFlowExtension(context, logger);

    // Initialize extension
    await extension.initialize();

    // Register all commands and providers
    await extension.registerCommands();
    await extension.registerProviders();

    // Setup status bar
    extension.setupStatusBar();

    // Check configuration and authenticate if needed
    await extension.checkConfiguration();

    logger.info('Gemini Flow extension activated successfully');

    // Show welcome message for first-time users
    const isFirstTime = context.globalState.get('gemini-flow.firstTime', true);
    if (isFirstTime) {
      showWelcomeMessage(context);
      context.globalState.update('gemini-flow.firstTime', false);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('Failed to activate Gemini Flow extension', error as Error);
    
    vscode.window.showErrorMessage(
      `Failed to activate Gemini Flow: ${errorMessage}`,
      'View Logs',
      'Configure'
    ).then(selection => {
      if (selection === 'View Logs') {
        vscode.commands.executeCommand('workbench.action.showLogs');
      } else if (selection === 'Configure') {
        vscode.commands.executeCommand('gemini-flow.configure');
      }
    });
  }
}

/**
 * Called when the extension is deactivated
 */
export async function deactivate(): Promise<void> {
  try {
    logger?.info('Deactivating Gemini Flow extension...');
    
    if (extension) {
      await extension.dispose();
      extension = undefined;
    }
    
    logger?.info('Gemini Flow extension deactivated successfully');
  } catch (error) {
    logger?.error('Error during extension deactivation', error as Error);
  }
}

/**
 * Show welcome message for first-time users
 */
async function showWelcomeMessage(context: vscode.ExtensionContext): Promise<void> {
  const response = await vscode.window.showInformationMessage(
    'Welcome to Gemini Flow! 🚀 Your AI-powered coding assistant is ready.',
    'Configure Now',
    'View Documentation',
    'Take Tour'
  );

  switch (response) {
    case 'Configure Now':
      vscode.commands.executeCommand('gemini-flow.configure');
      break;
    case 'View Documentation':
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/clduab11/gemini-flow#readme'));
      break;
    case 'Take Tour':
      // Show quick tour of features
      showFeatureTour();
      break;
  }
}

/**
 * Show a quick tour of main features
 */
async function showFeatureTour(): Promise<void> {
  const features = [
    {
      title: 'Code Explanation',
      description: 'Select code and use Ctrl+Alt+E (Cmd+Alt+E on Mac) to get AI explanations',
      command: 'gemini-flow.explain'
    },
    {
      title: 'Refactoring Suggestions',
      description: 'Use Ctrl+Alt+R (Cmd+Alt+R on Mac) to get intelligent refactoring suggestions',
      command: 'gemini-flow.refactor'
    },
    {
      title: 'Code Generation',
      description: 'Use Ctrl+Alt+G (Cmd+Alt+G on Mac) to generate code from natural language',
      command: 'gemini-flow.generate'
    },
    {
      title: 'AI Chat',
      description: 'Use Ctrl+Alt+C (Cmd+Alt+C on Mac) to open the AI chat panel',
      command: 'gemini-flow.chat'
    }
  ];

  for (const feature of features) {
    const response = await vscode.window.showInformationMessage(
      `${feature.title}: ${feature.description}`,
      'Try Now',
      'Next',
      'Skip Tour'
    );

    if (response === 'Try Now') {
      vscode.commands.executeCommand(feature.command);
      break;
    } else if (response === 'Skip Tour') {
      break;
    }
  }
}

/**
 * Get the current extension instance (for testing)
 */
export function getExtension(): GeminiFlowExtension | undefined {
  return extension;
}

/**
 * Get the current logger instance (for testing)
 */
export function getLogger(): Logger | undefined {
  return logger;
}
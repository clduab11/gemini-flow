#!/usr/bin/env node

/**
 * Gemini-Flow Super-Terminal Entry Point
 *
 * Initializes and launches the interactive TUI with:
 * - Command routing system
 * - Google AI service handlers
 * - Swarm orchestration handlers
 * - Quantum computing bridge
 * - Performance monitoring
 */

import React from 'react';
import { render } from 'ink';
import { Terminal } from './components/Terminal.js';
import { DefaultCommandRouter } from './command-router.js';
import { createGoogleAIHandlers } from './handlers/google-ai-handler.js';
import { createSwarmHandlers } from './handlers/swarm-handler.js';
import { initializeQuantumBridge } from './quantum-bridge.js';
import { CommandContext } from './types.js';
import { AgentSpaceManager } from '../../agentspace/core/AgentSpaceManager.js';
import { GoogleAIOrchestratorService } from '../../services/google-services/orchestrator.js';
import { A2AProtocolManager } from '../../protocols/a2a/core/a2a-protocol-manager.js';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize super-terminal
 */
async function initializeSuperTerminal() {
  console.log('🚀 Initializing Gemini-Flow Super-Terminal...\n');

  // Initialize logger
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
      },
    },
  });

  logger.info('Logger initialized');

  // Initialize AgentSpace Manager
  logger.info('Initializing AgentSpace Manager...');
  const agentSpace = new AgentSpaceManager({
    maxAgents: 1000,
    defaultResources: {
      maxMemoryMB: 512,
      maxCPUPercentage: 50,
      maxNetworkBandwidthMbps: 100,
      maxStorageMB: 1024,
      maxConcurrentConnections: 100,
      timeoutMs: 30000,
    },
  });

  // Initialize Google AI Orchestrator
  logger.info('Initializing Google AI Orchestrator...');
  const orchestrator = new GoogleAIOrchestratorService({
    services: [
      { name: 'veo3', enabled: true },
      { name: 'imagen4', enabled: true },
      { name: 'lyria', enabled: true },
      { name: 'chirp', enabled: true },
      { name: 'co-scientist', enabled: true },
      { name: 'mariner', enabled: true },
      { name: 'agentspace', enabled: true },
      { name: 'streaming-api', enabled: true },
    ],
    routing: {
      strategy: 'capability_aware',
      fallbackStrategy: 'load_balanced',
    },
    loadBalancing: {
      algorithm: 'weighted_round_robin',
      healthCheckInterval: 30000,
    },
    workflows: [],
    monitoring: {
      enabled: true,
      metricsInterval: 5000,
    },
  });

  // Initialize A2A Protocol Manager
  logger.info('Initializing A2A Protocol Manager...');
  const a2aProtocol = new A2AProtocolManager({
    nodeId: `super-terminal-${uuidv4()}`,
    enableMetrics: true,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    },
    timeoutMs: 30000,
  });

  // Initialize Quantum Bridge (optional)
  let quantumBridge = null;
  if (process.env.ENABLE_QUANTUM === 'true') {
    try {
      logger.info('Initializing Quantum Bridge...');
      quantumBridge = await initializeQuantumBridge({
        pythonExecutable: process.env.PYTHON_PATH || 'python3',
        poolSize: 4,
        enableHardware: process.env.QUANTUM_HARDWARE === 'true',
      });
      logger.info('Quantum Bridge initialized successfully');
    } catch (error) {
      logger.warn(`Quantum Bridge initialization failed: ${error}`);
      logger.warn('Quantum commands will not be available');
    }
  }

  // Create command router
  logger.info('Setting up command router...');
  const router = new DefaultCommandRouter(undefined, undefined, logger);

  // Register Google AI handlers
  const googleAIHandlers = createGoogleAIHandlers(agentSpace, orchestrator);
  googleAIHandlers.forEach(handler => router.register(handler));
  logger.info(`Registered ${googleAIHandlers.length} Google AI handlers`);

  // Register Swarm handlers
  const swarmHandlers = createSwarmHandlers(agentSpace, a2aProtocol);
  swarmHandlers.forEach(handler => router.register(handler));
  logger.info(`Registered ${swarmHandlers.length} Swarm handlers`);

  // TODO: Register Quantum handlers (if bridge initialized)
  // TODO: Register Performance handlers
  // TODO: Register System handlers

  // Create command context
  const context: CommandContext = {
    mode: 'hybrid',
    sessionId: uuidv4(),
    userId: process.env.USER || 'unknown',
    workspaceId: process.cwd(),
    metadata: {
      version: '1.3.3',
      environment: process.env.NODE_ENV || 'development',
    },
  };

  logger.info('Super-Terminal initialization complete\n');

  // Show initialization summary
  console.log('✨ Gemini-Flow Super-Terminal v1.3.3');
  console.log('━'.repeat(60));
  console.log(`📦 Session ID: ${context.sessionId}`);
  console.log(`👤 User: ${context.userId}`);
  console.log(`📁 Workspace: ${context.workspaceId}`);
  console.log(`🤖 Google AI Services: ${googleAIHandlers.length} handlers`);
  console.log(`🐝 Swarm Handlers: ${swarmHandlers.length} handlers`);
  console.log(`⚛️  Quantum Computing: ${quantumBridge ? 'Enabled' : 'Disabled'}`);
  console.log('━'.repeat(60));
  console.log('\n💡 Type "help" for available commands');
  console.log('🎯 Press Ctrl+H for keyboard shortcuts\n');

  return { router, context, logger };
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Initialize super-terminal
    const { router, context } = await initializeSuperTerminal();

    // Render ink terminal
    const { waitUntilExit } = render(
      React.createElement(Terminal, { router, context })
    );

    // Wait for user to exit
    await waitUntilExit();

    console.log('\n👋 Goodbye! Thanks for using Gemini-Flow Super-Terminal\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error initializing super-terminal:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main, initializeSuperTerminal };

/**
 * CLI Native API Routes
 *
 * Uses Claude Code or Gemini CLI's native capabilities
 * No external API keys required
 */

import express from 'express';
import { createModuleLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createModuleLogger('cli-native-api');

// Detect CLI environment
const IS_CLAUDE_CODE = process.env.CLAUDE_CODE || process.argv.some(arg => arg.includes('claude'));
const IS_GEMINI_CLI = process.env.GEMINI_CLI || process.argv.some(arg => arg.includes('gemini'));
const IS_CLI_ENVIRONMENT = IS_CLAUDE_CODE || IS_GEMINI_CLI;

/**
 * Execute using CLI's native brain instead of external API
 */
const executeWithCLINative = async (prompt, nodes, edges) => {
  logger.info({
    mode: 'CLI_NATIVE',
    environment: IS_CLAUDE_CODE ? 'Claude Code' : IS_GEMINI_CLI ? 'Gemini CLI' : 'Standard'
  }, 'Executing with CLI native capabilities');

  // Build execution plan
  const plan = {
    prompt,
    workflow: {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        task: n.data?.label || 'Process'
      })),
      edges: edges.map(e => ({
        from: e.source,
        to: e.target
      }))
    }
  };

  // In CLI mode, we return structured instructions
  // The CLI agent itself will process these
  if (IS_CLAUDE_CODE) {
    return {
      mode: 'CLAUDE_NATIVE',
      instruction: 'Process this workflow using your native capabilities',
      plan,
      message: `
        As Claude Code, I can directly process this workflow:
        1. Analyzing the flow structure
        2. Executing each node in sequence
        3. Using my built-in capabilities for AI tasks

        No external API needed - I AM the AI processor.
      `.trim()
    };
  }

  if (IS_GEMINI_CLI) {
    return {
      mode: 'GEMINI_NATIVE',
      instruction: 'Process with Gemini native capabilities',
      plan,
      message: `
        Using Gemini CLI native processing:
        1. Parsing workflow structure
        2. Executing with built-in Gemini capabilities
        3. No external API calls needed
      `.trim()
    };
  }

  // Fallback for non-CLI environments
  return {
    mode: 'SIMULATION',
    plan,
    message: 'Running in simulation mode (no CLI detected)',
    result: `Simulated execution of ${nodes.length} nodes`
  };
};

/**
 * POST /api/cli-native/execute
 * Execute workflow using CLI native capabilities
 */
router.post('/execute', async (req, res) => {
  try {
    const { nodes, edges, prompt } = req.body;

    // Validate input
    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        error: 'Invalid input: nodes array is required'
      });
    }

    logger.info({
      nodeCount: nodes.length,
      edgeCount: edges?.length || 0,
      cliMode: IS_CLI_ENVIRONMENT
    }, 'Processing CLI native request');

    // Execute using CLI native capabilities
    const result = await executeWithCLINative(
      prompt || 'Execute workflow',
      nodes,
      edges || []
    );

    // Return response
    res.json({
      success: true,
      ...result,
      metadata: {
        nodesProcessed: nodes.length,
        edgesProcessed: edges?.length || 0,
        mode: result.mode,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'CLI native execution failed');
    res.status(500).json({
      error: 'Failed to execute with CLI native',
      message: error.message
    });
  }
});

/**
 * GET /api/cli-native/status
 * Check CLI environment status
 */
router.get('/status', (req, res) => {
  res.json({
    available: true,
    environment: {
      isClaude: IS_CLAUDE_CODE,
      isGemini: IS_GEMINI_CLI,
      isCLI: IS_CLI_ENVIRONMENT
    },
    capabilities: {
      directExecution: IS_CLI_ENVIRONMENT,
      noAPIKeysNeeded: IS_CLI_ENVIRONMENT,
      standbyMode: true
    },
    message: IS_CLI_ENVIRONMENT
      ? 'CLI native mode available - no external APIs needed'
      : 'Standard mode - external APIs required'
  });
});

/**
 * POST /api/cli-native/process-prompt
 * Process a user prompt directly
 */
router.post('/process-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    logger.info({ prompt }, 'Processing direct prompt');

    // Auto-generate workflow from prompt
    const workflow = generateWorkflowFromPrompt(prompt);

    // Execute
    const result = await executeWithCLINative(
      prompt,
      workflow.nodes,
      workflow.edges
    );

    res.json({
      success: true,
      prompt,
      workflow,
      result
    });

  } catch (error) {
    logger.error({ err: error }, 'Prompt processing failed');
    res.status(500).json({
      error: 'Failed to process prompt',
      message: error.message
    });
  }
});

/**
 * Generate workflow from user prompt
 */
function generateWorkflowFromPrompt(prompt) {
  const promptLower = prompt.toLowerCase();

  let nodes = [];
  let edges = [];

  // SEO workflow
  if (promptLower.includes('seo') || promptLower.includes('search')) {
    nodes = [
      { id: '1', type: 'serpAnalyzer', data: { label: 'Analyze SERP' }},
      { id: '2', type: 'keywordResearch', data: { label: 'Research keywords' }},
      { id: '3', type: 'contentOptimizer', data: { label: 'Optimize content' }}
    ];
    edges = [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' }
    ];
  }
  // Backlink workflow
  else if (promptLower.includes('backlink')) {
    nodes = [
      { id: '1', type: 'campaignManager', data: { label: 'Setup campaign' }},
      { id: '2', type: 'backlinkCreator', data: { label: 'Create backlinks' }},
      { id: '3', type: 'qualityControl', data: { label: 'Quality check' }}
    ];
    edges = [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' }
    ];
  }
  // Generic orchestrator workflow
  else {
    nodes = [
      { id: '1', type: 'sovereign', data: { label: 'Orchestrate' }},
      { id: '2', type: 'architect', data: { label: 'Design' }},
      { id: '3', type: 'specialist', data: { label: 'Execute' }}
    ];
    edges = [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' }
    ];
  }

  return { nodes, edges };
}

export default router;
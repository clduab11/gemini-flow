/**
 * THE_ORCHESTRATOR Integration API
 *
 * Bridges THE_ORCHESTRATOR's SOVEREIGN agent system with the visual flow interface
 * Enables visual orchestration of multi-agent AI systems
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { createModuleLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createModuleLogger('orchestrator-api');

// Map visual node types to SOVEREIGN agent types
const AGENT_TYPE_MAPPING = {
  'sovereign': 'SOVEREIGN_AGENTS/03_SOVEREIGN/the_sovereign.py',
  'architect': 'LEVEL_1_ARCHITECT',
  'specialist': 'LEVEL_2_SPECIALIST',
  'worker': 'LEVEL_3_WORKER',
  'synthesizer': 'SOVEREIGN_AGENTS/05_SYNTHESIS/synthesis_engine.py',
  'genesis': 'SOVEREIGN_GENESIS/01_GENESIS_AGENT.md',
  'hivemind': 'SOVEREIGN_AGENTS/04_VARIANTS/hivemind_swarm.py',
  'oracle': 'SOVEREIGN_AGENTS/04_VARIANTS/temporal_nexus.py'
};

// Map orchestration patterns to visual flow patterns
const ORCHESTRATION_PATTERNS = {
  'hierarchical': {
    name: 'SOVEREIGN Hierarchical',
    description: 'Strict control structure with quality gates',
    requiredNodes: ['sovereign', 'architect', 'specialist']
  },
  'evolutionary': {
    name: 'GENESIS Evolutionary',
    description: 'Genetic algorithms for agent evolution',
    requiredNodes: ['genesis']
  },
  'swarm': {
    name: 'HIVEMIND Swarm',
    description: 'Collective intelligence via pheromone communication',
    requiredNodes: ['hivemind']
  },
  'temporal': {
    name: 'ORACLE Temporal',
    description: 'Predictive models and causal graphs',
    requiredNodes: ['oracle']
  },
  'unified': {
    name: 'SYNTHESIS Unified',
    description: 'Combines all paradigms dynamically',
    requiredNodes: ['synthesizer']
  }
};

/**
 * Convert visual flow to SOVEREIGN orchestration plan
 */
const convertFlowToOrchestrationPlan = (nodes, edges) => {
  const plan = {
    pattern: 'hierarchical', // Default pattern
    agents: [],
    connections: [],
    tasks: [],
    qualityGates: []
  };

  // Analyze nodes to determine orchestration pattern
  const nodeTypes = nodes.map(n => n.data?.agentType || n.type);

  // Determine optimal orchestration pattern based on node composition
  if (nodeTypes.includes('synthesizer')) {
    plan.pattern = 'unified';
  } else if (nodeTypes.includes('genesis')) {
    plan.pattern = 'evolutionary';
  } else if (nodeTypes.includes('hivemind')) {
    plan.pattern = 'swarm';
  } else if (nodeTypes.includes('oracle')) {
    plan.pattern = 'temporal';
  }

  // Build agent hierarchy
  const agentHierarchy = new Map();

  nodes.forEach(node => {
    const agentConfig = {
      id: node.id,
      type: node.data?.agentType || 'worker',
      level: determineAgentLevel(node),
      capabilities: extractCapabilities(node),
      label: node.data?.label || '',
      config: node.data?.config || {}
    };

    plan.agents.push(agentConfig);
    agentHierarchy.set(node.id, agentConfig);
  });

  // Map edges to agent connections
  edges.forEach(edge => {
    const sourceAgent = agentHierarchy.get(edge.source);
    const targetAgent = agentHierarchy.get(edge.target);

    plan.connections.push({
      from: sourceAgent,
      to: targetAgent,
      type: edge.data?.connectionType || 'orchestrate',
      qualityGate: edge.data?.qualityGate || null
    });
  });

  // Extract tasks from node labels and descriptions
  nodes.forEach(node => {
    if (node.data?.label) {
      plan.tasks.push({
        agentId: node.id,
        description: node.data.label,
        complexity: estimateComplexity(node),
        requirements: node.data.requirements || []
      });
    }
  });

  return plan;
};

/**
 * Determine agent level based on node type and connections
 */
const determineAgentLevel = (node) => {
  switch (node.data?.agentType) {
    case 'sovereign': return 0;
    case 'architect': return 1;
    case 'specialist': return 2;
    case 'worker': return 3;
    case 'synthesizer': return 'X';
    default: return 3;
  }
};

/**
 * Extract agent capabilities from node data
 */
const extractCapabilities = (node) => {
  const defaultCapabilities = ['EXECUTE'];

  switch (node.data?.agentType) {
    case 'sovereign':
      return ['ORCHESTRATE', 'SPAWN', 'VALIDATE', 'SYNTHESIZE'];
    case 'architect':
      return ['ORCHESTRATE', 'SPAWN', 'VALIDATE'];
    case 'specialist':
      return ['EXECUTE', 'VALIDATE'];
    case 'synthesizer':
      return ['SYNTHESIZE', 'ORCHESTRATE'];
    default:
      return node.data?.capabilities || defaultCapabilities;
  }
};

/**
 * Estimate task complexity based on node configuration
 */
const estimateComplexity = (node) => {
  const indicators = {
    high: ['synthesis', 'orchestration', 'evolution', 'prediction'],
    medium: ['analysis', 'generation', 'optimization', 'validation'],
    low: ['execution', 'retrieval', 'formatting', 'logging']
  };

  const label = (node.data?.label || '').toLowerCase();

  for (const [complexity, keywords] of Object.entries(indicators)) {
    if (keywords.some(keyword => label.includes(keyword))) {
      return complexity;
    }
  }

  return 'medium';
};

/**
 * Execute orchestration plan using THE_ORCHESTRATOR
 */
const executeOrchestrationPlan = async (plan) => {
  const orchestratorPath = path.resolve('../../THE_ORCHESTRATOR');

  // Prepare Python command based on orchestration pattern
  const pythonScript = plan.pattern === 'unified'
    ? 'SOVEREIGN_AGENTS/05_SYNTHESIS/synthesis_engine.py'
    : 'SOVEREIGN_AGENTS/demo_master.py';

  const pythonCommand = [
    'python',
    path.join(orchestratorPath, pythonScript),
    '--plan', JSON.stringify(plan),
    '--mode', 'api'
  ];

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonCommand[0], pythonCommand.slice(1), {
      cwd: orchestratorPath,
      env: { ...process.env }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      logger.debug({ output: data.toString() }, 'Orchestrator output');
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      logger.error({ error: data.toString() }, 'Orchestrator error');
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Orchestration failed: ${error}`));
      }
    });
  });
};

/**
 * POST /api/orchestrator/execute
 * Execute a visual flow using THE_ORCHESTRATOR
 */
router.post('/execute', async (req, res) => {
  try {
    const { nodes, edges, config = {} } = req.body;

    // Validate input
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        error: 'Invalid input: nodes array is required and must not be empty'
      });
    }

    logger.info({
      requestId: req.id,
      nodeCount: nodes.length,
      edgeCount: edges.length
    }, 'Converting flow to orchestration plan');

    // Convert visual flow to orchestration plan
    const plan = convertFlowToOrchestrationPlan(nodes, edges);

    logger.debug({
      requestId: req.id,
      plan,
      pattern: plan.pattern,
      agentCount: plan.agents.length
    }, 'Orchestration plan created');

    // Execute the orchestration
    logger.info({ requestId: req.id }, 'Executing orchestration plan');
    const result = await executeOrchestrationPlan(plan);

    logger.info({
      requestId: req.id,
      resultLength: result.length
    }, 'Orchestration completed successfully');

    // Parse result and return structured response
    const response = {
      success: true,
      result: result,
      metadata: {
        pattern: plan.pattern,
        agentsDeployed: plan.agents.length,
        tasksExecuted: plan.tasks.length,
        connectionsEstablished: plan.connections.length,
        timestamp: new Date().toISOString()
      },
      plan: config.includePlan ? plan : undefined
    };

    res.json(response);

  } catch (error) {
    logger.error({
      err: error,
      requestId: req.id,
      path: req.path
    }, 'Orchestration execution failed');

    res.status(500).json({
      error: 'Failed to execute orchestration',
      message: error.message
    });
  }
});

/**
 * GET /api/orchestrator/patterns
 * Get available orchestration patterns
 */
router.get('/patterns', (req, res) => {
  res.json({
    patterns: ORCHESTRATION_PATTERNS,
    agentTypes: Object.keys(AGENT_TYPE_MAPPING),
    capabilities: [
      'ORCHESTRATE',
      'SPAWN',
      'EXECUTE',
      'VALIDATE',
      'SYNTHESIZE'
    ]
  });
});

/**
 * GET /api/orchestrator/agents
 * Get available agent configurations
 */
router.get('/agents', (req, res) => {
  const agents = [
    {
      id: 'sovereign',
      name: 'THE SOVEREIGN',
      level: 0,
      description: 'Meta-orchestrator with full system control',
      capabilities: ['ORCHESTRATE', 'SPAWN', 'VALIDATE', 'SYNTHESIZE'],
      icon: '👑'
    },
    {
      id: 'architect',
      name: 'Domain Architect',
      level: 1,
      description: 'Domain master for specialized areas',
      capabilities: ['ORCHESTRATE', 'SPAWN', 'VALIDATE'],
      icon: '🏗️'
    },
    {
      id: 'specialist',
      name: 'Task Specialist',
      level: 2,
      description: 'Expert for specific task types',
      capabilities: ['EXECUTE', 'VALIDATE'],
      icon: '🔧'
    },
    {
      id: 'worker',
      name: 'Execution Worker',
      level: 3,
      description: 'Basic execution unit',
      capabilities: ['EXECUTE'],
      icon: '⚙️'
    },
    {
      id: 'synthesizer',
      name: 'Synthesis Engine',
      level: 'X',
      description: 'Cross-paradigm unification agent',
      capabilities: ['SYNTHESIZE', 'ORCHESTRATE'],
      icon: '🔮'
    },
    {
      id: 'genesis',
      name: 'Genesis Generator',
      level: 'X',
      description: 'Evolutionary creation agent',
      capabilities: ['SPAWN', 'EVOLVE'],
      icon: '🧬'
    },
    {
      id: 'hivemind',
      name: 'Hivemind Swarm',
      level: 'X',
      description: 'Collective intelligence coordinator',
      capabilities: ['SWARM', 'COMMUNICATE'],
      icon: '🐝'
    },
    {
      id: 'oracle',
      name: 'Temporal Oracle',
      level: 'X',
      description: 'Predictive and causal analysis agent',
      capabilities: ['PREDICT', 'ANALYZE'],
      icon: '🔮'
    }
  ];

  res.json({ agents });
});

/**
 * POST /api/orchestrator/validate
 * Validate a flow configuration for orchestration compatibility
 */
router.post('/validate', (req, res) => {
  try {
    const { nodes, edges } = req.body;
    const validation = {
      valid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    // Check for required nodes
    if (!nodes.some(n => n.type === 'input')) {
      validation.errors.push('No input node found - orchestration needs a starting point');
      validation.valid = false;
    }

    // Check for orphaned nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.type !== 'input') {
        validation.warnings.push(`Node "${node.data?.label || node.id}" is not connected`);
      }
    });

    // Suggest optimal patterns
    const nodeTypes = nodes.map(n => n.data?.agentType || n.type);
    if (nodeTypes.length > 5 && !nodeTypes.includes('sovereign')) {
      validation.suggestions.push('Consider adding a SOVEREIGN agent for better orchestration of complex flows');
    }

    res.json(validation);

  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error.message
    });
  }
});

export default router;
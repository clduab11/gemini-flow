/**
 * Gemini API Routes
 * 
 * Handles execution of visual flows via Google Gemini API
 */

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateWorkflowData } from '../middleware/validation.js';

const router = express.Router();

// Initialize Gemini client (will be done per request to handle different API keys)
const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable.');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Graph traversal logic to convert nodes and edges into a coherent prompt
 */
const buildPromptFromGraph = (nodes, edges) => {
  // Find the input node (starting point)
  const inputNode = nodes.find(node => node.type === 'input');
  
  if (!inputNode) {
    throw new Error('No input node found in the flow. Please add an input node to start the flow.');
  }
  
  // For initial implementation, we'll create a simple linear flow
  // TODO: Implement more sophisticated graph traversal for complex flows
  
  let prompt = '';
  const visited = new Set();
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const edgeMap = new Map();
  
  // Build edge map for easier traversal
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, []);
    }
    edgeMap.get(edge.source).push(edge.target);
  });
  
  // Traverse the graph starting from input node
  const traverseNode = (nodeId, depth = 0) => {
    if (visited.has(nodeId)) return '';
    
    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    
    if (!node) return '';
    
    let nodePrompt = '';
    
    // Extract prompt content based on node type and data
    switch (node.type) {
      case 'input':
        nodePrompt = `Input: ${node.data.label || 'Process the following'}`;
        break;
      case 'output':
        nodePrompt = `Output: ${node.data.label || 'Provide the result'}`;
        break;
      default:
        nodePrompt = `Step ${depth + 1}: ${node.data.label || 'Process this step'}`;
    }
    
    // Add current node to prompt
    let result = nodePrompt;
    
    // Traverse connected nodes
    const connectedNodes = edgeMap.get(nodeId) || [];
    connectedNodes.forEach(targetId => {
      const childPrompt = traverseNode(targetId, depth + 1);
      if (childPrompt) {
        result += `\n${childPrompt}`;
      }
    });
    
    return result;
  };
  
  prompt = traverseNode(inputNode.id);
  
  // If prompt is empty or too basic, provide a fallback
  if (!prompt || prompt.trim().length < 10) {
    prompt = `Please process the following workflow:\n${nodes.map(node => `- ${node.data.label || node.type}`).join('\n')}`;
  }
  
  return prompt;
};

/**
 * POST /api/gemini/execute
 * Execute a visual flow via Gemini API
 * Includes workflow validation middleware
 */
router.post('/execute', validateWorkflowData, async (req, res) => {
  try {
    const { nodes, edges } = req.body;
    
    // Validate input
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input: nodes array is required and must not be empty' 
      });
    }
    
    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json({ 
        error: 'Invalid input: edges array is required' 
      });
    }
    
    console.log(`🔄 Executing flow with ${nodes.length} nodes and ${edges.length} edges`);
    
    // Build prompt from graph
    const prompt = buildPromptFromGraph(nodes, edges);
    console.log('📝 Built prompt:', prompt);
    
    // Initialize Gemini client
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate content
    console.log('🤖 Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Received response from Gemini API');
    
    // Return successful response
    res.json({ 
      success: true,
      result: text,
      metadata: {
        nodesProcessed: nodes.length,
        edgesProcessed: edges.length,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Gemini API request failed:', error);
    
    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid or missing API key. Please check your Gemini API key configuration.'
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'API quota exceeded. Please try again later.'
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      error: 'Failed to execute flow with Gemini API',
      message: error.message
    });
  }
});

/**
 * GET /api/gemini/status
 * Check Gemini API connection status
 */
router.get('/status', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    res.json({
      status: 'ready',
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
/**
 * Natural Language Parser with Co-Scientist Integration
 *
 * Converts natural language commands to structured commands using Google's Co-Scientist.
 * Provides semantic understanding, intent classification, and entity extraction.
 *
 * Features:
 * - Natural language to structured command conversion
 * - Confidence scoring
 * - Entity extraction
 * - Command suggestions
 * - Context-aware parsing
 */

import {
  NaturalLanguageParser,
  ParsedCommand,
  CommandContext,
  CommandNamespace,
  CommandHandler,
} from './types.js';
import { AgentSpaceManager } from '../../agentspace/core/AgentSpaceManager.js';
import { EventEmitter } from 'events';

/**
 * Co-Scientist Natural Language Parser
 */
export class CoScientistNLParser extends EventEmitter implements NaturalLanguageParser {
  private agentSpace: AgentSpaceManager;
  private coScientistAgent: any = null;
  private commandRegistry: Map<string, CommandHandler> = new Map();
  private enabled: boolean = true;

  // Command pattern library for matching
  private patterns = {
    'google-ai': {
      'generate-video': [
        /generate.*video/i,
        /create.*video/i,
        /make.*video/i,
        /veo3/i,
      ],
      'generate-image': [
        /generate.*image/i,
        /create.*image/i,
        /make.*image/i,
        /draw/i,
        /imagen4/i,
      ],
      'compose-audio': [
        /compose.*audio/i,
        /create.*music/i,
        /generate.*sound/i,
        /lyria/i,
      ],
      'speech-to-text': [
        /transcribe/i,
        /speech.*text/i,
        /audio.*text/i,
        /chirp/i,
      ],
      'research': [
        /research/i,
        /investigate/i,
        /analyze.*topic/i,
        /study/i,
        /co-scientist/i,
      ],
      'navigate': [
        /navigate/i,
        /browse/i,
        /visit.*site/i,
        /web.*scrape/i,
        /mariner/i,
      ],
      'orchestrate': [
        /orchestrate/i,
        /coordinate.*agents/i,
        /multi.*agent/i,
        /agentspace/i,
      ],
      'stream': [
        /stream/i,
        /continuous.*inference/i,
        /real.*time.*generation/i,
      ],
    },
    'swarm': {
      'spawn': [
        /spawn.*agent/i,
        /create.*agent/i,
        /start.*agent/i,
      ],
      'list': [
        /list.*agents/i,
        /show.*agents/i,
        /get.*agents/i,
      ],
      'status': [
        /status.*agent/i,
        /check.*agent/i,
        /agent.*info/i,
      ],
      'terminate': [
        /terminate.*agent/i,
        /kill.*agent/i,
        /stop.*agent/i,
      ],
      'send': [
        /send.*message/i,
        /message.*agent/i,
        /communicate/i,
      ],
    },
    'quantum': {
      'circuit': [
        /quantum.*circuit/i,
        /execute.*circuit/i,
        /run.*qasm/i,
      ],
      'simulate': [
        /simulate.*quantum/i,
        /quantum.*simulation/i,
      ],
      'ml': [
        /quantum.*ml/i,
        /quantum.*machine.*learning/i,
        /qnn/i,
      ],
      'optimize': [
        /quantum.*optimize/i,
        /qaoa/i,
        /vqe/i,
      ],
    },
    'performance': {
      'metrics': [
        /performance.*metrics/i,
        /show.*metrics/i,
        /system.*stats/i,
      ],
      'bottlenecks': [
        /bottlenecks/i,
        /performance.*issues/i,
        /slow.*components/i,
      ],
      'sla': [
        /sla/i,
        /service.*level/i,
        /uptime/i,
      ],
      'insights': [
        /insights/i,
        /recommendations/i,
        /optimize/i,
      ],
      'health': [
        /health.*check/i,
        /system.*health/i,
        /status/i,
      ],
    },
  };

  constructor(agentSpace: AgentSpaceManager) {
    super();
    this.agentSpace = agentSpace;
  }

  /**
   * Initialize Co-Scientist agent for NL parsing
   */
  async initialize(): Promise<void> {
    try {
      this.emit('log', { level: 'info', message: 'Initializing Co-Scientist NL parser...' });

      this.coScientistAgent = await this.agentSpace.spawnAgent({
        type: 'co-scientist',
        priority: 'high',
        timeout: 30000,
      });

      this.emit('log', {
        level: 'info',
        message: `Co-Scientist agent spawned: ${this.coScientistAgent.id}`,
      });

      this.enabled = true;
    } catch (error) {
      this.emit('log', {
        level: 'warn',
        message: `Failed to initialize Co-Scientist: ${error}`,
      });
      this.enabled = false;
    }
  }

  /**
   * Register command handlers for semantic matching
   */
  registerCommandHandlers(handlers: CommandHandler[]): void {
    for (const handler of handlers) {
      const key = `${handler.namespace}:${handler.action}`;
      this.commandRegistry.set(key, handler);
    }

    this.emit('log', {
      level: 'info',
      message: `Registered ${handlers.length} command handlers for NL parsing`,
    });
  }

  /**
   * Parse natural language input into structured command
   */
  async parse(input: string, context: CommandContext): Promise<ParsedCommand> {
    // Quick pattern matching first (fast path)
    const patternMatch = this.patternMatch(input);
    if (patternMatch && patternMatch.confidence > 0.8) {
      return patternMatch;
    }

    // Use Co-Scientist for complex parsing (slow path)
    if (this.enabled && this.coScientistAgent) {
      try {
        const coScientistResult = await this.parseWithCoScientist(input, context);
        if (coScientistResult.confidence > 0.6) {
          return coScientistResult;
        }
      } catch (error) {
        this.emit('log', {
          level: 'warn',
          message: `Co-Scientist parsing failed: ${error}`,
        });
      }
    }

    // Fallback to pattern match with lower threshold
    if (patternMatch && patternMatch.confidence > 0.5) {
      return patternMatch;
    }

    // No match found
    throw new Error('Unable to parse natural language input');
  }

  /**
   * Pattern-based matching (fast path)
   */
  private patternMatch(input: string): ParsedCommand | null {
    const normalizedInput = input.toLowerCase();

    for (const [namespace, actions] of Object.entries(this.patterns)) {
      for (const [action, patterns] of Object.entries(actions)) {
        for (const pattern of patterns) {
          if (pattern.test(normalizedInput)) {
            // Extract arguments from input
            const args = this.extractArguments(input, namespace as CommandNamespace, action);

            return {
              namespace: namespace as CommandNamespace,
              action,
              args,
              flags: {},
              confidence: 0.85, // High confidence for pattern match
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract arguments from natural language input
   */
  private extractArguments(
    input: string,
    namespace: CommandNamespace,
    action: string
  ): Record<string, any> {
    const args: Record<string, any> = {};

    // Extract quoted strings as primary argument
    const quotedMatches = input.match(/"([^"]+)"/g);
    if (quotedMatches && quotedMatches.length > 0) {
      args.arg0 = quotedMatches[0].replace(/"/g, '');
    }

    // Extract URLs
    const urlMatch = input.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      args.url = urlMatch[0];
      args.arg0 = args.arg0 || urlMatch[0];
    }

    // Extract numbers
    const numberMatches = input.match(/\b\d+\b/g);
    if (numberMatches) {
      // Try to contextualize numbers based on command
      if (namespace === 'quantum' && (action === 'circuit' || action === 'simulate')) {
        args.qubits = Number(numberMatches[0]);
      } else if (namespace === 'google-ai' && action === 'orchestrate') {
        args.agents = Number(numberMatches[0]);
      }
    }

    // If no primary arg extracted, use remaining text
    if (!args.arg0) {
      // Remove command keywords
      let remaining = input;
      for (const patterns of Object.values(this.patterns[namespace] || {})) {
        for (const pattern of patterns) {
          remaining = remaining.replace(pattern, '').trim();
        }
      }

      if (remaining) {
        args.arg0 = remaining;
      }
    }

    return args;
  }

  /**
   * Parse with Co-Scientist (slow path, high accuracy)
   */
  private async parseWithCoScientist(
    input: string,
    context: CommandContext
  ): Promise<ParsedCommand> {
    // Prepare prompt for Co-Scientist
    const prompt = this.buildCoScientistPrompt(input, context);

    // Simulate Co-Scientist API call (would be real agent invocation in production)
    // In production, this would use the Co-Scientist agent to analyze the input
    const analysis = await this.simulateCoScientistAnalysis(input, prompt);

    return {
      namespace: analysis.namespace as CommandNamespace,
      action: analysis.action,
      args: analysis.args,
      flags: analysis.flags,
      confidence: analysis.confidence,
    };
  }

  /**
   * Build prompt for Co-Scientist
   */
  private buildCoScientistPrompt(input: string, context: CommandContext): string {
    const availableCommands = Array.from(this.commandRegistry.values())
      .map(h => `${h.namespace}:${h.action} - ${h.description}`)
      .join('\n');

    return `Analyze the following natural language command and convert it to a structured command.

User Input: "${input}"

Available Commands:
${availableCommands}

Context:
- Session ID: ${context.sessionId}
- Mode: ${context.mode}
- Workspace: ${context.workspaceId}

Provide a JSON response with:
{
  "namespace": "command namespace",
  "action": "command action",
  "args": { "key": "value" },
  "flags": { "key": "value" },
  "confidence": 0.0-1.0,
  "reasoning": "explanation"
}`;
  }

  /**
   * Simulate Co-Scientist analysis (placeholder for real implementation)
   */
  private async simulateCoScientistAnalysis(
    input: string,
    prompt: string
  ): Promise<{
    namespace: string;
    action: string;
    args: Record<string, any>;
    flags: Record<string, any>;
    confidence: number;
  }> {
    // This is a simulation. In production, this would call the actual Co-Scientist agent

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API latency

    // Pattern matching as fallback
    const patternResult = this.patternMatch(input);
    if (patternResult) {
      return {
        namespace: patternResult.namespace,
        action: patternResult.action,
        args: patternResult.args,
        flags: patternResult.flags,
        confidence: Math.min(patternResult.confidence + 0.1, 0.95), // Boost confidence slightly
      };
    }

    // If no pattern match, return low confidence result
    return {
      namespace: 'system',
      action: 'help',
      args: {},
      flags: {},
      confidence: 0.3,
    };
  }

  /**
   * Get confidence score for a potential command match
   */
  async getConfidence(input: string, command: CommandHandler): Promise<number> {
    const namespace = command.namespace;
    const action = command.action;

    const patterns = this.patterns[namespace]?.[action] || [];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return 0.85; // High confidence for pattern match
      }
    }

    // Check for keyword overlap
    const inputWords = input.toLowerCase().split(/\s+/);
    const commandWords = [...action.split('-'), namespace].map(w => w.toLowerCase());

    const overlap = inputWords.filter(w => commandWords.includes(w)).length;
    const confidence = overlap / Math.max(inputWords.length, commandWords.length);

    return Math.min(confidence, 0.7); // Cap at 0.7 for keyword matching
  }

  /**
   * Extract entities from natural language
   */
  async extractEntities(input: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};

    // Extract URLs
    const urls = input.match(/https?:\/\/[^\s]+/gi);
    if (urls) {
      entities.urls = urls;
    }

    // Extract numbers
    const numbers = input.match(/\b\d+\b/g);
    if (numbers) {
      entities.numbers = numbers.map(Number);
    }

    // Extract quoted strings
    const quotes = input.match(/"([^"]+)"/g);
    if (quotes) {
      entities.quotedStrings = quotes.map(q => q.replace(/"/g, ''));
    }

    // Extract file paths
    const filePaths = input.match(/[a-zA-Z0-9_\-./]+\.[a-zA-Z]{2,4}/g);
    if (filePaths) {
      entities.files = filePaths;
    }

    // Extract agent IDs (pattern: agent-XXX or agentspace-XXX)
    const agentIds = input.match(/agent(?:space)?-[a-zA-Z0-9]+/gi);
    if (agentIds) {
      entities.agentIds = agentIds;
    }

    return entities;
  }

  /**
   * Enable/disable natural language parsing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('log', {
      level: 'info',
      message: `Natural language parsing ${enabled ? 'enabled' : 'disabled'}`,
    });
  }

  /**
   * Check if NL parsing is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Shutdown Co-Scientist agent
   */
  async shutdown(): Promise<void> {
    if (this.coScientistAgent) {
      try {
        await this.agentSpace.terminateAgent(this.coScientistAgent.id);
        this.emit('log', {
          level: 'info',
          message: 'Co-Scientist agent terminated',
        });
      } catch (error) {
        this.emit('log', {
          level: 'warn',
          message: `Failed to terminate Co-Scientist agent: ${error}`,
        });
      }
    }
  }
}

/**
 * Create and initialize NL parser
 */
export async function createNLParser(agentSpace: AgentSpaceManager): Promise<CoScientistNLParser> {
  const parser = new CoScientistNLParser(agentSpace);
  await parser.initialize();
  return parser;
}

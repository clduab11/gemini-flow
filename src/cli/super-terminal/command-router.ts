/**
 * Command Router Implementation
 *
 * Routes structured and natural language commands to appropriate handlers.
 * Supports autocomplete, suggestions, and error recovery.
 */

import { EventEmitter } from 'events';
import {
  CommandRouter,
  CommandHandler,
  CommandInput,
  CommandStream,
  CommandContext,
  ParsedCommand,
  CommandSuggestion,
  CommandNamespace,
  CommandError,
  ErrorRecoveryStrategy,
  RecoveryResult,
  NaturalLanguageParser,
} from './types.js';
import { Logger } from 'pino';

export class DefaultCommandRouter extends EventEmitter implements CommandRouter {
  private handlers = new Map<string, CommandHandler>();
  private nlParser?: NaturalLanguageParser;
  private errorRecovery?: ErrorRecoveryStrategy;
  private logger?: Logger;

  constructor(
    nlParser?: NaturalLanguageParser,
    errorRecovery?: ErrorRecoveryStrategy,
    logger?: Logger
  ) {
    super();
    this.nlParser = nlParser;
    this.errorRecovery = errorRecovery;
    this.logger = logger;
  }

  /**
   * Register a command handler
   */
  register(handler: CommandHandler): void {
    const key = this.getHandlerKey(handler.namespace, handler.action);
    this.handlers.set(key, handler);

    this.log('debug', `Registered command: ${handler.namespace}:${handler.action}`);
    this.emit('handler-registered', { namespace: handler.namespace, action: handler.action });
  }

  /**
   * Route input to appropriate handler
   */
  async route(input: CommandInput): Promise<CommandStream> {
    const stream = new CommandStream(`stream-${Date.now()}`);

    try {
      // Parse command if not already parsed
      const parsed = input.parsed || (await this.parseInput(input));

      this.log('debug', `Routing command: ${parsed.namespace}:${parsed.action}`);
      this.emit('command-routed', { parsed, context: input.context });

      // Find handler
      const handler = this.getHandler(parsed.namespace, parsed.action);

      if (!handler) {
        throw new CommandError(
          `No handler found for ${parsed.namespace}:${parsed.action}`,
          'INVALID_SYNTAX',
          true,
          { parsed }
        );
      }

      // Validate arguments
      const validation = await handler.validate(parsed.args);
      if (!validation.valid) {
        throw new CommandError(
          `Invalid arguments: ${validation.errors?.join(', ')}`,
          'INVALID_ARGS',
          true,
          { validation }
        );
      }

      // Execute handler
      stream.status = 'running';
      const result = await handler.execute(parsed.args, input.context);

      // Pipe handler stream to output stream
      this.pipeStreams(result, stream);

      return stream;
    } catch (error) {
      // Attempt error recovery
      if (error instanceof CommandError && this.errorRecovery) {
        const recovery = await this.attemptRecovery(error, input.context);
        if (recovery.success) {
          stream.chunk({ type: 'recovery', message: recovery.message }, 'log');
          return recovery.retryCommand
            ? this.route({ ...input, parsed: recovery.retryCommand })
            : stream;
        }
      }

      // Emit error through stream
      stream.fail(error as Error);
      this.emit('command-error', { error, input });

      return stream;
    }
  }

  /**
   * Get all registered commands in a namespace
   */
  getCommands(namespace?: CommandNamespace): CommandHandler[] {
    const handlers = Array.from(this.handlers.values());

    return namespace
      ? handlers.filter(h => h.namespace === namespace)
      : handlers;
  }

  /**
   * Get command suggestions for autocomplete
   */
  async suggest(partial: string, context: CommandContext): Promise<CommandSuggestion[]> {
    const suggestions: CommandSuggestion[] = [];

    // Match against registered commands
    for (const handler of this.handlers.values()) {
      const commandStr = `${handler.namespace} ${handler.action}`;
      const similarity = this.calculateSimilarity(partial.toLowerCase(), commandStr.toLowerCase());

      if (similarity > 0.3) {
        suggestions.push({
          command: commandStr,
          description: handler.description,
          confidence: similarity,
          namespace: handler.namespace,
        });
      }

      // Also check examples
      for (const example of handler.schema.examples) {
        const exampleSimilarity = this.calculateSimilarity(partial.toLowerCase(), example.toLowerCase());
        if (exampleSimilarity > 0.4) {
          suggestions.push({
            command: example,
            description: handler.description,
            confidence: exampleSimilarity * 0.9, // Slightly lower confidence for examples
            namespace: handler.namespace,
          });
        }
      }
    }

    // Use NLP parser for additional suggestions if available
    if (this.nlParser && partial.length > 3) {
      try {
        const nlParsed = await this.nlParser.parse(partial, context);
        if (nlParsed.confidence > 0.5) {
          const handler = this.getHandler(nlParsed.namespace, nlParsed.action);
          if (handler) {
            suggestions.push({
              command: `${nlParsed.namespace} ${nlParsed.action}`,
              description: handler.description,
              confidence: nlParsed.confidence,
              namespace: nlParsed.namespace,
            });
          }
        }
      } catch (error) {
        // Ignore NLP parsing errors for suggestions
        this.log('debug', `NLP suggestion failed: ${error}`);
      }
    }

    // Sort by confidence and deduplicate
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Parse command input
   */
  private async parseInput(input: CommandInput): Promise<ParsedCommand> {
    const { raw, context } = input;

    // Try structured parsing first
    const structured = this.parseStructured(raw);
    if (structured) {
      return structured;
    }

    // Fall back to natural language parsing
    if (this.nlParser) {
      const nlParsed = await this.nlParser.parse(raw, context);
      if (nlParsed.confidence > 0.6) {
        return nlParsed;
      }
    }

    // If all parsing fails, throw error
    throw new CommandError(
      `Unable to parse command: "${raw}"`,
      'INVALID_SYNTAX',
      true,
      { raw }
    );
  }

  /**
   * Parse structured command (namespace action --flags)
   */
  private parseStructured(raw: string): ParsedCommand | null {
    // Simple regex-based parser for structured commands
    // Format: namespace action [args] [--flags]
    const parts = raw.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const [namespace, action, ...rest] = parts;

    // Check if namespace is valid
    if (!this.isValidNamespace(namespace)) {
      return null;
    }

    // Parse args and flags
    const args: Record<string, any> = {};
    const flags: Record<string, boolean | string | number> = {};

    let currentFlag: string | null = null;
    for (const part of rest) {
      if (part.startsWith('--')) {
        currentFlag = part.slice(2);
        flags[currentFlag] = true; // Boolean flag
      } else if (currentFlag) {
        // Flag with value
        const value = this.parseValue(part);
        flags[currentFlag] = value;
        currentFlag = null;
      } else {
        // Positional argument (simple implementation)
        args[`arg${Object.keys(args).length}`] = this.parseValue(part);
      }
    }

    return {
      namespace: namespace as CommandNamespace,
      action,
      args,
      flags,
      confidence: 1.0, // Structured commands have full confidence
    };
  }

  /**
   * Parse value (string, number, boolean)
   */
  private parseValue(value: string): any {
    // Try number
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Try boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Default to string
    return value;
  }

  /**
   * Check if namespace is valid
   */
  private isValidNamespace(namespace: string): boolean {
    const validNamespaces: CommandNamespace[] = [
      'google-ai',
      'quantum',
      'swarm',
      'performance',
      'system',
      'workspace',
    ];
    return validNamespaces.includes(namespace as CommandNamespace);
  }

  /**
   * Get handler by namespace and action
   */
  private getHandler(namespace: CommandNamespace, action: string): CommandHandler | undefined {
    return this.handlers.get(this.getHandlerKey(namespace, action));
  }

  /**
   * Get handler key
   */
  private getHandlerKey(namespace: CommandNamespace, action: string): string {
    return `${namespace}:${action}`;
  }

  /**
   * Pipe one stream to another
   */
  private pipeStreams(source: CommandStream, target: CommandStream): void {
    source.on('chunk', (data) => target.chunk(data.data, data.type));
    source.on('progress', (progress) => target.updateProgress(progress));
    source.on('complete', (result) => target.complete(result));
    source.on('error', (error) => target.fail(error));
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(
    error: CommandError,
    context: CommandContext
  ): Promise<RecoveryResult> {
    if (!this.errorRecovery) {
      return { success: false, message: 'No error recovery strategy configured' };
    }

    try {
      return await this.errorRecovery.recover(error, context);
    } catch (recoveryError) {
      this.log('error', `Error recovery failed: ${recoveryError}`);
      return { success: false, message: 'Error recovery failed' };
    }
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    // Check for substring match (higher weight)
    if (longer.includes(shorter)) {
      return 0.8 + (shorter.length / longer.length) * 0.2;
    }

    // Simple edit distance
    const editDistance = this.levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  /**
   * Deduplicate suggestions
   */
  private deduplicateSuggestions(suggestions: CommandSuggestion[]): CommandSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.command)) return false;
      seen.add(s.command);
      return true;
    });
  }

  /**
   * Internal logging
   */
  private log(level: string, message: string): void {
    if (this.logger) {
      (this.logger as any)[level](message);
    }
    this.emit('log', { level, message, timestamp: Date.now() });
  }
}

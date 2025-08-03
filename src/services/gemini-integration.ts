/**
 * Gemini Integration Service
 * 
 * Handles Gemini CLI detection and context loading for enhanced AI coordination
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Logger } from '../utils/logger.js';

export interface GeminiContext {
  content: string;
  loaded: boolean;
  timestamp: Date;
  source: 'GEMINI.md' | 'fallback';
}

export interface GeminiDetectionResult {
  isInstalled: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export class GeminiIntegrationService {
  private logger: Logger;
  private static instance: GeminiIntegrationService;
  private cachedContext: GeminiContext | null = null;
  private detectionResult: GeminiDetectionResult | null = null;

  private constructor() {
    this.logger = new Logger('GeminiIntegration');
  }

  public static getInstance(): GeminiIntegrationService {
    if (!GeminiIntegrationService.instance) {
      GeminiIntegrationService.instance = new GeminiIntegrationService();
    }
    return GeminiIntegrationService.instance;
  }

  /**
   * Detect if official Gemini CLI is installed
   */
  public async detectGeminiCLI(): Promise<GeminiDetectionResult> {
    if (this.detectionResult) {
      return this.detectionResult;
    }

    try {
      // Try to detect Gemini CLI
      const result = execSync('which gemini', { 
        encoding: 'utf8',
        timeout: 5000,
        stdio: 'pipe'
      }).trim();

      if (result) {
        try {
          // Try to get version
          const version = execSync('gemini --version', {
            encoding: 'utf8',
            timeout: 5000,
            stdio: 'pipe'
          }).trim();

          this.detectionResult = {
            isInstalled: true,
            version: version.replace(/^gemini\s+/, ''),
            path: result
          };

          this.logger.info('Gemini CLI detected', {
            version: this.detectionResult.version,
            path: this.detectionResult.path
          });

        } catch (versionError) {
          this.detectionResult = {
            isInstalled: true,
            path: result,
            error: 'Version detection failed'
          };
        }
      }

    } catch (error) {
      this.detectionResult = {
        isInstalled: false,
        error: error instanceof Error ? error.message : 'Detection failed'
      };

      this.logger.debug('Gemini CLI not detected', { error: this.detectionResult.error });
    }

    return this.detectionResult;
  }

  /**
   * Load GEMINI.md context for enhanced AI coordination
   */
  public async loadGeminiContext(projectRoot?: string): Promise<GeminiContext> {
    if (this.cachedContext && this.isCacheValid()) {
      return this.cachedContext;
    }

    const cwd = projectRoot || process.cwd();
    const geminiPath = join(cwd, 'GEMINI.md');

    try {
      if (existsSync(geminiPath)) {
        const content = readFileSync(geminiPath, 'utf8');
        
        this.cachedContext = {
          content,
          loaded: true,
          timestamp: new Date(),
          source: 'GEMINI.md'
        };

        this.logger.info('GEMINI.md context loaded successfully', {
          size: content.length,
          path: geminiPath
        });

      } else {
        // Fallback context if GEMINI.md doesn't exist
        this.cachedContext = {
          content: this.getFallbackContext(),
          loaded: true,
          timestamp: new Date(),
          source: 'fallback'
        };

        this.logger.warn('GEMINI.md not found, using fallback context');
      }

    } catch (error) {
      this.logger.error('Failed to load GEMINI.md context', error);
      
      this.cachedContext = {
        content: this.getFallbackContext(),
        loaded: false,
        timestamp: new Date(),
        source: 'fallback'
      };
    }

    return this.cachedContext;
  }

  /**
   * Setup environment variables for Gemini integration
   */
  public setupEnvironment(): void {
    const envVars = {
      GEMINI_FLOW_CONTEXT_LOADED: 'true',
      GEMINI_FLOW_MODE: 'enhanced',
      GEMINI_MODEL: 'gemini-1.5-flash'
    };

    for (const [key, value] of Object.entries(envVars)) {
      if (!process.env[key]) {
        process.env[key] = value;
        this.logger.debug(`Set environment variable: ${key}=${value}`);
      }
    }

    this.logger.info('Gemini integration environment variables configured');
  }

  /**
   * Get integration status for logging/debugging
   */
  public async getIntegrationStatus(): Promise<{
    cliDetected: boolean;
    contextLoaded: boolean;
    environmentConfigured: boolean;
    geminiVersion?: string;
    contextSource?: string;
  }> {
    const detection = await this.detectGeminiCLI();
    const context = this.cachedContext;

    return {
      cliDetected: detection.isInstalled,
      contextLoaded: context?.loaded || false,
      environmentConfigured: process.env.GEMINI_FLOW_CONTEXT_LOADED === 'true',
      geminiVersion: detection.version,
      contextSource: context?.source
    };
  }

  /**
   * Initialize complete Gemini integration
   */
  public async initialize(projectRoot?: string): Promise<{
    detection: GeminiDetectionResult;
    context: GeminiContext;
    environmentConfigured: boolean;
  }> {
    this.logger.info('Initializing Gemini integration...');

    const [detection, context] = await Promise.all([
      this.detectGeminiCLI(),
      this.loadGeminiContext(projectRoot)
    ]);

    this.setupEnvironment();

    const result = {
      detection,
      context,
      environmentConfigured: process.env.GEMINI_FLOW_CONTEXT_LOADED === 'true'
    };

    this.logger.info('Gemini integration initialized', {
      cliDetected: detection.isInstalled,
      contextLoaded: context.loaded,
      contextSource: context.source
    });

    return result;
  }

  /**
   * Clear cached data (useful for testing)
   */
  public clearCache(): void {
    this.cachedContext = null;
    this.detectionResult = null;
  }

  private isCacheValid(): boolean {
    if (!this.cachedContext) return false;
    
    // Cache valid for 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - this.cachedContext.timestamp.getTime() < fiveMinutes;
  }

  private getFallbackContext(): string {
    return `# Gemini-Flow Context (Fallback)

This is a fallback context when GEMINI.md is not available.

## Available Commands
- init: Initialize project
- swarm: Manage AI swarms
- agent: Manage agents
- task: Task orchestration
- sparc: SPARC development modes
- hive-mind: Collective intelligence
- query: AI queries
- memory: Memory management

## Agent Types
Available agent types include: coordinator, researcher, coder, analyst, architect, tester, reviewer, optimizer, documenter, monitor, specialist.

## Integration Mode
Enhanced Gemini integration is active with context loading capabilities.
`;
  }
}

export default GeminiIntegrationService;
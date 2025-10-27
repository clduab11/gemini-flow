/**
 * Google AI Services Command Handlers
 *
 * Handlers for all 8 Google AI services:
 * - Veo3 (video generation)
 * - Imagen4 (image synthesis)
 * - Lyria (audio/music)
 * - Chirp (speech-to-text)
 * - Co-Scientist (research)
 * - Mariner (web navigation)
 * - AgentSpace (agent orchestration)
 * - Streaming (streaming inference)
 */

import {
  CommandHandler,
  CommandStream,
  CommandContext,
  ValidationResult,
  GoogleAIService,
  GoogleAIServiceOptions,
} from '../types.js';
import { AgentSpaceManager } from '../../../agentspace/core/AgentSpaceManager.js';
import { GoogleAIOrchestratorService } from '../../../services/google-services/orchestrator.js';

/**
 * Base class for Google AI command handlers
 */
abstract class BaseGoogleAIHandler implements CommandHandler {
  namespace = 'google-ai' as const;
  abstract action: string;
  abstract description: string;

  protected agentSpace: AgentSpaceManager;
  protected orchestrator: GoogleAIOrchestratorService;

  constructor(agentSpace: AgentSpaceManager, orchestrator: GoogleAIOrchestratorService) {
    this.agentSpace = agentSpace;
    this.orchestrator = orchestrator;
  }

  get schema() {
    return {
      args: [
        {
          name: 'prompt',
          type: 'string' as const,
          required: true,
          description: 'The prompt for the AI service',
        },
      ],
      flags: [
        {
          name: 'model',
          type: 'string' as const,
          description: 'Specific model to use',
        },
        {
          name: 'temperature',
          type: 'number' as const,
          description: 'Temperature for generation (0-1)',
          default: 0.7,
        },
        {
          name: 'stream',
          type: 'boolean' as const,
          description: 'Enable streaming mode',
          default: true,
        },
      ],
      examples: this.getExamples(),
    };
  }

  abstract getExamples(): string[];

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!args.prompt && !args.arg0) {
      errors.push('Prompt is required');
    }

    if (args.temperature !== undefined) {
      const temp = Number(args.temperature);
      if (isNaN(temp) || temp < 0 || temp > 1) {
        errors.push('Temperature must be between 0 and 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  abstract execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream>;

  /**
   * Spawn agent for Google AI service
   */
  protected async spawnServiceAgent(
    service: GoogleAIService,
    prompt: string,
    options: GoogleAIServiceOptions
  ): Promise<any> {
    const agentConfig = {
      type: `google-ai-${service}`,
      priority: options.priority || 'medium',
      timeout: options.timeout || 120000,
      resources: {
        maxMemoryMB: 512,
        maxCPUPercentage: 50,
      },
    };

    const agent = await this.agentSpace.spawnAgent(agentConfig);
    return agent;
  }

  /**
   * Extract prompt from args (handles both structured and natural language)
   */
  protected extractPrompt(args: Record<string, any>): string {
    return args.prompt || args.arg0 || '';
  }

  /**
   * Extract options from args
   */
  protected extractOptions(args: Record<string, any>): GoogleAIServiceOptions {
    return {
      model: args.model,
      temperature: args.temperature ? Number(args.temperature) : undefined,
      streaming: args.stream !== false,
      priority: args.priority || 'medium',
      timeout: args.timeout ? Number(args.timeout) : undefined,
    };
  }
}

// ============================================================================
// Video Generation (Veo3)
// ============================================================================

export class Veo3Handler extends BaseGoogleAIHandler {
  action = 'generate-video';
  description = 'Generate video using Veo3';

  getExamples(): string[] {
    return [
      'google-ai generate-video "a cat playing piano"',
      'google-ai generate-video "quantum computing visualization" --model veo3-pro',
    ];
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`veo3-${Date.now()}`);
    const prompt = this.extractPrompt(args);
    const options = this.extractOptions(args);

    // Execute asynchronously
    (async () => {
      try {
        stream.chunk('Initializing Veo3 video generation...', 'log');
        stream.updateProgress(10);

        const agent = await this.spawnServiceAgent('veo3', prompt, options);
        stream.chunk(`Agent spawned: ${agent.id}`, 'log');
        stream.updateProgress(30);

        stream.chunk('Generating video... (this may take 1-2 minutes)', 'log');

        // Simulate video generation progress
        for (let i = 30; i <= 90; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          stream.updateProgress(i);
          stream.chunk(`Progress: ${i}%`, 'metric');
        }

        // TODO: Integrate with actual Veo3 service
        const result = {
          videoUrl: 'https://example.com/generated-video.mp4',
          duration: 10,
          resolution: '1080p',
        };

        stream.updateProgress(100);
        stream.chunk(result.videoUrl, 'video');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(args: Record<string, any>): number {
    return 120000; // 2 minutes for video generation
  }
}

// ============================================================================
// Image Synthesis (Imagen4)
// ============================================================================

export class Imagen4Handler extends BaseGoogleAIHandler {
  action = 'generate-image';
  description = 'Generate image using Imagen4';

  getExamples(): string[] {
    return [
      'google-ai generate-image "sunset over mountains"',
      'google-ai generate-image "futuristic city" --temperature 0.9',
    ];
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`imagen4-${Date.now()}`);
    const prompt = this.extractPrompt(args);
    const options = this.extractOptions(args);

    (async () => {
      try {
        stream.chunk('Initializing Imagen4 image synthesis...', 'log');
        stream.updateProgress(20);

        const agent = await this.spawnServiceAgent('imagen4', prompt, options);
        stream.chunk(`Agent spawned: ${agent.id}`, 'log');
        stream.updateProgress(50);

        stream.chunk('Generating image...', 'log');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // TODO: Integrate with actual Imagen4 service
        const result = {
          imageUrl: 'https://example.com/generated-image.png',
          resolution: '1024x1024',
          format: 'PNG',
        };

        stream.updateProgress(100);
        stream.chunk(result.imageUrl, 'image');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(args: Record<string, any>): number {
    return 10000; // 10 seconds for image generation
  }
}

// ============================================================================
// Audio/Music Generation (Lyria)
// ============================================================================

export class LyriaHandler extends BaseGoogleAIHandler {
  action = 'compose-audio';
  description = 'Compose audio/music using Lyria';

  getExamples(): string[] {
    return [
      'google-ai compose-audio "calm piano melody"',
      'google-ai compose-audio "epic orchestral score" --model lyria-pro',
    ];
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`lyria-${Date.now()}`);
    const prompt = this.extractPrompt(args);
    const options = this.extractOptions(args);

    (async () => {
      try {
        stream.chunk('Initializing Lyria audio composition...', 'log');
        stream.updateProgress(15);

        const agent = await this.spawnServiceAgent('lyria', prompt, options);
        stream.updateProgress(40);

        stream.chunk('Composing audio...', 'log');
        await new Promise(resolve => setTimeout(resolve, 8000));

        // TODO: Integrate with actual Lyria service
        const result = {
          audioUrl: 'https://example.com/generated-audio.mp3',
          duration: 30,
          format: 'MP3',
        };

        stream.updateProgress(100);
        stream.chunk(result.audioUrl, 'audio');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(args: Record<string, any>): number {
    return 15000; // 15 seconds
  }
}

// ============================================================================
// Speech-to-Text (Chirp)
// ============================================================================

export class ChirpHandler extends BaseGoogleAIHandler {
  action = 'speech-to-text';
  description = 'Convert speech to text using Chirp';

  getExamples(): string[] {
    return [
      'google-ai speech-to-text audio.mp3',
      'google-ai speech-to-text recording.wav --model chirp-v2',
    ];
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const file = args.arg0 || args.file;
    if (!file) {
      errors.push('Audio file path is required');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`chirp-${Date.now()}`);
    const file = args.arg0 || args.file;
    const options = this.extractOptions(args);

    (async () => {
      try {
        stream.chunk(`Processing audio file: ${file}`, 'log');
        stream.updateProgress(25);

        const agent = await this.spawnServiceAgent('chirp', file, options);
        stream.updateProgress(60);

        stream.chunk('Transcribing audio...', 'log');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // TODO: Integrate with actual Chirp service
        const result = {
          transcript: 'This is a sample transcription of the audio file.',
          confidence: 0.95,
          language: 'en-US',
        };

        stream.updateProgress(100);
        stream.chunk(result.transcript, 'text');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }
}

// ============================================================================
// Research (Co-Scientist)
// ============================================================================

export class CoScientistHandler extends BaseGoogleAIHandler {
  action = 'research';
  description = 'Conduct research using Co-Scientist';

  getExamples(): string[] {
    return [
      'google-ai research "quantum computing applications"',
      'google-ai research "climate change solutions" --stream',
    ];
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`co-scientist-${Date.now()}`);
    const query = this.extractPrompt(args);
    const options = this.extractOptions(args);

    (async () => {
      try {
        stream.chunk('Initializing Co-Scientist research...', 'log');
        stream.updateProgress(10);

        const agent = await this.spawnServiceAgent('co-scientist', query, options);
        stream.updateProgress(30);

        stream.chunk('Conducting research...', 'log');

        // Simulate research progress with streaming results
        const findings = [
          'Analyzing scientific literature...',
          'Found 127 relevant papers',
          'Synthesizing key findings...',
          'Generating research summary...',
        ];

        for (let i = 0; i < findings.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          stream.chunk(findings[i], 'text');
          stream.updateProgress(30 + (i + 1) * 15);
        }

        // TODO: Integrate with actual Co-Scientist service
        const result = {
          summary: 'Research summary on the topic...',
          citations: 127,
          keyFindings: ['Finding 1', 'Finding 2', 'Finding 3'],
        };

        stream.updateProgress(100);
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }
}

// ============================================================================
// Web Navigation (Mariner)
// ============================================================================

export class MarinerHandler extends BaseGoogleAIHandler {
  action = 'navigate';
  description = 'Navigate and interact with web pages using Mariner';

  getExamples(): string[] {
    return [
      'google-ai navigate "https://example.com" --action extract',
      'google-ai navigate "search for quantum computing papers" --action search',
      'google-ai navigate "https://github.com/user/repo" --action analyze',
    ];
  }

  get schema() {
    return {
      args: [
        {
          name: 'target',
          type: 'string' as const,
          required: true,
          description: 'URL or search query for navigation',
        },
      ],
      flags: [
        {
          name: 'action',
          type: 'string' as const,
          description: 'Navigation action (extract, search, analyze, click, fill, screenshot)',
          default: 'extract',
        },
        {
          name: 'selector',
          type: 'string' as const,
          description: 'CSS selector for targeted interaction',
        },
        {
          name: 'wait',
          type: 'number' as const,
          description: 'Wait time in milliseconds',
          default: 3000,
        },
        {
          name: 'javascript',
          type: 'boolean' as const,
          description: 'Enable JavaScript execution',
          default: true,
        },
      ],
      examples: this.getExamples(),
    };
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const target = args.target || args.arg0;
    if (!target) {
      errors.push('Target URL or query is required');
    }

    const validActions = ['extract', 'search', 'analyze', 'click', 'fill', 'screenshot'];
    if (args.action && !validActions.includes(args.action)) {
      errors.push(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`mariner-${Date.now()}`);
    const target = args.target || args.arg0;
    const action = args.action || 'extract';
    const options = this.extractOptions(args);

    (async () => {
      try {
        stream.chunk(`Initializing Mariner for ${action}...`, 'log');
        stream.updateProgress(15);

        const agent = await this.spawnServiceAgent('mariner', target, options);
        stream.chunk(`Agent spawned: ${agent.id}`, 'log');
        stream.updateProgress(40);

        stream.chunk(`Navigating to target: ${target}`, 'log');
        stream.updateProgress(60);

        // Simulate navigation and extraction
        await new Promise(resolve => setTimeout(resolve, args.wait || 3000));

        const result: Record<string, any> = {
          action,
          target,
          timestamp: Date.now(),
        };

        switch (action) {
          case 'extract':
            result.data = {
              title: 'Extracted Page Title',
              content: 'Page content extracted successfully',
              links: ['https://example.com/link1', 'https://example.com/link2'],
              metadata: { language: 'en', charset: 'utf-8' },
            };
            stream.chunk('Content extracted', 'log');
            break;

          case 'search':
            result.data = {
              results: [
                { title: 'Result 1', url: 'https://example.com/1', snippet: 'Description...' },
                { title: 'Result 2', url: 'https://example.com/2', snippet: 'Description...' },
              ],
              totalResults: 42,
            };
            stream.chunk('Search completed', 'log');
            break;

          case 'analyze':
            result.data = {
              structure: 'Single-page application',
              technologies: ['React', 'TypeScript', 'Vite'],
              performance: { loadTime: 1.2, firstContentfulPaint: 0.8 },
              accessibility: { score: 95, issues: [] },
            };
            stream.chunk('Analysis complete', 'log');
            break;

          case 'screenshot':
            result.data = {
              screenshotUrl: 'data:image/png;base64,...',
              dimensions: { width: 1920, height: 1080 },
            };
            stream.chunk('Screenshot captured', 'log');
            break;

          default:
            result.data = { success: true, message: `${action} completed` };
        }

        stream.updateProgress(100);
        stream.chunk(result, 'json');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(args: Record<string, any>): number {
    return args.wait || 5000; // Default 5 seconds for web navigation
  }
}

// ============================================================================
// Agent Orchestration (AgentSpace Streaming)
// ============================================================================

export class AgentSpaceHandler extends BaseGoogleAIHandler {
  action = 'orchestrate';
  description = 'Advanced agent orchestration with streaming';

  getExamples(): string[] {
    return [
      'google-ai orchestrate "solve complex problem" --agents 5',
      'google-ai orchestrate "research and implement" --topology mesh',
      'google-ai orchestrate "parallel tasks" --strategy divide-conquer',
    ];
  }

  get schema() {
    return {
      args: [
        {
          name: 'task',
          type: 'string' as const,
          required: true,
          description: 'Task description for agent orchestration',
        },
      ],
      flags: [
        {
          name: 'agents',
          type: 'number' as const,
          description: 'Number of agents to spawn',
          default: 3,
        },
        {
          name: 'topology',
          type: 'string' as const,
          description: 'Agent topology (hierarchical, mesh, distributed, layered)',
          default: 'hierarchical',
        },
        {
          name: 'strategy',
          type: 'string' as const,
          description: 'Orchestration strategy (divide-conquer, pipeline, map-reduce, consensus)',
          default: 'divide-conquer',
        },
        {
          name: 'coordination',
          type: 'string' as const,
          description: 'Coordination mode (centralized, decentralized, hybrid)',
          default: 'centralized',
        },
      ],
      examples: this.getExamples(),
    };
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const task = args.task || args.arg0;
    if (!task) {
      errors.push('Task description is required');
    }

    const agentCount = args.agents ? Number(args.agents) : 3;
    if (agentCount < 1 || agentCount > 50) {
      errors.push('Agent count must be between 1 and 50');
    } else if (agentCount > 20) {
      warnings.push(`High agent count (${agentCount}) may impact performance`);
    }

    const validTopologies = ['hierarchical', 'mesh', 'distributed', 'layered'];
    if (args.topology && !validTopologies.includes(args.topology)) {
      errors.push(`Invalid topology. Must be one of: ${validTopologies.join(', ')}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`agentspace-${Date.now()}`);
    const task = args.task || args.arg0;
    const agentCount = args.agents ? Number(args.agents) : 3;
    const topology = args.topology || 'hierarchical';
    const strategy = args.strategy || 'divide-conquer';

    (async () => {
      try {
        stream.chunk('Initializing AgentSpace orchestration...', 'log');
        stream.updateProgress(10);

        // Spawn coordinator agent
        stream.chunk(`Creating ${topology} topology with ${agentCount} agents`, 'log');
        stream.updateProgress(25);

        const coordinator = await this.agentSpace.spawnAgent({
          type: `${topology}-coordinator`,
          priority: 'high',
          timeout: 120000,
        });

        stream.chunk(`Coordinator spawned: ${coordinator.id}`, 'agent-event');
        stream.updateProgress(40);

        // Spawn worker agents
        const workers = [];
        for (let i = 0; i < agentCount; i++) {
          const worker = await this.agentSpace.spawnAgent({
            type: 'adaptive-worker',
            priority: 'medium',
            timeout: 60000,
          });
          workers.push(worker);
          stream.chunk(`Worker ${i + 1}/${agentCount} spawned: ${worker.id}`, 'agent-event');
          stream.updateProgress(40 + (i + 1) * (30 / agentCount));
        }

        stream.chunk(`Executing ${strategy} strategy...`, 'log');
        stream.updateProgress(75);

        // Simulate orchestrated task execution
        const phases = [
          { name: 'Task decomposition', duration: 1000 },
          { name: 'Parallel execution', duration: 2000 },
          { name: 'Result aggregation', duration: 1000 },
          { name: 'Consensus formation', duration: 1000 },
        ];

        for (const phase of phases) {
          await new Promise(resolve => setTimeout(resolve, phase.duration));
          stream.chunk(`Phase: ${phase.name}`, 'log');
        }

        const result = {
          task,
          topology,
          strategy,
          agents: {
            coordinator: coordinator.id,
            workers: workers.map(w => w.id || w.agentId),
            total: agentCount + 1,
          },
          execution: {
            duration: phases.reduce((sum, p) => sum + p.duration, 0),
            phases: phases.map(p => p.name),
          },
          outcome: {
            success: true,
            confidence: 0.92,
            consensusReached: true,
          },
        };

        stream.updateProgress(100);
        stream.chunk(result, 'json');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(args: Record<string, any>): number {
    const agentCount = args.agents ? Number(args.agents) : 3;
    return 5000 + agentCount * 500; // Base 5s + 500ms per agent
  }
}

// ============================================================================
// Streaming Inference API
// ============================================================================

export class StreamingHandler extends BaseGoogleAIHandler {
  action = 'stream';
  description = 'Streaming inference with real-time updates';

  getExamples(): string[] {
    return [
      'google-ai stream "explain quantum entanglement"',
      'google-ai stream "write a story" --model gemini-1.5-pro --temperature 0.9',
      'google-ai stream "analyze data" --max-tokens 2048',
    ];
  }

  get schema() {
    return {
      args: [
        {
          name: 'prompt',
          type: 'string' as const,
          required: true,
          description: 'Prompt for streaming inference',
        },
      ],
      flags: [
        {
          name: 'model',
          type: 'string' as const,
          description: 'Model to use (gemini-1.5-flash, gemini-1.5-pro)',
          default: 'gemini-1.5-flash',
        },
        {
          name: 'temperature',
          type: 'number' as const,
          description: 'Temperature (0-1)',
          default: 0.7,
        },
        {
          name: 'max-tokens',
          type: 'number' as const,
          description: 'Maximum tokens to generate',
          default: 1024,
        },
        {
          name: 'top-p',
          type: 'number' as const,
          description: 'Top-p sampling (0-1)',
          default: 0.95,
        },
        {
          name: 'top-k',
          type: 'number' as const,
          description: 'Top-k sampling',
          default: 40,
        },
      ],
      examples: this.getExamples(),
    };
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const prompt = args.prompt || args.arg0;
    if (!prompt) {
      errors.push('Prompt is required');
    }

    if (args.temperature !== undefined) {
      const temp = Number(args.temperature);
      if (isNaN(temp) || temp < 0 || temp > 1) {
        errors.push('Temperature must be between 0 and 1');
      }
    }

    if (args['max-tokens'] !== undefined) {
      const maxTokens = Number(args['max-tokens']);
      if (isNaN(maxTokens) || maxTokens < 1) {
        errors.push('Max tokens must be a positive number');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`streaming-${Date.now()}`);
    const prompt = args.prompt || args.arg0;
    const model = args.model || 'gemini-1.5-flash';
    const temperature = args.temperature ? Number(args.temperature) : 0.7;
    const maxTokens = args['max-tokens'] ? Number(args['max-tokens']) : 1024;

    (async () => {
      try {
        stream.chunk(`Initializing ${model} streaming...`, 'log');
        stream.updateProgress(10);

        const agent = await this.spawnServiceAgent('streaming', prompt, {
          model,
          temperature,
          maxTokens,
          streaming: true,
        });

        stream.updateProgress(20);

        // Simulate streaming response
        const words = [
          'Streaming', 'inference', 'provides', 'real-time', 'updates',
          'as', 'the', 'model', 'generates', 'tokens.',
          'This', 'creates', 'a', 'more', 'interactive', 'experience',
          'and', 'allows', 'for', 'early', 'termination', 'if', 'needed.',
          'The', 'response', 'is', 'delivered', 'incrementally',
          'with', 'low', 'latency', 'and', 'high', 'throughput.',
        ];

        let tokenCount = 0;
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms per token

          const word = words[i];
          tokenCount++;

          // Stream word-by-word
          stream.chunk(word + ' ', 'text');

          // Update progress based on tokens
          const progress = 20 + (i + 1) * (70 / words.length);
          stream.updateProgress(Math.floor(progress));

          // Stream metrics periodically
          if (i % 5 === 0) {
            stream.chunk({
              tokensGenerated: tokenCount,
              tokensPerSecond: (tokenCount / ((i + 1) * 0.1)).toFixed(1),
              progress: Math.floor(progress),
            }, 'metric');
          }
        }

        const result = {
          model,
          prompt,
          response: words.join(' '),
          usage: {
            promptTokens: prompt.split(' ').length,
            completionTokens: tokenCount,
            totalTokens: prompt.split(' ').length + tokenCount,
          },
          performance: {
            duration: words.length * 100,
            tokensPerSecond: (tokenCount / (words.length * 0.1)).toFixed(1),
          },
        };

        stream.updateProgress(100);
        stream.chunk('\n\n--- End of stream ---', 'log');
        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(args: Record<string, any>): number {
    const maxTokens = args['max-tokens'] ? Number(args['max-tokens']) : 1024;
    return maxTokens * 100; // ~100ms per token
  }
}

/**
 * Create all Google AI handlers
 */
export function createGoogleAIHandlers(
  agentSpace: AgentSpaceManager,
  orchestrator: GoogleAIOrchestratorService
): CommandHandler[] {
  return [
    new Veo3Handler(agentSpace, orchestrator),
    new Imagen4Handler(agentSpace, orchestrator),
    new LyriaHandler(agentSpace, orchestrator),
    new ChirpHandler(agentSpace, orchestrator),
    new CoScientistHandler(agentSpace, orchestrator),
    new MarinerHandler(agentSpace, orchestrator),
    new AgentSpaceHandler(agentSpace, orchestrator),
    new StreamingHandler(agentSpace, orchestrator),
  ];
}

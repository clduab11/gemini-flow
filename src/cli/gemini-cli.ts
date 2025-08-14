/**
 * Gemini CLI
 *
 * Simplified command structure matching official Gemini CLI
 * Primary commands: chat, generate, list-models, auth
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as fs from "fs";
import { SimpleAuth } from "../core/simple-auth.js";
import { SimpleInteractive } from "./simple-interactive.js";
import { Logger } from "../utils/logger.js";

export interface GeminiCLIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  verbose?: boolean;
  json?: boolean;
  system?: string;
  file?: string;
  key?: string;
  test?: boolean;
  help?: boolean;
}

export interface GenerateResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  latency?: number;
}

export interface ModelInfo {
  name: string;
  description: string;
  maxTokens?: number;
  supportedFeatures?: string[];
}

export class GeminiCLI {
  private program: Command;
  private auth: SimpleAuth;
  private logger: Logger;

  // Available models
  private readonly availableModels = [
    {
      name: "gemini-1.5-flash",
      description: "Fast and versatile performance for diverse tasks",
      maxTokens: 1000000,
      supportedFeatures: ["text", "image", "audio", "video"],
    },
    {
      name: "gemini-1.5-pro",
      description: "Complex reasoning tasks requiring more intelligence",
      maxTokens: 2000000,
      supportedFeatures: ["text", "image", "audio", "video", "code"],
    },
    {
      name: "gemini-1.0-pro",
      description: "Natural language tasks, multi-turn text and code chat",
      maxTokens: 30720,
      supportedFeatures: ["text", "code"],
    },
  ];

  constructor() {
    this.program = new Command();
    this.auth = new SimpleAuth();
    this.logger = new Logger("GeminiCLI");

    this.setupProgram();
    this.setupCommands();
  }

  /**
   * Setup main program configuration
   */
  private setupProgram(): void {
    this.program
      .name("gemini")
      .description("Google Gemini AI CLI - Interactive AI Assistant")
      .version("1.1.0")
      .addHelpText(
        "before",
        chalk.cyan(`
╔══════════════════════════════════════════════════════════╗
║                   🤖 Gemini AI CLI                      ║
║           Powered by Google Generative AI               ║
╚══════════════════════════════════════════════════════════╝
`),
      );

    // Global options
    this.program
      .option("-m, --model <model>", "model to use", "gemini-1.5-flash")
      .option("-t, --temperature <temp>", "temperature (0-2)", parseFloat, 0.7)
      .option("--max-tokens <tokens>", "maximum tokens", parseInt, 1000000)
      .option("-v, --verbose", "verbose output")
      .option("--json", "JSON output format")
      .option("-s, --system <instruction>", "system instruction");
  }

  /**
   * Setup CLI commands
   */
  private setupCommands(): void {
    this.setupChatCommand();
    this.setupGenerateCommand();
    this.setupListModelsCommand();
    this.setupAuthCommand();
  }

  /**
   * Setup chat command (interactive mode)
   */
  private setupChatCommand(): void {
    const chatCommand = this.program
      .command("chat")
      .alias("c")
      .description("Start interactive conversation mode")
      .argument("[prompt]", "optional initial prompt")
      .option("--session <id>", "session ID for persistence")
      .option("--no-context", "disable context persistence")
      .action(async (prompt, options) => {
        const globalOptions = this.program.opts();
        const mergedOptions = { ...globalOptions, ...options };

        try {
          await this.executeChatCommand(prompt, mergedOptions);
        } catch (error) {
          this.handleError(error, mergedOptions);
        }
      });

    chatCommand.addHelpText(
      "after",
      `
Examples:
  gemini chat                           # Start interactive mode
  gemini chat "Hello, how are you?"     # Single prompt
  gemini chat --model gemini-1.5-pro   # Use specific model
  gemini chat --session my-session     # Resume/create session
    `,
    );
  }

  /**
   * Setup generate command (one-shot generation)
   */
  private setupGenerateCommand(): void {
    const generateCommand = this.program
      .command("generate")
      .alias("g")
      .description("Generate content from prompt")
      .argument("[prompt]", "text prompt to generate from")
      .option("-f, --file <path>", "read prompt from file")
      .option("--count <n>", "number of responses to generate", parseInt, 1)
      .action(async (prompt, options) => {
        const globalOptions = this.program.opts();
        const mergedOptions = { ...globalOptions, ...options };

        try {
          const result = await this.executeGenerateCommand(
            prompt,
            mergedOptions,
          );
          console.log(this.formatOutput(result.text, result, mergedOptions));
        } catch (error) {
          this.handleError(error, mergedOptions);
        }
      });

    generateCommand.addHelpText(
      "after",
      `
Examples:
  gemini generate "Write a haiku about AI"
  gemini generate --file prompt.txt
  gemini generate "Explain quantum computing" --model gemini-1.5-pro
  gemini generate "Create JSON schema" --json
    `,
    );
  }

  /**
   * Setup list-models command
   */
  private setupListModelsCommand(): void {
    this.program
      .command("list-models")
      .alias("models")
      .description("List available models")
      .option("--detailed", "show detailed model information")
      .action(async (options) => {
        const globalOptions = this.program.opts();
        const mergedOptions = { ...globalOptions, ...options };

        try {
          const models = await this.listModels();
          console.log(this.formatModelsList(models, mergedOptions));
        } catch (error) {
          this.handleError(error, mergedOptions);
        }
      });
  }

  /**
   * Setup auth command
   */
  private setupAuthCommand(): void {
    const authCommand = this.program
      .command("auth")
      .description("Manage authentication")
      .option("--key <apikey>", "set API key")
      .option("--test", "test current API key")
      .option("--status", "show authentication status")
      .option("--clear", "clear authentication")
      .action(async (options) => {
        try {
          const result = await this.executeAuthCommand(options);
          if (result) {
            console.log(result);
          }
        } catch (error) {
          this.handleError(error, options);
        }
      });

    authCommand.addHelpText(
      "after",
      `
Examples:
  gemini auth --status                  # Show auth status
  gemini auth --key AIzaSy...          # Set API key
  gemini auth --test                    # Test current API key
  gemini auth --clear                   # Clear authentication

Get your API key from: https://aistudio.google.com/app/apikey
    `,
    );
  }

  /**
   * Execute chat command
   */
  private async executeChatCommand(
    prompt?: string,
    options: GeminiCLIOptions = {},
  ): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      throw new Error(
        'Authentication required. Use "gemini auth --key YOUR_API_KEY" to set your API key.',
      );
    }

    // If prompt provided, handle as one-shot
    if (prompt) {
      const response = await this.generateContent(prompt, options);
      console.log(this.formatOutput(response.text, response, options));
      return;
    }

    // Start interactive mode
    const interactiveMode = new SimpleInteractive({
      model: options.model || "gemini-1.5-flash",
      maxTokens: options.maxTokens || 1000000,
      temperature: options.temperature || 0.7,
      sessionId: (options as any).session,
      verbose: options.verbose,
    });

    await interactiveMode.start();
  }

  /**
   * Execute generate command
   */
  private async executeGenerateCommand(
    prompt?: string,
    options: GeminiCLIOptions = {},
  ): Promise<GenerateResponse> {
    if (!this.auth.isAuthenticated()) {
      throw new Error(
        'Authentication required. Use "gemini auth --key YOUR_API_KEY" to set your API key.',
      );
    }

    let finalPrompt = prompt;

    // Read from file if specified
    if (options.file) {
      if (!fs.existsSync(options.file)) {
        throw new Error(`File not found: ${options.file}`);
      }
      finalPrompt = fs.readFileSync(options.file, "utf8");
    }

    if (!finalPrompt) {
      throw new Error(
        "Prompt is required. Provide prompt as argument or use --file option.",
      );
    }

    return await this.generateContent(finalPrompt, options);
  }

  /**
   * Execute auth command
   */
  private async executeAuthCommand(options: any): Promise<string | void> {
    if (options.key) {
      const success = this.auth.setApiKey(options.key);
      if (success) {
        await this.auth.saveConfig();
        return chalk.green("✅ API key set successfully");
      } else {
        throw new Error(
          'Invalid API key format. Key should start with "AIza" and be at least 35 characters long.',
        );
      }
    }

    if (options.test) {
      if (!this.auth.isAuthenticated()) {
        throw new Error("No API key found. Set one with --key option.");
      }

      const spinner = ora("Testing API key...").start();
      try {
        const isValid = await this.auth.testApiKey();
        if (isValid) {
          spinner.succeed("API key is valid and working");
        } else {
          spinner.fail("API key test failed");
        }
      } catch (error) {
        spinner.fail(
          `API key test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
      return;
    }

    if (options.clear) {
      this.auth.clearAuth();
      return chalk.yellow("Authentication cleared");
    }

    // Default: show status
    const status = this.auth.getAuthStatus();

    let output = chalk.blue("\n🔐 Authentication Status:\n\n");
    output += `Status: ${status.isAuthenticated ? chalk.green("✅ Authenticated") : chalk.red("❌ Not authenticated")}\n`;

    if (status.isAuthenticated) {
      output += `Source: ${status.source}\n`;
      output += `Key: ${status.keyPrefix}\n`;
      output += `Format: ${status.keyFormat === "valid" ? chalk.green("Valid") : chalk.red("Invalid")}\n`;
    }

    if (!status.isAuthenticated) {
      output += "\n" + this.auth.getAuthHelpMessage();
    }

    return output;
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(
    prompt: string,
    options: GeminiCLIOptions = {},
  ): Promise<GenerateResponse> {
    const startTime = performance.now();

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      const genAI = new GoogleGenerativeAI(this.auth.getApiKey()!);

      // Model configuration
      const modelConfig: any = {
        model: options.model || "gemini-1.5-flash",
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: Math.min(4096, (options.maxTokens || 1000000) / 4),
        },
      };

      // Add system instruction if provided
      if (options.system) {
        modelConfig.systemInstruction = options.system;
      }

      const model = genAI.getGenerativeModel(modelConfig);

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const endTime = performance.now();
      const latency = endTime - startTime;

      // Estimate token usage (approximation)
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(text);

      return {
        text,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        model: options.model || "gemini-1.5-flash",
        latency,
      };
    } catch (error) {
      this.logger.error("Content generation failed", error);

      if (error instanceof Error) {
        if (error.message.includes("API_KEY")) {
          throw new Error(
            'Invalid or missing API key. Use "gemini auth --key YOUR_API_KEY" to set your key.',
          );
        }
        if (error.message.includes("QUOTA")) {
          throw new Error(
            "API quota exceeded. Please check your usage limits.",
          );
        }
        if (error.message.includes("RATE_LIMIT")) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again.",
          );
        }
      }

      throw error;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelInfo[]> {
    return this.availableModels;
  }

  /**
   * Format output for display
   */
  formatOutput(
    text: string,
    response: GenerateResponse,
    options: GeminiCLIOptions = {},
  ): string {
    if (options.json) {
      return JSON.stringify(
        {
          response: text,
          usage: response.usage,
          model: response.model,
          latency: response.latency,
        },
        null,
        2,
      );
    }

    let output = text;

    if (options.verbose) {
      output += chalk.gray(`\n\n--- Details ---`);
      output += chalk.gray(`\nModel: ${response.model}`);
      output += chalk.gray(`\nLatency: ${response.latency?.toFixed(2)}ms`);
      output += chalk.gray(`\nPrompt tokens: ${response.usage.promptTokens}`);
      output += chalk.gray(
        `\nCompletion tokens: ${response.usage.completionTokens}`,
      );
      output += chalk.gray(`\nTotal tokens: ${response.usage.totalTokens}`);
    } else {
      output += chalk.gray(`\n\nTokens used: ${response.usage.totalTokens}`);
    }

    return output;
  }

  /**
   * Format models list for display
   */
  private formatModelsList(
    models: ModelInfo[],
    options: GeminiCLIOptions = {},
  ): string {
    if (options.json) {
      return JSON.stringify(models, null, 2);
    }

    let output = chalk.blue("\n📋 Available Models:\n\n");

    models.forEach((model) => {
      output += chalk.cyan(`${model.name}\n`);
      output += chalk.gray(`  ${model.description}\n`);

      if (options.verbose || (options as any).detailed) {
        output += chalk.gray(
          `  Max tokens: ${model.maxTokens?.toLocaleString()}\n`,
        );
        output += chalk.gray(
          `  Features: ${model.supportedFeatures?.join(", ")}\n`,
        );
      }

      output += "\n";
    });

    return output;
  }

  /**
   * Estimate token count (approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Parse command line options
   */
  parseOptions(args: string[]): GeminiCLIOptions {
    const options: GeminiCLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--model":
        case "-m":
          options.model = args[++i];
          break;
        case "--temperature":
        case "-t": {
          const temp = parseFloat(args[++i]);
          if (isNaN(temp) || temp < 0 || temp > 2) {
            throw new Error(
              "Invalid temperature value. Must be between 0 and 2.",
            );
          }
          options.temperature = temp;
          break;
        }
        case "--max-tokens": {
          const tokens = parseInt(args[++i]);
          if (isNaN(tokens) || tokens <= 0) {
            throw new Error(
              "Invalid max-tokens value. Must be a positive integer.",
            );
          }
          options.maxTokens = tokens;
          break;
        }
        case "--verbose":
        case "-v":
          options.verbose = true;
          break;
        case "--json":
          options.json = true;
          break;
        case "--system":
        case "-s":
          options.system = args[++i];
          break;
        case "--file":
        case "-f":
          options.file = args[++i];
          break;
      }
    }

    return options;
  }

  /**
   * Execute command programmatically
   */
  async executeCommand(
    command: string,
    args: string[],
    options: GeminiCLIOptions = {},
  ): Promise<string> {
    switch (command) {
      case "chat":
      case "c":
        await this.executeChatCommand(args[0], options);
        return "Interactive mode started";

      case "generate":
      case "g": {
        const response = await this.executeGenerateCommand(args[0], options);
        return this.formatOutput(response.text, response, options);
      }

      case "list-models":
      case "models": {
        const models = await this.listModels();
        return this.formatModelsList(models, options);
      }

      case "auth": {
        const result = await this.executeAuthCommand(options);
        return result || "";
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any, options: GeminiCLIOptions = {}): void {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (options.json) {
      console.error(JSON.stringify({ error: message }, null, 2));
    } else {
      console.error(chalk.red("Error:"), message);

      if (options.verbose && error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
    }

    process.exit(1);
  }

  /**
   * Get the commander program instance
   */
  getProgram(): Command {
    return this.program;
  }

  /**
   * Parse and execute CLI
   */
  async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      this.handleError(error, this.program.opts());
    }
  }
}

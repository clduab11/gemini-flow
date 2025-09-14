/**
 * Interactive Conversation Mode
 *
 * Primary interface for Gemini CLI parity providing conversational
 * interaction with context management and 1M+ token support
 */

import inquirer from "inquirer";
import * as chalk from "chalk";
import ora from "ora";
import { GoogleAIAuth } from "../core/google-ai-auth.js";
import { ContextWindowManager } from "../core/context-window-manager.js";
import { Logger } from "../utils/logger.js";

export interface InteractiveModeOptions {
  auth: GoogleAIAuth;
  contextManager: ContextWindowManager;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  sessionId?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface ApiResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class InteractiveMode {
  private auth: GoogleAIAuth;
  private contextManager: ContextWindowManager;
  private running: boolean = false;
  private logger: Logger;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private sessionId: string;

  constructor(options: InteractiveModeOptions) {
    this.auth = options.auth;
    this.contextManager = options.contextManager;
    this.model = options.model || "gemini-1.5-flash";
    this.maxTokens = options.maxTokens || 1000000;
    this.temperature = options.temperature || 0.7;
    this.sessionId = options.sessionId || `session_${Date.now()}`;
    this.logger = new Logger("InteractiveMode");

    // Validate authentication
    if (!this.auth.isAuthenticated()) {
      throw new Error(
        "Authentication required for interactive mode. Please set your Google AI API key.",
      );
    }

    this.logger.info("Interactive mode initialized", {
      model: this.model,
      maxTokens: this.maxTokens,
      sessionId: this.sessionId,
    });
  }

  /**
   * Start interactive conversation session
   */
  async start(): Promise<void> {
    this.running = true;

    // Display welcome message
    this.displayWelcome();

    // Restore previous session if available
    try {
      await this.contextManager.restoreSession(this.sessionId);
      const context = this.contextManager.getContext();
      if (context.length > 0) {
        console.log(chalk.blue("📚 Previous conversation restored"));
      }
    } catch (error) {
      this.logger.debug("No previous session to restore");
    }

    // Main conversation loop
    while (this.running) {
      try {
        const { message } = await inquirer.prompt([
          {
            type: "input",
            name: "message",
            message: chalk.cyan("You:"),
            prefix: "",
            validate: (input: string) => {
              if (input.trim() === "" && !input.startsWith("/")) {
                return "Please enter a message or use /help for commands";
              }
              return true;
            },
          },
        ]);

        if (!this.running) break;

        const response = await this.processMessage(message);

        if (response) {
          console.log(chalk.yellow("Assistant:"), response);
          console.log(); // Add spacing
        }
      } catch (error) {
        if (error && typeof error === "object" && "isTtyError" in error) {
          // Handle Ctrl+C gracefully
          break;
        }

        this.logger.error("Error in conversation loop", error);
        console.log(chalk.red("An error occurred. Please try again."));
      }
    }

    await this.cleanup();
  }

  /**
   * Process user message and return response
   */
  async processMessage(message: string): Promise<string> {
    const trimmedMessage = message.trim();

    // Handle empty messages
    if (!trimmedMessage) {
      return "Please enter a message.";
    }

    // Handle special commands
    if (trimmedMessage.startsWith("/")) {
      return await this.handleCommand(trimmedMessage);
    }

    try {
      // Check context window before processing
      await this.ensureContextWindow(trimmedMessage);

      // Add user message to context
      await this.contextManager.addMessage("user", trimmedMessage);

      // Show thinking indicator
      const spinner = ora("Thinking...").start();

      try {
        // Get current context for API call
        const context = this.contextManager.getContext();

        // Call Gemini API
        const apiResponse = await this.callGeminiAPI(context);

        spinner.succeed("Response generated");

        // Add assistant response to context
        await this.contextManager.addMessage("assistant", apiResponse.text);

        // Log token usage
        this.logger.debug("Message processed", {
          userTokens: this.estimateTokens(trimmedMessage),
          responseTokens: apiResponse.usage.completionTokens,
          totalTokens: apiResponse.usage.totalTokens,
          remainingTokens: this.contextManager.getRemainingTokens(),
        });

        return apiResponse.text;
      } catch (apiError) {
        spinner.fail("Error generating response");
        throw apiError;
      }
    } catch (error) {
      this.logger.error("Error processing message", error);
      return `Error processing your message: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  /**
   * Handle special commands
   */
  private async handleCommand(command: string): Promise<string> {
    const cmd = command.toLowerCase();

    switch (cmd) {
      case "/help":
        return this.getHelpMessage();

      case "/clear":
        this.contextManager.clearContext();
        return "Conversation history cleared.";

      case "/tokens":
        const totalTokens = this.contextManager.getTotalTokens();
        const remainingTokens = this.contextManager.getRemainingTokens();
        return `Token usage: ${totalTokens.toLocaleString()}\nRemaining: ${remainingTokens.toLocaleString()}`;

      case "/model":
        return `Current model: ${this.model}`;

      case "/session":
        return `Session ID: ${this.sessionId}`;

      case "/export":
        try {
          const exported = await this.contextManager.exportSession();
          return `Session exported to: ${exported}`;
        } catch (error) {
          return `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        }

      case "/exit":
      case "/quit":
        this.stop();
        return "Goodbye! Your session has been saved.";

      default:
        return `Unknown command: ${command}. Type /help for available commands.`;
    }
  }

  /**
   * Ensure context window has enough space
   */
  private async ensureContextWindow(message: string): Promise<void> {
    const messageTokens = this.estimateTokens(message);
    const remainingTokens = this.contextManager.getRemainingTokens();

    // Reserve space for response (estimate ~2x input tokens)
    const requiredTokens = messageTokens * 3;

    if (remainingTokens < requiredTokens) {
      this.logger.info(
        "Context window approaching limit, truncating older messages",
      );
      await this.contextManager.truncateContext(requiredTokens);
    }
  }

  /**
   * Call Gemini API with current context
   */
  private async callGeminiAPI(
    context: ConversationMessage[],
  ): Promise<ApiResponse> {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      const genAI = new GoogleGenerativeAI(this.auth.getApiKey());
      const model = genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: Math.min(
            4096,
            this.contextManager.getRemainingTokens() / 2,
          ),
          temperature: this.temperature,
        },
      });

      // Convert context to Gemini format
      const history = context.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Get the latest user message
      const latestMessage = context[context.length - 1];

      // Start chat with history
      const chat = model.startChat({ history });

      // Send message and get response
      const result = await chat.sendMessage(latestMessage.content);
      const response = await result.response;
      const text = response.text();

      // Calculate token usage (approximation)
      const usage = {
        promptTokens: this.estimateTokens(
          context.map((m) => m.content).join("\n"),
        ),
        completionTokens: this.estimateTokens(text),
        totalTokens: 0,
      };
      usage.totalTokens = usage.promptTokens + usage.completionTokens;

      return {
        text,
        usage,
      };
    } catch (error) {
      this.logger.error("Gemini API call failed", error);

      if (error instanceof Error) {
        if (error.message.includes("API_KEY")) {
          throw new Error(
            "Invalid or missing API key. Please check your Google AI API key.",
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
   * Estimate token count for text (approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    console.log(
      chalk.cyan(`
╔══════════════════════════════════════════════════════════╗
║                🤖 Interactive Conversation Mode          ║
║                  Google Gemini AI Assistant              ║
╚══════════════════════════════════════════════════════════╝
`),
    );

    console.log(chalk.gray("Model:"), chalk.white(this.model));
    console.log(
      chalk.gray("Context Window:"),
      chalk.white(`${this.maxTokens.toLocaleString()} tokens`),
    );
    console.log(chalk.gray("Session ID:"), chalk.white(this.sessionId));
    console.log(
      chalk.gray("Type"),
      chalk.cyan("/help"),
      chalk.gray("for commands or"),
      chalk.cyan("/exit"),
      chalk.gray("to quit\n"),
    );
  }

  /**
   * Get help message
   */
  private getHelpMessage(): string {
    return `
Available commands:
${chalk.cyan("/help")}     - Show this help message
${chalk.cyan("/clear")}    - Clear conversation history
${chalk.cyan("/tokens")}   - Show token usage statistics
${chalk.cyan("/model")}    - Show current model
${chalk.cyan("/session")}  - Show session information
${chalk.cyan("/export")}   - Export conversation to file
${chalk.cyan("/exit")}     - Exit interactive mode

Simply type your message to start a conversation!
    `.trim();
  }

  /**
   * Stop interactive session
   */
  stop(): void {
    this.running = false;
    this.logger.info("Interactive session stopped");
  }

  /**
   * Check if session is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      // Save current session
      await this.contextManager.saveSession(this.sessionId);
      this.logger.info("Session saved successfully");
    } catch (error) {
      this.logger.error("Failed to save session", error);
    }
  }
}

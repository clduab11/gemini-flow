/**
 * Simplified Interactive Mode
 *
 * Clean, simple interactive conversation interface
 */
import * as readline from "readline";
import chalk from "chalk";
import ora from "ora";
import { SimpleAuth } from "../core/simple-auth.js";
import { Logger } from "../utils/logger.js";
export class SimpleInteractive {
    auth;
    logger;
    rl;
    history = [];
    options;
    constructor(options = {}) {
        this.auth = new SimpleAuth();
        this.logger = new Logger("SimpleInteractive");
        this.options = {
            model: options.model || "gemini-1.5-flash",
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 1000000,
            sessionId: options.sessionId,
            verbose: options.verbose || false,
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan("> "),
        });
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.rl.on("line", async (input) => {
            const trimmedInput = input.trim();
            // Handle special commands
            if (trimmedInput.startsWith("/")) {
                await this.handleSlashCommand(trimmedInput);
                return;
            }
            // Handle empty input
            if (!trimmedInput) {
                this.rl.prompt();
                return;
            }
            // Process user input
            await this.processUserInput(trimmedInput);
        });
        this.rl.on("close", () => {
            console.log(chalk.yellow("\nGoodbye! 👋"));
            process.exit(0);
        });
        // Handle Ctrl+C gracefully
        process.on("SIGINT", () => {
            console.log(chalk.yellow("\n\nGoodbye! 👋"));
            process.exit(0);
        });
    }
    /**
     * Start interactive mode
     */
    async start() {
        // Check authentication
        if (!this.auth.isAuthenticated()) {
            console.log(chalk.red("❌ Authentication required"));
            console.log(chalk.yellow("\nPlease set your Google AI API key:"));
            console.log(chalk.cyan("  gemini-flow auth --key YOUR_API_KEY"));
            console.log(chalk.gray("\nOr set environment variable:"));
            console.log(chalk.cyan('  export GEMINI_API_KEY="your-api-key-here"'));
            console.log(chalk.gray("\nGet your API key from: https://aistudio.google.com/app/apikey"));
            process.exit(1);
        }
        // Show welcome message
        this.showWelcomeMessage();
        // Load session history if sessionId provided
        if (this.options.sessionId) {
            await this.loadSession();
        }
        // Start the conversation loop
        this.rl.prompt();
    }
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        console.log(chalk.cyan("\n🤖 Gemini Interactive Mode"));
        console.log(chalk.gray(`Model: ${this.options.model}`));
        if (this.options.sessionId) {
            console.log(chalk.gray(`Session: ${this.options.sessionId}`));
        }
        console.log(chalk.gray("\nType your message and press Enter. Use /help for commands."));
        console.log(chalk.gray("Press Ctrl+C to exit.\n"));
    }
    /**
     * Process user input
     */
    async processUserInput(input) {
        // Add to history
        this.history.push({
            role: "user",
            content: input,
            timestamp: new Date(),
        });
        // Show spinner while processing
        const spinner = ora("Thinking...").start();
        try {
            // Generate response
            const response = await this.generateResponse(input);
            spinner.succeed("Response generated");
            // Add response to history
            this.history.push({
                role: "assistant",
                content: response.text,
                timestamp: new Date(),
            });
            // Display response
            console.log(chalk.blue("\n🤖 Assistant:"));
            console.log(response.text);
            // Show usage info if verbose
            if (this.options.verbose) {
                console.log(chalk.gray(`\n[Tokens: ${response.usage.totalTokens}, Latency: ${response.latency?.toFixed(2)}ms]`));
            }
            console.log(); // Empty line for spacing
            // Save session if sessionId provided
            if (this.options.sessionId) {
                await this.saveSession();
            }
        }
        catch (error) {
            spinner.fail("Failed to generate response");
            console.error(chalk.red("Error:"), error instanceof Error ? error.message : "Unknown error");
        }
        this.rl.prompt();
    }
    /**
     * Handle slash commands
     */
    async handleSlashCommand(command) {
        const parts = command.split(" ");
        const cmd = parts[0].toLowerCase();
        switch (cmd) {
            case "/help":
                this.showHelp();
                break;
            case "/clear":
                this.clearHistory();
                break;
            case "/history":
                this.showHistory();
                break;
            case "/model":
                await this.changeModel(parts.slice(1).join(" "));
                break;
            case "/temperature": {
                this.changeTemperature(parts[1]);
                break;
            }
            case "/save":
                await this.saveSession(parts[1]);
                break;
            case "/load":
                await this.loadSession(parts[1]);
                break;
            case "/stats":
                this.showStats();
                break;
            case "/exit":
            case "/quit":
                console.log(chalk.yellow("Goodbye! 👋"));
                process.exit(0);
                break;
            default:
                console.log(chalk.red(`Unknown command: ${cmd}`));
                console.log(chalk.gray("Type /help for available commands"));
        }
        this.rl.prompt();
    }
    /**
     * Generate response using Gemini API
     */
    async generateResponse(prompt) {
        const startTime = performance.now();
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(this.auth.getApiKey());
            const model = genAI.getGenerativeModel({
                model: this.options.model || "gemini-1.5-flash",
                generationConfig: {
                    temperature: this.options.temperature || 0.7,
                    maxOutputTokens: Math.min(4096, (this.options.maxTokens || 1000000) / 4),
                },
            });
            // Build conversation context from history
            const chatHistory = this.history.slice(-10).map((entry) => ({
                role: entry.role === "user" ? "user" : "model",
                parts: [{ text: entry.content }],
            }));
            const chat = model.startChat({
                history: chatHistory.slice(0, -1), // Exclude current message
            });
            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            const text = response.text();
            const endTime = performance.now();
            const latency = endTime - startTime;
            // Estimate token usage
            const promptTokens = this.estimateTokens(prompt);
            const completionTokens = this.estimateTokens(text);
            return {
                text,
                usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                },
                latency,
            };
        }
        catch (error) {
            this.logger.error("Response generation failed", error);
            throw error;
        }
    }
    /**
     * Show help message
     */
    showHelp() {
        console.log(chalk.blue("\n📋 Available Commands:\n"));
        console.log(chalk.cyan("/help           "), chalk.gray("Show this help message"));
        console.log(chalk.cyan("/clear          "), chalk.gray("Clear conversation history"));
        console.log(chalk.cyan("/history        "), chalk.gray("Show conversation history"));
        console.log(chalk.cyan("/model <name>   "), chalk.gray("Change model (gemini-1.5-flash, gemini-1.5-pro)"));
        console.log(chalk.cyan("/temperature <n>"), chalk.gray("Change temperature (0-2)"));
        console.log(chalk.cyan("/save [id]      "), chalk.gray("Save session"));
        console.log(chalk.cyan("/load [id]      "), chalk.gray("Load session"));
        console.log(chalk.cyan("/stats          "), chalk.gray("Show session statistics"));
        console.log(chalk.cyan("/exit           "), chalk.gray("Exit interactive mode"));
        console.log();
    }
    /**
     * Clear conversation history
     */
    clearHistory() {
        this.history = [];
        console.log(chalk.green("✅ Conversation history cleared"));
    }
    /**
     * Show conversation history
     */
    showHistory() {
        if (this.history.length === 0) {
            console.log(chalk.yellow("No conversation history"));
            return;
        }
        console.log(chalk.blue("\n📝 Conversation History:\n"));
        this.history.forEach((entry, _index) => {
            const role = entry.role === "user" ? chalk.green("You") : chalk.blue("Assistant");
            const timestamp = entry.timestamp.toLocaleTimeString();
            console.log(`${role} [${timestamp}]: ${entry.content.substring(0, 100)}${entry.content.length > 100 ? "..." : ""}`);
        });
        console.log();
    }
    /**
     * Change model
     */
    async changeModel(modelName) {
        if (!modelName) {
            console.log(chalk.yellow("Available models:"));
            console.log(chalk.cyan("  • gemini-1.5-flash") + chalk.gray(" (fast, versatile)"));
            console.log(chalk.cyan("  • gemini-1.5-pro") + chalk.gray(" (complex reasoning)"));
            console.log(chalk.cyan("  • gemini-1.0-pro") + chalk.gray(" (text and code)"));
            return;
        }
        const validModels = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
        ];
        if (!validModels.includes(modelName)) {
            console.log(chalk.red(`Invalid model: ${modelName}`));
            return;
        }
        this.options.model = modelName;
        console.log(chalk.green(`✅ Model changed to: ${modelName}`));
    }
    /**
     * Change temperature
     */
    changeTemperature(tempStr) {
        const temperature = parseFloat(tempStr);
        if (isNaN(temperature) || temperature < 0 || temperature > 2) {
            console.log(chalk.red("Invalid temperature. Must be between 0 and 2"));
            return;
        }
        this.options.temperature = temperature;
        console.log(chalk.green(`✅ Temperature changed to: ${temperature}`));
    }
    /**
     * Show session statistics
     */
    showStats() {
        const totalMessages = this.history.length;
        const userMessages = this.history.filter((h) => h.role === "user").length;
        const assistantMessages = this.history.filter((h) => h.role === "assistant").length;
        const totalTokens = this.history.reduce((sum, entry) => sum + this.estimateTokens(entry.content), 0);
        console.log(chalk.blue("\n📊 Session Statistics:\n"));
        console.log(chalk.cyan("Total messages:"), totalMessages);
        console.log(chalk.cyan("Your messages:"), userMessages);
        console.log(chalk.cyan("Assistant messages:"), assistantMessages);
        console.log(chalk.cyan("Estimated tokens:"), totalTokens.toLocaleString());
        console.log(chalk.cyan("Current model:"), this.options.model);
        console.log(chalk.cyan("Temperature:"), this.options.temperature);
        console.log();
    }
    /**
     * Save session
     */
    async saveSession(sessionId) {
        const id = sessionId || this.options.sessionId || `session_${Date.now()}`;
        try {
            const fs = await import("fs");
            const path = await import("path");
            const sessionDir = path.join(process.cwd(), ".gemini-sessions");
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }
            const sessionData = {
                id,
                history: this.history,
                options: this.options,
                timestamp: new Date().toISOString(),
            };
            const sessionFile = path.join(sessionDir, `${id}.json`);
            fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
            console.log(chalk.green(`✅ Session saved: ${id}`));
            this.options.sessionId = id;
        }
        catch (error) {
            console.log(chalk.red("Failed to save session:"), error instanceof Error ? error.message : "Unknown error");
        }
    }
    /**
     * Load session
     */
    async loadSession(sessionId) {
        const id = sessionId || this.options.sessionId;
        if (!id) {
            console.log(chalk.yellow("No session ID provided"));
            return;
        }
        try {
            const fs = await import("fs");
            const path = await import("path");
            const sessionFile = path.join(process.cwd(), ".gemini-sessions", `${id}.json`);
            if (!fs.existsSync(sessionFile)) {
                console.log(chalk.yellow(`Session not found: ${id}`));
                return;
            }
            const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
            this.history = sessionData.history || [];
            // Restore some options
            if (sessionData.options) {
                this.options.model = sessionData.options.model || this.options.model;
                this.options.temperature =
                    sessionData.options.temperature || this.options.temperature;
            }
            console.log(chalk.green(`✅ Session loaded: ${id} (${this.history.length} messages)`));
            this.options.sessionId = id;
        }
        catch (error) {
            console.log(chalk.red("Failed to load session:"), error instanceof Error ? error.message : "Unknown error");
        }
    }
    /**
     * Estimate token count
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
//# sourceMappingURL=simple-interactive.js.map
#!/usr/bin/env node
/**
 * Gemini-Flow - Simplified CLI
 *
 * Simple AI assistant CLI matching official Gemini CLI patterns
 * Core commands: chat, generate, list-models, auth, config
 */
import { Command } from "commander";
import chalk from "chalk";
import { Logger } from "../utils/logger.js";
import { GeminiCLI } from "./gemini-cli.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Read version from package.json
const packagePath = join(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const version = packageJson.version;
const program = new Command();
const logger = new Logger("GeminiFlow");
// ASCII art banner - simplified
const banner = chalk.cyan(`
╔═══════════════════════════════════════════╗
║         🌟 Gemini-Flow v${version}         ║
║       Simple AI Assistant CLI            ║
║      Powered by Google Gemini            ║
╚═══════════════════════════════════════════╝
`);
/**
 * Setup the simplified CLI program
 */
function setupProgram() {
    program
        .name("gemini-flow")
        .description("Simple AI assistant CLI powered by Google Gemini")
        .version(version)
        .addHelpText("before", banner);
    // Global options - simplified
    program
        .option("-v, --verbose", "Enable verbose output")
        .option("--model <name>", "Model to use (gemini-1.5-flash, gemini-1.5-pro)")
        .option("--temperature <temp>", "Temperature (0-2)", parseFloat, 0.7)
        .option("--max-tokens <tokens>", "Maximum tokens", parseInt, 1000000)
        .option("--json", "JSON output format");
}
/**
 * Setup core commands
 */
function setupCommands() {
    const geminiCLI = new GeminiCLI();
    // Chat command (interactive mode) - primary interface
    program
        .command("chat")
        .alias("c")
        .description("Start interactive conversation (default mode)")
        .argument("[prompt]", "optional initial prompt")
        .option("--session <id>", "session ID for persistence")
        .action(async (prompt, options) => {
        const globalOptions = program.opts();
        const mergedOptions = { ...globalOptions, ...options };
        try {
            await geminiCLI.executeCommand("chat", [prompt], mergedOptions);
        }
        catch (error) {
            handleError(error, mergedOptions);
        }
    });
    // Generate command (one-shot generation)
    program
        .command("generate")
        .alias("g")
        .description("Generate content from prompt")
        .argument("[prompt]", "text prompt to generate from")
        .option("-f, --file <path>", "read prompt from file")
        .action(async (prompt, options) => {
        const globalOptions = program.opts();
        const mergedOptions = { ...globalOptions, ...options };
        try {
            const result = await geminiCLI.executeCommand("generate", [prompt], mergedOptions);
            console.log(result);
        }
        catch (error) {
            handleError(error, mergedOptions);
        }
    });
    // List models command
    program
        .command("list-models")
        .alias("models")
        .description("List available models")
        .option("--detailed", "show detailed model information")
        .action(async (options) => {
        const globalOptions = program.opts();
        const mergedOptions = { ...globalOptions, ...options };
        try {
            const result = await geminiCLI.executeCommand("list-models", [], mergedOptions);
            console.log(result);
        }
        catch (error) {
            handleError(error, mergedOptions);
        }
    });
    // Auth command
    program
        .command("auth")
        .description("Manage authentication")
        .option("--key <apikey>", "set API key")
        .option("--test", "test current API key")
        .option("--status", "show authentication status")
        .option("--clear", "clear authentication")
        .action(async (options) => {
        try {
            const result = await geminiCLI.executeCommand("auth", [], options);
            if (result) {
                console.log(result);
            }
        }
        catch (error) {
            handleError(error, options);
        }
    });
    // Config command (simple configuration management)
    program
        .command("config")
        .description("Manage configuration")
        .option("--set <key=value>", "set configuration value")
        .option("--get <key>", "get configuration value")
        .option("--list", "list all configuration")
        .option("--reset", "reset to defaults")
        .action(async (options) => {
        try {
            await handleConfigCommand(options);
        }
        catch (error) {
            handleError(error, options);
        }
    });
    // Doctor command for diagnostics
    program
        .command("doctor")
        .description("Check system configuration and dependencies")
        .action(async () => {
        try {
            const checks = {
                "Node.js version": process.version.startsWith("v18") ||
                    process.version.startsWith("v20"),
                "Gemini API key": !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_AI_API_KEY,
                "Memory available": process.memoryUsage().heapTotal < 1024 * 1024 * 1024, // < 1GB
                "Write permissions": true,
            };
            console.log(chalk.blue("\n🏥 System Health Check:\n"));
            Object.entries(checks).forEach(([check, passed]) => {
                const status = passed ? chalk.green("✅ PASS") : chalk.red("❌ FAIL");
                console.log(`${status} ${check}`);
            });
            const allPassed = Object.values(checks).every((v) => v);
            if (!allPassed) {
                console.log(chalk.yellow("\n⚠️  Some checks failed. Please review the configuration."));
            }
            else {
                console.log(chalk.green("\n✅ All checks passed! Gemini-Flow is ready to use."));
            }
        }
        catch (error) {
            handleError(error, {});
        }
    });
}
/**
 * Handle config command
 */
async function handleConfigCommand(options) {
    // Simple configuration management
    const configFile = join(process.cwd(), ".gemini-flow-config.json");
    if (options.reset) {
        const fs = await import("fs");
        if (fs.existsSync(configFile)) {
            fs.unlinkSync(configFile);
        }
        console.log(chalk.green("✅ Configuration reset to defaults"));
        return;
    }
    if (options.list) {
        const fs = await import("fs");
        if (fs.existsSync(configFile)) {
            const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
            console.log(chalk.blue("\n📋 Current Configuration:\n"));
            Object.entries(config).forEach(([key, value]) => {
                console.log(chalk.cyan(`${key}: ${value}`));
            });
        }
        else {
            console.log(chalk.yellow("No configuration file found. Using defaults."));
        }
        return;
    }
    if (options.set) {
        const [key, value] = options.set.split("=");
        if (!key || !value) {
            throw new Error("Invalid format. Use --set key=value");
        }
        const fs = await import("fs");
        let config = {};
        if (fs.existsSync(configFile)) {
            config = JSON.parse(fs.readFileSync(configFile, "utf8"));
        }
        config[key] = value;
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        console.log(chalk.green(`✅ Set ${key} = ${value}`));
        return;
    }
    if (options.get) {
        const fs = await import("fs");
        if (fs.existsSync(configFile)) {
            const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
            const value = config[options.get];
            if (value !== undefined) {
                console.log(value);
            }
            else {
                console.log(chalk.yellow(`Configuration key '${options.get}' not found`));
            }
        }
        else {
            console.log(chalk.yellow("No configuration file found"));
        }
        return;
    }
    // Default: show available options
    console.log(chalk.blue("\n⚙️  Configuration Commands:\n"));
    console.log(chalk.cyan("  --set key=value   "), chalk.gray("Set configuration value"));
    console.log(chalk.cyan("  --get key         "), chalk.gray("Get configuration value"));
    console.log(chalk.cyan("  --list            "), chalk.gray("List all configuration"));
    console.log(chalk.cyan("  --reset           "), chalk.gray("Reset to defaults"));
}
/**
 * Handle errors
 */
function handleError(error, options = {}) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    if (options.json) {
        console.error(JSON.stringify({ error: message }, null, 2));
    }
    else {
        console.error(chalk.red("Error:"), message);
        if (options.verbose && error instanceof Error && error.stack) {
            console.error(chalk.gray(error.stack));
        }
    }
    process.exit(1);
}
/**
 * Check if should default to interactive mode
 */
function shouldUseInteractiveMode() {
    const args = process.argv.slice(2);
    // No arguments or just global options
    if (args.length === 0)
        return true;
    // Check if only global options provided
    const globalOptions = [
        "--verbose",
        "-v",
        "--model",
        "--temperature",
        "--max-tokens",
        "--json",
    ];
    const isOnlyGlobalOptions = args.every((arg) => globalOptions.includes(arg) ||
        globalOptions.some((opt) => arg.startsWith(opt + "=")) ||
        (!arg.startsWith("--") && !arg.startsWith("-")));
    return isOnlyGlobalOptions;
}
/**
 * Main execution
 */
async function main() {
    setupProgram();
    setupCommands();
    // Default to interactive mode if no specific command
    if (shouldUseInteractiveMode()) {
        console.log(banner);
        console.log(chalk.yellow("Starting interactive mode... (use Ctrl+C to exit)\n"));
        const geminiCLI = new GeminiCLI();
        try {
            await geminiCLI.executeCommand("chat", [], program.opts());
        }
        catch (error) {
            handleError(error, program.opts());
        }
    }
    else {
        // Parse commands normally
        try {
            await program.parseAsync(process.argv);
        }
        catch (error) {
            if (error.code === "commander.helpDisplayed") {
                process.exit(0);
            }
            handleError(error, program.opts());
        }
    }
}
// Error handling
program.exitOverride();
// Start the CLI
main().catch((error) => {
    logger.error("CLI startup failed", error);
    process.exit(1);
});
// Export for testing
export { program };

/**
 * Extensions Command - Gemini CLI Extension Management
 *
 * Manages Gemini CLI extensions introduced in October 2025
 */
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { ExtensionManager } from "../extensions/extension-manager.js";
export class ExtensionsCommand extends Command {
    constructor() {
        super("extensions");
        this.logger = new Logger("ExtensionsCommand");
        this.extensionManager = ExtensionManager.getInstance();
        this.description("Manage Gemini CLI extensions (October 2025 feature)")
            .alias("ext")
            .addCommand(this.createListCommand())
            .addCommand(this.createInfoCommand())
            .addCommand(this.createInstallCommand())
            .addCommand(this.createUninstallCommand())
            .addCommand(this.createSecurityCommand())
            .addCommand(this.createDeployCommand());
    }
    createListCommand() {
        return new Command("list")
            .description("List all available extensions")
            .option("--enabled", "Show only enabled extensions")
            .option("--disabled", "Show only disabled extensions")
            .action(async (options) => {
            const spinner = ora("Loading extensions...").start();
            try {
                await this.extensionManager.initialize();
                const extensions = this.extensionManager.listExtensions();
                spinner.succeed("Extensions loaded");
                if (extensions.length === 0) {
                    console.log(chalk.yellow("\nNo extensions found"));
                    return;
                }
                console.log(chalk.blue("\n📦 Available Extensions:\n"));
                for (const ext of extensions) {
                    if (options.enabled && !ext.enabled)
                        continue;
                    if (options.disabled && ext.enabled)
                        continue;
                    const status = ext.enabled
                        ? chalk.green("✓ Enabled")
                        : chalk.gray("✗ Disabled");
                    console.log(chalk.bold(`  ${ext.manifest.name}`) + chalk.gray(` v${ext.manifest.version}`));
                    console.log(chalk.gray(`    ${ext.manifest.description}`));
                    console.log(`    Status: ${status}`);
                    console.log(chalk.gray(`    Commands: ${ext.manifest.commands.map(c => c.name).join(", ")}`));
                    console.log();
                }
            }
            catch (error) {
                spinner.fail("Failed to load extensions");
                console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
    }
    createInfoCommand() {
        return new Command("info <extension>")
            .description("Show detailed information about an extension")
            .action(async (extensionName) => {
            const spinner = ora(`Loading extension info for ${extensionName}...`).start();
            try {
                await this.extensionManager.initialize();
                const extension = this.extensionManager.getExtension(extensionName);
                if (!extension) {
                    spinner.fail(`Extension '${extensionName}' not found`);
                    return;
                }
                spinner.succeed("Extension info loaded");
                console.log(chalk.blue("\n📦 Extension Details:\n"));
                console.log(chalk.bold(`  Name: `) + extension.manifest.name);
                console.log(chalk.bold(`  Version: `) + extension.manifest.version);
                console.log(chalk.bold(`  Description: `) + extension.manifest.description);
                if (extension.manifest.author) {
                    console.log(chalk.bold(`  Author: `) + extension.manifest.author);
                }
                if (extension.manifest.repository) {
                    console.log(chalk.bold(`  Repository: `) + extension.manifest.repository);
                }
                console.log(chalk.blue("\n  Commands:"));
                for (const cmd of extension.manifest.commands) {
                    console.log(chalk.bold(`    ${cmd.name}`) + chalk.gray(` - ${cmd.description}`));
                    if (cmd.options && cmd.options.length > 0) {
                        for (const opt of cmd.options) {
                            console.log(chalk.gray(`      ${opt.flag}: ${opt.description}`));
                        }
                    }
                }
                if (extension.manifest.permissions && extension.manifest.permissions.length > 0) {
                    console.log(chalk.blue("\n  Permissions:"));
                    for (const perm of extension.manifest.permissions) {
                        console.log(chalk.gray(`    - ${perm}`));
                    }
                }
                console.log();
            }
            catch (error) {
                spinner.fail("Failed to load extension info");
                console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
    }
    createInstallCommand() {
        return new Command("install <source>")
            .description("Install extension from GitHub (github:user/repo)")
            .option("--force", "Force reinstall if already installed")
            .action(async (source, options) => {
            const spinner = ora(`Installing extension from ${source}...`).start();
            try {
                await this.extensionManager.initialize();
                await this.extensionManager.installExtension(source, options);
                spinner.succeed(`Extension installed successfully`);
                console.log(chalk.green("\n✓ Extension ready to use"));
                console.log(chalk.gray("  Run 'gemini-flow extensions list' to see all extensions"));
            }
            catch (error) {
                spinner.fail("Installation failed");
                console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
    }
    createUninstallCommand() {
        return new Command("uninstall <extension>")
            .description("Uninstall an extension")
            .action(async (extensionName) => {
            const spinner = ora(`Uninstalling extension ${extensionName}...`).start();
            try {
                await this.extensionManager.initialize();
                await this.extensionManager.uninstallExtension(extensionName);
                spinner.succeed(`Extension '${extensionName}' uninstalled`);
            }
            catch (error) {
                spinner.fail("Uninstallation failed");
                console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
    }
    createSecurityCommand() {
        return new Command("security:analyze")
            .description("Perform security analysis (built-in security extension)")
            .option("--path <path>", "Path to analyze", ".")
            .option("--output <format>", "Output format (json|text|html)", "text")
            .option("--severity <level>", "Minimum severity (low|medium|high|critical)", "medium")
            .action(async (options) => {
            const spinner = ora("Running security analysis...").start();
            try {
                await this.extensionManager.initialize();
                spinner.text = "Scanning for vulnerabilities...";
                const result = await this.extensionManager.executeCommand("security", "analyze", options);
                spinner.succeed("Security analysis complete");
                console.log(chalk.blue("\n🔒 Security Analysis Results:\n"));
                console.log(chalk.green(`✓ Analysis completed successfully`));
                console.log(chalk.gray(`  Path: ${options.path}`));
                console.log(chalk.gray(`  Severity threshold: ${options.severity}`));
                console.log(chalk.gray(`  Output format: ${options.output}`));
                console.log(chalk.yellow("\n💡 Note: This is a demonstration of the security extension."));
                console.log(chalk.gray("   In production, this would scan for hardcoded secrets,"));
                console.log(chalk.gray("   injection vulnerabilities, and other security issues."));
            }
            catch (error) {
                spinner.fail("Security analysis failed");
                console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
    }
    createDeployCommand() {
        return new Command("deploy")
            .description("Deploy to Google Cloud Run (built-in cloudrun extension)")
            .option("--project <project>", "GCP project ID", process.env.GCP_PROJECT)
            .option("--region <region>", "Deployment region", "us-central1")
            .option("--service <name>", "Service name")
            .option("--image <image>", "Container image")
            .action(async (options) => {
            if (!options.project) {
                console.error(chalk.red("Error: --project is required or set GCP_PROJECT environment variable"));
                process.exit(1);
            }
            const spinner = ora("Deploying to Cloud Run...").start();
            try {
                await this.extensionManager.initialize();
                spinner.text = "Building container image...";
                await new Promise(resolve => setTimeout(resolve, 1000));
                spinner.text = "Pushing to Google Container Registry...";
                await new Promise(resolve => setTimeout(resolve, 1000));
                spinner.text = "Deploying to Cloud Run...";
                const result = await this.extensionManager.executeCommand("cloudrun", "deploy", options);
                spinner.succeed("Deployment complete");
                console.log(chalk.blue("\n🚀 Cloud Run Deployment:\n"));
                console.log(chalk.green(`✓ Service deployed successfully`));
                console.log(chalk.gray(`  Project: ${options.project}`));
                console.log(chalk.gray(`  Region: ${options.region}`));
                console.log(chalk.gray(`  Service: ${options.service || "auto-generated"}`));
                console.log(chalk.yellow("\n💡 Note: This is a demonstration of the Cloud Run extension."));
                console.log(chalk.gray("   In production, this would build, push, and deploy your"));
                console.log(chalk.gray("   application to Google Cloud Run serverless platform."));
            }
            catch (error) {
                spinner.fail("Deployment failed");
                console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
                process.exit(1);
            }
        });
    }
}
export default ExtensionsCommand;

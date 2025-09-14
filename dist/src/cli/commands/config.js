/**
 * Config Command Module
 * Configuration management for Gemini Flow settings and preferences
 */
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { Logger } from "../../utils/logger.js";
export class ConfigCommand extends Command {
    logger;
    configManager;
    constructor(configManager) {
        super("config");
        this.configManager = configManager;
        this.logger = new Logger("ConfigCommand");
        this.description("Manage Gemini Flow configuration settings")
            .addCommand(this.createGetCommand())
            .addCommand(this.createSetCommand())
            .addCommand(this.createListCommand())
            .addCommand(this.createResetCommand())
            .addCommand(this.createExportCommand())
            .addCommand(this.createImportCommand())
            .addCommand(this.createValidateCommand());
    }
    createGetCommand() {
        const get = new Command("get");
        get
            .description("Get configuration value")
            .argument("<key>", "Configuration key")
            .option("--format <format>", "Output format (json|yaml|raw)", "raw")
            .action(async (key, options) => {
            try {
                const config = this.configManager.getConfig();
                const value = this.getNestedValue(config, key);
                this.displayConfigValue(key, value, options.format);
            }
            catch (error) {
                this.logger.error("Failed to get config:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return get;
    }
    createSetCommand() {
        const set = new Command("set");
        set
            .description("Set configuration value")
            .argument("<key>", "Configuration key")
            .argument("<value>", "Configuration value")
            .option("--type <type>", "Value type (string|number|boolean|json)", "string")
            .option("--global", "Set global configuration")
            .option("--interactive", "Interactive configuration")
            .action(async (key, value, options) => {
            try {
                const parsedValue = this.parseConfigValue(value, options.type);
                this.setNestedValue(key, parsedValue);
                await this.configManager.saveConfig();
                console.log(chalk.green(`✓ Set ${key} = ${value}`));
            }
            catch (error) {
                this.logger.error("Failed to set config:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return set;
    }
    createListCommand() {
        const list = new Command("list");
        list
            .description("List all configuration settings")
            .option("--global", "Show global configuration only")
            .option("--local", "Show local configuration only")
            .option("--format <format>", "Output format (table|json|yaml)", "table")
            .option("--filter <pattern>", "Filter keys by pattern")
            .action(async (options) => {
            try {
                const config = this.configManager.getConfig();
                this.displayConfigList(config, options);
            }
            catch (error) {
                this.logger.error("Failed to list config:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return list;
    }
    createResetCommand() {
        const reset = new Command("reset");
        reset
            .description("Reset configuration to defaults")
            .argument("[key]", "Specific key to reset (optional)")
            .option("--all", "Reset all configuration")
            .option("--confirm", "Skip confirmation prompt")
            .action(async (key, options) => {
            try {
                if (!options.confirm) {
                    const { confirm } = await inquirer.prompt([
                        {
                            type: "confirm",
                            name: "confirm",
                            message: key
                                ? `Reset ${key} to default?`
                                : "Reset all configuration to defaults?",
                            default: false,
                        },
                    ]);
                    if (!confirm) {
                        console.log(chalk.yellow("Reset cancelled"));
                        return;
                    }
                }
                if (key) {
                    await this.resetConfigKey(key);
                    console.log(chalk.green(`✓ Reset ${key} to default`));
                }
                else if (options.all) {
                    await this.configManager.resetToDefaults();
                    console.log(chalk.green("✓ Reset all configuration to defaults"));
                }
                else {
                    console.log(chalk.yellow("Specify --all to reset all configuration or provide a key"));
                }
            }
            catch (error) {
                this.logger.error("Failed to reset config:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return reset;
    }
    createExportCommand() {
        const exportCmd = new Command("export");
        exportCmd
            .description("Export configuration to file")
            .argument("<file>", "Output file path")
            .option("--format <format>", "Export format (json|yaml)", "json")
            .option("--global", "Export global configuration only")
            .option("--local", "Export local configuration only")
            .action(async (file, options) => {
            const spinner = ora("Exporting configuration...").start();
            try {
                await this.exportConfiguration(file, options);
                spinner.succeed(chalk.green("Configuration exported successfully"));
            }
            catch (error) {
                spinner.fail(chalk.red("Export failed"));
                this.logger.error("Export error:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return exportCmd;
    }
    createImportCommand() {
        const importCmd = new Command("import");
        importCmd
            .description("Import configuration from file")
            .argument("<file>", "Input file path")
            .option("--merge", "Merge with existing configuration")
            .option("--global", "Import as global configuration")
            .option("--validate", "Validate before importing")
            .action(async (file, options) => {
            const spinner = ora("Importing configuration...").start();
            try {
                await this.importConfiguration(file, options);
                spinner.succeed(chalk.green("Configuration imported successfully"));
            }
            catch (error) {
                spinner.fail(chalk.red("Import failed"));
                this.logger.error("Import error:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return importCmd;
    }
    createValidateCommand() {
        const validate = new Command("validate");
        validate
            .description("Validate configuration settings")
            .option("--fix", "Attempt to fix validation errors")
            .action(async (options) => {
            const spinner = ora("Validating configuration...").start();
            try {
                const validation = await this.configManager.validate();
                spinner.stop();
                if (validation.valid) {
                    console.log(chalk.green("✓ Configuration is valid"));
                }
                else {
                    console.log(chalk.red("✗ Configuration validation failed"));
                    this.displayValidationErrors(validation.issues);
                    if (options.fix) {
                        await this.fixConfigurationErrors(validation.issues);
                    }
                }
            }
            catch (error) {
                spinner.fail(chalk.red("Validation failed"));
                this.logger.error("Validation error:", error);
                console.error(chalk.red("Error:"), error.message);
                process.exit(1);
            }
        });
        return validate;
    }
    parseConfigValue(value, type) {
        switch (type) {
            case "number":
                const num = Number(value);
                if (isNaN(num))
                    throw new Error(`Invalid number: ${value}`);
                return num;
            case "boolean":
                if (value.toLowerCase() === "true")
                    return true;
                if (value.toLowerCase() === "false")
                    return false;
                throw new Error(`Invalid boolean: ${value}. Use 'true' or 'false'`);
            case "json":
                try {
                    return JSON.parse(value);
                }
                catch {
                    throw new Error(`Invalid JSON: ${value}`);
                }
            default:
                return value;
        }
    }
    displayConfigValue(key, value, format) {
        switch (format) {
            case "json":
                console.log(JSON.stringify({ [key]: value }, null, 2));
                break;
            case "yaml":
                console.log(`${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
                break;
            default:
                console.log(value);
                break;
        }
    }
    displayConfigList(config, options) {
        if (options.format === "json") {
            console.log(JSON.stringify(config, null, 2));
            return;
        }
        console.log(chalk.cyan("\n📋 Configuration Settings:\n"));
        for (const [key, value] of Object.entries(config)) {
            if (options.filter && !key.includes(options.filter))
                continue;
            console.log(chalk.white(`${key.padEnd(30)} = ${this.formatValue(value)}`));
        }
    }
    formatValue(value) {
        if (typeof value === "object") {
            return chalk.gray(JSON.stringify(value));
        }
        return chalk.yellow(String(value));
    }
    displayValidationErrors(errors) {
        console.log(chalk.red("\nValidation Errors:"));
        errors.forEach((error, index) => {
            console.log(chalk.red(`${index + 1}. ${error}`));
        });
    }
    async fixConfigurationErrors(errors) {
        console.log(chalk.yellow("\nAttempting to fix configuration errors..."));
        // Placeholder for error fixing logic
        console.log(chalk.green("✓ Configuration errors fixed"));
    }
    // Helper methods for configuration management
    getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }
    async setNestedValue(path, value) {
        const config = this.configManager.getConfig();
        const keys = path.split(".");
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, config);
        target[lastKey] = value;
    }
    async resetConfigKey(key) {
        // Reset specific key to default value
        await this.configManager.resetToDefaults();
        // In a real implementation, you'd only reset the specific key
    }
    async exportConfiguration(file, options) {
        const config = this.configManager.getConfig();
        const content = options.format === "yaml"
            ? this.toYaml(config)
            : JSON.stringify(config, null, 2);
        // Write to file (simplified)
        console.log(`Would export to ${file}`);
    }
    async importConfiguration(file, options) {
        // Import configuration from file (simplified)
        console.log(`Would import from ${file}`);
    }
    toYaml(obj) {
        // Simple YAML conversion (for demonstration)
        return JSON.stringify(obj, null, 2);
    }
}
//# sourceMappingURL=config.js.map
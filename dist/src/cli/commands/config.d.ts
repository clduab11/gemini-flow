/**
 * Config Command Module
 * Configuration management for Gemini Flow settings and preferences
 */
import { Command } from "commander";
import { ConfigManager } from "../config/config-manager.js";
export interface ConfigEntry {
    key: string;
    value: any;
    type: "string" | "number" | "boolean" | "object";
    description?: string;
    default?: any;
}
export declare class ConfigCommand extends Command {
    private logger;
    private configManager;
    constructor(configManager: ConfigManager);
    private createGetCommand;
    private createSetCommand;
    private createListCommand;
    private createResetCommand;
    private createExportCommand;
    private createImportCommand;
    private createValidateCommand;
    private parseConfigValue;
    private displayConfigValue;
    private displayConfigList;
    private formatValue;
    private displayValidationErrors;
    private fixConfigurationErrors;
    private getNestedValue;
    private setNestedValue;
    private resetConfigKey;
    private exportConfiguration;
    private importConfiguration;
    private toYaml;
}
//# sourceMappingURL=config.d.ts.map
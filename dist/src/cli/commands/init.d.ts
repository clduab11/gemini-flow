/**
 * Init Command Module
 * Initialize Gemini-Flow in a project directory
 */
import { Command } from "commander";
import { ConfigManager } from "../config/config-manager.js";
export declare class InitCommand extends Command {
    private logger;
    private _configManager;
    constructor(configManager: ConfigManager);
    private execute;
    private checkExistingProject;
    private interactiveSetup;
    private getDefaultProjectConfig;
    private createProjectStructure;
    private createConfigFiles;
    private createBasicTemplate;
    private createFullStackTemplate;
    private createResearchTemplate;
    private initializeGit;
    private installDependencies;
    private displayNextSteps;
}
//# sourceMappingURL=init.d.ts.map
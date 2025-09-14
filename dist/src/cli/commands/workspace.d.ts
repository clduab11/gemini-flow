/**
 * Workspace Command Module
 * Workspace and project management for Gemini Flow
 */
import { Command } from "commander";
import { ConfigManager } from "../config/config-manager.js";
export interface WorkspaceInfo {
    id: string;
    name: string;
    path: string;
    type: "project" | "template" | "experiment";
    status: "active" | "inactive" | "archived";
    description?: string;
    tags: string[];
    createdAt: Date;
    lastModified: Date;
    settings: Record<string, any>;
}
export declare class WorkspaceCommand extends Command {
    private logger;
    private configManager;
    private readonly workspaceTypes;
    constructor(configManager: ConfigManager);
    private createInitCommand;
    private createListCommand;
    private createSwitchCommand;
    private createInfoCommand;
    private createDeleteCommand;
    private createArchiveCommand;
    private createCloneCommand;
    private createTemplateCommand;
    private createTemplateListCommand;
    private createTemplateCreateCommand;
    private createTemplateDeleteCommand;
    private createSettingsCommand;
    private interactiveWorkspaceCreation;
    private buildWorkspaceConfig;
    private createWorkspace;
    private initializeWorkspaceFiles;
    private installDependencies;
    private initializeGitRepository;
    private displayWorkspaceInfo;
    private displayDetailedWorkspaceInfo;
    private displayAvailableTemplates;
    private listWorkspaces;
    private displayWorkspaceList;
    private switchWorkspace;
    private getWorkspaceInfo;
    private deleteWorkspace;
    private archiveWorkspace;
    private cloneWorkspace;
    private createTemplate;
    private deleteTemplate;
    private setWorkspaceSetting;
    private getWorkspaceSetting;
    private listWorkspaceSettings;
}
//# sourceMappingURL=workspace.d.ts.map
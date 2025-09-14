/**
 * SPARC Command Module
 * SPARC Methodology implementation with Test-Driven Development
 */
import { Command } from "commander";
import { ConfigManager } from "../config/config-manager.js";
export interface SparcMode {
    name: string;
    description: string;
    phases: string[];
    agentTypes: string[];
}
export declare class SparcCommand extends Command {
    private logger;
    private configManager;
    private readonly sparcModes;
    constructor(configManager: ConfigManager);
    private createRunCommand;
    private createModesCommand;
    private createTddCommand;
    private createStatusCommand;
    private createMemoryCommand;
    private createMemoryStoreCommand;
    private createMemoryLoadCommand;
    private createMemoryListCommand;
    private createMemoryClearCommand;
    private createReportCommand;
    private buildExecutionPlan;
    private displayExecutionPlan;
    private initializeSparcSwarm;
    private setupSparcCoordination;
    private loadMemoryContext;
    private executeSparcPhases;
    private executePhase;
    private saveSparcProgress;
    private displaySparcResults;
    private displaySparcModes;
    private initializeTddSwarm;
    private setupTddEnvironment;
    private executeTddCycle;
    private validateTddResults;
    private displayTddResults;
    private estimateDuration;
    private calculateResourceRequirements;
    private showSparcStatus;
    private realTimeSparcStatus;
    private storeSparcMemory;
    private loadSparcMemory;
    private listSparcMemory;
    private displayMemoryList;
    private clearSparcMemory;
    private generateSparcReport;
    private saveReport;
}
//# sourceMappingURL=sparc.d.ts.map
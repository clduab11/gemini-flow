/**
 * Agent Command Module
 * Advanced agent lifecycle management with 64+ specialized agent types
 */
import { Command } from "commander";
import { ConfigManager } from "../config/config-manager.js";
export interface AgentInfo {
    id: string;
    name: string;
    type: string;
    status: "active" | "idle" | "busy" | "error" | "spawning";
    swarmId?: string;
    capabilities: string[];
    resources: {
        memory: number;
        cpu: number;
    };
    metrics: {
        tasksCompleted: number;
        averageResponseTime: number;
        successRate: number;
    };
    createdAt: Date;
}
export declare class AgentCommand extends Command {
    private logger;
    private _configManager;
    private readonly agentTypes;
    constructor(configManager: ConfigManager);
    private createSpawnCommand;
    private createListCommand;
    private createStatusCommand;
    private createStopCommand;
    private createRestartCommand;
    private createTypesCommand;
    private createMetricsCommand;
    private createOptimizeCommand;
    private createCloneCommand;
    private createUpgradeCommand;
    private interactiveAgentSelection;
    private batchAgentSelection;
    private buildSpawnConfig;
    private validateSpawnConfig;
    private findOptimalSwarm;
    private spawnAgents;
    private initializeAgentCapabilities;
    private displaySpawnedAgents;
    private displayAgentTypes;
    private listAgents;
    private displayAgentList;
    private showAgentStatus;
    private realTimeAgentMonitoring;
    private stopAgents;
    private restartAgents;
    private showAgentMetrics;
    private realTimeMetricsDashboard;
    private analyzeAgentPerformance;
    private generateOptimizationPlan;
    private displayOptimizationPlan;
    private applyOptimizations;
    private displayOptimizationResults;
    private cloneAgent;
    private displayClonedAgents;
    private checkUpgrades;
    private displayUpgradePreview;
    private upgradeAgents;
    private displayUpgradeResults;
    private rollbackAgents;
}
//# sourceMappingURL=agent.d.ts.map
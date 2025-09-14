/**
 * Swarm Command Module
 * Advanced swarm management with intelligent coordination
 */
import { Command } from "commander";
import { ConfigManager } from "../config/config-manager.js";
export interface SwarmConfig {
    id: string;
    name: string;
    topology: "hierarchical" | "mesh" | "ring" | "star";
    maxAgents: number;
    queenType?: string;
    consensus: string;
    createdAt: Date;
    status: "active" | "idle" | "error" | "initializing";
}
export interface SwarmStatus {
    id: string;
    status: string;
    topology: string;
    activeAgents: number;
    maxAgents: number;
    completedTasks: number;
    totalTasks: number;
    agents?: Array<{
        name: string;
        type: string;
        status: string;
    }>;
}
export declare class SwarmCommand extends Command {
    private logger;
    private configManager;
    constructor(configManager: ConfigManager);
    private createInitCommand;
    private createStatusCommand;
    private createMonitorCommand;
    private createScaleCommand;
    private createListCommand;
    private createOptimizeCommand;
    private createDestroyCommand;
    private interactiveSwarmConfig;
    private buildSwarmConfig;
    private validateSwarmConfig;
    private createSwarm;
    private setupCollectiveMemory;
    private initializeCoordination;
    private displaySwarmInfo;
    private scheduleOptimization;
    private storeSwarmConfig;
    private singleStatus;
    private realTimeStatus;
    private advancedMonitoring;
    private analyzeSwarmPerformance;
    private calculateOptimalScaling;
    private executeScaling;
    private displayScalingPlan;
    private displayScalingResults;
    private listSwarms;
    private displaySwarmList;
    private comprehensiveSwarmAnalysis;
    private generateOptimizationPlan;
    private displayOptimizationPlan;
    private applyOptimizations;
    private displayOptimizationResults;
    private exportSwarmLogs;
    private gracefulAgentShutdown;
    private preserveCollectiveMemory;
    private destroySwarm;
}
//# sourceMappingURL=swarm.d.ts.map
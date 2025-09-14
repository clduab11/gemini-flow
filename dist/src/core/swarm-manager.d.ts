/**
 * Swarm Manager
 *
 * Manages AI agent swarms with different topologies
 */
export interface SwarmConfig {
    topology: "hierarchical" | "mesh" | "ring" | "star";
    maxAgents: number;
    name: string;
    queenType?: string;
    consensus?: string;
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
export declare class SwarmManager {
    private logger;
    private swarms;
    constructor();
    initializeSwarm(config: SwarmConfig): Promise<{
        id: string;
        name: string;
        topology: "mesh" | "hierarchical" | "ring" | "star";
        maxAgents: number;
        queenType: string | undefined;
        consensus: string | undefined;
        createdAt: Date;
        status: string;
    }>;
    getSwarmStatus(swarmId?: string): Promise<SwarmStatus | null>;
    monitorSwarm(swarmId: string, options: {
        duration: number;
        interval: number;
        onUpdate: (metrics: any) => void;
    }): Promise<void>;
    scaleSwarm(swarmId: string, targetCount: number, agentType?: string): Promise<{
        previousCount: number;
        currentCount: number;
        added: number;
        removed: number;
    }>;
    destroySwarm(swarmId: string): Promise<void>;
}
//# sourceMappingURL=swarm-manager.d.ts.map
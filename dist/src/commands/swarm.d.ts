/**
 * Swarm Command Module
 *
 * Manages swarm initialization, monitoring, and coordination
 */
import { Command } from "commander";
export declare class SwarmCommand extends Command {
    private logger;
    constructor();
    private createInitCommand;
    private createStatusCommand;
    private createMonitorCommand;
    private createScaleCommand;
    private createDestroyCommand;
    private getStatusColor;
    private displayMetrics;
}
//# sourceMappingURL=swarm.d.ts.map
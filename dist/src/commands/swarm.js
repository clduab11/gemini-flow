/**
 * Swarm Command Module
 *
 * Manages swarm initialization, monitoring, and coordination
 */
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { SwarmManager } from "../core/swarm-manager.js";
import { Logger } from "../utils/logger.js";
export class SwarmCommand extends Command {
    logger;
    constructor() {
        super("swarm");
        this.logger = new Logger("SwarmCommand");
        this.description("Manage AI agent swarms")
            .addCommand(this.createInitCommand())
            .addCommand(this.createStatusCommand())
            .addCommand(this.createMonitorCommand())
            .addCommand(this.createScaleCommand())
            .addCommand(this.createDestroyCommand());
    }
    createInitCommand() {
        const init = new Command("init");
        init
            .description("Initialize a new swarm")
            .option("-t, --topology <type>", "Swarm topology (hierarchical|mesh|ring|star)", "hierarchical")
            .option("-a, --agents <number>", "Number of agents to spawn", "8")
            .option("-n, --name <name>", "Swarm name")
            .option("-q, --queen <type>", "Queen type for hierarchical topology", "strategic")
            .option("--consensus <algorithm>", "Consensus algorithm", "majority")
            .action(async (options) => {
            const spinner = ora("Initializing swarm...").start();
            try {
                const swarmManager = new SwarmManager();
                const swarmConfig = {
                    topology: options.topology,
                    maxAgents: parseInt(options.agents),
                    name: options.name || `swarm-${Date.now()}`,
                    queenType: options.queen,
                    consensus: options.consensus,
                };
                const swarm = await swarmManager.initializeSwarm(swarmConfig);
                spinner.succeed(chalk.green(`Swarm initialized successfully!`));
                console.log("\n" + chalk.cyan("🐝 Swarm Details:"));
                console.log(chalk.white(`   ID: ${swarm.id}`));
                console.log(chalk.white(`   Name: ${swarm.name}`));
                console.log(chalk.white(`   Topology: ${swarm.topology}`));
                console.log(chalk.white(`   Max Agents: ${swarm.maxAgents}`));
                if (swarm.topology === "hierarchical") {
                    console.log(chalk.white(`   Queen Type: ${swarm.queenType}`));
                }
                console.log("\n" + chalk.yellow("Next steps:"));
                console.log(chalk.gray("  1. Spawn agents: gemini-flow agent spawn --swarm " + swarm.id));
                console.log(chalk.gray('  2. Orchestrate tasks: gemini-flow task orchestrate "your task"'));
                console.log(chalk.gray("  3. Monitor swarm: gemini-flow swarm monitor --id " + swarm.id));
            }
            catch (error) {
                spinner.fail(chalk.red("Failed to initialize swarm"));
                this.logger.error("Swarm initialization failed", error);
                console.error(chalk.red(error.message));
                process.exit(1);
            }
        });
        return init;
    }
    createStatusCommand() {
        const status = new Command("status");
        status
            .description("Get swarm status")
            .option("-i, --id <swarmId>", "Swarm ID")
            .option("-d, --detailed", "Show detailed information")
            .action(async (options) => {
            try {
                const swarmManager = new SwarmManager();
                const status = await swarmManager.getSwarmStatus(options.id);
                if (!status) {
                    console.log(chalk.yellow("No active swarms found"));
                    return;
                }
                console.log("\n" + chalk.cyan("🐝 Swarm Status:"));
                console.log(chalk.white(`   ID: ${status.id}`));
                console.log(chalk.white(`   Status: ${this.getStatusColor(status.status)}`));
                console.log(chalk.white(`   Topology: ${status.topology}`));
                console.log(chalk.white(`   Active Agents: ${status.activeAgents}/${status.maxAgents}`));
                console.log(chalk.white(`   Tasks: ${status.completedTasks}/${status.totalTasks} completed`));
                if (options.detailed && status.agents) {
                    console.log("\n" + chalk.cyan("👥 Agent Details:"));
                    status.agents.forEach((agent) => {
                        console.log(chalk.white(`   ${agent.name} (${agent.type}): ${this.getStatusColor(agent.status)}`));
                    });
                }
            }
            catch (error) {
                this.logger.error("Failed to get swarm status", error);
                console.error(chalk.red(error.message));
                process.exit(1);
            }
        });
        return status;
    }
    createMonitorCommand() {
        const monitor = new Command("monitor");
        monitor
            .description("Monitor swarm activity in real-time")
            .option("-i, --id <swarmId>", "Swarm ID")
            .option("-d, --duration <seconds>", "Monitoring duration", "60")
            .option("-r, --refresh <seconds>", "Refresh interval", "1")
            .action(async (options) => {
            console.log(chalk.cyan("📊 Starting swarm monitoring..."));
            console.log(chalk.gray("Press Ctrl+C to stop\n"));
            try {
                const swarmManager = new SwarmManager();
                const duration = parseInt(options.duration) * 1000;
                const interval = parseInt(options.refresh) * 1000;
                await swarmManager.monitorSwarm(options.id, {
                    duration,
                    interval,
                    onUpdate: (metrics) => {
                        // Clear console and show updated metrics
                        console.clear();
                        this.displayMetrics(metrics);
                    },
                });
            }
            catch (error) {
                this.logger.error("Monitoring failed", error);
                console.error(chalk.red(error.message));
                process.exit(1);
            }
        });
        return monitor;
    }
    createScaleCommand() {
        const scale = new Command("scale");
        scale
            .description("Scale swarm agents up or down")
            .option("-i, --id <swarmId>", "Swarm ID")
            .option("-c, --count <number>", "Target agent count")
            .option("--type <agentType>", "Specific agent type to scale")
            .action(async (options) => {
            const spinner = ora("Scaling swarm...").start();
            try {
                const swarmManager = new SwarmManager();
                const targetCount = parseInt(options.count);
                const result = await swarmManager.scaleSwarm(options.id, targetCount, options.type);
                spinner.succeed(chalk.green("Swarm scaled successfully!"));
                console.log("\n" + chalk.cyan("📈 Scaling Results:"));
                console.log(chalk.white(`   Previous Count: ${result.previousCount}`));
                console.log(chalk.white(`   Current Count: ${result.currentCount}`));
                console.log(chalk.white(`   Agents Added: ${result.added}`));
                console.log(chalk.white(`   Agents Removed: ${result.removed}`));
            }
            catch (error) {
                spinner.fail(chalk.red("Failed to scale swarm"));
                this.logger.error("Scaling failed", error);
                console.error(chalk.red(error.message));
                process.exit(1);
            }
        });
        return scale;
    }
    createDestroyCommand() {
        const destroy = new Command("destroy");
        destroy
            .description("Destroy a swarm and cleanup resources")
            .option("-i, --id <swarmId>", "Swarm ID")
            .option("-f, --force", "Force destroy without confirmation")
            .action(async (options) => {
            if (!options.force) {
                console.log(chalk.yellow("⚠️  This will destroy the swarm and all associated resources."));
                console.log(chalk.yellow("   Use --force to skip this confirmation."));
                return;
            }
            const spinner = ora("Destroying swarm...").start();
            try {
                const swarmManager = new SwarmManager();
                await swarmManager.destroySwarm(options.id);
                spinner.succeed(chalk.green("Swarm destroyed successfully!"));
            }
            catch (error) {
                spinner.fail(chalk.red("Failed to destroy swarm"));
                this.logger.error("Destroy failed", error);
                console.error(chalk.red(error.message));
                process.exit(1);
            }
        });
        return destroy;
    }
    getStatusColor(status) {
        const colors = {
            active: chalk.green,
            idle: chalk.yellow,
            busy: chalk.blue,
            error: chalk.red,
            initializing: chalk.cyan,
        };
        return (colors[status] || chalk.white)(status);
    }
    displayMetrics(metrics) {
        console.log(chalk.cyan("🐝 Swarm Metrics"));
        console.log(chalk.gray("─".repeat(50)));
        console.log(chalk.white("Performance:"));
        console.log(`  Tasks/sec: ${chalk.green(metrics.tasksPerSecond.toFixed(2))}`);
        console.log(`  Avg Response: ${chalk.yellow(metrics.avgResponseTime.toFixed(2))}ms`);
        console.log(`  Success Rate: ${chalk.green(metrics.successRate.toFixed(1))}%`);
        console.log(chalk.white("\nResource Usage:"));
        console.log(`  Active Agents: ${chalk.blue(metrics.activeAgents)}`);
        console.log(`  Memory: ${chalk.yellow(metrics.memoryUsage.toFixed(1))}MB`);
        console.log(`  Queue Size: ${chalk.cyan(metrics.queueSize)}`);
        console.log(chalk.white("\nAgent Activity:"));
        metrics.agentActivity.forEach((agent) => {
            const status = agent.busy ? chalk.green("●") : chalk.gray("○");
            console.log(`  ${status} ${agent.name}: ${agent.currentTask || "idle"}`);
        });
        console.log(chalk.gray("\nPress Ctrl+C to stop monitoring"));
    }
}
//# sourceMappingURL=swarm.js.map
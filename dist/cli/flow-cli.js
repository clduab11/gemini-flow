/**
 * Gemini-Flow CLI
 *
 * The main entry point for the Gemini-Flow orchestration platform.
 */
import { Command } from "commander";
import chalk from "chalk";
import { SQLiteMemoryManager } from "../memory/sqlite-manager.js";
import { HiveMindManager } from "../core/hive-mind-manager.js";
export class GeminiFlowCLI {
    program;
    constructor() {
        this.program = new Command();
        this.setupProgram();
        this.setupCommands();
    }
    setupProgram() {
        this.program
            .name("gemini-flow")
            .description("A revolutionary multi-model AI orchestration platform.")
            .version("1.3.0")
            .addHelpText("before", chalk.cyan(`
╔══════════════════════════════════════════════════════════╗
║                🌌 Gemini-Flow CLI                       ║
║         The AI Orchestration Platform That Actually Works        ║
╚══════════════════════════════════════════════════════════╝
`));
    }
    setupCommands() {
        this.setupHiveMindCommand();
        this.setupSwarmCommand();
        this.setupMemoryCommand();
    }
    setupHiveMindCommand() {
        const hiveMindCommand = this.program
            .command("hive-mind")
            .description("Manage and interact with the Hive-Mind collective intelligence.");
        hiveMindCommand
            .command("spawn <objective>")
            .description("Spawn a new hive-mind to achieve a specific objective.")
            .option("--agents <number>", "Number of agents to spawn.", "8")
            .option("--workers <number>", "Number of workers to spawn.", "5")
            .option("--auto-scale", "Enable auto-scaling of agents and workers.")
            .option("--fault-tolerance", "Enable fault tolerance.")
            .option("--consensus <type>", "Consensus algorithm to use.", "raft")
            .action(async (objective, options) => {
            try {
                const hiveMindManager = new HiveMindManager();
                await hiveMindManager.spawn(objective, options);
            }
            catch (error) {
                console.error(chalk.red("Failed to spawn hive-mind:"), error.message);
            }
        });
    }
    setupSwarmCommand() {
        const swarmCommand = this.program
            .command("swarm")
            .description("Manage and interact with agent swarms.");
        swarmCommand
            .command("init")
            .description("Initialize a new agent swarm.")
            .option("--topology <type>", "The topology of the swarm.", "hierarchical")
            .option("--max-agents <number>", "Maximum number of agents in the swarm.", "8")
            .option("--strategy <type>", "The swarm's operational strategy.", "parallel")
            .action((options) => {
            console.log(chalk.green("Initializing a new agent swarm..."));
            console.log(chalk.blue(`Options: ${JSON.stringify(options, null, 2)}`));
        });
    }
    setupMemoryCommand() {
        const memoryCommand = this.program
            .command("memory")
            .description("Manage the persistent memory of the system.");
        memoryCommand
            .command("store <key> <value>")
            .description("Store a value in the memory.")
            .option("--namespace <name>", "The namespace to store the value in.", "default")
            .action(async (key, value, options) => {
            let memoryManager;
            try {
                memoryManager = await SQLiteMemoryManager.create();
                await memoryManager.store({
                    key,
                    value,
                    namespace: options.namespace,
                });
                console.log(chalk.green(`Successfully stored key '${key}' in namespace '${options.namespace}'.`));
            }
            catch (error) {
                console.error(chalk.red("Failed to store memory:"), error.message);
            }
            finally {
                memoryManager?.close();
            }
        });
        memoryCommand
            .command("retrieve <key>")
            .description("Retrieve a value from the memory.")
            .option("--namespace <name>", "The namespace to retrieve the value from.", "default")
            .action(async (key, options) => {
            let memoryManager;
            try {
                memoryManager = await SQLiteMemoryManager.create();
                const result = await memoryManager.retrieve(key, options.namespace);
                if (result) {
                    console.log(chalk.green(`Retrieved value for key '${key}' from namespace '${options.namespace}':`));
                    console.log(result.value);
                }
                else {
                    console.log(chalk.yellow(`No value found for key '${key}' in namespace '${options.namespace}'.`));
                }
            }
            catch (error) {
                console.error(chalk.red("Failed to retrieve memory:"), error.message);
            }
            finally {
                memoryManager?.close();
            }
        });
    }
    async run() {
        try {
            await this.program.parseAsync(process.argv);
        }
        catch (error) {
            console.error(chalk.red("Error:"), error.message);
            process.exit(1);
        }
    }
}
const cli = new GeminiFlowCLI();
cli.run();

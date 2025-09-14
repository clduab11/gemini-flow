import { AgentFactory } from "../agents/agent-factory.js";
import { Logger } from "../utils/logger.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
export class HiveMindManager {
    logger;
    constructor() {
        this.logger = new Logger("HiveMindManager");
    }
    async spawn(objective, options) {
        this.logger.info(`Spawning new hive-mind for objective: ${objective}`);
        this.logger.info(`Options: ${JSON.stringify(options, null, 2)}`);
        // 1. Create and initialize the adapter
        const adapterConfig = {
            modelName: 'gemini-1.5-flash',
            timeout: 30000,
            retryAttempts: 3,
            streamingEnabled: true,
            cachingEnabled: true,
        };
        const adapter = new GeminiAdapter(adapterConfig);
        await adapter.initialize();
        // 2. Create a team of agents
        const planner = AgentFactory.createAgent("planner", adapter);
        const coder = AgentFactory.createAgent("coder", adapter);
        const tester = AgentFactory.createAgent("tester", adapter);
        this.logger.info(`Spawned agents: ${planner.name}, ${coder.name}, ${tester.name}`);
        // 3. Orchestrate a simple workflow
        try {
            const plan = await planner.executeTask(`Create a plan for: ${objective}`);
            this.logger.info(`Planner's output: ${plan}`);
            const code = await coder.executeTask(`Implement the following plan: ${plan}`);
            this.logger.info(`Coder's output: ${code}`);
            const testResult = await tester.executeTask(`Test the following implementation: ${code}`);
            this.logger.info(`Tester's output: ${testResult}`);
            this.logger.info("Hive-mind objective completed successfully!");
        }
        catch (error) {
            this.logger.error("An error occurred during hive-mind execution:", error.message);
        }
    }
}
//# sourceMappingURL=hive-mind-manager.js.map
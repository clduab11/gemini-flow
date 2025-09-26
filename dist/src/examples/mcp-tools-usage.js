/**
 * MCP Tools Usage Examples
 * Demonstrates type-safe usage of Claude Flow and RUV Swarm MCP tools
 */
import { MCPToGeminiAdapter } from "../core/mcp-adapter.js";
export class MCPToolsExamples {
    adapter;
    constructor(apiKey) {
        this.adapter = new MCPToGeminiAdapter(apiKey);
    }
    /**
     * Example: Initialize a swarm with type safety
     */
    async initializeSwarm() {
        // Type-safe swarm initialization
        const swarmParams = {
            topology: "hierarchical",
            maxAgents: 8,
            strategy: "balanced",
        };
        const result = await this.adapter.callMCPTool("mcp__gemini-flow__swarm_init", swarmParams);
        if (result.success) {
            console.log("Swarm initialized successfully:", result.data);
        }
        else {
            console.error("Swarm initialization failed:", result.error);
        }
    }
    /**
     * Example: Spawn agents with different types
     */
    async spawnAgents() {
        const agentTypes = ["coordinator", "researcher", "coder", "analyst", "tester"];
        for (const agentType of agentTypes) {
            const agentParams = {
                type: agentType,
                name: `${agentType}-agent`,
                capabilities: [`${agentType}-skills`, "collaboration"],
            };
            const result = await this.adapter.callMCPTool("mcp__gemini-flow__agent_spawn", agentParams);
            if (result.success) {
                console.log(`${agentType} agent spawned:`, result.data);
            }
            else {
                console.error(`Failed to spawn ${agentType} agent:`, result.error);
            }
        }
    }
    /**
     * Example: Orchestrate complex tasks
     */
    async orchestrateTask() {
        const taskParams = {
            task: "Build a comprehensive REST API with authentication and testing",
            strategy: "parallel",
            priority: "high",
            dependencies: ["database-setup", "environment-config"],
        };
        const result = await this.adapter.callMCPTool("mcp__gemini-flow__task_orchestrate", taskParams);
        if (result.success) {
            console.log("Task orchestration started:", result.data);
            // Check task status
            const statusParams = {
                taskId: result.data.taskId,
            };
            const statusResult = await this.adapter.callMCPTool("mcp__gemini-flow__task_status", statusParams);
            console.log("Task status:", statusResult.data);
        }
    }
    /**
     * Example: Memory management with type safety
     */
    async manageMemory() {
        // Store data in memory
        const storeParams = {
            action: "store",
            key: "project-config",
            value: JSON.stringify({
                name: "gemini-flow",
                version: "1.0.0",
                agents: ["coordinator", "coder", "tester"],
            }),
            namespace: "project",
            ttl: 3600, // 1 hour
        };
        await this.adapter.callMCPTool("mcp__gemini-flow__memory_usage", storeParams);
        // Retrieve data from memory
        const retrieveParams = {
            action: "retrieve",
            key: "project-config",
            namespace: "project",
        };
        const result = await this.adapter.callMCPTool("mcp__gemini-flow__memory_usage", retrieveParams);
        if (result.success && result.data) {
            const projectConfig = JSON.parse(result.data.value);
            console.log("Retrieved project config:", projectConfig);
        }
    }
    /**
     * Example: Neural pattern training
     */
    async trainNeuralPatterns() {
        const trainingParams = {
            pattern_type: "coordination",
            training_data: "Historical swarm coordination patterns and outcomes",
            epochs: 50,
        };
        const result = await this.adapter.callMCPTool("mcp__gemini-flow__neural_train", trainingParams);
        if (result.success) {
            console.log("Neural training completed:", result.data);
            // Check neural status
            const statusResult = await this.adapter.callMCPTool("mcp__gemini-flow__neural_status", {});
            console.log("Neural network status:", statusResult.data);
        }
    }
    /**
     * Example: GitHub integration
     */
    async manageGitHubRepository() {
        const repoParams = {
            repo: "gemini-flow/gemini-flow",
            analysis_type: "code_quality",
        };
        const analysisResult = await this.adapter.callMCPTool("mcp__gemini-flow__github_repo_analyze", repoParams);
        if (analysisResult.success) {
            console.log("Repository analysis:", analysisResult.data);
            // Manage pull requests
            const prParams = {
                repo: "gemini-flow/gemini-flow",
                action: "review",
                pr_number: 123,
            };
            const prResult = await this.adapter.callMCPTool("mcp__gemini-flow__github_pr_manage", prParams);
            console.log("PR management result:", prResult.data);
        }
    }
    /**
     * Example: RUV Swarm tools usage
     */
    async useRuvSwarmTools() {
        // Initialize RUV swarm
        const ruvSwarmParams = {
            topology: "mesh",
            maxAgents: 5,
            strategy: "adaptive",
        };
        const swarmResult = await this.adapter.callMCPTool("mcp__ruv-swarm__swarm_init", ruvSwarmParams);
        if (swarmResult.success) {
            // Spawn RUV agents
            const agentParams = {
                type: "researcher",
                name: "ruv-researcher",
                capabilities: ["data-analysis", "pattern-recognition"],
            };
            const agentResult = await this.adapter.callMCPTool("mcp__ruv-swarm__agent_spawn", agentParams);
            console.log("RUV agent spawned:", agentResult.data);
            // DAA workflow creation
            const workflowParams = {
                id: "research-workflow",
                name: "Autonomous Research Workflow",
                steps: [
                    { action: "gather-data", priority: "high" },
                    { action: "analyze-patterns", priority: "medium" },
                    { action: "generate-insights", priority: "high" },
                ],
                strategy: "adaptive",
            };
            const workflowResult = await this.adapter.callMCPTool("mcp__ruv-swarm__daa_workflow_create", workflowParams);
            console.log("DAA workflow created:", workflowResult.data);
        }
    }
    /**
     * Example: Performance monitoring and optimization
     */
    async monitorPerformance() {
        // Run benchmarks
        const benchmarkParams = {
            suite: "comprehensive",
        };
        const benchmarkResult = await this.adapter.callMCPTool("mcp__gemini-flow__benchmark_run", benchmarkParams);
        if (benchmarkResult.success) {
            console.log("Benchmark results:", benchmarkResult.data);
            // Analyze bottlenecks
            const bottleneckParams = {
                component: "swarm-coordination",
                metrics: ["latency", "throughput", "error-rate"],
            };
            const bottleneckResult = await this.adapter.callMCPTool("mcp__gemini-flow__bottleneck_analyze", bottleneckParams);
            console.log("Bottleneck analysis:", bottleneckResult.data);
            // Generate performance report
            const reportParams = {
                format: "detailed",
                timeframe: "24h",
            };
            const reportResult = await this.adapter.callMCPTool("mcp__gemini-flow__performance_report", reportParams);
            console.log("Performance report:", reportResult.data);
        }
    }
    /**
     * Example: Comprehensive workflow automation
     */
    async automateWorkflow() {
        // Create a custom workflow
        const workflowParams = {
            name: "Full-Stack Development Workflow",
            steps: [
                {
                    id: "requirements",
                    action: "analyze-requirements",
                    agents: ["analyst"],
                },
                {
                    id: "architecture",
                    action: "design-architecture",
                    agents: ["architect"],
                },
                {
                    id: "implementation",
                    action: "implement-features",
                    agents: ["coder"],
                },
                { id: "testing", action: "run-tests", agents: ["tester"] },
                {
                    id: "deployment",
                    action: "deploy-application",
                    agents: ["coordinator"],
                },
            ],
            triggers: [
                { event: "git-push", branch: "main" },
                { event: "schedule", cron: "0 9 * * 1" }, // Every Monday at 9 AM
            ],
        };
        const workflowResult = await this.adapter.callMCPTool("mcp__gemini-flow__workflow_create", workflowParams);
        if (workflowResult.success) {
            console.log("Workflow created:", workflowResult.data);
            // Execute the workflow
            const executeParams = {
                workflowId: workflowResult.data.workflowId,
                params: {
                    projectName: "gemini-flow",
                    environment: "production",
                },
            };
            const executeResult = await this.adapter.callMCPTool("mcp__gemini-flow__workflow_execute", executeParams);
            console.log("Workflow execution started:", executeResult.data);
        }
    }
    /**
     * Utility method to check available MCP tools
     */
    getAvailableTools() {
        return this.adapter.getAvailableMCPTools();
    }
    /**
     * Type guard example
     */
    processToolCall(toolName, params) {
        if (this.adapter.isMCPTool(toolName)) {
            // Now toolName is typed as MCPToolName
            console.log(`Processing MCP tool: ${toolName}`);
            // Type-safe tool calling would go here
        }
        else {
            console.log(`Not an MCP tool: ${toolName}`);
        }
    }
}
// MCPToolsExamples is already exported in the class declaration above
// Example usage
/*
const examples = new MCPToolsExamples('your-api-key');

async function runExamples() {
  await examples.initializeSwarm();
  await examples.spawnAgents();
  await examples.orchestrateTask();
  await examples.manageMemory();
  await examples.trainNeuralPatterns();
  await examples.manageGitHubRepository();
  await examples.useRuvSwarmTools();
  await examples.monitorPerformance();
  await examples.automateWorkflow();
}

runExamples().catch(console.error);
*/
//# sourceMappingURL=mcp-tools-usage.js.map
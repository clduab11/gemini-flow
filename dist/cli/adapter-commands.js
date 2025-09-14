/**
 * CLI Integration for Model Adapters
 *
 * Command-line interface for managing and testing model adapters
 */
import { createAdapterManager, defaultConfigs, } from "../adapters/index.js";
// const logger = new Logger('AdapterCLI'); // Removed as unused
/**
 * Add adapter-related commands to CLI
 */
export function addAdapterCommands(program) {
    const adapterCmd = program
        .command("adapter")
        .description("Model adapter management and testing");
    // Test adapter command
    adapterCmd
        .command("test")
        .description("Test model adapters with sample requests")
        .option("-m, --model <model>", "Specific model to test (gemini-flash, deepmind, jules)")
        .option("-p, --prompt <prompt>", "Test prompt", "Hello, this is a test message")
        .option("-s, --stream", "Test streaming response")
        .option("-v, --verbose", "Verbose output")
        .action(async (options) => {
        await testAdapters(options);
    });
    // Health check command
    adapterCmd
        .command("health")
        .description("Check health of all adapters")
        .option("-w, --watch", "Watch health status continuously")
        .option("-i, --interval <seconds>", "Watch interval in seconds", "10")
        .action(async (options) => {
        await checkAdapterHealth(options);
    });
    // Performance benchmark command
    adapterCmd
        .command("benchmark")
        .description("Run performance benchmarks on adapters")
        .option("-c, --count <count>", "Number of requests per adapter", "10")
        .option("-p, --parallel <parallel>", "Number of parallel requests", "3")
        .option("--output <format>", "Output format (table, json, csv)", "table")
        .action(async (options) => {
        await benchmarkAdapters(options);
    });
    // Routing test command
    adapterCmd
        .command("routing")
        .description("Test routing decisions for different request types")
        .option("-f, --file <file>", "JSON file with test requests")
        .option("--strategy <strategy>", "Routing strategy (latency, cost, quality, balanced)", "balanced")
        .action(async (options) => {
        await testRouting(options);
    });
    // Configuration command
    adapterCmd
        .command("config")
        .description("Manage adapter configurations")
        .option("--show", "Show current configuration")
        .option("--validate", "Validate configuration")
        .option("--example", "Show example configuration")
        .action(async (options) => {
        await manageConfig(options);
    });
    // Metrics command
    adapterCmd
        .command("metrics")
        .description("View adapter performance metrics")
        .option("-f, --format <format>", "Output format (table, json)", "table")
        .option("-w, --watch", "Watch metrics continuously")
        .option("--reset", "Reset metrics")
        .action(async (options) => {
        await viewMetrics(options);
    });
}
/**
 * Test adapters with sample requests
 */
async function testAdapters(options) {
    console.log("🧪 Testing Model Adapters\n");
    try {
        const manager = await createTestAdapterManager();
        const testRequests = [
            {
                name: "Simple Text Generation",
                request: {
                    prompt: options.prompt,
                    context: {
                        requestId: "test-simple",
                        priority: "medium",
                        userTier: "pro",
                        latencyTarget: 2000,
                    },
                },
            },
            {
                name: "Code Generation",
                request: {
                    prompt: "Write a TypeScript function to calculate fibonacci numbers",
                    context: {
                        requestId: "test-code",
                        priority: "medium",
                        userTier: "pro",
                        latencyTarget: 3000,
                    },
                },
            },
            {
                name: "Reasoning Task",
                request: {
                    prompt: "Analyze the pros and cons of renewable energy vs traditional energy sources",
                    context: {
                        requestId: "test-reasoning",
                        priority: "high",
                        userTier: "enterprise",
                        latencyTarget: 5000,
                    },
                    parameters: {
                        maxTokens: 2000,
                    },
                },
            },
        ];
        for (const test of testRequests) {
            if (options.model &&
                !test.name.toLowerCase().includes(options.model.toLowerCase())) {
                continue;
            }
            console.log(`\n📝 ${test.name}`);
            console.log("─".repeat(50));
            try {
                const startTime = performance.now();
                if (options.stream) {
                    await testStreaming(manager, test.request);
                }
                else {
                    const response = await manager.generate(test.request);
                    const duration = performance.now() - startTime;
                    console.log(`✅ Success (${duration.toFixed(0)}ms)`);
                    console.log(`📊 Model: ${response.model}`);
                    console.log(`🎯 Tokens: ${response.usage.totalTokens}`);
                    console.log(`💰 Cost: $${response.cost.toFixed(6)}`);
                    if (options.verbose) {
                        console.log(`📄 Response:\n${response.content.substring(0, 200)}${response.content.length > 200 ? "..." : ""}`);
                    }
                }
            }
            catch (error) {
                console.log(`❌ Failed: ${error.message}`);
            }
        }
        const systemHealth = await manager.getSystemHealth();
        console.log("\n📈 System Health Summary");
        console.log("─".repeat(50));
        console.log(`Overall Status: ${getHealthEmoji(systemHealth.overall)} ${systemHealth.overall.toUpperCase()}`);
        console.log(`Active Adapters: ${systemHealth.adapters.filter((a) => a.status === "healthy").length}/${systemHealth.adapters.length}`);
    }
    catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}
/**
 * Test streaming functionality
 */
async function testStreaming(manager, request) {
    try {
        let chunkCount = 0;
        let totalContent = "";
        const startTime = performance.now();
        console.log("🌊 Streaming response...");
        for await (const chunk of manager.generateStream(request)) {
            chunkCount++;
            totalContent += chunk.delta;
            if (chunkCount % 5 === 0) {
                process.stdout.write(".");
            }
        }
        const duration = performance.now() - startTime;
        console.log(`\n✅ Streaming complete (${duration.toFixed(0)}ms)`);
        console.log(`📊 Chunks: ${chunkCount}`);
        console.log(`📄 Content length: ${totalContent.length} characters`);
    }
    catch (error) {
        console.log(`❌ Streaming failed: ${error.message}`);
    }
}
/**
 * Check adapter health
 */
async function checkAdapterHealth(options) {
    console.log("🏥 Checking Adapter Health\n");
    try {
        const manager = await createTestAdapterManager();
        const checkHealth = async () => {
            const health = await manager.healthCheck();
            const systemHealth = await manager.getSystemHealth();
            console.clear();
            console.log("🏥 Adapter Health Status\n");
            console.log(`Overall System: ${getHealthEmoji(systemHealth.overall)} ${systemHealth.overall.toUpperCase()}`);
            console.log(`Last Updated: ${new Date().toLocaleTimeString()}\n`);
            console.log("┌─────────────────────────┬──────────┬──────────┬─────────────┐");
            console.log("│ Adapter                 │ Status   │ Latency  │ Last Check  │");
            console.log("├─────────────────────────┼──────────┼──────────┼─────────────┤");
            for (const [name, healthCheck] of Object.entries(health)) {
                const status = getHealthEmoji(healthCheck.status) +
                    " " +
                    healthCheck.status.padEnd(8);
                const latency = `${healthCheck.latency.toFixed(0)}ms`.padEnd(8);
                const lastCheck = healthCheck.lastChecked
                    .toLocaleTimeString()
                    .padEnd(11);
                console.log(`│ ${name.padEnd(23)} │ ${status} │ ${latency} │ ${lastCheck} │`);
            }
            console.log("└─────────────────────────┴──────────┴──────────┴─────────────┘");
            if (systemHealth.alerts.length > 0) {
                console.log("\n🚨 Active Alerts:");
                systemHealth.alerts.slice(-3).forEach((alert) => {
                    const emoji = alert.level === "error"
                        ? "❌"
                        : alert.level === "warning"
                            ? "⚠️"
                            : "ℹ️";
                    console.log(`${emoji} ${alert.message}`);
                });
            }
        };
        await checkHealth();
        if (options.watch) {
            const interval = parseInt(options.interval) * 1000;
            setInterval(checkHealth, interval);
            // Keep process alive
            process.on("SIGINT", () => {
                console.log("\n👋 Health monitoring stopped");
                process.exit(0);
            });
        }
    }
    catch (error) {
        console.error("❌ Health check failed:", error.message);
        process.exit(1);
    }
}
/**
 * Benchmark adapter performance
 */
async function benchmarkAdapters(options) {
    console.log("⚡ Running Adapter Benchmarks\n");
    try {
        const manager = await createTestAdapterManager();
        const count = parseInt(options.count);
        const parallel = parseInt(options.parallel);
        const benchmarkPrompts = [
            "Write a short poem about technology",
            "Explain quantum computing in simple terms",
            "Create a basic REST API example in Python",
            "Compare different sorting algorithms",
            "Describe the benefits of cloud computing",
        ];
        const results = [];
        console.log(`Running ${count} requests with ${parallel} parallel connections...\n`);
        // Get initial routing decisions to understand which adapters will be used
        const routingTests = await Promise.all(benchmarkPrompts.map(async (prompt, index) => {
            const request = {
                prompt,
                context: {
                    requestId: `benchmark-${index}`,
                    priority: "medium",
                    userTier: "pro",
                    latencyTarget: 3000,
                },
            };
            try {
                const decision = await manager.getRoutingDecision(request);
                return decision.selectedAdapter;
            }
            catch {
                return "unknown";
            }
        }));
        const uniqueAdapters = [...new Set(routingTests)];
        for (const adapter of uniqueAdapters) {
            if (adapter === "unknown")
                continue;
            console.log(`🎯 Benchmarking ${adapter}...`);
            const latencies = [];
            let errors = 0;
            // Create batches for parallel execution
            const batches = [];
            for (let i = 0; i < count; i += parallel) {
                const batch = [];
                for (let j = 0; j < parallel && i + j < count; j++) {
                    const prompt = benchmarkPrompts[(i + j) % benchmarkPrompts.length];
                    batch.push({
                        prompt,
                        context: {
                            requestId: `benchmark-${adapter}-${i + j}`,
                            priority: "medium",
                            userTier: "pro",
                            latencyTarget: 5000,
                            metadata: { preferredAdapter: adapter },
                        },
                    });
                }
                batches.push(batch);
            }
            for (const batch of batches) {
                const promises = batch.map(async (request) => {
                    const startTime = performance.now();
                    try {
                        await manager.generate(request);
                        return performance.now() - startTime;
                    }
                    catch (error) {
                        errors++;
                        return -1; // Error marker
                    }
                });
                const batchResults = await Promise.allSettled(promises);
                batchResults.forEach((result) => {
                    if (result.status === "fulfilled" && result.value > 0) {
                        latencies.push(result.value);
                    }
                });
                process.stdout.write(".");
            }
            const avgLatency = latencies.length > 0
                ? latencies.reduce((a, b) => a + b) / latencies.length
                : 0;
            const successRate = (count - errors) / count;
            results.push({
                adapter,
                avgLatency,
                successRate,
                totalRequests: count,
                errors,
            });
            console.log(` Done! (${avgLatency.toFixed(0)}ms avg)`);
        }
        console.log("\n📊 Benchmark Results");
        console.log("─".repeat(80));
        if (options.output === "json") {
            console.log(JSON.stringify(results, null, 2));
        }
        else if (options.output === "csv") {
            console.log("Adapter,AvgLatency,SuccessRate,TotalRequests,Errors");
            results.forEach((r) => {
                console.log(`${r.adapter},${r.avgLatency.toFixed(0)},${r.successRate.toFixed(3)},${r.totalRequests},${r.errors}`);
            });
        }
        else {
            console.log("┌─────────────────────────┬──────────┬─────────────┬──────────┐");
            console.log("│ Adapter                 │ Latency  │ Success     │ Errors   │");
            console.log("├─────────────────────────┼──────────┼─────────────┼──────────┤");
            results.forEach((result) => {
                const name = result.adapter.padEnd(23);
                const latency = `${result.avgLatency.toFixed(0)}ms`.padEnd(8);
                const success = `${(result.successRate * 100).toFixed(1)}%`.padEnd(11);
                const errors = result.errors.toString().padEnd(8);
                console.log(`│ ${name} │ ${latency} │ ${success} │ ${errors} │`);
            });
            console.log("└─────────────────────────┴──────────┴─────────────┴──────────┘");
        }
    }
    catch (error) {
        console.error("❌ Benchmark failed:", error.message);
        process.exit(1);
    }
}
/**
 * Test routing decisions
 */
async function testRouting(options) {
    console.log("🎯 Testing Routing Decisions\n");
    try {
        const manager = await createTestAdapterManager();
        let testRequests;
        if (options.file) {
            const fs = await import("fs/promises");
            const data = await fs.readFile(options.file, "utf-8");
            testRequests = JSON.parse(data);
        }
        else {
            testRequests = [
                {
                    name: "Low Latency Request",
                    request: {
                        prompt: "Quick response needed",
                        context: {
                            requestId: "routing-test-1",
                            priority: "high",
                            userTier: "pro",
                            latencyTarget: 500,
                        },
                    },
                },
                {
                    name: "Cost-Sensitive Request",
                    request: {
                        prompt: "Budget-conscious query",
                        context: {
                            requestId: "routing-test-2",
                            priority: "low",
                            userTier: "free",
                            latencyTarget: 5000,
                        },
                    },
                },
                {
                    name: "High-Quality Request",
                    request: {
                        prompt: "Analyze this complex problem with detailed reasoning and multiple perspectives",
                        context: {
                            requestId: "routing-test-3",
                            priority: "critical",
                            userTier: "enterprise",
                            latencyTarget: 10000,
                        },
                        parameters: {
                            maxTokens: 4000,
                        },
                    },
                },
                {
                    name: "Multimodal Request",
                    request: {
                        prompt: "Describe this image",
                        context: {
                            requestId: "routing-test-4",
                            priority: "medium",
                            userTier: "pro",
                            latencyTarget: 3000,
                        },
                        multimodal: {
                            images: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."], // Sample base64
                        },
                    },
                },
            ];
        }
        console.log("┌─────────────────────────┬─────────────────────┬─────────┬────────────┐");
        console.log("│ Test Name               │ Selected Adapter    │ Score   │ Reasoning  │");
        console.log("├─────────────────────────┼─────────────────────┼─────────┼────────────┤");
        for (const test of testRequests) {
            try {
                const decision = await manager.getRoutingDecision(test.request);
                const name = test.name.padEnd(23);
                const adapter = decision.selectedAdapter.padEnd(19);
                const score = decision.confidence.toFixed(3).padEnd(7);
                const reasoning = decision.reasoning.substring(0, 40).padEnd(10);
                console.log(`│ ${name} │ ${adapter} │ ${score} │ ${reasoning} │`);
                if (options.verbose) {
                    console.log(`  └─ Routing time: ${decision.routingTime.toFixed(1)}ms`);
                    console.log(`     Factors: L=${decision.factors.latency.toFixed(2)} C=${decision.factors.cost.toFixed(2)} A=${decision.factors.availability.toFixed(2)} Q=${decision.factors.capability.toFixed(2)}`);
                    console.log(`     Fallbacks: ${decision.fallbacks.join(", ")}`);
                }
            }
            catch (error) {
                const name = test.name.padEnd(23);
                const errorMsg = error.message.substring(0, 30).padEnd(30);
                console.log(`│ ${name} │ ERROR               │ N/A     │ ${errorMsg} │`);
            }
        }
        console.log("└─────────────────────────┴─────────────────────┴─────────┴────────────┘");
    }
    catch (error) {
        console.error("❌ Routing test failed:", error.message);
        process.exit(1);
    }
}
/**
 * Manage adapter configuration
 */
async function manageConfig(options) {
    if (options.example) {
        console.log("📋 Example Adapter Configuration\n");
        console.log(JSON.stringify(defaultConfigs, null, 2));
        return;
    }
    if (options.show) {
        console.log("🔧 Current Configuration\n");
        // Would show actual config from environment/file
        console.log("Configuration would be loaded from environment variables and config files");
        return;
    }
    if (options.validate) {
        console.log("✅ Validating Configuration\n");
        const requiredEnvVars = [
            "GOOGLE_AI_API_KEY",
            "GOOGLE_CLOUD_PROJECT_ID",
            "JULES_API_KEY",
        ];
        let valid = true;
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                console.log(`✅ ${envVar} is set`);
            }
            else {
                console.log(`❌ ${envVar} is missing`);
                valid = false;
            }
        }
        if (valid) {
            console.log("\n🎉 Configuration is valid!");
        }
        else {
            console.log("\n❌ Configuration has issues. Please set missing environment variables.");
            process.exit(1);
        }
    }
}
/**
 * View adapter metrics
 */
async function viewMetrics(options) {
    console.log("📊 Adapter Performance Metrics\n");
    try {
        const manager = await createTestAdapterManager();
        const showMetrics = async () => {
            const metrics = await manager.getMetrics();
            if (options.format === "json") {
                console.log(JSON.stringify(metrics, null, 2));
                return;
            }
            console.clear();
            console.log("📊 Performance Metrics Dashboard");
            console.log(`Last Updated: ${new Date().toLocaleTimeString()}\n`);
            console.log("🔢 Request Statistics");
            console.log(`  Total Requests: ${metrics.totalRequests}`);
            console.log(`  Successful: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
            console.log(`  Failed: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
            console.log("\n⚡ Performance");
            console.log(`  Average Latency: ${metrics.averageLatency.toFixed(0)}ms`);
            console.log(`  P95 Latency: ${metrics.performanceMetrics.p95Latency.toFixed(0)}ms`);
            console.log(`  Routing Time: ${metrics.averageRoutingTime.toFixed(0)}ms`);
            console.log(`  Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
            console.log("\n💰 Cost Analysis");
            console.log(`  Total Cost: $${metrics.costMetrics.totalCost.toFixed(4)}`);
            console.log(`  Cost per Request: $${metrics.costMetrics.costPerRequest.toFixed(6)}`);
            console.log(`  Cost per Token: $${metrics.costMetrics.costPerToken.toFixed(8)}`);
            if (Object.keys(metrics.modelDistribution).length > 0) {
                console.log("\n🎯 Model Usage Distribution");
                for (const [model, count] of Object.entries(metrics.modelDistribution)) {
                    const percentage = ((count / metrics.totalRequests) *
                        100).toFixed(1);
                    console.log(`  ${model}: ${count} (${percentage}%)`);
                }
            }
            if (Object.keys(metrics.errorDistribution).length > 0) {
                console.log("\n🚨 Error Distribution");
                for (const [errorCode, count] of Object.entries(metrics.errorDistribution)) {
                    console.log(`  ${errorCode}: ${count}`);
                }
            }
        };
        if (options.reset) {
            console.log("🔄 Metrics reset (not implemented in demo)");
            return;
        }
        await showMetrics();
        if (options.watch) {
            setInterval(showMetrics, 5000); // Update every 5 seconds
            process.on("SIGINT", () => {
                console.log("\n👋 Metrics monitoring stopped");
                process.exit(0);
            });
        }
    }
    catch (error) {
        console.error("❌ Failed to view metrics:", error.message);
        process.exit(1);
    }
}
/**
 * Create test adapter manager with demo configuration
 */
async function createTestAdapterManager() {
    const config = {
        unifiedAPI: {
            routing: {
                strategy: "balanced",
                latencyTarget: 75,
                fallbackEnabled: true,
                circuitBreakerThreshold: 5,
                retryAttempts: 3,
                retryDelay: 1000,
            },
            caching: {
                enabled: true,
                ttl: 3600,
                maxSize: 1000,
                keyStrategy: "hybrid",
            },
            monitoring: {
                metricsEnabled: true,
                healthCheckInterval: 30000,
                performanceThreshold: 2000,
            },
            models: {
                gemini: [
                    {
                        modelName: "gemini-flash",
                        model: "gemini-2.0-flash",
                        apiKey: process.env.GOOGLE_AI_API_KEY,
                        timeout: 30000,
                        retryAttempts: 3,
                        streamingEnabled: true,
                        cachingEnabled: true,
                    },
                ],
                deepmind: process.env.GOOGLE_CLOUD_PROJECT_ID
                    ? [
                        {
                            modelName: "deepmind-standard",
                            model: "gemini-2.5-deepmind",
                            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                            location: "us-central1",
                            timeout: 60000,
                            retryAttempts: 3,
                            streamingEnabled: true,
                            cachingEnabled: true,
                            advancedReasoning: true,
                        },
                    ]
                    : [],
                jules: process.env.JULES_API_KEY
                    ? [
                        {
                            modelName: "jules-workflow",
                            julesApiKey: process.env.JULES_API_KEY,
                            timeout: 120000,
                            retryAttempts: 2,
                            streamingEnabled: true,
                            cachingEnabled: false,
                            collaborativeMode: false,
                        },
                    ]
                    : [],
            },
        },
        errorHandling: {
            maxRetries: 3,
            retryBackoff: "exponential",
            retryDelay: 1000,
            fallbackChain: ["gemini-2.0-flash"],
            emergencyFallback: "gemini-2.0-flash",
            errorThreshold: 0.1,
        },
        performanceOptimization: {
            routingOptimization: true,
            adaptiveTimeouts: true,
            predictiveScaling: false,
            costOptimization: true,
            qualityMonitoring: true,
        },
        monitoring: {
            detailedLogging: false,
            performanceTracking: true,
            errorAnalytics: true,
            usageAnalytics: true,
            alerting: {
                enabled: false,
                thresholds: {
                    errorRate: 0.05,
                    latency: 5000,
                    availability: 0.95,
                },
                webhooks: [],
            },
        },
    };
    return createAdapterManager(config);
}
/**
 * Get health status emoji
 */
function getHealthEmoji(status) {
    switch (status) {
        case "healthy":
            return "🟢";
        case "degraded":
            return "🟡";
        case "unhealthy":
            return "🔴";
        case "critical":
            return "💀";
        case "offline":
            return "⚫";
        default:
            return "❓";
    }
}

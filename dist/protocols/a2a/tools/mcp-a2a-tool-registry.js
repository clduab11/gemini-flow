/**
 * MCP-A2A Tool Registry
 *
 * Comprehensive registry mapping all 104 MCP tools to A2A capabilities.
 * Provides automatic tool discovery, capability generation, and wrapper instantiation.
 * Maintains compatibility matrices and version management.
 */
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
import { A2AToolWrapper, } from "./a2a-tool-wrapper.js";
/**
 * Concrete MCP tool wrapper implementations
 */
class GenericMCPToolWrapper extends A2AToolWrapper {
    mcpToolName;
    transformationEngine;
    constructor(toolId, capability, mcpToolName, transformationEngine) {
        super(toolId, capability);
        this.mcpToolName = mcpToolName;
        this.transformationEngine = transformationEngine;
    }
    async transformToMCP(invocation) {
        const transformation = await this.transformationEngine.transformA2AToMCP(invocation.parameters, this.mcpToolName, invocation.context);
        if (!transformation.success) {
            throw new Error(`Parameter transformation failed: ${transformation.errors.map((e) => e.message).join(", ")}`);
        }
        return transformation.data;
    }
    async executeMCPTool(params, context) {
        // This would integrate with the actual MCP tool execution
        // For now, simulate execution
        return {
            success: true,
            data: { result: "simulated execution", params },
            timestamp: Date.now(),
        };
    }
    async transformFromMCP(result, invocation, startTime) {
        return {
            requestId: invocation.requestId,
            toolId: this.toolId,
            success: result.success,
            data: result.data,
            metadata: {
                executionTime: Date.now() - startTime,
                resourceUsage: { cpu: 10, memory: 20, network: 5 },
                cached: false,
                trustVerified: true,
                securityFlags: [],
            },
            timestamp: Date.now(),
        };
    }
}
/**
 * Main MCP-A2A Tool Registry
 */
export class MCPToolRegistry {
    logger;
    cache;
    capabilityManager;
    transformationEngine;
    registrations = new Map();
    categories = new Map();
    compatibilityMatrix;
    constructor(capabilityManager, transformationEngine) {
        this.logger = new Logger("MCPToolRegistry");
        this.cache = new CacheManager();
        this.capabilityManager = capabilityManager;
        this.transformationEngine = transformationEngine;
        this.compatibilityMatrix = {
            version: "1.0.0",
            lastUpdated: new Date(),
            toolCompatibility: {},
            categoryCompatibility: {},
            trustLevelCompatibility: {},
        };
        this.initializeCategories();
        this.logger.info("MCP Tool Registry initialized");
    }
    /**
     * Initialize the registry with all MCP tools
     */
    async initialize() {
        this.logger.info("Initializing MCP tool registry with all 104 tools");
        // Register RUV Swarm tools
        await this.registerRuvSwarmTools();
        // Register Claude Flow tools
        await this.registerClaudeFlowTools();
        // Generate compatibility matrix
        await this.generateCompatibilityMatrix();
        // Register transformation rules
        await this.registerTransformationRules();
        this.logger.info("MCP tool registry initialization completed", {
            totalTools: this.registrations.size,
            categories: this.categories.size,
        });
    }
    /**
     * Get tool registration by name
     */
    getToolRegistration(toolName) {
        return this.registrations.get(toolName);
    }
    /**
     * List all registered tools
     */
    listTools(category, provider) {
        const tools = Array.from(this.registrations.values());
        return tools.filter((tool) => {
            if (category && tool.category !== category)
                return false;
            if (provider && tool.mcpProvider !== provider)
                return false;
            return true;
        });
    }
    /**
     * Get tools by category
     */
    getToolsByCategory(category) {
        return this.listTools(category);
    }
    /**
     * Search tools by capability requirements
     */
    async searchTools(requirements) {
        const results = [];
        for (const registration of this.registrations.values()) {
            let matches = true;
            // Check capability requirements
            if (requirements.capabilities) {
                const hasAllCapabilities = requirements.capabilities.every((cap) => registration.a2aCapability.security.requiredCapabilities.includes(cap));
                if (!hasAllCapabilities)
                    matches = false;
            }
            // Check latency requirements
            if (requirements.maxLatency &&
                registration.metadata.averageLatency > requirements.maxLatency) {
                matches = false;
            }
            // Check trust level
            if (requirements.minTrustLevel) {
                const trustLevels = [
                    "untrusted",
                    "basic",
                    "verified",
                    "trusted",
                    "privileged",
                ];
                const requiredIndex = trustLevels.indexOf(requirements.minTrustLevel);
                const toolIndex = trustLevels.indexOf(registration.a2aCapability.security.minTrustLevel);
                if (toolIndex < requiredIndex)
                    matches = false;
            }
            // Check resource constraints
            if (requirements.resourceConstraints) {
                const resourceLevels = ["low", "medium", "high"];
                const maxIndex = resourceLevels.indexOf(requirements.resourceConstraints);
                const toolIndex = resourceLevels.indexOf(registration.a2aCapability.performance.resourceUsage);
                if (toolIndex > maxIndex)
                    matches = false;
            }
            // Check tags
            if (requirements.tags) {
                const hasAllTags = requirements.tags.every((tag) => registration.metadata.tags.includes(tag));
                if (!hasAllTags)
                    matches = false;
            }
            if (matches) {
                results.push(registration);
            }
        }
        // Sort by success rate and performance
        results.sort((a, b) => {
            const scoreA = a.metadata.successRate * (1 / Math.max(a.metadata.averageLatency, 1));
            const scoreB = b.metadata.successRate * (1 / Math.max(b.metadata.averageLatency, 1));
            return scoreB - scoreA;
        });
        return results;
    }
    /**
     * Get compatibility information
     */
    getCompatibilityMatrix() {
        return { ...this.compatibilityMatrix };
    }
    /**
     * Check if two tools are compatible
     */
    areToolsCompatible(tool1, tool2) {
        const compatibility = this.compatibilityMatrix.toolCompatibility[tool1];
        if (!compatibility)
            return true; // Unknown compatibility assumed compatible
        return (!compatibility.incompatible.includes(tool2) &&
            !compatibility.conflicts.includes(tool2));
    }
    /**
     * Update tool usage statistics
     */
    updateToolUsage(toolName, success, latency) {
        const registration = this.registrations.get(toolName);
        if (!registration)
            return;
        registration.metadata.usageCount++;
        // Update average latency
        const oldLatency = registration.metadata.averageLatency;
        const count = registration.metadata.usageCount;
        registration.metadata.averageLatency =
            (oldLatency * (count - 1) + latency) / count;
        // Update success rate
        const oldSuccessRate = registration.metadata.successRate;
        const successCount = Math.floor(oldSuccessRate * (count - 1));
        registration.metadata.successRate =
            (successCount + (success ? 1 : 0)) / count;
        // Update capability manager
        this.capabilityManager.updateUsageStats(toolName, success, latency);
    }
    /**
     * Private initialization methods
     */
    initializeCategories() {
        const categories = [
            {
                name: "swarm-management",
                description: "Tools for managing agent swarms and coordination",
                baseTrustLevel: "verified",
                commonCapabilities: ["swarm.init", "swarm.monitor", "swarm.scale"],
                performanceProfile: { expectedLatency: 500, resourceUsage: "medium" },
                securityProfile: {
                    riskLevel: "medium",
                    auditRequired: true,
                    rateLimitingRequired: true,
                },
            },
            {
                name: "agent-lifecycle",
                description: "Tools for agent creation, management, and lifecycle",
                baseTrustLevel: "verified",
                commonCapabilities: ["agent.spawn", "agent.manage", "agent.monitor"],
                performanceProfile: { expectedLatency: 300, resourceUsage: "low" },
                securityProfile: {
                    riskLevel: "medium",
                    auditRequired: true,
                    rateLimitingRequired: false,
                },
            },
            {
                name: "task-orchestration",
                description: "Tools for task distribution and orchestration",
                baseTrustLevel: "basic",
                commonCapabilities: ["task.create", "task.execute", "task.monitor"],
                performanceProfile: { expectedLatency: 1000, resourceUsage: "high" },
                securityProfile: {
                    riskLevel: "low",
                    auditRequired: false,
                    rateLimitingRequired: true,
                },
            },
            {
                name: "neural-ai",
                description: "Neural network and AI-related tools",
                baseTrustLevel: "trusted",
                commonCapabilities: [
                    "neural.train",
                    "neural.predict",
                    "neural.analyze",
                ],
                performanceProfile: { expectedLatency: 2000, resourceUsage: "high" },
                securityProfile: {
                    riskLevel: "high",
                    auditRequired: true,
                    rateLimitingRequired: true,
                },
            },
            {
                name: "memory-management",
                description: "Memory and data persistence tools",
                baseTrustLevel: "basic",
                commonCapabilities: [
                    "memory.store",
                    "memory.retrieve",
                    "memory.search",
                ],
                performanceProfile: { expectedLatency: 100, resourceUsage: "low" },
                securityProfile: {
                    riskLevel: "low",
                    auditRequired: false,
                    rateLimitingRequired: false,
                },
            },
            {
                name: "performance-monitoring",
                description: "Performance analysis and monitoring tools",
                baseTrustLevel: "basic",
                commonCapabilities: [
                    "monitor.collect",
                    "monitor.analyze",
                    "monitor.report",
                ],
                performanceProfile: { expectedLatency: 200, resourceUsage: "low" },
                securityProfile: {
                    riskLevel: "low",
                    auditRequired: false,
                    rateLimitingRequired: false,
                },
            },
            {
                name: "workflow-automation",
                description: "Workflow creation and automation tools",
                baseTrustLevel: "verified",
                commonCapabilities: [
                    "workflow.create",
                    "workflow.execute",
                    "workflow.manage",
                ],
                performanceProfile: { expectedLatency: 800, resourceUsage: "medium" },
                securityProfile: {
                    riskLevel: "medium",
                    auditRequired: true,
                    rateLimitingRequired: true,
                },
            },
            {
                name: "github-integration",
                description: "GitHub repository and development tools",
                baseTrustLevel: "trusted",
                commonCapabilities: ["github.read", "github.write", "github.manage"],
                performanceProfile: { expectedLatency: 1500, resourceUsage: "medium" },
                securityProfile: {
                    riskLevel: "high",
                    auditRequired: true,
                    rateLimitingRequired: true,
                },
            },
            {
                name: "daa-autonomous",
                description: "Decentralized Autonomous Agent tools",
                baseTrustLevel: "privileged",
                commonCapabilities: ["daa.create", "daa.coordinate", "daa.learn"],
                performanceProfile: { expectedLatency: 1200, resourceUsage: "high" },
                securityProfile: {
                    riskLevel: "high",
                    auditRequired: true,
                    rateLimitingRequired: true,
                },
            },
            {
                name: "system-utilities",
                description: "System-level utilities and diagnostics",
                baseTrustLevel: "verified",
                commonCapabilities: [
                    "system.execute",
                    "system.monitor",
                    "system.configure",
                ],
                performanceProfile: { expectedLatency: 400, resourceUsage: "medium" },
                securityProfile: {
                    riskLevel: "medium",
                    auditRequired: true,
                    rateLimitingRequired: false,
                },
            },
        ];
        categories.forEach((category) => {
            this.categories.set(category.name, category);
        });
    }
    async registerRuvSwarmTools() {
        const ruvSwarmTools = [
            // Swarm Management
            {
                name: "mcp__ruv-swarm__swarm_init",
                category: "swarm-management",
                description: "Initialize swarm with topology",
                tags: ["swarm", "init", "topology"],
            },
            {
                name: "mcp__ruv-swarm__swarm_status",
                category: "swarm-management",
                description: "Get swarm status and metrics",
                tags: ["swarm", "status", "monitor"],
            },
            {
                name: "mcp__ruv-swarm__swarm_monitor",
                category: "swarm-management",
                description: "Monitor swarm activity in real-time",
                tags: ["swarm", "monitor", "realtime"],
            },
            // Agent Management
            {
                name: "mcp__ruv-swarm__agent_spawn",
                category: "agent-lifecycle",
                description: "Spawn new agent in swarm",
                tags: ["agent", "spawn", "create"],
            },
            {
                name: "mcp__ruv-swarm__agent_list",
                category: "agent-lifecycle",
                description: "List all active agents",
                tags: ["agent", "list", "query"],
            },
            {
                name: "mcp__ruv-swarm__agent_metrics",
                category: "performance-monitoring",
                description: "Get agent performance metrics",
                tags: ["agent", "metrics", "performance"],
            },
            // Task Management
            {
                name: "mcp__ruv-swarm__task_orchestrate",
                category: "task-orchestration",
                description: "Orchestrate task across swarm",
                tags: ["task", "orchestrate", "distribute"],
            },
            {
                name: "mcp__ruv-swarm__task_status",
                category: "task-orchestration",
                description: "Check task execution status",
                tags: ["task", "status", "monitor"],
            },
            {
                name: "mcp__ruv-swarm__task_results",
                category: "task-orchestration",
                description: "Retrieve task results",
                tags: ["task", "results", "retrieve"],
            },
            // Performance & Benchmarks
            {
                name: "mcp__ruv-swarm__benchmark_run",
                category: "performance-monitoring",
                description: "Execute performance benchmarks",
                tags: ["benchmark", "performance", "test"],
            },
            {
                name: "mcp__ruv-swarm__features_detect",
                category: "system-utilities",
                description: "Detect runtime features",
                tags: ["features", "detect", "capabilities"],
            },
            {
                name: "mcp__ruv-swarm__memory_usage",
                category: "memory-management",
                description: "Get memory usage statistics",
                tags: ["memory", "usage", "stats"],
            },
            // Neural Features
            {
                name: "mcp__ruv-swarm__neural_status",
                category: "neural-ai",
                description: "Get neural agent status",
                tags: ["neural", "status", "ai"],
            },
            {
                name: "mcp__ruv-swarm__neural_train",
                category: "neural-ai",
                description: "Train neural agents",
                tags: ["neural", "train", "learning"],
            },
            {
                name: "mcp__ruv-swarm__neural_patterns",
                category: "neural-ai",
                description: "Get cognitive patterns",
                tags: ["neural", "patterns", "cognitive"],
            },
            // DAA Tools
            {
                name: "mcp__ruv-swarm__daa_init",
                category: "daa-autonomous",
                description: "Initialize DAA service",
                tags: ["daa", "init", "autonomous"],
            },
            {
                name: "mcp__ruv-swarm__daa_agent_create",
                category: "daa-autonomous",
                description: "Create autonomous agent",
                tags: ["daa", "agent", "create"],
            },
            {
                name: "mcp__ruv-swarm__daa_agent_adapt",
                category: "daa-autonomous",
                description: "Adapt agent behavior",
                tags: ["daa", "adapt", "learning"],
            },
            {
                name: "mcp__ruv-swarm__daa_workflow_create",
                category: "daa-autonomous",
                description: "Create autonomous workflow",
                tags: ["daa", "workflow", "automation"],
            },
            {
                name: "mcp__ruv-swarm__daa_workflow_execute",
                category: "daa-autonomous",
                description: "Execute DAA workflow",
                tags: ["daa", "workflow", "execute"],
            },
            {
                name: "mcp__ruv-swarm__daa_knowledge_share",
                category: "daa-autonomous",
                description: "Share knowledge between agents",
                tags: ["daa", "knowledge", "share"],
            },
            {
                name: "mcp__ruv-swarm__daa_learning_status",
                category: "daa-autonomous",
                description: "Get learning progress status",
                tags: ["daa", "learning", "status"],
            },
            {
                name: "mcp__ruv-swarm__daa_cognitive_pattern",
                category: "daa-autonomous",
                description: "Manage cognitive patterns",
                tags: ["daa", "cognitive", "pattern"],
            },
            {
                name: "mcp__ruv-swarm__daa_meta_learning",
                category: "daa-autonomous",
                description: "Enable meta-learning",
                tags: ["daa", "meta", "learning"],
            },
            {
                name: "mcp__ruv-swarm__daa_performance_metrics",
                category: "daa-autonomous",
                description: "Get DAA performance metrics",
                tags: ["daa", "performance", "metrics"],
            },
        ];
        for (const tool of ruvSwarmTools) {
            await this.registerTool(tool.name, "ruv-swarm", tool.category, tool.description, tool.tags);
        }
    }
    async registerClaudeFlowTools() {
        const claudeFlowTools = [
            // Swarm Management
            {
                name: "mcp__gemini-flow__swarm_init",
                category: "swarm-management",
                description: "Initialize swarm with configuration",
                tags: ["swarm", "init", "config"],
            },
            {
                name: "mcp__gemini-flow__swarm_status",
                category: "swarm-management",
                description: "Check swarm health and performance",
                tags: ["swarm", "status", "health"],
            },
            {
                name: "mcp__gemini-flow__swarm_monitor",
                category: "swarm-management",
                description: "Real-time swarm monitoring",
                tags: ["swarm", "monitor", "realtime"],
            },
            {
                name: "mcp__gemini-flow__swarm_scale",
                category: "swarm-management",
                description: "Auto-scale agent count",
                tags: ["swarm", "scale", "auto"],
            },
            {
                name: "mcp__gemini-flow__swarm_destroy",
                category: "swarm-management",
                description: "Gracefully shutdown swarm",
                tags: ["swarm", "destroy", "shutdown"],
            },
            // Agent Management
            {
                name: "mcp__gemini-flow__agent_spawn",
                category: "agent-lifecycle",
                description: "Create specialized AI agents",
                tags: ["agent", "spawn", "specialized"],
            },
            {
                name: "mcp__gemini-flow__agent_list",
                category: "agent-lifecycle",
                description: "List active agents & capabilities",
                tags: ["agent", "list", "capabilities"],
            },
            {
                name: "mcp__gemini-flow__agent_metrics",
                category: "performance-monitoring",
                description: "Agent performance metrics",
                tags: ["agent", "metrics", "performance"],
            },
            // Task Orchestration
            {
                name: "mcp__gemini-flow__task_orchestrate",
                category: "task-orchestration",
                description: "Orchestrate complex workflows",
                tags: ["task", "orchestrate", "complex"],
            },
            {
                name: "mcp__gemini-flow__task_status",
                category: "task-orchestration",
                description: "Check task execution status",
                tags: ["task", "status", "execution"],
            },
            {
                name: "mcp__gemini-flow__task_results",
                category: "task-orchestration",
                description: "Get task completion results",
                tags: ["task", "results", "completion"],
            },
            // Neural & AI
            {
                name: "mcp__gemini-flow__neural_status",
                category: "neural-ai",
                description: "Check neural network status",
                tags: ["neural", "status", "network"],
            },
            {
                name: "mcp__gemini-flow__neural_train",
                category: "neural-ai",
                description: "Train neural patterns with WASM",
                tags: ["neural", "train", "wasm"],
            },
            {
                name: "mcp__gemini-flow__neural_patterns",
                category: "neural-ai",
                description: "Analyze cognitive patterns",
                tags: ["neural", "patterns", "analyze"],
            },
            {
                name: "mcp__gemini-flow__neural_predict",
                category: "neural-ai",
                description: "Make AI predictions",
                tags: ["neural", "predict", "ai"],
            },
            {
                name: "mcp__gemini-flow__neural_compress",
                category: "neural-ai",
                description: "Compress neural models",
                tags: ["neural", "compress", "optimize"],
            },
            {
                name: "mcp__gemini-flow__neural_explain",
                category: "neural-ai",
                description: "AI explainability",
                tags: ["neural", "explain", "transparency"],
            },
            // Memory Management
            {
                name: "mcp__gemini-flow__memory_usage",
                category: "memory-management",
                description: "Store/retrieve persistent memory",
                tags: ["memory", "store", "persistent"],
            },
            {
                name: "mcp__gemini-flow__memory_search",
                category: "memory-management",
                description: "Search memory with patterns",
                tags: ["memory", "search", "patterns"],
            },
            {
                name: "mcp__gemini-flow__memory_persist",
                category: "memory-management",
                description: "Cross-session persistence",
                tags: ["memory", "persist", "session"],
            },
            {
                name: "mcp__gemini-flow__memory_namespace",
                category: "memory-management",
                description: "Namespace management",
                tags: ["memory", "namespace", "organize"],
            },
            {
                name: "mcp__gemini-flow__memory_backup",
                category: "memory-management",
                description: "Backup memory stores",
                tags: ["memory", "backup", "recovery"],
            },
            {
                name: "mcp__gemini-flow__memory_restore",
                category: "memory-management",
                description: "Restore from backups",
                tags: ["memory", "restore", "recovery"],
            },
            {
                name: "mcp__gemini-flow__memory_compress",
                category: "memory-management",
                description: "Compress memory data",
                tags: ["memory", "compress", "optimize"],
            },
            {
                name: "mcp__gemini-flow__memory_sync",
                category: "memory-management",
                description: "Sync across instances",
                tags: ["memory", "sync", "distribute"],
            },
            {
                name: "mcp__gemini-flow__memory_analytics",
                category: "memory-management",
                description: "Analyze memory usage",
                tags: ["memory", "analytics", "insights"],
            },
            // Performance & Analytics
            {
                name: "mcp__gemini-flow__performance_report",
                category: "performance-monitoring",
                description: "Generate performance reports",
                tags: ["performance", "report", "analytics"],
            },
            {
                name: "mcp__gemini-flow__bottleneck_analyze",
                category: "performance-monitoring",
                description: "Identify bottlenecks",
                tags: ["performance", "bottleneck", "analyze"],
            },
            {
                name: "mcp__gemini-flow__token_usage",
                category: "performance-monitoring",
                description: "Analyze token consumption",
                tags: ["performance", "token", "usage"],
            },
            {
                name: "mcp__gemini-flow__benchmark_run",
                category: "performance-monitoring",
                description: "Performance benchmarks",
                tags: ["performance", "benchmark", "test"],
            },
            {
                name: "mcp__gemini-flow__metrics_collect",
                category: "performance-monitoring",
                description: "Collect system metrics",
                tags: ["performance", "metrics", "collect"],
            },
            {
                name: "mcp__gemini-flow__trend_analysis",
                category: "performance-monitoring",
                description: "Analyze performance trends",
                tags: ["performance", "trend", "analysis"],
            },
            {
                name: "mcp__gemini-flow__cost_analysis",
                category: "performance-monitoring",
                description: "Cost and resource analysis",
                tags: ["performance", "cost", "resource"],
            },
            {
                name: "mcp__gemini-flow__quality_assess",
                category: "performance-monitoring",
                description: "Quality assessment",
                tags: ["performance", "quality", "assess"],
            },
            {
                name: "mcp__gemini-flow__error_analysis",
                category: "performance-monitoring",
                description: "Error pattern analysis",
                tags: ["performance", "error", "pattern"],
            },
            {
                name: "mcp__gemini-flow__usage_stats",
                category: "performance-monitoring",
                description: "Usage statistics",
                tags: ["performance", "usage", "stats"],
            },
            {
                name: "mcp__gemini-flow__health_check",
                category: "performance-monitoring",
                description: "System health monitoring",
                tags: ["performance", "health", "monitor"],
            },
            // GitHub Integration
            {
                name: "mcp__gemini-flow__github_repo_analyze",
                category: "github-integration",
                description: "Repository analysis",
                tags: ["github", "repo", "analyze"],
            },
            {
                name: "mcp__gemini-flow__github_pr_manage",
                category: "github-integration",
                description: "Pull request management",
                tags: ["github", "pr", "manage"],
            },
            {
                name: "mcp__gemini-flow__github_issue_track",
                category: "github-integration",
                description: "Issue tracking & triage",
                tags: ["github", "issue", "track"],
            },
            {
                name: "mcp__gemini-flow__github_release_coord",
                category: "github-integration",
                description: "Release coordination",
                tags: ["github", "release", "coordinate"],
            },
            {
                name: "mcp__gemini-flow__github_workflow_auto",
                category: "github-integration",
                description: "Workflow automation",
                tags: ["github", "workflow", "auto"],
            },
            {
                name: "mcp__gemini-flow__github_code_review",
                category: "github-integration",
                description: "Automated code review",
                tags: ["github", "code", "review"],
            },
            {
                name: "mcp__gemini-flow__github_sync_coord",
                category: "github-integration",
                description: "Multi-repo sync",
                tags: ["github", "sync", "multi-repo"],
            },
            {
                name: "mcp__gemini-flow__github_metrics",
                category: "github-integration",
                description: "Repository metrics",
                tags: ["github", "metrics", "stats"],
            },
            // Workflow & Automation
            {
                name: "mcp__gemini-flow__workflow_create",
                category: "workflow-automation",
                description: "Create custom workflows",
                tags: ["workflow", "create", "custom"],
            },
            {
                name: "mcp__gemini-flow__workflow_execute",
                category: "workflow-automation",
                description: "Execute predefined workflows",
                tags: ["workflow", "execute", "predefined"],
            },
            {
                name: "mcp__gemini-flow__workflow_export",
                category: "workflow-automation",
                description: "Export workflow definitions",
                tags: ["workflow", "export", "definition"],
            },
            {
                name: "mcp__gemini-flow__workflow_template",
                category: "workflow-automation",
                description: "Manage workflow templates",
                tags: ["workflow", "template", "manage"],
            },
            {
                name: "mcp__gemini-flow__automation_setup",
                category: "workflow-automation",
                description: "Setup automation rules",
                tags: ["workflow", "automation", "rules"],
            },
            {
                name: "mcp__gemini-flow__pipeline_create",
                category: "workflow-automation",
                description: "Create CI/CD pipelines",
                tags: ["workflow", "pipeline", "cicd"],
            },
            {
                name: "mcp__gemini-flow__scheduler_manage",
                category: "workflow-automation",
                description: "Manage task scheduling",
                tags: ["workflow", "scheduler", "task"],
            },
            {
                name: "mcp__gemini-flow__trigger_setup",
                category: "workflow-automation",
                description: "Setup event triggers",
                tags: ["workflow", "trigger", "event"],
            },
            {
                name: "mcp__gemini-flow__batch_process",
                category: "workflow-automation",
                description: "Batch processing",
                tags: ["workflow", "batch", "process"],
            },
            {
                name: "mcp__gemini-flow__parallel_execute",
                category: "workflow-automation",
                description: "Execute tasks in parallel",
                tags: ["workflow", "parallel", "execute"],
            },
            // SPARC Development
            {
                name: "mcp__gemini-flow__sparc_mode",
                category: "workflow-automation",
                description: "Run SPARC development modes",
                tags: ["sparc", "development", "mode"],
            },
            // DAA Tools
            {
                name: "mcp__gemini-flow__daa_agent_create",
                category: "daa-autonomous",
                description: "Create dynamic agents",
                tags: ["daa", "agent", "dynamic"],
            },
            {
                name: "mcp__gemini-flow__daa_capability_match",
                category: "daa-autonomous",
                description: "Match capabilities to tasks",
                tags: ["daa", "capability", "match"],
            },
            {
                name: "mcp__gemini-flow__daa_resource_alloc",
                category: "daa-autonomous",
                description: "Resource allocation",
                tags: ["daa", "resource", "allocate"],
            },
            {
                name: "mcp__gemini-flow__daa_lifecycle_manage",
                category: "daa-autonomous",
                description: "Agent lifecycle management",
                tags: ["daa", "lifecycle", "manage"],
            },
            {
                name: "mcp__gemini-flow__daa_communication",
                category: "daa-autonomous",
                description: "Inter-agent communication",
                tags: ["daa", "communication", "inter-agent"],
            },
            {
                name: "mcp__gemini-flow__daa_consensus",
                category: "daa-autonomous",
                description: "Consensus mechanisms",
                tags: ["daa", "consensus", "agreement"],
            },
            {
                name: "mcp__gemini-flow__daa_fault_tolerance",
                category: "daa-autonomous",
                description: "Fault tolerance & recovery",
                tags: ["daa", "fault", "tolerance"],
            },
            {
                name: "mcp__gemini-flow__daa_optimization",
                category: "daa-autonomous",
                description: "Performance optimization",
                tags: ["daa", "optimization", "performance"],
            },
            // Model & AI Operations
            {
                name: "mcp__gemini-flow__model_load",
                category: "neural-ai",
                description: "Load pre-trained models",
                tags: ["model", "load", "pretrained"],
            },
            {
                name: "mcp__gemini-flow__model_save",
                category: "neural-ai",
                description: "Save trained models",
                tags: ["model", "save", "persist"],
            },
            {
                name: "mcp__gemini-flow__inference_run",
                category: "neural-ai",
                description: "Run neural inference",
                tags: ["model", "inference", "predict"],
            },
            {
                name: "mcp__gemini-flow__pattern_recognize",
                category: "neural-ai",
                description: "Pattern recognition",
                tags: ["model", "pattern", "recognize"],
            },
            {
                name: "mcp__gemini-flow__cognitive_analyze",
                category: "neural-ai",
                description: "Cognitive behavior analysis",
                tags: ["model", "cognitive", "analyze"],
            },
            {
                name: "mcp__gemini-flow__learning_adapt",
                category: "neural-ai",
                description: "Adaptive learning",
                tags: ["model", "learning", "adapt"],
            },
            {
                name: "mcp__gemini-flow__ensemble_create",
                category: "neural-ai",
                description: "Create model ensembles",
                tags: ["model", "ensemble", "combine"],
            },
            {
                name: "mcp__gemini-flow__transfer_learn",
                category: "neural-ai",
                description: "Transfer learning",
                tags: ["model", "transfer", "learn"],
            },
            // System & Infrastructure
            {
                name: "mcp__gemini-flow__topology_optimize",
                category: "swarm-management",
                description: "Auto-optimize topology",
                tags: ["swarm", "topology", "optimize"],
            },
            {
                name: "mcp__gemini-flow__load_balance",
                category: "swarm-management",
                description: "Distribute tasks efficiently",
                tags: ["swarm", "load", "balance"],
            },
            {
                name: "mcp__gemini-flow__coordination_sync",
                category: "swarm-management",
                description: "Sync agent coordination",
                tags: ["swarm", "coordination", "sync"],
            },
            {
                name: "mcp__gemini-flow__wasm_optimize",
                category: "system-utilities",
                description: "WASM SIMD optimization",
                tags: ["system", "wasm", "optimize"],
            },
            {
                name: "mcp__gemini-flow__cache_manage",
                category: "system-utilities",
                description: "Manage coordination cache",
                tags: ["system", "cache", "manage"],
            },
            {
                name: "mcp__gemini-flow__state_snapshot",
                category: "system-utilities",
                description: "Create state snapshots",
                tags: ["system", "state", "snapshot"],
            },
            {
                name: "mcp__gemini-flow__context_restore",
                category: "system-utilities",
                description: "Restore execution context",
                tags: ["system", "context", "restore"],
            },
            {
                name: "mcp__gemini-flow__terminal_execute",
                category: "system-utilities",
                description: "Execute terminal commands",
                tags: ["system", "terminal", "execute"],
            },
            {
                name: "mcp__gemini-flow__config_manage",
                category: "system-utilities",
                description: "Configuration management",
                tags: ["system", "config", "manage"],
            },
            {
                name: "mcp__gemini-flow__features_detect",
                category: "system-utilities",
                description: "Feature detection",
                tags: ["system", "features", "detect"],
            },
            {
                name: "mcp__gemini-flow__security_scan",
                category: "system-utilities",
                description: "Security scanning",
                tags: ["system", "security", "scan"],
            },
            {
                name: "mcp__gemini-flow__backup_create",
                category: "system-utilities",
                description: "Create system backups",
                tags: ["system", "backup", "create"],
            },
            {
                name: "mcp__gemini-flow__restore_system",
                category: "system-utilities",
                description: "System restoration",
                tags: ["system", "restore", "recovery"],
            },
            {
                name: "mcp__gemini-flow__log_analysis",
                category: "system-utilities",
                description: "Log analysis & insights",
                tags: ["system", "log", "analyze"],
            },
            {
                name: "mcp__gemini-flow__diagnostic_run",
                category: "system-utilities",
                description: "System diagnostics",
                tags: ["system", "diagnostic", "health"],
            },
        ];
        for (const tool of claudeFlowTools) {
            await this.registerTool(tool.name, "gemini-flow", tool.category, tool.description, tool.tags);
        }
    }
    async registerTool(toolName, provider, category, description, tags) {
        const categoryDef = this.categories.get(category);
        if (!categoryDef) {
            throw new Error(`Unknown category: ${category}`);
        }
        // Create A2A capability from tool definition
        const a2aCapability = {
            name: toolName.replace("mcp__", "").replace(/__/g, "."),
            version: "1.0.0",
            description,
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
            security: {
                minTrustLevel: categoryDef.baseTrustLevel,
                requiredCapabilities: categoryDef.commonCapabilities,
                rateLimits: categoryDef.securityProfile.rateLimitingRequired
                    ? {
                        perMinute: 60,
                        perHour: 1000,
                        perDay: 10000,
                    }
                    : undefined,
            },
            performance: {
                avgLatency: categoryDef.performanceProfile.expectedLatency,
                resourceUsage: categoryDef.performanceProfile.resourceUsage,
                cacheable: true,
                cacheStrategy: "conservative",
            },
        };
        // Create wrapper
        const wrapper = new GenericMCPToolWrapper(toolName, a2aCapability, toolName, this.transformationEngine);
        // Create transformation rules
        const transformationRules = [
            {
                id: `${toolName}_mcp_to_a2a`,
                sourceType: "mcp",
                targetType: "a2a",
                sourceSchema: { toolName },
                targetSchema: { capabilityName: a2aCapability.name },
                mappings: [],
                metadata: {
                    version: "1.0.0",
                    author: "system",
                    description: `Transform ${toolName} from MCP to A2A`,
                    lastUpdated: new Date(),
                },
            },
            {
                id: `${toolName}_a2a_to_mcp`,
                sourceType: "a2a",
                targetType: "mcp",
                sourceSchema: { capabilityName: a2aCapability.name },
                targetSchema: { toolName },
                mappings: [],
                metadata: {
                    version: "1.0.0",
                    author: "system",
                    description: `Transform ${toolName} from A2A to MCP`,
                    lastUpdated: new Date(),
                },
            },
        ];
        // Create registration
        const registration = {
            toolName,
            mcpProvider: provider,
            category,
            description,
            parameters: {},
            a2aCapability,
            transformationRules,
            wrapper,
            metadata: {
                version: "1.0.0",
                lastUpdated: new Date(),
                usageCount: 0,
                averageLatency: categoryDef.performanceProfile.expectedLatency,
                successRate: 0.95, // Initial success rate
                tags,
            },
        };
        this.registrations.set(toolName, registration);
        // Register with capability manager
        await this.capabilityManager.registerCapability(toolName, a2aCapability, wrapper, { category, provider, tags });
    }
    async generateCompatibilityMatrix() {
        this.logger.info("Generating compatibility matrix");
        // Analyze tool relationships and dependencies
        for (const [toolName, registration] of this.registrations) {
            const compatibility = {
                compatible: [],
                incompatible: [],
                conflicts: [],
            };
            // Tools in the same category are generally compatible
            const sameCategory = Array.from(this.registrations.values())
                .filter((r) => r.category === registration.category && r.toolName !== toolName)
                .map((r) => r.toolName);
            compatibility.compatible.push(...sameCategory);
            // Detect potential conflicts (simplified rules)
            if (registration.category === "swarm-management") {
                // Swarm tools might conflict with direct agent management
                const agentTools = Array.from(this.registrations.values())
                    .filter((r) => r.category === "agent-lifecycle" &&
                    r.metadata.tags.includes("direct"))
                    .map((r) => r.toolName);
                compatibility.conflicts.push(...agentTools);
            }
            this.compatibilityMatrix.toolCompatibility[toolName] = compatibility;
        }
        // Generate category compatibility
        for (const [categoryName, categoryDef] of this.categories) {
            const compatibleCategories = [];
            // Add compatible categories based on trust levels and risk
            for (const [otherName, otherDef] of this.categories) {
                if (otherName === categoryName)
                    continue;
                // Compatible if trust levels are close and risk levels align
                const trustDiff = Math.abs(this.getTrustLevelIndex(categoryDef.baseTrustLevel) -
                    this.getTrustLevelIndex(otherDef.baseTrustLevel));
                if (trustDiff <= 1) {
                    compatibleCategories.push(otherName);
                }
            }
            this.compatibilityMatrix.categoryCompatibility[categoryName] =
                compatibleCategories;
        }
        // Generate trust level compatibility
        const trustLevels = [
            "untrusted",
            "basic",
            "verified",
            "trusted",
            "privileged",
        ];
        for (const level of trustLevels) {
            const compatible = trustLevels.filter((other) => {
                const levelIndex = trustLevels.indexOf(level);
                const otherIndex = trustLevels.indexOf(other);
                return otherIndex >= levelIndex; // Higher or equal trust levels are compatible
            });
            this.compatibilityMatrix.trustLevelCompatibility[level] = compatible;
        }
        this.compatibilityMatrix.lastUpdated = new Date();
    }
    async registerTransformationRules() {
        this.logger.info("Registering transformation rules");
        for (const registration of this.registrations.values()) {
            for (const rule of registration.transformationRules) {
                await this.transformationEngine.registerTransformationRule(rule);
            }
        }
    }
    getTrustLevelIndex(level) {
        const levels = ["untrusted", "basic", "verified", "trusted", "privileged"];
        return levels.indexOf(level);
    }
}

/**
 * Protocol Activator
 *
 * Manages activation and coordination of A2A and MCP protocols
 * Provides automatic discovery and conditional loading based on environment
 */
import { Logger } from "../utils/logger.js";
import { featureFlags } from "../core/feature-flags.js";
import { EventEmitter } from "events";
export class ProtocolActivator extends EventEmitter {
    logger;
    activeProtocols = new Map();
    protocolConfigs = new Map();
    protocolStatus = new Map();
    activationPromises = new Map();
    constructor() {
        super();
        this.logger = new Logger("ProtocolActivator");
        this.setupProtocolConfigs();
        this.performEnvironmentDetection();
    }
    /**
     * Setup protocol configurations
     */
    setupProtocolConfigs() {
        const configs = [
            {
                name: "A2A",
                version: "1.0.0",
                enabled: false,
                autoDetect: true,
                capabilities: [
                    "agent-communication",
                    "distributed-memory",
                    "consensus-protocols",
                    "swarm-orchestration",
                    "capability-matching",
                    "resource-allocation",
                ],
                dependencies: [],
                ports: [8080, 8081, 8082],
                endpoints: ["/a2a/api", "/a2a/ws", "/a2a/health"],
            },
            {
                name: "MCP",
                version: "1.0.0",
                enabled: false,
                autoDetect: true,
                capabilities: [
                    "tool-registry",
                    "resource-access",
                    "capability-discovery",
                    "protocol-bridging",
                    "context-sharing",
                    "secure-communication",
                ],
                dependencies: ["@modelcontextprotocol/sdk"],
                endpoints: ["/mcp/api", "/mcp/tools", "/mcp/resources"],
            },
            {
                name: "Hybrid",
                version: "1.0.0",
                enabled: false,
                autoDetect: false,
                capabilities: [
                    "a2a-mcp-bridge",
                    "protocol-translation",
                    "unified-interface",
                    "cross-protocol-routing",
                ],
                dependencies: [],
                endpoints: ["/hybrid/api", "/hybrid/bridge"],
            },
        ];
        for (const config of configs) {
            this.protocolConfigs.set(config.name, config);
            this.protocolStatus.set(config.name, {
                name: config.name,
                status: "inactive",
                capabilities: [],
                endpoints: [],
                metrics: {
                    connections: 0,
                    requests: 0,
                    errors: 0,
                    avgResponseTime: 0,
                },
            });
        }
    }
    /**
     * Perform environment detection
     */
    performEnvironmentDetection() {
        // Detect A2A environment
        this.detectA2AEnvironment();
        // Detect MCP environment
        this.detectMCPEnvironment();
        // Update feature flags based on detection
        this.updateFeatureFlags();
    }
    /**
     * Detect A2A protocol environment
     */
    detectA2AEnvironment() {
        const indicators = [
            // Environment variables
            process.env.A2A_ENABLED === "true",
            process.env.GEMINI_A2A_MODE === "true",
            // Configuration files
            this.fileExists(".a2a-config.json"),
            this.fileExists("a2a.config.js"),
            // Port availability
            this.checkPortsAvailable([8080, 8081]),
            // Feature flag
            featureFlags.isEnabled("a2aProtocol"),
        ];
        const detected = indicators.some(Boolean);
        if (detected) {
            this.logger.info("A2A protocol environment detected");
            const config = this.protocolConfigs.get("A2A");
            config.enabled = true;
        }
        return detected;
    }
    /**
     * Detect MCP protocol environment
     */
    detectMCPEnvironment() {
        const indicators = [
            // Environment variables
            process.env.MCP_ENABLED === "true",
            process.env.MCP_SERVER_URL !== undefined,
            // Dependencies
            this.checkDependency("@modelcontextprotocol/sdk"),
            // Configuration
            this.fileExists(".mcp-config.json"),
            this.fileExists("mcp.config.js"),
            // Feature flag
            featureFlags.isEnabled("mcpProtocol"),
        ];
        const detected = indicators.some(Boolean);
        if (detected) {
            this.logger.info("MCP protocol environment detected");
            const config = this.protocolConfigs.get("MCP");
            config.enabled = true;
        }
        return detected;
    }
    /**
     * Update feature flags based on detection
     */
    updateFeatureFlags() {
        const a2aConfig = this.protocolConfigs.get("A2A");
        const mcpConfig = this.protocolConfigs.get("MCP");
        if (a2aConfig.enabled && !featureFlags.isEnabled("a2aProtocol")) {
            featureFlags.enable("a2aProtocol");
        }
        if (mcpConfig.enabled && !featureFlags.isEnabled("mcpProtocol")) {
            featureFlags.enable("mcpProtocol");
        }
        // Enable hybrid if both are detected
        if (a2aConfig.enabled && mcpConfig.enabled) {
            const hybridConfig = this.protocolConfigs.get("Hybrid");
            hybridConfig.enabled = true;
            this.logger.info("Hybrid A2A-MCP mode enabled");
        }
    }
    /**
     * Validate topology parameter
     */
    validateTopology(topology) {
        const validTopologies = [
            "hierarchical",
            "mesh",
            "ring",
            "star",
        ];
        if (!validTopologies.includes(topology)) {
            throw new Error(`Invalid topology '${topology}'. Must be one of: ${validTopologies.join(", ")}`);
        }
    }
    /**
     * Activate a protocol with required topology specification
     */
    async activateProtocol(protocolName, topology) {
        // Validate topology parameter
        this.validateTopology(topology);
        const config = this.protocolConfigs.get(protocolName);
        if (!config) {
            return {
                success: false,
                protocol: protocolName,
                capabilities: [],
                endpoints: [],
                fallbacksUsed: [],
                topology,
                error: `Unknown protocol: ${protocolName}`,
            };
        }
        // Set topology in config
        config.topology = topology;
        // Return existing activation promise if in progress
        if (this.activationPromises.has(protocolName)) {
            return await this.activationPromises.get(protocolName);
        }
        // Create activation promise
        const activationPromise = this.performActivation(config, topology);
        this.activationPromises.set(protocolName, activationPromise);
        try {
            const result = await activationPromise;
            this.activationPromises.delete(protocolName);
            return result;
        }
        catch (error) {
            this.activationPromises.delete(protocolName);
            throw error;
        }
    }
    /**
     * Perform protocol activation
     */
    async performActivation(config, topology) {
        const startTime = performance.now();
        this.logger.info(`Activating protocol: ${config.name}...`);
        // Update status
        const status = this.protocolStatus.get(config.name);
        status.status = "activating";
        this.emit("protocol_activating", { protocol: config.name });
        try {
            // Check dependencies
            const missingDeps = this.checkMissingDependencies(config);
            if (missingDeps.length > 0) {
                throw new Error(`Missing dependencies: ${missingDeps.join(", ")}`);
            }
            let protocolInstance;
            const fallbacksUsed = [];
            // Load protocol implementation
            switch (config.name) {
                case "A2A":
                    protocolInstance = await this.activateA2AProtocol(config, topology, fallbacksUsed);
                    break;
                case "MCP":
                    protocolInstance = await this.activateMCPProtocol(config, topology, fallbacksUsed);
                    break;
                case "Hybrid":
                    protocolInstance = await this.activateHybridProtocol(config, topology, fallbacksUsed);
                    break;
                default:
                    throw new Error(`Unknown protocol activation: ${config.name}`);
            }
            // Store active protocol
            this.activeProtocols.set(config.name, protocolInstance);
            // Update status
            status.status = "active";
            status.version = config.version;
            status.capabilities = config.capabilities;
            status.endpoints = config.endpoints || [];
            status.activatedAt = new Date();
            const activationTime = performance.now() - startTime;
            this.logger.info(`Protocol activated: ${config.name}`, {
                topology: topology,
                activationTime: `${activationTime.toFixed(2)}ms`,
                capabilities: config.capabilities.length,
                endpoints: status.endpoints.length,
                fallbacks: fallbacksUsed.length,
            });
            this.emit("protocol_activated", {
                protocol: config.name,
                topology: topology,
                capabilities: config.capabilities,
                endpoints: status.endpoints,
                activationTime,
            });
            return {
                success: true,
                protocol: config.name,
                capabilities: config.capabilities,
                endpoints: status.endpoints,
                fallbacksUsed,
                topology,
            };
        }
        catch (error) {
            // Update status
            status.status = "error";
            status.lastError = error.message;
            this.logger.error(`Protocol activation failed: ${config.name}`, error);
            this.emit("protocol_error", {
                protocol: config.name,
                error: error.message,
            });
            return {
                success: false,
                protocol: config.name,
                capabilities: [],
                endpoints: [],
                fallbacksUsed: [],
                topology,
                error: error.message,
            };
        }
    }
    /**
     * Activate A2A protocol
     */
    async activateA2AProtocol(config, topology, fallbacks) {
        try {
            // Try loading full A2A implementation
            const { A2AProtocolManager } = await import("./a2a/core/a2a-protocol-manager.js");
            const { A2AMessageRouter } = await import("./a2a/core/a2a-message-router.js");
            const protocolManager = new A2AProtocolManager({
                agentId: "gemini-flow-agent",
                topology: topology,
                agentCard: {
                    id: "gemini-flow-agent",
                    name: "Gemini Flow Agent",
                    description: "AI assistant with multi-model capabilities",
                    version: "1.1.0",
                    capabilities: [],
                    services: [],
                    endpoints: [],
                    metadata: {
                        type: "coordinator",
                        status: "idle",
                        load: 0.1,
                        created: Date.now(),
                        lastSeen: Date.now(),
                    },
                },
                transports: [],
                defaultTransport: "http",
                routingStrategy: this.getRoutingStrategy(topology),
                maxHops: this.getMaxHops(topology),
                discoveryEnabled: false,
                discoveryInterval: 60000,
                securityEnabled: true,
                trustedAgents: [],
                messageTimeout: 30000,
                maxConcurrentMessages: 10,
                retryPolicy: {
                    maxAttempts: 3,
                    backoffStrategy: "exponential",
                    baseDelay: 1000,
                    maxDelay: 10000,
                    jitter: true,
                },
            });
            const messageRouter = new A2AMessageRouter();
            await protocolManager.initialize();
            await messageRouter.initialize();
            return { protocolManager, messageRouter };
        }
        catch (error) {
            this.logger.warn("Full A2A implementation not available, trying simplified version", error.message);
            // Fallback to simplified A2A
            fallbacks.push("simplified-a2a");
            try {
                const { SimpleA2AAdapter } = await import("./simple-a2a-adapter.js");
                const adapter = new SimpleA2AAdapter({ topology });
                await adapter.initialize();
                return adapter;
            }
            catch (fallbackError) {
                throw new Error(`A2A activation failed: ${error.message}, fallback failed: ${fallbackError.message}`);
            }
        }
    }
    /**
     * Activate MCP protocol
     */
    async activateMCPProtocol(config, topology, fallbacks) {
        try {
            // Try loading full MCP implementation
            const { MCPToGeminiAdapter } = await import("../core/mcp-adapter.js");
            const mcpAdapter = new MCPToGeminiAdapter("", "gemini-2.5-flash", {
                topology,
            });
            // MCPToGeminiAdapter doesn't have initialize method, it initializes in constructor
            return mcpAdapter;
        }
        catch (error) {
            this.logger.warn("Full MCP implementation not available, trying bridge mode", error.message);
            // Fallback to MCP bridge
            fallbacks.push("mcp-bridge");
            try {
                const { SimpleMCPBridge } = await import("./simple-mcp-bridge.js");
                const bridge = new SimpleMCPBridge({ topology });
                await bridge.initialize();
                return bridge;
            }
            catch (fallbackError) {
                throw new Error(`MCP activation failed: ${error.message}, fallback failed: ${fallbackError.message}`);
            }
        }
    }
    /**
     * Activate hybrid protocol
     */
    async activateHybridProtocol(config, topology, fallbacks) {
        // Ensure both A2A and MCP are active with same topology
        if (!this.isProtocolActive("A2A")) {
            await this.activateProtocol("A2A", topology);
        }
        if (!this.isProtocolActive("MCP")) {
            await this.activateProtocol("MCP", topology);
        }
        try {
            const { A2AMCPBridge } = await import("./a2a/core/a2a-mcp-bridge.js");
            const bridge = new A2AMCPBridge({ topology });
            // Configure bridge after instantiation if needed
            // bridge.configure({
            //   a2aProtocol: this.activeProtocols.get('A2A'),
            //   mcpProtocol: this.activeProtocols.get('MCP')
            // });
            await bridge.initialize();
            return bridge;
        }
        catch (error) {
            throw new Error(`Hybrid protocol activation failed: ${error.message}`);
        }
    }
    /**
     * Deactivate a protocol
     */
    async deactivateProtocol(protocolName) {
        const protocol = this.activeProtocols.get(protocolName);
        if (!protocol) {
            return false;
        }
        try {
            if (protocol.shutdown) {
                await protocol.shutdown();
            }
            this.activeProtocols.delete(protocolName);
            const status = this.protocolStatus.get(protocolName);
            status.status = "inactive";
            status.capabilities = [];
            status.endpoints = [];
            status.lastError = undefined;
            this.logger.info(`Protocol deactivated: ${protocolName}`);
            this.emit("protocol_deactivated", { protocol: protocolName });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to deactivate protocol ${protocolName}:`, error);
            return false;
        }
    }
    /**
     * Get protocol instance
     */
    getProtocol(protocolName) {
        return this.activeProtocols.get(protocolName) || null;
    }
    /**
     * Check if protocol is active
     */
    isProtocolActive(protocolName) {
        const status = this.protocolStatus.get(protocolName);
        return status ? status.status === "active" : false;
    }
    /**
     * Get protocol status
     */
    getProtocolStatus(protocolName) {
        return this.protocolStatus.get(protocolName) || null;
    }
    /**
     * Get all protocol statuses
     */
    getAllStatuses() {
        return Array.from(this.protocolStatus.values());
    }
    /**
     * Get routing strategy based on topology
     */
    getRoutingStrategy(topology) {
        switch (topology) {
            case "hierarchical":
                return "shortest_path";
            case "mesh":
                return "load_balanced";
            case "ring":
                return "shortest_path";
            case "star":
                return "direct";
            default:
                return "direct";
        }
    }
    /**
     * Get max hops based on topology
     */
    getMaxHops(topology) {
        switch (topology) {
            case "hierarchical":
                return 5;
            case "mesh":
                return 3;
            case "ring":
                return 10;
            case "star":
                return 2;
            default:
                return 3;
        }
    }
    /**
     * Auto-activate protocols based on configuration (requires topology)
     */
    async autoActivate(topology) {
        // Validate topology parameter
        this.validateTopology(topology);
        const results = [];
        for (const [name, config] of Array.from(this.protocolConfigs.entries())) {
            if (config.enabled && config.autoDetect) {
                try {
                    const result = await this.activateProtocol(name, topology);
                    results.push(result);
                }
                catch (error) {
                    results.push({
                        success: false,
                        protocol: name,
                        capabilities: [],
                        endpoints: [],
                        fallbacksUsed: [],
                        topology,
                        error: error.message,
                    });
                }
            }
        }
        return results;
    }
    /**
     * Get activation summary
     */
    getActivationSummary() {
        const active = Array.from(this.protocolStatus.values()).filter((s) => s.status === "active");
        const total = this.protocolStatus.size;
        return {
            total,
            active: active.length,
            inactive: total - active.length,
            protocols: Object.fromEntries(Array.from(this.protocolStatus.entries()).map(([name, status]) => [
                name,
                {
                    status: status.status,
                    capabilities: status.capabilities.length,
                    endpoints: status.endpoints.length,
                },
            ])),
            capabilities: Array.from(new Set(active.flatMap((s) => s.capabilities))),
            mode: this.determineMode(),
            topology: this.getCurrentTopology(),
        };
    }
    /**
     * Get current topology from active protocols
     */
    getCurrentTopology() {
        const activeConfigs = Array.from(this.protocolConfigs.values()).filter((config) => config.enabled && config.topology);
        return activeConfigs.length > 0 ? activeConfigs[0].topology : null;
    }
    /**
     * Determine current mode
     */
    determineMode() {
        const activeProtocols = Array.from(this.protocolStatus.values())
            .filter((s) => s.status === "active")
            .map((s) => s.name);
        if (activeProtocols.includes("Hybrid")) {
            return "hybrid";
        }
        else if (activeProtocols.includes("A2A") &&
            activeProtocols.includes("MCP")) {
            return "dual";
        }
        else if (activeProtocols.includes("A2A")) {
            return "a2a-only";
        }
        else if (activeProtocols.includes("MCP")) {
            return "mcp-only";
        }
        else {
            return "none";
        }
    }
    // Helper methods
    fileExists(filename) {
        try {
            require("fs").accessSync(filename);
            return true;
        }
        catch {
            return false;
        }
    }
    checkPortsAvailable(ports) {
        // Simple check - in production would use actual port checking
        return process.env.NODE_ENV !== "production";
    }
    checkDependency(dep) {
        try {
            require.resolve(dep);
            return true;
        }
        catch {
            return false;
        }
    }
    checkMissingDependencies(config) {
        return config.dependencies.filter((dep) => !this.checkDependency(dep));
    }
    /**
     * Shutdown all protocols
     */
    async shutdown() {
        this.logger.info("Shutting down all protocols...");
        const deactivationPromises = Array.from(this.activeProtocols.keys()).map((name) => this.deactivateProtocol(name));
        await Promise.allSettled(deactivationPromises);
        this.activeProtocols.clear();
        this.activationPromises.clear();
        this.logger.info("All protocols shut down");
    }
}
// Export singleton instance
let activatorInstance = null;
export function getProtocolActivator() {
    if (!activatorInstance) {
        activatorInstance = new ProtocolActivator();
    }
    return activatorInstance;
}
export function resetProtocolActivator() {
    if (activatorInstance) {
        activatorInstance.shutdown();
        activatorInstance = null;
    }
}

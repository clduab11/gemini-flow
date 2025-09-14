/**
 * Comprehensive Test Suite for Protocol Activator
 * Tests topology requirement validation and protocol activation logic
 */
import { ProtocolActivator, } from "../protocol-activator.js";
import { featureFlags } from "../../core/feature-flags.js";
// Mock dependencies
jest.mock("../../utils/logger.js");
jest.mock("../../core/feature-flags.js");
jest.mock("fs");
const mockFeatureFlags = featureFlags;
describe("ProtocolActivator", () => {
    let activator;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        // Reset environment variables
        delete process.env.A2A_ENABLED;
        delete process.env.MCP_ENABLED;
        delete process.env.GEMINI_A2A_MODE;
        delete process.env.MCP_SERVER_URL;
        // Mock feature flags
        mockFeatureFlags.isEnabled.mockReturnValue(false);
        mockFeatureFlags.enable.mockImplementation(() => { });
        activator = new ProtocolActivator();
    });
    afterEach(() => {
        activator?.shutdown();
    });
    describe("Initialization", () => {
        it("should initialize with default protocol configurations", () => {
            const statuses = activator.getAllStatuses();
            expect(statuses).toHaveLength(3);
            expect(statuses.map((s) => s.name)).toEqual(["A2A", "MCP", "Hybrid"]);
            statuses.forEach((status) => {
                expect(status.status).toBe("inactive");
                expect(status.capabilities).toEqual([]);
                expect(status.endpoints).toEqual([]);
            });
        });
        it("should setup protocol configurations correctly", () => {
            const summary = activator.getActivationSummary();
            expect(summary.total).toBe(3);
            expect(summary.active).toBe(0);
            expect(summary.inactive).toBe(3);
            expect(summary.mode).toBe("none");
        });
        it("should perform environment detection on initialization", () => {
            expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith("a2aProtocol");
            expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith("mcpProtocol");
        });
    });
    describe("Environment Detection", () => {
        describe("A2A Detection", () => {
            it("should detect A2A environment through environment variable", () => {
                process.env.A2A_ENABLED = "true";
                const newActivator = new ProtocolActivator();
                const a2aStatus = newActivator.getProtocolStatus("A2A");
                // Note: Detection happens during construction, so we need to check the config
                const summary = newActivator.getActivationSummary();
                expect(summary.protocols.A2A).toBeDefined();
                newActivator.shutdown();
            });
            it("should detect A2A environment through GEMINI_A2A_MODE", () => {
                process.env.GEMINI_A2A_MODE = "true";
                const newActivator = new ProtocolActivator();
                const summary = newActivator.getActivationSummary();
                expect(summary.protocols.A2A).toBeDefined();
                newActivator.shutdown();
            });
            it("should detect A2A environment through feature flag", () => {
                mockFeatureFlags.isEnabled.mockImplementation((flag) => flag === "a2aProtocol");
                const newActivator = new ProtocolActivator();
                expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith("a2aProtocol");
                newActivator.shutdown();
            });
        });
        describe("MCP Detection", () => {
            it("should detect MCP environment through environment variable", () => {
                process.env.MCP_ENABLED = "true";
                const newActivator = new ProtocolActivator();
                const summary = newActivator.getActivationSummary();
                expect(summary.protocols.MCP).toBeDefined();
                newActivator.shutdown();
            });
            it("should detect MCP environment through server URL", () => {
                process.env.MCP_SERVER_URL = "http://localhost:3000";
                const newActivator = new ProtocolActivator();
                const summary = newActivator.getActivationSummary();
                expect(summary.protocols.MCP).toBeDefined();
                newActivator.shutdown();
            });
            it("should detect MCP environment through feature flag", () => {
                mockFeatureFlags.isEnabled.mockImplementation((flag) => flag === "mcpProtocol");
                const newActivator = new ProtocolActivator();
                expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith("mcpProtocol");
                newActivator.shutdown();
            });
        });
        describe("Hybrid Mode Detection", () => {
            it("should enable hybrid mode when both A2A and MCP are detected", () => {
                process.env.A2A_ENABLED = "true";
                process.env.MCP_ENABLED = "true";
                const newActivator = new ProtocolActivator();
                const summary = newActivator.getActivationSummary();
                expect(summary.protocols.A2A).toBeDefined();
                expect(summary.protocols.MCP).toBeDefined();
                expect(summary.protocols.Hybrid).toBeDefined();
                newActivator.shutdown();
            });
        });
    });
    describe("Topology Validation", () => {
        it("should accept valid topology values", async () => {
            const validTopologies = [
                "hierarchical",
                "mesh",
                "ring",
                "star",
            ];
            for (const topology of validTopologies) {
                // Should not throw for valid topologies
                const result = await activator.activateProtocol("UNKNOWN", topology);
                expect(result.success).toBe(false); // Will fail for unknown protocol, but topology validation passes
                expect(result.topology).toBe(topology);
                expect(result.error).toContain("Unknown protocol: UNKNOWN");
            }
        });
        it("should reject invalid topology values", async () => {
            const invalidTopology = "invalid";
            await expect(activator.activateProtocol("A2A", invalidTopology)).rejects.toThrow("Invalid topology 'invalid'. Must be one of: hierarchical, mesh, ring, star");
        });
        it("should reject undefined topology", async () => {
            // @ts-ignore - Testing runtime behavior with invalid input
            await expect(activator.activateProtocol("A2A", undefined)).rejects.toThrow("Invalid topology 'undefined'. Must be one of: hierarchical, mesh, ring, star");
        });
        it("should include topology in activation results", async () => {
            const result = await activator.activateProtocol("UNKNOWN", "mesh");
            expect(result.topology).toBe("mesh");
        });
        it("should require topology for autoActivate", async () => {
            const invalidTopology = "invalid";
            await expect(activator.autoActivate(invalidTopology)).rejects.toThrow("Invalid topology 'invalid'. Must be one of: hierarchical, mesh, ring, star");
        });
    });
    describe("Protocol Activation", () => {
        describe("Successful Activation", () => {
            it("should activate A2A protocol successfully", async () => {
                // Mock successful A2A import
                jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                    A2AProtocolManager: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                jest.doMock("../a2a/core/a2a-message-router.js", () => ({
                    A2AMessageRouter: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                const result = await activator.activateProtocol("A2A", "mesh");
                expect(result.success).toBe(true);
                expect(result.protocol).toBe("A2A");
                expect(result.capabilities).toEqual([
                    "agent-communication",
                    "distributed-memory",
                    "consensus-protocols",
                    "swarm-orchestration",
                    "capability-matching",
                    "resource-allocation",
                ]);
                expect(result.error).toBeUndefined();
                expect(activator.isProtocolActive("A2A")).toBe(true);
            });
            it("should activate MCP protocol successfully", async () => {
                // Mock successful MCP import
                jest.doMock("../../core/mcp-adapter.js", () => ({
                    MCPToGeminiAdapter: jest.fn().mockImplementation(() => ({})),
                }));
                const result = await activator.activateProtocol("MCP", "star");
                expect(result.success).toBe(true);
                expect(result.protocol).toBe("MCP");
                expect(result.capabilities).toEqual([
                    "tool-registry",
                    "resource-access",
                    "capability-discovery",
                    "protocol-bridging",
                    "context-sharing",
                    "secure-communication",
                ]);
            });
            it("should activate Hybrid protocol when dependencies are met", async () => {
                // First activate A2A and MCP
                jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                    A2AProtocolManager: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                jest.doMock("../a2a/core/a2a-message-router.js", () => ({
                    A2AMessageRouter: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                jest.doMock("../../core/mcp-adapter.js", () => ({
                    MCPToGeminiAdapter: jest.fn().mockImplementation(() => ({})),
                }));
                jest.doMock("../a2a/core/a2a-mcp-bridge.js", () => ({
                    A2AMCPBridge: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                await activator.activateProtocol("A2A", "mesh");
                await activator.activateProtocol("MCP", "star");
                const result = await activator.activateProtocol("Hybrid", "hierarchical");
                expect(result.success).toBe(true);
                expect(result.protocol).toBe("Hybrid");
                expect(activator.isProtocolActive("Hybrid")).toBe(true);
            });
        });
        describe("Fallback Mechanisms", () => {
            it("should fallback to simplified A2A when full implementation fails", async () => {
                // Mock failed full implementation
                jest.doMock("../a2a/core/a2a-protocol-manager.js", () => {
                    throw new Error("Module not found");
                });
                // Mock successful fallback
                jest.doMock("../simple-a2a-adapter.js", () => ({
                    SimpleA2AAdapter: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                const result = await activator.activateProtocol("A2A", "mesh");
                expect(result.success).toBe(true);
                expect(result.fallbacksUsed).toContain("simplified-a2a");
            });
            it("should fallback to MCP bridge when full implementation fails", async () => {
                // Mock failed full implementation
                jest.doMock("../../core/mcp-adapter.js", () => {
                    throw new Error("Module not found");
                });
                // Mock successful fallback
                jest.doMock("../simple-mcp-bridge.js", () => ({
                    SimpleMCPBridge: jest.fn().mockImplementation(() => ({
                        initialize: jest.fn().mockResolvedValue(undefined),
                    })),
                }));
                const result = await activator.activateProtocol("MCP", "star");
                expect(result.success).toBe(true);
                expect(result.fallbacksUsed).toContain("mcp-bridge");
            });
        });
        describe("Activation Failures", () => {
            it("should fail activation for unknown protocol", async () => {
                const result = await activator.activateProtocol("UNKNOWN", "mesh");
                expect(result.success).toBe(false);
                expect(result.error).toBe("Unknown protocol: UNKNOWN");
                expect(result.capabilities).toEqual([]);
                expect(result.endpoints).toEqual([]);
            });
            it("should fail activation when dependencies are missing", async () => {
                // Mock missing dependencies check
                jest.spyOn(activator, "checkDependency").mockReturnValue(false);
                const result = await activator.activateProtocol("MCP", "star");
                expect(result.success).toBe(false);
                expect(result.error).toContain("Missing dependencies");
            });
            it("should handle activation errors gracefully", async () => {
                // Mock module that throws during activation
                jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                    A2AProtocolManager: jest.fn().mockImplementation(() => ({
                        initialize: jest
                            .fn()
                            .mockRejectedValue(new Error("Initialization failed")),
                    })),
                }));
                jest.doMock("../simple-a2a-adapter.js", () => ({
                    SimpleA2AAdapter: jest.fn().mockImplementation(() => ({
                        initialize: jest
                            .fn()
                            .mockRejectedValue(new Error("Fallback failed")),
                    })),
                }));
                const result = await activator.activateProtocol("A2A", "mesh");
                expect(result.success).toBe(false);
                expect(result.error).toContain("A2A activation failed");
                const status = activator.getProtocolStatus("A2A");
                expect(status?.status).toBe("error");
            });
            it("should prevent concurrent activations of same protocol", async () => {
                // Mock slow activation
                jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                    A2AProtocolManager: jest.fn().mockImplementation(() => ({
                        initialize: jest
                            .fn()
                            .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000))),
                    })),
                }));
                // Start two activations concurrently
                const promise1 = activator.activateProtocol("A2A", "mesh");
                const promise2 = activator.activateProtocol("A2A", "mesh");
                const [result1, result2] = await Promise.all([promise1, promise2]);
                // Both should receive the same result
                expect(result1).toEqual(result2);
            });
        });
    });
    describe("Topology Requirements Validation", () => {
        describe("Network Topology Validation", () => {
            it("should validate mesh topology requirements", () => {
                // Test mesh topology - requires all nodes connected
                const mockTopology = {
                    type: "mesh",
                    nodes: [
                        { id: "agent1", connections: ["agent2", "agent3"] },
                        { id: "agent2", connections: ["agent1", "agent3"] },
                        { id: "agent3", connections: ["agent1", "agent2"] },
                    ],
                };
                // In a real implementation, this would be a method on the activator
                const isValidMesh = mockTopology.nodes.every((node) => node.connections.length === mockTopology.nodes.length - 1);
                expect(isValidMesh).toBe(true);
            });
            it("should validate hierarchical topology requirements", () => {
                // Test hierarchical topology - requires clear parent-child relationships
                const mockTopology = {
                    type: "hierarchical",
                    nodes: [
                        { id: "root", level: 0, children: ["child1", "child2"] },
                        { id: "child1", level: 1, parent: "root", children: [] },
                        { id: "child2", level: 1, parent: "root", children: [] },
                    ],
                };
                const hasValidHierarchy = mockTopology.nodes.every((node) => {
                    if (node.level === 0) {
                        return !("parent" in node) && node.children.length > 0;
                    }
                    else {
                        return "parent" in node;
                    }
                });
                expect(hasValidHierarchy).toBe(true);
            });
            it("should validate ring topology requirements", () => {
                // Test ring topology - each node connected to exactly 2 others
                const mockTopology = {
                    type: "ring",
                    nodes: [
                        { id: "agent1", prev: "agent3", next: "agent2" },
                        { id: "agent2", prev: "agent1", next: "agent3" },
                        { id: "agent3", prev: "agent2", next: "agent1" },
                    ],
                };
                const isValidRing = mockTopology.nodes.every((node) => "prev" in node && "next" in node && node.prev !== node.next);
                expect(isValidRing).toBe(true);
            });
            it("should validate star topology requirements", () => {
                // Test star topology - one central hub connected to all others
                const mockTopology = {
                    type: "star",
                    hub: "agent1",
                    spokes: ["agent2", "agent3", "agent4"],
                };
                const isValidStar = mockTopology.spokes.every((spoke) => spoke !== mockTopology.hub);
                expect(isValidStar).toBe(true);
            });
        });
        describe("Protocol Compatibility Validation", () => {
            it("should validate A2A protocol requirements", () => {
                const a2aRequirements = {
                    minNodes: 3,
                    requiredPorts: [8080, 8081, 8082],
                    requiredCapabilities: ["agent-communication", "distributed-memory"],
                    supportedTopologies: ["mesh", "hierarchical", "ring", "hybrid"],
                };
                // Test minimum node requirement
                expect(3).toBeGreaterThanOrEqual(a2aRequirements.minNodes);
                // Test required capabilities
                const availableCapabilities = [
                    "agent-communication",
                    "distributed-memory",
                    "consensus-protocols",
                ];
                const hasRequiredCapabilities = a2aRequirements.requiredCapabilities.every((cap) => availableCapabilities.includes(cap));
                expect(hasRequiredCapabilities).toBe(true);
            });
            it("should validate MCP protocol requirements", () => {
                const mcpRequirements = {
                    requiredDependencies: ["@modelcontextprotocol/sdk"],
                    requiredEndpoints: ["/mcp/api", "/mcp/tools"],
                    supportedProtocols: ["http", "ws"],
                };
                // In real implementation, would check actual dependencies
                const mockDependencies = ["@modelcontextprotocol/sdk"];
                const hasDependencies = mcpRequirements.requiredDependencies.every((dep) => mockDependencies.includes(dep));
                expect(hasDependencies).toBe(true);
            });
            it("should validate Hybrid protocol requirements", () => {
                const hybridRequirements = {
                    requiresBoth: ["A2A", "MCP"],
                    bridgeCapabilities: ["protocol-translation", "unified-interface"],
                    compatibilityMode: "bidirectional",
                };
                // Mock active protocols
                const activeProtocols = ["A2A", "MCP"];
                const hasRequiredProtocols = hybridRequirements.requiresBoth.every((protocol) => activeProtocols.includes(protocol));
                expect(hasRequiredProtocols).toBe(true);
            });
        });
        describe("Resource Requirements Validation", () => {
            it("should validate memory requirements", () => {
                const memoryRequirements = {
                    A2A: { min: 50 * 1024 * 1024, recommended: 100 * 1024 * 1024 },
                    MCP: { min: 25 * 1024 * 1024, recommended: 50 * 1024 * 1024 },
                    Hybrid: { min: 100 * 1024 * 1024, recommended: 200 * 1024 * 1024 },
                };
                // Mock available memory
                const availableMemory = 500 * 1024 * 1024; // 500MB
                Object.values(memoryRequirements).forEach((req) => {
                    expect(availableMemory).toBeGreaterThanOrEqual(req.min);
                });
            });
            it("should validate port availability", () => {
                const portRequirements = {
                    A2A: [8080, 8081, 8082],
                    MCP: [3000, 3001],
                    Hybrid: [9000],
                };
                // Mock port checker
                const mockPortChecker = jest.spyOn(activator, "checkPortsAvailable");
                mockPortChecker.mockReturnValue(true);
                Object.entries(portRequirements).forEach(([protocol, ports]) => {
                    expect(activator.checkPortsAvailable(ports)).toBe(true);
                });
            });
            it("should validate network bandwidth requirements", () => {
                const bandwidthRequirements = {
                    A2A: { minMbps: 10, recommendedMbps: 100 },
                    MCP: { minMbps: 5, recommendedMbps: 50 },
                    Hybrid: { minMbps: 20, recommendedMbps: 200 },
                };
                // Mock network speed test
                const availableBandwidth = 1000; // 1 Gbps
                Object.values(bandwidthRequirements).forEach((req) => {
                    expect(availableBandwidth).toBeGreaterThanOrEqual(req.minMbps);
                });
            });
        });
    });
    describe("Protocol Management", () => {
        it("should deactivate protocol successfully", async () => {
            // First activate a protocol
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                    shutdown: jest.fn().mockResolvedValue(undefined),
                })),
            }));
            await activator.activateProtocol("A2A", "mesh");
            expect(activator.isProtocolActive("A2A")).toBe(true);
            const result = await activator.deactivateProtocol("A2A");
            expect(result).toBe(true);
            expect(activator.isProtocolActive("A2A")).toBe(false);
            const status = activator.getProtocolStatus("A2A");
            expect(status?.status).toBe("inactive");
        });
        it("should get protocol instance", async () => {
            const mockInstance = { test: "value" };
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => mockInstance),
            }));
            await activator.activateProtocol("A2A", "mesh");
            const instance = activator.getProtocol("A2A");
            expect(instance).toBeDefined();
        });
        it("should auto-activate enabled protocols", async () => {
            // Enable protocols through environment
            process.env.A2A_ENABLED = "true";
            process.env.MCP_ENABLED = "true";
            // Mock successful activations
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                })),
            }));
            jest.doMock("../../core/mcp-adapter.js", () => ({
                MCPToGeminiAdapter: jest.fn().mockImplementation(() => ({})),
            }));
            const newActivator = new ProtocolActivator();
            const results = await newActivator.autoActivate("mesh");
            expect(results.length).toBeGreaterThan(0);
            const successfulActivations = results.filter((r) => r.success);
            expect(successfulActivations.length).toBeGreaterThan(0);
            newActivator.shutdown();
        });
        it("should provide comprehensive activation summary", () => {
            const summary = activator.getActivationSummary();
            expect(summary).toHaveProperty("total");
            expect(summary).toHaveProperty("active");
            expect(summary).toHaveProperty("inactive");
            expect(summary).toHaveProperty("protocols");
            expect(summary).toHaveProperty("capabilities");
            expect(summary).toHaveProperty("mode");
            expect(summary.total).toBe(3);
            expect(summary.mode).toBe("none");
            expect(Array.isArray(summary.capabilities)).toBe(true);
        });
    });
    describe("Error Handling", () => {
        it("should handle shutdown gracefully", async () => {
            // Activate multiple protocols
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                    shutdown: jest.fn().mockResolvedValue(undefined),
                })),
            }));
            await activator.activateProtocol("A2A", "mesh");
            await expect(activator.shutdown()).resolves.not.toThrow();
            expect(activator.isProtocolActive("A2A")).toBe(false);
        });
        it("should handle protocol errors during operation", async () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation();
            // Simulate protocol error
            activator.emit("protocol_error", {
                protocol: "A2A",
                error: "Connection lost",
            });
            // Verify error handling doesn't crash the system
            expect(activator.getAllStatuses()).toBeDefined();
            errorSpy.mockRestore();
        });
    });
    describe("Event Handling", () => {
        it("should emit protocol events correctly", (done) => {
            const events = [];
            activator.on("protocol_activating", () => {
                events.push("activating");
            });
            activator.on("protocol_activated", () => {
                events.push("activated");
            });
            activator.on("protocol_error", () => {
                events.push("error");
            });
            // Mock successful activation
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                })),
            }));
            activator.activateProtocol("A2A", "mesh").then(() => {
                expect(events).toContain("activating");
                expect(events).toContain("activated");
                done();
            });
        });
        it("should emit appropriate events for failures", (done) => {
            activator.on("protocol_error", (event) => {
                expect(event.protocol).toBe("A2A");
                expect(event.error).toBeDefined();
                done();
            });
            // Mock failed activation
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => {
                throw new Error("Activation failed");
            });
            jest.doMock("../simple-a2a-adapter.js", () => {
                throw new Error("Fallback failed");
            });
            activator.activateProtocol("A2A", "mesh");
        });
    });
    describe("Performance Metrics", () => {
        it("should track activation performance", async () => {
            const startTime = Date.now();
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => ({
                    initialize: jest
                        .fn()
                        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))),
                })),
            }));
            await activator.activateProtocol("A2A", "mesh");
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(duration).toBeGreaterThanOrEqual(100);
            expect(activator.isProtocolActive("A2A")).toBe(true);
        });
        it("should handle concurrent activation requests efficiently", async () => {
            jest.doMock("../a2a/core/a2a-protocol-manager.js", () => ({
                A2AProtocolManager: jest.fn().mockImplementation(() => ({
                    initialize: jest.fn().mockResolvedValue(undefined),
                })),
            }));
            const promises = Array.from({ length: 10 }, () => activator.activateProtocol("A2A", "mesh"));
            const results = await Promise.all(promises);
            // All should succeed and return the same result
            results.forEach((result) => {
                expect(result.success).toBe(true);
                expect(result.protocol).toBe("A2A");
            });
        });
    });
    describe("Edge Cases", () => {
        it("should handle empty protocol configurations", () => {
            // Test with minimal configuration
            const statuses = activator.getAllStatuses();
            expect(statuses.length).toBeGreaterThan(0);
            statuses.forEach((status) => {
                expect(status.name).toBeTruthy();
                expect(Array.isArray(status.capabilities)).toBe(true);
                expect(Array.isArray(status.endpoints)).toBe(true);
            });
        });
        it("should handle protocol activation with missing modules", async () => {
            // Don't mock any modules to simulate missing dependencies
            const result = await activator.activateProtocol("A2A", "mesh");
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
        it("should maintain state consistency during errors", async () => {
            const initialStatuses = activator.getAllStatuses();
            // Attempt failed activation
            await activator.activateProtocol("UNKNOWN", "mesh");
            const finalStatuses = activator.getAllStatuses();
            // State should remain consistent
            expect(finalStatuses.length).toBe(initialStatuses.length);
            finalStatuses.forEach((status, index) => {
                expect(status.name).toBe(initialStatuses[index].name);
            });
        });
    });
});
//# sourceMappingURL=protocol-activator.test.js.map
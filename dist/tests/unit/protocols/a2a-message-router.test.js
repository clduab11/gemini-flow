/**
 * A2A Message Router Tests
 *
 * Comprehensive test suite for A2AMessageRouter with intelligent routing logic
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
// Mock implementation will be created later
class A2AMessageRouter {
    constructor() { }
    async initialize() { }
    async shutdown() { }
    async routeMessage(message) { return {}; }
    async registerAgent(agentCard) { }
    async unregisterAgent(agentId) { }
    async findRoute(from, to, strategy) { return {}; }
    async updateAgentMetrics(agentId, metrics) { }
    getRoutingTable() { return new Map(); }
    getRoutingMetrics() { return {}; }
}
describe('A2AMessageRouter', () => {
    let messageRouter;
    let mockAgents;
    beforeEach(async () => {
        messageRouter = new A2AMessageRouter();
        // Create mock agent network
        mockAgents = [
            {
                id: 'coordinator-001',
                name: 'Task Coordinator',
                description: 'Central task coordination agent',
                version: '1.0.0',
                capabilities: [
                    {
                        name: 'task-coordination',
                        version: '1.0.0',
                        description: 'Coordinate complex multi-agent tasks'
                    },
                    {
                        name: 'resource-management',
                        version: '1.0.0',
                        description: 'Manage computational resources'
                    }
                ],
                services: [
                    {
                        name: 'coordinateTask',
                        method: 'task.coordinate',
                        description: 'Coordinate a multi-step task',
                        cost: 10,
                        latency: 50,
                        reliability: 0.99
                    }
                ],
                endpoints: [
                    {
                        protocol: 'websocket',
                        address: 'coordinator.local',
                        port: 8080,
                        secure: true,
                        maxConnections: 200
                    }
                ],
                metadata: {
                    type: 'coordinator',
                    status: 'idle',
                    load: 0.20,
                    created: Date.now() - 3600000,
                    lastSeen: Date.now() - 500,
                    metrics: {
                        responseTime: { avg: 45, p50: 40, p95: 80, p99: 150 },
                        requestsPerSecond: 25.0,
                        messagesProcessed: 5420,
                        cpuUsage: 0.30,
                        memoryUsage: 0.45,
                        networkUsage: 2048000,
                        successRate: 0.99,
                        errorRate: 0.01,
                        uptime: 99.8
                    },
                    trustLevel: 'trusted'
                }
            },
            {
                id: 'researcher-001',
                name: 'Research Agent',
                description: 'Specialized research and analysis agent',
                version: '1.2.0',
                capabilities: [
                    {
                        name: 'web-research',
                        version: '1.2.0',
                        description: 'Advanced web research capabilities'
                    },
                    {
                        name: 'data-analysis',
                        version: '2.0.0',
                        description: 'Statistical and qualitative data analysis'
                    }
                ],
                services: [
                    {
                        name: 'researchTopic',
                        method: 'research.topic',
                        description: 'Conduct comprehensive topic research',
                        cost: 15,
                        latency: 2000,
                        reliability: 0.95
                    }
                ],
                endpoints: [
                    {
                        protocol: 'http',
                        address: 'researcher.local',
                        port: 8081,
                        secure: true
                    }
                ],
                metadata: {
                    type: 'researcher',
                    status: 'busy',
                    load: 0.75,
                    created: Date.now() - 7200000,
                    lastSeen: Date.now() - 100,
                    metrics: {
                        responseTime: { avg: 1800, p50: 1500, p95: 3000, p99: 5000 },
                        requestsPerSecond: 2.5,
                        messagesProcessed: 892,
                        cpuUsage: 0.80,
                        memoryUsage: 0.65,
                        networkUsage: 5120000,
                        successRate: 0.95,
                        errorRate: 0.05,
                        uptime: 98.5
                    },
                    trustLevel: 'verified'
                }
            },
            {
                id: 'coder-001',
                name: 'Code Generation Agent',
                description: 'Advanced code generation and refactoring agent',
                version: '2.1.0',
                capabilities: [
                    {
                        name: 'code-generation',
                        version: '2.1.0',
                        description: 'Generate high-quality code in multiple languages'
                    },
                    {
                        name: 'code-analysis',
                        version: '1.5.0',
                        description: 'Static and dynamic code analysis'
                    }
                ],
                services: [
                    {
                        name: 'generateCode',
                        method: 'code.generate',
                        description: 'Generate code from specifications',
                        cost: 20,
                        latency: 1500,
                        reliability: 0.97
                    }
                ],
                endpoints: [
                    {
                        protocol: 'grpc',
                        address: 'coder.local',
                        port: 9090,
                        secure: true
                    }
                ],
                metadata: {
                    type: 'coder',
                    status: 'idle',
                    load: 0.10,
                    created: Date.now() - 1800000,
                    lastSeen: Date.now() - 200,
                    metrics: {
                        responseTime: { avg: 1400, p50: 1200, p95: 2500, p99: 4000 },
                        requestsPerSecond: 1.8,
                        messagesProcessed: 324,
                        cpuUsage: 0.15,
                        memoryUsage: 0.35,
                        networkUsage: 1536000,
                        successRate: 0.97,
                        errorRate: 0.03,
                        uptime: 99.2
                    },
                    trustLevel: 'trusted'
                }
            },
            {
                id: 'analyzer-001',
                name: 'Data Analysis Agent',
                description: 'Specialized data analysis and visualization agent',
                version: '1.8.0',
                capabilities: [
                    {
                        name: 'statistical-analysis',
                        version: '1.8.0',
                        description: 'Advanced statistical analysis capabilities'
                    },
                    {
                        name: 'data-visualization',
                        version: '1.0.0',
                        description: 'Create charts and visualizations'
                    }
                ],
                services: [
                    {
                        name: 'analyzeData',
                        method: 'data.analyze',
                        description: 'Perform statistical analysis on datasets',
                        cost: 12,
                        latency: 800,
                        reliability: 0.98
                    }
                ],
                endpoints: [
                    {
                        protocol: 'websocket',
                        address: 'analyzer.local',
                        port: 8082,
                        secure: false
                    }
                ],
                metadata: {
                    type: 'analyst',
                    status: 'idle',
                    load: 0.30,
                    created: Date.now() - 5400000,
                    lastSeen: Date.now() - 300,
                    metrics: {
                        responseTime: { avg: 750, p50: 600, p95: 1200, p99: 2000 },
                        requestsPerSecond: 8.5,
                        messagesProcessed: 2108,
                        cpuUsage: 0.35,
                        memoryUsage: 0.50,
                        networkUsage: 3072000,
                        successRate: 0.98,
                        errorRate: 0.02,
                        uptime: 99.5
                    },
                    trustLevel: 'verified'
                }
            }
        ];
        await messageRouter.initialize();
        // Register all mock agents
        for (const agent of mockAgents) {
            await messageRouter.registerAgent(agent);
        }
    });
    afterEach(async () => {
        await messageRouter.shutdown();
        jest.clearAllMocks();
    });
    describe('Agent Registration and Discovery', () => {
        it('should register agents in routing table', async () => {
            const newAgent = {
                id: 'test-agent-002',
                name: 'Test Agent 2',
                description: 'Another test agent',
                version: '1.0.0',
                capabilities: [],
                services: [],
                endpoints: [{
                        protocol: 'http',
                        address: 'localhost',
                        port: 8083
                    }],
                metadata: {
                    type: 'specialist',
                    status: 'idle',
                    load: 0.0,
                    created: Date.now(),
                    lastSeen: Date.now()
                }
            };
            await expect(messageRouter.registerAgent(newAgent)).resolves.not.toThrow();
            const routingTable = messageRouter.getRoutingTable();
            expect(routingTable.has('test-agent-002')).toBe(true);
            expect(routingTable.get('test-agent-002')?.name).toBe('Test Agent 2');
        });
        it('should unregister agents from routing table', async () => {
            await messageRouter.unregisterAgent('researcher-001');
            const routingTable = messageRouter.getRoutingTable();
            expect(routingTable.has('researcher-001')).toBe(false);
        });
        it('should update agent metrics', async () => {
            const newMetrics = {
                responseTime: { avg: 100, p50: 80, p95: 150, p99: 250 },
                load: 0.45,
                status: 'busy'
            };
            await expect(messageRouter.updateAgentMetrics('coordinator-001', newMetrics))
                .resolves.not.toThrow();
        });
        it('should handle duplicate agent registration', async () => {
            const duplicateAgent = { ...mockAgents[0] };
            await expect(messageRouter.registerAgent(duplicateAgent))
                .rejects.toThrow('Agent already registered: coordinator-001');
        });
    });
    describe('Direct Routing Strategy', () => {
        it('should find direct route to single agent', async () => {
            const route = await messageRouter.findRoute('coordinator-001', 'researcher-001', 'direct');
            expect(route.strategy).toBe('direct');
            expect(route.path).toEqual(['coordinator-001', 'researcher-001']);
            expect(route.hops).toBe(1);
        });
        it('should route direct message successfully', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'research.topic',
                params: { topic: 'artificial intelligence' },
                id: 'direct-001',
                from: 'coordinator-001',
                to: 'researcher-001',
                timestamp: Date.now(),
                messageType: 'request',
                priority: 'normal'
            };
            const route = await messageRouter.routeMessage(message);
            expect(route.strategy).toBe('direct');
            expect(route.path).toContain('researcher-001');
        });
        it('should handle direct routing to non-existent agent', async () => {
            await expect(messageRouter.findRoute('coordinator-001', 'non-existent', 'direct'))
                .rejects.toMatchObject({
                type: 'agent_unavailable',
                message: 'Target agent not found: non-existent'
            });
        });
    });
    describe('Load Balanced Routing Strategy', () => {
        it('should select least loaded agent with required capability', async () => {
            // Add another coder agent with higher load
            const busyCoderAgent = {
                ...mockAgents.find(a => a.id === 'coder-001'),
                id: 'coder-002',
                name: 'Busy Coder Agent',
                metadata: {
                    ...mockAgents.find(a => a.id === 'coder-001').metadata,
                    load: 0.90, // Much higher load
                    status: 'busy'
                }
            };
            await messageRouter.registerAgent(busyCoderAgent);
            const route = await messageRouter.findRoute('coordinator-001', ['coder-001', 'coder-002'], 'load_balanced');
            expect(route.strategy).toBe('load_balanced');
            // Should prefer coder-001 (load: 0.10) over coder-002 (load: 0.90)
            expect(route.path).toContain('coder-001');
        });
        it('should handle load balancing with all agents busy', async () => {
            // Update all agents to be busy
            for (const agent of mockAgents) {
                await messageRouter.updateAgentMetrics(agent.id, {
                    load: 0.95,
                    status: 'overloaded'
                });
            }
            const message = {
                jsonrpc: '2.0',
                method: 'any.service',
                params: {},
                id: 'overload-001',
                from: 'coordinator-001',
                to: ['researcher-001', 'coder-001', 'analyzer-001'],
                timestamp: Date.now(),
                messageType: 'request',
                priority: 'normal'
            };
            const route = await messageRouter.routeMessage(message);
            expect(route.strategy).toBe('load_balanced');
            // Should still route to least loaded available agent
            expect(route.path.length).toBeGreaterThan(1);
        });
    });
    describe('Capability-Aware Routing Strategy', () => {
        it('should route to agent with specific capability', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'research.topic',
                params: { topic: 'machine learning' },
                id: 'capability-001',
                from: 'coordinator-001',
                to: 'broadcast', // Let router decide based on capabilities
                timestamp: Date.now(),
                messageType: 'request',
                capabilities: [
                    {
                        name: 'web-research',
                        version: '1.0.0',
                        description: 'Requires web research capability'
                    }
                ]
            };
            const route = await messageRouter.routeMessage(message);
            expect(route.strategy).toBe('capability_aware');
            expect(route.path).toContain('researcher-001'); // Has web-research capability
        });
        it('should route to best matching agent based on capability versions', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'data.analyze',
                params: { dataset: 'large-dataset.csv' },
                id: 'version-match-001',
                from: 'coordinator-001',
                to: 'broadcast',
                timestamp: Date.now(),
                messageType: 'request',
                capabilities: [
                    {
                        name: 'data-analysis',
                        version: '2.0.0', // Exact version match
                        description: 'Requires advanced data analysis'
                    }
                ]
            };
            const route = await messageRouter.routeMessage(message);
            expect(route.strategy).toBe('capability_aware');
            // researcher-001 has data-analysis v2.0.0, analyzer-001 might have older version
            expect(route.path).toContain('researcher-001');
        });
        it('should handle no agents with required capability', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'quantum.compute',
                params: {},
                id: 'no-capability-001',
                from: 'coordinator-001',
                to: 'broadcast',
                timestamp: Date.now(),
                messageType: 'request',
                capabilities: [
                    {
                        name: 'quantum-computing',
                        version: '1.0.0',
                        description: 'Requires quantum computing capability'
                    }
                ]
            };
            await expect(messageRouter.routeMessage(message))
                .rejects.toMatchObject({
                type: 'capability_not_found',
                message: 'No agents found with required capability: quantum-computing'
            });
        });
    });
    describe('Cost-Optimized Routing Strategy', () => {
        it('should select lowest cost agent for service', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'analyze.data',
                params: { data: 'sample-data' },
                id: 'cost-001',
                from: 'coordinator-001',
                to: ['researcher-001', 'analyzer-001'], // Both can analyze data
                timestamp: Date.now(),
                messageType: 'request',
                context: {
                    maxCost: 15 // Prefer cheaper option
                }
            };
            const route = await messageRouter.routeMessage(message);
            expect(route.strategy).toBe('cost_optimized');
            // analyzer-001 has lower cost (12) vs researcher-001 (15)
            expect(route.path).toContain('analyzer-001');
        });
        it('should respect maximum cost constraints', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'generate.code',
                params: { specification: 'simple function' },
                id: 'cost-limit-001',
                from: 'coordinator-001',
                to: 'coder-001',
                timestamp: Date.now(),
                messageType: 'request',
                context: {
                    maxCost: 10 // coder-001 costs 20, should reject
                }
            };
            await expect(messageRouter.routeMessage(message))
                .rejects.toMatchObject({
                type: 'resource_exhausted',
                message: 'Service cost (20) exceeds maximum allowed cost (10)'
            });
        });
    });
    describe('Shortest Path Routing Strategy', () => {
        it('should find shortest path in multi-hop network', async () => {
            // Create a network topology where some agents are not directly connected
            const route = await messageRouter.findRoute('coordinator-001', 'analyzer-001', 'shortest_path');
            expect(route.strategy).toBe('shortest_path');
            expect(route.hops).toBeGreaterThanOrEqual(1);
            expect(route.path[0]).toBe('coordinator-001');
            expect(route.path[route.path.length - 1]).toBe('analyzer-001');
        });
        it('should handle unreachable agents', async () => {
            // Simulate disconnected agent
            await messageRouter.unregisterAgent('analyzer-001');
            await expect(messageRouter.findRoute('coordinator-001', 'analyzer-001', 'shortest_path')).rejects.toMatchObject({
                type: 'routing_error',
                message: 'No path found to agent: analyzer-001'
            });
        });
        it('should respect maximum hop limit', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'distant.service',
                params: {},
                id: 'max-hops-001',
                from: 'coordinator-001',
                to: 'analyzer-001',
                timestamp: Date.now(),
                messageType: 'request',
                route: {
                    path: [],
                    hops: 0,
                    maxHops: 1, // Very restrictive
                    strategy: 'shortest_path'
                }
            };
            const route = await messageRouter.routeMessage(message);
            expect(route.hops).toBeLessThanOrEqual(1);
        });
    });
    describe('Priority-Based Message Handling', () => {
        it('should prioritize critical messages', async () => {
            const normalMessage = {
                jsonrpc: '2.0',
                method: 'normal.task',
                params: {},
                id: 'normal-001',
                from: 'coordinator-001',
                to: 'researcher-001',
                timestamp: Date.now(),
                messageType: 'request',
                priority: 'normal'
            };
            const criticalMessage = {
                jsonrpc: '2.0',
                method: 'critical.task',
                params: {},
                id: 'critical-001',
                from: 'coordinator-001',
                to: 'researcher-001',
                timestamp: Date.now(),
                messageType: 'request',
                priority: 'critical'
            };
            // Both should route successfully, but critical should be prioritized
            const [normalRoute, criticalRoute] = await Promise.all([
                messageRouter.routeMessage(normalMessage),
                messageRouter.routeMessage(criticalMessage)
            ]);
            expect(normalRoute.path).toBeDefined();
            expect(criticalRoute.path).toBeDefined();
        });
        it('should queue low priority messages when system is busy', async () => {
            const lowPriorityMessage = {
                jsonrpc: '2.0',
                method: 'background.task',
                params: {},
                id: 'low-priority-001',
                from: 'coordinator-001',
                to: 'researcher-001', // Already busy (load: 0.75)
                timestamp: Date.now(),
                messageType: 'request',
                priority: 'low'
            };
            const route = await messageRouter.routeMessage(lowPriorityMessage);
            expect(route.path).toBeDefined();
        });
    });
    describe('Broadcast and Multicast Routing', () => {
        it('should handle broadcast messages to all agents', async () => {
            const broadcastMessage = {
                jsonrpc: '2.0',
                method: 'system.announcement',
                params: { message: 'System maintenance scheduled' },
                id: 'broadcast-001',
                from: 'coordinator-001',
                to: 'broadcast',
                timestamp: Date.now(),
                messageType: 'notification'
            };
            const route = await messageRouter.routeMessage(broadcastMessage);
            expect(route.path.length).toBeGreaterThan(2); // Should include multiple agents
            expect(route.path).toContain('researcher-001');
            expect(route.path).toContain('coder-001');
            expect(route.path).toContain('analyzer-001');
        });
        it('should handle multicast to specific agent list', async () => {
            const multicastMessage = {
                jsonrpc: '2.0',
                method: 'coordinate.subtask',
                params: { subtaskId: 'subtask-001' },
                id: 'multicast-001',
                from: 'coordinator-001',
                to: ['researcher-001', 'coder-001'],
                timestamp: Date.now(),
                messageType: 'request'
            };
            const route = await messageRouter.routeMessage(multicastMessage);
            expect(route.path).toContain('researcher-001');
            expect(route.path).toContain('coder-001');
            expect(route.path).not.toContain('analyzer-001'); // Not in target list
        });
        it('should handle partial failures in multicast', async () => {
            // Remove one target agent to simulate failure
            await messageRouter.unregisterAgent('coder-001');
            const multicastMessage = {
                jsonrpc: '2.0',
                method: 'coordinate.subtask',
                params: { subtaskId: 'subtask-002' },
                id: 'multicast-failure-001',
                from: 'coordinator-001',
                to: ['researcher-001', 'coder-001', 'analyzer-001'],
                timestamp: Date.now(),
                messageType: 'request'
            };
            const route = await messageRouter.routeMessage(multicastMessage);
            // Should route to available agents only
            expect(route.path).toContain('researcher-001');
            expect(route.path).toContain('analyzer-001');
            expect(route.path).not.toContain('coder-001');
        });
    });
    describe('Error Handling and Fallbacks', () => {
        it('should handle routing table corruption gracefully', async () => {
            // Simulate corrupted routing table by clearing it
            const routingTable = messageRouter.getRoutingTable();
            routingTable.clear();
            const message = {
                jsonrpc: '2.0',
                method: 'test.method',
                params: {},
                id: 'corruption-001',
                from: 'coordinator-001',
                to: 'researcher-001',
                timestamp: Date.now(),
                messageType: 'request'
            };
            await expect(messageRouter.routeMessage(message))
                .rejects.toMatchObject({
                type: 'routing_error',
                message: 'Routing table is empty or corrupted'
            });
        });
        it('should provide fallback routing when primary strategy fails', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'fallback.test',
                params: {},
                id: 'fallback-001',
                from: 'coordinator-001',
                to: 'researcher-001',
                timestamp: Date.now(),
                messageType: 'request',
                route: {
                    path: [],
                    hops: 0,
                    strategy: 'capability_aware' // This will fail, should fallback to direct
                },
                capabilities: [
                    {
                        name: 'non-existent-capability',
                        version: '1.0.0',
                        description: 'This capability does not exist'
                    }
                ]
            };
            // Should fallback to direct routing when capability routing fails
            const route = await messageRouter.routeMessage(message);
            expect(route.strategy).toBe('direct'); // Fallback strategy
            expect(route.path).toContain('researcher-001');
        });
    });
    describe('Performance Metrics and Monitoring', () => {
        it('should track routing performance metrics', async () => {
            const message = {
                jsonrpc: '2.0',
                method: 'metrics.test',
                params: {},
                id: 'metrics-001',
                from: 'coordinator-001',
                to: 'researcher-001',
                timestamp: Date.now(),
                messageType: 'request'
            };
            await messageRouter.routeMessage(message);
            const metrics = messageRouter.getRoutingMetrics();
            expect(metrics.totalRoutedMessages).toBeGreaterThanOrEqual(1);
            expect(metrics.avgRoutingTime).toBeGreaterThan(0);
            expect(metrics.routingSuccessRate).toBeGreaterThan(0);
        });
        it('should track routing failures', async () => {
            const failingMessage = {
                jsonrpc: '2.0',
                method: 'failing.test',
                params: {},
                id: 'fail-metrics-001',
                from: 'coordinator-001',
                to: 'non-existent-agent',
                timestamp: Date.now(),
                messageType: 'request'
            };
            try {
                await messageRouter.routeMessage(failingMessage);
            }
            catch (error) {
                // Expected to fail
            }
            const metrics = messageRouter.getRoutingMetrics();
            expect(metrics.routingErrorRate).toBeGreaterThan(0);
            expect(metrics.routingFailuresByType).toHaveProperty('agent_unavailable');
        });
        it('should provide detailed routing statistics', () => {
            const metrics = messageRouter.getRoutingMetrics();
            expect(metrics).toHaveProperty('totalRoutedMessages');
            expect(metrics).toHaveProperty('avgRoutingTime');
            expect(metrics).toHaveProperty('routingSuccessRate');
            expect(metrics).toHaveProperty('routingErrorRate');
            expect(metrics).toHaveProperty('strategiesUsed');
            expect(metrics).toHaveProperty('hopDistribution');
            expect(metrics).toHaveProperty('agentLoadDistribution');
        });
    });
});
//# sourceMappingURL=a2a-message-router.test.js.map
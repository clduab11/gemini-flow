/**
 * A2A Protocol Compliance Tests
 * Comprehensive validation of all Agent-to-Agent communication message types
 */
import { A2AComplianceTestSuite, A2ATestDataBuilder, A2ATestUtils, A2AErrorCode } from './test-harness';
describe('A2A Protocol Compliance Tests', () => {
    let testSuite;
    beforeEach(async () => {
        testSuite = new ProtocolComplianceTestSuite();
        await testSuite.setup();
    });
    afterEach(async () => {
        await testSuite.teardown();
    });
    describe('Message Structure Compliance', () => {
        it('should validate required message fields', async () => {
            const message = A2ATestDataBuilder.createMessage();
            const validation = A2ATestUtils.validateMessageCompliance(message);
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        it('should reject messages with missing required fields', async () => {
            const invalidMessage = A2ATestDataBuilder.createMessage({
                id: undefined,
                source: undefined
            });
            const validation = A2ATestUtils.validateMessageCompliance(invalidMessage);
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Missing required field: id');
            expect(validation.errors).toContain('Missing required field: source.agentId');
        });
        it('should validate message expiration (TTL)', async () => {
            const expiredMessage = A2ATestDataBuilder.createMessage({
                timestamp: Date.now() - 60000, // 1 minute ago
                ttl: 30000 // 30 second TTL
            });
            try {
                await testSuite.messageBus.send(expiredMessage);
                fail('Should have thrown error for expired message');
            }
            catch (error) {
                expect(error.message).toContain('Message expired');
            }
        });
        it('should validate correlation ID chain', async () => {
            const originalMessage = A2ATestDataBuilder.createMessage();
            const response = await testSuite.messageBus.send(originalMessage);
            expect(response.correlationId).toBe(originalMessage.id);
            expect(response.messageId).toBe(originalMessage.id);
        });
        it('should validate conversation ID continuity', async () => {
            const conversationId = 'conv-123';
            const message1 = A2ATestDataBuilder.createMessage({ conversationId });
            const message2 = A2ATestDataBuilder.createMessage({ conversationId });
            const response1 = await testSuite.messageBus.send(message1);
            const response2 = await testSuite.messageBus.send(message2);
            // Both responses should reference the same conversation
            expect(response1.correlationId).toContain(conversationId);
            expect(response2.correlationId).toContain(conversationId);
        });
    });
    describe('Direct Coordination Compliance', () => {
        it('should handle direct 1-to-1 communication', async () => {
            const coordination = {
                mode: 'direct',
                timeout: 5000,
                retries: 3,
                acknowledgment: true
            };
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                coordination
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(true);
            expect(response.source.agentId).toBe(testSuite.testAgents[0].id);
            expect(response.metadata.processingTime).toBeGreaterThan(0);
        });
        it('should enforce timeout limits', async () => {
            const coordination = {
                mode: 'direct',
                timeout: 100, // Very short timeout
                retries: 0,
                acknowledgment: true
            };
            // Simulate slow agent
            testSuite.testAgents[0].simulateFailure('timeout', 200);
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                coordination
            });
            const startTime = Date.now();
            const response = await testSuite.messageBus.send(message);
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(150); // Should timeout quickly
            expect(response.success).toBe(false);
            expect(response.error?.code).toBe(A2AErrorCode.TIMEOUT);
        });
        it('should handle retry logic with exponential backoff', async () => {
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                retryPolicy: {
                    maxRetries: 3,
                    backoffStrategy: 'exponential',
                    baseDelay: 100,
                    maxDelay: 1000,
                    retryableErrors: [A2AErrorCode.TIMEOUT]
                }
            });
            // Simulate temporary failure
            testSuite.testAgents[0].simulateFailure('timeout', 300);
            const startTime = Date.now();
            const response = await testSuite.messageBus.send(message);
            const duration = Date.now() - startTime;
            // Should eventually succeed after retries
            expect(response.success).toBe(true);
            expect(duration).toBeGreaterThan(300); // Should wait for failure to clear
        });
        it('should validate acknowledgment requirements', async () => {
            const coordination = {
                mode: 'direct',
                timeout: 5000,
                retries: 1,
                acknowledgment: true
            };
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                coordination
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(true);
            expect(response.correlationId).toBe(message.id);
            expect(response.metadata).toBeDefined();
        });
    });
    describe('Broadcast Coordination Compliance', () => {
        it('should handle 1-to-many broadcast', async () => {
            const coordination = {
                mode: 'broadcast',
                aggregation: 'all',
                timeout: 10000,
                partialSuccess: false
            };
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'broadcast' },
                coordination
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses.length).toBe(testSuite.testAgents.length);
            expect(responses.every(r => r.success)).toBe(true);
        });
        it('should handle partial success scenarios', async () => {
            const coordination = {
                mode: 'broadcast',
                aggregation: 'majority',
                timeout: 5000,
                partialSuccess: true
            };
            // Simulate one agent failure
            testSuite.testAgents[0].simulateFailure('tool', 10000);
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'broadcast' },
                coordination
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses.length).toBe(testSuite.testAgents.length);
            const successCount = responses.filter(r => r.success).length;
            const failureCount = responses.filter(r => !r.success).length;
            expect(successCount).toBeGreaterThan(failureCount);
            expect(successCount).toBeGreaterThanOrEqual(Math.ceil(testSuite.testAgents.length / 2));
        });
        it('should validate aggregation strategies', async () => {
            const testStrategies = [
                'all', 'majority', 'first', 'any'
            ];
            for (const aggregation of testStrategies) {
                const coordination = {
                    mode: 'broadcast',
                    aggregation,
                    timeout: 5000,
                    partialSuccess: aggregation !== 'all'
                };
                const message = A2ATestDataBuilder.createMessage({
                    target: { type: 'broadcast' },
                    coordination
                });
                const responses = await testSuite.messageBus.route(message);
                switch (aggregation) {
                    case 'all':
                        expect(responses.every(r => r.success)).toBe(true);
                        break;
                    case 'majority':
                        expect(responses.filter(r => r.success).length)
                            .toBeGreaterThanOrEqual(Math.ceil(responses.length / 2));
                        break;
                    case 'first':
                    case 'any':
                        expect(responses.some(r => r.success)).toBe(true);
                        break;
                }
            }
        });
        it('should handle broadcast filtering', async () => {
            const coordinatorAgent = A2ATestDataBuilder.createAgent('coordinator-special', 'coordinator', ['coordination', 'management']);
            testSuite.messageBus.registerAgent(coordinatorAgent);
            const message = A2ATestDataBuilder.createMessage({
                target: {
                    type: 'broadcast',
                    filter: { role: 'coordinator' },
                    excludeSource: true
                }
            });
            const responses = await testSuite.messageBus.route(message);
            // Should only target coordinator agents
            expect(responses.length).toBe(1);
            expect(responses[0].source.agentId).toBe('coordinator-special');
        });
    });
    describe('Consensus Coordination Compliance', () => {
        it('should handle unanimous consensus', async () => {
            const coordination = {
                mode: 'consensus',
                consensusType: 'unanimous',
                votingTimeout: 10000,
                minimumParticipants: 3
            };
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'group', role: 'worker' },
                coordination,
                toolName: 'mcp__ruv-swarm__daa_consensus'
            });
            // Add consensus tool to all agents
            testSuite.testAgents.forEach(agent => {
                agent.addTool('mcp__ruv-swarm__daa_consensus', async (params) => ({
                    vote: 'yes',
                    consensus: true,
                    params
                }));
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses.length).toBeGreaterThanOrEqual(3);
            expect(responses.every(r => r.success)).toBe(true);
            expect(responses.every(r => r.result?.vote === 'yes')).toBe(true);
        });
        it('should handle majority consensus', async () => {
            const coordination = {
                mode: 'consensus',
                consensusType: 'majority',
                votingTimeout: 5000,
                minimumParticipants: 3
            };
            // Configure agents for mixed voting
            testSuite.testAgents.forEach((agent, i) => {
                agent.addTool('mcp__ruv-swarm__daa_consensus', async (params) => ({
                    vote: i % 2 === 0 ? 'yes' : 'no',
                    consensus: i % 2 === 0,
                    params
                }));
            });
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'group', role: 'worker' },
                coordination,
                toolName: 'mcp__ruv-swarm__daa_consensus'
            });
            const responses = await testSuite.messageBus.route(message);
            const yesVotes = responses.filter(r => r.success && r.result?.vote === 'yes').length;
            const totalVotes = responses.length;
            expect(yesVotes).toBeGreaterThan(totalVotes / 2);
        });
        it('should handle consensus timeout', async () => {
            const coordination = {
                mode: 'consensus',
                consensusType: 'unanimous',
                votingTimeout: 1000, // Short timeout
                minimumParticipants: 3
            };
            // Simulate slow voting
            testSuite.testAgents.forEach(agent => {
                agent.addTool('mcp__ruv-swarm__daa_consensus', async (params) => {
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Longer than timeout
                    return { vote: 'yes', consensus: true, params };
                });
            });
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'group', role: 'worker' },
                coordination,
                toolName: 'mcp__ruv-swarm__daa_consensus'
            });
            try {
                await testSuite.messageBus.route(message);
                fail('Should have thrown timeout error');
            }
            catch (error) {
                expect(error.message).toContain('Consensus not reached');
            }
        });
        it('should validate minimum participants requirement', async () => {
            const coordination = {
                mode: 'consensus',
                consensusType: 'majority',
                votingTimeout: 5000,
                minimumParticipants: 10 // More than available agents
            };
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'group', role: 'worker' },
                coordination
            });
            try {
                await testSuite.messageBus.route(message);
                fail('Should have failed due to insufficient participants');
            }
            catch (error) {
                expect(error.message).toContain('participants');
            }
        });
    });
    describe('Pipeline Coordination Compliance', () => {
        it('should handle sequential pipeline execution', async () => {
            const coordination = {
                mode: 'pipeline',
                stages: [
                    {
                        agentTarget: { type: 'single', agentId: testSuite.testAgents[0].id },
                        toolName: 'mcp__claude-flow__sparc_mode',
                        inputTransform: (input) => ({ ...input, stage: 1 }),
                        outputTransform: (output) => ({ ...output, processed: true })
                    },
                    {
                        agentTarget: { type: 'single', agentId: testSuite.testAgents[1].id },
                        toolName: 'mcp__claude-flow__sparc_mode',
                        inputTransform: (input) => ({ ...input, stage: 2 })
                    }
                ],
                failureStrategy: 'abort',
                statePassthrough: true
            };
            // Add pipeline tools
            testSuite.testAgents.forEach((agent, i) => {
                agent.addTool('mcp__claude-flow__sparc_mode', async (params) => ({
                    stage: params.stage,
                    agentId: agent.id,
                    processed: params.processed || false,
                    result: `stage-${params.stage}-complete`
                }));
            });
            const message = A2ATestDataBuilder.createMessage({
                coordination,
                parameters: { data: 'pipeline-test' }
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses).toHaveLength(2);
            expect(responses[0].result.stage).toBe(1);
            expect(responses[0].result.processed).toBe(true);
            expect(responses[1].result.stage).toBe(2);
        });
        it('should handle pipeline failure strategies', async () => {
            const strategies = [
                'abort', 'skip', 'retry'
            ];
            for (const strategy of strategies) {
                const coordination = {
                    mode: 'pipeline',
                    stages: [
                        {
                            agentTarget: { type: 'single', agentId: testSuite.testAgents[0].id },
                            toolName: 'mcp__claude-flow__sparc_mode'
                        },
                        {
                            agentTarget: { type: 'single', agentId: testSuite.testAgents[1].id },
                            toolName: 'mcp__claude-flow__sparc_mode'
                        }
                    ],
                    failureStrategy: strategy,
                    statePassthrough: true
                };
                // Configure first agent to fail
                testSuite.testAgents[0].removeTool('mcp__claude-flow__sparc_mode');
                testSuite.testAgents[1].addTool('mcp__claude-flow__sparc_mode', async () => ({
                    success: true
                }));
                const message = A2ATestDataBuilder.createMessage({ coordination });
                const responses = await testSuite.messageBus.route(message);
                switch (strategy) {
                    case 'abort':
                        expect(responses).toHaveLength(1);
                        expect(responses[0].success).toBe(false);
                        break;
                    case 'skip':
                    case 'retry':
                        // Implementation would continue to next stage
                        expect(responses.length).toBeGreaterThanOrEqual(1);
                        break;
                }
                // Reset agent tools
                testSuite.testAgents[0].addTool('mcp__claude-flow__sparc_mode');
            }
        });
        it('should validate state passthrough', async () => {
            const coordination = {
                mode: 'pipeline',
                stages: [
                    {
                        agentTarget: { type: 'single', agentId: testSuite.testAgents[0].id },
                        toolName: 'mcp__claude-flow__memory_usage',
                        outputTransform: (output) => ({ ...output, stateData: 'from-stage-1' })
                    },
                    {
                        agentTarget: { type: 'single', agentId: testSuite.testAgents[1].id },
                        toolName: 'mcp__claude-flow__memory_usage'
                    }
                ],
                failureStrategy: 'abort',
                statePassthrough: true
            };
            testSuite.testAgents.forEach(agent => {
                agent.addTool('mcp__claude-flow__memory_usage', async (params) => ({
                    receivedState: params.stateData || null,
                    agentId: agent.id
                }));
            });
            const message = A2ATestDataBuilder.createMessage({ coordination });
            const responses = await testSuite.messageBus.route(message);
            expect(responses).toHaveLength(2);
            expect(responses[1].result.receivedState).toBe('from-stage-1');
        });
    });
    describe('Target Resolution Compliance', () => {
        it('should resolve single target correctly', async () => {
            const target = {
                type: 'single',
                agentId: testSuite.testAgents[0].id
            };
            const message = A2ATestDataBuilder.createMessage({ target });
            const response = await testSuite.messageBus.send(message);
            expect(response.source.agentId).toBe(testSuite.testAgents[0].id);
        });
        it('should resolve multiple targets correctly', async () => {
            const target = {
                type: 'multiple',
                agentIds: [testSuite.testAgents[0].id, testSuite.testAgents[1].id],
                coordinationMode: 'parallel'
            };
            const message = A2ATestDataBuilder.createMessage({
                target,
                coordination: { mode: 'broadcast', aggregation: 'all', timeout: 5000, partialSuccess: false }
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses).toHaveLength(2);
            expect(responses.map(r => r.source.agentId)).toContain(testSuite.testAgents[0].id);
            expect(responses.map(r => r.source.agentId)).toContain(testSuite.testAgents[1].id);
        });
        it('should resolve group target by role', async () => {
            // Add specialized agents
            const coordinatorAgent = A2ATestDataBuilder.createAgent('coord-1', 'coordinator');
            testSuite.messageBus.registerAgent(coordinatorAgent);
            const target = {
                type: 'group',
                role: 'coordinator',
                maxAgents: 1,
                selectionStrategy: 'random'
            };
            const message = A2ATestDataBuilder.createMessage({
                target,
                coordination: { mode: 'broadcast', aggregation: 'all', timeout: 5000, partialSuccess: false }
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses).toHaveLength(1);
            expect(responses[0].source.agentId).toBe('coord-1');
        });
        it('should resolve broadcast target with filters', async () => {
            const target = {
                type: 'broadcast',
                filter: { role: 'tester' }, // All test agents have 'tester' role
                excludeSource: false
            };
            const message = A2ATestDataBuilder.createMessage({
                target,
                coordination: { mode: 'broadcast', aggregation: 'all', timeout: 5000, partialSuccess: false }
            });
            const responses = await testSuite.messageBus.route(message);
            expect(responses.length).toBeGreaterThan(0);
            expect(responses.every(r => r.source.agentId.includes('test-agent'))).toBe(true);
        });
        it('should resolve conditional target with fallback', async () => {
            const target = {
                type: 'conditional',
                conditions: [{ capability: 'nonexistent' }], // This will fail
                fallback: { type: 'single', agentId: testSuite.testAgents[0].id }
            };
            const message = A2ATestDataBuilder.createMessage({ target });
            const response = await testSuite.messageBus.send(message);
            // Should fall back to first agent
            expect(response.source.agentId).toBe(testSuite.testAgents[0].id);
        });
    });
    describe('Error Handling Compliance', () => {
        it('should handle agent not found errors', async () => {
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: 'nonexistent-agent' }
            });
            try {
                await testSuite.messageBus.send(message);
                fail('Should have thrown agent not found error');
            }
            catch (error) {
                expect(error.message).toContain('not found');
            }
        });
        it('should handle tool not supported errors', async () => {
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                toolName: 'nonexistent-tool'
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(false);
            expect(response.error?.code).toBe(A2AErrorCode.TOOL_NOT_SUPPORTED);
        });
        it('should handle resource exhaustion errors', async () => {
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                resourceRequirements: [
                    { type: 'cpu', amount: 1000, unit: 'cores', priority: 'high', duration: 5000 }
                ]
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(false);
            expect(response.error?.code).toBe(A2AErrorCode.INSUFFICIENT_RESOURCES);
        });
        it('should handle timeout errors with proper error codes', async () => {
            testSuite.testAgents[0].simulateFailure('timeout', 10000);
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                execution: { timeout: 1000, priority: 'high', retries: 0, isolation: false }
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(false);
            expect(response.error?.code).toBe(A2AErrorCode.TIMEOUT);
            expect(response.error?.recoverable).toBe(true);
        });
    });
    describe('State Synchronization Compliance', () => {
        it('should handle state requirements correctly', async () => {
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                stateRequirements: [
                    {
                        type: 'write',
                        namespace: 'test-state',
                        keys: ['key1', 'key2'],
                        consistency: 'strong',
                        timeout: 5000
                    }
                ]
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(true);
            // Agent should have handled state requirements
        });
        it('should detect state conflicts', async () => {
            testSuite.testAgents[0].simulateFailure('state', 5000);
            const message = A2ATestDataBuilder.createMessage({
                target: { type: 'single', agentId: testSuite.testAgents[0].id },
                stateRequirements: [
                    {
                        type: 'exclusive',
                        namespace: 'conflicted-state',
                        keys: ['conflict'],
                        consistency: 'strong',
                        timeout: 1000
                    }
                ]
            });
            const response = await testSuite.messageBus.send(message);
            expect(response.success).toBe(false);
            expect(response.error?.code).toBe(A2AErrorCode.STATE_CONFLICT);
        });
    });
    describe('Performance and Metrics Compliance', () => {
        it('should track message processing metrics', async () => {
            const message = A2ATestDataBuilder.createMessage();
            await testSuite.messageBus.send(message);
            const metrics = testSuite.messageBus.getMetrics();
            expect(metrics.totalMessages).toBe(1);
            expect(metrics.successfulMessages).toBe(1);
            expect(metrics.averageLatency).toBeGreaterThan(0);
        });
        it('should provide response metadata', async () => {
            const message = A2ATestDataBuilder.createMessage();
            const response = await testSuite.messageBus.send(message);
            expect(response.metadata).toBeDefined();
            expect(response.metadata.processingTime).toBeGreaterThan(0);
            expect(response.metadata.resourceUsage).toBeDefined();
            expect(response.metadata.hops).toBeGreaterThanOrEqual(0);
        });
        it('should handle high-frequency message processing', async () => {
            const messageCount = 100;
            const startTime = Date.now();
            const responses = await A2ATestUtils.generateLoad(testSuite.messageBus, messageCount, 10);
            const duration = Date.now() - startTime;
            const throughput = messageCount / (duration / 1000);
            expect(responses).toHaveLength(messageCount);
            expect(throughput).toBeGreaterThan(10); // Messages per second
        });
    });
});
/**
 * Protocol Compliance Test Suite Implementation
 */
class ProtocolComplianceTestSuite extends A2AComplianceTestSuite {
    async runTests() {
        // This method can be used for programmatic test execution
        console.log('Running A2A Protocol Compliance Tests...');
    }
}
//# sourceMappingURL=protocol-compliance.test.js.map
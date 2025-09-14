/**
 * Memory Coordination Integration Tests
 * Target: >95% memory coordination accuracy
 */
const { initializeSwarm } = require('../../src/core/swarm');
const { delay, generateRandomData } = require('../utils/test-helpers');
describe('Memory Coordination', () => {
    let swarm;
    beforeEach(async () => {
        swarm = await initializeSwarm({
            topology: 'mesh',
            maxAgents: 6,
            memorySync: true
        });
    });
    afterEach(async () => {
        if (swarm) {
            await swarm.destroy();
        }
    });
    describe('Cross-Agent Memory Synchronization', () => {
        it('should synchronize memory across all agents', async () => {
            const agents = swarm.getActiveAgents();
            expect(agents.length).toBeGreaterThan(3);
            const testData = {
                key: 'sync_test',
                value: 'coordination_test_data',
                timestamp: Date.now(),
                metadata: { source: 'agent_0', version: 1 }
            };
            // Agent 0 stores data
            await agents[0].storeMemory('test_key', testData);
            // Wait for synchronization
            await delay(200);
            // All other agents should have access
            const retrievalPromises = agents.slice(1).map(async (agent, index) => {
                const retrieved = await agent.retrieveMemory('test_key');
                return { agentIndex: index + 1, data: retrieved };
            });
            const results = await Promise.all(retrievalPromises);
            for (const result of results) {
                expect(result.data).toEqual(testData);
                expect(result.data.metadata.source).toBe('agent_0');
            }
        });
        it('should handle concurrent memory updates from multiple agents', async () => {
            const agents = swarm.getActiveAgents();
            const testKey = 'concurrent_test';
            // Multiple agents update the same key concurrently
            const updatePromises = agents.map(async (agent, index) => {
                const data = {
                    agentId: agent.id,
                    agentIndex: index,
                    timestamp: Date.now(),
                    data: `update_from_agent_${index}`
                };
                try {
                    await agent.storeMemory(testKey, data);
                    return { success: true, agentIndex: index };
                }
                catch (error) {
                    return { success: false, agentIndex: index, error: error.message };
                }
            });
            const results = await Promise.all(updatePromises);
            // All updates should succeed (conflict resolution should handle concurrency)
            expect(results.every(r => r.success)).toBe(true);
            // Wait for final synchronization
            await delay(300);
            // All agents should converge to the same final state
            const finalStates = await Promise.all(agents.map(agent => agent.retrieveMemory(testKey)));
            // All states should be identical (CRDT resolution)
            const uniqueStates = new Set(finalStates.map(state => JSON.stringify(state)));
            expect(uniqueStates.size).toBe(1);
        });
        it('should maintain memory consistency during agent failures', async () => {
            const agents = swarm.getActiveAgents();
            const testData = {
                critical: true,
                data: 'failure_test_data',
                redundancy: 3
            };
            // Store critical data
            await agents[0].storeMemory('critical_data', testData);
            await delay(200);
            // Simulate agent failure
            await agents[1].simulateFailure();
            // Wait for system to detect failure and rebalance
            await delay(500);
            // Remaining agents should still have the data
            const remainingAgents = agents.filter(agent => !agent.isFailed());
            expect(remainingAgents.length).toBeGreaterThan(2);
            for (const agent of remainingAgents) {
                const retrieved = await agent.retrieveMemory('critical_data');
                expect(retrieved).toEqual(testData);
            }
        });
    });
    describe('Memory Conflict Resolution', () => {
        it('should resolve conflicts using CRDT (Conflict-free Replicated Data Types)', async () => {
            const agents = swarm.getActiveAgents();
            // Simulate network partition - agents update independently
            await swarm.simulateNetworkPartition([
                agents.slice(0, 2), // Partition 1
                agents.slice(2, 4) // Partition 2
            ]);
            const conflictKey = 'crdt_conflict_test';
            // Partition 1 updates
            await agents[0].storeMemory(conflictKey, {
                type: 'counter',
                value: 5,
                vector_clock: { agent_0: 1, agent_1: 0 }
            });
            // Partition 2 updates (conflict)
            await agents[2].storeMemory(conflictKey, {
                type: 'counter',
                value: 3,
                vector_clock: { agent_2: 1, agent_3: 0 }
            });
            // Heal partition
            await swarm.healNetworkPartition();
            await delay(500);
            // All agents should converge to resolved state
            const resolvedStates = await Promise.all(agents.map(agent => agent.retrieveMemory(conflictKey)));
            // CRDT should resolve to merged state (counter should be sum: 5 + 3 = 8)
            expect(resolvedStates.every(state => state.value === 8)).toBe(true);
            expect(new Set(resolvedStates.map(s => JSON.stringify(s))).size).toBe(1);
        });
        it('should handle large memory conflicts efficiently', async () => {
            const agents = swarm.getActiveAgents();
            const conflictCount = 50;
            // Create many simultaneous conflicts
            const conflictPromises = [];
            for (let i = 0; i < conflictCount; i++) {
                const agentIndex = i % agents.length;
                const agent = agents[agentIndex];
                conflictPromises.push(agent.storeMemory(`conflict_${i}`, {
                    id: i,
                    agent: agentIndex,
                    timestamp: Date.now() + Math.random() * 100,
                    data: generateRandomData(100)
                }));
            }
            const start = performance.now();
            await Promise.all(conflictPromises);
            // Wait for resolution
            await delay(1000);
            const resolutionTime = performance.now() - start;
            // Should resolve all conflicts within reasonable time
            expect(resolutionTime).toBeLessThan(5000); // Under 5 seconds
            // Verify all data is consistent across agents
            for (let i = 0; i < conflictCount; i++) {
                const states = await Promise.all(agents.map(agent => agent.retrieveMemory(`conflict_${i}`)));
                // All agents should have the same state for each key
                expect(new Set(states.map(s => JSON.stringify(s))).size).toBe(1);
            }
        });
    });
    describe('Memory Performance and Scalability', () => {
        it('should maintain memory operations under 50ms', async () => {
            const agent = swarm.getActiveAgents()[0];
            const testData = { benchmark: true, size: 'medium' };
            // Store operation
            const storeStart = performance.now();
            await agent.storeMemory('benchmark_store', testData);
            const storeTime = performance.now() - storeStart;
            // Retrieve operation  
            const retrieveStart = performance.now();
            await agent.retrieveMemory('benchmark_store');
            const retrieveTime = performance.now() - retrieveStart;
            expect(storeTime).toBeLessThan(50);
            expect(retrieveTime).toBeLessThan(50);
        });
        it('should scale memory operations with data size', async () => {
            const agent = swarm.getActiveAgents()[0];
            const sizes = [1, 10, 100, 1000]; // KB
            for (const sizeKB of sizes) {
                const data = {
                    size: sizeKB,
                    payload: 'x'.repeat(sizeKB * 1024)
                };
                const start = performance.now();
                await agent.storeMemory(`size_test_${sizeKB}kb`, data);
                const retrieved = await agent.retrieveMemory(`size_test_${sizeKB}kb`);
                const duration = performance.now() - start;
                expect(retrieved.payload.length).toBe(sizeKB * 1024);
                // Should scale linearly (within 10ms per KB + 50ms base)
                const expectedMaxTime = 50 + (sizeKB * 10);
                expect(duration).toBeLessThan(expectedMaxTime);
                console.log(`${sizeKB}KB: ${duration.toFixed(1)}ms`);
            }
        });
        it('should handle high-frequency memory operations', async () => {
            const agent = swarm.getActiveAgents()[0];
            const operationCount = 1000;
            const operations = [];
            // Mix of store and retrieve operations
            for (let i = 0; i < operationCount; i++) {
                if (i % 2 === 0) {
                    operations.push(agent.storeMemory(`freq_test_${i}`, {
                        index: i,
                        timestamp: Date.now()
                    }));
                }
                else {
                    operations.push(agent.retrieveMemory(`freq_test_${i - 1}`));
                }
            }
            const start = performance.now();
            const results = await Promise.allSettled(operations);
            const duration = performance.now() - start;
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const successRate = successCount / results.length;
            expect(successRate).toBeGreaterThan(0.95); // 95% success rate
            expect(duration).toBeLessThan(10000); // Under 10 seconds for 1000 ops
            console.log(`High-frequency ops: ${successRate * 100}% success, ${duration}ms total`);
        });
    });
    describe('Memory Coordination Accuracy', () => {
        it('should achieve >95% coordination accuracy under stress', async () => {
            const agents = swarm.getActiveAgents();
            const testOperations = 200;
            const operations = [];
            // Create mixed workload of coordination operations
            for (let i = 0; i < testOperations; i++) {
                const agentIndex = i % agents.length;
                const agent = agents[agentIndex];
                const key = `accuracy_test_${Math.floor(i / agents.length)}`;
                operations.push({
                    agent,
                    operation: i % 3 === 0 ? 'store' : 'retrieve',
                    key,
                    data: { value: i, agent: agentIndex, timestamp: Date.now() }
                });
            }
            // Execute operations with some concurrent conflicts
            const results = await Promise.allSettled(operations.map(async (op) => {
                if (op.operation === 'store') {
                    return await op.agent.storeMemory(op.key, op.data);
                }
                else {
                    return await op.agent.retrieveMemory(op.key);
                }
            }));
            // Wait for full synchronization
            await delay(1000);
            // Verify final consistency across all agents
            const keys = [...new Set(operations.map(op => op.key))];
            let consistentKeys = 0;
            for (const key of keys) {
                const states = await Promise.all(agents.map(agent => agent.retrieveMemory(key)));
                // Remove null/undefined states (keys that were never stored)
                const validStates = states.filter(state => state !== null && state !== undefined);
                if (validStates.length > 0) {
                    const uniqueStates = new Set(validStates.map(s => JSON.stringify(s)));
                    if (uniqueStates.size === 1) {
                        consistentKeys++;
                    }
                }
                else {
                    // All agents agree key doesn't exist - also consistent
                    consistentKeys++;
                }
            }
            const accuracyRate = consistentKeys / keys.length;
            expect(accuracyRate).toBeGreaterThan(0.95);
            console.log(`Memory coordination accuracy: ${(accuracyRate * 100).toFixed(1)}%`);
        });
    });
});
export {};
//# sourceMappingURL=memory-coordination.test.js.map
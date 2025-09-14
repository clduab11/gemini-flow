/**
 * Agent Spawn Performance Tests
 * Target: <100ms agent spawn time (99th percentile)
 */
const { performance } = require('perf_hooks');
const { spawnAgent, initializeSwarm } = require('../../src/core/swarm');
describe('Agent Spawn Performance', () => {
    let swarm;
    beforeEach(async () => {
        swarm = await initializeSwarm({
            topology: 'mesh',
            maxAgents: 10,
            testMode: true
        });
    });
    afterEach(async () => {
        if (swarm) {
            await swarm.destroy();
        }
    });
    describe('Single Agent Spawn Time', () => {
        it('should spawn researcher agent under 100ms', async () => {
            const start = performance.now();
            const agent = await spawnAgent('researcher', {
                name: 'Test Researcher',
                capabilities: ['research', 'analysis']
            });
            const duration = performance.now() - start;
            expect(agent.id).toBeDefined();
            expect(agent.type).toBe('researcher');
            expect(duration).toBeLessThan(100);
            // Cleanup
            await agent.destroy();
        });
        it('should spawn coder agent under 100ms', async () => {
            const start = performance.now();
            const agent = await spawnAgent('coder', {
                name: 'Test Coder',
                capabilities: ['javascript', 'typescript', 'testing']
            });
            const duration = performance.now() - start;
            expect(agent.id).toBeDefined();
            expect(agent.type).toBe('coder');
            expect(duration).toBeLessThan(100);
            await agent.destroy();
        });
        it('should spawn task-orchestrator under 100ms', async () => {
            const start = performance.now();
            const agent = await spawnAgent('task-orchestrator', {
                name: 'Test Orchestrator',
                capabilities: ['coordination', 'workflow']
            });
            const duration = performance.now() - start;
            expect(agent.id).toBeDefined();
            expect(agent.type).toBe('task-orchestrator');
            expect(duration).toBeLessThan(100);
            await agent.destroy();
        });
    });
    describe('Concurrent Agent Spawn Performance', () => {
        it('should spawn 5 agents concurrently under 300ms total', async () => {
            const agentTypes = ['researcher', 'coder', 'tester', 'reviewer', 'planner'];
            const start = performance.now();
            const agents = await Promise.all(agentTypes.map(type => spawnAgent(type, { name: `Test ${type}` })));
            const duration = performance.now() - start;
            expect(agents).toHaveLength(5);
            expect(agents.every(agent => agent.id && agent.type)).toBe(true);
            expect(duration).toBeLessThan(300);
            // Cleanup
            await Promise.all(agents.map(agent => agent.destroy()));
        });
        it('should spawn 8 agents concurrently under 500ms total', async () => {
            const agentTypes = [
                'researcher', 'coder', 'tester', 'reviewer',
                'planner', 'architect', 'optimizer', 'coordinator'
            ];
            const start = performance.now();
            const agents = await Promise.all(agentTypes.map(type => spawnAgent(type, { name: `Test ${type}` })));
            const duration = performance.now() - start;
            expect(agents).toHaveLength(8);
            expect(agents.every(agent => agent.id && agent.type)).toBe(true);
            expect(duration).toBeLessThan(500);
            await Promise.all(agents.map(agent => agent.destroy()));
        });
        it('should maintain spawn performance under memory pressure', async () => {
            // Create memory pressure
            const memoryHogs = Array(5).fill(null).map(() => new Array(100000).fill('memory_pressure_test_data'));
            const start = performance.now();
            const agent = await spawnAgent('researcher', { name: 'Memory Test' });
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(150); // Slightly higher threshold under pressure
            // Cleanup
            memoryHogs.length = 0;
            await agent.destroy();
        });
    });
    describe('Agent Spawn Reliability', () => {
        it('should have 99% success rate over 100 spawn attempts', async () => {
            const results = [];
            for (let i = 0; i < 100; i++) {
                try {
                    const start = performance.now();
                    const agent = await spawnAgent('tester', {
                        name: `Reliability Test ${i}`,
                        timeout: 200 // 200ms timeout
                    });
                    const duration = performance.now() - start;
                    results.push({
                        success: true,
                        duration,
                        agentId: agent.id
                    });
                    await agent.destroy();
                }
                catch (error) {
                    results.push({
                        success: false,
                        error: error.message
                    });
                }
            }
            const successRate = results.filter(r => r.success).length / results.length;
            const averageDuration = results
                .filter(r => r.success)
                .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
            expect(successRate).toBeGreaterThan(0.99); // 99% success rate
            expect(averageDuration).toBeLessThan(100); // Average under 100ms
        });
        it('should handle rapid sequential spawning', async () => {
            const spawnPromises = [];
            // Spawn 20 agents in rapid succession
            for (let i = 0; i < 20; i++) {
                spawnPromises.push(spawnAgent('researcher', { name: `Rapid ${i}` })
                    .then(agent => ({ success: true, agent }))
                    .catch(error => ({ success: false, error })));
            }
            const results = await Promise.all(spawnPromises);
            const successCount = results.filter(r => r.success).length;
            expect(successCount).toBeGreaterThan(18); // 90% success rate minimum
            // Cleanup successful agents
            const cleanupPromises = results
                .filter(r => r.success)
                .map(r => r.agent.destroy());
            await Promise.allSettled(cleanupPromises);
        });
    });
    describe('Resource Usage During Spawn', () => {
        it('should not exceed memory limits during agent creation', async () => {
            const initialMemory = process.memoryUsage();
            const agent = await spawnAgent('code-analyzer', {
                name: 'Memory Test Agent',
                capabilities: ['analysis', 'optimization']
            });
            const postSpawnMemory = process.memoryUsage();
            const memoryIncrease = postSpawnMemory.heapUsed - initialMemory.heapUsed;
            // Should not increase heap by more than 50MB per agent
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
            await agent.destroy();
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            // Memory should be released after destroy
            await new Promise(resolve => setTimeout(resolve, 100));
            const finalMemory = process.memoryUsage();
            const finalIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            expect(finalIncrease).toBeLessThan(memoryIncrease * 0.5); // At least 50% cleanup
        });
    });
});
export {};
//# sourceMappingURL=agent-spawn.test.js.map
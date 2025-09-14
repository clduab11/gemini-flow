/**
 * Test Utilities and Helpers for Gemini-Flow QA Framework
 */
const { performance } = require('perf_hooks');
/**
 * Generate test tasks of various complexities and types
 */
function generateTestTasks(count, complexity = 'medium') {
    const tasks = [];
    for (let i = 0; i < count; i++) {
        const task = {
            id: `task_${i}`,
            type: getTaskType(complexity),
            complexity,
            estimatedDuration: getEstimatedDuration(complexity),
            dependencies: getDependencies(i, count),
            payload: generateTaskPayload(complexity)
        };
        tasks.push(task);
    }
    return tasks;
}
function getTaskType(complexity) {
    const types = {
        light: ['simple_computation', 'data_validation', 'string_processing'],
        medium: ['file_processing', 'api_call', 'data_transformation', 'analysis'],
        heavy: ['complex_analysis', 'ml_processing', 'large_data_processing'],
        cpu_bound: ['mathematical_computation', 'encryption', 'sorting', 'compression'],
        io_bound: ['file_io', 'network_request', 'database_query'],
        memory_bound: ['large_array_processing', 'graph_traversal', 'caching'],
        very_heavy: ['video_processing', 'large_ml_model', 'massive_data_analysis'],
        uniform: ['standard_task'],
        scalable: ['parallel_computation'],
        consistent: ['predictable_task'],
        fault_tolerant: ['resilient_task'],
        memory_aware: ['memory_efficient_task']
    };
    const taskTypes = types[complexity] || types.medium;
    return taskTypes[Math.floor(Math.random() * taskTypes.length)];
}
function getEstimatedDuration(complexity) {
    const durations = {
        light: 50 + Math.random() * 100, // 50-150ms
        medium: 200 + Math.random() * 300, // 200-500ms  
        heavy: 1000 + Math.random() * 2000, // 1-3s
        cpu_bound: 500 + Math.random() * 1000, // 500ms-1.5s
        io_bound: 100 + Math.random() * 400, // 100-500ms
        memory_bound: 300 + Math.random() * 700, // 300ms-1s
        very_heavy: 5000 + Math.random() * 5000, // 5-10s
        uniform: 1000, // Exactly 1s
        scalable: 500 + Math.random() * 500, // 500ms-1s
        consistent: 800, // Exactly 800ms
        fault_tolerant: 300 + Math.random() * 200, // 300-500ms
        memory_aware: 400 + Math.random() * 300 // 400-700ms
    };
    return durations[complexity] || durations.medium;
}
function getDependencies(index, totalCount) {
    // Create some task dependencies for testing coordination
    if (index === 0)
        return [];
    if (index < 3)
        return [0];
    if (index < totalCount / 2)
        return [Math.floor(Math.random() * index)];
    return [index - 1, index - 2].filter(dep => dep >= 0);
}
function generateTaskPayload(complexity) {
    const sizes = {
        light: 100,
        medium: 1000,
        heavy: 10000,
        cpu_bound: 5000,
        io_bound: 500,
        memory_bound: 20000,
        very_heavy: 50000,
        uniform: 1000,
        scalable: 2000,
        consistent: 1000,
        fault_tolerant: 1500,
        memory_aware: 3000
    };
    const size = sizes[complexity] || sizes.medium;
    return {
        data: 'x'.repeat(size),
        metadata: {
            generated: Date.now(),
            complexity,
            size
        }
    };
}
/**
 * Measure execution time of async functions
 */
async function measureExecutionTime(asyncFn) {
    const start = performance.now();
    await asyncFn();
    return performance.now() - start;
}
/**
 * Generate random test data
 */
function generateRandomData(sizeBytes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < sizeBytes; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Create delay for testing timing and coordination
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Performance monitoring utilities
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            startTime: null,
            operations: [],
            memoryUsage: [],
            errors: []
        };
    }
    start() {
        this.metrics.startTime = performance.now();
        this.recordMemoryUsage();
    }
    recordOperation(name, duration, success = true, metadata = {}) {
        this.metrics.operations.push({
            name,
            duration,
            success,
            timestamp: performance.now(),
            metadata
        });
    }
    recordMemoryUsage() {
        const usage = process.memoryUsage();
        this.metrics.memoryUsage.push({
            timestamp: performance.now(),
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss
        });
    }
    recordError(error, context = {}) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: performance.now(),
            context
        });
    }
    getReport() {
        const totalDuration = performance.now() - this.metrics.startTime;
        const successfulOps = this.metrics.operations.filter(op => op.success);
        const failedOps = this.metrics.operations.filter(op => !op.success);
        const memoryStats = this.calculateMemoryStats();
        return {
            summary: {
                totalDuration,
                totalOperations: this.metrics.operations.length,
                successfulOperations: successfulOps.length,
                failedOperations: failedOps.length,
                successRate: successfulOps.length / this.metrics.operations.length,
                averageOperationTime: successfulOps.reduce((sum, op) => sum + op.duration, 0) / successfulOps.length,
                errorsCount: this.metrics.errors.length
            },
            performance: {
                operationsPerSecond: this.metrics.operations.length / (totalDuration / 1000),
                p50: calculatePercentile(successfulOps.map(op => op.duration), 50),
                p95: calculatePercentile(successfulOps.map(op => op.duration), 95),
                p99: calculatePercentile(successfulOps.map(op => op.duration), 99)
            },
            memory: memoryStats,
            errors: this.metrics.errors
        };
    }
    calculateMemoryStats() {
        if (this.metrics.memoryUsage.length === 0)
            return null;
        const heapUsages = this.metrics.memoryUsage.map(m => m.heapUsed);
        const initial = heapUsages[0];
        const peak = Math.max(...heapUsages);
        const final = heapUsages[heapUsages.length - 1];
        return {
            initialHeap: initial,
            peakHeap: peak,
            finalHeap: final,
            heapGrowth: final - initial,
            peakGrowth: peak - initial
        };
    }
}
function calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
}
/**
 * Test data generators for specific scenarios
 */
const TestDataGenerators = {
    /**
     * Generate workload for load testing
     */
    generateLoadTestData(userCount, operationsPerUser) {
        const users = [];
        for (let i = 0; i < userCount; i++) {
            const operations = [];
            for (let j = 0; j < operationsPerUser; j++) {
                operations.push({
                    type: this.getRandomOperationType(),
                    timestamp: Date.now() + (j * Math.random() * 1000),
                    data: generateRandomData(Math.floor(Math.random() * 1000) + 100)
                });
            }
            users.push({ id: i, operations });
        }
        return users;
    },
    getRandomOperationType() {
        const types = ['spawn_agent', 'execute_task', 'store_memory', 'retrieve_memory', 'coordinate'];
        return types[Math.floor(Math.random() * types.length)];
    },
    /**
     * Generate test cases for edge conditions
     */
    generateEdgeCases() {
        return [
            { name: 'empty_input', data: '' },
            { name: 'null_input', data: null },
            { name: 'undefined_input', data: undefined },
            { name: 'very_large_input', data: 'x'.repeat(1000000) },
            { name: 'special_characters', data: '!@#$%^&*()[]{}|;:,.<>?' },
            { name: 'unicode_input', data: '🚀🧠🎯📊💾🔄🌐🛡️' },
            { name: 'numeric_edge', data: [0, -1, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, NaN, Infinity] },
            { name: 'nested_objects', data: { a: { b: { c: { d: 'deep' } } } } },
            { name: 'circular_reference', data: (() => { const obj = {}; obj.self = obj; return obj; })() }
        ];
    },
    /**
     * Generate performance baseline data
     */
    generateBaselineData() {
        return {
            singleAgentSpawn: { target: 100, baseline: 150 }, // ms
            multiAgentSpawn: { target: 500, baseline: 800 }, // ms for 8 agents
            taskExecution: { target: 200, baseline: 400 }, // ms average
            memoryOperation: { target: 50, baseline: 100 }, // ms
            coordination: { target: 100, baseline: 200 } // ms
        };
    }
};
/**
 * Mock services for testing
 */
class MockServices {
    static createMockSwarm(config = {}) {
        return {
            id: 'mock_swarm_' + Date.now(),
            topology: config.topology || 'mesh',
            maxAgents: config.maxAgents || 5,
            agents: [],
            async destroy() {
                this.agents = [];
            },
            getActiveAgents() {
                return this.agents;
            },
            async simulateNetworkPartition(partitions) {
                // Mock implementation
                console.log('Simulating network partition:', partitions.length, 'partitions');
            },
            async healNetworkPartition() {
                // Mock implementation  
                console.log('Healing network partition');
            }
        };
    }
    static createMockAgent(type, config = {}) {
        return {
            id: 'mock_agent_' + Date.now(),
            type,
            config,
            failed: false,
            async storeMemory(key, data) {
                // Mock implementation with simulated delay
                await delay(Math.random() * 20 + 10);
                return { success: true, key, stored: Date.now() };
            },
            async retrieveMemory(key) {
                // Mock implementation with simulated delay
                await delay(Math.random() * 15 + 5);
                return { retrieved: true, key, timestamp: Date.now() };
            },
            async destroy() {
                this.failed = true;
            },
            async simulateFailure() {
                this.failed = true;
                throw new Error('Simulated agent failure');
            },
            isFailed() {
                return this.failed;
            }
        };
    }
}
module.exports = {
    generateTestTasks,
    measureExecutionTime,
    generateRandomData,
    delay,
    PerformanceMonitor,
    TestDataGenerators,
    MockServices,
    calculatePercentile
};
export {};
//# sourceMappingURL=test-helpers.js.map
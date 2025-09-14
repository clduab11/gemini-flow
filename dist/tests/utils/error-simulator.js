/**
 * Error Simulator Utility
 * Simulates various error conditions for testing resilience
 */
class ErrorSimulator {
    constructor() {
        this.simulationActive = false;
        this.simulationCount = 0;
    }
    async simulateRateLimit(operation, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const baseDelay = options.baseDelay || 1000;
        let attempts = 0;
        let rateLimitDetected = false;
        let backoffApplied = false;
        let totalRetries = 0;
        while (attempts < maxRetries) {
            try {
                if (attempts === 0) {
                    // Simulate rate limit on first attempt
                    rateLimitDetected = true;
                    throw new Error('Rate limit exceeded');
                }
                // Apply exponential backoff
                if (attempts > 0) {
                    backoffApplied = true;
                    const delay = baseDelay * Math.pow(2, attempts - 1);
                    await this.delay(delay);
                    totalRetries++;
                }
                const result = await operation();
                return {
                    rateLimitDetected,
                    backoffApplied,
                    eventualSuccess: true,
                    totalRetries,
                    attempts
                };
            }
            catch (error) {
                attempts++;
                if (attempts >= maxRetries) {
                    return {
                        rateLimitDetected,
                        backoffApplied,
                        eventualSuccess: false,
                        totalRetries,
                        attempts,
                        finalError: error.message
                    };
                }
            }
        }
    }
    async simulateTimeout(operation, options = {}) {
        const timeoutMs = options.timeoutMs || 5000;
        const maxRetries = options.maxRetries || 3;
        let attempts = 0;
        let timeoutDetected = false;
        while (attempts < maxRetries) {
            try {
                if (attempts === 0) {
                    // Simulate timeout on first attempt
                    timeoutDetected = true;
                    await this.delay(timeoutMs + 1000);
                    throw new Error('Request timeout');
                }
                const result = await Promise.race([
                    operation(),
                    this.timeoutPromise(timeoutMs)
                ]);
                return {
                    timeoutDetected,
                    retriesAttempted: attempts,
                    finalOutcome: 'success',
                    result
                };
            }
            catch (error) {
                attempts++;
                if (attempts >= maxRetries) {
                    return {
                        timeoutDetected,
                        retriesAttempted: attempts,
                        finalOutcome: 'failure',
                        finalError: error.message
                    };
                }
            }
        }
    }
    async simulateAuthFailure(operation) {
        let authFailureDetected = false;
        let reauthenticationAttempted = false;
        try {
            // Simulate auth failure on first attempt
            authFailureDetected = true;
            throw new Error('Authentication failed');
        }
        catch (error) {
            // Simulate reauthentication
            reauthenticationAttempted = true;
            await this.delay(1000); // Simulate auth delay
            try {
                const result = await operation();
                return {
                    authFailureDetected,
                    reauthenticationAttempted,
                    finalSuccess: true,
                    result
                };
            }
            catch (retryError) {
                return {
                    authFailureDetected,
                    reauthenticationAttempted,
                    finalSuccess: false,
                    finalError: retryError.message
                };
            }
        }
    }
    async simulateNetworkPartition(duration = 30000) {
        console.log(`Simulating network partition for ${duration}ms`);
        this.simulationActive = true;
        this.simulationCount++;
        setTimeout(() => {
            this.simulationActive = false;
            console.log('Network partition simulation ended');
        }, duration);
        return {
            partitionActive: true,
            duration,
            simulationId: this.simulationCount
        };
    }
    async simulateHighLatency(baseLatency = 5000) {
        const latency = baseLatency + Math.random() * 2000; // Add random variance
        await this.delay(latency);
        return {
            latencySimulated: true,
            actualLatency: latency,
            baseLatency
        };
    }
    async simulateMemoryPressure(pressureLevel = 0.8) {
        const beforeMemory = process.memoryUsage();
        // Simulate memory allocation
        const arrays = [];
        const targetSize = Math.floor(pressureLevel * 100 * 1024 * 1024); // MB
        try {
            while (arrays.length * 1024 * 1024 < targetSize) {
                arrays.push(new Array(1024 * 256).fill('x')); // 1MB chunks
            }
            await this.delay(5000); // Hold memory for 5 seconds
            const duringMemory = process.memoryUsage();
            // Release memory
            arrays.length = 0;
            global.gc?.(); // Force garbage collection if available
            const afterMemory = process.memoryUsage();
            return {
                memoryPressureSimulated: true,
                pressureLevel,
                memoryStats: {
                    before: beforeMemory,
                    during: duringMemory,
                    after: afterMemory
                },
                pressureCreated: duringMemory.heapUsed > beforeMemory.heapUsed * (1 + pressureLevel)
            };
        }
        catch (error) {
            return {
                memoryPressureSimulated: false,
                error: error.message,
                memoryStats: {
                    before: beforeMemory,
                    error: process.memoryUsage()
                }
            };
        }
    }
    async simulateCpuSpike(duration = 10000, intensity = 0.9) {
        const startTime = Date.now();
        const endTime = startTime + duration;
        console.log(`Simulating CPU spike for ${duration}ms at ${intensity * 100}% intensity`);
        // Create CPU-intensive workload
        const workers = [];
        const workerCount = Math.max(1, Math.floor(intensity * require('os').cpus().length));
        for (let i = 0; i < workerCount; i++) {
            workers.push(this.cpuIntensiveTask(endTime));
        }
        await Promise.all(workers);
        const actualDuration = Date.now() - startTime;
        return {
            cpuSpikeSimulated: true,
            requestedDuration: duration,
            actualDuration,
            intensity,
            workerCount
        };
    }
    // Helper methods
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async timeoutPromise(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), ms);
        });
    }
    async cpuIntensiveTask(endTime) {
        return new Promise((resolve) => {
            const work = () => {
                const now = Date.now();
                if (now >= endTime) {
                    resolve();
                    return;
                }
                // CPU-intensive computation
                let result = 0;
                for (let i = 0; i < 1000000; i++) {
                    result += Math.random() * Math.sin(i) * Math.cos(i);
                }
                // Use setImmediate to prevent blocking
                setImmediate(work);
            };
            work();
        });
    }
    isSimulationActive() {
        return this.simulationActive;
    }
    getSimulationCount() {
        return this.simulationCount;
    }
    reset() {
        this.simulationActive = false;
        this.simulationCount = 0;
    }
}
module.exports = { ErrorSimulator };
export {};
//# sourceMappingURL=error-simulator.js.map
/**
 * Test Utilities and Factories for Google Services TDD Test Suites
 *
 * Comprehensive testing utilities following London School TDD practices
 * with mock factories, test data generators, and custom matchers.
 */
import { jest } from "@jest/globals";
import { EventEmitter } from "events";
// ==================== Mock Factories ====================
export class MockFactory {
    /**
     * Creates a mock service response with consistent structure
     */
    static createServiceResponse(success = true, data, error) {
        return {
            success,
            data,
            error,
            metadata: this.createResponseMetadata(),
        };
    }
    /**
     * Creates mock response metadata
     */
    static createResponseMetadata() {
        return {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            processingTime: Math.floor(Math.random() * 1000),
            region: "test-region",
            quotaUsed: Math.floor(Math.random() * 100),
            rateLimitRemaining: Math.floor(Math.random() * 1000),
        };
    }
    /**
     * Creates a mock service error
     */
    static createServiceError(code = "TEST_ERROR", message = "Test error message", retryable = false) {
        return {
            code,
            message,
            retryable,
            timestamp: new Date(),
            details: { testError: true },
        };
    }
    /**
     * Creates mock performance metrics
     */
    static createPerformanceMetrics() {
        return {
            latency: {
                mean: Math.random() * 100,
                p50: Math.random() * 100,
                p95: Math.random() * 200,
                p99: Math.random() * 500,
                max: Math.random() * 1000,
            },
            throughput: {
                requestsPerSecond: Math.random() * 1000,
                bytesPerSecond: Math.random() * 1024 * 1024,
                operationsPerSecond: Math.random() * 500,
            },
            utilization: {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                disk: Math.random() * 100,
                network: Math.random() * 100,
                gpu: Math.random() * 100,
            },
            errors: {
                rate: Math.random() * 10,
                percentage: Math.random() * 5,
                types: {
                    network_error: Math.floor(Math.random() * 10),
                    validation_error: Math.floor(Math.random() * 5),
                    timeout_error: Math.floor(Math.random() * 3),
                },
            },
        };
    }
    /**
     * Creates mock streaming configuration
     */
    static createStreamingConfig() {
        return {
            bufferSize: 32768,
            chunkSize: 8192,
            timeout: 30000,
            compression: true,
            protocol: "websocket",
        };
    }
    /**
     * Creates mock stream chunk
     */
    static createStreamChunk(data, sequence = 0, final = false) {
        return {
            id: `chunk_${sequence}_${Date.now()}`,
            sequence,
            data,
            final,
            metadata: {
                timestamp: new Date(),
                size: JSON.stringify(data).length,
                checksum: `checksum_${sequence}`,
            },
        };
    }
    /**
     * Creates mock agent environment
     */
    static createAgentEnvironment() {
        return {
            id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: "test-environment",
            type: "testing",
            resources: this.createResourceAllocation(),
            isolation: {
                level: "container",
                restrictions: ["limited_network_access"],
                allowedServices: ["logging", "monitoring"],
                security: {
                    encryption: true,
                    authentication: true,
                    authorization: true,
                    auditing: true,
                    policies: [],
                },
            },
            networking: {
                vpc: "test-vpc",
                subnet: "test-subnet",
                firewall: [],
                loadBalancing: false,
            },
            storage: {
                type: "local",
                size: 1024,
                encryption: true,
                backup: {
                    enabled: true,
                    frequency: "daily",
                    retention: 7,
                    location: "local",
                },
            },
        };
    }
    /**
     * Creates mock resource allocation
     */
    static createResourceAllocation() {
        return {
            cpu: 4,
            memory: 8192,
            storage: 102400,
            gpu: {
                type: "NVIDIA_T4",
                memory: 16384,
                count: 1,
                sharedAccess: false,
            },
            networking: {
                bandwidth: 1000,
                connections: 1000,
                ports: [8080, 8443],
            },
        };
    }
    /**
     * Creates mock automation task
     */
    static createAutomationTask() {
        return {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: "Test Automation Task",
            steps: [
                {
                    type: "navigate",
                    value: "https://example.com",
                    timeout: 30000,
                },
                {
                    type: "click",
                    selector: "#submit-button",
                    timeout: 5000,
                },
                {
                    type: "wait",
                    value: 1000,
                },
            ],
            conditions: [
                {
                    type: "element_present",
                    selector: "#confirmation",
                    value: undefined,
                },
            ],
            timeout: 300000,
            retryPolicy: {
                maxAttempts: 3,
                backoffStrategy: "exponential",
                baseDelay: 1000,
                maxDelay: 30000,
            },
        };
    }
    /**
     * Creates mock video generation request
     */
    static createVideoGenerationRequest() {
        return {
            prompt: "A serene landscape with mountains and a lake",
            style: {
                type: "realistic",
                mood: "peaceful",
                colorPalette: ["#87CEEB", "#228B22", "#8B4513"],
                lighting: {
                    type: "natural",
                    intensity: 0.8,
                    direction: "top-left",
                    color: "#FFFFFF",
                },
                camera: {
                    angle: "wide",
                    movement: {
                        type: "static",
                        speed: 0,
                        smoothness: 1,
                    },
                    focus: {
                        type: "auto",
                        depth: 0.5,
                    },
                    depth: {
                        enabled: true,
                        range: [0.1, 100],
                        falloff: 0.8,
                    },
                },
            },
            resolution: {
                width: 1920,
                height: 1080,
                aspectRatio: "16:9",
            },
            duration: 30,
            frameRate: 30,
            format: {
                container: "mp4",
                codec: "h264",
                bitrate: 5000000,
            },
            quality: {
                preset: "high",
                customSettings: {
                    renderSamples: 128,
                    denoising: true,
                    motionBlur: true,
                    antiAliasing: true,
                },
            },
            effects: [
                {
                    type: "color_grading",
                    parameters: { saturation: 1.2, contrast: 1.1 },
                    timing: { start: 0, duration: 30, easing: "linear" },
                },
            ],
        };
    }
    /**
     * Creates mock research hypothesis
     */
    static createResearchHypothesis() {
        return {
            id: `hypothesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            statement: "Increased temperature leads to faster chemical reaction rates",
            variables: [
                {
                    name: "temperature",
                    type: "independent",
                    dataType: "numerical",
                    measurement: {
                        unit: "celsius",
                        scale: [0, 100],
                        precision: 0.1,
                        method: "digital_thermometer",
                    },
                },
                {
                    name: "reaction_rate",
                    type: "dependent",
                    dataType: "numerical",
                    measurement: {
                        unit: "mol/L/s",
                        scale: [0, 10],
                        precision: 0.01,
                        method: "spectrophotometry",
                    },
                },
            ],
            methodology: {
                design: "experimental",
                sampling: {
                    method: "random",
                    size: 100,
                    criteria: {
                        inclusion: ["room_temperature_stable"],
                        exclusion: ["contaminated_samples"],
                    },
                },
                analysis: {
                    statistical: [
                        {
                            name: "linear_regression",
                            type: "parametric",
                            assumptions: ["normality", "linearity", "independence"],
                            parameters: { alpha: 0.05 },
                        },
                    ],
                    significance: 0.05,
                    power: 0.8,
                    corrections: ["bonferroni"],
                },
                validation: {
                    crossValidation: true,
                    holdoutSet: 20,
                    reproducibility: {
                        seed: 42,
                        environment: "controlled_lab",
                        dependencies: ["python==3.9", "numpy==1.21.0"],
                        documentation: true,
                    },
                },
            },
            predictions: [
                {
                    variable: "reaction_rate",
                    direction: "increase",
                    magnitude: 1.5,
                    confidence: 0.8,
                },
            ],
            significance: 0.85,
        };
    }
    /**
     * Creates mock audio configuration
     */
    static createAudioConfig() {
        return {
            sampleRate: 48000,
            bitDepth: 24,
            channels: 2,
            format: {
                container: "wav",
                codec: "pcm",
                bitrate: 1536000,
            },
            compression: {
                enabled: false,
                algorithm: "lossless",
                quality: 100,
            },
        };
    }
    /**
     * Creates mock music composition configuration
     */
    static createMusicCompositionConfig() {
        return {
            style: {
                genre: "classical",
                subgenre: "baroque",
                influences: ["bach", "vivaldi"],
                characteristics: ["counterpoint", "ornamental"],
            },
            structure: {
                sections: [
                    {
                        name: "exposition",
                        type: "intro",
                        duration: 32,
                        key: { tonic: "C", mode: "major", accidentals: [] },
                    },
                    {
                        name: "development",
                        type: "verse",
                        duration: 48,
                        key: { tonic: "G", mode: "major", accidentals: [] },
                    },
                ],
                transitions: [
                    {
                        from: "exposition",
                        to: "development",
                        type: "bridge",
                        duration: 4,
                    },
                ],
                dynamics: {
                    overall: "mf",
                    variation: true,
                    crescendos: [
                        {
                            start: 16,
                            duration: 8,
                            fromLevel: "mp",
                            toLevel: "f",
                        },
                    ],
                },
            },
            instruments: [
                {
                    id: "violin1",
                    type: "melodic",
                    midiProgram: 40,
                    channel: 0,
                    volume: 80,
                    pan: -20,
                    effects: [],
                },
            ],
            tempo: {
                bpm: 120,
                variations: [],
                swing: 0,
            },
            key: {
                tonic: "C",
                mode: "major",
                accidentals: [],
            },
            timeSignature: {
                numerator: 4,
                denominator: 4,
            },
        };
    }
}
// ==================== Test Data Generators ====================
export class TestDataGenerator {
    /**
     * Generates random test strings
     */
    static randomString(length = 10) {
        return Math.random()
            .toString(36)
            .substring(2, 2 + length);
    }
    /**
     * Generates random test numbers
     */
    static randomNumber(min = 0, max = 100) {
        return Math.random() * (max - min) + min;
    }
    /**
     * Generates random test booleans
     */
    static randomBoolean() {
        return Math.random() > 0.5;
    }
    /**
     * Generates test email addresses
     */
    static testEmail() {
        return `test_${this.randomString(8)}@example.com`;
    }
    /**
     * Generates test URLs
     */
    static testUrl() {
        return `https://test-${this.randomString(6)}.example.com`;
    }
    /**
     * Generates test file paths
     */
    static testFilePath(extension = "txt") {
        return `/test/path/${this.randomString(10)}.${extension}`;
    }
    /**
     * Generates test buffer data
     */
    static testBuffer(size = 1024) {
        return Buffer.alloc(size, "test data");
    }
    /**
     * Generates test timestamp ranges
     */
    static testTimeRange() {
        const start = new Date();
        const end = new Date(start.getTime() + Math.random() * 86400000); // Up to 24 hours later
        return { start, end };
    }
}
// ==================== Mock Builder Pattern ====================
export class MockBuilder {
    mocks = new Map();
    /**
     * Creates a mock function with specified behavior
     */
    mockFunction(name, implementation) {
        const mockFn = jest.fn(implementation);
        this.mocks.set(name, mockFn);
        return this;
    }
    /**
     * Creates a mock that resolves to a value
     */
    mockResolves(name, value) {
        const mockFn = jest.fn().mockResolvedValue(value);
        this.mocks.set(name, mockFn);
        return this;
    }
    /**
     * Creates a mock that rejects with an error
     */
    mockRejects(name, error) {
        const mockFn = jest.fn().mockRejectedValue(error);
        this.mocks.set(name, mockFn);
        return this;
    }
    /**
     * Creates a mock that returns different values on successive calls
     */
    mockReturnValueOnce(name, ...values) {
        let mockFn = this.mocks.get(name) || jest.fn();
        values.forEach((value) => {
            mockFn = mockFn.mockReturnValueOnce(value);
        });
        this.mocks.set(name, mockFn);
        return this;
    }
    /**
     * Gets a specific mock
     */
    getMock(name) {
        return this.mocks.get(name);
    }
    /**
     * Gets all mocks as an object
     */
    build() {
        const result = {};
        this.mocks.forEach((mock, name) => {
            result[name] = mock;
        });
        return result;
    }
    /**
     * Clears all mocks
     */
    clear() {
        this.mocks.forEach((mock) => mock.mockClear());
    }
    /**
     * Resets all mocks
     */
    reset() {
        this.mocks.forEach((mock) => mock.mockReset());
    }
}
// ==================== Contract Testing Utilities ====================
export class ContractTester {
    /**
     * Validates service response contract
     */
    static validateServiceResponse(response) {
        expect(response).toHaveProperty("success");
        expect(typeof response.success).toBe("boolean");
        expect(response).toHaveProperty("metadata");
        expect(response.metadata).toHaveProperty("requestId");
        expect(response.metadata).toHaveProperty("timestamp");
        expect(response.metadata).toHaveProperty("processingTime");
        expect(response.metadata).toHaveProperty("region");
        if (response.success) {
            expect(response).toHaveProperty("data");
        }
        else {
            expect(response).toHaveProperty("error");
            expect(response.error).toHaveProperty("code");
            expect(response.error).toHaveProperty("message");
            expect(response.error).toHaveProperty("retryable");
            expect(response.error).toHaveProperty("timestamp");
        }
    }
    /**
     * Validates performance metrics contract
     */
    static validatePerformanceMetrics(metrics) {
        expect(metrics).toHaveProperty("latency");
        expect(metrics.latency).toHaveProperty("mean");
        expect(metrics.latency).toHaveProperty("p50");
        expect(metrics.latency).toHaveProperty("p95");
        expect(metrics.latency).toHaveProperty("p99");
        expect(metrics.latency).toHaveProperty("max");
        expect(metrics).toHaveProperty("throughput");
        expect(metrics.throughput).toHaveProperty("requestsPerSecond");
        expect(metrics.throughput).toHaveProperty("bytesPerSecond");
        expect(metrics.throughput).toHaveProperty("operationsPerSecond");
        expect(metrics).toHaveProperty("utilization");
        expect(metrics.utilization).toHaveProperty("cpu");
        expect(metrics.utilization).toHaveProperty("memory");
        expect(metrics.utilization).toHaveProperty("disk");
        expect(metrics.utilization).toHaveProperty("network");
        expect(metrics).toHaveProperty("errors");
        expect(metrics.errors).toHaveProperty("rate");
        expect(metrics.errors).toHaveProperty("percentage");
        expect(metrics.errors).toHaveProperty("types");
    }
    /**
     * Validates event emitter contract
     */
    static validateEventEmitter(emitter, expectedEvents) {
        expect(emitter).toBeInstanceOf(EventEmitter);
        expectedEvents.forEach((event) => {
            expect(typeof emitter.on).toBe("function");
            expect(typeof emitter.emit).toBe("function");
            expect(typeof emitter.removeListener).toBe("function");
        });
    }
}
// ==================== Property-Based Testing Helpers ====================
export class PropertyGenerator {
    /**
     * Generates valid service configurations
     */
    static validServiceConfig() {
        return {
            apiKey: TestDataGenerator.randomString(32),
            projectId: TestDataGenerator.randomString(16),
            region: ["us-central1", "europe-west1", "asia-east1"][Math.floor(Math.random() * 3)],
            maxRetries: Math.floor(Math.random() * 5) + 1,
            timeout: Math.floor(Math.random() * 30000) + 5000,
        };
    }
    /**
     * Generates invalid service configurations for negative testing
     */
    static invalidServiceConfig() {
        const configs = [
            { apiKey: "", projectId: "valid-project" }, // Empty API key
            { apiKey: "valid-key", projectId: "" }, // Empty project ID
            { apiKey: "valid-key", projectId: "valid-project", maxRetries: -1 }, // Negative retries
            { apiKey: "valid-key", projectId: "valid-project", timeout: 0 }, // Zero timeout
            null, // Null config
            undefined, // Undefined config
            "invalid-config", // String instead of object
        ];
        return configs[Math.floor(Math.random() * configs.length)];
    }
    /**
     * Generates property-based test cases
     */
    static generateTestCases(generator, count = 100) {
        return Array.from({ length: count }, () => generator());
    }
}
// ==================== Performance Testing Utilities ====================
export class PerformanceTester {
    /**
     * Measures execution time of an async function
     */
    static async measureExecutionTime(fn) {
        const start = process.hrtime.bigint();
        const result = await fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        return { result, duration };
    }
    /**
     * Asserts performance requirements
     */
    static assertPerformance(duration, maxDuration, operation) {
        expect(duration).toBeLessThanOrEqual(maxDuration);
        if (duration > maxDuration * 0.8) {
            console.warn(`Performance warning: ${operation} took ${duration}ms (limit: ${maxDuration}ms)`);
        }
    }
    /**
     * Creates performance test suite
     */
    static createPerformanceTest(name, operation, maxDuration, iterations = 10) {
        return async () => {
            const durations = [];
            for (let i = 0; i < iterations; i++) {
                const { duration } = await this.measureExecutionTime(operation);
                durations.push(duration);
            }
            const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            const maxObservedDuration = Math.max(...durations);
            expect(avgDuration).toBeLessThanOrEqual(maxDuration);
            expect(maxObservedDuration).toBeLessThanOrEqual(maxDuration * 2); // Allow spikes up to 2x
            console.log(`Performance test ${name}: avg=${avgDuration.toFixed(2)}ms, max=${maxObservedDuration.toFixed(2)}ms`);
        };
    }
}
// ==================== Accessibility Testing Helpers ====================
export class AccessibilityTester {
    /**
     * Validates accessibility attributes in UI components
     */
    static validateAccessibility(element) {
        // Mock accessibility validation - would integrate with real a11y tools in practice
        expect(element).toBeDefined();
        // Check for common accessibility requirements
        if (element.role) {
            expect(typeof element.role).toBe("string");
        }
        if (element.ariaLabel) {
            expect(typeof element.ariaLabel).toBe("string");
            expect(element.ariaLabel.length).toBeGreaterThan(0);
        }
        if (element.tabIndex !== undefined) {
            expect(typeof element.tabIndex).toBe("number");
        }
    }
    /**
     * Generates accessibility test cases
     */
    static generateAccessibilityTestCases() {
        return [
            {
                scenario: "keyboard_navigation",
                requirements: ["tab_order", "focus_indicators", "keyboard_shortcuts"],
            },
            {
                scenario: "screen_reader",
                requirements: ["aria_labels", "semantic_markup", "alt_text"],
            },
            {
                scenario: "color_contrast",
                requirements: ["wcag_aa_contrast", "color_blind_safe"],
            },
            {
                scenario: "motor_accessibility",
                requirements: ["large_click_targets", "gesture_alternatives"],
            },
        ];
    }
}
// ==================== Error Scenario Testing ====================
export class ErrorScenarioTester {
    /**
     * Generates common error scenarios
     */
    static networkErrors() {
        return [
            new Error("Network timeout"),
            new Error("Connection refused"),
            new Error("DNS resolution failed"),
            new Error("SSL certificate invalid"),
        ];
    }
    /**
     * Generates validation errors
     */
    static validationErrors() {
        return [
            new Error("Invalid input format"),
            new Error("Required field missing"),
            new Error("Value out of range"),
            new Error("Invalid data type"),
        ];
    }
    /**
     * Generates service errors
     */
    static serviceErrors() {
        return [
            new Error("Service unavailable"),
            new Error("Rate limit exceeded"),
            new Error("Authentication failed"),
            new Error("Insufficient permissions"),
        ];
    }
    /**
     * Creates error injection test
     */
    static createErrorInjectionTest(errorType, operation) {
        return async () => {
            let errors;
            switch (errorType) {
                case "network":
                    errors = this.networkErrors();
                    break;
                case "validation":
                    errors = this.validationErrors();
                    break;
                case "service":
                    errors = this.serviceErrors();
                    break;
            }
            for (const error of errors) {
                try {
                    await operation();
                    fail(`Expected operation to throw error: ${error.message}`);
                }
                catch (thrownError) {
                    expect(thrownError).toBeDefined();
                    expect(thrownError).toBeInstanceOf(Error);
                }
            }
        };
    }
}

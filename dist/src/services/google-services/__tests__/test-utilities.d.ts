/**
 * Test Utilities and Factories for Google Services TDD Test Suites
 *
 * Comprehensive testing utilities following London School TDD practices
 * with mock factories, test data generators, and custom matchers.
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { jest } from "@jest/globals";
import { EventEmitter } from "events";
import { ServiceResponse, ServiceError, ResponseMetadata, PerformanceMetrics, StreamingConfig, StreamChunk, AgentEnvironment, ResourceAllocation, AutomationTask, VideoGenerationRequest, ResearchHypothesis, AudioConfig, MusicCompositionConfig } from "../interfaces.js";
export declare class MockFactory {
    /**
     * Creates a mock service response with consistent structure
     */
    static createServiceResponse<T>(success?: boolean, data?: T, error?: ServiceError): ServiceResponse<T>;
    /**
     * Creates mock response metadata
     */
    static createResponseMetadata(): ResponseMetadata;
    /**
     * Creates a mock service error
     */
    static createServiceError(code?: string, message?: string, retryable?: boolean): ServiceError;
    /**
     * Creates mock performance metrics
     */
    static createPerformanceMetrics(): PerformanceMetrics;
    /**
     * Creates mock streaming configuration
     */
    static createStreamingConfig(): StreamingConfig;
    /**
     * Creates mock stream chunk
     */
    static createStreamChunk<T>(data: T, sequence?: number, final?: boolean): StreamChunk<T>;
    /**
     * Creates mock agent environment
     */
    static createAgentEnvironment(): AgentEnvironment;
    /**
     * Creates mock resource allocation
     */
    static createResourceAllocation(): ResourceAllocation;
    /**
     * Creates mock automation task
     */
    static createAutomationTask(): AutomationTask;
    /**
     * Creates mock video generation request
     */
    static createVideoGenerationRequest(): VideoGenerationRequest;
    /**
     * Creates mock research hypothesis
     */
    static createResearchHypothesis(): ResearchHypothesis;
    /**
     * Creates mock audio configuration
     */
    static createAudioConfig(): AudioConfig;
    /**
     * Creates mock music composition configuration
     */
    static createMusicCompositionConfig(): MusicCompositionConfig;
}
export declare class TestDataGenerator {
    /**
     * Generates random test strings
     */
    static randomString(length?: number): string;
    /**
     * Generates random test numbers
     */
    static randomNumber(min?: number, max?: number): number;
    /**
     * Generates random test booleans
     */
    static randomBoolean(): boolean;
    /**
     * Generates test email addresses
     */
    static testEmail(): string;
    /**
     * Generates test URLs
     */
    static testUrl(): string;
    /**
     * Generates test file paths
     */
    static testFilePath(extension?: string): string;
    /**
     * Generates test buffer data
     */
    static testBuffer(size?: number): Buffer;
    /**
     * Generates test timestamp ranges
     */
    static testTimeRange(): {
        start: Date;
        end: Date;
    };
}
export declare class MockBuilder {
    private mocks;
    /**
     * Creates a mock function with specified behavior
     */
    mockFunction(name: string, implementation?: (...args: any[]) => any): this;
    /**
     * Creates a mock that resolves to a value
     */
    mockResolves(name: string, value: any): this;
    /**
     * Creates a mock that rejects with an error
     */
    mockRejects(name: string, error: Error): this;
    /**
     * Creates a mock that returns different values on successive calls
     */
    mockReturnValueOnce(name: string, ...values: any[]): this;
    /**
     * Gets a specific mock
     */
    getMock(name: string): jest.MockedFunction<any> | undefined;
    /**
     * Gets all mocks as an object
     */
    build(): Record<string, jest.MockedFunction<any>>;
    /**
     * Clears all mocks
     */
    clear(): void;
    /**
     * Resets all mocks
     */
    reset(): void;
}
export declare class ContractTester {
    /**
     * Validates service response contract
     */
    static validateServiceResponse<T>(response: ServiceResponse<T>): void;
    /**
     * Validates performance metrics contract
     */
    static validatePerformanceMetrics(metrics: PerformanceMetrics): void;
    /**
     * Validates event emitter contract
     */
    static validateEventEmitter(emitter: EventEmitter, expectedEvents: string[]): void;
}
export declare class PropertyGenerator {
    /**
     * Generates valid service configurations
     */
    static validServiceConfig(): any;
    /**
     * Generates invalid service configurations for negative testing
     */
    static invalidServiceConfig(): any;
    /**
     * Generates property-based test cases
     */
    static generateTestCases<T>(generator: () => T, count?: number): T[];
}
export declare class PerformanceTester {
    /**
     * Measures execution time of an async function
     */
    static measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
    /**
     * Asserts performance requirements
     */
    static assertPerformance(duration: number, maxDuration: number, operation: string): void;
    /**
     * Creates performance test suite
     */
    static createPerformanceTest<T>(name: string, operation: () => Promise<T>, maxDuration: number, iterations?: number): () => Promise<void>;
}
export declare class AccessibilityTester {
    /**
     * Validates accessibility attributes in UI components
     */
    static validateAccessibility(element: any): void;
    /**
     * Generates accessibility test cases
     */
    static generateAccessibilityTestCases(): Array<{
        scenario: string;
        requirements: string[];
    }>;
}
export declare class ErrorScenarioTester {
    /**
     * Generates common error scenarios
     */
    static networkErrors(): Error[];
    /**
     * Generates validation errors
     */
    static validationErrors(): Error[];
    /**
     * Generates service errors
     */
    static serviceErrors(): Error[];
    /**
     * Creates error injection test
     */
    static createErrorInjectionTest(errorType: "network" | "validation" | "service", operation: () => Promise<any>): () => Promise<void>;
}
export { MockFactory, TestDataGenerator, MockBuilder, ContractTester, PropertyGenerator, PerformanceTester, AccessibilityTester, ErrorScenarioTester, };
//# sourceMappingURL=test-utilities.d.ts.map
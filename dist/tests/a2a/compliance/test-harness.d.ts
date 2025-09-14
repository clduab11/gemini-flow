/**
 * A2A Compliance Testing Framework
 * Comprehensive test harness for Agent-to-Agent communication protocol validation
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'events';
export interface A2AMessage {
    id: string;
    correlationId?: string;
    conversationId?: string;
    source: AgentIdentifier;
    target: AgentTarget;
    route?: string[];
    toolName: MCPToolName;
    parameters: any;
    execution: ExecutionContext;
    timestamp: number;
    ttl: number;
    priority: MessagePriority;
    retryPolicy: RetryPolicy;
    coordination: CoordinationMode;
    stateRequirements: StateRequirement[];
    resourceRequirements: ResourceRequirement[];
}
export interface A2AResponse {
    messageId: string;
    correlationId: string;
    source: AgentIdentifier;
    success: boolean;
    result?: any;
    error?: A2AError;
    timestamp: number;
    metadata: ResponseMetadata;
}
export interface AgentIdentifier {
    agentId: string;
    role: AgentRole;
    capabilities?: string[];
    version?: string;
}
export type AgentTarget = SingleTarget | MultipleTargets | GroupTarget | BroadcastTarget | ConditionalTarget;
export interface SingleTarget {
    type: 'single';
    agentId: string;
}
export interface MultipleTargets {
    type: 'multiple';
    agentIds: string[];
    coordinationMode: 'parallel' | 'sequential' | 'race';
}
export interface GroupTarget {
    type: 'group';
    role: AgentRole;
    capabilities?: string[];
    maxAgents?: number;
    selectionStrategy: 'random' | 'load-balanced' | 'capability-matched';
}
export interface BroadcastTarget {
    type: 'broadcast';
    filter?: AgentFilter;
    excludeSource?: boolean;
}
export interface ConditionalTarget {
    type: 'conditional';
    conditions: AgentCondition[];
    fallback?: AgentTarget;
}
export interface ExecutionContext {
    timeout: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    retries: number;
    isolation: boolean;
}
export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';
export interface RetryPolicy {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential' | 'custom';
    baseDelay: number;
    maxDelay: number;
    retryableErrors: A2AErrorCode[];
}
export type CoordinationMode = DirectCoordination | BroadcastCoordination | ConsensusCoordination | PipelineCoordination;
export interface DirectCoordination {
    mode: 'direct';
    timeout: number;
    retries: number;
    acknowledgment: boolean;
}
export interface BroadcastCoordination {
    mode: 'broadcast';
    aggregation: 'all' | 'majority' | 'first' | 'any';
    timeout: number;
    partialSuccess: boolean;
}
export interface ConsensusCoordination {
    mode: 'consensus';
    consensusType: 'unanimous' | 'majority' | 'weighted';
    votingTimeout: number;
    minimumParticipants: number;
}
export interface PipelineCoordination {
    mode: 'pipeline';
    stages: PipelineStage[];
    failureStrategy: 'abort' | 'skip' | 'retry';
    statePassthrough: boolean;
}
export interface PipelineStage {
    agentTarget: AgentTarget;
    toolName: MCPToolName;
    inputTransform?: (input: any) => any;
    outputTransform?: (output: any) => any;
}
export interface StateRequirement {
    type: 'read' | 'write' | 'exclusive' | 'shared';
    namespace: string;
    keys: string[];
    consistency: 'eventual' | 'strong' | 'causal';
    timeout: number;
}
export interface ResourceRequirement {
    type: 'cpu' | 'memory' | 'gpu' | 'network' | 'storage' | 'custom';
    amount: number;
    unit: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    duration: number;
    exclusive?: boolean;
}
export interface A2AError {
    code: A2AErrorCode;
    message: string;
    details?: any;
    recoverable: boolean;
    suggestedAction: RecoveryAction;
}
export declare enum A2AErrorCode {
    AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
    TOOL_NOT_SUPPORTED = "TOOL_NOT_SUPPORTED",
    INSUFFICIENT_RESOURCES = "INSUFFICIENT_RESOURCES",
    STATE_CONFLICT = "STATE_CONFLICT",
    TIMEOUT = "TIMEOUT",
    AUTHORIZATION_FAILED = "AUTHORIZATION_FAILED",
    COORDINATION_FAILED = "COORDINATION_FAILED"
}
export interface ResponseMetadata {
    processingTime: number;
    resourceUsage: ResourceUsage;
    hops: number;
    cached: boolean;
}
export interface ResourceUsage {
    cpu: number;
    memory: number;
    network: number;
}
export type MCPToolName = string;
export type AgentRole = string;
export type AgentFilter = any;
export type AgentCondition = any;
export type RecoveryAction = any;
/**
 * Mock Agent Implementation for Testing
 */
export declare class MockAgent extends EventEmitter {
    readonly id: string;
    readonly role: AgentRole;
    readonly capabilities: string[];
    private messageQueue;
    private responses;
    private tools;
    private resources;
    private state;
    constructor(id: string, role: AgentRole, capabilities?: string[], supportedTools?: MCPToolName[]);
    /**
     * Process incoming A2A message
     */
    processMessage(message: A2AMessage): Promise<A2AResponse>;
    /**
     * Add tool support to agent
     */
    addTool(toolName: MCPToolName, handler?: (params: any) => Promise<any>): void;
    /**
     * Remove tool support
     */
    removeTool(toolName: MCPToolName): void;
    /**
     * Get agent status
     */
    getStatus(): AgentStatus;
    /**
     * Simulate failure scenarios
     */
    simulateFailure(type: 'timeout' | 'resource' | 'tool' | 'state', duration?: number): void;
    private validateMessage;
    private allocateResources;
    private handleStateRequirements;
    private executeTool;
    private getCurrentResourceUsage;
    private mapErrorToCode;
    private isRecoverable;
    private getSuggestedAction;
    private simulateTimeout;
    private simulateResourceExhaustion;
    private simulateToolFailure;
    private simulateStateConflict;
}
/**
 * A2A Message Bus Implementation for Testing
 */
export declare class MockA2AMessageBus extends EventEmitter {
    private agents;
    private messageHistory;
    private responseHistory;
    private metrics;
    /**
     * Register agent with message bus
     */
    registerAgent(agent: MockAgent): void;
    /**
     * Unregister agent
     */
    unregisterAgent(agentId: string): void;
    /**
     * Send message to single agent
     */
    send(message: A2AMessage): Promise<A2AResponse>;
    /**
     * Broadcast message to multiple agents
     */
    broadcast(message: A2AMessage, targets: string[]): Promise<A2AResponse[]>;
    /**
     * Route message based on coordination mode
     */
    route(message: A2AMessage): Promise<A2AResponse[]>;
    /**
     * Get message bus metrics
     */
    getMetrics(): MessageBusMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Get all registered agents
     */
    getAgents(): AgentStatus[];
    private resolveTarget;
    private findAgentsByRole;
    private findAgentsByConditions;
    private handleConsensus;
    private handlePipeline;
    private updateMetrics;
}
/**
 * Test Data Builders
 */
export declare class A2ATestDataBuilder {
    /**
     * Create test message with defaults
     */
    static createMessage(overrides?: Partial<A2AMessage>): A2AMessage;
    /**
     * Create test agent
     */
    static createAgent(id?: string, role?: AgentRole, capabilities?: string[], tools?: MCPToolName[]): MockAgent;
    /**
     * Create test message bus with agents
     */
    static createMessageBus(agentCount?: number): MockA2AMessageBus;
}
/**
 * Test Utilities
 */
export declare class A2ATestUtils {
    /**
     * Wait for condition with timeout
     */
    static waitFor(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
    /**
     * Generate performance test load
     */
    static generateLoad(messageBus: MockA2AMessageBus, messageCount: number, concurrency?: number): Promise<A2AResponse[]>;
    /**
     * Validate message compliance with A2A protocol
     */
    static validateMessageCompliance(message: A2AMessage): ValidationResult;
}
export interface AgentStatus {
    id: string;
    role: AgentRole;
    capabilities: string[];
    supportedTools: MCPToolName[];
    resources: Record<string, number>;
    messageQueue: number;
    uptime: number;
}
export interface MessageBusMetrics {
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
    averageLatency: number;
    throughput: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * A2A Compliance Test Suite Base Class
 */
export declare abstract class A2AComplianceTestSuite {
    protected messageBus: MockA2AMessageBus;
    protected testAgents: MockAgent[];
    protected setup(): Promise<void>;
    protected teardown(): Promise<void>;
    abstract runTests(): Promise<void>;
}
//# sourceMappingURL=test-harness.d.ts.map
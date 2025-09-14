/**
 * Distributed Tracing Implementation with OpenTelemetry
 * Comprehensive observability across all Google Services integrations
 */
import { SpanKind } from "@opentelemetry/api";
interface TracingConfig {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    exporters: {
        jaeger?: {
            endpoint: string;
            username?: string;
            password?: string;
        };
        otlp?: {
            endpoint: string;
            headers?: Record<string, string>;
        };
        console?: boolean;
    };
    sampling: {
        ratio: number;
        rules: SamplingRule[];
    };
    instrumentations: {
        http: boolean;
        express: boolean;
        grpc: boolean;
        mysql: boolean;
        redis: boolean;
        mongodb: boolean;
        aws: boolean;
        google: boolean;
        custom: boolean;
    };
    attributes: {
        global: Record<string, string>;
        sensitive: string[];
    };
}
interface SamplingRule {
    service?: string;
    operation?: string;
    traceIdPattern?: string;
    samplingRate: number;
}
interface CustomSpanAttributes {
    "gemini.model"?: string;
    "gemini.prompt_tokens"?: number;
    "gemini.completion_tokens"?: number;
    "vertex.project_id"?: string;
    "vertex.region"?: string;
    "user.id"?: string;
    "session.id"?: string;
    "request.id"?: string;
    "workflow.id"?: string;
    "agent.type"?: string;
    "task.priority"?: string;
    "cache.hit"?: boolean;
    "database.query_type"?: string;
    "api.rate_limit_remaining"?: number;
}
export declare class DistributedTracing {
    private logger;
    private config;
    private sdk?;
    private tracer;
    private meter;
    private isInitialized;
    constructor(config: TracingConfig);
    /**
     * Initialize distributed tracing
     */
    initialize(): Promise<void>;
    /**
     * Create span processors with configured exporters
     */
    private createSpanProcessors;
    /**
     * Create metric readers
     */
    private createMetricReaders;
    /**
     * Create instrumentations
     */
    private createInstrumentations;
    /**
     * Setup custom instrumentations for Google services
     */
    private setupCustomInstrumentations;
    /**
     * Instrument Vertex AI calls
     */
    private instrumentVertexAI;
    /**
     * Instrument Gemini API calls
     */
    private instrumentGeminiAPI;
    /**
     * Instrument Google Cloud Storage operations
     */
    private instrumentGoogleCloudStorage;
    /**
     * Instrument Agent-to-Agent protocol
     */
    private instrumentA2AProtocol;
    /**
     * Instrument MCP protocol
     */
    private instrumentMCPProtocol;
    /**
     * Create a custom span with Google Services context
     */
    createSpan<T>(name: string, operation: (span: any) => Promise<T>, attributes?: CustomSpanAttributes, spanKind?: SpanKind): Promise<T>;
    /**
     * Create a span for Google AI model inference
     */
    traceAIInference<T>(modelName: string, operation: (span: any) => Promise<T>, metadata?: {
        promptTokens?: number;
        maxTokens?: number;
        temperature?: number;
        userId?: string;
        sessionId?: string;
    }): Promise<T>;
    /**
     * Create a span for agent workflow execution
     */
    traceAgentWorkflow<T>(workflowId: string, agentType: string, operation: (span: any) => Promise<T>, metadata?: {
        priority?: string;
        userId?: string;
        taskId?: string;
    }): Promise<T>;
    /**
     * Create a span for multimedia processing
     */
    traceMultimediaProcessing<T>(operation: string, mediaType: string, executor: (span: any) => Promise<T>, metadata?: {
        inputSize?: number;
        outputSize?: number;
        duration?: number;
        quality?: string;
    }): Promise<T>;
    /**
     * Add custom attributes to active span
     */
    addAttributes(attributes: CustomSpanAttributes): void;
    /**
     * Record an exception in the active span
     */
    recordException(error: Error): void;
    /**
     * Create and increment a counter metric
     */
    incrementCounter(name: string, value?: number, attributes?: Record<string, string>): void;
    /**
     * Record a histogram value
     */
    recordHistogram(name: string, value: number, attributes?: Record<string, string>): void;
    /**
     * Create a gauge metric
     */
    setGauge(name: string, value: number, attributes?: Record<string, string>): void;
    /**
     * Get current trace context
     */
    getCurrentTraceContext(): any;
    /**
     * Run operation with specific trace context
     */
    withContext<T>(traceContext: any, operation: () => Promise<T>): Promise<T>;
    /**
     * Sanitize attributes to remove sensitive data
     */
    private sanitizeAttributes;
    /**
     * Helper method to patch Vertex AI methods (implementation depends on client structure)
     */
    private patchVertexAIMethod;
    /**
     * Gracefully shutdown tracing
     */
    shutdown(): Promise<void>;
    /**
     * Get tracing health status
     */
    getHealthStatus(): {
        initialized: boolean;
        exporters: string[];
        instrumentations: string[];
        activeSpans: number;
    };
}
export declare const DEFAULT_TRACING_CONFIG: TracingConfig;
/**
 * Get or create the distributed tracing instance
 */
export declare function getTracing(config?: TracingConfig): DistributedTracing;
export type { TracingConfig, CustomSpanAttributes, SamplingRule };
//# sourceMappingURL=distributed-tracing.d.ts.map
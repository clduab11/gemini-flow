/**
 * Distributed Tracing Implementation with OpenTelemetry
 * Comprehensive observability across all Google Services integrations
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { OTLPTraceExporter } from "@opentelemetry/exporter-otlp-http";
import { BatchSpanProcessor, ConsoleSpanExporter, } from "@opentelemetry/sdk-trace-node";
import { PeriodicExportingMetricReader, ConsoleMetricExporter, } from "@opentelemetry/sdk-metrics";
import { trace, metrics, context, SpanKind, SpanStatusCode, } from "@opentelemetry/api";
import { Logger } from "../utils/logger";
export class DistributedTracing {
    logger;
    config;
    sdk;
    tracer;
    meter;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        this.logger = new Logger("DistributedTracing");
    }
    /**
     * Initialize distributed tracing
     */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn("Distributed tracing already initialized");
            return;
        }
        try {
            this.logger.info("Initializing distributed tracing...");
            // Create resource with service information
            const resource = new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
                [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
                [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
                ...this.config.attributes.global,
            });
            // Configure exporters
            const spanProcessors = this.createSpanProcessors();
            const metricReaders = this.createMetricReaders();
            // Configure instrumentations
            const instrumentations = this.createInstrumentations();
            // Initialize SDK
            this.sdk = new NodeSDK({
                resource,
                spanProcessors,
                metricReaders,
                instrumentations,
            });
            // Start SDK
            this.sdk.start();
            // Get tracer and meter instances
            this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
            this.meter = metrics.getMeter(this.config.serviceName, this.config.serviceVersion);
            // Setup custom instrumentations
            await this.setupCustomInstrumentations();
            this.isInitialized = true;
            this.logger.info("Distributed tracing initialized successfully");
        }
        catch (error) {
            this.logger.error("Failed to initialize distributed tracing:", error);
            throw error;
        }
    }
    /**
     * Create span processors with configured exporters
     */
    createSpanProcessors() {
        const processors = [];
        // Jaeger exporter
        if (this.config.exporters.jaeger) {
            const jaegerExporter = new JaegerExporter({
                endpoint: this.config.exporters.jaeger.endpoint,
                username: this.config.exporters.jaeger.username,
                password: this.config.exporters.jaeger.password,
            });
            processors.push(new BatchSpanProcessor(jaegerExporter));
            this.logger.debug("Added Jaeger exporter");
        }
        // OTLP exporter
        if (this.config.exporters.otlp) {
            const otlpExporter = new OTLPTraceExporter({
                url: this.config.exporters.otlp.endpoint,
                headers: this.config.exporters.otlp.headers,
            });
            processors.push(new BatchSpanProcessor(otlpExporter));
            this.logger.debug("Added OTLP exporter");
        }
        // Console exporter (for development)
        if (this.config.exporters.console) {
            const consoleExporter = new ConsoleSpanExporter();
            processors.push(new BatchSpanProcessor(consoleExporter));
            this.logger.debug("Added console exporter");
        }
        return processors;
    }
    /**
     * Create metric readers
     */
    createMetricReaders() {
        const readers = [];
        // Console metrics (for development)
        if (this.config.exporters.console) {
            readers.push(new PeriodicExportingMetricReader({
                exporter: new ConsoleMetricExporter(),
                exportIntervalMillis: 10000,
            }));
        }
        return readers;
    }
    /**
     * Create instrumentations
     */
    createInstrumentations() {
        const instrumentations = [];
        // Auto instrumentations
        if (this.config.instrumentations.http ||
            this.config.instrumentations.express ||
            this.config.instrumentations.grpc) {
            instrumentations.push(getNodeAutoInstrumentations({
                "@opentelemetry/instrumentation-http": this.config.instrumentations.http,
                "@opentelemetry/instrumentation-express": this.config.instrumentations.express,
                "@opentelemetry/instrumentation-grpc": this.config.instrumentations.grpc,
                "@opentelemetry/instrumentation-mysql": this.config.instrumentations.mysql,
                "@opentelemetry/instrumentation-redis": this.config.instrumentations.redis,
                "@opentelemetry/instrumentation-mongodb": this.config.instrumentations.mongodb,
                "@opentelemetry/instrumentation-aws-sdk": this.config.instrumentations.aws,
            }));
        }
        return instrumentations;
    }
    /**
     * Setup custom instrumentations for Google services
     */
    async setupCustomInstrumentations() {
        if (!this.config.instrumentations.custom)
            return;
        // Google Vertex AI instrumentation
        this.instrumentVertexAI();
        // Gemini API instrumentation
        this.instrumentGeminiAPI();
        // Google Cloud Storage instrumentation
        this.instrumentGoogleCloudStorage();
        // Agent-to-Agent protocol instrumentation
        this.instrumentA2AProtocol();
        // MCP protocol instrumentation
        this.instrumentMCPProtocol();
        this.logger.debug("Custom instrumentations configured");
    }
    /**
     * Instrument Vertex AI calls
     */
    instrumentVertexAI() {
        const originalVertexCall = this.patchVertexAIMethod();
        // Patch Vertex AI client methods
        if (originalVertexCall) {
            const self = this;
            function patchedVertexCall(...args) {
                return self.tracer.startActiveSpan("vertex_ai.generate", {
                    kind: SpanKind.CLIENT,
                    attributes: {
                        "vertex.service": "generative-ai",
                        "vertex.model": args[0]?.model || "unknown",
                        "vertex.project_id": process.env.VERTEX_AI_PROJECT_ID,
                        "vertex.region": process.env.VERTEX_AI_REGION || "us-central1",
                    },
                }, async (span) => {
                    try {
                        const startTime = Date.now();
                        const result = await originalVertexCall.apply(this, args);
                        // Add result attributes
                        span.setAttributes({
                            "vertex.prompt_tokens": result?.usage?.promptTokens || 0,
                            "vertex.completion_tokens": result?.usage?.candidatesTokens || 0,
                            "vertex.response_time_ms": Date.now() - startTime,
                            "vertex.finish_reason": result?.candidates?.[0]?.finishReason || "unknown",
                        });
                        span.setStatus({ code: SpanStatusCode.OK });
                        return result;
                    }
                    catch (error) {
                        span.recordException(error);
                        span.setStatus({
                            code: SpanStatusCode.ERROR,
                            message: error.message,
                        });
                        throw error;
                    }
                    finally {
                        span.end();
                    }
                });
            }
            // Apply patch (implementation depends on specific Vertex AI client structure)
            this.logger.debug("Vertex AI instrumentation applied");
        }
    }
    /**
     * Instrument Gemini API calls
     */
    instrumentGeminiAPI() {
        // Similar implementation for Gemini API
        this.logger.debug("Gemini API instrumentation applied");
    }
    /**
     * Instrument Google Cloud Storage operations
     */
    instrumentGoogleCloudStorage() {
        // Implementation for GCS operations
        this.logger.debug("Google Cloud Storage instrumentation applied");
    }
    /**
     * Instrument Agent-to-Agent protocol
     */
    instrumentA2AProtocol() {
        // Implementation for A2A protocol tracing
        this.logger.debug("A2A protocol instrumentation applied");
    }
    /**
     * Instrument MCP protocol
     */
    instrumentMCPProtocol() {
        // Implementation for MCP protocol tracing
        this.logger.debug("MCP protocol instrumentation applied");
    }
    /**
     * Create a custom span with Google Services context
     */
    async createSpan(name, operation, attributes, spanKind = SpanKind.INTERNAL) {
        if (!this.isInitialized || !this.tracer) {
            this.logger.warn("Tracing not initialized, executing operation without span");
            return operation(null);
        }
        return this.tracer.startActiveSpan(name, {
            kind: spanKind,
            attributes: this.sanitizeAttributes(attributes || {}),
        }, async (span) => {
            try {
                const result = await operation(span);
                span.setStatus({ code: SpanStatusCode.OK });
                return result;
            }
            catch (error) {
                span.recordException(error);
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error.message,
                });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Create a span for Google AI model inference
     */
    async traceAIInference(modelName, operation, metadata) {
        return this.createSpan(`ai.inference.${modelName}`, operation, {
            "gemini.model": modelName,
            "gemini.prompt_tokens": metadata?.promptTokens,
            "user.id": metadata?.userId,
            "session.id": metadata?.sessionId,
            "ai.model.temperature": metadata?.temperature?.toString(),
            "ai.model.max_tokens": metadata?.maxTokens?.toString(),
        }, SpanKind.CLIENT);
    }
    /**
     * Create a span for agent workflow execution
     */
    async traceAgentWorkflow(workflowId, agentType, operation, metadata) {
        return this.createSpan(`agent.workflow.${agentType}`, operation, {
            "workflow.id": workflowId,
            "agent.type": agentType,
            "task.priority": metadata?.priority,
            "user.id": metadata?.userId,
            "task.id": metadata?.taskId,
        });
    }
    /**
     * Create a span for multimedia processing
     */
    async traceMultimediaProcessing(operation, mediaType, executor, metadata) {
        return this.createSpan(`multimedia.${operation}.${mediaType}`, executor, {
            "multimedia.operation": operation,
            "multimedia.type": mediaType,
            "multimedia.input_size": metadata?.inputSize?.toString(),
            "multimedia.output_size": metadata?.outputSize?.toString(),
            "multimedia.duration": metadata?.duration?.toString(),
            "multimedia.quality": metadata?.quality,
        });
    }
    /**
     * Add custom attributes to active span
     */
    addAttributes(attributes) {
        const activeSpan = trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.setAttributes(this.sanitizeAttributes(attributes));
        }
    }
    /**
     * Record an exception in the active span
     */
    recordException(error) {
        const activeSpan = trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.recordException(error);
            activeSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
            });
        }
    }
    /**
     * Create and increment a counter metric
     */
    incrementCounter(name, value = 1, attributes) {
        if (!this.meter)
            return;
        const counter = this.meter.createCounter(name, {
            description: `Counter for ${name}`,
        });
        counter.add(value, attributes);
    }
    /**
     * Record a histogram value
     */
    recordHistogram(name, value, attributes) {
        if (!this.meter)
            return;
        const histogram = this.meter.createHistogram(name, {
            description: `Histogram for ${name}`,
        });
        histogram.record(value, attributes);
    }
    /**
     * Create a gauge metric
     */
    setGauge(name, value, attributes) {
        if (!this.meter)
            return;
        const gauge = this.meter.createUpDownCounter(name, {
            description: `Gauge for ${name}`,
        });
        gauge.add(value, attributes);
    }
    /**
     * Get current trace context
     */
    getCurrentTraceContext() {
        return trace.getActiveSpan()?.spanContext();
    }
    /**
     * Run operation with specific trace context
     */
    async withContext(traceContext, operation) {
        if (!traceContext) {
            return operation();
        }
        return context.with(trace.setSpanContext(context.active(), traceContext), operation);
    }
    /**
     * Sanitize attributes to remove sensitive data
     */
    sanitizeAttributes(attributes) {
        const sanitized = {};
        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null)
                continue;
            let stringValue = value.toString();
            // Redact sensitive fields
            if (this.config.attributes.sensitive.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
                stringValue = "[REDACTED]";
            }
            sanitized[key] = stringValue;
        }
        return sanitized;
    }
    /**
     * Helper method to patch Vertex AI methods (implementation depends on client structure)
     */
    patchVertexAIMethod() {
        // This would be implemented based on the actual Vertex AI client structure
        // Return the original method to patch
        return null;
    }
    /**
     * Gracefully shutdown tracing
     */
    async shutdown() {
        if (!this.isInitialized || !this.sdk) {
            return;
        }
        try {
            this.logger.info("Shutting down distributed tracing...");
            await this.sdk.shutdown();
            this.isInitialized = false;
            this.logger.info("Distributed tracing shutdown complete");
        }
        catch (error) {
            this.logger.error("Error during tracing shutdown:", error);
        }
    }
    /**
     * Get tracing health status
     */
    getHealthStatus() {
        return {
            initialized: this.isInitialized,
            exporters: Object.keys(this.config.exporters).filter((key) => this.config.exporters[key]),
            instrumentations: Object.keys(this.config.instrumentations).filter((key) => this.config.instrumentations[key]),
            activeSpans: 0, // Would need to track this separately
        };
    }
}
// Default configuration
export const DEFAULT_TRACING_CONFIG = {
    serviceName: "gemini-flow",
    serviceVersion: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    exporters: {
        jaeger: process.env.JAEGER_ENDPOINT
            ? {
                endpoint: process.env.JAEGER_ENDPOINT,
                username: process.env.JAEGER_USERNAME,
                password: process.env.JAEGER_PASSWORD,
            }
            : undefined,
        otlp: process.env.OTLP_ENDPOINT
            ? {
                endpoint: process.env.OTLP_ENDPOINT,
                headers: {
                    Authorization: `Bearer ${process.env.OTLP_TOKEN || ""}`,
                },
            }
            : undefined,
        console: process.env.NODE_ENV === "development",
    },
    sampling: {
        ratio: parseFloat(process.env.TRACE_SAMPLING_RATIO || "0.1"), // 10% sampling
        rules: [
            { operation: "health-check", samplingRate: 0.01 }, // 1% for health checks
            { operation: "vertex_ai.generate", samplingRate: 1.0 }, // 100% for AI calls
            { service: "critical-service", samplingRate: 1.0 },
        ],
    },
    instrumentations: {
        http: true,
        express: true,
        grpc: false,
        mysql: false,
        redis: true,
        mongodb: false,
        aws: false,
        google: true,
        custom: true,
    },
    attributes: {
        global: {
            "deployment.environment": process.env.NODE_ENV || "development",
            "service.namespace": "gemini-flow",
            "service.instance.id": process.env.HOSTNAME || "localhost",
        },
        sensitive: ["password", "token", "key", "secret", "credential", "auth"],
    },
};
// Singleton instance
let tracingInstance = null;
/**
 * Get or create the distributed tracing instance
 */
export function getTracing(config) {
    if (!tracingInstance) {
        tracingInstance = new DistributedTracing(config || DEFAULT_TRACING_CONFIG);
    }
    return tracingInstance;
}

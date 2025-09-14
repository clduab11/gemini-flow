/**
 * Shared Types for Advanced Integrations
 *
 * Common interfaces and types used across Project Mariner and Veo3 integrations
 */
import { EventEmitter } from "events";
export class IntegrationBaseError extends Error {
    code;
    component;
    severity;
    recoverable;
    metadata;
    timestamp;
    constructor(message, code, component, severity = "medium", recoverable = true, metadata = {}) {
        super(message);
        this.name = "IntegrationError";
        this.code = code;
        this.component = component;
        this.severity = severity;
        this.recoverable = recoverable;
        this.metadata = metadata;
        this.timestamp = new Date();
    }
}
// === ABSTRACT BASE CLASSES ===
export class BaseIntegration extends EventEmitter {
    config;
    logger;
    metrics = new Map();
    status = "initializing";
    constructor(config) {
        super();
        this.config = config;
    }
    recordMetric(name, value) {
        this.metrics.set(name, value);
        this.emit("metric", { name, value, timestamp: new Date() });
    }
    emitProgress(taskId, progress, stage, message) {
        const update = {
            taskId,
            progress,
            stage,
            message,
            timestamp: new Date(),
        };
        this.emit("progress", update);
    }
    emitError(error) {
        this.emit("error", error);
    }
    getStatus() {
        return this.status;
    }
    isReady() {
        return this.status === "ready";
    }
}
//# sourceMappingURL=types.js.map
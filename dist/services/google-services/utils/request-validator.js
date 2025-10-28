/**
 * Request validation utilities for Imagen4 client
 */
export class RequestValidator {
    static validateImageRequest(request) {
        if (!request.prompt || request.prompt.trim().length === 0) {
            return {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "Prompt is required",
                    retryable: false,
                    timestamp: new Date(),
                },
                metadata: {
                    requestId: "",
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        if (request.prompt.length > this.MAX_PROMPT_LENGTH) {
            return {
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: `Prompt exceeds maximum length of ${this.MAX_PROMPT_LENGTH} characters`,
                    retryable: false,
                    timestamp: new Date(),
                },
                metadata: {
                    requestId: "",
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        return {
            success: true,
            metadata: {
                requestId: "",
                timestamp: new Date(),
                processingTime: 0,
                region: "local",
            },
        };
    }
    static validateBatchRequest(batchRequest) {
        if (!batchRequest.requests || batchRequest.requests.length === 0) {
            return {
                success: false,
                error: {
                    code: "INVALID_BATCH",
                    message: "Batch must contain at least one request",
                    retryable: false,
                    timestamp: new Date(),
                },
                metadata: {
                    requestId: "",
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        if (batchRequest.requests.length > this.MAX_BATCH_SIZE) {
            return {
                success: false,
                error: {
                    code: "INVALID_BATCH",
                    message: `Batch cannot exceed ${this.MAX_BATCH_SIZE} requests`,
                    retryable: false,
                    timestamp: new Date(),
                },
                metadata: {
                    requestId: "",
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        // Validate individual requests
        for (let i = 0; i < batchRequest.requests.length; i++) {
            const validation = RequestValidator.validateImageRequest(batchRequest.requests[i]);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        code: "INVALID_BATCH_REQUEST",
                        message: `Request ${i} is invalid: ${validation.error?.message}`,
                        retryable: false,
                        timestamp: new Date(),
                    },
                    metadata: {
                        requestId: "",
                        timestamp: new Date(),
                        processingTime: 0,
                        region: "local",
                    },
                };
            }
        }
        return {
            success: true,
            metadata: {
                requestId: "",
                timestamp: new Date(),
                processingTime: 0,
                region: "local",
            },
        };
    }
}
RequestValidator.MAX_PROMPT_LENGTH = 2000;
RequestValidator.MAX_BATCH_SIZE = 100;

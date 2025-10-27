/**
 * Response building utilities for Imagen4 client
 */
export class ResponseBuilder {
    static createSuccessResponse(data, requestId, processingTime = 0) {
        return {
            success: true,
            data,
            metadata: {
                requestId,
                timestamp: new Date().toISOString(),
                processingTime,
                version: '1.0.0'
            }
        };
    }
    static createErrorResponse(code, message, details, requestId) {
        return {
            success: false,
            error: {
                code,
                message,
                details
            },
            metadata: {
                requestId: requestId || this.generateRequestId(),
                timestamp: new Date().toISOString(),
                processingTime: 0,
                version: '1.0.0'
            }
        };
    }
    static createStreamingResponse(data, requestId, isComplete = false) {
        return {
            success: true,
            data: {
                ...data,
                streaming: true,
                complete: isComplete
            },
            metadata: {
                requestId,
                timestamp: new Date().toISOString(),
                processingTime: 0,
                version: '1.0.0'
            }
        };
    }
    static createBatchResponse(results, requestId) {
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        return {
            success: successCount === totalCount,
            data: {
                results,
                summary: {
                    total: totalCount,
                    successful: successCount,
                    failed: totalCount - successCount
                }
            },
            metadata: {
                requestId,
                timestamp: new Date().toISOString(),
                processingTime: 0,
                version: '1.0.0'
            }
        };
    }
    static generateRequestId() {
        return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

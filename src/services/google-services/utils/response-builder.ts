/**
 * Response building utilities for Imagen4 client
 */

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    version: string;
  };
}

export class ResponseBuilder {
  static createSuccessResponse(
    data: any,
    requestId: string,
    processingTime: number = 0
  ): ServiceResponse {
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

  static createErrorResponse(
    code: string,
    message: string,
    details?: any,
    requestId?: string
  ): ServiceResponse {
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

  static createStreamingResponse(
    data: any,
    requestId: string,
    isComplete: boolean = false
  ): ServiceResponse {
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

  static createBatchResponse(
    results: ServiceResponse[],
    requestId: string
  ): ServiceResponse {
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

  private static generateRequestId(): string {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
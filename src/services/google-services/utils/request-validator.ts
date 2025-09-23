/**
 * Request validation utilities for Imagen4 client
 */

export interface Imagen4GenerationRequest {
  prompt: string;
  style?: {
    artistic?: any;
    photographic?: any;
    composition?: any;
    lighting?: any;
    transfer?: any;
  };
  quality?: {
    preset: "draft" | "standard" | "high" | "ultra" | "custom";
    resolution?: { width: number; height: number };
    samples?: number;
    steps?: number;
    guidance?: number;
  };
  processing?: {
    filters?: any[];
    enhancement?: any;
    correction?: any;
  };
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    author?: string;
    license?: string;
  };
  options?: {
    priority?: "low" | "normal" | "high";
    timeout?: number;
    retries?: number;
    streaming?: boolean;
    batch?: boolean;
  };
}

export interface Imagen4BatchRequest {
  requests: Imagen4GenerationRequest[];
  options?: {
    parallel: boolean;
    priority: "low" | "normal" | "high";
    timeout: number;
    retries: number;
  };
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    timestamp: Date;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    region: string;
  };
}

export class RequestValidator {
  private static readonly MAX_PROMPT_LENGTH = 2000;
  private static readonly MAX_BATCH_SIZE = 100;

  static validateImageRequest(request: Imagen4GenerationRequest): ServiceResponse<void> {
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

  static validateBatchRequest(batchRequest: Imagen4BatchRequest): ServiceResponse<void> {
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
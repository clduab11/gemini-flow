/**
 * Batch processing utilities for Imagen4 client
 */

export interface BatchRequest {
  id: string;
  data: any;
  priority?: number;
  dependencies?: string[];
}

export interface BatchResult {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

export interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
}

export class BatchProcessor {
  static readonly DEFAULT_BATCH_SIZE = 10;
  static readonly MAX_BATCH_SIZE = 100;

  static validateBatchSize(size: number): void {
    if (size < 1 || size > this.MAX_BATCH_SIZE) {
      throw new Error(
        `Batch size must be between 1 and ${this.MAX_BATCH_SIZE}, got ${size}`
      );
    }
  }

  static splitIntoBatches<T>(
    items: T[],
    batchSize: number = this.DEFAULT_BATCH_SIZE
  ): T[][] {
    this.validateBatchSize(batchSize);

    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  static processBatchSequentially<TInput, TResult>(
    batch: TInput[],
    processor: (item: TInput) => Promise<TResult>
  ): Promise<TResult[]> {
    return Promise.all(batch.map(item => processor(item)));
  }

  static async processBatchWithConcurrency<TInput, TResult>(
    batch: TInput[],
    processor: (item: TInput) => Promise<TResult>,
    concurrency: number = 3
  ): Promise<TResult[]> {
    const results: TResult[] = [];
    const batches = this.splitIntoBatches(batch, concurrency);

    for (const batch of batches) {
      const batchResults = await this.processBatchSequentially(batch, processor);
      results.push(...batchResults);
    }

    return results;
  }

  static calculateBatchProgress(results: BatchResult[]): BatchProgress {
    const total = results.length;
    const processed = results.filter(r => r.success || r.error).length;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.error).length;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    return {
      total,
      processed,
      successful,
      failed,
      percentage
    };
  }

  static retryFailedRequests(
    results: BatchResult[],
    processor: (item: any) => Promise<any>,
    maxRetries: number = 3
  ): Promise<BatchResult[]> {
    const failedRequests = results
      .filter(r => r.error)
      .map(r => ({ id: r.requestId, data: r.data }));

    if (failedRequests.length === 0) {
      return Promise.resolve(results);
    }

    return new Promise((resolve) => {
      this.processBatchWithConcurrency(
        failedRequests,
        async (request) => {
          let lastError: string = '';

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const data = await processor(request);
              return {
                requestId: request.id,
                success: true,
                data,
                processingTime: 0
              };
            } catch (error) {
              lastError = error instanceof Error ? error.message : String(error);

              if (attempt < maxRetries) {
                // Wait before retry
                await new Promise(resolve =>
                  setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
              }
            }
          }

          return {
            requestId: request.id,
            success: false,
            error: lastError,
            processingTime: 0
          };
        }
      ).then(newResults => {
        const updatedResults = results.map(result => {
          const retryResult = newResults.find(r => r.requestId === result.requestId);
          return retryResult || result;
        });
        resolve(updatedResults);
      });
    });
  }

  static prioritizeBatch<T extends BatchRequest>(requests: T[]): T[] {
    return requests.sort((a, b) => {
      // Sort by priority (lower number = higher priority)
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by ID for consistent ordering
      return a.id.localeCompare(b.id);
    });
  }
}
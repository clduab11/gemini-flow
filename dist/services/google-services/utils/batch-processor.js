/**
 * Batch processing utilities for Imagen4 client
 */
export class BatchProcessor {
    static validateBatchSize(size) {
        if (size < 1 || size > this.MAX_BATCH_SIZE) {
            throw new Error(`Batch size must be between 1 and ${this.MAX_BATCH_SIZE}, got ${size}`);
        }
    }
    static splitIntoBatches(items, batchSize = this.DEFAULT_BATCH_SIZE) {
        this.validateBatchSize(batchSize);
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    static processBatchSequentially(batch, processor) {
        return Promise.all(batch.map(item => processor(item)));
    }
    static async processBatchWithConcurrency(batch, processor, concurrency = 3) {
        const results = [];
        const batches = this.splitIntoBatches(batch, concurrency);
        for (const batch of batches) {
            const batchResults = await this.processBatchSequentially(batch, processor);
            results.push(...batchResults);
        }
        return results;
    }
    static calculateBatchProgress(results) {
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
    static retryFailedRequests(results, processor, maxRetries = 3) {
        const failedRequests = results
            .filter(r => r.error)
            .map(r => ({ id: r.requestId, data: r.data }));
        if (failedRequests.length === 0) {
            return Promise.resolve(results);
        }
        return new Promise((resolve) => {
            this.processBatchWithConcurrency(failedRequests, async (request) => {
                let lastError = '';
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        const data = await processor(request);
                        return {
                            requestId: request.id,
                            success: true,
                            data,
                            processingTime: 0
                        };
                    }
                    catch (error) {
                        lastError = error instanceof Error ? error.message : String(error);
                        if (attempt < maxRetries) {
                            // Wait before retry
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                        }
                    }
                }
                return {
                    requestId: request.id,
                    success: false,
                    error: lastError,
                    processingTime: 0
                };
            }).then(newResults => {
                const updatedResults = results.map(result => {
                    const retryResult = newResults.find(r => r.requestId === result.requestId);
                    return retryResult || result;
                });
                resolve(updatedResults);
            });
        });
    }
    static prioritizeBatch(requests) {
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
BatchProcessor.DEFAULT_BATCH_SIZE = 10;
BatchProcessor.MAX_BATCH_SIZE = 100;

/**
 * Streaming utilities for Imagen4 client
 */
export class StreamingHandler {
    static createStreamChunk(data, streamId, isLast = false) {
        return {
            id: `chunk_${streamId}_${this.chunkSequence++}`,
            data,
            sequence: this.chunkSequence,
            timestamp: new Date().toISOString(),
            isLast
        };
    }
    static validateStreamChunk(chunk) {
        return (chunk &&
            typeof chunk.id === 'string' &&
            typeof chunk.sequence === 'number' &&
            typeof chunk.timestamp === 'string' &&
            typeof chunk.isLast === 'boolean');
    }
    static mergeStreamChunks(chunks) {
        if (!chunks || chunks.length === 0) {
            return null;
        }
        // Sort chunks by sequence
        const sortedChunks = chunks.sort((a, b) => a.sequence - b.sequence);
        // Validate chunk sequence
        for (let i = 0; i < sortedChunks.length; i++) {
            if (sortedChunks[i].sequence !== i + 1) {
                throw new Error(`Invalid chunk sequence at position ${i}`);
            }
        }
        // Merge data based on type
        const firstChunk = sortedChunks[0];
        if (typeof firstChunk.data === 'string') {
            return sortedChunks.map(c => c.data).join('');
        }
        else if (Array.isArray(firstChunk.data)) {
            return sortedChunks.flatMap(c => c.data);
        }
        else if (typeof firstChunk.data === 'object') {
            const merged = {};
            sortedChunks.forEach(chunk => {
                Object.assign(merged, chunk.data);
            });
            return merged;
        }
        return sortedChunks[sortedChunks.length - 1].data;
    }
    static createStreamError(message, streamId, code = 'STREAM_ERROR') {
        return {
            id: `error_${streamId}_${Date.now()}`,
            data: { error: { code, message } },
            sequence: -1,
            timestamp: new Date().toISOString(),
            isLast: true
        };
    }
    static isStreamComplete(chunks) {
        if (!chunks || chunks.length === 0) {
            return false;
        }
        return chunks.some(chunk => chunk.isLast);
    }
    static getStreamProgress(chunks) {
        if (!chunks || chunks.length === 0) {
            return { total: 0, processed: 0, percentage: 0 };
        }
        const maxSequence = Math.max(...chunks.map(c => c.sequence));
        const processed = chunks.filter(c => c.sequence > 0).length;
        return {
            total: maxSequence,
            processed,
            percentage: maxSequence > 0 ? Math.round((processed / maxSequence) * 100) : 0
        };
    }
}
StreamingHandler.chunkSequence = 0;

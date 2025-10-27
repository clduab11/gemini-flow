/**
 * ID generation utilities for Imagen4 client
 */
export class IdGenerator {
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static generateGenerationId() {
        return `img4_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static generateChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
}
IdGenerator.counter = 0;

/**
 * ID generation utilities for Imagen4 client
 */

export class IdGenerator {
  private static counter = 0;

  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateGenerationId(): string {
    return `img4_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
/**
 * Test Data Generator for Google Services Integration Tests
 *
 * Generates realistic test data for various Google AI services including
 * video streams, audio samples, images, research data, and multimedia content.
 */
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
export interface GeneratorConfig {
    mediaFiles: {
        video: string[];
        audio: string[];
        images: string[];
    };
    payloadSizes: number[];
    quality: {
        video: string[];
        audio: string[];
        image: string[];
    };
    formats: {
        video: string[];
        audio: string[];
        image: string[];
    };
    seed?: number;
}
export interface StreamData {
    id: string;
    type: 'video' | 'audio' | 'multimodal';
    chunks: StreamChunk[];
    metadata: StreamMetadata;
}
export interface StreamChunk {
    id: string;
    sequence: number;
    data: Buffer;
    timestamp: number;
    size: number;
    checksum: string;
    final: boolean;
}
export interface StreamMetadata {
    duration: number;
    format: string;
    quality: string;
    sampleRate?: number;
    channels?: number;
    resolution?: {
        width: number;
        height: number;
    };
    framerate?: number;
}
export interface ResearchData {
    hypothesis: string;
    variables: ResearchVariable[];
    dataset: DataPoint[];
    methodology: string;
    expectedResults: any;
}
export interface ResearchVariable {
    name: string;
    type: 'independent' | 'dependent' | 'control';
    dataType: 'numerical' | 'categorical' | 'ordinal';
    range?: [number, number];
    categories?: string[];
}
export interface DataPoint {
    id: string;
    values: Record<string, any>;
    timestamp: Date;
    source: string;
}
export declare class TestDataGenerator extends EventEmitter {
    private config;
    private defaultConfig;
    constructor(config?: Partial<GeneratorConfig>);
    /**
     * Generate realistic video stream data
     */
    generateVideoStream(options: {
        duration: number;
        fps?: number;
        resolution?: string;
        format?: string;
        quality?: string;
    }): StreamData;
    /**
     * Generate realistic audio stream data
     */
    generateAudioStream(options: {
        duration: number;
        sampleRate?: number;
        channels?: number;
        format?: string;
        quality?: string;
    }): StreamData;
    /**
     * Generate multimodal stream with synchronized video and audio
     */
    generateMultimodalStream(options: {
        duration: number;
        videoOptions?: any;
        audioOptions?: any;
    }): StreamData;
    /**
     * Generate research dataset for Co-Scientist testing
     */
    generateResearchData(options: {
        hypothesis: string;
        sampleSize?: number;
        variables?: Partial<ResearchVariable>[];
        correlation?: number;
    }): ResearchData;
    /**
     * Generate realistic image data
     */
    generateImageData(options: {
        width?: number;
        height?: number;
        format?: string;
        quality?: string;
        type?: 'photo' | 'diagram' | 'chart' | 'illustration';
    }): Buffer;
    /**
     * Generate test payloads of various sizes
     */
    generatePayloads(count?: number): Buffer[];
    /**
     * Generate network simulation scenarios
     */
    generateNetworkScenarios(): Array<{
        name: string;
        conditions: {
            latency: number;
            bandwidth: number;
            packetLoss: number;
            jitter: number;
        };
    }>;
    private generateId;
    private calculateChecksum;
    private getVideoChunkSize;
    private getAudioChunkSize;
    private generateVideoChunkData;
    private generateAudioChunkData;
    private parseResolution;
    private generateDefaultVariable;
    private generateVariableValue;
    private generateCorrelatedValue;
    private generateMethodology;
    private generateExpectedResults;
    private calculateImageSize;
    private writePNGHeader;
    private writeJPEGHeader;
    private writeWebPHeader;
    private fillImageData;
}
export default TestDataGenerator;
//# sourceMappingURL=test-data-generator.d.ts.map
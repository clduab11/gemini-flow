/**
 * Test Data Generator for Google Services Integration Tests
 * 
 * Generates realistic test data for various Google AI services including
 * video streams, audio samples, images, research data, and multimedia content.
 */

import { faker } from '@faker-js/faker';
import { createHash } from 'crypto';
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
  resolution?: { width: number; height: number };
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

export class TestDataGenerator extends EventEmitter {
  private defaultConfig: GeneratorConfig = {
    mediaFiles: {
      video: ['sample-1080p.mp4', 'sample-720p.webm', 'sample-480p.avi'],
      audio: ['sample-48k.wav', 'sample-44k.mp3', 'sample-speech.flac'],
      images: ['sample-high-res.png', 'sample-medium.jpg', 'sample-low.webp']
    },
    payloadSizes: [1024, 8192, 65536, 262144, 1048576], // 1KB to 1MB
    quality: {
      video: ['480p', '720p', '1080p', '4k'],
      audio: ['low', 'medium', 'high', 'lossless'],
      image: ['thumbnail', 'medium', 'high', 'original']
    },
    formats: {
      video: ['mp4', 'webm', 'avi', 'mov'],
      audio: ['wav', 'mp3', 'flac', 'opus'],
      image: ['png', 'jpg', 'webp', 'gif']
    }
  };
  
  constructor(private config: Partial<GeneratorConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
    
    if (config.seed) {
      faker.seed(config.seed);
    }
  }
  
  /**
   * Generate realistic video stream data
   */
  generateVideoStream(options: {
    duration: number;
    fps?: number;
    resolution?: string;
    format?: string;
    quality?: string;
  }): StreamData {
    const {
      duration,
      fps = 30,
      resolution = '720p',
      format = 'mp4',
      quality = 'medium'
    } = options;
    
    const streamId = this.generateId('video-stream');
    const chunkDuration = 1000; // 1 second per chunk
    const totalChunks = Math.ceil(duration / chunkDuration);
    
    const chunks: StreamChunk[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkSize = this.getVideoChunkSize(resolution, quality);
      const chunkData = this.generateVideoChunkData(chunkSize, resolution, fps);
      
      chunks.push({
        id: `${streamId}-chunk-${i}`,
        sequence: i + 1,
        data: chunkData,
        timestamp: i * chunkDuration,
        size: chunkData.length,
        checksum: this.calculateChecksum(chunkData),
        final: i === totalChunks - 1
      });
    }
    
    const [width, height] = this.parseResolution(resolution);
    
    return {
      id: streamId,
      type: 'video',
      chunks,
      metadata: {
        duration,
        format,
        quality,
        resolution: { width, height },
        framerate: fps
      }
    };
  }
  
  /**
   * Generate realistic audio stream data
   */
  generateAudioStream(options: {
    duration: number;
    sampleRate?: number;
    channels?: number;
    format?: string;
    quality?: string;
  }): StreamData {
    const {
      duration,
      sampleRate = 44100,
      channels = 2,
      format = 'wav',
      quality = 'medium'
    } = options;
    
    const streamId = this.generateId('audio-stream');
    const chunkDuration = 100; // 100ms per chunk
    const totalChunks = Math.ceil(duration / chunkDuration);
    
    const chunks: StreamChunk[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkSize = this.getAudioChunkSize(sampleRate, channels, chunkDuration);
      const chunkData = this.generateAudioChunkData(chunkSize, sampleRate, channels);
      
      chunks.push({
        id: `${streamId}-chunk-${i}`,
        sequence: i + 1,
        data: chunkData,
        timestamp: i * chunkDuration,
        size: chunkData.length,
        checksum: this.calculateChecksum(chunkData),
        final: i === totalChunks - 1
      });
    }
    
    return {
      id: streamId,
      type: 'audio',
      chunks,
      metadata: {
        duration,
        format,
        quality,
        sampleRate,
        channels
      }
    };
  }
  
  /**
   * Generate multimodal stream with synchronized video and audio
   */
  generateMultimodalStream(options: {
    duration: number;
    videoOptions?: any;
    audioOptions?: any;
  }): StreamData {
    const { duration, videoOptions = {}, audioOptions = {} } = options;
    
    const videoStream = this.generateVideoStream({ duration, ...videoOptions });
    const audioStream = this.generateAudioStream({ duration, ...audioOptions });
    
    const streamId = this.generateId('multimodal-stream');
    const chunks: StreamChunk[] = [];
    
    // Interleave video and audio chunks with proper synchronization
    const maxChunks = Math.max(videoStream.chunks.length, audioStream.chunks.length);
    
    for (let i = 0; i < maxChunks; i++) {
      const videoChunk = videoStream.chunks[i];
      const audioChunk = audioStream.chunks[i];
      
      if (videoChunk && audioChunk) {
        // Combine video and audio data
        const combinedData = Buffer.concat([
          Buffer.from('VIDEO:'),
          videoChunk.data,
          Buffer.from('AUDIO:'),
          audioChunk.data
        ]);
        
        chunks.push({
          id: `${streamId}-chunk-${i}`,
          sequence: i + 1,
          data: combinedData,
          timestamp: Math.min(videoChunk.timestamp, audioChunk.timestamp),
          size: combinedData.length,
          checksum: this.calculateChecksum(combinedData),
          final: i === maxChunks - 1
        });
      }
    }
    
    return {
      id: streamId,
      type: 'multimodal',
      chunks,
      metadata: {
        duration,
        format: 'multimodal',
        quality: 'mixed',
        resolution: videoStream.metadata.resolution,
        framerate: videoStream.metadata.framerate,
        sampleRate: audioStream.metadata.sampleRate,
        channels: audioStream.metadata.channels
      }
    };
  }
  
  /**
   * Generate research dataset for Co-Scientist testing
   */
  generateResearchData(options: {
    hypothesis: string;
    sampleSize?: number;
    variables?: Partial<ResearchVariable>[];
    correlation?: number;
  }): ResearchData {
    const {
      hypothesis,
      sampleSize = 100,
      variables = [],
      correlation = 0.7
    } = options;
    
    // Generate variables if not provided
    const researchVariables: ResearchVariable[] = variables.length > 0
      ? variables.map(v => ({ ...this.generateDefaultVariable(), ...v }))
      : [
          {
            name: 'data_diversity',
            type: 'independent',
            dataType: 'numerical',
            range: [0, 1]
          },
          {
            name: 'model_accuracy',
            type: 'dependent',
            dataType: 'numerical',
            range: [0, 1]
          },
          {
            name: 'dataset_size',
            type: 'control',
            dataType: 'numerical',
            range: [1000, 100000]
          }
        ];
    
    // Generate correlated dataset
    const dataset: DataPoint[] = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const values: Record<string, any> = {};
      
      // Generate independent variables first
      researchVariables
        .filter(v => v.type === 'independent' || v.type === 'control')
        .forEach(variable => {
          values[variable.name] = this.generateVariableValue(variable);
        });
      
      // Generate dependent variables with correlation
      researchVariables
        .filter(v => v.type === 'dependent')
        .forEach(variable => {
          values[variable.name] = this.generateCorrelatedValue(
            values,
            variable,
            correlation
          );
        });
      
      dataset.push({
        id: `datapoint-${i}`,
        values,
        timestamp: faker.date.recent({ days: 30 }),
        source: faker.helpers.arrayElement(['experiment_a', 'experiment_b', 'simulation'])
      });
    }
    
    return {
      hypothesis,
      variables: researchVariables,
      dataset,
      methodology: this.generateMethodology(),
      expectedResults: this.generateExpectedResults(researchVariables, correlation)
    };
  }
  
  /**
   * Generate realistic image data
   */
  generateImageData(options: {
    width?: number;
    height?: number;
    format?: string;
    quality?: string;
    type?: 'photo' | 'diagram' | 'chart' | 'illustration';
  }): Buffer {
    const {
      width = 1024,
      height = 1024,
      format = 'png',
      quality = 'high',
      type = 'photo'
    } = options;
    
    const imageSize = this.calculateImageSize(width, height, format, quality);
    const imageData = Buffer.alloc(imageSize);
    
    // Generate realistic image header based on format
    switch (format.toLowerCase()) {
      case 'png':
        this.writePNGHeader(imageData, width, height);
        break;
      case 'jpg':
      case 'jpeg':
        this.writeJPEGHeader(imageData, width, height);
        break;
      case 'webp':
        this.writeWebPHeader(imageData, width, height);
        break;
    }
    
    // Fill with pattern based on type
    this.fillImageData(imageData, type);
    
    return imageData;
  }
  
  /**
   * Generate test payloads of various sizes
   */
  generatePayloads(count: number = 10): Buffer[] {
    const payloads: Buffer[] = [];
    const sizes = this.config.payloadSizes || this.defaultConfig.payloadSizes;
    
    for (let i = 0; i < count; i++) {
      const size = faker.helpers.arrayElement(sizes);
      const payload = Buffer.alloc(size);
      
      // Fill with realistic data patterns
      for (let j = 0; j < size; j++) {
        payload[j] = Math.floor(Math.random() * 256);
      }
      
      payloads.push(payload);
    }
    
    return payloads;
  }
  
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
  }> {
    return [
      {
        name: 'ideal',
        conditions: {
          latency: 10,
          bandwidth: 1000000000, // 1Gbps
          packetLoss: 0,
          jitter: 1
        }
      },
      {
        name: 'broadband',
        conditions: {
          latency: 30,
          bandwidth: 100000000, // 100Mbps
          packetLoss: 0.001,
          jitter: 5
        }
      },
      {
        name: 'mobile-4g',
        conditions: {
          latency: 80,
          bandwidth: 50000000, // 50Mbps
          packetLoss: 0.01,
          jitter: 20
        }
      },
      {
        name: 'mobile-3g',
        conditions: {
          latency: 200,
          bandwidth: 2000000, // 2Mbps
          packetLoss: 0.02,
          jitter: 50
        }
      },
      {
        name: 'degraded',
        conditions: {
          latency: 500,
          bandwidth: 100000, // 100Kbps
          packetLoss: 0.05,
          jitter: 100
        }
      }
    ];
  }
  
  // Helper methods
  
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateChecksum(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex').substr(0, 16);
  }
  
  private getVideoChunkSize(resolution: string, quality: string): number {
    const baseSize = {
      '480p': 50000,
      '720p': 100000,
      '1080p': 200000,
      '4k': 500000
    }[resolution] || 100000;
    
    const qualityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      ultra: 4.0
    }[quality] || 1.0;
    
    return Math.floor(baseSize * qualityMultiplier);
  }
  
  private getAudioChunkSize(sampleRate: number, channels: number, duration: number): number {
    const bytesPerSample = 2; // 16-bit audio
    return Math.floor((sampleRate * channels * bytesPerSample * duration) / 1000);
  }
  
  private generateVideoChunkData(size: number, resolution: string, fps: number): Buffer {
    const data = Buffer.alloc(size);
    
    // Generate realistic video data patterns
    for (let i = 0; i < size; i++) {
      // Simulate video compression patterns
      const pattern = Math.sin(i / 100) * 127 + 128;
      data[i] = Math.floor(pattern) % 256;
    }
    
    return data;
  }
  
  private generateAudioChunkData(size: number, sampleRate: number, channels: number): Buffer {
    const data = Buffer.alloc(size);
    
    // Generate realistic audio waveform
    for (let i = 0; i < size; i += 2) {
      // Generate sine wave with some noise
      const sample = Math.sin((i / 2) * 2 * Math.PI * 440 / sampleRate) * 16384 + 
                     (Math.random() - 0.5) * 1000;
      
      const intSample = Math.floor(Math.max(-32768, Math.min(32767, sample)));
      data.writeInt16LE(intSample, i);
    }
    
    return data;
  }
  
  private parseResolution(resolution: string): [number, number] {
    const resolutions = {
      '480p': [854, 480],
      '720p': [1280, 720],
      '1080p': [1920, 1080],
      '4k': [3840, 2160]
    };
    
    return (resolutions as any)[resolution] || [1280, 720];
  }
  
  private generateDefaultVariable(): ResearchVariable {
    return {
      name: faker.science.chemicalElement().name.toLowerCase(),
      type: faker.helpers.arrayElement(['independent', 'dependent', 'control']),
      dataType: faker.helpers.arrayElement(['numerical', 'categorical', 'ordinal'])
    };
  }
  
  private generateVariableValue(variable: ResearchVariable): any {
    switch (variable.dataType) {
      case 'numerical':
        if (variable.range) {
          return faker.number.float({ min: variable.range[0], max: variable.range[1] });
        }
        return faker.number.float({ min: 0, max: 100 });
        
      case 'categorical':
        if (variable.categories) {
          return faker.helpers.arrayElement(variable.categories);
        }
        return faker.helpers.arrayElement(['A', 'B', 'C', 'D']);
        
      case 'ordinal':
        return faker.number.int({ min: 1, max: 5 });
        
      default:
        return faker.number.float({ min: 0, max: 1 });
    }
  }
  
  private generateCorrelatedValue(
    existingValues: Record<string, any>,
    variable: ResearchVariable,
    correlation: number
  ): any {
    // Simple correlation simulation - use first independent variable
    const independentVars = Object.entries(existingValues)
      .filter(([_, value]) => typeof value === 'number');
    
    if (independentVars.length === 0) {
      return this.generateVariableValue(variable);
    }
    
    const [_, baseValue] = independentVars[0];
    const normalizedBase = typeof baseValue === 'number' ? baseValue : 0.5;
    
    // Apply correlation with some noise
    const correlatedValue = correlation * normalizedBase + 
                           (1 - correlation) * Math.random();
    
    // Scale to variable range
    if (variable.range) {
      const [min, max] = variable.range;
      return min + correlatedValue * (max - min);
    }
    
    return correlatedValue;
  }
  
  private generateMethodology(): string {
    const methodologies = [
      'randomized controlled trial',
      'observational cohort study',
      'cross-sectional analysis',
      'longitudinal study',
      'experimental design'
    ];
    
    return faker.helpers.arrayElement(methodologies);
  }
  
  private generateExpectedResults(variables: ResearchVariable[], correlation: number): any {
    const dependent = variables.filter(v => v.type === 'dependent');
    const independent = variables.filter(v => v.type === 'independent');
    
    return {
      primaryOutcome: dependent[0]?.name || 'outcome',
      expectedCorrelation: correlation,
      significanceLevel: 0.05,
      powerAnalysis: {
        power: 0.8,
        effectSize: Math.abs(correlation),
        sampleSize: 100
      }
    };
  }
  
  private calculateImageSize(width: number, height: number, format: string, quality: string): number {
    const pixelCount = width * height;
    const baseMultiplier = {
      png: 4, // RGBA
      jpg: 0.3, // Compressed
      jpeg: 0.3,
      webp: 0.25,
      gif: 1 // Indexed
    }[format.toLowerCase()] || 1;
    
    const qualityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      original: 3.0
    }[quality] || 1.0;
    
    return Math.floor(pixelCount * baseMultiplier * qualityMultiplier) + 1024; // Add header space
  }
  
  private writePNGHeader(buffer: Buffer, width: number, height: number): void {
    // PNG signature
    buffer.writeUInt32BE(0x89504e47, 0);
    buffer.writeUInt32BE(0x0d0a1a0a, 4);
    
    // IHDR chunk
    buffer.writeUInt32BE(13, 8); // Length
    buffer.write('IHDR', 12);
    buffer.writeUInt32BE(width, 16);
    buffer.writeUInt32BE(height, 20);
    buffer.writeUInt8(8, 24); // Bit depth
    buffer.writeUInt8(2, 25); // Color type (RGB)
  }
  
  private writeJPEGHeader(buffer: Buffer, width: number, height: number): void {
    // JPEG SOI marker
    buffer.writeUInt16BE(0xffd8, 0);
    
    // JFIF header
    buffer.writeUInt16BE(0xffe0, 2); // APP0 marker
    buffer.writeUInt16BE(16, 4); // Length
    buffer.write('JFIF\0', 6);
  }
  
  private writeWebPHeader(buffer: Buffer, width: number, height: number): void {
    // WebP RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(buffer.length - 8, 4);
    buffer.write('WEBP', 8);
    buffer.write('VP8 ', 12);
  }
  
  private fillImageData(buffer: Buffer, type: 'photo' | 'diagram' | 'chart' | 'illustration'): void {
    const headerSize = 64; // Skip header area
    
    for (let i = headerSize; i < buffer.length; i++) {
      switch (type) {
        case 'photo':
          // Natural image patterns
          buffer[i] = Math.floor(Math.random() * 256);
          break;
          
        case 'diagram':
          // High contrast patterns
          buffer[i] = Math.random() > 0.5 ? 255 : 0;
          break;
          
        case 'chart':
          // Geometric patterns
          buffer[i] = (i % 100 < 50) ? 200 : 50;
          break;
          
        case 'illustration':
          // Smooth gradients
          buffer[i] = Math.floor((i % 256));
          break;
      }
    }
  }
}

export default TestDataGenerator;

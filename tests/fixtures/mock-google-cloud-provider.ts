/**
 * Mock Google Cloud Provider for Integration Testing
 * 
 * Provides realistic mock implementations of Google Cloud services
 * with configurable latency, error rates, and response patterns.
 */

import { EventEmitter } from 'events';
import express, { Express, Request, Response } from 'express';
import http from 'http';
import WebSocket from 'ws';
import { faker } from '@faker-js/faker';
import { createHash } from 'crypto';

export interface MockProviderConfig {
  latency: {
    min: number;
    max: number;
  };
  reliability: number; // 0-1, probability of success
  rateLimits: Record<string, number>; // requests per minute
  responseSize: {
    min: number;
    max: number;
  };
  cors?: boolean;
  logging?: boolean;
}

export interface ServiceEndpoint {
  path: string;
  method: string;
  handler: (req: Request, res: Response) => void | Promise<void>;
  rateLimit?: number;
  auth?: boolean;
}

export class MockGoogleCloudProvider extends EventEmitter {
  private app: Express;
  private server: http.Server | null = null;
  private wsServer: WebSocket.Server | null = null;
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();
  private requestCounts: Map<string, number> = new Map();
  
  constructor(
    private config: MockProviderConfig,
    private port: number = 8080
  ) {
    super();
    this.app = express();
    this.setupMiddleware();
    this.setupEndpoints();
  }
  
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        if (this.config.logging) {
          console.log(`Mock Google Cloud Provider listening on port ${this.port}`);
        }
        
        // Setup WebSocket server for streaming
        this.wsServer = new WebSocket.Server({ server: this.server });
        this.setupWebSocketHandlers();
        
        this.emit('started');
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wsServer) {
        this.wsServer.close();
      }
      
      if (this.server) {
        this.server.close(() => {
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  getApiKey(): string {
    return 'mock-api-key-' + Math.random().toString(36).substr(2, 9);
  }
  
  getConfig(): any {
    return {
      apiKey: this.getApiKey(),
      projectId: 'mock-project-123',
      endpoint: `http://localhost:${this.port}`,
      streaming: {
        endpoint: `ws://localhost:${this.port}/stream`
      }
    };
  }
  
  private setupMiddleware(): void {
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    if (this.config.cors) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
        next();
      });
    }
    
    // Request logging
    if (this.config.logging) {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
      });
    }
    
    // Simulate latency
    this.app.use(async (req, res, next) => {
      const delay = this.randomLatency();
      await this.sleep(delay);
      next();
    });
    
    // Rate limiting
    this.app.use((req, res, next) => {
      const key = req.ip + req.path;
      const limit = this.getRateLimit(req.path);
      
      if (limit && !this.checkRateLimit(key, limit)) {
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            details: {
              limit,
              retryAfter: this.getRateLimitResetTime(key)
            }
          }
        });
        return;
      }
      
      next();
    });
    
    // Simulate random failures
    this.app.use((req, res, next) => {
      if (Math.random() > this.config.reliability) {
        const errors = [
          { code: 503, message: 'Service temporarily unavailable' },
          { code: 500, message: 'Internal server error' },
          { code: 504, message: 'Gateway timeout' }
        ];
        
        const error = errors[Math.floor(Math.random() * errors.length)];
        res.status(error.code).json({
          error: {
            code: 'SERVICE_ERROR',
            message: error.message,
            details: { temporary: true }
          }
        });
        return;
      }
      
      next();
    });
  }
  
  private setupEndpoints(): void {
    // Vertex AI endpoints
    this.app.post('/v1/projects/:projectId/locations/:location/publishers/google/models/:model:predict', 
      this.handleVertexAIPredict.bind(this)
    );
    
    this.app.post('/v1/projects/:projectId/locations/:location/publishers/google/models/:model:streamGenerateContent',
      this.handleVertexAIStream.bind(this)
    );
    
    // Streaming API endpoints
    this.app.post('/v1/streaming/sessions', this.handleCreateStreamingSession.bind(this));
    this.app.delete('/v1/streaming/sessions/:sessionId', this.handleEndStreamingSession.bind(this));
    this.app.post('/v1/streaming/sessions/:sessionId/video', this.handleStartVideoStream.bind(this));
    this.app.post('/v1/streaming/sessions/:sessionId/audio', this.handleStartAudioStream.bind(this));
    
    // Veo3 Video Generation
    this.app.post('/v1/video:generate', this.handleVideoGeneration.bind(this));
    this.app.get('/v1/video/:videoId/status', this.handleVideoStatus.bind(this));
    this.app.get('/v1/video/:videoId/download', this.handleVideoDownload.bind(this));
    
    // Imagen4 Image Generation
    this.app.post('/v1/images:generate', this.handleImageGeneration.bind(this));
    this.app.get('/v1/images/:imageId', this.handleImageDownload.bind(this));
    
    // Chirp Speech Generation
    this.app.post('/v1/speech:synthesize', this.handleSpeechSynthesis.bind(this));
    this.app.get('/v1/voices', this.handleListVoices.bind(this));
    
    // Lyria Music Generation
    this.app.post('/v1/music:generate', this.handleMusicGeneration.bind(this));
    this.app.get('/v1/music/:musicId/status', this.handleMusicStatus.bind(this));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // Metrics endpoint
    this.app.get('/metrics', this.handleMetrics.bind(this));
  }
  
  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;
    
    this.wsServer.on('connection', (ws, req) => {
      const sessionId = req.url?.split('sessionId=')[1] || 'unknown';
      
      if (this.config.logging) {
        console.log(`WebSocket connected for session: ${sessionId}`);
      }
      
      // Send initial connection acknowledgment
      ws.send(JSON.stringify({
        type: 'connection_ack',
        sessionId,
        timestamp: new Date().toISOString()
      }));
      
      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: { message: 'Invalid message format' }
          }));
        }
      });
      
      ws.on('close', () => {
        if (this.config.logging) {
          console.log(`WebSocket disconnected for session: ${sessionId}`);
        }
      });
    });
  }
  
  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'start_stream':
        await this.startMockStream(ws, message);
        break;
        
      case 'stop_stream':
        ws.send(JSON.stringify({
          type: 'stream_stopped',
          streamId: message.streamId
        }));
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: { message: `Unknown message type: ${message.type}` }
        }));
    }
  }
  
  private async startMockStream(ws: WebSocket, message: any): Promise<void> {
    const { streamId, type, duration = 10000 } = message;
    const chunkInterval = 100; // Send chunk every 100ms
    const totalChunks = Math.floor(duration / chunkInterval);
    
    for (let i = 0; i < totalChunks; i++) {
      if (ws.readyState !== WebSocket.OPEN) break;
      
      const chunk = {
        type: 'stream_chunk',
        streamId,
        sequence: i + 1,
        data: this.generateMockChunkData(type),
        timestamp: new Date().toISOString(),
        final: i === totalChunks - 1
      };
      
      ws.send(JSON.stringify(chunk));
      await this.sleep(chunkInterval);
    }
  }
  
  private async handleVertexAIPredict(req: Request, res: Response): Promise<void> {
    const { model } = req.params;
    const { instances, parameters } = req.body;
    
    // Simulate processing delay
    await this.sleep(this.randomLatency());
    
    const predictions = instances.map((instance: any, index: number) => ({
      content: this.generateMockContent(model, instance),
      safetyRatings: this.generateSafetyRatings(),
      citationMetadata: { citations: [] }
    }));
    
    res.json({ predictions });
  }
  
  private async handleVertexAIStream(req: Request, res: Response): Promise<void> {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    const { model } = req.params;
    const { contents } = req.body;
    
    // Simulate streaming response
    const chunks = this.generateStreamingChunks(model, contents);
    
    for (let i = 0; i < chunks.length; i++) {
      res.write(`data: ${JSON.stringify(chunks[i])}\n\n`);
      await this.sleep(100 + Math.random() * 200);
    }
    
    res.end();
  }
  
  private async handleCreateStreamingSession(req: Request, res: Response): Promise<void> {
    const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      success: true,
      data: {
        id: sessionId,
        type: req.body.type || 'multimodal',
        status: 'active',
        createdAt: new Date().toISOString(),
        websocketUrl: `ws://localhost:${this.port}/stream?sessionId=${sessionId}`
      }
    });
  }
  
  private async handleEndStreamingSession(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;
    
    res.json({
      success: true,
      data: {
        sessionId,
        status: 'ended',
        endedAt: new Date().toISOString()
      }
    });
  }
  
  private async handleStartVideoStream(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;
    const { id: streamId, quality, source } = req.body;
    
    res.json({
      success: true,
      data: {
        streamId,
        sessionId,
        status: 'streaming',
        quality: quality || { level: 'medium' },
        startedAt: new Date().toISOString()
      }
    });
  }
  
  private async handleStartAudioStream(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;
    const { id: streamId, quality, processing } = req.body;
    
    res.json({
      success: true,
      data: {
        streamId,
        sessionId,
        status: 'streaming',
        quality: quality || { level: 'medium' },
        processingEnabled: Boolean(processing),
        appliedFilters: processing ? Object.keys(processing).filter(k => processing[k]) : [],
        startedAt: new Date().toISOString()
      }
    });
  }
  
  private async handleVideoGeneration(req: Request, res: Response): Promise<void> {
    const videoId = 'video-' + Math.random().toString(36).substr(2, 9);
    const { duration = 10000, quality = 'medium' } = req.body;
    
    // Simulate longer processing time for video
    const processingTime = Math.max(2000, duration * 0.5);
    
    setTimeout(() => {
      // In a real scenario, this would be a webhook or polling endpoint update
      this.emit('videoReady', { videoId, url: `/v1/video/${videoId}/download` });
    }, processingTime);
    
    res.json({
      success: true,
      data: {
        videoId,
        status: 'processing',
        estimatedCompletionTime: new Date(Date.now() + processingTime).toISOString(),
        statusUrl: `/v1/video/${videoId}/status`
      },
      metadata: {
        processingTime: processingTime
      }
    });
  }
  
  private async handleVideoStatus(req: Request, res: Response): Promise<void> {
    const { videoId } = req.params;
    
    // Simulate video processing completion
    const isReady = Math.random() > 0.3; // 70% chance of being ready
    
    res.json({
      videoId,
      status: isReady ? 'completed' : 'processing',
      progress: isReady ? 100 : Math.floor(Math.random() * 90) + 10,
      downloadUrl: isReady ? `/v1/video/${videoId}/download` : null,
      updatedAt: new Date().toISOString()
    });
  }
  
  private async handleVideoDownload(req: Request, res: Response): Promise<void> {
    const { videoId } = req.params;
    
    // Return mock video data
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${videoId}.mp4"`
    });
    
    // Send mock video data
    const mockVideoData = Buffer.alloc(1024 * 1024, 0); // 1MB of zeros
    res.send(mockVideoData);
  }
  
  private async handleImageGeneration(req: Request, res: Response): Promise<void> {
    const imageId = 'image-' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      success: true,
      data: {
        imageId,
        imageUrl: `/v1/images/${imageId}`,
        thumbnailUrl: `/v1/images/${imageId}?size=thumbnail`,
        format: req.body.format || 'png',
        dimensions: req.body.dimensions || { width: 1024, height: 1024 }
      },
      metadata: {
        processingTime: this.randomLatency()
      }
    });
  }
  
  private async handleImageDownload(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;
    const { size } = req.query;
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${imageId}.png"`
    });
    
    // Send mock image data (PNG header + data)
    const imageSize = size === 'thumbnail' ? 1024 : 10240;
    const mockImageData = Buffer.alloc(imageSize, 0x89); // PNG signature start
    res.send(mockImageData);
  }
  
  private async handleSpeechSynthesis(req: Request, res: Response): Promise<void> {
    const { text, voice, language = 'en-US' } = req.body;
    const audioId = 'audio-' + Math.random().toString(36).substr(2, 9);
    
    // Estimate duration based on text length (roughly 150 words per minute)
    const wordCount = text.split(' ').length;
    const estimatedDuration = (wordCount / 150) * 60 * 1000; // in milliseconds
    
    res.json({
      success: true,
      data: {
        audioId,
        audioContent: this.generateMockAudioData(),
        format: 'wav',
        sampleRate: 44100,
        channels: 1,
        duration: estimatedDuration
      },
      metadata: {
        processingTime: Math.max(500, wordCount * 10) // 10ms per word minimum
      }
    });
  }
  
  private async handleListVoices(req: Request, res: Response): Promise<void> {
    const voices = [
      { name: 'professional', gender: 'neutral', language: 'en-US' },
      { name: 'conversational', gender: 'female', language: 'en-US' },
      { name: 'narrator', gender: 'male', language: 'en-US' }
    ];
    
    res.json({ voices });
  }
  
  private async handleMusicGeneration(req: Request, res: Response): Promise<void> {
    const musicId = 'music-' + Math.random().toString(36).substr(2, 9);
    const { duration = 30000, style = 'corporate' } = req.body;
    
    const processingTime = Math.max(3000, duration * 0.3);
    
    setTimeout(() => {
      this.emit('musicReady', { musicId, url: `/v1/music/${musicId}/download` });
    }, processingTime);
    
    res.json({
      success: true,
      data: {
        musicId,
        status: 'processing',
        style,
        duration,
        statusUrl: `/v1/music/${musicId}/status`
      },
      metadata: {
        processingTime
      }
    });
  }
  
  private async handleMusicStatus(req: Request, res: Response): Promise<void> {
    const { musicId } = req.params;
    const isReady = Math.random() > 0.4;
    
    res.json({
      musicId,
      status: isReady ? 'completed' : 'processing',
      progress: isReady ? 100 : Math.floor(Math.random() * 80) + 20,
      downloadUrl: isReady ? `/v1/music/${musicId}/download` : null
    });
  }
  
  private async handleMetrics(req: Request, res: Response): Promise<void> {
    const metrics = {
      requests: {
        total: Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0),
        byEndpoint: Object.fromEntries(this.requestCounts)
      },
      rateLimits: {
        active: this.rateLimitCounters.size,
        details: Object.fromEntries(
          Array.from(this.rateLimitCounters.entries()).map(([key, data]) => [
            key,
            { count: data.count, resetTime: new Date(data.resetTime).toISOString() }
          ])
        )
      },
      health: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(metrics);
  }
  
  // Helper methods
  
  private randomLatency(): number {
    return this.config.latency.min + 
           Math.random() * (this.config.latency.max - this.config.latency.min);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private getRateLimit(path: string): number | undefined {
    for (const [pattern, limit] of Object.entries(this.config.rateLimits)) {
      if (path.includes(pattern)) {
        return limit;
      }
    }
    return undefined;
  }
  
  private checkRateLimit(key: string, limit: number): boolean {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute
    
    let counter = this.rateLimitCounters.get(key);
    if (!counter || now > counter.resetTime) {
      counter = { count: 0, resetTime: now + windowSize };
      this.rateLimitCounters.set(key, counter);
    }
    
    if (counter.count >= limit) {
      return false;
    }
    
    counter.count++;
    this.incrementRequestCount(key);
    return true;
  }
  
  private getRateLimitResetTime(key: string): number {
    const counter = this.rateLimitCounters.get(key);
    return counter ? Math.ceil((counter.resetTime - Date.now()) / 1000) : 0;
  }
  
  private incrementRequestCount(endpoint: string): void {
    const current = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, current + 1);
  }
  
  private generateMockContent(model: string, instance: any): any {
    if (model.includes('gemini')) {
      return {
        parts: [{
          text: faker.lorem.paragraphs(2, '\n\n')
        }]
      };
    }
    
    return { text: faker.lorem.sentence() };
  }
  
  private generateSafetyRatings(): any[] {
    return [
      { category: 'HARM_CATEGORY_HATE_SPEECH', probability: 'NEGLIGIBLE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', probability: 'NEGLIGIBLE' },
      { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', probability: 'NEGLIGIBLE' }
    ];
  }
  
  private generateStreamingChunks(model: string, contents: any[]): any[] {
    const chunks = [];
    const totalText = faker.lorem.paragraphs(5);
    const words = totalText.split(' ');
    
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ');
      chunks.push({
        candidates: [{
          content: {
            parts: [{ text: chunk + (i + 3 >= words.length ? '' : ' ') }]
          },
          finishReason: i + 3 >= words.length ? 'STOP' : null
        }]
      });
    }
    
    return chunks;
  }
  
  private generateMockChunkData(type: string): any {
    switch (type) {
      case 'video':
        return {
          frame: Buffer.alloc(1024, Math.floor(Math.random() * 256)),
          timestamp: Date.now(),
          quality: 'medium'
        };
        
      case 'audio':
        return {
          samples: Buffer.alloc(512, Math.floor(Math.random() * 256)),
          timestamp: Date.now(),
          sampleRate: 44100
        };
        
      default:
        return {
          data: faker.lorem.words(10),
          timestamp: Date.now()
        };
    }
  }
  
  private generateMockAudioData(): string {
    // Generate mock base64 audio data (WAV header + silence)
    const headerSize = 44;
    const audioSize = 1024;
    const buffer = Buffer.alloc(headerSize + audioSize);
    
    // Simple WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(audioSize + 36, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(44100, 24); // Sample rate
    buffer.writeUInt32LE(88200, 28); // Byte rate
    buffer.writeUInt16LE(2, 32); // Block align
    buffer.writeUInt16LE(16, 34); // Bits per sample
    buffer.write('data', 36);
    buffer.writeUInt32LE(audioSize, 40);
    
    return buffer.toString('base64');
  }
}

export default MockGoogleCloudProvider;

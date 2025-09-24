/**
 * Chirp Adapter - Google Cloud Text-to-Speech Integration
 *
 * Real implementation using Google Cloud Text-to-Speech API for audio generation
 * and Speech-to-Text API for audio transcription capabilities
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
import { PerformanceMonitor } from "../../core/performance-monitor.js";
import { CacheManager } from "../../core/cache-manager.js";
import { VertexAIConnector } from "../../core/vertex-ai-connector.js";
import {
  AudioGenerationRequest,
  AudioGenerationResponse,
  GeneratedAudio,
  VoiceConfig,
  AudioQuality,
  AudioMetadata,
} from "../../types/multimedia.js";

import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { SpeechClient } from "@google-cloud/speech";

export interface ChirpAdapterConfig {
  projectId: string;
  location: string;
  apiEndpoint?: string;
  credentials?: any;
  serviceAccountPath?: string;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  enableCaching?: boolean;
  cacheTtl?: number;
  enableStreaming?: boolean;
  enableRealTime?: boolean;
}

export interface AudioStreamChunk {
  audioData: Buffer;
  format: string;
  sampleRate: number;
  channels: number;
  text?: string;
  progress?: number;
  emotion?: string;
  confidence?: number;
  isLast: boolean;
  timestamp: number;
}

export interface ChirpAdapterMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  streamingRequests: number;
  realTimeRequests: number;
  transcriptionRequests: number;
  totalAudioGenerated: number; // seconds
  totalCost: number;
  avgLatency: number;
  cacheHits: number;
}

export class ChirpAdapter extends EventEmitter {
  private logger: Logger;
  private config: ChirpAdapterConfig;
  private performance: PerformanceMonitor;
  private cache: CacheManager;
  private vertexConnector: VertexAIConnector;

  // Google Cloud clients
  private ttsClient: TextToSpeechClient | null = null;
  private speechClient: SpeechClient | null = null;

  // Processing state
  private isInitialized: boolean = false;
  private activeRequests: Map<string, { startTime: number; request: AudioGenerationRequest }> = new Map();

  // Metrics
  private metrics: ChirpAdapterMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    streamingRequests: 0,
    realTimeRequests: 0,
    transcriptionRequests: 0,
    totalAudioGenerated: 0,
    totalCost: 0,
    avgLatency: 0,
    cacheHits: 0,
  };

  constructor(config: ChirpAdapterConfig, vertexConnector: VertexAIConnector) {
    super();
    this.config = config;
    this.logger = new Logger("ChirpAdapter");
    this.performance = new PerformanceMonitor();
    this.vertexConnector = vertexConnector;

    // Initialize cache with audio-specific settings
    this.cache = new CacheManager({
      maxMemorySize: 25 * 1024 * 1024, // 25MB for audio metadata
      defaultTTL: config.cacheTtl || 3600, // 1 hour default
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.on("audio_generated", (data) => {
      this.logger.info("Audio generation completed", {
        requestId: data.requestId,
        duration: data.audio.duration,
        cost: data.metadata.cost,
      });
    });

    this.on("audio_failed", (data) => {
      this.logger.error("Audio generation failed", {
        requestId: data.requestId,
        error: data.error,
      });
    });

    this.on("transcription_completed", (data) => {
      this.logger.info("Audio transcription completed", {
        requestId: data.requestId,
        textLength: data.text.length,
        confidence: data.confidence,
      });
    });
  }

  /**
   * Initialize the adapter with Google Cloud clients
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing Chirp adapter...");

      // Initialize Google Cloud Text-to-Speech client
      const ttsClientOptions: any = {
        projectId: this.config.projectId,
      };

      if (this.config.credentials) {
        ttsClientOptions.credentials = this.config.credentials;
      } else if (this.config.serviceAccountPath) {
        ttsClientOptions.keyFilename = this.config.serviceAccountPath;
      }

      if (this.config.apiEndpoint) {
        ttsClientOptions.apiEndpoint = this.config.apiEndpoint;
      }

      this.ttsClient = new TextToSpeechClient(ttsClientOptions);

      // Initialize Google Cloud Speech-to-Text client
      const speechClientOptions: any = {
        projectId: this.config.projectId,
      };

      if (this.config.credentials) {
        speechClientOptions.credentials = this.config.credentials;
      } else if (this.config.serviceAccountPath) {
        speechClientOptions.keyFilename = this.config.serviceAccountPath;
      }

      if (this.config.apiEndpoint) {
        speechClientOptions.apiEndpoint = this.config.apiEndpoint;
      }

      this.speechClient = new SpeechClient(speechClientOptions);

      this.isInitialized = true;
      this.logger.info("Chirp adapter initialized successfully");
      this.emit("initialized");
    } catch (error) {
      this.logger.error("Failed to initialize Chirp adapter", error);
      throw error;
    }
  }

  /**
   * Generate audio using Google Cloud Text-to-Speech
   */
  async generateAudio(
    request: AudioGenerationRequest,
    signal?: AbortSignal,
  ): Promise<AudioGenerationResponse> {
    const startTime = performance.now();
    const requestId = request.context?.requestId || this.generateRequestId();

    this.metrics.totalRequests++;

    try {
      this.ensureInitialized();

      this.logger.info("Starting audio generation", {
        requestId,
        text: request.text.substring(0, 100) + "...",
        voice: request.voice?.preset || "default",
      });

      // Check cache first if caching is enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(request);
        const cachedResult = await this.cache.get(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          this.updateMetrics(performance.now() - startTime, cachedResult.audio.duration, 0);
          this.emit("audio_generated", { requestId, audio: cachedResult.audio, metadata: cachedResult.metadata });
          return cachedResult;
        }
      }

      // Track active request
      this.activeRequests.set(requestId, { startTime, request });

      // Prepare the text-to-speech request
      const ttsRequest = this.prepareTTSRequest(request);

      // Generate audio with Google Cloud TTS
      const [response] = await this.ttsClient!.synthesizeSpeech(ttsRequest);

      if (!response.audioContent) {
        throw new Error("No audio content received from Text-to-Speech API");
      }

      // Convert audio content to buffer
      const audioBuffer = Buffer.from(response.audioContent);

      // Create audio metadata
      const audioMetadata: AudioMetadata = {
        duration: this.estimateAudioDuration(request.text, request.voice),
        format: this.getAudioFormat(request),
        size: audioBuffer.length,
        sampleRate: 24000, // Google Cloud TTS standard sample rate
        channels: 1,
        bitrate: 64000,
        codec: "LINEAR16",
        quality: this.calculateAudioQuality(request),
        language: request.voice?.language || "en-US",
        timestamp: Date.now(),
      };

      // Create generated audio object
      const generatedAudio: GeneratedAudio = {
        id: this.generateAudioId(),
        data: audioBuffer,
        format: audioMetadata.format,
        sampleRate: audioMetadata.sampleRate,
        channels: audioMetadata.channels,
        duration: audioMetadata.duration,
        size: audioMetadata.size,
        quality: audioMetadata.quality,
        metadata: audioMetadata,
      };

      // Calculate cost (Google Cloud TTS pricing)
      const cost = this.calculateCost(request.text.length, request.voice);

      // Create response
      const audioResponse: AudioGenerationResponse = {
        requestId,
        audio: generatedAudio,
        metadata: {
          cost,
          provider: "google-cloud-tts",
          model: this.getTTSModelName(request.voice),
          tokens: request.text.length,
          processingTime: performance.now() - startTime,
          timestamp: Date.now(),
        },
        context: request.context,
      };

      // Cache the result if caching is enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(request);
        await this.cache.set(cacheKey, audioResponse, this.config.cacheTtl);
      }

      // Update metrics
      this.updateMetrics(performance.now() - startTime, generatedAudio.duration, cost);

      this.logger.info("Audio generation completed", {
        requestId,
        duration: generatedAudio.duration,
        size: generatedAudio.size,
        cost,
      });

      this.emit("audio_generated", { requestId, audio: generatedAudio, metadata: audioResponse.metadata });

      return audioResponse;
    } catch (error) {
      this.metrics.failedRequests++;

      const latency = performance.now() - startTime;
      this.logger.error("Audio generation failed", {
        requestId,
        latency,
        error: error.message,
      });

      this.emit("audio_failed", { requestId, error: error.message });

      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Generate audio with streaming support
   */
  async *generateAudioStream(
    request: AudioGenerationRequest,
  ): AsyncIterableIterator<AudioStreamChunk> {
    const requestId = request.context?.requestId || this.generateRequestId();
    this.metrics.streamingRequests++;

    try {
      this.ensureInitialized();

      this.logger.info("Starting audio streaming", {
        requestId,
        text: request.text.substring(0, 100) + "...",
        streaming: request.streaming,
      });

      // For now, generate the full audio and stream it in chunks
      // TODO: Implement real streaming with Google Cloud TTS streaming API
      const response = await this.generateAudio(request);

      const chunkSize = request.streaming?.chunkSize || 4096;
      const audioData = response.audio.data;

      let offset = 0;
      let sequenceNumber = 0;
      const totalChunks = Math.ceil(audioData.length / chunkSize);

      while (offset < audioData.length) {
        const chunk = audioData.subarray(offset, offset + chunkSize);
        const isLast = offset + chunkSize >= audioData.length;

        const streamChunk: AudioStreamChunk = {
          audioData: chunk,
          format: response.audio.format,
          sampleRate: response.audio.sampleRate,
          channels: response.audio.channels,
          text: isLast ? request.text : undefined,
          progress: (offset / audioData.length) * 100,
          emotion: "neutral",
          confidence: 0.95,
          isLast,
          timestamp: Date.now(),
        };

        yield streamChunk;

        offset += chunkSize;
        sequenceNumber++;

        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      this.logger.info("Audio streaming completed", {
        requestId,
        chunks: sequenceNumber,
      });
    } catch (error) {
      this.logger.error("Audio streaming failed", {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Transcribe audio using Google Cloud Speech-to-Text
   */
  async transcribeAudio(
    audioData: Buffer,
    config?: {
      language?: string;
      enableWordTimeOffsets?: boolean;
      enableAutomaticPunctuation?: boolean;
      model?: string;
    },
  ): Promise<{
    text: string;
    confidence: number;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
  }> {
    const requestId = this.generateRequestId();
    this.metrics.transcriptionRequests++;

    try {
      this.ensureInitialized();

      this.logger.info("Starting audio transcription", {
        requestId,
        audioSize: audioData.length,
      });

      const startTime = performance.now();

      // Prepare the recognition request
      const recognitionRequest = {
        audio: {
          content: audioData.toString("base64"),
        },
        config: {
          encoding: "LINEAR16" as const,
          sampleRateHertz: 24000,
          languageCode: config?.language || "en-US",
          enableAutomaticPunctuation: config?.enableAutomaticPunctuation ?? true,
          enableWordTimeOffsets: config?.enableWordTimeOffsets ?? false,
          model: config?.model || "latest_long",
        },
      };

      // Perform speech recognition
      const [response] = await this.speechClient!.recognize(recognitionRequest);

      if (!response.results || response.results.length === 0) {
        throw new Error("No transcription results received");
      }

      const result = response.results[0];
      const transcript = result.alternatives?.[0];

      if (!transcript) {
        throw new Error("No transcription alternative received");
      }

      const transcriptionResult = {
        text: transcript.transcript || "",
        confidence: transcript.confidence || 0,
        words: result.alternatives?.[0]?.words?.map((word) => ({
          word: word.word || "",
          startTime: word.startTime?.seconds?.toNumber() || 0,
          endTime: word.endTime?.seconds?.toNumber() || 0,
          confidence: word.confidence || 0,
        })),
      };

      const latency = performance.now() - startTime;
      this.performance.recordMetric("audio_transcription_latency", latency);

      this.logger.info("Audio transcription completed", {
        requestId,
        textLength: transcriptionResult.text.length,
        confidence: transcriptionResult.confidence,
        latency,
      });

      this.emit("transcription_completed", {
        requestId,
        text: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        latency,
      });

      return transcriptionResult;
    } catch (error) {
      this.logger.error("Audio transcription failed", {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Prepare Text-to-Speech request for Google Cloud
   */
  private prepareTTSRequest(request: AudioGenerationRequest): any {
    const voiceConfig = request.voice || {};

    const ttsRequest: any = {
      input: { text: request.text },
      voice: {
        languageCode: voiceConfig.language || "en-US",
        name: this.getTTSVoiceName(voiceConfig),
        ssmlGender: this.getTTSGender(voiceConfig),
      },
      audioConfig: {
        audioEncoding: this.getTTSAudioEncoding(request),
        speakingRate: voiceConfig.speaking_rate || 1.0,
        pitch: voiceConfig.pitch || 0,
      },
    };

    // Add effects profile if specified
    if (voiceConfig.effects_profile) {
      ttsRequest.audioConfig.effectsProfileId = [voiceConfig.effects_profile];
    }

    return ttsRequest;
  }

  /**
   * Get the appropriate TTS voice name based on configuration
   */
  private getTTSVoiceName(voiceConfig: VoiceConfig): string {
    // Map common voice presets to Google Cloud TTS voices
    const voiceMap: Record<string, string> = {
      narrator_professional: "en-US-Neural2-D",
      narrator_casual: "en-US-Neural2-C",
      female_young: "en-US-Neural2-F",
      male_young: "en-US-Neural2-E",
      female_adult: "en-US-Neural2-F",
      male_adult: "en-US-Neural2-D",
      default: "en-US-Neural2-D",
    };

    if (voiceConfig.preset && voiceMap[voiceConfig.preset]) {
      return voiceMap[voiceConfig.preset];
    }

    if (voiceConfig.customVoice?.voiceId) {
      return voiceConfig.customVoice.voiceId;
    }

    return voiceMap.default;
  }

  /**
   * Get the appropriate TTS gender
   */
  private getTTSGender(voiceConfig: VoiceConfig): string {
    if (voiceConfig.gender === "male") return "MALE";
    if (voiceConfig.gender === "female") return "FEMALE";
    return "NEUTRAL";
  }

  /**
   * Get the appropriate audio encoding
   */
  private getTTSAudioEncoding(request: AudioGenerationRequest): string {
    const formatMap: Record<string, string> = {
      mp3: "MP3",
      wav: "LINEAR16",
      ogg: "OGG_OPUS",
      pcm: "LINEAR16",
    };

    const format = request.audioSettings?.format || "mp3";
    return formatMap[format] || "MP3";
  }

  /**
   * Get the TTS model name for metadata
   */
  private getTTSModelName(voiceConfig?: VoiceConfig): string {
    return voiceConfig?.model || "neural2";
  }

  /**
   * Estimate audio duration based on text and voice settings
   */
  private estimateAudioDuration(text: string, voice?: VoiceConfig): number {
    // Rough estimation: ~150 words per minute for normal speech rate
    const wordsPerMinute = 150;
    const speakingRate = voice?.speaking_rate || 1.0;
    const words = text.split(/\s+/).length;
    const durationSeconds = (words / wordsPerMinute) * 60 / speakingRate;
    return Math.max(durationSeconds, 0.1); // Minimum 0.1 seconds
  }

  /**
   * Calculate audio quality based on request parameters
   */
  private calculateAudioQuality(request: AudioGenerationRequest): AudioQuality {
    const quality: AudioQuality = {
      snr: 20, // Signal-to-noise ratio
      thd: 0.1, // Total harmonic distortion
      bitrate: 64000,
      loudness: -16, // LUFS
    };

    // Enhance quality for enterprise users
    if (request.context?.userTier === "enterprise") {
      quality.snr = 30;
      quality.thd = 0.05;
      quality.bitrate = 128000;
    }

    // Adjust based on voice settings
    if (request.voice?.quality === "high") {
      quality.snr = 35;
      quality.thd = 0.03;
    }

    return quality;
  }

  /**
   * Get audio format based on request
   */
  private getAudioFormat(request: AudioGenerationRequest): string {
    return request.audioSettings?.format || "mp3";
  }

  /**
   * Calculate cost for Google Cloud TTS
   */
  private calculateCost(characterCount: number, voice?: VoiceConfig): number {
    // Google Cloud TTS pricing (as of 2024)
    // Standard voices: $0.000004 per character
    // Neural2 voices: $0.000016 per character
    const isNeural2 = this.getTTSModelName(voice) === "neural2";
    const costPerCharacter = isNeural2 ? 0.000016 : 0.000004;

    return characterCount * costPerCharacter;
  }

  /**
   * Update metrics
   */
  private updateMetrics(latency: number, duration: number, cost: number): void {
    this.metrics.successfulRequests++;
    this.metrics.totalAudioGenerated += duration;
    this.metrics.totalCost += cost;
    this.metrics.avgLatency =
      (this.metrics.avgLatency * (this.metrics.totalRequests - 1) + latency) /
      this.metrics.totalRequests;

    this.performance.recordMetric("audio_generation_latency", latency);
    this.performance.recordMetric("audio_generation_cost", cost);
    this.performance.recordMetric("audio_duration_generated", duration);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AudioGenerationRequest): string {
    const keyData = {
      text: request.text,
      voice: request.voice,
      audioSettings: request.audioSettings,
      effects: request.effects,
    };
    return `audio_${Buffer.from(JSON.stringify(keyData)).toString("base64")}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `chirp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique audio ID
   */
  private generateAudioId(): string {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure adapter is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("Chirp adapter not initialized");
    }
  }

  /**
   * Get adapter metrics
   */
  getMetrics(): ChirpAdapterMetrics {
    return {
      ...this.metrics,
      activeRequests: this.activeRequests.size,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    latency: number;
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      // Simple test synthesis
      const testRequest = {
        input: { text: "Health check" },
        voice: { languageCode: "en-US", name: "en-US-Neural2-D" },
        audioConfig: { audioEncoding: "LINEAR16" as const },
      };

      await this.ttsClient!.synthesizeSpeech(testRequest);
      const latency = performance.now() - startTime;

      return {
        status: "healthy",
        latency,
      };
    } catch (error) {
      const latency = performance.now() - startTime;

      return {
        status: "unhealthy",
        latency,
        error: error.message,
      };
    }
  }

  /**
   * Shutdown the adapter
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down Chirp adapter...");

    // Cancel active requests
    this.activeRequests.clear();

    // Close clients
    if (this.ttsClient) {
      await this.ttsClient.close();
    }

    if (this.speechClient) {
      await this.speechClient.close();
    }

    this.isInitialized = false;
    this.logger.info("Chirp adapter shutdown complete");
  }
}
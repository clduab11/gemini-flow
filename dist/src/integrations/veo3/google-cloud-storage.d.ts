/**
 * Google Cloud Storage Integration for Veo3
 *
 * Advanced cloud storage with large file handling, CDN distribution,
 * compression, encryption, and intelligent upload optimization
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { Veo3StorageConfig, VideoFile } from "./types.js";
import { BaseIntegration, HealthStatus, FileMetadata } from "../shared/types.js";
export interface GcsConfig extends Veo3StorageConfig {
    projectId: string;
    keyFilename?: string;
    credentials?: any;
    multipart: MultipartConfig;
    resumable: ResumableConfig;
    lifecycle: LifecycleConfig;
}
export interface MultipartConfig {
    enabled: boolean;
    chunkSize: number;
    maxParallel: number;
    minFileSize: number;
}
export interface ResumableConfig {
    enabled: boolean;
    chunkSize: number;
    retryDelayMs: number;
    maxRetries: number;
}
export interface LifecycleConfig {
    enabled: boolean;
    archiveAfterDays: number;
    deleteAfterDays: number;
    transitionToIA: number;
    transitionToColdline: number;
}
export interface UploadOptions {
    resumable?: boolean;
    multipart?: boolean;
    encryption?: boolean;
    compression?: boolean;
    metadata?: Record<string, string>;
    acl?: "private" | "public-read" | "authenticated-read";
    storageClass?: "STANDARD" | "NEARLINE" | "COLDLINE" | "ARCHIVE";
}
export interface DownloadOptions {
    range?: {
        start: number;
        end: number;
    };
    decrypt?: boolean;
    decompress?: boolean;
    stream?: boolean;
    timeout?: number;
}
export interface StorageMetrics {
    totalUploads: number;
    totalDownloads: number;
    totalSize: number;
    avgUploadTime: number;
    avgDownloadTime: number;
    compressionRatio: number;
    cdnHitRate: number;
    errorRate: number;
}
export interface BandwidthManager {
    maxBandwidth: number;
    currentUsage: number;
    queuedOperations: number;
    throttleEnabled: boolean;
}
export declare class GoogleCloudStorage extends BaseIntegration {
    private config;
    private storage;
    private bucket;
    private cdn;
    private compressor;
    private encryptor;
    private bandwidth;
    private activeUploads;
    private activeDownloads;
    private operationQueue;
    private storageMetrics;
    constructor(config: GcsConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    uploadFile(file: Buffer | string, destination: string, options?: UploadOptions): Promise<VideoFile>;
    uploadChunked(chunks: Buffer[], destination: string, options?: UploadOptions): Promise<VideoFile>;
    downloadFile(source: string, options?: DownloadOptions): Promise<Buffer>;
    deleteFile(path: string): Promise<void>;
    listFiles(prefix?: string): Promise<FileMetadata[]>;
    getFileUrl(path: string, expiration?: Date): Promise<string>;
    private configureBucketLifecycle;
    private startBandwidthMonitoring;
    private checkBandwidthAvailability;
    private processOperationQueue;
    private shouldUseResumable;
    private shouldUseMultipart;
    private uploadResumable;
    private uploadMultipart;
    private uploadSimple;
    private uploadChunk;
    private combineChunks;
    private downloadStream;
    private downloadRange;
    private downloadSimple;
    private executeWithConcurrency;
    private detectFormat;
}
//# sourceMappingURL=google-cloud-storage.d.ts.map
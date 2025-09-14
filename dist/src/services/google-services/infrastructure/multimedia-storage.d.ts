/**
 * Multimedia Storage Manager Infrastructure
 *
 * Advanced multimedia storage system with multi-cloud support,
 * intelligent caching, and content optimization.
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MultimediaStorageConfig, ServiceResponse, PerformanceMetrics } from "../interfaces.js";
export interface StorageProvider {
    name: string;
    type: "local" | "cloud" | "hybrid";
    endpoint: string;
    credentials: ProviderCredentials;
    features: ProviderFeatures;
    limits: ProviderLimits;
}
export interface ProviderCredentials {
    accessKey?: string;
    secretKey?: string;
    token?: string;
    region?: string;
    project?: string;
}
export interface ProviderFeatures {
    encryption: boolean;
    versioning: boolean;
    lifecycle: boolean;
    caching: boolean;
    streaming: boolean;
    transcoding: boolean;
}
export interface ProviderLimits {
    maxFileSize: number;
    maxBandwidth: number;
    maxRequests: number;
    storageQuota: number;
}
export interface MultimediaFile {
    id: string;
    name: string;
    type: "image" | "video" | "audio" | "document" | "other";
    format: string;
    size: number;
    checksum: string;
    metadata: FileMetadata;
    storage: StorageLocation[];
    status: "uploading" | "stored" | "processing" | "error";
}
export interface FileMetadata {
    created: Date;
    modified: Date;
    accessed: Date;
    contentType: string;
    encoding?: string;
    duration?: number;
    dimensions?: Dimensions;
    quality?: QualityInfo;
    tags: string[];
    description?: string;
}
export interface Dimensions {
    width: number;
    height: number;
    depth?: number;
}
export interface QualityInfo {
    bitrate?: number;
    sampleRate?: number;
    colorDepth?: number;
    compression?: string;
}
export interface StorageLocation {
    provider: string;
    bucket: string;
    key: string;
    region: string;
    url: string;
    replicated: boolean;
}
export interface UploadRequest {
    file: File | Buffer | ReadableStream;
    name: string;
    type: string;
    metadata?: Partial<FileMetadata>;
    options?: UploadOptions;
}
export interface UploadOptions {
    providers?: string[];
    encryption?: boolean;
    compression?: boolean;
    transcoding?: TranscodingOptions;
    caching?: CachingOptions;
    validation?: ValidationOptions;
}
export interface TranscodingOptions {
    enabled: boolean;
    formats: TranscodingFormat[];
    quality: TranscodingQuality[];
    optimization: TranscodingOptimization;
}
export interface TranscodingFormat {
    format: string;
    container: string;
    codec: string;
    preset: string;
}
export interface TranscodingQuality {
    name: string;
    bitrate: number;
    resolution?: Dimensions;
    framerate?: number;
}
export interface TranscodingOptimization {
    adaptive: boolean;
    multipass: boolean;
    hardware: boolean;
    efficiency: "speed" | "quality" | "size";
}
export interface CachingOptions {
    enabled: boolean;
    ttl: number;
    regions: string[];
    strategy: "push" | "pull" | "hybrid";
}
export interface ValidationOptions {
    checksum: boolean;
    virus: boolean;
    content: boolean;
    metadata: boolean;
}
export interface DownloadRequest {
    fileId: string;
    format?: string;
    quality?: string;
    region?: string;
    options?: DownloadOptions;
}
export interface DownloadOptions {
    range?: ByteRange;
    streaming?: boolean;
    cache?: boolean;
    transformation?: TransformationOptions;
}
export interface ByteRange {
    start: number;
    end: number;
}
export interface TransformationOptions {
    resize?: ResizeOptions;
    crop?: CropOptions;
    rotate?: number;
    filter?: FilterOptions;
}
export interface ResizeOptions {
    width: number;
    height: number;
    mode: "fit" | "fill" | "stretch" | "crop";
    quality: number;
}
export interface CropOptions {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface FilterOptions {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    sharpen?: number;
}
export interface StorageStats {
    totalFiles: number;
    totalSize: number;
    byType: TypeStats[];
    byProvider: ProviderStats[];
    byRegion: RegionStats[];
    bandwidth: BandwidthStats;
}
export interface TypeStats {
    type: string;
    files: number;
    size: number;
    percentage: number;
}
export interface ProviderStats {
    provider: string;
    files: number;
    size: number;
    cost: number;
    performance: ProviderPerformance;
}
export interface ProviderPerformance {
    uploadSpeed: number;
    downloadSpeed: number;
    availability: number;
    latency: number;
}
export interface RegionStats {
    region: string;
    files: number;
    size: number;
    providers: string[];
}
export interface BandwidthStats {
    upload: BandwidthUsage;
    download: BandwidthUsage;
    total: BandwidthUsage;
}
export interface BandwidthUsage {
    current: number;
    peak: number;
    average: number;
    limit: number;
}
export declare class MultimediaStorageManager extends EventEmitter {
    private logger;
    private config;
    private providers;
    private files;
    private uploadManager;
    private downloadManager;
    private replicationManager;
    private lifecycleManager;
    private performanceMonitor;
    private securityManager;
    constructor(config: MultimediaStorageConfig);
    /**
     * Initializes the storage manager
     */
    initialize(): Promise<void>;
    /**
     * Uploads a multimedia file
     */
    uploadFile(request: UploadRequest): Promise<ServiceResponse<MultimediaFile>>;
    /**
     * Downloads a multimedia file
     */
    downloadFile(request: DownloadRequest): Promise<ServiceResponse<ReadableStream>>;
    /**
     * Gets file metadata
     */
    getFile(fileId: string): Promise<ServiceResponse<MultimediaFile>>;
    /**
     * Lists files with filtering and pagination
     */
    listFiles(filters?: FileFilters, pagination?: Pagination): Promise<ServiceResponse<FileListResult>>;
    /**
     * Deletes a file
     */
    deleteFile(fileId: string): Promise<ServiceResponse<void>>;
    /**
     * Gets storage statistics
     */
    getStats(): Promise<ServiceResponse<StorageStats>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    private initializeComponents;
    private setupEventHandlers;
    private initializeProviders;
    private validateUploadRequest;
    private createFileRecord;
    private getOptimalLocation;
    private deleteFromLocation;
    private calculateStats;
    private calculateTypeStats;
    private calculateProviderStats;
    private calculateRegionStats;
    private applyFilters;
    private applyPagination;
    private getFileSize;
    private getMaxFileSize;
    private isAllowedFileType;
    private determineFileType;
    private extractFormat;
    private calculateChecksum;
    private getProviderType;
    private getProviderEndpoint;
    private getProviderCredentials;
    private getProviderFeatures;
    private getProviderLimits;
    private calculateProviderCost;
    private generateFileId;
    private generateRequestId;
    private createErrorResponse;
    private handleUploadProgress;
    private handleDownloadProgress;
    private handleReplicationCompleted;
    private handleLifecycleApplied;
}
interface FileFilters {
    type?: string;
    format?: string;
    minSize?: number;
    maxSize?: number;
    tags?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
}
interface Pagination {
    page: number;
    limit: number;
}
interface FileListResult {
    files: MultimediaFile[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export {};
//# sourceMappingURL=multimedia-storage.d.ts.map
/**
 * A2A Multimedia Protocol Extensions
 * Supporting classes and implementations for the main protocol
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AMultimediaSession, QoSRequirements, MessageStatistics, BandwidthStatistics, LatencyStatistics, QualityStatistics, ErrorStatistics } from "./a2a-multimedia-protocol.js";
export declare class RoutingEngine extends EventEmitter {
    private logger;
    private routingTable;
    private networkTopology;
    private routeCache;
    constructor();
    initialize(): Promise<void>;
    findOptimalRoute(sourceId: string, targetId: string, qos: QoSRequirements): Promise<OptimalRoute | null>;
    private calculateOptimalRoute;
    private scorePath;
    private isRouteCacheValid;
    private startRouteOptimization;
    private optimizeRoutes;
    private startTopologyMonitoring;
    private monitorTopology;
}
export declare class MediaStreamBuffer {
    private streamId;
    private config;
    private buffer;
    private maxBufferSize;
    private logger;
    constructor(streamId: string, config: any);
    addData(data: Buffer): void;
    getData(): Buffer | null;
    getBufferStats(): {
        size: number;
        chunks: number;
        utilization: number;
    };
}
export declare class StreamMonitor extends EventEmitter {
    private streamId;
    private targets;
    private logger;
    private active;
    private metrics;
    constructor(streamId: string, targets: string[]);
    start(): void;
    stop(): void;
    private startMonitoring;
    private collectMetrics;
    private analyzeMetrics;
    private initializeMetrics;
}
export declare class SessionPersistenceManager {
    private logger;
    private persistedSessions;
    private storageBackend;
    constructor(storageConfig?: any);
    initialize(): Promise<void>;
    persistSession(session: A2AMultimediaSession): Promise<void>;
    restoreSession(sessionId: string): Promise<A2AMultimediaSession | null>;
    deleteSession(sessionId: string): Promise<void>;
    listPersistedSessions(): Promise<string[]>;
    private loadPersistedSessions;
}
export declare class ProtocolStatisticsCalculator {
    private logger;
    constructor();
    calculateMessageStatistics(sessionId: string): Promise<MessageStatistics>;
    calculateBandwidthStatistics(sessionId: string): Promise<BandwidthStatistics>;
    calculateLatencyStatistics(sessionId: string): Promise<LatencyStatistics>;
    calculateQualityStatistics(sessionId: string): Promise<QualityStatistics>;
    calculateErrorStatistics(sessionId: string): Promise<ErrorStatistics>;
}
interface OptimalRoute {
    path: string[];
    hops: number;
    score: number;
    estimatedLatency: number;
    estimatedBandwidth: number;
}
export {};
//# sourceMappingURL=a2a-multimedia-protocol-extensions.d.ts.map
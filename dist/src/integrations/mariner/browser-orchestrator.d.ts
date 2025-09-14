/**
 * Project Mariner Browser Orchestrator
 *
 * Advanced browser orchestration with multi-tab coordination, intelligent automation,
 * and SPARC architecture integration
 */
import { BrowserConfig, BrowserOrchestrator as IBrowserOrchestrator, BrowserTab, TabConfig, CrossTabAction, ActionResult, BrowserTask } from "./types.js";
import { BaseIntegration, HealthStatus } from "../shared/types.js";
export declare class BrowserOrchestrator extends BaseIntegration implements IBrowserOrchestrator {
    private browser;
    private tabs;
    private activeTabId;
    private tabPool;
    private coordinationQueue;
    private isProcessingQueue;
    private tabMetrics;
    private orchestratorMetrics;
    constructor(config: BrowserConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    createTab(config?: TabConfig): Promise<BrowserTab>;
    getTabs(): BrowserTab[];
    getActiveTab(): BrowserTab | null;
    closeTab(tabId: string): Promise<void>;
    coordinateAction(action: CrossTabAction): Promise<ActionResult>;
    distributeLoad(tasks: BrowserTask[]): Promise<Map<string, ActionResult>>;
    synchronizeState(): Promise<void>;
    optimizePerformance(): Promise<void>;
    private initializeTabPool;
    private startCoordinationProcessor;
    private processCoordinationQueue;
    private setupTabMetrics;
    private executeBarrierCoordination;
    private executeConsensusCoordination;
    private executeLeaderCoordination;
    private executeEventualCoordination;
    private distributeSequential;
    private distributeParallel;
    private distributeAdaptive;
    private getAvailableTab;
    private executeBrowserTask;
    private executeActionSteps;
    private executeActionStep;
    private isComplexTask;
    private waitForBarrier;
    private canTabExecuteAction;
    private mergeTabStates;
    private closeIdleTabs;
    private optimizeMemoryUsage;
    private optimizeTabPool;
    private cleanupResources;
    private calculateAverageTabLifetime;
}
//# sourceMappingURL=browser-orchestrator.d.ts.map
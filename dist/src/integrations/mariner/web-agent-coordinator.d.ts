/**
 * Web Agent Coordinator
 *
 * Intelligent coordination for cross-site navigation, workflow execution,
 * and adaptive browser automation patterns
 */
import { WebAgentCoordinator as IWebAgentCoordinator, SiteNavigation, NavigationResult, WebWorkflow, WorkflowResult, MultiSiteAction, MultiSiteResult, NavigationPattern, OptimizationResult, SiteStructure, BrowserConfig } from "./types.js";
import { BaseIntegration, HealthStatus } from "../shared/types.js";
import { BrowserOrchestrator } from "./browser-orchestrator.js";
export declare class WebAgentCoordinator extends BaseIntegration implements IWebAgentCoordinator {
    private orchestrator;
    private siteCache;
    private navigationPatterns;
    private workflowCache;
    private coordinatorMetrics;
    constructor(config: BrowserConfig, orchestrator: BrowserOrchestrator);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    navigateSite(navigation: SiteNavigation): Promise<NavigationResult>;
    executeWorkflow(workflow: WebWorkflow): Promise<WorkflowResult>;
    coordiateMultiSite(sites: string[], action: MultiSiteAction): Promise<MultiSiteResult>;
    optimizeNavigation(pattern: NavigationPattern): Promise<OptimizationResult>;
    learnSiteStructure(url: string): Promise<SiteStructure>;
    private executeDirectNavigation;
    private executeProgressiveNavigation;
    private executeIntelligentNavigation;
    private executeAdaptiveNavigation;
    private executeCheckpoint;
    private executeIntelligentCheckpoint;
    private navigateUsingStructure;
    private executeSequentialWorkflow;
    private executeParallelWorkflow;
    private executeHybridWorkflow;
    private executeWorkflowStep;
    private executeStepAction;
    private executeStepDecision;
    private executeStepLoop;
    private executeStepParallel;
    private executeStepSync;
    private executeParallelMultiSite;
    private executeSequentialMultiSite;
    private executeAdaptiveMultiSite;
    private analyzeSiteStructure;
    private loadCachedData;
    private saveCachedData;
}
//# sourceMappingURL=web-agent-coordinator.d.ts.map
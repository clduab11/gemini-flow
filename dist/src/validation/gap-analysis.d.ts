/**
 * @interface GapAnalysisConfig
 * @description Configuration for Gap Analysis and Remediation.
 */
export interface GapAnalysisConfig {
    claudeFlowFeatureSet: string[];
    performanceTargets: {
        [metric: string]: number;
    };
}
/**
 * @interface GapAnalysisOperations
 * @description Defines operations for identifying and remediating gaps in features and performance.
 */
export interface GapAnalysisOperations {
    analyzeFeatureParity(): Promise<any>;
    identifyPerformanceGaps(): Promise<any>;
    implementAutomatedRemediation(gapAnalysis: any): Promise<void>;
}
/**
 * @class GapAnalyzer
 * @description Identifies missing components, performance shortfalls, and implements automated remediation.
 */
export declare class GapAnalyzer implements GapAnalysisOperations {
    private config;
    private logger;
    constructor(config: GapAnalysisConfig);
    /**
     * Compares gemini-flow capabilities against gemini-flow feature set.
     * @returns {Promise<any>} Analysis results including missing features.
     */
    analyzeFeatureParity(): Promise<any>;
    /**
     * Benchmarks actual performance against targets and identifies bottlenecks.
     * @returns {Promise<any>} Performance gap analysis results.
     */
    identifyPerformanceGaps(): Promise<any>;
    /**
     * Implements automated remediation for identified gaps (conceptual).
     * @param {any} gapAnalysis Results from feature and performance gap analysis.
     * @returns {Promise<void>}
     */
    implementAutomatedRemediation(gapAnalysis: any): Promise<void>;
}
//# sourceMappingURL=gap-analysis.d.ts.map
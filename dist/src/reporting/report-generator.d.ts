/**
 * @interface ReportGeneratorConfig
 * @description Configuration for the Report Generator.
 */
export interface ReportGeneratorConfig {
    outputDir: string;
}
/**
 * @interface ReportGeneratorOperations
 * @description Defines operations for generating comprehensive system validation reports.
 */
export interface ReportGeneratorOperations {
    generateAllReports(): Promise<void>;
    generateSystemHealthReport(): Promise<string>;
    generateFeatureParityReport(): Promise<string>;
    generateProductionReadinessAssessment(): Promise<string>;
}
/**
 * @class ReportGenerator
 * @description Orchestrates the generation of comprehensive system validation reports.
 */
export declare class ReportGenerator implements ReportGeneratorOperations {
    private config;
    private logger;
    constructor(config: ReportGeneratorConfig);
    /**
     * Generates all comprehensive system validation reports.
     * @returns {Promise<void>}
     */
    generateAllReports(): Promise<void>;
    /**
     * Generates a System Health Report.
     * @returns {Promise<string>} The content of the system health report.
     */
    generateSystemHealthReport(): Promise<string>;
    /**
     * Generates a Feature Parity Report with claude-flow.
     * @returns {Promise<string>} The content of the feature parity report.
     */
    generateFeatureParityReport(): Promise<string>;
    /**
     * Generates a Production Readiness Assessment.
     * @returns {Promise<string>} The content of the production readiness assessment.
     */
    generateProductionReadinessAssessment(): Promise<string>;
}
//# sourceMappingURL=report-generator.d.ts.map
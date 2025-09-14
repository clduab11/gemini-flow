/**
 * CoScientist Research Engine with Hypothesis Testing
 *
 * Advanced AI-powered research platform with automated hypothesis generation,
 * experimental design, data analysis, and scientific validation.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { ResearchHypothesis, ResearchMethodology, ServiceResponse, PerformanceMetrics } from "./interfaces.js";
export interface CoScientistConfig {
    ai: AIResearchConfig;
    experimentation: ExperimentationConfig;
    analysis: AnalysisConfig;
    validation: ValidationConfig;
    knowledge: KnowledgeConfig;
}
export interface AIResearchConfig {
    model: string;
    capabilities: ResearchCapability[];
    reasoning: ReasoningConfig;
    learning: LearningConfig;
}
export interface ResearchCapability {
    domain: string;
    confidence: number;
    methods: string[];
    limitations: string[];
}
export interface ReasoningConfig {
    causalInference: boolean;
    statisticalReasoning: boolean;
    scientificMethod: boolean;
    hypothesisGeneration: boolean;
}
export interface LearningConfig {
    continuousLearning: boolean;
    knowledgeUpdate: boolean;
    experienceRetention: boolean;
    crossDomainTransfer: boolean;
}
export interface ExperimentationConfig {
    design: ExperimentDesignConfig;
    execution: ExecutionConfig;
    monitoring: MonitoringConfig;
    safety: SafetyConfig;
}
export interface ExperimentDesignConfig {
    powerAnalysis: boolean;
    randomization: RandomizationConfig;
    controls: ControlConfig;
    blinding: BlindingConfig;
}
export interface RandomizationConfig {
    method: "simple" | "block" | "stratified" | "cluster";
    seed?: number;
    constraints: string[];
}
export interface ControlConfig {
    enabled: boolean;
    types: string[];
    matching: boolean;
}
export interface BlindingConfig {
    enabled: boolean;
    level: "single" | "double" | "triple";
    methods: string[];
}
export interface ExecutionConfig {
    automation: AutomationConfig;
    dataCollection: DataCollectionConfig;
    qualityControl: QualityControlConfig;
}
export interface AutomationConfig {
    enabled: boolean;
    platforms: string[];
    protocols: string[];
    safeguards: string[];
}
export interface DataCollectionConfig {
    realTime: boolean;
    validation: boolean;
    anonymization: boolean;
    standardization: boolean;
}
export interface QualityControlConfig {
    checks: QualityCheck[];
    thresholds: QualityThreshold[];
    actions: QualityAction[];
}
export interface QualityCheck {
    name: string;
    type: "statistical" | "logical" | "domain_specific";
    parameters: any;
    frequency: string;
}
export interface QualityThreshold {
    metric: string;
    warning: number;
    critical: number;
    action: string;
}
export interface QualityAction {
    trigger: string;
    action: "alert" | "pause" | "abort" | "adjust";
    parameters: any;
}
export interface MonitoringConfig {
    realTime: boolean;
    metrics: string[];
    alerts: AlertConfig[];
    reporting: ReportingConfig;
}
export interface AlertConfig {
    condition: string;
    severity: "low" | "medium" | "high" | "critical";
    channels: string[];
    escalation: EscalationConfig;
}
export interface EscalationConfig {
    enabled: boolean;
    levels: EscalationLevel[];
}
export interface EscalationLevel {
    delay: number;
    recipients: string[];
    actions: string[];
}
export interface ReportingConfig {
    frequency: string;
    format: string[];
    distribution: string[];
    automation: boolean;
}
export interface SafetyConfig {
    enabled: boolean;
    protocols: SafetyProtocol[];
    monitoring: SafetyMonitoring;
    emergency: EmergencyConfig;
}
export interface SafetyProtocol {
    domain: string;
    rules: SafetyRule[];
    enforcement: "strict" | "advisory";
}
export interface SafetyRule {
    condition: string;
    action: string;
    severity: string;
}
export interface SafetyMonitoring {
    continuous: boolean;
    parameters: string[];
    thresholds: SafetyThreshold[];
}
export interface SafetyThreshold {
    parameter: string;
    limit: number;
    action: string;
}
export interface EmergencyConfig {
    stopConditions: string[];
    procedures: EmergencyProcedure[];
    contacts: EmergencyContact[];
}
export interface EmergencyProcedure {
    trigger: string;
    steps: string[];
    timeout: number;
}
export interface EmergencyContact {
    role: string;
    contact: string;
    priority: number;
}
export interface AnalysisConfig {
    statistical: StatisticalConfig;
    machine_learning: MLConfig;
    visualization: VisualizationConfig;
    interpretation: InterpretationConfig;
}
export interface StatisticalConfig {
    methods: string[];
    significance: number;
    power: number;
    corrections: string[];
}
export interface MLConfig {
    algorithms: string[];
    validation: ValidationMethodConfig;
    interpretation: MLInterpretationConfig;
}
export interface ValidationMethodConfig {
    crossValidation: CrossValidationConfig;
    holdout: HoldoutConfig;
    bootstrap: BootstrapConfig;
}
export interface CrossValidationConfig {
    folds: number;
    stratified: boolean;
    repeats: number;
}
export interface HoldoutConfig {
    trainRatio: number;
    validationRatio: number;
    testRatio: number;
}
export interface BootstrapConfig {
    samples: number;
    confidence: number;
}
export interface MLInterpretationConfig {
    featureImportance: boolean;
    shap: boolean;
    lime: boolean;
    partialDependence: boolean;
}
export interface VisualizationConfig {
    interactive: boolean;
    formats: string[];
    themes: string[];
    automation: boolean;
}
export interface InterpretationConfig {
    causalInference: boolean;
    effectSize: boolean;
    confidence: boolean;
    limitations: boolean;
}
export interface ValidationConfig {
    reproducibility: ReproducibilityConfig;
    peerReview: PeerReviewConfig;
    metaAnalysis: MetaAnalysisConfig;
}
export interface ReproducibilityConfig {
    required: boolean;
    standards: string[];
    documentation: DocumentationConfig;
    archival: ArchivalConfig;
}
export interface DocumentationConfig {
    protocol: boolean;
    data: boolean;
    code: boolean;
    environment: boolean;
}
export interface ArchivalConfig {
    repositories: string[];
    metadata: string[];
    access: string;
}
export interface PeerReviewConfig {
    enabled: boolean;
    reviewers: number;
    criteria: string[];
    blind: boolean;
}
export interface MetaAnalysisConfig {
    enabled: boolean;
    databases: string[];
    criteria: InclusionCriteria;
}
export interface InclusionCriteria {
    studyTypes: string[];
    populations: string[];
    interventions: string[];
    outcomes: string[];
}
export interface KnowledgeConfig {
    sources: KnowledgeSource[];
    integration: IntegrationConfig;
    updating: UpdatingConfig;
    reasoning: KnowledgeReasoningConfig;
}
export interface KnowledgeSource {
    type: "database" | "literature" | "expert" | "experiment";
    name: string;
    reliability: number;
    coverage: string[];
}
export interface IntegrationConfig {
    ontologies: string[];
    standards: string[];
    mapping: boolean;
    validation: boolean;
}
export interface UpdatingConfig {
    frequency: string;
    sources: string[];
    validation: boolean;
    versioning: boolean;
}
export interface KnowledgeReasoningConfig {
    inference: boolean;
    consistency: boolean;
    uncertainty: boolean;
    explanation: boolean;
}
export interface ResearchProject {
    id: string;
    title: string;
    domain: string;
    hypothesis: ResearchHypothesis;
    methodology: ResearchMethodology;
    status: "design" | "execution" | "analysis" | "validation" | "completed" | "failed";
    progress: number;
    startTime?: Date;
    endTime?: Date;
    results?: ResearchResults;
    publications?: Publication[];
    metadata: ProjectMetadata;
}
export interface ResearchResults {
    data: ExperimentalData;
    analysis: AnalysisResults;
    conclusions: Conclusion[];
    limitations: string[];
    futureWork: string[];
}
export interface ExperimentalData {
    raw: DataSet[];
    processed: DataSet[];
    quality: DataQuality;
    metadata: DataMetadata;
}
export interface DataSet {
    id: string;
    name: string;
    type: string;
    format: string;
    size: number;
    path: string;
    checksum: string;
}
export interface DataQuality {
    completeness: number;
    accuracy: number;
    consistency: number;
    validity: number;
    issues: QualityIssue[];
}
export interface QualityIssue {
    type: string;
    severity: string;
    description: string;
    location: string;
    resolution?: string;
}
export interface DataMetadata {
    collection: CollectionMetadata;
    processing: ProcessingMetadata;
    variables: VariableMetadata[];
}
export interface CollectionMetadata {
    startDate: Date;
    endDate: Date;
    method: string;
    instruments: string[];
    conditions: string[];
}
export interface ProcessingMetadata {
    steps: ProcessingStep[];
    software: SoftwareInfo[];
    parameters: ProcessingParameters;
}
export interface ProcessingStep {
    name: string;
    description: string;
    timestamp: Date;
    parameters: any;
}
export interface SoftwareInfo {
    name: string;
    version: string;
    configuration: any;
}
export interface ProcessingParameters {
    normalization: string;
    filtering: FilteringParams;
    transformation: TransformationParams;
}
export interface FilteringParams {
    method: string;
    parameters: any;
    applied: boolean;
}
export interface TransformationParams {
    method: string;
    parameters: any;
    applied: boolean;
}
export interface VariableMetadata {
    name: string;
    type: string;
    unit: string;
    range: [number, number];
    missing: number;
    distribution: DistributionInfo;
}
export interface DistributionInfo {
    type: string;
    parameters: any;
    statistics: DescriptiveStatistics;
}
export interface DescriptiveStatistics {
    mean: number;
    median: number;
    mode: number;
    standardDeviation: number;
    variance: number;
    skewness: number;
    kurtosis: number;
}
export interface AnalysisResults {
    statistical: StatisticalResults;
    ml: MLResults;
    causal: CausalResults;
    visualization: VisualizationResults;
}
export interface StatisticalResults {
    tests: StatisticalTest[];
    models: StatisticalModel[];
    summary: StatisticalSummary;
}
export interface StatisticalTest {
    name: string;
    statistic: number;
    pValue: number;
    confidence: ConfidenceInterval;
    significant: boolean;
    effectSize?: EffectSize;
}
export interface ConfidenceInterval {
    level: number;
    lower: number;
    upper: number;
}
export interface EffectSize {
    measure: string;
    value: number;
    interpretation: string;
}
export interface StatisticalModel {
    name: string;
    formula: string;
    coefficients: Coefficient[];
    fit: ModelFit;
    diagnostics: ModelDiagnostics;
}
export interface Coefficient {
    variable: string;
    estimate: number;
    standardError: number;
    tValue: number;
    pValue: number;
}
export interface ModelFit {
    rSquared: number;
    adjustedRSquared: number;
    aic: number;
    bic: number;
    logLikelihood: number;
}
export interface ModelDiagnostics {
    residuals: ResidualAnalysis;
    assumptions: AssumptionChecks;
    outliers: Outlier[];
}
export interface ResidualAnalysis {
    normality: NormalityTest;
    homoscedasticity: HomoscedasticityTest;
    autocorrelation: AutocorrelationTest;
}
export interface NormalityTest {
    test: string;
    statistic: number;
    pValue: number;
    normal: boolean;
}
export interface HomoscedasticityTest {
    test: string;
    statistic: number;
    pValue: number;
    homoscedastic: boolean;
}
export interface AutocorrelationTest {
    test: string;
    statistic: number;
    pValue: number;
    independent: boolean;
}
export interface AssumptionChecks {
    linearity: boolean;
    independence: boolean;
    normality: boolean;
    homoscedasticity: boolean;
}
export interface Outlier {
    index: number;
    value: number;
    leverage: number;
    residual: number;
    influence: number;
}
export interface StatisticalSummary {
    hypothesisSupported: boolean;
    confidence: number;
    powerAnalysis: PowerAnalysis;
    recommendations: string[];
}
export interface PowerAnalysis {
    observedPower: number;
    requiredSampleSize: number;
    effectSize: number;
    alpha: number;
}
export interface MLResults {
    models: MLModel[];
    performance: MLPerformance;
    interpretation: MLInterpretation;
}
export interface MLModel {
    name: string;
    algorithm: string;
    hyperparameters: any;
    training: TrainingResults;
    validation: ValidationResults;
}
export interface TrainingResults {
    duration: number;
    iterations: number;
    convergence: boolean;
    finalLoss: number;
}
export interface ValidationResults {
    metrics: PerformanceMetric[];
    confusionMatrix?: ConfusionMatrix;
    roc?: ROCCurve;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    confidence?: ConfidenceInterval;
}
export interface ConfusionMatrix {
    matrix: number[][];
    labels: string[];
    normalized: boolean;
}
export interface ROCCurve {
    fpr: number[];
    tpr: number[];
    auc: number;
    threshold: number[];
}
export interface MLPerformance {
    bestModel: string;
    comparison: ModelComparison[];
    crossValidation: CrossValidationResults;
}
export interface ModelComparison {
    model: string;
    metric: string;
    value: number;
    rank: number;
}
export interface CrossValidationResults {
    folds: number;
    mean: number;
    std: number;
    scores: number[];
}
export interface MLInterpretation {
    featureImportance: FeatureImportance[];
    shap?: SHAPValues;
    partialDependence?: PartialDependencePlot[];
}
export interface FeatureImportance {
    feature: string;
    importance: number;
    rank: number;
}
export interface SHAPValues {
    global: GlobalSHAP;
    local: LocalSHAP[];
}
export interface GlobalSHAP {
    features: string[];
    values: number[];
    baseline: number;
}
export interface LocalSHAP {
    instance: number;
    features: string[];
    values: number[];
    prediction: number;
}
export interface PartialDependencePlot {
    feature: string;
    values: number[];
    dependence: number[];
    ice?: ICECurve[];
}
export interface ICECurve {
    instance: number;
    values: number[];
    curve: number[];
}
export interface CausalResults {
    causalGraph: CausalGraph;
    effects: CausalEffect[];
    confounders: Confounder[];
}
export interface CausalGraph {
    nodes: CausalNode[];
    edges: CausalEdge[];
    assumptions: string[];
}
export interface CausalNode {
    id: string;
    name: string;
    type: "treatment" | "outcome" | "confounder" | "mediator" | "collider";
}
export interface CausalEdge {
    source: string;
    target: string;
    type: "direct" | "indirect" | "bidirectional";
    strength: number;
}
export interface CausalEffect {
    treatment: string;
    outcome: string;
    effect: number;
    confidence: ConfidenceInterval;
    method: string;
}
export interface Confounder {
    variable: string;
    strength: number;
    controlled: boolean;
    method?: string;
}
export interface VisualizationResults {
    plots: Plot[];
    dashboard: Dashboard;
    reports: Report[];
}
export interface Plot {
    id: string;
    type: string;
    title: string;
    data: any;
    config: PlotConfig;
    path?: string;
}
export interface PlotConfig {
    theme: string;
    interactive: boolean;
    annotations: Annotation[];
    styling: StylingConfig;
}
export interface Annotation {
    type: string;
    content: string;
    position: Position;
}
export interface Position {
    x: number;
    y: number;
}
export interface StylingConfig {
    colors: string[];
    fonts: FontConfig;
    layout: LayoutConfig;
}
export interface FontConfig {
    family: string;
    size: number;
    weight: string;
}
export interface LayoutConfig {
    margin: Margin;
    padding: Padding;
    grid: boolean;
}
export interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface Dashboard {
    id: string;
    title: string;
    widgets: Widget[];
    layout: DashboardLayout;
}
export interface Widget {
    id: string;
    type: string;
    title: string;
    data: any;
    position: WidgetPosition;
}
export interface WidgetPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface DashboardLayout {
    columns: number;
    rows: number;
    responsive: boolean;
}
export interface Report {
    id: string;
    title: string;
    format: string;
    sections: ReportSection[];
    metadata: ReportMetadata;
}
export interface ReportSection {
    title: string;
    content: string;
    figures: string[];
    tables: string[];
}
export interface ReportMetadata {
    authors: string[];
    created: Date;
    version: string;
    keywords: string[];
}
export interface Conclusion {
    statement: string;
    confidence: number;
    evidence: Evidence[];
    implications: string[];
}
export interface Evidence {
    type: "statistical" | "observational" | "experimental" | "literature";
    description: string;
    strength: number;
    sources: string[];
}
export interface Publication {
    title: string;
    authors: string[];
    journal?: string;
    conference?: string;
    year: number;
    doi?: string;
    status: "draft" | "submitted" | "under_review" | "accepted" | "published";
}
export interface ProjectMetadata {
    created: Date;
    lastModified: Date;
    version: string;
    tags: string[];
    collaborators: Collaborator[];
    funding: FundingInfo[];
}
export interface Collaborator {
    name: string;
    role: string;
    affiliation: string;
    contact: string;
}
export interface FundingInfo {
    agency: string;
    grantNumber: string;
    amount: number;
    currency: string;
}
export declare class CoScientistResearch extends EventEmitter {
    private logger;
    private config;
    private projects;
    private aiEngine;
    private experimentEngine;
    private analysisEngine;
    private validationEngine;
    private knowledgeBase;
    private performanceMonitor;
    constructor(config: CoScientistConfig);
    /**
     * Initializes the research engine
     */
    initialize(): Promise<void>;
    /**
     * Generates research hypotheses based on domain and initial observations
     */
    generateHypotheses(domain: string, observations: string[], constraints?: any): Promise<ServiceResponse<ResearchHypothesis[]>>;
    /**
     * Creates a new research project
     */
    createProject(title: string, domain: string, hypothesis: ResearchHypothesis, methodology?: Partial<ResearchMethodology>): Promise<ServiceResponse<ResearchProject>>;
    /**
     * Executes a research project
     */
    executeProject(projectId: string): Promise<ServiceResponse<void>>;
    /**
     * Gets project status and results
     */
    getProject(projectId: string): Promise<ServiceResponse<ResearchProject>>;
    /**
     * Lists all research projects
     */
    listProjects(domain?: string): Promise<ServiceResponse<ResearchProject[]>>;
    /**
     * Validates research results for reproducibility and scientific rigor
     */
    validateResults(projectId: string): Promise<ServiceResponse<ValidationResults>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    private initializeComponents;
    private setupEventHandlers;
    private validateHypotheses;
    private isValidHypothesis;
    private validateProjectDesign;
    private executeProjectAsync;
    private identifyLimitations;
    private suggestFutureWork;
    private generateProjectId;
    private generateRequestId;
    private createErrorResponse;
    private handleHypothesisGenerated;
    private handleExperimentCompleted;
    private handleAnalysisCompleted;
}
//# sourceMappingURL=co-scientist-research.d.ts.map
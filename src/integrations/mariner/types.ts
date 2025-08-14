/**
 * Project Mariner Browser Automation Types
 *
 * Advanced browser automation with intelligent coordination and multi-tab orchestration
 */

import {
  BaseIntegration,
  Task,
  Agent,
  CoordinationEvent,
  IntegrationConfig,
} from "../shared/types.js";

// === BROWSER AUTOMATION CORE ===

export interface BrowserConfig extends IntegrationConfig {
  puppeteer: PuppeteerConfig;
  coordination: CoordinationConfig;
  intelligence: IntelligenceConfig;
  session: SessionConfig;
}

export interface PuppeteerConfig {
  headless: boolean;
  devtools: boolean;
  defaultViewport: {
    width: number;
    height: number;
  };
  userAgent?: string;
  timeout: number;
  slowMo?: number;
  args: string[];
  ignoreHTTPSErrors: boolean;
  handleSIGINT: boolean;
  handleSIGTERM: boolean;
  handleSIGHUP: boolean;
}

export interface CoordinationConfig {
  maxTabs: number;
  tabPoolSize: number;
  coordinationStrategy: "sequential" | "parallel" | "adaptive";
  crossTabCommunication: boolean;
  globalStateManagement: boolean;
  eventSynchronization: boolean;
}

export interface IntelligenceConfig {
  formFilling: FormFillingConfig;
  elementDetection: ElementDetectionConfig;
  captchaSolving: CaptchaSolvingConfig;
  antiDetection: AntiDetectionConfig;
}

export interface SessionConfig {
  persistCookies: boolean;
  persistLocalStorage: boolean;
  persistSessionStorage: boolean;
  sessionTimeout: number;
  sessionBackup: boolean;
  crossSessionSharing: boolean;
}

// === BROWSER ORCHESTRATION ===

export interface BrowserOrchestrator extends BaseIntegration {
  createTab(config?: TabConfig): Promise<BrowserTab>;
  getTabs(): BrowserTab[];
  getActiveTab(): BrowserTab | null;
  closeTab(tabId: string): Promise<void>;
  coordinateAction(action: CrossTabAction): Promise<ActionResult>;
  distributeLoad(tasks: BrowserTask[]): Promise<Map<string, ActionResult>>;
  synchronizeState(): Promise<void>;
  optimizePerformance(): Promise<void>;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  status: TabStatus;
  page: any; // Puppeteer Page
  context: TabContext;
  metrics: TabMetrics;
  coordination: TabCoordination;
}

export type TabStatus = "loading" | "ready" | "navigating" | "error" | "closed";

export interface TabContext {
  cookies: Record<string, any>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  userAgent: string;
  viewport: { width: number; height: number };
  permissions: string[];
}

export interface TabMetrics {
  loadTime: number;
  domContentLoaded: number;
  networkRequests: number;
  jsErrors: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface TabCoordination {
  parentTab?: string;
  childTabs: string[];
  sharedState: Record<string, any>;
  eventHandlers: Map<string, Function>;
  communicationChannels: string[];
}

export interface TabConfig {
  url?: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
  permissions?: string[];
  isolateContext?: boolean;
  parentTab?: string;
}

// === WEB AGENT COORDINATION ===

export interface WebAgentCoordinator extends BaseIntegration {
  navigateSite(navigation: SiteNavigation): Promise<NavigationResult>;
  executeWorkflow(workflow: WebWorkflow): Promise<WorkflowResult>;
  coordiateMultiSite(
    sites: string[],
    action: MultiSiteAction,
  ): Promise<MultiSiteResult>;
  optimizeNavigation(pattern: NavigationPattern): Promise<OptimizationResult>;
  learnSiteStructure(url: string): Promise<SiteStructure>;
}

export interface SiteNavigation {
  url: string;
  strategy: NavigationStrategy;
  checkpoints: NavigationCheckpoint[];
  fallbackOptions: string[];
  maxRetries: number;
  timeout: number;
}

export type NavigationStrategy =
  | "direct"
  | "progressive"
  | "intelligent"
  | "adaptive";

export interface NavigationCheckpoint {
  selector: string;
  action: "wait" | "click" | "verify" | "extract";
  timeout: number;
  required: boolean;
  fallback?: string;
}

export interface NavigationResult {
  success: boolean;
  url: string;
  duration: number;
  checkpointsPassed: number;
  errors: string[];
  metadata: Record<string, any>;
}

// === INTELLIGENT INTERACTIONS ===

export interface FormFillingConfig {
  enabled: boolean;
  aiAssisted: boolean;
  dataValidation: boolean;
  smartDefaults: boolean;
  fieldMapping: Record<string, string>;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: "email" | "phone" | "date" | "number" | "text" | "regex";
  pattern?: string;
  required: boolean;
  custom?: (value: string) => boolean;
}

export interface ElementDetectionConfig {
  strategy: "css" | "xpath" | "ai" | "hybrid";
  confidence: number;
  retryAttempts: number;
  smartFallback: boolean;
  caching: boolean;
}

export interface CaptchaSolvingConfig {
  enabled: boolean;
  provider: "twocaptcha" | "anticaptcha" | "deathbycaptcha" | "custom";
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
}

export interface AntiDetectionConfig {
  randomizeUserAgent: boolean;
  randomizeViewport: boolean;
  humanLikeDelays: boolean;
  mouseMovementSimulation: boolean;
  keystrokeSimulation: boolean;
  fingerprintSpoofing: boolean;
}

// === BROWSER TASKS ===

export interface BrowserTask extends Task {
  type: "browser_automation";
  browser: BrowserTaskConfig;
}

export interface BrowserTaskConfig {
  action: BrowserAction;
  target: ActionTarget;
  parameters: ActionParameters;
  coordination: ActionCoordination;
  validation: ActionValidation;
}

export interface BrowserAction {
  type: ActionType;
  sequence: ActionStep[];
  timeout: number;
  retryPolicy: RetryPolicy;
}

export type ActionType =
  | "navigate"
  | "click"
  | "type"
  | "scroll"
  | "extract"
  | "wait"
  | "screenshot"
  | "pdf"
  | "form_fill"
  | "multi_tab"
  | "coordinate";

export interface ActionStep {
  action: ActionType;
  selector?: string;
  value?: string;
  options?: Record<string, any>;
  condition?: string;
  timeout?: number;
}

export interface ActionTarget {
  selector: string;
  frame?: string;
  tab?: string;
  fallbackSelectors: string[];
  smartDetection: boolean;
}

export interface ActionParameters {
  value?: any;
  options?: Record<string, any>;
  metadata?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ActionCoordination {
  requiresSync: boolean;
  affectedTabs: string[];
  sharedState: Record<string, any>;
  eventTriggers: string[];
}

export interface ActionValidation {
  expectedResult?: any;
  validationSelector?: string;
  customValidator?: (result: any) => boolean;
  successCondition?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  conditions: string[];
  escalationStrategy: "abort" | "fallback" | "notify";
}

// === CROSS-TAB COORDINATION ===

export interface CrossTabAction {
  id: string;
  type: CrossTabActionType;
  coordinator: string;
  participants: string[];
  sequence: CrossTabStep[];
  synchronization: SynchronizationConfig;
}

export type CrossTabActionType =
  | "state_sync"
  | "data_sharing"
  | "coordinated_navigation"
  | "parallel_execution"
  | "sequential_workflow";

export interface CrossTabStep {
  tabId: string;
  action: ActionStep;
  dependencies: string[];
  syncPoint?: boolean;
  timeout: number;
}

export interface SynchronizationConfig {
  strategy: "barrier" | "consensus" | "leader" | "eventual";
  timeout: number;
  requiredParticipants: number;
  failureHandling: "abort" | "continue" | "retry";
}

export interface ActionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  metadata: Record<string, any>;
  tabId: string;
  timestamp: Date;
}

// === WORKFLOWS ===

export interface WebWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  coordination: WorkflowCoordination;
  validation: WorkflowValidation;
  recovery: WorkflowRecovery;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "decision" | "loop" | "parallel" | "sync";
  config: any;
  dependencies: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface WorkflowCoordination {
  strategy: "sequential" | "parallel" | "hybrid";
  maxConcurrency: number;
  syncPoints: string[];
  sharedContext: boolean;
}

export interface WorkflowValidation {
  checkpoints: string[];
  finalValidation: (result: any) => boolean;
  partialResults: boolean;
}

export interface WorkflowRecovery {
  savepoints: string[];
  recoveryStrategy: "restart" | "resume" | "skip";
  maxRecoveryAttempts: number;
}

export interface WorkflowResult {
  success: boolean;
  results: Map<string, any>;
  duration: number;
  stepsCompleted: number;
  errors: string[];
  metadata: Record<string, any>;
}

// === MULTI-SITE OPERATIONS ===

export interface MultiSiteAction {
  id: string;
  sites: SiteConfig[];
  coordination: MultiSiteCoordination;
  aggregation: ResultAggregation;
}

export interface SiteConfig {
  url: string;
  name: string;
  config: TabConfig;
  workflow: WebWorkflow;
  priority: number;
}

export interface MultiSiteCoordination {
  strategy: "parallel" | "sequential" | "adaptive";
  dependencies: Map<string, string[]>;
  synchronization: SynchronizationConfig;
  loadBalancing: boolean;
}

export interface ResultAggregation {
  strategy: "merge" | "compare" | "validate" | "transform";
  reducer: (results: Map<string, any>) => any;
  validation: (aggregated: any) => boolean;
}

export interface MultiSiteResult {
  success: boolean;
  siteResults: Map<string, ActionResult>;
  aggregatedResult: any;
  duration: number;
  metadata: Record<string, any>;
}

// === SITE INTELLIGENCE ===

export interface SiteStructure {
  url: string;
  title: string;
  structure: PageStructure;
  navigation: NavigationMap;
  forms: FormStructure[];
  apis: ApiEndpoint[];
  patterns: InteractionPattern[];
  metadata: SiteMetadata;
}

export interface PageStructure {
  selectors: ElementSelector[];
  hierarchy: ElementHierarchy;
  dynamicElements: DynamicElement[];
  loadingPatterns: LoadingPattern[];
}

export interface ElementSelector {
  type: string;
  selector: string;
  confidence: number;
  fallbacks: string[];
  context: string;
}

export interface ElementHierarchy {
  root: ElementNode;
  depth: number;
  landmarks: string[];
}

export interface ElementNode {
  tag: string;
  selector: string;
  children: ElementNode[];
  attributes: Record<string, string>;
  interactive: boolean;
}

export interface DynamicElement {
  selector: string;
  behavior: "lazy-load" | "infinite-scroll" | "modal" | "tooltip";
  trigger: string;
  timeout: number;
}

export interface LoadingPattern {
  type: "spinner" | "skeleton" | "progress" | "placeholder";
  selector: string;
  duration: number;
}

export interface NavigationMap {
  primaryNav: NavigationElement[];
  secondaryNav: NavigationElement[];
  breadcrumbs: NavigationElement[];
  pagination: PaginationInfo;
  searchForms: SearchFormInfo[];
}

export interface NavigationElement {
  text: string;
  href: string;
  selector: string;
  level: number;
  children: NavigationElement[];
}

export interface PaginationInfo {
  present: boolean;
  selector: string;
  currentPage: number;
  totalPages: number;
  nextSelector?: string;
  prevSelector?: string;
}

export interface SearchFormInfo {
  selector: string;
  inputSelector: string;
  submitSelector: string;
  filters: FilterInfo[];
}

export interface FilterInfo {
  type: "dropdown" | "checkbox" | "radio" | "range";
  selector: string;
  options: string[];
}

export interface FormStructure {
  selector: string;
  method: string;
  action: string;
  fields: FormField[];
  validation: FormValidation;
  submission: SubmissionInfo;
}

export interface FormField {
  name: string;
  type: string;
  selector: string;
  required: boolean;
  validation: string[];
  options?: string[];
  placeholder?: string;
}

export interface FormValidation {
  clientSide: boolean;
  serverSide: boolean;
  realTime: boolean;
  patterns: Record<string, string>;
}

export interface SubmissionInfo {
  selector: string;
  method: "click" | "submit" | "enter";
  confirmationSelector?: string;
  redirectPattern?: string;
}

export interface ApiEndpoint {
  url: string;
  method: string;
  parameters: Record<string, string>;
  authentication: AuthInfo;
  rateLimit: RateLimitInfo;
}

export interface AuthInfo {
  type: "none" | "basic" | "bearer" | "oauth" | "api-key";
  location: "header" | "query" | "body";
  key?: string;
}

export interface RateLimitInfo {
  requests: number;
  window: number;
  headers: string[];
}

export interface InteractionPattern {
  name: string;
  type: "click-sequence" | "form-flow" | "navigation" | "data-extraction";
  steps: PatternStep[];
  frequency: number;
  success_rate: number;
}

export interface PatternStep {
  action: string;
  selector: string;
  timing: number;
  conditions: string[];
}

export interface SiteMetadata {
  lastScanned: Date;
  version: string;
  technologies: string[];
  performance: SitePerformance;
  accessibility: AccessibilityInfo;
}

export interface SitePerformance {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface AccessibilityInfo {
  hasAriaLabels: boolean;
  keyboardNavigable: boolean;
  screenReaderFriendly: boolean;
  contrastRatio: number;
  violations: string[];
}

export interface NavigationPattern {
  sites: string[];
  commonPaths: string[];
  optimization: NavigationOptimization;
  performance: NavigationPerformance;
}

export interface NavigationOptimization {
  preloadResources: string[];
  cacheStrategy: string;
  compressionEnabled: boolean;
  minification: boolean;
}

export interface NavigationPerformance {
  avgLoadTime: number;
  successRate: number;
  errorPatterns: string[];
  bottlenecks: string[];
}

export interface OptimizationResult {
  improvements: string[];
  performanceGains: Record<string, number>;
  recommendations: string[];
  implementationPlan: string[];
}

// === SESSION MANAGEMENT ===

export interface SessionState {
  id: string;
  tabs: Map<string, TabState>;
  globalState: Record<string, any>;
  cookies: Record<string, any>;
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  timestamp: Date;
  version: string;
}

export interface TabState {
  id: string;
  url: string;
  scrollPosition: { x: number; y: number };
  formData: Record<string, any>;
  selectedElements: string[];
  customState: Record<string, any>;
}

export interface SessionManager {
  saveSession(session: SessionState): Promise<void>;
  loadSession(sessionId: string): Promise<SessionState>;
  restoreSession(sessionId: string): Promise<void>;
  mergeSession(sessionA: string, sessionB: string): Promise<SessionState>;
  listSessions(): Promise<string[]>;
  deleteSession(sessionId: string): Promise<void>;
  exportSession(sessionId: string): Promise<string>;
  importSession(data: string): Promise<SessionState>;
}

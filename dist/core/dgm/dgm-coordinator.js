/**
 * DGM Main Coordinator
 *
 * Central coordinator for the Darwin Gödel Machine implementation.
 * Orchestrates all DGM components including evolutionary strategies,
 * pattern archiving, autonomous monitoring, and fitness evaluation.
 */
import { Logger } from '../../utils/logger';
import { PerformanceMonitor } from '../performance-monitor';
import { CoordinationOptimizer } from '../advanced-coordination/optimization';
import { DGMEvolutionaryOrchestrator } from './evolutionary-orchestrator';
import { DGMPatternArchive } from './pattern-archive';
import { DGMAutonomousMonitor } from './autonomous-monitor';
import { DGMFitnessFunction } from './fitness-function';
import { EventEmitter } from 'events';
import * as path from 'path';
/**
 * Darwin Gödel Machine System Coordinator
 *
 * Main orchestrator for self-improving evolutionary cleanup system
 */
export class DGMSystemCoordinator extends EventEmitter {
    constructor(config) {
        super();
        // System state
        this.isInitialized = false;
        this.isActive = false;
        this.startTime = new Date();
        this.currentBaseline = null;
        this.evolutionHistory = [];
        this.systemRecommendations = [];
        this.config = config;
        this.logger = new Logger('DGMSystemCoordinator');
        // Initialize components
        this.initializeComponents();
        this.logger.info('DGM System Coordinator created', {
            projectPath: config.projectPath,
            autonomousMode: config.enableAutonomousMode,
            experimentalFeatures: config.experimentalFeatures || []
        });
    }
    /**
     * Initialize all DGM components
     */
    initializeComponents() {
        // Core performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
        // Coordination optimizer (existing component)
        this.coordinationOptimizer = new CoordinationOptimizer({ projectID: 'dgm-system' }, {}, // Neural models placeholder
        {} // GCP operations placeholder
        );
        // Fitness evaluation system
        this.fitnessFunction = new DGMFitnessFunction(this.config.fitness);
        // Pattern archive
        const archivePath = this.config.archivePath || path.join(this.config.projectPath, 'data/dgm-patterns');
        this.patternArchive = new DGMPatternArchive(archivePath);
        // Evolutionary orchestrator
        this.evolutionaryOrchestrator = new DGMEvolutionaryOrchestrator(this.config.evolution, this.coordinationOptimizer, this.performanceMonitor);
        // Autonomous monitoring
        this.autonomousMonitor = new DGMAutonomousMonitor(this.config.monitoring, this.performanceMonitor, this.evolutionaryOrchestrator, this.patternArchive);
        // Setup event handlers
        this.setupEventHandlers();
    }
    /**
     * Setup inter-component event handlers
     */
    setupEventHandlers() {
        // Evolution orchestrator events
        this.evolutionaryOrchestrator.on('baseline_established', (baseline) => {
            this.currentBaseline = baseline;
            this.emit('baseline_updated', baseline);
        });
        this.evolutionaryOrchestrator.on('strategies_generated', (strategies) => {
            this.emit('strategies_available', strategies);
        });
        this.evolutionaryOrchestrator.on('strategy_deployed', (strategy) => {
            this.emit('evolution_deployed', strategy);
        });
        // Pattern archive events
        this.patternArchive.on('pattern_archived', (pattern) => {
            this.emit('pattern_learned', pattern);
        });
        // Autonomous monitor events
        this.autonomousMonitor.on('debt_alert', (alert) => {
            this.emit('debt_alert', alert);
        });
        this.autonomousMonitor.on('autonomous_evolution_started', (data) => {
            this.emit('autonomous_action', data);
        });
        this.autonomousMonitor.on('autonomous_evolution_completed', (data) => {
            this.handleAutonomousEvolutionCompleted(data);
        });
        // Performance monitor events
        this.performanceMonitor.on('health_check', (health) => {
            this.emit('health_update', health);
        });
    }
    /**
     * Initialize the DGM system
     */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('DGM system already initialized');
            return;
        }
        try {
            this.logger.info('Initializing DGM system...');
            // Establish baseline metrics
            const baseline = await this.evolutionaryOrchestrator.establishBaseline();
            this.currentBaseline = baseline;
            // Initialize fitness function baseline
            await this.fitnessFunction.establishBaseline(this.config.projectPath);
            // Generate initial recommendations
            this.systemRecommendations = await this.generateSystemRecommendations();
            this.isInitialized = true;
            this.logger.info('DGM system initialized successfully', {
                baselineScore: baseline.score,
                recommendations: this.systemRecommendations.length
            });
            this.emit('system_initialized', { baseline, recommendations: this.systemRecommendations });
        }
        catch (error) {
            this.logger.error('DGM system initialization failed', { error });
            throw error;
        }
    }
    /**
     * Start the DGM system
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (this.isActive) {
            this.logger.warn('DGM system already active');
            return;
        }
        this.isActive = true;
        this.startTime = new Date();
        // Start autonomous monitoring if enabled
        if (this.config.enableAutonomousMode) {
            this.autonomousMonitor.startMonitoring();
            this.logger.info('Autonomous monitoring started');
        }
        this.logger.info('DGM system started', {
            autonomousMode: this.config.enableAutonomousMode
        });
        this.emit('system_started');
    }
    /**
     * Stop the DGM system
     */
    async stop() {
        if (!this.isActive) {
            return;
        }
        this.isActive = false;
        // Stop autonomous monitoring
        this.autonomousMonitor.stopMonitoring();
        this.logger.info('DGM system stopped');
        this.emit('system_stopped');
    }
    /**
     * Execute manual evolution cycle
     */
    async executeEvolutionCycle(targets) {
        if (!this.isInitialized) {
            throw new Error('DGM system not initialized');
        }
        const reportId = `evolution-${Date.now()}`;
        const startTime = Date.now();
        this.logger.info('Starting manual evolution cycle', { reportId });
        try {
            // If no targets provided, identify them automatically
            if (!targets) {
                targets = await this.identifyCleanupTargets();
            }
            // Generate evolutionary strategies
            const strategies = await this.evolutionaryOrchestrator.generateEvolutionaryStrategies(targets);
            // Execute A/B testing
            const results = await this.evolutionaryOrchestrator.executeABTesting(strategies);
            // Evaluate fitness for each strategy
            const fitnessEvaluations = new Map();
            for (const [strategyId, validation] of results.entries()) {
                const strategy = strategies.find(s => s.id === strategyId);
                if (strategy) {
                    const fitness = this.fitnessFunction.evaluateStrategyFitness(strategy, validation);
                    fitnessEvaluations.set(strategyId, fitness);
                }
            }
            // Archive successful strategies
            await this.evolutionaryOrchestrator.archiveSuccessfulStrategies(results);
            // Deploy best strategy
            const bestStrategy = await this.evolutionaryOrchestrator.deployBestStrategy(results);
            // Generate recommendations
            const recommendations = await this.evolutionaryOrchestrator.generateEvolutionaryRecommendations();
            // Calculate fitness improvement
            let fitnessImprovement = 0;
            if (bestStrategy && this.currentBaseline) {
                const bestResult = results.get(bestStrategy.id);
                if (bestResult) {
                    fitnessImprovement = bestResult.score - this.currentBaseline.score;
                }
            }
            // Count archived patterns
            const archivedCount = Array.from(results.values()).filter(r => r.passed).length;
            const executionTime = Date.now() - startTime;
            const report = {
                id: reportId,
                timestamp: new Date(),
                trigger: 'manual',
                strategiesEvaluated: strategies.length,
                bestStrategy,
                fitnessImprovement,
                patternsArchived: archivedCount,
                recommendations,
                executionTime,
                status: bestStrategy ? 'completed' : 'failed'
            };
            this.evolutionHistory.push(report);
            this.systemRecommendations = recommendations;
            this.logger.info('Evolution cycle completed', {
                reportId,
                status: report.status,
                strategiesEvaluated: report.strategiesEvaluated,
                improvement: fitnessImprovement
            });
            this.emit('evolution_completed', report);
            return report;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const errorReport = {
                id: reportId,
                timestamp: new Date(),
                trigger: 'manual',
                strategiesEvaluated: 0,
                fitnessImprovement: 0,
                patternsArchived: 0,
                recommendations: [`Evolution failed: ${error instanceof Error ? error.message : String(error)}`],
                executionTime,
                status: 'failed'
            };
            this.evolutionHistory.push(errorReport);
            this.logger.error('Evolution cycle failed', { reportId, error });
            this.emit('evolution_failed', errorReport);
            return errorReport;
        }
    }
    /**
     * Query archived patterns
     */
    async queryPatterns(query) {
        return this.patternArchive.queryPatterns(query);
    }
    /**
     * Get system status
     */
    getSystemStatus() {
        const monitoringStatus = this.autonomousMonitor.getMonitoringStatus();
        const uptime = Date.now() - this.startTime.getTime();
        return {
            isActive: this.isActive,
            autonomousMode: this.config.enableAutonomousMode && monitoringStatus.isMonitoring,
            lastBaseline: this.currentBaseline,
            debtMetrics: monitoringStatus.currentDebt,
            archivedPatterns: 0, // Would get from pattern archive
            activeRecommendations: this.systemRecommendations,
            systemHealth: this.currentBaseline?.score || 0,
            uptime: uptime
        };
    }
    /**
     * Get evolution history
     */
    getEvolutionHistory(limit) {
        const history = [...this.evolutionHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? history.slice(0, limit) : history;
    }
    /**
     * Generate system-wide insights and recommendations
     */
    async generateSystemInsights() {
        const evolutionInsights = await this.evolutionaryOrchestrator.generateEvolutionaryRecommendations();
        const patternInsights = await this.patternArchive.generateEvolutionaryInsights();
        const performanceInsights = this.generatePerformanceInsights();
        const recommendations = await this.generateSystemRecommendations();
        return {
            evolutionInsights,
            patternInsights,
            performanceInsights,
            recommendations
        };
    }
    /**
     * Export system data for analysis
     */
    async exportSystemData() {
        const patterns = await this.patternArchive.exportPatterns();
        return {
            config: this.config,
            status: this.getSystemStatus(),
            baseline: this.currentBaseline,
            evolutionHistory: this.evolutionHistory,
            patterns,
            recommendations: this.systemRecommendations
        };
    }
    /**
     * Handle autonomous evolution completion
     */
    handleAutonomousEvolutionCompleted(data) {
        const { evolutionId, result } = data;
        const report = {
            id: evolutionId,
            timestamp: new Date(),
            trigger: 'autonomous',
            strategiesEvaluated: 1,
            fitnessImprovement: result.score - (this.currentBaseline?.score || 0),
            patternsArchived: result.passed ? 1 : 0,
            recommendations: result.recommendations || [],
            executionTime: 0, // Would track in actual implementation
            status: result.passed ? 'completed' : 'failed'
        };
        this.evolutionHistory.push(report);
        this.emit('autonomous_evolution_completed', report);
    }
    /**
     * Identify cleanup targets automatically
     */
    async identifyCleanupTargets() {
        const bottlenecks = this.performanceMonitor.analyzeBottlenecks();
        const targets = [];
        // Convert bottlenecks to cleanup targets
        for (const bottleneck of bottlenecks) {
            const target = {
                type: this.mapComponentToTargetType(bottleneck.component),
                path: this.generateTargetPath(bottleneck.component, bottleneck.metric),
                reason: bottleneck.description,
                priority: this.mapSeverityToPriority(bottleneck.severity),
                estimatedBenefit: bottleneck.impact,
                riskLevel: this.calculateRiskLevel(bottleneck)
            };
            targets.push(target);
        }
        // Add default cleanup targets if none found
        if (targets.length === 0) {
            targets.push({
                type: 'file',
                path: 'src/**/*.{js,ts}',
                reason: 'General code cleanup and optimization',
                priority: 'medium',
                estimatedBenefit: 0.5,
                riskLevel: 0.3
            });
        }
        return targets;
    }
    /**
     * Generate system-wide recommendations
     */
    async generateSystemRecommendations() {
        const recommendations = [];
        // Performance-based recommendations
        const healthScore = this.performanceMonitor.getHealthScore();
        if (healthScore < 70) {
            recommendations.push(`System health at ${healthScore}% - consider immediate optimization`);
        }
        // Evolution-based recommendations
        if (this.evolutionHistory.length > 0) {
            const recentSuccess = this.evolutionHistory.slice(-5).filter(r => r.status === 'completed').length;
            if (recentSuccess < 2) {
                recommendations.push('Recent evolution success rate is low - review strategy parameters');
            }
        }
        // Pattern-based recommendations
        const patternRecommendations = await this.patternArchive.generateEvolutionaryInsights();
        recommendations.push(...patternRecommendations.slice(0, 3));
        return recommendations;
    }
    /**
     * Generate performance insights
     */
    generatePerformanceInsights() {
        const insights = [];
        const metrics = this.performanceMonitor.getMetrics();
        const healthScore = this.performanceMonitor.getHealthScore();
        insights.push(`Overall system health: ${healthScore.toFixed(1)}%`);
        const bottlenecks = this.performanceMonitor.analyzeBottlenecks();
        if (bottlenecks.length > 0) {
            insights.push(`${bottlenecks.length} performance bottlenecks identified`);
            const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');
            if (criticalBottlenecks.length > 0) {
                insights.push(`${criticalBottlenecks.length} critical bottlenecks require immediate attention`);
            }
        }
        return insights;
    }
    // Utility methods
    mapComponentToTargetType(component) {
        if (component.includes('file') || component.includes('code'))
            return 'file';
        if (component.includes('config'))
            return 'configuration';
        if (component.includes('dependency') || component.includes('package'))
            return 'dependency';
        return 'directory';
    }
    generateTargetPath(component, metric) {
        if (component === 'orchestrator')
            return 'src/core/model-orchestrator.ts';
        if (component === 'router')
            return 'src/core/model-router.ts';
        if (component === 'cache')
            return 'src/core/cache-manager.ts';
        return 'src/';
    }
    mapSeverityToPriority(severity) {
        switch (severity) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium': return 'medium';
            default: return 'low';
        }
    }
    calculateRiskLevel(bottleneck) {
        // Higher impact bottlenecks have lower risk for cleanup
        return Math.max(0.1, 1 - bottleneck.impact);
    }
}

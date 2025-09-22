/**
 * DGM Fitness Functions
 *
 * Provides fitness evaluation system for code quality benchmarking
 * and evolutionary strategy assessment.
 */
import { Logger } from '../../utils/logger.js';
/**
 * DGM Fitness Function System for Code Quality Assessment
 */
export class DGMFitnessFunction {
    constructor(config) {
        this.baselineMetrics = null;
        this.logger = new Logger('DGMFitnessFunction');
        this.config = this.initializeConfig(config);
        this.logger.info('Fitness function system initialized', {
            weights: this.config.weights,
            benchmarks: Object.keys(this.config.benchmarks)
        });
    }
    /**
     * Initialize fitness configuration with defaults
     */
    initializeConfig(config) {
        const defaultWeights = {
            performance: 0.20,
            maintainability: 0.18,
            reliability: 0.16,
            security: 0.14,
            scalability: 0.12,
            testability: 0.12,
            documentation: 0.08
        };
        const defaultThresholds = {
            excellent: 0.90,
            good: 0.75,
            acceptable: 0.60,
            poor: 0.40
        };
        const defaultBenchmarks = {
            performance: {
                maxResponseTime: 2000,
                minThroughput: 100,
                maxMemoryUsage: 512,
                maxCpuUsage: 70,
                cacheHitRatio: 0.8
            },
            maintainability: {
                maxComplexity: 10,
                maxFunctionLength: 50,
                maxFileLength: 300,
                maxDuplication: 0.05,
                minModularity: 0.7
            },
            reliability: {
                maxErrorRate: 0.01,
                minUptime: 0.99,
                maxRecoveryTime: 300,
                minMTBF: 168
            },
            security: {
                maxVulnerabilities: 0,
                requiredAuthStrength: 0.8,
                encryptionCoverage: 0.9,
                auditCompleteness: 0.8
            },
            scalability: {
                maxLoadIncrease: 200,
                horizontalScaling: 0.8,
                resourceEfficiency: 0.7
            },
            testability: {
                minCodeCoverage: 0.8,
                minBranchCoverage: 0.75,
                testToCodeRatio: 0.5,
                testQualityScore: 0.7
            },
            documentation: {
                apiDocumentationCoverage: 0.9,
                codeCommentRatio: 0.15,
                architectureDocCompleteness: 0.8,
                userDocumentationScore: 0.7
            }
        };
        const defaultPenalties = {
            regressionPenalty: 0.2,
            complexityPenalty: 0.15,
            securityRiskPenalty: 0.3,
            maintainabilityPenalty: 0.1,
            testCoveragePenalty: 0.15
        };
        return {
            weights: { ...defaultWeights, ...config?.weights },
            thresholds: { ...defaultThresholds, ...config?.thresholds },
            benchmarks: {
                performance: { ...defaultBenchmarks.performance, ...config?.benchmarks?.performance },
                maintainability: { ...defaultBenchmarks.maintainability, ...config?.benchmarks?.maintainability },
                reliability: { ...defaultBenchmarks.reliability, ...config?.benchmarks?.reliability },
                security: { ...defaultBenchmarks.security, ...config?.benchmarks?.security },
                scalability: { ...defaultBenchmarks.scalability, ...config?.benchmarks?.scalability },
                testability: { ...defaultBenchmarks.testability, ...config?.benchmarks?.testability },
                documentation: { ...defaultBenchmarks.documentation, ...config?.benchmarks?.documentation }
            },
            penalties: { ...defaultPenalties, ...config?.penalties }
        };
    }
    /**
     * Establish baseline metrics from current system state
     */
    async establishBaseline(projectPath) {
        this.logger.info('Establishing fitness baseline', { projectPath });
        const metrics = await this.collectCodeQualityMetrics(projectPath);
        this.baselineMetrics = metrics;
        this.logger.info('Baseline established', {
            linesOfCode: metrics.linesOfCode,
            complexity: metrics.cyclomaticComplexity,
            testCoverage: metrics.testCoverage,
            technicalDebt: metrics.technicalDebtRatio
        });
        return metrics;
    }
    /**
     * Evaluate fitness of a strategy based on validation results
     */
    evaluateStrategyFitness(strategy, validation, metrics) {
        this.logger.debug('Evaluating strategy fitness', {
            strategyId: strategy.id,
            validationPassed: validation.passed
        });
        // Calculate component scores
        const componentScores = this.calculateComponentScores(validation, metrics);
        // Calculate weighted overall fitness
        const overallFitness = this.calculateWeightedFitness(componentScores);
        // Apply penalties for regressions or issues
        const penalizedFitness = this.applyPenalties(overallFitness, validation, metrics);
        // Determine grade
        const grade = this.assignGrade(penalizedFitness);
        // Generate insights
        const { strengths, weaknesses, recommendations } = this.generateInsights(componentScores, validation);
        // Compare against benchmarks
        const benchmarkComparison = this.compareToBenchmarks(componentScores, metrics);
        const evaluation = {
            overallFitness: penalizedFitness,
            componentScores,
            grade,
            strengths,
            weaknesses,
            recommendations,
            benchmarkComparison,
            timestamp: new Date()
        };
        this.logger.info('Strategy fitness evaluated', {
            strategyId: strategy.id,
            fitness: penalizedFitness,
            grade,
            strengths: strengths.length,
            weaknesses: weaknesses.length
        });
        return evaluation;
    }
    /**
     * Calculate component scores from validation results and metrics
     */
    calculateComponentScores(validation, metrics) {
        const scores = {
            performance: this.evaluatePerformance(validation, metrics),
            maintainability: this.evaluateMaintainability(validation, metrics),
            reliability: this.evaluateReliability(validation, metrics),
            security: this.evaluateSecurity(validation, metrics),
            scalability: this.evaluateScalability(validation, metrics),
            testability: this.evaluateTestability(validation, metrics),
            documentation: this.evaluateDocumentation(validation, metrics)
        };
        return scores;
    }
    /**
     * Evaluate performance fitness component
     */
    evaluatePerformance(validation, metrics) {
        let score = 0.5; // Default neutral score
        // Use validation metrics
        if (validation.metrics.healthScore) {
            score = Math.max(score, validation.metrics.healthScore / 100);
        }
        // Use performance metrics if available
        if (metrics?.performanceMetrics) {
            const perf = metrics.performanceMetrics;
            const benchmarks = this.config.benchmarks.performance;
            let perfScore = 0;
            let weights = 0;
            // Response time score
            if (perf.responseTime > 0) {
                const responseScore = Math.max(0, 1 - (perf.responseTime / benchmarks.maxResponseTime));
                perfScore += responseScore * 0.3;
                weights += 0.3;
            }
            // Memory usage score
            if (perf.memoryUsage > 0) {
                const memoryScore = Math.max(0, 1 - (perf.memoryUsage / benchmarks.maxMemoryUsage));
                perfScore += memoryScore * 0.25;
                weights += 0.25;
            }
            // CPU usage score
            if (perf.cpuUsage > 0) {
                const cpuScore = Math.max(0, 1 - (perf.cpuUsage / benchmarks.maxCpuUsage));
                perfScore += cpuScore * 0.25;
                weights += 0.25;
            }
            // Throughput score
            if (perf.throughput > 0) {
                const throughputScore = Math.min(1, perf.throughput / benchmarks.minThroughput);
                perfScore += throughputScore * 0.2;
                weights += 0.2;
            }
            if (weights > 0) {
                score = Math.max(score, perfScore / weights);
            }
        }
        // Improvement bonus
        if (validation.metrics.improvement && validation.metrics.improvement > 0) {
            score += Math.min(0.2, validation.metrics.improvement / 100);
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Evaluate maintainability fitness component
     */
    evaluateMaintainability(validation, metrics) {
        let score = 0.5; // Default neutral score
        if (metrics) {
            const benchmarks = this.config.benchmarks.maintainability;
            let maintScore = 0;
            let weights = 0;
            // Complexity score
            if (metrics.cyclomaticComplexity > 0) {
                const complexityScore = Math.max(0, 1 - (metrics.cyclomaticComplexity / benchmarks.maxComplexity));
                maintScore += complexityScore * 0.3;
                weights += 0.3;
            }
            // Duplication score
            if (metrics.duplicationPercentage >= 0) {
                const dupScore = Math.max(0, 1 - (metrics.duplicationPercentage / benchmarks.maxDuplication));
                maintScore += dupScore * 0.3;
                weights += 0.3;
            }
            // Technical debt score
            if (metrics.technicalDebtRatio >= 0) {
                const debtScore = Math.max(0, 1 - metrics.technicalDebtRatio);
                maintScore += debtScore * 0.4;
                weights += 0.4;
            }
            if (weights > 0) {
                score = maintScore / weights;
            }
        }
        // Penalty for errors (indicates maintainability issues)
        if (validation.errors.length > 0) {
            score -= Math.min(0.3, validation.errors.length * 0.1);
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Evaluate reliability fitness component
     */
    evaluateReliability(validation, metrics) {
        let score = validation.passed ? 0.8 : 0.3; // Base on validation pass/fail
        // Penalty for errors
        if (validation.errors.length > 0) {
            const errorPenalty = Math.min(0.5, validation.errors.length * 0.1);
            score -= errorPenalty;
        }
        // Bonus for high validation score
        if (validation.score > 80) {
            score += 0.1;
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Evaluate security fitness component
     */
    evaluateSecurity(validation, metrics) {
        let score = 0.7; // Assume reasonable security by default
        if (metrics?.securityIssues !== undefined) {
            const securityScore = Math.max(0, 1 - (metrics.securityIssues / 10)); // Penalty for security issues
            score = securityScore;
        }
        // Look for security-related errors in validation
        const securityErrors = validation.errors.filter(e => e.toLowerCase().includes('security') ||
            e.toLowerCase().includes('vulnerability') ||
            e.toLowerCase().includes('authentication'));
        if (securityErrors.length > 0) {
            score -= securityErrors.length * 0.2;
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Evaluate scalability fitness component
     */
    evaluateScalability(validation, metrics) {
        let score = 0.6; // Default moderate scalability
        // Use performance metrics as scalability indicators
        if (metrics?.performanceMetrics) {
            const perf = metrics.performanceMetrics;
            // Lower resource usage = better scalability
            if (perf.memoryUsage > 0 && perf.cpuUsage > 0) {
                const resourceEfficiency = 1 - ((perf.memoryUsage / 1000) + (perf.cpuUsage / 100)) / 2;
                score = Math.max(score, resourceEfficiency);
            }
        }
        // Complexity affects scalability
        if (metrics?.cyclomaticComplexity) {
            const complexityPenalty = Math.min(0.3, metrics.cyclomaticComplexity / 50);
            score -= complexityPenalty;
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Evaluate testability fitness component
     */
    evaluateTestability(validation, metrics) {
        let score = 0.5; // Default neutral score
        if (metrics?.testCoverage !== undefined) {
            const coverage = metrics.testCoverage;
            const benchmarks = this.config.benchmarks.testability;
            // Test coverage score
            const coverageScore = Math.min(1, coverage / benchmarks.minCodeCoverage);
            score = coverageScore;
        }
        // Bonus if validation passed (indicates good testing)
        if (validation.passed) {
            score += 0.1;
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Evaluate documentation fitness component
     */
    evaluateDocumentation(validation, metrics) {
        let score = 0.5; // Default neutral score
        if (metrics?.documentationCoverage !== undefined) {
            score = metrics.documentationCoverage;
        }
        return Math.min(1, Math.max(0, score));
    }
    /**
     * Calculate weighted overall fitness score
     */
    calculateWeightedFitness(scores) {
        const weights = this.config.weights;
        const weightedScore = scores.performance * weights.performance +
            scores.maintainability * weights.maintainability +
            scores.reliability * weights.reliability +
            scores.security * weights.security +
            scores.scalability * weights.scalability +
            scores.testability * weights.testability +
            scores.documentation * weights.documentation;
        return Math.min(1, Math.max(0, weightedScore));
    }
    /**
     * Apply penalties for regressions or issues
     */
    applyPenalties(fitness, validation, metrics) {
        let penalizedFitness = fitness;
        const penalties = this.config.penalties;
        // Regression penalty
        if (this.baselineMetrics && metrics) {
            if (metrics.performanceMetrics.responseTime > this.baselineMetrics.performanceMetrics.responseTime * 1.1) {
                penalizedFitness -= penalties.regressionPenalty;
            }
            if (metrics.cyclomaticComplexity > this.baselineMetrics.cyclomaticComplexity * 1.1) {
                penalizedFitness -= penalties.complexityPenalty;
            }
            if (metrics.testCoverage < this.baselineMetrics.testCoverage * 0.9) {
                penalizedFitness -= penalties.testCoveragePenalty;
            }
        }
        // Error penalty
        if (validation.errors.length > 0) {
            penalizedFitness -= Math.min(0.3, validation.errors.length * 0.05);
        }
        return Math.min(1, Math.max(0, penalizedFitness));
    }
    /**
     * Assign letter grade based on fitness score
     */
    assignGrade(fitness) {
        const thresholds = this.config.thresholds;
        if (fitness >= thresholds.excellent)
            return 'A';
        if (fitness >= thresholds.good)
            return 'B';
        if (fitness >= thresholds.acceptable)
            return 'C';
        if (fitness >= thresholds.poor)
            return 'D';
        return 'F';
    }
    /**
     * Generate insights from component scores
     */
    generateInsights(scores, validation) {
        const strengths = [];
        const weaknesses = [];
        const recommendations = [];
        // Identify strengths (scores above 0.8)
        for (const [component, score] of Object.entries(scores)) {
            if (score >= 0.8) {
                strengths.push(`Excellent ${component} (${(score * 100).toFixed(1)}%)`);
            }
            else if (score <= 0.4) {
                weaknesses.push(`Poor ${component} (${(score * 100).toFixed(1)}%)`);
                recommendations.push(`Improve ${component} - currently below acceptable threshold`);
            }
        }
        // Add validation-based recommendations
        if (validation.recommendations.length > 0) {
            recommendations.push(...validation.recommendations.slice(0, 3)); // Top 3 recommendations
        }
        // Add specific improvement recommendations
        if (scores.performance < 0.6) {
            recommendations.push('Consider performance optimization: caching, query optimization, or resource management');
        }
        if (scores.maintainability < 0.6) {
            recommendations.push('Focus on code refactoring: reduce complexity, eliminate duplication, improve modularity');
        }
        if (scores.testability < 0.6) {
            recommendations.push('Increase test coverage and improve test quality');
        }
        return { strengths, weaknesses, recommendations };
    }
    /**
     * Compare scores against industry benchmarks
     */
    compareToBenchmarks(scores, metrics) {
        const minimumThreshold = 0.6;
        const excellentThreshold = 0.8;
        const meetsMinimumStandards = Object.values(scores).every(score => score >= minimumThreshold);
        const exceedsIndustryBenchmarks = Object.values(scores).every(score => score >= excellentThreshold);
        let regressionDetected = false;
        if (this.baselineMetrics && metrics) {
            regressionDetected =
                metrics.performanceMetrics.responseTime > this.baselineMetrics.performanceMetrics.responseTime * 1.2 ||
                    metrics.cyclomaticComplexity > this.baselineMetrics.cyclomaticComplexity * 1.2 ||
                    metrics.testCoverage < this.baselineMetrics.testCoverage * 0.8;
        }
        const improvementAreas = [];
        const strongAreas = [];
        for (const [component, score] of Object.entries(scores)) {
            if (score < minimumThreshold) {
                improvementAreas.push(component);
            }
            else if (score >= excellentThreshold) {
                strongAreas.push(component);
            }
        }
        return {
            meetsMinimumStandards,
            exceedsIndustryBenchmarks,
            regressionDetected,
            improvementAreas,
            strongAreas
        };
    }
    /**
     * Collect code quality metrics from project
     */
    async collectCodeQualityMetrics(projectPath) {
        // This would integrate with actual code analysis tools
        // For now, return simulated metrics
        const mockMetrics = {
            linesOfCode: 25000,
            cyclomaticComplexity: 8.5,
            codeChurn: 0.15,
            technicalDebtRatio: 0.25,
            duplicationPercentage: 0.08,
            testCoverage: 0.78,
            documentationCoverage: 0.65,
            securityIssues: 2,
            performanceMetrics: {
                responseTime: 1500,
                throughput: 120,
                memoryUsage: 384,
                cpuUsage: 45
            }
        };
        this.logger.debug('Collected code quality metrics', {
            projectPath,
            linesOfCode: mockMetrics.linesOfCode,
            testCoverage: mockMetrics.testCoverage
        });
        return mockMetrics;
    }
    /**
     * Export fitness evaluation for analysis
     */
    exportEvaluation(evaluation) {
        return JSON.stringify({
            timestamp: evaluation.timestamp.toISOString(),
            overallFitness: evaluation.overallFitness,
            grade: evaluation.grade,
            componentScores: evaluation.componentScores,
            benchmarkComparison: evaluation.benchmarkComparison,
            insights: {
                strengths: evaluation.strengths,
                weaknesses: evaluation.weaknesses,
                recommendations: evaluation.recommendations
            }
        }, null, 2);
    }
    /**
     * Update fitness configuration
     */
    updateConfig(updates) {
        if (updates.weights) {
            this.config.weights = { ...this.config.weights, ...updates.weights };
        }
        if (updates.thresholds) {
            this.config.thresholds = { ...this.config.thresholds, ...updates.thresholds };
        }
        if (updates.benchmarks) {
            // Deep merge benchmarks
            Object.keys(updates.benchmarks).forEach(key => {
                const benchmarkKey = key;
                this.config.benchmarks[benchmarkKey] = {
                    ...this.config.benchmarks[benchmarkKey],
                    ...updates.benchmarks[benchmarkKey]
                };
            });
        }
        if (updates.penalties) {
            this.config.penalties = { ...this.config.penalties, ...updates.penalties };
        }
        this.logger.info('Fitness configuration updated', { updates });
    }
}

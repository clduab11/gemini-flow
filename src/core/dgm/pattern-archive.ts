/**
 * DGM Pattern Archive System
 * 
 * Manages storage and retrieval of successful evolutionary patterns
 * for future strategy generation and optimization.
 */

import { Logger } from '../../utils/logger.js';
import { EvolutionStrategy, ValidationResult } from './evolutionary-orchestrator.js';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ArchivedPattern {
  id: string;
  strategy: EvolutionStrategy;
  validation: ValidationResult;
  context: PatternContext;
  successMetrics: SuccessMetrics;
  applicability: ApplicabilityScope;
  learnedInsights: string[];
  archivedAt: Date;
}

export interface PatternContext {
  systemState: Record<string, any>;
  environmentConditions: string[];
  targetTypes: string[];
  problemDomain: string;
  scalabilityFactors: Record<string, number>;
}

export interface SuccessMetrics {
  fitnessScore: number;
  improvementPercentage: number;
  executionTime: number;
  riskMitigation: number;
  repeatability: number;
  scalability: number;
}

export interface ApplicabilityScope {
  fileTypes: string[];
  projectSizes: string[];
  riskProfiles: string[];
  environmentTypes: string[];
  constraints: string[];
}

export interface PatternQuery {
  minFitnessScore?: number;
  maxRisk?: number;
  fileTypes?: string[];
  problemDomain?: string;
  similarContext?: Record<string, any>;
  limit?: number;
}

/**
 * Pattern Archive for storing and retrieving successful evolutionary strategies
 */
export class DGMPatternArchive extends EventEmitter {
  private logger: Logger;
  private archivePath: string;
  private patterns: Map<string, ArchivedPattern> = new Map();
  private indexByDomain: Map<string, string[]> = new Map();
  private indexByFileType: Map<string, string[]> = new Map();
  private indexByFitness: Array<{ id: string; fitness: number }> = [];

  constructor(archivePath: string = './data/dgm-patterns') {
    super();
    this.archivePath = archivePath;
    this.logger = new Logger('DGMPatternArchive');
    
    this.initializeArchive();
  }

  /**
   * Initialize the pattern archive
   */
  private async initializeArchive(): Promise<void> {
    try {
      await fs.mkdir(this.archivePath, { recursive: true });
      await this.loadExistingPatterns();
      
      this.logger.info('Pattern archive initialized', {
        archivePath: this.archivePath,
        patternsLoaded: this.patterns.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize pattern archive', { error });
    }
  }

  /**
   * Archive a successful pattern
   */
  async archivePattern(
    strategy: EvolutionStrategy,
    validation: ValidationResult,
    context: PatternContext
  ): Promise<ArchivedPattern> {
    const patternId = `pattern-${strategy.id}-${Date.now()}`;
    
    // Calculate success metrics
    const successMetrics: SuccessMetrics = {
      fitnessScore: strategy.fitness,
      improvementPercentage: validation.metrics.improvement || 0,
      executionTime: Date.now() - strategy.timestamp.getTime(),
      riskMitigation: this.calculateRiskMitigation(strategy, validation),
      repeatability: this.assessRepeatability(strategy),
      scalability: this.assessScalability(strategy, context)
    };

    // Determine applicability scope
    const applicability: ApplicabilityScope = {
      fileTypes: this.extractFileTypes(strategy, context),
      projectSizes: this.determineProjectSizes(context),
      riskProfiles: this.determineRiskProfiles(strategy),
      environmentTypes: context.environmentConditions,
      constraints: this.extractConstraints(strategy, validation)
    };

    // Generate learned insights
    const learnedInsights = this.generateInsights(strategy, validation, context);

    const pattern: ArchivedPattern = {
      id: patternId,
      strategy,
      validation,
      context,
      successMetrics,
      applicability,
      learnedInsights,
      archivedAt: new Date()
    };

    // Store pattern
    this.patterns.set(patternId, pattern);
    await this.persistPattern(pattern);
    
    // Update indices
    this.updateIndices(pattern);

    this.logger.info('Pattern archived', {
      id: patternId,
      fitnessScore: successMetrics.fitnessScore,
      domain: context.problemDomain,
      insights: learnedInsights.length
    });

    this.emit('pattern_archived', pattern);
    return pattern;
  }

  /**
   * Query patterns based on criteria
   */
  async queryPatterns(query: PatternQuery): Promise<ArchivedPattern[]> {
    let candidates = Array.from(this.patterns.values());

    // Filter by fitness score
    if (query.minFitnessScore !== undefined) {
      candidates = candidates.filter(p => p.successMetrics.fitnessScore >= query.minFitnessScore!);
    }

    // Filter by max risk
    if (query.maxRisk !== undefined) {
      candidates = candidates.filter(p => {
        const avgRisk = p.strategy.parameters.targets?.reduce((sum: number, t: any) => sum + t.riskLevel, 0) / (p.strategy.parameters.targets?.length || 1) || 0;
        return avgRisk <= query.maxRisk!;
      });
    }

    // Filter by file types
    if (query.fileTypes?.length) {
      candidates = candidates.filter(p => 
        query.fileTypes!.some(type => p.applicability.fileTypes.includes(type))
      );
    }

    // Filter by problem domain
    if (query.problemDomain) {
      candidates = candidates.filter(p => 
        p.context.problemDomain === query.problemDomain
      );
    }

    // Filter by context similarity
    if (query.similarContext) {
      candidates = candidates.filter(p => 
        this.calculateContextSimilarity(p.context.systemState, query.similarContext!) > 0.7
      );
    }

    // Sort by fitness score
    candidates.sort((a, b) => b.successMetrics.fitnessScore - a.successMetrics.fitnessScore);

    // Apply limit
    if (query.limit) {
      candidates = candidates.slice(0, query.limit);
    }

    this.logger.debug('Pattern query completed', {
      queryParams: query,
      candidatesFound: candidates.length
    });

    return candidates;
  }

  /**
   * Get pattern recommendations for a specific strategy
   */
  async getPatternRecommendations(
    currentStrategy: EvolutionStrategy,
    context: PatternContext
  ): Promise<string[]> {
    const similarPatterns = await this.queryPatterns({
      problemDomain: context.problemDomain,
      similarContext: context.systemState,
      minFitnessScore: 0.5,
      limit: 5
    });

    const recommendations: string[] = [];

    if (similarPatterns.length === 0) {
      recommendations.push('No similar patterns found - proceeding with experimental strategy');
      return recommendations;
    }

    // Analyze successful patterns for recommendations
    const avgFitness = similarPatterns.reduce((sum, p) => sum + p.successMetrics.fitnessScore, 0) / similarPatterns.length;
    recommendations.push(`Found ${similarPatterns.length} similar patterns with average fitness: ${avgFitness.toFixed(2)}`);

    // Parameter recommendations
    const successfulMutationRates = similarPatterns
      .map(p => p.strategy.parameters.mutationRate)
      .filter(rate => typeof rate === 'number') as number[];
    
    if (successfulMutationRates.length > 0) {
      const avgMutationRate = successfulMutationRates.reduce((a, b) => a + b, 0) / successfulMutationRates.length;
      recommendations.push(`Recommended mutation rate: ${avgMutationRate.toFixed(2)} (based on ${successfulMutationRates.length} successful patterns)`);
    }

    // Approach recommendations
    const approaches = new Map<string, number>();
    similarPatterns.forEach(p => {
      const approach = p.strategy.parameters.approach;
      if (approach) {
        approaches.set(approach, (approaches.get(approach) || 0) + 1);
      }
    });

    if (approaches.size > 0) {
      const topApproach = Array.from(approaches.entries())
        .sort(([,a], [,b]) => b - a)[0];
      recommendations.push(`Most successful approach: ${topApproach[0]} (used in ${topApproach[1]}/${similarPatterns.length} patterns)`);
    }

    // Risk recommendations
    const riskLevels = similarPatterns.map(p => {
      const targets = p.strategy.parameters.targets || [];
      return targets.reduce((sum: number, t: any) => sum + (t.riskLevel || 0), 0) / (targets.length || 1);
    });

    if (riskLevels.length > 0) {
      const avgRisk = riskLevels.reduce((a, b) => a + b, 0) / riskLevels.length;
      recommendations.push(`Recommended risk threshold: ${avgRisk.toFixed(2)} (optimal balance from successful patterns)`);
    }

    // Insight-based recommendations
    const allInsights = similarPatterns.flatMap(p => p.learnedInsights);
    const insightCounts = new Map<string, number>();
    
    allInsights.forEach(insight => {
      insightCounts.set(insight, (insightCounts.get(insight) || 0) + 1);
    });

    const topInsights = Array.from(insightCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([insight, count]) => `${insight} (seen in ${count} patterns)`);

    recommendations.push(...topInsights);

    return recommendations;
  }

  /**
   * Generate evolutionary insights from archived patterns
   */
  async generateEvolutionaryInsights(): Promise<string[]> {
    if (this.patterns.size < 5) {
      return ['Insufficient patterns for meaningful evolutionary insights'];
    }

    const insights: string[] = [];
    const patterns = Array.from(this.patterns.values());

    // Fitness evolution trend
    const sortedByTime = patterns.sort((a, b) => a.archivedAt.getTime() - b.archivedAt.getTime());
    const recentPatterns = sortedByTime.slice(-Math.min(10, patterns.length));
    const earlyPatterns = sortedByTime.slice(0, Math.min(10, patterns.length));

    const recentAvgFitness = recentPatterns.reduce((sum, p) => sum + p.successMetrics.fitnessScore, 0) / recentPatterns.length;
    const earlyAvgFitness = earlyPatterns.reduce((sum, p) => sum + p.successMetrics.fitnessScore, 0) / earlyPatterns.length;

    if (recentAvgFitness > earlyAvgFitness) {
      const improvement = ((recentAvgFitness - earlyAvgFitness) / earlyAvgFitness) * 100;
      insights.push(`System evolution is improving: ${improvement.toFixed(1)}% fitness increase over time`);
    } else {
      insights.push('System evolution has plateaued - consider diversifying strategy parameters');
    }

    // Domain-specific insights
    const domainGroups = new Map<string, ArchivedPattern[]>();
    patterns.forEach(p => {
      const domain = p.context.problemDomain;
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(p);
    });

    for (const [domain, domainPatterns] of domainGroups.entries()) {
      if (domainPatterns.length >= 3) {
        const avgFitness = domainPatterns.reduce((sum, p) => sum + p.successMetrics.fitnessScore, 0) / domainPatterns.length;
        const bestPattern = domainPatterns.sort((a, b) => b.successMetrics.fitnessScore - a.successMetrics.fitnessScore)[0];
        
        insights.push(`${domain} domain: Average fitness ${avgFitness.toFixed(2)}, best approach: ${bestPattern.strategy.parameters.approach}`);
      }
    }

    // Risk vs reward analysis
    const riskRewardData = patterns.map(p => ({
      risk: this.calculateAverageRisk(p.strategy),
      reward: p.successMetrics.fitnessScore
    }));

    const lowRiskHighReward = riskRewardData.filter(d => d.risk < 0.3 && d.reward > 0.7);
    if (lowRiskHighReward.length > 0) {
      insights.push(`${lowRiskHighReward.length} patterns achieved high reward (>0.7) with low risk (<0.3) - conservative approaches can be highly effective`);
    }

    // Repeatability insights
    const highRepeatability = patterns.filter(p => p.successMetrics.repeatability > 0.8);
    if (highRepeatability.length > 0) {
      insights.push(`${highRepeatability.length} patterns show high repeatability - these strategies are reliable for similar contexts`);
    }

    return insights;
  }

  /**
   * Export patterns for analysis or backup
   */
  async exportPatterns(format: 'json' | 'csv' = 'json'): Promise<string> {
    const patterns = Array.from(this.patterns.values());

    if (format === 'json') {
      return JSON.stringify(patterns, null, 2);
    }

    // CSV format
    const headers = [
      'id', 'strategy_name', 'fitness_score', 'problem_domain', 
      'mutation_rate', 'approach', 'improvement_percentage', 
      'risk_mitigation', 'repeatability', 'archived_at'
    ];

    let csv = headers.join(',') + '\n';

    for (const pattern of patterns) {
      const row = [
        pattern.id,
        pattern.strategy.name,
        pattern.successMetrics.fitnessScore,
        pattern.context.problemDomain,
        pattern.strategy.parameters.mutationRate || '',
        pattern.strategy.parameters.approach || '',
        pattern.successMetrics.improvementPercentage,
        pattern.successMetrics.riskMitigation,
        pattern.successMetrics.repeatability,
        pattern.archivedAt.toISOString()
      ];

      csv += row.join(',') + '\n';
    }

    return csv;
  }

  // Private helper methods

  private async loadExistingPatterns(): Promise<void> {
    try {
      const files = await fs.readdir(this.archivePath);
      const patternFiles = files.filter(f => f.endsWith('.json'));

      for (const file of patternFiles) {
        try {
          const filePath = path.join(this.archivePath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const pattern: ArchivedPattern = JSON.parse(content);
          
          this.patterns.set(pattern.id, pattern);
          this.updateIndices(pattern);
        } catch (error) {
          this.logger.warn(`Failed to load pattern file: ${file}`, { error });
        }
      }
    } catch (error) {
      // Archive directory doesn't exist yet, will be created
      this.logger.debug('No existing patterns found');
    }
  }

  private async persistPattern(pattern: ArchivedPattern): Promise<void> {
    const filePath = path.join(this.archivePath, `${pattern.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(pattern, null, 2));
  }

  private updateIndices(pattern: ArchivedPattern): void {
    // Update domain index
    const domain = pattern.context.problemDomain;
    if (!this.indexByDomain.has(domain)) {
      this.indexByDomain.set(domain, []);
    }
    this.indexByDomain.get(domain)!.push(pattern.id);

    // Update file type index
    for (const fileType of pattern.applicability.fileTypes) {
      if (!this.indexByFileType.has(fileType)) {
        this.indexByFileType.set(fileType, []);
      }
      this.indexByFileType.get(fileType)!.push(pattern.id);
    }

    // Update fitness index
    this.indexByFitness.push({
      id: pattern.id,
      fitness: pattern.successMetrics.fitnessScore
    });
    this.indexByFitness.sort((a, b) => b.fitness - a.fitness);

    // Maintain index size limits
    if (this.indexByFitness.length > 1000) {
      this.indexByFitness = this.indexByFitness.slice(0, 1000);
    }
  }

  private calculateRiskMitigation(strategy: EvolutionStrategy, validation: ValidationResult): number {
    const targets = strategy.parameters.targets || [];
    const avgRisk = targets.reduce((sum: number, t: any) => sum + (t.riskLevel || 0), 0) / (targets.length || 1);
    const successScore = validation.score / 100;
    
    // Higher mitigation score for lower risk and higher success
    return Math.max(0, 1 - avgRisk) * successScore;
  }

  private assessRepeatability(strategy: EvolutionStrategy): number {
    // Simple heuristic based on strategy parameters
    const approach = strategy.parameters.approach;
    const mutationRate = strategy.parameters.mutationRate;
    
    let repeatability = 0.5; // Base score
    
    if (approach === 'incremental' || approach === 'conservative') {
      repeatability += 0.3;
    }
    
    if (typeof mutationRate === 'number' && mutationRate < 0.3) {
      repeatability += 0.2;
    }
    
    return Math.min(1, repeatability);
  }

  private assessScalability(strategy: EvolutionStrategy, context: PatternContext): number {
    const scalabilityFactors = context.scalabilityFactors;
    
    if (!scalabilityFactors || Object.keys(scalabilityFactors).length === 0) {
      return 0.5; // Unknown scalability
    }
    
    const avgScalability = Object.values(scalabilityFactors)
      .reduce((sum, factor) => sum + factor, 0) / Object.keys(scalabilityFactors).length;
    
    return Math.max(0, Math.min(1, avgScalability));
  }

  private extractFileTypes(strategy: EvolutionStrategy, context: PatternContext): string[] {
    const fileTypes = new Set<string>();
    
    // Extract from targets
    const targets = strategy.parameters.targets || [];
    for (const target of targets) {
      if (target.type === 'file' && target.path) {
        const ext = path.extname(target.path).toLowerCase();
        if (ext) fileTypes.add(ext);
      }
    }
    
    // Extract from context
    if (context.targetTypes) {
      for (const type of context.targetTypes) {
        fileTypes.add(type);
      }
    }
    
    return Array.from(fileTypes);
  }

  private determineProjectSizes(context: PatternContext): string[] {
    const scalability = context.scalabilityFactors?.projectSize || 0.5;
    
    if (scalability < 0.3) return ['small'];
    if (scalability < 0.7) return ['small', 'medium'];
    return ['small', 'medium', 'large'];
  }

  private determineRiskProfiles(strategy: EvolutionStrategy): string[] {
    const targets = strategy.parameters.targets || [];
    const avgRisk = targets.reduce((sum: number, t: any) => sum + (t.riskLevel || 0), 0) / (targets.length || 1);
    
    if (avgRisk < 0.3) return ['low-risk'];
    if (avgRisk < 0.7) return ['low-risk', 'medium-risk'];
    return ['low-risk', 'medium-risk', 'high-risk'];
  }

  private extractConstraints(strategy: EvolutionStrategy, validation: ValidationResult): string[] {
    const constraints: string[] = [];
    
    if (strategy.parameters.rollbackAfter) {
      constraints.push(`rollback_after_${strategy.parameters.rollbackAfter}`);
    }
    
    if (validation.errors.length === 0) {
      constraints.push('error_free');
    }
    
    if (validation.score > 90) {
      constraints.push('high_performance');
    }
    
    return constraints;
  }

  private generateInsights(
    strategy: EvolutionStrategy,
    validation: ValidationResult,
    context: PatternContext
  ): string[] {
    const insights: string[] = [];
    
    // Performance insights
    if (validation.metrics.improvement && validation.metrics.improvement > 10) {
      insights.push(`Significant performance improvement: +${validation.metrics.improvement}%`);
    }
    
    // Risk insights
    const targets = strategy.parameters.targets || [];
    const avgRisk = targets.reduce((sum: number, t: any) => sum + (t.riskLevel || 0), 0) / (targets.length || 1);
    
    if (avgRisk < 0.3 && validation.score > 80) {
      insights.push('Low-risk strategies can achieve high success rates');
    }
    
    // Approach insights
    if (strategy.parameters.approach === 'incremental' && validation.errors.length === 0) {
      insights.push('Incremental approach reduces error risk');
    }
    
    // Context insights
    if (context.environmentConditions.includes('production') && validation.passed) {
      insights.push('Strategy suitable for production environments');
    }
    
    return insights;
  }

  private calculateContextSimilarity(context1: Record<string, any>, context2: Record<string, any>): number {
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    let total = 0;
    
    for (const key of allKeys) {
      total++;
      
      const val1 = context1[key];
      const val2 = context2[key];
      
      if (val1 === val2) {
        matches++;
      } else if (typeof val1 === 'number' && typeof val2 === 'number') {
        const similarity = 1 - Math.abs(val1 - val2) / Math.max(Math.abs(val1), Math.abs(val2), 1);
        matches += similarity;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  private calculateAverageRisk(strategy: EvolutionStrategy): number {
    const targets = strategy.parameters.targets || [];
    if (targets.length === 0) return 0.5;
    
    return targets.reduce((sum: number, t: any) => sum + (t.riskLevel || 0), 0) / targets.length;
  }
}
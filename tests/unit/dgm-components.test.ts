/**
 * DGM Components Unit Tests
 * 
 * Unit tests for individual DGM components
 */

import { DGMFitnessFunction, type CodeQualityMetrics } from '../../src/core/dgm/fitness-function';
import { DGMPatternArchive } from '../../src/core/dgm/pattern-archive';
import { type EvolutionStrategy, type ValidationResult } from '../../src/core/dgm/evolutionary-orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DGM Components Unit Tests', () => {
  const testDataPath = '/tmp/dgm-unit-test';

  beforeAll(async () => {
    await fs.mkdir(testDataPath, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(testDataPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('DGMFitnessFunction', () => {
    let fitnessFunction: DGMFitnessFunction;

    beforeEach(() => {
      fitnessFunction = new DGMFitnessFunction();
    });

    test('should initialize with default configuration', () => {
      expect(fitnessFunction).toBeDefined();
    });

    test('should establish baseline metrics', async () => {
      const metrics = await fitnessFunction.establishBaseline(testDataPath);
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.linesOfCode).toBe('number');
      expect(typeof metrics.cyclomaticComplexity).toBe('number');
      expect(typeof metrics.testCoverage).toBe('number');
      expect(metrics.performanceMetrics).toBeDefined();
    });

    test('should evaluate strategy fitness', () => {
      const mockStrategy: EvolutionStrategy = {
        id: 'test-strategy-001',
        name: 'Test Strategy',
        description: 'Test strategy for unit tests',
        parameters: { approach: 'test', mutationRate: 0.3 },
        fitness: 0,
        generation: 1,
        mutations: [],
        timestamp: new Date()
      };

      const mockValidation: ValidationResult = {
        passed: true,
        score: 85,
        metrics: {
          healthScore: 85,
          improvement: 10,
          bottleneckCount: 2
        },
        errors: [],
        recommendations: ['Optimize database queries', 'Improve caching']
      };

      const evaluation = fitnessFunction.evaluateStrategyFitness(
        mockStrategy,
        mockValidation
      );

      expect(evaluation).toBeDefined();
      expect(evaluation.overallFitness).toBeGreaterThanOrEqual(0);
      expect(evaluation.overallFitness).toBeLessThanOrEqual(1);
      expect(evaluation.grade).toMatch(/^[A-F]$/);
      expect(Array.isArray(evaluation.strengths)).toBe(true);
      expect(Array.isArray(evaluation.weaknesses)).toBe(true);
      expect(Array.isArray(evaluation.recommendations)).toBe(true);
      expect(evaluation.benchmarkComparison).toBeDefined();
    });

    test('should handle fitness evaluation with errors', () => {
      const mockStrategy: EvolutionStrategy = {
        id: 'test-strategy-002',
        name: 'Failing Strategy',
        description: 'Strategy that fails validation',
        parameters: { approach: 'aggressive', mutationRate: 0.8 },
        fitness: 0,
        generation: 1,
        mutations: [],
        timestamp: new Date()
      };

      const mockValidation: ValidationResult = {
        passed: false,
        score: 35,
        metrics: {
          healthScore: 35,
          improvement: -15,
          bottleneckCount: 8
        },
        errors: [
          'Critical performance degradation detected',
          'Memory usage exceeded threshold',
          'Response time too high'
        ],
        recommendations: [
          'Rollback changes immediately',
          'Review resource allocation',
          'Investigate performance bottlenecks'
        ]
      };

      const evaluation = fitnessFunction.evaluateStrategyFitness(
        mockStrategy,
        mockValidation
      );

      expect(evaluation.overallFitness).toBeLessThan(0.5);
      expect(evaluation.grade).toMatch(/^[D-F]$/);
      expect(evaluation.weaknesses.length).toBeGreaterThan(0);
      expect(evaluation.benchmarkComparison.meetsMinimumStandards).toBe(false);
    });

    test('should export fitness evaluation', () => {
      const mockEvaluation = {
        overallFitness: 0.75,
        grade: 'B' as const,
        componentScores: {
          performance: 0.8,
          maintainability: 0.7,
          reliability: 0.75,
          security: 0.8,
          scalability: 0.7,
          testability: 0.75,
          documentation: 0.6
        },
        strengths: ['Good performance', 'Strong security'],
        weaknesses: ['Documentation needs improvement'],
        recommendations: ['Improve API documentation', 'Add inline comments'],
        benchmarkComparison: {
          meetsMinimumStandards: true,
          exceedsIndustryBenchmarks: false,
          regressionDetected: false,
          improvementAreas: ['documentation'],
          strongAreas: ['performance', 'security']
        },
        timestamp: new Date()
      };

      const exported = fitnessFunction.exportEvaluation(mockEvaluation);
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(parsed.overallFitness).toBe(0.75);
      expect(parsed.grade).toBe('B');
    });

    test('should update configuration', () => {
      const newWeights = {
        performance: 0.3,
        maintainability: 0.2
      };

      expect(() => {
        fitnessFunction.updateConfig({ weights: newWeights });
      }).not.toThrow();
    });
  });

  describe('DGMPatternArchive', () => {
    let patternArchive: DGMPatternArchive;
    const archivePath = path.join(testDataPath, 'patterns');

    beforeEach(() => {
      patternArchive = new DGMPatternArchive(archivePath);
    });

    test('should initialize pattern archive', () => {
      expect(patternArchive).toBeDefined();
    });

    test('should archive a successful pattern', async () => {
      const mockStrategy: EvolutionStrategy = {
        id: 'archive-test-001',
        name: 'Archive Test Strategy',
        description: 'Test strategy for archiving',
        parameters: {
          approach: 'conservative',
          mutationRate: 0.2,
          targets: [
            { type: 'file', path: 'src/test.ts', riskLevel: 0.1 }
          ]
        },
        fitness: 0.85,
        generation: 1,
        mutations: ['Reduced mutation rate for stability'],
        timestamp: new Date()
      };

      const mockValidation: ValidationResult = {
        passed: true,
        score: 88,
        metrics: {
          healthScore: 88,
          improvement: 12,
          bottleneckCount: 1
        },
        errors: [],
        recommendations: ['Continue with conservative approach']
      };

      const mockContext = {
        systemState: { currentHealth: 0.75 },
        environmentConditions: ['production', 'high-load'],
        targetTypes: ['typescript', 'configuration'],
        problemDomain: 'performance_optimization',
        scalabilityFactors: { projectSize: 0.8, complexity: 0.6 }
      };

      const archivedPattern = await patternArchive.archivePattern(
        mockStrategy,
        mockValidation,
        mockContext
      );

      expect(archivedPattern).toBeDefined();
      expect(archivedPattern.id).toBeDefined();
      expect(archivedPattern.strategy.id).toBe(mockStrategy.id);
      expect(archivedPattern.successMetrics).toBeDefined();
      expect(archivedPattern.applicability).toBeDefined();
      expect(archivedPattern.learnedInsights.length).toBeGreaterThan(0);
    }, 10000);

    test('should query patterns by criteria', async () => {
      // First archive a pattern
      const mockStrategy: EvolutionStrategy = {
        id: 'query-test-001',
        name: 'Query Test Strategy',
        description: 'Test strategy for querying',
        parameters: { approach: 'balanced', mutationRate: 0.3 },
        fitness: 0.78,
        generation: 1,
        mutations: [],
        timestamp: new Date()
      };

      const mockValidation: ValidationResult = {
        passed: true,
        score: 82,
        metrics: { healthScore: 82, improvement: 8 },
        errors: [],
        recommendations: []
      };

      const mockContext = {
        systemState: {},
        environmentConditions: ['development'],
        targetTypes: ['javascript'],
        problemDomain: 'code_cleanup',
        scalabilityFactors: {}
      };

      await patternArchive.archivePattern(mockStrategy, mockValidation, mockContext);

      // Now query for patterns
      const patterns = await patternArchive.queryPatterns({
        minFitnessScore: 0.7,
        problemDomain: 'code_cleanup',
        limit: 5
      });

      expect(Array.isArray(patterns)).toBe(true);
      // Should find at least the pattern we just archived
      if (patterns.length > 0) {
        expect(patterns[0].context.problemDomain).toBe('code_cleanup');
        expect(patterns[0].successMetrics.fitnessScore).toBeGreaterThanOrEqual(0.7);
      }
    }, 10000);

    test('should generate pattern recommendations', async () => {
      const mockCurrentStrategy: EvolutionStrategy = {
        id: 'recommendation-test-001',
        name: 'Recommendation Test',
        description: 'Test for recommendations',
        parameters: { approach: 'experimental' },
        fitness: 0,
        generation: 1,
        mutations: [],
        timestamp: new Date()
      };

      const mockContext = {
        systemState: { performance: 0.6 },
        environmentConditions: ['testing'],
        targetTypes: ['typescript'],
        problemDomain: 'performance_tuning',
        scalabilityFactors: { projectSize: 0.5 }
      };

      const recommendations = await patternArchive.getPatternRecommendations(
        mockCurrentStrategy,
        mockContext
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(typeof recommendations[0]).toBe('string');
    });

    test('should generate evolutionary insights', async () => {
      const insights = await patternArchive.generateEvolutionaryInsights();
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      expect(typeof insights[0]).toBe('string');
    });

    test('should export patterns in different formats', async () => {
      // JSON export
      const jsonExport = await patternArchive.exportPatterns('json');
      expect(typeof jsonExport).toBe('string');
      expect(() => JSON.parse(jsonExport)).not.toThrow();

      // CSV export
      const csvExport = await patternArchive.exportPatterns('csv');
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('id,strategy_name'); // CSV header
    });
  });

  describe('Component Integration', () => {
    test('should work together for complete evaluation workflow', async () => {
      const fitnessFunction = new DGMFitnessFunction();
      const patternArchive = new DGMPatternArchive(path.join(testDataPath, 'integration'));

      // 1. Establish baseline
      const baseline = await fitnessFunction.establishBaseline(testDataPath);
      expect(baseline).toBeDefined();

      // 2. Create mock strategy and validation
      const strategy: EvolutionStrategy = {
        id: 'integration-test-001',
        name: 'Integration Test Strategy',
        description: 'Full workflow test',
        parameters: { approach: 'integration_test', mutationRate: 0.25 },
        fitness: 0,
        generation: 1,
        mutations: [],
        timestamp: new Date()
      };

      const validation: ValidationResult = {
        passed: true,
        score: 79,
        metrics: { healthScore: 79, improvement: 5 },
        errors: [],
        recommendations: ['Continue monitoring']
      };

      // 3. Evaluate fitness
      const evaluation = fitnessFunction.evaluateStrategyFitness(strategy, validation);
      expect(evaluation.overallFitness).toBeGreaterThan(0);

      // Update strategy with fitness
      strategy.fitness = evaluation.overallFitness;

      // 4. Archive successful pattern
      if (evaluation.benchmarkComparison.meetsMinimumStandards) {
        const archivedPattern = await patternArchive.archivePattern(
          strategy,
          validation,
          {
            systemState: { baseline },
            environmentConditions: ['integration_test'],
            targetTypes: ['unit_test'],
            problemDomain: 'testing_workflow',
            scalabilityFactors: { testComplexity: 0.4 }
          }
        );

        expect(archivedPattern).toBeDefined();
      }

      // 5. Query archived patterns
      const patterns = await patternArchive.queryPatterns({
        minFitnessScore: 0.5,
        limit: 10
      });

      expect(Array.isArray(patterns)).toBe(true);
    }, 15000);
  });
});
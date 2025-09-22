/**
 * DGM (Darwin Gödel Machine) Module
 * 
 * Evolutionary cleanup and self-improving system implementation for Gemini Flow.
 * Provides comprehensive evolutionary strategies, pattern archiving, autonomous monitoring,
 * and fitness evaluation for continuous system improvement.
 */

import { DGMSystemCoordinator } from './dgm-coordinator.js';

export { 
  DGMEvolutionaryOrchestrator,
  type DGMConfig,
  type EvolutionStrategy,
  type ValidationResult,
  type CleanupTarget
} from './evolutionary-orchestrator.js';

export {
  DGMPatternArchive,
  type ArchivedPattern,
  type PatternContext,
  type SuccessMetrics,
  type ApplicabilityScope,
  type PatternQuery
} from './pattern-archive.js';

export {
  DGMAutonomousMonitor,
  type MonitoringConfig,
  type DebtMetrics,
  type MonitoringAlert,
  type EvolutionTrigger
} from './autonomous-monitor.js';

export {
  DGMFitnessFunction,
  type FitnessConfig,
  type FitnessEvaluation,
  type ComponentScores,
  type CodeQualityMetrics
} from './fitness-function.js';

export {
  DGMSystemCoordinator,
  type DGMSystemConfig,
  type DGMSystemStatus,
  type DGMEvolutionReport
} from './dgm-coordinator.js';

/**
 * Create a complete DGM system with default configuration
 */
/**
 * Create a complete DGM system with default configuration
 */
export function createDGMSystem(projectPath: string, options?: {
  evolutionCycles?: number;
  fitnessThreshold?: number;
  autoEvolutionEnabled?: boolean;
  scanInterval?: number;
}) {
  const config = {
    projectPath,
    evolution: {
      projectID: 'gemini-flow-dgm',
      evolutionCycles: options?.evolutionCycles || 10,
      fitnessThreshold: options?.fitnessThreshold || 0.7,
      mutationRate: 0.3,
      selectionPressure: 0.6,
      archiveSize: 50,
      rollbackEnabled: true
    },
    monitoring: {
      scanInterval: options?.scanInterval || 60000, // 1 minute
      debtThreshold: 0.7,
      preventiveThreshold: 0.5,
      emergencyThreshold: 0.9,
      autoEvolutionEnabled: options?.autoEvolutionEnabled || false,
      maxConcurrentEvolutions: 2,
      cooldownPeriod: 300000 // 5 minutes
    },
    fitness: {
      weights: {
        performance: 0.20,
        maintainability: 0.18,
        reliability: 0.16,
        security: 0.14,
        scalability: 0.12,
        testability: 0.12,
        documentation: 0.08
      },
      thresholds: {
        excellent: 0.90,
        good: 0.75,
        acceptable: 0.60,
        poor: 0.40
      },
      benchmarks: {
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
      },
      penalties: {
        regressionPenalty: 0.2,
        complexityPenalty: 0.15,
        securityRiskPenalty: 0.3,
        maintainabilityPenalty: 0.1,
        testCoveragePenalty: 0.15
      }
    },
    enableAutonomousMode: options?.autoEvolutionEnabled || false,
    experimentalFeatures: []
  };
  
  return new DGMSystemCoordinator(config);
}

/**
 * DGM System Factory with preset configurations
 */
export class DGMSystemFactory {
  /**
   * Create a conservative DGM system (low risk, high stability)
   */
  static createConservative(projectPath: string) {
    return createDGMSystem(projectPath, {
      evolutionCycles: 5,
      fitnessThreshold: 0.8,
      autoEvolutionEnabled: false,
      scanInterval: 120000 // 2 minutes
    });
  }

  /**
   * Create an aggressive DGM system (high evolution rate, autonomous)
   */
  static createAggressive(projectPath: string) {
    return createDGMSystem(projectPath, {
      evolutionCycles: 20,
      fitnessThreshold: 0.6,
      autoEvolutionEnabled: true,
      scanInterval: 30000 // 30 seconds
    });
  }

  /**
   * Create a balanced DGM system (default configuration)
   */
  static createBalanced(projectPath: string) {
    return createDGMSystem(projectPath);
  }

  /**
   * Create a research-focused DGM system (extensive pattern analysis)
   */
  static createResearch(projectPath: string) {
    return createDGMSystem(projectPath, {
      evolutionCycles: 15,
      fitnessThreshold: 0.5, // Lower threshold for more data collection
      autoEvolutionEnabled: false, // Manual control for research
      scanInterval: 60000
    });
  }
}
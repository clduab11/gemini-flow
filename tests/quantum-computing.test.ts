/**
 * Comprehensive Test Suite for Quantum Computing Methods
 * 
 * Tests quantum algorithms, error correction, hybrid processing,
 * and performance benchmarking capabilities.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import QuantumComputingMethodsService from '../src/services/quantum-computing-methods';
import { QuantumClassicalHybridService, QuantumPerformanceBenchmark } from '../src/services/quantum-classical-hybrid';
import { 
  QuantumAlgorithmConfig, 
  QuantumMLPipeline, 
  QuantumAdvantageMetrics 
} from '../src/services/quantum-computing-methods';

describe('Quantum Computing Methods', () => {
  let quantumService: QuantumComputingMethodsService;
  let hybridService: QuantumClassicalHybridService;
  let benchmark: QuantumPerformanceBenchmark;

  beforeEach(() => {
    quantumService = new QuantumComputingMethodsService();
    hybridService = new QuantumClassicalHybridService();
    benchmark = new QuantumPerformanceBenchmark(hybridService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Quantum Circuit Operations', () => {
    test('should create quantum circuit with specified qubits', async () => {
      const circuit = hybridService.quantumSimulator.createQuantumCircuit(3);
      
      expect(circuit.qubits).toBe(3);
      expect(circuit.gates).toEqual([]);
      expect(circuit.measurements).toEqual([]);
      expect(circuit.depth).toBe(0);
    });

    test('should apply quantum gates correctly', async () => {
      const circuit = hybridService.quantumSimulator.createQuantumCircuit(2);
      
      // Apply Hadamard gate
      const updatedCircuit = hybridService.quantumSimulator.applyGate(circuit, {
        type: 'H',
        qubits: [0]
      });
      
      expect(updatedCircuit.gates).toHaveLength(1);
      expect(updatedCircuit.gates[0].type).toBe('H');
      expect(updatedCircuit.gates[0].qubits).toEqual([0]);
    });

    test('should execute quantum circuit and return valid state', async () => {
      const circuit = hybridService.quantumSimulator.createQuantumCircuit(2);
      
      // Create superposition
      hybridService.quantumSimulator.applyGate(circuit, { type: 'H', qubits: [0] });
      hybridService.quantumSimulator.applyGate(circuit, { type: 'CNOT', qubits: [0, 1] });
      
      const state = await hybridService.quantumSimulator.executeCircuit(circuit);
      
      expect(state.superposition).toBeDefined();
      expect(state.entangled).toBe(true);
      expect(state.coherenceTime).toBeGreaterThan(0);
      expect(state.measurementReady).toBe(true);
    });

    test('should handle quantum noise models', async () => {
      const circuit = hybridService.quantumSimulator.createQuantumCircuit(2);
      hybridService.quantumSimulator.applyGate(circuit, { type: 'H', qubits: [0] });
      
      const noiseModel = {
        decoherenceRate: 0.01,
        gateErrorRate: 0.001,
        measurementErrorRate: 0.02,
        thermalNoise: 0.005,
        dephasing: 0.1
      };
      
      const state = await hybridService.quantumSimulator.executeCircuit(circuit, noiseModel);
      
      expect(state.coherenceTime).toBeLessThan(10000); // Reduced due to noise
      expect(state.measurementErrors).toBeGreaterThan(0);
    });
  });

  describe('Quantum Optimization Algorithms', () => {
    test('should solve optimization with QAOA', async () => {
      const problem = {
        type: 'combinatorial' as const,
        objective: (solution: number[]) => solution.reduce((sum, x) => sum + x * x, 0),
        constraints: [(solution: number[]) => solution.every(x => x >= 0 && x <= 1)],
        dimensions: 4
      };

      const config: QuantumAlgorithmConfig = {
        algorithm: 'QAOA',
        parameters: {
          layers: 3,
          iterations: 100
        },
        optimization: {
          target: 'accuracy',
          constraints: { maxTime: 5000 }
        }
      };

      const result = await quantumService.solveQuantumOptimization(problem, config);
      
      expect(result.solution).toHaveLength(4);
      expect(result.objectiveValue).toBeGreaterThanOrEqual(0);
      expect(result.convergenceHistory).toBeDefined();
      expect(result.quantumMetrics.entanglement).toBeDefined();
    });

    test('should solve optimization with VQE', async () => {
      const problem = {
        type: 'continuous' as const,
        objective: (solution: number[]) => solution.reduce((sum, x, i) => sum + Math.sin(x + i), 0),
        constraints: [],
        dimensions: 3
      };

      const config: QuantumAlgorithmConfig = {
        algorithm: 'VQE',
        parameters: {
          iterations: 50,
          qubits: 3
        },
        optimization: {
          target: 'speed',
          constraints: {}
        }
      };

      const result = await quantumService.solveQuantumOptimization(problem, config);
      
      expect(result.solution).toHaveLength(3);
      expect(result.quantumMetrics.groundStateEnergy).toBeDefined();
      expect(result.quantumMetrics.variationalParameters).toBeDefined();
    });

    test('should perform quantum annealing', async () => {
      const problem = {
        type: 'combinatorial' as const,
        objective: (solution: number[]) => -solution.reduce((sum, x, i) => sum + x * (i + 1), 0),
        constraints: [],
        dimensions: 5
      };

      const config: QuantumAlgorithmConfig = {
        algorithm: 'QuantumAnnealing',
        parameters: {
          iterations: 1000,
          qubits: 5
        },
        optimization: {
          target: 'resource_efficiency',
          constraints: { energyBudget: 100 }
        }
      };

      const result = await quantumService.solveQuantumOptimization(problem, config);
      
      expect(result.solution).toHaveLength(5);
      expect(result.quantumMetrics.finalTemperature).toBeLessThan(1000);
      expect(result.quantumMetrics.quantumFluctuations).toBeDefined();
    });
  });

  describe('Quantum Machine Learning', () => {
    test('should execute quantum ML pipeline with QNN', async () => {
      const data = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9],
        [0.2, 0.3, 0.4]
      ];
      const labels = [0, 1, 1, 0];

      const pipeline: QuantumMLPipeline = {
        preprocessing: {
          dataEncoding: 'amplitude',
          featureMapping: true,
          dimensionalityReduction: false
        },
        quantumProcessing: {
          algorithm: 'QNN',
          circuitDepth: 3,
          entanglementStrategy: 'linear'
        },
        postprocessing: {
          stateDecoding: 'measurement',
          classicalValidation: true,
          errorMitigation: true
        }
      };

      const result = await quantumService.executeQuantumMLPipeline(data, labels, pipeline);
      
      expect(result.model).toBeDefined();
      expect(result.performance.speedup).toBeGreaterThan(0);
      expect(result.performance.accuracyImprovement).toBeDefined();
      expect(result.results.quantumAdvantage).toBeDefined();
    });

    test('should train quantum SVM', async () => {
      const data = [
        [1, 0],
        [0, 1],
        [1, 1],
        [0, 0]
      ];
      const labels = [1, 1, 0, 0];

      const pipeline: QuantumMLPipeline = {
        preprocessing: {
          dataEncoding: 'angle',
          featureMapping: true,
          dimensionalityReduction: false
        },
        quantumProcessing: {
          algorithm: 'QSVM',
          circuitDepth: 2,
          entanglementStrategy: 'circular'
        },
        postprocessing: {
          stateDecoding: 'measurement',
          classicalValidation: false,
          errorMitigation: false
        }
      };

      const result = await quantumService.executeQuantumMLPipeline(data, labels, pipeline);
      
      expect(result.model.supportVectors).toBeDefined();
      expect(result.model.kernelType).toBeDefined();
      expect(result.model.predict).toBeInstanceOf(Function);
    });

    test('should perform quantum clustering', async () => {
      const data = [
        [1, 2],
        [1.5, 1.8],
        [5, 8],
        [8, 8],
        [1, 0.6],
        [9, 11]
      ];
      const labels = [0, 0, 1, 1, 0, 1]; // For clustering validation

      const pipeline: QuantumMLPipeline = {
        preprocessing: {
          dataEncoding: 'basis',
          featureMapping: false,
          dimensionalityReduction: true
        },
        quantumProcessing: {
          algorithm: 'QuantumClustering',
          circuitDepth: 4,
          entanglementStrategy: 'all_to_all'
        },
        postprocessing: {
          stateDecoding: 'tomography',
          classicalValidation: true,
          errorMitigation: true
        }
      };

      const result = await quantumService.executeQuantumMLPipeline(data, labels, pipeline);
      
      expect(result.model.clusters).toBeDefined();
      expect(result.model.centroids).toBeDefined();
      expect(result.model.quantumState).toBeDefined();
    });
  });

  describe('Quantum Simulation', () => {
    test('should simulate molecular system', async () => {
      const system = {
        type: 'molecular' as const,
        hamiltonian: [
          [1, 0.5, 0, 0],
          [0.5, 2, 0.3, 0],
          [0, 0.3, 1.5, 0.2],
          [0, 0, 0.2, 2.5]
        ],
        temperature: 300,
        observables: ['energy', 'magnetization']
      };

      const config = {
        method: 'variational' as const,
        precision: 1e-6,
        maxIterations: 100
      };

      const result = await quantumService.simulateQuantumSystem(system, config);
      
      expect(result.groundState).toBeDefined();
      expect(result.observableValues.energy).toBeDefined();
      expect(result.observableValues.magnetization).toBeDefined();
      expect(result.simulationMetrics.convergenceTime).toBeGreaterThan(0);
    });

    test('should simulate condensed matter system', async () => {
      const system = {
        type: 'condensed_matter' as const,
        hamiltonian: [
          [2, -1, 0, -1],
          [-1, 2, -1, 0],
          [0, -1, 2, -1],
          [-1, 0, -1, 2]
        ],
        observables: ['correlation', 'energy']
      };

      const config = {
        method: 'trotterization' as const,
        precision: 1e-4,
        maxIterations: 200
      };

      const result = await quantumService.simulateQuantumSystem(system, config);
      
      expect(result.excitedStates).toBeDefined();
      expect(result.simulationMetrics.fidelity).toBeGreaterThan(0.9);
      expect(result.simulationMetrics.errorEstimate).toBeLessThan(0.1);
    });
  });

  describe('Hybrid Quantum-Classical Processing', () => {
    test('should enhance AI with quantum feature enhancement', async () => {
      const classicalModel = {
        type: 'neural_network',
        layers: [10, 5, 1],
        accuracy: 0.85
      };

      const strategy = {
        type: 'feature_enhancement' as const,
        quantumLayers: 3,
        hybridArchitecture: 'sequential' as const
      };

      const result = await quantumService.enhanceAIWithQuantum(classicalModel, strategy);
      
      expect(result.enhancedModel.quantumFeatureLayer).toBe(true);
      expect(result.performanceGains.speedup).toBeGreaterThan(1);
      expect(result.recommendations).toContain('Current enhancement strategy (feature_enhancement) is performing well');
    });

    test('should enhance AI with optimization boost', async () => {
      const classicalModel = {
        type: 'gradient_descent',
        learningRate: 0.01,
        convergenceTime: 1000
      };

      const strategy = {
        type: 'optimization_boost' as const,
        quantumLayers: 2,
        hybridArchitecture: 'parallel' as const
      };

      const result = await quantumService.enhanceAIWithQuantum(classicalModel, strategy);
      
      expect(result.enhancedModel.quantumOptimizer).toBe(true);
      expect(result.enhancedModel.optimizationBoost).toBeDefined();
      expect(result.performanceGains.accuracyImprovement).toBeGreaterThan(0);
    });

    test('should add quantum uncertainty quantification', async () => {
      const classicalModel = {
        type: 'prediction_model',
        uncertainty: 0.15
      };

      const strategy = {
        type: 'uncertainty_quantification' as const,
        quantumLayers: 4,
        hybridArchitecture: 'interleaved' as const
      };

      const result = await quantumService.enhanceAIWithQuantum(classicalModel, strategy);
      
      expect(result.enhancedModel.quantumUncertainty).toBe(true);
      expect(result.enhancedModel.uncertaintyReduction).toBeDefined();
      expect(result.performanceGains.confidenceLevel).toBeGreaterThan(0.8);
    });
  });

  describe('Quantum Error Correction and Mitigation', () => {
    test('should apply zero noise extrapolation', async () => {
      const quantumResult = {
        measurement: 0.75,
        uncertainty: 0.1,
        errorRate: 0.05
      };

      const strategy = {
        technique: 'zero_noise_extrapolation' as const,
        parameters: {
          extrapolationOrders: [1, 2, 3],
          noiseScaling: [1, 1.5, 2]
        }
      };

      const result = await quantumService.mitigateQuantumErrors(quantumResult, strategy);
      
      expect(result.correctedResult.errorCorrected).toBe(true);
      expect(result.errorReduction).toBeGreaterThan(0);
      expect(result.confidenceImprovement).toBeGreaterThan(0);
    });

    test('should mitigate readout errors', async () => {
      const quantumResult = {
        counts: { '00': 450, '01': 50, '10': 30, '11': 470 },
        shots: 1000
      };

      const strategy = {
        technique: 'readout_error_mitigation' as const,
        parameters: {
          calibrationMatrix: [
            [0.95, 0.05],
            [0.03, 0.97]
          ]
        }
      };

      const result = await quantumService.mitigateQuantumErrors(quantumResult, strategy);
      
      expect(result.correctedResult.technique).toBe('readout_error_mitigation');
      expect(result.errorReduction).toBeCloseTo(0.25, 1);
    });

    test('should verify quantum symmetries', async () => {
      const quantumResult = {
        expectationValues: {
          'Z0': 0.8,
          'Z1': -0.3,
          'X0X1': 0.6
        }
      };

      const strategy = {
        technique: 'symmetry_verification' as const,
        parameters: {
          symmetryGroup: 'Z2',
          tolerance: 0.01
        }
      };

      const result = await quantumService.mitigateQuantumErrors(quantumResult, strategy);
      
      expect(result.correctedResult.symmetryVerified).toBe(true);
      expect(result.confidenceImprovement).toBeGreaterThan(0);
    });
  });

  describe('Quantum Advantage Detection', () => {
    test('should detect quantum advantage in optimization', async () => {
      const problemDescription = 'Combinatorial optimization with 20 variables';
      const expectedSpeedup = 1.5;

      const hasAdvantage = await quantumService.validateQuantumAdvantage(
        problemDescription,
        expectedSpeedup
      );
      
      expect(typeof hasAdvantage).toBe('boolean');
    });

    test('should analyze quantum advantage metrics', async () => {
      const problem = {
        type: 'sampling' as const,
        size: 8,
        parameters: {}
      };

      const result = await hybridService.detectQuantumAdvantage(problem);
      
      expect(result.combinedResult.hasQuantumAdvantage).toBeDefined();
      expect(result.combinedResult.speedupFactor).toBeGreaterThan(0);
      expect(result.combinedResult.qualityImprovement).toBeDefined();
      expect(result.combinedResult.confidence).toBeGreaterThan(0);
    });
  });

  describe('Quantum Feature Mapping', () => {
    test('should map classical data to quantum features', async () => {
      const data = [
        [0.1, 0.5, 0.8],
        [0.3, 0.7, 0.2],
        [0.9, 0.1, 0.6]
      ];

      const result = await hybridService.quantumFeatureMapping(data, 'amplitude');
      
      expect(result.combinedResult.mappedFeatures).toBeDefined();
      expect(result.combinedResult.qualityScore).toBeGreaterThan(0);
      expect(result.optimality).toBeGreaterThan(0);
    });

    test('should handle different encoding methods', async () => {
      const data = [[1, 0], [0, 1]];
      const encodingMethods = ['amplitude', 'angle', 'basis'] as const;

      for (const method of encodingMethods) {
        const result = await hybridService.quantumFeatureMapping(data, method);
        expect(result.combinedResult).toBeDefined();
      }
    });
  });

  describe('Performance Benchmarking', () => {
    test('should run comprehensive benchmark suite', async () => {
      const results = await quantumService.getBenchmarkResults();
      
      expect(results.portfolioOptimization).toBeDefined();
      expect(results.drugDiscovery).toBeDefined();
      expect(results.featureMapping).toBeDefined();
      expect(results.quantumAdvantage).toBeDefined();
      expect(results.summary.overallPerformance).toBeGreaterThan(0);
    });

    test('should benchmark portfolio optimization', async () => {
      const assets = Array(5).fill(null).map((_, i) => ({
        symbol: `ASSET${i}`,
        expectedReturn: 0.05 + Math.random() * 0.1,
        volatility: 0.1 + Math.random() * 0.2,
        correlation: Array(5).fill(null).map(() => Array(5).fill(null).map(() => Math.random() - 0.5))
      }));

      const input = {
        assets,
        constraints: {
          maxWeight: 0.4,
          minWeight: 0.05,
          riskTolerance: 0.2,
          targetReturn: 0.08
        },
        quantumParameters: {
          annealingTime: 1000,
          couplingStrength: 0.5,
          qubits: 3
        }
      };

      const result = await hybridService.optimizePortfolio(input);
      
      expect(result.optimality).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.errorCorrection).toBeDefined();
    });

    test('should benchmark drug discovery simulation', async () => {
      const molecules = Array(10).fill(null).map((_, i) => ({
        id: `MOL${i}`,
        smiles: `C${i}H${2*i+1}N`,
        properties: {
          molecularWeight: 150 + Math.random() * 200,
          logP: Math.random() * 4,
          tpsa: Math.random() * 100
        }
      }));

      const protein = {
        sequence: 'MKFLVLLFNILCLFPVLAA',
        structure: 'beta_sheet',
        bindingSites: [
          { x: 1.5, y: 2.3, z: 0.8 },
          { x: 4.2, y: 1.1, z: 3.7 }
        ]
      };

      const input = {
        targetProtein: protein,
        molecularLibrary: molecules,
        quantumSimulation: {
          basisSet: 'sto-3g',
          exchangeCorrelation: 'pbe',
          spinConfiguration: 'restricted'
        }
      };

      const result = await hybridService.discoverDrugCandidates(input);
      
      expect(result.optimality).toBeGreaterThan(0);
      expect(result.combinedResult).toBeDefined();
      expect(result.errorCorrection.quantumErrors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate quantum circuits with ML pipeline', async () => {
      // Create a quantum circuit
      const circuit = hybridService.quantumSimulator.createQuantumCircuit(4);
      
      // Apply quantum gates for feature encoding
      for (let i = 0; i < 4; i++) {
        hybridService.quantumSimulator.applyGate(circuit, { type: 'H', qubits: [i] });
      }
      
      // Add entanglement
      for (let i = 0; i < 3; i++) {
        hybridService.quantumSimulator.applyGate(circuit, { type: 'CNOT', qubits: [i, i + 1] });
      }
      
      // Execute circuit
      const state = await hybridService.quantumSimulator.executeCircuit(circuit);
      
      // Use in ML pipeline
      const data = [[0.1, 0.2], [0.3, 0.4]];
      const labels = [0, 1];
      
      const pipeline: QuantumMLPipeline = {
        preprocessing: {
          dataEncoding: 'amplitude',
          featureMapping: true,
          dimensionalityReduction: false
        },
        quantumProcessing: {
          algorithm: 'QNN',
          circuitDepth: 2,
          entanglementStrategy: 'linear'
        },
        postprocessing: {
          stateDecoding: 'measurement',
          classicalValidation: true,
          errorMitigation: false
        }
      };
      
      const result = await quantumService.executeQuantumMLPipeline(data, labels, pipeline);
      
      expect(result.model).toBeDefined();
      expect(state.entangled).toBe(true);
    });

    test('should combine optimization with error correction', async () => {
      // Define optimization problem
      const problem = {
        type: 'quadratic' as const,
        objective: (x: number[]) => x[0]**2 + x[1]**2 - 2*x[0]*x[1],
        constraints: [(x: number[]) => x[0] + x[1] <= 1],
        dimensions: 2
      };

      const config: QuantumAlgorithmConfig = {
        algorithm: 'QAOA',
        parameters: {
          layers: 2,
          errorCorrection: true,
          noiseModel: true
        },
        optimization: {
          target: 'accuracy',
          constraints: {}
        }
      };

      // Solve with quantum optimization
      const optimizationResult = await quantumService.solveQuantumOptimization(problem, config);
      
      // Apply error mitigation
      const errorMitigationResult = await quantumService.mitigateQuantumErrors(
        optimizationResult,
        {
          technique: 'zero_noise_extrapolation',
          parameters: { extrapolationOrders: [1, 2] }
        }
      );
      
      expect(optimizationResult.solution).toHaveLength(2);
      expect(errorMitigationResult.errorReduction).toBeGreaterThan(0);
      expect(errorMitigationResult.correctedResult.errorCorrected).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid quantum circuit operations', async () => {
      const circuit = hybridService.quantumSimulator.createQuantumCircuit(2);
      
      expect(() => {
        hybridService.quantumSimulator.applyGate(circuit, {
          type: 'H',
          qubits: [5] // Invalid qubit index
        });
      }).toThrow('Gate targets qubit outside circuit range');
    });

    test('should handle unsupported quantum algorithms', async () => {
      const problem = {
        type: 'combinatorial' as const,
        objective: (x: number[]) => x.reduce((sum, val) => sum + val, 0),
        constraints: [],
        dimensions: 3
      };

      const config: QuantumAlgorithmConfig = {
        algorithm: 'UnsupportedAlgorithm' as any,
        parameters: {},
        optimization: {
          target: 'speed',
          constraints: {}
        }
      };

      await expect(
        quantumService.solveQuantumOptimization(problem, config)
      ).rejects.toThrow('Unsupported quantum algorithm');
    });

    test('should handle invalid enhancement strategies', async () => {
      const model = { type: 'simple_model' };
      const strategy = {
        type: 'invalid_strategy' as any,
        quantumLayers: 2,
        hybridArchitecture: 'sequential' as const
      };

      await expect(
        quantumService.enhanceAIWithQuantum(model, strategy)
      ).rejects.toThrow('Unknown enhancement strategy');
    });
  });
});

describe('Quantum Performance and Scaling', () => {
  let quantumService: QuantumComputingMethodsService;

  beforeEach(() => {
    quantumService = new QuantumComputingMethodsService();
  });

  test('should scale quantum circuits with problem size', async () => {
    const problemSizes = [2, 4, 6, 8];
    const results = [];

    for (const size of problemSizes) {
      const startTime = Date.now();
      
      const problem = {
        type: 'combinatorial' as const,
        objective: (x: number[]) => x.reduce((sum, val) => sum + val**2, 0),
        constraints: [],
        dimensions: size
      };

      const config: QuantumAlgorithmConfig = {
        algorithm: 'QAOA',
        parameters: { layers: 2 },
        optimization: { target: 'speed', constraints: {} }
      };

      const result = await quantumService.solveQuantumOptimization(problem, config);
      const executionTime = Date.now() - startTime;
      
      results.push({
        problemSize: size,
        executionTime,
        objectiveValue: result.objectiveValue
      });
    }

    // Verify scaling behavior
    expect(results).toHaveLength(problemSizes.length);
    results.forEach((result, index) => {
      expect(result.problemSize).toBe(problemSizes[index]);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  test('should maintain quantum advantage with increased complexity', async () => {
    const complexities = [5, 10, 15, 20];
    const advantages = [];

    for (const complexity of complexities) {
      const hasAdvantage = await quantumService.validateQuantumAdvantage(
        `Complex optimization problem with ${complexity} variables`,
        1.2 // Expected minimum speedup
      );
      
      advantages.push({
        complexity,
        hasAdvantage
      });
    }

    // At least some problems should show quantum advantage
    const advantageCount = advantages.filter(a => a.hasAdvantage).length;
    expect(advantageCount).toBeGreaterThan(0);
  });
});
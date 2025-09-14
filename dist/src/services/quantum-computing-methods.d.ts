/**
 * Advanced Quantum Computing Methods for AI Enhancement
 *
 * This module provides comprehensive quantum computing capabilities including:
 * - Quantum machine learning algorithms
 * - Quantum optimization methods
 * - Quantum simulation and modeling
 * - Hybrid classical-quantum processing
 * - Quantum error correction and noise mitigation
 */
export interface QuantumAlgorithmConfig {
    algorithm: "QAOA" | "VQE" | "QNN" | "QSVM" | "QuantumClustering" | "QuantumAnnealing";
    parameters: {
        qubits?: number;
        layers?: number;
        iterations?: number;
        learningRate?: number;
        noiseModel?: boolean;
        errorCorrection?: boolean;
    };
    optimization: {
        target: "speed" | "accuracy" | "resource_efficiency";
        constraints: Record<string, number>;
    };
}
export interface QuantumMLPipeline {
    preprocessing: {
        dataEncoding: "amplitude" | "angle" | "basis";
        featureMapping: boolean;
        dimensionalityReduction: boolean;
    };
    quantumProcessing: {
        algorithm: string;
        circuitDepth: number;
        entanglementStrategy: "linear" | "circular" | "all_to_all";
    };
    postprocessing: {
        stateDecoding: "measurement" | "tomography";
        classicalValidation: boolean;
        errorMitigation: boolean;
    };
}
export interface QuantumAdvantageMetrics {
    speedup: number;
    accuracyImprovement: number;
    resourceEfficiency: number;
    scalabilityFactor: number;
    confidenceLevel: number;
}
/**
 * Quantum Computing Methods Service
 * Provides high-level quantum computing capabilities for AI applications
 */
export declare class QuantumComputingMethodsService {
    private logger;
    private hybridService;
    private benchmark;
    constructor();
    /**
     * Execute Quantum Machine Learning Pipeline
     */
    executeQuantumMLPipeline(data: number[][], labels: number[], pipeline: QuantumMLPipeline): Promise<{
        model: any;
        performance: QuantumAdvantageMetrics;
        results: any;
    }>;
    /**
     * Quantum Optimization for Complex Problems
     */
    solveQuantumOptimization(problem: {
        type: "combinatorial" | "continuous" | "constraint" | "multi_objective";
        objective: (solution: number[]) => number;
        constraints: Array<(solution: number[]) => boolean>;
        dimensions: number;
        bounds?: [number, number][];
    }, config: QuantumAlgorithmConfig): Promise<{
        solution: number[];
        objectiveValue: number;
        convergenceHistory: number[];
        quantumMetrics: any;
    }>;
    /**
     * Quantum Simulation for Physical Systems
     */
    simulateQuantumSystem(system: {
        type: "molecular" | "condensed_matter" | "quantum_field" | "many_body";
        hamiltonian: number[][];
        temperature?: number;
        timeEvolution?: number;
        observables: string[];
    }, simulationConfig: {
        method: "variational" | "trotterization" | "imaginary_time";
        precision: number;
        maxIterations: number;
    }): Promise<{
        groundState: any;
        excitedStates: any[];
        observableValues: Record<string, number>;
        simulationMetrics: any;
    }>;
    /**
     * Hybrid Quantum-Classical AI Enhancement
     */
    enhanceAIWithQuantum(classicalModel: any, enhancementStrategy: {
        type: "feature_enhancement" | "optimization_boost" | "uncertainty_quantification" | "parallel_processing";
        quantumLayers: number;
        hybridArchitecture: "sequential" | "parallel" | "interleaved";
    }): Promise<{
        enhancedModel: any;
        performanceGains: QuantumAdvantageMetrics;
        recommendations: string[];
    }>;
    /**
     * Quantum Error Mitigation and Correction
     */
    mitigateQuantumErrors(quantumResult: any, errorMitigationStrategy: {
        technique: "zero_noise_extrapolation" | "readout_error_mitigation" | "symmetry_verification" | "error_correction";
        parameters: Record<string, any>;
    }): Promise<{
        correctedResult: any;
        errorReduction: number;
        confidenceImprovement: number;
    }>;
    private quantumPreprocessing;
    private trainQuantumModel;
    private evaluateQuantumPerformance;
    private quantumPostprocessing;
    private solveWithQAOA;
    private solveWithVQE;
    private solveWithQuantumAnnealing;
    private prepareQuantumSimulation;
    private executeQuantumSimulation;
    private measureQuantumObservables;
    private enhanceFeatures;
    private boostOptimization;
    private addQuantumUncertainty;
    private enableQuantumParallel;
    private evaluateEnhancementGains;
    private generateEnhancementRecommendations;
    private applyZeroNoiseExtrapolation;
    private mitigateReadoutErrors;
    private verifySymmetries;
    private applyErrorCorrection;
    private applyQuantumDimensionalityReduction;
    private validateWithClassical;
    private extractSolutionFromState;
    private problemToHamiltonian;
    /**
     * Get comprehensive benchmark results
     */
    getBenchmarkResults(): Promise<any>;
    /**
     * Validate quantum advantage for specific use case
     */
    validateQuantumAdvantage(problemDescription: string, expectedSpeedup: number): Promise<boolean>;
}
export default QuantumComputingMethodsService;
//# sourceMappingURL=quantum-computing-methods.d.ts.map
/**
 * Quantum-Classical Hybrid Processing Service
 *
 * Demonstrates advanced quantum-classical hybrid coordination for complex optimization problems.
 * This service simulates quantum superposition for solution space exploration combined with
 * classical deterministic validation and hybrid coordination for optimal results.
 */
export interface QuantumState {
    superposition: Array<{
        amplitude: number;
        phase: number;
        state: any;
        probability: number;
    }>;
    entangled: boolean;
    coherenceTime: number;
    measurementReady: boolean;
    entropy?: number;
    measurementErrors?: number;
    measurements?: number[];
}
export interface ClassicalValidation {
    result: any;
    confidence: number;
    deterministic: boolean;
    computationTime: number;
    validated: boolean;
    predictionErrors?: number;
    testFailures?: number;
    validationErrors?: number;
}
export interface HybridResult {
    quantumExploration: QuantumState;
    classicalValidation: ClassicalValidation;
    combinedResult: any;
    optimality: number;
    processingTime: number;
    errorCorrection: {
        quantumErrors: number;
        classicalErrors: number;
        correctedStates: number;
    };
}
export interface PortfolioOptimizationInput {
    assets: Array<{
        symbol: string;
        expectedReturn: number;
        volatility: number;
        correlation: number[][];
    }>;
    constraints: {
        maxWeight: number;
        minWeight: number;
        riskTolerance: number;
        targetReturn: number;
    };
    quantumParameters: {
        annealingTime: number;
        couplingStrength: number;
        qubits: number;
    };
}
export interface DrugDiscoveryInput {
    targetProtein: {
        sequence: string;
        structure: string;
        bindingSites: Array<{
            x: number;
            y: number;
            z: number;
        }>;
    };
    molecularLibrary: Array<{
        id: string;
        smiles: string;
        properties: Record<string, number>;
    }>;
    quantumSimulation: {
        basisSet: string;
        exchangeCorrelation: string;
        spinConfiguration: string;
    };
}
export declare class QuantumClassicalHybridService {
    private logger;
    private geminiService;
    private quantumSimulator;
    private classicalProcessor;
    private hybridCoordinator;
    constructor();
    /**
     * Financial Portfolio Optimization with Quantum Annealing
     *
     * Uses quantum superposition to explore vast solution spaces of portfolio allocations,
     * while classical processing validates risk metrics and regulatory constraints.
     */
    optimizePortfolio(input: PortfolioOptimizationInput): Promise<HybridResult>;
    /**
     * Drug Discovery with Quantum Molecular Simulation
     *
     * Leverages quantum mechanics for accurate molecular orbital calculations,
     * combined with classical machine learning for drug-target interaction prediction.
     */
    discoverDrugCandidates(input: DrugDiscoveryInput): Promise<HybridResult>;
    /**
     * Cryptographic Key Generation with Quantum Randomness
     *
     * Uses quantum measurements for true randomness, classical algorithms for key validation,
     * and hybrid coordination for cryptographic strength optimization.
     */
    generateCryptographicKeys(keyLength: number, algorithm: string): Promise<HybridResult>;
    /**
     * Quantum Feature Mapping for Classical Data
     *
     * Transforms classical data into quantum feature space for enhanced ML capabilities
     */
    quantumFeatureMapping(data: number[][], mappingType?: "amplitude" | "angle" | "basis"): Promise<HybridResult>;
    /**
     * Quantum Advantage Detection and Validation
     *
     * Compares quantum vs classical approaches to determine quantum advantage
     */
    detectQuantumAdvantage(problem: {
        type: "optimization" | "sampling" | "machine_learning" | "simulation";
        size: number;
        parameters: any;
    }): Promise<HybridResult>;
    /**
     * Climate Modeling with Quantum Weather Patterns
     *
     * Simulates quantum effects in atmospheric phenomena while using classical
     * computational fluid dynamics for large-scale weather prediction.
     */
    modelClimatePatterns(parameters: {
        gridResolution: number;
        timeHorizon: number;
        quantumEffects: string[];
        classicalModels: string[];
    }): Promise<HybridResult>;
    private generateAnnealingSchedule;
    private generateCouplingMatrix;
    private calculateOptimalityCriteria;
    private selectBestValidation;
    private calculateOptimality;
    private calculateDrugOptimality;
    private calculateCryptographicOptimality;
    private calculateClimateAccuracy;
    private calculateMappingOptimality;
    private calculateInformationPreservation;
    private calculateDataEntropy;
    private analyzeQuantumAdvantage;
    private compareResultQuality;
    private calculateResourceEfficiency;
    private calculateQuantumResources;
    private calculateClassicalResources;
    private generateRandomHamiltonian;
    private calculatePharmacokinetics;
    private predictToxicity;
    private assessSynthesizability;
    private combineClassicalResults;
}
/**
 * Advanced Quantum Circuit Implementation
 * Provides comprehensive quantum computing capabilities including:
 * - Quantum gate operations (Pauli, Hadamard, CNOT, Toffoli, etc.)
 * - Quantum state manipulation and entanglement
 * - Quantum measurement and state collapse
 * - Quantum error correction protocols
 * - Noise model simulation
 */
export interface QuantumGate {
    type: "X" | "Y" | "Z" | "H" | "CNOT" | "Toffoli" | "Phase" | "T" | "S" | "RX" | "RY" | "RZ" | "CZ" | "SWAP";
    qubits: number[];
    parameters?: number[];
    matrix?: number[][];
}
export interface QuantumCircuit {
    qubits: number;
    gates: QuantumGate[];
    measurements: {
        qubit: number;
        basis: string;
    }[];
    depth: number;
}
export interface NoiseModel {
    decoherenceRate: number;
    gateErrorRate: number;
    measurementErrorRate: number;
    thermalNoise: number;
    dephasing: number;
}
export interface ErrorCorrectionCode {
    type: "surface" | "steane" | "shor" | "bit_flip" | "phase_flip";
    logicalQubits: number;
    physicalQubits: number;
    threshold: number;
    syndrome: number[];
}
/**
 * Quantum Performance Benchmarking and Analysis
 */
export declare class QuantumPerformanceBenchmark {
    private logger;
    private quantumService;
    constructor(quantumService: QuantumClassicalHybridService);
    /**
     * Comprehensive quantum vs classical performance comparison
     */
    runComprehensiveBenchmark(): Promise<any>;
    private benchmarkPortfolioOptimization;
    private benchmarkDrugDiscovery;
    private benchmarkFeatureMapping;
    private benchmarkQuantumAdvantage;
    private generateBenchmarkSummary;
    private calculateOverallPerformance;
    private calculateQuantumAdvantageScore;
    private assessScalability;
    private generatePerformanceRecommendations;
    private generateTestAssets;
    private generateTestMolecules;
    private generateTestProtein;
    private generateTestDataset;
}
export default QuantumClassicalHybridService;
//# sourceMappingURL=quantum-classical-hybrid.d.ts.map
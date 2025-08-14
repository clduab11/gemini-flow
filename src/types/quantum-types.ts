/**
 * Quantum Computing Type Definitions
 *
 * Comprehensive type definitions for quantum computing operations,
 * algorithms, and data structures used throughout the quantum computing module.
 */

// Core Quantum Types
export interface Complex {
  real: number;
  imaginary: number;
}

export interface QuantumBit {
  amplitude0: Complex;
  amplitude1: Complex;
  measurementProbability0: number;
  measurementProbability1: number;
}

export interface QuantumRegister {
  qubits: QuantumBit[];
  entanglementMatrix: number[][];
  coherenceTime: number;
  noiseLevel: number;
}

export interface QuantumGateDefinition {
  name: string;
  type: "single" | "two" | "multi";
  matrix: Complex[][];
  parameters?: number[];
  description: string;
}

export interface QuantumCircuitInstruction {
  gate: QuantumGateDefinition;
  targetQubits: number[];
  controlQubits?: number[];
  parameters?: number[];
  timing?: number;
}

export interface QuantumMeasurement {
  qubitIndex: number;
  basis: "computational" | "hadamard" | "pauli_x" | "pauli_y" | "pauli_z";
  result: 0 | 1;
  probability: number;
  timestamp: number;
}

// Quantum Algorithm Types
export interface QAOAParameters {
  layers: number;
  gamma: number[]; // Cost Hamiltonian parameters
  beta: number[]; // Mixer Hamiltonian parameters
  costFunction: (solution: number[]) => number;
  mixerType: "x_mixer" | "xy_mixer" | "custom";
}

export interface VQEParameters {
  ansatz: "hardware_efficient" | "uccsd" | "custom";
  optimizer: "gradient_descent" | "spsa" | "cobyla" | "l_bfgs_b";
  maxIterations: number;
  tolerance: number;
  hamiltonian: Complex[][];
}

export interface QuantumNeuralNetworkLayer {
  type: "variational" | "data_encoding" | "measurement";
  qubits: number[];
  gates: QuantumCircuitInstruction[];
  trainableParameters: number[];
  activation?: "linear" | "sigmoid" | "relu" | "quantum_activation";
}

export interface QuantumSVMKernel {
  type: "rbf" | "polynomial" | "linear" | "quantum_kernel";
  parameters: Record<string, number>;
  featureMap: QuantumCircuitInstruction[];
  kernelMatrix?: number[][];
}

// Quantum Error Types
export interface QuantumError {
  type:
    | "bit_flip"
    | "phase_flip"
    | "depolarizing"
    | "amplitude_damping"
    | "dephasing";
  probability: number;
  affectedQubits: number[];
  timestamp: number;
  corrected: boolean;
}

export interface QuantumErrorCorrection {
  code: "surface" | "steane" | "shor" | "color" | "topological";
  logicalQubits: number;
  physicalQubits: number;
  codeDistance: number;
  threshold: number;
  syndromeDetection: boolean;
  decodingAlgorithm: string;
}

export interface NoiseModelParameters {
  gateErrorRates: Record<string, number>;
  measurementErrorRate: number;
  decoherenceTime: {
    t1: number; // Relaxation time
    t2: number; // Dephasing time
  };
  thermalNoise: number;
  crosstalk: number[][];
}

// Quantum Simulation Types
export interface QuantumSystemHamiltonian {
  type: "ising" | "heisenberg" | "hubbard" | "molecular" | "custom";
  dimension: number;
  matrix: Complex[][];
  eigenvalues?: number[];
  eigenvectors?: Complex[][];
  temperature?: number;
}

export interface QuantumSimulationResult {
  groundState: {
    energy: number;
    wavefunction: Complex[];
    fidelity: number;
  };
  excitedStates?: Array<{
    energy: number;
    wavefunction: Complex[];
    excitationLevel: number;
  }>;
  observables: Record<string, number>;
  convergenceHistory: number[];
  simulationTime: number;
  errorEstimate: number;
}

export interface TimeEvolutionParameters {
  initialState: Complex[];
  hamiltonian: Complex[][];
  timeStep: number;
  totalTime: number;
  method: "trotter" | "exact" | "lanczos" | "chebyshev";
  order?: number;
}

// Quantum Machine Learning Types
export interface QuantumDataEncoding {
  method: "amplitude" | "angle" | "basis" | "displacement" | "squeezing";
  normalization: boolean;
  entanglement: boolean;
  redundancy: number;
}

export interface QuantumFeatureMap {
  type: "pauli" | "zz" | "polynomial" | "fourier" | "custom";
  repetitions: number;
  pauliGates: ("I" | "X" | "Y" | "Z")[];
  entanglementPattern: "linear" | "circular" | "full" | "custom";
  parameters: number[];
}

export interface QuantumClassificationResult {
  predictions: number[];
  probabilities: number[][];
  confidence: number[];
  quantumFeatures: number[][];
  classicalValidation: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface QuantumClusteringResult {
  clusters: number[][];
  centroids: number[][];
  quantumCentroids: Complex[][];
  clusterProbabilities: number[][];
  silhouetteScore: number;
  quantumAdvantage: boolean;
}

// Quantum Optimization Types
export interface QuantumOptimizationProblem {
  type: "quadratic" | "combinatorial" | "constraint" | "multi_objective";
  variables: number;
  objective: {
    linear: number[];
    quadratic: number[][];
    constant?: number;
  };
  constraints: Array<{
    type: "equality" | "inequality" | "box";
    coefficients: number[];
    bound: number;
  }>;
  bounds?: Array<[number, number]>;
}

export interface QuantumAnnealingSchedule {
  annealingTime: number;
  schedule: Array<{
    time: number;
    transverseField: number;
    longitudinalField: number;
  }>;
  temperature: number;
  pauseSchedule?: Array<{
    time: number;
    duration: number;
  }>;
}

export interface QuantumOptimizationResult {
  solution: number[];
  objectiveValue: number;
  feasible: boolean;
  optimizationTime: number;
  convergenceHistory: Array<{
    iteration: number;
    objectiveValue: number;
    gradientNorm: number;
    stepSize: number;
  }>;
  quantumResources: {
    qubits: number;
    gates: number;
    measurements: number;
    circuitDepth: number;
  };
}

// Quantum Hardware Types
export interface QuantumDevice {
  name: string;
  type:
    | "superconducting"
    | "trapped_ion"
    | "photonic"
    | "neutral_atom"
    | "simulator";
  qubits: number;
  connectivity: number[][];
  gateSet: string[];
  gateTime: Record<string, number>;
  errorRates: Record<string, number>;
  coherenceTime: {
    t1: number;
    t2: number;
  };
  topology: "linear" | "grid" | "heavy_hex" | "all_to_all" | "custom";
}

export interface QuantumJob {
  id: string;
  circuit: QuantumCircuitInstruction[];
  measurements: QuantumMeasurement[];
  shots: number;
  device: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  submitTime: Date;
  startTime?: Date;
  endTime?: Date;
  results?: QuantumJobResult;
  errorMessage?: string;
}

export interface QuantumJobResult {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector?: Complex[];
  densityMatrix?: Complex[][];
  expectationValues?: Record<string, number>;
  metadata: {
    shots: number;
    executionTime: number;
    calibrationData?: any;
    errorMitigation?: any;
  };
}

// Quantum Advantage and Benchmarking Types
export interface QuantumAdvantageMetrics {
  speedup: number;
  accuracyImprovement: number;
  resourceEfficiency: number;
  scalabilityFactor: number;
  confidenceLevel: number;
  statisticalSignificance: number;
  practicalRelevance: number;
}

export interface QuantumBenchmarkSuite {
  name: string;
  problems: Array<{
    name: string;
    size: number;
    classicalBest: number;
    quantumTime: number;
    classicalTime: number;
    accuracy: number;
  }>;
  overallResults: {
    averageSpeedup: number;
    advantageProblems: number;
    totalProblems: number;
    confidence: number;
  };
}

export interface QuantumComplexityAnalysis {
  timeComplexity: {
    classical: string;
    quantum: string;
    advantage: string;
  };
  spaceComplexity: {
    classical: string;
    quantum: string;
    qubitsRequired: number;
  };
  scalingBehavior: {
    problemSize: number[];
    quantumTime: number[];
    classicalTime: number[];
    crossoverPoint?: number;
  };
}

// Hybrid Quantum-Classical Types
export interface HybridAlgorithmConfig {
  quantumLayers: QuantumNeuralNetworkLayer[];
  classicalLayers: Array<{
    type: "dense" | "conv" | "lstm" | "attention";
    parameters: Record<string, any>;
  }>;
  coordination: {
    strategy: "sequential" | "parallel" | "interleaved" | "adaptive";
    synchronization: "synchronous" | "asynchronous";
    dataFlow: "quantum_to_classical" | "classical_to_quantum" | "bidirectional";
  };
}

export interface HybridOptimizationResult {
  quantumResults: QuantumOptimizationResult;
  classicalResults: {
    solution: number[];
    objectiveValue: number;
    optimizationTime: number;
  };
  hybridSolution: {
    solution: number[];
    objectiveValue: number;
    confidence: number;
    quantumContribution: number;
    classicalContribution: number;
  };
}

// Quantum Chemistry and Materials Science Types
export interface MolecularHamiltonian {
  geometry: Array<{
    atom: string;
    position: [number, number, number];
  }>;
  basisSet: string;
  method: "hartree_fock" | "dft" | "mp2" | "ccsd" | "custom";
  charge: number;
  multiplicity: number;
  oneBodyIntegrals: number[][];
  twoBodyIntegrals: number[][][][];
}

export interface QuantumChemistryResult {
  groundStateEnergy: number;
  excitationEnergies: number[];
  dipoleMatrix: number[][];
  bondLengths: Record<string, number>;
  vibrationalFrequencies: number[];
  thermodynamicProperties: {
    enthalpy: number;
    entropy: number;
    freeEnergy: number;
    heatCapacity: number;
  };
}

// Quantum Cryptography Types
export interface QuantumKeyDistribution {
  protocol:
    | "bb84"
    | "sarg04"
    | "decoy_state"
    | "measurement_device_independent";
  keyLength: number;
  securityParameter: number;
  errorRate: number;
  eavesdroppingDetection: boolean;
  privacyAmplification: boolean;
}

export interface QuantumRandomNumberGenerator {
  source: "measurement" | "vacuum_fluctuations" | "spontaneous_emission";
  bitRate: number;
  entropy: number;
  statisticalTests: string[];
  certification:
    | "device_independent"
    | "semi_device_independent"
    | "device_dependent";
}

// Quantum Sensing and Metrology Types
export interface QuantumSensorConfig {
  type: "magnetometer" | "gravimeter" | "clock" | "accelerometer" | "gyroscope";
  sensitivity: number;
  bandwidth: number;
  dynamicRange: number;
  probeState: "coherent" | "squeezed" | "spin_squeezed" | "ghz";
  entanglement: boolean;
}

export interface QuantumMetrologyResult {
  measurement: number;
  uncertainty: number;
  sensitivity: number;
  quantumAdvantage: number;
  shotNoiseLimit: number;
  heisenbergLimit: number;
}

// Export utility types
export type QuantumGateType =
  | "I"
  | "X"
  | "Y"
  | "Z"
  | "H"
  | "S"
  | "T"
  | "RX"
  | "RY"
  | "RZ"
  | "CNOT"
  | "CZ"
  | "SWAP"
  | "Toffoli"
  | "Fredkin";

export type QuantumAlgorithmType =
  | "grover"
  | "shor"
  | "simon"
  | "deutsch_jozsa"
  | "bernstein_vazirani"
  | "qaoa"
  | "vqe"
  | "qnn"
  | "qsvm"
  | "quantum_walk";

export type QuantumBackend = "simulator" | "hardware" | "cloud" | "hybrid";

export type QuantumNoiseType =
  | "none"
  | "depolarizing"
  | "amplitude_damping"
  | "phase_damping"
  | "bit_flip"
  | "phase_flip"
  | "pauli"
  | "coherent"
  | "incoherent";

// Advanced quantum types for research applications
export interface QuantumFieldTheorySimulation {
  fieldType: "scalar" | "fermion" | "gauge" | "yang_mills";
  latticeSize: number[];
  couplingConstants: number[];
  symmetryGroup: string;
  observables: string[];
  correlationFunctions: Record<string, number[]>;
}

export interface QuantumGravitySimulation {
  spacetimeDimensions: number;
  metricTensor: number[][];
  matterContent: string[];
  cosmologicalConstant: number;
  holographicDuality: boolean;
}

export interface QuantumInformationMetrics {
  entanglementEntropy: number;
  mutualInformation: number;
  quantumFidelity: number;
  quantumCapacity: number;
  quantumVolume: number;
  quantumError: number;
}

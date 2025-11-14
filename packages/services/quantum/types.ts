/**
 * Quantum Computing Types
 * Definitions for quantum circuit generation and optimization
 */

/**
 * Quantum Backend
 */
export type QuantumBackend = 'pennylane' | 'qiskit' | 'simulator';

/**
 * Quantum Circuit Configuration
 */
export interface QuantumCircuitConfig {
  numQubits: number;
  backend: QuantumBackend;
  shots?: number;
  optimization_level?: number;
}

/**
 * Quantum Gate
 */
export interface QuantumGate {
  type: string;
  qubits: number[];
  params?: number[];
}

/**
 * Quantum Circuit
 */
export interface QuantumCircuit {
  qubits: number;
  gates: QuantumGate[];
  measurements?: number[];
  backend: QuantumBackend;
}

/**
 * Quantum Execution Result
 */
export interface QuantumResult {
  counts: Record<string, number>;
  circuit: QuantumCircuit;
  executionTime: number;
  backend: QuantumBackend;
}

/**
 * Optimization Problem
 */
export interface OptimizationProblem {
  type: 'TSP' | 'MaxCut' | 'VRP' | 'Custom';
  data: any;
  constraints?: any[];
}

/**
 * Optimization Result
 */
export interface OptimizationResult {
  solution: any;
  cost: number;
  iterations: number;
  executionTime: number;
}

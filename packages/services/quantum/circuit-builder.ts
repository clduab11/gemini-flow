/**
 * Quantum Circuit Builder
 * Creates quantum circuits for various algorithms
 */

import {
  QuantumCircuit,
  QuantumGate,
  QuantumCircuitConfig
} from './types.js';

export class QuantumCircuitBuilder {
  private circuit: QuantumCircuit;

  constructor(config: QuantumCircuitConfig) {
    this.circuit = {
      qubits: config.numQubits,
      gates: [],
      backend: config.backend
    };

    console.log(`[Quantum] Initialized circuit with ${config.numQubits} qubits`);
  }

  /**
   * Add Hadamard gate
   */
  hadamard(qubit: number): this {
    this.circuit.gates.push({
      type: 'H',
      qubits: [qubit]
    });
    return this;
  }

  /**
   * Add Pauli-X gate
   */
  pauliX(qubit: number): this {
    this.circuit.gates.push({
      type: 'X',
      qubits: [qubit]
    });
    return this;
  }

  /**
   * Add Pauli-Y gate
   */
  pauliY(qubit: number): this {
    this.circuit.gates.push({
      type: 'Y',
      qubits: [qubit]
    });
    return this;
  }

  /**
   * Add Pauli-Z gate
   */
  pauliZ(qubit: number): this {
    this.circuit.gates.push({
      type: 'Z',
      qubits: [qubit]
    });
    return this;
  }

  /**
   * Add CNOT gate
   */
  cnot(control: number, target: number): this {
    this.circuit.gates.push({
      type: 'CNOT',
      qubits: [control, target]
    });
    return this;
  }

  /**
   * Add rotation gate
   */
  rotate(qubit: number, angle: number, axis: 'X' | 'Y' | 'Z' = 'Z'): this {
    this.circuit.gates.push({
      type: `R${axis}`,
      qubits: [qubit],
      params: [angle]
    });
    return this;
  }

  /**
   * Add measurement
   */
  measure(qubits?: number[]): this {
    this.circuit.measurements = qubits || Array.from({ length: this.circuit.qubits }, (_, i) => i);
    return this;
  }

  /**
   * Create Bell state
   */
  bellState(): this {
    this.hadamard(0);
    this.cnot(0, 1);
    this.measure();
    return this;
  }

  /**
   * Create GHZ state
   */
  ghzState(numQubits: number = this.circuit.qubits): this {
    this.hadamard(0);
    for (let i = 1; i < numQubits; i++) {
      this.cnot(0, i);
    }
    this.measure();
    return this;
  }

  /**
   * Create quantum Fourier transform
   */
  qft(numQubits: number = this.circuit.qubits): this {
    for (let i = numQubits - 1; i >= 0; i--) {
      this.hadamard(i);
      for (let j = i - 1; j >= 0; j--) {
        const angle = Math.PI / Math.pow(2, i - j);
        this.controlledRotate(j, i, angle);
      }
    }
    return this;
  }

  /**
   * Add controlled rotation
   */
  private controlledRotate(control: number, target: number, angle: number): this {
    this.circuit.gates.push({
      type: 'CRZ',
      qubits: [control, target],
      params: [angle]
    });
    return this;
  }

  /**
   * Build and return circuit
   */
  build(): QuantumCircuit {
    console.log(`[Quantum] Built circuit with ${this.circuit.gates.length} gates`);
    return { ...this.circuit };
  }

  /**
   * Get circuit as string representation
   */
  toString(): string {
    const lines: string[] = [];
    lines.push(`Quantum Circuit (${this.circuit.qubits} qubits, ${this.circuit.gates.length} gates)`);
    lines.push(`Backend: ${this.circuit.backend}`);
    lines.push('Gates:');

    for (const gate of this.circuit.gates) {
      const qubitsStr = gate.qubits.join(', ');
      const paramsStr = gate.params ? ` (${gate.params.join(', ')})` : '';
      lines.push(`  ${gate.type} q[${qubitsStr}]${paramsStr}`);
    }

    if (this.circuit.measurements) {
      lines.push(`Measurements: q[${this.circuit.measurements.join(', ')}]`);
    }

    return lines.join('\n');
  }
}

/**
 * Create common quantum circuits
 */
export const QuantumCircuits = {
  /**
   * Bell state circuit
   */
  bell(backend: QuantumCircuit['backend'] = 'simulator'): QuantumCircuit {
    return new QuantumCircuitBuilder({ numQubits: 2, backend })
      .bellState()
      .build();
  },

  /**
   * GHZ state circuit
   */
  ghz(numQubits: number, backend: QuantumCircuit['backend'] = 'simulator'): QuantumCircuit {
    return new QuantumCircuitBuilder({ numQubits, backend })
      .ghzState(numQubits)
      .build();
  },

  /**
   * Quantum Fourier Transform circuit
   */
  qft(numQubits: number, backend: QuantumCircuit['backend'] = 'simulator'): QuantumCircuit {
    return new QuantumCircuitBuilder({ numQubits, backend })
      .qft(numQubits)
      .build();
  }
};

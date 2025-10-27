#!/usr/bin/env python3
"""
Quantum Worker Process for Gemini-Flow Super-Terminal

Supports Qiskit and Pennylane quantum computing frameworks.
Communicates with TypeScript via JSON-RPC 2.0 over stdio.

Performance targets:
- Initialization: <1s
- Simple circuit execution: <200ms (simulation)
- JSON serialization overhead: <10ms
"""

import sys
import json
import traceback
import os
from typing import Any, Dict, Optional
import time

# Quantum frameworks (lazy loaded to speed up initialization)
qiskit = None
pennylane = None


def initialize_frameworks():
    """Lazy load quantum frameworks to speed up worker startup"""
    global qiskit, pennylane

    enable_hardware = os.getenv('ENABLE_HARDWARE', 'false').lower() == 'true'

    # Only import what's needed based on environment
    if enable_hardware:
        try:
            import qiskit as qk
            qiskit = qk
        except ImportError:
            log_error("Qiskit not installed. Run: pip install qiskit")

    # Pennylane is lighter, always try to import
    try:
        import pennylane as pl
        pennylane = pl
    except ImportError:
        log_error("Pennylane not installed. Run: pip install pennylane")


def log_error(message: str):
    """Log error to stderr"""
    print(json.dumps({"level": "error", "message": message}), file=sys.stderr, flush=True)


def send_response(id: str, result: Optional[Any] = None, error: Optional[Dict] = None):
    """Send JSON-RPC response to stdout"""
    response = {
        "jsonrpc": "2.0",
        "id": id,
        "result": result,
        "error": error
    }
    print(json.dumps(response), flush=True)


def send_ready():
    """Signal worker is ready to process requests"""
    send_response("ready", result={"status": "ready", "worker_id": os.getenv('QUANTUM_WORKER_ID', '0')})


# ============================================================================
# Qiskit Operations
# ============================================================================

def qiskit_execute_circuit(config: Dict) -> Dict:
    """Execute a Qiskit quantum circuit"""
    if qiskit is None:
        import qiskit as qk
        globals()['qiskit'] = qk

    start_time = time.time()

    # Parse QASM circuit
    qasm_str = config.get('circuitQASM')
    if not qasm_str:
        raise ValueError("circuitQASM required for Qiskit circuit execution")

    # Create circuit from QASM
    circuit = qiskit.QuantumCircuit.from_qasm_str(qasm_str)

    # Select backend
    backend_type = config.get('backend', 'simulator')
    shots = config.get('shots', 1024)

    if backend_type == 'simulator':
        from qiskit_aer import AerSimulator
        backend = AerSimulator()
    else:
        # Hardware backend (requires IBM Quantum account)
        from qiskit_ibm_runtime import QiskitRuntimeService
        service = QiskitRuntimeService()
        backend = service.least_busy(operational=True, simulator=False)

    # Transpile and execute
    from qiskit import transpile
    transpiled = transpile(circuit, backend)
    job = backend.run(transpiled, shots=shots)
    result = job.result()

    # Extract counts
    counts = result.get_counts()

    execution_time = (time.time() - start_time) * 1000  # Convert to ms

    return {
        "success": True,
        "operation": "circuit",
        "framework": "qiskit",
        "data": {
            "counts": counts,
            "circuit_depth": circuit.depth(),
            "num_qubits": circuit.num_qubits,
        },
        "metadata": {
            "executionTime": execution_time,
            "backend": backend.name,
            "qubits": circuit.num_qubits,
            "shots": shots,
        }
    }


def qiskit_simulate(config: Dict) -> Dict:
    """Simulate a quantum system with Qiskit"""
    if qiskit is None:
        import qiskit as qk
        globals()['qiskit'] = qk

    start_time = time.time()

    # Get simulation parameters
    num_qubits = config.get('numQubits', 2)
    qasm_str = config.get('circuitQASM')

    if qasm_str:
        circuit = qiskit.QuantumCircuit.from_qasm_str(qasm_str)
    else:
        # Create simple Bell state example
        circuit = qiskit.QuantumCircuit(num_qubits, num_qubits)
        circuit.h(0)
        circuit.cx(0, 1)
        circuit.measure_all()

    # Simulate with statevector
    from qiskit_aer import StatevectorSimulator
    backend = StatevectorSimulator()

    from qiskit import transpile
    transpiled = transpile(circuit, backend)
    job = backend.run(transpiled)
    result = job.result()
    statevector = result.get_statevector()

    execution_time = (time.time() - start_time) * 1000

    return {
        "success": True,
        "operation": "simulate",
        "framework": "qiskit",
        "data": {
            "statevector": [complex(x) for x in statevector],  # Convert to serializable format
            "num_qubits": circuit.num_qubits,
        },
        "metadata": {
            "executionTime": execution_time,
            "backend": "statevector_simulator",
            "qubits": circuit.num_qubits,
        }
    }


# ============================================================================
# Pennylane Operations
# ============================================================================

def pennylane_execute_circuit(config: Dict) -> Dict:
    """Execute a Pennylane quantum circuit"""
    if pennylane is None:
        import pennylane as pl
        globals()['pennylane'] = pl

    start_time = time.time()

    num_qubits = config.get('numQubits', 2)
    shots = config.get('shots', 1000)

    # Create device
    dev = pennylane.device('default.qubit', wires=num_qubits, shots=shots)

    # Define a simple quantum circuit (example: Bell state)
    @pennylane.qnode(dev)
    def circuit():
        pennylane.Hadamard(wires=0)
        pennylane.CNOT(wires=[0, 1])
        return pennylane.sample()

    # Execute circuit
    samples = circuit()

    execution_time = (time.time() - start_time) * 1000

    return {
        "success": True,
        "operation": "circuit",
        "framework": "pennylane",
        "data": {
            "samples": samples.tolist() if hasattr(samples, 'tolist') else samples,
            "num_qubits": num_qubits,
        },
        "metadata": {
            "executionTime": execution_time,
            "backend": "default.qubit",
            "qubits": num_qubits,
            "shots": shots,
        }
    }


def pennylane_quantum_ml(config: Dict) -> Dict:
    """Execute quantum machine learning with Pennylane"""
    if pennylane is None:
        import pennylane as pl
        globals()['pennylane'] = pl

    import numpy as np

    start_time = time.time()

    num_qubits = config.get('numQubits', 4)
    dev = pennylane.device('default.qubit', wires=num_qubits)

    # Simple variational circuit
    @pennylane.qnode(dev)
    def quantum_circuit(weights):
        for i in range(num_qubits):
            pennylane.RY(weights[i], wires=i)
        for i in range(num_qubits - 1):
            pennylane.CNOT(wires=[i, i + 1])
        return pennylane.expval(pennylane.PauliZ(0))

    # Initialize random weights
    weights = np.random.random(num_qubits)

    # Execute circuit
    expectation_value = quantum_circuit(weights)

    execution_time = (time.time() - start_time) * 1000

    return {
        "success": True,
        "operation": "ml",
        "framework": "pennylane",
        "data": {
            "expectation_value": float(expectation_value),
            "weights": weights.tolist(),
            "num_qubits": num_qubits,
        },
        "metadata": {
            "executionTime": execution_time,
            "backend": "default.qubit",
            "qubits": num_qubits,
        }
    }


# ============================================================================
# Request Router
# ============================================================================

OPERATION_HANDLERS = {
    'quantum.qiskit.circuit': qiskit_execute_circuit,
    'quantum.qiskit.simulate': qiskit_simulate,
    'quantum.pennylane.circuit': pennylane_execute_circuit,
    'quantum.pennylane.ml': pennylane_quantum_ml,
}


def handle_request(request: Dict):
    """Handle incoming JSON-RPC request"""
    try:
        method = request.get('method')
        params = request.get('params', {})
        request_id = request.get('id')

        if method not in OPERATION_HANDLERS:
            send_response(
                request_id,
                error={
                    "code": -32601,
                    "message": f"Method not found: {method}",
                    "data": {"available_methods": list(OPERATION_HANDLERS.keys())}
                }
            )
            return

        # Execute quantum operation
        handler = OPERATION_HANDLERS[method]
        config = params.get('config', {})
        result = handler(config)

        # Send successful response
        send_response(request_id, result=result)

    except Exception as e:
        error_trace = traceback.format_exc()
        log_error(f"Error handling request: {error_trace}")

        send_response(
            request.get('id', 'unknown'),
            error={
                "code": -32000,
                "message": str(e),
                "data": {"traceback": error_trace}
            }
        )


def main():
    """Main worker loop"""
    # Send ready signal
    send_ready()

    # Process stdin line by line (newline-delimited JSON)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
            handle_request(request)
        except json.JSONDecodeError as e:
            log_error(f"Invalid JSON: {e}")
            send_response(
                "unknown",
                error={"code": -32700, "message": "Parse error", "data": str(e)}
            )
        except Exception as e:
            log_error(f"Unexpected error: {traceback.format_exc()}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        log_error(f"Fatal error: {traceback.format_exc()}")
        sys.exit(1)

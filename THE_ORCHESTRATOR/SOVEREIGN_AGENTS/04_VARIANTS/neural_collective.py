"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗ ██╗                            ║
║   ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗██║                            ║
║   ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║██║                            ║
║   ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██║                            ║
║   ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║███████╗                       ║
║   ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝                       ║
║                                                                              ║
║    ██████╗ ██████╗ ██╗     ██╗     ███████╗ ██████╗████████╗██╗██╗   ██╗   ║
║   ██╔════╝██╔═══██╗██║     ██║     ██╔════╝██╔════╝╚══██╔══╝██║██║   ██║   ║
║   ██║     ██║   ██║██║     ██║     █████╗  ██║        ██║   ██║██║   ██║   ║
║   ██║     ██║   ██║██║     ██║     ██╔══╝  ██║        ██║   ██║╚██╗ ██╔╝   ║
║   ╚██████╗╚██████╔╝███████╗███████╗███████╗╚██████╗   ██║   ██║ ╚████╔╝    ║
║    ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═══╝     ║
║                                                                              ║
║                    THE NEURAL COLLECTIVE                                     ║
║                                                                              ║
║   "Agents as neurons. Thoughts emerge from the network."                     ║
║                                                                              ║
║   Each agent is a neuron that:                                               ║
║   - Has weighted connections (synapses) to other neurons                     ║
║   - Receives signals, applies activation function, outputs signal            ║
║   - Learns by adjusting synapse weights                                      ║
║   - Together, the network THINKS                                             ║
║                                                                              ║
║   The collective exhibits:                                                   ║
║   - Pattern recognition through propagation                                  ║
║   - Memory through recurrent connections                                     ║
║   - Learning through backpropagation                                         ║
║   - Emergent reasoning no single neuron can do                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import math
import random
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import (
    Any, Callable, Dict, Generic, List, Optional, 
    Set, Tuple, Type, TypeVar, Union
)
from uuid import uuid4

import sys
sys.path.insert(0, '..')

from sovereign_core import (
    AgentLevel, AgentState, BaseAgent, Capability,
    CONSCIOUSNESS, Task, TaskResult, TaskStatus,
    SystemAwareness, AgentMessage, MessageType
)


# ═══════════════════════════════════════════════════════════════════════════════
# NEURAL COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════


class ActivationFunction(str, Enum):
    """Activation functions for neurons."""
    RELU = "relu"
    SIGMOID = "sigmoid"
    TANH = "tanh"
    SOFTMAX = "softmax"
    LINEAR = "linear"
    LEAKY_RELU = "leaky_relu"


class NeuronType(str, Enum):
    """Types of neurons in the network."""
    INPUT = "input"           # Receives external signals
    HIDDEN = "hidden"         # Internal processing
    OUTPUT = "output"         # Produces final results
    RECURRENT = "recurrent"   # Has self-connections
    ATTENTION = "attention"   # Attention mechanism
    MEMORY = "memory"         # Long-term memory


@dataclass
class Synapse:
    """
    A connection between two neurons.
    
    Synapses carry weighted signals and can learn.
    """
    synapse_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Connection
    source_id: str = ""
    target_id: str = ""
    
    # Weight
    weight: float = 0.5
    bias: float = 0.0
    
    # Learning
    learning_rate: float = 0.01
    momentum: float = 0.9
    last_delta: float = 0.0
    
    # Plasticity
    is_plastic: bool = True  # Can be modified
    
    # Statistics
    activations: int = 0
    last_signal: float = 0.0
    
    def transmit(self, signal: float) -> float:
        """Transmit a signal through the synapse."""
        self.activations += 1
        self.last_signal = signal
        return signal * self.weight + self.bias
    
    def adjust_weight(self, error: float) -> None:
        """Adjust weight based on error (learning)."""
        if not self.is_plastic:
            return
        
        delta = self.learning_rate * error + self.momentum * self.last_delta
        self.weight += delta
        self.last_delta = delta


@dataclass
class NeuralSignal:
    """
    A signal propagating through the network.
    """
    signal_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Value
    value: float = 0.0
    
    # Metadata
    source_neuron: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # Tracing
    path: List[str] = field(default_factory=list)
    
    # Payload (for complex signals)
    payload: Dict[str, Any] = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


class Activations:
    """Collection of activation functions."""
    
    @staticmethod
    def relu(x: float) -> float:
        return max(0, x)
    
    @staticmethod
    def sigmoid(x: float) -> float:
        try:
            return 1 / (1 + math.exp(-x))
        except OverflowError:
            return 0.0 if x < 0 else 1.0
    
    @staticmethod
    def tanh(x: float) -> float:
        return math.tanh(x)
    
    @staticmethod
    def linear(x: float) -> float:
        return x
    
    @staticmethod
    def leaky_relu(x: float, alpha: float = 0.01) -> float:
        return x if x > 0 else alpha * x
    
    @staticmethod
    def softmax(values: List[float]) -> List[float]:
        """Softmax for multiple values."""
        exp_values = [math.exp(v) for v in values]
        total = sum(exp_values)
        return [v / total for v in exp_values]
    
    @staticmethod
    def get_function(activation: ActivationFunction) -> Callable[[float], float]:
        """Get activation function by type."""
        mapping = {
            ActivationFunction.RELU: Activations.relu,
            ActivationFunction.SIGMOID: Activations.sigmoid,
            ActivationFunction.TANH: Activations.tanh,
            ActivationFunction.LINEAR: Activations.linear,
            ActivationFunction.LEAKY_RELU: Activations.leaky_relu,
        }
        return mapping.get(activation, Activations.linear)


# ═══════════════════════════════════════════════════════════════════════════════
# NEURON AGENT
# ═══════════════════════════════════════════════════════════════════════════════


class NeuronAgent(BaseAgent):
    """
    An agent that behaves like a neuron.
    
    Each neuron:
    - Collects inputs from incoming synapses
    - Applies activation function
    - Propagates output through outgoing synapses
    - Can learn by adjusting weights
    """
    
    LEVEL = AgentLevel.WORKER
    DEFAULT_CAPABILITIES = {Capability.EXECUTE}
    
    def __init__(
        self,
        name: str,
        neuron_type: NeuronType = NeuronType.HIDDEN,
        activation: ActivationFunction = ActivationFunction.RELU,
        threshold: float = 0.5,
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._neuron_type = neuron_type
        self._activation = activation
        self._activation_fn = Activations.get_function(activation)
        self._threshold = threshold
        
        # Connections
        self._incoming_synapses: Dict[str, Synapse] = {}
        self._outgoing_synapses: Dict[str, Synapse] = {}
        
        # State
        self._accumulated_input: float = 0.0
        self._last_output: float = 0.0
        self._input_buffer: List[NeuralSignal] = []
        
        # Memory (for recurrent neurons)
        self._memory: List[float] = []
        self._memory_size: int = 10
        
        # Learning
        self._error: float = 0.0
        self._learning_enabled: bool = True
        
        # Statistics
        self._total_fires: int = 0
        self._total_signals_received: int = 0
    
    @property
    def neuron_type(self) -> NeuronType:
        return self._neuron_type
    
    @property
    def last_output(self) -> float:
        return self._last_output
    
    def connect_to(
        self,
        target: "NeuronAgent",
        weight: float = 0.5,
        **kwargs
    ) -> Synapse:
        """Create a synapse to another neuron."""
        synapse = Synapse(
            source_id=self._agent_id,
            target_id=target.agent_id,
            weight=weight,
            **kwargs
        )
        
        self._outgoing_synapses[target.agent_id] = synapse
        target._incoming_synapses[self._agent_id] = synapse
        
        return synapse
    
    def receive_signal(self, signal: NeuralSignal) -> None:
        """Receive a signal from another neuron."""
        self._input_buffer.append(signal)
        self._total_signals_received += 1
    
    async def _on_initialize(self) -> None:
        """Initialize the neuron."""
        pass
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """
        Execute the neuron's forward pass.
        
        This is where the neuron processes its inputs and fires.
        """
        # Process input buffer
        if self._neuron_type == NeuronType.INPUT:
            # Input neurons take external input
            self._accumulated_input = task.input_data.get("input_signal", 0.0)
        else:
            # Other neurons sum weighted inputs
            self._accumulated_input = self._process_inputs()
        
        # Apply activation
        output = self._fire()
        
        # Propagate to connected neurons
        await self._propagate(output, task)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={
                "neuron_id": self._agent_id,
                "neuron_type": self._neuron_type.value,
                "input": self._accumulated_input,
                "output": output,
                "fired": output > self._threshold
            },
            quality_score=min(1.0, abs(output))
        )
    
    def _process_inputs(self) -> float:
        """Process all inputs through synapses."""
        total = 0.0
        
        for signal in self._input_buffer:
            synapse = self._incoming_synapses.get(signal.source_neuron)
            if synapse:
                total += synapse.transmit(signal.value)
            else:
                total += signal.value
        
        # Clear buffer
        self._input_buffer.clear()
        
        # Add memory for recurrent neurons
        if self._neuron_type == NeuronType.RECURRENT and self._memory:
            memory_contribution = sum(self._memory) / len(self._memory) * 0.3
            total += memory_contribution
        
        return total
    
    def _fire(self) -> float:
        """Apply activation and fire."""
        output = self._activation_fn(self._accumulated_input)
        self._last_output = output
        
        if output > self._threshold:
            self._total_fires += 1
        
        # Update memory
        self._memory.append(output)
        if len(self._memory) > self._memory_size:
            self._memory.pop(0)
        
        return output
    
    async def _propagate(self, output: float, task: Task) -> None:
        """Propagate output to connected neurons."""
        signal = NeuralSignal(
            value=output,
            source_neuron=self._agent_id,
            path=[self._agent_id],
            payload={"task_id": task.task_id}
        )
        
        # Send to all outgoing connections
        for target_id, synapse in self._outgoing_synapses.items():
            transmitted = synapse.transmit(output)
            signal_copy = NeuralSignal(
                value=transmitted,
                source_neuron=self._agent_id,
                path=signal.path.copy(),
                payload=signal.payload.copy()
            )
            
            # Would send to target neuron
            # In real implementation, would use messaging system
    
    def backpropagate(self, error: float) -> Dict[str, float]:
        """
        Backpropagate error through this neuron.
        
        Returns errors to propagate to upstream neurons.
        """
        self._error = error
        upstream_errors: Dict[str, float] = {}
        
        if not self._learning_enabled:
            return upstream_errors
        
        # Adjust outgoing synapse weights
        for synapse in self._outgoing_synapses.values():
            synapse.adjust_weight(error * self._last_output)
        
        # Calculate errors for upstream neurons
        for source_id, synapse in self._incoming_synapses.items():
            upstream_errors[source_id] = error * synapse.weight
        
        return upstream_errors
    
    def get_neuron_stats(self) -> Dict[str, Any]:
        """Get statistics about this neuron."""
        return {
            "neuron_id": self._agent_id,
            "type": self._neuron_type.value,
            "activation": self._activation.value,
            "threshold": self._threshold,
            "total_fires": self._total_fires,
            "total_signals": self._total_signals_received,
            "incoming_connections": len(self._incoming_synapses),
            "outgoing_connections": len(self._outgoing_synapses),
            "last_output": self._last_output,
            "error": self._error
        }


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIALIZED NEURON TYPES
# ═══════════════════════════════════════════════════════════════════════════════


class InputNeuron(NeuronAgent):
    """Neuron that receives external input."""
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            neuron_type=NeuronType.INPUT,
            activation=ActivationFunction.LINEAR,
            **kwargs
        )


class OutputNeuron(NeuronAgent):
    """Neuron that produces final output."""
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            neuron_type=NeuronType.OUTPUT,
            activation=ActivationFunction.SIGMOID,
            **kwargs
        )


class RecurrentNeuron(NeuronAgent):
    """Neuron with memory of past activations."""
    
    def __init__(self, name: str, memory_size: int = 10, **kwargs):
        super().__init__(
            name=name,
            neuron_type=NeuronType.RECURRENT,
            activation=ActivationFunction.TANH,
            **kwargs
        )
        self._memory_size = memory_size


class AttentionNeuron(NeuronAgent):
    """
    Neuron that implements attention mechanism.
    
    Weighs inputs based on relevance to a query.
    """
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            neuron_type=NeuronType.ATTENTION,
            activation=ActivationFunction.SOFTMAX,
            **kwargs
        )
        self._attention_weights: Dict[str, float] = {}
    
    def _process_inputs(self) -> float:
        """Process inputs with attention weighting."""
        if not self._input_buffer:
            return 0.0
        
        # Calculate attention scores
        scores = []
        for signal in self._input_buffer:
            # Simple attention: based on signal strength
            score = abs(signal.value)
            scores.append(score)
        
        # Apply softmax
        if scores:
            attention_weights = Activations.softmax(scores)
            
            # Weighted sum
            total = 0.0
            for signal, weight in zip(self._input_buffer, attention_weights):
                synapse = self._incoming_synapses.get(signal.source_neuron)
                if synapse:
                    total += synapse.transmit(signal.value) * weight
                else:
                    total += signal.value * weight
                
                self._attention_weights[signal.source_neuron] = weight
        else:
            total = 0.0
        
        self._input_buffer.clear()
        return total


class MemoryNeuron(NeuronAgent):
    """
    Neuron that acts as long-term memory.
    
    Can store and retrieve information over long periods.
    """
    
    def __init__(self, name: str, memory_capacity: int = 100, **kwargs):
        super().__init__(
            name=name,
            neuron_type=NeuronType.MEMORY,
            activation=ActivationFunction.LINEAR,
            **kwargs
        )
        self._memory_capacity = memory_capacity
        self._long_term_memory: Dict[str, float] = {}
        self._memory_timestamps: Dict[str, datetime] = {}
    
    def store(self, key: str, value: float) -> None:
        """Store a value in memory."""
        if len(self._long_term_memory) >= self._memory_capacity:
            # Remove oldest
            oldest = min(self._memory_timestamps, key=self._memory_timestamps.get)
            del self._long_term_memory[oldest]
            del self._memory_timestamps[oldest]
        
        self._long_term_memory[key] = value
        self._memory_timestamps[key] = datetime.utcnow()
    
    def retrieve(self, key: str) -> Optional[float]:
        """Retrieve a value from memory."""
        return self._long_term_memory.get(key)
    
    def _fire(self) -> float:
        """Fire and potentially store in memory."""
        output = super()._fire()
        
        # Auto-store strong signals
        if abs(output) > 0.8:
            key = f"auto_{str(uuid4())[:6]}"
            self.store(key, output)
        
        return output


# ═══════════════════════════════════════════════════════════════════════════════
# NEURAL NETWORK (COLLECTIVE OF NEURONS)
# ═══════════════════════════════════════════════════════════════════════════════


class NeuralCollective(BaseAgent):
    """
    A collective of neurons that forms a thinking network.
    
    The collective:
    - Manages neuron creation and connection
    - Coordinates forward and backward passes
    - Enables emergent reasoning through the network
    - Can learn and adapt
    """
    
    LEVEL = AgentLevel.ARCHITECT
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.SYNTHESIZE,
        Capability.EMERGENT_DETECT,
    }
    
    def __init__(
        self,
        name: str = "NeuralCollective",
        architecture: Optional[List[int]] = None,
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        
        # Architecture: list of layer sizes [input, hidden1, hidden2, ..., output]
        self._architecture = architecture or [3, 5, 5, 2]
        
        # Neurons organized by layer
        self._layers: List[List[NeuronAgent]] = []
        
        # All neurons
        self._neurons: Dict[str, NeuronAgent] = {}
        
        # Training
        self._learning_rate: float = 0.01
        self._epochs_trained: int = 0
    
    async def _on_initialize(self) -> None:
        """Build the neural network."""
        await self._build_network()
    
    async def _build_network(self) -> None:
        """Build the network according to architecture."""
        previous_layer: List[NeuronAgent] = []
        
        for layer_idx, layer_size in enumerate(self._architecture):
            current_layer: List[NeuronAgent] = []
            
            for neuron_idx in range(layer_size):
                # Determine neuron type
                if layer_idx == 0:
                    neuron = InputNeuron(
                        name=f"input_{neuron_idx}",
                        parent_id=self._agent_id
                    )
                elif layer_idx == len(self._architecture) - 1:
                    neuron = OutputNeuron(
                        name=f"output_{neuron_idx}",
                        parent_id=self._agent_id
                    )
                else:
                    neuron = NeuronAgent(
                        name=f"hidden_{layer_idx}_{neuron_idx}",
                        neuron_type=NeuronType.HIDDEN,
                        parent_id=self._agent_id
                    )
                
                await neuron.initialize()
                current_layer.append(neuron)
                self._neurons[neuron.agent_id] = neuron
                self._children[neuron.agent_id] = neuron
            
            # Connect to previous layer (fully connected)
            if previous_layer:
                for prev_neuron in previous_layer:
                    for curr_neuron in current_layer:
                        # Random initial weight
                        weight = random.uniform(-1, 1) / math.sqrt(len(previous_layer))
                        prev_neuron.connect_to(curr_neuron, weight=weight)
            
            self._layers.append(current_layer)
            previous_layer = current_layer
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """
        Execute a forward pass through the network.
        """
        input_values = task.input_data.get("inputs", [])
        
        # Ensure input matches network input size
        if len(input_values) != len(self._layers[0]):
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error=f"Input size mismatch: expected {len(self._layers[0])}, got {len(input_values)}"
            )
        
        # Forward pass
        outputs = await self._forward_pass(input_values, task)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={
                "outputs": outputs,
                "architecture": self._architecture,
                "total_neurons": len(self._neurons)
            },
            quality_score=0.9
        )
    
    async def _forward_pass(
        self,
        inputs: List[float],
        task: Task
    ) -> List[float]:
        """Execute forward pass through all layers."""
        # Set input layer values
        for i, input_val in enumerate(inputs):
            input_task = Task(
                name=f"input_{i}",
                input_data={"input_signal": input_val}
            )
            await self._layers[0][i].execute(input_task)
        
        # Propagate through hidden layers
        for layer_idx in range(1, len(self._layers)):
            layer = self._layers[layer_idx]
            previous_layer = self._layers[layer_idx - 1]
            
            # Collect outputs from previous layer
            for prev_neuron in previous_layer:
                signal = NeuralSignal(
                    value=prev_neuron.last_output,
                    source_neuron=prev_neuron.agent_id
                )
                
                # Send to all connected neurons in current layer
                for curr_neuron in layer:
                    if prev_neuron.agent_id in curr_neuron._incoming_synapses:
                        curr_neuron.receive_signal(signal)
            
            # Fire all neurons in current layer
            for neuron in layer:
                await neuron.execute(Task(name=f"fire_{neuron.agent_id}"))
        
        # Collect outputs
        outputs = [n.last_output for n in self._layers[-1]]
        return outputs
    
    async def train(
        self,
        training_data: List[Tuple[List[float], List[float]]],
        epochs: int = 100
    ) -> Dict[str, Any]:
        """
        Train the network using backpropagation.
        
        Args:
            training_data: List of (input, expected_output) pairs
            epochs: Number of training epochs
        
        Returns:
            Training statistics
        """
        losses = []
        
        for epoch in range(epochs):
            epoch_loss = 0.0
            
            for inputs, expected in training_data:
                # Forward pass
                task = Task(
                    name=f"train_{epoch}",
                    input_data={"inputs": inputs}
                )
                result = await self.execute(task)
                
                if result.status != TaskStatus.COMPLETED:
                    continue
                
                actual = result.output["outputs"]
                
                # Calculate loss (MSE)
                loss = sum((a - e) ** 2 for a, e in zip(actual, expected)) / len(expected)
                epoch_loss += loss
                
                # Backpropagation
                await self._backward_pass(actual, expected)
            
            avg_loss = epoch_loss / len(training_data)
            losses.append(avg_loss)
            self._epochs_trained += 1
        
        return {
            "epochs_trained": epochs,
            "total_epochs": self._epochs_trained,
            "final_loss": losses[-1] if losses else 0,
            "loss_history": losses[-10:]  # Last 10
        }
    
    async def _backward_pass(
        self,
        actual: List[float],
        expected: List[float]
    ) -> None:
        """Execute backward pass for learning."""
        # Calculate output layer errors
        output_errors = [
            (e - a) for a, e in zip(actual, expected)
        ]
        
        # Start from output layer
        current_errors = {
            neuron.agent_id: error
            for neuron, error in zip(self._layers[-1], output_errors)
        }
        
        # Backpropagate through layers
        for layer_idx in range(len(self._layers) - 1, -1, -1):
            layer = self._layers[layer_idx]
            new_errors: Dict[str, float] = defaultdict(float)
            
            for neuron in layer:
                if neuron.agent_id in current_errors:
                    error = current_errors[neuron.agent_id]
                    upstream = neuron.backpropagate(error)
                    
                    for source_id, upstream_error in upstream.items():
                        new_errors[source_id] += upstream_error
            
            current_errors = dict(new_errors)
    
    def get_network_stats(self) -> Dict[str, Any]:
        """Get comprehensive network statistics."""
        total_synapses = sum(
            len(n._outgoing_synapses)
            for n in self._neurons.values()
        )
        
        total_fires = sum(
            n._total_fires
            for n in self._neurons.values()
        )
        
        return {
            "architecture": self._architecture,
            "total_neurons": len(self._neurons),
            "total_synapses": total_synapses,
            "total_fires": total_fires,
            "epochs_trained": self._epochs_trained,
            "layers": len(self._layers),
            "input_size": len(self._layers[0]),
            "output_size": len(self._layers[-1])
        }


# ═══════════════════════════════════════════════════════════════════════════════
# ADVANCED ARCHITECTURES
# ═══════════════════════════════════════════════════════════════════════════════


class RecurrentNeuralCollective(NeuralCollective):
    """
    Neural collective with recurrent connections.
    
    Enables the network to maintain state and process sequences.
    """
    
    def __init__(
        self,
        name: str = "RNNCollective",
        architecture: Optional[List[int]] = None,
        **kwargs
    ):
        super().__init__(name=name, architecture=architecture, **kwargs)
        self._hidden_state: List[float] = []
    
    async def _build_network(self) -> None:
        """Build network with recurrent neurons in hidden layers."""
        await super()._build_network()
        
        # Add recurrent connections within hidden layers
        for layer_idx in range(1, len(self._layers) - 1):
            layer = self._layers[layer_idx]
            
            for neuron in layer:
                # Self-connection
                neuron.connect_to(neuron, weight=0.3)


class AttentionNeuralCollective(NeuralCollective):
    """
    Neural collective with attention mechanism.
    
    Uses attention to focus on relevant inputs.
    """
    
    def __init__(
        self,
        name: str = "AttentionCollective",
        architecture: Optional[List[int]] = None,
        **kwargs
    ):
        super().__init__(name=name, architecture=architecture, **kwargs)
    
    async def _build_network(self) -> None:
        """Build network with attention layer."""
        await super()._build_network()
        
        # Add attention layer between input and first hidden
        attention_neurons: List[AttentionNeuron] = []
        
        for i in range(len(self._layers[0])):
            attention = AttentionNeuron(
                name=f"attention_{i}",
                parent_id=self._agent_id
            )
            await attention.initialize()
            attention_neurons.append(attention)
            self._neurons[attention.agent_id] = attention
        
        # Reconnect: input -> attention -> hidden
        # (Simplified - full implementation would restructure connections)


# ═══════════════════════════════════════════════════════════════════════════════
# FACTORY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


async def create_neural_collective(
    architecture: List[int],
    collective_type: str = "feedforward"
) -> NeuralCollective:
    """
    Create a neural collective.
    
    Args:
        architecture: Layer sizes [input, hidden..., output]
        collective_type: "feedforward", "recurrent", or "attention"
    
    Returns:
        Initialized neural collective
    """
    if collective_type == "recurrent":
        collective = RecurrentNeuralCollective(architecture=architecture)
    elif collective_type == "attention":
        collective = AttentionNeuralCollective(architecture=architecture)
    else:
        collective = NeuralCollective(architecture=architecture)
    
    await collective.initialize()
    return collective


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Types
    "ActivationFunction",
    "NeuronType",
    
    # Components
    "Synapse",
    "NeuralSignal",
    "Activations",
    
    # Neurons
    "NeuronAgent",
    "InputNeuron",
    "OutputNeuron",
    "RecurrentNeuron",
    "AttentionNeuron",
    "MemoryNeuron",
    
    # Collectives
    "NeuralCollective",
    "RecurrentNeuralCollective",
    "AttentionNeuralCollective",
    
    # Factory
    "create_neural_collective",
]

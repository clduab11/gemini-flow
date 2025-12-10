"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗ ██╗         ███╗   ███╗███████╗ ║
║   ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗██║         ████╗ ████║██╔════╝ ║
║   ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║██║         ██╔████╔██║███████╗ ║
║   ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██║         ██║╚██╔╝██║╚════██║ ║
║   ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║███████╗    ██║ ╚═╝ ██║███████║ ║
║   ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝╚══════╝ ║
║                                                                              ║
║                          THE NEURAL MESH                                     ║
║                                                                              ║
║   "We are not a network OF agents. We ARE the network."                      ║
║                                                                              ║
║   NEURAL MESH agents form a living computational substrate:                  ║
║   - Each agent is a neuron with activation and connections                   ║
║   - Information flows through weighted synaptic connections                  ║
║   - The mesh learns by adjusting connection weights                          ║
║   - Layers emerge organically based on information flow                      ║
║   - The collective computes through propagation, not iteration               ║
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
    Any, Callable, Dict, List, Optional, Set, Tuple, TypeVar, Union
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
# NEURAL PRIMITIVES
# ═══════════════════════════════════════════════════════════════════════════════


class ActivationFunction(str, Enum):
    """Activation functions for neurons."""
    SIGMOID = "sigmoid"
    TANH = "tanh"
    RELU = "relu"
    LEAKY_RELU = "leaky_relu"
    SOFTMAX = "softmax"
    LINEAR = "linear"


def sigmoid(x: float) -> float:
    """Sigmoid activation."""
    return 1.0 / (1.0 + math.exp(-max(-500, min(500, x))))


def tanh(x: float) -> float:
    """Tanh activation."""
    return math.tanh(x)


def relu(x: float) -> float:
    """ReLU activation."""
    return max(0.0, x)


def leaky_relu(x: float, alpha: float = 0.01) -> float:
    """Leaky ReLU activation."""
    return x if x > 0 else alpha * x


ACTIVATION_FUNCTIONS = {
    ActivationFunction.SIGMOID: sigmoid,
    ActivationFunction.TANH: tanh,
    ActivationFunction.RELU: relu,
    ActivationFunction.LEAKY_RELU: leaky_relu,
    ActivationFunction.LINEAR: lambda x: x,
}


@dataclass
class Synapse:
    """
    A connection between two neurons.
    
    Synapses carry signals and have weights that are adjusted during learning.
    """
    synapse_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Connection
    source_id: str = ""
    target_id: str = ""
    
    # Weight
    weight: float = 0.5
    
    # Plasticity
    learning_rate: float = 0.01
    momentum: float = 0.0
    last_delta: float = 0.0
    
    # State
    enabled: bool = True
    
    def transmit(self, signal: float) -> float:
        """Transmit a signal through the synapse."""
        if not self.enabled:
            return 0.0
        return signal * self.weight
    
    def adjust(self, error: float) -> None:
        """Adjust weight based on error (backpropagation)."""
        delta = self.learning_rate * error + self.momentum * self.last_delta
        self.weight += delta
        self.last_delta = delta
        
        # Clamp weight
        self.weight = max(-5.0, min(5.0, self.weight))


@dataclass
class NeuralSignal:
    """A signal propagating through the neural mesh."""
    signal_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Value
    value: float = 0.0
    
    # Source
    source_neuron_id: str = ""
    
    # Metadata
    timestamp: float = field(default_factory=time.time)
    propagation_depth: int = 0
    
    # Trace (for backprop)
    path: List[str] = field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# NEURON AGENT
# ═══════════════════════════════════════════════════════════════════════════════


class NeuronType(str, Enum):
    """Types of neurons in the mesh."""
    INPUT = "input"         # Receives external input
    HIDDEN = "hidden"       # Internal processing
    OUTPUT = "output"       # Produces output
    BIAS = "bias"           # Always-on bias neuron
    MEMORY = "memory"       # Stores state (LSTM-like)
    ATTENTION = "attention" # Attention mechanism


class NeuronAgent(BaseAgent):
    """
    A single neuron in the neural mesh.
    
    Each neuron:
    - Receives signals from input synapses
    - Accumulates and activates
    - Propagates to output synapses
    - Adjusts weights during learning
    """
    
    LEVEL = AgentLevel.WORKER
    DEFAULT_CAPABILITIES = {Capability.EXECUTE, Capability.TRANSFORM}
    
    def __init__(
        self,
        name: str,
        neuron_type: NeuronType = NeuronType.HIDDEN,
        activation: ActivationFunction = ActivationFunction.SIGMOID,
        layer: int = 0,
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._neuron_type = neuron_type
        self._activation_fn = activation
        self._layer = layer
        
        # Synapses
        self._input_synapses: Dict[str, Synapse] = {}   # From other neurons
        self._output_synapses: Dict[str, Synapse] = {}  # To other neurons
        
        # State
        self._accumulated_input: float = 0.0
        self._current_activation: float = 0.0
        self._bias: float = random.uniform(-0.5, 0.5)
        
        # Memory (for MEMORY type)
        self._cell_state: float = 0.0
        
        # Learning
        self._error: float = 0.0
        self._delta: float = 0.0
        
        # Signal queue
        self._signal_queue: asyncio.Queue[NeuralSignal] = asyncio.Queue()
    
    @property
    def neuron_type(self) -> NeuronType:
        return self._neuron_type
    
    @property
    def layer(self) -> int:
        return self._layer
    
    @property
    def activation(self) -> float:
        return self._current_activation
    
    @property
    def input_connections(self) -> List[str]:
        return list(self._input_synapses.keys())
    
    @property
    def output_connections(self) -> List[str]:
        return list(self._output_synapses.keys())
    
    async def _on_initialize(self) -> None:
        """Initialize neuron."""
        # Start signal processing loop
        asyncio.create_task(self._signal_loop())
    
    def connect_input(self, source_id: str, weight: Optional[float] = None) -> Synapse:
        """Create input synapse from another neuron."""
        synapse = Synapse(
            source_id=source_id,
            target_id=self._agent_id,
            weight=weight if weight is not None else random.uniform(-1, 1)
        )
        self._input_synapses[source_id] = synapse
        return synapse
    
    def connect_output(self, target_id: str, weight: Optional[float] = None) -> Synapse:
        """Create output synapse to another neuron."""
        synapse = Synapse(
            source_id=self._agent_id,
            target_id=target_id,
            weight=weight if weight is not None else random.uniform(-1, 1)
        )
        self._output_synapses[target_id] = synapse
        return synapse
    
    async def receive_signal(self, signal: NeuralSignal) -> None:
        """Receive a signal from another neuron."""
        await self._signal_queue.put(signal)
    
    async def _signal_loop(self) -> None:
        """Process incoming signals."""
        while self._running:
            try:
                signal = await asyncio.wait_for(
                    self._signal_queue.get(),
                    timeout=0.1
                )
                
                # Get synapse for this source
                synapse = self._input_synapses.get(signal.source_neuron_id)
                if synapse:
                    # Transmit through synapse (apply weight)
                    weighted_signal = synapse.transmit(signal.value)
                    self._accumulated_input += weighted_signal
                
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
    
    def activate(self) -> float:
        """Activate the neuron and compute output."""
        # Add bias
        total_input = self._accumulated_input + self._bias
        
        # Apply activation function
        activation_fn = ACTIVATION_FUNCTIONS.get(
            self._activation_fn,
            sigmoid
        )
        
        if self._neuron_type == NeuronType.MEMORY:
            # LSTM-like behavior
            forget_gate = sigmoid(total_input * 0.5)
            input_gate = sigmoid(total_input * 0.5)
            
            self._cell_state = forget_gate * self._cell_state + input_gate * tanh(total_input)
            self._current_activation = tanh(self._cell_state)
        else:
            self._current_activation = activation_fn(total_input)
        
        # Reset accumulated input
        self._accumulated_input = 0.0
        
        return self._current_activation
    
    async def propagate(self, mesh: "NeuralMesh") -> None:
        """Propagate activation to connected neurons."""
        signal = NeuralSignal(
            value=self._current_activation,
            source_neuron_id=self._agent_id
        )
        
        for target_id in self._output_synapses:
            target_neuron = mesh.get_neuron(target_id)
            if target_neuron:
                await target_neuron.receive_signal(signal)
    
    def compute_error(self, target: Optional[float] = None) -> float:
        """Compute error for backpropagation."""
        if target is not None:
            # Output neuron - direct error
            self._error = target - self._current_activation
        else:
            # Hidden neuron - backpropagated error
            self._error = sum(
                synapse.weight * 0.0  # Would be downstream error
                for synapse in self._output_synapses.values()
            )
        
        # Compute delta
        activation_derivative = self._current_activation * (1 - self._current_activation)
        self._delta = self._error * activation_derivative
        
        return self._error
    
    def update_weights(self) -> None:
        """Update input synapse weights based on error."""
        for synapse in self._input_synapses.values():
            synapse.adjust(self._delta)
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute as part of neural computation."""
        # Set input if this is an input neuron
        if self._neuron_type == NeuronType.INPUT:
            input_value = task.input_data.get("value", 0.0)
            self._accumulated_input = input_value
        
        # Activate
        output = self.activate()
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={
                "neuron_id": self._agent_id,
                "activation": output,
                "layer": self._layer
            },
            quality_score=abs(output)  # Quality based on activation strength
        )


# ═══════════════════════════════════════════════════════════════════════════════
# NEURAL MESH - THE LIVING NETWORK
# ═══════════════════════════════════════════════════════════════════════════════


class MeshTopology(str, Enum):
    """Topology patterns for the mesh."""
    FEEDFORWARD = "feedforward"     # Classic layered
    RECURRENT = "recurrent"         # With feedback
    RESIDUAL = "residual"           # Skip connections
    ATTENTION = "attention"         # Self-attention
    RANDOM = "random"               # Random connections
    SMALL_WORLD = "small_world"     # Small-world network


class NeuralMesh(BaseAgent):
    """
    The Neural Mesh - a living computational substrate made of neuron agents.
    
    The mesh:
    - Organizes neurons into layers
    - Manages signal propagation
    - Performs learning through backpropagation
    - Can grow and prune connections
    - Exhibits emergent computation
    """
    
    LEVEL = AgentLevel.ARCHITECT
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.EXECUTE,
        Capability.SELF_MODIFY,
    }
    
    def __init__(
        self,
        name: str,
        topology: MeshTopology = MeshTopology.FEEDFORWARD,
        input_size: int = 10,
        hidden_layers: List[int] = None,
        output_size: int = 5,
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        
        self._topology = topology
        self._input_size = input_size
        self._hidden_layers = hidden_layers or [20, 10]
        self._output_size = output_size
        
        # Neurons organized by layer
        self._layers: List[List[NeuronAgent]] = []
        self._all_neurons: Dict[str, NeuronAgent] = {}
        
        # Learning
        self._learning_rate = 0.01
        self._training_iterations = 0
        self._loss_history: List[float] = []
    
    @property
    def topology(self) -> MeshTopology:
        return self._topology
    
    @property
    def layer_count(self) -> int:
        return len(self._layers)
    
    @property
    def neuron_count(self) -> int:
        return len(self._all_neurons)
    
    def get_neuron(self, neuron_id: str) -> Optional[NeuronAgent]:
        """Get a neuron by ID."""
        return self._all_neurons.get(neuron_id)
    
    async def _on_initialize(self) -> None:
        """Build the neural mesh."""
        await self._build_mesh()
    
    async def _build_mesh(self) -> None:
        """Build the mesh according to topology."""
        layer_sizes = [self._input_size] + self._hidden_layers + [self._output_size]
        
        # Create neurons
        for layer_idx, size in enumerate(layer_sizes):
            layer: List[NeuronAgent] = []
            
            # Determine neuron type
            if layer_idx == 0:
                neuron_type = NeuronType.INPUT
            elif layer_idx == len(layer_sizes) - 1:
                neuron_type = NeuronType.OUTPUT
            else:
                neuron_type = NeuronType.HIDDEN
            
            for i in range(size):
                neuron = await self.spawn_child(
                    NeuronAgent,
                    name=f"neuron_L{layer_idx}_N{i}",
                    neuron_type=neuron_type,
                    layer=layer_idx
                )
                layer.append(neuron)
                self._all_neurons[neuron.agent_id] = neuron
            
            self._layers.append(layer)
        
        # Connect based on topology
        if self._topology == MeshTopology.FEEDFORWARD:
            await self._connect_feedforward()
        elif self._topology == MeshTopology.RECURRENT:
            await self._connect_recurrent()
        elif self._topology == MeshTopology.RESIDUAL:
            await self._connect_residual()
        elif self._topology == MeshTopology.SMALL_WORLD:
            await self._connect_small_world()
    
    async def _connect_feedforward(self) -> None:
        """Connect layers in feedforward pattern."""
        for i in range(len(self._layers) - 1):
            current_layer = self._layers[i]
            next_layer = self._layers[i + 1]
            
            for source in current_layer:
                for target in next_layer:
                    # Bidirectional synapse registration
                    source.connect_output(target.agent_id)
                    target.connect_input(source.agent_id)
    
    async def _connect_recurrent(self) -> None:
        """Connect with recurrent connections."""
        # First, feedforward
        await self._connect_feedforward()
        
        # Add recurrent connections within hidden layers
        for layer in self._layers[1:-1]:  # Hidden layers only
            for i, neuron in enumerate(layer):
                # Connect to next neuron in same layer (circular)
                next_idx = (i + 1) % len(layer)
                next_neuron = layer[next_idx]
                
                neuron.connect_output(next_neuron.agent_id)
                next_neuron.connect_input(neuron.agent_id)
    
    async def _connect_residual(self) -> None:
        """Connect with skip connections."""
        # Feedforward base
        await self._connect_feedforward()
        
        # Add skip connections
        for i in range(len(self._layers) - 2):
            for j in range(i + 2, len(self._layers)):
                # Connect some neurons from layer i to layer j
                source_layer = self._layers[i]
                target_layer = self._layers[j]
                
                # Connect 20% of possible pairs
                for source in source_layer:
                    for target in target_layer:
                        if random.random() < 0.2:
                            source.connect_output(target.agent_id)
                            target.connect_input(source.agent_id)
    
    async def _connect_small_world(self) -> None:
        """Connect in small-world pattern."""
        # Feedforward base
        await self._connect_feedforward()
        
        # Add random long-range connections
        all_neurons = list(self._all_neurons.values())
        
        num_random = int(len(all_neurons) * 0.1)  # 10% random connections
        
        for _ in range(num_random):
            source = random.choice(all_neurons)
            target = random.choice(all_neurons)
            
            if source.agent_id != target.agent_id:
                source.connect_output(target.agent_id)
                target.connect_input(source.agent_id)
    
    async def forward(self, inputs: List[float]) -> List[float]:
        """Forward pass through the mesh."""
        # Validate input size
        if len(inputs) != self._input_size:
            raise ValueError(f"Expected {self._input_size} inputs, got {len(inputs)}")
        
        # Set inputs
        input_layer = self._layers[0]
        for i, neuron in enumerate(input_layer):
            neuron._accumulated_input = inputs[i]
            neuron.activate()
        
        # Propagate through layers
        for layer_idx in range(1, len(self._layers)):
            current_layer = self._layers[layer_idx]
            prev_layer = self._layers[layer_idx - 1]
            
            # Accumulate inputs from previous layer
            for target in current_layer:
                for source in prev_layer:
                    if source.agent_id in target._input_synapses:
                        synapse = target._input_synapses[source.agent_id]
                        target._accumulated_input += synapse.transmit(source.activation)
            
            # Activate all neurons in current layer
            for neuron in current_layer:
                neuron.activate()
        
        # Get outputs
        output_layer = self._layers[-1]
        return [neuron.activation for neuron in output_layer]
    
    async def backward(self, targets: List[float]) -> float:
        """Backward pass - compute errors and update weights."""
        # Validate target size
        if len(targets) != self._output_size:
            raise ValueError(f"Expected {self._output_size} targets, got {len(targets)}")
        
        # Compute output layer errors
        output_layer = self._layers[-1]
        total_loss = 0.0
        
        for i, neuron in enumerate(output_layer):
            error = neuron.compute_error(targets[i])
            total_loss += error ** 2
        
        total_loss /= len(output_layer)
        
        # Backpropagate through hidden layers
        for layer_idx in range(len(self._layers) - 2, 0, -1):
            current_layer = self._layers[layer_idx]
            next_layer = self._layers[layer_idx + 1]
            
            for neuron in current_layer:
                # Sum of weighted downstream errors
                downstream_error = 0.0
                
                for downstream in next_layer:
                    if neuron.agent_id in downstream._input_synapses:
                        synapse = downstream._input_synapses[neuron.agent_id]
                        downstream_error += synapse.weight * downstream._delta
                
                # Compute neuron error
                activation_deriv = neuron.activation * (1 - neuron.activation)
                neuron._error = downstream_error
                neuron._delta = downstream_error * activation_deriv
        
        # Update weights for all layers except input
        for layer in self._layers[1:]:
            for neuron in layer:
                neuron.update_weights()
        
        self._loss_history.append(total_loss)
        self._training_iterations += 1
        
        return total_loss
    
    async def train(
        self,
        training_data: List[Tuple[List[float], List[float]]],
        epochs: int = 100,
        batch_size: int = 1
    ) -> Dict[str, Any]:
        """Train the mesh on data."""
        start_time = time.time()
        epoch_losses = []
        
        for epoch in range(epochs):
            epoch_loss = 0.0
            
            # Shuffle training data
            random.shuffle(training_data)
            
            for inputs, targets in training_data:
                # Forward
                await self.forward(inputs)
                
                # Backward
                loss = await self.backward(targets)
                epoch_loss += loss
            
            epoch_loss /= len(training_data)
            epoch_losses.append(epoch_loss)
        
        return {
            "epochs": epochs,
            "final_loss": epoch_losses[-1] if epoch_losses else 0.0,
            "loss_reduction": (
                (epoch_losses[0] - epoch_losses[-1]) / epoch_losses[0]
                if epoch_losses and epoch_losses[0] > 0 else 0.0
            ),
            "training_time": time.time() - start_time,
            "total_iterations": self._training_iterations
        }
    
    async def predict(self, inputs: List[float]) -> List[float]:
        """Make a prediction."""
        return await self.forward(inputs)
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute a neural computation task."""
        inputs = task.input_data.get("inputs", [])
        
        if not inputs:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="No inputs provided"
            )
        
        try:
            outputs = await self.predict(inputs)
            
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output={
                    "outputs": outputs,
                    "neuron_count": self.neuron_count,
                    "layer_count": self.layer_count
                },
                quality_score=0.9
            )
        except Exception as e:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error=str(e)
            )
    
    def get_mesh_state(self) -> Dict[str, Any]:
        """Get complete mesh state."""
        return {
            "topology": self._topology.value,
            "layers": [len(layer) for layer in self._layers],
            "total_neurons": self.neuron_count,
            "total_synapses": sum(
                len(n._input_synapses) + len(n._output_synapses)
                for n in self._all_neurons.values()
            ) // 2,
            "training_iterations": self._training_iterations,
            "recent_loss": self._loss_history[-10:] if self._loss_history else []
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SELF-MODIFICATION - NEUROPLASTICITY
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def grow_neuron(self, layer: int) -> NeuronAgent:
        """Add a neuron to a layer (neurogenesis)."""
        if layer <= 0 or layer >= len(self._layers) - 1:
            raise ValueError("Can only grow neurons in hidden layers")
        
        neuron = await self.spawn_child(
            NeuronAgent,
            name=f"neuron_grown_{uuid4().hex[:4]}",
            neuron_type=NeuronType.HIDDEN,
            layer=layer
        )
        
        self._layers[layer].append(neuron)
        self._all_neurons[neuron.agent_id] = neuron
        
        # Connect to adjacent layers
        prev_layer = self._layers[layer - 1]
        next_layer = self._layers[layer + 1]
        
        for source in prev_layer:
            source.connect_output(neuron.agent_id)
            neuron.connect_input(source.agent_id)
        
        for target in next_layer:
            neuron.connect_output(target.agent_id)
            target.connect_input(neuron.agent_id)
        
        return neuron
    
    async def prune_weak_connections(self, threshold: float = 0.1) -> int:
        """Remove weak connections (synaptic pruning)."""
        pruned_count = 0
        
        for neuron in self._all_neurons.values():
            weak_synapses = [
                syn_id for syn_id, syn in neuron._input_synapses.items()
                if abs(syn.weight) < threshold
            ]
            
            for syn_id in weak_synapses:
                del neuron._input_synapses[syn_id]
                pruned_count += 1
        
        return pruned_count
    
    async def strengthen_active_paths(self, factor: float = 1.1) -> None:
        """Strengthen frequently used paths (Hebbian learning)."""
        for neuron in self._all_neurons.values():
            if neuron.activation > 0.5:  # Active neuron
                for synapse in neuron._input_synapses.values():
                    synapse.weight *= factor
                    synapse.weight = max(-5.0, min(5.0, synapse.weight))


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Primitives
    "ActivationFunction",
    "Synapse",
    "NeuralSignal",
    
    # Neurons
    "NeuronType",
    "NeuronAgent",
    
    # Mesh
    "MeshTopology",
    "NeuralMesh",
]

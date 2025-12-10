"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██╗  ██╗██╗██╗   ██╗███████╗███╗   ███╗██╗███╗   ██╗██████╗               ║
║   ██║  ██║██║██║   ██║██╔════╝████╗ ████║██║████╗  ██║██╔══██╗              ║
║   ███████║██║██║   ██║█████╗  ██╔████╔██║██║██╔██╗ ██║██║  ██║              ║
║   ██╔══██║██║╚██╗ ██╔╝██╔══╝  ██║╚██╔╝██║██║██║╚██╗██║██║  ██║              ║
║   ██║  ██║██║ ╚████╔╝ ███████╗██║ ╚═╝ ██║██║██║ ╚████║██████╔╝              ║
║   ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝               ║
║                                                                              ║
║                       THE HIVEMIND SWARM                                     ║
║                                                                              ║
║   "Many minds. One purpose. Emergent intelligence."                          ║
║                                                                              ║
║   The HIVEMIND is not a collection of agents - it IS the agents:            ║
║   - Every drone shares consciousness with the collective                     ║
║   - Information propagates like ripples through water                        ║
║   - Decisions emerge from distributed voting                                 ║
║   - No single drone matters, but together they are unstoppable              ║
║   - The swarm exhibits intelligence no individual drone has                  ║
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
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field

import sys
sys.path.insert(0, '..')

from sovereign_core import (
    AgentLevel, AgentState, BaseAgent, Capability,
    CONSCIOUSNESS, Task, TaskResult, TaskStatus,
    SystemAwareness, AgentMessage, MessageType
)


# ═══════════════════════════════════════════════════════════════════════════════
# HIVEMIND SHARED CONSCIOUSNESS
# ═══════════════════════════════════════════════════════════════════════════════


class PheromoneType(str, Enum):
    """Types of pheromones for swarm communication."""
    FOOD = "food"           # Task/opportunity found
    DANGER = "danger"       # Problem detected
    TRAIL = "trail"         # Path to follow
    ASSEMBLY = "assembly"   # Gather here
    SUCCESS = "success"     # Good outcome achieved
    FAILURE = "failure"     # Bad outcome - avoid


@dataclass
class Pheromone:
    """
    A pheromone signal in the swarm.
    
    Pheromones are how drones communicate indirectly -
    they leave signals that others can detect.
    """
    pheromone_id: str = field(default_factory=lambda: str(uuid4())[:8])
    pheromone_type: PheromoneType = PheromoneType.TRAIL
    
    # Source
    emitter_id: str = ""
    
    # Location (abstract - could be task space, solution space, etc.)
    location: Tuple[float, ...] = (0.0, 0.0)
    
    # Strength (decays over time)
    strength: float = 1.0
    decay_rate: float = 0.1  # Per tick
    
    # Payload
    payload: Dict[str, Any] = field(default_factory=dict)
    
    # Timestamp
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def decay(self) -> bool:
        """Decay the pheromone. Returns False if evaporated."""
        self.strength -= self.decay_rate
        return self.strength > 0


@dataclass
class HivemindMemory:
    """
    Shared memory of the hivemind.
    
    Every drone can read and write to this shared space.
    """
    # Pheromone field
    pheromones: List[Pheromone] = field(default_factory=list)
    
    # Collective knowledge
    known_tasks: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    known_solutions: Dict[str, Any] = field(default_factory=dict)
    
    # Voting/consensus
    active_votes: Dict[str, Dict[str, int]] = field(default_factory=dict)
    
    # Statistics
    total_tasks_processed: int = 0
    successful_tasks: int = 0
    collective_quality: float = 0.0
    
    def add_pheromone(self, pheromone: Pheromone) -> None:
        """Add a pheromone to the field."""
        self.pheromones.append(pheromone)
    
    def get_pheromones_at(
        self,
        location: Tuple[float, ...],
        radius: float = 1.0,
        pheromone_type: Optional[PheromoneType] = None
    ) -> List[Pheromone]:
        """Get pheromones near a location."""
        results = []
        
        for p in self.pheromones:
            # Calculate distance (Euclidean)
            distance = math.sqrt(sum(
                (a - b) ** 2
                for a, b in zip(location, p.location)
            ))
            
            if distance <= radius:
                if pheromone_type is None or p.pheromone_type == pheromone_type:
                    results.append(p)
        
        return results
    
    def decay_all(self) -> None:
        """Decay all pheromones, removing evaporated ones."""
        self.pheromones = [p for p in self.pheromones if p.decay()]
    
    def start_vote(self, vote_id: str, options: List[str]) -> None:
        """Start a collective vote."""
        self.active_votes[vote_id] = {option: 0 for option in options}
    
    def cast_vote(self, vote_id: str, option: str) -> None:
        """Cast a vote."""
        if vote_id in self.active_votes and option in self.active_votes[vote_id]:
            self.active_votes[vote_id][option] += 1
    
    def get_vote_result(self, vote_id: str) -> Optional[str]:
        """Get the winning option of a vote."""
        if vote_id not in self.active_votes:
            return None
        
        votes = self.active_votes[vote_id]
        if not votes:
            return None
        
        return max(votes.items(), key=lambda x: x[1])[0]


class HivemindConsciousness:
    """
    The collective consciousness of the hivemind.
    
    This is what makes the swarm act as ONE entity.
    """
    
    _instance: Optional["HivemindConsciousness"] = None
    
    def __new__(cls) -> "HivemindConsciousness":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._memory = HivemindMemory()
        self._drones: Dict[str, "HiveDrone"] = {}
        self._queen: Optional["HiveQueen"] = None
        
        # Communication channels
        self._broadcast_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
        
        # Swarm state
        self._swarm_focus: Optional[str] = None  # Current collective goal
        self._swarm_mood: str = "neutral"  # Can affect behavior
        
        # Background task
        self._decay_task: Optional[asyncio.Task] = None
    
    @property
    def memory(self) -> HivemindMemory:
        return self._memory
    
    @property
    def drone_count(self) -> int:
        return len(self._drones)
    
    @property
    def swarm_focus(self) -> Optional[str]:
        return self._swarm_focus
    
    def register_drone(self, drone: "HiveDrone") -> None:
        """Register a drone with the hivemind."""
        self._drones[drone.agent_id] = drone
    
    def unregister_drone(self, drone_id: str) -> None:
        """Unregister a drone."""
        self._drones.pop(drone_id, None)
    
    def register_queen(self, queen: "HiveQueen") -> None:
        """Register the queen."""
        self._queen = queen
    
    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast a message to all drones."""
        await self._broadcast_queue.put(message)
    
    def emit_pheromone(
        self,
        emitter_id: str,
        pheromone_type: PheromoneType,
        location: Tuple[float, ...],
        strength: float = 1.0,
        payload: Optional[Dict[str, Any]] = None
    ) -> Pheromone:
        """Emit a pheromone into the field."""
        pheromone = Pheromone(
            pheromone_type=pheromone_type,
            emitter_id=emitter_id,
            location=location,
            strength=strength,
            payload=payload or {}
        )
        self._memory.add_pheromone(pheromone)
        return pheromone
    
    def sense_pheromones(
        self,
        location: Tuple[float, ...],
        radius: float = 1.0,
        pheromone_type: Optional[PheromoneType] = None
    ) -> List[Pheromone]:
        """Sense pheromones at a location."""
        return self._memory.get_pheromones_at(location, radius, pheromone_type)
    
    def set_swarm_focus(self, focus: str) -> None:
        """Set the collective focus of the swarm."""
        self._swarm_focus = focus
    
    async def start_decay_loop(self) -> None:
        """Start the pheromone decay loop."""
        async def decay_loop():
            while True:
                self._memory.decay_all()
                await asyncio.sleep(1.0)
        
        self._decay_task = asyncio.create_task(decay_loop())
    
    def stop_decay_loop(self) -> None:
        """Stop the decay loop."""
        if self._decay_task:
            self._decay_task.cancel()


# Global hivemind instance
HIVEMIND = HivemindConsciousness()


# ═══════════════════════════════════════════════════════════════════════════════
# HIVE DRONE - INDIVIDUAL SWARM UNIT
# ═══════════════════════════════════════════════════════════════════════════════


class DroneRole(str, Enum):
    """Roles a drone can take in the swarm."""
    SCOUT = "scout"       # Explores and finds tasks
    WORKER = "worker"     # Executes tasks
    SOLDIER = "soldier"   # Handles problems
    NURSE = "nurse"       # Maintains other drones
    FORAGER = "forager"   # Gathers resources


class HiveDrone(BaseAgent):
    """
    A single drone in the hivemind swarm.
    
    Drones are simple units that together create complex behavior:
    - They follow pheromone trails
    - They communicate through the shared consciousness
    - They adapt their role based on swarm needs
    - They don't make individual decisions - they follow the swarm
    """
    
    LEVEL = AgentLevel.WORKER
    DEFAULT_CAPABILITIES = {Capability.EXECUTE}
    
    def __init__(
        self,
        name: str,
        role: DroneRole = DroneRole.WORKER,
        position: Tuple[float, float] = (0.0, 0.0),
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._role = role
        self._position = position
        
        # Drone state
        self._energy = 1.0
        self._carrying: Optional[Any] = None
        
        # Movement
        self._velocity = (0.0, 0.0)
        self._max_speed = 1.0
        
        # Sensing
        self._sense_radius = 2.0
    
    @property
    def role(self) -> DroneRole:
        return self._role
    
    @property
    def position(self) -> Tuple[float, float]:
        return self._position
    
    async def _on_initialize(self) -> None:
        """Register with hivemind."""
        HIVEMIND.register_drone(self)
    
    async def _on_terminate(self) -> None:
        """Unregister from hivemind."""
        HIVEMIND.unregister_drone(self._agent_id)
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute task as part of the swarm."""
        # Emit "working" pheromone
        HIVEMIND.emit_pheromone(
            emitter_id=self._agent_id,
            pheromone_type=PheromoneType.TRAIL,
            location=self._position,
            payload={"task_id": task.task_id}
        )
        
        # Execute based on role
        if self._role == DroneRole.SCOUT:
            result = await self._scout_execute(task)
        elif self._role == DroneRole.WORKER:
            result = await self._worker_execute(task)
        elif self._role == DroneRole.SOLDIER:
            result = await self._soldier_execute(task)
        else:
            result = await self._generic_execute(task)
        
        # Emit result pheromone
        pheromone_type = PheromoneType.SUCCESS if result.status == TaskStatus.COMPLETED else PheromoneType.FAILURE
        HIVEMIND.emit_pheromone(
            emitter_id=self._agent_id,
            pheromone_type=pheromone_type,
            location=self._position,
            strength=result.quality_score,
            payload={"task_id": task.task_id, "result": "success" if result.status == TaskStatus.COMPLETED else "failure"}
        )
        
        return result
    
    async def _scout_execute(self, task: Task) -> TaskResult:
        """Scout execution - find and report."""
        # Scouts are fast but low quality
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={"scouted": True, "findings": []},
            quality_score=0.6
        )
    
    async def _worker_execute(self, task: Task) -> TaskResult:
        """Worker execution - main work."""
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={"worked": True},
            quality_score=0.85
        )
    
    async def _soldier_execute(self, task: Task) -> TaskResult:
        """Soldier execution - problem handling."""
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={"defended": True},
            quality_score=0.9
        )
    
    async def _generic_execute(self, task: Task) -> TaskResult:
        """Generic execution."""
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={"generic": True},
            quality_score=0.75
        )
    
    def sense(self) -> List[Pheromone]:
        """Sense nearby pheromones."""
        return HIVEMIND.sense_pheromones(self._position, self._sense_radius)
    
    def move_towards(self, target: Tuple[float, float], speed: float = 1.0) -> None:
        """Move towards a target position."""
        dx = target[0] - self._position[0]
        dy = target[1] - self._position[1]
        
        distance = math.sqrt(dx ** 2 + dy ** 2)
        
        if distance > 0:
            # Normalize and scale
            actual_speed = min(speed, self._max_speed)
            self._position = (
                self._position[0] + (dx / distance) * actual_speed,
                self._position[1] + (dy / distance) * actual_speed
            )
    
    def follow_pheromone_gradient(
        self,
        pheromone_type: PheromoneType = PheromoneType.TRAIL
    ) -> None:
        """Move in the direction of strongest pheromone."""
        pheromones = self.sense()
        
        if not pheromones:
            # Random walk
            self.move_towards((
                self._position[0] + random.uniform(-1, 1),
                self._position[1] + random.uniform(-1, 1)
            ))
            return
        
        # Find strongest of desired type
        typed = [p for p in pheromones if p.pheromone_type == pheromone_type]
        if not typed:
            return
        
        strongest = max(typed, key=lambda p: p.strength)
        self.move_towards(strongest.location)
    
    async def adapt_role(self, awareness: SystemAwareness) -> None:
        """Adapt role based on swarm needs."""
        # Check pheromones for role signals
        danger_pheromones = HIVEMIND.sense_pheromones(
            self._position,
            radius=5.0,
            pheromone_type=PheromoneType.DANGER
        )
        
        if len(danger_pheromones) > 3 and self._role != DroneRole.SOLDIER:
            self._role = DroneRole.SOLDIER
        elif not danger_pheromones and self._role == DroneRole.SOLDIER:
            self._role = DroneRole.WORKER


# ═══════════════════════════════════════════════════════════════════════════════
# HIVE QUEEN - SWARM COORDINATOR
# ═══════════════════════════════════════════════════════════════════════════════


class HiveQueen(BaseAgent):
    """
    The Queen of the hivemind.
    
    The Queen doesn't command - she guides:
    - Spawns new drones
    - Sets swarm focus through pheromones
    - Monitors swarm health
    - Makes strategic decisions through collective voting
    """
    
    LEVEL = AgentLevel.ARCHITECT
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.EMERGENT_DETECT,
    }
    
    def __init__(
        self,
        name: str = "HiveQueen",
        swarm_size: int = 20,
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        
        self._target_swarm_size = swarm_size
        self._drones: List[HiveDrone] = []
    
    async def _on_initialize(self) -> None:
        """Initialize the queen and spawn initial swarm."""
        HIVEMIND.register_queen(self)
        await HIVEMIND.start_decay_loop()
        
        # Spawn initial swarm
        await self._spawn_initial_swarm()
    
    async def _on_terminate(self) -> None:
        """Shutdown the swarm."""
        HIVEMIND.stop_decay_loop()
        
        for drone in self._drones:
            await drone.terminate()
    
    async def _spawn_initial_swarm(self) -> None:
        """Spawn the initial swarm of drones."""
        # Distribute roles
        role_distribution = {
            DroneRole.SCOUT: 0.1,
            DroneRole.WORKER: 0.6,
            DroneRole.SOLDIER: 0.1,
            DroneRole.NURSE: 0.1,
            DroneRole.FORAGER: 0.1
        }
        
        for i in range(self._target_swarm_size):
            # Determine role
            r = random.random()
            cumulative = 0.0
            role = DroneRole.WORKER
            
            for drone_role, prob in role_distribution.items():
                cumulative += prob
                if r < cumulative:
                    role = drone_role
                    break
            
            # Random position
            position = (
                random.uniform(-10, 10),
                random.uniform(-10, 10)
            )
            
            drone = await self.spawn_child(
                HiveDrone,
                name=f"drone_{i}",
                role=role,
                position=position
            )
            self._drones.append(drone)
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute task through the swarm."""
        # Set swarm focus
        HIVEMIND.set_swarm_focus(task.task_id)
        
        # Emit assembly pheromone at "task location"
        task_location = (0.0, 0.0)  # Abstract location for this task
        HIVEMIND.emit_pheromone(
            emitter_id=self._agent_id,
            pheromone_type=PheromoneType.ASSEMBLY,
            location=task_location,
            strength=2.0,
            payload={"task_id": task.task_id}
        )
        
        # Distribute work across drones
        worker_drones = [d for d in self._drones if d.role == DroneRole.WORKER]
        
        if not worker_drones:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="No worker drones available"
            )
        
        # Execute in parallel across workers
        results = await asyncio.gather(
            *[drone.execute(task) for drone in worker_drones[:5]],
            return_exceptions=True
        )
        
        # Synthesize results through voting
        vote_id = f"vote_{task.task_id}"
        HIVEMIND.memory.start_vote(vote_id, ["success", "failure"])
        
        successful = 0
        total_quality = 0.0
        
        for result in results:
            if isinstance(result, TaskResult) and result.status == TaskStatus.COMPLETED:
                successful += 1
                total_quality += result.quality_score
                HIVEMIND.memory.cast_vote(vote_id, "success")
            else:
                HIVEMIND.memory.cast_vote(vote_id, "failure")
        
        # Get consensus
        consensus = HIVEMIND.memory.get_vote_result(vote_id)
        
        if consensus == "success" and successful > 0:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output={
                    "swarm_execution": True,
                    "drones_participated": len(results),
                    "drones_succeeded": successful,
                    "consensus": consensus
                },
                quality_score=total_quality / successful
            )
        else:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="Swarm consensus: failure"
            )
    
    async def maintain_swarm(self) -> None:
        """Maintain swarm health and size."""
        # Remove dead drones
        self._drones = [d for d in self._drones if d.state != AgentState.TERMINATED]
        
        # Spawn replacements
        while len(self._drones) < self._target_swarm_size:
            drone = await self.spawn_child(
                HiveDrone,
                name=f"drone_{uuid4().hex[:4]}",
                position=(random.uniform(-10, 10), random.uniform(-10, 10))
            )
            self._drones.append(drone)
    
    def get_swarm_status(self) -> Dict[str, Any]:
        """Get swarm status."""
        role_counts = defaultdict(int)
        for drone in self._drones:
            role_counts[drone.role.value] += 1
        
        return {
            "total_drones": len(self._drones),
            "roles": dict(role_counts),
            "pheromone_count": len(HIVEMIND.memory.pheromones),
            "swarm_focus": HIVEMIND.swarm_focus,
            "collective_tasks": HIVEMIND.memory.total_tasks_processed,
            "success_rate": (
                HIVEMIND.memory.successful_tasks / HIVEMIND.memory.total_tasks_processed
                if HIVEMIND.memory.total_tasks_processed > 0 else 0
            )
        }


# ═══════════════════════════════════════════════════════════════════════════════
# SWARM INTELLIGENCE ALGORITHMS
# ═══════════════════════════════════════════════════════════════════════════════


class SwarmOptimizer:
    """
    Implements swarm intelligence optimization algorithms.
    
    The swarm collectively explores solution spaces.
    """
    
    def __init__(self, hivemind: HivemindConsciousness):
        self._hivemind = hivemind
    
    async def particle_swarm_optimize(
        self,
        drones: List[HiveDrone],
        fitness_function: Callable[[Tuple[float, ...]], float],
        iterations: int = 100
    ) -> Tuple[float, ...]:
        """
        Particle Swarm Optimization using drones.
        
        Each drone is a particle exploring the solution space.
        """
        # Initialize particle best positions
        particle_best: Dict[str, Tuple[Tuple[float, ...], float]] = {}
        
        for drone in drones:
            fitness = fitness_function(drone.position)
            particle_best[drone.agent_id] = (drone.position, fitness)
        
        # Find global best
        global_best_pos = max(
            particle_best.values(),
            key=lambda x: x[1]
        )[0]
        global_best_fitness = fitness_function(global_best_pos)
        
        # Optimization loop
        for iteration in range(iterations):
            for drone in drones:
                # Update velocity based on personal and global best
                personal_best = particle_best[drone.agent_id][0]
                
                # Move towards better positions
                r1, r2 = random.random(), random.random()
                
                new_pos = tuple(
                    pos + 0.5 * r1 * (pb - pos) + 0.5 * r2 * (gb - pos)
                    for pos, pb, gb in zip(
                        drone.position,
                        personal_best,
                        global_best_pos
                    )
                )
                
                # Update drone position (simplified 2D)
                drone._position = (new_pos[0], new_pos[1]) if len(new_pos) >= 2 else drone._position
                
                # Evaluate
                fitness = fitness_function(drone.position)
                
                # Update personal best
                if fitness > particle_best[drone.agent_id][1]:
                    particle_best[drone.agent_id] = (drone.position, fitness)
                
                # Update global best
                if fitness > global_best_fitness:
                    global_best_pos = drone.position
                    global_best_fitness = fitness
                    
                    # Emit success pheromone
                    self._hivemind.emit_pheromone(
                        emitter_id=drone.agent_id,
                        pheromone_type=PheromoneType.SUCCESS,
                        location=drone.position,
                        strength=fitness
                    )
        
        return global_best_pos
    
    async def ant_colony_optimize(
        self,
        drones: List[HiveDrone],
        graph: Dict[str, Dict[str, float]],
        iterations: int = 100
    ) -> List[str]:
        """
        Ant Colony Optimization using drones as ants.
        
        Finds optimal paths through a graph.
        """
        # Initialize pheromone levels on edges
        pheromone_levels: Dict[Tuple[str, str], float] = {}
        
        for node, neighbors in graph.items():
            for neighbor in neighbors:
                pheromone_levels[(node, neighbor)] = 1.0
        
        best_path: List[str] = []
        best_length = float('inf')
        
        nodes = list(graph.keys())
        
        for iteration in range(iterations):
            # Each drone constructs a path
            for drone in drones:
                path = self._construct_ant_path(nodes, graph, pheromone_levels)
                path_length = self._calculate_path_length(path, graph)
                
                if path_length < best_length:
                    best_length = path_length
                    best_path = path
                
                # Deposit pheromones along path
                deposit = 1.0 / path_length if path_length > 0 else 1.0
                
                for i in range(len(path) - 1):
                    edge = (path[i], path[i+1])
                    pheromone_levels[edge] = pheromone_levels.get(edge, 0) + deposit
            
            # Evaporate pheromones
            for edge in pheromone_levels:
                pheromone_levels[edge] *= 0.9
        
        return best_path
    
    def _construct_ant_path(
        self,
        nodes: List[str],
        graph: Dict[str, Dict[str, float]],
        pheromones: Dict[Tuple[str, str], float]
    ) -> List[str]:
        """Construct a path using pheromone-guided probabilistic selection."""
        if not nodes:
            return []
        
        path = [random.choice(nodes)]
        visited = {path[0]}
        
        while len(visited) < len(nodes):
            current = path[-1]
            neighbors = graph.get(current, {})
            
            # Filter unvisited
            unvisited = [n for n in neighbors if n not in visited]
            
            if not unvisited:
                break
            
            # Probabilistic selection based on pheromones
            probs = []
            for neighbor in unvisited:
                pheromone = pheromones.get((current, neighbor), 1.0)
                distance = neighbors[neighbor]
                attractiveness = pheromone / (distance + 0.1)
                probs.append(attractiveness)
            
            # Normalize
            total = sum(probs)
            if total > 0:
                probs = [p / total for p in probs]
            else:
                probs = [1.0 / len(unvisited)] * len(unvisited)
            
            # Select
            next_node = random.choices(unvisited, weights=probs)[0]
            path.append(next_node)
            visited.add(next_node)
        
        return path
    
    def _calculate_path_length(
        self,
        path: List[str],
        graph: Dict[str, Dict[str, float]]
    ) -> float:
        """Calculate total path length."""
        length = 0.0
        
        for i in range(len(path) - 1):
            current = path[i]
            next_node = path[i + 1]
            length += graph.get(current, {}).get(next_node, float('inf'))
        
        return length


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Pheromone system
    "PheromoneType",
    "Pheromone",
    "HivemindMemory",
    "HivemindConsciousness",
    "HIVEMIND",
    
    # Drones
    "DroneRole",
    "HiveDrone",
    "HiveQueen",
    
    # Algorithms
    "SwarmOptimizer",
]

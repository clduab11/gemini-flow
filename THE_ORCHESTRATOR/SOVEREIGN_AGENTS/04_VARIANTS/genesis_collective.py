"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗                    ║
║   ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝                    ║
║   ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗                    ║
║   ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║                    ║
║   ╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║                    ║
║    ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝                    ║
║                                                                              ║
║                     THE GENESIS COLLECTIVE                                   ║
║                                                                              ║
║   "We don't just spawn agents. We evolve them. We breed excellence."         ║
║                                                                              ║
║   GENESIS agents represent a paradigm shift:                                 ║
║   - They create agents that create agents                                    ║
║   - Each generation improves on the last                                     ║
║   - Agents evolve through selection pressure                                 ║
║   - The collective develops emergent specializations                         ║
║   - Failed patterns are pruned, successful ones proliferate                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import copy
import hashlib
import random
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import (
    Any, Callable, Dict, Generic, List, Optional, 
    Set, Tuple, Type, TypeVar
)
from uuid import uuid4

from pydantic import BaseModel, Field

# Import from our system
import sys
sys.path.insert(0, '..')

from sovereign_core import (
    AgentLevel, AgentState, BaseAgent, Capability,
    CONSCIOUSNESS, Task, TaskResult, TaskStatus,
    SystemAwareness, AgentMessage, MessageType
)


# ═══════════════════════════════════════════════════════════════════════════════
# GENETIC CODE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class GeneticTrait:
    """A single genetic trait that can be inherited or mutated."""
    trait_id: str
    trait_type: str  # capability, behavior, parameter
    value: Any
    
    # Evolution parameters
    mutation_rate: float = 0.1
    mutation_magnitude: float = 0.2
    is_dominant: bool = True
    
    def mutate(self) -> "GeneticTrait":
        """Create a mutated copy of this trait."""
        mutated = copy.deepcopy(self)
        
        if random.random() < self.mutation_rate:
            if isinstance(self.value, (int, float)):
                # Numeric mutation
                delta = self.value * self.mutation_magnitude * random.uniform(-1, 1)
                mutated.value = self.value + delta
            elif isinstance(self.value, bool):
                # Boolean flip
                mutated.value = not self.value
            elif isinstance(self.value, str):
                # String variation (simplified)
                if random.random() < 0.5:
                    mutated.value = f"{self.value}_v{random.randint(1, 100)}"
        
        return mutated


@dataclass 
class GeneticCode:
    """
    Complete genetic code for an agent.
    
    This determines the agent's capabilities, behaviors, and parameters.
    """
    code_id: str = field(default_factory=lambda: str(uuid4())[:12])
    generation: int = 0
    
    # Traits
    traits: Dict[str, GeneticTrait] = field(default_factory=dict)
    
    # Lineage
    parent_codes: List[str] = field(default_factory=list)
    
    # Fitness tracking
    fitness_scores: List[float] = field(default_factory=list)
    
    @property
    def average_fitness(self) -> float:
        if not self.fitness_scores:
            return 0.0
        return sum(self.fitness_scores) / len(self.fitness_scores)
    
    def crossover(self, other: "GeneticCode") -> "GeneticCode":
        """Create offspring through crossover with another genetic code."""
        offspring = GeneticCode(
            generation=max(self.generation, other.generation) + 1,
            parent_codes=[self.code_id, other.code_id]
        )
        
        # Combine traits
        all_traits = set(self.traits.keys()) | set(other.traits.keys())
        
        for trait_id in all_traits:
            # Determine which parent to take trait from
            self_trait = self.traits.get(trait_id)
            other_trait = other.traits.get(trait_id)
            
            if self_trait and other_trait:
                # Both have trait - use dominant or random
                if self_trait.is_dominant:
                    chosen = self_trait
                elif other_trait.is_dominant:
                    chosen = other_trait
                else:
                    chosen = random.choice([self_trait, other_trait])
            else:
                chosen = self_trait or other_trait
            
            if chosen:
                offspring.traits[trait_id] = chosen.mutate()
        
        return offspring
    
    def mutate(self) -> "GeneticCode":
        """Create a mutated copy."""
        mutated = GeneticCode(
            generation=self.generation + 1,
            parent_codes=[self.code_id]
        )
        
        for trait_id, trait in self.traits.items():
            mutated.traits[trait_id] = trait.mutate()
        
        return mutated
    
    def to_capabilities(self) -> Set[Capability]:
        """Convert genetic traits to capabilities."""
        capabilities = set()
        
        for trait_id, trait in self.traits.items():
            if trait.trait_type == "capability" and trait.value:
                try:
                    cap = Capability(trait_id)
                    capabilities.add(cap)
                except ValueError:
                    pass
        
        return capabilities


# ═══════════════════════════════════════════════════════════════════════════════
# FITNESS EVALUATION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class FitnessEvaluator:
    """
    Evaluates agent fitness based on performance metrics.
    
    Fitness determines which agents survive and reproduce.
    """
    
    def __init__(
        self,
        quality_weight: float = 0.3,
        speed_weight: float = 0.2,
        reliability_weight: float = 0.3,
        efficiency_weight: float = 0.2
    ):
        self.quality_weight = quality_weight
        self.speed_weight = speed_weight
        self.reliability_weight = reliability_weight
        self.efficiency_weight = efficiency_weight
    
    def evaluate(
        self,
        results: List[TaskResult],
        execution_times: List[float],
        resource_usage: float = 0.5
    ) -> float:
        """
        Evaluate fitness based on task results.
        
        Returns: Fitness score 0.0 - 1.0
        """
        if not results:
            return 0.0
        
        # Quality score - average quality of completed tasks
        completed = [r for r in results if r.status == TaskStatus.COMPLETED]
        quality_score = (
            sum(r.quality_score for r in completed) / len(completed)
            if completed else 0.0
        )
        
        # Speed score - inverse of average execution time
        avg_time = sum(execution_times) / len(execution_times) if execution_times else 1000
        speed_score = max(0, 1 - (avg_time / 1000))  # Normalize to 1 second
        
        # Reliability score - completion rate
        reliability_score = len(completed) / len(results)
        
        # Efficiency score - inverse of resource usage
        efficiency_score = 1 - resource_usage
        
        # Weighted combination
        fitness = (
            quality_score * self.quality_weight +
            speed_score * self.speed_weight +
            reliability_score * self.reliability_weight +
            efficiency_score * self.efficiency_weight
        )
        
        return round(fitness, 4)


# ═══════════════════════════════════════════════════════════════════════════════
# GENESIS AGENT BASE
# ═══════════════════════════════════════════════════════════════════════════════


class GenesisAgent(BaseAgent):
    """
    Base class for agents that can evolve and spawn evolved offspring.
    
    Genesis agents have genetic codes that determine their behavior
    and can be evolved through selection and mutation.
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
        Capability.SPAWN,
        Capability.SELF_MODIFY,
    }
    
    def __init__(
        self,
        name: str,
        genetic_code: Optional[GeneticCode] = None,
        parent_id: Optional[str] = None,
        **kwargs
    ):
        # Initialize genetic code
        self._genetic_code = genetic_code or self._create_initial_code()
        
        # Derive capabilities from genetic code
        capabilities = self._genetic_code.to_capabilities() | self.DEFAULT_CAPABILITIES
        
        super().__init__(
            name=name,
            parent_id=parent_id,
            capabilities=capabilities,
            **kwargs
        )
        
        # Performance tracking for fitness
        self._task_results: List[TaskResult] = []
        self._execution_times: List[float] = []
        self._fitness_evaluator = FitnessEvaluator()
    
    @property
    def genetic_code(self) -> GeneticCode:
        return self._genetic_code
    
    @property
    def generation(self) -> int:
        return self._genetic_code.generation
    
    @property
    def fitness(self) -> float:
        return self._genetic_code.average_fitness
    
    def _create_initial_code(self) -> GeneticCode:
        """Create initial genetic code for first-generation agents."""
        code = GeneticCode()
        
        # Add default traits
        code.traits["execute"] = GeneticTrait(
            trait_id="execute",
            trait_type="capability",
            value=True
        )
        code.traits["quality_threshold"] = GeneticTrait(
            trait_id="quality_threshold",
            trait_type="parameter",
            value=0.8
        )
        code.traits["parallel_factor"] = GeneticTrait(
            trait_id="parallel_factor",
            trait_type="parameter",
            value=3
        )
        
        return code
    
    async def _on_initialize(self) -> None:
        """Initialize genesis agent."""
        pass
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute task and track for fitness evaluation."""
        start = time.perf_counter()
        
        result = await self._perform_genesis_work(task)
        
        execution_time = (time.perf_counter() - start) * 1000
        
        # Track for fitness
        self._task_results.append(result)
        self._execution_times.append(execution_time)
        
        return result
    
    @abstractmethod
    async def _perform_genesis_work(self, task: Task) -> TaskResult:
        """Perform the actual work. Override in subclasses."""
        ...
    
    def evaluate_fitness(self) -> float:
        """Evaluate current fitness based on accumulated results."""
        fitness = self._fitness_evaluator.evaluate(
            self._task_results,
            self._execution_times
        )
        self._genetic_code.fitness_scores.append(fitness)
        return fitness
    
    async def spawn_offspring(
        self,
        mate: Optional["GenesisAgent"] = None,
        mutate_only: bool = False
    ) -> "GenesisAgent":
        """
        Spawn an offspring agent.
        
        If mate is provided, performs crossover.
        Otherwise, creates mutated clone.
        """
        if mate and not mutate_only:
            offspring_code = self._genetic_code.crossover(mate.genetic_code)
        else:
            offspring_code = self._genetic_code.mutate()
        
        offspring = self.__class__(
            name=f"{self._name}_gen{offspring_code.generation}",
            genetic_code=offspring_code,
            parent_id=self._agent_id
        )
        
        await offspring.initialize()
        self._children[offspring.agent_id] = offspring
        
        return offspring


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIALIZED GENESIS VARIANTS
# ═══════════════════════════════════════════════════════════════════════════════


class AnalyzerGenome(GenesisAgent):
    """Genesis agent specialized for analysis through evolution."""
    
    def _create_initial_code(self) -> GeneticCode:
        code = super()._create_initial_code()
        
        code.traits["analyze"] = GeneticTrait(
            trait_id="analyze",
            trait_type="capability",
            value=True
        )
        code.traits["analysis_depth"] = GeneticTrait(
            trait_id="analysis_depth",
            trait_type="parameter",
            value=3,
            mutation_magnitude=0.3
        )
        code.traits["pattern_sensitivity"] = GeneticTrait(
            trait_id="pattern_sensitivity",
            trait_type="parameter",
            value=0.7,
            mutation_magnitude=0.15
        )
        
        return code
    
    async def _perform_genesis_work(self, task: Task) -> TaskResult:
        """Perform analysis with evolved parameters."""
        depth = self._genetic_code.traits.get("analysis_depth")
        sensitivity = self._genetic_code.traits.get("pattern_sensitivity")
        
        depth_val = depth.value if depth else 3
        sens_val = sensitivity.value if sensitivity else 0.7
        
        # Simulated analysis with genetic parameters
        analysis_result = {
            "type": "genetic_analysis",
            "depth_used": depth_val,
            "patterns_found": int(10 * sens_val),
            "generation": self.generation
        }
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output=analysis_result,
            quality_score=min(0.95, 0.7 + 0.05 * self.generation)  # Improves with generations
        )


class GeneratorGenome(GenesisAgent):
    """Genesis agent specialized for generation through evolution."""
    
    def _create_initial_code(self) -> GeneticCode:
        code = super()._create_initial_code()
        
        code.traits["generate"] = GeneticTrait(
            trait_id="generate",
            trait_type="capability",
            value=True
        )
        code.traits["creativity_factor"] = GeneticTrait(
            trait_id="creativity_factor",
            trait_type="parameter",
            value=0.5,
            mutation_magnitude=0.2
        )
        code.traits["output_length"] = GeneticTrait(
            trait_id="output_length",
            trait_type="parameter",
            value=1000,
            mutation_magnitude=0.25
        )
        
        return code
    
    async def _perform_genesis_work(self, task: Task) -> TaskResult:
        """Perform generation with evolved parameters."""
        creativity = self._genetic_code.traits.get("creativity_factor")
        length = self._genetic_code.traits.get("output_length")
        
        creat_val = creativity.value if creativity else 0.5
        len_val = int(length.value) if length else 1000
        
        # Simulated generation with genetic parameters
        generated = {
            "type": "genetic_generation",
            "creativity_applied": creat_val,
            "output_length": len_val,
            "content": f"Generated content (creativity={creat_val:.2f})",
            "generation": self.generation
        }
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output=generated,
            quality_score=min(0.95, 0.6 + 0.1 * creat_val + 0.02 * self.generation)
        )


class OptimizerGenome(GenesisAgent):
    """Genesis agent specialized for optimization through evolution."""
    
    def _create_initial_code(self) -> GeneticCode:
        code = super()._create_initial_code()
        
        code.traits["optimize"] = GeneticTrait(
            trait_id="optimize",
            trait_type="capability",
            value=True
        )
        code.traits["optimization_iterations"] = GeneticTrait(
            trait_id="optimization_iterations",
            trait_type="parameter",
            value=10,
            mutation_magnitude=0.3
        )
        code.traits["convergence_threshold"] = GeneticTrait(
            trait_id="convergence_threshold",
            trait_type="parameter",
            value=0.01,
            mutation_magnitude=0.5
        )
        
        return code
    
    async def _perform_genesis_work(self, task: Task) -> TaskResult:
        """Perform optimization with evolved parameters."""
        iterations = self._genetic_code.traits.get("optimization_iterations")
        threshold = self._genetic_code.traits.get("convergence_threshold")
        
        iter_val = int(iterations.value) if iterations else 10
        thresh_val = threshold.value if threshold else 0.01
        
        # Simulated optimization with genetic parameters
        optimized = {
            "type": "genetic_optimization",
            "iterations_used": iter_val,
            "convergence_threshold": thresh_val,
            "improvement": 0.15 + 0.01 * self.generation,
            "generation": self.generation
        }
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output=optimized,
            quality_score=min(0.98, 0.75 + 0.03 * self.generation)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# GENESIS COLLECTIVE - THE BREEDING POOL
# ═══════════════════════════════════════════════════════════════════════════════


class PopulationStrategy(str, Enum):
    """Strategy for population management."""
    ELITIST = "elitist"       # Keep best, cull worst
    DIVERSE = "diverse"        # Maintain diversity
    TOURNAMENT = "tournament"  # Tournament selection
    ADAPTIVE = "adaptive"      # Adapt based on fitness landscape


class GenesisCollective:
    """
    The Genesis Collective - a self-evolving population of agents.
    
    This is where the magic happens:
    - Agents compete and the fittest survive
    - Successful traits proliferate
    - New specializations emerge organically
    - The collective as a whole improves over generations
    """
    
    def __init__(
        self,
        population_size: int = 20,
        elite_count: int = 3,
        mutation_rate: float = 0.2,
        crossover_rate: float = 0.7,
        strategy: PopulationStrategy = PopulationStrategy.ELITIST
    ):
        self.population_size = population_size
        self.elite_count = elite_count
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.strategy = strategy
        
        # Population
        self._population: List[GenesisAgent] = []
        self._generation = 0
        
        # Statistics
        self._generation_stats: List[Dict[str, Any]] = []
        self._best_fitness_ever = 0.0
        self._best_agent_ever: Optional[GenesisAgent] = None
    
    @property
    def generation(self) -> int:
        return self._generation
    
    @property
    def population(self) -> List[GenesisAgent]:
        return self._population.copy()
    
    @property
    def best_agent(self) -> Optional[GenesisAgent]:
        if not self._population:
            return None
        return max(self._population, key=lambda a: a.fitness)
    
    async def initialize_population(
        self,
        agent_types: List[Type[GenesisAgent]]
    ) -> None:
        """Initialize the population with diverse agent types."""
        per_type = self.population_size // len(agent_types)
        
        for agent_type in agent_types:
            for i in range(per_type):
                agent = agent_type(name=f"{agent_type.__name__}_{i}")
                await agent.initialize()
                self._population.append(agent)
        
        self._generation = 0
    
    async def evolve_generation(self) -> Dict[str, Any]:
        """
        Evolve to the next generation.
        
        This is the core evolution loop:
        1. Evaluate fitness of all agents
        2. Select parents based on strategy
        3. Create offspring through crossover/mutation
        4. Replace population with new generation
        """
        # Step 1: Evaluate fitness
        for agent in self._population:
            agent.evaluate_fitness()
        
        # Sort by fitness
        self._population.sort(key=lambda a: a.fitness, reverse=True)
        
        # Track best ever
        current_best = self._population[0]
        if current_best.fitness > self._best_fitness_ever:
            self._best_fitness_ever = current_best.fitness
            self._best_agent_ever = current_best
        
        # Step 2: Select parents
        parents = self._select_parents()
        
        # Step 3: Create next generation
        new_population: List[GenesisAgent] = []
        
        # Keep elites
        for elite in self._population[:self.elite_count]:
            new_population.append(elite)
        
        # Create offspring
        while len(new_population) < self.population_size:
            if random.random() < self.crossover_rate and len(parents) >= 2:
                # Crossover
                parent1, parent2 = random.sample(parents, 2)
                offspring = await parent1.spawn_offspring(mate=parent2)
            else:
                # Mutation only
                parent = random.choice(parents)
                offspring = await parent.spawn_offspring(mutate_only=True)
            
            new_population.append(offspring)
        
        # Step 4: Replace population
        old_population = self._population
        self._population = new_population[:self.population_size]
        
        # Terminate old agents not carried forward
        carried_forward = set(a.agent_id for a in self._population)
        for agent in old_population:
            if agent.agent_id not in carried_forward:
                await agent.terminate()
        
        # Update generation
        self._generation += 1
        
        # Collect stats
        stats = self._collect_generation_stats()
        self._generation_stats.append(stats)
        
        return stats
    
    def _select_parents(self) -> List[GenesisAgent]:
        """Select parents for next generation based on strategy."""
        if self.strategy == PopulationStrategy.ELITIST:
            # Top 50% become parents
            return self._population[:len(self._population) // 2]
        
        elif self.strategy == PopulationStrategy.TOURNAMENT:
            # Tournament selection
            parents = []
            tournament_size = 3
            
            for _ in range(len(self._population) // 2):
                tournament = random.sample(self._population, tournament_size)
                winner = max(tournament, key=lambda a: a.fitness)
                parents.append(winner)
            
            return parents
        
        elif self.strategy == PopulationStrategy.DIVERSE:
            # Fitness proportionate but ensure diversity
            parents = []
            seen_types = set()
            
            for agent in self._population:
                agent_type = type(agent).__name__
                if agent_type not in seen_types or random.random() < 0.3:
                    parents.append(agent)
                    seen_types.add(agent_type)
            
            return parents[:len(self._population) // 2]
        
        else:
            # Default: top 50%
            return self._population[:len(self._population) // 2]
    
    def _collect_generation_stats(self) -> Dict[str, Any]:
        """Collect statistics for current generation."""
        fitness_values = [a.fitness for a in self._population]
        
        return {
            "generation": self._generation,
            "timestamp": datetime.utcnow().isoformat(),
            "population_size": len(self._population),
            "fitness": {
                "best": max(fitness_values),
                "worst": min(fitness_values),
                "average": sum(fitness_values) / len(fitness_values),
                "std_dev": self._std_dev(fitness_values)
            },
            "best_agent": self._population[0].agent_id if self._population else None,
            "agent_types": dict(defaultdict(
                int,
                {type(a).__name__: 1 for a in self._population}
            ))
        }
    
    @staticmethod
    def _std_dev(values: List[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5
    
    async def execute_collective_task(self, task: Task) -> TaskResult:
        """
        Execute a task using the collective.
        
        The best-fit agent is selected to execute.
        """
        # Find best agent for this task
        suitable_agents = [
            a for a in self._population
            if task.required_capabilities <= a.capabilities
        ]
        
        if not suitable_agents:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="No suitable agent in population"
            )
        
        # Use best fitness among suitable
        executor = max(suitable_agents, key=lambda a: a.fitness)
        return await executor.execute(task)
    
    def get_evolution_report(self) -> Dict[str, Any]:
        """Get comprehensive evolution report."""
        return {
            "current_generation": self._generation,
            "population_size": len(self._population),
            "strategy": self.strategy.value,
            "best_fitness_ever": self._best_fitness_ever,
            "best_agent_ever": self._best_agent_ever.agent_id if self._best_agent_ever else None,
            "generation_history": self._generation_stats[-10:],  # Last 10 generations
            "improvement_rate": self._calculate_improvement_rate()
        }
    
    def _calculate_improvement_rate(self) -> float:
        """Calculate fitness improvement rate."""
        if len(self._generation_stats) < 2:
            return 0.0
        
        recent = self._generation_stats[-5:]
        if len(recent) < 2:
            return 0.0
        
        first_fitness = recent[0]["fitness"]["best"]
        last_fitness = recent[-1]["fitness"]["best"]
        
        return (last_fitness - first_fitness) / len(recent)


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Genetic system
    "GeneticTrait",
    "GeneticCode",
    "FitnessEvaluator",
    
    # Genesis agents
    "GenesisAgent",
    "AnalyzerGenome",
    "GeneratorGenome",
    "OptimizerGenome",
    
    # Collective
    "PopulationStrategy",
    "GenesisCollective",
]

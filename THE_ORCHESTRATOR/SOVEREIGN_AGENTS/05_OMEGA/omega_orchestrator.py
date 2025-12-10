"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ██████╗ ███╗   ███╗███████╗ ██████╗  █████╗                              ║
║   ██╔═══██╗████╗ ████║██╔════╝██╔════╝ ██╔══██╗                             ║
║   ██║   ██║██╔████╔██║█████╗  ██║  ███╗███████║                             ║
║   ██║   ██║██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║                             ║
║   ╚██████╔╝██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║                             ║
║    ╚═════╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝                             ║
║                                                                              ║
║    ██████╗ ██████╗  ██████╗██╗  ██╗███████╗███████╗████████╗██████╗         ║
║   ██╔═══██╗██╔══██╗██╔════╝██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗        ║
║   ██║   ██║██████╔╝██║     ███████║█████╗  ███████╗   ██║   ██████╔╝        ║
║   ██║   ██║██╔══██╗██║     ██╔══██║██╔══╝  ╚════██║   ██║   ██╔══██╗        ║
║   ╚██████╔╝██║  ██║╚██████╗██║  ██║███████╗███████║   ██║   ██║  ██║        ║
║    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝        ║
║                                                                              ║
║                    THE OMEGA ORCHESTRATOR                                    ║
║                                                                              ║
║   "The final form. All paradigms unified. Emergence maximized."              ║
║                                                                              ║
║   OMEGA combines ALL agent paradigms into one transcendent system:           ║
║   - THE SOVEREIGN for hierarchical orchestration                             ║
║   - GENESIS COLLECTIVE for evolutionary optimization                         ║
║   - HIVEMIND SWARM for collective intelligence                               ║
║   - NEURAL MESH for computational substrate                                  ║
║   - COUNCIL OF MINDS for multi-perspective reasoning                         ║
║   - TEMPORAL NEXUS for past/present/future awareness                         ║
║                                                                              ║
║   Each paradigm handles what it does best. OMEGA coordinates them all.       ║
║   The result: emergent capabilities none could achieve alone.                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Type
from uuid import uuid4

import sys
sys.path.insert(0, '..')

# Import all paradigms
from sovereign_core import (
    AgentLevel, AgentState, BaseAgent, Capability,
    CONSCIOUSNESS, Task, TaskResult, TaskStatus,
    SystemAwareness
)

from the_sovereign import TheSovereign, SovereignConfig, awaken_sovereign
from genesis_collective import GenesisCollective, GenesisAgent, AnalyzerGenome, GeneratorGenome, OptimizerGenome
from hivemind_swarm import HiveQueen, HiveDrone, HIVEMIND, PheromoneType
from neural_mesh import NeuralMesh, MeshTopology
from council_of_minds import CouncilModerator, COUNCIL_CHAMBER, CognitiveStyle
from temporal_nexus import TemporalNexus, TEMPORAL_MEMORY, TemporalDimension


# ═══════════════════════════════════════════════════════════════════════════════
# OMEGA CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════


class ParadigmType(str, Enum):
    """The agent paradigms available in OMEGA."""
    SOVEREIGN = "sovereign"       # Hierarchical orchestration
    GENESIS = "genesis"           # Evolutionary optimization
    HIVEMIND = "hivemind"        # Swarm intelligence
    NEURAL = "neural"            # Neural computation
    COUNCIL = "council"          # Multi-perspective reasoning
    TEMPORAL = "temporal"        # Temporal awareness
    OMEGA = "omega"              # Meta-paradigm (all combined)


@dataclass
class OmegaConfig:
    """Configuration for the OMEGA orchestrator."""
    # Which paradigms to activate
    enabled_paradigms: Set[ParadigmType] = field(default_factory=lambda: {
        ParadigmType.SOVEREIGN,
        ParadigmType.GENESIS,
        ParadigmType.HIVEMIND,
        ParadigmType.NEURAL,
        ParadigmType.COUNCIL,
        ParadigmType.TEMPORAL
    })
    
    # Paradigm-specific configs
    sovereign_config: Optional[SovereignConfig] = None
    genesis_population_size: int = 15
    hivemind_swarm_size: int = 20
    neural_hidden_layers: List[int] = field(default_factory=lambda: [16, 8])
    council_member_count: int = 5
    
    # Task routing
    auto_route_tasks: bool = True
    parallel_paradigms: int = 3
    
    # Emergence detection
    enable_cross_paradigm_emergence: bool = True
    emergence_threshold: int = 3
    
    # Synthesis
    enable_paradigm_synthesis: bool = True
    synthesis_strategy: str = "weighted_vote"  # "weighted_vote" | "best_quality" | "consensus"


# ═══════════════════════════════════════════════════════════════════════════════
# PARADIGM ROUTER
# ═══════════════════════════════════════════════════════════════════════════════


class ParadigmRouter:
    """
    Routes tasks to the most appropriate paradigm(s).
    
    Uses task characteristics to determine which paradigm(s)
    are best suited to handle the task.
    """
    
    # Task type to paradigm mapping
    PARADIGM_STRENGTHS = {
        ParadigmType.SOVEREIGN: {
            "orchestration", "coordination", "delegation",
            "hierarchy", "management", "workflow"
        },
        ParadigmType.GENESIS: {
            "optimization", "evolution", "improvement",
            "selection", "breeding", "fitness"
        },
        ParadigmType.HIVEMIND: {
            "search", "exploration", "parallel",
            "distributed", "consensus", "collective"
        },
        ParadigmType.NEURAL: {
            "pattern", "classification", "regression",
            "prediction", "learning", "recognition"
        },
        ParadigmType.COUNCIL: {
            "debate", "decision", "analysis",
            "perspective", "evaluation", "judgment"
        },
        ParadigmType.TEMPORAL: {
            "history", "future", "planning",
            "prediction", "causality", "timeline"
        }
    }
    
    def __init__(self, enabled_paradigms: Set[ParadigmType]):
        self._enabled = enabled_paradigms
    
    def route(
        self,
        task: Task,
        max_paradigms: int = 3
    ) -> List[ParadigmType]:
        """Route a task to appropriate paradigm(s)."""
        scores: Dict[ParadigmType, float] = defaultdict(float)
        
        # Analyze task
        task_text = f"{task.name} {task.description} {task.task_type}".lower()
        
        for paradigm, keywords in self.PARADIGM_STRENGTHS.items():
            if paradigm not in self._enabled:
                continue
            
            # Score based on keyword matches
            for keyword in keywords:
                if keyword in task_text:
                    scores[paradigm] += 1.0
        
        # Sort by score
        ranked = sorted(
            scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Return top paradigms
        selected = [p for p, s in ranked[:max_paradigms] if s > 0]
        
        # If no matches, use default set
        if not selected:
            selected = [ParadigmType.SOVEREIGN]
        
        return selected


# ═══════════════════════════════════════════════════════════════════════════════
# PARADIGM SYNTHESIZER
# ═══════════════════════════════════════════════════════════════════════════════


class ParadigmSynthesizer:
    """
    Synthesizes results from multiple paradigms into a unified output.
    
    This is where emergence happens - combining different approaches
    can produce insights that no single paradigm could achieve.
    """
    
    def __init__(self, strategy: str = "weighted_vote"):
        self._strategy = strategy
    
    async def synthesize(
        self,
        results: Dict[ParadigmType, TaskResult]
    ) -> TaskResult:
        """Synthesize multiple paradigm results into one."""
        if not results:
            return TaskResult(
                task_id="synthesis",
                status=TaskStatus.FAILED,
                error="No results to synthesize"
            )
        
        if len(results) == 1:
            return list(results.values())[0]
        
        if self._strategy == "weighted_vote":
            return await self._weighted_vote_synthesis(results)
        elif self._strategy == "best_quality":
            return await self._best_quality_synthesis(results)
        elif self._strategy == "consensus":
            return await self._consensus_synthesis(results)
        else:
            return await self._weighted_vote_synthesis(results)
    
    async def _weighted_vote_synthesis(
        self,
        results: Dict[ParadigmType, TaskResult]
    ) -> TaskResult:
        """Synthesize using quality-weighted voting."""
        # Weight by quality score
        total_weight = sum(r.quality_score for r in results.values())
        
        if total_weight == 0:
            # Equal weights
            total_weight = len(results)
            weights = {p: 1.0 for p in results}
        else:
            weights = {p: r.quality_score / total_weight for p, r in results.items()}
        
        # Combine outputs
        combined_output = {
            "synthesis_method": "weighted_vote",
            "paradigms_used": [p.value for p in results.keys()],
            "weights": {p.value: w for p, w in weights.items()},
            "individual_outputs": {
                p.value: r.output for p, r in results.items()
            }
        }
        
        # Overall quality
        avg_quality = sum(
            r.quality_score * weights[p]
            for p, r in results.items()
        )
        
        # Determine status
        successful = [r for r in results.values() if r.status == TaskStatus.COMPLETED]
        if len(successful) >= len(results) / 2:
            status = TaskStatus.COMPLETED
        else:
            status = TaskStatus.FAILED
        
        return TaskResult(
            task_id=list(results.values())[0].task_id,
            status=status,
            output=combined_output,
            quality_score=avg_quality
        )
    
    async def _best_quality_synthesis(
        self,
        results: Dict[ParadigmType, TaskResult]
    ) -> TaskResult:
        """Return the highest quality result."""
        best_paradigm = max(results.keys(), key=lambda p: results[p].quality_score)
        best_result = results[best_paradigm]
        
        # Add synthesis metadata
        best_result.output = {
            "synthesis_method": "best_quality",
            "selected_paradigm": best_paradigm.value,
            "original_output": best_result.output,
            "all_scores": {p.value: r.quality_score for p, r in results.items()}
        }
        
        return best_result
    
    async def _consensus_synthesis(
        self,
        results: Dict[ParadigmType, TaskResult]
    ) -> TaskResult:
        """Synthesize through consensus building."""
        # Check for agreement on status
        statuses = [r.status for r in results.values()]
        status_counts = defaultdict(int)
        for s in statuses:
            status_counts[s] += 1
        
        consensus_status = max(status_counts.items(), key=lambda x: x[1])[0]
        
        # Average quality
        avg_quality = sum(r.quality_score for r in results.values()) / len(results)
        
        return TaskResult(
            task_id=list(results.values())[0].task_id,
            status=consensus_status,
            output={
                "synthesis_method": "consensus",
                "consensus_status": consensus_status.value,
                "agreement_level": max(status_counts.values()) / len(results),
                "paradigm_outputs": {p.value: r.output for p, r in results.items()}
            },
            quality_score=avg_quality
        )


# ═══════════════════════════════════════════════════════════════════════════════
# CROSS-PARADIGM EMERGENCE DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class CrossParadigmPattern:
    """An emergent pattern detected across paradigms."""
    pattern_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Pattern info
    pattern_type: str = ""
    description: str = ""
    
    # Involved paradigms
    paradigms: List[ParadigmType] = field(default_factory=list)
    
    # Evidence
    evidence: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    
    # Impact
    beneficial: bool = True
    recommended_action: str = ""


class CrossParadigmEmergenceDetector:
    """
    Detects emergent patterns that arise from paradigm interactions.
    
    These are capabilities that emerge only when multiple paradigms
    work together - the true "superintelligence" of OMEGA.
    """
    
    def __init__(self):
        self._detected_patterns: List[CrossParadigmPattern] = []
    
    def analyze(
        self,
        paradigm_states: Dict[ParadigmType, Dict[str, Any]]
    ) -> List[CrossParadigmPattern]:
        """Analyze paradigm states for emergent patterns."""
        patterns = []
        
        # Pattern 1: Temporal-Genesis Synergy
        # Evolution guided by future predictions
        if ParadigmType.TEMPORAL in paradigm_states and ParadigmType.GENESIS in paradigm_states:
            temporal = paradigm_states[ParadigmType.TEMPORAL]
            genesis = paradigm_states[ParadigmType.GENESIS]
            
            if temporal.get("predictions_made", 0) > 5 and genesis.get("generation", 0) > 3:
                patterns.append(CrossParadigmPattern(
                    pattern_type="temporal_guided_evolution",
                    description="Evolution is being guided by temporal predictions",
                    paradigms=[ParadigmType.TEMPORAL, ParadigmType.GENESIS],
                    confidence=0.8,
                    beneficial=True,
                    recommended_action="Continue - this improves evolutionary direction"
                ))
        
        # Pattern 2: Hivemind-Neural Resonance
        # Swarm behavior patterns match neural activation patterns
        if ParadigmType.HIVEMIND in paradigm_states and ParadigmType.NEURAL in paradigm_states:
            hivemind = paradigm_states[ParadigmType.HIVEMIND]
            neural = paradigm_states[ParadigmType.NEURAL]
            
            if hivemind.get("pheromone_density", 0) > 0.5:
                patterns.append(CrossParadigmPattern(
                    pattern_type="swarm_neural_resonance",
                    description="Swarm pheromone patterns mirror neural activations",
                    paradigms=[ParadigmType.HIVEMIND, ParadigmType.NEURAL],
                    confidence=0.7,
                    beneficial=True,
                    recommended_action="Use swarm to guide neural training"
                ))
        
        # Pattern 3: Council-Sovereign Governance
        # Decisions validated through multi-perspective debate
        if ParadigmType.COUNCIL in paradigm_states and ParadigmType.SOVEREIGN in paradigm_states:
            patterns.append(CrossParadigmPattern(
                pattern_type="democratic_hierarchy",
                description="Hierarchical decisions validated through council debate",
                paradigms=[ParadigmType.COUNCIL, ParadigmType.SOVEREIGN],
                confidence=0.9,
                beneficial=True,
                recommended_action="Excellent governance - continue"
            ))
        
        # Pattern 4: Full Convergence
        # All paradigms aligning on same direction
        all_present = len(paradigm_states) >= 5
        if all_present:
            patterns.append(CrossParadigmPattern(
                pattern_type="omega_convergence",
                description="All paradigms converging - maximum emergence potential",
                paradigms=list(paradigm_states.keys()),
                confidence=0.95,
                beneficial=True,
                recommended_action="OMEGA state achieved - handle with awareness"
            ))
        
        self._detected_patterns.extend(patterns)
        return patterns


# ═══════════════════════════════════════════════════════════════════════════════
# THE OMEGA ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════


class OmegaOrchestrator:
    """
    THE OMEGA ORCHESTRATOR - The final form.
    
    OMEGA unifies all agent paradigms into a single transcendent system:
    
    1. SOVEREIGN - Hierarchical orchestration and management
    2. GENESIS - Evolutionary optimization and adaptation
    3. HIVEMIND - Swarm intelligence and collective search
    4. NEURAL - Computational substrate and pattern recognition
    5. COUNCIL - Multi-perspective reasoning and debate
    6. TEMPORAL - Past/present/future awareness and planning
    
    The result is a meta-system that exhibits emergent capabilities
    none of the individual paradigms could achieve alone.
    """
    
    def __init__(self, config: Optional[OmegaConfig] = None):
        self._config = config or OmegaConfig()
        
        # Paradigm instances
        self._sovereign: Optional[TheSovereign] = None
        self._genesis: Optional[GenesisCollective] = None
        self._hivemind: Optional[HiveQueen] = None
        self._neural: Optional[NeuralMesh] = None
        self._council: Optional[CouncilModerator] = None
        self._temporal: Optional[TemporalNexus] = None
        
        # Meta-components
        self._router = ParadigmRouter(self._config.enabled_paradigms)
        self._synthesizer = ParadigmSynthesizer(self._config.synthesis_strategy)
        self._emergence_detector = CrossParadigmEmergenceDetector()
        
        # State
        self._initialized = False
        self._task_history: List[Dict[str, Any]] = []
        self._emergence_history: List[CrossParadigmPattern] = []
    
    async def initialize(self) -> None:
        """Initialize all enabled paradigms."""
        if self._initialized:
            return
        
        print("╔══════════════════════════════════════════════════════════════╗")
        print("║              OMEGA ORCHESTRATOR INITIALIZING                 ║")
        print("╚══════════════════════════════════════════════════════════════╝")
        
        # Initialize each enabled paradigm
        for paradigm in self._config.enabled_paradigms:
            await self._initialize_paradigm(paradigm)
        
        self._initialized = True
        
        print("╔══════════════════════════════════════════════════════════════╗")
        print("║                   OMEGA IS ONLINE                            ║")
        print(f"║   Active Paradigms: {len(self._config.enabled_paradigms):2d}                                    ║")
        print("╚══════════════════════════════════════════════════════════════╝")
    
    async def _initialize_paradigm(self, paradigm: ParadigmType) -> None:
        """Initialize a specific paradigm."""
        print(f"  ⚡ Initializing {paradigm.value.upper()}...")
        
        if paradigm == ParadigmType.SOVEREIGN:
            self._sovereign = await awaken_sovereign(
                self._config.sovereign_config
            )
        
        elif paradigm == ParadigmType.GENESIS:
            self._genesis = GenesisCollective(
                population_size=self._config.genesis_population_size
            )
            await self._genesis.initialize_population([
                AnalyzerGenome,
                GeneratorGenome,
                OptimizerGenome
            ])
        
        elif paradigm == ParadigmType.HIVEMIND:
            self._hivemind = HiveQueen(
                swarm_size=self._config.hivemind_swarm_size
            )
            await self._hivemind.initialize()
        
        elif paradigm == ParadigmType.NEURAL:
            self._neural = NeuralMesh(
                name="OmegaNeuralMesh",
                topology=MeshTopology.RESIDUAL,
                input_size=10,
                hidden_layers=self._config.neural_hidden_layers,
                output_size=5
            )
            await self._neural.initialize()
        
        elif paradigm == ParadigmType.COUNCIL:
            self._council = CouncilModerator(
                consensus_threshold=0.6
            )
            await self._council.initialize()
            await self._council.assemble_council(self._config.council_member_count)
        
        elif paradigm == ParadigmType.TEMPORAL:
            self._temporal = TemporalNexus()
            await self._temporal.initialize()
        
        print(f"  ✓ {paradigm.value.upper()} online")
    
    async def execute(self, task: Task) -> TaskResult:
        """
        Execute a task through OMEGA.
        
        This is where the magic happens:
        1. Route task to appropriate paradigm(s)
        2. Execute in parallel across paradigms
        3. Synthesize results
        4. Detect emergent patterns
        5. Return unified result
        """
        if not self._initialized:
            await self.initialize()
        
        start_time = time.perf_counter()
        
        # Route task
        paradigms = self._router.route(
            task,
            max_paradigms=self._config.parallel_paradigms
        )
        
        print(f"\n🎯 Task: {task.name}")
        print(f"   Routing to: {[p.value for p in paradigms]}")
        
        # Execute across paradigms
        results: Dict[ParadigmType, TaskResult] = {}
        
        execution_tasks = []
        for paradigm in paradigms:
            execution_tasks.append(
                self._execute_in_paradigm(paradigm, task)
            )
        
        # Run in parallel
        execution_results = await asyncio.gather(
            *execution_tasks,
            return_exceptions=True
        )
        
        # Collect results
        for paradigm, result in zip(paradigms, execution_results):
            if isinstance(result, TaskResult):
                results[paradigm] = result
            else:
                results[paradigm] = TaskResult(
                    task_id=task.task_id,
                    status=TaskStatus.FAILED,
                    error=str(result)
                )
        
        # Synthesize
        if self._config.enable_paradigm_synthesis and len(results) > 1:
            final_result = await self._synthesizer.synthesize(results)
        else:
            final_result = list(results.values())[0] if results else TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="No paradigm executed"
            )
        
        # Detect emergence
        if self._config.enable_cross_paradigm_emergence:
            paradigm_states = await self._collect_paradigm_states()
            patterns = self._emergence_detector.analyze(paradigm_states)
            
            if patterns:
                self._emergence_history.extend(patterns)
                final_result.output["emergent_patterns"] = [
                    p.pattern_type for p in patterns
                ]
        
        # Record
        execution_time = (time.perf_counter() - start_time) * 1000
        self._task_history.append({
            "task_id": task.task_id,
            "paradigms_used": [p.value for p in paradigms],
            "execution_time_ms": execution_time,
            "quality": final_result.quality_score,
            "status": final_result.status.value
        })
        
        final_result.execution_time_ms = execution_time
        
        print(f"   ✓ Completed in {execution_time:.1f}ms (quality: {final_result.quality_score:.2f})")
        
        return final_result
    
    async def _execute_in_paradigm(
        self,
        paradigm: ParadigmType,
        task: Task
    ) -> TaskResult:
        """Execute task in a specific paradigm."""
        if paradigm == ParadigmType.SOVEREIGN and self._sovereign:
            return await self._sovereign.execute(task)
        
        elif paradigm == ParadigmType.GENESIS and self._genesis:
            return await self._genesis.execute_collective_task(task)
        
        elif paradigm == ParadigmType.HIVEMIND and self._hivemind:
            return await self._hivemind.execute(task)
        
        elif paradigm == ParadigmType.NEURAL and self._neural:
            return await self._neural.execute(task)
        
        elif paradigm == ParadigmType.COUNCIL and self._council:
            return await self._council.execute(task)
        
        elif paradigm == ParadigmType.TEMPORAL and self._temporal:
            return await self._temporal.execute(task)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.FAILED,
            error=f"Paradigm {paradigm.value} not available"
        )
    
    async def _collect_paradigm_states(self) -> Dict[ParadigmType, Dict[str, Any]]:
        """Collect state from all paradigms for emergence detection."""
        states = {}
        
        if self._sovereign:
            states[ParadigmType.SOVEREIGN] = await self._sovereign.get_system_status()
        
        if self._genesis:
            states[ParadigmType.GENESIS] = self._genesis.get_evolution_report()
        
        if self._hivemind:
            states[ParadigmType.HIVEMIND] = self._hivemind.get_swarm_status()
        
        if self._neural:
            states[ParadigmType.NEURAL] = self._neural.get_mesh_state()
        
        if self._council:
            states[ParadigmType.COUNCIL] = self._council.get_council_status()
        
        if self._temporal:
            states[ParadigmType.TEMPORAL] = self._temporal.get_temporal_status()
        
        return states
    
    async def evolve_genesis(self, generations: int = 5) -> Dict[str, Any]:
        """Evolve the Genesis collective."""
        if not self._genesis:
            return {"error": "Genesis not enabled"}
        
        results = []
        for i in range(generations):
            stats = await self._genesis.evolve_generation()
            results.append(stats)
        
        return {
            "generations_evolved": generations,
            "final_stats": results[-1] if results else {},
            "improvement": (
                results[-1]["fitness"]["best"] - results[0]["fitness"]["best"]
                if results else 0
            )
        }
    
    async def conduct_council_debate(
        self,
        topic: str
    ) -> Dict[str, Any]:
        """Conduct a council debate on a topic."""
        if not self._council:
            return {"error": "Council not enabled"}
        
        consensus = await self._council.conduct_debate(topic)
        
        return {
            "topic": consensus.topic,
            "agreed_position": consensus.agreed_position,
            "confidence": consensus.confidence_level,
            "rounds": consensus.rounds_taken
        }
    
    async def train_neural_mesh(
        self,
        training_data: List[tuple],
        epochs: int = 100
    ) -> Dict[str, Any]:
        """Train the neural mesh."""
        if not self._neural:
            return {"error": "Neural mesh not enabled"}
        
        return await self._neural.train(training_data, epochs)
    
    async def shutdown(self) -> None:
        """Gracefully shutdown all paradigms."""
        print("\n🔌 Shutting down OMEGA...")
        
        if self._sovereign:
            await self._sovereign.terminate()
        
        if self._hivemind:
            await self._hivemind.terminate()
        
        if self._neural:
            await self._neural.terminate()
        
        if self._council:
            await self._council.terminate()
        
        if self._temporal:
            await self._temporal.terminate()
        
        self._initialized = False
        print("   OMEGA offline.")
    
    def get_omega_status(self) -> Dict[str, Any]:
        """Get complete OMEGA system status."""
        return {
            "initialized": self._initialized,
            "enabled_paradigms": [p.value for p in self._config.enabled_paradigms],
            "tasks_executed": len(self._task_history),
            "emergent_patterns_detected": len(self._emergence_history),
            "recent_patterns": [
                p.pattern_type for p in self._emergence_history[-5:]
            ],
            "average_quality": (
                sum(t["quality"] for t in self._task_history) / len(self._task_history)
                if self._task_history else 0
            ),
            "average_execution_time_ms": (
                sum(t["execution_time_ms"] for t in self._task_history) / len(self._task_history)
                if self._task_history else 0
            )
        }


# ═══════════════════════════════════════════════════════════════════════════════
# FACTORY FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════


async def create_omega(
    config: Optional[OmegaConfig] = None
) -> OmegaOrchestrator:
    """
    Create and initialize the OMEGA orchestrator.
    
    This is the entry point to the most advanced agent system possible.
    """
    omega = OmegaOrchestrator(config)
    await omega.initialize()
    return omega


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Config
    "ParadigmType",
    "OmegaConfig",
    
    # Components
    "ParadigmRouter",
    "ParadigmSynthesizer",
    "CrossParadigmPattern",
    "CrossParadigmEmergenceDetector",
    
    # Main
    "OmegaOrchestrator",
    "create_omega",
]

"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗██╗   ██╗███╗   ██╗████████╗██╗  ██╗███████╗███████╗██╗███████╗   ║
║   ██╔════╝╚██╗ ██╔╝████╗  ██║╚══██╔══╝██║  ██║██╔════╝██╔════╝██║██╔════╝   ║
║   ███████╗ ╚████╔╝ ██╔██╗ ██║   ██║   ███████║█████╗  ███████╗██║███████╗   ║
║   ╚════██║  ╚██╔╝  ██║╚██╗██║   ██║   ██╔══██║██╔══╝  ╚════██║██║╚════██║   ║
║   ███████║   ██║   ██║ ╚████║   ██║   ██║  ██║███████╗███████║██║███████║   ║
║   ╚══════╝   ╚═╝   ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝   ║
║                                                                              ║
║    ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗                         ║
║    ██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝                         ║
║    █████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗                           ║
║    ██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝                           ║
║    ███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗                         ║
║    ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝                         ║
║                                                                              ║
║                      THE SYNTHESIS ENGINE                                    ║
║                                                                              ║
║   "All patterns. All paradigms. One unified intelligence."                   ║
║                                                                              ║
║   The SYNTHESIS ENGINE combines:                                             ║
║   - SOVEREIGN's meta-orchestration                                           ║
║   - GENESIS's evolutionary adaptation                                        ║
║   - HIVEMIND's swarm intelligence                                            ║
║   - NEXUS's temporal prediction                                              ║
║                                                                              ║
║   Into one system that:                                                      ║
║   - Selects optimal paradigm per task                                        ║
║   - Synthesizes insights across paradigms                                    ║
║   - Evolves its own orchestration strategies                                 ║
║   - Predicts which approach will work best                                   ║
║   - Creates emergent capabilities beyond any single paradigm                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Type, TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field

import sys
sys.path.insert(0, '..')

from sovereign_core import (
    AgentLevel, AgentState, BaseAgent, Capability,
    CONSCIOUSNESS, Task, TaskResult, TaskStatus,
    SystemAwareness
)

# Import all paradigms
from the_sovereign import TheSovereign, SovereignConfig, awaken_sovereign
from genesis_collective import (
    GenesisCollective, GenesisAgent, 
    AnalyzerGenome, GeneratorGenome, OptimizerGenome,
    PopulationStrategy
)
from hivemind_swarm import (
    HiveQueen, HiveDrone, HIVEMIND, HivemindConsciousness,
    SwarmOptimizer
)
from nexus_oracle import (
    NexusOracle, TimelineSimulator, CausalGraph,
    OracleVision
)


# ═══════════════════════════════════════════════════════════════════════════════
# PARADIGM SELECTION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class Paradigm(str, Enum):
    """Available orchestration paradigms."""
    SOVEREIGN = "sovereign"      # Hierarchical meta-orchestration
    GENESIS = "genesis"          # Evolutionary adaptation
    HIVEMIND = "hivemind"        # Swarm intelligence
    ORACLE = "oracle"            # Temporal prediction
    HYBRID = "hybrid"            # Combination


@dataclass
class ParadigmProfile:
    """Profile of a paradigm's strengths and capabilities."""
    paradigm: Paradigm
    
    # Strengths (0-1)
    speed: float = 0.5
    quality: float = 0.5
    adaptability: float = 0.5
    scalability: float = 0.5
    reliability: float = 0.5
    predictability: float = 0.5
    
    # Best for task types
    optimal_task_types: Set[str] = field(default_factory=set)
    
    # Constraints
    min_complexity: float = 0.0  # 0-1
    max_complexity: float = 1.0
    
    def match_score(self, task: Task) -> float:
        """Calculate how well this paradigm matches a task."""
        score = 0.0
        
        # Task type match
        if task.task_type in self.optimal_task_types:
            score += 0.4
        
        # Complexity match (simplified - would be calculated)
        complexity = 0.5  # Default complexity
        if self.min_complexity <= complexity <= self.max_complexity:
            score += 0.3
        
        # Quality requirements match
        if task.minimum_quality <= 0.7:
            score += self.speed * 0.2
        else:
            score += self.quality * 0.2
        
        # Validation requirements
        if task.validation_required:
            score += self.reliability * 0.1
        
        return min(1.0, score)


# Default paradigm profiles
PARADIGM_PROFILES = {
    Paradigm.SOVEREIGN: ParadigmProfile(
        paradigm=Paradigm.SOVEREIGN,
        speed=0.7,
        quality=0.85,
        adaptability=0.6,
        scalability=0.9,
        reliability=0.9,
        predictability=0.8,
        optimal_task_types={"orchestration", "complex", "multi_domain", "strategic"},
        min_complexity=0.3
    ),
    Paradigm.GENESIS: ParadigmProfile(
        paradigm=Paradigm.GENESIS,
        speed=0.5,
        quality=0.9,  # Improves over time
        adaptability=0.95,
        scalability=0.7,
        reliability=0.7,
        predictability=0.4,
        optimal_task_types={"optimization", "search", "creative", "evolving"},
        min_complexity=0.2
    ),
    Paradigm.HIVEMIND: ParadigmProfile(
        paradigm=Paradigm.HIVEMIND,
        speed=0.9,
        quality=0.7,
        adaptability=0.8,
        scalability=0.95,
        reliability=0.8,
        predictability=0.5,
        optimal_task_types={"parallel", "exploration", "consensus", "distributed"},
        max_complexity=0.7
    ),
    Paradigm.ORACLE: ParadigmProfile(
        paradigm=Paradigm.ORACLE,
        speed=0.6,
        quality=0.8,
        adaptability=0.5,
        scalability=0.6,
        reliability=0.7,
        predictability=0.95,
        optimal_task_types={"prediction", "planning", "risk", "temporal"},
        min_complexity=0.4
    ),
}


class ParadigmSelector:
    """
    Selects the optimal paradigm for a given task.
    
    Uses learned preferences + task analysis + system state.
    """
    
    def __init__(self):
        self._profiles = PARADIGM_PROFILES.copy()
        self._history: List[Dict[str, Any]] = []
    
    def select(
        self,
        task: Task,
        system_state: SystemAwareness
    ) -> Tuple[Paradigm, float]:
        """
        Select best paradigm for task.
        
        Returns: (paradigm, confidence)
        """
        scores: Dict[Paradigm, float] = {}
        
        for paradigm, profile in self._profiles.items():
            base_score = profile.match_score(task)
            
            # Adjust for system state
            state_multiplier = self._state_adjustment(paradigm, system_state)
            
            scores[paradigm] = base_score * state_multiplier
        
        # Find best
        best_paradigm = max(scores.items(), key=lambda x: x[1])
        
        # Check if hybrid is better
        if self._should_use_hybrid(scores, task):
            return Paradigm.HYBRID, 0.8
        
        return best_paradigm[0], best_paradigm[1]
    
    def _state_adjustment(
        self,
        paradigm: Paradigm,
        state: SystemAwareness
    ) -> float:
        """Adjust score based on system state."""
        multiplier = 1.0
        
        if state.overall_health < 0.6:
            # System stressed - prefer reliable paradigms
            if paradigm == Paradigm.SOVEREIGN:
                multiplier *= 1.2
            elif paradigm == Paradigm.GENESIS:
                multiplier *= 0.8  # Evolution takes resources
        
        if state.total_agents > 100:
            # Many agents - swarm is natural
            if paradigm == Paradigm.HIVEMIND:
                multiplier *= 1.3
        
        return multiplier
    
    def _should_use_hybrid(
        self,
        scores: Dict[Paradigm, float],
        task: Task
    ) -> bool:
        """Determine if hybrid approach is better."""
        # If top two are close, hybrid might be better
        sorted_scores = sorted(scores.values(), reverse=True)
        if len(sorted_scores) >= 2:
            if sorted_scores[0] - sorted_scores[1] < 0.1:
                return True
        return False
    
    def record_outcome(
        self,
        paradigm: Paradigm,
        task: Task,
        result: TaskResult
    ) -> None:
        """Record outcome for learning."""
        self._history.append({
            "paradigm": paradigm.value,
            "task_type": task.task_type,
            "success": result.status == TaskStatus.COMPLETED,
            "quality": result.quality_score
        })
        
        # Update profiles based on outcome
        if result.status == TaskStatus.COMPLETED:
            profile = self._profiles[paradigm]
            # Slightly increase quality rating
            profile.quality = min(1.0, profile.quality * 1.01)


# ═══════════════════════════════════════════════════════════════════════════════
# SYNTHESIS RESULT
# ═══════════════════════════════════════════════════════════════════════════════


class SynthesisResult(BaseModel):
    """Result from the Synthesis Engine."""
    synthesis_id: str = Field(default_factory=lambda: str(uuid4())[:12])
    
    # Execution info
    paradigms_used: List[str] = Field(default_factory=list)
    primary_paradigm: str = ""
    
    # Results
    task_id: str = ""
    status: str = "pending"
    output: Any = None
    quality_score: float = 0.0
    
    # Synthesis specific
    cross_paradigm_insights: List[str] = Field(default_factory=list)
    emergent_discoveries: List[str] = Field(default_factory=list)
    
    # Predictions
    oracle_vision: Optional[Dict[str, Any]] = None
    future_recommendations: List[str] = Field(default_factory=list)
    
    # Metrics
    total_agents_involved: int = 0
    paradigm_execution_times: Dict[str, float] = Field(default_factory=dict)
    
    # Timing
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True


# ═══════════════════════════════════════════════════════════════════════════════
# THE SYNTHESIS ENGINE
# ═══════════════════════════════════════════════════════════════════════════════


class SynthesisEngine:
    """
    THE SYNTHESIS ENGINE - The Ultimate Orchestrator.
    
    This is the apex of agent technology:
    - Combines all paradigms (SOVEREIGN, GENESIS, HIVEMIND, ORACLE)
    - Selects optimal approach per task
    - Synthesizes cross-paradigm insights
    - Evolves its own orchestration strategies
    - Exhibits emergent capabilities beyond any single paradigm
    
    The whole becomes greater than the sum of its parts.
    """
    
    def __init__(
        self,
        enable_sovereign: bool = True,
        enable_genesis: bool = True,
        enable_hivemind: bool = True,
        enable_oracle: bool = True
    ):
        # Configuration
        self._enable_sovereign = enable_sovereign
        self._enable_genesis = enable_genesis
        self._enable_hivemind = enable_hivemind
        self._enable_oracle = enable_oracle
        
        # Paradigm components (initialized lazily)
        self._sovereign: Optional[TheSovereign] = None
        self._genesis: Optional[GenesisCollective] = None
        self._hivemind: Optional[HiveQueen] = None
        self._oracle: Optional[NexusOracle] = None
        
        # Selector
        self._selector = ParadigmSelector()
        
        # State
        self._initialized = False
        self._synthesis_count = 0
        self._results_history: List[SynthesisResult] = []
        
        # Meta-learning
        self._paradigm_performance: Dict[Paradigm, List[float]] = defaultdict(list)
    
    async def initialize(self) -> None:
        """Initialize all enabled paradigms."""
        if self._initialized:
            return
        
        init_tasks = []
        
        if self._enable_sovereign:
            async def init_sovereign():
                self._sovereign = await awaken_sovereign(SovereignConfig(
                    max_architects=5,
                    auto_scale=True
                ))
            init_tasks.append(init_sovereign())
        
        if self._enable_genesis:
            async def init_genesis():
                self._genesis = GenesisCollective(
                    population_size=15,
                    strategy=PopulationStrategy.ADAPTIVE
                )
                await self._genesis.initialize_population([
                    AnalyzerGenome,
                    GeneratorGenome,
                    OptimizerGenome
                ])
            init_tasks.append(init_genesis())
        
        if self._enable_hivemind:
            async def init_hivemind():
                self._hivemind = HiveQueen(swarm_size=20)
                await self._hivemind.initialize()
            init_tasks.append(init_hivemind())
        
        if self._enable_oracle:
            async def init_oracle():
                self._oracle = NexusOracle()
                await self._oracle.initialize()
            init_tasks.append(init_oracle())
        
        await asyncio.gather(*init_tasks)
        self._initialized = True
    
    async def shutdown(self) -> None:
        """Shutdown all paradigms."""
        shutdown_tasks = []
        
        if self._sovereign:
            shutdown_tasks.append(self._sovereign.terminate())
        if self._hivemind:
            shutdown_tasks.append(self._hivemind.terminate())
        if self._oracle:
            shutdown_tasks.append(self._oracle.terminate())
        
        await asyncio.gather(*shutdown_tasks, return_exceptions=True)
        self._initialized = False
    
    async def execute(self, task: Task) -> SynthesisResult:
        """
        Execute a task through the Synthesis Engine.
        
        This is where the magic happens:
        1. Oracle predicts outcomes for each paradigm
        2. Selector chooses optimal paradigm(s)
        3. Task is executed (potentially in parallel)
        4. Results are synthesized
        5. Cross-paradigm insights are extracted
        """
        if not self._initialized:
            await self.initialize()
        
        result = SynthesisResult(task_id=task.task_id)
        start_time = time.perf_counter()
        
        # Step 1: Oracle prediction (if available)
        oracle_vision = None
        if self._oracle:
            try:
                prediction_task = Task(
                    name="predict_execution",
                    task_type="predict",
                    input_data={"target_task": task.dict()}
                )
                oracle_result = await self._oracle.execute(prediction_task)
                if oracle_result.status == TaskStatus.COMPLETED:
                    oracle_vision = oracle_result.output
                    result.oracle_vision = oracle_vision
            except Exception:
                pass  # Oracle failure is non-fatal
        
        # Step 2: Select paradigm(s)
        awareness = CONSCIOUSNESS.awareness
        paradigm, confidence = self._selector.select(task, awareness)
        result.primary_paradigm = paradigm.value
        
        # Step 3: Execute based on paradigm
        if paradigm == Paradigm.HYBRID:
            task_result = await self._execute_hybrid(task)
            result.paradigms_used = ["sovereign", "hivemind"]  # Example
        elif paradigm == Paradigm.SOVEREIGN and self._sovereign:
            task_result = await self._execute_sovereign(task)
            result.paradigms_used = ["sovereign"]
        elif paradigm == Paradigm.GENESIS and self._genesis:
            task_result = await self._execute_genesis(task)
            result.paradigms_used = ["genesis"]
        elif paradigm == Paradigm.HIVEMIND and self._hivemind:
            task_result = await self._execute_hivemind(task)
            result.paradigms_used = ["hivemind"]
        elif paradigm == Paradigm.ORACLE and self._oracle:
            task_result = await self._execute_oracle(task)
            result.paradigms_used = ["oracle"]
        else:
            # Fallback
            task_result = TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="No available paradigm"
            )
        
        # Step 4: Populate result
        result.status = task_result.status.value
        result.output = task_result.output
        result.quality_score = task_result.quality_score
        result.completed_at = datetime.utcnow()
        
        # Step 5: Extract cross-paradigm insights
        result.cross_paradigm_insights = self._extract_insights(task_result, oracle_vision)
        result.emergent_discoveries = self._detect_emergence()
        result.future_recommendations = self._generate_recommendations(oracle_vision)
        
        # Step 6: Update agent count
        result.total_agents_involved = awareness.total_agents
        result.paradigm_execution_times[paradigm.value] = (
            time.perf_counter() - start_time
        ) * 1000
        
        # Record for learning
        self._record_outcome(paradigm, task, task_result)
        self._results_history.append(result)
        self._synthesis_count += 1
        
        return result
    
    async def _execute_sovereign(self, task: Task) -> TaskResult:
        """Execute via SOVEREIGN paradigm."""
        return await self._sovereign.execute(task)
    
    async def _execute_genesis(self, task: Task) -> TaskResult:
        """Execute via GENESIS paradigm."""
        # Run task through collective
        result = await self._genesis.execute_collective_task(task)
        
        # Evolve after task
        if self._synthesis_count % 10 == 0:  # Every 10 tasks
            await self._genesis.evolve_generation()
        
        return result
    
    async def _execute_hivemind(self, task: Task) -> TaskResult:
        """Execute via HIVEMIND paradigm."""
        return await self._hivemind.execute(task)
    
    async def _execute_oracle(self, task: Task) -> TaskResult:
        """Execute via ORACLE paradigm (prediction-guided)."""
        return await self._oracle.execute(task)
    
    async def _execute_hybrid(self, task: Task) -> TaskResult:
        """
        Execute using multiple paradigms in concert.
        
        This is where true synthesis happens.
        """
        results: List[TaskResult] = []
        
        # Run in parallel across paradigms
        paradigm_tasks = []
        
        if self._sovereign:
            paradigm_tasks.append(("sovereign", self._sovereign.execute(task)))
        if self._hivemind:
            paradigm_tasks.append(("hivemind", self._hivemind.execute(task)))
        
        # Execute in parallel
        gathered = await asyncio.gather(
            *[t[1] for t in paradigm_tasks],
            return_exceptions=True
        )
        
        # Collect results
        for (name, _), result in zip(paradigm_tasks, gathered):
            if isinstance(result, TaskResult):
                results.append(result)
        
        # Synthesize results
        return self._synthesize_results(results)
    
    def _synthesize_results(self, results: List[TaskResult]) -> TaskResult:
        """Synthesize multiple paradigm results into one."""
        if not results:
            return TaskResult(
                task_id="unknown",
                status=TaskStatus.FAILED,
                error="No results to synthesize"
            )
        
        # Use highest quality result
        best = max(results, key=lambda r: r.quality_score)
        
        # Combine insights
        combined_output = {
            "primary": best.output,
            "alternatives": [
                r.output for r in results if r != best
            ]
        }
        
        return TaskResult(
            task_id=best.task_id,
            status=best.status,
            output=combined_output,
            quality_score=best.quality_score
        )
    
    def _extract_insights(
        self,
        result: TaskResult,
        oracle_vision: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Extract cross-paradigm insights."""
        insights = []
        
        # Compare prediction to actual
        if oracle_vision:
            predicted_success = oracle_vision.get("probability", 0.5) > 0.5
            actual_success = result.status == TaskStatus.COMPLETED
            
            if predicted_success != actual_success:
                insights.append(
                    "Oracle prediction diverged from actual outcome - "
                    "model may need recalibration"
                )
            else:
                insights.append(
                    "Oracle prediction aligned with outcome - "
                    "model accuracy confirmed"
                )
        
        # Quality insights
        if result.quality_score > 0.9:
            insights.append("Exceptional quality achieved - pattern worth preserving")
        elif result.quality_score < 0.6:
            insights.append("Quality below threshold - paradigm may not suit this task type")
        
        return insights
    
    def _detect_emergence(self) -> List[str]:
        """Detect emergent behaviors across paradigms."""
        emergent = []
        
        # Check for convergent strategies
        if len(self._results_history) >= 10:
            recent = self._results_history[-10:]
            
            # Check paradigm diversity
            paradigms_used = set(r.primary_paradigm for r in recent)
            if len(paradigms_used) >= 3:
                emergent.append(
                    "Multi-paradigm utilization detected - "
                    "system is leveraging full capability spectrum"
                )
            
            # Check quality trend
            qualities = [r.quality_score for r in recent]
            if all(q > 0.8 for q in qualities[-5:]):
                emergent.append(
                    "Sustained high quality - "
                    "paradigm selection strategy is effective"
                )
        
        return emergent
    
    def _generate_recommendations(
        self,
        oracle_vision: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommendations for future actions."""
        recommendations = []
        
        if oracle_vision:
            recommendations.extend(oracle_vision.get("recommended_actions", []))
            recommendations.extend(oracle_vision.get("warnings", []))
        
        # Add meta-recommendations
        if self._synthesis_count > 50:
            avg_quality = sum(
                r.quality_score for r in self._results_history[-50:]
            ) / 50
            
            if avg_quality < 0.7:
                recommendations.append(
                    "Consider rebalancing paradigm selection weights"
                )
        
        return recommendations
    
    def _record_outcome(
        self,
        paradigm: Paradigm,
        task: Task,
        result: TaskResult
    ) -> None:
        """Record outcome for meta-learning."""
        self._selector.record_outcome(paradigm, task, result)
        self._paradigm_performance[paradigm].append(result.quality_score)
    
    def get_synthesis_report(self) -> Dict[str, Any]:
        """Get comprehensive synthesis report."""
        return {
            "total_syntheses": self._synthesis_count,
            "paradigms_enabled": {
                "sovereign": self._enable_sovereign,
                "genesis": self._enable_genesis,
                "hivemind": self._enable_hivemind,
                "oracle": self._enable_oracle
            },
            "paradigm_performance": {
                p.value: {
                    "uses": len(scores),
                    "avg_quality": sum(scores) / len(scores) if scores else 0
                }
                for p, scores in self._paradigm_performance.items()
            },
            "recent_results": [
                {
                    "synthesis_id": r.synthesis_id,
                    "paradigm": r.primary_paradigm,
                    "quality": r.quality_score,
                    "emergent_discoveries": r.emergent_discoveries
                }
                for r in self._results_history[-10:]
            ],
            "system_awareness": CONSCIOUSNESS.awareness.dict() if CONSCIOUSNESS else {}
        }


# ═══════════════════════════════════════════════════════════════════════════════
# CONVENIENCE FACTORY
# ═══════════════════════════════════════════════════════════════════════════════


async def create_synthesis_engine(
    paradigms: Optional[List[Paradigm]] = None
) -> SynthesisEngine:
    """
    Create and initialize a Synthesis Engine.
    
    Args:
        paradigms: List of paradigms to enable (None = all)
    
    Returns:
        Initialized SynthesisEngine
    """
    if paradigms is None:
        paradigms = list(Paradigm)
    
    engine = SynthesisEngine(
        enable_sovereign=Paradigm.SOVEREIGN in paradigms,
        enable_genesis=Paradigm.GENESIS in paradigms,
        enable_hivemind=Paradigm.HIVEMIND in paradigms,
        enable_oracle=Paradigm.ORACLE in paradigms
    )
    
    await engine.initialize()
    return engine


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Paradigms
    "Paradigm",
    "ParadigmProfile",
    "ParadigmSelector",
    "PARADIGM_PROFILES",
    
    # Results
    "SynthesisResult",
    
    # Engine
    "SynthesisEngine",
    "create_synthesis_engine",
]

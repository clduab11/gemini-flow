"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██████╗ ███████╗ ██████╗██╗   ██╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗   ║
║   ██╔══██╗██╔════╝██╔════╝██║   ██║██╔══██╗██╔════╝██║██╔═══██╗████╗  ██║   ║
║   ██████╔╝█████╗  ██║     ██║   ██║██████╔╝███████╗██║██║   ██║██╔██╗ ██║   ║
║   ██╔══██╗██╔══╝  ██║     ██║   ██║██╔══██╗╚════██║██║██║   ██║██║╚██╗██║   ║
║   ██║  ██║███████╗╚██████╗╚██████╔╝██║  ██║███████║██║╚██████╔╝██║ ╚████║   ║
║   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ║
║                                                                              ║
║              RECURSIVE ORCHESTRATION FRAMEWORK                               ║
║                                                                              ║
║   "Orchestrators all the way down."                                          ║
║                                                                              ║
║   This is where it gets mind-bending:                                        ║
║   - Level N orchestrator creates Level N+1 orchestrators                     ║
║   - Each level has complete orchestration capability                         ║
║   - Depth is dynamically determined by task complexity                       ║
║   - The recursion terminates at execution leaves                             ║
║   - Meta-cognition: orchestrators reason about orchestration                 ║
║                                                                              ║
║   Example execution path:                                                    ║
║   L0 → spawns L1₁, L1₂, L1₃                                                  ║
║   L1₁ → spawns L2₁, L2₂                                                      ║
║   L1₂ → spawns L2₃, L2₄, L2₅                                                 ║
║   L2₁ → spawns L3₁ (executor)                                                ║
║   ...and so on until tasks are atomic                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import math
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import (
    Any, Callable, Dict, Generic, List, Optional, 
    Set, Tuple, Type, TypeVar, Union
)
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
# RECURSION CONTROL SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class RecursionContext:
    """
    Context that flows through the recursive orchestration chain.
    
    This tracks:
    - Current depth in the recursion
    - Maximum allowed depth
    - Path taken to get here
    - Accumulated constraints
    """
    current_depth: int = 0
    max_depth: int = 10
    
    # Path tracking
    orchestrator_path: List[str] = field(default_factory=list)
    
    # Constraints that accumulate
    remaining_budget: float = 1.0  # 0.0 to 1.0, decreases with depth
    quality_floor: float = 0.8     # Minimum quality required
    
    # Decomposition history
    decomposition_count: int = 0
    max_decompositions: int = 100
    
    # Timing
    started_at: datetime = field(default_factory=datetime.utcnow)
    timeout_seconds: float = 300.0
    
    @property
    def is_at_max_depth(self) -> bool:
        return self.current_depth >= self.max_depth
    
    @property
    def is_timed_out(self) -> bool:
        elapsed = (datetime.utcnow() - self.started_at).total_seconds()
        return elapsed > self.timeout_seconds
    
    @property
    def can_decompose(self) -> bool:
        return (
            not self.is_at_max_depth and
            not self.is_timed_out and
            self.decomposition_count < self.max_decompositions and
            self.remaining_budget > 0.1
        )
    
    def descend(self, orchestrator_id: str) -> "RecursionContext":
        """Create context for next level down."""
        return RecursionContext(
            current_depth=self.current_depth + 1,
            max_depth=self.max_depth,
            orchestrator_path=self.orchestrator_path + [orchestrator_id],
            remaining_budget=self.remaining_budget * 0.9,  # 10% cost per level
            quality_floor=self.quality_floor,
            decomposition_count=self.decomposition_count + 1,
            max_decompositions=self.max_decompositions,
            started_at=self.started_at,
            timeout_seconds=self.timeout_seconds
        )


class DecompositionStrategy(str, Enum):
    """Strategy for decomposing tasks."""
    PARALLEL = "parallel"       # All subtasks in parallel
    SEQUENTIAL = "sequential"   # One after another
    PIPELINE = "pipeline"       # Output of one feeds next
    HIERARCHICAL = "hierarchical"  # Tree structure
    ADAPTIVE = "adaptive"       # Choose based on task


@dataclass
class DecompositionPlan:
    """
    Plan for how to decompose a task.
    
    Created by analyzing the task and determining optimal structure.
    """
    strategy: DecompositionStrategy
    subtasks: List[Task]
    dependencies: Dict[str, List[str]] = field(default_factory=dict)  # task_id -> depends_on
    
    # Orchestrator assignments
    orchestrator_assignments: Dict[str, str] = field(default_factory=dict)  # task_id -> orchestrator_type
    
    # Estimated metrics
    estimated_depth: int = 1
    estimated_parallelism: int = 1
    estimated_quality: float = 0.8


# ═══════════════════════════════════════════════════════════════════════════════
# RECURSIVE ORCHESTRATOR BASE
# ═══════════════════════════════════════════════════════════════════════════════


class RecursiveOrchestrator(BaseAgent):
    """
    An orchestrator that can spawn other orchestrators.
    
    This is the building block for infinite orchestration depth:
    - Each RecursiveOrchestrator can analyze tasks
    - Decide if decomposition is needed
    - Spawn child orchestrators for subtasks
    - Collect and synthesize results
    
    The recursion terminates when:
    - Task is atomic (can't be decomposed)
    - Max depth is reached
    - Budget is exhausted
    - Timeout occurs
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.EXECUTE,
        Capability.VALIDATE,
        Capability.SYNTHESIZE,
    }
    
    # Class variable for recursion depth tracking
    _global_depth_counter: int = 0
    
    def __init__(
        self,
        name: str,
        recursion_context: Optional[RecursionContext] = None,
        specialization: Optional[str] = None,
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._recursion_context = recursion_context or RecursionContext()
        self._specialization = specialization
        
        # Track spawned orchestrators
        self._child_orchestrators: Dict[str, "RecursiveOrchestrator"] = {}
        
        # Execution stats
        self._tasks_decomposed = 0
        self._tasks_executed_directly = 0
        self._total_subtasks_created = 0
        
        # Update global depth tracking
        RecursiveOrchestrator._global_depth_counter = max(
            RecursiveOrchestrator._global_depth_counter,
            self._recursion_context.current_depth
        )
    
    @property
    def depth(self) -> int:
        return self._recursion_context.current_depth
    
    @property
    def specialization(self) -> Optional[str]:
        return self._specialization
    
    @classmethod
    def get_max_observed_depth(cls) -> int:
        return cls._global_depth_counter
    
    async def _on_initialize(self) -> None:
        """Initialize the recursive orchestrator."""
        pass
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """
        Execute a task, potentially through recursive decomposition.
        
        This is the core recursive logic:
        1. Analyze task complexity
        2. If atomic or at limits -> execute directly
        3. If decomposable -> spawn child orchestrators
        4. Collect results and synthesize
        """
        # Check termination conditions
        if not self._recursion_context.can_decompose:
            return await self._execute_atomic(task)
        
        # Analyze task
        should_decompose, plan = await self._analyze_for_decomposition(task)
        
        if not should_decompose:
            return await self._execute_atomic(task)
        
        # Decompose and execute recursively
        self._tasks_decomposed += 1
        self._total_subtasks_created += len(plan.subtasks)
        
        return await self._execute_decomposed(task, plan)
    
    async def _analyze_for_decomposition(
        self,
        task: Task
    ) -> Tuple[bool, Optional[DecompositionPlan]]:
        """
        Analyze whether a task should be decomposed.
        
        Returns:
            (should_decompose, plan_if_yes)
        """
        # Simple heuristics for decomposition decision
        # In real implementation, this would use LLM or sophisticated analysis
        
        # Check task complexity indicators
        complexity_score = self._estimate_complexity(task)
        
        if complexity_score < 0.3:
            # Simple task - execute directly
            return False, None
        
        # Create decomposition plan
        plan = await self._create_decomposition_plan(task, complexity_score)
        
        # Verify plan is worthwhile
        if len(plan.subtasks) <= 1:
            return False, None
        
        return True, plan
    
    def _estimate_complexity(self, task: Task) -> float:
        """
        Estimate task complexity (0.0 - 1.0).
        
        Higher = more complex = more likely to decompose.
        """
        score = 0.0
        
        # Check input data size
        input_size = len(str(task.input_data))
        if input_size > 1000:
            score += 0.3
        elif input_size > 100:
            score += 0.1
        
        # Check for keywords indicating complexity
        complex_keywords = ["analyze", "generate", "optimize", "comprehensive", "full", "complete"]
        task_text = f"{task.name} {task.description} {task.task_type}".lower()
        
        for keyword in complex_keywords:
            if keyword in task_text:
                score += 0.1
        
        # Check required capabilities
        if len(task.required_capabilities) > 2:
            score += 0.2
        
        # Check if subtasks already defined
        if task.subtasks:
            score += 0.3
        
        return min(1.0, score)
    
    async def _create_decomposition_plan(
        self,
        task: Task,
        complexity: float
    ) -> DecompositionPlan:
        """
        Create a plan for decomposing the task.
        """
        # Use pre-defined subtasks if available
        if task.subtasks:
            return DecompositionPlan(
                strategy=DecompositionStrategy.PARALLEL,
                subtasks=task.subtasks,
                estimated_depth=1,
                estimated_parallelism=len(task.subtasks)
            )
        
        # Otherwise, create synthetic decomposition
        # In real implementation, this would use LLM for intelligent decomposition
        
        num_subtasks = max(2, min(5, int(complexity * 5)))
        
        subtasks = []
        for i in range(num_subtasks):
            subtask = Task(
                name=f"{task.name}_part_{i+1}",
                task_type=task.task_type,
                description=f"Part {i+1} of {task.name}",
                input_data={
                    "parent_task": task.task_id,
                    "part": i + 1,
                    "total_parts": num_subtasks,
                    "original_input": task.input_data
                },
                minimum_quality=task.minimum_quality,
                parent_task_id=task.task_id
            )
            subtasks.append(subtask)
        
        # Determine strategy based on task type
        if "pipeline" in task.task_type.lower():
            strategy = DecompositionStrategy.PIPELINE
        elif "sequential" in task.task_type.lower():
            strategy = DecompositionStrategy.SEQUENTIAL
        else:
            strategy = DecompositionStrategy.PARALLEL
        
        return DecompositionPlan(
            strategy=strategy,
            subtasks=subtasks,
            estimated_depth=int(math.log2(num_subtasks)) + 1,
            estimated_parallelism=num_subtasks if strategy == DecompositionStrategy.PARALLEL else 1
        )
    
    async def _execute_decomposed(
        self,
        task: Task,
        plan: DecompositionPlan
    ) -> TaskResult:
        """
        Execute a decomposed task through child orchestrators.
        """
        # Spawn child orchestrators for each subtask
        child_contexts = [
            self._recursion_context.descend(self._agent_id)
            for _ in plan.subtasks
        ]
        
        results: List[TaskResult] = []
        
        if plan.strategy == DecompositionStrategy.PARALLEL:
            results = await self._execute_parallel(plan.subtasks, child_contexts)
        
        elif plan.strategy == DecompositionStrategy.SEQUENTIAL:
            results = await self._execute_sequential(plan.subtasks, child_contexts)
        
        elif plan.strategy == DecompositionStrategy.PIPELINE:
            results = await self._execute_pipeline(plan.subtasks, child_contexts)
        
        else:
            results = await self._execute_parallel(plan.subtasks, child_contexts)
        
        # Synthesize results
        return await self._synthesize_recursive_results(task, results)
    
    async def _execute_parallel(
        self,
        subtasks: List[Task],
        contexts: List[RecursionContext]
    ) -> List[TaskResult]:
        """Execute subtasks in parallel through child orchestrators."""
        async def execute_subtask(subtask: Task, ctx: RecursionContext) -> TaskResult:
            child = await self._spawn_child_orchestrator(subtask, ctx)
            return await child.execute(subtask)
        
        results = await asyncio.gather(
            *[execute_subtask(st, ctx) for st, ctx in zip(subtasks, contexts)],
            return_exceptions=True
        )
        
        # Convert exceptions to failed results
        processed = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed.append(TaskResult(
                    task_id=subtasks[i].task_id,
                    status=TaskStatus.FAILED,
                    error=str(result)
                ))
            else:
                processed.append(result)
        
        return processed
    
    async def _execute_sequential(
        self,
        subtasks: List[Task],
        contexts: List[RecursionContext]
    ) -> List[TaskResult]:
        """Execute subtasks sequentially."""
        results = []
        
        for subtask, ctx in zip(subtasks, contexts):
            child = await self._spawn_child_orchestrator(subtask, ctx)
            result = await child.execute(subtask)
            results.append(result)
            
            # Stop on failure
            if result.status == TaskStatus.FAILED:
                break
        
        return results
    
    async def _execute_pipeline(
        self,
        subtasks: List[Task],
        contexts: List[RecursionContext]
    ) -> List[TaskResult]:
        """Execute subtasks as pipeline (output of one feeds next)."""
        results = []
        previous_output = None
        
        for subtask, ctx in zip(subtasks, contexts):
            # Feed previous output as input
            if previous_output is not None:
                subtask.input_data["pipeline_input"] = previous_output
            
            child = await self._spawn_child_orchestrator(subtask, ctx)
            result = await child.execute(subtask)
            results.append(result)
            
            if result.status == TaskStatus.FAILED:
                break
            
            previous_output = result.output
        
        return results
    
    async def _spawn_child_orchestrator(
        self,
        subtask: Task,
        context: RecursionContext
    ) -> "RecursiveOrchestrator":
        """Spawn a child orchestrator for a subtask."""
        # Determine specialization based on task
        specialization = self._determine_specialization(subtask)
        
        child = RecursiveOrchestrator(
            name=f"RO_L{context.current_depth}_{subtask.task_id[:6]}",
            recursion_context=context,
            specialization=specialization,
            parent_id=self._agent_id
        )
        
        await child.initialize()
        self._child_orchestrators[child.agent_id] = child
        self._children[child.agent_id] = child
        
        return child
    
    def _determine_specialization(self, task: Task) -> str:
        """Determine what specialization a child should have."""
        # Based on task type
        if "analysis" in task.task_type.lower():
            return "analysis"
        elif "generation" in task.task_type.lower():
            return "generation"
        elif "optimization" in task.task_type.lower():
            return "optimization"
        else:
            return "general"
    
    async def _execute_atomic(self, task: Task) -> TaskResult:
        """
        Execute an atomic (non-decomposable) task.
        
        This is where actual work happens at the leaves.
        """
        self._tasks_executed_directly += 1
        
        # Simulate actual execution based on specialization
        output = await self._perform_specialized_work(task)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output=output,
            quality_score=0.85,
            executor_id=self._agent_id
        )
    
    async def _perform_specialized_work(self, task: Task) -> Any:
        """Perform work based on specialization."""
        return {
            "executor": self._agent_id,
            "depth": self.depth,
            "specialization": self._specialization,
            "task_type": task.task_type,
            "path": self._recursion_context.orchestrator_path
        }
    
    async def _synthesize_recursive_results(
        self,
        parent_task: Task,
        results: List[TaskResult]
    ) -> TaskResult:
        """Synthesize results from child orchestrators."""
        successful = [r for r in results if r.status == TaskStatus.COMPLETED]
        
        if not successful:
            return TaskResult(
                task_id=parent_task.task_id,
                status=TaskStatus.FAILED,
                error="All subtasks failed",
                sub_results=results
            )
        
        # Combine outputs
        combined_output = {
            "synthesized": True,
            "depth": self.depth,
            "subtask_count": len(results),
            "successful_count": len(successful),
            "subtask_outputs": [r.output for r in successful],
            "orchestration_path": self._recursion_context.orchestrator_path
        }
        
        # Average quality
        avg_quality = sum(r.quality_score for r in successful) / len(successful)
        
        return TaskResult(
            task_id=parent_task.task_id,
            status=TaskStatus.COMPLETED,
            output=combined_output,
            quality_score=avg_quality,
            sub_results=results
        )
    
    def get_recursion_stats(self) -> Dict[str, Any]:
        """Get statistics about this orchestrator's recursion."""
        return {
            "agent_id": self._agent_id,
            "depth": self.depth,
            "specialization": self._specialization,
            "tasks_decomposed": self._tasks_decomposed,
            "tasks_executed_directly": self._tasks_executed_directly,
            "total_subtasks_created": self._total_subtasks_created,
            "child_orchestrators": len(self._child_orchestrators),
            "path": self._recursion_context.orchestrator_path
        }


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIALIZED RECURSIVE ORCHESTRATORS
# ═══════════════════════════════════════════════════════════════════════════════


class AnalysisRecursiveOrchestrator(RecursiveOrchestrator):
    """Recursive orchestrator specialized for analysis tasks."""
    
    def __init__(self, name: str, **kwargs):
        super().__init__(name=name, specialization="analysis", **kwargs)
    
    async def _perform_specialized_work(self, task: Task) -> Any:
        """Perform analysis work."""
        base = await super()._perform_specialized_work(task)
        base["analysis_result"] = {
            "patterns_found": 5,
            "confidence": 0.87,
            "depth_analysis": self.depth
        }
        return base


class GenerationRecursiveOrchestrator(RecursiveOrchestrator):
    """Recursive orchestrator specialized for generation tasks."""
    
    def __init__(self, name: str, **kwargs):
        super().__init__(name=name, specialization="generation", **kwargs)
    
    async def _perform_specialized_work(self, task: Task) -> Any:
        """Perform generation work."""
        base = await super()._perform_specialized_work(task)
        base["generated_content"] = {
            "type": "recursive_generation",
            "tokens": 500,
            "depth_factor": 1.0 / (self.depth + 1)
        }
        return base


class OptimizationRecursiveOrchestrator(RecursiveOrchestrator):
    """Recursive orchestrator specialized for optimization tasks."""
    
    def __init__(self, name: str, **kwargs):
        super().__init__(name=name, specialization="optimization", **kwargs)
    
    async def _perform_specialized_work(self, task: Task) -> Any:
        """Perform optimization work."""
        base = await super()._perform_specialized_work(task)
        base["optimization_result"] = {
            "improvement": 0.15,
            "iterations": 10,
            "convergence": True
        }
        return base


# ═══════════════════════════════════════════════════════════════════════════════
# META-RECURSIVE ORCHESTRATOR (ORCHESTRATES ORCHESTRATORS OF ORCHESTRATORS)
# ═══════════════════════════════════════════════════════════════════════════════


class MetaRecursiveOrchestrator(RecursiveOrchestrator):
    """
    The meta-recursive orchestrator.
    
    This doesn't just spawn orchestrators - it spawns META-orchestrators
    that themselves spawn orchestrators. This creates true recursive depth.
    
    Structure:
    MetaRecursive
    └── RecursiveOrchestrator (domain A)
        └── RecursiveOrchestrator (subtask A1)
            └── RecursiveOrchestrator (subtask A1a)
                └── Atomic executor
    └── RecursiveOrchestrator (domain B)
        └── ...
    """
    
    DEFAULT_CAPABILITIES = RecursiveOrchestrator.DEFAULT_CAPABILITIES | {
        Capability.TEMPORAL_PLAN,
        Capability.EMERGENT_DETECT,
    }
    
    def __init__(
        self,
        name: str = "MetaRecursive",
        max_meta_depth: int = 3,
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        self._max_meta_depth = max_meta_depth
        
        # Track meta-level spawning
        self._meta_children: Dict[str, "MetaRecursiveOrchestrator"] = {}
        self._meta_depth = kwargs.get("meta_depth", 0)
    
    @property
    def meta_depth(self) -> int:
        return self._meta_depth
    
    async def _analyze_for_decomposition(
        self,
        task: Task
    ) -> Tuple[bool, Optional[DecompositionPlan]]:
        """
        Meta-level analysis.
        
        Decides not just whether to decompose, but whether to
        spawn regular orchestrators or meta-orchestrators.
        """
        complexity = self._estimate_complexity(task)
        
        # Very complex tasks get meta-decomposition
        if complexity > 0.7 and self._meta_depth < self._max_meta_depth:
            return True, await self._create_meta_decomposition_plan(task)
        
        # Regular decomposition
        return await super()._analyze_for_decomposition(task)
    
    async def _create_meta_decomposition_plan(
        self,
        task: Task
    ) -> DecompositionPlan:
        """Create a meta-level decomposition plan."""
        # Decompose into domain areas, each handled by a meta-orchestrator
        domains = ["analysis", "generation", "validation", "optimization"]
        
        subtasks = []
        for domain in domains:
            subtask = Task(
                name=f"{task.name}_{domain}",
                task_type=f"meta_{domain}",
                description=f"Meta-{domain} for {task.name}",
                input_data={
                    "parent_task": task.task_id,
                    "domain": domain,
                    "original_input": task.input_data
                },
                parent_task_id=task.task_id
            )
            subtasks.append(subtask)
        
        plan = DecompositionPlan(
            strategy=DecompositionStrategy.HIERARCHICAL,
            subtasks=subtasks,
            orchestrator_assignments={
                st.task_id: "meta" for st in subtasks
            },
            estimated_depth=self._max_meta_depth - self._meta_depth
        )
        
        return plan
    
    async def _spawn_child_orchestrator(
        self,
        subtask: Task,
        context: RecursionContext
    ) -> RecursiveOrchestrator:
        """Spawn either a meta-orchestrator or regular orchestrator."""
        # Check if this should be a meta-orchestrator
        if (subtask.task_id in getattr(self, '_current_plan_assignments', {}) and
            self._meta_depth < self._max_meta_depth):
            
            child = MetaRecursiveOrchestrator(
                name=f"MetaRO_L{self._meta_depth + 1}_{subtask.task_id[:6]}",
                recursion_context=context,
                parent_id=self._agent_id,
                meta_depth=self._meta_depth + 1,
                max_meta_depth=self._max_meta_depth
            )
            
            await child.initialize()
            self._meta_children[child.agent_id] = child
            self._children[child.agent_id] = child
            
            return child
        
        # Regular recursive orchestrator
        return await super()._spawn_child_orchestrator(subtask, context)
    
    def get_meta_stats(self) -> Dict[str, Any]:
        """Get meta-recursion statistics."""
        base_stats = self.get_recursion_stats()
        base_stats["meta_depth"] = self._meta_depth
        base_stats["meta_children"] = len(self._meta_children)
        base_stats["max_meta_depth"] = self._max_meta_depth
        
        return base_stats


# ═══════════════════════════════════════════════════════════════════════════════
# RECURSION VISUALIZER
# ═══════════════════════════════════════════════════════════════════════════════


class RecursionVisualizer:
    """
    Visualizes the recursive orchestration structure.
    """
    
    @staticmethod
    def visualize_tree(orchestrator: RecursiveOrchestrator, indent: int = 0) -> str:
        """Create a text visualization of the orchestration tree."""
        lines = []
        
        prefix = "  " * indent
        connector = "├── " if indent > 0 else ""
        
        info = f"{orchestrator._name} (D{orchestrator.depth}"
        if orchestrator.specialization:
            info += f", {orchestrator.specialization}"
        info += ")"
        
        lines.append(f"{prefix}{connector}{info}")
        
        # Add children
        children = list(orchestrator._child_orchestrators.values())
        for i, child in enumerate(children):
            is_last = (i == len(children) - 1)
            child_prefix = "  " * (indent + 1)
            
            if is_last:
                child_lines = RecursionVisualizer.visualize_tree(child, indent + 1)
            else:
                child_lines = RecursionVisualizer.visualize_tree(child, indent + 1)
            
            lines.append(child_lines)
        
        return "\n".join(lines)
    
    @staticmethod
    def get_depth_distribution(orchestrator: RecursiveOrchestrator) -> Dict[int, int]:
        """Get distribution of orchestrators by depth."""
        distribution: Dict[int, int] = defaultdict(int)
        
        def traverse(orch: RecursiveOrchestrator):
            distribution[orch.depth] += 1
            for child in orch._child_orchestrators.values():
                traverse(child)
        
        traverse(orchestrator)
        return dict(distribution)
    
    @staticmethod
    def get_total_orchestrator_count(orchestrator: RecursiveOrchestrator) -> int:
        """Count total orchestrators in the tree."""
        count = 1
        for child in orchestrator._child_orchestrators.values():
            count += RecursionVisualizer.get_total_orchestrator_count(child)
        return count


# ═══════════════════════════════════════════════════════════════════════════════
# FACTORY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


async def create_recursive_orchestration_system(
    max_depth: int = 5,
    use_meta: bool = True
) -> Union[RecursiveOrchestrator, MetaRecursiveOrchestrator]:
    """
    Create a complete recursive orchestration system.
    
    Args:
        max_depth: Maximum recursion depth
        use_meta: Whether to use meta-recursive orchestrators
    
    Returns:
        The root orchestrator
    """
    context = RecursionContext(
        max_depth=max_depth,
        timeout_seconds=600.0
    )
    
    if use_meta:
        root = MetaRecursiveOrchestrator(
            name="ROOT_META",
            recursion_context=context,
            max_meta_depth=3
        )
    else:
        root = RecursiveOrchestrator(
            name="ROOT",
            recursion_context=context
        )
    
    await root.initialize()
    return root


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Context and planning
    "RecursionContext",
    "DecompositionStrategy",
    "DecompositionPlan",
    
    # Orchestrators
    "RecursiveOrchestrator",
    "AnalysisRecursiveOrchestrator",
    "GenerationRecursiveOrchestrator",
    "OptimizationRecursiveOrchestrator",
    "MetaRecursiveOrchestrator",
    
    # Utilities
    "RecursionVisualizer",
    
    # Factory
    "create_recursive_orchestration_system",
]

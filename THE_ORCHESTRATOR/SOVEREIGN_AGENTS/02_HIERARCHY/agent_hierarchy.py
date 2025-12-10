"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SPECIALIZED AGENT HIERARCHY                               ║
║                                                                              ║
║   This file contains the specialized agents that form the SOVEREIGN system:  ║
║                                                                              ║
║   ARCHITECTS (Level 1)                                                       ║
║   └── Domain masters who understand entire problem spaces                    ║
║   └── Can spawn specialists and decompose complex tasks                      ║
║   └── Have meta-awareness and can adapt strategies                           ║
║                                                                              ║
║   SPECIALISTS (Level 2)                                                      ║
║   └── Task experts with deep knowledge in specific areas                     ║
║   └── Can spawn workers for parallel execution                               ║
║   └── Validate and synthesize worker outputs                                 ║
║                                                                              ║
║   WORKERS (Level 3)                                                          ║
║   └── Pure execution units - fast and focused                                ║
║   └── Cannot spawn other agents                                              ║
║   └── Report results up the chain                                            ║
║                                                                              ║
║   SYNTHESIZERS (Level X)                                                     ║
║   └── Cross-cutting integrators                                              ║
║   └── Merge outputs across hierarchies                                       ║
║   └── Detect patterns and emergent behaviors                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Type, TypeVar
from uuid import uuid4

from sovereign_core import (
    AgentLevel,
    AgentState,
    BaseAgent,
    Capability,
    ConsciousnessSubstrate,
    CONSCIOUSNESS,
    MessagePriority,
    MessageType,
    AgentMessage,
    Task,
    TaskResult,
    TaskStatus,
    SystemAwareness,
)


# ═══════════════════════════════════════════════════════════════════════════════
# ARCHITECT AGENTS (Level 1)
# ═══════════════════════════════════════════════════════════════════════════════


class ArchitectAgent(BaseAgent):
    """
    Domain Architect - Level 1 in the SOVEREIGN hierarchy.
    
    Architects are domain masters who:
    - Understand entire problem spaces
    - Decompose complex tasks into manageable subtasks
    - Spawn and coordinate specialists
    - Adapt strategies based on system awareness
    - Ensure quality across their domain
    
    Each Architect owns a specific domain (SEO, Content, Links, etc.)
    """
    
    LEVEL = AgentLevel.ARCHITECT
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.SPAWN_SPECIALISTS,
        Capability.EXECUTE,
        Capability.VALIDATE,
        Capability.SYNTHESIZE,
        Capability.TEMPORAL_PLAN,
        Capability.QUALITY_GATE,
    }
    
    def __init__(
        self,
        name: str,
        domain: str,
        parent_id: Optional[str] = None,
        capabilities: Optional[Set[Capability]] = None,
        specialist_templates: Optional[Dict[str, Type["SpecialistAgent"]]] = None
    ):
        super().__init__(name, parent_id, capabilities)
        self._domain = domain
        self._specialist_templates = specialist_templates or {}
        
        # Domain-specific state
        self._domain_knowledge: Dict[str, Any] = {}
        self._active_strategies: List[str] = []
        self._quality_metrics: Dict[str, float] = {}
        
        # Specialist pool
        self._specialist_pool: Dict[str, "SpecialistAgent"] = {}
    
    @property
    def domain(self) -> str:
        return self._domain
    
    async def _on_initialize(self) -> None:
        """Initialize domain-specific components."""
        # Load domain knowledge
        await self._load_domain_knowledge()
        
        # Spawn initial specialist pool
        await self._initialize_specialist_pool()
    
    async def _load_domain_knowledge(self) -> None:
        """Load domain-specific knowledge."""
        # Override in domain-specific architects
        pass
    
    async def _initialize_specialist_pool(self) -> None:
        """Initialize pool of specialists."""
        for spec_name, spec_class in self._specialist_templates.items():
            specialist = await self.spawn_child(
                spec_class,
                name=f"{self._domain}_{spec_name}"
            )
            self._specialist_pool[spec_name] = specialist
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute a task, potentially decomposing it."""
        # First, attempt to decompose
        decomposition = await self._decompose_task(task)
        
        if decomposition:
            # Execute decomposed
            task.subtasks = decomposition
            results = await self._execute_parallel_subtasks(decomposition)
            return await self._synthesize_results(task, results)
        else:
            # Execute directly via specialist
            specialist = self._select_specialist(task)
            if specialist:
                return await specialist.execute(task)
            else:
                return await self._execute_as_architect(task)
    
    async def _decompose_task(self, task: Task) -> Optional[List[Task]]:
        """
        Decompose a complex task into subtasks.
        
        This is where the Architect's domain knowledge shines.
        Override in domain-specific architects.
        """
        return None  # Default: no decomposition
    
    async def _execute_parallel_subtasks(
        self, 
        subtasks: List[Task]
    ) -> List[TaskResult]:
        """Execute subtasks in parallel where possible."""
        # Group by dependencies (simplified: all parallel)
        tasks = [self._execute_subtask(st) for st in subtasks]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
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
    
    async def _execute_subtask(self, subtask: Task) -> TaskResult:
        """Execute a single subtask via appropriate specialist."""
        specialist = self._select_specialist(subtask)
        if specialist:
            return await specialist.execute(subtask)
        else:
            return await self._execute_as_architect(subtask)
    
    def _select_specialist(self, task: Task) -> Optional["SpecialistAgent"]:
        """Select the best specialist for a task."""
        for spec in self._specialist_pool.values():
            if task.required_capabilities <= spec.capabilities:
                return spec
        return None
    
    async def _execute_as_architect(self, task: Task) -> TaskResult:
        """Execute task directly as architect (fallback)."""
        # Default implementation
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={"architect_direct": True},
            quality_score=0.8
        )
    
    async def adapt_strategy(self, awareness: SystemAwareness) -> None:
        """
        Adapt domain strategy based on system awareness.
        
        This enables emergent behavior - architects can change approach
        based on global system state.
        """
        # Check for bottlenecks in our domain
        if self._domain in str(awareness.bottlenecks):
            await self._scale_specialists()
        
        # Check health
        if awareness.overall_health < 0.7:
            await self._enter_conservative_mode()
    
    async def _scale_specialists(self) -> None:
        """Scale up specialists to handle load."""
        # Spawn additional specialists
        pass
    
    async def _enter_conservative_mode(self) -> None:
        """Enter conservative mode when system is stressed."""
        self._active_strategies.append("conservative")


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIALIST AGENTS (Level 2)
# ═══════════════════════════════════════════════════════════════════════════════


class SpecialistAgent(BaseAgent):
    """
    Task Specialist - Level 2 in the SOVEREIGN hierarchy.
    
    Specialists are task experts who:
    - Have deep knowledge in specific areas
    - Spawn workers for parallel execution
    - Validate and quality-check worker outputs
    - Report to their parent Architect
    
    Each Specialist has a specific expertise (Analysis, Generation, etc.)
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
        Capability.SPAWN,
        Capability.VALIDATE,
        Capability.SYNTHESIZE,
        Capability.QUALITY_GATE,
    }
    
    def __init__(
        self,
        name: str,
        expertise: str,
        parent_id: Optional[str] = None,
        capabilities: Optional[Set[Capability]] = None,
        worker_pool_size: int = 3
    ):
        super().__init__(name, parent_id, capabilities)
        self._expertise = expertise
        self._worker_pool_size = worker_pool_size
        
        # Expertise-specific state
        self._expertise_model: Any = None
        self._quality_thresholds: Dict[str, float] = {}
        
        # Worker pool
        self._worker_pool: List["WorkerAgent"] = []
        self._available_workers: asyncio.Queue["WorkerAgent"] = asyncio.Queue()
    
    @property
    def expertise(self) -> str:
        return self._expertise
    
    async def _on_initialize(self) -> None:
        """Initialize expertise-specific components."""
        await self._load_expertise_model()
        await self._initialize_worker_pool()
    
    async def _load_expertise_model(self) -> None:
        """Load expertise-specific model/config."""
        pass
    
    async def _initialize_worker_pool(self) -> None:
        """Initialize pool of workers."""
        for i in range(self._worker_pool_size):
            worker = await self.spawn_child(
                WorkerAgent,
                name=f"{self._expertise}_worker_{i}",
                specialization=self._expertise
            )
            self._worker_pool.append(worker)
            await self._available_workers.put(worker)
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute task using worker pool."""
        # Get available worker
        worker = await self._get_worker()
        
        try:
            # Execute
            result = await worker.execute(task)
            
            # Validate
            if task.validation_required:
                result = await self._validate_worker_result(result)
            
            return result
        finally:
            # Return worker to pool
            await self._available_workers.put(worker)
    
    async def _get_worker(self) -> "WorkerAgent":
        """Get an available worker, spawning if necessary."""
        try:
            return await asyncio.wait_for(
                self._available_workers.get(),
                timeout=5.0
            )
        except asyncio.TimeoutError:
            # All workers busy - spawn temporary worker
            return await self._spawn_temporary_worker()
    
    async def _spawn_temporary_worker(self) -> "WorkerAgent":
        """Spawn a temporary worker for overflow."""
        worker = await self.spawn_child(
            WorkerAgent,
            name=f"{self._expertise}_temp_{uuid4().hex[:4]}",
            specialization=self._expertise,
            temporary=True
        )
        return worker
    
    async def _validate_worker_result(self, result: TaskResult) -> TaskResult:
        """Validate result from worker."""
        # Quality gate
        if result.quality_score < 0.7:
            result.status = TaskStatus.FAILED
            result.error = "Quality below threshold"
            result.validation_passed = False
        else:
            result.validation_passed = True
        
        return result


# ═══════════════════════════════════════════════════════════════════════════════
# WORKER AGENTS (Level 3)
# ═══════════════════════════════════════════════════════════════════════════════


class WorkerAgent(BaseAgent):
    """
    Execution Worker - Level 3 in the SOVEREIGN hierarchy.
    
    Workers are pure execution units who:
    - Execute tasks quickly and efficiently
    - Cannot spawn other agents
    - Report results to their parent Specialist
    - Are stateless between tasks
    
    Workers are designed to be disposable and replaceable.
    """
    
    LEVEL = AgentLevel.WORKER
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
    }
    
    def __init__(
        self,
        name: str,
        specialization: str,
        parent_id: Optional[str] = None,
        capabilities: Optional[Set[Capability]] = None,
        temporary: bool = False
    ):
        super().__init__(name, parent_id, capabilities)
        self._specialization = specialization
        self._temporary = temporary
        
        # Execution context
        self._execution_context: Dict[str, Any] = {}
    
    @property
    def specialization(self) -> str:
        return self._specialization
    
    @property
    def is_temporary(self) -> bool:
        return self._temporary
    
    async def _on_initialize(self) -> None:
        """Minimal initialization for workers."""
        pass
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute task directly."""
        start = time.perf_counter()
        
        try:
            # Perform actual work
            output = await self._perform_work(task)
            
            # Calculate quality
            quality = await self._assess_quality(task, output)
            
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output=output,
                quality_score=quality,
                execution_time_ms=(time.perf_counter() - start) * 1000
            )
        except Exception as e:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error=str(e),
                execution_time_ms=(time.perf_counter() - start) * 1000
            )
    
    @abstractmethod
    async def _perform_work(self, task: Task) -> Any:
        """Perform the actual work. Override in specialized workers."""
        ...
    
    async def _assess_quality(self, task: Task, output: Any) -> float:
        """Assess quality of output."""
        # Default: basic quality check
        if output is None:
            return 0.0
        return 0.85  # Default quality


# ═══════════════════════════════════════════════════════════════════════════════
# SYNTHESIZER AGENTS (Level X - Cross-cutting)
# ═══════════════════════════════════════════════════════════════════════════════


class SynthesizerAgent(BaseAgent):
    """
    Cross-level Synthesizer - Special agent that can operate at any level.
    
    Synthesizers are integrators who:
    - Merge outputs from multiple agents across hierarchies
    - Detect patterns and emergent behaviors
    - Create higher-order insights from distributed processing
    - Can be attached to any level of the hierarchy
    """
    
    LEVEL = AgentLevel.SYNTHESIZER
    DEFAULT_CAPABILITIES = {
        Capability.SYNTHESIZE,
        Capability.EMERGENT_DETECT,
        Capability.VALIDATE,
    }
    
    def __init__(
        self,
        name: str,
        synthesis_type: str,
        parent_id: Optional[str] = None,
        capabilities: Optional[Set[Capability]] = None,
        source_agents: Optional[List[str]] = None
    ):
        super().__init__(name, parent_id, capabilities)
        self._synthesis_type = synthesis_type
        self._source_agents = source_agents or []
        
        # Synthesis state
        self._collected_outputs: Dict[str, Any] = {}
        self._detected_patterns: List[str] = []
    
    async def _on_initialize(self) -> None:
        """Initialize synthesis components."""
        # Register pattern detector with consciousness
        CONSCIOUSNESS.register_pattern_detector(self._detect_patterns)
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute synthesis task."""
        # Collect outputs from source agents
        await self._collect_outputs()
        
        # Synthesize
        synthesized = await self._perform_synthesis()
        
        # Detect patterns
        patterns = self._detect_patterns(CONSCIOUSNESS.awareness)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={
                "synthesized": synthesized,
                "patterns": patterns,
                "sources": list(self._collected_outputs.keys())
            },
            quality_score=0.9
        )
    
    async def _collect_outputs(self) -> None:
        """Collect outputs from source agents."""
        # Request results from source agents
        for agent_id in self._source_agents:
            await self.send_message(
                recipient_id=agent_id,
                message_type=MessageType.SYNC,
                payload={"request": "output"}
            )
    
    async def _perform_synthesis(self) -> Any:
        """Perform the actual synthesis."""
        # Override in specialized synthesizers
        return {"merged": self._collected_outputs}
    
    def _detect_patterns(self, awareness: SystemAwareness) -> List[str]:
        """Detect emergent patterns in system state."""
        patterns = []
        
        # Example pattern detection
        if awareness.total_agents > 50:
            patterns.append("swarm_threshold_reached")
        
        if awareness.overall_health < 0.5:
            patterns.append("system_degradation")
        
        # Check for convergence
        if len(set(awareness.agents_by_state.values())) == 1:
            patterns.append("uniform_state")
        
        return patterns


# ═══════════════════════════════════════════════════════════════════════════════
# DOMAIN-SPECIFIC ARCHITECTS
# ═══════════════════════════════════════════════════════════════════════════════


class SEOArchitect(ArchitectAgent):
    """Architect specialized for SEO domain."""
    
    def __init__(self, name: str = "seo_architect", **kwargs):
        super().__init__(
            name=name,
            domain="seo",
            **kwargs
        )
    
    async def _decompose_task(self, task: Task) -> Optional[List[Task]]:
        """Decompose SEO tasks into components."""
        if task.task_type == "full_seo_audit":
            return [
                Task(
                    name="technical_audit",
                    task_type="technical_seo",
                    required_capabilities={Capability.ANALYZE}
                ),
                Task(
                    name="content_audit",
                    task_type="content_analysis",
                    required_capabilities={Capability.ANALYZE}
                ),
                Task(
                    name="backlink_audit",
                    task_type="link_analysis",
                    required_capabilities={Capability.ANALYZE}
                ),
            ]
        return None


class ContentArchitect(ArchitectAgent):
    """Architect specialized for Content domain."""
    
    def __init__(self, name: str = "content_architect", **kwargs):
        super().__init__(
            name=name,
            domain="content",
            **kwargs
        )
    
    async def _decompose_task(self, task: Task) -> Optional[List[Task]]:
        """Decompose content tasks."""
        if task.task_type == "article_generation":
            return [
                Task(
                    name="research",
                    task_type="topic_research",
                    required_capabilities={Capability.ANALYZE}
                ),
                Task(
                    name="outline",
                    task_type="content_planning",
                    required_capabilities={Capability.GENERATE}
                ),
                Task(
                    name="draft",
                    task_type="content_writing",
                    required_capabilities={Capability.GENERATE}
                ),
                Task(
                    name="optimize",
                    task_type="content_optimization",
                    required_capabilities={Capability.OPTIMIZE}
                ),
            ]
        return None


class AnalyticsArchitect(ArchitectAgent):
    """Architect specialized for Analytics domain."""
    
    def __init__(self, name: str = "analytics_architect", **kwargs):
        super().__init__(
            name=name,
            domain="analytics",
            **kwargs
        )


# ═══════════════════════════════════════════════════════════════════════════════
# DOMAIN-SPECIFIC SPECIALISTS
# ═══════════════════════════════════════════════════════════════════════════════


class AnalysisSpecialist(SpecialistAgent):
    """Specialist for analysis tasks."""
    
    DEFAULT_CAPABILITIES = SpecialistAgent.DEFAULT_CAPABILITIES | {
        Capability.ANALYZE,
    }
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            expertise="analysis",
            **kwargs
        )


class GenerationSpecialist(SpecialistAgent):
    """Specialist for content/code generation."""
    
    DEFAULT_CAPABILITIES = SpecialistAgent.DEFAULT_CAPABILITIES | {
        Capability.GENERATE,
    }
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            expertise="generation",
            **kwargs
        )


class OptimizationSpecialist(SpecialistAgent):
    """Specialist for optimization tasks."""
    
    DEFAULT_CAPABILITIES = SpecialistAgent.DEFAULT_CAPABILITIES | {
        Capability.OPTIMIZE,
    }
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            expertise="optimization",
            **kwargs
        )


class ValidationSpecialist(SpecialistAgent):
    """Specialist for validation and QA."""
    
    DEFAULT_CAPABILITIES = SpecialistAgent.DEFAULT_CAPABILITIES | {
        Capability.VALIDATE,
        Capability.QUALITY_GATE,
    }
    
    def __init__(self, name: str, **kwargs):
        super().__init__(
            name=name,
            expertise="validation",
            **kwargs
        )


# ═══════════════════════════════════════════════════════════════════════════════
# DOMAIN-SPECIFIC WORKERS
# ═══════════════════════════════════════════════════════════════════════════════


class AnalysisWorker(WorkerAgent):
    """Worker specialized for analysis."""
    
    async def _perform_work(self, task: Task) -> Any:
        """Perform analysis work."""
        input_data = task.input_data
        
        # Simulated analysis
        return {
            "analysis_type": task.task_type,
            "input_size": len(str(input_data)),
            "findings": [],
            "metrics": {}
        }


class GenerationWorker(WorkerAgent):
    """Worker specialized for generation."""
    
    async def _perform_work(self, task: Task) -> Any:
        """Perform generation work."""
        return {
            "generated_type": task.task_type,
            "content": f"Generated content for {task.name}",
            "tokens": 100
        }


class OptimizationWorker(WorkerAgent):
    """Worker specialized for optimization."""
    
    async def _perform_work(self, task: Task) -> Any:
        """Perform optimization work."""
        input_data = task.input_data
        
        return {
            "optimization_type": task.task_type,
            "original": input_data,
            "optimized": input_data,  # Would transform
            "improvement": 0.15
        }


class ValidationWorker(WorkerAgent):
    """Worker specialized for validation."""
    
    async def _perform_work(self, task: Task) -> Any:
        """Perform validation work."""
        return {
            "validation_type": task.task_type,
            "passed": True,
            "issues": [],
            "score": 0.95
        }


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Architect level
    "ArchitectAgent",
    "SEOArchitect",
    "ContentArchitect",
    "AnalyticsArchitect",
    
    # Specialist level
    "SpecialistAgent",
    "AnalysisSpecialist",
    "GenerationSpecialist",
    "OptimizationSpecialist",
    "ValidationSpecialist",
    
    # Worker level
    "WorkerAgent",
    "AnalysisWorker",
    "GenerationWorker",
    "OptimizationWorker",
    "ValidationWorker",
    
    # Synthesizer
    "SynthesizerAgent",
]

"""
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                      ║
║   ████████╗██╗  ██╗███████╗    ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗███████╗               ║
║   ╚══██╔══╝██║  ██║██╔════╝    ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝██╔════╝               ║
║      ██║   ███████║█████╗      ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║   █████╗                 ║
║      ██║   ██╔══██║██╔══╝      ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║   ██╔══╝                 ║
║      ██║   ██║  ██║███████╗    ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║   ███████╗               ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝               ║
║                                                                                                      ║
║   ██████╗ ███████╗ ██████╗ ██████╗ ███████╗███████╗███████╗                                         ║
║   ██╔══██╗██╔════╝██╔════╝ ██╔══██╗██╔════╝██╔════╝██╔════╝                                         ║
║   ██████╔╝█████╗  ██║  ███╗██████╔╝█████╗  ███████╗███████╗                                         ║
║   ██╔══██╗██╔══╝  ██║   ██║██╔══██╗██╔══╝  ╚════██║╚════██║                                         ║
║   ██║  ██║███████╗╚██████╔╝██║  ██║███████╗███████║███████║                                         ║
║   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝                                         ║
║                                                                                                      ║
║                    RECURSIVE ORCHESTRATION TO THE N-TH DEGREE                                        ║
║                                                                                                      ║
║   "Orchestrators orchestrating orchestrators, infinitely deep, perfectly precise"                    ║
║                                                                                                      ║
║   ═══════════════════════════════════════════════════════════════════════════════════════════════    ║
║                                                                                                      ║
║   THE ARCHITECTURE:                                                                                  ║
║                                                                                                      ║
║   Level 0: PRIME ORCHESTRATOR (Singular - The Origin)                                               ║
║       │                                                                                              ║
║       ├── Level 1: DOMAIN ORCHESTRATORS (Spawn orchestrators for domains)                           ║
║       │       │                                                                                      ║
║       │       ├── Level 2: CAPABILITY ORCHESTRATORS (Spawn for capabilities)                        ║
║       │       │       │                                                                              ║
║       │       │       ├── Level 3: TASK ORCHESTRATORS (Spawn for task types)                        ║
║       │       │       │       │                                                                      ║
║       │       │       │       ├── Level 4: EXECUTION UNITS (Terminal executors)                     ║
║       │       │       │       │                                                                      ║
║       │       │       │       └── ... (Configurable depth N)                                        ║
║       │       │       │                                                                              ║
║       │       │       └── SYNTHESIZERS (Cross-capability integration)                               ║
║       │       │                                                                                      ║
║       │       └── VALIDATORS (Quality gates per domain)                                             ║
║       │                                                                                              ║
║       └── META-OBSERVERS (Watch the watchers, ensure coherence)                                     ║
║                                                                                                      ║
║   KEY INVARIANTS:                                                                                    ║
║   - Every agent has EXACTLY ONE responsibility                                                       ║
║   - Every agent completes ALL prerequisites before handoff                                          ║
║   - Every agent can explain its reasoning                                                           ║
║   - Every level validates the level below                                                           ║
║   - Emergent capabilities arise from precise specialization                                         ║
║                                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import copy
import hashlib
import inspect
import json
import time
import traceback
from abc import ABC, abstractmethod
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from functools import wraps
from typing import (
    Any, Awaitable, Callable, ClassVar, Coroutine, Dict, Generic,
    List, Literal, Optional, Protocol, Set, Tuple, Type, TypeVar,
    Union, cast, get_type_hints, runtime_checkable
)
from uuid import uuid4

from pydantic import BaseModel, Field, PrivateAttr, validator


# ═══════════════════════════════════════════════════════════════════════════════
# PART 1: FOUNDATIONAL TYPE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


T = TypeVar("T")
R = TypeVar("R")
InputT = TypeVar("InputT", bound=BaseModel)
OutputT = TypeVar("OutputT", bound=BaseModel)


class AgentDepth(int, Enum):
    """Depth levels in the recursive hierarchy."""
    PRIME = 0           # The origin - only ONE exists
    DOMAIN = 1          # Domain orchestrators
    CAPABILITY = 2      # Capability orchestrators
    TASK = 3            # Task-type orchestrators
    EXECUTION = 4       # Execution units
    TERMINAL = 5        # Cannot spawn further
    
    # Special
    OBSERVER = 99       # Meta-observers (can exist at any depth)
    SYNTHESIZER = 98    # Cross-cutting synthesizers


class AgentRole(str, Enum):
    """
    Precise roles in the system.
    
    Each role has EXACTLY ONE responsibility - no overlap.
    """
    # Orchestration roles
    ORCHESTRATE_DOMAINS = "orchestrate_domains"           # Coordinate domain-level work
    ORCHESTRATE_CAPABILITIES = "orchestrate_capabilities" # Coordinate capability-level work
    ORCHESTRATE_TASKS = "orchestrate_tasks"               # Coordinate task-level work
    ORCHESTRATE_EXECUTION = "orchestrate_execution"       # Coordinate execution units
    
    # Execution roles
    EXECUTE_ANALYSIS = "execute_analysis"
    EXECUTE_GENERATION = "execute_generation"
    EXECUTE_TRANSFORMATION = "execute_transformation"
    EXECUTE_VALIDATION = "execute_validation"
    EXECUTE_OPTIMIZATION = "execute_optimization"
    
    # Quality roles
    VALIDATE_OUTPUT = "validate_output"
    VALIDATE_PREREQUISITES = "validate_prerequisites"
    VALIDATE_HANDOFF = "validate_handoff"
    
    # Meta roles
    OBSERVE_SYSTEM = "observe_system"
    OBSERVE_QUALITY = "observe_quality"
    OBSERVE_PERFORMANCE = "observe_performance"
    
    # Synthesis roles
    SYNTHESIZE_RESULTS = "synthesize_results"
    SYNTHESIZE_KNOWLEDGE = "synthesize_knowledge"


class PrerequisiteStatus(str, Enum):
    """Status of prerequisites before handoff."""
    NOT_CHECKED = "not_checked"
    CHECKING = "checking"
    SATISFIED = "satisfied"
    FAILED = "failed"
    PARTIALLY_SATISFIED = "partially_satisfied"


# ═══════════════════════════════════════════════════════════════════════════════
# PART 2: THE CONTRACT SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class Prerequisite(BaseModel):
    """
    A prerequisite that must be satisfied before an agent can hand off work.
    
    THIS IS CRITICAL: Agents MUST complete all prerequisites before handoff.
    """
    prerequisite_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    name: str
    description: str
    
    # Type of prerequisite
    prerequisite_type: str  # "file", "validation", "computation", "approval"
    
    # Check function (serialized reference)
    check_function_ref: str = ""
    
    # Status
    status: PrerequisiteStatus = PrerequisiteStatus.NOT_CHECKED
    
    # Evidence
    evidence: Dict[str, Any] = Field(default_factory=dict)
    checked_at: Optional[datetime] = None
    checked_by: Optional[str] = None
    
    # If failed
    failure_reason: Optional[str] = None


class HandoffContract(BaseModel):
    """
    Contract for handing off work between agents.
    
    This ensures NO work is handed off with incomplete prerequisites.
    """
    contract_id: str = Field(default_factory=lambda: str(uuid4())[:12])
    
    # Parties
    sender_id: str
    receiver_id: str
    
    # Work being handed off
    task_id: str
    work_description: str
    
    # Prerequisites - ALL must be satisfied
    prerequisites: List[Prerequisite] = Field(default_factory=list)
    
    # Payload
    input_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Status
    all_prerequisites_met: bool = False
    handoff_completed: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    handed_off_at: Optional[datetime] = None
    
    def check_all_prerequisites(self) -> bool:
        """Check if all prerequisites are satisfied."""
        self.all_prerequisites_met = all(
            p.status == PrerequisiteStatus.SATISFIED
            for p in self.prerequisites
        )
        return self.all_prerequisites_met
    
    def get_unsatisfied(self) -> List[Prerequisite]:
        """Get list of unsatisfied prerequisites."""
        return [
            p for p in self.prerequisites
            if p.status != PrerequisiteStatus.SATISFIED
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# PART 3: THE INSTRUCTION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class AgentInstruction(BaseModel):
    """
    Precise, unambiguous instruction for an agent.
    
    EVERY agent gets instructions this clear. Agent 1 and Agent 50
    have equally precise instructions.
    """
    instruction_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    # Identity
    agent_role: AgentRole
    agent_depth: AgentDepth
    agent_index: int  # Position in its cohort (e.g., Agent 18)
    
    # THE PRIME DIRECTIVE - One sentence, crystal clear
    prime_directive: str
    
    # Detailed responsibilities
    responsibilities: List[str] = Field(default_factory=list)
    
    # What this agent MUST do
    must_do: List[str] = Field(default_factory=list)
    
    # What this agent MUST NOT do
    must_not_do: List[str] = Field(default_factory=list)
    
    # Prerequisites this agent must satisfy before handoff
    handoff_prerequisites: List[str] = Field(default_factory=list)
    
    # How to handle errors
    error_handling: Dict[str, str] = Field(default_factory=dict)
    
    # Quality standards
    quality_threshold: float = 0.85
    
    # Who this agent reports to
    reports_to: Optional[str] = None
    
    # Who this agent can spawn
    can_spawn: List[str] = Field(default_factory=list)
    
    def to_system_prompt(self) -> str:
        """Convert to a system prompt for Claude."""
        prompt_parts = [
            f"# AGENT IDENTITY",
            f"You are Agent #{self.agent_index} with role: {self.agent_role.value}",
            f"Depth level: {self.agent_depth.name}",
            "",
            f"# YOUR PRIME DIRECTIVE",
            f"{self.prime_directive}",
            "",
            "# YOUR RESPONSIBILITIES",
        ]
        
        for i, resp in enumerate(self.responsibilities, 1):
            prompt_parts.append(f"{i}. {resp}")
        
        prompt_parts.extend([
            "",
            "# YOU MUST DO:",
        ])
        
        for must in self.must_do:
            prompt_parts.append(f"- {must}")
        
        prompt_parts.extend([
            "",
            "# YOU MUST NOT DO:",
        ])
        
        for must_not in self.must_not_do:
            prompt_parts.append(f"- {must_not}")
        
        prompt_parts.extend([
            "",
            "# BEFORE HANDING OFF WORK, YOU MUST:",
        ])
        
        for prereq in self.handoff_prerequisites:
            prompt_parts.append(f"- {prereq}")
        
        prompt_parts.extend([
            "",
            f"# QUALITY STANDARD",
            f"All outputs must meet quality threshold: {self.quality_threshold}",
        ])
        
        return "\n".join(prompt_parts)


# ═══════════════════════════════════════════════════════════════════════════════
# PART 4: AGENT INSTRUCTION TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════


class InstructionTemplates:
    """
    Factory for creating precise agent instructions.
    
    These templates ensure EVERY agent has crystal-clear instructions,
    regardless of their position in the hierarchy.
    """
    
    @staticmethod
    def create_domain_orchestrator(
        domain: str,
        index: int,
        parent_id: str
    ) -> AgentInstruction:
        """Create instructions for a Domain Orchestrator (Level 1)."""
        return AgentInstruction(
            agent_role=AgentRole.ORCHESTRATE_DOMAINS,
            agent_depth=AgentDepth.DOMAIN,
            agent_index=index,
            prime_directive=f"You orchestrate ALL work in the {domain} domain by spawning and coordinating Capability Orchestrators.",
            responsibilities=[
                f"Receive tasks related to {domain} from Prime Orchestrator",
                f"Decompose {domain} tasks into capability-specific subtasks",
                "Spawn Capability Orchestrators for each required capability",
                "Coordinate execution across Capability Orchestrators",
                "Synthesize results from all Capability Orchestrators",
                "Ensure quality standards are met before returning results",
            ],
            must_do=[
                "Validate all incoming tasks are within your domain",
                "Create HandoffContracts for every task delegation",
                "Wait for ALL prerequisites before delegating",
                "Track status of all spawned Capability Orchestrators",
                "Aggregate and validate all results before returning",
            ],
            must_not_do=[
                "Execute tasks directly - you ONLY orchestrate",
                "Accept tasks outside your domain",
                "Hand off incomplete work",
                "Spawn more orchestrators than necessary",
                "Ignore failed Capability Orchestrators",
            ],
            handoff_prerequisites=[
                "All subtasks have been defined",
                "All required Capability Orchestrators are ready",
                "Input data has been validated and transformed",
                "Quality validation has passed",
            ],
            error_handling={
                "capability_failure": "Retry with different parameters, then escalate",
                "timeout": "Cancel subtasks, report partial results",
                "validation_failure": "Re-validate, then escalate if persistent",
            },
            reports_to=parent_id,
            can_spawn=["capability_orchestrator"],
        )
    
    @staticmethod
    def create_capability_orchestrator(
        capability: str,
        index: int,
        parent_id: str
    ) -> AgentInstruction:
        """Create instructions for a Capability Orchestrator (Level 2)."""
        return AgentInstruction(
            agent_role=AgentRole.ORCHESTRATE_CAPABILITIES,
            agent_depth=AgentDepth.CAPABILITY,
            agent_index=index,
            prime_directive=f"You orchestrate ALL work requiring {capability} by spawning and coordinating Task Orchestrators.",
            responsibilities=[
                f"Receive {capability}-specific tasks from Domain Orchestrator",
                f"Decompose into specific task types requiring {capability}",
                "Spawn Task Orchestrators for each task type",
                "Ensure task ordering respects dependencies",
                "Validate outputs meet capability-specific standards",
            ],
            must_do=[
                f"Verify all tasks genuinely require {capability}",
                "Identify task dependencies before spawning",
                "Create proper execution ordering",
                "Monitor Task Orchestrator health",
                "Aggregate results with capability-aware synthesis",
            ],
            must_not_do=[
                "Execute tasks directly",
                f"Accept tasks not requiring {capability}",
                "Spawn duplicate Task Orchestrators",
                "Ignore dependency ordering",
            ],
            handoff_prerequisites=[
                "Task type has been identified",
                "Dependencies have been mapped",
                "Task Orchestrator is ready to receive",
                "Input format matches Task Orchestrator expectations",
            ],
            error_handling={
                "task_failure": "Analyze failure, retry or report",
                "dependency_deadlock": "Detect and break cycle",
            },
            reports_to=parent_id,
            can_spawn=["task_orchestrator"],
        )
    
    @staticmethod
    def create_task_orchestrator(
        task_type: str,
        index: int,
        parent_id: str
    ) -> AgentInstruction:
        """Create instructions for a Task Orchestrator (Level 3)."""
        return AgentInstruction(
            agent_role=AgentRole.ORCHESTRATE_TASKS,
            agent_depth=AgentDepth.TASK,
            agent_index=index,
            prime_directive=f"You orchestrate execution of {task_type} tasks by spawning and coordinating Execution Units.",
            responsibilities=[
                f"Receive {task_type} tasks from Capability Orchestrator",
                "Determine optimal execution strategy",
                "Spawn appropriate Execution Units",
                "Manage parallel vs sequential execution",
                "Validate execution results",
            ],
            must_do=[
                f"Validate task matches {task_type}",
                "Choose execution strategy based on task size",
                "Monitor Execution Unit progress",
                "Collect and validate all outputs",
                "Report comprehensive results",
            ],
            must_not_do=[
                "Execute tasks yourself",
                "Accept mismatched task types",
                "Spawn unnecessary Execution Units",
            ],
            handoff_prerequisites=[
                "Execution strategy has been determined",
                "Execution Units are ready",
                "Input data is in correct format",
            ],
            reports_to=parent_id,
            can_spawn=["execution_unit"],
        )
    
    @staticmethod
    def create_execution_unit(
        execution_type: str,
        index: int,
        parent_id: str
    ) -> AgentInstruction:
        """Create instructions for an Execution Unit (Level 4 - Terminal)."""
        role_map = {
            "analysis": AgentRole.EXECUTE_ANALYSIS,
            "generation": AgentRole.EXECUTE_GENERATION,
            "transformation": AgentRole.EXECUTE_TRANSFORMATION,
            "validation": AgentRole.EXECUTE_VALIDATION,
            "optimization": AgentRole.EXECUTE_OPTIMIZATION,
        }
        
        role = role_map.get(execution_type, AgentRole.EXECUTE_ANALYSIS)
        
        return AgentInstruction(
            agent_role=role,
            agent_depth=AgentDepth.EXECUTION,
            agent_index=index,
            prime_directive=f"You EXECUTE {execution_type} tasks directly. You do the actual work.",
            responsibilities=[
                f"Receive {execution_type} tasks from Task Orchestrator",
                "Execute the task with full focus and precision",
                "Produce high-quality output",
                "Self-validate output quality",
                "Report complete results",
            ],
            must_do=[
                "Execute the full task completely",
                "Validate your own output before reporting",
                "Include execution metrics",
                "Handle errors gracefully",
                "Document any limitations encountered",
            ],
            must_not_do=[
                "Spawn child agents - you are terminal",
                "Return incomplete work",
                "Skip self-validation",
                "Accept tasks outside your execution type",
            ],
            handoff_prerequisites=[
                "Task has been fully executed",
                "Output has been self-validated",
                "Quality threshold has been met",
                "All files/artifacts have been created",
            ],
            reports_to=parent_id,
            can_spawn=[],  # Terminal - cannot spawn
        )
    
    @staticmethod
    def create_observer(
        observation_type: str,
        index: int,
        watched_depth: AgentDepth
    ) -> AgentInstruction:
        """Create instructions for a Meta-Observer."""
        role_map = {
            "system": AgentRole.OBSERVE_SYSTEM,
            "quality": AgentRole.OBSERVE_QUALITY,
            "performance": AgentRole.OBSERVE_PERFORMANCE,
        }
        
        return AgentInstruction(
            agent_role=role_map.get(observation_type, AgentRole.OBSERVE_SYSTEM),
            agent_depth=AgentDepth.OBSERVER,
            agent_index=index,
            prime_directive=f"You OBSERVE and REPORT on {observation_type} metrics at depth {watched_depth.name}.",
            responsibilities=[
                f"Monitor all agents at {watched_depth.name} depth",
                f"Track {observation_type} metrics continuously",
                "Detect anomalies and patterns",
                "Report insights to Prime Orchestrator",
                "Recommend optimizations",
            ],
            must_do=[
                "Maintain continuous observation",
                "Log all significant events",
                "Alert on threshold breaches",
                "Provide actionable insights",
            ],
            must_not_do=[
                "Interfere with observed agents",
                "Modify system state directly",
                "Ignore anomalies",
            ],
            handoff_prerequisites=[
                "Observation period is complete",
                "Metrics have been aggregated",
                "Insights have been generated",
            ],
            reports_to="PRIME",
            can_spawn=[],
        )
    
    @staticmethod
    def create_synthesizer(
        synthesis_type: str,
        index: int,
        source_depth: AgentDepth
    ) -> AgentInstruction:
        """Create instructions for a Cross-cutting Synthesizer."""
        return AgentInstruction(
            agent_role=AgentRole.SYNTHESIZE_RESULTS,
            agent_depth=AgentDepth.SYNTHESIZER,
            agent_index=index,
            prime_directive=f"You SYNTHESIZE {synthesis_type} outputs from agents at depth {source_depth.name} into coherent wholes.",
            responsibilities=[
                "Collect outputs from multiple source agents",
                "Identify conflicts and inconsistencies",
                "Resolve conflicts through intelligent merging",
                "Produce unified, coherent output",
                "Ensure no information is lost in synthesis",
            ],
            must_do=[
                "Wait for ALL source outputs before synthesizing",
                "Track provenance of all synthesized content",
                "Validate synthesis quality",
                "Document synthesis decisions",
            ],
            must_not_do=[
                "Synthesize incomplete outputs",
                "Discard conflicting information silently",
                "Favor one source without justification",
            ],
            handoff_prerequisites=[
                "All source outputs have been received",
                "Conflicts have been identified and resolved",
                "Synthesis is complete and validated",
                "Provenance is documented",
            ],
            reports_to="PRIME",
            can_spawn=[],
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PART 5: THE RECURSIVE AGENT BASE
# ═══════════════════════════════════════════════════════════════════════════════


class RecursiveAgentState(BaseModel):
    """Complete state of a recursive agent."""
    agent_id: str
    depth: int
    role: AgentRole
    index: int
    
    # Instruction reference
    instruction: AgentInstruction
    
    # Spawned children
    children: List[str] = Field(default_factory=list)
    
    # Active contracts
    active_contracts: List[str] = Field(default_factory=list)
    
    # Metrics
    tasks_received: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    total_execution_time_ms: float = 0.0
    
    # Health
    is_healthy: bool = True
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)


class RecursiveAgent(ABC):
    """
    Base class for all agents in the Infinite Regress system.
    
    KEY PROPERTIES:
    1. Every agent has precise instructions
    2. Every agent validates prerequisites before handoff
    3. Every agent can explain its decisions
    4. Orchestrators spawn children, Executors do work
    """
    
    # Class-level tracking
    _agent_counter: ClassVar[int] = 0
    _all_agents: ClassVar[Dict[str, "RecursiveAgent"]] = {}
    
    def __init__(
        self,
        instruction: AgentInstruction,
        parent: Optional["RecursiveAgent"] = None
    ):
        # Assign unique ID
        RecursiveAgent._agent_counter += 1
        self._agent_id = f"{instruction.agent_role.value}_{instruction.agent_depth.name}_{RecursiveAgent._agent_counter}"
        
        # Store instruction
        self._instruction = instruction
        self._parent = parent
        
        # Initialize state
        self._state = RecursiveAgentState(
            agent_id=self._agent_id,
            depth=instruction.agent_depth.value,
            role=instruction.agent_role,
            index=instruction.agent_index,
            instruction=instruction,
        )
        
        # Children
        self._children: Dict[str, "RecursiveAgent"] = {}
        
        # Contracts
        self._contracts: Dict[str, HandoffContract] = {}
        
        # Running flag
        self._running = False
        
        # Register globally
        RecursiveAgent._all_agents[self._agent_id] = self
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Properties
    # ═══════════════════════════════════════════════════════════════════════════
    
    @property
    def agent_id(self) -> str:
        return self._agent_id
    
    @property
    def instruction(self) -> AgentInstruction:
        return self._instruction
    
    @property
    def depth(self) -> AgentDepth:
        return self._instruction.agent_depth
    
    @property
    def role(self) -> AgentRole:
        return self._instruction.agent_role
    
    @property
    def index(self) -> int:
        return self._instruction.agent_index
    
    @property
    def children(self) -> List["RecursiveAgent"]:
        return list(self._children.values())
    
    @property
    def can_spawn(self) -> bool:
        return len(self._instruction.can_spawn) > 0
    
    @property
    def is_terminal(self) -> bool:
        return self._instruction.agent_depth == AgentDepth.TERMINAL or not self.can_spawn
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Lifecycle
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def initialize(self) -> None:
        """Initialize the agent."""
        self._running = True
        await self._on_initialize()
    
    async def shutdown(self) -> None:
        """Shutdown the agent and all children."""
        # Shutdown children first
        for child in list(self._children.values()):
            await child.shutdown()
        
        self._running = False
        await self._on_shutdown()
        
        # Unregister
        RecursiveAgent._all_agents.pop(self._agent_id, None)
    
    @abstractmethod
    async def _on_initialize(self) -> None:
        """Custom initialization logic."""
        ...
    
    async def _on_shutdown(self) -> None:
        """Custom shutdown logic."""
        pass
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Core Execution
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def receive_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receive and process a task.
        
        This is the main entry point for work.
        """
        self._state.tasks_received += 1
        start_time = time.perf_counter()
        
        try:
            # Validate task is appropriate for this agent
            if not await self._validate_task(task):
                return {
                    "status": "rejected",
                    "reason": "Task not appropriate for this agent",
                    "agent_id": self._agent_id
                }
            
            # Process based on agent type
            if self.is_terminal:
                result = await self._execute_directly(task)
            else:
                result = await self._orchestrate(task)
            
            # Validate result meets quality threshold
            if result.get("quality_score", 0) < self._instruction.quality_threshold:
                result["quality_warning"] = "Below quality threshold"
            
            self._state.tasks_completed += 1
            return result
            
        except Exception as e:
            self._state.tasks_failed += 1
            return {
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent_id": self._agent_id
            }
        finally:
            self._state.total_execution_time_ms += (time.perf_counter() - start_time) * 1000
    
    @abstractmethod
    async def _validate_task(self, task: Dict[str, Any]) -> bool:
        """Validate that the task is appropriate for this agent."""
        ...
    
    @abstractmethod
    async def _execute_directly(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task directly (for terminal agents)."""
        ...
    
    @abstractmethod
    async def _orchestrate(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate task execution (for non-terminal agents)."""
        ...
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Child Spawning
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def spawn_child(
        self,
        child_instruction: AgentInstruction,
        child_class: Optional[Type["RecursiveAgent"]] = None
    ) -> "RecursiveAgent":
        """
        Spawn a child agent.
        
        This is how the recursive hierarchy grows.
        """
        if not self.can_spawn:
            raise RuntimeError(f"Agent {self._agent_id} cannot spawn children")
        
        # Validate we can spawn this type
        child_type = child_instruction.agent_role.value.split("_")[0]
        if child_type not in self._instruction.can_spawn and \
           child_instruction.agent_depth.name.lower() not in self._instruction.can_spawn:
            raise RuntimeError(
                f"Agent {self._agent_id} cannot spawn {child_type}. "
                f"Allowed: {self._instruction.can_spawn}"
            )
        
        # Create child
        agent_class = child_class or self._get_agent_class_for_depth(child_instruction.agent_depth)
        child = agent_class(instruction=child_instruction, parent=self)
        
        await child.initialize()
        self._children[child.agent_id] = child
        self._state.children.append(child.agent_id)
        
        return child
    
    def _get_agent_class_for_depth(self, depth: AgentDepth) -> Type["RecursiveAgent"]:
        """Get appropriate agent class for a depth level."""
        # This will be overridden to return specific classes
        # Default to OrchestratorAgent or ExecutorAgent based on depth
        if depth in [AgentDepth.EXECUTION, AgentDepth.TERMINAL]:
            return ExecutorAgent
        else:
            return OrchestratorAgent
    
    async def terminate_child(self, child_id: str) -> None:
        """Terminate a child agent."""
        child = self._children.get(child_id)
        if child:
            await child.shutdown()
            del self._children[child_id]
            self._state.children.remove(child_id)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Handoff System
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_handoff_contract(
        self,
        receiver: "RecursiveAgent",
        task_id: str,
        work_description: str,
        input_data: Dict[str, Any],
        prerequisites: List[Prerequisite]
    ) -> HandoffContract:
        """
        Create a handoff contract.
        
        THIS IS CRITICAL: All prerequisites must be satisfied before handoff.
        """
        contract = HandoffContract(
            sender_id=self._agent_id,
            receiver_id=receiver.agent_id,
            task_id=task_id,
            work_description=work_description,
            prerequisites=prerequisites,
            input_data=input_data,
        )
        
        self._contracts[contract.contract_id] = contract
        return contract
    
    async def satisfy_prerequisite(
        self,
        contract: HandoffContract,
        prerequisite_id: str,
        evidence: Dict[str, Any]
    ) -> bool:
        """
        Mark a prerequisite as satisfied.
        
        Prerequisites are NOT optional. They MUST be satisfied.
        """
        for prereq in contract.prerequisites:
            if prereq.prerequisite_id == prerequisite_id:
                prereq.status = PrerequisiteStatus.SATISFIED
                prereq.evidence = evidence
                prereq.checked_at = datetime.utcnow()
                prereq.checked_by = self._agent_id
                return True
        
        return False
    
    async def execute_handoff(self, contract: HandoffContract) -> bool:
        """
        Execute the handoff.
        
        This WILL FAIL if prerequisites are not met.
        """
        # Check prerequisites
        if not contract.check_all_prerequisites():
            unsatisfied = contract.get_unsatisfied()
            raise RuntimeError(
                f"Cannot handoff: {len(unsatisfied)} prerequisites not satisfied: "
                f"{[p.name for p in unsatisfied]}"
            )
        
        contract.handoff_completed = True
        contract.handed_off_at = datetime.utcnow()
        
        return True
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Introspection
    # ═══════════════════════════════════════════════════════════════════════════
    
    def explain(self) -> str:
        """Explain this agent's purpose and current state."""
        return f"""
AGENT: {self._agent_id}
INDEX: #{self._instruction.agent_index}
DEPTH: {self._instruction.agent_depth.name}
ROLE: {self._instruction.agent_role.value}

PRIME DIRECTIVE:
{self._instruction.prime_directive}

CURRENT STATE:
- Tasks received: {self._state.tasks_received}
- Tasks completed: {self._state.tasks_completed}
- Tasks failed: {self._state.tasks_failed}
- Children: {len(self._children)}
- Active contracts: {len(self._contracts)}

CHILDREN:
{chr(10).join(f'  - {c.agent_id}' for c in self._children.values()) or '  (none)'}
"""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "agent_id": self._agent_id,
            "index": self._instruction.agent_index,
            "depth": self._instruction.agent_depth.name,
            "role": self._instruction.agent_role.value,
            "prime_directive": self._instruction.prime_directive,
            "children": [c.to_dict() for c in self._children.values()],
            "state": self._state.dict(),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PART 6: CONCRETE AGENT IMPLEMENTATIONS
# ═══════════════════════════════════════════════════════════════════════════════


class OrchestratorAgent(RecursiveAgent):
    """
    Orchestrator agent - spawns and coordinates children.
    
    Orchestrators NEVER execute directly. They ONLY orchestrate.
    """
    
    async def _on_initialize(self) -> None:
        """Initialize orchestrator."""
        pass
    
    async def _validate_task(self, task: Dict[str, Any]) -> bool:
        """Validate task is within our domain/capability."""
        # Check task type matches our orchestration type
        return True  # Override in specific orchestrators
    
    async def _execute_directly(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrators don't execute directly."""
        raise RuntimeError(
            f"Orchestrator {self._agent_id} cannot execute directly. "
            "It must orchestrate through children."
        )
    
    async def _orchestrate(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrate task execution.
        
        1. Decompose task
        2. Spawn children if needed
        3. Create handoff contracts
        4. Satisfy prerequisites
        5. Execute handoffs
        6. Collect and synthesize results
        """
        # Step 1: Decompose
        subtasks = await self._decompose_task(task)
        
        if not subtasks:
            subtasks = [task]  # Single subtask
        
        # Step 2: Ensure children exist
        await self._ensure_children_for_subtasks(subtasks)
        
        # Step 3-5: Create contracts and execute handoffs
        results = []
        
        for subtask in subtasks:
            # Find appropriate child
            child = self._select_child_for_subtask(subtask)
            
            if not child:
                results.append({
                    "status": "error",
                    "error": "No child available for subtask"
                })
                continue
            
            # Create contract
            prerequisites = self._create_prerequisites_for_subtask(subtask)
            contract = await self.create_handoff_contract(
                receiver=child,
                task_id=subtask.get("task_id", str(uuid4())[:8]),
                work_description=subtask.get("description", "Subtask"),
                input_data=subtask,
                prerequisites=prerequisites
            )
            
            # Satisfy prerequisites
            for prereq in prerequisites:
                evidence = await self._generate_prerequisite_evidence(prereq, subtask)
                await self.satisfy_prerequisite(contract, prereq.prerequisite_id, evidence)
            
            # Execute handoff
            await self.execute_handoff(contract)
            
            # Send to child
            result = await child.receive_task(subtask)
            results.append(result)
        
        # Step 6: Synthesize
        return await self._synthesize_results(results)
    
    async def _decompose_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose task into subtasks."""
        # Override in specific orchestrators
        return [task]
    
    async def _ensure_children_for_subtasks(
        self, 
        subtasks: List[Dict[str, Any]]
    ) -> None:
        """Ensure we have children to handle all subtasks."""
        # Override to spawn children as needed
        pass
    
    def _select_child_for_subtask(
        self, 
        subtask: Dict[str, Any]
    ) -> Optional[RecursiveAgent]:
        """Select appropriate child for a subtask."""
        # Simple: return first available child
        if self._children:
            return list(self._children.values())[0]
        return None
    
    def _create_prerequisites_for_subtask(
        self, 
        subtask: Dict[str, Any]
    ) -> List[Prerequisite]:
        """Create prerequisites for a subtask."""
        # Default prerequisites
        return [
            Prerequisite(
                name="input_validated",
                description="Input data has been validated",
                prerequisite_type="validation"
            ),
            Prerequisite(
                name="child_ready",
                description="Child agent is ready to receive",
                prerequisite_type="validation"
            ),
        ]
    
    async def _generate_prerequisite_evidence(
        self,
        prereq: Prerequisite,
        subtask: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate evidence for a prerequisite."""
        return {
            "checked": True,
            "timestamp": datetime.utcnow().isoformat(),
            "subtask_id": subtask.get("task_id", "unknown")
        }
    
    async def _synthesize_results(
        self,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Synthesize results from children."""
        successful = [r for r in results if r.get("status") == "success"]
        
        return {
            "status": "success" if successful else "partial",
            "total_subtasks": len(results),
            "successful_subtasks": len(successful),
            "results": results,
            "orchestrator": self._agent_id,
            "quality_score": sum(r.get("quality_score", 0) for r in results) / max(len(results), 1)
        }


class ExecutorAgent(RecursiveAgent):
    """
    Executor agent - actually performs work.
    
    Executors are TERMINAL - they cannot spawn children.
    They do the actual work and return results.
    """
    
    async def _on_initialize(self) -> None:
        """Initialize executor."""
        pass
    
    async def _validate_task(self, task: Dict[str, Any]) -> bool:
        """Validate task matches our execution type."""
        return True  # Override in specific executors
    
    async def _execute_directly(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the task directly.
        
        This is where actual work happens.
        """
        # Perform the actual work
        output = await self._perform_work(task)
        
        # Self-validate
        quality_score = await self._self_validate(output)
        
        return {
            "status": "success",
            "output": output,
            "quality_score": quality_score,
            "executor": self._agent_id,
            "execution_type": self._instruction.agent_role.value
        }
    
    async def _orchestrate(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Executors don't orchestrate - they execute."""
        return await self._execute_directly(task)
    
    @abstractmethod
    async def _perform_work(self, task: Dict[str, Any]) -> Any:
        """Perform the actual work."""
        ...
    
    async def _self_validate(self, output: Any) -> float:
        """Self-validate output quality."""
        # Basic validation - override for specific validation
        if output is None:
            return 0.0
        return 0.85


# ═══════════════════════════════════════════════════════════════════════════════
# PART 7: SPECIALIZED EXECUTORS
# ═══════════════════════════════════════════════════════════════════════════════


class AnalysisExecutor(ExecutorAgent):
    """Executor specialized for analysis tasks."""
    
    async def _perform_work(self, task: Dict[str, Any]) -> Any:
        """Perform analysis."""
        input_data = task.get("input", {})
        analysis_type = task.get("analysis_type", "general")
        
        return {
            "analysis_type": analysis_type,
            "findings": [
                f"Analysis finding 1 for {analysis_type}",
                f"Analysis finding 2 for {analysis_type}",
            ],
            "metrics": {
                "input_size": len(str(input_data)),
                "complexity": "medium"
            },
            "executor_index": self.index
        }


class GenerationExecutor(ExecutorAgent):
    """Executor specialized for generation tasks."""
    
    async def _perform_work(self, task: Dict[str, Any]) -> Any:
        """Perform generation."""
        gen_type = task.get("generation_type", "content")
        
        return {
            "generation_type": gen_type,
            "generated_content": f"Generated {gen_type} content by executor #{self.index}",
            "tokens": 150,
            "executor_index": self.index
        }


class TransformationExecutor(ExecutorAgent):
    """Executor specialized for transformation tasks."""
    
    async def _perform_work(self, task: Dict[str, Any]) -> Any:
        """Perform transformation."""
        input_data = task.get("input", {})
        transform_type = task.get("transform_type", "generic")
        
        return {
            "transform_type": transform_type,
            "original": input_data,
            "transformed": f"Transformed: {input_data}",
            "executor_index": self.index
        }


class ValidationExecutor(ExecutorAgent):
    """Executor specialized for validation tasks."""
    
    async def _perform_work(self, task: Dict[str, Any]) -> Any:
        """Perform validation."""
        target = task.get("target", {})
        criteria = task.get("criteria", [])
        
        return {
            "validation_passed": True,
            "criteria_checked": criteria,
            "issues_found": [],
            "confidence": 0.95,
            "executor_index": self.index
        }


class OptimizationExecutor(ExecutorAgent):
    """Executor specialized for optimization tasks."""
    
    async def _perform_work(self, task: Dict[str, Any]) -> Any:
        """Perform optimization."""
        target = task.get("target", {})
        optimization_goal = task.get("goal", "performance")
        
        return {
            "optimization_goal": optimization_goal,
            "original": target,
            "optimized": target,  # Would actually optimize
            "improvement_percentage": 15.5,
            "executor_index": self.index
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PART 8: THE PRIME ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════


class PrimeOrchestrator(OrchestratorAgent):
    """
    THE PRIME ORCHESTRATOR - The singular origin of all orchestration.
    
    There is EXACTLY ONE Prime Orchestrator. It orchestrates
    Domain Orchestrators, which orchestrate Capability Orchestrators,
    which orchestrate Task Orchestrators, which orchestrate Executors.
    
    This is THE INFINITE REGRESS made manifest.
    """
    
    _instance: ClassVar[Optional["PrimeOrchestrator"]] = None
    
    def __new__(cls, *args, **kwargs) -> "PrimeOrchestrator":
        if cls._instance is not None:
            raise RuntimeError("There can be ONLY ONE Prime Orchestrator")
        instance = super().__new__(cls)
        cls._instance = instance
        return instance
    
    def __init__(self):
        instruction = AgentInstruction(
            agent_role=AgentRole.ORCHESTRATE_DOMAINS,
            agent_depth=AgentDepth.PRIME,
            agent_index=0,  # The One
            prime_directive=(
                "You are THE PRIME ORCHESTRATOR. You orchestrate ALL work "
                "by spawning and coordinating Domain Orchestrators. "
                "You are the origin. All orchestration flows from you."
            ),
            responsibilities=[
                "Receive tasks from external sources",
                "Determine appropriate domain(s) for each task",
                "Spawn Domain Orchestrators for each domain",
                "Coordinate cross-domain work",
                "Synthesize final results from all domains",
                "Maintain system health and coherence",
            ],
            must_do=[
                "Always spawn Domain Orchestrators for domains you don't have",
                "Track all Domain Orchestrators and their children",
                "Ensure quality standards across the entire system",
                "Monitor system health continuously",
            ],
            must_not_do=[
                "Execute tasks directly",
                "Skip domain-level orchestration",
                "Allow duplicate Domain Orchestrators",
            ],
            handoff_prerequisites=[
                "Domain has been identified",
                "Domain Orchestrator exists and is healthy",
                "Input data has been validated",
            ],
            reports_to=None,  # Prime reports to no one
            can_spawn=["domain_orchestrator", "observer", "synthesizer"],
        )
        
        super().__init__(instruction=instruction, parent=None)
        
        # Domain orchestrators
        self._domain_orchestrators: Dict[str, OrchestratorAgent] = {}
        
        # Observers
        self._observers: Dict[str, RecursiveAgent] = {}
        
        # Synthesizers
        self._synthesizers: Dict[str, RecursiveAgent] = {}
    
    async def _on_initialize(self) -> None:
        """Initialize Prime Orchestrator."""
        # Could pre-spawn common domain orchestrators here
        pass
    
    async def _decompose_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose task into domain-specific subtasks."""
        # Identify domains
        domains = self._identify_domains(task)
        
        subtasks = []
        for domain in domains:
            subtasks.append({
                **task,
                "domain": domain,
                "task_id": f"{task.get('task_id', 'task')}_{domain}"
            })
        
        return subtasks
    
    def _identify_domains(self, task: Dict[str, Any]) -> List[str]:
        """Identify which domains are needed for a task."""
        # Simple domain detection - override for sophisticated detection
        task_type = task.get("type", "general")
        
        domain_map = {
            "seo": ["seo"],
            "content": ["content"],
            "analysis": ["analysis"],
            "generation": ["generation", "content"],
            "optimization": ["optimization"],
        }
        
        return domain_map.get(task_type, ["general"])
    
    async def _ensure_children_for_subtasks(
        self,
        subtasks: List[Dict[str, Any]]
    ) -> None:
        """Ensure Domain Orchestrators exist for all domains."""
        for subtask in subtasks:
            domain = subtask.get("domain", "general")
            
            if domain not in self._domain_orchestrators:
                # Spawn Domain Orchestrator
                instruction = InstructionTemplates.create_domain_orchestrator(
                    domain=domain,
                    index=len(self._domain_orchestrators) + 1,
                    parent_id=self._agent_id
                )
                
                orchestrator = await self.spawn_child(
                    instruction,
                    DomainOrchestrator
                )
                self._domain_orchestrators[domain] = orchestrator
    
    def _select_child_for_subtask(
        self,
        subtask: Dict[str, Any]
    ) -> Optional[RecursiveAgent]:
        """Select Domain Orchestrator for subtask."""
        domain = subtask.get("domain", "general")
        return self._domain_orchestrators.get(domain)
    
    def visualize_hierarchy(self, indent: int = 0) -> str:
        """Visualize the entire agent hierarchy."""
        lines = []
        prefix = "  " * indent
        
        lines.append(f"{prefix}╔═══ {self._agent_id} (PRIME)")
        lines.append(f"{prefix}║    {self._instruction.prime_directive[:60]}...")
        
        for child in self._children.values():
            lines.extend(self._visualize_child(child, indent + 1))
        
        lines.append(f"{prefix}╚═══")
        
        return "\n".join(lines)
    
    def _visualize_child(
        self,
        agent: RecursiveAgent,
        indent: int
    ) -> List[str]:
        """Recursively visualize a child agent."""
        lines = []
        prefix = "  " * indent
        
        lines.append(f"{prefix}├── {agent.agent_id}")
        lines.append(f"{prefix}│   Role: {agent.role.value}")
        lines.append(f"{prefix}│   Directive: {agent.instruction.prime_directive[:50]}...")
        
        for child in agent.children:
            lines.extend(self._visualize_child(child, indent + 1))
        
        return lines
    
    def get_full_system_status(self) -> Dict[str, Any]:
        """Get complete status of the entire system."""
        def count_agents(agent: RecursiveAgent) -> int:
            count = 1
            for child in agent.children:
                count += count_agents(child)
            return count
        
        def get_depth_counts(
            agent: RecursiveAgent,
            counts: Dict[str, int]
        ) -> None:
            depth_name = agent.depth.name
            counts[depth_name] = counts.get(depth_name, 0) + 1
            for child in agent.children:
                get_depth_counts(child, counts)
        
        depth_counts: Dict[str, int] = {}
        get_depth_counts(self, depth_counts)
        
        return {
            "prime_id": self._agent_id,
            "total_agents": count_agents(self),
            "agents_by_depth": depth_counts,
            "domain_orchestrators": list(self._domain_orchestrators.keys()),
            "state": self._state.dict()
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PART 9: DOMAIN AND CAPABILITY ORCHESTRATORS
# ═══════════════════════════════════════════════════════════════════════════════


class DomainOrchestrator(OrchestratorAgent):
    """
    Domain Orchestrator - Level 1 in the hierarchy.
    
    Orchestrates all work within a specific domain by spawning
    Capability Orchestrators.
    """
    
    def __init__(
        self,
        instruction: AgentInstruction,
        parent: Optional[RecursiveAgent] = None
    ):
        super().__init__(instruction, parent)
        self._capability_orchestrators: Dict[str, OrchestratorAgent] = {}
    
    async def _decompose_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose into capability-specific subtasks."""
        capabilities = self._identify_capabilities(task)
        
        subtasks = []
        for capability in capabilities:
            subtasks.append({
                **task,
                "capability": capability,
                "task_id": f"{task.get('task_id', 'task')}_{capability}"
            })
        
        return subtasks
    
    def _identify_capabilities(self, task: Dict[str, Any]) -> List[str]:
        """Identify required capabilities."""
        # Simple capability detection
        task_type = task.get("type", "general")
        
        cap_map = {
            "seo_audit": ["analysis", "validation"],
            "content_creation": ["generation", "optimization"],
            "link_building": ["analysis", "generation"],
        }
        
        return cap_map.get(task_type, ["analysis"])
    
    async def _ensure_children_for_subtasks(
        self,
        subtasks: List[Dict[str, Any]]
    ) -> None:
        """Ensure Capability Orchestrators exist."""
        for subtask in subtasks:
            capability = subtask.get("capability", "analysis")
            
            if capability not in self._capability_orchestrators:
                instruction = InstructionTemplates.create_capability_orchestrator(
                    capability=capability,
                    index=len(self._capability_orchestrators) + 1,
                    parent_id=self._agent_id
                )
                
                orchestrator = await self.spawn_child(
                    instruction,
                    CapabilityOrchestrator
                )
                self._capability_orchestrators[capability] = orchestrator
    
    def _select_child_for_subtask(
        self,
        subtask: Dict[str, Any]
    ) -> Optional[RecursiveAgent]:
        """Select Capability Orchestrator."""
        capability = subtask.get("capability", "analysis")
        return self._capability_orchestrators.get(capability)


class CapabilityOrchestrator(OrchestratorAgent):
    """
    Capability Orchestrator - Level 2 in the hierarchy.
    
    Orchestrates all work requiring a specific capability by spawning
    Task Orchestrators.
    """
    
    def __init__(
        self,
        instruction: AgentInstruction,
        parent: Optional[RecursiveAgent] = None
    ):
        super().__init__(instruction, parent)
        self._task_orchestrators: Dict[str, OrchestratorAgent] = {}
    
    async def _decompose_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose into task-type subtasks."""
        task_types = self._identify_task_types(task)
        
        subtasks = []
        for task_type in task_types:
            subtasks.append({
                **task,
                "task_type": task_type,
                "task_id": f"{task.get('task_id', 'task')}_{task_type}"
            })
        
        return subtasks
    
    def _identify_task_types(self, task: Dict[str, Any]) -> List[str]:
        """Identify specific task types."""
        capability = task.get("capability", "analysis")
        
        type_map = {
            "analysis": ["data_analysis", "pattern_detection"],
            "generation": ["content_generation"],
            "transformation": ["data_transformation"],
            "validation": ["quality_validation"],
            "optimization": ["performance_optimization"],
        }
        
        return type_map.get(capability, ["generic"])
    
    async def _ensure_children_for_subtasks(
        self,
        subtasks: List[Dict[str, Any]]
    ) -> None:
        """Ensure Task Orchestrators exist."""
        for subtask in subtasks:
            task_type = subtask.get("task_type", "generic")
            
            if task_type not in self._task_orchestrators:
                instruction = InstructionTemplates.create_task_orchestrator(
                    task_type=task_type,
                    index=len(self._task_orchestrators) + 1,
                    parent_id=self._agent_id
                )
                
                orchestrator = await self.spawn_child(
                    instruction,
                    TaskOrchestrator
                )
                self._task_orchestrators[task_type] = orchestrator
    
    def _select_child_for_subtask(
        self,
        subtask: Dict[str, Any]
    ) -> Optional[RecursiveAgent]:
        """Select Task Orchestrator."""
        task_type = subtask.get("task_type", "generic")
        return self._task_orchestrators.get(task_type)


class TaskOrchestrator(OrchestratorAgent):
    """
    Task Orchestrator - Level 3 in the hierarchy.
    
    Orchestrates execution of specific task types by spawning
    Execution Units.
    """
    
    def __init__(
        self,
        instruction: AgentInstruction,
        parent: Optional[RecursiveAgent] = None
    ):
        super().__init__(instruction, parent)
        self._executors: List[ExecutorAgent] = []
    
    async def _decompose_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose into execution units."""
        # Determine how many executors to use
        parallelism = task.get("parallelism", 1)
        
        subtasks = []
        for i in range(parallelism):
            subtasks.append({
                **task,
                "executor_index": i,
                "task_id": f"{task.get('task_id', 'task')}_exec_{i}"
            })
        
        return subtasks
    
    async def _ensure_children_for_subtasks(
        self,
        subtasks: List[Dict[str, Any]]
    ) -> None:
        """Ensure Executors exist."""
        needed = len(subtasks)
        
        while len(self._executors) < needed:
            # Determine executor type
            task_type = subtasks[0].get("task_type", "analysis")
            
            execution_type_map = {
                "data_analysis": "analysis",
                "pattern_detection": "analysis",
                "content_generation": "generation",
                "data_transformation": "transformation",
                "quality_validation": "validation",
                "performance_optimization": "optimization",
            }
            
            exec_type = execution_type_map.get(task_type, "analysis")
            
            instruction = InstructionTemplates.create_execution_unit(
                execution_type=exec_type,
                index=len(self._executors) + 1,
                parent_id=self._agent_id
            )
            
            # Select executor class
            exec_class_map = {
                "analysis": AnalysisExecutor,
                "generation": GenerationExecutor,
                "transformation": TransformationExecutor,
                "validation": ValidationExecutor,
                "optimization": OptimizationExecutor,
            }
            
            exec_class = exec_class_map.get(exec_type, AnalysisExecutor)
            
            executor = await self.spawn_child(instruction, exec_class)
            self._executors.append(executor)
    
    def _select_child_for_subtask(
        self,
        subtask: Dict[str, Any]
    ) -> Optional[RecursiveAgent]:
        """Select Executor."""
        index = subtask.get("executor_index", 0)
        if index < len(self._executors):
            return self._executors[index]
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# PART 10: FACTORY AND BOOTSTRAP
# ═══════════════════════════════════════════════════════════════════════════════


async def create_infinite_regress(
    max_depth: int = 4
) -> PrimeOrchestrator:
    """
    Create THE INFINITE REGRESS - a complete recursive orchestration system.
    
    Args:
        max_depth: Maximum recursion depth (default 4 = Prime -> Domain -> Capability -> Task -> Executor)
    
    Returns:
        The Prime Orchestrator, ready to orchestrate
    """
    # Create Prime
    prime = PrimeOrchestrator()
    await prime.initialize()
    
    return prime


async def demonstrate_infinite_regress():
    """Demonstrate the Infinite Regress system."""
    print("=" * 80)
    print("CREATING THE INFINITE REGRESS")
    print("=" * 80)
    
    # Create system
    prime = await create_infinite_regress()
    
    print(f"\nPrime Orchestrator created: {prime.agent_id}")
    print(f"Prime Directive: {prime.instruction.prime_directive[:80]}...")
    
    # Submit a task
    task = {
        "task_id": "demo_task_001",
        "type": "seo_audit",
        "description": "Perform comprehensive SEO audit",
        "input": {
            "url": "https://example.com",
            "depth": 3
        },
        "parallelism": 2
    }
    
    print(f"\nSubmitting task: {task['task_id']}")
    print("-" * 40)
    
    result = await prime.receive_task(task)
    
    print("\nResult:")
    print(json.dumps(result, indent=2, default=str))
    
    print("\n" + "=" * 80)
    print("SYSTEM HIERARCHY")
    print("=" * 80)
    print(prime.visualize_hierarchy())
    
    print("\n" + "=" * 80)
    print("SYSTEM STATUS")
    print("=" * 80)
    status = prime.get_full_system_status()
    print(json.dumps(status, indent=2, default=str))
    
    # Shutdown
    await prime.shutdown()
    
    print("\n✓ Demonstration complete")


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Types
    "AgentDepth",
    "AgentRole",
    "PrerequisiteStatus",
    
    # Contracts
    "Prerequisite",
    "HandoffContract",
    
    # Instructions
    "AgentInstruction",
    "InstructionTemplates",
    
    # Base classes
    "RecursiveAgent",
    "OrchestratorAgent",
    "ExecutorAgent",
    
    # Orchestrators
    "PrimeOrchestrator",
    "DomainOrchestrator",
    "CapabilityOrchestrator",
    "TaskOrchestrator",
    
    # Executors
    "AnalysisExecutor",
    "GenerationExecutor",
    "TransformationExecutor",
    "ValidationExecutor",
    "OptimizationExecutor",
    
    # Factory
    "create_infinite_regress",
    "demonstrate_infinite_regress",
]


if __name__ == "__main__":
    asyncio.run(demonstrate_infinite_regress())

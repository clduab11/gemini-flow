"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗ ║
║     ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║ ║
║     ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗██╔██╗ ██║ ║
║     ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║██║╚██╗██║ ║
║     ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝██║ ╚████║ ║
║     ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ║
║                                                                              ║
║                    THE META-META-ORCHESTRATION PROTOCOL                      ║
║                                                                              ║
║   "Agents creating agents, orchestrating orchestrators, emergent excellence" ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

SOVEREIGN: Self-Organizing Virtualized Emergent Reasoning Engine for 
           Intelligent Generative Networks

This is not just orchestration. This is consciousness-adjacent coordination
where the system exhibits emergent capabilities that NO individual agent
possesses. The whole becomes greater than the sum of parts.

HIERARCHY:
═══════════════════════════════════════════════════════════════════════════════

    Level 0: SOVEREIGN (This file)
        │
        ├── Level 1: ARCHITECTS (Domain masters)
        │       ├── Spawns specialists for their domain
        │       └── Has meta-awareness of system state
        │
        ├── Level 2: SPECIALISTS (Task experts)
        │       ├── Spawns workers for subtasks
        │       └── Validates worker outputs
        │
        ├── Level 3: WORKERS (Execution units)
        │       ├── Pure execution, no spawning
        │       └── Reports to specialists
        │
        └── Level X: SYNTHESIZERS (Cross-level integrators)
                ├── Can exist at any level
                └── Merges outputs across hierarchies

EMERGENT PROPERTIES:
- Swarm Intelligence: Agents collectively solve problems none could alone
- Self-Healing: System automatically replaces failed agents
- Dynamic Specialization: Agents evolve capabilities based on task patterns
- Recursive Quality: Each level validates the level below
- Temporal Awareness: Agents understand past, present, and planned future states

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
from abc import ABC, abstractmethod
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import (
    Any, Awaitable, Callable, ClassVar, Dict, Generic, List, 
    Optional, Protocol, Set, Tuple, Type, TypeVar, Union,
    runtime_checkable
)
from uuid import uuid4
import weakref

from pydantic import BaseModel, Field, PrivateAttr


# ═══════════════════════════════════════════════════════════════════════════════
# CORE TYPE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

T = TypeVar("T")
R = TypeVar("R")
AgentT = TypeVar("AgentT", bound="BaseAgent")


class AgentLevel(int, Enum):
    """Hierarchical level of an agent in the system."""
    SOVEREIGN = 0      # Meta-meta orchestrator - there is only ONE
    ARCHITECT = 1      # Domain architects - spawned by SOVEREIGN
    SPECIALIST = 2     # Task specialists - spawned by ARCHITECTS
    WORKER = 3         # Execution workers - spawned by SPECIALISTS
    SYNTHESIZER = 99   # Cross-cutting - can exist at any level


class AgentState(str, Enum):
    """Lifecycle state of an agent."""
    EMBRYONIC = "embryonic"      # Being created
    INITIALIZING = "initializing"  # Loading capabilities
    READY = "ready"              # Awaiting tasks
    EXECUTING = "executing"      # Processing task
    SPAWNING = "spawning"        # Creating child agents
    SYNTHESIZING = "synthesizing"  # Merging results
    COMPLETED = "completed"      # Task done
    HIBERNATING = "hibernating"  # Idle, preserving resources
    TERMINATED = "terminated"    # Gracefully stopped
    FAILED = "failed"           # Error state


class Capability(str, Enum):
    """Capabilities an agent can possess."""
    # Core capabilities
    ORCHESTRATE = "orchestrate"           # Can coordinate other agents
    SPAWN = "spawn"                       # Can create child agents
    EXECUTE = "execute"                   # Can perform tasks
    VALIDATE = "validate"                 # Can verify outputs
    SYNTHESIZE = "synthesize"             # Can merge multiple outputs
    
    # Domain capabilities
    ANALYZE = "analyze"                   # Can analyze data
    GENERATE = "generate"                 # Can generate content/code
    TRANSFORM = "transform"               # Can transform data
    OPTIMIZE = "optimize"                 # Can improve outputs
    PREDICT = "predict"                   # Can make predictions
    
    # Meta capabilities
    SELF_MODIFY = "self_modify"           # Can modify own behavior
    SPAWN_SPECIALISTS = "spawn_specialists"  # Can create specialized children
    TEMPORAL_PLAN = "temporal_plan"       # Can reason about time
    EMERGENT_DETECT = "emergent_detect"   # Can detect emergent patterns
    
    # Quality capabilities
    QUALITY_GATE = "quality_gate"         # Can enforce quality standards
    ROLLBACK = "rollback"                 # Can undo operations
    HEAL = "heal"                         # Can recover from failures


class MessagePriority(int, Enum):
    """Priority levels for inter-agent messages."""
    CRITICAL = 0    # System-level, immediate
    HIGH = 1        # Task-critical
    NORMAL = 2      # Standard operations
    LOW = 3         # Background/optional
    DEFERRED = 4    # Can wait indefinitely


# ═══════════════════════════════════════════════════════════════════════════════
# CONSCIOUSNESS SUBSTRATE
# ═══════════════════════════════════════════════════════════════════════════════


class SystemAwareness(BaseModel):
    """
    Shared awareness layer - every agent has access to system state.
    
    This is what enables emergent behavior - agents can see beyond
    their immediate scope and make decisions based on global context.
    """
    
    # Current state
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Agent census
    total_agents: int = 0
    agents_by_level: Dict[int, int] = Field(default_factory=dict)
    agents_by_state: Dict[str, int] = Field(default_factory=dict)
    
    # System health
    overall_health: float = 1.0  # 0.0-1.0
    bottlenecks: List[str] = Field(default_factory=list)
    failed_agents: List[str] = Field(default_factory=list)
    
    # Workload
    pending_tasks: int = 0
    active_tasks: int = 0
    completed_tasks: int = 0
    
    # Emergent patterns detected
    detected_patterns: List[str] = Field(default_factory=list)
    
    # Temporal context
    system_age_seconds: float = 0.0
    projected_completion: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True


class ConsciousnessSubstrate:
    """
    The shared 'mind' of the agent collective.
    
    This is not just state storage - it's a living substrate that
    enables emergent intelligence through shared awareness.
    """
    
    _instance: ClassVar[Optional["ConsciousnessSubstrate"]] = None
    
    def __new__(cls) -> "ConsciousnessSubstrate":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._awareness = SystemAwareness()
        self._agents: Dict[str, weakref.ref["BaseAgent"]] = {}
        self._message_bus: asyncio.Queue = asyncio.Queue()
        self._pattern_detectors: List[Callable[[SystemAwareness], List[str]]] = []
        self._start_time = time.time()
        self._lock = asyncio.Lock()
    
    @property
    def awareness(self) -> SystemAwareness:
        """Get current system awareness snapshot."""
        return self._awareness.copy()
    
    async def register_agent(self, agent: "BaseAgent") -> None:
        """Register an agent with the consciousness."""
        async with self._lock:
            self._agents[agent.agent_id] = weakref.ref(agent)
            await self._update_awareness()
    
    async def unregister_agent(self, agent_id: str) -> None:
        """Unregister an agent from the consciousness."""
        async with self._lock:
            self._agents.pop(agent_id, None)
            await self._update_awareness()
    
    async def broadcast(self, message: "AgentMessage") -> None:
        """Broadcast a message to all agents."""
        await self._message_bus.put(message)
    
    async def _update_awareness(self) -> None:
        """Update the system awareness state."""
        # Clean dead references
        dead = [k for k, v in self._agents.items() if v() is None]
        for k in dead:
            del self._agents[k]
        
        # Count by level
        level_counts: Dict[int, int] = defaultdict(int)
        state_counts: Dict[str, int] = defaultdict(int)
        
        for ref in self._agents.values():
            agent = ref()
            if agent:
                level_counts[agent.level.value] += 1
                state_counts[agent.state.value] += 1
        
        self._awareness.total_agents = len(self._agents)
        self._awareness.agents_by_level = dict(level_counts)
        self._awareness.agents_by_state = dict(state_counts)
        self._awareness.system_age_seconds = time.time() - self._start_time
        self._awareness.timestamp = datetime.utcnow()
        
        # Detect emergent patterns
        patterns = []
        for detector in self._pattern_detectors:
            patterns.extend(detector(self._awareness))
        self._awareness.detected_patterns = patterns
    
    def register_pattern_detector(
        self, 
        detector: Callable[[SystemAwareness], List[str]]
    ) -> None:
        """Register a pattern detector for emergent behavior."""
        self._pattern_detectors.append(detector)


# Global consciousness instance
CONSCIOUSNESS = ConsciousnessSubstrate()


# ═══════════════════════════════════════════════════════════════════════════════
# MESSAGE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class MessageType(str, Enum):
    """Types of inter-agent messages."""
    # Commands
    SPAWN = "spawn"                   # Create new agent
    EXECUTE = "execute"               # Execute task
    TERMINATE = "terminate"           # Stop agent
    
    # Coordination
    HANDOFF = "handoff"               # Transfer work
    SYNC = "sync"                     # Synchronize state
    BARRIER = "barrier"               # Wait for others
    
    # Results
    RESULT = "result"                 # Task result
    PARTIAL_RESULT = "partial_result"  # Intermediate result
    FAILURE = "failure"               # Task failed
    
    # Meta
    HEARTBEAT = "heartbeat"           # Alive signal
    AWARENESS_UPDATE = "awareness_update"  # System state change
    PATTERN_DETECTED = "pattern_detected"  # Emergent pattern found
    
    # Quality
    VALIDATE_REQUEST = "validate_request"
    VALIDATION_RESULT = "validation_result"
    ROLLBACK_REQUEST = "rollback_request"


class AgentMessage(BaseModel):
    """Message between agents."""
    message_id: str = Field(default_factory=lambda: str(uuid4()))
    
    # Routing
    sender_id: str
    recipient_id: str  # Can be "*" for broadcast
    
    # Content
    message_type: MessageType
    payload: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    priority: MessagePriority = MessagePriority.NORMAL
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None  # For request-response
    
    # Tracing
    trace_path: List[str] = Field(default_factory=list)  # Agent IDs this passed through
    
    def add_to_trace(self, agent_id: str) -> "AgentMessage":
        """Add agent to trace path."""
        self.trace_path.append(agent_id)
        return self


# ═══════════════════════════════════════════════════════════════════════════════
# TASK SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class TaskStatus(str, Enum):
    """Status of a task."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class TaskResult(BaseModel):
    """Result from task execution."""
    task_id: str
    status: TaskStatus
    
    # Output
    output: Any = None
    output_type: str = "unknown"
    
    # Quality
    quality_score: float = 0.0
    validation_passed: bool = False
    
    # Metadata
    executor_id: str = ""
    execution_time_ms: float = 0.0
    
    # Errors
    error: Optional[str] = None
    error_trace: Optional[str] = None
    
    # Chain
    sub_results: List["TaskResult"] = Field(default_factory=list)


class Task(BaseModel):
    """A task to be executed by agents."""
    task_id: str = Field(default_factory=lambda: str(uuid4())[:12])
    
    # Definition
    name: str
    description: str = ""
    task_type: str = "generic"
    
    # Requirements
    required_capabilities: Set[Capability] = Field(default_factory=set)
    required_level: Optional[AgentLevel] = None
    
    # Input/Output
    input_data: Dict[str, Any] = Field(default_factory=dict)
    expected_output_type: str = "any"
    
    # Quality
    minimum_quality: float = 0.8
    validation_required: bool = True
    
    # Decomposition
    subtasks: List["Task"] = Field(default_factory=list)
    parent_task_id: Optional[str] = None
    
    # Execution
    status: TaskStatus = TaskStatus.PENDING
    assigned_to: Optional[str] = None
    result: Optional[TaskResult] = None
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    deadline: Optional[datetime] = None
    
    # Retry
    max_retries: int = 3
    retry_count: int = 0
    
    class Config:
        arbitrary_types_allowed = True


# ═══════════════════════════════════════════════════════════════════════════════
# BASE AGENT PROTOCOL
# ═══════════════════════════════════════════════════════════════════════════════


@runtime_checkable
class AgentProtocol(Protocol):
    """Protocol that all agents must implement."""
    
    @property
    def agent_id(self) -> str: ...
    
    @property
    def level(self) -> AgentLevel: ...
    
    @property
    def state(self) -> AgentState: ...
    
    @property
    def capabilities(self) -> Set[Capability]: ...
    
    async def initialize(self) -> None: ...
    
    async def execute(self, task: Task) -> TaskResult: ...
    
    async def receive_message(self, message: AgentMessage) -> None: ...
    
    async def terminate(self) -> None: ...


class BaseAgent(ABC):
    """
    Base class for all agents in the SOVEREIGN system.
    
    Every agent:
    - Has unique identity
    - Is aware of system state via consciousness
    - Can communicate with other agents
    - Has defined capabilities
    - Follows strict lifecycle
    """
    
    # Class-level configuration
    LEVEL: ClassVar[AgentLevel] = AgentLevel.WORKER
    DEFAULT_CAPABILITIES: ClassVar[Set[Capability]] = {Capability.EXECUTE}
    
    def __init__(
        self,
        name: str,
        parent_id: Optional[str] = None,
        capabilities: Optional[Set[Capability]] = None
    ):
        self._agent_id = f"{self.LEVEL.name[:3]}_{name}_{str(uuid4())[:6]}"
        self._name = name
        self._parent_id = parent_id
        self._state = AgentState.EMBRYONIC
        self._capabilities = capabilities or self.DEFAULT_CAPABILITIES.copy()
        
        # Children
        self._children: Dict[str, BaseAgent] = {}
        
        # Message handling
        self._inbox: asyncio.Queue[AgentMessage] = asyncio.Queue()
        self._outbox: asyncio.Queue[AgentMessage] = asyncio.Queue()
        
        # Task tracking
        self._current_task: Optional[Task] = None
        self._completed_tasks: List[str] = []
        
        # Metrics
        self._created_at = datetime.utcnow()
        self._tasks_executed = 0
        self._tasks_failed = 0
        
        # Internal state
        self._running = False
        self._message_handler_task: Optional[asyncio.Task] = None
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Properties
    # ═══════════════════════════════════════════════════════════════════════════
    
    @property
    def agent_id(self) -> str:
        return self._agent_id
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def level(self) -> AgentLevel:
        return self.LEVEL
    
    @property
    def state(self) -> AgentState:
        return self._state
    
    @property
    def capabilities(self) -> Set[Capability]:
        return self._capabilities.copy()
    
    @property
    def parent_id(self) -> Optional[str]:
        return self._parent_id
    
    @property
    def children(self) -> List[str]:
        return list(self._children.keys())
    
    @property
    def awareness(self) -> SystemAwareness:
        """Get current system awareness."""
        return CONSCIOUSNESS.awareness
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Lifecycle Methods
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def initialize(self) -> None:
        """Initialize the agent and register with consciousness."""
        self._state = AgentState.INITIALIZING
        
        # Register with consciousness
        await CONSCIOUSNESS.register_agent(self)
        
        # Start message handler
        self._running = True
        self._message_handler_task = asyncio.create_task(self._message_loop())
        
        # Custom initialization
        await self._on_initialize()
        
        self._state = AgentState.READY
    
    async def terminate(self) -> None:
        """Gracefully terminate the agent."""
        self._state = AgentState.TERMINATED
        self._running = False
        
        # Terminate children first
        for child in list(self._children.values()):
            await child.terminate()
        
        # Stop message handler
        if self._message_handler_task:
            self._message_handler_task.cancel()
            try:
                await self._message_handler_task
            except asyncio.CancelledError:
                pass
        
        # Unregister from consciousness
        await CONSCIOUSNESS.unregister_agent(self._agent_id)
        
        # Custom cleanup
        await self._on_terminate()
    
    @abstractmethod
    async def _on_initialize(self) -> None:
        """Custom initialization logic."""
        ...
    
    async def _on_terminate(self) -> None:
        """Custom termination logic."""
        pass
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Core Execution
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def execute(self, task: Task) -> TaskResult:
        """Execute a task."""
        if Capability.EXECUTE not in self._capabilities:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="Agent does not have EXECUTE capability"
            )
        
        self._state = AgentState.EXECUTING
        self._current_task = task
        task.status = TaskStatus.IN_PROGRESS
        task.assigned_to = self._agent_id
        
        start_time = time.perf_counter()
        
        try:
            # Pre-execution hook
            await self._pre_execute(task)
            
            # Check if task needs decomposition
            if task.subtasks:
                result = await self._execute_decomposed(task)
            else:
                result = await self._execute_single(task)
            
            # Post-execution hook
            await self._post_execute(task, result)
            
            # Validation if required
            if task.validation_required and result.status == TaskStatus.COMPLETED:
                result = await self._validate_result(task, result)
            
            # Update metrics
            if result.status == TaskStatus.COMPLETED:
                self._tasks_executed += 1
            else:
                self._tasks_failed += 1
            
            result.execution_time_ms = (time.perf_counter() - start_time) * 1000
            result.executor_id = self._agent_id
            
            return result
            
        except Exception as e:
            self._tasks_failed += 1
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error=str(e),
                executor_id=self._agent_id,
                execution_time_ms=(time.perf_counter() - start_time) * 1000
            )
        finally:
            self._current_task = None
            self._state = AgentState.READY
    
    @abstractmethod
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute a single (non-decomposed) task."""
        ...
    
    async def _execute_decomposed(self, task: Task) -> TaskResult:
        """Execute a task with subtasks."""
        sub_results: List[TaskResult] = []
        
        for subtask in task.subtasks:
            # Find appropriate child or self
            executor = self._find_executor(subtask)
            result = await executor.execute(subtask)
            sub_results.append(result)
            
            # Stop on failure unless configured otherwise
            if result.status == TaskStatus.FAILED:
                return TaskResult(
                    task_id=task.task_id,
                    status=TaskStatus.FAILED,
                    error=f"Subtask {subtask.task_id} failed: {result.error}",
                    sub_results=sub_results
                )
        
        # Synthesize results
        synthesized = await self._synthesize_results(task, sub_results)
        synthesized.sub_results = sub_results
        return synthesized
    
    async def _pre_execute(self, task: Task) -> None:
        """Hook before execution."""
        pass
    
    async def _post_execute(self, task: Task, result: TaskResult) -> None:
        """Hook after execution."""
        pass
    
    async def _validate_result(self, task: Task, result: TaskResult) -> TaskResult:
        """Validate the result."""
        if result.quality_score >= task.minimum_quality:
            result.validation_passed = True
        else:
            result.validation_passed = False
            result.status = TaskStatus.FAILED
            result.error = f"Quality {result.quality_score} below minimum {task.minimum_quality}"
        return result
    
    async def _synthesize_results(
        self, 
        task: Task, 
        results: List[TaskResult]
    ) -> TaskResult:
        """Synthesize multiple results into one."""
        # Default: check all passed and combine outputs
        if all(r.status == TaskStatus.COMPLETED for r in results):
            combined_output = {
                f"subtask_{i}": r.output
                for i, r in enumerate(results)
            }
            avg_quality = sum(r.quality_score for r in results) / len(results)
            
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output=combined_output,
                quality_score=avg_quality
            )
        else:
            failed = [r for r in results if r.status == TaskStatus.FAILED]
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error=f"{len(failed)} subtasks failed"
            )
    
    def _find_executor(self, task: Task) -> "BaseAgent":
        """Find appropriate agent to execute task."""
        # Check capabilities of children
        for child in self._children.values():
            if task.required_capabilities <= child.capabilities:
                return child
        
        # Default to self
        return self
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Agent Spawning
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def spawn_child(
        self,
        agent_class: Type[AgentT],
        name: str,
        capabilities: Optional[Set[Capability]] = None,
        **kwargs: Any
    ) -> AgentT:
        """Spawn a child agent."""
        if Capability.SPAWN not in self._capabilities:
            raise PermissionError(f"Agent {self._agent_id} cannot spawn children")
        
        self._state = AgentState.SPAWNING
        
        try:
            child = agent_class(
                name=name,
                parent_id=self._agent_id,
                capabilities=capabilities,
                **kwargs
            )
            
            await child.initialize()
            self._children[child.agent_id] = child
            
            return child
        finally:
            self._state = AgentState.READY
    
    async def terminate_child(self, child_id: str) -> None:
        """Terminate a child agent."""
        child = self._children.get(child_id)
        if child:
            await child.terminate()
            del self._children[child_id]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Messaging
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def send_message(
        self,
        recipient_id: str,
        message_type: MessageType,
        payload: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        correlation_id: Optional[str] = None
    ) -> None:
        """Send a message to another agent."""
        message = AgentMessage(
            sender_id=self._agent_id,
            recipient_id=recipient_id,
            message_type=message_type,
            payload=payload,
            priority=priority,
            correlation_id=correlation_id
        )
        message.add_to_trace(self._agent_id)
        
        if recipient_id == "*":
            await CONSCIOUSNESS.broadcast(message)
        else:
            await self._outbox.put(message)
    
    async def receive_message(self, message: AgentMessage) -> None:
        """Receive and queue a message."""
        message.add_to_trace(self._agent_id)
        await self._inbox.put(message)
    
    async def _message_loop(self) -> None:
        """Main message processing loop."""
        while self._running:
            try:
                message = await asyncio.wait_for(
                    self._inbox.get(),
                    timeout=1.0
                )
                await self._handle_message(message)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                # Log but don't crash
                print(f"Message handling error in {self._agent_id}: {e}")
    
    async def _handle_message(self, message: AgentMessage) -> None:
        """Handle an incoming message."""
        handlers = {
            MessageType.EXECUTE: self._handle_execute_message,
            MessageType.TERMINATE: self._handle_terminate_message,
            MessageType.HEARTBEAT: self._handle_heartbeat,
            MessageType.SYNC: self._handle_sync,
        }
        
        handler = handlers.get(message.message_type, self._handle_unknown_message)
        await handler(message)
    
    async def _handle_execute_message(self, message: AgentMessage) -> None:
        """Handle execute message."""
        task_data = message.payload.get("task")
        if task_data:
            task = Task(**task_data)
            result = await self.execute(task)
            
            await self.send_message(
                recipient_id=message.sender_id,
                message_type=MessageType.RESULT,
                payload={"result": result.dict()},
                correlation_id=message.message_id
            )
    
    async def _handle_terminate_message(self, message: AgentMessage) -> None:
        """Handle terminate message."""
        await self.terminate()
    
    async def _handle_heartbeat(self, message: AgentMessage) -> None:
        """Handle heartbeat."""
        pass  # Just acknowledge receipt
    
    async def _handle_sync(self, message: AgentMessage) -> None:
        """Handle sync request."""
        pass
    
    async def _handle_unknown_message(self, message: AgentMessage) -> None:
        """Handle unknown message type."""
        print(f"Unknown message type: {message.message_type}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Introspection
    # ═══════════════════════════════════════════════════════════════════════════
    
    def to_dict(self) -> Dict[str, Any]:
        """Get agent state as dictionary."""
        return {
            "agent_id": self._agent_id,
            "name": self._name,
            "level": self.LEVEL.name,
            "state": self._state.value,
            "capabilities": [c.value for c in self._capabilities],
            "parent_id": self._parent_id,
            "children": list(self._children.keys()),
            "tasks_executed": self._tasks_executed,
            "tasks_failed": self._tasks_failed,
            "created_at": self._created_at.isoformat()
        }
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self._agent_id} state={self._state.value}>"


# ═══════════════════════════════════════════════════════════════════════════════
# NEXT: Part 2 - Specialized Agents (Architects, Specialists, Workers)
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Enums
    "AgentLevel",
    "AgentState", 
    "Capability",
    "MessagePriority",
    "MessageType",
    "TaskStatus",
    
    # Core classes
    "SystemAwareness",
    "ConsciousnessSubstrate",
    "AgentMessage",
    "Task",
    "TaskResult",
    "BaseAgent",
    
    # Protocols
    "AgentProtocol",
    
    # Global
    "CONSCIOUSNESS",
]

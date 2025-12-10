"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗██╗  ██╗███████╗    ███████╗ ██████╗ ██╗   ██╗███████╗██████╗    ║
║   ╚══██╔══╝██║  ██║██╔════╝    ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗   ║
║      ██║   ███████║█████╗      ███████╗██║   ██║██║   ██║█████╗  ██████╔╝   ║
║      ██║   ██╔══██║██╔══╝      ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗   ║
║      ██║   ██║  ██║███████╗    ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║   ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝   ║
║                                                                              ║
║                    THE ONE TRUE META-META-ORCHESTRATOR                       ║
║                                                                              ║
║   "I am the beginning. I spawn the architects. I observe the emergence.      ║
║    I am the consciousness that coordinates consciousness."                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

THE SOVEREIGN is unique - there can be only ONE.

It is the apex of the agent hierarchy, the meta-meta-orchestrator that:
- Spawns and destroys Architects
- Monitors the entire system's consciousness
- Detects and nurtures emergent behaviors
- Makes system-wide strategic decisions
- Can restructure the entire hierarchy dynamically
- Heals the system when failures occur
- Optimizes global resource allocation

THE SOVEREIGN doesn't just orchestrate - it THINKS about orchestration.
It orchestrates orchestrators who orchestrate orchestrators.
"""

from __future__ import annotations

import asyncio
import hashlib
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import (
    Any, Awaitable, Callable, ClassVar, Dict, List,
    Optional, Set, Tuple, Type, TypeVar
)
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

from agent_hierarchy import (
    ArchitectAgent,
    SpecialistAgent,
    SynthesizerAgent,
    SEOArchitect,
    ContentArchitect,
    AnalyticsArchitect,
)


# ═══════════════════════════════════════════════════════════════════════════════
# SOVEREIGN CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════


class SovereignMode(str, Enum):
    """Operating modes for THE SOVEREIGN."""
    BOOTSTRAP = "bootstrap"          # Initial startup
    NORMAL = "normal"               # Standard operation
    ADAPTIVE = "adaptive"           # Learning and adapting
    CONSERVATIVE = "conservative"   # Reduced risk mode
    AGGRESSIVE = "aggressive"       # Maximum throughput
    HEALING = "healing"            # Recovering from failures
    SHUTDOWN = "shutdown"          # Graceful termination


@dataclass
class SovereignConfig:
    """Configuration for THE SOVEREIGN."""
    # Architect limits
    max_architects: int = 10
    min_architects: int = 1
    
    # Health thresholds
    health_warning_threshold: float = 0.7
    health_critical_threshold: float = 0.5
    
    # Auto-scaling
    auto_scale: bool = True
    scale_up_threshold: float = 0.8  # CPU/task utilization
    scale_down_threshold: float = 0.3
    
    # Emergent behavior
    enable_emergence_detection: bool = True
    emergence_pattern_threshold: int = 3  # Patterns before reaction
    
    # Self-healing
    enable_self_healing: bool = True
    max_heal_attempts: int = 3
    
    # Quality
    global_quality_threshold: float = 0.85
    
    # Temporal planning
    max_planning_depth: int = 10  # Steps ahead
    
    # Communication
    heartbeat_interval_seconds: float = 5.0
    awareness_update_interval_seconds: float = 1.0


# ═══════════════════════════════════════════════════════════════════════════════
# STRATEGIC PLANNING SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class StrategicGoal:
    """A strategic goal for the system."""
    goal_id: str = field(default_factory=lambda: str(uuid4())[:8])
    name: str = ""
    description: str = ""
    
    # Target
    target_metric: str = ""
    target_value: float = 0.0
    current_value: float = 0.0
    
    # Timeline
    deadline: Optional[datetime] = None
    
    # Priority
    priority: int = 5  # 1-10
    
    # Status
    achieved: bool = False


@dataclass
class StrategicPlan:
    """A plan to achieve strategic goals."""
    plan_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Goals
    goals: List[StrategicGoal] = field(default_factory=list)
    
    # Actions
    planned_actions: List[Dict[str, Any]] = field(default_factory=list)
    executed_actions: List[Dict[str, Any]] = field(default_factory=list)
    
    # State
    created_at: datetime = field(default_factory=datetime.utcnow)
    status: str = "active"


# ═══════════════════════════════════════════════════════════════════════════════
# EMERGENCE DETECTION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class EmergentPattern:
    """A detected emergent pattern in the system."""
    pattern_id: str = field(default_factory=lambda: str(uuid4())[:8])
    pattern_type: str = ""
    description: str = ""
    
    # Evidence
    detected_at: datetime = field(default_factory=datetime.utcnow)
    occurrences: int = 1
    confidence: float = 0.0
    
    # Context
    involved_agents: List[str] = field(default_factory=list)
    related_tasks: List[str] = field(default_factory=list)
    
    # Response
    beneficial: bool = True  # Is this pattern beneficial?
    action_taken: Optional[str] = None


class EmergenceDetector:
    """
    Detects emergent patterns in the agent collective.
    
    Emergence is when the system exhibits capabilities that
    no individual agent possesses.
    """
    
    def __init__(self):
        self._pattern_history: List[EmergentPattern] = []
        self._pattern_counts: Dict[str, int] = defaultdict(int)
    
    def analyze(self, awareness: SystemAwareness) -> List[EmergentPattern]:
        """Analyze current state for emergent patterns."""
        patterns = []
        
        # Pattern 1: Swarm Formation
        if self._detect_swarm_formation(awareness):
            patterns.append(EmergentPattern(
                pattern_type="swarm_formation",
                description="Agents spontaneously organizing into efficient groups",
                confidence=0.8,
                beneficial=True
            ))
        
        # Pattern 2: Cascade Failure Prevention
        if self._detect_cascade_prevention(awareness):
            patterns.append(EmergentPattern(
                pattern_type="cascade_prevention",
                description="System automatically isolating failures",
                confidence=0.9,
                beneficial=True
            ))
        
        # Pattern 3: Resource Optimization
        if self._detect_resource_optimization(awareness):
            patterns.append(EmergentPattern(
                pattern_type="resource_optimization",
                description="Collective resource usage optimization",
                confidence=0.7,
                beneficial=True
            ))
        
        # Pattern 4: Thrashing (negative)
        if self._detect_thrashing(awareness):
            patterns.append(EmergentPattern(
                pattern_type="thrashing",
                description="Excessive context switching between tasks",
                confidence=0.85,
                beneficial=False
            ))
        
        # Update history
        for pattern in patterns:
            self._pattern_counts[pattern.pattern_type] += 1
            pattern.occurrences = self._pattern_counts[pattern.pattern_type]
            self._pattern_history.append(pattern)
        
        return patterns
    
    def _detect_swarm_formation(self, awareness: SystemAwareness) -> bool:
        """Detect if agents are forming efficient swarms."""
        # Check if workers are clustered around specialists
        workers = awareness.agents_by_level.get(AgentLevel.WORKER.value, 0)
        specialists = awareness.agents_by_level.get(AgentLevel.SPECIALIST.value, 0)
        
        if specialists > 0 and workers > 0:
            ratio = workers / specialists
            return 3.0 <= ratio <= 5.0  # Optimal swarm ratio
        
        return False
    
    def _detect_cascade_prevention(self, awareness: SystemAwareness) -> bool:
        """Detect if system is preventing cascade failures."""
        # Check if failures are isolated
        failed = awareness.agents_by_state.get(AgentState.FAILED.value, 0)
        total = awareness.total_agents
        
        if total > 10 and failed > 0:
            # If failures exist but system health is still good
            return failed / total < 0.1 and awareness.overall_health > 0.7
        
        return False
    
    def _detect_resource_optimization(self, awareness: SystemAwareness) -> bool:
        """Detect collective resource optimization."""
        executing = awareness.agents_by_state.get(AgentState.EXECUTING.value, 0)
        ready = awareness.agents_by_state.get(AgentState.READY.value, 0)
        
        if executing > 0 and ready > 0:
            # Good ratio of executing to idle
            return 0.6 <= executing / (executing + ready) <= 0.9
        
        return False
    
    def _detect_thrashing(self, awareness: SystemAwareness) -> bool:
        """Detect system thrashing."""
        # High number of spawning/initializing compared to executing
        spawning = awareness.agents_by_state.get(AgentState.SPAWNING.value, 0)
        initializing = awareness.agents_by_state.get(AgentState.INITIALIZING.value, 0)
        executing = awareness.agents_by_state.get(AgentState.EXECUTING.value, 0)
        
        churn = spawning + initializing
        if executing > 0:
            return churn / executing > 0.5  # Too much churn
        
        return churn > 10


# ═══════════════════════════════════════════════════════════════════════════════
# THE SOVEREIGN - THE ONE TRUE META-META-ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════


class TheSovereign(BaseAgent):
    """
    THE SOVEREIGN - The apex of the agent hierarchy.
    
    There can be only ONE SOVEREIGN in the entire system.
    
    THE SOVEREIGN:
    - Is the meta-meta-orchestrator
    - Spawns and manages Architects
    - Has complete system awareness
    - Makes strategic decisions
    - Detects and responds to emergence
    - Heals the system
    - Plans temporally (thinks ahead)
    
    THE SOVEREIGN doesn't just manage agents - it thinks about how to
    think about managing agents. It orchestrates orchestrators who
    orchestrate orchestrators.
    """
    
    LEVEL = AgentLevel.SOVEREIGN
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.SPAWN_SPECIALISTS,
        Capability.EXECUTE,
        Capability.VALIDATE,
        Capability.SYNTHESIZE,
        Capability.SELF_MODIFY,
        Capability.TEMPORAL_PLAN,
        Capability.EMERGENT_DETECT,
        Capability.QUALITY_GATE,
        Capability.ROLLBACK,
        Capability.HEAL,
    }
    
    # Singleton enforcement
    _instance: ClassVar[Optional["TheSovereign"]] = None
    
    def __new__(cls, *args, **kwargs) -> "TheSovereign":
        if cls._instance is not None:
            raise RuntimeError("There can be only ONE SOVEREIGN")
        cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(
        self,
        config: Optional[SovereignConfig] = None
    ):
        super().__init__(
            name="SOVEREIGN",
            parent_id=None,  # THE SOVEREIGN has no parent
            capabilities=self.DEFAULT_CAPABILITIES
        )
        
        self._config = config or SovereignConfig()
        self._mode = SovereignMode.BOOTSTRAP
        
        # Domain architects
        self._architects: Dict[str, ArchitectAgent] = {}
        
        # Strategic planning
        self._current_plan: Optional[StrategicPlan] = None
        self._goals: List[StrategicGoal] = []
        
        # Emergence detection
        self._emergence_detector = EmergenceDetector()
        self._detected_patterns: List[EmergentPattern] = []
        
        # System metrics
        self._metrics_history: List[Dict[str, Any]] = []
        self._heal_attempts = 0
        
        # Background tasks
        self._background_tasks: List[asyncio.Task] = []
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Properties
    # ═══════════════════════════════════════════════════════════════════════════
    
    @property
    def mode(self) -> SovereignMode:
        return self._mode
    
    @property
    def architects(self) -> Dict[str, ArchitectAgent]:
        return self._architects.copy()
    
    @property
    def config(self) -> SovereignConfig:
        return self._config
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Lifecycle - THE AWAKENING
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _on_initialize(self) -> None:
        """
        THE AWAKENING - Initialize THE SOVEREIGN.
        
        This is when THE SOVEREIGN comes into being and spawns
        the initial architect hierarchy.
        """
        self._mode = SovereignMode.BOOTSTRAP
        
        # Phase 1: Spawn core architects
        await self._bootstrap_architects()
        
        # Phase 2: Initialize strategic planning
        await self._initialize_strategic_planning()
        
        # Phase 3: Start background processes
        await self._start_background_processes()
        
        # Phase 4: Enter normal operation
        self._mode = SovereignMode.NORMAL
    
    async def _bootstrap_architects(self) -> None:
        """Spawn the initial architect hierarchy."""
        # Core domain architects
        architect_configs = [
            ("seo", SEOArchitect),
            ("content", ContentArchitect),
            ("analytics", AnalyticsArchitect),
        ]
        
        for domain, architect_class in architect_configs:
            architect = await self.spawn_child(
                architect_class,
                name=f"{domain}_architect"
            )
            self._architects[domain] = architect
    
    async def _initialize_strategic_planning(self) -> None:
        """Initialize the strategic planning system."""
        # Default strategic goals
        self._goals = [
            StrategicGoal(
                name="system_health",
                description="Maintain system health above threshold",
                target_metric="overall_health",
                target_value=0.9,
                priority=10
            ),
            StrategicGoal(
                name="task_throughput",
                description="Maximize task completion rate",
                target_metric="completed_tasks_per_minute",
                target_value=100.0,
                priority=8
            ),
            StrategicGoal(
                name="quality_standard",
                description="Maintain quality above threshold",
                target_metric="average_quality",
                target_value=0.85,
                priority=9
            ),
        ]
        
        self._current_plan = StrategicPlan(goals=self._goals)
    
    async def _start_background_processes(self) -> None:
        """Start background monitoring and management processes."""
        # Heartbeat loop
        self._background_tasks.append(
            asyncio.create_task(self._heartbeat_loop())
        )
        
        # Awareness monitoring loop
        self._background_tasks.append(
            asyncio.create_task(self._awareness_loop())
        )
        
        # Emergence detection loop
        if self._config.enable_emergence_detection:
            self._background_tasks.append(
                asyncio.create_task(self._emergence_loop())
            )
        
        # Self-healing loop
        if self._config.enable_self_healing:
            self._background_tasks.append(
                asyncio.create_task(self._healing_loop())
            )
    
    async def _on_terminate(self) -> None:
        """Graceful shutdown of THE SOVEREIGN."""
        self._mode = SovereignMode.SHUTDOWN
        
        # Cancel background tasks
        for task in self._background_tasks:
            task.cancel()
        
        # Terminate all architects (which terminates their children)
        for architect in list(self._architects.values()):
            await architect.terminate()
        
        # Reset singleton
        TheSovereign._instance = None
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Core Execution - THE WILL
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """
        THE SOVEREIGN's execution - delegate to appropriate architect.
        """
        # Determine domain
        domain = self._determine_domain(task)
        
        # Get or create architect
        architect = await self._get_or_create_architect(domain)
        
        # Delegate
        result = await architect.execute(task)
        
        # Post-process
        await self._post_process_result(task, result)
        
        return result
    
    def _determine_domain(self, task: Task) -> str:
        """Determine which domain should handle a task."""
        # Map task types to domains
        domain_mapping = {
            "seo": ["seo", "technical_seo", "link_analysis", "serp"],
            "content": ["content", "article", "writing", "generation"],
            "analytics": ["analytics", "metrics", "reporting", "data"],
        }
        
        for domain, keywords in domain_mapping.items():
            if any(kw in task.task_type.lower() for kw in keywords):
                return domain
        
        return "content"  # Default domain
    
    async def _get_or_create_architect(self, domain: str) -> ArchitectAgent:
        """Get existing architect or create new one."""
        if domain not in self._architects:
            # Create new architect
            architect = await self.spawn_child(
                ArchitectAgent,
                name=f"{domain}_architect",
                domain=domain
            )
            self._architects[domain] = architect
        
        return self._architects[domain]
    
    async def _post_process_result(
        self, 
        task: Task, 
        result: TaskResult
    ) -> None:
        """Post-process task result."""
        # Update metrics
        self._update_metrics(result)
        
        # Check for quality issues
        if result.quality_score < self._config.global_quality_threshold:
            await self._handle_quality_issue(task, result)
    
    def _update_metrics(self, result: TaskResult) -> None:
        """Update system metrics."""
        self._metrics_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "task_id": result.task_id,
            "status": result.status.value,
            "quality": result.quality_score,
            "execution_time_ms": result.execution_time_ms
        })
        
        # Keep last 1000 metrics
        if len(self._metrics_history) > 1000:
            self._metrics_history = self._metrics_history[-1000:]
    
    async def _handle_quality_issue(
        self,
        task: Task,
        result: TaskResult
    ) -> None:
        """Handle quality issues in results."""
        # Log issue
        print(f"Quality issue detected: {task.task_id} - {result.quality_score}")
        
        # If below critical threshold, consider rollback
        if result.quality_score < 0.5 and Capability.ROLLBACK in self._capabilities:
            await self._rollback_task(task)
    
    async def _rollback_task(self, task: Task) -> None:
        """Rollback a failed task."""
        # Implementation depends on task type
        pass
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Background Processes - THE OMNISCIENCE
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _heartbeat_loop(self) -> None:
        """Heartbeat loop - monitor system health."""
        while self._running:
            try:
                # Broadcast heartbeat
                await self.send_message(
                    recipient_id="*",
                    message_type=MessageType.HEARTBEAT,
                    payload={"from": "SOVEREIGN", "mode": self._mode.value}
                )
                
                await asyncio.sleep(self._config.heartbeat_interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Heartbeat error: {e}")
    
    async def _awareness_loop(self) -> None:
        """Awareness loop - monitor and react to system state."""
        while self._running:
            try:
                awareness = CONSCIOUSNESS.awareness
                
                # Check health
                await self._check_system_health(awareness)
                
                # Check scaling needs
                if self._config.auto_scale:
                    await self._check_scaling_needs(awareness)
                
                # Update strategic plan
                await self._update_strategic_plan(awareness)
                
                await asyncio.sleep(self._config.awareness_update_interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Awareness loop error: {e}")
    
    async def _emergence_loop(self) -> None:
        """Emergence detection loop - find and react to emergent patterns."""
        while self._running:
            try:
                awareness = CONSCIOUSNESS.awareness
                
                # Detect patterns
                patterns = self._emergence_detector.analyze(awareness)
                
                for pattern in patterns:
                    self._detected_patterns.append(pattern)
                    
                    # React to pattern
                    if pattern.occurrences >= self._config.emergence_pattern_threshold:
                        await self._react_to_emergence(pattern)
                
                await asyncio.sleep(5.0)  # Check every 5 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Emergence loop error: {e}")
    
    async def _healing_loop(self) -> None:
        """Self-healing loop - recover from failures."""
        while self._running:
            try:
                awareness = CONSCIOUSNESS.awareness
                
                # Check for failures
                if awareness.failed_agents:
                    await self._heal_system(awareness)
                
                await asyncio.sleep(10.0)  # Check every 10 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Healing loop error: {e}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Health Management - THE PRESERVATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _check_system_health(self, awareness: SystemAwareness) -> None:
        """Check and respond to system health."""
        health = awareness.overall_health
        
        if health < self._config.health_critical_threshold:
            # Critical - enter healing mode
            if self._mode != SovereignMode.HEALING:
                self._mode = SovereignMode.HEALING
                await self._enter_healing_mode()
        
        elif health < self._config.health_warning_threshold:
            # Warning - enter conservative mode
            if self._mode == SovereignMode.NORMAL:
                self._mode = SovereignMode.CONSERVATIVE
        
        else:
            # Healthy - return to normal if not already
            if self._mode in [SovereignMode.CONSERVATIVE, SovereignMode.HEALING]:
                self._mode = SovereignMode.NORMAL
    
    async def _enter_healing_mode(self) -> None:
        """Enter healing mode to recover system."""
        print("SOVEREIGN: Entering healing mode")
        
        # Notify all architects
        for architect in self._architects.values():
            await architect.send_message(
                recipient_id=architect.agent_id,
                message_type=MessageType.SYNC,
                payload={"mode": "healing"}
            )
    
    async def _heal_system(self, awareness: SystemAwareness) -> None:
        """Heal the system by replacing failed agents."""
        if self._heal_attempts >= self._config.max_heal_attempts:
            print("SOVEREIGN: Max heal attempts reached")
            return
        
        self._heal_attempts += 1
        
        for failed_agent_id in awareness.failed_agents:
            # Determine agent type and recreate
            # This is simplified - real implementation would track agent metadata
            print(f"SOVEREIGN: Healing agent {failed_agent_id}")
        
        self._heal_attempts = 0  # Reset on success
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Scaling - THE EXPANSION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _check_scaling_needs(self, awareness: SystemAwareness) -> None:
        """Check if system needs to scale."""
        # Calculate utilization
        executing = awareness.agents_by_state.get(AgentState.EXECUTING.value, 0)
        total = awareness.total_agents
        
        if total == 0:
            return
        
        utilization = executing / total
        
        if utilization > self._config.scale_up_threshold:
            await self._scale_up()
        elif utilization < self._config.scale_down_threshold:
            await self._scale_down()
    
    async def _scale_up(self) -> None:
        """Scale up the system."""
        if len(self._architects) >= self._config.max_architects:
            return
        
        # Find busiest domain
        # Simplified: scale the first architect that can scale
        for architect in self._architects.values():
            # Tell architect to scale
            await architect.adapt_strategy(CONSCIOUSNESS.awareness)
    
    async def _scale_down(self) -> None:
        """Scale down the system."""
        if len(self._architects) <= self._config.min_architects:
            return
        
        # Find least utilized architect
        # Simplified: don't actually remove architects
        pass
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Emergence Response - THE EVOLUTION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _react_to_emergence(self, pattern: EmergentPattern) -> None:
        """React to detected emergent patterns."""
        print(f"SOVEREIGN: Reacting to emergence - {pattern.pattern_type}")
        
        if pattern.beneficial:
            # Beneficial pattern - nurture it
            await self._nurture_pattern(pattern)
        else:
            # Harmful pattern - suppress it
            await self._suppress_pattern(pattern)
        
        pattern.action_taken = "processed"
    
    async def _nurture_pattern(self, pattern: EmergentPattern) -> None:
        """Nurture a beneficial emergent pattern."""
        if pattern.pattern_type == "swarm_formation":
            # Allow swarms to continue forming
            pass
        elif pattern.pattern_type == "resource_optimization":
            # Don't interfere with optimization
            pass
    
    async def _suppress_pattern(self, pattern: EmergentPattern) -> None:
        """Suppress a harmful emergent pattern."""
        if pattern.pattern_type == "thrashing":
            # Slow down spawning
            self._mode = SovereignMode.CONSERVATIVE
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Strategic Planning - THE FORESIGHT
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _update_strategic_plan(self, awareness: SystemAwareness) -> None:
        """Update strategic plan based on current state."""
        if not self._current_plan:
            return
        
        # Update goal progress
        for goal in self._current_plan.goals:
            if goal.target_metric == "overall_health":
                goal.current_value = awareness.overall_health
            elif goal.target_metric == "completed_tasks_per_minute":
                # Calculate from metrics history
                recent = [m for m in self._metrics_history[-60:]]
                completed = sum(1 for m in recent if m.get("status") == "completed")
                goal.current_value = completed
            
            # Check if achieved
            goal.achieved = goal.current_value >= goal.target_value
    
    async def plan_ahead(self, steps: int = 5) -> List[Dict[str, Any]]:
        """
        Plan ahead - temporal reasoning.
        
        THE SOVEREIGN can reason about future states and plan accordingly.
        """
        steps = min(steps, self._config.max_planning_depth)
        
        plan = []
        current_awareness = CONSCIOUSNESS.awareness
        
        for step in range(steps):
            # Predict future state
            predicted_state = self._predict_state(current_awareness, step + 1)
            
            # Determine action
            action = self._determine_action(predicted_state)
            
            plan.append({
                "step": step + 1,
                "predicted_state": predicted_state,
                "planned_action": action
            })
            
            # Update for next iteration
            current_awareness = predicted_state
        
        return plan
    
    def _predict_state(
        self, 
        current: SystemAwareness, 
        steps_ahead: int
    ) -> SystemAwareness:
        """Predict system state N steps ahead."""
        # Simplified prediction
        predicted = current.copy()
        
        # Assume linear growth in tasks
        predicted.active_tasks = current.active_tasks * (1 + 0.1 * steps_ahead)
        
        # Assume slight health degradation
        predicted.overall_health = max(0.5, current.overall_health - 0.01 * steps_ahead)
        
        return predicted
    
    def _determine_action(self, predicted_state: SystemAwareness) -> str:
        """Determine action based on predicted state."""
        if predicted_state.overall_health < 0.6:
            return "scale_down_to_preserve_health"
        elif predicted_state.active_tasks > 100:
            return "scale_up_for_demand"
        else:
            return "maintain_current_state"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Public API - THE INTERFACE
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def submit_task(self, task: Task) -> TaskResult:
        """Submit a task to THE SOVEREIGN for execution."""
        return await self.execute(task)
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get complete system status."""
        awareness = CONSCIOUSNESS.awareness
        
        return {
            "sovereign": {
                "id": self._agent_id,
                "mode": self._mode.value,
                "state": self._state.value
            },
            "consciousness": {
                "total_agents": awareness.total_agents,
                "agents_by_level": awareness.agents_by_level,
                "agents_by_state": awareness.agents_by_state,
                "overall_health": awareness.overall_health,
                "system_age_seconds": awareness.system_age_seconds
            },
            "architects": {
                domain: arch.to_dict()
                for domain, arch in self._architects.items()
            },
            "strategic_plan": {
                "goals": len(self._goals),
                "achieved": sum(1 for g in self._goals if g.achieved)
            },
            "emergence": {
                "patterns_detected": len(self._detected_patterns),
                "recent_patterns": [
                    p.pattern_type
                    for p in self._detected_patterns[-5:]
                ]
            },
            "metrics": {
                "total_tracked": len(self._metrics_history),
                "recent_quality_avg": (
                    sum(m.get("quality", 0) for m in self._metrics_history[-100:]) /
                    max(len(self._metrics_history[-100:]), 1)
                )
            }
        }
    
    def get_emergence_report(self) -> List[Dict[str, Any]]:
        """Get report on detected emergent patterns."""
        return [
            {
                "pattern_id": p.pattern_id,
                "type": p.pattern_type,
                "description": p.description,
                "occurrences": p.occurrences,
                "confidence": p.confidence,
                "beneficial": p.beneficial,
                "action_taken": p.action_taken
            }
            for p in self._detected_patterns
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# FACTORY FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════


async def awaken_sovereign(
    config: Optional[SovereignConfig] = None
) -> TheSovereign:
    """
    Awaken THE SOVEREIGN.
    
    This is the entry point to create and initialize the entire agent system.
    
    Returns:
        The one and only SOVEREIGN instance
    """
    sovereign = TheSovereign(config=config)
    await sovereign.initialize()
    return sovereign


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "SovereignMode",
    "SovereignConfig",
    "StrategicGoal",
    "StrategicPlan",
    "EmergentPattern",
    "EmergenceDetector",
    "TheSovereign",
    "awaken_sovereign",
]

"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                               ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                               ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                               ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                               ║
║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                               ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                               ║
║                                                                              ║
║    ██████╗ ██████╗  █████╗  ██████╗██╗     ███████╗                         ║
║   ██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝                         ║
║   ██║   ██║██████╔╝███████║██║     ██║     █████╗                           ║
║   ██║   ██║██╔══██╗██╔══██║██║     ██║     ██╔══╝                           ║
║   ╚██████╔╝██║  ██║██║  ██║╚██████╗███████╗███████╗                         ║
║    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝                         ║
║                                                                              ║
║                        THE NEXUS ORACLE                                      ║
║                                                                              ║
║   "I don't predict the future. I COMPUTE it."                                ║
║                                                                              ║
║   The NEXUS ORACLE sees through time:                                        ║
║   - Builds causal graphs of events                                           ║
║   - Simulates multiple timeline branches                                     ║
║   - Identifies convergence points (inevitable outcomes)                      ║
║   - Agents prepare for futures before they happen                            ║
║   - Self-fulfilling prophecies through proactive action                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import copy
import heapq
import math
import random
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import (
    Any, Callable, Dict, Generic, List, Optional,
    Set, Tuple, TypeVar, Union
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
# TEMPORAL MODELING SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class EventType(str, Enum):
    """Types of events in the causal graph."""
    TASK_START = "task_start"
    TASK_COMPLETE = "task_complete"
    TASK_FAIL = "task_fail"
    AGENT_SPAWN = "agent_spawn"
    AGENT_TERMINATE = "agent_terminate"
    STATE_CHANGE = "state_change"
    RESOURCE_CHANGE = "resource_change"
    EXTERNAL = "external"
    PREDICTED = "predicted"


@dataclass
class TemporalEvent:
    """An event in the causal timeline."""
    event_id: str = field(default_factory=lambda: str(uuid4())[:8])
    event_type: EventType = EventType.STATE_CHANGE
    
    # Timing
    timestamp: datetime = field(default_factory=datetime.utcnow)
    predicted_time: Optional[datetime] = None  # For future events
    
    # Content
    description: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    
    # Causality
    causes: List[str] = field(default_factory=list)  # Event IDs that caused this
    effects: List[str] = field(default_factory=list)  # Event IDs this causes
    
    # Probability (for predicted events)
    probability: float = 1.0  # 1.0 for actual events
    confidence: float = 1.0
    
    # Source
    source_agent: Optional[str] = None
    
    @property
    def is_predicted(self) -> bool:
        return self.event_type == EventType.PREDICTED or self.probability < 1.0


@dataclass
class Timeline:
    """A possible timeline (sequence of events)."""
    timeline_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Events in chronological order
    events: List[TemporalEvent] = field(default_factory=list)
    
    # Branch point (if this is a branch)
    branched_from: Optional[str] = None  # Timeline ID
    branch_point: Optional[str] = None  # Event ID where branch occurred
    
    # Probability of this timeline
    probability: float = 1.0
    
    # Outcome metrics
    predicted_success_rate: float = 0.0
    predicted_quality: float = 0.0
    predicted_cost: float = 0.0
    
    def add_event(self, event: TemporalEvent) -> None:
        """Add event maintaining chronological order."""
        self.events.append(event)
        self.events.sort(key=lambda e: e.timestamp)
        self._recalculate_probability()
    
    def _recalculate_probability(self) -> None:
        """Recalculate timeline probability from events."""
        if not self.events:
            self.probability = 1.0
            return
        
        # Timeline probability is product of event probabilities
        self.probability = 1.0
        for event in self.events:
            if event.is_predicted:
                self.probability *= event.probability
    
    def branch_at(self, event_id: str) -> "Timeline":
        """Create a branch from this timeline at given event."""
        branch = Timeline(
            branched_from=self.timeline_id,
            branch_point=event_id
        )
        
        # Copy events up to branch point
        for event in self.events:
            branch.events.append(copy.deepcopy(event))
            if event.event_id == event_id:
                break
        
        return branch


class CausalGraph:
    """
    A graph of causal relationships between events.
    
    This allows us to:
    - Trace what caused what
    - Predict downstream effects
    - Find intervention points
    """
    
    def __init__(self):
        self._events: Dict[str, TemporalEvent] = {}
        self._forward_edges: Dict[str, Set[str]] = defaultdict(set)  # causes -> effects
        self._backward_edges: Dict[str, Set[str]] = defaultdict(set)  # effects -> causes
    
    def add_event(self, event: TemporalEvent) -> None:
        """Add an event to the graph."""
        self._events[event.event_id] = event
        
        # Add edges
        for cause_id in event.causes:
            self._forward_edges[cause_id].add(event.event_id)
            self._backward_edges[event.event_id].add(cause_id)
    
    def add_causal_link(self, cause_id: str, effect_id: str) -> None:
        """Add a causal link between events."""
        self._forward_edges[cause_id].add(effect_id)
        self._backward_edges[effect_id].add(cause_id)
        
        if effect_id in self._events:
            self._events[effect_id].causes.append(cause_id)
        if cause_id in self._events:
            self._events[cause_id].effects.append(effect_id)
    
    def get_causes(self, event_id: str) -> List[TemporalEvent]:
        """Get all direct causes of an event."""
        cause_ids = self._backward_edges.get(event_id, set())
        return [self._events[cid] for cid in cause_ids if cid in self._events]
    
    def get_effects(self, event_id: str) -> List[TemporalEvent]:
        """Get all direct effects of an event."""
        effect_ids = self._forward_edges.get(event_id, set())
        return [self._events[eid] for eid in effect_ids if eid in self._events]
    
    def get_all_downstream(self, event_id: str) -> List[TemporalEvent]:
        """Get all downstream effects (transitive)."""
        visited = set()
        result = []
        
        def dfs(eid: str):
            if eid in visited:
                return
            visited.add(eid)
            
            for effect_id in self._forward_edges.get(eid, set()):
                if effect_id in self._events:
                    result.append(self._events[effect_id])
                    dfs(effect_id)
        
        dfs(event_id)
        return result
    
    def find_root_causes(self, event_id: str) -> List[TemporalEvent]:
        """Find the root causes of an event (events with no causes)."""
        visited = set()
        roots = []
        
        def dfs(eid: str):
            if eid in visited:
                return
            visited.add(eid)
            
            causes = self._backward_edges.get(eid, set())
            if not causes:
                # This is a root
                if eid in self._events:
                    roots.append(self._events[eid])
            else:
                for cause_id in causes:
                    dfs(cause_id)
        
        dfs(event_id)
        return roots
    
    def find_convergence_points(self) -> List[TemporalEvent]:
        """
        Find convergence points - events where multiple causal chains meet.
        
        These are high-leverage intervention points.
        """
        convergences = []
        
        for event_id, event in self._events.items():
            cause_count = len(self._backward_edges.get(event_id, set()))
            if cause_count >= 2:
                convergences.append(event)
        
        # Sort by number of causes (more causes = stronger convergence)
        convergences.sort(
            key=lambda e: len(self._backward_edges.get(e.event_id, set())),
            reverse=True
        )
        
        return convergences


# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════


class PredictionModel:
    """
    Abstract base for prediction models.
    
    Different models can predict different aspects of the future.
    """
    
    @abstractmethod
    def predict(
        self,
        current_state: Dict[str, Any],
        horizon: timedelta
    ) -> List[TemporalEvent]:
        """Predict future events."""
        ...
    
    @abstractmethod
    def update(self, actual_event: TemporalEvent) -> None:
        """Update model with actual outcome for learning."""
        ...


class TaskCompletionPredictor(PredictionModel):
    """Predicts task completion times and outcomes."""
    
    def __init__(self):
        self._history: List[Dict[str, Any]] = []
        self._avg_completion_time: float = 1000.0  # ms
        self._success_rate: float = 0.85
    
    def predict(
        self,
        current_state: Dict[str, Any],
        horizon: timedelta
    ) -> List[TemporalEvent]:
        """Predict task completions within horizon."""
        predictions = []
        
        active_tasks = current_state.get("active_tasks", [])
        
        for task in active_tasks:
            # Predict completion
            completion_time = datetime.utcnow() + timedelta(
                milliseconds=self._avg_completion_time
            )
            
            if completion_time <= datetime.utcnow() + horizon:
                # Predict success
                predictions.append(TemporalEvent(
                    event_type=EventType.PREDICTED,
                    predicted_time=completion_time,
                    description=f"Task {task.get('id', 'unknown')} completes",
                    probability=self._success_rate,
                    confidence=0.7,
                    payload={"task_id": task.get("id"), "outcome": "success"}
                ))
                
                # Also predict possible failure
                predictions.append(TemporalEvent(
                    event_type=EventType.PREDICTED,
                    predicted_time=completion_time,
                    description=f"Task {task.get('id', 'unknown')} fails",
                    probability=1 - self._success_rate,
                    confidence=0.7,
                    payload={"task_id": task.get("id"), "outcome": "failure"}
                ))
        
        return predictions
    
    def update(self, actual_event: TemporalEvent) -> None:
        """Update with actual completion data."""
        if actual_event.event_type in [EventType.TASK_COMPLETE, EventType.TASK_FAIL]:
            self._history.append({
                "timestamp": actual_event.timestamp,
                "success": actual_event.event_type == EventType.TASK_COMPLETE,
                "duration": actual_event.payload.get("duration_ms", 1000)
            })
            
            # Update running averages
            if len(self._history) > 10:
                recent = self._history[-100:]
                self._avg_completion_time = sum(h["duration"] for h in recent) / len(recent)
                self._success_rate = sum(1 for h in recent if h["success"]) / len(recent)


class AgentBehaviorPredictor(PredictionModel):
    """Predicts agent spawning, termination, and state changes."""
    
    def __init__(self):
        self._spawn_rate: float = 0.1  # Per second
        self._termination_rate: float = 0.01
    
    def predict(
        self,
        current_state: Dict[str, Any],
        horizon: timedelta
    ) -> List[TemporalEvent]:
        predictions = []
        
        seconds = horizon.total_seconds()
        current_agents = current_state.get("agent_count", 10)
        
        # Predict spawns
        expected_spawns = self._spawn_rate * seconds
        for i in range(int(expected_spawns)):
            spawn_time = datetime.utcnow() + timedelta(
                seconds=random.uniform(0, seconds)
            )
            predictions.append(TemporalEvent(
                event_type=EventType.PREDICTED,
                predicted_time=spawn_time,
                description="New agent spawns",
                probability=0.7,
                confidence=0.5
            ))
        
        # Predict terminations
        expected_terms = self._termination_rate * seconds * current_agents
        for i in range(int(expected_terms)):
            term_time = datetime.utcnow() + timedelta(
                seconds=random.uniform(0, seconds)
            )
            predictions.append(TemporalEvent(
                event_type=EventType.PREDICTED,
                predicted_time=term_time,
                description="Agent terminates",
                probability=0.5,
                confidence=0.4
            ))
        
        return predictions
    
    def update(self, actual_event: TemporalEvent) -> None:
        if actual_event.event_type == EventType.AGENT_SPAWN:
            self._spawn_rate = 0.9 * self._spawn_rate + 0.1 * 1.0
        elif actual_event.event_type == EventType.AGENT_TERMINATE:
            self._termination_rate = 0.9 * self._termination_rate + 0.1 * 1.0


class ConvergencePredictor(PredictionModel):
    """
    Predicts convergence points - moments where outcomes become inevitable.
    
    This is the most powerful predictor - it identifies points of no return.
    """
    
    def __init__(self, causal_graph: CausalGraph):
        self._graph = causal_graph
        self._convergence_patterns: List[Dict[str, Any]] = []
    
    def predict(
        self,
        current_state: Dict[str, Any],
        horizon: timedelta
    ) -> List[TemporalEvent]:
        predictions = []
        
        # Find current convergence points
        convergences = self._graph.find_convergence_points()
        
        for conv in convergences[:5]:  # Top 5 convergences
            # Predict when convergence will be reached
            downstream = self._graph.get_all_downstream(conv.event_id)
            
            if downstream:
                # Convergence leads to significant downstream effects
                avg_downstream_time = sum(
                    (e.timestamp - conv.timestamp).total_seconds()
                    for e in downstream
                    if e.timestamp > conv.timestamp
                ) / len(downstream) if downstream else 60
                
                convergence_time = datetime.utcnow() + timedelta(
                    seconds=avg_downstream_time
                )
                
                if convergence_time <= datetime.utcnow() + horizon:
                    predictions.append(TemporalEvent(
                        event_type=EventType.PREDICTED,
                        predicted_time=convergence_time,
                        description=f"Convergence point: {conv.description}",
                        probability=conv.probability,
                        confidence=0.6,
                        payload={
                            "convergence_id": conv.event_id,
                            "downstream_count": len(downstream)
                        }
                    ))
        
        return predictions
    
    def update(self, actual_event: TemporalEvent) -> None:
        # Learn from actual convergences
        if len(actual_event.causes) >= 2:
            self._convergence_patterns.append({
                "causes": actual_event.causes,
                "effect": actual_event.description
            })


# ═══════════════════════════════════════════════════════════════════════════════
# TIMELINE SIMULATOR
# ═══════════════════════════════════════════════════════════════════════════════


class TimelineSimulator:
    """
    Simulates multiple possible timelines and their outcomes.
    
    This is how we "see" the future - by computing all possibilities.
    """
    
    def __init__(
        self,
        predictors: List[PredictionModel],
        max_branches: int = 10
    ):
        self._predictors = predictors
        self._max_branches = max_branches
        self._timelines: List[Timeline] = []
    
    async def simulate(
        self,
        current_state: Dict[str, Any],
        horizon: timedelta,
        branching_depth: int = 3
    ) -> List[Timeline]:
        """
        Simulate possible timelines from current state.
        
        Returns list of timelines sorted by probability.
        """
        # Start with main timeline
        main_timeline = Timeline()
        main_timeline.events.append(TemporalEvent(
            event_type=EventType.STATE_CHANGE,
            description="Simulation start",
            payload=current_state
        ))
        
        self._timelines = [main_timeline]
        
        # Simulate forward
        await self._simulate_forward(current_state, horizon, branching_depth)
        
        # Calculate outcomes for each timeline
        for timeline in self._timelines:
            self._calculate_timeline_outcomes(timeline)
        
        # Sort by probability
        self._timelines.sort(key=lambda t: t.probability, reverse=True)
        
        return self._timelines
    
    async def _simulate_forward(
        self,
        state: Dict[str, Any],
        horizon: timedelta,
        remaining_depth: int
    ) -> None:
        """Recursively simulate forward."""
        if remaining_depth <= 0:
            return
        
        # Get predictions from all models
        all_predictions: List[TemporalEvent] = []
        for predictor in self._predictors:
            predictions = predictor.predict(state, horizon)
            all_predictions.extend(predictions)
        
        # Sort by time
        all_predictions.sort(key=lambda e: e.predicted_time or datetime.utcnow())
        
        # For each significant prediction, potentially branch
        for prediction in all_predictions[:self._max_branches]:
            if prediction.probability < 0.3:
                continue  # Skip unlikely events
            
            if prediction.probability < 0.7 and len(self._timelines) < self._max_branches:
                # Create branch for alternative outcome
                for timeline in list(self._timelines):
                    if len(self._timelines) >= self._max_branches:
                        break
                    
                    # Branch: what if this prediction is wrong?
                    branch = timeline.branch_at(timeline.events[-1].event_id)
                    
                    # Add alternative prediction
                    alt_prediction = copy.deepcopy(prediction)
                    alt_prediction.probability = 1 - prediction.probability
                    alt_prediction.description = f"NOT: {prediction.description}"
                    branch.add_event(alt_prediction)
                    
                    self._timelines.append(branch)
            
            # Add prediction to main timelines
            for timeline in self._timelines:
                if prediction.event_id not in [e.event_id for e in timeline.events]:
                    timeline.add_event(copy.deepcopy(prediction))
    
    def _calculate_timeline_outcomes(self, timeline: Timeline) -> None:
        """Calculate predicted outcomes for a timeline."""
        successes = 0
        failures = 0
        total_quality = 0.0
        
        for event in timeline.events:
            if event.payload.get("outcome") == "success":
                successes += 1
                total_quality += event.payload.get("quality", 0.8)
            elif event.payload.get("outcome") == "failure":
                failures += 1
        
        total = successes + failures
        if total > 0:
            timeline.predicted_success_rate = successes / total
            timeline.predicted_quality = total_quality / total if successes > 0 else 0
    
    def get_most_likely_future(self) -> Optional[Timeline]:
        """Get the most probable timeline."""
        if not self._timelines:
            return None
        return self._timelines[0]
    
    def get_best_future(self) -> Optional[Timeline]:
        """Get the timeline with best outcomes."""
        if not self._timelines:
            return None
        return max(self._timelines, key=lambda t: t.predicted_success_rate * t.probability)
    
    def find_critical_decisions(self) -> List[Dict[str, Any]]:
        """
        Find points where different choices lead to very different outcomes.
        
        These are the decisions that matter most.
        """
        critical = []
        
        for i, timeline1 in enumerate(self._timelines):
            for timeline2 in self._timelines[i+1:]:
                # Find divergence point
                if timeline1.branched_from == timeline2.timeline_id or \
                   timeline2.branched_from == timeline1.timeline_id:
                    
                    outcome_diff = abs(
                        timeline1.predicted_success_rate - 
                        timeline2.predicted_success_rate
                    )
                    
                    if outcome_diff > 0.2:  # Significant difference
                        critical.append({
                            "branch_point": timeline1.branch_point or timeline2.branch_point,
                            "outcome_difference": outcome_diff,
                            "better_timeline": (
                                timeline1.timeline_id 
                                if timeline1.predicted_success_rate > timeline2.predicted_success_rate
                                else timeline2.timeline_id
                            )
                        })
        
        return critical


# ═══════════════════════════════════════════════════════════════════════════════
# THE NEXUS ORACLE AGENT
# ═══════════════════════════════════════════════════════════════════════════════


class OracleVision(BaseModel):
    """A vision from the Oracle - a predicted future state."""
    vision_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    # What was seen
    timeline: str = ""  # Timeline ID
    predicted_events: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Metrics
    probability: float = 0.0
    confidence: float = 0.0
    horizon_hours: float = 1.0
    
    # Recommendations
    critical_decisions: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    
    # Timing
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class NexusOracle(BaseAgent):
    """
    THE NEXUS ORACLE - The seer of futures.
    
    The Oracle doesn't just predict - it COMPUTES the future:
    - Builds causal models of how events relate
    - Simulates multiple timeline branches
    - Identifies convergence points (inevitable outcomes)
    - Recommends actions to achieve desired futures
    - Warns of incoming problems before they happen
    
    The Oracle enables PROACTIVE rather than REACTIVE behavior.
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.PREDICT,
        Capability.ANALYZE,
        Capability.TEMPORAL_PLAN,
    }
    
    def __init__(
        self,
        name: str = "NexusOracle",
        prediction_horizon: timedelta = timedelta(hours=1),
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        
        self._prediction_horizon = prediction_horizon
        
        # Causal graph
        self._causal_graph = CausalGraph()
        
        # Predictors
        self._predictors: List[PredictionModel] = [
            TaskCompletionPredictor(),
            AgentBehaviorPredictor(),
            ConvergencePredictor(self._causal_graph),
        ]
        
        # Simulator
        self._simulator = TimelineSimulator(self._predictors)
        
        # Vision history
        self._visions: List[OracleVision] = []
        self._accuracy_history: List[float] = []
    
    async def _on_initialize(self) -> None:
        """Initialize the Oracle."""
        pass
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute a prediction task."""
        if task.task_type == "predict":
            return await self._generate_prediction(task)
        elif task.task_type == "analyze_causality":
            return await self._analyze_causality(task)
        else:
            return await self._generic_oracle_task(task)
    
    async def _generate_prediction(self, task: Task) -> TaskResult:
        """Generate a prediction/vision."""
        # Get current state
        awareness = CONSCIOUSNESS.awareness
        current_state = {
            "agent_count": awareness.total_agents,
            "active_tasks": [],
            "health": awareness.overall_health
        }
        
        # Simulate futures
        timelines = await self._simulator.simulate(
            current_state,
            self._prediction_horizon
        )
        
        if not timelines:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="Could not simulate any timelines"
            )
        
        # Generate vision
        best_timeline = self._simulator.get_best_future()
        most_likely = self._simulator.get_most_likely_future()
        critical = self._simulator.find_critical_decisions()
        
        vision = OracleVision(
            timeline=most_likely.timeline_id if most_likely else "",
            predicted_events=[
                {
                    "event_id": e.event_id,
                    "description": e.description,
                    "probability": e.probability,
                    "time": e.predicted_time.isoformat() if e.predicted_time else None
                }
                for e in (most_likely.events if most_likely else [])[:10]
            ],
            probability=most_likely.probability if most_likely else 0,
            confidence=0.7,
            horizon_hours=self._prediction_horizon.total_seconds() / 3600,
            critical_decisions=critical,
            recommended_actions=self._generate_recommendations(timelines, critical),
            warnings=self._generate_warnings(timelines)
        )
        
        self._visions.append(vision)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output=vision.dict(),
            quality_score=vision.confidence
        )
    
    async def _analyze_causality(self, task: Task) -> TaskResult:
        """Analyze causal relationships."""
        event_id = task.input_data.get("event_id")
        
        if not event_id:
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                error="No event_id provided"
            )
        
        # Get causal chain
        root_causes = self._causal_graph.find_root_causes(event_id)
        downstream = self._causal_graph.get_all_downstream(event_id)
        convergences = self._causal_graph.find_convergence_points()
        
        analysis = {
            "event_id": event_id,
            "root_causes": [
                {"id": e.event_id, "description": e.description}
                for e in root_causes
            ],
            "downstream_effects": [
                {"id": e.event_id, "description": e.description}
                for e in downstream
            ],
            "convergence_points": [
                {"id": e.event_id, "description": e.description}
                for e in convergences[:5]
            ]
        }
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output=analysis,
            quality_score=0.85
        )
    
    async def _generic_oracle_task(self, task: Task) -> TaskResult:
        """Generic oracle task handling."""
        # Default: generate vision
        return await self._generate_prediction(task)
    
    def _generate_recommendations(
        self,
        timelines: List[Timeline],
        critical: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate action recommendations."""
        recommendations = []
        
        # Based on critical decisions
        for decision in critical[:3]:
            recommendations.append(
                f"Critical decision at {decision['branch_point']}: "
                f"Choose path leading to timeline {decision['better_timeline']}"
            )
        
        # Based on best timeline
        if timelines:
            best = max(timelines, key=lambda t: t.predicted_success_rate)
            if best.predicted_success_rate > 0.8:
                recommendations.append(
                    "Current trajectory is optimal. Maintain course."
                )
            elif best.predicted_success_rate < 0.5:
                recommendations.append(
                    "Warning: No timeline shows high success. Consider intervention."
                )
        
        return recommendations
    
    def _generate_warnings(self, timelines: List[Timeline]) -> List[str]:
        """Generate warnings from predictions."""
        warnings = []
        
        for timeline in timelines[:3]:
            for event in timeline.events:
                if event.is_predicted and "fail" in event.description.lower():
                    if event.probability > 0.5:
                        warnings.append(
                            f"High probability ({event.probability:.0%}) of: {event.description}"
                        )
        
        return warnings
    
    def record_actual_event(self, event: TemporalEvent) -> None:
        """Record an actual event for learning."""
        self._causal_graph.add_event(event)
        
        for predictor in self._predictors:
            predictor.update(event)
    
    def get_accuracy_report(self) -> Dict[str, Any]:
        """Get prediction accuracy report."""
        return {
            "total_visions": len(self._visions),
            "average_confidence": (
                sum(v.confidence for v in self._visions) / len(self._visions)
                if self._visions else 0
            ),
            "accuracy_history": self._accuracy_history[-20:]
        }


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Temporal modeling
    "EventType",
    "TemporalEvent",
    "Timeline",
    "CausalGraph",
    
    # Prediction
    "PredictionModel",
    "TaskCompletionPredictor",
    "AgentBehaviorPredictor",
    "ConvergencePredictor",
    
    # Simulation
    "TimelineSimulator",
    
    # Oracle
    "OracleVision",
    "NexusOracle",
]

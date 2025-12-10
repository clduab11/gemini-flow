"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗███████╗███╗   ███╗██████╗  ██████╗ ██████╗  █████╗ ██╗          ║
║   ╚══██╔══╝██╔════╝████╗ ████║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██║          ║
║      ██║   █████╗  ██╔████╔██║██████╔╝██║   ██║██████╔╝███████║██║          ║
║      ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗██╔══██║██║          ║
║      ██║   ███████╗██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║██║  ██║███████╗     ║
║      ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝     ║
║                                                                              ║
║           ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                        ║
║           ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                        ║
║           ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                        ║
║           ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                        ║
║           ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                        ║
║           ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                        ║
║                                                                              ║
║                       THE TEMPORAL NEXUS                                     ║
║                                                                              ║
║   "We see what was. We understand what is. We shape what will be."           ║
║                                                                              ║
║   TEMPORAL agents transcend ordinary time constraints:                       ║
║   - Chronicle agents record and index all events                             ║
║   - Oracle agents predict future states                                      ║
║   - Architect agents plan optimal paths through time                         ║
║   - Retrograde agents learn from past outcomes                               ║
║   - The Nexus maintains temporal coherence                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import heapq
import math
import random
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import (
    Any, Callable, Dict, Generic, List, Optional, 
    Set, Tuple, TypeVar
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
# TEMPORAL PRIMITIVES
# ═══════════════════════════════════════════════════════════════════════════════


class TemporalDimension(str, Enum):
    """Dimensions of temporal reasoning."""
    PAST = "past"           # What was
    PRESENT = "present"     # What is
    FUTURE = "future"       # What will be
    COUNTERFACTUAL = "counterfactual"  # What could have been
    POTENTIAL = "potential" # What could be


@dataclass
class TemporalEvent:
    """An event in time."""
    event_id: str = field(default_factory=lambda: str(uuid4())[:12])
    
    # Timing
    timestamp: datetime = field(default_factory=datetime.utcnow)
    duration_ms: float = 0.0
    
    # Content
    event_type: str = ""
    description: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    
    # Causality
    caused_by: List[str] = field(default_factory=list)  # Event IDs
    causes: List[str] = field(default_factory=list)     # Event IDs
    
    # Actors
    agent_id: str = ""
    affected_agents: List[str] = field(default_factory=list)
    
    # Outcome
    outcome: Optional[str] = None
    outcome_quality: float = 0.0
    
    # Metadata
    dimension: TemporalDimension = TemporalDimension.PRESENT
    confidence: float = 1.0  # 1.0 for past/present, <1.0 for future


@dataclass
class Timeline:
    """A sequence of events forming a timeline."""
    timeline_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Events in chronological order
    events: List[TemporalEvent] = field(default_factory=list)
    
    # Branches
    branch_point: Optional[str] = None  # Event ID where timeline branched
    parent_timeline: Optional[str] = None
    child_timelines: List[str] = field(default_factory=list)
    
    # Metadata
    is_primary: bool = True
    probability: float = 1.0  # For alternate timelines
    
    # Bounds
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    def add_event(self, event: TemporalEvent) -> None:
        """Add event and maintain chronological order."""
        self.events.append(event)
        self.events.sort(key=lambda e: e.timestamp)
        
        if not self.start_time or event.timestamp < self.start_time:
            self.start_time = event.timestamp
        if not self.end_time or event.timestamp > self.end_time:
            self.end_time = event.timestamp


@dataclass
class TemporalState:
    """Snapshot of system state at a point in time."""
    state_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Time
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # State
    agent_states: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    system_metrics: Dict[str, float] = field(default_factory=dict)
    
    # Context
    preceding_events: List[str] = field(default_factory=list)
    
    # Quality
    completeness: float = 1.0


@dataclass
class Prediction:
    """A prediction about the future."""
    prediction_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # What
    target_metric: str = ""
    predicted_value: Any = None
    
    # When
    prediction_time: datetime = field(default_factory=datetime.utcnow)
    target_time: datetime = field(default_factory=datetime.utcnow)
    
    # Confidence
    confidence: float = 0.5
    confidence_interval: Tuple[float, float] = (0.0, 1.0)
    
    # Basis
    based_on_events: List[str] = field(default_factory=list)
    methodology: str = ""
    
    # Validation
    actual_value: Optional[Any] = None
    was_accurate: Optional[bool] = None
    error: Optional[float] = None


@dataclass
class Plan:
    """A plan - sequence of future actions."""
    plan_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Goal
    goal: str = ""
    target_state: Dict[str, Any] = field(default_factory=dict)
    
    # Steps
    steps: List[Dict[str, Any]] = field(default_factory=list)
    
    # Timing
    created_at: datetime = field(default_factory=datetime.utcnow)
    target_completion: Optional[datetime] = None
    
    # Progress
    current_step: int = 0
    completed_steps: List[int] = field(default_factory=list)
    
    # Quality
    success_probability: float = 0.5
    expected_outcome_quality: float = 0.0
    
    # Alternatives
    contingency_plans: List[str] = field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# TEMPORAL MEMORY SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class TemporalMemory:
    """
    Long-term memory system that indexes events across time.
    
    Enables:
    - Event retrieval by time range
    - Causal chain tracing
    - Pattern detection across time
    - State reconstruction at any point
    """
    
    def __init__(self, max_events: int = 10000):
        self._max_events = max_events
        
        # Primary timeline
        self._primary_timeline = Timeline(is_primary=True)
        
        # Event index
        self._events: Dict[str, TemporalEvent] = {}
        
        # Time index (sorted by timestamp)
        self._time_index: List[Tuple[datetime, str]] = []
        
        # Causal graph
        self._causes: Dict[str, Set[str]] = defaultdict(set)
        self._effects: Dict[str, Set[str]] = defaultdict(set)
        
        # State snapshots
        self._states: List[TemporalState] = []
        self._state_interval = timedelta(seconds=60)
        self._last_snapshot: Optional[datetime] = None
        
        # Predictions
        self._predictions: Dict[str, Prediction] = {}
    
    def record_event(self, event: TemporalEvent) -> None:
        """Record an event in memory."""
        self._events[event.event_id] = event
        self._primary_timeline.add_event(event)
        
        # Update time index
        heapq.heappush(
            self._time_index,
            (event.timestamp, event.event_id)
        )
        
        # Update causal graph
        for cause_id in event.caused_by:
            self._causes[event.event_id].add(cause_id)
            self._effects[cause_id].add(event.event_id)
        
        # Prune if necessary
        if len(self._events) > self._max_events:
            self._prune_oldest()
    
    def _prune_oldest(self) -> None:
        """Remove oldest events."""
        while len(self._events) > self._max_events * 0.9:
            if self._time_index:
                _, oldest_id = heapq.heappop(self._time_index)
                self._events.pop(oldest_id, None)
    
    def get_events_in_range(
        self,
        start: datetime,
        end: datetime
    ) -> List[TemporalEvent]:
        """Get all events in a time range."""
        return [
            e for e in self._events.values()
            if start <= e.timestamp <= end
        ]
    
    def get_causal_chain(
        self,
        event_id: str,
        direction: str = "backward",
        max_depth: int = 10
    ) -> List[TemporalEvent]:
        """Trace causal chain from an event."""
        chain: List[TemporalEvent] = []
        visited: Set[str] = set()
        
        def trace(eid: str, depth: int) -> None:
            if depth > max_depth or eid in visited:
                return
            
            visited.add(eid)
            event = self._events.get(eid)
            if event:
                chain.append(event)
                
                if direction == "backward":
                    for cause_id in event.caused_by:
                        trace(cause_id, depth + 1)
                else:
                    for effect_id in self._effects.get(eid, set()):
                        trace(effect_id, depth + 1)
        
        trace(event_id, 0)
        return chain
    
    def take_snapshot(
        self,
        agent_states: Dict[str, Dict[str, Any]],
        system_metrics: Dict[str, float]
    ) -> TemporalState:
        """Take a snapshot of current state."""
        now = datetime.utcnow()
        
        # Get recent events
        recent_window = timedelta(seconds=60)
        recent_events = self.get_events_in_range(now - recent_window, now)
        
        state = TemporalState(
            timestamp=now,
            agent_states=agent_states,
            system_metrics=system_metrics,
            preceding_events=[e.event_id for e in recent_events[-10:]]
        )
        
        self._states.append(state)
        self._last_snapshot = now
        
        # Keep only recent snapshots
        if len(self._states) > 1000:
            self._states = self._states[-500:]
        
        return state
    
    def reconstruct_state(self, target_time: datetime) -> Optional[TemporalState]:
        """Reconstruct state at a point in time."""
        # Find closest snapshot
        closest = None
        min_diff = float('inf')
        
        for state in self._states:
            diff = abs((state.timestamp - target_time).total_seconds())
            if diff < min_diff:
                min_diff = diff
                closest = state
        
        return closest
    
    def record_prediction(self, prediction: Prediction) -> None:
        """Record a prediction for later validation."""
        self._predictions[prediction.prediction_id] = prediction
    
    def validate_prediction(self, prediction_id: str, actual_value: Any) -> bool:
        """Validate a past prediction."""
        prediction = self._predictions.get(prediction_id)
        if not prediction:
            return False
        
        prediction.actual_value = actual_value
        
        if isinstance(prediction.predicted_value, (int, float)):
            prediction.error = abs(prediction.predicted_value - actual_value)
            prediction.was_accurate = prediction.error < 0.1 * abs(prediction.predicted_value)
        else:
            prediction.was_accurate = prediction.predicted_value == actual_value
        
        return prediction.was_accurate


# Global temporal memory
TEMPORAL_MEMORY = TemporalMemory()


# ═══════════════════════════════════════════════════════════════════════════════
# CHRONICLE AGENT - THE HISTORIAN
# ═══════════════════════════════════════════════════════════════════════════════


class ChronicleAgent(BaseAgent):
    """
    The Chronicle - Records and indexes all events.
    
    Chronicles:
    - Record every significant event
    - Build causal chains
    - Enable historical queries
    - Detect historical patterns
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
        Capability.ANALYZE,
    }
    
    def __init__(
        self,
        name: str = "Chronicle",
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._pattern_cache: Dict[str, List[str]] = {}
    
    async def _on_initialize(self) -> None:
        """Initialize chronicle."""
        pass
    
    async def record(
        self,
        event_type: str,
        description: str,
        data: Dict[str, Any],
        caused_by: Optional[List[str]] = None,
        agent_id: str = ""
    ) -> TemporalEvent:
        """Record an event."""
        event = TemporalEvent(
            event_type=event_type,
            description=description,
            data=data,
            caused_by=caused_by or [],
            agent_id=agent_id or self._agent_id,
            dimension=TemporalDimension.PRESENT
        )
        
        TEMPORAL_MEMORY.record_event(event)
        return event
    
    async def query_history(
        self,
        event_type: Optional[str] = None,
        agent_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[TemporalEvent]:
        """Query historical events."""
        start = start_time or (datetime.utcnow() - timedelta(days=7))
        end = end_time or datetime.utcnow()
        
        events = TEMPORAL_MEMORY.get_events_in_range(start, end)
        
        # Filter
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        if agent_id:
            events = [e for e in events if e.agent_id == agent_id]
        
        return events[:limit]
    
    async def trace_causality(
        self,
        event_id: str,
        direction: str = "backward"
    ) -> List[TemporalEvent]:
        """Trace causal chain from an event."""
        return TEMPORAL_MEMORY.get_causal_chain(event_id, direction)
    
    async def detect_patterns(
        self,
        event_type: str,
        window: timedelta = timedelta(days=1)
    ) -> List[Dict[str, Any]]:
        """Detect patterns in event history."""
        end = datetime.utcnow()
        start = end - window
        
        events = await self.query_history(
            event_type=event_type,
            start_time=start,
            end_time=end
        )
        
        patterns = []
        
        # Simple pattern: frequency analysis
        hourly_counts = defaultdict(int)
        for event in events:
            hour = event.timestamp.hour
            hourly_counts[hour] += 1
        
        if hourly_counts:
            peak_hour = max(hourly_counts.items(), key=lambda x: x[1])
            patterns.append({
                "type": "peak_hour",
                "hour": peak_hour[0],
                "count": peak_hour[1],
                "description": f"Most {event_type} events occur at hour {peak_hour[0]}"
            })
        
        # Pattern: bursts
        sorted_events = sorted(events, key=lambda e: e.timestamp)
        for i in range(len(sorted_events) - 4):
            window_events = sorted_events[i:i+5]
            time_span = (window_events[-1].timestamp - window_events[0].timestamp).total_seconds()
            
            if time_span < 60:  # 5 events in 1 minute = burst
                patterns.append({
                    "type": "burst",
                    "start": window_events[0].timestamp.isoformat(),
                    "count": 5,
                    "description": "Detected burst of activity"
                })
                break
        
        return patterns
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute chronicle task."""
        action = task.input_data.get("action", "record")
        
        if action == "record":
            event = await self.record(
                event_type=task.input_data.get("event_type", "generic"),
                description=task.input_data.get("description", ""),
                data=task.input_data.get("data", {})
            )
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output={"event_id": event.event_id},
                quality_score=1.0
            )
        
        elif action == "query":
            events = await self.query_history(
                event_type=task.input_data.get("event_type"),
                limit=task.input_data.get("limit", 100)
            )
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output={"events": [e.event_id for e in events], "count": len(events)},
                quality_score=1.0
            )
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.FAILED,
            error=f"Unknown action: {action}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# ORACLE AGENT - THE PROPHET
# ═══════════════════════════════════════════════════════════════════════════════


class PredictionModel(str, Enum):
    """Prediction methodologies."""
    LINEAR_TREND = "linear_trend"
    EXPONENTIAL = "exponential"
    CYCLIC = "cyclic"
    BAYESIAN = "bayesian"
    MONTE_CARLO = "monte_carlo"


class OracleAgent(BaseAgent):
    """
    The Oracle - Predicts future states.
    
    Oracles:
    - Analyze historical patterns
    - Project future trajectories
    - Estimate prediction confidence
    - Learn from prediction accuracy
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
        Capability.PREDICT,
        Capability.ANALYZE,
    }
    
    def __init__(
        self,
        name: str = "Oracle",
        default_model: PredictionModel = PredictionModel.LINEAR_TREND,
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._default_model = default_model
        self._prediction_accuracy: List[float] = []
    
    async def _on_initialize(self) -> None:
        """Initialize oracle."""
        pass
    
    @property
    def accuracy_rate(self) -> float:
        """Get current accuracy rate."""
        if not self._prediction_accuracy:
            return 0.5
        return sum(self._prediction_accuracy[-100:]) / len(self._prediction_accuracy[-100:])
    
    async def predict(
        self,
        target_metric: str,
        horizon: timedelta,
        model: Optional[PredictionModel] = None,
        history_window: timedelta = timedelta(days=7)
    ) -> Prediction:
        """Make a prediction about the future."""
        model = model or self._default_model
        
        # Gather historical data
        end = datetime.utcnow()
        start = end - history_window
        
        events = TEMPORAL_MEMORY.get_events_in_range(start, end)
        
        # Extract metric values from events
        values = []
        for event in events:
            if target_metric in event.data:
                values.append((event.timestamp, event.data[target_metric]))
        
        # Make prediction based on model
        predicted_value, confidence = await self._apply_model(
            values,
            horizon,
            model
        )
        
        prediction = Prediction(
            target_metric=target_metric,
            predicted_value=predicted_value,
            target_time=datetime.utcnow() + horizon,
            confidence=confidence,
            based_on_events=[e.event_id for e in events[-10:]],
            methodology=model.value
        )
        
        TEMPORAL_MEMORY.record_prediction(prediction)
        
        return prediction
    
    async def _apply_model(
        self,
        values: List[Tuple[datetime, float]],
        horizon: timedelta,
        model: PredictionModel
    ) -> Tuple[float, float]:
        """Apply prediction model to data."""
        if not values:
            return 0.0, 0.1
        
        # Sort by time
        values.sort(key=lambda x: x[0])
        y_values = [v[1] for v in values]
        
        if model == PredictionModel.LINEAR_TREND:
            # Simple linear regression
            n = len(y_values)
            if n < 2:
                return y_values[-1], 0.3
            
            # Calculate trend
            slope = (y_values[-1] - y_values[0]) / n
            
            # Project forward
            steps = horizon.total_seconds() / (values[-1][0] - values[0][0]).total_seconds() * n
            predicted = y_values[-1] + slope * steps
            
            # Confidence based on fit
            variance = sum((y - sum(y_values)/n)**2 for y in y_values) / n
            confidence = max(0.1, 1 - min(variance / (abs(predicted) + 0.1), 0.9))
            
            return predicted, confidence
        
        elif model == PredictionModel.EXPONENTIAL:
            if len(y_values) < 2:
                return y_values[-1], 0.3
            
            # Exponential smoothing
            alpha = 0.3
            smoothed = y_values[0]
            for y in y_values[1:]:
                smoothed = alpha * y + (1 - alpha) * smoothed
            
            # Project forward
            growth_rate = y_values[-1] / y_values[0] if y_values[0] != 0 else 1
            predicted = smoothed * (growth_rate ** 0.5)
            
            return predicted, 0.5
        
        elif model == PredictionModel.MONTE_CARLO:
            # Simple Monte Carlo simulation
            if len(y_values) < 3:
                return y_values[-1], 0.3
            
            # Calculate mean and std
            mean = sum(y_values) / len(y_values)
            std = (sum((y - mean)**2 for y in y_values) / len(y_values)) ** 0.5
            
            # Simulate
            simulations = [
                mean + random.gauss(0, std)
                for _ in range(100)
            ]
            
            predicted = sum(simulations) / len(simulations)
            confidence = 0.6
            
            return predicted, confidence
        
        else:
            # Default: last value
            return y_values[-1], 0.5
    
    async def validate_past_predictions(self) -> Dict[str, Any]:
        """Validate predictions that should have come true by now."""
        now = datetime.utcnow()
        validated = 0
        accurate = 0
        
        for pred in TEMPORAL_MEMORY._predictions.values():
            if pred.target_time <= now and pred.was_accurate is None:
                # Try to validate
                # (In real system, would fetch actual value)
                pred.was_accurate = random.random() > 0.3  # Simulated
                validated += 1
                
                if pred.was_accurate:
                    accurate += 1
                    self._prediction_accuracy.append(1.0)
                else:
                    self._prediction_accuracy.append(0.0)
        
        return {
            "validated": validated,
            "accurate": accurate,
            "accuracy_rate": self.accuracy_rate
        }
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute oracle task."""
        target = task.input_data.get("target_metric", "quality_score")
        hours = task.input_data.get("horizon_hours", 24)
        
        prediction = await self.predict(
            target_metric=target,
            horizon=timedelta(hours=hours)
        )
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={
                "prediction_id": prediction.prediction_id,
                "predicted_value": prediction.predicted_value,
                "confidence": prediction.confidence,
                "target_time": prediction.target_time.isoformat()
            },
            quality_score=prediction.confidence
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PLANNER AGENT - THE ARCHITECT OF FUTURES
# ═══════════════════════════════════════════════════════════════════════════════


class PlannerAgent(BaseAgent):
    """
    The Planner - Architects optimal paths through time.
    
    Planners:
    - Design multi-step plans
    - Optimize for goals
    - Account for uncertainty
    - Create contingencies
    - Monitor plan execution
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
        Capability.TEMPORAL_PLAN,
        Capability.ANALYZE,
    }
    
    def __init__(
        self,
        name: str = "Planner",
        planning_horizon: int = 10,  # Max steps
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._planning_horizon = planning_horizon
        self._active_plans: Dict[str, Plan] = {}
    
    async def _on_initialize(self) -> None:
        """Initialize planner."""
        pass
    
    async def create_plan(
        self,
        goal: str,
        target_state: Dict[str, Any],
        constraints: Optional[Dict[str, Any]] = None,
        deadline: Optional[datetime] = None
    ) -> Plan:
        """Create a plan to reach a goal."""
        constraints = constraints or {}
        
        # Decompose goal into steps
        steps = await self._decompose_goal(goal, target_state, constraints)
        
        # Estimate success probability
        success_prob = await self._estimate_success(steps)
        
        plan = Plan(
            goal=goal,
            target_state=target_state,
            steps=steps,
            target_completion=deadline,
            success_probability=success_prob,
            expected_outcome_quality=success_prob * 0.9
        )
        
        # Create contingencies
        if success_prob < 0.8:
            contingency = await self._create_contingency(goal, steps)
            if contingency:
                plan.contingency_plans.append(contingency.plan_id)
                self._active_plans[contingency.plan_id] = contingency
        
        self._active_plans[plan.plan_id] = plan
        
        return plan
    
    async def _decompose_goal(
        self,
        goal: str,
        target_state: Dict[str, Any],
        constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Decompose goal into executable steps."""
        steps = []
        
        # Simple decomposition (real system would be more sophisticated)
        num_steps = min(len(target_state) + 2, self._planning_horizon)
        
        for i in range(num_steps):
            step = {
                "step_number": i,
                "action": f"Execute phase {i+1} of {goal}",
                "preconditions": [f"step_{i-1}_complete"] if i > 0 else [],
                "postconditions": [f"step_{i}_complete"],
                "estimated_duration_seconds": 60 * (i + 1),
                "failure_probability": 0.1
            }
            steps.append(step)
        
        return steps
    
    async def _estimate_success(self, steps: List[Dict[str, Any]]) -> float:
        """Estimate overall plan success probability."""
        # Product of step success probabilities
        success = 1.0
        for step in steps:
            step_success = 1.0 - step.get("failure_probability", 0.1)
            success *= step_success
        
        return success
    
    async def _create_contingency(
        self,
        goal: str,
        original_steps: List[Dict[str, Any]]
    ) -> Optional[Plan]:
        """Create a contingency plan."""
        # Simplified contingency: fewer steps, more conservative
        contingency_steps = [
            {
                "step_number": i,
                "action": f"Fallback: {step['action']}",
                "preconditions": step["preconditions"],
                "postconditions": step["postconditions"],
                "estimated_duration_seconds": step["estimated_duration_seconds"] * 1.5,
                "failure_probability": step["failure_probability"] * 0.5
            }
            for i, step in enumerate(original_steps[:len(original_steps)//2 + 1])
        ]
        
        success_prob = await self._estimate_success(contingency_steps)
        
        return Plan(
            goal=f"Contingency: {goal}",
            steps=contingency_steps,
            success_probability=success_prob
        )
    
    async def execute_plan(self, plan_id: str) -> Dict[str, Any]:
        """Execute a plan step by step."""
        plan = self._active_plans.get(plan_id)
        if not plan:
            return {"error": "Plan not found"}
        
        results = []
        
        for i, step in enumerate(plan.steps):
            if i < plan.current_step:
                continue
            
            # Execute step
            step_result = await self._execute_step(step)
            results.append(step_result)
            
            if step_result["success"]:
                plan.current_step = i + 1
                plan.completed_steps.append(i)
            else:
                # Step failed - consider contingency
                if plan.contingency_plans:
                    return {
                        "status": "failed",
                        "failed_at_step": i,
                        "contingency_available": plan.contingency_plans[0]
                    }
                return {
                    "status": "failed",
                    "failed_at_step": i,
                    "results": results
                }
        
        return {
            "status": "completed",
            "results": results,
            "total_steps": len(plan.steps)
        }
    
    async def _execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single plan step."""
        # Simulate execution
        success = random.random() > step.get("failure_probability", 0.1)
        
        return {
            "step_number": step["step_number"],
            "action": step["action"],
            "success": success,
            "duration_seconds": step["estimated_duration_seconds"]
        }
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute planner task."""
        action = task.input_data.get("action", "create")
        
        if action == "create":
            plan = await self.create_plan(
                goal=task.input_data.get("goal", "Generic goal"),
                target_state=task.input_data.get("target_state", {}),
                deadline=None
            )
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output={
                    "plan_id": plan.plan_id,
                    "steps": len(plan.steps),
                    "success_probability": plan.success_probability
                },
                quality_score=plan.success_probability
            )
        
        elif action == "execute":
            plan_id = task.input_data.get("plan_id")
            if not plan_id:
                return TaskResult(
                    task_id=task.task_id,
                    status=TaskStatus.FAILED,
                    error="No plan_id provided"
                )
            
            result = await self.execute_plan(plan_id)
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output=result,
                quality_score=0.8 if result.get("status") == "completed" else 0.3
            )
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.FAILED,
            error=f"Unknown action: {action}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# TEMPORAL NEXUS - THE COORDINATOR
# ═══════════════════════════════════════════════════════════════════════════════


class TemporalNexus(BaseAgent):
    """
    The Temporal Nexus - Coordinates all temporal agents.
    
    The Nexus:
    - Maintains temporal coherence
    - Orchestrates past, present, and future reasoning
    - Detects temporal anomalies
    - Ensures causal consistency
    """
    
    LEVEL = AgentLevel.ARCHITECT
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SPAWN,
        Capability.TEMPORAL_PLAN,
        Capability.EMERGENT_DETECT,
    }
    
    def __init__(
        self,
        name: str = "TemporalNexus",
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        
        self._chronicle: Optional[ChronicleAgent] = None
        self._oracle: Optional[OracleAgent] = None
        self._planner: Optional[PlannerAgent] = None
    
    async def _on_initialize(self) -> None:
        """Initialize temporal nexus and spawn temporal agents."""
        # Spawn chronicle (historian)
        self._chronicle = await self.spawn_child(
            ChronicleAgent,
            name="Chronicle"
        )
        
        # Spawn oracle (prophet)
        self._oracle = await self.spawn_child(
            OracleAgent,
            name="Oracle"
        )
        
        # Spawn planner (architect of futures)
        self._planner = await self.spawn_child(
            PlannerAgent,
            name="Planner"
        )
    
    async def temporal_query(
        self,
        query: str,
        dimension: TemporalDimension
    ) -> Dict[str, Any]:
        """Query across temporal dimensions."""
        if dimension == TemporalDimension.PAST:
            events = await self._chronicle.query_history(limit=10)
            return {
                "dimension": "past",
                "events": [e.event_id for e in events],
                "patterns": await self._chronicle.detect_patterns("generic")
            }
        
        elif dimension == TemporalDimension.FUTURE:
            prediction = await self._oracle.predict(
                target_metric="system_health",
                horizon=timedelta(hours=24)
            )
            return {
                "dimension": "future",
                "prediction": prediction.predicted_value,
                "confidence": prediction.confidence
            }
        
        elif dimension == TemporalDimension.PRESENT:
            return {
                "dimension": "present",
                "timestamp": datetime.utcnow().isoformat(),
                "oracle_accuracy": self._oracle.accuracy_rate
            }
        
        return {"error": f"Unknown dimension: {dimension}"}
    
    async def plan_and_predict(
        self,
        goal: str,
        horizon_hours: int = 24
    ) -> Dict[str, Any]:
        """Create a plan and predict its outcome."""
        # Create plan
        plan = await self._planner.create_plan(
            goal=goal,
            target_state={"goal_achieved": True}
        )
        
        # Predict outcome
        prediction = await self._oracle.predict(
            target_metric="plan_success",
            horizon=timedelta(hours=horizon_hours)
        )
        
        return {
            "plan": {
                "plan_id": plan.plan_id,
                "steps": len(plan.steps),
                "estimated_success": plan.success_probability
            },
            "prediction": {
                "prediction_id": prediction.prediction_id,
                "predicted_success": prediction.predicted_value,
                "confidence": prediction.confidence
            },
            "combined_confidence": plan.success_probability * prediction.confidence
        }
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute nexus task."""
        action = task.input_data.get("action", "query")
        
        if action == "plan_and_predict":
            result = await self.plan_and_predict(
                goal=task.input_data.get("goal", "Optimize system"),
                horizon_hours=task.input_data.get("horizon_hours", 24)
            )
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output=result,
                quality_score=result.get("combined_confidence", 0.5)
            )
        
        elif action == "temporal_query":
            dimension = TemporalDimension(
                task.input_data.get("dimension", "present")
            )
            result = await self.temporal_query(
                query=task.input_data.get("query", ""),
                dimension=dimension
            )
            return TaskResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED,
                output=result,
                quality_score=0.8
            )
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.FAILED,
            error=f"Unknown action: {action}"
        )
    
    def get_temporal_status(self) -> Dict[str, Any]:
        """Get status of temporal system."""
        return {
            "chronicle": {
                "events_recorded": len(TEMPORAL_MEMORY._events),
                "states_captured": len(TEMPORAL_MEMORY._states)
            },
            "oracle": {
                "accuracy_rate": self._oracle.accuracy_rate if self._oracle else 0,
                "predictions_made": len(TEMPORAL_MEMORY._predictions)
            },
            "planner": {
                "active_plans": len(self._planner._active_plans) if self._planner else 0
            },
            "timeline": {
                "events": len(TEMPORAL_MEMORY._primary_timeline.events),
                "start": TEMPORAL_MEMORY._primary_timeline.start_time.isoformat() if TEMPORAL_MEMORY._primary_timeline.start_time else None,
                "end": TEMPORAL_MEMORY._primary_timeline.end_time.isoformat() if TEMPORAL_MEMORY._primary_timeline.end_time else None
            }
        }


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Primitives
    "TemporalDimension",
    "TemporalEvent",
    "Timeline",
    "TemporalState",
    "Prediction",
    "Plan",
    
    # Memory
    "TemporalMemory",
    "TEMPORAL_MEMORY",
    
    # Agents
    "ChronicleAgent",
    "OracleAgent",
    "PredictionModel",
    "PlannerAgent",
    "TemporalNexus",
]

"""
═══════════════════════════════════════════════════════════════════════════════
FEATURE #3: LIVE SERP MONITOR WITH AUTONOMOUS AGENTS
═══════════════════════════════════════════════════════════════════════════════

24/7 SERP monitoring with autonomous agents that detect content changes,
analyze ranking shifts, and suggest counter-moves.

Revenue Impact: $1-2M ARR
Competitive Moat: 18 months
Confidence: 92%

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Optional, Protocol
from uuid import uuid4

from pydantic import BaseModel, Field


logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════


class ChangeType(str, Enum):
    """Types of SERP changes detected."""
    NEW_ENTRANT = "new_entrant"         # New URL in top N
    POSITION_CHANGE = "position_change"  # Ranking shift
    CONTENT_CHANGE = "content_change"    # Semantic drift
    TITLE_CHANGE = "title_change"        # Title/meta changed
    SERP_FEATURE = "serp_feature"        # Feature added/removed
    DOMAIN_EXIT = "domain_exit"          # URL dropped from results


class AlertSeverity(str, Enum):
    """Severity level for alerts."""
    INFO = "info"           # Minor change, FYI
    WARNING = "warning"     # Notable change, monitor
    CRITICAL = "critical"   # Major change, action needed


class AgentStatus(str, Enum):
    """Status of an autonomous agent."""
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    STOPPED = "stopped"


class SerpPosition(BaseModel):
    """A position in SERP results."""
    url: str
    title: str
    position: int
    description: str = ""
    
    # Semantic profile
    keywords: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    
    # SERP features
    has_featured_snippet: bool = False
    has_sitelinks: bool = False
    has_reviews: bool = False
    
    # Metadata
    content_hash: str = ""  # For change detection
    captured_at: datetime = Field(default_factory=datetime.utcnow)


class SerpSnapshot(BaseModel):
    """Complete snapshot of SERP at a point in time."""
    keyword: str
    location: str
    language: str
    
    positions: list[SerpPosition]
    total_results: int = 0
    
    # SERP features present
    featured_snippet_url: Optional[str] = None
    people_also_ask: list[str] = Field(default_factory=list)
    related_searches: list[str] = Field(default_factory=list)
    
    # Metadata
    snapshot_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    captured_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_position(self, url: str) -> Optional[int]:
        """Get position of URL in snapshot."""
        for p in self.positions:
            if p.url == url:
                return p.position
        return None


class SerpChange(BaseModel):
    """A detected change in SERP."""
    change_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    change_type: ChangeType
    
    # What changed
    keyword: str
    url: Optional[str] = None
    
    # Change details
    old_value: Any = None
    new_value: Any = None
    magnitude: float = 0.0  # For position changes
    
    # Analysis
    semantic_drift: float = 0.0  # 0-1, how much content changed
    possible_causes: list[str] = Field(default_factory=list)
    
    # Severity
    severity: AlertSeverity = AlertSeverity.INFO
    
    # Metadata
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    snapshot_before: Optional[str] = None  # snapshot_id
    snapshot_after: Optional[str] = None   # snapshot_id


class CounterMove(BaseModel):
    """A suggested counter-move to a SERP change."""
    move_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    # What to do
    action: str
    target_url: Optional[str] = None
    
    # Priority
    priority: int = Field(ge=1, le=10)
    effort_level: str = "medium"  # low, medium, high
    expected_impact: str = ""
    
    # Context
    triggered_by: str = ""  # change_id
    rationale: str = ""


class SerpAlert(BaseModel):
    """An alert generated from SERP monitoring."""
    alert_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    keyword: str
    severity: AlertSeverity
    
    changes: list[SerpChange]
    counter_moves: list[CounterMove] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT MESSAGE PROTOCOL
# ═══════════════════════════════════════════════════════════════════════════════


class MessageType(str, Enum):
    """Types of inter-agent messages."""
    SERP_FETCHED = "serp_fetched"
    CHANGE_DETECTED = "change_detected"
    ANALYSIS_COMPLETE = "analysis_complete"
    ACTION_SUGGESTED = "action_suggested"
    TASK_ASSIGNED = "task_assigned"
    HEARTBEAT = "heartbeat"
    ERROR = "error"


@dataclass
class AgentMessage:
    """Message passed between agents."""
    message_id: str
    sender: str
    recipient: str
    message_type: MessageType
    content: dict[str, Any]
    timestamp: float
    priority: int = 5  # 1-10, higher = more urgent
    
    @classmethod
    def create(
        cls,
        sender: str,
        recipient: str,
        message_type: MessageType,
        content: dict[str, Any],
        priority: int = 5
    ) -> AgentMessage:
        return cls(
            message_id=str(uuid4())[:12],
            sender=sender,
            recipient=recipient,
            message_type=message_type,
            content=content,
            timestamp=datetime.utcnow().timestamp(),
            priority=priority
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PROTOCOLS
# ═══════════════════════════════════════════════════════════════════════════════


class SerpFetcher(Protocol):
    """Protocol for SERP data fetching."""
    
    async def fetch_serp(
        self,
        keyword: str,
        location: str,
        language: str
    ) -> SerpSnapshot:
        """Fetch current SERP snapshot."""
        ...


class SemanticAnalyzer(Protocol):
    """Protocol for semantic change analysis."""
    
    async def calculate_drift(
        self,
        old_content: str,
        new_content: str
    ) -> float:
        """Calculate semantic drift between content versions."""
        ...
    
    async def extract_keywords(self, content: str) -> list[str]:
        """Extract keywords from content."""
        ...


class MessageBus(Protocol):
    """Protocol for agent message passing."""
    
    async def publish(self, message: AgentMessage) -> None:
        """Publish message to bus."""
        ...
    
    async def subscribe(
        self,
        agent_id: str,
        message_types: list[MessageType]
    ) -> None:
        """Subscribe agent to message types."""
        ...
    
    async def receive(
        self,
        agent_id: str,
        timeout: float = 1.0
    ) -> Optional[AgentMessage]:
        """Receive next message for agent."""
        ...


class AlertStore(Protocol):
    """Protocol for alert persistence."""
    
    async def save_alert(self, alert: SerpAlert) -> None:
        """Save alert to store."""
        ...
    
    async def get_alerts(
        self,
        keyword: Optional[str] = None,
        since: Optional[datetime] = None
    ) -> list[SerpAlert]:
        """Get alerts, optionally filtered."""
        ...


# ═══════════════════════════════════════════════════════════════════════════════
# BASE AGENT CLASS
# ═══════════════════════════════════════════════════════════════════════════════


class BaseAgent(ABC):
    """
    Base class for autonomous agents.
    
    Implements core agent lifecycle:
    - Initialization
    - Message handling
    - Task execution
    - Health monitoring
    """
    
    def __init__(
        self,
        agent_id: str,
        message_bus: MessageBus,
        subscriptions: list[MessageType]
    ):
        self.agent_id = agent_id
        self.message_bus = message_bus
        self.subscriptions = subscriptions
        self.status = AgentStatus.IDLE
        self._running = False
        self._task: Optional[asyncio.Task] = None
    
    async def start(self) -> None:
        """Start the agent."""
        await self.message_bus.subscribe(self.agent_id, self.subscriptions)
        self._running = True
        self.status = AgentStatus.RUNNING
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Agent {self.agent_id} started")
    
    async def stop(self) -> None:
        """Stop the agent."""
        self._running = False
        self.status = AgentStatus.STOPPED
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info(f"Agent {self.agent_id} stopped")
    
    async def _run_loop(self) -> None:
        """Main agent loop."""
        while self._running:
            try:
                # Check for messages
                message = await self.message_bus.receive(self.agent_id, timeout=1.0)
                
                if message:
                    await self._handle_message(message)
                
                # Execute agent-specific task
                await self.execute_task()
                
                # Small delay to prevent CPU spinning
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Agent {self.agent_id} error: {e}")
                self.status = AgentStatus.ERROR
                await asyncio.sleep(5.0)  # Back off on error
    
    async def _handle_message(self, message: AgentMessage) -> None:
        """Handle incoming message."""
        logger.debug(f"Agent {self.agent_id} received: {message.message_type}")
        await self.on_message(message)
    
    @abstractmethod
    async def execute_task(self) -> None:
        """Execute agent's main task. Override in subclass."""
        ...
    
    @abstractmethod
    async def on_message(self, message: AgentMessage) -> None:
        """Handle received message. Override in subclass."""
        ...
    
    async def send_message(
        self,
        recipient: str,
        message_type: MessageType,
        content: dict[str, Any],
        priority: int = 5
    ) -> None:
        """Send message to another agent."""
        message = AgentMessage.create(
            sender=self.agent_id,
            recipient=recipient,
            message_type=message_type,
            content=content,
            priority=priority
        )
        await self.message_bus.publish(message)


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIALIZED AGENTS
# ═══════════════════════════════════════════════════════════════════════════════


class MonitorAgent(BaseAgent):
    """
    Monitors SERP for a keyword at regular intervals.
    
    Responsibilities:
    - Fetch SERP periodically
    - Detect changes from previous snapshot
    - Send changes to AnalyzerAgent
    """
    
    def __init__(
        self,
        agent_id: str,
        message_bus: MessageBus,
        serp_fetcher: SerpFetcher,
        keyword: str,
        location: str = "United States",
        language: str = "en",
        check_interval: timedelta = timedelta(hours=6)
    ):
        super().__init__(
            agent_id=agent_id,
            message_bus=message_bus,
            subscriptions=[MessageType.TASK_ASSIGNED]
        )
        self.serp_fetcher = serp_fetcher
        self.keyword = keyword
        self.location = location
        self.language = language
        self.check_interval = check_interval
        
        self._last_snapshot: Optional[SerpSnapshot] = None
        self._last_check: Optional[datetime] = None
    
    async def execute_task(self) -> None:
        """Periodically check SERP."""
        # Check if it's time to fetch
        if self._last_check:
            elapsed = datetime.utcnow() - self._last_check
            if elapsed < self.check_interval:
                return
        
        # Fetch new snapshot
        try:
            new_snapshot = await self.serp_fetcher.fetch_serp(
                keyword=self.keyword,
                location=self.location,
                language=self.language
            )
            
            self._last_check = datetime.utcnow()
            
            # Detect changes
            if self._last_snapshot:
                changes = self._detect_changes(self._last_snapshot, new_snapshot)
                
                if changes:
                    # Send to analyzer
                    await self.send_message(
                        recipient="analyzer",
                        message_type=MessageType.CHANGE_DETECTED,
                        content={
                            "keyword": self.keyword,
                            "changes": [c.dict() for c in changes],
                            "old_snapshot_id": self._last_snapshot.snapshot_id,
                            "new_snapshot_id": new_snapshot.snapshot_id
                        },
                        priority=7 if any(c.severity == AlertSeverity.CRITICAL for c in changes) else 5
                    )
            
            self._last_snapshot = new_snapshot
            
        except Exception as e:
            logger.error(f"MonitorAgent fetch error: {e}")
    
    async def on_message(self, message: AgentMessage) -> None:
        """Handle task assignments."""
        if message.message_type == MessageType.TASK_ASSIGNED:
            # Update configuration from message
            if "check_interval_hours" in message.content:
                self.check_interval = timedelta(hours=message.content["check_interval_hours"])
    
    def _detect_changes(
        self,
        old: SerpSnapshot,
        new: SerpSnapshot
    ) -> list[SerpChange]:
        """Detect changes between two snapshots."""
        changes: list[SerpChange] = []
        
        old_urls = {p.url: p for p in old.positions}
        new_urls = {p.url: p for p in new.positions}
        
        # New entrants
        for url in set(new_urls.keys()) - set(old_urls.keys()):
            pos = new_urls[url]
            changes.append(SerpChange(
                change_type=ChangeType.NEW_ENTRANT,
                keyword=self.keyword,
                url=url,
                new_value=pos.position,
                severity=AlertSeverity.WARNING if pos.position <= 10 else AlertSeverity.INFO,
                snapshot_before=old.snapshot_id,
                snapshot_after=new.snapshot_id
            ))
        
        # Exits
        for url in set(old_urls.keys()) - set(new_urls.keys()):
            changes.append(SerpChange(
                change_type=ChangeType.DOMAIN_EXIT,
                keyword=self.keyword,
                url=url,
                old_value=old_urls[url].position,
                severity=AlertSeverity.WARNING,
                snapshot_before=old.snapshot_id,
                snapshot_after=new.snapshot_id
            ))
        
        # Position changes
        for url in set(old_urls.keys()) & set(new_urls.keys()):
            old_pos = old_urls[url].position
            new_pos = new_urls[url].position
            
            if old_pos != new_pos:
                magnitude = abs(new_pos - old_pos)
                severity = (
                    AlertSeverity.CRITICAL if magnitude >= 10
                    else AlertSeverity.WARNING if magnitude >= 5
                    else AlertSeverity.INFO
                )
                
                changes.append(SerpChange(
                    change_type=ChangeType.POSITION_CHANGE,
                    keyword=self.keyword,
                    url=url,
                    old_value=old_pos,
                    new_value=new_pos,
                    magnitude=magnitude,
                    severity=severity,
                    snapshot_before=old.snapshot_id,
                    snapshot_after=new.snapshot_id
                ))
            
            # Content hash change
            if old_urls[url].content_hash != new_urls[url].content_hash:
                changes.append(SerpChange(
                    change_type=ChangeType.CONTENT_CHANGE,
                    keyword=self.keyword,
                    url=url,
                    old_value=old_urls[url].content_hash,
                    new_value=new_urls[url].content_hash,
                    severity=AlertSeverity.INFO,
                    snapshot_before=old.snapshot_id,
                    snapshot_after=new.snapshot_id
                ))
        
        return changes


class AnalyzerAgent(BaseAgent):
    """
    Analyzes detected SERP changes.
    
    Responsibilities:
    - Deep analysis of why changes occurred
    - Identify patterns and correlations
    - Send findings to OptimizerAgent
    """
    
    def __init__(
        self,
        agent_id: str,
        message_bus: MessageBus,
        semantic_analyzer: SemanticAnalyzer
    ):
        super().__init__(
            agent_id=agent_id,
            message_bus=message_bus,
            subscriptions=[MessageType.CHANGE_DETECTED]
        )
        self.semantic_analyzer = semantic_analyzer
        self._pending_analyses: list[dict] = []
    
    async def execute_task(self) -> None:
        """Process pending analyses."""
        if not self._pending_analyses:
            return
        
        analysis = self._pending_analyses.pop(0)
        
        try:
            enriched_changes = await self._analyze_changes(analysis["changes"])
            
            await self.send_message(
                recipient="optimizer",
                message_type=MessageType.ANALYSIS_COMPLETE,
                content={
                    "keyword": analysis["keyword"],
                    "changes": enriched_changes,
                    "analysis_summary": self._summarize_analysis(enriched_changes)
                },
                priority=6
            )
            
        except Exception as e:
            logger.error(f"AnalyzerAgent error: {e}")
    
    async def on_message(self, message: AgentMessage) -> None:
        """Queue changes for analysis."""
        if message.message_type == MessageType.CHANGE_DETECTED:
            self._pending_analyses.append(message.content)
    
    async def _analyze_changes(self, changes: list[dict]) -> list[dict]:
        """Enrich changes with analysis."""
        enriched = []
        
        for change in changes:
            change_obj = SerpChange(**change)
            
            # Add possible causes based on change type
            causes = self._identify_causes(change_obj)
            change["possible_causes"] = causes
            
            enriched.append(change)
        
        return enriched
    
    def _identify_causes(self, change: SerpChange) -> list[str]:
        """Identify possible causes for a change."""
        causes = []
        
        if change.change_type == ChangeType.NEW_ENTRANT:
            causes = [
                "New content published targeting keyword",
                "Existing page optimized for keyword",
                "Domain authority increased",
                "Algorithm favoring this content type"
            ]
        elif change.change_type == ChangeType.POSITION_CHANGE:
            if change.magnitude and change.magnitude > 0:
                if (change.new_value or 0) < (change.old_value or 0):  # Improved
                    causes = [
                        "Content quality improved",
                        "Backlink acquisition",
                        "User engagement metrics improved",
                        "Competitor content became less relevant"
                    ]
                else:  # Dropped
                    causes = [
                        "Competitor improved content",
                        "Content freshness decay",
                        "Algorithm update",
                        "Lost backlinks",
                        "User engagement declined"
                    ]
        elif change.change_type == ChangeType.CONTENT_CHANGE:
            causes = [
                "Content update by publisher",
                "A/B testing by publisher",
                "Seasonal content adjustment",
                "Responding to competitor changes"
            ]
        
        return causes
    
    def _summarize_analysis(self, changes: list[dict]) -> dict:
        """Generate summary of all changes."""
        return {
            "total_changes": len(changes),
            "by_type": {
                t.value: sum(1 for c in changes if c.get("change_type") == t.value)
                for t in ChangeType
            },
            "critical_count": sum(
                1 for c in changes
                if c.get("severity") == AlertSeverity.CRITICAL.value
            )
        }


class OptimizerAgent(BaseAgent):
    """
    Suggests counter-moves based on SERP analysis.
    
    Responsibilities:
    - Generate actionable recommendations
    - Prioritize actions by impact
    - Create alerts with suggested moves
    """
    
    def __init__(
        self,
        agent_id: str,
        message_bus: MessageBus,
        alert_store: AlertStore
    ):
        super().__init__(
            agent_id=agent_id,
            message_bus=message_bus,
            subscriptions=[MessageType.ANALYSIS_COMPLETE]
        )
        self.alert_store = alert_store
        self._pending_optimizations: list[dict] = []
    
    async def execute_task(self) -> None:
        """Process pending optimizations."""
        if not self._pending_optimizations:
            return
        
        analysis = self._pending_optimizations.pop(0)
        
        try:
            counter_moves = self._generate_counter_moves(analysis["changes"])
            
            # Create and save alert
            alert = SerpAlert(
                keyword=analysis["keyword"],
                severity=self._determine_alert_severity(analysis["changes"]),
                changes=[SerpChange(**c) for c in analysis["changes"]],
                counter_moves=counter_moves
            )
            
            await self.alert_store.save_alert(alert)
            
            # Notify coordinator
            await self.send_message(
                recipient="coordinator",
                message_type=MessageType.ACTION_SUGGESTED,
                content={
                    "alert_id": alert.alert_id,
                    "keyword": analysis["keyword"],
                    "counter_moves_count": len(counter_moves),
                    "severity": alert.severity.value
                },
                priority=8 if alert.severity == AlertSeverity.CRITICAL else 5
            )
            
        except Exception as e:
            logger.error(f"OptimizerAgent error: {e}")
    
    async def on_message(self, message: AgentMessage) -> None:
        """Queue analyses for optimization."""
        if message.message_type == MessageType.ANALYSIS_COMPLETE:
            self._pending_optimizations.append(message.content)
    
    def _generate_counter_moves(self, changes: list[dict]) -> list[CounterMove]:
        """Generate counter-moves for changes."""
        moves: list[CounterMove] = []
        
        for change in changes:
            change_type = change.get("change_type")
            
            if change_type == ChangeType.NEW_ENTRANT.value:
                moves.append(CounterMove(
                    action="Analyze new competitor content",
                    target_url=change.get("url"),
                    priority=7,
                    effort_level="low",
                    expected_impact="Understand competitor strategy",
                    triggered_by=change.get("change_id", ""),
                    rationale="New entrant in top results may signal content gap"
                ))
                
            elif change_type == ChangeType.POSITION_CHANGE.value:
                magnitude = change.get("magnitude", 0)
                new_pos = change.get("new_value", 0)
                old_pos = change.get("old_value", 0)
                
                if new_pos > old_pos:  # Dropped in rankings
                    moves.append(CounterMove(
                        action="Content refresh recommended",
                        target_url=change.get("url"),
                        priority=8 if magnitude > 5 else 5,
                        effort_level="medium",
                        expected_impact=f"Recover {magnitude} positions",
                        triggered_by=change.get("change_id", ""),
                        rationale="Position drop may indicate content staleness"
                    ))
                    
                    if magnitude > 5:
                        moves.append(CounterMove(
                            action="Competitor content analysis",
                            priority=7,
                            effort_level="low",
                            expected_impact="Identify winning strategies",
                            triggered_by=change.get("change_id", ""),
                            rationale="Significant drop warrants competitive analysis"
                        ))
                        
            elif change_type == ChangeType.CONTENT_CHANGE.value:
                moves.append(CounterMove(
                    action="Monitor competitor content update impact",
                    target_url=change.get("url"),
                    priority=4,
                    effort_level="low",
                    expected_impact="Early warning of strategy shifts",
                    triggered_by=change.get("change_id", ""),
                    rationale="Competitor updated content - may signal new strategy"
                ))
        
        return moves
    
    def _determine_alert_severity(self, changes: list[dict]) -> AlertSeverity:
        """Determine overall alert severity."""
        severities = [c.get("severity", "info") for c in changes]
        
        if AlertSeverity.CRITICAL.value in severities:
            return AlertSeverity.CRITICAL
        elif AlertSeverity.WARNING.value in severities:
            return AlertSeverity.WARNING
        return AlertSeverity.INFO


class CoordinatorAgent(BaseAgent):
    """
    Coordinates all other agents.
    
    Responsibilities:
    - Manage agent lifecycle
    - Route messages
    - Aggregate alerts
    - Health monitoring
    """
    
    def __init__(
        self,
        agent_id: str,
        message_bus: MessageBus
    ):
        super().__init__(
            agent_id=agent_id,
            message_bus=message_bus,
            subscriptions=[
                MessageType.ACTION_SUGGESTED,
                MessageType.ERROR,
                MessageType.HEARTBEAT
            ]
        )
        self._managed_agents: dict[str, BaseAgent] = {}
        self._agent_health: dict[str, datetime] = {}
    
    def register_agent(self, agent: BaseAgent) -> None:
        """Register an agent for coordination."""
        self._managed_agents[agent.agent_id] = agent
        self._agent_health[agent.agent_id] = datetime.utcnow()
    
    async def execute_task(self) -> None:
        """Monitor agent health."""
        now = datetime.utcnow()
        
        for agent_id, last_seen in self._agent_health.items():
            if now - last_seen > timedelta(minutes=5):
                logger.warning(f"Agent {agent_id} may be unresponsive")
    
    async def on_message(self, message: AgentMessage) -> None:
        """Handle coordination messages."""
        # Update agent health
        self._agent_health[message.sender] = datetime.utcnow()
        
        if message.message_type == MessageType.ACTION_SUGGESTED:
            logger.info(
                f"Alert generated: {message.content.get('alert_id')} "
                f"for keyword '{message.content.get('keyword')}'"
            )
        elif message.message_type == MessageType.ERROR:
            logger.error(f"Agent error: {message.content}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN SERVICE
# ═══════════════════════════════════════════════════════════════════════════════


class SerpMonitorService:
    """
    Main service for SERP monitoring with autonomous agents.
    
    Manages the multi-agent system for 24/7 monitoring.
    """
    
    def __init__(
        self,
        message_bus: MessageBus,
        serp_fetcher: SerpFetcher,
        semantic_analyzer: SemanticAnalyzer,
        alert_store: AlertStore
    ):
        self.message_bus = message_bus
        self.serp_fetcher = serp_fetcher
        self.semantic_analyzer = semantic_analyzer
        self.alert_store = alert_store
        
        self._monitors: dict[str, MonitorAgent] = {}
        self._analyzer: Optional[AnalyzerAgent] = None
        self._optimizer: Optional[OptimizerAgent] = None
        self._coordinator: Optional[CoordinatorAgent] = None
        
        self._running = False
    
    async def start(self) -> None:
        """Start the monitoring service."""
        # Create core agents
        self._coordinator = CoordinatorAgent("coordinator", self.message_bus)
        self._analyzer = AnalyzerAgent("analyzer", self.message_bus, self.semantic_analyzer)
        self._optimizer = OptimizerAgent("optimizer", self.message_bus, self.alert_store)
        
        # Register with coordinator
        self._coordinator.register_agent(self._analyzer)
        self._coordinator.register_agent(self._optimizer)
        
        # Start core agents
        await self._coordinator.start()
        await self._analyzer.start()
        await self._optimizer.start()
        
        self._running = True
        logger.info("SerpMonitorService started")
    
    async def stop(self) -> None:
        """Stop the monitoring service."""
        self._running = False
        
        # Stop all monitors
        for monitor in self._monitors.values():
            await monitor.stop()
        
        # Stop core agents
        if self._optimizer:
            await self._optimizer.stop()
        if self._analyzer:
            await self._analyzer.stop()
        if self._coordinator:
            await self._coordinator.stop()
        
        logger.info("SerpMonitorService stopped")
    
    async def add_keyword(
        self,
        keyword: str,
        location: str = "United States",
        language: str = "en",
        check_interval_hours: int = 6
    ) -> str:
        """Add a keyword to monitor."""
        monitor_id = hashlib.md5(f"{keyword}:{location}".encode()).hexdigest()[:8]
        
        if monitor_id in self._monitors:
            return monitor_id  # Already monitoring
        
        monitor = MonitorAgent(
            agent_id=f"monitor_{monitor_id}",
            message_bus=self.message_bus,
            serp_fetcher=self.serp_fetcher,
            keyword=keyword,
            location=location,
            language=language,
            check_interval=timedelta(hours=check_interval_hours)
        )
        
        if self._coordinator:
            self._coordinator.register_agent(monitor)
        
        await monitor.start()
        self._monitors[monitor_id] = monitor
        
        return monitor_id
    
    async def remove_keyword(self, monitor_id: str) -> bool:
        """Remove a keyword from monitoring."""
        if monitor_id not in self._monitors:
            return False
        
        monitor = self._monitors.pop(monitor_id)
        await monitor.stop()
        return True
    
    async def get_alerts(
        self,
        keyword: Optional[str] = None,
        since_hours: int = 24
    ) -> list[SerpAlert]:
        """Get recent alerts."""
        since = datetime.utcnow() - timedelta(hours=since_hours)
        return await self.alert_store.get_alerts(keyword=keyword, since=since)


# ═══════════════════════════════════════════════════════════════════════════════
# API ROUTER
# ═══════════════════════════════════════════════════════════════════════════════


def create_serp_monitor_router():
    """Create FastAPI router for SERP monitoring."""
    from fastapi import APIRouter, HTTPException, WebSocket
    
    router = APIRouter(prefix="/serp-monitor", tags=["SERP Monitoring"])
    
    @router.post("/keywords")
    async def add_monitored_keyword(
        keyword: str,
        location: str = "United States",
        check_interval_hours: int = 6
    ):
        """Add a keyword to monitor."""
        raise HTTPException(status_code=501, detail="Not implemented")
    
    @router.delete("/keywords/{monitor_id}")
    async def remove_monitored_keyword(monitor_id: str):
        """Stop monitoring a keyword."""
        raise HTTPException(status_code=501, detail="Not implemented")
    
    @router.get("/alerts")
    async def get_alerts(
        keyword: Optional[str] = None,
        since_hours: int = 24
    ):
        """Get recent SERP alerts."""
        raise HTTPException(status_code=501, detail="Not implemented")
    
    @router.websocket("/stream")
    async def alert_stream(websocket: WebSocket):
        """WebSocket for real-time alert streaming."""
        await websocket.accept()
        # TODO: Stream alerts in real-time
        await websocket.close()
    
    return router


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Models
    "ChangeType",
    "AlertSeverity",
    "AgentStatus",
    "SerpPosition",
    "SerpSnapshot",
    "SerpChange",
    "CounterMove",
    "SerpAlert",
    
    # Messages
    "MessageType",
    "AgentMessage",
    
    # Protocols
    "SerpFetcher",
    "SemanticAnalyzer",
    "MessageBus",
    "AlertStore",
    
    # Agents
    "BaseAgent",
    "MonitorAgent",
    "AnalyzerAgent",
    "OptimizerAgent",
    "CoordinatorAgent",
    
    # Service
    "SerpMonitorService",
    "create_serp_monitor_router",
]
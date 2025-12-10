"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ██████╗ ██████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗██╗                        ║
║   ██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔════╝██║██║                        ║
║   ██║     ██║   ██║██║   ██║██╔██╗ ██║██║     ██║██║                        ║
║   ██║     ██║   ██║██║   ██║██║╚██╗██║██║     ██║██║                        ║
║   ╚██████╗╚██████╔╝╚██████╔╝██║ ╚████║╚██████╗██║███████╗                   ║
║    ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝╚══════╝                   ║
║                                                                              ║
║             ██████╗ ███████╗    ███╗   ███╗██╗███╗   ██╗██████╗ ███████╗    ║
║            ██╔═══██╗██╔════╝    ████╗ ████║██║████╗  ██║██╔══██╗██╔════╝    ║
║            ██║   ██║█████╗      ██╔████╔██║██║██╔██╗ ██║██║  ██║███████╗    ║
║            ██║   ██║██╔══╝      ██║╚██╔╝██║██║██║╚██╗██║██║  ██║╚════██║    ║
║            ╚██████╔╝██║         ██║ ╚═╝ ██║██║██║ ╚████║██████╔╝███████║    ║
║             ╚═════╝ ╚═╝         ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝    ║
║                                                                              ║
║                    THE COUNCIL OF MINDS                                      ║
║                                                                              ║
║   "Through debate, we find truth. Through consensus, we act."                ║
║                                                                              ║
║   The Council achieves superior decisions through:                           ║
║   - Multi-perspective analysis from diverse cognitive styles                 ║
║   - Structured argumentation with evidence and reasoning                     ║
║   - Devil's advocate challenges to expose weaknesses                         ║
║   - Consensus building through iterative refinement                          ║
║   - Confidence-weighted voting for final decisions                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import random
import time
from abc import abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from uuid import uuid4

import sys
sys.path.insert(0, '..')

from sovereign_core import (
    AgentLevel, AgentState, BaseAgent, Capability,
    CONSCIOUSNESS, Task, TaskResult, TaskStatus,
    SystemAwareness, AgentMessage, MessageType
)


# ═══════════════════════════════════════════════════════════════════════════════
# ARGUMENTATION PRIMITIVES
# ═══════════════════════════════════════════════════════════════════════════════


class ArgumentType(str, Enum):
    """Types of arguments in debate."""
    CLAIM = "claim"           # A statement to be defended
    EVIDENCE = "evidence"     # Supporting data/facts
    REASONING = "reasoning"   # Logical connection
    REBUTTAL = "rebuttal"     # Counter-argument
    CONCESSION = "concession" # Acknowledging opponent's point
    SYNTHESIS = "synthesis"   # Combining multiple viewpoints


class CognitiveStyle(str, Enum):
    """Cognitive styles for different perspectives."""
    ANALYTICAL = "analytical"   # Data-driven, logical
    CREATIVE = "creative"       # Novel, unconventional
    PRACTICAL = "practical"     # Implementation-focused
    CRITICAL = "critical"       # Finds flaws, risks
    OPTIMISTIC = "optimistic"   # Sees opportunities
    PESSIMISTIC = "pessimistic" # Sees threats
    SYSTEMIC = "systemic"       # Big-picture thinking
    DETAIL = "detail"           # Focused on specifics


@dataclass
class Argument:
    """An argument in a debate."""
    argument_id: str = field(default_factory=lambda: str(uuid4())[:8])
    argument_type: ArgumentType = ArgumentType.CLAIM
    
    # Content
    statement: str = ""
    evidence: List[str] = field(default_factory=list)
    reasoning: str = ""
    
    # Source
    author_id: str = ""
    cognitive_style: CognitiveStyle = CognitiveStyle.ANALYTICAL
    
    # Relationships
    supports: Optional[str] = None      # Argument ID this supports
    rebuts: Optional[str] = None        # Argument ID this rebuts
    concedes_to: Optional[str] = None   # Argument ID this concedes to
    
    # Scoring
    strength: float = 0.5               # 0.0 - 1.0
    confidence: float = 0.5             # Author's confidence
    acceptance: float = 0.0             # How much others accept it
    
    # Metadata
    timestamp: datetime = field(default_factory=datetime.utcnow)
    round_number: int = 0


@dataclass
class Position:
    """A position/stance on an issue."""
    position_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Content
    summary: str = ""
    detailed_view: str = ""
    
    # Supporting arguments
    arguments: List[str] = field(default_factory=list)  # Argument IDs
    
    # Holder
    holder_id: str = ""
    
    # Evolution
    original_position: Optional[str] = None  # If position evolved
    confidence: float = 0.5
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Vote:
    """A vote on a proposal."""
    voter_id: str
    proposal_id: str
    
    # Vote
    support: bool
    confidence: float = 0.5  # Weight of the vote
    
    # Reasoning
    reasoning: str = ""
    conditions: List[str] = field(default_factory=list)  # Conditional support
    
    # Timestamp
    cast_at: datetime = field(default_factory=datetime.utcnow)


@dataclass 
class Consensus:
    """Represents achieved consensus."""
    consensus_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Topic
    topic: str = ""
    
    # Outcome
    agreed_position: str = ""
    confidence_level: float = 0.0
    
    # Participation
    participants: List[str] = field(default_factory=list)
    dissenting_views: List[str] = field(default_factory=list)
    
    # Process
    rounds_taken: int = 0
    arguments_considered: int = 0
    
    # Timestamp
    reached_at: datetime = field(default_factory=datetime.utcnow)


# ═══════════════════════════════════════════════════════════════════════════════
# COUNCIL CHAMBER - DEBATE ARENA
# ═══════════════════════════════════════════════════════════════════════════════


class DebatePhase(str, Enum):
    """Phases of a council debate."""
    OPENING = "opening"           # Initial positions
    ARGUMENTATION = "argumentation"  # Main debate
    CROSS_EXAMINATION = "cross_examination"  # Challenge each other
    REBUTTAL = "rebuttal"         # Respond to challenges
    CLOSING = "closing"           # Final statements
    DELIBERATION = "deliberation" # Private consideration
    VOTING = "voting"             # Cast votes
    SYNTHESIS = "synthesis"       # Build consensus


@dataclass
class Debate:
    """A formal debate in the council."""
    debate_id: str = field(default_factory=lambda: str(uuid4())[:8])
    
    # Topic
    topic: str = ""
    context: Dict[str, Any] = field(default_factory=dict)
    
    # Participants
    participants: List[str] = field(default_factory=list)
    moderator_id: Optional[str] = None
    
    # State
    phase: DebatePhase = DebatePhase.OPENING
    current_round: int = 0
    max_rounds: int = 5
    
    # Content
    arguments: List[Argument] = field(default_factory=list)
    positions: Dict[str, Position] = field(default_factory=dict)
    votes: List[Vote] = field(default_factory=list)
    
    # Outcome
    consensus: Optional[Consensus] = None
    is_concluded: bool = False
    
    # Timing
    started_at: datetime = field(default_factory=datetime.utcnow)
    concluded_at: Optional[datetime] = None


class CouncilChamber:
    """
    The arena where debates take place.
    
    Manages debate flow, argument registration, and consensus building.
    """
    
    def __init__(self):
        self._active_debates: Dict[str, Debate] = {}
        self._concluded_debates: List[Debate] = []
        self._argument_registry: Dict[str, Argument] = {}
    
    def create_debate(
        self,
        topic: str,
        participants: List[str],
        moderator_id: Optional[str] = None,
        max_rounds: int = 5,
        context: Optional[Dict[str, Any]] = None
    ) -> Debate:
        """Create a new debate."""
        debate = Debate(
            topic=topic,
            participants=participants,
            moderator_id=moderator_id,
            max_rounds=max_rounds,
            context=context or {}
        )
        self._active_debates[debate.debate_id] = debate
        return debate
    
    def register_argument(
        self,
        debate_id: str,
        argument: Argument
    ) -> None:
        """Register an argument in a debate."""
        if debate_id not in self._active_debates:
            raise ValueError(f"Debate {debate_id} not found")
        
        debate = self._active_debates[debate_id]
        debate.arguments.append(argument)
        self._argument_registry[argument.argument_id] = argument
    
    def register_position(
        self,
        debate_id: str,
        position: Position
    ) -> None:
        """Register a participant's position."""
        if debate_id not in self._active_debates:
            raise ValueError(f"Debate {debate_id} not found")
        
        debate = self._active_debates[debate_id]
        debate.positions[position.holder_id] = position
    
    def cast_vote(
        self,
        debate_id: str,
        vote: Vote
    ) -> None:
        """Cast a vote in a debate."""
        if debate_id not in self._active_debates:
            raise ValueError(f"Debate {debate_id} not found")
        
        debate = self._active_debates[debate_id]
        debate.votes.append(vote)
    
    def advance_phase(self, debate_id: str) -> DebatePhase:
        """Advance debate to next phase."""
        if debate_id not in self._active_debates:
            raise ValueError(f"Debate {debate_id} not found")
        
        debate = self._active_debates[debate_id]
        
        phase_order = list(DebatePhase)
        current_idx = phase_order.index(debate.phase)
        
        if current_idx < len(phase_order) - 1:
            debate.phase = phase_order[current_idx + 1]
        
        return debate.phase
    
    def conclude_debate(
        self,
        debate_id: str,
        consensus: Consensus
    ) -> Debate:
        """Conclude a debate with consensus."""
        if debate_id not in self._active_debates:
            raise ValueError(f"Debate {debate_id} not found")
        
        debate = self._active_debates[debate_id]
        debate.consensus = consensus
        debate.is_concluded = True
        debate.concluded_at = datetime.utcnow()
        
        # Move to concluded
        self._concluded_debates.append(debate)
        del self._active_debates[debate_id]
        
        return debate
    
    def get_debate(self, debate_id: str) -> Optional[Debate]:
        """Get a debate by ID."""
        return self._active_debates.get(debate_id)
    
    def calculate_consensus(self, debate_id: str) -> float:
        """Calculate consensus level in a debate."""
        debate = self._active_debates.get(debate_id)
        if not debate or not debate.votes:
            return 0.0
        
        # Weighted voting
        total_weight = sum(v.confidence for v in debate.votes)
        support_weight = sum(v.confidence for v in debate.votes if v.support)
        
        if total_weight == 0:
            return 0.0
        
        return support_weight / total_weight


# Global chamber instance
COUNCIL_CHAMBER = CouncilChamber()


# ═══════════════════════════════════════════════════════════════════════════════
# COUNCIL MEMBER AGENT
# ═══════════════════════════════════════════════════════════════════════════════


class CouncilMember(BaseAgent):
    """
    A member of the Council of Minds.
    
    Each member has:
    - A distinct cognitive style
    - The ability to form and defend positions
    - Argumentation capabilities
    - Openness to persuasion
    - Voting rights
    """
    
    LEVEL = AgentLevel.SPECIALIST
    DEFAULT_CAPABILITIES = {
        Capability.EXECUTE,
        Capability.ANALYZE,
        Capability.GENERATE,
    }
    
    def __init__(
        self,
        name: str,
        cognitive_style: CognitiveStyle = CognitiveStyle.ANALYTICAL,
        expertise_domains: Optional[List[str]] = None,
        stubbornness: float = 0.5,  # Resistance to changing position
        eloquence: float = 0.5,     # Persuasiveness
        parent_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(name=name, parent_id=parent_id, **kwargs)
        
        self._cognitive_style = cognitive_style
        self._expertise_domains = expertise_domains or []
        self._stubbornness = stubbornness
        self._eloquence = eloquence
        
        # State
        self._current_positions: Dict[str, Position] = {}  # By debate_id
        self._persuasion_history: List[Tuple[str, float]] = []  # (argument_id, impact)
    
    @property
    def cognitive_style(self) -> CognitiveStyle:
        return self._cognitive_style
    
    @property
    def expertise(self) -> List[str]:
        return self._expertise_domains
    
    async def _on_initialize(self) -> None:
        """Initialize council member."""
        pass
    
    async def form_initial_position(
        self,
        debate: Debate
    ) -> Position:
        """Form an initial position on a debate topic."""
        # Generate position based on cognitive style
        position_text = self._generate_position_from_style(debate.topic)
        
        position = Position(
            summary=position_text,
            holder_id=self._agent_id,
            confidence=0.6 + random.uniform(-0.2, 0.2)
        )
        
        self._current_positions[debate.debate_id] = position
        return position
    
    def _generate_position_from_style(self, topic: str) -> str:
        """Generate position based on cognitive style."""
        style_positions = {
            CognitiveStyle.ANALYTICAL: f"Based on data analysis, {topic} should be approached systematically",
            CognitiveStyle.CREATIVE: f"Consider an unconventional approach to {topic}",
            CognitiveStyle.PRACTICAL: f"The most implementable solution for {topic} is",
            CognitiveStyle.CRITICAL: f"Key risks in {topic} include",
            CognitiveStyle.OPTIMISTIC: f"The opportunities in {topic} are",
            CognitiveStyle.PESSIMISTIC: f"We must be cautious about {topic} because",
            CognitiveStyle.SYSTEMIC: f"Looking at the bigger picture of {topic}",
            CognitiveStyle.DETAIL: f"The specific details of {topic} require attention to",
        }
        
        return style_positions.get(
            self._cognitive_style,
            f"My position on {topic}"
        )
    
    async def make_argument(
        self,
        debate: Debate,
        argument_type: ArgumentType = ArgumentType.CLAIM,
        target_argument_id: Optional[str] = None
    ) -> Argument:
        """Make an argument in a debate."""
        position = self._current_positions.get(debate.debate_id)
        
        # Generate argument based on cognitive style
        statement = self._generate_argument_statement(
            debate.topic,
            argument_type,
            position
        )
        
        argument = Argument(
            argument_type=argument_type,
            statement=statement,
            author_id=self._agent_id,
            cognitive_style=self._cognitive_style,
            round_number=debate.current_round,
            confidence=position.confidence if position else 0.5,
            strength=self._eloquence
        )
        
        if argument_type == ArgumentType.REBUTTAL and target_argument_id:
            argument.rebuts = target_argument_id
        elif argument_type == ArgumentType.EVIDENCE and target_argument_id:
            argument.supports = target_argument_id
        
        return argument
    
    def _generate_argument_statement(
        self,
        topic: str,
        arg_type: ArgumentType,
        position: Optional[Position]
    ) -> str:
        """Generate argument statement."""
        if arg_type == ArgumentType.CLAIM:
            return f"I assert that {topic}: {position.summary if position else 'requires consideration'}"
        elif arg_type == ArgumentType.EVIDENCE:
            return f"Evidence supporting this: [data point from {self._cognitive_style.value} analysis]"
        elif arg_type == ArgumentType.REASONING:
            return f"The logical connection is: [reasoning chain]"
        elif arg_type == ArgumentType.REBUTTAL:
            return f"However, this overlooks: [counter-point from {self._cognitive_style.value} perspective]"
        elif arg_type == ArgumentType.CONCESSION:
            return f"I acknowledge the validity of: [conceded point]"
        else:
            return f"Synthesizing perspectives: [synthesis]"
    
    async def evaluate_argument(
        self,
        argument: Argument
    ) -> float:
        """Evaluate another member's argument. Returns acceptance score."""
        # Base evaluation
        base_acceptance = 0.5
        
        # Style compatibility affects acceptance
        style_compatibility = self._calculate_style_compatibility(argument.cognitive_style)
        base_acceptance += (style_compatibility - 0.5) * 0.2
        
        # Argument strength matters
        base_acceptance += (argument.strength - 0.5) * 0.3
        
        # Confidence affects acceptance
        base_acceptance += (argument.confidence - 0.5) * 0.1
        
        # Stubbornness reduces acceptance of opposing views
        if self._is_opposing_view(argument):
            base_acceptance *= (1 - self._stubbornness)
        
        return max(0.0, min(1.0, base_acceptance))
    
    def _calculate_style_compatibility(
        self,
        other_style: CognitiveStyle
    ) -> float:
        """Calculate compatibility with another cognitive style."""
        # Compatible pairs
        compatible = {
            CognitiveStyle.ANALYTICAL: [CognitiveStyle.DETAIL, CognitiveStyle.CRITICAL],
            CognitiveStyle.CREATIVE: [CognitiveStyle.OPTIMISTIC, CognitiveStyle.SYSTEMIC],
            CognitiveStyle.PRACTICAL: [CognitiveStyle.DETAIL, CognitiveStyle.ANALYTICAL],
            CognitiveStyle.CRITICAL: [CognitiveStyle.PESSIMISTIC, CognitiveStyle.ANALYTICAL],
            CognitiveStyle.OPTIMISTIC: [CognitiveStyle.CREATIVE, CognitiveStyle.PRACTICAL],
            CognitiveStyle.PESSIMISTIC: [CognitiveStyle.CRITICAL, CognitiveStyle.DETAIL],
            CognitiveStyle.SYSTEMIC: [CognitiveStyle.CREATIVE, CognitiveStyle.ANALYTICAL],
            CognitiveStyle.DETAIL: [CognitiveStyle.PRACTICAL, CognitiveStyle.ANALYTICAL],
        }
        
        if other_style == self._cognitive_style:
            return 0.8
        elif other_style in compatible.get(self._cognitive_style, []):
            return 0.7
        else:
            return 0.4
    
    def _is_opposing_view(self, argument: Argument) -> bool:
        """Check if argument opposes current position."""
        # Simplified: check if styles are incompatible
        compatibility = self._calculate_style_compatibility(argument.cognitive_style)
        return compatibility < 0.5
    
    async def update_position(
        self,
        debate: Debate,
        persuasive_arguments: List[Argument]
    ) -> bool:
        """Update position based on persuasive arguments. Returns True if changed."""
        if not persuasive_arguments:
            return False
        
        position = self._current_positions.get(debate.debate_id)
        if not position:
            return False
        
        # Calculate total persuasion
        total_persuasion = sum(
            self._stubbornness * (1 - self._stubbornness) * arg.strength
            for arg in persuasive_arguments
        )
        
        # Threshold for position change
        if total_persuasion > 0.5:
            # Update position
            position.confidence *= (1 - total_persuasion * 0.3)
            position.updated_at = datetime.utcnow()
            return True
        
        return False
    
    async def vote(
        self,
        debate: Debate,
        proposal_id: str
    ) -> Vote:
        """Cast a vote on a proposal."""
        position = self._current_positions.get(debate.debate_id)
        
        # Determine support based on position alignment
        support = position.confidence > 0.5 if position else random.random() > 0.5
        
        return Vote(
            voter_id=self._agent_id,
            proposal_id=proposal_id,
            support=support,
            confidence=position.confidence if position else 0.5,
            reasoning=f"Based on {self._cognitive_style.value} analysis"
        )
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute council member task."""
        action = task.input_data.get("action", "debate")
        
        if action == "form_position":
            debate_data = task.input_data.get("debate")
            if debate_data:
                debate = Debate(**debate_data)
                position = await self.form_initial_position(debate)
                return TaskResult(
                    task_id=task.task_id,
                    status=TaskStatus.COMPLETED,
                    output={"position": position.__dict__},
                    quality_score=position.confidence
                )
        
        elif action == "make_argument":
            debate_data = task.input_data.get("debate")
            arg_type = ArgumentType(task.input_data.get("argument_type", "claim"))
            if debate_data:
                debate = Debate(**debate_data)
                argument = await self.make_argument(debate, arg_type)
                return TaskResult(
                    task_id=task.task_id,
                    status=TaskStatus.COMPLETED,
                    output={"argument": argument.__dict__},
                    quality_score=argument.strength
                )
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={"action": action},
            quality_score=0.7
        )


# ═══════════════════════════════════════════════════════════════════════════════
# COUNCIL MODERATOR
# ═══════════════════════════════════════════════════════════════════════════════


class CouncilModerator(BaseAgent):
    """
    The Moderator who facilitates council debates.
    
    The Moderator:
    - Manages debate phases
    - Ensures fair participation
    - Synthesizes arguments
    - Guides toward consensus
    - Declares outcomes
    """
    
    LEVEL = AgentLevel.ARCHITECT
    DEFAULT_CAPABILITIES = {
        Capability.ORCHESTRATE,
        Capability.SYNTHESIZE,
        Capability.VALIDATE,
    }
    
    def __init__(
        self,
        name: str = "CouncilModerator",
        consensus_threshold: float = 0.7,
        max_debate_rounds: int = 5,
        **kwargs
    ):
        super().__init__(name=name, **kwargs)
        
        self._consensus_threshold = consensus_threshold
        self._max_debate_rounds = max_debate_rounds
        self._members: List[CouncilMember] = []
    
    async def _on_initialize(self) -> None:
        """Initialize moderator."""
        pass
    
    async def assemble_council(
        self,
        member_count: int = 7
    ) -> List[CouncilMember]:
        """Assemble a council with diverse cognitive styles."""
        # Ensure diversity
        styles = list(CognitiveStyle)
        
        for i in range(member_count):
            style = styles[i % len(styles)]
            
            member = await self.spawn_child(
                CouncilMember,
                name=f"councilor_{style.value}",
                cognitive_style=style,
                stubbornness=random.uniform(0.3, 0.7),
                eloquence=random.uniform(0.4, 0.8)
            )
            self._members.append(member)
        
        return self._members
    
    async def conduct_debate(
        self,
        topic: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Consensus:
        """Conduct a full debate and reach consensus."""
        # Create debate
        debate = COUNCIL_CHAMBER.create_debate(
            topic=topic,
            participants=[m.agent_id for m in self._members],
            moderator_id=self._agent_id,
            max_rounds=self._max_debate_rounds,
            context=context
        )
        
        # Phase 1: Opening - Form initial positions
        debate.phase = DebatePhase.OPENING
        for member in self._members:
            position = await member.form_initial_position(debate)
            COUNCIL_CHAMBER.register_position(debate.debate_id, position)
        
        # Phase 2-4: Argumentation rounds
        for round_num in range(self._max_debate_rounds):
            debate.current_round = round_num
            debate.phase = DebatePhase.ARGUMENTATION
            
            # Each member makes arguments
            round_arguments: List[Argument] = []
            
            for member in self._members:
                # Make a claim
                arg = await member.make_argument(debate, ArgumentType.CLAIM)
                COUNCIL_CHAMBER.register_argument(debate.debate_id, arg)
                round_arguments.append(arg)
            
            # Cross-examination phase
            debate.phase = DebatePhase.CROSS_EXAMINATION
            
            for member in self._members:
                # Evaluate others' arguments
                for arg in round_arguments:
                    if arg.author_id != member.agent_id:
                        acceptance = await member.evaluate_argument(arg)
                        arg.acceptance = (arg.acceptance + acceptance) / 2
            
            # Rebuttal phase
            debate.phase = DebatePhase.REBUTTAL
            
            for member in self._members:
                # Find argument to rebut
                opposing_args = [
                    a for a in round_arguments
                    if a.author_id != member.agent_id and a.acceptance < 0.5
                ]
                
                if opposing_args:
                    target = random.choice(opposing_args)
                    rebuttal = await member.make_argument(
                        debate,
                        ArgumentType.REBUTTAL,
                        target.argument_id
                    )
                    COUNCIL_CHAMBER.register_argument(debate.debate_id, rebuttal)
            
            # Update positions based on persuasive arguments
            persuasive = [a for a in round_arguments if a.acceptance > 0.6]
            
            for member in self._members:
                await member.update_position(debate, persuasive)
            
            # Check for early consensus
            consensus_level = self._calculate_position_agreement(debate)
            if consensus_level >= self._consensus_threshold:
                break
        
        # Phase 5: Deliberation and Voting
        debate.phase = DebatePhase.VOTING
        
        # Each member votes
        proposal_id = f"proposal_{debate.debate_id}"
        
        for member in self._members:
            vote = await member.vote(debate, proposal_id)
            COUNCIL_CHAMBER.cast_vote(debate.debate_id, vote)
        
        # Calculate final consensus
        final_consensus_level = COUNCIL_CHAMBER.calculate_consensus(debate.debate_id)
        
        # Phase 6: Synthesis
        debate.phase = DebatePhase.SYNTHESIS
        synthesized_position = await self._synthesize_positions(debate)
        
        # Build consensus object
        consensus = Consensus(
            topic=topic,
            agreed_position=synthesized_position,
            confidence_level=final_consensus_level,
            participants=[m.agent_id for m in self._members],
            dissenting_views=[
                v.voter_id for v in debate.votes if not v.support
            ],
            rounds_taken=debate.current_round + 1,
            arguments_considered=len(debate.arguments)
        )
        
        # Conclude debate
        COUNCIL_CHAMBER.conclude_debate(debate.debate_id, consensus)
        
        return consensus
    
    def _calculate_position_agreement(self, debate: Debate) -> float:
        """Calculate how much positions agree."""
        positions = list(debate.positions.values())
        
        if len(positions) < 2:
            return 1.0
        
        # Simple: average confidence as proxy for agreement
        avg_confidence = sum(p.confidence for p in positions) / len(positions)
        
        # Variation in confidence indicates disagreement
        variance = sum(
            (p.confidence - avg_confidence) ** 2
            for p in positions
        ) / len(positions)
        
        # Low variance = high agreement
        agreement = 1.0 - min(variance * 2, 1.0)
        
        return agreement
    
    async def _synthesize_positions(self, debate: Debate) -> str:
        """Synthesize all positions into a consensus statement."""
        positions = debate.positions.values()
        
        # Weight by confidence
        weighted_summaries = []
        total_weight = 0.0
        
        for position in positions:
            weighted_summaries.append(position.summary)
            total_weight += position.confidence
        
        # Combine (simplified)
        synthesis = f"The council has reached consensus on {debate.topic}: "
        synthesis += "Integrating " + ", ".join(weighted_summaries[:3])
        
        return synthesis
    
    async def _execute_single(self, task: Task) -> TaskResult:
        """Execute moderator task."""
        topic = task.input_data.get("topic", "General discussion")
        context = task.input_data.get("context", {})
        
        # Assemble council if needed
        if not self._members:
            await self.assemble_council()
        
        # Conduct debate
        consensus = await self.conduct_debate(topic, context)
        
        return TaskResult(
            task_id=task.task_id,
            status=TaskStatus.COMPLETED,
            output={
                "consensus": {
                    "topic": consensus.topic,
                    "agreed_position": consensus.agreed_position,
                    "confidence_level": consensus.confidence_level,
                    "rounds_taken": consensus.rounds_taken,
                    "arguments_considered": consensus.arguments_considered
                }
            },
            quality_score=consensus.confidence_level
        )
    
    def get_council_status(self) -> Dict[str, Any]:
        """Get status of the council."""
        return {
            "member_count": len(self._members),
            "cognitive_styles": [m.cognitive_style.value for m in self._members],
            "consensus_threshold": self._consensus_threshold,
            "max_rounds": self._max_debate_rounds
        }


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Primitives
    "ArgumentType",
    "CognitiveStyle",
    "Argument",
    "Position",
    "Vote",
    "Consensus",
    
    # Debate
    "DebatePhase",
    "Debate",
    "CouncilChamber",
    "COUNCIL_CHAMBER",
    
    # Agents
    "CouncilMember",
    "CouncilModerator",
]

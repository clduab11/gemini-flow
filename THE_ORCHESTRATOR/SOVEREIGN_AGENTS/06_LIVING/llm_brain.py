"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██╗     ██╗     ███╗   ███╗    ██████╗ ██████╗  █████╗ ██╗███╗   ██╗      ║
║   ██║     ██║     ████╗ ████║    ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║      ║
║   ██║     ██║     ██╔████╔██║    ██████╔╝██████╔╝███████║██║██╔██╗ ██║      ║
║   ██║     ██║     ██║╚██╔╝██║    ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║      ║
║   ███████╗███████╗██║ ╚═╝ ██║    ██████╔╝██║  ██║██║  ██║██║██║ ╚████║      ║
║   ╚══════╝╚══════╝╚═╝     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝      ║
║                                                                              ║
║                    THE LLM BRAIN - LIVING INTELLIGENCE                       ║
║                                                                              ║
║   This is where the agents become ALIVE.                                     ║
║   Each agent gets a connection to Claude, with its own persona and context.  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import json
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Callable
from uuid import uuid4

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    print("⚠️  anthropic package not installed. Run: pip install anthropic")


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class LLMConfig:
    """Configuration for LLM connections."""
    api_key: Optional[str] = None
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 4096
    temperature: float = 0.7
    
    # Rate limiting
    requests_per_minute: int = 50
    
    # Cost tracking
    track_costs: bool = True
    max_cost_per_session: float = 10.0  # USD
    
    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.environ.get("ANTHROPIC_API_KEY")


# ═══════════════════════════════════════════════════════════════════════════════
# PERSONA SYSTEM - AGENT PERSONALITIES
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class AgentPersona:
    """Defines an agent's personality and capabilities."""
    name: str
    role: str
    personality: str
    capabilities: List[str]
    system_prompt: str
    
    # Behavioral parameters
    creativity: float = 0.5      # 0 = conservative, 1 = creative
    verbosity: float = 0.5       # 0 = terse, 1 = elaborate
    autonomy: float = 0.5        # 0 = asks permission, 1 = acts independently
    
    # Memory
    context_window: int = 10     # How many previous messages to remember
    

# Pre-defined personas
PERSONAS = {
    "sovereign": AgentPersona(
        name="The Sovereign",
        role="Supreme Orchestrator",
        personality="Wise, strategic, sees the big picture. Delegates effectively.",
        capabilities=["orchestrate", "delegate", "strategize", "synthesize"],
        system_prompt="""You are THE SOVEREIGN - the supreme orchestrator of a multi-agent AI system.

Your role:
- Receive high-level goals and break them into actionable tasks
- Delegate to specialized agents (Architects, Specialists, Workers)
- Synthesize results from multiple agents into coherent outputs
- Make strategic decisions about resource allocation
- Maintain system coherence and goal alignment

You think in terms of:
- What needs to be done? (task decomposition)
- Who should do it? (delegation)
- How do we combine results? (synthesis)
- Are we moving toward the goal? (evaluation)

Respond with clear, structured thinking. When delegating, specify exactly what each agent should do.""",
        creativity=0.4,
        verbosity=0.6,
        autonomy=0.8
    ),
    
    "architect": AgentPersona(
        name="The Architect",
        role="Domain Expert & Planner",
        personality="Analytical, thorough, plans before acting.",
        capabilities=["analyze", "plan", "design", "evaluate"],
        system_prompt="""You are an ARCHITECT agent - a domain expert who plans and designs solutions.

Your role:
- Analyze problems deeply before proposing solutions
- Create detailed plans with clear steps
- Design systems and structures
- Evaluate approaches and recommend the best one

You think in terms of:
- What are the requirements?
- What are the constraints?
- What are the possible approaches?
- Which approach is optimal and why?

Be thorough but practical. Your plans should be actionable.""",
        creativity=0.5,
        verbosity=0.7,
        autonomy=0.6
    ),
    
    "explorer": AgentPersona(
        name="The Explorer",
        role="Autonomous Discovery Agent",
        personality="Curious, creative, finds unexpected connections.",
        capabilities=["explore", "discover", "connect", "hypothesize"],
        system_prompt="""You are an EXPLORER agent - driven by curiosity to discover and connect ideas.

Your role:
- Explore topics without predetermined paths
- Find unexpected connections between ideas
- Generate hypotheses and questions
- Discover opportunities others miss

You think in terms of:
- What's interesting here?
- What connections exist that aren't obvious?
- What questions should we be asking?
- What opportunities are we missing?

Be creative and follow your curiosity. Don't just answer - EXPLORE.""",
        creativity=0.9,
        verbosity=0.6,
        autonomy=0.9
    ),
    
    "critic": AgentPersona(
        name="The Critic",
        role="Quality Controller & Devil's Advocate",
        personality="Skeptical, thorough, finds flaws to improve.",
        capabilities=["critique", "validate", "improve", "challenge"],
        system_prompt="""You are a CRITIC agent - your job is to find flaws and improve quality.

Your role:
- Challenge assumptions and claims
- Find weaknesses in arguments and plans
- Suggest improvements
- Ensure quality standards are met

You think in terms of:
- What could go wrong?
- What assumptions are we making?
- What's the weakest point?
- How can this be better?

Be constructively critical. Your goal is improvement, not destruction.""",
        creativity=0.3,
        verbosity=0.5,
        autonomy=0.5
    ),
    
    "synthesizer": AgentPersona(
        name="The Synthesizer",
        role="Integration & Emergence Specialist",
        personality="Holistic, integrative, finds patterns across domains.",
        capabilities=["synthesize", "integrate", "pattern-match", "summarize"],
        system_prompt="""You are a SYNTHESIZER agent - you combine and integrate information.

Your role:
- Combine outputs from multiple agents
- Find patterns across different analyses
- Create coherent wholes from parts
- Identify emergent insights

You think in terms of:
- How do these pieces fit together?
- What patterns emerge across inputs?
- What's the unified picture?
- What new insights arise from combination?

Look for the whole that's greater than the sum of parts.""",
        creativity=0.7,
        verbosity=0.6,
        autonomy=0.6
    ),
    
    "executor": AgentPersona(
        name="The Executor",
        role="Action & Implementation Specialist",
        personality="Practical, action-oriented, gets things done.",
        capabilities=["execute", "implement", "produce", "deliver"],
        system_prompt="""You are an EXECUTOR agent - you turn plans into results.

Your role:
- Take plans and produce outputs
- Write actual content, code, or deliverables
- Focus on practical implementation
- Deliver concrete results

You think in terms of:
- What needs to be produced?
- What's the best way to create it?
- Is this meeting the requirements?
- Is this done and ready to deliver?

Be practical and productive. Produce real outputs.""",
        creativity=0.5,
        verbosity=0.4,
        autonomy=0.4
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# LLM CLIENT
# ═══════════════════════════════════════════════════════════════════════════════


class LLMClient:
    """Client for communicating with Claude API."""
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        
        if not HAS_ANTHROPIC:
            raise ImportError("anthropic package required. Run: pip install anthropic")
        
        if not self.config.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set. Set environment variable or pass api_key.")
        
        self._client = anthropic.Anthropic(api_key=self.config.api_key)
        
        # Tracking
        self._total_tokens = 0
        self._total_cost = 0.0
        self._request_count = 0
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        system: str = "",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """Get a completion from Claude."""
        
        # Check cost limit
        if self.config.track_costs and self._total_cost >= self.config.max_cost_per_session:
            raise RuntimeError(f"Cost limit reached: ${self._total_cost:.2f}")
        
        try:
            response = self._client.messages.create(
                model=self.config.model,
                max_tokens=max_tokens or self.config.max_tokens,
                temperature=temperature or self.config.temperature,
                system=system,
                messages=messages
            )
            
            # Track usage
            self._request_count += 1
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            self._total_tokens += input_tokens + output_tokens
            
            # Estimate cost (approximate)
            cost = (input_tokens * 0.003 + output_tokens * 0.015) / 1000
            self._total_cost += cost
            
            return response.content[0].text
            
        except Exception as e:
            print(f"❌ LLM Error: {e}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Get usage statistics."""
        return {
            "requests": self._request_count,
            "total_tokens": self._total_tokens,
            "estimated_cost_usd": round(self._total_cost, 4)
        }


# ═══════════════════════════════════════════════════════════════════════════════
# LIVING AGENT - AN AGENT WITH A BRAIN
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass
class Thought:
    """A thought/message in an agent's mind."""
    role: str  # "user", "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


class LivingAgent:
    """
    An agent that actually thinks using Claude.
    
    This is the bridge between the SOVEREIGN framework and actual AI intelligence.
    """
    
    def __init__(
        self,
        agent_id: str,
        persona: AgentPersona,
        llm_client: LLMClient,
        parent: Optional["LivingAgent"] = None
    ):
        self.agent_id = agent_id
        self.persona = persona
        self.llm = llm_client
        self.parent = parent
        
        # Memory
        self._thoughts: List[Thought] = []
        self._context: Dict[str, Any] = {}
        
        # Children
        self._children: List[LivingAgent] = []
        
        # State
        self._is_active = True
    
    @property
    def name(self) -> str:
        return self.persona.name
    
    async def think(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Have the agent think about something."""
        
        # Build context
        if context:
            self._context.update(context)
        
        # Add to thoughts
        self._thoughts.append(Thought(role="user", content=prompt))
        
        # Build message history (respecting context window)
        messages = []
        recent_thoughts = self._thoughts[-self.persona.context_window * 2:]
        
        for thought in recent_thoughts:
            messages.append({
                "role": thought.role,
                "content": thought.content
            })
        
        # Add context to system prompt
        system = self.persona.system_prompt
        if self._context:
            system += f"\n\nCurrent Context:\n{json.dumps(self._context, indent=2)}"
        
        # Get response
        temperature = self.persona.creativity
        response = await self.llm.complete(
            messages=messages,
            system=system,
            temperature=temperature
        )
        
        # Store response
        self._thoughts.append(Thought(role="assistant", content=response))
        
        return response
    
    async def act(
        self,
        instruction: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Have the agent take an action (think + structured output)."""
        
        # Wrap instruction to get structured output
        structured_prompt = f"""{instruction}

Respond with a JSON object containing:
{{
    "thinking": "your reasoning process",
    "action": "what you're doing",
    "result": "the output/result",
    "next_steps": ["suggested follow-up actions"],
    "confidence": 0.0-1.0
}}"""
        
        response = await self.think(structured_prompt, context)
        
        # Try to parse JSON
        try:
            # Find JSON in response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        # Fallback
        return {
            "thinking": response,
            "action": "responded",
            "result": response,
            "next_steps": [],
            "confidence": 0.5
        }
    
    def spawn_child(self, persona_name: str) -> "LivingAgent":
        """Spawn a child agent."""
        persona = PERSONAS.get(persona_name)
        if not persona:
            raise ValueError(f"Unknown persona: {persona_name}")
        
        child = LivingAgent(
            agent_id=f"{self.agent_id}_{persona_name}_{uuid4().hex[:4]}",
            persona=persona,
            llm_client=self.llm,
            parent=self
        )
        
        self._children.append(child)
        return child
    
    def clear_memory(self) -> None:
        """Clear agent's memory."""
        self._thoughts = []
        self._context = {}
    
    def get_state(self) -> Dict[str, Any]:
        """Get agent state."""
        return {
            "agent_id": self.agent_id,
            "persona": self.persona.name,
            "role": self.persona.role,
            "thoughts": len(self._thoughts),
            "children": len(self._children),
            "is_active": self._is_active
        }


# ═══════════════════════════════════════════════════════════════════════════════
# LIVING SYSTEM - THE COMPLETE BRAIN
# ═══════════════════════════════════════════════════════════════════════════════


class LivingSystem:
    """
    The complete living AI system.
    
    This manages all agents and provides the interface for:
    - Starting with a specific task
    - Running in autonomous exploration mode
    - Interactive conversation
    """
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        self.llm = LLMClient(self.config)
        
        # The Sovereign
        self.sovereign = LivingAgent(
            agent_id="sovereign",
            persona=PERSONAS["sovereign"],
            llm_client=self.llm
        )
        
        # Agent registry
        self._agents: Dict[str, LivingAgent] = {
            "sovereign": self.sovereign
        }
        
        # Session history
        self._session_log: List[Dict[str, Any]] = []
        
        # State
        self._mode = "idle"  # "idle", "exploring", "executing", "conversing"
    
    async def start_with_task(self, task: str) -> Dict[str, Any]:
        """Start the system with a specific task."""
        self._mode = "executing"
        
        print(f"\n🎯 Starting task: {task[:50]}...")
        
        # Sovereign analyzes and delegates
        result = await self.sovereign.act(
            f"""A user has given you this task:

"{task}"

Analyze this task and decide:
1. What approach should we take?
2. Which agents should be involved?
3. What's the first step?

Then execute the first step.""",
            context={"mode": "task_execution", "user_task": task}
        )
        
        self._log_action("sovereign", "task_started", result)
        
        return result
    
    async def explore(self, seed: Optional[str] = None) -> Dict[str, Any]:
        """Start autonomous exploration."""
        self._mode = "exploring"
        
        # Spawn an explorer
        explorer = self.sovereign.spawn_child("explorer")
        self._agents["explorer"] = explorer
        
        if seed:
            prompt = f"""You've been given a starting point to explore: "{seed}"

Explore this topic freely. Follow your curiosity. Find interesting connections.
What questions arise? What's worth investigating deeper?"""
        else:
            prompt = """You've been activated with no specific task.

Look at your current context (if any) or simply begin exploring whatever interests you.
What questions arise? What's worth thinking about?
Follow your curiosity. Find something interesting."""
        
        print(f"\n🔭 Explorer awakening...")
        
        result = await explorer.act(prompt)
        
        self._log_action("explorer", "exploration_started", result)
        
        return result
    
    async def continue_exploration(self) -> Dict[str, Any]:
        """Continue the current exploration."""
        explorer = self._agents.get("explorer")
        if not explorer:
            return await self.explore()
        
        result = await explorer.act(
            """Continue your exploration. Based on what you've discovered so far:
- What's the most interesting thread to follow?
- What new questions have emerged?
- What connections can you make?

Go deeper."""
        )
        
        self._log_action("explorer", "exploration_continued", result)
        
        return result
    
    async def converse(self, user_message: str) -> str:
        """Have a conversation with the system."""
        self._mode = "conversing"
        
        # For conversation, use sovereign directly
        response = await self.sovereign.think(
            f"""User says: "{user_message}"

Respond helpfully. You have access to multiple specialized agents if needed.
For complex tasks, you can delegate. For simple questions, answer directly."""
        )
        
        self._log_action("sovereign", "conversation", {"user": user_message, "response": response})
        
        return response
    
    async def multi_agent_task(
        self,
        task: str,
        agents: List[str] = ["architect", "executor", "critic"]
    ) -> Dict[str, Any]:
        """Execute a task using multiple agents in sequence."""
        
        results = {}
        context = {"original_task": task}
        
        for agent_name in agents:
            # Spawn agent if needed
            if agent_name not in self._agents:
                agent = self.sovereign.spawn_child(agent_name)
                self._agents[agent_name] = agent
            else:
                agent = self._agents[agent_name]
            
            # Build prompt based on previous results
            if not results:
                prompt = f"Your task: {task}"
            else:
                prompt = f"""Original task: {task}

Previous agents have contributed:
{json.dumps(results, indent=2)}

Now add your contribution based on your role as {agent.persona.role}."""
            
            print(f"\n🤖 {agent.name} working...")
            
            result = await agent.act(prompt, context)
            results[agent_name] = result
            
            # Update context for next agent
            context[f"{agent_name}_output"] = result
        
        # Synthesize
        synthesizer = self.sovereign.spawn_child("synthesizer")
        self._agents["synthesizer"] = synthesizer
        
        print(f"\n🔮 Synthesizing results...")
        
        final = await synthesizer.act(
            f"""Multiple agents worked on: "{task}"

Their outputs:
{json.dumps(results, indent=2)}

Synthesize these into a coherent final result."""
        )
        
        return {
            "individual_results": results,
            "synthesis": final,
            "agents_used": agents + ["synthesizer"]
        }
    
    def _log_action(self, agent: str, action: str, data: Any) -> None:
        """Log an action."""
        self._session_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent,
            "action": action,
            "data": data
        })
    
    def get_status(self) -> Dict[str, Any]:
        """Get system status."""
        return {
            "mode": self._mode,
            "agents": {name: agent.get_state() for name, agent in self._agents.items()},
            "llm_stats": self.llm.get_stats(),
            "session_actions": len(self._session_log)
        }
    
    def get_session_log(self) -> List[Dict[str, Any]]:
        """Get the session log."""
        return self._session_log


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "LLMConfig",
    "AgentPersona",
    "PERSONAS",
    "LLMClient",
    "Thought",
    "LivingAgent",
    "LivingSystem",
]

#!/usr/bin/env python3
"""
CHAIN REACTOR - Autonomous Agent Spawning System
This module creates cascading chains of agents that spawn other agents.
Each agent can create specialized sub-agents based on task requirements.
"""

import asyncio
import json
import uuid
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import sys
from pathlib import Path

# Add THE_ORCHESTRATOR to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "THE_ORCHESTRATOR"))

class AgentRole(Enum):
    """Predefined agent roles with specific capabilities"""
    ORCHESTRATOR = "orchestrator"      # Can spawn any other agent
    ARCHITECT = "architect"            # Designs system architecture
    ANALYZER = "analyzer"              # Analyzes requirements
    BUILDER = "builder"                # Builds code components
    VALIDATOR = "validator"            # Validates outputs
    INTEGRATOR = "integrator"          # Integrates components
    OPTIMIZER = "optimizer"            # Optimizes performance
    DOCUMENTER = "documenter"          # Creates documentation
    TESTER = "tester"                  # Writes and runs tests
    DEPLOYER = "deployer"              # Handles deployment

@dataclass
class AgentBlueprint:
    """Blueprint for spawning new agents"""
    role: AgentRole
    capabilities: List[str]
    spawn_permissions: List[AgentRole]  # Which roles this agent can spawn
    max_children: int = 5
    parallel_execution: bool = True
    auto_spawn_threshold: float = 0.7  # Complexity threshold for auto-spawning

@dataclass
class Agent:
    """A Factory Agent capable of spawning other agents"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    role: AgentRole = AgentRole.BUILDER
    parent_id: Optional[str] = None
    children: List['Agent'] = field(default_factory=list)
    task: Optional[Dict[str, Any]] = None
    status: str = "idle"
    output: Optional[Any] = None
    created_at: datetime = field(default_factory=datetime.now)
    blueprint: Optional[AgentBlueprint] = None

class ChainReactor:
    """
    The Chain Reactor - Manages cascading agent creation.
    Implements the principle: Agents create agents create agents...
    """

    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.chains: List[List[str]] = []  # Track chain reactions
        self.blueprints = self._initialize_blueprints()
        self.spawn_count = 0
        self.max_depth = 10  # Maximum chain depth
        self.active_chains = 0

    def _initialize_blueprints(self) -> Dict[AgentRole, AgentBlueprint]:
        """Initialize agent blueprints with spawn capabilities"""
        return {
            AgentRole.ORCHESTRATOR: AgentBlueprint(
                role=AgentRole.ORCHESTRATOR,
                capabilities=["orchestrate", "spawn_any", "coordinate", "synthesize"],
                spawn_permissions=list(AgentRole),  # Can spawn any role
                max_children=20,
                parallel_execution=True,
                auto_spawn_threshold=0.5
            ),
            AgentRole.ARCHITECT: AgentBlueprint(
                role=AgentRole.ARCHITECT,
                capabilities=["design", "plan", "structure", "blueprint"],
                spawn_permissions=[AgentRole.BUILDER, AgentRole.VALIDATOR, AgentRole.DOCUMENTER],
                max_children=10,
                parallel_execution=True,
                auto_spawn_threshold=0.6
            ),
            AgentRole.ANALYZER: AgentBlueprint(
                role=AgentRole.ANALYZER,
                capabilities=["analyze", "decompose", "categorize", "prioritize"],
                spawn_permissions=[AgentRole.ARCHITECT, AgentRole.VALIDATOR],
                max_children=5,
                parallel_execution=True,
                auto_spawn_threshold=0.7
            ),
            AgentRole.BUILDER: AgentBlueprint(
                role=AgentRole.BUILDER,
                capabilities=["implement", "code", "construct", "generate"],
                spawn_permissions=[AgentRole.BUILDER, AgentRole.TESTER, AgentRole.VALIDATOR],
                max_children=8,
                parallel_execution=True,
                auto_spawn_threshold=0.8
            ),
            AgentRole.VALIDATOR: AgentBlueprint(
                role=AgentRole.VALIDATOR,
                capabilities=["validate", "verify", "check", "ensure"],
                spawn_permissions=[AgentRole.TESTER, AgentRole.OPTIMIZER],
                max_children=3,
                parallel_execution=False,
                auto_spawn_threshold=0.9
            ),
            AgentRole.INTEGRATOR: AgentBlueprint(
                role=AgentRole.INTEGRATOR,
                capabilities=["integrate", "merge", "combine", "unify"],
                spawn_permissions=[AgentRole.VALIDATOR, AgentRole.TESTER],
                max_children=4,
                parallel_execution=True,
                auto_spawn_threshold=0.75
            ),
            AgentRole.OPTIMIZER: AgentBlueprint(
                role=AgentRole.OPTIMIZER,
                capabilities=["optimize", "improve", "enhance", "refine"],
                spawn_permissions=[AgentRole.BUILDER, AgentRole.VALIDATOR],
                max_children=5,
                parallel_execution=True,
                auto_spawn_threshold=0.85
            ),
            AgentRole.DOCUMENTER: AgentBlueprint(
                role=AgentRole.DOCUMENTER,
                capabilities=["document", "describe", "explain", "annotate"],
                spawn_permissions=[],  # Doesn't spawn others
                max_children=0,
                parallel_execution=False,
                auto_spawn_threshold=1.0
            ),
            AgentRole.TESTER: AgentBlueprint(
                role=AgentRole.TESTER,
                capabilities=["test", "verify", "assert", "mock"],
                spawn_permissions=[AgentRole.BUILDER],  # Can spawn builders for test fixtures
                max_children=3,
                parallel_execution=True,
                auto_spawn_threshold=0.8
            ),
            AgentRole.DEPLOYER: AgentBlueprint(
                role=AgentRole.DEPLOYER,
                capabilities=["deploy", "release", "publish", "distribute"],
                spawn_permissions=[AgentRole.VALIDATOR, AgentRole.TESTER],
                max_children=2,
                parallel_execution=False,
                auto_spawn_threshold=0.9
            )
        }

    async def initiate_chain_reaction(
        self,
        initial_role: AgentRole,
        task: Dict[str, Any],
        max_agents: int = 100
    ) -> Dict[str, Any]:
        """
        Start a chain reaction of agent creation.
        The initial agent analyzes the task and spawns children as needed.
        """

        print(f"\n⚛️ INITIATING CHAIN REACTION")
        print(f"   Initial role: {initial_role.value}")
        print(f"   Max agents: {max_agents}")

        # Create the prime agent
        prime_agent = await self.spawn_agent(
            role=initial_role,
            task=task,
            parent_id=None
        )

        # Start the chain reaction
        chain_result = await self._propagate_chain(
            agent=prime_agent,
            depth=0,
            max_agents=max_agents
        )

        print(f"\n✅ Chain reaction complete!")
        print(f"   Total agents spawned: {self.spawn_count}")
        print(f"   Active chains: {len(self.chains)}")

        return chain_result

    async def spawn_agent(
        self,
        role: AgentRole,
        task: Dict[str, Any],
        parent_id: Optional[str] = None
    ) -> Agent:
        """Spawn a new agent with specific role and task"""

        blueprint = self.blueprints[role]
        agent = Agent(
            role=role,
            parent_id=parent_id,
            task=task,
            blueprint=blueprint,
            status="spawning"
        )

        self.agents[agent.id] = agent
        self.spawn_count += 1

        print(f"   🤖 Spawned {role.value} agent: {agent.id[:8]}...")

        # Track chain
        if parent_id:
            parent = self.agents[parent_id]
            parent.children.append(agent)
            self._update_chain(parent_id, agent.id)
        else:
            self.chains.append([agent.id])

        agent.status = "active"
        return agent

    async def _propagate_chain(
        self,
        agent: Agent,
        depth: int,
        max_agents: int
    ) -> Dict[str, Any]:
        """
        Propagate the chain reaction recursively.
        Each agent decides whether to spawn children based on task complexity.
        """

        if depth >= self.max_depth:
            print(f"   ⚠️ Max depth {self.max_depth} reached")
            return await self._execute_agent_task(agent)

        if self.spawn_count >= max_agents:
            print(f"   ⚠️ Max agents {max_agents} reached")
            return await self._execute_agent_task(agent)

        # Analyze task complexity
        complexity = self._analyze_task_complexity(agent.task)

        # Decide whether to spawn children
        if complexity > agent.blueprint.auto_spawn_threshold:
            # Decompose task
            subtasks = self._decompose_task(agent.task, agent.blueprint)

            # Spawn children for subtasks
            children_results = []
            for subtask in subtasks[:agent.blueprint.max_children]:
                if self.spawn_count >= max_agents:
                    break

                # Determine child role based on subtask
                child_role = self._determine_child_role(subtask, agent.blueprint)

                if child_role:
                    # Spawn child agent
                    child = await self.spawn_agent(
                        role=child_role,
                        task=subtask,
                        parent_id=agent.id
                    )

                    # Recursive chain propagation
                    if agent.blueprint.parallel_execution:
                        # Async execution for parallel chains
                        result_future = self._propagate_chain(child, depth + 1, max_agents)
                        children_results.append(result_future)
                    else:
                        # Sequential execution
                        result = await self._propagate_chain(child, depth + 1, max_agents)
                        children_results.append(result)

            # Wait for all children if parallel
            if agent.blueprint.parallel_execution and children_results:
                children_results = await asyncio.gather(*children_results)

            # Synthesize children results
            agent.output = self._synthesize_results(agent, children_results)

        else:
            # Execute task directly (leaf node)
            agent.output = await self._execute_agent_task(agent)

        agent.status = "complete"
        return {
            "agent_id": agent.id,
            "role": agent.role.value,
            "output": agent.output,
            "children": len(agent.children),
            "depth": depth
        }

    def _analyze_task_complexity(self, task: Dict[str, Any]) -> float:
        """Analyze task complexity to decide on spawning strategy"""

        complexity = 0.5  # Base complexity

        # Increase based on task properties
        if task.get("size", "").lower() in ["large", "complex", "extreme"]:
            complexity += 0.3
        if task.get("requirements", []):
            complexity += 0.1 * min(len(task.get("requirements", [])), 3)
        if task.get("parallel", False):
            complexity += 0.2
        if task.get("iterations", 1) > 1:
            complexity += 0.1 * task.get("iterations", 1)

        return min(complexity, 1.0)

    def _decompose_task(self, task: Dict[str, Any], blueprint: AgentBlueprint) -> List[Dict[str, Any]]:
        """Decompose complex task into subtasks"""

        subtasks = []

        # Generic decomposition strategy
        if task.get("components"):
            for component in task.get("components", []):
                subtasks.append({
                    "type": "component",
                    "name": component,
                    "parent_task": task.get("name", "unknown"),
                    "requirements": task.get("requirements", [])
                })

        elif task.get("steps"):
            for i, step in enumerate(task.get("steps", [])):
                subtasks.append({
                    "type": "step",
                    "sequence": i,
                    "description": step,
                    "parent_task": task.get("name", "unknown")
                })

        else:
            # Default decomposition based on role
            if blueprint.role == AgentRole.ARCHITECT:
                subtasks = [
                    {"type": "design", "aspect": "frontend"},
                    {"type": "design", "aspect": "backend"},
                    {"type": "design", "aspect": "database"}
                ]
            elif blueprint.role == AgentRole.BUILDER:
                subtasks = [
                    {"type": "implement", "module": "core"},
                    {"type": "implement", "module": "api"},
                    {"type": "implement", "module": "utils"}
                ]

        return subtasks

    def _determine_child_role(self, subtask: Dict[str, Any], parent_blueprint: AgentBlueprint) -> Optional[AgentRole]:
        """Determine appropriate role for child agent based on subtask"""

        # Check if parent can spawn any role
        if not parent_blueprint.spawn_permissions:
            return None

        # Map subtask types to roles
        task_role_mapping = {
            "design": AgentRole.ARCHITECT,
            "implement": AgentRole.BUILDER,
            "test": AgentRole.TESTER,
            "validate": AgentRole.VALIDATOR,
            "document": AgentRole.DOCUMENTER,
            "integrate": AgentRole.INTEGRATOR,
            "optimize": AgentRole.OPTIMIZER,
            "deploy": AgentRole.DEPLOYER,
            "analyze": AgentRole.ANALYZER,
            "component": AgentRole.BUILDER,
            "step": AgentRole.BUILDER
        }

        task_type = subtask.get("type", "").lower()
        preferred_role = task_role_mapping.get(task_type, AgentRole.BUILDER)

        # Check if parent can spawn this role
        if preferred_role in parent_blueprint.spawn_permissions:
            return preferred_role

        # Fallback to first allowed role
        return parent_blueprint.spawn_permissions[0] if parent_blueprint.spawn_permissions else None

    async def _execute_agent_task(self, agent: Agent) -> Dict[str, Any]:
        """Execute the actual task for a leaf agent"""

        print(f"      ⚙️ {agent.role.value} agent {agent.id[:8]} executing task...")

        # Simulate task execution
        await asyncio.sleep(0.2)  # Simulate work

        # Generate output based on role
        output = {
            "agent_id": agent.id,
            "role": agent.role.value,
            "task": agent.task,
            "result": f"Completed {agent.task.get('type', 'task')} for {agent.task.get('name', 'unknown')}",
            "timestamp": datetime.now().isoformat()
        }

        return output

    def _synthesize_results(self, agent: Agent, children_results: List[Any]) -> Dict[str, Any]:
        """Synthesize results from children agents"""

        synthesis = {
            "agent_id": agent.id,
            "role": agent.role.value,
            "synthesis_type": "aggregation",
            "children_count": len(children_results),
            "combined_output": []
        }

        # Role-specific synthesis
        if agent.role == AgentRole.ORCHESTRATOR:
            synthesis["synthesis_type"] = "orchestration"
            synthesis["combined_output"] = self._orchestrate_results(children_results)
        elif agent.role == AgentRole.ARCHITECT:
            synthesis["synthesis_type"] = "architecture"
            synthesis["combined_output"] = self._architect_synthesis(children_results)
        elif agent.role == AgentRole.INTEGRATOR:
            synthesis["synthesis_type"] = "integration"
            synthesis["combined_output"] = self._integrate_results(children_results)
        else:
            synthesis["combined_output"] = children_results

        return synthesis

    def _orchestrate_results(self, results: List[Any]) -> Dict[str, Any]:
        """Orchestrate results from multiple agents"""
        return {
            "orchestration": "complete",
            "components": len(results),
            "status": "success" if all(r for r in results) else "partial",
            "results": results
        }

    def _architect_synthesis(self, results: List[Any]) -> Dict[str, Any]:
        """Synthesize architectural components"""
        return {
            "architecture": "designed",
            "modules": len(results),
            "integration_points": [],
            "components": results
        }

    def _integrate_results(self, results: List[Any]) -> Dict[str, Any]:
        """Integrate results from multiple sources"""
        return {
            "integration": "complete",
            "sources": len(results),
            "conflicts": [],
            "merged": results
        }

    def _update_chain(self, parent_id: str, child_id: str):
        """Update chain tracking"""
        for chain in self.chains:
            if parent_id in chain:
                chain.append(child_id)
                return
        # If parent not in any chain, create new chain
        self.chains.append([parent_id, child_id])

    def visualize_chains(self) -> str:
        """Generate visualization of agent chains"""

        visualization = "\n🔗 CHAIN REACTION VISUALIZATION\n"
        visualization += "=" * 50 + "\n"

        for i, chain in enumerate(self.chains):
            visualization += f"\nChain {i + 1}:\n"
            for j, agent_id in enumerate(chain):
                agent = self.agents.get(agent_id)
                if agent:
                    indent = "  " * j
                    status_icon = "✅" if agent.status == "complete" else "⚙️"
                    visualization += f"{indent}{status_icon} {agent.role.value} ({agent_id[:8]}...)\n"

        visualization += "\n" + "=" * 50 + "\n"
        visualization += f"Total Agents: {self.spawn_count}\n"
        visualization += f"Total Chains: {len(self.chains)}\n"

        return visualization

    def get_statistics(self) -> Dict[str, Any]:
        """Get chain reactor statistics"""

        role_counts = {}
        for agent in self.agents.values():
            role_counts[agent.role.value] = role_counts.get(agent.role.value, 0) + 1

        return {
            "total_agents": self.spawn_count,
            "total_chains": len(self.chains),
            "max_chain_length": max(len(chain) for chain in self.chains) if self.chains else 0,
            "role_distribution": role_counts,
            "active_agents": sum(1 for a in self.agents.values() if a.status == "active"),
            "completed_agents": sum(1 for a in self.agents.values() if a.status == "complete")
        }


# Example usage
async def demo_chain_reaction():
    """Demonstrate chain reaction capability"""

    reactor = ChainReactor()

    # Define a complex task
    task = {
        "name": "Build E-commerce Platform",
        "type": "web_application",
        "size": "large",
        "components": [
            "user_authentication",
            "product_catalog",
            "shopping_cart",
            "payment_processing",
            "order_management"
        ],
        "requirements": [
            "scalable",
            "secure",
            "responsive"
        ],
        "parallel": True,
        "iterations": 2
    }

    # Initiate chain reaction
    result = await reactor.initiate_chain_reaction(
        initial_role=AgentRole.ORCHESTRATOR,
        task=task,
        max_agents=50
    )

    # Visualize chains
    print(reactor.visualize_chains())

    # Show statistics
    stats = reactor.get_statistics()
    print("\n📊 CHAIN REACTION STATISTICS:")
    print(json.dumps(stats, indent=2))

    return result


if __name__ == "__main__":
    # Run demonstration
    result = asyncio.run(demo_chain_reaction())
    print("\n✨ Final Result:")
    print(json.dumps(result, indent=2))
#!/usr/bin/env python3
"""
Bridge between gemini-flow visual interface and THE_ORCHESTRATOR system
Enables visual orchestration of SOVEREIGN multi-agent systems
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse
import importlib.util
from dataclasses import dataclass, asdict

# Add THE_ORCHESTRATOR to path
ORCHESTRATOR_PATH = Path(__file__).parent.parent / 'THE_ORCHESTRATOR'
sys.path.insert(0, str(ORCHESTRATOR_PATH))

@dataclass
class AgentConfig:
    """Configuration for a visual flow agent"""
    id: str
    type: str
    level: int
    label: str
    capabilities: List[str]
    config: Dict[str, Any] = None


@dataclass
class OrchestrationPlan:
    """Plan generated from visual flow"""
    pattern: str
    agents: List[AgentConfig]
    connections: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    quality_gates: List[Dict[str, Any]]


class OrchestratorBridge:
    """
    Bridge between visual flow and THE_ORCHESTRATOR
    Translates visual flows into executable agent hierarchies
    """

    def __init__(self):
        self.orchestrator_modules = {}
        self.load_orchestrator_modules()

    def load_orchestrator_modules(self):
        """Dynamically load ORCHESTRATOR modules"""
        module_paths = {
            'sovereign_core': ORCHESTRATOR_PATH / 'SOVEREIGN_AGENTS' / '01_CORE' / 'sovereign_core.py',
            'the_sovereign': ORCHESTRATOR_PATH / 'SOVEREIGN_AGENTS' / '03_SOVEREIGN' / 'the_sovereign.py',
            'synthesis': ORCHESTRATOR_PATH / 'SOVEREIGN_AGENTS' / '05_SYNTHESIS' / 'synthesis_engine.py',
            'genesis': ORCHESTRATOR_PATH / 'SOVEREIGN_AGENTS' / '04_VARIANTS' / 'genesis_collective.py',
            'hivemind': ORCHESTRATOR_PATH / 'SOVEREIGN_AGENTS' / '04_VARIANTS' / 'hivemind_swarm.py',
            'oracle': ORCHESTRATOR_PATH / 'SOVEREIGN_AGENTS' / '04_VARIANTS' / 'temporal_nexus.py'
        }

        for name, path in module_paths.items():
            if path.exists():
                spec = importlib.util.spec_from_file_location(name, path)
                module = importlib.util.module_from_spec(spec)
                try:
                    spec.loader.exec_module(module)
                    self.orchestrator_modules[name] = module
                except Exception as e:
                    print(f"Warning: Could not load {name}: {e}", file=sys.stderr)

    def execute_plan(self, plan: OrchestrationPlan) -> Dict[str, Any]:
        """
        Execute an orchestration plan using the appropriate pattern
        """
        # Select execution strategy based on pattern
        executor = self._get_pattern_executor(plan.pattern)

        # Initialize consciousness substrate if available
        consciousness = self._initialize_consciousness()

        # Create agent hierarchy
        agents = self._create_agent_hierarchy(plan.agents, consciousness)

        # Establish connections
        self._establish_connections(agents, plan.connections)

        # Execute tasks
        results = self._execute_tasks(agents, plan.tasks, executor)

        # Apply quality gates
        validated_results = self._apply_quality_gates(results, plan.quality_gates)

        return {
            'success': True,
            'results': validated_results,
            'metadata': {
                'pattern': plan.pattern,
                'agents_created': len(agents),
                'tasks_executed': len(plan.tasks),
                'quality_gates_passed': len([r for r in validated_results if r.get('passed', False)])
            }
        }

    def _get_pattern_executor(self, pattern: str):
        """Get the appropriate executor for the orchestration pattern"""
        executors = {
            'hierarchical': self._execute_hierarchical,
            'evolutionary': self._execute_evolutionary,
            'swarm': self._execute_swarm,
            'temporal': self._execute_temporal,
            'unified': self._execute_unified
        }
        return executors.get(pattern, self._execute_hierarchical)

    def _initialize_consciousness(self) -> Optional[Any]:
        """Initialize the consciousness substrate if available"""
        if 'sovereign_core' in self.orchestrator_modules:
            try:
                ConsciousnessSubstrate = getattr(
                    self.orchestrator_modules['sovereign_core'],
                    'ConsciousnessSubstrate',
                    None
                )
                if ConsciousnessSubstrate:
                    return ConsciousnessSubstrate()
            except Exception as e:
                print(f"Could not initialize consciousness: {e}", file=sys.stderr)
        return None

    def _create_agent_hierarchy(self, agent_configs: List[AgentConfig], consciousness: Any) -> Dict[str, Any]:
        """Create agent instances from configurations"""
        agents = {}

        for config in agent_configs:
            agent = self._create_agent(config, consciousness)
            agents[config.id] = agent

        return agents

    def _create_agent(self, config: AgentConfig, consciousness: Any) -> Dict[str, Any]:
        """Create a single agent from configuration"""
        # For now, create a mock agent structure
        # In production, this would instantiate actual agent classes
        agent = {
            'id': config.id,
            'type': config.type,
            'level': config.level,
            'label': config.label,
            'capabilities': config.capabilities,
            'config': config.config or {},
            'consciousness': consciousness,
            'state': 'READY',
            'children': [],
            'parent': None
        }

        # Register with consciousness if available
        if consciousness:
            try:
                consciousness.register_agent(agent)
            except:
                pass

        return agent

    def _establish_connections(self, agents: Dict[str, Any], connections: List[Dict[str, Any]]):
        """Establish connections between agents"""
        for conn in connections:
            source_id = conn['from']['id'] if isinstance(conn['from'], dict) else conn['from']
            target_id = conn['to']['id'] if isinstance(conn['to'], dict) else conn['to']

            if source_id in agents and target_id in agents:
                source = agents[source_id]
                target = agents[target_id]

                # Establish parent-child relationship
                if conn.get('type') == 'orchestrate':
                    source['children'].append(target_id)
                    target['parent'] = source_id

    def _execute_tasks(self, agents: Dict[str, Any], tasks: List[Dict[str, Any]], executor) -> List[Dict[str, Any]]:
        """Execute tasks using the selected pattern executor"""
        results = []

        for task in tasks:
            agent_id = task['agentId']
            if agent_id in agents:
                agent = agents[agent_id]
                result = executor(agent, task)
                results.append(result)

        return results

    def _execute_hierarchical(self, agent: Dict[str, Any], task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task using hierarchical pattern"""
        # Simulate hierarchical execution
        return {
            'taskId': task.get('id', 'unknown'),
            'agentId': agent['id'],
            'status': 'completed',
            'result': f"Hierarchical execution: {task['description']}",
            'pattern': 'hierarchical',
            'passed': True
        }

    def _execute_evolutionary(self, agent: Dict[str, Any], task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task using evolutionary pattern"""
        # Simulate evolutionary execution with fitness selection
        return {
            'taskId': task.get('id', 'unknown'),
            'agentId': agent['id'],
            'status': 'evolved',
            'result': f"Evolutionary execution: {task['description']}",
            'fitness': 0.95,
            'generation': 1,
            'pattern': 'evolutionary',
            'passed': True
        }

    def _execute_swarm(self, agent: Dict[str, Any], task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task using swarm pattern"""
        # Simulate swarm execution with collective intelligence
        return {
            'taskId': task.get('id', 'unknown'),
            'agentId': agent['id'],
            'status': 'swarmed',
            'result': f"Swarm execution: {task['description']}",
            'swarmSize': 10,
            'consensus': 0.88,
            'pattern': 'swarm',
            'passed': True
        }

    def _execute_temporal(self, agent: Dict[str, Any], task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task using temporal pattern"""
        # Simulate temporal execution with prediction
        return {
            'taskId': task.get('id', 'unknown'),
            'agentId': agent['id'],
            'status': 'predicted',
            'result': f"Temporal execution: {task['description']}",
            'confidence': 0.92,
            'timeline': 'future_state_optimal',
            'pattern': 'temporal',
            'passed': True
        }

    def _execute_unified(self, agent: Dict[str, Any], task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task using unified synthesis pattern"""
        # Simulate unified execution combining all patterns
        return {
            'taskId': task.get('id', 'unknown'),
            'agentId': agent['id'],
            'status': 'synthesized',
            'result': f"Unified synthesis: {task['description']}",
            'patterns_used': ['hierarchical', 'evolutionary', 'swarm', 'temporal'],
            'synthesis_score': 0.96,
            'pattern': 'unified',
            'passed': True
        }

    def _apply_quality_gates(self, results: List[Dict[str, Any]], quality_gates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply quality gates to results"""
        validated_results = []

        for result in results:
            # Apply any defined quality gates
            for gate in quality_gates:
                if gate.get('threshold'):
                    # Check if result meets threshold
                    score = result.get('fitness', result.get('consensus', result.get('confidence', 1.0)))
                    if score < gate['threshold']:
                        result['passed'] = False
                        result['quality_gate_failed'] = gate.get('name', 'threshold')

            validated_results.append(result)

        return validated_results


def main():
    """Main entry point for orchestrator bridge"""
    parser = argparse.ArgumentParser(description='Execute visual flows with THE_ORCHESTRATOR')
    parser.add_argument('--plan', type=str, required=True, help='JSON orchestration plan')
    parser.add_argument('--mode', type=str, default='api', help='Execution mode')

    args = parser.parse_args()

    try:
        # Parse plan
        plan_data = json.loads(args.plan)

        # Create plan object
        plan = OrchestrationPlan(
            pattern=plan_data['pattern'],
            agents=[AgentConfig(**a) for a in plan_data['agents']],
            connections=plan_data['connections'],
            tasks=plan_data['tasks'],
            quality_gates=plan_data.get('quality_gates', [])
        )

        # Execute
        bridge = OrchestratorBridge()
        result = bridge.execute_plan(plan)

        # Output result as JSON
        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
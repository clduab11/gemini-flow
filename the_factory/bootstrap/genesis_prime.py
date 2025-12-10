#!/usr/bin/env python3
"""
GENESIS PRIME - The Factory's Meta-Orchestrator
This is the first agent that starts the chain reaction of creation.
It reads project specifications and spawns the entire build process.
"""

import os
import sys
import json
import yaml
import asyncio
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Add THE_ORCHESTRATOR to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "THE_ORCHESTRATOR"))

# Import SOVEREIGN components
try:
    from SOVEREIGN_AGENTS.CORE.sovereign_core import BaseAgent, ConsciousnessSubstrate
    from SOVEREIGN_AGENTS.SOVEREIGN.the_sovereign import TheSovereign
    from NEURAL_OVERLAY.neural_core import NeuralCore
    from NEURAL_OVERLAY.minimal_hook import remember_pattern, get_recommendation
except ImportError as e:
    print(f"Warning: Could not import SOVEREIGN components: {e}")
    print("Running in standalone mode with limited capabilities")

class ProjectType(Enum):
    WEB_APP = "web_app"
    API_SERVICE = "api"
    DATA_PIPELINE = "data_pipeline"
    AI_SYSTEM = "ai_system"
    CUSTOM = "custom"

class ComplexityLevel(Enum):
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"
    EXTREME = "extreme"

class OrchestrationParadigm(Enum):
    HIERARCHICAL = "hierarchical"
    SWARM = "swarm"
    NEURAL = "neural"
    TEMPORAL = "temporal"
    HYBRID = "hybrid"
    AUTO = "auto"

@dataclass
class ProjectSpecification:
    """Parsed project specification"""
    name: str
    type: ProjectType
    complexity: ComplexityLevel
    paradigm: OrchestrationParadigm
    objectives: List[str]
    features: Dict[str, List[str]]
    architecture: Dict[str, Any]
    technical: Dict[str, str]
    quality: Dict[str, str]
    output: List[str]
    raw_spec: str

class GenesisPrime:
    """
    The Prime Orchestrator - First agent in The Factory.
    Reads specifications and initiates the chain reaction of creation.
    """

    def __init__(self, spec_path: str = None, output_dir: str = None):
        self.spec_path = Path(spec_path) if spec_path else Path("specs/project_spec.md")
        self.output_dir = Path(output_dir) if output_dir else Path("outputs/project_root")
        self.agents = []
        self.consciousness = None
        self.neural_core = None
        self.project_spec = None

        # Initialize consciousness substrate if available
        try:
            self.consciousness = ConsciousnessSubstrate()
            self.neural_core = NeuralCore()
            print("✅ Full SOVEREIGN intelligence activated")
        except:
            print("⚠️ Running without consciousness substrate")

    def read_specification(self, spec_file: Path) -> str:
        """Read project specification from file"""
        if not spec_file.exists():
            raise FileNotFoundError(f"Specification not found: {spec_file}")

        with open(spec_file, 'r', encoding='utf-8') as f:
            return f.read()

    def parse_specification(self, spec_text: str) -> ProjectSpecification:
        """Parse specification into structured format"""

        # Simple parser - in production, use more sophisticated NLP
        lines = spec_text.split('\n')

        # Extract basic info
        name = "Unknown Project"
        project_type = ProjectType.CUSTOM
        complexity = ComplexityLevel.MEDIUM
        paradigm = OrchestrationParadigm.AUTO

        for line in lines:
            if line.startswith("# "):
                name = line[2:].strip()
            elif "Type:" in line or "type:" in line:
                type_str = line.split(':')[1].strip().lower()
                project_type = ProjectType(type_str) if type_str in [e.value for e in ProjectType] else ProjectType.CUSTOM
            elif "Complexity:" in line or "complexity:" in line:
                comp_str = line.split(':')[1].strip().lower()
                complexity = ComplexityLevel(comp_str) if comp_str in [e.value for e in ComplexityLevel] else ComplexityLevel.MEDIUM
            elif "Paradigm:" in line or "paradigm:" in line:
                par_str = line.split(':')[1].strip().lower()
                paradigm = OrchestrationParadigm(par_str) if par_str in [e.value for e in OrchestrationParadigm] else OrchestrationParadigm.AUTO

        return ProjectSpecification(
            name=name,
            type=project_type,
            complexity=complexity,
            paradigm=paradigm,
            objectives=self.extract_objectives(spec_text),
            features=self.extract_features(spec_text),
            architecture=self.extract_architecture(spec_text),
            technical=self.extract_technical(spec_text),
            quality=self.extract_quality(spec_text),
            output=self.extract_output(spec_text),
            raw_spec=spec_text
        )

    def extract_objectives(self, spec: str) -> List[str]:
        """Extract project objectives from specification"""
        objectives = []
        in_objectives = False

        for line in spec.split('\n'):
            if "## OBJECTIVES" in line or "## Objectives" in line:
                in_objectives = True
            elif line.startswith("## ") and in_objectives:
                break
            elif in_objectives and line.strip().startswith(("-", "*", "1.", "2.", "3.")):
                objectives.append(line.strip().lstrip("-*123456789. "))

        return objectives if objectives else ["Build a working system"]

    def extract_features(self, spec: str) -> Dict[str, List[str]]:
        """Extract features from specification"""
        features = {"core": [], "extended": []}
        current_section = None

        for line in spec.split('\n'):
            if "Core" in line and ("###" in line or "**" in line):
                current_section = "core"
            elif "Extended" in line and ("###" in line or "**" in line):
                current_section = "extended"
            elif current_section and line.strip().startswith(("-", "*", "[ ]", "[x]")):
                feature = line.strip().lstrip("-*[] x")
                features[current_section].append(feature)

        return features

    def extract_architecture(self, spec: str) -> Dict[str, Any]:
        """Extract architecture hints from specification"""
        architecture = {
            "pattern": "auto",
            "scale": "prototype",
            "users": 100
        }

        for line in spec.split('\n'):
            if "Pattern:" in line:
                architecture["pattern"] = line.split(':')[1].strip().lower()
            elif "Scale:" in line:
                architecture["scale"] = line.split(':')[1].strip().lower()
            elif "Users:" in line:
                try:
                    architecture["users"] = int(line.split(':')[1].strip().replace(',', ''))
                except:
                    pass

        return architecture

    def extract_technical(self, spec: str) -> Dict[str, str]:
        """Extract technical preferences from specification"""
        technical = {
            "language": "auto",
            "framework": "auto",
            "database": "auto",
            "deployment": "auto"
        }

        for line in spec.split('\n'):
            for key in technical.keys():
                if f"{key.capitalize()}:" in line:
                    technical[key] = line.split(':')[1].strip().lower()

        return technical

    def extract_quality(self, spec: str) -> Dict[str, str]:
        """Extract quality requirements from specification"""
        quality = {
            "tests": "all",
            "documentation": "standard",
            "performance": "optimized"
        }

        for line in spec.split('\n'):
            for key in quality.keys():
                if f"{key.capitalize()}:" in line:
                    quality[key] = line.split(':')[1].strip().lower()

        return quality

    def extract_output(self, spec: str) -> List[str]:
        """Extract expected outputs from specification"""
        outputs = []
        in_output = False

        for line in spec.split('\n'):
            if "## OUTPUT" in line or "## Output" in line:
                in_output = True
            elif line.startswith("## ") and in_output:
                break
            elif in_output and line.strip().startswith(("-", "*", "[ ]", "[x]")):
                outputs.append(line.strip().lstrip("-*[] x"))

        return outputs if outputs else ["Source code", "Documentation"]

    def determine_orchestration_strategy(self, spec: ProjectSpecification) -> Dict[str, Any]:
        """Determine optimal orchestration strategy based on specification"""

        strategy = {
            "paradigm": spec.paradigm.value,
            "num_agents": 5,
            "parallel_teams": 1,
            "iterations": 1,
            "quality_gates": True
        }

        # Auto-determine paradigm if needed
        if spec.paradigm == OrchestrationParadigm.AUTO:
            if spec.complexity == ComplexityLevel.SIMPLE:
                strategy["paradigm"] = "hierarchical"
            elif spec.complexity == ComplexityLevel.MEDIUM:
                strategy["paradigm"] = "swarm"
            elif spec.complexity == ComplexityLevel.COMPLEX:
                strategy["paradigm"] = "neural"
            else:  # EXTREME
                strategy["paradigm"] = "hybrid"

        # Determine agent count based on complexity
        complexity_agents = {
            ComplexityLevel.SIMPLE: 5,
            ComplexityLevel.MEDIUM: 20,
            ComplexityLevel.COMPLEX: 50,
            ComplexityLevel.EXTREME: 100
        }
        strategy["num_agents"] = complexity_agents[spec.complexity]

        # Determine parallel teams for large projects
        if spec.complexity in [ComplexityLevel.COMPLEX, ComplexityLevel.EXTREME]:
            strategy["parallel_teams"] = 5 if spec.complexity == ComplexityLevel.COMPLEX else 10

        # Iterations for quality
        if spec.quality.get("performance") == "extreme":
            strategy["iterations"] = 5
        elif spec.quality.get("performance") == "optimized":
            strategy["iterations"] = 3

        return strategy

    async def spawn_chain_reaction(self, spec: ProjectSpecification, strategy: Dict[str, Any]):
        """
        INITIATE THE CHAIN REACTION
        This is where the magic happens - agents creating agents creating agents...
        """

        print(f"\n🔥 INITIATING CHAIN REACTION for: {spec.name}")
        print(f"   Paradigm: {strategy['paradigm']}")
        print(f"   Agents: {strategy['num_agents']}")
        print(f"   Teams: {strategy['parallel_teams']}")
        print(f"   Iterations: {strategy['iterations']}")

        # Phase 1: Spawn Analyzer Agent
        print("\n📊 PHASE 1: Spawning Spec Analyzer...")
        analyzer_config = {
            "role": "spec_analyzer",
            "objective": "Deep analyze project specification",
            "input": spec.raw_spec,
            "output_format": "structured_analysis"
        }

        # In real implementation, this would spawn actual agent
        # For now, we'll simulate
        analysis = await self.simulate_agent_work(analyzer_config)

        # Phase 2: Spawn Architect Agents
        print("\n🏗️ PHASE 2: Spawning Architecture Team...")
        architects = []
        for i in range(min(3, strategy['num_agents'] // 10)):
            architect_config = {
                "role": f"architect_{i}",
                "objective": "Design system architecture",
                "specialization": ["frontend", "backend", "infrastructure"][i],
                "input": analysis,
                "paradigm": strategy["paradigm"]
            }
            architects.append(architect_config)

        architecture = await self.parallel_agent_work(architects)

        # Phase 3: Spawn Builder Swarm
        print("\n🔨 PHASE 3: Spawning Builder Swarm...")
        builders = []
        for i in range(strategy['num_agents'] - len(architects) - 1):
            builder_config = {
                "role": f"builder_{i}",
                "objective": "Implement system components",
                "input": architecture,
                "task": self.assign_builder_task(i, spec)
            }
            builders.append(builder_config)

        # Execute in parallel teams if specified
        if strategy['parallel_teams'] > 1:
            print(f"\n⚡ Executing {strategy['parallel_teams']} parallel teams...")
            code_outputs = await self.parallel_team_execution(builders, strategy['parallel_teams'])
        else:
            code_outputs = await self.parallel_agent_work(builders)

        # Phase 4: Validation and Integration
        print("\n✅ PHASE 4: Validation and Integration...")
        validator_config = {
            "role": "validator",
            "objective": "Validate and integrate all components",
            "input": code_outputs,
            "quality_requirements": spec.quality
        }

        final_output = await self.simulate_agent_work(validator_config)

        # Phase 5: Self-improvement (if iterations > 1)
        if strategy['iterations'] > 1:
            print(f"\n🔄 PHASE 5: Self-improvement iterations...")
            for iteration in range(1, strategy['iterations']):
                print(f"   Iteration {iteration + 1}/{strategy['iterations']}...")
                improvement_config = {
                    "role": "improver",
                    "objective": "Optimize and refine implementation",
                    "input": final_output,
                    "iteration": iteration,
                    "focus": ["performance", "quality", "architecture"][iteration % 3]
                }
                final_output = await self.simulate_agent_work(improvement_config)

        return final_output

    def assign_builder_task(self, builder_index: int, spec: ProjectSpecification) -> str:
        """Assign specific task to builder based on index and specification"""

        # Distribute tasks based on project type
        if spec.type == ProjectType.WEB_APP:
            tasks = ["UI components", "State management", "API integration", "Routing", "Authentication"]
        elif spec.type == ProjectType.API_SERVICE:
            tasks = ["Endpoints", "Middleware", "Database models", "Validation", "Authentication"]
        elif spec.type == ProjectType.DATA_PIPELINE:
            tasks = ["Data ingestion", "Transformation", "Validation", "Storage", "Monitoring"]
        elif spec.type == ProjectType.AI_SYSTEM:
            tasks = ["Model architecture", "Training pipeline", "Inference", "Data preprocessing", "Evaluation"]
        else:
            tasks = ["Core logic", "Utilities", "Configuration", "Testing", "Documentation"]

        return tasks[builder_index % len(tasks)]

    async def simulate_agent_work(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate agent work - in real implementation, this spawns actual agents"""

        print(f"   🤖 Agent {config['role']} working on: {config['objective']}")

        # Simulate work with delay
        await asyncio.sleep(0.5)

        # Record pattern if neural core available
        if self.neural_core:
            remember_pattern(f"factory_{config['role']}", {
                "objective": config["objective"],
                "success": True
            })

        return {
            "agent": config["role"],
            "output": f"Completed: {config['objective']}",
            "status": "success"
        }

    async def parallel_agent_work(self, agents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute multiple agents in parallel"""

        tasks = [self.simulate_agent_work(agent) for agent in agents]
        results = await asyncio.gather(*tasks)
        return results

    async def parallel_team_execution(self, builders: List[Dict], num_teams: int) -> List[Dict[str, Any]]:
        """Execute builders in parallel teams"""

        team_size = len(builders) // num_teams
        teams = [builders[i:i + team_size] for i in range(0, len(builders), team_size)]

        all_results = []
        for i, team in enumerate(teams):
            print(f"\n   👥 Team {i + 1} executing {len(team)} tasks...")
            results = await self.parallel_agent_work(team)
            all_results.extend(results)

        return all_results

    def generate_output_structure(self, spec: ProjectSpecification):
        """Generate the output project structure"""

        print(f"\n📁 Generating output structure in: {self.output_dir}")

        # Create base directories
        dirs_to_create = [
            self.output_dir / "src",
            self.output_dir / "tests",
            self.output_dir / "docs",
            self.output_dir / "config",
        ]

        # Add type-specific directories
        if spec.type == ProjectType.WEB_APP:
            dirs_to_create.extend([
                self.output_dir / "src" / "components",
                self.output_dir / "src" / "pages",
                self.output_dir / "src" / "styles",
                self.output_dir / "public"
            ])
        elif spec.type == ProjectType.API_SERVICE:
            dirs_to_create.extend([
                self.output_dir / "src" / "routes",
                self.output_dir / "src" / "models",
                self.output_dir / "src" / "middleware",
                self.output_dir / "src" / "services"
            ])

        for dir_path in dirs_to_create:
            dir_path.mkdir(parents=True, exist_ok=True)

        # Create README
        readme_content = f"""# {spec.name}

Generated by The Factory

## Project Type
{spec.type.value}

## Objectives
{chr(10).join('- ' + obj for obj in spec.objectives)}

## Features
### Core
{chr(10).join('- ' + feat for feat in spec.features.get('core', []))}

### Extended
{chr(10).join('- ' + feat for feat in spec.features.get('extended', []))}

## Technical Stack
- Language: {spec.technical.get('language', 'auto')}
- Framework: {spec.technical.get('framework', 'auto')}
- Database: {spec.technical.get('database', 'auto')}
- Deployment: {spec.technical.get('deployment', 'auto')}

## Generated Outputs
{chr(10).join('- ' + out for out in spec.output)}

---
Built with The Factory - Universal Self-Building System
"""

        with open(self.output_dir / "README.md", 'w', encoding='utf-8') as f:
            f.write(readme_content)

        print(f"   ✅ Output structure created at: {self.output_dir}")

    async def build(self):
        """Main build process"""

        print("\n" + "=" * 60)
        print("🏭 THE FACTORY - Universal Self-Building System")
        print("=" * 60)

        # Read specification
        print(f"\n📖 Reading specification from: {self.spec_path}")
        spec_text = self.read_specification(self.spec_path)

        # Parse specification
        print("🔍 Parsing specification...")
        self.project_spec = self.parse_specification(spec_text)

        print(f"\n📋 Project: {self.project_spec.name}")
        print(f"   Type: {self.project_spec.type.value}")
        print(f"   Complexity: {self.project_spec.complexity.value}")
        print(f"   Paradigm: {self.project_spec.paradigm.value}")

        # Determine strategy
        print("\n🎯 Determining orchestration strategy...")
        strategy = self.determine_orchestration_strategy(self.project_spec)

        # Check for previous learnings
        if self.neural_core:
            recommendation = get_recommendation(f"factory_{self.project_spec.type.value}")
            if recommendation:
                print(f"\n💡 Previous learning found: {recommendation}")

        # Spawn chain reaction
        result = await self.spawn_chain_reaction(self.project_spec, strategy)

        # Generate output structure
        self.generate_output_structure(self.project_spec)

        print("\n" + "=" * 60)
        print("✨ BUILD COMPLETE!")
        print(f"   Output location: {self.output_dir}")
        print("=" * 60)

        return result

    def init(self):
        """Initialize The Factory system"""

        print("\n🏭 Initializing The Factory...")

        # Create directory structure
        dirs = [
            Path("specs"),
            Path("outputs"),
            Path("agents"),
            Path("templates"),
            Path("lib")
        ]

        for dir_path in dirs:
            dir_path.mkdir(exist_ok=True)
            print(f"   ✅ Created: {dir_path}")

        # Create default project spec if not exists
        default_spec = Path("specs/project_spec.md")
        if not default_spec.exists():
            with open(default_spec, 'w', encoding='utf-8') as f:
                f.write("""# My Project

## What to build
A web application for task management

## Core Features
- User authentication
- Create, read, update, delete tasks
- Task categorization
- Due date tracking

## Technical Stack (optional)
- Frontend: auto
- Backend: auto
- Database: auto

## Special Requirements
- Mobile responsive
- Real-time updates

## Output
- Complete source code
- Documentation
- Deployment instructions
""")
            print(f"   ✅ Created default specification: {default_spec}")

        print("\n✅ The Factory initialized successfully!")
        print("   Edit specs/project_spec.md and run with --build")

def main():
    """Main entry point"""

    parser = argparse.ArgumentParser(description="The Factory - Universal Self-Building System")
    parser.add_argument("--init", action="store_true", help="Initialize The Factory")
    parser.add_argument("--build", action="store_true", help="Build project from specification")
    parser.add_argument("--spec", type=str, help="Path to project specification")
    parser.add_argument("--output", type=str, help="Output directory")
    parser.add_argument("--parallel", action="store_true", help="Enable parallel execution")
    parser.add_argument("--iterate", action="store_true", help="Enable self-improvement iterations")
    parser.add_argument("--quality-threshold", type=float, default=0.9, help="Quality threshold for iterations")

    args = parser.parse_args()

    if args.init:
        genesis = GenesisPrime()
        genesis.init()
    elif args.build:
        genesis = GenesisPrime(
            spec_path=args.spec or "specs/project_spec.md",
            output_dir=args.output or "outputs/project_root"
        )
        asyncio.run(genesis.build())
    else:
        print("Usage: genesis_prime.py --init | --build [options]")
        print("Run with --help for more options")

if __name__ == "__main__":
    main()
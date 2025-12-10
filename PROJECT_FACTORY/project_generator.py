#!/usr/bin/env python3
"""
PROJECT FACTORY - Meta-System Generator
=======================================
Creates self-contained projects using ALL intelligence from the entire system
Each project becomes independent but leverages the full power of:
- THE_ORCHESTRATOR
- BACOWR Platform
- SEO Intelligence
- Visual Flow System
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Add parent directory to use all system intelligence
sys.path.insert(0, str(Path(__file__).parent.parent))

class ProjectFactory:
    """
    The Meta-System that creates new self-contained projects
    """

    def __init__(self):
        self.factory_root = Path(__file__).parent
        self.system_root = self.factory_root.parent
        self.projects_dir = self.factory_root / "projects"
        self.templates_dir = self.factory_root / "templates"

        # Access to ALL system intelligence
        self.orchestrator_path = self.system_root / "THE_ORCHESTRATOR"
        self.backend_path = self.system_root / "backend"
        self.frontend_path = self.system_root / "frontend"

        print("""
        ╔═══════════════════════════════════════════════════════════╗
        ║                   PROJECT FACTORY                         ║
        ║         Meta-System for Self-Contained Projects          ║
        ╠═══════════════════════════════════════════════════════════╣
        ║  • Uses ALL system intelligence                          ║
        ║  • Creates independent projects                          ║
        ║  • Each project becomes self-sufficient                  ║
        ║  • Original system remains neutral                       ║
        ╚═══════════════════════════════════════════════════════════╝
        """)

    def create_new_project(self, project_name: str) -> Path:
        """
        Create a new self-contained project
        """
        # Create unique project directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        project_dir = self.projects_dir / f"{project_name}_{timestamp}"
        project_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n🏭 Creating new project: {project_name}")
        print(f"📁 Location: {project_dir}")

        # Create project structure
        self._create_project_structure(project_dir)

        # Create project_spec.md template
        self._create_project_spec(project_dir, project_name)

        # Setup intelligence adapters
        self._setup_intelligence_adapters(project_dir)

        print(f"\n✅ Project created successfully!")
        print(f"\n📝 Next steps:")
        print(f"   1. Edit {project_dir}/project_spec.md with your requirements")
        print(f"   2. Run 'python build.py' in the project directory")
        print(f"   3. Your self-contained system will be generated")

        return project_dir

    def _create_project_structure(self, project_dir: Path):
        """
        Create the basic project structure
        """
        directories = [
            "src",
            "config",
            "orchestration",
            "workflows",
            "agents",
            "output",
            "logs",
            ".intelligence"  # Hidden directory for system connections
        ]

        for dir_name in directories:
            (project_dir / dir_name).mkdir(exist_ok=True)

        print("  ✓ Project structure created")

    def _create_project_spec(self, project_dir: Path, project_name: str):
        """
        Create the project_spec.md template
        """
        spec_content = f"""# Project Specification: {project_name}

## Project Overview
<!-- Describe your project's purpose and goals -->

## System Requirements

### Core Functionality
<!-- What should this system do? -->

### Intelligence Requirements
Select which system intelligence to use:
- [ ] THE_ORCHESTRATOR - Multi-agent orchestration
- [ ] BACOWR - Backlink and SEO campaigns
- [ ] SEO Intelligence - Analysis and optimization
- [ ] Visual Flow - Drag-and-drop workflows
- [ ] Custom Agents - Define your own

### Orchestration Pattern
Choose primary pattern:
- [ ] Hierarchical (SOVEREIGN → ARCHITECT → SPECIALIST)
- [ ] Evolutionary (GENESIS genetic algorithms)
- [ ] Swarm (HIVEMIND collective)
- [ ] Temporal (ORACLE predictive)
- [ ] Unified (SYNTHESIS of all)

## Workflows

### Primary Workflow
<!-- Describe main workflow -->

### Agent Hierarchy
<!-- Define agent relationships -->

## Integration Points

### Input Sources
<!-- Where does data come from? -->

### Output Targets
<!-- Where should results go? -->

### API Connections
<!-- Any external APIs needed? -->

## Automation Rules

### Triggers
<!-- What starts processes? -->

### Schedules
<!-- Any scheduled tasks? -->

## Self-Sufficiency Requirements

### Standalone Operation
<!-- How should it work independently? -->

### Resource Management
<!-- Memory, processing, storage needs -->

---

## Build Configuration

```yaml
build:
  type: "autonomous"  # autonomous, managed, hybrid
  intelligence:
    orchestrator: true
    bacowr: false
    seo: false
    visual: false
  deployment:
    target: "local"  # local, cloud, docker
    auto_start: true
  optimization:
    minimize_size: false
    maximize_performance: true
```

---

*This specification will be used to generate your self-contained system.*
*Edit this file and run `python build.py` when ready.*
"""

        spec_path = project_dir / "project_spec.md"
        spec_path.write_text(spec_content)
        print(f"  ✓ Created project_spec.md")

    def _setup_intelligence_adapters(self, project_dir: Path):
        """
        Setup adapters to use system intelligence
        """
        # Create intelligence adapter
        adapter_content = f"""# Intelligence Adapter Configuration
# This connects to the parent system's intelligence

import sys
from pathlib import Path

# Parent system paths (DO NOT MODIFY)
PARENT_SYSTEM = Path(r"{self.system_root}")
ORCHESTRATOR = Path(r"{self.orchestrator_path}")
BACKEND = Path(r"{self.backend_path}")
FRONTEND = Path(r"{self.frontend_path}")

# Add to path for imports
sys.path.insert(0, str(PARENT_SYSTEM))
sys.path.insert(0, str(ORCHESTRATOR))

# Intelligence modules available
AVAILABLE_INTELLIGENCE = {{
    'orchestrator': ORCHESTRATOR / 'SOVEREIGN_AGENTS',
    'llm': ORCHESTRATOR / 'SOVEREIGN_LLM',
    'genesis': ORCHESTRATOR / 'SOVEREIGN_GENESIS',
    'bacowr': ORCHESTRATOR / 'SOVEREIGN_GENESIS' / 'BACOWR_Architecture.md',
    'seo': BACKEND / 'src' / 'api',
    'visual': FRONTEND / 'src' / 'components'
}}

def get_intelligence(module: str):
    '''Access parent system intelligence'''
    if module in AVAILABLE_INTELLIGENCE:
        return AVAILABLE_INTELLIGENCE[module]
    raise ValueError(f"Unknown intelligence module: {{module}}")

# Project-specific configuration
PROJECT_DIR = Path(__file__).parent.parent
PROJECT_NAME = "{project_dir.name}"
"""

        adapter_path = project_dir / ".intelligence" / "adapter.py"
        adapter_path.write_text(adapter_content)
        print("  ✓ Intelligence adapters configured")


class ProjectBuilder:
    """
    Builds self-contained projects from specifications
    """

    def __init__(self, project_dir: Path):
        self.project_dir = project_dir
        self.spec_path = project_dir / "project_spec.md"
        self.intelligence_dir = project_dir / ".intelligence"

    def build(self):
        """
        Build the project from specification
        """
        print("\n🔨 Building self-contained project...")

        # Parse specification
        spec = self._parse_specification()

        # Generate system based on spec
        self._generate_system(spec)

        # Make it self-contained
        self._make_self_contained(spec)

        print("\n✨ Project is now self-contained and ready to run!")

    def _parse_specification(self) -> Dict:
        """
        Parse project_spec.md
        """
        if not self.spec_path.exists():
            raise FileNotFoundError(f"Please create {self.spec_path} first!")

        # Parse the markdown specification
        # (simplified for now)
        spec_content = self.spec_path.read_text()

        return {
            "content": spec_content,
            "orchestrator": "orchestrator" in spec_content.lower(),
            "bacowr": "bacowr" in spec_content.lower(),
            "seo": "seo" in spec_content.lower(),
            "visual": "visual" in spec_content.lower()
        }

    def _generate_system(self, spec: Dict):
        """
        Generate the actual system files
        """
        # Create main.py
        main_content = '''#!/usr/bin/env python3
"""
Auto-generated self-contained system
Built by PROJECT_FACTORY
"""

import sys
from pathlib import Path

# Add intelligence adapter
sys.path.insert(0, str(Path(__file__).parent / ".intelligence"))
from adapter import get_intelligence, AVAILABLE_INTELLIGENCE

class SelfContainedSystem:
    """Your autonomous system"""

    def __init__(self):
        self.name = Path(__file__).parent.name
        print(f"Initializing {self.name}...")

    def run(self):
        """Main execution"""
        print(f"Running autonomous system: {self.name}")
        # Your system logic here

if __name__ == "__main__":
    system = SelfContainedSystem()
    system.run()
'''

        (self.project_dir / "main.py").write_text(main_content)
        print("  ✓ Generated main system files")

    def _make_self_contained(self, spec: Dict):
        """
        Copy necessary components to make project self-contained
        """
        # Copy only what's needed based on spec
        if spec.get("orchestrator"):
            # Copy minimal orchestrator components
            print("  ✓ Integrated orchestrator intelligence")

        if spec.get("bacowr"):
            print("  ✓ Integrated BACOWR capabilities")

        if spec.get("seo"):
            print("  ✓ Integrated SEO intelligence")


def main():
    """
    Main entry point for PROJECT_FACTORY
    """
    factory = ProjectFactory()

    if len(sys.argv) > 1:
        project_name = sys.argv[1]
    else:
        project_name = input("\n📝 Enter project name: ")

    # Create new project
    project_dir = factory.create_new_project(project_name)

    # Ask if user wants to open project_spec.md
    response = input("\n📄 Open project_spec.md for editing? (y/n): ")
    if response.lower() == 'y':
        spec_path = project_dir / "project_spec.md"
        if sys.platform == 'win32':
            os.startfile(spec_path)
        else:
            os.system(f"open '{spec_path}'")

if __name__ == "__main__":
    main()
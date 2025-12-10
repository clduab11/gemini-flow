#!/usr/bin/env python3
"""
SOVEREIGN LOADER - Integration with THE_ORCHESTRATOR
This module loads and integrates all SOVEREIGN components into The Factory.
"""

import sys
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import importlib.util
import json

# Add THE_ORCHESTRATOR to path
ORCHESTRATOR_PATH = Path(__file__).parent.parent.parent / "THE_ORCHESTRATOR"
sys.path.insert(0, str(ORCHESTRATOR_PATH))

class SovereignLoader:
    """
    Loads and integrates SOVEREIGN components into The Factory.
    Provides access to all orchestration paradigms and agent types.
    """

    def __init__(self):
        self.orchestrator_path = ORCHESTRATOR_PATH
        self.loaded_modules = {}
        self.available_paradigms = {}
        self.available_agents = {}
        self.neural_enabled = False

    def load_all(self) -> Dict[str, Any]:
        """Load all SOVEREIGN components"""

        print("🔧 Loading SOVEREIGN components...")

        # Load core components
        self.load_sovereign_core()

        # Load paradigm-specific agents
        self.load_paradigm_agents()

        # Load APEX systems
        self.load_apex_systems()

        # Load Neural Overlay
        self.load_neural_overlay()

        # Load LBOF for bulk orchestration
        self.load_lbof()

        print("✅ All SOVEREIGN components loaded")

        return {
            "modules": self.loaded_modules,
            "paradigms": self.available_paradigms,
            "agents": self.available_agents,
            "neural": self.neural_enabled
        }

    def load_sovereign_core(self):
        """Load core SOVEREIGN components"""

        core_modules = [
            ("sovereign_core", "SOVEREIGN_AGENTS/01_CORE/sovereign_core.py"),
            ("the_sovereign", "SOVEREIGN_AGENTS/03_SOVEREIGN/the_sovereign.py"),
            ("agent_hierarchy", "SOVEREIGN_AGENTS/02_HIERARCHY/agent_hierarchy.py"),
        ]

        for module_name, module_path in core_modules:
            full_path = self.orchestrator_path / module_path
            if full_path.exists():
                try:
                    module = self.load_module(module_name, full_path)
                    self.loaded_modules[module_name] = module
                    print(f"   ✅ Loaded: {module_name}")
                except Exception as e:
                    print(f"   ⚠️ Could not load {module_name}: {e}")

    def load_paradigm_agents(self):
        """Load paradigm-specific agent implementations"""

        paradigm_modules = {
            "hierarchical": "SOVEREIGN_AGENTS/02_HIERARCHY/agent_hierarchy.py",
            "genesis": "SOVEREIGN_AGENTS/04_VARIANTS/genesis_collective.py",
            "neural": "SOVEREIGN_AGENTS/04_VARIANTS/neural_collective.py",
            "mesh": "SOVEREIGN_AGENTS/04_VARIANTS/neural_mesh.py",
            "swarm": "SOVEREIGN_AGENTS/04_VARIANTS/hivemind_swarm.py",
            "council": "SOVEREIGN_AGENTS/04_VARIANTS/council_of_minds.py",
            "temporal": "SOVEREIGN_AGENTS/04_VARIANTS/temporal_nexus.py",
            "recursive": "SOVEREIGN_AGENTS/04_VARIANTS/recursive_orchestrators.py",
        }

        for paradigm, module_path in paradigm_modules.items():
            full_path = self.orchestrator_path / module_path
            if full_path.exists():
                try:
                    module = self.load_module(f"paradigm_{paradigm}", full_path)
                    self.available_paradigms[paradigm] = {
                        "module": module,
                        "path": str(full_path),
                        "loaded": True
                    }
                    print(f"   ✅ Paradigm loaded: {paradigm}")
                except Exception as e:
                    print(f"   ⚠️ Could not load paradigm {paradigm}: {e}")
                    self.available_paradigms[paradigm] = {
                        "module": None,
                        "path": str(full_path),
                        "loaded": False,
                        "error": str(e)
                    }

    def load_apex_systems(self):
        """Load APEX creative and R&D systems"""

        apex_modules = {
            "apex_spark": "THE_APEX/APEX_SPARK.md",
            "apex_lab": "THE_APEX/APEX_LAB/APEX_LAB_SYSTEM_PROMPT.md",
            "apex_forge": "THE_APEX/apex_forge/APEX_FORGE_SYSTEM.md",
            "apex_framework": "THE_APEX/apex-framework/apex/core.py",
        }

        for apex_name, module_path in apex_modules.items():
            full_path = self.orchestrator_path / module_path
            if full_path.exists():
                if module_path.endswith('.md'):
                    # Load as prompt/documentation
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    self.loaded_modules[apex_name] = {"type": "prompt", "content": content}
                    print(f"   ✅ APEX prompt loaded: {apex_name}")
                else:
                    # Load as Python module
                    try:
                        module = self.load_module(apex_name, full_path)
                        self.loaded_modules[apex_name] = {"type": "module", "module": module}
                        print(f"   ✅ APEX module loaded: {apex_name}")
                    except Exception as e:
                        print(f"   ⚠️ Could not load APEX {apex_name}: {e}")

    def load_neural_overlay(self):
        """Load Neural Overlay for learning and memory"""

        try:
            neural_path = self.orchestrator_path / "NEURAL_OVERLAY/neural_core.py"
            if neural_path.exists():
                module = self.load_module("neural_core", neural_path)
                self.loaded_modules["neural_core"] = module

                # Also load minimal hook for easy access
                hook_path = self.orchestrator_path / "NEURAL_OVERLAY/minimal_hook.py"
                if hook_path.exists():
                    hook_module = self.load_module("neural_hook", hook_path)
                    self.loaded_modules["neural_hook"] = hook_module

                self.neural_enabled = True
                print("   ✅ Neural Overlay loaded - learning enabled")
        except Exception as e:
            print(f"   ⚠️ Neural Overlay not loaded: {e}")
            self.neural_enabled = False

    def load_lbof(self):
        """Load LBOF bulk orchestration framework"""

        lbof_path = self.orchestrator_path / "lbof-orchestration-suite/bulk-orchestration-framework.md"
        if lbof_path.exists():
            with open(lbof_path, 'r', encoding='utf-8') as f:
                content = f.read()
            self.loaded_modules["lbof"] = {
                "type": "framework",
                "content": content,
                "teams": ["Alpha", "Beta", "Gamma", "Delta", "Epsilon",
                         "Zeta", "Eta", "Theta", "Iota", "Kappa"]
            }
            print("   ✅ LBOF bulk orchestration loaded")

    def load_module(self, name: str, path: Path):
        """Dynamically load a Python module"""

        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def get_orchestration_for_complexity(self, complexity: str) -> Dict[str, Any]:
        """Get recommended orchestration based on complexity"""

        recommendations = {
            "simple": {
                "paradigm": "hierarchical",
                "agents": 5,
                "teams": 1,
                "modules": ["sovereign_core", "agent_hierarchy"]
            },
            "medium": {
                "paradigm": "swarm",
                "agents": 20,
                "teams": 1,
                "modules": ["sovereign_core", "paradigm_swarm", "neural_hook"]
            },
            "complex": {
                "paradigm": "neural",
                "agents": 50,
                "teams": 3,
                "modules": ["sovereign_core", "paradigm_neural", "paradigm_mesh", "neural_core"]
            },
            "extreme": {
                "paradigm": "hybrid",
                "agents": 100,
                "teams": 10,
                "modules": ["sovereign_core", "lbof", "all_paradigms", "neural_core"]
            }
        }

        return recommendations.get(complexity.lower(), recommendations["medium"])

    def create_orchestrator(self, paradigm: str, config: Dict[str, Any]):
        """Create an orchestrator instance based on paradigm"""

        if paradigm not in self.available_paradigms:
            raise ValueError(f"Paradigm {paradigm} not available")

        paradigm_info = self.available_paradigms[paradigm]
        if not paradigm_info["loaded"]:
            raise RuntimeError(f"Paradigm {paradigm} failed to load: {paradigm_info.get('error')}")

        # Get the module
        module = paradigm_info["module"]

        # Create orchestrator based on paradigm type
        if paradigm == "hierarchical":
            return self.create_hierarchical_orchestrator(module, config)
        elif paradigm == "swarm":
            return self.create_swarm_orchestrator(module, config)
        elif paradigm == "neural":
            return self.create_neural_orchestrator(module, config)
        elif paradigm == "temporal":
            return self.create_temporal_orchestrator(module, config)
        else:
            # Generic creation
            return self.create_generic_orchestrator(module, config)

    def create_hierarchical_orchestrator(self, module, config):
        """Create hierarchical orchestrator"""
        if hasattr(module, 'HierarchicalOrchestrator'):
            return module.HierarchicalOrchestrator(**config)
        elif hasattr(module, 'AgentHierarchy'):
            return module.AgentHierarchy(**config)
        else:
            raise AttributeError(f"Module {module} has no hierarchical orchestrator class")

    def create_swarm_orchestrator(self, module, config):
        """Create swarm orchestrator"""
        if hasattr(module, 'SwarmOrchestrator'):
            return module.SwarmOrchestrator(**config)
        elif hasattr(module, 'HivemindSwarm'):
            return module.HivemindSwarm(**config)
        else:
            raise AttributeError(f"Module {module} has no swarm orchestrator class")

    def create_neural_orchestrator(self, module, config):
        """Create neural orchestrator"""
        if hasattr(module, 'NeuralOrchestrator'):
            return module.NeuralOrchestrator(**config)
        elif hasattr(module, 'NeuralCollective'):
            return module.NeuralCollective(**config)
        else:
            raise AttributeError(f"Module {module} has no neural orchestrator class")

    def create_temporal_orchestrator(self, module, config):
        """Create temporal orchestrator"""
        if hasattr(module, 'TemporalOrchestrator'):
            return module.TemporalOrchestrator(**config)
        elif hasattr(module, 'TemporalNexus'):
            return module.TemporalNexus(**config)
        else:
            raise AttributeError(f"Module {module} has no temporal orchestrator class")

    def create_generic_orchestrator(self, module, config):
        """Create generic orchestrator"""
        # Try to find any orchestrator class
        for attr_name in dir(module):
            if 'orchestrator' in attr_name.lower():
                orchestrator_class = getattr(module, attr_name)
                if callable(orchestrator_class):
                    return orchestrator_class(**config)

        raise AttributeError(f"Module {module} has no identifiable orchestrator class")

    def get_available_capabilities(self) -> Dict[str, List[str]]:
        """Get all available capabilities from loaded modules"""

        capabilities = {
            "paradigms": list(self.available_paradigms.keys()),
            "modules": list(self.loaded_modules.keys()),
            "features": []
        }

        # Check for specific features
        if self.neural_enabled:
            capabilities["features"].append("neural_learning")

        if "lbof" in self.loaded_modules:
            capabilities["features"].append("bulk_orchestration")

        if "apex_spark" in self.loaded_modules:
            capabilities["features"].append("creative_generation")

        return capabilities

    def save_state(self, path: str):
        """Save current loader state for persistence"""

        state = {
            "loaded_modules": list(self.loaded_modules.keys()),
            "available_paradigms": list(self.available_paradigms.keys()),
            "neural_enabled": self.neural_enabled,
            "orchestrator_path": str(self.orchestrator_path)
        }

        with open(path, 'w') as f:
            json.dump(state, f, indent=2)

        print(f"   💾 State saved to {path}")

    def load_state(self, path: str):
        """Load previously saved state"""

        with open(path, 'r') as f:
            state = json.load(f)

        print(f"   📂 Loading state from {path}")

        # Reload modules based on saved state
        # (Implementation depends on specific needs)

        return state


# Singleton instance for global access
_sovereign_loader = None

def get_sovereign_loader() -> SovereignLoader:
    """Get or create the singleton SovereignLoader instance"""
    global _sovereign_loader
    if _sovereign_loader is None:
        _sovereign_loader = SovereignLoader()
        _sovereign_loader.load_all()
    return _sovereign_loader


if __name__ == "__main__":
    # Test loading
    loader = SovereignLoader()
    components = loader.load_all()

    print("\n📊 Loaded Components Summary:")
    print(f"   Modules: {len(components['modules'])}")
    print(f"   Paradigms: {len(components['paradigms'])}")
    print(f"   Neural: {'✅ Enabled' if components['neural'] else '❌ Disabled'}")

    print("\n🎯 Available Capabilities:")
    capabilities = loader.get_available_capabilities()
    print(json.dumps(capabilities, indent=2))

    # Save state for later use
    loader.save_state("loader_state.json")
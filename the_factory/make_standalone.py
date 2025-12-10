#!/usr/bin/env python3
"""
MAKE THE FACTORY STANDALONE
This script copies all necessary dependencies from THE_ORCHESTRATOR
into the_factory/lib/ making The Factory completely self-contained.
No code modifications needed - just copying files.
"""

import os
import shutil
from pathlib import Path
import json

class FactoryStandalone:
    def __init__(self):
        self.factory_root = Path(__file__).parent
        self.lib_dir = self.factory_root / "lib"
        self.orchestrator_path = self.factory_root.parent / "THE_ORCHESTRATOR"

        # Files and directories to copy
        self.dependencies = {
            "SOVEREIGN_AGENTS": {
                "source": "SOVEREIGN_AGENTS",
                "files": [
                    "01_CORE/sovereign_core.py",
                    "02_HIERARCHY/agent_hierarchy.py",
                    "03_SOVEREIGN/the_sovereign.py",
                    "04_VARIANTS/council_of_minds.py",
                    "04_VARIANTS/genesis_collective.py",
                    "04_VARIANTS/hivemind_swarm.py",
                    "04_VARIANTS/neural_collective.py",
                    "04_VARIANTS/neural_mesh.py",
                    "04_VARIANTS/nexus_oracle.py",
                    "04_VARIANTS/recursive_orchestrators.py",
                    "04_VARIANTS/temporal_nexus.py",
                    "05_APEX/apex_manifestation.py",
                    "05_INFINITE_REGRESS/infinite_regress.py",
                    "05_OMEGA/omega_orchestrator.py",
                    "05_SYNTHESIS/synthesis_engine.py",
                    "06_LIVING/llm_brain.py",
                    "__init__.py"  # Will create if not exists
                ]
            },
            "NEURAL_OVERLAY": {
                "source": "NEURAL_OVERLAY",
                "files": [
                    "neural_core.py",
                    "minimal_hook.py",
                    "neural_daemon.py",
                    "init_neural_db.py",
                    "__init__.py"
                ]
            },
            "THE_APEX": {
                "source": "THE_APEX",
                "files": [
                    "APEX_SPARK.md",
                    "apex-framework/apex/core.py",
                    "apex-framework/apex/__init__.py",
                    "apex-framework/apex/domains/__init__.py",
                    "apex-framework/apex/domains/seo_content.py"
                ]
            },
            "SOVEREIGN_GENESIS": {
                "source": "SOVEREIGN_GENESIS",
                "files": [
                    "00_GENESIS_MANIFEST.md",
                    "01_GENESIS_AGENT.md",
                    "02_FULL_PRODUCT_GENESIS.md"
                ]
            },
            "SOVEREIGN_LLM": {
                "source": "SOVEREIGN_LLM",
                "files": [
                    "KNOWLEDGE_MULTIPLICATION_LOOP.md",
                    "KNOWLEDGE_PRIMITIVES.md",
                    "SOVEREIGN_SYSTEM_PROMPT.md"
                ]
            },
            "lbof-orchestration-suite": {
                "source": "lbof-orchestration-suite",
                "files": [
                    "bulk-orchestration-framework.md",
                    "orchestrator.sh",
                    "mega_file_processor.py"
                ]
            }
        }

    def make_standalone(self):
        """Make The Factory standalone by copying all dependencies"""

        print("🏭 Making The Factory Standalone...")
        print("=" * 60)

        # Create lib directory
        self.lib_dir.mkdir(exist_ok=True)
        print(f"✅ Created lib directory: {self.lib_dir}")

        # Copy dependencies
        total_files = 0
        for module_name, module_info in self.dependencies.items():
            print(f"\n📦 Copying {module_name}...")

            source_base = self.orchestrator_path / module_info["source"]
            target_base = self.lib_dir / module_name

            # Create target directory
            target_base.mkdir(parents=True, exist_ok=True)

            # Copy files
            for file_path in module_info["files"]:
                source_file = source_base / file_path
                target_file = target_base / file_path

                # Create parent directories
                target_file.parent.mkdir(parents=True, exist_ok=True)

                if source_file.exists():
                    if source_file.is_file():
                        shutil.copy2(source_file, target_file)
                        print(f"   ✅ {file_path}")
                        total_files += 1
                    elif source_file.is_dir():
                        shutil.copytree(source_file, target_file, dirs_exist_ok=True)
                        print(f"   ✅ {file_path} (directory)")
                        total_files += 1
                else:
                    # Create __init__.py if it doesn't exist
                    if file_path.endswith("__init__.py"):
                        target_file.touch()
                        print(f"   ✅ Created {file_path}")
                        total_files += 1
                    else:
                        print(f"   ⚠️ Not found: {file_path}")

        # Update the bootstrap files to use local lib
        self.update_imports()

        # Create standalone config
        self.create_standalone_config()

        print("\n" + "=" * 60)
        print(f"✨ The Factory is now standalone!")
        print(f"   Total files copied: {total_files}")
        print(f"   Location: {self.lib_dir}")
        print("\n📝 Next steps:")
        print("   1. The Factory no longer needs THE_ORCHESTRATOR")
        print("   2. You can move the_factory folder anywhere")
        print("   3. All dependencies are in the_factory/lib/")

        return total_files

    def update_imports(self):
        """Update bootstrap files to use local lib instead of THE_ORCHESTRATOR"""

        print("\n🔧 Updating import paths...")

        # Create new sovereign_loader_standalone.py
        standalone_loader = self.factory_root / "bootstrap" / "sovereign_loader_standalone.py"

        loader_content = '''#!/usr/bin/env python3
"""
SOVEREIGN LOADER STANDALONE
This version loads from local lib/ instead of THE_ORCHESTRATOR
"""

import sys
from pathlib import Path

# Use local lib instead of THE_ORCHESTRATOR
LIB_PATH = Path(__file__).parent.parent / "lib"
sys.path.insert(0, str(LIB_PATH))

# Now import normally - Python will find them in lib/
from SOVEREIGN_AGENTS.CORE import sovereign_core
from NEURAL_OVERLAY import neural_core, minimal_hook

# Re-export the original loader interface
from sovereign_loader import *

print("✅ Using standalone libraries from lib/")
'''

        with open(standalone_loader, 'w', encoding='utf-8') as f:
            f.write(loader_content)

        print("   ✅ Created sovereign_loader_standalone.py")

        # Create switcher script
        switcher = self.factory_root / "bootstrap" / "use_standalone.py"

        switcher_content = '''#!/usr/bin/env python3
"""
Switch between standalone and integrated mode
"""

import os
import sys

def enable_standalone():
    """Use local lib/ dependencies"""
    os.environ["FACTORY_MODE"] = "standalone"
    print("✅ The Factory is now using standalone mode (lib/)")

def enable_integrated():
    """Use THE_ORCHESTRATOR dependencies"""
    os.environ["FACTORY_MODE"] = "integrated"
    print("✅ The Factory is now using integrated mode (THE_ORCHESTRATOR)")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "integrated":
        enable_integrated()
    else:
        enable_standalone()
'''

        with open(switcher, 'w', encoding='utf-8') as f:
            f.write(switcher_content)

        print("   ✅ Created mode switcher")

    def create_standalone_config(self):
        """Create configuration for standalone mode"""

        config = {
            "mode": "standalone",
            "version": "1.0",
            "lib_path": "lib/",
            "dependencies_copied": list(self.dependencies.keys()),
            "standalone_date": str(Path.ctime(self.lib_dir)),
            "features": {
                "sovereign": True,
                "neural_overlay": True,
                "apex": True,
                "lbof": True,
                "genesis": True
            }
        }

        config_file = self.factory_root / "standalone_config.json"

        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)

        print("\n📋 Created standalone configuration")

    def verify_standalone(self):
        """Verify that all dependencies are available locally"""

        print("\n🔍 Verifying standalone installation...")

        critical_files = [
            "lib/SOVEREIGN_AGENTS/01_CORE/sovereign_core.py",
            "lib/NEURAL_OVERLAY/neural_core.py",
            "lib/NEURAL_OVERLAY/minimal_hook.py"
        ]

        all_good = True
        for file_path in critical_files:
            full_path = self.factory_root / file_path
            if full_path.exists():
                print(f"   ✅ {file_path}")
            else:
                print(f"   ❌ Missing: {file_path}")
                all_good = False

        if all_good:
            print("\n✅ All critical dependencies verified!")
        else:
            print("\n⚠️ Some dependencies missing. Run make_standalone() first.")

        return all_good

def main():
    """Make The Factory standalone"""

    maker = FactoryStandalone()

    # Check if already standalone
    if (maker.lib_dir / "SOVEREIGN_AGENTS").exists():
        print("🔍 The Factory appears to already be standalone.")
        print("   Verifying installation...")
        if maker.verify_standalone():
            print("\n✅ The Factory is already standalone and verified!")
        else:
            print("\n🔧 Repairing standalone installation...")
            maker.make_standalone()
    else:
        # Make standalone
        maker.make_standalone()

        # Verify
        maker.verify_standalone()

if __name__ == "__main__":
    main()
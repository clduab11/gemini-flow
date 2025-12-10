python#!/usr/bin/env python3
"""
Master Setup System - Intelligent auto-configuration and component generation.
Run this once to setup, verify, fix, and enhance the entire system.
"""
import subprocess
import sys
import json
from pathlib import Path

class SetupOrchestrator:
    def __init__(self):
        self.config = {
            "verified": {},
            "generated": {},
            "enhanced": {}
        }
        self.base_path = Path(__file__).parent
        
    def run(self):
        """Master orchestration - runs all setup components."""
        print("🚀 SEO Analyst Master Setup Starting...")
        
        # 1. Verify environment
        self._run_component("verify_environment.py", "Environment Check")
        
        # 2. Fix any issues
        self._run_component("auto_fixer.py", "Auto-Fix Issues")
        
        # 3. Generate missing components
        self._run_component("component_generator.py", "Generate Components")
        
        # 4. Enhance with patterns
        self._run_component("pattern_enhancer.py", "Enhance System")
        
        # 5. Create monitoring
        self._run_component("monitor_builder.py", "Build Monitoring")
        
        print("\n✅ Setup Complete! Run: python app/api.py")
        
    def _run_component(self, script, name):
        """Run a component script and capture results."""
        print(f"\n📦 Running {name}...")
        try:
            result = subprocess.run(
                [sys.executable, str(self.base_path / script)],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )
            if result.returncode != 0:
                print(f"❌ {name} failed: {result.stderr}")
                sys.exit(1)
            print(f"✅ {name} completed")
        except Exception as e:
            print(f"❌ Error running {script}: {e}")
            sys.exit(1)

if __name__ == "__main__":
    SetupOrchestrator().run()
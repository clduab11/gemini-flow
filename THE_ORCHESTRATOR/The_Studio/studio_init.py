#!/usr/bin/env python3
"""
STUDIO INITIALIZATION - Bootstrap the entire Studio ecosystem

This sets up:
- Self-healing file system
- Persistent memory databases
- Reality anchors
- Cross-repo awareness
- Context multiplexing
"""

import os
import sys
import json
import shutil
import sqlite3
from pathlib import Path
from datetime import datetime

def print_banner():
    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║                    🎭 THE STUDIO INITIALIZER 🎭                  ║
    ║                                                                   ║
    ║               Central Workshop for All Orchestration             ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)

class StudioInitializer:
    def __init__(self):
        self.studio_root = Path(__file__).parent
        self.orchestrator_root = self.studio_root.parent
        self.systems = []
        self.components = []

    def scan_ecosystem(self):
        """Scan for all available systems"""
        print("\n📡 Scanning ecosystem...")

        # Known systems to look for
        known_systems = [
            "SOVEREIGN_AGENTS",
            "SOVEREIGN_LLM",
            "SOVEREIGN_GENESIS",
            "THE_APEX",
            "NEURAL_OVERLAY",
            "lbof-orchestration-suite",
            "nexus-rag-builder"
        ]

        for system in known_systems:
            system_path = self.orchestrator_root / system
            if system_path.exists():
                self.systems.append(system)
                print(f"  ✓ Found {system}")

        print(f"\n📦 Discovered {len(self.systems)} systems")

    def create_directory_structure(self):
        """Create THE_STUDIO directory structure"""
        print("\n🏗️ Creating directory structure...")

        directories = [
            "SYNAPSIS",                # CLI autopilot
            "REGENERATIVE",            # Self-healing system
            "PERSISTENT_MEMORY",       # Cross-session memory
            "PERSISTENT_MEMORY/backups",
            "PERSISTENT_MEMORY/checkpoints",
            "CONTEXT_LOADER",          # Multi-repo awareness
            "FORGE",                   # System builder
            "REALITY_ANCHORS",        # Critical files
            "CONTROL_ROOM",           # Central orchestration
            "logs",                   # Logging
            "cache",                  # Temporary storage
            "exports"                 # Data exports
        ]

        for dir_name in directories:
            dir_path = self.studio_root / dir_name
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"  ✓ Created {dir_name}/")

    def initialize_databases(self):
        """Initialize all required databases"""
        print("\n💾 Initializing databases...")

        # Main synapsis database
        synapsis_db = self.studio_root / "PERSISTENT_MEMORY" / "synapsis.db"
        self._create_synapsis_db(synapsis_db)

        # Reality anchors database
        anchors_db = self.studio_root / "REALITY_ANCHORS" / "anchors.db"
        self._create_anchors_db(anchors_db)

        # Cross-repo links database
        links_db = self.studio_root / "CONTEXT_LOADER" / "links.db"
        self._create_links_db(links_db)

    def _create_synapsis_db(self, db_path):
        """Create the main synapsis database"""
        conn = sqlite3.connect(str(db_path))
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS memory_nodes (
                id TEXT PRIMARY KEY,
                timestamp TIMESTAMP,
                session_id TEXT,
                repo TEXT,
                data BLOB,
                importance REAL,
                access_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS patterns (
                pattern_id TEXT PRIMARY KEY,
                pattern_type TEXT,
                success_count INTEGER,
                failure_count INTEGER,
                last_used TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_timestamp ON memory_nodes(timestamp);
            CREATE INDEX IF NOT EXISTS idx_importance ON memory_nodes(importance DESC);
        """)
        conn.close()
        print("  ✓ Created synapsis.db")

    def _create_anchors_db(self, db_path):
        """Create the reality anchors database"""
        conn = sqlite3.connect(str(db_path))
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS anchored_files (
                file_path TEXT PRIMARY KEY,
                content_hash TEXT,
                backup_location TEXT,
                regeneration_method TEXT,
                last_verified TIMESTAMP,
                verify_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS regeneration_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT,
                regenerated_at TIMESTAMP,
                reason TEXT,
                success BOOLEAN
            );
        """)
        conn.close()
        print("  ✓ Created anchors.db")

    def _create_links_db(self, db_path):
        """Create the cross-repo links database"""
        conn = sqlite3.connect(str(db_path))
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS repo_links (
                source_repo TEXT,
                target_repo TEXT,
                link_type TEXT,
                strength REAL,
                created_at TIMESTAMP,
                PRIMARY KEY (source_repo, target_repo, link_type)
            );

            CREATE TABLE IF NOT EXISTS shared_patterns (
                pattern_id TEXT PRIMARY KEY,
                repos TEXT,  -- JSON array of repos using this pattern
                description TEXT,
                effectiveness REAL
            );
        """)
        conn.close()
        print("  ✓ Created links.db")

    def create_configuration_files(self):
        """Create essential configuration files"""
        print("\n⚙️ Creating configuration files...")

        # Studio manifest
        manifest = {
            "studio_version": "1.0.0",
            "initialized_at": datetime.now().isoformat(),
            "systems": self.systems,
            "features": {
                "synapsis": True,
                "regenerative": True,
                "persistent_memory": True,
                "reality_anchors": True,
                "context_multiplexing": True
            },
            "databases": [
                "PERSISTENT_MEMORY/synapsis.db",
                "REALITY_ANCHORS/anchors.db",
                "CONTEXT_LOADER/links.db"
            ]
        }

        manifest_path = self.studio_root / "studio_manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2))
        print("  ✓ Created studio_manifest.json")

        # Regeneration config
        regen_config = {
            "critical_files": [
                {
                    "path": "CLAUDE.md",
                    "sources": ["README.md files", "git history", "templates"],
                    "priority": 1
                },
                {
                    "path": "neural_memory.db",
                    "sources": ["backups", "checkpoints", "fresh"],
                    "priority": 1
                },
                {
                    "path": ".claude/settings.json",
                    "sources": ["defaults", "user_preferences"],
                    "priority": 2
                }
            ],
            "check_interval_seconds": 300,
            "backup_count": 10,
            "auto_heal": True
        }

        regen_path = self.studio_root / "REGENERATIVE" / "config.json"
        regen_path.write_text(json.dumps(regen_config, indent=2))
        print("  ✓ Created regeneration config")

    def create_startup_scripts(self):
        """Create startup scripts for various scenarios"""
        print("\n📜 Creating startup scripts...")

        # CLI startup script
        cli_startup = '''#!/usr/bin/env python3
"""THE STUDIO CLI Startup"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from claude_synapsis import CLISynapsis
from regenerative_daemon import RegenerativeDaemon

# Initialize synapsis
synapsis = CLISynapsis()
print(f"🧠 Synapsis active with {len(synapsis.synapsis.semantic_memory)} memories")

# Start regenerative daemon in background
import threading
daemon = RegenerativeDaemon()
daemon_thread = threading.Thread(target=daemon.run, daemon=True)
daemon_thread.start()
print("🔄 Regenerative daemon running")

print("✨ THE STUDIO is ready")
print("Use enhance_prompt(prompt) to add memory context")
'''
        (self.studio_root / "cli_startup.py").write_text(cli_startup)

        # Batch startup script
        batch_startup = '''@echo off
echo Starting THE STUDIO...
cd /d "%~dp0"
python studio_init.py
python claude_synapsis.py daemon
'''
        (self.studio_root / "start_studio.bat").write_text(batch_startup)

        # Shell startup script
        shell_startup = '''#!/bin/bash
echo "Starting THE STUDIO..."
cd "$(dirname "$0")"
python3 studio_init.py
python3 claude_synapsis.py daemon &
echo "THE STUDIO is running (PID: $!)"
'''
        shell_script = self.studio_root / "start_studio.sh"
        shell_script.write_text(shell_startup)
        shell_script.chmod(0o755)

        print("  ✓ Created startup scripts")

    def setup_reality_anchors(self):
        """Setup the self-healing reality anchor system"""
        print("\n🔧 Setting up reality anchors...")

        # Define critical files
        critical_files = [
            self.orchestrator_root / "CLAUDE.md",
            self.orchestrator_root / "neural_memory.db",
            self.studio_root / "studio_manifest.json"
        ]

        # Create backups of existing critical files
        backup_dir = self.studio_root / "REALITY_ANCHORS" / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)

        for file_path in critical_files:
            if file_path.exists():
                backup_name = f"{file_path.name}.{datetime.now().strftime('%Y%m%d_%H%M%S')}.backup"
                backup_path = backup_dir / backup_name
                shutil.copy2(file_path, backup_path)
                print(f"  ✓ Backed up {file_path.name}")

    def create_integration_hooks(self):
        """Create integration hooks for all systems"""
        print("\n🔌 Creating integration hooks...")

        # Create a universal hook file
        hook_content = '''"""Universal Studio Hook - Add to any system"""

def enable_studio_features():
    """Enable THE STUDIO features for any system"""
    import sys
    from pathlib import Path

    studio_path = Path(__file__).parent / "THE_STUDIO"
    if studio_path.exists():
        sys.path.insert(0, str(studio_path))

        try:
            from claude_synapsis import CLISynapsis
            synapsis = CLISynapsis()
            print("✓ Studio Synapsis enabled")
            return synapsis
        except ImportError:
            pass

    return None

# Auto-enable if imported
STUDIO_SYNAPSIS = enable_studio_features()
'''

        hook_path = self.studio_root / "universal_hook.py"
        hook_path.write_text(hook_content)
        print("  ✓ Created universal_hook.py")

    def generate_summary(self):
        """Generate initialization summary"""
        print("\n" + "="*70)
        print("✅ THE STUDIO INITIALIZATION COMPLETE!")
        print("="*70)

        print(f"""
Studio Features Enabled:
  🧠 Synapsis - Persistent memory system
  🔄 Regenerative - Self-healing files
  💾 Memory - Cross-session persistence
  🔗 Context Loader - Multi-repo awareness
  🎛️ Control Room - Central orchestration

Discovered Systems: {', '.join(self.systems)}

Quick Start:
  1. Start daemon: python claude_synapsis.py daemon
  2. Enable in CLI: python cli_startup.py
  3. Check reality: python regenerative_daemon.py

Integration:
  Add to any Python file:
  from THE_STUDIO.universal_hook import STUDIO_SYNAPSIS
""")

def main():
    print_banner()

    initializer = StudioInitializer()

    # Run initialization steps
    initializer.scan_ecosystem()
    initializer.create_directory_structure()
    initializer.initialize_databases()
    initializer.create_configuration_files()
    initializer.create_startup_scripts()
    initializer.setup_reality_anchors()
    initializer.create_integration_hooks()
    initializer.generate_summary()

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
CLAUDE SYNAPSIS - The Autopilot Memory System for CLI LLM Sessions

This creates a persistent, self-healing memory layer that:
- Survives between Claude sessions
- Auto-loads relevant context
- Self-heals when files are deleted
- Shares knowledge between CLI and browser sessions
"""

import json
import sqlite3
import hashlib
import shutil
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import pickle
import sys
import os

# Add parent directories to path
sys.path.append(str(Path(__file__).parent.parent))
from NEURAL_OVERLAY.neural_core import MemoryCrystallizer, NeuralDaemon

# ================== CORE SYNAPSIS ====================

@dataclass
class SynapsisNode:
    """A memory node that persists between sessions"""
    id: str
    session_id: str
    timestamp: datetime
    context_type: str  # 'command', 'pattern', 'learning', 'file_state'
    data: Dict[str, Any]
    repo_context: str
    importance: float = 1.0
    access_count: int = 0
    last_accessed: datetime = field(default_factory=datetime.now)

class ClaudeSynapsis:
    """
    The persistent memory system for Claude CLI sessions.
    Unlike browser where multiple contexts run simultaneously,
    CLI has one primary context but needs to remember EVERYTHING.
    """

    def __init__(self, studio_root: Path = None):
        self.studio_root = studio_root or Path(__file__).parent
        self.memory_db = self.studio_root / "PERSISTENT_MEMORY" / "synapsis.db"
        self.memory_db.parent.mkdir(parents=True, exist_ok=True)

        # Session management
        self.current_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.active_repo = os.getcwd()

        # Memory layers
        self.working_memory = {}  # Current session
        self.episodic_memory = {}  # Recent sessions
        self.semantic_memory = {}  # Learned patterns
        self.procedural_memory = {}  # How to do things

        # Initialize database
        self._init_database()

        # Load previous memories
        self._load_memories()

        # Start auto-save daemon
        self.auto_save_task = None

    def _init_database(self):
        """Initialize the persistent memory database"""
        conn = sqlite3.connect(str(self.memory_db))

        # Create tables for different memory types
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS synapsis_nodes (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                timestamp TIMESTAMP,
                context_type TEXT,
                data BLOB,
                repo_context TEXT,
                importance REAL,
                access_count INTEGER,
                last_accessed TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS session_contexts (
                session_id TEXT PRIMARY KEY,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                repo_path TEXT,
                total_commands INTEGER,
                patterns_learned INTEGER,
                success_rate REAL
            );

            CREATE TABLE IF NOT EXISTS cross_repo_links (
                source_repo TEXT,
                target_repo TEXT,
                link_type TEXT,
                strength REAL,
                last_used TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reality_anchors (
                file_path TEXT PRIMARY KEY,
                content_hash TEXT,
                regeneration_count INTEGER,
                last_regenerated TIMESTAMP,
                regeneration_source TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_session ON synapsis_nodes(session_id);
            CREATE INDEX IF NOT EXISTS idx_context ON synapsis_nodes(context_type);
            CREATE INDEX IF NOT EXISTS idx_importance ON synapsis_nodes(importance DESC);
        """)

        conn.commit()
        conn.close()

    def _load_memories(self):
        """Load relevant memories from previous sessions"""
        conn = sqlite3.connect(str(self.memory_db))
        cursor = conn.cursor()

        # Load semantic memories (patterns that always apply)
        cursor.execute("""
            SELECT * FROM synapsis_nodes
            WHERE context_type = 'pattern'
            ORDER BY importance DESC, access_count DESC
            LIMIT 100
        """)

        for row in cursor.fetchall():
            node_id, _, _, _, data_blob, _, importance, access_count, _ = row
            data = pickle.loads(data_blob)
            self.semantic_memory[node_id] = data

        # Load recent episodic memories
        cursor.execute("""
            SELECT * FROM synapsis_nodes
            WHERE context_type IN ('command', 'learning')
            ORDER BY timestamp DESC
            LIMIT 50
        """)

        for row in cursor.fetchall():
            node_id, _, _, _, data_blob, _, _, _, _ = row
            data = pickle.loads(data_blob)
            self.episodic_memory[node_id] = data

        conn.close()

        if self.semantic_memory:
            print(f"📚 Loaded {len(self.semantic_memory)} semantic memories")
        if self.episodic_memory:
            print(f"🕒 Loaded {len(self.episodic_memory)} recent memories")

    async def remember_command(self, command: str, result: str, success: bool):
        """Remember a CLI command and its outcome"""
        node = SynapsisNode(
            id=hashlib.sha256(f"{command}_{datetime.now()}".encode()).hexdigest()[:16],
            session_id=self.current_session_id,
            timestamp=datetime.now(),
            context_type="command",
            data={
                "command": command,
                "result": result[:1000],  # Truncate long results
                "success": success,
                "cwd": os.getcwd()
            },
            repo_context=self.active_repo
        )

        self.working_memory[node.id] = node

        # Learn pattern if command was successful
        if success:
            await self._extract_pattern(command, result)

    async def _extract_pattern(self, command: str, result: str):
        """Extract reusable patterns from successful commands"""
        # Simple pattern extraction - would be more sophisticated
        if "git" in command and "Successfully" in result:
            pattern = {
                "type": "git_workflow",
                "command_template": command.split()[0:2],
                "success_indicator": "Successfully"
            }
            self.semantic_memory[f"pattern_{len(self.semantic_memory)}"] = pattern

    def get_context_for_prompt(self) -> str:
        """Generate context to inject into Claude's prompt"""
        context = []

        # Add semantic memories (learned patterns)
        if self.semantic_memory:
            context.append("## Learned Patterns from Previous Sessions:")
            for pattern_id, pattern in list(self.semantic_memory.items())[:5]:
                context.append(f"- {pattern}")

        # Add recent commands from this repo
        relevant_episodic = [
            mem for mem in self.episodic_memory.values()
            if isinstance(mem, dict) and mem.get('cwd', '').startswith(self.active_repo)
        ]

        if relevant_episodic:
            context.append("\n## Recent Actions in This Repo:")
            for mem in relevant_episodic[:5]:
                context.append(f"- {mem.get('command', 'Unknown')}: {mem.get('success', 'Unknown')}")

        # Add cross-repo insights
        cross_repo = self._get_cross_repo_insights()
        if cross_repo:
            context.append("\n## Insights from Other Repos:")
            context.append(cross_repo)

        return "\n".join(context) if context else "No relevant memories found."

    def _get_cross_repo_insights(self) -> str:
        """Get relevant insights from other repos in the ecosystem"""
        conn = sqlite3.connect(str(self.memory_db))
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT data FROM synapsis_nodes
            WHERE repo_context != ? AND importance > 0.8
            LIMIT 3
        """, (self.active_repo,))

        insights = []
        for (data_blob,) in cursor.fetchall():
            try:
                data = pickle.loads(data_blob)
                if isinstance(data, dict) and 'learning' in data:
                    insights.append(f"- {data['learning']}")
            except:
                pass

        conn.close()
        return "\n".join(insights)

    async def checkpoint(self, checkpoint_name: str = None):
        """Create a checkpoint of current memory state"""
        checkpoint_name = checkpoint_name or f"checkpoint_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        checkpoint_data = {
            "working": self.working_memory,
            "episodic": self.episodic_memory,
            "semantic": self.semantic_memory,
            "session_id": self.current_session_id,
            "timestamp": datetime.now().isoformat()
        }

        checkpoint_file = self.studio_root / "PERSISTENT_MEMORY" / "checkpoints" / f"{checkpoint_name}.pkl"
        checkpoint_file.parent.mkdir(parents=True, exist_ok=True)

        with open(checkpoint_file, 'wb') as f:
            pickle.dump(checkpoint_data, f)

        print(f"💾 Checkpoint saved: {checkpoint_name}")

    async def restore_checkpoint(self, checkpoint_name: str):
        """Restore memory from a checkpoint"""
        checkpoint_file = self.studio_root / "PERSISTENT_MEMORY" / "checkpoints" / f"{checkpoint_name}.pkl"

        if checkpoint_file.exists():
            with open(checkpoint_file, 'rb') as f:
                checkpoint_data = pickle.load(f)

            self.working_memory = checkpoint_data.get("working", {})
            self.episodic_memory = checkpoint_data.get("episodic", {})
            self.semantic_memory = checkpoint_data.get("semantic", {})

            print(f"✅ Checkpoint restored: {checkpoint_name}")
        else:
            print(f"❌ Checkpoint not found: {checkpoint_name}")

    def save_session(self):
        """Save current session to persistent storage"""
        conn = sqlite3.connect(str(self.memory_db))

        # Save all working memory nodes
        for node_id, node in self.working_memory.items():
            conn.execute("""
                INSERT OR REPLACE INTO synapsis_nodes
                (id, session_id, timestamp, context_type, data, repo_context, importance, access_count, last_accessed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                node.id, node.session_id, node.timestamp, node.context_type,
                pickle.dumps(node.data), node.repo_context, node.importance,
                node.access_count, node.last_accessed
            ))

        # Save session summary
        conn.execute("""
            INSERT OR REPLACE INTO session_contexts
            (session_id, start_time, end_time, repo_path, total_commands, patterns_learned, success_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            self.current_session_id,
            datetime.now(),  # Would track actual start
            datetime.now(),
            self.active_repo,
            len([n for n in self.working_memory.values() if n.context_type == "command"]),
            len([n for n in self.working_memory.values() if n.context_type == "pattern"]),
            0.9  # Would calculate actual success rate
        ))

        conn.commit()
        conn.close()

        print(f"💾 Session {self.current_session_id} saved to persistent memory")

# ================== CLI INTEGRATION ====================

class CLISynapsis:
    """Integration layer for CLI tools"""

    def __init__(self):
        self.synapsis = ClaudeSynapsis()
        self.context_buffer = []

    def inject_context(self, prompt: str) -> str:
        """Inject memory context into a prompt for Claude"""
        memory_context = self.synapsis.get_context_for_prompt()

        enhanced_prompt = f"""
{memory_context}

## Current Task:
{prompt}

## Available Memory Operations:
- Use `remember_pattern('name', data)` to save important patterns
- Use `recall_pattern('name')` to retrieve saved patterns
- Use `checkpoint('name')` to save current state
- Use `restore_checkpoint('name')` to restore previous state
        """

        return enhanced_prompt

    async def process_claude_response(self, response: str):
        """Process Claude's response to extract memories"""
        # Look for memory operations in response
        if "remember_pattern" in response:
            # Extract and execute memory operations
            pass

        if "Successfully" in response or "Completed" in response:
            await self.synapsis.remember_command(
                "claude_task",
                response[:500],
                success=True
            )

    def get_startup_script(self) -> str:
        """Generate a startup script for CLI session"""
        return f"""
#!/usr/bin/env python3
# AUTO-GENERATED SYNAPSIS STARTUP

import sys
from pathlib import Path
sys.path.append('{self.synapsis.studio_root}')

from claude_synapsis import CLISynapsis

# Initialize synapsis
synapsis = CLISynapsis()

# Load memories
print("🧠 SYNAPSIS ACTIVE")
print(f"📚 {len(synapsis.synapsis.semantic_memory)} patterns loaded")
print(f"🕒 {len(synapsis.synapsis.episodic_memory)} recent memories")

# Inject into prompt
def enhance_prompt(prompt):
    return synapsis.inject_context(prompt)

# Auto-save on exit
import atexit
atexit.register(synapsis.synapsis.save_session)
        """

# ================== REALITY ANCHORS ====================

class RealityAnchor:
    """Files that must always exist - self-healing mechanism"""

    def __init__(self, studio_root: Path):
        self.studio_root = studio_root
        self.anchors = {}
        self.regeneration_sources = {}

        # Define critical files that must always exist
        self.critical_files = {
            "CLAUDE.md": self._regenerate_claude_md,
            "neural_memory.db": self._regenerate_neural_db,
            "studio_manifest.yaml": self._regenerate_manifest,
            ".claude/settings.json": self._regenerate_settings
        }

    async def verify_reality(self):
        """Check all reality anchors and regenerate missing files"""
        for file_path, regenerator in self.critical_files.items():
            full_path = self.studio_root.parent / file_path

            if not full_path.exists():
                print(f"🔧 Reality anchor missing: {file_path}")
                print(f"🔄 Regenerating from source...")

                await regenerator(full_path)

                # Log regeneration
                self._log_regeneration(file_path)

    async def _regenerate_claude_md(self, path: Path):
        """Regenerate CLAUDE.md from all system knowledge"""
        content = ["# CLAUDE.md", "", "AUTO-REGENERATED from system knowledge", ""]

        # Gather from all systems
        for system_dir in self.studio_root.parent.iterdir():
            if system_dir.is_dir() and (system_dir / "README.md").exists():
                readme = (system_dir / "README.md").read_text()[:500]
                content.append(f"## {system_dir.name}")
                content.append(readme)
                content.append("")

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("\n".join(content))
        print(f"✅ Regenerated {path.name}")

    async def _regenerate_neural_db(self, path: Path):
        """Regenerate neural database from backups"""
        backup_dir = self.studio_root / "PERSISTENT_MEMORY" / "backups"

        if backup_dir.exists():
            latest_backup = sorted(backup_dir.glob("*.db"))[-1] if list(backup_dir.glob("*.db")) else None

            if latest_backup:
                shutil.copy2(latest_backup, path)
                print(f"✅ Restored {path.name} from backup")
            else:
                # Create fresh database
                path.parent.mkdir(parents=True, exist_ok=True)
                path.touch()
                print(f"✅ Created fresh {path.name}")

    async def _regenerate_manifest(self, path: Path):
        """Regenerate studio manifest"""
        manifest = {
            "studio_version": "1.0.0",
            "systems": list(self.studio_root.parent.iterdir()),
            "regenerated_at": datetime.now().isoformat()
        }

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(manifest, indent=2))
        print(f"✅ Regenerated {path.name}")

    async def _regenerate_settings(self, path: Path):
        """Regenerate Claude settings"""
        settings = {
            "allow_bash": True,
            "neural_overlay": True,
            "synapsis_enabled": True
        }

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(settings, indent=2))
        print(f"✅ Regenerated {path.name}")

    def _log_regeneration(self, file_path: str):
        """Log file regeneration for learning"""
        conn = sqlite3.connect(str(self.studio_root / "PERSISTENT_MEMORY" / "synapsis.db"))

        conn.execute("""
            INSERT OR REPLACE INTO reality_anchors
            (file_path, content_hash, regeneration_count, last_regenerated, regeneration_source)
            VALUES (?, ?,
                COALESCE((SELECT regeneration_count FROM reality_anchors WHERE file_path = ?), 0) + 1,
                ?, ?)
        """, (
            file_path,
            hashlib.sha256(file_path.encode()).hexdigest(),
            file_path,
            datetime.now(),
            "auto_recovery"
        ))

        conn.commit()
        conn.close()

# ================== MAIN DAEMON ====================

async def run_synapsis_daemon():
    """Main daemon that maintains the synapsis system"""

    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║              🧠 CLAUDE SYNAPSIS SYSTEM 🧠                   ║
    ║                                                              ║
    ║      Persistent Memory for CLI LLM Sessions                 ║
    ║      Self-Healing Reality Anchors                           ║
    ║      Cross-Session Knowledge Transfer                       ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

    studio_root = Path(__file__).parent

    # Initialize components
    synapsis = ClaudeSynapsis(studio_root)
    reality = RealityAnchor(studio_root)

    # Verify reality anchors
    await reality.verify_reality()

    # Main loop
    while True:
        # Auto-save every 5 minutes
        await asyncio.sleep(300)

        # Save current session
        synapsis.save_session()

        # Verify reality anchors
        await reality.verify_reality()

        # Backup database
        backup_path = studio_root / "PERSISTENT_MEMORY" / "backups" / f"synapsis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(synapsis.memory_db, backup_path)

        print(f"💾 Auto-save complete at {datetime.now().strftime('%H:%M:%S')}")

# ================== CLI ENTRY POINT ====================

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "daemon":
            # Run the daemon
            asyncio.run(run_synapsis_daemon())

        elif command == "inject":
            # Inject context into prompt
            cli = CLISynapsis()
            prompt = " ".join(sys.argv[2:])
            enhanced = cli.inject_context(prompt)
            print(enhanced)

        elif command == "checkpoint":
            # Create checkpoint
            synapsis = ClaudeSynapsis()
            name = sys.argv[2] if len(sys.argv) > 2 else None
            asyncio.run(synapsis.checkpoint(name))

        elif command == "restore":
            # Restore checkpoint
            synapsis = ClaudeSynapsis()
            name = sys.argv[2]
            asyncio.run(synapsis.restore_checkpoint(name))

        else:
            print(f"Unknown command: {command}")

    else:
        print("""
Usage:
  python claude_synapsis.py daemon     # Run the persistent daemon
  python claude_synapsis.py inject "prompt"  # Enhance prompt with memory
  python claude_synapsis.py checkpoint [name]  # Save checkpoint
  python claude_synapsis.py restore name  # Restore checkpoint
        """)
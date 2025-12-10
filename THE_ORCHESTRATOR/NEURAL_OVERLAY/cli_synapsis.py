#!/usr/bin/env python3
"""
CLI Synapsis - Autopilot Neural Overlay for CLI LLM Sessions
"""

import os
import sys
import uuid
import json
import atexit
import hashlib
import readline  # For command history
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

class CLISynapsis:
    """
    Neural autopilot for CLI LLM sessions.
    Automatically tracks, learns, and improves.
    """

    _instance = None  # Singleton per process

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, 'initialized'):
            return
        self.initialized = True

        # Session identification
        self.session_id = self._generate_session_id()
        self.context = self._determine_context()
        self.mode = os.getenv('NEURAL_MODE', 'context')  # isolated, context, global

        # Memory paths based on mode
        self._setup_memory_paths()

        # Load memories
        self.memories = self._load_relevant_memories()

        # Track session start
        self.session_start = datetime.now()
        self.interaction_count = 0

        # Register cleanup
        atexit.register(self.cleanup)

        # Print activation message
        if os.getenv('NEURAL_SYNAPSIS') == 'true':
            self._print_activation_message()

    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        # Combine PID, timestamp, and terminal ID
        terminal_id = os.getenv('TERM_SESSION_ID', os.getenv('WINDOWID', 'unknown'))
        return f"{os.getpid()}_{terminal_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def _determine_context(self) -> str:
        """Determine project context from current directory"""
        cwd = Path.cwd()

        # Check for git repo
        current = cwd
        while current != current.parent:
            if (current / '.git').exists():
                return f"git_{current.name}"
            current = current.parent

        # Check for project files
        project_markers = {
            'package.json': 'node',
            'requirements.txt': 'python',
            'Cargo.toml': 'rust',
            'go.mod': 'go',
            'pom.xml': 'java',
            'build.gradle': 'gradle'
        }

        for marker, prefix in project_markers.items():
            if (cwd / marker).exists():
                return f"{prefix}_{cwd.name}"

        # Default to directory name
        return cwd.name

    def _setup_memory_paths(self):
        """Setup memory paths based on mode"""
        base_dir = Path.home() / '.neural'

        if self.mode == 'isolated':
            # Each session gets its own memory
            self.memory_dir = base_dir / 'isolated' / self.session_id
        elif self.mode == 'context':
            # Share within same context/project
            self.memory_dir = base_dir / 'contexts' / self.context
        else:  # global
            # Share everything
            self.memory_dir = base_dir / 'global'

        # Create directories
        self.memory_dir.mkdir(parents=True, exist_ok=True)

        # Define memory files
        self.patterns_file = self.memory_dir / 'patterns.jsonl'
        self.interactions_file = self.memory_dir / 'interactions.jsonl'
        self.failures_file = self.memory_dir / 'failures.jsonl'
        self.session_file = base_dir / 'sessions' / f"{self.session_id}.jsonl"

        # Ensure session directory exists
        self.session_file.parent.mkdir(parents=True, exist_ok=True)

    def _load_relevant_memories(self) -> Dict:
        """Load memories relevant to current context"""
        memories = {
            'patterns': {},
            'failures': [],
            'successes': []
        }

        # Load patterns
        if self.patterns_file.exists():
            with open(self.patterns_file, 'r') as f:
                for line in f:
                    try:
                        pattern = json.loads(line)
                        key = pattern.get('key', 'unknown')
                        memories['patterns'][key] = pattern
                    except:
                        pass

        # Load recent failures to avoid
        if self.failures_file.exists():
            with open(self.failures_file, 'r') as f:
                lines = f.readlines()[-20:]  # Last 20 failures
                for line in lines:
                    try:
                        memories['failures'].append(json.loads(line))
                    except:
                        pass

        return memories

    def _print_activation_message(self):
        """Print activation message"""
        pattern_count = len(self.memories.get('patterns', {}))
        failure_count = len(self.memories.get('failures', []))

        print(f"""
╔═══════════════════════════════════════════════════╗
║           🧠 CLI SYNAPSIS ACTIVE                  ║
╠═══════════════════════════════════════════════════╣
║ Session:  {self.session_id[:20]:<40} ║
║ Context:  {self.context:<40} ║
║ Mode:     {self.mode:<40} ║
║ Memories: {pattern_count} patterns, {failure_count} failures known{"":>20} ║
╚═══════════════════════════════════════════════════╝
""")

    def track(self, prompt: str, response: str = None, success: bool = True):
        """Track an interaction"""
        self.interaction_count += 1

        interaction = {
            'timestamp': datetime.now().isoformat(),
            'session_id': self.session_id,
            'interaction_num': self.interaction_count,
            'prompt_preview': prompt[:100],
            'success': success,
            'context': self.context
        }

        # Extract patterns from prompt
        patterns = self._extract_patterns_from_prompt(prompt)
        if patterns:
            interaction['patterns'] = patterns

        # If response provided, analyze it
        if response:
            interaction['response_preview'] = response[:100]
            interaction['response_length'] = len(response)

            # Learn from response
            if success:
                self._learn_from_success(prompt, response, patterns)
            else:
                self._learn_from_failure(prompt, response, patterns)

        # Save to session file
        with open(self.session_file, 'a') as f:
            f.write(json.dumps(interaction) + '\n')

    def _extract_patterns_from_prompt(self, prompt: str) -> List[str]:
        """Extract patterns from prompt"""
        patterns = []
        prompt_lower = prompt.lower()

        # Task patterns
        task_patterns = {
            'create': ['create', 'make', 'build', 'generate'],
            'fix': ['fix', 'solve', 'debug', 'repair'],
            'explain': ['explain', 'what', 'how', 'why'],
            'refactor': ['refactor', 'improve', 'optimize', 'clean'],
            'test': ['test', 'verify', 'check', 'validate'],
            'document': ['document', 'readme', 'docs', 'comment']
        }

        for pattern, keywords in task_patterns.items():
            if any(kw in prompt_lower for kw in keywords):
                patterns.append(pattern)

        return patterns

    def _learn_from_success(self, prompt: str, response: str, patterns: List[str]):
        """Learn from successful interaction"""
        for pattern in patterns:
            key = f"{pattern}_{self.context}"

            # Load or create pattern record
            if key in self.memories['patterns']:
                record = self.memories['patterns'][key]
                record['success_count'] = record.get('success_count', 0) + 1
                record['last_success'] = datetime.now().isoformat()
            else:
                record = {
                    'key': key,
                    'pattern': pattern,
                    'context': self.context,
                    'success_count': 1,
                    'failure_count': 0,
                    'created': datetime.now().isoformat(),
                    'last_success': datetime.now().isoformat()
                }

            # Update in memory
            self.memories['patterns'][key] = record

            # Persist to file
            with open(self.patterns_file, 'a') as f:
                f.write(json.dumps(record) + '\n')

    def _learn_from_failure(self, prompt: str, response: str, patterns: List[str]):
        """Learn from failed interaction"""
        failure = {
            'timestamp': datetime.now().isoformat(),
            'patterns': patterns,
            'prompt_preview': prompt[:100],
            'context': self.context
        }

        # Add to memory
        self.memories['failures'].append(failure)

        # Persist
        with open(self.failures_file, 'a') as f:
            f.write(json.dumps(failure) + '\n')

        # Update pattern records
        for pattern in patterns:
            key = f"{pattern}_{self.context}"
            if key in self.memories['patterns']:
                record = self.memories['patterns'][key]
                record['failure_count'] = record.get('failure_count', 0) + 1

    def suggest(self, prompt: str) -> List[Dict]:
        """Get suggestions based on prompt and memories"""
        suggestions = []

        # Extract patterns from new prompt
        patterns = self._extract_patterns_from_prompt(prompt)

        for pattern in patterns:
            key = f"{pattern}_{self.context}"

            if key in self.memories['patterns']:
                record = self.memories['patterns'][key]
                success_rate = record['success_count'] / (
                    record['success_count'] + record.get('failure_count', 0) + 1
                )

                suggestions.append({
                    'pattern': pattern,
                    'confidence': success_rate,
                    'successes': record['success_count'],
                    'failures': record.get('failure_count', 0),
                    'last_success': record.get('last_success', 'never')
                })

        # Check for similar failures
        for failure in self.memories['failures'][-5:]:  # Last 5 failures
            if any(p in patterns for p in failure.get('patterns', [])):
                suggestions.append({
                    'type': 'warning',
                    'message': f"Similar approach failed at {failure['timestamp']}"
                })

        return suggestions

    def cleanup(self):
        """Cleanup on session end"""
        if self.interaction_count == 0:
            return  # Nothing to summarize

        # Create session summary
        summary = {
            'session_id': self.session_id,
            'context': self.context,
            'mode': self.mode,
            'start': self.session_start.isoformat(),
            'end': datetime.now().isoformat(),
            'duration_seconds': (datetime.now() - self.session_start).total_seconds(),
            'interactions': self.interaction_count,
            'patterns_learned': len([p for p in self.memories['patterns'].values()
                                    if p.get('created', '') > self.session_start.isoformat()])
        }

        # Save summary
        summary_file = self.session_file.with_suffix('.summary.json')
        summary_file.write_text(json.dumps(summary, indent=2))

        # Print summary if in interactive mode
        if os.getenv('NEURAL_SYNAPSIS') == 'true' and sys.stdout.isatty():
            print(f"\n📊 Synapsis Session Complete:")
            print(f"   Duration: {summary['duration_seconds']:.1f}s")
            print(f"   Interactions: {summary['interactions']}")
            print(f"   Patterns learned: {summary['patterns_learned']}")


# ============== CLI INTERFACE ==============

def main():
    """Main CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(description='CLI Synapsis - Neural Memory for LLM Sessions')
    parser.add_argument('command', choices=['track', 'suggest', 'status', 'clean'],
                      help='Command to execute')
    parser.add_argument('args', nargs='*', help='Additional arguments')

    args = parser.parse_args()

    synapsis = CLISynapsis()

    if args.command == 'track':
        # Track a command execution
        if len(args.args) > 0:
            prompt = ' '.join(args.args)
            synapsis.track(prompt)
            print(f"✓ Tracked: {prompt[:50]}...")

    elif args.command == 'suggest':
        # Get suggestions for a prompt
        if len(args.args) > 0:
            prompt = ' '.join(args.args)
            suggestions = synapsis.suggest(prompt)

            if suggestions:
                print("\n🧠 Neural Suggestions:")
                for s in suggestions:
                    if s.get('type') == 'warning':
                        print(f"   ⚠️ {s['message']}")
                    else:
                        print(f"   • {s['pattern']}: {s['confidence']:.0%} confidence "
                              f"({s['successes']} successes, {s['failures']} failures)")
            else:
                print("No suggestions available")

    elif args.command == 'status':
        # Show current status
        print(f"Session ID: {synapsis.session_id}")
        print(f"Context: {synapsis.context}")
        print(f"Mode: {synapsis.mode}")
        print(f"Interactions: {synapsis.interaction_count}")
        print(f"Patterns known: {len(synapsis.memories['patterns'])}")

    elif args.command == 'clean':
        # Clean old sessions
        sessions_dir = Path.home() / '.neural' / 'sessions'
        if sessions_dir.exists():
            old_files = [f for f in sessions_dir.glob('*.jsonl')
                        if (datetime.now() - datetime.fromtimestamp(f.stat().st_mtime)).days > 7]
            for f in old_files:
                f.unlink()
            print(f"Cleaned {len(old_files)} old session files")


if __name__ == '__main__':
    main()
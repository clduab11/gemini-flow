# 🧠 THE CLI SYNAPSIS - Neural Autopilot for LLM Sessions

## Core Concept

**CLI Synapsis** är en autopilot som automatiskt aktiverar och hanterar Neural Overlay för VARJE CLI-session med en LLM. Den förstår att:

1. **CLI = En kontinuerlig konversation** (till skillnad från browser där du kan ha flera flikar)
2. **Varje terminal-session = En unik "synaptic connection"**
3. **Memories kan vara SHARED eller ISOLATED beroende på behov**

## Session Architecture

```
┌─────────────────────────────────────────────────┐
│            GLOBAL NEURAL MEMORY                 │
│         (Shared across all sessions)            │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┬───────────┐
    │            │            │           │
┌───▼───┐  ┌────▼────┐  ┌────▼───┐  ┌───▼───┐
│ CLI    │  │ CLI     │  │ Browser│  │ Script│
│ Sess 1 │  │ Sess 2  │  │ Claude │  │ Auto  │
├────────┤  ├─────────┤  ├────────┤  ├───────┤
│ Local  │  │ Local   │  │ Local  │  │ Local │
│ Memory │  │ Memory  │  │ Memory │  │ Memory│
└────────┘  └─────────┘  └────────┘  └───────┘
```

## The CLI Synapsis Protocol

### Auto-Activation in CLI

When you start a CLI session with an LLM, Synapsis automatically:

```python
# .bashrc / .zshrc addition
export NEURAL_SYNAPSIS=true

# Or in your CLI wrapper
alias claude="python -m cli_synapsis claude"
alias gpt="python -m cli_synapsis gpt"
```

### What Happens Automatically

1. **Session Start** - Creates unique session ID
2. **Context Loading** - Loads relevant memories for your current directory/project
3. **Continuous Tracking** - Every command and response is analyzed
4. **Smart Persistence** - Important patterns saved globally, session details kept local
5. **Session End** - Consolidates learnings to global memory

## Implementation

```python
# cli_synapsis.py

import os
import sys
import uuid
import json
from datetime import datetime
from pathlib import Path
import hashlib

class CLISynapsis:
    """
    Neural autopilot for CLI LLM sessions.
    One synapsis per terminal session.
    """

    def __init__(self):
        # Unique session ID based on terminal PID + timestamp
        self.session_id = f"{os.getpid()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Determine context (which project/directory)
        self.context = self._determine_context()

        # Memory paths
        self.global_memory = Path.home() / ".neural" / "global_memory.jsonl"
        self.session_memory = Path.home() / ".neural" / "sessions" / f"{self.session_id}.jsonl"
        self.context_memory = Path.home() / ".neural" / "contexts" / f"{self.context}.jsonl"

        # Ensure directories exist
        self.global_memory.parent.mkdir(parents=True, exist_ok=True)
        self.session_memory.parent.mkdir(parents=True, exist_ok=True)
        self.context_memory.parent.mkdir(parents=True, exist_ok=True)

        # Load relevant memories
        self.memories = self._load_memories()

        print(f"🧠 CLI Synapsis Active")
        print(f"   Session: {self.session_id[:8]}...")
        print(f"   Context: {self.context}")
        print(f"   Memories: {len(self.memories)} patterns loaded")

    def _determine_context(self) -> str:
        """Determine the context (project) for this session"""
        cwd = Path.cwd()

        # Check for git repo
        git_dir = cwd / ".git"
        if git_dir.exists():
            # Use repo name as context
            return cwd.name

        # Check for project markers
        if (cwd / "package.json").exists():
            return f"node_{cwd.name}"
        if (cwd / "requirements.txt").exists():
            return f"python_{cwd.name}"
        if (cwd / "Cargo.toml").exists():
            return f"rust_{cwd.name}"

        # Default to directory hash
        return hashlib.md5(str(cwd).encode()).hexdigest()[:8]

    def _load_memories(self) -> dict:
        """Load relevant memories for this context"""
        memories = {}

        # Load global memories (high-value patterns)
        if self.global_memory.exists():
            with open(self.global_memory, 'r') as f:
                for line in f:
                    try:
                        memory = json.loads(line)
                        if memory.get('value_score', 0) > 0.8:  # Only high-value
                            memories[memory['pattern_key']] = memory
                    except:
                        pass

        # Load context-specific memories (all)
        if self.context_memory.exists():
            with open(self.context_memory, 'r') as f:
                for line in f:
                    try:
                        memory = json.loads(line)
                        memories[memory['pattern_key']] = memory
                    except:
                        pass

        return memories

    def track_interaction(self, prompt: str, response: str, metadata: dict = None):
        """Track an LLM interaction"""

        interaction = {
            'timestamp': datetime.now().isoformat(),
            'session_id': self.session_id,
            'context': self.context,
            'prompt_hash': hashlib.md5(prompt.encode()).hexdigest()[:16],
            'response_hash': hashlib.md5(response.encode()).hexdigest()[:16],
            'prompt_length': len(prompt),
            'response_length': len(response),
            'metadata': metadata or {}
        }

        # Analyze for patterns
        patterns = self._extract_patterns(prompt, response)
        if patterns:
            interaction['patterns'] = patterns

        # Save to session memory
        with open(self.session_memory, 'a') as f:
            f.write(json.dumps(interaction) + '\n')

        # If valuable, save to context memory
        if self._is_valuable(interaction):
            with open(self.context_memory, 'a') as f:
                f.write(json.dumps(interaction) + '\n')

        # If VERY valuable, save to global
        if self._is_very_valuable(interaction):
            with open(self.global_memory, 'a') as f:
                f.write(json.dumps(interaction) + '\n')

    def _extract_patterns(self, prompt: str, response: str) -> list:
        """Extract learnable patterns from interaction"""
        patterns = []

        # Code generation pattern
        if "```" in response:
            patterns.append("code_generation")

        # Error fixing pattern
        if "error" in prompt.lower() and "fix" in response.lower():
            patterns.append("error_resolution")

        # Architecture pattern
        if any(word in prompt.lower() for word in ["design", "architecture", "structure"]):
            patterns.append("architecture_design")

        # Testing pattern
        if "test" in prompt.lower() or "test" in response.lower():
            patterns.append("testing")

        return patterns

    def _is_valuable(self, interaction: dict) -> bool:
        """Determine if interaction is valuable enough for context memory"""
        # Long responses are often valuable
        if interaction['response_length'] > 500:
            return True

        # Interactions with patterns are valuable
        if interaction.get('patterns'):
            return True

        # Error resolutions are valuable
        if 'error_resolution' in interaction.get('patterns', []):
            return True

        return False

    def _is_very_valuable(self, interaction: dict) -> bool:
        """Determine if interaction is valuable enough for global memory"""
        # Architecture decisions are globally valuable
        if 'architecture_design' in interaction.get('patterns', []):
            return True

        # Very long, detailed responses
        if interaction['response_length'] > 2000:
            return True

        return False

    def get_recommendations(self, prompt: str) -> list:
        """Get recommendations based on memories"""
        recommendations = []

        # Simple keyword matching (would be embedding-based in production)
        prompt_lower = prompt.lower()

        for pattern_key, memory in self.memories.items():
            if any(word in pattern_key.lower() for word in prompt_lower.split()):
                recommendations.append({
                    'pattern': pattern_key,
                    'confidence': memory.get('success_rate', 0.5),
                    'usage_count': memory.get('usage_count', 0),
                    'last_used': memory.get('last_used', 'unknown')
                })

        # Sort by confidence
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)

        return recommendations[:5]  # Top 5

    def consolidate_session(self):
        """Consolidate session learnings when ending"""
        print(f"\n📊 Session Summary for {self.session_id[:8]}...")

        # Count interactions
        interaction_count = 0
        pattern_counts = {}

        if self.session_memory.exists():
            with open(self.session_memory, 'r') as f:
                for line in f:
                    interaction_count += 1
                    try:
                        data = json.loads(line)
                        for pattern in data.get('patterns', []):
                            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
                    except:
                        pass

        print(f"   Interactions: {interaction_count}")
        print(f"   Patterns detected: {pattern_counts}")

        # Save session summary
        summary = {
            'session_id': self.session_id,
            'context': self.context,
            'timestamp': datetime.now().isoformat(),
            'interaction_count': interaction_count,
            'pattern_counts': pattern_counts
        }

        summary_file = self.session_memory.with_suffix('.summary.json')
        summary_file.write_text(json.dumps(summary, indent=2))

        print(f"   Summary saved: {summary_file.name}")
```

## CLI Integration Instructions

### For Your Shell (bash/zsh)

```bash
# Add to ~/.bashrc or ~/.zshrc

# Auto-activate Synapsis for interactive CLI sessions
if [[ $- == *i* ]]; then
    export NEURAL_SYNAPSIS=true

    # Wrap common LLM commands
    function claude() {
        python -m cli_synapsis track "claude" "$@"
    }

    function gpt() {
        python -m cli_synapsis track "gpt" "$@"
    }
fi

# Show recommendations before commands
function neural_suggest() {
    python -m cli_synapsis suggest "$*"
}

# Alias for quick access
alias ns="neural_suggest"
```

### For LLM CLI Tools

```python
# wrapper.py - Wrap any LLM CLI tool

import subprocess
import sys
from cli_synapsis import CLISynapsis

def main():
    # Initialize synapsis
    synapsis = CLISynapsis()

    # Get the actual command
    cmd = sys.argv[1]
    args = sys.argv[2:]

    # Get recommendations
    if args:
        prompt = ' '.join(args)
        recommendations = synapsis.get_recommendations(prompt)

        if recommendations:
            print("🧠 Neural Recommendations:")
            for rec in recommendations:
                print(f"   • {rec['pattern']} (confidence: {rec['confidence']:.0%})")
            print()

    # Run actual command
    result = subprocess.run([cmd] + args, capture_output=True, text=True)

    # Track interaction
    if result.stdout:
        synapsis.track_interaction(
            prompt=' '.join(args),
            response=result.stdout,
            metadata={'command': cmd, 'return_code': result.returncode}
        )

    # Print output
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    return result.returncode

if __name__ == "__main__":
    sys.exit(main())
```

## Session Isolation vs Sharing

### Three Modes:

#### 1. **ISOLATED** (Default for experiments)
```bash
export NEURAL_MODE=isolated
# Each session has completely separate memory
```

#### 2. **CONTEXT_SHARED** (Default for projects)
```bash
export NEURAL_MODE=context
# Sessions in same project share memories
```

#### 3. **GLOBAL_SHARED** (For power users)
```bash
export NEURAL_MODE=global
# All sessions share everything
```

### Examples:

**Terminal 1 (Project A):**
```bash
cd ~/projects/projectA
claude "implement auth"  # Learns auth pattern
```

**Terminal 2 (Project A):**
```bash
cd ~/projects/projectA
claude "add another auth endpoint"  # SEES the auth pattern from Terminal 1
```

**Terminal 3 (Project B):**
```bash
cd ~/projects/projectB
claude "implement auth"  # Does NOT see Project A patterns (unless GLOBAL mode)
```

## The Magic: Auto-Learning Commands

### These happen automatically:

```bash
# Before running a command, Synapsis checks:
"Have I seen this type of request before in this context?"

# After successful execution:
"Save this pattern with success marker"

# After failure:
"Mark this approach as problematic"

# On similar future requests:
"Last time, approach X worked well, suggesting..."
```

### Manual Override:

```bash
# Force new approach (ignore memories)
NEURAL_BYPASS=true claude "your prompt"

# Save explicitly as valuable
NEURAL_SAVE=global claude "your prompt"

# Use different context
NEURAL_CONTEXT=other_project claude "your prompt"
```

## Quick Start

```bash
# 1. Install
pip install cli-synapsis  # (hypothetical package)

# 2. Add to shell
echo 'export NEURAL_SYNAPSIS=true' >> ~/.bashrc

# 3. First run
claude "help me understand this codebase"
# Synapsis: ✓ Active | Context: THE_ORCHESTRATOR | Memories: 0

# 4. Second run (same project)
claude "create another agent"
# Synapsis: ✓ Active | Context: THE_ORCHESTRATOR | Memories: 1
# 🧠 Found similar: "agent_creation" pattern (95% success)

# 5. Check learnings
cat ~/.neural/contexts/THE_ORCHESTRATOR.jsonl | jq .
```

## Key Difference from Browser

| Aspect | CLI (Synapsis) | Browser (Claude Code) |
|--------|----------------|----------------------|
| **Sessions** | One per terminal | Multiple tabs/contexts |
| **Memory** | Persistent across commands | Per-conversation |
| **Context** | Directory-based | URL/conversation-based |
| **Sharing** | Automatic within project | Manual copy/paste |
| **Learning** | Continuous in session | Per-request |

## The Bottom Line

**CLI Synapsis** = Your LLM gets a persistent memory that grows smarter with every terminal session, while keeping project contexts separate and sharing only the most valuable patterns globally.
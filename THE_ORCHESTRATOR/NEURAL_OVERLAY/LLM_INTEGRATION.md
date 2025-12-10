# 🤖 Neural Overlay + LLM Agents (Claude Code/CLI)

## Fundamental skillnad mot CLAUDE.md

### CLAUDE.md
- **Statisk** instruktion som läses EN gång vid session start
- **Read-only** - Uppdateras manuellt av människor
- **Generell** vägledning för ALLA sessions
- **Ingen learning** - Samma info varje gång

### Neural Overlay
- **Dynamisk** databas som VÄXER efter varje körning
- **Read-write** - Uppdateras automatiskt
- **Specifik** för varje task/pattern
- **Kontinuerlig learning** - Blir smartare över tid

## Hur det SKULLE fungera med Claude Code

### Option 1: LLM-Instruerad Learning
Lägg till i system prompt eller CLAUDE.md:

```markdown
## Neural Learning Protocol

When completing significant tasks (PRs, major features, bug fixes):

1. Check for previous patterns:
   ```bash
   python -c "from NEURAL_OVERLAY.minimal_hook import get_recommendation; print(get_recommendation('${TASK_TYPE}'))"
   ```

2. After successful completion, save the pattern:
   ```bash
   python -c "from NEURAL_OVERLAY.minimal_hook import remember_pattern; remember_pattern('${PATTERN_NAME}', {'approach': '${APPROACH}', 'success': True})"
   ```

3. On failures, track them:
   ```bash
   python -c "from NEURAL_OVERLAY.minimal_hook import track_execution; track_execution('${TASK}', False, ${TIME}, '${ERROR}')"
   ```
```

### Option 2: Checkpoint-Based Learning
Instruera LLM att använda Neural vid "milestones":

```markdown
## Checkpoint Learning

At these points, ALWAYS save learnings:

- After successful PR creation
- After passing all tests
- After major refactoring
- When fixing complex bugs
- Before switching context

Use this command:
```bash
python NEURAL_OVERLAY/checkpoint.py save --context "What we learned"
```

Before starting similar tasks:
```bash
python NEURAL_OVERLAY/checkpoint.py recall --task-type "similar_task"
```
```

### Option 3: Session Wrapper
Kör HELA Claude Code sessionen genom Neural:

```python
# neural_claude_wrapper.py
import subprocess
import json
from NEURAL_OVERLAY.minimal_hook import enable_neural, remember_pattern

def run_claude_with_learning(task_description):
    enable_neural("claude_sessions.jsonl")

    # Start Claude Code session
    # (Detta är pseudokod - faktisk implementation beror på hur du kör Claude)
    session = start_claude_session(task_description)

    # Monitor outputs
    for output in session.outputs:
        if "Successfully created PR" in output:
            remember_pattern("successful_pr", {
                "files_changed": session.files_changed,
                "approach": session.approach
            })

        if "Tests passed" in output:
            remember_pattern("passing_tests", {
                "test_count": session.test_count
            })

    return session.result
```

## Praktiska användningsfall

### 1. PR Creation Learning
```python
# LLM kan instrueras att köra detta EFTER varje PR:
python -c "
from NEURAL_OVERLAY.pr_tracker import track_pr
track_pr({
    'files_changed': 15,
    'tests_added': 8,
    'review_iterations': 2,
    'approach': 'bottom-up refactoring',
    'success': True
})
"
```

### 2. Bug Fix Patterns
```python
# Efter att ha fixat en bug:
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('auth_bug_fix', {
    'root_cause': 'token expiration not handled',
    'solution': 'add refresh token logic',
    'files': ['auth.py', 'middleware.py']
})
"
```

### 3. Architecture Decisions
```python
# När LLM gör arkitekturbeslut:
python -c "
from NEURAL_OVERLAY.architecture_log import log_decision
log_decision({
    'choice': 'microservices',
    'alternatives': ['monolith', 'serverless'],
    'reasoning': 'scalability requirements',
    'outcome': 'pending'  # Uppdateras senare med faktisk outcome
})
"
```

## Integration med Claude Code

### Lägg till i CLAUDE.md:

```markdown
## Neural Memory System

This repository has a learning system. Use it to improve over time:

### Before starting any task:
1. Check if similar tasks have been done before:
   ```bash
   python -m NEURAL_OVERLAY.recall --task "your task description"
   ```

2. Review suggestions and adapt approach accordingly

### After completing significant work:
1. Save successful patterns:
   ```bash
   python -m NEURAL_OVERLAY.save --pattern "pattern_name" --data "what worked"
   ```

2. Document failures for future avoidance:
   ```bash
   python -m NEURAL_OVERLAY.learn_failure --reason "what went wrong"
   ```

### Continuous vs Checkpoint:
- Use CONTINUOUS for: Small iterations, exploration
- Use CHECKPOINT for: PRs, major features, context switches
```

## Den VERKLIGA styrkan: Persistent Context

### Scenario: Multi-Session Development

**Session 1 (Monday):**
```python
# Claude Code arbetar med auth system
# Discovers: "JWT refresh rotation works better than sliding window"
remember_pattern("auth_strategy", {"approach": "rotation", "why": "security"})
```

**Session 2 (Wednesday):**
```python
# Ny Claude session, men minnet finns kvar!
suggestion = get_recommendation("auth")
# Output: "Previous session found rotation strategy works best"
```

**Session 3 (Friday):**
```python
# Helt ny developer/AI, men learnings persisterar!
# Automatiskt föreslås rotation strategy
```

## Konkret implementation för Claude Code

### 1. Skapa en CLI hook:

```bash
#!/bin/bash
# claude-neural

# Wrapper script för Claude med learning
python -c "from NEURAL_OVERLAY.minimal_hook import enable_neural; enable_neural()"

# Kör vanliga claude kommandot
claude "$@"

# Spara session learnings
python -c "from NEURAL_OVERLAY.minimal_hook import _save_session; _save_session('claude_memory.jsonl')"
```

### 2. Eller instruera Claude direkt:

Lägg till i system prompt:
```
When you complete any significant task, run:
echo "PATTERN: task_name | SUCCESS | approach_used" >> .neural_log

Before starting tasks, check:
cat .neural_log | grep similar_task
```

## Skillnad mot vanlig CLAUDE.md

| Aspekt | CLAUDE.md | Neural Overlay |
|--------|-----------|----------------|
| **Uppdatering** | Manuell | Automatisk |
| **Innehåll** | Statiska regler | Levande patterns |
| **Scope** | Generella guidelines | Specifika learnings |
| **Evolution** | Ingen | Kontinuerlig |
| **Memory** | Per session | Cross-session |
| **Adaptation** | Ingen | Lär från failures |

## Bottom Line

**CLAUDE.md**: "Här är hur du ska arbeta i denna kodbas"

**Neural Overlay**: "Här är vad som FAKTISKT funkade förra gången"

De kompletterar varandra:
- CLAUDE.md ger **principer**
- Neural ger **praktiska erfarenheter**
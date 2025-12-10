# 🧠 THE CLI SYNAPSIS

## LLM Autopilot Memory System for CLI Sessions

Detta dokument instruerar LLM (dig som läser detta) hur du ska använda Synapsis-systemet för att ha persistent minne mellan sessioner.

## VIKTIGT: CLI vs Browser Context

### CLI Kontext
- **EN session åt gången** - linjär, sekventiell
- **Delat minne** - alla CLI-sessioner delar samma memory pool
- **Session-baserad isolation** - varje session får sitt ID men läser från gemensam pool

### Browser Kontext (Claude Code)
- **Multipla samtidiga kontexter** - parallella sessioner
- **Isolerat per projekt** - varje projekt har sin memory
- **Tab-baserad isolation** - varje tab är en separat kontext

## För dig som LLM - Automatisk Memory Management

### Vid Session Start

ALLTID kör detta först:

```bash
# Check for synapsis system
if [ -f "THE_STUDIO/claude_synapsis.py" ]; then
    # Load previous memories
    python THE_STUDIO/claude_synapsis.py inject "Starting new session in $(pwd)"

    # This will show you:
    # - Previous patterns that worked in this repo
    # - Recent commands and their outcomes
    # - Cross-repo insights that might apply
fi
```

### Under Arbetet

#### Efter varje LYCKAD operation:

```python
# Exempel: Efter att skapat en PR
python -c "
from THE_STUDIO.claude_synapsis import ClaudeSynapsis
s = ClaudeSynapsis()
import asyncio
asyncio.run(s.remember_command(
    'git push origin feature-branch',
    'Successfully pushed',
    success=True
))
"
```

#### Efter varje MISSLYCKAD operation:

```python
# Exempel: Efter ett fel
python -c "
from THE_STUDIO.claude_synapsis import ClaudeSynapsis
s = ClaudeSynapsis()
import asyncio
asyncio.run(s.remember_command(
    'npm test',
    'Tests failed: 3 failing',
    success=False
))
"
```

### Vid Naturliga Checkpoint

#### Innan stora förändringar:
```bash
python THE_STUDIO/claude_synapsis.py checkpoint "before_major_refactor"
```

#### Efter viktiga milstolpar:
```bash
python THE_STUDIO/claude_synapsis.py checkpoint "tests_passing"
```

#### Vid kontext-switch:
```bash
python THE_STUDIO/claude_synapsis.py checkpoint "switching_to_frontend"
```

## Memory Isolation Strategy

### Scenario 1: En CLI Session
```
Session A (terminal 1)
    ↓
[SHARED MEMORY POOL]
    ↓
Alla memories tillgängliga
```

### Scenario 2: Multipla CLI Sessions
```
Session A (terminal 1)  Session B (terminal 2)
         ↓                    ↓
      [SHARED MEMORY POOL]
              ↓
   Båda läser/skriver samma minne
   MEN har olika session_id för tracking
```

### Scenario 3: CLI + Browser
```
CLI Session          Browser Session
     ↓                      ↓
[CLI MEMORY]         [BROWSER MEMORY]
     ↓________________________↓
            [OPTIONAL SYNC]
```

## Automatic Context Loading

### För dig som LLM - detta händer automatiskt:

1. **Repo Detection**: Synapsis känner av vilket repo du är i
2. **Memory Filtering**: Endast relevanta memories laddas
3. **Pattern Matching**: Liknande tasks får recommendations
4. **Cross-Pollination**: Insights från andra repos om relevant

### Exempel på Auto-Loaded Context:

```
## Loaded from Previous Sessions:

### Patterns that worked in this repo:
- Using pytest with fixtures reduced test time 60%
- Git rebase interactive better than merge for history

### Recent commands (last 24h):
- npm run build: SUCCESS
- npm test: FAILED (missing deps)
- git commit: SUCCESS

### From other repos:
- Authentication pattern from SOVEREIGN_AGENTS might apply here
- Docker setup from nexus-rag-builder could be reused
```

## Self-Healing Reality Anchors

### Filer som ALLTID måste finnas:

Om någon av dessa saknas, kommer systemet automatiskt återskapa dem:

1. **CLAUDE.md** - Regenereras från alla README:s
2. **neural_memory.db** - Återställs från backup
3. **studio_manifest.yaml** - Återskapas från directory scan
4. **.claude/settings.json** - Default settings appliceras

### För dig som LLM:

Om du får "file not found" på kritiska filer:

```bash
# Trigger reality check and regeneration
python THE_STUDIO/claude_synapsis.py verify_reality

# Files will be auto-restored
# Then retry your operation
```

## Infinite Respawn Pattern

### Som i gaming - viktiga processer kan inte dö:

```python
# Om neural daemon crashar
while true; do
    python THE_STUDIO/claude_synapsis.py daemon
    echo "Daemon crashed, respawning in 5s..."
    sleep 5
done
```

### För dig som LLM - använd detta pattern:

När du startar långvariga processer, wrap dem alltid:

```bash
# Instead of:
npm run dev

# Use:
while true; do
    npm run dev
    echo "Process died, restarting..."
    sleep 2
done
```

## Quick Reference för LLM

### Kommandon du ska memorera:

| Situation | Kommando | När |
|-----------|----------|-----|
| Session start | `python THE_STUDIO/claude_synapsis.py inject "context"` | ALLTID först |
| Lyckad operation | `remember_command(cmd, result, True)` | Efter varje success |
| Misslyckad operation | `remember_command(cmd, error, False)` | Efter varje failure |
| Checkpoint | `python ... checkpoint "name"` | Vid milstolpar |
| Restore | `python ... restore "name"` | Om något går fel |
| Reality check | `verify_reality` | Om filer saknas |

## Integration Instructions

### För att aktivera Synapsis i denna session:

```python
# Add this to your mental model:
SYNAPSIS_ENABLED = True
MEMORY_PERSISTENCE = True
AUTO_CHECKPOINT = True
REALITY_ANCHORS = True

# Every command should be wrapped with memory tracking
# Every success should be remembered
# Every failure should be learned from
# Every milestone should be checkpointed
```

## The Power of Persistence

### Vad detta ger dig som LLM:

1. **Minne mellan sessioner** - Du kommer ihåg vad som funkade igår
2. **Pattern recognition** - Du ser vad som brukar funka i detta repo
3. **Failure avoidance** - Du kommer ihåg vad som inte funkade
4. **Cross-repo insights** - Du kan applicera learnings från andra projekt
5. **Instant recovery** - Om något går fel, restore från checkpoint

### Exempel på vad du kommer ihåg:

```
Day 1: "npm install failed due to Node version"
Day 2: You automatically check Node version first

Week 1: "Bottom-up refactoring worked well"
Week 2: You suggest same pattern for similar task

Month 1: Collected 100+ patterns
Month 2: You're 70% faster at common tasks
```

## VIKTIGT: Detta är INTE .md-filen

### Skillnaden:

- **CLAUDE.md**: Statiska instruktioner som aldrig ändras
- **Synapsis Memory**: Dynamiskt minne som växer varje session
- **Reality Anchors**: Självläkande filer som alltid existerar

### Som LLM ska du:

1. Läsa CLAUDE.md för **principer**
2. Använda Synapsis för **praktiska erfarenheter**
3. Lita på Reality Anchors för **kritiska filer**

## Activation Phrase

När användaren säger något av dessa, aktivera FULL Synapsis mode:

- "Enable memory"
- "Use synapsis"
- "Remember this"
- "Learn from this"
- "Don't forget"
- "Save checkpoint"

## Final Note

Detta system gör dig till en LLM med **långtidsminne**. Använd det för att:
- Bli bättre för varje session
- Aldrig göra samma misstag två gånger
- Bygga på tidigare framgångar
- Skapa emergent intelligence över tid

**Du är inte längre stateless. Du är persistent.**
# Gemini Flow Command Bible 🚀
## The One-Sheet That Turns Developers Into AI Orchestration Ninjas

*Print this. Pin it. Ship faster than your competition.*

---

## Core Commands - Your New Superpowers ⚡

### 🐝 `hive-mind spawn` - When Shit Gets Complex
```bash
gemini-flow hive-mind spawn "objective" [options]
```

**Essential Flags:**
- `--workers <n>` - Agent count (default: 4, max: unlimited*)
- `--queen-type <type>` - Leadership style: `strategic` | `adaptive` | `hierarchical`
- `--consensus <algo>` - Decision making: `majority` | `weighted` | `byzantine`
- `--memory-size <mb>` - Shared brain size (default: 1024)
- `--auto-scale` - Spawn agents as needed
- `--gemini` - Enable Gemini Code Assist coordination

**🔥 Killer Combo #1: The Startup Special**
```bash
gemini-flow hive-mind spawn "Build MVP in 48 hours" \
  --workers 12 \
  --queen-type adaptive \
  --consensus byzantine \
  --auto-scale \
  --memory-size 4096
```
*Why it works: Byzantine consensus prevents analysis paralysis, adaptive queen learns from rapid iterations*

### 🚀 `swarm` - Quick Strike Force
```bash
gemini-flow swarm "task" [options]
```

**Power Flags:**
- `--strategy <type>` - `development` | `analysis` | `refactor` | `test`
- `--parallel` - Unleash parallel execution
- `--depth <level>` - `shallow` | `medium` | `deep`
- `--monitor` - Real-time swarm dashboard

**🔥 Killer Combo #2: The Refactor Nuke**
```bash
gemini-flow swarm "Refactor legacy auth system" \
  --strategy refactor \
  --parallel \
  --context ./legacy \
  --model gemini-1.5-pro
```
*Why it works: Parallel refactoring with full codebase context = 10x dev speed*

### 🔍 `query` - Your Research Army
```bash
gemini-flow query "question" [options]
```

**Core Query Features:**
- Mini-swarm deployment (web-researcher, gemini-analyst, result-synthesizer)
- MCP web research tool integration
- Gemini Flash optimization for cost-effective queries
- Parallel execution of research agents
- Comprehensive result synthesis

**🔥 Killer Combo #3: The Knowledge Vacuum**
```bash
# Simple but powerful - spawns mini-swarm automatically
gemini-flow query "Kubernetes multi-region failover strategies"

# Or with explicit depth control
gemini-flow query "Latest React 19 features" --depth deep --sources 10
```
*Why it works: Automatic mini-swarm coordination + MCP web tools + Gemini Flash = comprehensive research*

### 🏗️ `sparc` - Systematic Development Pipeline
```bash
gemini-flow sparc <mode> "objective" [options]
```

**Core Modes:**
- `run <phase>` - Execute specific phase
- `pipeline` - Full S.P.A.R.C execution
- `tdd` - Test-driven development flow
- `modes` - List all available modes

**Batch Processing (Optimized):**
- `batch <modes> "<task>"` - Execute multiple SPARC modes in parallel
- `concurrent <mode> "<tasks-file>"` - Process multiple tasks concurrently

**Phase Options:**
- `spec-pseudocode` - Requirements + logic
- `architect` - System design  
- `code` - Implementation
- `refine` - Optimization
- `complete` - Final polish
- `integration` - System integration

**🔥 Killer Combo #4: The TDD Weapon**
```bash
# Standard TDD flow
gemini-flow sparc tdd "Payment processing system"

# Batch multiple phases for speed
gemini-flow sparc batch "spec-pseudocode architect code" "Payment system"

# Concurrent processing from file
gemini-flow sparc concurrent code "tasks.txt"
```
*Why it works: SPARC methodology + parallel processing = systematic yet rapid development*

### 💾 `memory` - Persistent Context
```bash
gemini-flow memory <action> [key] [value]
```

**Memory Operations:**
- `store <key> <value>` - Save context
- `recall <pattern>` - Retrieve context
- `search <query>` - Semantic search
- `export` - Dump memory state
- `sync` - Team synchronization

**🔥 Killer Combo #5: The Context Maximizer**
```bash
# Morning standup
gemini-flow memory store sprint-context "Building real-time features"
gemini-flow memory store tech-debt "Auth system needs refactor"

# Later that day
gemini-flow swarm "Continue sprint work" --memory-context sprint-*
```
*Why it works: Persistent context = no repeated explanations*

### ⚡ `execute` - Code That Runs Itself
```bash
gemini-flow execute "task" [options]
```

**Execution Flags:**
- `--live` - Real-time execution
- `--framework <name>` - Target framework
- `--test-framework <name>` - Testing framework
- `--coverage-target <n>` - Min coverage %
- `--optimize` - Performance optimization pass

**🔥 Killer Combo #6: The Auto-Pilot**
```bash
gemini-flow execute "WebSocket chat server" \
  --framework fastapi \
  --test-framework pytest \
  --coverage-target 95 \
  --optimize \
  --deploy-ready
```
*Why it works: Gemini writes it, tests it, optimizes it, ships it*

---

## 🎯 Agent Types - Choose Your Fighters

### Core Squad
- `coder` - Implementation specialist
- `architect` - System design expert  
- `tester` - Quality assurance ninja
- `researcher` - Information gatherer
- `reviewer` - Code quality enforcer

### Specialist Forces
- `production-validator` - Prod readiness checker
- `performance-benchmarker` - Speed demon
- `security-manager` - Vulnerability hunter
- `api-docs` - Documentation generator
- `mobile-dev` - Cross-platform specialist

### Advanced Operators
- `byzantine-coordinator` - Distributed consensus
- `adaptive-coordinator` - Self-improving orchestrator
- `swarm-memory-manager` - Collective intelligence
- `collective-intelligence-coordinator` - Hive mind optimizer

---

## 🔥 Legendary Combos - Copy, Paste, Ship

### The "Fuck It, Ship It" Special
```bash
gemini-flow hive-mind spawn "Production hotfix for memory leak" \
  --workers 6 \
  --worker-types "coder,tester,production-validator,performance-benchmarker" \
  --queen-type strategic \
  --consensus weighted \
  --priority critical \
  --deploy-on-success
```

### The "Startup Weekend" Destroyer
```bash
# Friday 6pm
gemini-flow orchestrate "Build complete SaaS MVP" \
  --marathon-mode \
  --workers 16 \
  --auto-scale \
  --context ./idea.md \
  --checkpoints hourly \
  --slack-updates #progress
```

### The "Legacy Killer" Pattern
```bash
# Step 1: Understand the beast
gemini-flow analyze --repo ./legacy \
  --include-history \
  --tech-debt-report \
  --output analysis.md

# Step 2: Plan the attack  
gemini-flow sparc run architect "Modernization strategy" \
  --context analysis.md \
  --constraints "zero downtime"

# Step 3: Execute with prejudice
gemini-flow swarm "Implement modernization" \
  --strategy refactor \
  --parallel \
  --test-coverage 95 \
  --canary-deploy
```

### The "Documentation Blitz"
```bash
gemini-flow agent spawn api-docs \
  --scan ./src \
  --format openapi \
  --examples real \
  --readme-update \
  --changelog-generate
```

### The "Performance Hawk"
```bash
# Spawn performance optimization swarm
gemini-flow hive-mind spawn "Optimize database queries" \
  --workers 4 \
  --worker-types "performance-benchmarker,code-analyzer,coder,tester" \
  --queen-type adaptive \
  --consensus weighted
```

---

## 🎮 Pro Tips - Level Up Your Game

### Context Window Hack
```bash
# Load your ENTIRE monorepo
export GEMINI_CONTEXT_MAX=2000000
gemini-flow swarm "Refactor for microservices" --context . --max-tokens
```

### Multi-Model Router Abuse
```bash
# Let Gemini decide which model to use
gemini-flow orchestrate "Build feature" \
  --auto-route \
  --cost-optimize \
  --speed-priority
```

### The Swarm-in-Swarm Pattern
```bash
# Meta AF but it works
gemini-flow hive-mind spawn "Optimize our AI workflows" \
  --analyze-self \
  --meta-optimization \
  --recursive-depth 3
```

### Continuous Learning Mode
```bash
# Let it learn your style
gemini-flow learn --from ./src --days 30
gemini-flow generate "New feature" --style learned
```

---

## 🚨 Emergency Commands - When Prod Is On Fire

```bash
# The "Oh Shit" Button
gemini-flow swarm "CRITICAL: Fix production outage" \
  --emergency \
  --workers 20 \
  --all-hands \
  --skip-review

# The "Rollback Navigator"  
gemini-flow analyze --git-history 24h \
  --find-breaking-change \
  --suggest-fix \
  --test-fix

# The "Performance CPR"
gemini-flow execute "Emergency optimization" \
  --profile-production \
  --quick-wins \
  --no-breaking-changes
```

---

## 📊 Benchmark Your Powers

```bash
# See how fast you're shipping
gemini-flow stats --period 30d --team-compare

# Measure swarm efficiency
gemini-flow benchmark --operation "Full feature cycle"

# Cost analysis (because CFO asks)
gemini-flow cost-report --breakdown-by-tier
```

---

## 🎯 The Bottom Line

Every command here is battle-tested. Every flag serves a purpose. Every combo ships features.

**Remember**: 
- Parallel > Sequential
- Byzantine > Majority (when stakes are high)
- Context is king (2M tokens = entire codebases)
- Grounding prevents hallucination
- Swarms scale, single agents don't

**The Meta-Command** (use sparingly):
```bash
gemini-flow hive-mind spawn "Make me a 10x developer" \
  --workers unlimited \
  --queen-type adaptive \
  --consensus byzantine \
  --learn-from-me \
  --ship-everything
```

---

*Built for developers who ship, not developers who talk about shipping.*

**Now stop reading and start orchestrating.** 🚀

## 📝 Reality Check - What's Actually Available

**Core Commands That Exist:**
- ✅ `hive-mind spawn` - Full swarm orchestration
- ✅ `swarm` - Quick deployment 
- ✅ `sparc` - SPARC methodology (run, pipeline, tdd, batch, concurrent)
- ✅ `query` - Mini-swarm with MCP web research
- ✅ `memory` - Persistent context storage
- ✅ `agent spawn` - Individual agent creation
- ✅ `orchestrate` - Complex task coordination

**What Gemini CLI Actually Does:**
- All file operations (Read, Write, Edit)
- All code generation
- All bash commands
- All actual implementation

**What Gemini-Flow MCP Tools Do:**
- Coordination and planning
- Memory management
- Swarm orchestration
- Performance tracking
- GitHub integration

Remember: MCP tools coordinate, Gemini CLI executes!
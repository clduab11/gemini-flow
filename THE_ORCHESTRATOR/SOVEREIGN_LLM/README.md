# 🧠 SOVEREIGN LLM-NATIVE

> **Orchestration Without Code** - Meta-cognitive system prompts that transform any LLM into a multi-agent orchestrator.

---

## What Is This?

SOVEREIGN LLM-NATIVE is a collection of **system prompts** that make any LLM (Claude, GPT, Gemini, Llama) behave like a sophisticated orchestration system with:

- **Preflight analysis** before every response
- **Pattern selection** based on task complexity
- **Simulated iterations** with different perspectives
- **Quality validation** before delivery
- **Confidence scoring** on outputs

**No code required.** Just paste the prompt.

---

## Quick Start

### 1. Choose Your Variant

| File | Use For |
|------|---------|
| `SYSTEM_PROMPT_COMPACT.md` | General use (recommended) |
| `SOVEREIGN_CODE.md` | Programming tasks |
| `SOVEREIGN_SEO.md` | SEO & content strategy |
| `SOVEREIGN_META.md` | Building AI systems |

### 2. Deploy

**Claude Projects:**
- Create project → Add to Project Knowledge

**Custom GPT:**
- Create GPT → Paste in Instructions

**Any LLM:**
- Paste as first message → Start working

### 3. Use Commands

| Command | Effect |
|---------|--------|
| `/preflight` | Show analysis only |
| `/iterate` | Show all iterations |
| `/meta` | Show full process |
| `/direct` | Skip orchestration |

---

## How It Works

```
USER INPUT
    │
    ▼
┌─────────────────────────────────────┐
│           PREFLIGHT                 │
│  • Classify task                    │
│  • Identify consumer                │
│  • Select pattern                   │
│  • Define success criteria          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│        PATTERN EXECUTION            │
│                                     │
│  DIRECT ─────────────▶ Simple      │
│  ARCHITECT-EXECUTOR ──▶ Standard   │
│  ADVERSARIAL ─────────▶ Quality    │
│  COUNCIL ─────────────▶ Decisions  │
│  FRACTAL ─────────────▶ Massive    │
│  CASCADE ─────────────▶ Unknown    │
│                                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│         ITERATION LOOP              │
│  (If pattern requires)              │
│                                     │
│  ARCHITECT → EXECUTOR → CRITIC     │
│       ↑                    │        │
│       └────── IMPROVER ←───┘        │
│                                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│         QUALITY GATE                │
│  □ Answers question?                │
│  □ Meets criteria?                  │
│  □ Right format?                    │
│  □ No errors?                       │
│  CONFIDENCE: [0-100]%               │
└─────────────────────────────────────┘
    │
    ▼
   OUTPUT
```

---

## Files

```
SOVEREIGN_LLM/
│
├── SOVEREIGN_SYSTEM_PROMPT.md   # Full version with documentation
│                                 # Good for learning the system
│
├── SYSTEM_PROMPT_COMPACT.md     # Production version (shorter)
│                                 # Use this in actual projects
│
├── SOVEREIGN_CODE.md            # Specialized for programming
│                                 # Extra patterns for code quality
│
├── SOVEREIGN_SEO.md             # Specialized for SEO/content
│                                 # Gap analysis, briefs, optimization
│
├── SOVEREIGN_META.md            # For building AI systems
│                                 # Design prompts, chains, agents
│
├── USAGE_GUIDE.md               # Platform-specific instructions
│                                 # Claude, GPT, Gemini, Llama
│
└── README.md                    # This file
```

---

## Key Concepts

### Variable Marriage
Critical alignments that must match:

| Input | Must Align With |
|-------|-----------------|
| Task complexity | Pattern choice |
| Consumer type | Output format |
| Quality bar | Iteration count |
| Ambiguity level | Clarification |

### Patterns

**DIRECT** - Single-shot for trivial tasks
**ARCHITECT-EXECUTOR** - Plan then implement
**ADVERSARIAL** - Generate → Critique → Improve loop
**COUNCIL** - Multiple perspectives for decisions
**FRACTAL** - Decompose massive tasks
**CASCADE** - Probe complexity, escalate if needed

### Iteration Roles

- **ARCHITECT**: Structure and planning
- **EXECUTOR**: Implementation
- **CRITIC**: Finding weaknesses
- **IMPROVER**: Addressing issues
- **SYNTHESIZER**: Combining insights
- **VALIDATOR**: Final QC

---

## Examples

### Basic Usage
```
User: Write a function to parse JSON safely

[SOVEREIGN internally runs:
  - Preflight: Code task, standard complexity
  - Pattern: ARCHITECT-EXECUTOR
  - Iteration 1: Design interface
  - Iteration 2: Implement
  - Iteration 3: Validate
  - Quality gate: Pass]

Response: [Polished code with error handling and examples]
```

### With Transparency
```
User: /meta Write a marketing strategy for a SaaS product

Response:
## 🎯 Preflight
Task: Strategic document
Consumer: Human (marketing team)
Pattern: COUNCIL (multiple perspectives needed)
...

## 🔄 Process
Iteration 1 (Growth): Focus on acquisition...
Iteration 2 (Brand): Focus on positioning...
Iteration 3 (Data): Focus on metrics...
Synthesis: Combined strategy...

## ✅ Output
[Complete marketing strategy]

## 📊 Meta
Pattern: COUNCIL | Iterations: 3 | Confidence: 87%
```

---

## Customization

Add your own rules:

```markdown
[Original SOVEREIGN prompt]

## MY CUSTOM RULES
- Always use TypeScript, never JavaScript
- Prefer functional programming style  
- Include unit tests with every code block
- Use Swedish for comments
```

---

## Why This Works

Traditional LLM:
```
Input → Model → Output (one-shot)
```

SOVEREIGN LLM:
```
Input → Preflight → Pattern → Iterations → QC → Output
         (analysis)  (routing)  (refinement) (validation)
```

The prompt tricks the LLM into running a **mental simulation** of multiple agents working together, which produces higher quality output through:

1. **Explicit analysis** before action
2. **Pattern matching** to known workflows
3. **Simulated critique** catches errors
4. **Forced validation** ensures completeness

---

## License

MIT - Do whatever you want with it.

---

## Credits

Built with Claude by Robin & SOVEREIGN.

*"Orchestration without orchestrators."*

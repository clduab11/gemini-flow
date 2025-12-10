# APEX Instantiation Prompt
## Deep Research Template för Domän-Specifik Agent-Spawning

---

## INSTRUKTIONER FÖR ANVÄNDNING

Denna prompt är designad för att användas med Claude's Deep Research (eller liknande research-verktyg) för att samla in den kunskap som behövs för att instansiera APEX-framework för en specifik domän eller repository.

**Fyll i variablerna i `[BRACKETS]` innan du kör prompten.**

---

## PROMPT START

```markdown
# Research Task: APEX Agent Architecture för [DOMÄN/REPO]

## Kontext

Jag bygger ett AI-agent-system enligt APEX-arkitekturen (Adaptive Precision Execution) som ska kunna:

1. Generera [OUTPUT_TYP] med extremt låg failure rate
2. Hantera [SKALA - t.ex. "10+ filer", "1000+ rader", "komplex interdependens"]
3. Uppnå kvalitet jämförbar med manuellt craftade outputs
4. Vara token-effektivt genom smart decomposition och diff-baserade edits

Måldomän: **[DOMÄN - t.ex. "SEO content automation", "codebase migration", "API documentation generation"]**

Target repo/stack (om tillämpligt): **[REPO_URL eller TECH_STACK]**

---

## Del 1: Domän-Specifik Kunskapsinsamling

### 1.1 Best Practices & Quality Standards

Researcha och sammanställ:

- Vad definierar "excellence" inom [DOMÄN]?
- Vilka är de vanligaste failure modes?
- Vilka kvalitetsmetriker används av experter?
- Finns det etablerade frameworks/standards (t.ex. Google's E-E-A-T för SEO)?

**Söktermer att använda:**
- "[DOMÄN] best practices 2024"
- "[DOMÄN] quality metrics"
- "[DOMÄN] common mistakes"
- "[DOMÄN] expert checklist"

### 1.2 Strukturella Patterns

Researcha:

- Hur struktureras high-quality [OUTPUT_TYP]?
- Vilka komponenter är obligatoriska vs. valfria?
- Finns det templates eller schemas som används?
- Hur hanteras dependencies mellan komponenter?

**Söktermer:**
- "[OUTPUT_TYP] structure template"
- "[OUTPUT_TYP] architecture patterns"
- "[DOMÄN] file organization"

### 1.3 Validerings-Kriterier

Researcha:

- Vilka automatiska valideringar är möjliga?
- Finns det linters, validators, eller test-frameworks?
- Vilka checks gör experter manuellt?
- Hur kan man mäta kvalitet programmatiskt?

**Söktermer:**
- "[DOMÄN] validation tools"
- "[OUTPUT_TYP] linter"
- "[DOMÄN] automated testing"
- "[DOMÄN] quality assurance automation"

---

## Del 2: AI Agent Patterns för Domänen

### 2.1 Existerande AI-Lösningar

Researcha:

- Vilka AI-verktyg/agents finns redan för [DOMÄN]?
- Vad gör de bra? Var misslyckas de?
- Vilka prompting-tekniker används?
- Finns det open-source implementations?

**Söktermer:**
- "AI [DOMÄN] automation"
- "LLM [OUTPUT_TYP] generation"
- "[DOMÄN] AI agent github"
- "GPT [DOMÄN] workflow"

### 2.2 Decomposition Strategies

Researcha:

- Hur kan [UPPGIFT] brytas ner i parallelliserbara subtasks?
- Vilka dependencies finns mellan subtasks?
- Vilka delar kräver sekventiell vs. parallell execution?
- Hur minimerar man context-storlek per subtask?

**Söktermer:**
- "[DOMÄN] task decomposition"
- "[OUTPUT_TYP] modular generation"
- "divide and conquer [DOMÄN]"

### 2.3 Critique & Refinement Patterns

Researcha:

- Hur granskas [OUTPUT_TYP] av experter?
- Vilka critique-dimensioner är viktigast?
- Hur ser iterativ förbättring ut?
- Finns det peer-review eller editorial workflows?

**Söktermer:**
- "[DOMÄN] code review process" (eller motsvarande)
- "[OUTPUT_TYP] editorial workflow"
- "[DOMÄN] quality gate criteria"

---

## Del 3: Token-Effektivitet & Skalning

### 3.1 Context Management

Researcha:

- Hur kan man representera [DOMÄN]-kunskap kompakt?
- Finns det repo-map eller AST-baserade tekniker?
- Vilka delar av context är kritiska vs. nice-to-have?
- Hur hanterar liknande verktyg stora codebases/datasets?

**Söktermer:**
- "LLM context compression [DOMÄN]"
- "repo map code generation"
- "RAG [DOMÄN] retrieval"
- "selective context injection"

### 3.2 Edit Formats & Diff Patterns

Researcha:

- Vilka edit-format fungerar bäst för [OUTPUT_TYP]?
- Hur appliceras diff-baserade edits?
- Vilka verktyg/bibliotek finns för programmatic editing?
- Hur undviker man "write whole file" anti-patterns?

**Söktermer:**
- "LLM code editing formats"
- "diff-based generation"
- "patch format AI coding"
- "[SPRÅK/FORMAT] programmatic editing library"

### 3.3 Caching & Memoization

Researcha:

- Vilka delar av [PROCESS] kan cachas?
- Hur implementeras incremental generation?
- Finns det content-addressable patterns?
- Hur undviker man redundant computation?

**Söktermer:**
- "LLM output caching strategies"
- "incremental code generation"
- "memoization AI workflows"

---

## Del 4: Framework Integration

### 4.1 CrewAI Patterns (om tillämpligt)

Researcha:

- Vilka CrewAI-patterns passar för [DOMÄN]?
- Hur struktureras hierarchical crews för [UPPGIFT]?
- Vilka custom tools behövs?
- Hur används Flows för orchestration?

**Söktermer:**
- "CrewAI [DOMÄN] example"
- "CrewAI hierarchical process"
- "CrewAI custom tools tutorial"
- "CrewAI Flows advanced patterns"

### 4.2 Alternativa Frameworks

Researcha (för jämförelse/inspiration):

- LangGraph patterns för [DOMÄN]
- DSPy optimizations för [OUTPUT_TYP]
- AutoGen multi-agent patterns
- TaskWeaver code-first approaches

**Söktermer:**
- "LangGraph [DOMÄN]"
- "DSPy [UPPGIFT]"
- "multi-agent [DOMÄN] comparison"

### 4.3 Structured Output Libraries

Researcha:

- Hur används Instructor/Pydantic för [OUTPUT_TYP]?
- Vilka schema-patterns är relevanta?
- Hur hanteras nested/complex structures?
- Vilka validation patterns är mest effektiva?

**Söktermer:**
- "Instructor library [OUTPUT_TYP]"
- "Pydantic schema [DOMÄN]"
- "structured output LLM [DOMÄN]"

---

## Del 5: Failure Mode Analysis

### 5.1 Vanliga AI-Failures inom [DOMÄN]

Researcha:

- Vilka är de vanligaste felen AI gör inom [DOMÄN]?
- Vilka edge cases hanteras dåligt?
- Hur upptäcks failures automatiskt?
- Vilka guardrails används i production?

**Söktermer:**
- "LLM [DOMÄN] failures"
- "AI [OUTPUT_TYP] mistakes"
- "[DOMÄN] AI hallucination"
- "production AI [DOMÄN] guardrails"

### 5.2 Recovery Patterns

Researcha:

- Hur återhämtar sig system från failures?
- Vilka retry-strategier fungerar?
- Hur eskaleras till human review?
- Vilka fallback-mekanismer finns?

**Söktermer:**
- "AI agent error recovery"
- "LLM retry strategies"
- "human-in-the-loop [DOMÄN]"
- "graceful degradation AI systems"

---

## Önskat Output-Format

Strukturera forskningsresultaten enligt:

### 1. Executive Summary
- Key findings (3-5 punkter)
- Recommended APEX pattern (A/B/C eller hybrid)
- Estimated complexity & token budget

### 2. Quality Function Definition
```python
def domain_quality(output, context) -> float:
    # Baserat på research, definiera:
    # - Vilka metriker att mäta
    # - Hur de viktas
    # - Thresholds för "good enough"
```

### 3. Invariant Schema
```python
class DomainOutput(BaseModel):
    # Baserat på research, definiera:
    # - Required fields med constraints
    # - Custom validators
    # - Cross-field validations
```

### 4. Agent Role Definitions
```yaml
agents:
  - name: [ROLE]
    responsibility: [ANSVAR]
    inputs: [REQUIRED_CONTEXT]
    outputs: [EXPECTED_OUTPUT]
    quality_criteria: [METRICS]
```

### 5. Decomposition Strategy
```
Task Breakdown:
├── Phase 1: [SUBTASK]
│   ├── Can parallelize: [YES/NO]
│   └── Dependencies: [LIST]
├── Phase 2: [SUBTASK]
...
```

### 6. Critique Dimensions
```yaml
critics:
  - dimension: "[ASPECT]"
    checks:
      - "[SPECIFIC_CHECK]"
    severity_weights: [0.0-1.0]
```

### 7. Known Failure Modes & Mitigations
| Failure Mode | Detection | Mitigation |
|--------------|-----------|------------|
| [MODE] | [HOW_TO_DETECT] | [HOW_TO_FIX] |

### 8. Recommended Tools & Libraries
- [TOOL]: [USE_CASE]
- [LIBRARY]: [INTEGRATION_POINT]

### 9. Token Budget Estimation
| Phase | Estimated Tokens | Model Recommendation |
|-------|-----------------|---------------------|
| [PHASE] | [TOKENS] | [MODEL] |

### 10. Implementation Roadmap
1. [FIRST_STEP]
2. [SECOND_STEP]
...

---

## Constraints för Research

- **Max källor:** 35
- **Prioritera:** Praktiska implementationer > teoretiska papers
- **Fokus:** Senaste 12-18 månaderna (2024-2025)
- **Språk:** Engelska källor OK, output på svenska

---

## Avslutande Fråga till Researcher

Efter research, besvara:

> "Givet denna domän och dessa findings - vilken APEX-konfiguration 
> ger bäst chans att konsekvent producera [OUTPUT_TYP] som överträffar 
> vad en enskild mänsklig expert kan producera på samma tid, 
> med < 5% failure rate?"
```

---

## PROMPT END

---

## Exempel på Ifyllda Variabler

### För SEO Content Automation:
- `[DOMÄN]` = "SEO content marketing"
- `[OUTPUT_TYP]` = "pillar pages och supporting content clusters"
- `[SKALA]` = "10-20 artiklar per cluster, 2000-5000 ord per artikel"
- `[REPO_URL]` = "CrewAI + Python 3.11 + Ahrefs API"
- `[UPPGIFT]` = "generera SEO-optimerad content"

### För Codebase Migration:
- `[DOMÄN]` = "legacy code migration"
- `[OUTPUT_TYP]` = "modernized code modules"
- `[SKALA]` = "100+ filer, Python 2 → Python 3.11"
- `[REPO_URL]` = "github.com/example/legacy-app"
- `[UPPGIFT]` = "migrera och modernisera kodbas"

### För API Documentation:
- `[DOMÄN]` = "API documentation generation"
- `[OUTPUT_TYP]` = "OpenAPI specs + usage guides"
- `[SKALA]` = "50+ endpoints, full reference docs"
- `[REPO_URL]` = "FastAPI backend repo"
- `[UPPGIFT]` = "generera komplett API-dokumentation"

---

## Tips för Maximal Effekt

1. **Kör prompten iterativt** - Börja med Del 1-2, utvärdera, fortsätt
2. **Spara mellanresultat** - Research kan brytas upp över sessioner
3. **Validera med domänexpert** - Quality function bör sanity-checkas
4. **Starta smått** - Implementera Pattern C först, skala sedan

---

*APEX Instantiation Prompt v1.0*

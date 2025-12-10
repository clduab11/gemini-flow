# APEX Framework Quick Start
## Kom igång på 5 minuter

---

## Installation

```bash
# Clone eller kopiera apex/ mappen
pip install pydantic>=2.0 anthropic  # eller openai
```

---

## Tre Steg till Din Första APEX-Instans

### Steg 1: Definiera Output Schema

```python
from pydantic import BaseModel, Field, field_validator

class MyOutput(BaseModel):
    """Definiera EXAKT vad som ska genereras."""
    
    # Required fields med constraints
    title: str = Field(..., min_length=10, max_length=100)
    content: str = Field(..., min_length=500)
    
    # Custom validators = HÅRDA invariants
    @field_validator('content')
    @classmethod
    def no_placeholders(cls, v):
        if 'TODO' in v or 'FIXME' in v:
            raise ValueError("No placeholders allowed")
        return v
```

**Regeln:** Om det finns i schemat med en validator, kommer APEX **aldrig** returnera output som bryter mot det.

---

### Steg 2: Definiera Quality Function

```python
def my_quality_function(output: MyOutput, context: dict) -> float:
    """
    Returnera 0.0-1.0 baserat på hur bra output är.
    
    Tips:
    - Dela upp i flera dimensioner
    - Vikta efter importance
    - Var granulär (inte bara pass/fail)
    """
    scores = []
    
    # Dimension 1: Längd
    target_words = context.get('target_words', 1000)
    actual_words = len(output.content.split())
    length_score = min(1.0, actual_words / target_words)
    scores.append(length_score)
    
    # Dimension 2: Keyword presence
    keyword = context.get('keyword', '')
    if keyword.lower() in output.title.lower():
        scores.append(1.0)
    else:
        scores.append(0.3)
    
    # Dimension 3: ...
    
    return sum(scores) / len(scores)
```

---

### Steg 3: Skapa och Kör

```python
from apex.core import create_apex_instance, APEXConfig
from apex.domains.seo_content import SEOCritic  # Eller dina egna critics

# Skapa instans
apex = create_apex_instance(
    domain="my_domain",
    output_schema=MyOutput,
    quality_fn=my_quality_function,
    generator_factory=lambda: MyGenerator(),  # Din LLM-integration
    critics=[MyCritic()],
    config=APEXConfig(
        quality_threshold=0.85,
        max_iterations=5,
    ),
)

# Kör
import asyncio

result = asyncio.run(apex.execute(
    task="Generate a blog post about AI",
    context={"keyword": "AI", "target_words": 1000}
))

print(f"Success: {result.success}")
print(f"Score: {result.score:.2%}")
print(f"Iterations: {result.iterations}")
```

---

## Välja Rätt Pattern

| Scenario | Pattern | Varför |
|----------|---------|--------|
| Enkel task, känd struktur | `DIRECT` | 1 API call, snabbast |
| Okänd komplexitet | `CAPABILITY_CASCADE` | Auto-eskalerar vid behov |
| Hög precision krävs | `ADVERSARIAL_REFINEMENT` | Critics + iteration |
| Massiv output (10+ filer) | `FRACTAL_DECOMPOSITION` | Parallellisering |

---

## Quality Function Tips

**Bra quality function:**
```python
def good_quality(output, ctx) -> float:
    # Granulär - många dimensioner
    # Viktad - kritiska saker väger mer
    # Snabb - < 100ms
    # Deterministisk - samma input = samma output
```

**Dålig quality function:**
```python
def bad_quality(output, ctx) -> float:
    if "good" in output.content:
        return 1.0  # Binär - ingen gradering
    return 0.0  # Missar nyanser
```

---

## Debugging

```python
# Se hela execution-historiken
print(f"Score trajectory: {result.metrics.score_trajectory}")
print(f"Termination: {result.termination_reason}")

# Detaljerade critiques
for c in result.critiques:
    print(f"[{c.dimension}] {c.issue}")
    print(f"  Severity: {c.severity}")
    print(f"  Fix: {c.suggestion}")
```

---

## Nästa Steg

1. **Läs** `APEX_FRAMEWORK.md` för djupare förståelse
2. **Studera** `apex/domains/seo_content.py` som komplett exempel
3. **Använd** `APEX_RESEARCH_PROMPT.md` för att researcha din domän
4. **Iterera** på quality function - det är där magin händer

---

## Vanliga Frågor

**Q: Hur vet jag att quality function är bra nog?**
A: Kör 10 manuella exempel, scora dem själv, jämför med funktionens score. Calibrate tills de matchar.

**Q: Hur många critics behöver jag?**
A: Börja med 2-3 som täcker olika dimensioner. Lägg till fler när du ser failure modes.

**Q: Varför får jag MAX_ITERATIONS?**
A: Antingen är quality_threshold för högt, eller så är dina critics för stränga. Sänk threshold eller justera severity weights.

**Q: Kan jag använda olika modeller?**
A: Ja! Använd billigare modeller för critics och dyrare för generators. Se APEXConfig.

---

*APEX Framework Quick Start v1.0*

# APEX Framework
## Adaptive Precision Execution Architecture

> *"Systems that converge on excellence through structural inevitability, not luck."*

---

## Kärnprincip

APEX är inte ett agent-framework - det är ett **meta-framework för att spawna domän-specifika agent-system** som har matematiskt låg failure rate genom att:

1. **Eliminera single points of failure** - ingen komponent kan ensam sänka kvaliteten
2. **Bygga in konvergens** - varje iteration *måste* förbättra eller terminera
3. **Separera concerns extremt** - ingen agent gör två saker samtidigt

---

## De Tre Pelarna

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PELARE 1: DIVERGENCE ENGINE                      │
│         "Generera fler kandidater än du behöver"                    │
│                                                                     │
│   • Parallella generatorer med olika "temperaturer"                 │
│   • Heterogena perspektiv (olika prompts, olika modeller)           │
│   • Ingen tidig filtrering - samla allt först                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PELARE 2: CONVERGENCE ENGINE                     │
│         "Kombinera det bästa från varje kandidat"                   │
│                                                                     │
│   • Graph-of-Thoughts aggregation (inte bara voting)                │
│   • Syntes > selektion (skapa nytt från delar)                      │
│   • Konflikt-driven förfining (MAD-pattern)                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PELARE 3: INVARIANT GATES                        │
│         "Omöjligt att passera utan att uppfylla krav"               │
│                                                                     │
│   • Pydantic schemas med custom validators                          │
│   • Executable tests (inte bara heuristiska checks)                 │
│   • Termination guarantees (max iterations + quality floor)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arkitektur-Mönster

### Pattern A: "Fractal Decomposition"
**Användning:** Massiv output (10+ filer, 1000+ rader)

```
                    ┌─────────────┐
                    │  ARCHITECT  │ ← Ser hela problemet
                    │   (1 call)  │   Output: Dependency graph + specs
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ COMPONENT_A │ │ COMPONENT_B │ │ COMPONENT_C │  ← Parallell execution
    │  (n calls)  │ │  (n calls)  │ │  (n calls)  │    Ingen cross-dependency
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌─────────────┐
                    │ INTEGRATOR  │ ← Löser interface-konflikter
                    │   (1 call)  │   Output: Glue code + imports
                    └─────────────┘
```

**Token-ekonomi:**
- Architect: ~2k tokens (specs, inte implementation)
- Components: ~1k tokens vardera (isolerad kontext)
- Integrator: ~1k tokens (bara interfaces)
- **Total: O(n) istället för O(n²)**

---

### Pattern B: "Adversarial Refinement"
**Användning:** Hög precision krävs (kod, juridik, finans)

```
     ┌──────────────────────────────────────────────────────────────┐
     │                      GENERATION ROUND                        │
     │                                                              │
     │   Generator_A ──┐                                            │
     │   Generator_B ──┼──► Pool of Candidates                      │
     │   Generator_C ──┘                                            │
     └──────────────────────────────────────────────────────────────┘
                                │
                                ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                      CRITIQUE ROUND                          │
     │                                                              │
     │   Critic_Logic ────► "Line 47 has edge case bug"             │
     │   Critic_Style ────► "Function too long, split"              │
     │   Critic_Security ─► "SQL injection possible"                │
     │                                                              │
     │   Output: Ranked issues with severity + fix suggestions      │
     └──────────────────────────────────────────────────────────────┘
                                │
                                ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                      SYNTHESIS ROUND                         │
     │                                                              │
     │   Input:  Best candidate + all critiques                     │
     │   Output: Improved version addressing critiques              │
     │                                                              │
     │   LOOP until: critiques.severity.max() < threshold           │
     │          OR: iterations > max_iterations                     │
     └──────────────────────────────────────────────────────────────┘
```

**Convergence guarantee:**
- Severity scores MÅSTE minska eller loopen terminerar
- Max 3-5 iterations (diminishing returns efter det)
- Threshold typiskt 0.85 för "production ready"

---

### Pattern C: "Capability Cascade"
**Användning:** Okänd komplexitet (agenten avgör approach)

```
                    ┌─────────────────────────────┐
                    │      COMPLEXITY PROBE       │
                    │                             │
                    │  "Försök lösa direkt först" │
                    │   (billig modell, 1 try)    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │         VALIDATOR           │
                    │   "Lyckades det? Hur bra?"  │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
         Score > 0.9          0.5 < Score < 0.9    Score < 0.5
              │                    │                    │
              ▼                    ▼                    ▼
         ┌─────────┐        ┌───────────┐        ┌───────────┐
         │  DONE   │        │  REFINE   │        │ DECOMPOSE │
         │         │        │  Pattern B │        │ Pattern A │
         └─────────┘        └───────────┘        └───────────┘
```

**Ekonomisk vinst:**
- 70% av tasks löses direkt (1 billig call)
- 25% behöver refinement (3-5 calls)
- 5% behöver full decomposition (10+ calls)
- **Average cost: ~2 calls per task**

---

## Domän-Instansiering

### Steg 1: Definiera Quality Function

```python
# APEX kräver en exekverbar quality function per domän
# Denna MÅSTE returnera float 0.0-1.0

class QualityFunction(Protocol):
    def __call__(self, output: Any, context: dict) -> float:
        """
        Returns quality score 0.0-1.0
        
        KRAV:
        - Deterministisk (samma input → samma output)
        - Snabb (< 100ms för feedback loops)
        - Granulär (inte bara pass/fail)
        """
        ...
```

### Steg 2: Definiera Invariants

```python
# Invariants är HÅRDA krav som aldrig får brytas
# Använd Pydantic för compile-time guarantees

from pydantic import BaseModel, Field, field_validator

class DomainOutput(BaseModel):
    # Structural invariants
    content: str = Field(..., min_length=100)
    
    # Semantic invariants (custom validators)
    @field_validator('content')
    @classmethod
    def no_placeholder_text(cls, v):
        forbidden = ['TODO', 'FIXME', 'Lorem ipsum', '[INSERT']
        for term in forbidden:
            if term in v:
                raise ValueError(f'Contains forbidden: {term}')
        return v
    
    # Relational invariants (cross-field)
    @model_validator(mode='after')
    def check_consistency(self):
        # Exempel: title måste reflektera content
        ...
```

### Steg 3: Konfigurera Patterns

```yaml
# apex_config.yaml

domain: "seo_content"
version: "1.0"

quality_threshold: 0.85
max_iterations: 5
parallel_generators: 3

patterns:
  primary: "capability_cascade"  # Börja billigt
  fallback_refinement: "adversarial_refinement"
  fallback_decomposition: "fractal_decomposition"

routing:
  method: "semantic"  # eller "llm" för komplexa beslut
  routes:
    - name: "simple_content"
      triggers: ["short article", "product description"]
      pattern: "direct"  # Ingen orkestrering
      
    - name: "complex_content"  
      triggers: ["pillar page", "technical guide"]
      pattern: "fractal_decomposition"
      
    - name: "precision_content"
      triggers: ["legal", "medical", "financial"]
      pattern: "adversarial_refinement"

token_budgets:
  architect: 2000
  generator: 4000
  critic: 1500
  integrator: 2000
  
models:
  architect: "claude-sonnet-4-20250514"
  generator: "claude-sonnet-4-20250514"
  critic: "claude-haiku"  # Billigare för critics
  validator: "local"  # Pydantic, inga API calls
```

---

## Konvergens-Garantier

### Matematisk grund

```
För varje APEX-instans gäller:

1. TERMINATION GUARANTEE
   ∀ execution: terminates in ≤ max_iterations
   
2. MONOTONIC IMPROVEMENT (within pattern B)
   quality(iteration[n+1]) ≥ quality(iteration[n]) - ε
   där ε är noise tolerance
   
3. INVARIANT PRESERVATION
   ∀ output: passes_validation(output) = True
   ELLER output kastas (aldrig levereras trasig)
   
4. COST BOUNDEDNESS
   total_tokens ≤ Σ(pattern_budgets) × max_iterations
```

### Failure Modes och Hantering

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| Infinite loop | iteration_count > max | Force terminate, return best |
| Quality plateau | Δquality < 0.01 for 2 rounds | Early terminate, return current |
| Divergent critics | critic_scores.std() > 0.3 | Drop outlier critics, retry |
| Token exhaustion | budget_remaining < min_call | Graceful degrade to smaller model |
| Validation failure | Pydantic raises | Retry with error in context (max 3) |

---

## Implementation Blueprint

### Core Loop (Pseudo-kod)

```python
class APEXExecutor:
    def execute(self, task: Task, config: APEXConfig) -> Result:
        # 1. ROUTE - Välj pattern baserat på task
        pattern = self.router.select_pattern(task)
        
        # 2. DIVERGE - Generera kandidater
        candidates = pattern.generate(
            task=task,
            n=config.parallel_generators,
            diversity_strategy=config.diversity
        )
        
        # 3. CONVERGE - Kombinera/välj bästa
        best = pattern.converge(
            candidates=candidates,
            strategy=config.convergence_strategy  # vote/synthesize/debate
        )
        
        # 4. VALIDATE - Kör invariant checks
        try:
            validated = config.output_schema.model_validate(best)
        except ValidationError as e:
            return self.execute_with_feedback(task, config, e)
        
        # 5. QUALITY CHECK - Kör quality function
        score = config.quality_function(validated, task.context)
        
        if score >= config.quality_threshold:
            return Result(output=validated, score=score, iterations=1)
        
        # 6. REFINE - Om under threshold, iterera
        return self.refine_loop(validated, task, config, current_score=score)
    
    def refine_loop(self, current, task, config, current_score, iteration=1):
        if iteration >= config.max_iterations:
            return Result(output=current, score=current_score, 
                         status="max_iterations_reached")
        
        # Kritik-fas
        critiques = self.critics.evaluate(current, task)
        
        # Om inga signifikanta problem, acceptera
        if critiques.max_severity < config.severity_threshold:
            return Result(output=current, score=current_score, 
                         status="converged")
        
        # Syntes-fas
        improved = self.synthesizer.improve(current, critiques, task)
        new_score = config.quality_function(improved, task.context)
        
        # Monotonic check
        if new_score <= current_score + config.epsilon:
            return Result(output=current, score=current_score,
                         status="plateau_detected")
        
        return self.refine_loop(improved, task, config, new_score, iteration+1)
```

---

## Instansierings-Exempel

### Exempel: SEO Content Generation

```python
from apex import APEXFramework, QualityFunction, DomainSchema
from pydantic import BaseModel, Field, field_validator

# 1. DEFINE OUTPUT SCHEMA
class SEOArticle(BaseModel):
    title: str = Field(..., min_length=30, max_length=70)
    meta_description: str = Field(..., min_length=120, max_length=160)
    content: str = Field(..., min_length=1500)
    headings: list[str] = Field(..., min_length=3)
    
    @field_validator('title')
    @classmethod
    def title_has_keyword(cls, v, info):
        keyword = info.context.get('primary_keyword', '')
        if keyword.lower() not in v.lower():
            raise ValueError(f'Title must contain keyword: {keyword}')
        return v
    
    @field_validator('content')
    @classmethod
    def keyword_density(cls, v, info):
        keyword = info.context.get('primary_keyword', '')
        words = v.lower().split()
        density = words.count(keyword.lower()) / len(words)
        if density < 0.01 or density > 0.03:
            raise ValueError(f'Keyword density {density:.2%} outside 1-3% range')
        return v

# 2. DEFINE QUALITY FUNCTION
def seo_quality(article: SEOArticle, context: dict) -> float:
    scores = []
    
    # Readability (Flesch-Kincaid)
    fk_score = calculate_flesch_kincaid(article.content)
    scores.append(min(1.0, fk_score / 60))  # Normalize to 0-1
    
    # Structural completeness
    has_intro = len(article.content.split('\n\n')[0]) > 100
    has_conclusion = 'sammanfattning' in article.content.lower()[-500:]
    scores.append((has_intro + has_conclusion) / 2)
    
    # Heading distribution
    content_sections = article.content.split('\n## ')
    heading_balance = 1 - (max(len(s) for s in content_sections) / 
                          sum(len(s) for s in content_sections))
    scores.append(heading_balance)
    
    # LSI term coverage
    lsi_terms = context.get('lsi_terms', [])
    covered = sum(1 for t in lsi_terms if t.lower() in article.content.lower())
    scores.append(covered / len(lsi_terms) if lsi_terms else 1.0)
    
    return sum(scores) / len(scores)

# 3. INSTANTIATE APEX
apex = APEXFramework(
    domain="seo_content",
    output_schema=SEOArticle,
    quality_function=seo_quality,
    config_path="apex_seo_config.yaml"
)

# 4. EXECUTE
result = apex.execute(
    task="Skriv en pillar page om 'hållbar renovering'",
    context={
        "primary_keyword": "hållbar renovering",
        "lsi_terms": ["energieffektivisering", "miljövänliga material", 
                      "ROI renovering", "grönt byggande"],
        "target_audience": "villaägare 35-55",
        "word_count_target": 2500
    }
)

print(f"Quality: {result.score:.2%}")
print(f"Iterations: {result.iterations}")
print(f"Status: {result.status}")
```

---

## Avancerade Mönster

### Meta-Pattern: "Evolutionary Pressure"

För tasks där du inte kan definiera quality function explicit:

```
┌─────────────────────────────────────────────────────────────┐
│                    GENERATION POOL                          │
│                                                             │
│   Gen_1 ──┬── Gen_2 ──┬── Gen_3 ──┬── ... ──┬── Gen_N      │
└───────────┼───────────┼───────────┼─────────┼───────────────┘
            │           │           │         │
            └───────────┴─────┬─────┴─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TOURNAMENT SELECTION                     │
│                                                             │
│   LLM-as-Judge: "Vilken är bäst? Varför?"                   │
│                                                             │
│   Output: Winner + Reasoning                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TRAIT EXTRACTION                         │
│                                                             │
│   "Vad gjorde vinnaren bättre?"                             │
│   Output: Explicit traits to preserve                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT GENERATION                          │
│                                                             │
│   "Generera nya varianter som behåller dessa traits         │
│    men utforskar nya dimensioner"                           │
└─────────────────────────────────────────────────────────────┘
```

### Meta-Pattern: "Constraint Tightening"

För att gradvis öka precision:

```python
def constraint_tightening_loop(task, initial_constraints, target_constraints):
    """
    Börja med lösa constraints, stram åt gradvis.
    Förhindrar att modellen "ger upp" på för svåra krav.
    """
    current_constraints = initial_constraints
    result = None
    
    while current_constraints != target_constraints:
        result = apex.execute(task, constraints=current_constraints)
        
        if result.score < 0.7:
            # Kan inte ens klara nuvarande, backa
            return result, "constraint_ceiling_reached"
        
        # Strama åt mot target
        current_constraints = tighten_constraints(
            current=current_constraints,
            target=target_constraints,
            step_size=0.1
        )
    
    return result, "target_constraints_achieved"
```

---

## Diagnostik & Observability

### Metrics att tracka

```python
@dataclass
class APEXMetrics:
    # Efficiency
    tokens_used: int
    api_calls: int
    wall_time_seconds: float
    cost_usd: float
    
    # Quality
    final_score: float
    score_trajectory: list[float]  # Per iteration
    invariant_violations: int
    
    # Convergence
    iterations_used: int
    termination_reason: str  # "converged" | "max_iter" | "plateau"
    
    # Routing
    pattern_selected: str
    route_confidence: float
```

### Anomaly Detection

```python
def detect_anomalies(metrics: APEXMetrics, historical: list[APEXMetrics]):
    alerts = []
    
    # Cost anomaly
    avg_cost = mean(m.cost_usd for m in historical)
    if metrics.cost_usd > avg_cost * 3:
        alerts.append(f"Cost 3x above average: ${metrics.cost_usd:.2f}")
    
    # Quality regression
    avg_score = mean(m.final_score for m in historical)
    if metrics.final_score < avg_score - 0.15:
        alerts.append(f"Quality 15%+ below average: {metrics.final_score:.2%}")
    
    # Convergence failure pattern
    if metrics.termination_reason == "max_iter":
        recent_max_iter = sum(1 for m in historical[-10:] 
                             if m.termination_reason == "max_iter")
        if recent_max_iter > 3:
            alerts.append("Pattern: frequent max_iter terminations")
    
    return alerts
```

---

## Nästa Steg: Från Framework till Implementation

1. **Välj din första domän** - Börja med något du kan validera manuellt
2. **Definiera 3-5 invariants** - Vad får ALDRIG vara fel?
3. **Skapa quality function** - Även en simpel heuristik är bättre än ingen
4. **Implementera Pattern C först** - Capability Cascade ger bäst ROI
5. **Mät allt** - Utan metrics kan du inte förbättra

---

*APEX Framework v1.0 - Designed for convergent excellence*

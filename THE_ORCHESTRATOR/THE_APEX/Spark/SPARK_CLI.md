# APEX-SPARK för Claude Code CLI

## Användning

```bash
claude "SPARK: vad kan vi bygga från detta repo som ingen konkurrent har?"
```

eller

```bash
claude "SPARK detta repo → verktygsidéer för SEO"
```

## Vad Claude Code gör

1. Skannar repot (`find`, `grep`)
2. Läser nyckelfilerna
3. Identifierar capabilities
4. Genererar 3 idéer

## Prompt att använda

```
SPARK-MODE: Skanna detta repo snabbt och ge mig 3 idéer för nya verktyg/features som kan byggas från befintlig kod.

Gör så här:
1. Kör: find . -name "*.py" | head -20
2. Kör: grep -r "class.*Service\|class.*:" --include="*.py" | head -30
3. Läs de mest intressanta filerna (max 3)
4. Identifiera: Vad finns? Vad saknas? Vad kan kombineras?

Output-format:
## 💡 SPARK: [repo-namn]

**Capabilities hittade:** [lista]

### 1. [Idénamn] ⚡
[En mening]
→ Bygger på: [...]
→ Unique edge: [...]

### 2-3: [samma format]

**Snabbast:** #X | **Impact:** #X

Kör nu.
```

## One-liner versioner

### Snabbskanna + idéer
```bash
claude "Skanna detta repo (find *.py, grep class.*Service), identifiera capabilities, ge 3 unika verktygsidéer. Format: namn + bygger på + unique edge."
```

### Med domän-hint
```bash
claude "SPARK SEO-verktyg från detta repo. Skanna, identifiera services, ge 3 idéer ingen konkurrent har."
```

### Multi-repo (om du har flera)
```bash
claude "Jämför ./repo-a och ./repo-b. SPARK: vad kan byggas genom att kombinera kod från båda?"
```

## Tips för bästa resultat

1. **Var i rätt mapp** – `cd` till repot först
2. **Ge domän-hint** – "SEO", "DevOps", etc. hjälper
3. **Specificera output-typ** – "verktyg", "API", "dashboard"
4. **Be om implementation-hint** – "och hur skulle vi börja bygga #1?"

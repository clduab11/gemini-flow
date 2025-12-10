# ARCHEOLOGIST JOB PROMPTS
# Använd dessa som user message EFTER systemprompt är satt

---

## Job 1: Konsolidera allt i en mapp

```
ARCHEOLOGIST CONSOLIDATE: .

Skanna hela detta repo och:
1. Hitta alla bootstrap/setup/orchestration-filer
2. Identifiera konflikter (samma fil skapas av flera)
3. Generera en master_bootstrap.py som inkluderar allt
```

---

## Job 2: Syntetisera nya verktyg

```
ARCHEOLOGIST SYNTHESIZE: .

Analysera alla Python-services i detta repo och:
1. Extrahera capabilities (vad gör varje service?)
2. Identifiera rekombinationer (vad kan byggas genom att kombinera?)
3. Generera synthesis_bootstrap.py med nya verktyg
```

---

## Job 3: Full körning

```
ARCHEOLOGIST FULL: .

Kör både CONSOLIDATE och SYNTHESIZE:
1. Konsolidera befintliga bootstraps
2. Analysera capabilities
3. Föreslå och generera nya verktyg

Output:
- master_bootstrap.py
- synthesis_bootstrap.py
- capability_map.json
```

---

## Job 4: Specifik mapp

```
ARCHEOLOGIST SYNTHESIZE: ./services/seo

Fokusera endast på SEO-relaterade services och föreslå:
- Nya verktyg som kan byggas
- Hur de wirar ihop befintliga moduler
```

---

## Job 5: Med constraints

```
ARCHEOLOGIST SYNTHESIZE: .

Constraints:
- Endast använda async-kompatibla services
- Max 3 dependencies per nytt verktyg
- Fokus på compliance/risk-relaterade kombinationer
```

---

## Job 6: Investigera först

```
Innan du kör ARCHEOLOGIST, visa mig:
1. Vilka bootstrap-filer finns?
2. Vilka Python-moduler med services finns?
3. Vilka potentiella konflikter ser du?

Sedan kan jag välja vad du ska göra.
```

---

# ANVÄNDNING I CLAUDE CLI

## Metod 1: Två separata anrop

```bash
# Sätt systemprompt (om CLI stödjer det)
export CLAUDE_SYSTEM="$(cat archeologist_system.md)"

# Kör job
claude "ARCHEOLOGIST SYNTHESIZE: /path/to/repo"
```

## Metod 2: Allt i ett

```bash
claude "
$(cat archeologist_system.md)

---

ARCHEOLOGIST SYNTHESIZE: /path/to/repo
"
```

## Metod 3: I befintlig session

Om du redan har en Claude Code session i repot:

```
Jag vill att du agerar som APEX-ARCHEOLOGIST. 
Läs filen archeologist_system.md för instruktioner.
Sedan: ARCHEOLOGIST SYNTHESIZE: .
```

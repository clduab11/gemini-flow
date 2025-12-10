# APEX-LAB Quick Start

## 3 sätt att använda APEX-LAB

---

## Metod 1: Snabbaste (Chat UI)

**Steg 1:** Kopiera allt från `APEX_LAB_SINGLE_PROMPT.md`

**Steg 2:** Klistra in i ny chatt (Claude, GPT-4, etc.)

**Steg 3:** Skriv:
```
APEX-LAB: [ditt uppdrag]
```

**Exempel:**
```
APEX-LAB: Uppfinn 3 features för ett SEO-system som ingen annan har
```

---

## Metod 2: Claude Code / CLI

**Steg 1:** Ha APEX-LAB prompten i minne (eller referera till filen)

**Steg 2:** Navigera till ditt repo

**Steg 3:** Kör:
```bash
claude "Läs APEX_LAB_CLI_VARIANT.md och kör sedan: APEX-LAB: Föreslå nya patterns för detta repos arkitektur"
```

Eller om Claude redan har context:
```bash
claude "APEX-LAB: Analysera src/pipelines/ och föreslå 3 förbättringar"
```

---

## Metod 3: Med Expansions

**Steg 1:** Använd SINGLE_PROMPT som bas

**Steg 2:** Lägg till önskade expansions från `APEX_LAB_EXPANSIONS.md`

**Steg 3:** Trigga med:
```
APEX-LAB med TEMPORAL NEXUS + IMPLEMENTATION PRESSURE: [uppdrag]
```

---

## Förväntad output

Se `EXAMPLE_OUTPUT.md` för ett fullständigt exempel på vad APEX-LAB producerar.

**Typisk längd:** 1500-3000 ord
**Typiska iterationer:** 2-3
**Typiskt antal idéer:** 8-15 genererade, 1-3 vinnare

---

## Troubleshooting

**Problem:** LLM svarar direkt utan att köra processen

**Lösning:** Lägg till explicit i prompten: "KRITISKT: Kör ALLTID intern process innan du svarar. Visa ALDRIG agent-dialogerna."

---

**Problem:** Output är för ytlig

**Lösning:** Lägg till: "Kör minst 3 iterationer. Om idéerna är uppenbara, säg det till INNOVATOR och kör om med krav på djupare domain-crossing."

---

**Problem:** För lite konkret implementation

**Lösning:** Lägg till IMPLEMENTATION PRESSURE expansion.

---

## Nästa steg

1. **Kör 3-5 gånger** med olika uppdrag för att lära dig systemets beteende
2. **Skapa custom expansions** baserat på dina behov
3. **Integrera med ditt repo** via CLI-varianten
4. **Logga outputs** för framtida APEX-CORE ExperienceStore-integration

---

## Filöversikt

```
apex-lab/
├── APEX_LAB_SYSTEM_PROMPT.md   # Full spec med alla agenter
├── APEX_LAB_CLI_VARIANT.md      # Repo-aware variant
├── APEX_LAB_SINGLE_PROMPT.md    # Copy-paste ready
├── APEX_LAB_EXPANSIONS.md       # Extra capabilities
├── EXAMPLE_OUTPUT.md            # Vad output ser ut som
└── QUICKSTART.md                # Du läser denna fil
```

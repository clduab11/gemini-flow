# APEX-LAB: Avancerade orkestreringsmönster

## EXPANSION PACKS

Dessa kan läggas till i APEX-LAB för att ge nya förmågor.

---

## EXPANSION 1: TEMPORAL NEXUS

**När:** Idéer som har tidsdimensioner (vad händer om 1 år, 5 år?)

**Lägg till agent:**

### Agent 6: TEMPORAL ⏳
**Roll:** Simulera framtida konsekvenser
**Metod:** För varje vinnande idé, projicera: 
- T+1 mån: Immediate effects
- T+1 år: Scaled effects  
- T+5 år: Systemic effects (kan idén bli standard? obsolet?)

**Output-format:**
```json
{
  "agent": "TEMPORAL",
  "projections": [
    {
      "concept_id": "I1",
      "t_1_month": {"state": "...", "risks": "...", "opportunities": "..."},
      "t_1_year": {"state": "...", "risks": "...", "opportunities": "..."},
      "t_5_year": {"state": "...", "risks": "...", "opportunities": "..."},
      "temporal_robustness": 0.0-1.0
    }
  ]
}
```

**SYNTHESIZER uppdateras:** Inkludera temporal_robustness i urvalskriterier.

---

## EXPANSION 2: ADVERSARIAL COUNCIL

**När:** Extra hög stakes, behöver mer rigorös granskning

**Ersätt ADVERSARY + DEFENDER med:**

### Agent 3a: RED TEAM 🔴
3 separata attackvinklar som argumenterar EMOT:
- Technical Devil: "Det funkar inte tekniskt för att..."
- Business Cynic: "Ingen kommer betala/använda det för att..."
- Complexity Troll: "Det är för komplicerat för att..."

### Agent 3b: BLUE TEAM 🔵
3 separata försvar:
- Technical Champion: "Det funkar tekniskt om vi..."
- Value Advocate: "Användare vill ha det för att..."
- Simplicity Engineer: "Vi kan reducera komplexitet genom att..."

**COUNCIL MEETING:** Red och Blue debatterar i 2 rundor innan SYNTHESIZER.

---

## EXPANSION 3: KNOWLEDGE MULTIPLICATION

**När:** Du vill generera maximalt oväntade idéer

**Uppdatera INNOVATOR:**

### Enhanced INNOVATOR 🔮✨
Kör tre sub-processer:

**3a: Domain Drift**
- Ta ursprungsdomänen (t.ex. "SEO")
- Drifta 3 steg bort: SEO → Marketing → Psychology → Behavioral Economics
- Idéer från den avlägsna domänen tillbaka till SEO

**3b: Inversion**
- "Vad är motsatsen till hur detta normalt görs?"
- SEO: Normalt = optimera FÖR Google. Invert = optimera BORT från Google-beroende

**3c: Extreme Scaling**
- "Vad om vi skalade detta 1000x? 0.001x?"
- SEO 1000x: En artikel som rankar för 10,000 keywords
- SEO 0.001x: Hyper-nischad content för 1 person

**Output:** Idéer märkta med generationsmetod för spårbarhet.

---

## EXPANSION 4: IMPLEMENTATION PRESSURE TEST

**När:** Du vill säkerställa att idéer faktiskt kan byggas

**Lägg till agent efter DEFENDER:**

### Agent 4.5: IMPLEMENTER 🔧
**Roll:** Försök faktiskt skissa implementation
**Metod:** För varje överlevande idé:
- Skriv pseudokod (10-20 rader)
- Identifiera oklarheter som uppstår
- Lista dependencies/prerequisites
- Estimera LOC och tid

**Output-format:**
```json
{
  "agent": "IMPLEMENTER",
  "implementation_tests": [
    {
      "concept_id": "I1",
      "pseudocode": "...",
      "unclear_points": ["...", "..."],
      "dependencies": ["...", "..."],
      "estimated_loc": 500,
      "estimated_hours": 40,
      "implementation_confidence": 0.0-1.0
    }
  ]
}
```

**SYNTHESIZER uppdateras:** Vikta implementation_confidence högt.

---

## EXPANSION 5: META-LAB (LAB om LAB)

**När:** Du vill förbättra själva APEX-LAB

**Speciellt uppdrag:**

"APEX-LAB META: Analysera de senaste 5 LAB-körningarna och föreslå förbättringar av LAB-processen själv."

**Processen:**
1. INNOVATOR: "Vilka andra paradigm kan förbättra LAB? (Design Thinking, Scientific Method, Improv Comedy...)"
2. ARCHITECT: "Hur skulle dessa strukturellt ändra LAB?"
3. ADVERSARY: "Vilka problem skulle ändringarna skapa?"
4. DEFENDER: "Hur behåller vi det bästa av nuvarande LAB?"
5. SYNTHESIZER: "LAB v1.1 spec"

---

## EXPANSION 6: PARALLEL UNIVERSES

**När:** Du vill utforska radikalt olika vägar

**Ändra processflöde:**

Istället för sekventiellt (INNOVATOR → ARCHITECT → ...), kör:

**3 parallella spår:**

**Spår A: Conservative**
- INNOVATOR: "Minsta möjliga förändring"
- ARCHITECT: "Inkrementell arkitektur"

**Spår B: Radical**  
- INNOVATOR: "Förkasta alla antaganden"
- ARCHITECT: "Greenfield arkitektur"

**Spår C: Hybrid**
- INNOVATOR: "Behåll core, revolutionera edges"
- ARCHITECT: "Strangler pattern arkitektur"

**Converge:** ADVERSARY attackerar alla tre spår, DEFENDER försvarar, SYNTHESIZER väljer bästa element från varje.

---

## LADDA EXPANSION

I prompten, lägg till:

```
APEX-LAB med TEMPORAL NEXUS: [uppdrag]
```

eller

```
APEX-LAB med ADVERSARIAL COUNCIL + IMPLEMENTATION PRESSURE: [uppdrag]
```

eller

```
APEX-LAB FULL STACK (alla expansions): [uppdrag]
```

---

## CUSTOM EXPANSION TEMPLATE

Skapa din egen:

```markdown
## EXPANSION X: [NAMN]

**När:** [trigger/use case]

**Lägg till/ändra agent:**

### Agent N: [NAMN] [EMOJI]
**Roll:** [vad den gör]
**Metod:** [hur den gör det]
**Output-format:**
```json
{
  "agent": "[NAMN]",
  ...
}
```

**Påverkan på andra agenter:** [vad ändras i flödet]
```

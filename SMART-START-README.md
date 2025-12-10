# 🧠 SMART START - Intelligent System Activation

## Översikt

Systemet har nu **flera intelligenta startlägen** som automatiskt anpassar sig till din miljö:

## 🚀 Startfiler

### 1. `standby.bat` - **REKOMMENDERAD**
```cmd
standby.bat
```
- **Minimal resursanvändning** - väntar tyst i bakgrunden
- **Aktiveras direkt** vid första user prompt
- **Ingen konfiguration** behövs
- Perfekt för CLI-agenter

### 2. `smart-start.bat` - **Intelligent Auto-Detection**
```cmd
smart-start.bat
```
- **Känner av miljön** automatiskt
- Om Claude Code/Gemini CLI: Kör utan API-nycklar
- Om API-nycklar finns: Erbjuder val av läge
- Väljer optimal konfiguration

### 3. `orchestrate.py` - **Direct CLI Execution**
```python
python orchestrate.py "din kommando här"
```
- **Kör direkt** från CLI
- **Ingen server** behövs
- Perfekt för one-off kommandon

## 🎯 Hur det fungerar UTAN API-nycklar

### I Claude Code:
1. Systemet känner av att det körs i Claude Code
2. Använder **Claude's inbyggda kapaciteter** istället för externa API:er
3. Du behöver INTE någon ANTHROPIC_API_KEY
4. Claude Code ÄR själva AI-motorn

### I Gemini CLI:
1. Känner av Gemini-miljön
2. Använder Gemini's native processing
3. Ingen GEMINI_API_KEY behövs
4. Gemini CLI processar direkt

## 📋 Användningsexempel

### Scenario 1: Quick Standby
```cmd
standby.bat
```
Sedan bara skriv något som:
```
"analyze competitor website example.com"
```
Orchestrator aktiveras automatiskt!

### Scenario 2: Smart Auto-Mode
```cmd
smart-start.bat
```
Väljer automatiskt rätt läge baserat på miljö.

### Scenario 3: Direct Command
```cmd
python orchestrate.py "create SEO campaign for my website"
```
Kör direkt utan att starta något annat.

## 🔄 Workflow när CLI-agent kör

1. **CLI-agent startar fil** → `standby.bat`
2. **System går i standby** → Väntar tyst
3. **User skriver prompt** → "optimize my content"
4. **Orchestrator aktiveras** → Analyserar intent
5. **Workflow genereras** → Skapar agent-hierarki
6. **CLI processar native** → Claude/Gemini kör direkt
7. **Resultat returneras** → Ingen extern API använd!

## ⚡ Snabbkommandon för CLI-agenter

### För Claude Code:
```python
# Kör detta direkt i Claude Code
exec(open('orchestrate.py').read())
# Nu kan du bara skriva kommandon
```

### För vanlig terminal:
```bash
# Alias för snabb åtkomst
alias orch='python orchestrate.py'
# Sedan: orch "din kommando"
```

## 🎨 Arkitektur

```
User Prompt
    ↓
CLI Detection (Claude/Gemini/Standard)
    ↓
┌─────────────────────────┐
│  If CLI Environment:    │
│  → Use Native Processing│
│  → No API Keys Needed   │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│  If Standard:           │
│  → Check for API Keys   │
│  → Use External APIs    │
└─────────────────────────┘
    ↓
Execute Orchestration
```

## 🔧 Miljövariabler (VALFRIA)

Om du VILL använda externa API:er:
```env
GEMINI_API_KEY=xxx     # För Gemini API
ANTHROPIC_API_KEY=xxx  # För Claude API
```

Men de är **INTE obligatoriska** i CLI-läge!

## 💡 Tips

1. **För daglig användning**: Kör `standby.bat` en gång på morgonen
2. **För testing**: Använd `smart-start.bat` för att se olika lägen
3. **För automation**: Integrera `orchestrate.py` i dina scripts

## 🚫 Vad du INTE behöver göra

- ❌ Konfigurera API-nycklar (i CLI-läge)
- ❌ Starta flera servrar
- ❌ Vänta på initialization
- ❌ Manuellt välja orchestration pattern

Allt sker **automatiskt** baserat på din prompt!

## 🎯 Exempel på kommandon som fungerar direkt

```
"analyze SEO for example.com"
→ Startar SEO Intelligence workflow

"create backlink campaign"
→ Aktiverar BACOWR platform

"optimize my content for search"
→ Kör Content Optimizer

"analyze competitor strategies"
→ Startar Competitor Intelligence

"orchestrate multi-agent analysis"
→ Aktiverar SOVEREIGN hierarchy
```

---

**TL;DR**: Kör `standby.bat`, sedan bara skriv vad du vill göra. Systemet fixar resten! 🚀
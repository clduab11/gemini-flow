# 🚀 QUICKSTART - KÖR SYSTEMET PÅ 2 MINUTER

## Steg 1: Installera anthropic
```bash
pip install anthropic
```

## Steg 2: Sätt din API-nyckel
```bash
# Mac/Linux:
export ANTHROPIC_API_KEY='sk-ant-...'

# Windows PowerShell:
$env:ANTHROPIC_API_KEY='sk-ant-...'

# Windows CMD:
set ANTHROPIC_API_KEY=sk-ant-...
```

## Steg 3: Kör
```bash
cd SOVEREIGN_AGENTS
python 06_LIVING/run.py
```

---

## 🎮 NÄR DET KÖRS

```
You: hej!
Sovereign: Hej! Jag är the Sovereign...

You: /explore AI-agenter
🔭 Starting exploration...
[Agenten börjar utforska autonomt]

You: /multi Skriv en artikel om SEO
🤖 Multi-agent execution...
[Architect → Executor → Critic arbetar i sekvens]
```

---

## 🔑 SKAFFA API-NYCKEL

1. Gå till https://console.anthropic.com/
2. Skapa konto / logga in
3. Settings → API Keys → Create Key
4. Kopiera nyckeln (börjar med `sk-ant-`)

---

## ⚠️ TROUBLESHOOTING

**"anthropic package not installed"**
```bash
pip install anthropic
```

**"ANTHROPIC_API_KEY not set"**
```bash
export ANTHROPIC_API_KEY='din-nyckel'
```

**Körs i PyCharm?**
- Högerklicka på `06_LIVING/run.py` → Run
- Eller: Terminal → `python 06_LIVING/run.py`

---

Det är allt! 🎯

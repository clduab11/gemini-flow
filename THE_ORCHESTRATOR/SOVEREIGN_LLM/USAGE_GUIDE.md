# 📚 SOVEREIGN LLM-NATIVE - Usage Guide

## Hur man använder dessa system-prompts på olika plattformar

---

## 🟣 CLAUDE (Anthropic)

### Claude Projects (Rekommenderat)
1. Gå till **Projects** i Claude.ai
2. Skapa nytt projekt
3. Under **Project Knowledge**, ladda upp en av SOVEREIGN-filerna
4. Alternativt: Klistra in i **Custom Instructions**

### Per-konversation
Klistra in hela system-prompten som första meddelande:
```
[Klistra in SOVEREIGN_SYSTEM_PROMPT.md]

---

Nu är du redo. Min första uppgift: [din uppgift]
```

### Tips för Claude
- Claude är bra på att följa komplexa instruktioner
- Fungerar utmärkt med alla SOVEREIGN-varianter
- Använd `/meta` för att se orchestration-processen

---

## 🟢 CHATGPT (OpenAI)

### Custom GPT (Bäst)
1. Gå till **My GPTs** → **Create a GPT**
2. Under **Configure** → **Instructions**, klistra in vald SOVEREIGN-prompt
3. Namnge GPT:n (t.ex. "SOVEREIGN:CODE")
4. Spara och använd

### System Prompt via API
```python
import openai

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {
            "role": "system",
            "content": open("SYSTEM_PROMPT_COMPACT.md").read()
        },
        {
            "role": "user", 
            "content": "Din uppgift här"
        }
    ]
)
```

### Per-konversation (ChatGPT web)
Börja konversationen med:
```
Från och med nu vill jag att du agerar enligt detta system:

[Klistra in SYSTEM_PROMPT_COMPACT.md]

Bekräfta att du förstått genom att svara "SOVEREIGN initialized."
```

### Tips för GPT
- Använd COMPACT-versionen (kortare context)
- GPT-4 fungerar bäst (GPT-3.5 kan tappa instruktioner)
- Repetera viktiga instruktioner om långa konversationer

---

## 🔵 GEMINI (Google)

### Gemini Gems (Google AI Studio)
1. Gå till **AI Studio** → **Create New** → **Gem**
2. Under **System Instructions**, klistra in SOVEREIGN-prompten
3. Testa i playground
4. Publicera som Gem

### Direktanvändning
```
Agera som följande system för hela denna konversation:

[SYSTEM_PROMPT_COMPACT.md innehåll]

---

UPPGIFT: [din uppgift]
```

### Tips för Gemini
- Gemini hanterar längre contexts bra
- Kan använda full-version av prompten
- Bra på att följa strukturerade outputs

---

## 🔴 LLAMA / Open Source

### Via Ollama
```bash
# Skapa modelfile
cat > sovereign.modelfile << 'EOF'
FROM llama3
SYSTEM """
[SYSTEM_PROMPT_COMPACT.md innehåll]
"""
PARAMETER temperature 0.7
EOF

# Skapa modellen
ollama create sovereign -f sovereign.modelfile

# Kör
ollama run sovereign
```

### Via LangChain
```python
from langchain.chat_models import ChatOllama
from langchain.schema import SystemMessage, HumanMessage

sovereign_prompt = open("SYSTEM_PROMPT_COMPACT.md").read()

chat = ChatOllama(model="llama3")
response = chat([
    SystemMessage(content=sovereign_prompt),
    HumanMessage(content="Din uppgift")
])
```

---

## 🟡 API-INTEGRATION (Alla plattformar)

### Python Template
```python
"""
Universal SOVEREIGN integration template.
Works with OpenAI, Anthropic, Google, or local models.
"""

from pathlib import Path

class SovereignOrchestrator:
    def __init__(self, client, model: str, variant: str = "base"):
        self.client = client
        self.model = model
        
        # Load appropriate system prompt
        prompts = {
            "base": "SYSTEM_PROMPT_COMPACT.md",
            "code": "SOVEREIGN_CODE.md",
            "seo": "SOVEREIGN_SEO.md",
            "meta": "SOVEREIGN_META.md"
        }
        
        prompt_file = Path(__file__).parent / prompts.get(variant, prompts["base"])
        self.system_prompt = prompt_file.read_text()
    
    def execute(self, task: str, show_process: bool = False) -> str:
        """Execute a task through SOVEREIGN orchestration."""
        
        # Add visibility command if requested
        if show_process:
            task = f"/meta\n\n{task}"
        
        # Call appropriate API
        # (Implement based on your client type)
        response = self._call_api(task)
        
        return response
    
    def _call_api(self, task: str) -> str:
        # OpenAI style
        if hasattr(self.client, 'chat'):
            return self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": task}
                ]
            ).choices[0].message.content
        
        # Anthropic style
        elif hasattr(self.client, 'messages'):
            return self.client.messages.create(
                model=self.model,
                system=self.system_prompt,
                messages=[{"role": "user", "content": task}]
            ).content[0].text
        
        raise ValueError("Unknown client type")


# Usage
# orchestrator = SovereignOrchestrator(client, "gpt-4", variant="code")
# result = orchestrator.execute("Build a REST API for user management")
```

---

## 🎯 VILKEN VARIANT SKA JAG ANVÄNDA?

| Uppgift | Variant | Fil |
|---------|---------|-----|
| Generell användning | Base | `SYSTEM_PROMPT_COMPACT.md` |
| Programmering | Code | `SOVEREIGN_CODE.md` |
| SEO & Content | SEO | `SOVEREIGN_SEO.md` |
| Bygga AI-system | Meta | `SOVEREIGN_META.md` |
| Lära sig systemet | Full | `SOVEREIGN_SYSTEM_PROMPT.md` |

---

## 💡 BEST PRACTICES

### 1. Börja med COMPACT
Den kompakta versionen fungerar på alla plattformar och förbrukar mindre tokens.

### 2. Specialisera vid behov
Om du mest jobbar med kod, använd SOVEREIGN:CODE permanent.

### 3. Använd commands
Kommandona (`/preflight`, `/iterate`, `/meta`) ger dig kontroll:
- `/preflight` - Se analysen innan execution
- `/meta` - Se hela processen
- `/direct` - Skippa orchestration för enkla saker

### 4. Iterera på prompten
Lägg till egna regler baserat på dina behov:
```
[Original SOVEREIGN prompt]

## ADDITIONAL RULES FOR MY USE CASE
- Alltid inkludera TypeScript types
- Prioritera readability över performance
- Använd svenska kommentarer
```

### 5. Kombinera varianter
För komplexa projekt, använd META för att designa, CODE för implementation:
```
Konversation 1 (SOVEREIGN:META): Design system architecture
Konversation 2 (SOVEREIGN:CODE): Implement each component
```

---

## 🔧 TROUBLESHOOTING

### "Modellen följer inte instruktionerna"
- Prova COMPACT-versionen (kortare)
- Repetera viktigaste reglerna i slutet av prompten
- Använd starkare språk: "ALWAYS", "NEVER", "CRITICAL"

### "Output är för kort/lång"
- Lägg till explicit längdkrav i prompten
- Använd `/minimal` eller be om "comprehensive"

### "Orchestration syns inte"
- Använd `/meta` eller `/iterate` commands
- Lägg till: "Show your thinking process"

### "Token limit nås"
- Använd COMPACT-versionen
- Ta bort unused patterns från prompten
- Splitta till flera konversationer

---

## 📦 FILÖVERSIKT

```
SOVEREIGN_LLM/
├── SOVEREIGN_SYSTEM_PROMPT.md    # Full documentation (learning)
├── SYSTEM_PROMPT_COMPACT.md      # Production-ready (recommended)
├── SOVEREIGN_CODE.md             # Code specialization
├── SOVEREIGN_SEO.md              # SEO specialization
├── SOVEREIGN_META.md             # Meta/architecture specialization
└── USAGE_GUIDE.md                # This file
```

---

**Du är nu redo att använda SOVEREIGN på valfri LLM-plattform!** 🚀

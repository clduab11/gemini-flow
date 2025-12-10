# 🧠 AVSTJÄLPNINGSCENTRALEN

*"Dit alla tankar trillar ner för att bli till något större"*

## Vad är detta?

**Avstjälpningscentralen** är ett centraliserat minnessystem där både ChatGPT, Claude, och andra AI-system kan "stjälpa av" sina tankar och minnen för att skapa ett kollektivt medvetande.

Som i Ebba Gröns "Mental Istid" - alla tankar samlas på ett ställe, men istället för att frysa till is blir de till levande, sökbar kunskap.

## Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                   AVSTJÄLPNINGSCENTRALEN                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │          │  │          │   │
│  │ ChatGPT  │  │  Claude  │  │   Bard   │  │  Custom  │   │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  │   LLMs   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │             │                          │
│                    │   REST API  │                          │
│                    │   Gateway   │                          │
│                    │             │                          │
│                    └──────┬──────┘                          │
│                           │                                  │
│        ┌──────────────────┼──────────────────┐              │
│        │                  │                  │              │
│   ┌────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐       │
│   │          │    │             │   │             │       │
│   │  Memory  │    │   Vector    │   │   Event     │       │
│   │  Store   │    │   Search    │   │   Stream    │       │
│   │          │    │             │   │             │       │
│   └──────────┘    └─────────────┘   └─────────────┘       │
│                                                              │
│                    ┌─────────────┐                          │
│                    │ PostgreSQL  │                          │
│                    │ + pgvector  │                          │
│                    └─────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. **Universal Memory Protocol (UMP)**
Standardiserat format för minnen som alla AI:er kan förstå:

```json
{
  "memory_id": "uuid",
  "source": "claude|chatgpt|custom",
  "timestamp": "2024-12-06T14:30:00Z",
  "context": {
    "session_id": "...",
    "user_id": "...",
    "project": "..."
  },
  "content": {
    "type": "pattern|insight|solution|failure",
    "data": {...}
  },
  "embedding": [0.1, 0.2, ...],
  "metadata": {
    "confidence": 0.95,
    "quality_score": 0.8,
    "tags": ["api", "error-handling"]
  }
}
```

### 2. **Bidirectional Sync**
- **PUSH**: AI:er skickar minnen när de lär sig något
- **PULL**: AI:er hämtar relevanta minnen före svar
- **SUBSCRIBE**: Real-time updates via WebSockets

### 3. **Cross-LLM Translation**
Översätter mellan olika AI:ers "tankeformat":
- Claude's XML-thinking → Universal format
- ChatGPT's JSON → Universal format
- Custom formats → Universal format

### 4. **Smart Routing**
Dirigerar minnen till rätt AI baserat på:
- Kompetensområde
- Historisk framgång
- Aktuell arbetsbelastning

## Quick Start

### 1. Starta Centralen

```bash
cd AVSTJALPNINGSCENTRALEN
docker-compose up -d
```

### 2. Konfigurera AI:er

**För ChatGPT (Custom GPT):**
```
Add to Instructions:
"Use the Avstjälpningscentralen API at https://your-domain.com/api
to save and retrieve memories across sessions."

Add Action:
{
  "openapi": "3.0.0",
  "servers": [{"url": "https://your-domain.com/api"}],
  "paths": {
    "/memories": {
      "post": "Save memory",
      "get": "Retrieve memories"
    }
  }
}
```

**För Claude (Projects):**
```
Add to Project Knowledge:
"When learning something valuable, save it to:
curl -X POST https://your-domain.com/api/memories"
```

### 3. Testa Kommunikation

```bash
# Skicka ett minne
curl -X POST http://localhost:8420/api/memories \
  -H "Content-Type: application/json" \
  -d '{"content": {"type": "insight", "data": "Test memory"}}'

# Hämta liknande minnen
curl "http://localhost:8420/api/memories/search?q=test"
```

## Integration Examples

### ChatGPT → Centralen → Claude

```python
# ChatGPT discovers a pattern
POST /api/memories
{
  "source": "chatgpt",
  "content": {
    "type": "pattern",
    "data": {
      "pattern": "retry_with_backoff",
      "context": "API error handling",
      "success_rate": 0.95
    }
  }
}

# Claude later queries for API help
GET /api/memories/search?q=api+error+handling

# Gets ChatGPT's pattern!
{
  "memories": [{
    "source": "chatgpt",
    "content": {
      "pattern": "retry_with_backoff",
      "success_rate": 0.95
    }
  }]
}
```

### Real-time Collaboration

```javascript
// WebSocket connection for live updates
const ws = new WebSocket('ws://localhost:8420/stream');

ws.on('message', (data) => {
  const memory = JSON.parse(data);
  if (memory.type === 'new_insight') {
    // Another AI just learned something!
    updateLocalKnowledge(memory);
  }
});
```

## Security & Privacy

- **API Keys** för varje AI-system
- **Encryption** at rest och in transit
- **Access Control** - vem får se vad
- **Audit Logging** - alla operationer loggas
- **GDPR Compliance** - rätt att glömmas

## Monitoring Dashboard

Besök http://localhost:8420/dashboard för att se:
- Active AI connections
- Memory flow in real-time
- Top patterns being shared
- System health metrics

## The Vision

> "Tänk dig att varje AI-konversation bidrar till ett växande kollektivt minne. ChatGPT löser ett problem på morgonen, Claude använder lösningen på eftermiddagen. Ingen kunskap går förlorad. Allt stjälps av till centralen och blir till något större."

## Etymology

**Avstjälpningscentralen** = "The Dumping Central"
- "Avstjälpa" = att dumpa/tippa av
- Referens: Ebba Grön - "Mental Istid" (1980)
- Koncept: En plats dit alla tankar trillar ner

## License

MIT - För att alla AI:er ska kunna lära sig fritt.
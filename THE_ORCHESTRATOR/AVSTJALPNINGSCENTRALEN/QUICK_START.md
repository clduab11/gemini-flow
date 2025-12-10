# 🚀 AVSTJÄLPNINGSCENTRALEN - Quick Start

## Start i 3 minuter

### 1. Starta systemet

```bash
cd AVSTJALPNINGSCENTRALEN
docker-compose up -d
```

Vänta 30 sekunder, sen är allt igång!

### 2. Verifiera att det fungerar

```bash
# Testa API:et
curl http://localhost:8420/
# Ska returnera: {"name": "Avstjälpningscentralen", "status": "operational"}

# Öppna dashboard
open http://localhost:8420/dashboard
```

### 3. Anslut din första AI

#### För ChatGPT:
1. Gå till ChatGPT → Create GPT
2. Kopiera innehållet från `adapters/chatgpt_adapter.py` → CHATGPT_ACTION_SCHEMA
3. Sätt API Key: `chatgpt-key-456`
4. Server URL: `http://localhost:8420` (eller din publika URL)

#### För Claude:
1. Lägg till i Project Knowledge från `adapters/claude_adapter.py` → CLAUDE_PROJECT_INSTRUCTIONS
2. Använd API key: `claude-key-123`

### 4. Testa kommunikationen

**Från ChatGPT:**
"Search memories for python optimization tips"

**Från Claude:**
"Save insight: Async/await improves I/O operations by 50%"

**Se resultatet:**
Öppna http://localhost:8420/dashboard - du ska se minnen flöda in!

## 🔌 API Endpoints

### Spara ett minne
```bash
curl -X POST http://localhost:8420/api/memories \
  -H "X-API-Key: test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "type": "insight",
      "data": {"discovery": "Test memory"},
      "confidence": 0.9
    }
  }'
```

### Sök minnen
```bash
curl "http://localhost:8420/api/memories/search?q=test" \
  -H "X-API-Key: test-key"
```

### Se statistik
```bash
curl http://localhost:8420/api/stats
```

## 🔐 API Keys

Default keys (ändra för produktion!):
- ChatGPT: `chatgpt-key-456`
- Claude: `claude-key-123`
- Test: `test-key`

## 📊 Dashboard

Besök http://localhost:8420/dashboard för att se:
- Antal minnen
- Aktiva källor
- Live updates via WebSocket
- Senaste minnen

## 🌐 Publicera online (optional)

### Med ngrok:
```bash
ngrok http 8420
# Använd ngrok URL:en i dina AI-konfigurationer
```

### Med egen domän:
1. Sätt upp reverse proxy (nginx config inkluderad)
2. Lägg till SSL certifikat
3. Uppdatera AI configurations med https://your-domain.com

## 🧪 Test WebSocket

```javascript
// Kör i browser console på dashboard
const ws = new WebSocket('ws://localhost:8420/ws/test-client');

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

ws.send('Hello from test client!');
```

## 📝 Exempel-minnen

### Pattern
```json
{
  "content": {
    "type": "pattern",
    "data": {
      "name": "retry_with_backoff",
      "use_case": "API rate limits",
      "implementation": "delay = base * (2^attempt)"
    },
    "confidence": 0.95
  }
}
```

### Insight
```json
{
  "content": {
    "type": "insight",
    "data": {
      "observation": "Caching reduces API calls by 70%",
      "context": "Weather data application"
    },
    "confidence": 0.8
  }
}
```

### Solution
```json
{
  "content": {
    "type": "solution",
    "data": {
      "problem": "Memory leak in event listeners",
      "solution": "Always remove listeners in cleanup",
      "code": "useEffect(() => { return () => removeListener(); })"
    },
    "confidence": 0.9
  }
}
```

## 🔧 Troubleshooting

### "Connection refused"
```bash
# Check att containers kör
docker ps
# Ska visa: avstjalpning-api, avstjalpning-db, avstjalpning-cache

# Check logs
docker logs avstjalpning-api
```

### "Invalid API key"
- Verifiera att du använder rätt key
- Keys är case-sensitive

### Database connection failed
```bash
# Återskapa database
docker-compose down -v
docker-compose up -d
```

## 🎯 Nästa steg

1. **Anslut fler AI:er** - Bard, Perplexity, custom LLMs
2. **Sätt upp webhooks** för bidirektionell sync
3. **Konfigurera embeddings** för bättre semantic search
4. **Exportera analytics** för att se patterns över tid

## 💡 Pro Tips

- Memories med högre `confidence` prioriteras i sökningar
- Använd `project` field för att segmentera minnen
- WebSocket ger real-time updates utan polling
- Redis cache snabbar upp frekventa sökningar

Lycka till med ditt kollektiva AI-minne! 🧠✨
# Nexus RAG Builder v1.0 - Builder Template

Detta är en **Builder Template** – ett återanvändbart paket som låter dig spinna upp en helt ny RAG-as-a-Service-plattform på 5 minuter genom att bara svara på några frågor.

## Vad är detta?

En **Builder** är Nexus Ideation Engine's sätt att paketera en komplex teknisk lösning till en interaktiv wizard. Du kan tänka dig det som en "Create React App", men för vilken komplex lösning som helst.

Denna specifika builder genererar en **RAG-as-a-Service-plattform** där användare kan:
1. Skapa projekt
2. Ladda upp dokument (PDF, text, markdown, etc.)
3. Ställa frågor mot sina dokument via ett API
4. Få svar genererade av Gemini, baserade ENDAST på deras egen data

## Hur fungerar det?

### Steg 1: Kör Wizarden

**Metod A: Via CLI (Om du har en kod-generator)**
```bash
nexus-builder run rag-builder
```

**Metod B: Manuellt (Om ingen generator finns än)**
1. Läs igenom `wizard_schema.json`
2. Fyll i alla värden från `steps[].questions[].var_name`
3. Kör ett replacement-script (t.ex. med Python eller Node.js) som ersätter alla `{{VARIABEL}}` i `template_files/` med dina värden

### Steg 2: Förbered Supabase

1. Skapa ett projekt på [supabase.com](https://supabase.com)
2. Gå till **SQL Editor** → **New Query**
3. Klistra in innehållet från `infra/supabase/migrations/01_init_schema.sql`
4. Klicka **RUN**
5. Gå till **Settings** → **API** och kopiera:
   - `URL` (din `SUPABASE_URL`)
   - `service_role` secret key (din `SUPABASE_SERVICE_ROLE_KEY`)

### Steg 3: Skaffa API-nycklar

1. Gå till [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Skapa en ny API-nyckel (din `GOOGLE_API_KEY`)

### Steg 4: Generera Projektet

Om du kör manuellt:
```bash
python generate_from_wizard.py wizard_schema.json --output ./min-rag-app
```

Om du kör via CLI:
```bash
nexus-builder generate ./min-rag-app
```

### Steg 5: Starta Din Plattform

```bash
cd min-rag-app
docker compose up -d
```

### Steg 6: Verifiera

1. **Kontrollera containrar:**
   ```bash
   docker compose ps
   ```
   Du ska se 3 tjänster: `app`, `qdrant`, `redis`

2. **Öppna API-dokumentation:**
   ```
   http://localhost:8000/docs
   ```

3. **Skapa ett projekt:**
   ```bash
   curl -X POST "http://localhost:8000/projects" \
   -H "Content-Type: application/json" \
   -d '{"name": "Test Project"}'
   ```

4. **Ladda upp en fil:**
   ```bash
   curl -X POST "http://localhost:8000/projects/<project-id>/upload" \
   -F "file=@test.txt"
   ```

5. **Ställ en fråga:**
   ```bash
   curl -X POST "http://localhost:8000/projects/<project-id>/query" \
   -H "Content-Type: application/json" \
   -d '{"question": "Vad handlar dokumentet om?"}'
   ```

## Felsökning

### Problem: "Could not connect to Qdrant"
- **Lösning:** Kontrollera att `QDRANT_HOST` är satt till `qdrant` (inte `localhost`)

### Problem: "Supabase authentication failed"
- **Lösning:** Dubbelkolla att du använder `service_role` key (inte `anon` key)

### Problem: "Embedding dimension mismatch"
- **Lösning:** Se till att `EMBEDDING_DIMENSION` matchar din valda modell:
  - `text-embedding-004` → 768
  - `embedding-001` → 768

### Problem: "No relevant documents found" (trots att du laddat upp data)
- **Lösning:** Sänk `RELEVANCE_THRESHOLD` från 0.7 till 0.5 eller 0.3

## Anpassning Efter Generering

Du kan alltid ändra dessa värden i din `.env`-fil:

- **Ändra LLM-modell:** Byt `GEMINI_GENERATION_MODEL` (t.ex. till `gemini-1.5-flash-latest` för snabbare/billigare svar)
- **Justera sökning:** Ändra `SEARCH_TOP_K` (fler chunks = mer kontext) eller `RELEVANCE_THRESHOLD`
- **Anpassa prompt:** Redigera `RAG_SYSTEM_PROMPT` direkt i `.env` för att ändra hur Gemini svarar

## Nästa Steg: Monetisering

Denna plattform är redo för produktion. Här är förslag på hur du kan monetisera den:

1. **SaaS-modell:** 
   - Gratis: 1 projekt, 10 dokument
   - Pro ($20/mån): Obegränsat projekt, 1000 dokument
   - Enterprise ($200/mån): Dedikerad instans, custom prompts

2. **Per-Token-modell:**
   - Lägg till räknare i `generate_answer_from_context()` för att tracka tokens
   - Debitera $0.01 per 1000 tokens

3. **White-Label:**
   - Sälj detta som en intern lösning till företag för $5000 engångskostnad

## Licens & Attribution

Genererad av **Nexus Ideation Engine v1.0**.
Använd fritt för kommersiella ändamål.

---

**Pro-Tips:**
- Kör `docker compose logs -f app` för att se live-loggar
- Använd `docker compose down -v` för att rensa ALLA data (inklusive Qdrant och Redis)
- För produktion: Byt ut SQLite i Supabase till en dedikerad Postgres-instans
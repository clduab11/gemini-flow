# 🚀 SEO Intelligence Platform - Bootstrap Package

> **One command to rule them all.**

Detta paket skapades genom KUNSKAPSMULTIPLIKATIONSLOOPEN - tre parallella perspektiv (Infrastruktur, Developer Experience, Pipeline) som korsades för att producera en unified lösning.

---

## 📦 Vad ingår

```
SEO_PLATFORM_BOOTSTRAP/
├── bootstrap.py           # Master orchestrator script
├── infra/
│   ├── main.bicep        # Azure infrastructure as code
│   └── modules/
│       ├── container-apps.bicep
│       ├── databases.bicep
│       ├── keyvault.bicep
│       ├── logging.bicep
│       └── acr.bicep
└── README.md             # This file
```

---

## 🎯 Quick Start

### Steg 1: Initiera projektet

```bash
# Skapa ny mapp för projektet
mkdir seo-intelligence-platform
cd seo-intelligence-platform

# Kopiera bootstrap.py hit
cp /path/to/bootstrap.py .

# Kör init
python bootstrap.py init
```

Detta skapar:
- ✅ Komplett projektstruktur
- ✅ Python services med FastAPI (bacowr, sei-x, ml-service)
- ✅ Docker Compose för utvecklingsdatabaser
- ✅ Makefile med alla kommandon
- ✅ GitHub Actions workflow
- ✅ PyCharm run configurations
- ✅ .env med alla miljövariabler

### Steg 2: Starta utveckling

```bash
# Installera alla dependencies
make init

# Starta databaser
make dev-db

# I separata terminaler:
make dev-bacowr    # Port 8001
make dev-seix      # Port 8002
make dev-ml        # Port 8003
```

### Steg 3: Öppna i PyCharm

1. File → Open → Välj projektmappen
2. Settings → Project → Python Interpreter
3. Lägg till Poetry environment för varje service
4. Run → "All Python Services" (compound config)

---

## 🔧 Kommandon

| Kommando | Beskrivning |
|----------|-------------|
| `python bootstrap.py init` | Första setup |
| `python bootstrap.py dev` | Starta development |
| `python bootstrap.py deploy` | Deploya till Azure |
| `make init` | Installera dependencies |
| `make dev-db` | Starta databaser |
| `make test` | Kör alla tester |
| `make lint` | Kör linters |
| `make build` | Bygg Docker images |

---

## ☁️ Azure Deployment

### Prerequisites

1. Azure CLI installerad: `brew install azure-cli`
2. Inloggad: `az login`
3. Subscription vald: `az account set --subscription "xxx"`

### Provisioning

```bash
# Skapa all infrastruktur
az deployment sub create \
  --location westeurope \
  --template-file infra/main.bicep \
  --parameters environment=prod

# Deploya containers
python bootstrap.py deploy
```

### Vad skapas i Azure

| Resource | Tjänst | Kostnad (ca) |
|----------|--------|--------------|
| Backend | Container Apps | $50-150/mo |
| BACOWR | Container Apps | $30-80/mo |
| SEI-X | Container Apps | $50-100/mo |
| ML-Service | Container Apps | $100-300/mo |
| PostgreSQL | Flexible Server | $50-200/mo |
| Redis | Azure Cache | $15-50/mo |
| MongoDB | Cosmos DB Serverless | $0-100/mo |
| Kafka | Event Hubs | $10-50/mo |
| Key Vault | Key Vault | $0.03/10k ops |
| Logging | Log Analytics | $2.30/GB |

**Total estimated: $300-1000/mo** beroende på usage

---

## 🏗️ Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Azure Front    │
                    │  Door (CDN/WAF) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │ Static Web App │ │ Container │ │ Container │
    │ (Next.js)      │ │ Apps Env  │ │ Apps Env  │
    └────────────────┘ │           │ │           │
                       │ ┌───────┐ │ │ ┌───────┐ │
                       │ │Backend│ │ │ │BACOWR │ │
                       │ └───┬───┘ │ │ └───────┘ │
                       │     │     │ │ ┌───────┐ │
                       │ ┌───▼───┐ │ │ │SEI-X  │ │
                       │ │SEI-X  │ │ │ └───────┘ │
                       │ └───────┘ │ │ ┌───────┐ │
                       └───────────┘ │ │ML-Svc │ │
                                     │ └───────┘ │
                                     └───────────┘
                                           │
              ┌────────────────────────────┼────────────────┐
              │                            │                │
    ┌─────────▼──────┐ ┌──────────────────▼┐ ┌────────────▼──┐
    │ PostgreSQL     │ │ Redis Cache      │ │ Cosmos DB    │
    │ Flexible Server│ │                  │ │ (MongoDB API)│
    └────────────────┘ └──────────────────┘ └──────────────┘
```

---

## 🔐 Secrets

Alla secrets hanteras via Azure Key Vault:

| Secret | Beskrivning |
|--------|-------------|
| `ANTHROPIC-API-KEY` | Claude API nyckel |
| `DATABASE-URL` | PostgreSQL connection string |
| `REDIS-URL` | Redis connection string |
| `MONGODB-URL` | Cosmos DB connection string |
| `JWT-SECRET` | JWT signing key |

Lägg till manuellt:
```bash
az keyvault secret set \
  --vault-name seoplatform-prod-kv \
  --name ANTHROPIC-API-KEY \
  --value "sk-ant-xxx"
```

---

## 📊 Monitoring

Application Insights skapas automatiskt. Visa metrics:

```bash
# Öppna Azure Portal → Application Insights
az monitor app-insights show \
  --app seoplatform-prod-logs-insights \
  --resource-group seoplatform-prod-rg
```

---

## 🔄 CI/CD

GitHub Actions workflow körs automatiskt vid push till `main`:

1. **Lint & Test**: Ruff, MyPy, Pytest för Python; ESLint för Node
2. **Build**: Docker images för alla services
3. **Push**: Till Azure Container Registry
4. **Deploy**: Uppdatera Container Apps
5. **Smoke Test**: Verifiera health endpoints

Secrets att lägga till i GitHub:
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_CREDENTIALS` (Service Principal JSON)

---

## 🐛 Troubleshooting

### "Poetry not found"
```bash
pip install poetry
```

### "Docker daemon not running"
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

### "Azure deployment failed"
```bash
# Visa deployment logs
az deployment sub show \
  --name main \
  --query properties.error
```

### "Container not starting"
```bash
# Visa container logs
az containerapp logs show \
  --name seo-backend \
  --resource-group seoplatform-prod-rg \
  --follow
```

---

## 📚 Nästa steg

1. **Kopiera din kod** till genererade mappar
2. **Uppdatera .env** med riktiga API-nycklar
3. **Kör `make init`** för att installera allt
4. **Kör `make test`** för att verifiera
5. **Push till GitHub** för automatisk deploy

---

## 🧠 Hur detta skapades

Detta paket är resultatet av **KUNSKAPSMULTIPLIKATIONSLOOPEN**:

1. **PREFLIGHT**: Analyserade uppgiften, identifierade domäner och perspektiv
2. **TRE PERSPEKTIV**: 
   - α: Infrastruktur-arkitekt (Azure-design)
   - β: Developer Experience (PyCharm, lokal utveckling)
   - γ: Deployment Pipeline (CI/CD, automation)
3. **KORSNING**: Hittade emergenta insikter:
   - Turborepo för polyglot monorepo
   - Samma Dockerfile för dev och prod
   - APEX-patterns → Container-patterns mapping
4. **ADVERSARIAL**: Stressade lösningen för svagheter
5. **META-SYNTES**: Kombinerade allt till detta paket

**Resultat**: En lösning som ingen enskild "agent" hade producerat ensam.

---

**Happy deploying! 🚀**

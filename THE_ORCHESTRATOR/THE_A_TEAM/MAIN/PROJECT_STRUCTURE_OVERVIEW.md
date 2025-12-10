# SEO Intelligence Platform - Project Structure Overview

**Generated:** 2025-11-28
**Total Files:** 1,874
**Total Lines of Code:** 173,231+
**Architecture:** Multi-service monorepo with microservices

---

## 📁 Repository Root Structure

```
seo-intelligence-platform/
├── 📂 backend/              # NestJS API (83,400 LOC, 45+ modules)
├── 📂 frontend/             # Next.js 14 App Router (89,831 LOC)
├── 📂 crawler/              # Go distributed crawler
├── 📂 ml-service/           # Python ML/AI service
├── 📂 services/
│   ├── bacowr/             # AI content generation (FastAPI)
│   └── sei-x/              # Semantic intelligence (FastAPI)
├── 📂 infrastructure/       # Docker, K8s, monitoring configs
├── 📂 docs/                # Complete documentation
├── 📂 scripts/             # Deployment and utility scripts
├── 📂 .github/             # CI/CD workflows (7 workflows)
├── 📂 .validation/         # Quality assurance and testing
├── 📄 CLAUDE.md            # AI assistant instructions
├── 📄 DEVELOPMENT_STANDARDS.md
├── 📄 README.md
├── 📄 docker-compose.yml
└── 📄 docker-compose.local.yml
```

---

## 🎯 Backend Architecture (`backend/`)

### Core Structure
```
backend/
├── src/
│   ├── modules/           # 45+ feature modules
│   ├── common/            # Shared utilities
│   ├── config/            # Configuration files
│   ├── database/          # Entities, migrations, seeds
│   ├── graphql/           # GraphQL schema and resolvers
│   ├── api/               # REST API controllers
│   └── jobs/              # Background job workers
├── test/                  # Unit, integration, E2E tests
├── migrations/            # Database migrations
├── package.json
├── nest-cli.json
└── Dockerfile
```

### Backend Modules (45 total)

#### **Core Infrastructure (8 modules)**
- `auth/` - JWT authentication, OAuth, 2FA
- `user/` - User management with RBAC
- `tenant/` - Multi-tenant isolation with RLS
- `project/` - SEO project management
- `api-gateway/` - Request routing and proxy
- `api-versioning/` - API version management
- `api-usage/` - API usage tracking
- `rate-limiting/` - Rate limiting per subscription tier

#### **SEO Analysis Features (10 modules)**
- `keywords/` - Keyword research and tracking
- `rankings/` - SERP position monitoring
- `backlinks/` - Backlink analysis
- `backlink-analysis/` - Advanced backlink quality scoring
- `competitors/` - Competitive intelligence
- `audit/` - Technical SEO audits
- `content/` - Content optimization
- `content-analysis/` - Content quality scoring
- `content-gap-analysis/` - Content gap identification
- `serp-features/` - Featured snippets, PAA, etc.

#### **Integrations (7 modules)**
- `integrations/` - Unified integration framework
  - `google-search-console/` - GSC OAuth + data sync
  - `google-analytics/` - GA4 integration
  - `google-ads/` - Google Ads integration
  - `oauth/` - OAuth manager service
  - `sync/` - Data synchronization
  - `webhooks/` - Outgoing webhooks
  - `third-party/` - Ahrefs, SEMrush, Moz clients

#### **AI/ML Services (5 modules)**
- `bacowr/` - AI content generation gateway
- `sei-x/` - Semantic intelligence gateway
- `keyword-clustering/` - ML-based keyword clustering
- `search-intent/` - Search intent classification
- `ml-service/` - ML model predictions (deprecated, moved to Python)

#### **Business Logic (6 modules)**
- `subscription/` - Stripe billing (5 tiers)
- `billing/` - Payment processing
- `usage/` - API usage tracking and quotas
- `white-label/` - Custom branding
- `admin/` - Admin dashboard and management
- `analytics/` - Business analytics

#### **Developer & Infrastructure (9 modules)**
- `graphql-api/` - GraphQL schema and resolvers
- `realtime/` - WebSocket server (Socket.io)
- `collaboration/` - Team collaboration features
- `notifications/` - Email/in-app/push notifications
- `events/` - Event-driven architecture
- `caching/` - Redis caching layer
- `export/` - Data export (CSV, PDF, Excel)
- `bulk/` - Bulk operations (import/export)
- `crawler/` - Crawler integration

---

## 🎨 Frontend Architecture (`frontend/`)

### Core Structure
```
frontend/
├── app/                   # Next.js 14 App Router
│   ├── (auth)/           # Auth layout group
│   ├── (dashboard)/      # Dashboard layout group
│   ├── api/              # API routes
│   ├── error.tsx         # Global error boundary
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── src/
│   ├── components/       # 30+ shadcn/ui + custom components
│   ├── lib/
│   │   ├── api/         # API client methods
│   │   ├── stores/      # Zustand state stores
│   │   └── utils/       # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── services/        # Business logic services
├── public/              # Static assets
├── features/            # Feature modules (legacy)
├── components/          # Additional components (legacy)
├── styles/              # Global styles
├── package.json
├── next.config.js
└── Dockerfile
```

### Frontend Features (13 total)

#### **Core Pages**
- Authentication (login, register, forgot password)
- Dashboard (overview, analytics)
- Projects (list, detail, settings)
- Profile & Settings

#### **SEO Intelligence**
- Keyword Research Tool
- Rank Tracking Dashboard
- Backlink Analysis
- Competitor Analysis
- Site Audit Dashboard
- Content Analysis

#### **Integrations**
- Google Search Console Dashboard
- Google Analytics 4 Dashboard
- Google Ads Dashboard

#### **Business Features**
- Subscription & Billing
- Team Collaboration
- White-Label Management
- Admin Dashboard

#### **Developer Tools**
- API Keys Management
- Webhooks Configuration
- Developer Portal
- Custom Report Builder

---

## 🤖 Python Services

### BACOWR (`services/bacowr/`)
```
services/bacowr/
├── api/
│   ├── main.py           # FastAPI entry point
│   ├── routes/           # API endpoints
│   └── models/           # Pydantic models
├── app/
│   ├── claude_client.py  # Anthropic Claude API client
│   ├── content_generator.py
│   ├── publisher_profiler.py
│   └── quality_scorer.py
├── tests/
├── requirements.txt
└── Dockerfile
```

**Features:**
- AI-powered content generation using Claude API
- Publisher profiling and matching
- Quality scoring and preflight validation
- Next-A1 Framework for SERP optimization

### SEI-X (`services/sei-x/`)
```
services/sei-x/
├── api/
│   ├── main.py           # FastAPI entry point
│   ├── routes/           # API endpoints
│   └── models/           # Pydantic models
├── app/
│   ├── semantic_analyzer.py
│   ├── keyword_extractor.py
│   ├── intent_classifier.py
│   └── clustering.py
├── models/               # Pre-trained NLP models
├── tests/
├── requirements.txt
└── Dockerfile
```

**Features:**
- Multi-language semantic analysis (11 languages)
- 768-dimensional embeddings (paraphrase-multilingual-mpnet-base-v2)
- Intent classification (95%+ accuracy)
- Topic clustering with PageRank
- Redis caching (30-day TTL)

### ML-Service (`ml-service/`)
```
ml-service/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── models/           # ML model definitions
│   ├── training/         # Model training scripts
│   └── api/              # API endpoints
├── models/               # Serialized model files
├── tests/
├── requirements.txt
└── Dockerfile
```

**Features:**
- BERT-based intent classification
- LightGBM content quality scoring
- Word2Vec + K-means keyword clustering
- LSTM traffic prediction
- spaCy NLP for topics and entities

---

## 🕷️ Crawler Infrastructure (`crawler/`)

### Structure
```
crawler/
├── cmd/
│   ├── crawler/          # Main crawler service (Go)
│   ├── scheduler/        # Job scheduler (Go)
│   └── renderer/         # JS renderer (Node.js/Puppeteer)
├── internal/
│   ├── crawler/          # Crawler logic
│   ├── parser/           # HTML parsing
│   ├── storage/          # Data storage
│   └── queue/            # Kafka queue management
├── pkg/                  # Shared packages
├── go.mod
├── go.sum
├── Makefile
└── docker-compose.yml
```

**Components:**
1. **Crawler** - Go-based crawler worker with polite crawling
2. **Scheduler** - Periodic job scheduling and recrawl management
3. **Renderer** - Node.js/Puppeteer for JavaScript rendering

**Features:**
- Polite crawling (robots.txt, rate limiting)
- JavaScript rendering with Puppeteer cluster
- Change detection with SHA-256 hashing
- Distributed via Kafka
- Storage: PostgreSQL (metadata) + MongoDB (raw HTML)

---

## 📊 Database & Data Layer

### PostgreSQL 16 (Main Database)
```
Schemas:
├── public/               # Shared tables
├── tenant_{id}/          # Per-tenant schemas (optional)
└── Row-Level Security    # Multi-tenant isolation

Key Tables:
├── users
├── tenants
├── user_tenants
├── projects
├── keywords
├── rankings
├── backlinks
├── competitors
├── integrations
├── subscriptions
├── invoices
└── audit_logs
```

### Redis 7 (Cache & Queues)
```
DB 0: Backend cache
DB 1: BACOWR cache
DB 2: SEI-X cache
DB 3: Bull queues
```

### MongoDB (Crawler Storage)
```
Collections:
├── crawled_pages         # Raw HTML storage
├── page_snapshots        # Historical snapshots
└── change_history        # Change detection logs
```

### Neo4j (Semantic Graph)
```
Nodes:
├── Keyword
├── Topic
└── Entity

Relationships:
├── RELATED_TO
├── PART_OF
└── SIMILAR_TO
```

---

## 🐳 Infrastructure (`infrastructure/`)

### Docker Compose Configurations
```
infrastructure/
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── crawler.Dockerfile
│   └── nginx.Dockerfile
├── k8s/                  # Kubernetes manifests
│   ├── backend/
│   ├── frontend/
│   ├── crawler/
│   └── ingress/
├── monitoring/
│   ├── prometheus.yml
│   ├── grafana/
│   └── alertmanager.yml
└── nginx/
    └── nginx.conf
```

---

## 📚 Documentation (`docs/`)

### Structure
```
docs/
├── current/
│   ├── MASTER_PLAN_TO_PRODUCTION.md
│   ├── LOCAL_DEVELOPMENT_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── SYSTEM_INVENTORY_COMPLETE.md
├── implementation-plans/
│   ├── PHASE_1_CRITICAL_BLOCKERS.md
│   ├── PHASE_2_BACOWR_INTEGRATION.md
│   ├── PHASE_3_SEIX_INTEGRATION.md
│   └── README.md
├── parallel-projects/
│   ├── README.md
│   ├── keyword-research/
│   ├── backlink-analysis/
│   ├── site-audit/
│   └── rank-tracking/
├── api/
│   ├── REST_API.md
│   ├── GRAPHQL_API.md
│   └── WEBSOCKET_API.md
└── architecture/
    ├── BACKEND_ARCHITECTURE.md
    ├── FRONTEND_ARCHITECTURE.md
    └── DATABASE_SCHEMA.md
```

---

## 🔧 Scripts (`scripts/`)

### Utility Scripts
```
scripts/
├── start-local.sh        # Start all services locally
├── deploy-production.sh  # Production deployment
├── setup-local.sh        # Local environment setup
├── verify-platform.sh    # Health check all services
├── manage-subtrees.sh    # Manage BACOWR/SEI-X subtrees
├── db-backup.sh          # Database backup
├── db-restore.sh         # Database restore
└── seed-demo-data.sh     # Seed demo data
```

---

## 🧪 Testing Infrastructure

### Backend Tests
```
backend/test/
├── unit/                 # Unit tests
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/          # Integration tests
│   ├── api/
│   ├── database/
│   └── services/
├── e2e/                  # End-to-end tests
│   ├── auth.e2e-spec.ts
│   ├── projects.e2e-spec.ts
│   └── integrations.e2e-spec.ts
└── security/             # Security tests
    ├── injection.spec.ts
    └── auth.spec.ts
```

### Frontend Tests
```
frontend/__tests__/
├── components/           # Component tests
├── pages/                # Page tests
├── hooks/                # Hook tests
└── utils/                # Utility tests

frontend/e2e/            # Playwright E2E tests
├── auth.spec.ts
├── keyword-research.spec.ts
├── rank-tracking.spec.ts
└── billing.spec.ts
```

---

## 📦 Key Configuration Files

### Root Level
- `docker-compose.yml` - Production Docker Compose
- `docker-compose.local.yml` - Local development Docker Compose
- `Makefile` - Build and deployment shortcuts
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules

### Backend
- `backend/package.json` - Node.js dependencies (45+ packages)
- `backend/nest-cli.json` - NestJS CLI configuration
- `backend/tsconfig.json` - TypeScript configuration
- `backend/.eslintrc.js` - ESLint rules
- `backend/jest.config.js` - Jest testing configuration

### Frontend
- `frontend/package.json` - Node.js dependencies (60+ packages)
- `frontend/next.config.js` - Next.js configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/playwright.config.ts` - Playwright E2E configuration

### Python Services
- `services/bacowr/requirements.txt` - Python dependencies
- `services/sei-x/requirements.txt` - Python dependencies
- `ml-service/requirements.txt` - Python dependencies

### Crawler
- `crawler/go.mod` - Go module dependencies
- `crawler/go.sum` - Go dependency checksums
- `crawler/Makefile` - Build commands

---

## 🎯 CI/CD Workflows (`.github/workflows/`)

1. `backend-ci.yml` - Backend linting, testing, building
2. `frontend-ci.yml` - Frontend linting, testing, building
3. `crawler-ci.yml` - Crawler testing and building
4. `ml-service-ci.yml` - ML service testing
5. `deploy-staging.yml` - Staging deployment
6. `deploy-production.yml` - Production deployment
7. `azure-backend.yml` - Azure backend deployment

---

## 📊 Project Statistics

### Code Distribution
- **Backend (NestJS):** 83,400 LOC (48.2%)
- **Frontend (Next.js):** 89,831 LOC (51.8%)
- **Crawler (Go):** ~5,000 LOC
- **ML-Service (Python):** ~3,000 LOC
- **BACOWR (Python):** ~2,000 LOC
- **SEI-X (Python):** ~2,500 LOC

### Technology Stack
- **Languages:** TypeScript, JavaScript, Python, Go
- **Frameworks:** NestJS, Next.js, FastAPI, React
- **Databases:** PostgreSQL 16, Redis 7, MongoDB, Neo4j
- **Message Queue:** Kafka
- **Search:** Elasticsearch 8
- **Container:** Docker, Kubernetes
- **Testing:** Jest, Playwright, pytest, Go test
- **CI/CD:** GitHub Actions

### Module Count
- **Backend Modules:** 45+
- **Frontend Features:** 13
- **Database Entities:** 50+
- **API Endpoints:** 200+
- **GraphQL Queries/Mutations:** 50+
- **WebSocket Events:** 20+

---

## 🚀 Development Status

**Phase 1:** ✅ Complete (Nov 23, 2025)
- Platform navigable and deployable
- All critical backend modules implemented
- Essential frontend pages created

**Phase 2:** 🔴 Next - BACOWR Integration
**Phase 3:** 🔴 Planned - SEI-X Integration

**Production Readiness:** 75% (see `PRODUCTION_READINESS_STATUS.md`)

---

## 📝 Important Files for Claude Opus Orchestration

### Essential Context Files
1. `CLAUDE.md` - Complete project instructions for AI
2. `DEVELOPMENT_STANDARDS.md` - Quality requirements
3. `docs/current/SYSTEM_INVENTORY_COMPLETE.md` - Full system inventory
4. `README.md` - Project overview and business context
5. `PLATFORM_CONTEXT.md` - Platform architecture context

### Architecture Documentation
6. `backend/ARCHITECTURE.md` - Backend architecture details
7. `frontend/FRONTEND_ARCHITECTURE.md` - Frontend structure
8. `docs/architecture/DATABASE_SCHEMA.md` - Database schema

### Implementation Plans
9. `docs/implementation-plans/README.md` - Phase roadmap
10. `docs/parallel-projects/README.md` - Available projects

### Quick Start Guides
11. `QUICKSTART.md` - Quick start guide
12. `docs/current/LOCAL_DEVELOPMENT_GUIDE.md` - Local setup
13. `.validation/SNABBSTART.md` - Swedish quick start

---

## 🔑 Key Architectural Patterns

### Multi-Tenancy
- Row-Level Security (RLS) in PostgreSQL
- Tenant context via middleware
- Per-tenant schemas (optional)
- X-Tenant-Id header required for all requests

### Authentication & Authorization
- JWT tokens (access + refresh)
- RBAC with 4 roles, 66 permissions
- OAuth2 support (Google, GitHub)
- 2FA support

### Event-Driven Architecture
- Kafka for inter-service communication
- WebSocket for real-time updates
- Event sourcing for audit logs

### Caching Strategy
- Redis caching layer
- React Query for frontend caching
- Bull queues for background jobs

### API Design
- REST API (versioned: /api/v1, /api/v2)
- GraphQL API for complex queries
- WebSocket for real-time features

---

**End of Project Structure Overview**

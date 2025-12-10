# 🧠 PLATFORM CONTEXT - Master Knowledge Base

**Purpose**: This document provides complete platform context to any LLM working on the project.
**Last Updated**: 2024-11-23
**For**: ChatGPT, Claude, or any LLM that needs full platform understanding

> **HOW TO USE**: Read this document first, then follow references to detailed docs as needed.
> This is the SINGLE SOURCE OF TRUTH for platform context.

---

## 📚 QUICK NAVIGATION

- [Platform Overview](#-platform-overview) - What we're building
- [Current Status](#-current-status) - Where we are now
- [Architecture](#-architecture) - How it's built
- [Technology Stack](#-technology-stack) - What we use
- [Component Registry](#-component-registry) - All components (with docs)
- [Implementation Status](#-implementation-status) - What's done, what's not
- [Development Guide](#-development-guide) - How to add new features
- [Documentation Standards](#-documentation-standards) - How to document new work

---

## 🎯 PLATFORM OVERVIEW

**Name**: SEO Intelligence Platform
**Type**: Enterprise SaaS - AI-Powered SEO Suite
**Scale**: Multi-tenant, Microservices Architecture
**Status**: 65% Production-Ready (MVP deployable)

### What We're Building

A comprehensive SEO platform with **4 KILLER USPs**:

1. **BACOWR** - AI content generation for backlink outreach (Claude API)
2. **SEI-X** - 11-language semantic intelligence engine
3. **QC Validator** - Pre-publication quality control (40% rejection reduction)
4. **Link Planner** - Strategic link building automation (saves 10+ hours/month)

### Core Features (Production-Ready)

- ✅ Keywords tracking & clustering
- ✅ Rankings monitoring (SERP)
- ✅ Backlinks analysis
- ✅ Competitor tracking
- ✅ Report builder (drag-and-drop)
- ✅ Multi-tenant SaaS with RBAC
- ✅ Stripe billing integration
- ✅ Team collaboration

**📄 Detailed Overview**: See `README.md`

---

## 📊 CURRENT STATUS

**Overall Production Readiness**: 65%

| Component | Status | Production % | Details |
|-----------|--------|--------------|---------|
| Core Features | ✅ Complete | 100% | Keywords, Rankings, Backlinks, etc. |
| BACOWR | ⚠️ Mock | 20% | Needs real Claude API integration |
| SEI-X | ⚠️ Mock | 15% | Needs real NLP models |
| QC Validator | ⚠️ Mock | 30% | Needs real publisher scraping |
| Link Planner | ⚠️ Mock | 25% | Needs real link discovery |
| CSV Import | ⚠️ Skal | 60% | Needs UI + file parsing |
| Testing | ⚠️ Templates | 10% | Needs full test suite |
| **API Gateway** | ❌ Missing | 0% | **CRITICAL GAP** |
| **CI/CD** | ❌ Missing | 0% | **HIGH PRIORITY** |
| **Observability** | ❌ Missing | 0% | **HIGH PRIORITY** |

**📄 Full Status Details**: See `docs/SYSTEM_INVENTORY.md`
**📄 Production Gaps**: See `docs/PRODUCTION_GAPS.md`

---

## 🏗️ ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    Next.js 14 + shadcn/ui                    │
│                      Port: 3000                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    ⚠️ API GATEWAY (MISSING!)                 │
│              Should be: Kong/Nginx + Rate Limiting           │
│                   Should be: Port 80/443                     │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
    │   BACKEND   │  │ MICROSERVICES│  │  DATABASES   │
    │   NestJS    │  │  (Python)    │  │              │
    │  Port 4000  │  │              │  │ PostgreSQL   │
    └─────────────┘  │ - BACOWR     │  │ Redis        │
                     │ - SEI-X      │  │ Neo4j        │
                     │ - QC         │  │              │
                     │ - Link Plan  │  └──────────────┘
                     └─────────────┘
```

### Technology Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS + shadcn/ui
- Recharts for visualizations

**Backend**:
- NestJS 10 (TypeScript)
- TypeORM
- JWT Authentication
- WebSocket (Socket.io)
- Bull (job queue - to be implemented)

**Microservices**:
- FastAPI (Python)
- BACOWR (Port 8001) - Mock
- SEI-X (Port 8000) - Mock
- QC Validator (Port 8002) - Mock
- Link Planner (Port 8003) - Mock

**Databases**:
- PostgreSQL 16 (main database)
- Redis 7 (cache + sessions)
- Neo4j 5 (semantic graph for SEI-X)

**Infrastructure**:
- Docker + Docker Compose
- ⚠️ CI/CD: Not implemented
- ⚠️ Monitoring: Not implemented
- ⚠️ Logging: Basic only

**📄 Detailed Stack**: See `docs/SYSTEM_INVENTORY.md` section "Architecture Overview"

---

## 📦 COMPONENT REGISTRY

> **Every component below has its own documentation. Read the referenced doc for full details.**

### Backend Modules (NestJS)

| Module | Status | Location | Documentation |
|--------|--------|----------|---------------|
| Authentication | ✅ Production | `backend/src/modules/auth/` | See code comments |
| Users | ✅ Production | `backend/src/modules/users/` | See code comments |
| Projects | ✅ Production | `backend/src/modules/projects/` | See code comments |
| Keywords | ✅ Production | `backend/src/modules/keywords/` | See code comments |
| Rankings | ✅ Production | `backend/src/modules/rankings/` | See code comments |
| Backlinks | ✅ Production | `backend/src/modules/backlinks/` | See code comments |
| Competitors | ✅ Production | `backend/src/modules/competitors/` | See code comments |
| Reports | ✅ Production | `backend/src/modules/reports/` | See code comments |
| Billing | ✅ Production | `backend/src/modules/billing/` | See code comments |
| BACOWR Integration | ⚠️ Mock | `backend/src/modules/bacowr/` | See code comments |
| SEI-X Integration | ⚠️ Mock | `backend/src/modules/seix/` | See code comments |
| Bulk Import | ⚠️ Skal | `backend/src/modules/bulk/` | See `bulk.service.ts` |

### Microservices (Python/FastAPI)

| Service | Status | Port | Location | Documentation |
|---------|--------|------|----------|---------------|
| BACOWR | ⚠️ Mock | 8001 | `services/bacowr/` | `services/bacowr/README.md` |
| SEI-X | ⚠️ Mock | 8000 | `services/sei-x/` | `services/sei-x/README.md` |
| QC Validator | ⚠️ Mock | 8002 | `services/qc-validator/` | `services/qc-validator/README.md` |
| Link Planner | ⚠️ Mock | 8003 | `services/link-planner/` | `services/link-planner/README.md` |

### Frontend Components (Next.js)

| Feature Area | Status | Location | Documentation |
|--------------|--------|----------|---------------|
| Dashboard | ✅ Production | `frontend/src/app/dashboard/` | See JSDoc comments |
| Keywords | ✅ Production | `frontend/src/app/keywords/` | See JSDoc comments |
| Rankings | ✅ Production | `frontend/src/app/rankings/` | See JSDoc comments |
| Backlinks | ✅ Production | `frontend/src/app/backlinks/` | See JSDoc comments |
| Reports | ✅ Production | `frontend/src/app/reports/` | See JSDoc comments |
| Settings | ✅ Production | `frontend/src/app/settings/` | See JSDoc comments |

### Infrastructure

| Component | Status | Location | Documentation |
|-----------|--------|----------|---------------|
| Docker Compose | ✅ Complete | `docker-compose.yml` | See file comments |
| Health Check | ✅ Complete | `scripts/health-check.sh` | See script comments |
| Makefile | ✅ Complete | `Makefile` | Run `make help` |
| Environment Config | ✅ Complete | `.env.example` | See inline comments |
| Error Handling | ✅ Complete | `backend/src/common/filters/` | See filter files |

### Testing (Templates)

| Test Type | Status | Location | Documentation |
|-----------|--------|----------|---------------|
| Backend Unit | ⚠️ Template | `backend/test/unit/` | `docs/TESTING_GUIDE.md` |
| Backend Integration | ⚠️ Template | `backend/test/integration/` | `docs/TESTING_GUIDE.md` |
| Backend E2E | ⚠️ Template | `backend/test/e2e/` | `docs/TESTING_GUIDE.md` |
| Frontend Unit | ⚠️ Template | `frontend/tests/unit/` | `docs/TESTING_GUIDE.md` |
| Frontend E2E | ⚠️ Template | `frontend/tests/e2e/` | `docs/TESTING_GUIDE.md` |

---

## 🚀 IMPLEMENTATION STATUS

### ✅ Phase 1: Critical Blockers (COMPLETE)
**Status**: 100% Production-Ready
**LOC**: ~6,000
**Details**: All core features working
**Documentation**: Inline code comments

### ✅ Phase 2: BACOWR Integration (MOCK COMPLETE)
**Status**: 20% Production (Mock working)
**LOC**: ~2,000 (mock)
**Details**: FastAPI service with mock Claude API
**Documentation**: `services/bacowr/README.md`
**Next Steps**: Real Claude API integration needed

### ✅ Phase 3: SEI-X Integration (MOCK COMPLETE)
**Status**: 15% Production (Mock working)
**LOC**: ~2,500 (mock)
**Details**: FastAPI service with mock NLP
**Documentation**: `services/sei-x/README.md`
**Next Steps**: Real NLP models (spaCy, Transformers) needed

### ✅ Phase 4: QC Validation (MOCK COMPLETE)
**Status**: 30% Production (Mock working)
**LOC**: ~660 (mock)
**Details**: FastAPI service for quality control
**Documentation**: `services/qc-validator/README.md`
**Next Steps**: Real publisher scraping & plagiarism APIs needed

### ✅ Phase 5: Link Planning (MOCK COMPLETE)
**Status**: 25% Production (Mock working)
**LOC**: ~780 (mock)
**Details**: FastAPI service for link building automation
**Documentation**: `services/link-planner/README.md`
**Next Steps**: Real link discovery & Moz/Ahrefs integration needed

### ✅ Phase 6: CSV Import (SKAL COMPLETE)
**Status**: 60% Production (Backend complete)
**LOC**: ~400 (backend)
**Details**: Smart column mapping with Levenshtein distance
**Documentation**: `backend/src/modules/bulk/services/bulk.service.ts`
**Next Steps**: Frontend UI + file parsing needed

### ✅ Phase 7: Testing Coverage (TEMPLATES COMPLETE)
**Status**: 10% Production (Templates only)
**LOC**: ~2,500 (templates)
**Details**: Unit, integration, E2E test templates
**Documentation**: `docs/TESTING_GUIDE.md`
**Next Steps**: Write actual tests for all modules

### ❌ Phase 8: API Gateway (NOT STARTED)
**Status**: 0% - **CRITICAL GAP**
**Priority**: 🔴 HIGHEST
**Effort**: 1 week
**ChatGPT Capable**: 80%
**Documentation**: `docs/PRODUCTION_GAPS.md` - "API Gateway" section
**Next Steps**: See "How to Add New Components" below

### ❌ Phase 9: Observability (NOT STARTED)
**Status**: 0% - **HIGH PRIORITY**
**Priority**: 🟡 HIGH
**Effort**: 1 week
**ChatGPT Capable**: 70%
**Documentation**: `docs/PRODUCTION_GAPS.md` - "Observability Stack" section

### ❌ Phase 10: CI/CD Pipeline (NOT STARTED)
**Status**: 0% - **HIGH PRIORITY**
**Priority**: 🟡 HIGH
**Effort**: 3 days
**ChatGPT Capable**: 90%
**Documentation**: `docs/PRODUCTION_GAPS.md` - "CI/CD Pipeline" section

**📄 Full Implementation Details**: See `docs/SYSTEM_INVENTORY.md`

---

## 🛠️ DEVELOPMENT GUIDE

### Quick Start for Developers

```bash
# 1. Clone repo
git clone <repo>
cd seo-intelligence-platform

# 2. Setup
make setup

# 3. Start everything
make start

# 4. Check health
make health

# 5. View logs
make logs
```

**📄 Detailed Quick Start**: See `QUICKSTART.md`

### Project Structure

```
seo-intelligence-platform/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── modules/      # 43 feature modules
│   │   ├── common/       # Shared code (filters, interceptors)
│   │   └── main.ts       # Entry point
│   └── test/             # Test templates
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   └── components/   # React components
│   └── tests/            # Test templates
├── services/             # Microservices (Python)
│   ├── bacowr/           # AI content generation
│   ├── sei-x/            # Semantic intelligence
│   ├── qc-validator/     # Quality control
│   └── link-planner/     # Link building
├── demos/                # HTML demo pages
├── docs/                 # Documentation
│   ├── SYSTEM_INVENTORY.md
│   ├── PRODUCTION_GAPS.md
│   ├── TESTING_GUIDE.md
│   └── implementation-plans/
├── scripts/              # Utility scripts
│   └── health-check.sh
├── docker-compose.yml    # Full stack deployment
├── Makefile              # Quick commands
└── PLATFORM_CONTEXT.md   # This file!
```

### Available Commands

```bash
make help          # Show all commands
make start         # Start all services
make stop          # Stop all services
make health        # Check service health
make logs          # View all logs
make test          # Run tests
make demo          # Open HTML demos
make clean         # Clean up containers
```

**📄 Full Command List**: Run `make help`

---

## 📝 DOCUMENTATION STANDARDS

> **IMPORTANT**: When you (LLM) build a new component, follow these standards so the next LLM can understand your work!

### For New Backend Modules

**File to Create**: `backend/src/modules/[module-name]/README.md`

**Template**:
```markdown
# [Module Name] Module

**Status**: ✅/⚠️/❌
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD

## Purpose
[What this module does in 1-2 sentences]

## API Endpoints
- `GET /api/[resource]` - [Description]
- `POST /api/[resource]` - [Description]

## Dependencies
- [List required modules]
- [List external APIs]

## Environment Variables
- `VARIABLE_NAME` - [Description]

## Database Schema
[Tables/entities used]

## Usage Example
[Code example]

## Testing
[How to test]

## Production Readiness
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Error handling complete
- [ ] Logging implemented
- [ ] Documentation complete

## Next Steps
[What needs to be done for production]
```

### For New Microservices

**File to Create**: `services/[service-name]/README.md`

**Template**: See existing service READMEs (e.g., `services/bacowr/README.md`)

Must include:
- Purpose & features
- API endpoints (FastAPI auto-docs)
- Installation & setup
- Docker deployment
- Environment variables
- Production considerations

### For New Infrastructure Components

**File to Create**: `docs/[component-name].md` OR inline documentation

Examples:
- Configuration files: Inline comments
- Scripts: Header comments + usage section
- Complex systems: Dedicated doc in `docs/`

### For Test Suites

**File to Update**: `docs/TESTING_GUIDE.md`

Add section describing:
- What is tested
- How to run tests
- Coverage requirements
- CI/CD integration

---

## 🔄 HOW TO ADD NEW COMPONENTS

> **FOR LLMS**: Follow this process when building something new!

### Step 1: Document Your Component

Create appropriate documentation following standards above.

### Step 2: Update This File (PLATFORM_CONTEXT.md)

Add entry to **Component Registry** section:

```markdown
| [Component Name] | ✅/⚠️/❌ [Status] | [Location] | [Doc Reference] |
```

### Step 3: Update SYSTEM_INVENTORY.md

Add to production readiness matrix:

```markdown
| [Component] | [Status] | [%] | [Effort to Production] |
```

### Step 4: Update README.md (if major feature)

Add to features list and quick start if needed.

### Step 5: Update docker-compose.yml (if service)

Add service definition with:
- Build context
- Ports
- Environment variables
- Dependencies
- Health checks

### Step 6: Update .env.example (if new variables)

Add new environment variables with descriptions.

---

## 🎯 CURRENT PRIORITIES

> **FOR LLMS**: These are the next components to build, in priority order.

### 1. API Gateway (CRITICAL - Start Here!)
**Why**: Single entry point, rate limiting, caching, security
**Effort**: 1 week
**ChatGPT Capable**: 80%
**Guide**: To be created - "API_GATEWAY_IMPLEMENTATION.md"
**References**: `docs/PRODUCTION_GAPS.md` - "API Gateway" section

### 2. CI/CD Pipeline (HIGH)
**Why**: Automated testing, deployment, rollback
**Effort**: 3 days
**ChatGPT Capable**: 90%
**References**: `docs/PRODUCTION_GAPS.md` - "CI/CD Pipeline" section

### 3. Observability Stack (HIGH)
**Why**: Logs, metrics, tracing, alerts
**Effort**: 1 week
**ChatGPT Capable**: 70%
**References**: `docs/PRODUCTION_GAPS.md` - "Observability" section

### 4. Complete Documentation (MEDIUM)
**Why**: API docs, architecture diagrams, guides
**Effort**: 1 week
**ChatGPT Capable**: 95%
**References**: `docs/PRODUCTION_GAPS.md` - "Documentation" section

### 5. Backup & Disaster Recovery (HIGH)
**Why**: Data protection, business continuity
**Effort**: 2 days
**ChatGPT Capable**: 80%
**References**: `docs/PRODUCTION_GAPS.md` - "Backup & DR" section

**📄 Full Priority List**: See `docs/PRODUCTION_GAPS.md`

---

## 🧪 TESTING STRATEGY

**Current Coverage**: ~10% (templates only)
**Target Coverage**: 80% backend, 75% frontend

### Test Types

1. **Unit Tests** (Jest/Vitest)
   - Test individual functions/methods
   - Mock external dependencies
   - Fast execution (< 100ms per test)

2. **Integration Tests** (Supertest)
   - Test module interactions
   - Real database (test DB)
   - API endpoint testing

3. **E2E Tests** (Playwright)
   - Test complete user flows
   - Real browser automation
   - Critical paths only

**📄 Complete Guide**: See `docs/TESTING_GUIDE.md`

---

## 🚨 KNOWN ISSUES & GAPS

### Critical Gaps (Must Fix Before Production)

1. **No API Gateway** - Services exposed directly
2. **No Rate Limiting** - DDoS vulnerable
3. **No Caching Layer** - Slow API responses
4. **No Monitoring** - Blind to production issues
5. **No Automated Backups** - Data loss risk
6. **Low Test Coverage** - High bug risk

**📄 Full Gap Analysis**: See `docs/PRODUCTION_GAPS.md`

### Mock Implementations (Need Real Implementation)

1. **BACOWR** - Mock Claude API (needs real integration)
2. **SEI-X** - Mock NLP (needs real models)
3. **QC Validator** - Mock scraping (needs real implementation)
4. **Link Planner** - Mock data (needs real APIs)

**📄 Swap Strategy**: See `docs/SYSTEM_INVENTORY.md` - "Swap Strategy" section

---

## 📖 COMPLETE DOCUMENTATION INDEX

### Core Documentation
- `README.md` - Project overview, features, quick start
- `QUICKSTART.md` - 1-minute setup guide
- `PLATFORM_CONTEXT.md` - **THIS FILE** - Master context
- `.env.example` - All environment variables

### Technical Documentation
- `docs/SYSTEM_INVENTORY.md` - Complete platform inventory
- `docs/PRODUCTION_GAPS.md` - What's missing for production
- `docs/TESTING_GUIDE.md` - Complete testing guide

### Implementation Plans
- `docs/implementation-plans/PHASE_1_CRITICAL_BLOCKERS.md`
- `docs/implementation-plans/PHASE_2_BACOWR_INTEGRATION.md`
- `docs/implementation-plans/PHASE_3_SEIX_INTEGRATION.md`
- `docs/implementation-plans/PHASE_4_QC_VALIDATION.md`
- `docs/implementation-plans/PHASE_5_LINK_PLANNING.md`
- `docs/implementation-plans/PHASE_6_CSV_IMPORT.md`
- `docs/implementation-plans/PHASE_7_TESTING_COVERAGE.md`

### Service Documentation
- `services/bacowr/README.md` - BACOWR microservice
- `services/sei-x/README.md` - SEI-X microservice
- `services/qc-validator/README.md` - QC Validator microservice
- `services/link-planner/README.md` - Link Planner microservice

### Infrastructure
- `Makefile` - Quick commands (run `make help`)
- `docker-compose.yml` - Full stack deployment
- `scripts/health-check.sh` - Health monitoring

### Production Readiness (For ChatGPT/External LLMs)
- `docs/API_GATEWAY_IMPLEMENTATION_GUIDE.md` - **COMPLETE** Kong API Gateway setup (15 files, 3,500 LOC, 100% detailed specs)

---

## 🤖 FOR LLMS: HOW TO USE THIS DOCUMENT

### If You're Tasked to Build Something New:

1. **Read this entire document first** (you are here!)
2. **Check Component Registry** - Does it exist already?
3. **Check Production Gaps** - Is it documented there?
4. **Read referenced documentation** - Get detailed context
5. **Follow Documentation Standards** - Document your work
6. **Update this file** - Add your component to the registry
7. **Update related files** - Keep everything in sync

### If You're Tasked to Fix/Update Something:

1. **Read this document** - Get overall context
2. **Find component in Component Registry**
3. **Read component's specific documentation**
4. **Check related components** - Understand dependencies
5. **Make changes**
6. **Update documentation** - Keep it current
7. **Update this file if structure changed**

### If You're ChatGPT Working on Infrastructure:

You're PERFECT for:
- ✅ Configuration files (YAML, JSON, env)
- ✅ Docker Compose setups
- ✅ Shell scripts
- ✅ CI/CD workflows
- ✅ Documentation
- ✅ Architecture design

You should AVOID:
- ❌ Complex TypeScript code (NestJS controllers)
- ❌ React components
- ❌ Database models (TypeORM)
- ❌ Test implementation (leave for Claude)

### If You're Claude Working on Application Code:

You're PERFECT for:
- ✅ NestJS modules & controllers
- ✅ React components
- ✅ TypeScript business logic
- ✅ Database models (TypeORM)
- ✅ Test implementation
- ✅ Complex debugging

You should AVOID:
- ❌ Simple config files (ChatGPT is faster)
- ❌ Basic documentation (ChatGPT is great at this)

---

## 📞 GETTING HELP

### For Developers

- **Quick Start Issues**: See `QUICKSTART.md` troubleshooting
- **Service Issues**: Check `make health` and service logs
- **Build Issues**: See service-specific README files

### For LLMs

- **Missing Context**: Read referenced documentation
- **Unclear Architecture**: See `docs/SYSTEM_INVENTORY.md`
- **Production Gaps**: See `docs/PRODUCTION_GAPS.md`
- **Testing Questions**: See `docs/TESTING_GUIDE.md`

---

## 🎉 SUCCESS METRICS

**Current**: 65% Production-Ready

**Target**: 90% Production-Ready

**Remaining Work**:
- API Gateway (1 week)
- CI/CD Pipeline (3 days)
- Observability (1 week)
- Documentation (1 week)
- Backup Strategy (2 days)

**Timeline**: 5 weeks to 90% production-ready

---

## 🔄 DOCUMENT MAINTENANCE

**This document should be updated when**:
- New component is added
- Component status changes
- New documentation is created
- Architecture changes
- New priorities emerge

**Who updates**:
- Any LLM working on the project
- Follow "How to Add New Components" section above

**Review Frequency**: After each major feature/phase completion

---

## 🏆 CONCLUSION

You now have complete context for the SEO Intelligence Platform!

**Next Steps**:
1. If building new feature → Follow "How to Add New Components"
2. If fixing existing code → Find component in Registry
3. If unclear → Read referenced documentation
4. If still unclear → Check `docs/PRODUCTION_GAPS.md`

**Remember**: Keep this document updated so the next LLM can hit the ground running!

---

**Last Updated**: 2024-11-23
**Document Version**: 1.0.0
**Maintainer**: Update this file when you add new components!

#!/bin/bash

###############################################################################
# Create Critical Path Issues (P0)
# Creates the 3 most critical issues from Sprint 8 triage
###############################################################################

set -e  # Exit on error

echo "🔥 Creating Critical Path (P0) Issues..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    exit 1
fi

###############################################################################
# Issue #1: Super Terminal StoreAdapter Missing node-fetch Dependency
###############################################################################

echo "Creating Issue #1..."

gh issue create \
  --title "Super Terminal StoreAdapter Missing node-fetch Dependency" \
  --label "P0,critical-bug,infra,E-small" \
  --body "$(cat <<'EOF'
## Description

The StoreAdapter (`src/cli/super-terminal/sync/StoreAdapter.ts`) uses HTTP polling to connect to the backend API but is missing the `node-fetch` dependency. This prevents Super Terminal from syncing with the backend.

## Impact

- ❌ Blocks Super Terminal ↔ Backend integration
- ❌ TUI cannot display workflows from backend
- ❌ Users cannot test end-to-end sync

## Current Error

```
Error: Cannot find module 'node-fetch'
```

## Solution

Add `node-fetch` to dependencies and update StoreAdapter imports.

## Definition of Done

- [ ] Add `node-fetch` to dependencies in `package.json`
- [ ] Update StoreAdapter to import and use `node-fetch`
- [ ] Test: Run `npm run super-terminal` → verify connection to backend
- [ ] No breaking changes to existing StoreAdapter API
- [ ] Update package-lock.json

## Out of Scope

- WebSocket implementation (defer to Issue #4)
- Response format fixes (defer to Issue #2)

## Effort Estimate

< 1 hour

## Priority

**P0 - Fix today**

## Related

- Sprint 8 Completion Report: `docs/SPRINT8_COMPLETION.md`
- StoreAdapter: `src/cli/super-terminal/sync/StoreAdapter.ts`
EOF
)"

echo "✅ Issue #1 created"
echo ""

###############################################################################
# Issue #2: StoreAdapter Response Format Incompatible with Sprint 7 API
###############################################################################

echo "Creating Issue #2..."

gh issue create \
  --title "StoreAdapter Response Format Incompatible with Sprint 7 API" \
  --label "P0,critical-bug,agent-ux,E-small" \
  --body "$(cat <<'EOF'
## Description

The StoreAdapter expects a specific response format from `/api/store/state`, but the Sprint 7 backend returns a different format (standardized API response with `success`, `data`, `error` fields).

## Current vs Expected

**StoreAdapter expects:**
```typescript
{ nodes: [...], edges: [...] }
```

**Sprint 7 API returns:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...]
  },
  "error": null,
  "timestamp": "2025-11-11T...",
  "version": "1.0.0"
}
```

## Impact

- ❌ StoreAdapter crashes or fails to parse responses
- ❌ TUI displays empty state
- ❌ Real-time sync broken

## Current Error

```
TypeError: Cannot read property 'forEach' of undefined
```

## Solution

Update StoreAdapter `_fetchStoreState()` to extract `data` field from response.

## Definition of Done

- [ ] Update StoreAdapter `_fetchStoreState()` to parse Sprint 7 response format
- [ ] Extract `data` field from response
- [ ] Handle `success: false` cases gracefully
- [ ] Display error message if API returns error
- [ ] Test: Verify TUI displays backend workflows correctly
- [ ] No crashes on API errors

## Out of Scope

- WebSocket implementation (defer to Issue #4)
- Advanced error recovery (defer to Issue #18)

## Effort Estimate

< 2 hours

## Priority

**P0 - Fix today**

## Files to Modify

- `src/cli/super-terminal/sync/StoreAdapter.ts` (lines 100-150)

## Related

- Sprint 7 API Documentation: `docs/SPRINT7_COMPLETION.md`
- Backend API Response Format: `backend/src/api/middleware/errorHandler.js`
EOF
)"

echo "✅ Issue #2 created"
echo ""

###############################################################################
# Issue #3: Docker Compose Environment Variables Not Documented
###############################################################################

echo "Creating Issue #3..."

gh issue create \
  --title "Docker Compose Environment Variables Not Documented" \
  --label "P0,infra,E-small" \
  --body "$(cat <<'EOF'
## Description

The `docker-compose.yml` references `${API_KEY}` environment variable, but there's no `.env.example` or documentation explaining how to set it up for Docker deployment.

## Impact

- ❌ Users cannot run `docker-compose up` successfully
- ❌ Backend starts with default insecure API key
- ❌ Frontend cannot authenticate with backend
- ❌ Poor developer experience

## Current Error

```bash
$ docker-compose up
WARNING: The API_KEY variable is not set. Defaulting to a blank string.
```

## Solution

Create `.env.example` and document Docker setup.

## Definition of Done

- [ ] Create `.env.example` in project root with Docker variables
- [ ] Include all required variables: `API_KEY`, `NODE_ENV`, `CORS_ORIGINS`
- [ ] Add comments explaining each variable
- [ ] Document Docker environment setup in `docs/GETTING_STARTED.md`
- [ ] Update `docker-compose.yml` with fallback values
- [ ] Add `.env` to `.gitignore` (if not already)
- [ ] Test: Clean docker-compose up → services start correctly

## Out of Scope

- Advanced secrets management (defer to future)
- Docker Swarm/Kubernetes configs (defer to future)

## Effort Estimate

< 1 hour

## Priority

**P0 - Fix today**

## Files to Create/Modify

- Create: `.env.example`
- Modify: `docs/GETTING_STARTED.md` (Docker section)
- Modify: `docker-compose.yml` (add default values)

## Example .env.example

```bash
# Backend API Configuration
API_KEY=your-secure-api-key-here
NODE_ENV=development
PORT=3001

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_PATH=.data/

# Logging
LOG_LEVEL=info
```

## Related

- Docker Setup: `docker-compose.yml`
- Getting Started: `docs/GETTING_STARTED.md`
EOF
)"

echo "✅ Issue #3 created"
echo ""

###############################################################################
# Summary
###############################################################################

echo "✅ All Critical Path (P0) issues created!"
echo ""
echo "🔗 View issues: https://github.com/clduab11/gemini-flow/issues"
echo ""
echo "Next steps:"
echo "1. Review and assign issues"
echo "2. Move to 'Critical Path' column in GitHub Projects"
echo "3. Start work on Issue #1 (smallest effort)"
echo ""
echo "To create remaining P1 issues, run: scripts/create-p1-issues.sh"
echo ""

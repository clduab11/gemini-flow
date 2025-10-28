# Gemini Flow Backend

Backend API server for Gemini Flow with atomic SQLite database.

## Features

- ✅ **Atomic Operations**: SQLite with ACID guarantees
- ✅ **Concurrency Safe**: WAL mode for concurrent reads/writes
- ✅ **REST API**: Complete workflow, session, and store management
- ✅ **Auto Migration**: Seamless upgrade from JSON files
- ✅ **Production Ready**: 41 tests, all passing
- ✅ **Zero Config**: Embedded database, no separate server needed

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Run tests
npm test
```

Server runs on `http://localhost:3001`

## API Endpoints

### Workflows

```bash
# Create workflow
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workflow",
    "description": "Test workflow",
    "nodes": [],
    "edges": []
  }'

# Get all workflows
curl http://localhost:3001/api/workflows

# Get workflow by ID
curl http://localhost:3001/api/workflows/{id}

# Update workflow
curl -X PUT http://localhost:3001/api/workflows/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete workflow
curl -X DELETE http://localhost:3001/api/workflows/{id}

# Execute workflow
curl -X POST http://localhost:3001/api/workflows/{id}/execute \
  -H "Content-Type: application/json" \
  -d '{"context": {"key": "value"}}'
```

### Store (Key-Value)

```bash
# Set multiple values
curl -X POST http://localhost:3001/api/store \
  -H "Content-Type: application/json" \
  -d '{"key1": "value1", "key2": {"nested": "value"}}'

# Get all store state
curl http://localhost:3001/api/store

# Get value by key
curl http://localhost:3001/api/store/key1

# Set single value
curl -X PUT http://localhost:3001/api/store/mykey \
  -H "Content-Type: application/json" \
  -d '{"value": "myvalue"}'

# Delete value
curl -X DELETE http://localhost:3001/api/store/key1

# Use namespaces
curl http://localhost:3001/api/store?namespace=production
```

### Sessions

```bash
# Create session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"data": {"user": "test"}}'

# Get all sessions
curl http://localhost:3001/api/sessions

# Get active sessions only
curl http://localhost:3001/api/sessions?status=active

# Update session
curl -X PUT http://localhost:3001/api/sessions/{id} \
  -H "Content-Type: application/json" \
  -d '{"data": {"updated": true}}'

# Extend session expiration
curl -X POST http://localhost:3001/api/sessions/{id}/extend \
  -H "Content-Type: application/json" \
  -d '{"extensionMs": 3600000}'

# Terminate session
curl -X POST http://localhost:3001/api/sessions/{id}/terminate

# Cleanup expired sessions
curl -X POST http://localhost:3001/api/sessions/cleanup
```

### Health Check

```bash
curl http://localhost:3001/health
```

Response includes database statistics:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-27T23:45:00.000Z",
  "service": "gemini-flow-backend",
  "database": {
    "workflows": 10,
    "sessions": 5,
    "storeEntries": 23,
    "walMode": true
  }
}
```

## Database

### Technology

- **Database**: SQLite 3
- **Library**: better-sqlite3 (synchronous, fast, production-ready)
- **Mode**: WAL (Write-Ahead Logging)
- **Location**: `backend/data/gemini-flow.db`

### Why SQLite?

1. **ACID Transactions**: All operations are atomic
2. **Concurrency Safe**: WAL mode allows concurrent reads
3. **Zero Configuration**: No separate database server
4. **High Performance**: 7,000+ ops/sec for writes
5. **Embedded**: Single file, easy backups
6. **Production Ready**: Used by VS Code, Electron, Firefox

### Schema

- **workflows**: Store workflow definitions
- **sessions**: Manage user/execution sessions
- **store_state**: Key-value store with namespaces

See [DATABASE.md](docs/DATABASE.md) for complete documentation.

### Migration

Automatically migrates from JSON files on first run:
- `data/workflows.json` → SQLite
- `data/sessions.json` → SQLite
- `data/store.json` → SQLite

Original files renamed to `*.json.migrated` as backup.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### Test Results

```
✓ Database Layer Tests:  21 passed
✓ API Integration Tests: 20 passed
✓ Total:                 41 passed

Coverage:
  Statements   : 95%
  Branches     : 87%
  Functions    : 100%
  Lines        : 95%
```

### Concurrency Tests

All race condition tests pass:
- ✅ Concurrent workflow updates (no data loss)
- ✅ Concurrent creations (all succeed)
- ✅ Concurrent deletes (properly serialized)
- ✅ Store updates (atomic UPSERT)

## Project Structure

```
backend/
├── src/
│   ├── server.js              # Main server entry point
│   ├── db/
│   │   └── database.js        # Atomic SQLite database layer
│   ├── api/
│   │   ├── routes/
│   │   │   ├── workflows.js   # Workflow API routes
│   │   │   ├── sessions.js    # Session API routes
│   │   │   └── store.js       # Store API routes
│   │   ├── services/
│   │   │   ├── WorkflowService.js
│   │   │   ├── SessionService.js
│   │   │   └── StoreService.js
│   │   └── gemini/
│   │       └── index.js       # Gemini AI routes
│   └── __tests__/
│       ├── database.test.js   # Database unit tests
│       └── api.test.js        # API integration tests
├── data/
│   └── gemini-flow.db         # SQLite database (created on first run)
├── docs/
│   └── DATABASE.md            # Complete database documentation
├── package.json
└── jest.config.json
```

## Environment Variables

```bash
# Server port (default: 3001)
PORT=3001

# Database directory (default: backend/data)
DB_DIR=/path/to/data

# CORS origins (default: localhost:5173,3000)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Performance

### Benchmarks

```
Operation               | Time    | Throughput
------------------------|---------|------------
Create workflow         | 2-3 ms  | 333-500/sec
Update workflow         | 1-2 ms  | 500-1000/sec
100 sequential writes   | 13 ms   | 7,692/sec
1000 store updates      | 811 ms  | 1,233/sec
Concurrent 10 updates   | 4 ms    | No data loss
```

### Optimization

- WAL mode enabled for concurrent reads
- Indices on frequently queried columns
- Transactions for atomic operations
- Synchronous API (no async overhead)

## Security

### SQL Injection Prevention

All queries use parameterized statements:

```javascript
// ✓ Safe
db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);

// ✗ Never do this
db.prepare(`SELECT * FROM workflows WHERE id = '${id}'`).get();
```

### Input Validation

Services validate all input:

```javascript
if (!workflowData.name) {
  throw new Error('Workflow name is required');
}
```

### Foreign Keys

Enforced at database level:

```sql
FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
```

## Troubleshooting

### Database Locked

If you get "database is locked" errors:

```bash
# Stop server
pkill -f "node.*server.js"

# Remove WAL files
rm backend/data/gemini-flow.db-wal
rm backend/data/gemini-flow.db-shm

# Restart
npm start
```

### Reset Database

To start fresh (WARNING: deletes all data):

```bash
rm -rf backend/data/gemini-flow.db*
npm start  # Will create new database
```

### View Database

```bash
# Install SQLite CLI
brew install sqlite  # macOS
apt install sqlite3  # Ubuntu

# Open database
sqlite3 backend/data/gemini-flow.db

# Run queries
SELECT * FROM workflows;
.tables
.schema
.exit
```

## Contributing

1. Make changes
2. Run tests: `npm test`
3. Ensure all tests pass
4. Submit PR

## License

MIT

## Documentation

- [Complete Database Documentation](docs/DATABASE.md)
- [API Reference](docs/API.md) (coming soon)
- [Architecture Overview](docs/ARCHITECTURE.md) (coming soon)

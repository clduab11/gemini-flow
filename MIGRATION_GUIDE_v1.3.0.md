# 🔄 Migration Guide: v1.2.x → v1.3.0

## Overview

This guide provides step-by-step instructions for migrating from Gemini-Flow v1.2.x to v1.3.0. This major release introduces significant architectural improvements, Google Services integration, and enhanced agent coordination capabilities.

## ⚠️ Breaking Changes

### 1. Configuration Structure Changes

#### Old Configuration (v1.2.x)
```typescript
const flow = new GeminiFlow({
  mode: 'enterprise',
  agentLimit: 50
});
```

#### New Configuration (v1.3.0)
```typescript
const flow = new GeminiFlow({
  protocols: ['a2a', 'mcp'],  // Required: Protocol specification
  topology: 'hierarchical',   // Required: Network topology
  maxAgents: 66,             // Changed: agentLimit → maxAgents
  consensus: 'byzantine-fault-tolerant'
});
```

### 2. Agent Spawn API Changes

#### Old API (v1.2.x)
```typescript
await geminiFlow.spawn({ count: 10 });
```

#### New API (v1.3.0)
```typescript
await geminiFlow.agents.spawn({ 
  count: 10,
  coordination: 'intelligent',
  protocols: ['a2a', 'mcp'],
  specialization: 'enterprise'
});
```

### 3. Environment Variables

#### Removed Environment Variables
- `GEMINI_FLOW_MODE` (replaced by protocol configuration)
- `AGENT_LIMIT` (replaced by maxAgents in config)
- `SIMPLE_MODE` (replaced by topology specification)

#### New Required Environment Variables
```bash
# Google Services Integration (if using Google services)
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
GOOGLE_PROJECT_ID="your-project-id"
GOOGLE_REGION="us-central1"

# Protocol Configuration
GEMINI_FLOW_PROTOCOLS="a2a,mcp"
GEMINI_FLOW_TOPOLOGY="hierarchical"

# Performance Settings
MAX_AGENTS=66
CONSENSUS_ALGORITHM="byzantine-fault-tolerant"
```

### 4. Database Schema Changes

The database schema has been updated to support new features:

#### New Tables
- `agent_spaces` - Agent environment virtualization
- `consensus_logs` - Byzantine consensus tracking
- `multimedia_cache` - Media processing cache
- `security_audit` - Security event logging

#### Modified Tables
- `agents` table: Added `coordination_protocol`, `spatial_context`, `specialization`
- `tasks` table: Added `consensus_required`, `multimedia_assets`, `security_level`

## 🔧 Automatic Migration

### Step 1: Backup Current Installation
```bash
# Backup configuration
cp .gemini-flow/config.json .gemini-flow/config-v1.2.backup.json

# Backup database
cp .gemini-flow/database.sqlite .gemini-flow/database-v1.2.backup.sqlite

# Backup custom configurations
tar -czf gemini-flow-v1.2-backup.tar.gz .gemini-flow/
```

### Step 2: Install v1.3.0
```bash
# Update global installation
npm uninstall -g @clduab11/gemini-flow
npm install -g @clduab11/gemini-flow@1.3.0

# Or update local installation
npm update @clduab11/gemini-flow@1.3.0
```

### Step 3: Run Migration Script
```bash
# Run automatic migration
gemini-flow migrate --from 1.2.x --to 1.3.0 --auto

# Review migration log
cat .gemini-flow/migration-log-v1.3.0.txt

# Verify migration success
gemini-flow config validate
```

### Step 4: Update Configuration
```bash
# Generate new configuration with defaults
gemini-flow config generate --version 1.3.0

# Or use interactive setup
gemini-flow setup --interactive
```

## 📋 Manual Migration Steps

### 1. Update Package Dependencies

#### package.json Changes
```json
{
  "dependencies": {
    "@clduab11/gemini-flow": "^1.3.0",
    "ws": "^8.14.2",
    "redis": "^4.6.10",
    "prom-client": "^15.0.0",
    "sharp": "^0.33.0",
    "canvas": "^2.11.2"
  }
}
```

### 2. Configuration File Migration

#### Create new .gemini-flow/config.v1.3.0.json
```json
{
  "version": "1.3.0",
  "protocols": {
    "a2a": {
      "enabled": true,
      "messageTimeout": 5000,
      "retryAttempts": 3,
      "encryption": "AES-256-GCM"
    },
    "mcp": {
      "enabled": true,
      "contextSyncInterval": 100,
      "modelCoordination": "intelligent",
      "fallbackStrategy": "round-robin"
    }
  },
  "swarm": {
    "maxAgents": 66,
    "topology": "hierarchical",
    "consensus": "byzantine-fault-tolerant",
    "coordinationProtocol": "a2a"
  },
  "google": {
    "projectId": "${GOOGLE_PROJECT_ID}",
    "region": "${GOOGLE_REGION}",
    "services": {
      "gemini": { "enabled": true },
      "vertex": { "enabled": true },
      "veo3": { "enabled": false },
      "imagen4": { "enabled": false },
      "chirp": { "enabled": false },
      "lyria": { "enabled": false }
    }
  },
  "performance": {
    "sqliteOps": 396610,
    "routingLatency": 75,
    "a2aLatency": 25,
    "parallelTasks": 10000
  },
  "monitoring": {
    "enabled": true,
    "prometheus": true,
    "grafana": true,
    "tracing": true
  }
}
```

### 3. Code Updates

#### Update Import Statements
```typescript
// Old imports (v1.2.x)
import { GeminiFlow } from '@clduab11/gemini-flow';

// New imports (v1.3.0)
import { 
  GeminiFlow, 
  AgentSpace, 
  GoogleServices,
  MultimediaProcessor 
} from '@clduab11/gemini-flow';
```

#### Update Agent Initialization
```typescript
// Old initialization (v1.2.x)
const flow = new GeminiFlow();
await flow.initializeAgents(10);

// New initialization (v1.3.0)
const flow = new GeminiFlow({
  protocols: ['a2a', 'mcp'],
  topology: 'hierarchical'
});

await flow.agents.spawn({
  count: 10,
  specialization: 'general',
  coordination: 'intelligent'
});
```

### 4. Database Migration

#### Run Schema Updates
```bash
# Connect to database and run migrations
gemini-flow db migrate --version 1.3.0

# Verify schema
gemini-flow db validate --schema
```

#### SQL Migration Script (if manual)
```sql
-- Add new columns to existing tables
ALTER TABLE agents ADD COLUMN coordination_protocol TEXT DEFAULT 'a2a';
ALTER TABLE agents ADD COLUMN spatial_context TEXT;
ALTER TABLE agents ADD COLUMN specialization TEXT DEFAULT 'general';

ALTER TABLE tasks ADD COLUMN consensus_required BOOLEAN DEFAULT 0;
ALTER TABLE tasks ADD COLUMN multimedia_assets TEXT;
ALTER TABLE tasks ADD COLUMN security_level INTEGER DEFAULT 1;

-- Create new tables
CREATE TABLE agent_spaces (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  virtual_environment TEXT,
  spatial_coordinates TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE consensus_logs (
  id TEXT PRIMARY KEY,
  proposal_id TEXT,
  vote_result TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_votes TEXT
);

CREATE TABLE multimedia_cache (
  id TEXT PRIMARY KEY,
  asset_type TEXT,
  asset_data BLOB,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security_audit (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  agent_id TEXT,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Validation Steps

### 1. Verify Installation
```bash
# Check version
gemini-flow --version
# Should output: 1.3.0

# Verify configuration
gemini-flow config validate
# Should output: ✅ Configuration valid

# Test basic functionality
gemini-flow test --basic
```

### 2. Test Agent Coordination
```bash
# Test A2A protocol
gemini-flow test --protocol a2a

# Test MCP integration
gemini-flow test --protocol mcp

# Test consensus mechanism
gemini-flow test --consensus
```

### 3. Performance Validation
```bash
# Run performance benchmarks
gemini-flow benchmark --quick

# Test load handling
gemini-flow test --load 1000

# Verify monitoring
gemini-flow monitor --validate
```

## 🐛 Common Migration Issues

### Issue 1: Configuration Validation Errors
```bash
# Error: "Unknown configuration option 'mode'"
# Solution: Remove deprecated options
gemini-flow config clean --deprecated
```

### Issue 2: Agent Spawn Failures
```bash
# Error: "Agent spawn timeout"
# Solution: Update spawn configuration
gemini-flow config set agents.spawnTimeout 10000
```

### Issue 3: Database Schema Conflicts
```bash
# Error: "Table 'agents' has no column named 'coordination_protocol'"
# Solution: Force schema migration
gemini-flow db migrate --force --backup
```

### Issue 4: Google Services Authentication
```bash
# Error: "Application Default Credentials not found"
# Solution: Setup authentication
gcloud auth application-default login
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

## 📊 Performance Comparison

### Before (v1.2.x)
- Agent spawn time: ~180ms
- SQLite operations: ~270k ops/sec
- Memory usage: ~3.2GB (1000 agents)
- Routing latency: ~100ms

### After (v1.3.0)
- Agent spawn time: <100ms (44% improvement)
- SQLite operations: 396k ops/sec (32% improvement)
- Memory usage: ~1.8GB (1000 agents) (44% improvement)
- Routing latency: <75ms (25% improvement)

## 🔄 Rollback Plan

If migration fails, you can rollback:

```bash
# Stop current services
gemini-flow stop

# Restore backup
tar -xzf gemini-flow-v1.2-backup.tar.gz

# Reinstall v1.2.x
npm uninstall -g @clduab11/gemini-flow
npm install -g @clduab11/gemini-flow@1.2.1

# Restart services
gemini-flow start
```

## 📞 Support

If you encounter issues during migration:

1. **Check Migration Logs**: `.gemini-flow/migration-log-v1.3.0.txt`
2. **Review Documentation**: [Migration FAQ](https://github.com/clduab11/gemini-flow/wiki/Migration-FAQ)
3. **Community Support**: [Discord](https://discord.gg/gemini-flow)
4. **GitHub Issues**: [Report Migration Issues](https://github.com/clduab11/gemini-flow/issues/new?template=migration-issue.md)

## ✅ Post-Migration Checklist

- [ ] Configuration validated successfully
- [ ] All agents spawn without errors
- [ ] A2A and MCP protocols functional
- [ ] Database schema updated
- [ ] Performance benchmarks meet targets
- [ ] Google Services authentication working (if enabled)
- [ ] Monitoring and alerting operational
- [ ] Backup and rollback plan tested
- [ ] Team trained on new features
- [ ] Documentation updated

---

**Migration completed successfully? [Let us know!](https://github.com/clduab11/gemini-flow/discussions/migration-success)**
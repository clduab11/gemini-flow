# Migration Guide: Claude-Flow to Gemini-Flow

This guide helps you migrate from Claude-Flow v2.0.0 to Gemini-Flow v2.0.0, leveraging Google's Gemini models and ecosystem.

## 🚀 Overview

Gemini-Flow maintains 100% feature parity with Claude-Flow while adding:
- 10 additional specialized agents (64 total vs 54)
- Native Google Workspace integration
- 1M-2M token context windows
- 75% cost reduction through context caching
- Enhanced performance (2.8-4.4x improvements)

## 📦 Installation

### 1. Uninstall Claude-Flow (Optional)
```bash
npm uninstall -g claude-flow
```

### 2. Install Gemini-Flow
```bash
npm install -g gemini-flow@alpha
```

### 3. Verify Installation
```bash
gemini-flow --version
# Should output: 2.0.0-alpha
```

## 🔧 Configuration Migration

### API Key Setup

**Claude-Flow:**
```bash
claude-flow config set api.key YOUR_CLAUDE_API_KEY
```

**Gemini-Flow:**
```bash
gemini-flow config set api.key YOUR_GEMINI_API_KEY
```

### Model Configuration

**Claude-Flow models:**
- claude-3-opus
- claude-3-sonnet
- claude-3-haiku

**Gemini-Flow models:**
- gemini-2.0-flash (recommended)
- gemini-1.5-flash
- gemini-1.5-pro
- gemini-2.0-pro

```bash
# Set default model
gemini-flow config set model.default "gemini-2.0-flash"
gemini-flow config set model.fallback "gemini-1.5-flash"
```

## 📁 Project Structure Migration

### Settings Files

**Claude-Flow:**
```
.claude/
├── settings.json
├── CLAUDE.md
└── commands/
```

**Gemini-Flow:**
```
.gemini/
├── settings.json
├── GEMINI.md
└── commands/
```

### Automated Migration
```bash
# Run migration script
gemini-flow migrate --from-claude-flow --path .
```

This will:
- Copy and adapt `.claude/` to `.gemini/`
- Update agent configurations
- Migrate memory databases
- Convert hook configurations

## 🤖 Agent Mapping

### Core Agents (Same)
Both platforms share these core agents:
- coder, planner, researcher, reviewer, tester

### New Agents in Gemini-Flow
10 additional agents:
1. **Quantum Computing** (3): quantum-circuit-designer, qubit-state-manager, quantum-algorithm-specialist
2. **Consensus** (3): paxos-coordinator, blockchain-consensus, vector-clock-sync
3. **GitHub** (1): dependency-updater
4. **Performance** (1): resource-allocator
5. **Creative** (2): ui-designer, ux-researcher

### Agent Spawn Changes

**Claude-Flow:**
```javascript
await claudeFlow.spawnAgent('coder', { temperature: 0.7 });
```

**Gemini-Flow:**
```javascript
await geminiFlow.spawnAgent('coder', { 
  temperature: 0.7,
  modelPreference: 'gemini-2.0-flash' // New option
});
```

## 🔄 Command Differences

### MCP Tools

**Claude-Flow prefix:** `mcp__claude-flow__`
**Gemini-Flow prefix:** `gemini_flow_`

Example migration:
```javascript
// Claude-Flow
mcp__claude-flow__swarm_init

// Gemini-Flow
gemini_flow_swarm_init
```

### CLI Commands

Most commands remain the same:
```bash
# Both platforms
npx gemini-flow swarm init --topology hierarchical --agents 8
npx gemini-flow agent spawn --type coder
npx gemini-flow task orchestrate "Build REST API"
```

### New Commands in Gemini-Flow
```bash
# Google Workspace integration
gemini-flow workspace analyze --sheets "spreadsheet-id"
gemini-flow workspace generate --template report

# Enhanced monitoring
gemini-flow monitor bottlenecks --realtime
gemini-flow benchmark run --compare-claude-flow
```

## 🧩 Code Migration

### Import Changes

**Claude-Flow:**
```typescript
import { ClaudeFlow } from 'claude-flow';
import { MCPAdapter } from 'claude-flow/mcp';
```

**Gemini-Flow:**
```typescript
import { GeminiFlow } from 'gemini-flow';
import { MCPToGeminiAdapter } from 'gemini-flow/adapters';
```

### API Client Initialization

**Claude-Flow:**
```typescript
const flow = new ClaudeFlow({
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-opus'
});
```

**Gemini-Flow:**
```typescript
const flow = new GeminiFlow({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash',
  contextCaching: true, // New: Enable caching
  workspaceIntegration: true // New: Google Workspace
});
```

### Swarm Initialization

**Claude-Flow:**
```typescript
const swarm = await flow.initSwarm({
  topology: 'hierarchical',
  maxAgents: 8
});
```

**Gemini-Flow:**
```typescript
const swarm = await flow.initSwarm({
  topology: 'hierarchical',
  maxAgents: 8,
  optimization: { // New options
    targetSpawnTime: 100, // ms
    enableBatchTool: true,
    contextWindow: '1M'
  }
});
```

## 💾 Memory Migration

### Database Schema
Gemini-Flow extends the memory schema with 4 additional tables:
- `google_workspace` - Google integration data
- `bottlenecks` - Performance tracking
- `hooks` - Automation configuration
- `sessions` - Session management

### Migration Script
```bash
# Migrate existing memory
gemini-flow migrate memory --from .swarm/memory.db --to .gemini/memory.db
```

## 🌐 Google Workspace Integration

New capability in Gemini-Flow:

```typescript
// Initialize Google Workspace
const workspace = await flow.initWorkspace({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET
});

// Use integrated features
await workspace.analyzeSpreadsheet('sheet-id', 'A1:Z1000', 'statistical');
await workspace.createDocument('Report', generatedContent);
await workspace.createPresentation('Slides', slideData);
```

## ⚡ Performance Optimizations

### Context Caching (75% cost reduction)
```typescript
// Enable caching
const flow = new GeminiFlow({
  contextCaching: true,
  cacheStrategy: 'aggressive'
});
```

### Batch Operations
```typescript
// Claude-Flow: Sequential
for (const agent of agents) {
  await flow.spawnAgent(agent);
}

// Gemini-Flow: Parallel with BatchTool
await flow.batchSpawn(agents); // <100ms per agent
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure you're using a Gemini API key, not Claude
   - Check key permissions for all required scopes

2. **Model Not Found**
   - Update model names to Gemini equivalents
   - Use `gemini-2.0-flash` as default

3. **Memory Compatibility**
   - Run migration script for database compatibility
   - Check table schema updates

4. **Agent Spawn Timeout**
   - Verify BatchTool is enabled
   - Check resource allocation settings

### Debug Mode
```bash
# Enable debug logging
gemini-flow --debug swarm init
```

## 📚 Additional Resources

- [Gemini-Flow Documentation](https://gemini-flow.dev/docs)
- [API Reference](https://gemini-flow.dev/api)
- [Examples Repository](https://github.com/gemini-flow/examples)
- [Support Discord](https://discord.gg/gemini-flow)

## 🎯 Migration Checklist

- [ ] Install Gemini-Flow globally
- [ ] Obtain Gemini API key
- [ ] Run project migration script
- [ ] Update import statements
- [ ] Migrate API client initialization
- [ ] Update model references
- [ ] Migrate memory databases
- [ ] Test agent spawning
- [ ] Verify performance improvements
- [ ] Enable Google Workspace (optional)

## 🙏 Need Help?

- GitHub Issues: [gemini-flow/issues](https://github.com/gemini-flow/gemini-flow/issues)
- Migration Support: support@gemini-flow.dev
- Community Forum: [discuss.gemini-flow.dev](https://discuss.gemini-flow.dev)

---

*Thank you for migrating to Gemini-Flow! We're excited to see what you build with the power of Google's AI ecosystem.*
# Gemini Flow Configuration

This directory contains the configuration files for Gemini Flow orchestration.

## Files

### config.json
Core configuration for Gemini Flow:
- **model**: Target Gemini model (gemini-pro, gemini-ultra, etc.)
- **concurrency**: Maximum parallel operations
- **memory**: Persistent memory settings
- **batchtools**: Parallel execution configuration
- **sparc**: SPARC methodology settings
- **performance**: Monitoring and optimization

### agents.json
Agent definitions organized by category:
- **core**: Essential development agents (coder, reviewer, tester, etc.)
- **specialized**: Domain-specific agents (system-architect, backend-dev, etc.)
- **coordination**: Orchestration agents (task-orchestrator, memory-coordinator)

## Usage

Configuration is automatically loaded by Gemini Flow CLI:

```bash
# Initialize with current config
npx gemini-flow init

# Override specific settings
npx gemini-flow --model gemini-ultra --concurrency 12

# Validate configuration
npx gemini-flow config validate
```

## Customization

### Adding New Agents

Edit `agents.json` to add new agent types:

```json
{
  "type": "custom-agent",
  "description": "Custom functionality",
  "capabilities": ["feature1", "feature2"],
  "priority": "medium"
}
```

### Performance Tuning

Adjust `config.json` for your hardware:

```json
{
  "concurrency": 16,
  "memory": {
    "ttl": "48h"
  },
  "batchtools": {
    "maxOperations": 20
  }
}
```

## Environment Variables

Override config with environment variables:
- `GEMINI_MODEL`: Model selection
- `GEMINI_CONCURRENCY`: Parallel operations
- `GEMINI_MEMORY_TTL`: Memory persistence duration

## Migration from Claude Flow

Configuration has been migrated from `.claude/` to `.gemini/`:
- Settings preserved and optimized for Gemini models
- Agent definitions updated for current capabilities
- Legacy configuration archived in `tools/migration/legacy/`
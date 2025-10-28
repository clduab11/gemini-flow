# Gemini Flow - Gemini CLI Extension

Official Gemini CLI Extension for the gemini-flow AI orchestration platform.

## Overview

This extension packages gemini-flow's comprehensive AI orchestration capabilities into a Gemini CLI installable extension, providing:

- **9 MCP Servers**: Redis, Git Tools, Puppeteer, Sequential Thinking, Filesystem, GitHub, Mem0 Memory, Supabase, Omnisearch
- **7 Custom Commands**: hive-mind, swarm, agent, memory, task, sparc, workspace
- **Auto-loading Context**: Automatic GEMINI.md context integration
- **Agent Coordination**: Multi-agent workflows and swarm intelligence

## Installation

### From GitHub

```bash
# Install from GitHub repository
gemini extensions install https://github.com/clduab11/gemini-flow
```

> **Note**: Always use the full GitHub URL. The `github:username/repo` shorthand is not supported by Gemini CLI.

### From Local Directory

```bash
# Install from local clone
cd /path/to/gemini-flow
gemini extensions install .
```

## Usage

### Enable/Disable Extension

```bash
# Enable the extension
gemini extensions enable gemini-flow

# Disable the extension
gemini extensions disable gemini-flow

# Check extension status
gemini extensions list
```

### Custom Commands

Once enabled, you can use gemini-flow commands directly in Gemini CLI:

```bash
# Hive mind operations
gemini hive-mind spawn "Build AI application"
gemini hive-mind status

# Agent swarms
gemini swarm init --nodes 10
gemini swarm spawn --objective "Research task"

# Individual agents
gemini agent spawn researcher --count 3
gemini agent list

# Memory operations
gemini memory store "key" "value" --namespace project
gemini memory query "pattern"

# Task management
gemini task create "Implement feature X" --priority high
gemini task assign TASK_ID --agent AGENT_ID

# SPARC mode
gemini sparc init --mode specification
gemini sparc completion

# Workspace management
gemini workspace init
gemini workspace sync
```

### MCP Servers

The extension automatically configures 9 MCP servers:

1. **Redis** - Key-value storage and caching
2. **Git Tools** - Git operations
3. **Puppeteer** - Browser automation  
4. **Sequential Thinking** - Planning and reasoning
5. **Filesystem** - File operations
6. **GitHub** - GitHub integration
7. **Mem0 Memory** - Memory management
8. **Supabase** - Database operations
9. **Omnisearch** - Multi-source research

All servers are configured with optimal settings and ready to use.

## Configuration

### Environment Variables

Some MCP servers require API keys:

```bash
# GitHub server
export GITHUB_PERSONAL_ACCESS_TOKEN="your-token"

# Supabase server
export SUPABASE_ACCESS_TOKEN="your-token"

# Omnisearch server (multiple providers)
export TAVILY_API_KEY="your-key"
export PERPLEXITY_API_KEY="your-key"
export KAGI_API_KEY="your-key"
export JINA_AI_API_KEY="your-key"
export BRAVE_API_KEY="your-key"
export FIRECRAWL_API_KEY="your-key"
```

### Extension Settings

Configure the extension behavior:

```json
{
  "enableAllMCPServers": true,
  "autoLoadContext": true,
  "defaultAgentCount": 5
}
```

## Features

### Hive Mind

Collective intelligence coordination:
- Byzantine fault-tolerant consensus
- Distributed decision-making
- Shared memory and learning
- Multi-agent coordination

### Swarm Intelligence

Coordinated agent swarms:
- Dynamic agent spawning
- Task distribution
- Real-time monitoring
- Performance optimization

### Memory Management

Persistent memory system:
- Namespaced storage
- Pattern-based retrieval
- Export/import capabilities
- SQLite backend (396,610 ops/sec)

### SPARC Mode

Structured problem-solving:
- Specification
- Pseudocode
- Architecture
- Refinement
- Completion

## Documentation

- **Main Documentation**: [gemini-flow.md](../../gemini-flow.md)
- **Context Guide**: [GEMINI.md](../../GEMINI.md)
- **API Reference**: [docs/api/](../../docs/api/)
- **Examples**: [docs/examples/](../../docs/examples/)

## Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0
- Redis (for Redis MCP server)
- Python 3.8+ (for Git Tools server)

## Troubleshooting

### Extension Not Loading

```bash
# Check extension status
gemini extensions list

# Re-enable extension
gemini extensions disable gemini-flow
gemini extensions enable gemini-flow
```

### MCP Server Issues

```bash
# Verify MCP configuration
cat ~/.gemini/mcp-config.json

# Check server logs
gemini extensions info gemini-flow
```

### Command Not Found

Ensure the extension is enabled:

```bash
gemini extensions enable gemini-flow
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

MIT - See [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: https://github.com/clduab11/gemini-flow/issues
- **Documentation**: https://github.com/clduab11/gemini-flow/wiki
- **Discussions**: https://github.com/clduab11/gemini-flow/discussions

---

**Version**: 1.3.3  
**Author**: clduab11  
**Repository**: https://github.com/clduab11/gemini-flow

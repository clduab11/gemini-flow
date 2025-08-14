# Query Command Examples

The `gemini-flow query` command provides intelligent web research using a mini-swarm that combines MCP web research tools with Gemini Flash (free tier) for comprehensive knowledge gathering.

## Basic Usage

```bash
# Simple query
gemini-flow query "What is quantum computing?"

# With depth control
gemini-flow query "Latest AI developments in 2024" --depth deep

# Detailed format with more sources
gemini-flow query "How does blockchain work?" --format detailed --sources 10

# Structured output for parsing
gemini-flow query "Climate change impacts" --format structured
```

## Query Options

- `--depth <level>`: Control search depth
  - `shallow`: Quick search (3 sources)
  - `medium`: Standard search (5 sources) [default]
  - `deep`: Comprehensive search (10 sources)

- `--sources <number>`: Number of sources to gather (default: 5)

- `--format <type>`: Output format
  - `summary`: Concise summary [default]
  - `detailed`: Include source excerpts
  - `structured`: Machine-readable format

- `--no-cache`: Disable result caching

- `--timeout <ms>`: Query timeout in milliseconds (default: 30000)

## Advanced Examples

### Research Complex Topics

```bash
gemini-flow query "Compare RAFT vs Paxos consensus algorithms" \
  --depth deep \
  --format detailed \
  --sources 15
```

### Quick Fact Checking

```bash
gemini-flow query "Is Python faster than JavaScript?" \
  --depth shallow \
  --format summary
```

### Academic Research

```bash
gemini-flow query "Machine learning applications in healthcare 2024" \
  --depth deep \
  --format structured \
  --sources 20
```

### Current Events

```bash
gemini-flow query "Latest developments in quantum computing" \
  --no-cache \
  --format detailed
```

## Output Structure

### Summary Format (default)

- Query echo
- Comprehensive summary
- Key insights (3-5 points)
- Related queries for exploration
- Performance metrics

### Detailed Format

- All summary format content
- Source excerpts with confidence scores
- Source types (web, gemini, mcp)

### Structured Format

- JSON-formatted output
- Machine-readable structure
- Full metadata included

## Mini-Swarm Architecture

The query command uses a specialized mini-swarm with 3 agents:

1. **Web Researcher Agent**: Uses MCP web research tools
2. **Gemini Analyst Agent**: Leverages Gemini Flash (free tier)
3. **Result Synthesizer Agent**: Combines and structures findings

## Performance Optimization

- **Free Tier Usage**: Optimized for Gemini Flash free tier
- **Parallel Execution**: All agents work simultaneously
- **Smart Caching**: Results cached for 1 hour
- **Token Efficiency**: Minimal token usage for cost optimization

## Integration with Other Commands

```bash
# Use query results to spawn specialized agents
gemini-flow query "Best practices for REST API design"
gemini-flow agent spawn backend-dev --task "Implement REST API following best practices"

# Research before starting SPARC development
gemini-flow query "TDD best practices for TypeScript"
gemini-flow sparc tdd "Create user authentication system"

# Gather context for swarm operations
gemini-flow query "Distributed consensus algorithms comparison"
gemini-flow swarm init --topology mesh --agents 8
```

## Tips for Effective Queries

1. **Be Specific**: More specific queries yield better results
2. **Use Depth Wisely**: Deep searches take longer but provide comprehensive coverage
3. **Check Cache**: Repeated queries use cached results for speed
4. **Combine Tools**: The mini-swarm leverages multiple research methods
5. **Follow Up**: Use related queries for deeper exploration

## Example Output

```
📊 Query Results
──────────────────────────────────────────────────

Query: What is quantum computing?

📝 Summary:
Quantum computing is a revolutionary computing paradigm that leverages quantum mechanical phenomena like superposition and entanglement to process information in fundamentally different ways than classical computers...

💡 Key Insights:
  1. Uses qubits instead of classical bits, enabling superposition states
  2. Capable of solving certain problems exponentially faster than classical computers
  3. Current applications include cryptography, drug discovery, and optimization
  4. Major challenges include decoherence and error correction
  5. Companies like IBM, Google, and Microsoft are leading development

🔗 Related Queries:
  1. Quantum supremacy vs quantum advantage
  2. Quantum error correction methods
  3. Quantum computing programming languages
  4. Commercial quantum computing applications

📈 Performance:
  Duration: 1823.45ms
  Tokens: 4521
  Cost: $0.000045
  Cache: ❌ Miss
```

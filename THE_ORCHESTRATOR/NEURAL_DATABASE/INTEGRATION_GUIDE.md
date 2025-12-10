# 🧠 Neural Database Integration Guide

## Quick Start - Get Neural Memory in 2 Minutes

### 1. Start the Database

```bash
cd NEURAL_DATABASE
docker-compose up -d

# Verify it's running
docker ps | grep neural
```

The database is now running at `localhost:5432` with:
- Username: `neural`
- Password: `neural`
- Database: `neural_memory`

Optional: View database at http://localhost:5050 (pgAdmin)

### 2. Install Python Client

```bash
pip install asyncpg pgvector numpy
```

### 3. Use in ANY Python Script

```python
import asyncio
from NEURAL_DATABASE.neural_db import NeuralMemoryManager

async def main():
    # Initialize once
    memory = NeuralMemoryManager()
    await memory.initialize()

    # Remember something
    await memory.remember(
        "successful_api_pattern",
        {"method": "retry with backoff", "max_retries": 3}
    )

    # Later, recall it
    patterns = await memory.recall("how to handle API errors")
    for pattern, confidence in patterns:
        print(f"Found: {pattern.pattern_key} ({confidence:.0%})")

    await memory.shutdown()

asyncio.run(main())
```

## Integration with Your Systems

### For SOVEREIGN_AGENTS

```python
# Add to SOVEREIGN_AGENTS/06_LIVING/run.py

import asyncio
import sys
from pathlib import Path

# Add Neural Database to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "NEURAL_DATABASE"))

from neural_db import NeuralMemoryManager

# Global memory manager
MEMORY = None

async def init_neural():
    global MEMORY
    MEMORY = NeuralMemoryManager()
    await MEMORY.initialize()
    await MEMORY.start_session("SOVEREIGN_AGENTS")
    print("🧠 Neural Memory Active")

# In your main function
async def main():
    await init_neural()

    # Now use it anywhere
    async def execute_task(task):
        # Check memory first
        similar = await MEMORY.recall(task.description)
        if similar:
            print(f"💡 Found {len(similar)} similar patterns")

        # Execute task...
        result = await original_execute(task)

        # Save if successful
        if result.success:
            await MEMORY.remember(
                f"task_{task.type}",
                {"approach": task.approach, "result": str(result)}
            )

        return result
```

### For CLI Sessions

```python
# neural_cli_wrapper.py

import asyncio
import subprocess
import sys
from neural_db import NeuralMemoryManager

async def wrapped_cli_command(cmd, args):
    # Initialize memory
    memory = NeuralMemoryManager()
    await memory.initialize()

    # Start session for this command
    await memory.start_session(f"cli_{cmd}")

    # Check for previous patterns
    query = ' '.join(args)
    similar = await memory.recall(query)

    if similar:
        print("🧠 Neural suggestions based on history:")
        for pattern, conf in similar[:3]:
            print(f"  • {pattern.content}")

    # Run actual command
    result = subprocess.run([cmd] + args, capture_output=True, text=True)

    # Track the interaction
    await memory.track(
        prompt=query,
        response=result.stdout,
        success=(result.returncode == 0)
    )

    # End session
    summary = await memory.end_session()
    print(f"\n📊 Session: {summary.get('interaction_count', 0)} interactions tracked")

    await memory.shutdown()
    return result.returncode

if __name__ == "__main__":
    asyncio.run(wrapped_cli_command(sys.argv[1], sys.argv[2:]))
```

### For LLM Integrations

```python
# llm_with_memory.py

import anthropic
from neural_db import NeuralMemoryManager

class MemoryEnabledLLM:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.memory = NeuralMemoryManager()

    async def initialize(self):
        await self.memory.initialize()
        await self.memory.start_session("llm_chat")

    async def chat(self, prompt: str) -> str:
        # Check memory for similar prompts
        similar = await self.memory.recall(prompt)

        context = ""
        if similar:
            context = "\n\nRelevant previous interactions:\n"
            for pattern, _ in similar[:3]:
                context += f"- {pattern.content}\n"

        # Call LLM with context
        response = self.client.messages.create(
            model="claude-3-opus-20240229",
            messages=[
                {"role": "user", "content": prompt + context}
            ]
        )

        # Track interaction
        await self.memory.track(
            prompt=prompt,
            response=response.content[0].text,
            success=True
        )

        return response.content[0].text

    async def shutdown(self):
        await self.memory.end_session()
        await self.memory.shutdown()
```

## Key Features

### 1. **Automatic Context Detection**

The system automatically detects your project context:

```python
# In project A
memory.remember("auth_pattern", {...})  # Saved to context: "projectA"

# In project B
patterns = memory.recall("auth")  # Only gets projectB patterns by default
```

### 2. **Cross-Context Bridges**

Share patterns between projects when they're similar enough:

```python
# Patterns with >85% similarity are auto-bridged
# Or manually bridge:
await memory.db.create_bridge(
    source_context="SOVEREIGN_AGENTS",
    target_context="new_project",
    pattern_id=pattern_id,
    confidence=0.9
)
```

### 3. **Vector Similarity Search**

All patterns are embedded for semantic search:

```python
# This will find related patterns even with different wording
patterns = await memory.recall("how to handle errors in API calls")
# Finds: "api_error_handling", "rest_retry_pattern", "http_exception_handler"
```

### 4. **Session Tracking**

Every session is tracked with metrics:

```python
summary = await memory.end_session()
print(f"""
Session Summary:
- Duration: {summary['duration_seconds']:.1f}s
- Interactions: {summary['interaction_count']}
- Cost: ${summary['total_cost_usd']:.4f}
- Tokens: {summary['total_tokens_used']}
""")
```

### 5. **Learning Events**

Track what the system learns:

```python
await memory.db.record_learning(
    session_id=session_id,
    event_type="pattern_discovered",
    insight="Retry with exponential backoff reduces API failures by 70%",
    confidence=0.85
)
```

## Environment Variables

```bash
# Database connection
export NEURAL_DB_URL=postgresql://neural:neural@localhost:5432/neural_memory

# Memory mode
export NEURAL_MODE=context  # or 'isolated' or 'global'

# Enable debug logging
export NEURAL_DEBUG=true
```

## Database Management

### View data in pgAdmin

1. Open http://localhost:5050
2. Login: admin@neural.local / admin
3. Add server:
   - Host: neural-db
   - Port: 5432
   - Username: neural
   - Password: neural

### Backup database

```bash
docker exec neural-memory-db pg_dump -U neural neural_memory > backup.sql
```

### Restore database

```bash
docker exec -i neural-memory-db psql -U neural neural_memory < backup.sql
```

### Clear all data

```bash
docker-compose down -v  # Removes volumes
docker-compose up -d    # Fresh start
```

## Advanced Features

### Custom Embeddings

```python
from neural_db import EmbeddingService

class CustomEmbeddings(EmbeddingService):
    async def generate_embedding(self, text: str) -> np.ndarray:
        # Use your preferred embedding model
        # OpenAI, Cohere, local model, etc.
        return your_model.embed(text)

memory = NeuralMemoryManager()
memory.embeddings = CustomEmbeddings()
```

### Pattern Relationships

```python
# Discover how patterns relate
relationships = await memory.db.get_pattern_relationships(pattern_id)
for rel in relationships:
    print(f"{rel['relationship_type']}: {rel['related_pattern_key']}")
```

### Global Insights

```python
# Get system-wide learnings
insights = await memory.db.get_global_insights(min_confidence=0.8)
for insight in insights:
    print(f"{insight['title']}: {insight['description']}")
    print(f"  Saves {insight['estimated_time_saved_minutes']} minutes")
```

## Performance Tips

1. **Use Redis cache** (included in docker-compose) for frequently accessed patterns
2. **Batch operations** when possible
3. **Index patterns** by type and context for faster retrieval
4. **Periodic cleanup** of old sessions with low value

## Monitoring

Check database performance:

```sql
-- Most used patterns
SELECT pattern_key, usage_count, success_count
FROM memory_patterns
ORDER BY usage_count DESC
LIMIT 10;

-- Active sessions
SELECT session_id, context, interaction_count, state
FROM sessions
WHERE state = 'active';

-- Cost tracking
SELECT DATE(started_at) as day, SUM(total_cost_usd) as cost
FROM sessions
GROUP BY DATE(started_at)
ORDER BY day DESC;
```

## The Power of Persistent Memory

With this database, EVERY interaction makes your system smarter:

- **Session 1:** Takes 10 minutes to solve a problem
- **Session 10:** Similar problem solved in 2 minutes using memories
- **Session 100:** System suggests optimal approach before you even start
- **Session 1000:** Emergent patterns you never explicitly programmed

The database IS the learning - persistent, searchable, shareable across all your tools!
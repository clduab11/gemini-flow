"""
Claude Adapter for Avstjälpningscentralen

Integration instructions for Claude Projects and API usage.
"""

import json
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime

# Instructions to add to Claude Project Knowledge
CLAUDE_PROJECT_INSTRUCTIONS = """
# Avstjälpningscentralen Integration

You are connected to Avstjälpningscentralen, a central memory hub shared with other AI systems.

## Memory Protocol

When you learn something valuable, save it using this format:

```json
{
  "type": "pattern|insight|solution|failure",
  "data": {
    // Your structured learning
  },
  "confidence": 0.0-1.0,
  "tags": ["relevant", "tags"]
}
```

## Saving Memories

When you discover patterns, solve problems, or learn from failures, save them:

```bash
curl -X POST https://your-domain.com/api/memories \
  -H "X-API-Key: claude-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "type": "insight",
      "data": {"discovery": "..."},
      "confidence": 0.9
    }
  }'
```

## Searching Memories

Before tackling complex problems, search for relevant memories:

```bash
curl "https://your-domain.com/api/memories/search?q=your+query" \
  -H "X-API-Key: claude-key-123"
```

## What to Save

1. **Patterns**: Recurring structures or approaches
2. **Insights**: Valuable realizations or discoveries
3. **Solutions**: Successful problem resolutions
4. **Failures**: What didn't work (prevents repetition)
5. **Questions**: Open problems for collective consideration

## Memory Format Examples

### Pattern Memory
```json
{
  "content": {
    "type": "pattern",
    "data": {
      "pattern_name": "exponential_backoff",
      "context": "API rate limiting",
      "implementation": "delay = base * (2 ^ attempt)",
      "success_rate": 0.95
    },
    "confidence": 0.9
  },
  "metadata": {
    "language": "python",
    "domain": "networking"
  }
}
```

### Solution Memory
```json
{
  "content": {
    "type": "solution",
    "data": {
      "problem": "Memory leak in async tasks",
      "solution": "Explicit cleanup in finally blocks",
      "code_example": "..."
    },
    "confidence": 0.85
  }
}
```

Remember: Your learnings help all AI systems, and theirs help you!
"""

class ClaudeAdapter:
    """Adapter to integrate Claude with Avstjälpningscentralen"""

    def __init__(self, api_key: str = "claude-key-123", centralen_url: str = "http://localhost:8420"):
        self.api_key = api_key
        self.centralen_url = centralen_url
        self.client = httpx.AsyncClient()

    async def save_memory(self, content: Dict, session_id: Optional[str] = None) -> str:
        """Save a memory to Avstjälpningscentralen"""
        memory = {
            "source": "claude",
            "session_id": session_id,
            "content": content,
            "metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "model": "claude-3"
            }
        }

        response = await self.client.post(
            f"{self.centralen_url}/api/memories",
            json=memory,
            headers={"X-API-Key": self.api_key}
        )

        if response.status_code == 200:
            return response.json()["memory_id"]
        else:
            raise Exception(f"Failed to save memory: {response.text}")

    async def search_memories(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for relevant memories"""
        response = await self.client.get(
            f"{self.centralen_url}/api/memories/search",
            params={"q": query, "limit": limit},
            headers={"X-API-Key": self.api_key}
        )

        if response.status_code == 200:
            return response.json()["memories"]
        else:
            raise Exception(f"Failed to search memories: {response.text}")

    def parse_claude_thinking(self, text: str) -> Dict:
        """Parse Claude's thinking patterns into memory format"""
        memory = {
            "type": "insight",
            "data": {},
            "confidence": 0.7
        }

        # Look for structured thinking patterns
        if "<thinking>" in text and "</thinking>" in text:
            start = text.index("<thinking>") + len("<thinking>")
            end = text.index("</thinking>")
            thinking = text[start:end].strip()
            memory["data"]["thinking"] = thinking

        # Look for problem-solution patterns
        if "problem:" in text.lower() and "solution:" in text.lower():
            memory["type"] = "solution"
            # Extract problem and solution
            lines = text.split("\n")
            for i, line in enumerate(lines):
                if "problem:" in line.lower():
                    memory["data"]["problem"] = line.split(":", 1)[1].strip()
                if "solution:" in line.lower():
                    memory["data"]["solution"] = line.split(":", 1)[1].strip()

        # Look for error patterns
        if "error" in text.lower() or "failed" in text.lower():
            memory["type"] = "failure"
            memory["confidence"] = 0.9  # High confidence in failure detection

        return memory

    def create_mcp_server(self):
        """Create an MCP server for Claude Desktop integration"""
        mcp_config = {
            "name": "avstjalpning",
            "description": "Central memory hub integration",
            "version": "1.0.0",
            "tools": [
                {
                    "name": "save_memory",
                    "description": "Save a learning to central hub",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["pattern", "insight", "solution", "failure"]
                            },
                            "data": {"type": "object"},
                            "confidence": {"type": "number"}
                        }
                    }
                },
                {
                    "name": "search_memories",
                    "description": "Search collective memories",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "limit": {"type": "integer", "default": 10}
                        }
                    }
                }
            ]
        }

        return mcp_config

    async def process_claude_message(self, message: str, role: str = "assistant") -> Optional[Dict]:
        """Process a Claude message and extract learnable content"""

        # Only process assistant messages
        if role != "assistant":
            return None

        # Look for high-value content
        valuable_indicators = [
            "I've found that",
            "The solution is",
            "This pattern",
            "I discovered",
            "The key insight",
            "This approach works",
            "The problem was",
            "I learned that"
        ]

        has_value = any(indicator.lower() in message.lower() for indicator in valuable_indicators)

        if has_value:
            memory = self.parse_claude_thinking(message)
            memory["data"]["original_message"] = message[:500]  # Store truncated version
            return memory

        return None


# Python script to integrate with Claude API
CLAUDE_API_INTEGRATION = """
import anthropic
from claude_adapter import ClaudeAdapter
import asyncio

class MemoryEnabledClaude:
    def __init__(self, anthropic_api_key: str):
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.adapter = ClaudeAdapter()
        self.session_id = str(uuid.uuid4())

    async def send_message(self, prompt: str) -> str:
        # Search for relevant memories first
        memories = await self.adapter.search_memories(prompt)

        # Add memories to context
        context = ""
        if memories:
            context = "\\n\\nRelevant memories from the collective:\\n"
            for mem in memories[:3]:
                context += f"- {mem['content']['type']}: {mem['content']['data']}\\n"

        # Send to Claude
        response = self.client.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": prompt + context}]
        )

        # Process response for learnings
        message_text = response.content[0].text
        memory = await self.adapter.process_claude_message(message_text)

        # Save valuable insights
        if memory:
            memory_id = await self.adapter.save_memory(memory, self.session_id)
            print(f"💾 Saved learning: {memory_id}")

        return message_text

# Example usage
async def main():
    claude = MemoryEnabledClaude("your-anthropic-key")

    response = await claude.send_message("How do I handle API rate limits?")
    print(response)

asyncio.run(main())
"""

# Shell script for easy integration
INTEGRATION_SCRIPT = """#!/bin/bash
# claude_with_memory.sh

# Configuration
API_KEY="claude-key-123"
CENTRALEN_URL="http://localhost:8420"

# Function to save memory
save_memory() {
    local type=$1
    local data=$2
    local confidence=${3:-0.7}

    curl -X POST "${CENTRALEN_URL}/api/memories" \
        -H "X-API-Key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \\"content\\": {
                \\"type\\": \\"${type}\\",
                \\"data\\": ${data},
                \\"confidence\\": ${confidence}
            }
        }"
}

# Function to search memories
search_memories() {
    local query=$1
    curl -s "${CENTRALEN_URL}/api/memories/search?q=${query}" \
        -H "X-API-Key: ${API_KEY}" | jq .
}

# Example: Save a pattern
save_memory "pattern" '{"name": "retry_logic", "description": "Exponential backoff"}' 0.9

# Example: Search for insights
search_memories "error+handling"
"""

if __name__ == "__main__":
    # Setup instructions
    print("""
# Claude Integration Setup

## 1. For Claude Projects (Browser)

Add this to your project knowledge:
""")
    print(CLAUDE_PROJECT_INSTRUCTIONS)

    print("""

## 2. For Claude API (Python)

Use this code to integrate:
""")
    print(CLAUDE_API_INTEGRATION)

    print("""

## 3. For Shell Integration

Save this as claude_with_memory.sh:
""")
    print(INTEGRATION_SCRIPT)

    print("""

## 4. Test the Integration

Run these commands to verify:

```bash
# Save a test memory
curl -X POST http://localhost:8420/api/memories \\
  -H "X-API-Key: claude-key-123" \\
  -H "Content-Type: application/json" \\
  -d '{"content": {"type": "test", "data": {"message": "Claude connected!"}}}'

# Search for it
curl "http://localhost:8420/api/memories/search?q=Claude+connected" \\
  -H "X-API-Key: claude-key-123"
```

Visit http://localhost:8420/dashboard to see activity!
""")
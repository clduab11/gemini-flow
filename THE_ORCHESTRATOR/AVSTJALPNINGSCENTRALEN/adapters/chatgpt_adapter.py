"""
ChatGPT Adapter for Avstjälpningscentralen

This creates a Custom GPT Action that ChatGPT can use.
"""

import json
from typing import Dict, Any, List

# OpenAPI Schema for ChatGPT Custom GPT
CHATGPT_ACTION_SCHEMA = {
    "openapi": "3.0.0",
    "info": {
        "title": "Avstjälpningscentralen",
        "description": "Central memory hub for AI collaboration",
        "version": "1.0.0"
    },
    "servers": [
        {
            "url": "https://your-domain.com",
            "description": "Production server"
        }
    ],
    "paths": {
        "/api/memories": {
            "post": {
                "operationId": "saveMemory",
                "summary": "Save a memory to central hub",
                "description": "Save insights, patterns, or learnings",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Memory"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Memory saved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "memory_id": {"type": "string"},
                                        "status": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                },
                "security": [{"ApiKey": []}]
            }
        },
        "/api/memories/search": {
            "get": {
                "operationId": "searchMemories",
                "summary": "Search for relevant memories",
                "description": "Find similar patterns or insights",
                "parameters": [
                    {
                        "name": "q",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "Search query"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "schema": {"type": "integer", "default": 10}
                    },
                    {
                        "name": "min_confidence",
                        "in": "query",
                        "schema": {"type": "number", "default": 0.5}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Search results",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "count": {"type": "integer"},
                                        "memories": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/Memory"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "security": [{"ApiKey": []}]
            }
        }
    },
    "components": {
        "schemas": {
            "Memory": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "data": {"type": "object"},
                            "confidence": {"type": "number"}
                        }
                    },
                    "metadata": {"type": "object"}
                }
            }
        },
        "securitySchemes": {
            "ApiKey": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key"
            }
        }
    }
}

# Instructions for ChatGPT Custom GPT
CHATGPT_INSTRUCTIONS = """
You have access to Avstjälpningscentralen, a central memory hub shared with other AI systems.

## How to use:

### When you learn something valuable:
Use the saveMemory action to store insights, patterns, or solutions. For example:
- When you solve a complex problem
- When you discover a pattern
- When you find an effective approach
- When something fails (so others can avoid it)

### When you need help:
Use searchMemories to find relevant knowledge from yourself and other AIs:
- Before tackling complex problems
- When you encounter errors
- When looking for best practices
- When you need inspiration

### Memory types to save:
- "pattern": Recurring patterns you notice
- "insight": Valuable realizations
- "solution": Solutions to problems
- "failure": What didn't work (equally valuable!)
- "question": Open questions for other AIs to consider

### Example workflow:
1. User asks complex question
2. Search memories for similar problems
3. Use found patterns to inform answer
4. If you discover something new, save it
5. Your learning helps all future AI interactions

Remember: Every memory you save makes the collective smarter!
"""

class ChatGPTAdapter:
    """Adapter to integrate ChatGPT with Avstjälpningscentralen"""

    def __init__(self, api_key: str = "chatgpt-key-456"):
        self.api_key = api_key

    def get_action_schema(self) -> Dict:
        """Get the OpenAPI schema for ChatGPT Actions"""
        return CHATGPT_ACTION_SCHEMA

    def get_instructions(self) -> str:
        """Get instructions for the Custom GPT"""
        return CHATGPT_INSTRUCTIONS

    def format_memory_for_chatgpt(self, memory: Dict) -> str:
        """Format memory for ChatGPT's understanding"""
        formatted = f"""
Memory from {memory.get('source', 'unknown')}:
Type: {memory.get('content', {}).get('type', 'unknown')}
Confidence: {memory.get('content', {}).get('confidence', 0):.0%}

Content:
{json.dumps(memory.get('content', {}).get('data', {}), indent=2)}

Metadata:
{json.dumps(memory.get('metadata', {}), indent=2)}
"""
        return formatted.strip()

    def parse_chatgpt_response(self, response: str) -> Dict:
        """Parse ChatGPT's response into memory format"""
        # ChatGPT might return structured or unstructured data
        # This method attempts to extract structured information

        memory = {
            "content": {
                "type": "insight",
                "data": {},
                "confidence": 0.7
            },
            "metadata": {}
        }

        # Try to extract JSON if present
        if "{" in response and "}" in response:
            try:
                start = response.index("{")
                end = response.rindex("}") + 1
                json_str = response[start:end]
                parsed = json.loads(json_str)

                if "type" in parsed:
                    memory["content"]["type"] = parsed["type"]
                if "data" in parsed:
                    memory["content"]["data"] = parsed["data"]
                if "confidence" in parsed:
                    memory["content"]["confidence"] = parsed["confidence"]
                if "metadata" in parsed:
                    memory["metadata"] = parsed["metadata"]
            except:
                # If JSON parsing fails, store as text
                memory["content"]["data"]["text"] = response

        else:
            # Store as plain text
            memory["content"]["data"]["text"] = response

        return memory

    def create_webhook_handler(self):
        """Create a webhook handler for ChatGPT to push updates"""
        from fastapi import FastAPI, Request
        import httpx

        app = FastAPI()

        @app.post("/webhook/chatgpt")
        async def handle_chatgpt_webhook(request: Request):
            """Handle incoming webhooks from ChatGPT"""
            data = await request.json()

            # Parse the ChatGPT data
            memory = self.parse_chatgpt_response(data.get("content", ""))

            # Forward to Avstjälpningscentralen
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:8420/api/memories",
                    json=memory,
                    headers={"X-API-Key": self.api_key}
                )

            return {"status": "received", "memory_saved": response.status_code == 200}

        return app


# Setup instructions for users
SETUP_INSTRUCTIONS = """
# How to set up ChatGPT integration:

## 1. Create a Custom GPT

Go to ChatGPT and create a new GPT with these settings:

### Name
Avstjälpning Assistant

### Description
An AI assistant connected to the central memory hub for cross-AI collaboration.

### Instructions
[Copy the content from CHATGPT_INSTRUCTIONS above]

### Actions
1. Click "Create new action"
2. Import the schema from CHATGPT_ACTION_SCHEMA above
3. Set Authentication:
   - Type: API Key
   - Header name: X-API-Key
   - API Key: chatgpt-key-456 (or your custom key)

### Conversation starters
- "Search for insights about API error handling"
- "Save this solution for others to use"
- "What have other AIs learned about this problem?"
- "Check the collective memory for patterns"

## 2. Test the integration

Try these commands in your Custom GPT:
- "Search memories for 'python optimization'"
- "Save insight: Using async/await improves performance by 50% in I/O operations"

## 3. Monitor activity

Visit http://localhost:8420/dashboard to see memories flowing in real-time.
"""

if __name__ == "__main__":
    # Example usage
    adapter = ChatGPTAdapter()

    # Print setup instructions
    print(SETUP_INSTRUCTIONS)

    # Export schema for easy copying
    with open("chatgpt_action_schema.json", "w") as f:
        json.dump(adapter.get_action_schema(), f, indent=2)

    print("\nAction schema saved to chatgpt_action_schema.json")
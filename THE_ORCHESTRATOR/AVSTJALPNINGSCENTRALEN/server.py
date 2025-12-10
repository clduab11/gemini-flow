"""
AVSTJÄLPNINGSCENTRALEN - Central Memory Hub for All AIs

Where thoughts go to become something greater.
"""

import os
import json
import uuid
import asyncio
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Set
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import asyncpg
from pgvector.asyncpg import register_vector
import uvicorn
import httpx
from redis import asyncio as aioredis

# =====================================================
# DATA MODELS
# =====================================================

class MemoryContent(BaseModel):
    """Content of a memory"""
    type: str  # pattern, insight, solution, failure, question
    data: Dict[str, Any]
    confidence: float = 0.5

class Memory(BaseModel):
    """Universal Memory Protocol (UMP) format"""
    memory_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str  # claude, chatgpt, bard, custom
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    project: Optional[str] = None
    content: MemoryContent
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    quality_score: float = 0.5
    access_count: int = 0

class SearchQuery(BaseModel):
    """Search query model"""
    q: str
    source_filter: Optional[str] = None
    type_filter: Optional[str] = None
    project_filter: Optional[str] = None
    limit: int = 10
    min_confidence: float = 0.0

class WebhookConfig(BaseModel):
    """Webhook configuration for AI system"""
    ai_system: str  # claude, chatgpt, etc
    webhook_url: str
    events: List[str] = ["new_memory", "memory_updated"]
    active: bool = True

class AIAdapter(BaseModel):
    """Adapter configuration for different AI systems"""
    system_name: str
    api_key: str
    endpoint: Optional[str] = None
    capabilities: List[str] = []
    translation_rules: Dict[str, Any] = Field(default_factory=dict)

# =====================================================
# DATABASE MANAGER
# =====================================================

class CentralDatabase:
    """Database manager for Avstjälpningscentralen"""

    def __init__(self, db_url: str):
        self.db_url = db_url
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initialize database connection"""
        self.pool = await asyncpg.create_pool(self.db_url)

        # Register pgvector
        async with self.pool.acquire() as conn:
            await register_vector(conn)

            # Create tables if not exist
            await self._create_tables(conn)

    async def disconnect(self):
        """Close database connection"""
        if self.pool:
            await self.pool.close()

    async def _create_tables(self, conn):
        """Create necessary tables"""
        await conn.execute("""
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS vector;
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                session_id VARCHAR(255),
                user_id VARCHAR(255),
                project VARCHAR(255),
                content JSONB NOT NULL,
                embedding VECTOR(1536),
                metadata JSONB,
                quality_score FLOAT DEFAULT 0.5,
                access_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP,

                INDEX idx_source (source),
                INDEX idx_project (project),
                INDEX idx_timestamp (timestamp DESC),
                INDEX idx_quality (quality_score DESC)
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS webhooks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ai_system VARCHAR(50) NOT NULL,
                webhook_url TEXT NOT NULL,
                events TEXT[],
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_triggered TIMESTAMP,

                UNIQUE(ai_system, webhook_url)
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS ai_adapters (
                system_name VARCHAR(50) PRIMARY KEY,
                api_key TEXT,
                endpoint TEXT,
                capabilities TEXT[],
                translation_rules JSONB,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    async def save_memory(self, memory: Memory) -> str:
        """Save a memory to database"""
        async with self.pool.acquire() as conn:
            # Convert embedding to list if numpy array
            embedding = memory.embedding
            if isinstance(embedding, np.ndarray):
                embedding = embedding.tolist()

            memory_id = await conn.fetchval("""
                INSERT INTO memories (
                    source, session_id, user_id, project,
                    content, embedding, metadata, quality_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING memory_id
            """,
                memory.source,
                memory.session_id,
                memory.user_id,
                memory.project,
                json.dumps(memory.content.dict()),
                embedding,
                json.dumps(memory.metadata),
                memory.quality_score
            )

            return str(memory_id)

    async def search_memories(self, query: SearchQuery, embedding: Optional[np.ndarray] = None) -> List[Memory]:
        """Search memories using vector similarity or filters"""
        async with self.pool.acquire() as conn:
            if embedding is not None:
                # Vector similarity search
                embedding_list = embedding.tolist()

                rows = await conn.fetch("""
                    SELECT *, 1 - (embedding <-> $1::vector) as similarity
                    FROM memories
                    WHERE ($2::VARCHAR IS NULL OR source = $2)
                      AND ($3::VARCHAR IS NULL OR project = $3)
                      AND ($4::FLOAT IS NULL OR quality_score >= $4)
                    ORDER BY embedding <-> $1::vector
                    LIMIT $5
                """,
                    embedding_list,
                    query.source_filter,
                    query.project_filter,
                    query.min_confidence,
                    query.limit
                )
            else:
                # Text/filter search
                rows = await conn.fetch("""
                    SELECT *
                    FROM memories
                    WHERE ($1::VARCHAR IS NULL OR source = $1)
                      AND ($2::VARCHAR IS NULL OR project = $2)
                      AND ($3::FLOAT IS NULL OR quality_score >= $3)
                      AND ($4::TEXT IS NULL OR content::TEXT ILIKE '%' || $4 || '%')
                    ORDER BY quality_score DESC, timestamp DESC
                    LIMIT $5
                """,
                    query.source_filter,
                    query.project_filter,
                    query.min_confidence,
                    query.q if query.q else None,
                    query.limit
                )

            # Update access count
            if rows:
                memory_ids = [row['memory_id'] for row in rows]
                await conn.execute("""
                    UPDATE memories
                    SET access_count = access_count + 1,
                        last_accessed = CURRENT_TIMESTAMP
                    WHERE memory_id = ANY($1::UUID[])
                """, memory_ids)

            # Convert to Memory objects
            memories = []
            for row in rows:
                content_data = json.loads(row['content'])
                memory = Memory(
                    memory_id=str(row['memory_id']),
                    source=row['source'],
                    timestamp=row['timestamp'],
                    session_id=row['session_id'],
                    user_id=row['user_id'],
                    project=row['project'],
                    content=MemoryContent(**content_data),
                    metadata=json.loads(row['metadata']) if row['metadata'] else {},
                    quality_score=row['quality_score'],
                    access_count=row['access_count']
                )
                memories.append(memory)

            return memories

    async def get_webhooks(self, event: str = None) -> List[WebhookConfig]:
        """Get active webhooks"""
        async with self.pool.acquire() as conn:
            if event:
                rows = await conn.fetch("""
                    SELECT * FROM webhooks
                    WHERE active = true
                      AND $1 = ANY(events)
                """, event)
            else:
                rows = await conn.fetch("""
                    SELECT * FROM webhooks
                    WHERE active = true
                """)

            return [
                WebhookConfig(
                    ai_system=row['ai_system'],
                    webhook_url=row['webhook_url'],
                    events=row['events'],
                    active=row['active']
                )
                for row in rows
            ]

# =====================================================
# EMBEDDING SERVICE
# =====================================================

class EmbeddingService:
    """Service to generate embeddings for semantic search"""

    def __init__(self, model: str = "text-embedding-3-small"):
        self.model = model
        # In production, this would use OpenAI/Anthropic API

    async def generate_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for text"""
        # Simplified - would call actual embedding API
        # For now, return random embedding
        return np.random.randn(1536)

    async def generate_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings for multiple texts"""
        return [await self.generate_embedding(text) for text in texts]

# =====================================================
# WEBHOOK MANAGER
# =====================================================

class WebhookManager:
    """Manages webhooks for bidirectional communication"""

    def __init__(self):
        self.client = httpx.AsyncClient()

    async def trigger_webhook(self, webhook: WebhookConfig, event: str, data: Dict):
        """Trigger a webhook"""
        try:
            response = await self.client.post(
                webhook.webhook_url,
                json={
                    "event": event,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": data
                },
                timeout=5.0
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Webhook failed for {webhook.ai_system}: {e}")
            return False

    async def broadcast_event(self, webhooks: List[WebhookConfig], event: str, data: Dict):
        """Broadcast event to multiple webhooks"""
        tasks = [
            self.trigger_webhook(webhook, event, data)
            for webhook in webhooks
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return sum(1 for r in results if r is True)

# =====================================================
# WEBSOCKET CONNECTION MANAGER
# =====================================================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept and register connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        await self.broadcast(f"Client {client_id} connected", exclude=client_id)

    def disconnect(self, client_id: str):
        """Remove connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            await websocket.send_text(message)

    async def broadcast(self, message: str, exclude: Optional[str] = None):
        """Broadcast message to all connections"""
        for client_id, connection in self.active_connections.items():
            if client_id != exclude:
                try:
                    await connection.send_text(message)
                except:
                    pass

# =====================================================
# CACHE MANAGER
# =====================================================

class CacheManager:
    """Redis cache for fast access"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Connect to Redis"""
        self.redis = await aioredis.from_url(self.redis_url)

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()

    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        if self.redis:
            value = await self.redis.get(key)
            return value.decode() if value else None
        return None

    async def set(self, key: str, value: str, expire: int = 3600):
        """Set value in cache"""
        if self.redis:
            await self.redis.set(key, value, ex=expire)

    async def invalidate(self, pattern: str):
        """Invalidate cache keys matching pattern"""
        if self.redis:
            async for key in self.redis.scan_iter(pattern):
                await self.redis.delete(key)

# =====================================================
# API SETUP
# =====================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager"""
    # Startup
    await app.state.db.connect()
    await app.state.cache.connect()
    yield
    # Shutdown
    await app.state.db.disconnect()
    await app.state.cache.disconnect()
    await app.state.webhooks.client.aclose()

app = FastAPI(
    title="Avstjälpningscentralen",
    description="Central Memory Hub for All AIs",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
app.state.db = CentralDatabase(os.getenv("DATABASE_URL", "postgresql://neural:neural@localhost:5432/avstjalpning"))
app.state.embeddings = EmbeddingService()
app.state.webhooks = WebhookManager()
app.state.connections = ConnectionManager()
app.state.cache = CacheManager()

# =====================================================
# API KEY AUTHENTICATION
# =====================================================

async def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key"""
    # Simple API key check - in production, check against database
    valid_keys = {
        "claude-key-123": "claude",
        "chatgpt-key-456": "chatgpt",
        "test-key": "test"
    }

    if not x_api_key or x_api_key not in valid_keys:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return valid_keys[x_api_key]

# =====================================================
# API ENDPOINTS
# =====================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Avstjälpningscentralen",
        "status": "operational",
        "message": "Where thoughts go to become something greater"
    }

@app.post("/api/memories")
async def create_memory(
    memory: Memory,
    source: str = Depends(verify_api_key)
):
    """Save a new memory"""
    # Override source with authenticated source
    memory.source = source

    # Generate embedding if not provided
    if not memory.embedding:
        text = json.dumps(memory.content.dict())
        embedding = await app.state.embeddings.generate_embedding(text)
        memory.embedding = embedding.tolist()

    # Save to database
    memory_id = await app.state.db.save_memory(memory)
    memory.memory_id = memory_id

    # Trigger webhooks
    webhooks = await app.state.db.get_webhooks("new_memory")
    await app.state.webhooks.broadcast_event(
        webhooks,
        "new_memory",
        memory.dict()
    )

    # Broadcast to WebSocket connections
    await app.state.connections.broadcast(
        json.dumps({
            "event": "new_memory",
            "data": {
                "memory_id": memory_id,
                "source": memory.source,
                "type": memory.content.type
            }
        })
    )

    # Invalidate cache
    await app.state.cache.invalidate(f"search:*")

    return {"memory_id": memory_id, "status": "saved"}

@app.get("/api/memories/search")
async def search_memories(
    q: str,
    source_filter: Optional[str] = None,
    type_filter: Optional[str] = None,
    project_filter: Optional[str] = None,
    limit: int = 10,
    min_confidence: float = 0.0,
    api_source: str = Depends(verify_api_key)
):
    """Search memories"""
    # Check cache
    cache_key = f"search:{q}:{source_filter}:{project_filter}:{limit}"
    cached = await app.state.cache.get(cache_key)
    if cached:
        return json.loads(cached)

    # Create search query
    query = SearchQuery(
        q=q,
        source_filter=source_filter,
        type_filter=type_filter,
        project_filter=project_filter,
        limit=limit,
        min_confidence=min_confidence
    )

    # Generate embedding for semantic search
    embedding = await app.state.embeddings.generate_embedding(q)

    # Search database
    memories = await app.state.db.search_memories(query, embedding)

    # Format response
    response = {
        "query": q,
        "count": len(memories),
        "memories": [m.dict() for m in memories],
        "source": api_source
    }

    # Cache result
    await app.state.cache.set(cache_key, json.dumps(response))

    return response

@app.post("/api/webhooks")
async def register_webhook(
    config: WebhookConfig,
    source: str = Depends(verify_api_key)
):
    """Register a webhook for events"""
    config.ai_system = source

    async with app.state.db.pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO webhooks (ai_system, webhook_url, events, active)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (ai_system, webhook_url)
            DO UPDATE SET events = $3, active = $4
        """,
            config.ai_system,
            config.webhook_url,
            config.events,
            config.active
        )

    return {"status": "registered", "ai_system": config.ai_system}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    await app.state.connections.connect(websocket, client_id)

    try:
        while True:
            # Keep connection alive and handle messages
            data = await websocket.receive_text()

            # Echo back or process commands
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # Broadcast to others
                await app.state.connections.broadcast(
                    f"Client {client_id}: {data}",
                    exclude=client_id
                )
    except WebSocketDisconnect:
        app.state.connections.disconnect(client_id)
        await app.state.connections.broadcast(f"Client {client_id} disconnected")

@app.get("/api/stats")
async def get_stats():
    """Get system statistics"""
    async with app.state.db.pool.acquire() as conn:
        stats = await conn.fetchrow("""
            SELECT
                COUNT(*) as total_memories,
                COUNT(DISTINCT source) as sources,
                COUNT(DISTINCT project) as projects,
                AVG(quality_score) as avg_quality,
                MAX(timestamp) as latest_memory
            FROM memories
        """)

        active_connections = len(app.state.connections.active_connections)

        return {
            "total_memories": stats['total_memories'],
            "active_sources": stats['sources'],
            "projects": stats['projects'],
            "average_quality": float(stats['avg_quality']) if stats['avg_quality'] else 0,
            "latest_memory": stats['latest_memory'].isoformat() if stats['latest_memory'] else None,
            "active_connections": active_connections
        }

@app.get("/dashboard")
async def dashboard():
    """Simple dashboard HTML"""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Avstjälpningscentralen Dashboard</title>
        <style>
            body { font-family: monospace; background: #0a0a0a; color: #00ff00; padding: 20px; }
            h1 { text-align: center; color: #00ffff; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .stat { border: 1px solid #00ff00; padding: 10px; text-align: center; }
            #messages { height: 300px; overflow-y: auto; border: 1px solid #00ff00; padding: 10px; margin-top: 20px; }
            .message { padding: 5px; border-bottom: 1px dotted #004400; }
        </style>
    </head>
    <body>
        <h1>🧠 AVSTJÄLPNINGSCENTRALEN</h1>
        <p style="text-align: center;"><i>"Where thoughts go to become something greater"</i></p>

        <div class="stats" id="stats">
            <div class="stat">Loading...</div>
        </div>

        <div id="messages">
            <div class="message">Connecting to stream...</div>
        </div>

        <script>
            // Load stats
            fetch('/api/stats')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('stats').innerHTML = `
                        <div class="stat">
                            <h3>Total Memories</h3>
                            <p>${data.total_memories}</p>
                        </div>
                        <div class="stat">
                            <h3>Active Sources</h3>
                            <p>${data.active_sources}</p>
                        </div>
                        <div class="stat">
                            <h3>Projects</h3>
                            <p>${data.projects}</p>
                        </div>
                        <div class="stat">
                            <h3>Avg Quality</h3>
                            <p>${(data.average_quality * 100).toFixed(1)}%</p>
                        </div>
                        <div class="stat">
                            <h3>Active Connections</h3>
                            <p>${data.active_connections}</p>
                        </div>
                        <div class="stat">
                            <h3>Latest Memory</h3>
                            <p>${data.latest_memory ? new Date(data.latest_memory).toLocaleString() : 'None'}</p>
                        </div>
                    `;
                });

            // WebSocket for real-time updates
            const ws = new WebSocket(`ws://localhost:8420/ws/dashboard`);

            ws.onmessage = (event) => {
                const messages = document.getElementById('messages');
                const msg = document.createElement('div');
                msg.className = 'message';
                msg.textContent = `[${new Date().toLocaleTimeString()}] ${event.data}`;
                messages.insertBefore(msg, messages.firstChild);

                // Keep only last 50 messages
                while (messages.children.length > 50) {
                    messages.removeChild(messages.lastChild);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            // Auto-refresh stats every 5 seconds
            setInterval(() => {
                fetch('/api/stats').then(r => r.json()).then(data => {
                    // Update stats
                });
            }, 5000);
        </script>
    </body>
    </html>
    """)

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8420,
        reload=True
    )
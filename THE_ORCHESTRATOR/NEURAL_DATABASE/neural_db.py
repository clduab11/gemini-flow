"""
Neural Database Interface - Persistent memory across all contexts
"""

import os
import json
import uuid
import hashlib
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

import asyncpg
import numpy as np
from pgvector.asyncpg import register_vector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================
# DATA MODELS
# =====================================================

@dataclass
class MemoryPattern:
    """A crystallized memory pattern"""
    pattern_key: str
    pattern_type: str
    content: Dict[str, Any]
    context: Optional[str] = None
    embedding: Optional[np.ndarray] = None
    quality_score: float = 0.0
    usage_count: int = 0
    success_count: int = 0
    failure_count: int = 0
    id: Optional[str] = None
    created_at: Optional[datetime] = None

@dataclass
class Session:
    """An LLM session"""
    session_id: str
    context: str
    interface: str = "cli"
    llm_model: str = "claude-3"
    working_directory: Optional[str] = None
    environment: Optional[Dict] = None
    state: str = "active"
    id: Optional[str] = None

@dataclass
class Interaction:
    """A single prompt/response interaction"""
    session_id: str
    sequence_num: int
    prompt: str
    response: Optional[str] = None
    patterns: Optional[List[str]] = None
    was_successful: bool = True
    prompt_embedding: Optional[np.ndarray] = None
    response_embedding: Optional[np.ndarray] = None

class PatternType(Enum):
    """Types of patterns"""
    CODE = "code"
    ARCHITECTURE = "architecture"
    FIX = "fix"
    OPTIMIZATION = "optimization"
    TEST = "test"
    DOCUMENTATION = "documentation"

# =====================================================
# NEURAL DATABASE
# =====================================================

class NeuralDatabase:
    """
    Main database interface for Neural Overlay.
    Handles all persistent memory operations.
    """

    def __init__(self, connection_string: Optional[str] = None):
        """Initialize database connection"""
        self.connection_string = connection_string or os.getenv(
            'NEURAL_DB_URL',
            'postgresql://neural:neural@localhost:5432/neural_memory'
        )
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Establish database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.connection_string,
                min_size=2,
                max_size=10
            )

            # Register pgvector extension
            async with self.pool.acquire() as conn:
                await register_vector(conn)

            logger.info("✅ Neural Database connected")
            return True

        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False

    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database disconnected")

    # =====================================================
    # SESSION MANAGEMENT
    # =====================================================

    async def create_session(self, session: Session) -> str:
        """Create a new session"""
        async with self.pool.acquire() as conn:
            session_id = await conn.fetchval(
                """
                INSERT INTO sessions (session_id, context, interface, llm_model,
                                    working_directory, environment)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
                """,
                session.session_id,
                session.context,
                session.interface,
                session.llm_model,
                session.working_directory,
                json.dumps(session.environment) if session.environment else None
            )

            logger.info(f"📝 Session created: {session.session_id[:8]}...")
            return str(session_id)

    async def update_session_metrics(self, session_id: str, interaction_count: int = 1,
                                    tokens_used: int = 0, cost_usd: float = 0.0):
        """Update session metrics"""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE sessions
                SET interaction_count = interaction_count + $2,
                    total_tokens_used = total_tokens_used + $3,
                    total_cost_usd = total_cost_usd + $4,
                    last_interaction = CURRENT_TIMESTAMP
                WHERE session_id = $1
                """,
                session_id, interaction_count, tokens_used, cost_usd
            )

    async def end_session(self, session_id: str) -> Dict:
        """End a session and get summary"""
        async with self.pool.acquire() as conn:
            # Mark session as completed
            await conn.execute(
                """
                UPDATE sessions
                SET state = 'completed',
                    ended_at = CURRENT_TIMESTAMP
                WHERE session_id = $1
                """,
                session_id
            )

            # Get session summary
            summary = await conn.fetchrow(
                """
                SELECT
                    context,
                    interaction_count,
                    total_tokens_used,
                    total_cost_usd,
                    EXTRACT(EPOCH FROM (ended_at - started_at)) as duration_seconds
                FROM sessions
                WHERE session_id = $1
                """,
                session_id
            )

            return dict(summary) if summary else {}

    # =====================================================
    # PATTERN MANAGEMENT
    # =====================================================

    async def save_pattern(self, pattern: MemoryPattern) -> str:
        """Save or update a memory pattern"""
        async with self.pool.acquire() as conn:
            # Convert numpy array to list for storage
            embedding_list = pattern.embedding.tolist() if pattern.embedding is not None else None

            pattern_id = await conn.fetchval(
                """
                INSERT INTO memory_patterns (
                    pattern_key, pattern_type, content, context,
                    embedding, quality_score, usage_count,
                    success_count, failure_count
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (pattern_key)
                DO UPDATE SET
                    usage_count = memory_patterns.usage_count + 1,
                    success_count = memory_patterns.success_count + EXCLUDED.success_count,
                    failure_count = memory_patterns.failure_count + EXCLUDED.failure_count,
                    last_used = CURRENT_TIMESTAMP,
                    embedding = COALESCE(EXCLUDED.embedding, memory_patterns.embedding)
                RETURNING id
                """,
                pattern.pattern_key,
                pattern.pattern_type,
                json.dumps(pattern.content),
                pattern.context,
                embedding_list,
                pattern.quality_score,
                pattern.usage_count,
                pattern.success_count,
                pattern.failure_count
            )

            logger.info(f"💾 Pattern saved: {pattern.pattern_key}")
            return str(pattern_id)

    async def find_similar_patterns(self, embedding: np.ndarray,
                                   context: Optional[str] = None,
                                   limit: int = 10) -> List[Tuple[MemoryPattern, float]]:
        """Find similar patterns using vector similarity"""
        async with self.pool.acquire() as conn:
            # Convert numpy array to list
            embedding_list = embedding.tolist()

            # Use the SQL function we defined
            rows = await conn.fetch(
                """
                SELECT
                    pattern_id,
                    pattern_key,
                    similarity,
                    content
                FROM find_similar_patterns($1::vector, $2, $3)
                """,
                embedding_list,
                context,
                limit
            )

            results = []
            for row in rows:
                # Fetch full pattern data
                pattern_data = await conn.fetchrow(
                    """
                    SELECT * FROM memory_patterns WHERE id = $1
                    """,
                    row['pattern_id']
                )

                if pattern_data:
                    pattern = MemoryPattern(
                        id=str(pattern_data['id']),
                        pattern_key=pattern_data['pattern_key'],
                        pattern_type=pattern_data['pattern_type'],
                        content=json.loads(pattern_data['content']),
                        context=pattern_data['context'],
                        quality_score=pattern_data['quality_score'],
                        usage_count=pattern_data['usage_count'],
                        success_count=pattern_data['success_count'],
                        failure_count=pattern_data['failure_count']
                    )
                    results.append((pattern, row['similarity']))

            return results

    async def get_top_patterns(self, context: Optional[str] = None,
                              pattern_type: Optional[str] = None,
                              limit: int = 20) -> List[MemoryPattern]:
        """Get top patterns by quality score"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT * FROM memory_patterns
                WHERE 1=1
            """
            params = []

            if context:
                params.append(context)
                query += f" AND context = ${len(params)}"

            if pattern_type:
                params.append(pattern_type)
                query += f" AND pattern_type = ${len(params)}"

            query += " ORDER BY quality_score DESC, usage_count DESC"
            params.append(limit)
            query += f" LIMIT ${len(params)}"

            rows = await conn.fetch(query, *params)

            return [
                MemoryPattern(
                    id=str(row['id']),
                    pattern_key=row['pattern_key'],
                    pattern_type=row['pattern_type'],
                    content=json.loads(row['content']),
                    context=row['context'],
                    quality_score=row['quality_score'],
                    usage_count=row['usage_count'],
                    success_count=row['success_count'],
                    failure_count=row['failure_count']
                )
                for row in rows
            ]

    # =====================================================
    # INTERACTION TRACKING
    # =====================================================

    async def track_interaction(self, interaction: Interaction) -> str:
        """Track an interaction"""
        async with self.pool.acquire() as conn:
            # Get session UUID
            session_uuid = await conn.fetchval(
                "SELECT id FROM sessions WHERE session_id = $1",
                interaction.session_id
            )

            if not session_uuid:
                logger.error(f"Session not found: {interaction.session_id}")
                return None

            # Convert embeddings to lists
            prompt_emb = interaction.prompt_embedding.tolist() if interaction.prompt_embedding is not None else None
            response_emb = interaction.response_embedding.tolist() if interaction.response_embedding is not None else None

            interaction_id = await conn.fetchval(
                """
                INSERT INTO interactions (
                    session_id, sequence_num, prompt, response,
                    prompt_embedding, response_embedding,
                    patterns, was_successful
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
                """,
                session_uuid,
                interaction.sequence_num,
                interaction.prompt,
                interaction.response,
                prompt_emb,
                response_emb,
                json.dumps(interaction.patterns) if interaction.patterns else None,
                interaction.was_successful
            )

            # Update session metrics
            await self.update_session_metrics(interaction.session_id)

            return str(interaction_id)

    # =====================================================
    # CROSS-CONTEXT BRIDGING
    # =====================================================

    async def create_bridge(self, source_context: str, target_context: str,
                           pattern_id: str, confidence: float = 0.5):
        """Create a bridge between contexts"""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO context_bridges (
                    source_context, target_context, pattern_id, confidence
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (source_context, target_context, pattern_id)
                DO UPDATE SET
                    usage_count = context_bridges.usage_count + 1,
                    confidence = GREATEST(context_bridges.confidence, EXCLUDED.confidence),
                    last_used = CURRENT_TIMESTAMP
                """,
                source_context, target_context, uuid.UUID(pattern_id), confidence
            )

            logger.info(f"🌉 Bridge created: {source_context} → {target_context}")

    async def get_bridged_patterns(self, context: str, min_confidence: float = 0.5) -> List[MemoryPattern]:
        """Get patterns bridged from other contexts"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT DISTINCT mp.*
                FROM memory_patterns mp
                JOIN context_bridges cb ON mp.id = cb.pattern_id
                WHERE cb.target_context = $1
                  AND cb.confidence >= $2
                ORDER BY mp.quality_score DESC
                """,
                context, min_confidence
            )

            return [
                MemoryPattern(
                    id=str(row['id']),
                    pattern_key=row['pattern_key'],
                    pattern_type=row['pattern_type'],
                    content=json.loads(row['content']),
                    context=row['context'],
                    quality_score=row['quality_score'],
                    usage_count=row['usage_count']
                )
                for row in rows
            ]

    # =====================================================
    # LEARNING & INSIGHTS
    # =====================================================

    async def record_learning(self, session_id: str, event_type: str,
                             insight: str, pattern_id: Optional[str] = None,
                             confidence: float = 0.5):
        """Record a learning event"""
        async with self.pool.acquire() as conn:
            # Get session UUID
            session_uuid = await conn.fetchval(
                "SELECT id FROM sessions WHERE session_id = $1",
                session_id
            )

            await conn.execute(
                """
                INSERT INTO learning_events (
                    session_id, event_type, pattern_id, insight, confidence
                ) VALUES ($1, $2, $3, $4, $5)
                """,
                session_uuid,
                event_type,
                uuid.UUID(pattern_id) if pattern_id else None,
                insight,
                confidence
            )

            logger.info(f"🎓 Learning recorded: {event_type}")

    async def get_global_insights(self, min_confidence: float = 0.7) -> List[Dict]:
        """Get global insights"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM global_insights
                WHERE is_active = true
                  AND confidence >= $1
                ORDER BY confidence DESC, created_at DESC
                """,
                min_confidence
            )

            return [dict(row) for row in rows]

    # =====================================================
    # ANALYTICS
    # =====================================================

    async def get_context_stats(self, context: str) -> Dict:
        """Get statistics for a context"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow(
                """
                SELECT
                    COUNT(DISTINCT s.id) as session_count,
                    SUM(s.interaction_count) as total_interactions,
                    COUNT(DISTINCT mp.id) as pattern_count,
                    AVG(mp.quality_score) as avg_pattern_quality,
                    SUM(s.total_cost_usd) as total_cost
                FROM sessions s
                LEFT JOIN memory_patterns mp ON mp.context = s.context
                WHERE s.context = $1
                GROUP BY s.context
                """,
                context
            )

            return dict(stats) if stats else {}

    async def get_pattern_relationships(self, pattern_id: str) -> List[Dict]:
        """Get relationships for a pattern"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    pr.*,
                    mp.pattern_key as related_pattern_key
                FROM pattern_relationships pr
                JOIN memory_patterns mp ON mp.id = pr.pattern_b
                WHERE pr.pattern_a = $1
                ORDER BY pr.strength DESC
                """,
                uuid.UUID(pattern_id)
            )

            return [dict(row) for row in rows]

# =====================================================
# EMBEDDING SERVICE
# =====================================================

class EmbeddingService:
    """Service to generate embeddings for semantic search"""

    def __init__(self, model: str = "text-embedding-3-small"):
        self.model = model

    async def generate_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for text"""
        # This would call OpenAI/Anthropic embedding API
        # For now, return random embedding for demo
        return np.random.randn(1536)

    async def generate_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings for multiple texts"""
        # Batch processing for efficiency
        return [await self.generate_embedding(text) for text in texts]

# =====================================================
# MAIN DATABASE MANAGER
# =====================================================

class NeuralMemoryManager:
    """High-level interface for neural memory operations"""

    def __init__(self, db_url: Optional[str] = None):
        self.db = NeuralDatabase(db_url)
        self.embeddings = EmbeddingService()
        self._current_session: Optional[str] = None

    async def initialize(self) -> bool:
        """Initialize the database connection"""
        return await self.db.connect()

    async def shutdown(self):
        """Shutdown database connection"""
        if self._current_session:
            await self.end_session()
        await self.db.disconnect()

    async def start_session(self, context: str, interface: str = "cli") -> str:
        """Start a new session"""
        session = Session(
            session_id=f"{os.getpid()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            context=context,
            interface=interface,
            working_directory=os.getcwd()
        )

        session_id = await self.db.create_session(session)
        self._current_session = session.session_id

        logger.info(f"🚀 Session started: {context}")
        return session.session_id

    async def end_session(self) -> Dict:
        """End current session"""
        if not self._current_session:
            return {}

        summary = await self.db.end_session(self._current_session)
        self._current_session = None

        logger.info(f"🏁 Session ended. Duration: {summary.get('duration_seconds', 0):.1f}s")
        return summary

    async def remember(self, key: str, content: Dict, pattern_type: str = "general") -> str:
        """Remember a pattern"""
        # Generate embedding
        text = f"{key} {json.dumps(content)}"
        embedding = await self.embeddings.generate_embedding(text)

        pattern = MemoryPattern(
            pattern_key=key,
            pattern_type=pattern_type,
            content=content,
            context=self._get_current_context(),
            embedding=embedding,
            success_count=1
        )

        return await self.db.save_pattern(pattern)

    async def recall(self, query: str, limit: int = 5) -> List[Tuple[MemoryPattern, float]]:
        """Recall similar patterns"""
        # Generate query embedding
        embedding = await self.embeddings.generate_embedding(query)

        # Find similar patterns
        return await self.db.find_similar_patterns(
            embedding,
            context=self._get_current_context(),
            limit=limit
        )

    async def track(self, prompt: str, response: str, success: bool = True):
        """Track an interaction"""
        if not self._current_session:
            await self.start_session(self._get_current_context())

        # Generate embeddings
        prompt_emb = await self.embeddings.generate_embedding(prompt)
        response_emb = await self.embeddings.generate_embedding(response) if response else None

        interaction = Interaction(
            session_id=self._current_session,
            sequence_num=await self._get_next_sequence_num(),
            prompt=prompt,
            response=response,
            was_successful=success,
            prompt_embedding=prompt_emb,
            response_embedding=response_emb
        )

        return await self.db.track_interaction(interaction)

    def _get_current_context(self) -> str:
        """Get current context from environment or directory"""
        # Check for git repo
        from pathlib import Path
        current = Path.cwd()
        while current != current.parent:
            if (current / '.git').exists():
                return current.name
            current = current.parent

        return Path.cwd().name

    async def _get_next_sequence_num(self) -> int:
        """Get next sequence number for current session"""
        # This would query the database for the current max sequence_num
        # For now, return a placeholder
        return 1

# =====================================================
# CLI INTERFACE
# =====================================================

async def main():
    """Example usage"""

    # Initialize
    manager = NeuralMemoryManager()
    await manager.initialize()

    # Start session
    session_id = await manager.start_session("example_project")
    print(f"Session started: {session_id}")

    # Remember something
    pattern_id = await manager.remember(
        "api_error_handling",
        {"method": "try-catch with exponential backoff", "max_retries": 3}
    )
    print(f"Pattern saved: {pattern_id}")

    # Track interaction
    await manager.track(
        prompt="How do I handle API errors?",
        response="Use try-catch with exponential backoff...",
        success=True
    )

    # Recall similar
    similar = await manager.recall("error handling")
    for pattern, similarity in similar:
        print(f"Found: {pattern.pattern_key} (similarity: {similarity:.2f})")

    # End session
    summary = await manager.end_session()
    print(f"Session summary: {summary}")

    # Shutdown
    await manager.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
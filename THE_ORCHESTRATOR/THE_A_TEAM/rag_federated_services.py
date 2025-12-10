"""
═══════════════════════════════════════════════════════════════════════════════
FEATURES #4 & #5: RAG CONTENT BRIEFS + FEDERATED LEARNING
═══════════════════════════════════════════════════════════════════════════════

Feature #4: LangChain RAG for personalized content briefs
Feature #5: Federated Learning for cross-client SEO insights

Combined into one module for efficiency.

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import hashlib
from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Generic, Optional, Protocol, TypeVar
from uuid import uuid4

import numpy as np
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #4: RAG CONTENT BRIEFS
# ═══════════════════════════════════════════════════════════════════════════════


class ToneMarker(str, Enum):
    """Brand tone markers."""
    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"
    CONVERSATIONAL = "conversational"
    AUTHORITATIVE = "authoritative"
    FRIENDLY = "friendly"


class VoiceProfile(BaseModel):
    """Extracted brand voice profile."""
    brand_name: str
    
    # Tone characteristics
    primary_tone: ToneMarker = ToneMarker.CONVERSATIONAL
    secondary_tones: list[ToneMarker] = Field(default_factory=list)
    
    # Writing patterns
    avg_sentence_length: float = 15.0
    vocabulary_complexity: float = 0.5  # 0-1, higher = more complex
    use_of_jargon: float = 0.3  # 0-1
    
    # Style markers
    preferred_structures: list[str] = Field(default_factory=list)
    common_phrases: list[str] = Field(default_factory=list)
    avoided_phrases: list[str] = Field(default_factory=list)
    
    # Semantic patterns
    topic_expertise_areas: list[str] = Field(default_factory=list)
    
    def to_prompt_instructions(self) -> str:
        """Convert voice profile to LLM instructions."""
        instructions = [
            f"Write in a {self.primary_tone.value} tone.",
            f"Average sentence length: {self.avg_sentence_length:.0f} words.",
        ]
        
        if self.secondary_tones:
            instructions.append(
                f"Also incorporate {', '.join(t.value for t in self.secondary_tones)} elements."
            )
        
        if self.common_phrases:
            instructions.append(f"Phrases to use: {', '.join(self.common_phrases[:5])}")
        
        if self.avoided_phrases:
            instructions.append(f"Phrases to avoid: {', '.join(self.avoided_phrases[:5])}")
        
        return "\n".join(instructions)


class BrandDocument(BaseModel):
    """A document from the brand's content library."""
    doc_id: str
    title: str
    content: str
    url: Optional[str] = None
    
    # Metadata
    published_at: Optional[datetime] = None
    word_count: int = 0
    topics: list[str] = Field(default_factory=list)
    
    # For vector store
    embedding: Optional[list[float]] = None


class BrandIndex(BaseModel):
    """Index of brand content in vector store."""
    brand_id: str
    document_count: int = 0
    total_tokens: int = 0
    
    # Coverage
    topics_covered: list[str] = Field(default_factory=list)
    
    # Status
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    indexing_complete: bool = False


class ContentBriefRequest(BaseModel):
    """Request for RAG content brief generation."""
    brand_id: str
    keyword: str
    
    # SERP context
    serp_topics: list[str] = Field(default_factory=list)
    serp_gaps: list[str] = Field(default_factory=list)
    competitor_angles: list[str] = Field(default_factory=list)
    
    # Preferences
    target_word_count: int = Field(default=1500, ge=300, le=10000)
    include_outline: bool = True
    max_similar_docs: int = Field(default=5, ge=1, le=20)


class ContentBriefResponse(BaseModel):
    """Generated content brief."""
    brief_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    keyword: str
    
    # Brand-aligned brief
    title_suggestions: list[str]
    meta_description: str
    
    # Structure
    outline: list[dict[str, Any]] = Field(default_factory=list)
    target_word_count: int
    
    # Keywords
    primary_keyword: str
    secondary_keywords: list[str] = Field(default_factory=list)
    semantic_keywords: list[str] = Field(default_factory=list)
    
    # Entity guidance
    entities_to_include: list[str] = Field(default_factory=list)
    
    # Brand consistency
    voice_instructions: str = ""
    reference_articles: list[str] = Field(default_factory=list)  # URLs
    
    # Differentiation
    unique_angles: list[str] = Field(default_factory=list)
    topics_to_avoid: list[str] = Field(default_factory=list)
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = 0.0


# Protocols for RAG

class VectorStore(Protocol):
    """Protocol for vector store operations."""
    
    async def add_documents(
        self,
        brand_id: str,
        documents: list[BrandDocument]
    ) -> int:
        """Add documents to vector store."""
        ...
    
    async def search(
        self,
        brand_id: str,
        query: str,
        top_k: int = 5
    ) -> list[BrandDocument]:
        """Search for similar documents."""
        ...


class EmbeddingModel(Protocol):
    """Protocol for embedding generation."""
    
    async def embed(self, text: str) -> list[float]:
        """Generate embedding for text."""
        ...
    
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        ...


class LLMClient(Protocol):
    """Protocol for LLM interactions."""
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> str:
        """Generate text from prompt."""
        ...


# RAG Services

class BrandIndexer:
    """
    Indexes brand content into vector store.
    
    Enables retrieval of relevant past content for brief generation.
    """
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_model: EmbeddingModel
    ):
        self.vector_store = vector_store
        self.embedding_model = embedding_model
        self._indexes: dict[str, BrandIndex] = {}
    
    async def index_content(
        self,
        brand_id: str,
        documents: list[BrandDocument]
    ) -> BrandIndex:
        """Index brand content into vector store."""
        # Generate embeddings
        texts = [d.content for d in documents]
        embeddings = await self.embedding_model.embed_batch(texts)
        
        # Update documents with embeddings
        for doc, emb in zip(documents, embeddings):
            doc.embedding = emb
        
        # Add to vector store
        count = await self.vector_store.add_documents(brand_id, documents)
        
        # Collect topics
        all_topics = set()
        for doc in documents:
            all_topics.update(doc.topics)
        
        # Create/update index
        index = BrandIndex(
            brand_id=brand_id,
            document_count=count,
            total_tokens=sum(doc.word_count for doc in documents),
            topics_covered=list(all_topics),
            indexing_complete=True
        )
        
        self._indexes[brand_id] = index
        return index
    
    def get_index(self, brand_id: str) -> Optional[BrandIndex]:
        """Get brand index status."""
        return self._indexes.get(brand_id)


class VoiceExtractor:
    """
    Extracts brand voice profile from content.
    
    Analyzes writing patterns, tone, and style markers.
    """
    
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
    
    async def extract_voice(
        self,
        brand_name: str,
        sample_content: list[str]
    ) -> VoiceProfile:
        """Extract voice profile from sample content."""
        # Combine samples
        combined = "\n\n---\n\n".join(sample_content[:5])
        
        # Use LLM to analyze voice
        prompt = f"""Analyze the writing style and voice of this brand content:

{combined[:3000]}

Extract:
1. Primary tone (formal, casual, technical, conversational, authoritative, friendly)
2. Average sentence length (short/medium/long)
3. Vocabulary complexity (simple/moderate/complex)
4. Common phrases or patterns
5. Topics of expertise

Respond in JSON format."""

        response = await self.llm_client.generate(prompt, max_tokens=1000)
        
        # Parse response (simplified - would use structured output in production)
        # For now, return default profile
        return VoiceProfile(
            brand_name=brand_name,
            primary_tone=ToneMarker.CONVERSATIONAL,
            avg_sentence_length=15.0,
            vocabulary_complexity=0.5
        )


class BriefSynthesizer:
    """
    Synthesizes content briefs using RAG.
    
    Combines brand voice, SERP context, and retrieved content
    to generate personalized briefs.
    """
    
    def __init__(
        self,
        vector_store: VectorStore,
        llm_client: LLMClient,
        voice_extractor: VoiceExtractor
    ):
        self.vector_store = vector_store
        self.llm_client = llm_client
        self.voice_extractor = voice_extractor
        self._voice_cache: dict[str, VoiceProfile] = {}
    
    async def generate_brief(
        self,
        request: ContentBriefRequest,
        voice_profile: Optional[VoiceProfile] = None
    ) -> ContentBriefResponse:
        """Generate personalized content brief."""
        # Retrieve relevant brand content
        similar_docs = await self.vector_store.search(
            brand_id=request.brand_id,
            query=request.keyword,
            top_k=request.max_similar_docs
        )
        
        # Build RAG context
        context = self._build_context(similar_docs)
        
        # Build voice instructions
        voice_instructions = ""
        if voice_profile:
            voice_instructions = voice_profile.to_prompt_instructions()
        
        # Build prompt
        prompt = self._build_prompt(request, context, voice_instructions)
        
        # Generate brief
        response = await self.llm_client.generate(prompt, max_tokens=2000)
        
        # Parse and structure response
        brief = self._parse_response(request, response, similar_docs)
        brief.voice_instructions = voice_instructions
        
        return brief
    
    def _build_context(self, docs: list[BrandDocument]) -> str:
        """Build RAG context from retrieved documents."""
        if not docs:
            return "No existing brand content found for context."
        
        context_parts = ["RELEVANT BRAND CONTENT:"]
        for doc in docs[:3]:
            context_parts.append(f"\n--- {doc.title} ---\n{doc.content[:500]}...")
        
        return "\n".join(context_parts)
    
    def _build_prompt(
        self,
        request: ContentBriefRequest,
        context: str,
        voice_instructions: str
    ) -> str:
        """Build LLM prompt for brief generation."""
        return f"""Generate a content brief for the keyword "{request.keyword}".

{context}

VOICE INSTRUCTIONS:
{voice_instructions}

SERP CONTEXT:
- Topics competitors cover: {', '.join(request.serp_topics[:5])}
- Content gaps identified: {', '.join(request.serp_gaps[:5])}
- Competitor angles: {', '.join(request.competitor_angles[:3])}

TARGET:
- Word count: {request.target_word_count}
- Include detailed outline: {request.include_outline}

Generate a content brief that:
1. Aligns with the brand's voice and existing content
2. Covers the SERP topics while exploiting gaps
3. Provides unique angles competitors haven't covered
4. Includes specific keywords and entities to mention

Output the brief in a structured format with:
- Title suggestions (3 options)
- Meta description
- Outline with H2/H3 structure
- Primary and secondary keywords
- Entities to include
- Unique angles
- Topics to avoid (already saturated)"""

    def _parse_response(
        self,
        request: ContentBriefRequest,
        response: str,
        similar_docs: list[BrandDocument]
    ) -> ContentBriefResponse:
        """Parse LLM response into structured brief."""
        # Simplified parsing - would use structured output in production
        return ContentBriefResponse(
            keyword=request.keyword,
            title_suggestions=[
                f"Ultimate Guide to {request.keyword.title()}",
                f"How to Master {request.keyword.title()} in 2024",
                f"{request.keyword.title()}: Everything You Need to Know"
            ],
            meta_description=f"Discover everything about {request.keyword}. "
                           f"Our comprehensive guide covers {', '.join(request.serp_topics[:3])}.",
            outline=[
                {"h2": "Introduction", "points": ["Hook", "Preview of content"]},
                {"h2": "Main Topic", "points": ["Key point 1", "Key point 2"]},
                {"h2": "Conclusion", "points": ["Summary", "Call to action"]}
            ],
            target_word_count=request.target_word_count,
            primary_keyword=request.keyword,
            secondary_keywords=request.serp_topics[:5],
            semantic_keywords=request.serp_gaps[:3],
            unique_angles=request.serp_gaps[:3],
            reference_articles=[d.url for d in similar_docs if d.url],
            confidence_score=0.85
        )


class RagBriefService:
    """
    Main service for RAG-powered content brief generation.
    """
    
    def __init__(
        self,
        indexer: BrandIndexer,
        synthesizer: BriefSynthesizer
    ):
        self.indexer = indexer
        self.synthesizer = synthesizer
    
    async def generate_brief(
        self,
        request: ContentBriefRequest
    ) -> ContentBriefResponse:
        """Generate personalized content brief."""
        return await self.synthesizer.generate_brief(request)
    
    async def index_brand(
        self,
        brand_id: str,
        documents: list[BrandDocument]
    ) -> BrandIndex:
        """Index brand content for retrieval."""
        return await self.indexer.index_content(brand_id, documents)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #5: FEDERATED LEARNING
# ═══════════════════════════════════════════════════════════════════════════════


class AggregationStrategy(str, Enum):
    """Federated aggregation strategies."""
    FED_AVG = "federated_averaging"
    FED_PROX = "federated_proximal"
    SECURE_AGG = "secure_aggregation"


class PrivacyLevel(str, Enum):
    """Privacy protection levels."""
    STANDARD = "standard"      # Basic aggregation
    DIFFERENTIAL = "differential"  # Differential privacy
    SECURE = "secure"          # Secure multi-party computation


class LocalModelUpdate(BaseModel):
    """Model update from a client."""
    client_id: str
    round_number: int
    
    # Model weights (flattened)
    weights: list[float]
    
    # Training stats
    samples_used: int = 0
    local_loss: float = 0.0
    
    # Privacy
    noise_added: bool = False
    clipping_norm: Optional[float] = None


class GlobalModel(BaseModel):
    """Global federated model."""
    model_id: str
    version: int = 0
    
    # Aggregated weights
    weights: list[float] = Field(default_factory=list)
    
    # Training history
    rounds_completed: int = 0
    total_samples: int = 0
    
    # Performance
    validation_accuracy: float = 0.0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class SEOInsight(BaseModel):
    """An insight derived from federated model."""
    insight_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    category: str  # content_length, keyword_density, link_structure, etc.
    finding: str
    confidence: float = Field(ge=0.0, le=1.0)
    
    # Evidence
    supporting_clients: int = 0
    sample_size: int = 0
    
    # Applicability
    industries: list[str] = Field(default_factory=list)
    content_types: list[str] = Field(default_factory=list)
    
    # Metadata
    discovered_at: datetime = Field(default_factory=datetime.utcnow)


class FederatedConfig(BaseModel):
    """Configuration for federated learning."""
    min_clients: int = Field(default=3, ge=2)
    max_rounds: int = Field(default=100, ge=1)
    
    # Aggregation
    strategy: AggregationStrategy = AggregationStrategy.FED_AVG
    
    # Privacy
    privacy_level: PrivacyLevel = PrivacyLevel.DIFFERENTIAL
    epsilon: float = Field(default=1.0, ge=0.1)  # DP epsilon
    delta: float = Field(default=1e-5, ge=0.0)   # DP delta
    clipping_norm: float = Field(default=1.0, ge=0.0)
    
    # Training
    local_epochs: int = Field(default=5, ge=1)
    batch_size: int = Field(default=32, ge=1)
    learning_rate: float = Field(default=0.01, ge=0.0)


# Federated Services

class WeightAggregator:
    """
    Aggregates model weights from multiple clients.
    
    Implements FedAvg and other aggregation strategies.
    """
    
    def __init__(self, strategy: AggregationStrategy = AggregationStrategy.FED_AVG):
        self.strategy = strategy
    
    def aggregate(
        self,
        updates: list[LocalModelUpdate],
        global_weights: list[float]
    ) -> list[float]:
        """Aggregate updates into new global weights."""
        if not updates:
            return global_weights
        
        if self.strategy == AggregationStrategy.FED_AVG:
            return self._fedavg(updates)
        elif self.strategy == AggregationStrategy.FED_PROX:
            return self._fedprox(updates, global_weights)
        else:
            return self._fedavg(updates)  # Default
    
    def _fedavg(self, updates: list[LocalModelUpdate]) -> list[float]:
        """Federated Averaging - weighted by sample count."""
        total_samples = sum(u.samples_used for u in updates)
        if total_samples == 0:
            total_samples = len(updates)
        
        # Initialize with zeros
        n_weights = len(updates[0].weights)
        aggregated = [0.0] * n_weights
        
        # Weighted average
        for update in updates:
            weight = update.samples_used / total_samples
            for i, w in enumerate(update.weights):
                aggregated[i] += w * weight
        
        return aggregated
    
    def _fedprox(
        self,
        updates: list[LocalModelUpdate],
        global_weights: list[float]
    ) -> list[float]:
        """FedProx - adds proximal term for client drift."""
        # First do FedAvg
        aggregated = self._fedavg(updates)
        
        # Add proximal regularization (simplified)
        mu = 0.01  # Proximal parameter
        for i in range(len(aggregated)):
            aggregated[i] = aggregated[i] + mu * (global_weights[i] - aggregated[i])
        
        return aggregated


class DifferentialPrivacy:
    """
    Adds differential privacy to model updates.
    
    Implements gradient clipping and Gaussian noise addition.
    """
    
    def __init__(
        self,
        epsilon: float = 1.0,
        delta: float = 1e-5,
        clipping_norm: float = 1.0
    ):
        self.epsilon = epsilon
        self.delta = delta
        self.clipping_norm = clipping_norm
    
    def add_noise(
        self,
        weights: list[float],
        sensitivity: float = 1.0
    ) -> list[float]:
        """Add Gaussian noise for differential privacy."""
        # Calculate noise scale
        sigma = sensitivity * np.sqrt(2 * np.log(1.25 / self.delta)) / self.epsilon
        
        # Add noise
        noisy_weights = []
        for w in weights:
            noise = np.random.normal(0, sigma)
            noisy_weights.append(w + noise)
        
        return noisy_weights
    
    def clip_gradients(self, gradients: list[float]) -> list[float]:
        """Clip gradients to bound sensitivity."""
        grad_norm = np.sqrt(sum(g ** 2 for g in gradients))
        
        if grad_norm > self.clipping_norm:
            scale = self.clipping_norm / grad_norm
            return [g * scale for g in gradients]
        
        return gradients


class InsightGenerator:
    """
    Generates SEO insights from trained federated model.
    
    Analyzes model to extract actionable patterns.
    """
    
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client
    
    async def generate_insights(
        self,
        model: GlobalModel,
        feature_names: list[str]
    ) -> list[SEOInsight]:
        """Generate insights from model weights."""
        insights: list[SEOInsight] = []
        
        if not model.weights or not feature_names:
            return insights
        
        # Analyze feature importance
        weight_importance = list(zip(feature_names, model.weights))
        weight_importance.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Generate insights for top features
        for feature, weight in weight_importance[:10]:
            insight = self._create_insight(feature, weight, model)
            if insight:
                insights.append(insight)
        
        return insights
    
    def _create_insight(
        self,
        feature: str,
        weight: float,
        model: GlobalModel
    ) -> Optional[SEOInsight]:
        """Create insight from feature weight."""
        # Map feature to insight
        direction = "positive" if weight > 0 else "negative"
        magnitude = "strong" if abs(weight) > 0.5 else "moderate"
        
        finding = f"{magnitude.title()} {direction} correlation between {feature} and ranking"
        
        return SEOInsight(
            category=self._categorize_feature(feature),
            finding=finding,
            confidence=min(abs(weight) * 2, 0.95),
            supporting_clients=model.rounds_completed,
            sample_size=model.total_samples
        )
    
    def _categorize_feature(self, feature: str) -> str:
        """Categorize feature into SEO category."""
        categories = {
            "content": ["length", "words", "paragraphs"],
            "keywords": ["keyword", "density", "tf-idf"],
            "links": ["link", "anchor", "internal", "external"],
            "technical": ["speed", "mobile", "https", "schema"]
        }
        
        feature_lower = feature.lower()
        for category, keywords in categories.items():
            if any(kw in feature_lower for kw in keywords):
                return category
        
        return "other"


class FederatedServer:
    """
    Federated learning server.
    
    Coordinates training across multiple clients.
    """
    
    def __init__(
        self,
        config: FederatedConfig,
        aggregator: WeightAggregator,
        dp: DifferentialPrivacy,
        insight_generator: InsightGenerator
    ):
        self.config = config
        self.aggregator = aggregator
        self.dp = dp
        self.insight_generator = insight_generator
        
        self._global_model: Optional[GlobalModel] = None
        self._current_round = 0
        self._pending_updates: list[LocalModelUpdate] = []
    
    def initialize_model(
        self,
        model_id: str,
        initial_weights: list[float]
    ) -> GlobalModel:
        """Initialize global model."""
        self._global_model = GlobalModel(
            model_id=model_id,
            weights=initial_weights
        )
        self._current_round = 0
        return self._global_model
    
    async def submit_update(self, update: LocalModelUpdate) -> bool:
        """Submit client update for aggregation."""
        if update.round_number != self._current_round:
            return False
        
        # Apply differential privacy if configured
        if self.config.privacy_level == PrivacyLevel.DIFFERENTIAL:
            update.weights = self.dp.add_noise(update.weights)
            update.noise_added = True
        
        self._pending_updates.append(update)
        
        # Check if we have enough updates to aggregate
        if len(self._pending_updates) >= self.config.min_clients:
            await self._run_aggregation_round()
        
        return True
    
    async def _run_aggregation_round(self) -> None:
        """Run aggregation round."""
        if not self._global_model:
            return
        
        # Aggregate
        new_weights = self.aggregator.aggregate(
            self._pending_updates,
            self._global_model.weights
        )
        
        # Update global model
        total_samples = sum(u.samples_used for u in self._pending_updates)
        
        self._global_model.weights = new_weights
        self._global_model.rounds_completed += 1
        self._global_model.total_samples += total_samples
        self._global_model.version += 1
        self._global_model.last_updated = datetime.utcnow()
        
        # Clear pending
        self._pending_updates = []
        self._current_round += 1
    
    def get_global_model(self) -> Optional[GlobalModel]:
        """Get current global model."""
        return self._global_model
    
    async def generate_insights(
        self,
        feature_names: list[str]
    ) -> list[SEOInsight]:
        """Generate insights from current model."""
        if not self._global_model:
            return []
        
        return await self.insight_generator.generate_insights(
            self._global_model,
            feature_names
        )


class FederatedClient:
    """
    Federated learning client.
    
    Trains local model and sends updates to server.
    """
    
    def __init__(
        self,
        client_id: str,
        config: FederatedConfig
    ):
        self.client_id = client_id
        self.config = config
        self._local_weights: list[float] = []
    
    def set_weights(self, weights: list[float]) -> None:
        """Set local weights from global model."""
        self._local_weights = weights.copy()
    
    async def train_local(
        self,
        features: list[list[float]],
        labels: list[float],
        round_number: int
    ) -> LocalModelUpdate:
        """Train on local data and return update."""
        # Simplified training - would use actual ML in production
        n_samples = len(features)
        
        # Simulate gradient computation
        gradients = self._compute_gradients(features, labels)
        
        # Update local weights
        for i in range(len(self._local_weights)):
            self._local_weights[i] -= self.config.learning_rate * gradients[i]
        
        return LocalModelUpdate(
            client_id=self.client_id,
            round_number=round_number,
            weights=self._local_weights,
            samples_used=n_samples,
            local_loss=np.random.random() * 0.1  # Placeholder
        )
    
    def _compute_gradients(
        self,
        features: list[list[float]],
        labels: list[float]
    ) -> list[float]:
        """Compute gradients (simplified)."""
        # Would use actual backprop in production
        n_weights = len(self._local_weights)
        return [np.random.normal(0, 0.1) for _ in range(n_weights)]


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # RAG Models
    "ToneMarker",
    "VoiceProfile",
    "BrandDocument",
    "BrandIndex",
    "ContentBriefRequest",
    "ContentBriefResponse",
    
    # RAG Services
    "BrandIndexer",
    "VoiceExtractor",
    "BriefSynthesizer",
    "RagBriefService",
    
    # RAG Protocols
    "VectorStore",
    "EmbeddingModel",
    "LLMClient",
    
    # Federated Models
    "AggregationStrategy",
    "PrivacyLevel",
    "LocalModelUpdate",
    "GlobalModel",
    "SEOInsight",
    "FederatedConfig",
    
    # Federated Services
    "WeightAggregator",
    "DifferentialPrivacy",
    "InsightGenerator",
    "FederatedServer",
    "FederatedClient",
]
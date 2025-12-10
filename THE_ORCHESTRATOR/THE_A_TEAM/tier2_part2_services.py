"""
═══════════════════════════════════════════════════════════════════════════════
TIER 2 CORE SEO FEATURES - PART 2
═══════════════════════════════════════════════════════════════════════════════

Features 11-15:
- Intent Alignment Scorer
- Entity-Based Content Optimizer
- Competitor Strategy Analyzer
- SERP Feature Opportunity Finder
- Historical SERP Analyzer

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional, Protocol
from uuid import uuid4

import numpy as np
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #11: INTENT ALIGNMENT SCORER
# ═══════════════════════════════════════════════════════════════════════════════


class SearchIntent(str, Enum):
    """User search intent classification."""
    INFORMATIONAL = "informational"
    NAVIGATIONAL = "navigational"
    COMMERCIAL = "commercial"
    TRANSACTIONAL = "transactional"


class IntentSignal(BaseModel):
    """A signal indicating search intent."""
    signal_type: str
    weight: float
    description: str
    detected_in: str  # "serp", "content", "query"


class IntentAlignment(BaseModel):
    """Intent alignment analysis result."""
    keyword: str
    
    # SERP intent
    serp_dominant_intent: SearchIntent
    serp_intent_confidence: float = Field(ge=0.0, le=1.0)
    serp_intent_distribution: dict[str, float] = Field(default_factory=dict)
    
    # Content intent
    content_detected_intent: SearchIntent
    content_intent_confidence: float = Field(ge=0.0, le=1.0)
    
    # Alignment
    alignment_score: float = Field(ge=0.0, le=1.0)
    is_aligned: bool = True
    
    # Signals
    serp_signals: list[IntentSignal] = Field(default_factory=list)
    content_signals: list[IntentSignal] = Field(default_factory=list)
    
    # Recommendations
    gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class IntentAlignmentRequest(BaseModel):
    """Request for intent alignment analysis."""
    keyword: str
    content: str
    url: Optional[str] = None
    
    # SERP context (optional - will fetch if not provided)
    serp_results: list[dict] = Field(default_factory=list)


class IntentAlignmentResponse(BaseModel):
    """Response from intent alignment analysis."""
    alignment: IntentAlignment
    
    # Comparison to top rankers
    top_ranker_intents: list[dict] = Field(default_factory=list)
    
    # Action priority
    needs_optimization: bool = False
    optimization_priority: str = "low"


class SerpFetcher(Protocol):
    async def fetch(self, keyword: str) -> list[dict]:
        ...


class IntentAlignmentService:
    """
    Scores how well content aligns with SERP intent.
    
    Analyzes both SERP signals and content to determine alignment.
    """
    
    # Intent indicators
    INTENT_SIGNALS = {
        SearchIntent.INFORMATIONAL: {
            "query_words": ["how", "what", "why", "guide", "tutorial", "learn"],
            "serp_features": ["featured_snippet", "people_also_ask", "knowledge_panel"],
            "content_patterns": ["definition", "explanation", "steps", "examples"]
        },
        SearchIntent.COMMERCIAL: {
            "query_words": ["best", "top", "review", "comparison", "vs"],
            "serp_features": ["product_carousel", "reviews", "ratings"],
            "content_patterns": ["comparison", "pros", "cons", "recommendation"]
        },
        SearchIntent.TRANSACTIONAL: {
            "query_words": ["buy", "price", "cheap", "discount", "deal", "order"],
            "serp_features": ["shopping_results", "local_pack", "ads"],
            "content_patterns": ["buy now", "add to cart", "pricing", "checkout"]
        },
        SearchIntent.NAVIGATIONAL: {
            "query_words": ["login", "official", "website", "contact"],
            "serp_features": ["sitelinks", "knowledge_panel"],
            "content_patterns": ["homepage", "about us", "contact"]
        }
    }
    
    def __init__(self, serp_fetcher: Optional[SerpFetcher] = None):
        self.serp_fetcher = serp_fetcher
    
    async def analyze(self, request: IntentAlignmentRequest) -> IntentAlignmentResponse:
        """Analyze intent alignment."""
        # Get SERP if not provided
        serp_results = request.serp_results
        if not serp_results and self.serp_fetcher:
            serp_results = await self.serp_fetcher.fetch(request.keyword)
        
        # Analyze SERP intent
        serp_intent, serp_confidence, serp_distribution, serp_signals = self._analyze_serp_intent(
            request.keyword, serp_results
        )
        
        # Analyze content intent
        content_intent, content_confidence, content_signals = self._analyze_content_intent(
            request.content
        )
        
        # Calculate alignment
        alignment_score = self._calculate_alignment(
            serp_intent, serp_confidence,
            content_intent, content_confidence
        )
        
        # Generate recommendations
        gaps, recommendations = self._generate_recommendations(
            serp_intent, content_intent, alignment_score
        )
        
        alignment = IntentAlignment(
            keyword=request.keyword,
            serp_dominant_intent=serp_intent,
            serp_intent_confidence=serp_confidence,
            serp_intent_distribution=serp_distribution,
            content_detected_intent=content_intent,
            content_intent_confidence=content_confidence,
            alignment_score=alignment_score,
            is_aligned=alignment_score >= 0.7,
            serp_signals=serp_signals,
            content_signals=content_signals,
            gaps=gaps,
            recommendations=recommendations
        )
        
        return IntentAlignmentResponse(
            alignment=alignment,
            top_ranker_intents=self._extract_top_ranker_intents(serp_results[:5]),
            needs_optimization=alignment_score < 0.7,
            optimization_priority="high" if alignment_score < 0.5 else "medium" if alignment_score < 0.7 else "low"
        )
    
    def _analyze_serp_intent(
        self,
        keyword: str,
        serp_results: list[dict]
    ) -> tuple[SearchIntent, float, dict, list[IntentSignal]]:
        """Analyze SERP to determine dominant intent."""
        scores: dict[SearchIntent, float] = {intent: 0.0 for intent in SearchIntent}
        signals: list[IntentSignal] = []
        
        keyword_lower = keyword.lower()
        
        # Check query words
        for intent, indicators in self.INTENT_SIGNALS.items():
            for word in indicators["query_words"]:
                if word in keyword_lower:
                    scores[intent] += 0.3
                    signals.append(IntentSignal(
                        signal_type="query_word",
                        weight=0.3,
                        description=f"Query contains '{word}'",
                        detected_in="query"
                    ))
        
        # Check SERP features (from results)
        for result in serp_results:
            features = result.get("features", [])
            for intent, indicators in self.INTENT_SIGNALS.items():
                for feature in indicators["serp_features"]:
                    if feature in features:
                        scores[intent] += 0.2
                        signals.append(IntentSignal(
                            signal_type="serp_feature",
                            weight=0.2,
                            description=f"SERP contains {feature}",
                            detected_in="serp"
                        ))
        
        # Normalize
        total = sum(scores.values()) or 1
        distribution = {intent.value: round(score / total, 2) for intent, score in scores.items()}
        
        # Find dominant
        dominant = max(scores.items(), key=lambda x: x[1])
        confidence = dominant[1] / total if total > 0 else 0.5
        
        return dominant[0], round(confidence, 2), distribution, signals
    
    def _analyze_content_intent(
        self,
        content: str
    ) -> tuple[SearchIntent, float, list[IntentSignal]]:
        """Analyze content to determine its intent."""
        scores: dict[SearchIntent, float] = {intent: 0.0 for intent in SearchIntent}
        signals: list[IntentSignal] = []
        
        content_lower = content.lower()
        
        for intent, indicators in self.INTENT_SIGNALS.items():
            for pattern in indicators["content_patterns"]:
                if pattern in content_lower:
                    scores[intent] += 0.25
                    signals.append(IntentSignal(
                        signal_type="content_pattern",
                        weight=0.25,
                        description=f"Content contains '{pattern}' pattern",
                        detected_in="content"
                    ))
        
        # Find dominant
        total = sum(scores.values()) or 1
        dominant = max(scores.items(), key=lambda x: x[1])
        confidence = dominant[1] / total if total > 0 else 0.5
        
        return dominant[0], round(confidence, 2), signals
    
    def _calculate_alignment(
        self,
        serp_intent: SearchIntent,
        serp_conf: float,
        content_intent: SearchIntent,
        content_conf: float
    ) -> float:
        """Calculate intent alignment score."""
        if serp_intent == content_intent:
            # Perfect match - score based on confidence
            return round((serp_conf + content_conf) / 2, 2)
        else:
            # Mismatch - penalize based on confidence
            penalty = (serp_conf + content_conf) / 4
            return round(max(0, 0.5 - penalty), 2)
    
    def _generate_recommendations(
        self,
        serp_intent: SearchIntent,
        content_intent: SearchIntent,
        alignment: float
    ) -> tuple[list[str], list[str]]:
        """Generate gaps and recommendations."""
        gaps = []
        recommendations = []
        
        if serp_intent != content_intent:
            gaps.append(f"Content intent ({content_intent.value}) doesn't match SERP intent ({serp_intent.value})")
            
            if serp_intent == SearchIntent.INFORMATIONAL:
                recommendations.append("Add educational content and explanations")
                recommendations.append("Include how-to sections or guides")
            elif serp_intent == SearchIntent.COMMERCIAL:
                recommendations.append("Add comparison tables or reviews")
                recommendations.append("Include pros/cons analysis")
            elif serp_intent == SearchIntent.TRANSACTIONAL:
                recommendations.append("Add pricing information and CTAs")
                recommendations.append("Include product details and purchase options")
        
        if alignment < 0.7:
            gaps.append(f"Low alignment score ({alignment})")
            recommendations.append("Analyze top-ranking content for intent signals")
        
        return gaps, recommendations
    
    def _extract_top_ranker_intents(self, results: list[dict]) -> list[dict]:
        """Extract intent from top ranking results."""
        return [
            {
                "url": r.get("url", ""),
                "position": r.get("position", 0),
                "detected_intent": r.get("intent", "unknown")
            }
            for r in results
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #12: ENTITY-BASED CONTENT OPTIMIZER
# ═══════════════════════════════════════════════════════════════════════════════


class EntityType(str, Enum):
    """Entity types for SEO."""
    PERSON = "PERSON"
    ORGANIZATION = "ORG"
    LOCATION = "GPE"
    PRODUCT = "PRODUCT"
    DATE = "DATE"
    MONEY = "MONEY"
    EVENT = "EVENT"
    CONCEPT = "CONCEPT"


class SEOEntity(BaseModel):
    """An entity relevant to SEO."""
    text: str
    type: EntityType
    
    # Metrics
    frequency: int = 1
    prominence: float = 0.0  # Position weighting
    
    # SERP presence
    in_serp_results: int = 0  # How many top results mention it
    serp_importance: float = 0.0


class EntityGap(BaseModel):
    """A missing entity that top rankers have."""
    entity: str
    type: EntityType
    
    # Gap analysis
    competitors_using: int = 0
    avg_frequency: float = 0.0
    importance_score: float = 0.0
    
    # Recommendation
    suggested_usage: str = ""


class EntityOptimization(BaseModel):
    """Entity optimization analysis."""
    url: str
    
    # Current state
    entities_found: list[SEOEntity] = Field(default_factory=list)
    entity_density: float = 0.0  # Entities per 100 words
    
    # Gaps
    missing_entities: list[EntityGap] = Field(default_factory=list)
    underused_entities: list[EntityGap] = Field(default_factory=list)
    
    # Score
    entity_coverage_score: float = 0.0
    optimization_potential: float = 0.0
    
    # Actions
    priority_actions: list[str] = Field(default_factory=list)


class EntityOptimizationRequest(BaseModel):
    """Request for entity optimization."""
    content: str
    target_keyword: str
    url: Optional[str] = None
    
    # SERP context
    top_serp_content: list[str] = Field(default_factory=list)


class EntityOptimizationResponse(BaseModel):
    """Response from entity optimization."""
    optimization: EntityOptimization
    
    # Benchmark
    avg_competitor_entities: int = 0
    entity_type_distribution: dict[str, int] = Field(default_factory=dict)


class NERService(Protocol):
    """Protocol for Named Entity Recognition."""
    async def extract_entities(self, text: str) -> list[tuple[str, str]]:
        """Returns list of (entity_text, entity_type)."""
        ...


class EntityOptimizationService:
    """
    Optimizes content for Google's entity graph.
    
    Ensures content mentions relevant entities that top rankers use.
    """
    
    def __init__(self, ner_service: NERService):
        self.ner_service = ner_service
    
    async def optimize(self, request: EntityOptimizationRequest) -> EntityOptimizationResponse:
        """Analyze and optimize entity usage."""
        # Extract entities from content
        content_entities = await self._extract_entities(request.content)
        
        # Extract entities from SERP competitors
        serp_entities: list[SEOEntity] = []
        for competitor_content in request.top_serp_content:
            comp_entities = await self._extract_entities(competitor_content)
            serp_entities.extend(comp_entities)
        
        # Aggregate SERP entities
        serp_entity_counts = self._aggregate_entities(serp_entities)
        
        # Find gaps
        missing = self._find_missing_entities(content_entities, serp_entity_counts)
        underused = self._find_underused_entities(content_entities, serp_entity_counts)
        
        # Calculate scores
        coverage_score = self._calculate_coverage(content_entities, serp_entity_counts)
        
        # Generate actions
        actions = self._generate_actions(missing, underused)
        
        # Word count for density
        word_count = len(request.content.split())
        entity_density = len(content_entities) / word_count * 100 if word_count > 0 else 0
        
        optimization = EntityOptimization(
            url=request.url or "",
            entities_found=content_entities,
            entity_density=round(entity_density, 2),
            missing_entities=missing,
            underused_entities=underused,
            entity_coverage_score=coverage_score,
            optimization_potential=1 - coverage_score,
            priority_actions=actions
        )
        
        # Distribution
        type_dist = defaultdict(int)
        for e in content_entities:
            type_dist[e.type.value] += 1
        
        return EntityOptimizationResponse(
            optimization=optimization,
            avg_competitor_entities=len(serp_entity_counts),
            entity_type_distribution=dict(type_dist)
        )
    
    async def _extract_entities(self, text: str) -> list[SEOEntity]:
        """Extract entities from text."""
        raw_entities = await self.ner_service.extract_entities(text)
        
        # Aggregate by text
        entity_counts: dict[str, dict] = {}
        for entity_text, entity_type in raw_entities:
            key = entity_text.lower()
            if key not in entity_counts:
                entity_counts[key] = {
                    "text": entity_text,
                    "type": entity_type,
                    "frequency": 0
                }
            entity_counts[key]["frequency"] += 1
        
        return [
            SEOEntity(
                text=data["text"],
                type=EntityType(data["type"]) if data["type"] in [e.value for e in EntityType] else EntityType.CONCEPT,
                frequency=data["frequency"]
            )
            for data in entity_counts.values()
        ]
    
    def _aggregate_entities(self, entities: list[SEOEntity]) -> dict[str, dict]:
        """Aggregate entities across competitors."""
        aggregated: dict[str, dict] = {}
        
        for entity in entities:
            key = entity.text.lower()
            if key not in aggregated:
                aggregated[key] = {
                    "text": entity.text,
                    "type": entity.type,
                    "count": 0,
                    "total_frequency": 0
                }
            aggregated[key]["count"] += 1
            aggregated[key]["total_frequency"] += entity.frequency
        
        return aggregated
    
    def _find_missing_entities(
        self,
        content_entities: list[SEOEntity],
        serp_entities: dict[str, dict]
    ) -> list[EntityGap]:
        """Find entities in SERP but not in content."""
        content_keys = {e.text.lower() for e in content_entities}
        
        missing = []
        for key, data in serp_entities.items():
            if key not in content_keys and data["count"] >= 2:
                importance = data["count"] / 10  # Normalize
                missing.append(EntityGap(
                    entity=data["text"],
                    type=data["type"],
                    competitors_using=data["count"],
                    avg_frequency=data["total_frequency"] / data["count"],
                    importance_score=min(importance, 1.0),
                    suggested_usage=f"Mention '{data['text']}' at least once"
                ))
        
        # Sort by importance
        missing.sort(key=lambda x: x.importance_score, reverse=True)
        return missing[:10]
    
    def _find_underused_entities(
        self,
        content_entities: list[SEOEntity],
        serp_entities: dict[str, dict]
    ) -> list[EntityGap]:
        """Find entities used less than competitors."""
        underused = []
        
        for entity in content_entities:
            key = entity.text.lower()
            if key in serp_entities:
                serp_data = serp_entities[key]
                avg_freq = serp_data["total_frequency"] / serp_data["count"]
                
                if entity.frequency < avg_freq * 0.5:
                    underused.append(EntityGap(
                        entity=entity.text,
                        type=entity.type,
                        competitors_using=serp_data["count"],
                        avg_frequency=avg_freq,
                        importance_score=min(serp_data["count"] / 10, 1.0),
                        suggested_usage=f"Increase usage of '{entity.text}' (current: {entity.frequency}, avg: {avg_freq:.0f})"
                    ))
        
        return underused[:5]
    
    def _calculate_coverage(
        self,
        content_entities: list[SEOEntity],
        serp_entities: dict[str, dict]
    ) -> float:
        """Calculate entity coverage score."""
        if not serp_entities:
            return 1.0
        
        content_keys = {e.text.lower() for e in content_entities}
        
        # Weight by importance (count in SERP)
        total_weight = sum(data["count"] for data in serp_entities.values())
        covered_weight = sum(
            data["count"]
            for key, data in serp_entities.items()
            if key in content_keys
        )
        
        return round(covered_weight / total_weight if total_weight > 0 else 0, 2)
    
    def _generate_actions(
        self,
        missing: list[EntityGap],
        underused: list[EntityGap]
    ) -> list[str]:
        """Generate priority actions."""
        actions = []
        
        if missing:
            top_missing = missing[:3]
            actions.append(f"Add missing key entities: {', '.join(e.entity for e in top_missing)}")
        
        if underused:
            top_underused = underused[:2]
            actions.append(f"Increase mentions of: {', '.join(e.entity for e in top_underused)}")
        
        if not actions:
            actions.append("Entity coverage is good - focus on other optimizations")
        
        return actions


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #13: COMPETITOR STRATEGY ANALYZER
# ═══════════════════════════════════════════════════════════════════════════════


class ContentStrategy(BaseModel):
    """Detected content strategy."""
    strategy_type: str
    confidence: float
    evidence: list[str] = Field(default_factory=list)


class CompetitorProfile(BaseModel):
    """Profile of a competitor."""
    domain: str
    
    # Content analysis
    content_pillars: list[str] = Field(default_factory=list)
    avg_content_length: int = 0
    publishing_frequency: str = ""  # daily, weekly, monthly
    
    # Strategy
    detected_strategies: list[ContentStrategy] = Field(default_factory=list)
    primary_strategy: str = ""
    
    # Strengths/Weaknesses
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    
    # Opportunities
    gaps_you_can_exploit: list[str] = Field(default_factory=list)


class CompetitorAnalysisRequest(BaseModel):
    """Request for competitor analysis."""
    your_domain: str
    competitor_domains: list[str]
    target_keywords: list[str] = Field(default_factory=list)
    
    # Analysis depth
    analyze_backlinks: bool = False
    analyze_content: bool = True
    max_pages_per_competitor: int = Field(default=50, ge=10, le=200)


class CompetitorAnalysisResponse(BaseModel):
    """Response from competitor analysis."""
    your_profile: CompetitorProfile
    competitors: list[CompetitorProfile]
    
    # Comparison
    market_position: str = ""  # leader, challenger, follower, niche
    competitive_advantages: list[str] = Field(default_factory=list)
    areas_to_improve: list[str] = Field(default_factory=list)
    
    # Strategy recommendations
    recommended_strategies: list[str] = Field(default_factory=list)


class ContentCrawler(Protocol):
    """Protocol for content crawling."""
    async def crawl_site(self, domain: str, max_pages: int) -> list[dict]:
        """Returns list of {url, title, content, published_date}."""
        ...


class CompetitorStrategyService:
    """
    Reverse engineers competitor content strategies.
    
    Identifies patterns, pillars, and opportunities.
    """
    
    STRATEGY_PATTERNS = {
        "pillar_cluster": {
            "indicators": ["comprehensive guide", "pillar", "ultimate guide"],
            "description": "Topic cluster with pillar pages"
        },
        "news_jacking": {
            "indicators": ["news", "breaking", "update", "announce"],
            "description": "Capitalizing on trending topics"
        },
        "data_driven": {
            "indicators": ["study", "research", "statistics", "data"],
            "description": "Original research and data"
        },
        "comparison": {
            "indicators": ["vs", "comparison", "alternative", "versus"],
            "description": "Comparison content strategy"
        },
        "how_to": {
            "indicators": ["how to", "guide", "tutorial", "step by step"],
            "description": "Tutorial and how-to content"
        }
    }
    
    def __init__(self, crawler: Optional[ContentCrawler] = None):
        self.crawler = crawler
    
    async def analyze(self, request: CompetitorAnalysisRequest) -> CompetitorAnalysisResponse:
        """Analyze competitor strategies."""
        # Analyze your site
        your_profile = await self._analyze_domain(
            request.your_domain,
            request.max_pages_per_competitor
        )
        
        # Analyze competitors
        competitor_profiles = []
        for domain in request.competitor_domains:
            profile = await self._analyze_domain(
                domain,
                request.max_pages_per_competitor
            )
            # Find gaps
            profile.gaps_you_can_exploit = self._find_exploitable_gaps(
                your_profile, profile
            )
            competitor_profiles.append(profile)
        
        # Determine market position
        position = self._determine_position(your_profile, competitor_profiles)
        
        # Generate recommendations
        advantages, improvements, strategies = self._generate_recommendations(
            your_profile, competitor_profiles
        )
        
        return CompetitorAnalysisResponse(
            your_profile=your_profile,
            competitors=competitor_profiles,
            market_position=position,
            competitive_advantages=advantages,
            areas_to_improve=improvements,
            recommended_strategies=strategies
        )
    
    async def _analyze_domain(self, domain: str, max_pages: int) -> CompetitorProfile:
        """Analyze a single domain."""
        pages: list[dict] = []
        
        if self.crawler:
            pages = await self.crawler.crawl_site(domain, max_pages)
        
        # Detect content pillars
        pillars = self._detect_pillars(pages)
        
        # Detect strategies
        strategies = self._detect_strategies(pages)
        
        # Calculate metrics
        avg_length = np.mean([len(p.get("content", "").split()) for p in pages]) if pages else 0
        
        # Detect frequency
        frequency = self._detect_frequency(pages)
        
        # Identify strengths/weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(
            pages, strategies, avg_length
        )
        
        return CompetitorProfile(
            domain=domain,
            content_pillars=pillars[:5],
            avg_content_length=int(avg_length),
            publishing_frequency=frequency,
            detected_strategies=strategies,
            primary_strategy=strategies[0].strategy_type if strategies else "unknown",
            strengths=strengths,
            weaknesses=weaknesses
        )
    
    def _detect_pillars(self, pages: list[dict]) -> list[str]:
        """Detect content pillars from pages."""
        # Group by URL structure
        pillars: dict[str, int] = defaultdict(int)
        
        for page in pages:
            url = page.get("url", "")
            # Extract first path segment
            parts = url.split("/")
            if len(parts) > 3:
                pillar = parts[3]
                if pillar and len(pillar) > 2:
                    pillars[pillar] += 1
        
        # Sort by count
        sorted_pillars = sorted(pillars.items(), key=lambda x: x[1], reverse=True)
        return [p[0] for p in sorted_pillars]
    
    def _detect_strategies(self, pages: list[dict]) -> list[ContentStrategy]:
        """Detect content strategies from pages."""
        strategy_scores: dict[str, float] = defaultdict(float)
        strategy_evidence: dict[str, list] = defaultdict(list)
        
        for page in pages:
            title = page.get("title", "").lower()
            content = page.get("content", "").lower()[:1000]
            combined = f"{title} {content}"
            
            for strategy, data in self.STRATEGY_PATTERNS.items():
                for indicator in data["indicators"]:
                    if indicator in combined:
                        strategy_scores[strategy] += 1
                        strategy_evidence[strategy].append(
                            f"'{indicator}' found in {page.get('url', 'unknown')}"
                        )
        
        # Normalize and create objects
        total = sum(strategy_scores.values()) or 1
        strategies = [
            ContentStrategy(
                strategy_type=strategy,
                confidence=round(score / total, 2),
                evidence=strategy_evidence[strategy][:3]
            )
            for strategy, score in strategy_scores.items()
            if score > 0
        ]
        
        strategies.sort(key=lambda s: s.confidence, reverse=True)
        return strategies[:5]
    
    def _detect_frequency(self, pages: list[dict]) -> str:
        """Detect publishing frequency."""
        dates = []
        for page in pages:
            if "published_date" in page and page["published_date"]:
                dates.append(page["published_date"])
        
        if len(dates) < 2:
            return "unknown"
        
        dates.sort()
        # Calculate average gap
        gaps = []
        for i in range(1, len(dates)):
            if isinstance(dates[i], datetime) and isinstance(dates[i-1], datetime):
                gap = (dates[i] - dates[i-1]).days
                gaps.append(gap)
        
        if not gaps:
            return "unknown"
        
        avg_gap = np.mean(gaps)
        
        if avg_gap < 2:
            return "daily"
        elif avg_gap < 7:
            return "multiple per week"
        elif avg_gap < 14:
            return "weekly"
        elif avg_gap < 30:
            return "bi-weekly"
        else:
            return "monthly or less"
    
    def _identify_strengths_weaknesses(
        self,
        pages: list[dict],
        strategies: list[ContentStrategy],
        avg_length: float
    ) -> tuple[list[str], list[str]]:
        """Identify strengths and weaknesses."""
        strengths = []
        weaknesses = []
        
        # Content length
        if avg_length > 2000:
            strengths.append("Long-form, comprehensive content")
        elif avg_length < 800:
            weaknesses.append("Content tends to be thin")
        
        # Strategy diversity
        if len(strategies) >= 3:
            strengths.append("Diverse content strategy")
        elif len(strategies) <= 1:
            weaknesses.append("Limited content strategy diversity")
        
        # Volume
        if len(pages) > 100:
            strengths.append("Large content library")
        elif len(pages) < 20:
            weaknesses.append("Limited content volume")
        
        return strengths, weaknesses
    
    def _find_exploitable_gaps(
        self,
        your_profile: CompetitorProfile,
        competitor: CompetitorProfile
    ) -> list[str]:
        """Find gaps you can exploit against competitor."""
        gaps = []
        
        # Content length gap
        if your_profile.avg_content_length > competitor.avg_content_length * 1.5:
            gaps.append("You produce more comprehensive content")
        
        # Strategy gaps
        your_strategies = {s.strategy_type for s in your_profile.detected_strategies}
        their_strategies = {s.strategy_type for s in competitor.detected_strategies}
        
        unique_to_you = your_strategies - their_strategies
        if unique_to_you:
            gaps.append(f"You use strategies they don't: {', '.join(unique_to_you)}")
        
        # Pillar gaps
        your_pillars = set(your_profile.content_pillars)
        their_pillars = set(competitor.content_pillars)
        
        unique_pillars = your_pillars - their_pillars
        if unique_pillars:
            gaps.append(f"You cover topics they don't: {', '.join(list(unique_pillars)[:3])}")
        
        return gaps
    
    def _determine_position(
        self,
        your_profile: CompetitorProfile,
        competitors: list[CompetitorProfile]
    ) -> str:
        """Determine market position."""
        your_score = len(your_profile.strengths) - len(your_profile.weaknesses)
        
        competitor_scores = [
            len(c.strengths) - len(c.weaknesses)
            for c in competitors
        ]
        
        if not competitor_scores:
            return "leader"
        
        avg_competitor = np.mean(competitor_scores)
        
        if your_score > avg_competitor + 1:
            return "leader"
        elif your_score > avg_competitor:
            return "challenger"
        elif your_score > avg_competitor - 1:
            return "follower"
        else:
            return "niche"
    
    def _generate_recommendations(
        self,
        your_profile: CompetitorProfile,
        competitors: list[CompetitorProfile]
    ) -> tuple[list[str], list[str], list[str]]:
        """Generate strategic recommendations."""
        advantages = your_profile.strengths[:3]
        improvements = your_profile.weaknesses[:3]
        
        strategies = []
        
        # Find most common competitor strategy
        all_strategies = []
        for c in competitors:
            all_strategies.extend([s.strategy_type for s in c.detected_strategies])
        
        if all_strategies:
            from collections import Counter
            common = Counter(all_strategies).most_common(1)[0][0]
            
            if common not in [s.strategy_type for s in your_profile.detected_strategies]:
                strategies.append(f"Consider adopting '{common}' strategy - common among competitors")
        
        # Suggest differentiation
        strategies.append("Focus on your unique content pillars to differentiate")
        strategies.append("Increase publishing frequency to build topical authority faster")
        
        return advantages, improvements, strategies


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #14: SERP FEATURE OPPORTUNITY FINDER
# ═══════════════════════════════════════════════════════════════════════════════


class SerpFeatureType(str, Enum):
    """Types of SERP features."""
    FEATURED_SNIPPET = "featured_snippet"
    PEOPLE_ALSO_ASK = "people_also_ask"
    KNOWLEDGE_PANEL = "knowledge_panel"
    LOCAL_PACK = "local_pack"
    IMAGE_PACK = "image_pack"
    VIDEO_CAROUSEL = "video_carousel"
    SHOPPING_RESULTS = "shopping_results"
    NEWS_BOX = "news_box"
    SITELINKS = "sitelinks"
    REVIEWS = "reviews"


class SerpFeatureOpportunity(BaseModel):
    """An opportunity to win a SERP feature."""
    feature_type: SerpFeatureType
    keyword: str
    
    # Opportunity
    difficulty: float = Field(ge=0.0, le=1.0)
    winability_score: float = Field(ge=0.0, le=1.0)
    
    # Current state
    currently_owned_by: Optional[str] = None
    your_current_position: Optional[int] = None
    
    # Requirements
    content_requirements: list[str] = Field(default_factory=list)
    structural_requirements: list[str] = Field(default_factory=list)
    
    # Template
    template_suggestion: str = ""


class SerpFeatureRequest(BaseModel):
    """Request for SERP feature analysis."""
    keywords: list[str]
    your_domain: str
    
    # Focus
    target_features: list[SerpFeatureType] = Field(default_factory=list)


class SerpFeatureResponse(BaseModel):
    """Response from SERP feature analysis."""
    opportunities: list[SerpFeatureOpportunity]
    
    # Summary
    total_opportunities: int = 0
    high_winability_count: int = 0
    
    # By feature type
    opportunities_by_type: dict[str, int] = Field(default_factory=dict)


class SerpFeatureService:
    """
    Identifies winnable SERP features.
    
    Analyzes requirements and provides templates.
    """
    
    FEATURE_REQUIREMENTS = {
        SerpFeatureType.FEATURED_SNIPPET: {
            "content": [
                "Direct answer in first paragraph",
                "Use target keyword in heading",
                "Include lists or tables for listicle queries"
            ],
            "structural": [
                "Use H2/H3 for question",
                "Answer in 40-60 words",
                "Use structured data where applicable"
            ],
            "template": "Q: {keyword}?\nA: {direct_answer_40_60_words}"
        },
        SerpFeatureType.PEOPLE_ALSO_ASK: {
            "content": [
                "Answer related questions",
                "Provide concise, factual answers",
                "Cover topic comprehensively"
            ],
            "structural": [
                "Use FAQ schema",
                "H2 for each question",
                "2-3 sentence answers"
            ],
            "template": "## {question}\n{answer_2_3_sentences}"
        },
        SerpFeatureType.VIDEO_CAROUSEL: {
            "content": [
                "Create video content",
                "Optimize video title with keyword",
                "Include transcript"
            ],
            "structural": [
                "VideoObject schema",
                "Thumbnail optimization",
                "Video sitemap"
            ],
            "template": "Title: {keyword} - {video_topic}\nDescription: {description_with_keyword}"
        }
    }
    
    def analyze(self, request: SerpFeatureRequest) -> SerpFeatureResponse:
        """Analyze SERP feature opportunities."""
        opportunities: list[SerpFeatureOpportunity] = []
        
        for keyword in request.keywords:
            keyword_opportunities = self._analyze_keyword(
                keyword,
                request.your_domain,
                request.target_features
            )
            opportunities.extend(keyword_opportunities)
        
        # Sort by winability
        opportunities.sort(key=lambda o: o.winability_score, reverse=True)
        
        # Count by type
        by_type: dict[str, int] = defaultdict(int)
        for opp in opportunities:
            by_type[opp.feature_type.value] += 1
        
        return SerpFeatureResponse(
            opportunities=opportunities,
            total_opportunities=len(opportunities),
            high_winability_count=sum(1 for o in opportunities if o.winability_score >= 0.7),
            opportunities_by_type=dict(by_type)
        )
    
    def _analyze_keyword(
        self,
        keyword: str,
        domain: str,
        target_features: list[SerpFeatureType]
    ) -> list[SerpFeatureOpportunity]:
        """Analyze opportunities for a single keyword."""
        opportunities = []
        
        features_to_check = target_features or list(SerpFeatureType)
        
        for feature in features_to_check:
            if feature not in self.FEATURE_REQUIREMENTS:
                continue
            
            requirements = self.FEATURE_REQUIREMENTS[feature]
            
            # Calculate winability (simplified - would use SERP data)
            winability = self._calculate_winability(keyword, feature)
            
            if winability > 0.3:  # Only show viable opportunities
                opportunities.append(SerpFeatureOpportunity(
                    feature_type=feature,
                    keyword=keyword,
                    difficulty=1 - winability,
                    winability_score=winability,
                    content_requirements=requirements["content"],
                    structural_requirements=requirements["structural"],
                    template_suggestion=requirements["template"]
                ))
        
        return opportunities
    
    def _calculate_winability(
        self,
        keyword: str,
        feature: SerpFeatureType
    ) -> float:
        """Calculate winability score for feature."""
        # Simplified scoring - would use actual SERP analysis
        base_score = 0.5
        
        # Question keywords boost featured snippet chances
        if feature == SerpFeatureType.FEATURED_SNIPPET:
            question_words = ["how", "what", "why", "when", "where", "which"]
            if any(q in keyword.lower() for q in question_words):
                base_score += 0.2
        
        # Video keywords boost video carousel
        if feature == SerpFeatureType.VIDEO_CAROUSEL:
            video_words = ["tutorial", "how to", "review", "demo"]
            if any(v in keyword.lower() for v in video_words):
                base_score += 0.2
        
        return min(base_score, 0.95)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #15: HISTORICAL SERP ANALYZER
# ═══════════════════════════════════════════════════════════════════════════════


class SerpTrend(BaseModel):
    """A trend in SERP data."""
    trend_type: str  # volatility, intent_shift, feature_change, new_player
    description: str
    start_date: datetime
    magnitude: float = 0.0
    affected_positions: list[int] = Field(default_factory=list)


class HistoricalPosition(BaseModel):
    """Position at a point in time."""
    date: datetime
    url: str
    position: int
    title: str


class DomainHistory(BaseModel):
    """Historical SERP data for a domain."""
    domain: str
    keyword: str
    
    positions: list[HistoricalPosition] = Field(default_factory=list)
    
    # Stats
    avg_position: float = 0.0
    best_position: int = 100
    worst_position: int = 100
    volatility: float = 0.0
    
    # Trend
    trend_direction: str = "stable"  # up, down, stable
    trend_strength: float = 0.0


class HistoricalAnalysis(BaseModel):
    """Complete historical SERP analysis."""
    keyword: str
    time_period: str
    
    # Trends
    trends: list[SerpTrend] = Field(default_factory=list)
    
    # Domain tracking
    domain_histories: dict[str, DomainHistory] = Field(default_factory=dict)
    
    # SERP volatility
    overall_volatility: float = 0.0
    stable_positions: list[int] = Field(default_factory=list)
    volatile_positions: list[int] = Field(default_factory=list)
    
    # Winners/Losers
    biggest_gainers: list[str] = Field(default_factory=list)
    biggest_losers: list[str] = Field(default_factory=list)


class HistoricalRequest(BaseModel):
    """Request for historical analysis."""
    keyword: str
    
    # Time range
    start_date: datetime
    end_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Focus domains (optional)
    track_domains: list[str] = Field(default_factory=list)


class HistoricalResponse(BaseModel):
    """Response from historical analysis."""
    analysis: HistoricalAnalysis
    
    # Insights
    key_insights: list[str] = Field(default_factory=list)
    
    # Predictions
    predicted_trend: str = ""


class SerpHistoryStore(Protocol):
    """Protocol for SERP history storage."""
    async def get_history(
        self,
        keyword: str,
        start_date: datetime,
        end_date: datetime
    ) -> list[dict]:
        """Returns list of {date, positions: [{url, position, title}]}."""
        ...


class HistoricalSerpService:
    """
    Analyzes SERP changes over time.
    
    Identifies trends, patterns, and ranking dynamics.
    """
    
    def __init__(self, history_store: SerpHistoryStore):
        self.history_store = history_store
    
    async def analyze(self, request: HistoricalRequest) -> HistoricalResponse:
        """Analyze historical SERP data."""
        # Get history
        history = await self.history_store.get_history(
            request.keyword,
            request.start_date,
            request.end_date
        )
        
        if not history:
            return HistoricalResponse(
                analysis=HistoricalAnalysis(
                    keyword=request.keyword,
                    time_period=f"{request.start_date.date()} to {request.end_date.date()}"
                ),
                key_insights=["No historical data available"]
            )
        
        # Build domain histories
        domain_histories = self._build_domain_histories(history, request.keyword)
        
        # Filter to tracked domains if specified
        if request.track_domains:
            domain_histories = {
                d: h for d, h in domain_histories.items()
                if d in request.track_domains
            }
        
        # Detect trends
        trends = self._detect_trends(history, domain_histories)
        
        # Calculate volatility
        volatility, stable, volatile = self._calculate_volatility(history)
        
        # Find gainers/losers
        gainers, losers = self._find_gainers_losers(domain_histories)
        
        analysis = HistoricalAnalysis(
            keyword=request.keyword,
            time_period=f"{request.start_date.date()} to {request.end_date.date()}",
            trends=trends,
            domain_histories=domain_histories,
            overall_volatility=volatility,
            stable_positions=stable,
            volatile_positions=volatile,
            biggest_gainers=gainers,
            biggest_losers=losers
        )
        
        # Generate insights
        insights = self._generate_insights(analysis)
        
        return HistoricalResponse(
            analysis=analysis,
            key_insights=insights,
            predicted_trend=self._predict_trend(trends)
        )
    
    def _build_domain_histories(
        self,
        history: list[dict],
        keyword: str
    ) -> dict[str, DomainHistory]:
        """Build domain histories from raw data."""
        domains: dict[str, list[HistoricalPosition]] = defaultdict(list)
        
        for snapshot in history:
            date = snapshot.get("date")
            for pos in snapshot.get("positions", []):
                url = pos.get("url", "")
                domain = self._extract_domain(url)
                
                domains[domain].append(HistoricalPosition(
                    date=date,
                    url=url,
                    position=pos.get("position", 100),
                    title=pos.get("title", "")
                ))
        
        # Build DomainHistory objects
        histories = {}
        for domain, positions in domains.items():
            positions.sort(key=lambda p: p.date)
            
            pos_values = [p.position for p in positions]
            avg = np.mean(pos_values)
            volatility = np.std(pos_values)
            
            # Determine trend
            if len(pos_values) >= 2:
                first_half = np.mean(pos_values[:len(pos_values)//2])
                second_half = np.mean(pos_values[len(pos_values)//2:])
                
                if second_half < first_half - 2:
                    trend_dir = "up"  # Lower position = better
                    trend_strength = (first_half - second_half) / 10
                elif second_half > first_half + 2:
                    trend_dir = "down"
                    trend_strength = (second_half - first_half) / 10
                else:
                    trend_dir = "stable"
                    trend_strength = 0
            else:
                trend_dir = "stable"
                trend_strength = 0
            
            histories[domain] = DomainHistory(
                domain=domain,
                keyword=keyword,
                positions=positions,
                avg_position=round(avg, 1),
                best_position=min(pos_values),
                worst_position=max(pos_values),
                volatility=round(volatility, 2),
                trend_direction=trend_dir,
                trend_strength=min(trend_strength, 1.0)
            )
        
        return histories
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL."""
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace("www.", "")
    
    def _detect_trends(
        self,
        history: list[dict],
        domain_histories: dict[str, DomainHistory]
    ) -> list[SerpTrend]:
        """Detect trends in SERP data."""
        trends = []
        
        # High volatility trend
        high_volatility_domains = [
            d for d, h in domain_histories.items()
            if h.volatility > 5
        ]
        if high_volatility_domains:
            trends.append(SerpTrend(
                trend_type="volatility",
                description=f"High volatility for: {', '.join(high_volatility_domains[:3])}",
                start_date=history[0]["date"] if history else datetime.utcnow(),
                magnitude=max(h.volatility for h in domain_histories.values())
            ))
        
        # New players
        # (Simplified - would compare first and last snapshots)
        
        return trends
    
    def _calculate_volatility(
        self,
        history: list[dict]
    ) -> tuple[float, list[int], list[int]]:
        """Calculate overall SERP volatility."""
        if len(history) < 2:
            return 0.0, [], []
        
        # Track position changes per position slot
        position_changes: dict[int, list[int]] = defaultdict(list)
        
        for i in range(1, len(history)):
            prev = {p["url"]: p["position"] for p in history[i-1].get("positions", [])}
            curr = {p["url"]: p["position"] for p in history[i].get("positions", [])}
            
            for url, curr_pos in curr.items():
                if url in prev:
                    change = abs(curr_pos - prev[url])
                    position_changes[curr_pos].append(change)
        
        # Calculate volatility per position
        position_volatility = {
            pos: np.mean(changes)
            for pos, changes in position_changes.items()
            if changes
        }
        
        # Categorize
        stable = [pos for pos, vol in position_volatility.items() if vol < 2]
        volatile = [pos for pos, vol in position_volatility.items() if vol >= 5]
        
        overall = np.mean(list(position_volatility.values())) if position_volatility else 0
        
        return round(overall, 2), sorted(stable)[:5], sorted(volatile)[:5]
    
    def _find_gainers_losers(
        self,
        domain_histories: dict[str, DomainHistory]
    ) -> tuple[list[str], list[str]]:
        """Find biggest gainers and losers."""
        sorted_by_trend = sorted(
            domain_histories.items(),
            key=lambda x: (-1 if x[1].trend_direction == "up" else 1) * x[1].trend_strength,
            reverse=True
        )
        
        gainers = [d for d, h in sorted_by_trend if h.trend_direction == "up"][:5]
        losers = [d for d, h in sorted_by_trend if h.trend_direction == "down"][:5]
        
        return gainers, losers
    
    def _generate_insights(self, analysis: HistoricalAnalysis) -> list[str]:
        """Generate key insights."""
        insights = []
        
        if analysis.overall_volatility > 5:
            insights.append(f"High SERP volatility ({analysis.overall_volatility:.1f}) - frequent ranking changes")
        elif analysis.overall_volatility < 2:
            insights.append("Stable SERP - rankings relatively consistent")
        
        if analysis.biggest_gainers:
            insights.append(f"Rising domains: {', '.join(analysis.biggest_gainers[:3])}")
        
        if analysis.biggest_losers:
            insights.append(f"Declining domains: {', '.join(analysis.biggest_losers[:3])}")
        
        return insights
    
    def _predict_trend(self, trends: list[SerpTrend]) -> str:
        """Predict future trend."""
        if not trends:
            return "Stable - no major changes expected"
        
        volatility_trends = [t for t in trends if t.trend_type == "volatility"]
        if volatility_trends and volatility_trends[0].magnitude > 5:
            return "Volatile - expect continued ranking fluctuations"
        
        return "Moderately stable - minor changes possible"


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Feature 11: Intent Alignment
    "SearchIntent",
    "IntentSignal",
    "IntentAlignment",
    "IntentAlignmentRequest",
    "IntentAlignmentResponse",
    "IntentAlignmentService",
    
    # Feature 12: Entity Optimization
    "EntityType",
    "SEOEntity",
    "EntityGap",
    "EntityOptimization",
    "EntityOptimizationRequest",
    "EntityOptimizationResponse",
    "EntityOptimizationService",
    
    # Feature 13: Competitor Strategy
    "ContentStrategy",
    "CompetitorProfile",
    "CompetitorAnalysisRequest",
    "CompetitorAnalysisResponse",
    "CompetitorStrategyService",
    
    # Feature 14: SERP Features
    "SerpFeatureType",
    "SerpFeatureOpportunity",
    "SerpFeatureRequest",
    "SerpFeatureResponse",
    "SerpFeatureService",
    
    # Feature 15: Historical SERP
    "SerpTrend",
    "HistoricalPosition",
    "DomainHistory",
    "HistoricalAnalysis",
    "HistoricalRequest",
    "HistoricalResponse",
    "HistoricalSerpService",
]
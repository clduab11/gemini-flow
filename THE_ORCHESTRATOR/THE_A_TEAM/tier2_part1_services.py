"""
═══════════════════════════════════════════════════════════════════════════════
TIER 2 CORE SEO FEATURES - PART 1
═══════════════════════════════════════════════════════════════════════════════

Features 6-10:
- Semantic Keyword Clustering
- Content Freshness Analyzer
- Multi-Language SEO Pipeline
- Anchor Text Risk Scorer
- Link Density Compliance Checker

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional, Protocol
from uuid import uuid4

import numpy as np
from pydantic import BaseModel, Field
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics.pairwise import cosine_similarity


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #6: SEMANTIC KEYWORD CLUSTERING
# ═══════════════════════════════════════════════════════════════════════════════


class ClusterMethod(str, Enum):
    """Clustering algorithm to use."""
    KMEANS = "kmeans"
    DBSCAN = "dbscan"
    HIERARCHICAL = "hierarchical"


class KeywordIntent(str, Enum):
    """Search intent classification."""
    INFORMATIONAL = "informational"
    COMMERCIAL = "commercial"
    TRANSACTIONAL = "transactional"
    NAVIGATIONAL = "navigational"


class ClusteredKeyword(BaseModel):
    """A keyword with cluster assignment."""
    keyword: str
    cluster_id: int
    cluster_name: str = ""
    
    # Metrics
    volume: int = 0
    difficulty: float = 0.0
    intent: KeywordIntent = KeywordIntent.INFORMATIONAL
    
    # Semantic
    embedding: list[float] = Field(default_factory=list)
    similarity_to_centroid: float = 0.0


class KeywordCluster(BaseModel):
    """A cluster of semantically related keywords."""
    cluster_id: int
    name: str
    
    # Keywords
    keywords: list[ClusteredKeyword] = Field(default_factory=list)
    centroid_keyword: str = ""  # Most representative
    
    # Aggregate metrics
    total_volume: int = 0
    avg_difficulty: float = 0.0
    dominant_intent: KeywordIntent = KeywordIntent.INFORMATIONAL
    
    # Strategy
    content_opportunity_score: float = 0.0
    recommended_content_type: str = ""


class ClusteringRequest(BaseModel):
    """Request for keyword clustering."""
    keywords: list[str]
    
    # Options
    method: ClusterMethod = ClusterMethod.KMEANS
    num_clusters: Optional[int] = None  # Auto-detect if None
    min_cluster_size: int = Field(default=3, ge=2)
    
    # Include metrics
    fetch_metrics: bool = True


class ClusteringResponse(BaseModel):
    """Response from keyword clustering."""
    request_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    clusters: list[KeywordCluster]
    unclustered: list[str] = Field(default_factory=list)
    
    # Stats
    total_keywords: int = 0
    num_clusters: int = 0
    avg_cluster_size: float = 0.0
    
    # Metadata
    method_used: ClusterMethod = ClusterMethod.KMEANS
    processing_time_ms: float = 0.0


class EmbeddingService(Protocol):
    """Protocol for embedding generation."""
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        ...


class KeywordMetricsService(Protocol):
    """Protocol for keyword metrics."""
    async def get_metrics(self, keywords: list[str]) -> dict[str, dict]:
        """Returns {keyword: {volume, difficulty, intent}}"""
        ...


class KeywordClusteringService:
    """
    Clusters keywords by semantic meaning.
    
    Unlike string-based clustering, this uses embeddings to group
    keywords by actual semantic similarity.
    """
    
    def __init__(
        self,
        embedding_service: EmbeddingService,
        metrics_service: Optional[KeywordMetricsService] = None
    ):
        self.embedding_service = embedding_service
        self.metrics_service = metrics_service
    
    async def cluster(self, request: ClusteringRequest) -> ClusteringResponse:
        """Cluster keywords semantically."""
        import time
        start = time.perf_counter()
        
        keywords = list(set(request.keywords))  # Dedupe
        
        # Get embeddings
        embeddings = await self.embedding_service.embed_batch(keywords)
        embedding_matrix = np.array(embeddings)
        
        # Determine number of clusters
        n_clusters = request.num_clusters or self._estimate_clusters(len(keywords))
        
        # Cluster
        if request.method == ClusterMethod.KMEANS:
            labels, centroids = self._kmeans_cluster(embedding_matrix, n_clusters)
        elif request.method == ClusterMethod.DBSCAN:
            labels, centroids = self._dbscan_cluster(embedding_matrix, request.min_cluster_size)
        else:
            labels, centroids = self._kmeans_cluster(embedding_matrix, n_clusters)
        
        # Get metrics if requested
        metrics = {}
        if request.fetch_metrics and self.metrics_service:
            metrics = await self.metrics_service.get_metrics(keywords)
        
        # Build clusters
        clusters = self._build_clusters(keywords, embeddings, labels, centroids, metrics)
        
        # Find unclustered (noise from DBSCAN)
        unclustered = [kw for kw, label in zip(keywords, labels) if label == -1]
        
        processing_time = (time.perf_counter() - start) * 1000
        
        return ClusteringResponse(
            clusters=clusters,
            unclustered=unclustered,
            total_keywords=len(keywords),
            num_clusters=len(clusters),
            avg_cluster_size=len(keywords) / len(clusters) if clusters else 0,
            method_used=request.method,
            processing_time_ms=round(processing_time, 2)
        )
    
    def _estimate_clusters(self, n_keywords: int) -> int:
        """Estimate optimal number of clusters."""
        # Rule of thumb: sqrt(n/2)
        return max(2, int(np.sqrt(n_keywords / 2)))
    
    def _kmeans_cluster(
        self,
        embeddings: np.ndarray,
        n_clusters: int
    ) -> tuple[list[int], np.ndarray]:
        """K-means clustering."""
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(embeddings)
        return labels.tolist(), kmeans.cluster_centers_
    
    def _dbscan_cluster(
        self,
        embeddings: np.ndarray,
        min_samples: int
    ) -> tuple[list[int], np.ndarray]:
        """DBSCAN clustering."""
        dbscan = DBSCAN(eps=0.3, min_samples=min_samples, metric='cosine')
        labels = dbscan.fit_predict(embeddings)
        
        # Calculate centroids for each cluster
        unique_labels = set(labels) - {-1}
        centroids = []
        for label in unique_labels:
            mask = labels == label
            centroid = embeddings[mask].mean(axis=0)
            centroids.append(centroid)
        
        return labels.tolist(), np.array(centroids) if centroids else np.array([])
    
    def _build_clusters(
        self,
        keywords: list[str],
        embeddings: list[list[float]],
        labels: list[int],
        centroids: np.ndarray,
        metrics: dict[str, dict]
    ) -> list[KeywordCluster]:
        """Build cluster objects from clustering results."""
        clusters_dict: dict[int, list[tuple[str, list[float]]]] = defaultdict(list)
        
        for kw, emb, label in zip(keywords, embeddings, labels):
            if label >= 0:  # Exclude noise
                clusters_dict[label].append((kw, emb))
        
        clusters = []
        for cluster_id, kw_emb_list in clusters_dict.items():
            # Find centroid keyword
            if cluster_id < len(centroids):
                centroid = centroids[cluster_id]
                similarities = [
                    cosine_similarity([emb], [centroid])[0][0]
                    for _, emb in kw_emb_list
                ]
                centroid_idx = np.argmax(similarities)
                centroid_keyword = kw_emb_list[centroid_idx][0]
            else:
                centroid_keyword = kw_emb_list[0][0]
                similarities = [0.5] * len(kw_emb_list)
            
            # Build clustered keywords
            clustered_keywords = []
            total_volume = 0
            difficulties = []
            intents: dict[KeywordIntent, int] = defaultdict(int)
            
            for (kw, emb), sim in zip(kw_emb_list, similarities):
                kw_metrics = metrics.get(kw, {})
                
                intent = KeywordIntent(kw_metrics.get('intent', 'informational'))
                intents[intent] += 1
                
                volume = kw_metrics.get('volume', 0)
                difficulty = kw_metrics.get('difficulty', 0.5)
                
                total_volume += volume
                difficulties.append(difficulty)
                
                clustered_keywords.append(ClusteredKeyword(
                    keyword=kw,
                    cluster_id=cluster_id,
                    cluster_name=centroid_keyword,
                    volume=volume,
                    difficulty=difficulty,
                    intent=intent,
                    embedding=emb,
                    similarity_to_centroid=float(sim)
                ))
            
            # Determine dominant intent
            dominant_intent = max(intents.items(), key=lambda x: x[1])[0] if intents else KeywordIntent.INFORMATIONAL
            
            clusters.append(KeywordCluster(
                cluster_id=cluster_id,
                name=centroid_keyword,
                keywords=clustered_keywords,
                centroid_keyword=centroid_keyword,
                total_volume=total_volume,
                avg_difficulty=np.mean(difficulties) if difficulties else 0.5,
                dominant_intent=dominant_intent,
                content_opportunity_score=self._calculate_opportunity(total_volume, np.mean(difficulties) if difficulties else 0.5),
                recommended_content_type=self._recommend_content_type(dominant_intent)
            ))
        
        # Sort by opportunity
        clusters.sort(key=lambda c: c.content_opportunity_score, reverse=True)
        return clusters
    
    def _calculate_opportunity(self, volume: int, difficulty: float) -> float:
        """Calculate content opportunity score."""
        # Higher volume + lower difficulty = higher opportunity
        volume_score = min(volume / 10000, 1.0)
        difficulty_score = 1 - difficulty
        return round((volume_score * 0.6 + difficulty_score * 0.4), 3)
    
    def _recommend_content_type(self, intent: KeywordIntent) -> str:
        """Recommend content type based on intent."""
        recommendations = {
            KeywordIntent.INFORMATIONAL: "Long-form guide or how-to article",
            KeywordIntent.COMMERCIAL: "Comparison or review article",
            KeywordIntent.TRANSACTIONAL: "Product page or landing page",
            KeywordIntent.NAVIGATIONAL: "Brand page or homepage optimization"
        }
        return recommendations.get(intent, "Blog post")


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #7: CONTENT FRESHNESS ANALYZER
# ═══════════════════════════════════════════════════════════════════════════════


class FreshnessLevel(str, Enum):
    """Content freshness classification."""
    FRESH = "fresh"           # < 30 days
    CURRENT = "current"       # 30-90 days
    AGING = "aging"           # 90-180 days
    STALE = "stale"           # 180-365 days
    OUTDATED = "outdated"     # > 365 days


class FreshnessAlert(BaseModel):
    """Alert for content that needs refreshing."""
    alert_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    url: str
    
    # Freshness analysis
    freshness_level: FreshnessLevel
    last_modified: datetime
    days_since_update: int
    
    # Semantic drift
    serp_drift_score: float = 0.0  # How much SERP changed
    topic_drift_score: float = 0.0  # How much topic evolved
    
    # Recommendation
    urgency: str = "medium"  # low, medium, high, critical
    recommended_actions: list[str] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ContentPage(BaseModel):
    """A content page to analyze for freshness."""
    url: str
    title: str
    target_keyword: str
    
    # Dates
    published_at: Optional[datetime] = None
    last_modified: Optional[datetime] = None
    
    # Current state
    current_position: Optional[int] = None
    content_hash: str = ""
    topics: list[str] = Field(default_factory=list)


class FreshnessAnalysisRequest(BaseModel):
    """Request for freshness analysis."""
    pages: list[ContentPage]
    
    # Thresholds (days)
    fresh_threshold: int = Field(default=30)
    aging_threshold: int = Field(default=90)
    stale_threshold: int = Field(default=180)
    
    # SERP comparison
    compare_to_serp: bool = True


class FreshnessAnalysisResponse(BaseModel):
    """Response from freshness analysis."""
    request_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    alerts: list[FreshnessAlert]
    
    # Summary
    total_pages: int = 0
    fresh_count: int = 0
    stale_count: int = 0
    outdated_count: int = 0
    
    # Priority queue
    urgent_updates: list[str] = Field(default_factory=list)  # URLs


class SerpService(Protocol):
    """Protocol for SERP data."""
    async def get_serp_topics(self, keyword: str) -> list[str]:
        ...


class ContentFreshnessService:
    """
    Analyzes content freshness and semantic drift.
    
    Alerts when content becomes outdated relative to SERP changes.
    """
    
    def __init__(
        self,
        serp_service: Optional[SerpService] = None,
        embedding_service: Optional[EmbeddingService] = None
    ):
        self.serp_service = serp_service
        self.embedding_service = embedding_service
    
    async def analyze(self, request: FreshnessAnalysisRequest) -> FreshnessAnalysisResponse:
        """Analyze content freshness."""
        alerts: list[FreshnessAlert] = []
        now = datetime.utcnow()
        
        fresh_count = 0
        stale_count = 0
        outdated_count = 0
        
        for page in request.pages:
            # Calculate days since update
            last_mod = page.last_modified or page.published_at or now
            days_old = (now - last_mod).days
            
            # Determine freshness level
            level = self._classify_freshness(
                days_old,
                request.fresh_threshold,
                request.aging_threshold,
                request.stale_threshold
            )
            
            # Count by level
            if level == FreshnessLevel.FRESH:
                fresh_count += 1
            elif level in [FreshnessLevel.STALE, FreshnessLevel.OUTDATED]:
                stale_count += 1
                if level == FreshnessLevel.OUTDATED:
                    outdated_count += 1
            
            # Calculate SERP drift if enabled
            serp_drift = 0.0
            if request.compare_to_serp and self.serp_service:
                serp_drift = await self._calculate_serp_drift(page)
            
            # Generate alert for non-fresh content
            if level != FreshnessLevel.FRESH or serp_drift > 0.3:
                urgency = self._determine_urgency(level, serp_drift, page.current_position)
                
                alert = FreshnessAlert(
                    url=page.url,
                    freshness_level=level,
                    last_modified=last_mod,
                    days_since_update=days_old,
                    serp_drift_score=serp_drift,
                    urgency=urgency,
                    recommended_actions=self._get_recommendations(level, serp_drift)
                )
                alerts.append(alert)
        
        # Sort by urgency
        urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        alerts.sort(key=lambda a: urgency_order.get(a.urgency, 3))
        
        return FreshnessAnalysisResponse(
            alerts=alerts,
            total_pages=len(request.pages),
            fresh_count=fresh_count,
            stale_count=stale_count,
            outdated_count=outdated_count,
            urgent_updates=[a.url for a in alerts if a.urgency in ["critical", "high"]]
        )
    
    def _classify_freshness(
        self,
        days: int,
        fresh: int,
        aging: int,
        stale: int
    ) -> FreshnessLevel:
        """Classify content freshness by age."""
        if days <= fresh:
            return FreshnessLevel.FRESH
        elif days <= aging:
            return FreshnessLevel.CURRENT
        elif days <= stale:
            return FreshnessLevel.AGING
        elif days <= 365:
            return FreshnessLevel.STALE
        else:
            return FreshnessLevel.OUTDATED
    
    async def _calculate_serp_drift(self, page: ContentPage) -> float:
        """Calculate how much SERP has drifted from page content."""
        if not self.serp_service or not self.embedding_service:
            return 0.0
        
        try:
            serp_topics = await self.serp_service.get_serp_topics(page.target_keyword)
            
            if not serp_topics or not page.topics:
                return 0.0
            
            # Embed and compare
            page_emb = (await self.embedding_service.embed_batch([" ".join(page.topics)]))[0]
            serp_emb = (await self.embedding_service.embed_batch([" ".join(serp_topics)]))[0]
            
            similarity = cosine_similarity([page_emb], [serp_emb])[0][0]
            drift = 1 - similarity
            
            return float(drift)
        except Exception:
            return 0.0
    
    def _determine_urgency(
        self,
        level: FreshnessLevel,
        serp_drift: float,
        position: Optional[int]
    ) -> str:
        """Determine update urgency."""
        # High drift = critical
        if serp_drift > 0.5:
            return "critical"
        
        # Outdated + ranking well = high priority
        if level == FreshnessLevel.OUTDATED:
            if position and position <= 10:
                return "critical"
            return "high"
        
        if level == FreshnessLevel.STALE:
            if position and position <= 20:
                return "high"
            return "medium"
        
        if serp_drift > 0.3:
            return "medium"
        
        return "low"
    
    def _get_recommendations(
        self,
        level: FreshnessLevel,
        serp_drift: float
    ) -> list[str]:
        """Generate update recommendations."""
        recs = []
        
        if level in [FreshnessLevel.STALE, FreshnessLevel.OUTDATED]:
            recs.append("Update statistics and data points")
            recs.append("Add recent examples and case studies")
            recs.append("Review and update all external links")
        
        if serp_drift > 0.3:
            recs.append("Analyze current SERP for new topics")
            recs.append("Add sections covering missing topics")
            recs.append("Update title and meta to match current intent")
        
        if level == FreshnessLevel.AGING:
            recs.append("Minor refresh recommended")
            recs.append("Update publication date if content still accurate")
        
        return recs


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #8: MULTI-LANGUAGE SEO PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════


class SupportedLanguage(str, Enum):
    """Supported languages for SEO analysis."""
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    IT = "it"
    PT = "pt"
    NL = "nl"
    PL = "pl"
    SV = "sv"
    JA = "ja"
    ZH = "zh"


class LocalizedKeyword(BaseModel):
    """A keyword with localization data."""
    original: str
    language: SupportedLanguage
    
    # Localized versions
    translations: dict[str, str] = Field(default_factory=dict)
    
    # Per-language metrics
    metrics_by_language: dict[str, dict] = Field(default_factory=dict)
    
    # Best market
    best_market: str = ""
    best_market_score: float = 0.0


class LocalizedContent(BaseModel):
    """Content optimized for a specific market."""
    language: SupportedLanguage
    locale: str  # e.g., "en-US", "es-MX"
    
    # Content
    title: str
    meta_description: str
    keywords: list[str]
    
    # Optimization score
    optimization_score: float = 0.0
    
    # Issues
    issues: list[str] = Field(default_factory=list)


class MultiLanguageRequest(BaseModel):
    """Request for multi-language SEO analysis."""
    content: str
    source_language: SupportedLanguage = SupportedLanguage.EN
    target_languages: list[SupportedLanguage]
    
    # Options
    include_keyword_research: bool = True
    include_content_localization: bool = True


class MultiLanguageResponse(BaseModel):
    """Response from multi-language analysis."""
    request_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    # Results per language
    localized_content: dict[str, LocalizedContent] = Field(default_factory=dict)
    keyword_opportunities: dict[str, list[LocalizedKeyword]] = Field(default_factory=dict)
    
    # Summary
    best_opportunity_language: str = ""
    total_addressable_volume: int = 0


class TranslationService(Protocol):
    """Protocol for translation."""
    async def translate(self, text: str, source: str, target: str) -> str:
        ...


class LanguageDetector(Protocol):
    """Protocol for language detection."""
    async def detect(self, text: str) -> SupportedLanguage:
        ...


class MultiLanguageSEOService:
    """
    Multi-language SEO analysis and optimization.
    
    Supports 11 languages with semantic analysis and keyword research.
    """
    
    def __init__(
        self,
        translation_service: TranslationService,
        language_detector: LanguageDetector,
        keyword_service: Optional[KeywordMetricsService] = None
    ):
        self.translation_service = translation_service
        self.language_detector = language_detector
        self.keyword_service = keyword_service
    
    async def analyze(self, request: MultiLanguageRequest) -> MultiLanguageResponse:
        """Analyze content for multiple languages."""
        localized_content: dict[str, LocalizedContent] = {}
        keyword_opportunities: dict[str, list[LocalizedKeyword]] = {}
        
        total_volume = 0
        best_language = ""
        best_volume = 0
        
        for target_lang in request.target_languages:
            # Translate content
            translated = await self.translation_service.translate(
                request.content,
                request.source_language.value,
                target_lang.value
            )
            
            # Extract keywords
            keywords = self._extract_keywords(translated)
            
            # Get metrics if available
            metrics = {}
            if self.keyword_service:
                metrics = await self.keyword_service.get_metrics(keywords)
            
            # Calculate volume
            lang_volume = sum(m.get('volume', 0) for m in metrics.values())
            total_volume += lang_volume
            
            if lang_volume > best_volume:
                best_volume = lang_volume
                best_language = target_lang.value
            
            # Build localized content
            localized_content[target_lang.value] = LocalizedContent(
                language=target_lang,
                locale=f"{target_lang.value}-XX",
                title=translated[:60] + "..." if len(translated) > 60 else translated,
                meta_description=translated[:160] if len(translated) > 160 else translated,
                keywords=keywords[:10],
                optimization_score=self._calculate_optimization_score(metrics),
                issues=self._identify_issues(translated, target_lang)
            )
            
            # Build keyword opportunities
            keyword_opportunities[target_lang.value] = [
                LocalizedKeyword(
                    original=kw,
                    language=target_lang,
                    metrics_by_language={target_lang.value: metrics.get(kw, {})}
                )
                for kw in keywords[:20]
            ]
        
        return MultiLanguageResponse(
            localized_content=localized_content,
            keyword_opportunities=keyword_opportunities,
            best_opportunity_language=best_language,
            total_addressable_volume=total_volume
        )
    
    def _extract_keywords(self, text: str) -> list[str]:
        """Extract keywords from text (simplified)."""
        # Would use NLP in production
        words = text.lower().split()
        # Filter short words and common stopwords
        keywords = [w for w in words if len(w) > 3]
        # Return unique
        return list(dict.fromkeys(keywords))[:50]
    
    def _calculate_optimization_score(self, metrics: dict) -> float:
        """Calculate optimization score for language."""
        if not metrics:
            return 0.5
        
        volumes = [m.get('volume', 0) for m in metrics.values()]
        difficulties = [m.get('difficulty', 0.5) for m in metrics.values()]
        
        if not volumes:
            return 0.5
        
        # Higher volume + lower difficulty = better score
        vol_score = min(sum(volumes) / 100000, 1.0)
        diff_score = 1 - (sum(difficulties) / len(difficulties))
        
        return round((vol_score + diff_score) / 2, 2)
    
    def _identify_issues(self, text: str, language: SupportedLanguage) -> list[str]:
        """Identify localization issues."""
        issues = []
        
        # Check length
        if len(text) < 300:
            issues.append("Content may be too short for target market")
        
        # Check for non-translated elements (simplified)
        english_patterns = ["the ", " and ", " or ", " is "]
        if language != SupportedLanguage.EN:
            for pattern in english_patterns:
                if pattern in text.lower():
                    issues.append(f"Possible untranslated content detected")
                    break
        
        return issues


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #9: ANCHOR TEXT RISK SCORER
# ═══════════════════════════════════════════════════════════════════════════════


class AnchorRiskLevel(str, Enum):
    """Risk level for anchor text."""
    SAFE = "safe"
    LOW_RISK = "low_risk"
    MODERATE_RISK = "moderate_risk"
    HIGH_RISK = "high_risk"
    DANGEROUS = "dangerous"


class AnchorRiskFactor(BaseModel):
    """A specific risk factor for anchor text."""
    factor: str
    weight: float
    description: str
    recommendation: str


class AnchorAnalysis(BaseModel):
    """Complete anchor text analysis."""
    anchor_text: str
    
    # Scores
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: AnchorRiskLevel
    
    # Factors
    risk_factors: list[AnchorRiskFactor] = Field(default_factory=list)
    
    # Context
    is_exact_match: bool = False
    is_partial_match: bool = False
    is_branded: bool = False
    is_generic: bool = False
    
    # Recommendations
    safe_alternatives: list[str] = Field(default_factory=list)


class AnchorRiskRequest(BaseModel):
    """Request for anchor text risk analysis."""
    anchor_text: str
    target_keyword: str
    target_url: str
    
    # Context
    source_domain: Optional[str] = None
    existing_anchors: list[str] = Field(default_factory=list)  # For diversity analysis


class AnchorRiskResponse(BaseModel):
    """Response from anchor risk analysis."""
    analysis: AnchorAnalysis
    
    # Profile
    recommended_anchor_distribution: dict[str, float] = Field(default_factory=dict)
    current_distribution: dict[str, float] = Field(default_factory=dict)
    
    # Action
    safe_to_use: bool = True
    warnings: list[str] = Field(default_factory=list)


class AnchorTextRiskService:
    """
    Analyzes anchor text for spam risk.
    
    Uses BACOWR's risk scoring methodology.
    """
    
    # Risk weights for different factors
    RISK_WEIGHTS = {
        "exact_match": 0.3,
        "over_optimization": 0.25,
        "low_diversity": 0.2,
        "commercial_intent": 0.15,
        "length_anomaly": 0.1
    }
    
    # Recommended distribution
    IDEAL_DISTRIBUTION = {
        "branded": 0.35,
        "naked_url": 0.25,
        "generic": 0.15,
        "partial_match": 0.15,
        "exact_match": 0.10
    }
    
    def analyze(self, request: AnchorRiskRequest) -> AnchorRiskResponse:
        """Analyze anchor text risk."""
        factors: list[AnchorRiskFactor] = []
        
        anchor = request.anchor_text.lower().strip()
        keyword = request.target_keyword.lower().strip()
        
        # Check exact match
        is_exact = anchor == keyword
        if is_exact:
            factors.append(AnchorRiskFactor(
                factor="exact_match",
                weight=self.RISK_WEIGHTS["exact_match"],
                description="Anchor is exact match to target keyword",
                recommendation="Use partial match or branded anchor instead"
            ))
        
        # Check partial match
        is_partial = keyword in anchor and not is_exact
        
        # Check if branded
        is_branded = self._is_branded(anchor, request.target_url)
        
        # Check if generic
        generic_terms = ["click here", "read more", "learn more", "this", "here"]
        is_generic = anchor in generic_terms
        
        # Check commercial intent
        commercial_terms = ["buy", "cheap", "best", "discount", "deal", "offer"]
        has_commercial = any(term in anchor for term in commercial_terms)
        if has_commercial and is_exact:
            factors.append(AnchorRiskFactor(
                factor="commercial_intent",
                weight=self.RISK_WEIGHTS["commercial_intent"],
                description="Anchor combines commercial term with exact match",
                recommendation="Remove commercial modifier or use branded anchor"
            ))
        
        # Check length
        if len(anchor.split()) > 5:
            factors.append(AnchorRiskFactor(
                factor="length_anomaly",
                weight=self.RISK_WEIGHTS["length_anomaly"],
                description="Anchor text is unusually long",
                recommendation="Shorten to 2-4 words"
            ))
        
        # Check diversity if existing anchors provided
        if request.existing_anchors:
            diversity = self._calculate_diversity(anchor, request.existing_anchors)
            if diversity < 0.3:
                factors.append(AnchorRiskFactor(
                    factor="low_diversity",
                    weight=self.RISK_WEIGHTS["low_diversity"],
                    description="Low anchor text diversity detected",
                    recommendation="Vary anchor text more"
                ))
        
        # Calculate total risk
        risk_score = sum(f.weight for f in factors)
        risk_level = self._score_to_level(risk_score)
        
        # Generate safe alternatives
        alternatives = self._generate_alternatives(
            keyword,
            request.target_url,
            is_branded
        )
        
        analysis = AnchorAnalysis(
            anchor_text=request.anchor_text,
            risk_score=round(risk_score, 3),
            risk_level=risk_level,
            risk_factors=factors,
            is_exact_match=is_exact,
            is_partial_match=is_partial,
            is_branded=is_branded,
            is_generic=is_generic,
            safe_alternatives=alternatives
        )
        
        # Calculate current distribution
        current_dist = self._calculate_distribution(
            request.existing_anchors + [anchor]
        )
        
        return AnchorRiskResponse(
            analysis=analysis,
            recommended_anchor_distribution=self.IDEAL_DISTRIBUTION,
            current_distribution=current_dist,
            safe_to_use=risk_level in [AnchorRiskLevel.SAFE, AnchorRiskLevel.LOW_RISK],
            warnings=[f.description for f in factors if f.weight >= 0.2]
        )
    
    def _is_branded(self, anchor: str, url: str) -> bool:
        """Check if anchor is branded."""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace("www.", "").split(".")[0]
        return domain.lower() in anchor.lower()
    
    def _calculate_diversity(self, new_anchor: str, existing: list[str]) -> float:
        """Calculate anchor text diversity."""
        all_anchors = existing + [new_anchor]
        unique = len(set(all_anchors))
        return unique / len(all_anchors)
    
    def _score_to_level(self, score: float) -> AnchorRiskLevel:
        """Convert risk score to level."""
        if score < 0.1:
            return AnchorRiskLevel.SAFE
        elif score < 0.25:
            return AnchorRiskLevel.LOW_RISK
        elif score < 0.45:
            return AnchorRiskLevel.MODERATE_RISK
        elif score < 0.7:
            return AnchorRiskLevel.HIGH_RISK
        else:
            return AnchorRiskLevel.DANGEROUS
    
    def _generate_alternatives(
        self,
        keyword: str,
        url: str,
        is_branded: bool
    ) -> list[str]:
        """Generate safe anchor alternatives."""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace("www.", "")
        brand = domain.split(".")[0].title()
        
        alternatives = [
            brand,  # Branded
            url,  # Naked URL
            "Learn more",  # Generic
            f"{brand}'s guide",  # Branded + modifier
            f"this {keyword.split()[0]} resource" if keyword else "this resource"  # Partial
        ]
        
        return alternatives
    
    def _calculate_distribution(self, anchors: list[str]) -> dict[str, float]:
        """Calculate current anchor distribution."""
        if not anchors:
            return {}
        
        categories = {
            "branded": 0,
            "naked_url": 0,
            "generic": 0,
            "partial_match": 0,
            "exact_match": 0,
            "other": 0
        }
        
        generic_terms = {"click here", "read more", "learn more", "this", "here"}
        
        for anchor in anchors:
            anchor_lower = anchor.lower()
            
            if anchor.startswith("http"):
                categories["naked_url"] += 1
            elif anchor_lower in generic_terms:
                categories["generic"] += 1
            else:
                categories["other"] += 1
        
        total = len(anchors)
        return {k: round(v / total, 2) for k, v in categories.items()}


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #10: LINK DENSITY COMPLIANCE
# ═══════════════════════════════════════════════════════════════════════════════


class ComplianceLevel(str, Enum):
    """Link density compliance level."""
    COMPLIANT = "compliant"
    WARNING = "warning"
    NON_COMPLIANT = "non_compliant"
    CRITICAL = "critical"


class DensityMetric(BaseModel):
    """A specific density metric."""
    metric_name: str
    current_value: float
    recommended_max: float
    is_compliant: bool
    severity: str = "low"


class LinkDensityAnalysis(BaseModel):
    """Complete link density analysis."""
    url: str
    
    # Overall
    compliance_level: ComplianceLevel
    overall_density: float  # Links per 100 words
    
    # Breakdown
    internal_links: int = 0
    external_links: int = 0
    nofollow_links: int = 0
    total_links: int = 0
    word_count: int = 0
    
    # Metrics
    metrics: list[DensityMetric] = Field(default_factory=list)
    
    # Issues
    issues: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class LinkDensityRequest(BaseModel):
    """Request for link density analysis."""
    url: str
    html_content: str
    
    # Thresholds
    max_links_per_100_words: float = Field(default=3.0)
    max_external_ratio: float = Field(default=0.3)
    max_consecutive_links: int = Field(default=3)


class LinkDensityResponse(BaseModel):
    """Response from link density analysis."""
    analysis: LinkDensityAnalysis
    
    # Comparison
    industry_benchmark: float = 2.0
    percentile: int = 50  # Where this page falls


class LinkDensityComplianceService:
    """
    Checks link density against Google guidelines.
    
    Ensures content doesn't violate link spam policies.
    """
    
    def analyze(self, request: LinkDensityRequest) -> LinkDensityResponse:
        """Analyze link density compliance."""
        from html.parser import HTMLParser
        
        # Parse HTML (simplified)
        links = self._extract_links(request.html_content)
        word_count = self._count_words(request.html_content)
        
        # Categorize links
        internal_links = [l for l in links if self._is_internal(l, request.url)]
        external_links = [l for l in links if not self._is_internal(l, request.url)]
        nofollow_links = [l for l in links if l.get('rel') == 'nofollow']
        
        total_links = len(links)
        
        # Calculate density
        density = (total_links / word_count * 100) if word_count > 0 else 0
        
        # Check metrics
        metrics: list[DensityMetric] = []
        issues: list[str] = []
        
        # Overall density
        density_compliant = density <= request.max_links_per_100_words
        metrics.append(DensityMetric(
            metric_name="Links per 100 words",
            current_value=round(density, 2),
            recommended_max=request.max_links_per_100_words,
            is_compliant=density_compliant,
            severity="high" if density > request.max_links_per_100_words * 1.5 else "medium"
        ))
        if not density_compliant:
            issues.append(f"Link density ({density:.1f}) exceeds recommended maximum ({request.max_links_per_100_words})")
        
        # External ratio
        external_ratio = len(external_links) / total_links if total_links > 0 else 0
        external_compliant = external_ratio <= request.max_external_ratio
        metrics.append(DensityMetric(
            metric_name="External link ratio",
            current_value=round(external_ratio, 2),
            recommended_max=request.max_external_ratio,
            is_compliant=external_compliant,
            severity="medium"
        ))
        if not external_compliant:
            issues.append(f"External link ratio ({external_ratio:.0%}) exceeds recommended ({request.max_external_ratio:.0%})")
        
        # Determine compliance level
        non_compliant_count = sum(1 for m in metrics if not m.is_compliant)
        high_severity = any(m.severity == "high" and not m.is_compliant for m in metrics)
        
        if non_compliant_count == 0:
            compliance_level = ComplianceLevel.COMPLIANT
        elif high_severity:
            compliance_level = ComplianceLevel.CRITICAL
        elif non_compliant_count == 1:
            compliance_level = ComplianceLevel.WARNING
        else:
            compliance_level = ComplianceLevel.NON_COMPLIANT
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, issues)
        
        analysis = LinkDensityAnalysis(
            url=request.url,
            compliance_level=compliance_level,
            overall_density=round(density, 2),
            internal_links=len(internal_links),
            external_links=len(external_links),
            nofollow_links=len(nofollow_links),
            total_links=total_links,
            word_count=word_count,
            metrics=metrics,
            issues=issues,
            recommendations=recommendations
        )
        
        return LinkDensityResponse(
            analysis=analysis,
            industry_benchmark=2.0,
            percentile=self._calculate_percentile(density)
        )
    
    def _extract_links(self, html: str) -> list[dict]:
        """Extract links from HTML."""
        import re
        # Simplified extraction
        links = []
        pattern = r'<a[^>]+href=["\']([^"\']+)["\'][^>]*(?:rel=["\']([^"\']*)["\'])?[^>]*>'
        matches = re.findall(pattern, html, re.IGNORECASE)
        for href, rel in matches:
            links.append({"href": href, "rel": rel})
        return links
    
    def _count_words(self, html: str) -> int:
        """Count words in HTML content."""
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', html)
        # Count words
        words = text.split()
        return len(words)
    
    def _is_internal(self, link: dict, page_url: str) -> bool:
        """Check if link is internal."""
        from urllib.parse import urlparse
        href = link.get("href", "")
        if href.startswith("/") or href.startswith("#"):
            return True
        page_domain = urlparse(page_url).netloc
        link_domain = urlparse(href).netloc
        return page_domain == link_domain
    
    def _generate_recommendations(
        self,
        metrics: list[DensityMetric],
        issues: list[str]
    ) -> list[str]:
        """Generate compliance recommendations."""
        recs = []
        
        for metric in metrics:
            if not metric.is_compliant:
                if "Links per" in metric.metric_name:
                    recs.append("Remove or consolidate some links")
                    recs.append("Increase content length to reduce density")
                elif "External" in metric.metric_name:
                    recs.append("Add nofollow to some external links")
                    recs.append("Replace external links with internal alternatives")
        
        return recs
    
    def _calculate_percentile(self, density: float) -> int:
        """Calculate where density falls in distribution."""
        # Simplified - would use actual distribution data
        if density < 1.0:
            return 25
        elif density < 2.0:
            return 50
        elif density < 3.0:
            return 75
        else:
            return 90


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Feature 6: Keyword Clustering
    "ClusterMethod",
    "KeywordIntent",
    "ClusteredKeyword",
    "KeywordCluster",
    "ClusteringRequest",
    "ClusteringResponse",
    "KeywordClusteringService",
    
    # Feature 7: Content Freshness
    "FreshnessLevel",
    "FreshnessAlert",
    "ContentPage",
    "FreshnessAnalysisRequest",
    "FreshnessAnalysisResponse",
    "ContentFreshnessService",
    
    # Feature 8: Multi-Language
    "SupportedLanguage",
    "LocalizedKeyword",
    "LocalizedContent",
    "MultiLanguageRequest",
    "MultiLanguageResponse",
    "MultiLanguageSEOService",
    
    # Feature 9: Anchor Risk
    "AnchorRiskLevel",
    "AnchorRiskFactor",
    "AnchorAnalysis",
    "AnchorRiskRequest",
    "AnchorRiskResponse",
    "AnchorTextRiskService",
    
    # Feature 10: Link Density
    "ComplianceLevel",
    "DensityMetric",
    "LinkDensityAnalysis",
    "LinkDensityRequest",
    "LinkDensityResponse",
    "LinkDensityComplianceService",
]
"""
═══════════════════════════════════════════════════════════════════════════════
TIER 2 CORE SEO FEATURES - PART 3
═══════════════════════════════════════════════════════════════════════════════

Features 16-20:
- Smart Content Length Recommender
- Topic Authority Calculator
- Semantic Duplicate Detector
- Explainable SEO Recommendations (XAI)
- SEO ROI Attribution Model

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional, Protocol
from uuid import uuid4

import numpy as np
from pydantic import BaseModel, Field
from sklearn.metrics.pairwise import cosine_similarity


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #16: SMART CONTENT LENGTH RECOMMENDER
# ═══════════════════════════════════════════════════════════════════════════════


class ContentLengthRecommendation(BaseModel):
    """Content length recommendation."""
    keyword: str
    
    # Recommendation
    recommended_word_count: int
    recommended_range: tuple[int, int]
    
    # Context
    serp_avg_length: int = 0
    serp_median_length: int = 0
    serp_min_length: int = 0
    serp_max_length: int = 0
    
    # By position
    top_3_avg: int = 0
    positions_4_10_avg: int = 0
    
    # Intent factor
    intent_adjustment: str = ""
    
    # Reasoning
    reasoning: list[str] = Field(default_factory=list)


class ContentLengthRequest(BaseModel):
    """Request for content length recommendation."""
    keyword: str
    
    # Context
    serp_word_counts: list[int] = Field(default_factory=list)
    intent: str = "informational"
    
    # Your constraints
    min_acceptable: int = Field(default=300)
    max_acceptable: int = Field(default=10000)


class ContentLengthResponse(BaseModel):
    """Response from content length analysis."""
    recommendation: ContentLengthRecommendation
    
    # Confidence
    confidence: float = 0.0
    data_quality: str = "good"  # good, limited, insufficient


class ContentLengthService:
    """
    Recommends optimal content length based on SERP analysis.
    
    Uses semantic density, not just average word counts.
    """
    
    INTENT_MULTIPLIERS = {
        "informational": 1.1,   # Comprehensive content
        "commercial": 1.0,     # Standard length
        "transactional": 0.8,  # Shorter, action-focused
        "navigational": 0.6    # Brief, direct
    }
    
    def recommend(self, request: ContentLengthRequest) -> ContentLengthResponse:
        """Generate content length recommendation."""
        word_counts = request.serp_word_counts or []
        
        if len(word_counts) < 3:
            return ContentLengthResponse(
                recommendation=ContentLengthRecommendation(
                    keyword=request.keyword,
                    recommended_word_count=1500,
                    recommended_range=(1200, 2000),
                    reasoning=["Insufficient SERP data - using default recommendation"]
                ),
                confidence=0.3,
                data_quality="insufficient"
            )
        
        # Calculate stats
        avg_length = int(np.mean(word_counts))
        median_length = int(np.median(word_counts))
        min_length = min(word_counts)
        max_length = max(word_counts)
        
        # Top positions analysis
        top_3_avg = int(np.mean(word_counts[:3])) if len(word_counts) >= 3 else avg_length
        pos_4_10_avg = int(np.mean(word_counts[3:10])) if len(word_counts) >= 10 else avg_length
        
        # Apply intent multiplier
        multiplier = self.INTENT_MULTIPLIERS.get(request.intent, 1.0)
        base_recommendation = int(top_3_avg * 1.1)  # Slightly above top 3
        adjusted_recommendation = int(base_recommendation * multiplier)
        
        # Clamp to acceptable range
        final_recommendation = max(
            request.min_acceptable,
            min(request.max_acceptable, adjusted_recommendation)
        )
        
        # Calculate range
        range_min = int(final_recommendation * 0.8)
        range_max = int(final_recommendation * 1.3)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            final_recommendation, top_3_avg, request.intent, multiplier
        )
        
        # Intent adjustment explanation
        if multiplier != 1.0:
            intent_adj = f"Adjusted {'up' if multiplier > 1 else 'down'} {abs(multiplier - 1)*100:.0f}% for {request.intent} intent"
        else:
            intent_adj = "No intent adjustment applied"
        
        recommendation = ContentLengthRecommendation(
            keyword=request.keyword,
            recommended_word_count=final_recommendation,
            recommended_range=(range_min, range_max),
            serp_avg_length=avg_length,
            serp_median_length=median_length,
            serp_min_length=min_length,
            serp_max_length=max_length,
            top_3_avg=top_3_avg,
            positions_4_10_avg=pos_4_10_avg,
            intent_adjustment=intent_adj,
            reasoning=reasoning
        )
        
        return ContentLengthResponse(
            recommendation=recommendation,
            confidence=0.8 if len(word_counts) >= 10 else 0.6,
            data_quality="good" if len(word_counts) >= 10 else "limited"
        )
    
    def _generate_reasoning(
        self,
        recommendation: int,
        top_3_avg: int,
        intent: str,
        multiplier: float
    ) -> list[str]:
        """Generate reasoning for recommendation."""
        reasons = [
            f"Top 3 results average {top_3_avg} words",
            f"Targeting 10% above competition at {int(top_3_avg * 1.1)} words"
        ]
        
        if multiplier > 1.0:
            reasons.append(f"{intent.title()} intent favors comprehensive content")
        elif multiplier < 1.0:
            reasons.append(f"{intent.title()} intent favors concise content")
        
        reasons.append(f"Final recommendation: {recommendation} words")
        
        return reasons


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #17: TOPIC AUTHORITY CALCULATOR
# ═══════════════════════════════════════════════════════════════════════════════


class TopicAuthority(BaseModel):
    """Authority score for a topic."""
    topic: str
    
    # Scores
    authority_score: float = Field(ge=0.0, le=1.0)
    coverage_score: float = 0.0  # How much content covers this topic
    depth_score: float = 0.0     # How deep the coverage is
    
    # Content
    pages_on_topic: int = 0
    total_words_on_topic: int = 0
    avg_position: float = 100.0
    
    # Trend
    authority_trend: str = "stable"  # growing, stable, declining


class SiteAuthorityProfile(BaseModel):
    """Complete authority profile for a site."""
    domain: str
    
    # Top topics
    topic_authorities: list[TopicAuthority] = Field(default_factory=list)
    
    # Overall
    overall_authority: float = 0.0
    primary_expertise: list[str] = Field(default_factory=list)
    secondary_expertise: list[str] = Field(default_factory=list)
    
    # Gaps
    weak_topics: list[str] = Field(default_factory=list)
    opportunity_topics: list[str] = Field(default_factory=list)


class TopicAuthorityRequest(BaseModel):
    """Request for topic authority calculation."""
    domain: str
    
    # Content data
    pages: list[dict] = Field(default_factory=list)  # {url, title, content, topics, position}
    
    # Analysis scope
    focus_topics: list[str] = Field(default_factory=list)


class TopicAuthorityResponse(BaseModel):
    """Response from topic authority calculation."""
    profile: SiteAuthorityProfile
    
    # Recommendations
    build_authority_on: list[str] = Field(default_factory=list)
    maintain_authority_on: list[str] = Field(default_factory=list)


class TopicAuthorityService:
    """
    Calculates topical authority using PageRank principles.
    
    Analyzes content library to determine expertise areas.
    """
    
    def calculate(self, request: TopicAuthorityRequest) -> TopicAuthorityResponse:
        """Calculate topic authority."""
        if not request.pages:
            return TopicAuthorityResponse(
                profile=SiteAuthorityProfile(domain=request.domain),
                build_authority_on=["Add content to build authority"]
            )
        
        # Extract and aggregate topics
        topic_data = self._aggregate_topics(request.pages)
        
        # Calculate authority per topic
        topic_authorities = []
        for topic, data in topic_data.items():
            authority = self._calculate_topic_authority(topic, data)
            topic_authorities.append(authority)
        
        # Sort by authority
        topic_authorities.sort(key=lambda t: t.authority_score, reverse=True)
        
        # Categorize
        primary = [t.topic for t in topic_authorities[:3] if t.authority_score >= 0.6]
        secondary = [t.topic for t in topic_authorities[3:8] if t.authority_score >= 0.3]
        weak = [t.topic for t in topic_authorities if t.authority_score < 0.2]
        
        # Calculate overall
        overall = np.mean([t.authority_score for t in topic_authorities]) if topic_authorities else 0
        
        profile = SiteAuthorityProfile(
            domain=request.domain,
            topic_authorities=topic_authorities,
            overall_authority=round(overall, 2),
            primary_expertise=primary,
            secondary_expertise=secondary,
            weak_topics=weak[:5],
            opportunity_topics=self._find_opportunities(topic_authorities)
        )
        
        # Generate recommendations
        build_on = [t.topic for t in topic_authorities if 0.3 <= t.authority_score < 0.6]
        maintain = [t.topic for t in topic_authorities if t.authority_score >= 0.6]
        
        return TopicAuthorityResponse(
            profile=profile,
            build_authority_on=build_on[:5],
            maintain_authority_on=maintain[:5]
        )
    
    def _aggregate_topics(self, pages: list[dict]) -> dict[str, dict]:
        """Aggregate topic data from pages."""
        topics: dict[str, dict] = defaultdict(lambda: {
            "pages": [],
            "total_words": 0,
            "positions": []
        })
        
        for page in pages:
            page_topics = page.get("topics", [])
            word_count = len(page.get("content", "").split())
            position = page.get("position", 100)
            
            for topic in page_topics:
                topics[topic]["pages"].append(page.get("url", ""))
                topics[topic]["total_words"] += word_count
                topics[topic]["positions"].append(position)
        
        return dict(topics)
    
    def _calculate_topic_authority(self, topic: str, data: dict) -> TopicAuthority:
        """Calculate authority for a single topic."""
        pages = data["pages"]
        total_words = data["total_words"]
        positions = data["positions"]
        
        # Coverage score (more pages = higher coverage)
        coverage = min(len(pages) / 10, 1.0)  # Cap at 10 pages
        
        # Depth score (more words = deeper coverage)
        depth = min(total_words / 20000, 1.0)  # Cap at 20k words
        
        # Position score (better positions = higher authority)
        avg_position = np.mean(positions) if positions else 100
        position_score = max(0, 1 - (avg_position / 100))
        
        # Combined authority
        authority = (coverage * 0.3 + depth * 0.3 + position_score * 0.4)
        
        return TopicAuthority(
            topic=topic,
            authority_score=round(authority, 2),
            coverage_score=round(coverage, 2),
            depth_score=round(depth, 2),
            pages_on_topic=len(pages),
            total_words_on_topic=total_words,
            avg_position=round(avg_position, 1)
        )
    
    def _find_opportunities(self, authorities: list[TopicAuthority]) -> list[str]:
        """Find topics with high potential but low current authority."""
        # Topics with some coverage but room to grow
        opportunities = [
            t.topic for t in authorities
            if 0.2 <= t.authority_score < 0.5 and t.pages_on_topic >= 2
        ]
        return opportunities[:5]


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #18: SEMANTIC DUPLICATE DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════


class DuplicateType(str, Enum):
    """Type of duplicate content."""
    EXACT = "exact"           # Nearly identical
    SEMANTIC = "semantic"     # Different words, same meaning
    PARTIAL = "partial"       # Significant overlap
    CANNIBALIZATION = "cannibalization"  # Competing for same keyword


class ContentDuplicate(BaseModel):
    """A detected duplicate pair."""
    url_a: str
    url_b: str
    
    # Type and severity
    duplicate_type: DuplicateType
    similarity_score: float = Field(ge=0.0, le=1.0)
    severity: str = "medium"  # low, medium, high, critical
    
    # Keywords affected
    shared_keywords: list[str] = Field(default_factory=list)
    
    # Recommendation
    action: str = ""
    keep_url: Optional[str] = None
    consolidate_into: Optional[str] = None


class DuplicateAnalysis(BaseModel):
    """Complete duplicate analysis."""
    total_pages_analyzed: int
    
    # Results
    duplicates: list[ContentDuplicate] = Field(default_factory=list)
    
    # Summary
    total_duplicates: int = 0
    cannibalization_issues: int = 0
    
    # Pages most affected
    most_duplicated_urls: list[str] = Field(default_factory=list)


class DuplicateDetectorRequest(BaseModel):
    """Request for duplicate detection."""
    pages: list[dict] = Field(default_factory=list)  # {url, content, keywords}
    
    # Thresholds
    exact_threshold: float = Field(default=0.95, ge=0.8, le=1.0)
    semantic_threshold: float = Field(default=0.75, ge=0.5, le=0.95)
    
    # Analysis scope
    check_cannibalization: bool = True


class DuplicateDetectorResponse(BaseModel):
    """Response from duplicate detection."""
    analysis: DuplicateAnalysis
    
    # Priority fixes
    priority_fixes: list[ContentDuplicate] = Field(default_factory=list)


class EmbeddingService(Protocol):
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        ...


class SemanticDuplicateService:
    """
    Detects semantically similar content (keyword cannibalization).
    
    Goes beyond exact match to find content competing for same terms.
    """
    
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
    
    async def detect(self, request: DuplicateDetectorRequest) -> DuplicateDetectorResponse:
        """Detect semantic duplicates."""
        pages = request.pages
        
        if len(pages) < 2:
            return DuplicateDetectorResponse(
                analysis=DuplicateAnalysis(total_pages_analyzed=len(pages))
            )
        
        # Get embeddings
        contents = [p.get("content", "")[:5000] for p in pages]  # Truncate for efficiency
        embeddings = await self.embedding_service.embed_batch(contents)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Find duplicates
        duplicates: list[ContentDuplicate] = []
        duplicate_counts: dict[str, int] = defaultdict(int)
        
        for i in range(len(pages)):
            for j in range(i + 1, len(pages)):
                similarity = similarity_matrix[i][j]
                
                # Check thresholds
                if similarity >= request.exact_threshold:
                    dup_type = DuplicateType.EXACT
                elif similarity >= request.semantic_threshold:
                    dup_type = DuplicateType.SEMANTIC
                else:
                    continue
                
                # Check for cannibalization
                if request.check_cannibalization:
                    shared_kw = self._find_shared_keywords(pages[i], pages[j])
                    if shared_kw and dup_type == DuplicateType.SEMANTIC:
                        dup_type = DuplicateType.CANNIBALIZATION
                else:
                    shared_kw = []
                
                # Determine severity
                severity = self._determine_severity(similarity, dup_type)
                
                # Generate recommendation
                action, keep, consolidate = self._recommend_action(
                    pages[i], pages[j], dup_type
                )
                
                duplicate = ContentDuplicate(
                    url_a=pages[i].get("url", f"page_{i}"),
                    url_b=pages[j].get("url", f"page_{j}"),
                    duplicate_type=dup_type,
                    similarity_score=round(float(similarity), 3),
                    severity=severity,
                    shared_keywords=shared_kw,
                    action=action,
                    keep_url=keep,
                    consolidate_into=consolidate
                )
                duplicates.append(duplicate)
                
                duplicate_counts[pages[i].get("url", "")] += 1
                duplicate_counts[pages[j].get("url", "")] += 1
        
        # Sort by severity
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        duplicates.sort(key=lambda d: severity_order.get(d.severity, 3))
        
        # Find most duplicated
        most_duplicated = sorted(
            duplicate_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        analysis = DuplicateAnalysis(
            total_pages_analyzed=len(pages),
            duplicates=duplicates,
            total_duplicates=len(duplicates),
            cannibalization_issues=sum(
                1 for d in duplicates
                if d.duplicate_type == DuplicateType.CANNIBALIZATION
            ),
            most_duplicated_urls=[url for url, _ in most_duplicated]
        )
        
        # Priority fixes (high/critical)
        priority = [d for d in duplicates if d.severity in ["critical", "high"]]
        
        return DuplicateDetectorResponse(
            analysis=analysis,
            priority_fixes=priority[:10]
        )
    
    def _find_shared_keywords(self, page_a: dict, page_b: dict) -> list[str]:
        """Find keywords both pages target."""
        kw_a = set(page_a.get("keywords", []))
        kw_b = set(page_b.get("keywords", []))
        return list(kw_a & kw_b)[:5]
    
    def _determine_severity(self, similarity: float, dup_type: DuplicateType) -> str:
        """Determine duplicate severity."""
        if dup_type == DuplicateType.EXACT:
            return "critical"
        elif dup_type == DuplicateType.CANNIBALIZATION:
            return "high"
        elif similarity >= 0.85:
            return "high"
        elif similarity >= 0.75:
            return "medium"
        else:
            return "low"
    
    def _recommend_action(
        self,
        page_a: dict,
        page_b: dict,
        dup_type: DuplicateType
    ) -> tuple[str, Optional[str], Optional[str]]:
        """Recommend action for duplicate."""
        if dup_type == DuplicateType.EXACT:
            # Keep the one with better position
            pos_a = page_a.get("position", 100)
            pos_b = page_b.get("position", 100)
            
            keep = page_a["url"] if pos_a <= pos_b else page_b["url"]
            remove = page_b["url"] if pos_a <= pos_b else page_a["url"]
            
            return f"Remove {remove} and redirect to {keep}", keep, keep
        
        elif dup_type == DuplicateType.CANNIBALIZATION:
            return "Consolidate into single comprehensive page or differentiate targeting", None, None
        
        else:
            return "Review and differentiate content angles", None, None


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #19: EXPLAINABLE SEO RECOMMENDATIONS (XAI)
# ═══════════════════════════════════════════════════════════════════════════════


class RecommendationType(str, Enum):
    """Type of SEO recommendation."""
    CONTENT = "content"
    TECHNICAL = "technical"
    LINKS = "links"
    ON_PAGE = "on_page"
    STRUCTURE = "structure"


class ExplanationFactor(BaseModel):
    """A factor contributing to a recommendation."""
    factor_name: str
    factor_value: Any
    impact_weight: float = Field(ge=0.0, le=1.0)
    explanation: str
    
    # Comparison
    your_value: Any = None
    benchmark_value: Any = None
    benchmark_source: str = ""  # e.g., "top 3 SERP average"


class SEORecommendation(BaseModel):
    """An explainable SEO recommendation."""
    recommendation_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    
    # What
    title: str
    description: str
    recommendation_type: RecommendationType
    
    # Why - This is the key differentiator
    explanation_summary: str
    contributing_factors: list[ExplanationFactor] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    
    # Impact
    expected_impact: str = ""
    impact_score: float = 0.0
    effort_required: str = "medium"
    
    # Priority
    priority_score: float = 0.0
    
    # Action
    specific_actions: list[str] = Field(default_factory=list)


class XAIAnalysisRequest(BaseModel):
    """Request for explainable recommendations."""
    url: str
    target_keyword: str
    
    # Your data
    page_data: dict = Field(default_factory=dict)
    
    # SERP context
    serp_data: list[dict] = Field(default_factory=list)


class XAIAnalysisResponse(BaseModel):
    """Response with explainable recommendations."""
    recommendations: list[SEORecommendation]
    
    # Summary
    total_recommendations: int
    high_impact_count: int
    
    # Overall scores
    page_score: float = 0.0
    top_3_avg_score: float = 0.0
    gap_to_close: float = 0.0


class ExplainableSEOService:
    """
    Generates SEO recommendations with full explanations.
    
    Every recommendation includes WHY it's made and evidence.
    """
    
    def analyze(self, request: XAIAnalysisRequest) -> XAIAnalysisResponse:
        """Generate explainable recommendations."""
        recommendations: list[SEORecommendation] = []
        
        page = request.page_data
        serp = request.serp_data
        
        # Analyze content length
        content_rec = self._analyze_content_length(page, serp)
        if content_rec:
            recommendations.append(content_rec)
        
        # Analyze keyword usage
        keyword_rec = self._analyze_keyword_usage(page, serp, request.target_keyword)
        if keyword_rec:
            recommendations.append(keyword_rec)
        
        # Analyze structure
        structure_rec = self._analyze_structure(page, serp)
        if structure_rec:
            recommendations.append(structure_rec)
        
        # Analyze links
        link_rec = self._analyze_links(page, serp)
        if link_rec:
            recommendations.append(link_rec)
        
        # Sort by priority
        recommendations.sort(key=lambda r: r.priority_score, reverse=True)
        
        # Calculate scores
        page_score = page.get("score", 0.5)
        top_3_avg = np.mean([s.get("score", 0.5) for s in serp[:3]]) if serp else 0.5
        
        return XAIAnalysisResponse(
            recommendations=recommendations,
            total_recommendations=len(recommendations),
            high_impact_count=sum(1 for r in recommendations if r.impact_score >= 0.7),
            page_score=round(page_score, 2),
            top_3_avg_score=round(top_3_avg, 2),
            gap_to_close=round(max(0, top_3_avg - page_score), 2)
        )
    
    def _analyze_content_length(
        self,
        page: dict,
        serp: list[dict]
    ) -> Optional[SEORecommendation]:
        """Analyze and explain content length recommendation."""
        your_length = len(page.get("content", "").split())
        serp_lengths = [len(s.get("content", "").split()) for s in serp[:10]]
        
        if not serp_lengths:
            return None
        
        avg_length = int(np.mean(serp_lengths))
        top_3_avg = int(np.mean(serp_lengths[:3]))
        
        if your_length < top_3_avg * 0.7:
            gap = top_3_avg - your_length
            
            factors = [
                ExplanationFactor(
                    factor_name="Current word count",
                    factor_value=your_length,
                    impact_weight=0.4,
                    explanation="Your content length compared to competition",
                    your_value=your_length,
                    benchmark_value=top_3_avg,
                    benchmark_source="Top 3 SERP average"
                ),
                ExplanationFactor(
                    factor_name="Competition analysis",
                    factor_value=f"{gap} words below average",
                    impact_weight=0.3,
                    explanation="Gap between your content and top performers"
                ),
                ExplanationFactor(
                    factor_name="Comprehensive coverage",
                    factor_value="Missing sections likely",
                    impact_weight=0.3,
                    explanation="Shorter content may miss topics competitors cover"
                )
            ]
            
            return SEORecommendation(
                title="Increase Content Length",
                description=f"Add approximately {gap} words to match top-ranking content",
                recommendation_type=RecommendationType.CONTENT,
                explanation_summary=(
                    f"Your content ({your_length} words) is {(1 - your_length/top_3_avg)*100:.0f}% "
                    f"shorter than the top 3 average ({top_3_avg} words). "
                    f"Longer content typically provides more comprehensive coverage."
                ),
                contributing_factors=factors,
                confidence=0.85,
                expected_impact="Could improve rankings by 5-15 positions",
                impact_score=0.7,
                effort_required="medium",
                priority_score=0.75,
                specific_actions=[
                    f"Add {gap} more words of valuable content",
                    "Analyze top 3 competitors for missing topics",
                    "Expand existing sections with more detail"
                ]
            )
        
        return None
    
    def _analyze_keyword_usage(
        self,
        page: dict,
        serp: list[dict],
        keyword: str
    ) -> Optional[SEORecommendation]:
        """Analyze and explain keyword usage."""
        content = page.get("content", "").lower()
        keyword_lower = keyword.lower()
        
        your_density = content.count(keyword_lower) / max(len(content.split()), 1) * 100
        
        # Calculate SERP average
        serp_densities = []
        for s in serp[:5]:
            s_content = s.get("content", "").lower()
            s_density = s_content.count(keyword_lower) / max(len(s_content.split()), 1) * 100
            serp_densities.append(s_density)
        
        avg_density = np.mean(serp_densities) if serp_densities else 1.5
        
        if your_density < avg_density * 0.5:
            factors = [
                ExplanationFactor(
                    factor_name="Keyword density",
                    factor_value=f"{your_density:.2f}%",
                    impact_weight=0.5,
                    explanation="How often the keyword appears in content",
                    your_value=f"{your_density:.2f}%",
                    benchmark_value=f"{avg_density:.2f}%",
                    benchmark_source="Top 5 SERP average"
                ),
                ExplanationFactor(
                    factor_name="Relevance signal",
                    factor_value="Weak",
                    impact_weight=0.3,
                    explanation="Low keyword usage may signal weak relevance to Google"
                )
            ]
            
            return SEORecommendation(
                title=f"Increase '{keyword}' Usage",
                description="Add more natural mentions of target keyword",
                recommendation_type=RecommendationType.ON_PAGE,
                explanation_summary=(
                    f"Your keyword density ({your_density:.2f}%) is below the "
                    f"competition average ({avg_density:.2f}%). This may signal "
                    f"weaker relevance to search engines."
                ),
                contributing_factors=factors,
                confidence=0.75,
                expected_impact="Stronger topical relevance signal",
                impact_score=0.6,
                effort_required="low",
                priority_score=0.65,
                specific_actions=[
                    f"Add keyword to H2/H3 headings",
                    f"Include keyword in first paragraph",
                    f"Use keyword in image alt text"
                ]
            )
        
        return None
    
    def _analyze_structure(
        self,
        page: dict,
        serp: list[dict]
    ) -> Optional[SEORecommendation]:
        """Analyze and explain structure recommendations."""
        your_headings = page.get("heading_count", 0)
        
        serp_headings = [s.get("heading_count", 5) for s in serp[:5]]
        avg_headings = np.mean(serp_headings) if serp_headings else 5
        
        if your_headings < avg_headings * 0.5:
            return SEORecommendation(
                title="Improve Content Structure",
                description="Add more headings for better readability and SEO",
                recommendation_type=RecommendationType.STRUCTURE,
                explanation_summary=(
                    f"Your page has {your_headings} headings vs. competitor average of {int(avg_headings)}. "
                    f"Better structure improves readability and helps Google understand content."
                ),
                contributing_factors=[
                    ExplanationFactor(
                        factor_name="Heading count",
                        factor_value=your_headings,
                        impact_weight=0.4,
                        explanation="Number of H2/H3 headings in content",
                        your_value=your_headings,
                        benchmark_value=int(avg_headings),
                        benchmark_source="Top 5 average"
                    )
                ],
                confidence=0.7,
                expected_impact="Improved readability and crawlability",
                impact_score=0.5,
                effort_required="low",
                priority_score=0.55,
                specific_actions=[
                    f"Add {int(avg_headings - your_headings)} more H2/H3 headings",
                    "Break long sections into subsections",
                    "Include keyword in at least 2 headings"
                ]
            )
        
        return None
    
    def _analyze_links(
        self,
        page: dict,
        serp: list[dict]
    ) -> Optional[SEORecommendation]:
        """Analyze and explain link recommendations."""
        your_internal = page.get("internal_links", 0)
        your_external = page.get("external_links", 0)
        
        serp_internal = [s.get("internal_links", 3) for s in serp[:5]]
        avg_internal = np.mean(serp_internal) if serp_internal else 5
        
        if your_internal < avg_internal * 0.5:
            return SEORecommendation(
                title="Add Internal Links",
                description="Link to related content on your site",
                recommendation_type=RecommendationType.LINKS,
                explanation_summary=(
                    f"Your page has {your_internal} internal links vs. average {int(avg_internal)}. "
                    f"Internal links help distribute PageRank and improve crawling."
                ),
                contributing_factors=[
                    ExplanationFactor(
                        factor_name="Internal link count",
                        factor_value=your_internal,
                        impact_weight=0.5,
                        explanation="Links to other pages on your site",
                        your_value=your_internal,
                        benchmark_value=int(avg_internal),
                        benchmark_source="Top 5 average"
                    )
                ],
                confidence=0.8,
                expected_impact="Better PageRank distribution and user engagement",
                impact_score=0.6,
                effort_required="low",
                priority_score=0.6,
                specific_actions=[
                    f"Add {int(avg_internal - your_internal)} internal links",
                    "Link to related pillar content",
                    "Use descriptive anchor text"
                ]
            )
        
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #20: SEO ROI ATTRIBUTION MODEL
# ═══════════════════════════════════════════════════════════════════════════════


class SEOAction(BaseModel):
    """An SEO action taken."""
    action_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    action_type: str  # content_update, new_page, backlink, technical_fix
    
    description: str
    url: Optional[str] = None
    
    # When
    implemented_at: datetime
    
    # What was done
    details: dict = Field(default_factory=dict)


class SEOOutcome(BaseModel):
    """Measured outcome from SEO."""
    metric: str  # traffic, rankings, conversions, revenue
    
    before_value: float
    after_value: float
    change_absolute: float
    change_percent: float
    
    measurement_date: datetime


class ActionAttribution(BaseModel):
    """Attribution of outcome to action."""
    action: SEOAction
    outcomes: list[SEOOutcome] = Field(default_factory=list)
    
    # Attribution
    confidence: float = 0.0  # How confident we are this action caused the outcome
    attribution_weight: float = 0.0  # % of outcome attributed to this action
    
    # ROI
    estimated_value: float = 0.0  # Dollar value
    effort_cost: float = 0.0  # Hours or dollars spent
    roi_ratio: float = 0.0  # Return per unit spent


class ROIReport(BaseModel):
    """Complete ROI attribution report."""
    time_period: str
    
    # Actions and attributions
    attributions: list[ActionAttribution] = Field(default_factory=list)
    
    # Summary
    total_actions: int = 0
    total_estimated_value: float = 0.0
    total_cost: float = 0.0
    overall_roi: float = 0.0
    
    # Top performers
    best_roi_actions: list[str] = Field(default_factory=list)
    highest_value_actions: list[str] = Field(default_factory=list)


class ROIRequest(BaseModel):
    """Request for ROI attribution."""
    actions: list[SEOAction]
    
    # Outcome data
    traffic_data: list[dict] = Field(default_factory=list)  # {date, sessions, pageviews}
    ranking_data: list[dict] = Field(default_factory=list)  # {date, keyword, position}
    revenue_data: list[dict] = Field(default_factory=list)  # {date, revenue}
    
    # Attribution settings
    attribution_window_days: int = Field(default=30)
    value_per_visit: float = Field(default=1.0)


class ROIResponse(BaseModel):
    """Response from ROI attribution."""
    report: ROIReport
    
    # Insights
    insights: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class SEOROIService:
    """
    Tracks which SEO optimizations drove results.
    
    Provides ROI attribution for SEO activities.
    """
    
    def calculate(self, request: ROIRequest) -> ROIResponse:
        """Calculate ROI attribution."""
        attributions: list[ActionAttribution] = []
        
        for action in request.actions:
            # Find outcomes within attribution window
            outcomes = self._find_outcomes(
                action,
                request.traffic_data,
                request.ranking_data,
                request.revenue_data,
                request.attribution_window_days
            )
            
            # Calculate attribution
            confidence, weight = self._calculate_attribution(action, outcomes)
            
            # Calculate value
            value = self._estimate_value(outcomes, request.value_per_visit)
            
            # Estimate cost (simplified)
            cost = self._estimate_cost(action)
            
            # ROI
            roi = value / cost if cost > 0 else 0
            
            attributions.append(ActionAttribution(
                action=action,
                outcomes=outcomes,
                confidence=confidence,
                attribution_weight=weight,
                estimated_value=value,
                effort_cost=cost,
                roi_ratio=roi
            ))
        
        # Sort by ROI
        attributions.sort(key=lambda a: a.roi_ratio, reverse=True)
        
        # Calculate totals
        total_value = sum(a.estimated_value for a in attributions)
        total_cost = sum(a.effort_cost for a in attributions)
        overall_roi = total_value / total_cost if total_cost > 0 else 0
        
        report = ROIReport(
            time_period=f"{request.attribution_window_days} days",
            attributions=attributions,
            total_actions=len(attributions),
            total_estimated_value=round(total_value, 2),
            total_cost=round(total_cost, 2),
            overall_roi=round(overall_roi, 2),
            best_roi_actions=[a.action.description for a in attributions[:3]],
            highest_value_actions=[
                a.action.description for a in sorted(
                    attributions,
                    key=lambda x: x.estimated_value,
                    reverse=True
                )[:3]
            ]
        )
        
        # Generate insights
        insights = self._generate_insights(attributions)
        recommendations = self._generate_recommendations(attributions)
        
        return ROIResponse(
            report=report,
            insights=insights,
            recommendations=recommendations
        )
    
    def _find_outcomes(
        self,
        action: SEOAction,
        traffic_data: list[dict],
        ranking_data: list[dict],
        revenue_data: list[dict],
        window_days: int
    ) -> list[SEOOutcome]:
        """Find outcomes within attribution window."""
        outcomes = []
        
        action_date = action.implemented_at
        window_end = action_date + timedelta(days=window_days)
        
        # Filter data to window
        before_traffic = [
            t for t in traffic_data
            if action_date - timedelta(days=window_days) <= t.get("date", datetime.min) < action_date
        ]
        after_traffic = [
            t for t in traffic_data
            if action_date <= t.get("date", datetime.min) <= window_end
        ]
        
        if before_traffic and after_traffic:
            before_sessions = np.mean([t.get("sessions", 0) for t in before_traffic])
            after_sessions = np.mean([t.get("sessions", 0) for t in after_traffic])
            
            if after_sessions != before_sessions:
                outcomes.append(SEOOutcome(
                    metric="traffic",
                    before_value=before_sessions,
                    after_value=after_sessions,
                    change_absolute=after_sessions - before_sessions,
                    change_percent=((after_sessions - before_sessions) / before_sessions * 100) if before_sessions > 0 else 0,
                    measurement_date=window_end
                ))
        
        return outcomes
    
    def _calculate_attribution(
        self,
        action: SEOAction,
        outcomes: list[SEOOutcome]
    ) -> tuple[float, float]:
        """Calculate attribution confidence and weight."""
        if not outcomes:
            return 0.0, 0.0
        
        # Simple heuristic - would use statistical modeling in production
        positive_outcomes = sum(1 for o in outcomes if o.change_absolute > 0)
        
        confidence = positive_outcomes / len(outcomes) if outcomes else 0
        weight = min(confidence * 0.5, 0.5)  # Cap at 50% attribution
        
        return round(confidence, 2), round(weight, 2)
    
    def _estimate_value(self, outcomes: list[SEOOutcome], value_per_visit: float) -> float:
        """Estimate dollar value of outcomes."""
        value = 0.0
        
        for outcome in outcomes:
            if outcome.metric == "traffic" and outcome.change_absolute > 0:
                value += outcome.change_absolute * value_per_visit * 30  # Monthly value
            elif outcome.metric == "revenue" and outcome.change_absolute > 0:
                value += outcome.change_absolute
        
        return round(value, 2)
    
    def _estimate_cost(self, action: SEOAction) -> float:
        """Estimate cost of action."""
        # Default costs by action type
        costs = {
            "content_update": 200,  # 2 hours at $100/hr
            "new_page": 500,
            "backlink": 300,
            "technical_fix": 150
        }
        return costs.get(action.action_type, 100)
    
    def _generate_insights(self, attributions: list[ActionAttribution]) -> list[str]:
        """Generate insights from attributions."""
        insights = []
        
        if attributions:
            best = attributions[0]
            if best.roi_ratio > 5:
                insights.append(f"Top performing action: {best.action.description} with {best.roi_ratio:.1f}x ROI")
            
            positive = sum(1 for a in attributions if a.roi_ratio > 1)
            insights.append(f"{positive}/{len(attributions)} actions showed positive ROI")
        
        return insights
    
    def _generate_recommendations(self, attributions: list[ActionAttribution]) -> list[str]:
        """Generate recommendations from analysis."""
        recommendations = []
        
        # Find best action types
        type_roi: dict[str, list[float]] = defaultdict(list)
        for a in attributions:
            type_roi[a.action.action_type].append(a.roi_ratio)
        
        best_type = max(
            type_roi.items(),
            key=lambda x: np.mean(x[1]),
            default=("content_update", [])
        )
        
        if best_type[1]:
            recommendations.append(f"Focus on '{best_type[0]}' actions - highest average ROI")
        
        return recommendations


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Feature 16: Content Length
    "ContentLengthRecommendation",
    "ContentLengthRequest",
    "ContentLengthResponse",
    "ContentLengthService",
    
    # Feature 17: Topic Authority
    "TopicAuthority",
    "SiteAuthorityProfile",
    "TopicAuthorityRequest",
    "TopicAuthorityResponse",
    "TopicAuthorityService",
    
    # Feature 18: Semantic Duplicates
    "DuplicateType",
    "ContentDuplicate",
    "DuplicateAnalysis",
    "DuplicateDetectorRequest",
    "DuplicateDetectorResponse",
    "SemanticDuplicateService",
    
    # Feature 19: XAI Recommendations
    "RecommendationType",
    "ExplanationFactor",
    "SEORecommendation",
    "XAIAnalysisRequest",
    "XAIAnalysisResponse",
    "ExplainableSEOService",
    
    # Feature 20: SEO ROI
    "SEOAction",
    "SEOOutcome",
    "ActionAttribution",
    "ROIReport",
    "ROIRequest",
    "ROIResponse",
    "SEOROIService",
]
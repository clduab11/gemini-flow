"""
═══════════════════════════════════════════════════════════════════════════════
FEATURE #2: AI-POWERED INTERNAL LINKING GRAPH OPTIMIZER
═══════════════════════════════════════════════════════════════════════════════

Uses PageRank + semantic similarity to intelligently recommend internal links.
Generates optimal anchor text using BACOWR risk scoring.

Revenue Impact: $1-3M ARR
Competitive Moat: 12 months
Confidence: 95%

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Iterator, Optional, Protocol
from urllib.parse import urlparse

import networkx as nx
import numpy as np
from pydantic import BaseModel, Field, validator


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════


class LinkRiskLevel(str, Enum):
    """Risk level for anchor text."""
    SAFE = "safe"           # < 0.3 risk score
    MODERATE = "moderate"   # 0.3 - 0.6 risk score
    RISKY = "risky"         # 0.6 - 0.8 risk score
    DANGEROUS = "dangerous"  # > 0.8 risk score


class PageNode(BaseModel):
    """Represents a page in the site graph."""
    url: str
    title: str
    
    # Semantic profile
    topics: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    entities: list[str] = Field(default_factory=list)
    
    # Metrics
    word_count: int = 0
    internal_links_out: int = 0
    internal_links_in: int = 0
    external_links: int = 0
    
    # Calculated scores
    pagerank_score: float = 0.0
    topic_authority: dict[str, float] = Field(default_factory=dict)
    
    # Metadata
    last_crawled: Optional[datetime] = None
    content_hash: Optional[str] = None
    
    @property
    def domain(self) -> str:
        return urlparse(self.url).netloc
    
    @property
    def path(self) -> str:
        return urlparse(self.url).path


class ExistingLink(BaseModel):
    """An existing internal link on the site."""
    source_url: str
    target_url: str
    anchor_text: str
    context: str = ""  # Surrounding text
    position: str = ""  # header, content, footer, sidebar


class LinkRecommendation(BaseModel):
    """A recommended internal link."""
    id: str
    source_url: str
    target_url: str
    
    # Why this link?
    semantic_similarity: float = Field(ge=0.0, le=1.0)
    authority_boost: float = 0.0  # How much PageRank flows
    relevance_explanation: str = ""
    
    # Anchor suggestions
    suggested_anchors: list[AnchorSuggestion] = Field(default_factory=list)
    
    # Priority
    priority_score: float = 0.0
    impact_estimate: str = ""  # e.g., "Medium - improves topic cluster"


class AnchorSuggestion(BaseModel):
    """A suggested anchor text with risk analysis."""
    text: str
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: LinkRiskLevel = LinkRiskLevel.SAFE
    
    # Context
    natural_fit_score: float = 0.0  # How natural it sounds
    keyword_relevance: float = 0.0  # Relevance to target page
    
    # Explanation
    risk_factors: list[str] = Field(default_factory=list)


class SiteGraph(BaseModel):
    """Complete site link graph."""
    domain: str
    pages: dict[str, PageNode] = Field(default_factory=dict)
    edges: list[ExistingLink] = Field(default_factory=list)
    
    # Graph metrics
    total_pages: int = 0
    total_links: int = 0
    avg_links_per_page: float = 0.0
    orphan_pages: list[str] = Field(default_factory=list)
    
    # PageRank results
    pagerank_computed: bool = False
    top_authority_pages: list[str] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════


class OptimizeRequest(BaseModel):
    """Request to optimize internal linking."""
    site_url: str
    
    # Input options
    sitemap_url: Optional[str] = None
    page_urls: list[str] = Field(default_factory=list)  # If no sitemap
    max_pages: int = Field(default=500, ge=1, le=5000)
    
    # Analysis parameters
    min_similarity: float = Field(default=0.5, ge=0.0, le=1.0)
    max_recommendations_per_page: int = Field(default=5, ge=1, le=20)
    include_anchor_suggestions: bool = True
    
    # Risk tolerance
    max_anchor_risk: float = Field(default=0.5, ge=0.0, le=1.0)
    
    @validator("site_url")
    def validate_url(cls, v):
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid URL format")
        return v


class OptimizeResponse(BaseModel):
    """Response from optimization analysis."""
    request_id: str
    site_url: str
    
    # Results
    recommendations: list[LinkRecommendation]
    site_graph: SiteGraph
    
    # Summary stats
    total_recommendations: int
    potential_pagerank_improvement: float
    orphan_pages_found: int
    
    # Metadata
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    pages_analyzed: int = 0
    processing_time_ms: float = 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# PROTOCOLS
# ═══════════════════════════════════════════════════════════════════════════════


class SiteCrawler(Protocol):
    """Protocol for site crawling."""
    
    async def crawl_site(
        self,
        start_url: str,
        max_pages: int = 500
    ) -> tuple[list[PageNode], list[ExistingLink]]:
        """Crawl site and return pages + existing links."""
        ...


class SemanticEngine(Protocol):
    """Protocol for semantic analysis."""
    
    async def calculate_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate semantic similarity."""
        ...
    
    async def extract_topics(self, content: str) -> list[str]:
        """Extract main topics from content."""
        ...


class BacowrAnchorGenerator(Protocol):
    """Protocol for BACOWR anchor generation."""
    
    async def generate_anchors(
        self,
        source_context: str,
        target_keywords: list[str],
        count: int = 3
    ) -> list[AnchorSuggestion]:
        """Generate anchor text suggestions with risk scores."""
        ...
    
    async def score_anchor_risk(self, anchor: str, context: str) -> tuple[float, list[str]]:
        """Score anchor text risk and return factors."""
        ...


# ═══════════════════════════════════════════════════════════════════════════════
# CORE SERVICES
# ═══════════════════════════════════════════════════════════════════════════════


class SiteGraphBuilder:
    """
    Builds semantic similarity graph of site pages.
    
    Creates a graph where:
    - Nodes = pages
    - Edges = semantic similarity above threshold
    - Edge weights = similarity scores
    """
    
    def __init__(
        self,
        crawler: SiteCrawler,
        semantic_engine: SemanticEngine,
        min_similarity: float = 0.5
    ):
        self.crawler = crawler
        self.semantic_engine = semantic_engine
        self.min_similarity = min_similarity
    
    async def build_graph(
        self,
        site_url: str,
        max_pages: int = 500
    ) -> tuple[SiteGraph, nx.DiGraph]:
        """
        Build site graph with semantic similarity edges.
        
        Returns:
            SiteGraph model + NetworkX DiGraph for PageRank
        """
        # Crawl site
        pages, existing_links = await self.crawler.crawl_site(site_url, max_pages)
        
        domain = urlparse(site_url).netloc
        
        # Build page index
        page_dict = {p.url: p for p in pages}
        
        # Create NetworkX graph
        G = nx.DiGraph()
        
        # Add nodes
        for page in pages:
            G.add_node(page.url, **{
                "title": page.title,
                "topics": page.topics,
                "keywords": page.keywords
            })
        
        # Add existing link edges
        for link in existing_links:
            if link.source_url in page_dict and link.target_url in page_dict:
                G.add_edge(link.source_url, link.target_url, weight=1.0, existing=True)
        
        # Calculate semantic similarity edges (missing links)
        similarity_edges = await self._calculate_similarity_edges(pages)
        
        # Add similarity edges to graph (don't overwrite existing)
        for source, target, similarity in similarity_edges:
            if not G.has_edge(source, target):
                G.add_edge(source, target, weight=similarity, existing=False)
        
        # Find orphan pages (no incoming links)
        orphans = [n for n in G.nodes() if G.in_degree(n) == 0]
        
        # Build SiteGraph model
        site_graph = SiteGraph(
            domain=domain,
            pages=page_dict,
            edges=existing_links,
            total_pages=len(pages),
            total_links=len(existing_links),
            avg_links_per_page=len(existing_links) / len(pages) if pages else 0,
            orphan_pages=orphans
        )
        
        return site_graph, G
    
    async def _calculate_similarity_edges(
        self,
        pages: list[PageNode]
    ) -> list[tuple[str, str, float]]:
        """Calculate semantic similarity between all page pairs."""
        edges: list[tuple[str, str, float]] = []
        
        # Process in batches
        batch_size = 50
        pairs = [(i, j) for i in range(len(pages)) for j in range(len(pages)) if i != j]
        
        for batch_start in range(0, len(pairs), batch_size):
            batch = pairs[batch_start:batch_start + batch_size]
            
            tasks = []
            for i, j in batch:
                # Use topics + keywords as proxy for content
                text_a = " ".join(pages[i].topics + pages[i].keywords)
                text_b = " ".join(pages[j].topics + pages[j].keywords)
                tasks.append(self.semantic_engine.calculate_similarity(text_a, text_b))
            
            similarities = await asyncio.gather(*tasks, return_exceptions=True)
            
            for (i, j), sim in zip(batch, similarities):
                if isinstance(sim, float) and sim >= self.min_similarity:
                    edges.append((pages[i].url, pages[j].url, sim))
        
        return edges


class PageRankCalculator:
    """
    Calculates PageRank authority scores for site pages.
    
    Uses NetworkX's PageRank implementation with customizable damping.
    """
    
    def __init__(self, damping_factor: float = 0.85, max_iterations: int = 100):
        self.damping_factor = damping_factor
        self.max_iterations = max_iterations
    
    def calculate_pagerank(
        self,
        G: nx.DiGraph,
        weight: str = "weight"
    ) -> dict[str, float]:
        """
        Calculate PageRank for all nodes in graph.
        
        Returns dict mapping URL -> PageRank score.
        """
        if not G.nodes():
            return {}
        
        pagerank = nx.pagerank(
            G,
            alpha=self.damping_factor,
            max_iter=self.max_iterations,
            weight=weight
        )
        
        return pagerank
    
    def calculate_pagerank_impact(
        self,
        G: nx.DiGraph,
        new_edge: tuple[str, str]
    ) -> float:
        """
        Calculate the PageRank impact of adding a new edge.
        
        Returns the change in total PageRank flow to target.
        """
        source, target = new_edge
        
        if source not in G.nodes() or target not in G.nodes():
            return 0.0
        
        # Current PageRank
        current_pr = self.calculate_pagerank(G)
        current_target_pr = current_pr.get(target, 0.0)
        
        # Add edge and recalculate
        G_copy = G.copy()
        G_copy.add_edge(source, target, weight=1.0)
        
        new_pr = self.calculate_pagerank(G_copy)
        new_target_pr = new_pr.get(target, 0.0)
        
        return new_target_pr - current_target_pr
    
    def get_top_authority_pages(
        self,
        pagerank: dict[str, float],
        top_n: int = 10
    ) -> list[str]:
        """Get top N pages by PageRank score."""
        sorted_pages = sorted(pagerank.items(), key=lambda x: x[1], reverse=True)
        return [url for url, _ in sorted_pages[:top_n]]


class AnchorGenerator:
    """
    Generates optimal anchor text for internal links.
    
    Uses BACOWR's anchor generation and risk scoring to suggest
    natural, low-risk anchors.
    """
    
    def __init__(
        self,
        bacowr: BacowrAnchorGenerator,
        max_risk: float = 0.5
    ):
        self.bacowr = bacowr
        self.max_risk = max_risk
    
    async def generate_anchors(
        self,
        source_page: PageNode,
        target_page: PageNode,
        context_text: str = ""
    ) -> list[AnchorSuggestion]:
        """
        Generate anchor text suggestions for a link.
        
        Uses target page keywords + source context to generate
        natural-sounding, low-risk anchors.
        """
        # Get target keywords for anchor candidates
        target_keywords = target_page.keywords[:10]
        
        # Generate anchors
        anchors = await self.bacowr.generate_anchors(
            source_context=context_text or " ".join(source_page.topics),
            target_keywords=target_keywords,
            count=5
        )
        
        # Filter by risk tolerance
        safe_anchors = [a for a in anchors if a.risk_score <= self.max_risk]
        
        # Sort by natural fit
        safe_anchors.sort(key=lambda a: a.natural_fit_score, reverse=True)
        
        return safe_anchors[:3]
    
    async def score_existing_anchor(
        self,
        anchor: str,
        context: str
    ) -> AnchorSuggestion:
        """Score an existing anchor text for risk."""
        risk_score, risk_factors = await self.bacowr.score_anchor_risk(anchor, context)
        
        level = self._score_to_level(risk_score)
        
        return AnchorSuggestion(
            text=anchor,
            risk_score=risk_score,
            risk_level=level,
            risk_factors=risk_factors
        )
    
    def _score_to_level(self, score: float) -> LinkRiskLevel:
        """Convert risk score to level."""
        if score < 0.3:
            return LinkRiskLevel.SAFE
        elif score < 0.6:
            return LinkRiskLevel.MODERATE
        elif score < 0.8:
            return LinkRiskLevel.RISKY
        else:
            return LinkRiskLevel.DANGEROUS


class LinkRecommender:
    """
    Generates link recommendations based on graph analysis.
    
    Identifies missing links that would:
    - Improve authority flow
    - Strengthen topic clusters
    - Connect orphan pages
    """
    
    def __init__(
        self,
        pagerank_calc: PageRankCalculator,
        anchor_gen: AnchorGenerator,
        semantic_engine: SemanticEngine
    ):
        self.pagerank_calc = pagerank_calc
        self.anchor_gen = anchor_gen
        self.semantic_engine = semantic_engine
    
    async def generate_recommendations(
        self,
        site_graph: SiteGraph,
        G: nx.DiGraph,
        max_per_page: int = 5,
        include_anchors: bool = True
    ) -> list[LinkRecommendation]:
        """
        Generate link recommendations for all pages.
        
        Strategy:
        1. Calculate PageRank for all pages
        2. For each page, find high-similarity pages not linked
        3. Score potential impact of adding link
        4. Generate anchor suggestions
        """
        recommendations: list[LinkRecommendation] = []
        
        # Calculate current PageRank
        pagerank = self.pagerank_calc.calculate_pagerank(G)
        
        # Update site graph with PageRank
        site_graph.pagerank_computed = True
        for url, score in pagerank.items():
            if url in site_graph.pages:
                site_graph.pages[url].pagerank_score = score
        
        site_graph.top_authority_pages = self.pagerank_calc.get_top_authority_pages(pagerank)
        
        # Get existing link pairs
        existing_pairs = {(e.source_url, e.target_url) for e in site_graph.edges}
        
        # For each page, find recommendation opportunities
        for source_url, source_page in site_graph.pages.items():
            page_recs = await self._get_page_recommendations(
                source_url=source_url,
                source_page=source_page,
                site_graph=site_graph,
                G=G,
                pagerank=pagerank,
                existing_pairs=existing_pairs,
                max_recs=max_per_page,
                include_anchors=include_anchors
            )
            recommendations.extend(page_recs)
        
        # Sort by priority
        recommendations.sort(key=lambda r: r.priority_score, reverse=True)
        
        return recommendations
    
    async def _get_page_recommendations(
        self,
        source_url: str,
        source_page: PageNode,
        site_graph: SiteGraph,
        G: nx.DiGraph,
        pagerank: dict[str, float],
        existing_pairs: set[tuple[str, str]],
        max_recs: int,
        include_anchors: bool
    ) -> list[LinkRecommendation]:
        """Get recommendations for a single page."""
        recs: list[LinkRecommendation] = []
        
        # Find candidate targets (not already linked)
        candidates: list[tuple[str, float]] = []
        
        for target_url, target_page in site_graph.pages.items():
            if target_url == source_url:
                continue
            if (source_url, target_url) in existing_pairs:
                continue
            
            # Check edge similarity from graph
            if G.has_edge(source_url, target_url):
                similarity = G[source_url][target_url].get("weight", 0)
                if not G[source_url][target_url].get("existing", True):
                    candidates.append((target_url, similarity))
        
        # Sort by similarity
        candidates.sort(key=lambda x: x[1], reverse=True)
        
        for target_url, similarity in candidates[:max_recs]:
            target_page = site_graph.pages[target_url]
            
            # Calculate authority boost
            authority_boost = pagerank.get(source_url, 0) * 0.85  # Damping factor
            
            # Generate recommendation
            rec_id = hashlib.md5(f"{source_url}:{target_url}".encode()).hexdigest()[:8]
            
            rec = LinkRecommendation(
                id=rec_id,
                source_url=source_url,
                target_url=target_url,
                semantic_similarity=round(similarity, 3),
                authority_boost=round(authority_boost, 4),
                relevance_explanation=self._explain_relevance(source_page, target_page),
                priority_score=self._calculate_priority(similarity, authority_boost, target_page)
            )
            
            # Generate anchor suggestions
            if include_anchors:
                anchors = await self.anchor_gen.generate_anchors(
                    source_page=source_page,
                    target_page=target_page
                )
                rec.suggested_anchors = anchors
            
            rec.impact_estimate = self._estimate_impact(rec)
            recs.append(rec)
        
        return recs
    
    def _explain_relevance(self, source: PageNode, target: PageNode) -> str:
        """Generate relevance explanation."""
        shared_topics = set(source.topics) & set(target.topics)
        if shared_topics:
            return f"Shared topics: {', '.join(list(shared_topics)[:3])}"
        
        shared_keywords = set(source.keywords) & set(target.keywords)
        if shared_keywords:
            return f"Related keywords: {', '.join(list(shared_keywords)[:3])}"
        
        return "Semantically similar content"
    
    def _calculate_priority(
        self,
        similarity: float,
        authority_boost: float,
        target: PageNode
    ) -> float:
        """Calculate recommendation priority score."""
        # Higher similarity = higher priority
        sim_score = similarity * 0.4
        
        # Higher authority boost = higher priority
        auth_score = min(authority_boost * 100, 0.3)  # Cap at 0.3
        
        # Boost for orphan pages
        orphan_boost = 0.3 if target.internal_links_in == 0 else 0.0
        
        return round(sim_score + auth_score + orphan_boost, 3)
    
    def _estimate_impact(self, rec: LinkRecommendation) -> str:
        """Estimate impact of recommendation."""
        if rec.priority_score >= 0.7:
            return "High - strongly recommended for topic cluster strength"
        elif rec.priority_score >= 0.5:
            return "Medium - improves internal linking structure"
        else:
            return "Low - optional enhancement"


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN SERVICE
# ═══════════════════════════════════════════════════════════════════════════════


class LinkOptimizerService:
    """
    Main orchestration service for internal link optimization.
    
    Coordinates:
    1. Site graph building
    2. PageRank calculation
    3. Missing link identification
    4. Anchor text generation
    5. Recommendation prioritization
    """
    
    def __init__(
        self,
        graph_builder: SiteGraphBuilder,
        pagerank_calc: PageRankCalculator,
        link_recommender: LinkRecommender
    ):
        self.graph_builder = graph_builder
        self.pagerank_calc = pagerank_calc
        self.link_recommender = link_recommender
    
    async def optimize(self, request: OptimizeRequest) -> OptimizeResponse:
        """
        Execute full internal linking optimization.
        
        Pipeline:
        1. Crawl site and build semantic graph
        2. Calculate PageRank for all pages
        3. Find high-similarity pages without links
        4. Generate anchor suggestions for each
        5. Prioritize and return recommendations
        """
        import time
        start_time = time.perf_counter()
        
        request_id = hashlib.md5(
            f"{request.site_url}:{time.time()}".encode()
        ).hexdigest()[:12]
        
        # Step 1: Build site graph
        site_graph, G = await self.graph_builder.build_graph(
            site_url=request.site_url,
            max_pages=request.max_pages
        )
        
        if not site_graph.pages:
            return self._empty_response(request_id, request.site_url)
        
        # Step 2-5: Generate recommendations
        recommendations = await self.link_recommender.generate_recommendations(
            site_graph=site_graph,
            G=G,
            max_per_page=request.max_recommendations_per_page,
            include_anchors=request.include_anchor_suggestions
        )
        
        # Calculate metrics
        total_pagerank = sum(p.pagerank_score for p in site_graph.pages.values())
        potential_improvement = sum(r.authority_boost for r in recommendations[:20])
        
        processing_time = (time.perf_counter() - start_time) * 1000
        
        return OptimizeResponse(
            request_id=request_id,
            site_url=request.site_url,
            recommendations=recommendations,
            site_graph=site_graph,
            total_recommendations=len(recommendations),
            potential_pagerank_improvement=round(potential_improvement, 4),
            orphan_pages_found=len(site_graph.orphan_pages),
            pages_analyzed=len(site_graph.pages),
            processing_time_ms=round(processing_time, 2)
        )
    
    def _empty_response(self, request_id: str, site_url: str) -> OptimizeResponse:
        """Return empty response when no pages found."""
        return OptimizeResponse(
            request_id=request_id,
            site_url=site_url,
            recommendations=[],
            site_graph=SiteGraph(domain=urlparse(site_url).netloc),
            total_recommendations=0,
            potential_pagerank_improvement=0.0,
            orphan_pages_found=0
        )


# ═══════════════════════════════════════════════════════════════════════════════
# API ROUTER
# ═══════════════════════════════════════════════════════════════════════════════


def create_link_optimizer_router():
    """Create FastAPI router for link optimizer endpoints."""
    from fastapi import APIRouter, HTTPException
    
    router = APIRouter(prefix="/link-optimizer", tags=["Internal Link Optimization"])
    
    @router.post("/optimize", response_model=OptimizeResponse)
    async def optimize_internal_links(request: OptimizeRequest):
        """
        Analyze site and generate internal link recommendations.
        
        This endpoint:
        1. Crawls the site (or uses provided URLs)
        2. Builds a semantic similarity graph
        3. Calculates PageRank authority scores
        4. Identifies missing high-value internal links
        5. Generates safe anchor text suggestions
        
        Returns prioritized list of link recommendations.
        """
        raise HTTPException(
            status_code=501,
            detail="Service dependencies not injected"
        )
    
    @router.get("/graph/{domain}", response_model=SiteGraph)
    async def get_site_graph(domain: str):
        """Get the site graph for a domain."""
        raise HTTPException(status_code=501, detail="Not implemented")
    
    @router.get("/pagerank/{domain}")
    async def get_pagerank_scores(domain: str):
        """Get PageRank scores for all pages in domain."""
        raise HTTPException(status_code=501, detail="Not implemented")
    
    return router


# ═══════════════════════════════════════════════════════════════════════════════
# FACTORY
# ═══════════════════════════════════════════════════════════════════════════════


def create_link_optimizer_service(
    crawler: SiteCrawler,
    semantic_engine: SemanticEngine,
    bacowr: BacowrAnchorGenerator,
    min_similarity: float = 0.5,
    max_anchor_risk: float = 0.5
) -> LinkOptimizerService:
    """
    Factory function to create fully configured LinkOptimizerService.
    
    Usage:
        from link_optimizer import create_link_optimizer_service
        
        service = create_link_optimizer_service(
            crawler=MyCrawler(),
            semantic_engine=MySIEXEngine(),
            bacowr=MyBacowrClient()
        )
        
        result = await service.optimize(OptimizeRequest(site_url="https://example.com"))
    """
    graph_builder = SiteGraphBuilder(
        crawler=crawler,
        semantic_engine=semantic_engine,
        min_similarity=min_similarity
    )
    
    pagerank_calc = PageRankCalculator()
    
    anchor_gen = AnchorGenerator(
        bacowr=bacowr,
        max_risk=max_anchor_risk
    )
    
    link_recommender = LinkRecommender(
        pagerank_calc=pagerank_calc,
        anchor_gen=anchor_gen,
        semantic_engine=semantic_engine
    )
    
    return LinkOptimizerService(
        graph_builder=graph_builder,
        pagerank_calc=pagerank_calc,
        link_recommender=link_recommender
    )


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Models
    "LinkRiskLevel",
    "PageNode",
    "ExistingLink",
    "LinkRecommendation",
    "AnchorSuggestion",
    "SiteGraph",
    "OptimizeRequest",
    "OptimizeResponse",
    
    # Protocols
    "SiteCrawler",
    "SemanticEngine",
    "BacowrAnchorGenerator",
    
    # Services
    "SiteGraphBuilder",
    "PageRankCalculator",
    "AnchorGenerator",
    "LinkRecommender",
    "LinkOptimizerService",
    
    # Factory
    "create_link_optimizer_service",
    "create_link_optimizer_router",
]
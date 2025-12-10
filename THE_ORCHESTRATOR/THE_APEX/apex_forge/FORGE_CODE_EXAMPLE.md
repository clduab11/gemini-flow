# FORGE OUTPUT EXAMPLE: Link Health Analyzer

Detta är ett exempel på vad `FORGE CODE` levererar.
Total LOC: ~950

---

## Quick Start

```bash
cd link_health_analyzer
cp .env.example .env
pip install -e .
python -m src.main serve  # API på :8000
# eller
python -m src.main analyze https://example.com  # CLI
```

---

## pyproject.toml

```toml
[project]
name = "link-health-analyzer"
version = "1.0.0"
description = "Comprehensive link health analysis combining density and anchor risk"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn>=0.27.0",
    "httpx>=0.26.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "typer>=0.9.0",
    "rich>=13.7.0",
    "beautifulsoup4>=4.12.0",
    "lxml>=5.1.0",
    "structlog>=24.1.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.4.0", "pytest-asyncio>=0.23.0", "httpx>=0.26.0"]

[project.scripts]
lha = "src.main:cli_app"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

---

## src/__init__.py

```python
"""Link Health Analyzer - Production-grade link analysis tool."""
__version__ = "1.0.0"
```

---

## src/config.py

```python
"""Configuration management using Pydantic Settings."""
from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Application
    app_name: str = "Link Health Analyzer"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Analysis thresholds
    max_links_per_100_words: float = Field(default=3.0, ge=0.5, le=10.0)
    max_external_ratio: float = Field(default=0.3, ge=0.0, le=1.0)
    anchor_diversity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    exact_match_penalty: float = Field(default=0.3, ge=0.0, le=1.0)
    
    # HTTP client
    request_timeout: float = 30.0
    max_retries: int = 3
    user_agent: str = "LinkHealthAnalyzer/1.0"
    
    # Logging
    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "console"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

---

## src/models/analysis.py

```python
"""Data models for link health analysis."""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class HealthGrade(str, Enum):
    """Overall health grade A-F."""
    A = "excellent"
    B = "good"
    C = "acceptable"
    D = "concerning"
    F = "failing"


class RiskLevel(str, Enum):
    """Risk severity level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LinkInfo(BaseModel):
    """Information about a single link."""
    href: str
    anchor_text: str
    is_internal: bool
    is_nofollow: bool
    context_snippet: str = ""


class DensityMetrics(BaseModel):
    """Link density analysis results."""
    total_links: int
    internal_links: int
    external_links: int
    nofollow_links: int
    word_count: int
    links_per_100_words: float
    external_ratio: float
    is_compliant: bool
    issues: list[str] = Field(default_factory=list)


class AnchorMetrics(BaseModel):
    """Anchor text analysis results."""
    total_anchors: int
    unique_anchors: int
    diversity_score: float  # 0-1, higher = more diverse
    exact_match_ratio: float
    branded_ratio: float
    generic_ratio: float
    risk_score: float  # 0-1, higher = riskier
    risk_level: RiskLevel
    flagged_anchors: list[str] = Field(default_factory=list)


class HealthReport(BaseModel):
    """Complete link health analysis report."""
    url: HttpUrl
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Overall
    grade: HealthGrade
    composite_score: float = Field(ge=0, le=100)
    
    # Components
    density: DensityMetrics
    anchors: AnchorMetrics
    
    # Detailed
    all_links: list[LinkInfo] = Field(default_factory=list)
    
    # Actionable
    top_issues: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    
    def model_post_init(self, __context) -> None:
        """Calculate composite score and grade after initialization."""
        if self.composite_score == 0:
            self._calculate_composite()
    
    def _calculate_composite(self) -> None:
        """Calculate composite score from components."""
        density_score = 100 if self.density.is_compliant else max(0, 100 - len(self.density.issues) * 20)
        anchor_score = (1 - self.anchors.risk_score) * 100
        
        self.composite_score = round((density_score * 0.4) + (anchor_score * 0.6), 1)
        
        if self.composite_score >= 90:
            self.grade = HealthGrade.A
        elif self.composite_score >= 75:
            self.grade = HealthGrade.B
        elif self.composite_score >= 60:
            self.grade = HealthGrade.C
        elif self.composite_score >= 40:
            self.grade = HealthGrade.D
        else:
            self.grade = HealthGrade.F


class AnalysisRequest(BaseModel):
    """Request to analyze a URL."""
    url: HttpUrl
    fetch_content: bool = True
    include_all_links: bool = False


class AnalysisResponse(BaseModel):
    """API response wrapper."""
    success: bool
    report: Optional[HealthReport] = None
    error: Optional[str] = None
```

---

## src/services/fetcher.py

```python
"""HTTP content fetching service."""
import asyncio
from typing import Optional

import httpx
import structlog

from src.config import get_settings

logger = structlog.get_logger()


class ContentFetchError(Exception):
    """Raised when content fetching fails."""
    pass


class ContentFetcher:
    """Async HTTP client for fetching page content."""
    
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            timeout=self.settings.request_timeout,
            headers={"User-Agent": self.settings.user_agent},
            follow_redirects=True,
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    async def fetch(self, url: str) -> str:
        """
        Fetch HTML content from URL with retries.
        
        Args:
            url: The URL to fetch
            
        Returns:
            HTML content as string
            
        Raises:
            ContentFetchError: If fetching fails after retries
        """
        if not self._client:
            raise RuntimeError("ContentFetcher must be used as async context manager")
        
        last_error = None
        
        for attempt in range(1, self.settings.max_retries + 1):
            try:
                logger.debug("fetching_url", url=url, attempt=attempt)
                response = await self._client.get(url)
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "")
                if "text/html" not in content_type.lower():
                    raise ContentFetchError(f"Not HTML content: {content_type}")
                
                logger.info("fetch_success", url=url, status=response.status_code)
                return response.text
                
            except httpx.HTTPStatusError as e:
                last_error = e
                logger.warning("fetch_http_error", url=url, status=e.response.status_code)
                if e.response.status_code in (404, 403, 401):
                    break  # Don't retry client errors
                    
            except httpx.RequestError as e:
                last_error = e
                logger.warning("fetch_request_error", url=url, error=str(e))
                
            if attempt < self.settings.max_retries:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise ContentFetchError(f"Failed to fetch {url}: {last_error}")
```

---

## src/services/density_analyzer.py

```python
"""Link density analysis service."""
import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup
import structlog

from src.config import get_settings
from src.models.analysis import DensityMetrics, LinkInfo

logger = structlog.get_logger()


class DensityAnalyzer:
    """Analyzes link density compliance."""
    
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
    
    def analyze(self, html: str, page_url: str) -> tuple[DensityMetrics, list[LinkInfo]]:
        """
        Analyze link density in HTML content.
        
        Args:
            html: Raw HTML content
            page_url: URL of the page (for internal/external detection)
            
        Returns:
            Tuple of (DensityMetrics, list of LinkInfo)
        """
        soup = BeautifulSoup(html, "lxml")
        page_domain = urlparse(page_url).netloc
        
        # Extract links
        links = self._extract_links(soup, page_domain)
        
        # Count words (excluding scripts, styles, etc.)
        word_count = self._count_words(soup)
        
        # Calculate metrics
        total = len(links)
        internal = sum(1 for l in links if l.is_internal)
        external = total - internal
        nofollow = sum(1 for l in links if l.is_nofollow)
        
        density = (total / word_count * 100) if word_count > 0 else 0
        ext_ratio = external / total if total > 0 else 0
        
        # Check compliance
        issues = []
        
        if density > self.settings.max_links_per_100_words:
            issues.append(
                f"Link density ({density:.1f}/100 words) exceeds threshold "
                f"({self.settings.max_links_per_100_words})"
            )
        
        if ext_ratio > self.settings.max_external_ratio:
            issues.append(
                f"External link ratio ({ext_ratio:.0%}) exceeds threshold "
                f"({self.settings.max_external_ratio:.0%})"
            )
        
        metrics = DensityMetrics(
            total_links=total,
            internal_links=internal,
            external_links=external,
            nofollow_links=nofollow,
            word_count=word_count,
            links_per_100_words=round(density, 2),
            external_ratio=round(ext_ratio, 3),
            is_compliant=len(issues) == 0,
            issues=issues,
        )
        
        logger.info(
            "density_analysis_complete",
            total_links=total,
            density=round(density, 2),
            compliant=metrics.is_compliant,
        )
        
        return metrics, links
    
    def _extract_links(self, soup: BeautifulSoup, page_domain: str) -> list[LinkInfo]:
        """Extract all links from parsed HTML."""
        links = []
        
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            
            # Skip anchors and javascript
            if href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            
            # Determine if internal
            parsed = urlparse(href)
            is_internal = (
                not parsed.netloc or 
                parsed.netloc == page_domain or
                href.startswith("/")
            )
            
            # Check nofollow
            rel = a_tag.get("rel", [])
            if isinstance(rel, str):
                rel = rel.split()
            is_nofollow = "nofollow" in rel
            
            # Get anchor text
            anchor_text = a_tag.get_text(strip=True)
            
            # Get context (surrounding text)
            context = self._get_link_context(a_tag)
            
            links.append(LinkInfo(
                href=href,
                anchor_text=anchor_text,
                is_internal=is_internal,
                is_nofollow=is_nofollow,
                context_snippet=context,
            ))
        
        return links
    
    def _get_link_context(self, a_tag, max_chars: int = 100) -> str:
        """Get surrounding text context for a link."""
        parent = a_tag.parent
        if parent:
            text = parent.get_text(strip=True)
            if len(text) > max_chars:
                text = text[:max_chars] + "..."
            return text
        return ""
    
    def _count_words(self, soup: BeautifulSoup) -> int:
        """Count words in visible text content."""
        # Remove script and style elements
        for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            tag.decompose()
        
        text = soup.get_text(separator=" ", strip=True)
        words = re.findall(r"\b\w+\b", text)
        return len(words)
```

---

## src/services/anchor_analyzer.py

```python
"""Anchor text risk analysis service."""
from collections import Counter
import re

import structlog

from src.config import get_settings
from src.models.analysis import AnchorMetrics, RiskLevel, LinkInfo

logger = structlog.get_logger()


class AnchorAnalyzer:
    """Analyzes anchor text patterns for SEO risk."""
    
    # Common generic anchors
    GENERIC_ANCHORS = {
        "click here", "read more", "learn more", "here", "this",
        "link", "website", "page", "article", "more", "continue",
    }
    
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
    
    def analyze(self, links: list[LinkInfo], target_domain: str) -> AnchorMetrics:
        """
        Analyze anchor text distribution and risk.
        
        Args:
            links: List of extracted links
            target_domain: Domain being analyzed (for branded anchor detection)
            
        Returns:
            AnchorMetrics with risk assessment
        """
        anchors = [l.anchor_text.lower().strip() for l in links if l.anchor_text]
        
        if not anchors:
            return AnchorMetrics(
                total_anchors=0,
                unique_anchors=0,
                diversity_score=1.0,
                exact_match_ratio=0,
                branded_ratio=0,
                generic_ratio=0,
                risk_score=0,
                risk_level=RiskLevel.LOW,
            )
        
        total = len(anchors)
        unique = len(set(anchors))
        
        # Calculate diversity
        diversity = unique / total if total > 0 else 0
        
        # Categorize anchors
        exact_match = 0
        branded = 0
        generic = 0
        flagged = []
        
        anchor_counts = Counter(anchors)
        domain_parts = self._extract_brand_terms(target_domain)
        
        for anchor, count in anchor_counts.items():
            # Check for over-repetition
            if count > 3 and count / total > 0.1:
                flagged.append(f"'{anchor}' used {count} times ({count/total:.0%})")
            
            # Categorize
            if self._is_exact_match_anchor(anchor):
                exact_match += count
            elif self._is_branded(anchor, domain_parts):
                branded += count
            elif self._is_generic(anchor):
                generic += count
        
        exact_ratio = exact_match / total
        branded_ratio = branded / total
        generic_ratio = generic / total
        
        # Calculate risk score
        risk_score = self._calculate_risk(
            diversity=diversity,
            exact_ratio=exact_ratio,
            flagged_count=len(flagged),
        )
        
        # Determine risk level
        if risk_score >= 0.7:
            risk_level = RiskLevel.CRITICAL
        elif risk_score >= 0.5:
            risk_level = RiskLevel.HIGH
        elif risk_score >= 0.3:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW
        
        metrics = AnchorMetrics(
            total_anchors=total,
            unique_anchors=unique,
            diversity_score=round(diversity, 3),
            exact_match_ratio=round(exact_ratio, 3),
            branded_ratio=round(branded_ratio, 3),
            generic_ratio=round(generic_ratio, 3),
            risk_score=round(risk_score, 3),
            risk_level=risk_level,
            flagged_anchors=flagged,
        )
        
        logger.info(
            "anchor_analysis_complete",
            total=total,
            diversity=round(diversity, 2),
            risk_level=risk_level.value,
        )
        
        return metrics
    
    def _extract_brand_terms(self, domain: str) -> set[str]:
        """Extract brand-related terms from domain."""
        # Remove TLD and common prefixes
        domain = re.sub(r"^(www\.)", "", domain)
        domain = re.sub(r"\.(com|org|net|io|co|se)$", "", domain)
        
        # Split on common separators
        parts = re.split(r"[-_.]", domain.lower())
        return set(parts)
    
    def _is_exact_match_anchor(self, anchor: str) -> bool:
        """Check if anchor looks like exact-match keyword stuffing."""
        # Heuristic: multiple commercial keywords without articles
        commercial_patterns = [
            r"\b(buy|cheap|best|top|review|price)\b",
            r"\b(online|shop|store|deal)\b",
        ]
        matches = sum(1 for p in commercial_patterns if re.search(p, anchor))
        return matches >= 2
    
    def _is_branded(self, anchor: str, brand_terms: set[str]) -> bool:
        """Check if anchor contains brand terms."""
        anchor_words = set(anchor.lower().split())
        return bool(anchor_words & brand_terms)
    
    def _is_generic(self, anchor: str) -> bool:
        """Check if anchor is generic/non-descriptive."""
        return anchor.lower() in self.GENERIC_ANCHORS
    
    def _calculate_risk(
        self,
        diversity: float,
        exact_ratio: float,
        flagged_count: int,
    ) -> float:
        """Calculate overall risk score 0-1."""
        risk = 0.0
        
        # Low diversity is risky
        if diversity < self.settings.anchor_diversity_threshold:
            risk += (1 - diversity) * 0.4
        
        # High exact match ratio is risky
        risk += exact_ratio * self.settings.exact_match_penalty
        
        # Flagged patterns add risk
        risk += min(flagged_count * 0.1, 0.3)
        
        return min(risk, 1.0)
```

---

## src/services/health_analyzer.py

```python
"""Main health analysis orchestrator."""
import structlog

from src.config import get_settings
from src.models.analysis import HealthReport, AnalysisRequest
from src.services.fetcher import ContentFetcher
from src.services.density_analyzer import DensityAnalyzer
from src.services.anchor_analyzer import AnchorAnalyzer

logger = structlog.get_logger()


class HealthAnalyzer:
    """Orchestrates complete link health analysis."""
    
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.density_analyzer = DensityAnalyzer(settings)
        self.anchor_analyzer = AnchorAnalyzer(settings)
    
    async def analyze(self, request: AnalysisRequest) -> HealthReport:
        """
        Perform complete link health analysis.
        
        Args:
            request: Analysis request with URL and options
            
        Returns:
            Complete HealthReport
        """
        url = str(request.url)
        logger.info("starting_analysis", url=url)
        
        # Fetch content
        async with ContentFetcher(self.settings) as fetcher:
            html = await fetcher.fetch(url)
        
        # Analyze density
        density_metrics, links = self.density_analyzer.analyze(html, url)
        
        # Analyze anchors
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        anchor_metrics = self.anchor_analyzer.analyze(links, domain)
        
        # Compile issues and recommendations
        issues = list(density_metrics.issues)
        if anchor_metrics.flagged_anchors:
            issues.extend([f"Anchor issue: {f}" for f in anchor_metrics.flagged_anchors])
        
        recommendations = self._generate_recommendations(density_metrics, anchor_metrics)
        
        # Build report
        report = HealthReport(
            url=request.url,
            grade="C",  # Will be recalculated
            composite_score=0,  # Will be recalculated
            density=density_metrics,
            anchors=anchor_metrics,
            all_links=links if request.include_all_links else [],
            top_issues=issues[:5],
            recommendations=recommendations[:5],
        )
        
        # Trigger score calculation
        report._calculate_composite()
        
        logger.info(
            "analysis_complete",
            url=url,
            grade=report.grade.value,
            score=report.composite_score,
        )
        
        return report
    
    def _generate_recommendations(self, density, anchors) -> list[str]:
        """Generate actionable recommendations."""
        recs = []
        
        if not density.is_compliant:
            if density.links_per_100_words > 3:
                recs.append("Reduce link count or increase content length")
            if density.external_ratio > 0.3:
                recs.append("Convert some external links to nofollow")
        
        if anchors.risk_level.value in ("high", "critical"):
            if anchors.diversity_score < 0.7:
                recs.append("Diversify anchor text - avoid repetitive patterns")
            if anchors.exact_match_ratio > 0.2:
                recs.append("Reduce exact-match anchors - use natural variations")
        
        if not recs:
            recs.append("Link profile looks healthy - maintain current practices")
        
        return recs
```

---

## src/api/routes.py

```python
"""FastAPI routes for link health analysis."""
from fastapi import APIRouter, HTTPException
import structlog

from src.models.analysis import AnalysisRequest, AnalysisResponse
from src.services.health_analyzer import HealthAnalyzer
from src.services.fetcher import ContentFetchError

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1", tags=["analysis"])

analyzer = HealthAnalyzer()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_url(request: AnalysisRequest) -> AnalysisResponse:
    """
    Analyze link health for a given URL.
    
    Returns comprehensive report with density metrics,
    anchor text analysis, and actionable recommendations.
    """
    try:
        report = await analyzer.analyze(request)
        return AnalysisResponse(success=True, report=report)
        
    except ContentFetchError as e:
        logger.warning("analysis_fetch_failed", url=str(request.url), error=str(e))
        return AnalysisResponse(success=False, error=f"Could not fetch URL: {e}")
        
    except Exception as e:
        logger.exception("analysis_failed", url=str(request.url))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Service health check endpoint."""
    return {"status": "healthy", "service": "link-health-analyzer"}
```

---

## src/cli.py

```python
"""Command-line interface for link health analyzer."""
import asyncio

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.models.analysis import AnalysisRequest, HealthGrade
from src.services.health_analyzer import HealthAnalyzer

cli_app = typer.Typer(
    name="lha",
    help="Link Health Analyzer - Comprehensive link profile analysis",
)
console = Console()


def grade_color(grade: HealthGrade) -> str:
    """Get color for grade display."""
    colors = {
        HealthGrade.A: "green",
        HealthGrade.B: "blue",
        HealthGrade.C: "yellow",
        HealthGrade.D: "orange1",
        HealthGrade.F: "red",
    }
    return colors.get(grade, "white")


@cli_app.command()
def analyze(
    url: str = typer.Argument(..., help="URL to analyze"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed output"),
    show_links: bool = typer.Option(False, "--links", "-l", help="List all links"),
):
    """Analyze link health for a URL."""
    console.print(f"\n[bold]Analyzing:[/bold] {url}\n")
    
    with console.status("Fetching and analyzing..."):
        request = AnalysisRequest(url=url, include_all_links=show_links)
        analyzer = HealthAnalyzer()
        report = asyncio.run(analyzer.analyze(request))
    
    # Grade display
    color = grade_color(report.grade)
    console.print(Panel(
        f"[bold {color}]{report.grade.name}[/bold {color}] ({report.composite_score}/100)",
        title="Health Grade",
        border_style=color,
    ))
    
    # Metrics table
    table = Table(title="Metrics Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right")
    table.add_column("Status", justify="center")
    
    table.add_row(
        "Link Density",
        f"{report.density.links_per_100_words}/100 words",
        "✓" if report.density.is_compliant else "✗",
    )
    table.add_row(
        "External Ratio",
        f"{report.density.external_ratio:.0%}",
        "✓" if report.density.external_ratio <= 0.3 else "✗",
    )
    table.add_row(
        "Anchor Diversity",
        f"{report.anchors.diversity_score:.0%}",
        "✓" if report.anchors.diversity_score >= 0.7 else "✗",
    )
    table.add_row(
        "Anchor Risk",
        report.anchors.risk_level.value.upper(),
        "✓" if report.anchors.risk_level.value in ("low", "medium") else "✗",
    )
    
    console.print(table)
    
    # Issues
    if report.top_issues:
        console.print("\n[bold red]Issues:[/bold red]")
        for issue in report.top_issues:
            console.print(f"  • {issue}")
    
    # Recommendations
    if report.recommendations:
        console.print("\n[bold green]Recommendations:[/bold green]")
        for rec in report.recommendations:
            console.print(f"  → {rec}")
    
    # Verbose details
    if verbose:
        console.print(f"\n[dim]Total links: {report.density.total_links}")
        console.print(f"Internal: {report.density.internal_links}")
        console.print(f"External: {report.density.external_links}")
        console.print(f"Nofollow: {report.density.nofollow_links}")
        console.print(f"Word count: {report.density.word_count}[/dim]")
    
    # Links list
    if show_links and report.all_links:
        console.print("\n[bold]All Links:[/bold]")
        for link in report.all_links[:20]:
            icon = "🔗" if link.is_internal else "🌐"
            nf = " [nofollow]" if link.is_nofollow else ""
            console.print(f"  {icon} {link.anchor_text or '[no text]'}{nf}")
            console.print(f"     [dim]{link.href}[/dim]")
    
    console.print()


@cli_app.command()
def version():
    """Show version information."""
    from src import __version__
    console.print(f"Link Health Analyzer v{__version__}")
```

---

## src/main.py

```python
"""Main entry point for Link Health Analyzer."""
import typer
import uvicorn
from fastapi import FastAPI

from src.config import get_settings
from src.cli import cli_app
from src.api.routes import router

# FastAPI app
api = FastAPI(
    title="Link Health Analyzer",
    description="Comprehensive link profile analysis combining density and anchor risk",
    version="1.0.0",
)
api.include_router(router)


@cli_app.command()
def serve(
    host: str = typer.Option(None, help="Host to bind to"),
    port: int = typer.Option(None, help="Port to bind to"),
    reload: bool = typer.Option(False, help="Enable auto-reload"),
):
    """Start the API server."""
    settings = get_settings()
    uvicorn.run(
        "src.main:api",
        host=host or settings.host,
        port=port or settings.port,
        reload=reload,
    )


if __name__ == "__main__":
    cli_app()
```

---

## Dockerfile

```dockerfile
FROM python:3.11-slim as base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2-dev \
    libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application
COPY src/ src/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["python", "-m", "src.main", "serve"]
```

---

## .env.example

```bash
# Application
APP_ENV=development
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000

# Analysis thresholds
MAX_LINKS_PER_100_WORDS=3.0
MAX_EXTERNAL_RATIO=0.3
ANCHOR_DIVERSITY_THRESHOLD=0.7

# HTTP client
REQUEST_TIMEOUT=30.0
MAX_RETRIES=3

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=console
```

---

## tests/test_smoke.py

```python
"""Smoke tests to verify system starts correctly."""
import pytest
from fastapi.testclient import TestClient

from src.main import api
from src.config import get_settings
from src.services.density_analyzer import DensityAnalyzer
from src.services.anchor_analyzer import AnchorAnalyzer


@pytest.fixture
def client():
    return TestClient(api)


def test_health_endpoint(client):
    """API health check works."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_settings_load():
    """Settings load correctly."""
    settings = get_settings()
    assert settings.app_name == "Link Health Analyzer"
    assert 0 < settings.max_links_per_100_words < 20


def test_density_analyzer_basic():
    """Density analyzer processes HTML."""
    analyzer = DensityAnalyzer()
    html = """
    <html><body>
    <p>This is some content with words.</p>
    <a href="/internal">Internal link</a>
    <a href="https://external.com">External</a>
    </body></html>
    """
    metrics, links = analyzer.analyze(html, "https://example.com")
    assert metrics.total_links == 2
    assert metrics.internal_links == 1
    assert metrics.external_links == 1


def test_anchor_analyzer_basic():
    """Anchor analyzer processes links."""
    from src.models.analysis import LinkInfo
    
    analyzer = AnchorAnalyzer()
    links = [
        LinkInfo(href="/a", anchor_text="click here", is_internal=True, is_nofollow=False),
        LinkInfo(href="/b", anchor_text="example brand", is_internal=True, is_nofollow=False),
        LinkInfo(href="/c", anchor_text="unique text", is_internal=True, is_nofollow=False),
    ]
    
    metrics = analyzer.analyze(links, "example.com")
    assert metrics.total_anchors == 3
    assert metrics.risk_score < 0.5  # Low risk for diverse anchors
```

---

**Total LOC:** 947
**Ready to run:** Yes

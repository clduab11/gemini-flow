"""
═══════════════════════════════════════════════════════════════════════════════
TIER 3 ADVANCED FEATURES
═══════════════════════════════════════════════════════════════════════════════

Features 21-25+:
- A/B Testing Framework for SEO
- Active Learning Keyword Research
- Cross-Domain Topic Analysis
- Semantic Search Console
- Content Performance Predictor

═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import random
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Generic, Optional, Protocol, TypeVar
from uuid import uuid4

import numpy as np
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #21: A/B TESTING FRAMEWORK FOR SEO
# ═══════════════════════════════════════════════════════════════════════════════


class ExperimentStatus(str, Enum):
    """Status of an experiment."""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ROLLED_BACK = "rolled_back"


class VariantType(str, Enum):
    """Type of variant being tested."""
    TITLE = "title"
    META_DESCRIPTION = "meta_description"
    H1 = "h1"
    CONTENT = "content"
    SCHEMA = "schema"
    INTERNAL_LINKS = "internal_links"


class ExperimentVariant(BaseModel):
    """A variant in an A/B test."""
    variant_id: str = Field(default_factory=lambda: str(uuid4())[:6])
    name: str  # e.g., "Control", "Variant A"
    
    # What's different
    variant_type: VariantType
    original_value: str
    test_value: str
    
    # Assignment
    traffic_percentage: float = Field(default=50.0, ge=0.0, le=100.0)
    
    # Pages assigned
    pages: list[str] = Field(default_factory=list)


class ExperimentResult(BaseModel):
    """Results from an experiment."""
    variant_id: str
    
    # Metrics
    impressions: int = 0
    clicks: int = 0
    ctr: float = 0.0
    avg_position: float = 0.0
    
    # Statistical significance
    sample_size: int = 0
    confidence_level: float = 0.0
    p_value: float = 1.0
    is_significant: bool = False
    
    # Lift
    lift_vs_control: float = 0.0
    lift_confidence_interval: tuple[float, float] = (0.0, 0.0)


class SEOExperiment(BaseModel):
    """An SEO A/B test experiment."""
    experiment_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    name: str
    description: str = ""
    
    # Status
    status: ExperimentStatus = ExperimentStatus.DRAFT
    
    # Variants
    control: ExperimentVariant
    treatment: ExperimentVariant
    
    # Targeting
    target_keywords: list[str] = Field(default_factory=list)
    target_pages: list[str] = Field(default_factory=list)
    
    # Duration
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_sample_size: int = Field(default=1000)
    
    # Results
    results: dict[str, ExperimentResult] = Field(default_factory=dict)
    winner: Optional[str] = None
    
    # Configuration
    primary_metric: str = "clicks"  # clicks, ctr, position, impressions


class ABTestRequest(BaseModel):
    """Request to create A/B test."""
    name: str
    
    # What to test
    variant_type: VariantType
    pages: list[str]
    
    # Values
    control_value: str
    treatment_value: str
    
    # Settings
    traffic_split: float = Field(default=50.0)
    min_duration_days: int = Field(default=14)
    min_sample_size: int = Field(default=1000)


class ABTestResponse(BaseModel):
    """Response from A/B test operations."""
    experiment: SEOExperiment
    
    # Recommendations
    recommended_action: str = ""
    confidence: float = 0.0


class ABTestingService:
    """
    A/B testing framework for SEO changes.
    
    Enables scientific testing of SEO optimizations.
    """
    
    def __init__(self):
        self._experiments: dict[str, SEOExperiment] = {}
    
    def create_experiment(self, request: ABTestRequest) -> ABTestResponse:
        """Create a new A/B test experiment."""
        # Split pages
        pages = request.pages.copy()
        random.shuffle(pages)
        
        split_point = int(len(pages) * (request.traffic_split / 100))
        control_pages = pages[:split_point]
        treatment_pages = pages[split_point:]
        
        control = ExperimentVariant(
            name="Control",
            variant_type=request.variant_type,
            original_value=request.control_value,
            test_value=request.control_value,
            traffic_percentage=request.traffic_split,
            pages=control_pages
        )
        
        treatment = ExperimentVariant(
            name="Treatment",
            variant_type=request.variant_type,
            original_value=request.control_value,
            test_value=request.treatment_value,
            traffic_percentage=100 - request.traffic_split,
            pages=treatment_pages
        )
        
        experiment = SEOExperiment(
            name=request.name,
            control=control,
            treatment=treatment,
            target_pages=request.pages,
            min_sample_size=request.min_sample_size
        )
        
        self._experiments[experiment.experiment_id] = experiment
        
        return ABTestResponse(
            experiment=experiment,
            recommended_action="Review and start experiment when ready"
        )
    
    def start_experiment(self, experiment_id: str) -> ABTestResponse:
        """Start an experiment."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        experiment.status = ExperimentStatus.RUNNING
        experiment.start_date = datetime.utcnow()
        
        return ABTestResponse(
            experiment=experiment,
            recommended_action="Monitor daily for statistical significance"
        )
    
    def record_metrics(
        self,
        experiment_id: str,
        variant_id: str,
        impressions: int,
        clicks: int,
        avg_position: float
    ) -> None:
        """Record metrics for a variant."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return
        
        if variant_id not in experiment.results:
            experiment.results[variant_id] = ExperimentResult(variant_id=variant_id)
        
        result = experiment.results[variant_id]
        result.impressions += impressions
        result.clicks += clicks
        result.ctr = result.clicks / result.impressions if result.impressions > 0 else 0
        result.avg_position = avg_position
        result.sample_size = result.impressions
    
    def analyze_results(self, experiment_id: str) -> ABTestResponse:
        """Analyze experiment results."""
        experiment = self._experiments.get(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        control_result = experiment.results.get(experiment.control.variant_id)
        treatment_result = experiment.results.get(experiment.treatment.variant_id)
        
        if not control_result or not treatment_result:
            return ABTestResponse(
                experiment=experiment,
                recommended_action="Insufficient data - continue running"
            )
        
        # Calculate statistical significance
        is_significant, p_value, lift = self._calculate_significance(
            control_result, treatment_result, experiment.primary_metric
        )
        
        treatment_result.is_significant = is_significant
        treatment_result.p_value = p_value
        treatment_result.lift_vs_control = lift
        treatment_result.confidence_level = 1 - p_value
        
        # Determine winner
        if is_significant:
            if lift > 0:
                experiment.winner = experiment.treatment.variant_id
                action = "Treatment wins! Consider rolling out to 100%"
            else:
                experiment.winner = experiment.control.variant_id
                action = "Control wins - do not implement treatment"
        else:
            action = "No significant difference yet - continue running"
        
        return ABTestResponse(
            experiment=experiment,
            recommended_action=action,
            confidence=1 - p_value
        )
    
    def _calculate_significance(
        self,
        control: ExperimentResult,
        treatment: ExperimentResult,
        metric: str
    ) -> tuple[bool, float, float]:
        """Calculate statistical significance."""
        # Get metric values
        if metric == "clicks":
            c_rate = control.clicks / control.impressions if control.impressions > 0 else 0
            t_rate = treatment.clicks / treatment.impressions if treatment.impressions > 0 else 0
            c_n = control.impressions
            t_n = treatment.impressions
        elif metric == "ctr":
            c_rate = control.ctr
            t_rate = treatment.ctr
            c_n = control.impressions
            t_n = treatment.impressions
        else:
            c_rate = control.avg_position
            t_rate = treatment.avg_position
            c_n = control.sample_size
            t_n = treatment.sample_size
        
        if c_n < 100 or t_n < 100:
            return False, 1.0, 0.0
        
        # Simple z-test for proportions
        pooled_p = (c_rate * c_n + t_rate * t_n) / (c_n + t_n)
        se = np.sqrt(pooled_p * (1 - pooled_p) * (1/c_n + 1/t_n))
        
        if se == 0:
            return False, 1.0, 0.0
        
        z = (t_rate - c_rate) / se
        
        # Two-tailed p-value (simplified)
        p_value = 2 * (1 - min(0.9999, 0.5 + 0.5 * np.tanh(z / 1.5)))
        
        lift = ((t_rate - c_rate) / c_rate * 100) if c_rate > 0 else 0
        
        is_significant = p_value < 0.05
        
        return is_significant, round(p_value, 4), round(lift, 2)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #22: ACTIVE LEARNING KEYWORD RESEARCH
# ═══════════════════════════════════════════════════════════════════════════════


class KeywordLabel(str, Enum):
    """Label for keyword quality."""
    HIGH_VALUE = "high_value"
    MEDIUM_VALUE = "medium_value"
    LOW_VALUE = "low_value"
    NOT_RELEVANT = "not_relevant"


class LabeledKeyword(BaseModel):
    """A keyword with user label for training."""
    keyword: str
    label: KeywordLabel
    
    # Features
    volume: int = 0
    difficulty: float = 0.0
    cpc: float = 0.0
    
    # Conversion data (if available)
    conversions: int = 0
    revenue: float = 0.0
    
    # Metadata
    labeled_at: datetime = Field(default_factory=datetime.utcnow)
    labeled_by: str = ""


class KeywordPrediction(BaseModel):
    """Prediction for a keyword."""
    keyword: str
    
    # Prediction
    predicted_label: KeywordLabel
    confidence: float = Field(ge=0.0, le=1.0)
    
    # Probabilities
    label_probabilities: dict[str, float] = Field(default_factory=dict)
    
    # Uncertainty (for active learning)
    uncertainty_score: float = 0.0
    should_label: bool = False


class ActiveLearningRequest(BaseModel):
    """Request for active learning predictions."""
    keywords: list[str]
    
    # Keyword features
    keyword_features: dict[str, dict] = Field(default_factory=dict)
    
    # Settings
    top_uncertain_count: int = Field(default=10)


class ActiveLearningResponse(BaseModel):
    """Response from active learning."""
    predictions: list[KeywordPrediction]
    
    # Suggestions for labeling
    keywords_to_label: list[str] = Field(default_factory=list)
    
    # Model info
    model_accuracy: float = 0.0
    labeled_samples: int = 0


class ActiveLearningKeywordService:
    """
    Uses active learning to improve keyword research.
    
    Learns which keywords convert for YOUR business.
    """
    
    def __init__(self):
        self._labeled_data: list[LabeledKeyword] = []
        self._model: Optional[LogisticRegression] = None
    
    def add_label(self, labeled: LabeledKeyword) -> None:
        """Add a labeled keyword to training data."""
        self._labeled_data.append(labeled)
        
        # Retrain if enough data
        if len(self._labeled_data) >= 20:
            self._train_model()
    
    def predict(self, request: ActiveLearningRequest) -> ActiveLearningResponse:
        """Predict keyword values and suggest labels."""
        predictions: list[KeywordPrediction] = []
        
        for keyword in request.keywords:
            features = request.keyword_features.get(keyword, {})
            prediction = self._predict_single(keyword, features)
            predictions.append(prediction)
        
        # Find most uncertain for labeling
        predictions.sort(key=lambda p: p.uncertainty_score, reverse=True)
        to_label = [p.keyword for p in predictions[:request.top_uncertain_count] if p.should_label]
        
        return ActiveLearningResponse(
            predictions=predictions,
            keywords_to_label=to_label,
            model_accuracy=self._estimate_accuracy(),
            labeled_samples=len(self._labeled_data)
        )
    
    def _train_model(self) -> None:
        """Train the prediction model."""
        if len(self._labeled_data) < 10:
            return
        
        # Build feature matrix
        X = []
        y = []
        
        for labeled in self._labeled_data:
            features = [
                labeled.volume / 10000,  # Normalize
                labeled.difficulty,
                labeled.cpc / 10,
                labeled.conversions / 100,
                labeled.revenue / 1000
            ]
            X.append(features)
            
            # Convert label to numeric
            label_map = {
                KeywordLabel.HIGH_VALUE: 3,
                KeywordLabel.MEDIUM_VALUE: 2,
                KeywordLabel.LOW_VALUE: 1,
                KeywordLabel.NOT_RELEVANT: 0
            }
            y.append(label_map[labeled.label])
        
        # Train logistic regression
        self._model = LogisticRegression(multi_class='multinomial', max_iter=1000)
        self._model.fit(X, y)
    
    def _predict_single(self, keyword: str, features: dict) -> KeywordPrediction:
        """Predict for a single keyword."""
        if not self._model:
            # No model yet - return uncertain
            return KeywordPrediction(
                keyword=keyword,
                predicted_label=KeywordLabel.MEDIUM_VALUE,
                confidence=0.25,
                label_probabilities={l.value: 0.25 for l in KeywordLabel},
                uncertainty_score=1.0,
                should_label=True
            )
        
        # Build feature vector
        X = [[
            features.get("volume", 0) / 10000,
            features.get("difficulty", 0.5),
            features.get("cpc", 0) / 10,
            features.get("conversions", 0) / 100,
            features.get("revenue", 0) / 1000
        ]]
        
        # Predict
        probs = self._model.predict_proba(X)[0]
        predicted_class = self._model.predict(X)[0]
        
        # Map back to label
        reverse_map = {
            3: KeywordLabel.HIGH_VALUE,
            2: KeywordLabel.MEDIUM_VALUE,
            1: KeywordLabel.LOW_VALUE,
            0: KeywordLabel.NOT_RELEVANT
        }
        
        predicted_label = reverse_map.get(predicted_class, KeywordLabel.MEDIUM_VALUE)
        confidence = max(probs)
        
        # Entropy-based uncertainty
        entropy = -sum(p * np.log(p + 1e-10) for p in probs)
        max_entropy = np.log(len(probs))
        uncertainty = entropy / max_entropy if max_entropy > 0 else 1.0
        
        return KeywordPrediction(
            keyword=keyword,
            predicted_label=predicted_label,
            confidence=round(confidence, 3),
            label_probabilities={
                reverse_map[i].value: round(p, 3)
                for i, p in enumerate(probs)
            },
            uncertainty_score=round(uncertainty, 3),
            should_label=uncertainty > 0.7
        )
    
    def _estimate_accuracy(self) -> float:
        """Estimate model accuracy."""
        if not self._model or len(self._labeled_data) < 20:
            return 0.0
        
        # Simple holdout estimate (last 20%)
        holdout_size = max(1, int(len(self._labeled_data) * 0.2))
        # Would use cross-validation in production
        return 0.75  # Placeholder


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #23: CROSS-DOMAIN TOPIC ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════


class TopicOpportunity(BaseModel):
    """A topic opportunity from cross-domain analysis."""
    topic: str
    
    # Source
    source_domain: str
    source_position: float = 0.0
    
    # Target
    target_domain: str
    target_position: Optional[float] = None  # None if not ranking
    
    # Opportunity
    opportunity_score: float = 0.0
    difficulty_estimate: float = 0.0
    
    # Content
    example_urls: list[str] = Field(default_factory=list)


class CrossDomainAnalysis(BaseModel):
    """Complete cross-domain topic analysis."""
    domain_a: str
    domain_b: str
    
    # Topics
    topics_only_in_a: list[TopicOpportunity] = Field(default_factory=list)
    topics_only_in_b: list[TopicOpportunity] = Field(default_factory=list)
    shared_topics: list[str] = Field(default_factory=list)
    
    # Summary
    total_topics_a: int = 0
    total_topics_b: int = 0
    overlap_percentage: float = 0.0


class CrossDomainRequest(BaseModel):
    """Request for cross-domain analysis."""
    domain_a: str
    domain_b: str
    
    # Data
    domain_a_topics: dict[str, dict] = Field(default_factory=dict)  # {topic: {position, url}}
    domain_b_topics: dict[str, dict] = Field(default_factory=dict)


class CrossDomainResponse(BaseModel):
    """Response from cross-domain analysis."""
    analysis: CrossDomainAnalysis
    
    # Recommendations
    topics_to_target: list[str] = Field(default_factory=list)
    topics_to_strengthen: list[str] = Field(default_factory=list)


class CrossDomainAnalysisService:
    """
    Finds topics ranking in Domain A but not Domain B.
    
    Identifies cross-selling and expansion opportunities.
    """
    
    def analyze(self, request: CrossDomainRequest) -> CrossDomainResponse:
        """Analyze topic overlap between domains."""
        topics_a = set(request.domain_a_topics.keys())
        topics_b = set(request.domain_b_topics.keys())
        
        # Find unique and shared
        only_in_a = topics_a - topics_b
        only_in_b = topics_b - topics_a
        shared = topics_a & topics_b
        
        # Build opportunities
        opportunities_for_b = [
            self._build_opportunity(
                topic,
                request.domain_a,
                request.domain_b,
                request.domain_a_topics[topic]
            )
            for topic in only_in_a
        ]
        
        opportunities_for_a = [
            self._build_opportunity(
                topic,
                request.domain_b,
                request.domain_a,
                request.domain_b_topics[topic]
            )
            for topic in only_in_b
        ]
        
        # Sort by opportunity score
        opportunities_for_b.sort(key=lambda o: o.opportunity_score, reverse=True)
        opportunities_for_a.sort(key=lambda o: o.opportunity_score, reverse=True)
        
        # Calculate overlap
        total = len(topics_a | topics_b)
        overlap = len(shared) / total * 100 if total > 0 else 0
        
        analysis = CrossDomainAnalysis(
            domain_a=request.domain_a,
            domain_b=request.domain_b,
            topics_only_in_a=opportunities_for_b[:20],
            topics_only_in_b=opportunities_for_a[:20],
            shared_topics=list(shared)[:20],
            total_topics_a=len(topics_a),
            total_topics_b=len(topics_b),
            overlap_percentage=round(overlap, 1)
        )
        
        # Recommendations depend on which domain is "yours"
        # Assuming domain_b is the target
        topics_to_target = [o.topic for o in opportunities_for_b[:10]]
        
        return CrossDomainResponse(
            analysis=analysis,
            topics_to_target=topics_to_target,
            topics_to_strengthen=[t for t in shared if self._needs_strengthening(t, request)][:10]
        )
    
    def _build_opportunity(
        self,
        topic: str,
        source_domain: str,
        target_domain: str,
        source_data: dict
    ) -> TopicOpportunity:
        """Build opportunity from topic data."""
        position = source_data.get("position", 50)
        
        # Higher opportunity if source ranks well
        opportunity = max(0, (100 - position) / 100)
        
        # Estimate difficulty based on source position
        difficulty = min(1.0, position / 50)
        
        return TopicOpportunity(
            topic=topic,
            source_domain=source_domain,
            source_position=position,
            target_domain=target_domain,
            opportunity_score=round(opportunity, 2),
            difficulty_estimate=round(difficulty, 2),
            example_urls=[source_data.get("url", "")]
        )
    
    def _needs_strengthening(self, topic: str, request: CrossDomainRequest) -> bool:
        """Check if shared topic needs strengthening."""
        pos_a = request.domain_a_topics.get(topic, {}).get("position", 100)
        pos_b = request.domain_b_topics.get(topic, {}).get("position", 100)
        
        # If B ranks significantly worse than A
        return pos_b > pos_a + 10


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #24: SEMANTIC SEARCH CONSOLE
# ═══════════════════════════════════════════════════════════════════════════════


class SemanticQueryCluster(BaseModel):
    """A cluster of semantically related queries."""
    cluster_id: int
    cluster_name: str  # Representative query
    
    # Queries
    queries: list[str] = Field(default_factory=list)
    
    # Aggregate metrics
    total_impressions: int = 0
    total_clicks: int = 0
    avg_ctr: float = 0.0
    avg_position: float = 0.0
    
    # Intent
    dominant_intent: str = "informational"
    
    # Trend
    trend: str = "stable"  # up, down, stable


class SemanticGSCReport(BaseModel):
    """Semantic Search Console report."""
    date_range: str
    
    # Clusters
    query_clusters: list[SemanticQueryCluster] = Field(default_factory=list)
    
    # Summary
    total_queries: int = 0
    total_clusters: int = 0
    unclustered_queries: int = 0
    
    # Top performers
    top_clusters_by_clicks: list[str] = Field(default_factory=list)
    top_clusters_by_ctr: list[str] = Field(default_factory=list)
    
    # Opportunities
    high_impression_low_ctr: list[str] = Field(default_factory=list)


class SemanticGSCRequest(BaseModel):
    """Request for semantic GSC analysis."""
    queries: list[dict] = Field(default_factory=list)  # {query, impressions, clicks, position}
    
    # Clustering settings
    similarity_threshold: float = Field(default=0.7)
    min_cluster_size: int = Field(default=3)


class SemanticGSCResponse(BaseModel):
    """Response from semantic GSC analysis."""
    report: SemanticGSCReport
    
    # Insights
    insights: list[str] = Field(default_factory=list)


class EmbeddingService(Protocol):
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        ...


class SemanticSearchConsoleService:
    """
    Reimagines Google Search Console with semantic clustering.
    
    Groups 1000 query variations into actionable intent clusters.
    """
    
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
    
    async def analyze(self, request: SemanticGSCRequest) -> SemanticGSCResponse:
        """Analyze GSC data with semantic clustering."""
        queries = request.queries
        
        if not queries:
            return SemanticGSCResponse(
                report=SemanticGSCReport(date_range="N/A"),
                insights=["No query data provided"]
            )
        
        # Extract query texts
        query_texts = [q["query"] for q in queries]
        
        # Get embeddings
        embeddings = await self.embedding_service.embed_batch(query_texts)
        
        # Cluster
        from sklearn.cluster import AgglomerativeClustering
        from sklearn.metrics.pairwise import cosine_similarity
        
        similarity_matrix = cosine_similarity(embeddings)
        distance_matrix = 1 - similarity_matrix
        
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=1 - request.similarity_threshold,
            metric='precomputed',
            linkage='average'
        )
        labels = clustering.fit_predict(distance_matrix)
        
        # Build clusters
        cluster_data: dict[int, list[dict]] = defaultdict(list)
        for query, label in zip(queries, labels):
            cluster_data[label].append(query)
        
        # Create cluster objects
        clusters = []
        for cluster_id, cluster_queries in cluster_data.items():
            if len(cluster_queries) < request.min_cluster_size:
                continue
            
            cluster = self._build_cluster(cluster_id, cluster_queries)
            clusters.append(cluster)
        
        # Sort by clicks
        clusters.sort(key=lambda c: c.total_clicks, reverse=True)
        
        # Find opportunities
        high_imp_low_ctr = [
            c.cluster_name for c in clusters
            if c.total_impressions > 1000 and c.avg_ctr < 0.02
        ][:10]
        
        report = SemanticGSCReport(
            date_range="Custom",
            query_clusters=clusters,
            total_queries=len(queries),
            total_clusters=len(clusters),
            unclustered_queries=sum(1 for c in cluster_data.values() if len(c) < request.min_cluster_size),
            top_clusters_by_clicks=[c.cluster_name for c in clusters[:5]],
            top_clusters_by_ctr=[c.cluster_name for c in sorted(clusters, key=lambda x: x.avg_ctr, reverse=True)[:5]],
            high_impression_low_ctr=high_imp_low_ctr
        )
        
        # Generate insights
        insights = self._generate_insights(clusters)
        
        return SemanticGSCResponse(
            report=report,
            insights=insights
        )
    
    def _build_cluster(self, cluster_id: int, queries: list[dict]) -> SemanticQueryCluster:
        """Build cluster from queries."""
        total_imp = sum(q.get("impressions", 0) for q in queries)
        total_clicks = sum(q.get("clicks", 0) for q in queries)
        
        # Representative query is one with most impressions
        rep_query = max(queries, key=lambda q: q.get("impressions", 0))
        
        return SemanticQueryCluster(
            cluster_id=cluster_id,
            cluster_name=rep_query["query"],
            queries=[q["query"] for q in queries],
            total_impressions=total_imp,
            total_clicks=total_clicks,
            avg_ctr=total_clicks / total_imp if total_imp > 0 else 0,
            avg_position=np.mean([q.get("position", 50) for q in queries])
        )
    
    def _generate_insights(self, clusters: list[SemanticQueryCluster]) -> list[str]:
        """Generate insights from clusters."""
        insights = []
        
        if clusters:
            top = clusters[0]
            insights.append(f"Top cluster '{top.cluster_name}' drives {top.total_clicks} clicks from {len(top.queries)} query variations")
        
        low_ctr = [c for c in clusters if c.avg_ctr < 0.02 and c.total_impressions > 500]
        if low_ctr:
            insights.append(f"{len(low_ctr)} clusters have high impressions but low CTR - optimize titles/meta")
        
        return insights


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE #25: CONTENT PERFORMANCE PREDICTOR
# ═══════════════════════════════════════════════════════════════════════════════


class PerformancePrediction(BaseModel):
    """Prediction for content performance."""
    predicted_position: float = Field(ge=1.0, le=100.0)
    predicted_position_range: tuple[float, float] = (1.0, 100.0)
    
    # Confidence
    confidence: float = Field(ge=0.0, le=1.0)
    
    # Probability of ranking in top positions
    prob_top_3: float = 0.0
    prob_top_10: float = 0.0
    prob_page_1: float = 0.0
    
    # Feature importance
    key_factors: list[dict] = Field(default_factory=list)
    
    # Recommendations
    improvements_for_better_ranking: list[str] = Field(default_factory=list)


class ContentFeatures(BaseModel):
    """Features of content for prediction."""
    # Content metrics
    word_count: int = 0
    heading_count: int = 0
    image_count: int = 0
    internal_links: int = 0
    external_links: int = 0
    
    # Semantic
    keyword_density: float = 0.0
    entity_count: int = 0
    topic_coverage: float = 0.0
    
    # Technical
    page_speed_score: float = 0.0
    mobile_friendly: bool = True
    
    # Authority
    domain_authority: float = 0.0
    page_authority: float = 0.0
    backlinks: int = 0


class PredictionRequest(BaseModel):
    """Request for performance prediction."""
    keyword: str
    features: ContentFeatures
    
    # SERP context
    serp_features: list[ContentFeatures] = Field(default_factory=list)


class PredictionResponse(BaseModel):
    """Response from performance prediction."""
    prediction: PerformancePrediction
    
    # Comparison
    vs_serp_avg: dict[str, float] = Field(default_factory=dict)
    
    # Metadata
    model_version: str = "1.0"


class ContentPerformancePredictor:
    """
    Predicts ranking potential before publishing.
    
    Uses ML to estimate performance based on content features.
    """
    
    def __init__(self):
        self._model: Optional[RandomForestRegressor] = None
        self._feature_importances: dict[str, float] = {}
        self._trained = False
    
    def train(self, training_data: list[tuple[ContentFeatures, float]]) -> None:
        """Train the prediction model."""
        if len(training_data) < 50:
            return
        
        X = []
        y = []
        
        for features, position in training_data:
            X.append(self._features_to_vector(features))
            y.append(position)
        
        self._model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._model.fit(X, y)
        
        # Store feature importances
        feature_names = [
            "word_count", "heading_count", "image_count", "internal_links",
            "external_links", "keyword_density", "entity_count", "topic_coverage",
            "page_speed", "domain_authority", "page_authority", "backlinks"
        ]
        
        self._feature_importances = dict(zip(
            feature_names,
            self._model.feature_importances_
        ))
        
        self._trained = True
    
    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """Predict content performance."""
        features_vector = self._features_to_vector(request.features)
        
        if not self._trained or not self._model:
            # Return heuristic-based prediction
            prediction = self._heuristic_predict(request.features, request.serp_features)
        else:
            # Use trained model
            predicted = self._model.predict([features_vector])[0]
            
            # Get prediction range from trees
            tree_predictions = [tree.predict([features_vector])[0] for tree in self._model.estimators_]
            std = np.std(tree_predictions)
            
            prediction = PerformancePrediction(
                predicted_position=round(max(1, min(100, predicted)), 1),
                predicted_position_range=(
                    round(max(1, predicted - 2*std), 1),
                    round(min(100, predicted + 2*std), 1)
                ),
                confidence=round(1 - std / 20, 2),
                prob_top_3=round(sum(1 for p in tree_predictions if p <= 3) / len(tree_predictions), 2),
                prob_top_10=round(sum(1 for p in tree_predictions if p <= 10) / len(tree_predictions), 2),
                prob_page_1=round(sum(1 for p in tree_predictions if p <= 10) / len(tree_predictions), 2),
                key_factors=self._get_key_factors(request.features),
                improvements_for_better_ranking=self._get_improvements(request.features, request.serp_features)
            )
        
        # Compare to SERP
        vs_serp = self._compare_to_serp(request.features, request.serp_features)
        
        return PredictionResponse(
            prediction=prediction,
            vs_serp_avg=vs_serp
        )
    
    def _features_to_vector(self, features: ContentFeatures) -> list[float]:
        """Convert features to vector."""
        return [
            features.word_count / 3000,  # Normalize
            features.heading_count / 20,
            features.image_count / 10,
            features.internal_links / 20,
            features.external_links / 10,
            features.keyword_density,
            features.entity_count / 20,
            features.topic_coverage,
            features.page_speed_score / 100,
            features.domain_authority / 100,
            features.page_authority / 100,
            features.backlinks / 1000
        ]
    
    def _heuristic_predict(
        self,
        features: ContentFeatures,
        serp_features: list[ContentFeatures]
    ) -> PerformancePrediction:
        """Heuristic-based prediction when model isn't trained."""
        # Simple scoring
        score = 50.0  # Start at middle
        
        # Content quality
        if features.word_count > 2000:
            score -= 10
        elif features.word_count < 500:
            score += 15
        
        # Authority
        if features.domain_authority > 50:
            score -= 15
        elif features.domain_authority < 20:
            score += 10
        
        # Backlinks
        if features.backlinks > 100:
            score -= 10
        elif features.backlinks < 10:
            score += 10
        
        score = max(1, min(100, score))
        
        return PerformancePrediction(
            predicted_position=round(score, 1),
            predicted_position_range=(max(1, score - 15), min(100, score + 15)),
            confidence=0.5,
            prob_top_3=0.1 if score < 20 else 0.05,
            prob_top_10=0.3 if score < 30 else 0.1,
            prob_page_1=0.3 if score < 30 else 0.1,
            key_factors=[],
            improvements_for_better_ranking=["Add more content", "Build backlinks", "Improve page speed"]
        )
    
    def _get_key_factors(self, features: ContentFeatures) -> list[dict]:
        """Get key factors affecting prediction."""
        if not self._feature_importances:
            return []
        
        sorted_factors = sorted(
            self._feature_importances.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [
            {"factor": name, "importance": round(imp, 3)}
            for name, imp in sorted_factors[:5]
        ]
    
    def _get_improvements(
        self,
        features: ContentFeatures,
        serp_features: list[ContentFeatures]
    ) -> list[str]:
        """Get improvement recommendations."""
        improvements = []
        
        if not serp_features:
            return ["Analyze SERP to get specific recommendations"]
        
        # Compare to SERP average
        avg_word_count = np.mean([f.word_count for f in serp_features])
        if features.word_count < avg_word_count * 0.8:
            improvements.append(f"Increase word count to ~{int(avg_word_count)}")
        
        avg_backlinks = np.mean([f.backlinks for f in serp_features])
        if features.backlinks < avg_backlinks * 0.5:
            improvements.append(f"Build more backlinks (target: {int(avg_backlinks)})")
        
        if features.page_speed_score < 50:
            improvements.append("Improve page speed score")
        
        return improvements[:5]
    
    def _compare_to_serp(
        self,
        features: ContentFeatures,
        serp_features: list[ContentFeatures]
    ) -> dict[str, float]:
        """Compare features to SERP average."""
        if not serp_features:
            return {}
        
        comparisons = {}
        
        avg_words = np.mean([f.word_count for f in serp_features])
        comparisons["word_count_vs_avg"] = round((features.word_count - avg_words) / avg_words * 100 if avg_words > 0 else 0, 1)
        
        avg_da = np.mean([f.domain_authority for f in serp_features])
        comparisons["da_vs_avg"] = round((features.domain_authority - avg_da) / avg_da * 100 if avg_da > 0 else 0, 1)
        
        return comparisons


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Feature 21: A/B Testing
    "ExperimentStatus",
    "VariantType",
    "ExperimentVariant",
    "ExperimentResult",
    "SEOExperiment",
    "ABTestRequest",
    "ABTestResponse",
    "ABTestingService",
    
    # Feature 22: Active Learning
    "KeywordLabel",
    "LabeledKeyword",
    "KeywordPrediction",
    "ActiveLearningRequest",
    "ActiveLearningResponse",
    "ActiveLearningKeywordService",
    
    # Feature 23: Cross-Domain
    "TopicOpportunity",
    "CrossDomainAnalysis",
    "CrossDomainRequest",
    "CrossDomainResponse",
    "CrossDomainAnalysisService",
    
    # Feature 24: Semantic GSC
    "SemanticQueryCluster",
    "SemanticGSCReport",
    "SemanticGSCRequest",
    "SemanticGSCResponse",
    "SemanticSearchConsoleService",
    
    # Feature 25: Performance Prediction
    "PerformancePrediction",
    "ContentFeatures",
    "PredictionRequest",
    "PredictionResponse",
    "ContentPerformancePredictor",
]
"""
APEX Framework - Core Implementation
Adaptive Precision Execution Architecture

Designad för att spawna domän-specifika agent-system med
inbyggd konvergens mot excellence.
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Generic, Protocol, TypeVar

from pydantic import BaseModel, ValidationError

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

T = TypeVar("T", bound=BaseModel)  # Output type
C = TypeVar("C")  # Context type


class QualityFunction(Protocol[T]):
    """Protocol för domain-specifika quality functions."""
    
    def __call__(self, output: T, context: dict[str, Any]) -> float:
        """
        Returnerar quality score 0.0-1.0
        
        Krav:
        - Deterministisk (samma input → samma output)
        - Snabb (< 100ms)
        - Granulär (inte bara pass/fail)
        """
        ...


class TerminationReason(Enum):
    """Anledningar till att execution avslutas."""
    CONVERGED = "converged"
    MAX_ITERATIONS = "max_iterations"
    QUALITY_PLATEAU = "quality_plateau"
    CONSTRAINT_CEILING = "constraint_ceiling"
    VALIDATION_FAILURE = "validation_failure"
    TOKEN_EXHAUSTION = "token_exhaustion"


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class APEXConfig:
    """Konfiguration för en APEX-instans."""
    
    # Quality thresholds
    quality_threshold: float = 0.85
    severity_threshold: float = 0.3
    plateau_epsilon: float = 0.01
    
    # Iteration limits
    max_iterations: int = 5
    max_validation_retries: int = 3
    
    # Parallelism
    parallel_generators: int = 3
    
    # Token budgets
    token_budget_architect: int = 2000
    token_budget_generator: int = 4000
    token_budget_critic: int = 1500
    token_budget_integrator: int = 2000
    
    # Model selection
    model_architect: str = "claude-sonnet-4-20250514"
    model_generator: str = "claude-sonnet-4-20250514"
    model_critic: str = "claude-haiku"
    
    # Routing
    routing_method: str = "semantic"  # "semantic" | "llm" | "rule_based"


@dataclass
class APEXMetrics:
    """Metrics för observability och diagnostik."""
    
    tokens_used: int = 0
    api_calls: int = 0
    wall_time_seconds: float = 0.0
    cost_usd: float = 0.0
    
    final_score: float = 0.0
    score_trajectory: list[float] = field(default_factory=list)
    invariant_violations: int = 0
    
    iterations_used: int = 0
    termination_reason: TerminationReason = TerminationReason.CONVERGED
    
    pattern_selected: str = ""
    route_confidence: float = 0.0


@dataclass
class APEXResult(Generic[T]):
    """Resultat från en APEX execution."""
    
    output: T | None
    score: float
    iterations: int
    termination_reason: TerminationReason
    metrics: APEXMetrics
    critiques: list[Critique] = field(default_factory=list)
    
    @property
    def success(self) -> bool:
        return (
            self.output is not None 
            and self.termination_reason == TerminationReason.CONVERGED
        )


# ============================================================================
# CRITIQUE SYSTEM
# ============================================================================

@dataclass
class Critique:
    """En specifik kritik av genererad output."""
    
    dimension: str  # t.ex. "logic", "style", "security"
    issue: str
    severity: float  # 0.0-1.0
    suggestion: str | None = None
    location: str | None = None  # t.ex. "line 47" eller "section 3"


@dataclass
class CritiqueResult:
    """Aggregerat resultat från alla critics."""
    
    critiques: list[Critique]
    
    @property
    def max_severity(self) -> float:
        if not self.critiques:
            return 0.0
        return max(c.severity for c in self.critiques)
    
    @property
    def avg_severity(self) -> float:
        if not self.critiques:
            return 0.0
        return sum(c.severity for c in self.critiques) / len(self.critiques)
    
    def above_threshold(self, threshold: float) -> list[Critique]:
        return [c for c in self.critiques if c.severity >= threshold]


class Critic(ABC):
    """Bas-klass för domän-specifika critics."""
    
    dimension: str
    weight: float = 1.0
    
    @abstractmethod
    async def evaluate(
        self, 
        output: Any, 
        context: dict[str, Any]
    ) -> list[Critique]:
        """Evaluera output och returnera kritik."""
        ...


# ============================================================================
# GENERATORS
# ============================================================================

class Generator(ABC, Generic[T]):
    """Bas-klass för output-generatorer."""
    
    @abstractmethod
    async def generate(
        self,
        task: str,
        context: dict[str, Any],
        constraints: dict[str, Any] | None = None,
    ) -> T:
        """Generera output baserat på task och context."""
        ...


class DiverseGeneratorPool(Generic[T]):
    """Pool av generatorer med olika strategier/temperaturer."""
    
    def __init__(self, generators: list[Generator[T]]):
        self.generators = generators
    
    async def generate_candidates(
        self,
        task: str,
        context: dict[str, Any],
        n: int | None = None,
    ) -> list[T]:
        """Generera n kandidater parallellt."""
        n = n or len(self.generators)
        tasks = [
            g.generate(task, context) 
            for g in self.generators[:n]
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)


# ============================================================================
# CONVERGENCE STRATEGIES
# ============================================================================

class ConvergenceStrategy(ABC, Generic[T]):
    """Strategi för att konvergera från kandidater till bästa output."""
    
    @abstractmethod
    async def converge(
        self,
        candidates: list[T],
        context: dict[str, Any],
    ) -> T:
        """Välj eller syntetisera bästa output från kandidater."""
        ...


class VotingConvergence(ConvergenceStrategy[T]):
    """Enkel majority voting."""
    
    async def converge(self, candidates: list[T], context: dict[str, Any]) -> T:
        # Implementera LLM-as-judge eller heuristisk voting
        # Placeholder: returnera första
        return candidates[0]


class SynthesisConvergence(ConvergenceStrategy[T]):
    """Kombinera bästa delar från varje kandidat."""
    
    async def converge(self, candidates: list[T], context: dict[str, Any]) -> T:
        # Implementera Graph-of-Thoughts syntes
        # Placeholder: returnera första
        return candidates[0]


class DebateConvergence(ConvergenceStrategy[T]):
    """Multi-agent debate för att nå konsensus."""
    
    max_rounds: int = 3
    
    async def converge(self, candidates: list[T], context: dict[str, Any]) -> T:
        # Implementera MAD (Multi-Agent Debate) pattern
        # Placeholder: returnera första
        return candidates[0]


# ============================================================================
# ROUTING
# ============================================================================

class PatternType(Enum):
    """Tillgängliga APEX patterns."""
    DIRECT = "direct"  # Ingen orkestrering
    FRACTAL_DECOMPOSITION = "fractal_decomposition"  # Pattern A
    ADVERSARIAL_REFINEMENT = "adversarial_refinement"  # Pattern B
    CAPABILITY_CASCADE = "capability_cascade"  # Pattern C


@dataclass
class Route:
    """En routing-regel."""
    
    name: str
    triggers: list[str]  # Keywords eller semantic descriptions
    pattern: PatternType
    confidence_threshold: float = 0.7


class Router(ABC):
    """Bas-klass för task routing."""
    
    @abstractmethod
    async def select_pattern(
        self,
        task: str,
        context: dict[str, Any],
    ) -> tuple[PatternType, float]:
        """Välj pattern och returnera confidence."""
        ...


class SemanticRouter(Router):
    """Router baserad på semantic similarity."""
    
    def __init__(self, routes: list[Route]):
        self.routes = routes
    
    async def select_pattern(
        self,
        task: str,
        context: dict[str, Any],
    ) -> tuple[PatternType, float]:
        # Implementera semantic matching mot routes
        # Placeholder: default till capability cascade
        return PatternType.CAPABILITY_CASCADE, 0.8


class LLMRouter(Router):
    """Router som använder LLM för komplexa beslut."""
    
    async def select_pattern(
        self,
        task: str,
        context: dict[str, Any],
    ) -> tuple[PatternType, float]:
        # Implementera LLM-baserad routing
        return PatternType.CAPABILITY_CASCADE, 0.9


# ============================================================================
# PATTERN IMPLEMENTATIONS
# ============================================================================

class Pattern(ABC, Generic[T]):
    """Bas-klass för execution patterns."""
    
    @abstractmethod
    async def execute(
        self,
        task: str,
        context: dict[str, Any],
        config: APEXConfig,
        quality_fn: QualityFunction[T],
        output_schema: type[T],
    ) -> APEXResult[T]:
        """Exekvera pattern och returnera resultat."""
        ...


class DirectPattern(Pattern[T]):
    """Enkel single-shot generation utan orkestrering."""
    
    def __init__(self, generator: Generator[T]):
        self.generator = generator
    
    async def execute(
        self,
        task: str,
        context: dict[str, Any],
        config: APEXConfig,
        quality_fn: QualityFunction[T],
        output_schema: type[T],
    ) -> APEXResult[T]:
        metrics = APEXMetrics(pattern_selected="direct")
        
        try:
            output = await self.generator.generate(task, context)
            score = quality_fn(output, context)
            
            metrics.final_score = score
            metrics.score_trajectory = [score]
            metrics.iterations_used = 1
            
            if score >= config.quality_threshold:
                metrics.termination_reason = TerminationReason.CONVERGED
            else:
                metrics.termination_reason = TerminationReason.QUALITY_PLATEAU
            
            return APEXResult(
                output=output,
                score=score,
                iterations=1,
                termination_reason=metrics.termination_reason,
                metrics=metrics,
            )
            
        except ValidationError as e:
            metrics.invariant_violations += 1
            metrics.termination_reason = TerminationReason.VALIDATION_FAILURE
            return APEXResult(
                output=None,
                score=0.0,
                iterations=1,
                termination_reason=TerminationReason.VALIDATION_FAILURE,
                metrics=metrics,
            )


class CapabilityCascadePattern(Pattern[T]):
    """
    Pattern C: Capability Cascade
    
    Försöker lösa direkt först, eskalerar vid behov.
    """
    
    def __init__(
        self,
        probe_generator: Generator[T],
        refinement_pattern: Pattern[T],
        decomposition_pattern: Pattern[T],
    ):
        self.probe = probe_generator
        self.refinement = refinement_pattern
        self.decomposition = decomposition_pattern
    
    async def execute(
        self,
        task: str,
        context: dict[str, Any],
        config: APEXConfig,
        quality_fn: QualityFunction[T],
        output_schema: type[T],
    ) -> APEXResult[T]:
        metrics = APEXMetrics(pattern_selected="capability_cascade")
        
        # Steg 1: Probe - försök lösa direkt
        try:
            probe_result = await self.probe.generate(task, context)
            probe_score = quality_fn(probe_result, context)
            metrics.score_trajectory.append(probe_score)
            
        except (ValidationError, Exception):
            probe_score = 0.0
        
        # Steg 2: Route baserat på score
        if probe_score >= 0.9:
            # Tillräckligt bra direkt
            metrics.final_score = probe_score
            metrics.iterations_used = 1
            metrics.termination_reason = TerminationReason.CONVERGED
            return APEXResult(
                output=probe_result,
                score=probe_score,
                iterations=1,
                termination_reason=TerminationReason.CONVERGED,
                metrics=metrics,
            )
        
        elif probe_score >= 0.5:
            # Behöver refinement
            return await self.refinement.execute(
                task, context, config, quality_fn, output_schema
            )
        
        else:
            # Behöver full decomposition
            return await self.decomposition.execute(
                task, context, config, quality_fn, output_schema
            )


class AdversarialRefinementPattern(Pattern[T]):
    """
    Pattern B: Adversarial Refinement
    
    Iterativ förbättring genom critique-synthesis loop.
    """
    
    def __init__(
        self,
        generator_pool: DiverseGeneratorPool[T],
        critics: list[Critic],
        convergence: ConvergenceStrategy[T],
        synthesizer: Generator[T],
    ):
        self.generators = generator_pool
        self.critics = critics
        self.convergence = convergence
        self.synthesizer = synthesizer
    
    async def execute(
        self,
        task: str,
        context: dict[str, Any],
        config: APEXConfig,
        quality_fn: QualityFunction[T],
        output_schema: type[T],
    ) -> APEXResult[T]:
        metrics = APEXMetrics(pattern_selected="adversarial_refinement")
        all_critiques: list[Critique] = []
        
        # Steg 1: Generera kandidater
        candidates = await self.generators.generate_candidates(
            task, context, n=config.parallel_generators
        )
        
        # Filtrera bort exceptions
        valid_candidates = [c for c in candidates if isinstance(c, output_schema)]
        
        if not valid_candidates:
            metrics.termination_reason = TerminationReason.VALIDATION_FAILURE
            return APEXResult(
                output=None,
                score=0.0,
                iterations=1,
                termination_reason=TerminationReason.VALIDATION_FAILURE,
                metrics=metrics,
            )
        
        # Steg 2: Konvergera till bästa kandidat
        current = await self.convergence.converge(valid_candidates, context)
        current_score = quality_fn(current, context)
        metrics.score_trajectory.append(current_score)
        
        # Steg 3: Refinement loop
        for iteration in range(config.max_iterations):
            metrics.iterations_used = iteration + 1
            
            # Kör critics
            critique_tasks = [
                critic.evaluate(current, context) 
                for critic in self.critics
            ]
            critique_lists = await asyncio.gather(*critique_tasks)
            critiques = CritiqueResult(
                critiques=[c for sublist in critique_lists for c in sublist]
            )
            all_critiques.extend(critiques.critiques)
            
            # Check om vi kan avsluta
            if critiques.max_severity < config.severity_threshold:
                metrics.termination_reason = TerminationReason.CONVERGED
                metrics.final_score = current_score
                return APEXResult(
                    output=current,
                    score=current_score,
                    iterations=iteration + 1,
                    termination_reason=TerminationReason.CONVERGED,
                    metrics=metrics,
                    critiques=all_critiques,
                )
            
            # Synthesize improvement
            improvement_context = {
                **context,
                "current_output": current,
                "critiques": critiques.above_threshold(0.2),
            }
            
            try:
                improved = await self.synthesizer.generate(
                    f"Improve based on critiques: {task}",
                    improvement_context,
                )
                new_score = quality_fn(improved, context)
                
            except (ValidationError, Exception):
                # Synthesis failed, keep current
                continue
            
            metrics.score_trajectory.append(new_score)
            
            # Monotonic improvement check
            if new_score <= current_score + config.plateau_epsilon:
                metrics.termination_reason = TerminationReason.QUALITY_PLATEAU
                metrics.final_score = current_score
                return APEXResult(
                    output=current,
                    score=current_score,
                    iterations=iteration + 1,
                    termination_reason=TerminationReason.QUALITY_PLATEAU,
                    metrics=metrics,
                    critiques=all_critiques,
                )
            
            current = improved
            current_score = new_score
        
        # Max iterations reached
        metrics.termination_reason = TerminationReason.MAX_ITERATIONS
        metrics.final_score = current_score
        return APEXResult(
            output=current,
            score=current_score,
            iterations=config.max_iterations,
            termination_reason=TerminationReason.MAX_ITERATIONS,
            metrics=metrics,
            critiques=all_critiques,
        )


# ============================================================================
# MAIN EXECUTOR
# ============================================================================

class APEXExecutor(Generic[T]):
    """
    Huvudsaklig executor för APEX framework.
    
    Koordinerar routing, pattern selection, och execution.
    """
    
    def __init__(
        self,
        router: Router,
        patterns: dict[PatternType, Pattern[T]],
        quality_fn: QualityFunction[T],
        output_schema: type[T],
        config: APEXConfig | None = None,
    ):
        self.router = router
        self.patterns = patterns
        self.quality_fn = quality_fn
        self.output_schema = output_schema
        self.config = config or APEXConfig()
    
    async def execute(
        self,
        task: str,
        context: dict[str, Any] | None = None,
    ) -> APEXResult[T]:
        """
        Exekvera en task genom APEX framework.
        
        Args:
            task: Beskrivning av vad som ska genereras
            context: Domän-specifik kontext
            
        Returns:
            APEXResult med output, score, och metrics
        """
        context = context or {}
        
        # Route till lämpligt pattern
        pattern_type, confidence = await self.router.select_pattern(task, context)
        
        if pattern_type not in self.patterns:
            # Fallback till capability cascade om pattern saknas
            pattern_type = PatternType.CAPABILITY_CASCADE
        
        pattern = self.patterns[pattern_type]
        
        # Execute pattern
        result = await pattern.execute(
            task=task,
            context=context,
            config=self.config,
            quality_fn=self.quality_fn,
            output_schema=self.output_schema,
        )
        
        # Enricha metrics
        result.metrics.route_confidence = confidence
        
        return result


# ============================================================================
# FACTORY FUNCTION
# ============================================================================

def create_apex_instance(
    domain: str,
    output_schema: type[T],
    quality_fn: QualityFunction[T],
    generator_factory: Callable[[], Generator[T]],
    critics: list[Critic],
    config: APEXConfig | None = None,
) -> APEXExecutor[T]:
    """
    Factory function för att skapa en APEX-instans.
    
    Args:
        domain: Namn på domänen (för logging/metrics)
        output_schema: Pydantic schema för output
        quality_fn: Domän-specifik quality function
        generator_factory: Factory för att skapa generatorer
        critics: Lista av domän-specifika critics
        config: Optional konfiguration
        
    Returns:
        Konfigurerad APEXExecutor
    """
    config = config or APEXConfig()
    
    # Skapa generators
    generators = [generator_factory() for _ in range(config.parallel_generators)]
    generator_pool = DiverseGeneratorPool(generators)
    
    # Skapa patterns
    direct = DirectPattern(generators[0])
    
    adversarial = AdversarialRefinementPattern(
        generator_pool=generator_pool,
        critics=critics,
        convergence=SynthesisConvergence(),
        synthesizer=generator_factory(),
    )
    
    cascade = CapabilityCascadePattern(
        probe_generator=generators[0],
        refinement_pattern=adversarial,
        decomposition_pattern=adversarial,  # Placeholder
    )
    
    patterns = {
        PatternType.DIRECT: direct,
        PatternType.ADVERSARIAL_REFINEMENT: adversarial,
        PatternType.CAPABILITY_CASCADE: cascade,
    }
    
    # Skapa router
    router = SemanticRouter(routes=[])  # Konfigurera routes per domän
    
    return APEXExecutor(
        router=router,
        patterns=patterns,
        quality_fn=quality_fn,
        output_schema=output_schema,
        config=config,
    )


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Se APEX_EXAMPLE_SEO.py för komplett användningsexempel
    print("APEX Framework loaded. See examples for usage.")

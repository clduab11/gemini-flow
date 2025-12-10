"""
APEX Framework - SEO Content Domain Example
Demonstrates how to instantiate APEX for SEO content generation.
"""

import asyncio
import re
from dataclasses import dataclass

from pydantic import BaseModel, Field, field_validator, model_validator

from apex.core import (
    APEXConfig,
    APEXExecutor,
    Critic,
    Critique,
    Generator,
    QualityFunction,
    create_apex_instance,
)


# ============================================================================
# DOMAIN SCHEMA - Invariants
# ============================================================================

class SEOArticle(BaseModel):
    """
    Schema för SEO-optimerad artikel.
    
    Alla field validators är HÅRDA invariants - outputs som 
    inte klarar dessa kastas automatiskt.
    """
    
    # Required fields med constraints
    title: str = Field(
        ..., 
        min_length=30, 
        max_length=70,
        description="SEO title, 30-70 chars"
    )
    
    meta_description: str = Field(
        ..., 
        min_length=120, 
        max_length=160,
        description="Meta description, 120-160 chars"
    )
    
    content: str = Field(
        ..., 
        min_length=1500,
        description="Main article content"
    )
    
    headings: list[str] = Field(
        ..., 
        min_length=3,
        description="H2 headings in article"
    )
    
    # Optional enrichments
    internal_links: list[str] = Field(
        default_factory=list,
        description="Suggested internal link anchors"
    )
    
    cta_text: str | None = Field(
        default=None,
        description="Call-to-action text"
    )
    
    # Validators - HARD invariants
    
    @field_validator('title')
    @classmethod
    def title_format(cls, v: str) -> str:
        """Title måste börja med stor bokstav, inte sluta med punkt."""
        if not v[0].isupper():
            raise ValueError("Title must start with capital letter")
        if v.endswith('.'):
            raise ValueError("Title should not end with period")
        return v
    
    @field_validator('content')
    @classmethod
    def no_placeholder_content(cls, v: str) -> str:
        """Inga placeholder-texter får finnas."""
        forbidden = [
            'TODO', 'FIXME', 'Lorem ipsum', '[INSERT', 
            'PLACEHOLDER', '{{', '}}', '[TBD]'
        ]
        for term in forbidden:
            if term.lower() in v.lower():
                raise ValueError(f"Content contains forbidden placeholder: {term}")
        return v
    
    @field_validator('headings')
    @classmethod
    def unique_headings(cls, v: list[str]) -> list[str]:
        """Headings måste vara unika."""
        if len(v) != len(set(v)):
            raise ValueError("Headings must be unique")
        return v
    
    @model_validator(mode='after')
    def content_has_headings(self) -> 'SEOArticle':
        """Alla headings måste finnas i content."""
        for heading in self.headings:
            if heading not in self.content:
                raise ValueError(f"Heading '{heading}' not found in content")
        return self


class SEOArticleContext(BaseModel):
    """Context för SEO-artikel generation."""
    
    primary_keyword: str
    secondary_keywords: list[str] = Field(default_factory=list)
    lsi_terms: list[str] = Field(default_factory=list)
    target_audience: str = ""
    word_count_target: int = 2000
    tone: str = "professional"
    
    # Optional brand guidelines
    brand_voice: str | None = None
    forbidden_terms: list[str] = Field(default_factory=list)


# ============================================================================
# QUALITY FUNCTION
# ============================================================================

def calculate_readability_score(text: str) -> float:
    """Beräkna Flesch-Kincaid-liknande readability score."""
    sentences = re.split(r'[.!?]+', text)
    words = text.split()
    
    if not sentences or not words:
        return 0.0
    
    avg_sentence_length = len(words) / len(sentences)
    
    # Simplified syllable count (approximate)
    syllables = sum(
        max(1, len(re.findall(r'[aeiouyåäö]+', word.lower())))
        for word in words
    )
    avg_syllables_per_word = syllables / len(words)
    
    # Flesch Reading Ease formula (adapted for Swedish)
    score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
    
    # Normalize to 0-1
    return max(0.0, min(1.0, score / 100))


def seo_quality_function(article: SEOArticle, context: dict) -> float:
    """
    Quality function för SEO articles.
    
    Returnerar score 0.0-1.0 baserat på:
    - Keyword presence och density
    - Readability
    - Structural completeness
    - LSI term coverage
    """
    ctx = SEOArticleContext.model_validate(context)
    scores: list[float] = []
    weights: list[float] = []
    
    # 1. Primary keyword i title (viktigt!)
    kw_in_title = ctx.primary_keyword.lower() in article.title.lower()
    scores.append(1.0 if kw_in_title else 0.0)
    weights.append(2.0)  # Hög vikt
    
    # 2. Primary keyword i meta description
    kw_in_meta = ctx.primary_keyword.lower() in article.meta_description.lower()
    scores.append(1.0 if kw_in_meta else 0.0)
    weights.append(1.5)
    
    # 3. Keyword density (target: 1-3%)
    content_words = article.content.lower().split()
    kw_count = sum(1 for w in content_words if ctx.primary_keyword.lower() in w)
    density = kw_count / len(content_words) if content_words else 0
    
    if 0.01 <= density <= 0.03:
        density_score = 1.0
    elif 0.005 <= density <= 0.04:
        density_score = 0.7
    else:
        density_score = 0.3
    scores.append(density_score)
    weights.append(1.5)
    
    # 4. Readability
    readability = calculate_readability_score(article.content)
    scores.append(readability)
    weights.append(1.0)
    
    # 5. Word count target
    actual_words = len(article.content.split())
    word_ratio = actual_words / ctx.word_count_target
    if 0.9 <= word_ratio <= 1.2:
        word_score = 1.0
    elif 0.7 <= word_ratio <= 1.5:
        word_score = 0.7
    else:
        word_score = 0.4
    scores.append(word_score)
    weights.append(1.0)
    
    # 6. Heading distribution (jämn fördelning)
    if article.headings:
        sections = article.content.split('\n## ')
        if len(sections) > 1:
            section_lengths = [len(s.split()) for s in sections]
            avg_len = sum(section_lengths) / len(section_lengths)
            variance = sum((l - avg_len) ** 2 for l in section_lengths) / len(section_lengths)
            balance_score = 1.0 / (1.0 + variance / 10000)  # Normalize
        else:
            balance_score = 0.5
    else:
        balance_score = 0.0
    scores.append(balance_score)
    weights.append(0.8)
    
    # 7. LSI term coverage
    if ctx.lsi_terms:
        content_lower = article.content.lower()
        covered = sum(1 for term in ctx.lsi_terms if term.lower() in content_lower)
        lsi_score = covered / len(ctx.lsi_terms)
    else:
        lsi_score = 1.0  # Ingen LSI = full score
    scores.append(lsi_score)
    weights.append(1.2)
    
    # 8. Secondary keywords coverage
    if ctx.secondary_keywords:
        content_lower = article.content.lower()
        covered = sum(1 for kw in ctx.secondary_keywords if kw.lower() in content_lower)
        secondary_score = covered / len(ctx.secondary_keywords)
    else:
        secondary_score = 1.0
    scores.append(secondary_score)
    weights.append(1.0)
    
    # 9. Structural elements
    has_intro = len(article.content.split('\n\n')[0]) > 150
    has_conclusion = any(
        term in article.content.lower()[-800:] 
        for term in ['sammanfattning', 'slutsats', 'avslutning', 'summary']
    )
    structural_score = (has_intro + has_conclusion) / 2
    scores.append(structural_score)
    weights.append(0.8)
    
    # Weighted average
    total_weight = sum(weights)
    weighted_sum = sum(s * w for s, w in zip(scores, weights))
    
    return weighted_sum / total_weight


# ============================================================================
# CRITICS
# ============================================================================

class SEOCritic(Critic):
    """Critic för SEO-specifika aspekter."""
    
    dimension = "seo"
    weight = 1.5
    
    async def evaluate(self, output: SEOArticle, context: dict) -> list[Critique]:
        critiques = []
        ctx = SEOArticleContext.model_validate(context)
        
        # Check keyword i title
        if ctx.primary_keyword.lower() not in output.title.lower():
            critiques.append(Critique(
                dimension="seo",
                issue="Primary keyword missing from title",
                severity=0.8,
                suggestion=f"Include '{ctx.primary_keyword}' in title",
                location="title"
            ))
        
        # Check keyword i första 100 orden
        first_100 = ' '.join(output.content.split()[:100]).lower()
        if ctx.primary_keyword.lower() not in first_100:
            critiques.append(Critique(
                dimension="seo",
                issue="Primary keyword not in first 100 words",
                severity=0.6,
                suggestion=f"Add '{ctx.primary_keyword}' early in content",
                location="introduction"
            ))
        
        # Check meta description length optimization
        meta_len = len(output.meta_description)
        if meta_len < 140 or meta_len > 155:
            critiques.append(Critique(
                dimension="seo",
                issue=f"Meta description length ({meta_len}) not optimal (140-155)",
                severity=0.3,
                suggestion="Adjust meta description to 140-155 characters",
                location="meta_description"
            ))
        
        return critiques


class ReadabilityCritic(Critic):
    """Critic för läsbarhet."""
    
    dimension = "readability"
    weight = 1.0
    
    async def evaluate(self, output: SEOArticle, context: dict) -> list[Critique]:
        critiques = []
        
        # Check för för långa meningar
        sentences = re.split(r'[.!?]+', output.content)
        long_sentences = [s for s in sentences if len(s.split()) > 35]
        
        if len(long_sentences) > 3:
            critiques.append(Critique(
                dimension="readability",
                issue=f"{len(long_sentences)} sentences over 35 words",
                severity=0.5,
                suggestion="Break up long sentences for better readability",
            ))
        
        # Check för paragraf-längd
        paragraphs = output.content.split('\n\n')
        long_paras = [p for p in paragraphs if len(p.split()) > 150]
        
        if long_paras:
            critiques.append(Critique(
                dimension="readability",
                issue=f"{len(long_paras)} paragraphs over 150 words",
                severity=0.4,
                suggestion="Add paragraph breaks for scannability",
            ))
        
        return critiques


class StructureCritic(Critic):
    """Critic för artikelstruktur."""
    
    dimension = "structure"
    weight = 1.0
    
    async def evaluate(self, output: SEOArticle, context: dict) -> list[Critique]:
        critiques = []
        
        # Check heading frequency
        word_count = len(output.content.split())
        heading_count = len(output.headings)
        words_per_heading = word_count / heading_count if heading_count else word_count
        
        if words_per_heading > 500:
            critiques.append(Critique(
                dimension="structure",
                issue=f"Too few headings ({words_per_heading:.0f} words/heading)",
                severity=0.5,
                suggestion="Add more H2 headings (target: 300-400 words per section)",
            ))
        
        # Check för intro och outro
        content = output.content.lower()
        if not any(term in content[-500:] for term in ['sammanfattning', 'slutsats', 'avslutningsvis']):
            critiques.append(Critique(
                dimension="structure",
                issue="Missing conclusion section",
                severity=0.4,
                suggestion="Add a conclusion/summary section",
                location="end"
            ))
        
        return critiques


class BrandVoiceCritic(Critic):
    """Critic för brand voice compliance."""
    
    dimension = "brand"
    weight = 0.8
    
    async def evaluate(self, output: SEOArticle, context: dict) -> list[Critique]:
        critiques = []
        ctx = SEOArticleContext.model_validate(context)
        
        # Check forbidden terms
        for term in ctx.forbidden_terms:
            if term.lower() in output.content.lower():
                critiques.append(Critique(
                    dimension="brand",
                    issue=f"Contains forbidden term: '{term}'",
                    severity=0.7,
                    suggestion=f"Remove or replace '{term}'",
                ))
        
        return critiques


# ============================================================================
# GENERATOR (Placeholder - replace with actual LLM integration)
# ============================================================================

class SEOArticleGenerator(Generator[SEOArticle]):
    """
    Generator för SEO articles.
    
    I produktion: Integrera med Claude/GPT via API.
    """
    
    def __init__(self, model: str = "claude-sonnet-4-20250514", temperature: float = 0.7):
        self.model = model
        self.temperature = temperature
    
    async def generate(
        self,
        task: str,
        context: dict,
        constraints: dict | None = None,
    ) -> SEOArticle:
        """
        Generera SEO artikel.
        
        I produktion, ersätt denna med faktisk LLM-integration:
        
        ```python
        response = await anthropic.messages.create(
            model=self.model,
            messages=[{"role": "user", "content": self._build_prompt(task, context)}],
            max_tokens=4000,
        )
        return SEOArticle.model_validate_json(response.content[0].text)
        ```
        """
        ctx = SEOArticleContext.model_validate(context)
        
        # Placeholder implementation - returnerar example
        # Ersätt med faktisk LLM-integration
        return SEOArticle(
            title=f"{ctx.primary_keyword.title()} - En Komplett Guide",
            meta_description=f"Lär dig allt om {ctx.primary_keyword}. Vår guide täcker allt du behöver veta för att lyckas. Läs mer och kom igång idag!",
            content=f"""# {ctx.primary_keyword.title()} - Allt Du Behöver Veta

Att förstå {ctx.primary_keyword} är viktigt för alla som vill lyckas inom detta område.
I denna guide går vi igenom grunderna och avancerade koncept.

## Vad är {ctx.primary_keyword}?

{ctx.primary_keyword.title()} handlar om... [content continues]

## Varför är {ctx.primary_keyword} viktigt?

Det finns många anledningar till varför {ctx.primary_keyword} spelar en central roll...

## Hur kommer du igång med {ctx.primary_keyword}?

Att börja med {ctx.primary_keyword} behöver inte vara svårt...

## Sammanfattning

I denna guide har vi gått igenom de viktigaste aspekterna av {ctx.primary_keyword}.
""",
            headings=[
                f"Vad är {ctx.primary_keyword}?",
                f"Varför är {ctx.primary_keyword} viktigt?",
                f"Hur kommer du igång med {ctx.primary_keyword}?",
                "Sammanfattning"
            ],
            internal_links=[
                f"relaterat-ämne-{ctx.primary_keyword}",
                "guide-för-nybörjare"
            ],
            cta_text="Kontakta oss för mer information!"
        )


# ============================================================================
# INSTANTIATION
# ============================================================================

def create_seo_apex(config: APEXConfig | None = None) -> APEXExecutor[SEOArticle]:
    """Skapa en APEX-instans för SEO content generation."""
    
    critics = [
        SEOCritic(),
        ReadabilityCritic(),
        StructureCritic(),
        BrandVoiceCritic(),
    ]
    
    return create_apex_instance(
        domain="seo_content",
        output_schema=SEOArticle,
        quality_fn=seo_quality_function,
        generator_factory=lambda: SEOArticleGenerator(),
        critics=critics,
        config=config,
    )


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def main():
    """Exempel på hur man använder APEX för SEO content."""
    
    # Skapa APEX instance
    apex = create_seo_apex(
        config=APEXConfig(
            quality_threshold=0.85,
            max_iterations=5,
            parallel_generators=3,
        )
    )
    
    # Definiera task och context
    task = "Skriv en pillar page om hållbar renovering för villaägare"
    
    context = {
        "primary_keyword": "hållbar renovering",
        "secondary_keywords": [
            "energieffektivisering",
            "miljövänlig renovering",
            "grön ombyggnad"
        ],
        "lsi_terms": [
            "isolering",
            "solpaneler",
            "värmepump",
            "ROI renovering",
            "miljöcertifiering"
        ],
        "target_audience": "villaägare 35-55 år",
        "word_count_target": 2500,
        "tone": "informativ men tillgänglig",
        "brand_voice": "expert men vänlig",
        "forbidden_terms": ["billigt", "snabbt"]
    }
    
    # Execute
    print("Starting APEX execution...")
    result = await apex.execute(task=task, context=context)
    
    # Output results
    print(f"\n{'='*60}")
    print(f"APEX Execution Complete")
    print(f"{'='*60}")
    print(f"Success: {result.success}")
    print(f"Score: {result.score:.2%}")
    print(f"Iterations: {result.iterations}")
    print(f"Termination: {result.termination_reason.value}")
    print(f"Score trajectory: {[f'{s:.2%}' for s in result.metrics.score_trajectory]}")
    
    if result.critiques:
        print(f"\nCritiques ({len(result.critiques)} total):")
        for c in result.critiques[:5]:  # Show top 5
            print(f"  [{c.dimension}] {c.issue} (severity: {c.severity:.2f})")
    
    if result.output:
        print(f"\nGenerated Article:")
        print(f"  Title: {result.output.title}")
        print(f"  Meta: {result.output.meta_description[:80]}...")
        print(f"  Headings: {len(result.output.headings)}")
        print(f"  Word count: {len(result.output.content.split())}")


if __name__ == "__main__":
    asyncio.run(main())

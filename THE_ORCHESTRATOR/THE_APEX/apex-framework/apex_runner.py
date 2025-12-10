"""
APEX Live Runner
Körbar version som använder Claude API direkt.

Användning:
    python apex_runner.py --task "Din uppgift här" --domain seo

Eller importera och kör programmatiskt.
"""

import os
import json
import asyncio
from dataclasses import dataclass, field
from typing import Any
from anthropic import Anthropic

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class APEXRunConfig:
    """Runtime configuration."""
    model_architect: str = "claude-sonnet-4-20250514"
    model_generator: str = "claude-sonnet-4-20250514"  
    model_critic: str = "claude-sonnet-4-20250514"
    
    quality_threshold: float = 0.80
    max_iterations: int = 3
    parallel_candidates: int = 2
    
    # Token budgets per call
    max_tokens_architect: int = 2000
    max_tokens_generator: int = 4000
    max_tokens_critic: int = 1500


@dataclass 
class APEXResult:
    """Execution result."""
    success: bool
    output: dict | None
    score: float
    iterations: int
    trajectory: list[float] = field(default_factory=list)
    critiques: list[dict] = field(default_factory=list)
    termination_reason: str = ""
    total_tokens: int = 0


# ============================================================================
# CORE APEX ENGINE
# ============================================================================

class APEXEngine:
    """
    Self-contained APEX engine med Claude API integration.
    """
    
    def __init__(self, api_key: str | None = None, config: APEXRunConfig | None = None):
        self.client = Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.config = config or APEXRunConfig()
        self.total_tokens = 0
    
    async def run(
        self,
        task: str,
        context: dict[str, Any],
        output_schema: dict[str, Any],
        quality_criteria: list[str],
    ) -> APEXResult:
        """
        Kör APEX Capability Cascade pattern.
        
        Args:
            task: Vad som ska genereras
            context: Domän-specifik kontext
            output_schema: JSON schema för output
            quality_criteria: Lista av kvalitetskriterier
        """
        trajectory = []
        all_critiques = []
        
        # === STEG 1: PROBE - Försök lösa direkt ===
        print("🔍 PROBE: Attempting direct solution...")
        
        probe_result = await self._generate(
            task=task,
            context=context,
            schema=output_schema,
            previous_critiques=None,
        )
        
        if not probe_result:
            return APEXResult(
                success=False,
                output=None,
                score=0.0,
                iterations=1,
                termination_reason="generation_failed",
                total_tokens=self.total_tokens,
            )
        
        # === STEG 2: EVALUATE ===
        print("📊 EVALUATE: Scoring output...")
        
        score, critiques = await self._evaluate(
            output=probe_result,
            context=context,
            criteria=quality_criteria,
        )
        trajectory.append(score)
        all_critiques.extend(critiques)
        
        print(f"   Score: {score:.2%}")
        
        # Check om tillräckligt bra direkt
        if score >= 0.90:
            print("✅ CONVERGED: High quality on first attempt!")
            return APEXResult(
                success=True,
                output=probe_result,
                score=score,
                iterations=1,
                trajectory=trajectory,
                critiques=all_critiques,
                termination_reason="converged_direct",
                total_tokens=self.total_tokens,
            )
        
        # === STEG 3: REFINEMENT LOOP ===
        current_output = probe_result
        current_score = score
        
        for iteration in range(2, self.config.max_iterations + 1):
            print(f"\n🔄 REFINE: Iteration {iteration}...")
            
            # Kritik-driven förbättring
            significant_critiques = [c for c in critiques if c.get("severity", 0) > 0.3]
            
            if not significant_critiques:
                print("✅ CONVERGED: No significant critiques remain!")
                return APEXResult(
                    success=True,
                    output=current_output,
                    score=current_score,
                    iterations=iteration - 1,
                    trajectory=trajectory,
                    critiques=all_critiques,
                    termination_reason="converged_no_critiques",
                    total_tokens=self.total_tokens,
                )
            
            # Generera förbättrad version
            improved = await self._generate(
                task=task,
                context=context,
                schema=output_schema,
                previous_critiques=significant_critiques,
                previous_output=current_output,
            )
            
            if not improved:
                continue
            
            # Evaluera förbättringen
            new_score, new_critiques = await self._evaluate(
                output=improved,
                context=context,
                criteria=quality_criteria,
            )
            trajectory.append(new_score)
            all_critiques.extend(new_critiques)
            
            print(f"   Score: {new_score:.2%} (Δ{new_score - current_score:+.2%})")
            
            # Monotonic improvement check
            if new_score <= current_score + 0.01:
                print("⚠️ PLATEAU: No improvement, stopping")
                return APEXResult(
                    success=current_score >= self.config.quality_threshold,
                    output=current_output,
                    score=current_score,
                    iterations=iteration,
                    trajectory=trajectory,
                    critiques=all_critiques,
                    termination_reason="plateau",
                    total_tokens=self.total_tokens,
                )
            
            current_output = improved
            current_score = new_score
            critiques = new_critiques
            
            # Check threshold
            if current_score >= self.config.quality_threshold:
                print(f"✅ CONVERGED: Reached quality threshold!")
                return APEXResult(
                    success=True,
                    output=current_output,
                    score=current_score,
                    iterations=iteration,
                    trajectory=trajectory,
                    critiques=all_critiques,
                    termination_reason="converged_threshold",
                    total_tokens=self.total_tokens,
                )
        
        # Max iterations reached
        print(f"⏱️ MAX_ITERATIONS: Reached limit")
        return APEXResult(
            success=current_score >= self.config.quality_threshold,
            output=current_output,
            score=current_score,
            iterations=self.config.max_iterations,
            trajectory=trajectory,
            critiques=all_critiques,
            termination_reason="max_iterations",
            total_tokens=self.total_tokens,
        )
    
    async def _generate(
        self,
        task: str,
        context: dict,
        schema: dict,
        previous_critiques: list[dict] | None = None,
        previous_output: dict | None = None,
    ) -> dict | None:
        """Generera output via Claude API."""
        
        system = """Du är en expert-generator i APEX-systemet. Din uppgift är att generera 
högkvalitativ output som exakt matchar det givna schemat.

KRITISKA REGLER:
1. Returnera ENDAST valid JSON som matchar schemat
2. Inga placeholders (TODO, FIXME, [INSERT], etc.)
3. Var specifik och konkret, inte generisk
4. Om du får kritik, adressera VARJE punkt explicit"""

        # Bygg prompt
        prompt_parts = [
            f"## UPPGIFT\n{task}",
            f"\n## KONTEXT\n```json\n{json.dumps(context, ensure_ascii=False, indent=2)}\n```",
            f"\n## OUTPUT SCHEMA\n```json\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n```",
        ]
        
        if previous_output and previous_critiques:
            prompt_parts.append(f"\n## TIDIGARE OUTPUT (att förbättra)\n```json\n{json.dumps(previous_output, ensure_ascii=False, indent=2)}\n```")
            prompt_parts.append(f"\n## KRITIK ATT ADRESSERA")
            for c in previous_critiques:
                prompt_parts.append(f"- [{c.get('dimension', 'general')}] {c.get('issue', '')} (severity: {c.get('severity', 0):.1f})")
                if c.get('suggestion'):
                    prompt_parts.append(f"  → Förslag: {c.get('suggestion')}")
            prompt_parts.append("\nFörbättra outputen baserat på kritiken. Behåll det som var bra.")
        
        prompt_parts.append("\n## DIN OUTPUT\nReturnera ENDAST valid JSON:")
        
        try:
            response = self.client.messages.create(
                model=self.config.model_generator,
                max_tokens=self.config.max_tokens_generator,
                system=system,
                messages=[{"role": "user", "content": "\n".join(prompt_parts)}],
            )
            
            self.total_tokens += response.usage.input_tokens + response.usage.output_tokens
            
            # Parse JSON från response
            text = response.content[0].text
            
            # Hitta JSON i response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            return json.loads(text.strip())
            
        except Exception as e:
            print(f"   ⚠️ Generation error: {e}")
            return None
    
    async def _evaluate(
        self,
        output: dict,
        context: dict,
        criteria: list[str],
    ) -> tuple[float, list[dict]]:
        """Evaluera output och generera critiques."""
        
        system = """Du är en expert-kritiker i APEX-systemet. Din uppgift är att:
1. Evaluera output mot givna kriterier
2. Identifiera specifika problem
3. Ge en övergripande kvalitetspoäng

Var STRIKT men RÄTTVIS. Identifiera verkliga problem, inte teoretiska."""

        prompt = f"""## OUTPUT ATT EVALUERA
```json
{json.dumps(output, ensure_ascii=False, indent=2)}
```

## KONTEXT
```json
{json.dumps(context, ensure_ascii=False, indent=2)}
```

## KVALITETSKRITERIER
{chr(10).join(f"- {c}" for c in criteria)}

## DIN EVALUATION
Returnera JSON med exakt detta format:
```json
{{
    "overall_score": 0.0-1.0,
    "critiques": [
        {{
            "dimension": "kategori",
            "issue": "specifikt problem",
            "severity": 0.0-1.0,
            "suggestion": "hur man fixar"
        }}
    ],
    "strengths": ["vad som är bra"]
}}
```"""

        try:
            response = self.client.messages.create(
                model=self.config.model_critic,
                max_tokens=self.config.max_tokens_critic,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            
            self.total_tokens += response.usage.input_tokens + response.usage.output_tokens
            
            text = response.content[0].text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            evaluation = json.loads(text.strip())
            
            return (
                evaluation.get("overall_score", 0.5),
                evaluation.get("critiques", [])
            )
            
        except Exception as e:
            print(f"   ⚠️ Evaluation error: {e}")
            return 0.5, []


# ============================================================================
# PRESET DOMAINS
# ============================================================================

PRESETS = {
    "seo_article": {
        "schema": {
            "type": "object",
            "required": ["title", "meta_description", "content", "headings"],
            "properties": {
                "title": {"type": "string", "minLength": 30, "maxLength": 70},
                "meta_description": {"type": "string", "minLength": 120, "maxLength": 160},
                "content": {"type": "string", "minLength": 1500},
                "headings": {"type": "array", "items": {"type": "string"}, "minItems": 3},
                "internal_link_suggestions": {"type": "array", "items": {"type": "string"}},
            }
        },
        "criteria": [
            "Primary keyword appears in title",
            "Primary keyword in first 100 words",
            "Keyword density 1-3%",
            "All headings are unique and descriptive",
            "Content flows logically between sections",
            "Includes actionable takeaways",
            "Meta description is compelling with CTA",
            "No placeholder text or generic phrases",
        ]
    },
    
    "code_module": {
        "schema": {
            "type": "object",
            "required": ["filename", "code", "docstring", "functions"],
            "properties": {
                "filename": {"type": "string"},
                "code": {"type": "string"},
                "docstring": {"type": "string"},
                "functions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "purpose": {"type": "string"},
                            "params": {"type": "array"},
                            "returns": {"type": "string"}
                        }
                    }
                },
                "dependencies": {"type": "array", "items": {"type": "string"}},
                "usage_example": {"type": "string"}
            }
        },
        "criteria": [
            "Code is syntactically valid Python 3.11+",
            "All functions have type hints",
            "Docstrings follow Google style",
            "No hardcoded values - use constants or config",
            "Error handling for edge cases",
            "Usage example actually works with the code",
            "Dependencies are minimal and standard",
        ]
    },
    
    "api_endpoint": {
        "schema": {
            "type": "object", 
            "required": ["method", "path", "handler_code", "request_schema", "response_schema"],
            "properties": {
                "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]},
                "path": {"type": "string"},
                "handler_code": {"type": "string"},
                "request_schema": {"type": "object"},
                "response_schema": {"type": "object"},
                "error_responses": {"type": "array"},
                "authentication": {"type": "string"},
                "rate_limit": {"type": "string"}
            }
        },
        "criteria": [
            "Handler follows FastAPI/Flask patterns",
            "Request validation is complete",
            "All error cases have proper responses",
            "Authentication is properly checked",
            "Response schema matches actual returns",
            "SQL injection and XSS protected",
        ]
    },
    
    "custom": {
        "schema": {},
        "criteria": []
    }
}


# ============================================================================
# CLI INTERFACE
# ============================================================================

async def run_apex_cli():
    """Interactive CLI for APEX."""
    
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                    APEX LIVE RUNNER                           ║
║         Adaptive Precision Execution Architecture             ║
╚═══════════════════════════════════════════════════════════════╝
    """)
    
    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        api_key = input("Enter Anthropic API key: ").strip()
        if not api_key:
            print("❌ API key required")
            return
    
    engine = APEXEngine(api_key=api_key)
    
    # Select domain
    print("\n📋 Available presets:")
    for i, name in enumerate(PRESETS.keys(), 1):
        print(f"   {i}. {name}")
    
    choice = input("\nSelect preset (number or name): ").strip()
    
    if choice.isdigit():
        preset_name = list(PRESETS.keys())[int(choice) - 1]
    else:
        preset_name = choice
    
    preset = PRESETS.get(preset_name, PRESETS["custom"])
    
    # Get task
    print(f"\n📝 Preset: {preset_name}")
    task = input("Enter task description: ").strip()
    
    # Get context
    print("\nEnter context (JSON format, or press Enter for defaults):")
    context_input = input().strip()
    
    if context_input:
        context = json.loads(context_input)
    else:
        # Default context based on preset
        if preset_name == "seo_article":
            context = {
                "primary_keyword": input("Primary keyword: ").strip() or "example topic",
                "target_audience": input("Target audience: ").strip() or "general readers",
                "word_count": 2000,
                "tone": "professional but accessible"
            }
        else:
            context = {}
    
    # Custom schema/criteria for custom preset
    if preset_name == "custom":
        print("\nEnter output schema (JSON):")
        preset["schema"] = json.loads(input().strip())
        print("\nEnter quality criteria (comma-separated):")
        preset["criteria"] = [c.strip() for c in input().split(",")]
    
    # Run APEX
    print("\n" + "="*60)
    print("🚀 STARTING APEX EXECUTION")
    print("="*60 + "\n")
    
    result = await engine.run(
        task=task,
        context=context,
        output_schema=preset["schema"],
        quality_criteria=preset["criteria"],
    )
    
    # Display results
    print("\n" + "="*60)
    print("📊 RESULTS")
    print("="*60)
    print(f"Success: {'✅' if result.success else '❌'} {result.success}")
    print(f"Final Score: {result.score:.2%}")
    print(f"Iterations: {result.iterations}")
    print(f"Termination: {result.termination_reason}")
    print(f"Total Tokens: {result.total_tokens:,}")
    print(f"Score Trajectory: {' → '.join(f'{s:.0%}' for s in result.trajectory)}")
    
    if result.critiques:
        print(f"\n📝 Final Critiques ({len(result.critiques)}):")
        for c in result.critiques[-5:]:
            severity_icon = "🔴" if c.get("severity", 0) > 0.6 else "🟡" if c.get("severity", 0) > 0.3 else "🟢"
            print(f"   {severity_icon} [{c.get('dimension', '?')}] {c.get('issue', '?')}")
    
    if result.output:
        print(f"\n📄 OUTPUT:")
        print("-"*60)
        print(json.dumps(result.output, ensure_ascii=False, indent=2)[:2000])
        if len(json.dumps(result.output)) > 2000:
            print("... (truncated)")
        
        # Save to file
        save = input("\n💾 Save output to file? (y/n): ").strip().lower()
        if save == 'y':
            filename = f"apex_output_{preset_name}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    "task": task,
                    "context": context,
                    "result": {
                        "success": result.success,
                        "score": result.score,
                        "iterations": result.iterations,
                        "output": result.output,
                        "critiques": result.critiques,
                    }
                }, f, ensure_ascii=False, indent=2)
            print(f"✅ Saved to {filename}")


# ============================================================================
# PROGRAMMATIC INTERFACE
# ============================================================================

async def run_apex(
    task: str,
    context: dict,
    preset: str = "custom",
    schema: dict | None = None,
    criteria: list[str] | None = None,
    api_key: str | None = None,
    config: APEXRunConfig | None = None,
) -> APEXResult:
    """
    Programmatic interface för APEX.
    
    Args:
        task: Description of what to generate
        context: Domain-specific context
        preset: One of "seo_article", "code_module", "api_endpoint", "custom"
        schema: Custom output schema (required if preset="custom")
        criteria: Custom quality criteria (required if preset="custom")
        api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
        config: Optional APEXRunConfig
        
    Returns:
        APEXResult with output, score, and metrics
    """
    engine = APEXEngine(api_key=api_key, config=config)
    
    preset_data = PRESETS.get(preset, PRESETS["custom"])
    
    return await engine.run(
        task=task,
        context=context,
        output_schema=schema or preset_data["schema"],
        quality_criteria=criteria or preset_data["criteria"],
    )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        asyncio.run(run_apex_cli())
    else:
        # Quick demo
        print("Usage: python apex_runner.py --cli")
        print("\nOr import and use programmatically:")
        print("""
from apex_runner import run_apex

result = await run_apex(
    task="Write an SEO article about sustainable renovation",
    context={"primary_keyword": "sustainable renovation"},
    preset="seo_article"
)
        """)

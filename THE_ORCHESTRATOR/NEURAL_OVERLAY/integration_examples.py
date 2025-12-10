"""
CONCRETE INTEGRATION EXAMPLES

Copy these snippets into your actual systems to enable Neural Overlay.
"""

# ==========================================
# EXAMPLE 1: SOVEREIGN_AGENTS Integration
# ==========================================
# Add to: SOVEREIGN_AGENTS/06_LIVING/run.py

def integrate_sovereign():
    """Add this to the top of run.py"""

    import sys
    from pathlib import Path

    # Add Neural Overlay to path
    neural_path = Path(__file__).parent.parent.parent / "NEURAL_OVERLAY"
    sys.path.insert(0, str(neural_path))

    # Enable with one line
    from minimal_hook import enable_neural, track_execution, remember_pattern
    enable_neural("sovereign_memory.jsonl")

    # Then in your execute functions:
    async def execute_task(task):
        start = time.time()

        # Check for remembered patterns
        from minimal_hook import get_recommendation
        recommendation = get_recommendation(task.name)
        if recommendation:
            print(f"💡 {recommendation}")

        try:
            result = await original_execute(task)

            # Track success
            track_execution(f"sovereign_{task.name}", True, time.time() - start)

            # Remember if particularly good
            if result.quality_score > 0.9:
                remember_pattern(f"high_quality_{task.name}", {
                    "approach": task.pattern,
                    "score": result.quality_score
                })

            return result

        except Exception as e:
            # Track failure
            track_execution(f"sovereign_{task.name}", False, time.time() - start, str(e))
            raise

# ==========================================
# EXAMPLE 2: Bulk Orchestration Wrapper
# ==========================================
# Create: lbof-orchestration-suite/neural_orchestrator.py

def bulk_orchestration_wrapper():
    """Python wrapper for orchestrator.sh with learning"""

    import subprocess
    import sys
    import json
    from pathlib import Path

    # Enable neural
    sys.path.insert(0, "../NEURAL_OVERLAY")
    from minimal_hook import enable_neural, track_execution, remember_pattern

    enable_neural("bulk_memory.jsonl")

    # Run orchestrator
    project_name = sys.argv[1] if len(sys.argv) > 1 else "default"

    # Check if we have patterns for this project type
    from minimal_hook import get_recommendation
    rec = get_recommendation(f"bulk_{project_name}")
    if rec:
        print(f"Based on previous runs: {rec}")

    # Execute
    start = time.time()
    result = subprocess.run(
        ["./orchestrator.sh", project_name],
        capture_output=True,
        text=True
    )

    duration = time.time() - start
    success = result.returncode == 0

    # Track and learn
    track_execution(f"bulk_{project_name}", success, duration)

    if success:
        # Parse output for metrics
        lines_generated = len(result.stdout.splitlines())
        remember_pattern(f"bulk_success_{project_name}", {
            "lines": lines_generated,
            "duration": duration,
            "team_count": 10
        })

        print(f"✅ Generated {lines_generated} lines in {duration:.1f}s")
    else:
        print(f"❌ Failed: {result.stderr[:200]}")

    return result.returncode

# ==========================================
# EXAMPLE 3: LLM Call Wrapper
# ==========================================
# Add to any file using Anthropic

def wrap_llm_calls():
    """Wrap Anthropic calls with caching and tracking"""

    import anthropic
    from minimal_hook import simple_cache, track_execution

    # Cache identical prompts
    @simple_cache("llm_prompt")
    def cached_llm_call(prompt, model="claude-3-sonnet-20240229"):
        client = anthropic.Anthropic()

        start = time.time()
        try:
            response = client.messages.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )

            track_execution(f"llm_{model}", True, time.time() - start)
            return response.content[0].text

        except Exception as e:
            track_execution(f"llm_{model}", False, time.time() - start, str(e))
            raise

    # Use it
    result = cached_llm_call("Explain quantum computing")  # First call: slow
    result = cached_llm_call("Explain quantum computing")  # Second call: instant!

# ==========================================
# EXAMPLE 4: Code Generation with Validation
# ==========================================
# For any code generation system

def validated_code_generation():
    """Generate code with reality validation"""

    from minimal_hook import remember_pattern, track_execution

    def generate_and_validate(spec):
        # Generate code (your existing logic)
        code = generate_code(spec)

        # Validate it actually works
        import subprocess
        import tempfile

        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name

        # Try to run it
        start = time.time()
        result = subprocess.run(
            ["python", "-m", "py_compile", temp_file],
            capture_output=True
        )

        valid = result.returncode == 0
        track_execution("code_validation", valid, time.time() - start)

        if valid:
            # Remember this pattern worked
            remember_pattern(f"valid_code_{spec[:50]}", {
                "spec": spec,
                "code_snippet": code[:200]
            })
            print("✅ Generated code is valid Python")
        else:
            print(f"❌ Code validation failed: {result.stderr}")

        return code, valid

# ==========================================
# EXAMPLE 5: Custom System Integration
# ==========================================
# Generic pattern for any system

def generic_integration_pattern():
    """Template for integrating ANY system"""

    # Step 1: Enable at startup
    from pathlib import Path
    import sys
    sys.path.insert(0, str(Path(__file__).parent / "NEURAL_OVERLAY"))
    from minimal_hook import enable_neural
    enable_neural()

    # Step 2: Track important operations
    from minimal_hook import track_execution

    class YourSystem:
        def important_method(self, *args):
            start = time.time()
            try:
                result = self._do_work(*args)
                track_execution("important_method", True, time.time() - start)
                return result
            except Exception as e:
                track_execution("important_method", False, time.time() - start, str(e))
                raise

    # Step 3: Remember successful patterns
    from minimal_hook import remember_pattern

    def on_success(pattern_name, data):
        remember_pattern(pattern_name, data)

    # Step 4: Use recommendations
    from minimal_hook import get_recommendation

    def before_execution(task_type):
        rec = get_recommendation(task_type)
        if rec:
            print(f"Suggestion: {rec}")
            # Potentially modify approach based on recommendation

# ==========================================
# EXAMPLE 6: Gradual Rollout
# ==========================================

def gradual_rollout():
    """Enable Neural Overlay only for certain users/conditions"""

    import os

    # Enable based on environment variable
    if os.getenv("NEURAL_ENABLED") == "true":
        from minimal_hook import enable_neural
        enable_neural()
        print("🧠 Neural learning enabled for this session")

    # Or enable based on command line flag
    import sys
    if "--neural" in sys.argv:
        from minimal_hook import enable_neural
        enable_neural()
        sys.argv.remove("--neural")  # Remove so it doesn't interfere

    # Or enable for specific users
    if os.getenv("USER") in ["poweruser1", "poweruser2"]:
        from minimal_hook import enable_neural
        enable_neural()

# ==========================================
# THE SIMPLEST POSSIBLE INTEGRATION
# ==========================================

def absolute_minimum():
    """The absolute minimum to get value"""

    # Just add these 3 lines to ANY Python file:
    import sys; sys.path.insert(0, "../NEURAL_OVERLAY")
    from minimal_hook import enable_neural
    enable_neural()

    # That's it! Now it tracks and learns automatically
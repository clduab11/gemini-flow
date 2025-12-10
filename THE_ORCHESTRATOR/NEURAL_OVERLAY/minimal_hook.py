"""
MINIMAL NEURAL HOOK - One line integration
"""

import atexit
import json
import time
import functools
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

# Global state
_neural_state = {
    "enabled": False,
    "start_time": None,
    "memory_cache": {},
    "execution_count": 0,
    "total_cost": 0.0,
    "patterns_seen": {},
    "session_id": None
}

def enable_neural(memory_file: str = "neural_memory.jsonl"):
    """
    Enable neural overlay with ONE line of code.
    Add this to ANY Python script to get learning.
    """
    global _neural_state

    if _neural_state["enabled"]:
        return  # Already enabled

    _neural_state["enabled"] = True
    _neural_state["start_time"] = time.time()
    _neural_state["session_id"] = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Create memory file if not exists
    memory_path = Path(memory_file)
    memory_path.touch(exist_ok=True)

    # Load previous memories
    if memory_path.stat().st_size > 0:
        with open(memory_path, 'r') as f:
            for line in f:
                try:
                    memory = json.loads(line)
                    key = memory.get("pattern_key", "unknown")
                    _neural_state["memory_cache"][key] = memory
                except:
                    pass

    # Hook into functions
    _monkey_patch_common_functions()

    # Save on exit
    atexit.register(lambda: _save_session(memory_file))

    print(f"🧠 Neural Overlay ACTIVE (Session: {_neural_state['session_id']})")
    if _neural_state["memory_cache"]:
        print(f"  📊 Loaded {len(_neural_state['memory_cache'])} memories from previous runs")

def _monkey_patch_common_functions():
    """Hook into common orchestration patterns"""

    # Try to patch common patterns if they exist
    import sys

    # Hook into anthropic if it exists
    try:
        import anthropic
        original_create = anthropic.Anthropic.messages.create

        def tracked_create(self, *args, **kwargs):
            start = time.time()
            result = original_create(self, *args, **kwargs)
            elapsed = time.time() - start

            # Track the call
            _neural_state["execution_count"] += 1
            _neural_state["total_cost"] += 0.01  # Estimate

            # Learn from response time
            if elapsed > 10:
                print(f"  ⚠️ Slow API call: {elapsed:.1f}s")

            return result

        anthropic.Anthropic.messages.create = tracked_create
    except:
        pass

def remember_pattern(pattern_key: str, data: Dict[str, Any]) -> Optional[Dict]:
    """
    Remember a pattern for future use.
    Call this when something works well.
    """
    if not _neural_state["enabled"]:
        return None

    # Check if we've seen this before
    if pattern_key in _neural_state["memory_cache"]:
        previous = _neural_state["memory_cache"][pattern_key]
        print(f"  💭 Recalled pattern '{pattern_key}' (used {previous.get('usage_count', 0)} times)")
        previous["usage_count"] = previous.get("usage_count", 0) + 1
        return previous

    # New pattern
    memory = {
        "pattern_key": pattern_key,
        "data": data,
        "timestamp": datetime.now().isoformat(),
        "session_id": _neural_state["session_id"],
        "usage_count": 1
    }

    _neural_state["memory_cache"][pattern_key] = memory
    _neural_state["patterns_seen"][pattern_key] = _neural_state["patterns_seen"].get(pattern_key, 0) + 1

    return memory

def track_execution(func_name: str, success: bool, duration: float, error: str = None):
    """
    Track an execution for learning.
    Call this after important operations.
    """
    if not _neural_state["enabled"]:
        return

    pattern_key = f"{func_name}_{success}"

    # Update pattern statistics
    if pattern_key not in _neural_state["patterns_seen"]:
        _neural_state["patterns_seen"][pattern_key] = {
            "successes": 0,
            "failures": 0,
            "avg_duration": 0
        }

    stats = _neural_state["patterns_seen"][pattern_key]

    if success:
        stats["successes"] += 1
    else:
        stats["failures"] += 1
        if error:
            print(f"  ❌ Failure in {func_name}: {error}")

    # Update average duration
    n = stats["successes"] + stats["failures"]
    stats["avg_duration"] = ((n - 1) * stats["avg_duration"] + duration) / n

    # Learn from patterns
    total = stats["successes"] + stats["failures"]
    if total >= 5:
        success_rate = stats["successes"] / total
        if success_rate < 0.5:
            print(f"  ⚠️ Pattern '{func_name}' has low success rate: {success_rate:.1%}")

def simple_cache(key: str) -> functools.lru_cache:
    """
    Simple decorator to cache expensive operations.
    Use like: @simple_cache("my_operation")
    """
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{key}_{str(args)}_{str(kwargs)}"

            # Check memory
            if cache_key in cache:
                print(f"  ⚡ Using cached result for {key}")
                return cache[cache_key]

            # Execute and cache
            result = func(*args, **kwargs)
            cache[cache_key] = result

            # Also save to neural memory
            remember_pattern(cache_key, {"result": str(result)[:500]})

            return result

        return wrapper
    return decorator

def get_recommendation(task_type: str) -> Optional[str]:
    """
    Get recommendations based on learned patterns.
    """
    if not _neural_state["enabled"]:
        return None

    # Look for patterns matching this task
    relevant_patterns = [
        (k, v) for k, v in _neural_state["patterns_seen"].items()
        if task_type.lower() in k.lower()
    ]

    if not relevant_patterns:
        return None

    # Find best pattern
    best_pattern = max(
        relevant_patterns,
        key=lambda x: x[1].get("successes", 0) / max(x[1].get("failures", 0) + x[1].get("successes", 0), 1)
    )

    if best_pattern[1]["successes"] > best_pattern[1]["failures"]:
        return f"Use pattern '{best_pattern[0]}' (success rate: {best_pattern[1]['successes']/(best_pattern[1]['successes']+best_pattern[1]['failures']):.1%})"

    return None

def _save_session(memory_file: str):
    """Save session data on exit"""
    if not _neural_state["enabled"]:
        return

    duration = time.time() - _neural_state["start_time"]

    print(f"""
🧠 Neural Overlay Session Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duration: {duration:.1f}s
Executions: {_neural_state['execution_count']}
Patterns Learned: {len(_neural_state['patterns_seen'])}
Estimated Cost: ${_neural_state['total_cost']:.2f}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

    # Save new memories
    with open(memory_file, 'a') as f:
        for pattern_key, memory in _neural_state["memory_cache"].items():
            if memory.get("session_id") == _neural_state["session_id"]:
                f.write(json.dumps(memory) + "\n")

    # Save session summary
    summary = {
        "session_id": _neural_state["session_id"],
        "duration": duration,
        "executions": _neural_state["execution_count"],
        "patterns": _neural_state["patterns_seen"],
        "timestamp": datetime.now().isoformat()
    }

    summary_file = Path(f"neural_session_{_neural_state['session_id']}.json")
    summary_file.write_text(json.dumps(summary, indent=2))

# ============= USAGE EXAMPLES =============

if __name__ == "__main__":
    # Example 1: Basic enable
    enable_neural()

    # Example 2: Track execution
    start = time.time()
    try:
        # Your code here
        result = "success"
        track_execution("example_function", True, time.time() - start)
    except Exception as e:
        track_execution("example_function", False, time.time() - start, str(e))

    # Example 3: Remember pattern
    remember_pattern("seo_optimization", {"keywords": ["test", "demo"], "score": 0.95})

    # Example 4: Get recommendation
    recommendation = get_recommendation("seo")
    if recommendation:
        print(f"Recommendation: {recommendation}")

    # Example 5: Use cache decorator
    @simple_cache("expensive_operation")
    def expensive_operation(x):
        time.sleep(2)  # Simulate expensive operation
        return x * 2

    print(expensive_operation(5))  # Slow first time
    print(expensive_operation(5))  # Fast second time (cached)
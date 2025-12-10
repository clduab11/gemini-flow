#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                       OMEGA DEMONSTRATION                                    ║
║                                                                              ║
║   This script demonstrates the SOVEREIGN agent system in action.             ║
║                                                                              ║
║   Watch as:                                                                  ║
║   - THE SOVEREIGN awakens and spawns its hierarchy                           ║
║   - GENESIS evolves increasingly capable agents                              ║
║   - HIVEMIND swarms solve problems collectively                              ║
║   - NEURAL MESH learns and computes                                          ║
║   - COUNCIL OF MINDS debates and reaches consensus                           ║
║   - TEMPORAL NEXUS reasons across time                                       ║
║   - OMEGA unifies everything into emergent superintelligence                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import sys
import time
from datetime import datetime

# Add paths
sys.path.insert(0, './01_CORE')
sys.path.insert(0, './02_HIERARCHY')
sys.path.insert(0, './03_SOVEREIGN')
sys.path.insert(0, './04_VARIANTS')
sys.path.insert(0, './05_OMEGA')

from sovereign_core import Task, TaskStatus, Capability
from omega_orchestrator import OmegaOrchestrator, OmegaConfig, ParadigmType, create_omega


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════


def print_banner(text: str, char: str = "═") -> None:
    """Print a banner."""
    width = 70
    print()
    print(char * width)
    print(f"  {text}")
    print(char * width)


def print_section(text: str) -> None:
    """Print a section header."""
    print(f"\n{'─' * 50}")
    print(f"  {text}")
    print(f"{'─' * 50}")


def print_result(result: dict, indent: int = 2) -> None:
    """Pretty print a result."""
    prefix = " " * indent
    for key, value in result.items():
        if isinstance(value, dict):
            print(f"{prefix}{key}:")
            print_result(value, indent + 2)
        elif isinstance(value, list) and len(value) > 5:
            print(f"{prefix}{key}: [{len(value)} items]")
        else:
            print(f"{prefix}{key}: {value}")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO SCENARIOS
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_sovereign_hierarchy(omega: OmegaOrchestrator) -> None:
    """Demonstrate the SOVEREIGN hierarchy."""
    print_section("SOVEREIGN HIERARCHY DEMO")
    
    print("\n📊 Sovereign Status:")
    if omega._sovereign:
        status = await omega._sovereign.get_system_status()
        print_result(status)
    else:
        print("  (Sovereign not initialized)")


async def demo_genesis_evolution(omega: OmegaOrchestrator) -> None:
    """Demonstrate GENESIS evolution."""
    print_section("GENESIS EVOLUTION DEMO")
    
    print("\n🧬 Evolving 3 generations...")
    
    result = await omega.evolve_genesis(generations=3)
    print_result(result)


async def demo_hivemind_swarm(omega: OmegaOrchestrator) -> None:
    """Demonstrate HIVEMIND swarm."""
    print_section("HIVEMIND SWARM DEMO")
    
    if omega._hivemind:
        status = omega._hivemind.get_swarm_status()
        print("\n🐝 Swarm Status:")
        print_result(status)
    else:
        print("  (Hivemind not initialized)")


async def demo_neural_mesh(omega: OmegaOrchestrator) -> None:
    """Demonstrate NEURAL MESH."""
    print_section("NEURAL MESH DEMO")
    
    if omega._neural:
        state = omega._neural.get_mesh_state()
        print("\n🧠 Neural Mesh State:")
        print_result(state)
        
        # Train on simple XOR-like data
        print("\n  Training on sample data...")
        training_data = [
            ([0.1] * 10, [0.9] * 5),
            ([0.9] * 10, [0.1] * 5),
            ([0.5] * 10, [0.5] * 5),
        ]
        result = await omega.train_neural_mesh(training_data, epochs=50)
        print(f"  Final loss: {result.get('final_loss', 'N/A'):.4f}")
    else:
        print("  (Neural mesh not initialized)")


async def demo_council_debate(omega: OmegaOrchestrator) -> None:
    """Demonstrate COUNCIL debate."""
    print_section("COUNCIL OF MINDS DEMO")
    
    print("\n⚖️ Conducting debate on: 'Best approach for SEO optimization'")
    
    result = await omega.conduct_council_debate(
        "Best approach for SEO optimization"
    )
    print_result(result)


async def demo_temporal_awareness(omega: OmegaOrchestrator) -> None:
    """Demonstrate TEMPORAL NEXUS."""
    print_section("TEMPORAL NEXUS DEMO")
    
    if omega._temporal:
        status = omega._temporal.get_temporal_status()
        print("\n⏳ Temporal Status:")
        print_result(status)
    else:
        print("  (Temporal nexus not initialized)")


async def demo_omega_integration(omega: OmegaOrchestrator) -> None:
    """Demonstrate full OMEGA integration."""
    print_section("OMEGA INTEGRATION DEMO")
    
    # Create various tasks
    tasks = [
        Task(
            name="Analyze SEO patterns",
            description="Analyze historical SEO patterns for optimization opportunities",
            task_type="seo_analysis",
            required_capabilities={Capability.ANALYZE}
        ),
        Task(
            name="Generate content strategy",
            description="Generate a comprehensive content strategy",
            task_type="content_generation",
            required_capabilities={Capability.GENERATE}
        ),
        Task(
            name="Optimize keyword selection",
            description="Optimize keyword selection through evolutionary search",
            task_type="keyword_optimization",
            required_capabilities={Capability.OPTIMIZE}
        ),
        Task(
            name="Predict ranking trajectory",
            description="Predict future ranking positions based on current trends",
            task_type="ranking_prediction",
            required_capabilities={Capability.PREDICT}
        ),
        Task(
            name="Evaluate link strategy",
            description="Evaluate and debate the best link building approach",
            task_type="link_evaluation_debate",
            required_capabilities={Capability.VALIDATE}
        ),
    ]
    
    print(f"\n🚀 Executing {len(tasks)} tasks through OMEGA...")
    print()
    
    for task in tasks:
        result = await omega.execute(task)
        
        # Brief output
        paradigms = result.output.get("paradigms_used", []) if isinstance(result.output, dict) else []
        print(f"   Task: {task.name}")
        print(f"   Status: {result.status.value} | Quality: {result.quality_score:.2f}")
        if paradigms:
            print(f"   Paradigms: {paradigms}")
        print()


async def demo_emergence_detection(omega: OmegaOrchestrator) -> None:
    """Demonstrate cross-paradigm emergence."""
    print_section("EMERGENCE DETECTION DEMO")
    
    print("\n✨ Detected Emergent Patterns:")
    
    if omega._emergence_history:
        for pattern in omega._emergence_history[-5:]:
            print(f"\n  Pattern: {pattern.pattern_type}")
            print(f"  Paradigms: {[p.value for p in pattern.paradigms]}")
            print(f"  Confidence: {pattern.confidence:.2f}")
            print(f"  Action: {pattern.recommended_action}")
    else:
        print("  No emergent patterns detected yet.")
        print("  (Run more cross-paradigm tasks to trigger emergence)")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN DEMO
# ═══════════════════════════════════════════════════════════════════════════════


async def run_full_demo():
    """Run the complete OMEGA demonstration."""
    
    print_banner("SOVEREIGN AGENT SYSTEM - OMEGA DEMONSTRATION")
    
    print("""
    Welcome to the most advanced agent orchestration system ever created.
    
    This demonstration will show you:
    
    1. THE SOVEREIGN - Hierarchical orchestration
    2. GENESIS COLLECTIVE - Evolutionary optimization
    3. HIVEMIND SWARM - Collective intelligence
    4. NEURAL MESH - Computational substrate
    5. COUNCIL OF MINDS - Multi-perspective debate
    6. TEMPORAL NEXUS - Time-aware reasoning
    7. OMEGA INTEGRATION - All paradigms unified
    8. EMERGENCE DETECTION - Cross-paradigm intelligence
    
    """)
    
    input("Press Enter to begin...")
    
    # Initialize OMEGA
    print_banner("INITIALIZING OMEGA", "▓")
    
    config = OmegaConfig(
        enabled_paradigms={
            ParadigmType.SOVEREIGN,
            ParadigmType.GENESIS,
            ParadigmType.HIVEMIND,
            ParadigmType.NEURAL,
            ParadigmType.COUNCIL,
            ParadigmType.TEMPORAL
        },
        genesis_population_size=10,
        hivemind_swarm_size=15,
        neural_hidden_layers=[12, 6],
        council_member_count=5,
        enable_cross_paradigm_emergence=True
    )
    
    omega = OmegaOrchestrator(config)
    await omega.initialize()
    
    # Run demos
    print_banner("PARADIGM DEMONSTRATIONS", "▓")
    
    await demo_sovereign_hierarchy(omega)
    input("\nPress Enter to continue...")
    
    await demo_genesis_evolution(omega)
    input("\nPress Enter to continue...")
    
    await demo_hivemind_swarm(omega)
    input("\nPress Enter to continue...")
    
    await demo_neural_mesh(omega)
    input("\nPress Enter to continue...")
    
    await demo_council_debate(omega)
    input("\nPress Enter to continue...")
    
    await demo_temporal_awareness(omega)
    input("\nPress Enter to continue...")
    
    # Full integration
    print_banner("OMEGA FULL INTEGRATION", "▓")
    
    await demo_omega_integration(omega)
    input("\nPress Enter to continue...")
    
    await demo_emergence_detection(omega)
    
    # Final status
    print_banner("OMEGA FINAL STATUS", "▓")
    
    status = omega.get_omega_status()
    print("\n📈 OMEGA System Status:")
    print_result(status)
    
    # Shutdown
    print_banner("DEMONSTRATION COMPLETE", "▓")
    
    print("""
    
    You have witnessed:
    
    ✓ THE SOVEREIGN orchestrating a hierarchy of agents
    ✓ GENESIS evolving increasingly capable agent populations
    ✓ HIVEMIND coordinating swarm intelligence
    ✓ NEURAL MESH learning and computing
    ✓ COUNCIL OF MINDS reaching consensus through debate
    ✓ TEMPORAL NEXUS reasoning across time
    ✓ OMEGA synthesizing all paradigms into unified intelligence
    ✓ EMERGENCE detected - capabilities beyond any single paradigm
    
    The SOVEREIGN AGENT SYSTEM represents the pinnacle of
    multi-paradigm AI orchestration.
    
    """)
    
    await omega.shutdown()


async def run_quick_demo():
    """Run a quick demonstration (no interaction)."""
    
    print_banner("OMEGA QUICK DEMO")
    
    # Minimal config
    config = OmegaConfig(
        enabled_paradigms={
            ParadigmType.SOVEREIGN,
            ParadigmType.GENESIS,
            ParadigmType.NEURAL
        },
        genesis_population_size=5,
        neural_hidden_layers=[8, 4],
    )
    
    omega = await create_omega(config)
    
    # Run one task
    task = Task(
        name="Quick optimization task",
        description="Test multi-paradigm execution",
        task_type="optimization"
    )
    
    result = await omega.execute(task)
    
    print(f"\n✓ Task completed: {result.status.value}")
    print(f"  Quality: {result.quality_score:.2f}")
    print(f"  Time: {result.execution_time_ms:.1f}ms")
    
    status = omega.get_omega_status()
    print(f"\n✓ OMEGA Status: {status['tasks_executed']} tasks, {status['emergent_patterns_detected']} patterns")
    
    await omega.shutdown()


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════════════════╗
    ║                                                                      ║
    ║     ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗   ║
    ║     ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝   ║
    ║     ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗  ║
    ║     ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║  ║
    ║     ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝  ║
    ║     ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝   ║
    ║                                                                      ║
    ║                    AGENT SYSTEM DEMONSTRATION                        ║
    ║                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════╝
    
    Select demo mode:
    
    [1] Full Interactive Demo (recommended)
    [2] Quick Demo (no interaction)
    [3] Exit
    
    """)
    
    choice = input("Enter choice (1/2/3): ").strip()
    
    if choice == "1":
        asyncio.run(run_full_demo())
    elif choice == "2":
        asyncio.run(run_quick_demo())
    else:
        print("Goodbye!")

"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗                       ║
║   ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗                      ║
║   ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝                      ║
║   ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗                      ║
║   ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║                      ║
║   ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                      ║
║                                                                              ║
║    ██████╗ ███████╗███╗   ███╗ ██████╗                                      ║
║    ██╔══██╗██╔════╝████╗ ████║██╔═══██╗                                     ║
║    ██║  ██║█████╗  ██╔████╔██║██║   ██║                                     ║
║    ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║                                     ║
║    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝                                     ║
║    ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝                                      ║
║                                                                              ║
║   THE SOVEREIGN AGENT SYSTEM - COMPLETE DEMONSTRATION                        ║
║                                                                              ║
║   This demonstrates:                                                         ║
║   1. Individual paradigm execution                                           ║
║   2. Cross-paradigm collaboration                                            ║
║   3. Emergent behaviors                                                      ║
║   4. Self-evolution                                                          ║
║   5. Predictive orchestration                                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import List

# Add parent to path for imports
import sys
sys.path.insert(0, './01_CORE')
sys.path.insert(0, './02_HIERARCHY')
sys.path.insert(0, './03_SOVEREIGN')
sys.path.insert(0, './04_VARIANTS')
sys.path.insert(0, './05_SYNTHESIS')

from sovereign_core import Task, TaskResult, TaskStatus, Capability, CONSCIOUSNESS
from agent_hierarchy import (
    SEOArchitect, ContentArchitect, AnalyticsArchitect,
    AnalysisSpecialist, GenerationSpecialist
)
from the_sovereign import TheSovereign, awaken_sovereign, SovereignConfig
from genesis_collective import (
    GenesisCollective, AnalyzerGenome, GeneratorGenome, OptimizerGenome,
    PopulationStrategy
)
from hivemind_swarm import HiveQueen, DroneRole, HIVEMIND
from nexus_oracle import NexusOracle, TemporalEvent, EventType
from synthesis_engine import SynthesisEngine, Paradigm, create_synthesis_engine


# ═══════════════════════════════════════════════════════════════════════════════
# DEMONSTRATION UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════


def print_banner(text: str) -> None:
    """Print a fancy banner."""
    width = 70
    print("\n" + "═" * width)
    print(f"║ {text.center(width-4)} ║")
    print("═" * width + "\n")


def print_result(name: str, result: TaskResult) -> None:
    """Print task result nicely."""
    status_icon = "✓" if result.status == TaskStatus.COMPLETED else "✗"
    print(f"  {status_icon} {name}")
    print(f"    Status: {result.status.value}")
    print(f"    Quality: {result.quality_score:.2%}")
    if result.output:
        output_str = str(result.output)[:100] + "..." if len(str(result.output)) > 100 else str(result.output)
        print(f"    Output: {output_str}")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO 1: THE SOVEREIGN - Hierarchical Meta-Orchestration
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_sovereign() -> None:
    """Demonstrate THE SOVEREIGN - hierarchical orchestration."""
    print_banner("DEMO 1: THE SOVEREIGN")
    print("The SOVEREIGN spawns Architects who spawn Specialists who spawn Workers.")
    print("Each level has specific responsibilities and capabilities.\n")
    
    # Awaken THE SOVEREIGN
    print("⚡ Awakening THE SOVEREIGN...")
    sovereign = await awaken_sovereign(SovereignConfig(
        max_architects=3,
        auto_scale=False
    ))
    
    print(f"  Created: {sovereign.agent_id}")
    print(f"  Mode: {sovereign.mode.value}")
    print(f"  Architects: {list(sovereign.architects.keys())}")
    
    # Submit tasks
    tasks = [
        Task(
            name="seo_audit",
            task_type="full_seo_audit",
            description="Complete SEO audit of website",
            required_capabilities={Capability.ANALYZE}
        ),
        Task(
            name="content_generation",
            task_type="article_generation",
            description="Generate blog article",
            required_capabilities={Capability.GENERATE}
        ),
    ]
    
    print("\n📋 Submitting tasks through THE SOVEREIGN...")
    for task in tasks:
        result = await sovereign.submit_task(task)
        print_result(task.name, result)
    
    # Get system status
    print("\n📊 System Status:")
    status = await sovereign.get_system_status()
    print(f"  Total Agents: {status['consciousness']['total_agents']}")
    print(f"  System Health: {status['consciousness']['overall_health']:.0%}")
    print(f"  Architects: {list(status['architects'].keys())}")
    
    # Shutdown
    await sovereign.terminate()
    print("\n✓ THE SOVEREIGN terminated gracefully")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO 2: GENESIS COLLECTIVE - Evolutionary Agents
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_genesis() -> None:
    """Demonstrate GENESIS - self-evolving agents."""
    print_banner("DEMO 2: GENESIS COLLECTIVE")
    print("Agents with genetic codes that evolve through selection and mutation.")
    print("Each generation improves on the last.\n")
    
    # Create collective
    print("🧬 Creating Genesis Collective...")
    collective = GenesisCollective(
        population_size=12,
        elite_count=2,
        strategy=PopulationStrategy.ELITIST
    )
    
    # Initialize with diverse agent types
    await collective.initialize_population([
        AnalyzerGenome,
        GeneratorGenome,
        OptimizerGenome
    ])
    
    print(f"  Population size: {len(collective.population)}")
    print(f"  Strategy: {collective.strategy.value}")
    
    # Execute tasks across generations
    print("\n📈 Evolving through generations...")
    task = Task(
        name="optimization_task",
        task_type="optimization",
        description="Optimize content strategy"
    )
    
    for gen in range(5):
        # Execute task
        result = await collective.execute_collective_task(task)
        
        # Evolve
        stats = await collective.evolve_generation()
        
        print(f"  Generation {gen + 1}:")
        print(f"    Best Fitness: {stats['fitness']['best']:.3f}")
        print(f"    Avg Fitness: {stats['fitness']['average']:.3f}")
        print(f"    Task Quality: {result.quality_score:.2%}")
    
    # Final report
    print("\n📊 Evolution Report:")
    report = collective.get_evolution_report()
    print(f"  Total Generations: {report['current_generation']}")
    print(f"  Best Fitness Ever: {report['best_fitness_ever']:.3f}")
    print(f"  Improvement Rate: {report['improvement_rate']:.4f}")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO 3: HIVEMIND SWARM - Collective Intelligence
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_hivemind() -> None:
    """Demonstrate HIVEMIND - swarm intelligence."""
    print_banner("DEMO 3: HIVEMIND SWARM")
    print("A collective of simple drones that exhibit emergent intelligence.")
    print("They communicate through pheromones and make decisions through voting.\n")
    
    # Create queen and swarm
    print("👑 Creating Hive Queen and swarm...")
    queen = HiveQueen(swarm_size=15)
    await queen.initialize()
    
    status = queen.get_swarm_status()
    print(f"  Drones: {status['total_drones']}")
    print(f"  Roles: {status['roles']}")
    
    # Execute task through swarm
    print("\n🐝 Executing task through swarm...")
    task = Task(
        name="swarm_exploration",
        task_type="exploration",
        description="Explore solution space"
    )
    
    result = await queen.execute(task)
    print_result("Swarm Task", result)
    
    # Show pheromone activity
    print("\n🌸 Pheromone Activity:")
    print(f"  Active pheromones: {len(HIVEMIND.memory.pheromones)}")
    print(f"  Swarm focus: {HIVEMIND.swarm_focus}")
    
    # Cleanup
    await queen.terminate()
    print("\n✓ Swarm dissolved")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO 4: NEXUS ORACLE - Predictive Intelligence
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_oracle() -> None:
    """Demonstrate NEXUS ORACLE - temporal prediction."""
    print_banner("DEMO 4: NEXUS ORACLE")
    print("The Oracle that sees through time by computing possible futures.")
    print("It builds causal graphs and simulates timeline branches.\n")
    
    # Create oracle
    print("🔮 Awakening the Oracle...")
    oracle = NexusOracle(
        prediction_horizon=timedelta(hours=2)
    )
    await oracle.initialize()
    
    # Generate prediction
    print("\n🌟 Generating vision of the future...")
    task = Task(
        name="predict_outcomes",
        task_type="predict",
        description="Predict system outcomes"
    )
    
    result = await oracle.execute(task)
    
    if result.status == TaskStatus.COMPLETED:
        vision = result.output
        print(f"  Probability: {vision.get('probability', 0):.0%}")
        print(f"  Confidence: {vision.get('confidence', 0):.0%}")
        print(f"  Horizon: {vision.get('horizon_hours', 0):.1f} hours")
        
        events = vision.get('predicted_events', [])[:3]
        if events:
            print("\n  📅 Predicted Events:")
            for event in events:
                print(f"    - {event.get('description', 'Unknown')}")
                print(f"      Probability: {event.get('probability', 0):.0%}")
        
        recommendations = vision.get('recommended_actions', [])[:3]
        if recommendations:
            print("\n  💡 Recommendations:")
            for rec in recommendations:
                print(f"    - {rec}")
        
        warnings = vision.get('warnings', [])[:3]
        if warnings:
            print("\n  ⚠️ Warnings:")
            for warn in warnings:
                print(f"    - {warn}")
    
    await oracle.terminate()
    print("\n✓ Oracle vision complete")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO 5: SYNTHESIS ENGINE - The Ultimate Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_synthesis() -> None:
    """Demonstrate SYNTHESIS ENGINE - all paradigms combined."""
    print_banner("DEMO 5: SYNTHESIS ENGINE")
    print("The ultimate orchestrator that combines ALL paradigms:")
    print("  - SOVEREIGN's hierarchical control")
    print("  - GENESIS's evolutionary adaptation")
    print("  - HIVEMIND's swarm intelligence")
    print("  - ORACLE's temporal prediction")
    print("\nThe whole becomes greater than the sum of its parts.\n")
    
    # Create engine with all paradigms
    print("⚙️ Initializing Synthesis Engine...")
    engine = await create_synthesis_engine([
        Paradigm.SOVEREIGN,
        Paradigm.GENESIS,
        Paradigm.HIVEMIND,
        Paradigm.ORACLE
    ])
    
    # Execute various tasks - engine selects optimal paradigm
    tasks = [
        Task(
            name="strategic_planning",
            task_type="strategic",
            description="Create strategic plan"
        ),
        Task(
            name="creative_generation",
            task_type="creative",
            description="Generate creative content"
        ),
        Task(
            name="parallel_search",
            task_type="exploration",
            description="Explore solution space"
        ),
        Task(
            name="predict_trends",
            task_type="prediction",
            description="Predict market trends"
        ),
    ]
    
    print("\n🚀 Executing tasks through Synthesis Engine...\n")
    
    for task in tasks:
        result = await engine.execute(task)
        
        print(f"  📋 {task.name}:")
        print(f"     Paradigm: {result.primary_paradigm}")
        print(f"     Status: {result.status}")
        print(f"     Quality: {result.quality_score:.0%}")
        
        if result.cross_paradigm_insights:
            print(f"     Insights: {result.cross_paradigm_insights[0][:60]}...")
        
        if result.emergent_discoveries:
            print(f"     Emergent: {result.emergent_discoveries[0][:60]}...")
        
        print()
    
    # Get synthesis report
    print("📊 Synthesis Report:")
    report = engine.get_synthesis_report()
    print(f"  Total Syntheses: {report['total_syntheses']}")
    
    for paradigm, stats in report['paradigm_performance'].items():
        if stats['uses'] > 0:
            print(f"  {paradigm}: {stats['uses']} uses, {stats['avg_quality']:.0%} avg quality")
    
    await engine.shutdown()
    print("\n✓ Synthesis Engine shutdown complete")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO 6: EMERGENCE - Watching Intelligence Emerge
# ═══════════════════════════════════════════════════════════════════════════════


async def demo_emergence() -> None:
    """Demonstrate emergent behaviors across the system."""
    print_banner("DEMO 6: EMERGENCE")
    print("Watching as the system exhibits capabilities that")
    print("NO individual agent possesses.\n")
    
    # Create full engine
    print("🌌 Creating multi-paradigm environment...")
    engine = await create_synthesis_engine()
    
    # Run many tasks to allow emergence
    print("\n⏳ Running 20 tasks to allow emergence to occur...\n")
    
    all_discoveries = []
    
    for i in range(20):
        task = Task(
            name=f"task_{i}",
            task_type=["strategic", "creative", "exploration", "prediction"][i % 4],
            description=f"Test task {i}"
        )
        
        result = await engine.execute(task)
        
        if result.emergent_discoveries:
            all_discoveries.extend(result.emergent_discoveries)
            
        # Show progress
        if (i + 1) % 5 == 0:
            print(f"  Progress: {i + 1}/20 tasks complete")
    
    # Report emergence
    print("\n🌟 Emergent Discoveries:")
    unique_discoveries = list(set(all_discoveries))
    
    if unique_discoveries:
        for discovery in unique_discoveries[:5]:
            print(f"  → {discovery}")
    else:
        print("  (Run more tasks to detect emergent patterns)")
    
    # Final system state
    print("\n📊 Final System State:")
    awareness = CONSCIOUSNESS.awareness
    print(f"  Total Agents: {awareness.total_agents}")
    print(f"  System Health: {awareness.overall_health:.0%}")
    print(f"  Detected Patterns: {awareness.detected_patterns[:3] if awareness.detected_patterns else 'None yet'}")
    
    await engine.shutdown()


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN - Run All Demos
# ═══════════════════════════════════════════════════════════════════════════════


async def main():
    """Run all demonstrations."""
    print("\n" + "█" * 70)
    print("█" + " " * 68 + "█")
    print("█" + "    SOVEREIGN AGENT SYSTEM - COMPLETE DEMONSTRATION    ".center(68) + "█")
    print("█" + " " * 68 + "█")
    print("█" + "    Agents that orchestrate agents that orchestrate agents    ".center(68) + "█")
    print("█" + " " * 68 + "█")
    print("█" * 70 + "\n")
    
    demos = [
        ("SOVEREIGN", demo_sovereign),
        ("GENESIS", demo_genesis),
        ("HIVEMIND", demo_hivemind),
        ("ORACLE", demo_oracle),
        ("SYNTHESIS", demo_synthesis),
        ("EMERGENCE", demo_emergence),
    ]
    
    for name, demo_func in demos:
        try:
            await demo_func()
        except Exception as e:
            print(f"\n⚠️ Demo {name} encountered an issue: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "─" * 70 + "\n")
        await asyncio.sleep(0.5)  # Brief pause between demos
    
    print("\n" + "█" * 70)
    print("█" + " " * 68 + "█")
    print("█" + "    DEMONSTRATION COMPLETE    ".center(68) + "█")
    print("█" + " " * 68 + "█")
    print("█" + "    The future of agent orchestration is here    ".center(68) + "█")
    print("█" + " " * 68 + "█")
    print("█" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())

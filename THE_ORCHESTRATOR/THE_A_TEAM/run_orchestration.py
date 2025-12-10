#!/usr/bin/env python3
"""
SEO Intelligence Platform - Bootstrap Orchestration Runner
Generates 45 SEO features (~55,000 LOC) using APEX orchestration
"""

import os
import sys
import asyncio
from pathlib import Path
from typing import Dict, Any, List
import json
from datetime import datetime

# Fix for Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

print("=" * 60)
print(" SEO INTELLIGENCE PLATFORM - BOOTSTRAP ORCHESTRATION")
print(" Generating 45 Features (~55,000 LOC)")
print("=" * 60)


async def run_orchestration():
    """Main orchestration runner."""

    try:
        print("\n[1/5] Loading APEX Orchestration System...")
        from apex_manifestation import awaken_apex, ApexConfig, ApexMode

        print("[2/5] Configuring APEX...")
        config = ApexConfig()
        config.primary_mode = ApexMode.HYBRID
        config.fallback_mode = ApexMode.SOVEREIGN
        # Additional configs can be set here if needed

        print("[3/5] Awakening APEX subsystems...")
        print("  - SOVEREIGN: Strategic orchestration")
        print("  - GENESIS: Evolutionary optimization")
        print("  - HIVEMIND: Swarm intelligence")
        print("  - RECURSIVE: Deep decomposition")
        print("  - NEURAL: Pattern recognition")

        apex = await awaken_apex(config)
        print("  ✓ APEX awakened successfully!")

        print("\n[4/5] Loading Feature Generator...")
        from apex_executor import TitanOrchestrator, FeatureTier

        titan = TitanOrchestrator()
        print(f"  ✓ Loaded TitanOrchestrator with advanced code generation")

        # Create output directory
        output_dir = Path("../Bootstrap/generated")
        output_dir.mkdir(exist_ok=True)

        print(f"\n[5/5] Generating Features...")
        print(f"  Output directory: {output_dir.absolute()}")

        # Generate Tier 1: Priority Features (5 game-changers)
        print("\n>>> TIER 1: Priority Features (5 game-changers)")
        print("-" * 40)
        priority_features = [
            "gap-finder",
            "internal-linking",
            "serp-monitor",
            "rag-briefs",
            "federated-learning"
        ]

        # Generate all features using APEX system
        print(f"  Starting APEX code generation...")
        try:
            results = await titan.generate_all(
                tier_filter=FeatureTier.PRIORITY,
                output_dir=output_dir
            )
            print(f"    ✓ Generated {len(results)} priority features")
        except Exception as e:
            print(f"    ✗ Error generating priority features: {str(e)}")

        # Generate Tier 2: Core SEO Features (15 features)
        print("\n>>> TIER 2: Core SEO Features (15 features)")
        print("-" * 40)
        core_features = [
            "keyword-clustering",
            "content-freshness",
            "multi-language",
            "anchor-risk",
            "link-density",
            "intent-alignment",
            "entity-optimizer",
            "competitor-analysis",
            "serp-features",
            "historical-serp",
            "content-length",
            "topic-authority",
            "duplicate-detector",
            "xai-recommendations",
            "roi-attribution"
        ]

        # Generate Tier 2 using APEX
        try:
            results = await titan.generate_all(
                tier_filter=FeatureTier.CORE,
                output_dir=output_dir
            )
            print(f"    ✓ Generated {len(results)} core features")
        except Exception as e:
            print(f"    ✗ Error generating core features: {str(e)}")

        # Status summary
        print("\n" + "=" * 60)
        print(" GENERATION COMPLETE!")
        print("=" * 60)

        # Get final stats
        status = apex.get_status()

        # Safely access stats with defaults to handle potential async timing issues
        apex_stats = status.get('apex', {})
        tasks_processed = apex_stats.get('tasks_processed', 0)
        success_rate = apex_stats.get('success_rate', 0.0)

        # Safely count active subsystems
        subsystems = status.get('subsystems', {})
        active_subsystems = len([s for s in subsystems.values() if isinstance(s, dict) and s.get('status') == 'active'])

        print(f"\nAPEX Status:")
        print(f"  - Tasks processed: {tasks_processed}")
        print(f"  - Success rate: {success_rate:.1%}")
        print(f"  - Active subsystems: {active_subsystems}/5")

        print(f"\nGenerated files location:")
        print(f"  {output_dir.absolute()}")

        print("\nNext steps:")
        print("  1. Review generated code in ./generated/")
        print("  2. Copy backend modules to backend/src/modules/")
        print("  3. Copy Python services to services/")
        print("  4. Copy frontend components to frontend/features/")

        # Graceful shutdown
        await apex.shutdown()
        print("\n✓ APEX shutdown complete")

    except ImportError as e:
        print(f"\n✗ Import Error: {e}")
        print("\nPlease ensure all dependencies are installed:")
        print("  pip install -r requirements.txt")
        return False

    except Exception as e:
        print(f"\n✗ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True


def main():
    """Entry point."""
    print(f"\nStarting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Run the async orchestration
    success = asyncio.run(run_orchestration())

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if success:
        print("\n✓ Orchestration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Orchestration failed. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
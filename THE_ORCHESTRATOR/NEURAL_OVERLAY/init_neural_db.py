#!/usr/bin/env python3
"""
Initialize Neural Database and Setup
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime

def init_database():
    """Initialize the neural memory database"""

    db_path = "neural_memory.db"
    conn = sqlite3.connect(db_path)

    # Create tables
    tables = [
        '''CREATE TABLE IF NOT EXISTS crystals (
            id TEXT PRIMARY KEY,
            pattern_type TEXT,
            context_hash TEXT,
            data BLOB,
            embedding BLOB,
            usage_count INTEGER DEFAULT 0,
            success_rate REAL DEFAULT 1.0,
            created_at TIMESTAMP,
            last_used TIMESTAMP
        )''',

        '''CREATE TABLE IF NOT EXISTS executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            system TEXT,
            function TEXT,
            pattern TEXT,
            success BOOLEAN,
            cost REAL,
            value REAL,
            error TEXT,
            timestamp TIMESTAMP,
            metadata TEXT
        )''',

        '''CREATE TABLE IF NOT EXISTS learnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern TEXT,
            insight TEXT,
            confidence REAL,
            occurrences INTEGER,
            first_seen TIMESTAMP,
            last_seen TIMESTAMP
        )''',

        '''CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            oracle_id TEXT,
            prediction TEXT,
            confidence REAL,
            predicted_at TIMESTAMP,
            resolved_at TIMESTAMP,
            actual_outcome TEXT,
            accuracy REAL
        )''',

        '''CREATE TABLE IF NOT EXISTS emergent_behaviors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            system TEXT,
            behavior TEXT,
            significance REAL,
            first_observed TIMESTAMP,
            occurrence_count INTEGER
        )''',

        '''CREATE TABLE IF NOT EXISTS cost_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            system TEXT,
            tokens_used INTEGER,
            cost_usd REAL,
            timestamp TIMESTAMP
        )'''''
    ]

    for table_sql in tables:
        conn.execute(table_sql)

    # Create indexes
    indexes = [
        'CREATE INDEX IF NOT EXISTS idx_pattern_type ON crystals(pattern_type)',
        'CREATE INDEX IF NOT EXISTS idx_success_rate ON crystals(success_rate)',
        'CREATE INDEX IF NOT EXISTS idx_system ON executions(system)',
        'CREATE INDEX IF NOT EXISTS idx_success ON executions(success)',
        'CREATE INDEX IF NOT EXISTS idx_pattern ON learnings(pattern)',
        'CREATE INDEX IF NOT EXISTS idx_confidence ON learnings(confidence)',
        'CREATE INDEX IF NOT EXISTS idx_significance ON emergent_behaviors(significance)'
    ]

    for index_sql in indexes:
        conn.execute(index_sql)

    conn.commit()

    # Seed with initial patterns
    seed_patterns(conn)

    conn.close()
    print(f"✅ Neural database initialized at {db_path}")

def seed_patterns(conn):
    """Seed database with known good patterns"""

    initial_patterns = [
        {
            "pattern": "hierarchical",
            "insight": "Best for complex multi-domain tasks with clear decomposition",
            "confidence": 0.85,
            "occurrences": 0
        },
        {
            "pattern": "evolutionary",
            "insight": "Optimal for creative/optimization problems with unclear solutions",
            "confidence": 0.80,
            "occurrences": 0
        },
        {
            "pattern": "swarm",
            "insight": "Efficient for parallel exploration and search tasks",
            "confidence": 0.75,
            "occurrences": 0
        },
        {
            "pattern": "temporal",
            "insight": "Critical for planning under uncertainty and predictive tasks",
            "confidence": 0.70,
            "occurrences": 0
        },
        {
            "pattern": "adversarial",
            "insight": "Improves quality through critique and refinement cycles",
            "confidence": 0.90,
            "occurrences": 0
        }
    ]

    for pattern in initial_patterns:
        conn.execute(
            '''INSERT OR IGNORE INTO learnings
               (pattern, insight, confidence, occurrences, first_seen, last_seen)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (pattern["pattern"], pattern["insight"], pattern["confidence"],
             pattern["occurrences"], datetime.now(), datetime.now())
        )

    print(f"  📝 Seeded {len(initial_patterns)} initial patterns")

def create_config():
    """Create configuration file"""

    config = {
        "neural_overlay": {
            "enabled": True,
            "version": "1.0.0",
            "components": {
                "memory_crystallizer": {"enabled": True, "max_crystals": 10000},
                "reality_bridge": {"enabled": True, "sandbox": True},
                "economics_engine": {
                    "enabled": True,
                    "budget_limit_usd": 100.0,
                    "warning_threshold": 0.8
                },
                "learning_loop": {"enabled": True, "min_occurrences": 3},
                "metacognitive": {"enabled": True, "observation_window": 50}
            },
            "integration": {
                "sovereign_agents": True,
                "genesis_collective": True,
                "hivemind_swarm": True,
                "nexus_oracle": True,
                "bulk_orchestration": True,
                "apex_systems": True
            },
            "thresholds": {
                "min_confidence": 0.7,
                "max_cost_per_execution": 1.0,
                "pattern_switch_threshold": 0.5
            }
        }
    }

    config_path = Path("neural_config.json")
    config_path.write_text(json.dumps(config, indent=2))

    print(f"✅ Configuration created at {config_path}")

def verify_dependencies():
    """Verify all required dependencies are installed"""

    required = ["numpy", "anthropic", "asyncio", "sqlite3"]
    missing = []

    for module in required:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)

    if missing:
        print(f"⚠️ Missing dependencies: {', '.join(missing)}")
        print(f"   Run: pip install {' '.join(missing)}")
        return False

    print("✅ All dependencies verified")
    return True

def main():
    """Main initialization"""

    print("🧠 NEURAL OVERLAY INITIALIZATION")
    print("=" * 50)

    # Verify dependencies
    if not verify_dependencies():
        return

    # Initialize database
    init_database()

    # Create config
    create_config()

    # Create directories
    Path("logs").mkdir(exist_ok=True)
    Path("cache").mkdir(exist_ok=True)
    Path("exports").mkdir(exist_ok=True)

    print("\n" + "=" * 50)
    print("✅ NEURAL OVERLAY READY TO ACTIVATE!")
    print("\nNext steps:")
    print("1. Run: python neural_daemon.py")
    print("2. Your existing systems will automatically integrate")
    print("3. Watch as they become smarter with each execution!")

if __name__ == "__main__":
    main()
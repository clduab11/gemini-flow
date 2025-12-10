#!/usr/bin/env python3
"""
GENESIS PRIME V2 - Works in both standalone and integrated mode
"""

import os
import sys
from pathlib import Path

# Intelligent path detection
FACTORY_ROOT = Path(__file__).parent.parent
LIB_PATH = FACTORY_ROOT / "lib"
ORCHESTRATOR_PATH = FACTORY_ROOT.parent / "THE_ORCHESTRATOR"

# Check if running in standalone mode
if LIB_PATH.exists() and (LIB_PATH / "SOVEREIGN_AGENTS").exists():
    print("🏭 Running in STANDALONE mode (using lib/)")
    sys.path.insert(0, str(LIB_PATH))
    STANDALONE_MODE = True
elif ORCHESTRATOR_PATH.exists():
    print("🏭 Running in INTEGRATED mode (using THE_ORCHESTRATOR)")
    sys.path.insert(0, str(ORCHESTRATOR_PATH))
    STANDALONE_MODE = False
else:
    print("⚠️ Warning: No dependencies found. Please run make_standalone.py or ensure THE_ORCHESTRATOR exists")
    STANDALONE_MODE = False

# Now import everything else from original genesis_prime
from genesis_prime import *

if __name__ == "__main__":
    main()
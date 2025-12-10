#!/usr/bin/env python3
"""
ONE-CLICK NEURAL OVERLAY ACTIVATION

This script activates the Neural Overlay System across your entire codebase.
Run this ONCE and all your systems become self-learning and self-improving.
"""

import subprocess
import sys
import os
from pathlib import Path

def print_banner():
    print("""
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║         🧠 NEURAL OVERLAY ACTIVATION SEQUENCE 🧠                ║
    ║                                                                  ║
    ║     Transform your orchestrators from one-shot wonders          ║
    ║     into a self-learning, self-improving superintelligence      ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    """)

def check_requirements():
    """Check if requirements are installed"""
    print("📦 Checking requirements...")

    try:
        import anthropic
        print("  ✅ anthropic installed")
    except ImportError:
        print("  ❌ anthropic not installed")
        print("     Run: pip install anthropic")
        return False

    try:
        import numpy
        print("  ✅ numpy installed")
    except ImportError:
        print("  ❌ numpy not installed")
        print("     Run: pip install numpy")
        return False

    return True

def setup_neural_overlay():
    """Setup the neural overlay system"""

    print("\n🔧 Setting up Neural Overlay...")

    # Change to neural directory
    neural_dir = Path(__file__).parent / "NEURAL_OVERLAY"
    os.chdir(neural_dir)

    # Initialize database
    print("  📊 Initializing neural database...")
    result = subprocess.run([sys.executable, "init_neural_db.py"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ❌ Database init failed: {result.stderr}")
        return False

    print("  ✅ Database initialized")

    return True

def start_daemon():
    """Start the neural daemon"""
    print("\n🚀 Starting Neural Daemon...")

    neural_dir = Path(__file__).parent / "NEURAL_OVERLAY"
    daemon_script = neural_dir / "neural_daemon.py"

    # Start as background process
    if sys.platform == "win32":
        # Windows
        subprocess.Popen(
            [sys.executable, str(daemon_script)],
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        # Unix-like
        subprocess.Popen(
            [sys.executable, str(daemon_script)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )

    print("  ✅ Neural Daemon started in background")

def main():
    """Main activation sequence"""

    print_banner()

    # Check requirements
    if not check_requirements():
        print("\n❌ Please install missing requirements first")
        sys.exit(1)

    # Setup neural overlay
    if not setup_neural_overlay():
        print("\n❌ Setup failed")
        sys.exit(1)

    # Start daemon
    start_daemon()

    print("\n" + "=" * 70)
    print("✨ NEURAL OVERLAY ACTIVATED! ✨")
    print("=" * 70)

    print("""
Your systems now have:
  📊 Memory Crystallization - Patterns are saved and reused
  🔬 Reality Validation - Code is tested against actual execution
  💰 Cost Control - Prevents runaway LLM costs
  🎓 Continuous Learning - Gets smarter with every run
  🧠 Metacognitive Awareness - Understands its own performance

What happens now:
1. Every execution is monitored and learned from
2. Successful patterns become permanent memories
3. Failures are analyzed and avoided in future
4. Cross-domain insights emerge automatically
5. The system literally gets smarter every minute

To verify it's working:
  - Check logs/neural_daemon.log for activity
  - Run any of your existing systems - they're now enhanced!
  - Watch costs decrease and success rates increase over time

To stop the daemon:
  - Windows: Close the Neural Overlay console window
  - Unix: pkill -f neural_daemon.py
    """)

    print("\n🎯 Try running SOVEREIGN_AGENTS now - it will use its memories!")
    print("   cd SOVEREIGN_AGENTS && python start.py")

if __name__ == "__main__":
    main()
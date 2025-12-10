#!/usr/bin/env python3
"""
🚀 SOVEREIGN SYSTEM LAUNCHER
Starts both the API server and opens the dashboard.
"""

import os
import sys
import subprocess
import webbrowser
import time
import platform

def main():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗  ║
║   ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║  ║
║   ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗██╔██╗ ██║  ║
║   ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║██║╚██╗██║  ║
║   ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝██║ ╚████║  ║
║   ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝  ║
║                                                                              ║
║                         🧠 SYSTEM LAUNCHER 🧠                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Check for API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("⚠️  ANTHROPIC_API_KEY not set!")
        print()
        api_key = input("Enter your Anthropic API key: ").strip()
        if api_key:
            os.environ["ANTHROPIC_API_KEY"] = api_key
        else:
            print("❌ No API key provided. Exiting.")
            return
    
    print("✅ API key configured")
    print()
    
    # Check dependencies
    print("📦 Checking dependencies...")
    try:
        import anthropic
        print("   ✓ anthropic")
    except ImportError:
        print("   ❌ anthropic - Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "anthropic"])
    
    try:
        import fastapi
        print("   ✓ fastapi")
    except ImportError:
        print("   ❌ fastapi - Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi"])
    
    try:
        import uvicorn
        print("   ✓ uvicorn")
    except ImportError:
        print("   ❌ uvicorn - Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn"])
    
    print()
    print("🚀 Starting Sovereign API Server...")
    print()
    print("   Dashboard: http://localhost:8000")
    print("   API Docs:  http://localhost:8000/docs")
    print()
    print("   Press Ctrl+C to stop")
    print()
    print("─" * 60)
    
    # Open browser after a short delay
    def open_browser():
        time.sleep(2)
        webbrowser.open("http://localhost:8000")
    
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start the server
    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_server_path = os.path.join(script_dir, "06_LIVING", "api_server.py")
    
    # Change to the correct directory
    os.chdir(os.path.join(script_dir, "06_LIVING"))
    
    # Run uvicorn
    import uvicorn
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )


if __name__ == "__main__":
    main()

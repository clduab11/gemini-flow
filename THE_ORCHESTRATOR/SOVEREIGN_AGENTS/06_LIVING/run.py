#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🧠 SOVEREIGN LIVING SYSTEM 🧠                              ║
║                                                                              ║
║   Your personal AI system powered by Claude.                                 ║
║                                                                              ║
║   MODES:                                                                     ║
║   • CONVERSE  - Chat with the system like enhanced Claude                    ║
║   • EXPLORE   - Let agents autonomously explore topics                       ║
║   • TASK      - Give a specific task for multi-agent execution               ║
║   • MULTI     - Run a task through multiple specialized agents               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import os
import sys
from datetime import datetime

# Add path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from llm_brain import LivingSystem, LLMConfig


# ═══════════════════════════════════════════════════════════════════════════════
# TERMINAL COLORS
# ═══════════════════════════════════════════════════════════════════════════════

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'


def colored(text: str, color: str) -> str:
    """Add color to text."""
    return f"{color}{text}{Colors.ENDC}"


def print_banner():
    """Print the startup banner."""
    banner = """
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗  ║
║   ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║  ║
║   ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗██╔██╗ ██║  ║
║   ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║██║╚██╗██║  ║
║   ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝██║ ╚████║  ║
║   ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝  ║
║                                                                              ║
║                    🧠 LIVING AGENT SYSTEM 🧠                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
    print(colored(banner, Colors.CYAN))


def print_help():
    """Print help message."""
    help_text = """
╭──────────────────────────────────────────────────────────────────────────────╮
│                              COMMANDS                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  💬 CONVERSATION MODE (default)                                              │
│     Just type anything to chat with the system                               │
│                                                                              │
│  🔭 /explore [topic]    Start autonomous exploration                         │
│                         Without topic: agents explore freely                 │
│                                                                              │
│  🎯 /task <description> Execute a specific task                              │
│                                                                              │
│  🤖 /multi <task>       Run task through Architect→Executor→Critic           │
│                                                                              │
│  📊 /status             Show system status                                   │
│                                                                              │
│  🔄 /continue           Continue current exploration                         │
│                                                                              │
│  🧹 /clear              Clear agent memories                                 │
│                                                                              │
│  ❓ /help               Show this help                                       │
│                                                                              │
│  👋 /quit               Exit the system                                      │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
"""
    print(colored(help_text, Colors.GREEN))


def print_result(result: dict, indent: int = 0):
    """Pretty print a result."""
    prefix = "  " * indent
    
    if isinstance(result, dict):
        for key, value in result.items():
            if key == "thinking":
                print(f"{prefix}{colored('💭 Thinking:', Colors.DIM)}")
                print(f"{prefix}  {colored(str(value)[:200], Colors.DIM)}...")
            elif key == "result":
                print(f"{prefix}{colored('📤 Result:', Colors.GREEN)}")
                print(f"{prefix}  {value}")
            elif key == "next_steps" and value:
                print(f"{prefix}{colored('➡️  Next steps:', Colors.YELLOW)}")
                for step in value:
                    print(f"{prefix}  • {step}")
            elif key == "confidence":
                bar = "█" * int(value * 10) + "░" * (10 - int(value * 10))
                print(f"{prefix}{colored('📊 Confidence:', Colors.BLUE)} [{bar}] {value:.0%}")
            elif isinstance(value, dict):
                print(f"{prefix}{colored(key + ':', Colors.CYAN)}")
                print_result(value, indent + 1)
            elif key not in ["action"]:
                print(f"{prefix}{colored(key + ':', Colors.CYAN)} {value}")
    else:
        print(f"{prefix}{result}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════════════════════


async def main():
    """Main entry point."""
    print_banner()
    
    # Check for API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        print(colored("\n⚠️  ANTHROPIC_API_KEY not found in environment!", Colors.RED))
        print("\nTo set it:")
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        print("\nOr enter it now (will not be saved):")
        api_key = input("API Key: ").strip()
        
        if not api_key:
            print(colored("\n❌ No API key provided. Exiting.", Colors.RED))
            return
    
    # Initialize system
    print(colored("\n⚡ Initializing Living System...", Colors.YELLOW))
    
    try:
        config = LLMConfig(api_key=api_key)
        system = LivingSystem(config)
        print(colored("✓ System online!", Colors.GREEN))
    except Exception as e:
        print(colored(f"\n❌ Failed to initialize: {e}", Colors.RED))
        return
    
    print_help()
    
    print(colored("\n🧠 System ready. Type anything to begin.\n", Colors.CYAN))
    
    # Main loop
    while True:
        try:
            # Get input
            user_input = input(colored("You: ", Colors.BOLD)).strip()
            
            if not user_input:
                continue
            
            # Parse commands
            if user_input.startswith("/"):
                parts = user_input.split(" ", 1)
                command = parts[0].lower()
                args = parts[1] if len(parts) > 1 else ""
                
                if command == "/quit" or command == "/exit":
                    print(colored("\n👋 Goodbye!", Colors.CYAN))
                    break
                
                elif command == "/help":
                    print_help()
                
                elif command == "/status":
                    status = system.get_status()
                    print(colored("\n📊 System Status:", Colors.CYAN))
                    print_result(status)
                
                elif command == "/clear":
                    for agent in system._agents.values():
                        agent.clear_memory()
                    print(colored("✓ Memories cleared", Colors.GREEN))
                
                elif command == "/explore":
                    seed = args if args else None
                    print(colored(f"\n🔭 Starting exploration{f' from: {seed}' if seed else ''}...\n", Colors.YELLOW))
                    
                    result = await system.explore(seed)
                    print()
                    print_result(result)
                
                elif command == "/continue":
                    print(colored("\n🔄 Continuing exploration...\n", Colors.YELLOW))
                    result = await system.continue_exploration()
                    print()
                    print_result(result)
                
                elif command == "/task":
                    if not args:
                        print(colored("❌ Please provide a task description", Colors.RED))
                        continue
                    
                    print(colored(f"\n🎯 Starting task...\n", Colors.YELLOW))
                    result = await system.start_with_task(args)
                    print()
                    print_result(result)
                
                elif command == "/multi":
                    if not args:
                        print(colored("❌ Please provide a task description", Colors.RED))
                        continue
                    
                    print(colored(f"\n🤖 Multi-agent execution starting...\n", Colors.YELLOW))
                    result = await system.multi_agent_task(args)
                    print()
                    print_result(result)
                
                else:
                    print(colored(f"❌ Unknown command: {command}", Colors.RED))
                    print("Type /help for available commands")
            
            else:
                # Regular conversation
                print(colored("\n🧠 Thinking...\n", Colors.DIM))
                response = await system.converse(user_input)
                print(colored("Sovereign: ", Colors.CYAN) + response)
            
            print()  # Empty line for readability
            
        except KeyboardInterrupt:
            print(colored("\n\n👋 Interrupted. Goodbye!", Colors.CYAN))
            break
        except Exception as e:
            print(colored(f"\n❌ Error: {e}", Colors.RED))
            import traceback
            traceback.print_exc()
    
    # Final stats
    print(colored("\n📊 Session Stats:", Colors.CYAN))
    print_result(system.get_status())


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
CLI-Aware Orchestrator
Runs directly in Claude Code or Gemini CLI without requiring external API keys
Uses the CLI's own capabilities for AI operations
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import subprocess

# Detect CLI environment
IS_CLAUDE_CODE = os.getenv("CLAUDE_CODE") or "claude" in sys.executable.lower()
IS_GEMINI_CLI = os.getenv("GEMINI_CLI") or "gemini" in sys.executable.lower()
IS_CLI_AGENT = IS_CLAUDE_CODE or IS_GEMINI_CLI

print(f"""
╔══════════════════════════════════════════════════════╗
║         THE_ORCHESTRATOR - CLI INTELLIGENT MODE      ║
╠══════════════════════════════════════════════════════╣
║  Environment: {'Claude Code' if IS_CLAUDE_CODE else 'Gemini CLI' if IS_GEMINI_CLI else 'Standard'}  ║
║  Status: Ready for direct execution                  ║
║  API Keys: Using CLI native capabilities             ║
╚══════════════════════════════════════════════════════╝
""")

class CLIOrchestrator:
    """
    Orchestrator that uses CLI's native capabilities instead of external APIs
    """

    def __init__(self):
        self.agents = {}
        self.workflows = {}
        self.mode = "standby"
        print("🟢 System initialized in STANDBY mode")
        print("   Waiting for user command to execute workflows...")

    def execute_with_cli(self, prompt: str) -> str:
        """
        Execute using CLI's native capabilities
        No external API needed - uses the running agent's brain
        """
        if IS_CLAUDE_CODE:
            # Claude Code kan direkt processa
            return self._process_with_claude_native(prompt)
        elif IS_GEMINI_CLI:
            # Gemini CLI kan direkt processa
            return self._process_with_gemini_native(prompt)
        else:
            # Fallback till print för demo
            return f"[Simulated response for: {prompt}]"

    def _process_with_claude_native(self, prompt: str) -> str:
        """
        Process directly within Claude Code environment
        """
        # Claude Code can process this directly without API calls
        print(f"\n🤖 Processing with Claude native capabilities...")
        print(f"📝 Task: {prompt}")

        # The magic here is that Claude Code itself IS the AI
        # So we just return structured instructions
        return f"""
        ORCHESTRATOR EXECUTION PLAN:
        1. Analyzing: {prompt}
        2. Selecting optimal pattern: Hierarchical
        3. Deploying agents: SOVEREIGN → ARCHITECT → SPECIALIST
        4. Executing task...

        [Claude Code will process this naturally]
        """

    def _process_with_gemini_native(self, prompt: str) -> str:
        """
        Process directly within Gemini CLI environment
        """
        print(f"\n🤖 Processing with Gemini native capabilities...")
        print(f"📝 Task: {prompt}")

        return f"""
        ORCHESTRATOR EXECUTION PLAN:
        1. Analyzing: {prompt}
        2. Pattern: Evolutionary
        3. Agents: GENESIS → Population → Selection
        4. Executing...

        [Gemini CLI will process this naturally]
        """

    def create_workflow(self, name: str, nodes: List[Dict], edges: List[Dict]) -> Dict:
        """
        Create a workflow from visual flow representation
        """
        workflow = {
            "id": f"wf_{datetime.now().timestamp()}",
            "name": name,
            "nodes": nodes,
            "edges": edges,
            "status": "ready"
        }

        self.workflows[workflow["id"]] = workflow
        print(f"✅ Workflow '{name}' created and ready")
        return workflow

    def execute_workflow(self, workflow_id: str) -> Dict:
        """
        Execute a workflow using CLI capabilities
        """
        if workflow_id not in self.workflows:
            return {"error": "Workflow not found"}

        workflow = self.workflows[workflow_id]
        print(f"\n🚀 Executing workflow: {workflow['name']}")

        results = []
        for node in workflow["nodes"]:
            if node["type"] in ["sovereign", "architect", "specialist"]:
                # Use CLI native processing
                result = self.execute_with_cli(node["data"]["label"])
                results.append({
                    "node": node["id"],
                    "type": node["type"],
                    "result": result
                })

        return {
            "success": True,
            "results": results,
            "workflow": workflow_id
        }

class StandbyExecutor:
    """
    Keeps system in standby, ready to execute on user prompt
    """

    def __init__(self):
        self.orchestrator = CLIOrchestrator()
        self.ready = True

    async def wait_for_command(self):
        """
        Wait in standby for user commands
        """
        print("\n⏳ System in STANDBY mode")
        print("   Type a command or paste a workflow to execute...")
        print("   Examples:")
        print("   - 'analyze competitor website example.com'")
        print("   - 'create backlink campaign for keyword'")
        print("   - 'optimize content for SEO'")
        print("\n" + "="*50 + "\n")

        # In CLI mode, we don't actually wait - we process immediately
        if IS_CLI_AGENT:
            print("🎯 CLI Agent detected - ready for immediate execution")
            print("   Any user prompt will trigger orchestration")
            return True

        # For testing outside CLI
        while self.ready:
            await asyncio.sleep(1)

    def execute_on_prompt(self, user_prompt: str):
        """
        Execute orchestration based on user prompt
        """
        print(f"\n⚡ Triggered by user prompt: '{user_prompt[:50]}...'")

        # Analyze prompt and create workflow
        workflow = self._analyze_and_create_workflow(user_prompt)

        # Execute
        result = self.orchestrator.execute_workflow(workflow["id"])

        return result

    def _analyze_and_create_workflow(self, prompt: str) -> Dict:
        """
        Analyze user prompt and create appropriate workflow
        """
        prompt_lower = prompt.lower()

        # Determine workflow type
        if "seo" in prompt_lower or "search" in prompt_lower:
            nodes = [
                {"id": "1", "type": "serpAnalyzer", "data": {"label": "Analyze SERP"}},
                {"id": "2", "type": "contentOptimizer", "data": {"label": "Optimize content"}},
            ]
        elif "backlink" in prompt_lower:
            nodes = [
                {"id": "1", "type": "campaignManager", "data": {"label": "Manage campaign"}},
                {"id": "2", "type": "backlinkCreator", "data": {"label": "Create backlinks"}},
            ]
        else:
            nodes = [
                {"id": "1", "type": "sovereign", "data": {"label": prompt}},
                {"id": "2", "type": "architect", "data": {"label": "Design solution"}},
            ]

        edges = [{"id": "e1", "source": "1", "target": "2"}]

        return self.orchestrator.create_workflow(
            name=f"Auto-workflow for: {prompt[:30]}",
            nodes=nodes,
            edges=edges
        )

# Global instance
standby = StandbyExecutor()

def process_user_command(command: str):
    """
    Main entry point for CLI agents
    This gets called when user gives any command
    """
    return standby.execute_on_prompt(command)

# Auto-execute if running in CLI
if __name__ == "__main__":
    if IS_CLI_AGENT:
        print("\n🤖 CLI Agent Mode Active")
        print("   System will respond to your next command...")

        # Check if there's a command line argument
        if len(sys.argv) > 1:
            command = " ".join(sys.argv[1:])
            result = process_user_command(command)
            print(json.dumps(result, indent=2))
        else:
            print("\n💡 TIP: Just type your request normally.")
            print("   The orchestrator will automatically engage.")
    else:
        # Run in standby mode for testing
        print("\n🖥️ Running in test mode (not in CLI agent)")
        asyncio.run(standby.wait_for_command())
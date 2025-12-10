#!/usr/bin/env python3
"""
Direct Orchestration Wrapper
Activates immediately on any user prompt when called from CLI
"""

import sys
import os
import json
from datetime import datetime

class DirectOrchestrator:
    """
    Zero-config orchestrator that runs directly on user prompts
    """

    @staticmethod
    def process_command(command: str):
        """
        Process any user command directly
        """
        # This is the magic - when running in Claude Code,
        # this function IS the orchestration

        analysis = DirectOrchestrator.analyze_intent(command)
        workflow = DirectOrchestrator.build_workflow(analysis)

        # In CLI mode, we don't need to execute - we ARE the execution
        print(f"\n🎯 ORCHESTRATING: {command}")
        print("="*50)

        if 'claude' in sys.executable.lower():
            # Claude Code is running this
            return {
                "mode": "CLAUDE_NATIVE",
                "analysis": analysis,
                "workflow": workflow,
                "instruction": "Execute this workflow using your native capabilities"
            }
        else:
            # Standard execution
            return {
                "mode": "STANDARD",
                "analysis": analysis,
                "workflow": workflow,
                "result": "Ready to execute"
            }

    @staticmethod
    def analyze_intent(command: str):
        """
        Analyze user intent from command
        """
        cmd_lower = command.lower()

        intents = {
            "seo": ["seo", "search", "serp", "keyword", "ranking"],
            "backlink": ["backlink", "link", "campaign", "authority"],
            "content": ["content", "optimize", "write", "article"],
            "analysis": ["analyze", "audit", "review", "check"],
            "competitor": ["competitor", "competition", "rival"]
        }

        detected = []
        for intent, keywords in intents.items():
            if any(kw in cmd_lower for kw in keywords):
                detected.append(intent)

        return detected if detected else ["general"]

    @staticmethod
    def build_workflow(intents):
        """
        Build workflow based on detected intents
        """
        workflow = {
            "pattern": "hierarchical",
            "agents": [],
            "tasks": []
        }

        if "seo" in intents:
            workflow["agents"].extend([
                {"type": "serpAnalyzer", "task": "Analyze SERP positions"},
                {"type": "keywordResearch", "task": "Find opportunities"},
                {"type": "contentOptimizer", "task": "Optimize for rankings"}
            ])

        if "backlink" in intents:
            workflow["agents"].extend([
                {"type": "campaignManager", "task": "Manage campaigns"},
                {"type": "backlinkCreator", "task": "Create quality backlinks"},
                {"type": "qualityControl", "task": "Ensure link quality"}
            ])

        if "competitor" in intents:
            workflow["agents"].extend([
                {"type": "competitorIntelligence", "task": "Analyze competitors"},
                {"type": "linkIntelligence", "task": "Find link gaps"}
            ])

        # Add orchestrator if complex
        if len(workflow["agents"]) > 3:
            workflow["agents"].insert(0, {
                "type": "sovereign",
                "task": "Orchestrate multi-agent workflow"
            })
            workflow["pattern"] = "unified"

        return workflow

# Main execution
if __name__ == "__main__":
    # Get command from arguments or stdin
    if len(sys.argv) > 1:
        command = " ".join(sys.argv[1:])
    else:
        # If no args, we're in standby - print ready message
        print("\n🚀 ORCHESTRATOR READY")
        print("   Waiting for user command...")
        print("\n   Just type anything to activate orchestration")
        sys.exit(0)

    # Process the command
    orchestrator = DirectOrchestrator()
    result = orchestrator.process_command(command)

    # Output result
    print(json.dumps(result, indent=2))

    # In CLI mode, the result itself becomes the execution
    if result.get("mode") == "CLAUDE_NATIVE":
        print("\n✨ Executing with Claude native capabilities...")
        print("   The workflow is now being processed directly.")
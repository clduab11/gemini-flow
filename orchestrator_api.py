#!/usr/bin/env python3
"""
FastAPI server for THE_ORCHESTRATOR integration
Provides REST API endpoints for executing multi-agent workflows
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add THE_ORCHESTRATOR to path
ORCHESTRATOR_PATH = Path(__file__).parent / 'THE_ORCHESTRATOR'
sys.path.insert(0, str(ORCHESTRATOR_PATH))

# Import the orchestrator bridge
from backend.orchestrator_bridge import OrchestratorBridge, OrchestrationPlan, AgentConfig

# FastAPI app
app = FastAPI(
    title="THE_ORCHESTRATOR API",
    description="Visual flow orchestration for multi-agent AI systems",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class NodeData(BaseModel):
    label: str
    agentType: Optional[str] = None
    level: Optional[int] = None
    capabilities: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None

class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: NodeData

class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = "smoothstep"
    data: Optional[Dict[str, Any]] = None

class ExecuteRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ExecuteResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    plan: Optional[Dict[str, Any]] = None

# Global orchestrator instance
orchestrator = OrchestratorBridge()

# In-memory job storage (in production, use Redis or database)
jobs = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "orchestrator": "ready",
        "apis": {
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY"))
        }
    }

@app.post("/api/orchestrator/execute", response_model=ExecuteResponse)
async def execute_orchestration(request: ExecuteRequest, background_tasks: BackgroundTasks):
    """
    Execute an orchestration plan from visual flow
    """
    try:
        # Convert request to orchestration plan
        plan = convert_to_orchestration_plan(request)

        # Log the execution request
        logger.info(f"Executing orchestration with pattern: {plan.pattern}")
        logger.info(f"Agents: {len(plan.agents)}, Tasks: {len(plan.tasks)}")

        # Execute the plan
        result = orchestrator.execute_plan(plan)

        # Return response
        return ExecuteResponse(
            success=result.get("success", False),
            result=json.dumps(result.get("results", [])),
            metadata=result.get("metadata"),
            plan=plan.__dict__ if request.config.get("includePlan") else None
        )

    except Exception as e:
        logger.error(f"Orchestration execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orchestrator/patterns")
async def get_patterns():
    """Get available orchestration patterns"""
    return {
        "patterns": {
            "hierarchical": {
                "name": "Hierarchical",
                "description": "Strict control structure with quality gates",
                "icon": "👑",
                "color": "#FFD700"
            },
            "evolutionary": {
                "name": "Evolutionary",
                "description": "Genetic algorithms for agent evolution",
                "icon": "🧬",
                "color": "#FF1493"
            },
            "swarm": {
                "name": "Swarm",
                "description": "Collective intelligence",
                "icon": "🐝",
                "color": "#FFA500"
            },
            "temporal": {
                "name": "Temporal",
                "description": "Predictive analysis",
                "icon": "🔮",
                "color": "#9400D3"
            },
            "unified": {
                "name": "Unified",
                "description": "Synthesis of all patterns",
                "icon": "✨",
                "color": "#FF69B4"
            }
        }
    }

@app.get("/api/orchestrator/agents")
async def get_agents():
    """Get available agent configurations"""
    return {
        "agents": [
            {
                "id": "sovereign",
                "name": "THE SOVEREIGN",
                "level": 0,
                "description": "Meta-orchestrator with full system control",
                "capabilities": ["ORCHESTRATE", "SPAWN", "VALIDATE", "SYNTHESIZE"],
                "icon": "👑"
            },
            {
                "id": "architect",
                "name": "Domain Architect",
                "level": 1,
                "description": "Domain master for specialized areas",
                "capabilities": ["ORCHESTRATE", "SPAWN", "VALIDATE"],
                "icon": "🏗️"
            },
            {
                "id": "specialist",
                "name": "Task Specialist",
                "level": 2,
                "description": "Expert for specific task types",
                "capabilities": ["EXECUTE", "VALIDATE"],
                "icon": "🔧"
            },
            {
                "id": "worker",
                "name": "Execution Worker",
                "level": 3,
                "description": "Basic execution unit",
                "capabilities": ["EXECUTE"],
                "icon": "⚙️"
            },
            {
                "id": "synthesizer",
                "name": "Synthesis Engine",
                "level": "X",
                "description": "Cross-paradigm unification agent",
                "capabilities": ["SYNTHESIZE", "ORCHESTRATE"],
                "icon": "🔮"
            }
        ]
    }

@app.post("/api/orchestrator/validate")
async def validate_flow(request: ExecuteRequest):
    """Validate a flow configuration"""
    validation = {
        "valid": True,
        "warnings": [],
        "errors": [],
        "suggestions": []
    }

    # Check for input node
    has_input = any(node.type == "input" for node in request.nodes)
    if not has_input:
        validation["errors"].append("No input node found")
        validation["valid"] = False

    # Check for orphaned nodes
    connected_nodes = set()
    for edge in request.edges:
        connected_nodes.add(edge.source)
        connected_nodes.add(edge.target)

    for node in request.nodes:
        if node.id not in connected_nodes and node.type != "input":
            validation["warnings"].append(f"Node '{node.data.label}' is not connected")

    # Suggestions
    node_types = [node.type for node in request.nodes]
    if len(request.nodes) > 5 and "sovereign" not in node_types:
        validation["suggestions"].append(
            "Consider adding a SOVEREIGN agent for better orchestration"
        )

    return validation

@app.post("/api/orchestrator/async/execute")
async def execute_async(request: ExecuteRequest):
    """Execute orchestration asynchronously"""
    job_id = f"job_{datetime.utcnow().timestamp()}"

    # Store job
    jobs[job_id] = {
        "id": job_id,
        "status": "pending",
        "created": datetime.utcnow().isoformat(),
        "request": request.dict()
    }

    # Execute in background
    asyncio.create_task(execute_background(job_id, request))

    return {"job_id": job_id, "status": "accepted"}

@app.get("/api/orchestrator/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return jobs[job_id]

async def execute_background(job_id: str, request: ExecuteRequest):
    """Execute orchestration in background"""
    try:
        jobs[job_id]["status"] = "running"

        # Convert and execute
        plan = convert_to_orchestration_plan(request)
        result = orchestrator.execute_plan(plan)

        # Update job
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = result
        jobs[job_id]["completed"] = datetime.utcnow().isoformat()

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["completed"] = datetime.utcnow().isoformat()

def convert_to_orchestration_plan(request: ExecuteRequest) -> OrchestrationPlan:
    """Convert API request to orchestration plan"""

    # Determine pattern
    pattern = request.config.get("pattern", "hierarchical")

    # Convert nodes to agents
    agents = []
    for node in request.nodes:
        agent_config = AgentConfig(
            id=node.id,
            type=node.data.agentType or node.type,
            level=determine_level(node),
            label=node.data.label,
            capabilities=node.data.capabilities or ["EXECUTE"],
            config=node.data.config or {}
        )
        agents.append(agent_config)

    # Convert edges to connections
    connections = []
    for edge in request.edges:
        connections.append({
            "from": edge.source,
            "to": edge.target,
            "type": edge.data.get("connectionType", "orchestrate") if edge.data else "orchestrate"
        })

    # Extract tasks from nodes
    tasks = []
    for node in request.nodes:
        if node.data.label:
            tasks.append({
                "agentId": node.id,
                "description": node.data.label,
                "complexity": estimate_complexity(node.data.label)
            })

    # Create plan
    return OrchestrationPlan(
        pattern=pattern,
        agents=agents,
        connections=connections,
        tasks=tasks,
        quality_gates=[]
    )

def determine_level(node: Node) -> int:
    """Determine agent level from node"""
    level_map = {
        "sovereign": 0,
        "architect": 1,
        "specialist": 2,
        "worker": 3,
        "synthesizer": "X"
    }
    return level_map.get(node.type, 3)

def estimate_complexity(label: str) -> str:
    """Estimate task complexity from label"""
    label_lower = label.lower()

    if any(word in label_lower for word in ["synthesis", "orchestration", "evolution"]):
        return "high"
    elif any(word in label_lower for word in ["analysis", "generation", "optimization"]):
        return "medium"
    else:
        return "low"

if __name__ == "__main__":
    # Check for API keys
    if not os.getenv("ANTHROPIC_API_KEY"):
        logger.warning("ANTHROPIC_API_KEY not set - some features will be limited")

    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
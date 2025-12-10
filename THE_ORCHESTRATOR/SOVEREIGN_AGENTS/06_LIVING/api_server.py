"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗  ║
║   ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║  ║
║   ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗██╔██╗ ██║  ║
║   ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║██║╚██╗██║  ║
║   ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝██║ ╚████║  ║
║   ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝  ║
║                                                                              ║
║                         🌐 API SERVER 🌐                                      ║
║                                                                              ║
║   REST API for the Sovereign Agent System                                    ║
║   Connects your frontend to the living AI agents                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Run with:
    uvicorn api_server:app --reload --port 8000

Or:
    python api_server.py
"""

import asyncio
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field

# Add path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from llm_brain import LivingSystem, LLMConfig, PERSONAS
from persistence import persistence, Message, Conversation, Session


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════


class ChatRequest(BaseModel):
    """Request for chat endpoint."""
    message: str = Field(..., description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for persistence")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Optional context")


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    response: str
    agent: str = "sovereign"
    timestamp: str
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None


class ExploreRequest(BaseModel):
    """Request for exploration."""
    seed: Optional[str] = Field(None, description="Starting topic (optional)")


class TaskRequest(BaseModel):
    """Request for task execution."""
    description: str = Field(..., description="Task description")
    agents: List[str] = Field(
        default=["architect", "executor", "critic"],
        description="Agents to use"
    )


class AgentInfo(BaseModel):
    """Information about an agent."""
    agent_id: str
    name: str
    role: str
    persona: str
    thoughts: int
    children: int
    is_active: bool


class SystemStatus(BaseModel):
    """System status response."""
    mode: str
    agents: Dict[str, Any]
    llm_stats: Dict[str, Any]
    session_actions: int
    uptime_seconds: float


# ═══════════════════════════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════

# Global state
system: Optional[LivingSystem] = None
start_time: datetime = datetime.utcnow()
connected_websockets: List[WebSocket] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global system, start_time
    
    # Startup
    print("🚀 Starting Sovereign API Server...")
    
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("⚠️  Warning: ANTHROPIC_API_KEY not set!")
        print("   Set it with: export ANTHROPIC_API_KEY='your-key'")
        print("   Server will start but API calls will fail.")
    
    try:
        config = LLMConfig(api_key=api_key)
        system = LivingSystem(config)
        start_time = datetime.utcnow()
        print("✅ System initialized!")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        system = None
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Sovereign Agents API",
    description="REST API for the Sovereign Living Agent System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER
# ═══════════════════════════════════════════════════════════════════════════════


def check_system():
    """Check if system is initialized."""
    if system is None:
        raise HTTPException(
            status_code=503,
            detail="System not initialized. Check ANTHROPIC_API_KEY."
        )
    return system


async def broadcast_event(event_type: str, data: Any):
    """Broadcast event to all connected WebSocket clients."""
    message = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    disconnected = []
    for ws in connected_websockets:
        try:
            await ws.send_json(message)
        except:
            disconnected.append(ws)
    
    # Clean up disconnected
    for ws in disconnected:
        connected_websockets.remove(ws)


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS - CHAT
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Chat with the Sovereign system.
    
    This is the main conversational interface. The Sovereign agent will
    respond directly or delegate to specialized agents as needed.
    
    Messages are automatically saved to the conversation.
    """
    sys = check_system()
    
    # Handle session/conversation
    session_id = request.session_id or "default"
    conversation_id = request.conversation_id
    
    # Create conversation if not provided
    if not conversation_id:
        conv = persistence.create_conversation(session_id, mode="chat")
        conversation_id = conv.id
    
    # Save user message
    persistence.add_message(
        conversation_id=conversation_id,
        role="user",
        content=request.message
    )
    
    await broadcast_event("chat_started", {"message": request.message})
    
    try:
        response = await sys.converse(request.message)
        
        # Save assistant message
        persistence.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=response,
            agent="sovereign"
        )
        
        result = ChatResponse(
            response=response,
            agent="sovereign",
            timestamp=datetime.utcnow().isoformat(),
            session_id=session_id,
            conversation_id=conversation_id
        )
        
        await broadcast_event("chat_completed", {"response": response[:100]})
        
        return result
        
    except Exception as e:
        await broadcast_event("chat_error", {"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS - EXPLORATION
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/api/explore", tags=["Exploration"])
async def explore(request: ExploreRequest):
    """
    Start autonomous exploration.
    
    The Explorer agent will begin investigating topics, finding connections,
    and generating insights. Optionally provide a seed topic.
    """
    sys = check_system()
    
    await broadcast_event("exploration_started", {"seed": request.seed})
    
    try:
        result = await sys.explore(request.seed)
        
        await broadcast_event("exploration_completed", {
            "result": result.get("result", "")[:200]
        })
        
        return {
            "status": "exploring",
            "seed": request.seed,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        await broadcast_event("exploration_error", {"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explore/continue", tags=["Exploration"])
async def continue_exploration():
    """
    Continue the current exploration.
    
    The Explorer will dig deeper into the current topic, following
    interesting threads and making new connections.
    """
    sys = check_system()
    
    await broadcast_event("exploration_continuing", {})
    
    try:
        result = await sys.continue_exploration()
        
        await broadcast_event("exploration_continued", {
            "result": result.get("result", "")[:200]
        })
        
        return {
            "status": "continued",
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS - TASKS
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/api/task", tags=["Tasks"])
async def execute_task(request: TaskRequest):
    """
    Execute a task with the Sovereign system.
    
    The Sovereign will analyze the task and delegate appropriately.
    """
    sys = check_system()
    
    await broadcast_event("task_started", {"description": request.description})
    
    try:
        result = await sys.start_with_task(request.description)
        
        await broadcast_event("task_completed", {
            "result": result.get("result", "")[:200]
        })
        
        return {
            "status": "completed",
            "task": request.description,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        await broadcast_event("task_error", {"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/task/multi", tags=["Tasks"])
async def multi_agent_task(request: TaskRequest):
    """
    Execute a task using multiple specialized agents.
    
    The task will flow through the specified agents in sequence:
    - architect: Analyzes and plans
    - executor: Produces output
    - critic: Reviews and improves
    - synthesizer: Combines results
    
    Results from each agent are passed to the next.
    """
    sys = check_system()
    
    # Validate agents
    valid_agents = set(PERSONAS.keys())
    for agent in request.agents:
        if agent not in valid_agents:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown agent: {agent}. Valid: {list(valid_agents)}"
            )
    
    await broadcast_event("multi_task_started", {
        "description": request.description,
        "agents": request.agents
    })
    
    try:
        result = await sys.multi_agent_task(request.description, request.agents)
        
        await broadcast_event("multi_task_completed", {
            "agents_used": result.get("agents_used", [])
        })
        
        return {
            "status": "completed",
            "task": request.description,
            "agents_used": request.agents,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        await broadcast_event("multi_task_error", {"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS - SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/api/status", response_model=SystemStatus, tags=["System"])
async def get_status():
    """
    Get current system status.
    
    Returns information about active agents, LLM usage, and session stats.
    """
    sys = check_system()
    
    status = sys.get_status()
    uptime = (datetime.utcnow() - start_time).total_seconds()
    
    return SystemStatus(
        mode=status["mode"],
        agents=status["agents"],
        llm_stats=status["llm_stats"],
        session_actions=status["session_actions"],
        uptime_seconds=uptime
    )


@app.get("/api/agents", tags=["System"])
async def list_agents():
    """
    List all active agents and their states.
    """
    sys = check_system()
    
    agents = {}
    for name, agent in sys._agents.items():
        state = agent.get_state()
        agents[name] = {
            **state,
            "persona": {
                "name": agent.persona.name,
                "role": agent.persona.role,
                "personality": agent.persona.personality,
                "capabilities": agent.persona.capabilities,
                "creativity": agent.persona.creativity,
                "autonomy": agent.persona.autonomy
            }
        }
    
    return {
        "agents": agents,
        "total": len(agents),
        "available_personas": list(PERSONAS.keys())
    }


@app.get("/api/session/log", tags=["System"])
async def get_session_log():
    """
    Get the session log with all actions.
    """
    sys = check_system()
    
    return {
        "log": sys.get_session_log(),
        "total_actions": len(sys.get_session_log())
    }


@app.post("/api/agents/clear", tags=["System"])
async def clear_agent_memories():
    """
    Clear all agent memories.
    
    This resets the conversation history for all agents.
    """
    sys = check_system()
    
    for agent in sys._agents.values():
        agent.clear_memory()
    
    await broadcast_event("memories_cleared", {})
    
    return {"status": "cleared", "agents_affected": len(sys._agents)}


# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET - REAL-TIME UPDATES
# ═══════════════════════════════════════════════════════════════════════════════


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket for real-time updates.
    
    Connect to receive live events from the system:
    - chat_started, chat_completed
    - exploration_started, exploration_completed
    - task_started, task_completed
    - agent_spawned, memories_cleared
    """
    await websocket.accept()
    connected_websockets.append(websocket)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "data": {"message": "Connected to Sovereign System"},
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive
        while True:
            try:
                # Wait for messages (ping/pong or commands)
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=30.0
                )
                
                # Handle ping
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
                
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)


# ═══════════════════════════════════════════════════════════════════════════════
# STATIC FILES & FRONTEND
# ═══════════════════════════════════════════════════════════════════════════════


# Serve frontend if it exists
frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")
    
    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def serve_frontend():
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return HTMLResponse("<h1>Sovereign API</h1><p>Frontend not found. Visit /docs for API.</p>")
else:
    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def root():
        return HTMLResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sovereign API</title>
            <style>
                body { 
                    font-family: system-ui; 
                    background: #0a0a0a; 
                    color: #e4e4e7;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    text-align: center;
                }
                h1 { color: #22d3ee; }
                a { color: #22d3ee; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🧠 Sovereign Agents API</h1>
                <p>API is running!</p>
                <p><a href="/docs">View API Documentation</a></p>
                <p><a href="/api/status">Check Status</a></p>
            </div>
        </body>
        </html>
        """)


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if system else "degraded",
        "system_initialized": system is not None,
        "uptime_seconds": (datetime.utcnow() - start_time).total_seconds()
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS - SESSIONS & CONVERSATIONS (PERSISTENCE)
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/api/sessions", tags=["Persistence"])
async def list_sessions():
    """List all sessions."""
    return {"sessions": persistence.list_sessions()}


@app.post("/api/sessions", tags=["Persistence"])
async def create_session(session_id: Optional[str] = None):
    """Create a new session."""
    session = persistence.create_session(session_id)
    return {"session": {
        "id": session.id,
        "created_at": session.created_at
    }}


@app.get("/api/sessions/{session_id}", tags=["Persistence"])
async def get_session(session_id: str):
    """Get a session by ID."""
    session = persistence.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "active_conversation_id": session.active_conversation_id,
        "conversation_ids": session.conversation_ids
    }


@app.get("/api/sessions/{session_id}/conversations", tags=["Persistence"])
async def list_conversations(session_id: str):
    """List all conversations in a session."""
    return {"conversations": persistence.list_conversations(session_id)}


@app.post("/api/sessions/{session_id}/conversations", tags=["Persistence"])
async def create_conversation(
    session_id: str,
    title: str = "New Conversation",
    mode: str = "chat"
):
    """Create a new conversation in a session."""
    conv = persistence.create_conversation(session_id, title=title, mode=mode)
    return {
        "id": conv.id,
        "title": conv.title,
        "mode": conv.mode,
        "created_at": conv.created_at
    }


@app.get("/api/conversations/{conversation_id}", tags=["Persistence"])
async def get_conversation(conversation_id: str):
    """Get a conversation with all messages."""
    conv = persistence.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "id": conv.id,
        "title": conv.title,
        "mode": conv.mode,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "timestamp": m.timestamp,
                "agent": m.agent
            }
            for m in conv.messages
        ],
        "created_at": conv.created_at,
        "updated_at": conv.updated_at
    }


@app.delete("/api/sessions/{session_id}/conversations/{conversation_id}", tags=["Persistence"])
async def delete_conversation(session_id: str, conversation_id: str):
    """Delete a conversation."""
    success = persistence.delete_conversation(session_id, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted"}


@app.get("/api/sessions/{session_id}/export", tags=["Persistence"])
async def export_session(session_id: str):
    """Export a complete session with all conversations."""
    data = persistence.export_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return data


# ═══════════════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════════════


if __name__ == "__main__":
    import uvicorn
    
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🧠 SOVEREIGN AGENTS API SERVER 🧠                          ║
║                                                                              ║
║   Starting server at http://localhost:8000                                   ║
║                                                                              ║
║   API Docs:    http://localhost:8000/docs                                    ║
║   Health:      http://localhost:8000/health                                  ║
║   WebSocket:   ws://localhost:8000/ws                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

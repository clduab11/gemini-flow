"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    💾 SESSION PERSISTENCE 💾                                  ║
║                                                                              ║
║   Saves conversations and agent states to disk.                              ║
║   Survives server restarts and browser refreshes.                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import hashlib


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Where to store session data
DATA_DIR = Path(__file__).parent / ".sovereign_data"
SESSIONS_DIR = DATA_DIR / "sessions"
CONVERSATIONS_DIR = DATA_DIR / "conversations"


def ensure_dirs():
    """Create data directories if they don't exist."""
    DATA_DIR.mkdir(exist_ok=True)
    SESSIONS_DIR.mkdir(exist_ok=True)
    CONVERSATIONS_DIR.mkdir(exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Message:
    """A single message in a conversation."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    agent: str = "sovereign"
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class Conversation:
    """A full conversation with messages."""
    id: str
    title: str
    messages: List[Message]
    created_at: str
    updated_at: str
    mode: str = "chat"  # "chat", "explore", "task"
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass 
class Session:
    """A user session containing multiple conversations."""
    id: str
    created_at: str
    updated_at: str
    active_conversation_id: Optional[str] = None
    conversation_ids: List[str] = None
    agent_states: Dict[str, Any] = None
    preferences: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.conversation_ids is None:
            self.conversation_ids = []
        if self.agent_states is None:
            self.agent_states = {}
        if self.preferences is None:
            self.preferences = {}


# ═══════════════════════════════════════════════════════════════════════════════
# PERSISTENCE MANAGER
# ═══════════════════════════════════════════════════════════════════════════════

class PersistenceManager:
    """
    Manages saving and loading of sessions and conversations.
    
    Data is stored as JSON files:
    - .sovereign_data/sessions/{session_id}.json
    - .sovereign_data/conversations/{conversation_id}.json
    """
    
    def __init__(self):
        ensure_dirs()
        self._cache: Dict[str, Any] = {}
    
    # ─── SESSION MANAGEMENT ───────────────────────────────────────────────────
    
    def create_session(self, session_id: Optional[str] = None) -> Session:
        """Create a new session."""
        if session_id is None:
            session_id = self._generate_id("session")
        
        now = datetime.utcnow().isoformat()
        session = Session(
            id=session_id,
            created_at=now,
            updated_at=now
        )
        
        self.save_session(session)
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """Load a session by ID."""
        path = SESSIONS_DIR / f"{session_id}.json"
        
        if not path.exists():
            return None
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Convert messages in conversations
            return Session(
                id=data["id"],
                created_at=data["created_at"],
                updated_at=data["updated_at"],
                active_conversation_id=data.get("active_conversation_id"),
                conversation_ids=data.get("conversation_ids", []),
                agent_states=data.get("agent_states", {}),
                preferences=data.get("preferences", {})
            )
        except Exception as e:
            print(f"Error loading session {session_id}: {e}")
            return None
    
    def save_session(self, session: Session) -> None:
        """Save a session to disk."""
        session.updated_at = datetime.utcnow().isoformat()
        path = SESSIONS_DIR / f"{session.id}.json"
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(asdict(session), f, indent=2, ensure_ascii=False)
    
    def get_or_create_session(self, session_id: str) -> Session:
        """Get existing session or create new one."""
        session = self.get_session(session_id)
        if session is None:
            session = self.create_session(session_id)
        return session
    
    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all sessions (metadata only)."""
        sessions = []
        for path in SESSIONS_DIR.glob("*.json"):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                sessions.append({
                    "id": data["id"],
                    "created_at": data["created_at"],
                    "updated_at": data["updated_at"],
                    "conversation_count": len(data.get("conversation_ids", []))
                })
            except:
                pass
        
        # Sort by updated_at descending
        sessions.sort(key=lambda x: x["updated_at"], reverse=True)
        return sessions
    
    # ─── CONVERSATION MANAGEMENT ──────────────────────────────────────────────
    
    def create_conversation(
        self, 
        session_id: str, 
        title: str = "New Conversation",
        mode: str = "chat"
    ) -> Conversation:
        """Create a new conversation in a session."""
        conv_id = self._generate_id("conv")
        now = datetime.utcnow().isoformat()
        
        conversation = Conversation(
            id=conv_id,
            title=title,
            messages=[],
            created_at=now,
            updated_at=now,
            mode=mode
        )
        
        # Save conversation
        self.save_conversation(conversation)
        
        # Add to session
        session = self.get_or_create_session(session_id)
        session.conversation_ids.append(conv_id)
        session.active_conversation_id = conv_id
        self.save_session(session)
        
        return conversation
    
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Load a conversation by ID."""
        path = CONVERSATIONS_DIR / f"{conversation_id}.json"
        
        if not path.exists():
            return None
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Convert message dicts to Message objects
            messages = [
                Message(
                    role=m["role"],
                    content=m["content"],
                    timestamp=m["timestamp"],
                    agent=m.get("agent", "sovereign"),
                    metadata=m.get("metadata", {})
                )
                for m in data.get("messages", [])
            ]
            
            return Conversation(
                id=data["id"],
                title=data["title"],
                messages=messages,
                created_at=data["created_at"],
                updated_at=data["updated_at"],
                mode=data.get("mode", "chat"),
                metadata=data.get("metadata", {})
            )
        except Exception as e:
            print(f"Error loading conversation {conversation_id}: {e}")
            return None
    
    def save_conversation(self, conversation: Conversation) -> None:
        """Save a conversation to disk."""
        conversation.updated_at = datetime.utcnow().isoformat()
        path = CONVERSATIONS_DIR / f"{conversation.id}.json"
        
        # Convert to dict with messages as dicts
        data = {
            "id": conversation.id,
            "title": conversation.title,
            "messages": [asdict(m) for m in conversation.messages],
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "mode": conversation.mode,
            "metadata": conversation.metadata
        }
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        agent: str = "sovereign",
        metadata: Dict[str, Any] = None
    ) -> Message:
        """Add a message to a conversation."""
        conversation = self.get_conversation(conversation_id)
        if conversation is None:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        message = Message(
            role=role,
            content=content,
            timestamp=datetime.utcnow().isoformat(),
            agent=agent,
            metadata=metadata or {}
        )
        
        conversation.messages.append(message)
        
        # Auto-generate title from first user message
        if len(conversation.messages) == 1 and role == "user":
            conversation.title = content[:50] + ("..." if len(content) > 50 else "")
        
        self.save_conversation(conversation)
        return message
    
    def list_conversations(self, session_id: str) -> List[Dict[str, Any]]:
        """List all conversations in a session."""
        session = self.get_session(session_id)
        if session is None:
            return []
        
        conversations = []
        for conv_id in session.conversation_ids:
            conv = self.get_conversation(conv_id)
            if conv:
                conversations.append({
                    "id": conv.id,
                    "title": conv.title,
                    "mode": conv.mode,
                    "message_count": len(conv.messages),
                    "created_at": conv.created_at,
                    "updated_at": conv.updated_at
                })
        
        # Sort by updated_at descending
        conversations.sort(key=lambda x: x["updated_at"], reverse=True)
        return conversations
    
    def delete_conversation(self, session_id: str, conversation_id: str) -> bool:
        """Delete a conversation."""
        # Remove from session
        session = self.get_session(session_id)
        if session and conversation_id in session.conversation_ids:
            session.conversation_ids.remove(conversation_id)
            if session.active_conversation_id == conversation_id:
                session.active_conversation_id = (
                    session.conversation_ids[0] if session.conversation_ids else None
                )
            self.save_session(session)
        
        # Delete file
        path = CONVERSATIONS_DIR / f"{conversation_id}.json"
        if path.exists():
            path.unlink()
            return True
        return False
    
    # ─── AGENT STATE MANAGEMENT ───────────────────────────────────────────────
    
    def save_agent_states(self, session_id: str, states: Dict[str, Any]) -> None:
        """Save agent states for a session."""
        session = self.get_or_create_session(session_id)
        session.agent_states = states
        self.save_session(session)
    
    def get_agent_states(self, session_id: str) -> Dict[str, Any]:
        """Get agent states for a session."""
        session = self.get_session(session_id)
        return session.agent_states if session else {}
    
    # ─── UTILITIES ────────────────────────────────────────────────────────────
    
    def _generate_id(self, prefix: str) -> str:
        """Generate a unique ID."""
        timestamp = datetime.utcnow().isoformat()
        hash_input = f"{prefix}_{timestamp}_{os.urandom(8).hex()}"
        return f"{prefix}_{hashlib.sha256(hash_input.encode()).hexdigest()[:12]}"
    
    def export_session(self, session_id: str) -> Dict[str, Any]:
        """Export a complete session with all conversations."""
        session = self.get_session(session_id)
        if session is None:
            return None
        
        conversations = []
        for conv_id in session.conversation_ids:
            conv = self.get_conversation(conv_id)
            if conv:
                conversations.append({
                    "id": conv.id,
                    "title": conv.title,
                    "mode": conv.mode,
                    "messages": [asdict(m) for m in conv.messages],
                    "created_at": conv.created_at,
                    "updated_at": conv.updated_at
                })
        
        return {
            "session": asdict(session),
            "conversations": conversations,
            "exported_at": datetime.utcnow().isoformat()
        }


# ═══════════════════════════════════════════════════════════════════════════════
# GLOBAL INSTANCE
# ═══════════════════════════════════════════════════════════════════════════════

persistence = PersistenceManager()


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "Message",
    "Conversation",
    "Session",
    "PersistenceManager",
    "persistence",
]

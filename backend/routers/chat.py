from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
import models
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.orchestrator import run_agent, AGENTS, detect_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message   : str
    agent     : str = "auto"  # auto-detect or specify agent

class ChatResponse(BaseModel):
    message    : str
    response   : str
    agent_used : str
    agent_name : str
    tokens_used: int

@router.post("/chat", response_model=ChatResponse)
def chat(
    request : ChatRequest,
    current_user = Depends(get_current_user),
    db      : Session = Depends(get_db)
):
    # Run the agent
    result = run_agent(request.message, request.agent)

    # Save to database — YOUR data, not Claude's!
    chat_record = models.Chat(
        user_id    = current_user.id,
        message    = request.message,
        response   = result["response"],
        agent_used = result["agent"],
        tokens_used= result["tokens"]
    )
    db.add(chat_record)
    db.commit()

    # Save to search history
    search_record = models.SearchHistory(
        user_id    = current_user.id,
        query      = request.message,
        result     = result["response"][:500],
        agent_used = result["agent"]
    )
    db.add(search_record)
    db.commit()

    return ChatResponse(
        message    = request.message,
        response   = result["response"],
        agent_used = result["agent"],
        agent_name = result["agent_name"],
        tokens_used= result["tokens"]
    )

@router.get("/agents")
def get_agents():
    """List all available agents"""
    return {
        "total" : len(AGENTS),
        "agents": [
            {
                "id"    : key,
                "name"  : val["name"],
                "skills": val["skills"]
            }
            for key, val in AGENTS.items()
        ]
    }

@router.get("/history")
def get_chat_history(
    current_user = Depends(get_current_user),
    db: Session  = Depends(get_db)
):
    chats = db.query(models.Chat).filter(
        models.Chat.user_id == current_user.id
    ).order_by(models.Chat.created_at.desc()).limit(50).all()

    return {
        "user"        : current_user.username,
        "total_chats" : len(chats),
        "chats"       : [
            {
                "id"        : c.id,
                "message"   : c.message,
                "response"  : c.response[:200] + "...",
                "agent"     : c.agent_used,
                "tokens"    : c.tokens_used,
                "time"      : c.created_at
            } for c in chats
        ]
    }

@router.get("/detect-agent")
def detect(message: str):
    """See which agent would handle a message"""
    agent_name = detect_agent(message)
    agent      = AGENTS[agent_name]
    return {
        "message"   : message,
        "agent"     : agent_name,
        "agent_name": agent["name"],
        "skills"    : agent["skills"]
    }
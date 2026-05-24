from fastapi import APIRouter
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.orchestrator import run_agent, AGENTS, detect_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message     : str
    agent       : str = "auto"
    system_prompt: str = None

class ChatResponse(BaseModel):
    message    : str
    response   : str
    agent_used : str
    agent_name : str
    tokens_used: int

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = run_agent(
        request.message,
        request.agent,
        system_prompt=request.system_prompt
    )
    return ChatResponse(
        message    = request.message,
        response   = result["response"],
        agent_used = result["agent"],
        agent_name = result["agent_name"],
        tokens_used= result["tokens"]
    )

@router.get("/agents")
def get_agents():
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

@router.get("/detect-agent")
def detect(message: str):
    agent_name = detect_agent(message)
    agent      = AGENTS[agent_name]
    return {
        "message"   : message,
        "agent"     : agent_name,
        "agent_name": agent["name"],
        "skills"    : agent["skills"]
    }

print("✅ Chat Router ready!")
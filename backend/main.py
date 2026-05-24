from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from database import engine, Base
from routers import chat   as chat_router
from routers import resume as resume_router
import models
import os
from dotenv import load_dotenv

load_dotenv()

# ---- Create all database tables ----
Base.metadata.create_all(bind=engine)

# ---- Initialize App ----
app = FastAPI(
    title      = "FRIDAY AI Platform",
    description= "Your personal AI assistant with 12 specialized agents",
    version    = "1.0.0"
)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(chat_router.router,
    prefix="/api",        tags=["Chat & Agents"])
app.include_router(resume_router.router,
    prefix="/api/resume", tags=["Resume & Jobs"])

# ---- Routes ----
@app.get("/")
def home():
    return {
        "name"   : "FRIDAY AI Platform",
        "version": "1.0.0",
        "status" : "🟢 Online",
        "agents" : 12,
        "message": "Welcome to FRIDAY — Your Personal AI Assistant"
    }

@app.get("/health")
def health():
    return {
        "status"   : "healthy",
        "timestamp": datetime.utcnow(),
        "database" : "connected"
    }

print("✅ FRIDAY API ready!")
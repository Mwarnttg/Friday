from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
from database import engine, get_db, Base
from routers import chat as chat_router  # ← ADD THIS
from fastapi.security import OAuth2PasswordRequestForm
from routers import resume as resume_router
import models
import auth
import os
from dotenv import load_dotenv

load_dotenv()

# ---- Create all database tables ----
Base.metadata.create_all(bind=engine)

# ---- Initialize App ----
app = FastAPI(
    title="FRIDAY AI Platform",
    description="Your personal AI assistant with 25 specialized agents",
    version="1.0.0"
)

# ---- CORS — allows React frontend to talk to backend ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # in production: your domain only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)
app.include_router(chat_router.router, prefix="/api", tags=["Chat & Agents"])
app.include_router(resume_router.router, prefix="/api/resume", tags=["Resume & Jobs"])

# ---- Pydantic Schemas ---- 
class UserRegister(BaseModel):
    email     : str
    username  : str
    password  : str
    full_name : str

class UserLogin(BaseModel):
    email    : str
    password : str

class UserResponse(BaseModel):
    id        : int
    email     : str
    username  : str
    full_name : str
    created_at: datetime

    class Config:
        from_attributes = True

# ---- Routes ----
@app.get("/")
def home():
    return {
        "name"   : "FRIDAY AI Platform",
        "version": "1.0.0",
        "status" : "🟢 Online",
        "agents" : 25,
        "message": "Welcome to FRIDAY — Your Personal AI Assistant"
    }

@app.get("/health")
def health():
    return {
        "status"   : "healthy",
        "timestamp": datetime.utcnow(),
        "database" : "connected"
    }

# ---- AUTH ROUTES ----
@app.post("/auth/register", response_model=UserResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(models.User).filter(
            models.User.email == user.email).first():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if username exists
    if db.query(models.User).filter(
            models.User.username == user.username).first():
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create new user
    new_user = models.User(
        email     = user.email,
        username  = user.username,
        password  = auth.hash_password(user.password),
        full_name = user.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/auth/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user — form_data.username is the email
    db_user = db.query(models.User).filter(
        models.User.email == form_data.username).first()

    # Verify password
    if not db_user or not auth.verify_password(
            form_data.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    token = auth.create_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type"  : "bearer",
        "expires_days": 15,
        "user": {
            "id"      : db_user.id,
            "email"   : db_user.email,
            "username": db_user.username,
            "name"    : db_user.full_name
        }
    }

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user = Depends(auth.get_current_user)):
    return current_user

@app.get("/users/history")
def get_history(
    current_user = Depends(auth.get_current_user),
    db: Session  = Depends(get_db)
):
    chats = db.query(models.Chat).filter(
        models.Chat.user_id == current_user.id
    ).order_by(models.Chat.created_at.desc()).limit(50).all()
    
    return {
        "user"  : current_user.username,
        "total" : len(chats),
        "chats" : [
            {
                "message"   : c.message,
                "response"  : c.response[:100] + "...",
                "agent"     : c.agent_used,
                "time"      : c.created_at
            } for c in chats
        ]
    }

print("✅ FRIDAY API ready!")
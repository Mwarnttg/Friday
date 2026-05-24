from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String, unique=True, index=True)
    username     = Column(String, unique=True, index=True)
    password     = Column(String)
    full_name    = Column(String)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    
    chats        = relationship("Chat", back_populates="user")
    searches     = relationship("SearchHistory", back_populates="user")

class Chat(Base):
    __tablename__ = "chats"
    
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    message      = Column(Text)
    response     = Column(Text)
    agent_used   = Column(String)
    tokens_used  = Column(Integer, default=0)
    created_at   = Column(DateTime, default=datetime.utcnow)
    
    user         = relationship("User", back_populates="chats")

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    query        = Column(Text)
    result       = Column(Text)
    agent_used   = Column(String)
    created_at   = Column(DateTime, default=datetime.utcnow)
    
    user         = relationship("User", back_populates="searches")

class AgentConfig(Base):
    __tablename__ = "agent_configs"
    
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    agent_name   = Column(String)
    is_active    = Column(Boolean, default=True)
    custom_prompt= Column(Text)
    created_at   = Column(DateTime, default=datetime.utcnow)

print("✅ Models ready!")
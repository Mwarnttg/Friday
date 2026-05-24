from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
import os
from dotenv import load_dotenv

load_dotenv()

# ---- Security Setup ----
SECRET_KEY    = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM     = "HS256"
EXPIRE_DAYS   = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", 15))

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ---- Password Functions ----
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ---- JWT Functions ----
def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(days=EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# ---- Get Current User ----
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = decode_token(token)
    email   = payload.get("sub")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(
        models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

print("✅ Auth system ready!")
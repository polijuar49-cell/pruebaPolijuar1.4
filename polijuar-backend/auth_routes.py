// auth_routes.py - authentication endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from models_user import User
from database import get_db
from sqlalchemy.orm import Session
from auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
)

router = APIRouter()

class Token(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer")

class UserCreate(BaseModel):
    username: str = Field(..., max_length=150)
    password: str = Field(..., min_length=6)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token(data={"sub": db_user.username})
    return Token(access_token=access_token, token_type="bearer")

@router.post("/login", response_model=Token, tags=["Auth"])
def login(form_data: UserCreate, db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = create_access_token(data={"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")

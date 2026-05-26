from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from jose import JWTError, jwt

from models_user import User
from database import get_db
from sqlalchemy.orm import Session
from auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM,
)

router = APIRouter()

class Token(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = Field(default="bearer")

class UserCreate(BaseModel):
    username: str = Field(..., max_length=150)
    password: str = Field(..., min_length=6)

class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token issued at login")

@router.post(
    "/refresh",
    response_model=Token,
    tags=["Auth"],
)
def refresh_token_endpoint(request: RefreshRequest, db: Session = Depends(get_db)):
    """Validate refresh token and issue new access and refresh tokens."""
    try:
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    # Ensure user still exists
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access = create_access_token(data={"sub": username})
    new_refresh = create_refresh_token(data={"sub": username})
    return Token(access_token=new_access, refresh_token=new_refresh, token_type="bearer")

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user and return JWT access and refresh tokens."""
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token(data={"sub": db_user.username})
    refresh_token = create_refresh_token(data={"sub": db_user.username})
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@router.post(
    "/login",
    response_model=Token,
    tags=["Auth"],
)
def login(form_data: UserCreate, db: Session = Depends(get_db)):
    """Authenticate a user and issue JWT access and refresh tokens."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

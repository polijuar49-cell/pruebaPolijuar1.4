from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base

# SQLAlchemy User model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    # relationships can be added later

# Pydantic schemas
class UserBase(BaseModel):
    username: str = Field(..., max_length=150, examples=["juan"])
    is_admin: bool = False
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, examples=["secret123"])

class UserResponse(UserBase):
    id: int

from pydantic import BaseModel, Field, ConfigDict

class UserBase(BaseModel):
    username: str = Field(..., max_length=150, examples=["juan"])
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, examples=["secret123"])

class UserResponse(UserBase):
    id: int

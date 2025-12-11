from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    phone: str

class UserLogin(UserBase):
    phone: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

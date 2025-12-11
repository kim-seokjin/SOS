from pydantic import BaseModel, ConfigDict, Field

class GameRecordCreate(BaseModel):
    clearTimeMs: int = Field(..., description="Clear time in milliseconds")

class GameRecordResponse(BaseModel):
    success: bool
    rank: int

class MyRankResponse(BaseModel):
    rank: int
    record: str  # Formatted as "45.20"
    
    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict

class RankingItem(BaseModel):
    rank: int
    name: str
    record: str
    date: str
    
    model_config = ConfigDict(from_attributes=True)

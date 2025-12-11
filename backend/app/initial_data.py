import asyncio
from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.game import GameRecord

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")

if __name__ == "__main__":
    asyncio.run(init_models())

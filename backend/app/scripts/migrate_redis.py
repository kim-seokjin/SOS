import asyncio
import sys
import os

# Add backend directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import func
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.models.game import GameRecord
from app.core.redis import redis_client

async def migrate_data():
    print("Starting migration to Redis...")
    async with async_session_maker() as db:
        # Get best record for each user
        subquery = (
            select(
                GameRecord.user_id,
                func.min(GameRecord.clear_time_ms).label("best_time")
            )
            .group_by(GameRecord.user_id)
            .subquery()
        )
        
        query = select(subquery.c.user_id, subquery.c.best_time)
        result = await db.execute(query)
        rows = result.all()
        
        count = 0
        for row in rows:
            # ZADD game_ranks <score> <member>
            # Score is clear_time (lower is better), Member is user_id
            await redis_client.zadd("game_ranks", {str(row.user_id): row.best_time})
            count += 1
            
        print(f"Migrated {count} user records to Redis 'game_ranks'.")

if __name__ == "__main__":
    asyncio.run(migrate_data())

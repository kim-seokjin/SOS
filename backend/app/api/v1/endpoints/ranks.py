from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.game import GameRecord
from app.schemas.game import MyRankResponse
from app.schemas.game import MyRankResponse
from app.api import deps

router = APIRouter()

@router.get("/my", response_model=MyRankResponse)
async def get_my_rank(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.core.redis import redis_client
    
    # 1. Get Rank and Score from Redis
    rank_index = await redis_client.zrank("game_ranks", str(current_user.id))
    score = await redis_client.zscore("game_ranks", str(current_user.id))

    if rank_index is None or score is None:
        return {"rank": 0, "record": "0.00"}

    return {
        "rank": rank_index + 1,
        "record": f"{score / 1000:.2f}"
    }

from typing import List
from app.schemas.ranking import RankingItem, RankingListResponse
from app.utils.masking import mask_name
from app.core.redis import redis_client

@router.get("", response_model=RankingListResponse)
async def get_ranks(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    # 1. Get Range from Redis
    # Returns list of (member, score) tuples
    top_records = await redis_client.zrange("game_ranks", skip, skip + limit - 1, withscores=True)
    
    total_count = await redis_client.zcard("game_ranks")

    ranking_list = []
    if top_records:
        user_ids = [int(uid) for uid, _ in top_records]
        
        # 2. Get User Details
        user_query = select(User).where(User.id.in_(user_ids))
        user_result = await db.execute(user_query)
        users = {user.id: user for user in user_result.scalars().all()}
        
        # 3. Get Dates (Optional but good for UI) - optimized: get best record date for these users
        # We want the date of the record that matches the score.
        # Construct a query to get metadata for these specific user/score pairs?
        # Simpler: Get latest game date for these users? Or just fetch best record.
        # Let's do a bulk query for GameRecords matching user_id and approximate time?
        # Actually, let's just do N small queries or one IN query.
        # Since standard is "best time", let's query the specific best time record for each.
        
        # Optimization: Fetch one record per user where clear_time matches score.
        # Since we have the score (clear_time_ms) from Redis.
        
        for i, (uid_str, score) in enumerate(top_records):
            uid = int(uid_str)
            user_obj = users.get(uid)
            name = user_obj.name if user_obj else "Unknown"
            
            # Fetch date for this record (best effort)
            date_str = ""
            try:
                # Find exactly this record
                record_query = select(GameRecord.played_at).where(
                    GameRecord.user_id == uid,
                    GameRecord.clear_time_ms == int(score) # score in Redis is float, but we stored int? Redis stores float.
                    # We stored int `clearTimeMs` passed to zadd.
                ).limit(1)
                record_result = await db.execute(record_query)
                record_date = record_result.scalar()
                if record_date:
                    date_str = record_date.strftime("%Y-%m-%d")
            except Exception:
                pass

            ranking_list.append({
                "rank": skip + i + 1,
                "userId": str(uid),
                "name": mask_name(name),
                "record": f"{score / 1000:.2f}",
                "date": date_str
            })

    return {
        "items": ranking_list,
        "total": total_count
    }


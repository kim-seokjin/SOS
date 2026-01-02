from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.game import GameRecord
from app.schemas.game import GameRecordCreate, GameRecordResponse, GameHistoryResponse
from app.api import deps
from app.core.config import settings

router = APIRouter()

@router.get("/hidden-message", response_model=dict)
async def get_hidden_message(
    current_user: User = Depends(deps.get_current_user),
):
    from app.core.redis import redis_client

    # Check rank via Redis (0-indexed, so 0 is Rank 1)
    rank_index = await redis_client.zrank("game_ranks", str(current_user.id))

    if rank_index is None:
        raise HTTPException(status_code=403, detail="게임 기록이 없습니다.")

    if rank_index != 0:
         raise HTTPException(status_code=403, detail="1등만 히든 메시지를 확인할 수 있습니다.")

    return {"messages": settings.HIDDEN_MESSAGES}

@router.get("/history", response_model=GameHistoryResponse)
async def get_my_game_history(
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "date",
    order: str = "desc",
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Get total count
    count_query = select(func.count()).select_from(GameRecord).where(GameRecord.user_id == current_user.id)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # 2. Prepare sorting
    sort_column = GameRecord.played_at
    if sort_by == "record":
        sort_column = GameRecord.clear_time_ms
    
    order_clause = sort_column.desc()
    if order == "asc":
        order_clause = sort_column.asc()

    # 3. Get paginated records
    query = (
        select(GameRecord)
        .where(GameRecord.user_id == current_user.id)
        .order_by(order_clause)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    records = result.scalars().all()

    history_list = []
    for record in records:
        # Calculate Personal Rank: How many of MY records are better than this one?
        rank_query = select(func.count()).select_from(GameRecord).where(
            GameRecord.user_id == current_user.id,
            GameRecord.clear_time_ms < record.clear_time_ms
        )
        rank_result = await db.execute(rank_query)
        better_count = rank_result.scalar()
        personal_rank = better_count + 1

        history_list.append({
            "rank": personal_rank,
            "record": f"{record.clear_time_ms / 1000:.2f}",
            "date": record.played_at.isoformat() if record.played_at else "-"
        })

    return {
        "items": history_list,
        "total": total
    }

import logging
import time

logger = logging.getLogger(__name__)

# ... (Imports remain same)

@router.post("/record", response_model=GameRecordResponse, status_code=201)
async def create_game_record(
    record_in: GameRecordCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Abuse prevention
    if record_in.clearTimeMs < 2000:
        logger.warning(f"Suspicious record attempt: User {current_user.id} - {record_in.clearTimeMs}ms")
        raise HTTPException(status_code=400, detail="유효하지 않은 기록입니다.")

    # Capture user_id before commit to avoid MissingGreenlet error (lazy load after commit)
    user_id = current_user.id

    # Save record
    game_record = GameRecord(
        user_id=user_id,
        clear_time_ms=record_in.clearTimeMs
    )
    db.add(game_record)
    await db.commit()
    await db.refresh(game_record)
    
    logger.info(f"Game record created: User {user_id} - {record_in.clearTimeMs}ms")

    # Calculate rank using Redis
    from app.core.redis import redis_client
    
    # Update Redis ZSET (Only keep best time - lower is better)
    # ZADD with 'lt' (Less Than) option only updates if new score is less than existing score.
    # 'ch' (Changed) option makes it return number of keys changed (added or updated)
    changed = await redis_client.zadd("game_ranks", {str(user_id): record_in.clearTimeMs}, lt=True, ch=True)
    
    # Get Rank (0-based index)
    rank_index = await redis_client.zrank("game_ranks", str(user_id))
    rank = rank_index + 1

    # Broadcast ranking update
    # Only broadcast if:
    # 1. The user is in the top 10
    # 2. The record was actually updated (improved) or added (changed > 0)
    if rank <= 10 and changed > 0:
        from app.core.socket import sio
        from app.utils.masking import mask_name
        
        # 1. Get Top 10 from Redis
        # Returns list of (member, score) tuples
        top_records = await redis_client.zrange("game_ranks", 0, 9, withscores=True)
        
        if top_records:
            # ... (Logic remains same)
            # 2. Get User Details from DB
            user_ids = [int(uid) for uid, _ in top_records]
            
            # Fetch users in bulk
            user_query = select(User).where(User.id.in_(user_ids))
            user_result = await db.execute(user_query)
            users = {user.id: user for user in user_result.scalars().all()}
            
            # 3. Build Ranking List
            ranking_list = []
            for i, (uid_str, score) in enumerate(top_records):
                uid = int(uid_str)
                user_obj = users.get(uid)
                name = user_obj.name if user_obj else "Unknown"
                
                # Fetch date for this record (best effort)
                date_str = ""
                try:
                    record_query = select(GameRecord.played_at).where(
                        GameRecord.user_id == uid,
                        GameRecord.clear_time_ms == int(score)
                    ).limit(1)
                    record_result = await db.execute(record_query)
                    record_date = record_result.scalar()
                    if record_date:
                        date_str = record_date.strftime("%Y-%m-%d")
                except Exception:
                    pass
                
                ranking_list.append({
                    "rank": i + 1,
                    "userId": str(uid),
                    "name": mask_name(name),
                    "record": f"{score / 1000:.2f}",
                    "date": date_str
                })
            
            await sio.emit('ranking_update', ranking_list, namespace='/ranking')
            logger.info(f"Ranking broadcast sent for User {user_id} (Rank {rank})")

    return {"success": True, "rank": rank}

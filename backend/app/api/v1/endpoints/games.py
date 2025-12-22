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

from app.core.config import settings

router = APIRouter()

@router.get("/hidden-message", response_model=dict)
async def get_hidden_message(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Security check: Ensure user is actually rank 1
    
    # 1. Get user's best time
    user_best_query = select(func.min(GameRecord.clear_time_ms)).where(GameRecord.user_id == current_user.id)
    result = await db.execute(user_best_query)
    user_best_time = result.scalar()

    if user_best_time is None:
        raise HTTPException(status_code=403, detail="게임 기록이 없습니다.")

    # 2. Check if this is the global best time
    # We want to ensure no one has a better time (strictly less)
    
    # Subquery for best time of each user
    subquery = (
        select(
            GameRecord.user_id, 
            func.min(GameRecord.clear_time_ms).label("best_time")
        )
        .group_by(GameRecord.user_id)
        .subquery()
    )
    
    # Count how many users have a better time
    count_query = select(func.count()).select_from(subquery).where(subquery.c.best_time < user_best_time)
    count_result = await db.execute(count_query)
    better_count = count_result.scalar()
    
    if better_count > 0:
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

@router.post("/record", response_model=GameRecordResponse, status_code=201)
async def create_game_record(
    record_in: GameRecordCreate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Abuse prevention
    if record_in.clearTimeMs < 2000:
        raise HTTPException(status_code=400, detail="유효하지 않은 기록입니다.")

    # Save record
    game_record = GameRecord(
        user_id=current_user.id,
        clear_time_ms=record_in.clearTimeMs
    )
    db.add(game_record)
    await db.commit()
    await db.refresh(game_record)

    # Calculate rank
    # Rank = (count of distinct users with better time) + 1
    # Better time means distinct(user_id) where min(clear_time_ms) < current_record
    
    # Simple Rank Logic for now: Count all records better than this one? 
    # PRD says "Team Rank" or "My Rank"?
    # "현재 유저의 전체 랭킹을 계산하여 반환" -> Global Rank.
    # Usually rank is based on BEST time per user.
    
    # 1. Get best time for each user
    subquery = (
        select(
            GameRecord.user_id, 
            func.min(GameRecord.clear_time_ms).label("best_time")
        )
        .group_by(GameRecord.user_id)
        .subquery()
    )
    
    # 2. Count users with better time
    query = select(func.count()).select_from(subquery).where(subquery.c.best_time < record_in.clearTimeMs)
    result = await db.execute(query)
    better_count = result.scalar()
    
    rank = better_count + 1

    # Broadcast ranking update
    # Only broadcast if the new record is within top 10
    if rank <= 10:
        from app.core.socket import sio
        from app.utils.masking import mask_name
        
        # 1. Get Top 10
        limit = 10
        subquery = (
            select(
                GameRecord.user_id,
                func.min(GameRecord.clear_time_ms).label("best_time"),
                func.max(GameRecord.played_at).label("last_played_at")
            )
            .group_by(GameRecord.user_id)
            .subquery()
        )

        query = (
            select(subquery.c.user_id, subquery.c.best_time, subquery.c.last_played_at, User.name)
            .join(User, subquery.c.user_id == User.id)
            .order_by(subquery.c.best_time.asc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        rows = result.all()
        
        ranking_list = []
        for index, row in enumerate(rows):
            ranking_list.append({
                "rank": index + 1,
                "userId": str(row.user_id),
                "name": mask_name(row.name),
                "record": f"{row.best_time / 1000:.2f}",
                "date": row.last_played_at.strftime("%Y-%m-%d") if row.last_played_at else ""
            })
        
        await sio.emit('ranking_update', ranking_list, namespace='/ranking')

    return {"success": True, "rank": rank}

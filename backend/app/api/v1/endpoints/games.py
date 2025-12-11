from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.game import GameRecord
from app.schemas.game import GameRecordCreate, GameRecordResponse
from app.api.v1.endpoints import auth
from app.core import security
from jose import jwt, JWTError
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.SOS_API_PREFIX}/auth/signin")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/record", response_model=GameRecordResponse, status_code=201)
async def create_game_record(
    record_in: GameRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Abuse prevention
    if record_in.clearTimeMs < 2000:
        raise HTTPException(status_code=400, detail="Invalid record time")

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
    from app.core.socket import sio
    from app.utils.masking import mask_name
    
    # Check if this record is likely to be in top 30 (for broadcast)
    # For now, just broadcast top 10 every time.
    
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
        select(subquery.c.best_time, subquery.c.last_played_at, User.name)
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
            "name": mask_name(row.name),
            "record": f"{row.best_time / 1000:.2f}",
            "date": row.last_played_at.strftime("%Y-%m-%d") if row.last_played_at else ""
        })
    
    await sio.emit('ranking_update', ranking_list, namespace='/ranking')

    return {"success": True, "rank": rank}

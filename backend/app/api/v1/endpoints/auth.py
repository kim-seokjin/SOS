from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserCreate
from app.schemas.token import Token
from app.core import security
from app.core.config import settings
from datetime import timedelta

router = APIRouter()

@router.post("/signin", response_model=Token)
async def signin(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.phone == user_in.phone))
    user = result.scalars().first()

    if not user:
        # Create new user
        user = User(name=user_in.name, phone=user_in.phone)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "accessToken": access_token,
        "token_type": "bearer",
        "user": user
    }

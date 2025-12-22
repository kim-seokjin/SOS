
import asyncio
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.future import select

from app.db.session import SessionLocal
from app.models.user import User
from app.models.game import GameRecord

async def seed_data():
    async with SessionLocal() as db:
        # 1. User check
        query = select(User).where(User.name == "김유저", User.phone == "010-1234-1234")
        result = await db.execute(query)
        user = result.scalar()

        if not user:
            print("User 김유저 not found!")
            return

        print(f"Found user: {user.name} (ID: {user.id})")

        # 2. Generate 100 records
        records = []
        now = datetime.now(timezone.utc)
        
        for i in range(100):
            # Random clear time between 20.00s and 60.00s
            clear_time = int(random.uniform(20.00, 60.00) * 1000)
            
            # Random date within last 30 days
            days_ago = random.randint(0, 30)
            seconds_ago = random.randint(0, 86400)
            played_at = now - timedelta(days=days_ago, seconds=seconds_ago)

            record = GameRecord(
                user_id=user.id,
                clear_time_ms=clear_time,
                played_at=played_at
            )
            db.add(record)
        
        username = user.name
        await db.commit()
        print(f"successfully added 100 records for user {username}")

if __name__ == "__main__":
    asyncio.run(seed_data())

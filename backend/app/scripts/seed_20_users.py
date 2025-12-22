
import asyncio
import random
import sys
import os

# Add backend directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime
from sqlalchemy.future import select
from app.db.session import SessionLocal
from app.models.user import User
from app.models.game import GameRecord
from app.core.redis import redis_client

async def seed_users_and_records():
    async with SessionLocal() as db:
        print("Starting seed process for 20 users...")
        
        for i in range(1, 21):
            name = f"플레이어{i}"
            phone = f"010-0000-{i:04d}"
            
            # Check if user exists
            result = await db.execute(select(User).where(User.phone == phone))
            user = result.scalar()
            
            if not user:
                # Create User
                user = User(name=name, phone=phone)
                db.add(user)
                await db.commit()
                await db.refresh(user)
            
            # Capture user_id before commit
            user_id = user.id
            
            # Create Record (Random time between 30s and 40s)
            clear_time = int(random.uniform(30.00, 40.00) * 1000)
            record = GameRecord(
                user_id=user_id,
                clear_time_ms=clear_time,
                played_at=datetime.now()
            )
            db.add(record)
            await db.commit()
            
            # Update Redis
            await redis_client.zadd("game_ranks", {str(user_id): clear_time}, lt=True)
            
            print(f"Created {name} (ID: {user_id}) with record: {clear_time/1000:.2f}s")

        print("Done! 20 users seeded.")

if __name__ == "__main__":
    asyncio.run(seed_users_and_records())

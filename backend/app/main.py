from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.socket import sio
import socketio

from contextlib import asynccontextmanager
import os
from app.db.base import Base
from app.db.session import engine
from app.core.logger import setup_logging
from app.core.middleware.logging_middleware import LoggingMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup Logging
    setup_logging()
    
    # Ensure data directory exists (only for SQLite)
    if settings.DATABASE_URL.startswith("sqlite"):
        os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")), exist_ok=True)
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.SOS_API_PREFIX}/openapi.json",
    lifespan=lifespan
)

# Add Middleware
app.add_middleware(LoggingMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.SOS_API_PREFIX)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Mount Socket.IO app
# Using mount() allows us to run 'app' as the single entry point
# We set socketio_path="" because the mount path "/socket.io" is already stripped by FastAPI
socket_app = socketio.ASGIApp(sio, socketio_path="")
app.mount("/socket.io", socket_app)


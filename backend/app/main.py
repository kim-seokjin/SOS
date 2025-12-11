from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.socket import sio
import socketio

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.SOS_API_PREFIX}/openapi.json")

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


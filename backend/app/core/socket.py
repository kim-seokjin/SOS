import socketio

# Create a Socket.IO server
# cors_allowed_origins='*' allows all origins for development
from app.core.config import settings

mgr = socketio.AsyncRedisManager(settings.REDIS_URL)
sio = socketio.AsyncServer(async_mode='asgi', client_manager=mgr, cors_allowed_origins='*', logger=True, engineio_logger=True)


# Create an ASGI app
socket_app = socketio.ASGIApp(sio)

@sio.on('connect', namespace='/ranking')
async def connect(sid, environ):
    pass


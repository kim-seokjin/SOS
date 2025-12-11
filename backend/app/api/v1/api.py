from fastapi import APIRouter
from app.api.v1.endpoints import auth, games, ranks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(games.router, prefix="/games", tags=["games"])
api_router.include_router(ranks.router, prefix="/ranks", tags=["ranks"])

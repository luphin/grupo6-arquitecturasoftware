"""
Router principal de API v1
"""

from fastapi import APIRouter
from app.api.v1.endpoints import moderation, blacklist, admin, health

# Router principal v1
api_router = APIRouter()

# Incluir routers de endpoints
api_router.include_router(
    health.router,
    tags=["health"]
)

api_router.include_router(
    moderation.router,
    prefix="/moderation",
    tags=["moderation"]
)

api_router.include_router(
    blacklist.router,
    prefix="/blacklist",
    tags=["blacklist"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

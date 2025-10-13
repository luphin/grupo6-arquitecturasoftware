"""
Endpoints de health check
"""

from fastapi import APIRouter, Depends
from datetime import datetime

from app.schemas.common import HealthResponse
from app.config.database import mongodb
from app.config.cache import redis_cache
from app.config.events import rabbitmq
from app.config.settings import settings

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Verifica el estado del servicio y sus dependencias"
)
async def health_check():
    """
    Health check del servicio
    
    Verifica:
    - Estado del servicio
    - Conexión a MongoDB
    - Conexión a Redis
    - Conexión a RabbitMQ
    """
    dependencies = {}
    
    # Verificar MongoDB
    try:
        if mongodb.client:
            await mongodb.client.admin.command('ping')
            dependencies["mongodb"] = "connected"
        else:
            dependencies["mongodb"] = "disconnected"
    except Exception as e:
        dependencies["mongodb"] = f"error: {str(e)}"
    
    # Verificar Redis
    try:
        if redis_cache.redis:
            await redis_cache.redis.ping()
            dependencies["redis"] = "connected"
        else:
            dependencies["redis"] = "disconnected"
    except Exception as e:
        dependencies["redis"] = f"error: {str(e)}"
    
    # Verificar RabbitMQ
    try:
        if await rabbitmq.health_check():
            dependencies["rabbitmq"] = "connected"
        else:
            dependencies["rabbitmq"] = "disconnected"
    except Exception as e:
        dependencies["rabbitmq"] = f"error: {str(e)}"
    
    # Determinar estado general
    all_connected = all(
        status == "connected" 
        for status in dependencies.values()
    )
    
    status_value = "healthy" if all_connected else "degraded"
    
    return HealthResponse(
        status=status_value,
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow().isoformat(),
        dependencies=dependencies
    )


@router.get(
    "/ping",
    summary="Ping",
    description="Endpoint simple para verificar que el servicio está vivo"
)
async def ping():
    """Simple ping endpoint"""
    return {"status": "ok", "message": "pong"}

"""
Dependencies para FastAPI (Dependency Injection)
"""

from typing import AsyncGenerator
from fastapi import Depends, HTTPException, Header, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.database import get_database
from app.config.cache import get_cache, RedisCache
from app.config.events import get_event_bus, RabbitMQEventBus
from app.services.moderation_service import ModerationService
from app.config.settings import settings
from app.utils.logger import log


# ===== DATABASE DEPENDENCY =====

async def get_db() -> AsyncIOMotorDatabase:
    """
    Dependency para obtener la base de datos
    """
    return await get_database()


# ===== CACHE DEPENDENCY =====

async def get_cache_client() -> RedisCache:
    """
    Dependency para obtener el cliente de cache
    """
    return await get_cache()


# ===== EVENT BUS DEPENDENCY =====

async def get_event_bus_client() -> RabbitMQEventBus:
    """
    Dependency para obtener el event bus
    """
    return await get_event_bus()


# ===== MODERATION SERVICE DEPENDENCY =====

_moderation_service: ModerationService | None = None


async def get_moderation_service(
    db: AsyncIOMotorDatabase = Depends(get_db),
    cache: RedisCache = Depends(get_cache_client),
    event_bus: RabbitMQEventBus = Depends(get_event_bus_client)
) -> ModerationService:
    """
    Dependency para obtener el servicio de moderación (Singleton)
    """
    global _moderation_service
    
    if _moderation_service is None:
        _moderation_service = ModerationService(db, cache, event_bus)
        await _moderation_service.initialize()
        log.info("ModerationService singleton created")
    
    return _moderation_service


# ===== AUTHENTICATION/AUTHORIZATION (Opcional) =====

async def verify_api_key(
    x_api_key: str = Header(None, description="API Key para autenticación")
) -> str:
    """
    Verifica el API Key (para endpoints admin)
    
    Args:
        x_api_key: API Key del header
        
    Returns:
        API Key validado
        
    Raises:
        HTTPException: Si el API Key es inválido
    """
    if not settings.ADMIN_API_KEY:
        # Si no hay API Key configurado, permitir acceso (desarrollo)
        return "admin"
    
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key required"
        )
    
    if x_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    
    return x_api_key


# ===== RATE LIMITING (Opcional - Simple) =====

class RateLimiter:
    """Simple rate limiter usando Redis"""
    
    def __init__(self):
        self.enabled = settings.RATE_LIMIT_ENABLED
        self.requests_per_minute = settings.RATE_LIMIT_REQUESTS_PER_MINUTE
    
    async def check_rate_limit(
        self,
        identifier: str,
        cache: RedisCache
    ) -> bool:
        """
        Verifica rate limit
        
        Args:
            identifier: Identificador único (user_id, IP, etc.)
            cache: Cliente Redis
            
        Returns:
            True si está dentro del límite
        """
        if not self.enabled:
            return True
        
        key = f"rate_limit:{identifier}"
        
        # Obtener conteo actual
        current = await cache.get(key)
        
        if current is None:
            # Primera request
            await cache.set(key, 1, ttl=60)
            return True
        
        if int(current) >= self.requests_per_minute:
            return False
        
        # Incrementar contador
        await cache.increment(key)
        return True


rate_limiter = RateLimiter()


async def check_rate_limit(
    user_id: str = None,
    cache: RedisCache = Depends(get_cache_client)
):
    """
    Dependency para verificar rate limit
    
    Args:
        user_id: ID del usuario (opcional)
        cache: Cliente Redis
        
    Raises:
        HTTPException: Si excede el rate limit
    """
    if not rate_limiter.enabled:
        return
    
    identifier = user_id or "anonymous"
    
    is_allowed = await rate_limiter.check_rate_limit(identifier, cache)
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again later."
        )

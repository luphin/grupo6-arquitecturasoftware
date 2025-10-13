"""
Configuración y gestión de conexión a Redis (Cache)
"""

from redis import asyncio as aioredis
from typing import Optional, Any
import json
from datetime import timedelta
from app.config.settings import settings
from app.utils.logger import log
from app.utils.exceptions import CacheException


class RedisCache:
    """
    Gestor de conexión a Redis para cache
    """
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
    
    async def connect(self):
        """Establece conexión con Redis"""
        try:
            log.info(f"Connecting to Redis: {settings.REDIS_URL}")
            
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
                socket_connect_timeout=settings.REDIS_SOCKET_CONNECT_TIMEOUT,
                decode_responses=True,  # Decodificar respuestas automáticamente
                encoding="utf-8"
            )
            
            # Verificar conexión
            await self.redis.ping()
            
            log.info("✅ Connected to Redis")
            
        except Exception as e:
            log.error(f"❌ Failed to connect to Redis: {e}")
            raise CacheException(f"Redis connection failed: {e}")
    
    async def disconnect(self):
        """Cierra la conexión con Redis"""
        if self.redis:
            await self.redis.close()
            log.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Obtiene un valor del cache
        
        Args:
            key: Clave del cache
            
        Returns:
            Valor deserializado o None si no existe
        """
        try:
            value = await self.redis.get(key)
            if value is None:
                return None
            
            # Intentar deserializar JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                # Si no es JSON, retornar como string
                return value
                
        except Exception as e:
            log.error(f"Error getting key '{key}' from cache: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Guarda un valor en el cache
        
        Args:
            key: Clave del cache
            value: Valor a guardar (se serializa a JSON si es necesario)
            ttl: Tiempo de vida en segundos (None = sin expiración)
            
        Returns:
            True si se guardó exitosamente
        """
        try:
            # Serializar a JSON si no es string
            if not isinstance(value, str):
                value = json.dumps(value)
            
            if ttl:
                await self.redis.setex(key, ttl, value)
            else:
                await self.redis.set(key, value)
            
            return True
            
        except Exception as e:
            log.error(f"Error setting key '{key}' in cache: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Elimina una clave del cache
        
        Args:
            key: Clave a eliminar
            
        Returns:
            True si se eliminó
        """
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            log.error(f"Error deleting key '{key}' from cache: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Verifica si una clave existe"""
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            log.error(f"Error checking existence of key '{key}': {e}")
            return False
    
    async def get_ttl(self, key: str) -> Optional[int]:
        """Obtiene el TTL de una clave en segundos"""
        try:
            ttl = await self.redis.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            log.error(f"Error getting TTL for key '{key}': {e}")
            return None
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementa un contador"""
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            log.error(f"Error incrementing key '{key}': {e}")
            return None
    
    async def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrementa un contador"""
        try:
            return await self.redis.decrby(key, amount)
        except Exception as e:
            log.error(f"Error decrementing key '{key}': {e}")
            return None
    
    async def get_many(self, keys: list[str]) -> dict[str, Any]:
        """
        Obtiene múltiples valores del cache
        
        Args:
            keys: Lista de claves
            
        Returns:
            Diccionario {key: value}
        """
        try:
            if not keys:
                return {}
            
            values = await self.redis.mget(keys)
            result = {}
            
            for key, value in zip(keys, values):
                if value is not None:
                    try:
                        result[key] = json.loads(value)
                    except json.JSONDecodeError:
                        result[key] = value
            
            return result
            
        except Exception as e:
            log.error(f"Error getting multiple keys from cache: {e}")
            return {}
    
    async def set_many(
        self,
        mapping: dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """
        Guarda múltiples valores en el cache
        
        Args:
            mapping: Diccionario {key: value}
            ttl: Tiempo de vida en segundos
            
        Returns:
            True si se guardó exitosamente
        """
        try:
            pipeline = self.redis.pipeline()
            
            for key, value in mapping.items():
                if not isinstance(value, str):
                    value = json.dumps(value)
                
                if ttl:
                    pipeline.setex(key, ttl, value)
                else:
                    pipeline.set(key, value)
            
            await pipeline.execute()
            return True
            
        except Exception as e:
            log.error(f"Error setting multiple keys in cache: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Elimina todas las claves que coincidan con un patrón
        
        Args:
            pattern: Patrón (ej: "blacklist:*")
            
        Returns:
            Número de claves eliminadas
        """
        try:
            keys = []
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                return await self.redis.delete(*keys)
            return 0
            
        except Exception as e:
            log.error(f"Error deleting keys with pattern '{pattern}': {e}")
            return 0
    
    async def flush_all(self) -> bool:
        """Limpia todo el cache (¡usar con cuidado!)"""
        try:
            await self.redis.flushdb()
            log.warning("⚠️ Redis cache flushed")
            return True
        except Exception as e:
            log.error(f"Error flushing cache: {e}")
            return False
    
    async def get_stats(self) -> dict:
        """Obtiene estadísticas de Redis"""
        try:
            info = await self.redis.info()
            return {
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_commands_processed": info.get("total_commands_processed"),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "uptime_days": info.get("uptime_in_days"),
            }
        except Exception as e:
            log.error(f"Error getting Redis stats: {e}")
            return {}
    
    # ===== MÉTODOS ESPECÍFICOS PARA HASHES (útil para strikes) =====
    
    async def hset(self, key: str, field: str, value: Any) -> bool:
        """Guarda un campo en un hash"""
        try:
            if not isinstance(value, str):
                value = json.dumps(value)
            await self.redis.hset(key, field, value)
            return True
        except Exception as e:
            log.error(f"Error setting hash field '{field}' in '{key}': {e}")
            return False
    
    async def hget(self, key: str, field: str) -> Optional[Any]:
        """Obtiene un campo de un hash"""
        try:
            value = await self.redis.hget(key, field)
            if value is None:
                return None
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        except Exception as e:
            log.error(f"Error getting hash field '{field}' from '{key}': {e}")
            return None
    
    async def hgetall(self, key: str) -> dict:
        """Obtiene todos los campos de un hash"""
        try:
            data = await self.redis.hgetall(key)
            result = {}
            for field, value in data.items():
                try:
                    result[field] = json.loads(value)
                except json.JSONDecodeError:
                    result[field] = value
            return result
        except Exception as e:
            log.error(f"Error getting all hash fields from '{key}': {e}")
            return {}
    
    async def hdel(self, key: str, *fields: str) -> int:
        """Elimina campos de un hash"""
        try:
            return await self.redis.hdel(key, *fields)
        except Exception as e:
            log.error(f"Error deleting hash fields from '{key}': {e}")
            return 0


# Singleton instance
redis_cache = RedisCache()


async def get_cache() -> RedisCache:
    """
    Dependency para obtener la instancia del cache
    
    Usage:
        @router.get("/")
        async def endpoint(cache: RedisCache = Depends(get_cache)):
            await cache.get("key")
    """
    if redis_cache.redis is None:
        await redis_cache.connect()
    return redis_cache

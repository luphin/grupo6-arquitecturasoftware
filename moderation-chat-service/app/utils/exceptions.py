"""
Excepciones personalizadas del servicio
"""

from typing import Optional, Any, Dict


class ModerationServiceException(Exception):
    """Excepción base del servicio"""
    
    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code or "MODERATION_ERROR"
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(ModerationServiceException):
    """Errores relacionados con la base de datos"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "DATABASE_ERROR", details)


class CacheException(ModerationServiceException):
    """Errores relacionados con Redis/Cache"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "CACHE_ERROR", details)


class EventPublishException(ModerationServiceException):
    """Errores al publicar eventos"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "EVENT_PUBLISH_ERROR", details)


class ModerationEngineException(ModerationServiceException):
    """Errores en el motor de moderación"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "MODERATION_ENGINE_ERROR", details)


class BlacklistException(ModerationServiceException):
    """Errores relacionados con la lista negra"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "BLACKLIST_ERROR", details)


class StrikeException(ModerationServiceException):
    """Errores en el sistema de strikes"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "STRIKE_ERROR", details)


class ValidationException(ModerationServiceException):
    """Errores de validación"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, "VALIDATION_ERROR", details)


class NotFoundException(ModerationServiceException):
    """Recurso no encontrado"""
    def __init__(self, resource: str, identifier: str):
        message = f"{resource} not found: {identifier}"
        super().__init__(message, "NOT_FOUND", {"resource": resource, "id": identifier})


class UnauthorizedException(ModerationServiceException):
    """No autorizado"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, "UNAUTHORIZED")


class RateLimitException(ModerationServiceException):
    """Rate limit excedido"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "RATE_LIMIT_EXCEEDED")

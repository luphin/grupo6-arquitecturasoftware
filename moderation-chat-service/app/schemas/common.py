"""
Schemas comunes reutilizables
"""

from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Schema para respuestas de error"""
    
    error: str = Field(..., description="Código de error")
    message: str = Field(..., description="Mensaje de error")
    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Detalles adicionales del error"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "VALIDATION_ERROR",
                "message": "Invalid user_id format",
                "details": {"field": "user_id"}
            }
        }


class SuccessResponse(BaseModel):
    """Schema para respuestas exitosas simples"""
    
    success: bool = Field(default=True, description="Indica éxito")
    message: str = Field(..., description="Mensaje descriptivo")
    data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Datos adicionales"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {"id": "123"}
            }
        }


class PaginationParams(BaseModel):
    """Parámetros de paginación"""
    
    limit: int = Field(
        default=50,
        ge=1,
        le=100,
        description="Número máximo de resultados"
    )
    skip: int = Field(
        default=0,
        ge=0,
        description="Número de resultados a saltar"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "limit": 50,
                "skip": 0
            }
        }


class HealthResponse(BaseModel):
    """Schema para health check"""
    
    status: str = Field(..., description="Estado del servicio")
    version: str = Field(..., description="Versión del servicio")
    timestamp: str = Field(..., description="Timestamp ISO")
    dependencies: Dict[str, str] = Field(
        default_factory=dict,
        description="Estado de dependencias"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2025-10-13T10:30:00Z",
                "dependencies": {
                    "mongodb": "connected",
                    "redis": "connected",
                    "rabbitmq": "connected"
                }
            }
        }

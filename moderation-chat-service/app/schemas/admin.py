"""
Schemas para endpoints administrativos
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class BannedUserInfo(BaseModel):
    """Información de usuario baneado"""
    
    user_id: str = Field(..., description="ID del usuario")
    channel_id: str = Field(..., description="ID del canal")
    ban_type: str = Field(..., description="Tipo: temporary o permanent")
    banned_at: str = Field(..., description="Fecha de ban (ISO)")
    banned_until: Optional[str] = Field(
        default=None,
        description="Fecha de expiración (ISO)"
    )
    reason: str = Field(..., description="Razón del ban")
    total_violations: int = Field(..., ge=0, description="Total de violaciones")
    strike_count: int = Field(..., ge=0, description="Strikes actuales")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_789",
                "channel_id": "channel_abc",
                "ban_type": "temporary",
                "banned_at": "2025-10-13T10:00:00Z",
                "banned_until": "2025-10-14T10:00:00Z",
                "reason": "Excedió 3 strikes",
                "total_violations": 4,
                "strike_count": 3
            }
        }


class BannedUsersResponse(BaseModel):
    """Response con lista de usuarios baneados"""
    
    total: int = Field(..., description="Total de usuarios baneados")
    banned_users: List[BannedUserInfo] = Field(
        default_factory=list,
        description="Lista de usuarios baneados"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 5,
                "banned_users": [
                    {
                        "user_id": "user_789",
                        "channel_id": "channel_abc",
                        "ban_type": "temporary",
                        "banned_at": "2025-10-13T10:00:00Z",
                        "banned_until": "2025-10-14T10:00:00Z",
                        "reason": "Excedió 3 strikes",
                        "total_violations": 4,
                        "strike_count": 3
                    }
                ]
            }
        }


class ViolationInfo(BaseModel):
    """Información de violación"""
    
    id: str = Field(..., description="ID de la violación")
    message_id: str = Field(..., description="ID del mensaje")
    detected_words: List[str] = Field(
        default_factory=list,
        description="Palabras detectadas"
    )
    toxicity_score: float = Field(..., ge=0.0, le=1.0, description="Score de toxicidad")
    severity: str = Field(..., description="Severidad")
    action_taken: str = Field(..., description="Acción tomada")
    strike_count_at_time: int = Field(..., ge=0, description="Strikes en ese momento")
    timestamp: str = Field(..., description="Fecha (ISO)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "65f1a2b3c4d5e6f7g8h9i0j1",
                "message_id": "msg_123",
                "detected_words": ["idiota", "estúpido"],
                "toxicity_score": 0.85,
                "severity": "high",
                "action_taken": "warning",
                "strike_count_at_time": 2,
                "timestamp": "2025-10-13T10:30:00Z"
            }
        }


class UserViolationsResponse(BaseModel):
    """Response con historial de violaciones"""
    
    user_id: str = Field(..., description="ID del usuario")
    channel_id: str = Field(..., description="ID del canal")
    total_violations: int = Field(..., ge=0, description="Total de violaciones")
    current_strikes: int = Field(..., ge=0, description="Strikes actuales")
    is_banned: bool = Field(..., description="Si está baneado")
    violations: List[ViolationInfo] = Field(
        default_factory=list,
        description="Lista de violaciones"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_789",
                "channel_id": "channel_abc",
                "total_violations": 4,
                "current_strikes": 3,
                "is_banned": False,
                "violations": [
                    {
                        "id": "65f1a2b3c4d5e6f7g8h9i0j1",
                        "message_id": "msg_123",
                        "detected_words": ["idiota"],
                        "toxicity_score": 0.75,
                        "severity": "medium",
                        "action_taken": "warning",
                        "strike_count_at_time": 1,
                        "timestamp": "2025-10-13T10:30:00Z"
                    }
                ]
            }
        }


class UnbanUserRequest(BaseModel):
    """Request para desbanear usuario"""
    
    channel_id: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="ID del canal"
    )
    reason: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Razón del desbaneo"
    )
    reset_strikes: bool = Field(
        default=False,
        description="Si resetear los strikes también"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "channel_id": "channel_abc",
                "reason": "Apelación aceptada",
                "reset_strikes": False
            }
        }


class UserStatusResponse(BaseModel):
    """Response con estado completo del usuario"""
    
    user_id: str = Field(..., description="ID del usuario")
    channel_id: str = Field(..., description="ID del canal")
    strike_count: int = Field(..., ge=0, description="Strikes actuales")
    is_banned: bool = Field(..., description="Si está baneado")
    ban_info: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Información del ban"
    )
    violation_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Resumen de violaciones"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_789",
                "channel_id": "channel_abc",
                "strike_count": 2,
                "is_banned": False,
                "ban_info": None,
                "violation_summary": {
                    "total": 3,
                    "last_violation": "2025-10-13T10:30:00Z",
                    "by_severity": {
                        "low": 1,
                        "medium": 1,
                        "high": 1
                    }
                }
            }
        }


class ChannelStatsResponse(BaseModel):
    """Response con estadísticas de un canal"""
    
    channel_id: str = Field(..., description="ID del canal")
    total_violations: int = Field(..., ge=0, description="Total de violaciones")
    total_users_with_strikes: int = Field(..., ge=0, description="Usuarios con strikes")
    banned_users: int = Field(..., ge=0, description="Usuarios baneados")
    temp_banned: int = Field(..., ge=0, description="Bans temporales")
    perm_banned: int = Field(..., ge=0, description="Bans permanentes")
    avg_strikes: float = Field(..., ge=0.0, description="Promedio de strikes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "channel_id": "channel_abc",
                "total_violations": 150,
                "total_users_with_strikes": 45,
                "banned_users": 8,
                "temp_banned": 5,
                "perm_banned": 3,
                "avg_strikes": 2.3
            }
        }

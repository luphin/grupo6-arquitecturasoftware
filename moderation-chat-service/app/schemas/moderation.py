"""
Schemas para endpoints de moderación
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ModerateMessageRequest(BaseModel):
    """Request para moderar un mensaje"""
    
    message_id: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="ID único del mensaje"
    )
    user_id: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="ID del usuario que envió el mensaje"
    )
    channel_id: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="ID del canal donde se envió el mensaje"
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Contenido del mensaje a moderar"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Metadata adicional del mensaje"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "msg_123456",
                "user_id": "user_789",
                "channel_id": "channel_abc",
                "content": "Este es un mensaje de prueba",
                "metadata": {
                    "thread_id": "thread_001",
                    "timestamp": "2025-10-13T10:30:00Z"
                }
            }
        }


class ModerateMessageResponse(BaseModel):
    """Response de moderación de mensaje"""
    
    is_approved: bool = Field(
        ...,
        description="Si el mensaje fue aprobado"
    )
    action: str = Field(
        ...,
        description="Acción tomada: approved, warning, temp_ban, perm_ban, blocked"
    )
    severity: str = Field(
        ...,
        description="Nivel de severidad: none, low, medium, high"
    )
    toxicity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Score de toxicidad (0-1)"
    )
    strike_count: int = Field(
        ...,
        ge=0,
        description="Número actual de strikes del usuario"
    )
    message: str = Field(
        ...,
        description="Mensaje descriptivo de la acción"
    )
    detected_words: Optional[List[str]] = Field(
        default=None,
        description="Palabras prohibidas detectadas"
    )
    language: Optional[str] = Field(
        default=None,
        description="Idioma detectado del mensaje"
    )
    ban_info: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Información del ban si aplica"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_approved": False,
                "action": "warning",
                "severity": "medium",
                "toxicity_score": 0.75,
                "strike_count": 2,
                "message": "Advertencia. Strike 2/3",
                "detected_words": ["idiota"],
                "language": "es",
                "ban_info": None
            }
        }


class ModerationStatusResponse(BaseModel):
    """Response con estado de moderación de un usuario"""
    
    user_id: str = Field(..., description="ID del usuario")
    channel_id: str = Field(..., description="ID del canal")
    strike_count: int = Field(..., ge=0, description="Strikes actuales")
    is_banned: bool = Field(..., description="Si está baneado")
    ban_type: Optional[str] = Field(
        default=None,
        description="Tipo de ban: temporary o permanent"
    )
    ban_expires_at: Optional[str] = Field(
        default=None,
        description="Fecha de expiración del ban (ISO)"
    )
    strikes_reset_at: Optional[str] = Field(
        default=None,
        description="Fecha de reset de strikes (ISO)"
    )
    last_violation: Optional[str] = Field(
        default=None,
        description="Fecha de última violación (ISO)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_789",
                "channel_id": "channel_abc",
                "strike_count": 2,
                "is_banned": False,
                "ban_type": None,
                "ban_expires_at": None,
                "strikes_reset_at": "2025-11-12T10:30:00Z",
                "last_violation": "2025-10-13T10:30:00Z"
            }
        }


class AnalyzeTextRequest(BaseModel):
    """Request para analizar texto sin aplicar strikes"""
    
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Texto a analizar"
    )
    language: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=5,
        description="Código ISO del idioma (opcional, se detecta automáticamente)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Este es un texto de prueba",
                "language": "es"
            }
        }

class DetoxifyScores(BaseModel):
    """Scores detallados de Detoxify"""
    
    toxicity: float = Field(..., ge=0.0, le=1.0)
    severe_toxicity: float = Field(..., ge=0.0, le=1.0)
    obscene: float = Field(..., ge=0.0, le=1.0)
    threat: float = Field(..., ge=0.0, le=1.0)
    insult: float = Field(..., ge=0.0, le=1.0)
    identity_hate: float = Field(..., ge=0.0, le=1.0)
    
    class Config:
        from_attributes = True  # ← Permite convertir desde objeto

class AnalyzeTextResponse(BaseModel):
    """Response de análisis de texto"""
    
    is_toxic: bool = Field(..., description="Si el texto es tóxico")
    toxicity_score: float = Field(..., ge=0.0, le=1.0, description="Score de toxicidad")
    severity: str = Field(..., description="Severidad: none, low, medium, high")
    language: str = Field(..., description="Idioma detectado")
    detected_words: List[str] = Field(
        default_factory=list,
        description="Palabras prohibidas detectadas"
    )
    categories: List[str] = Field(
        default_factory=list,
        description="Categorías de toxicidad detectadas"
    )
    detoxify_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Scores detallados de Detoxify"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_toxic": True,
                "toxicity_score": 0.85,
                "severity": "high",
                "language": "es",
                "detected_words": ["idiota"],
                "categories": ["insult", "obscene"],
                "detoxify_scores": {
                    "toxicity": 0.85,
                    "severe_toxicity": 0.12,
                    "obscene": 0.78,
                    "threat": 0.05,
                    "insult": 0.92,
                    "identity_hate": 0.03
                }
            }
        }

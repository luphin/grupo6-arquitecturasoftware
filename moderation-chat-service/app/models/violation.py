"""
Modelo de violaciones/infracciones
"""

from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.blacklist_word import PyObjectId


ActionType = Literal["warning", "temp_ban", "perm_ban", "message_blocked"]
SeverityType = Literal["low", "medium", "high"]


class Violation(BaseModel):
    """
    Modelo para registrar violaciones de moderación
    
    Collections: violations
    """
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="ID del usuario que violó las reglas")
    channel_id: str = Field(..., description="ID del canal donde ocurrió")
    message_id: str = Field(..., description="ID del mensaje con contenido inapropiado")
    message_content_hash: Optional[str] = Field(
        default=None,
        description="Hash del contenido (no guardamos texto completo por privacidad)"
    )
    detected_words: List[str] = Field(
        default_factory=list,
        description="Palabras prohibidas detectadas"
    )
    toxicity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Score de toxicidad (0-1)"
    )
    severity: SeverityType = Field(..., description="Nivel de severidad")
    action_taken: ActionType = Field(..., description="Acción tomada")
    strike_count_at_time: int = Field(
        ...,
        ge=0,
        description="Número de strikes del usuario al momento de la violación"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp de la violación"
    )
    metadata: Optional[dict] = Field(
        default_factory=dict,
        description="Metadata adicional"
    )

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        json_schema_extra = {
            "example": {
                "user_id": "user_456",
                "channel_id": "channel_789",
                "message_id": "msg_123",
                "detected_words": ["idiota", "estúpido"],
                "toxicity_score": 0.85,
                "severity": "high",
                "action_taken": "warning",
                "strike_count_at_time": 2,
                "timestamp": "2025-10-13T10:30:00Z"
            }
        }
    
    def to_dict(self) -> dict:
        """Convierte el modelo a diccionario para MongoDB"""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and isinstance(data["_id"], PyObjectId):
            data["_id"] = ObjectId(data["_id"])
        return data


class ViolationSummary(BaseModel):
    """Resumen de violaciones para respuestas de API"""
    
    total_violations: int = Field(..., description="Total de violaciones")
    violations_by_severity: dict = Field(
        default_factory=dict,
        description="Violaciones agrupadas por severidad"
    )
    last_violation: Optional[datetime] = Field(
        default=None,
        description="Fecha de última violación"
    )
    most_common_words: List[str] = Field(
        default_factory=list,
        description="Palabras prohibidas más comunes"
    )

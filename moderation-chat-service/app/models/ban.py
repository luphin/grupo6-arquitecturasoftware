"""
Modelo de baneos
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.blacklist_word import PyObjectId


BanType = Literal["temporary", "permanent"]


class Ban(BaseModel):
    """
    Modelo para registro de baneos de usuarios
    
    Collections: bans
    """
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="ID del usuario baneado")
    channel_id: str = Field(..., description="ID del canal")
    ban_type: BanType = Field(..., description="Tipo de ban")
    reason: str = Field(..., max_length=500, description="Razón del ban")
    banned_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Fecha del ban"
    )
    banned_until: Optional[datetime] = Field(
        default=None,
        description="Fecha de expiración (None = permanente)"
    )
    banned_by: Optional[str] = Field(
        default="system",
        description="Usuario o sistema que aplicó el ban"
    )
    is_active: bool = Field(
        default=True,
        description="Si el ban está activo"
    )
    total_violations: int = Field(
        default=0,
        ge=0,
        description="Total de violaciones al momento del ban"
    )
    unbanned_at: Optional[datetime] = Field(
        default=None,
        description="Fecha en que fue desbaneado"
    )
    unbanned_by: Optional[str] = Field(
        default=None,
        description="Usuario que desbaneó"
    )
    unban_reason: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Razón del desbaneo"
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
                "ban_type": "temporary",
                "reason": "Excedió 3 strikes por lenguaje ofensivo",
                "banned_at": "2025-10-13T10:30:00Z",
                "banned_until": "2025-10-14T10:30:00Z",
                "banned_by": "system",
                "is_active": True,
                "total_violations": 4
            }
        }
    
    def to_dict(self) -> dict:
        """Convierte el modelo a diccionario para MongoDB"""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and isinstance(data["_id"], PyObjectId):
            data["_id"] = ObjectId(data["_id"])
        return data
    
    @classmethod
    def create_temporary(
        cls,
        user_id: str,
        channel_id: str,
        reason: str,
        banned_until: datetime,
        total_violations: int,
        banned_by: str = "system"
    ) -> "Ban":
        """Crea un ban temporal"""
        return cls(
            user_id=user_id,
            channel_id=channel_id,
            ban_type="temporary",
            reason=reason,
            banned_until=banned_until,
            total_violations=total_violations,
            banned_by=banned_by,
            is_active=True
        )
    
    @classmethod
    def create_permanent(
        cls,
        user_id: str,
        channel_id: str,
        reason: str,
        total_violations: int,
        banned_by: str = "system"
    ) -> "Ban":
        """Crea un ban permanente"""
        return cls(
            user_id=user_id,
            channel_id=channel_id,
            ban_type="permanent",
            reason=reason,
            banned_until=None,
            total_violations=total_violations,
            banned_by=banned_by,
            is_active=True
        )
    
    def unban(self, unbanned_by: str, reason: Optional[str] = None):
        """Desbanea al usuario"""
        self.is_active = False
        self.unbanned_at = datetime.utcnow()
        self.unbanned_by = unbanned_by
        self.unban_reason = reason
    
    def is_expired(self) -> bool:
        """Verifica si el ban temporal ha expirado"""
        if self.ban_type == "permanent":
            return False
        
        if not self.is_active:
            return True
        
        if self.banned_until and datetime.utcnow() >= self.banned_until:
            return True
        
        return False
    
    @property
    def is_permanent(self) -> bool:
        """Retorna True si es un ban permanente"""
        return self.ban_type == "permanent"
    
    @property
    def time_remaining(self) -> Optional[int]:
        """Retorna los segundos restantes del ban (None si es permanente o expirado)"""
        if self.ban_type == "permanent":
            return None
        
        if not self.is_active or not self.banned_until:
            return None
        
        remaining = (self.banned_until - datetime.utcnow()).total_seconds()
        return int(remaining) if remaining > 0 else 0

"""
Modelo de strikes por usuario
"""

from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.blacklist_word import PyObjectId
from app.config.settings import settings


class UserStrike(BaseModel):
    """
    Modelo para gestionar strikes de usuarios por canal
    
    Collections: user_strikes
    """
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="ID del usuario")
    channel_id: str = Field(..., description="ID del canal")
    strike_count: int = Field(
        default=0,
        ge=0,
        description="Número actual de strikes"
    )
    last_violation: Optional[datetime] = Field(
        default=None,
        description="Fecha de última violación"
    )
    strikes_reset_at: datetime = Field(
        ...,
        description="Fecha en que se resetean los strikes automáticamente"
    )
    is_banned: bool = Field(
        default=False,
        description="Si el usuario está baneado en este canal"
    )
    ban_type: Optional[str] = Field(
        default=None,
        description="Tipo de ban: temporary, permanent"
    )
    ban_expires_at: Optional[datetime] = Field(
        default=None,
        description="Fecha de expiración del ban (None = permanente)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Fecha de creación del registro"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Fecha de última actualización"
    )

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        json_schema_extra = {
            "example": {
                "user_id": "user_456",
                "channel_id": "channel_789",
                "strike_count": 2,
                "last_violation": "2025-10-13T10:30:00Z",
                "strikes_reset_at": "2025-11-12T10:30:00Z",
                "is_banned": False,
                "ban_type": None,
                "ban_expires_at": None
            }
        }
    
    def to_dict(self) -> dict:
        """Convierte el modelo a diccionario para MongoDB"""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and isinstance(data["_id"], PyObjectId):
            data["_id"] = ObjectId(data["_id"])
        return data
    
    @classmethod
    def create_new(cls, user_id: str, channel_id: str) -> "UserStrike":
        """Crea un nuevo registro de strikes para un usuario"""
        now = datetime.utcnow()
        reset_date = now + timedelta(days=settings.STRIKE_RESET_DAYS)
        
        return cls(
            user_id=user_id,
            channel_id=channel_id,
            strike_count=0,
            strikes_reset_at=reset_date,
            is_banned=False,
            created_at=now,
            updated_at=now
        )
    
    def increment_strike(self) -> int:
        """Incrementa el contador de strikes"""
        self.strike_count += 1
        self.last_violation = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        return self.strike_count
    
    def reset_strikes(self):
        """Resetea los strikes del usuario"""
        self.strike_count = 0
        self.last_violation = None
        self.strikes_reset_at = datetime.utcnow() + timedelta(days=settings.STRIKE_RESET_DAYS)
        self.updated_at = datetime.utcnow()
    
    def apply_temp_ban(self):
        """Aplica un ban temporal"""
        self.is_banned = True
        self.ban_type = "temporary"
        self.ban_expires_at = datetime.utcnow() + timedelta(hours=settings.TEMP_BAN_HOURS)
        self.updated_at = datetime.utcnow()
    
    def apply_perm_ban(self):
        """Aplica un ban permanente"""
        self.is_banned = True
        self.ban_type = "permanent"
        self.ban_expires_at = None
        self.updated_at = datetime.utcnow()
    
    def unban(self):
        """Desbanea al usuario"""
        self.is_banned = False
        self.ban_type = None
        self.ban_expires_at = None
        self.updated_at = datetime.utcnow()
    
    def should_reset_strikes(self) -> bool:
        """Verifica si los strikes deben resetearse"""
        return datetime.utcnow() >= self.strikes_reset_at
    
    def is_ban_expired(self) -> bool:
        """Verifica si el ban temporal ha expirado"""
        if not self.is_banned:
            return False
        
        if self.ban_type == "permanent":
            return False
        
        if self.ban_expires_at and datetime.utcnow() >= self.ban_expires_at:
            return True
        
        return False

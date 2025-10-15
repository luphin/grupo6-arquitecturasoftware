"""
Modelo de palabras en lista negra
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type para Pydantic v2"""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.no_info_plain_validator_function(cls.validate),
        ])

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}


CategoryType = Literal["insult", "profanity", "hate_speech", "threat", "harassment", "other"]
SeverityType = Literal["low", "medium", "high"]


class BlacklistWord(BaseModel):
    """
    Modelo para palabras prohibidas en la lista negra
    
    Collections: blacklist_words
    """
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    word: str = Field(..., min_length=1, max_length=200, description="Palabra o frase prohibida")
    language: str = Field(..., min_length=2, max_length=5, description="Código ISO del idioma")
    category: CategoryType = Field(..., description="Categoría de la palabra")
    severity: SeverityType = Field(..., description="Nivel de severidad")
    is_active: bool = Field(default=True, description="Si la palabra está activa")
    is_regex: bool = Field(default=False, description="Si es una expresión regular")
    added_by: Optional[str] = Field(default=None, description="Usuario que agregó la palabra")
    added_at: datetime = Field(default_factory=datetime.utcnow, description="Fecha de creación")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Fecha de última actualización")
    notes: Optional[str] = Field(default=None, max_length=500, description="Notas adicionales")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
        json_schema_extra = {
            "example": {
                "word": "idiota",
                "language": "es",
                "category": "insult",
                "severity": "medium",
                "is_active": True,
                "is_regex": False,
                "added_by": "admin_123",
                "notes": "Insulto común en español"
            }
        }
    
    def to_dict(self) -> dict:
        """Convierte el modelo a diccionario para MongoDB"""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and isinstance(data["_id"], PyObjectId):
            data["_id"] = ObjectId(data["_id"])
        return data

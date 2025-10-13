"""
Schemas para endpoints de gestión de lista negra
"""

from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from datetime import datetime


class AddWordRequest(BaseModel):
    """Request para agregar palabra a lista negra"""
    
    word: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Palabra o patrón a agregar"
    )
    language: str = Field(
        ...,
        min_length=2,
        max_length=5,
        description="Código ISO del idioma"
    )
    category: str = Field(
        ...,
        description="Categoría: insult, profanity, hate_speech, threat, harassment, other"
    )
    severity: str = Field(
        ...,
        description="Severidad: low, medium, high"
    )
    is_regex: bool = Field(
        default=False,
        description="Si es expresión regular"
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Notas adicionales"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "word": "idiota",
                "language": "es",
                "category": "insult",
                "severity": "medium",
                "is_regex": False,
                "notes": "Insulto común en español"
            }
        }


class UpdateWordRequest(BaseModel):
    """Request para actualizar palabra"""
    
    category: Optional[str] = Field(
        default=None,
        description="Nueva categoría"
    )
    severity: Optional[str] = Field(
        default=None,
        description="Nueva severidad"
    )
    is_active: Optional[bool] = Field(
        default=None,
        description="Activar/desactivar"
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Nuevas notas"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "severity": "high",
                "notes": "Aumentada severidad"
            }
        }


class WordResponse(BaseModel):
    """Response con información de palabra"""
    
    id: str = Field(..., description="ID de la palabra")
    word: str = Field(..., description="Palabra o patrón")
    language: str = Field(..., description="Idioma")
    category: str = Field(..., description="Categoría")
    severity: str = Field(..., description="Severidad")
    is_active: bool = Field(..., description="Si está activa")
    is_regex: bool = Field(..., description="Si es regex")
    added_by: Optional[str] = Field(default=None, description="Agregado por")
    added_at: str = Field(..., description="Fecha de creación (ISO)")
    updated_at: str = Field(..., description="Fecha de actualización (ISO)")
    notes: Optional[str] = Field(default=None, description="Notas")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "65f1a2b3c4d5e6f7g8h9i0j1",
                "word": "idiota",
                "language": "es",
                "category": "insult",
                "severity": "medium",
                "is_active": True,
                "is_regex": False,
                "added_by": "admin_123",
                "added_at": "2025-10-13T10:00:00Z",
                "updated_at": "2025-10-13T10:00:00Z",
                "notes": "Insulto común"
            }
        }


class BlacklistWordsResponse(BaseModel):
    """Response con lista de palabras"""
    
    total: int = Field(..., description="Total de palabras")
    words: List[WordResponse] = Field(
        default_factory=list,
        description="Lista de palabras"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 150,
                "words": [
                    {
                        "id": "65f1a2b3c4d5e6f7g8h9i0j1",
                        "word": "idiota",
                        "language": "es",
                        "category": "insult",
                        "severity": "medium",
                        "is_active": True,
                        "is_regex": False,
                        "added_by": "admin_123",
                        "added_at": "2025-10-13T10:00:00Z",
                        "updated_at": "2025-10-13T10:00:00Z",
                        "notes": None
                    }
                ]
            }
        }


class BlacklistStatsResponse(BaseModel):
    """Response con estadísticas de lista negra"""
    
    total: int = Field(..., description="Total de palabras")
    active: int = Field(..., description="Palabras activas")
    inactive: int = Field(..., description="Palabras inactivas")
    by_language: Dict[str, int] = Field(
        default_factory=dict,
        description="Palabras por idioma"
    )
    by_category: Dict[str, int] = Field(
        default_factory=dict,
        description="Palabras por categoría"
    )
    by_severity: Dict[str, int] = Field(
        default_factory=dict,
        description="Palabras por severidad"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 500,
                "active": 480,
                "inactive": 20,
                "by_language": {
                    "es": 200,
                    "en": 150,
                    "pt": 100,
                    "fr": 50
                },
                "by_category": {
                    "insult": 200,
                    "profanity": 150,
                    "hate_speech": 100,
                    "threat": 50
                },
                "by_severity": {
                    "low": 100,
                    "medium": 250,
                    "high": 150
                }
            }
        }

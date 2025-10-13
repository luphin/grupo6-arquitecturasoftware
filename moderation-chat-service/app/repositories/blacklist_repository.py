"""
Repository para gestión de lista negra
"""

from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.models.blacklist_word import BlacklistWord
from app.utils.logger import log


class BlacklistRepository(BaseRepository[BlacklistWord]):
    """Repository para palabras en lista negra"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "blacklist_words")
    
    async def create_word(self, word: BlacklistWord) -> BlacklistWord:
        """
        Crea una nueva palabra en la lista negra
        
        Args:
            word: Objeto BlacklistWord
            
        Returns:
            BlacklistWord con ID asignado
        """
        word_dict = word.to_dict()
        word_dict.pop("_id", None)  # Remover _id para que MongoDB lo genere
        
        word_id = await self.create(word_dict)
        word.id = word_id
        
        log.info(f"Created blacklist word: {word.word} ({word.language})")
        return word
    
    async def get_by_id(self, word_id: str) -> Optional[BlacklistWord]:
        """Obtiene una palabra por ID"""
        doc = await self.find_by_id(word_id)
        return BlacklistWord(**doc) if doc else None
    
    async def get_by_word_and_language(
        self,
        word: str,
        language: str
    ) -> Optional[BlacklistWord]:
        """
        Busca una palabra específica en un idioma
        
        Args:
            word: Palabra a buscar
            language: Código de idioma
            
        Returns:
            BlacklistWord o None
        """
        doc = await self.find_one({"word": word, "language": language})
        return BlacklistWord(**doc) if doc else None
    
    async def get_by_language(
        self,
        language: str,
        only_active: bool = True
    ) -> List[BlacklistWord]:
        """
        Obtiene todas las palabras de un idioma
        
        Args:
            language: Código de idioma
            only_active: Solo palabras activas
            
        Returns:
            Lista de BlacklistWord
        """
        query = {"language": language}
        if only_active:
            query["is_active"] = True
        
        docs = await self.find_many(query)
        return [BlacklistWord(**doc) for doc in docs]
    
    async def get_all_active(self) -> List[BlacklistWord]:
        """Obtiene todas las palabras activas de todos los idiomas"""
        docs = await self.find_many({"is_active": True})
        return [BlacklistWord(**doc) for doc in docs]
    
    async def get_all(
        self,
        limit: Optional[int] = None,
        skip: int = 0
    ) -> List[BlacklistWord]:
        """
        Obtiene todas las palabras con paginación
        
        Args:
            limit: Número máximo de resultados
            skip: Documentos a saltar
            
        Returns:
            Lista de BlacklistWord
        """
        docs = await self.find_many({}, limit=limit, skip=skip)
        return [BlacklistWord(**doc) for doc in docs]
    
    async def update_word(
        self,
        word_id: str,
        update_data: dict
    ) -> Optional[BlacklistWord]:
        """
        Actualiza una palabra
        
        Args:
            word_id: ID de la palabra
            update_data: Datos a actualizar
            
        Returns:
            BlacklistWord actualizado o None
        """
        update_data["updated_at"] = datetime.utcnow()
        
        success = await self.update_by_id(word_id, {"$set": update_data})
        
        if success:
            return await self.get_by_id(word_id)
        return None
    
    async def activate_word(self, word_id: str) -> bool:
        """Activa una palabra"""
        return await self.update_by_id(
            word_id,
            {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
        )
    
    async def deactivate_word(self, word_id: str) -> bool:
        """Desactiva una palabra (soft delete)"""
        return await self.update_by_id(
            word_id,
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
    
    async def hard_delete_word(self, word_id: str) -> bool:
        """Elimina permanentemente una palabra"""
        return await self.delete_by_id(word_id)
    
    async def search_words(
        self,
        search_text: str,
        language: Optional[str] = None
    ) -> List[BlacklistWord]:
        """
        Busca palabras por texto
        
        Args:
            search_text: Texto a buscar
            language: Filtrar por idioma (opcional)
            
        Returns:
            Lista de BlacklistWord
        """
        query = {"$text": {"$search": search_text}}
        if language:
            query["language"] = language
        
        docs = await self.find_many(query, limit=100)
        return [BlacklistWord(**doc) for doc in docs]
    
    async def bulk_insert(self, words: List[BlacklistWord]) -> int:
        """
        Inserta múltiples palabras
        
        Args:
            words: Lista de BlacklistWord
            
        Returns:
            Número de palabras insertadas
        """
        if not words:
            return 0
        
        words_dict = [word.to_dict() for word in words]
        for word in words_dict:
            word.pop("_id", None)
        
        try:
            result = await self.collection.insert_many(words_dict, ordered=False)
            inserted = len(result.inserted_ids)
            log.info(f"Bulk inserted {inserted} blacklist words")
            return inserted
        except Exception as e:
            log.error(f"Error in bulk insert: {e}")
            return 0
    
    async def get_stats(self) -> dict:
        """
        Obtiene estadísticas de la lista negra
        
        Returns:
            Diccionario con estadísticas
        """
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "language": "$language",
                        "category": "$category",
                        "severity": "$severity"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        stats = await self.aggregate(pipeline)
        
        # Formato más legible
        formatted_stats = {
            "total": await self.count(),
            "active": await self.count({"is_active": True}),
            "inactive": await self.count({"is_active": False}),
            "by_language": {},
            "by_category": {},
            "by_severity": {}
        }
        
        for stat in stats:
            lang = stat["_id"]["language"]
            cat = stat["_id"]["category"]
            sev = stat["_id"]["severity"]
            count = stat["count"]
            
            formatted_stats["by_language"][lang] = formatted_stats["by_language"].get(lang, 0) + count
            formatted_stats["by_category"][cat] = formatted_stats["by_category"].get(cat, 0) + count
            formatted_stats["by_severity"][sev] = formatted_stats["by_severity"].get(sev, 0) + count
        
        return formatted_stats
    
    async def get_by_category(
        self,
        category: str,
        language: Optional[str] = None
    ) -> List[BlacklistWord]:
        """
        Obtiene palabras por categoría
        
        Args:
            category: Categoría (insult, profanity, etc.)
            language: Filtrar por idioma (opcional)
            
        Returns:
            Lista de BlacklistWord
        """
        query = {"category": category, "is_active": True}
        if language:
            query["language"] = language
        
        docs = await self.find_many(query)
        return [BlacklistWord(**doc) for doc in docs]
    
    async def get_by_severity(
        self,
        severity: str,
        language: Optional[str] = None
    ) -> List[BlacklistWord]:
        """
        Obtiene palabras por severidad
        
        Args:
            severity: Severidad (low, medium, high)
            language: Filtrar por idioma (opcional)
            
        Returns:
            Lista de BlacklistWord
        """
        query = {"severity": severity, "is_active": True}
        if language:
            query["language"] = language
        
        docs = await self.find_many(query)
        return [BlacklistWord(**doc) for doc in docs]

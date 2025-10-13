"""
Repository base con métodos comunes
"""

from typing import TypeVar, Generic, Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from bson import ObjectId
from app.utils.logger import log
from app.utils.exceptions import DatabaseException

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Repository base con operaciones CRUD genéricas
    """
    
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.db = db
        self.collection: AsyncIOMotorCollection = db[collection_name]
        self.collection_name = collection_name
    
    async def create(self, document: dict) -> Optional[str]:
        """
        Crea un documento
        
        Args:
            document: Diccionario con los datos del documento
            
        Returns:
            ID del documento creado
        """
        try:
            result = await self.collection.insert_one(document)
            log.debug(f"Created document in {self.collection_name}: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            log.error(f"Error creating document in {self.collection_name}: {e}")
            raise DatabaseException(f"Failed to create document: {e}")
    
    async def find_by_id(self, document_id: str) -> Optional[dict]:
        """
        Busca un documento por ID
        
        Args:
            document_id: ID del documento
            
        Returns:
            Documento o None si no existe
        """
        try:
            if not ObjectId.is_valid(document_id):
                return None
            
            document = await self.collection.find_one({"_id": ObjectId(document_id)})
            return document
        except Exception as e:
            log.error(f"Error finding document by id in {self.collection_name}: {e}")
            return None
    
    async def find_one(self, query: dict) -> Optional[dict]:
        """
        Busca un documento que coincida con el query
        
        Args:
            query: Diccionario con criterios de búsqueda
            
        Returns:
            Documento o None si no existe
        """
        try:
            document = await self.collection.find_one(query)
            return document
        except Exception as e:
            log.error(f"Error finding document in {self.collection_name}: {e}")
            return None
    
    async def find_many(
        self,
        query: dict,
        limit: Optional[int] = None,
        skip: int = 0,
        sort: Optional[List[tuple]] = None
    ) -> List[dict]:
        """
        Busca múltiples documentos
        
        Args:
            query: Criterios de búsqueda
            limit: Límite de resultados
            skip: Documentos a saltar
            sort: Lista de tuplas (campo, orden) para ordenar
            
        Returns:
            Lista de documentos
        """
        try:
            cursor = self.collection.find(query)
            
            if sort:
                cursor = cursor.sort(sort)
            
            if skip:
                cursor = cursor.skip(skip)
            
            if limit:
                cursor = cursor.limit(limit)
            
            documents = await cursor.to_list(length=limit)
            return documents
        except Exception as e:
            log.error(f"Error finding documents in {self.collection_name}: {e}")
            return []
    
    async def update_one(
        self,
        query: dict,
        update: dict,
        upsert: bool = False
    ) -> bool:
        """
        Actualiza un documento
        
        Args:
            query: Criterios para encontrar el documento
            update: Datos a actualizar (debe usar operadores $set, $inc, etc.)
            upsert: Si crear el documento si no existe
            
        Returns:
            True si se actualizó correctamente
        """
        try:
            result = await self.collection.update_one(query, update, upsert=upsert)
            return result.modified_count > 0 or (upsert and result.upserted_id is not None)
        except Exception as e:
            log.error(f"Error updating document in {self.collection_name}: {e}")
            raise DatabaseException(f"Failed to update document: {e}")
    
    async def update_by_id(
        self,
        document_id: str,
        update: dict
    ) -> bool:
        """
        Actualiza un documento por ID
        
        Args:
            document_id: ID del documento
            update: Datos a actualizar
            
        Returns:
            True si se actualizó correctamente
        """
        try:
            if not ObjectId.is_valid(document_id):
                return False
            
            result = await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                update
            )
            return result.modified_count > 0
        except Exception as e:
            log.error(f"Error updating document by id in {self.collection_name}: {e}")
            raise DatabaseException(f"Failed to update document: {e}")
    
    async def delete_one(self, query: dict) -> bool:
        """
        Elimina un documento
        
        Args:
            query: Criterios para encontrar el documento
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            result = await self.collection.delete_one(query)
            return result.deleted_count > 0
        except Exception as e:
            log.error(f"Error deleting document in {self.collection_name}: {e}")
            raise DatabaseException(f"Failed to delete document: {e}")
    
    async def delete_by_id(self, document_id: str) -> bool:
        """
        Elimina un documento por ID
        
        Args:
            document_id: ID del documento
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            if not ObjectId.is_valid(document_id):
                return False
            
            result = await self.collection.delete_one({"_id": ObjectId(document_id)})
            return result.deleted_count > 0
        except Exception as e:
            log.error(f"Error deleting document by id in {self.collection_name}: {e}")
            raise DatabaseException(f"Failed to delete document: {e}")
    
    async def count(self, query: dict = None) -> int:
        """
        Cuenta documentos que coincidan con el query
        
        Args:
            query: Criterios de búsqueda (None = todos)
            
        Returns:
            Número de documentos
        """
        try:
            query = query or {}
            count = await self.collection.count_documents(query)
            return count
        except Exception as e:
            log.error(f"Error counting documents in {self.collection_name}: {e}")
            return 0
    
    async def exists(self, query: dict) -> bool:
        """
        Verifica si existe al menos un documento que coincida
        
        Args:
            query: Criterios de búsqueda
            
        Returns:
            True si existe al menos uno
        """
        try:
            count = await self.collection.count_documents(query, limit=1)
            return count > 0
        except Exception as e:
            log.error(f"Error checking existence in {self.collection_name}: {e}")
            return False
    
    async def aggregate(self, pipeline: List[dict]) -> List[dict]:
        """
        Ejecuta un pipeline de agregación
        
        Args:
            pipeline: Pipeline de agregación de MongoDB
            
        Returns:
            Lista de resultados
        """
        try:
            cursor = self.collection.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            return results
        except Exception as e:
            log.error(f"Error in aggregation pipeline in {self.collection_name}: {e}")
            return []

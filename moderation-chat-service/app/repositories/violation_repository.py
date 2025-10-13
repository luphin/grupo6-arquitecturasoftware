"""
Repository para gestión de violaciones
"""

from typing import List, Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.models.violation import Violation, ViolationSummary
from app.utils.logger import log


class ViolationRepository(BaseRepository[Violation]):
    """Repository para violaciones"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "violations")
    
    async def create_violation(self, violation: Violation) -> Violation:
        """
        Crea una nueva violación
        
        Args:
            violation: Objeto Violation
            
        Returns:
            Violation con ID asignado
        """
        violation_dict = violation.to_dict()
        violation_dict.pop("_id", None)
        
        violation_id = await self.create(violation_dict)
        violation.id = violation_id
        
        log.info(
            f"Created violation: user={violation.user_id}, "
            f"channel={violation.channel_id}, severity={violation.severity}"
        )
        return violation
    
    async def get_by_id(self, violation_id: str) -> Optional[Violation]:
        """Obtiene una violación por ID"""
        doc = await self.find_by_id(violation_id)
        return Violation(**doc) if doc else None
    
    async def get_by_user_and_channel(
        self,
        user_id: str,
        channel_id: str,
        limit: int = 100,
        skip: int = 0
    ) -> List[Violation]:
        """
        Obtiene violaciones de un usuario en un canal
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            limit: Límite de resultados
            skip: Documentos a saltar
            
        Returns:
            Lista de Violation ordenadas por timestamp descendente
        """
        query = {"user_id": user_id, "channel_id": channel_id}
        sort = [("timestamp", -1)]  # Más recientes primero
        
        docs = await self.find_many(query, limit=limit, skip=skip, sort=sort)
        return [Violation(**doc) for doc in docs]
    
    async def get_by_user(
        self,
        user_id: str,
        limit: int = 100,
        skip: int = 0
    ) -> List[Violation]:
        """
        Obtiene todas las violaciones de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Límite de resultados
            skip: Documentos a saltar
            
        Returns:
            Lista de Violation
        """
        query = {"user_id": user_id}
        sort = [("timestamp", -1)]
        
        docs = await self.find_many(query, limit=limit, skip=skip, sort=sort)
        return [Violation(**doc) for doc in docs]
    
    async def get_by_channel(
        self,
        channel_id: str,
        limit: int = 100,
        skip: int = 0
    ) -> List[Violation]:
        """
        Obtiene todas las violaciones de un canal
        
        Args:
            channel_id: ID del canal
            limit: Límite de resultados
            skip: Documentos a saltar
            
        Returns:
            Lista de Violation
        """
        query = {"channel_id": channel_id}
        sort = [("timestamp", -1)]
        
        docs = await self.find_many(query, limit=limit, skip=skip, sort=sort)
        return [Violation(**doc) for doc in docs]
    
    async def get_recent_violations(
        self,
        user_id: str,
        channel_id: str,
        hours: int = 24
    ) -> List[Violation]:
        """
        Obtiene violaciones recientes de un usuario en un canal
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            hours: Número de horas hacia atrás
            
        Returns:
            Lista de Violation
        """
        since = datetime.utcnow() - timedelta(hours=hours)
        query = {
            "user_id": user_id,
            "channel_id": channel_id,
            "timestamp": {"$gte": since}
        }
        sort = [("timestamp", -1)]
        
        docs = await self.find_many(query, sort=sort)
        return [Violation(**doc) for doc in docs]
    
    async def count_violations(
        self,
        user_id: str,
        channel_id: Optional[str] = None
    ) -> int:
        """
        Cuenta violaciones de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal (opcional)
            
        Returns:
            Número de violaciones
        """
        query = {"user_id": user_id}
        if channel_id:
            query["channel_id"] = channel_id
        
        return await self.count(query)
    
    async def get_violation_summary(
        self,
        user_id: str,
        channel_id: str
    ) -> ViolationSummary:
        """
        Obtiene un resumen de violaciones de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            ViolationSummary con estadísticas
        """
        violations = await self.get_by_user_and_channel(user_id, channel_id)
        
        if not violations:
            return ViolationSummary(
                total_violations=0,
                violations_by_severity={},
                last_violation=None,
                most_common_words=[]
            )
        
        # Contar por severidad
        by_severity = {}
        all_words = []
        
        for v in violations:
            by_severity[v.severity] = by_severity.get(v.severity, 0) + 1
            all_words.extend(v.detected_words)
        
        # Palabras más comunes
        word_counts = {}
        for word in all_words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        most_common = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        most_common_words = [word for word, _ in most_common]
        
        return ViolationSummary(
            total_violations=len(violations),
            violations_by_severity=by_severity,
            last_violation=violations[0].timestamp if violations else None,
            most_common_words=most_common_words
        )
    
    async def get_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        channel_id: Optional[str] = None
    ) -> List[Violation]:
        """
        Obtiene violaciones en un rango de fechas
        
        Args:
            start_date: Fecha inicio
            end_date: Fecha fin
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Lista de Violation
        """
        query = {
            "timestamp": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        if channel_id:
            query["channel_id"] = channel_id
        
        sort = [("timestamp", -1)]
        docs = await self.find_many(query, sort=sort)
        return [Violation(**doc) for doc in docs]
    
    async def delete_old_violations(self, days: int = 90) -> int:
        """
        Elimina violaciones antiguas
        
        Args:
            days: Número de días (se eliminan registros más antiguos)
            
        Returns:
            Número de violaciones eliminadas
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            result = await self.collection.delete_many(
                {"timestamp": {"$lt": cutoff_date}}
            )
            deleted = result.deleted_count
            log.info(f"Deleted {deleted} old violations (older than {days} days)")
            return deleted
        except Exception as e:
            log.error(f"Error deleting old violations: {e}")
            return 0

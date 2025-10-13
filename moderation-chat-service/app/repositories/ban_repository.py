"""
Repository para gestión de baneos
"""

from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.models.ban import Ban
from app.utils.logger import log


class BanRepository(BaseRepository[Ban]):
    """Repository para baneos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "bans")
    
    async def create_ban(self, ban: Ban) -> Ban:
        """
        Crea un nuevo registro de ban
        
        Args:
            ban: Objeto Ban
            
        Returns:
            Ban con ID asignado
        """
        ban_dict = ban.to_dict()
        ban_dict.pop("_id", None)
        
        ban_id = await self.create(ban_dict)
        ban.id = ban_id
        
        log.info(
            f"Created ban: user={ban.user_id}, channel={ban.channel_id}, "
            f"type={ban.ban_type}"
        )
        return ban
    
    async def get_by_id(self, ban_id: str) -> Optional[Ban]:
        """Obtiene un ban por ID"""
        doc = await self.find_by_id(ban_id)
        return Ban(**doc) if doc else None
    
    async def get_active_ban(
        self,
        user_id: str,
        channel_id: str
    ) -> Optional[Ban]:
        """
        Obtiene el ban activo de un usuario en un canal
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            Ban activo o None
        """
        query = {
            "user_id": user_id,
            "channel_id": channel_id,
            "is_active": True
        }
        sort = [("banned_at", -1)]  # Más reciente
        
        docs = await self.find_many(query, limit=1, sort=sort)
        return Ban(**docs[0]) if docs else None
    
    async def get_ban_history(
        self,
        user_id: str,
        channel_id: Optional[str] = None
    ) -> List[Ban]:
        """
        Obtiene el historial de baneos de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Lista de Ban ordenada por fecha descendente
        """
        query = {"user_id": user_id}
        if channel_id:
            query["channel_id"] = channel_id
        
        sort = [("banned_at", -1)]
        docs = await self.find_many(query, sort=sort)
        return [Ban(**doc) for doc in docs]
    
    async def get_active_bans_by_channel(
        self,
        channel_id: str
    ) -> List[Ban]:
        """
        Obtiene todos los bans activos de un canal
        
        Args:
            channel_id: ID del canal
            
        Returns:
            Lista de Ban activos
        """
        query = {
            "channel_id": channel_id,
            "is_active": True
        }
        sort = [("banned_at", -1)]
        
        docs = await self.find_many(query, sort=sort)
        return [Ban(**doc) for doc in docs]
    
    async def get_all_active_bans(self) -> List[Ban]:
        """Obtiene todos los bans activos del sistema"""
        query = {"is_active": True}
        sort = [("banned_at", -1)]
        
        docs = await self.find_many(query, sort=sort)
        return [Ban(**doc) for doc in docs]
    
    async def update_ban(self, ban: Ban) -> bool:
        """
        Actualiza un registro de ban
        
        Args:
            ban: Ban actualizado
            
        Returns:
            True si se actualizó correctamente
        """
        if not ban.id:
            return False
        
        ban_dict = ban.to_dict()
        ban_dict.pop("_id", None)
        
        return await self.update_by_id(str(ban.id), {"$set": ban_dict})
    
    async def unban_user(
        self,
        user_id: str,
        channel_id: str,
        unbanned_by: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Desbanea a un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            unbanned_by: Usuario que desbaneó
            reason: Razón del desbaneo
            
        Returns:
            True si se desbaneó correctamente
        """
        active_ban = await self.get_active_ban(user_id, channel_id)
        
        if active_ban:
            active_ban.unban(unbanned_by, reason)
            success = await self.update_ban(active_ban)
            
            if success:
                log.info(
                    f"User unbanned: user={user_id}, channel={channel_id}, "
                    f"by={unbanned_by}"
                )
            
            return success
        
        return False
    
    async def check_and_expire_bans(self) -> int:
        """
        Verifica y expira bans temporales vencidos
        
        Returns:
            Número de bans expirados
        """
        query = {
            "is_active": True,
            "ban_type": "temporary",
            "banned_until": {"$lte": datetime.utcnow()}
        }
        
        try:
            result = await self.collection.update_many(
                query,
                {
                    "$set": {
                        "is_active": False,
                        "unbanned_at": datetime.utcnow(),
                        "unbanned_by": "system",
                        "unban_reason": "Ban temporal expirado"
                    }
                }
            )
            
            expired = result.modified_count
            if expired > 0:
                log.info(f"Expired {expired} temporary bans")
            
            return expired
        except Exception as e:
            log.error(f"Error expiring bans: {e}")
            return 0
    
    async def count_bans_by_user(
        self,
        user_id: str,
        channel_id: Optional[str] = None
    ) -> int:
        """
        Cuenta el número de baneos de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Número de baneos
        """
        query = {"user_id": user_id}
        if channel_id:
            query["channel_id"] = channel_id
        
        return await self.count(query)
    
    async def get_permanent_bans(
        self,
        channel_id: Optional[str] = None
    ) -> List[Ban]:
        """
        Obtiene todos los bans permanentes
        
        Args:
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Lista de Ban permanentes
        """
        query = {
            "ban_type": "permanent",
            "is_active": True
        }
        if channel_id:
            query["channel_id"] = channel_id
        
        sort = [("banned_at", -1)]
        docs = await self.find_many(query, sort=sort)
        return [Ban(**doc) for doc in docs]
    
    async def get_temporary_bans(
        self,
        channel_id: Optional[str] = None
    ) -> List[Ban]:
        """
        Obtiene todos los bans temporales activos
        
        Args:
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Lista de Ban temporales
        """
        query = {
            "ban_type": "temporary",
            "is_active": True
        }
        if channel_id:
            query["channel_id"] = channel_id
        
        sort = [("banned_until", 1)]  # Los que expiran primero
        docs = await self.find_many(query, sort=sort)
        return [Ban(**doc) for doc in docs]
    
    async def get_stats_by_channel(self, channel_id: str) -> dict:
        """
        Obtiene estadísticas de baneos de un canal
        
        Args:
            channel_id: ID del canal
            
        Returns:
            Diccionario con estadísticas
        """
        pipeline = [
            {"$match": {"channel_id": channel_id}},
            {
                "$group": {
                    "_id": None,
                    "total_bans": {"$sum": 1},
                    "active_bans": {
                        "$sum": {"$cond": ["$is_active", 1, 0]}
                    },
                    "permanent_bans": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$eq": ["$ban_type", "permanent"]},
                                        {"$eq": ["$is_active", True]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "temporary_bans": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$eq": ["$ban_type", "temporary"]},
                                        {"$eq": ["$is_active", True]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "total_unbanned": {
                        "$sum": {"$cond": [{"$ne": ["$unbanned_at", None]}, 1, 0]}
                    }
                }
            }
        ]
        
        results = await self.aggregate(pipeline)
        
        if results:
            stats = results[0]
            stats.pop("_id", None)
            return stats
        
        return {
            "total_bans": 0,
            "active_bans": 0,
            "permanent_bans": 0,
            "temporary_bans": 0,
            "total_unbanned": 0
        }
    
    async def get_most_banned_users(
        self,
        channel_id: Optional[str] = None,
        limit: int = 10
    ) -> List[dict]:
        """
        Obtiene los usuarios con más baneos
        
        Args:
            channel_id: Filtrar por canal (opcional)
            limit: Número de resultados
            
        Returns:
            Lista de diccionarios con user_id y ban_count
        """
        match_stage = {}
        if channel_id:
            match_stage = {"$match": {"channel_id": channel_id}}
        
        pipeline = []
        if match_stage:
            pipeline.append(match_stage)
        
        pipeline.extend([
            {
                "$group": {
                    "_id": "$user_id",
                    "ban_count": {"$sum": 1},
                    "permanent_count": {
                        "$sum": {"$cond": [{"$eq": ["$ban_type", "permanent"]}, 1, 0]}
                    },
                    "temporary_count": {
                        "$sum": {"$cond": [{"$eq": ["$ban_type", "temporary"]}, 1, 0]}
                    },
                    "last_ban": {"$max": "$banned_at"}
                }
            },
            {"$sort": {"ban_count": -1}},
            {"$limit": limit}
        ])
        
        results = await self.aggregate(pipeline)
        
        return [
            {
                "user_id": r["_id"],
                "ban_count": r["ban_count"],
                "permanent_count": r["permanent_count"],
                "temporary_count": r["temporary_count"],
                "last_ban": r["last_ban"]
            }
            for r in results
        ]

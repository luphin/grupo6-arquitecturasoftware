"""
Repository para gestión de strikes
"""

from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository
from app.models.user_strike import UserStrike
from app.utils.logger import log


class StrikeRepository(BaseRepository[UserStrike]):
    """Repository para strikes de usuarios"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "user_strikes")
    
    async def create_strike_record(self, strike: UserStrike) -> UserStrike:
        """
        Crea un nuevo registro de strikes
        
        Args:
            strike: Objeto UserStrike
            
        Returns:
            UserStrike con ID asignado
        """
        strike_dict = strike.to_dict()
        strike_dict.pop("_id", None)
        
        strike_id = await self.create(strike_dict)
        strike.id = strike_id
        
        log.info(f"Created strike record: user={strike.user_id}, channel={strike.channel_id}")
        return strike
    
    async def get_by_id(self, strike_id: str) -> Optional[UserStrike]:
        """Obtiene un registro de strikes por ID"""
        doc = await self.find_by_id(strike_id)
        return UserStrike(**doc) if doc else None
    
    async def get_by_user_and_channel(
        self,
        user_id: str,
        channel_id: str
    ) -> Optional[UserStrike]:
        """
        Obtiene el registro de strikes de un usuario en un canal
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            UserStrike o None si no existe
        """
        doc = await self.find_one({"user_id": user_id, "channel_id": channel_id})
        return UserStrike(**doc) if doc else None
    
    async def get_or_create(
        self,
        user_id: str,
        channel_id: str
    ) -> UserStrike:
        """
        Obtiene o crea un registro de strikes
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            UserStrike existente o recién creado
        """
        strike = await self.get_by_user_and_channel(user_id, channel_id)
        
        if strike is None:
            strike = UserStrike.create_new(user_id, channel_id)
            await self.create_strike_record(strike)
        
        return strike
    
    async def update_strike(self, strike: UserStrike) -> bool:
        """
        Actualiza un registro de strikes
        
        Args:
            strike: UserStrike actualizado
            
        Returns:
            True si se actualizó correctamente
        """
        strike.updated_at = datetime.utcnow()
        strike_dict = strike.to_dict()
        strike_dict.pop("_id", None)
        
        return await self.update_one(
            {"user_id": strike.user_id, "channel_id": strike.channel_id},
            {"$set": strike_dict}
        )
    
    async def increment_strike(
        self,
        user_id: str,
        channel_id: str
    ) -> UserStrike:
        """
        Incrementa el contador de strikes de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            UserStrike actualizado
        """
        strike = await self.get_or_create(user_id, channel_id)
        
        # Verificar si necesita reset
        if strike.should_reset_strikes():
            strike.reset_strikes()
        else:
            strike.increment_strike()
        
        await self.update_strike(strike)
        return strike
    
    async def reset_strikes(
        self,
        user_id: str,
        channel_id: str
    ) -> bool:
        """
        Resetea los strikes de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            True si se reseteó correctamente
        """
        strike = await self.get_by_user_and_channel(user_id, channel_id)
        
        if strike:
            strike.reset_strikes()
            return await self.update_strike(strike)
        
        return False
    
    async def apply_ban(
        self,
        user_id: str,
        channel_id: str,
        ban_type: str  # "temporary" | "permanent"
    ) -> UserStrike:
        """
        Aplica un ban a un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            ban_type: Tipo de ban
            
        Returns:
            UserStrike actualizado
        """
        strike = await self.get_or_create(user_id, channel_id)
        
        if ban_type == "temporary":
            strike.apply_temp_ban()
        else:
            strike.apply_perm_ban()
        
        await self.update_strike(strike)
        return strike
    
    async def remove_ban(
        self,
        user_id: str,
        channel_id: str
    ) -> bool:
        """
        Remueve el ban de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            True si se removió correctamente
        """
        strike = await self.get_by_user_and_channel(user_id, channel_id)
        
        if strike:
            strike.unban()
            return await self.update_strike(strike)
        
        return False
    
    async def get_banned_users(
        self,
        channel_id: Optional[str] = None
    ) -> List[UserStrike]:
        """
        Obtiene lista de usuarios baneados
        
        Args:
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Lista de UserStrike de usuarios baneados
        """
        query = {"is_banned": True}
        if channel_id:
            query["channel_id"] = channel_id
        
        docs = await self.find_many(query)
        return [UserStrike(**doc) for doc in docs]
    
    async def get_users_with_strikes(
        self,
        channel_id: str,
        min_strikes: int = 1
    ) -> List[UserStrike]:
        """
        Obtiene usuarios con al menos X strikes
        
        Args:
            channel_id: ID del canal
            min_strikes: Número mínimo de strikes
            
        Returns:
            Lista de UserStrike
        """
        query = {
            "channel_id": channel_id,
            "strike_count": {"$gte": min_strikes}
        }
        sort = [("strike_count", -1)]
        
        docs = await self.find_many(query, sort=sort)
        return [UserStrike(**doc) for doc in docs]
    
    async def check_and_update_expired_bans(self) -> int:
        """
        Verifica y actualiza bans temporales expirados
        
        Returns:
            Número de bans actualizados
        """
        query = {
            "is_banned": True,
            "ban_type": "temporary",
            "ban_expires_at": {"$lte": datetime.utcnow()}
        }
        
        try:
            result = await self.collection.update_many(
                query,
                {
                    "$set": {
                        "is_banned": False,
                        "ban_type": None,
                        "ban_expires_at": None,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            updated = result.modified_count
            if updated > 0:
                log.info(f"Unbanned {updated} users with expired temporary bans")
            
            return updated
        except Exception as e:
            log.error(f"Error updating expired bans: {e}")
            return 0
    
    async def get_stats_by_channel(self, channel_id: str) -> dict:
        """
        Obtiene estadísticas de strikes de un canal
        
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
                    "total_users": {"$sum": 1},
                    "total_strikes": {"$sum": "$strike_count"},
                    "banned_users": {
                        "$sum": {"$cond": ["$is_banned", 1, 0]}
                    },
                    "temp_banned": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$ban_type", "temporary"]},
                                1,
                                0
                            ]
                        }
                    },
                    "perm_banned": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$ban_type", "permanent"]},
                                1,
                                0
                            ]
                        }
                    },
                    "avg_strikes": {"$avg": "$strike_count"}
                }
            }
        ]
        
        results = await self.aggregate(pipeline)
        
        if results:
            stats = results[0]
            stats.pop("_id", None)
            return stats
        
        return {
            "total_users": 0,
            "total_strikes": 0,
            "banned_users": 0,
            "temp_banned": 0,
            "perm_banned": 0,
            "avg_strikes": 0
        }

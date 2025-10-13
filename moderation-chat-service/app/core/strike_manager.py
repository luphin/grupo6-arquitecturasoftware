"""
Gestor de strikes y baneos
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
from app.repositories.strike_repository import StrikeRepository
from app.repositories.ban_repository import BanRepository
from app.models.user_strike import UserStrike
from app.models.ban import Ban
from app.config.settings import settings
from app.utils.logger import log
from app.utils.exceptions import StrikeException


class StrikeManager:
    """
    Gestor del sistema de strikes y baneos
    """
    
    def __init__(
        self,
        strike_repository: StrikeRepository,
        ban_repository: BanRepository
    ):
        """
        Inicializa el gestor de strikes
        
        Args:
            strike_repository: Repository de strikes
            ban_repository: Repository de baneos
        """
        self.strike_repo = strike_repository
        self.ban_repo = ban_repository
        
        # Configuración del sistema de strikes
        self.max_strikes_temp_ban = settings.MAX_STRIKES_BEFORE_TEMP_BAN
        self.max_strikes_perm_ban = settings.MAX_STRIKES_BEFORE_PERM_BAN
        self.temp_ban_hours = settings.TEMP_BAN_HOURS
    
    async def apply_strike(
        self,
        user_id: str,
        channel_id: str,
        severity: str,
        reason: str
    ) -> Dict:
        """
        Aplica un strike a un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            severity: Severidad de la violación
            reason: Razón del strike
            
        Returns:
            Dict con acción tomada:
            {
                'action': str,  # 'warning', 'temp_ban', 'perm_ban'
                'strike_count': int,
                'message': str,
                'ban_info': dict (opcional)
            }
        """
        try:
            # 1. Incrementar strike
            strike = await self.strike_repo.increment_strike(user_id, channel_id)
            
            log.info(
                f"Strike applied: user={user_id}, channel={channel_id}, "
                f"count={strike.strike_count}, severity={severity}"
            )
            
            # 2. Determinar acción basada en strikes
            action_result = await self._determine_action(
                strike,
                user_id,
                channel_id,
                severity,
                reason
            )
            
            return action_result
            
        except Exception as e:
            log.error(f"Error applying strike: {e}")
            raise StrikeException(f"Failed to apply strike: {e}")
    
    async def _determine_action(
        self,
        strike: UserStrike,
        user_id: str,
        channel_id: str,
        severity: str,
        reason: str
    ) -> Dict:
        """
        Determina qué acción tomar basado en el número de strikes
        
        Args:
            strike: Objeto UserStrike actualizado
            user_id: ID del usuario
            channel_id: ID del canal
            severity: Severidad
            reason: Razón
            
        Returns:
            Dict con acción y detalles
        """
        strike_count = strike.strike_count
        
        # Caso 1: Ban permanente
        if strike_count >= self.max_strikes_perm_ban:
            await self._apply_permanent_ban(strike, user_id, channel_id, reason)
            
            return {
                'action': 'perm_ban',
                'strike_count': strike_count,
                'message': f'Usuario baneado permanentemente. Strikes: {strike_count}/{self.max_strikes_perm_ban}',
                'ban_info': {
                    'type': 'permanent',
                    'expires_at': None
                }
            }
        
        # Caso 2: Ban temporal
        elif strike_count >= self.max_strikes_temp_ban:
            ban_until = await self._apply_temporary_ban(strike, user_id, channel_id, reason)
            
            return {
                'action': 'temp_ban',
                'strike_count': strike_count,
                'message': f'Usuario baneado temporalmente por {self.temp_ban_hours}h. Strikes: {strike_count}/{self.max_strikes_temp_ban}',
                'ban_info': {
                    'type': 'temporary',
                    'expires_at': ban_until.isoformat()
                }
            }
        
        # Caso 3: Solo advertencia
        else:
            return {
                'action': 'warning',
                'strike_count': strike_count,
                'message': f'Advertencia. Strike {strike_count}/{self.max_strikes_temp_ban}',
                'ban_info': None
            }
    
    async def _apply_temporary_ban(
        self,
        strike: UserStrike,
        user_id: str,
        channel_id: str,
        reason: str
    ) -> datetime:
        """
        Aplica un ban temporal
        
        Args:
            strike: UserStrike
            user_id: ID del usuario
            channel_id: ID del canal
            reason: Razón del ban
            
        Returns:
            Fecha de expiración del ban
        """
        # Actualizar strike
        await self.strike_repo.apply_ban(user_id, channel_id, "temporary")
        
        # Crear registro de ban
        ban_until = datetime.utcnow() + timedelta(hours=self.temp_ban_hours)
        ban = Ban.create_temporary(
            user_id=user_id,
            channel_id=channel_id,
            reason=reason,
            banned_until=ban_until,
            total_violations=strike.strike_count,
            banned_by="system"
        )
        
        await self.ban_repo.create_ban(ban)
        
        log.warning(
            f"Temporary ban applied: user={user_id}, channel={channel_id}, "
            f"until={ban_until.isoformat()}"
        )
        
        return ban_until
    
    async def _apply_permanent_ban(
        self,
        strike: UserStrike,
        user_id: str,
        channel_id: str,
        reason: str
    ):
        """
        Aplica un ban permanente
        
        Args:
            strike: UserStrike
            user_id: ID del usuario
            channel_id: ID del canal
            reason: Razón del ban
        """
        # Actualizar strike
        await self.strike_repo.apply_ban(user_id, channel_id, "permanent")
        
        # Crear registro de ban
        ban = Ban.create_permanent(
            user_id=user_id,
            channel_id=channel_id,
            reason=reason,
            total_violations=strike.strike_count,
            banned_by="system"
        )
        
        await self.ban_repo.create_ban(ban)
        
        log.warning(
            f"Permanent ban applied: user={user_id}, channel={channel_id}"
        )
    
    async def is_user_banned(
        self,
        user_id: str,
        channel_id: str
    ) -> tuple[bool, Optional[Ban]]:
        """
        Verifica si un usuario está baneado
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            Tupla (is_banned, ban_info)
        """
        try:
            # Verificar strike
            strike = await self.strike_repo.get_by_user_and_channel(user_id, channel_id)
            
            if not strike or not strike.is_banned:
                return False, None
            
            # Verificar si el ban temporal expiró
            if strike.is_ban_expired():
                await self.unban_user(user_id, channel_id, "system", "Ban temporal expirado")
                return False, None
            
            # Obtener info del ban
            ban = await self.ban_repo.get_active_ban(user_id, channel_id)
            
            return True, ban
            
        except Exception as e:
            log.error(f"Error checking ban status: {e}")
            return False, None
    
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
            unbanned_by: Usuario o sistema que desbaneó
            reason: Razón del desbaneo
            
        Returns:
            True si se desbaneó correctamente
        """
        try:
            # Actualizar strike
            await self.strike_repo.remove_ban(user_id, channel_id)
            
            # Actualizar ban
            success = await self.ban_repo.unban_user(user_id, channel_id, unbanned_by, reason)
            
            if success:
                log.info(
                    f"User unbanned: user={user_id}, channel={channel_id}, "
                    f"by={unbanned_by}"
                )
            
            return success
            
        except Exception as e:
            log.error(f"Error unbanning user: {e}")
            raise StrikeException(f"Failed to unban user: {e}")
    
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
        try:
            success = await self.strike_repo.reset_strikes(user_id, channel_id)
            
            if success:
                log.info(f"Strikes reset: user={user_id}, channel={channel_id}")
            
            return success
            
        except Exception as e:
            log.error(f"Error resetting strikes: {e}")
            raise StrikeException(f"Failed to reset strikes: {e}")
    
    async def get_user_status(
        self,
        user_id: str,
        channel_id: str
    ) -> Dict:
        """
        Obtiene el estado completo de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            Dict con estado completo
        """
        try:
            strike = await self.strike_repo.get_by_user_and_channel(user_id, channel_id)
            
            if not strike:
                return {
                    'user_id': user_id,
                    'channel_id': channel_id,
                    'strike_count': 0,
                    'is_banned': False,
                    'ban_type': None,
                    'ban_expires_at': None,
                    'strikes_reset_at': None
                }
            
            return {
                'user_id': user_id,
                'channel_id': channel_id,
                'strike_count': strike.strike_count,
                'is_banned': strike.is_banned,
                'ban_type': strike.ban_type,
                'ban_expires_at': strike.ban_expires_at.isoformat() if strike.ban_expires_at else None,
                'strikes_reset_at': strike.strikes_reset_at.isoformat() if strike.strikes_reset_at else None,
                'last_violation': strike.last_violation.isoformat() if strike.last_violation else None
            }
            
        except Exception as e:
            log.error(f"Error getting user status: {e}")
            raise StrikeException(f"Failed to get user status: {e}")
    
    async def check_expired_bans(self) -> int:
        """
        Verifica y actualiza bans expirados
        
        Returns:
            Número de bans actualizados
        """
        try:
            # Actualizar strikes
            strikes_updated = await self.strike_repo.check_and_update_expired_bans()
            
            # Actualizar bans
            bans_updated = await self.ban_repo.check_and_expire_bans()
            
            total = strikes_updated + bans_updated
            if total > 0:
                log.info(f"Expired bans updated: {total}")
            
            return total
            
        except Exception as e:
            log.error(f"Error checking expired bans: {e}")
            return 0

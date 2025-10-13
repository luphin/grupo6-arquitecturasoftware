"""
Publicador de eventos de moderación
"""

from typing import Optional, Dict, Any
from datetime import datetime
from app.config.events import RabbitMQEventBus
from app.utils.logger import log


class EventPublisher:
    """
    Publicador de eventos de moderación para otros microservicios
    """
    
    def __init__(self, event_bus: RabbitMQEventBus):
        """
        Inicializa el publicador de eventos
        
        Args:
            event_bus: Cliente de RabbitMQ
        """
        self.event_bus = event_bus
    
    async def publish_warning(
        self,
        user_id: str,
        channel_id: str,
        message_id: str,
        strike_count: int,
        severity: str,
        detected_words: list[str],
        toxicity_score: float
    ) -> bool:
        """
        Publica evento de advertencia
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            message_id: ID del mensaje
            strike_count: Número de strikes actuales
            severity: Severidad de la violación
            detected_words: Palabras detectadas
            toxicity_score: Score de toxicidad
            
        Returns:
            True si se publicó correctamente
        """
        try:
            return await self.event_bus.publish_moderation_warning(
                user_id=user_id,
                channel_id=channel_id,
                strike_count=strike_count,
                message_id=message_id,
                severity=severity
            )
        except Exception as e:
            log.error(f"Error publishing warning event: {e}")
            return False
    
    async def publish_user_banned(
        self,
        user_id: str,
        channel_id: str,
        ban_type: str,
        banned_until: Optional[str],
        reason: str,
        strike_count: int
    ) -> bool:
        """
        Publica evento de usuario baneado
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            ban_type: Tipo de ban (temporary/permanent)
            banned_until: Fecha de expiración (ISO format)
            reason: Razón del ban
            strike_count: Número de strikes
            
        Returns:
            True si se publicó correctamente
        """
        try:
            return await self.event_bus.publish_user_banned(
                user_id=user_id,
                channel_id=channel_id,
                ban_type=ban_type,
                banned_until=banned_until,
                reason=reason
            )
        except Exception as e:
            log.error(f"Error publishing user banned event: {e}")
            return False
    
    async def publish_user_unbanned(
        self,
        user_id: str,
        channel_id: str,
        unbanned_by: str,
        reason: Optional[str]
    ) -> bool:
        """
        Publica evento de usuario desbaneado
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            unbanned_by: Usuario que desbaneó
            reason: Razón del desbaneo
            
        Returns:
            True si se publicó correctamente
        """
        try:
            return await self.event_bus.publish_user_unbanned(
                user_id=user_id,
                channel_id=channel_id,
                unbanned_by=unbanned_by,
                reason=reason
            )
        except Exception as e:
            log.error(f"Error publishing user unbanned event: {e}")
            return False
    
    async def publish_message_blocked(
        self,
        user_id: str,
        channel_id: str,
        message_id: str,
        reason: str,
        toxicity_score: float,
        detected_words: list[str]
    ) -> bool:
        """
        Publica evento de mensaje bloqueado
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            message_id: ID del mensaje
            reason: Razón del bloqueo
            toxicity_score: Score de toxicidad
            detected_words: Palabras detectadas
            
        Returns:
            True si se publicó correctamente
        """
        try:
            return await self.event_bus.publish_message_blocked(
                user_id=user_id,
                channel_id=channel_id,
                message_id=message_id,
                reason=reason,
                toxicity_score=toxicity_score
            )
        except Exception as e:
            log.error(f"Error publishing message blocked event: {e}")
            return False
    
    async def publish_custom_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        routing_key: Optional[str] = None
    ) -> bool:
        """
        Publica un evento personalizado
        
        Args:
            event_type: Tipo de evento
            data: Datos del evento
            routing_key: Routing key personalizada
            
        Returns:
            True si se publicó correctamente
        """
        try:
            return await self.event_bus.publish_event(
                event_type=event_type,
                data=data,
                routing_key=routing_key
            )
        except Exception as e:
            log.error(f"Error publishing custom event: {e}")
            return False

"""
Configuración y gestión de conexión a RabbitMQ (Event Bus)
"""

from typing import Optional, Dict, Any
import json
from datetime import datetime
import aio_pika
from aio_pika import Connection, Channel, Exchange, ExchangeType
from app.config.settings import settings
from app.utils.logger import log
from app.utils.exceptions import EventPublishException


class RabbitMQEventBus:
    """
    Gestor de conexión a RabbitMQ para publicar eventos
    """
    
    def __init__(self):
        self.connection: Optional[Connection] = None
        self.channel: Optional[Channel] = None
        self.exchange: Optional[Exchange] = None
    
    async def connect(self):
        """Establece conexión con RabbitMQ"""
        try:
            log.info(f"Connecting to RabbitMQ: {settings.RABBITMQ_URL}")
            
            self.connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL,
                timeout=10
            )
            
            self.channel = await self.connection.channel()
            
            # Configurar QoS
            await self.channel.set_qos(prefetch_count=10)
            
            # Declarar exchange (topic para routing por patrones)
            self.exchange = await self.channel.declare_exchange(
                settings.RABBITMQ_EXCHANGE,
                ExchangeType.TOPIC,
                durable=True
            )
            
            log.info(f"✅ Connected to RabbitMQ: exchange={settings.RABBITMQ_EXCHANGE}")
            
        except Exception as e:
            log.error(f"❌ Failed to connect to RabbitMQ: {e}")
            raise EventPublishException(f"RabbitMQ connection failed: {e}")
    
    async def disconnect(self):
        """Cierra la conexión con RabbitMQ"""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            log.info("RabbitMQ connection closed")
    
    async def publish_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        routing_key: Optional[str] = None
    ) -> bool:
        """
        Publica un evento en RabbitMQ
        
        Args:
            event_type: Tipo de evento (ej: "moderation.warning", "moderation.user_banned")
            data: Datos del evento
            routing_key: Routing key personalizada (si no se provee, usa event_type)
            
        Returns:
            True si se publicó exitosamente
        """
        if not settings.RABBITMQ_ENABLED:
            log.debug("Event publishing disabled")
            return False
        
        try:
            # Agregar metadata al evento
            event = {
                "event_type": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "service": settings.APP_NAME,
                "version": settings.APP_VERSION,
                "data": data
            }
            
            # Serializar a JSON
            message_body = json.dumps(event, default=str)
            
            # Crear mensaje
            message = aio_pika.Message(
                body=message_body.encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,  # Persistir en disco
            )
            
            # Publicar
            routing = routing_key or event_type
            await self.exchange.publish(
                message,
                routing_key=routing
            )
            
            log.info(f"📤 Event published: {event_type} → {routing}")
            return True
            
        except Exception as e:
            log.error(f"Error publishing event '{event_type}': {e}")
            return False
    
    async def publish_moderation_warning(
        self,
        user_id: str,
        channel_id: str,
        strike_count: int,
        message_id: str,
        severity: str
    ) -> bool:
        """Publica evento de advertencia"""
        return await self.publish_event(
            event_type="moderation.warning",
            data={
                "user_id": user_id,
                "channel_id": channel_id,
                "strike_count": strike_count,
                "message_id": message_id,
                "severity": severity
            },
            routing_key="moderation.warning"
        )
    
    async def publish_user_banned(
        self,
        user_id: str,
        channel_id: str,
        ban_type: str,
        banned_until: Optional[str],
        reason: str
    ) -> bool:
        """Publica evento de baneo de usuario"""
        return await self.publish_event(
            event_type="moderation.user_banned",
            data={
                "user_id": user_id,
                "channel_id": channel_id,
                "ban_type": ban_type,  # "temporary" | "permanent"
                "banned_until": banned_until,
                "reason": reason
            },
            routing_key="moderation.user_banned"
        )
    
    async def publish_user_unbanned(
        self,
        user_id: str,
        channel_id: str,
        unbanned_by: str,
        reason: Optional[str]
    ) -> bool:
        """Publica evento de desbaneo de usuario"""
        return await self.publish_event(
            event_type="moderation.user_unbanned",
            data={
                "user_id": user_id,
                "channel_id": channel_id,
                "unbanned_by": unbanned_by,
                "reason": reason
            },
            routing_key="moderation.user_unbanned"
        )
    
    async def publish_message_blocked(
        self,
        user_id: str,
        channel_id: str,
        message_id: str,
        reason: str,
        toxicity_score: float
    ) -> bool:
        """Publica evento de mensaje bloqueado"""
        return await self.publish_event(
            event_type="moderation.message_blocked",
            data={
                "user_id": user_id,
                "channel_id": channel_id,
                "message_id": message_id,
                "reason": reason,
                "toxicity_score": toxicity_score
            },
            routing_key="moderation.message_blocked"
        )
    
    async def health_check(self) -> bool:
        """Verifica el estado de la conexión"""
        try:
            if self.connection and not self.connection.is_closed:
                return True
            return False
        except Exception:
            return False


# Singleton instance
rabbitmq = RabbitMQEventBus()


async def get_event_bus() -> RabbitMQEventBus:
    """
    Dependency para obtener la instancia del event bus
    
    Usage:
        @router.post("/")
        async def endpoint(event_bus: RabbitMQEventBus = Depends(get_event_bus)):
            await event_bus.publish_event("test", {"data": "value"})
    """
    if rabbitmq.connection is None or rabbitmq.connection.is_closed:
        await rabbitmq.connect()
    return rabbitmq

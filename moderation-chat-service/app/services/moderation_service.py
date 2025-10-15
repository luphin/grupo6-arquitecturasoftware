"""
Servicio principal de moderación
Orquesta toda la lógica entre core, repositories y event bus
"""

from typing import Dict, List, Optional
import hashlib
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.moderation_engine import ModerationEngine
from app.core.blacklist_manager import BlacklistManager
from app.core.strike_manager import StrikeManager
from app.core.event_publisher import EventPublisher
from app.core.language_detector import LanguageDetector

from app.repositories.violation_repository import ViolationRepository
from app.repositories.strike_repository import StrikeRepository
from app.repositories.ban_repository import BanRepository
from app.repositories.blacklist_repository import BlacklistRepository

from app.models.violation import Violation
from app.config.cache import RedisCache
from app.config.events import RabbitMQEventBus
from app.utils.logger import log
from app.utils.exceptions import ModerationServiceException


class ModerationService:
    """
    Servicio principal de moderación
    
    Responsabilidades:
    - Orquestar el flujo completo de moderación
    - Coordinar entre core logic, repositories y event bus
    - Manejar transacciones y rollback si es necesario
    """
    
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        cache: RedisCache,
        event_bus: RabbitMQEventBus
    ):
        """
        Inicializa el servicio de moderación
        
        Args:
            db: Base de datos MongoDB
            cache: Cliente Redis
            event_bus: Cliente RabbitMQ
        """
        # Repositories
        self.violation_repo = ViolationRepository(db)
        self.strike_repo = StrikeRepository(db)
        self.ban_repo = BanRepository(db)
        self.blacklist_repo = BlacklistRepository(db)
        
        # Core Logic
        self.language_detector = LanguageDetector()
        self.moderation_engine = ModerationEngine(self.language_detector)
        self.blacklist_manager = BlacklistManager(self.blacklist_repo, cache)
        self.strike_manager = StrikeManager(self.strike_repo, self.ban_repo)
        self.event_publisher = EventPublisher(event_bus)
    
    async def initialize(self):
        """Inicializa el servicio (carga cache, etc.)"""
        log.info("Initializing ModerationService...")
        await self.blacklist_manager.initialize()
        log.info("✅ ModerationService initialized")
    
    async def moderate_message(
        self,
        message_id: str,
        user_id: str,
        channel_id: str,
        content: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Flujo completo de moderación de un mensaje
        
        Args:
            message_id: ID del mensaje
            user_id: ID del usuario
            channel_id: ID del canal
            content: Contenido del mensaje
            metadata: Metadata adicional
            
        Returns:
            Dict con resultado de moderación
        """
        try:
            log.info(
                f"Moderating message: user={user_id}, channel={channel_id}, "
                f"message={message_id}"
            )
            
            # 1. Verificar si el usuario está baneado
            is_banned, ban_info = await self.strike_manager.is_user_banned(
                user_id, channel_id
            )
            
            if is_banned:
                log.warning(f"User is banned: user={user_id}, channel={channel_id}")
                return self._create_banned_response(ban_info)
            
            # 2. Detectar idioma
            language = self.language_detector.detect_language(content)
            
            # 3. Analizar con Detoxify
            detoxify_analysis = self.moderation_engine.analyze_message(content)
            
            # 4. Verificar lista negra
            blacklist_result = await self.blacklist_manager.check_text(
                content, language
            )
            
            # 5. Combinar resultados
            combined_analysis = self._combine_analysis(
                detoxify_analysis,
                blacklist_result
            )
            
            # 6. Determinar si es tóxico
            if not combined_analysis['is_toxic']:
                log.info(f"Message approved: message={message_id}")
                return self._create_approved_response(combined_analysis)
            
            # 7. El mensaje es tóxico - registrar violación
            violation = await self._create_violation(
                message_id=message_id,
                user_id=user_id,
                channel_id=channel_id,
                content=content,
                analysis=combined_analysis,
                metadata=metadata
            )
            
            # 8. Aplicar strike
            strike_result = await self.strike_manager.apply_strike(
                user_id=user_id,
                channel_id=channel_id,
                severity=combined_analysis['severity'],
                reason=f"Contenido inapropiado detectado. Score: {combined_analysis['toxicity_score']:.2f}"
            )
            
            # 9. Publicar eventos
            await self._publish_events(
                user_id=user_id,
                channel_id=channel_id,
                message_id=message_id,
                strike_result=strike_result,
                analysis=combined_analysis
            )
            
            # 10. Crear respuesta
            response = self._create_moderation_response(
                strike_result=strike_result,
                analysis=combined_analysis,
                language=language
            )
            
            log.info(
                f"Moderation complete: action={response['action']}, "
                f"strikes={response['strike_count']}"
            )
            
            return response
            
        except Exception as e:
            log.error(f"Error in moderate_message: {e}")
            raise ModerationServiceException(f"Moderation failed: {e}")
    
    def _combine_analysis(
        self,
        detoxify_result: Dict,
        blacklist_result: Dict
    ) -> Dict:
        """
        Combina los resultados de Detoxify y lista negra
        
        Args:
            detoxify_result: Resultado de Detoxify
            blacklist_result: Resultado de lista negra
            
        Returns:
            Análisis combinado
        """
        # Si hay palabras en lista negra, dar más peso
        if blacklist_result['has_blacklisted_words']:
            blacklist_severity_scores = {
                'low': 0.6,
                'medium': 0.75,
                'high': 0.9
            }
            blacklist_score = blacklist_severity_scores.get(
                blacklist_result['max_severity'],
                0.7
            )
        else:
            blacklist_score = 0.0
        
        # Combinar scores (máximo entre ambos)
        combined_score = max(
            detoxify_result['toxicity_score'],
            blacklist_score
        )
        
        # Determinar si es tóxico
        is_toxic = (
            detoxify_result['is_toxic'] or
            blacklist_result['has_blacklisted_words']
        )
        
        # Calcular severidad final
        severity = self._calculate_final_severity(
            combined_score,
            detoxify_result['severity'],
            blacklist_result['max_severity']
        )
        
        return {
            'is_toxic': is_toxic,
            'toxicity_score': combined_score,
            'severity': severity,
            'language': detoxify_result['language'],
            'detected_words': blacklist_result['detected_words'],
            'detoxify_scores': detoxify_result['detoxify_scores'],
            'detoxify_categories': detoxify_result.get('detoxify_categories', [])  # ← Acceder correctamente
        }
    
    def _calculate_final_severity(
        self,
        score: float,
        detoxify_severity: str,
        blacklist_severity: str
    ) -> str:
        """
        Calcula la severidad final combinando ambas fuentes
        
        Args:
            score: Score combinado
            detoxify_severity: Severidad de Detoxify
            blacklist_severity: Severidad de lista negra
            
        Returns:
            Severidad final
        """
        severity_order = {'none': 0, 'low': 1, 'medium': 2, 'high': 3}
        
        # Tomar la severidad más alta
        max_severity = max(
            severity_order.get(detoxify_severity, 0),
            severity_order.get(blacklist_severity, 0)
        )
        
        # Convertir de vuelta a string
        for sev, order in severity_order.items():
            if order == max_severity:
                return sev
        
        return 'medium'
    
    async def _create_violation(
        self,
        message_id: str,
        user_id: str,
        channel_id: str,
        content: str,
        analysis: Dict,
        metadata: Optional[Dict]
    ) -> Violation:
        """
        Crea un registro de violación
        
        Args:
            message_id: ID del mensaje
            user_id: ID del usuario
            channel_id: ID del canal
            content: Contenido del mensaje
            analysis: Análisis combinado
            metadata: Metadata adicional
            
        Returns:
            Violation creada
        """
        # Hash del contenido (no guardamos texto completo por privacidad)
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        # Obtener strike count actual
        strike = await self.strike_repo.get_by_user_and_channel(user_id, channel_id)
        strike_count = strike.strike_count if strike else 0
        
        # Crear violación
        violation = Violation(
            user_id=user_id,
            channel_id=channel_id,
            message_id=message_id,
            message_content_hash=content_hash,
            detected_words=analysis['detected_words'],
            toxicity_score=analysis['toxicity_score'],
            severity=analysis['severity'],
            action_taken='message_blocked',  # Se actualiza después
            strike_count_at_time=strike_count,
            metadata=metadata or {}
        )
        
        # Guardar en BD
        created_violation = await self.violation_repo.create_violation(violation)
        
        return created_violation
    
    async def _publish_events(
        self,
        user_id: str,
        channel_id: str,
        message_id: str,
        strike_result: Dict,
        analysis: Dict
    ):
        """
        Publica eventos basados en la acción tomada
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            message_id: ID del mensaje
            strike_result: Resultado de aplicar strike
            analysis: Análisis del mensaje
        """
        action = strike_result['action']
        
        try:
            # Evento: mensaje bloqueado
            await self.event_publisher.publish_message_blocked(
                user_id=user_id,
                channel_id=channel_id,
                message_id=message_id,
                reason=f"Contenido inapropiado detectado ({analysis['severity']})",
                toxicity_score=analysis['toxicity_score'],
                detected_words=analysis['detected_words']
            )
            
            # Evento: advertencia
            if action == 'warning':
                await self.event_publisher.publish_warning(
                    user_id=user_id,
                    channel_id=channel_id,
                    message_id=message_id,
                    strike_count=strike_result['strike_count'],
                    severity=analysis['severity'],
                    detected_words=analysis['detected_words'],
                    toxicity_score=analysis['toxicity_score']
                )
            
            # Evento: ban (temporal o permanente)
            elif action in ['temp_ban', 'perm_ban']:
                ban_info = strike_result.get('ban_info', {})
                await self.event_publisher.publish_user_banned(
                    user_id=user_id,
                    channel_id=channel_id,
                    ban_type=ban_info.get('type', 'temporary'),
                    banned_until=ban_info.get('expires_at'),
                    reason=strike_result['message'],
                    strike_count=strike_result['strike_count']
                )
            
        except Exception as e:
            log.error(f"Error publishing events: {e}")
            # No lanzamos excepción para no fallar toda la moderación
    
    def _create_approved_response(self, analysis: Dict) -> Dict:
        """Crea respuesta para mensaje aprobado"""
        return {
            'is_approved': True,
            'action': 'approved',
            'severity': 'none',
            'toxicity_score': analysis['toxicity_score'],
            'strike_count': 0,
            'message': 'Mensaje aprobado',
            'detected_words': [],
            'language': analysis['language'],
            'ban_info': None
        }
    
    def _create_banned_response(self, ban_info) -> Dict:
        """Crea respuesta para usuario baneado"""
        return {
            'is_approved': False,
            'action': 'user_banned',
            'severity': 'high',
            'toxicity_score': 1.0,
            'strike_count': 0,
            'message': f'Usuario baneado. Tipo: {ban_info.ban_type}',
            'detected_words': [],
            'language': 'unknown',
            'ban_info': {
                'type': ban_info.ban_type,
                'expires_at': ban_info.banned_until.isoformat() if ban_info.banned_until else None,
                'reason': ban_info.reason
            }
        }
    
    def _create_moderation_response(
        self,
        strike_result: Dict,
        analysis: Dict,
        language: str
    ) -> Dict:
        """Crea respuesta de moderación"""
        return {
            'is_approved': False,
            'action': strike_result['action'],
            'severity': analysis['severity'],
            'toxicity_score': analysis['toxicity_score'],
            'strike_count': strike_result['strike_count'],
            'message': strike_result['message'],
            'detected_words': analysis['detected_words'],
            'language': language,
            'ban_info': strike_result.get('ban_info')
        }
    
    async def analyze_text_only(
        self,
        text: str,
        language: Optional[str] = None
    ) -> Dict:
        """
        Analiza un texto sin aplicar strikes (solo análisis)
        
        Args:
            text: Texto a analizar
            language: Idioma (opcional, se detecta automáticamente)
            
        Returns:
            Dict con análisis completo
        """
        try:
            # Detectar idioma si no se provee
            if not language:
                language = self.language_detector.detect_language(text)
            
            # Analizar con Detoxify
            detoxify_analysis = self.moderation_engine.analyze_message(text)
            
            # Verificar lista negra
            blacklist_result = await self.blacklist_manager.check_text(text, language)
            
            # Combinar resultados
            combined_analysis = self._combine_analysis(
                detoxify_analysis,
                blacklist_result
            )
            
            return combined_analysis
            
        except Exception as e:
            log.error(f"Error in analyze_text_only: {e}")
            raise ModerationServiceException(f"Text analysis failed: {e}")
    
    async def get_user_status(
        self,
        user_id: str,
        channel_id: str
    ) -> Dict:
        """
        Obtiene el estado completo de moderación de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            
        Returns:
            Dict con estado completo
        """
        try:
            status = await self.strike_manager.get_user_status(user_id, channel_id)
            return status
        except Exception as e:
            log.error(f"Error getting user status: {e}")
            raise ModerationServiceException(f"Failed to get user status: {e}")
    
    async def get_banned_users(
        self,
        channel_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Obtiene lista de usuarios baneados
        
        Args:
            channel_id: Filtrar por canal (opcional)
            
        Returns:
            Lista de usuarios baneados con su información
        """
        try:
            bans = await self.ban_repo.get_all_active_bans()
            
            if channel_id:
                bans = [b for b in bans if b.channel_id == channel_id]
            
            result = []
            for ban in bans:
                # Obtener strikes del usuario
                strike = await self.strike_repo.get_by_user_and_channel(
                    ban.user_id, ban.channel_id
                )
                
                result.append({
                    'user_id': ban.user_id,
                    'channel_id': ban.channel_id,
                    'ban_type': ban.ban_type,
                    'banned_at': ban.banned_at.isoformat(),
                    'banned_until': ban.banned_until.isoformat() if ban.banned_until else None,
                    'reason': ban.reason,
                    'total_violations': ban.total_violations,
                    'strike_count': strike.strike_count if strike else 0
                })
            
            return result
            
        except Exception as e:
            log.error(f"Error getting banned users: {e}")
            raise ModerationServiceException(f"Failed to get banned users: {e}")
    
    async def get_user_violations(
        self,
        user_id: str,
        channel_id: str,
        limit: int = 50
    ) -> Dict:
        """
        Obtiene el historial de violaciones de un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            limit: Límite de resultados
            
        Returns:
            Dict con historial completo
        """
        try:
            # Obtener violaciones
            violations = await self.violation_repo.get_by_user_and_channel(
                user_id, channel_id, limit=limit
            )
            
            # Obtener estado actual
            status = await self.strike_manager.get_user_status(user_id, channel_id)
            
            # Formatear violaciones
            violations_data = [
                {
                    'id': str(v.id),
                    'message_id': v.message_id,
                    'detected_words': v.detected_words,
                    'toxicity_score': v.toxicity_score,
                    'severity': v.severity,
                    'action_taken': v.action_taken,
                    'strike_count_at_time': v.strike_count_at_time,
                    'timestamp': v.timestamp.isoformat()
                }
                for v in violations
            ]
            
            return {
                'user_id': user_id,
                'channel_id': channel_id,
                'total_violations': len(violations),
                'current_strikes': status['strike_count'],
                'is_banned': status['is_banned'],
                'violations': violations_data
            }
            
        except Exception as e:
            log.error(f"Error getting user violations: {e}")
            raise ModerationServiceException(f"Failed to get violations: {e}")
    
    async def unban_user(
        self,
        user_id: str,
        channel_id: str,
        unbanned_by: str,
        reason: Optional[str] = None,
        reset_strikes: bool = False
    ) -> bool:
        """
        Desbanea a un usuario
        
        Args:
            user_id: ID del usuario
            channel_id: ID del canal
            unbanned_by: Usuario que desbaneó
            reason: Razón del desbaneo
            reset_strikes: Si resetear strikes también
            
        Returns:
            True si se desbaneó correctamente
        """
        try:
            # Desbanear
            success = await self.strike_manager.unban_user(
                user_id, channel_id, unbanned_by, reason
            )
            
            if not success:
                return False
            
            # Resetear strikes si se solicitó
            if reset_strikes:
                await self.strike_manager.reset_strikes(user_id, channel_id)
            
            # Publicar evento
            await self.event_publisher.publish_user_unbanned(
                user_id=user_id,
                channel_id=channel_id,
                unbanned_by=unbanned_by,
                reason=reason
            )
            
            log.info(f"User unbanned: user={user_id}, channel={channel_id}")
            return True
            
        except Exception as e:
            log.error(f"Error unbanning user: {e}")
            raise ModerationServiceException(f"Failed to unban user: {e}")
    
    async def check_expired_bans(self) -> int:
        """
        Verifica y actualiza bans expirados (tarea periódica)
        
        Returns:
            Número de bans actualizados
        """
        try:
            return await self.strike_manager.check_expired_bans()
        except Exception as e:
            log.error(f"Error checking expired bans: {e}")
            return 0

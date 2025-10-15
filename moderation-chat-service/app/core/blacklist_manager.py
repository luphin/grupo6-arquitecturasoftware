"""
Gestor de lista negra con cache en Redis
"""

from typing import Dict, List, Set, Optional
import re
from datetime import datetime, timedelta
from app.repositories.blacklist_repository import BlacklistRepository
from app.models.blacklist_word import BlacklistWord
from app.config.cache import RedisCache
from app.config.settings import settings
from app.utils.logger import log
from app.utils.exceptions import BlacklistException


class BlacklistManager:
    """
    Gestor de listas negras con cache en Redis
    """
    
    def __init__(
        self,
        repository: BlacklistRepository,
        cache: RedisCache
    ):
        """
        Inicializa el gestor de lista negra
        
        Args:
            repository: Repository de palabras prohibidas
            cache: Cliente de Redis
        """
        self.repository = repository
        self.cache = cache
        self.cache_ttl = settings.CACHE_BLACKLIST_TTL
        
        # Prefijos de cache
        self.cache_prefix_words = "blacklist:words"
        self.cache_prefix_patterns = "blacklist:patterns"
    
    async def initialize(self):
        """Inicializa el cache al arrancar el servicio"""
        log.info("Initializing blacklist cache...")
        await self._refresh_cache()
        log.info("✅ Blacklist cache initialized")
    
    async def _refresh_cache(self):
        """Refresca el cache desde la base de datos"""
        try:
            # Obtener todas las palabras activas
            all_words = await self.repository.get_all_active()
            
            # Agrupar por idioma
            words_by_lang: Dict[str, List[str]] = {}
            patterns_by_lang: Dict[str, List[str]] = {}
            
            for word_obj in all_words:
                lang = word_obj.language
                
                if lang not in words_by_lang:
                    words_by_lang[lang] = []
                    patterns_by_lang[lang] = []
                
                if word_obj.is_regex:
                    patterns_by_lang[lang].append(word_obj.word)
                else:
                    words_by_lang[lang].append(word_obj.word.lower())
            
            # Guardar en Redis
            for lang, words in words_by_lang.items():
                cache_key = f"{self.cache_prefix_words}:{lang}"
                await self.cache.set(cache_key, words, ttl=self.cache_ttl)
            
            for lang, patterns in patterns_by_lang.items():
                cache_key = f"{self.cache_prefix_patterns}:{lang}"
                await self.cache.set(cache_key, patterns, ttl=self.cache_ttl)
            
            log.info(f"Cache refreshed with {len(all_words)} words")
            
        except Exception as e:
            log.error(f"Error refreshing blacklist cache: {e}")
            raise BlacklistException(f"Failed to refresh cache: {e}")
    
    async def _get_words_from_cache(self, language: str) -> Set[str]:
        """
        Obtiene palabras del cache
        
        Args:
            language: Código de idioma
            
        Returns:
            Set de palabras prohibidas
        """
        cache_key = f"{self.cache_prefix_words}:{language}"
        words = await self.cache.get(cache_key)
        
        if words is None:
            # Cache miss - refrescar
            await self._refresh_cache()
            words = await self.cache.get(cache_key)
        
        return set(words) if words else set()
    
    async def _get_patterns_from_cache(self, language: str) -> List[re.Pattern]:
        """
        Obtiene patrones regex del cache
        
        Args:
            language: Código de idioma
            
        Returns:
            Lista de patrones compilados
        """
        cache_key = f"{self.cache_prefix_patterns}:{language}"
        pattern_strings = await self.cache.get(cache_key)
        
        if pattern_strings is None:
            # Cache miss - refrescar
            await self._refresh_cache()
            pattern_strings = await self.cache.get(cache_key)
        
        if not pattern_strings:
            return []
        
        # Compilar patrones
        compiled_patterns = []
        for pattern_str in pattern_strings:
            try:
                compiled_patterns.append(re.compile(pattern_str, re.IGNORECASE))
            except re.error as e:
                log.error(f"Invalid regex pattern '{pattern_str}': {e}")
        
        return compiled_patterns
    
    async def check_text(self, text: str, language: str) -> Dict:
        """
        Verifica si el texto contiene palabras de lista negra
        
        Args:
            text: Texto a verificar
            language: Idioma del texto
            
        Returns:
            Dict con resultado:
            {
                'has_blacklisted_words': bool,
                'detected_words': List[str],
                'count': int,
                'max_severity': str
            }
        """
        if not text or not text.strip():
            return {
                'has_blacklisted_words': False,
                'detected_words': [],
                'count': 0,
                'max_severity': 'none'
            }
        
        text_lower = text.lower()
        detected_words = []

        try:
            # 1. Verificar palabras exactas
            words_set = await self._get_words_from_cache(language)
            for word in words_set:
                # Buscar palabra completa (con límites de palabra)
                if re.search(rf'\b{re.escape(word)}\b', text_lower):
                    detected_words.append(word)

            # 2. Verificar patrones regex
            patterns = await self._get_patterns_from_cache(language)
            for pattern in patterns:
                matches = pattern.findall(text)
                if matches:
                    detected_words.extend(matches)
            
            # 3. Obtener severidad máxima si hay palabras detectadas
            max_severity = 'none'
            if detected_words:
                max_severity = await self._get_max_severity(detected_words, language)
            
            return {
                'has_blacklisted_words': len(detected_words) > 0,
                'detected_words': list(set(detected_words)),  # Remover duplicados
                'count': len(detected_words),
                'max_severity': max_severity
            }
            
        except Exception as e:
            log.error(f"Error checking text against blacklist: {e}")
            # En caso de error, retornar resultado seguro
            return {
                'has_blacklisted_words': False,
                'detected_words': [],
                'count': 0,
                'max_severity': 'none',
                'error': str(e)
            }
    
    async def _get_max_severity(
        self,
        detected_words: List[str],
        language: str
    ) -> str:
        """
        Obtiene la severidad máxima de las palabras detectadas

        Args:
            detected_words: Lista de palabras detectadas
            language: Idioma

        Returns:
            'low', 'medium', o 'high'
        """
        severities = []

        for word in detected_words:
            word_obj = await self.repository.get_by_word_and_language(word, language)
            if word_obj:
                severities.append(word_obj.severity)

        if not severities:
            return 'medium'  # Default

        # Orden de severidad
        severity_order = {'low': 1, 'medium': 2, 'high': 3}
        max_severity = max(severities, key=lambda x: severity_order.get(x, 0))

        return max_severity
    
    async def add_word(
        self,
        word: str,
        language: str,
        category: str,
        severity: str,
        is_regex: bool = False,
        added_by: Optional[str] = None,
        notes: Optional[str] = None
    ) -> BlacklistWord:
        """
        Agrega una palabra a la lista negra
        
        Args:
            word: Palabra o patrón
            language: Código de idioma
            category: Categoría
            severity: Severidad
            is_regex: Si es expresión regular
            added_by: Usuario que agregó
            notes: Notas adicionales
            
        Returns:
            BlacklistWord creado
        """
        try:
            blacklist_word = BlacklistWord(
                word=word,
                language=language,
                category=category,
                severity=severity,
                is_regex=is_regex,
                added_by=added_by,
                notes=notes
            )
            
            created = await self.repository.create_word(blacklist_word)
            
            # Invalidar cache
            await self._refresh_cache()
            
            log.info(f"Word added to blacklist: {word} ({language})")
            return created
            
        except Exception as e:
            log.error(f"Error adding word to blacklist: {e}")
            raise BlacklistException(f"Failed to add word: {e}")
    
    async def remove_word(self, word_id: str) -> bool:
        """
        Elimina (desactiva) una palabra de la lista negra
        
        Args:
            word_id: ID de la palabra
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            result = await self.repository.deactivate_word(word_id)
            
            if result:
                # Invalidar cache
                await self._refresh_cache()
                log.info(f"Word removed from blacklist: {word_id}")
            
            return result
            
        except Exception as e:
            log.error(f"Error removing word from blacklist: {e}")
            raise BlacklistException(f"Failed to remove word: {e}")
    
    async def force_refresh(self):
        """Fuerza la actualización del cache"""
        await self._refresh_cache()
    
    async def get_stats(self) -> dict:
        """Obtiene estadísticas de la lista negra"""
        return await self.repository.get_stats()
    
    async def clear_cache(self):
        """Limpia el cache de lista negra"""
        try:
            await self.cache.delete_pattern(f"{self.cache_prefix_words}:*")
            await self.cache.delete_pattern(f"{self.cache_prefix_patterns}:*")
            log.info("Blacklist cache cleared")
        except Exception as e:
            log.error(f"Error clearing blacklist cache: {e}")

"""
Detector de idioma para mensajes
"""

from typing import Optional
from langdetect import detect, LangDetectException
from app.config.settings import settings
from app.utils.logger import log


class LanguageDetector:
    """
    Detector de idioma usando langdetect
    """
    
    def __init__(self):
        self.supported_languages = settings.supported_languages_list
        self.default_language = "es"
    
    def detect_language(self, text: str) -> str:
        """
        Detecta el idioma de un texto
        
        Args:
            text: Texto a analizar
            
        Returns:
            Código ISO del idioma detectado
        """
        if not text or not text.strip():
            return self.default_language
        
        try:
            detected_lang = detect(text)
            
            # Verificar si el idioma detectado está soportado
            if detected_lang in self.supported_languages:
                return detected_lang
            
            # Si no está soportado, usar idioma por defecto
            log.debug(
                f"Detected language '{detected_lang}' not supported, "
                f"using default '{self.default_language}'"
            )
            return self.default_language
            
        except LangDetectException as e:
            log.warning(f"Language detection failed: {e}, using default '{self.default_language}'")
            return self.default_language
        except Exception as e:
            log.error(f"Unexpected error in language detection: {e}")
            return self.default_language
    
    def is_supported(self, language: str) -> bool:
        """
        Verifica si un idioma está soportado
        
        Args:
            language: Código ISO del idioma
            
        Returns:
            True si está soportado
        """
        return language in self.supported_languages
    
    def get_supported_languages(self) -> list[str]:
        """Retorna la lista de idiomas soportados"""
        return self.supported_languages.copy()


# Singleton instance
_language_detector = None


def get_language_detector() -> LanguageDetector:
    """Obtiene la instancia singleton del detector de idioma"""
    global _language_detector
    if _language_detector is None:
        _language_detector = LanguageDetector()
    return _language_detector

"""
Motor de moderación usando Detoxify (multilenguaje)
"""

from typing import Dict, Optional
from detoxify import Detoxify
from app.config.settings import settings
from app.core.language_detector import LanguageDetector
from app.utils.logger import log
from app.utils.exceptions import ModerationEngineException


class ModerationEngine:
    """
    Motor de moderación usando Detoxify para detección de toxicidad
    """
    
    def __init__(self, language_detector: Optional[LanguageDetector] = None):
        """
        Inicializa el motor de moderación
        
        Args:
            language_detector: Detector de idioma (opcional)
        """
        self.language_detector = language_detector or LanguageDetector()
        
        # Cargar modelo Detoxify
        try:
            log.info(f"Loading Detoxify model: {settings.DETOXIFY_MODEL}")
            self.model = Detoxify(settings.DETOXIFY_MODEL)
            log.info("✅ Detoxify model loaded successfully")
        except Exception as e:
            log.error(f"❌ Failed to load Detoxify model: {e}")
            raise ModerationEngineException(f"Failed to load Detoxify model: {e}")
        
        # Umbrales de toxicidad
        self.thresholds = {
            'low': settings.TOXICITY_THRESHOLD_LOW,
            'medium': settings.TOXICITY_THRESHOLD_MEDIUM,
            'high': settings.TOXICITY_THRESHOLD_HIGH
        }
    
    def analyze_text(self, text: str) -> Dict:
        """
        Analiza el texto con Detoxify
        
        Args:
            text: Texto a analizar
            
        Returns:
            Dict con resultados del análisis
        """
        if not text or not text.strip():
            return self._empty_result()
        
        try:
            # Ejecutar Detoxify
            results = self.model.predict(text)
            
            # Calcular score máximo
            max_score = max(results.values())
            
            # Detectar categorías relevantes (score > 0.5)
            detected_categories = [
                category for category, score in results.items()
                if score > 0.5
            ]
            
            return {
                'toxicity': float(results.get('toxicity', 0)),
                'severe_toxicity': float(results.get('severe_toxicity', 0)),
                'obscene': float(results.get('obscene', 0)),
                'threat': float(results.get('threat', 0)),
                'insult': float(results.get('insult', 0)),
                'identity_hate': float(results.get('identity_hate', 0)),
                'max_score': float(max_score),
                # NO incluir detected_categories aquí, se retorna por separado
            }
            
        except Exception as e:
            log.error(f"Error analyzing text with Detoxify: {e}")
            raise ModerationEngineException(f"Detoxify analysis failed: {e}")
    
    def analyze_message(self, text: str) -> Dict:
        """
        Análisis completo de un mensaje (con detección de idioma)
        
        Args:
            text: Texto del mensaje
            
        Returns:
            Dict con análisis completo
        """
        if not text or not text.strip():
            return {
                'is_toxic': False,
                'toxicity_score': 0.0,
                'severity': 'none',
                'language': 'unknown',
                'detoxify_scores': self._empty_result(),
                'detoxify_categories': [],
                'confidence': 1.0
            }
        
        try:
            # 1. Detectar idioma
            language = self.language_detector.detect_language(text)
            
            # 2. Analizar con Detoxify
            detoxify_result = self.analyze_text(text)
            
            # 3. Extraer categorías detectadas (del resultado completo)
            results_with_categories = self.model.predict(text)
            detected_categories = [
                category for category, score in results_with_categories.items()
                if score > 0.5
            ]
            
            # 4. Determinar toxicidad
            toxicity_score = detoxify_result['max_score']
            is_toxic = toxicity_score >= self.thresholds['low']
            
            # 5. Calcular severidad
            severity = self._calculate_severity(toxicity_score)
            
            # 6. Calcular confianza
            confidence = min(toxicity_score * 1.2, 1.0) if is_toxic else 0.95
            
            return {
                'is_toxic': is_toxic,
                'toxicity_score': toxicity_score,
                'severity': severity,
                'language': language,
                'detoxify_scores': detoxify_result,  # Sin detected_categories
                'detoxify_categories': detected_categories,  # Separado
                'confidence': confidence
            }
            
        except ModerationEngineException:
            raise
        except Exception as e:
            log.error(f"Error in message analysis: {e}")
            raise ModerationEngineException(f"Message analysis failed: {e}")
    
    def batch_analyze(self, texts: list[str]) -> list[Dict]:
        """
        Analiza múltiples textos en batch
        
        Args:
            texts: Lista de textos a analizar
            
        Returns:
            Lista de resultados de análisis
        """
        return [self.analyze_message(text) for text in texts]
    
    def _calculate_severity(self, score: float) -> str:
        """
        Calcula el nivel de severidad basado en el score
        
        Args:
            score: Score de toxicidad (0-1)
            
        Returns:
            'none', 'low', 'medium', o 'high'
        """
        if score >= self.thresholds['high']:
            return 'high'
        elif score >= self.thresholds['medium']:
            return 'medium'
        elif score >= self.thresholds['low']:
            return 'low'
        else:
            return 'none'
    
    def _empty_result(self) -> Dict:
        """Retorna un resultado vacío"""
        return {
            'toxicity': 0.0,
            'severe_toxicity': 0.0,
            'obscene': 0.0,
            'threat': 0.0,
            'insult': 0.0,
            'identity_hate': 0.0,
            'max_score': 0.0,
            'detected_categories': []
        }
    
    def get_thresholds(self) -> Dict[str, float]:
        """Retorna los umbrales configurados"""
        return self.thresholds.copy()
    
    def update_thresholds(
        self,
        low: Optional[float] = None,
        medium: Optional[float] = None,
        high: Optional[float] = None
    ):
        """
        Actualiza los umbrales de toxicidad
        
        Args:
            low: Nuevo umbral bajo
            medium: Nuevo umbral medio
            high: Nuevo umbral alto
        """
        if low is not None and 0 <= low <= 1:
            self.thresholds['low'] = low
        if medium is not None and 0 <= medium <= 1:
            self.thresholds['medium'] = medium
        if high is not None and 0 <= high <= 1:
            self.thresholds['high'] = high
        
        log.info(f"Thresholds updated: {self.thresholds}")


# Singleton instance
_moderation_engine = None


def get_moderation_engine() -> ModerationEngine:
    """Obtiene la instancia singleton del motor de moderación"""
    global _moderation_engine
    if _moderation_engine is None:
        _moderation_engine = ModerationEngine()
    return _moderation_engine

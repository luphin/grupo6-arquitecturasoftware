"""
Configuración centralizada del servicio usando Pydantic Settings
"""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    """
    Configuración de la aplicación.
    
    Las variables se leen automáticamente de:
    1. Variables de entorno del sistema
    2. Archivo .env (si existe)
    3. Valores por defecto (si no se encuentra la variable)
    
    Prioridad: System ENV > .env > Default
    """
    
    # ===== APPLICATION =====
    APP_NAME: str = Field(
        default="moderation-service",
        description="Nombre de la aplicación"
    )
    APP_VERSION: str = Field(
        default="1.0.0",
        description="Versión de la aplicación"
    )
    ENVIRONMENT: str = Field(
        default="development",
        description="Entorno: development, staging, production"
    )
    DEBUG: bool = Field(
        default=True,
        description="Modo debug"
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Nivel de logging: DEBUG, INFO, WARNING, ERROR"
    )
    
    # ===== SERVER =====
    HOST: str = Field(
        default="0.0.0.0",
        description="Host del servidor"
    )
    PORT: int = Field(
        default=8000,
        description="Puerto del servidor"
    )
    
    # ===== MONGODB =====
    MONGODB_URL: str = Field(
        default="mongodb://mongodb:27017",
        description="URL de conexión a MongoDB"
    )
    MONGODB_DB: str = Field(
        default="moderation_db",
        description="Nombre de la base de datos"
    )
    MONGODB_MIN_POOL_SIZE: int = Field(
        default=10,
        description="Tamaño mínimo del pool de conexiones"
    )
    MONGODB_MAX_POOL_SIZE: int = Field(
        default=50,
        description="Tamaño máximo del pool de conexiones"
    )
    
    # ===== REDIS =====
    REDIS_URL: str = Field(
        default="redis://redis:6379/0",
        description="URL de conexión a Redis"
    )
    REDIS_PASSWORD: Optional[str] = Field(
        default=None,
        description="Password de Redis (opcional)"
    )
    REDIS_DB: int = Field(
        default=0,
        description="Número de base de datos Redis"
    )
    REDIS_MAX_CONNECTIONS: int = Field(
        default=50,
        description="Máximo de conexiones al pool de Redis"
    )
    REDIS_SOCKET_TIMEOUT: int = Field(
        default=5,
        description="Timeout de socket en segundos"
    )
    REDIS_SOCKET_CONNECT_TIMEOUT: int = Field(
        default=5,
        description="Timeout de conexión en segundos"
    )
    
    # Cache TTL
    CACHE_BLACKLIST_TTL: int = Field(
        default=1800,
        description="TTL del cache de lista negra en segundos (30 min)"
    )
    CACHE_BAN_LIST_TTL: int = Field(
        default=300,
        description="TTL del cache de lista de baneados en segundos (5 min)"
    )
    CACHE_DEFAULT_TTL: int = Field(
        default=600,
        description="TTL por defecto del cache en segundos (10 min)"
    )
    
    # ===== RABBITMQ =====
    RABBITMQ_URL: str = Field(
        default="amqp://guest:guest@rabbitmq:5672/",
        description="URL de conexión a RabbitMQ"
    )
    RABBITMQ_EXCHANGE: str = Field(
        default="moderation_events",
        description="Exchange de RabbitMQ"
    )
    RABBITMQ_QUEUE: str = Field(
        default="moderation_queue",
        description="Cola de RabbitMQ"
    )
    RABBITMQ_ROUTING_KEY: str = Field(
        default="moderation.*",
        description="Routing key de RabbitMQ"
    )
    RABBITMQ_ENABLED: bool = Field(
        default=True,
        description="Habilitar publicación de eventos"
    )
    
    # ===== MODERATION ENGINE =====
    DETOXIFY_MODEL: str = Field(
        default="multilingual",
        description="Modelo de Detoxify: multilingual, original, unbiased"
    )
    TOXICITY_THRESHOLD_LOW: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Umbral de toxicidad baja"
    )
    TOXICITY_THRESHOLD_MEDIUM: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Umbral de toxicidad media"
    )
    TOXICITY_THRESHOLD_HIGH: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Umbral de toxicidad alta"
    )
    
    # ===== STRIKE SYSTEM =====
    STRIKE_RESET_DAYS: int = Field(
        default=30,
        description="Días para resetear strikes automáticamente"
    )
    TEMP_BAN_HOURS: int = Field(
        default=24,
        description="Duración del ban temporal en horas"
    )
    MAX_STRIKES_BEFORE_TEMP_BAN: int = Field(
        default=3,
        description="Número de strikes antes de ban temporal"
    )
    MAX_STRIKES_BEFORE_PERM_BAN: int = Field(
        default=5,
        description="Número de strikes antes de ban permanente"
    )
    
    # ===== LANGUAGES =====
    SUPPORTED_LANGUAGES: str = Field(
        default="es,en,pt,fr,de,it",
        description="Idiomas soportados separados por coma"
    )
    
    @property
    def supported_languages_list(self) -> List[str]:
        """Retorna lista de idiomas soportados"""
        return [lang.strip() for lang in self.SUPPORTED_LANGUAGES.split(",")]
    
    # ===== API =====
    API_V1_PREFIX: str = Field(
        default="/api/v1",
        description="Prefijo de la API v1"
    )
    API_TITLE: str = Field(
        default="Moderation Service API",
        description="Título de la API"
    )
    API_DESCRIPTION: str = Field(
        default="Servicio de moderación multilenguaje para chat",
        description="Descripción de la API"
    )
    API_VERSION: str = Field(
        default="1.0.0",
        description="Versión de la API"
    )
    
    # CORS
    CORS_ORIGINS: str = Field(
        default='["http://localhost:3000","http://localhost:8080"]',
        description="Orígenes permitidos para CORS (JSON array)"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(
        default=True,
        description="Permitir credenciales en CORS"
    )
    CORS_ALLOW_METHODS: str = Field(
        default='["*"]',
        description="Métodos permitidos en CORS (JSON array)"
    )
    CORS_ALLOW_HEADERS: str = Field(
        default='["*"]',
        description="Headers permitidos en CORS (JSON array)"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string"""
        try:
            return json.loads(self.CORS_ORIGINS)
        except:
            return ["*"]
    
    @property
    def cors_methods_list(self) -> List[str]:
        """Parse CORS methods from JSON string"""
        try:
            return json.loads(self.CORS_ALLOW_METHODS)
        except:
            return ["*"]
    
    @property
    def cors_headers_list(self) -> List[str]:
        """Parse CORS headers from JSON string"""
        try:
            return json.loads(self.CORS_ALLOW_HEADERS)
        except:
            return ["*"]
    
    # ===== SECURITY =====
    JWT_SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production",
        description="Secret key para JWT"
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="Algoritmo de JWT"
    )
    JWT_EXPIRATION_HOURS: int = Field(
        default=24,
        description="Expiración del JWT en horas"
    )
    ADMIN_API_KEY: Optional[str] = Field(
        default=None,
        description="API Key para endpoints admin"
    )
    
    # ===== RATE LIMITING =====
    RATE_LIMIT_ENABLED: bool = Field(
        default=True,
        description="Habilitar rate limiting"
    )
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(
        default=60,
        description="Requests permitidos por minuto"
    )
    RATE_LIMIT_REQUESTS_PER_HOUR: int = Field(
        default=1000,
        description="Requests permitidos por hora"
    )
    
    # ===== MONITORING =====
    ENABLE_METRICS: bool = Field(
        default=True,
        description="Habilitar métricas de Prometheus"
    )
    METRICS_PORT: int = Field(
        default=9090,
        description="Puerto para métricas"
    )
    
    # Configuración de Pydantic Settings v2
    model_config = SettingsConfigDict(
        env_file=".env",                    # ← Lee el archivo .env
        env_file_encoding="utf-8",          # ← Encoding del archivo
        case_sensitive=True,                # ← Variables case-sensitive
        extra="ignore",                     # ← Ignora variables extra
        validate_default=True               # ← Valida valores por defecto
    )
    
    @field_validator("TOXICITY_THRESHOLD_LOW", "TOXICITY_THRESHOLD_MEDIUM", "TOXICITY_THRESHOLD_HIGH")
    @classmethod
    def validate_threshold(cls, v: float) -> float:
        """Valida que los umbrales estén entre 0 y 1"""
        if not 0 <= v <= 1:
            raise ValueError("Threshold must be between 0 and 1")
        return v
    
    @property
    def is_production(self) -> bool:
        """Retorna True si estamos en producción"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Retorna True si estamos en desarrollo"""
        return self.ENVIRONMENT.lower() == "development"


# Singleton instance
# Al instanciar Settings, Pydantic automáticamente:
# 1. Lee las variables del sistema operativo
# 2. Lee el archivo .env
# 3. Usa los valores por defecto si no encuentra la variable
settings = Settings()

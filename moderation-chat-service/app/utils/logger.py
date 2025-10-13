"""
Configuración centralizada de logging usando Loguru
"""

import sys
from loguru import logger
from app.config.settings import settings


def setup_logger():
    """
    Configura el logger de la aplicación
    """
    # Remover logger por defecto
    logger.remove()
    
    # Format personalizado
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    
    # Console output
    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
    )
    
    # File output
    logger.add(
        "/app/logs/moderation_{time:YYYY-MM-DD}.log",
        format=log_format,
        level=settings.LOG_LEVEL,
        rotation="00:00",  # Rotar a medianoche
        retention="30 days",  # Mantener logs por 30 días
        compression="zip",  # Comprimir logs antiguos
    )
    
    # Error file
    logger.add(
        "/app/logs/errors_{time:YYYY-MM-DD}.log",
        format=log_format,
        level="ERROR",
        rotation="00:00",
        retention="90 days",
        compression="zip",
    )
    
    return logger


# Initialize logger
log = setup_logger()

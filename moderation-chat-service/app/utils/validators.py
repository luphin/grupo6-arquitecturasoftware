"""
Validadores personalizados
"""

import re
from typing import Optional
from app.utils.exceptions import ValidationException


def validate_user_id(user_id: str) -> str:
    """Valida formato de user_id"""
    if not user_id or len(user_id) < 3 or len(user_id) > 100:
        raise ValidationException("Invalid user_id format")
    return user_id


def validate_channel_id(channel_id: str) -> str:
    """Valida formato de channel_id"""
    if not channel_id or len(channel_id) < 3 or len(channel_id) > 100:
        raise ValidationException("Invalid channel_id format")
    return channel_id


def validate_message_id(message_id: str) -> str:
    """Valida formato de message_id"""
    if not message_id or len(message_id) < 3 or len(message_id) > 100:
        raise ValidationException("Invalid message_id format")
    return message_id


def validate_language_code(language: str) -> str:
    """Valida código ISO de idioma"""
    if not re.match(r'^[a-z]{2}$', language):
        raise ValidationException("Invalid language code (must be 2 lowercase letters)")
    return language


def validate_message_content(content: str, max_length: int = 5000) -> str:
    """Valida contenido de mensaje"""
    if not content or not content.strip():
        raise ValidationException("Message content cannot be empty")
    
    if len(content) > max_length:
        raise ValidationException(f"Message content exceeds maximum length of {max_length}")
    
    return content.strip()

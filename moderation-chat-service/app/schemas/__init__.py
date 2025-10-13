"""
Schemas Pydantic para validación de requests y responses
"""

from app.schemas.moderation import (
    ModerateMessageRequest,
    ModerateMessageResponse,
    ModerationStatusResponse,
)
from app.schemas.blacklist import (
    AddWordRequest,
    WordResponse,
    BlacklistStatsResponse,
)
from app.schemas.admin import (
    BannedUsersResponse,
    UserViolationsResponse,
    UnbanUserRequest,
    UserStatusResponse,
)
from app.schemas.common import (
    ErrorResponse,
    SuccessResponse,
    PaginationParams,
)

__all__ = [
    # Moderation
    "ModerateMessageRequest",
    "ModerateMessageResponse",
    "ModerationStatusResponse",
    # Blacklist
    "AddWordRequest",
    "WordResponse",
    "BlacklistStatsResponse",
    # Admin
    "BannedUsersResponse",
    "UserViolationsResponse",
    "UnbanUserRequest",
    "UserStatusResponse",
    # Common
    "ErrorResponse",
    "SuccessResponse",
    "PaginationParams",
]

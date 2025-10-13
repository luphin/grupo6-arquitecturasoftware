"""
Endpoints administrativos para gestión de usuarios baneados y violaciones
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.schemas.admin import (
    BannedUsersResponse,
    BannedUserInfo,
    UserViolationsResponse,
    UnbanUserRequest,
    UserStatusResponse,
    ChannelStatsResponse,
)
from app.schemas.common import SuccessResponse, ErrorResponse
from app.services.moderation_service import ModerationService
from app.api.deps import get_moderation_service, verify_api_key
from app.utils.logger import log
from app.utils.exceptions import ModerationServiceException

router = APIRouter()


@router.get(
    "/banned-users",
    response_model=BannedUsersResponse,
    status_code=status.HTTP_200_OK,
    summary="Usuarios Baneados",
    description="Obtiene lista de usuarios baneados",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        401: {"description": "No autorizado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_banned_users(
    channel_id: Optional[str] = Query(None, description="Filtrar por canal"),
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene lista de usuarios baneados
    
    Opcionalmente filtra por canal específico.
    Requiere autenticación con API Key.
    """
    try:
        banned_users = await service.get_banned_users(channel_id)
        
        users_data = [
            BannedUserInfo(**user)
            for user in banned_users
        ]
        
        return BannedUsersResponse(
            total=len(users_data),
            banned_users=users_data
        )
        
    except Exception as e:
        log.error(f"Error getting banned users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/users/{user_id}/violations",
    response_model=UserViolationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Historial de Violaciones",
    description="Obtiene el historial de violaciones de un usuario",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Historial obtenido exitosamente"},
        401: {"description": "No autorizado"},
        404: {"description": "Usuario no encontrado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_user_violations(
    user_id: str,
    channel_id: str = Query(..., description="ID del canal"),
    limit: int = Query(50, ge=1, le=100, description="Límite de resultados"),
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene el historial completo de violaciones de un usuario
    
    Incluye:
    - Total de violaciones
    - Strikes actuales
    - Estado de ban
    - Lista detallada de violaciones
    
    Requiere autenticación con API Key.
    """
    try:
        violations = await service.get_user_violations(
            user_id=user_id,
            channel_id=channel_id,
            limit=limit
        )
        
        return UserViolationsResponse(**violations)
        
    except ModerationServiceException as e:
        log.error(f"Error getting violations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in get_user_violations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put(
    "/users/{user_id}/unban",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Desbanear Usuario",
    description="Desbanea a un usuario de un canal",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Usuario desbaneado exitosamente"},
        401: {"description": "No autorizado"},
        404: {"description": "Usuario o ban no encontrado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def unban_user(
    user_id: str,
    request: UnbanUserRequest,
    service: ModerationService = Depends(get_moderation_service),
    api_key: str = Depends(verify_api_key)
):
    """
    Desbanea a un usuario de un canal
    
    Opcionalmente puede resetear los strikes del usuario.
    Requiere autenticación con API Key.
    """
    try:
        success = await service.unban_user(
            user_id=user_id,
            channel_id=request.channel_id,
            unbanned_by=api_key,
            reason=request.reason,
            reset_strikes=request.reset_strikes
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not banned or not found"
            )
        
        message = "User unbanned successfully"
        if request.reset_strikes:
            message += " and strikes reset"
        
        return SuccessResponse(message=message)
        
    except HTTPException:
        raise
    except ModerationServiceException as e:
        log.error(f"Error unbanning user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in unban_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/users/{user_id}/status",
    response_model=UserStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Estado Completo de Usuario",
    description="Obtiene el estado completo de moderación de un usuario",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Estado obtenido exitosamente"},
        401: {"description": "No autorizado"},
        404: {"description": "Usuario no encontrado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_user_full_status(
    user_id: str,
    channel_id: str = Query(..., description="ID del canal"),
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene el estado completo de un usuario incluyendo:
    - Strikes actuales
    - Estado de ban
    - Resumen de violaciones
    
    Requiere autenticación con API Key.
    """
    try:
        # Obtener estado básico
        status = await service.get_user_status(user_id, channel_id)
        
        # Obtener resumen de violaciones
        violations = await service.get_user_violations(
            user_id=user_id,
            channel_id=channel_id,
            limit=10
        )
        
        # Obtener info de ban si existe
        ban_info = None
        if status['is_banned']:
            is_banned, ban_data = await service.strike_manager.is_user_banned(
                user_id, channel_id
            )
            if ban_data:
                ban_info = {
                    'type': ban_data.ban_type,
                    'banned_at': ban_data.banned_at.isoformat(),
                    'banned_until': ban_data.banned_until.isoformat() if ban_data.banned_until else None,
                    'reason': ban_data.reason
                }
        
        violation_summary = {
            'total': violations['total_violations'],
            'last_violation': violations['violations'][0]['timestamp'] if violations['violations'] else None,
            'by_severity': {}
        }
        
        # Contar por severidad
        for v in violations['violations']:
            sev = v['severity']
            violation_summary['by_severity'][sev] = violation_summary['by_severity'].get(sev, 0) + 1
        
        return UserStatusResponse(
            user_id=user_id,
            channel_id=channel_id,
            strike_count=status['strike_count'],
            is_banned=status['is_banned'],
            ban_info=ban_info,
            violation_summary=violation_summary
        )
        
    except ModerationServiceException as e:
        log.error(f"Error getting user full status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in get_user_full_status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/users/{user_id}/reset-strikes",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Resetear Strikes",
    description="Resetea los strikes de un usuario",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Strikes reseteados exitosamente"},
        401: {"description": "No autorizado"},
        404: {"description": "Usuario no encontrado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def reset_user_strikes(
    user_id: str,
    channel_id: str = Query(..., description="ID del canal"),
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Resetea los strikes de un usuario
    
    Útil para dar una segunda oportunidad o corregir errores.
    Requiere autenticación con API Key.
    """
    try:
        success = await service.strike_manager.reset_strikes(user_id, channel_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return SuccessResponse(message="User strikes reset successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error resetting strikes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/channels/{channel_id}/stats",
    response_model=ChannelStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Estadísticas de Canal",
    description="Obtiene estadísticas de moderación de un canal",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Estadísticas obtenidas exitosamente"},
        401: {"description": "No autorizado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_channel_stats(
    channel_id: str,
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene estadísticas de moderación de un canal
    
    Incluye:
    - Total de violaciones
    - Usuarios con strikes
    - Usuarios baneados (temporales y permanentes)
    - Promedio de strikes
    
    Requiere autenticación con API Key.
    """
    try:
        strike_stats = await service.strike_repo.get_stats_by_channel(channel_id)
        
        return ChannelStatsResponse(
            channel_id=channel_id,
            total_violations=0,  # TODO: implementar conteo de violaciones
            total_users_with_strikes=strike_stats.get('total_users', 0),
            banned_users=strike_stats.get('banned_users', 0),
            temp_banned=strike_stats.get('temp_banned', 0),
            perm_banned=strike_stats.get('perm_banned', 0),
            avg_strikes=strike_stats.get('avg_strikes', 0.0)
        )
        
    except Exception as e:
        log.error(f"Error getting channel stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/maintenance/expire-bans",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Expirar Bans",
    description="Verifica y expira bans temporales vencidos (tarea de mantenimiento)",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Tarea ejecutada exitosamente"},
        401: {"description": "No autorizado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def expire_bans(
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Verifica y expira bans temporales vencidos
    
    Esta es una tarea de mantenimiento que debería ejecutarse periódicamente.
    Requiere autenticación con API Key.
    """
    try:
        expired_count = await service.check_expired_bans()
        
        return SuccessResponse(
            message=f"Expired bans updated: {expired_count}",
            data={"expired_count": expired_count}
        )
        
    except Exception as e:
        log.error(f"Error expiring bans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

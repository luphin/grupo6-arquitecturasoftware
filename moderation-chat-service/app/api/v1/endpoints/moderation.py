"""
Endpoints de moderación de mensajes
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.moderation import (
    ModerateMessageRequest,
    ModerateMessageResponse,
    ModerationStatusResponse,
    AnalyzeTextRequest,
    AnalyzeTextResponse,
)
from app.schemas.common import ErrorResponse
from app.services.moderation_service import ModerationService
from app.api.deps import get_moderation_service, check_rate_limit
from app.utils.logger import log
from app.utils.exceptions import ModerationServiceException

router = APIRouter()


@router.post(
    "/check",
    response_model=ModerateMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Moderar Mensaje",
    description="Modera un mensaje y aplica strikes si es necesario",
    responses={
        200: {"description": "Mensaje moderado exitosamente"},
        400: {"model": ErrorResponse, "description": "Request inválido"},
        429: {"description": "Rate limit excedido"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def moderate_message(
    request: ModerateMessageRequest,
    service: ModerationService = Depends(get_moderation_service),
    _: None = Depends(check_rate_limit)
):
    """
    Modera un mensaje completo
    
    Este endpoint:
    1. Verifica si el usuario está baneado
    2. Analiza el contenido con Detoxify y lista negra
    3. Aplica strikes si el contenido es inapropiado
    4. Publica eventos para otros microservicios
    5. Retorna la decisión de moderación
    
    **Acciones posibles:**
    - `approved`: Mensaje aprobado
    - `warning`: Advertencia (strike aplicado)
    - `temp_ban`: Ban temporal (usuario excedió strikes)
    - `perm_ban`: Ban permanente (usuario excedió máximo de strikes)
    - `user_banned`: Usuario ya estaba baneado
    """
    try:
        result = await service.moderate_message(
            message_id=request.message_id,
            user_id=request.user_id,
            channel_id=request.channel_id,
            content=request.content,
            metadata=request.metadata
        )
        
        return ModerateMessageResponse(**result)
        
    except ModerationServiceException as e:
        log.error(f"Moderation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in moderate_message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/analyze",
    response_model=AnalyzeTextResponse,
    status_code=status.HTTP_200_OK,
    summary="Analizar Texto",
    description="Analiza un texto sin aplicar strikes (solo análisis)",
    responses={
        200: {"description": "Texto analizado exitosamente"},
        400: {"model": ErrorResponse, "description": "Request inválido"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def analyze_text(
    request: AnalyzeTextRequest,
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Analiza un texto sin aplicar consecuencias
    
    Útil para:
    - Preview de moderación antes de enviar
    - Análisis exploratorio
    - Testing de contenido
    
    **No aplica strikes ni registra violaciones**
    """
    try:
        result = await service.analyze_text_only(
            text=request.text,
            language=request.language
        )
        
        # Pasar el dict directamente, NO crear objeto DetoxifyScores
        return AnalyzeTextResponse(
            is_toxic=result['is_toxic'],
            toxicity_score=result['toxicity_score'],
            severity=result['severity'],
            language=result['language'],
            detected_words=result['detected_words'],
            categories=result.get('detoxify_categories', []),
            detoxify_scores=result['detoxify_scores']  # ← Pasar el dict directamente
        )
        
    except ModerationServiceException as e:
        log.error(f"Analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in analyze_text: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/status/{user_id}/{channel_id}",
    response_model=ModerationStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Estado de Usuario",
    description="Obtiene el estado de moderación de un usuario en un canal",
    responses={
        200: {"description": "Estado obtenido exitosamente"},
        404: {"description": "Usuario no encontrado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_user_moderation_status(
    user_id: str,
    channel_id: str,
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene el estado de moderación de un usuario
    
    Retorna:
    - Número de strikes actuales
    - Si está baneado y tipo de ban
    - Fecha de expiración del ban (si aplica)
    - Fecha de reset de strikes
    - Última violación
    """
    try:
        result = await service.get_user_status(user_id, channel_id)
        return ModerationStatusResponse(**result)
        
    except ModerationServiceException as e:
        log.error(f"Error getting user status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in get_user_status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

"""
Endpoints de gestión de lista negra
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.schemas.blacklist import (
    AddWordRequest,
    WordResponse,
    BlacklistWordsResponse,
    BlacklistStatsResponse,
    UpdateWordRequest,
)
from app.schemas.common import SuccessResponse, ErrorResponse
from app.services.moderation_service import ModerationService
from app.api.deps import get_moderation_service, verify_api_key
from app.utils.logger import log
from app.utils.exceptions import BlacklistException

router = APIRouter()


@router.post(
    "/words",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar Palabra",
    description="Agrega una palabra a la lista negra",
    dependencies=[Depends(verify_api_key)],
    responses={
        201: {"description": "Palabra agregada exitosamente"},
        400: {"model": ErrorResponse, "description": "Request inválido"},
        401: {"description": "No autorizado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def add_word(
    request: AddWordRequest,
    service: ModerationService = Depends(get_moderation_service),
    api_key: str = Depends(verify_api_key)
):
    """
    Agrega una palabra a la lista negra
    
    Requiere autenticación con API Key.
    """
    try:
        word = await service.blacklist_manager.add_word(
            word=request.word,
            language=request.language,
            category=request.category,
            severity=request.severity,
            is_regex=request.is_regex,
            added_by=api_key,
            notes=request.notes
        )
        
        return SuccessResponse(
            message="Word added successfully",
            data={"id": str(word.id), "word": word.word}
        )
        
    except BlacklistException as e:
        log.error(f"Error adding word: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Unexpected error in add_word: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/words",
    response_model=BlacklistWordsResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar Palabras",
    description="Obtiene palabras de la lista negra",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_words(
    language: Optional[str] = Query(None, description="Filtrar por idioma"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    severity: Optional[str] = Query(None, description="Filtrar por severidad"),
    limit: int = Query(50, ge=1, le=100, description="Límite de resultados"),
    skip: int = Query(0, ge=0, description="Documentos a saltar"),
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene palabras de la lista negra con filtros opcionales
    """
    try:
        repo = service.blacklist_repo
        
        # Obtener palabras según filtros
        if language:
            words = await repo.get_by_language(language)
        elif category:
            words = await repo.get_by_category(category, language)
        elif severity:
            words = await repo.get_by_severity(severity, language)
        else:
            words = await repo.get_all(limit=limit, skip=skip)
        
        # Formatear respuesta
        words_data = [
            WordResponse(
                id=str(w.id),
                word=w.word,
                language=w.language,
                category=w.category,
                severity=w.severity,
                is_active=w.is_active,
                is_regex=w.is_regex,
                added_by=w.added_by,
                added_at=w.added_at.isoformat(),
                updated_at=w.updated_at.isoformat(),
                notes=w.notes
            )
            for w in words
        ]
        
        return BlacklistWordsResponse(
            total=len(words_data),
            words=words_data
        )
        
    except Exception as e:
        log.error(f"Error getting words: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete(
    "/words/{word_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Eliminar Palabra",
    description="Elimina (desactiva) una palabra de la lista negra",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Palabra eliminada exitosamente"},
        401: {"description": "No autorizado"},
        404: {"description": "Palabra no encontrada"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def delete_word(
    word_id: str,
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Elimina (desactiva) una palabra de la lista negra
    
    Requiere autenticación con API Key.
    """
    try:
        success = await service.blacklist_manager.remove_word(word_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Word not found"
            )
        
        return SuccessResponse(message="Word deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error deleting word: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/stats",
    response_model=BlacklistStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Estadísticas",
    description="Obtiene estadísticas de la lista negra",
    responses={
        200: {"description": "Estadísticas obtenidas exitosamente"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def get_blacklist_stats(
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Obtiene estadísticas de la lista negra
    
    Retorna:
    - Total de palabras
    - Palabras activas/inactivas
    - Distribución por idioma
    - Distribución por categoría
    - Distribución por severidad
    """
    try:
        stats = await service.blacklist_manager.get_stats()
        return BlacklistStatsResponse(**stats)
        
    except Exception as e:
        log.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/refresh-cache",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Refrescar Cache",
    description="Fuerza la actualización del cache de lista negra",
    dependencies=[Depends(verify_api_key)],
    responses={
        200: {"description": "Cache refrescado exitosamente"},
        401: {"description": "No autorizado"},
        500: {"model": ErrorResponse, "description": "Error del servidor"}
    }
)
async def refresh_cache(
    service: ModerationService = Depends(get_moderation_service)
):
    """
    Fuerza la actualización del cache de Redis
    
    Útil después de agregar/eliminar muchas palabras.
    Requiere autenticación con API Key.
    """
    try:
        await service.blacklist_manager.force_refresh()
        return SuccessResponse(message="Cache refreshed successfully")
        
    except Exception as e:
        log.error(f"Error refreshing cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

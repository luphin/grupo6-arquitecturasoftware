"""
FastAPI Application - Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
import time

from app.config.settings import settings
from app.config.database import mongodb
from app.config.cache import redis_cache
from app.config.events import rabbitmq
from app.api.v1.router import api_router
from app.utils.logger import log, setup_logger
from app.utils.exceptions import ModerationServiceException

# Setup logger
setup_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events - Startup and Shutdown
    """
    # ===== STARTUP =====
    log.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    log.info(f"Environment: {settings.ENVIRONMENT}")
    
    try:
        # Connect to MongoDB
        await mongodb.connect()
        await mongodb.create_indexes()
        
        # Connect to Redis
        await redis_cache.connect()
        
        # Connect to RabbitMQ
        if settings.RABBITMQ_ENABLED:
            await rabbitmq.connect()
        
        log.info("✅ All services connected successfully")
        
    except Exception as e:
        log.error(f"❌ Failed to start services: {e}")
        raise
    
    yield
    
    # ===== SHUTDOWN =====
    log.info("Shutting down services...")
    
    try:
        await mongodb.disconnect()
        await redis_cache.disconnect()
        if settings.RABBITMQ_ENABLED:
            await rabbitmq.disconnect()
        
        log.info("✅ All services disconnected successfully")
        
    except Exception as e:
        log.error(f"Error during shutdown: {e}")


# ===== CREATE APP =====

app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)


# ===== MIDDLEWARE =====

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.cors_methods_list,
    allow_headers=settings.cors_headers_list,
)


# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()
    
    # Log request
    log.info(f"→ {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log response
    log.info(
        f"← {request.method} {request.url.path} "
        f"[{response.status_code}] {duration:.3f}s"
    )
    
    # Add custom headers
    response.headers["X-Process-Time"] = str(duration)
    
    return response


# ===== EXCEPTION HANDLERS =====

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    log.warning(f"Validation error: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": exc.errors()
        }
    )


@app.exception_handler(ModerationServiceException)
async def moderation_exception_handler(request: Request, exc: ModerationServiceException):
    """Handle custom moderation exceptions"""
    log.error(f"Moderation error: {exc.message}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": exc.code,
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    log.error(f"Unexpected error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred"
        }
    )


# ===== ROUTES =====

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }


# ===== STARTUP MESSAGE =====

if __name__ == "__main__":
    import uvicorn
    
    log.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

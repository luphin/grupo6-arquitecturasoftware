"""
Configuración y gestión de conexión a MongoDB
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.config.settings import settings
from app.utils.logger import log


class MongoDB:
    """
    Gestor de conexión a MongoDB usando Motor (async)
    """
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self):
        """Establece conexión con MongoDB"""
        try:
            log.info(f"Connecting to MongoDB: {settings.MONGODB_URL}")
            
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                serverSelectionTimeoutMS=5000,  # 5 segundos timeout
            )
            
            self.db = self.client[settings.MONGODB_DB]
            
            # Verificar conexión
            await self.client.admin.command('ping')
            
            log.info(f"✅ Connected to MongoDB: {settings.MONGODB_DB}")
            
        except Exception as e:
            log.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Cierra la conexión con MongoDB"""
        if self.client:
            self.client.close()
            log.info("MongoDB connection closed")
    
    async def create_indexes(self):
        """Crea los índices necesarios en las colecciones"""
        try:
            log.info("Creating MongoDB indexes...")
            
            # Índices para blacklist_words
            await self.db.blacklist_words.create_index(
                [("word", 1), ("language", 1)],
                unique=True,
                name="word_language_unique"
            )
            await self.db.blacklist_words.create_index(
                [("language", 1), ("is_active", 1)],
                name="language_active"
            )
            await self.db.blacklist_words.create_index(
                [("word", "text")],
                name="word_text_search"
            )
            
            # Índices para violations
            await self.db.violations.create_index(
                [("user_id", 1), ("channel_id", 1), ("timestamp", -1)],
                name="user_channel_timestamp"
            )
            await self.db.violations.create_index(
                [("message_id", 1)],
                unique=True,
                name="message_id_unique"
            )
            await self.db.violations.create_index(
                [("timestamp", -1)],
                name="timestamp_desc"
            )
            
            # Índices para user_strikes
            await self.db.user_strikes.create_index(
                [("user_id", 1), ("channel_id", 1)],
                unique=True,
                name="user_channel_unique"
            )
            await self.db.user_strikes.create_index(
                [("is_banned", 1), ("channel_id", 1)],
                name="banned_channel"
            )
            await self.db.user_strikes.create_index(
                [("strikes_reset_at", 1)],
                name="strikes_reset"
            )
            
            # Índices para bans
            await self.db.bans.create_index(
                [("user_id", 1), ("channel_id", 1), ("is_active", 1)],
                name="user_channel_active"
            )
            await self.db.bans.create_index(
                [("is_active", 1), ("banned_until", 1)],
                name="active_expiration"
            )
            
            log.info("✅ MongoDB indexes created successfully")
            
        except Exception as e:
            log.error(f"❌ Error creating indexes: {e}")
            # No lanzamos excepción para que no falle el startup si los índices ya existen


# Singleton instance
mongodb = MongoDB()


async def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency para obtener la instancia de la base de datos
    
    Usage:
        @router.get("/")
        async def endpoint(db: AsyncIOMotorDatabase = Depends(get_database)):
            await db.collection.find_one({})
    """
    if mongodb.db is None:
        await mongodb.connect()
    return mongodb.db

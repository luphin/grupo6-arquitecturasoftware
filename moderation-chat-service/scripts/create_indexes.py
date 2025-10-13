"""
Script para crear índices de MongoDB
Uso: python scripts/create_indexes.py
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(file).parent.parent))
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def create_indexes():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]

    print("Creating MongoDB indexes...")

    await db.blacklist_words.create_index([("word", 1), ("language", 1)], unique=True)
    await db.blacklist_words.create_index([("language", 1), ("is_active", 1)])

    await db.violations.create_index([("user_id", 1), ("channel_id", 1), ("timestamp", -1)])
    await db.violations.create_index([("message_id", 1)], unique=True)

    await db.user_strikes.create_index([("user_id", 1), ("channel_id", 1)], unique=True)

    await db.bans.create_index([("user_id", 1), ("channel_id", 1), ("is_active", 1)])

    print("Indexes created!")
    client.close()

if name == "main":
    asyncio.run(create_indexes())

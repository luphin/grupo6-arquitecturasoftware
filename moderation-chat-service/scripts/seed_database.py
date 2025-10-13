"""
Script para poblar la base de datos con datos iniciales
Uso: python scripts/seed_database.py
"""

import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.blacklist_word import BlacklistWord

SEED_DATA = {
        "es": [
            {"word": "idiota", "category": "insult", "severity": "medium"},
            {"word": "estúpido", "category": "insult", "severity": "medium"},
            {"word": "mierda", "category": "profanity", "severity": "medium"},
            {"word": "puta", "category": "profanity", "severity": "high"},
            ],
        "en": [
            {"word": "idiot", "category": "insult", "severity": "medium"},
            {"word": "stupid", "category": "insult", "severity": "medium"},
            {"word": "fuck", "category": "profanity", "severity": "high"},
            {"word": "shit", "category": "profanity", "severity": "medium"},
            ]
        }

async def seed_blacklist():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    collection = db.blacklist_words

    print("Starting database seed...")
    confirm = input("Delete existing words? (y/N): ")
    if confirm.lower() == 'y':
        result = await collection.delete_many({})
        print(f"Deleted {result.deleted_count} words")

    words = []
    for language, word_list in SEED_DATA.items():
        for word_data in word_list:
            word = BlacklistWord(
                    word=word_data["word"],
                    language=language,
                    category=word_data["category"],
                    severity=word_data["severity"],
                    is_active=True,
                    added_by="system_seed"
                    )
            words.append(word.model_dump(by_alias=True, exclude={"id"}))

    if words:
        result = await collection.insert_many(words)
        print(f"Inserted {len(result.inserted_ids)} words")

    await collection.create_index([("word", 1), ("language", 1)], unique=True)
    print("Seed completed!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_blacklist())

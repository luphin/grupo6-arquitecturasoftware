"""
Script para limpiar datos antiguos
Uso: python scripts/cleanup_old_data.py --days 90
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import argparse
sys.path.insert(0, str(Path(file).parent.parent))
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def cleanup_old_violations(days):
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    result = await db.violations.delete_many({"timestamp": {"$lt": cutoff_date}})
    print(f"Deleted {result.deleted_count} old violations")
    client.close()

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=90)
    args = parser.parse_args()

    await cleanup_old_violations(args.days)

    print("Cleanup completed!")

if name == "main":
    asyncio.run(main())

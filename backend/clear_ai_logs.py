"""
clear_ai_logs.py — Delete all AILog documents from WorkPigeon's MongoDB
Run: python clear_ai_logs.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.ai_log import AILog


async def clear():
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(database=client[settings.db_name], document_models=[AILog])

    result = await AILog.delete_all()
    print(f"✅ Deleted all AI log documents from '{settings.db_name}' database.")
    client.close()


if __name__ == "__main__":
    asyncio.run(clear())

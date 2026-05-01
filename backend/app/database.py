from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User
from app.models.task import Task
from app.models.ai_log import AILog


async def init_db() -> None:
    """Initialise Beanie ODM with all document models."""
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(
        database=client[settings.db_name],
        document_models=[User, Task, AILog],
    )


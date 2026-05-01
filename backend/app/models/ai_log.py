from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from beanie import Document
from pydantic import Field


class AILog(Document):
    """Records a single AI prompt/response interaction during development."""

    user_id: str  # User document ID string
    task_id: Optional[str] = None  # Task document ID string (nullable)
    phase: Literal["planning", "coding", "review", "debug"]
    prompt: str
    response: str
    model: str = "gpt-4o"
    prompt_tokens: int = Field(ge=0)
    response_tokens: int = Field(ge=0)
    latency_ms: int = Field(ge=0)
    user_rating: Optional[int] = Field(default=None, ge=1, le=5)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_logs"

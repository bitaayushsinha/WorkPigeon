from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class AILogCreate(BaseModel):
    user_id: str
    task_id: Optional[str] = None
    phase: Literal["planning", "coding", "review", "debug"]
    prompt: str
    response: str
    model: str = "gpt-4o"
    prompt_tokens: int = Field(ge=0)
    response_tokens: int = Field(ge=0)
    latency_ms: int = Field(ge=0)
    user_rating: Optional[int] = Field(default=None, ge=1, le=5)


class AILogOut(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str]
    phase: str
    prompt: str
    response: str
    model: str
    prompt_tokens: int
    response_tokens: int
    latency_ms: int
    user_rating: Optional[int]
    timestamp: datetime


class AILogAnalytics(BaseModel):
    total_logs: int
    total_prompt_tokens: int
    total_response_tokens: int
    avg_latency_ms: float
    avg_user_rating: Optional[float]
    logs_by_phase: dict

from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from beanie import Document
from pydantic import BaseModel, EmailStr, Field


class Skill(BaseModel):
    """A skill with a self-reported proficiency level (0–100)."""

    name: str
    proficiency: int = Field(ge=0, le=100)


class PerformanceRecord(BaseModel):
    """One completed-task performance entry."""

    task_id: str
    completion_time_hrs: float
    quality_score: float = Field(ge=0.0, le=100.0)
    on_time: bool
    completed_at: datetime = Field(default_factory=datetime.utcnow)


class ActiveSession(BaseModel):
    """Tracks an ongoing development session."""

    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_ping: datetime = Field(default_factory=datetime.utcnow)


class User(Document):
    """Developer profile — the core entity for the allocation engine."""

    name: str
    email: str
    password_hash: str = ""           # bcrypt hash — empty until set
    role: Literal["admin", "developer"] = "developer"
    skills: List[Skill] = []
    current_workload: float = Field(default=0.0, ge=0.0, le=100.0)
    performance_history: List[PerformanceRecord] = []
    ai_efficiency_score: float = Field(default=50.0, ge=0.0, le=100.0)
    active_session: Optional[ActiveSession] = None
    commits_today: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["email"]

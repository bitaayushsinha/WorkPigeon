from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from beanie import Document
from pydantic import BaseModel, Field


class RequiredSkill(BaseModel):
    """A skill requirement for a task."""

    name: str
    min_proficiency: int = Field(ge=0, le=100)


class Task(Document):
    """An engineering task to be allocated to a developer."""

    title: str
    description: str
    required_skills: List[RequiredSkill] = []
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    estimated_hours: float = Field(gt=0)
    status: Literal["unassigned", "in_progress", "review", "done"] = "unassigned"
    assigned_to: Optional[str] = None  # User document ID string
    allocation_score: Optional[float] = None
    score_breakdown: Optional[dict] = None  # stored scoring details
    deadline: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tasks"

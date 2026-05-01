from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class RequiredSkillIn(BaseModel):
    name: str
    min_proficiency: int = Field(ge=0, le=100)


class TaskCreate(BaseModel):
    title: str
    description: str
    required_skills: List[RequiredSkillIn] = []
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    estimated_hours: float = Field(gt=0)
    deadline: Optional[datetime] = None


class TaskStatusUpdate(BaseModel):
    status: Literal["unassigned", "in_progress", "review", "done"]


class TaskOut(BaseModel):
    id: str
    title: str
    description: str
    required_skills: List[RequiredSkillIn]
    priority: str
    estimated_hours: float
    status: str
    assigned_to: Optional[str]
    allocation_score: Optional[float]
    score_breakdown: Optional[Dict]
    deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime

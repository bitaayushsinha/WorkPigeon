from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class SkillIn(BaseModel):
    name: str
    proficiency: int = Field(ge=0, le=100)


class UserCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = None          # defaults to "workpigeon123" if omitted
    role: Literal["admin", "developer"] = "developer"
    skills: List[SkillIn] = []
    ai_efficiency_score: float = Field(default=50.0, ge=0.0, le=100.0)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[SkillIn]] = None
    current_workload: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    ai_efficiency_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)


class PerformanceRecordOut(BaseModel):
    task_id: str
    completion_time_hrs: float
    quality_score: float
    on_time: bool
    completed_at: datetime


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str = "developer"
    skills: List[SkillIn]
    current_workload: float
    ai_efficiency_score: float
    commits_today: int
    performance_history: List[PerformanceRecordOut]
    created_at: datetime

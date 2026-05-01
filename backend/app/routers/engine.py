"""
routers/engine.py — Allocation Engine Endpoints
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.task import Task
from app.models.user import User
from app.services.scoring import (
    rank_developers_for_task,
    rebalance_workload,
    score_developer_for_task,
)

router = APIRouter(prefix="/engine", tags=["Allocation Engine"])


# ---------------------------------------------------------------------------
# Request / Response schemas (engine-specific)
# ---------------------------------------------------------------------------


class ScoreRequest(BaseModel):
    user_id: str
    task_id: str


class ScoreBreakdown(BaseModel):
    user_id: str
    user_name: str
    email: str
    workload_score: float
    past_performance_score: float
    skill_compatibility_score: float
    ai_efficiency_score: float
    total_score: float


class RankedResponse(BaseModel):
    task_id: str
    task_title: str
    rankings: List[ScoreBreakdown]


class RebalanceResult(BaseModel):
    assignments: List[dict]
    total_tasks_processed: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/health", summary="Health check for the allocation engine")
async def health() -> dict:
    return {"status": "ok", "service": "WorkPigeon Allocation Engine"}


@router.post(
    "/score",
    response_model=ScoreBreakdown,
    summary="Score one developer against one task",
    description=(
        "Accepts a developer ID and task ID, runs the 4-metric algorithm, "
        "and returns a detailed score breakdown."
    ),
)
async def score_one(body: ScoreRequest) -> ScoreBreakdown:
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    task = await Task.get(body.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    breakdown = score_developer_for_task(user, task)
    return ScoreBreakdown(
        user_id=str(user.id),
        user_name=user.name,
        email=user.email,
        **breakdown,
    )


@router.post(
    "/best-match/{task_id}",
    response_model=RankedResponse,
    summary="Rank all developers for a task",
    description=(
        "Scores every registered developer against the given task and "
        "returns them ranked by total score descending."
    ),
)
async def best_match(task_id: str) -> RankedResponse:
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    users = await User.find_all().to_list()
    if not users:
        raise HTTPException(status_code=422, detail="No developers registered.")

    ranked = rank_developers_for_task(users, task)
    return RankedResponse(
        task_id=task_id,
        task_title=task.title,
        rankings=[ScoreBreakdown(**r) for r in ranked],
    )


@router.post(
    "/rebalance",
    response_model=RebalanceResult,
    summary="Rebalance tasks across the team and persist assignments",
    description=(
        "Greedy priority-ordered rebalance: takes all 'unassigned' and "
        "'in_progress' tasks, scores every developer, assigns to the best "
        "match, and PERSISTS the changes (task.assigned_to + workloads)."
    ),
)
async def rebalance() -> RebalanceResult:
    # Include both unassigned and in_progress tasks so imbalanced workloads
    # can be redistributed even when tasks are already assigned.
    all_tasks = await Task.find().to_list()
    tasks = [t for t in all_tasks if t.status in ("unassigned", "in_progress")]
    users = await User.find_all().to_list()

    if not users:
        raise HTTPException(status_code=422, detail="No developers registered.")
    if not tasks:
        return RebalanceResult(assignments=[], total_tasks_processed=0)

    # Do NOT reset workloads — actual workloads (Aryan=75%, Rishi=0%) are
    # what drive the greedy algorithm to spread tasks fairly.
    assignments = rebalance_workload(users, tasks)

    # ── Persist: update each task's assigned_to and user workloads ──────────
    user_map = {str(u.id): u for u in users}
    workload_delta: dict[str, float] = {str(u.id): 0.0 for u in users}

    for assignment in assignments:
        task = await Task.get(assignment["task_id"])
        if not task:
            continue
        new_owner_id = assignment["assigned_to_id"]
        task.assigned_to = new_owner_id
        task.status = "in_progress"
        task.allocation_score = assignment["score_breakdown"]["total_score"]
        task.score_breakdown = assignment["score_breakdown"]
        task.updated_at = datetime.utcnow()
        await task.save()
        workload_delta[new_owner_id] = workload_delta.get(new_owner_id, 0.0) + (
            task.estimated_hours / 8.0
        ) * 100

    for uid, delta in workload_delta.items():
        user = user_map.get(uid)
        if user:
            user.current_workload = min(delta, 100.0)
            await user.save()

    return RebalanceResult(
        assignments=assignments,
        total_tasks_processed=len(assignments),
    )

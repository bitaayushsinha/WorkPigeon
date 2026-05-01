"""
routers/tasks.py — Task Management Endpoints
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.models.task import Task, RequiredSkill
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskStatusUpdate
from app.services.scoring import rank_developers_for_task

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def _task_out(task: Task) -> TaskOut:
    return TaskOut(
        id=str(task.id),
        title=task.title,
        description=task.description,
        required_skills=[
            {"name": s.name, "min_proficiency": s.min_proficiency}
            for s in task.required_skills
        ],
        priority=task.priority,
        estimated_hours=task.estimated_hours,
        status=task.status,
        assigned_to=task.assigned_to,
        allocation_score=task.allocation_score,
        score_breakdown=task.score_breakdown,
        deadline=task.deadline,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.post(
    "/",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
async def create_task(body: TaskCreate) -> TaskOut:
    task = Task(
        title=body.title,
        description=body.description,
        required_skills=[
            RequiredSkill(name=s.name, min_proficiency=s.min_proficiency)
            for s in body.required_skills
        ],
        priority=body.priority,
        estimated_hours=body.estimated_hours,
        deadline=body.deadline,
    )
    await task.insert()
    return _task_out(task)


@router.get(
    "/",
    response_model=list[TaskOut],
    summary="List tasks (filterable by status / assignee)",
)
async def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_to: Optional[str] = None,
) -> list[TaskOut]:
    query = Task.find()
    tasks = await query.to_list()
    if status_filter:
        tasks = [t for t in tasks if t.status == status_filter]
    if assigned_to:
        tasks = [t for t in tasks if t.assigned_to == assigned_to]
    return [_task_out(t) for t in tasks]


@router.get(
    "/{task_id}",
    response_model=TaskOut,
    summary="Get task detail",
)
async def get_task(task_id: str) -> TaskOut:
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return _task_out(task)


@router.patch(
    "/{task_id}/status",
    response_model=TaskOut,
    summary="Update task status",
)
async def update_task_status(task_id: str, body: TaskStatusUpdate) -> TaskOut:
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    task.status = body.status
    task.updated_at = datetime.utcnow()
    await task.save()
    return _task_out(task)


@router.post(
    "/{task_id}/assign",
    response_model=TaskOut,
    summary="Auto-assign task to best-scoring developer",
    description=(
        "Calls the scoring engine across all active developers and assigns "
        "the task to the highest scorer. Updates the task in the database."
    ),
)
async def assign_task(task_id: str) -> TaskOut:
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    users = await User.find_all().to_list()
    if not users:
        raise HTTPException(status_code=422, detail="No developers registered yet.")

    ranked = rank_developers_for_task(users, task)
    if not ranked:
        raise HTTPException(status_code=422, detail="Could not score any developer.")

    best = ranked[0]
    task.assigned_to = best["user_id"]
    task.allocation_score = best["total_score"]
    task.score_breakdown = {
        "workload_score": best["workload_score"],
        "past_performance_score": best["past_performance_score"],
        "skill_compatibility_score": best["skill_compatibility_score"],
        "ai_efficiency_score": best["ai_efficiency_score"],
        "total_score": best["total_score"],
        "ranked_developers": ranked,
    }
    task.status = "in_progress"
    task.updated_at = datetime.utcnow()
    await task.save()

    # Bump the assigned developer's workload
    assigned_user = await User.get(best["user_id"])
    if assigned_user:
        assigned_user.current_workload = min(
            assigned_user.current_workload + (task.estimated_hours / 8.0) * 100, 100.0
        )
        await assigned_user.save()

    return _task_out(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
)
async def delete_task(task_id: str) -> None:
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    await task.delete()

"""
routers/users.py — Developer Profile Endpoints
"""

from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.models.user import User, Skill
from app.models.task import Task
from app.routers.auth import hash_password
from app.schemas.user import UserCreate, UserOut, UserUpdate, SkillIn
from app.services.scoring import rank_developers_for_task

router = APIRouter(prefix="/api/users", tags=["Users"])


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=getattr(user, "role", "developer"),
        skills=[SkillIn(name=s.name, proficiency=s.proficiency) for s in user.skills],
        current_workload=user.current_workload,
        ai_efficiency_score=user.ai_efficiency_score,
        commits_today=user.commits_today,
        performance_history=[
            {
                "task_id": r.task_id,
                "completion_time_hrs": r.completion_time_hrs,
                "quality_score": r.quality_score,
                "on_time": r.on_time,
                "completed_at": r.completed_at,
            }
            for r in user.performance_history
        ],
        created_at=user.created_at,
    )


@router.post(
    "/",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new developer",
)
async def create_user(body: UserCreate) -> UserOut:
    """Create a developer profile. Email must be unique."""
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{body.email}' already exists.",
        )
    password = getattr(body, "password", None) or "workpigeon123"
    role = getattr(body, "role", "developer") or "developer"
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(password),
        role=role,
        skills=[Skill(name=s.name, proficiency=s.proficiency) for s in body.skills],
        ai_efficiency_score=body.ai_efficiency_score,
    )
    await user.insert()
    return _user_out(user)


@router.get(
    "/",
    response_model=list[UserOut],
    summary="List all developers",
)
async def list_users() -> list[UserOut]:
    """Return only developer profiles (role='developer'), sorted by workload."""
    users = await User.find(User.role == "developer").sort(+User.current_workload).to_list()
    return [_user_out(u) for u in users]


@router.get(
    "/{user_id}",
    response_model=UserOut,
    summary="Get a developer profile",
)
async def get_user(user_id: str) -> UserOut:
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return _user_out(user)


@router.patch(
    "/{user_id}",
    response_model=UserOut,
    summary="Update a developer profile",
)
async def update_user(user_id: str, body: UserUpdate) -> UserOut:
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.name is not None:
        user.name = body.name
    if body.skills is not None:
        user.skills = [Skill(name=s.name, proficiency=s.proficiency) for s in body.skills]
    if body.current_workload is not None:
        user.current_workload = body.current_workload
    if body.ai_efficiency_score is not None:
        user.ai_efficiency_score = body.ai_efficiency_score
    await user.save()
    return _user_out(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a developer, optionally reassigning their active tasks",
)
async def delete_user(
    user_id: str,
    reassign: bool = Query(False, description="Auto-reassign active tasks before deletion"),
) -> None:
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if reassign:
        # Find all tasks currently assigned to this developer that aren't done
        active_tasks = await Task.find(
            Task.assigned_to == user_id,
        ).to_list()
        active_tasks = [t for t in active_tasks if t.status not in ("done",)]

        # Fetch all other developers to reassign to
        other_devs = await User.find(User.role == "developer").to_list()
        other_devs = [d for d in other_devs if str(d.id) != user_id]

        for task in active_tasks:
            if not other_devs:
                # No other devs — just unassign
                task.assigned_to = None
                task.status = "unassigned"
                task.allocation_score = None
                task.score_breakdown = None
                task.updated_at = datetime.utcnow()
                await task.save()
                continue

            ranked = rank_developers_for_task(other_devs, task)
            if not ranked:
                task.assigned_to = None
                task.status = "unassigned"
                task.updated_at = datetime.utcnow()
                await task.save()
                continue

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

            # Bump the new assignee's workload
            new_dev = next((d for d in other_devs if str(d.id) == best["user_id"]), None)
            if new_dev:
                new_dev.current_workload = min(
                    new_dev.current_workload + (task.estimated_hours / 8.0) * 100, 100.0
                )
                await new_dev.save()

    await user.delete()

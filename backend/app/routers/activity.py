"""
routers/activity.py — Developer Activity Tracking Endpoints
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.user import User, ActiveSession, PerformanceRecord

router = APIRouter(prefix="/api/activity", tags=["Activity"])


class CommitPayload(BaseModel):
    user_id: str
    sha: str
    message: str
    repo: str = ""


class PerformancePayload(BaseModel):
    user_id: str
    task_id: str
    completion_time_hrs: float
    quality_score: float
    on_time: bool


class SessionPayload(BaseModel):
    user_id: str


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------


@router.post(
    "/session/start",
    summary="Begin a development session",
    status_code=status.HTTP_200_OK,
)
async def session_start(body: SessionPayload) -> dict:
    """Sets `active_session.started_at` for the developer."""
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.active_session = ActiveSession()
    await user.save()
    return {
        "message": "Session started.",
        "started_at": user.active_session.started_at.isoformat(),
    }


@router.patch(
    "/session/ping",
    summary="Heartbeat — keep session alive",
    status_code=status.HTTP_200_OK,
)
async def session_ping(body: SessionPayload) -> dict:
    """Updates `active_session.last_ping` to now."""
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.active_session:
        raise HTTPException(status_code=400, detail="No active session. Call /session/start first.")
    user.active_session.last_ping = datetime.now(timezone.utc)
    await user.save()
    return {"message": "Ping recorded.", "last_ping": user.active_session.last_ping.isoformat()}


@router.post(
    "/session/end",
    summary="End a development session",
    status_code=status.HTTP_200_OK,
)
async def session_end(body: SessionPayload) -> dict:
    """Closes the session and returns the duration in minutes."""
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.active_session:
        raise HTTPException(status_code=400, detail="No active session.")
    ended_at = datetime.now(timezone.utc)
    started = user.active_session.started_at.replace(tzinfo=timezone.utc)
    duration_mins = round((ended_at - started).total_seconds() / 60, 1)
    user.active_session = None
    await user.save()
    return {
        "message": "Session ended.",
        "duration_minutes": duration_mins,
        "ended_at": ended_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# Commit tracking
# ---------------------------------------------------------------------------


@router.post(
    "/commit",
    summary="Log a commit event",
    status_code=status.HTTP_200_OK,
)
async def log_commit(body: CommitPayload) -> dict:
    """Increments `commits_today` and records the commit metadata."""
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.commits_today += 1
    await user.save()
    return {
        "message": "Commit logged.",
        "commits_today": user.commits_today,
        "sha": body.sha,
        "repo": body.repo,
    }


# ---------------------------------------------------------------------------
# Performance logging
# ---------------------------------------------------------------------------


@router.post(
    "/performance",
    summary="Log completed-task performance",
    status_code=status.HTTP_200_OK,
)
async def log_performance(body: PerformancePayload) -> dict:
    """
    Appends a PerformanceRecord to the developer's history and
    recalculates `current_workload` based on remaining tasks.
    """
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    record = PerformanceRecord(
        task_id=body.task_id,
        completion_time_hrs=body.completion_time_hrs,
        quality_score=body.quality_score,
        on_time=body.on_time,
    )
    user.performance_history.append(record)
    # Reduce workload by the task's hours (as % of an 8-hour day)
    reduction = (body.completion_time_hrs / 8.0) * 100
    user.current_workload = max(user.current_workload - reduction, 0.0)
    await user.save()
    return {"message": "Performance logged.", "new_workload": user.current_workload}


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


@router.get(
    "/{user_id}/summary",
    summary="Get aggregated activity summary for a developer",
)
async def activity_summary(user_id: str) -> dict:
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    history = user.performance_history[-10:]
    avg_quality = (
        round(sum(r.quality_score for r in history) / len(history), 1)
        if history else None
    )
    on_time_rate = (
        round(sum(1 for r in history if r.on_time) / len(history) * 100, 1)
        if history else None
    )

    return {
        "user_id": user_id,
        "name": user.name,
        "commits_today": user.commits_today,
        "current_workload": user.current_workload,
        "ai_efficiency_score": user.ai_efficiency_score,
        "active_session": (
            {
                "started_at": user.active_session.started_at.isoformat(),
                "last_ping": user.active_session.last_ping.isoformat(),
            }
            if user.active_session
            else None
        ),
        "recent_tasks_count": len(history),
        "avg_quality_score": avg_quality,
        "on_time_rate_pct": on_time_rate,
    }

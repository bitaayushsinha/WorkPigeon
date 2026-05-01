"""
routers/ai_logs.py — AI Interaction Logging Endpoints
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.models.ai_log import AILog
from app.models.user import User
from app.schemas.ai_log import AILogCreate, AILogOut, AILogAnalytics

router = APIRouter(prefix="/api/ai-logs", tags=["AI Logs"])


def _log_out(log: AILog) -> AILogOut:
    return AILogOut(
        id=str(log.id),
        user_id=log.user_id,
        task_id=log.task_id,
        phase=log.phase,
        prompt=log.prompt,
        response=log.response,
        model=log.model,
        prompt_tokens=log.prompt_tokens,
        response_tokens=log.response_tokens,
        latency_ms=log.latency_ms,
        user_rating=log.user_rating,
        timestamp=log.timestamp,
    )


@router.post(
    "/",
    response_model=AILogOut,
    status_code=status.HTTP_201_CREATED,
    summary="Log an AI prompt/response interaction",
)
async def create_log(body: AILogCreate) -> AILogOut:
    """
    Creates an AILog entry and optionally updates the developer's
    `ai_efficiency_score` as a rolling average of:
      (1 - prompt_tokens / (prompt_tokens + response_tokens)) * user_rating * 20
    """
    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    log = AILog(**body.model_dump())
    await log.insert()

    # Update AI efficiency score if rating provided
    if body.user_rating:
        total_tokens = body.prompt_tokens + body.response_tokens
        efficiency = (
            (body.response_tokens / max(total_tokens, 1)) * (body.user_rating / 5.0) * 100
        )
        # Exponential moving average (alpha = 0.2)
        user.ai_efficiency_score = round(
            0.8 * user.ai_efficiency_score + 0.2 * efficiency, 2
        )
        await user.save()

    return _log_out(log)


@router.get(
    "/analytics/summary",
    response_model=AILogAnalytics,
    summary="Aggregate analytics across all AI logs",
)
async def analytics_summary(user_id: Optional[str] = None) -> AILogAnalytics:
    """Returns token totals, average latency, and phase distribution."""
    logs = await AILog.find_all().to_list()
    if user_id:
        logs = [l for l in logs if l.user_id == user_id]

    if not logs:
        return AILogAnalytics(
            total_logs=0,
            total_prompt_tokens=0,
            total_response_tokens=0,
            avg_latency_ms=0.0,
            avg_user_rating=None,
            logs_by_phase={},
        )

    rated = [l for l in logs if l.user_rating is not None]
    phase_counts: dict = {}
    for l in logs:
        phase_counts[l.phase] = phase_counts.get(l.phase, 0) + 1

    return AILogAnalytics(
        total_logs=len(logs),
        total_prompt_tokens=sum(l.prompt_tokens for l in logs),
        total_response_tokens=sum(l.response_tokens for l in logs),
        avg_latency_ms=round(sum(l.latency_ms for l in logs) / len(logs), 1),
        avg_user_rating=(
            round(sum(l.user_rating for l in rated) / len(rated), 2)
            if rated else None
        ),
        logs_by_phase=phase_counts,
    )


@router.get(
    "/task/{task_id}",
    response_model=list[AILogOut],
    summary="Get all AI interactions for a specific task",
)
async def logs_by_task(task_id: str) -> list[AILogOut]:
    logs = await AILog.find(AILog.task_id == task_id).to_list()
    return [_log_out(l) for l in logs]


@router.get(
    "/{user_id}",
    response_model=list[AILogOut],
    summary="Get paginated AI logs for a developer",
)
async def logs_by_user(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[AILogOut]:
    logs = (
        await AILog.find(AILog.user_id == user_id)
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return [_log_out(l) for l in logs]

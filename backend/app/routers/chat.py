"""
routers/chat.py — AI Chatbot endpoint (OpenRouter)
Proxies messages to OpenRouter, streams the response,
and automatically logs every exchange as an AILog.
"""

import time
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.config import settings
from app.models.ai_log import AILog
from app.models.user import User

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class Message(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    user_id: str
    messages: list[Message]          # Full conversation history
    model: str = "openai/gpt-4o-mini"
    task_id: Optional[str] = None
    phase: str = "coding"


class ChatResponse(BaseModel):
    reply: str
    model: str
    prompt_tokens: int
    response_tokens: int
    latency_ms: int
    log_id: str


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Send a message to the AI chatbot",
    description=(
        "Proxies the conversation to OpenRouter and automatically logs "
        "the prompt/response as an AILog tied to the developer."
    ),
)
async def chat(body: ChatRequest) -> ChatResponse:
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENROUTER_API_KEY is not configured in the backend .env file.",
        )

    user = await User.get(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Build prompt token estimate (simple char-based approximation)
    prompt_text = " ".join(m.content for m in body.messages)
    estimated_prompt_tokens = max(len(prompt_text) // 4, 1)

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.frontend_url,
        "X-Title": "WorkPigeon AI Assistant",
    }

    payload = {
        "model": body.model,
        "messages": [{"role": m.role, "content": m.content} for m in body.messages],
    }

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"OpenRouter error: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Network error reaching OpenRouter: {e}")

    latency_ms = int((time.monotonic() - start) * 1000)

    reply = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", estimated_prompt_tokens)
    response_tokens = usage.get("completion_tokens", max(len(reply) // 4, 1))

    # Auto-log this interaction
    log = AILog(
        user_id=body.user_id,
        task_id=body.task_id,
        phase=body.phase,
        prompt=body.messages[-1].content,   # Last user message
        response=reply,
        model=body.model,
        prompt_tokens=prompt_tokens,
        response_tokens=response_tokens,
        latency_ms=latency_ms,
    )
    await log.insert()

    # Update AI efficiency score (EMA)
    efficiency = (response_tokens / max(prompt_tokens + response_tokens, 1)) * 100
    user.ai_efficiency_score = round(0.85 * user.ai_efficiency_score + 0.15 * efficiency, 2)
    await user.save()

    return ChatResponse(
        reply=reply,
        model=body.model,
        prompt_tokens=prompt_tokens,
        response_tokens=response_tokens,
        latency_ms=latency_ms,
        log_id=str(log.id),
    )


@router.get(
    "/history/{user_id}",
    summary="Get chat history for a developer",
)
async def chat_history(user_id: str, limit: int = 50) -> list[dict]:
    """Returns recent AILogs for this user as a chat history."""
    logs = (
        await AILog.find(AILog.user_id == user_id)
        .sort(-AILog.timestamp)
        .limit(limit)
        .to_list()
    )
    history = []
    for log in reversed(logs):
        history.append({"role": "user",      "content": log.prompt,   "timestamp": log.timestamp.isoformat(), "tokens": log.prompt_tokens})
        history.append({"role": "assistant", "content": log.response, "timestamp": log.timestamp.isoformat(), "tokens": log.response_tokens, "latency_ms": log.latency_ms, "model": log.model})
    return history

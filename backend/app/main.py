"""
main.py — WorkPigeon FastAPI Application Entry Point
=====================================================
Start the server:
    uvicorn app.main:app --reload --port 8000

Interactive docs available at:
    http://localhost:8000/docs   (Swagger UI)
    http://localhost:8000/redoc  (ReDoc)
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import activity, ai_logs, auth, chat, engine, tasks, users


# ---------------------------------------------------------------------------
# Lifespan: DB init on startup
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    await init_db()
    yield


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


app = FastAPI(
    title="WorkPigeon — AI Workflow Backend",
    description=(
        "REST API for the AI-Powered Engineering Workflow System.\n\n"
        "**Data Capture Layer** — developer activity, commits, sessions, AI interaction logs.\n\n"
        "**Allocation Engine** — 4-metric scoring algorithm for dynamic task assignment."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow Next.js dev server
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(activity.router)
app.include_router(ai_logs.router)
app.include_router(engine.router)
app.include_router(chat.router)


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {
        "project": "WorkPigeon",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/engine/health",
    }

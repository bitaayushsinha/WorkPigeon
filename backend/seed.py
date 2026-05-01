"""
seed.py — Populate WorkPigeon with realistic demo data
Run: python seed.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User, Skill, PerformanceRecord, ActiveSession
from app.models.task import Task, RequiredSkill
from app.models.ai_log import AILog

DEVELOPERS = [
    {"name": "Aarav Shah",    "email": "aarav@workpigeon.dev",   "skills": [("Python", 90), ("FastAPI", 85), ("ML", 70)],       "workload": 45, "ai_score": 78},
    {"name": "Priya Nair",    "email": "priya@workpigeon.dev",   "skills": [("React", 92), ("TypeScript", 88), ("CSS", 80)],    "workload": 30, "ai_score": 82},
    {"name": "Rohan Mehta",   "email": "rohan@workpigeon.dev",   "skills": [("Node.js", 75), ("MongoDB", 70), ("Docker", 65)],  "workload": 70, "ai_score": 60},
    {"name": "Sneha Reddy",   "email": "sneha@workpigeon.dev",   "skills": [("Python", 80), ("Django", 78), ("PostgreSQL", 72)],"workload": 55, "ai_score": 71},
    {"name": "Karan Patel",   "email": "karan@workpigeon.dev",   "skills": [("Go", 85), ("Kubernetes", 80), ("AWS", 88)],       "workload": 20, "ai_score": 90},
]

TASKS = [
    {"title": "Build user auth microservice",    "desc": "JWT-based auth with refresh tokens",        "skills": [("Python", 70), ("FastAPI", 65)], "priority": "high",     "hours": 6},
    {"title": "Redesign onboarding flow",        "desc": "New multi-step onboarding UI with animations","skills": [("React", 80), ("TypeScript", 70)], "priority": "medium",  "hours": 4},
    {"title": "Set up CI/CD pipeline",           "desc": "GitHub Actions + Docker + K8s deployment",  "skills": [("Docker", 60), ("Kubernetes", 70)], "priority": "high",   "hours": 8},
    {"title": "ML model for task estimation",    "desc": "Predict task hours from description",        "skills": [("Python", 75), ("ML", 65)],         "priority": "medium", "hours": 12},
    {"title": "Fix dashboard performance",       "desc": "Reduce bundle size, lazy load routes",       "skills": [("React", 70), ("TypeScript", 65)],  "priority": "critical","hours": 3},
    {"title": "Migrate DB to PostgreSQL",        "desc": "Move from MongoDB to PostgreSQL",            "skills": [("PostgreSQL", 70), ("Python", 65)],  "priority": "low",    "hours": 16},
    {"title": "Add WebSocket notifications",     "desc": "Real-time task updates via WebSocket",       "skills": [("Node.js", 70), ("MongoDB", 60)],    "priority": "medium", "hours": 5},
    {"title": "Write API integration tests",     "desc": "pytest coverage for all FastAPI endpoints",  "skills": [("Python", 65), ("FastAPI", 60)],     "priority": "low",    "hours": 4},
]

PROMPTS = [
    ("How do I implement JWT refresh token rotation in FastAPI?",
     "Here's a complete implementation using python-jose and a Redis blocklist for revoked tokens..."),
    ("Write a React hook for infinite scroll with intersection observer",
     "Here's a reusable useInfiniteScroll hook that handles loading states and error boundaries..."),
    ("Explain the difference between Kubernetes Deployment and StatefulSet",
     "A Deployment manages stateless pods while StatefulSet maintains stable network identities..."),
    ("Optimize this MongoDB aggregation pipeline for performance",
     "You can improve this by adding compound indexes and using $facet to reduce collection scans..."),
    ("Generate pytest fixtures for a FastAPI app with MongoDB",
     "Here's a complete conftest.py using motor with an in-memory MongoDB instance for isolation..."),
    ("How to reduce React bundle size below 200KB?",
     "Use code splitting with React.lazy, tree shaking, and analyze with webpack-bundle-analyzer..."),
    ("Write a GitHub Actions workflow for Docker build and push",
     "Here's a complete workflow that builds, tags, and pushes to ECR with caching enabled..."),
]

PHASES = ["planning", "coding", "review", "debug"]


async def seed():
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(database=client[settings.db_name], document_models=[User, Task, AILog])

    # Clear existing data
    await User.delete_all()
    await Task.delete_all()
    await AILog.delete_all()
    print("🗑  Cleared existing data")

    # ── Create developers ──────────────────────────────────────────────────
    created_users = []
    for d in DEVELOPERS:
        perf = []
        for i in range(random.randint(5, 10)):
            perf.append(PerformanceRecord(
                task_id=f"legacy_task_{i:04d}",
                completion_time_hrs=round(random.uniform(2, 10), 1),
                quality_score=round(random.uniform(65, 98), 1),
                on_time=random.random() > 0.25,
                completed_at=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
            ))
        user = User(
            name=d["name"],
            email=d["email"],
            skills=[Skill(name=s[0], proficiency=s[1]) for s in d["skills"]],
            current_workload=d["workload"],
            ai_efficiency_score=d["ai_score"],
            commits_today=random.randint(0, 8),
            performance_history=perf,
        )
        await user.insert()
        created_users.append(user)
        print(f"  👤 Created developer: {user.name}")

    # ── Create tasks ───────────────────────────────────────────────────────
    from app.services.scoring import rank_developers_for_task
    created_tasks = []
    for i, t in enumerate(TASKS):
        task = Task(
            title=t["title"],
            description=t["desc"],
            required_skills=[RequiredSkill(name=s[0], min_proficiency=s[1]) for s in t["skills"]],
            priority=t["priority"],
            estimated_hours=t["hours"],
            deadline=datetime.utcnow() + timedelta(days=random.randint(3, 14)),
        )

        # Assign the first half of tasks, leave rest unassigned
        if i < len(TASKS) // 2:
            ranked = rank_developers_for_task(created_users, task)
            best = ranked[0]
            task.assigned_to = best["user_id"]
            task.allocation_score = best["total_score"]
            task.score_breakdown = best
            task.status = random.choice(["in_progress", "in_progress", "review", "done"])
            # Update workload
            for u in created_users:
                if str(u.id) == best["user_id"]:
                    u.current_workload = min(u.current_workload + (task.estimated_hours / 8) * 100, 100)
                    await u.save()
        await task.insert()
        created_tasks.append(task)
        print(f"  📋 Created task: {task.title[:40]} [{task.status}]")

    # ── Create AI logs ─────────────────────────────────────────────────────
    for _ in range(25):
        user = random.choice(created_users)
        task = random.choice(created_tasks)
        prompt, response = random.choice(PROMPTS)
        pt = random.randint(80, 400)
        rt = random.randint(200, 1200)
        log = AILog(
            user_id=str(user.id),
            task_id=str(task.id),
            phase=random.choice(PHASES),
            prompt=prompt,
            response=response,
            model=random.choice(["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"]),
            prompt_tokens=pt,
            response_tokens=rt,
            latency_ms=random.randint(400, 3000),
            user_rating=random.randint(3, 5),
            timestamp=datetime.utcnow() - timedelta(hours=random.randint(0, 72)),
        )
        await log.insert()

        # Update user AI efficiency (rolling EMA)
        efficiency = (rt / max(pt + rt, 1)) * (log.user_rating / 5.0) * 100
        user.ai_efficiency_score = round(0.8 * user.ai_efficiency_score + 0.2 * efficiency, 2)
        await user.save()

    print(f"  🤖 Created 25 AI interaction logs")

    print("\n✅ Seed complete! Open http://localhost:3000 to see your data.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())

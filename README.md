# WorkPigeon

WorkPigeon is an AI-powered task allocation platform built for software development teams. It uses a multi-metric scoring engine to intelligently assign and rebalance tasks across developers based on their current workload, skills, past performance, and AI usage efficiency.

This was built as a Semester VI academic project.

![Dashboard overview](screenshots/dashboard.png)

---

## What it does

The core idea is that assigning tasks manually is inefficient and biased. WorkPigeon automates this by scoring every developer against every task using four weighted signals, then picking the best match. It also supports team-wide rebalancing, where all active tasks are redistributed in one shot using a greedy algorithm that accounts for skill constraints.

The admin manages developers and tasks. Developers get a personal workspace with an AI chat assistant and a view of their own assigned work. All AI interactions are logged and factored into scoring over time.

---

## Scoring algorithm

Every developer is scored against a task out of 100 using this formula:

- Workload (25%) — developers with less current work score higher
- Past performance (25%) — based on average quality scores and on-time delivery from completed tasks
- Skill compatibility (30%) — how well the developer's skills match what the task requires
- AI efficiency (20%) — derived from the developer's AI interaction logs

The rebalance engine uses a least-flexibility-first approach: tasks with fewer qualified developers are assigned before tasks that anyone can do. Within the same priority tier, heavier tasks are distributed first to prevent large tasks from piling onto an already-loaded developer.

![Allocation engine results showing score breakdowns per task](screenshots/allocation_engine.png)

---

## Pages

**Login** — JWT-based authentication. Admins see the full dashboard. Developers are redirected to their personal workspace.

**Developers** — A card grid showing every registered developer. Each card shows workload level (Low / Medium / High), skills, commits, AI score, and an expandable list of assigned tasks. Admins can add or delete developers here.

![Developers page with workload badges and assigned task lists](screenshots/developers.png)

**Tasks** — A Kanban board with four columns: Unassigned, In Progress, Review, and Done. Each unassigned task has an Auto Assign button that runs the scoring engine and assigns it immediately.

![Task Kanban board](screenshots/tasks_kanban.png)

**Allocation Engine** — Runs a full team rebalance. Assigns all unassigned and in-progress tasks using the scoring algorithm and persists the results to the database.

**AI Logs** — Admin view of all AI chat interactions across the team, with an analytics summary.

**Developer Workspace** — Personal page for each developer showing their tasks, deadlines, and an AI chatbot they can use for help.

![Developer personal workspace with AI chat](screenshots/dev_workspace.png)

---

## Setup

### Requirements

- Node.js 18+
- Python 3.11+
- MongoDB running locally on port 27017 (or a remote URI)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# fill in your values in .env
python create_admin.py
python -m uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000`. Interactive docs at `/docs`.

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Seed data (optional)

```bash
cd backend
python seed.py
```

---

## Environment variables

Backend (`backend/.env`):

```
MONGO_URI=mongodb://localhost:27017
DB_NAME=workpigeon
SECRET_KEY=your-secret-key
OPENROUTER_API_KEY=your-openrouter-key
FRONTEND_URL=http://localhost:3000
```

Frontend (`apps/web/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project structure

```
WorkPigeon/
  apps/web/               Next.js 15 frontend
    app/                  Pages (login, developers, tasks, allocation, etc.)
    components/           React components
    lib/api.ts            Typed API client

  backend/
    app/
      routers/            API route handlers (auth, users, tasks, engine, chat)
      models/             Beanie ODM models
      services/scoring.py Core allocation algorithm
    create_admin.py       Create an admin user
    seed.py               Seed demo data
    requirements.txt
```

---

## Tech stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- Backend: FastAPI, Python 3.11
- Database: MongoDB, Beanie ODM, Motor
- Auth: JWT via python-jose
- AI: OpenRouter API

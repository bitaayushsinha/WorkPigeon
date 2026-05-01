"""
scoring.py — WorkPigeon Allocation Engine
==========================================
Calculates a composite developer-to-task compatibility score using
four weighted metrics:

  Score = 0.25 × Workload  +  0.25 × PastPerformance
        + 0.30 × SkillMatch  +  0.20 × AIEfficiency

Each metric is normalised to 0–100 before weighting.
"""

from __future__ import annotations

from typing import Dict, List

from app.models.user import User
from app.models.task import Task


# ---------------------------------------------------------------------------
# Metric calculators
# ---------------------------------------------------------------------------

def _workload_score(user: User) -> float:
    """
    Inverse workload: a developer with 0 % workload scores 100,
    one at 100 % scores 0.
    """
    return max(0.0, (1.0 - user.current_workload / 100.0) * 100.0)


def _past_performance_score(user: User) -> float:
    """
    Rolling average over the most recent 10 completed tasks.
    Combines quality (60 %) and on-time rate (40 %).
    Returns 50.0 (neutral) when no history exists.
    """
    history = user.performance_history[-10:]
    if not history:
        return 50.0

    scores = [
        record.quality_score * 0.6 + (100.0 if record.on_time else 0.0) * 0.4
        for record in history
    ]
    return sum(scores) / len(scores)


def _skill_compatibility_score(user: User, task: Task) -> float:
    """
    For every required skill on the task, check whether the developer has
    it and at what proficiency.  Partial credit is given for proficiency
    below the minimum; extra proficiency is capped at 1.0.

    Returns 0.0 if no skills are required (perfect match assumed → 100).
    """
    if not task.required_skills:
        return 100.0

    user_skill_map: Dict[str, int] = {
        s.name.lower(): s.proficiency for s in user.skills
    }

    ratios: List[float] = []
    for req in task.required_skills:
        dev_proficiency = user_skill_map.get(req.name.lower(), 0)
        ratio = min(dev_proficiency / max(req.min_proficiency, 1), 1.0)
        ratios.append(ratio)

    return (sum(ratios) / len(ratios)) * 100.0


def _ai_efficiency_score(user: User) -> float:
    """Direct pass-through of the stored AI efficiency score (0–100)."""
    return float(user.ai_efficiency_score)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

WEIGHTS = {
    "workload": 0.25,
    "past_performance": 0.25,
    "skill_compatibility": 0.30,
    "ai_efficiency": 0.20,
}


def score_developer_for_task(user: User, task: Task) -> Dict[str, float]:
    """
    Compute the full scoring breakdown for one developer against one task.

    Returns a dict with:
      - workload_score        (0–100)
      - past_performance_score (0–100)
      - skill_compatibility_score (0–100)
      - ai_efficiency_score   (0–100)
      - total_score           (0–100, weighted composite)
    """
    w = _workload_score(user)
    p = _past_performance_score(user)
    s = _skill_compatibility_score(user, task)
    a = _ai_efficiency_score(user)

    total = (
        WEIGHTS["workload"] * w
        + WEIGHTS["past_performance"] * p
        + WEIGHTS["skill_compatibility"] * s
        + WEIGHTS["ai_efficiency"] * a
    )

    return {
        "workload_score": round(w, 2),
        "past_performance_score": round(p, 2),
        "skill_compatibility_score": round(s, 2),
        "ai_efficiency_score": round(a, 2),
        "total_score": round(total, 2),
    }


def rank_developers_for_task(
    users: List[User], task: Task
) -> List[Dict]:
    """
    Score every developer in `users` against `task` and return a list
    sorted by total_score descending.
    """
    results = []
    for user in users:
        breakdown = score_developer_for_task(user, task)
        results.append(
            {
                "user_id": str(user.id),
                "user_name": user.name,
                "email": user.email,
                **breakdown,
            }
        )
    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results


def rebalance_workload(
    users: List[User], tasks: List[Task]
) -> List[Dict]:
    """
    Greedy rebalance: iterate tasks (highest priority first) and assign
    each to the best-scoring *available* developer, temporarily boosting
    that developer's workload to avoid over-assignment.

    Priority order: critical > high > medium > low
    """
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}

    # Pre-compute how many developers qualify for each task (have the required
    # skills at or above the minimum proficiency). Tasks with FEWER qualified
    # developers are assigned first ("least-flexibility-first") so constrained
    # tasks reserve the right developer, leaving flexible tasks for everyone else.
    def qualified_count(task: Task) -> int:
        if not task.required_skills:
            return len(users)  # everyone qualifies → most flexible, assign last
        count = 0
        for user in users:
            skill_map = {s.name.lower(): s.proficiency for s in user.skills}
            if all(
                skill_map.get(req.name.lower(), 0) >= req.min_proficiency
                for req in task.required_skills
            ):
                count += 1
        return max(count, 1)  # avoid division by zero

    sorted_tasks = sorted(
        tasks,
        key=lambda t: (
            priority_order.get(t.priority, 99),  # 1st: priority (critical first)
            qualified_count(t),                   # 2nd: fewest qualified devs first
            -t.estimated_hours,                   # 3rd: biggest task first
        ),
    )

    # Mutable workload snapshot (in-memory only, not persisted here)
    workload_snapshot: Dict[str, float] = {
        str(u.id): u.current_workload for u in users
    }

    assignments = []

    for task in sorted_tasks:
        # Clone users with current snapshot workloads for fair scoring
        best_user = None
        best_score = -1.0
        best_breakdown: Dict = {}

        for user in users:
            uid = str(user.id)
            # Temporarily apply snapshot workload for scoring
            original_workload = user.current_workload
            user.current_workload = workload_snapshot[uid]

            breakdown = score_developer_for_task(user, task)
            user.current_workload = original_workload  # restore

            # Tiebreaker: on equal score, prefer developer with lower snapshot
            # workload so tasks spread evenly rather than piling on one person.
            is_better_score = breakdown["total_score"] > best_score
            is_tie_lower_load = (
                breakdown["total_score"] == best_score
                and best_user is not None
                and workload_snapshot[uid] < workload_snapshot[str(best_user.id)]
            )
            if is_better_score or is_tie_lower_load:
                best_score = breakdown["total_score"]
                best_user = user
                best_breakdown = breakdown

        if best_user:
            uid = str(best_user.id)
            # Boost snapshot workload by estimated hours as a % of an 8-hr day
            workload_snapshot[uid] = min(
                workload_snapshot[uid] + (task.estimated_hours / 8.0) * 100, 100.0
            )
            assignments.append(
                {
                    "task_id": str(task.id),
                    "task_title": task.title,
                    "assigned_to_id": uid,
                    "assigned_to_name": best_user.name,
                    "score_breakdown": best_breakdown,
                }
            )

    return assignments

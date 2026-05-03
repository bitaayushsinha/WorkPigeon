"use client";
import { useEffect, useState } from "react";

import { api, Task, User } from "@/lib/api";
import { ArrowLeft, Zap, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700",
  medium: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  high: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50",
};

const STATUS_COLOR: Record<string, string> = {
  unassigned: "text-zinc-500 dark:text-zinc-400",
  in_progress: "text-blue-600 dark:text-blue-400",
  review: "text-amber-600 dark:text-amber-400",
  done: "text-emerald-600 dark:text-emerald-400",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm ${color.replace("text-", "bg-")}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function TaskDetailClient({ id }: { id: string }) {
  const [task, setTask] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.tasks.get(id)
      .then(async (t) => {
        setTask(t);
        if (t.assigned_to) {
          const u = await api.users.get(t.assigned_to).catch(() => null);
          setAssignee(u);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const updated = await api.tasks.assign(id);
      setTask(updated);
      if (updated.assigned_to) {
        const u = await api.users.get(updated.assigned_to).catch(() => null);
        setAssignee(u);
      }
    } catch (e: any) { setError(e.message); }
    finally { setAssigning(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-indigo-400" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-2">
        <Link href="/tasks" className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs">
          <ArrowLeft className="w-3 h-3" /> Back to Tasks
        </Link>
        <div className="office-panel p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm">{error || "Task not found."}</p>
        </div>
      </div>
    );
  }

  const breakdown = task.score_breakdown as Record<string, number> | null;

  return (
    <div className="space-y-4">
      <Link href="/tasks"
        className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-colors w-fit">
        <ArrowLeft className="w-3 h-3" /> Back to Tasks
      </Link>

      {/* Header */}
      <div className="office-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${PRIORITY_COLOR[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`text-[10px] font-medium ${STATUS_COLOR[task.status]}`}>
                [{task.status.replace("_", " ")}]
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">{task.title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">{task.description}</p>
          </div>
          {task.status === "unassigned" && (
            <button onClick={handleAssign} disabled={assigning}
              className="flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold px-3 py-1.5 rounded-sm text-xs">
              {assigning ? <Loader2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
              Auto Assign
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Estimated</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{task.estimated_hours}h</p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Deadline</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Assigned To</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{assignee?.name ?? "Unassigned"}</p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Allocation Score</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {task.allocation_score != null ? task.allocation_score.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Skills + Score breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="office-panel p-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            Required Skills
          </h2>
          {task.required_skills.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">No specific skills required.</p>
          ) : (
            <div className="space-y-2">
              {task.required_skills.map(s => (
                <div key={s.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-900 rounded-sm border border-gray-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-900 dark:text-zinc-100">{s.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1 bg-gray-200 dark:bg-zinc-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-sm"
                        style={{ width: `${s.min_proficiency}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{s.min_proficiency}+</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {breakdown && (
          <div className="office-panel p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
                Score Breakdown
              </h2>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{breakdown.total_score?.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <ScoreBar label="Workload" value={breakdown.workload_score ?? 0} color="text-blue-600 dark:text-blue-400" />
              <ScoreBar label="Past Performance" value={breakdown.past_performance_score ?? 0} color="text-emerald-600 dark:text-emerald-400" />
              <ScoreBar label="Skill Compatibility" value={breakdown.skill_compatibility_score ?? 0} color="text-purple-600 dark:text-purple-400" />
              <ScoreBar label="AI Efficiency" value={breakdown.ai_efficiency_score ?? 0} color="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

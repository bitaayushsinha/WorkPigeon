"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, Task, User } from "@/lib/api";
import { ArrowLeft, Zap, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const STATUS_COLOR: Record<string, string> = {
  unassigned: "text-slate-400",
  in_progress: "text-indigo-400",
  review: "text-amber-400",
  done: "text-emerald-400",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Link href="/tasks" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-rose-400">{error || "Task not found."}</p>
        </div>
      </div>
    );
  }

  const breakdown = task.score_breakdown as Record<string, number> | null;

  return (
    <div className="space-y-8">
      <Link href="/tasks"
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Tasks
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs px-2.5 py-1 rounded-lg border ${PRIORITY_COLOR[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`text-sm font-medium ${STATUS_COLOR[task.status]}`}>
                ● {task.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">{task.title}</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">{task.description}</p>
          </div>
          {task.status === "unassigned" && (
            <button onClick={handleAssign} disabled={assigning}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Auto Assign
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Estimated</p>
            <p className="font-bold text-white">{task.estimated_hours}h</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Deadline</p>
            <p className="font-bold text-white">
              {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Assigned To</p>
            <p className="font-bold text-indigo-300">{assignee?.name ?? "Unassigned"}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Allocation Score</p>
            <p className="font-bold text-emerald-400">
              {task.allocation_score != null ? task.allocation_score.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Skills + Score breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 font-[family-name:var(--font-outfit)]">
            Required Skills
          </h2>
          {task.required_skills.length === 0 ? (
            <p className="text-slate-500 text-sm">No specific skills required.</p>
          ) : (
            <div className="space-y-3">
              {task.required_skills.map(s => (
                <div key={s.name} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <span className="text-sm text-slate-200">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${s.min_proficiency}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{s.min_proficiency}+</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {breakdown && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-outfit)]">
                Score Breakdown
              </h2>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">{breakdown.total_score?.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-5">
              <ScoreBar label="Workload" value={breakdown.workload_score ?? 0} color="text-indigo-400" />
              <ScoreBar label="Past Performance" value={breakdown.past_performance_score ?? 0} color="text-emerald-400" />
              <ScoreBar label="Skill Compatibility" value={breakdown.skill_compatibility_score ?? 0} color="text-purple-400" />
              <ScoreBar label="AI Efficiency" value={breakdown.ai_efficiency_score ?? 0} color="text-amber-400" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

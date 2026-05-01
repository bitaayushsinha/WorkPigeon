"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, User, AILog, Task } from "@/lib/api";
import {
  ArrowLeft, Brain, GitCommit,
  Star, CheckCircle, XCircle, Loader2, ListTodo, Clock, Flag,
} from "lucide-react";
import Link from "next/link";

function WorkloadBadge({ value }: { value: number }) {
  const level = value > 66 ? "High" : value > 33 ? "Medium" : "Low";
  const styles: Record<string, string> = {
    High:   "bg-rose-500/10 text-rose-400 border-rose-500/25",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    Low:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  };
  const dot: Record<string, string> = {
    High: "bg-rose-400", Medium: "bg-amber-400", Low: "bg-emerald-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold ${styles[level]}`}>
      <span className={`w-2 h-2 rounded-full ${dot[level]}`} />
      {level} Workload
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/5`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-bold font-[family-name:var(--font-outfit)] ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  unassigned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-amber-400",
  critical: "text-rose-400",
};

function TaskRow({ task, index }: { task: Task; index: number }) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && task.status !== "done";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:border-white/10 transition-colors"
    >
      {/* Priority dot */}
      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
        task.priority === "critical" ? "bg-rose-400" :
        task.priority === "high" ? "bg-amber-400" :
        task.priority === "medium" ? "bg-blue-400" : "bg-slate-500"
      }`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{task.title}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Skills */}
          {task.required_skills.slice(0, 3).map(s => (
            <span key={s.name} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {/* Status badge */}
        <span className={`text-[10px] px-2 py-0.5 rounded-lg border capitalize ${STATUS_STYLES[task.status] ?? ""}`}>
          {task.status.replace("_", " ")}
        </span>

        {/* Hours */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          {task.estimated_hours}h
        </div>

        {/* Deadline */}
        {deadline && (
          <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-rose-400" : "text-slate-500"}`}>
            <Flag className="w-3 h-3" />
            {deadline.toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DeveloperProfileClient({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.users.get(id),
      api.aiLogs.list(id, 0, 10),
      api.tasks.listByAssignee(id),
    ])
      .then(([u, l, t]) => { setUser(u); setLogs(l); setTasks(t); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link href="/developers" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Developers
        </Link>
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-rose-400">{error || "Developer not found."}</p>
        </div>
      </div>
    );
  }

  const recent = user.performance_history.slice(-10);
  const avgQuality = recent.length
    ? (recent.reduce((s, r) => s + r.quality_score, 0) / recent.length).toFixed(1)
    : "â€”";
  const onTimeRate = recent.length
    ? `${Math.round((recent.filter(r => r.on_time).length / recent.length) * 100)}%`
    : "â€”";

  const activeTasks = tasks.filter(t => t.status !== "done");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/developers"
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Developers
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)]">
                {user.name}
              </h1>
              <p className="text-slate-400 mt-1">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {user.skills.map(s => (
                  <span key={s.name}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
                    {s.name} Â· {s.proficiency}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="md:ml-auto">
            <WorkloadBadge value={user.current_workload} />
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={GitCommit} label="Commits Today" value={user.commits_today} color="text-indigo-400" />
        <StatCard icon={Brain} label="AI Efficiency" value={`${user.ai_efficiency_score.toFixed(0)}/100`} color="text-purple-400" />
        <StatCard icon={Star} label="Avg Quality" value={avgQuality} color="text-amber-400" />
        <StatCard icon={CheckCircle} label="On-time Rate" value={onTimeRate} color="text-emerald-400" />
      </div>

      {/* â”€â”€ Assigned Tasks â”€â”€ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-outfit)] flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            Assigned Tasks
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {activeTasks.length} active
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {doneTasks.length} done
            </span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-slate-500 text-sm">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {/* Active tasks first */}
            {activeTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} />
            ))}
            {/* Separator if both exist */}
            {activeTasks.length > 0 && doneTasks.length > 0 && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-slate-600">Completed</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            )}
            {doneTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} index={activeTasks.length + i} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Performance history + AI logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Performance History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 font-[family-name:var(--font-outfit)]">
            Task Performance History
          </h2>
          {recent.length === 0 ? (
            <p className="text-slate-500 text-sm">No completed tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {recent.map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    {r.on_time
                      ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                      : <XCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">Task {r.task_id.slice(-6)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${r.quality_score}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{r.quality_score.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{r.completion_time_hrs}h</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent AI Logs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 font-[family-name:var(--font-outfit)]">
            Recent AI Interactions
          </h2>
          {logs.length === 0 ? (
            <p className="text-slate-500 text-sm">No AI interactions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => (
                <motion.div key={log.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                      {log.phase}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>{log.model}</span>
                      <span>{log.latency_ms}ms</span>
                      {log.user_rating && <span className="text-amber-400">{"â˜…".repeat(log.user_rating)}</span>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{log.prompt}</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {log.prompt_tokens + log.response_tokens} tokens
                  </p>
                </motion.div>
              ))}
            </div>
          )}
          <Link href="/ai-logs"
            className="mt-4 block text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-2 border border-white/[0.06] rounded-xl hover:border-indigo-500/30">
            View all AI logs â†’
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

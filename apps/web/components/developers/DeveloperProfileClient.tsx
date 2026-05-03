"use client";
import { useEffect, useState } from "react";

import { api, User, AILog, Task } from "@/lib/api";
import {
  ArrowLeft, Brain, GitCommit,
  Star, CheckCircle, XCircle, Loader2, ListTodo, Clock, Flag,
} from "lucide-react";
import Link from "next/link";

function WorkloadBadge({ value }: { value: number }) {
  const level = value > 66 ? "High" : value > 33 ? "Medium" : "Low";
  const styles: Record<string, string> = {
    High:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50",
    Medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    Low:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  };
  const dot: Record<string, string> = {
    High: "bg-red-500", Medium: "bg-amber-500", Low: "bg-emerald-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-sm font-semibold ${styles[level]}`}>
      <span className={`w-2 h-2 rounded-full ${dot[level]}`} />
      {level} Workload
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="office-panel p-3">
      <div className={`w-7 h-7 rounded-sm flex items-center justify-center mb-2 bg-gray-100 dark:bg-zinc-800`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className={`text-xl font-bold font-[family-name:var(--font-outfit)] ${color}`}>{value}</p>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  unassigned: "bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700",
  in_progress: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  review: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  done: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
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
    <div
      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-900 rounded-sm border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-500 transition-colors"
    >
      {/* Priority dot */}
      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
        task.priority === "critical" ? "bg-red-500" :
        task.priority === "high" ? "bg-amber-500" :
        task.priority === "medium" ? "bg-blue-500" : "bg-gray-500"
      }`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium truncate">{task.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{task.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Skills */}
          {task.required_skills.slice(0, 3).map(s => (
            <span key={s.name} className="px-2 py-0.5 rounded-sm bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] border border-gray-200 dark:border-zinc-700">
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {/* Status badge */}
        <span className={`text-[10px] px-2 py-0.5 rounded-sm border capitalize ${STATUS_STYLES[task.status] ?? ""}`}>
          {task.status.replace("_", " ")}
        </span>

        {/* Hours */}
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <Clock className="w-3 h-3" />
          {task.estimated_hours}h
        </div>

        {/* Deadline */}
        {deadline && (
          <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
            <Flag className="w-3 h-3" />
            {deadline.toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
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
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-indigo-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-2">
        <Link href="/developers" className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs">
          <ArrowLeft className="w-3 h-3" /> Back to Developers
        </Link>
        <div className="office-panel p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm">{error || "Developer not found."}</p>
        </div>
      </div>
    );
  }

  const recent = user.performance_history.slice(-10);
  const avgQuality = recent.length
    ? (recent.reduce((s, r) => s + r.quality_score, 0) / recent.length).toFixed(1)
    : "—";
  const onTimeRate = recent.length
    ? `${Math.round((recent.filter(r => r.on_time).length / recent.length) * 100)}%`
    : "—";

  const activeTasks = tasks.filter(t => t.status !== "done");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/developers"
        className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-colors w-fit">
        <ArrowLeft className="w-3 h-3" /> Back to Developers
      </Link>

      {/* Header */}
      <div className="office-panel p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm bg-black dark:bg-white flex items-center justify-center text-xl font-bold text-white dark:text-black shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
                {user.name}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.skills.map(s => (
                  <span key={s.name}
                    className="px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] border border-gray-200 dark:border-zinc-700">
                    {s.name} · {s.proficiency}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="md:ml-auto">
            <WorkloadBadge value={user.current_workload} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        <StatCard icon={GitCommit} label="Commits Today" value={user.commits_today} color="text-indigo-400" />
        <StatCard icon={Brain} label="AI Efficiency" value={`${user.ai_efficiency_score.toFixed(0)}/100`} color="text-purple-400" />
        <StatCard icon={Star} label="Avg Quality" value={avgQuality} color="text-amber-400" />
        <StatCard icon={CheckCircle} label="On-time Rate" value={onTimeRate} color="text-emerald-400" />
      </div>

      <div className="office-panel p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)] flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            Assigned Tasks
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              {activeTasks.length} active
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              {doneTasks.length} done
            </span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {/* Active tasks first */}
            {activeTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} />
            ))}
            {/* Separator if both exist */}
            {activeTasks.length > 0 && doneTasks.length > 0 && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">Completed</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
              </div>
            )}
            {doneTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} index={activeTasks.length + i} />
            ))}
          </div>
        )}
      </div>

      {/* Performance history + AI logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">

        {/* Performance History */}
        <div className="office-panel p-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            Task Performance History
          </h2>
          {recent.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">No completed tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-zinc-900 rounded-sm border border-gray-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-sm bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {r.on_time
                      ? <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      : <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Task {r.task_id.slice(-6)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-gray-200 dark:bg-zinc-800 rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm bg-black dark:bg-white"
                          style={{ width: `${r.quality_score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 shrink-0">{r.quality_score.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{r.completion_time_hrs}h</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent AI Logs */}
        <div className="office-panel p-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            Recent AI Interactions
          </h2>
          {logs.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">No AI interactions logged yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={log.id}
                  className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-sm border border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-gray-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 capitalize">
                      {log.phase}
                    </span>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 dark:text-zinc-400">
                      <span>{log.model}</span>
                      <span>{log.latency_ms}ms</span>
                      {log.user_rating && <span className="text-amber-500 dark:text-amber-400">{"*".repeat(log.user_rating)}</span>}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">{log.prompt}</p>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-1">
                    {log.prompt_tokens + log.response_tokens} tokens
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link href="/ai-logs"
            className="mt-3 block text-center text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1.5 border border-gray-200 dark:border-zinc-800 rounded-sm hover:bg-gray-50 dark:hover:bg-zinc-900">
            View all AI logs -&gt;
          </Link>
        </div>
      </div>
    </div>
  );
}

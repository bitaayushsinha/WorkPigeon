"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, User, Task, AILogAnalytics } from "@/lib/api";
import {
  Users, CheckSquare, Brain, Zap, TrendingUp, Clock, Star, Activity
} from "lucide-react";

// Animations removed for compact oldschool feel

function WorkloadRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value > 80 ? "#f43f5e" : value > 60 ? "#f59e0b" : "#6366f1";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, index }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; index: number;
}) {
  return (
    <div className="office-panel office-panel-hover p-3 relative overflow-hidden">
      <div className={`w-8 h-8 rounded-sm flex items-center justify-center mb-2 bg-gray-100 dark:bg-zinc-800`}>
        <Icon className="w-4 h-4" style={{ color: color.replace("bg-", "") === color ? "#818cf8" : "#818cf8" }} />
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<AILogAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.users.list(), api.tasks.list(), api.aiLogs.analytics()])
      .then(([u, t, a]) => { setUsers(u); setTasks(t); setAnalytics(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="office-panel h-24 bg-gray-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  const avgWorkload = users.length
    ? Math.round(users.reduce((s, u) => s + u.current_workload, 0) / users.length)
    : 0;
  const byStatus = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const kpis = [
    { icon: Users, label: "Developers", value: users.length, sub: `avg ${avgWorkload}% workload`, color: "bg-indigo-500" },
    { icon: CheckSquare, label: "Total Tasks", value: tasks.length, sub: `${byStatus.unassigned ?? 0} unassigned`, color: "bg-emerald-500" },
    { icon: Brain, label: "AI Interactions", value: analytics?.total_logs ?? 0, sub: `avg ${analytics?.avg_latency_ms?.toFixed(0) ?? 0}ms latency`, color: "bg-purple-500" },
    { icon: Zap, label: "Tokens Used", value: ((analytics?.total_prompt_tokens ?? 0) + (analytics?.total_response_tokens ?? 0)).toLocaleString(), sub: "prompt + response", color: "bg-amber-500" },
  ];

  const taskCols: Array<{ key: string; label: string; color: string }> = [
    { key: "unassigned", label: "Unassigned", color: "text-zinc-500 dark:text-zinc-400" },
    { key: "in_progress", label: "In Progress", color: "text-blue-600 dark:text-blue-400" },
    { key: "review", label: "Review", color: "text-amber-600 dark:text-amber-400" },
    { key: "done", label: "Done", color: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
          Dashboard Overview
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time team health and workflow metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} index={i} />)}
      </div>

      {/* Task status + Top developers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Task Status */}
        <div className="office-panel p-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            Task Status Distribution
          </h2>
          <div className="space-y-3">
            {taskCols.map(({ key, label, color }) => {
              const count = byStatus[key] ?? 0;
              const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-black dark:bg-white"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Developers */}
        <div className="office-panel p-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            Team Workload
          </h2>
          {users.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">No developers registered yet.</p>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-sm bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-[10px] font-bold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-900 dark:text-zinc-100 truncate">{u.name}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{Math.round(u.current_workload)}%</span>
                    </div>
                    <div className="h-1 bg-gray-200 dark:bg-zinc-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm ${u.current_workload > 80 ? "bg-red-600 dark:bg-red-500" : u.current_workload > 60 ? "bg-amber-600 dark:bg-amber-500" : "bg-black dark:bg-white"}`}
                        style={{ width: `${u.current_workload}%` }}
                      />
                    </div>
                  </div>
                  <WorkloadRing value={u.current_workload} size={32} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Phase breakdown */}
      {analytics && (
        <div className="office-panel p-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            AI Interactions by Phase
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(analytics.logs_by_phase).map(([phase, count]) => (
              <div key={phase} className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">{count}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">{phase}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Avg Latency</p>
              <p className="text-sm font-bold text-black dark:text-white">{analytics.avg_latency_ms.toFixed(0)}ms</p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Avg Rating</p>
              <p className="text-sm font-bold text-black dark:text-white flex items-center gap-1">
                {analytics.avg_user_rating ? <>{analytics.avg_user_rating.toFixed(1)} <Star className="w-3 h-3 text-zinc-400" /></> : "—"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-sm p-2 border border-gray-200 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Total Tokens</p>
              <p className="text-sm font-bold text-black dark:text-white">
                {(analytics.total_prompt_tokens + analytics.total_response_tokens).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

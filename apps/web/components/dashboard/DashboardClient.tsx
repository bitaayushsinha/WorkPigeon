"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, User, Task, AILogAnalytics } from "@/lib/api";
import {
  Users, CheckSquare, Brain, Zap, TrendingUp, Clock, Star, Activity
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

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
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, index }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; index: number;
}) {
  return (
    <motion.div
      variants={fadeUp} custom={index} initial="hidden" animate="show"
      className="glass glass-hover p-6 rounded-2xl relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${color}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-20`}
           style={{ background: "rgba(255,255,255,0.06)" }}>
        <Icon className="w-5 h-5" style={{ color: color.replace("bg-", "") === color ? "#818cf8" : "#818cf8" }} />
      </div>
      <p className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)]">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-2">{sub}</p>}
    </motion.div>
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
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl h-36 animate-pulse" />
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
    { key: "unassigned", label: "Unassigned", color: "text-slate-400" },
    { key: "in_progress", label: "In Progress", color: "text-indigo-400" },
    { key: "review", label: "Review", color: "text-amber-400" },
    { key: "done", label: "Done", color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)]">
          Dashboard <span className="gradient-text">Overview</span>
        </h1>
        <p className="text-slate-400 mt-1">Real-time team health and workflow metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} index={i} />)}
      </div>

      {/* Task status + Top developers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Task Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-5 font-[family-name:var(--font-outfit)]">
            Task Status Distribution
          </h2>
          <div className="space-y-4">
            {taskCols.map(({ key, label, color }) => {
              const count = byStatus[key] ?? 0;
              const pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm font-medium ${color}`}>{label}</span>
                    <span className="text-sm text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Developers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-5 font-[family-name:var(--font-outfit)]">
            Team Workload
          </h2>
          {users.length === 0 ? (
            <p className="text-slate-500 text-sm">No developers registered yet.</p>
          ) : (
            <div className="space-y-4">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-200 truncate">{u.name}</span>
                      <span className="text-xs text-slate-400">{Math.round(u.current_workload)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${u.current_workload > 80 ? "bg-rose-500" : u.current_workload > 60 ? "bg-amber-500" : "bg-indigo-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${u.current_workload}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                      />
                    </div>
                  </div>
                  <WorkloadRing value={u.current_workload} size={40} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Phase breakdown */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-5 font-[family-name:var(--font-outfit)]">
            AI Interactions by Phase
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(analytics.logs_by_phase).map(([phase, count]) => (
              <div key={phase} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                <p className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">{count}</p>
                <p className="text-sm text-slate-400 capitalize mt-1">{phase}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-slate-500 mb-1">Avg Latency</p>
              <p className="text-lg font-bold text-indigo-400">{analytics.avg_latency_ms.toFixed(0)}ms</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-slate-500 mb-1">Avg Rating</p>
              <p className="text-lg font-bold text-amber-400">
                {analytics.avg_user_rating ? `${analytics.avg_user_rating.toFixed(1)} ★` : "—"}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-slate-500 mb-1">Total Tokens</p>
              <p className="text-lg font-bold text-emerald-400">
                {(analytics.total_prompt_tokens + analytics.total_response_tokens).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";

import { api, RebalanceResult, ScoreBreakdown } from "@/lib/api";
import { Zap, Loader2, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{value.toFixed(1)}</span>
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

export default function AllocationClient() {
  const [result, setResult] = useState<RebalanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const h = await api.engine.health();
      setHealth(h.status);
    } catch { setHealth("error"); }
  };

  const runRebalance = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await api.engine.rebalance();
      setResult(r);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
          Allocation Engine
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Run the 4-metric scoring algorithm to optimally rebalance all active tasks across the team.
        </p>
      </div>

      {/* Engine Info Card */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 office-panel p-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 font-[family-name:var(--font-outfit)]">
            Scoring Formula
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Workload Score", weight: "25%", formula: "(1 - workload/100) * 100", color: "bg-blue-600 dark:bg-blue-500", icon: "[WL]" },
              { label: "Past Performance", weight: "25%", formula: "quality*0.6 + on_time*0.4", color: "bg-emerald-600 dark:bg-emerald-500", icon: "[PRF]" },
              { label: "Skill Compatibility", weight: "30%", formula: "Sum(prof/req)/n", color: "bg-purple-600 dark:bg-purple-500", icon: "[SKL]" },
              { label: "AI Efficiency", weight: "20%", formula: "ai_efficiency_score", color: "bg-amber-600 dark:bg-amber-500", icon: "[AI]" },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">{m.icon}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${m.color} text-white`}>
                    {m.weight}
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">{m.label}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{m.formula}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm">
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
              Final Score = 0.25*Workload + 0.25*Performance + 0.30*Skills + 0.20*AI
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="office-panel p-4 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">Controls</h2>

          <button onClick={checkHealth}
            className="flex items-center justify-center gap-1.5 w-full border border-gray-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-900 py-2 rounded-sm text-xs transition-all">
            <RefreshCw className="w-3 h-3" /> Check Engine Health
          </button>

          {health && (
            <div className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm ${health === "ok" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50"}`}>
              <CheckCircle className="w-3 h-3" />
              Engine: {health}
            </div>
          )}

          <button onClick={runRebalance} disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold py-2.5 rounded-sm transition-all mt-auto text-sm">
            {loading ? (
              <><Loader2 className="w-4 h-4" /> Rebalancing...</>
            ) : (
              <><Zap className="w-4 h-4" /> Rebalance Workload</>
            )}
          </button>

          {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
              Rebalance Results
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {result.total_tasks_processed} task{result.total_tasks_processed !== 1 ? "s" : ""} processed
            </span>
          </div>

          {result.assignments.length === 0 ? (
            <div className="office-panel p-6 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">No active tasks to rebalance. Create and assign some tasks first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.assignments.map((a, i) => (
                <div key={a.task_id}
                  className="office-panel p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Task</p>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{a.task_title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Assigned To</p>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{a.assigned_to_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Score</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
                        {(a.score_breakdown as any).total_score?.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <ScoreBar label="Workload" value={(a.score_breakdown as any).workload_score} color="text-blue-600 dark:text-blue-400" />
                      <ScoreBar label="Past Performance" value={(a.score_breakdown as any).past_performance_score} color="text-emerald-600 dark:text-emerald-400" />
                      <ScoreBar label="Skill Compatibility" value={(a.score_breakdown as any).skill_compatibility_score} color="text-purple-600 dark:text-purple-400" />
                      <ScoreBar label="AI Efficiency" value={(a.score_breakdown as any).ai_efficiency_score} color="text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

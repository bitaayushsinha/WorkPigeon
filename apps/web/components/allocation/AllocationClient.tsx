"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, RebalanceResult, ScoreBreakdown } from "@/lib/api";
import { Zap, Loader2, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.7 }}
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)]">
          Allocation <span className="gradient-text">Engine</span>
        </h1>
        <p className="text-slate-400 mt-1">
          Run the 4-metric scoring algorithm to optimally rebalance all active tasks across the team.
        </p>
      </div>

      {/* Engine Info Card */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6 font-[family-name:var(--font-outfit)]">
            Scoring Formula
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Workload Score", weight: "25%", formula: "(1 − workload/100) × 100", color: "from-indigo-500 to-indigo-700", icon: "⚖️" },
              { label: "Past Performance", weight: "25%", formula: "quality×0.6 + on_time×0.4", color: "from-emerald-500 to-emerald-700", icon: "📈" },
              { label: "Skill Compatibility", weight: "30%", formula: "Σ(proficiency/required) / n", color: "from-purple-500 to-purple-700", icon: "🎯" },
              { label: "AI Efficiency", weight: "20%", formula: "ai_efficiency_score (0–100)", color: "from-amber-500 to-amber-700", icon: "🤖" },
            ].map(m => (
              <div key={m.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{m.icon}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${m.color} text-white`}>
                    {m.weight}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{m.label}</p>
                <p className="text-xs text-slate-500 font-mono">{m.formula}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-indigo-300 font-mono">
              Final Score = 0.25×Workload + 0.25×Performance + 0.30×Skills + 0.20×AI
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-outfit)]">Controls</h2>

          <button onClick={checkHealth}
            className="flex items-center justify-center gap-2 w-full border border-white/10 text-slate-300 hover:text-white hover:border-white/20 py-3 rounded-xl text-sm transition-all">
            <RefreshCw className="w-4 h-4" /> Check Engine Health
          </button>

          {health && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${health === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              <CheckCircle className="w-4 h-4" />
              Engine: {health}
            </div>
          )}

          <button onClick={runRebalance} disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all mt-auto">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Rebalancing…</>
            ) : (
              <><Zap className="w-5 h-5" /> Rebalance Workload</>
            )}
          </button>

          {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-outfit)]">
                Rebalance Results
              </h2>
              <span className="text-sm text-slate-400">
                {result.total_tasks_processed} task{result.total_tasks_processed !== 1 ? "s" : ""} processed
              </span>
            </div>

            {result.assignments.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-slate-500">No active tasks to rebalance. Create and assign some tasks first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.assignments.map((a, i) => (
                  <motion.div key={a.task_id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 mb-1">Task</p>
                        <p className="font-semibold text-white">{a.task_title}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 mb-1">Assigned To</p>
                        <p className="font-semibold text-indigo-300">{a.assigned_to_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Score</p>
                        <p className="text-2xl font-bold gradient-text font-[family-name:var(--font-outfit)]">
                          {(a.score_breakdown as any).total_score?.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ScoreBar label="Workload" value={(a.score_breakdown as any).workload_score} color="text-indigo-400" />
                      <ScoreBar label="Past Performance" value={(a.score_breakdown as any).past_performance_score} color="text-emerald-400" />
                      <ScoreBar label="Skill Compatibility" value={(a.score_breakdown as any).skill_compatibility_score} color="text-purple-400" />
                      <ScoreBar label="AI Efficiency" value={(a.score_breakdown as any).ai_efficiency_score} color="text-amber-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

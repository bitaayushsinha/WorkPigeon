"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, AILog, AILogAnalytics, User } from "@/lib/api";
import { Brain, Clock, Star, Plus, X, Loader2 } from "lucide-react";

const PHASE_COLOR: Record<string, string> = {
  planning: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  coding: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  debug: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

function AddLogModal({ onClose, onAdd, users }: {
  onClose: () => void; onAdd: (l: AILog) => void; users: User[];
}) {
  const [form, setForm] = useState<{
    user_id: string;
    phase: "planning" | "coding" | "review" | "debug";
    prompt: string;
    response: string;
    model: string;
    prompt_tokens: number;
    response_tokens: number;
    latency_ms: number;
    user_rating: number;
  }>({
    user_id: "", phase: "coding" as const, prompt: "", response: "", model: "gpt-4o",
    prompt_tokens: 100, response_tokens: 300, latency_ms: 800, user_rating: 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.user_id || !form.prompt) return;
    setLoading(true); setError("");
    try {
      const log = await api.aiLogs.create(form);
      onAdd(log); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)]">Log AI Interaction</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="space-y-4">
          <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>
            <option value="" className="bg-[#1a1a2e]">Select developer…</option>
            {users.map(u => <option key={u.id} value={u.id} className="bg-[#1a1a2e]">{u.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value as "planning" | "coding" | "review" | "debug" })}>
              {["planning","coding","review","debug"].map(p => <option key={p} value={p} className="bg-[#1a1a2e]">{p}</option>)}
            </select>
            <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Model (gpt-4o)" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
          </div>
          <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Prompt" value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} />
          <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Response" value={form.response} onChange={e => setForm({ ...form, response: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Prompt tokens</p>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.prompt_tokens} onChange={e => setForm({ ...form, prompt_tokens: Number(e.target.value) })} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Response tokens</p>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.response_tokens} onChange={e => setForm({ ...form, response_tokens: Number(e.target.value) })} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Latency ms</p>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.latency_ms} onChange={e => setForm({ ...form, latency_ms: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Rating (1–5)</p>
            <input type="number" min={1} max={5} className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={form.user_rating} onChange={e => setForm({ ...form, user_rating: Number(e.target.value) })} />
          </div>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Interaction"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AILogsClient() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [analytics, setAnalytics] = useState<AILogAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadData = async (uid?: string) => {
    setLoading(true);
    const [a, u] = await Promise.all([
      api.aiLogs.analytics(uid || undefined),
      api.users.list(),
    ]);
    setAnalytics(a);
    setUsers(u);
    if (u.length > 0) {
      const firstUid = uid || u[0]?.id;
      if (firstUid) {
        const l = await api.aiLogs.list(firstUid);
        setLogs(l);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleUserChange = async (uid: string) => {
    setSelectedUser(uid);
    if (uid) {
      const l = await api.aiLogs.list(uid);
      setLogs(l);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)]">
            <span className="gradient-text">AI Logs</span>
          </h1>
          <p className="text-slate-400 mt-1">Interaction history and usage analytics.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> Log Interaction
        </button>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: "Total Interactions", value: analytics.total_logs, color: "text-indigo-400" },
            { icon: Clock, label: "Avg Latency", value: `${analytics.avg_latency_ms.toFixed(0)}ms`, color: "text-amber-400" },
            { icon: Star, label: "Avg Rating", value: analytics.avg_user_rating ? `${analytics.avg_user_rating.toFixed(1)} ★` : "—", color: "text-yellow-400" },
            { icon: Brain, label: "Total Tokens", value: (analytics.total_prompt_tokens + analytics.total_response_tokens).toLocaleString(), color: "text-emerald-400" },
          ].map((k, i) => (
            <motion.div key={k.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5">
              <p className={`text-2xl font-bold font-[family-name:var(--font-outfit)] ${k.color}`}>{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          value={selectedUser} onChange={e => handleUserChange(e.target.value)}>
          <option value="" className="bg-[#1a1a2e]">All Developers</option>
          {users.map(u => <option key={u.id} value={u.id} className="bg-[#1a1a2e]">{u.name}</option>)}
        </select>
      </div>

      {/* Log table */}
      {loading ? (
        <div className="glass rounded-2xl h-64 animate-pulse" />
      ) : logs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500">No AI interactions logged yet.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-slate-500">
                  <th className="text-left px-6 py-4">Phase</th>
                  <th className="text-left px-6 py-4">Model</th>
                  <th className="text-left px-6 py-4 max-w-xs">Prompt</th>
                  <th className="text-right px-6 py-4">Tokens</th>
                  <th className="text-right px-6 py-4">Latency</th>
                  <th className="text-right px-6 py-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr key={log.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${PHASE_COLOR[log.phase]}`}>
                        {log.phase}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.model}</td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">{log.prompt}</td>
                    <td className="px-6 py-4 text-right text-slate-400">{log.prompt_tokens + log.response_tokens}</td>
                    <td className="px-6 py-4 text-right text-slate-400">{log.latency_ms}ms</td>
                    <td className="px-6 py-4 text-right">
                      {log.user_rating ? (
                        <span className="text-amber-400">{"★".repeat(log.user_rating)}{"☆".repeat(5 - log.user_rating)}</span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <AddLogModal onClose={() => setShowModal(false)} users={users}
          onAdd={l => setLogs(prev => [l, ...prev])} />
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

import { api, AILog, AILogAnalytics, User } from "@/lib/api";
import { Brain, Clock, Star, Plus, X, Loader2 } from "lucide-react";

const PHASE_COLOR: Record<string, string> = {
  planning: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  coding: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
  review: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  debug: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="office-panel p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">Log AI Interaction</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" /></button>
        </div>
        <div className="space-y-2">
          <select className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
            value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>
            <option value="">Select developer...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
              value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value as "planning" | "coding" | "review" | "debug" })}>
              {["planning","coding","review","debug"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Model (gpt-4o)" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
          </div>
          <textarea rows={3} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white resize-none"
            placeholder="Prompt" value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} />
          <textarea rows={3} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white resize-none"
            placeholder="Response" value={form.response} onChange={e => setForm({ ...form, response: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Prompt tokens</p>
              <input type="number" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
                value={form.prompt_tokens} onChange={e => setForm({ ...form, prompt_tokens: Number(e.target.value) })} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Response tokens</p>
              <input type="number" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
                value={form.response_tokens} onChange={e => setForm({ ...form, response_tokens: Number(e.target.value) })} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Latency ms</p>
              <input type="number" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
                value={form.latency_ms} onChange={e => setForm({ ...form, latency_ms: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Rating (1-5)</p>
            <input type="number" min={1} max={5} className="w-16 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
              value={form.user_rating} onChange={e => setForm({ ...form, user_rating: Number(e.target.value) })} />
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold py-2 text-xs rounded-sm transition-all flex items-center justify-center gap-1.5">
            {loading ? <Loader2 className="w-3 h-3" /> : "Log Interaction"}
          </button>
        </div>
      </div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
            AI Logs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Interaction history and usage analytics.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold px-3 py-1.5 rounded-sm transition-all text-xs">
          <Plus className="w-3 h-3" /> Log Interaction
        </button>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Brain, label: "Total Interactions", value: analytics.total_logs, color: "text-blue-600 dark:text-blue-400" },
            { icon: Clock, label: "Avg Latency", value: `${analytics.avg_latency_ms.toFixed(0)}ms`, color: "text-amber-600 dark:text-amber-400" },
            { icon: Star, label: "Avg Rating", value: analytics.avg_user_rating ? `${analytics.avg_user_rating.toFixed(1)}/5` : "—", color: "text-yellow-600 dark:text-yellow-400" },
            { icon: Brain, label: "Total Tokens", value: (analytics.total_prompt_tokens + analytics.total_response_tokens).toLocaleString(), color: "text-emerald-600 dark:text-emerald-400" },
          ].map((k, i) => (
            <div key={k.label}
              className="office-panel p-3">
              <p className={`text-xl font-bold font-[family-name:var(--font-outfit)] ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select
          className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
          value={selectedUser} onChange={e => handleUserChange(e.target.value)}>
          <option value="">All Developers</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Log table */}
      {loading ? (
        <div className="office-panel h-64 bg-gray-100 dark:bg-zinc-800" />
      ) : logs.length === 0 ? (
        <div className="office-panel p-16 text-center">
          <Brain className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">No AI interactions logged yet.</p>
        </div>
      ) : (
        <div className="office-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                  <th className="text-left px-3 py-2">Phase</th>
                  <th className="text-left px-3 py-2">Model</th>
                  <th className="text-left px-3 py-2 max-w-xs">Prompt</th>
                  <th className="text-right px-3 py-2">Tokens</th>
                  <th className="text-right px-3 py-2">Latency</th>
                  <th className="text-right px-3 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id}
                    className="border-b border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${PHASE_COLOR[log.phase]}`}>
                        {log.phase}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{log.model}</td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">{log.prompt}</td>
                    <td className="px-3 py-2 text-right text-zinc-500 dark:text-zinc-400">{log.prompt_tokens + log.response_tokens}</td>
                    <td className="px-3 py-2 text-right text-zinc-500 dark:text-zinc-400">{log.latency_ms}ms</td>
                    <td className="px-3 py-2 text-right">
                      {log.user_rating ? (
                        <span className="text-amber-500 dark:text-amber-400">{"*".repeat(log.user_rating)}{"-".repeat(5 - log.user_rating)}</span>
                      ) : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                    </td>
                  </tr>
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

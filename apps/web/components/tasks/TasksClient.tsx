"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Task, User } from "@/lib/api";
import { Plus, X, Loader2, Zap, UserX } from "lucide-react";

const COLS: Array<{ key: Task["status"]; label: string; color: string; dot: string }> = [
  { key: "unassigned", label: "Unassigned", color: "border-slate-700", dot: "bg-slate-500" },
  { key: "in_progress", label: "In Progress", color: "border-indigo-700", dot: "bg-indigo-500" },
  { key: "review", label: "Review", color: "border-amber-700", dot: "bg-amber-500" },
  { key: "done", label: "Done", color: "border-emerald-700", dot: "bg-emerald-500" },
];

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  critical: "bg-rose-500/20 text-rose-400",
};

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Task) => void }) {
  const [form, setForm] = useState<{ title: string; description: string; priority: "low" | "medium" | "high" | "critical"; estimated_hours: number }>({ title: "", description: "", priority: "medium", estimated_hours: 4 });
  const [skills, setSkills] = useState([{ name: "", min_proficiency: 60 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title) return;
    setLoading(true); setError("");
    try {
      const task = await api.tasks.create({ ...form, required_skills: skills.filter(s => s.name) });
      onAdd(task); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 w-full max-w-lg border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)]">New Task</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as "low" | "medium" | "high" | "critical" })}>
              {["low","medium","high","critical"].map(p => <option key={p} value={p} className="bg-[#1a1a2e]">{p}</option>)}
            </select>
            <input type="number" min={0.5} step={0.5} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Hours" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Required Skills</p>
            {skills.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Skill name" value={s.name} onChange={e => { const n = [...skills]; n[i].name = e.target.value; setSkills(n); }} />
                <input type="number" min={0} max={100} className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  value={s.min_proficiency} onChange={e => { const n = [...skills]; n[i].min_proficiency = Number(e.target.value); setSkills(n); }} />
              </div>
            ))}
            <button onClick={() => setSkills([...skills, { name: "", min_proficiency: 60 }])}
              className="text-xs text-indigo-400 hover:text-indigo-300">+ Add skill</button>
          </div>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TaskCard({ task, onAssign, onStatusChange, hasDevs }: {
  task: Task;
  onAssign: (id: string) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  hasDevs: boolean;
}) {
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    setAssigning(true);
    try { await onAssign(task.id); }
    finally { setAssigning(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-indigo-500/30 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white leading-snug">{task.title}</p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg shrink-0 ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {task.required_skills.map(s => (
          <span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {s.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-600">{task.estimated_hours}h</span>
        {task.allocation_score && (
          <span className="text-[10px] text-emerald-400">★ {task.allocation_score.toFixed(0)}</span>
        )}
      </div>
      {task.status === "unassigned" && (
        hasDevs ? (
          <button onClick={handleAssign} disabled={assigning}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-indigo-300 border border-indigo-500/30 rounded-lg py-1.5 hover:bg-indigo-500/10 transition-all">
            {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Auto Assign
          </button>
        ) : (
          <div title="No developers registered yet"
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-600 border border-white/[0.05] rounded-lg py-1.5 cursor-not-allowed select-none">
            <UserX className="w-3 h-3" />
            No Developers
          </div>
        )
      )}
    </motion.div>
  );
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([api.tasks.list(), api.users.list()])
      .then(([t, u]) => { setTasks(t); setUsers(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasDevs = users.length > 0;

  const handleAssign = async (id: string) => {
    const updated = await api.tasks.assign(id);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    const updated = await api.tasks.updateStatus(id, status);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)]">
            Task <span className="gradient-text">Kanban</span>
          </h1>
          <p className="text-slate-400 mt-1">{tasks.length} tasks total.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className={`glass rounded-2xl p-4 border ${col.color}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <p className="text-sm font-semibold text-slate-300">{col.label}</p>
                  <span className="ml-auto text-xs text-slate-500 bg-white/5 rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <AnimatePresence>
                  <div className="space-y-3">
                    {colTasks.map(t => (
                      <TaskCard key={t.id} task={t} onAssign={handleAssign} onStatusChange={handleStatusChange} hasDevs={hasDevs} />
                    ))}
                    {colTasks.length === 0 && (
                      <p className="text-xs text-slate-600 text-center py-8">No tasks</p>
                    )}
                  </div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddTaskModal onClose={() => setShowModal(false)} onAdd={t => setTasks(prev => [...prev, t])} />
      )}
    </div>
  );
}

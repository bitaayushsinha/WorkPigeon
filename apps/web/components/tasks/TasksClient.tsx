"use client";
import { useEffect, useState } from "react";

import { api, Task, User } from "@/lib/api";
import { Plus, X, Loader2, Zap, UserX } from "lucide-react";

const COLS: Array<{ key: Task["status"]; label: string; color: string; dot: string }> = [
  { key: "unassigned", label: "Unassigned", color: "border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-[#0a0a0a]", dot: "bg-gray-400 dark:bg-zinc-500" },
  { key: "in_progress", label: "In Progress", color: "border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20", dot: "bg-blue-500" },
  { key: "review", label: "Review", color: "border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20", dot: "bg-amber-500" },
  { key: "done", label: "Done", color: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20", dot: "bg-emerald-500" },
];

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400",
  medium: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  high: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="office-panel p-4 w-full max-w-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">New Task</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" /></button>
        </div>
        <div className="space-y-2">
          <input className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
            placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea rows={3} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white resize-none"
            placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
              value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as "low" | "medium" | "high" | "critical" })}>
              {["low","medium","high","critical"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" min={0.5} step={0.5} className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Hours" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Required Skills</p>
            {skills.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
                  placeholder="Skill name" value={s.name} onChange={e => { const n = [...skills]; n[i].name = e.target.value; setSkills(n); }} />
                <input type="number" min={0} max={100} className="w-20 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
                  value={s.min_proficiency} onChange={e => { const n = [...skills]; n[i].min_proficiency = Number(e.target.value); setSkills(n); }} />
              </div>
            ))}
            <button onClick={() => setSkills([...skills, { name: "", min_proficiency: 60 }])}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Add skill</button>
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-semibold py-2 text-sm rounded-sm transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4" /> : "Create Task"}
          </button>
        </div>
      </div>
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
    <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-zinc-800 rounded-sm p-2 hover:border-black dark:hover:border-zinc-500 shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{task.title}</p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm shrink-0 ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">{task.description}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {task.required_skills.map(s => (
          <span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
            {s.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{task.estimated_hours}h</span>
        {task.allocation_score && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">* {task.allocation_score.toFixed(0)}</span>
        )}
      </div>
      {task.status === "unassigned" && (
        hasDevs ? (
          <button onClick={handleAssign} disabled={assigning}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 rounded-sm py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
            {assigning ? <Loader2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            Auto Assign
          </button>
        ) : (
          <p className="text-[10px] text-zinc-500 text-center mt-1">Need devs!</p>
        )
      )}
    </div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
            Task Kanban
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{tasks.length} tasks total.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold px-3 py-1.5 rounded-sm transition-all text-xs">
          <Plus className="w-3 h-3" /> New Task
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="office-panel h-64 bg-gray-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 items-start">
          {COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className={`border rounded-sm p-2 ${col.color}`}>
                <div className="flex items-center gap-1 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{col.label}</p>
                  <span className="ml-auto text-[10px] text-zinc-500 dark:text-zinc-400 bg-gray-200 dark:bg-zinc-800 rounded-sm px-1.5 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(t => (
                    <TaskCard key={t.id} task={t} onAssign={handleAssign} onStatusChange={handleStatusChange} hasDevs={hasDevs} />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center py-4">No tasks</p>
                  )}
                </div>
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

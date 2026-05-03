"use client";
import { useEffect, useState } from "react";

import { api, User, Task } from "@/lib/api";
import {
  Plus, X, Loader2, ChevronDown, ChevronUp,
  ListTodo, Clock, Flag, Trash2, AlertTriangle,
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[level]}`} />
      {level}
    </span>
  );
}

const STATUS_BADGE: Record<string, string> = {
  unassigned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-rose-400",
  high: "bg-amber-400",
  medium: "bg-blue-400",
  low: "bg-slate-500",
};

function MiniTaskRow({ task }: { task: Task }) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const overdue = deadline && deadline < new Date() && task.status !== "done";
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
      {/* priority dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? "bg-gray-500"}`} />
      {/* title */}
      <p className="flex-1 text-xs text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
      {/* hours */}
      <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
        <Clock className="w-2.5 h-2.5" />
        {task.estimated_hours}h
      </div>
      {/* deadline */}
      {deadline && (
        <div className={`flex items-center gap-1 text-[10px] shrink-0 ${overdue ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
          <Flag className="w-2.5 h-2.5" />
          {deadline.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </div>
      )}
      {/* status */}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border capitalize shrink-0 ${STATUS_BADGE[task.status] ?? ""}`}>
        {task.status.replace("_", " ")}
      </span>
    </div>
  );
}

function DeleteModal({
  user, onClose, onDeleted,
}: { user: User; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setLoading(true); setError("");
    try {
      await api.users.delete(user.id, true); // reassign=true unassigns their tasks
      onDeleted(user.id);
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="office-panel p-4 w-full max-w-md border-red-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">Delete Developer</h2>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">
          Are you sure you want to remove <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{user.name}</span>?
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6">Their assigned tasks will be unassigned. This cannot be undone.</p>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-sm border border-gray-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm transition-all">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 py-2.5 rounded-sm bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function DevCard({ u, devTasks, index, onDeleted }: { u: User; devTasks: Task[]; index: number; onDeleted: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const activeTasks = devTasks.filter(t => t.status !== "done");
  const doneTasks = devTasks.filter(t => t.status === "done");

  return (
    <div className="office-panel p-3 flex flex-col">
      {/* Header: avatar + workload ring */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold shadow-sm">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{u.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WorkloadBadge value={u.current_workload} />
          <button
            onClick={() => setShowDelete(true)}
            className="w-8 h-8 rounded-sm flex items-center justify-center bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900 transition-all group"
            title="Delete developer"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
      {showDelete && (
        <DeleteModal user={u} onClose={() => setShowDelete(false)} onDeleted={onDeleted} />
      )}

      {/* Skills */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-1.5">
          {u.skills.slice(0, 4).map(s => (
            <span key={s.name} className="px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] border border-gray-200 dark:border-zinc-700">
              {s.name} · {s.proficiency}
            </span>
          ))}
          {u.skills.length > 4 && (
            <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-500 text-xs">+{u.skills.length - 4}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm py-2">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{u.commits_today}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">commits</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm py-2">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{u.ai_efficiency_score.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">AI score</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm py-2">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{u.performance_history.length}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">tasks done</p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-4 w-full flex items-center justify-between px-3 py-2.5 rounded-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all group"
      >
        <div className="flex items-center gap-2">
          <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-slate-300 font-medium">Assigned Tasks</span>
          {/* count badges */}
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {activeTasks.length} active
          </span>
          {doneTasks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {doneTasks.length} done
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
        }
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
              {devTasks.length === 0 ? (
                <p className="text-[11px] text-slate-600 py-2 px-3">No tasks assigned yet.</p>
              ) : (
                <>
                  {activeTasks.map(t => <MiniTaskRow key={t.id} task={t} />)}
                  {activeTasks.length > 0 && doneTasks.length > 0 && (
                    <div className="flex items-center gap-2 py-0.5">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">completed</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                    </div>
                  )}
                  {doneTasks.map(t => <MiniTaskRow key={t.id} task={t} />)}
                </>
              )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={`/developers/${u.id}`}
          className="block text-center text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors py-1.5 border border-gray-200 dark:border-zinc-800 rounded-sm hover:bg-gray-50 dark:hover:bg-zinc-900">
          View Profile &rarr;
        </Link>
        <Link href={`/dev/${u.id}`}
          className="block text-center text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1.5 border border-gray-200 dark:border-zinc-800 rounded-sm hover:bg-gray-50 dark:hover:bg-zinc-900">
          My Dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: User) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("workpigeon123");
  const [role, setRole] = useState<"developer" | "admin">("developer");
  const [skills, setSkills] = useState([{ name: "", proficiency: 70 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name || !email) return;
    setLoading(true); setError("");
    try {
      const user = await api.users.create({ name, email, password, role, skills } as any);
      onAdd(user); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="office-panel p-4 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">Add Developer</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" /></button>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
            placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
            placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <select value={role} onChange={e => setRole(e.target.value as "developer" | "admin")}
              className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white">
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Skills</p>
            {skills.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
                  placeholder="Skill name" value={s.name} onChange={e => { const n = [...skills]; n[i].name = e.target.value; setSkills(n); }} />
                <input type="number" min={0} max={100} className="w-20 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white"
                  value={s.proficiency} onChange={e => { const n = [...skills]; n[i].proficiency = Number(e.target.value); setSkills(n); }} />
              </div>
            ))}
            <button onClick={() => setSkills([...skills, { name: "", proficiency: 70 }])}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Add skill</button>
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold py-2 text-sm rounded-sm transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4" /> : "Register Developer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DevelopersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([api.users.list(), api.tasks.list()])
      .then(([u, t]) => { setUsers(u); setTasks(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group tasks by assigned_to
  const tasksByDev = (userId: string) => tasks.filter(t => t.assigned_to === userId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
            Developers
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{users.length} team member{users.length !== 1 ? "s" : ""} registered.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold px-3 py-1.5 rounded-sm transition-all text-xs">
          <Plus className="w-3 h-3" /> Add Developer
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="office-panel h-64 bg-gray-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="office-panel p-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">No developers yet. Add your first team member!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {users.map((u, i) => (
            <DevCard
              key={u.id}
              u={u}
              devTasks={tasksByDev(u.id)}
              index={i}
              onDeleted={id => setUsers(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddUserModal onClose={() => setShowModal(false)} onAdd={u => setUsers(prev => [...prev, u])} />
      )}
    </div>
  );
}

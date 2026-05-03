"use client";
import { useEffect, useRef, useState } from "react";

import { api, User, Task, ChatMessage } from "@/lib/api";
import {
  Send, Loader2, Brain, CheckCircle, Clock, GitCommit,
  Zap, ChevronDown, ChevronUp, Sparkles, Bot, User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const MODELS = [
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B (Free)" },
  { id: "openai/gpt-oss-120b:free",       label: "GPT OSS 120B (Free)" },
  { id: "minimax/minimax-m2.5:free",      label: "MiniMax M2.5 (Free)" },
];

const STATUS_LABEL: Record<string, { label: string; color: string; next: Task["status"] | null }> = {
  unassigned: { label: "Unassigned", color: "text-zinc-500 dark:text-zinc-400",  next: "in_progress" },
  in_progress: { label: "In Progress", color: "text-blue-600 dark:text-blue-400", next: "review" },
  review:      { label: "In Review",  color: "text-amber-600 dark:text-amber-400",  next: "done" },
  done:        { label: "Done",       color: "text-emerald-600 dark:text-emerald-400", next: null },
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-zinc-400 dark:bg-zinc-500", medium: "bg-blue-500", high: "bg-amber-500", critical: "bg-red-500",
};

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, onChatAbout }: {
  task: Task;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onChatAbout: (task: Task) => void;
}) {
  const meta = STATUS_LABEL[task.status];
  const next = meta.next;
  const [updating, setUpdating] = useState(false);

  const advance = async () => {
    if (!next) return;
    setUpdating(true);
    try { await onStatusChange(task.id, next); }
    finally { setUpdating(false); }
  };

  return (
    <div
      className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm p-3 hover:border-gray-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug truncate">{task.title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{task.description}</p>
        </div>
        <span className={`text-xs shrink-0 font-medium ${meta.color}`}>{meta.label}</span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{task.estimated_hours}h</span>
        <div className="flex-1" />

        <button onClick={() => onChatAbout(task)}
          className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-sm px-2 py-1 transition-all">
          <Sparkles className="w-3 h-3" /> Ask AI
        </button>

        {next && (
          <button onClick={advance} disabled={updating}
            className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-sm px-2 py-1 transition-all">
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
            {next.replace("_", " ")}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: ChatMessage & { pending?: boolean } }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${isUser ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-zinc-700"}`}>
        {isUser ? <UserIcon className="w-3.5 h-3.5 text-white dark:text-black" /> : <Bot className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />}
      </div>
      <div className={`max-w-[78%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-black dark:bg-white text-white dark:text-black"
          : "bg-gray-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
      }`}>
        {msg.pending
          ? <span className="flex gap-1 items-center py-0.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          : <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
        }
        {!msg.pending && msg.latency_ms && (
          <p className={`text-[10px] mt-1.5 ${isUser ? "text-zinc-300 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}>
            {msg.model} · {msg.latency_ms}ms · {msg.tokens} tokens
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DevDashboardClient({ id }: { id: string }) {
  const [user, setUser]   = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<(ChatMessage & { pending?: boolean })[]>([
    { role: "assistant", content: "Hi! I'm your WorkPigeon AI assistant. Ask me anything about your tasks, coding, or architecture!" },
  ]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [model, setModel]       = useState(MODELS[0].id);
  const [phase, setPhase]       = useState<"planning"|"coding"|"review"|"debug">("coding");
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.users.get(id), api.tasks.list()])
      .then(([u, allTasks]) => {
        setUser(u);
        setTasks(allTasks.filter(t => t.assigned_to === id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    const updated = await api.tasks.updateStatus(taskId, status);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  };

  const handleChatAbout = (task: Task) => {
    setActiveTaskId(task.id);
    setInput(`I'm working on: "${task.title}". ${task.description} How should I approach this?`);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !user) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const pendingMsg = { role: "assistant" as const, content: "", pending: true };
    setMessages(prev => [...prev, userMsg, pendingMsg]);
    setInput("");
    setSending(true);

    const history = [...messages.filter(m => !m.pending), userMsg].map(m => ({
      role: m.role, content: m.content,
    }));

    try {
      const resp = await api.chat.send({
        user_id: id,
        messages: history,
        model,
        phase,
        task_id: activeTaskId,
      });
      setMessages(prev => [
        ...prev.filter(m => !m.pending),
        {
          role: "assistant",
          content: resp.reply,
          latency_ms: resp.latency_ms,
          tokens: resp.response_tokens,
          model: resp.model,
        },
      ]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev.filter(m => !m.pending),
        { role: "assistant", content: `[ERROR]: ${e.message}` },
      ]);
    } finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="office-panel p-12 text-center">
        <p className="text-red-500">Developer not found. Check the URL.</p>
      </div>
    );
  }

  const myTasks    = tasks.filter(t => t.status !== "done");
  const doneTasks  = tasks.filter(t => t.status === "done");

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-black dark:bg-white flex items-center justify-center text-xl font-bold text-white dark:text-black">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
              Hey, {user.name.split(" ")[0]}
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{user.email}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4">
          {[
            { icon: CheckCircle, label: "Active", value: myTasks.length, color: "text-blue-600 dark:text-blue-400" },
            { icon: Brain, label: "AI Score", value: `${user.ai_efficiency_score.toFixed(0)}`, color: "text-purple-600 dark:text-purple-400" },
            { icon: GitCommit, label: "Commits", value: user.commits_today, color: "text-emerald-600 dark:text-emerald-400" },
          ].map(s => (
            <div key={s.label} className="office-panel px-3 py-2 text-center">
              <p className={`text-base font-bold font-[family-name:var(--font-outfit)] ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 min-h-0">

        {/* ── Left: Tasks ── */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="shrink-0">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 font-[family-name:var(--font-outfit)]">
              My Tasks ({myTasks.length})
            </h2>
            {myTasks.length === 0 ? (
              <div className="office-panel p-4 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">No active tasks.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myTasks.map(t => (
                  <TaskCard key={t.id} task={t}
                    onStatusChange={handleStatusChange}
                    onChatAbout={handleChatAbout} />
                ))}
              </div>
            )}
          </div>

          {doneTasks.length > 0 && (
            <div className="shrink-0">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Completed ({doneTasks.length})</p>
              <div className="space-y-2">
                {doneTasks.map(t => (
                  <div key={t.id} className="px-3 py-2 rounded-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-500 shrink-0" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{t.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: AI Chat ── */}
        <div className="office-panel flex flex-col min-h-0 overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-sm bg-black dark:bg-white flex items-center justify-center">
              <Bot className="w-4 h-4 text-white dark:text-black" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">WorkPigeon AI</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">All chats auto-logged • AI efficiency tracked</p>
            </div>
            {/* Model selector */}
            <select
              value={model} onChange={e => setModel(e.target.value)}
              className="text-[10px] bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white">
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {/* Phase selector */}
            <select
              value={phase} onChange={e => setPhase(e.target.value as typeof phase)}
              className="text-[10px] bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-black dark:focus:border-white">
              {["planning","coding","review","debug"].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-zinc-800 shrink-0">
            {activeTaskId && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/50 rounded-sm px-2 py-0.5">
                  Asking about task
                </span>
                <button onClick={() => setActiveTaskId(undefined)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">✕ clear</button>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <textarea
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask anything… (Shift+Enter for newline)"
                className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white resize-none"
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()}
                className="flex items-center justify-center w-11 h-11 bg-black dark:bg-white disabled:opacity-40 rounded-sm transition-all shrink-0">
                {sending ? <Loader2 className="w-4 h-4 text-white dark:text-black animate-spin" /> : <Send className="w-4 h-4 text-white dark:text-black" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

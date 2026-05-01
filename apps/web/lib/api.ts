// lib/api.ts — Typed API client for the WorkPigeon FastAPI backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "API error");
  }
  // 204 No Content (e.g. DELETE) has no body — skip JSON parsing
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Skill {
  name: string;
  proficiency: number;
}

export interface PerformanceRecord {
  task_id: string;
  completion_time_hrs: number;
  quality_score: number;
  on_time: boolean;
  completed_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
  current_workload: number;
  ai_efficiency_score: number;
  commits_today: number;
  performance_history: PerformanceRecord[];
  created_at: string;
}

export interface RequiredSkill {
  name: string;
  min_proficiency: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  required_skills: RequiredSkill[];
  priority: "low" | "medium" | "high" | "critical";
  estimated_hours: number;
  status: "unassigned" | "in_progress" | "review" | "done";
  assigned_to: string | null;
  allocation_score: number | null;
  score_breakdown: Record<string, unknown> | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface AILog {
  id: string;
  user_id: string;
  task_id: string | null;
  phase: "planning" | "coding" | "review" | "debug";
  prompt: string;
  response: string;
  model: string;
  prompt_tokens: number;
  response_tokens: number;
  latency_ms: number;
  user_rating: number | null;
  timestamp: string;
}

export interface AILogAnalytics {
  total_logs: number;
  total_prompt_tokens: number;
  total_response_tokens: number;
  avg_latency_ms: number;
  avg_user_rating: number | null;
  logs_by_phase: Record<string, number>;
}

export interface ScoreBreakdown {
  user_id: string;
  user_name: string;
  email: string;
  workload_score: number;
  past_performance_score: number;
  skill_compatibility_score: number;
  ai_efficiency_score: number;
  total_score: number;
}

export interface RebalanceResult {
  assignments: Array<{
    task_id: string;
    task_title: string;
    assigned_to_id: string;
    assigned_to_name: string;
    score_breakdown: ScoreBreakdown;
  }>;
  total_tasks_processed: number;
}

// ─── Chat types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  tokens?: number;
  latency_ms?: number;
  model?: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  prompt_tokens: number;
  response_tokens: number;
  latency_ms: number;
  log_id: string;
}

export const api = {
  users: {
    list: () => request<User[]>("/api/users"),
    get: (id: string) => request<User>(`/api/users/${id}`),
    create: (body: Partial<User>) =>
      request<User>("/api/users", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<User>) =>
      request<User>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string, reassign = false) =>
      request<void>(`/api/users/${id}?reassign=${reassign}`, { method: "DELETE" }),
  },

  tasks: {
    list: (status?: string) =>
      request<Task[]>(`/api/tasks${status ? `?status=${status}` : ""}`),
    listByAssignee: (userId: string) =>
      request<Task[]>(`/api/tasks?assigned_to=${userId}`),
    get: (id: string) => request<Task>(`/api/tasks/${id}`),
    create: (body: Partial<Task>) =>
      request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
    updateStatus: (id: string, status: Task["status"]) =>
      request<Task>(`/api/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    assign: (id: string) =>
      request<Task>(`/api/tasks/${id}/assign`, { method: "POST" }),
    delete: (id: string) =>
      request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  },

  aiLogs: {
    list: (userId: string, skip = 0, limit = 20) =>
      request<AILog[]>(`/api/ai-logs/${userId}?skip=${skip}&limit=${limit}`),
    byTask: (taskId: string) => request<AILog[]>(`/api/ai-logs/task/${taskId}`),
    analytics: (userId?: string) =>
      request<AILogAnalytics>(
        `/api/ai-logs/analytics/summary${userId ? `?user_id=${userId}` : ""}`
      ),
    create: (body: Partial<AILog>) =>
      request<AILog>("/api/ai-logs", { method: "POST", body: JSON.stringify(body) }),
  },

  activity: {
    summary: (userId: string) => request<Record<string, unknown>>(`/api/activity/${userId}/summary`),
    sessionStart: (userId: string) =>
      request<Record<string, unknown>>("/api/activity/session/start", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    sessionEnd: (userId: string) =>
      request<Record<string, unknown>>("/api/activity/session/end", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    logCommit: (userId: string, sha: string, message: string, repo?: string) =>
      request<Record<string, unknown>>("/api/activity/commit", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, sha, message, repo }),
      }),
  },

  engine: {
    health: () => request<{ status: string }>("/engine/health"),
    bestMatch: (taskId: string) =>
      request<{ task_id: string; task_title: string; rankings: ScoreBreakdown[] }>(
        `/engine/best-match/${taskId}`,
        { method: "POST" }
      ),
    rebalance: () =>
      request<RebalanceResult>("/engine/rebalance", { method: "POST" }),
    score: (userId: string, taskId: string) =>
      request<ScoreBreakdown>("/engine/score", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, task_id: taskId }),
      }),
  },

  chat: {
    send: (body: {
      user_id: string;
      messages: ChatMessage[];
      model?: string;
      task_id?: string;
      phase?: string;
    }) =>
      request<ChatResponse>("/api/chat/", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    history: (userId: string) =>
      request<ChatMessage[]>(`/api/chat/history/${userId}`),
  },
};


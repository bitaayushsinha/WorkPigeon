"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "developer";
  current_workload: number;
  ai_efficiency_score: number;
  commits_today: number;
  skills: { name: string; proficiency: number }[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null, token: null, loading: true,
  login: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("wp_token");
    if (!stored) { setLoading(false); return; }
    fetchMe(stored)
      .then(u => { setToken(stored); setUser(u); })
      .catch(() => localStorage.removeItem("wp_token"))
      .finally(() => setLoading(false));
  }, []);

  const fetchMe = async (tok: string): Promise<AuthUser> => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (!res.ok) throw new Error("Session expired");
    return res.json();
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail);
    }
    const data = await res.json();
    const me = await fetchMe(data.access_token);
    localStorage.setItem("wp_token", data.access_token);
    setToken(data.access_token);
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem("wp_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

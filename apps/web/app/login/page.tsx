"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { Loader2, Bird, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Flush any stale token on login page load
  useEffect(() => {
    localStorage.removeItem("wp_token");
  }, []);

  // Already logged in → redirect
  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "admin" ? "/" : "/workspace");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await login(email, password);
      // redirect handled by the useEffect above
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 text-black dark:text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background decoration removed for professional look */}

      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-sm bg-black dark:bg-white flex items-center justify-center shadow-sm mb-4">
            <Bird className="w-7 h-7 text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-outfit)]">
            WorkPigeon
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">AI-Powered Engineering Workflow</p>
        </div>

        {/* Card */}
        <div className="office-panel p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 font-[family-name:var(--font-outfit)]">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@workpigeon.dev"
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 font-semibold py-3 rounded-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-sm">
            <p className="text-xs text-zinc-500 text-center mb-2">Default credentials</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-400">Admin</p>
                <p className="text-xs text-zinc-900 dark:text-zinc-100 font-mono">admin123</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-400">Developers</p>
                <p className="text-xs text-zinc-900 dark:text-zinc-100 font-mono">workpigeon123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

// Pages that don't require auth
const PUBLIC_PATHS = ["/login"];

// Pages developers are allowed to see
const DEV_PATHS = ["/workspace", "/login"];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    if (user) {
      // Dev trying to access admin pages → send to workspace
      if (user.role === "developer" && !DEV_PATHS.some(p => pathname.startsWith(p))) {
        router.replace("/workspace");
        return;
      }
      // Logged-in user on login page → redirect home
      if (isLoginPage) {
        router.replace(user.role === "admin" ? "/" : "/workspace");
      }
    }
  }, [user, loading, pathname, isPublic, isLoginPage, router]);

  // Loading spinner (auth check)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080814]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Login page or unauthenticated — no shell
  if (isLoginPage || !user) {
    return <>{children}</>;
  }

  const isAdmin = user.role === "admin";

  // Developer workspace — minimal sidebar
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen">
        <DevSidebar />
        <main className="flex-1 ml-56 p-8 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Admin — full management sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}

// Minimal developer sidebar
function DevSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-white/[0.06] bg-[#0d0d18] z-50">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
          {user?.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate font-[family-name:var(--font-outfit)]">{user?.name.split(" ")[0]}</p>
          <p className="text-[10px] text-slate-500">Developer</p>
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <a href="/workspace"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-300 bg-indigo-500/20 border border-indigo-500/30">
          🤖 My Workspace
        </a>
      </div>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button onClick={() => { logout(); router.push("/login"); }}
          className="w-full text-xs text-slate-500 hover:text-rose-400 transition-colors py-2 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20">
          Sign Out
        </button>
      </div>
    </aside>
  );
}

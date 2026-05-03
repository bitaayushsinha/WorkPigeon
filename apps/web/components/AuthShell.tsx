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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 text-black dark:text-white animate-spin" />
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
        <main className="flex-1 ml-56 p-4 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Admin — full management sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-4 overflow-y-auto min-h-screen">
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
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black z-50">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-sm bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-sm font-bold text-white dark:text-black">
          {user?.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate font-[family-name:var(--font-outfit)]">{user?.name.split(" ")[0]}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Developer</p>
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <a href="/workspace"
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700">
          My Workspace
        </a>
      </div>

      <div className="px-3 py-4 border-t border-gray-200 dark:border-zinc-800">
        <button onClick={() => { logout(); router.push("/login"); }}
          className="w-full text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-2 rounded-sm hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/50">
          Sign Out
        </button>
      </div>
    </aside>
  );
}

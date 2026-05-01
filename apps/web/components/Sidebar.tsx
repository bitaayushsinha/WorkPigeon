"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, Brain, Zap, Bird, LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/developers", label: "Developers", icon: Users },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/ai-logs",    label: "AI Logs",    icon: Brain },
  { href: "/allocation", label: "Allocation", icon: Zap },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-white/[0.06] bg-[#0d0d18] z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Bird className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-lg leading-none font-[family-name:var(--font-outfit)]">WorkPigeon</p>
          <p className="text-xs text-slate-500 mt-0.5">AI Workflow System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href} href={href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
            >
              <Icon className={clsx("w-4 h-4", active ? "text-indigo-400" : "text-slate-500")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — user + logout */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-3">
        {user && (
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-indigo-400">Admin</p>
            </div>
          </div>
        )}
        <div className="glass rounded-xl px-4 py-2.5 flex items-center justify-between">
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Swagger UI →
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors">
            <LogOut className="w-3 h-3" /> Out
          </button>
        </div>
      </div>
    </aside>
  );
}


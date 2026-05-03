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
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-sm bg-black dark:bg-white flex items-center justify-center shadow-sm">
          <Bird className="w-4 h-4 text-white dark:text-black" />
        </div>
        <div>
          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-none font-[family-name:var(--font-outfit)]">WorkPigeon</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">AI Workflow System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href} href={href}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium transition-all duration-200",
                active
                  ? "bg-gray-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-gray-300 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-900"
              )}
            >
              <Icon className={clsx("w-3.5 h-3.5", active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — user + logout */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
        {user && (
          <div className="office-panel px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-white dark:text-black shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Admin</p>
            </div>
          </div>
        )}
        <div className="office-panel px-3 py-2 flex items-center justify-between">
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline transition-colors">
            Swagger UI -&gt;
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <LogOut className="w-3 h-3" /> Out
          </button>
        </div>
      </div>
    </aside>
  );
}


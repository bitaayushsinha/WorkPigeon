import { Suspense } from "react";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata = {
  title: "Dashboard | WorkPigeon",
  description: "Overview of team health, task progress, and AI usage.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 animate-pulse">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}

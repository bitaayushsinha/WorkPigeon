import DevDashboardClient from "@/components/dev/DevDashboardClient";

export const metadata = {
  title: "My Dashboard | WorkPigeon",
  description: "Developer personal workspace with AI assistant and assigned tasks.",
};

export default async function DevDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DevDashboardClient id={id} />;
}

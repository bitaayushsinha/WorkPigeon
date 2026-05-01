import TaskDetailClient from "@/components/tasks/TaskDetailClient";

export const metadata = {
  title: "Task Detail | WorkPigeon",
  description: "View task detail with allocation score breakdown.",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetailClient id={id} />;
}

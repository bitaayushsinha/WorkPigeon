export const metadata = {
  title: "Tasks | WorkPigeon",
  description: "Kanban board for all engineering tasks.",
};

import TasksClient from "@/components/tasks/TasksClient";

export default function TasksPage() {
  return <TasksClient />;
}

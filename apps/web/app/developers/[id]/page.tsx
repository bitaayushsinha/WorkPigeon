import DeveloperProfileClient from "@/components/developers/DeveloperProfileClient";

export const metadata = {
  title: "Developer Profile | WorkPigeon",
  description: "View developer performance, skills, session history and AI usage.",
};

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeveloperProfileClient id={id} />;
}

export const metadata = {
  title: "AI Logs | WorkPigeon",
  description: "Explorer for all AI prompt/response interactions.",
};

import AILogsClient from "@/components/ai-logs/AILogsClient";

export default function AILogsPage() {
  return <AILogsClient />;
}

import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "WorkPigeon — AI Workflow System",
  description:
    "AI-powered engineering workflow platform with dynamic task allocation, developer tracking, and AI interaction logging.",
  keywords: ["workflow", "AI", "task allocation", "developer productivity"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="bg-[#0f0f1a] text-slate-200 min-h-screen">
        <AuthProvider>
          <AuthShell>{children}</AuthShell>
        </AuthProvider>
      </body>
    </html>
  );
}


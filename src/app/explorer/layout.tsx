"use client";
import type { Metadata } from "next";
import { ProgressNotificationProvider } from "@/contexts/ProgressNotificationContext";

/** Explorer has its own full-screen layout — no Learner top nav. */
export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProgressNotificationProvider>
      <div className="min-h-screen" style={{ background: "#0a0520", color: "#e8e4ff" }}>
        {children}
      </div>
    </ProgressNotificationProvider>
  );
}

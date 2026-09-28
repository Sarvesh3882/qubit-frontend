"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import TopNav from "./TopNav";
import AgentRoot from "@/components/agent/AgentRoot";
import TourRoot from "@/components/onboarding/TourRoot";
import AssessmentGate from "@/components/codebook/AssessmentGate";
import { useLearnerSync } from "@/hooks/useLearnerSync";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";
import { Toaster } from "react-hot-toast";

const TOAST_DARK = { style: { borderRadius: "6px", background: "#161b22", color: "#e6edf3", fontSize: "0.8rem" } };
const TOAST_LEARNER = { style: { borderRadius: "8px", background: "#1e293b", color: "#f8fafc", fontSize: "0.8125rem" } };

/**
 * LearnerShell — rendered only for Learner routes.
 * All Learner-specific hooks live here so they are never called conditionally.
 */
function LearnerShell({
  children,
  showAssessmentGate,
}: {
  children: React.ReactNode;
  showAssessmentGate: boolean;
}) {
  // Hooks always called — no early returns above this component
  useLearnerSync();
  const { fetchMeta } = useCurriculumMetaStore();
  useEffect(() => { fetchMeta(); }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav />
      {showAssessmentGate && <AssessmentGate />}
      <main className="flex-1">{children}</main>
      <AgentRoot />
      <TourRoot />
      <Toaster position="bottom-right" toastOptions={TOAST_LEARNER} />
    </div>
  );
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isExplorer   = pathname.startsWith("/explorer");
  const isResearcher = pathname.startsWith("/research");
  const isAuth       = pathname.startsWith("/auth");
  const isSelect     = pathname === "/select";
  const isLanding    = pathname === "/";
  const isAssessment = pathname.startsWith("/assessment");

  // Explorer and Researcher have their own full-screen layout
  if (isExplorer || isResearcher) {
    return (
      <>
        {children}
        <Toaster position="bottom-right" toastOptions={TOAST_DARK} />
      </>
    );
  }

  // Landing, select and auth — no nav
  if (isLanding || isSelect || isAuth) {
    return (
      <>
        {children}
        <Toaster position="bottom-right" toastOptions={TOAST_LEARNER} />
      </>
    );
  }

  const showAssessmentGate =
    !isAssessment &&
    !pathname.startsWith("/classroom") &&
    (pathname.startsWith("/codebook") || pathname === "/learning-path" || pathname === "/profile");

  return (
    <LearnerShell showAssessmentGate={showAssessmentGate}>
      {children}
    </LearnerShell>
  );
}

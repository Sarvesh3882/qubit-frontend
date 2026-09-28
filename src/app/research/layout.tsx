import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QUBIT Research — Advanced Quantum Workspace",
  description: "Research workspace for advanced quantum computing experimentation",
};

/** Researcher experience owns its layout — no Learner top nav */
export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex">
      {children}
    </div>
  );
}

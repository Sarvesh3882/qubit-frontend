"use client";
import ResearchPage from "@/components/researcher/ResearchPage";
import { useComposerStore } from "@/store/composerStore";
import dynamic from "next/dynamic";
import { BarChart2 } from "lucide-react";

const ComposerResults = dynamic(() => import("@/components/composer/ComposerResults"), { ssr: false });

export default function ResearchAnalysis() {
  const { result } = useComposerStore();
  return (
    <ResearchPage title="Analysis" subtitle="Result visualization and state analysis">
      {result?.success ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 text-xs font-mono text-[#7d8590]">
            <span>Qubits: <strong className="text-[#e6edf3]">{result.num_qubits}</strong></span>
            <span>Shots: <strong className="text-[#e6edf3]">{result.shots.toLocaleString()}</strong></span>
            <span>States: <strong className="text-[#e6edf3]">{Object.keys(result.probabilities).filter(k => result.probabilities[k] > 0.001).length}</strong></span>
            <span>Max prob: <strong className="text-[#e6edf3]">{(Math.max(...Object.values(result.probabilities)) * 100).toFixed(1)}%</strong></span>
          </div>
          <div className="h-[420px] border border-[#21262d] rounded-lg overflow-hidden">
            <ComposerResults />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <BarChart2 size={28} className="text-[#30363d]" />
          <p className="text-sm text-[#484f58]">No results to analyze</p>
          <p className="text-xs text-[#30363d]">Run a simulation from the Workbench to see analysis here</p>
          <a href="/research" className="text-xs text-[#58a6ff] hover:underline mt-1">
            → Open Workbench
          </a>
        </div>
      )}
    </ResearchPage>
  );
}

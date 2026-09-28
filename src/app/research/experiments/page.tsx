"use client";
import ResearchPage from "@/components/researcher/ResearchPage";
import { FlaskConical, Plus } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ResearchExperiments() {
  return (
    <ResearchPage title="Experiments" subtitle="Manage named experiment runs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold text-[#e6edf3]">All Experiments</p>
          <p className="text-xs text-[#484f58] mt-0.5">Create named experiments to track circuit variants and compare results</p>
        </div>
        <Button size="sm" className="bg-[#238636] text-white border-0 hover:bg-[#2ea043] gap-1.5">
          <Plus size={12} /> New Experiment
        </Button>
      </div>

      <div className="rounded-lg border border-[#21262d] overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#21262d] bg-[#161b22]">
          {["Name","Circuit","Qubits","Shots","Last run","Status"].map(h=>(
            <span key={h} className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider flex-1">{h}</span>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <FlaskConical size={28} className="text-[#30363d]" />
          <p className="text-sm text-[#484f58]">No experiments yet</p>
          <p className="text-xs text-[#30363d]">Create an experiment from the Workbench to compare circuit variants</p>
        </div>
      </div>
    </ResearchPage>
  );
}

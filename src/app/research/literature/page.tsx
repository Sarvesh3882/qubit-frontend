"use client";
import ResearchPage from "@/components/researcher/ResearchPage";
import { ExternalLink, BookOpen } from "lucide-react";

const PAPERS = [
  { title:"Quantum Computation and Quantum Information",        authors:"Nielsen & Chuang", year:"2000", url:"https://www.cambridge.org/9781107002173", tag:"Textbook" },
  { title:"A fast quantum mechanical algorithm for database search",authors:"Grover, L.K.", year:"1996", url:"https://arxiv.org/abs/quant-ph/9605043", tag:"Algorithm" },
  { title:"Polynomial-Time Algorithms for Prime Factorization",  authors:"Shor, P.W.",     year:"1997", url:"https://arxiv.org/abs/quant-ph/9508027", tag:"Algorithm" },
  { title:"A Variational Eigenvalue Solver on a Photonic Chip",  authors:"Peruzzo et al.", year:"2014", url:"https://arxiv.org/abs/1304.3061",         tag:"VQE" },
  { title:"Quantum Approximate Optimization Algorithm",           authors:"Farhi et al.",   year:"2014", url:"https://arxiv.org/abs/1411.4028",         tag:"QAOA" },
  { title:"QPanda3: High-Performance Quantum-Classical Framework",authors:"Origin Quantum", year:"2025", url:"https://arxiv.org/abs/2504.02455",         tag:"SDK" },
  { title:"Origin Pilot: A Quantum Operating System",            authors:"Origin Quantum", year:"2021", url:"https://arxiv.org/abs/2105.10730",         tag:"Infrastructure" },
  { title:"Quantum Error Correction for Beginners",              authors:"Devitt et al.",  year:"2013", url:"https://arxiv.org/abs/0905.2794",         tag:"Error Correction" },
  { title:"Variational Quantum Algorithms",                      authors:"Cerezo et al.",  year:"2021", url:"https://arxiv.org/abs/2012.09265",         tag:"VQA" },
  { title:"Quantum Machine Learning",                            authors:"Biamonte et al.","year":"2017", url:"https://arxiv.org/abs/1611.09347",       tag:"QML" },
];

const TAG_COLORS: Record<string, string> = {
  Textbook:"#7c3aed", Algorithm:"#0891b2", VQE:"#059669", QAOA:"#d97706",
  SDK:"#4f46e5", Infrastructure:"#2563eb", "Error Correction":"#dc2626", VQA:"#059669", QML:"#9333ea",
};

export default function ResearchLiterature() {
  return (
    <ResearchPage title="Literature" subtitle="Key papers and references">
      <div className="flex flex-col gap-0 rounded-lg border border-[#21262d] overflow-hidden max-w-3xl">
        {PAPERS.map((p, i) => (
          <a key={p.title} href={p.url} target="_blank" rel="noopener noreferrer"
            className={`group flex items-start gap-4 px-4 py-3 hover:bg-[#161b22] transition-colors ${i < PAPERS.length-1 ? "border-b border-[#21262d]" : ""}`}>
            <BookOpen size={13} className="text-[#484f58] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors leading-snug">
                {p.title}
              </p>
              <p className="text-[10px] text-[#484f58] mt-0.5">{p.authors} · {p.year}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background:`${TAG_COLORS[p.tag] ?? "#4f46e5"}15`, color:TAG_COLORS[p.tag] ?? "#4f46e5", border:`1px solid ${TAG_COLORS[p.tag] ?? "#4f46e5"}25` }}>
                {p.tag}
              </span>
              <ExternalLink size={11} className="text-[#30363d] group-hover:text-[#58a6ff] transition-colors" />
            </div>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-[#30363d] mt-4">Links open arXiv, Cambridge University Press, or publisher sites. Content paraphrased for compliance.</p>
    </ResearchPage>
  );
}

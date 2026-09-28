"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { algorithmsApi } from "@/lib/api";
import ResearchPage from "@/components/researcher/ResearchPage";
import { BarChart2, Play, ChevronRight, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import toast from "react-hot-toast";

interface AlgoMeta {
  id: string;
  title: string;
  category: string;
  description: string;
  complexity: { classical: string; quantum: string };
  parameters: { name: string; type: string; default: string | number; min?: number; max?: number; options?: string[]; label: string }[];
}

export default function ResearchAlgorithms() {
  const [algos,    setAlgos]   = useState<AlgoMeta[]>([]);
  const [selected, setSelected]= useState<AlgoMeta | null>(null);
  const [params,   setParams]  = useState<Record<string, string | number>>({});
  const [result,   setResult]  = useState<Record<string, unknown> | null>(null);
  const [running,  setRunning] = useState(false);

  const initParams = useCallback((a: AlgoMeta) => {
    const d: Record<string, string | number> = {};
    a.parameters.forEach(p => { d[p.name] = p.default; });
    setParams(d);
  }, []);

  useEffect(() => {
    algorithmsApi.list().then(r => {
      setAlgos(r.data);
      if (r.data[0]) { setSelected(r.data[0]); initParams(r.data[0]); }
    });
  }, [initParams]);

  const run = async () => {
    if (!selected) return;
    setRunning(true);
    try {
      const res = await algorithmsApi.run(selected.id, params);
      setResult(res.data);
    } catch { toast.error("Run failed"); }
    finally  { setRunning(false); }
  };

  const chartData = (() => {
    if (!result) return [];
    const probs = result.probabilities as Record<string, number> | undefined;
    if (!probs) return [];
    return Object.entries(probs)
      .filter(([,v]) => v > 0.001)
      .map(([s, p]) => ({ state: `|${s}⟩`, prob: Math.round(p * 100) }))
      .sort((a,b) => b.prob - a.prob)
      .slice(0, 24);
  })();

  const C = { bg:"#0d1117", surface:"#161b22", border:"#21262d", text:"#e6edf3", muted:"#7d8590" };

  return (
    <ResearchPage title="Algorithm Workbench" subtitle="Quantum algorithm experiments">
      <div className="flex gap-5 h-full">

        {/* Algorithm list */}
        <div className="w-52 shrink-0 flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Algorithms</p>
          {algos.map(a => (
            <button key={a.id} onClick={() => { setSelected(a); initParams(a); setResult(null); }}
              className="flex items-start gap-2.5 px-2.5 py-2.5 rounded-md text-left transition-colors"
              style={{
                background: selected?.id === a.id ? "#1f2937" : "transparent",
                color:      selected?.id === a.id ? "#e6edf3" : "#7d8590",
              }}
            >
              <Cpu size={12} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug">{a.title}</p>
                <p className="text-[10px] opacity-60 leading-tight mt-0.5 line-clamp-2">{a.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Config + results */}
        {selected && (
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Complexity */}
            <div className="flex gap-3">
              <div className="flex-1 px-3 py-2 rounded border text-xs" style={{ background: C.surface, borderColor: C.border }}>
                <p className="text-[10px] text-[#484f58] mb-0.5">Classical</p>
                <p className="font-mono font-bold text-[#7d8590]">{selected.complexity.classical}</p>
              </div>
              <div className="flex-1 px-3 py-2 rounded border text-xs" style={{ background: "#0d1f0d", borderColor: "#238636" }}>
                <p className="text-[10px] text-[#4ff7a4]/60 mb-0.5">Quantum</p>
                <p className="font-mono font-bold text-[#4ff7a4]">{selected.complexity.quantum}</p>
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-2 gap-3">
              {selected.parameters.map(p => (
                <div key={p.name}>
                  <label className="block text-[10px] text-[#484f58] mb-1">{p.label}</label>
                  {p.type === "select" ? (
                    <select value={params[p.name] as string} onChange={e => setParams(prev => ({...prev, [p.name]: e.target.value}))}
                      className="w-full h-7 px-2 rounded border text-xs text-[#e6edf3] bg-[#0d1117] focus:outline-none"
                      style={{ borderColor: C.border }}>
                      {p.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : p.type === "string" ? (
                    <input type="text" value={params[p.name] as string} onChange={e => setParams(prev => ({...prev, [p.name]: e.target.value}))}
                      className="w-full h-7 px-2 rounded border text-xs font-mono text-[#e6edf3] bg-[#0d1117] focus:outline-none"
                      style={{ borderColor: C.border }} />
                  ) : (
                    <input type="number" value={params[p.name] as number} min={p.min} max={p.max}
                      onChange={e => setParams(prev => ({...prev, [p.name]: parseInt(e.target.value)}))}
                      className="w-full h-7 px-2 rounded border text-xs font-mono text-[#e6edf3] bg-[#0d1117] focus:outline-none"
                      style={{ borderColor: C.border }} />
                  )}
                </div>
              ))}
            </div>

            <button onClick={run} disabled={running}
              className="flex items-center gap-1.5 px-4 h-8 rounded text-xs font-semibold text-white self-start transition-colors disabled:opacity-50"
              style={{ background: "#238636" }}>
              {running ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Running…</> : <><Play size={11} />Run</>}
            </button>

            {/* Results */}
            {result && chartData.length > 0 && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="rounded-lg border overflow-hidden flex-1" style={{ borderColor: C.border }}>
                <div className="px-3 py-2 border-b text-[11px] text-[#484f58]" style={{ borderColor: C.border }}>
                  Measurement probabilities
                </div>
                <div className="p-3 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top:4, right:4, left:-16, bottom:20 }}>
                      <CartesianGrid vertical={false} stroke="#21262d" />
                      <XAxis dataKey="state" tick={{ fill:"#484f58", fontSize:9 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill:"#484f58", fontSize:9 }} domain={[0,100]} unit="%" />
                      <Tooltip
                        contentStyle={{ background:"#161b22", border:"1px solid #30363d", borderRadius:4, fontSize:11 }}
                        formatter={(v: unknown) => [`${v}%`, "Prob"]}
                      />
                      <Bar dataKey="prob" radius={[2,2,0,0]}>
                        {chartData.map((_,i) => (
                          <Cell key={i} fill={i === 0 ? "#58a6ff" : "#1f4e79"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </ResearchPage>
  );
}

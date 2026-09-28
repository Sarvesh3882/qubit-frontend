"use client";
import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { composerApi } from "@/lib/api";
import { useComposerStore } from "@/store/composerStore";
import { generateCode } from "@/lib/codegens";
import ResearchSidebar from "@/components/researcher/ResearchSidebar";
import ComposerCircuit from "@/components/composer/ComposerCircuit";
import {
  Play, Plus, Minus, Trash2, Code2, BarChart2,
  Copy, ChevronDown,
} from "lucide-react";

const MonacoEditor  = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const ComposerResults = dynamic(() => import("@/components/composer/ComposerResults"), { ssr: false });

const C = { bg:"#0d1117", surface:"#161b22", border:"#21262d", border2:"#30363d", text:"#e6edf3", muted:"#7d8590", muted2:"#484f58" };

/* ─── Quick preset circuits ──────────────────────────────────────────────── */
const PRESETS = [
  { label:"Bell State",  gates:[{gate:"H",qubits:[0],params:[],moment:0},{gate:"CX",qubits:[0,1],params:[],moment:1}],  n:2 },
  { label:"GHZ (3q)",    gates:[{gate:"H",qubits:[0],params:[],moment:0},{gate:"CX",qubits:[0,1],params:[],moment:1},{gate:"CX",qubits:[1,2],params:[],moment:2}], n:3 },
  { label:"QFT (2q)",    gates:[{gate:"H",qubits:[0],params:[],moment:0},{gate:"P",qubits:[1],params:[Math.PI/2],moment:1},{gate:"H",qubits:[1],params:[],moment:2}], n:2 },
  { label:"Grover oracle",gates:[{gate:"H",qubits:[0],params:[],moment:0},{gate:"H",qubits:[1],params:[],moment:0},{gate:"CZ",qubits:[0,1],params:[],moment:1},{gate:"H",qubits:[0],params:[],moment:2},{gate:"H",qubits:[1],params:[],moment:2}], n:2 },
];

export default function ResearchWorkbench() {
  const {
    numQubits, gates, isSimulating,
    setNumQubits, clearCircuit, setSimulating, addGate,
  } = useComposerStore();

  const [showCode,    setShowCode]    = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [shots,       setShots]       = useState(1024);
  const [presetOpen,  setPresetOpen]  = useState(false);
  const [resultH,     setResultH]     = useState(260);
  // Research uses its own result state so it doesn't clobber the Learner Composer
  const [researchResult, setResearchResult] = useState<Record<string, unknown> | null>(null);

  // Compact gate groups for the research palette
  const RESEARCH_GATES = [
    { gate:"H",   label:"H",    bg:"#c0392b", title:"Hadamard",    multi:1 },
    { gate:"X",   label:"X",    bg:"#2563eb", title:"Pauli-X",     multi:1 },
    { gate:"Y",   label:"Y",    bg:"#2563eb", title:"Pauli-Y",     multi:1 },
    { gate:"Z",   label:"Z",    bg:"#2563eb", title:"Pauli-Z",     multi:1 },
    { gate:"S",   label:"S",    bg:"#2563eb", title:"S gate",      multi:1 },
    { gate:"T",   label:"T",    bg:"#2563eb", title:"T gate",      multi:1 },
    { gate:"SX",  label:"√X",   bg:"#2563eb", title:"√X",          multi:1 },
    { gate:"RX",  label:"RX",   bg:"#7c1d6f", title:"Rₓ(π/2)",    multi:1, params:[Math.PI/2] },
    { gate:"RY",  label:"RY",   bg:"#7c1d6f", title:"Rᵧ(π/2)",    multi:1, params:[Math.PI/2] },
    { gate:"RZ",  label:"RZ",   bg:"#3730a3", title:"R_z(π/2)",    multi:1, params:[Math.PI/2] },
    { gate:"CX",  label:"CX",   bg:"#2563eb", title:"CNOT",        multi:2 },
    { gate:"CZ",  label:"CZ",   bg:"#2563eb", title:"CZ",          multi:2 },
    { gate:"SWAP",label:"SWAP", bg:"#374151", title:"SWAP",        multi:2 },
    { gate:"CCX", label:"Toff", bg:"#3730a3", title:"Toffoli",     multi:3 },
    { gate:"M",   label:"M",    bg:"#111827", title:"Measure",     multi:1 },
  ] as const;
  const resizing = useRef(false);
  const startY   = useRef(0);
  const startH   = useRef(0);

  const qiskitCode = generateCode("qiskit", numQubits, gates);

  const runSim = async () => {
    setSimulating(true);
    try {
      const res = await composerApi.simulate({ num_qubits: numQubits, gates, shots });
      setResearchResult(res.data);
      // Push into composer store so ComposerResults can read it (isolated to research tab)
      useComposerStore.getState().setResult(res.data);
      setShowResults(true);
      toast.success("Simulation complete");
    } catch {
      toast.error("Backend not running");
    } finally {
      setSimulating(false);
    }
  };

  const loadPreset = (p: typeof PRESETS[0]) => {
    clearCircuit();
    setNumQubits(p.n);
    p.gates.forEach((g) => addGate({ gate: g.gate, qubits: g.qubits, params: g.params, moment: g.moment }));
    setPresetOpen(false);
  };

  const onResizeStart = (e: React.MouseEvent) => {
    resizing.current = true;
    startY.current   = e.clientY;
    startH.current   = resultH;
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      setResultH(Math.max(160, Math.min(520, startH.current + (startY.current - ev.clientY))));
    };
    const onUp = () => { resizing.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  };

  return (
    <div className="flex w-full min-h-screen">
      <ResearchSidebar />

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* ── Workbench header ──────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-4 h-11 border-b shrink-0"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <span className="text-sm font-semibold text-[#e6edf3] mr-2">Circuit Workbench</span>

          {/* Qubit stepper */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#7d8590]">q</span>
            <button onClick={() => numQubits > 1 && setNumQubits(numQubits - 1)}
              className="w-5 h-5 rounded flex items-center justify-center text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors">
              <Minus size={10} />
            </button>
            <span className="text-sm font-mono text-[#e6edf3] w-4 text-center">{numQubits}</span>
            <button onClick={() => numQubits < 10 && setNumQubits(numQubits + 1)}
              className="w-5 h-5 rounded flex items-center justify-center text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors">
              <Plus size={10} />
            </button>
          </div>

          <div className="h-4 w-px mx-1" style={{ background: C.border }} />

          {/* Shots */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#7d8590]">shots</span>
            <input
              type="number"
              value={shots}
              min={1} max={65536}
              onChange={(e) => setShots(Math.max(1, parseInt(e.target.value) || 1024))}
              className="w-16 h-6 bg-[#0d1117] text-[#e6edf3] text-xs font-mono rounded border px-1.5 focus:outline-none focus:border-[#58a6ff]"
              style={{ borderColor: C.border2 }}
            />
          </div>

          <div className="h-4 w-px mx-1" style={{ background: C.border }} />

          <button onClick={() => { clearCircuit(); setShowResults(false); }}
            className="flex items-center gap-1 text-[11px] text-[#7d8590] hover:text-[#f85149] transition-colors">
            <Trash2 size={11} /> Clear
          </button>

          {/* Preset picker */}
          <div className="relative">
            <button
              onClick={() => setPresetOpen(!presetOpen)}
              className="flex items-center gap-1 text-[11px] text-[#7d8590] hover:text-[#e6edf3] transition-colors"
            >
              Presets <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {presetOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPresetOpen(false)} />
                  <motion.div
                    initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                    transition={{ duration:0.1 }}
                    className="absolute top-full left-0 mt-1 z-50 rounded-lg border py-1 min-w-[140px]"
                    style={{ background: C.surface, borderColor: C.border2 }}
                  >
                    {PRESETS.map((p) => (
                      <button key={p.label} onClick={() => loadPreset(p)}
                        className="w-full px-3 py-1.5 text-left text-xs text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors">
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1 text-[11px] transition-colors ${showCode ? "text-[#58a6ff]" : "text-[#7d8590] hover:text-[#e6edf3]"}`}>
            <Code2 size={11} /> Code
          </button>

          <button onClick={() => setShowPalette(!showPalette)}
            className={`flex items-center gap-1 text-[11px] transition-colors ${showPalette ? "text-[#58a6ff]" : "text-[#7d8590] hover:text-[#e6edf3]"}`}>
            <Plus size={11} /> Gates
          </button>

          {researchResult && (
            <button onClick={() => setShowResults(!showResults)}
              className={`flex items-center gap-1 text-[11px] transition-colors ${showResults ? "text-[#58a6ff]" : "text-[#7d8590] hover:text-[#e6edf3]"}`}>
              <BarChart2 size={11} /> Results
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Metadata strip */}
            <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-[#484f58]">
              <span>{gates.length} gates</span>
              <span>{numQubits}q</span>
              {researchResult && <span className="text-[#4ff7a4]">✓ Simulated</span>}
            </div>
            <div className="h-4 w-px" style={{ background: C.border }} />
            <button
              onClick={runSim}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#238636" }}
            >
              {isSimulating ? (
                <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Running…</>
              ) : (
                <><Play size={11} />Simulate</>
              )}
            </button>
          </div>
        </div>

        {/* ── Circuit + code + results ─────────────────────────────────── */}
        <div className="flex-1 flex min-h-0">

          {/* Circuit */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Compact gate palette */}
            <AnimatePresence>
              {showPalette && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden shrink-0 border-b"
                  style={{ borderColor: C.border, background: "#0a0f17" }}
                >
                  <div className="flex items-center gap-1 px-3 py-2 flex-wrap">
                    {RESEARCH_GATES.map((g) => (
                      <button
                        key={g.gate}
                        title={g.title}
                        onClick={() => {
                          if (numQubits < g.multi) return;
                          const qubits = g.multi === 1 ? [0] : g.multi === 2 ? [0, 1] : [0, 1, 2];
                          const params = "params" in g ? [...g.params] : [];
                          const moment = gates.length > 0 ? Math.max(...gates.map((x) => x.moment)) + 1 : 0;
                          addGate({ gate: g.gate, qubits, params, moment });
                        }}
                        className="h-6 px-2 rounded text-[10px] font-bold text-white transition-all hover:opacity-80 active:scale-95"
                        style={{ background: g.bg, minWidth: 28 }}
                      >
                        {g.label}
                      </button>
                    ))}
                    <span className="text-[10px] text-[#30363d] ml-2 italic">
                      click to append · q[0] default
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-hidden">
              <ComposerCircuit />
            </div>

            {/* Resize handle */}
            {showResults && researchResult && (
              <div className="h-1.5 cursor-row-resize flex items-center justify-center shrink-0"
                style={{ background: C.border, opacity:0.7 }}
                onMouseDown={onResizeStart}
              >
                <div className="w-10 h-0.5 rounded-full" style={{ background: C.muted2 }} />
              </div>
            )}

            {/* Results panel */}
            <AnimatePresence>
              {showResults && researchResult && (
                <motion.div
                  key="results"
                  initial={{ height:0, opacity:0 }}
                  animate={{ height:resultH, opacity:1 }}
                  exit={{ height:0, opacity:0 }}
                  transition={{ duration:0.18 }}
                  className="shrink-0 overflow-hidden border-t"
                  style={{ borderColor: C.border }}
                >
                  <ComposerResults />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Code panel */}
          <AnimatePresence>
            {showCode && (
              <motion.div
                key="code"
                initial={{ width:0, opacity:0 }}
                animate={{ width:300, opacity:1 }}
                exit={{ width:0, opacity:0 }}
                transition={{ duration:0.16 }}
                className="shrink-0 border-l flex flex-col overflow-hidden"
                style={{ borderColor: C.border, background: "#010409" }}
              >
                <div className="flex items-center px-3 h-9 border-b shrink-0 gap-2" style={{ borderColor: C.border }}>
                  <span className="text-[11px] font-semibold text-[#7d8590]">Qiskit</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(qiskitCode); toast.success("Copied"); }}
                    className="ml-auto p-1 rounded text-[#484f58] hover:text-[#7d8590] hover:bg-[#21262d] transition-colors"
                    title="Copy code"
                  >
                    <Copy size={11} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    language="python"
                    theme="vs-dark"
                    value={qiskitCode}
                    options={{
                      readOnly:true, minimap:{enabled:false}, fontSize:11.5,
                      fontFamily:"'IBM Plex Mono','Geist Mono',monospace",
                      scrollBeyondLastLine:false, padding:{top:8},
                      lineNumbers:"on", renderLineHighlight:"none", overviewRulerLanes:0,
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

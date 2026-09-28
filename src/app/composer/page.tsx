"use client";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { composerApi } from "@/lib/api";
import { useComposerStore, type Framework } from "@/store/composerStore";
import { useAgentStore } from "@/store/agentStore";
import { useInfraStore } from "@/store/infraStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { generateCode, parseCode, FRAMEWORKS } from "@/lib/codegens";
import ComposerCircuit from "@/components/composer/ComposerCircuit";
import ComposerResults from "@/components/composer/ComposerResults";
import {
  Play, Trash2, Plus, Minus, Code2,
  RotateCcw, RotateCw, PanelBottomOpen,
  ChevronDown, Check, AlertTriangle, RefreshCw,
  Server,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ─── Gate groups ────────────────────────────────────────────────────────── */
const GATE_GROUPS = [
  {
    label: "Clifford",
    gates: [
      { gate: "H",   label: "H",   bg: "#da1e28", border: "#ff6168", title: "Hadamard — creates superposition" },
      { gate: "X",   label: "X",   bg: "#0f62fe", border: "#4589ff", title: "Pauli-X (bit flip)" },
      { gate: "Y",   label: "Y",   bg: "#0f62fe", border: "#4589ff", title: "Pauli-Y" },
      { gate: "Z",   label: "Z",   bg: "#0f62fe", border: "#4589ff", title: "Pauli-Z (phase flip)" },
      { gate: "S",   label: "S",   bg: "#0f62fe", border: "#4589ff", title: "S gate (√Z)" },
      { gate: "T",   label: "T",   bg: "#0f62fe", border: "#4589ff", title: "T gate (π/8 phase)" },
      { gate: "Sdg", label: "S†",  bg: "#0f62fe", border: "#4589ff", title: "S-dagger" },
      { gate: "Tdg", label: "T†",  bg: "#0f62fe", border: "#4589ff", title: "T-dagger" },
      { gate: "SX",  label: "√X",  bg: "#0f62fe", border: "#4589ff", title: "√X gate" },
      { gate: "I",   label: "I",   bg: "#393939", border: "#6f6f6f", title: "Identity (no-op)" },
    ],
  },
  {
    label: "Rotation",
    gates: [
      { gate: "RX", label: "RX", bg: "#9f1853", border: "#ee5396", title: "Rₓ(θ) — x-axis rotation", needsParam: true },
      { gate: "RY", label: "RY", bg: "#9f1853", border: "#ee5396", title: "Rᵧ(θ) — y-axis rotation", needsParam: true },
      { gate: "RZ", label: "RZ", bg: "#491d8b", border: "#a56eff", title: "R_z(θ) — z-axis rotation", needsParam: true },
      { gate: "P",  label: "P",  bg: "#491d8b", border: "#a56eff", title: "Phase P(λ)",               needsParam: true },
    ],
  },
  {
    label: "Two-qubit",
    gates: [
      { gate: "CX",   label: "CX",   bg: "#0f62fe", border: "#4589ff", title: "CNOT (controlled-X)", multi: 2 },
      { gate: "CZ",   label: "CZ",   bg: "#0f62fe", border: "#4589ff", title: "Controlled-Z",         multi: 2 },
      { gate: "SWAP", label: "SWAP", bg: "#393939", border: "#6f6f6f", title: "SWAP two qubits",      multi: 2 },
      { gate: "CCX",  label: "Toff", bg: "#491d8b", border: "#a56eff", title: "Toffoli (CCX)",         multi: 3 },
    ],
  },
  {
    label: "Measure",
    gates: [
      { gate: "M", label: "M", bg: "#161616", border: "#525252", title: "Measure qubit → classical bit" },
    ],
  },
] as const;

/* ─── Colors ─────────────────────────────────────────────────────────────── */
const C = {
  bg:       "#0d1117",
  surface:  "#161b22",
  border:   "#21262d",
  border2:  "#30363d",
  text:     "#e6edf3",
  muted:    "#7d8590",
  muted2:   "#484f58",
  run:      "#238636",
  runHover: "#2ea043",
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ComposerPage() {
  const {
    numQubits, gates, result, isSimulating,
    framework, codeOverride, codeModified,
    selectedGate,
    setNumQubits, clearCircuit, setResult, setSimulating,
    setFramework, setCodeOverride, clearCodeOverride, applyParsedGates,
    setSelectedGate,
  } = useComposerStore();

  const setAgentContext = useAgentStore((s) => s.setContext);
  const { user } = useAuthStore();

  // Infrastructure integration — selected backend badge + submit shortcut
  const {
    selectedProviderId, selectedBackendId, backends, isSubmitting: infraSubmitting,
    submitJob,
  } = useInfraStore();
  const infraBackend = backends[selectedProviderId]?.find((b) => b.id === selectedBackendId);

  const [codeVisible,    setCodeVisible]    = useState(true);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [paramInput,     setParamInput]     = useState("0.7854");
  const [tooltipGate,    setTooltipGate]    = useState<string | null>(null);
  const [fwMenuOpen,     setFwMenuOpen]     = useState(false);
  const [parseError,     setParseError]     = useState<string | null>(null);

  /* Generated code (always up to date from circuit) */
  const generatedCode = generateCode(framework, numQubits, gates);

  /* What the Monaco editor displays — user edits or generated */
  const displayedCode = codeOverride ?? generatedCode;

  /* Monaco language based on framework */
  const editorLang = framework === "openqasm3" ? "plaintext" : "python";

  /* Current framework metadata */
  const fwMeta = FRAMEWORKS.find((f) => f.id === framework) ?? FRAMEWORKS[0];

  /* ── Apply code to circuit ──────────────────────────────────────── */
  const applyCode = useCallback(() => {
    const code = codeOverride ?? generatedCode;
    const parsed = parseCode(framework, code);
    if (!parsed || parsed.gates.length === 0) {
      setParseError("Could not parse gates from this code. Check syntax.");
      toast.error("Parse failed — check the code syntax");
      return;
    }
    setParseError(null);
    applyParsedGates(parsed.gates, parsed.numQubits);
    toast.success(`Applied ${parsed.gates.length} gate(s) from code`);
  }, [codeOverride, generatedCode, framework, applyParsedGates]);

  /* ── Submit to infrastructure ───────────────────────────────────── */
  const submitToHardware = async () => {
    if (!user) { toast.error("Sign in to submit to hardware"); return; }
    if (gates.length === 0) { toast.error("Build a circuit first"); return; }
    if (!selectedBackendId) { toast.error("Select a backend in Quantum Infrastructure"); return; }
    const qasm = generateCode("openqasm3", numQubits, gates);
    try {
      const job = await submitJob(qasm, numQubits);
      if (!job) {
        toast.error("Submit failed — no response from backend");
        return;
      }
      if (job.status === "completed" && job.result) {
        setResult({ ...job.result, success: true } as Parameters<typeof setResult>[0]);
        setResultsVisible(true);
        toast.success(`Job ${job.id} complete`);
      } else {
        toast.success(`Job ${job.id} submitted → Quantum Infrastructure`);
      }
    } catch (err: unknown) {
      const e = err as { httpStatus?: number; detail?: string };
      if (e.httpStatus === 401) {
        toast.error("Sign in to submit jobs to hardware");
      } else if (e.httpStatus === 503) {
        toast.error(`Backend unavailable: ${e.detail ?? "check provider credentials"}`);
      } else if (e.httpStatus === 502) {
        toast.error(`Provider error: ${e.detail ?? "submission failed"}`);
      } else {
        toast.error(`Submit failed: ${e.detail ?? "unknown error"}`);
      }
    }
  };
  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await composerApi.simulate({
        num_qubits: numQubits,
        gates,
        shots: 1024,
        framework,   // ← tell backend which simulator to use
      });
      setResult(res.data);
      setResultsVisible(true);
      setAgentContext({
        simulation_result: res.data,
        current_concept: "circuit simulation",
      });
      toast.success("Simulation complete");
    } catch {
      toast.error("Backend not running — start uvicorn");
    } finally {
      setSimulating(false);
    }
  };

  /* ── Resizable results panel ────────────────────────────────────── */
  const [resultH, setResultH] = useState(280);
  const resizing = useRef(false);
  const startY   = useRef(0);
  const startH   = useRef(0);

  const onResizeStart = (e: React.MouseEvent) => {
    resizing.current = true;
    startY.current = e.clientY;
    startH.current = resultH;
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      setResultH(Math.max(160, Math.min(520, startH.current + (startY.current - ev.clientY))));
    };
    const onUp = () => { resizing.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-48px)]"
      style={{ background: C.bg, color: C.text }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center px-3 h-11 shrink-0 border-b gap-0.5"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <span className="text-sm font-medium mr-3 select-none" style={{ color: C.text }}>
          Untitled circuit
        </span>

        <Divider />

        {/* Undo/Redo placeholders (visual only — undo is complex with zustand) */}
        <ToolbarBtn onClick={() => {}} title="Undo (Ctrl+Z)">
          <RotateCcw size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => {}} title="Redo">
          <RotateCw size={13} />
        </ToolbarBtn>

        <Divider />

        {/* Qubit stepper */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[11px] select-none" style={{ color: C.muted }}>Qubits</span>
          <ToolbarBtn onClick={() => numQubits > 1 && setNumQubits(numQubits - 1)} title="Remove qubit">
            <Minus size={11} />
          </ToolbarBtn>
          <span className="text-sm font-mono w-5 text-center select-none" style={{ color: C.text }}>
            {numQubits}
          </span>
          <ToolbarBtn onClick={() => numQubits < 8 && setNumQubits(numQubits + 1)} title="Add qubit">
            <Plus size={11} />
          </ToolbarBtn>
        </div>

        <Divider />

        {/* Active gate indicator */}
        <div className="flex items-center gap-1.5 px-1" title="Active gate — click any circuit cell to place this gate">
          <span className="text-[11px] select-none" style={{ color: C.muted }}>Gate</span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded select-none"
            style={{ background: "#238636", color: "#ffffff", minWidth: 28, textAlign: "center" }}
          >
            {selectedGate.gate}
          </span>
        </div>

        <Divider />

        <ToolbarBtn
          onClick={() => { clearCircuit(); setResultsVisible(false); }}
          title="Clear circuit" danger
        >
          <Trash2 size={13} />
          <span className="text-[11px]">Clear</span>
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => setCodeVisible(!codeVisible)}
          title={codeVisible ? "Hide code editor" : "Show code editor"}
          active={codeVisible}
        >
          <Code2 size={13} />
          <span className="text-[11px]">Code</span>
        </ToolbarBtn>

        {result && (
          <ToolbarBtn
            onClick={() => setResultsVisible(!resultsVisible)}
            title="Toggle results panel"
            active={resultsVisible}
          >
            <PanelBottomOpen size={13} />
            <span className="text-[11px]">Results</span>
          </ToolbarBtn>
        )}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Framework selector */}
          <div className="relative">
            <button
              onClick={() => setFwMenuOpen(!fwMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded border text-[11px] font-medium transition-colors"
              style={{
                background: C.surface,
                borderColor: C.border2,
                color: C.text,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#4589ff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border2)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: fwMeta.color }}
              />
              {fwMeta.label}
              <ChevronDown size={11} style={{ color: C.muted }} />
            </button>

            <AnimatePresence>
              {fwMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFwMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 z-50 rounded-lg border py-1 min-w-[220px]"
                    style={{ background: "#161b22", borderColor: C.border2 }}
                  >
                    {FRAMEWORKS.map((fw) => (
                      <button
                        key={fw.id}
                        onClick={() => { setFramework(fw.id); setFwMenuOpen(false); }}
                        className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors"
                        style={{ color: C.text }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#21262d")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: fw.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{fw.label}</span>
                            <span
                              className="text-[10px] px-1 rounded"
                              style={{ background: C.border, color: C.muted }}
                            >
                              {fw.badge}
                            </span>
                            {framework === fw.id && (
                              <Check size={11} style={{ color: "#4589ff" }} className="ml-auto shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: C.muted }}>
                            {fw.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Divider />

          {/* Run button */}
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-4 h-7 rounded text-xs font-semibold text-white transition-colors"
            style={{
              background: isSimulating ? C.muted2 : C.run,
            }}
            title={
              framework === "qiskit"    ? "Run simulation with Qiskit Aer" :
              framework === "pennylane" ? "Run simulation with PennyLane default.qubit" :
              framework === "openqasm3" ? "Run simulation: load QASM3 → Qiskit Aer" :
              framework === "cirq"      ? "Run simulation with Qiskit Aer (Cirq not on server)" :
              framework === "qbraid"    ? "Run simulation with Qiskit Aer (qBraid not on server)" :
              framework === "qpiai"     ? "Run simulation with Qiskit Aer (QpiAI not on server)" :
              "Run simulation"
            }
            onMouseEnter={(e) => {
              if (!isSimulating)
                (e.currentTarget as HTMLElement).style.background = C.runHover;
            }}
            onMouseLeave={(e) => {
              if (!isSimulating)
                (e.currentTarget as HTMLElement).style.background = C.run;
            }}
          >
            {isSimulating ? (
              <>
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play size={11} />
                Set up and run
              </>
            )}
          </button>

          {/* Submit to hardware shortcut */}
          <Link href="/infrastructure">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (gates.length > 0 && selectedBackendId) {
                  submitToHardware();
                } else {
                  window.location.href = "/infrastructure";
                }
              }}
              className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition-colors border"
              style={{
                background: "transparent",
                borderColor: C.border2,
                color: C.muted,
              }}
              title={
                selectedBackendId
                  ? `Submit to ${infraBackend?.name ?? selectedBackendId}`
                  : "Configure backend in Quantum Infrastructure"
              }
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#4589ff";
                (e.currentTarget as HTMLElement).style.color = "#e6edf3";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border2;
                (e.currentTarget as HTMLElement).style.color = C.muted;
              }}
            >
              {infraSubmitting ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Server size={11} />
              )}
              {selectedBackendId
                ? infraBackend?.name ?? selectedBackendId
                : "No backend"}
            </button>
          </Link>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* ── Gate palette ─────────────────────────────────────────── */}
        <div
          className="w-[212px] shrink-0 border-r flex flex-col overflow-y-auto"
          style={{ borderColor: C.border, background: C.bg }}
        >
          <div className="px-3 pt-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Operations
            </span>
          </div>
          <div className="px-3 pb-4 space-y-3 flex-1">
            {GATE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: C.muted2 }}>
                  {group.label}
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {group.gates.map((g) => (
                    <GateBtn
                      key={g.gate}
                      gate={g as { gate: string; label: string; bg: string; border: string; title: string; needsParam?: boolean; multi?: number }}
                      numQubits={numQubits}
                      paramInput={paramInput}
                      isTooltipActive={tooltipGate === g.gate}
                      onTooltip={setTooltipGate}
                      isSelected={selectedGate.gate === g.gate}
                      onSelect={setSelectedGate}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Rotation param */}
            <div className="pt-3 border-t space-y-2" style={{ borderColor: C.border }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted2 }}>
                Rotation θ
              </p>
              <input
                type="number"
                value={paramInput}
                onChange={(e) => setParamInput(e.target.value)}
                step="0.1"
                className="w-full text-xs font-mono rounded px-2 py-1.5 border focus:outline-none"
                style={{ background: C.surface, color: C.text, borderColor: C.border2 }}
              />
              <div className="flex gap-1 flex-wrap">
                {[
                  ["π/4", (Math.PI / 4).toFixed(4)],
                  ["π/2", (Math.PI / 2).toFixed(4)],
                  ["π",   Math.PI.toFixed(4)],
                ].map(([lbl, val]) => (
                  <button
                    key={lbl}
                    onClick={() => setParamInput(val)}
                    className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
                    style={{ borderColor: C.border2, color: C.muted, background: "transparent" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = C.surface;
                      (e.currentTarget as HTMLElement).style.color = C.text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = C.muted;
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Circuit + results ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ComposerCircuit />
          </div>

          {resultsVisible && (
            <div
              className="h-1.5 shrink-0 cursor-row-resize flex items-center justify-center"
              style={{ background: C.border, opacity: 0.6 }}
              onMouseDown={onResizeStart}
            >
              <div className="w-12 h-0.5 rounded-full" style={{ background: C.muted2 }} />
            </div>
          )}

          <AnimatePresence>
            {resultsVisible && result && (
              <motion.div
                key="results"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: resultH, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="shrink-0 overflow-hidden border-t"
                style={{ borderColor: C.border }}
              >
                <ComposerResults />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Code panel ───────────────────────────────────────────── */}
        <AnimatePresence>
          {codeVisible && (
            <motion.div
              key="code"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="shrink-0 border-l flex flex-col overflow-hidden"
              style={{ borderColor: C.border, background: "#010409" }}
            >
              {/* Code panel header */}
              <div
                className="flex items-center gap-2 px-3 h-9 border-b shrink-0"
                style={{ borderColor: C.border }}
              >
                {/* Framework dot + name */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: fwMeta.color }}
                />
                <span className="text-xs font-semibold" style={{ color: C.text }}>
                  {fwMeta.label}
                </span>

                {/* Modified indicator */}
                {codeModified && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                  >
                    <span className="w-1 h-1 rounded-full bg-amber-400 inline-block" />
                    modified
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                  {/* Reset to generated */}
                  {codeModified && (
                    <button
                      onClick={() => { clearCodeOverride(); setParseError(null); }}
                      title="Reset to generated code"
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                      style={{ color: C.muted }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = C.text}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = C.muted}
                    >
                      <RefreshCw size={10} />
                      Reset
                    </button>
                  )}
                  {/* Apply code → circuit */}
                  <button
                    onClick={applyCode}
                    title="Apply code to circuit (parse gates)"
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                    style={{
                      background: "#4589ff",
                      color: "#fff",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#4f80ff"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "#4589ff"}
                  >
                    <Check size={10} />
                    Apply to circuit
                  </button>
                </div>
              </div>

              {/* Parse error banner */}
              {parseError && (
                <div
                  className="flex items-start gap-2 px-3 py-2 text-[10px] border-b"
                  style={{ background: "rgba(220,38,38,0.1)", borderColor: "#4c1010", color: "#f87171" }}
                >
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Non-Qiskit framework info banner */}
              {framework !== "qiskit" && (
                <div
                  className="flex items-start gap-2 px-3 py-1.5 text-[10px] border-b"
                  style={{ background: "rgba(69,137,255,0.08)", borderColor: "#1f3a5f", color: "#79b8ff" }}
                >
                  <span className="mt-0.5 shrink-0">ℹ</span>
                  <span>
                    {framework === "pennylane" && <>Code runs on <strong style={{ color: "#3fb950" }}>PennyLane default.qubit</strong> — native differentiable simulator.</>}
                    {framework === "openqasm3" && <>QASM3 string is loaded by Qiskit then run on <strong style={{ color: "#3fb950" }}>Qiskit Aer</strong> — confirms your QASM is valid.</>}
                    {framework === "cirq"      && <>Cirq is not installed on the server. Simulation falls back to <strong style={{ color: "#e3b341" }}>Qiskit Aer</strong>. Code shown is correct Cirq syntax for local use.</>}
                    {framework === "qbraid"    && <>qBraid runtime is not installed on the server. Simulation falls back to <strong style={{ color: "#e3b341" }}>Qiskit Aer</strong>. Code shown targets qBraid cloud.</>}
                    {framework === "qpiai"     && <>QpiAI SDK is not installed on the server. Simulation falls back to <strong style={{ color: "#e3b341" }}>Qiskit Aer</strong>. Code shown targets QpiAI cloud.</>}
                  </span>
                </div>
              )}

              {/* Monaco editor — EDITABLE */}
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  language={editorLang}
                  theme="vs-dark"
                  value={displayedCode}
                  onChange={(v) => {
                    if (v !== undefined) {
                      setCodeOverride(v);
                      setParseError(null);
                    }
                  }}
                  options={{
                    readOnly: false,
                    minimap: { enabled: false },
                    fontSize: 11.5,
                    fontFamily: "'IBM Plex Mono', 'Geist Mono', monospace",
                    scrollBeyondLastLine: false,
                    padding: { top: 10 },
                    lineNumbers: "on",
                    renderLineHighlight: "line",
                    overviewRulerLanes: 0,
                    folding: false,
                    wordWrap: "off",
                    lineDecorationsWidth: 6,
                    lineNumbersMinChars: 3,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    tabSize: 4,
                    insertSpaces: true,
                    scrollbar: {
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                  }}
                />
              </div>

              {/* Info footer */}
              <div
                className="px-3 py-1.5 border-t flex items-center justify-between shrink-0"
                style={{ borderColor: C.border, background: C.surface }}
              >
                <span className="text-[10px]" style={{ color: C.muted2 }}>
                  Edit code freely · click <b style={{ color: C.muted }}>Apply</b> to sync circuit
                </span>
                {framework !== "qiskit" && (
                  <span className="text-[10px]" style={{ color: C.muted2 }}>
                    ⚡ Sim: Qiskit only
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Toolbar button ─────────────────────────────────────────────────────── */
function Divider() {
  return <div className="h-5 w-px mx-1 shrink-0" style={{ background: C.border }} />;
}

function ToolbarBtn({
  children, onClick, title, danger, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1 px-2 h-7 rounded text-[11px] transition-colors"
      style={{
        color:      active ? "#4589ff" : "#7d8590",
        background: active ? "rgba(69,137,255,0.12)" : "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color      = danger ? "#f85149" : active ? "#4589ff" : "#e6edf3";
        (e.currentTarget as HTMLElement).style.background = active ? "rgba(69,137,255,0.15)" : "#21262d";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color      = active ? "#4589ff" : "#7d8590";
        (e.currentTarget as HTMLElement).style.background = active ? "rgba(69,137,255,0.12)" : "transparent";
      }}
    >
      {children}
    </button>
  );
}

/* ─── Gate button ────────────────────────────────────────────────────────── */
function GateBtn({
  gate, numQubits, paramInput, isTooltipActive, onTooltip, isSelected, onSelect,
}: {
  gate: { gate: string; label: string; bg: string; border: string; title: string; needsParam?: boolean; multi?: number };
  numQubits: number;
  paramInput: string;
  isTooltipActive: boolean;
  onTooltip: (g: string | null) => void;
  isSelected: boolean;
  onSelect: (g: { gate: string; needsParam?: boolean; multi?: number }) => void;
}) {
  return (
    <div className="relative">
      <button
        onMouseEnter={() => onTooltip(gate.gate)}
        onMouseLeave={() => onTooltip(null)}
        onClick={() => {
          const multi = gate.multi ?? 1;
          if (numQubits < multi) {
            toast.error(`Need ≥${multi} qubits for ${gate.gate}`);
            return;
          }
          // Select this gate — it will be placed when the user clicks a circuit cell
          onSelect({ gate: gate.gate, needsParam: gate.needsParam, multi });
        }}
        className="w-full h-8 rounded text-white text-[11px] font-bold leading-none active:scale-95 transition-all"
        style={{
          background: gate.bg,
          border: isSelected
            ? "2px solid #ffffff"
            : `1px solid ${gate.border}`,
          boxShadow: isSelected ? `0 0 0 2px ${gate.bg}` : "none",
          transform: isSelected ? "scale(1.08)" : "scale(1)",
        }}
        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.82"; }}
        onMouseOut={(e)  => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        title={isSelected ? `${gate.gate} selected — click any circuit cell to place` : gate.title}
      >
        {gate.label}
      </button>
      {isTooltipActive && (
        <div
          className="absolute left-full top-0 ml-2 z-50 px-2.5 py-2 rounded text-[10px] whitespace-nowrap pointer-events-none"
          style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e", minWidth: 140 }}
        >
          <span className="block font-bold text-[12px] mb-0.5" style={{ color: "#e6edf3" }}>
            {gate.gate}
          </span>
          {gate.title}
          {isSelected && (
            <span className="block mt-1 text-[9px]" style={{ color: "#3fb950" }}>
              ✓ Selected — click a circuit cell to place
            </span>
          )}
        </div>
      )}
    </div>
  );
}

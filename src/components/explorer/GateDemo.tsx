"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type QState = "0" | "1" | "super";

const STATE_LABEL: Record<QState, string> = {
  "0":     "|0⟩  —  OFF",
  "1":     "|1⟩  —  ON",
  "super": "Superposition  —  BOTH!",
};

const STATE_EMOJI: Record<QState, string> = { "0": "🔵", "1": "🔴", "super": "🌀" };
const STATE_COLOR: Record<QState, string> = { "0": "#4f8ef7", "1": "#f74f4f", "super": "#c44ff7" };

const GATES: { id: string; label: string; color: string; apply: (s: QState) => QState; desc: string }[] = [
  { id:"X", label:"X",  color:"#0f62fe", apply:(s) => s === "0" ? "1" : s === "1" ? "0" : "super", desc:"Flips 0↔1 (quantum NOT)" },
  { id:"H", label:"H",  color:"#da1e28", apply:(s) => s === "super" ? "0" : "super",                 desc:"Creates/destroys superposition" },
  { id:"Z", label:"Z",  color:"#491d8b", apply:(s) => s,                                              desc:"Flips phase (visible as –)" },
];

export default function GateDemo({ onComplete }: { onComplete?: () => void }) {
  const [qstate,  setQstate]  = useState<QState>("0");
  const [history, setHistory] = useState<{ gate: string; result: QState }[]>([]);
  const [phase,   setPhase]   = useState(false);
  const [flashes, setFlashes] = useState(0);

  const applyGate = (gate: typeof GATES[0]) => {
    const next = gate.apply(qstate);
    if (gate.id === "Z") setPhase((p) => !p);
    setQstate(next);
    const h = [...history, { gate: gate.id, result: next }].slice(-6);
    setHistory(h);
    if (h.length >= 3 && onComplete) onComplete();
    setFlashes((f) => f + 1);
  };

  const reset = () => { setQstate("0"); setHistory([]); setPhase(false); };

  return (
    <div className="flex flex-col items-center gap-5 w-full">

      {/* Qubit display */}
      <div className="relative flex flex-col items-center gap-2">
        <motion.div
          key={`${qstate}-${phase}`}
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 select-none"
          style={{
            background: `radial-gradient(circle, ${STATE_COLOR[qstate]}33, ${STATE_COLOR[qstate]}11)`,
            border: `2px solid ${STATE_COLOR[qstate]}80`,
            boxShadow: `0 0 32px ${STATE_COLOR[qstate]}40`,
          }}
        >
          <span className="text-4xl leading-none">{STATE_EMOJI[qstate]}</span>
          {phase && qstate !== "super" && (
            <span className="text-[10px] font-bold" style={{ color: STATE_COLOR[qstate] }}>
              phase −
            </span>
          )}
        </motion.div>
        <p className="text-sm font-bold text-white text-center">{STATE_LABEL[qstate]}</p>
        {phase && (
          <p className="text-[10px]" style={{ color: "#a56eff" }}>Z gate flipped the hidden phase</p>
        )}
      </div>

      {/* Gate buttons */}
      <div className="flex gap-2">
        {GATES.map((g) => (
          <div key={g.id} className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => applyGate(g)}
              className="w-14 h-10 rounded-xl text-sm font-black text-white transition-all"
              style={{ background: g.color, border: `1px solid ${g.color}`, boxShadow: `0 2px 12px ${g.color}40` }}
            >
              {g.label}
            </motion.button>
            <span className="text-[9px] text-[#484f68] text-center w-16 leading-tight">{g.desc}</span>
          </div>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[10px] text-[#484f68]">Gate history:</p>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {history.map((h, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "#1a1730", border: "1px solid #2d2a45", color: STATE_COLOR[h.result] }}
              >
                {h.gate} → {STATE_EMOJI[h.result]}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <button onClick={reset} className="text-[11px] text-[#484f68] hover:text-[#7d8590] transition-colors">
        ↺ Reset to |0⟩
      </button>
    </div>
  );
}

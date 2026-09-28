"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComposerStore, Gate } from "@/store/composerStore";

/* ─── Layout constants (matching IBM Composer proportions) ───────────────── */
const LABEL_W  = 48;   // qubit label column width
const CELL_W   = 52;   // width per moment column
const QUBIT_H  = 56;   // height per qubit row
const GATE_W   = 38;   // gate box width
const GATE_H   = 30;   // gate box height
const PAD_X    = 16;   // left padding inside canvas
const PAD_Y    = 20;   // top/bottom padding

/* ─── Gate colors matching IBM Quantum Composer ──────────────────────────── */
const GATE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  H:    { bg: "#da1e28", border: "#ff6168", text: "#fff" },
  X:    { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  Y:    { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  Z:    { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  S:    { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  T:    { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  SDG:  { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  TDG:  { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  SX:   { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  I:    { bg: "#393939", border: "#6f6f6f", text: "#c6c6c6" },
  RX:   { bg: "#9f1853", border: "#ee5396", text: "#fff" },
  RY:   { bg: "#9f1853", border: "#ee5396", text: "#fff" },
  RZ:   { bg: "#491d8b", border: "#a56eff", text: "#fff" },
  P:    { bg: "#491d8b", border: "#a56eff", text: "#fff" },
  CX:   { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  CNOT: { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  CZ:   { bg: "#0f62fe", border: "#4589ff", text: "#fff" },
  SWAP: { bg: "#393939", border: "#6f6f6f", text: "#c6c6c6" },
  CCX:  { bg: "#491d8b", border: "#a56eff", text: "#fff" },
  M:    { bg: "#161616", border: "#525252", text: "#8d8d8d" },
};
const fallbackColor = { bg: "#393939", border: "#6f6f6f", text: "#fff" };

const GATE_LABELS: Record<string, string> = {
  SDG: "S†", TDG: "T†", CNOT: "CX", CCX: "Toff",
};

export default function ComposerCircuit() {
  const { numQubits, gates, removeGate, addGate, selectedGate } = useComposerStore();
  const [hoveredCell, setHoveredCell] = useState<{ q: number; m: number } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ q: number; m: number } | null>(null);
  const [pendingGate, setPendingGate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxMoment = gates.length > 0 ? Math.max(...gates.map((g) => g.moment)) : -1;
  const totalCols = maxMoment + 3;
  const W = LABEL_W + PAD_X + totalCols * CELL_W + PAD_X + 32;
  const H = PAD_Y + numQubits * QUBIT_H + PAD_Y + 20;

  /* Drop zone click — place selected gate at qubit/moment */
  const handleCellClick = useCallback((qubit: number, moment: number) => {
    // If a gate already exists at this cell, remove it instead
    const existing = gates.find(
      (g) => g.moment === moment && g.qubits.includes(qubit)
    );
    if (existing) {
      removeGate(existing.id);
      return;
    }

    const { gate, needsParam, multi = 1 } = selectedGate;

    // For multi-qubit gates (CNOT, CZ, SWAP, CCX…) place starting from clicked qubit
    // but clamp so we don't exceed numQubits
    const startQ = Math.min(qubit, numQubits - multi);
    const qubits = Array.from({ length: multi }, (_, i) => startQ + i);

    const params = needsParam ? [Math.PI / 4] : [];
    addGate({ gate, qubits, params, moment });
  }, [gates, addGate, removeGate, selectedGate, numQubits]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{ background: "#0d1117", cursor: "default" }}
    >
      <svg
        width={Math.max(W, 700)}
        height={Math.max(H, numQubits * QUBIT_H + PAD_Y * 2 + 20)}
        style={{ fontFamily: "'IBM Plex Mono', 'Geist Mono', monospace", userSelect: "none" }}
      >
        {/* ── Drop zone cells (invisible hit targets) ──────────────────── */}
        {Array.from({ length: numQubits }, (_, q) =>
          Array.from({ length: totalCols }, (_, m) => {
            const cx = LABEL_W + PAD_X + m * CELL_W + CELL_W / 2;
            const cy = PAD_Y + q * QUBIT_H + QUBIT_H / 2;
            const isHovered = hoveredCell?.q === q && hoveredCell?.m === m;
            const isDragOver = dragOverCell?.q === q && dragOverCell?.m === m;
            const hasGate = gates.some(
              (g) => g.moment === m && g.qubits.includes(q)
            );
            return (
              <rect
                key={`cell-${q}-${m}`}
                x={cx - CELL_W / 2 + 2}
                y={cy - QUBIT_H / 2 + 4}
                width={CELL_W - 4}
                height={QUBIT_H - 8}
                rx={4}
                fill={
                  isDragOver
                    ? "rgba(37,99,235,0.18)"
                    : isHovered && !hasGate
                    ? "rgba(255,255,255,0.04)"
                    : "transparent"
                }
                stroke={
                  isDragOver
                    ? "#4589ff"
                    : isHovered && !hasGate
                    ? "rgba(255,255,255,0.08)"
                    : "transparent"
                }
                strokeWidth={1}
                strokeDasharray={isHovered && !hasGate ? "3 3" : "0"}
                style={{ cursor: hasGate ? "default" : "crosshair" }}
                onMouseEnter={() => setHoveredCell({ q, m })}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => handleCellClick(q, m)}
              />
            );
          })
        )}

        {/* ── Qubit wires ───────────────────────────────────────────────── */}
        {Array.from({ length: numQubits }, (_, q) => {
          const y = PAD_Y + q * QUBIT_H + QUBIT_H / 2;
          const wireEnd = LABEL_W + PAD_X + totalCols * CELL_W + PAD_X;
          return (
            <g key={`qubit-${q}`}>
              {/* Label */}
              <text
                x={8}
                y={y + 4}
                fill="#7d8590"
                fontSize="12"
                fontWeight="400"
              >
                q[{q}]
              </text>
              {/* Wire */}
              <line
                x1={LABEL_W}
                y1={y}
                x2={wireEnd}
                y2={y}
                stroke="#30363d"
                strokeWidth="1.5"
              />
              {/* Measurement indicator at end */}
              <g>
                <circle
                  cx={wireEnd + 12}
                  cy={y}
                  r={9}
                  fill="none"
                  stroke="#30363d"
                  strokeWidth="1"
                />
                {/* Meter arc */}
                <path
                  d={`M ${wireEnd + 5} ${y + 3} A 7 7 0 0 1 ${wireEnd + 19} ${y + 3}`}
                  fill="none"
                  stroke="#484f58"
                  strokeWidth="1"
                />
                <line
                  x1={wireEnd + 12}
                  y1={y + 3}
                  x2={wireEnd + 17}
                  y2={y - 4}
                  stroke="#484f58"
                  strokeWidth="1"
                />
              </g>
            </g>
          );
        })}

        {/* ── Classical wire ────────────────────────────────────────────── */}
        <g>
          <text
            x={8}
            y={PAD_Y + numQubits * QUBIT_H + 20 + 4}
            fill="#484f58"
            fontSize="11"
          >
            c{numQubits}
          </text>
          <line
            x1={LABEL_W}
            y1={PAD_Y + numQubits * QUBIT_H + 20}
            x2={LABEL_W + PAD_X + totalCols * CELL_W + PAD_X}
            y2={PAD_Y + numQubits * QUBIT_H + 20}
            stroke="#21262d"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </g>

        {/* ── Moment separators (faint column guides) ───────────────────── */}
        {Array.from({ length: totalCols }, (_, m) => {
          const x = LABEL_W + PAD_X + m * CELL_W;
          return (
            <line
              key={`sep-${m}`}
              x1={x}
              y1={PAD_Y - 8}
              x2={x}
              y2={PAD_Y + numQubits * QUBIT_H + 8}
              stroke="#161b22"
              strokeWidth="1"
            />
          );
        })}

        {/* ── Gates ────────────────────────────────────────────────────── */}
        {gates.map((gate) => (
          <GateElement key={gate.id} gate={gate} />
        ))}

        {/* ── Ghost preview: show selected gate label on hovered empty cell ── */}
        {hoveredCell && (() => {
          const { q, m } = hoveredCell;
          const hasGate = gates.some((g) => g.moment === m && g.qubits.includes(q));
          if (hasGate) return null;
          const cx = LABEL_W + PAD_X + m * CELL_W + CELL_W / 2;
          const cy = PAD_Y + q * QUBIT_H + QUBIT_H / 2;
          return (
            <g opacity={0.45} pointerEvents="none">
              <rect
                x={cx - 14} y={cy - 11}
                width={28} height={22}
                rx={4}
                fill="#238636"
                stroke="#3fb950"
                strokeWidth={1}
              />
              <text
                x={cx} y={cy + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                {selectedGate.gate.length > 4 ? selectedGate.gate.slice(0, 4) : selectedGate.gate}
              </text>
            </g>
          );
        })()}

        {/* ── Column indices ────────────────────────────────────────────── */}
        {Array.from({ length: Math.max(1, maxMoment + 1) }, (_, m) => (
          <text
            key={`idx-${m}`}
            x={LABEL_W + PAD_X + m * CELL_W + CELL_W / 2}
            y={PAD_Y - 6}
            fill="#30363d"
            fontSize="9"
            textAnchor="middle"
          >
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Individual gate element ────────────────────────────────────────────── */
function GateElement({ gate }: { gate: Gate }) {
  const { removeGate } = useComposerStore();
  const [hovered, setHovered] = useState(false);
  const colors = GATE_COLORS[gate.gate.toUpperCase()] ?? fallbackColor;
  const label  = GATE_LABELS[gate.gate.toUpperCase()] ?? gate.gate;
  const cx = LABEL_W + PAD_X + gate.moment * CELL_W + CELL_W / 2;

  /* ── Single-qubit gate ─────────────────────────────────────────────── */
  if (gate.qubits.length === 1) {
    const cy = PAD_Y + gate.qubits[0] * QUBIT_H + QUBIT_H / 2;
    return (
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => removeGate(gate.id)}
        style={{ cursor: "pointer" }}
      >
        {/* Glow on hover */}
        {hovered && (
          <rect
            x={cx - GATE_W / 2 - 3}
            y={cy - GATE_H / 2 - 3}
            width={GATE_W + 6}
            height={GATE_H + 6}
            rx={7}
            fill="none"
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.4"
          />
        )}
        {/* Gate body */}
        <rect
          x={cx - GATE_W / 2}
          y={cy - GATE_H / 2}
          width={GATE_W}
          height={GATE_H}
          rx={4}
          fill={hovered ? lighten(colors.bg) : colors.bg}
          stroke={colors.border}
          strokeWidth="1"
        />
        {/* Label */}
        <text
          x={cx}
          y={cy + (gate.params.length > 0 ? 0 : 4)}
          textAnchor="middle"
          fill={colors.text}
          fontSize="11"
          fontWeight="700"
          letterSpacing="0"
        >
          {label}
        </text>
        {/* Parameter */}
        {gate.params.length > 0 && (
          <text
            x={cx}
            y={cy + 11}
            textAnchor="middle"
            fill={colors.border}
            fontSize="8"
          >
            {fmtParam(gate.params[0])}
          </text>
        )}
        {/* Remove X on hover */}
        {hovered && (
          <>
            <circle cx={cx + GATE_W / 2 - 1} cy={cy - GATE_H / 2 + 1} r={5} fill="#0d1117" />
            <text
              x={cx + GATE_W / 2 - 1}
              y={cy - GATE_H / 2 + 5}
              textAnchor="middle"
              fill="#f85149"
              fontSize="8"
              fontWeight="700"
            >
              ×
            </text>
          </>
        )}
      </g>
    );
  }

  /* ── CNOT / CX ─────────────────────────────────────────────────────── */
  if (gate.gate.toUpperCase() === "CX" || gate.gate.toUpperCase() === "CNOT") {
    const controlY = PAD_Y + gate.qubits[0] * QUBIT_H + QUBIT_H / 2;
    const targetY  = PAD_Y + gate.qubits[1] * QUBIT_H + QUBIT_H / 2;
    const c = GATE_COLORS.CX;
    return (
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => removeGate(gate.id)}
        style={{ cursor: "pointer" }}
        opacity={hovered ? 0.8 : 1}
      >
        {/* Vertical connector */}
        <line x1={cx} y1={controlY} x2={cx} y2={targetY} stroke={c.border} strokeWidth="1.5" />
        {/* Control dot */}
        <circle cx={cx} cy={controlY} r={6} fill={c.bg} stroke={c.border} strokeWidth="1" />
        {/* Target: ⊕ */}
        <circle cx={cx} cy={targetY} r={13} fill="none" stroke={c.border} strokeWidth="1.5" />
        <line x1={cx - 13} y1={targetY} x2={cx + 13} y2={targetY} stroke={c.border} strokeWidth="1.5" />
        <line x1={cx} y1={targetY - 13} x2={cx} y2={targetY + 13} stroke={c.border} strokeWidth="1.5" />
      </g>
    );
  }

  /* ── CZ ────────────────────────────────────────────────────────────── */
  if (gate.gate.toUpperCase() === "CZ") {
    const q0y = PAD_Y + gate.qubits[0] * QUBIT_H + QUBIT_H / 2;
    const q1y = PAD_Y + gate.qubits[1] * QUBIT_H + QUBIT_H / 2;
    const c = GATE_COLORS.CZ;
    return (
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => removeGate(gate.id)}
        style={{ cursor: "pointer" }}
        opacity={hovered ? 0.8 : 1}
      >
        <line x1={cx} y1={q0y} x2={cx} y2={q1y} stroke={c.border} strokeWidth="1.5" />
        <circle cx={cx} cy={q0y} r={6} fill={c.bg} stroke={c.border} strokeWidth="1" />
        <circle cx={cx} cy={q1y} r={6} fill={c.bg} stroke={c.border} strokeWidth="1" />
      </g>
    );
  }

  /* ── SWAP ──────────────────────────────────────────────────────────── */
  if (gate.gate.toUpperCase() === "SWAP") {
    const q0y = PAD_Y + gate.qubits[0] * QUBIT_H + QUBIT_H / 2;
    const q1y = PAD_Y + gate.qubits[1] * QUBIT_H + QUBIT_H / 2;
    const s = 7;
    return (
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => removeGate(gate.id)}
        style={{ cursor: "pointer" }}
        opacity={hovered ? 0.8 : 1}
      >
        <line x1={cx} y1={q0y} x2={cx} y2={q1y} stroke="#6f6f6f" strokeWidth="1.5" />
        {[q0y, q1y].map((qy, i) => (
          <g key={i}>
            <line x1={cx - s} y1={qy - s} x2={cx + s} y2={qy + s} stroke="#c6c6c6" strokeWidth="2" />
            <line x1={cx + s} y1={qy - s} x2={cx - s} y2={qy + s} stroke="#c6c6c6" strokeWidth="2" />
          </g>
        ))}
      </g>
    );
  }

  /* ── Toffoli (CCX) ─────────────────────────────────────────────────── */
  if (gate.gate.toUpperCase() === "CCX") {
    const c0y = PAD_Y + gate.qubits[0] * QUBIT_H + QUBIT_H / 2;
    const c1y = PAD_Y + gate.qubits[1] * QUBIT_H + QUBIT_H / 2;
    const ty  = PAD_Y + gate.qubits[2] * QUBIT_H + QUBIT_H / 2;
    const topY = Math.min(c0y, c1y, ty);
    const botY = Math.max(c0y, c1y, ty);
    const c = GATE_COLORS.CCX;
    return (
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => removeGate(gate.id)}
        style={{ cursor: "pointer" }}
        opacity={hovered ? 0.8 : 1}
      >
        <line x1={cx} y1={topY} x2={cx} y2={botY} stroke={c.border} strokeWidth="1.5" />
        <circle cx={cx} cy={c0y} r={6} fill={c.bg} stroke={c.border} strokeWidth="1" />
        <circle cx={cx} cy={c1y} r={6} fill={c.bg} stroke={c.border} strokeWidth="1" />
        <circle cx={cx} cy={ty} r={13} fill="none" stroke={c.border} strokeWidth="1.5" />
        <line x1={cx - 13} y1={ty} x2={cx + 13} y2={ty} stroke={c.border} strokeWidth="1.5" />
        <line x1={cx} y1={ty - 13} x2={cx} y2={ty + 13} stroke={c.border} strokeWidth="1.5" />
      </g>
    );
  }

  /* ── Measure ───────────────────────────────────────────────────────── */
  if (gate.gate.toUpperCase() === "M") {
    const cy = PAD_Y + gate.qubits[0] * QUBIT_H + QUBIT_H / 2;
    return (
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => removeGate(gate.id)}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={cx - GATE_W / 2}
          y={cy - GATE_H / 2}
          width={GATE_W}
          height={GATE_H}
          rx={4}
          fill={hovered ? "#262626" : "#161616"}
          stroke="#525252"
          strokeWidth="1"
        />
        {/* Meter arc */}
        <path
          d={`M ${cx - 9} ${cy + 5} A 9 9 0 0 1 ${cx + 9} ${cy + 5}`}
          fill="none"
          stroke="#8d8d8d"
          strokeWidth="1.5"
        />
        <line x1={cx} y1={cy + 5} x2={cx + 7} y2={cy - 5} stroke="#8d8d8d" strokeWidth="1.5" />
      </g>
    );
  }

  return null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function lighten(hex: string): string {
  // Slightly lighten a hex color on hover
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 30);
  const g = Math.min(255, ((n >> 8) & 0xff) + 30);
  const b = Math.min(255, (n & 0xff) + 30);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function fmtParam(v: number): string {
  const PI = Math.PI;
  if (Math.abs(v - PI) < 0.01) return "π";
  if (Math.abs(v - PI / 2) < 0.01) return "π/2";
  if (Math.abs(v - PI / 4) < 0.01) return "π/4";
  if (Math.abs(v - 3 * PI / 2) < 0.01) return "3π/2";
  return v.toFixed(2);
}

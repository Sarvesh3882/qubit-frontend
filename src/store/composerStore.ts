import { create } from "zustand";

export interface Gate {
  id: string;
  gate: string;
  qubits: number[];
  params: number[];
  moment: number;
}

export interface SimulationResult {
  success: boolean;
  probabilities: Record<string, number>;
  counts: Record<string, number>;
  statevector: { re: number; im: number }[];
  bloch_spheres: Record<string, { x: number; y: number; z: number }>;
  qsphere: { state: string; prob: number; phase: number }[];
  circuit_qasm: string;
  num_qubits: number;
  shots: number;
  error?: string;
}

export type Framework =
  | "qiskit"
  | "pennylane"
  | "cirq"
  | "qpiai"
  | "qbraid"
  | "openqasm3";

export interface ComposerState {
  numQubits: number;
  gates: Gate[];
  result: SimulationResult | null;
  isSimulating: boolean;
  activeTab: "probabilities" | "statevector" | "bloch" | "qsphere";
  framework: Framework;
  /** User-typed code. When set, overrides generated code display. */
  codeOverride: string | null;
  /** Whether the code panel has unsaved edits vs the visual circuit. */
  codeModified: boolean;
  /**
   * The gate currently selected in the toolbar palette.
   * Clicking a cell in the circuit grid places this gate.
   * needsParam: gate requires a rotation angle parameter.
   * multi: how many qubits the gate spans (1 = single, 2 = two-qubit, etc.)
   */
  selectedGate: { gate: string; needsParam?: boolean; multi?: number };

  setNumQubits: (n: number) => void;
  addGate: (gate: Omit<Gate, "id">) => void;
  removeGate: (id: string) => void;
  clearCircuit: () => void;
  setResult: (result: SimulationResult | null) => void;
  setSimulating: (v: boolean) => void;
  setActiveTab: (tab: ComposerState["activeTab"]) => void;
  setFramework: (f: Framework) => void;
  setCodeOverride: (code: string) => void;
  clearCodeOverride: () => void;
  setSelectedGate: (g: { gate: string; needsParam?: boolean; multi?: number }) => void;
  /** Replace current circuit with parsed gates and update qubit count */
  applyParsedGates: (gates: Omit<Gate, "id">[], numQubits: number) => void;
}

let gateCounter = 0;

export const useComposerStore = create<ComposerState>((set) => ({
  numQubits: 2,
  gates: [],
  result: null,
  isSimulating: false,
  activeTab: "probabilities",
  framework: "qiskit",
  codeOverride: null,
  codeModified: false,
  selectedGate: { gate: "H" },

  setNumQubits: (n) => set({ numQubits: n, gates: [], result: null, codeOverride: null, codeModified: false }),

  addGate: (gate) =>
    set((s) => ({
      gates: [...s.gates, { ...gate, id: `gate-${++gateCounter}` }],
      result: null,
      codeOverride: null,
      codeModified: false,
    })),

  removeGate: (id) =>
    set((s) => ({
      gates: s.gates.filter((g) => g.id !== id),
      result: null,
      codeOverride: null,
      codeModified: false,
    })),

  clearCircuit: () =>
    set({ gates: [], result: null, codeOverride: null, codeModified: false }),

  setResult: (result) => set({ result }),
  setSimulating: (v) => set({ isSimulating: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFramework: (f) => set({ framework: f, codeOverride: null, codeModified: false }),
  setCodeOverride: (code) => set({ codeOverride: code, codeModified: true }),
  clearCodeOverride: () => set({ codeOverride: null, codeModified: false }),
  setSelectedGate: (g) => set({ selectedGate: g }),

  applyParsedGates: (newGates, numQubits) =>
    set({
      numQubits,
      gates: newGates.map((g) => ({ ...g, id: `gate-${++gateCounter}` })),
      codeOverride: null,
      codeModified: false,
      result: null,
    }),
}));

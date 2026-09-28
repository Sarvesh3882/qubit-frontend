"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { composerApi } from "@/lib/api";
import { 
  ArrowLeft, Play, RotateCcw, ChevronDown, ChevronRight, Trash2,
  Plus, Minus, Map, Beaker, Gamepad2, Trophy, Zap, Download, Upload
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   QUANTUM CIRCUIT COMPOSER - For Quantum Computing
───────────────────────────────────────────────────────────────────────────── */

interface CircuitGate {
  id: string;
  type: string;
  qubit: number;
  targetQubit?: number; // For 2-qubit gates
  column: number;
  params?: number[];
}

const GATE_CATEGORIES = [
  {
    name: "Single-qubit gates",
    collapsed: false,
    gates: [
      { type: "H", label: "Hadamard", color: "#ff006e", description: "Create superposition" },
      { type: "X", label: "Pauli-X", color: "#0088ff", description: "Bit flip" },
      { type: "Y", label: "Pauli-Y", color: "#0088ff", description: "Bit & phase flip" },
      { type: "Z", label: "Pauli-Z", color: "#0088ff", description: "Phase flip" },
      { type: "S", label: "S gate", color: "#00ddff", description: "Phase π/2" },
      { type: "T", label: "T gate", color: "#00ddff", description: "Phase π/4" },
      { type: "Rx", label: "Rx(θ)", color: "#7209b7", description: "X-axis rotation" },
      { type: "Ry", label: "Ry(θ)", color: "#7209b7", description: "Y-axis rotation" },
      { type: "Rz", label: "Rz(θ)", color: "#7209b7", description: "Z-axis rotation" },
    ],
  },
  {
    name: "Two-qubit gates",
    collapsed: false,
    gates: [
      { type: "CNOT", label: "CNOT", color: "#00ff88", description: "Controlled-NOT" },
      { type: "CZ", label: "CZ", color: "#00ff88", description: "Controlled-Z" },
      { type: "SWAP", label: "SWAP", color: "#00ff88", description: "Swap qubits" },
      { type: "CRx", label: "CRx(θ)", color: "#aa44ff", description: "Controlled Rx" },
    ],
  },
  {
    name: "Three-qubit gates",
    collapsed: true,
    gates: [
      { type: "CCNOT", label: "Toffoli", color: "#ffaa00", description: "CCNOT gate" },
      { type: "CSWAP", label: "Fredkin", color: "#ffaa00", description: "Controlled SWAP" },
    ],
  },
  {
    name: "Measurement",
    collapsed: false,
    gates: [
      { type: "M", label: "Measure", color: "#ff8800", description: "Measure in Z basis" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   CIRCUIT DISPLAY COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface CircuitDisplayProps {
  numQubits: number;
  gates: CircuitGate[];
  onGateClick: (gateId: string) => void;
  onGateRemove: (gateId: string) => void;
  selectedGateId: string | null;
}

function CircuitDisplay({ numQubits, gates, onGateClick, onGateRemove, selectedGateId }: CircuitDisplayProps) {
  const columns = Math.max(8, ...gates.map(g => g.column + 1));
  
  return (
    <div className="flex items-center gap-4 px-8">
      {/* Qubit labels */}
      <div className="flex flex-col gap-12">
        {Array.from({ length: numQubits }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm font-mono text-white">q{i}</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#7209b740", border: "1px solid #7209b7" }}
            >
              |0⟩
            </div>
          </div>
        ))}
      </div>

      {/* Circuit grid */}
      <div className="flex-1 flex flex-col gap-12 relative">
        {Array.from({ length: numQubits }, (_, qubitIdx) => (
          <div key={qubitIdx} className="relative h-8 flex items-center">
            {/* Qubit wire */}
            <div
              className="absolute left-0 right-0 h-0.5"
              style={{ background: "#2d1b5e" }}
            />
            
            {/* Gate slots */}
            <div className="relative flex gap-4 w-full">
              {Array.from({ length: columns }, (_, colIdx) => {
                // Find gate at this position
                const gate = gates.find(g => g.qubit === qubitIdx && g.column === colIdx);
                const gateDef = gate ? GATE_CATEGORIES.flatMap(c => c.gates).find(g => g.type === gate.type) : null;
                const isSelected = gate?.id === selectedGateId;
                
                return (
                  <div key={colIdx} className="w-16 flex items-center justify-center relative">
                    {gate ? (
                      <div className="relative">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onGateClick(gate.id)}
                          className="relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-sm group cursor-pointer"
                          style={{
                            background: isSelected ? gateDef?.color : `${gateDef?.color}dd`,
                            border: `2px solid ${isSelected ? "#ffffff" : gateDef?.color}`,
                            boxShadow: isSelected ? `0 0 20px ${gateDef?.color}` : `0 2px 8px ${gateDef?.color}60`,
                          }}
                        >
                          {gate.type}
                          
                          {/* Parameter indicator for rotation gates */}
                          {gate.params && gate.params.length > 0 && gate.params[0] !== 0 && (
                            <div 
                              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
                              style={{ background: "#00ff88", borderColor: "#0f0628" }}
                              title={`θ = ${(gate.params[0] * 180 / Math.PI).toFixed(1)}°`}
                            />
                          )}
                        </motion.div>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGateRemove(gate.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      // Empty slot
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-dashed opacity-20 hover:opacity-40 transition-opacity"
                        style={{ borderColor: "#2d1b5e" }}
                      />
                    )}
                    
                    {/* Draw control lines for 2-qubit gates */}
                    {gate && gate.targetQubit !== undefined && (
                      <div
                        className="absolute left-1/2 w-0.5"
                        style={{
                          background: gateDef?.color,
                          top: gate.targetQubit > qubitIdx ? "50%" : "auto",
                          bottom: gate.targetQubit < qubitIdx ? "50%" : "auto",
                          height: `${Math.abs(gate.targetQubit - qubitIdx) * 80}px`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Measurement symbols */}
      <div className="flex flex-col gap-12">
        {Array.from({ length: numQubits }, (_, i) => (
          <div key={i} className="w-10 h-8 flex items-center justify-center text-xl">
            📊
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BLOCH SPHERE VISUALIZATION
───────────────────────────────────────────────────────────────────────────── */

function BlochSphere() {
  return (
    <div className="relative aspect-square">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, #7209b740, #1a0b3e)",
          border: "2px solid #3d2b6e",
        }}
      >
        {/* Axes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Z axis (vertical) */}
            <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-400 to-transparent" style={{ transform: "translateX(-50%)" }} />
            <div className="absolute left-1/2 top-0 w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center text-[10px] text-blue-400 font-bold" style={{ transform: "translate(-50%, 0)" }}>|0⟩</div>
            <div className="absolute left-1/2 bottom-0 w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center text-[10px] text-red-400 font-bold" style={{ transform: "translate(-50%, 0)" }}>|1⟩</div>
            
            {/* State vector */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-yellow-400"
              style={{ transform: "translate(-50%, -50%)" }}
              animate={{
                x: [0, 10, -10, 0],
                y: [0, -10, 10, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPOSER
───────────────────────────────────────────────────────────────────────────── */

export default function QuantumComposer() {
  const router = useRouter();
  const [numQubits, setNumQubits] = useState(2);
  const [gates, setGates] = useState<CircuitGate[]>([]);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(["Three-qubit gates"]));
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [pendingGateType, setPendingGateType] = useState<string | null>(null);
  const [showParamDialog, setShowParamDialog] = useState(false);
  const [paramValue, setParamValue] = useState(0);

  const addGate = (type: string, qubit: number, column: number, params?: number[]) => {
    const newGate: CircuitGate = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      qubit,
      column,
      params: params || [],
    };
    setGates([...gates, newGate]);
    setSelectedGateId(newGate.id);
    setPendingGateType(null);
  };

  const updateGateParams = (gateId: string, params: number[]) => {
    setGates(gates.map(g => g.id === gateId ? { ...g, params } : g));
  };

  const exportCircuit = () => {
    const circuit = {
      numQubits,
      gates: gates.map(g => ({
        type: g.type,
        qubit: g.qubit,
        targetQubit: g.targetQubit,
        column: g.column,
        params: g.params,
      })),
    };
    const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-circuit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Show success feedback
    console.log('Circuit exported successfully!');
  };

  const importCircuit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const circuit = JSON.parse(e.target?.result as string);
        setNumQubits(circuit.numQubits);
        setGates(circuit.gates.map((g: any) => ({
          ...g,
          id: `${g.type}-${Date.now()}-${Math.random()}`,
        })));
      } catch (err) {
        console.error('Failed to import circuit', err);
      }
    };
    reader.readAsText(file);
  };

  const removeGate = (id: string) => {
    setGates(gates.filter(g => g.id !== id));
    if (selectedGateId === id) setSelectedGateId(null);
  };

  const runCircuit = async () => {
    if (gates.length === 0) return;
    
    setIsRunning(true);
    setResults(null);
    
    try {
      const circuitGates = gates.map((g, idx) => ({
        gate: g.type,
        qubits: g.targetQubit !== undefined ? [g.qubit, g.targetQubit] : [g.qubit],
        moment: g.column,
        params: g.params || [],
      }));

      const res = await composerApi.simulate({
        num_qubits: numQubits,
        gates: circuitGates,
        shots: 1024,
      });
      
      setResults(res.data.probabilities);
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCircuit = () => {
    setGates([]);
    setSelectedGateId(null);
    setResults(null);
    setPendingGateType(null);
  };

  const toggleCategory = (name: string) => {
    const newSet = new Set(collapsedCategories);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setCollapsedCategories(newSet);
  };

  const selectedGate = gates.find(g => g.id === selectedGateId);
  const selectedGateDef = selectedGate ? GATE_CATEGORIES.flatMap(c => c.gates).find(g => g.type === selectedGate.type) : null;
  const needsParams = selectedGate && ['Rx', 'Ry', 'Rz', 'CRx'].includes(selectedGate.type);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected gate
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedGateId) {
          removeGate(selectedGateId);
        }
      }
      // Deselect gate
      if (e.key === 'Escape') {
        setSelectedGateId(null);
      }
      // Run circuit with Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (gates.length > 0 && !isRunning) {
          runCircuit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGateId, gates, isRunning]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1a0b3e" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ background: "#0f0628", borderBottom: "1px solid #2d1b5e" }}
      >
        <div className="flex items-center gap-4">
          {/* Play controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={runCircuit}
              disabled={isRunning || gates.length === 0}
              className="px-4 h-10 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: "#7209b7", color: "white" }}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap size={16} fill="white" />
                  Run Circuit
                </>
              )}
            </button>
            <button
              onClick={resetCircuit}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            >
              <Trash2 size={18} className="text-[#7d8590]" />
            </button>
            <button
              onClick={exportCircuit}
              disabled={gates.length === 0}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 disabled:opacity-30"
              title="Export circuit"
            >
              <Download size={18} className="text-[#7d8590]" />
            </button>
            <label className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 cursor-pointer" title="Import circuit">
              <Upload size={18} className="text-[#7d8590]" />
              <input type="file" accept=".json" onChange={importCircuit} className="hidden" />
            </label>
          </div>

          {/* Circuit name */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "#1a0b3e" }}>
            <span className="text-sm font-semibold text-white">Quantum Circuit</span>
          </div>
        </div>

        {/* Qubit controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7d8590] font-semibold">Qubits:</span>
          <button
            onClick={() => setNumQubits(Math.max(1, numQubits - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: "#1a0b3e" }}
          >
            <Minus size={14} className="text-white" />
          </button>
          <span className="text-lg font-bold text-white w-8 text-center">{numQubits}</span>
          <button
            onClick={() => setNumQubits(Math.min(5, numQubits + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: "#1a0b3e" }}
          >
            <Plus size={14} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left sidebar - Gate palette */}
        <div
          className="w-64 flex flex-col overflow-y-auto"
          style={{ background: "#0f0628", borderRight: "1px solid #2d1b5e" }}
        >
          <div className="p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Quantum Gates</h3>

            <div className="space-y-1">
              {GATE_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-white hover:bg-white/5 rounded transition-colors"
                  >
                    {category.name}
                    <ChevronRight
                      size={14}
                      className="transition-transform text-[#7d8590]"
                      style={{
                        transform: collapsedCategories.has(category.name) ? "rotate(0deg)" : "rotate(90deg)",
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {!collapsedCategories.has(category.name) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1 px-2 py-2"
                      >
                        {category.gates.map((gate) => (
                          <button
                            key={gate.type}
                            onClick={() => {
                              // Add to first available column on qubit 0
                              const maxCol = gates.length > 0 ? Math.max(...gates.map(g => g.column)) : -1;
                              addGate(gate.type, 0, maxCol + 1);
                            }}
                            className="w-full rounded-lg p-3 flex items-center gap-3 transition-all hover:bg-white/5"
                            style={{ border: "1px solid #2d1b5e" }}
                            title={gate.description}
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                              style={{ background: `${gate.color}30`, border: `1px solid ${gate.color}` }}
                            >
                              {gate.type}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-xs font-semibold text-white">{gate.label}</div>
                              <div className="text-[10px] text-[#7d8590]">{gate.description}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Circuit canvas */}
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 flex items-center justify-center p-8">
            {gates.length === 0 ? (
              <div className="text-center max-w-2xl">
                {/* Composer Illustration */}
                <div className="mb-8 flex justify-center">
                  <img 
                    src="/illustrations/composer.svg" 
                    alt="Quantum Composer" 
                    className="w-80 h-80 object-contain opacity-90"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">Build Your Quantum Circuit</h3>
                <p className="text-sm text-[#7d8590] mb-6">
                  Start by selecting gates from the left sidebar to create your quantum algorithm
                </p>
                
                {/* Quick Start Guide */}
                <div className="text-left space-y-3 p-6 rounded-2xl" style={{ background: "#0f062820", border: "1px solid #2d1b5e" }}>
                  <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Start</div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: "#7209b740" }}>
                      1
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Add Gates</div>
                      <div className="text-xs text-[#7d8590]">Click any gate from the palette to add it to your circuit</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: "#7209b740" }}>
                      2
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Adjust Parameters</div>
                      <div className="text-xs text-[#7d8590]">Select rotation gates (Rx, Ry, Rz) to set their angles</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: "#7209b740" }}>
                      3
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Run & Observe</div>
                      <div className="text-xs text-[#7d8590]">Hit "Run Circuit" to see measurement outcomes and quantum states</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <CircuitDisplay
                  numQubits={numQubits}
                  gates={gates}
                  onGateClick={setSelectedGateId}
                  onGateRemove={removeGate}
                  selectedGateId={selectedGateId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Results */}
        <div
          className="w-80 flex flex-col overflow-y-auto"
          style={{ background: "#0f0628", borderLeft: "1px solid #2d1b5e" }}
        >
          {/* Results */}
          <div className="p-4 border-b border-[#2d1b5e]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Measurement Outcomes</h3>
            
            {results ? (
              <div className="space-y-2">
                {Object.entries(results)
                  .filter(([, prob]) => prob > 0.01)
                  .sort((a, b) => b[1] - a[1])
                  .map(([state, prob]) => (
                    <div key={state} className="rounded-xl p-3" style={{ background: "#1a0b3e", border: "1px solid #2d1b5e" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono font-bold text-white">|{state}⟩</span>
                        <span className="text-sm font-bold text-[#7209b7]">{Math.round(prob * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2d1b5e" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "#7209b7" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${prob * 100}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-[#7d8590]">Run the circuit to see measurement probabilities</p>
              </div>
            )}
          </div>

          {/* Quantum State Visualization */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Quantum State</h3>
            
            <div className="mb-4">
              <BlochSphere />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#1a0b3e" }}>
                <span className="text-[#7d8590]">Qubits</span>
                <span className="text-white font-mono">{numQubits}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#1a0b3e" }}>
                <span className="text-[#7d8590]">Gates</span>
                <span className="text-white font-mono">{gates.length}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#1a0b3e" }}>
                <span className="text-[#7d8590]">Depth</span>
                <span className="text-white font-mono">{gates.length > 0 ? Math.max(...gates.map(g => g.column)) + 1 : 0}</span>
              </div>
            </div>
          </div>

          {/* Gate Properties Panel */}
          {selectedGate && (
            <div className="p-4 border-t border-[#2d1b5e]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Gate Properties</h3>
              
              <div className="rounded-xl p-4 mb-4" style={{ background: "#1a0b3e", border: `2px solid ${selectedGateDef?.color}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-base font-bold text-white"
                    style={{ background: `${selectedGateDef?.color}40`, border: `1px solid ${selectedGateDef?.color}` }}
                  >
                    {selectedGate.type}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{selectedGateDef?.label}</div>
                    <div className="text-xs text-[#7d8590]">{selectedGateDef?.description}</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7d8590]">Qubit</span>
                    <span className="text-white font-mono">q{selectedGate.qubit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7d8590]">Column</span>
                    <span className="text-white font-mono">{selectedGate.column}</span>
                  </div>
                </div>
              </div>

              {/* Parameter Controls for Rotation Gates */}
              {needsParams && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-white mb-2">Rotation Angle</div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={Math.PI * 2}
                      step="0.01"
                      value={selectedGate.params?.[0] || 0}
                      onChange={(e) => updateGateParams(selectedGate.id, [parseFloat(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7d8590]">θ =</span>
                      <span className="text-white font-mono">
                        {(selectedGate.params?.[0] || 0).toFixed(3)} rad
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7d8590]">θ =</span>
                      <span className="text-white font-mono">
                        {((selectedGate.params?.[0] || 0) * 180 / Math.PI).toFixed(1)}°
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick angle presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '0', value: 0 },
                      { label: 'π/4', value: Math.PI / 4 },
                      { label: 'π/2', value: Math.PI / 2 },
                      { label: 'π', value: Math.PI },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => updateGateParams(selectedGate.id, [preset.value])}
                        className="px-2 py-1.5 rounded text-xs font-mono transition-all"
                        style={{
                          background: Math.abs((selectedGate.params?.[0] || 0) - preset.value) < 0.01 ? "#7209b7" : "#1a0b3e",
                          border: "1px solid #2d1b5e",
                          color: "white",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <div className="p-4 border-t border-[#2d1b5e] mt-auto">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Keyboard Shortcuts</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#7d8590]">
                <span>Run circuit</span>
                <kbd className="px-2 py-1 rounded font-mono text-[10px]" style={{ background: "#1a0b3e", border: "1px solid #2d1b5e" }}>
                  Ctrl+Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between text-[#7d8590]">
                <span>Delete gate</span>
                <kbd className="px-2 py-1 rounded font-mono text-[10px]" style={{ background: "#1a0b3e", border: "1px solid #2d1b5e" }}>
                  Del
                </kbd>
              </div>
              <div className="flex items-center justify-between text-[#7d8590]">
                <span>Deselect</span>
                <kbd className="px-2 py-1 rounded font-mono text-[10px]" style={{ background: "#1a0b3e", border: "1px solid #2d1b5e" }}>
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className="flex items-center justify-around px-6 py-5"
        style={{
          background: "#0f0628",
          borderTop: "1px solid #2d1b5e",
        }}
      >
        {[
          { href: "/explorer", icon: Map, label: "Map", active: false, color: "#4f8ef7" },
          { href: "/explorer/lab", icon: Beaker, label: "Composer", active: true, color: "#c44ff7" },
          { href: "/explorer/games", icon: Gamepad2, label: "Games", active: false, color: "#f7c94f" },
          { href: "/explorer/journey", icon: Trophy, label: "Progress", active: false, color: "#4ff7a4" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: item.active ? `${item.color}15` : "transparent",
                  border: item.active ? `1.5px solid ${item.color}60` : "1.5px solid transparent",
                  boxShadow: item.active ? `0 4px 20px ${item.color}30` : "none",
                }}
              >
                <item.icon size={20} style={{ color: item.active ? item.color : "#484f68", strokeWidth: item.active ? 2.5 : 2 }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: item.active ? item.color : "#484f68" }}>
                {item.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

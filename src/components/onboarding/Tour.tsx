"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTourStore } from "@/store/tourStore";
import { X, ArrowRight, ArrowLeft, BookOpen, FlaskConical, Cpu, Satellite, Sparkles, Map } from "lucide-react";

/* ─── Tour step definitions ──────────────────────────────────────────────── */
const STEPS = [
  {
    title: "Welcome to QUBIT",
    icon: Sparkles,
    color: "#4f46e5",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-[#52525b] leading-relaxed">
          QUBIT is an AI-powered quantum computing platform with three distinct experiences
          built on the same core — choose the one that fits you.
        </p>
        <div className="space-y-2">
          {[
            { icon: "🎮", label: "Explorer", desc: "Kids & beginners — quantum as a game", color: "#3b3aff", href: "/explorer" },
            { icon: "📚", label: "Learner",  desc: "Students & professionals — learn, build, simulate", color: "#4f46e5", href: "/" },
            { icon: "🔬", label: "Researcher",desc: "Advanced users — research workspace", color: "#58a6ff", href: "/research" },
          ].map((xp) => (
            <div key={xp.label} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: `${xp.color}08`, border: `1px solid ${xp.color}20` }}>
              <span className="text-lg">{xp.icon}</span>
              <div>
                <span className="text-xs font-semibold text-[#111118]">{xp.label}</span>
                <span className="text-xs text-[#71717a] ml-2">{xp.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#a1a1aa]">Switch anytime from the navigation bar.</p>
      </div>
    ),
    action: { label: "Choose experience", href: "/select" },
  },
  {
    title: "1 · Codebook — Start learning",
    icon: BookOpen,
    color: "#4f46e5",
    content: (
      <div className="space-y-3">
        <div
          className="rounded-lg border p-3 text-xs font-mono leading-relaxed"
          style={{ background: "#0d1117", color: "#e6edf3", borderColor: "#21262d" }}
        >
          <span style={{ color: "#7ee787" }}>Codebook Map</span>
          {" → "}
          <span style={{ color: "#79c0ff" }}>Learning Path</span>
          {" → "}
          <span style={{ color: "#ffa657" }}>Module</span>
          {" → "}
          <span style={{ color: "#e6edf3" }}>Lesson</span>
        </div>
        <p className="text-sm text-[#52525b] leading-relaxed">
          The <strong>Codebook Map</strong> is a visual graph of every learning module.
          Click any node to open it, or follow a curated <strong>Learning Path</strong>.
        </p>
        <p className="text-sm text-[#52525b] leading-relaxed">
          Each lesson combines theory with <strong>LaTeX math</strong>, circuit diagrams,
          and live <strong>Codercises</strong> — interactive coding exercises where you
          write Python and run it directly in the browser.
        </p>
        <ul className="space-y-1 text-xs text-[#71717a]">
          <li>· Click any codercise to expand it</li>
          <li>· Use the hint button if you're stuck</li>
          <li>· Press <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: "#f0f0f2", color: "#111118" }}>Run</kbd> to execute your code and check tests</li>
        </ul>
      </div>
    ),
    action: { label: "Open Codebook", href: "/codebook" },
  },
  {
    title: "2 · Quantum Composer — Build circuits",
    icon: FlaskConical,
    color: "#7c3aed",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-[#52525b] leading-relaxed">
          The Composer is a visual quantum circuit editor modelled after IBM Quantum Composer.
          Add gates by clicking them in the palette, then click the circuit canvas to place them.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Gate palette", "Left panel — Clifford, Rotation, Two-qubit, Measure gates"],
            ["Circuit canvas", "Click a wire cell to place the selected gate"],
            ["Code panel", "Editable — supports Qiskit, PennyLane, Cirq, QpiAI, qBraid, OpenQASM 3"],
            ["Simulate", "Run on Qiskit Aer, see probabilities, Bloch sphere & Q-sphere"],
          ].map(([t, d]) => (
            <div key={t} className="rounded p-2.5" style={{ background: "#f7f7f8", border: "1px solid #e4e4e7" }}>
              <p className="text-xs font-semibold text-[#111118] mb-0.5">{t}</p>
              <p className="text-[11px] text-[#71717a] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#71717a]">
          Tip: switch the framework dropdown to generate idiomatic code for any quantum SDK.
        </p>
      </div>
    ),
    action: { label: "Open Composer", href: "/composer" },
  },
  {
    title: "3 · Algorithm Playground — Experiment",
    icon: Cpu,
    color: "#0891b2",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-[#52525b] leading-relaxed">
          The Playground lets you run real quantum algorithms and inspect their results —
          no circuit-building required. Choose an algorithm, set its parameters, and run.
        </p>
        <div className="space-y-1.5">
          {[
            ["Deutsch-Jozsa", "Determines if a function is constant or balanced in one query"],
            ["Grover's Search", "Quadratic speedup for unstructured search — O(√N) queries"],
            ["Quantum Fourier Transform", "Core of Shor's algorithm and QPE"],
            ["Bernstein-Vazirani", "Recovers a hidden bit string in a single query"],
          ].map(([name, desc]) => (
            <div key={name} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "#0891b2" }} />
              <div>
                <span className="text-xs font-semibold text-[#111118]">{name}</span>
                <span className="text-xs text-[#71717a]"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#71717a]">
          Each result shows the measurement probability histogram and the circuit QASM.
        </p>
      </div>
    ),
    action: { label: "Open Playground", href: "/playground" },
  },
  {
    title: "4 · Quantum Infrastructure — Real hardware",
    icon: Satellite,
    color: "#059669",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-[#52525b] leading-relaxed">
          <strong>Quantum Infrastructure</strong> connects QUBIT to real quantum hardware via{" "}
          <strong>Origin Quantum Cloud</strong> — backed by Origin Pilot OS and QPanda3 Runtime.
        </p>
        <p className="text-sm text-[#52525b] leading-relaxed">
          Submit circuits built in the Composer directly to Origin Wukong superconducting QPUs — no vendor lock-in.
        </p>
        <div
          className="rounded p-3 text-xs leading-relaxed"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
        >
          Origin Pilot is the world's first open-source quantum OS — open-sourced Feb 2026 by Origin Quantum, Hefei.
        </div>
      </div>
    ),
    action: { label: "View Infrastructure", href: "/infrastructure" },
  },
  {
    title: "5 · AI Agent — Your quantum tutor",
    icon: Sparkles,
    color: "#4f46e5",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-[#52525b] leading-relaxed">
          The AI agent lives in the bottom-right corner of every page. It's context-aware —
          it knows which lesson you're on, what your code looks like, and what your last
          simulation returned.
        </p>
        <p className="text-sm text-[#52525b] leading-relaxed">
          Ask it to explain a concept, help debug code, interpret simulation results,
          or suggest what to learn next.
        </p>
        <div className="space-y-1.5">
          {[
            "What is superposition?",
            "Why does measuring give 50% each time?",
            "Help me debug my normalize_state function",
            "What should I learn after Bell states?",
          ].map((q) => (
            <div
              key={q}
              className="px-3 py-1.5 rounded text-xs text-[#111118]"
              style={{ background: "#f0f0f2", border: "1px solid #e4e4e7" }}
            >
              "{q}"
            </div>
          ))}
        </div>
      </div>
    ),
    action: null,
  },
  {
    title: "You're ready to start",
    icon: Map,
    color: "#4f46e5",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-[#52525b] leading-relaxed">
          Here's the recommended journey through the <strong>Learner</strong> experience:
        </p>
        <div className="space-y-0 border border-[#e4e4e7] rounded-lg overflow-hidden">
          {[
            ["1", "Codebook",               "Start with Foundations of Quantum Computing",    "#4f46e5"],
            ["2", "Composer",               "Build circuits and simulate with Qiskit Aer",   "#7c3aed"],
            ["3", "Playground",             "Run full algorithms, compare approaches",         "#0891b2"],
            ["4", "Quantum Infrastructure", "Submit to real quantum hardware",                "#059669"],
          ].map(([n, title, desc, color], i, arr) => (
            <div
              key={title}
              className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? "border-b border-[#f0f0f2]" : ""}`}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: color }}
              >
                {n}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#111118]">{title}</p>
                <p className="text-xs text-[#71717a]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#a1a1aa]">
          Or try <strong>Explorer</strong> for a game-like introduction, or <strong>Researcher</strong> for a dense workspace.
          Switch anytime from the nav.
        </p>
      </div>
    ),
    action: { label: "Start with Codebook", href: "/codebook" },
  },
];

/* ─── Tour overlay ───────────────────────────────────────────────────────── */
export default function Tour() {
  const { open, step, total, closeTour, nextStep, prevStep, goToStep, markSeen } = useTourStore();
  const router = useRouter();

  const current = STEPS[step];
  const Icon    = current.icon;
  const isLast  = step === total - 1;

  const handleAction = () => {
    if (current.action) {
      markSeen();
      closeTour();
      router.push(current.action.href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={closeTour}
          />

          {/* Modal */}
          <motion.div
            key="tour-modal"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed z-[70] bg-white rounded-xl shadow-2xl flex flex-col"
            style={{
              width: 520,
              maxHeight: "86vh",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-[#f0f0f2] shrink-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${current.color}18` }}
              >
                <Icon size={18} style={{ color: current.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#111118] leading-snug">
                  {current.title}
                </h2>
                <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                  Step {step + 1} of {total}
                </p>
              </div>
              <button
                onClick={closeTour}
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ color: "#a1a1aa" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f2"; (e.currentTarget as HTMLElement).style.color = "#111118"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#a1a1aa"; }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  {current.content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-3 border-t border-[#f0f0f2] shrink-0">
              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {Array.from({ length: total }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      background: i === step ? current.color : "#e4e4e7",
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={closeTour}
                  className="text-xs text-[#a1a1aa] hover:text-[#71717a] transition-colors mr-auto"
                >
                  Skip tour
                </button>
                {step > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-[#52525b] transition-colors"
                    style={{ border: "1px solid #e4e4e7" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#f7f7f8"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                )}
                {current.action && (
                  <button
                    onClick={handleAction}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors"
                    style={{ border: `1px solid ${current.color}40`, color: current.color, background: `${current.color}0e` }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = `${current.color}18`}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = `${current.color}0e`}
                  >
                    {current.action.label}
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: current.color }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                >
                  {isLast ? "Get started" : "Next"}
                  {!isLast && <ArrowRight size={13} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

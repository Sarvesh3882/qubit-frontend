/**
 * Placement Assessment Store
 *
 * Tracks the one-time placement quiz result and drives the adaptive
 * starting point for each learner. Persisted to localStorage.
 *
 * The assessment is NOT a hard lock — it only sets the initial
 * recommended starting point. The learner can always revisit.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Assessment question types ──────────────────────────────────────────────

export type QuestionType =
  | "concept_pick"   // pick the right definition/concept
  | "visual_match"   // match a circuit diagram to its description
  | "true_false"     // true / false statement
  | "code_read";     // read a code snippet and pick what it does

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  concept: string;           // e.g. "superposition", "gates", "entanglement"
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;       // shown after answering
  visualHint?: string;       // optional equation / ascii art shown alongside question
}

// ── Result of a completed assessment ──────────────────────────────────────

export interface AssessmentResult {
  completedAt: string;        // ISO date
  totalQuestions: number;
  correctAnswers: number;
  score: number;              // 0–100
  level: "beginner" | "intermediate" | "advanced";
  strongConcepts: string[];
  weakConcepts: string[];
  recommendedPathId: string;
  recommendedModuleId: string;
  suggestedDifficulty: "normal" | "accelerated" | "review";
  perConceptScores: Record<string, number>; // concept → 0-100
}

// ── State ──────────────────────────────────────────────────────────────────

interface AssessmentState {
  completed: boolean;
  result: AssessmentResult | null;
  skipped: boolean;

  // in-progress state (not persisted beyond the session)
  currentQuestionIndex: number;
  answers: Record<string, number>; // questionId → chosen option index

  // actions
  startAssessment: () => void;
  recordAnswer: (questionId: string, optionIndex: number) => void;
  submitAssessment: (questions: AssessmentQuestion[]) => AssessmentResult;
  skipAssessment: () => void;
  retakeAssessment: () => void;
  goToQuestion: (index: number) => void;
}

// ── Scoring helpers ────────────────────────────────────────────────────────

function computeResult(
  questions: AssessmentQuestion[],
  answers: Record<string, number>
): AssessmentResult {
  const perConcept: Record<string, { correct: number; total: number }> = {};

  let totalCorrect = 0;
  for (const q of questions) {
    if (!perConcept[q.concept]) perConcept[q.concept] = { correct: 0, total: 0 };
    perConcept[q.concept].total++;
    if (answers[q.id] === q.correctIndex) {
      totalCorrect++;
      perConcept[q.concept].correct++;
    }
  }

  const score = Math.round((totalCorrect / questions.length) * 100);

  const perConceptScores: Record<string, number> = {};
  const strongConcepts: string[] = [];
  const weakConcepts: string[] = [];

  for (const [concept, { correct, total }] of Object.entries(perConcept)) {
    const pct = Math.round((correct / total) * 100);
    perConceptScores[concept] = pct;
    if (pct >= 70) strongConcepts.push(concept);
    else weakConcepts.push(concept);
  }

  // Determine level and recommended starting point
  let level: AssessmentResult["level"];
  let recommendedPathId: string;
  let recommendedModuleId: string;
  let suggestedDifficulty: AssessmentResult["suggestedDifficulty"];

  if (score >= 75) {
    level = "advanced";
    recommendedPathId = "fqa";
    recommendedModuleId = "qalgo-dj";
    suggestedDifficulty = "accelerated";
  } else if (score >= 45) {
    level = "intermediate";
    recommendedPathId = "fqc";
    recommendedModuleId = weakConcepts.includes("gates") ? "sq" : "mq";
    suggestedDifficulty = "normal";
  } else {
    level = "beginner";
    recommendedPathId = "fqc";
    recommendedModuleId = "iqc";
    suggestedDifficulty = score < 20 ? "review" : "normal";
  }

  return {
    completedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    correctAnswers: totalCorrect,
    score,
    level,
    strongConcepts,
    weakConcepts,
    recommendedPathId,
    recommendedModuleId,
    suggestedDifficulty,
    perConceptScores,
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      completed: false,
      result: null,
      skipped: false,
      currentQuestionIndex: 0,
      answers: {},

      startAssessment: () =>
        set({ currentQuestionIndex: 0, answers: {}, completed: false, skipped: false }),

      recordAnswer: (questionId, optionIndex) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: optionIndex } })),

      submitAssessment: (questions) => {
        const result = computeResult(questions, get().answers);
        set({ completed: true, result });
        return result;
      },

      skipAssessment: () =>
        set({
          skipped: true,
          completed: true,
          result: {
            completedAt: new Date().toISOString(),
            totalQuestions: 0,
            correctAnswers: 0,
            score: 0,
            level: "beginner",
            strongConcepts: [],
            weakConcepts: [],
            recommendedPathId: "fqc",
            recommendedModuleId: "iqc",
            suggestedDifficulty: "normal",
            perConceptScores: {},
          },
        }),

      retakeAssessment: () =>
        set({ completed: false, result: null, skipped: false, currentQuestionIndex: 0, answers: {} }),

      goToQuestion: (index) => set({ currentQuestionIndex: index }),
    }),
    {
      name: "qubit-assessment",
      // only persist completion result, not in-progress state
      partialize: (s) => ({ completed: s.completed, result: s.result, skipped: s.skipped }),
    }
  )
);

// ── Assessment questions bank ──────────────────────────────────────────────

export const PLACEMENT_QUESTIONS: AssessmentQuestion[] = [
  // ── Beginner: Superposition ────────────────────────────────────────────
  {
    id: "q-super-1",
    type: "concept_pick",
    concept: "superposition",
    difficulty: "beginner",
    question: "A qubit in superposition is best described as:",
    options: [
      "Stuck between 0 and 1, like a coin balanced on its edge",
      "Simultaneously in both |0⟩ and |1⟩ with complex amplitudes",
      "A random bit that changes value every millisecond",
      "Two classical bits combined into one",
    ],
    correctIndex: 1,
    explanation:
      "A qubit in superposition is described by |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex amplitudes — not a coin or a random bit.",
    visualHint: "|ψ⟩ = α|0⟩ + β|1⟩,  |α|² + |β|² = 1",
  },
  {
    id: "q-super-2",
    type: "true_false",
    concept: "superposition",
    difficulty: "beginner",
    question: "Measuring a qubit in superposition always gives a 50/50 outcome.",
    options: ["True", "False"],
    correctIndex: 1,
    explanation:
      "False. The measurement probabilities are |α|² and |β|², which can be any values as long as they sum to 1. Only equal amplitudes give 50/50.",
    visualHint: "P(0) = |α|²,  P(1) = |β|²",
  },
  // ── Beginner: Normalization ─────────────────────────────────────────────
  {
    id: "q-norm-1",
    type: "concept_pick",
    concept: "normalization",
    difficulty: "beginner",
    question: "Which of these is a valid, normalized qubit state?",
    options: [
      "|ψ⟩ = |0⟩ + |1⟩",
      "|ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩",
      "|ψ⟩ = 0.9|0⟩ + 0.9|1⟩",
      "|ψ⟩ = 2|0⟩ − |1⟩",
    ],
    correctIndex: 1,
    explanation:
      "Option B: |1/√2|² + |1/√2|² = 1/2 + 1/2 = 1 ✓. The others violate the normalization condition |α|² + |β|² = 1.",
  },
  // ── Intermediate: Gates ────────────────────────────────────────────────
  {
    id: "q-gates-1",
    type: "concept_pick",
    concept: "gates",
    difficulty: "intermediate",
    question: "What does the Hadamard gate H do when applied to |0⟩?",
    options: [
      "Flips it to |1⟩",
      "Leaves it unchanged",
      "Creates equal superposition: (|0⟩ + |1⟩)/√2",
      "Applies a phase of −1 to |0⟩",
    ],
    correctIndex: 2,
    explanation: "H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩. This is superposition creation — H is the most fundamental gate in quantum computing.",
    visualHint: "H = (1/√2)[[1,1],[1,−1]]",
  },
  {
    id: "q-gates-2",
    type: "code_read",
    concept: "gates",
    difficulty: "intermediate",
    question: "What quantum state does this code produce?\n\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.h(0)",
    options: [
      "|0⟩",
      "|1⟩",
      "(|0⟩ + |1⟩)/√2  =  |+⟩",
      "(|0⟩ − |1⟩)/√2  =  |−⟩",
    ],
    correctIndex: 3,
    explanation:
      "X flips |0⟩ → |1⟩, then H|1⟩ = (|0⟩ − |1⟩)/√2 = |−⟩. The minus sign comes from H acting on |1⟩.",
    visualHint: "H|1⟩ = (|0⟩ − |1⟩)/√2",
  },
  {
    id: "q-gates-3",
    type: "true_false",
    concept: "gates",
    difficulty: "intermediate",
    question: "Every quantum gate must be a unitary matrix (satisfying UU† = I).",
    options: ["True", "False"],
    correctIndex: 0,
    explanation:
      "True. Unitarity guarantees reversibility (any gate can be undone) and norm preservation (total probability stays 1).",
    visualHint: "UU† = U†U = I",
  },
  // ── Intermediate: Measurement ──────────────────────────────────────────
  {
    id: "q-meas-1",
    type: "concept_pick",
    concept: "measurement",
    difficulty: "intermediate",
    question: "After measuring a qubit in state |ψ⟩ = α|0⟩ + β|1⟩ and getting outcome 0, the qubit is now in state:",
    options: [
      "Still α|0⟩ + β|1⟩ — measurement doesn't change anything",
      "|0⟩ — the state collapses to the measured outcome",
      "α|0⟩ — partial collapse retains the amplitude",
      "A new random superposition",
    ],
    correctIndex: 1,
    explanation:
      "Measurement causes wavefunction collapse. After observing outcome 0, the qubit is definitively in |0⟩ — the superposition is destroyed.",
  },
  // ── Intermediate: Entanglement ─────────────────────────────────────────
  {
    id: "q-ent-1",
    type: "concept_pick",
    concept: "entanglement",
    difficulty: "intermediate",
    question: "The Bell state (|00⟩ + |11⟩)/√2 is 'maximally entangled'. What does this mean?",
    options: [
      "Both qubits are always in state |0⟩",
      "The qubits are physically connected by a wire",
      "Measuring one qubit instantly determines the other's outcome, regardless of distance",
      "The state has the maximum possible energy",
    ],
    correctIndex: 2,
    explanation:
      "In the Bell state, the qubits are perfectly correlated: measuring qubit 0 as 0 guarantees qubit 1 is 0, and vice versa. This non-classical correlation is entanglement.",
    visualHint: "|Φ+⟩ = (|00⟩ + |11⟩)/√2",
  },
  {
    id: "q-ent-2",
    type: "code_read",
    concept: "entanglement",
    difficulty: "intermediate",
    question: "What does this 2-qubit circuit create?\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)",
    options: [
      "Two independent qubits in superposition",
      "A Bell state — the maximally entangled state (|00⟩ + |11⟩)/√2",
      "The state |01⟩",
      "An error — cx requires both qubits to be in |+⟩",
    ],
    correctIndex: 1,
    explanation:
      "H on qubit 0 → (|0⟩+|1⟩)/√2 ⊗ |0⟩ = (|00⟩+|10⟩)/√2. Then CX flips qubit 1 when qubit 0 = 1: → (|00⟩+|11⟩)/√2. That is the Bell state |Φ+⟩.",
    visualHint: "H⊗I → CX → (|00⟩ + |11⟩)/√2",
  },
  // ── Advanced: Algorithms ───────────────────────────────────────────────
  {
    id: "q-algo-1",
    type: "concept_pick",
    concept: "algorithms",
    difficulty: "advanced",
    question: "Grover's search algorithm provides a quantum speedup of approximately:",
    options: [
      "Exponential speedup over classical — O(log N) vs O(N)",
      "Quadratic speedup — O(√N) quantum vs O(N) classical",
      "No speedup — it has the same complexity as binary search",
      "Linear speedup — O(N/2) quantum vs O(N) classical",
    ],
    correctIndex: 1,
    explanation:
      "Grover's algorithm searches an unstructured database of N items in O(√N) queries, compared to O(N) classically. This is a proven quadratic speedup.",
  },
  {
    id: "q-algo-2",
    type: "concept_pick",
    concept: "algorithms",
    difficulty: "advanced",
    question: "The Quantum Fourier Transform (QFT) is a key subroutine in Shor's algorithm because it:",
    options: [
      "Generates random numbers exponentially faster",
      "Efficiently finds the period of a function, which classical FFT can't do at scale",
      "Directly factorizes integers without any classical post-processing",
      "Applies Grover's diffusion operator to all basis states simultaneously",
    ],
    correctIndex: 1,
    explanation:
      "Shor's algorithm uses QFT to find the period of f(x) = aˣ mod N. The QFT acts on O(log N) qubits and runs in O((log N)²) time vs O(N log N) for classical FFT at comparable precision.",
  },
  // ── Advanced: Bloch Sphere ─────────────────────────────────────────────
  {
    id: "q-bloch-1",
    type: "visual_match",
    concept: "bloch",
    difficulty: "advanced",
    question: "A qubit at the north pole of the Bloch sphere (θ = 0) is in state:",
    options: [
      "|1⟩",
      "|+⟩ = (|0⟩ + |1⟩)/√2",
      "|0⟩",
      "|-⟩ = (|0⟩ − |1⟩)/√2",
    ],
    correctIndex: 2,
    explanation:
      "In the Bloch sphere representation |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩, setting θ=0 gives |ψ⟩ = |0⟩. The north pole is |0⟩, the south pole is |1⟩.",
    visualHint: "|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩",
  },
];

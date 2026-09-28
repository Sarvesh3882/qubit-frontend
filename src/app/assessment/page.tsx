"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  useAssessmentStore,
  PLACEMENT_QUESTIONS,
  type AssessmentResult,
} from "@/store/assessmentStore";
import { useAdaptiveStore } from "@/store/adaptiveStore";
import { assessmentApi, adaptiveApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  BookOpen,
  Zap,
  Trophy,
  ChevronRight,
  SkipForward,
} from "lucide-react";

/* ── helpers ──────────────────────────────────────────────────────────── */
const CONCEPT_LABELS: Record<string, string> = {
  superposition: "Superposition",
  normalization: "State Normalization",
  gates: "Quantum Gates",
  measurement: "Measurement",
  entanglement: "Entanglement",
  algorithms: "Quantum Algorithms",
  bloch: "Bloch Sphere",
};

const LEVEL_META = {
  beginner: {
    label: "Quantum Beginner",
    color: "#4f8ef7",
    bg: "#4f8ef712",
    border: "#4f8ef740",
    desc: "You're just starting your quantum journey — that's exciting! We'll begin from the very first principles.",
    icon: BookOpen,
  },
  intermediate: {
    label: "Quantum Learner",
    color: "#f7c94f",
    bg: "#f7c94f12",
    border: "#f7c94f40",
    desc: "You have some quantum intuition already. We'll place you where it makes most sense to continue.",
    icon: Zap,
  },
  advanced: {
    label: "Quantum Practitioner",
    color: "#4ff7a4",
    bg: "#4ff7a412",
    border: "#4ff7a440",
    desc: "Impressive! You have solid quantum foundations. We'll fast-track you to the advanced material.",
    icon: Trophy,
  },
};

/* ── Step 0: Welcome screen ───────────────────────────────────────────── */
function WelcomeScreen({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center px-6 py-16"
    >
      {/* Illustration */}
      <div className="relative w-48 h-48 mx-auto mb-10">
        <Image
          src="/illustrations/studentquantumcomputing.svg"
          alt="Quantum learner"
          fill
          className="object-contain"
        />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4f46e5]/10 border border-[#4f46e5]/20 text-[#4f46e5] text-xs font-semibold mb-6">
        <Sparkles size={12} />
        Placement Assessment
      </div>

      <h1 className="text-3xl font-black text-[#111118] mb-4 leading-tight">
        Let's find your<br />quantum starting point
      </h1>

      <p className="text-[#52525b] leading-relaxed mb-3 max-w-lg mx-auto">
        Answer <strong>12 short questions</strong> — concepts, visuals, and a little code — and
        we'll tailor your Codebook to where you actually are right now.
      </p>
      <p className="text-sm text-[#a1a1aa] mb-10 max-w-md mx-auto">
        Takes about 5 minutes. No pressure — wrong answers just help us understand
        where to focus. You can retake it anytime.
      </p>

      {/* Concept chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {Object.values(CONCEPT_LABELS).map((label) => (
          <span
            key={label}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#f7f7f8] text-[#52525b] border border-[#e4e4e7]"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#4f46e5] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#4f46e5]/20 hover:bg-[#4338ca] transition-colors"
        >
          Start Assessment <ArrowRight size={16} />
        </motion.button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 px-6 py-3 text-[#71717a] hover:text-[#111118] text-sm font-medium transition-colors"
        >
          <SkipForward size={14} />
          Skip — start from the beginning
        </button>
      </div>
    </motion.div>
  );
}

/* ── Question card ────────────────────────────────────────────────────── */
function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  revealed,
  onSelect,
}: {
  question: (typeof PLACEMENT_QUESTIONS)[0];
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  revealed: boolean;
  onSelect: (idx: number) => void;
}) {
  const isCode = question.type === "code_read";

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="max-w-2xl mx-auto px-4"
    >
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2 text-xs text-[#a1a1aa]">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span className="font-medium text-[#4f46e5]">
            {CONCEPT_LABELS[question.concept] ?? question.concept} ·{" "}
            <span className="capitalize">{question.difficulty}</span>
          </span>
        </div>
        <div className="h-1.5 bg-[#f0f0f2] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#4f46e5] rounded-full"
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question text */}
      {isCode ? (
        <div className="mb-6">
          <p className="text-[#111118] font-semibold text-base leading-relaxed mb-4">
            {question.question.split("\n")[0]}
          </p>
          <pre className="bg-[#0d1117] text-[#e6edf3] rounded-xl px-5 py-4 text-sm font-mono leading-relaxed overflow-x-auto border border-[#21262d]">
            {question.question.split("\n").slice(1).join("\n").trim()}
          </pre>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-[#111118] font-semibold text-lg leading-relaxed">
            {question.question}
          </p>
          {question.visualHint && (
            <div className="mt-3 px-4 py-2.5 bg-[#f7f7f8] border border-[#e4e4e7] rounded-lg inline-block">
              <code className="text-sm font-mono text-[#4f46e5]">{question.visualHint}</code>
            </div>
          )}
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === question.correctIndex;
          let borderColor = "#e4e4e7";
          let bg = "white";
          let textColor = "#111118";

          if (revealed) {
            if (isCorrect) { borderColor = "#16a34a"; bg = "#f0fdf4"; textColor = "#15803d"; }
            else if (isSelected && !isCorrect) { borderColor = "#dc2626"; bg = "#fef2f2"; textColor = "#dc2626"; }
          } else if (isSelected) {
            borderColor = "#4f46e5";
            bg = "#eef2ff";
            textColor = "#4f46e5";
          }

          return (
            <motion.button
              key={idx}
              whileHover={!revealed ? { scale: 1.01, x: 2 } : {}}
              whileTap={!revealed ? { scale: 0.99 } : {}}
              onClick={() => !revealed && onSelect(idx)}
              className="w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-start gap-3"
              style={{ borderColor, background: bg, color: textColor }}
            >
              {/* Option letter */}
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{
                  background: isSelected || (revealed && isCorrect) ? textColor : "#f0f0f2",
                  color: isSelected || (revealed && isCorrect) ? "white" : "#71717a",
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-sm leading-relaxed">{option}</span>

              {revealed && isCorrect && (
                <CheckCircle size={18} className="ml-auto shrink-0 mt-0.5 text-[#16a34a]" />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle size={18} className="ml-auto shrink-0 mt-0.5 text-[#dc2626]" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation (after reveal) */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 px-5 py-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl"
          >
            <p className="text-sm text-[#15803d] leading-relaxed">
              <strong>Explanation:</strong> {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Results screen ───────────────────────────────────────────────────── */

// Maps each module to what it teaches — used for actionable guidance
const MODULE_CONCEPTS: Record<string, string[]> = {
  iqc:            ["superposition", "normalization", "measurement"],
  sq:             ["gates", "bloch"],
  mq:             ["entanglement", "gates"],
  "qalgo-dj":     ["algorithms", "gates"],
  "qalgo-grover": ["algorithms"],
};

const MODULE_META: Record<string, { title: string; pathId: string; desc: string }> = {
  iqc:            { title: "Intro to Quantum Computing", pathId: "fqc", desc: "Qubits, superposition and measurement" },
  sq:             { title: "Single-Qubit Gates",         pathId: "fqc", desc: "H, X, Y, Z gates and the Bloch sphere" },
  mq:             { title: "Multi-Qubit Systems",        pathId: "fqc", desc: "Entanglement, CNOT and Bell states" },
  "qalgo-dj":     { title: "Deutsch-Jozsa Algorithm",   pathId: "fqa", desc: "Your first quantum algorithm advantage" },
  "qalgo-grover": { title: "Grover's Search",            pathId: "fqa", desc: "Quadratic speedup via amplitude amplification" },
};

function ResultsScreen({
  result,
  onContinue,
  onRetake,
}: {
  result: AssessmentResult;
  onContinue: () => void;
  onRetake: () => void;
}) {
  const meta = LEVEL_META[result.level];
  const Icon = meta.icon;

  // Build a narrative: what the learner knows, what they need, what's next
  const strongList = result.strongConcepts.map((c) => CONCEPT_LABELS[c] ?? c);
  const weakList   = result.weakConcepts.map((c) => CONCEPT_LABELS[c] ?? c);
  const recModule  = MODULE_META[result.recommendedModuleId];

  // Explain why each recommended starting module was chosen
  const whyRec = (() => {
    if (result.weakConcepts.length === 0 && result.score >= 75)
      return "You demonstrated solid foundations — we're placing you at the algorithms track.";
    if (result.weakConcepts.length > 0) {
      const focus = result.weakConcepts.slice(0, 2).map((c) => CONCEPT_LABELS[c] ?? c).join(" and ");
      return `Your answers show that ${focus} need attention. Starting here builds exactly those foundations.`;
    }
    return "This is where your knowledge level best matches the material.";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-6 py-10"
    >
      {/* Level identity — lead with what matters */}
      <div className="flex items-start gap-5 mb-8 p-6 rounded-2xl border"
        style={{ background: meta.bg, borderColor: meta.border }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${meta.color}20` }}
        >
          <Icon size={28} style={{ color: meta.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-black" style={{ color: meta.color }}>{meta.label}</h2>
            <span className="text-sm font-bold text-[#a1a1aa]">{result.score}/100</span>
          </div>
          <p className="text-sm text-[#52525b] leading-relaxed">{meta.desc}</p>
        </div>
      </div>

      {/* What you know / what needs work — side by side */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]">
          <p className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider mb-2.5">
            ✓ You understand
          </p>
          {strongList.length > 0 ? (
            <ul className="space-y-1.5">
              {strongList.map((label) => (
                <li key={label} className="flex items-center gap-2 text-xs text-[#15803d] font-medium">
                  <CheckCircle size={11} className="shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#71717a]">No strong concepts yet — that's fine, you're just starting.</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
          <p className="text-[10px] font-bold text-[#92400e] uppercase tracking-wider mb-2.5">
            ↻ Needs attention
          </p>
          {weakList.length > 0 ? (
            <ul className="space-y-1.5">
              {weakList.map((label) => (
                <li key={label} className="flex items-center gap-2 text-xs text-[#92400e] font-medium">
                  <XCircle size={11} className="shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#71717a]">No weak areas identified — impressive!</p>
          )}
        </div>
      </div>

      {/* Recommended next step — the most important panel */}
      {recModule && (
        <div className="mb-8 p-5 rounded-2xl border-2 border-[#6366f1]/30 bg-[#eef2ff]">
          <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider mb-3">
            Where to start
          </p>
          <div className="flex items-start gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-[#6366f1]" />
            </div>
            <div>
              <p className="text-base font-black text-[#3730a3]">{recModule.title}</p>
              <p className="text-xs text-[#6366f1] mt-0.5">{recModule.desc}</p>
            </div>
          </div>
          <p className="text-xs text-[#4f46e5] leading-relaxed border-t border-[#c7d2fe] pt-3">
            {whyRec}
          </p>
        </div>
      )}

      {/* Concept bars — compact, below the fold */}
      {Object.entries(result.perConceptScores).length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-3">
            Concept Scores
          </p>
          <div className="space-y-2">
            {Object.entries(result.perConceptScores).map(([concept, score]) => {
              const isStrong = score >= 70;
              return (
                <div key={concept} className="flex items-center gap-3">
                  <div className="w-28 text-[11px] text-[#52525b] truncate shrink-0">
                    {CONCEPT_LABELS[concept] ?? concept}
                  </div>
                  <div className="flex-1 h-1.5 bg-[#f0f0f2] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: isStrong ? "#16a34a" : "#f59e0b" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold w-9 text-right shrink-0"
                    style={{ color: isStrong ? "#16a34a" : "#b45309" }}
                  >
                    {score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary CTA — goes directly to recommended module */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4f46e5] text-white rounded-xl font-bold text-sm hover:bg-[#4338ca] transition-colors shadow-md shadow-[#4f46e5]/20"
        >
          Start {recModule?.title ?? "Learning"}
          <ArrowRight size={16} />
        </motion.button>
        <button
          onClick={onRetake}
          className="px-5 py-3 text-sm text-[#71717a] hover:text-[#111118] font-medium transition-colors border border-[#e4e4e7] rounded-xl"
        >
          Retake
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function AssessmentPage() {
  const router = useRouter();
  const {
    completed, result, currentQuestionIndex,
    answers, startAssessment, recordAnswer,
    submitAssessment, skipAssessment, retakeAssessment, goToQuestion,
  } = useAssessmentStore();
  const { recordConceptAnswer } = useAdaptiveStore();
  const { user } = useAuthStore();

  const [phase, setPhase] = useState<"welcome" | "quiz" | "results">(
    completed ? "results" : "welcome"
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const q = PLACEMENT_QUESTIONS[currentQuestionIndex];

  // Restore selected option when navigating back
  useEffect(() => {
    if (q && answers[q.id] !== undefined) {
      setSelectedOption(answers[q.id]);
      setRevealed(true);
    } else {
      setSelectedOption(null);
      setRevealed(false);
    }
  }, [currentQuestionIndex, q]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelectedOption(idx);
    recordAnswer(q.id, idx);
    const isCorrect = idx === q.correctIndex;
    // Record locally
    recordConceptAnswer(q.concept, isCorrect);
    // Record to backend if authenticated (fire-and-forget)
    if (user) {
      adaptiveApi.recordConceptAnswer(q.concept, isCorrect, "assessment").catch(() => {});
    }
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < PLACEMENT_QUESTIONS.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    } else {
      // Last question — submit locally
      const res = submitAssessment(PLACEMENT_QUESTIONS);
      // Persist to backend if authenticated
      if (user) {
        assessmentApi.submit({
          score: res.score,
          level: res.level,
          suggested_difficulty: res.suggestedDifficulty,
          recommended_path_id: res.recommendedPathId,
          recommended_module_id: res.recommendedModuleId,
          strong_concepts: res.strongConcepts,
          weak_concepts: res.weakConcepts,
          per_concept_scores: res.perConceptScores,
          total_questions: res.totalQuestions,
          correct_answers: res.correctAnswers,
          skipped: false,
        }).catch(() => {}); // non-fatal
      }
      setPhase("results");
    }
  };

  const handleStart = () => {
    startAssessment();
    setPhase("quiz");
  };

  const handleSkip = () => {
    skipAssessment();
    if (user) {
      assessmentApi.submit({
        score: 0, level: "beginner", suggested_difficulty: "normal",
        recommended_path_id: "fqc", recommended_module_id: "iqc",
        strong_concepts: [], weak_concepts: [], per_concept_scores: {},
        total_questions: 0, correct_answers: 0, skipped: true,
      }).catch(() => {});
    }
    router.push("/codebook");
  };

  const handleContinue = () => {
    if (result) {
      router.push(`/codebook/${result.recommendedPathId}/${result.recommendedModuleId}`);
    } else {
      router.push("/codebook");
    }
  };

  const handleRetake = () => {
    retakeAssessment();
    // Delete from backend so the learner can start fresh
    if (user) assessmentApi.retake().catch(() => {});
    startAssessment();
    setPhase("quiz");
    setSelectedOption(null);
    setRevealed(false);
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#e4e4e7] px-6 py-3 flex items-center gap-3">
        <Image src="/illustrations/QUBIT_icon.svg" alt="QUBIT" width={28} height={28} />
        <span className="text-sm font-semibold text-[#111118]">QUBIT</span>
        <span className="text-[#e4e4e7]">·</span>
        <span className="text-sm text-[#71717a]">Placement Assessment</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-8">
        <AnimatePresence mode="wait">
          {phase === "welcome" && (
            <WelcomeScreen key="welcome" onStart={handleStart} onSkip={handleSkip} />
          )}

          {phase === "quiz" && q && (
            <div key="quiz">
              <QuestionCard
                question={q}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={PLACEMENT_QUESTIONS.length}
                selectedIndex={selectedOption}
                revealed={revealed}
                onSelect={handleSelect}
              />

              {/* Navigation */}
              <div className="max-w-2xl mx-auto px-4 mt-8 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
                  }}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#71717a] hover:text-[#111118] disabled:opacity-30 transition-colors"
                >
                  <ArrowLeft size={14} /> Previous
                </button>

                <div className="flex gap-1.5">
                  {PLACEMENT_QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{
                        background:
                          i === currentQuestionIndex
                            ? "#4f46e5"
                            : answers[PLACEMENT_QUESTIONS[i].id] !== undefined
                            ? "#16a34a"
                            : "#e4e4e7",
                      }}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={!revealed}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4338ca] transition-colors"
                >
                  {currentQuestionIndex === PLACEMENT_QUESTIONS.length - 1
                    ? "See Results"
                    : "Next"}
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          )}

          {phase === "results" && result && (
            <ResultsScreen
              key="results"
              result={result}
              onContinue={handleContinue}
              onRetake={handleRetake}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

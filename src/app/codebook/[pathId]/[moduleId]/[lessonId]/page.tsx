"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { curriculumApi, runnerApi, progressApi, adaptiveApi } from "@/lib/api";
import { useProgressStore } from "@/store/progressStore";
import { useAuthStore } from "@/store/authStore";
import { useAgentStore } from "@/store/agentStore";
import { useAdaptiveStore } from "@/store/adaptiveStore";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ChevronRight, Play,
  CheckCircle2, Lightbulb, BookOpen, Target, Loader2, Lock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { progressPercent } from "@/lib/utils";
import LessonVideo from "@/components/codebook/LessonVideo";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const KatexMath    = dynamic(() => import("@/components/KatexMath"),    { ssr: false });

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ContentBlock {
  type: "theory" | "codercise";
  id: string;
  title: string;
  body?: string;
  description?: string;
  hints?: string[];
  starter_code?: string;
  solution_code?: string;
  test_code?: string;
}
interface LessonData {
  id: string; title: string; module_id: string; path_id: string;
  estimated_minutes: number; objectives: string[]; content: ContentBlock[];
  video?: { src: string; title: string; description?: string };
  is_quiz?: boolean;
  quiz_id?: string;
}
type TheoryTab = "theory" | "paths" | "all-modules" | "support";

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LessonPage() {
  const { pathId, moduleId, lessonId } = useParams<{
    pathId: string; moduleId: string; lessonId: string;
  }>();
  const router = useRouter();
  const [lesson, setLesson]                     = useState<LessonData | null>(null);
  const [activeCodercise, setActiveCodercise]   = useState<string | null>(null);
  const [expandedSet, setExpandedSet]           = useState<Set<string>>(new Set());
  const [theoryTab, setTheoryTab]               = useState<TheoryTab>("theory");
  const { markComplete, isCompleted, progress }  = useProgressStore();
  const { user }                                = useAuthStore();
  const setAgentContext                         = useAgentStore((s) => s.setContext);
  const { updateModuleMastery, updateCertificationProgress, getCertificationProgress } = useAdaptiveStore();
  const { getModuleLessonTotal, isModuleLocked, getMissingPrereqTitles } = useCurriculumMetaStore();
  const done                                    = lesson ? isCompleted(lesson.id) : false;
  const moduleLocked                            = isModuleLocked(moduleId);
  const missingTitles                           = getMissingPrereqTitles(moduleId);

  useEffect(() => {
    curriculumApi.getLesson(pathId, moduleId, lessonId).then((res) => {
      setLesson(res.data);
      setAgentContext({
        path_id: pathId, module_id: moduleId,
        lesson_id: lessonId, lesson_title: res.data.title,
      });
      const first = res.data.content.find((b: ContentBlock) => b.type === "codercise");
      if (first) {
        setActiveCodercise(first.id);
        setExpandedSet(new Set([first.id]));
      }
    });
    return () => {
      setAgentContext({ lesson_id: undefined, lesson_title: undefined, current_code: undefined });
    };
  }, [pathId, moduleId, lessonId]);

  const toggle = (id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setActiveCodercise(id);
  };

  const handleMarkDone = async () => {
    if (!lesson) return;
    if (moduleLocked) {
      toast.error(`Complete prerequisite modules first: ${missingTitles.join(", ")}`);
      return;
    }
    await markComplete(lesson.id, lesson.module_id, lesson.path_id);

    // Count how many lessons in this module are now completed
    const allProgress = { ...progress };
    allProgress[lesson.id] = { lesson_id: lesson.id, completed: true, module_id: lesson.module_id, path_id: lesson.path_id, score: null };
    const doneInModule = Object.values(allProgress).filter(
      (r) => r.completed && r.module_id === lesson.module_id
    ).length;

    // Module lesson total from backend meta — no hardcoding
    const total = getModuleLessonTotal(lesson.module_id);
    const mastery = doneInModule >= total ? "proficient" : doneInModule > 0 ? "practiced" : "learning";

    updateModuleMastery(lesson.module_id, lesson.path_id, {
      masteryLevel: mastery,
      lessonsCompleted: doneInModule,
      lessonsTotal: total,
    });

    // Update cert progress
    const pathLessons = Object.values(allProgress).filter(
      (r) => r.completed && r.path_id === lesson.path_id
    ).length;
    const currentCert = getCertificationProgress(lesson.path_id);
    updateCertificationProgress(lesson.path_id, {
      completedLessons: pathLessons,
      passedCodercises: currentCert.passedCodercises, // preserved
    });

    toast.success("Lesson complete");
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)]">
        <Loader2 size={18} className="animate-spin text-[#a1a1aa]" />
      </div>
    );
  }

  const codercises = lesson.content.filter((b) => b.type === "codercise");

  // Quiz lesson → render quiz panel instead of codercise panel
  if (lesson.is_quiz && lesson.quiz_id) {
    return (
      <div className="flex h-[calc(100vh-48px)] overflow-hidden">
        <QuizPanel
          quizId={lesson.quiz_id}
          lesson={lesson}
          pathId={pathId}
          moduleId={moduleId}
          moduleLocked={moduleLocked}
          missingTitles={missingTitles}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">

      {/* ── LEFT — codercise panel ───────────────────────────────────── */}
      <div className="w-[56%] flex flex-col border-r border-[#e4e4e7] bg-white overflow-hidden">

        {/* Locked module banner */}
        {moduleLocked && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#fef9c3] border-b border-[#fde68a] text-xs text-[#92400e]">
            <Lock size={12} className="shrink-0" />
            <span>
              <strong>Preview only.</strong> Complete{" "}
              <strong>{missingTitles.join(", ")}</strong> to unlock activities.
            </span>
          </div>
        )}

        {/* Lesson header bar */}
        <div className="flex items-center gap-3 px-4 h-10 border-b border-[#e4e4e7] shrink-0">
          <Link
            href={`/codebook/${pathId}/${moduleId}`}
            className="text-[#a1a1aa] hover:text-[#111118] transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" />
          </Link>
          <span className="text-sm font-semibold text-[#111118] flex-1 truncate">{lesson.title}</span>
          <span className="text-[11px] text-[#a1a1aa] shrink-0">~{lesson.estimated_minutes} min</span>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {moduleLocked ? (
              <span className="flex items-center gap-1 text-[11px] text-[#d97706] font-medium">
                <Lock size={11} /> Locked
              </span>
            ) : done ? (
              <span className="flex items-center gap-1 text-[11px] text-[#16a34a] font-medium">
                <CheckCircle2 size={12} /> Complete
              </span>
            ) : (
              <Button size="xs" variant="secondary" onClick={handleMarkDone}>
                Mark done
              </Button>
            )}
          </div>
        </div>

        {/* Codercise list */}
        <div className="flex-1 overflow-y-auto">
          {codercises.length > 0 ? (
            codercises.map((c) => (
              <CoderciseRow
                key={c.id}
                codercise={c}
                expanded={expandedSet.has(c.id)}
                onToggle={() => toggle(c.id)}
                lessonId={lesson.id}
                moduleId={moduleId}
                pathId={pathId}
                moduleLocked={moduleLocked}
                missingTitles={missingTitles}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-[#a1a1aa]">
              <BookOpen size={20} className="mb-2 opacity-50" />
              <p className="text-sm">Read the theory on the right →</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT — theory panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">

        {/* Tabs — matches the ref exactly */}
        <div className="flex items-center border-b border-[#e4e4e7] px-5 h-10 shrink-0 gap-1">
          {(["theory", "paths", "all-modules", "support"] as TheoryTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTheoryTab(tab)}
              className={cn(
                "px-3 h-full text-xs font-medium border-b-2 -mb-px transition-colors capitalize",
                theoryTab === tab
                  ? "border-[#4f46e5] text-[#4f46e5]"
                  : "border-transparent text-[#71717a] hover:text-[#111118]"
              )}
            >
              {tab === "all-modules" ? "All modules" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {theoryTab === "theory" && <TheoryPanel lesson={lesson} />}
          {theoryTab === "paths" && (
            <div className="p-6">
              <p className="text-sm font-semibold text-[#111118] mb-3">Learning path</p>
              <Link href={`/codebook/${pathId}`} className="text-sm text-[#4f46e5] hover:underline">
                View full path →
              </Link>
            </div>
          )}
          {theoryTab === "all-modules" && (
            <div className="p-6">
              <p className="text-sm font-semibold text-[#111118] mb-3">All modules</p>
              <Link href="/codebook" className="text-sm text-[#4f46e5] hover:underline">
                Back to Codebook Map →
              </Link>
            </div>
          )}
          {theoryTab === "support" && (
            <div className="p-6">
              <p className="text-sm font-semibold text-[#111118] mb-2">Need help?</p>
              <p className="text-sm text-[#71717a]">
                Use the AI agent (bottom right) for concept explanations, code debugging, and guidance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Theory panel ───────────────────────────────────────────────────────── */
function TheoryPanel({ lesson }: { lesson: LessonData }) {
  const [objOpen, setObjOpen] = useState(true);
  const theoryBlocks = lesson.content.filter((b) => b.type === "theory");

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Video — shown first when the lesson has one */}
      {lesson.video && (
        <LessonVideo
          src={lesson.video.src}
          title={lesson.video.title}
          description={lesson.video.description}
        />
      )}

      {/* Module illustration — only when no video */}
      {!lesson.video && (
        <div
          className="rounded-lg border border-[#e4e4e7] h-32 relative overflow-hidden bg-[#f7f7f8] flex items-center justify-center"
        >
          <div className="font-mono text-[2.5rem] font-black text-[#e4e4e7] select-none leading-none">
            |ψ⟩
          </div>
          <div className="absolute bottom-2.5 left-3.5 right-3.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {["α|0⟩ + β|1⟩", "H = 1/√2·[[1,1],[1,−1]]", "|α|² + |β|² = 1"].map((t) => (
              <span key={t} className="font-mono text-[10px] text-[#a1a1aa]">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Learning objectives */}
      <div className="border border-[#e4e4e7] rounded-lg overflow-hidden">
        <button
          onClick={() => setObjOpen(!objOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-[#f7f7f8] transition-colors text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#111118]">
            <Target size={13} className="text-[#4f46e5]" />
            What will you learn?
          </span>
          {objOpen ? <ChevronUp size={13} className="text-[#a1a1aa]" /> : <ChevronDown size={13} className="text-[#a1a1aa]" />}
        </button>
        {objOpen && (
          <div className="px-4 py-3 bg-white border-t border-[#f0f0f2]">
            <ul className="space-y-1.5">
              {lesson.objectives.map((obj, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#52525b] leading-relaxed">
                  <span className="text-[#4f46e5] mt-1 shrink-0">·</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Theory content blocks */}
      {theoryBlocks.map((block) => (
        <TheoryBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function TheoryBlock({ block }: { block: ContentBlock }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-[#e4e4e7] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-[#f7f7f8] transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[#111118]">
          <span className="w-3.5 h-3.5 rounded bg-[#eef2ff] flex items-center justify-center shrink-0">
            <BookOpen size={9} className="text-[#4f46e5]" />
          </span>
          {block.title}
        </span>
        {open ? <ChevronUp size={13} className="text-[#a1a1aa]" /> : <ChevronDown size={13} className="text-[#a1a1aa]" />}
      </button>
      {open && block.body && (
        <div className="px-4 py-3 text-sm border-t border-[#f0f0f2]">
          <KatexMath content={block.body} />
        </div>
      )}
    </div>
  );
}

/* ─── Codercise row ──────────────────────────────────────────────────────── */
function CoderciseRow({
  codercise, expanded, onToggle, lessonId, moduleId, pathId, moduleLocked, missingTitles,
}: {
  codercise: ContentBlock;
  expanded: boolean;
  onToggle: () => void;
  lessonId: string;
  moduleId: string;
  pathId: string;
  moduleLocked: boolean;
  missingTitles: string[];
}) {
  const { user }            = useAuthStore();
  const setAgentContext     = useAgentStore((s) => s.setContext);
  const { recordCoderciseAttempt, updateCertificationProgress, getCertificationProgress } = useAdaptiveStore();
  const [code, setCode]     = useState(codercise.starter_code ?? "");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [passed, setPassed]   = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [hintIdx, setHintIdx] = useState(0);
  const [showHint, setShowHint]     = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const isQiskit = code.includes("qiskit") || (codercise.test_code ?? "").includes("qiskit");
  const isPennylane = code.includes("qml.") || code.includes("pennylane") || (codercise.test_code ?? "").includes("qml.");

  const runCode = async () => {
    setRunning(true);
    setOutput("");
    setAgentContext({ current_code: code });
    const thisAttempt = attemptCount + 1;
    setAttemptCount(thisAttempt);
    try {
      const fn = isPennylane ? runnerApi.executePennylane
                 : isQiskit  ? runnerApi.executeQiskit
                 : runnerApi.execute;
      const res = await fn(code, codercise.test_code ?? "");
      const { stdout, stderr, passed: p } = res.data;
      setOutput([stdout, stderr].filter(Boolean).join("\n").trim() || "(no output)");
      setPassed(p);

      // Record in adaptive store — only on first pass or on first success
      if (!passed || p) {
        recordCoderciseAttempt({
          coderciseId: codercise.id,
          lessonId,
          passed: p,
          attempts: thisAttempt,
          usedHint: showHint,
          usedSolution: showSolution,
          completedAt: new Date().toISOString(),
        });
      }

      // Update certification codercise count when passing for the first time
      if (p && !passed) {
        const cert = getCertificationProgress(pathId);
        updateCertificationProgress(pathId, {
          passedCodercises: cert.passedCodercises + 1,
        });
      }

      if (p) toast.success("All tests passed ✓");
      else    toast.error("Tests failed — keep going");
    } catch {
      setOutput("Cannot reach backend. Run: uvicorn app.main:app --reload");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={cn(
      "border-b border-[#f0f0f2] transition-colors",
      expanded && "bg-[#fafafa]"
    )}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f7f7f8] transition-colors text-left"
        onClick={onToggle}
      >
        {/* Completion marker */}
        <div className={cn(
          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
          passed ? "bg-[#f0fdf4] border-[#16a34a]" : "bg-white border-[#d4d4d8]"
        )}>
          {passed && <CheckCircle2 size={10} className="text-[#16a34a]" />}
        </div>
        <span className="text-sm text-[#111118] flex-1 leading-snug">{codercise.title}</span>
        {expanded
          ? <ChevronUp size={13} className="text-[#a1a1aa] shrink-0" />
          : <ChevronDown size={13} className="text-[#a1a1aa] shrink-0" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              {/* Problem description */}
              <div className="text-sm text-[#52525b] leading-relaxed lesson-prose mb-3">
                <KatexMath content={codercise.description ?? ""} />
              </div>

              {/* Hint */}
              {codercise.hints && codercise.hints.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1 text-xs text-[#71717a] hover:text-[#111118] transition-colors"
                  >
                    <Lightbulb size={11} />
                    {showHint ? "Hide hint" : "Hint"}
                  </button>
                  {showHint && (
                    <div className="mt-2 px-3 py-2 bg-[#fffbeb] border border-[#fde68a] rounded text-xs text-[#92400e] leading-relaxed">
                      <KatexMath content={codercise.hints[hintIdx]} />
                      {codercise.hints.length > 1 && hintIdx < codercise.hints.length - 1 && (
                        <button
                          onClick={() => setHintIdx((i) => i + 1)}
                          className="mt-1 text-[#d97706] hover:underline text-[11px]"
                        >
                          Next hint →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Code editor */}
              <div className="rounded-md overflow-hidden border border-[#e4e4e7] mb-2.5">
                <MonacoEditor
                  height="200px"
                  language="python"
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v ?? "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12.5,
                    fontFamily: "var(--font-geist-mono), monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 10, bottom: 10 },
                    wordWrap: "on",
                    renderLineHighlight: "none",
                    overviewRulerLanes: 0,
                  }}
                />
              </div>

              {/* Actions */}
              {moduleLocked ? (
                /* Locked: show preview notice instead of Run/Submit */
                <div className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-lg bg-[#fef9c3] border border-[#fde68a]">
                  <Lock size={12} className="text-[#92400e] shrink-0" />
                  <span className="text-xs text-[#92400e]">
                    Complete <strong>{missingTitles.join(", ")}</strong> to run this exercise.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2.5">
                  <Button size="sm" onClick={runCode} loading={running}>
                    <Play size={11} /> Run
                  </Button>
                  {user ? (
                    <Button
                      variant="ghost" size="sm"
                      className="text-[#71717a]"
                      onClick={() => setShowSolution(!showSolution)}
                    >
                      {showSolution ? "Hide solution" : "Solution"}
                    </Button>
                  ) : (
                    <span className="text-xs text-[#a1a1aa]">
                      <Link href="/auth/login" className="text-[#4f46e5] hover:underline">Log in</Link>
                      {" "}or{" "}
                      <Link href="/auth/register" className="text-[#4f46e5] hover:underline">sign up</Link>
                      {" "}to submit
                    </span>
                  )}
                </div>
              )}

              {/* Solution */}
              {showSolution && codercise.solution_code && (
                <div className="mb-2.5 rounded-md overflow-hidden border border-[#16a34a]/30">
                  <div className="bg-[#0d1a0d] px-3 py-1 text-[10px] font-mono text-[#4ade80]">
                    Solution
                  </div>
                  <MonacoEditor
                    height="140px"
                    language="python"
                    theme="vs-dark"
                    value={codercise.solution_code}
                    options={{
                      readOnly: true, minimap: { enabled: false },
                      fontSize: 12.5, scrollBeyondLastLine: false, padding: { top: 8 },
                      renderLineHighlight: "none",
                    }}
                  />
                </div>
              )}

              {/* Output */}
              {output && (
                <div className={cn(
                  "rounded-md px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap",
                  passed
                    ? "bg-[#0d1a0d] text-[#4ade80]"
                    : "bg-[#111118] text-[#e4e4e7]"
                )}>
                  {passed && <div className="text-[#4ade80] font-semibold mb-1">✓ All tests passed</div>}
                  {output}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ─── Quiz Panel ─────────────────────────────────────────────────────────────
   Renders a module quiz when is_quiz === true on a lesson.
   Fetches questions from backend (correct answers withheld).
   Scores on the backend, records concept answers for adaptive tracking.
   Shows wrong-answer explanations after submission.
───────────────────────────────────────────────────────────────────────────── */
interface QuizQuestion {
  id: string;
  concept: string;
  question: string;
  options: string[];
}

interface QuizResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  passing_score: number;
  per_question: {
    question_id: string;
    concept: string;
    chosen_index: number | null;
    correct_index: number;
    correct: boolean;
    explanation: string | null;
  }[];
}

function QuizPanel({
  quizId, lesson, pathId, moduleId, moduleLocked, missingTitles,
}: {
  quizId: string;
  lesson: LessonData;
  pathId: string;
  moduleId: string;
  moduleLocked: boolean;
  missingTitles: string[];
}) {
  const { user } = useAuthStore();
  const { markComplete, isCompleted } = useProgressStore();
  const { updateModuleMastery } = useAdaptiveStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const done = isCompleted(lesson.id);

  useEffect(() => {
    progressApi.getQuizQuestions(quizId)
      .then((res) => setQuestions(res.data))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [quizId]);

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    if (moduleLocked) {
      toast.error(`Complete ${missingTitles.join(", ")} first to submit this quiz.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await progressApi.submitQuiz(quizId, {
        answers,
        module_id: moduleId,
        path_id: pathId,
      });
      setResult(res.data);

      // Record per-question concept answers for adaptive tracking
      for (const pq of res.data.per_question) {
        adaptiveApi.recordConceptAnswer(pq.concept, pq.correct, "quiz").catch(() => {});
      }

      // Mark the quiz lesson complete if passed
      if (res.data.passed) {
        await markComplete(lesson.id, lesson.module_id, lesson.path_id);
        updateModuleMastery(moduleId, pathId, {});
        toast.success(`Quiz passed! ${res.data.score}% ✓`);
      } else {
        toast.error(`${res.data.score}% — need ${res.data.passing_score}% to pass. Review the explanations and retry.`);
      }
    } catch {
      toast.error("Could not submit quiz — check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-[#a1a1aa]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-10 border-b border-[#e4e4e7] shrink-0">
        <Link href={`/codebook/${pathId}/${moduleId}`} className="text-[#a1a1aa] hover:text-[#111118]">
          <ChevronRight size={14} className="rotate-180" />
        </Link>
        <span className="text-sm font-semibold text-[#111118] flex-1">{lesson.title}</span>
        <span className="text-[11px] text-[#a1a1aa]">~{lesson.estimated_minutes} min</span>
        {done && (
          <span className="flex items-center gap-1 text-[11px] text-[#16a34a] font-medium">
            <CheckCircle2 size={12} /> Passed
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-2xl mx-auto w-full">
        {/* Intro */}
        {!result && (
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eef2ff] border border-[#c7d2fe] text-[#4f46e5] text-xs font-semibold mb-4">
              <BookOpen size={12} />
              Module Quiz
            </div>
            <h1 className="text-2xl font-black text-[#111118] mb-2">{lesson.title}</h1>
            <p className="text-sm text-[#71717a]">
              Answer all {questions.length} questions. You need 70% or more to pass.
              Wrong answers show explanations so you can learn from mistakes.
            </p>
          </div>
        )}

        {/* Questions */}
        {!result && questions.map((q, qi) => (
          <div key={q.id} className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#eef2ff] text-[#4f46e5] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                {qi + 1}
              </span>
              <div className="flex-1">
                <KatexMath content={q.question} />
              </div>
            </div>
            <div className="space-y-2 pl-9">
              {q.options.map((opt, oi) => {
                const chosen = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className="w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all"
                    style={{
                      borderColor: chosen ? "#4f46e5" : "#e4e4e7",
                      background:  chosen ? "#eef2ff" : "white",
                      color:       chosen ? "#4f46e5" : "#111118",
                    }}
                  >
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
                    <KatexMath content={opt} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit */}
        {!result && (
          moduleLocked ? (
            <div className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-[#fef9c3] border border-[#fde68a]">
              <Lock size={14} className="text-[#92400e] shrink-0" />
              <span className="text-sm text-[#92400e]">
                Complete <strong>{missingTitles.join(", ")}</strong> to take this quiz.
              </span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#4f46e5", color: "white" }}
            >
              {submitting ? "Submitting…" : `Submit Quiz (${Object.keys(answers).length}/${questions.length} answered)`}
            </button>
          )
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Score banner */}
            <div
              className="rounded-2xl p-6 mb-8 text-center border-2"
              style={{
                borderColor: result.passed ? "#16a34a" : "#f59e0b",
                background:  result.passed ? "#f0fdf4" : "#fffbeb",
              }}
            >
              <div className="text-4xl font-black mb-1" style={{ color: result.passed ? "#16a34a" : "#f59e0b" }}>
                {result.score}%
              </div>
              <p className="text-sm font-semibold" style={{ color: result.passed ? "#15803d" : "#92400e" }}>
                {result.passed
                  ? `Passed! ${result.correct}/${result.total} correct`
                  : `${result.correct}/${result.total} correct — need ${result.passing_score}% to pass`}
              </p>
            </div>

            {/* Per-question review */}
            {result.per_question.map((pq, qi) => {
              const q = questions.find((x) => x.id === pq.question_id);
              if (!q) return null;
              return (
                <div
                  key={pq.question_id}
                  className="mb-6 rounded-xl border-2 overflow-hidden"
                  style={{ borderColor: pq.correct ? "#bbf7d0" : "#fecaca" }}
                >
                  <div
                    className="px-4 py-3 flex items-start gap-3"
                    style={{ background: pq.correct ? "#f0fdf4" : "#fef2f2" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold"
                      style={{
                        background: pq.correct ? "#16a34a" : "#dc2626",
                        color: "white",
                      }}
                    >
                      {pq.correct ? "✓" : "✗"}
                    </span>
                    <div className="text-sm font-medium" style={{ color: pq.correct ? "#15803d" : "#dc2626" }}>
                      <KatexMath content={q.question} />
                    </div>
                  </div>
                  {!pq.correct && (
                    <div className="px-4 py-3 bg-white">
                      <p className="text-xs font-semibold text-[#374151] mb-1">
                        Correct: {String.fromCharCode(65 + pq.correct_index)}. {q.options[pq.correct_index]}
                      </p>
                      {pq.explanation && (
                        <div className="text-xs text-[#52525b] leading-relaxed">
                          <KatexMath content={pq.explanation} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {!result.passed && (
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 rounded-xl border-2 border-[#4f46e5] text-[#4f46e5] font-bold text-sm"
                >
                  Retry Quiz
                </button>
              )}
              <Link
                href={`/codebook/${pathId}/${moduleId}`}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-center"
                style={{ background: "#4f46e5", color: "white" }}
              >
                {result.passed ? "Continue →" : "Back to Module"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

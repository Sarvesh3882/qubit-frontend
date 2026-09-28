"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useAdaptiveStore, type MasteryLevel } from "@/store/adaptiveStore";
import { useAssessmentStore } from "@/store/assessmentStore";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";
import { certificationApi } from "@/lib/api";
import {
  BookOpen, CheckCircle, Zap, Trophy, Target,
  BarChart2, Code2, Map, Award, ChevronRight,
  AlertCircle, TrendingUp, Star,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────────── */
const MASTERY_LABEL: Record<MasteryLevel, string> = {
  not_started: "Not started",
  learning:    "Learning",
  practiced:   "Practiced",
  proficient:  "Proficient",
  mastered:    "Mastered",
};
const MASTERY_COLOR: Record<MasteryLevel, string> = {
  not_started: "#e4e4e7",
  learning:    "#f7c94f",
  practiced:   "#4f8ef7",
  proficient:  "#a78bfa",
  mastered:    "#16a34a",
};

const CONCEPT_LABELS: Record<string, string> = {
  superposition: "Superposition",
  normalization: "State Normalization",
  gates:         "Quantum Gates",
  measurement:   "Measurement",
  entanglement:  "Entanglement",
  algorithms:    "Quantum Algorithms",
  bloch:         "Bloch Sphere",
};

// Path colours — same palette as learning-path page
const PATH_COLOR_PALETTE = [
  "#6366f1","#8b5cf6","#0ea5e9","#a855f7","#10b981","#f97316",
  "#ef4444","#eab308","#06b6d4","#84cc16",
];
function getPathColor(pathId: string, allPathIds: string[]): string {
  const idx = allPathIds.indexOf(pathId);
  return idx >= 0 ? (PATH_COLOR_PALETTE[idx] ?? "#6366f1") : "#6366f1";
}

/* ── stat card ───────────────────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-[#e4e4e7] p-5 bg-white flex items-start gap-4"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-[#111118]">{value}</p>
        <p className="text-xs font-semibold text-[#52525b] mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-[#a1a1aa] mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── mastery bar ─────────────────────────────────────────────────── */
function MasteryBar({
  concept, mastery, correct, attempts,
}: {
  concept: string;
  mastery: MasteryLevel;
  correct: number;
  attempts: number;
}) {
  const pct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const color = MASTERY_COLOR[mastery];
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-36 shrink-0">
        <p className="text-xs font-medium text-[#374151] truncate">
          {CONCEPT_LABELS[concept] ?? concept}
        </p>
        <p className="text-[10px]" style={{ color }}>{MASTERY_LABEL[mastery]}</p>
      </div>
      <div className="flex-1 h-2 bg-[#f0f0f2] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-semibold w-10 text-right text-[#52525b]">
        {attempts > 0 ? `${pct}%` : "—"}
      </span>
    </div>
  );
}

/* ── module progress card ────────────────────────────────────────── */
function ModuleCard({
  moduleId, pathColor, pathId,
}: {
  moduleId: string;
  pathColor: string;
  pathId: string;
}) {
  const { moduleProgress } = useProgressStore();
  const { getModuleMastery } = useAdaptiveStore();
  const { getModuleLessonTotal, meta } = useCurriculumMetaStore();
  const total = getModuleLessonTotal(moduleId);
  const title = meta?.module_meta[moduleId]?.title ?? moduleId;
  const { completed } = moduleProgress(moduleId, total);
  const mastery = getModuleMastery(moduleId);
  const masteryLevel: MasteryLevel = mastery?.masteryLevel
    ?? (completed >= total && total > 0 ? "proficient"
       : completed > 0 ? "practiced"
       : "not_started");
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link href={`/codebook/${pathId}/${moduleId}`}>
      <motion.div
        whileHover={{ x: 3 }}
        className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[#e4e4e7] bg-white hover:border-[#c7c7d4] transition-all"
      >
        {/* Progress ring */}
        <div className="relative w-11 h-11 shrink-0">
          <svg viewBox="0 0 44 44" className="-rotate-90 w-full h-full">
            <circle cx={22} cy={22} r={16} fill="none" stroke="#f0f0f2" strokeWidth={4} />
            <circle
              cx={22} cy={22} r={16}
              fill="none"
              stroke={MASTERY_COLOR[masteryLevel]}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
            style={{ color: pct === 100 ? "#16a34a" : pathColor }}
          >
            {moduleId.split("-").pop()?.toUpperCase().slice(0, 3)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111118] truncate">
            {title}
          </p>
          <p className="text-[11px] text-[#a1a1aa]">
            {completed}/{total} lessons · {MASTERY_LABEL[masteryLevel]}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: MASTERY_COLOR[masteryLevel] }}
          />
          <ChevronRight size={13} className="text-[#d4d4d8]" />
        </div>
      </motion.div>
    </Link>
  );
}

/* ── main page ───────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuthStore();
  const { progress, fetchProgress } = useProgressStore();
  const { conceptMastery, quizHistory, coderciseHistory, getOverallStats } = useAdaptiveStore();
  const { result: assessmentResult, skipped: assessmentSkipped } = useAssessmentStore();
  const { meta, fetchMeta } = useCurriculumMetaStore();
  const [mounted, setMounted] = useState(false);
  // Live eligibility from backend per path
  const [eligibilities, setEligibilities] = useState<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
    fetchProgress();
    fetchMeta();
  }, []);

  // Fetch backend eligibility for all paths once meta is loaded
  useEffect(() => {
    if (!meta || !user) return;
    for (const pid of meta.path_ids) {
      certificationApi.checkEligibility(pid)
        .then(res => setEligibilities(prev => ({ ...prev, [pid]: res.data })))
        .catch(() => {});
    }
  }, [meta?.path_ids.join(","), user?.id]);

  if (!mounted) return null;

  const stats = getOverallStats();
  // Total lessons from meta — covers ALL paths, not just the original 2
  const totalLessons = meta
    ? Object.values(meta.module_lesson_totals).reduce((a, b) => a + b, 0)
    : 0;
  const completedLessons = Object.values(progress).filter((r) => r.completed).length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const conceptEntries = Object.values(conceptMastery).sort((a, b) => b.attemptCount - a.attemptCount);
  const weakConcepts   = conceptEntries.filter(c => c.mastery === "learning" || c.mastery === "not_started");
  const strongConcepts = conceptEntries.filter(c => c.mastery === "proficient" || c.mastery === "mastered");

  const allPathIds = meta?.path_ids ?? [];

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Top section: avatar + summary ─────────────────────── */}
        <div className="flex flex-col md:flex-row gap-8 mb-10 items-start">

          {/* Identity */}
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            >
              {user ? user.username[0].toUpperCase() : "?"}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#111118]">
                {user ? user.username : "Guest"}
              </h1>
              <p className="text-sm text-[#71717a]">{user?.email ?? "Sign in to sync progress"}</p>
              {assessmentResult && !assessmentSkipped && (
                <span
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background:
                      assessmentResult.level === "advanced" ? "#f0fdf4"
                      : assessmentResult.level === "intermediate" ? "#fffbeb"
                      : "#eff6ff",
                    color:
                      assessmentResult.level === "advanced" ? "#15803d"
                      : assessmentResult.level === "intermediate" ? "#92400e"
                      : "#1d4ed8",
                  }}
                >
                  <Star size={11} />
                  {assessmentResult.level.charAt(0).toUpperCase() + assessmentResult.level.slice(1)} Level
                </span>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="flex-1 bg-white rounded-2xl border border-[#e4e4e7] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#111118]">Overall Progress</p>
              <span className="text-sm font-black text-[#6366f1]">{overallPct}%</span>
            </div>
            <div className="h-3 bg-[#f0f0f2] rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)" }}
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-[#a1a1aa]">
              {completedLessons} of {totalLessons} lessons completed across all paths
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/learning-path"
                className="flex items-center gap-1.5 text-xs text-[#6366f1] hover:underline font-medium"
              >
                <Map size={12} /> View learning path
              </Link>
              <Link
                href="/codebook"
                className="flex items-center gap-1.5 text-xs text-[#6366f1] hover:underline font-medium"
              >
                <BookOpen size={12} /> Open codebook
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={CheckCircle} label="Lessons Done"
            value={completedLessons} sub={`of ${totalLessons} total`}
            color="#16a34a"
          />
          <StatCard
            icon={Code2} label="Codercises Passed"
            value={coderciseHistory.filter((c) => c.passed).length}
            sub={`${Math.round(stats.codercisePassRate * 100)}% pass rate`}
            color="#6366f1"
          />
          <StatCard
            icon={BarChart2} label="Quiz Average"
            value={quizHistory.length > 0 ? `${Math.round(stats.quizAverage)}%` : "—"}
            sub={`${quizHistory.length} quizzes taken`}
            color="#f59e0b"
          />
          <StatCard
            icon={Zap} label="Concepts Mastered"
            value={`${stats.masteredConcepts}/${stats.totalConcepts || "—"}`}
            sub="proficient or above"
            color="#8b5cf6"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: paths + modules ──────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Module progress per path — fully dynamic from meta */}
            {allPathIds.map((pathId) => {
              const pm = meta?.path_meta[pathId];
              if (!pm) return null;
              const color = getPathColor(pathId, allPathIds);
              return (
                <section key={pathId}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <h2 className="text-sm font-bold text-[#111118]">{pm.title}</h2>
                  </div>
                  <div className="space-y-2">
                    {pm.modules.map((mId) => (
                      <ModuleCard key={mId} moduleId={mId} pathColor={color} pathId={pathId} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Concept mastery breakdown */}
            {conceptEntries.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={14} className="text-[#6366f1]" />
                  <h2 className="text-sm font-bold text-[#111118]">Concept Mastery</h2>
                </div>
                <div className="bg-white rounded-2xl border border-[#e4e4e7] px-5 py-4 divide-y divide-[#f0f0f2]">
                  {conceptEntries.map((cm) => (
                    <MasteryBar
                      key={cm.concept}
                      concept={cm.concept}
                      mastery={cm.mastery}
                      correct={cm.correctCount}
                      attempts={cm.attemptCount}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Weak areas */}
            {weakConcepts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className="text-[#f59e0b]" />
                  <h2 className="text-sm font-bold text-[#111118]">Focus Areas</h2>
                </div>
                <div className="bg-[#fffbeb] rounded-2xl border border-[#fde68a] px-5 py-4">
                  <p className="text-xs text-[#92400e] mb-3">
                    These concepts need more practice based on your activity:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weakConcepts.map((cm) => (
                      <span
                        key={cm.concept}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-[#fde68a] text-[#92400e]"
                      >
                        {CONCEPT_LABELS[cm.concept] ?? cm.concept}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Strong areas */}
            {strongConcepts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-[#16a34a]" />
                  <h2 className="text-sm font-bold text-[#111118]">Strengths</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {strongConcepts.map((cm) => (
                    <span
                      key={cm.concept}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]"
                    >
                      <CheckCircle size={10} />
                      {CONCEPT_LABELS[cm.concept] ?? cm.concept}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Recent quiz history */}
            {quizHistory.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 size={14} className="text-[#6366f1]" />
                  <h2 className="text-sm font-bold text-[#111118]">Recent Quiz Activity</h2>
                </div>
                <div className="bg-white rounded-2xl border border-[#e4e4e7] divide-y divide-[#f0f0f2] overflow-hidden">
                  {quizHistory.slice(0, 5).map((q, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          background: q.passed ? "#f0fdf4" : "#fef2f2",
                          color: q.passed ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {q.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111118] truncate">
                          {q.lessonId}
                        </p>
                        <p className="text-[10px] text-[#a1a1aa]">
                          {new Date(q.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: q.passed ? "#f0fdf4" : "#fef2f2",
                          color: q.passed ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {q.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column: assessment + certs ──────────────────── */}
          <div className="space-y-5">

            {/* Assessment result */}
            <section
              className="bg-white rounded-2xl border border-[#e4e4e7] overflow-hidden"
              id="assessment"
            >
              <div className="px-5 py-4 border-b border-[#f0f0f2] flex items-center gap-2">
                <Star size={14} className="text-[#6366f1]" />
                <h2 className="text-sm font-bold text-[#111118]">Placement</h2>
              </div>
              <div className="px-5 py-4">
                {assessmentResult && !assessmentSkipped ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl font-black text-[#111118]">
                        {assessmentResult.score}
                        <span className="text-base text-[#a1a1aa] font-normal">/100</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold capitalize text-[#6366f1]">
                          {assessmentResult.level}
                        </p>
                        <p className="text-[10px] text-[#a1a1aa]">
                          {new Date(assessmentResult.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {assessmentResult.weakConcepts.length > 0 && (
                      <p className="text-xs text-[#71717a] mb-3">
                        Weak: {assessmentResult.weakConcepts
                          .map((c) => CONCEPT_LABELS[c] ?? c)
                          .join(", ")}
                      </p>
                    )}
                    <Link
                      href="/assessment"
                      className="text-xs text-[#6366f1] hover:underline font-medium"
                    >
                      Retake assessment →
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                      <Star size={24} className="text-[#6366f1]" />
                    </div>
                    <p className="text-sm text-[#52525b] mb-3">
                      Take the placement assessment to personalise your learning path.
                    </p>
                    <Link
                      href="/assessment"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg hover:bg-[#4338ca] transition-colors"
                    >
                      Start Assessment
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Certifications — dynamic from meta + live backend eligibility */}
            {allPathIds.map((pathId) => {
              const elig = eligibilities[pathId];
              const certReq = meta?.cert_requirements[pathId];
              const color = getPathColor(pathId, allPathIds);
              const hasCert = elig?.eligible || false;
              return (
                <section key={pathId} className="bg-white rounded-2xl border border-[#e4e4e7] overflow-hidden" id={`certification-${pathId}`}>
                  <div className="px-5 py-4 border-b border-[#f0f0f2] flex items-center gap-2">
                    <Trophy size={14} style={{ color: hasCert ? "#f59e0b" : "#d4d4d8" }} />
                    <h2 className="text-sm font-bold text-[#111118]">Certificate</h2>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium text-[#374151] mb-3 leading-snug">
                      {certReq?.path_title ?? pathId}
                    </p>
                    {elig ? (
                      <div className="space-y-2 mb-4 text-[11px]">
                        {[
                          { label: "Lessons",    done: elig.requirements?.lessons?.completed,    req: elig.requirements?.lessons?.required,    met: elig.requirements?.lessons?.met },
                          { label: "Codercises", done: elig.requirements?.codercises?.passed,    req: elig.requirements?.codercises?.required,  met: elig.requirements?.codercises?.met },
                          { label: "Quizzes",    done: elig.requirements?.quizzes?.passed,       req: elig.requirements?.quizzes?.required,     met: elig.requirements?.quizzes?.met },
                        ].map(({ label, done, req, met }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[#71717a]">{label}</span>
                            <span className="font-semibold" style={{ color: met ? "#16a34a" : "#f59e0b" }}>
                              {done ?? "—"}/{req ?? "—"}{met ? " ✓" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#a1a1aa] mb-4">Loading requirements…</p>
                    )}
                    {hasCert ? (
                      <Link href={`/certification/claim?path=${pathId}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition-colors"
                      >
                        <Trophy size={13} /> Claim Certificate
                      </Link>
                    ) : (
                      <p className="text-[10px] text-[#a1a1aa] text-center">
                        Complete all requirements to earn your certificate
                      </p>
                    )}
                  </div>
                </section>
              );
            })}

            {/* Learning path link */}
            <Link
              href="/learning-path"
              className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-[#e4e4e7] hover:border-[#c7c7d4] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eef2ff] flex items-center justify-center">
                  <Map size={16} className="text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111118]">Learning Path</p>
                  <p className="text-[10px] text-[#a1a1aa]">Visual roadmap</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#d4d4d8] group-hover:text-[#a1a1aa] transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

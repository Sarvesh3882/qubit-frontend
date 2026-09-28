/**
 * Adaptive Learning Store
 *
 * Tracks per-concept mastery, quiz performance, codercise performance,
 * weak areas, strong areas, and drives the adaptive recommendations.
 *
 * This supplements (does not replace) the existing progressStore which
 * tracks raw lesson completion. This store tracks *proficiency*.
 *
 * Persisted to localStorage as "qubit-adaptive".
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";

// ── Types ──────────────────────────────────────────────────────────────────

export type MasteryLevel = "not_started" | "learning" | "practiced" | "proficient" | "mastered";

export interface ConceptMastery {
  concept: string;
  mastery: MasteryLevel;
  correctCount: number;
  attemptCount: number;
  lastPracticed: string | null;   // ISO date
  streak: number;                  // consecutive correct answers
}

export interface QuizAttempt {
  quizId: string;
  lessonId: string;
  moduleId: string;
  score: number;         // 0–100
  passed: boolean;
  completedAt: string;
  wrongConcepts: string[];
}

export interface CoderciseAttempt {
  coderciseId: string;
  lessonId: string;
  passed: boolean;
  attempts: number;
  usedHint: boolean;
  usedSolution: boolean;
  completedAt: string;
}

export interface ModuleMastery {
  moduleId: string;
  pathId: string;
  masteryLevel: MasteryLevel;
  lessonsCompleted: number;
  lessonsTotal: number;
  quizzesPassed: number;
  codercisesPassed: number;
  lastActivity: string | null;
}

export interface CertificationProgress {
  pathId: string;
  // Requirements for a certificate
  requiredLessons: number;
  completedLessons: number;
  requiredCodercises: number;
  passedCodercises: number;
  requiredQuizScore: number;       // minimum average quiz score
  currentQuizAverage: number;
  finalAssessmentPassed: boolean;
  finalAssessmentScore: number;
  eligible: boolean;
  certificationId: string | null;  // set when certificate is issued
  issuedAt: string | null;
}

// ── Mastery computation ────────────────────────────────────────────────────

export function computeMastery(correct: number, attempts: number, streak: number): MasteryLevel {
  if (attempts === 0) return "not_started";
  const accuracy = correct / attempts;
  if (attempts >= 5 && accuracy >= 0.9 && streak >= 3) return "mastered";
  if (attempts >= 3 && accuracy >= 0.75) return "proficient";
  if (attempts >= 2 && accuracy >= 0.5) return "practiced";
  return "learning";
}

// ── State ──────────────────────────────────────────────────────────────────

interface AdaptiveState {
  // Per-concept mastery map (concept → ConceptMastery)
  conceptMastery: Record<string, ConceptMastery>;

  // Per-module mastery
  moduleMastery: Record<string, ModuleMastery>;

  // Quiz history (flat list, recent first)
  quizHistory: QuizAttempt[];

  // Codercise history
  coderciseHistory: CoderciseAttempt[];

  // Certification progress per path
  certificationProgress: Record<string, CertificationProgress>;

  // Computed summaries (derived, but stored for quick access)
  weakConcepts: string[];
  strongConcepts: string[];
  recommendedNextModuleId: string | null;

  // Actions
  recordConceptAnswer: (concept: string, correct: boolean) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  recordCoderciseAttempt: (attempt: CoderciseAttempt) => void;
  updateModuleMastery: (moduleId: string, pathId: string, data: Partial<ModuleMastery>) => void;
  updateCertificationProgress: (pathId: string, data: Partial<CertificationProgress>) => void;
  issueCertification: (pathId: string, certId: string) => void;
  computeRecommendations: () => void;
  getConceptMastery: (concept: string) => ConceptMastery;
  getModuleMastery: (moduleId: string) => ModuleMastery | null;
  getCertificationProgress: (pathId: string) => CertificationProgress;
  getOverallStats: () => {
    totalAttempts: number;
    overallAccuracy: number;
    masteredConcepts: number;
    totalConcepts: number;
    quizAverage: number;
    codercisePassRate: number;
  };
}

// ── Default cert progress per path ────────────────────────────────────────

const DEFAULT_CERT: Omit<CertificationProgress, "pathId"> = {
  requiredLessons: 7,
  completedLessons: 0,
  requiredCodercises: 10,
  passedCodercises: 0,
  requiredQuizScore: 70,
  currentQuizAverage: 0,
  finalAssessmentPassed: false,
  finalAssessmentScore: 0,
  eligible: false,
  certificationId: null,
  issuedAt: null,
};

// ── Store ──────────────────────────────────────────────────────────────────

export const useAdaptiveStore = create<AdaptiveState>()(
  persist(
    (set, get) => ({
      conceptMastery: {},
      moduleMastery: {},
      quizHistory: [],
      coderciseHistory: [],
      certificationProgress: {},
      weakConcepts: [],
      strongConcepts: [],
      recommendedNextModuleId: null,

      recordConceptAnswer: (concept, correct) => {
        set((s) => {
          const existing = s.conceptMastery[concept] ?? {
            concept,
            mastery: "not_started",
            correctCount: 0,
            attemptCount: 0,
            lastPracticed: null,
            streak: 0,
          };
          const updated: ConceptMastery = {
            ...existing,
            attemptCount: existing.attemptCount + 1,
            correctCount: existing.correctCount + (correct ? 1 : 0),
            lastPracticed: new Date().toISOString(),
            streak: correct ? existing.streak + 1 : 0,
          };
          updated.mastery = computeMastery(updated.correctCount, updated.attemptCount, updated.streak);

          const newMastery = { ...s.conceptMastery, [concept]: updated };
          const weakConcepts = Object.values(newMastery)
            .filter((m) => m.mastery === "learning" || m.mastery === "not_started")
            .map((m) => m.concept);
          const strongConcepts = Object.values(newMastery)
            .filter((m) => m.mastery === "proficient" || m.mastery === "mastered")
            .map((m) => m.concept);

          return { conceptMastery: newMastery, weakConcepts, strongConcepts };
        });
      },

      recordQuizAttempt: (attempt) => {
        set((s) => {
          const history = [attempt, ...s.quizHistory].slice(0, 100);
          // Update wrong concept mastery
          for (const c of attempt.wrongConcepts) {
            get().recordConceptAnswer(c, false);
          }
          return { quizHistory: history };
        });
        // recompute cert progress
        get().computeRecommendations();
      },

      recordCoderciseAttempt: (attempt) => {
        set((s) => ({
          coderciseHistory: [attempt, ...s.coderciseHistory].slice(0, 200),
        }));
        get().computeRecommendations();
      },

      updateModuleMastery: (moduleId, pathId, data) => {
        set((s) => ({
          moduleMastery: {
            ...s.moduleMastery,
            [moduleId]: {
              // spread existing first, then apply new data, then force lastActivity
              ...(s.moduleMastery[moduleId] ?? {
                moduleId,
                pathId,
                masteryLevel: "not_started" as const,
                lessonsCompleted: 0,
                lessonsTotal: 0,
                quizzesPassed: 0,
                codercisesPassed: 0,
                lastActivity: null,
              }),
              ...data,
              lastActivity: new Date().toISOString(),
            },
          },
        }));
      },

      updateCertificationProgress: (pathId, data) => {
        set((s) => {
          const existing = s.certificationProgress[pathId] ?? { pathId, ...DEFAULT_CERT };
          const updated = { ...existing, ...data };
          // Compute eligibility
          updated.eligible =
            updated.completedLessons >= updated.requiredLessons &&
            updated.passedCodercises >= updated.requiredCodercises &&
            updated.currentQuizAverage >= updated.requiredQuizScore &&
            updated.finalAssessmentPassed;
          return {
            certificationProgress: { ...s.certificationProgress, [pathId]: updated },
          };
        });
      },

      issueCertification: (pathId, certId) => {
        set((s) => {
          const existing = s.certificationProgress[pathId] ?? { pathId, ...DEFAULT_CERT };
          return {
            certificationProgress: {
              ...s.certificationProgress,
              [pathId]: {
                ...existing,
                certificationId: certId,
                issuedAt: new Date().toISOString(),
                eligible: true,
              },
            },
          };
        });
      },

      computeRecommendations: () => {
        const { conceptMastery, moduleMastery } = get();

        // Read all structural facts from curriculumMetaStore — zero hardcoding here.
        const meta = useCurriculumMetaStore.getState().meta;

        // Fall back to empty if meta hasn't loaded yet — recommendations will recompute
        // once meta arrives (useLearnerSync calls computeRecommendations after hydrating).
        const MODULE_ORDER: string[] = meta?.module_order ?? [];
        const MODULE_CONCEPTS: Record<string, string[]> = meta
          ? Object.fromEntries(
              Object.entries(meta.module_meta).map(([mid, m]: [string, any]) => [
                mid,
                // concept_codercises keys = concepts taught by this module
                Object.keys(m.concept_codercises ?? {}),
              ])
            )
          : {};

        const weak = Object.values(conceptMastery)
          .filter((m) => m.mastery === "learning" || (m.mastery === "not_started" && m.attemptCount > 0))
          .map((m) => m.concept);
        const strong = Object.values(conceptMastery)
          .filter((m) => m.mastery === "proficient" || m.mastery === "mastered")
          .map((m) => m.concept);

        let nextModule: string | null = null;

        // Rule 1: completed module still has weak concepts → revisit
        for (const moduleId of MODULE_ORDER) {
          const mod = moduleMastery[moduleId];
          if (!mod || mod.masteryLevel === "not_started") continue;
          const weakHere = (MODULE_CONCEPTS[moduleId] ?? []).filter((c) => weak.includes(c));
          if (weakHere.length > 0) { nextModule = moduleId; break; }
        }

        // Rule 2: first incomplete, unlocked module (prereq = previous in path's module list)
        if (!nextModule) {
          for (const moduleId of MODULE_ORDER) {
            const mod = moduleMastery[moduleId];
            if (mod?.masteryLevel === "mastered" || mod?.masteryLevel === "proficient") continue;
            const pathId = meta?.module_meta[moduleId]?.path_id;
            const pathModules = pathId ? (meta?.path_meta[pathId]?.modules ?? []) : [];
            const posInPath = pathModules.indexOf(moduleId);
            const prereqId = posInPath > 0 ? pathModules[posInPath - 1] : null;
            const prereqDone = !prereqId
              || moduleMastery[prereqId]?.masteryLevel === "proficient"
              || moduleMastery[prereqId]?.masteryLevel === "mastered";
            if (prereqDone) { nextModule = moduleId; break; }
          }
        }

        // Rule 3: fallback to very first module in order
        if (!nextModule && MODULE_ORDER.length > 0) nextModule = MODULE_ORDER[0];

        set({ weakConcepts: weak, strongConcepts: strong, recommendedNextModuleId: nextModule });
      },

      getConceptMastery: (concept) =>
        get().conceptMastery[concept] ?? {
          concept,
          mastery: "not_started",
          correctCount: 0,
          attemptCount: 0,
          lastPracticed: null,
          streak: 0,
        },

      getModuleMastery: (moduleId) => get().moduleMastery[moduleId] ?? null,

      getCertificationProgress: (pathId) =>
        get().certificationProgress[pathId] ?? { pathId, ...DEFAULT_CERT },

      getOverallStats: () => {
        const { conceptMastery, quizHistory, coderciseHistory } = get();
        const concepts = Object.values(conceptMastery);
        const totalAttempts = concepts.reduce((s, c) => s + c.attemptCount, 0);
        const totalCorrect = concepts.reduce((s, c) => s + c.correctCount, 0);
        const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
        const masteredConcepts = concepts.filter(
          (c) => c.mastery === "proficient" || c.mastery === "mastered"
        ).length;
        const quizAverage =
          quizHistory.length > 0
            ? quizHistory.reduce((s, q) => s + q.score, 0) / quizHistory.length
            : 0;
        const passed = coderciseHistory.filter((c) => c.passed).length;
        const codercisePassRate =
          coderciseHistory.length > 0 ? passed / coderciseHistory.length : 0;
        return {
          totalAttempts,
          overallAccuracy,
          masteredConcepts,
          totalConcepts: concepts.length,
          quizAverage,
          codercisePassRate,
        };
      },
    }),
    { name: "qubit-adaptive" }
  )
);

/**
 * useLearnerSync
 *
 * Called once when an authenticated learner loads the app.
 * Responsibilities:
 *  1. Fetch curriculum meta (structural facts) — must happen first
 *  2. Load lesson progress from backend → hydrate progressStore
 *  3. Load placement assessment from backend → hydrate assessmentStore
 *  4. Load adaptive state from backend → hydrate adaptiveStore
 *  5. Recompute recommendations (now that meta + adaptive state are both loaded)
 *  6. One-time migration: push localStorage data to backend if backend has nothing
 *
 * Rules:
 *  - Only runs when user is authenticated.
 *  - Does NOT overwrite backend data with stale localStorage values
 *    if backend already has a record.
 *  - Silently no-ops on network error (offline-tolerant).
 *  - No hardcoded curriculum IDs — fallbacks read from curriculumMetaStore.
 */
"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAssessmentStore, type AssessmentResult } from "@/store/assessmentStore";
import { useAdaptiveStore, type MasteryLevel } from "@/store/adaptiveStore";
import { useProgressStore } from "@/store/progressStore";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";
import { assessmentApi, adaptiveApi } from "@/lib/api";

export function useLearnerSync() {
  const { user } = useAuthStore();
  const { result: localResult, completed: localCompleted, skipped: localSkipped } = useAssessmentStore();
  const { conceptMastery: localConceptMastery } = useAdaptiveStore();
  const { fetchProgress } = useProgressStore();
  const { fetchMeta, fetchModuleStatus } = useCurriculumMetaStore();

  const synced = useRef(false);

  useEffect(() => {
    if (!user || synced.current) return;
    synced.current = true;

    async function sync() {
      try {
        // ── 0. Curriculum meta first — computeRecommendations depends on it ──
        await fetchMeta();

        // ── 1. Lesson progress ────────────────────────────────────────────────
        await fetchProgress();
        // Refresh module-status now that progress is loaded
        await fetchModuleStatus();

        // ── 2. Placement assessment ───────────────────────────────────────────
        const serverAssessRes = await assessmentApi.getMe().catch(() => null);
        const serverAssessment = serverAssessRes?.data ?? null;

        if (serverAssessment) {
          // Backend record is authoritative — hydrate local cache
          useAssessmentStore.setState({
            completed: true,
            skipped: serverAssessment.skipped,
            result: {
              completedAt: serverAssessment.completed_at,
              totalQuestions: serverAssessment.total_questions,
              correctAnswers: serverAssessment.correct_answers,
              score: serverAssessment.score,
              level: serverAssessment.level as AssessmentResult["level"],
              strongConcepts: serverAssessment.strong_concepts,
              weakConcepts: serverAssessment.weak_concepts,
              recommendedPathId: serverAssessment.recommended_path_id,
              recommendedModuleId: serverAssessment.recommended_module_id,
              suggestedDifficulty: serverAssessment.suggested_difficulty as AssessmentResult["suggestedDifficulty"],
              perConceptScores: serverAssessment.per_concept_scores,
            } as AssessmentResult,
          });
        } else if (localCompleted && localResult && !localSkipped) {
          // Migration: push localStorage assessment to backend once
          try {
            await assessmentApi.submit({
              score: localResult.score,
              level: localResult.level,
              suggested_difficulty: localResult.suggestedDifficulty,
              recommended_path_id: localResult.recommendedPathId,
              recommended_module_id: localResult.recommendedModuleId,
              strong_concepts: localResult.strongConcepts,
              weak_concepts: localResult.weakConcepts,
              per_concept_scores: localResult.perConceptScores,
              total_questions: localResult.totalQuestions,
              correct_answers: localResult.correctAnswers,
              skipped: false,
            });
          } catch { /* non-fatal */ }
        } else if (localSkipped) {
          // Use first path/module from meta — no hardcoded fqc/iqc
          const currentMeta = useCurriculumMetaStore.getState().meta;
          const firstPathId = currentMeta?.path_ids[0] ?? "";
          const firstModuleId = firstPathId
            ? (currentMeta?.path_meta[firstPathId]?.modules[0] ?? "")
            : "";
          try {
            await assessmentApi.submit({
              score: 0, level: "beginner", suggested_difficulty: "normal",
              recommended_path_id: firstPathId,
              recommended_module_id: firstModuleId,
              strong_concepts: [], weak_concepts: [], per_concept_scores: {},
              total_questions: 0, correct_answers: 0, skipped: true,
            });
          } catch { /* non-fatal */ }
        }

        // ── 3. Adaptive state ─────────────────────────────────────────────────
        const adaptiveRes = await adaptiveApi.getState().catch(() => null);
        if (!adaptiveRes?.data) return;

        const state = adaptiveRes.data;

        // Hydrate adaptiveStore with server-derived values
        useAdaptiveStore.setState({
          moduleMastery: Object.fromEntries(
            Object.entries(state.module_mastery as Record<string, any>).map(([id, m]) => [
              id,
              {
                moduleId: id,
                pathId: m.path_id,
                masteryLevel: m.mastery_level as MasteryLevel,
                lessonsCompleted: m.lessons_completed,
                lessonsTotal: m.lessons_total,
                quizzesPassed: 0,
                codercisesPassed: state.codercises_passed ?? 0,
                lastActivity: null,
              },
            ])
          ),
          conceptMastery: Object.fromEntries(
            Object.entries(state.concept_mastery as Record<string, any>).map(([concept, m]) => [
              concept,
              {
                concept,
                mastery: m.mastery as MasteryLevel,
                correctCount: m.correct_count,
                attemptCount: m.attempt_count,
                streak: m.streak,
                lastPracticed: null,
              },
            ])
          ),
          weakConcepts: state.weak_concepts ?? [],
          strongConcepts: state.strong_concepts ?? [],
          recommendedNextModuleId: state.recommendation?.module_id ?? null,
        });

        // Recompute recommendations now that meta AND adaptive state are both loaded
        useAdaptiveStore.getState().computeRecommendations();

        // Refresh module-status after full sync
        await fetchModuleStatus();

        // ── 4. Migrate local concept answers if backend has none ──────────────
        const localConcepts = Object.values(localConceptMastery);
        const serverHasData = Object.keys(state.concept_mastery).length > 0;
        if (!serverHasData && localConcepts.length > 0) {
          for (const cm of localConcepts) {
            if (cm.attemptCount === 0) continue;
            for (let i = 0; i < cm.correctCount; i++) {
              adaptiveApi.recordConceptAnswer(cm.concept, true, "assessment").catch(() => {});
            }
            const wrong = cm.attemptCount - cm.correctCount;
            for (let i = 0; i < wrong; i++) {
              adaptiveApi.recordConceptAnswer(cm.concept, false, "assessment").catch(() => {});
            }
          }
        }

      } catch {
        // Sync failure is non-fatal — localStorage remains as fallback
      }
    }

    sync();
  }, [user?.id]);
}

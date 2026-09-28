import { create } from "zustand";
import { persist } from "zustand/middleware";
import { progressApi } from "@/lib/api";

interface LessonProgressRecord {
  lesson_id: string;
  module_id: string;
  path_id: string;
  completed: boolean;
  score: number | null;
}

interface ProgressState {
  progress: Record<string, LessonProgressRecord>;
  fetchProgress: () => Promise<void>;
  markComplete: (lessonId: string, moduleId: string, pathId: string, score?: number) => Promise<void>;
  isCompleted: (lessonId: string) => boolean;
  moduleProgress: (moduleId: string, totalLessons: number) => { completed: number; total: number };
  pathProgress: (pathId: string, totalLessons: number) => { completed: number; total: number };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      fetchProgress: async () => {
        try {
          const res = await progressApi.myProgress();
          const map: Record<string, LessonProgressRecord> = {};
          for (const r of res.data) map[r.lesson_id] = r;
          set({ progress: map });
        } catch {
          // user not logged in
        }
      },

      markComplete: async (lessonId, moduleId, pathId, score) => {
        try {
          await progressApi.completeLesson(lessonId, { module_id: moduleId, path_id: pathId, score });
          set((s) => ({
            progress: {
              ...s.progress,
              [lessonId]: { lesson_id: lessonId, module_id: moduleId, path_id: pathId, completed: true, score: score ?? null },
            },
          }));
        } catch {
          // optimistic update anyway
          set((s) => ({
            progress: {
              ...s.progress,
              [lessonId]: { lesson_id: lessonId, module_id: moduleId, path_id: pathId, completed: true, score: score ?? null },
            },
          }));
        }
      },

      isCompleted: (lessonId) => get().progress[lessonId]?.completed ?? false,

      moduleProgress: (moduleId, totalLessons) => {
        const completed = Object.values(get().progress).filter(
          (r) => r.module_id === moduleId && r.completed
        ).length;
        return { completed, total: totalLessons };
      },

      pathProgress: (pathId, totalLessons) => {
        const completed = Object.values(get().progress).filter(
          (r) => r.path_id === pathId && r.completed
        ).length;
        return { completed, total: totalLessons };
      },
    }),
    { name: "qubit-progress" }
  )
);

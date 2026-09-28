/**
 * curriculumMetaStore
 *
 * Zustand store for curriculum structural metadata fetched from
 * GET /api/curriculum/meta
 *
 * This is the single source of truth for:
 *   - module list, order, lesson counts
 *   - codercise IDs per module
 *   - quiz IDs per module
 *   - path membership
 *   - certification requirements
 *   - concept→module mapping
 *
 * Components must NOT hardcode any of the above.
 * They must read from this store instead.
 *
 * Persistence: session-only (no localStorage) — always re-fetched on
 * app load so it stays in sync with the backend.
 */
import { create } from "zustand";
import { curriculumApi, progressApi } from "@/lib/api";

// ── Types mirroring what /api/curriculum/meta returns ────────────────────────

export interface ModuleMetaEntry {
  path_id: string;
  title: string;
  lesson_ids: string[];
  codercise_ids: string[];
  quiz_id: string;
  prereq_module_ids: string[];  // explicit prerequisites — never infer from position
}

export interface CertRequirement {
  path_title: string;
  required_lessons: number;
  required_codercises: number;
  required_quizzes: number;
  passing_quiz_score: number;
  total_quizzes: number;
  quiz_ids: string[];
}

export interface PathMetaEntry {
  title: string;
  modules: string[];  // ordered module IDs
}

// ── Module lock/unlock status from backend ────────────────────────────────────
export interface ModuleStatus {
  module_id: string;
  locked: boolean;
  unlocked: boolean;
  missing_prereqs: string[];
  missing_prereq_titles: string[];
}

export interface CurriculumMeta {
  // module_id → structural facts
  module_meta: Record<string, ModuleMetaEntry>;
  // ordered list of all module IDs (prerequisite order)
  module_order: string[];
  // module_id → lesson count
  module_lesson_totals: Record<string, number>;
  // path_id → cert requirements
  cert_requirements: Record<string, CertRequirement>;
  // All path IDs in display order
  path_ids: string[];
  // path_id → { title, modules[] }
  // Derived client-side from module_meta
  path_meta: Record<string, PathMetaEntry>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface CurriculumMetaState {
  meta: CurriculumMeta | null;
  loading: boolean;
  error: string | null;
  // Per-module lock status from backend — keyed by module_id
  moduleStatus: Record<string, ModuleStatus>;
  moduleStatusLoading: boolean;
  // fetch from backend — idempotent, only re-fetches if forced
  fetchMeta: (force?: boolean) => Promise<void>;
  // Fetch module lock status for the authenticated user
  fetchModuleStatus: () => Promise<void>;
  // convenience selectors
  getModuleLessonTotal: (moduleId: string) => number;
  getModulePathId: (moduleId: string) => string | null;
  getCertRequirement: (pathId: string) => CertRequirement | null;
  getPathModuleIds: (pathId: string) => string[];
  getAllPathIds: () => string[];
  isModuleLocked: (moduleId: string) => boolean;
  getMissingPrereqs: (moduleId: string) => string[];
  getMissingPrereqTitles: (moduleId: string) => string[];
}

export const useCurriculumMetaStore = create<CurriculumMetaState>((set, get) => ({
  meta: null,
  loading: false,
  error: null,
  moduleStatus: {},
  moduleStatusLoading: false,

  fetchMeta: async (force = false) => {
    const { meta, loading } = get();
    // Already loaded and not forced — skip
    if (meta && !force) return;
    // Already in flight — skip
    if (loading) return;

    set({ loading: true, error: null });
    try {
      const res = await curriculumApi.getMeta();
      const raw = res.data as {
        module_meta: Record<string, ModuleMetaEntry>;
        module_order: string[];
        cert_requirements: Record<string, CertRequirement>;
      };

      // Derive module_lesson_totals
      const module_lesson_totals: Record<string, number> = {};
      for (const [mid, m] of Object.entries(raw.module_meta)) {
        module_lesson_totals[mid] = m.lesson_ids.length;
      }

      // Derive path_meta by grouping modules by path_id, preserving module_order
      const path_meta: Record<string, PathMetaEntry> = {};
      const cert_path_ids = Object.keys(raw.cert_requirements);

      // Walk module_order to build ordered path membership
      for (const moduleId of raw.module_order) {
        const mod = raw.module_meta[moduleId];
        if (!mod) continue;
        const pid = mod.path_id;
        if (!path_meta[pid]) {
          path_meta[pid] = { title: raw.cert_requirements[pid]?.path_title ?? pid, modules: [] };
        }
        path_meta[pid].modules.push(moduleId);
      }

      // path_ids: cert_requirements keys in the order they appear
      // (cert_requirements already includes all paths from backend)
      const path_ids = cert_path_ids;

      set({
        meta: {
          module_meta: raw.module_meta,
          module_order: raw.module_order,
          module_lesson_totals,
          cert_requirements: raw.cert_requirements,
          path_ids,
          path_meta,
        },
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: "Failed to load curriculum metadata" });
    }
  },

  getModuleLessonTotal: (moduleId) => {
    return get().meta?.module_lesson_totals[moduleId] ?? 1;
  },

  getModulePathId: (moduleId) => {
    return get().meta?.module_meta[moduleId]?.path_id ?? null;
  },

  getCertRequirement: (pathId) => {
    return get().meta?.cert_requirements[pathId] ?? null;
  },

  getPathModuleIds: (pathId) => {
    return get().meta?.path_meta[pathId]?.modules ?? [];
  },

  getAllPathIds: () => {
    return get().meta?.path_ids ?? [];
  },

  // ── Module status (fetched from /progress/module-status) ─────────────────

  fetchModuleStatus: async () => {
    set({ moduleStatusLoading: true });
    try {
      const res = await progressApi.getModuleStatus();
      const map: Record<string, ModuleStatus> = {};
      for (const entry of res.data as ModuleStatus[]) {
        map[entry.module_id] = entry;
      }
      set({ moduleStatus: map, moduleStatusLoading: false });
    } catch {
      // Unauthenticated or network error — silently degrade
      // (module status will be empty; UI falls back to "unlocked" for all)
      set({ moduleStatusLoading: false });
    }
  },

  isModuleLocked: (moduleId) => {
    const status = get().moduleStatus[moduleId];
    if (!status) {
      // Status not loaded yet or module not in status map → assume unlocked
      // (preview is always allowed; only submission endpoints enforce server-side)
      return false;
    }
    return status.locked;
  },

  getMissingPrereqs: (moduleId) => {
    return get().moduleStatus[moduleId]?.missing_prereqs ?? [];
  },

  getMissingPrereqTitles: (moduleId) => {
    return get().moduleStatus[moduleId]?.missing_prereq_titles ?? [];
  },
}));

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Handle, Position } from "reactflow";
import { curriculumApi } from "@/lib/api";
import { useProgressStore } from "@/store/progressStore";
import { useAuthStore } from "@/store/authStore";
import ProgressBar from "@/components/ui/ProgressBar";
import { progressPercent, formatDuration } from "@/lib/utils";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import {
  CheckCircleIcon,
  MapIcon,
} from "@heroicons/react/24/solid";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";

interface Lesson {
  id: string; title: string; estimated_minutes: number;
}
interface Module {
  id: string; title: string; abbreviation: string;
  description: string; lessons: Lesson[];
}
interface PathData {
  id: string; title: string; description: string;
  color: string; estimated_hours: number; modules: Module[];
}

/* ── Vertical node sidebar ───────────────────────────────────────────────── */
function ModuleSidebar({
  modules,
  pathColor,
  pathId,
}: {
  modules: Module[];
  pathColor: string;
  pathId: string;
}) {
  const { moduleProgress } = useProgressStore();
  const { isModuleLocked, getMissingPrereqTitles } = useCurriculumMetaStore();
  const params = useParams<{ pathId: string; moduleId?: string }>();
  const activeId = params.moduleId;

  return (
    <div className="flex flex-col items-center pt-6 pb-4 gap-0 w-full">
      {modules.map((m, i) => {
        const { completed } = moduleProgress(m.id, m.lessons.length);
        const done = completed === m.lessons.length && m.lessons.length > 0;
        const active = m.id === activeId;
        const locked = isModuleLocked(m.id);
        const missingTitles = getMissingPrereqTitles(m.id);
        const color = done ? "#16a34a" : locked ? "#d4d4d8" : pathColor;

        return (
          <div key={m.id} className="flex flex-col items-center w-full">
            {/* Connector line above (except first) */}
            {i > 0 && (
              <div
                className="w-0.5 h-5"
                style={{ background: done ? "#16a34a40" : "#d4d4d8" }}
              />
            )}

            {/* Node */}
            <Link href={`/codebook/${pathId}/${m.id}`} className="w-full flex justify-center">
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="relative flex flex-col items-center justify-center rounded-full transition-all"
                style={{
                  width: 60,
                  height: 60,
                  background: active ? color : locked ? "rgba(240,240,242,0.92)" : "rgba(255,255,255,0.92)",
                  border: `2.5px solid ${color}`,
                  boxShadow: active
                    ? `0 0 0 4px ${color}40, 0 4px 16px ${color}50`
                    : locked ? "none"
                    : `0 2px 12px rgba(0,0,0,0.15)`,
                  backdropFilter: "blur(4px)",
                  opacity: locked ? 0.65 : 1,
                }}
              >
                <span
                  className="text-[12px] font-black leading-none"
                  style={{ color: active ? "white" : locked ? "#a1a1aa" : color }}
                >
                  {locked ? <Lock size={14} className="text-[#d4d4d8]" /> : m.abbreviation}
                </span>
                {!locked && (
                  <span
                    className="text-[9px] mt-0.5 leading-none font-medium"
                    style={{ color: active ? "rgba(255,255,255,0.8)" : "#a1a1aa" }}
                  >
                    {completed}/{m.lessons.length}
                  </span>
                )}

                {/* Done badge */}
                {done && !active && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-[#16a34a]" />
                  </div>
                )}
              </motion.div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function PathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const [path, setPath] = useState<PathData | null>(null);
  const { moduleProgress } = useProgressStore();
  const { user } = useAuthStore();

  useEffect(() => {
    curriculumApi.getPath(pathId).then((res) => setPath(res.data));
  }, [pathId]);

  if (!path) return (
    <div className="flex items-center justify-center h-64 text-[#a1a1aa] text-sm">
      Loading…
    </div>
  );

  const totalLessons = path.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedAll = Object.values(useProgressStore.getState().progress)
    .filter((r) => r.path_id === pathId && r.completed).length;

  return (
    <div className="flex min-h-[calc(100vh-48px)]">

      {/* ── Left sidebar ──────────────────────────────────────────────── */}
      <div
        className="w-[200px] shrink-0 border-r border-[#e4e4e7] flex flex-col relative"
        style={{ background: "#c8e8f8", minHeight: "calc(100vh - 48px)" }}
      >
        {/* Back to map */}
        <Link
          href="/codebook"
          className="flex items-center gap-1.5 px-3 py-2.5 border-b border-[#a0cce8] hover:bg-[#b0d8f0] transition-colors z-10 relative"
          style={{ background: "rgba(255,255,255,0.75)" }}
        >
          <MapIcon className="w-3 h-3 text-[#4f46e5] shrink-0" />
          <span className="text-[9px] text-[#4f46e5] font-bold leading-tight uppercase tracking-wide">
            Map
          </span>
        </Link>

        {/* Illustration — fills full height, no cropping */}
        <div className="absolute inset-0 top-[33px] bottom-0 w-full overflow-hidden">
          <img
            src="/illustrations/verticalillustratioartcdebook.jpg"
            alt="Quantum computing illustration"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Module nodes overlaid on top of the illustration */}
        <div className="relative z-10 flex flex-col items-center pt-6 pb-6 gap-0 flex-1 overflow-y-auto">
          <ModuleSidebar
            modules={path.modules}
            pathColor={path.color || "#4f46e5"}
            pathId={pathId}
          />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-10 py-10">

          {/* Back breadcrumb */}
          <Link
            href="/codebook"
            className="text-xs text-[#4f46e5] hover:underline inline-flex items-center gap-1 mb-6"
          >
            ← Codebook Map
          </Link>

          {/* Header */}
          <h1 className="text-3xl font-bold text-[#111118] leading-tight mb-2">{path.title}</h1>

          {user ? (
            <div className="flex items-center gap-4 mb-4">
              <ProgressBar
                value={progressPercent(completedAll, totalLessons)}
                className="flex-1 max-w-xs"
                size="sm"
              />
              <span className="text-xs text-[#71717a] shrink-0">
                {completedAll}/{totalLessons} lessons · ~{path.estimated_hours}h
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#71717a] mb-4">
              <Link href="/auth/login" className="text-[#4f46e5] hover:underline">Sign in</Link> to track progress
            </p>
          )}

          <p className="text-sm text-[#52525b] leading-relaxed mb-10">{path.description}</p>

          {/* Modules */}
          {path.modules.map((module) => {
            const { completed } = moduleProgress(module.id, module.lessons.length);
            return (
              <section key={module.id} className="mb-10" id={module.id}>
                {/* Module header */}
                <div className="flex items-baseline justify-between mb-1">
                  <h2 className="text-lg font-bold text-[#111118]">
                    <span
                      className="text-xs font-bold mr-2 px-1.5 py-0.5 rounded"
                      style={{
                        background: `${path.color}15`,
                        color: path.color,
                      }}
                    >
                      {module.abbreviation}
                    </span>
                    {module.title}
                  </h2>
                  <span className="text-xs text-[#a1a1aa]">{completed}/{module.lessons.length}</span>
                </div>
                <p className="text-sm text-[#71717a] mb-4">{module.description}</p>

                {/* Lesson list */}
                <div className="flex flex-col gap-0 border border-[#e4e4e7] rounded-xl overflow-hidden">
                  {module.lessons.map((lesson) => {
                    const done = useProgressStore.getState().isCompleted(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/codebook/${pathId}/${module.id}/${lesson.id}`}
                        className="group flex items-center gap-4 px-4 py-3.5 bg-white hover:bg-[#f7f7f8] transition-colors border-b border-[#f0f0f2] last:border-0"
                      >
                        {/* Completion dot */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                            done
                              ? "bg-[#f0fdf4] border-[#16a34a]"
                              : "bg-white border-[#d4d4d8] group-hover:border-[#a1a1aa]"
                          }`}
                        >
                          {done && <CheckCircle2 size={11} className="text-[#16a34a]" />}
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm leading-snug transition-colors ${
                            done
                              ? "text-[#71717a] line-through decoration-[#d4d4d8]"
                              : "text-[#111118] group-hover:text-[#4f46e5]"
                          }`}>
                            {lesson.title}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa] shrink-0">
                          <Clock size={11} />
                          {formatDuration(lesson.estimated_minutes)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ── Mini-map node ─────────────────────────────────────────────────────────────
function MiniNode({
  data,
}: {
  data: { label: string; completed: number; total: number; color: string; active?: boolean };
}) {
  const done = data.completed === data.total && data.total > 0;
  const bc   = done ? "#16a34a" : data.color;
  return (
    <div
      className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white"
      style={{ border: `2px solid ${bc}`, boxShadow: data.active ? `0 0 0 3px ${bc}22` : "none" }}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <span className="text-[11px] font-bold leading-none" style={{ color: bc }}>{data.label}</span>
      <span className="text-[9px] text-[#a1a1aa] mt-0.5">{data.completed}/{data.total}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}


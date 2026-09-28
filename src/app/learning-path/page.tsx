"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background, Controls, useNodesState, useEdgesState,
  type Node, type Edge, type NodeTypes,
  Handle, Position, MarkerType, Panel, useReactFlow, ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useProgressStore } from "@/store/progressStore";
import { useAdaptiveStore, type MasteryLevel, type ModuleMastery, type ConceptMastery } from "@/store/adaptiveStore";
import { useAssessmentStore } from "@/store/assessmentStore";
import { useCurriculumMetaStore, type CurriculumMeta } from "@/store/curriculumMetaStore";
import {
  CheckCircle, Lock, BookOpen, Trophy, ChevronRight,
  Sparkles, Map, AlertCircle, Info, Target,
} from "lucide-react";

/* ─── Colour palette — path colours keyed by path ID ────────────────────
   New paths from the backend automatically fall back to the default colour.
   Only path-level UI chrome (labels, cert nodes) uses this map.
──────────────────────────────────────────────────────────────────────── */
const DEFAULT_PATH_COLOR = "#6366f1";
const PATH_COLOR_PALETTE = [
  "#6366f1", "#8b5cf6", "#0ea5e9", "#a855f7", "#10b981", "#f97316",
  "#ef4444", "#eab308", "#06b6d4", "#84cc16",
];

function pathColor(pathId: string, allPathIds: string[]): string {
  const idx = allPathIds.indexOf(pathId);
  return idx >= 0 ? (PATH_COLOR_PALETTE[idx] ?? DEFAULT_PATH_COLOR) : DEFAULT_PATH_COLOR;
}

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  not_started: "#d4d4d8",
  learning:    "#f59e0b",
  practiced:   "#4f8ef7",
  proficient:  "#8b5cf6",
  mastered:    "#16a34a",
};
const MASTERY_LABELS: Record<MasteryLevel, string> = {
  not_started: "Not started",
  learning:    "Learning",
  practiced:   "Practiced",
  proficient:  "Proficient",
  mastered:    "Mastered",
};

const CONCEPT_LABELS: Record<string, string> = {
  superposition: "Superposition", normalization: "State Normalization",
  gates: "Quantum Gates", measurement: "Measurement",
  entanglement: "Entanglement", algorithms: "Quantum Algorithms",
  bloch: "Bloch Sphere",
};

/* ─── Dynamic recommendation engine ─────────────────────────────────────
   Reads from concept_codercises map in module_meta (backend-driven).
   No hardcoded module IDs.
──────────────────────────────────────────────────────────────────────── */
function computeRecommendation(
  moduleOrder: string[],
  moduleMastery: Record<string, ModuleMastery>,
  conceptMastery: Record<string, ConceptMastery>,
  weakConcepts: string[],
  completedModules: Set<string>,
): { moduleId: string; reason: string } | null {

  // Rule 1: completed module has weak concepts from practice → revisit
  for (const moduleId of moduleOrder) {
    if (!completedModules.has(moduleId)) continue;
    const mod = moduleMastery[moduleId];
    if (!mod) continue;
    const weakHere = weakConcepts.filter(c =>
      Object.values(conceptMastery).some((cm: ConceptMastery) => cm.concept === c && cm.mastery === "learning" && cm.attemptCount >= 2)
    );
    if (weakHere.length > 0) {
      const names = weakHere.slice(0, 2).map(c => CONCEPT_LABELS[c] ?? c).join(" and ");
      return { moduleId, reason: `You struggled with ${names} — revisiting this module will strengthen your foundation.` };
    }
  }

  // Rule 2: first unlocked incomplete module
  for (const moduleId of moduleOrder) {
    if (completedModules.has(moduleId)) continue;
    const idx = moduleOrder.indexOf(moduleId);
    const prereqDone = idx === 0 || completedModules.has(moduleOrder[idx - 1]);
    if (prereqDone) {
      return { moduleId, reason: "This is your next step on the learning path." };
    }
  }

  return null;
}

/* ─── Node data type ─────────────────────────────────────────────────── */
interface QNodeData {
  moduleId: string;
  pathId: string;
  label: string;      // abbreviation
  title: string;
  subtitle: string;
  lessonCount: number;
  completedLessons: number;
  mastery: MasteryLevel;
  locked: boolean;
  isCurrent: boolean;
  isRecommended: boolean;
  recommendReason: string;
  color: string;
}

/* ─── Module node ────────────────────────────────────────────────────── */
function ModuleNode({ data }: { data: QNodeData }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const masteryColor = MASTERY_COLORS[data.mastery];
  const pct = data.lessonCount > 0 ? (data.completedLessons / data.lessonCount) * 100 : 0;
  const r = 40;
  const circ = 2 * Math.PI * (r - 7);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <motion.div
          whileHover={!data.locked ? { scale: 1.06 } : {}}
          whileTap={!data.locked ? { scale: 0.96 } : {}}
          onClick={() => !data.locked && router.push(`/codebook/${data.pathId}/${data.moduleId}`)}
          className="relative flex flex-col items-center justify-center select-none"
          style={{ width: 96, height: 96, cursor: data.locked ? "default" : "pointer" }}
        >
          {data.isRecommended && !data.locked && (
            <motion.div className="absolute inset-0 rounded-full"
              style={{ background: `${data.color}20` }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <svg width={96} height={96} className="absolute inset-0 -rotate-90">
            <circle cx={48} cy={48} r={r - 7} fill="none" stroke="#f0f0f2" strokeWidth={6} />
            {pct > 0 && (
              <circle cx={48} cy={48} r={r - 7} fill="none"
                stroke={data.locked ? "#d4d4d8" : masteryColor}
                strokeWidth={6} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            )}
          </svg>
          <div className="relative flex flex-col items-center justify-center rounded-full z-10"
            style={{
              width: 72, height: 72,
              background: data.isRecommended && !data.locked ? `linear-gradient(135deg, ${data.color}15, ${data.color}08)` : data.locked ? "#f7f7f8" : "white",
              border: `2.5px solid ${data.locked ? "#d4d4d8" : data.isRecommended ? data.color : `${data.color}80`}`,
              boxShadow: data.isRecommended && !data.locked ? `0 0 0 3px ${data.color}25, 0 4px 20px ${data.color}30` : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {data.locked ? <Lock size={20} className="text-[#d4d4d8]" /> : (
              <>
                <span className="text-[12px] font-black leading-none" style={{ color: data.mastery === "mastered" ? "#16a34a" : data.color }}>
                  {data.label}
                </span>
                <span className="text-[9px] text-[#a1a1aa] mt-0.5 font-medium">
                  {data.completedLessons}/{data.lessonCount}
                </span>
              </>
            )}
          </div>
          {data.mastery === "mastered" && !data.locked && (
            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#f0fdf4] border-2 border-white rounded-full flex items-center justify-center shadow-sm z-20">
              <CheckCircle size={11} className="text-[#16a34a]" />
            </div>
          )}
          {data.isRecommended && !data.locked && data.mastery !== "mastered" && (
            <motion.div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#fffbeb] border-2 border-white rounded-full flex items-center justify-center shadow-sm z-20"
              animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles size={10} className="text-[#f59e0b]" />
            </motion.div>
          )}
        </motion.div>
        {/* Label below */}
        <div className="absolute top-full mt-2 text-center" style={{ width: 110, left: "50%", transform: "translateX(-50%)" }}>
          <p className="text-[11px] font-semibold text-[#374151] leading-tight line-clamp-2 text-center">{data.title}</p>
          <p className="text-[9px] mt-0.5" style={{ color: data.locked ? "#d4d4d8" : masteryColor }}>
            {data.locked ? "Locked" : MASTERY_LABELS[data.mastery]}
          </p>
        </div>
        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && !data.locked && data.isRecommended && (
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute z-50 left-1/2 -translate-x-1/2" style={{ bottom: "calc(100% + 12px)", width: 220 }}
            >
              <div className="bg-[#111118] text-white rounded-xl px-4 py-3 shadow-xl">
                <div className="flex items-start gap-2">
                  <Sparkles size={12} className="text-[#f59e0b] mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">{data.recommendReason}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </>
  );
}

function PathStartNode({ data }: { data: { label: string; color: string } }) {
  return (
    <>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-sm shadow-sm"
        style={{ borderColor: data.color, background: `${data.color}0e`, color: data.color, whiteSpace: "nowrap" }}
      >
        <BookOpen size={13} />
        {data.label}
      </div>
    </>
  );
}

function CertNode({ data }: { data: { pathId: string; earned: boolean; color: string; pathTitle: string } }) {
  const router = useRouter();
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <motion.div whileHover={{ scale: data.earned ? 1.04 : 1 }}
        onClick={() => data.earned && router.push(`/certification/claim?path=${data.pathId}`)}
        className="flex flex-col items-center gap-1.5 px-5 py-3.5 rounded-2xl border-2 shadow-sm"
        style={{
          borderColor: data.earned ? "#f7c94f" : "#e4e4e7",
          background: data.earned ? "#fffdf0" : "#fafafa",
          opacity: data.earned ? 1 : 0.45,
          cursor: data.earned ? "pointer" : "default",
          minWidth: 140,
        }}
      >
        <Trophy size={20} style={{ color: data.earned ? "#f59e0b" : "#d4d4d8" }} />
        <div className="text-center">
          <p className="text-[11px] font-black" style={{ color: data.earned ? "#92400e" : "#a1a1aa" }}>
            {data.earned ? "Certificate Earned" : "Certificate"}
          </p>
          <p className="text-[9px] text-[#a1a1aa] mt-0.5">{data.pathTitle}</p>
        </div>
      </motion.div>
    </>
  );
}

const NODE_TYPES: NodeTypes = { module: ModuleNode, path_start: PathStartNode, certificate: CertNode };

/* ─── Dynamic graph builder ──────────────────────────────────────────────
   Reads entirely from curriculumMetaStore — zero hardcoded module IDs.
   Layout: each path is a column. Modules stack vertically within columns.
   Prerequisite edges are inferred from module_order within each path
   (earlier module in order → prerequisite for next).
──────────────────────────────────────────────────────────────────────── */
interface BuildArgs {
  meta: CurriculumMeta | null;
  progress: Record<string, { completed: boolean; path_id?: string; module_id?: string }>;
  moduleMastery: Record<string, ModuleMastery>;
  conceptMastery: Record<string, ConceptMastery>;
  weakConcepts: string[];
  allPathIds: string[];
}

function buildGraphDynamic({ meta, progress, moduleMastery, conceptMastery, weakConcepts, allPathIds }: BuildArgs) {
  if (!meta) return { nodes: [], edges: [] };

  const { module_meta, module_order, module_lesson_totals, cert_requirements, path_meta } = meta;

  // Count completed lessons per module
  const moduleCompletions: Record<string, number> = {};
  for (const rec of Object.values(progress)) {
    if (rec.completed && rec.module_id) {
      moduleCompletions[rec.module_id] = (moduleCompletions[rec.module_id] ?? 0) + 1;
    }
  }

  const completedModules = new Set<string>(
    module_order.filter((mid: string) => (moduleCompletions[mid] ?? 0) >= (module_lesson_totals[mid] ?? 1))
  );

  const recommendation = computeRecommendation(
    module_order, moduleMastery, conceptMastery, weakConcepts, completedModules
  );

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const pathIds = allPathIds.filter(pid => path_meta[pid]);

  // ── Layout constants ──────────────────────────────────────────────────────
  const COL_WIDTH   = 260;   // horizontal gap between path columns
  const NODE_STEP   = 170;   // vertical gap between module nodes (node 96px + 74px label+padding)
  const HEADER_H    = 60;    // height reserved for the path header pill
  const CERT_GAP    = 30;    // extra gap after last module before certificate
  const ROW_GAP     = 80;    // vertical gap between path rows
  const COLS_PER_ROW = 3;    // paths per row — keep graph width manageable
  const X_ORIGIN    = 80;
  const Y_ORIGIN    = 80;

  // Compute the total height each path column will occupy (so rows don't overlap)
  function pathHeight(pid: string): number {
    const mods = path_meta[pid]?.modules ?? [];
    return HEADER_H + mods.length * NODE_STEP + CERT_GAP + 70; // 70 = cert node height
  }

  // Assign each path its (col, row) in the grid
  const pathGrid: Record<string, { col: number; row: number }> = {};
  pathIds.forEach((pid, i) => {
    pathGrid[pid] = { col: i % COLS_PER_ROW, row: Math.floor(i / COLS_PER_ROW) };
  });

  // Compute the Y start for each grid row (max height of tallest path in that row)
  const rowStartY: number[] = [];
  const numRows = Math.ceil(pathIds.length / COLS_PER_ROW);
  let accY = Y_ORIGIN;
  for (let r = 0; r < numRows; r++) {
    rowStartY[r] = accY;
    const pathsInRow = pathIds.filter(pid => pathGrid[pid].row === r);
    const maxH = Math.max(...pathsInRow.map(pathHeight));
    accY += maxH + ROW_GAP;
  }

  // Helpers
  const pathX = (pid: string) => X_ORIGIN + (pathGrid[pid]?.col ?? 0) * COL_WIDTH;
  const pathY = (pid: string) => rowStartY[pathGrid[pid]?.row ?? 0] ?? Y_ORIGIN;

  // ── Path header nodes ─────────────────────────────────────────────────────
  for (const pid of pathIds) {
    const pm = path_meta[pid];
    if (!pm) continue;
    const color = pathColor(pid, allPathIds);
    nodes.push({
      id: `ph-${pid}`, type: "path_start",
      position: { x: pathX(pid) - 10, y: pathY(pid) },
      data: { label: pm.title, color },
      draggable: false, selectable: false,
    });
  }

  // ── Module nodes ──────────────────────────────────────────────────────────
  for (const moduleId of module_order) {
    const mod = module_meta[moduleId];
    if (!mod) continue;
    const pathId = mod.path_id;
    const color = pathColor(pathId, allPathIds);

    const pathModules = path_meta[pathId]?.modules ?? [];
    const posInPath = pathModules.indexOf(moduleId);
    if (posInPath < 0) continue;

    const x = pathX(pathId);
    const y = pathY(pathId) + HEADER_H + posInPath * NODE_STEP;

    const lessonCount = module_lesson_totals[moduleId] ?? 1;
    const completed = moduleCompletions[moduleId] ?? 0;
    const mastery: MasteryLevel = moduleMastery[moduleId]?.masteryLevel
      ?? (completed >= lessonCount && lessonCount > 0 ? "proficient"
         : completed > 0 ? "practiced" : "not_started");

    const prereqId = posInPath > 0 ? pathModules[posInPath - 1] : null;
    const locked = prereqId !== null && !completedModules.has(prereqId);
    const isCurrent = !locked && mastery !== "mastered" && completed > 0;
    const isRecommended = recommendation?.moduleId === moduleId;

    // Label: module abbreviation from meta title (first letters of each word, max 3 chars)
    const title = mod.title ?? moduleId;
    const label = title
      .split(/[\s-]+/)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3) || moduleId.slice(0, 3).toUpperCase();

    nodes.push({
      id: moduleId, type: "module",
      position: { x, y },
      data: {
        moduleId, pathId, label, title,
        subtitle: `${lessonCount} lesson${lessonCount !== 1 ? "s" : ""}`,
        lessonCount, completedLessons: completed,
        mastery, locked, isCurrent, isRecommended,
        recommendReason: isRecommended ? (recommendation?.reason ?? "") : "",
        color,
      } as QNodeData,
      draggable: false, selectable: false,
    });

    // Header → first module edge
    if (posInPath === 0) {
      edges.push({
        id: `e-ph-${moduleId}`, source: `ph-${pathId}`, target: moduleId,
        type: "straight",
        style: { stroke: color, strokeWidth: 1.5, opacity: 0.35 },
      });
    }

    // Prereq edge
    if (prereqId) {
      const unlocked = completedModules.has(prereqId);
      edges.push({
        id: `e-${prereqId}-${moduleId}`,
        source: prereqId, target: moduleId,
        type: "straight",
        style: {
          stroke: unlocked ? color : "#d4d4d8",
          strokeWidth: 2, opacity: unlocked ? 0.7 : 0.3,
          strokeDasharray: unlocked ? undefined : "5 4",
        },
        animated: unlocked && mastery === "not_started",
        markerEnd: { type: MarkerType.ArrowClosed, color: unlocked ? color : "#d4d4d8", width: 14, height: 14 },
      });
    }
  }

  // ── Certificate nodes ─────────────────────────────────────────────────────
  for (const pid of pathIds) {
    const pm = path_meta[pid];
    if (!pm || pm.modules.length === 0) continue;
    const color = pathColor(pid, allPathIds);
    const earned = pm.modules.every((mid: string) => completedModules.has(mid));
    const lastMod = pm.modules[pm.modules.length - 1];
    const x = pathX(pid);
    const y = pathY(pid) + HEADER_H + pm.modules.length * NODE_STEP + CERT_GAP;
    const certReq = cert_requirements[pid];

    nodes.push({
      id: `cert-${pid}`, type: "certificate",
      position: { x, y },
      data: { pathId: pid, earned, color, pathTitle: certReq?.path_title ?? pid },
      draggable: false, selectable: false,
    });

    if (lastMod) {
      edges.push({
        id: `e-${lastMod}-cert-${pid}`,
        source: lastMod, target: `cert-${pid}`,
        type: "straight",
        style: { stroke: earned ? "#f59e0b" : "#d4d4d8", strokeWidth: 1.5, opacity: 0.4 },
      });
    }
  }

  return { nodes, edges, recommendation };
}

/* ─── Inner component ────────────────────────────────────────────────── */
function LearningPathInner() {
  const { progress } = useProgressStore();
  const { moduleMastery, conceptMastery, weakConcepts } = useAdaptiveStore();
  const { result: assessmentResult, skipped: assessmentSkipped } = useAssessmentStore();
  const { meta, loading: metaLoading, fetchMeta } = useCurriculumMetaStore();
  const { fitView } = useReactFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMeta();
  }, []);

  const allPathIds = meta?.path_ids ?? [];

  const buildArgs: BuildArgs = {
    meta, progress: progress as any,
    moduleMastery, conceptMastery, weakConcepts, allPathIds,
  };

  const { nodes: initNodes, edges: initEdges, recommendation } = useMemo(
    () => buildGraphDynamic(buildArgs),
    [meta, progress, moduleMastery, conceptMastery, weakConcepts]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraphDynamic(buildArgs);
    setNodes(n);
    setEdges(e);
    setTimeout(() => fitView({ padding: 0.15, duration: 700 }), 150);
  }, [meta, progress, moduleMastery, conceptMastery]);

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-48px)]">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-r border-[#e4e4e7] flex flex-col overflow-y-auto" style={{ background: "#fafafa" }}>
        <div className="px-5 pt-5 pb-4 border-b border-[#f0f0f2]">
          <div className="flex items-center gap-2 mb-1">
            <Map size={13} className="text-[#6366f1]" />
            <h1 className="text-sm font-bold text-[#111118]">Your Learning Path</h1>
          </div>
          <p className="text-xs text-[#71717a] leading-relaxed">
            {metaLoading
              ? "Loading curriculum…"
              : `${allPathIds.length} paths · ${meta?.module_order.length ?? 0} modules · Click any node to open`}
          </p>
        </div>

        {/* Recommended next step */}
        {recommendation && (
          <div className="mx-4 mt-4 p-4 rounded-xl border-2 border-[#6366f1]/30 bg-[#eef2ff]">
            <div className="flex items-center gap-1.5 mb-2">
              <Target size={12} className="text-[#6366f1]" />
              <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider">Recommended Next</p>
            </div>
            {(() => {
              const mod = meta?.module_meta[recommendation.moduleId];
              const pid = mod?.path_id ?? "";
              return (
                <Link href={`/codebook/${pid}/${recommendation.moduleId}`}
                  className="text-sm font-bold text-[#3730a3] hover:underline block mb-1"
                >
                  {recommendation.moduleId.toUpperCase()} →
                </Link>
              );
            })()}
            <p className="text-xs text-[#4f46e5] leading-relaxed">{recommendation.reason}</p>
          </div>
        )}

        {/* Assessment level */}
        {assessmentResult && !assessmentSkipped && (
          <div className="mx-4 mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-[#e4e4e7]">
            <div>
              <p className="text-[10px] text-[#a1a1aa] font-medium">Placement level</p>
              <p className="text-sm font-black text-[#111118] capitalize">{assessmentResult.level}</p>
            </div>
            <Link href="/assessment" className="text-[10px] text-[#6366f1] hover:underline font-medium">Retake</Link>
          </div>
        )}

        {/* Weak concept alerts */}
        {weakConcepts.length > 0 && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle size={11} className="text-[#f59e0b]" />
              <p className="text-[10px] font-bold text-[#92400e] uppercase tracking-wider">Focus Areas</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {weakConcepts.slice(0, 4).map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white border border-[#fde68a] text-[#92400e]">
                  {CONCEPT_LABELS[c] ?? c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Paths legend — generated from meta */}
        {meta && allPathIds.length > 0 && (
          <div className="px-4 py-4 mt-2 border-t border-[#f0f0f2]">
            <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-3">Paths</p>
            <div className="space-y-2">
              {allPathIds.map(pid => {
                const color = pathColor(pid, allPathIds);
                const pm = meta.path_meta[pid];
                return (
                  <Link key={pid} href={`/codebook/${pid}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f0f0f2] transition-colors group"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-[#374151] truncate">{pm?.title ?? pid}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Mastery legend */}
        <div className="px-4 pb-4 border-t border-[#f0f0f2] pt-4">
          <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-3">Mastery Legend</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {(Object.entries(MASTERY_COLORS) as [MasteryLevel, string][]).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-[#52525b]">{MASTERY_LABELS[level]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration */}
        <div className="mt-auto border-t border-[#f0f0f2] overflow-hidden" style={{ height: 180 }}>
          <Image src="/illustrations/personlearning quantum computing.svg" alt="Learning"
            width={288} height={180} className="w-full h-full object-cover object-top"
          />
        </div>
      </aside>

      {/* ── React Flow canvas ─────────────────────────────────── */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 z-0">
          <Image src="/illustrations/learnerpagelearningpath.png" alt="background"
            fill className="object-cover object-center opacity-[0.18]"
          />
        </div>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView fitViewOptions={{ padding: 0.22 }}
          panOnDrag zoomOnScroll minZoom={0.25} maxZoom={2.2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "transparent" }}
        >
          <Background color="#c7d2fe" gap={28} size={1} style={{ opacity: 0.15, background: "transparent" }} />
          <Controls showInteractive={false} style={{ bottom: 16, right: 16, left: "auto", top: "auto" }} />
          <Panel position="top-left">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-[#e4e4e7] rounded-xl px-3 py-2 shadow-sm">
              <Info size={12} className="text-[#a1a1aa]" />
              <span className="text-[11px] text-[#71717a]">
                {metaLoading ? "Loading…" : `${nodes.length - allPathIds.length * 2} modules across ${allPathIds.length} paths`}
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function LearningPathPage() {
  return (
    <ReactFlowProvider>
      <LearningPathInner />
    </ReactFlowProvider>
  );
}

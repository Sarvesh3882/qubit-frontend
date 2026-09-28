"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { curriculumApi } from "@/lib/api";
import { useProgressStore } from "@/store/progressStore";
import { useAuthStore } from "@/store/authStore";
import { progressPercent } from "@/lib/utils";
import {
  CheckCircleIcon,
  LockClosedIcon,
  BookOpenIcon,
  MapIcon,
  AcademicCapIcon,
  SparklesIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

/* ─── types ─────────────────────────────────────────────────────────────── */
interface MapNode {
  id: string;
  path_id: string;
  label: string;
  title: string;
  lesson_count: number;
  color: string;
}
interface MapEdge { source: string; target: string }
interface MapPath {
  id: string;
  title: string;
  description: string;
  color: string;
  lesson_count: number;
}
interface MapData {
  nodes: MapNode[];
  edges: MapEdge[];
  paths: MapPath[];
}

/* ─── Fixed positions matching the background illustration layout ────────── */
// Image is 1456×816 native, mapped to our 1200×700 canvas coordinate space.
// Five named biomes with visible white-circle placeholders:
//
//  "Superposition Shores"             → left-center island (~200–520, 200–480)
//  "Entanglement Valley & Gates"      → centre island     (~500–820, 280–560)
//  "Algorithms & Future Peaks"        → top-right dark    (~820–1200, 40–300)
//  "The Classical Gateway"            → bottom-left dark  (~50–380, 460–700)
//  "The Dilution Chandelier & Coherence" → bottom-right   (~880–1200, 480–700)
//
// Each circle below is placed on a white-circle placeholder visible in the image.

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {

  // ── Superposition Shores ──────────────────────────────────────────────────
  sq:            { x: 192, y: 248 },   // left circle on shores
  iqc:           { x: 308, y: 248 },   // right circle on shores
  pf:            { x: 72,  y: 368 },   // far-left lone circle

  // ── Entanglement Valley & Gates ───────────────────────────────────────────
  mq:            { x: 508, y: 268 },   // upper circle — gate arches area
  sh:            { x: 408, y: 368 },   // mid circle — entangled spheres
  te:            { x: 548, y: 448 },   // lower circle — valley floor

  // ── Path between shores and algorithms (junction island) ─────────────────
  hs:            { x: 448, y: 128 },   // lone circle on small top island

  // ── Algorithms & Future Peaks ─────────────────────────────────────────────
  "qalgo-dj":    { x: 588, y: 108 },   // DJ — entering peaks path
  "qalgo-grover":{ x: 728, y: 168 },   // GR — deeper in dark zone
  qpe:           { x: 908, y: 228 },   // right side of dark zone
  qft:           { x: 1068, y: 148 },  // upper-right equations area

  // ── The Classical Gateway ─────────────────────────────────────────────────
  ga:            { x: 88,  y: 468 },   // upper gateway circle
  ba:            { x: 288, y: 568 },   // lower Bloch sphere circle

  // ── The Dilution Chandelier & Coherence ───────────────────────────────────
  ec:            { x: 868, y: 568 },   // left coherence/crystals circle
  dm:            { x: 1068, y: 608 },  // right dilution fridge circle
};

const PATH_COLORS: Record<string, string> = {
  intro:       "#4f8ef7",
  algorithms:  "#f7c94f",
  hardware:    "#c44ff7",
  errorCorr:   "#4ff7a4",
};

/* ─── SVG Node Component ─────────────────────────────────────────────────── */
interface NodeProps {
  node: MapNode;
  pos: { x: number; y: number };
  completed: number;
  isHighlighted: boolean;
  onClick: () => void;
}

function MapNodeCircle({ node, pos, completed, isHighlighted, onClick }: NodeProps) {
  const total = node.lesson_count;
  const done = completed === total && total > 0;
  const pct = total > 0 ? (completed / total) : 0;
  const r = 32;
  const circumference = 2 * Math.PI * (r - 4);
  const strokeDash = circumference * pct;

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      className="cursor-pointer"
      onClick={onClick}
      style={{ filter: isHighlighted ? `drop-shadow(0 0 12px ${node.color})` : undefined }}
    >
      {/* Outer progress ring */}
      <circle
        r={r}
        fill="white"
        stroke="#e4e4e7"
        strokeWidth={2}
      />
      {pct > 0 && (
        <circle
          r={r - 4}
          fill="none"
          stroke={done ? "#16a34a" : node.color}
          strokeWidth={4}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90)"
        />
      )}

      {/* Hover ring */}
      <circle
        r={r + 4}
        fill="none"
        stroke={node.color}
        strokeWidth={1.5}
        opacity={isHighlighted ? 0.6 : 0}
        className="transition-opacity duration-200"
      />

      {/* Label */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        y={done ? -6 : -4}
        fontSize={13}
        fontWeight="700"
        fill={done ? "#16a34a" : node.color}
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {node.label}
      </text>

      {/* Progress count */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        y={done ? 8 : 10}
        fontSize={10}
        fill="#a1a1aa"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {completed}/{total}
      </text>

      {/* Done checkmark */}
      {done && (
        <text textAnchor="middle" dominantBaseline="middle" y={20} fontSize={11} fill="#16a34a">
          ✓
        </text>
      )}
    </g>
  );
}

/* ─── Path Card ─────────────────────────────────────────────────────────── */
function PathCard({
  path,
  isActive,
  onHover,
  onLeave,
}: {
  path: MapPath;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const { user } = useAuthStore();
  const { pathProgress } = useProgressStore();
  const { completed, total } = pathProgress(path.id, path.lesson_count);
  const pct = progressPercent(completed, total);

  return (
    <motion.div
      whileHover={{ x: 3 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="rounded-xl border p-4 cursor-pointer transition-all duration-200"
      style={{
        borderColor: isActive ? path.color : "#e4e4e7",
        background: isActive ? `${path.color}08` : "white",
        boxShadow: isActive ? `0 0 0 1px ${path.color}40, 0 4px 12px ${path.color}15` : "none",
      }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: path.color }}
        />
        <h3 className="flex-1 text-sm font-semibold text-[#111118] leading-snug">
          {path.title}
        </h3>
      </div>

      {/* Progress */}
      {user ? (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#a1a1aa]">{completed}/{total} lessons</span>
            <span className="text-[11px] font-semibold" style={{ color: path.color }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#f0f0f2] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: path.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-[#a1a1aa] mb-3">
          <Link href="/auth/login" className="hover:underline" style={{ color: path.color }}>
            Sign in
          </Link>{" "}
          to track progress
        </p>
      )}

      <Link href={`/codebook/${path.id}`}>
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: isActive ? `${path.color}15` : "#f7f7f8",
            color: isActive ? path.color : "#52525b",
          }}
        >
          Explore path
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function CodebookMapPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const panStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { moduleProgress } = useProgressStore();
  const { user } = useAuthStore();

  useEffect(() => {
    curriculumApi.getMapData()
      .then((res) => setMapData(res.data))
      .catch(() => setMapData(null))
      .finally(() => setLoading(false));
  }, []);

  /* Pan handlers */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest(".node-group")) return;
    setIsPanning(true);
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.mx),
      y: panStart.current.py + (e.clientY - panStart.current.my),
    });
  }, [isPanning]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001;
    setZoom((z) => Math.min(2.5, Math.max(0.4, z - delta)));
  }, []);

  /* Build node data */
  const nodeData = mapData?.nodes.map((n) => {
    const pos = NODE_POSITIONS[n.id] ?? { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 };
    const { completed } = moduleProgress(n.id, n.lesson_count);
    return { ...n, pos, completed };
  }) ?? [];

  /* Filter by active path */
  const visibleNodes = activePathId
    ? nodeData.filter((n) => n.path_id === activePathId)
    : nodeData;
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const visibleEdges = (mapData?.edges ?? []).filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  const CANVAS_W = 1200;
  const CANVAS_H = 672; // 1200 × (816/1456) to preserve aspect ratio

  return (
    <div
      className={`flex bg-white transition-all duration-300 ${fullscreen ? "fixed inset-0 z-50" : "h-[calc(100vh-48px)]"}`}
    >
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      {!fullscreen && (
        <aside className="w-72 shrink-0 border-r border-[#e4e4e7] bg-[#fafafa] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 border-b border-[#f0f0f2]">
            <div className="flex items-center gap-2 mb-4">
              <MapIcon className="w-4 h-4 text-[#4f46e5]" />
              <h1 className="text-lg font-bold text-[#111118]">Codebook Map</h1>
            </div>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Your quantum journey starts here. Choose a module to explore an advanced topic or follow a guided learning path!
            </p>
          </div>

          {/* Stats row */}
          {user && mapData && (
            <div className="px-4 py-3 border-b border-[#f0f0f2] grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl border border-[#e4e4e7] p-3 text-center">
                <div className="text-xl font-black text-[#4f46e5]">
                  {nodeData.filter((n) => n.completed === n.lesson_count && n.lesson_count > 0).length}
                </div>
                <div className="text-[10px] text-[#a1a1aa] mt-0.5">Completed</div>
              </div>
              <div className="bg-white rounded-xl border border-[#e4e4e7] p-3 text-center">
                <div className="text-xl font-black text-[#f7c94f]">
                  {nodeData.reduce((a, n) => a + n.completed, 0)}
                </div>
                <div className="text-[10px] text-[#a1a1aa] mt-0.5">Lessons done</div>
              </div>
            </div>
          )}

          {/* Path list */}
          {/* Biome guide */}
          <div className="px-4 pb-4">
            <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2 px-1">Map regions</p>
            <div className="space-y-1.5">
              {[
                { name: "Superposition Shores",    color: "#4f8ef7", desc: "Qubits & single-qubit gates" },
                { name: "Entanglement Valley & Gates", color: "#c44ff7", desc: "Multi-qubit & entanglement" },
                { name: "Algorithms & Future Peaks",  color: "#f7c94f", desc: "Grover, QFT, QPE & more" },
                { name: "The Classical Gateway",   color: "#94a3b8", desc: "Classical computing foundations" },
                { name: "Dilution Chandelier & Coherence", color: "#4ff7a4", desc: "Hardware & error correction" },
              ].map((r) => (
                <div key={r.name} className="flex items-start gap-2 px-1">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: r.color }} />
                  <div>
                    <p className="text-[11px] font-semibold text-[#374151] leading-tight">{r.name}</p>
                    <p className="text-[10px] text-[#a1a1aa]">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#f0f0f2] mx-4" />

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5">
            <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest px-1 mb-3">
              Browse learning paths
            </p>

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[#e4e4e7] p-4 animate-pulse">
                  <div className="h-3 bg-[#f0f0f2] rounded w-3/4 mb-3" />
                  <div className="h-2 bg-[#f0f0f2] rounded w-full mb-2" />
                  <div className="h-7 bg-[#f0f0f2] rounded mt-3" />
                </div>
              ))
            ) : mapData?.paths.length ? (
              mapData.paths.map((path) => (
                <PathCard
                  key={path.id}
                  path={path}
                  isActive={activePathId === path.id}
                  onHover={() => setActivePathId(path.id)}
                  onLeave={() => setActivePathId(null)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-[#a1a1aa]">
                <BookOpenIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No paths available yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#f0f0f2]">
            <Link
              href="/codebook"
              className="flex items-center gap-2 text-xs text-[#71717a] hover:text-[#4f46e5] transition-colors"
            >
              <BookOpenIcon className="w-3.5 h-3.5" />
              Back to Codebook homepage
            </Link>
          </div>
        </aside>
      )}

      {/* ── MAP CANVAS ──────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur border border-[#e4e4e7] rounded-xl px-2 py-1.5 shadow-sm">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="w-6 h-6 flex items-center justify-center text-[#52525b] hover:text-[#111118] hover:bg-[#f0f0f2] rounded transition-colors text-lg font-bold"
            >
              −
            </button>
            <span className="text-xs font-medium text-[#52525b] w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              className="w-6 h-6 flex items-center justify-center text-[#52525b] hover:text-[#111118] hover:bg-[#f0f0f2] rounded transition-colors text-lg font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="bg-white/90 backdrop-blur border border-[#e4e4e7] rounded-xl px-3 py-1.5 text-xs text-[#52525b] hover:text-[#111118] shadow-sm transition-colors"
          >
            Reset
          </button>

          <button
            onClick={() => setFullscreen((f) => !f)}
            className="bg-white/90 backdrop-blur border border-[#e4e4e7] rounded-xl p-1.5 text-[#52525b] hover:text-[#111118] shadow-sm transition-colors"
          >
            {fullscreen
              ? <ArrowsPointingInIcon className="w-4 h-4" />
              : <ArrowsPointingOutIcon className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur border border-[#e4e4e7] rounded-xl px-3 py-2.5 shadow-sm">
          <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#e4e4e7] bg-white" />
              <span className="text-[11px] text-[#71717a]">Not started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#4f46e5] bg-white" />
              <span className="text-[11px] text-[#71717a]">In progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#16a34a] bg-white" />
              <span className="text-[11px] text-[#71717a]">Complete</span>
            </div>
          </div>
        </div>

        {/* SVG canvas */}
        <div
          className="w-full h-full"
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
          >
            <defs>
              <pattern id="bgImg" patternUnits="userSpaceOnUse" width={CANVAS_W} height={CANVAS_H}>
                <image
                  href="/illustrations/quantumcomputingcodebookbackground.png"
                  width={CANVAS_W}
                  height={CANVAS_H}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            </defs>

            <g transform={`translate(${CANVAS_W/2 + pan.x}, ${CANVAS_H/2 + pan.y}) scale(${zoom}) translate(${-CANVAS_W/2}, ${-CANVAS_H/2})`}>
              {/* Background image fills the canvas */}
              <rect
                x={0} y={0}
                width={CANVAS_W}
                height={CANVAS_H}
                fill="url(#bgImg)"
                rx={16}
              />

              {/* Edges */}
              {visibleEdges.map((edge, i) => {
                const src = nodeData.find((n) => n.id === edge.source);
                const tgt = nodeData.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;
                const dimmed = activePathId !== null && !(visibleNodeIds.has(src.id) && visibleNodeIds.has(tgt.id));
                return (
                  <line
                    key={i}
                    x1={src.pos.x} y1={src.pos.y}
                    x2={tgt.pos.x} y2={tgt.pos.y}
                    stroke={dimmed ? "#d4d4d840" : "#22222250"}
                    strokeWidth={1.5}
                    strokeDasharray={dimmed ? "4 4" : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {nodeData.map((n) => {
                const dimmed = activePathId !== null && !visibleNodeIds.has(n.id);
                return (
                  <g
                    key={n.id}
                    className="node-group"
                    opacity={dimmed ? 0.25 : 1}
                    style={{ transition: "opacity 0.2s" }}
                    onMouseEnter={() => setHoveredNodeId(n.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => {
                      window.location.href = `/codebook/${n.path_id}/${n.id}`;
                    }}
                  >
                    <MapNodeCircle
                      node={n}
                      pos={n.pos}
                      completed={n.completed}
                      isHighlighted={hoveredNodeId === n.id}
                      onClick={() => {}}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredNodeId && (() => {
            const n = nodeData.find((x) => x.id === hoveredNodeId);
            if (!n) return null;
            return (
              <motion.div
                key={hoveredNodeId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div className="bg-[#111118] text-white rounded-xl px-4 py-2.5 shadow-xl text-center">
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                    {n.completed}/{n.lesson_count} lessons · click to open
                  </p>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && !mapData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#f7f7f8]">
            <AcademicCapIcon className="w-16 h-16 text-[#d4d4d8]" />
            <div className="text-center">
              <p className="text-base font-semibold text-[#52525b]">Map unavailable</p>
              <p className="text-sm text-[#a1a1aa] mt-1">Start the backend to load the curriculum</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-[#4338ca] transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

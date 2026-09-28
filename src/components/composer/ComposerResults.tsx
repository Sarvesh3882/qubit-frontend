"use client";
import dynamic from "next/dynamic";
import { useComposerStore } from "@/store/composerStore";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

const BlochSphere3D = dynamic(() => import("./BlochSphere3D"), { ssr: false });
const QSphere3D     = dynamic(() => import("./QSphere3D"),     { ssr: false });

export default function ComposerResults() {
  const { result, activeTab, setActiveTab } = useComposerStore();

  if (!result || !result.success) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "#484f58" }}
      >
        {result?.error ?? "Run the circuit to see results"}
      </div>
    );
  }

  return (
    <div className="flex h-full">

      {/* ── Left — Probabilities (matches IBM layout) ──────────────────── */}
      <div
        className="flex-1 flex flex-col border-r"
        style={{ borderColor: "#21262d" }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-4 h-9 border-b shrink-0"
          style={{ borderColor: "#21262d" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#8b949e" }}>
            Probabilities
          </span>
          <span className="text-[10px] font-mono" style={{ color: "#484f58" }}>
            {result.shots.toLocaleString()} shots
          </span>
        </div>

        <div className="flex-1 px-3 py-2 overflow-hidden">
          <ProbabilityChart probabilities={result.probabilities} />
        </div>
      </div>

      {/* ── Right — Tabbed visualizations ─────────────────────────────── */}
      <div className="w-[340px] shrink-0 flex flex-col">
        {/* Tab bar */}
        <div
          className="flex border-b shrink-0"
          style={{ borderColor: "#21262d" }}
        >
          {(["Statevector", "Bloch", "Q-Sphere"] as const).map((t) => {
            const key = t === "Statevector" ? "statevector"
                      : t === "Bloch"       ? "bloch"
                      : "qsphere";
            const active = activeTab === key;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className="flex-1 h-9 text-xs font-medium transition-colors relative"
                style={{
                  color: active ? "#4589ff" : "#7d8590",
                }}
              >
                {t}
                {active && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "#4589ff" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "statevector" && (
            <StatevectorPanel sv={result.statevector} />
          )}
          {activeTab === "bloch" && (
            <BlochPanel bloch={result.bloch_spheres} />
          )}
          {activeTab === "qsphere" && (
            <QSpherePanel points={result.qsphere} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Probability histogram (IBM-style) ─────────────────────────────────── */
function ProbabilityChart({
  probabilities,
}: {
  probabilities: Record<string, number>;
}) {
  const data = Object.entries(probabilities)
    .map(([state, prob]) => ({ state, prob: Math.round(prob * 1000) / 10 }))
    .filter((d) => d.prob > 0.01)
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 32);

  if (data.length === 0) {
    return (
      <div
        className="flex h-full items-end justify-start pl-4 pb-2"
      >
        {/* Show single 100% bar for |0...0⟩ state */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-8 rounded-t"
            style={{ height: "60px", background: "#4589ff" }}
          />
          <span style={{ color: "#7d8590", fontSize: 9, fontFamily: "monospace" }}>
            {Object.keys(probabilities)[0]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 6, right: 4, left: -8, bottom: data.length > 8 ? 32 : 24 }}
        barCategoryGap="20%"
      >
        <CartesianGrid vertical={false} stroke="#1c2128" strokeDasharray="0" />
        <XAxis
          dataKey="state"
          tick={{ fill: "#6e7681", fontSize: 9, fontFamily: "monospace" }}
          axisLine={{ stroke: "#30363d" }}
          tickLine={false}
          angle={data.length > 6 ? -45 : 0}
          textAnchor={data.length > 6 ? "end" : "middle"}
          interval={0}
          label={{
            value: "Computational basis states",
            position: "insideBottom",
            offset: -10,
            fill: "#484f58",
            fontSize: 9,
          }}
        />
        <YAxis
          tick={{ fill: "#6e7681", fontSize: 9 }}
          axisLine={{ stroke: "#30363d" }}
          tickLine={false}
          domain={[0, 100]}
          unit="%"
          label={{
            value: "Probability (%)",
            angle: -90,
            position: "insideLeft",
            offset: 12,
            fill: "#484f58",
            fontSize: 9,
          }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
          }}
          labelStyle={{ color: "#8b949e" }}
          itemStyle={{ color: "#4589ff" }}
          formatter={(v: unknown) => [`${v}%`, "P"]}
        />
        <Bar dataKey="prob" radius={[2, 2, 0, 0]} maxBarSize={32}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.prob > 99 ? "#4589ff" : entry.prob > 49 ? "#4589ff" : "#0f62fe"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Statevector panel ─────────────────────────────────────────────────── */
function StatevectorPanel({ sv }: { sv: { re: number; im: number }[] }) {
  const n = sv.length > 0 ? Math.round(Math.log2(sv.length)) : 1;
  const significant = sv
    .map((amp, i) => ({ i, ...amp, prob: amp.re ** 2 + amp.im ** 2 }))
    .filter((a) => a.prob > 0.0001);

  return (
    <div className="px-4 py-3 space-y-1.5">
      <p className="text-[10px] mb-3" style={{ color: "#484f58" }}>
        {significant.length} of {sv.length} basis states
      </p>
      {significant.map(({ i, re, im, prob }) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-14 shrink-0 font-mono text-[10px]"
            style={{ color: "#6e7681" }}
          >
            |{i.toString(2).padStart(n, "0")}⟩
          </span>
          {/* Probability bar */}
          <div
            className="flex-1 rounded-sm overflow-hidden"
            style={{ height: 4, background: "#161b22" }}
          >
            <div
              className="h-full rounded-sm"
              style={{
                width: `${prob * 100}%`,
                background: `hsl(${210 + i * 25}, 80%, 55%)`,
              }}
            />
          </div>
          <span
            className="w-28 text-right shrink-0 font-mono text-[10px]"
            style={{ color: "#8b949e" }}
          >
            {fmtCpx(re, im)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Bloch sphere panel ────────────────────────────────────────────────── */
function BlochPanel({
  bloch,
}: {
  bloch: Record<string, { x: number; y: number; z: number }>;
}) {
  const entries = Object.entries(bloch);
  const perRow  = entries.length <= 2 ? 1 : 2;
  const sphereSize = entries.length === 1 ? 220 : entries.length <= 2 ? 180 : 120;

  return (
    <div
      className={cn(
        "p-3 flex flex-wrap gap-4 items-start justify-center",
        entries.length === 1 && "justify-center"
      )}
    >
      {entries.map(([q, coords]) => (
        <BlochSphere3D
          key={q}
          x={coords.x}
          y={coords.y}
          z={coords.z}
          label={q}
          size={sphereSize}
        />
      ))}
    </div>
  );
}

/* ─── Q-sphere panel ────────────────────────────────────────────────────── */
function QSpherePanel({
  points,
}: {
  points: { state: string; prob: number; phase: number }[];
}) {
  return (
    <div className="flex items-center justify-center h-full p-2">
      <QSphere3D points={points} size={260} />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtCpx(re: number, im: number): string {
  const r = re.toFixed(3);
  const i = Math.abs(im).toFixed(3);
  const sign = im >= 0 ? "+" : "−";
  return `${r} ${sign} ${i}i`;
}

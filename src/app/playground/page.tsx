"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { algorithmsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Play, ChevronRight } from "lucide-react";

interface Param {
  name: string; type: string;
  default: string | number;
  min?: number; max?: number;
  options?: string[]; label: string;
}
interface Algorithm {
  id: string; title: string; category: string; description: string;
  complexity: { classical: string; quantum: string };
  parameters: Param[];
}

const CATEGORY_COLOR: Record<string, string> = {
  oracle:       "blue",
  search:       "blue",
  transform:    "blue",
  optimization: "blue",
};

export default function PlaygroundPage() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selected, setSelected]     = useState<Algorithm | null>(null);
  const [params, setParams]         = useState<Record<string, string | number>>({});
  const [result, setResult]         = useState<Record<string, unknown> | null>(null);
  const [running, setRunning]       = useState(false);

  useEffect(() => {
    algorithmsApi.list().then((res) => {
      setAlgorithms(res.data);
      if (res.data.length > 0) pick(res.data[0]);
    });
  }, []);

  const pick = (algo: Algorithm) => {
    setSelected(algo);
    const d: Record<string, string | number> = {};
    algo.parameters.forEach((p) => { d[p.name] = p.default; });
    setParams(d);
    setResult(null);
  };

  const run = async () => {
    if (!selected) return;
    setRunning(true);
    try {
      const res = await algorithmsApi.run(selected.id, params);
      setResult(res.data);
    } catch {
      toast.error("Run failed — is the backend running?");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] bg-white">

      {/* ── Algorithm list (left) ─────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-[#e4e4e7] flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-[#f0f0f2]">
          <h1 className="text-base font-bold text-[#111118]">Algorithm Playground</h1>
          <p className="text-xs text-[#71717a] mt-0.5">Experiment with quantum algorithms</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {algorithms.map((algo) => (
            <button
              key={algo.id}
              onClick={() => pick(algo)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#f7f7f8] last:border-0",
                selected?.id === algo.id
                  ? "bg-[#f0f0f2]"
                  : "hover:bg-[#f7f7f8]"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111118] leading-snug">{algo.title}</p>
                <p className="text-[11px] text-[#71717a] mt-0.5 leading-snug line-clamp-2">
                  {algo.description}
                </p>
              </div>
              {selected?.id === algo.id && (
                <ChevronRight size={13} className="text-[#4f46e5] mt-0.5 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Workbench (right) ────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#111118]">{selected.title}</h2>
                <p className="text-sm text-[#52525b] mt-1 leading-relaxed">{selected.description}</p>
                {(selected as Algorithm & { solver?: string }).solver && (
                  <span className="inline-flex items-center mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          background: (selected as Algorithm & { solver?: string }).solver?.includes("D-Wave") ? "#f0fdf4" : "#f0f0ff",
                          color:      (selected as Algorithm & { solver?: string }).solver?.includes("D-Wave") ? "#16a34a" : "#4f46e5",
                          borderColor: (selected as Algorithm & { solver?: string }).solver?.includes("D-Wave") ? "#bbf7d0" : "#c7d2fe",
                        }}>
                    {(selected as Algorithm & { solver?: string }).solver}
                  </span>
                )}
              </div>
              <Button onClick={run} loading={running} className="shrink-0">
                <Play size={12} /> Run
              </Button>
            </div>

            {/* Complexity table */}
            <div className="flex gap-0 border border-[#e4e4e7] rounded-lg overflow-hidden mb-6">
              <div className="flex-1 px-4 py-3 border-r border-[#e4e4e7]">
                <p className="text-[10px] text-[#a1a1aa] uppercase tracking-wider mb-1">Classical</p>
                <p className="text-base font-bold font-mono text-[#52525b]">
                  {selected.complexity.classical}
                </p>
              </div>
              <div className="flex-1 px-4 py-3 bg-[#f7f7ff]">
                <p className="text-[10px] text-[#4f46e5] uppercase tracking-wider mb-1">Quantum</p>
                <p className="text-base font-bold font-mono text-[#4f46e5]">
                  {selected.complexity.quantum}
                </p>
              </div>
            </div>

            {/* Parameters */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#111118] uppercase tracking-wide mb-3">
                Parameters
              </p>
              <div className="grid grid-cols-2 gap-3">
                {selected.parameters.map((p) => (
                  <div key={p.name}>
                    <label className="block text-xs font-medium text-[#52525b] mb-1">
                      {p.label}
                    </label>
                    {p.type === "select" ? (
                      <select
                        value={params[p.name] as string}
                        onChange={(e) =>
                          setParams((prev) => ({ ...prev, [p.name]: e.target.value }))
                        }
                        className="w-full h-8 px-2 rounded border border-[#d4d4d8] text-sm text-[#111118] bg-white focus:outline-none focus:border-[#4f46e5]"
                      >
                        {p.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : p.type === "string" ? (
                      <input
                        type="text"
                        value={params[p.name] as string}
                        onChange={(e) =>
                          setParams((prev) => ({ ...prev, [p.name]: e.target.value }))
                        }
                        className="w-full h-8 px-2 rounded border border-[#d4d4d8] text-sm font-mono text-[#111118] bg-white focus:outline-none focus:border-[#4f46e5]"
                      />
                    ) : (
                      <input
                        type="number"
                        value={params[p.name] as number}
                        min={p.min}
                        max={p.max}
                        onChange={(e) =>
                          setParams((prev) => ({ ...prev, [p.name]: parseInt(e.target.value) }))
                        }
                        className="w-full h-8 px-2 rounded border border-[#d4d4d8] text-sm font-mono text-[#111118] bg-white focus:outline-none focus:border-[#4f46e5]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            {result && <AlgorithmResults result={result} />}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-[#a1a1aa]">
          Select an algorithm to begin
        </div>
      )}
    </div>
  );
}

/* ─── Results panel ──────────────────────────────────────────────────────── */
function AlgorithmResults({ result }: { result: Record<string, unknown> }): React.ReactElement {
  const isAnnealing = typeof result.solver === "string" && result.solver.includes("D-Wave");

  /* ── D-Wave / annealing result ─────────────────────────────────────────── */
  if (isAnnealing) {
    const items = result.items as { item: number; weight: number; value: number; selected: boolean }[] | undefined;
    const setA = result.set_A as number[] | undefined;
    const setB = result.set_B as number[] | undefined;
    const energyHist = result.energy_histogram as { energy: number; count: number }[] | undefined;
    // Extract string fields as typed variables so TSX doesn't see `unknown`
    const solverStr  = String(result.solver   ?? "");
    const algoStr    = String(result.algorithm ?? "");
    const verdictStr = String(result.verdict   ?? "");
    const tourStr    = String(result.tour_string ?? "");

    return (
      <div className="space-y-4 pt-2 border-t border-[#e4e4e7]">
        <p className="text-xs font-semibold text-[#111118] uppercase tracking-wide mt-4">Results</p>

        {/* Solver badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
            {solverStr}
          </span>
          {!!result.algorithm && (
            <span className="text-[10px] text-[#a1a1aa]">{algoStr}</span>
          )}
        </div>

        {/* Verdict */}
        {!!result.verdict && (
          <div className="px-4 py-3 rounded-lg bg-[#f0f9ff] border border-[#bae6fd]">
            <p className="text-[10px] text-[#0284c7] uppercase tracking-wider mb-0.5">Optimal solution</p>
            <p className="text-base font-bold font-mono text-[#0369a1]">{verdictStr}</p>
          </div>
        )}

        {/* Key stats */}
        <div className="flex flex-wrap gap-4">
          {(
            [
              result.cut_value    != null ? ["Cut edges",     String(result.cut_value) + " / " + String(result.max_possible)] : null,
              (result.tour_distance != null && result.tour_distance !== "invalid") ? ["Tour distance", String(result.tour_distance)] : null,
              result.total_value  != null ? ["Total value",   String(result.total_value)] : null,
              result.total_weight != null ? ["Weight used",   String(result.total_weight) + " / " + String(result.capacity)] : null,
              result.best_energy  != null ? ["Best energy",   String(result.best_energy)] : null,
              result.num_reads    != null ? ["Reads",         String(result.num_reads)] : null,
            ] as ([string, string] | null)[]
          ).filter((x): x is [string, string] => x !== null).map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">{label}</span>
              <span className="text-lg font-bold font-mono text-[#111118] leading-tight">{value}</span>
            </div>
          ))}
        </div>

        {/* Max-Cut: partition */}
        {setA && setB && (
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2.5 rounded-lg bg-[#f0f0f2]">
              <p className="text-[10px] text-[#a1a1aa] mb-1">Set A</p>
              <p className="font-mono font-semibold text-sm text-[#111118]">{"{" + setA.join(", ") + "}"}</p>
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-[#f0f0f2]">
              <p className="text-[10px] text-[#a1a1aa] mb-1">Set B</p>
              <p className="font-mono font-semibold text-sm text-[#111118]">{"{" + setB.join(", ") + "}"}</p>
            </div>
          </div>
        )}

        {/* TSP route */}
        {!!result.tour_string && (
          <div className="px-3 py-2.5 rounded-lg bg-[#f0f0f2]">
            <p className="text-[10px] text-[#a1a1aa] mb-1">Best tour</p>
            <p className="font-mono font-semibold text-sm text-[#4f46e5]">{tourStr}</p>
          </div>
        )}

        {/* Knapsack: items table */}
        {items && items.length > 0 && (
          <div className="rounded-lg border border-[#e4e4e7] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f7f7f8] border-b border-[#e4e4e7]">
                  <th className="px-3 py-2 text-left text-[#a1a1aa] font-medium">Item</th>
                  <th className="px-3 py-2 text-right text-[#a1a1aa] font-medium">Weight</th>
                  <th className="px-3 py-2 text-right text-[#a1a1aa] font-medium">Value</th>
                  <th className="px-3 py-2 text-center text-[#a1a1aa] font-medium">Selected</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.item}
                      className={"border-b border-[#f0f0f2] last:border-0 " + (item.selected ? "bg-[#f0fdf4]" : "")}>
                    <td className="px-3 py-2 font-mono text-[#111118]">#{item.item}</td>
                    <td className="px-3 py-2 text-right text-[#52525b]">{item.weight}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#111118]">{item.value}</td>
                    <td className="px-3 py-2 text-center">
                      {item.selected ? (
                        <span className="text-[#16a34a] font-bold">✓</span>
                      ) : (
                        <span className="text-[#d4d4d8]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Energy histogram for Max-Cut */}
        {energyHist && energyHist.length > 0 && (
          <div>
            <p className="text-[11px] text-[#a1a1aa] mb-2">Energy distribution ({result.num_reads as number} reads)</p>
            <div className="h-36 bg-[#f7f7f8] rounded-lg border border-[#e4e4e7] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyHist.map(e => ({ e: e.energy.toFixed(1), n: e.count }))}
                          margin={{ top: 4, right: 4, left: -16, bottom: 20 }}>
                  <XAxis dataKey="e" tick={{ fill: "#71717a", fontSize: 9 }} angle={-35}
                         textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="n" radius={[2, 2, 0, 0]}>
                    {energyHist.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#16a34a" : "#86efac"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Gate-model result (existing) ──────────────────────────────────────── */
  const probabilities = result.probabilities as Record<string, number> | undefined;
  const chartData = probabilities
    ? Object.entries(probabilities)
        .filter(([, v]) => v > 0.001)
        .map(([s, p]) => ({ state: `|${s}⟩`, prob: Math.round(p * 100) }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 24)
    : [];

  const hasResult =
    !!(result.verdict || result.target || result.secret_string || result.recovered);

  return (
    <div className="space-y-4 pt-2 border-t border-[#e4e4e7]">
      <p className="text-xs font-semibold text-[#111118] uppercase tracking-wide mt-4">Results</p>

      {/* Key output */}
      {hasResult && (
        <div className="flex flex-wrap gap-4">
          {[
            result.verdict        && ["Result",    String(result.verdict)],
            result.target         && ["Target",    `|${String(result.target)}⟩`],
            result.iterations     && ["Iterations", String(result.iterations)],
            result.secret_string  && ["Secret",    String(result.secret_string)],
            result.recovered      && ["Recovered", String(result.recovered)],
          ].filter(Boolean).map((pair) => {
            const [label, value] = pair as [string, string];
            return (
              <div key={label} className="flex flex-col">
                <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">{label}</span>
                <span className="text-lg font-bold font-mono text-[#111118] capitalize leading-tight">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Probability chart */}
      {chartData.length > 0 && (
        <div>
          <p className="text-[11px] text-[#a1a1aa] mb-2">Measurement probabilities</p>
          <div className="h-44 bg-[#f7f7f8] rounded-lg border border-[#e4e4e7] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 20 }}>
                <XAxis
                  dataKey="state"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e4e4e7",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => [`${v}%`, "Prob"]}
                />
                <Bar dataKey="prob" radius={[3, 3, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#4f46e5" : "#a5b4fc"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* QASM */}
      {result.circuit_qasm != null && (
        <details className="rounded-lg border border-[#e4e4e7] overflow-hidden">
          <summary className="px-4 py-2.5 text-xs font-medium text-[#52525b] cursor-pointer hover:bg-[#f7f7f8] transition-colors">
            Circuit (QASM)
          </summary>
          <pre className="px-4 py-3 text-[11px] font-mono text-[#52525b] bg-[#f7f7f8] overflow-x-auto border-t border-[#e4e4e7]">
            {String(result.circuit_qasm)}
          </pre>
        </details>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useInfraStore, type ProviderMeta, type BackendInfo, type JobRecord, type CapabilityLevel } from "@/store/infraStore";
import { useComposerStore } from "@/store/composerStore";
import { useAuthStore } from "@/store/authStore";
import { generateCode } from "@/lib/codegens";
import {
  Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Loader2, Play, StopCircle,
  Server, Cpu, AlertTriangle, Info, ArrowRight, ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ComposerResults from "@/components/composer/ComposerResults";

/* ── Provider display metadata (UI-only, not from backend) ────────────────── */
const PROVIDER_DISPLAY: Record<string, { color: string; desc: string; docsUrl: string; infrastructure: string; runtime: string }> = {
  local_aer: {
    color: "#16a34a",
    desc: "Local Qiskit Aer simulation. Always available, no credentials required.",
    docsUrl: "https://qiskit.github.io/qiskit-aer/",
    infrastructure: "Local process",
    runtime: "Qiskit Aer",
  },
  origin_quantum: {
    color: "#4f46e5",
    desc: "Origin Quantum Cloud — backed by Origin Pilot OS and QPanda3 Runtime.",
    docsUrl: "https://originqc.com",
    infrastructure: "Origin Pilot OS",
    runtime: "QPanda3 Runtime",
  },
};

/* ── Capability badge ────────────────────────────────────────────────────── */
function CapBadge({ level }: { level: CapabilityLevel }) {
  const cfg: Record<CapabilityLevel, { label: string; variant: "success" | "warning" | "error" | "default" | "blue" }> = {
    available:            { label: "Available",         variant: "success"  },
    unavailable:          { label: "Unavailable",       variant: "default"  },
    requires_auth:        { label: "Requires auth",     variant: "warning"  },
    requires_enterprise:  { label: "Enterprise only",   variant: "warning"  },
    not_in_public_api:    { label: "Not in public API", variant: "default"  },
    coming_later:         { label: "Coming later",      variant: "blue"     },
  };
  const { label, variant } = cfg[level] ?? { label: level, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

/* ── Job status pill ─────────────────────────────────────────────────────── */
function JobStatusBadge({ status }: { status: JobRecord["status"] }) {
  const cfg: Record<string, { variant: "success" | "warning" | "error" | "default" | "blue"; icon: React.ElementType }> = {
    submitted:  { variant: "blue",    icon: Clock       },
    queued:     { variant: "blue",    icon: Clock       },
    compiling:  { variant: "warning", icon: Loader2     },
    scheduled:  { variant: "warning", icon: Clock       },
    running:    { variant: "warning", icon: Loader2     },
    completed:  { variant: "success", icon: CheckCircle2},
    failed:     { variant: "error",   icon: XCircle     },
    cancelled:  { variant: "default", icon: StopCircle  },
    expired:    { variant: "default", icon: XCircle     },
  };
  const { variant, icon: Icon } = cfg[status] ?? { variant: "default", icon: Info };
  const isSpinning = ["compiling", "running"].includes(status);
  return (
    <Badge variant={variant}>
      <Icon size={10} className={isSpinning ? "animate-spin" : ""} />
      {status}
    </Badge>
  );
}

/* ── Backend type chip ────────────────────────────────────────────────────── */
function BackendTypeChip({ type }: { type: string }) {
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide"
      style={{
        background: type === "qpu" ? "#eff6ff" : "#f0fdf4",
        color:      type === "qpu" ? "#1d4ed8" : "#15803d",
        border: `1px solid ${type === "qpu" ? "#bfdbfe" : "#bbf7d0"}`,
      }}
    >
      {type === "qpu" ? "QPU" : "SIM"}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function InfrastructurePage() {
  const { user } = useAuthStore();
  const {
    providers, providerStatuses, connectionState, backends,
    selectedProviderId, selectedBackendId, jobs, activeJobId, shots,
    isLoadingProviders, isLoadingBackends, isSubmitting,
    loadProviders, connectProvider, loadBackends,
    selectProvider, selectBackend, setShots,
    loadJobs, submitJob, cancelJob, refreshJob, setActiveJob,
  } = useInfraStore();

  const { gates, numQubits, framework, setResult } = useComposerStore();
  const circuitQasm = generateCode("openqasm3", numQubits, gates);

  const [expandedCaps, setExpandedCaps] = useState(false);
  const [expandedBackend, setExpandedBackend] = useState<string | null>(null);

  /* Load providers + jobs on mount */
  useEffect(() => {
    loadProviders();
    if (user) loadJobs();
  }, [user]);

  /* Auto-connect local_aer on first visit */
  useEffect(() => {
    if (providers.length > 0 && !connectionState["local_aer"]) {
      connectProvider("local_aer");
    }
  }, [providers]);

  const selectedProvider   = providers.find((p) => p.id === selectedProviderId);
  const selectedStatus     = providerStatuses[selectedProviderId];
  const connState          = connectionState[selectedProviderId] ?? "idle";
  const providerBackends   = backends[selectedProviderId] ?? [];
  const selectedBackend    = providerBackends.find((b) => b.id === selectedBackendId);
  const displayMeta        = PROVIDER_DISPLAY[selectedProviderId];
  const activeJob          = jobs.find((j) => j.id === activeJobId) ?? null;

  const hasCircuit = gates.length > 0;

      const handleSubmit = async () => {
    if (!hasCircuit) { toast.error("Build a circuit in the Composer first"); return; }
    if (!selectedBackendId) { toast.error("Select a backend"); return; }
    try {
      const job = await submitJob(circuitQasm, numQubits);
      if (!job) { toast.error("Submit failed — no response"); return; }
      toast.success(`Job ${job.id} submitted`);
      if (job.status === "completed" && job.result) {
        setResult({ ...job.result, success: true } as Parameters<typeof setResult>[0]);
        toast.success("Results available in Composer");
      }
    } catch (err: unknown) {
      const e = err as { httpStatus?: number; detail?: string };
      if (e.httpStatus === 401) {
        toast.error("Sign in to submit jobs");
      } else if (e.httpStatus === 503) {
        toast.error(`Backend unavailable: ${e.detail ?? "check provider credentials"}`);
      } else if (e.httpStatus === 502) {
        toast.error(`Provider error: ${e.detail ?? "submission failed"}`);
      } else {
        toast.error(`Submit failed: ${e.detail ?? String(err)}`);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f8]">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e4e4e7]">
        <div className="max-w-screen-xl mx-auto px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-1.5">
                QUBIT · Cloud + Hardware Execution
              </p>
              <h1 className="text-2xl font-bold text-[#111118]">Quantum Infrastructure</h1>
              <p className="text-sm text-[#52525b] mt-1.5 max-w-2xl">
                Select a provider, discover backends, and submit circuits from the Composer to
                local simulation or real quantum hardware.
                Provider: <strong className="text-[#111118]">Origin Quantum Cloud</strong> ·
                Infrastructure: <strong className="text-[#111118]">Origin Pilot OS</strong> ·
                Runtime: <strong className="text-[#111118]">QPanda3 Runtime</strong>
              </p>
            </div>
            <Link href="/composer">
              <Button variant="outline" size="sm">
                Composer <ArrowRight size={11} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ══ LEFT COLUMN: Provider + Backends + Capabilities ══════════ */}
        <div className="xl:col-span-1 space-y-4">

          {/* Provider selector */}
          <section>
            <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-2">
              Provider
            </p>
            <div className="space-y-2">
              {isLoadingProviders ? (
                <div className="flex items-center gap-2 p-4 bg-white rounded-lg border border-[#e4e4e7] text-xs text-[#a1a1aa]">
                  <Loader2 size={13} className="animate-spin" /> Loading providers…
                </div>
              ) : providers.length === 0 ? (
                <div className="p-4 bg-white rounded-lg border border-[#e4e4e7] text-xs text-[#a1a1aa]">
                  Backend not reachable. Start uvicorn.
                </div>
              ) : (
                providers.map((p) => {
                  const cs      = connectionState[p.id] ?? "idle";
                  const ps      = providerStatuses[p.id];
                  const dm      = PROVIDER_DISPLAY[p.id];
                  const active  = p.id === selectedProviderId;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg border transition-all cursor-pointer"
                      style={{ borderColor: active ? "#4f46e5" : "#e4e4e7", boxShadow: active ? "0 0 0 1px #4f46e5" : "none" }}
                      onClick={() => selectProvider(p.id)}
                    >
                      <div className="flex items-start gap-3 p-3.5">
                        {/* Status dot */}
                        <div className="relative mt-0.5 shrink-0">
                          {cs === "connected" ? (
                            <>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
                              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping opacity-50" />
                            </>
                          ) : cs === "connecting" ? (
                            <Loader2 size={10} className="animate-spin text-[#d97706]" />
                          ) : cs === "error" ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#d4d4d8]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#111118]">{p.name}</p>
                          {dm && <p className="text-[11px] text-[#71717a] leading-relaxed mt-0.5">{dm.desc}</p>}
                          {ps?.error && (
                            <p className="text-[11px] text-[#dc2626] mt-1 flex items-start gap-1">
                              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                              {ps.error}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); connectProvider(p.id); }}
                          className="shrink-0 p-1 rounded text-[#a1a1aa] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                          title="Refresh connection"
                        >
                          <RefreshCw size={13} className={cs === "connecting" ? "animate-spin" : ""} />
                        </button>
                      </div>

                      {/* Connected details */}
                      {active && ps?.connected && (
                        <div className="px-3.5 pb-3 flex flex-wrap gap-3 border-t border-[#f0f0f2] pt-2.5">
                          {dm && (
                            <>
                              <div>
                                <p className="text-[10px] text-[#a1a1aa]">Infrastructure</p>
                                <p className="text-xs font-medium text-[#111118]">{dm.infrastructure}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#a1a1aa]">Runtime</p>
                                <p className="text-xs font-medium text-[#111118]">{dm.runtime}</p>
                              </div>
                            </>
                          )}
                          {ps.latency_ms !== null && (
                            <div>
                              <p className="text-[10px] text-[#a1a1aa]">Latency</p>
                              <p className="text-xs font-medium text-[#111118]">{ps.latency_ms}ms</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-[#a1a1aa]">Edition</p>
                            <p className="text-xs font-medium text-[#111118] capitalize">{ps.edition}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Backends */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest">
                Backends
              </p>
              <button
                onClick={() => loadBackends(selectedProviderId)}
                className="text-[11px] text-[#4f46e5] hover:underline flex items-center gap-1"
              >
                <RefreshCw size={10} className={isLoadingBackends ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
            <div className="space-y-1.5">
              {isLoadingBackends ? (
                <div className="p-3 bg-white rounded border border-[#e4e4e7] text-xs text-[#a1a1aa] flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" /> Discovering backends…
                </div>
              ) : providerBackends.length === 0 ? (
                <div className="p-3 bg-white rounded border border-[#e4e4e7] text-xs text-[#a1a1aa]">
                  {connState === "connected" || connState === "idle"
                    ? "No backends available."
                    : "Connect to provider to discover backends."}
                </div>
              ) : (
                providerBackends.map((b) => {
                  const sel = b.id === selectedBackendId;
                  const exp = expandedBackend === b.id;
                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-lg border overflow-hidden transition-all"
                      style={{ borderColor: sel ? "#4f46e5" : "#e4e4e7" }}
                    >
                      <div
                        className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-[#fafafa] transition-colors"
                        onClick={() => selectBackend(b.id)}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${b.status === "online" ? "bg-[#16a34a]" : b.status === "offline" ? "bg-[#dc2626]" : "bg-[#d4d4d8]"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#111118] truncate">{b.name}</span>
                            <BackendTypeChip type={b.backend_type} />
                          </div>
                          <p className="text-[10px] text-[#a1a1aa] mt-0.5">{b.max_qubits}q · {b.architecture}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedBackend(exp ? null : b.id); }}
                          className="shrink-0 text-[#a1a1aa] hover:text-[#52525b] p-0.5"
                        >
                          {exp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {exp && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden border-t border-[#f0f0f2]"
                          >
                            <div className="px-3.5 py-2.5 text-xs text-[#71717a] space-y-1">
                              <p>{b.description}</p>
                              {b.queue_depth !== null && (
                                <p className="text-[#52525b]">Queue: <strong>{b.queue_depth}</strong> jobs</p>
                              )}
                              {b.queue_depth === null && (
                                <p className="text-[#a1a1aa] italic">Queue depth: not exposed by provider API</p>
                              )}
                              {(b as { requires_permission?: string }).requires_permission && (
                                <p className="text-[#d97706] flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  Requires: {(b as { requires_permission?: string }).requires_permission}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Capabilities */}
          {selectedProvider && (
            <section>
              <button
                className="w-full flex items-center justify-between mb-2 text-left"
                onClick={() => setExpandedCaps(!expandedCaps)}
              >
                <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest">
                  Provider capabilities
                </p>
                {expandedCaps ? <ChevronUp size={12} className="text-[#a1a1aa]" /> : <ChevronDown size={12} className="text-[#a1a1aa]" />}
              </button>
              <AnimatePresence>
                {expandedCaps && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-lg border border-[#e4e4e7] overflow-hidden">
                      {Object.entries(selectedProvider.capabilities).map(([key, level], i, arr) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-3.5 py-2 ${i < arr.length - 1 ? "border-b border-[#f0f0f2]" : ""}`}
                        >
                          <span className="text-xs text-[#52525b]">
                            {key.replace(/_/g, " ")}
                          </span>
                          <CapBadge level={level as CapabilityLevel} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#a1a1aa] mt-1.5 leading-relaxed">
                      Capability states reflect what QUBIT can invoke through the provider's
                      public API — not all Origin Pilot capabilities are exposed externally.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>

        {/* ══ MIDDLE COLUMN: Execution + Jobs ══════════════════════════ */}
        <div className="xl:col-span-1 space-y-4">

          {/* Execution panel */}
          <section>
            <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-2">
              Execute circuit
            </p>
            <div className="bg-white rounded-lg border border-[#e4e4e7] p-4 space-y-4">

              {/* Circuit source */}
              <div>
                <p className="text-xs font-medium text-[#52525b] mb-1.5">Circuit source</p>
                <div className="flex items-center justify-between rounded border border-[#e4e4e7] px-3 py-2">
                  <div>
                    <p className="text-xs text-[#111118]">
                      {hasCircuit ? `${gates.length} gate${gates.length !== 1 ? "s" : ""} · ${numQubits} qubit${numQubits !== 1 ? "s" : ""}` : "No circuit"}
                    </p>
                    <p className="text-[10px] text-[#a1a1aa]">From Composer</p>
                  </div>
                  <Link href="/composer">
                    <Button variant="ghost" size="xs">Edit <ArrowRight size={10} /></Button>
                  </Link>
                </div>
                {!hasCircuit && (
                  <p className="text-[11px] text-[#d97706] mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={10} /> Build a circuit in the Composer first.
                  </p>
                )}
              </div>

              {/* Backend display */}
              <div>
                <p className="text-xs font-medium text-[#52525b] mb-1.5">Backend</p>
                {selectedBackend ? (
                  <div className="flex items-center gap-2 rounded border border-[#e4e4e7] px-3 py-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${selectedBackend.status === "online" ? "bg-[#16a34a]" : "bg-[#d4d4d8]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#111118] truncate">{selectedBackend.name}</p>
                      <p className="text-[10px] text-[#a1a1aa]">{selectedBackend.max_qubits}q · {selectedBackend.architecture}</p>
                    </div>
                    <BackendTypeChip type={selectedBackend.backend_type} />
                  </div>
                ) : (
                  <p className="text-xs text-[#a1a1aa] px-3 py-2 rounded border border-[#e4e4e7]">
                    Select a backend from the list
                  </p>
                )}
              </div>

              {/* Shots */}
              <div>
                <label className="block text-xs font-medium text-[#52525b] mb-1.5">
                  Shots
                </label>
                <input
                  type="number"
                  value={shots}
                  min={1}
                  max={8192}
                  onChange={(e) => setShots(parseInt(e.target.value) || 1024)}
                  className="w-full h-8 px-3 rounded border border-[#d4d4d8] text-sm font-mono text-[#111118] bg-white focus:outline-none focus:border-[#4f46e5]"
                />
              </div>

              {/* Submit */}
              {!user ? (
                <div className="text-xs text-[#71717a]">
                  <Link href="/auth/login" className="text-[#4f46e5] hover:underline">Sign in</Link> to submit jobs.
                </div>
              ) : (
                <Button
                  className="w-full justify-center"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!hasCircuit || !selectedBackendId}
                >
                  <Play size={13} />
                  {isSubmitting ? "Submitting…" : `Submit to ${selectedBackend?.name ?? "backend"}`}
                </Button>
              )}
            </div>
          </section>

          {/* Job center */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest">
                Job center
              </p>
              {user && (
                <button
                  onClick={loadJobs}
                  className="text-[11px] text-[#4f46e5] hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={10} /> Refresh
                </button>
              )}
            </div>

            {!user ? (
              <div className="bg-white rounded-lg border border-[#e4e4e7] p-4 text-xs text-[#a1a1aa]">
                <Link href="/auth/login" className="text-[#4f46e5] hover:underline">Sign in</Link> to view jobs.
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#e4e4e7] p-4 text-xs text-[#a1a1aa] flex items-center gap-2">
                <Server size={14} className="opacity-40" /> No jobs yet. Submit a circuit above.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#e4e4e7] overflow-hidden">
                {jobs.slice(0, 12).map((job, i) => (
                  <div
                    key={job.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#fafafa] transition-colors ${i < Math.min(jobs.length, 12) - 1 ? "border-b border-[#f0f0f2]" : ""} ${job.id === activeJobId ? "bg-[#f7f7ff]" : ""}`}
                    onClick={() => setActiveJob(job.id === activeJobId ? null : job.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-[#52525b] truncate">{job.id}</span>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <p className="text-[10px] text-[#a1a1aa]">
                        {job.backend_id} · {job.shots} shots · {job.num_qubits}q
                      </p>
                      <p className="text-[10px] text-[#a1a1aa]">
                        {new Date(job.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {["submitted", "queued", "running", "compiling"].includes(job.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); refreshJob(job.id).catch(() => toast.error("Refresh failed")); }}
                          className="p-1 rounded text-[#a1a1aa] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                          title="Refresh status"
                        >
                          <RefreshCw size={11} />
                        </button>
                      )}
                      {["submitted", "queued"].includes(job.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelJob(job.id).catch(() => toast.error("Cancel failed")); }}
                          className="p-1 rounded text-[#a1a1aa] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                          title="Cancel job"
                        >
                          <StopCircle size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ══ RIGHT COLUMN: Results ═════════════════════════════════════ */}
        <div className="xl:col-span-1 space-y-4">
          <section>
            <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-2">
              Result analysis
            </p>
            {activeJob?.result ? (
              <div>
                {/* Job metadata strip */}
                <div className="bg-white rounded-t-lg border border-b-0 border-[#e4e4e7] px-4 py-2.5 flex flex-wrap gap-4">
                  <div>
                    <p className="text-[10px] text-[#a1a1aa]">Job ID</p>
                    <p className="text-xs font-mono text-[#111118]">{activeJob.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#a1a1aa]">Provider</p>
                    <p className="text-xs text-[#111118]">{activeJob.provider_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#a1a1aa]">Backend</p>
                    <p className="text-xs text-[#111118]">{activeJob.backend_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#a1a1aa]">Shots</p>
                    <p className="text-xs font-mono text-[#111118]">{activeJob.shots}</p>
                  </div>
                </div>
                {/* Composer visualisations — reuse existing components */}
                <div
                  className="border border-[#e4e4e7] rounded-b-lg overflow-hidden"
                  style={{ height: 360 }}
                >
                  <ComposerResults />
                </div>
                <p className="text-[10px] text-[#a1a1aa] mt-1.5">
                  Uses the same visualisation system as the Composer —
                  probability histogram, 3D Bloch sphere, Q-sphere.
                </p>
              </div>
            ) : activeJob?.error ? (
              <div className="bg-white rounded-lg border border-[#e4e4e7] p-4">
                <div className="flex items-start gap-2 text-[#dc2626]">
                  <XCircle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold mb-1">Job failed</p>
                    <p className="text-xs text-[#71717a] leading-relaxed">{activeJob.error}</p>
                  </div>
                </div>
              </div>
            ) : activeJob && ["submitted","queued","compiling","running","scheduled"].includes(activeJob.status) ? (
              <div className="bg-white rounded-lg border border-[#e4e4e7] p-6 flex flex-col items-center gap-3">
                <Loader2 size={22} className="animate-spin text-[#4f46e5]" />
                <p className="text-sm font-medium text-[#111118]">
                  Job {activeJob.status}…
                </p>
                <p className="text-xs text-[#a1a1aa] text-center">
                  Click Refresh in the Job Center to poll for updates.
                  Local Aer jobs complete immediately.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#e4e4e7] p-6 flex flex-col items-center gap-3 text-center">
                <Cpu size={22} className="text-[#d4d4d8]" />
                <p className="text-sm text-[#a1a1aa]">No result selected</p>
                <p className="text-xs text-[#d4d4d8]">
                  Submit a job and click it in the Job Center to view results here.
                </p>
              </div>
            )}
          </section>

          {/* Origin Quantum attribution */}
          <section>
            <div className="bg-white rounded-lg border border-[#e4e4e7] p-4 space-y-2">
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest">
                Infrastructure layer
              </p>
              <div className="space-y-1.5 text-xs text-[#52525b]">
                {[
                  ["Provider",        "Origin Quantum (本源量子), Hefei, China"],
                  ["Cloud",           "Origin Quantum Cloud (QCloud)"],
                  ["OS",              "Origin Pilot — open-sourced Feb 2026"],
                  ["Runtime",         "QPanda3 Runtime (pyqpanda3)"],
                  ["SDK integration", "qBraid OriginProvider"],
                  ["Auth",            "ORIGIN_API_KEY (server-side only)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="text-[#a1a1aa] w-28 shrink-0">{k}</span>
                    <span className="text-[#111118]">{v}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://originqc.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#4f46e5] hover:underline mt-1"
              >
                originqc.com <ExternalLink size={10} />
              </a>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

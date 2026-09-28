"use client";
import { useEffect } from "react";
import { useInfraStore } from "@/store/infraStore";
import ResearchPage from "@/components/researcher/ResearchPage";
import { Wifi, WifiOff, RefreshCw, Server } from "lucide-react";
import Badge from "@/components/ui/Badge";

export default function ResearchInfrastructure() {
  const {
    providers, backends, providerStatuses, connectionState, isLoadingBackends,
    loadProviders, connectProvider, loadBackends,
    selectedProviderId, selectProvider, selectedBackendId, selectBackend,
  } = useInfraStore();

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (providers.length > 0 && !connectionState["local_aer"]) {
      connectProvider("local_aer");
    }
  }, [providers]);

  const C = { border:"#21262d", surface:"#161b22" };

  return (
    <ResearchPage title="Quantum Infrastructure" subtitle="Backend management and hardware access">
      <div className="flex flex-col gap-6 max-w-2xl">

        {/* Provider status */}
        <section>
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">Providers</p>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
            {providers.length === 0 ? (
              <div className="px-4 py-3 text-xs text-[#484f58]">Backend not reachable — start uvicorn</div>
            ) : providers.map((p, i) => {
              const cs = connectionState[p.id] ?? "idle";
              const ps = providerStatuses[p.id];
              return (
                <div key={p.id} className={`flex items-center gap-4 px-4 py-3 ${i < providers.length - 1 ? "border-b" : ""}`}
                  style={{ borderColor: C.border, background: selectedProviderId === p.id ? "#1f2937" : "transparent" }}
                  onClick={() => selectProvider(p.id)}
                >
                  {cs === "connected"
                    ? <Wifi size={13} className="text-[#4ff7a4] shrink-0" />
                    : cs === "connecting"
                    ? <RefreshCw size={13} className="animate-spin text-[#f7c94f] shrink-0" />
                    : <WifiOff size={13} className="text-[#484f58] shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#e6edf3]">{p.name}</p>
                    {ps?.error && <p className="text-[10px] text-[#f85149] mt-0.5 truncate">{ps.error}</p>}
                    {ps?.latency_ms !== null && ps?.latency_ms !== undefined && (
                      <p className="text-[10px] text-[#484f58]">{ps.latency_ms}ms</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cs === "connected"   ? <Badge variant="success">Connected</Badge>
                     : cs === "error"    ? <Badge variant="error">Error</Badge>
                     : cs === "connecting"? <Badge variant="warning">Connecting</Badge>
                     : <Badge>Idle</Badge>}
                    <button onClick={e => { e.stopPropagation(); connectProvider(p.id); }}
                      className="p-1 rounded text-[#484f58] hover:text-[#7d8590] hover:bg-[#21262d] transition-colors">
                      <RefreshCw size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Backends */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Backends</p>
            <button onClick={() => loadBackends(selectedProviderId)}
              className="flex items-center gap-1 text-[11px] text-[#484f58] hover:text-[#7d8590] transition-colors">
              <RefreshCw size={10} className={isLoadingBackends ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
            {(backends[selectedProviderId] ?? []).length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#484f58]">
                <Server size={12} /> Connect a provider to see backends
              </div>
            ) : (backends[selectedProviderId] ?? []).map((b, i, arr) => (
              <div key={b.id}
                className={`flex items-center gap-4 px-4 py-2.5 cursor-pointer transition-colors ${i < arr.length - 1 ? "border-b" : ""}`}
                style={{
                  borderColor: C.border,
                  background: selectedBackendId === b.id ? "#1f2937" : "transparent",
                }}
                onClick={() => selectBackend(b.id)}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${b.status === "online" ? "bg-[#4ff7a4]" : b.status === "offline" ? "bg-[#f85149]" : "bg-[#484f58]"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#e6edf3] truncate">{b.name}</p>
                  <p className="text-[10px] text-[#484f58]">{b.architecture} · {b.max_qubits || "?"} qubits</p>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    background: b.backend_type === "qpu" ? "#1d4ed812" : "#15803d12",
                    color:      b.backend_type === "qpu" ? "#60a5fa"   : "#4ade80",
                    border:     `1px solid ${b.backend_type === "qpu" ? "#1d4ed830" : "#15803d30"}`,
                    fontSize: 10,
                  }}>
                  {b.backend_type === "qpu" ? "QPU" : "Sim"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[11px] text-[#30363d]">
          Submit circuits from the Workbench. Results return to the Analysis panel.
        </p>
      </div>
    </ResearchPage>
  );
}
